/*
 * 一(いち): 石の上に のせてある、1ぽんの ぼう。子どもが もちあげて「いち!」。
 * (共通部品 sceneFigures で 書きなおした もの)
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 子どもが 胸の高さで よこに もちあげた、1ぽんの ぼう
 *                  (ぼうは 右が 少し上がる。字の線と おなじ。手は ぼうの まんなか よりに りょうてで にぎる)
 *
 * ながれ
 *   2つの石の上に 1ぽんの ぼうが のっている
 *   → 子どもが あるいてきて「あれ?」と 立ちどまる(正面を むき、ふしぎそうに あたまを かしげる)
 *   → しゃがんで りょうてで ぼうを つかみ、「よいしょ」と もちあげる(あせ・ふらふら)
 *   → 胸の高さで ぴたっと とまって、にっこり(小鳥が ぼうの はしに とまる)
 *   → ぼうが ほね として ひかり、絵が うすくなって 字「一」が のこる
 *
 * 人は Person。あるきは walk、正面への 向きかえは turnAround、しゃがむのは posture('squat')。
 * ぼうを にぎる手は { to, depth } で まえへ のばす。ぼうと 石は 子どもの held に わたし、
 * 体の てまえ・うで の うしろ に 描く(さいごまで 子どもの 手前。前後を かえない)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Bird, CLOTHES, LOOKS, mixLimb, mixPose, PALETTE, Person, personRig, posture, Question, Sweat, turnAround, walk, type Limb, type PersonProps } from '../sceneFigures'

const CHAR = '一'

const STICK = '#a8744a'
const STICK_LIGHT = '#c9965f'
const STICK_NODE = '#70452b'
const ROCK = '#b9bec7'
const ROCK_DARK = '#9aa0ab'

/** くぎり の時間(秒) */
const WALK = 0.5
const STOP = 1.9
const CROUCH = 2.8
const GRIP = 3.1
const LIFT = 3.5
const UP = 4.9
const INK = 5.8
const DONE = 8.0
const DURATION = 8.6

type Pt = readonly [number, number]

/** 子どもの 立つ 場所(こし の x、地面)と 背の高さ */
const KID_X = 54.5
const FLOOR = 95
const HEIGHT = 80
/** ぼうが 石の上に のっている ときの、字の線からの 下がり(石の上に のる高さ) */
const REST_DROP = 30
/** ぼうの 右が 上がる かたむき(字の線と おなじ) */
const SLOPE = 0.0503
const TILT_DEG = (Math.atan(SLOPE) * 180) / Math.PI
/** 字の線の まんなか。ぼうは ここを じく に かたむける */
const STICK_MID: Pt = [54, 52]
/** りょうての にぎる場所(ぼうの x。右手 = 画面の 左) */
const GRIP_X: readonly [number, number] = [41, 68]
/** 手を 体の まえへ のばす きょり(ぼうは 体の てまえ) */
const REACH = 8

const STAND = posture('stand', 'front')
const SQUAT = posture('squat', 'front')
const HANG: Limb = { swing: 4, bend: 6 }

/** ぼうの上の x の 場所が、いま どこに あるか(かたむき・下がり を ぜんぶ ふくめる) */
function stickPoint(px: number, tilt: number, drop: number): Pt {
  const y0 = 52.4 - (px - STICK_MID[0]) * SLOPE
  const rad = (tilt * Math.PI) / 180
  const rx = px - STICK_MID[0]
  const ry = y0 - STICK_MID[1]
  return [STICK_MID[0] + rx * Math.cos(rad) - ry * Math.sin(rad), STICK_MID[1] + rx * Math.sin(rad) + ry * Math.cos(rad) + drop]
}

/** ぼうを のせている 2つの石。ぼうが もちあげられた あとも、そこに のこる。 */
function Rocks({ t }: SceneProps) {
  const pop = span(t, 0, 0.5, backOut)
  return (
    <Layer scale={pop} origin={[54.5, 96]}>
      {[18, 91].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="93" rx="8.4" ry="7.4" fill={ROCK_DARK} />
          <ellipse cx={x - 0.6} cy="91.4" rx="7.6" ry="6.2" fill={ROCK} />
        </g>
      ))}
    </Layer>
  )
}

