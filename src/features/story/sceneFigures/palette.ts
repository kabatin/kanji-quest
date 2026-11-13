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

/** かげ の色。k が 大きいほど こい(むこうがわ の うで・あし は 0.3 くらい) */
export function shade(color: string, k: number): string {
  return mixColor(color, '#1d2a44', k)
}
