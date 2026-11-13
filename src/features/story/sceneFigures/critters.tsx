import { wave } from '../sceneKit'
import { Layer } from '../sceneParts'
import { PALETTE } from './palette'

/**
 * よく出る 小さな 生きもの(小鳥・ちょうちょ)。場所 と 向き だけ わたせば 描ける。
 * どう とぶか(どこから どこへ)は、場面の がわ で x, y を 計算して わたす。
 */

/**
 * 小鳥(「休」の 小鳥 と 同じ)。x, y は 体の まんなか。
 * flying の ときは t で はねを ぱたぱた させる。とまっている ときは はねを たたむ。
 * はね は せなか から 出る(体の 上に かさねて描く)。
 */
export function Bird({ x, y, t = 0, flying = false, facing = 'left', size = 1, color = PALETTE.bird, dark = PALETTE.birdDark }: { readonly x: number; readonly y: number; readonly t?: number; readonly flying?: boolean; readonly facing?: 'left' | 'right'; readonly size?: number; readonly color?: string; readonly dark?: string }) {
  const flap = flying ? wave(t, 0.16) * 28 : 0
  return (
    <Layer x={x} y={y} scaleX={facing === 'left' ? size : -size} scaleY={size}>
      {/* しっぽ → 体 → あたま → くちばし → 目 → はね */}
      <path d="M2.6 0.4 l4.6 -1.6 l-3.4 3.2 Z" fill={dark} />
      <ellipse cx="0" cy="0" rx="4" ry="3.1" fill={color} />
      <circle cx="-3" cy="-2.3" r="2.3" fill={color} />
      <path d="M-5 -2.4 l-2.4 0.7 l2.3 0.9 Z" fill={PALETTE.beak} />
      <circle cx="-3.6" cy="-2.8" r="0.55" fill={PALETTE.eye} />
      <Layer rotate={flap} origin={[0.4, -0.6]}>
        <path d="M-1.2 -0.8 Q1.6 -3.8 4 -0.6 Q1.6 0.8 -1.2 -0.8 Z" fill={dark} />
      </Layer>
    </Layer>
  )
}

/**
 * ちょうちょ(「人」の ちょうちょ と 同じ)。x, y は 体の まんなか。
 * とんでいる 間は はやく、とまる(perched)と ゆっくり はねを ひらいたり とじたり する。
 */
export function Butterfly({ x, y, t, perched = false, size = 1, color = PALETTE.wing, dark = PALETTE.wingDark }: { readonly x: number; readonly y: number; readonly t: number; readonly perched?: boolean; readonly size?: number; readonly color?: string; readonly dark?: string }) {
  const flap = perched ? 0.35 + 0.65 * Math.abs(Math.cos((t / 1.1) * Math.PI)) : 0.25 + 0.75 * Math.abs(Math.cos((t / 0.22) * Math.PI))
  const tilt = perched ? 0 : wave(t, 1.8) * 10
  return (
    <Layer x={x} y={y} rotate={tilt} scale={size}>
      <Layer scaleX={flap}>
        <ellipse cx="-3.7" cy="-1.5" rx="3.9" ry="3.1" fill={color} transform="rotate(-22 -3.7 -1.5)" />
        <ellipse cx="3.7" cy="-1.5" rx="3.9" ry="3.1" fill={color} transform="rotate(22 3.7 -1.5)" />
        <ellipse cx="-2.6" cy="2.1" rx="2.5" ry="2.2" fill={dark} />
        <ellipse cx="2.6" cy="2.1" rx="2.5" ry="2.2" fill={dark} />
        <circle cx="-4" cy="-1.8" r="1" fill={PALETTE.wingDot} />
        <circle cx="4" cy="-1.8" r="1" fill={PALETTE.wingDot} />
      </Layer>
      <ellipse cx="0" cy="0.2" rx="0.8" ry="3" fill={PALETTE.hair} />
      <path d="M-0.3 -2.6 q-1 -1.8 -2.2 -2 M0.3 -2.6 q1 -1.8 2.2 -2" fill="none" stroke={PALETTE.hair} strokeWidth="0.5" strokeLinecap="round" />
    </Layer>
  )
}
