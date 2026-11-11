import type { ReactNode } from 'react'
import { MASCOT_FORMS } from '../lib/level'

const INK = '#27336b'
const INK_LIGHT = '#4a5aa8'
const SHU = '#e8452c'
const GOLD = '#ffc233'

const HATS: Record<string, ReactNode> = {
  mugiwara: (
    <>
      <ellipse cx="60" cy="33" rx="38" ry="8" fill="#e9c46a" stroke="#b8902f" strokeWidth="2" />
      <path d="M40 33 Q42 12 60 12 Q78 12 80 33 Z" fill="#f0d27e" stroke="#b8902f" strokeWidth="2" />
      <path d="M41 29 H79" stroke={SHU} strokeWidth="5" />
    </>
  ),
  ribbon: (
    <>
      <path d="M60 22 L40 10 V34 Z M60 22 L80 10 V34 Z" fill="#ff7aa8" stroke="#d94f80" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="60" cy="22" r="6" fill="#ff7aa8" stroke="#d94f80" strokeWidth="2" />
    </>
  ),
  megane: (
    <g fill="rgba(255,255,255,0.35)" stroke="#1b1b1b" strokeWidth="3">
      <circle cx="46" cy="62" r="12" />
      <circle cx="74" cy="62" r="12" />
      <path d="M58 62 H62" fill="none" />
    </g>
  ),
  hachimaki: (
    <>
      <path d="M33 50 Q60 38 87 50 L88 58 Q60 46 32 58 Z" fill="#fff" stroke="#c9d4de" strokeWidth="1.5" />
      <circle cx="60" cy="47" r="5" fill={SHU} />
      <path d="M87 52 L104 44 L100 54 L106 62 L88 58 Z" fill="#fff" stroke="#c9d4de" strokeWidth="1.5" strokeLinejoin="round" />
    </>
  ),
  hana: (
    <g transform="translate(76 34)">
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse key={angle} cx="0" cy="-8" rx="5.5" ry="8" fill="#ff9ec4" stroke="#e0669a" strokeWidth="1.5" transform={`rotate(${angle})`} />
      ))}
      <circle r="5" fill={GOLD} />
    </g>
  ),
  nekomimi: (
    <>
      <path d="M34 50 L30 22 L54 36 Z M86 50 L90 22 L66 36 Z" fill={INK} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M37 42 L35 29 L46 36 Z M83 42 L85 29 L74 36 Z" fill="#ff8fa3" />
    </>
  ),
  tongari: (
    <>
      <path d="M36 40 Q60 -20 70 2 Q64 8 84 40 Z" fill="#5a3fa8" stroke="#3a2578" strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="60" cy="40" rx="34" ry="7" fill="#6b4fc0" stroke="#3a2578" strokeWidth="2.5" />
      <path d="M58 22 l2.5 5 5.5 .8 -4 3.9 1 5.5 -5 -2.6 -5 2.6 1 -5.5 -4 -3.9 5.5 -.8z" fill={GOLD} />
    </>
  ),
  silk: (
    <>
      <rect x="42" y="2" width="36" height="34" rx="3" fill="#1b1b1b" />
      <rect x="42" y="26" width="36" height="7" fill={SHU} />
      <ellipse cx="60" cy="37" rx="32" ry="6" fill="#1b1b1b" />
    </>
  ),
  kanmuri: (
    <path
      d="M38 30 L42 8 L52 22 L60 4 L68 22 L78 8 L82 30 Z"
      fill={GOLD}
      stroke="#c98a00"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
  ),
}

type Props = {
  /** 成長の段階(0 始まり。lib/level の MASCOT_FORMS の順)。レベルが上がると変わる。 */
  readonly stage: number
  /** かぶっているもの(shop の名前。なければ none) */
  readonly hat?: string
  readonly className?: string
  /** よろこんでいる顔にする */
  readonly happy?: boolean
}

