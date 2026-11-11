import type { ReactNode } from 'react'

const GREEN = '#3FA35B'
const BROWN = '#8A5A3B'
const BLUE = '#3B9BE0'
const SUN = '#F5A623'
const MOON = '#F2C94C'
const GREY = '#B9C2CC'
const PINK = '#EE6FA0'

// 木・日・月の絵は、漢字と重ねたときに形が合うよう、漢字と同じ 109x109 の座標で描いている
const tree = (x: number, y: number, scale: number): ReactNode => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M54 30 V99 M54 62 L18 82 M54 62 L92 82" stroke={BROWN} strokeWidth="9" strokeLinecap="round" fill="none" />
    <ellipse cx="54" cy="34" rx="40" ry="24" fill={GREEN} />
  </g>
)

const drop = (cx: number, cy: number, r: number): ReactNode => (
  <path
    d={`M${cx} ${cy - r * 1.9} C${cx + r * 1.3} ${cy - r * 0.4} ${cx + r} ${cy + r} ${cx} ${cy + r} C${cx - r} ${cy + r} ${cx - r * 1.3} ${cy - r * 0.4} ${cx} ${cy - r * 1.9}Z`}
    fill={BLUE}
  />
)

const cloud = (y: number, fill: string): ReactNode => (
  <path
    d={`M26 ${y + 30} a16 16 0 0 1 4 -31 a22 22 0 0 1 42 -5 a18 18 0 0 1 12 36 Z`}
    fill={fill}
    stroke="#8FA3B5"
    strokeWidth="3"
    strokeLinejoin="round"
  />
)

/** 手描きのアイコン。ここにない名前は、絵文字としてそのまま描く。 */
const BAR = '#27336b'
const bars = (ys: readonly number[], widths: readonly number[]): ReactNode =>
  ys.map((y, i) => <rect key={y} x={54.5 - widths[i] / 2} y={y - 5} width={widths[i]} height="10" rx="5" fill={BAR} />)

