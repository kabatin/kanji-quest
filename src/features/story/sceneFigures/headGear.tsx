import { HAT_COLORS, type HatKind } from './looks'
import { mixColor, shade } from './palette'

/**
 * あたま に つける もの(ぼうし・めがね)。Look の hat・glasses で えらぶ と、Head が かみ と 顔 の 上に 描く。
 * あたまの まんなか が 0,0、半径 1 の 座標。横むき は 右(+x)を むいた 形(左むき は Person が はんてん する)。
 * 少し 上から 見ている ので、正面・うしろ の つば は 下へ ふくらんだ だ円 に 見える。
 *   cap    … 野球ぼう。つば は 顔の まえ だけ(うしろ から は 見えず、アジャスター の すきま から かみ が のぞく)
 *   school … 通学ぼう(黄色)。つば が ぐるりと 一周
 *   straw  … むぎわら ぼうし。ひろい つば と 赤い リボン
 *   knit   … ニット ぼう。耳 まで かぶり、おりかえし と ぼんぼり
 */

type View = 'side' | 'front' | 'back'

const RIBBON = '#e8534a'
const POM = '#fff6e6'
const LINE = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const

/** 正面・うしろ の まるい ぼうし の てっぺん(下の へり が y = base) */
const crown = (half: number, base: number, top: number) => `M${-half} ${base} C${-half * 1.05} ${top * 0.8} ${-half * 0.55} ${top} 0 ${top} C${half * 0.55} ${top} ${half * 1.05} ${top * 0.8} ${half} ${base} Z`

function Cap({ view, color, hair }: { readonly view: View; readonly color: string; readonly hair: string }) {
  const dark = shade(color, 0.22)
  if (view === 'side') {
    return (
      <>
        <path d="M-1.02 -0.26 C-1.1 -1 -0.52 -1.32 0.08 -1.26 C0.7 -1.2 1.04 -0.82 0.99 -0.3 Z" fill={color} />
        {/* つば: 顔の まえへ */}
        <path d="M0.62 -0.44 Q1.36 -0.5 1.7 -0.26 Q1.3 -0.14 0.7 -0.22 Z" fill={dark} />
        <path d="M-0.6 -1.02 Q0.1 -1.32 0.62 -0.98" stroke={dark} strokeWidth="0.06" {...LINE} />
        <circle cx="0.02" cy="-1.26" r="0.08" fill={dark} />
      </>
    )
  }
  if (view === 'front') {
    return (
      <>
        <path d={crown(1.03, -0.28, -1.32)} fill={color} />
        <path d="M0 -1.3 V-0.5" stroke={dark} strokeWidth="0.06" {...LINE} />
        {/* つば の 上の 面(少し 上から 見えている) */}
        <path d="M-0.94 -0.36 Q0 -0.6 0.94 -0.36 Q0.98 -0.12 0.68 -0.06 Q0 0.04 -0.68 -0.06 Q-0.98 -0.12 -0.94 -0.36 Z" fill={dark} />
        <circle cx="0" cy="-1.3" r="0.08" fill={dark} />
      </>
    )
  }
  return (
    <>
      <path d={crown(1.05, -0.24, -1.3)} fill={color} />
      {/* うしろ の アジャスター の すきま から かみ が のぞく */}
      <path d="M-0.24 -0.24 Q0 -0.6 0.24 -0.24 Z" fill={hair} />
      <path d="M-0.3 -0.3 H0.3" stroke={dark} strokeWidth="0.1" {...LINE} />
      <circle cx="0" cy="-1.28" r="0.08" fill={dark} />
    </>
  )
}

