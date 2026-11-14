/*
 * 百(ひゃく): 上に ぼうが 1本。下の 白は 音の しるし。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 二本の はしら に わたした、たかい 木の ぼう(バナナを ぶらさげる)
 *   2画目(ノ)  … 戸だなの 上に のった さるの あたま(さいごの しゅんかん、だいたい この あたり)
 *   3画目(丨)  … しろい 戸だなの 左がわ
 *   4画目(𠃍)  … 戸だなの 上・右がわ(たなの わく)
 *   5画目(一)  … 戸だなの 上の たなの そこ(上の たなに ベルが ある = 音)
 *   6画目(一)  … 戸だなの いちばん下の たな
 *
 * ながれ
 *   ぼうに バナナが ぶらさがる → 子ざるが とんでくる → ぴょんぴょん はねても とどかない(しょんぼり)
 *   → 「そうだ!」と ひらめいて、しろい 戸だなを ひっぱってきて バナナの下に おく
 *   → ぐっと かがんで ぴょーん と 戸だなの 上へ → のびて バナナを とる → にこにこ たべる
 *   → ほね が ひかって、絵が うすくなり、字「百」が のこる
 *
 * 動物の 部品は まだ ないので、さる・戸だな・バナナは 元の絵のまま。背景だけ 共通部品の Backdrop に した。
 *
 * ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   さるは 目が あたまの まえに あり、うで は かた から出て ひじ で まがる。しっぽが ある。
 *   戸だなは 上と 下に たな の ある 四角い 入れもの。ぼうは 二本の はしら に のっている。
 *   戸だなは さるより ずっと 大きいが、さるは 体の 3ばいくらい とびあがれる(のぼれる)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop } from '../sceneFigures'

const CHAR = '百'

const FUR = '#a86a3c'
const FUR_DARK = '#86502c'
const FACE = '#f6d2a2'
const CHEEK = '#ff9d9d'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const BANANA = '#ffd84a'
const BANANA_DARK = '#f2bf2c'
const BANANA_TIP = '#6b4a2a'
const CABINET = '#fbfbf7'
const CABINET_RIM = '#cfd8df'
const CABINET_IN = '#d9e3ec'
const CABINET_IN_DARK = '#c3d0dc'
const BELL = '#ffc233'
const BALL = '#e8534a'

/** くぎり の時間(秒) */
const ENTER = 0.3
const HOP1 = 1.3
const HOP2 = 2.0
const SAD = 2.7
const IDEA = 3.4
const PULL = 4.1
const PULL_END = 5.1
const JUMP = 5.5
const LAND = 6.2
const GRAB = 6.8
const INK = 7.6
const DONE = 10.2
const DURATION = 10.8

/** 地面(さるの 足の高さ) と、戸だなの 上(さるが のる 高さ) */
const GROUND_Y = 96.5
const TOP_Y = 41
/** さるの 大きさ(さる の 絵は 足もとが 0,0 で、高さ 21 ほど) */
const MONKEY_SCALE = 1.05
/** 戸だなの 左はし(おわりの 場所)と、さいしょに おいてある ずれ */
const CABINET_LEFT = 31.5
const CABINET_START_DX = 34
/** ひっぱる とき の さると 戸だな の きょり(手が 戸だなの ふち に とどく) */
const PULL_GAP = 8.8
/** のりおわった さる の よこの場所 と、バナナの ぶらさがる場所 */
const LAND_X = 52
const BANANA_X = 61
const BANANA_TOP_Y = 21.5
/** ぼう の した の はし(ひもを むすぶ ところ) */
const STRING_Y = 19.6

type Point = readonly [number, number]

/* ───────── ぼう と はしら と 戸だな ───────── */

function Stand({ t }: SceneProps) {
  const grow = span(t, 0, 0.5, backOut)
  return (
    <Layer scaleY={grow} origin={[54.5, 97]}>
      {/* はしら: 左右に 1本ずつ。ぼう が のっている */}
      <rect x="12.3" y="12.5" width="4.4" height="85" rx="2.2" fill={BARK_DARK} />
      <rect x="91.3" y="12.5" width="4.4" height="85" rx="2.2" fill={BARK_DARK} />
      {/* 1画目: ぼう */}
      <Bone char={CHAR} n={1} color={BARK} width={4.4} />
      <path d="M12.5 96 h4 M91.5 96 h4" stroke={BARK_DARK} strokeWidth="2" strokeLinecap="round" />
    </Layer>
  )
}

