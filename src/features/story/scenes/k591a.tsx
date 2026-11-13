/*
 * 多(おおい): お肉を 1まい、そのうえに もう 1まい。かさねて、たくさん。
 *
 * ほね(画と絵の対応)
 *   1〜3画目(うえの 夕)  … あとから のせた 2まいめの お肉(かさねた いちばん上)
 *   4〜6画目(したの 夕)  … 先に おさらに のせた 1まいめの お肉(したに ある)
 *   (字は 夕 が 上下に 2つ かさなる ならび。絵は お肉が 上下に かさなる ならび。
 *    おなじ「かさなる」を 見せる。大きさや 場所は だいたい で よい)
 *
 * ながれ
 *   台所が できる → おなかが ぺこぺこの 女の子が、ぐう と おなかを おさえる
 *   → かごから お肉を 1まい とって、おさらへ はこぶ → のせる。でも 1まい だけ では たりない(しょんぼり)
 *   → 「2まい かさねたい」と 思って(ふきだし)、かごへ もどり 2まいめを はこぶ
 *   → 1まいめの うえに そっと かさねる → 「たくさん!」と にっこり、ぴょんぴょん はねて ぱちぱち
 *   → ほね が ひかって、絵が うすくなり、字「多」が のこる
 *
 * 女の子は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(はこぶ手が とどく ところに かごと おさら を おいた)。
 *   くび は みじかく、あたま は どう の まんなか の上。カウンターの うしろに 立つので、あしは 見えない。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '多'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TEE = '#ff9f5a'
const TEE_DARK = '#e8863f'
const RIBBON = '#e8534a'
const WALL = '#fff1d6'
const WALL_LINE = '#f6e0b8'
const FRAME = '#d9a066'
const PANE = '#bfe6fb'
const SUN = '#ffd24a'
const COUNTER_TOP = '#efc08a'
const COUNTER_EDGE = '#dca56a'
const COUNTER_FACE = '#d98f55'
const DOOR = '#c97e47'
const KNOB = '#fff1d6'
const BASKET = '#c98f4e'
const BASKET_DARK = '#a86f36'
const PLATE = '#fdfdfb'
const PLATE_DARK = '#e6e9ed'
const MEAT = '#e0554f'
const MEAT_DARK = '#b9403c'
const MEAT_LIGHT = '#ef7a72'
const FAT = '#fbd9d0'
const MARBLING = '#f6b6aa'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const WANT = 0.6
const REACH_1 = 1.3
const GRAB_1 = 1.7
const LIFT_1 = 2.05
const SLIDE_1 = 1.75
const ARRIVE_1 = 2.45
const RELEASE_1 = 2.85
const FREE_1 = 3.3
const BACK = 3.4
const BACK_END = 4.1
const REACH_2 = 4.1
const GRAB_2 = 4.45
const SLIDE_2 = 4.5
const ARRIVE_2 = 5.2
const RELEASE_2 = 5.6
const JOY = 5.7
const INK = 6.6
const DONE = 9.3
const DURATION = 10

/** 女の子の いち(カウンターの うしろ)。かご の ちかく と、おさら の うしろ */
const AT_BASKET = 70
const AT_PLATE = 50
/** かたの たかさ と、うで ひとつぶんの 長さ */
const SHOULDER_Y = 41
const SHOULDER_X = 7.6
const ARM_PART = 15
/** カウンターの うえの めん(ここより 下は カウンターが かくす) */
const COUNTER_Y = 66

/** おさらの まんなか と、お肉の おかれる たかさ(1まいめ・かさねた 2まいめ) */
const PLATE_X = 48
const REST_1_Y = 66.4
const REST_2_Y = 63
/** お肉の 真ん中から 手までの ずれ(お肉の ふちを つまむ) */
const GRIP_X = 7
const GRIP_Y = -1

type Vec = readonly [number, number]
type Mood = 'hungry' | 'sad' | 'hope' | 'joy'

const lerp2 = (a: Vec, b: Vec, k: number): Vec => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/** お肉の かご の中の 2まい: ならんだ ところ、てが つかむ ところ */
const BASKET_SLICE_1 = { x: 85, y: 60, rot: -22, scale: 0.75 }
const BASKET_SLICE_2 = { x: 92, y: 59, rot: 18, scale: 0.75 }

