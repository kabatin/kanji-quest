/*
 * 元(もと): あたまは からだの いちばん うえ。はじまり。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … あたまに かぶった ぼうしの つば(あたまの いちばん うえ)
 *   2画目(一)  … 「ばんざい」で よこに ひろげた りょううで(かた の たかさ)
 *   3画目(ノ)  … ひだりの あし(ジャンプで ひらいた あし)
 *   4画目(乚)  … みぎの あし(おなじく ひらいた あし)
 *   (あし は こし から ひらくので、画と だいたい おなじ場所・向き になる。ぴったりでは なくて よい)
 *
 * ながれ
 *   子どもが ぼうしを かぶって たっている(あたまの いちばん上に ぼうし)
 *   → つよい かぜで ぼうしが とんでいく。子どもは おどろいて、あたまを見あげ、てを のばして ジャンプ
 *   → ぼうしは ひらひら おちてきて、あたまの いちばん上に ぽん と のる(「ここが いちばん上」)
 *   → 子どもは うれしくて、りょうてと りょうあしを ひろげて ばんざいジャンプ
 *   → ほね が ひかって、絵が うすくなり、字「元」が のこる
 *
 * 人は 共通部品 Person(正面)。字の形に合わせるために、体を ゆがめない:
 *   うで は かた から、あし は こし から。ジャンプ すると、あし を ひらくぶん、こし が 上がる(部品が 計算する)。
 *   ぼうしは 人の あたま から はなれて とぶので、場面で 描く(人の あたまの 位置を 部品から もらう)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, LOOKS, Person, personRig, Wind, type Expression, type Limb, type PersonPose } from '../sceneFigures'

const CHAR = '元'

const STRAW = '#f2c35a'
const STRAW_DARK = '#d9a53a'
const BAND = '#e8534a'
const KID_LOOK = { ...LOOKS.boy, top: '#ef7d57', bottom: '#4a5f8c' } as const

/** くぎり の時間(秒) */
const POP = 0.2
/** かぜが ふいて、ぼうしが とぶ */
const GUST = 1.5
const FLY_END = 2.5
const FLOAT_END = 3.6
/** ぼうしが あたまに のる */
const LAND = 4.6
/** ばんざいジャンプ */
const CHEER = 4.85
const INK = 5.9
const DONE = 8.5
const DURATION = 9

/** 子どもの 足もと・こし の x・立った 背の高さ(正面) */
const GROUND = 94
const KID_X = 51
const KID_HEIGHT = 76
/** ばんざいジャンプの いちばん たかい所の 高さ(あし を 45度 ひらいた とき、こし が 画と おなじ たかさ になる) */
const JUMP_H = 7.6
const SPREAD = 45
/** ぼうしが とぶ とき の たかい所・右・左(つばの まんなか の 場所) */
const APEX_Y = 15
const RIGHT_X = 80
const LEFT_X = 33
/** ぼうしの 大きさ(あたまの 半径 11 を きじゅん に 描いた) */
const HAT_BASE_R = 11

/** わら の ぼうし。つば の まんなか(51, 20)が じく。 */
function Hat() {
  return (
    <>
      <ellipse cx="51" cy="21.2" rx="22" ry="3.4" fill={STRAW_DARK} />
      <ellipse cx="51" cy="20.2" rx="22" ry="3.2" fill={STRAW} />
      <path d="M39 20.6 C39 8.6 63 8.6 63 20.6 Z" fill={STRAW} />
      <path d="M39.2 18.2 Q51 21 62.8 18.2 L63 20.6 Q51 23.2 39 20.6 Z" fill={BAND} />
      <path d="M44 13.6 Q47 11.6 51 11.4" fill="none" stroke="#fbe29a" strokeWidth="1.2" strokeLinecap="round" />
    </>
  )
}

type HatMove = { readonly x: number; readonly y: number; readonly rotate: number }

/** ぼうしの 場所(つばの まんなか)。あたまの 上 → かぜで とぶ → ひらひら おちる。rest は あたまの 上 の 場所 */
function hatMove(t: number, rest: readonly [number, number]): HatMove {
  if (t < GUST) return { x: rest[0], y: rest[1], rotate: 0 }
  if (t < FLY_END) {
    const p = span(t, GUST, FLY_END, easeOut)
    return { x: rest[0] + (RIGHT_X - rest[0]) * p, y: rest[1] + (APEX_Y - rest[1]) * p, rotate: 30 * p }
  }
  if (t < FLOAT_END) {
    const p = span(t, FLY_END, FLOAT_END, easeInOut)
    return { x: RIGHT_X + (LEFT_X - RIGHT_X) * p, y: APEX_Y - 1.5 * Math.sin(p * Math.PI), rotate: 28 * Math.cos(p * Math.PI) + 2 * (1 - p) }
  }
  if (t < LAND) {
    const p = span(t, FLOAT_END, LAND, easeInOut)
    return { x: LEFT_X + (rest[0] - LEFT_X) * p, y: APEX_Y + (rest[1] - APEX_Y) * p, rotate: -26 * (1 - p) + Math.sin(p * Math.PI * 3) * 10 * (1 - p) }
  }
  // のった しゅんかん、ぽん と すこし しずむ
  return { x: rest[0], y: rest[1] + Math.sin(span(t, LAND, LAND + 0.3) * Math.PI) * 1.2, rotate: 0 }
}

