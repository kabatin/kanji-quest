import { useEffect, type ReactNode } from 'react'
import iconBouken from '../../assets/art/icon-bouken.webp'
import iconChallenge from '../../assets/art/icon-challenge.webp'
import iconHanko from '../../assets/art/icon-hanko.webp'
import iconKisekae from '../../assets/art/icon-kisekae.webp'
import iconParts from '../../assets/art/icon-parts.webp'
import iconZukan from '../../assets/art/icon-zukan.webp'
import { CoinCount, LevelBadge, StreakCount } from '../../components/Hud'
import { KText } from '../../components/KText'
import { AREAS } from '../../data/areas'
import { KANJI } from '../../data/kanji'
import { PARTS } from '../../data/parts'
import { levelInfo, mascotStage, nextMascotLevel } from '../../lib/level'
import { stampCount } from '../../lib/rewards'
import { COLLECTIBLE_TOTAL, collectedCount, itemName, ownedDecos } from '../../lib/shop'
import { nextStep, type NextStep } from '../../lib/stages'
import { useFeedback } from '../../lib/useFeedback'
import type { Screen } from '../../nav'
import { useProfiles } from '../../store/profiles'
import { useProgress } from '../../store/progress'
import { ReviewCall } from './ReviewCall'
import { claimableParts } from '../../lib/partQuest'
import { useLearnedSet } from '../../lib/useKanjiText'
import { GrowPanel } from './GrowPanel'
import { IslandCanvas } from './IslandCanvas'
import { LevelUpModal } from './LevelUpModal'
import { LoginBonusModal } from './LoginBonusModal'
import { MissionPanel } from './MissionPanel'

type Props = { readonly onGo: (screen: Screen) => void }

/** すみまるの ひとこと。次にやることを、やさしく知らせる。 */
function mascotLine(learnedCount: number, level: number, next: NextStep): string {
  if (learnedCount === 0) return 'いっしょに かんじの {森|もり}を そだてよう！'
  if (next.kind === 'boss') return 'ボスが まってるよ。100てんで たおそう！'
  if (next.kind === 'exam') return 'いよいよ そつぎょうしけん だね！'
  const nextForm = nextMascotLevel(level)
  if (nextForm !== null && nextForm - level === 1) return 'もうすぐ ぼく、すがたが かわるよ！'
  return `かんじを ${learnedCount}{字|じ} おぼえたね！`
}

function continueTo(next: NextStep): Screen {
  if (next.kind === 'learn') return { name: 'learn', char: next.char, stageId: next.stage.id }
  if (next.kind === 'boss') return { name: 'stage', id: next.stage.id }
  if (next.kind === 'exam') return { name: 'map', area: next.areaIndex }
  return { name: 'map', area: 0 }
}

function areaOf(next: NextStep): number {
  if (next.kind === 'learn' || next.kind === 'boss') return next.stage.areaIndex
  return next.kind === 'exam' ? next.areaIndex : 0
}

type DockButtonProps = {
  readonly icon: string
  readonly label: string
  readonly count?: string
  readonly tone: 'play' | 'collect'
  /** 受け取れる ごほうび などが あるとき、右上に数を出す */
  readonly badge?: number
  readonly onClick: () => void
}

function DockButton({ icon, label, count, tone, badge = 0, onClick }: DockButtonProps) {
  return (
    <button type="button" className={`dock-btn dock-btn--${tone}`} onClick={onClick}>
      <img className="dock-btn__icon" src={icon} alt="" draggable={false} />
      <span className="dock-btn__label">{label}</span>
      {count && <small className="dock-btn__count">{count}</small>}
      {badge > 0 && (
        <span className="dock-btn__badge" aria-label={`ごほうび ${badge}こ`}>
          {badge}
        </span>
      )}
    </button>
  )
}

function DockGroup({ title, tone, children }: { readonly title: string; readonly tone: 'play' | 'collect'; readonly children: ReactNode }) {
  return (
    <section className={`dock__group dock__group--${tone}`} aria-label={title}>
      <h2 className="dock__title">{title}</h2>
      <div className="dock__buttons">{children}</div>
    </section>
  )
}

