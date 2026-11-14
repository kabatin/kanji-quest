import { clamp01, wave } from '../sceneKit'
import { PALETTE } from './palette'

/**
 * 雨・雪・風。どれも t で ふりつづけ、amount(0〜1)で ふる 量 を かえる(0 なら 何も 描かない)。
 * 雨・雪 は left〜right の はば に ふり、ground で 地面に とどく(雨は ぴちゃっ と はねる)。
 */

const r2 = (n: number) => Math.round(n * 100) / 100
/** ふる ものの 列(x の ずれ と はじまり の ずれ)。ばらばらに 見える よう 先に きめておく */
const COLUMNS: readonly (readonly [number, number])[] = [
  [0, 0.1], [5.5, 0.62], [11, 0.31], [16.5, 0.85], [22, 0.47], [27.5, 0.05], [33, 0.71], [38.5, 0.26], [44, 0.92], [49.5, 0.4],
  [55, 0.15], [60.5, 0.66], [66, 0.35], [71.5, 0.8], [77, 0.52], [82.5, 0.09], [88, 0.74], [93.5, 0.22], [99, 0.58], [104.5, 0.96],
]

export type FallProps = {
  readonly t: number
  /** ふる 量(0〜1)。少ない ときは 列が へる */
  readonly amount?: number
  /** 地面の y(ここで とまる) */
  readonly ground?: number
  /** ふりはじめ の y(雲 の 下 など) */
  readonly top?: number
  readonly left?: number
  readonly right?: number
}

const columnsFor = (amount: number, left: number, right: number) =>
  COLUMNS.filter((_, i) => (i * 7) % 20 < Math.round(20 * clamp01(amount)))
    .map(([x, phase]) => [left + (x / 110) * (right - left), phase] as const)

/** 雨: ななめの すじ が ふり、地面で はねる */
export function Rain({ t, amount = 1, ground = 98, top = -4, left = -2, right = 111, color = PALETTE.rain }: FallProps & { readonly color?: string }) {
  if (amount <= 0) return null
  const fall = ground - top + 6
  return (
    <g opacity={r2(0.5 + 0.4 * clamp01(amount))} stroke={color} strokeWidth="0.9" strokeLinecap="round" fill="none">
      {columnsFor(amount, left, right).map(([x, phase]) => {
        const p = (((t * 1.1 + phase) % 1) + 1) % 1
        const y = top + p * fall
        const drop = y <= ground ? <path d={`M${r2(x + 0.8 + (y - top) * 0.06)} ${r2(y - 5)} L${r2(x + (y - top) * 0.06)} ${r2(y)}`} /> : null
        // 地面に ついたら 小さな わ が ひろがる
        const splash = y > ground ? (y - ground) / 6 : 0
        const sx = x + (ground - top) * 0.06
        return (
          <g key={x}>
            {drop}
            {splash > 0 && <ellipse cx={r2(sx)} cy={r2(ground)} rx={r2(0.6 + splash * 2.2)} ry={r2(0.3 + splash * 0.7)} strokeWidth="0.5" opacity={r2(1 - splash)} />}
          </g>
        )
      })}
    </g>
  )
}

/** 雪: まるい 雪が ゆらゆら 右左に ゆれながら ゆっくり おちる(白い 空 でも 見える よう ふち を うすい 青に) */
export function Snowfall({ t, amount = 1, ground = 98, top = -4, left = -2, right = 111 }: FallProps) {
  if (amount <= 0) return null
  const fall = ground - top
  return (
    <g fill={PALETTE.snow} stroke="#a9c8e6" strokeWidth="0.3">
      {columnsFor(amount, left, right).map(([x, phase], i) => {
        const p = (((t * 0.22 + phase) % 1) + 1) % 1
        const y = top + p * fall
        const size = 0.8 + ((i * 5) % 4) * 0.2
        return <circle key={x} cx={r2(x + wave(t, 2.4, phase) * 2.2)} cy={r2(y)} r={r2(size)} opacity={r2(Math.min(1, (1 - p) * 6))} />
      })}
    </g>
  )
}

/** 風: うずを まいた すじ が dir の ほうへ ながれて きえる。x, y は ふきはじめ の あたり */
export function Wind({ t, x, y, show = 1, dir = 1, reach = 30, color = '#b8cde0' }: { readonly t: number; readonly x: number; readonly y: number; readonly show?: number; readonly dir?: number; readonly reach?: number; readonly color?: string }) {
  if (show <= 0) return null
  return (
    <g opacity={r2(clamp01(show))} fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round">
      {[0, 0.36, 0.7].map((offset, i) => {
        const p = (((t * 0.9 + offset) % 1) + 1) % 1
        const sx = x + dir * p * reach
        const sy = y + i * 5 - 5
        const len = 9 + i * 2
        // まっすぐ すすんで、さいごに くるっと まく
        return <path key={offset} d={`M${r2(sx)} ${r2(sy)} h${r2(dir * len)} q${r2(dir * 3)} 0 ${r2(dir * 3)} -2.4 q0 -1.8 ${r2(-dir * 1.8)} -1.8`} opacity={r2(Math.sin(p * Math.PI))} />
      })}
    </g>
  )
}
