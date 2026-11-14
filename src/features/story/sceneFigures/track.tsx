import { backOut, clamp01 } from '../sceneKit'
import { Layer } from '../sceneParts'
import type { Point } from './limbs'
import { PALETTE, shade } from './palette'

/**
 * かけっこ・あるいた あと の もの: ゴール の ポール と テープ、足あと。
 *
 *   <GoalPole x={72} base={102} top={60} grow={span(t, 0.1, 0.7)} />
 *   <GoalTape a={[72, 62]} b={[56, 49]} pull={[3, 1]} range={[0.32, 1]} />   // 人 の おく の ぶん(人 の 前後 で 2つ に 分けて 描く)
 *   <GoalTape a={[72, 62]} b={[56, 49]} cut={span(t, BREAK, BREAK + 0.5)} />   // きれた あと: 両方 の ポール から たれる
 *   <Footprint x={40} y={97} facing="right" grow={span(t, at, at + 0.25)} />    // 足あと(walkPrints・runPrints の 場所 に おく)
 */

const r2 = (n: number) => Math.round(n * 100) / 100

/** ゴール の ポール(白 に 赤 の しま、てっぺん に 赤い 玉)。x は まんなか、base は 地面、top は てっぺん。grow で 下から のびる */
export function GoalPole({ x, base, top, grow = 1, width = 2.4, color = PALETTE.poleStripe }: { readonly x: number; readonly base: number; readonly top: number; readonly grow?: number; readonly width?: number; readonly color?: string }) {
  const rise = Math.max(0, backOut(clamp01(grow)))
  if (rise <= 0) return null
  const h = base - top
  return (
    <Layer scaleY={rise} origin={[x, base]}>
      <g data-part="goal-pole">
        <rect x={r2(x - width / 2)} y={top} width={width} height={r2(h)} rx={r2(width * 0.42)} fill="#ffffff" />
        {[0.25, 0.5, 0.75].map((k) => (
          <rect key={k} x={r2(x - width / 2)} y={r2(top + h * k)} width={width} height={r2(h * 0.12)} fill={color} />
        ))}
        <circle cx={x} cy={top} r={r2(width * 0.92)} fill={color} />
      </g>
    </Layer>
  )
}

/**
 * ゴール の テープ。a・b は 2本 の ポール の てっぺん(テープ を むすぶ 所)。
 * pull は テープ の まんなか が おされて ずれる はば([dx, dy]。はしる 人 の むね で のびる)。
 * range は 描く ぶん(0 = a 〜 1 = b)。人 の てまえ と おく に 分けて 描くと、人 が テープ の あいだ に 入る。
 * cut(0〜1)を わたすと、きれた あと: 両方 の ポール から テープ が たれさがる(cut は たれる 進みぐあい)。
 */
export function GoalTape({ a, b, pull = [0, 0], range = [0, 1], cut, show = 1, color = PALETTE.tape, width = 2.2 }: { readonly a: Point; readonly b: Point; readonly pull?: Point; readonly range?: readonly [number, number]; readonly cut?: number; readonly show?: number; readonly color?: string; readonly width?: number }) {
  if (show <= 0) return null
  if (cut !== undefined) {
    const fall = clamp01(cut)
    const mid: Point = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    // まんなか で きれて、それぞれ の ポール から 下へ たれる(長さ は テープ の 半分 の 少し 手前 まで)
    const half = (from: Point) => {
      const reach: Point = [(mid[0] - from[0]) * (0.55 - 0.3 * fall), (mid[1] - from[1]) * 0.55 + Math.hypot(mid[0] - from[0], mid[1] - from[1]) * 0.5 * fall]
      const ctrl: Point = [from[0] + reach[0] * 0.7, from[1] + reach[1] * 0.2]
      return `M${r2(from[0])} ${r2(from[1])} Q${r2(ctrl[0])} ${r2(ctrl[1])} ${r2(from[0] + reach[0])} ${r2(from[1] + reach[1])}`
    }
    return <path d={`${half(a)} ${half(b)}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" opacity={r2(clamp01(show))} data-part="goal-tape" />
  }
  const point = (k: number): Point => {
    const bow = Math.sin(k * Math.PI)
    return [a[0] + (b[0] - a[0]) * k + pull[0] * bow, a[1] + (b[1] - a[1]) * k + pull[1] * bow]
  }
  const steps = 8
  const [k0, k1] = range
  const pts = Array.from({ length: steps + 1 }, (_, i) => point(k0 + ((k1 - k0) * i) / steps))
  return <path d={pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${r2(p[0])} ${r2(p[1])}`).join(' ')} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" opacity={r2(clamp01(show))} data-part="goal-tape" />
}

/**
 * 足あと(地面 を 少し 上から 見た 形)。x, y は 足あと の まんなか、size は 長さ。
 * facing は つまさき の むき('right' | 'left' は 横に あるいた あと、'front' | 'back' は おくゆき に ならぶ あと)。
 * kind = 'shoe'(くつ。つまさき と かかと)/ 'bare'(はだし。指 の あと)。grow(0〜1)で ぺた と つく。
 */
export function Footprint({ x, y, size = 5, facing = 'right', kind = 'shoe', grow = 1, color = PALETTE.footprint }: { readonly x: number; readonly y: number; readonly size?: number; readonly facing?: 'left' | 'right' | 'front' | 'back'; readonly kind?: 'shoe' | 'bare'; readonly grow?: number; readonly color?: string }) {
  const pop = Math.max(0, backOut(clamp01(grow)))
  if (pop <= 0) return null
  // 横むき は 長さ が 横、おくゆき は 長さ が 上下(上から 見た ので 上下 は 0.3 に ちぢむ)
  const side = facing === 'left' || facing === 'right'
  const dir = facing === 'left' || facing === 'back' ? -1 : 1
  const along = (u: number, v: number): Point => (side ? [x + dir * u * size, y + v * size * 0.3] : [x + v * size, y + dir * u * size * 0.3])
  const oval = (u: number, v: number, ru: number, rv: number, fill: string, key: string) => {
    const [cx, cy] = along(u, v)
    return <ellipse key={key} cx={r2(cx)} cy={r2(cy)} rx={r2((side ? ru : rv) * size)} ry={r2((side ? rv : ru) * size * 0.3)} fill={fill} />
  }
  return (
    <Layer scale={pop} origin={[x, y]}>
      <g data-part="footprint">
        {kind === 'shoe' ? (
          <>
            {oval(0.16, 0, 0.32, 0.2, color, 'toe')}
            {oval(-0.3, 0, 0.17, 0.16, color, 'heel')}
          </>
        ) : (
          <>
            {oval(0, 0, 0.42, 0.2, color, 'sole')}
            {[-0.13, 0, 0.13].map((v, i) => oval(0.5 - Math.abs(v) * 0.6, v * 1.3, 0.07, 0.07, shade(color, 0.04), `toe${i}`))}
          </>
        )}
      </g>
    </Layer>
  )
}
