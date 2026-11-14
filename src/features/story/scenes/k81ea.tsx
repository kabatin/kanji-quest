/*
 * 自(みずから・じぶん): 「だれが?」と きかれて、自分の はなを ゆびさす。
 *
 * ほね(画と絵の対応)
 *   字は「はな」の形。人は じぶんを さすとき、はな を ゆびさす。
 *   絵は 字と ぴったり重ねず、かお・むね・うで の あたりに だいたい そろえる。
 *   (人の体を ゆがめると 字より そちらに 目が いくので、重なりより 形の正しさを とる)
 *   1画目(ノ)   … あたまの上の「?」「!」の あたり
 *   2〜6画目    … 子の かお・どう の たて と、ふくらんだ 3本の よこ(まゆ・目・くち・おなか の あたり)
 *
 * ながれ
 *   子が 草はらに ひとり → ともだちが あるいてきて「だれが やるの?」と きく
 *   → 子は「えっ、だれ?」と まわりを きょろきょろ(まよう)
 *   → ぴん!と ひらめく。「ぼくだ!」と、手を あげて じぶんの はなを ゆびさす(うれしい)
 *   → ともだちも にっこり。はな が きらりと ひかり、ほね が ひかって、絵が うすくなり 字「自」になる
 *
 * 人は Person。子は 正面で、ゆびさす うでは { to, depth } で はな へ まえから のばす。ともだちは walk(左むき)。
 * はなは あたまに つける もの(headwear)として 描く。背景は Backdrop。ふきだし・「!」・はなの わっか は ここで 描く。
 */
import { backOut, during, easeInOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, HANG_ARM, LOOKS, mixLimb, Person, personRig, walk, type Expression } from '../sceneFigures'

const CHAR = '自'

const SKIN_SHADE = '#eeb98a'
const HAIR_FRIEND = '#3b2a20'
const TUNIC_FRIEND = '#f08a4b'
const PANTS_FRIEND = '#6a8f4e'
const BUBBLE = '#ffffff'
const BUBBLE_EDGE = '#c9d6e6'

/** くぎり の時間(秒) */
const ARRIVE = 1.0
/** ともだちが「だれが やるの?」と きく */
const ASK = 2.3
/** ぴん!と ひらめく */
const AHA = 4.2
/** 手を あげて、はなを ゆびさす */
const POINT = 4.4
const INK = 6.4
const DONE = 9.6
const DURATION = 10.3

type Point = readonly [number, number]

/** 子(正面)の 立つ場所。ともだち は 右がわ から あるいてきて、子の ほうを むく */
const KID_X = 50
const KID_FEET = 96
const KID = { x: KID_X, y: KID_FEET, build: 'teen', height: 62, facing: 'front' } as const
const KID_RIG = personRig(KID)
const HEAD_R = KID_RIG.body.headR * KID_RIG.scale
/** はな: 顔の まんなか すこし 下。ゆびさす 先 */
const NOSE: Point = [KID_RIG.world.head[0], KID_RIG.world.head[1] + 0.28 * HEAD_R]
/** 手 を はなへ のばす とき、体 から まえ へ の きょり */
const NOSE_DEPTH = 7
const FRIEND_X = 92
const FRIEND = { build: 'child', height: 44 } as const
const FRIEND_LOOK = { ...LOOKS.boy, hair: HAIR_FRIEND, top: TUNIC_FRIEND, bottom: PANTS_FRIEND } as const

const KID_FACES = { puzzled: 'worried', aha: 'surprised', happy: 'joy' } as const satisfies Record<string, Expression>
type KidMood = keyof typeof KID_FACES

/** はな(headwear)。あたまの まんなか が 0,0、半径 1。顔の まんなか の 少し 下 */
function Nose() {
  return (
    <>
      <ellipse cx="0" cy="0.28" rx="0.16" ry="0.135" fill={SKIN_SHADE} />
      <circle cx="-0.05" cy="0.23" r="0.05" fill="#ffffff" opacity="0.7" />
    </>
  )
}

