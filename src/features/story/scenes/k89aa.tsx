/*
 * 親(おや): 木に のぼる 子どもを、そばで みまもる おや。(共通部品 sceneFigures で 書きなおした もの)
 *
 * ほね(画と絵の対応)
 *   1〜5画目   … 木の 大きな しげみ(上の 部分)
 *   6画目(一)  … 木の よこに のびた えだ(子どもが ここに すわる)
 *   7画目(丨)  … 木の みき
 *   8・9画目   … みきから 下に たれた えだ
 *   10〜14画目 … みている おや(あたま の 目の まわり = 見 の 四角)
 *   15・16画目 … おやの 体と あし
 *   (おや と 子どもは 絵のとおりに 立つので、見の画には「だいたい」同じ場所・同じ向き で重なる)
 *
 * ながれ
 *   木が そだち、赤い りんごが なる。子どもが 木の下で「ほしいな」と 見上げる(おや は にこにこ)
 *   → ジャンプしても とどかない → 子どもが 木に のぼりはじめる。おやは しんぱいで 手を にぎる
 *   → えだ に すわった しゅんかん ぐらっと ゆれる(おやは「あっ」と 手を のばす)
 *   → 子どもが たちなおって りんごを もぎとる。おやは ほっとして、手を ひたいに かざして
 *     にこにこ みまもる(しんぱい → あんしん)
 *   → ほね が ひかって、絵が うすくなり、字「親」が のこる
 *
 * 人は Person。子どもは えだの上に すわり(posture)、のぼる ときは 足を かわりばんこに もちあげる。
 * おやは 正面で 立ち、うでは 点で 指定して(にぎる・のばす・ひたいに かざす)うごかす。
 */
import { backOut, during, easeInOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Canopy, HANG_ARM, Hearts, LOOKS, mixLimb, mixPose, Notice, PALETTE, personRig, Person, posture, seatHeight, STRAIGHT_LEG, Sweat, turnAround, walk, type Expression, type Limb, type PersonPose, type PersonProps } from '../sceneFigures'

const CHAR = '親'

const BARK = '#8c5b3c'
const LEAF_DARK = '#3f9c59'
const APPLE = '#e8534a'
const APPLE_DARK = '#c23e38'

/** くぎり の時間(秒) */
const POP = 0.5
const POINT = 1.0
const JUMP = 1.8
const GIVE_UP = 3.0
const CLIMB = 3.5
const SCOOT = 4.7
const SIT = 5.0
const WOBBLE = 5.1
const STEADY = 5.7
const PLUCK = 6.1
const INK = 7.0
const DONE = 10.0
const DURATION = 10.5

type Point = readonly [number, number]

/* ───────── おや ───────── */

const PARENT: PersonProps = {
  x: 69,
  y: 94,
  build: 'adult',
  height: 74,
  facing: 'front',
  look: { ...LOOKS.woman, hairStyle: 'bun', hair: '#4a3326', top: '#3fa7a0', bottom: '#4a5a86', bottomKind: 'pants', sleeves: 'long' },
}
const PARENT_RIG = personRig(PARENT).world
const CHEST_Y = PARENT_RIG.neck[1] + 16

/** [時間, うで] の ならび。時間が来ると つぎの かっこうへ なめらかに うつる */
type Key = readonly [at: number, limb: Limb]

function track(t: number, keys: readonly Key[]): Limb {
  const [first] = keys
  if (t <= first[0]) return first[1]
  for (let i = 0; i < keys.length - 1; i += 1) {
    const [from, a] = keys[i]
    const [to, b] = keys[i + 1]
    if (t < to) return mixLimb(a, b, span(t, from, to, easeInOut))
  }
  return keys[keys.length - 1][1]
}

/** てを ひたいに かざす(おでこの すこし 上、画面の 左がわ の 手) */
const SHADE: Limb = { to: [PARENT_RIG.head[0] - 6, PARENT_RIG.head[1] - 4], depth: 10 }
const CLASP_R: Limb = { to: [PARENT.x + 2, CHEST_Y], depth: 7 }
const CLASP_L: Limb = { to: [PARENT.x - 2, CHEST_Y + 1.5], depth: 8 }
const REACH_OUT: Limb = { to: [54, PARENT_RIG.neck[1] + 10], depth: 2 }
const GASP_R: Limb = { to: [48, PARENT_RIG.neck[1] + 1], depth: 2 }
const GASP_L: Limb = { swing: 50, bend: 20 }