/** つば が 一周 ある ぼうし(通学ぼう・むぎわら)。brim は つば の 半分の はば、half は てっぺん の 半分の はば */
function BrimHat({ view, color, brim, half, top, band }: { readonly view: View; readonly color: string; readonly brim: number; readonly half: number; readonly top: number; readonly band?: string }) {
  const under = shade(color, 0.2)
  const base = -0.42
  if (view === 'side') {
    // 横から は つば を 横から 見る(うすい だ円)。てっぺん の 上に かさねて、顔の まえ にも うしろ にも 出る
    return (
      <>
        <path d={`M${-half} ${base} Q${-half * 1.05} ${top} 0 ${top} Q${half * 1.05} ${top} ${half} ${base} Z`} fill={color} />
        {band && <path d={`M${-half * 0.99} ${base - 0.1} H${half * 0.99}`} stroke={band} strokeWidth="0.2" {...LINE} />}
        <ellipse cx="0.04" cy={base + 0.02} rx={brim} ry="0.13" fill={under} />
        <ellipse cx="0.04" cy={base - 0.02} rx={brim - 0.04} ry="0.08" fill={color} />
      </>
    )
  }
  return (
    <>
      {/* つば の 上の 面 → てっぺん(つば の まんなか を かくす)→ リボン */}
      {/* つば の まえ の へり は まゆ の 上 まで(目に かからない) */}
      <ellipse cx="0" cy={base + 0.06} rx={brim} ry="0.35" fill={under} />
      <ellipse cx="0" cy={base} rx={brim - 0.04} ry="0.31" fill={mixColor(color, '#ffffff', 0.08)} />
      <path d={`M${-half} ${base} Q${-half * 1.05} ${top} 0 ${top} Q${half * 1.05} ${top} ${half} ${base} Z`} fill={color} />
      {band && <path d={`M${-half * 0.98} ${base - 0.12} Q0 ${base - 0.04} ${half * 0.98} ${base - 0.12}`} stroke={band} strokeWidth="0.2" {...LINE} />}
    </>
  )
}

function Knit({ view, color }: { readonly view: View; readonly color: string }) {
  const cuff = shade(color, 0.16)
  const ribs = shade(color, 0.3)
  const side = view === 'side'
  // 横 は 耳 の 上 から うしろ まで、正面・うしろ は 耳 まで かくす
  const base = side ? -0.2 : -0.14
  return (
    <>
      <path d={crown(1.07, base, -1.34)} fill={color} />
      <path d={`M-1.08 ${base - 0.3} Q0 ${base - 0.42} 1.08 ${base - 0.3} L1.07 ${base} Q0 ${base - 0.1} -1.07 ${base} Z`} fill={cuff} />
      {/* てっぺん の ぼんぼり */}
      <circle cx={side ? -0.08 : 0} cy="-1.4" r="0.28" fill={POM} />
      <g stroke={ribs} strokeWidth="0.05" {...LINE}>
        {[-0.7, -0.35, 0, 0.35, 0.7].map((x) => (
          <path key={x} d={`M${x} ${base - 0.36} v0.3`} />
        ))}
      </g>
    </>
  )
}

/** ぼうし。kind と 向き で 形を えらぶ。hair は うしろ の すきま から のぞく かみ の 色 */
export function Hat({ kind, view, color, hair }: { readonly kind: HatKind; readonly view: View; readonly color?: string; readonly hair: string }) {
  const c = color || HAT_COLORS[kind]
  return (
    <g data-part="hat">
      {kind === 'cap' && <Cap view={view} color={c} hair={hair} />}
      {kind === 'school' && <BrimHat view={view} color={c} brim={1.4} half={1.07} top={-1.62} />}
      {kind === 'straw' && <BrimHat view={view} color={c} brim={1.78} half={0.86} top={-1.42} band={RIBBON} />}
      {kind === 'knit' && <Knit view={view} color={c} />}
    </g>
  )
}

const FRAME = '#6b4a36'

/** めがね。正面 は まるい レンズ 2つ、横 は 目の まえ の レンズ と 耳 へ のびる つる、うしろ は 耳の 上の つる の はし だけ */
export function Glasses({ view, color = FRAME }: { readonly view: View; readonly color?: string }) {
  if (view === 'back') {
    return (
      <g data-part="glasses" stroke={color} strokeWidth="0.08" {...LINE}>
        <path d="M-1.03 -0.02 L-0.9 0.1 M1.03 -0.02 L0.9 0.1" />
      </g>
    )
  }
  if (view === 'side') {
    return (
      <g data-part="glasses" stroke={color} strokeWidth="0.07" {...LINE}>
        <path d="M0.46 0.02 L-0.32 -0.04 Q-0.42 0.02 -0.4 0.14" />
        <ellipse cx="0.66" cy="0.1" rx="0.17" ry="0.28" fill="#ffffff" fillOpacity="0.25" />
      </g>
    )
  }
  return (
    <g data-part="glasses" fill="#ffffff" fillOpacity="0.25" stroke={color} strokeWidth="0.07">
      <circle cx="-0.38" cy="0.1" r="0.3" />
      <circle cx="0.38" cy="0.1" r="0.3" />
      <path d="M-0.08 0.06 Q0 0 0.08 0.06" fill="none" />
    </g>
  )
}
