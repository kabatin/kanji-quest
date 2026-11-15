import './intro.css'
import { MascotSays } from '../../components/MascotSays'
import { learnTip, type IntroTip } from '../../lib/intro'
import { prefersReducedMotion } from '../../lib/motion'
import { useProgress } from '../../store/progress'

const LINES: Partial<Record<IntroTip, string>> = {
  story: 'おはなしを みよう',
  kumi: 'ぶひんを くみあわせよう',
  kaku: 'ゆびで かいてみよう',
}

/** 学ぶ画面の 入り口で、すみまるが「何をするか」を ひとこと。タップで 消える。あそびの じゃまにならないよう、上のはしに出す。 */
export function IntroLearnTip({ step }: { readonly step: string }) {
  const intro = useProgress((s) => s.intro)
  const learnedCount = useProgress((s) => s.learned.length)
  const markIntroSeen = useProgress((s) => s.markIntroSeen)
  const skipIntro = useProgress((s) => s.skipIntro)
  const tip = learnTip(step, learnedCount, intro)
  const line = tip ? LINES[tip] : undefined
  if (!tip || !line) return null
  return (
    <div className={`intro-tip ${prefersReducedMotion() ? 'is-still' : ''}`} data-intro-tip={tip}>
      <button type="button" className="intro-tip__body" onClick={() => markIntroSeen(tip)} aria-label={`${line}(タップで けす)`}>
        <MascotSays text={line} />
      </button>
      <button type="button" className="btn intro-skip intro-skip--small" onClick={skipIntro}>
        あんないを とばす
      </button>
    </div>
  )
}
