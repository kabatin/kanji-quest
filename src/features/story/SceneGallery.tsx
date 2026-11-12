import { useEffect, useRef, useState } from 'react'
import { ALL_STAGES } from '../../data/areas'
import { getKanji } from '../../data/kanji'
import { getNarration } from '../../data/narration'
import { plainText } from '../../lib/kanjiText'
import { useSceneClock } from './sceneClock'
import type { SceneModule } from './sceneKit'
import { hasScene, loadScene } from './sceneRegistry'
import { loadReviews, REVIEW_KEY, reviewReport, type Review, type Reviews } from './sceneReview'
import { SceneStage } from './SceneStage'

/** さいごまで流れたあと、できあがりの絵を 見せておく時間。そのあと はじめから くり返す */
const HOLD_MS = 1600

/** 学ぶ順(ステージの順)に ならべた、ぜんぶの漢字。 */
const ORDER: readonly { readonly char: string; readonly stage: number; readonly grade: number }[] = ALL_STAGES.flatMap((stage) =>
  stage.kanji.map((char) => ({ char, stage: stage.number, grade: stage.grade })),
)

type Filter = 'all' | 'todo' | 'flag' | 'missing'

const FILTER_LABEL: Record<Filter, string> = { all: 'ぜんぶ', todo: 'まだ見ていない', flag: 'なおしたい', missing: '場面が ない' }

/** 画面に 見えている間だけ true(見えていない場面は 動かさない。240こ いっぺんに 動かすと 重いので)。 */
function useOnScreen<T extends Element>(): readonly [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const element = ref.current
    if (!element || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '80px' })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return [ref, visible]
}

/** 場面を くり返し 流す。さいごまで行ったら、少し止めてから はじめに もどる。 */
function Loop({ scene, round, onRound }: { readonly scene: SceneModule; readonly round: number; readonly onRound: () => void }) {
  const t = useSceneClock(scene.duration, round)
  const finished = t >= scene.duration
  useEffect(() => {
    if (!finished) return
    const timer = setTimeout(onRound, HOLD_MS)
    return () => clearTimeout(timer)
  }, [finished, onRound])
  const beat = [...scene.beats].reverse().find((item) => item.at <= t)
  return (
    <>
      <SceneStage scene={scene} t={t} label={`${scene.char} の ものがたり`} />
      <p className="scene-card__beat">
        {t.toFixed(1)} / {scene.duration}秒　{beat?.label}
      </p>
    </>
  )
}

type CardProps = {
  readonly char: string
  readonly stage: number
  readonly review: Review
  readonly onReview: (review: Review) => void
}

function Card({ char, stage, review, onReview }: CardProps) {
  const [ref, visible] = useOnScreen<HTMLElement>()
  const [scene, setScene] = useState<SceneModule | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  const [round, setRound] = useState(0)
  const exists = hasScene(char)

  // 見えたときに はじめて 読みこむ(ぜんぶを いっぺんに 読みこまない)
  useEffect(() => {
    if (!visible || !exists || scene || error) return
    let alive = true
    loadScene(char)
      .then((loaded) => {
        if (alive) setScene(loaded)
      })
      .catch((cause: unknown) => {
        if (alive) setError(cause instanceof Error ? cause.message : String(cause))
      })
    return () => {
      alive = false
    }
  }, [visible, exists, scene, error, char])

  const kanji = getKanji(char)
  const state = review.flag ? 'flag' : review.ok ? 'ok' : 'todo'
  return (
    <article ref={ref} className="scene-card" data-char={char} data-state={exists ? state : 'missing'}>
      <header>
        <strong>{char}</strong>
        <span>
          {kanji.yomi}　ステージ {stage}
        </span>
        <a href={`?scene=${encodeURIComponent(char)}`} target="_blank" rel="noreferrer">
          コマ送り
        </a>
      </header>
      <div className="scene-card__stage">
        {!exists && <p className="scene-card__none">場面が まだ ない</p>}
        {error && <p className="scene-card__none">読みこめない: {error}</p>}
        {/* 見えていない間は、できあがりの絵を 止めて出す */}
        {scene && (visible ? <Loop scene={scene} round={round} onRound={() => setRound((r) => r + 1)} /> : <SceneStage scene={scene} t={scene.duration} label={`${char} の ものがたり`} />)}
      </div>
      <p className="scene-card__caption">{plainText(getNarration(char).caption)}</p>
      {exists && (
        <footer>
          <button type="button" onClick={() => setRound((r) => r + 1)}>
            ↻
          </button>
          <label>
            <input type="checkbox" checked={review.ok ?? false} onChange={(event) => onReview({ ...review, ok: event.target.checked, flag: event.target.checked ? false : review.flag })} />
            よい
          </label>
          <label>
            <input type="checkbox" checked={review.flag ?? false} onChange={(event) => onReview({ ...review, flag: event.target.checked, ok: event.target.checked ? false : review.ok })} />
            なおしたい
          </label>
          <input
            type="text"
            className="scene-card__memo"
            placeholder="どこを なおしたいか"
            aria-label={`${char} の メモ`}
            value={review.memo ?? ''}
            onChange={(event) => onReview({ ...review, memo: event.target.value, flag: event.target.value.trim() !== '' ? true : review.flag, ok: event.target.value.trim() !== '' ? false : review.ok })}
          />
        </footer>
      )}
    </article>
  )
}

