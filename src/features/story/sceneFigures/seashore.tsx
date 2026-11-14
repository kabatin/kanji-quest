import { byTime, PALETTE, shade } from './palette'

/**
 * 海 と 砂はま(「歩」の 場面 の 海 を 部品 に した もの)。いちばん 下 に おく(Backdrop の かわり)。
 *   <Seashore t={t} horizon={40} shore={58} />
 * horizon は 水平線(海 と 空 の さかいめ)の y、shore は なみうちぎわ の y。shore より 下 は 砂はま。
 * なみ は t で うちよせて ひく(tide で 大きさ)。水平線 の すぐ下 は こい 青、海 の 上 に 白い なみ の すじ が ながれる。
 * sky に 色を わたすと、水平線 より 上 を ぬる(省くと 場面 の 下地 の 空 の まま)。time は 0 = 昼、1 = 夕方、2 = 夜。
 */

const r2 = (n: number) => Math.round(n * 100) / 100

/** 砂はま の もよう(てまえ ほど 大きい 少し こい 砂)。[x, 砂はま の 上 から の わりあい, はば] */
const RIPPLES: readonly (readonly [number, number, number])[] = [
  [46, 0.92, 8],
  [8, 0.8, 5],
  [86, 0.35, 6],
  [14, 0.28, 5],
  [64, 0.6, 4],
]

export function Seashore({ t, horizon = 40, shore = 58, tide = 1, sky, time = 0 }: { readonly t: number; readonly horizon?: number; readonly shore?: number; readonly tide?: number; readonly sky?: string; readonly time?: number }) {
  const sea = byTime(time, PALETTE.sea, '#f0a77e', '#2f4a7a')
  const seaDark = byTime(time, PALETTE.seaDark, '#d9866a', '#253d66')
  const sand = byTime(time, PALETTE.sand, '#f2cf9a', '#5a5f72')
  const foam = byTime(time, PALETTE.foam, '#fff1e2', '#c9d6e6')
  const drift = Math.sin((t / 2.6) * Math.PI * 2) * 2 * tide
  const swell = drift * 0.4
  // なみうちぎわ: 3つ の 山 が うちよせて ひく
  const surf = `M-2 ${r2(shore + 1)} Q12 ${r2(shore - 3.5 + swell)} 26 ${r2(shore + 0.5)} Q42 ${r2(shore + 5 - swell)} 58 ${r2(shore + 0.5)} Q76 ${r2(shore - 3.5 + swell)} 92 ${r2(shore + 0.5)} Q102 ${r2(shore + 3)} 111 ${r2(shore)}`
  const band = (shore - horizon) * 0.12
  return (
    <g data-part="seashore">
      {sky && <rect x="-2" y="-2" width="113" height={r2(horizon + 3)} fill={sky} />}
      <rect x="-2" y={horizon} width="113" height={r2(shore - horizon + 2)} fill={sea} />
      <rect x="-2" y={horizon} width="113" height={r2(Math.max(1.2, band))} fill={seaDark} />
      {/* 海 の 上 の なみ の すじ(とおく ほど 小さい) */}
      <g stroke={foam} strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.8" transform={`translate(${r2(drift)} 0)`}>
        {[
          [8, 0.4, 1],
          [70, 0.28, 0.8],
          [92, 0.62, 1],
          [22, 0.72, 1.2],
        ].map(([x, k, s]) => (
          <path key={x} d={`M${x} ${r2(horizon + (shore - horizon) * k)} q${r2(3 * s)} ${r2(-1.6 * s)} ${r2(6 * s)} 0`} />
        ))}
      </g>
      <rect x="-2" y={shore} width="113" height={r2(111 - shore)} fill={sand} />
      <path d={`${surf} V${r2(shore - 8)} H-2 Z`} fill={sea} />
      <path d={surf} fill="none" stroke={foam} strokeWidth="1.6" strokeLinecap="round" />
      <g fill={time <= 0 ? PALETTE.sandDark : shade(sand, 0.06)}>
        {RIPPLES.map(([x, k, w]) => (
          <ellipse key={x} cx={x} cy={r2(shore + 6 + (105 - shore - 6) * k)} rx={w} ry={r2(0.8 + k * 0.6)} />
        ))}
      </g>
    </g>
  )
}
