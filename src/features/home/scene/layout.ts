/** しまの半径 */
export const ISLAND_RADIUS = 9
export const MAX_TREES = 60
/** 木1本が育つ段階の数(なえ → わかぎ → たいぼく → 花や実がつく) */
export const TREE_STAGES = 4
export const TREE_KINDS = 3

export type Spot = { readonly x: number; readonly z: number }

/** しまに置く かざり の場所(名前は shop の deco の名前) */
export const DECO_SPOTS: Readonly<Record<string, Spot>> = {
  hana: { x: -2.7, z: 2.5 },
  bench: { x: 3.3, z: 1.5 },
  kinoko: { x: -4.8, z: -1.2 },
  tourou: { x: 2.5, z: -2.3 },
  tent: { x: 5.4, z: -2.4 },
  kazaguruma: { x: -6.1, z: -3.6 },
  yukidaruma: { x: 4.6, z: 3.6 },
  torii: { x: 0, z: -4.4 },
  shiro: { x: -2.6, z: -6.3 },
  // にじ は、しまの うしろの空にかかる
  niji: { x: 0, z: -7 },
}

export const POND: Spot & { readonly radius: number } = { x: -4.6, z: 3.4, radius: 1.5 }

/** すみまるが立つ、まんなかの広場の半径 */
const CLEARING_RADIUS = 3.8
const EDGE_MARGIN = 0.9
const DECO_GAP = 1.5
const GOLDEN_ANGLE = 2.399963
/** すみまるが木にかくれないよう、手前(カメラ側)のまんなかは空けておく */
const FRONT_GAP = { halfWidth: 3.6, fromZ: 0.8 }

const dist = (a: Spot, b: Spot): number => Math.hypot(a.x - b.x, a.z - b.z)

function isFree(spot: Spot): boolean {
  if (spot.z > FRONT_GAP.fromZ && Math.abs(spot.x) < FRONT_GAP.halfWidth) return false
  if (dist(spot, POND) < POND.radius + 0.7) return false
  return Object.entries(DECO_SPOTS).every(([name, deco]) => name === 'niji' || dist(spot, deco) > DECO_GAP)
}

/** 自分で うごかした かざり の場所(かざり の名前 → 場所)。うごかしていない かざり は入っていない */
export type DecoSpots = Readonly<Record<string, Spot>>

/** かざり の向き。1 ふえるごとに、ひとまわりの 8分の1(45度)まわる */
export type DecoTurns = Readonly<Record<string, number>>
export const TURN_STEPS = 8

/** かざり の向き(ラジアン)。まわしていなければ 0。 */
export function decoAngle(name: string, turns: DecoTurns): number {
  const steps = turns[name] ?? 0
  return ((((Number.isFinite(steps) ? Math.round(steps) : 0) % TURN_STEPS) + TURN_STEPS) % TURN_STEPS) * ((Math.PI * 2) / TURN_STEPS)
}

/** にじ は空にかかるので、うごかせない */
export const FIXED_DECOS: readonly string[] = ['niji']

export const isMovableDeco = (name: string): boolean => DECO_SPOTS[name] !== undefined && !FIXED_DECOS.includes(name)

/** かざり の いまの場所。うごかしていなければ、はじめの場所。 */
export function decoSpot(name: string, placed: DecoSpots): Spot | undefined {
  return (isMovableDeco(name) ? placed[name] : undefined) ?? DECO_SPOTS[name]
}

/** すみまると すずり の まわり。かざり は ここには置けない */
const DECO_KEEP_OUT = 2.5
/** かざり どうしを はなす きょり */
const DECO_SPACING = 1.4
/** 木が かざり を よける きょり */
const TREE_YIELD = 1.25
const SETTLE_PASSES = 6

/** spot が center から gap より近いとき、gap だけ はなれた所まで おし出す。 */
function pushAway(spot: Spot, center: Spot, gap: number): Spot {
  const d = dist(spot, center)
  if (d >= gap) return spot
  // ぴったり重なっているときは、しまの手前の方へ ずらす
  const direction = d < 0.001 ? { x: 0, z: 1 } : { x: (spot.x - center.x) / d, z: (spot.z - center.z) / d }
  return { x: center.x + direction.x * gap, z: center.z + direction.z * gap }
}

