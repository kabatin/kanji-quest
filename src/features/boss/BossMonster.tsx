/** idle = ふつう / hit = こうげきが当たった / phew = ぎりぎり よけて「あぶなかった」 / down = たおれた */
export type BossMood = 'idle' | 'hit' | 'phew' | 'down'

const BODY_COLORS = ['#4b2f7a', '#1f5d63', '#7a2f3d', '#2d4a8a', '#6b4a1e', '#2a6b3c'] as const
const BELLY_COLORS = ['#7d5bb5', '#3f9aa3', '#b85a6b', '#5b7fc7', '#a57a3a', '#55a56b'] as const

/** にじんだ墨のかたまり。形を3種類用意して、ステージごとに変える。 */
const BODIES = [
  'M60 14 C92 12 108 40 104 70 C102 92 96 104 84 106 Q78 96 72 106 Q66 98 60 106 Q54 98 48 106 Q42 96 36 106 C24 104 18 92 16 70 C12 40 28 12 60 14 Z',
  'M60 18 C80 6 110 30 106 62 C112 84 100 106 82 104 Q74 112 66 104 Q60 110 54 104 Q46 112 38 104 C20 106 8 84 14 62 C10 30 40 6 60 18 Z',
  'M34 24 Q60 4 86 24 C108 34 110 66 100 84 C98 100 86 108 76 102 Q68 110 60 102 Q52 110 44 102 C34 108 22 100 20 84 C10 66 12 34 34 24 Z',
] as const

const HORNS = [
  null,
  <path key="h1" d="M52 18 L60 0 L68 18 Z" />,
  <path key="h2" d="M30 30 L24 6 L44 22 Z M90 30 L96 6 L76 22 Z" />,
  <path key="h3" d="M30 30 L24 8 L44 22 Z M90 30 L96 8 L76 22 Z M53 18 L60 2 L67 18 Z" />,
] as const

type Props = {
  /** ステージの通し番号。見た目(色・形・つの・目の数)がこれで決まる。 */
  readonly seed: number
  /** そつぎょうしけん の だいまおう にする */
  readonly king?: boolean
  readonly mood?: BossMood
  readonly className?: string
  readonly label: string
}

function eyesFor(count: number, mood: BossMood) {
  const spots = count === 1 ? [60] : count === 2 ? [44, 76] : [38, 60, 82]
  return spots.map((x, i) => {
    const y = count === 3 && i === 1 ? 44 : 52
    if (mood === 'down') return <path key={x} d={`M${x - 7} ${y - 7} L${x + 7} ${y + 7} M${x + 7} ${y - 7} L${x - 7} ${y + 7}`} stroke="#fff" strokeWidth="4" strokeLinecap="round" />
    if (mood === 'phew') {
      // びっくりした まるい目と、こまった まゆ(子どもを わらわない)
      return (
        <g key={x}>
          <ellipse cx={x} cy={y} rx="9" ry="11" fill="#fff" />
          <circle cx={x} cy={y + 2} r="3" fill="#1b1b1b" />
          <path d={x < 60 ? `M${x - 10} ${y - 13} L${x + 6} ${y - 17}` : `M${x + 10} ${y - 13} L${x - 6} ${y - 17}`} stroke="#1b1b1b" strokeWidth="4" strokeLinecap="round" />
        </g>
      )
    }
    return (
      <g key={x}>
        <ellipse cx={x} cy={y} rx="9" ry={mood === 'hit' ? 11 : 10} fill="#fff" />
        <circle cx={x} cy={y + 1} r={mood === 'hit' ? 2.5 : 4.5} fill="#1b1b1b" />
        {/* おこった まゆ */}
        <path d={x < 60 ? `M${x - 11} ${y - 14} L${x + 8} ${y - 8}` : `M${x + 11} ${y - 14} L${x - 8} ${y - 8}`} stroke="#1b1b1b" strokeWidth="4" strokeLinecap="round" />
      </g>
    )
  })
}

function mouthFor(mood: BossMood) {
  if (mood === 'down') return <path d="M48 82 Q60 74 72 82" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
  if (mood === 'hit') return <ellipse cx="60" cy="80" rx="8" ry="9" fill="#1b1b1b" />
  if (mood === 'phew') {
    return (
      <>
        <path d="M46 82 Q51 76 56 82 T66 82 T76 82" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
        {/* ひやあせ */}
        <path className="boss-monster__sweat" d="M98 30 Q104 42 98 46 Q92 42 98 30 Z" fill="#9fdcff" />
      </>
    )
  }
  return (
    <>
      <path d="M40 72 Q60 96 80 72 Z" fill="#1b1b1b" />
      <path d="M46 73 L50 82 L54 74 Z M66 74 L70 82 L74 73 Z" fill="#fff" />
    </>
  )
}

/** ステージの ボス。筆からこぼれた墨が おばけ になった、という見た目。 */
export function BossMonster({ seed, king = false, mood = 'idle', className, label }: Props) {
  const index = Math.max(seed, 1) - 1
  const color = king ? '#1b1b2e' : BODY_COLORS[index % BODY_COLORS.length]
  const belly = king ? '#4a4a7a' : BELLY_COLORS[index % BELLY_COLORS.length]
  const eyeCount = king ? 3 : (index % 3) + 1
  return (
    <svg className={['boss-monster', className].filter(Boolean).join(' ')} viewBox="0 0 120 120" role="img" aria-label={label} data-mood={mood} data-king={king}>
      <ellipse cx="60" cy="112" rx="38" ry="6" fill="rgba(0,0,0,0.18)" />
      <g className="boss-monster__body">
        <g fill={color}>{HORNS[king ? 3 : (index + Math.floor(index / 3)) % HORNS.length]}</g>
        <path d={BODIES[index % BODIES.length]} fill={color} />
        <ellipse cx="60" cy="78" rx="26" ry="20" fill={belly} opacity="0.45" />
        {/* 墨のしずく */}
        <circle cx="12" cy="92" r="5" fill={color} />
        <circle cx="108" cy="88" r="4" fill={color} />
        {king && <path d="M36 22 L40 2 L50 14 L60 0 L70 14 L80 2 L84 22 Z" fill="#ffc233" stroke="#c98a00" strokeWidth="2.5" strokeLinejoin="round" />}
        {eyesFor(eyeCount, mood)}
        {mouthFor(mood)}
      </g>
    </svg>
  )
}
