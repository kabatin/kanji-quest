/*
 * 足(あし): かべに こしかけた 子の まるい ひざの 下に、あるいてきた あしあと。(共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)
 *   1〜3画目(口) … あたまと かお(上の まるい ところ)
 *   4画目(丨)   … ひざから 下へ たれた すね(まっすぐ ぶらぶら)
 *   5画目(一)   … ぶらぶら する足の あたり
 *   6画目(ノ)   … かべに のった もも と こし から 下へ のびる 線
 *   7画目       … 砂はまに ずっと つづく あしあと
 *
 * ながれ
 *   はまべが できる → つかれた子が 右から あるいてくる(あせ・うつむき)。うしろに あしあとが のこる
 *   → かべの 前で「ふう」。くるっと ふりかえる → ずっと つづく 自分の あしあとに びっくり「!」
 *   → ぴょん と かべに こしかけて、ひざ を ぶらぶら。にこにこ して ばんざい
 *   → ほね が ひかって、絵が うすくなり、字「足」が のこる
 *
 * 子は Person。あるきは walk(あしあとは walkPrints で 足と ぴったり)、ふりかえりは turnAround、
 * こしかけは posture('sitChair')。字の形と ぴったり重ならなくても、だいたい 同じ場所・同じ向きに してある。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Bird, Clouds, Footprint, HANG_ARM, LOOKS, mixLimb, mixPose, Notice, Person, personRig, posture, Seashore, seatHeight, Sigh, Sun, Sweat, turnAround, walk, walkPrints, type PersonPose, type WalkPlan } from '../sceneFigures'

const CHAR = '足'

const STONE = '#b9b3a6'
const STONE_LIGHT = '#d6d0c2'
const STONE_DARK = '#9d978a'
const KID_LOOK = { ...LOOKS.boy, top: '#e8604f', bottom: '#4a6fa5', bottomKind: 'shorts', sleeves: 'short' } as const

/** くぎり の時間(秒) */
const WALK_FROM = 0.7
const ARRIVE = 3.3
const TURN_A = 3.6
const TURN_B = 4.1
const HOP_A = 4.9
const HOP_B = 5.6
const CHEER_A = 6.0
const INK = 6.9
const DONE = 9.6
const DURATION = 10.2

/** 子の 背の高さ(近くで 大きく 見せる)・地面・立ち止まる x(こし) */
const KID_H = 74
const GROUND = 94
const PIVOT = 50
const WALK_START_X = 126
/** かべに こしかけた ときの こし の x */
const SEAT_X = 24
/** かべの てっぺん と、かべの はし */
const WALL_TOP = 62
const WALL_EDGE = 36

const WALK: WalkPlan = { from: WALK_START_X, to: PIVOT, start: WALK_FROM, end: ARRIVE, build: 'child', height: KID_H, step: 15, armSwing: 10 }
const PRINTS = walkPrints(WALK)

/* ───────── はまべ ───────── */

function Beach({ t }: SceneProps) {
  return (
    <>
      <Seashore t={t} horizon={66} shore={90} />
      <Sun t={t} x={96} y={14} />
      <Clouds t={t} at={[[56, 9, 1], [88, 36, 0.9]]} speed={1.2} />
    </>
  )
}

/** 子が こしかける、石の かべ */
function Wall({ t }: SceneProps) {
  const rise = span(t, 0.15, 0.75, backOut)
  return (
    <Layer scaleY={rise} origin={[0, 99]}>
      <ellipse cx="22" cy="98.4" rx="26" ry="3" fill="#000000" opacity="0.1" />
      <rect x="-8" y={WALL_TOP} width={WALL_EDGE + 8} height="37" rx="4.5" fill={STONE} />
      <rect x="-8" y={WALL_TOP} width={WALL_EDGE + 8} height="5" rx="3" fill={STONE_LIGHT} />
      <path d="M-4 78 H14 M20 78 H34 M6 90 H26" fill="none" stroke={STONE_DARK} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M14 78 v-8 M26 90 v-9" fill="none" stroke={STONE_DARK} strokeWidth="1.1" strokeLinecap="round" />
    </Layer>
  )
}

