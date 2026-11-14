/*
 * 字(じ): やねの 下で、こどもが そだつ。(共通部品 sceneFigures で 書きなおした もの)
 *
 * ほね(画と絵の対応)
 *   1画目(丶)  … やねの てっぺんに ある えんとつ(けむり が のぼる)
 *   2画目(ノ)  … やねの 左はし の たれた ひさし
 *   3画目(㇐)  … やねの 下はし(のきした)。右はしは 少し たれる
 *   4画目      … こどもの あたま
 *   5画目(亅)  … こどもの どう と あし
 *   6画目(一)  … こどもが りょううで を ひろげた かたち(さいごに「やったー」と ひろげる)
 *   ※ 人は ほんものの つくり を優先。あたま・どう の線とは「だいたい」重なる くらい
 *
 * ながれ
 *   やねと はしらの いえが できる。雨が ふってきて、ぬれた こどもが はしってくる
 *   → やねの 下に はいって 正面を むき、ほっと する(雨は やねに あたって、中は ぬれない)
 *   → おなかが すいた。だいに のった おにぎりを とって、もぐもぐ たべる
 *   → たべたら、ぐんぐん 大きく そだつ(雨は やんで、お日さまが 出る)
 *   → 「やったー」と りょううで を ひろげた しゅんかんに ほね が ひかって、絵が うすくなり、字「字」が のこる
 *
 * はしりは run()、むきを かえるのは turnAround()。手は { to } で おにぎり・口・6画目へ。
 * 体の 大きさは、たべて そだつ ときだけ height を 大きくする(足もとが 地面に ついたまま)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, Desk, HANG_ARM, LOOKS, mixLimb, Person, personRig, Rain, run, Sigh, Sun, turnAround, type Limb, type PersonProps } from '../sceneFigures'

const CHAR = '字'

const ROOF = '#d9694f'
const ROOF_LIGHT = '#ec8a6b'
const ROOF_DARK = '#b04e3b'
const BRICK = '#b5654a'
const BRICK_DARK = '#8f4b36'
const WOOD = '#b9824f'
const WOOD_DARK = '#8c5b3c'
const FLOOR = '#d3a56f'
const RICE = '#fbfbf3'
const RICE_SHADE = '#e6e3cf'
const NORI = '#2f4a3a'
const PLATE = '#cfe3f2'

const KID_LOOK = { ...LOOKS.boy, top: '#ffb44a', bottom: '#4f9be0', bottomKind: 'shorts', sleeves: 'short' } as const

/** くぎり の時間(秒) */
const RUN = 0.9
const ARRIVE = 2.4
const HUNGRY = 2.9
const REACH = 3.3
const GRAB = 3.9
const BITE = 4.8
const GROW = 5.7
const WIDE = 6.1
const INK = 7.0
const DONE = 10.0
const DURATION = 10.6

const GROUND = 96
const KID_X = 55
/** 小さい ときと、たべて そだった ときの 背の高さ */
const SMALL_H = 38
const BIG_H = 58
/** おにぎり の まんなか(だいの 上)。手は ここへ のばす */
const RICE_AT: readonly [number, number] = [66, 76]
const STOOL_TOP = 79.4
/** ひろげた りょううで の 手先(6画目の 両はし) */
const WIDE_RIGHT_HAND: readonly [number, number] = [14.4, 63.5]
const WIDE_LEFT_HAND: readonly [number, number] = [96.9, 59.7]

type Pt = readonly [number, number]

/** 雨を くぎる はば と、その 場所で 雨が とまる たかさ(やねの 上、はしの そとは 地面) */
const RAIN_BANDS: readonly (readonly [number, number, number])[] = [[-2, 16, 98], [16, 28, 29], [28, 44, 22], [44, 64, 14], [64, 80, 18], [80, 91, 26], [91, 111, 98]]

/** 雨: まっすぐ 下に おちる。やねの 下は ぬれない(やねの たかさで はねて とまる) */
function RoofRain({ t, amount }: { readonly t: number; readonly amount: number }) {
  return (
    <>
      {RAIN_BANDS.map(([left, right, ground]) => (
        <Rain key={left} t={t} amount={amount} left={left} right={right} ground={ground} />
      ))}
    </>
  )
}

