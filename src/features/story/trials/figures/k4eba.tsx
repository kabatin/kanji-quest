/*
 * 人(ひと): 子どもが よこを むいて 立ち、うでを まえに のばしている。(共通部品 sceneFigures で 書きなおした ためし)
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … あたまの てっぺんの はねた かみ → どう → まえに ふみだした 足
 *   2画目(ヽ)  … こし から うしろへ のばした 足(ぐっと ふみだす)
 *   (うで は 1画目の よこ、まえへ のびる。字と ぴったり 重ならなくても だいたい 同じ むき)
 *
 * ながれ
 *   野はらに お日さまと お花 → 子どもが しょんぼり あるいてくる(さみしい顔)
 *   → ちょうちょが ひらひら とんでくる。子どもが 気づいて びっくり(顔が ぱっと上がる)
 *   → うれしくなって、うでを まえに のばして 大きく 一歩 ふみだす
 *   → ちょうちょが 手に とまる(にっこり)
 *   → 子どもの 体に ほね が ひかって、絵が うすくなり、字「人」が のこる
 *
 * 人の つくり は 部品(Person)が 守る。あるきは walk()。
 * 一歩 ふみだす ときは、こし を 先に さげて(足の 長さ は かえない)、まえの足・うしろの足 を 地面に おく。
 * 足の 長さ には かぎりが あるので、元の場面 ほど 大きくは ふみだせない(字の 2画目 とは だいたい 同じ むき)。
 */
