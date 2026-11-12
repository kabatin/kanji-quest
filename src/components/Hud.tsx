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

/** レベルと、次のレベルまでのゲージ。 */
export function LevelBadge() {
  const xp = useProgress((s) => s.xp)
  const { level, into, need } = levelInfo(xp)
  return (
    <span className="level-badge" aria-label={`レベル ${level}`}>
      <span className="level-badge__num">
        <small>レベル</small>
        <span className="level-badge__digits">{level}</span>
      </span>
      <span className="level-badge__bar" role="progressbar" aria-valuemin={0} aria-valuemax={need} aria-valuenow={into}>
        <span style={{ width: `${(into / need) * 100}%` }} />
      </span>
    </span>
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