/** おや の うで: にこにこ → ぎゅっと にぎる → のばす → あっ → ひたいに かざす(右手 = 画面の 左) */
function parentPose(t: number): PersonPose {
  const rightArm = track(t, [[1.9, HANG_ARM], [2.4, CLASP_R], [3.5, CLASP_R], [3.9, REACH_OUT], [5.0, REACH_OUT], [5.15, GASP_R], [5.6, GASP_R], [6.3, SHADE]])
  const leftArm = track(t, [[1.9, HANG_ARM], [2.4, CLASP_L], [3.5, CLASP_L], [3.9, HANG_ARM], [5.0, HANG_ARM], [5.15, GASP_L], [5.6, GASP_L], [6.3, HANG_ARM]])
  return { rightArm, leftArm, head: 0 }
}

function parentFace(t: number): Expression {
  if (t < 1.9) return 'smile'
  if (t < WOBBLE) return 'worried'
  if (t < STEADY) return 'surprised'
  if (t < 6.6) return 'smile'
  return 'joy'
}

/* ───────── 子ども ───────── */

const CHILD_HEIGHT = 38
const CHILD_GROUND = 95
const CHILD_LOOK = { ...LOOKS.boy, hair: '#7a4a2a', top: '#ffc83d', bottom: '#5b8fd9', shoes: '#d9594c', sleeves: 'short' } as const
/** えだ の 上の めん(6画目) と、すわった ときの 足もとの 高さ */
const BRANCH_TOP = 58.5
const SIT_Y = BRANCH_TOP + seatHeight('child', CHILD_HEIGHT)
const SIT_X = 40
const CLIMB_Y = 77
const TRUNK_X = 36
/** りんご(もぎとる 1つ)が なっている ところ */
const APPLE_AT: Point = [49, 42.6]

const CLIMB_ARMS: PersonPose = { leftArm: { swing: 168, bend: 4 }, rightArm: { swing: 168, bend: 4 } }
const SIT_POSE: PersonPose = { ...posture('sitChair', 'front'), leftArm: { swing: 55, bend: 12 }, rightArm: { swing: 55, bend: 12 } }

/** のぼる とき: あしを かわりばんこに ひざから もちあげる(正面) */
function climbPose(t: number): PersonPose {
  const swing = Math.sin((t - CLIMB) * Math.PI * 2 * 1.7)
  const up = Math.max(swing, 0)
  const down = Math.max(-swing, 0)
  return { ...CLIMB_ARMS, leftLeg: { swing: 2, bend: 0, fore: 40 * up, foreBend: 70 * up }, rightLeg: { swing: -2, bend: 0, fore: 40 * down, foreBend: 70 * down } }
}

/** たっている あいだ(ジャンプ まで): ゆびさし → ジャンプ → がっかり */
function groundPose(t: number): PersonPose {
  const arms = track(t, [[POINT - 0.1, HANG_ARM], [POINT + 0.2, { swing: 150, bend: 10 }], [JUMP - 0.2, { swing: 150, bend: 10 }], [JUMP, { swing: 168, bend: 4 }], [GIVE_UP - 0.1, { swing: 168, bend: 4 }], [GIVE_UP + 0.3, HANG_ARM]])
  const other = track(t, [[JUMP - 0.2, HANG_ARM], [JUMP, { swing: 168, bend: 4 }], [GIVE_UP - 0.1, { swing: 168, bend: 4 }], [GIVE_UP + 0.3, HANG_ARM]])
  return { rightArm: other, leftArm: arms, leftLeg: STRAIGHT_LEG, rightLeg: STRAIGHT_LEG }
}

function childFace(t: number): Expression {
  if (t < POINT) return 'smile'
  if (t < JUMP) return 'smile'
  if (t < GIVE_UP) return 'strain'
  if (t < CLIMB - 0.1) return 'sad'
  if (t < WOBBLE) return 'normal'
  if (t < STEADY) return 'surprised'
  if (t < 6.6) return 'smile'
  return 'joy'
}

