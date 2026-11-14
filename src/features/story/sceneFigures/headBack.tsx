import type { ReactNode } from 'react'
import type { HairStyle } from './head'
import { shade } from './palette'

/** むすびめ(at)を じく に かみ の たば を まわす。0 度 の ときは 何も つつまない(いままで と 同じ 絵) */
export function Sway({ angle, at, children }: { readonly angle: number; readonly at: readonly [number, number]; readonly children: ReactNode }) {
  if (angle === 0) return children
  return <g transform={`rotate(${Math.round(angle * 1000) / 1000} ${at[0]} ${at[1]})`}>{children}</g>
}

/**
 * うしろ から 見た あたま(後頭部)。あたまの まんなか が 0,0、半径 1。
 * 見ているのは せなか がわ なので、画面の 右 が その人の 右(正面 と 左右 が ぎゃく)。
 * 顔は 見えない。かみ が あたまの ほとんど を おおい、下の ほう に えりあし(はだ)が のぞく。
 * かみがた は 正面・横 と 同じ 立体 に なるよう 合わせた:
 *   short    … みじかい かみ。えりあし は 耳の 高さ より 下まで
 *   bob      … かたの 上で そろえた かみ が、えりあし を すっかり おおう
 *   ponytail … かみ を 右うえ(正面では 左上 に 見える ところ)で むすび、たば が 外へ たれる
 *   pigtails … まんなか の わけめ から 左右に わけ、耳の 下で むすぶ
 *   bald     … てっぺん は はげて、耳の 高さ から えりあし に かけて 帯の ように のこる
 *   bun      … うしろ あたま の 上の ほう に おだんご
 */

/** みじかい かみ: てっぺん から 耳の 高さ まで おおい、えりあし は まんなか が 少し 下がる */
const BACK_SHORT = 'M-1.03 0.24 C-1.17 -0.62 -0.64 -1.13 0 -1.13 C0.64 -1.13 1.17 -0.62 1.03 0.24 Q0.86 0.44 0.5 0.46 Q0.2 0.48 0 0.6 Q-0.2 0.48 -0.5 0.46 Q-0.86 0.44 -1.03 0.24 Z'
/** えりあし まで ある かみ(ponytail・pigtails の もと) */
const BACK_LONG = 'M-1.06 0.34 C-1.2 -0.64 -0.66 -1.16 0 -1.16 C0.66 -1.16 1.2 -0.64 1.06 0.34 Q0.8 0.56 0.44 0.56 Q0.18 0.58 0 0.66 Q-0.18 0.58 -0.44 0.56 Q-0.8 0.56 -1.06 0.34 Z'
/** ボブ: 正面の ボブ と 同じ すその 高さ で、うしろ は ぜんぶ かみ */
const BACK_BOB = 'M-1.14 0.68 C-1.27 -0.5 -0.76 -1.18 0 -1.18 C0.76 -1.18 1.27 -0.5 1.14 0.68 Q0.6 0.86 0 0.82 Q-0.6 0.86 -1.14 0.68 Z'
/** ポニーテール の たば: 正面(FRONT_TAIL)を 左右 はんてん した 形。むすびめ の 高さ・がわ が 正面 と 同じ */
const BACK_TAIL = 'M0.61 -1 C1.16 -1.24 1.76 -1 1.92 -0.45 C1.95 -0.29 1.84 -0.21 1.75 -0.33 C1.55 -0.58 1.24 -0.63 0.89 -0.45 Z'
/** はげた あたま: 耳の 高さ から えりあし に かけて のこる かみ */
const BACK_BALD = 'M-1.03 -0.16 Q0 0.04 1.03 -0.16 C1.08 0.26 0.96 0.56 0.72 0.7 Q0 0.96 -0.72 0.7 C-0.96 0.56 -1.08 0.26 -1.03 -0.16 Z'

const LINE = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const

