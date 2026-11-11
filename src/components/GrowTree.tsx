const STAGE_NAMES = ['たね', 'め', 'わかぎ', 'き', 'みのなるき'] as const

type Props = { readonly stage: number; readonly className?: string }

/** ポイントで育つ木。段階が上がるほど大きくなり、最後は実がなる。 */
export function GrowTree({ stage, className }: Props) {
  const safeStage = Math.min(Math.max(stage, 0), STAGE_NAMES.length - 1)
  return (
    <svg className={className} viewBox="0 0 120 120" role="img" aria-label={`そだてている き: ${STAGE_NAMES[safeStage]}`}>
      <ellipse cx="60" cy="108" rx="44" ry="9" fill="#C9A77C" />
      {safeStage === 0 && <ellipse cx="60" cy="100" rx="8" ry="6" fill="#8A5A3B" />}
      {safeStage === 1 && (
        <>
          <path d="M60 104 V84" stroke="#3FA35B" strokeWidth="5" strokeLinecap="round" />
          <path d="M60 86 q-16 -12 -20 2 q12 6 20 -2 Z M60 86 q16 -12 20 2 q-12 6 -20 -2 Z" fill="#3FA35B" />
        </>
      )}
      {safeStage >= 2 && (
        <>
          <path
            d={safeStage === 2 ? 'M60 106 V70' : 'M60 106 V52'}
            stroke="#8A5A3B"
            strokeWidth={safeStage === 2 ? 7 : 11}
            strokeLinecap="round"
          />
          <circle cx="60" cy={safeStage === 2 ? 60 : 46} r={safeStage === 2 ? 22 : 36} fill="#3FA35B" />
        </>
      )}
      {safeStage >= 3 && (
        <>
          <circle cx="34" cy="60" r="20" fill="#3FA35B" />
          <circle cx="86" cy="60" r="20" fill="#3FA35B" />
        </>
      )}
      {safeStage >= 4 && (
        <g fill="#E8503A">
          <circle cx="40" cy="56" r="6" />
          <circle cx="64" cy="34" r="6" />
          <circle cx="84" cy="60" r="6" />
          <circle cx="58" cy="66" r="6" />
        </g>
      )}
    </svg>
  )
}