/**
 * 開発用: ぜんぶの場面を、動いている すがた で ならべて 目で たしかめる(?gallery)。
 * 字ごとに「よい」「なおしたい」と メモ を付けられる。きろく は この端末の ブラウザに のこる。
 * 「なおしたい の一覧を コピー」で、なおす字と メモ を 文に して 取り出せる。公開する版には 入らない。
 */
export function SceneGallery() {
  const [reviews, setReviews] = useState<Reviews>(loadReviews)
  const [filter, setFilter] = useState<Filter>('all')
  const [grade, setGrade] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  const update = (char: string, review: Review) => {
    const next = { ...reviews, [char]: review }
    setReviews(next)
    localStorage.setItem(REVIEW_KEY, JSON.stringify(next))
  }

  const made = ORDER.filter((item) => hasScene(item.char))
  const flagged = made.filter((item) => reviews[item.char]?.flag)
  const okCount = made.filter((item) => reviews[item.char]?.ok).length
  const shown = ORDER.filter((item) => {
    if (grade !== null && item.grade !== grade) return false
    const exists = hasScene(item.char)
    const review = reviews[item.char] ?? {}
    if (filter === 'missing') return !exists
    if (filter === 'flag') return exists && review.flag === true
    if (filter === 'todo') return exists && !review.flag && !review.ok
    return true
  })
  const report = reviewReport(
    reviews,
    ORDER.map((item) => item.char),
  )

  const copy = () => {
    navigator.clipboard
      ?.writeText(report)
      .then(() => setCopied(true))
      .catch(() => setCopied(false))
  }

  return (
    <div className="scene-sheet scene-gallery">
      <header className="scene-gallery__bar">
        <h1>
          場面の たしかめ　できた {made.length} / {ORDER.length}　よい {okCount}　なおしたい {flagged.length}　まだ見ていない {made.length - okCount - flagged.length}
        </h1>
        <div className="scene-gallery__filters">
          {(Object.keys(FILTER_LABEL) as Filter[]).map((value) => (
            <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>
              {FILTER_LABEL[value]}
            </button>
          ))}
          <span>｜</span>
          {[null, 1, 2].map((value) => (
            <button key={String(value)} type="button" aria-pressed={grade === value} onClick={() => setGrade(value)}>
              {value === null ? '全学年' : `${value}年`}
            </button>
          ))}
          <span>｜</span>
          <button type="button" onClick={copy} disabled={flagged.length === 0}>
            なおしたい の一覧を コピー（{flagged.length}）
          </button>
          {copied && <span>コピーしました</span>}
        </div>
      </header>
      {flagged.length > 0 && filter === 'flag' && <textarea className="scene-gallery__report" readOnly value={report} aria-label="なおしたい の一覧" rows={Math.min(flagged.length, 8)} />}
      <div className="scene-gallery__grid">
        {shown.map((item) => (
          <Card key={item.char} char={item.char} stage={item.stage} review={reviews[item.char] ?? {}} onReview={(review) => update(item.char, review)} />
        ))}
      </div>
      {shown.length === 0 && <p>あてはまる字は ありません</p>}
    </div>
  )
}