/** かた から ひじ を通って 手 まで。ひじ は そとがわ・した へ まがる(side: 右 = 1 / 左 = -1) */
function solveArm(shoulder: Vec, target: Vec, side: 1 | -1) {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.max(Math.hypot(dx, dy), 0.001)
  // うで の長さ より とおい ときは、のばしきった ところ で 止める
  const reach = Math.min(dist, ARM_PART * 2 - 0.05)
  const ux = dx / dist
  const uy = dy / dist
  const half = reach / 2
  const bulge = Math.sqrt(ARM_PART * ARM_PART - half * half)
  const elbow: Vec = [shoulder[0] + ux * half + side * uy * bulge, shoulder[1] + uy * half - side * ux * bulge]
  const hand: Vec = [shoulder[0] + ux * reach, shoulder[1] + uy * reach]
  return { elbow, hand }
}

function Arm({ shoulder, elbow, hand }: { readonly shoulder: Vec; readonly elbow: Vec; readonly hand: Vec }) {
  return (
    <>
      {/* かた → ひじ: そで(おなじ色)。ひじ → 手: うで(はだ色) */}
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]}`} fill="none" stroke={TEE_DARK} strokeWidth="6" strokeLinecap="round" />
      <path d={`M${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={SKIN} strokeWidth="4.6" strokeLinecap="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.4" fill={SKIN} />
    </>
  )
}

/** お肉 1まい。まんなか が (0,0)。うえの めん・あつみ・ふちの しろい あぶら・さし */
function Meat() {
  return (
    <>
      <ellipse cx="0" cy="2.6" rx="13" ry="4.8" fill={MEAT_DARK} />
      <ellipse cx="0" cy="0" rx="13" ry="4.8" fill={MEAT} stroke={FAT} strokeWidth="1.6" />
      <ellipse cx="-4.6" cy="-1.6" rx="4" ry="1.2" fill={MEAT_LIGHT} />
      <path d="M-6 1.2 Q-2 -1 2 1.2 M3 2.2 Q6 0.8 8.6 2" fill="none" stroke={MARBLING} strokeWidth="1" strokeLinecap="round" />
    </>
  )
}

type SlicePose = { readonly x: number; readonly y: number; readonly rot: number; readonly scale: number }

function Slice({ pose }: { readonly pose: SlicePose }) {
  return (
    <Layer x={pose.x} y={pose.y} rotate={pose.rot} scale={pose.scale}>
      <Meat />
    </Layer>
  )
}

function Room({ t }: SceneProps) {
  return (
    <>
      <rect x="0" y="0" width="109" height="109" fill={WALL} />
      <path d="M0 40 H109 M0 52 H109" stroke={WALL_LINE} strokeWidth="1" />
      {/* まど: お日さまが さしこむ */}
      <rect x="6" y="8" width="24" height="22" rx="2" fill={FRAME} />
      <rect x="8.4" y="10.4" width="19.2" height="17.2" rx="1" fill={PANE} />
      <circle cx="21" cy="16.5" r={3.6 + wave(t, 2.4) * 0.15} fill={SUN} />
      <path d="M18 10.4 V27.6 M8.4 19 H27.6" stroke={FRAME} strokeWidth="1.4" />
    </>
  )
}

function Counter() {
  return (
    <>
      <rect x="0" y={COUNTER_Y} width="109" height="7" fill={COUNTER_TOP} />
      <rect x="0" y="72.2" width="109" height="1.6" fill={COUNTER_EDGE} />
      <rect x="0" y="73.8" width="109" height="30" fill={COUNTER_FACE} />
      <rect x="9" y="78" width="40" height="17" rx="2.4" fill={DOOR} />
      <rect x="58" y="78" width="40" height="17" rx="2.4" fill={DOOR} />
      <circle cx="44" cy="86.5" r="1.5" fill={KNOB} />
      <circle cx="63" cy="86.5" r="1.5" fill={KNOB} />
    </>
  )
}

