/*
 * 天(てん): 手を ひろげた 人の、あたまの 上の いちばん上。(共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 子どもの あたまの上に とまった、ながい ほそ長い 雲(いちばん上の 空)
 *   2画目(ノ→) … 子どもが 左右に ひろげた りょううで
 *   3画目(ノ)  … あたま から どう、ひらいた 左の あし
 *   4画目(丶)  … どう から ひらいた 右の あし
 *   (重なるのは ジャンプで 手と あしを ひろげた しゅんかん だけ。だいたい 同じ 場所・同じ 向き)
 *
 * ながれ
 *   子どもが ひとりで ぼんやり 立っている(ちょっと たいくつ)
 *   → 空を 長い雲が すーっと ながれてきて、子どもは 見上げて「?」
 *   → 雲は 子どもの あたまの 真上で とまる。子どもは 指さして「あっ!」
 *   → うれしくなって、しゃがんで ぴょん! 手と あしを ひろげて ジャンプ
 *   → ほね が ひかって、絵が うすくなり、字「天」が のこる
 *
 * 人は Person(正面)。しゃがむのは posture('squat')、ひろげるのは mixPose で 角度から なめらかに。
 * 雲は 本来 ほそ長い ので Bone を そのまま 使う(1画目)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Bird, HANG_ARM, LOOKS, mixLimb, mixPose, Notice, Person, personRig, posture, Question, type PersonPose } from '../sceneFigures'

const CHAR = '天'

const CLOUD = '#ffffff'
const CLOUD_SHADE = '#cfdcec'
const AHA = '#f07f9e'

/** くぎり の時間(秒) */
const POP = 0.3
/** 雲が ながれはじめる・あたまの上で とまる */
const CLOUD_FROM = 1.0
const CLOUD_STOP = 3.0
/** 子どもが 雲に 気づく */
const NOTICE = 1.3
/** 指さし → 「あっ!」 */
const POINT = 2.4
const REALIZE = 3.5
/** しゃがむ → ジャンプ → 手あしを ひろげる */
const CROUCH = 3.6
const JUMP = 4.1
const SPREAD_END = 4.8
const INK = 6.2
const DONE = 8.8
const DURATION = 9.4

/** 子どもの 立つ場所(こし の x と 地面)と 背の高さ */
const KID_X = 52
const KID_Y = 97
const KID_HEIGHT = 62
/** ジャンプ の いちばん上の たかさ */
const APEX = 5

const STAND = posture('stand', 'front')
const SQUAT = posture('squat', 'front')
/** 雲を 指さす うで(まっすぐ 上) と、ひろげた うで・足 */
const ARM_POINT = { swing: 150, bend: 5 }
const ARM_SPREAD = { swing: 92, bend: 4 }
const LEG_SPREAD = { swing: 40, bend: 0 }
const SPREAD_POSE: PersonPose = { leftArm: ARM_SPREAD, rightArm: ARM_SPREAD, leftLeg: LEG_SPREAD, rightLeg: LEG_SPREAD }

/** 1画目の 雲: ながい ほそ長い 雲。ほね の線 そのまま(本来 ほそ長い 雲だから) */
function LongCloud({ t }: SceneProps) {
  const drift = span(t, CLOUD_FROM, CLOUD_STOP, easeOut)
  if (drift <= 0) return null
  return (
    <Layer x={-100 * (1 - drift)}>
      <Layer y={1.5}>
        <Bone char={CHAR} n={1} color={CLOUD_SHADE} width={6.4} />
      </Layer>
      <Bone char={CHAR} n={1} color={CLOUD} width={5.6} />
      <circle cx="36" cy="22" r="3.8" fill={CLOUD} />
      <circle cx="62" cy="19" r="4.2" fill={CLOUD} />
    </Layer>
  )
}


/** 子どもの 場所と かっこう。立つ → 見上げて 指さす → しゃがむ → ジャンプで ひろげる */
function kidAt(t: number) {
  const point = span(t, POINT, POINT + 0.7, easeOut) * (1 - span(t, REALIZE, CROUCH))
  const pointing: PersonPose = { rightArm: mixLimb(HANG_ARM, ARM_POINT, point) }
  const down = span(t, CROUCH - 0.05, JUMP, easeInOut) * (1 - span(t, JUMP, JUMP + 0.2))
  const spread = span(t, JUMP, SPREAD_END, backOut)
  const pose = mixPose(mixPose({ ...STAND, ...pointing }, SQUAT, down), SPREAD_POSE, spread)
  // 見上げる: 雲に 気づいて 上を むく。うれしくなると 正面
  const look = span(t, NOTICE, NOTICE + 0.5, easeOut) * (1 - span(t, REALIZE, REALIZE + 0.4))
  const lift = APEX * span(t, JUMP, SPREAD_END, easeOut) + 0.6 * wave(t, 1.4) * span(t, SPREAD_END, SPREAD_END + 0.4)
  return {
    x: KID_X,
    y: KID_Y,
    build: 'child',
    height: KID_HEIGHT,
    facing: 'front',
    look: LOOKS.boy,
    face: t < NOTICE ? 'sleepy' : t < REALIZE ? 'surprised' : 'joy',
    gazeY: -look,
    lift: Math.max(0, lift),
    opacity: span(t, POP, POP + 0.1),
    pose: { ...pose, head: -6 * look },
  } as const
}

/** ひと休み の 小鳥。右から 左へ とおりすぎる(にぎやかし) */
function Passing({ t }: SceneProps) {
  const fly = span(t, 0.5, 3.4)
  if (fly <= 0 || fly >= 1) return null
  return <Bird x={118 - fly * 140} y={10 + Math.sin(fly * 9) * 1.6} t={t} flying facing="left" />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)
  const kid = kidAt(t)
  const rig = personRig(kid)
  const [hx, hy] = rig.world.head
  const headR = rig.body.headR * rig.scale
  const pop = backOut(span(t, POP, POP + 0.5))
  const ask = during(t, NOTICE + 0.2, POINT + 0.3, 0.2)
  const aha = during(t, REALIZE, CROUCH + 0.3, 0.15)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[98, 12]} tufts={[8, 22, 80, 100]} clouds={[]} />
        <Passing t={t} />
        <LongCloud t={t} />
        <Layer scale={Math.max(0, pop)} origin={[KID_X, KID_Y]}>
          <Person {...kid} />
        </Layer>
        <Question x={hx + headR * 1.4} y={hy - headR * 0.8} show={ask} t={t} size={9} />
        <Notice x={hx} y={hy} r={headR} show={aha} dir={-1} color={AHA} />
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Layer scale={1 + Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.05} origin={[54.5, 54.5]}>
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
    { at: 0, label: '子どもが ぼんやり 立っている', sound: 'pop' },
    { at: CLOUD_FROM, label: '長い雲が ながれてきて、見上げる' },
    { at: POINT, label: '雲が あたまの真上で とまる。指さして「あっ」' },
    { at: CROUCH, label: 'しゃがんで ぴょん!', sound: 'pop' },
    { at: SPREAD_END, label: '手と あしを ひろげて ジャンプ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '天 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
