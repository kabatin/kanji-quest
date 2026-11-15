import { KText } from '../../components/KText'
import { PartIcon } from '../../components/PartIcon'
import type { Kanji } from '../../data/schema'
import { MODEL_HINT } from '../../lib/strokeHint'
import type { WriteState } from '../../lib/kakuSession'
import { IssueNote } from './IssueNote'
import { LEARN_DONE_MS } from './useKakuWriting'

type Props = {
  readonly kanji: Kanji
  readonly strict: boolean
  readonly model: boolean
  readonly state: WriteState
  readonly total: number
  readonly finished: boolean
  readonly onSay: () => void
  readonly onGiveUp: () => void
  readonly onModel: () => void
  readonly onRestart: () => void
  readonly onCompare: () => void
  readonly onSkip?: () => void
}

const leadText = (finished: boolean, strict: boolean, model: boolean): string => {
  if (finished) return '{書|か}けた！'
  if (!strict) return 'ゆびで なぞって {書|か}こう'
  return model ? 'じゅんばんどおりに {書|か}こう' : '{見本|みほん} なしで {書|か}こう'
}

/** 書いている あいだの よこの らん: 見出し・画の数・まちがいの わけ・ボタン */
export function WritingPanel({ kanji, strict, model, state, total, finished, onSay, onGiveUp, onModel, onRestart, onCompare, onSkip }: Props) {
  return (
    <>
      {strict && (
        <button type="button" className="kaku__goal" onClick={onSay} aria-label={`${kanji.yomi} を きく`}>
          <PartIcon id={kanji.icon} className="kaku__goal-icon" />
          <span className="kaku__goal-label">{kanji.yomi} 🔊</span>
        </button>
      )}
      <p className="kaku__lead">
        <KText text={leadText(finished, strict, model)} />
      </p>
      <p className="kaku__count" aria-live="polite">
        {Math.min(state.done, total)} / {total} かく
      </p>
      <IssueNote issue={finished ? null : state.issue} canSeeModel={model || state.hint >= MODEL_HINT} />
      <div className="kaku__actions">
        {strict ? (
          <button type="button" className="btn" onClick={onGiveUp} disabled={finished || state.hint >= MODEL_HINT}>
            わからない
          </button>
        ) : finished ? (
          <DoneActions onCompare={onCompare} />
        ) : (
          <>
            <button type="button" className="btn" onClick={onModel}>
              おてほん
            </button>
            <button type="button" className="btn" onClick={onRestart} disabled={state.done === 0}>
              はじめから
            </button>
            {onSkip && (
              <button type="button" className="btn" onClick={onSkip}>
                <KText text="{後|あと}で" />
              </button>
            )}
          </>
        )}
      </div>
    </>
  )
}

/** 見て書く で 書きおわったあと: 「くらべる」を押さなければ、バーが へりきって 次へ進む。 */
function DoneActions({ onCompare }: { readonly onCompare: () => void }) {
  return (
    <>
      <button type="button" className="btn btn--primary" onClick={onCompare}>
        くらべる
      </button>
      <span className="kaku__wait" aria-hidden="true">
        <span style={{ animationDuration: `${LEARN_DONE_MS}ms` }} />
      </span>
    </>
  )
}
