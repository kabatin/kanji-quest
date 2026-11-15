import { useEffect, useState } from 'react'
import { resolveSpec, validateKana, validateText, type Clip, type VoiceReview, type VoiceSpec } from '../../lib/voiceCheck'
import { AccentPicker } from './AccentPicker'
import { queryKana, rebuildClip, saveOverride, synthUrl, type VoiceState, type VoiceSuggestion } from './voiceApi'
import { playClip, playUrl } from './voicePlayer'

type Props = {
  readonly clip: Clip
  readonly state: VoiceState
  readonly review: VoiceReview
  readonly suggestion: VoiceSuggestion | undefined
  readonly onReview: (review: VoiceReview) => void
  readonly onChanged: () => void
}

const NEED_ENGINE = 'AivisSpeech を 起動してください(起動したら「つなぎなおす」)'

/** 1本ぶんの 詳しい画面: 聞く・しるし・メモ・アクセントを 耳で えらんで なおす。 */
export function ClipDetail({ clip, state, review, suggestion, onReview, onChanged }: Props) {
  const spec = resolveSpec(clip, state.overrides)
  const reportKana = state.report?.clips[clip.id]?.kana ?? ''
  const [kana, setKana] = useState(spec.kind === 'kana' ? spec.value : reportKana)
  const [kanjiText, setKanjiText] = useState(spec.kind === 'text' && spec.value !== clip.text ? spec.value : clip.kind === 'word' ? `${clip.char}。` : clip.text)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const reading = validateKana(kana)

  // エンジンが いるときは、いまの読みを その場で もらう
  useEffect(() => {
    if (!state.engine || spec.kind === 'kana') return
    let alive = true
    queryKana(spec)
      .then((value) => alive && setKana(value))
      .catch(() => undefined)
    return () => {
      alive = false
    }
    // クリップを えらびなおしたときだけ(key で作りなおされる)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const run = async (task: () => Promise<void>) => {
    setBusy(true)
    setMessage('')
    try {
      await task()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
    }
  }
  const listen = (value: VoiceSpec) => run(async () => void (await playUrl(await synthUrl(value))))
  const commit = (value: VoiceSpec | null, done: string) =>
    run(async () => {
      await saveOverride(clip.id, value)
      await rebuildClip(clip.id)
      onChanged()
      setMessage(done)
      await playClip(clip.id)
    })
  const pick = (next: string) => {
    setKana(next)
    void listen({ kind: 'kana', value: next })
  }

  const textSpec: VoiceSpec = { kind: 'text', value: kanjiText }
  const hasSavedOverride = state.overrides.clips?.[clip.id] !== undefined
  const off = !state.engine
  return (
    <section className="vc-detail" aria-label={`${clip.id} の たしかめ`}>
      <h2>
        {clip.id}　<small>{clip.char}</small>
      </h2>
      <p className="vc-detail__text">{clip.text}</p>
      <p>
        <button type="button" onClick={() => void run(() => playClip(clip.id))}>
          ▶ いまの音声(mp3)
        </button>
        {hasSavedOverride && <span className="vc-tag">上書きあり</span>}
      </p>
      <label className="vc-detail__row">
        <input type="checkbox" checked={review.ok ?? false} onChange={(e) => onReview({ ...review, ok: e.target.checked, flag: e.target.checked ? false : review.flag })} />
        よい
      </label>
      <label className="vc-detail__row">
        <input type="checkbox" checked={review.flag ?? false} onChange={(e) => onReview({ ...review, flag: e.target.checked, ok: e.target.checked ? false : review.ok })} />
        なおしたい
      </label>
      <input
        type="text"
        className="vc-detail__memo"
        placeholder="どこを なおしたいか(例: 「ち」を 高く)"
        aria-label={`${clip.id} の メモ`}
        value={review.memo ?? ''}
        onChange={(e) => onReview({ ...review, memo: e.target.value, flag: e.target.value.trim() !== '' ? true : review.flag, ok: e.target.value.trim() !== '' ? false : review.ok })}
      />
      {suggestion && (
        <p className="vc-detail__hint">
          辞書(漢字で渡す)のアクセント: <code>{suggestion.dict}</code>　いま(ひらがな): <code>{suggestion.plain}</code>
        </p>
      )}

      <h3>アクセントを 耳で えらぶ</h3>
      {off && (
        <p className="vc-detail__warn" role="alert">
          {NEED_ENGINE}
        </p>
      )}
      {reading.ok ? <AccentPicker kana={kana} disabled={off || busy} onPick={pick} /> : kana === '' && <p>(読みが まだ ありません。AivisSpeech を起動して「つなぎなおす」。または 下の欄に カタカナで 書く)</p>}
      <label className="vc-detail__kana">
        読み(カタカナ。' が 下がる所)
        <input type="text" value={kana} onChange={(e) => setKana(e.target.value)} aria-invalid={!reading.ok} />
      </label>
      {!reading.ok && kana !== '' && <p className="vc-detail__warn">{reading.reason}</p>}
      <p className="vc-detail__actions">
        <button type="button" disabled={off || busy || !reading.ok} onClick={() => void listen({ kind: 'kana', value: kana })}>
          ▶ この読みで きく
        </button>
        <button type="button" disabled={off || busy || !reading.ok} onClick={() => void commit({ kind: 'kana', value: kana }, 'この読みに しました')}>
          これに する
        </button>
      </p>

      <h3>漢字まじりで わたして きく</h3>
      <label className="vc-detail__kana">
        <input type="text" value={kanjiText} onChange={(e) => setKanjiText(e.target.value)} aria-label="漢字まじりの文" />
      </label>
      <p className="vc-detail__actions">
        <button type="button" disabled={off || busy || !validateText(kanjiText).ok} onClick={() => void listen(textSpec)}>
          ▶ きく
        </button>
        <button type="button" disabled={off || busy || !validateText(kanjiText).ok} onClick={() => void commit(textSpec, '漢字まじりの文に しました')}>
          これに する
        </button>
        <button type="button" disabled={off || busy || !hasSavedOverride} onClick={() => void commit(null, 'もとに もどしました')}>
          もとに もどす
        </button>
      </p>
      {message && <p className="vc-detail__message" role="status">{message}</p>}
    </section>
  )
}
