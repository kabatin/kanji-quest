import { clamp01 } from '../sceneKit'

/**
 * 場面の 色を 1か所に まとめる(どの字でも 同じ 絵がら に そろえるため)。
 * 色は「休」(scenes/k4f11.tsx)に そろえてある。字ごとに 色を 足すときも、まず ここから えらぶ。
 */
export const PALETTE = {
  /* 人 */
  skin: '#f8cfa6',
  skinShade: '#eeb98a',
  cheek: '#ff9d9d',
  eye: '#2b2b2b',
  mouth: '#b9483f',
  hair: '#5a3b2a',
  hairDark: '#3e2c22',
  hairGray: '#b9b4ad',
  shoe: '#6b4a36',
  sock: '#ffffff',
  /* 空 */
  sun: '#ffd24a',
  cloud: '#ffffff',
  sky: '#a6dcff',
  /* 地面 */
  hill: '#e2f2d2',
  grass: '#c5e8a9',
  soil: '#a8774e',
  soilDark: '#7d5435',
  dust: '#f4ecdc',
  /* 木・草 */
  bark: '#8c5b3c',
  barkDark: '#70452b',
  leaf: '#55b86e',
  leafDark: '#3f9c59',
  leafLight: '#8bd69a',
  pine: '#2f8447',
  pineLight: '#3f9c59',
  fruit: '#e8534a',
  /* 水 */
  water: '#7cc4f2',
  waterDark: '#56aae6',
  waterLight: '#e8f6ff',
  /* 家 */
  wall: '#fff1d6',
  roof: '#d9654b',
  wood: '#8c5b3c',
  windowLight: '#fff3b0',
  /* 生きもの */
  bird: '#ff9a5c',
  birdDark: '#e2733f',
  beak: '#f2b632',
  wing: '#ff9fc2',
  wingDark: '#f2709f',
  wingDot: '#fff0b0',
  /* しるし */
  heart: '#ff6f91',
  notice: '#f2b632',
  sigh: '#c9d6e6',
  snore: '#5f7fd6',
  question: '#5f7fd6',
  /* 夕方・夜(「夜」「夕」「月」の 場面 と 同じ 色) */
  skyEvening: '#ffc79a',
  horizonEvening: '#ffb067',
  skyNight: '#27336f',
  horizonNight: '#3d4f80',
  sunEvening: '#ff9f4a',
  moon: '#ffe58a',
  moonShade: '#f2cd68',
  moonGlow: '#fff3b0',
  star: '#fff6c8',
  hillEvening: '#e8cfa4',
  hillNight: '#2f4a63',
  grassEvening: '#b5cf8c',
  grassNight: '#3c6a5c',
  leafEvening: '#4a9a5c',
  leafNight: '#2a6552',
  cloudEvening: '#ffd7c8',
  cloudNight: '#8e9bc9',
  /* くもり・雨(「雨」「室」の 場面 と 同じ 色) */
  skyGray: '#c3cddb',
  cloudGray: '#9fadc2',
  /* へや(「書」「室」の 場面 と 同じ 色) */
  wallRoom: '#fbefd5',
  wallRoomNight: '#f0d8a8',
  floorWood: '#d9a76a',
  floorWoodDark: '#c18f55',
  furniture: '#b9824f',
  furnitureDark: '#8c5b3c',
  furnitureLight: '#d9a76a',
  blackboard: '#2f5d50',
  chalk: '#f4f1ea',
  glass: '#cfe6f5',
  /* 火 */
  flame: '#ff7a2e',
  flameMid: '#ffb02e',
  flameCore: '#ffe27a',
  ember: '#ff6a3a',
  /* 岩・道・田畑 */
  rock: '#a8adb6',
  rockLight: '#c9cdd4',
  rockDark: '#8b919b',
  path: '#e8d9b5',
  pathEdge: '#d8c49a',
  paddyWater: '#a9d9f7',
  rice: '#7cc843',
  /* 雨・雪 */
  rain: '#5aaee8',
  snow: '#ffffff',
  snowShade: '#dcebf8',
  /* 海・砂はま(「歩」の 場面 と 同じ 色) */
  sea: '#7cc4f2',
  seaDark: '#56aae6',
  foam: '#ffffff',
  sand: '#f6e3b0',
  sandDark: '#ecd397',
  footprint: '#d9b878',
  /* 山(てまえ は こい みどり、とおく は 青み の ある みどり) */
  mountain: '#55b86e',
  mountainShade: '#3f9c59',
  mountainFar: '#86c79a',
  mountainFarShade: '#62a67f',
  /* 和室・やね(「学」の 場面 と 同じ 色) */
  tatami: '#e4e7a9',
  tatamiLine: '#cbd187',
  roofTile: '#5f6f92',
  roofTileDark: '#4c5a7a',
  roofTileLight: '#7f8fb2',
  pillar: '#c99766',
  pillarDark: '#a5764b',
  /* ゴール */
  tape: '#ff5d73',
  poleStripe: '#e8534a',
} as const

/** 服の色の くみあわせ(うわぎ・ズボン)。人ごとに 色を かえて、だれが だれか わかるように する */
export const CLOTHES = {
  blue: { top: '#4f9be0', bottom: '#3e5c86' },
  orange: { top: '#ff8f5a', bottom: '#3e5c86' },
  yellow: { top: '#f4c542', bottom: '#3e5c86' },
  green: { top: '#59b88a', bottom: '#4b5f86' },
  pink: { top: '#e8647a', bottom: '#3e5c86' },
  purple: { top: '#8a6cc7', bottom: '#3b4a73' },
  red: { top: '#e8534a', bottom: '#3e5c86' },
  white: { top: '#f4f1ea', bottom: '#3b4a73' },
} as const

/** '#rrggbb' を [赤, 緑, 青] に */
function rgbOf(hex: string): readonly [number, number, number] {
  const n = Number.parseInt(hex.slice(1, 7), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const hex2 = (n: number) => Math.round(Math.min(Math.max(n, 0), 255)).toString(16).padStart(2, '0')

/** 色 a から 色 b へ、k(0〜1)だけ 近づけた色('#rrggbb') */
export function mixColor(a: string, b: string, k: number): string {
  const from = rgbOf(a)
  const to = rgbOf(b)
  const p = clamp01(k)
  return `#${from.map((c, i) => hex2(c + (to[i] - c) * p)).join('')}`
}

/**
 * 時間で かわる 色。time は 0 = 昼、1 = 夕方、2 = 夜(とちゅう も よい: 1.5 は 夕方 と 夜 の あいだ)。
 * Backdrop・Room の time と 同じ。じぶんで 描く 物の 色も、これで 昼 → 夕方 → 夜 に そろえる。
 */
export function byTime(time: number, day: string, evening: string, night: string): string {
  return mixColor(mixColor(day, evening, clamp01(time)), night, clamp01(time - 1))
}

/** かげ の色。k が 大きいほど こい(むこうがわ の うで・あし は 0.3 くらい) */
export function shade(color: string, k: number): string {
  return mixColor(color, '#1d2a44', k)
}
