import { backOut, clamp01 } from '../sceneKit'
import { Layer } from '../sceneParts'
import { PALETTE, shade } from './palette'

/**
 * 地面の もの: 岩・道・田畑。
 * 道 は「てまえ の はし」と「おく の はし」を わたす ので、横に のびる 道 も、おくへ ほそく なる 道 も 描ける。
 */

const r2 = (n: number) => Math.round(n * 100) / 100

/** 岩・石。x, y は 地面 の まんなか、size は はば の 半分。日は 左上 から あたる */
export function Rock({ x, y, size = 6, grow = 1, color = PALETTE.rock }: { readonly x: number; readonly y: number; readonly size?: number; readonly grow?: number; readonly color?: string }) {
  const pop = Math.max(0, backOut(clamp01(grow)))
  if (pop <= 0) return null
  const s = size
  const p = (u: number, v: number) => `${r2(x + u * s)} ${r2(y + v * s)}`
  return (
    <Layer scale={pop} origin={[x, y]}>
      <ellipse cx={x} cy={r2(y + 0.3)} rx={r2(s * 1.15)} ry={r2(s * 0.18)} fill="#000000" opacity="0.1" />
      <path d={`M${p(-1, 0)} Q${p(-1.05, -0.5)} ${p(-0.6, -0.78)} Q${p(-0.15, -1.08)} ${p(0.4, -0.86)} Q${p(1, -0.58)} ${p(1, 0)} Z`} fill={color} />
      {/* 日の あたる 面 と、下の かげ */}
      <path d={`M${p(-0.82, -0.36)} Q${p(-0.7, -0.74)} ${p(-0.2, -0.9)} Q${p(0.1, -0.96)} ${p(0.3, -0.84)} Q${p(-0.2, -0.72)} ${p(-0.4, -0.5)} Q${p(-0.6, -0.36)} ${p(-0.82, -0.36)} Z`} fill={PALETTE.rockLight} />
      <path d={`M${p(-1, 0)} Q${p(0, -0.24)} ${p(1, 0)} Z`} fill={shade(color, 0.2)} />
    </Layer>
  )
}

export type PathEnd = readonly [x: number, y: number, halfWidth: number]

/**
 * 道。near(てまえ の はし)から far(おく の はし)へ。[x, y, はば の 半分]。
 * bend で まん中 を 横へ まげる。おくへ のびる 道 は far の はば を 小さく する(walkDepth と いっしょに)。
 */
export function Path({ near, far, bend = 0, color = PALETTE.path }: { readonly near: PathEnd; readonly far: PathEnd; readonly bend?: number; readonly color?: string }) {
  const mid = [(near[0] + far[0]) / 2 + bend, (near[1] + far[1]) / 2, (near[2] + far[2]) / 2] as const
  // 道の むき に たいして 直角 に はば を とる(横に のびる 道 も、おくへ のびる 道 も)
  const dx = far[0] - near[0]
  const dy = far[1] - near[1]
  const len = Math.hypot(dx, dy) || 1
  const [nx, ny] = [-dy / len, dx / len]
  const side = (e: readonly [number, number, number], k: number) => `${r2(e[0] + nx * e[2] * k)} ${r2(e[1] + ny * e[2] * k)}`
  const d = `M${side(near, 1)} Q${side(mid, 1)} ${side(far, 1)} L${side(far, -1)} Q${side(mid, -1)} ${side(near, -1)} Z`
  return (
    <g data-part="path">
      <path d={d} fill={color} stroke={PALETTE.pathEdge} strokeWidth="0.8" strokeLinejoin="round" />
      {/* 小石 */}
      {[0.22, 0.5, 0.74].map((k, i) => (
        <circle key={k} cx={r2(near[0] + dx * k + nx * mid[2] * (i - 1) * 0.5 + bend * Math.sin(k * Math.PI))} cy={r2(near[1] + dy * k + ny * mid[2] * (i - 1) * 0.5)} r={r2(0.35 + (near[2] + (far[2] - near[2]) * k) * 0.05)} fill={PALETTE.pathEdge} />
      ))}
    </g>
  )
}