/** マイページ: 空にうかぶ しま と すみまる、つづきから、きょうのミッション、各画面への入り口。 */
export function Home({ onGo }: Props) {
  const learned = useProgress((s) => s.learned)
  const stamps = useProgress((s) => s.stamps)
  const clears = useProgress((s) => s.clears)
  const xp = useProgress((s) => s.xp)
  const owned = useProgress((s) => s.owned)
  const equipped = useProgress((s) => s.equipped)
  const checkIn = useProgress((s) => s.checkIn)
  const { play } = useFeedback()
  const learnedSet = useLearnedSet()
  const partClaims = useProgress((s) => s.partClaims)
  const partRewards = claimableParts(PARTS, KANJI, learnedSet, partClaims).length
  const playerName = useProfiles((s) => s.profiles.find((p) => p.id === s.activeId)?.name ?? '')

  useEffect(() => {
    checkIn()
  }, [checkIn])

  const { level } = levelInfo(xp)
  const stage = mascotStage(level)
  const next = nextStep(AREAS, learned, clears)
  const foundParts = PARTS.filter((part) => KANJI.some((k) => learned.includes(k.char) && k.parts.includes(part.id))).length
  const stampTotal = Object.values(stamps).reduce((sum, mask) => sum + stampCount(mask), 0)

  return (
    <div className="home">
      <IslandCanvas
        learnedCount={learned.length}
        totalKanji={KANJI.length}
        sky={itemName(equipped.bg)}
        mascotStage={stage}
        hat={itemName(equipped.hat)}
        decos={ownedDecos(owned)}
        onPoke={() => play('tap')}
      />
      <header className="home__hud">
        <button type="button" className="player-chip" onClick={() => onGo({ name: 'profiles' })} aria-label={`あそぶ ひと: ${playerName}。きりかえる`}>
          <span className="player-chip__name">{playerName}</span>
          <span className="player-chip__swap" aria-hidden="true">
            ⇄
          </span>
        </button>
        <LevelBadge />
        <StreakCount />
        <span className="bar__spacer" />
        <span className="hud-chip hud-chip--stamp" aria-label={`はんこ ${stampTotal}こ`}>
          <img className="hud-chip__art" src={iconHanko} alt="" draggable={false} />
          {stampTotal}
        </span>
        <CoinCount />
        <button type="button" className="btn btn--round" onClick={() => onGo({ name: 'settings' })} aria-label="せってい">
          ⚙
        </button>
      </header>

      <div className="home__body">
        <MissionPanel />
        <div className="home__center">
          <p className="home__bubble">
            <KText text={mascotLine(learned.length, level, next)} />
          </p>
          <ReviewCall onOpen={() => onGo({ name: 'review' })} />
        </div>
        <GrowPanel />
      </div>

      <nav className="dock" aria-label="メニュー">
        <DockGroup title="あそぶ" tone="play">
          <DockButton icon={iconBouken} label="ぼうけん" tone="play" onClick={() => onGo({ name: 'map', area: areaOf(next) })} />
          <DockButton icon={iconChallenge} label="チャレンジ" tone="play" onClick={() => onGo({ name: 'challenge' })} />
        </DockGroup>

        <button type="button" className="cta" onClick={() => onGo(continueTo(next))}>
          {next.kind === 'learn' && (
            <>
              <span className="cta__kanji">{next.char}</span>
              <span className="cta__text">
                <small>ステージ {next.stage.number}</small>
                <KText text="つづきから {学|まな}ぶ" />
              </span>
            </>
          )}
          {next.kind === 'boss' && (
            <span className="cta__text">
              <small>ステージ {next.stage.number}</small>
              ボスに ちょうせん
            </span>
          )}
          {next.kind === 'exam' && (
            <span className="cta__text">
              <small>{next.grade}ねんせい</small>
              そつぎょうしけんへ
            </span>
          )}
          {next.kind === 'done' && <span className="cta__text">ぼうけんを みる</span>}
          <span className="cta__go" aria-hidden="true">
            ▶
          </span>
        </button>

        <DockGroup title="あつめる" tone="collect">
          <DockButton icon={iconZukan} label="ずかん" count={`${learned.length} / ${KANJI.length}`} tone="collect" onClick={() => onGo({ name: 'zukan' })} />
          <DockButton icon={iconParts} label="パーツ" count={`${foundParts} / ${PARTS.length}`} badge={partRewards} tone="collect" onClick={() => onGo({ name: 'parts' })} />
          <DockButton icon={iconKisekae} label="きせかえ" count={`${collectedCount(owned)} / ${COLLECTIBLE_TOTAL}`} tone="collect" onClick={() => onGo({ name: 'shop' })} />
        </DockGroup>
      </nav>
      <LoginBonusModal />
      <LevelUpModal />
    </div>
  )
}
