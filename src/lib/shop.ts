export type ItemKind = 'skin' | 'hat' | 'bg'

export type ShopItem = {
  /** 「種類:名前」の形。きせかえの保存にもこの id を使う。 */
  readonly id: string
  readonly kind: ItemKind
  readonly label: string
  readonly price: number
}

export const SHOP_ITEMS: readonly ShopItem[] = [
  { id: 'skin:kami', kind: 'skin', label: 'かみ', price: 0 },
  { id: 'skin:sora', kind: 'skin', label: 'そら', price: 80 },
  { id: 'skin:kin', kind: 'skin', label: 'きん', price: 200 },
  { id: 'skin:yozora', kind: 'skin', label: 'よぞら', price: 300 },
  { id: 'hat:none', kind: 'hat', label: 'なし', price: 0 },
  { id: 'hat:mugiwara', kind: 'hat', label: 'むぎわら', price: 60 },
  { id: 'hat:ribbon', kind: 'hat', label: 'リボン', price: 60 },
  { id: 'hat:megane', kind: 'hat', label: 'めがね', price: 100 },
  { id: 'hat:kanmuri', kind: 'hat', label: 'かんむり', price: 400 },
  { id: 'bg:asa', kind: 'bg', label: 'あさ', price: 0 },
  { id: 'bg:yuu', kind: 'bg', label: 'ゆうやけ', price: 150 },
  { id: 'bg:yoru', kind: 'bg', label: 'よる', price: 250 },
]

export const KIND_LABEL: Record<ItemKind, string> = { skin: 'カード', hat: 'ぼうし', bg: 'そら' }
export const ITEM_KINDS: readonly ItemKind[] = ['skin', 'hat', 'bg']

export type Equipped = Readonly<Record<ItemKind, string>>

export const DEFAULT_EQUIPPED: Equipped = { skin: 'skin:kami', hat: 'hat:none', bg: 'bg:asa' }
export const DEFAULT_OWNED: readonly string[] = SHOP_ITEMS.filter((item) => item.price === 0).map((item) => item.id)

export function findItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === id)
}

/** id の「名前」の部分(skin:sora → sora)。CSS や絵の切り替えに使う。 */
export function itemName(id: string): string {
  return id.slice(id.indexOf(':') + 1)
}

export function canBuy(item: ShopItem, owned: readonly string[], coins: number): boolean {
  return !owned.includes(item.id) && coins >= item.price
}
