import { useState } from 'react'
import { ALL_STAGES, AREAS } from './data/areas'
import { getKanji, KANJI } from './data/kanji'
import { BossScreen, type BossNext } from './features/boss/BossScreen'
import { Challenge } from './features/challenge/Challenge'
import { Home } from './features/home/Home'
import { Learn, type NextAction } from './features/learn/Learn'
import { MapScreen } from './features/map/MapScreen'
import { PartsScreen } from './features/parts/PartsScreen'
import { SettingsScreen } from './features/settings/SettingsScreen'
import { ShopScreen } from './features/shop/ShopScreen'
import { StageScreen } from './features/stage/StageScreen'
import { Zukan, type ZukanView } from './features/zukan/Zukan'
import { examBoss, stageBoss } from './lib/boss'
import { itemName } from './lib/shop'
import { findStage, type Stage } from './lib/stages'
import { useStopVoiceOnLeave } from './lib/useFeedback'
import { HOME, type Screen } from './nav'
import { useProgress } from './store/progress'

const FIRST_PAGE: ZukanView = { grade: 1, page: 0 }

export default function App() {
  // 開いている画面の重なり。最後の要素が、いま見えている画面
  const [stack, setStack] = useState<readonly Screen[]>([HOME])
  // ずかんで見ていた学年とページは、ほかの画面から戻ってきても覚えておく
  const [zukanView, setZukanView] = useState<ZukanView>(FIRST_PAGE)
  const skin = useProgress((s) => s.equipped.skin)
  const learned = useProgress((s) => s.learned)

  const screen = stack[stack.length - 1]
  // 「もどる」などで画面をはなれたら、流れている音声をフェードアウトで止める
  useStopVoiceOnLeave(screen)

  const go = (next: Screen) => setStack((prev) => [...prev, next])
  const back = () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
  const replace = (next: Screen) => setStack((prev) => [...prev.slice(0, -1), next])
  const goHome = () => setStack([HOME])
  const toMap = (area: number): readonly Screen[] => [HOME, { name: 'map', area }]
  const toStage = (stage: Stage): readonly Screen[] => [...toMap(stage.areaIndex), { name: 'stage', id: stage.id }]

  /** 学びおえたあとに すすめる行き先。ステージの中なら、次の字か ボス へ。 */
  const nextAfterLearn = (current: Extract<Screen, { name: 'learn' }>): NextAction => {
    if (!current.stageId) return { label: 'もどる', onNext: back }
    const stage = findStage(AREAS, current.stageId)
    const nextChar = stage.kanji.find((c) => c !== current.char && !learned.includes(c))
    if (nextChar) return { label: `つぎの かんじ「${nextChar}」へ`, onNext: () => replace({ name: 'learn', char: nextChar, stageId: stage.id }) }
    return { label: 'ボスに ちょうせん', onNext: () => setStack([...toStage(stage), { name: 'boss', id: stage.id }]) }
  }

  /** ステージの ボス をたおしたあとの行き先。同じ学年に次のステージがあればそこへ、なければ ぼうけん の地図へ。 */
  const nextAfterBoss = (stage: Stage): BossNext => {
    const nextStage = ALL_STAGES[stage.number]
    if (nextStage && nextStage.grade === stage.grade) return { label: 'つぎの ステージへ', onNext: () => setStack(toStage(nextStage)) }
    return { label: 'ぼうけんへ', onNext: () => setStack(toMap(stage.areaIndex)) }
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
          onExam={(grade) => go({ name: 'exam', grade })}
          onBack={goHome}
        />
      )}
      {screen.name === 'stage' && (
        <StageScreen
          stageId={screen.id}
          onBack={() => setStack(toMap(findStage(AREAS, screen.id).areaIndex))}
          onLearn={(char) => go({ name: 'learn', char, stageId: screen.id })}
          onBoss={() => go({ name: 'boss', id: screen.id })}
        />
      )}
      {screen.name === 'boss' && (
        <BossScreen
          key={screen.id}
          boss={stageBoss(findStage(AREAS, screen.id))}
          onBack={back}
          next={nextAfterBoss(findStage(AREAS, screen.id))}
          onReview={review}
        />
      )}
      {screen.name === 'exam' && <BossScreen key={screen.grade} boss={examBoss(screen.grade, KANJI)} onBack={back} onReview={review} />}
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
      {screen.name === 'settings' && <SettingsScreen onHome={goHome} />}
    </div>
  )
}