function PlateShape() {
  return (
    <>
      <ellipse cx={PLATE_X} cy="70.6" rx="21" ry="4.4" fill="#000000" opacity="0.1" />
      <ellipse cx={PLATE_X} cy="69" rx="21" ry="4.6" fill={PLATE} />
      <ellipse cx={PLATE_X} cy="69" rx="15.5" ry="3" fill={PLATE_DARK} />
    </>
  )
}

function BasketShape() {
  return (
    <>
      <path d="M78.5 63 H101.5 L99.5 74 H80.5 Z" fill={BASKET} />
      <path d="M79.4 67.4 H100.6 M80 71 H99.8 M85 63 V74 M92 63 V74 M99 63 V74" fill="none" stroke={BASKET_DARK} strokeWidth="0.8" />
      <rect x="77" y="61.6" width="25" height="3.2" rx="1.6" fill={BASKET_DARK} />
    </>
  )
}

/** あたまの 中の かお。mood で 目・まゆ・口 を かえる。look = 目の むき(-1 左 〜 1 右) */
function Face({ mood, look }: { readonly mood: Mood; readonly look: number }) {
  const eye = look * 0.9
  const cheeks = (
    <>
      <ellipse cx="-6.8" cy="32.2" rx="2.1" ry="1.4" fill={CHEEK} opacity="0.6" />
      <ellipse cx="6.8" cy="32.2" rx="2.1" ry="1.4" fill={CHEEK} opacity="0.6" />
    </>
  )
  if (mood === 'joy') {
    return (
      <>
        {cheeks}
        <path d="M-6.2 29.6 Q-4 26.6 -1.8 29.6 M1.8 29.6 Q4 26.6 6.2 29.6" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
        <path d="M-4.2 32.4 Q0 40 4.2 32.4 Z" fill={MOUTH} />
        <path d="M-2 35.6 Q0 37.4 2 35.6 Q0 34.6 -2 35.6 Z" fill="#ff8a8a" />
      </>
    )
  }
  const eyes = (
    <>
      <circle cx={-4 + eye} cy="29" r="1.4" fill={EYE} />
      <circle cx={4 + eye} cy="29" r="1.4" fill={EYE} />
    </>
  )
  if (mood === 'hope') {
    return (
      <>
        {cheeks}
        {eyes}
        <path d="M-6 25.8 Q-4 24.6 -2.2 25.6 M2.2 25.6 Q4 24.6 6 25.8" fill="none" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
        <path d="M-2.6 33.2 Q0 35.8 2.6 33.2" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
      </>
    )
  }
  // 'hungry' と 'sad': まゆが さがって、口が への字(おなかが すいている のは ちいさな 口 あけ)
  return (
    <>
      {cheeks}
      {eyes}
      <path d="M-6.4 26.8 L-2.4 25 M2.4 25 L6.4 26.8" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
      {mood === 'hungry' ? <ellipse cx="0" cy="34.2" rx="1.7" ry="2" fill={MOUTH} /> : <path d="M-2.6 35 Q0 32.4 2.6 35" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />}
    </>
  )
}

/** 女の子の あたま・くび・どう(うで は べつ)。まんなか の x が 0 */
function GirlBody({ mood, look, tilt }: { readonly mood: Mood; readonly look: number; readonly tilt: number }) {
  return (
    <>
      {/* くび: みじかく、どう と あたま に ほとんど かくれる */}
      <rect x="-2.8" y="34" width="5.6" height="7" rx="2" fill={SKIN_SHADE} />
      <rect x="-8" y="37.8" width="16" height="40" rx="6.5" fill={TEE} />
      <path d="M-3.6 38 Q0 42.4 3.6 38 Z" fill={SKIN_SHADE} />
      <Layer rotate={tilt} origin={[0, 36]}>
        {/* ふたつ むすび の かみ */}
        <circle cx="0" cy="25" r="12" fill={HAIR} />
        <ellipse cx="-13.2" cy="31" rx="3.6" ry="6.2" fill={HAIR} />
        <ellipse cx="13.2" cy="31" rx="3.6" ry="6.2" fill={HAIR} />
        <circle cx="-11.4" cy="25.6" r="1.9" fill={RIBBON} />
        <circle cx="11.4" cy="25.6" r="1.9" fill={RIBBON} />
        <circle cx="0" cy="27.5" r="10.4" fill={SKIN} />
        <path d="M-10.2 25 Q-10 15.6 0 15.2 Q10 15.6 10.2 25 Q5.5 20.6 0 21.4 Q-5.5 20.6 -10.2 25 Z" fill={HAIR} />
        <Face mood={mood} look={look} />
      </Layer>
    </>
  )
}

