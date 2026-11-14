/*
 * 中(なか): ぼうが 四角の まんなかを とおる。(共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … 板(しかくい かんばん)の 左はし
 *   2画目(コ)  … 板の うえ と 右はし
 *   3画目(一)  … 板の した(板が ぼうの でっぱり に のる ところ)
 *   4画目(丨)  … 地面に 立った ぼう。板の まんなかを 上から 下まで つらぬく
 *
 * ながれ
 *   ぼうが 地面に 立つ → 子どもが おもい 板を はこんでくる(あせ、つかれた顔)
 *   → ぼうの そばで ひとやすみ → 「うんしょ」と 板を もちあげる
 *   → 板が ぼうの でっぱり に ストンと のる。ぼうが 板の まんなかを とおった!
 *   → 子どもは ばんざいで はねて、ハートが ふわり
 *   → ほね が ひかって、絵が うすくなり、字「中」が のこる
 *
 * 子どもは Person(うで は かた から出て ひじ で まがる)。板は 子どもの held に わたして、
 * てまえの 手は 板の まえ、むこうの 手は 板の おく に なる。手は 板の 持つところ(左はし)を 点で 指す。
 * 板は 手で 持つところを じく に、はこぶ間は 右が 少し さがる。
 * のせたあとは ゆらゆら ゆれて、少し 右あがりで とまる(1・2・3画目と 同じ むき)。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, span, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Butterfly, Hearts, mixLimb, PALETTE, Person, posture, Sweat, walk, type Point } from '../sceneFigures'

const CHAR = '中'

const BARK = PALETTE.bark
const BARK_DARK = '#70452b'
const WOOD = '#f0d3a0'
const WOOD_EDGE = '#b98650'
const HEART = '#e8534a'

/** くぎり の時間(秒) */
const WALK = 0.9
const ARRIVE = 3.4
const LIFT = 4.0
const PEAK = 4.9
const PLACE = 5.25
const HOP = 5.7
const INK = 6.9
const DONE = 9.4
const DURATION = 10

const GROUND = 96
/** 子どもの こし の x(立ち止まる ところ)と 背の高さ */
const STAND_X = 11
const HEIGHT = 48

/** 板の 持つところ(左はし の まんなか)。字の 1画目の 場所 */
const GRIP: Point = [21.5, 49.5]
/** 板の よこはば の はんぶん(持つところ から 板の まんなかまで) */
const HALF_WIDTH = 33
/** のせおわった ときの 板の かたむき(右あがり) と、そのときの 持つところの 高さ */
const REST_TILT = -4
const REST_GRIP_Y = GRIP[1] + HALF_WIDTH * Math.sin((-REST_TILT * Math.PI) / 180)
/** 板を もちあげた いちばん高い ところ(のる でっぱり より 少し上)と、はこぶ間の 高さ */
const PEAK_GRIP_Y = 45.5
const CARRY_GRIP_Y = 64
const CARRY_TILT = 5

/* ───────── ぼう と 板 ───────── */

/** ぼうの でっぱり(板を のせる ところ)と、足もとの つち。板の うしろに かくれる */
function PegAndMound({ grow }: { readonly grow: number }) {
  return (
    <>
      <ellipse cx="54.6" cy="98.3" rx={7 * grow} ry="2.2" fill="#9a7050" />
      <rect x="47.5" y="64" width="14.2" height="3.2" rx="1.3" fill={BARK_DARK} opacity={grow} />
    </>
  )
}

/** 地面に 立った ぼう(4画目)。板の まえを とおる */
function Pole({ grow }: { readonly grow: number }) {
  return (
    <Layer scaleX={0.6 + 0.4 * grow} scaleY={grow} origin={[54.5, 98]}>
      <Bone char={CHAR} n={4} color={BARK} width={4.8} from={0.07} />
      <circle cx="54.8" cy="16.4" r="3.2" fill={BARK_DARK} />
    </Layer>
  )
}

/** しかくい 板。字の 1・2・3画目の 場所に ぴったり 合う大きさで 描く */
function Board() {
  const heart = (x: number) => <path d="M0 2.6 C-4.4 -0.4 -2.8 -4.4 0 -2.2 C2.8 -4.4 4.4 -0.4 0 2.6 Z" fill={HEART} transform={`translate(${x} 49.5) scale(1.5)`} />
  return (
    <>
      <rect x="21.5" y="34.5" width="66" height="29.5" rx="3.6" fill={WOOD_EDGE} />
      <rect x="23.6" y="36.6" width="61.8" height="25.3" rx="2.4" fill={WOOD} />
      {heart(38)}
      {heart(71)}
    </>
  )
}

