import { BackHair, BackHairBehind } from './headBack'
import { PALETTE, shade } from './palette'

/**
 * 人の あたま(かみ と 顔)。あたまの まんなか が 0,0、半径 1 の 大きさで描く(Person が 大きさを 合わせる)。
 * 横むき は 右(+x)を むいた 形で描く。左むき は Person が 左右 はんてん する。うしろむき は headBack.tsx。
 * 形は「休」「学」「村」の 人の あたま を もとに した(かみ の 形も 同じ)。
 */

/** かみがた。bun(おだんご)は おばあさん など に */
export type HairStyle = 'short' | 'bob' | 'ponytail' | 'pigtails' | 'bald' | 'bun'
/** 顔: ふつう・にっこり・大よろこび(口を あける)・びっくり・こまった・目をとじる */
export type Expression = 'normal' | 'smile' | 'joy' | 'surprised' | 'sad' | 'closed'

type HeadProps = {
  readonly view: 'side' | 'front' | 'back'
  readonly face: Expression
  readonly hairStyle: HairStyle
  readonly hair: string
  readonly skin: string
  readonly accent: string
  /** 正面の 目線(-1 = 画面の左 〜 1 = 右) */
  readonly gaze: number
}

const LINE = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const

/* ───── 横むき(右むき)───── */

/** みじかい かみ(「休」の人 と 同じ形) */
const SIDE_SHORT = 'M0.946 -0.174 C0.957 -1.174 -0.174 -1.457 -0.826 -0.826 C-1.087 -0.478 -1.087 0.152 -0.87 0.609 C-0.804 -0.022 -0.348 -0.478 0.391 -0.435 C0.63 -0.413 0.826 -0.304 0.946 -0.174 Z'
/** えりあし まで ある かみ(「学」の 女の子 と 同じ形) */
const SIDE_LONG = 'M0.97 -0.18 C1 -1.1 0.13 -1.4 -0.58 -1.13 C-1.18 -0.9 -1.21 0 -0.9 0.71 C-0.68 0.21 -0.47 -0.05 -0.24 -0.16 C0.08 -0.47 0.55 -0.53 0.97 -0.18 Z'
const SIDE_BOB = 'M0.97 -0.18 C1 -1.1 0.13 -1.42 -0.62 -1.12 C-1.24 -0.86 -1.3 0.1 -1.12 0.78 C-0.86 0.9 -0.52 0.84 -0.36 0.74 C-0.36 0.3 -0.32 0 -0.22 -0.18 C0.08 -0.47 0.55 -0.53 0.97 -0.18 Z'
const SIDE_TAIL = 'M-0.61 -0.97 C-1.24 -1.13 -1.79 -0.79 -1.82 -0.18 C-1.82 -0.05 -1.71 0 -1.63 -0.1 C-1.5 -0.37 -1.18 -0.5 -0.82 -0.42 Z'
/** おだんご: うしろ あたま の 上の ほう に まるく まとめる */
const SIDE_BUN: readonly [number, number, number] = [-0.86, -0.72, 0.4]
/** はげた あたま: うしろ の 耳の 高さ に だけ かみ が のこる */
const SIDE_BALD = 'M-0.2 0 C-0.6 -0.32 -1.06 -0.2 -1.05 0.28 C-1.03 0.6 -0.84 0.74 -0.6 0.68 C-0.66 0.42 -0.52 0.16 -0.2 0 Z'

function SideHairBack({ style, hair, accent }: { readonly style: HairStyle; readonly hair: string; readonly accent: string }) {
  if (style === 'ponytail') {
    return (
      <>
        <path d={SIDE_TAIL} fill={hair} />
        <circle cx="-0.62" cy="-0.9" r="0.17" fill={accent} />
      </>
    )
  }
  if (style === 'pigtails') return <circle cx="-0.98" cy="0.42" r="0.42" fill={hair} />
  if (style === 'bun') return <circle cx={SIDE_BUN[0]} cy={SIDE_BUN[1]} r={SIDE_BUN[2]} fill={shade(hair, 0.1)} />
  return null
}

function SideHair({ style, hair, accent }: { readonly style: HairStyle; readonly hair: string; readonly accent: string }) {
  if (style === 'bald') return <path d={SIDE_BALD} fill={hair} />
  if (style === 'short' || style === 'bun') return <path d={SIDE_SHORT} fill={hair} />
  return (
    <>
      <path d={style === 'bob' ? SIDE_BOB : SIDE_LONG} fill={hair} />
      {style === 'pigtails' && <circle cx="-0.82" cy="0.14" r="0.17" fill={accent} />}
    </>
  )
}

