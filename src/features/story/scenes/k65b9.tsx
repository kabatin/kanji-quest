/*
 * 方(ほう): すきで つちを たがやす。おす ほうへ すすむ。(共通部品 sceneFigures で 書きなおした もの)
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … すきの 上の ぼう
 *   2画目(一)  … すきの よこに ながい とって
 *   3画目(𠃍)  … おす子の からだ(かた から せなか、さいごは 前に出した あし)
 *   4画目(ノ)  … すきの ながい え(とって から 下へ。さきは つちの中の はさき)
 *   (子は ほんものの 人の つくり で、とって は むねの たかさ。字とは だいたい 同じ ばしょ・むき に なればよい)
 *
 * ながれ
 *   はたけが ひろがる → すきを もった子が あるいてくる
 *   → はさきを つちに さす。つちが かたくて うごかない(こまった顔・あせ)
 *   → 足を ふんばり、からだごと ぐーっと おす(ひっしな顔)
 *   → ぐらっと うごいて、かたい つちが ほりおこされる。子は にっこり(小鳥も やってくる)
 *   → すき と 子が ほね に なって ひかり、絵が うすくなり、字「方」が のこる
 *
 * 子は Person(左むき。あるきは walk)。とって は 両手で にぎる:
 *   てまえの 手 と むこうの 手 を { to } で とっての うえに おき、すきは held(2つの 手の あいだ)に 描く。
 *   はたけ の つち・ひび・すきの はさき・ほりおこした つち は ここで 描く。赤い はちまき は headwear。
 */
import { during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Bird, LOOKS, Person, personRig, Sweat, walk, type PersonProps, type Point } from '../sceneFigures'

const CHAR = '方'

const BAND = '#e8534a'
const WOOD = '#9a6a42'
const WOOD_DARK = '#70452b'
const IRON = '#9fb0c0'
const IRON_DARK = '#7a8b9c'
const SOIL = '#d9a46f'
const SOIL_DARK = '#8f5c3a'
const SOIL_LIGHT = '#a8704a'
const CRACK = '#a87245'

/** くぎり の時間(秒) */
const ENTER = 0.3
const DROP = 1.7
const STUCK = 2.0
const PUSH = 3.2
const FREE = 5.0
const INK = 6.4
const DONE = 9.0
const DURATION = 10

/** 子の 背の高さ と 地面 */
const KID_HEIGHT = 58
const FLOOR = 94
/** 子が こしを おく ところ: 入ってくる はじめ・つちに さして とまる ところ・できあがり */
const START_X = 122
const STUCK_X = 92
const END_X = 72
/** すきの はさき の さきっぽ(子の こし から 左へ)と、とって の にぎる ばしょ(さき から えを 上へ) */
const TIP_AHEAD = 58
const TIP_Y = 93
const GRIP_AHEAD = 21
const GRIP_Y = 67
/** にぎりの さき(えを のばした ところ)、むこうの 手は とっての 少し 下 */
const HANDLE_EXTRA = 5
const FAR_HAND_DOWN = 6

const rotateAround = (p: Point, origin: Point, deg: number): Point => {
  const rad = (deg * Math.PI) / 180
  const dx = p[0] - origin[0]
  const dy = p[1] - origin[1]
  return [origin[0] + dx * Math.cos(rad) - dy * Math.sin(rad), origin[1] + dx * Math.sin(rad) + dy * Math.cos(rad)]
}

type Mood = 'calm' | 'troubled' | 'push' | 'happy'

/** 子が ぜんぶ の動きの もと になる 数字 */
type Motion = {
  /** すきの はさき を もちあげている量 / かたむき */
  readonly lift: number
  readonly tilt: number
  /** 上体の かたむき(おじぎ の むき が +) */
  readonly lean: number
  readonly mood: Mood
}

/** 子の こし の いち と あしの ふり(はたけに 入る間 と、おして すすむ間 だけ あるく) */
function kidWalk(t: number) {
  const common = { build: 'child', height: KID_HEIGHT } as const
  const come = walk(t, { ...common, from: START_X, to: STUCK_X, start: ENTER, end: DROP })
  const push = walk(t, { ...common, from: STUCK_X, to: END_X, start: PUSH, end: FREE, step: 7 })
  return t >= PUSH ? push : come
}

