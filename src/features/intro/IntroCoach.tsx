import './intro.css'
import { useEffect, useState, type CSSProperties } from 'react'
import { KText } from '../../components/KText'
import { Mascot } from '../../components/Mascot'
import { getKanji } from '../../data/kanji'
import { levelInfo, mascotStage } from '../../lib/level'
import { homeTip, type IntroTip } from '../../lib/intro'
import { prefersReducedMotion } from '../../lib/motion'
import { itemName } from '../../lib/shop'
import { useProgress } from '../../store/progress'

type Rect = { readonly top: number; readonly left: number; readonly width: number; readonly height: number }

const TARGETS: Partial<Record<IntroTip, string>> = {
  forest: '.grow',
  kanji: "[data-intro='sentence']",
  next: "[data-intro='next']",
}

const CARD_WIDTH = 360
const GAP = 14
const EDGE = 12

/** ホームの 目印(data-intro など)の いまの場所。見つからなければ null。 */
function findRect(tip: IntroTip): Rect | null {
  const selector = TARGETS[tip]
  const el = selector ? document.querySelector(selector) : null
  if (!el) return null
  const { top, left, width, height } = el.getBoundingClientRect()
  return width > 0 && height > 0 ? { top, left, width, height } : null
}

function useTargetRect(tip: IntroTip): Rect | null {
  const [rect, setRect] = useState<Rect | null>(() => findRect(tip))
  useEffect(() => {
    const update = () => setRect(findRect(tip))
    update()
    window.addEventListener('resize', update)
    // 画面が出そろうまでに、場所が動くことがある
    const timer = setInterval(update, 500)
    return () => {
      window.removeEventListener('resize', update)
      clearInterval(timer)
    }
  }, [tip])
  return rect
}

/** 吹き出しの位置: 指す場所の上か下(広いほう)。見つからなければ 画面の下。 */
function cardStyle(rect: Rect | null): CSSProperties {
  if (!rect) return { left: '50%', bottom: 120, transform: 'translateX(-50%)' }
  const cardW = Math.min(CARD_WIDTH, window.innerWidth - EDGE * 2)
  const center = rect.left + rect.width / 2
  const left = Math.max(EDGE, Math.min(center - cardW / 2, window.innerWidth - cardW - EDGE))
  const below = rect.top + rect.height / 2 < window.innerHeight / 2
  return below ? { left, top: rect.top + rect.height + GAP } : { left, bottom: window.innerHeight - rect.top + GAP }
}

function tipText(tip: IntroTip, sample: string): string {
  if (tip === 'forest') return 'かんじを おぼえると、ここの もりが そだつよ！'
  if (tip === 'kanji') return `おぼえた かんじは、ぶんの なかでも かんじに かわるよ。ほら、${sample}！`
  return 'つづきは、この おおきな ボタン！'
}

/** ホームで、学びおえた子に 3つだけ。指す場所に わっかを つけ、すみまるが ひとこと。 */
export function IntroCoach() {
  const intro = useProgress((s) => s.intro)
  const learned = useProgress((s) => s.learned)
  const xp = useProgress((s) => s.xp)
  const hat = useProgress((s) => s.equipped.hat)
  const markIntroSeen = useProgress((s) => s.markIntroSeen)
  const skipIntro = useProgress((s) => s.skipIntro)
  const tip = homeTip(learned.length, intro)
  const rect = useTargetRect(tip ?? 'forest')
  if (!tip) return null
  // 覚えた1字を、ぶんの中で かんじに なる ようすとして 見せる
  const first = learned[0]
  const sample = first ? `{${first}|${getKanji(first).yomi}}` : ''
  const last = tip === 'next'
  return (
    <div className={`intro-coach ${prefersReducedMotion() ? 'is-still' : ''}`} data-intro-coach={tip}>
      {rect && <span className="intro-coach__ring" style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }} aria-hidden="true" />}
      <section className="intro-coach__card" style={cardStyle(rect)} aria-label="すみまるの あんない">
        <Mascot stage={mascotStage(levelInfo(xp).level)} hat={itemName(hat)} happy className="intro-coach__mascot" />
        <p className="intro-coach__text">
          <KText text={tipText(tip, sample)} />
        </p>
        <div className="intro-coach__actions">
          <button type="button" className="btn btn--primary" onClick={() => markIntroSeen(tip)}>
            {last ? 'わかった！' : 'つぎへ'}
          </button>
          {!last && (
            <button type="button" className="btn intro-skip intro-skip--small" onClick={skipIntro}>
              あんないを とばす
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