/** いえ: やねを 2本の はしら が ささえる(ふきぬけの あずまや)。かべは なく、こどもが 入れる */
function House({ t }: SceneProps) {
  const posts = span(t, 0.15, 0.7, backOut)
  const roof = span(t, 0.3, 0.95, backOut)
  const chimney = span(t, 0.7, 1.1, backOut)
  return (
    <>
      <rect x="17" y="95" width="76" height="3.4" rx="1.4" fill={FLOOR} />
      <Layer scaleY={posts} origin={[54, 96]}>
        <rect x="22.5" y="26" width="3.6" height="70" rx="1.2" fill={WOOD} />
        <rect x="84.2" y="26" width="3.6" height="70" rx="1.2" fill={WOOD} />
        <rect x="22.5" y="26" width="1.3" height="70" fill={WOOD_DARK} opacity="0.5" />
        <rect x="84.2" y="26" width="1.3" height="70" fill={WOOD_DARK} opacity="0.5" />
      </Layer>
      <Layer scale={chimney} origin={[54.4, 20]}>
        <Bone char={CHAR} n={1} color={BRICK} width={7} />
        <rect x="50.4" y="7.8" width="8" height="2.4" rx="1" fill={BRICK_DARK} />
      </Layer>
      <Layer scale={roof} origin={[54, 30]}>
        <path d="M15 41.5 C16 33 20.5 27 32 22 Q54 10 76 20.5 C85 23.5 90.5 26.5 89.8 31 C88.5 28.6 84 27 78 27 L26 28.4 C21.5 29.5 18.5 34 15 41.5 Z" fill={ROOF} />
        <path d="M33 22.6 Q54 12 75 21 Q54 16.8 33 25 Z" fill={ROOF_LIGHT} />
        <path d="M26 28.4 L78 27 L77.6 24.6 L25.6 26 Z" fill={ROOF_DARK} />
      </Layer>
    </>
  )
}

/** えんとつの けむり。ゆっくり のぼって、ふくらんで きえる */
function Smoke({ t }: SceneProps) {
  const show = span(t, 1.0, 1.4)
  if (show <= 0) return null
  return (
    <g fill="#ffffff" opacity={show * 0.9}>
      {[0, 0.9, 1.8].map((offset) => {
        const p = ((t + offset) % 2.7) / 2.7
        return <circle key={offset} cx={54.4 + Math.sin(p * 6) * 1.8 + p * 3} cy={7 - p * 11} r={1.2 + p * 2.6} opacity={Math.sin(p * Math.PI) * 0.8} />
      })}
    </g>
  )
}

/** おにぎり(まんなか が 0,0。とがった先が 上) */
function RiceBall({ at, size }: { readonly at: Pt; readonly size: number }) {
  if (size <= 0) return null
  return (
    <Layer x={at[0]} y={at[1]} scale={size}>
      <path d="M0 -4.4 L-4.6 3.2 L4.6 3.2 Z" fill={RICE} stroke={RICE} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M2.2 -2.2 L4.6 3.2 L1 3.2 Z" fill={RICE_SHADE} stroke={RICE_SHADE} strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="-2.9" y="0.8" width="5.8" height="3.8" rx="0.9" fill={NORI} />
    </Layer>
  )
}

/** おにぎりを のせた だい(おさら つき) */
function Stool({ t }: SceneProps) {
  const show = span(t, 0.5, 1.0, backOut)
  return (
    <Layer scale={show} origin={[RICE_AT[0], GROUND]}>
      <Desk x={RICE_AT[0]} y={GROUND} width={14} height={GROUND - STOOL_TOP} color={WOOD} />
      <ellipse cx={RICE_AT[0]} cy={STOOL_TOP - 0.6} rx="6.4" ry="1.5" fill={PLATE} />
    </Layer>
  )
}

/** おにぎりの ゆげ(だいに おいてあるあいだ) */
function Steam({ t }: SceneProps) {
  const show = span(t, 1.2, 1.6) * (1 - span(t, GRAB - 0.1, GRAB + 0.1))
  if (show <= 0) return null
  return (
    <g opacity={show} fill="none" stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round">
      {[-2.2, 2.2].map((dx, i) => {
        const p = (t * 0.9 + i * 0.5) % 1
        return <path key={dx} d={`M${RICE_AT[0] + dx} ${RICE_AT[1] - 5 - p * 4} q-1.2 -1.4 0 -2.6 q1.2 -1.4 0 -2.6`} opacity={Math.sin(p * Math.PI)} />
      })}
    </g>
  )
}

/** そだつ しるし: 上へ のぼる やじるし と、ほし */
function Growth({ t }: SceneProps) {
  const show = during(t, GROW + 0.1, WIDE + 0.5, 0.3)
  if (show <= 0) return null
  const p = span(t, GROW + 0.1, WIDE + 0.5)
  return (
    <g opacity={show}>
      {[34, 76].map((x, i) => (
        <path key={x} d={`M${x - 3} ${58 - p * 14 - i * 3} l3 -3.6 l3 3.6`} fill="none" stroke="#4caf6a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {[[30, 44], [80, 42], [45, 30]].map(([x, y], i) => (
        <Star key={x} cx={x} cy={y - p * 4} r={2.6 - i * 0.3} color="#ffc233" spin={p * 180 + i * 50} />
      ))}
    </g>
  )
}