/** つむじ(うしろ あたま の しるし)。かみ より 少し こい うずまき */
function Crown({ hair, x = 0.12, y = -0.58 }: { readonly hair: string; readonly x?: number; readonly y?: number }) {
  return <path d={`M${x - 0.12} ${y + 0.02} q0.1 -0.16 0.22 -0.04 q0.06 0.14 -0.12 0.16`} stroke={shade(hair, 0.22)} strokeWidth="0.08" {...LINE} />
}

/** かみ の うしろ(あたまの 円 より おく): おだんご・ふたつむすび の たば は 円の よこに はみ出す。sway は たば の ゆれ(度) */
export function BackHairBehind({ style, hair, sway = 0 }: { readonly style: HairStyle; readonly hair: string; readonly sway?: number }) {
  if (style === 'pigtails') {
    return (
      <>
        <Sway angle={-sway} at={[-1.01, 0.04]}>
          <circle cx="-1.18" cy="0.48" r="0.43" fill={hair} />
        </Sway>
        <Sway angle={sway} at={[1.01, 0.04]}>
          <circle cx="1.18" cy="0.48" r="0.43" fill={hair} />
        </Sway>
      </>
    )
  }
  return null
}

/** かみ(あたまの 円 の 上に かさねる) */
export function BackHair({ style, hair, accent, skin, sway = 0 }: { readonly style: HairStyle; readonly hair: string; readonly accent: string; readonly skin: string; readonly sway?: number }) {
  const dark = shade(hair, 0.18)
  if (style === 'bald') return <path d={BACK_BALD} fill={hair} />
  if (style === 'short') {
    return (
      <>
        <path d={BACK_SHORT} fill={hair} />
        <Crown hair={hair} />
      </>
    )
  }
  if (style === 'bob') {
    return (
      <>
        <path d={BACK_BOB} fill={hair} />
        <path d="M-0.92 0.6 Q0 0.74 0.92 0.6" stroke={dark} strokeWidth="0.07" {...LINE} />
        <Crown hair={hair} />
      </>
    )
  }
  if (style === 'ponytail') {
    return (
      <>
        <path d={BACK_LONG} fill={hair} />
        {/* むすびめ へ あつまる かみ の すじ */}
        <path d="M-0.5 0.44 Q0.1 -0.1 0.62 -0.66 M0.34 0.5 Q0.5 -0.1 0.7 -0.62" stroke={dark} strokeWidth="0.06" {...LINE} />
        {/* うしろ から 見ると 左右 が はんたい なので、ゆれ も はんたい むき */}
        <Sway angle={-sway} at={[0.74, -0.76]}>
          <path d={BACK_TAIL} fill={hair} />
        </Sway>
        <circle cx="0.72" cy="-0.74" r="0.2" fill={accent} />
      </>
    )
  }
  if (style === 'pigtails') {
    return (
      <>
        <path d={BACK_LONG} fill={hair} />
        {/* まんなか の わけめ */}
        <path d="M0 -1.12 L0 0.6" stroke={skin} strokeWidth="0.07" {...LINE} />
        <circle cx="-1.01" cy="0.04" r="0.18" fill={accent} />
        <circle cx="1.01" cy="0.04" r="0.18" fill={accent} />
      </>
    )
  }
  // bun: おだんご は うしろ あたま の 上の ほう(横から 見た 場所 と 同じ 高さ)。かみ より 少し こく して 形を 見せる
  return (
    <>
      <path d={BACK_SHORT} fill={hair} />
      <path d="M-0.62 0.36 Q-0.3 -0.2 -0.08 -0.5 M0.62 0.36 Q0.3 -0.2 0.08 -0.5" stroke={dark} strokeWidth="0.06" {...LINE} />
      <circle cx="0" cy="-0.74" r="0.44" fill={shade(hair, 0.1)} />
      <path d="M-0.26 -0.86 q0.26 -0.18 0.52 0 M-0.2 -0.62 q0.2 0.12 0.4 0" stroke={shade(hair, 0.28)} strokeWidth="0.07" {...LINE} />
    </>
  )
}
