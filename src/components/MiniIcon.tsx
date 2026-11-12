import type { ReactNode } from 'react'

const INK = '#27336b'

/** fude = ふで / mato = まと / honoo = ほのお / me = め(新しい芽)/ ki = 木 / kurikaeshi = ふくしゅう / kagi = かぎ */
export type MiniIconName = 'fude' | 'mato' | 'honoo' | 'me' | 'ki' | 'kurikaeshi' | 'kagi'

const outline = { stroke: INK, strokeWidth: 3.5, strokeLinejoin: 'round', strokeLinecap: 'round' } as const

/** メニューの絵(src/assets/art)と そろえて、太い こん色の ふちどり で描く。 */
const ICONS: Record<MiniIconName, ReactNode> = {
  fude: (
    <>
      <path d="M40 8 L52 20 L27 45 L15 33 Z" fill="#d9a05b" {...outline} />
      <path d="M33 15 L45 27" stroke="#e8452c" strokeWidth="5" />
      <path d="M15 33 L27 45 Q20 55 7 55 Q8 42 15 33 Z" fill={INK} {...outline} />
      <circle cx="50" cy="50" r="4.5" fill={INK} />
    </>
  ),
  mato: (
    <>
      <circle cx="28" cy="32" r="22" fill="#ffffff" {...outline} />
      <circle cx="28" cy="32" r="14" fill="#e8452c" {...outline} />
      <circle cx="28" cy="32" r="6" fill="#ffffff" {...outline} />
      <path d="M28 32 L52 8" {...outline} fill="none" />
      <path d="M52 8 L44 9 M52 8 L51 16" {...outline} fill="none" />
    </>
  ),
  honoo: (
    <>
      <path d="M30 4 C36 16 50 22 50 38 A20 20 0 0 1 10 38 C10 28 16 24 20 16 C22 22 24 24 27 24 C27 16 28 10 30 4 Z" fill="#ff8a3d" {...outline} />
      <path d="M30 28 C34 34 40 36 40 44 A10 10 0 0 1 20 44 C20 38 26 36 30 28 Z" fill="#ffd95a" />
    </>
  ),
  me: (
    <>
      <path d="M30 54 V30" {...outline} fill="none" />
      <path d="M30 34 C18 34 10 26 10 14 C22 14 30 22 30 34 Z" fill="#7fce84" {...outline} />
      <path d="M30 30 C30 20 38 12 50 12 C50 24 42 30 30 30 Z" fill="#58b56b" {...outline} />
      <path d="M46 40 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#ffc233" />
    </>
  ),
  kurikaeshi: (
    <>
      <path d="M48 26 A19 19 0 1 0 46 42" fill="none" stroke={INK} strokeWidth="9" strokeLinecap="round" />
      <path d="M48 26 A19 19 0 1 0 46 42" fill="none" stroke="#5cc1ea" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M54 12 L50 30 L34 22 Z" fill="#5cc1ea" {...outline} />
    </>
  ),
  kagi: (
    <>
      <circle cx="20" cy="22" r="13" fill="#ffc233" {...outline} />
      <circle cx="20" cy="22" r="5" fill="#ffffff" {...outline} />
      <path d="M29 31 L52 54 M42 44 L48 38 M47 49 L53 43" {...outline} fill="none" strokeWidth="5" />
    </>
  ),
  ki: (
    <>
      <rect x="25" y="34" width="10" height="22" rx="3" fill="#b07a48" {...outline} />
      <path d="M30 6 C44 6 54 14 52 26 C56 36 46 44 36 40 C32 44 24 44 22 40 C12 44 4 34 8 26 C6 14 16 6 30 6 Z" fill="#58b56b" {...outline} />
      <circle cx="20" cy="24" r="4" fill="#e8452c" />
      <circle cx="38" cy="18" r="4" fill="#e8452c" />
      <circle cx="40" cy="32" r="4" fill="#e8452c" />
    </>
  ),
}

type Props = { readonly name: MiniIconName; readonly className?: string }

/** ミッションや成長の所に出す、小さな絵。 */
export function MiniIcon({ name, className }: Props) {
  return (
    <svg className={className} viewBox="0 0 60 60" aria-hidden="true" data-icon={name}>
      {ICONS[name]}
    </svg>
  )
}
