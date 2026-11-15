import './intro.css'
import { MascotSays } from '../../components/MascotSays'
import type { Handed } from '../../lib/handed'
import { prefersReducedMotion } from '../../lib/motion'

type Props = {
  /** ききてを えらんだ(つぎは さいしょの1字を まなぶ) */
  readonly onPick: (handed: Handed) => void
  /** あんないを とばして ホームへ */
  readonly onSkip: () => void
}

const CHOICES: readonly { readonly handed: Handed; readonly label: string; readonly hint: string }[] = [
  { handed: 'right', label: 'みぎて', hint: '🤚' },
  { handed: 'left', label: 'ひだりて', hint: '✋' },
]

/** はじめて あそぶ子の さいしょの画面。すみまるの あいさつと、どっちの手で かくか。 */
export function IntroWelcome({ onPick, onSkip }: Props) {
  return (
    <main className={`screen intro-welcome ${prefersReducedMotion() ? 'is-still' : ''}`} aria-label="はじめまして">
      <MascotSays text="はじめまして！ ぼくは すみまる。いっしょに かんじを おぼえよう！" />
      <h1 className="intro-welcome__ask">どっちの てで かく？</h1>
      <div className="intro-welcome__choices">
        {CHOICES.map((choice) => (
          <button key={choice.handed} type="button" className="btn btn--primary btn--big intro-welcome__choice" onClick={() => onPick(choice.handed)}>
            <span className="intro-welcome__hand" aria-hidden="true">
              {choice.hint}
            </span>
            {choice.label}
          </button>
        ))}
      </div>
      <p className="intro-welcome__note">あとで「せってい」で かえられるよ</p>
      <button type="button" className="btn intro-skip" onClick={onSkip}>
        あんないを とばす
      </button>
    </main>
  )
}