/** 子ども の 場所・ポーズ。のぼる あいだ は 正面、木の そばへ 行く とき だけ 横を むく */
function childProps(t: number): PersonProps {
  const base: PersonProps = { x: 44, y: CHILD_GROUND, build: 'child', height: CHILD_HEIGHT, look: CHILD_LOOK, facing: 'front' }
  const look = { gaze: t < GIVE_UP ? 0.5 : 0, gazeY: t < WOBBLE ? -1 : t < STEADY ? 0 : -0.5 }
  const face = childFace(t)
  const hop = Math.sin(span(t, JUMP, JUMP + 0.4) * Math.PI) * 6 + Math.sin(span(t, JUMP + 0.6, JUMP + 1.0) * Math.PI) * 6

  const sideStart = GIVE_UP + 0.1
  const walkEnd = CLIMB - 0.3
  if (t < sideStart) return { ...base, ...look, face, lift: hop, pose: groundPose(t) }
  if (t < CLIMB) {
    const w = walk(t, { from: 44, to: TRUNK_X, start: sideStart + 0.3, end: walkEnd, build: 'child', height: CHILD_HEIGHT, armSwing: 8 })
    const turn = t < sideStart + 0.3 ? turnAround(t, sideStart, 'front', 'left') : t < walkEnd ? { facing: w.facing, squash: 1 } : turnAround(t, walkEnd, 'left', 'front')
    const pose = t < CLIMB - 0.15 ? w.pose : CLIMB_ARMS
    return { ...base, ...look, face, x: w.x, ...turn, pose }
  }
  if (t < SCOOT) {
    const rise = span(t, CLIMB, SCOOT, easeInOut)
    return { ...base, ...look, face, x: TRUNK_X, y: CHILD_GROUND + (CLIMB_Y - CHILD_GROUND) * rise, pose: climbPose(t) }
  }
  const k = span(t, SCOOT, SIT, easeInOut)
  const wobble = t >= WOBBLE && t < STEADY ? 6 * Math.sin((t - WOBBLE) * 13) * (1 - span(t, WOBBLE, STEADY)) : 0
  const sit = mixPose(CLIMB_ARMS, SIT_POSE, k)
  // すわったら りんごを もぎとり、手に もって みせる(右手 の ほう = 画面の 右)
  const pluck = span(t, PLUCK - 0.2, PLUCK + 0.1, easeInOut)
  const show = span(t, PLUCK + 0.1, PLUCK + 0.6, easeInOut)
  const hands: Limb = show > 0 ? mixLimb({ to: APPLE_AT, depth: 2 }, { to: [SIT_X + 11, 50], depth: 4 }, show) : mixLimb(SIT_POSE.leftArm ?? HANG_ARM, { to: APPLE_AT, depth: 2 }, pluck)
  const settled = t >= STEADY ? { ...sit, leftArm: hands } : sit
  return { ...base, ...look, face, x: TRUNK_X + (SIT_X - TRUNK_X) * k, y: CLIMB_Y + (SIT_Y - CLIMB_Y) * k, lean: wobble, pose: settled }
}

/** りんご: 木に なっている → もぎとられて 子どもの手に */
function TargetApple({ t, hand }: SceneProps & { readonly hand: Point }) {
  const leaves = span(t, 0.5, 1.0, backOut)
  if (leaves <= 0) return null
  const picked = t >= PLUCK
  const at: Point = picked ? [hand[0], hand[1] - 1.2] : APPLE_AT
  return (
    <Layer scale={picked ? 1 : leaves} origin={at}>
      {!picked && <path d={`M${at[0]} ${at[1] - 2.2} q0.4 -2.2 1.2 -3.6`} fill="none" stroke={BARK} strokeWidth="0.9" strokeLinecap="round" />}
      <circle cx={at[0]} cy={at[1]} r="2.8" fill={APPLE} />
      <circle cx={at[0] + 0.7} cy={at[1] + 0.9} r="2" fill={APPLE_DARK} opacity="0.35" />
      <circle cx={at[0] - 1} cy={at[1] - 1} r="0.7" fill="#ffd6d1" />
      <path d={`M${at[0]} ${at[1] - 2.6} q1.8 -2.4 3.2 -1.6 q-0.8 2 -3.2 1.6 Z`} fill={LEAF_DARK} />
    </Layer>
  )
}