/** ばんざいの あと と、ほし の きらきら(うれしさ) */
function Joy({ t }: SceneProps) {
  const show = during(t, CHEER + 0.3, INK + 0.6, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      <Star cx={10} cy={30} r={3.2} color="#ffc233" spin={t * 90} />
      <Star cx={98} cy={28} r={3.6} color="#ff7a4d" spin={-t * 90} />
      <Star cx={90} cy={62} r={2.4} color="#ffd95a" spin={t * 120} />
    </g>
  )
}

function moodAt(t: number): Expression {
  if (t >= LAND) return 'joy'
  return t >= GUST + 0.1 ? 'surprised' : 'normal'
}

/** 正面の うで: upper = かたから そとへ、fore = ひじ から さきの そとへの むき(ま下 = 0、よこ = 90、ま上 = 180) */
const armOf = (upper: number, fore: number): Limb => ({ swing: upper, bend: fore - upper })

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  const pop = span(t, POP, POP + 0.7, backOut)
  const reach = span(t, GUST + 0.2, GUST + 0.8, backOut)
  const spread = span(t, CHEER, INK - 0.1, easeInOut)

  // ジャンプ: ぼうしを つかまえようと 2回 はねる / うれしくて ばんざいジャンプ(いちばん上で 字になる)
  const hop = t >= 2.6 && t < 3.9 ? Math.abs(Math.sin(((t - 2.6) / 1.3) * Math.PI * 2)) * 6 : 0
  const bigJump = JUMP_H * Math.sin(span(t, CHEER, CHEER + 2.0) * Math.PI)
  const legAngle = 7 + (SPREAD - 7) * spread

  // うで: たっている → うえに のばす → ばんざい(よこに ひろげる)
  const flutter = t >= GUST + 0.8 && t < LAND ? wave(t, 0.5) * 7 : 0
  const upLeft = { upper: 10 + (125 - 10) * reach + flutter, fore: 6 + (148 - 6) * reach + flutter }
  const upRight = { upper: 10 + (125 - 10) * reach - flutter, fore: 6 + (148 - 6) * reach - flutter }
  const from = (arm: { readonly upper: number; readonly fore: number }, end: number): Limb =>
    t < CHEER ? armOf(arm.upper, arm.fore) : armOf(mix(t, CHEER, INK - 0.1, arm.upper, end, backOut), mix(t, CHEER, INK - 0.1, arm.fore, end, backOut))

  // ぼうしを 目で おう
  const worried = t >= GUST + 0.1 && t < LAND
  const pose: PersonPose = {
    // 画面の ひだりの うで は 人の みぎ の うで
    rightArm: from(upLeft, 90),
    leftArm: from(upRight, 98),
    rightLeg: { swing: legAngle, bend: 0 },
    leftLeg: { swing: legAngle, bend: 0 },
  }
  const kid = { x: KID_X, y: GROUND, build: 'child', height: KID_HEIGHT, facing: 'front', lift: hop + bigJump, pose } as const
  const rig = personRig(kid)
  const headR = rig.body.headR * rig.scale
  const rest: readonly [number, number] = [rig.world.head[0], rig.world.head[1] - headR * 0.82]
  const hat = hatMove(t, rest)
  const follow = worried ? Math.max(-1, Math.min(1, (hat.x - KID_X) / 30)) : 0
  // ぼうしが のった しゅんかん、からだが すこし ちぢむ
  const squash = 1 - 0.05 * Math.sin(span(t, LAND, LAND + 0.3) * Math.PI)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} tufts={[8, 36, 78, 100]} />
        <Wind t={t - GUST} x={-30} y={24} show={during(t, GUST - 0.15, FLOAT_END - 0.4, 0.3)} reach={150} />
        <Layer scale={Math.max(pop, 0.001)} origin={[KID_X, GROUND]}>
          <Layer scaleY={squash} origin={[KID_X, GROUND]}>
            <Person {...kid} look={KID_LOOK} face={moodAt(t)} gaze={follow} gazeY={worried ? -1 : 0} />
          </Layer>
          <Layer x={hat.x - 51} y={hat.y - 20} rotate={hat.rotate} origin={[51, 20]}>
            <Layer scale={headR / HAT_BASE_R} origin={[51, 20]}>
              <Hat />
            </Layer>
          </Layer>
        </Layer>
        <Joy t={t} />
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
    { at: 0, label: '子どもが ぼうしを かぶって たっている', sound: 'pop' },
    { at: GUST, label: 'かぜで ぼうしが とぶ。子どもは おどろく' },
    { at: 2.6, label: 'ぼうしを つかまえようと ジャンプ' },
    { at: FLOAT_END, label: 'ぼうしが ひらひら おちてくる' },
    { at: LAND, label: 'ぼうしが あたまの いちばん上に ぽん', sound: 'pop' },
    { at: CHEER, label: 'うれしくて ばんざいジャンプ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '元 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