function motionAt(t: number): Motion {
  // はさきを つちに さす: ちょっと うかせて いたのを、すとんと おろす
  const lift = 4 * (1 - span(t, DROP - 0.15, DROP + 0.15))
  // うごかない とき すきが ぷるぷる、おす とき まえに かたむく
  const shake = t >= STUCK && t < PUSH ? Math.sin(t * 38) * 0.9 * span(t, STUCK, STUCK + 0.3) : 0
  const tilt = shake + mix(t, PUSH, PUSH + 0.4, 0, -2.5, easeOut) * (1 - span(t, FREE, FREE + 0.6))
  const press = span(t, STUCK + 0.3, PUSH - 0.1, easeInOut)
  const lean =
    t < STUCK ? 4 : t < PUSH ? mix(t, STUCK, PUSH, 6, 16, easeInOut) + shake * press : mix(t, PUSH, FREE, 16, 6, easeOut) * (1 - span(t, FREE, FREE + 0.9)) + 3 * span(t, FREE, FREE + 0.9) * (1 - span(t, INK - 0.4, INK - 0.1))
  const mood: Mood = t < DROP + 0.1 ? 'calm' : t < PUSH - 0.4 ? 'troubled' : t < FREE ? 'push' : 'happy'
  return { lift, tilt, lean, mood }
}

/** すき の とって・はさき の いち(こし x から。すきの かたむき・もちあげ も 入る) */
function plowAt(x: number, m: Motion): { readonly tip: Point; readonly grip: Point; readonly end: Point } {
  const tip0: Point = [x - TIP_AHEAD, TIP_Y]
  const move = (p: Point): Point => {
    const r = rotateAround(p, tip0, m.tilt)
    return [r[0], r[1] - m.lift]
  }
  const grip0: Point = [x - GRIP_AHEAD, GRIP_Y]
  const len = Math.hypot(grip0[0] - tip0[0], grip0[1] - tip0[1])
  const end0: Point = [grip0[0] + ((grip0[0] - tip0[0]) / len) * HANDLE_EXTRA, grip0[1] + ((grip0[1] - tip0[1]) / len) * HANDLE_EXTRA]
  return { tip: move(tip0), grip: move(grip0), end: move(end0) }
}

/** はたけ: かたく かわいた つち。ひびわれ が ある(Backdrop の 上に のせる) */
function Field() {
  return (
    <>
      <ellipse cx="54.5" cy="97" rx="58" ry="8.5" fill={SOIL} />
      <g fill="none" stroke={CRACK} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 95 l4 -2 l3 2 l4 -1" />
        <path d="M7 93 l1 3 l-2 3" />
        <path d="M45 99 l5 -1.6 l3 2 l6 -1" />
        <path d="M50 98 l-1 -3" />
        <path d="M86 97 l4 -2 l4 1.6 l5 -1.4" />
        <path d="M92 95 l1 4" />
        <path d="M72 100 l3 -1 l3 1.4" />
      </g>
    </>
  )
}

/** ほりおこされた つち(はさき が とおった あと)。はさき から うしろへ のびる。 */
function Furrow({ bladeX, startX }: { readonly bladeX: number; readonly startX: number }) {
  const width = startX - bladeX + 8
  if (width <= 6) return null
  const left = bladeX - 1
  return (
    <>
      <path d={`M${left} 98 Q${left + 1} 91.5 ${left + 6} 91.4 L${left + width - 3} 91.8 Q${left + width} 94 ${left + width - 2} 98 Z`} fill={SOIL_DARK} />
      {/* おこされた つちの かたまり */}
      {[0.12, 0.34, 0.58, 0.8].map((f, i) => (
        <ellipse key={f} cx={left + 4 + f * (width - 8)} cy={92.6 + (i % 2) * 1.4} rx={2.8 - (i % 2) * 0.5} ry={1.5} fill={SOIL_LIGHT} />
      ))}
    </>
  )
}