/* ───────── 木・けしき ───────── */

function Tree({ t }: SceneProps) {
  // みき が下から のびて、えだ が ひろがり、さいごに 葉が ぽん と しげる
  const trunk = span(t, 0, 0.55, backOut)
  const boughs = span(t, 0.3, 0.75, backOut)
  const leaves = span(t, 0.5, 1.0, backOut)
  const sway = wave(t, 3.6) * 1.1
  return (
    <>
      <ellipse cx="34" cy="97.6" rx={17 * trunk} ry="2.8" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.6 + 0.4 * trunk} scaleY={trunk} origin={[34, 96]}>
        <path d="M27.5 97.5 Q33 92 32 85 L36.4 85 Q35.6 92 41.5 97.5 Z" fill={BARK} />
        <Bone char={CHAR} n={7} color={BARK} width={9} />
      </Layer>
      <Layer scale={boughs} origin={[33, 60]}>
        <Bone char={CHAR} n={6} color={BARK} width={5.6} />
        <Bone char={CHAR} n={8} color={BARK} width={5} />
        <Bone char={CHAR} n={9} color={BARK} width={4.6} />
      </Layer>
      {/* えだの先の 小さな しげみ */}
      <Canopy x={14.5} y={61.5} r={5.4} grow={leaves} sway={sway} />
      <Canopy x={12.8} y={84.8} r={5.6} grow={leaves} sway={sway} />
      <Canopy x={46.5} y={74.2} r={5} grow={leaves} sway={sway} />
      {/* 上の しげみ: 風で ゆっくり ゆれる */}
      <Canopy x={32} y={30} r={25} grow={leaves} sway={sway} fruit />
    </>
  )
}

/** 木から ひらひら おちる 葉(ひとやすみ の にぎやかし) */
function FallingLeaf({ t }: SceneProps) {
  const p = span(t, 2.0, INK - 0.1)
  if (p <= 0) return null
  const x = 18 + p * 8 + Math.sin(p * 11) * 5
  const y = 44 + p * 52
  return <path d="M0 -3.2 Q2.8 0 0 3.2 Q-2.8 0 0 -3.2 Z" fill={PALETTE.leafLight} stroke={LEAF_DARK} strokeWidth="0.5" transform={`translate(${x} ${y}) rotate(${Math.sin(p * 11) * 50 + 20})`} />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 16)
  const pop = span(t, POP - 0.2, POP + 0.3)
  const childPop = span(t, POP, POP + 0.4)
  const child = childProps(t)
  const hand = personRig(child).world.arms.left.end
  const parent: PersonProps = { ...PARENT, face: parentFace(t), gaze: -1, gazeY: t < 1.9 ? 0 : -0.3, lean: t >= 1.9 && t < STEADY ? wave(t, 0.7) * 0.8 : 0, pose: parentPose(t) }
  const head = PARENT_RIG.head
  const heart = during(t, 6.3, 8.6, 0.4)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[97, 13]} clouds={[[70, 9, 0.8]]} tufts={[6, 58, 86, 102]} />
        <Tree t={t} />
        <FallingLeaf t={t} />
        <TargetApple t={t} hand={hand} />
        <Layer opacity={childPop}>
          <Person {...child} />
        </Layer>
        <Layer opacity={pop}>
          <Person {...parent} />
        </Layer>
        <Sweat t={t} x={head[0] + 10} y={head[1] - 6} show={during(t, 2.0, WOBBLE, 0.25)} dir={1} />
        <Notice x={head[0]} y={head[1]} r={8.4} show={during(t, WOBBLE, STEADY, 0.15)} dir={1} />
        <Hearts t={t} x={head[0]} y={head[1] - 12} show={heart} />
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
    { at: 0, label: '木が そだち、りんごが なる', sound: 'pop' },
    { at: POINT, label: '子どもが りんごを 見上げる。おやは にこにこ' },
    { at: JUMP, label: 'ジャンプしても とどかない。おやは しんぱい' },
    { at: CLIMB, label: '子どもが 木に のぼる。おやは てを のばして そばで 見る', sound: 'pop' },
    { at: WOBBLE, label: 'ぐらっ。おやは「あっ」' },
    { at: PLUCK, label: 'りんごを もぎとる。おやは ほっと にこにこ みまもる', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '親 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
