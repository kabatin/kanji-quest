import { hasStamp, STAMP_KINDS, STAMP_LABEL, stampCount, type StampKind } from '../lib/rewards'
import { KText } from './KText'

const STAMP_CHAR = { learn: '学', write: '書', quiz: '解' } as const

type Props = {
  readonly mask: number | undefined
  /** 名前(まなぶ・かく・とく)も出すか */
  readonly withLabel?: boolean
  readonly className?: string
  /** いま もらったばかりの はんこ。順番に ぺたん と おされる */
  readonly fresh?: readonly StampKind[]
}

/** はんこ が おされるまでの間(1つ目) と、次の はんこ までの間 */
export const STAMP_FIRST_MS = 450
export const STAMP_GAP_MS = 380

/** 漢字ごとの はんこ 3つ(まなぶ・かく・とく)。押してあるものは朱色になる。 */
export function Stamps({ mask, withLabel = false, className, fresh = [] }: Props) {
  return (
    <span className={['stamps', className].filter(Boolean).join(' ')} role="img" aria-label={`はんこ ${stampCount(mask)}こ`}>
      {STAMP_KINDS.map((kind) => (
        <span
          key={kind}
          className={`stamp ${hasStamp(mask, kind) ? 'is-on' : ''} ${fresh.includes(kind) ? 'is-fresh' : ''}`}
          data-stamp={kind}
          style={fresh.includes(kind) ? { ['--stamp-delay' as string]: `${STAMP_FIRST_MS + fresh.indexOf(kind) * STAMP_GAP_MS}ms` } : undefined}
        >
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
