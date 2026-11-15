import { useCallback, useEffect, useMemo, useState } from 'react'
import { ALL_STAGES } from '../../data/areas'
import narrationJson from '../../data/narration.json'
import {
  listClips,
  loadVoiceReviews,
  VOICE_REVIEW_KEY,
  voiceReport,
  type Clip,
  type ClipKind,
  type NarrationLike,
  type VoiceReview,
  type VoiceReviews,
} from '../../lib/voiceCheck'
import './voicecheck.css'
import { ClipDetail } from './ClipDetail'
import { fetchState, type VoiceState } from './voiceApi'

type Filter = 'all' | 'todo' | 'flag' | 'suspect'
type KindFilter = 'all' | ClipKind

const FILTER_LABEL: Record<Filter, string> = { all: 'ぜんぶ', todo: 'まだ聞いていない', flag: 'なおしたい', suspect: '自動検出で あやしい' }
const KIND_LABEL: Record<KindFilter, string> = { all: 'ぜんぶの種類', word: 'よみ', explain: 'せつめい', goal: 'おだい' }

/** 学ぶ順(学年・ステージの順)に ならべた、ぜんぶのクリップ。 */
function orderedClips(): readonly (Clip & { readonly grade: number })[] {
  const all = listClips(narrationJson as NarrationLike)
  return ALL_STAGES.flatMap((stage) => stage.kanji.flatMap((char) => all.filter((clip) => clip.char === char).map((clip) => ({ ...clip, grade: stage.grade }))))
}

const CLIPS = orderedClips()
const EMPTY_STATE: VoiceState = { engine: false, overrides: {}, report: null, suggestions: null }

/**
 * 開発用: ぜんぶの音声を 耳で たしかめて、読みまちがい・アクセントを なおす(?voices)。
 * 聞く・しるし・メモ は いつでも。なおす には AivisSpeech の起動が いる。公開する版には 入らない。
 */
export function VoiceCheck() {
  const [state, setState] = useState<VoiceState>(EMPTY_STATE)
  const [loadError, setLoadError] = useState('')
  const [reviews, setReviews] = useState<VoiceReviews>(loadVoiceReviews)
  const [filter, setFilter] = useState<Filter>('all')
  const [kind, setKind] = useState<KindFilter>('all')
  const [grade, setGrade] = useState<number | null>(null)
  const [selectedId, setSelectedId] = useState(CLIPS[0]?.id ?? '')
  const [copied, setCopied] = useState(false)

  const refresh = useCallback(() => {
    fetchState()
      .then((next) => {
        setState(next)
        setLoadError('')
      })
      .catch((error: unknown) => setLoadError(error instanceof Error ? error.message : String(error)))
  }, [])
  useEffect(refresh, [refresh])

  const update = (id: string, review: VoiceReview) => {
    const next = { ...reviews, [id]: review }
    setReviews(next)
    try {
      localStorage.setItem(VOICE_REVIEW_KEY, JSON.stringify(next))
    } catch {
      setLoadError('メモを この端末に 保存できません')
    }
  }

  const suspectIds = useMemo(() => new Set(Object.entries(state.report?.clips ?? {}).filter(([, r]) => r.diffs.length > 0).map(([id]) => id)), [state.report])
  const suggestions = useMemo(() => new Map((state.suggestions?.suggestions ?? []).map((s) => [s.id, s])), [state.suggestions])
  const shown = CLIPS.filter((clip) => {
    if (grade !== null && clip.grade !== grade) return false
    if (kind !== 'all' && clip.kind !== kind) return false
    const review = reviews[clip.id] ?? {}
    if (filter === 'flag') return review.flag === true
    if (filter === 'todo') return !review.flag && !review.ok
    if (filter === 'suspect') return suspectIds.has(clip.id)
    return true
  })
  const selected = CLIPS.find((clip) => clip.id === selectedId)
  const flagged = CLIPS.filter((clip) => reviews[clip.id]?.flag)
  const okCount = CLIPS.filter((clip) => reviews[clip.id]?.ok).length
  const report = voiceReport(reviews, CLIPS)

  const copy = () => {
    navigator.clipboard
      ?.writeText(report)
      .then(() => setCopied(true))
      .catch(() => setCopied(false))
  }

  return (
    <div className="vc">
      <header className="vc__bar">
        <h1>
          音声の たしかめ　全 {CLIPS.length} 本　よい {okCount}　なおしたい {flagged.length}　あやしい {suspectIds.size}
        </h1>
        <p className="vc__engine" data-on={state.engine}>
          {state.engine ? 'AivisSpeech: つながっています' : 'AivisSpeech: 起動していません(聞く・メモ は できます。なおすには 起動してください)'}
          <button type="button" onClick={refresh}>
            つなぎなおす
          </button>
          {loadError && <span role="alert"> {loadError}</span>}
        </p>
        <div className="vc__filters">
          {(Object.keys(FILTER_LABEL) as Filter[]).map((value) => (
            <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>
              {FILTER_LABEL[value]}
            </button>
          ))}
          <span>｜</span>
          {(Object.keys(KIND_LABEL) as KindFilter[]).map((value) => (
            <button key={value} type="button" aria-pressed={kind === value} onClick={() => setKind(value)}>
              {KIND_LABEL[value]}
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
            なおしたい を 指揮役に わたす文として コピー({flagged.length})
          </button>
          {copied && <span>コピーしました</span>}
        </div>
      </header>
      <div className="vc__body">
        <ul className="vc__list" aria-label="クリップの一覧">
          {shown.map((clip) => {
            const review = reviews[clip.id] ?? {}
            const status = review.flag ? 'flag' : review.ok ? 'ok' : 'todo'
            return (
              <li key={clip.id}>
                <button type="button" data-state={status} data-suspect={suspectIds.has(clip.id)} aria-current={clip.id === selectedId} onClick={() => setSelectedId(clip.id)}>
                  <strong>{clip.char}</strong>
                  <span className="vc__kind">{KIND_LABEL[clip.kind]}</span>
                  <span className="vc__text">{clip.text}</span>
                  {suspectIds.has(clip.id) && <em>あやしい</em>}
                </button>
              </li>
            )
          })}
          {shown.length === 0 && <li>あてはまる音声は ありません</li>}
        </ul>
        {selected && (
          <ClipDetail
            key={selected.id}
            clip={selected}
            state={state}
            review={reviews[selected.id] ?? {}}
            suggestion={suggestions.get(selected.id)}
            onReview={(review) => update(selected.id, review)}
            onChanged={refresh}
          />
        )}
      </div>
      {report && filter === 'flag' && <textarea className="vc__report" readOnly value={report} aria-label="なおしたい の一覧" rows={Math.min(flagged.length + 1, 8)} />}
    </div>
  )
}