function SideFace({ face, hair }: { readonly face: Expression; readonly hair: string }) {
  const eye = PALETTE.eye
  const mouth = PALETTE.mouth
  const arcEye = face === 'smile' || face === 'joy'
  return (
    <>
      <circle cx="0.4" cy="0.46" r="0.23" fill={PALETTE.cheek} opacity="0.55" />
      {arcEye && <path d="M0.36 0.12 Q0.52 -0.08 0.68 0.12" stroke={eye} strokeWidth="0.13" {...LINE} />}
      {face === 'closed' && <path d="M0.7 0.03 Q0.52 0.22 0.35 0.03" stroke={eye} strokeWidth="0.13" {...LINE} />}
      {(face === 'normal' || face === 'sad') && <circle cx="0.52" cy="0.1" r="0.125" fill={eye} />}
      {face === 'surprised' && (
        <>
          <circle cx="0.52" cy="0.08" r="0.18" fill={eye} />
          <circle cx="0.48" cy="0.03" r="0.06" fill="#ffffff" />
          <path d="M0.36 -0.2 L0.7 -0.28" stroke={hair} strokeWidth="0.12" {...LINE} />
        </>
      )}
      {face === 'sad' && <path d="M0.72 -0.09 L0.39 0.04" stroke={hair} strokeWidth="0.12" {...LINE} />}
      {face === 'normal' && <path d="M0.42 0.55 Q0.56 0.66 0.68 0.54" stroke={mouth} strokeWidth="0.12" {...LINE} />}
      {face === 'smile' && <path d="M0.37 0.52 Q0.57 0.75 0.78 0.55" stroke={mouth} strokeWidth="0.13" {...LINE} />}
      {face === 'joy' && <path d="M0.79 0.5 Q0.59 0.94 0.32 0.53 Z" fill={mouth} />}
      {face === 'surprised' && <ellipse cx="0.64" cy="0.66" rx="0.14" ry="0.19" fill={mouth} />}
      {face === 'sad' && <path d="M0.75 0.75 Q0.57 0.56 0.38 0.73" stroke={mouth} strokeWidth="0.12" {...LINE} />}
      {face === 'closed' && <ellipse cx="0.63" cy="0.6" rx="0.1" ry="0.11" fill={mouth} />}
    </>
  )
}

/* ───── 正面 ───── */

/** まえがみ(「学」の 子 と 同じ形) */
const FRONT_BANGS = 'M-1.04 0.21 C-1.16 -0.84 -0.53 -1.26 0.05 -1.24 C0.68 -1.21 1.17 -0.79 1.04 0.21 C0.95 -0.18 0.82 -0.37 0.61 -0.42 C0.39 -0.29 0.11 -0.29 -0.08 -0.45 C-0.29 -0.32 -0.61 -0.32 -0.82 -0.39 C-0.92 -0.21 -1 0 -1.04 0.21 Z'
const FRONT_BOB = 'M-1.13 0.65 C-1.25 -0.48 -0.75 -1.18 0 -1.18 C0.75 -1.18 1.25 -0.48 1.13 0.65 C0.94 0.77 0.8 0.72 0.75 0.58 L-0.75 0.58 C-0.8 0.72 -0.94 0.77 -1.13 0.65 Z'
const FRONT_TAIL = 'M-0.61 -1 C-1.16 -1.24 -1.76 -1 -1.92 -0.45 C-1.95 -0.29 -1.84 -0.21 -1.75 -0.33 C-1.55 -0.58 -1.24 -0.63 -0.89 -0.45 Z'
/** ふたつ むすび の まえがみ(「村」の 女の子 と 同じ形) */
const FRONT_PIG_BANGS = 'M-1.012 -0.193 Q-0.988 -1.289 0 -1.289 Q0.988 -1.289 1.012 -0.193 Q0.53 -0.771 0 -0.675 Q-0.53 -0.771 -1.012 -0.193 Z'
/** おだんご の 人の まえがみ: まんなか で わけて うしろへ なでつける(ひたい が 見える) */
const FRONT_SWEPT = 'M-1.04 0.24 C-1.16 -0.84 -0.53 -1.26 0 -1.24 C0.53 -1.26 1.16 -0.84 1.04 0.24 C0.96 -0.2 0.8 -0.46 0.5 -0.56 Q0.2 -0.62 0 -0.5 Q-0.2 -0.62 -0.5 -0.56 C-0.8 -0.46 -0.96 -0.2 -1.04 0.24 Z'

function FrontHairBack({ style, hair, accent }: { readonly style: HairStyle; readonly hair: string; readonly accent: string }) {
  if (style === 'bob') return <path d={FRONT_BOB} fill={hair} />
  if (style === 'ponytail') {
    return (
      <>
        <path d={FRONT_TAIL} fill={hair} />
        <circle cx="-0.72" cy="-0.74" r="0.2" fill={accent} />
      </>
    )
  }
  if (style === 'pigtails') {
    return (
      <>
        <circle cx="-1.18" cy="0.48" r="0.43" fill={hair} />
        <circle cx="1.18" cy="0.48" r="0.43" fill={hair} />
        <ellipse cx="0" cy="-0.145" rx="1.2" ry="1.157" fill={hair} />
      </>
    )
  }
  // おだんご は あたまの うしろ。てっぺん から 少し のぞく
  if (style === 'bun') return <circle cx="0" cy="-1.1" r="0.32" fill={shade(hair, 0.1)} />
  return null
}

