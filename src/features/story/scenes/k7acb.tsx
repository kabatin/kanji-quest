/*
 * 立(たつ): 人が じめんの 上に りょうあしを ひらいて 立つ。
 *
 * ほね(画と絵の対応)
 *   1画目(丶)  … あたまの てっぺん から くび へ のびる たて線(かみの ふさ と、そこに とまる ちょうちょ)
 *   2画目(一)  … よこに ひろげた りょううで(バランスを とって 立った ところ)
 *   3画目(ノ)  … 左の あし
 *   4画目(丨)  … 右の あし
 *   5画目(一)  … じめん
 *
 * ながれ
 *   子どもが ころんで ぺたん。ないて いる
 *   → ちょうちょが とんできて、見上げる(びっくり)
 *   → 手で じめんを おして、よいしょと 立ちあがる(ふらふら、りょううでで バランス)
 *   → ぴたっと 立てた! ちょうちょが あたまに とまって にっこり
 *   → ほね が ひかって、絵が うすくなり、字「立」が のこる
 *
 * 子どもは Person(共通部品)。すわる→しゃがむ→立つは posture と mixPose、手と足は { to } で 1画目・2画目の 線へ。
 *   あたまの 上の ちょうちょは Butterfly、ほこり・「はっ」・ハートは Dust・Notice・Hearts、空と おかは Backdrop。
 */
import { during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Butterfly, Dust, Flower, Hearts, LOOKS, mixLimb, mixPose, Notice, Person, personRig, posture, type Limb, type PersonPose } from '../sceneFigures'

const CHAR = '立'

const GRASS = '#c5e8a9'
const GRASS_DARK = '#a6d681'
const SOIL = '#c9a77c'

/** くぎり の時間(秒) */
const LAND = 0.75
const SAD = 0.95
const BUTTERFLY = 2.2
const PUSH = 3.0
const STAND = 4.4
const HAPPY = 5.7
const INK = 6.3
const DONE = 9
const DURATION = 9.6

type Pt = readonly [number, number]

/** 子どもの まんなか(からだの たて線) */
const CX = 54.5
/** じめんの 高さ(あしの うらが つく) */
const GROUND = 87
/** 子どもの 背の高さ(立ったとき) */
const KID_HEIGHT = 70
/** うでを ひろげた ときの 手の 位置(2画目と同じ、左右に ひろがる 線)。右手は 画面の 左 */
const HAND_LEFT: Pt = [22, 38]
const HAND_RIGHT: Pt = [87, 35.8]
/** すわって 手を ついた ときの 手の 位置(まんなか から よこへ) */
const HAND_REST_W = 15
const HAND_REST_Y = 84

type Mood = 'sad' | 'surprised' | 'try' | 'happy'
const FACES = { sad: 'cry', surprised: 'surprised', try: 'strain', happy: 'joy' } as const

/** ちょうちょ の 位置。右上から とんできて、あたまの 上を ひらひら まわり、さいごに あたま に とまる。 */
function butterflyAt(t: number, rest: Pt): { readonly pos: Pt; readonly landed: number } {
  const enter = span(t, BUTTERFLY, BUTTERFLY + 1.1, easeOut)
  const arrive: Pt = [mix(t, BUTTERFLY, BUTTERFLY + 1.1, 118, 84, easeOut), mix(t, BUTTERFLY, BUTTERFLY + 1.1, 12, 22, easeOut)]
  // ひらひら と ゆれながら 空を まわる
  const s = t - (BUTTERFLY + 1.1)
  const loop: Pt = [72 + 17 * Math.cos(s * 1.9 + 0.2), 18 + 6 * Math.sin(s * 3.1 + 1)]
  const join = span(t, BUTTERFLY + 0.9, BUTTERFLY + 1.4)
  const flight: Pt = enter < 1 ? arrive : [arrive[0] + (loop[0] - arrive[0]) * join, arrive[1] + (loop[1] - arrive[1]) * join]
  // あたまの てっぺん に とまる
  const landed = span(t, 5.0, HAPPY, easeInOut)
  return { pos: [flight[0] + (rest[0] - flight[0]) * landed, flight[1] + (rest[1] - flight[1]) * landed - Math.sin(landed * Math.PI) * 7], landed }
}

/** じめん。上の ふち は 5画目の線(まっすぐな じめん)に そろえる。 */
function Ground({ t }: { readonly t: number }) {
  const sway = wave(t, 2.6) * 2
  return (
    <>
      <path d="M-2 88 C30 87.6 70 86.4 111 87.2 V111 H-2 Z" fill={GRASS_DARK} />
      <path d="M-2 98 C30 97 70 96.4 111 97 V111 H-2 Z" fill={SOIL} opacity="0.55" />
      <Bone char={CHAR} n={5} color={GRASS} width={5} />
      <Flower x={12} y={90} color="#ff8fb1" sway={sway} />
      <Flower x={97} y={90} color="#b89cf2" sway={sway} />
    </>
  )
}

