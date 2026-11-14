import { mixColor, PALETTE, shade } from './palette'

/**
 * はこぶ 物: かご・バケツ・はこ。x, y は 物の まんなか(holdPose の at を そのまま わたせる)、width は はば。
 * 地面に おく ときは y = 地面 - 高さ の 半分。
 */

const r2 = (n: number) => Math.round(n * 100) / 100

type PropProps = { readonly x: number; readonly y: number; readonly width?: number }

/** かご(手さげ)。items に 色を ならべると、中の 物(くだもの・やさい)が ふち から のぞく */
export function Basket({ x, y, width = 12, items = [], handle = true }: PropProps & { readonly items?: readonly string[]; readonly handle?: boolean }) {
  const w = width
  const h = w * 0.62
  const top = y - h / 2
  const body = '#c99766'
  return (
    <g data-part="basket">
      {handle && <path d={`M${r2(x - w * 0.36)} ${r2(top)} Q${x} ${r2(top - h * 1.1)} ${r2(x + w * 0.36)} ${r2(top)}`} fill="none" stroke={shade(body, 0.2)} strokeWidth={r2(w * 0.07)} strokeLinecap="round" />}
      {items.map((color, i) => (
        <circle key={`${color}${i}`} cx={r2(x + (i - (items.length - 1) / 2) * w * 0.24)} cy={r2(top - w * 0.04 - (i % 2) * w * 0.06)} r={r2(w * 0.15)} fill={color} />
      ))}
      <path d={`M${r2(x - w / 2)} ${r2(top)} H${r2(x + w / 2)} L${r2(x + w * 0.38)} ${r2(y + h / 2)} H${r2(x - w * 0.38)} Z`} fill={body} />
      {/* あみめ */}
      <path d={`M${r2(x - w * 0.46)} ${r2(top + h * 0.38)} H${r2(x + w * 0.46)} M${r2(x - w * 0.42)} ${r2(top + h * 0.7)} H${r2(x + w * 0.42)} M${x} ${r2(top)} V${r2(y + h / 2)}`} stroke={shade(body, 0.18)} strokeWidth={r2(w * 0.05)} />
      <rect x={r2(x - w / 2 - w * 0.03)} y={r2(top - w * 0.05)} width={r2(w * 1.06)} height={r2(w * 0.11)} rx={r2(w * 0.05)} fill={shade(body, 0.12)} />
    </g>
  )
}

/** バケツ(木 の おけ)。water で 水面 を 見せる */
export function Bucket({ x, y, width = 10, water = false }: PropProps & { readonly water?: boolean }) {
  const w = width
  const h = w * 0.9
  const top = y - h / 2
  const wood = '#b9824f'
  return (
    <g data-part="bucket">
      <path d={`M${r2(x - w * 0.5)} ${r2(top)} Q${x} ${r2(top - h * 0.9)} ${r2(x + w * 0.5)} ${r2(top)}`} fill="none" stroke={PALETTE.rockDark} strokeWidth={r2(w * 0.06)} strokeLinecap="round" />
      <path d={`M${r2(x - w / 2)} ${r2(top)} H${r2(x + w / 2)} L${r2(x + w * 0.4)} ${r2(y + h / 2)} H${r2(x - w * 0.4)} Z`} fill={wood} />
      <ellipse cx={x} cy={r2(top)} rx={r2(w / 2)} ry={r2(w * 0.12)} fill={water ? PALETTE.water : shade(wood, 0.3)} />
      <g stroke={PALETTE.rockDark} strokeWidth={r2(w * 0.08)}>
        <path d={`M${r2(x - w * 0.47)} ${r2(top + h * 0.22)} H${r2(x + w * 0.47)}`} />
        <path d={`M${r2(x - w * 0.42)} ${r2(top + h * 0.78)} H${r2(x + w * 0.42)}`} />
      </g>
    </g>
  )
}

/** はこ(だんボール・木の はこ)。少し 上の 面 が 見える */
export function Crate({ x, y, width = 12, color = '#d9a76a', tape = true }: PropProps & { readonly color?: string; readonly tape?: boolean }) {
  const w = width
  const h = w * 0.7
  const lid = w * 0.18
  return (
    <g data-part="crate">
      <path d={`M${r2(x - w / 2 + lid * 0.6)} ${r2(y - h / 2 - lid)} H${r2(x + w / 2 - lid * 0.6)} L${r2(x + w / 2)} ${r2(y - h / 2)} H${r2(x - w / 2)} Z`} fill={mixColor(color, '#ffffff', 0.15)} />
      <rect x={r2(x - w / 2)} y={r2(y - h / 2)} width={w} height={r2(h)} rx="0.6" fill={shade(color, 0.12)} />
      {tape && <path d={`M${x} ${r2(y - h / 2 - lid)} V${r2(y + h / 2)}`} stroke="#f2dcae" strokeWidth={r2(w * 0.12)} />}
    </g>
  )
}