/** しろい 戸だな。上と 下に たな が あり、上の たなに ベルが ある(= 音の しるし) */
function Cabinet({ dx }: { readonly dx: number }) {
  return (
    <Layer x={dx}>
      <ellipse cx="54.5" cy="97.4" rx="25" ry="2.4" fill="#000000" opacity="0.1" />
      {/* わく(ふち は すこし 青ぐろく して、しろい 空の中でも 見えるように) */}
      <rect x="31" y="40" width="47" height="56" rx="3.4" fill={CABINET_RIM} />
      <rect x="31.5" y="40.5" width="46" height="55" rx="3" fill={CABINET} />
      {/* 上の たな と 下の たな(うしろの 壁が 見える) */}
      <rect x="36" y="44.6" width="37.5" height="19" rx="1.6" fill={CABINET_IN} />
      <rect x="36" y="44.6" width="37.5" height="2.6" rx="1.2" fill={CABINET_IN_DARK} />
      <rect x="36" y="67.6" width="37.5" height="21.6" rx="1.6" fill={CABINET_IN} />
      <rect x="36" y="67.6" width="37.5" height="2.6" rx="1.2" fill={CABINET_IN_DARK} />
      {/* 上の たなの ベル */}
      <path d="M50 63.6 Q50 54.6 55 54.6 Q60 54.6 60 63.6 Z" fill={BELL} />
      <rect x="49" y="62.4" width="12" height="1.6" rx="0.8" fill="#e0a21c" />
      <circle cx="55" cy="53.8" r="1.1" fill="#e0a21c" />
      {/* 下の たなの ボール */}
      <circle cx="45" cy="84.6" r="4.4" fill={BALL} />
      <circle cx="43.6" cy="83.2" r="1.3" fill="#ffffff" opacity="0.6" />
    </Layer>
  )
}

/* ───────── バナナ ───────── */

/** ひとふさの バナナ。くき(上)が 原点で、下へ 12ほど さがる。 */
function Bananas({ x, y, rotate }: { readonly x: number; readonly y: number; readonly rotate: number }) {
  return (
    <Layer x={x} y={y} rotate={rotate} scale={1.35}>
      <path d="M0.6 0.6 C5.6 3 5.8 9.4 2.2 12.6 C3 8.8 1.6 4.4 -1 1.6 Z" fill={BANANA_DARK} />
      <path d="M-0.6 0.6 C-5.6 3 -5.8 9.4 -2.2 12.6 C-3 8.8 -1.6 4.4 1 1.6 Z" fill={BANANA} />
      <circle cx="0" cy="0.6" r="1.3" fill={BANANA_TIP} />
      <circle cx="-2.2" cy="12.3" r="0.7" fill={BANANA_TIP} />
      <circle cx="2.2" cy="12.3" r="0.7" fill={BANANA_TIP} />
    </Layer>
  )
}

/* ───────── さる ───────── */

type Mood = 'plain' | 'sad' | 'idea' | 'strain' | 'happy'

/** かた と 手の さき から、ひじ の場所を きめる(2本の ほね。ひじ は 下がわへ まがる)。 */
function armJoints(shoulder: Point, target: Point, part: number): { readonly elbow: Point; readonly hand: Point } {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.hypot(dx, dy) || 1
  const reach = Math.min(dist, part * 2 - 0.05)
  const ux = dx / dist
  const uy = dy / dist
  const bend = Math.sqrt(Math.max(0, part * part - (reach / 2) ** 2))
  const mid: Point = [shoulder[0] + (ux * reach) / 2, shoulder[1] + (uy * reach) / 2]
  const a: Point = [mid[0] - uy * bend, mid[1] + ux * bend]
  const b: Point = [mid[0] + uy * bend, mid[1] - ux * bend]
  return { elbow: a[1] >= b[1] ? a : b, hand: [shoulder[0] + ux * reach, shoulder[1] + uy * reach] }
}

const SHOULDER_NEAR: Point = [1, -13.8]
const SHOULDER_FAR: Point = [-0.6, -13.8]
const ARM_PART = 4.2

function Arm({ shoulder, target, color }: { readonly shoulder: Point; readonly target: Point; readonly color: string }) {
  const { elbow, hand } = armJoints(shoulder, target, ARM_PART)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="1.6" fill={FACE} />
    </>
  )
}

