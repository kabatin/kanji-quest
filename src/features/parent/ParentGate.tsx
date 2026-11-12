import { useState, type FormEvent } from 'react'
import { TopBar } from '../../components/Hud'
import { checkGate, makeGateQuestion } from '../../lib/parentStats'

type Props = { readonly onBack: () => void; readonly onPass: () => void }

/** おうちの かた向けの画面の入り口。子どもが まちがえて入らないよう、かけ算を1問だけ聞く。 */
export function ParentGate({ onBack, onPass }: Props) {
  const [question, setQuestion] = useState(() => makeGateQuestion())
  const [answer, setAnswer] = useState('')
  const [failed, setFailed] = useState(false)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (checkGate(question, answer)) {
      onPass()
      return
    }
    setFailed(true)
    setAnswer('')
    setQuestion(makeGateQuestion())
  }

  return (
    <div className="screen parent-gate">
      <TopBar onBack={onBack} title="保護者の方へ" />
      <form className="parent-gate__card" onSubmit={handleSubmit}>
        <p className="parent-gate__lead">この先は保護者の方向けの画面です。次の計算の答えを入力してください。</p>
        <label className="parent-gate__question">
          <span>
            {question.a} × {question.b} ＝
          </span>
          <input type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="off" aria-label="答え" value={answer} onChange={(event) => setAnswer(event.target.value)} />
        </label>
        <p className="parent-gate__error" role="status">
          {failed ? '答えが違います。別の問題を表示しました。' : ''}
        </p>
        <button type="submit" className="btn btn--primary">
          ひらく
        </button>
      </form>
    </div>
  )
}
