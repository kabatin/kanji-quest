import { useCallback, useEffect, useState, type ReactNode } from 'react'
import iconBouken from '../../assets/art/icon-bouken.webp'
import iconChallenge from '../../assets/art/icon-challenge.webp'
import iconHanko from '../../assets/art/icon-hanko.webp'
import iconKisekae from '../../assets/art/icon-kisekae.webp'
import iconParts from '../../assets/art/icon-parts.webp'
import iconZukan from '../../assets/art/icon-zukan.webp'
import { DecoIcon } from '../../components/DecoIcon'
import { CoinCount, PlayerCard, StreakCount } from '../../components/Hud'
import { KText } from '../../components/KText'
import { AREAS } from '../../data/areas'
import { KANJI } from '../../data/kanji'
import { PARTS } from '../../data/parts'
import { dayKey } from '../../lib/date'
import { SPOT_LABEL } from '../../lib/boss'
import { isChallengeDone, MIN_LEARNED_FOR_CHALLENGE } from '../../lib/dailyChallenge'
import { levelInfo, mascotStage, nextMascotLevel } from '../../lib/level'
import { stampCount } from '../../lib/rewards'
import { COLLECTIBLE_TOTAL, collectedCount, findItem, itemName, ownedDecos } from '../../lib/shop'
import { nextStep, type NextStep } from '../../lib/stages'
import { useFeedback } from '../../lib/useFeedback'
import type { Screen } from '../../nav'
import { useProfiles } from '../../store/profiles'
import { useProgress } from '../../store/progress'
import { ReviewCall } from './ReviewCall'
import { WeakCall } from './WeakCall'
import { claimableParts } from '../../lib/partQuest'
import { useLearnedSet } from '../../lib/useKanjiText'
import { GrowPanel } from './GrowPanel'
import { IslandCanvas } from './IslandCanvas'
import { LevelUpModal } from './LevelUpModal'
import { BigScreenHint } from './BigScreenGuide'
import { LoginBonusModal } from './LoginBonusModal'
import { MissionPanel } from './MissionPanel'
import { FIXED_DECOS, isMovableDeco } from './scene/layout'
import { POKE_LINE_MS, POKE_LINES } from './pokeLines'

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

/** つついた回数と、ひとこと を出しているか。少したつと、もとの ひとこと にもどる。 */
function usePokeLine(): { readonly line: string | undefined; readonly count: number; readonly poke: () => void } {
  const [state, setState] = useState({ count: 0, showing: false })
  useEffect(() => {
    if (!state.showing) return
    const timer = setTimeout(() => setState((prev) => ({ ...prev, showing: false })), POKE_LINE_MS)
    return () => clearTimeout(timer)
  }, [state])
  return {
    line: state.showing ? POKE_LINES[(state.count - 1) % POKE_LINES.length] : undefined,
    count: state.count,
    poke: () => setState((prev) => ({ count: prev.count + 1, showing: true })),
  }
}

function continueTo(next: NextStep): Screen {
  if (next.kind === 'learn') return { name: 'learn', char: next.char, stageId: next.stage.id }
  if (next.kind === 'boss') return { name: 'boss', id: next.boss.id }
  if (next.kind === 'exam') return { name: 'map', area: next.areaIndex }
  return { name: 'map', area: 0 }
}

function areaOf(next: NextStep): number {
  if (next.kind === 'learn') return next.stage.areaIndex
  if (next.kind === 'boss') return next.boss.areaIndex
  return next.kind === 'exam' ? next.areaIndex : 0
}

type DockButtonProps = {
  readonly icon: string
  readonly label: string
  readonly count?: string
  readonly tone: 'play' | 'collect'
  /** 受け取れる ごほうび などが あるとき、右上に数を出す */
  readonly badge?: number
  /** 右上の数が 何の数か(読み上げ用)。省くと「ごほうび」 */
  readonly badgeLabel?: string
  /** todo = まだ やっていない(目に入る印)/ done = できた */
  readonly mark?: 'todo' | 'done'
  readonly onClick: () => void
}

