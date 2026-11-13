import type { HairStyle } from './head'
import { PALETTE } from './palette'

export type BottomKind = 'pants' | 'shorts' | 'skirt' | 'dress'

/** 人の 見た目(はだ・かみ・服 の 色 と 形) */
export type Look = {
  readonly skin?: string
  readonly hair?: string
  readonly hairStyle?: HairStyle
  readonly top?: string
  readonly bottom?: string
  readonly bottomKind?: BottomKind
  readonly sleeves?: 'long' | 'short'
  readonly shoes?: string
  /** かみかざり の 色 */
  readonly accent?: string
}

/** 何も 指定しない ときの 見た目(「休」の人 と 同じ) */
export const DEFAULT_LOOK: Required<Look> = {
  skin: PALETTE.skin,
  hair: PALETTE.hair,
  hairStyle: 'short',
  top: '#4f9be0',
  bottom: '#3e5c86',
  bottomKind: 'pants',
  sleeves: 'long',
  shoes: PALETTE.shoe,
  accent: '#ff5a6e',
}

/** よく使う 見た目。{ ...LOOKS.girl, top: CLOTHES.green.top } のように 色だけ かえてもよい */
export const LOOKS = {
  /** 男の子(「休」の人 と 同じ 青い 服) */
  boy: {},
  /** 女の子(ポニーテール・半そで・スカート) */
  girl: { hairStyle: 'ponytail', top: '#ff8f5a', bottomKind: 'skirt', sleeves: 'short' },
  /** 小さい 女の子(ふたつ むすび・ワンピース) */
  little: { hairStyle: 'pigtails', top: '#e8647a', bottomKind: 'dress', sleeves: 'short', accent: '#ffd24a' },
  /** おとこ の人 */
  man: { hair: PALETTE.hairDark, top: '#59b88a', bottom: '#4b5f86' },
  /** おんな の人 */
  woman: { hair: PALETTE.hairDark, hairStyle: 'bob', top: '#8a6cc7', bottom: '#3b4a73', bottomKind: 'skirt' },
  /** おとしより */
  elder: { hair: PALETTE.hairGray, hairStyle: 'bald', top: '#c9a66b', bottom: '#6b5a4a' },
} as const satisfies Record<string, Look>
