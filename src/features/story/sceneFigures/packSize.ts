import type { Proportions } from './builds'

/** せおう かばん の 形 と 大きさ(絵 は pack.tsx) */
export type PackKind = 'randoseru' | 'rucksack'
export type PackSpec = { readonly kind: PackKind; readonly color?: string }

/** かばん ごとの 色(color を 省いたとき) */
export const PACK_COLORS: Readonly<Record<PackKind, string>> = {
  randoseru: '#e8534a',
  rucksack: '#d9a13a',
}

/**
 * かばん の 大きさ(体の中 の 単位)。top は かばん の 上の はし の y、thick は せなか から の あつみ。
 * はば は かた の 関節 の あいだ の 8〜9わり(ほんもの の ランドセル は 子ども の かた はば より 少し せまい)
 */
export function packSize(kind: PackKind, body: Proportions) {
  if (kind === 'rucksack') return { top: -body.torso * 0.95, height: body.torso * 0.84, width: body.shoulderHalf * 1.75, thick: body.torsoW * 0.56 }
  return { top: -body.torso * 0.9, height: body.torso * 0.72, width: body.shoulderHalf * 1.7, thick: body.torsoW * 0.48 }
}

/** うしろむき で、うで が かばん より 見る人 の ほうへ 出る さかい(体の まんなか から の おくゆき) */
export function packDepth(kind: PackKind, body: Proportions): number {
  return body.torsoW / 2 + packSize(kind, body).thick * 0.8
}
