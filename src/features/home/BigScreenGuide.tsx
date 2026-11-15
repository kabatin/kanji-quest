import { useState } from 'react'
import { bigScreenWay, enterFullscreen, hintSeen, markHintSeen, readScreenEnv, shouldHint, type BigScreenWay } from '../../lib/fullscreen'
import './bigscreen.css'

type GuideProps = { readonly way: BigScreenWay; readonly onClose: () => void }

/** がめんを 大きく する あんない。Android などは ボタンで 全画面、iPhone・iPad は「ホーム画面に追加」の手順。 */
export function BigScreenGuide({ way, onClose }: GuideProps) {
  const [failed, setFailed] = useState(false)
  const goBig = async () => {
    if (await enterFullscreen()) onClose()
    else setFailed(true)
  }
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="がめんを 大きく">
      <div className="modal__panel bigscreen">
        <h2>がめんを 大きく しよう</h2>
        {way === 'button' ? (
          <>
            <p className="modal__lead">うえの バーが きえて、ひろく あそべるよ</p>
            {failed && (
              <p className="bigscreen__note" role="status">
                この がめんでは 大きく できなかったよ
              </p>
            )}
            <div className="bigscreen__actions">
              <button type="button" className="btn btn--primary btn--big" onClick={() => void goBig()}>
                大きく する
              </button>
              <button type="button" className="btn" onClick={onClose}>
                あとで
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="modal__lead">おうちの ひとに やってもらおう</p>
            <ol className="bigscreen__steps">
              <li>
                ブラウザの「共有」ボタン <span aria-hidden="true">(□に↑)</span> をおす
              </li>
              <li>「ホーム画面に追加」をえらぶ</li>
              <li>ホーム画面の「漢字クエスト」からひらく</li>
            </ol>
            <p className="bigscreen__note">ホーム画面からひらくと、記録は新しく始まります。今の記録は「おうちの かたへ」の「記録を残す・戻す」で移せます。</p>
            <div className="bigscreen__actions">
              <button type="button" className="btn btn--primary btn--big" onClick={onClose}>
                わかった
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** ホームで 1回だけ出す あんない(がめんが ひくい スマホの よこ向きで、まだ 大きく していないとき)。ほかの まどが 出ている間(hold)は 待つ。 */
export function BigScreenHint({ hold = false }: { readonly hold?: boolean }) {
  const [way] = useState(() => bigScreenWay(readScreenEnv()))
  const [open, setOpen] = useState(() => shouldHint(way, typeof window === 'undefined' ? 9999 : window.innerHeight, hintSeen()))
  if (!open || hold) return null
  return (
    <BigScreenGuide
      way={way}
      onClose={() => {
        markHintSeen()
        setOpen(false)
      }}
    />
  )
}

/** せってい に置く「がめんを 大きく」ボタン。もう 大きい・できない端末では 出さない。 */
export function BigScreenButton() {
  const [way] = useState(() => bigScreenWay(readScreenEnv()))
  const [open, setOpen] = useState(false)
  if (way === 'already' || way === 'none') return null
  return (
    <>
      <button type="button" className="btn settings__bigscreen" onClick={() => setOpen(true)}>
        <span aria-hidden="true">⛶</span> がめんを 大きく
      </button>
      {open && <BigScreenGuide way={way} onClose={() => setOpen(false)} />}
    </>
  )
}