/** 「?」の しるし(線だけ) */
function QuestionMark({ color }: { readonly color: string }) {
  return (
    <>
      <path d="M-2.8 -2.4 Q-2.8 -5.4 0 -5.4 Q2.8 -5.4 2.8 -2.8 Q2.8 -1 0 0.2 V1.6" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="0" cy="4.2" r="1" fill={color} />
    </>
  )
}

/** 「!」の しるし */
function ExclaimMark({ color }: { readonly color: string }) {
  return (
    <>
      <path d="M0 -5.2 V0.8" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="0" cy="4" r="1.05" fill={color} />
    </>
  )
}

/** ともだちの「だれが やるの?」ふきだし。ともだちの あたまの上。 */
function AskBubble({ t, x }: { readonly t: number; readonly x: number }) {
  const show = during(t, ASK, AHA + 0.2, 0.25)
  if (show <= 0) return null
  const pop = backOut(span(t, ASK, ASK + 0.35))
  return (
    <Layer opacity={show} scale={pop} origin={[x, 52]}>
      <path d={`M${x - 2.6} 46.6 L${x} 53 L${x + 3.4} 46.6 Z`} fill={BUBBLE} stroke={BUBBLE_EDGE} strokeWidth="0.7" strokeLinejoin="round" />
      <ellipse cx={x} cy="40" rx="9" ry="7.4" fill={BUBBLE} stroke={BUBBLE_EDGE} strokeWidth="0.7" />
      <path d={`M${x - 3.2} 45.9 L${x} 52 L${x + 3.8} 45.9 Z`} fill={BUBBLE} />
      <g transform={`translate(${x} 40)`}>
        <QuestionMark color="#5f7fd6" />
      </g>
    </Layer>
  )
}

/** 子の あたまの上: まよう「?」→ ひらめく「!」 */
function ThinkBubble({ t }: { readonly t: number }) {
  const thinking = during(t, ASK + 0.5, AHA + 0.05, 0.25)
  const aha = during(t, AHA, POINT + 1.3, 0.2)
  const sway = wave(t, 0.9) * 1.2
  return (
    <>
      {thinking > 0 && (
        <Layer opacity={thinking} scale={backOut(span(t, ASK + 0.5, ASK + 0.85))} origin={[KID_X, 24]} rotate={sway}>
          <circle cx="47" cy="33.4" r="1.2" fill={BUBBLE} stroke={BUBBLE_EDGE} strokeWidth="0.5" />
          <circle cx="47.4" cy="29.8" r="1.8" fill={BUBBLE} stroke={BUBBLE_EDGE} strokeWidth="0.5" />
          <ellipse cx={KID_X} cy="22" rx="8" ry="6.6" fill={BUBBLE} stroke={BUBBLE_EDGE} strokeWidth="0.7" />
          <g transform={`translate(${KID_X} 22)`}>
            <QuestionMark color="#5f7fd6" />
          </g>
        </Layer>
      )}
      {aha > 0 && (
        <Layer opacity={aha} scale={backOut(span(t, AHA, AHA + 0.3))} origin={[KID_X, 24]}>
          <ellipse cx={KID_X} cy="22" rx="8" ry="6.6" fill="#fff3b8" stroke="#f2c94c" strokeWidth="0.8" />
          <g transform={`translate(${KID_X} 22)`}>
            <ExclaimMark color="#e8842a" />
          </g>
          {/* ひらめきの ぴかぴか */}
          {[-1, 1].map((dir) => (
            <path key={dir} d={`M${KID_X + dir * 11} 17 l${dir * 2.6} -2.2 M${KID_X + dir * 12} 22 l${dir * 3.2} 0`} stroke="#f2c94c" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          ))}
        </Layer>
      )}
    </>
  )
}