function Face({ mood, t }: { readonly mood: Mood; readonly t: number }) {
  return (
    <>
      <ellipse cx="3" cy="-15.4" rx="3" ry="2.8" fill={FACE} />
      <circle cx="2.4" cy="-14.7" r="0.95" fill={CHEEK} opacity="0.6" />
      {mood === 'plain' && (
        <>
          <circle cx="3.2" cy="-17" r="0.65" fill={EYE} />
          <path d="M3.5 -14 Q4.4 -13.2 5.4 -14" fill="none" stroke={MOUTH} strokeWidth="0.55" strokeLinecap="round" />
        </>
      )}
      {mood === 'sad' && (
        <>
          <circle cx="3.2" cy="-16.8" r="0.65" fill={EYE} />
          <path d="M2.1 -18.6 L4 -18" fill="none" stroke={FUR_DARK} strokeWidth="0.55" strokeLinecap="round" />
          <path d="M3.4 -13.6 Q4.4 -14.6 5.4 -13.6" fill="none" stroke={MOUTH} strokeWidth="0.55" strokeLinecap="round" />
        </>
      )}
      {mood === 'idea' && (
        <>
          <circle cx="3.2" cy="-17" r="0.9" fill={EYE} />
          <circle cx="3.45" cy="-17.3" r="0.3" fill="#ffffff" />
          <path d="M2.2 -18.8 Q3.2 -19.4 4.2 -18.8" fill="none" stroke={FUR_DARK} strokeWidth="0.5" strokeLinecap="round" />
          <ellipse cx="4.6" cy="-13.9" rx="0.65" ry="0.8" fill={MOUTH} />
        </>
      )}
      {mood === 'strain' && (
        <>
          <path d="M2.3 -17.7 L3.9 -17 L2.3 -16.3" fill="none" stroke={EYE} strokeWidth="0.55" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3.4 -14 h2.2" fill="none" stroke={MOUTH} strokeWidth="0.6" strokeLinecap="round" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M2.3 -16.7 Q3.2 -18 4.1 -16.7" fill="none" stroke={EYE} strokeWidth="0.6" strokeLinecap="round" />
          {/* もぐもぐ: 口が すこし ひらいたり とじたり */}
          <path d={`M3.2 -14.3 Q4.4 ${-12.7 + Math.abs(wave(t, 0.5)) * 0.5} 5.8 -14.3 Z`} fill={MOUTH} />
        </>
      )}
    </>
  )
}

type MonkeyProps = {
  readonly t: number
  readonly mood: Mood
  readonly near: Point
  readonly far: Point
  readonly legs: number
  readonly headTilt: number
  readonly tail: number
}

function Monkey({ t, mood, near, far, legs, headTilt, tail }: MonkeyProps) {
  return (
    <>
      {/* しっぽ: 体の うしろから まるく のびる */}
      <Layer rotate={tail} origin={[-3.6, -8]}>
        <path d="M-3.6 -7.6 Q-10 -7.4 -9.4 -13.6 Q-9 -17.4 -6.4 -16.6" fill="none" stroke={FUR} strokeWidth="1.9" strokeLinecap="round" />
      </Layer>
      {/* むこうの うで・あし(ほんの すこし くらい色) */}
      <Arm shoulder={SHOULDER_FAR} target={far} color={FUR_DARK} />
      <Layer rotate={-legs * 0.6} origin={[-1.4, -6.6]}>
        <rect x="-3" y="-7" width="3.2" height="7" rx="1.6" fill={FUR_DARK} />
        <ellipse cx="-0.6" cy="-0.6" rx="2.6" ry="1.1" fill={FUR_DARK} />
      </Layer>
      <Layer rotate={legs} origin={[1.6, -6.6]}>
        <rect x="0" y="-7" width="3.2" height="7" rx="1.6" fill={FUR} />
        <ellipse cx="2.2" cy="-0.6" rx="2.6" ry="1.1" fill={FUR} />
      </Layer>
      {/* どう: 小さな 体に おなかの 白っぽい ところ */}
      <ellipse cx="0" cy="-10.5" rx="4.6" ry="5.2" fill={FUR} />
      <ellipse cx="1.8" cy="-10.2" rx="2.8" ry="3.8" fill={FACE} />
      {/* あたま: くびは みじかい。どう の まんなかの 上 */}
      <Layer rotate={headTilt} origin={[1, -12.8]}>
        <circle cx="-2.4" cy="-16.8" r="1.8" fill={FUR_DARK} />
        <circle cx="-2.4" cy="-16.8" r="1" fill={FACE} />
        <circle cx="1.2" cy="-16.5" r="4.3" fill={FUR} />
        <path d="M-0.6 -20.4 q1.2 -1.9 2.4 -0.2 q0.8 -1.7 2 0" fill="none" stroke={FUR_DARK} strokeWidth="0.7" strokeLinecap="round" />
        <Face mood={mood} t={t} />
      </Layer>
      {/* てまえの うで: かた から ひじ で まがって 手へ(いちばん 上に かさねる) */}
      <Arm shoulder={SHOULDER_NEAR} target={near} color={FUR} />
    </>
  )
}

