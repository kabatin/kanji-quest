import { hasStamp, STAMP_KINDS, STAMP_LABEL, stampCount } from '../lib/rewards'
import { KText } from './KText'

const STAMP_CHAR = { learn: '学', write: '書', quiz: '解' } as const

type Props = {
  readonly mask: number | undefined
  /** 名前(まなぶ・かく・とく)も出すか */
  readonly withLabel?: boolean
  readonly className?: string
}

/** 漢字ごとの はんこ 3つ(まなぶ・かく・とく)。押してあるものは朱色になる。 */
export function Stamps({ mask, withLabel = false, className }: Props) {
  return (
    <span className={['stamps', className].filter(Boolean).join(' ')} role="img" aria-label={`はんこ ${stampCount(mask)}こ`}>
      {STAMP_KINDS.map((kind) => (
        <span key={kind} className={`stamp ${hasStamp(mask, kind) ? 'is-on' : ''}`} data-stamp={kind}>
          <span className="stamp__seal" aria-hidden="true">
            {STAMP_CHAR[kind]}
          </span>
          {withLabel && (
            <span className="stamp__label">
              <KText text={STAMP_LABEL[kind]} />
            </span>
          )}
        </span>
      ))}
    </span>
  )
}
