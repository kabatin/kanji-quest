import { clamp01, wave } from '../sceneKit'
import { byTime, mixColor, PALETTE } from './palette'

/**
 * 空(夕方・夜)・月・星。昼の 空 は 場面の 下地(うすい 水色)の まま なので、Sky は 何も 描かない。
 * time は 0 = 昼、1 = 夕方、2 = 夜(とちゅう も よい)。Backdrop・Room と 同じ。
 */

const r2 = (n: number) => Math.round(n * 100) / 100

/** 夕方・夜 の 空。わく いっぱい に ぬり、地平線 の あたり を 少し あかるく する */
export function Sky({ time }: { readonly time: number }) {
  const dusk = clamp01(time)
  if (dusk <= 0) return null
  const night = clamp01(time - 1)
  return (
    <g opacity={r2(dusk)}>
      <rect x="-2" y="-2" width="113" height="113" fill={mixColor(PALETTE.skyEvening, PALETTE.skyNight, night)} />
      <ellipse cx="54.5" cy="94" rx="72" ry="34" fill={byTime(time, PALETTE.horizonEvening, PALETTE.horizonEvening, PALETTE.horizonNight)} opacity={r2(0.6 - night * 0.25)} />
    </g>
  )
}

/**
 * 月。phase = 'full'(まんげつ)か 'crescent'(三日月。右が ひかる)。show は こさ(0〜1)。
 * まわりに ぼんやり ひかり、まんげつ には うすい もよう。
 */
export function Moon({ x, y, r = 6, phase = 'full', show = 1 }: { readonly x: number; readonly y: number; readonly r?: number; readonly phase?: 'full' | 'crescent'; readonly show?: number }) {
  if (show <= 0) return null
  return (
    <g opacity={r2(clamp01(show))}>
      <circle cx={x} cy={y} r={r2(r * 1.7)} fill={PALETTE.moonGlow} opacity="0.25" />
      {phase === 'full' ? (
        <>
          <circle cx={x} cy={y} r={r} fill={PALETTE.moon} />
          <circle cx={r2(x - r * 0.3)} cy={r2(y - r * 0.2)} r={r2(r * 0.22)} fill={PALETTE.moonShade} />
          <circle cx={r2(x + r * 0.35)} cy={r2(y + r * 0.3)} r={r2(r * 0.15)} fill={PALETTE.moonShade} />
        </>
      ) : (
        // 三日月: 外の 円 の 右がわ と、少し 右に ずらした 円 の 左がわ の あいだ
        <path d={`M${x} ${r2(y - r)} A${r} ${r} 0 1 1 ${x} ${r2(y + r)} A${r2(r * 0.78)} ${r} 0 1 0 ${x} ${r2(y - r)} Z`} fill={PALETTE.moon} transform={`translate(${r2(r * 0.25)} 0)`} />
      )}
    </g>
  )
}

/** 星の 場所(場面の 上の ほう。月 や 字 の じゃまに ならない ところ) */
const STARS: readonly (readonly [number, number])[] = [
  [8, 9], [24, 5], [39, 12], [56, 6], [71, 10], [97, 6], [104, 24], [8, 26], [30, 22], [62, 20],
]

/** 夜の 星。ちかちか ひかる。at で 場所を かえられる */
export function Stars({ t, show = 1, at = STARS }: { readonly t: number; readonly show?: number; readonly at?: readonly (readonly [number, number])[] }) {
  if (show <= 0) return null
  return (
    <g fill={PALETTE.star} opacity={r2(clamp01(show))}>
      {at.map(([x, y], i) => (
        <circle key={`${x}:${y}`} cx={x} cy={y} r={r2(Math.max(0, 0.75 + 0.3 * wave(t, 1.3, i * 0.37)))} />
      ))}
    </g>
  )
}