function DockButton({ icon, label, count, tone, badge = 0, badgeLabel = 'ごほうび', mark, onClick }: DockButtonProps) {
  return (
    <button type="button" className={`dock-btn dock-btn--${tone} ${mark ? `dock-btn--${mark}` : ''}`} onClick={onClick}>
      <img className="dock-btn__icon" src={icon} alt="" draggable={false} />
      <span className="dock-btn__label">{label}</span>
      {count && <small className="dock-btn__count">{count}</small>}
      {mark === 'todo' && (
        <span className="dock-btn__badge" aria-label="まだ やっていないよ">
          !
        </span>
      )}
      {mark === 'done' && (
        <span className="dock-btn__done" aria-label="できた">
          ✓ できた
        </span>
      )}
      {badge > 0 && (
        <span className="dock-btn__badge" aria-label={`${badgeLabel} ${badge}こ`}>
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

/** buy = まだ うごかせる かざり を持っていない / no3d = この端末では しま を 3D で出せない */
type EditGuideKind = 'buy' | 'no3d'

type EditGuideProps = { readonly kind: EditGuideKind; readonly onClose: () => void; readonly onShop: () => void }

/** もようがえ が まだ できないときの 案内。 */
function EditGuide({ kind, onClose, onShop }: EditGuideProps) {
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="もようがえ">
      <div className="modal__panel edit-guide">
        <p className="edit-guide__art" aria-hidden="true">
          {kind === 'buy' ? '🌷🪑🍄' : '🏝️'}
        </p>
        <h2>もようがえ</h2>
        {kind === 'buy' ? (
          <>
            <p className="modal__lead">
              <KText text="しまの かざりを、ゆびで ひっぱって すきな ところに おけるよ" />
            </p>
            <p className="edit-guide__how">
              <KText text="まずは「きせかえ」の「かざり」で、かざりを {買|か}おう" />
            </p>
            <button type="button" className="btn btn--primary btn--big" onClick={onShop}>
              きせかえへ
            </button>
          </>
        ) : (
          <p className="modal__lead">ごめんね。この たんまつでは、かざりを うごかせないよ</p>
        )}
        <button type="button" className="btn" onClick={onClose}>
          とじる
        </button>
      </div>
    </div>
  )
}

/** マイページ: 空にうかぶ しま と すみまる、つづきから、きょうのミッション、各画面への入り口。 */
export function Home({ onGo }: Props) {
  const learned = useProgress((s) => s.learned)
  // ログインボーナスの まどが 出ている間は、ほかの あんない を 重ねない
  const bonusWaiting = useProgress((s) => s.loginBonus !== null && s.loginBonus !== undefined && !s.loginBonus.claimed)
  const stamps = useProgress((s) => s.stamps)
  const clears = useProgress((s) => s.clears)
  const xp = useProgress((s) => s.xp)
  const owned = useProgress((s) => s.owned)
  const equipped = useProgress((s) => s.equipped)
  const decoSpots = useProgress((s) => s.decoSpots)
  const zukanSeen = useProgress((s) => s.zukanSeen)
  const placeDeco = useProgress((s) => s.placeDeco)
  const decoTurns = useProgress((s) => s.decoTurns)
  const decoStored = useProgress((s) => s.decoStored)
  const turnDeco = useProgress((s) => s.turnDeco)
  const storeDeco = useProgress((s) => s.storeDeco)
  /** もようがえ で えらんでいる かざり(さいごに つかんだもの) */
  const [picked, setPicked] = useState<string | null>(null)
  const checkIn = useProgress((s) => s.checkIn)
  const challengeDay = useProgress((s) => s.challengeDay)
  // もようがえ: しまの かざり を指で うごかす。3D の しま が出ていて、うごかせる かざり を持っているときだけ できる。
  // できないときも ボタンは出しておき、押したら「どうすれば できるか」を知らせる
  const [editing, setEditing] = useState(false)
  const [editGuide, setEditGuide] = useState<EditGuideKind | null>(null)
  const [islandReady, setIslandReady] = useState(false)
  const handleReady = useCallback((ready: boolean) => setIslandReady(ready), [])
  const { play } = useFeedback()
  const pokeLine = usePokeLine()
  const learnedSet = useLearnedSet()
  const partClaims = useProgress((s) => s.partClaims)
  const partRewards = claimableParts(PARTS, KANJI, learnedSet, partClaims).length
  const playerName = useProfiles((s) => s.profiles.find((p) => p.id === s.activeId)?.name ?? '')

  useEffect(() => {
    checkIn()
  }, [checkIn])

  const challengeMark = learned.length < MIN_LEARNED_FOR_CHALLENGE ? undefined : isChallengeDone(challengeDay, dayKey()) ? 'done' : 'todo'
  const { level } = levelInfo(xp)
  const stage = mascotStage(level)
  const next = nextStep(AREAS, learned, clears)
  const foundParts = PARTS.filter((part) => KANJI.some((k) => learned.includes(k.char) && k.parts.includes(part.id))).length
  const stampTotal = Object.values(stamps).reduce((sum, mask) => sum + stampCount(mask), 0)
  const ownedDecoNames = ownedDecos(owned)
  // しまってある かざり は、しまには出さない
  const decos = ownedDecoNames.filter((name) => !decoStored.includes(name))
  const stored = ownedDecoNames.filter((name) => decoStored.includes(name))
  const hasMovable = ownedDecoNames.some(isMovableDeco)
  // うごかせない かざり(にじ)で、いま 出ているもの。もようがえ で しまえる
  const fixedShown = decos.filter((name) => FIXED_DECOS.includes(name))
  const pickedItem = picked ? findItem(`deco:${picked}`) : undefined
  const startEditing = () => {
    play('tap')
    if (!hasMovable) setEditGuide('buy')
    else if (!islandReady) setEditGuide('no3d')
    else setEditing(true)
  }

  return (
    <div className={`home ${editing ? 'is-editing' : ''}`}>
      <IslandCanvas
        learnedCount={learned.length}
        totalKanji={KANJI.length}
        sky={itemName(equipped.bg)}
        mascotStage={stage}
        hat={itemName(equipped.hat)}
        decos={decos}
        decoSpots={decoSpots}
        decoTurns={decoTurns}
        editing={editing}
        selected={picked}
        onReady={handleReady}
        onGrab={(name) => {
          play('pop')
          setPicked(name)
        }}
        onPlace={(drop) => {
          placeDeco(drop.name, drop.spot)
          play('tap')
        }}
        onPoke={() => {
          play('pop')
          pokeLine.poke()
        }}
      />
      {editing && (
        <div className="edit-bar" role="region" aria-label="もようがえ">
          {fixedShown.length > 0 && (
            <ul className="edit-bar__tray edit-bar__tray--fixed" aria-label="うごかせない かざり">
              {fixedShown.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    className="btn edit-bar__stored"
                    aria-label={`${findItem(`deco:${name}`)?.label ?? name} を しまう`}
                    onClick={() => {
                      storeDeco(name, true)
                      play('tap')
                    }}
                  >
                    <DecoIcon name={name} />
                    <small>しまう</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {stored.length > 0 && (
            <ul className="edit-bar__tray" aria-label="しまってある かざり">
              {stored.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    className="btn edit-bar__stored"
                    aria-label={`${findItem(`deco:${name}`)?.label ?? name} を だす`}
                    onClick={() => {
                      storeDeco(name, false)
                      setPicked(isMovableDeco(name) ? name : null)
                      play('pop')
                    }}
                  >
                    <DecoIcon name={name} />
                    <small>だす</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="edit-bar__main">
            {picked && pickedItem && decos.includes(picked) ? (
              <>
                <p className="edit-bar__picked">
                  <DecoIcon name={picked} /> {pickedItem.label}
                </p>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    turnDeco(picked)
                    play('tap')
                  }}
                >
                  ↻ まわす
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    storeDeco(picked, true)
                    setPicked(null)
                    play('tap')
                  }}
                >
                  📦 しまう
                </button>
              </>
            ) : (
              <p className="edit-bar__lead">
                <KText text="かざりを ひっぱって うごかそう" />
              </p>
            )}
            <button
              type="button"
              className="btn btn--primary btn--big"
              onClick={() => {
                play('ok')
                setPicked(null)
                setEditing(false)
              }}
            >
              できた！
            </button>
          </div>
        </div>
      )}
      <header className="home__hud">
        <PlayerCard name={playerName} onSwitch={() => onGo({ name: 'profiles' })} />
        <span className="bar__spacer" />
        <StreakCount />
        <span className="hud-chip hud-chip--stamp" aria-label={`はんこ ${stampTotal}こ`}>
          <img className="hud-chip__art" src={iconHanko} alt="" draggable={false} />
          {stampTotal}
        </span>
        <CoinCount />
        <button type="button" className="btn btn--round hud-edit" onClick={startEditing} aria-label="もようがえ">
          <span aria-hidden="true">🪴</span>
        </button>
        <button type="button" className="btn btn--round" onClick={() => onGo({ name: 'settings' })} aria-label="せってい">
          ⚙
        </button>
      </header>

      <div className="home__body">
        <MissionPanel />
        <div className="home__center">
          {/* つついたときは、ひとこと が ぽんと出なおす(key を変えて、出てくる動きを もう一度見せる) */}
          <p key={pokeLine.line ? pokeLine.count : 0} data-intro="sentence" className={`home__bubble ${pokeLine.line ? 'is-poked' : ''}`} aria-live="polite">
            <KText text={pokeLine.line ?? mascotLine(learned.length, level, next)} />
          </p>
          <div className="home__calls">
            <ReviewCall onOpen={() => onGo({ name: 'review' })} />
            <WeakCall onOpen={() => onGo({ name: 'weak' })} />
          </div>
        </div>
        <GrowPanel />
      </div>

      <nav className="dock" aria-label="メニュー">
        <DockGroup title="あそぶ" tone="play">
          <DockButton icon={iconBouken} label="ぼうけん" tone="play" onClick={() => onGo({ name: 'map', area: areaOf(next) })} />
          <DockButton icon={iconChallenge} label={'きょうの\nチャレンジ'} tone="play" mark={challengeMark} onClick={() => onGo({ name: 'challenge' })} />
        </DockGroup>

        <button type="button" className="cta" data-intro="next" onClick={() => onGo(continueTo(next))}>
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
              <small>
                {AREAS[next.boss.areaIndex].name}の {SPOT_LABEL[next.boss.spot]}
              </small>
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
          <DockButton
            icon={iconZukan}
            label="ずかん"
            count={`${learned.length} / ${KANJI.length}`}
            badge={Math.max(learned.length - zukanSeen, 0)}
            badgeLabel="あたらしい かんじ"
            tone="collect"
            onClick={() => onGo({ name: 'zukan' })} />
          <DockButton icon={iconParts} label="パーツ" count={`${foundParts} / ${PARTS.length}`} badge={partRewards} tone="collect" onClick={() => onGo({ name: 'parts' })} />
          <DockButton icon={iconKisekae} label="きせかえ" count={`${collectedCount(owned)} / ${COLLECTIBLE_TOTAL}`} tone="collect" onClick={() => onGo({ name: 'shop' })} />
        </DockGroup>
      </nav>
      {editGuide && (
        <EditGuide
          kind={editGuide}
          onClose={() => setEditGuide(null)}
          onShop={() => {
            setEditGuide(null)
            onGo({ name: 'shop' })
          }}
        />
      )}
      <LoginBonusModal />
      <BigScreenHint hold={bonusWaiting} />
      <LevelUpModal />
    </div>
  )
}
