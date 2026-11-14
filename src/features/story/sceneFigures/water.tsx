import { clamp01 } from '../sceneKit'
import { PALETTE, shade } from './palette'

/**
 * 水べ: 池(まるい 水たまり)・川(よこに ながれる 帯)。どちらも t で 水面 が 動く。
 * 地面に ある ので、人や 木 より 先に(おく に)描く。
 */

const r2 = (n: number) => Math.round(n * 100) / 100

/** 池。x, y は まんなか、rx・ry は 水面 の 大きさ。ripple で 水の わ を ひろげる(0 = なし) */
export function Pond({ t, x, y, rx = 22, ry = 6, ripple = 1, fill = 1 }: { readonly t: number; readonly x: number; readonly y: number; readonly rx?: number; readonly ry?: number; readonly ripple?: number; readonly fill?: number }) {
  const level = clamp01(fill)
  const ring = (offset: number, cx: number, cy: number) => {
    const p = (((t * 0.5 + offset) % 1) + 1) % 1
    return <ellipse key={offset} cx={r2(cx)} cy={r2(cy)} rx={r2(1 + p * rx * 0.28)} ry={r2(0.5 + p * ry * 0.4)} fill="none" stroke={PALETTE.waterLight} strokeWidth="0.7" opacity={r2((1 - p) * ripple)} />
  }
  return (
    <g data-part="pond">
      {/* ふち の 土 と 草 */}
      <ellipse cx={x} cy={r2(y + 0.6)} rx={r2(rx + 2.4)} ry={r2(ry + 1.6)} fill={shade(PALETTE.grass, 0.18)} />
      {level > 0 && (
        <>
          <ellipse cx={x} cy={r2(y + 0.6)} rx={r2(rx * level)} ry={r2(ry * level)} fill={PALETTE.waterDark} />
          <ellipse cx={x} cy={y} rx={r2(rx * level)} ry={r2(ry * level * 0.9)} fill={PALETTE.water} />
          {/* ひかる ところ */}
          <path d={`M${r2(x - rx * 0.6 * level)} ${r2(y - ry * 0.3 * level)} Q${r2(x - rx * 0.35 * level)} ${r2(y - ry * 0.7 * level)} ${r2(x - rx * 0.05 * level)} ${r2(y - ry * 0.72 * level)}`} fill="none" stroke={PALETTE.waterLight} strokeWidth="1" strokeLinecap="round" />
          {ripple > 0 && level >= 1 && (
            <>
              {ring(0, x + rx * 0.25, y + ry * 0.1)}
              {ring(0.5, x - rx * 0.3, y + ry * 0.25)}
            </>
          )}
        </>
      )}
    </g>
  )
}

/**
 * 川。画面を よこぎる 帯(y は 上の きし、width は はば)。flow は ながれ の むき と はやさ(1 = 右へ、-1 = 左へ)。
 * きし は 少し まがり、水面 に ながれ の すじ が うごく。
 */
export function River({ t, y, width = 10, flow = 1, bank = PALETTE.soil }: { readonly t: number; readonly y: number; readonly width?: number; readonly flow?: number; readonly bank?: string }) {
  const top = (x: number) => y + Math.sin(x * 0.07) * 0.8
  const bottom = (x: number) => y + width + Math.sin(x * 0.05 + 1) * 1
  const xs = Array.from({ length: 12 }, (_, i) => -2 + i * 10.3)
  const edge = (f: (x: number) => number) => xs.map((x) => `${r2(x)} ${r2(f(x))}`).join(' L')
  const reversed = [...xs].reverse()
  const body = `M${edge(top)} L${reversed.map((x) => `${r2(x)} ${r2(bottom(x))}`).join(' L')} Z`
  const shift = (((t * 6 * flow) % 22) + 22) % 22
  return (
    <g data-part="river">
      {/* きし(土)→ 水 → 水の すじ */}
      <path d={`M${edge((x) => top(x) - 1.2)} L${reversed.map((x) => `${r2(x)} ${r2(bottom(x) + 1.4)}`).join(' L')} Z`} fill={bank} opacity="0.55" />
      <path d={body} fill={PALETTE.water} />
      <path d={`M${edge(top)} L${reversed.map((x) => `${r2(x)} ${r2(top(x) + width * 0.28)}`).join(' L')} Z`} fill={PALETTE.waterDark} opacity="0.45" />
      <g stroke={PALETTE.waterLight} strokeWidth="0.8" strokeLinecap="round">
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const sx = ((i * 22 + shift + (i % 2) * 9) % 132) - 11
          const sy = y + width * (0.45 + ((i * 3) % 4) * 0.12)
          return <path key={i} d={`M${r2(sx)} ${r2(sy)} h${r2(4 + (i % 3) * 1.6)}`} />
        })}
      </g>
    </g>
  )
}