const STAND_LEGS: PersonPose = { leftLeg: { swing: 8, bend: 0 }, rightLeg: { swing: 8, bend: 0 } }

/** 子どもの 場所と かっこう。すわる → しゃがむ → 立つ。手は じめんから 2画目の 線へ */
function kidAt(t: number): Parameters<typeof Person>[0] {
  const rise = span(t, PUSH, STAND, easeInOut)
  const armsOut = span(t, PUSH + 0.35, STAND + 0.1, easeInOut)
  // 立ってから ふらふら して、だんだん ぴたっと 止まる
  const settle = 1 - span(t, STAND, HAPPY - 0.2)
  const flapPhase = (t - STAND) * 7
  const sway = rise >= 1 ? Math.sin((t - STAND) * 6.5) * 5 * settle : 0

  const sit = posture('sitFloor', 'front')
  const crouch = posture('squat', 'front')
  const stand: PersonPose = { ...posture('stand', 'front'), ...STAND_LEGS }
  const body = rise < 0.5 ? mixPose(sit, crouch, rise * 2) : mixPose(crouch, stand, (rise - 0.5) * 2)

  const arm = (side: -1 | 1): Limb => {
    const rest: Limb = { to: [CX + side * HAND_REST_W, HAND_REST_Y], depth: 4 }
    const out = side < 0 ? HAND_LEFT : HAND_RIGHT
    const swing = Math.sin(flapPhase + (side < 0 ? 0 : Math.PI)) * settle * 5
    return mixLimb(rest, { to: [out[0], out[1] + swing] }, armsOut)
  }
  const mood: Mood = t < BUTTERFLY ? 'sad' : t < PUSH ? 'surprised' : t < STAND ? 'try' : 'happy'
  // 目は ちょうちょを おう(ないている ときは 下を見る)
  const rest: Pt = [CX + 1.5, 12]
  const { pos: fly } = butterflyAt(t, rest)
  const watching = t >= BUTTERFLY
  const drop = 1 - easeIn(span(t, 0.2, LAND))
  return {
    x: CX,
    y: GROUND,
    build: 'child',
    height: KID_HEIGHT,
    facing: 'front',
    look: { ...LOOKS.boy, top: '#f0765a' },
    face: FACES[mood],
    gaze: watching ? Math.max(-1, Math.min(1, (fly[0] - CX) / 16)) : 0,
    gazeY: watching ? -1 : 0.9,
    lift: 30 * drop,
    lean: sway,
    opacity: span(t, 0.1, 0.3),
    pose: { ...body, rightArm: arm(-1), leftArm: arm(1), head: mood === 'sad' ? 5 : mood === 'try' ? -2 : 0 },
  }
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)
  const kid = kidAt(t)
  const rig = personRig(kid)
  const head = rig.world.head
  const headR = rig.body.headR * rig.scale
  const { pos: fly, landed } = butterflyAt(t, [head[0] + 1.5, head[1] - headR - 1])
  const squash = Math.sin(span(t, LAND, LAND + 0.4) * Math.PI)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[13, 13]} clouds={[[-2, 40, 0.9], [92, 48, 0.8]]} ground={98} />
        <Ground t={t} />
        <Layer scaleX={1 + squash * 0.05} scaleY={1 - squash * 0.08} origin={[CX, GROUND]}>
          <Person {...kid} />
        </Layer>
        <Dust x={CX} y={GROUND - 1.5} p={span(t, LAND, LAND + 0.6, easeOut)} reach={26} />
        <Notice x={head[0]} y={head[1]} r={headR} show={during(t, BUTTERFLY + 0.4, PUSH + 0.2, 0.15)} />
        {t >= BUTTERFLY && <Butterfly x={fly[0]} y={fly[1]} t={t} perched={landed >= 1} />}
        <Hearts t={t} x={36} y={22} show={during(t, HAPPY, HAPPY + 1.4, 0.3)} />
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Layer scale={1 + Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06} origin={[54.5, 54.5]}>
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
    { at: 0, label: '子どもが ころんで ぺたん', sound: 'pop' },
    { at: SAD, label: 'いたくて しくしく ないている' },
    { at: BUTTERFLY, label: 'ちょうちょが とんできて、見上げる', sound: 'tap' },
    { at: PUSH, label: '手で じめんを おして、よいしょ と 立ちあがる' },
    { at: STAND, label: 'ふらふら、りょううでで バランス' },
    { at: HAPPY, label: 'ぴたっと 立てた! ちょうちょが あたまに とまる', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '立 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