/** すき: えを tip から にぎりの さきまで、はさきは 鉄。tip を じく に かたむく */
function Plow({ tip, end, tilt }: { readonly tip: Point; readonly end: Point; readonly tilt: number }) {
  // えの かたむきと もちあげは plowAt で もう 入っている(はさき だけ かたむきを たす)
  return (
    <>
      <path d={`M${tip[0]} ${tip[1]} L${end[0]} ${end[1]}`} stroke={WOOD_DARK} strokeWidth="5.2" strokeLinecap="round" />
      <path d={`M${tip[0]} ${tip[1]} L${end[0]} ${end[1]}`} stroke={WOOD} strokeWidth="3.6" strokeLinecap="round" />
      {/* 鉄の はさき: えの さきに はめて、つちの中に さす */}
      <Layer x={tip[0]} y={tip[1]} rotate={tilt}>
        <path d="M-3 -2 L4 -4 L5 5 L-6 4 Z" fill={IRON} />
        <path d="M-3 -2 L4 -4 L4.4 -1 L-3.6 0.8 Z" fill={IRON_DARK} />
      </Layer>
    </>
  )
}

/** うごかない間の あせ は 部品の Sweat。ほりおこされた つちが、はさき から とびだして うしろへ おちる。 */
function Clods({ t }: SceneProps) {
  const times = [3.3, 3.6, 3.9, 4.2, 4.5, 4.75]
  return (
    <>
      {times.map((spawn, i) => {
        const p = (t - spawn) / 0.8
        if (p <= 0 || p >= 1) return null
        const bladeX = kidWalk(spawn).x - TIP_AHEAD
        const x = bladeX + 4 + p * (12 + (i % 3) * 3)
        const y = 91 - Math.sin(p * Math.PI) * (12 + (i % 2) * 5) + p * 1.2
        return <ellipse key={spawn} cx={x} cy={y} rx={1.9 + (i % 2) * 0.6} ry={1.5} fill={SOIL_DARK} opacity={1 - p ** 3} />
      })}
    </>
  )
}

/** すきを さした しゅんかん の ほこり。 */
function Dust({ t }: SceneProps) {
  const p = span(t, DROP, DROP + 0.7)
  if (p <= 0 || p >= 1) return null
  const x = STUCK_X - TIP_AHEAD + 4
  return (
    <g opacity={1 - p}>
      <ellipse cx={x - 8 * p} cy={90 - 3 * p} rx={2 + 3 * p} ry={1.5 + 2 * p} fill="#f3dfc2" />
      <ellipse cx={x + 12 * p} cy={90.4 - 2 * p} rx={1.6 + 2.6 * p} ry={1.2 + 1.6 * p} fill="#f3dfc2" />
    </g>
  )
}

/** おす ほうへ、左むきの やじるし が すすむ。 */
function Heading({ t }: SceneProps) {
  const show = during(t, PUSH, FREE + 0.8, 0.3)
  if (show <= 0) return null
  const slide = ((t * 6) % 4) * 0.6
  return (
    <g opacity={show * 0.9} fill="none" stroke="#ef7b3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${12 - slide} 54 l-3.4 3.6 l3.4 3.6`} transform={`translate(${i * 4.6} 0)`} opacity={0.45 + i * 0.25} />
      ))}
    </g>
  )
}

/** おこされた つちに 小鳥が とんできて、つちの中の むしを つつく。 */
function Sparrow({ t }: SceneProps) {
  const from = FREE + 0.2
  const arrive = span(t, from, from + 0.9, easeOut)
  if (arrive <= 0) return null
  const x = 8 + arrive * 25
  const y = 36 + arrive * 52 - Math.sin(arrive * Math.PI) * 14
  const landed = arrive >= 1
  const peck = landed ? Math.max(0, wave(t, 0.7)) * 1.2 : 0
  return (
    <>
      {landed && <path d="M36.4 90.6 q1.6 -1.6 3 0 q1.6 1.6 3 0" fill="none" stroke="#f08a99" strokeWidth="1.1" strokeLinecap="round" />}
      <Bird x={x} y={y + peck} t={t} flying={!landed} facing="left" color="#ff9a5c" dark="#e2733f" />
    </>
  )
}

/** 赤い はちまき(右むき の 形)。しっぽ が うしろ(左がわ) で ゆれる */
function headband(t: number) {
  return (
    <>
      <path d="M-1.02 -0.42 Q0 -0.95 1.02 -0.42" fill="none" stroke={BAND} strokeWidth="0.3" strokeLinecap="round" />
      <path d={`M-0.95 -0.55 Q${-1.5} ${-0.5 + wave(t, 0.5) * 0.1} ${-2.1} ${-0.3 + wave(t, 0.5, 0.2) * 0.2}`} fill="none" stroke={BAND} strokeWidth="0.3" strokeLinecap="round" />
    </>
  )
}

