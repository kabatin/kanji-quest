/** skin = カードの見た目 / hat = すみまるの ぼうし / bg = ホームの そら / deco = ホームの しまに おく かざり */
export type ItemKind = 'skin' | 'hat' | 'bg' | 'deco'

/** 1つだけ えらんで使う種類(かざり は、持っているものを全部おく) */
export type EquipKind = Exclude<ItemKind, 'deco'>

export type ShopItem = {
  /** 「種類:名前」の形。きせかえの保存にもこの id を使う。 */
  readonly id: string
  readonly kind: ItemKind
  readonly label: string
  readonly price: number
  /** このレベルになると買えるようになる */
  readonly minLevel: number
  /** 一覧に出す絵(かざり だけ) */
  readonly emoji?: string
}

/*
 * ねだんは、合計が およそ 3万コイン。6年生まで続けて もらえるコイン(3万ほど)と つり合うようにし、
 * 高いものはレベルでも しぼって、早いうちに全部そろわないようにしている。
 */
export const SHOP_ITEMS: readonly ShopItem[] = [
  { id: 'skin:kami', kind: 'skin', label: 'かみ', price: 0, minLevel: 1 },
  { id: 'skin:sora', kind: 'skin', label: 'そら', price: 120, minLevel: 1 },
  { id: 'skin:wakaba', kind: 'skin', label: 'わかば', price: 200, minLevel: 5 },
  { id: 'skin:sakura', kind: 'skin', label: 'さくら', price: 350, minLevel: 10 },
  { id: 'skin:kin', kind: 'skin', label: 'きん', price: 600, minLevel: 18 },
  { id: 'skin:yozora', kind: 'skin', label: 'よぞら', price: 900, minLevel: 28 },
  { id: 'skin:sumi', kind: 'skin', label: 'すみ', price: 1400, minLevel: 40 },
  { id: 'skin:niji', kind: 'skin', label: 'にじ', price: 2400, minLevel: 60 },

  { id: 'hat:none', kind: 'hat', label: 'なし', price: 0, minLevel: 1 },
  { id: 'hat:hachimaki', kind: 'hat', label: 'はちまき', price: 80, minLevel: 1 },
  { id: 'hat:mugiwara', kind: 'hat', label: 'むぎわら', price: 150, minLevel: 3 },
  { id: 'hat:ribbon', kind: 'hat', label: 'リボン', price: 150, minLevel: 3 },
  { id: 'hat:hana', kind: 'hat', label: 'おはな', price: 250, minLevel: 7 },
  { id: 'hat:megane', kind: 'hat', label: 'めがね', price: 400, minLevel: 12 },
  { id: 'hat:nekomimi', kind: 'hat', label: 'ねこみみ', price: 600, minLevel: 18 },
  { id: 'hat:tongari', kind: 'hat', label: 'まほうの ぼうし', price: 900, minLevel: 26 },
  { id: 'hat:silk', kind: 'hat', label: 'シルクハット', price: 1300, minLevel: 36 },
  { id: 'hat:kanmuri', kind: 'hat', label: 'かんむり', price: 2500, minLevel: 50 },

  { id: 'bg:asa', kind: 'bg', label: 'あさ', price: 0, minLevel: 1 },
  { id: 'bg:yuu', kind: 'bg', label: 'ゆうやけ', price: 300, minLevel: 6 },
  { id: 'bg:yoru', kind: 'bg', label: 'よる', price: 500, minLevel: 12 },
  { id: 'bg:sakura', kind: 'bg', label: 'はる', price: 800, minLevel: 20 },
  { id: 'bg:yuki', kind: 'bg', label: 'ゆき', price: 1200, minLevel: 32 },
  { id: 'bg:uchuu', kind: 'bg', label: 'うちゅう', price: 2800, minLevel: 55 },

  { id: 'deco:hana', kind: 'deco', label: 'はなばたけ', price: 100, minLevel: 1, emoji: '🌷' },
  { id: 'deco:bench', kind: 'deco', label: 'ベンチ', price: 180, minLevel: 4, emoji: '🪑' },
  { id: 'deco:kinoko', kind: 'deco', label: 'きのこの いえ', price: 300, minLevel: 8, emoji: '🍄' },
  { id: 'deco:tourou', kind: 'deco', label: 'とうろう', price: 450, minLevel: 13, emoji: '🏮' },
  { id: 'deco:tent', kind: 'deco', label: 'テント', price: 650, minLevel: 19, emoji: '⛺' },
  { id: 'deco:kazaguruma', kind: 'deco', label: 'ふうしゃ', price: 900, minLevel: 25 },
  { id: 'deco:yukidaruma', kind: 'deco', label: 'ゆきだるま', price: 1100, minLevel: 32, emoji: '⛄' },
  { id: 'deco:torii', kind: 'deco', label: 'とりい', price: 1500, minLevel: 42, emoji: '⛩️' },
  { id: 'deco:niji', kind: 'deco', label: 'にじ', price: 2000, minLevel: 52, emoji: '🌈' },
  { id: 'deco:shiro', kind: 'deco', label: 'おしろ', price: 3000, minLevel: 65, emoji: '🏯' },
]

export const KIND_LABEL: Record<ItemKind, string> = { hat: 'ぼうし', deco: 'かざり', bg: 'そら', skin: 'カード' }
export const ITEM_KINDS: readonly ItemKind[] = ['hat', 'deco', 'bg', 'skin']

export type Equipped = Readonly<Record<EquipKind, string>>

export const DEFAULT_EQUIPPED: Equipped = { skin: 'skin:kami', hat: 'hat:none', bg: 'bg:asa' }
export const DEFAULT_OWNED: readonly string[] = SHOP_ITEMS.filter((item) => item.price === 0).map((item) => item.id)

export function findItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === id)
}

/** id の「名前」の部分(skin:sora → sora)。CSS や絵の切り替えに使う。 */
export function itemName(id: string): string {
  return id.slice(id.indexOf(':') + 1)
}

export type BuyState = 'owned' | 'locked' | 'poor' | 'ok'

/** その品を いま買えるか。locked = レベルが足りない / poor = コインが足りない */
export function buyState(item: ShopItem, owned: readonly string[], coins: number, level: number): BuyState {
  if (owned.includes(item.id)) return 'owned'
  if (level < item.minLevel) return 'locked'
  return coins >= item.price ? 'ok' : 'poor'
}

export function canBuy(item: ShopItem, owned: readonly string[], coins: number, level: number): boolean {
  return buyState(item, owned, coins, level) === 'ok'
}

/** 持っている かざり の名前(ホームの しまに おくもの)。 */
export function ownedDecos(owned: readonly string[]): string[] {
  return SHOP_ITEMS.filter((item) => item.kind === 'deco' && owned.includes(item.id)).map((item) => itemName(item.id))
}

/** あつめた きせかえ の数(はじめから持っているものは数えない)。 */
export function collectedCount(owned: readonly string[]): number {
  return SHOP_ITEMS.filter((item) => item.price > 0 && owned.includes(item.id)).length
}

export const COLLECTIBLE_TOTAL = SHOP_ITEMS.filter((item) => item.price > 0).length
