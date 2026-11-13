import { PALETTE } from './palette'

/**
 * 気持ち を見せる しるし(あせ・ためいき・ハート・つちけむり・はっ)。
 * show(0〜1)は こさ。during(t, 出る, きえる) を そのまま わたす。0 のときは 何も 描かない。
 * dir は しるしが とんでいく 向き(-1 = 左 / 1 = 右)。顔の うしろ がわ に とばすと 自然。
 */

const r2 = (n: number) => Math.round(n * 100) / 100

/** あせ: しずく が 2つ、くりかえし うしろへ とぶ(つかれた・あせった)。x, y は あたまの よこ */
export function Sweat({ t, x, y, show, dir = -1 }: { readonly t: number; readonly x: number; readonly y: number; readonly show: number; readonly dir?: number }) {
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.45].map((offset) => {
        const p = (((t + offset) % 0.9) + 0.9) % 0.9 / 0.9
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill={PALETTE.water} transform={`translate(${r2(x + dir * p * 9)} ${r2(y + p * 7 - Math.sin(p * Math.PI) * 5)}) rotate(${dir * 35})`} opacity={r2(1 - p)} />
      })}
    </g>
  )
}

/** ためいき・ひと息「ふう」: 口から 白い いき が ふくらみながら ながれる。p は 進みぐあい(0〜1)。x, y は 口 */
export function Sigh({ x, y, p, show = 1, dir = -1 }: { readonly x: number; readonly y: number; readonly p: number; readonly show?: number; readonly dir?: number }) {
  if (show <= 0) return null
  return (
    <g opacity={show} fill="#ffffff" stroke={PALETTE.sigh}>
      <ellipse cx={r2(x + dir * (4.5 + p * 9))} cy={r2(y - 1.4 - p * 5)} rx={r2(3 + p * 2.6)} ry={r2(2 + p * 1.6)} strokeWidth="0.7" />
      <ellipse cx={r2(x + dir * p * 6)} cy={r2(y - p * 2)} rx={r2(1.5 + p)} ry={r2(1.1 + p * 0.6)} strokeWidth="0.6" />
    </g>
  )
}

/** ハート: 2つ、くりかえし ふわっと のぼる(うれしい・すき)。x, y は のぼりはじめ */
export function Hearts({ t, x, y, show, color = PALETTE.heart }: { readonly t: number; readonly x: number; readonly y: number; readonly show: number; readonly color?: string }) {
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.5].map((offset, i) => {
        const p = (((t + offset) % 1) + 1) % 1
        return <path key={offset} d="M0 1.6 C-3 -0.6 -1.6 -3 0 -1.4 C1.6 -3 3 -0.6 0 1.6 Z" fill={color} opacity={r2(Math.sin(p * Math.PI))} transform={`translate(${r2(x + i * 5 + Math.sin(p * 6))} ${r2(y - p * 6)}) scale(${0.9 + i * 0.2})`} />
      })}
    </g>
  )
}

/** つちけむり: 地面から 左右へ ひろがって きえる(物が おちた・せりあがった・かけだした)。p は 進みぐあい(0〜1) */
export function Dust({ x, y, p, reach = 14, color = PALETTE.dust }: { readonly x: number; readonly y: number; readonly p: number; readonly reach?: number; readonly color?: string }) {
  if (p <= 0 || p >= 1) return null
  return (
    <g fill={color} opacity={r2((1 - p) * 0.95)}>
      {([-1, 1] as const).flatMap((side) => [0, 1, 2].map((i) => <circle key={`${side}:${i}`} cx={r2(x + side * reach * (0.55 + i * 0.22 + p * 0.35))} cy={r2(y - 0.6 - p * (1.4 + i * 1.2))} r={r2(1.2 + p * (1.6 + i * 0.6))} />))}
    </g>
  )
}

/** 「はっ」と 気づいた しるし: あたまの まわりに みじかい すじ 3本。x, y は あたまの まんなか、r は あたまの 半径 */
export function Notice({ x, y, r, show, dir = -1, color = PALETTE.notice }: { readonly x: number; readonly y: number; readonly r: number; readonly show: number; readonly dir?: number; readonly color?: string }) {
  if (show <= 0) return null
  return (
    <g opacity={show} stroke={color} strokeWidth="1.3" strokeLinecap="round">
      {[-5, 25, 55].map((deg) => {
        // dir の がわ の、よこ から ななめ上(角度は 上が +)
        const a = ((dir < 0 ? 180 - deg : deg) * Math.PI) / 180
        const near = r * 1.45
        const far = r * 1.95
        return <line key={deg} x1={r2(x + Math.cos(a) * near)} y1={r2(y - Math.sin(a) * near)} x2={r2(x + Math.cos(a) * far)} y2={r2(y - Math.sin(a) * far)} />
      })}
    </g>
  )
}