/** おなかの ぐう: ぶるっとした 音の すじ。両がわに ひろがる */
function Rumble({ gx, show, t }: { readonly gx: number; readonly show: number; readonly t: number }) {
  if (show <= 0) return null
  const p = (t * 3.2) % 1
  return (
    <g opacity={show} fill="none" stroke="#8d96b8" strokeWidth="1" strokeLinecap="round">
      {[-1, 1].map((side) => (
        <g key={side} transform={`translate(${gx + side * (11 + p * 2)} 57)`} opacity={1 - p * 0.6}>
          <path d={`M0 -4 Q${side * 3} 0 0 4`} />
          <path d={`M${side * 3} -6 Q${side * 7} 0 ${side * 3} 6`} />
        </g>
      ))}
    </g>
  )
}

/** 「2まい かさねたい」: ふきだしの中に、かさなった 2まい */
function Wish({ t, gx }: { readonly t: number; readonly gx: number }) {
  const show = during(t, RELEASE_1 + 0.1, BACK + 0.6, 0.25)
  if (show <= 0) return null
  const pop = span(t, RELEASE_1 + 0.1, RELEASE_1 + 0.5, backOut)
  const bob = wave(t, 1.2) * 0.8
  return (
    <g opacity={show}>
      <circle cx={gx + 15} cy="23" r="1.3" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
      <circle cx={gx + 18.5} cy="19.5" r="2" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
      <Layer scale={pop} origin={[86, 16]}>
        <ellipse cx="86" cy="16" rx="15" ry="12.4" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.8" />
        <Layer x={86} y={19.6 + bob * 0.3} scale={0.78}>
          <Meat />
        </Layer>
        <Layer x={86} y={14.4 + bob} scale={0.78}>
          <Meat />
        </Layer>
      </Layer>
    </g>
  )
}

/** うれしい とき の ほし と、おさらの うえの きらきら */
function Cheer({ gx, t }: { readonly gx: number; readonly t: number }) {
  const k = during(t, JOY, JOY + 1.2, 0.2)
  if (k <= 0) return null
  const spin = t * 120
  return (
    <>
      <Star cx={gx - 18} cy={16} r={3.2 * k} color="#ffc233" spin={spin} />
      <Star cx={gx + 17} cy={13} r={2.6 * k} color="#ff7a4d" spin={-spin} />
      <Star cx={PLATE_X + 17} cy={57} r={2.2 * k} color="#ffffff" spin={spin * 1.3} />
      <Star cx={PLATE_X - 17} cy={55} r={2.6 * k} color="#ffd95a" spin={-spin * 1.3} />
    </>
  )
}

/** 右手の いち。はじめは おなか、かごで つかみ、はこび、おさらへ のせ、また おなかへ。さいごは ぱちぱち */
function rightHandAt(t: number, gx: number, lift: number, clapOpen: number): Vec {
  let hand: Vec = [gx + 3, 55 - lift]
  hand = lerp2(hand, [BASKET_SLICE_1.x + GRIP_X, BASKET_SLICE_1.y - GRIP_Y], span(t, REACH_1, GRAB_1, easeOut))
  hand = lerp2(hand, [gx + 17, 52], span(t, SLIDE_1, LIFT_1, easeInOut))
  hand = lerp2(hand, [PLATE_X + GRIP_X, REST_1_Y - GRIP_Y], span(t, ARRIVE_1, RELEASE_1, easeInOut))
  hand = lerp2(hand, [gx + 3, 55 - lift], span(t, RELEASE_1 + 0.05, FREE_1, easeInOut))
  hand = lerp2(hand, [BASKET_SLICE_2.x + GRIP_X, BASKET_SLICE_2.y - GRIP_Y], span(t, REACH_2, GRAB_2, easeOut))
  hand = lerp2(hand, [gx + 17, 52], span(t, SLIDE_2, SLIDE_2 + 0.3, easeInOut))
  hand = lerp2(hand, [PLATE_X + GRIP_X, REST_2_Y - GRIP_Y], span(t, ARRIVE_2, RELEASE_2, easeInOut))
  return lerp2(hand, [gx + 1.5 + clapOpen, 49 - lift], span(t, JOY, JOY + 0.25, easeInOut))
}