/* ───────── にぎやかし ───────── */

/** 「そうだ!」の ひらめき。電球 */
function Bulb({ x, y, t }: { readonly x: number; readonly y: number; readonly t: number }) {
  const show = during(t, IDEA - 0.1, PULL, 0.15)
  if (show <= 0) return null
  const pop = Math.max(0, backOut(span(t, IDEA - 0.1, IDEA + 0.25)))
  return (
    <Layer x={x} y={y} scale={pop} opacity={show}>
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x="-0.4" y="-8.6" width="0.9" height="2.6" rx="0.45" fill="#f2b632" transform={`rotate(${-75 + i * 30})`} />
      ))}
      <circle cx="0" cy="-1" r="3.6" fill="#ffe36a" />
      <circle cx="-1.1" cy="-2.2" r="1" fill="#ffffff" opacity="0.8" />
      <rect x="-1.6" y="2.4" width="3.2" height="1.8" rx="0.7" fill="#a8b0b8" />
    </Layer>
  )
}

/** とどかなくて しょんぼり した ときの あせ(さる の あたまの よこ) */
function SweatDrop({ t }: { readonly t: number }) {
  const show = during(t, 2.4, IDEA, 0.2)
  if (show <= 0) return null
  const p = ((t - 2.4) % 0.7) / 0.7
  return <path d="M0 -1.6 Q1.5 0.5 0 1.4 Q-1.5 0.5 0 -1.6 Z" fill="#7cc4f2" opacity={show * (1 - p * 0.5)} transform={`translate(-4.6 ${-21 + p * 5})`} />
}

/** バナナを とった しゅんかん の きらきら */
function Cheer({ t, x, y }: { readonly t: number; readonly x: number; readonly y: number }) {
  const show = during(t, GRAB - 0.05, GRAB + 0.9, 0.15)
  if (show <= 0) return null
  const p = span(t, GRAB - 0.05, GRAB + 0.9, easeOut)
  const spots: readonly (readonly [number, number, string])[] = [
    [-7, -8, '#ffc233'],
    [8, -9, '#ffffff'],
    [10, 1, '#ff7a4d'],
  ]
  return (
    <g opacity={show}>
      {spots.map(([dx, dy, color], i) => (
        <Star key={i} cx={x + dx * (0.6 + p * 0.6)} cy={y + dy * (0.6 + p * 0.6)} r={2.4 - p} color={color} spin={p * 120 + i * 40} />
      ))}
    </g>
  )
}

/** はこんでいる ときの ほこり(戸だなの 足もとから) */
function Dust({ t }: { readonly t: number }) {
  const show = during(t, PULL + 0.1, PULL_END, 0.2)
  if (show <= 0) return null
  const dx = mix(t, PULL, PULL_END, CABINET_START_DX, 0, easeInOut)
  return (
    <g opacity={show * 0.7} fill="#ffffff" stroke="#d8e2d0" strokeWidth="0.4">
      {[0, 0.5].map((offset) => {
        const p = ((t - PULL + offset) % 1) / 1
        return <circle key={offset} cx={CABINET_LEFT + 47 + dx + p * 5} cy={96 - p * 4} r={0.8 + p * 1.8} opacity={1 - p} />
      })}
    </g>
  )
}

/* ───────── お話の ぜんたい ───────── */

/** さるの よこの場所(戸だなを ひっぱる あいだは、戸だなの ふちに あわせる) */
function monkeyX(t: number): number {
  const standX = CABINET_LEFT + CABINET_START_DX - PULL_GAP
  const pulledX = CABINET_LEFT - PULL_GAP
  if (t < PULL) return mix(t, ENTER, 1.1, -14, standX, easeOut)
  if (t < PULL_END) return CABINET_LEFT + mix(t, PULL, PULL_END, CABINET_START_DX, 0, easeInOut) - PULL_GAP
  if (t < JUMP) return pulledX
  return mix(t, JUMP, LAND, pulledX, LAND_X, (x) => x)
}

