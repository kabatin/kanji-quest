import { useEffect } from 'react'
import { MascotSays } from '../../components/MascotSays'
import './limit.css'

/** 「あと 5ふん」を 見せておく時間 */
export const SOON_MS = 7000

type Props = { readonly left: number; readonly onClose: () => void }

/** ホームに もどった時に 1回だけ出す「あと 5ふん」のおしらせ。 */
export function SoonNotice({ left, onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, SOON_MS)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="limit-soon" role="status" data-limit-soon>
      <MascotSays text={`あと ${left}ふん で きょうは おしまい。いまの うちに たのしんでね！`} className="limit-soon__says" />
      <button type="button" className="btn limit-soon__close" onClick={onClose}>
        わかった
      </button>
    </div>
  )
}