/** あるいた 足あと。足が ついた ときに ぽん と のこる(左右で 少し ずらす) */
function Footprints({ t }: SceneProps) {
  return (
    <>
      {PRINTS.map((p) => (
        <Footprint key={p.at} x={p.x} y={GROUND + (p.side === 'left' ? 1.4 : -1.2)} size={15} facing={p.facing} kind="shoe" grow={span(t, p.at, p.at + 0.25)} />
      ))}
    </>
  )
}

/** 子の 場所・かっこう(ぜんぶ 時間から) */
function kidAt(t: number) {
  const w = walk(t, WALK)
  // ぴょん と かべに とびのる: こし が 弓なり に あがって、かべの うえ へ
  const hop = span(t, HOP_A, HOP_B, easeInOut)
  const arc = Math.sin(hop * Math.PI)
  const sway = wave(t, 1.2) * span(t, HOP_B, HOP_B + 0.3)
  const seatY = WALL_TOP + seatHeight('child', KID_H)
  const cheer = during(t, CHEER_A, INK - 0.2, 0.25)
  // あたま: うつむく → あしあとを 見る → かお を あげる
  const head = mix(t, TURN_B, TURN_B + 0.3, 6, 12) - 10 * span(t, HOP_A, HOP_B) - 10 * cheer
  // あるくときは まえへ かがむ。こしかけて あしあとを 見るときは 少し のりだす
  const torso = 9 * (1 - span(t, ARRIVE, ARRIVE + 0.4)) + 4 * span(t, HOP_B, HOP_B + 0.3)
  const base: PersonPose = { ...w.pose, torso, head }
  const sit: PersonPose = { ...posture('sitChair', 'right'), leftLeg: { swing: 88, bend: 90 - sway * 16 }, rightLeg: { swing: 92, bend: 92 + sway * 16 }, torso, head }
  const body = mixPose(base, sit, hop)
  const up = { swing: 172 + wave(t, 0.4) * 4, bend: 6 }
  const pose: PersonPose = { ...body, rightArm: mixLimb(body.rightArm ?? HANG_ARM, up, cheer) }
  return { x: hop > 0 ? SEAT_X + (PIVOT - SEAT_X) * (1 - hop) : w.x, y: GROUND + (seatY - GROUND) * hop, lift: 9 * arc, pose }
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)
  const kid = kidAt(t)
  const turn = turnAround(t, TURN_A, 'left', 'right', 0.5)
  const facing = t < TURN_A ? walk(t, WALK).facing : turn.facing
  const place = { ...kid, build: 'child', height: KID_H, facing, squash: t < TURN_A ? undefined : turn.squash } as const
  const rig = personRig(place)
  const head = rig.world.head
  const headR = rig.body.headR * rig.scale
  const face = t < TURN_B ? 'worried' : t < HOP_A ? 'surprised' : t < CHEER_A ? 'smile' : 'joy'
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Beach t={t} />
        <Wall t={t} />
        <Footprints t={t} />
        <Person {...place} look={KID_LOOK} face={face} shadow={t < HOP_A} />
        {/* あるきつかれた あせ(うしろ=右 へ とぶ)・「ふう」・あしあとを 見つけた「!」 */}
        <Sweat t={t} x={head[0] + headR} y={head[1] - 4} show={during(t, WALK_FROM + 0.3, ARRIVE, 0.2)} dir={1} />
        <Sigh x={head[0] - headR} y={head[1] + headR * 0.5} p={span(t, ARRIVE, TURN_A + 0.2, easeOut)} show={during(t, ARRIVE, TURN_A + 0.2, 0.15)} dir={-1} />
        <Notice x={head[0]} y={head[1]} r={headR} dir={1} show={during(t, TURN_B, HOP_A + 0.1, 0.12)} />
        <Bird x={-10 + t * 12.5} y={13 + wave(t, 3.2) * 2.5} t={t} flying facing="right" color="#cfd9e6" dark="#7e93ad" />
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
    { at: 0, label: 'はまべと 石の かべが できる', sound: 'pop' },
    { at: WALK_FROM, label: 'つかれた子が あるいてくる。あしあとが のこる' },
    { at: ARRIVE, label: 'かべの 前で「ふう」' },
    { at: TURN_A, label: 'くるっと ふりかえる' },
    { at: TURN_B, label: 'ずっと つづく あしあとに びっくり' },
    { at: HOP_A, label: 'ぴょん と かべに こしかける', sound: 'pop' },
    { at: HOP_B, label: 'ひざ を ぶらぶら。ひざの 下に あしあと' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '足 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