/**
 * はたけ・田んぼ。x, y は おく の へり の 左はし、width・depth は 大きさ(depth は 画面の 上下 の はば)。
 * 少し 上から 見た 形(おく の へり が てまえ より 少し みじかい)。
 * kind = 'crop'(はたけ: 土の うね に 芽)/ 'paddy'(田んぼ: 水 に いね。まわり に あぜ)。grow(0〜1)で 芽・いね が のびる。
 */
export function Field({ x, y, width = 40, depth = 10, kind = 'crop', grow = 1, rows = 3 }: { readonly x: number; readonly y: number; readonly width?: number; readonly depth?: number; readonly kind?: 'crop' | 'paddy'; readonly grow?: number; readonly rows?: number }) {
  const g = clamp01(grow)
  const paddy = kind === 'paddy'
  const inset = width * 0.06
  const shape = (pad: number) => `M${r2(x + inset + pad)} ${r2(y + pad)} H${r2(x + width - inset - pad)} L${r2(x + width - pad)} ${r2(y + depth - pad)} H${r2(x + pad)} Z`
  const rowY = (i: number) => y + depth * ((i + 0.75) / rows)
  return (
    <g data-part="field">
      {paddy ? (
        <>
          <path d={shape(0)} fill={shade(PALETTE.grass, 0.1)} stroke={shade(PALETTE.grass, 0.1)} strokeWidth="1.2" strokeLinejoin="round" />
          <path d={shape(1)} fill={PALETTE.paddyWater} />
        </>
      ) : (
        <path d={shape(0)} fill={PALETTE.soil} stroke={PALETTE.soil} strokeWidth="1" strokeLinejoin="round" />
      )}
      {Array.from({ length: rows }, (_, i) => {
        const ry = rowY(i)
        // おく の 列 ほど 小さく、みじかく
        const k = (i + 0.75) / rows
        const s = (0.7 + 0.3 * k) * g
        const left = x + inset * (1 - k) + 2
        const span = width - 2 * inset * (1 - k) - 4
        const count = Math.max(2, Math.round(width / 6))
        return (
          <g key={i}>
            {!paddy && <path d={`M${r2(left)} ${r2(ry + 0.5)} h${r2(span)}`} stroke={PALETTE.soilDark} strokeWidth="1.3" strokeLinecap="round" />}
            {s > 0 &&
              Array.from({ length: count }, (_, j) => {
                const px = left + (j + 0.5 + (i % 2) * 0.25) * (span / count)
                return paddy ? (
                  <path key={j} d={`M${r2(px - 1.6 * s)} ${r2(ry - 3.6 * s)} L${r2(px)} ${r2(ry)} L${r2(px + 1.6 * s)} ${r2(ry - 3.6 * s)} M${r2(px)} ${r2(ry)} V${r2(ry - 4.2 * s)}`} stroke={PALETTE.rice} strokeWidth="0.8" strokeLinecap="round" fill="none" />
                ) : (
                  <path key={j} d={`M${r2(px)} ${r2(ry)} q${r2(-2.2 * s)} ${r2(-0.6 * s)} ${r2(-2.4 * s)} ${r2(-2.6 * s)} q${r2(1.8 * s)} 0 ${r2(2.4 * s)} ${r2(2.6 * s)} q${r2(0.6 * s)} ${r2(-2 * s)} ${r2(2.4 * s)} ${r2(-2.6 * s)} q${r2(-0.2 * s)} ${r2(2 * s)} ${r2(-2.4 * s)} ${r2(2.6 * s)} Z`} fill={PALETTE.leaf} />
                )
              })}
          </g>
        )
      })}
    </g>
  )
}
