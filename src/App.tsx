import { useEffect, useRef, useState } from 'react'
import { ALL_STAGES, AREAS } from './data/areas'
import { getKanji, KANJI } from './data/kanji'
import { BossScreen, type BossNext } from './features/boss/BossScreen'
import { Challenge } from './features/challenge/Challenge'
import { Home } from './features/home/Home'
import { ExtendPlay } from './features/limit/ExtendPlay'
import { LimitScreen } from './features/limit/LimitScreen'
import { SoonNotice } from './features/limit/SoonNotice'
import { useLimitGate } from './features/limit/useLimitGate'
import { Learn, type NextAction } from './features/learn/Learn'
import { MapScreen } from './features/map/MapScreen'
import { ParentGate } from './features/parent/ParentGate'
import { ParentScreen } from './features/parent/ParentScreen'
import { PartsScreen } from './features/parts/PartsScreen'
import { ProfilesScreen } from './features/profiles/ProfilesScreen'
import { ReviewScreen } from './features/review/ReviewScreen'
import { SettingsScreen } from './features/settings/SettingsScreen'
import { ShopScreen } from './features/shop/ShopScreen'
import { StageScreen } from './features/stage/StageScreen'
import { WeakScreen } from './features/weak/WeakScreen'
import { Zukan, type ZukanView } from './features/zukan/Zukan'
import { areaBoss, examBoss } from './lib/boss'
import { setMusic } from './lib/music'
import { countsAsPlay } from './lib/playGate'
import { itemName } from './lib/shop'
import { bossAfter, findBoss, findStage, isCleared, type AreaBoss, type Stage } from './lib/stages'
import { useStopVoiceOnLeave } from './lib/useFeedback'
import { reloadIfUpdated } from './lib/pwa'
import { HOME, trackFor, type Screen } from './nav'
import { useBossRules } from './store/parent'
import { useProfiles } from './store/profiles'
import { useProgress } from './store/progress'

const FIRST_PAGE: ZukanView = { grade: 1, scroll: 0 }
const PROFILES: Screen = { name: 'profiles' }

/** あそぶ人が2人以上いるときは、まず「だれが あそぶ？」を聞く。 */
const firstStack = (): readonly Screen[] => (useProfiles.getState().profiles.length > 1 ? [PROFILES] : [HOME])

/** 画面が見えている間、1分ごとに「あそんだ時間」を ふやす(保護者向けの画面で見る)。 */
export const PLAY_TICK_MS = 60_000

function usePlayTime(screenName: Screen['name']) {
  const current = useRef(screenName)
  useEffect(() => {
    current.current = screenName
  }, [screenName])
  useEffect(() => {
    const timer = setInterval(() => {
      // おうちの かた・せってい・だれが あそぶ の間は 数えない
      if (document.visibilityState === 'visible' && countsAsPlay(current.current)) useProgress.getState().addPlayMinute()
    }, PLAY_TICK_MS)
    return () => clearInterval(timer)
  }, [])
}

function useMusic(name: Screen['name']) {
  const enabled = useProgress((s) => s.settings.music)
  useEffect(() => {
    setMusic(enabled ? trackFor(name) : undefined)
  }, [enabled, name])
  useEffect(() => () => setMusic(undefined), [])
}