/** 1ぽんの ぼう。字の 1画目の線を そのまま しん にする。 */
function Stick({ tilt, drop }: { readonly tilt: number; readonly drop: number }) {
  return (
    <Layer y={drop} rotate={tilt} origin={STICK_MID}>
      <Bone char={CHAR} n={1} color={STICK} width={4.6} />
      <Layer y={-1.1}>
        <Bone char={CHAR} n={1} color={STICK_LIGHT} width={1.3} />
      </Layer>
      {/* たけの ふし のような しるし */}
      {[24, 54, 82].map((x) => (
        <rect key={x} x={x - 0.6} y={52.4 - (x - 54) * SLOPE - 2.3} width="1.2" height="4.6" rx="0.6" fill={STICK_NODE} />
      ))}
    </Layer>
  )
}

/** 子どもの 場所と かっこう。あるいてきて 正面を むき、しゃがんで ぼうを つかみ、もちあげる */
function kidAt(t: number, tilt: number, drop: number, lift: number): PersonProps {
  const walking = walk(t, { from: -20, to: KID_X, start: WALK, end: STOP, build: 'child', height: HEIGHT })
  const turn = turnAround(t, STOP, 'right', 'front')
  const squat = span(t, CROUCH, GRIP + 0.3, easeInOut) * (1 - lift)
  const sit = mixPose(STAND, SQUAT, squat)
  const grasp = span(t, CROUCH + 0.2, GRIP + 0.3, easeInOut)
  const grip = (side: 0 | 1): Limb => ({ to: stickPoint(GRIP_X[side], tilt, drop), depth: REACH })
  const pose = t < STOP ? walking.pose : { ...sit, rightArm: mixLimb(sit.rightArm ?? HANG, grip(0), grasp), leftArm: mixLimb(sit.leftArm ?? HANG, grip(1), grasp), head: t < CROUCH ? 7 * span(t, STOP, STOP + 0.4, easeOut) : t < UP ? 0 : wave(t, 1.4) * 3 }
  return {
    ...walking,
    ...turn,
    y: FLOOR,
    look: { ...LOOKS.boy, top: CLOTHES.red.top },
    face: t < GRIP + 0.2 ? 'normal' : t < UP ? 'strain' : 'joy',
    // しゃがんでから 持ちあげるまで ぼうを 見る
    gazeY: t >= CROUCH && t < UP ? 1 : 0,
    pose,
  }
}

/** もちあげた あと、小鳥が とんできて ぼうの 右はしに とまる。 */
function Songbird({ t }: SceneProps) {
  const arrive = span(t, UP, UP + 0.7, easeOut)
  if (arrive <= 0) return null
  const landed = arrive >= 1
  const hop = landed ? Math.abs(wave(t, 0.7)) * 0.8 : 0
  // 字の線(右はし)の 少し上に とまる
  return <Bird x={118 - arrive * 28} y={6 + arrive * 39.4 - Math.sin(arrive * Math.PI) * 8 - hop} t={t} flying={!landed} />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 1)

  // ぼう: 石の上から、字の線の場所へ。もちあげる とちゅう は 少し ふらふら
  const lift = span(t, LIFT, UP, easeInOut)
  const wobble = wave(t, 0.4) * 3.2 * Math.sin(lift * Math.PI)
  const tilt = (1 - lift) * TILT_DEG + wobble
  const drop = REST_DROP * (1 - lift)
  const appear = span(t, 0.2, 0.7, easeOut)

  const kid = kidAt(t, tilt, drop, lift)
  const head = personRig(kid).world.head
  const stick = (
    <>
      <Rocks t={t} />
      <Layer opacity={appear}>
        <Stick tilt={tilt} drop={drop - (1 - appear) * 22} />
      </Layer>
    </>
  )

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} clouds={[[72, 14, 1], [96, 26, 0.8]]} tufts={[6, 30, 78, 102]} />
        <Person {...kid} held={stick} />
        <Question x={head[0] + 9} y={head[1] - 10} show={during(t, STOP + 0.1, CROUCH - 0.1, 0.15)} t={t} color={PALETTE.notice} />
        <Sweat t={t} x={head[0] + 9} y={head[1] - 4} show={during(t, LIFT + 0.1, UP, 0.2)} dir={1} />
        <Songbird t={t} />
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
    { at: 0, label: '石の上に 1ぽんの ぼう', sound: 'pop' },
    { at: WALK, label: '子どもが あるいてくる' },
    { at: STOP, label: '「あれ?」と 立ちどまる', sound: 'pop' },
    { at: CROUCH, label: 'しゃがんで ぼうを つかむ' },
    { at: LIFT, label: 'よいしょ と もちあげる' },
    { at: UP, label: 'にっこり。小鳥が とまる', sound: 'pop' },
    { at: INK, label: 'ぼう が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '一 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