import { during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../../sceneParts'
import { Backdrop, BUILDS, Butterfly, Flower, HANG_ARM, mixLimb, Notice, PALETTE, Person, personRig, reach, walk, type Expression, type Placement } from '../../sceneFigures'

const CHAR = '人'

/** くぎり の時間(秒) */
const WALK = 0.5
const STOP = 2.7
/** ちょうちょ が見えはじめる / 子どもが 気づく */
const FLY_IN = 2.4
const NOTICE = 3.0
/** ちょうちょ が 目の前に きて、子どもが にっこりする */
const HAPPY = 3.8
/** うでを のばす・一歩 ふみだす */
const REACH = 3.9
const STEP = 4.0
const LAND = 5.0
const PERCHED = 5.7
const INK = 6.2
const DONE = 8.8
const DURATION = 9.3

type Pt = readonly [number, number]

const GROUND = 92
/** こし の x(立ちどまる ところ) */
const HIP_X = 47
const HEIGHT = 84
/** さいごに のばす 手(1画目の よこ) */
const HAND_GOAL: Pt = [17, 49]
/** ふみだした ときの 足先(こし から。背の高さ 100 の 単位。+x が まえ、+y が 下)。足の 長さ(32)より みじかく */
const FRONT_FOOT: Pt = [20, 22]
const BACK_FOOT: Pt = [-22, 22]

const LEGS: Pt = [BUILDS.child.thigh, BUILDS.child.shin]
/** ふみだした 足の かっこう(まえの足は ひざが まがり、うしろの足は のびる) */
const FRONT_LEG = reach([0, 0], FRONT_FOOT, LEGS, 'leg', 'side')
const BACK_LEG = reach([0, 0], BACK_FOOT, LEGS, 'leg', 'side')
/** 立っている ときの 足(てまえ・むこう) */
const NEAR_REST = { swing: 1.5, bend: 0 }
const FAR_REST = { swing: -1.5, bend: 0 }

const lerp = (a: number, b: number, k: number) => a + (b - a) * k

type Mood = Expression

/** 子どもの 場所と かっこう。左むき(てまえ の 手足 は 右) */
function childAt(t: number): Placement & { readonly face: Mood; readonly gazeY: number; readonly squash?: number } {
  const walking = walk(t, { from: HIP_X + 70, to: HIP_X, start: WALK, end: STOP, build: 'child', height: HEIGHT, armSwing: 10 })
  const settle = span(t, STOP - 0.3, NOTICE)
  const step = span(t, STEP, STEP + 1.0, easeInOut)
  const reachK = span(t, REACH, REACH + 1.0, easeInOut)
  // しょんぼり あるく とき は 少し うつむく。気づくと 顔が ぱっと 上がり、にっこりで すこし 見上げる
  const head = mix(t, NOTICE - 0.1, NOTICE + 0.2, 8, -6) + mix(t, HAPPY, HAPPY + 0.5, 0, -3)
  const torso = 6 * (1 - settle) + 5 * step
  const walkingNow = t < STEP
  const nearArm = t < REACH ? (walking.pose.rightArm ?? HANG_ARM) : mixLimb(HANG_ARM, { to: HAND_GOAL }, reachK)
  // むこうの うでも 少し まえへ(いきおい を つける)
  const farArm = t < REACH ? (walking.pose.leftArm ?? HANG_ARM) : mixLimb(HANG_ARM, { swing: 32, bend: 42 }, reachK)
  const nearLeg = walkingNow ? (walking.pose.rightLeg ?? NEAR_REST) : mixLimb(NEAR_REST, FRONT_LEG, step)
  const farLeg = walkingNow ? (walking.pose.leftLeg ?? FAR_REST) : mixLimb(FAR_REST, BACK_LEG, step)
  const face: Mood = t < NOTICE ? 'sad' : t < HAPPY ? 'surprised' : 'smile'
  return {
    ...walking,
    y: GROUND,
    lean: 7 * step,
    pose: { rightArm: nearArm, leftArm: farArm, rightLeg: nearLeg, leftLeg: farLeg, torso, head },
    face,
    // しょんぼり は 目を 下へ。気づくと ぱっと 上がり、手に とまると 少し 見上げる
    gazeY: mix(t, NOTICE - 0.1, NOTICE + 0.2, 0.8, 0) + mix(t, HAPPY, HAPPY + 0.5, 0, -0.3),
  }
}

/** 1画目の 書きはじめ: あたまの てっぺんの ぴょこんと はねた かみ(あたま 半径 1 の 座標) */
const TUFT = <path d="M-0.39 -0.83 Q-0.48 -1.17 -0.67 -0.95 Q-0.8 -1.24 -0.89 -0.9" fill="none" stroke={PALETTE.hair} strokeWidth="0.21" strokeLinecap="round" strokeLinejoin="round" />

/** ちょうちょ の いち。とんでくる → 手の まえで ひらひら → 手に とまる(とまる ところは 手の 少し 上) */
function butterflyPosition(t: number, perch: Pt): Pt {
  const hover = (u: number): Pt => {
    const w = ((u - 3.4) / 1.8) * Math.PI * 2
    return [19 + 3.6 * Math.cos(w), 40 + 2.4 * Math.sin(2 * w)]
  }
  if (t < 3.4) {
    const p = span(t, FLY_IN, 3.4, easeOut)
    return [lerp(-6, 22.6, p) + wave(t, 0.7) * 0.8, lerp(12, 40, p) - Math.sin(p * Math.PI) * 6 + wave(t, 0.5) * 1.1]
  }
  if (t < LAND) return hover(t)
  const from = hover(LAND)
  const k = span(t, LAND, PERCHED, easeInOut)
  return [lerp(from[0], perch[0], k), lerp(from[1], perch[1], k)]
}

function Fluttering({ t, perch }: { readonly t: number; readonly perch: Pt }) {
  if (t < FLY_IN) return null
  const [x, y] = butterflyPosition(t, perch)
  const perched = t >= PERCHED
  return <Butterfly x={x} y={y} t={perched ? t - PERCHED : t} perched={perched} />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 2)
  const child = childAt(t)
  const rig = personRig(child)
  // とまる ところ: 手の すぐ上(のばした 手の 先 は、いつも この 場所)
  const hand = personRig(childAt(PERCHED)).world.arms.right.end
  const head = rig.world.head
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[95, 13]} clouds={[[-4, 11, 1], [70, 22, 0.85]]} tufts={[30, 62, 90]} />
        <Flower x={5} y={95} color="#f07f9e" grow={span(t, 0.25, 0.95)} sway={wave(t, 2.6) * 4} />
        <Flower x={101} y={95} color="#ffffff" grow={span(t, 0.35, 1.05)} sway={wave(t, 2.6, 1.3) * 4} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.1)}>
          <Person {...child} headwear={TUFT} />
          {/* 気づいた「はっ」(あたまの 前がわ に すじ) */}
          <Notice x={head[0]} y={head[1]} r={rig.body.headR * rig.scale} show={during(t, NOTICE, HAPPY, 0.15)} dir={-1} />
        </Layer>
        <Fluttering t={t} perch={[hand[0], hand[1] - 4.5]} />
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
    { at: 0, label: '野はらに お日さまと お花', sound: 'pop' },
    { at: WALK, label: '子どもが しょんぼり あるいてくる' },
    { at: NOTICE, label: 'ちょうちょ に 気づいて びっくり', sound: 'pop' },
    { at: STEP, label: 'うでを まえに のばして 一歩 ふみだす' },
    { at: LAND, label: 'ちょうちょ が 手に とまる。にっこり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '人 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