function FrontHair({ style, hair, accent }: { readonly style: HairStyle; readonly hair: string; readonly accent: string }) {
  if (style === 'bald') {
    return (
      <>
        <ellipse cx="-0.98" cy="0.05" rx="0.2" ry="0.34" fill={hair} />
        <ellipse cx="0.98" cy="0.05" rx="0.2" ry="0.34" fill={hair} />
      </>
    )
  }
  if (style === 'pigtails') {
    return (
      <>
        <path d={FRONT_PIG_BANGS} fill={hair} />
        <circle cx="-1.01" cy="0" r="0.18" fill={accent} />
        <circle cx="1.01" cy="0" r="0.18" fill={accent} />
      </>
    )
  }
  return <path d={style === 'bun' ? FRONT_SWEPT : FRONT_BANGS} fill={hair} />
}

function FrontFace({ face, hair, gaze }: { readonly face: Expression; readonly hair: string; readonly gaze: number }) {
  const eye = PALETTE.eye
  const mouth = PALETTE.mouth
  const look = Math.max(-1, Math.min(1, gaze)) * 0.12
  return (
    <>
      {[-1, 1].map((s) => (
        <g key={s}>
          <circle cx={s * 0.6} cy="0.42" r="0.22" fill={PALETTE.cheek} opacity="0.55" />
          {(face === 'smile' || face === 'joy') && <path d={`M${s * 0.5} 0.14 Q${s * 0.36} -0.06 ${s * 0.22} 0.14`} stroke={eye} strokeWidth="0.12" {...LINE} />}
          {face === 'closed' && <path d={`M${s * 0.5} 0.08 Q${s * 0.36} 0.24 ${s * 0.22} 0.08`} stroke={eye} strokeWidth="0.12" {...LINE} />}
          {(face === 'normal' || face === 'sad') && <circle cx={s * 0.36 + look} cy="0.1" r="0.14" fill={eye} />}
          {face === 'surprised' && (
            <>
              <circle cx={s * 0.36 + look} cy="0.08" r="0.18" fill={eye} />
              <circle cx={s * 0.36 + look - 0.05} cy="0.03" r="0.06" fill="#ffffff" />
            </>
          )}
          {face === 'sad' && <path d={`M${s * 0.52} -0.1 L${s * 0.24} -0.2`} stroke={hair} strokeWidth="0.1" {...LINE} />}
        </g>
      ))}
      {face === 'normal' && <path d="M-0.18 0.5 Q0 0.66 0.18 0.5" stroke={mouth} strokeWidth="0.12" {...LINE} />}
      {face === 'smile' && <path d="M-0.24 0.46 Q0 0.72 0.24 0.46" stroke={mouth} strokeWidth="0.12" {...LINE} />}
      {face === 'joy' && <path d="M-0.26 0.44 Q0 0.9 0.26 0.44 Z" fill={mouth} />}
      {face === 'surprised' && <ellipse cx="0" cy="0.6" rx="0.12" ry="0.16" fill={mouth} />}
      {face === 'sad' && <path d="M-0.2 0.62 Q0 0.48 0.2 0.62" stroke={mouth} strokeWidth="0.12" {...LINE} />}
      {face === 'closed' && <path d="M-0.12 0.52 Q0 0.6 0.12 0.52" stroke={mouth} strokeWidth="0.12" {...LINE} />}
    </>
  )
}

/** あたま ひとつ。かみ の うしろ → かお → かみ の まえ → 目・口 の じゅんに かさねる(うしろむき は 顔 なし) */
export function Head({ view, face, hairStyle, hair, skin, accent, gaze }: HeadProps) {
  if (view === 'back') {
    return (
      <>
        <BackHairBehind style={hairStyle} hair={hair} />
        <circle r="1" fill={skin} />
        <BackHair style={hairStyle} hair={hair} accent={accent} skin={skin} />
      </>
    )
  }
  if (view === 'side') {
    return (
      <>
        <SideHairBack style={hairStyle} hair={hair} accent={accent} />
        <circle r="1" fill={skin} />
        <SideHair style={hairStyle} hair={hair} accent={accent} />
        <SideFace face={face} hair={hair} />
      </>
    )
  }
  return (
    <>
      <FrontHairBack style={hairStyle} hair={hair} accent={accent} />
      <circle r="1" fill={skin} />
      <FrontHair style={hairStyle} hair={hair} accent={accent} />
      <FrontFace face={face} hair={hair} gaze={gaze} />
    </>
  )
}