const ICONS: Record<string, ReactNode> = {
  bar: bars([54], [84]),
  bar2: bars([34, 76], [56, 88]),
  bar3: bars([24, 54, 86], [62, 50, 92]),
  barv: <rect x="49.5" y="10" width="10" height="90" rx="5" fill={BAR} />,
  tree: tree(0, 0, 1),
  trees2: (
    <>
      {tree(-2, 22, 0.56)}
      {tree(50, 22, 0.56)}
    </>
  ),
  trees3: (
    <>
      {tree(27, 2, 0.5)}
      {tree(0, 50, 0.5)}
      {tree(54, 50, 0.5)}
    </>
  ),
  sun: (
    <>
      <g stroke={SUN} strokeWidth="6" strokeLinecap="round">
        <path d="M55 8 V18 M55 92 V102 M8 55 H18 M92 55 H102 M22 22 L29 29 M81 81 L88 88 M88 22 L81 29 M29 81 L22 88" />
      </g>
      <circle cx="55" cy="55" r="29" fill={SUN} />
      <circle cx="55" cy="55" r="7" fill="#FFF3D1" />
    </>
  ),
  moon: <path d="M70 12 A46 46 0 1 0 70 98 A36 36 0 1 1 70 12Z" fill={MOON} stroke="#D9A91F" strokeWidth="3" />,
  drop: drop(54, 62, 28),
  rain: (
    <>
      {cloud(18, '#E3EAF1')}
      {drop(34, 84, 7)}
      {drop(55, 92, 7)}
      {drop(76, 84, 7)}
    </>
  ),
  cloud: cloud(36, '#EEF3F8'),
  grass: (
    <g stroke={GREEN} strokeWidth="8" strokeLinecap="round" fill="none">
      <path d="M22 94 Q20 60 10 44 M38 94 Q40 50 30 22 M55 94 V30 M72 94 Q70 50 80 22 M88 94 Q90 60 100 44" />
    </g>
  ),
  gate: (
    <g fill="none" stroke={BROWN} strokeWidth="6" strokeLinejoin="round">
      <rect x="14" y="14" width="34" height="84" fill="#E9C9A6" />
      <rect x="61" y="14" width="34" height="84" fill="#E9C9A6" />
      <path d="M14 40 H48 M61 40 H95" />
      <circle cx="41" cy="62" r="2" fill={BROWN} />
      <circle cx="68" cy="62" r="2" fill={BROWN} />
    </g>
  ),
  thread: (
    <>
      <rect x="34" y="14" width="42" height="12" rx="4" fill={BROWN} />
      <rect x="34" y="84" width="42" height="12" rx="4" fill={BROWN} />
      <rect x="38" y="26" width="34" height="58" fill={PINK} />
      <path d="M38 38 H72 M38 50 H72 M38 62 H72 M38 74 H72" stroke="#C94F80" strokeWidth="3" />
      <path d="M72 70 Q96 76 88 100" stroke={PINK} strokeWidth="4" fill="none" strokeLinecap="round" />
    </>
  ),
  white: <circle cx="55" cy="55" r="36" fill="#FFFFFF" stroke={GREY} strokeWidth="5" />,
  spring: (
    <>
      <path d="M8 96 Q30 60 44 78 Q54 50 68 76 Q84 60 102 96 Z" fill="#A9B4BF" />
      <path d="M55 70 V24 M55 30 Q38 30 34 46 M55 30 Q72 30 76 46" stroke={BLUE} strokeWidth="7" fill="none" strokeLinecap="round" />
      <ellipse cx="55" cy="94" rx="30" ry="8" fill={BLUE} />
    </>
  ),
  wave: (
    <>
      <rect x="6" y="56" width="97" height="44" rx="10" fill={BLUE} />
      <path
        d="M6 60 Q18 36 34 54 Q46 34 60 54 Q74 34 86 54 Q96 42 103 58 V70 H6 Z"
        fill="#7CC4F2"
      />
      <path d="M20 80 Q30 72 40 80 M60 86 Q70 78 80 86" stroke="#FFFFFF" strokeWidth="4" fill="none" strokeLinecap="round" />
    </>
  ),
  pond: (
    <>
      <ellipse cx="55" cy="66" rx="46" ry="26" fill={BLUE} />
      <ellipse cx="55" cy="66" rx="46" ry="26" fill="none" stroke={GREEN} strokeWidth="6" />
      <ellipse cx="40" cy="62" rx="10" ry="5" fill={GREEN} />
      <path d="M62 72 q8 -8 16 0 q-8 8 -16 0 Z M78 72 l7 -5 v10 Z" fill="#F2994A" />
    </>
  ),
  sparkle: (
    <g fill={SUN}>
      <path d="M55 8 L64 44 L100 55 L64 66 L55 102 L46 66 L10 55 L46 44 Z" />
      <path d="M88 12 L91 24 L103 27 L91 30 L88 42 L85 30 L73 27 L85 24 Z" fill={MOON} />
    </g>
  ),
  flower: (
    <>
      <path d="M55 60 V102 M55 86 Q38 84 32 70 M55 92 Q72 90 78 76" stroke={GREEN} strokeWidth="6" fill="none" strokeLinecap="round" />
      <g fill={PINK}>
        <circle cx="55" cy="20" r="14" />
        <circle cx="33" cy="36" r="14" />
        <circle cx="77" cy="36" r="14" />
        <circle cx="41" cy="60" r="14" />
        <circle cx="69" cy="60" r="14" />
      </g>
      <circle cx="55" cy="42" r="11" fill={MOON} />
    </>
  ),
  line: (
    <>
      <path d="M8 78 Q36 20 58 58 T102 34" stroke={PINK} strokeWidth="7" fill="none" strokeLinecap="round" />
      <circle cx="8" cy="78" r="6" fill={PINK} />
      <circle cx="102" cy="34" r="6" fill={PINK} />
    </>
  ),
  between: (
    <>
      <g fill="#E9C9A6" stroke={BROWN} strokeWidth="6" strokeLinejoin="round">
        <rect x="10" y="12" width="26" height="88" />
        <rect x="73" y="12" width="26" height="88" />
      </g>
      <circle cx="55" cy="64" r="15" fill={SUN} />
      <path d="M40 30 H69 M40 30 l7 -6 M40 30 l7 6 M69 30 l-7 -6 M69 30 l-7 6" stroke="#2B2A33" strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
}

/** ほかの SVG の中に置くときの位置と大きさ(親の座標) */
type Box = { readonly x: number; readonly y: number; readonly size: number }

type Props = { readonly id: string; readonly className?: string; readonly box?: Box }

/** 部位や漢字の意味を表す絵(手描きアイコンの名前、または絵文字)。飾りなので読み上げ対象にはしない。 */
export function PartIcon({ id, className, box }: Props) {
  const placement = box ? { x: box.x, y: box.y, width: box.size, height: box.size } : {}
  return (
    <svg className={className} viewBox="0 0 109 109" aria-hidden="true" data-icon={id} {...placement}>
      {ICONS[id] ?? (
        <text x="54.5" y="56" fontSize="82" textAnchor="middle" dominantBaseline="central">
          {id}
        </text>
      )}
    </svg>
  )
}
