/*
 * 友(とも): てと てを つないで、なかよし。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … ふたりが まえに のばして つないだ うで(かた の たかさで 左右に ひとすじ)
 *   2〜4画目   … ふたりの 体と あし(からだ を よせあって たつ すがた。ぴったりは 重ならない)
 *
 * ながれ
 *   ひとりぼっちの 子が、ボールの よこで しょんぼり(ためいき)
 *   → ともだちが あるいてきて、手を さしだす
 *   → 子が 気づいて びっくり、うれしくなって 手を のばす
 *   → てと てを つないで、ふたりで にこにこ ぴょんぴょん(ハートが のぼる)
 *   → ほね が ひかって、絵が うすくなり、字「友」が のこる
 *
 * 人は Person。あるきは walk、手を のばすのは { to }(2人の かたの まんなかで 手が あう)。
 * ためいき・ハートは Sigh・Hearts、背景は Backdrop。ボールは ここで 描く。
 */
import { during, easeInOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Hearts, HANG_ARM, LOOKS, mixLimb, Person, personRig, Sigh, walk, type Expression, type Limb } from '../sceneFigures'

const CHAR = '友'

const BALL = '#ee6a5a'
const BALL_LIGHT = '#f59a8e'

/** くぎり の時間(秒) */
const COME = 1.3
const STOP = 2.7
const NOTICE = 2.0
const OFFER = 2.9
const REACH = 3.6
const CLASP = 4.3
const INK = 6.7
const DONE = 9.7
const DURATION = 10.3

const FEET_Y = 95
const HEIGHT = 74
/** 手を つなぐ 高さ(1画目の すぐ下)と まんなか */
const MEET_X = 54.5
const KID_A = { build: 'child', height: HEIGHT, facing: 'right', y: FEET_Y } as const
const RIG = personRig({ ...KID_A, x: 0 })
const ARM_LEN = (RIG.body.upperArm + RIG.body.foreArm) * RIG.scale
/** 2人の 立つ場所(x)。のばした うで が まんなかで あう(ほんの 少し ひじ が まがる) */
const A_X = MEET_X - ARM_LEN * 0.93
const B_X = MEET_X + ARM_LEN * 0.93
const MEET_Y = RIG.world.arms.left.root[1] + 3
const BALL_X = A_X + 14

const LOOK_A = { ...LOOKS.boy } as const
const LOOK_B = { ...LOOKS.girl, top: '#f0a14a', bottom: '#5b7a58' } as const

/** 子の あしもとの ボール。ひとりだと ころがせない。うれしいと ぽんと はねる。 */
function Ball({ t }: SceneProps) {
  const hopAt = CLASP + 0.1
  const hop = Math.abs(Math.sin(span(t, hopAt, hopAt + 0.7) * Math.PI)) * 7
  return (
    <>
      <ellipse cx={BALL_X} cy="97.6" rx={3.6 - hop * 0.2} ry="0.9" fill="#000000" opacity="0.12" />
      <g transform={`translate(0 ${-hop})`}>
        <circle cx={BALL_X} cy="94.2" r="3.5" fill={BALL} />
        <path d={`M${BALL_X - 2.6} 92.6 Q${BALL_X} 90.6 ${BALL_X + 2.4} 92.6`} fill="none" stroke={BALL_LIGHT} strokeWidth="1" strokeLinecap="round" />
      </g>
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  // ふたり いっしょに ぴょんぴょん(手は つないだまま)
  const jump = span(t, CLASP + 0.3, CLASP + 0.6) * (1 - span(t, INK - 0.9, INK - 0.4))
  const hop = Math.abs(Math.sin((t - CLASP) * Math.PI * 1.5)) * 3.2 * jump
  const meet: readonly [number, number] = [MEET_X, MEET_Y - hop]

  // A: しょんぼり → きづく → よろこぶ
  const aFace: Expression = t < NOTICE ? 'sad' : t < OFFER + 0.5 ? 'surprised' : 'joy'
  const reachA = span(t, REACH, REACH + 0.6, easeInOut)
  const aHand: Limb = { to: [meet[0] - 0.8, meet[1]] }
  const aTilt = t < NOTICE ? 9 : mix(t, NOTICE, NOTICE + 0.5, 9, -3) + (t >= CLASP ? wave(t, 0.9) * 2 * jump : 0)

  // B: あるく → 手を さしだす
  const walkB = walk(t, { from: 150, to: B_X, start: COME, end: STOP, build: 'child', height: HEIGHT, armSwing: 20 })
  const offerB = span(t, OFFER, OFFER + 0.6, easeInOut)
  const bHand: Limb = { to: [meet[0] + 0.8, meet[1]] }
  const bArm: Limb = t < STOP ? walkB.pose.rightArm ?? HANG_ARM : mixLimb(HANG_ARM, bHand, offerB)

  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const headA = personRig({ ...KID_A, x: A_X }).world.head

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} clouds={[[60, 14, 0.9], [92, 8, 0.8]]} tufts={[8, 50, 66, 100]} />
        <Ball t={t} />
        <Person {...KID_A} x={A_X} look={LOOK_A} face={aFace} lift={hop} gaze={0} pose={{ head: aTilt, leftArm: mixLimb(HANG_ARM, aHand, reachA) }} />
        <Layer opacity={span(t, COME - 0.05, COME + 0.05)}>
          <Person {...walkB} y={FEET_Y} look={LOOK_B} face="joy" lift={hop} hairSway={wave(t, 0.4) * (walkB.moving ? 6 : 0) + wave(t, 0.9, 0.3) * 3 * jump} pose={{ ...walkB.pose, rightArm: bArm, head: t < STOP ? -2 : -2 + wave(t, 0.9, 0.3) * 2 * jump }} />
        </Layer>
        <Sigh x={headA[0] + 7} y={headA[1] + 5} p={span(t, 0.7, 1.9)} show={during(t, 0.7, 1.9, 0.25)} dir={1} />
        <Hearts t={t} x={MEET_X} y={meet[1] - 14} show={during(t, CLASP + 0.1, INK - 0.2, 0.25)} />
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
    { at: 0, label: 'ひとりぼっちで しょんぼり', sound: 'pop' },
    { at: COME, label: 'ともだちが あるいてくる' },
    { at: OFFER, label: '手を さしだす' },
    { at: REACH, label: 'うれしくて 手を のばす', sound: 'pop' },
    { at: CLASP, label: '手と 手を つないで なかよし' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '友 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
