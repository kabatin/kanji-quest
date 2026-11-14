import type { MoreExpression } from './expressions'
import { PALETTE } from './palette'

/**
 * 顔(あとから 足した 気持ち)。head.tsx の Head が、この 顔 の ときだけ ここで 描く(もとの 6つ は head.tsx)。
 * あたまの まんなか が 0,0、半径 1。横むき は 右(+x)を むいた 顔。目 は 正面 (±0.36, 0.1)、横 (0.52, 0.1)。
 *   worried … こまった: まゆ が ハの字(内がわ が 上がる)、口 は への字
 *   angry   … おこった: まゆ が 内がわ で 下がる、口 は へ の 字 に ぎゅっ、おでこ に いかり の しるし
 *   cry     … なく: 目を ぎゅっと とじて なみだ が ながれ、口 を あけて なく
 *   sleepy  … ねむい: まぶた が 半分 さがり、口 は 小さく あくび
 *   strain  … ぐっと 力を 入れる: 目 は > <、歯 を くいしばる
 */

const LINE = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const
const r3 = (n: number) => Math.round(n * 1000) / 1000
const TEAR = PALETTE.water

/** いかり の しるし(おでこ の よこ の すじ 4本)。x, y は まんなか */
function AngerMark({ x, y }: { readonly x: number; readonly y: number }) {
  return (
    <path
      d={`M${r3(x - 0.24)} ${r3(y - 0.06)} Q${r3(x - 0.06)} ${r3(y - 0.06)} ${r3(x - 0.06)} ${r3(y - 0.24)} M${r3(x + 0.06)} ${r3(y - 0.24)} Q${r3(x + 0.06)} ${r3(y - 0.06)} ${r3(x + 0.24)} ${r3(y - 0.06)} M${r3(x + 0.24)} ${r3(y + 0.06)} Q${r3(x + 0.06)} ${r3(y + 0.06)} ${r3(x + 0.06)} ${r3(y + 0.24)} M${r3(x - 0.06)} ${r3(y + 0.24)} Q${r3(x - 0.06)} ${r3(y + 0.06)} ${r3(x - 0.24)} ${r3(y + 0.06)}`}
      stroke="#e8534a"
      strokeWidth="0.09"
      {...LINE}
    />
  )
}

/** なみだ: 目の 下 から ほほ を つたって ながれ、さき に しずく */
function Tear({ x, y, len }: { readonly x: number; readonly y: number; readonly len: number }) {
  return (
    <>
      <path d={`M${r3(x)} ${r3(y)} Q${r3(x + 0.04)} ${r3(y + len * 0.5)} ${r3(x - 0.02)} ${r3(y + len)}`} stroke={TEAR} strokeWidth="0.12" {...LINE} />
      <path d={`M${r3(x - 0.02)} ${r3(y + len - 0.04)} q0.1 0.14 0 0.2 q-0.1 -0.06 0 -0.2 Z`} fill={TEAR} />
    </>
  )
}