function insideIsland(spot: Spot): Spot {
  const limit = ISLAND_RADIUS - EDGE_MARGIN
  const r = Math.hypot(spot.x, spot.z)
  return r <= limit ? spot : { x: (spot.x / r) * limit, z: (spot.z / r) * limit }
}

/**
 * かざり を置こうとした場所を、置ける場所に直す。
 * しまの外・まんなかの広場・池の中・ほかの かざり の上には置けないので、いちばん近い 置ける場所へ ずらす。
 */
export function settleDeco(wanted: Spot, others: readonly Spot[]): Spot {
  const start: Spot = { x: Number.isFinite(wanted.x) ? wanted.x : 0, z: Number.isFinite(wanted.z) ? wanted.z : 0 }
  const obstacles: readonly { readonly center: Spot; readonly gap: number }[] = [
    { center: { x: 0, z: 0 }, gap: DECO_KEEP_OUT },
    { center: POND, gap: POND.radius + 0.7 },
    ...others.map((center) => ({ center, gap: DECO_SPACING })),
  ]
  const pass = (spot: Spot): Spot => insideIsland(obstacles.reduce((moved, { center, gap }) => pushAway(moved, center, gap), spot))
  return Array.from({ length: SETTLE_PASSES }).reduce<Spot>((spot) => pass(spot), insideIsland(start))
}

/** 木が かざり と重なるときは、木のほうが少し よける(木は なくならない)。 */
export function yieldToDecos(tree: Spot, decos: readonly Spot[]): Spot {
  return insideIsland(decos.reduce((moved, deco) => pushAway(moved, deco, TREE_YIELD), tree))
}

/** しまの高さ(まんなかが少し高い、なだらかな丘)。 */
export function groundHeight(x: number, z: number): number {
  const r = Math.min(Math.hypot(x, z) / ISLAND_RADIUS, 1)
  return 0.55 * (1 - r * r)
}

/** 木を植えられる場所。うずまき状に、広場・池・かざり をよけて並べる。いつ呼んでも同じ並びになる。 */
export function treeSpots(): Spot[] {
  const spots: Spot[] = []
  const candidates = MAX_TREES * 3
  for (let i = 0; i < candidates && spots.length < MAX_TREES; i += 1) {
    const r = CLEARING_RADIUS + (ISLAND_RADIUS - EDGE_MARGIN - CLEARING_RADIUS) * Math.sqrt((i + 0.5) / candidates)
    const angle = i * GOLDEN_ANGLE
    const spot = { x: Math.cos(angle) * r, z: Math.sin(angle) * r }
    if (isFree(spot)) spots.push(spot)
  }
  return spots
}

/** 森が1段階 育つのに必要な漢字の数。収録している漢字を全部おぼえると、ちょうど森が育ちきる。 */
export function kanjiPerGrowth(totalKanji: number): number {
  return Math.max(1, Math.ceil(totalKanji / (MAX_TREES * TREE_STAGES)))
}

/**
 * 育つ順番。「どの木が1段階 育つか」を、はじめから順に並べたもの。
 * 新しい なえ が植わるのと、前に植えた木が大きくなるのが、かわりばんこに起きるようにしている。
 */
function growthOrder(treeCount: number): number[] {
  return Array.from({ length: treeCount * TREE_STAGES }, (_, n) => ({ tree: Math.floor(n / TREE_STAGES), stage: n % TREE_STAGES }))
    .sort((a, b) => a.tree * 2 + a.stage * 5 - (b.tree * 2 + b.stage * 5) || a.tree - b.tree)
    .map((event) => event.tree)
}

export type TreePlan = Spot & {
  /** 育ちぐあい(1〜TREE_STAGES) */
  readonly stage: number
  /** 木の種類(0〜TREE_KINDS-1) */
  readonly kind: number
}

