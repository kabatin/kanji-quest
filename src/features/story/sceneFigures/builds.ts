/**
 * 体格(体の 大きさ の つりあい)。大きさは、立ったときの 背の高さ が 100 に なる 単位。
 *
 *   幼児 toddler … 3 頭身(あたま が とても 大きく、うで・あし が みじかい。手は こし まで)
 *   子ども child … 3.4 頭身(小学校の 低学年)
 *   中くらい teen … 3.85 頭身(高学年〜中学生。子ども と おとな の あいだ)
 *   おとな adult … 4.3 頭身
 *   おとしより elder … おとな と 同じ つくり で、少し 小さく、せなか が まるい(横むき で 上体が まえへ かたむく)
 *
 * どの 体格でも: くび は みじかい。うで を たらすと、手は ももの 上の ほう(幼児は こし)に とどく。
 */

export type Build = 'child' | 'adult' | 'teen' | 'elder' | 'toddler'

/** 体の 大きさ(背の高さ 100 の 単位) */
export type Proportions = {
  readonly headR: number
  /** あたまの まんなか の、くび の つけね からの ずれ(横むき: + = まえ) */
  readonly headX: number
  /** くび の 見える 長さ(どう と あたま に かくれる ぶんは のぞく) */
  readonly neck: number
  readonly neckW: number
  /** こし から どう の 上の はし まで */
  readonly torso: number
  readonly torsoW: number
  readonly torsoFrontW: number
  /** どう の 上の はし から かた の 関節 まで */
  readonly shoulderDrop: number
  /** かた の 関節の 位置(横むき: まえへの ずれ / 正面: まんなか からの はなれ) */
  readonly shoulderX: number
  readonly shoulderHalf: number
  readonly upperArm: number
  readonly foreArm: number
  readonly armW: number
  readonly handR: number
  /** 正面での 股関節の まんなか からの はなれ */
  readonly hipHalf: number
  readonly thigh: number
  readonly shin: number
  readonly legW: number
  /** くるぶし から くつ の そこ まで */
  readonly footH: number
  /** くつ の 長さの 半分 */
  readonly footL: number
  /** せなか の まるさ(度)。横むき で 上体が いつも この ぶん まえへ かたむき、顔は まえを むいた まま(おとしより) */
  readonly stoop?: number
}

const ADULT: Proportions = {
  headR: 11.6, headX: 0.6, neck: 3, neckW: 6.6, torso: 33, torsoW: 17.5, torsoFrontW: 24,
  shoulderDrop: 4.4, shoulderX: 0.8, shoulderHalf: 8.6, upperArm: 16, foreArm: 15.4, armW: 7.4, handR: 4.4,
  hipHalf: 4.4, thigh: 20.5, shin: 19.5, legW: 8.2, footH: 4, footL: 6.2,
}

/**
 * 子ども は あたま が 大きく(3.4 頭身)、おとな は 4.3 頭身くらい(「休」の人と 同じ つりあい)。
 * teen は その あいだ(あたま 26 + くび 3 + どう 31.5 + あし 40 = 100.5)。
 * toddler は あたま 33 で 3 頭身。どう が ずんぐり 太く、うで は かた から こし まで しか ない。
 */
export const BUILDS: Readonly<Record<Build, Proportions>> = {
  child: {
    headR: 14.6, headX: 0.6, neck: 3, neckW: 7.4, torso: 30, torsoW: 19, torsoFrontW: 25,
    shoulderDrop: 4.2, shoulderX: 0.8, shoulderHalf: 9, upperArm: 14, foreArm: 13.5, armW: 7.6, handR: 4.6,
    hipHalf: 4.6, thigh: 16.5, shin: 15.5, legW: 8.2, footH: 4, footL: 5.8,
  },
  adult: ADULT,
  teen: {
    headR: 13, headX: 0.6, neck: 3, neckW: 7, torso: 31.5, torsoW: 18.2, torsoFrontW: 24.4,
    shoulderDrop: 4.3, shoulderX: 0.8, shoulderHalf: 8.8, upperArm: 15, foreArm: 14.4, armW: 7.5, handR: 4.5,
    hipHalf: 4.5, thigh: 18.5, shin: 17.5, legW: 8.2, footH: 4, footL: 6,
  },
  // おとな と 同じ つくり。せなか が まるい ぶん、どう を 少し みじかく
  elder: { ...ADULT, torso: 32, stoop: 13 },
  toddler: {
    headR: 16.6, headX: 0.6, neck: 2, neckW: 7.8, torso: 31, torsoW: 21.5, torsoFrontW: 27,
    shoulderDrop: 4.6, shoulderX: 0.6, shoulderHalf: 9.4, upperArm: 11.5, foreArm: 11, armW: 7.8, handR: 4.8,
    hipHalf: 5, thigh: 15, shin: 14, legW: 8.8, footH: 3.8, footL: 5.4,
  },
}

/** 省いたときの 背の高さ(画面の 単位) */
export const DEFAULT_HEIGHT: Readonly<Record<Build, number>> = { child: 44, adult: 58, teen: 51, elder: 54, toddler: 32 }

/** 背の高さ 100 の 単位 から 画面の 単位 への 倍率 */
export function bodyScale(build: Build = 'child', height?: number): number {
  return (height ?? DEFAULT_HEIGHT[build]) / 100
}