/** 正面の 顔(足した 気持ち)。lookX・lookY は 目線 で 目を ずらす はば */
export function FrontFaceMore({ face, hair, lookX, lookY }: { readonly face: MoreExpression; readonly hair: string; readonly lookX: number; readonly lookY: number }) {
  const eye = PALETTE.eye
  const mouth = PALETTE.mouth
  const dot = face === 'worried' || face === 'angry'
  return (
    <>
      {[-1, 1].map((s) => (
        <g key={s}>
          <circle cx={s * 0.6} cy="0.42" r="0.22" fill={PALETTE.cheek} opacity={face === 'angry' || face === 'strain' ? 0.85 : 0.55} />
          {dot && <circle cx={r3(s * 0.36 + lookX)} cy={r3(0.12 + lookY)} r="0.13" fill={eye} />}
          {face === 'worried' && <path d={`M${s * 0.54} -0.06 L${s * 0.2} -0.26`} stroke={hair} strokeWidth="0.1" {...LINE} />}
          {face === 'angry' && <path d={`M${s * 0.56} -0.26 L${s * 0.18} -0.06`} stroke={hair} strokeWidth="0.12" {...LINE} />}
          {face === 'cry' && (
            <>
              <path d={`M${s * 0.2} 0.08 Q${s * 0.36} 0.06 ${s * 0.52} 0.18`} stroke={eye} strokeWidth="0.12" {...LINE} />
              <path d={`M${s * 0.54} -0.12 L${s * 0.22} -0.24`} stroke={hair} strokeWidth="0.1" {...LINE} />
              <Tear x={s * 0.42} y={0.2} len={0.52} />
            </>
          )}
          {face === 'sleepy' && <path d={`M${s * 0.52} 0.1 Q${s * 0.36} 0.26 ${s * 0.2} 0.1 Z`} fill={eye} />}
          {face === 'strain' && <path d={`M${s * 0.52} -0.02 L${s * 0.24} 0.1 L${s * 0.52} 0.22`} stroke={eye} strokeWidth="0.12" {...LINE} />}
        </g>
      ))}
      {face === 'worried' && <path d="M-0.22 0.62 L-0.06 0.5 L0.22 0.62" stroke={mouth} strokeWidth="0.12" {...LINE} />}
      {face === 'angry' && (
        <>
          <path d="M-0.22 0.64 Q0 0.46 0.22 0.64" stroke={mouth} strokeWidth="0.13" {...LINE} />
          <AngerMark x={0.62} y={-0.72} />
        </>
      )}
      {face === 'cry' && <path d="M-0.26 0.6 Q0 0.42 0.26 0.6 Q0.22 0.88 0 0.88 Q-0.22 0.88 -0.26 0.6 Z" fill={mouth} />}
      {face === 'sleepy' && <ellipse cx="0.04" cy="0.6" rx="0.09" ry="0.11" fill={mouth} />}
      {face === 'strain' && (
        <>
          <rect x="-0.24" y="0.5" width="0.48" height="0.18" rx="0.07" fill="#ffffff" stroke={mouth} strokeWidth="0.07" />
          <path d="M-0.2 0.59 H0.2" stroke={mouth} strokeWidth="0.05" {...LINE} />
        </>
      )}
    </>
  )
}

/** 横むき の 顔(足した 気持ち)。lookY は 目線 の 上下 で 目を ずらす はば */
export function SideFaceMore({ face, hair, lookY }: { readonly face: MoreExpression; readonly hair: string; readonly lookY: number }) {
  const eye = PALETTE.eye
  const mouth = PALETTE.mouth
  return (
    <>
      <circle cx="0.4" cy="0.46" r="0.23" fill={PALETTE.cheek} opacity={face === 'angry' || face === 'strain' ? 0.85 : 0.55} />
      {(face === 'worried' || face === 'angry') && <circle cx="0.52" cy={r3(0.12 + lookY)} r="0.12" fill={eye} />}
      {face === 'worried' && (
        <>
          <path d="M0.74 -0.18 L0.38 -0.02" stroke={hair} strokeWidth="0.11" {...LINE} />
          <path d="M0.36 0.62 L0.52 0.53 L0.7 0.64" stroke={mouth} strokeWidth="0.12" {...LINE} />
        </>
      )}
      {face === 'angry' && (
        <>
          <path d="M0.36 -0.2 L0.74 -0.02" stroke={hair} strokeWidth="0.13" {...LINE} />
          <path d="M0.38 0.67 Q0.54 0.52 0.71 0.64" stroke={mouth} strokeWidth="0.13" {...LINE} />
          <AngerMark x={0.2} y={-0.74} />
        </>
      )}
      {face === 'cry' && (
        <>
          <path d="M0.66 0.08 Q0.5 0.06 0.36 0.17" stroke={eye} strokeWidth="0.13" {...LINE} />
          <path d="M0.72 -0.14 L0.38 -0.02" stroke={hair} strokeWidth="0.11" {...LINE} />
          <Tear x={0.48} y={0.2} len={0.5} />
          <path d="M0.38 0.56 Q0.56 0.45 0.76 0.54 Q0.7 0.8 0.54 0.8 Q0.4 0.77 0.38 0.56 Z" fill={mouth} />
        </>
      )}
      {face === 'sleepy' && (
        <>
          <path d="M0.36 0.08 Q0.52 0.24 0.68 0.08 Z" fill={eye} />
          <ellipse cx="0.64" cy="0.62" rx="0.08" ry="0.1" fill={mouth} />
        </>
      )}
      {face === 'strain' && (
        <>
          <path d="M0.68 -0.02 L0.42 0.1 L0.68 0.22" stroke={eye} strokeWidth="0.13" {...LINE} />
          <rect x="0.4" y="0.52" width="0.32" height="0.16" rx="0.06" fill="#ffffff" stroke={mouth} strokeWidth="0.07" />
        </>
      )}
    </>
  )
}
