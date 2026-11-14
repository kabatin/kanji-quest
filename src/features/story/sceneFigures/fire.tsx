import { clamp01, wave } from '../sceneKit'
import { Layer } from '../sceneParts'
import { PALETTE } from './palette'

/**
 * 火: ほのお(ろうそく・たいまつ・かまど の 火 など)と、たき火(まき・石・ほのお・火の粉)。
 * ほのお は t で ゆらゆら する。size 0 で 何も 描かない(火が つく・きえる は size を かえる)。
 */

const r2 = (n: number) => Math.round(n * 100) / 100

/** ほのお ひとつ。x, y は ねもと、size 1 で 高さ 16 くらい。まわり を ぼんやり てらす(glow) */
export function Flame({ t, x, y, size = 1, glow = true }: { readonly t: number; readonly x: number; readonly y: number; readonly size?: number; readonly glow?: boolean }) {
  if (size <= 0) return null
  const flick = wave(t, 0.34)
  return (
    <g data-part="flame">
      {glow && <circle cx={x} cy={r2(y - 6 * size)} r={r2(14 * size)} fill={PALETTE.flameCore} opacity="0.28" />}
      <Layer x={x} y={y} scaleX={size * (1 - flick * 0.05)} scaleY={size * (0.92 + flick * 0.07)} rotate={flick * 3}>
        <path d="M0 0 C-5 -1 -6.5 -6 -3 -10.5 C-2.5 -8 -1.5 -7.5 -1 -8.5 C-1.2 -12 0.4 -14 1.2 -16.5 C3.2 -13 6.5 -9 5.4 -4.5 C4.8 -1.5 2.5 0 0 0 Z" fill={PALETTE.flame} />
        <path d="M0 0 C-3.6 -0.6 -4.4 -4.4 -2 -7.6 C-1.4 -5.8 -0.2 -5.6 0.4 -8.2 C2.8 -5.4 4 -1.6 0 0 Z" fill={PALETTE.flameMid} />
        <path d="M0 0 C-2 -0.3 -2.4 -2.4 -1 -4 C-0.6 -3 0.2 -3 0.4 -4.4 C1.8 -2.8 2 -0.8 0 0 Z" fill={PALETTE.flameCore} />
      </Layer>
    </g>
  )
}

/**
 * たき火。x, y は 地面(まき の まんなか)。lit(0〜1)で 火が ついて 大きく なる。
 * まき は ×の 字 に くみ、まわり を 石で かこむ。火の粉 が 上へ のぼって きえる。
 */
export function Campfire({ t, x, y, size = 1, lit = 1 }: { readonly t: number; readonly x: number; readonly y: number; readonly size?: number; readonly lit?: number }) {
  const s = size
  const fire = clamp01(lit)
  return (
    <g data-part="campfire">
      {/* 石(おく)→ まき → ほのお → 石(てまえ) */}
      {[-9, -4.5, 0, 4.5, 9].map((dx) => (
        <ellipse key={`back${dx}`} cx={r2(x + dx * s)} cy={r2(y - 1.4 * s)} rx={r2(2.4 * s)} ry={r2(1.5 * s)} fill={PALETTE.rockDark} />
      ))}
      <g stroke={PALETTE.bark} strokeWidth={r2(2.2 * s)} strokeLinecap="round">
        <path d={`M${r2(x - 7 * s)} ${r2(y - 0.2 * s)} L${r2(x + 6 * s)} ${r2(y - 3.6 * s)}`} />
        <path d={`M${r2(x + 7 * s)} ${r2(y - 0.2 * s)} L${r2(x - 6 * s)} ${r2(y - 3.6 * s)}`} />
      </g>
      <g fill={PALETTE.barkDark}>
        <circle cx={r2(x - 7 * s)} cy={r2(y - 0.2 * s)} r={r2(1.1 * s)} />
        <circle cx={r2(x + 7 * s)} cy={r2(y - 0.2 * s)} r={r2(1.1 * s)} />
      </g>
      <Flame t={t} x={x} y={y - 2 * s} size={0.9 * s * fire} />
      {fire > 0 &&
        [0, 0.33, 0.66].map((offset, i) => {
          const p = (((t * 0.8 + offset) % 1) + 1) % 1
          return <circle key={offset} cx={r2(x + (i - 1) * 2.4 * s + Math.sin(p * 7 + i) * 1.2 * s)} cy={r2(y - (8 + p * 14) * s)} r={r2(0.5 * s)} fill={PALETTE.ember} opacity={r2((1 - p) * fire)} />
        })}
      {[-11, -5.5, 0, 5.5, 11].map((dx) => (
        <ellipse key={`front${dx}`} cx={r2(x + dx * s)} cy={r2(y + 0.8 * s)} rx={r2(2.8 * s)} ry={r2(1.7 * s)} fill={PALETTE.rock} />
      ))}
    </g>
  )
}