function leftHandAt(t: number, gx: number, lift: number, clapOpen: number): Vec {
  return lerp2([gx - 3, 55 - lift], [gx - 1.5 - clapOpen, 49 - lift], span(t, JOY, JOY + 0.25, easeInOut))
}

/** うごいている あいだ の 上下ゆれ(おおきな うごき の 中ほどが いちばん ゆれる) */
const glide = (t: number, from: number, to: number) => Math.sin(Math.PI * span(t, from, to))

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  // 台所が できる → 女の子・おさら・かご が ぽん と 出る
  const room = span(t, 0, 0.4)
  const counterRise = span(t, 0, 0.55, backOut)
  const girlPop = span(t, 0.15, 0.7, backOut)
  const itemPop = span(t, 0.3, 0.8, backOut)

  // 女の子の いち: かご → おさら → かご → おさら と、カウンターの うしろを すべる
  const slide = span(t, SLIDE_1, ARRIVE_1, easeInOut) - span(t, BACK, BACK_END, easeInOut) + span(t, SLIDE_2, ARRIVE_2, easeInOut)
  const moving = glide(t, SLIDE_1, ARRIVE_1) + glide(t, BACK, BACK_END) + glide(t, SLIDE_2, ARRIVE_2)
  const rumble = Math.max(during(t, WANT + 0.1, REACH_1, 0.15), during(t, RELEASE_1 + 0.1, BACK + 0.5, 0.15))
  const shake = rumble * wave(t, 0.1) * 0.5
  const baseX = AT_BASKET + (AT_PLATE - AT_BASKET) * slide
  const gx = baseX + shake

  // うれしくて はねる(ぴょんぴょん)
  const joyOn = during(t, JOY, JOY + 1.1, 0.1)
  const jump = Math.abs(Math.sin((t - JOY) * Math.PI * 2.4)) * 3.2 * joyOn
  const bob = -Math.abs(Math.sin(t * 13)) * 1.2 * Math.min(moving, 1) - jump

  // きもち と 目の むき
  const mood: Mood = t < GRAB_1 ? 'hungry' : t < RELEASE_1 + 0.05 ? 'hope' : t < BACK ? 'sad' : t < JOY ? 'hope' : 'joy'
  const look = Math.max(-1, Math.min(1, during(t, 1.2, 2.0, 0.2) + during(t, 4.0, 4.8, 0.2) - during(t, 2.3, 3.0, 0.2) - during(t, 5.1, 5.8, 0.2)))
  const tilt = mood === 'sad' ? 6 : mood === 'joy' ? wave(t, 0.4) * 3 : 0

  // うで: かた(どう と いっしょに 上下)から ひじ で まがって 手へ
  const lift = -bob
  const clapOpen = 3 * (0.5 + 0.5 * wave(t, 0.36))
  const shoulderR: Vec = [gx + SHOULDER_X, SHOULDER_Y + bob]
  const shoulderL: Vec = [gx - SHOULDER_X, SHOULDER_Y + bob]
  const armR = solveArm(shoulderR, rightHandAt(t, gx, lift, clapOpen), 1)
  const armL = solveArm(shoulderL, leftHandAt(t, gx, lift, clapOpen), -1)

  // お肉 1まいめ: かごの中 → 手に もつ → おさらに のる
  const held1 = t >= GRAB_1 && t < RELEASE_1
  const grab1 = span(t, GRAB_1, GRAB_1 + 0.4)
  const slice1: SlicePose = held1
    ? {
        x: armR.hand[0] - GRIP_X,
        y: armR.hand[1] + GRIP_Y,
        rot: mix(t, GRAB_1, GRAB_1 + 0.4, BASKET_SLICE_1.rot, -8) * (1 - span(t, ARRIVE_1, RELEASE_1)),
        scale: BASKET_SLICE_1.scale + (1 - BASKET_SLICE_1.scale) * grab1,
      }
    : t < GRAB_1
      ? BASKET_SLICE_1
      : { x: PLATE_X, y: REST_1_Y, rot: 0, scale: 1 }

  // お肉 2まいめ: かごの中 → 手に もつ → 1まいめの うえに かさなる
  const held2 = t >= GRAB_2 && t < RELEASE_2
  const grab2 = span(t, GRAB_2, GRAB_2 + 0.4)
  const slice2: SlicePose = held2
    ? {
        x: armR.hand[0] - GRIP_X,
        y: armR.hand[1] + GRIP_Y,
        rot: mix(t, GRAB_2, GRAB_2 + 0.4, BASKET_SLICE_2.rot, 8) * (1 - span(t, ARRIVE_2, RELEASE_2)),
        scale: BASKET_SLICE_2.scale + (1 - BASKET_SLICE_2.scale) * grab2,
      }
    : t < GRAB_2
      ? BASKET_SLICE_2
      : { x: PLATE_X, y: REST_2_Y, rot: 0, scale: 1 }

  // かさなった しゅんかん、2まいが ぎゅっと ちぢんで もどる
  const squash = Math.sin(span(t, RELEASE_2, RELEASE_2 + 0.35) * Math.PI) * 0.07

  return (
    <>
      <Layer opacity={ink.picture}>
        <Layer opacity={room}>
          <Room t={t} />
        </Layer>
        {/* 女の子の あたま と どう(カウンターの うしろ) */}
        <Layer x={gx} y={bob} scale={girlPop} origin={[0, 70]}>
          <GirlBody mood={mood} look={look} tilt={tilt} />
        </Layer>
        <Layer y={(1 - counterRise) * 26} opacity={room}>
          <Counter />
        </Layer>
        <Rumble gx={gx} show={rumble} t={t} />
        <Layer scale={itemPop} origin={[54, 70]}>
          {/* かごの中の お肉(まだ とられていない もの)は、かごの ふちの うしろ */}
          {t < GRAB_1 ? <Slice pose={BASKET_SLICE_1} /> : null}
          {t < GRAB_2 ? <Slice pose={BASKET_SLICE_2} /> : null}
          <BasketShape />
          <PlateShape />
        </Layer>
        {/* おさらの うえの お肉(かさねる とき ぎゅっと ちぢむ) */}
        <Layer scaleX={1 + squash * 0.6} scaleY={1 - squash} origin={[PLATE_X, 72]}>
          {t >= RELEASE_1 ? <Slice pose={slice1} /> : null}
          {t >= RELEASE_2 ? <Slice pose={slice2} /> : null}
        </Layer>
        {/* 手に もっている お肉 */}
        {held1 ? <Slice pose={slice1} /> : null}
        {held2 ? <Slice pose={slice2} /> : null}
        <Layer scale={girlPop} origin={[gx, 70]}>
          <Arm shoulder={shoulderL} elbow={armL.elbow} hand={armL.hand} />
          <Arm shoulder={shoulderR} elbow={armR.elbow} hand={armR.hand} />
        </Layer>
        <Wish t={t} gx={gx} />
        <Cheer gx={gx} t={t} />
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Ink char={CHAR} progress={ink.progress} tint={ink.tint} />
      <Sparkles cx={54.5} cy={52} progress={ink.sparkle} />
    </>
  )
}

const scene: SceneModule = {
  char: CHAR,
  duration: DURATION,
  beats: [
    { at: 0, label: '台所が できる。女の子は おなかが ぺこぺこ', sound: 'pop' },
    { at: WANT, label: 'おなかが ぐう' },
    { at: REACH_1, label: 'かごから お肉を 1まい とる' },
    { at: ARRIVE_1, label: 'おさらに のせる', sound: 'pop' },
    { at: RELEASE_1 + 0.1, label: '1まい だけ では たりない。2まい かさねたい' },
    { at: REACH_2, label: 'もう 1まい とりに いく' },
    { at: ARRIVE_2, label: '1まいめの うえに かさねる', sound: 'pop' },
    { at: JOY, label: 'たくさん! にっこり、ぴょんぴょん' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '多 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
