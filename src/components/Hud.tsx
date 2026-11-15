import { levelInfo } from '../lib/level'
import { MiniIcon } from './MiniIcon'
import { useProgress } from '../store/progress'

/** コインの数。どの画面でも同じ見た目で出す。 */
export function CoinCount() {
  const coins = useProgress((s) => s.coins)
  return (
    <span className="hud-chip hud-chip--coin" aria-label={`コイン ${coins}まい`}>
      <span className="coin" aria-hidden="true" />
      {coins}
    </span>
  )
}

/**
 * あそぶ人の ふだ: レベル・名前・次のレベルまでの ゲージと けいけんち。
 * おすと、あそぶ人を きりかえる画面へ。
 */
export function PlayerCard({ name, onSwitch }: { readonly name: string; readonly onSwitch: () => void }) {
  const xp = useProgress((s) => s.xp)
  const { level, into, need } = levelInfo(xp)
  return (
    <button type="button" className="player-card" onClick={onSwitch} aria-label={`あそぶ ひと: ${name}。きりかえる`}>
      <span className="level-badge__num" aria-label={`レベル ${level}`}>
        <small>レベル</small>
        <span className="level-badge__digits">{level}</span>
      </span>
      <span className="player-card__body">
        <span className="player-card__top">
          <span className="player-card__name">{name}</span>
          <span className="player-card__swap" aria-hidden="true">
            ⇄
          </span>
        </span>
        <span className="level-badge__bar" role="progressbar" aria-valuemin={0} aria-valuemax={need} aria-valuenow={into}>
          <span style={{ width: `${(into / need) * 100}%` }} />
        </span>
        <span className="player-card__xp">
          けいけんち {into} / {need}
        </span>
      </span>
    </button>
  )
}

/** れんぞくで開いた日数。 */
export function StreakCount() {
  const count = useProgress((s) => s.streak.count)
  return (
    <span className="hud-chip hud-chip--streak" aria-label={`れんぞく ${count}にち`}>
      <MiniIcon name="honoo" className="hud-chip__icon" />
      {count}にち
    </span>
  )
}

type BarProps = { readonly onBack: () => void; readonly backLabel?: string; readonly title?: string; readonly children?: React.ReactNode }

/** ホーム以外の画面の上の帯: もどるボタン + 題 + コイン。 */
export function TopBar({ onBack, backLabel = 'もどる', title, children }: BarProps) {
  return (
    <header className="bar">
      <button type="button" className="btn btn--back" onClick={onBack}>
        ← {backLabel}
      </button>
      {title && <h1 className="bar__title">{title}</h1>}
      {children}
      <span className="bar__spacer" />
      <CoinCount />
    </header>
  )
}
