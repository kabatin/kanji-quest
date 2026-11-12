import type { ReactNode } from 'react'
import { getKanji } from '../../data/kanji'
import { fullGlyph, getStrokes } from '../../data/strokes'
import { strokeTones } from '../../lib/strokeTones'
import { clamp01, pose } from './sceneKit'

/**
 * 漢字の画を1本、絵の「ほね」として描く。画の線を そのまま使うので、絵と字の形が ぴったり合う。
 * (木の みき・人の うで など。色と太さだけ決めれば、場所は 画データが決める)
 *
 * from・to で、画の一部だけを描ける(0 = 書きはじめ / 1 = 書きおわり)。
 * たとえば「ノ」の下半分だけを うで にする、というときに使う。
 */
export function Bone({
  char,
  n,
  color,
  width,
  opacity = 1,
  from = 0,
  to = 1,
}: {
  readonly char: string
  readonly n: number
  readonly color: string
  readonly width: number
  readonly opacity?: number
  readonly from?: number
  readonly to?: number
}) {
  const [stroke] = getStrokes({ source: char, strokes: [n] })
  const start = clamp01(from)
  const length = clamp01(to) - start
  if (length <= 0) return null
  // 線の長さを 1 として、start から length ぶんだけ 見せる
  const part = length < 1 ? { pathLength: 1, strokeDasharray: `${length} 2`, strokeDashoffset: -start } : {}
  return <path d={stroke.d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} {...part} />
}

/**
 * 「ここが 字になるよ」の あいず。絵の ほね(画の線)を、白く ひからせる。
 * 絵が うすくなる ちょくぜん に、ふわっと出して 消す。
 */
export function BoneGlow({ char, opacity, width = 9 }: { readonly char: string; readonly opacity: number; readonly width?: number }) {
  if (opacity <= 0) return null
  return (
    <g opacity={opacity} fill="none" stroke="#ffffff" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      {getStrokes(fullGlyph(char)).map((stroke) => (
        <path key={stroke.d} d={stroke.d} />
      ))}
    </g>
  )
}

type InkProps = {
  readonly char: string
  /** 書く画(画番号。書く順)。省くと ぜんぶ */
  readonly strokes?: readonly number[]
  /** どこまで書けたか(0〜1)。画を1本ずつ、書き順どおりに のばしていく */
  readonly progress: number
  /** 部位の色に そまる度合い(0 = 墨色のまま / 1 = 部位の色) */
  readonly tint?: number
  readonly opacity?: number
}

/**
 * 漢字の画を、筆で書くように 1本ずつ あらわす。場面の さいごに 字を のこすのに使う。
 * progress が 1 のとき、えらんだ画が ぜんぶ書けている(その画には data-done が付く)。
 */
export function Ink({ char, strokes, progress, tint = 1, opacity = 1 }: InkProps) {
  const numbers = strokes ?? fullGlyph(char).strokes
  const tones = strokeTones(getKanji(char))
  const paths = getStrokes({ source: char, strokes: [...numbers] })
  return (
    <g className="scene-ink" opacity={opacity}>
      {paths.map((stroke, i) => {
        const own = clamp01(clamp01(progress) * numbers.length - i)
        if (own <= 0) return null
        const n = numbers[i]
        return (
          <g key={n}>
            {/* 下に墨色、上に部位の色を重ねて、tint で色が そまっていくように見せる */}
            <path className="story__stroke story__stroke--ink" d={stroke.d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - own} />
            <path
              className={`story__stroke story__stroke--${tones[n - 1]}`}
              d={stroke.d}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - own}
              opacity={clamp01(tint)}
              data-stroke={n}
              data-done={own >= 1}
            />
          </g>
        )
      })}
    </g>
  )
}

const SPARK_COLORS = ['#ffc233', '#ffffff', '#ff7a4d', '#ffd95a'] as const

/** できあがりの きらきら。まんなか(cx, cy)から 外へ とびちる。progress 0〜1。 */
export function Sparkles({ cx, cy, progress, reach = 46, count = 10 }: { readonly cx: number; readonly cy: number; readonly progress: number; readonly reach?: number; readonly count?: number }) {
  if (progress <= 0 || progress >= 1) return null
  return (
    <g opacity={1 - progress ** 2}>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + 0.3
        const distance = reach * (0.35 + 0.65 * progress) * (i % 2 === 0 ? 1 : 0.72)
        const size = (i % 3 === 0 ? 3.4 : 2.4) * (1 - progress * 0.4)
        return <Star key={i} cx={cx + Math.cos(angle) * distance} cy={cy + Math.sin(angle) * distance} r={size} color={SPARK_COLORS[i % SPARK_COLORS.length]} spin={progress * 180 + i * 40} />
      })}
    </g>
  )
}

/** 4つの とがりの ほし。 */
export function Star({ cx, cy, r, color, spin = 0 }: { readonly cx: number; readonly cy: number; readonly r: number; readonly color: string; readonly spin?: number }) {
  const d = `M0 ${-r} Q${r * 0.22} ${-r * 0.22} ${r} 0 Q${r * 0.22} ${r * 0.22} 0 ${r} Q${-r * 0.22} ${r * 0.22} ${-r} 0 Q${-r * 0.22} ${-r * 0.22} 0 ${-r} Z`
  return <path d={d} fill={color} transform={pose({ x: cx, y: cy, rotate: spin })} />
}

/** 絵の まとまり。場所・回転・大きさ・こさ を まとめて指定する。 */
export function Layer({
  children,
  opacity = 1,
  ...transform
}: {
  readonly children: ReactNode
  readonly opacity?: number
  readonly x?: number
  readonly y?: number
  readonly rotate?: number
  readonly scale?: number
  readonly scaleX?: number
  readonly scaleY?: number
  readonly origin?: readonly [number, number]
}) {
  if (opacity <= 0) return null
  return (
    <g transform={pose(transform)} opacity={opacity}>
      {children}
    </g>
  )
}