/** こどもの かっこう: はしる(横) → 正面を むいて ほっと → おにぎり → たべる → そだつ → ひろげる */
function kidAt(t: number): PersonProps {
  const height = mix(t, GROW, GROW + 0.8, SMALL_H, BIG_H, backOut)
  const base = { x: KID_X, y: GROUND, build: 'child', height, look: KID_LOOK } as const
  if (t < ARRIVE) {
    const r = run(t, { from: -16, to: KID_X, start: RUN, end: ARRIVE, build: 'child', height: SMALL_H, stride: 22 })
    return { ...base, ...r, face: 'sad' }
  }
  const head = personRig({ ...base, facing: 'front' }).world.head
  const headR = personRig({ ...base, facing: 'front' }).body.headR * personRig({ ...base, facing: 'front' }).scale
  const mouth: Pt = [head[0] + headR * 0.9, head[1] + headR * 0.55]
  // 右手(体の 左手 = 画面の 右): ぶらん → おにぎり → 口 → ぶらん → 6画目の 右はし
  const toRice: Limb = { to: [RICE_AT[0], RICE_AT[1] + 1.5] }
  let eating: Limb = HANG_ARM
  eating = mixLimb(eating, toRice, span(t, REACH, GRAB, easeInOut))
  eating = mixLimb(eating, { to: mouth }, span(t, GRAB + 0.1, BITE, easeInOut))
  eating = mixLimb(eating, HANG_ARM, span(t, 5.6, 6.0, easeInOut))
  const wide = span(t, WIDE, WIDE + 0.6, easeInOut)
  const leftArm = mixLimb(eating, { to: WIDE_LEFT_HAND }, wide)
  const rightArm = mixLimb(HANG_ARM, { to: WIDE_RIGHT_HAND }, wide)
  const chewing = t >= BITE && t < 5.8
  const hungry = t >= HUNGRY && t < BITE
  const face = t >= WIDE ? 'joy' : chewing ? 'smile' : hungry ? 'sad' : 'smile'
  const gaze = t >= HUNGRY && t < 4.9 ? 1 : 0
  const bob = chewing ? Math.sin(t * 17) * 3 : 0
  return { ...base, ...turnAround(t, ARRIVE, 'right', 'front'), pose: { leftArm, rightArm, head: bob }, face, gaze }
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)
  const rainAmount = during(t, 0.5, 3.6, 0.35)
  const kid = kidAt(t)
  const enter = span(t, RUN - 0.15, RUN)
  const rig = personRig(kid)
  const head = rig.world.head

  // おにぎり: だい の 上 → 手の 上(たべおわるまで)。ひとくち ごとに ちいさく なる
  const hand = rig.world.arms.left.end
  const ballAt: Pt = t >= GRAB ? [hand[0], hand[1] - 1.5] : RICE_AT
  const ballSize = 1 - 0.28 * span(t, 4.9, 5.05) - 0.27 * span(t, 5.2, 5.35) - 0.45 * span(t, 5.5, 5.65)

  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={null} overcast={during(t, 0.1, 3.9, 0.5)} />
        <Sun t={t} x={11} y={12} r={5.4} from={3.4} />
        <Stool t={t} />
        <House t={t} />
        <Steam t={t} />
        <Layer opacity={enter}>
          <Person {...kid} />
          <Sigh x={head[0] - 4} y={head[1] + 5} p={span(t, ARRIVE + 0.2, HUNGRY + 0.2, easeOut)} show={during(t, ARRIVE + 0.2, HUNGRY + 0.2, 0.2)} />
        </Layer>
        <RiceBall at={ballAt} size={t < 0.8 ? 0 : Math.max(0, ballSize) * span(t, 0.6, 1.1, backOut)} />
        <RoofRain t={t} amount={rainAmount} />
        <Smoke t={t} />
        <Growth t={t} />
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Layer scale={1 + bump} origin={[54.5, 54.5]}>
        <Ink char={CHAR} progress={ink.progress} tint={ink.tint} />
      </Layer>
      <Sparkles cx={54.5} cy={52} progress={ink.sparkle} />
    </>
  )
}

const scene: SceneModule = {
  char: CHAR,
  duration: DURATION,
  beats: [
    { at: 0, label: 'やねの いえが できる。雨が ふる', sound: 'pop' },
    { at: RUN, label: 'ぬれた こどもが はしってくる' },
    { at: ARRIVE, label: 'やねの 下で ほっと する', sound: 'pop' },
    { at: REACH, label: 'おなかが すいて、おにぎりを とる' },
    { at: BITE, label: 'もぐもぐ たべる' },
    { at: GROW, label: 'ぐんぐん そだつ', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '字 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