export default function App() {
  // 開いている画面の重なり。最後の要素が、いま見えている画面
  const [stack, setStack] = useState<readonly Screen[]>(firstStack)
  // ずかんで見ていた学年とページは、ほかの画面から戻ってきても覚えておく
  const [zukanView, setZukanView] = useState<ZukanView>(FIRST_PAGE)
  const skin = useProgress((s) => s.equipped.skin)
  const learned = useProgress((s) => s.learned)
  const clears = useProgress((s) => s.clears)
  const bossRules = useBossRules()
  const profileCount = useProfiles((s) => s.profiles.length)
  const screen = stack[stack.length - 1]
  usePlayTime(screen.name)
  const { soon, dismissSoon } = useLimitGate(stack, setStack)
  // 「もどる」などで画面をはなれたら、流れている音声をフェードアウトで止める
  useStopVoiceOnLeave(screen)
  useMusic(screen.name)
  // あそんでいる間に 新しい版が入っていたら、ホームに もどったときに 読みこみなおす
  useEffect(() => {
    if (screen.name === 'home') reloadIfUpdated()
  }, [screen.name])

  const go = (next: Screen) => setStack((prev) => [...prev, next])
  const back = () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
  const replace = (next: Screen) => setStack((prev) => [...prev.slice(0, -1), next])
  const goHome = () => setStack([HOME])
  const toMap = (area: number): readonly Screen[] => [HOME, { name: 'map', area }]
  const toStage = (stage: Stage): readonly Screen[] => [...toMap(stage.areaIndex), { name: 'stage', id: stage.id }]

  const toBoss = (boss: AreaBoss): readonly Screen[] => [...toMap(boss.areaIndex), { name: 'boss', id: boss.id }]

  /** ステージの5字を学びおえたあとの行き先。ボスが まっていれば ボス、いなければ 同じエリアの次のステージ。 */
  const nextAfterStage = (stage: Stage): NextAction => {
    const boss = bossAfter(stage, AREAS)
    if (boss && !isCleared(clears, boss.id)) return { label: 'ボスに ちょうせん', onNext: () => setStack(toBoss(boss)) }
    const nextStage = ALL_STAGES[stage.number]
    if (nextStage && nextStage.areaIndex === stage.areaIndex) return { label: 'つぎの ステージへ', onNext: () => setStack(toStage(nextStage)) }
    return { label: 'ぼうけんへ', onNext: () => setStack(toMap(stage.areaIndex)) }
  }

  /** 学びおえたあとに すすめる行き先。ステージの中なら、次の字へ。5字おわったら、ボスか 次のステージへ。 */
  const nextAfterLearn = (current: Extract<Screen, { name: 'learn' }>): NextAction => {
    if (!current.stageId) return { label: 'もどる', onNext: back }
    const stage = findStage(AREAS, current.stageId)
    const nextChar = stage.kanji.find((c) => c !== current.char && !learned.includes(c))
    if (nextChar) return { label: `つぎの かんじ「${nextChar}」へ`, onNext: () => replace({ name: 'learn', char: nextChar, stageId: stage.id }) }
    // この字で ステージの5字が そろった(はじめて覚えたときだけ、けっか の画面で おいわい する)
    return { ...nextAfterStage(stage), cleared: `ステージ ${stage.number} クリア！` }
  }

  /** ボス をたおしたあとの行き先。中ボスなら次のステージへ。ラスボスなら 同じ学年の次のエリアか、ぼうけん の地図へ。 */
  const nextAfterBoss = (boss: AreaBoss): BossNext => {
    const area = AREAS[boss.areaIndex]
    const nextStage = area.stages[boss.afterStage]
    if (nextStage) return { label: 'つぎの ステージへ', onNext: () => setStack(toStage(nextStage)) }
    const nextArea = AREAS[boss.areaIndex + 1]
    if (nextArea && nextArea.grade === boss.grade) return { label: 'つぎの エリアへ', onNext: () => setStack(toMap(nextArea.index)) }
    return { label: 'ぼうけんへ', onNext: () => setStack(toMap(boss.areaIndex)) }
  }

  const review = (char: string) => go({ name: 'learn', char })

  return (
    <div className="app" data-skin={itemName(skin)}>
      {screen.name === 'home' && <Home onGo={go} />}
      {screen.name === 'map' && (
        <MapScreen
          area={screen.area}
          onArea={(area) => replace({ name: 'map', area })}
          onStage={(id) => go({ name: 'stage', id })}
          onBoss={(id) => go({ name: 'boss', id })}
          onExam={(grade) => go({ name: 'exam', grade })}
          onBack={goHome}
        />
      )}
      {screen.name === 'stage' && (
        <StageScreen
          stageId={screen.id}
          onBack={() => setStack(toMap(findStage(AREAS, screen.id).areaIndex))}
          onLearn={(char) => go({ name: 'learn', char, stageId: screen.id })}
          next={nextAfterStage(findStage(AREAS, screen.id))}
        />
      )}
      {screen.name === 'boss' && (
        <BossScreen
          key={screen.id}
          boss={areaBoss(findBoss(AREAS, screen.id), AREAS[findBoss(AREAS, screen.id).areaIndex], bossRules)}
          onBack={back}
          next={nextAfterBoss(findBoss(AREAS, screen.id))}
          onReview={review}
          onWeak={() => go({ name: 'weak' })}
        />
      )}
      {screen.name === 'exam' && <BossScreen key={screen.grade} boss={examBoss(screen.grade, KANJI)} onBack={back} onReview={review} onWeak={() => go({ name: 'weak' })} />}
      {screen.name === 'learn' && (
        <Learn
          key={screen.char}
          kanji={getKanji(screen.char)}
          onBack={back}
          backLabel="もどる"
          onOpen={(char) => go({ name: 'learn', char })}
          next={nextAfterLearn(screen)}
        />
      )}
      {screen.name === 'challenge' && <Challenge onHome={goHome} />}
      {screen.name === 'zukan' && <Zukan view={zukanView} onView={setZukanView} onOpen={(char) => go({ name: 'learn', char })} onBack={goHome} />}
      {screen.name === 'parts' && <PartsScreen onBack={goHome} onOpen={(char) => go({ name: 'learn', char })} />}
      {screen.name === 'shop' && <ShopScreen onBack={back} />}
      {screen.name === 'settings' && <SettingsScreen onHome={goHome} onProfiles={() => go(PROFILES)} onParent={() => go({ name: 'parent-gate' })} />}
      {screen.name === 'review' && <ReviewScreen onHome={goHome} onOpen={review} />}
      {screen.name === 'weak' && <WeakScreen onBack={back} onOpen={review} />}
      {screen.name === 'parent-gate' && (
        <ParentGate onBack={back} onPass={() => replace({ name: stack[stack.length - 2]?.name === 'limit' ? 'extend' : 'parent' })} />
      )}
      {screen.name === 'extend' && <ExtendPlay onBack={back} onDone={goHome} />}
      {screen.name === 'limit' && <LimitScreen onParent={() => go({ name: 'parent-gate' })} onSwitch={profileCount > 1 ? () => go(PROFILES) : undefined} />}
      {screen.name === 'home' && soon !== null && <SoonNotice left={soon} onClose={dismissSoon} />}
      {screen.name === 'parent' && <ParentScreen onBack={back} onOpen={review} />}
      {screen.name === 'profiles' && <ProfilesScreen onDone={goHome} canGoBack={stack.length > 1} />}
    </div>
  )
}