/** 子の 場所と かっこう(手は すきの とって の うえ に { to }) */
function kidAt(t: number, m: Motion): PersonProps {
  const plan = kidWalk(t)
  // ちからを こめる とき、子が ぶるぶる ふるえる
  const tremble = t >= STUCK && t < PUSH ? Math.sin(t * 45) * 0.45 : 0
  const x = plan.x + tremble
  const plow = plowAt(x, m)
  const mood = m.mood === 'calm' ? 'normal' : m.mood === 'troubled' ? 'worried' : m.mood === 'push' ? 'strain' : 'joy'
  const base: PersonProps = {
    ...plan,
    x,
    y: FLOOR,
    look: LOOKS.boy,
    face: mood,
    opacity: span(t, ENTER - 0.2, ENTER + 0.2),
    pose: { ...plan.pose, torso: m.lean, head: m.mood === 'push' ? 4 : m.mood === 'happy' ? -3 : 0 },
  }
  const near: PersonProps = { ...base, pose: { ...base.pose, rightArm: { to: plow.grip } } }
  const hand = personRig(near).world.arms.right.end
  // むこうの 手は、てまえの 手 より 少し えの さき がわ(下)
  const toTip = Math.hypot(hand[0] - plow.tip[0], hand[1] - plow.tip[1]) || 1
  const farTarget: Point = [hand[0] + ((plow.tip[0] - hand[0]) / toTip) * FAR_HAND_DOWN, hand[1] + ((plow.tip[1] - hand[1]) / toTip) * FAR_HAND_DOWN]
  return { ...near, pose: { ...near.pose, rightArm: { to: hand }, leftArm: { to: farTarget } } }
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)
  const m = motionAt(t)
  const kid = kidAt(t, m)
  const rig = personRig(kid)
  const nearHand = rig.world.arms.right.end
  const farHand = rig.world.arms.left.end
  const plow = plowAt(kid.x, m)
  const head = rig.world.head
  const headR = rig.body.headR * rig.scale
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const bladeX = plow.tip[0]

  const held = (
    <>
      <Plow tip={plow.tip} end={plow.end} tilt={m.tilt} />
      {/* 手の あたる ところ に 赤い ぬの を まく */}
      <ellipse cx={farHand[0]} cy={farHand[1]} rx="3.2" ry="2.8" fill={BAND} />
      <ellipse cx={nearHand[0]} cy={nearHand[1]} rx="3.2" ry="2.8" fill={BAND} />
    </>
  )

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[93, 14]} tufts={[6, 44, 80, 104]} />
        <Field />
        {t >= PUSH && <Furrow bladeX={bladeX} startX={STUCK_X - TIP_AHEAD} />}
        <Person {...kid} headwear={headband(t)} held={held} />
        <Sweat t={t} x={head[0] + headR} y={head[1] - headR * 0.4} show={during(t, DROP + 0.2, PUSH + 0.2, 0.2)} />
        {/* はさきの まわり の つち(まえに もりあがる)。はさきが つちの中に あるように 見せる */}
        <Layer x={bladeX - 12} opacity={span(t, ENTER - 0.2, ENTER + 0.2)}>
          <path d="M2 99 Q2 93.6 8 92.4 Q13 88.8 19 91.2 Q26 90.6 29 94.6 Q30 97 29 99 Z" fill={SOIL_DARK} />
          <ellipse cx="11" cy="90.6" rx="3" ry="1.3" fill={SOIL_LIGHT} />
          <ellipse cx="22" cy="92" rx="2.4" ry="1.1" fill={SOIL_LIGHT} />
        </Layer>
        <Dust t={t} />
        <Clods t={t} />
        <Heading t={t} />
        <Sparrow t={t} />
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
    { at: 0, label: 'かわいた はたけが ひろがる', sound: 'pop' },
    { at: ENTER, label: 'すきを もった子が やってくる' },
    { at: DROP, label: 'はさき を つちに さす', sound: 'pop' },
    { at: STUCK, label: 'つちが かたくて うごかない' },
    { at: PUSH, label: 'ふんばって、ぐーっと おす' },
    { at: FREE, label: 'うごいた! つちが おこされて にっこり', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '方 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