/** 板の いま の かっこう。持つところ の高さ(gy)と かたむき(tilt) */
type BoardPose = { readonly gy: number; readonly tilt: number }

function boardPose(t: number): BoardPose {
  const lift = span(t, LIFT, PEAK, easeInOut)
  const drop = span(t, PEAK + 0.05, PLACE, easeIn)
  const since = Math.max(t - PLACE, 0)
  // のせた あとは ゆらゆら ゆれて しずまる
  const wobble = since > 0 ? 2.6 * Math.exp(-since * 4) * Math.sin(since * 14) : 0
  const gy = CARRY_GRIP_Y + (PEAK_GRIP_Y - CARRY_GRIP_Y) * lift + (REST_GRIP_Y - PEAK_GRIP_Y) * drop
  const tilt = CARRY_TILT * (1 - lift) + REST_TILT * drop + wobble
  return { gy, tilt }
}

/** ストンと のった しゅんかんの ほこり */
function Dust({ t }: { readonly t: number }) {
  const p = span(t, PLACE, PLACE + 0.6, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g fill="#f6efe0" opacity={(1 - p) * 0.9}>
      {[-1, 1].map((side) => (
        <ellipse key={side} cx={54.6 + side * (7 + p * 9)} cy={68 - p * 3} rx={2 + p * 3} ry={1.6 + p * 2} />
      ))}
    </g>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)
  const grow = span(t, 0.1, 0.7, backOut)

  // あるく: 左から 板を はこんでくる。ついたら 足を とめる
  const w = walk(t, { from: STAND_X - 90, to: STAND_X, start: WALK, end: ARRIVE, build: 'child', height: HEIGHT, armSwing: 10 })
  const dx = w.x - STAND_X

  // 板と 手: 手は 板の 持つところ(左はし)に ついていく。のせたら はなして ばんざい
  const board = boardPose(t)
  const rad = (board.tilt * Math.PI) / 180
  const onBoard = (ox: number, oy: number): Point => [GRIP[0] + 0.08 + dx + ox * Math.cos(rad) - oy * Math.sin(rad), board.gy + ox * Math.sin(rad) + oy * Math.cos(rad)]
  const release = span(t, PLACE + 0.1, PLACE + 0.5, easeOut)
  const banzai = posture('banzai', 'right')
  const nearArm = mixLimb({ to: onBoard(0.8, 10.5) }, banzai.leftArm ?? { swing: 165, bend: 10 }, release)
  const farArm = mixLimb({ to: onBoard(1.2, 5.5) }, banzai.rightArm ?? { swing: 160, bend: 14 }, release)

  // うれしくて 2かい はねる
  const q = span(t, HOP, HOP + 0.8)
  const hop = q > 0 && q < 1 ? Math.abs(Math.sin(q * Math.PI * 2)) * 5.2 : 0

  const face = t < LIFT ? 'worried' : t < PLACE + 0.1 ? 'strain' : 'joy'
  const asleepHead = face === 'worried' ? 6 : face === 'strain' ? 0 : -6
  // 持っている 間は うで だけ 板へ。足は あるきの ポーズ
  const pose = { ...w.pose, leftArm: nearArm, rightArm: farArm, torso: face === 'strain' ? -3 : w.pose.torso, head: asleepHead }
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  const boardNode = (
    <Layer x={dx + 0.08} y={board.gy - GRIP[1]} rotate={board.tilt} origin={GRIP}>
      <Board />
    </Layer>
  )

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} tufts={[40, 76, 100]} />
        <PegAndMound grow={grow} />
        <Person {...w} y={GROUND} pose={pose} lift={hop} face={face} held={boardNode} look={{ top: '#ee8a4a', bottom: '#4b6a9b' }} />
        <Pole grow={grow} />
        <Butterfly x={95} y={78} t={t} />
        <Sweat t={t} x={STAND_X + dx + 2} y={GROUND - HEIGHT * 0.92} show={during(t, WALK + 0.3, ARRIVE, 0.2)} />
        <Dust t={t} />
        <Hearts t={t} x={STAND_X + 2} y={GROUND - HEIGHT - 4} show={during(t, PLACE + 0.5, INK - 0.1, 0.3)} />
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
    { at: 0, label: 'ぼうが 地面に たつ', sound: 'pop' },
    { at: WALK, label: '子どもが おもい 板を はこんでくる' },
    { at: ARRIVE, label: 'ぼうの そばで ひとやすみ' },
    { at: LIFT, label: 'うんしょ と 板を もちあげる' },
    { at: PLACE, label: '板が ぼうの でっぱり に のる。ぼうが 板の まんなかを とおる', sound: 'pop' },
    { at: HOP, label: 'ばんざいで はねる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '中 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