function monkeyY(t: number): number {
  if (t >= LAND) return TOP_Y
  if (t >= JUMP) {
    const p = span(t, JUMP, LAND)
    return GROUND_Y + (TOP_Y - GROUND_Y) * p - 16 * Math.sin(Math.PI * p)
  }
  return GROUND_Y - 9 * hopLift(t)
}

/** ぴょんぴょん はねている とき の たかさ(0〜1) */
function hopLift(t: number): number {
  return Math.max(Math.sin(Math.PI * span(t, HOP1, HOP1 + 0.6)), Math.sin(Math.PI * span(t, HOP2, HOP2 + 0.6)))
}

function moodAt(t: number): Mood {
  if (t < SAD) return 'plain'
  if (t < IDEA) return 'sad'
  if (t < PULL) return 'idea'
  if (t < PULL_END) return 'strain'
  if (t < GRAB) return 'plain'
  return 'happy'
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)
  const lift = hopLift(t)
  const jumping = t >= JUMP && t < LAND
  const jumpP = span(t, JUMP, LAND)

  const x = monkeyX(t)
  const y = monkeyY(t)
  const cabinetDx = mix(t, PULL, PULL_END, CABINET_START_DX, 0, easeInOut)
  const onBox = t >= LAND

  // あし: あるく・ひっぱる あいだは ふり、とんでいる あいだは たたむ
  const walking = t >= ENTER && t < 1.1 ? Math.sin((t - ENTER) * Math.PI * 5) * (1 - span(t, 0.95, 1.1)) : 0
  const pulling = t >= PULL && t < PULL_END ? Math.sin((t - PULL) * Math.PI * 4) : 0
  const legs = (walking + pulling) * 22 + (jumping ? 24 * Math.sin(Math.PI * jumpP) : 0) + lift * 14

  // 体の かたむき: しょんぼり で 前かがみ、ひっぱる ときは うしろへ、ジャンプで 上むき
  const sag = during(t, SAD, PULL - 0.1, 0.3) * 6
  const lean = -9 * span(t, PULL - 0.1, PULL + 0.1) * (1 - span(t, PULL_END, PULL_END + 0.2))
  const rotate = sag + lean - (jumping ? 12 * Math.sin(Math.PI * jumpP) : 0)

  // かがみ・のび・着地のつぶれ
  const crouch = t < JUMP ? span(t, JUMP - 0.3, JUMP, easeOut) : 0
  const landSquash = Math.sin(Math.PI * span(t, LAND, LAND + 0.22)) * 0.12
  const stretch = jumping ? 0.08 * Math.sin(Math.PI * jumpP) : lift * 0.05
  const scaleY = MONKEY_SCALE * (1 - 0.18 * crouch - landSquash + stretch)
  const scaleX = MONKEY_SCALE * (1 + 0.1 * crouch + landSquash * 0.6)

  // 手の ねらい(さるの 絵の中の 場所)
  const hang: Point = [1.5, -6.2]
  const farHang: Point = [-0.2, -6.4]
  const up: Point = [7.5, -21.5]
  const pullHand: Point = [8.4, -10.6]
  const bananaHand: Point = [(BANANA_X - LAND_X) / MONKEY_SCALE, (BANANA_TOP_Y + 2 - TOP_Y) / MONKEY_SCALE]
  const mouthHand: Point = [6.6, -9]
  const mixPoint = (a: Point, b: Point, k: number): Point => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

  const pullK = span(t, PULL - 0.2, PULL) * (1 - span(t, PULL_END, PULL_END + 0.2))
  const reachK = span(t, JUMP - 0.1, JUMP + 0.1) * (1 - span(t, LAND, LAND + 0.1))
  const toBanana = span(t, LAND + 0.05, GRAB, easeOut)
  const toMouth = span(t, GRAB, GRAB + 0.4, easeInOut)

  let near: Point = mixPoint(hang, up, lift)
  let far: Point = mixPoint(farHang, up, lift)
  near = mixPoint(near, pullHand, pullK)
  far = mixPoint(far, [pullHand[0] - 0.6, pullHand[1] - 1], pullK)
  near = mixPoint(near, up, reachK)
  far = mixPoint(far, up, reachK)
  if (onBox) {
    near = mixPoint(mixPoint(up, bananaHand, toBanana), mouthHand, toMouth)
    far = mixPoint(up, farHang, span(t, LAND, LAND + 0.3))
  }
  // あるいている あいだは 手を ふる
  if (walking !== 0 && t < 1.1) {
    near = [hang[0] - walking * 3, hang[1]]
    far = [farHang[0] + walking * 3, farHang[1]]
  }

  const headTilt =
    -14 * lift -
    (t >= HOP1 && t < SAD ? 4 : 0) +
    during(t, SAD + 0.1, PULL - 0.1, 0.3) * 12 -
    14 * span(t, PULL_END, PULL_END + 0.3) * (1 - span(t, GRAB, GRAB + 0.2)) -
    (jumping ? 8 : 0) +
    (t >= GRAB ? wave(t, 0.5) * 2 : 0)

  const tail = wave(t, 1.6) * 7 + (jumping ? -10 : 0)

  // バナナ: さいしょは ぼう から ぶらさがる。とった あとは 手に もつ
  const sway = wave(t, 1.4) * 3 + lift * 3
  const handGlobal: Point = [x + near[0] * MONKEY_SCALE, y + near[1] * MONKEY_SCALE]
  const held = t >= GRAB
  const eatTilt = mix(t, GRAB, GRAB + 0.4, 20, 150, easeInOut) + (t >= GRAB + 0.4 ? wave(t, 0.5) * 5 : 0)
  const shadowY = onBox ? TOP_Y + 0.4 : 97.4
  const shadowSize = onBox ? 5 : 5 * (1 - (GROUND_Y - y) / 90)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={null} clouds={[[2, 7, 0.9], [80, 6, 0.8]]} tufts={[6, 24, 100]} />
        <Cabinet dx={cabinetDx} />
        <Stand t={t} />
        <Dust t={t} />
        {/* バナナ の ひも(ぼう から) */}
        <Layer opacity={span(t, 0.3, 0.6)}>
          {held ? (
            <path d={`M${BANANA_X} ${STRING_Y} q0.8 1.6 -0.4 3.2`} fill="none" stroke="#5a3b2a" strokeWidth="0.7" strokeLinecap="round" />
          ) : (
            <>
              <path d={`M${BANANA_X} ${STRING_Y} L${BANANA_X} ${BANANA_TOP_Y}`} fill="none" stroke="#5a3b2a" strokeWidth="0.7" strokeLinecap="round" />
              <Layer x={0} y={0} rotate={sway} origin={[BANANA_X, STRING_Y]}>
                <Bananas x={BANANA_X} y={BANANA_TOP_Y} rotate={0} />
              </Layer>
            </>
          )}
        </Layer>
        <Layer opacity={span(t, ENTER - 0.1, ENTER + 0.1)}>
          <ellipse cx={x} cy={shadowY} rx={Math.max(0, shadowSize)} ry="1.3" fill="#000000" opacity="0.14" />
          <Layer x={x} y={y} rotate={rotate} scaleX={scaleX} scaleY={scaleY}>
            <Monkey t={t} mood={moodAt(t)} near={near} far={far} legs={legs} headTilt={headTilt} tail={tail} />
            <SweatDrop t={t} />
          </Layer>
        </Layer>
        {held && <Bananas x={handGlobal[0]} y={handGlobal[1] - 0.5} rotate={eatTilt} />}
        <Bulb x={x + 3} y={y - 28} t={t} />
        <Cheer t={t} x={BANANA_X} y={26} />
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Ink char={CHAR} progress={ink.progress} tint={ink.tint} />
      <Sparkles cx={54.5} cy={54} progress={ink.sparkle} />
    </>
  )
}

const scene: SceneModule = {
  char: CHAR,
  duration: DURATION,
  beats: [
    { at: 0, label: 'ぼうに バナナが ぶらさがる', sound: 'pop' },
    { at: ENTER, label: '子ざるが とんでくる' },
    { at: HOP1, label: 'はねても バナナに とどかない' },
    { at: SAD, label: 'しょんぼり' },
    { at: IDEA, label: 'そうだ! と ひらめく', sound: 'pop' },
    { at: PULL, label: 'しろい 戸だなを ひっぱってくる' },
    { at: JUMP, label: '戸だなの 上へ ぴょーん', sound: 'pop' },
    { at: GRAB, label: 'バナナを とって にこにこ', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '百 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