/** 覚えた漢字の数から、いま しまに生えている木を決める。 */
export function forestPlan(learnedCount: number, totalKanji: number): TreePlan[] {
  const spots = treeSpots()
  const steps = Math.floor(Math.max(learnedCount, 0) / kanjiPerGrowth(totalKanji))
  const stages = new Map<number, number>()
  for (const tree of growthOrder(spots.length).slice(0, steps)) stages.set(tree, (stages.get(tree) ?? 0) + 1)
  return [...stages.entries()].map(([tree, stage]) => ({ ...spots[tree], stage, kind: tree % TREE_KINDS }))
}

/** そら(shop の bg の名前)ごとの、光と空の色 */
export type SkyPreset = {
  /** CSS の背景(上から下へ) */
  readonly gradient: readonly [string, string, string]
  readonly sunColor: string
  readonly sunIntensity: number
  /** 太陽(または月)の方向 */
  readonly sunPosition: readonly [number, number, number]
  readonly skyLight: string
  readonly groundLight: string
  readonly ambient: number
  readonly cloudColor: string
  /** 空に うかぶもの */
  readonly body: 'sun' | 'moon' | 'planet'
  /** ふってくるもの・とぶもの */
  readonly particles: 'none' | 'petals' | 'snow' | 'fireflies' | 'stars'
  readonly stars: boolean
}

export const SKY_PRESETS: Readonly<Record<string, SkyPreset>> = {
  asa: {
    gradient: ['#6ec3f0', '#bfe6f8', '#f3fbff'],
    sunColor: '#fff1d0',
    sunIntensity: 2.6,
    sunPosition: [9, 12, 2],
    skyLight: '#e6f6ff',
    groundLight: '#8fbf7a',
    ambient: 1.5,
    cloudColor: '#ffffff',
    body: 'sun',
    particles: 'none',
    stars: false,
  },
  yuu: {
    gradient: ['#5a5fb0', '#ff9d6c', '#ffe1a8'],
    sunColor: '#ffb070',
    sunIntensity: 2.8,
    sunPosition: [-10, 5, 3],
    skyLight: '#ffd9b8',
    groundLight: '#a0704a',
    ambient: 1.2,
    cloudColor: '#ffd0c2',
    body: 'sun',
    particles: 'none',
    stars: false,
  },
  yoru: {
    gradient: ['#0f1440', '#27306f', '#55509a'],
    sunColor: '#c4ceff',
    sunIntensity: 2.2,
    sunPosition: [-6, 11, 5],
    skyLight: '#6f7fd0',
    groundLight: '#3a4a8a',
    ambient: 1.6,
    cloudColor: '#7b84c4',
    body: 'moon',
    particles: 'fireflies',
    stars: true,
  },
  sakura: {
    gradient: ['#8fd0f0', '#ffd9e8', '#fff5f8'],
    sunColor: '#fff0e0',
    sunIntensity: 2.5,
    sunPosition: [8, 12, 2],
    skyLight: '#ffeaf2',
    groundLight: '#9cc98a',
    ambient: 1.5,
    cloudColor: '#fff2f6',
    body: 'sun',
    particles: 'petals',
    stars: false,
  },
  yuki: {
    gradient: ['#93a9c9', '#cfdcec', '#f4f8fc'],
    sunColor: '#f2f6ff',
    sunIntensity: 2.0,
    sunPosition: [7, 12, 2],
    skyLight: '#f0f6ff',
    groundLight: '#a8b8c8',
    ambient: 1.6,
    cloudColor: '#e9eef6',
    body: 'sun',
    particles: 'snow',
    stars: false,
  },
  uchuu: {
    gradient: ['#05061c', '#141042', '#3a1f6b'],
    sunColor: '#d6c8ff',
    sunIntensity: 2.0,
    sunPosition: [8, 10, 7],
    skyLight: '#8f7fe0',
    groundLight: '#2a2060',
    ambient: 1.0,
    cloudColor: '#6a5fb5',
    body: 'planet',
    particles: 'stars',
    stars: true,
  },
}

export function skyPreset(name: string): SkyPreset {
  return SKY_PRESETS[name] ?? SKY_PRESETS.asa
}