/** あいぼうの「すみまる」。墨のしずくに顔がついた、このアプリだけのキャラクター。 */
export function Mascot({ stage, hat = 'none', className, happy = false }: Props) {
  const safeStage = Math.min(Math.max(stage, 0), MASCOT_FORMS.length - 1)
  // はじめは小さく、すがたが変わるたびに少しずつ大きくなる
  const size = 0.72 + Math.min(safeStage, 4) * 0.07
  return (
    <svg className={className} viewBox="0 0 120 120" role="img" aria-label={`すみまる(${MASCOT_FORMS[safeStage].name})`} data-stage={safeStage}>
      <ellipse cx="60" cy="110" rx={30 * size} ry="6" fill="rgba(0,0,0,0.15)" />
      {safeStage >= 6 && (
        <g fill="none" stroke={GOLD} strokeLinecap="round">
          <circle cx="60" cy="62" r="52" strokeWidth="3" opacity="0.9" />
          <circle cx="60" cy="62" r="57" strokeWidth="2" strokeDasharray="2 9" opacity="0.8" />
        </g>
      )}
      <g transform={`translate(60 112) scale(${size}) translate(-60 -112)`}>
      {safeStage >= 7 && (
        <g fill="#fff8d6" stroke={GOLD} strokeWidth="2.5" strokeLinejoin="round">
          <path d="M26 66 Q-4 40 2 78 Q10 74 12 84 Q20 78 26 86 Z" />
          <path d="M94 66 Q124 40 118 78 Q110 74 108 84 Q100 78 94 86 Z" />
        </g>
      )}
      {safeStage >= 4 && <path d="M32 84 Q16 100 26 114 L50 98 Z M88 84 Q104 100 94 114 L70 98 Z" fill={SHU} />}
      {safeStage >= 2 && (
        <>
          <path d="M26 74 Q14 70 12 58" stroke={INK} strokeWidth="8" strokeLinecap="round" fill="none" />
          <path d="M94 74 Q106 66 104 50" stroke={INK} strokeWidth="8" strokeLinecap="round" fill="none" />
          <path d="M104 52 V22" stroke={safeStage >= 5 ? GOLD : '#b07a48'} strokeWidth="5" strokeLinecap="round" />
          <path d="M100 22 Q104 4 108 22 Z" fill={INK} />
        </>
      )}
      <path d="M60 18 C82 44 96 58 96 78 A36 34 0 0 1 24 78 C24 58 38 44 60 18 Z" fill={INK} />
      <path d="M44 56 Q36 68 38 80" stroke={INK_LIGHT} strokeWidth="6" strokeLinecap="round" fill="none" />
      {safeStage >= 1 && <path d="M60 20 Q52 6 60 2 Q68 6 60 20 Z" fill={INK_LIGHT} />}
      {safeStage >= 3 && <path d="M30 86 Q60 100 90 86 L88 94 Q60 108 32 94 Z" fill={SHU} />}
      <circle cx="47" cy="72" r="9" fill="#fff" />
      <circle cx="73" cy="72" r="9" fill="#fff" />
      {happy ? (
        <path d="M41 72 Q47 64 53 72 M67 72 Q73 64 79 72" stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />
      ) : (
        <>
          <circle cx="49" cy="73" r="4.5" fill="#1b1b1b" />
          <circle cx="75" cy="73" r="4.5" fill="#1b1b1b" />
          <circle cx="50.5" cy="71.5" r="1.5" fill="#fff" />
          <circle cx="76.5" cy="71.5" r="1.5" fill="#fff" />
        </>
      )}
      <ellipse cx="38" cy="84" rx="5" ry="3.5" fill="#ff8fa3" opacity="0.8" />
      <ellipse cx="82" cy="84" rx="5" ry="3.5" fill="#ff8fa3" opacity="0.8" />
      <path d={happy ? 'M52 86 Q60 97 68 86 Z' : 'M54 87 Q60 93 66 87'} stroke="#fff" strokeWidth="3" strokeLinecap="round" fill={happy ? '#ff8fa3' : 'none'} />
      {HATS[hat]}
      </g>
      {safeStage >= 5 && (
        <g fill={INK_LIGHT}>
          <circle cx="12" cy="30" r="5" />
          <circle cx="108" cy="92" r="4" />
          <circle cx="20" cy="98" r="3" />
        </g>
      )}
    </svg>
  )
}