/** はなが きらりと ひかる わっか(ゆびさした はなを 目立たせる) */
function NoseRing({ t }: { readonly t: number }) {
  const show = during(t, POINT + 0.8, INK + 0.2, 0.25)
  if (show <= 0) return null
  const pulse = (wave(t, 0.7) + 1) / 2
  return (
    <g opacity={show * (0.55 + pulse * 0.35)}>
      <circle cx={NOSE[0]} cy={NOSE[1]} r={5 + pulse * 1.6} fill="none" stroke="#ffd24a" strokeWidth="1.1" />
      <path d={`M${NOSE[0] - 7.6} ${NOSE[1] - 5.8} l-2 -2 M${NOSE[0] + 7.6} ${NOSE[1] - 5.8} l2 -2`} stroke="#ffd24a" strokeWidth="1.1" strokeLinecap="round" />
    </g>
  )
}


function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  // 子: ぽん と出て、きょろきょろ まよい、ひらめいて、はなを ゆびさす
  const kidPop = backOut(span(t, 0, 0.5))
  const puzzled = during(t, ASK + 0.5, AHA, 0.2)
  const look = t > ASK + 0.5 && t < AHA ? Math.sin((t - ASK - 0.5) * 3.2) : 0
  const mood: KidMood = t < AHA ? 'puzzled' : t < POINT + 0.6 ? 'aha' : 'happy'
  const raise = span(t, POINT, POINT + 0.8, easeInOut)
  const headTilt = t < AHA ? puzzled * 7 * Math.sin((t - ASK) * 2.2) : mix(t, AHA, POINT + 0.6, -3, 0)
  // ひらめいた しゅんかん ぴょんと はねる / うれしくて 少し ゆれる
  const hop = Math.sin(span(t, AHA, AHA + 0.45) * Math.PI) * 3.2
  const joy = t > POINT + 0.8 ? Math.abs(wave(t, 0.8)) * 0.8 : 0

  // ともだち: 右から あるいてきて、まって、うれしがる
  const friend = walk(t, { from: FRIEND_X + 36, to: FRIEND_X, start: 0.2, end: ARRIVE, ...FRIEND })
  const asking = t >= ASK && t < AHA + 0.4
  const friendHappy = t >= POINT + 0.4
  const reach = { swing: 75, bend: 15 }
  const cheerArm = { swing: 105, bend: 25 }
  const friendPose = friendHappy
    ? { ...friend.pose, rightArm: cheerArm, leftArm: cheerArm }
    : asking
      ? { ...friend.pose, rightArm: reach }
      : friend.pose
  const friendFace: Expression = friendHappy ? 'joy' : asking ? 'surprised' : 'normal'
  const friendBob = friendHappy ? Math.abs(wave(t, 0.7)) * 1.6 : 0

  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const friendNow = friend.x - FRIEND_X

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[13, 13]} clouds={[[22, 14, 1], [86, 12, 0.85]]} tufts={[8, 30, 72, 100]} />
        <Layer scale={kidPop} origin={[KID_X, KID_FEET]}>
          <Person
            {...KID}
            lift={hop + joy}
            look={LOOKS.boy}
            face={KID_FACES[mood]}
            gaze={look}
            pose={{ leftArm: mixLimb(HANG_ARM, { to: NOSE, depth: NOSE_DEPTH }, raise), head: headTilt }}
            headwear={<Nose />}
          />
        </Layer>
        <Person {...friend} y={KID_FEET} lift={friendBob} look={FRIEND_LOOK} face={friendFace} pose={friendPose} />
        <AskBubble t={t} x={FRIEND_X + friendNow} />
        <ThinkBubble t={t} />
        <NoseRing t={t} />
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
    { at: 0, label: '草はらに 子が ひとり', sound: 'pop' },
    { at: ARRIVE, label: 'ともだちが あるいてくる' },
    { at: ASK, label: '「だれが やるの?」ときかれて、子は まよう', sound: 'pop' },
    { at: AHA, label: 'ぴん!と ひらめく', sound: 'pop' },
    { at: POINT, label: '「ぼくだ!」と じぶんの はなを ゆびさす' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '自 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
