import { KText } from '../../components/KText'
import type { StrokeIssue } from '../../lib/strokeMatch'

/** まちがいの わけ(何が ちがうか)と、直しかた(ばんの しるし を どう使うか) */
const ISSUE_TEXT: Record<StrokeIssue, { readonly what: string; readonly fix: string }> = {
  order: { what: '{書|か}きじゅんが ちがうよ', fix: 'あかい まるの ところから {書|か}こう' },
  start: { what: '{書|か}きはじめる ところが ちがうよ', fix: 'あかい まるから {書|か}こう' },
  reverse: { what: '{書|か}く むきが ぎゃくだよ', fix: 'やじるしの ほうへ {書|か}こう' },
  end: { what: 'おわりの ところが ちがうよ', fix: 'わっかの ところで とめよう' },
  short: { what: 'せんが みじかいよ', fix: 'わっかの ところまで のばそう' },
  long: { what: 'せんが ながすぎるよ', fix: 'わっかの ところで とめよう' },
  shape: { what: 'かたちが ちがうよ', fix: 'お{手本|てほん}を よく {見|み}て {書|か}こう' },
}

/** お手本が 見えないときの「かたち」の直しかた */
const SHAPE_FIX_BLIND = 'ゆっくり ていねいに {書|か}こう'

type Props = {
  readonly issue: StrokeIssue | null
  /** ばんに お手本(うすい字・うごく お手本)が 見えているか */
  readonly canSeeModel: boolean
}

/** さっきの線の まちがいの わけ と 直しかた。まちがえていないときは 空(場所は とっておく)。 */
export function IssueNote({ issue, canSeeModel }: Props) {
  const text = issue ? ISSUE_TEXT[issue] : null
  const fix = issue === 'shape' && !canSeeModel ? SHAPE_FIX_BLIND : text?.fix
  return (
    <p className="kaku__note" aria-live="polite" data-issue={issue ?? undefined}>
      {text && (
        <>
          <KText text={text.what} />
          <span className="kaku__note-fix">
            <KText text={fix ?? ''} />
          </span>
        </>
      )}
    </p>
  )
}
