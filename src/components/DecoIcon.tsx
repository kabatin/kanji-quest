import type { ReactElement } from 'react'
import { findItem } from '../lib/shop'

const BLADE_COLORS = ['#ff6b8a', '#ffd95a', '#5cc1ea', '#84c456'] as const

/** ふうしゃ。絵文字に 風車が ないので(🎡 は かんらんしゃ)、しまの 3D と同じ色で かく。 */
function Windmill() {
  return (
    <svg className="deco-icon" viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="9.2,10 14.8,10 16.6,23 7.4,23" fill="#fff3dc" stroke="#c9b48f" strokeWidth="0.6" strokeLinejoin="round" />
      <rect x="10.8" y="18.4" width="2.4" height="4.6" rx="1.1" fill="#8a5a36" />
      <polygon points="8.2,10.2 12,5 15.8,10.2" fill="#e8452c" />
      {BLADE_COLORS.map((color, i) => (
        <rect key={color} x="10.6" y="0.4" width="2.8" height="8.4" rx="0.6" fill={color} stroke="#00000022" strokeWidth="0.4" transform={`rotate(${45 + i * 90} 12 9.4)`} />
      ))}
      <circle cx="12" cy="9.4" r="1.3" fill="#6f4a2f" />
    </svg>
  )
}

const DRAWN: Readonly<Record<string, () => ReactElement>> = { kazaguruma: Windmill }

/** しまの かざりの 小さな絵。じぶんで かいた絵が あれば それを、なければ 絵文字を 出す。 */
export function DecoIcon({ name }: { readonly name: string }) {
  const Drawn = DRAWN[name]
  if (Drawn) return <Drawn />
  return <span aria-hidden="true">{findItem(`deco:${name}`)?.emoji}</span>
}
