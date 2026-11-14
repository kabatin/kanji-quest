/*
 * 出(でる): あなに おちた子が はしごで のぼって、あしを そとへ ふみ出す。(共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)
 *   2・3画目(ㄩ上)  … あなの ふち に近い 左右の かべ(左の かべ と 右の かべ)
 *   4・5画目(ㄩ下)  … あなの 下のほうの 左右の かべ と、そこ(ゆか)
 *   1画目(丨)       … あなの まんなかを 通る たて線(ここは 子が はしごを のぼっていく あたり)
 *   字と 絵は だいたい 同じ場所に そろえた(ぴったりは 重ねない。体を ゆがめないほうを えらんだ)
 *
 * ながれ
 *   ちょうちょ を 見あげて あるく子 → あなに きづかず あしを ふみ出して おちる(わー!)
 *   → どすん。くらい あなの そこで しくしく
 *   → 上を見る。ひかりと はしご を 見つけて「あっ!」
 *   → はしごを 1だん ずつ のぼる → あなの ふちに とどいて、あしを そとへ ふみ出す
 *   → そとへ でて、りょうてを あげて ばんざい → ほね が ひかって、絵が うすくなり 字「出」が のこる
 *
 * 子どもは Person(あるく ところは walk)。はしごの ぼうでは、手足を 1だん ずつの 点に { to } で のせる。
 * こし の 高さは、両足が とどく ところに 部品の 足の ながさ から きめる(足が のびたり ちぢんだり しない)。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, Butterfly, CLOTHES, Dust, LOOKS, Notice, PALETTE, Person, personRig, posture, walk, type PersonPose } from '../sceneFigures'

const CHAR = '出'

const GRASS = PALETTE.grass
const LEAF = PALETTE.leaf
const LEAF_DARK = '#3f9c59'
const DIRT = '#b98a5e'
const DIRT_DARK = '#9d7149'
const DIRT_LIGHT = '#cfa476'
const PIT = '#6c4f3b'
const PIT_FLOOR = '#7f5f46'
const WOOD = '#d79a55'
const WOOD_DARK = '#a8703a'

/** くぎり の時間(秒) */
const WALK = 0.4
const FALL = 1.45
const LAND = 2.0
const NOTICE = 2.9
const TO_LADDER = 3.4
const CLIMB = 4.2
const STEP = 6.6
const CHEER = 7.3
const INK = 8.0
const DONE = 10.5
const DURATION = 11.1

/** 地面の たかさ(おもて)と、あなの かべ・そこ */
const SURFACE = 40
const PIT_LEFT = 28
const PIT_RIGHT = 85
const FLOOR = 90.3

type Pt = readonly [number, number]
const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1)

/* ───────── 子ども ───────── */

const HEIGHT = 34
const BOY_LOOK = { ...LOOKS.boy, top: CLOTHES.red.top, bottom: '#4c6fa8', hair: '#4a3022' } as const
/** こし から 地面 まで(まっすぐ 立った ときの 足の ながさ)。こし の 高さ から 立ち位置 y を 出すのに使う */
const LEG_LEN = -personRig({ x: 0, y: 0, build: 'child', height: HEIGHT }).world.pelvis[1]
const LEG_REACH = LEG_LEN * 0.96

type Mood = 'joy' | 'smile' | 'surprised' | 'strain' | 'sad' | 'normal' | 'cry'

type Stance = {
  readonly x: number
  readonly y: number
  readonly pose: PersonPose
  readonly face: Mood
}

/** こし の x と 足先 2つ から、足が ちゃんと とどく こしの 高さ。y は その 立ち位置 */
function standingOn(hipX: number, nearFoot: Pt, farFoot: Pt): number {
  const top = Math.min(...[nearFoot, farFoot].map(([x, y]) => y - Math.sqrt(Math.max(0, LEG_REACH ** 2 - (x - hipX) ** 2))))
  return top + LEG_LEN
}

/* はしご: すこし かたむけて、右の かべに もたせかける */
const LADDER_BOTTOM: Pt = [66, FLOOR]
const LADDER_TOP: Pt = [83, 36]
const ladderX = (y: number) => LADDER_BOTTOM[0] + ((LADDER_BOTTOM[1] - y) / (LADDER_BOTTOM[1] - LADDER_TOP[1])) * (LADDER_TOP[0] - LADDER_BOTTOM[0])
/** 1だん の たかさ(だん 0 の 1つ下が ゆか) */
const RUNG_GAP = 6
const rungY = (r: number) => FLOOR - RUNG_GAP * (r + 1)
const Q_END = 7

/** 手足が 1だん ずつ のぼる(2だん ぶん うごいて、もう片方を おいこす)。off で かわりばんこに。 */
function limbRung(q: number, off: number): number {
  const u = q - off
  const m = Math.floor(u / 2)
  return 2 * m + 2 * easeInOut(clamp01(u - 2 * m))
}
const limbLift = (q: number, off: number): number => {
  const u = q - off
  const f = u - 2 * Math.floor(u / 2)
  return f > 0 && f < 1 ? Math.sin(f * Math.PI) * 1.8 : 0
}
/** はしごの上の 手足の ばしょ(rung は だんの番号。ゆか = -1) */
const footOn = (rung: number, far: boolean, lift: number): Pt => {
  const y = rungY(Math.max(rung, -1)) + 1.6
  return [ladderX(y) - 0.4 + (far ? 1.4 : 0), y - lift]
}
const handOn = (rung: number, far: boolean, lift: number): Pt => {
  const y = rungY(Math.min(rung, 8)) - 0.5
  return [ladderX(y) + 0.4 + (far ? 1.2 : 0), y - lift]
}

/** はしごを のぼる かっこう(q が 1 ふえる ごとに 1だん)。右むき。てまえ = 左の 手足 */
function climbStance(q: number): Stance {
  const nearFoot = footOn(Math.max(limbRung(q, 0) - 1, -1), false, limbLift(q, 0))
  const farFoot = footOn(Math.max(limbRung(q, 1), -1), true, limbLift(q, 1))
  const hipX = ladderX((nearFoot[1] + farFoot[1]) / 2 - LEG_LEN) - 8
  return {
    x: hipX,
    y: standingOn(hipX, nearFoot, farFoot),
    pose: {
      leftLeg: { to: nearFoot },
      rightLeg: { to: farFoot },
      leftArm: { to: handOn(limbRung(q, 1) + 3.2, false, limbLift(q, 1)) },
      rightArm: { to: handOn(limbRung(q, 0) + 2.2, true, limbLift(q, 0)) },
      torso: 7,
      head: -14,
    },
    face: 'strain',
  }
}

/* そとへ ふみ出して、ばんざい */
const OUT_X = 92
const OUT_NEAR: Pt = [OUT_X + 2.6, SURFACE]
const OUT_FAR: Pt = [OUT_X - 2.2, SURFACE]
const BANZAI = { leftArm: { swing: 165, bend: 10 }, rightArm: { swing: 160, bend: 14 } }

function stepStance(s: number): Stance {
  const from = climbStance(Q_END)
  const nearK = span(s, 0, 0.5, easeInOut)
  const farK = span(s, 0.42, 0.92, easeInOut)
  const hipK = easeInOut(span(s, 0.05, 0.95))
  const lift = (a: number, b: number) => Math.sin(span(s, a, b) * Math.PI) * 4
  const nearFoot = lerpPt(footOn(Math.max(limbRung(Q_END, 0) - 1, -1), false, 0), OUT_NEAR, nearK)
  const farFoot = lerpPt(footOn(Math.max(limbRung(Q_END, 1), -1), true, 0), OUT_FAR, farK)
  const hipX = mix(hipK, 0, 1, from.x, OUT_X)
  const release = span(s, 0.5, 1, easeInOut)
  const near: Pt = [nearFoot[0], nearFoot[1] - lift(0, 0.5)]
  const far: Pt = [farFoot[0], farFoot[1] - lift(0.42, 0.92)]
  const handsHold = from.pose
  return {
    x: hipX,
    y: standingOn(hipX, near, far),
    pose: {
      leftLeg: { to: near },
      rightLeg: { to: far },
      leftArm: release > 0 ? BANZAI.leftArm : handsHold.leftArm,
      rightArm: release > 0 ? BANZAI.rightArm : handsHold.rightArm,
      torso: mix(s, 0, 1, 7, -3, easeInOut),
      head: mix(s, 0, 1, -14, -4),
    },
    face: s > 0.45 ? 'smile' : 'strain',
  }
}

function cheerStance(t: number): Stance {
  const hop = Math.max(0, Math.sin(((t - CHEER) / 0.55) * Math.PI * 2)) * 2.6
  return {
    x: OUT_X,
    y: SURFACE - hop,
    pose: { ...posture('banzai', 'right'), torso: -3, head: -4 },
    face: 'joy',
  }
}

/** いまの 子の かっこう(とき ごと) */
function stanceAt(t: number): Stance & { readonly facing: 'right' } {
  const done = <T extends Stance>(s: T) => ({ ...s, facing: 'right' as const })
  if (t < FALL) {
    const w = walk(t, { from: -9, to: 24, start: WALK, end: FALL, build: 'child', height: HEIGHT, armSwing: 24 })
    return done({ x: w.x, y: SURFACE, pose: { ...w.pose, head: -8 + wave(t, 1.1) * 3 }, face: 'smile' })
  }
  if (t < LAND) {
    // あなの上へ ふみ出して、おちる。よこへ すこし とんで、はしの かべに ぶつからない
    const f = span(t, FALL, LAND)
    const flap = wave(t, 0.18)
    const pose: PersonPose = {
      leftArm: { swing: 165 + flap * 10, bend: 10 },
      rightArm: { swing: 155 - flap * 10, bend: 12 },
      leftLeg: { swing: 12 + flap * 6, bend: 8 },
      rightLeg: { swing: -10 - flap * 6, bend: 12 },
      head: -8,
    }
    return done({ x: 24 + 17 * easeOut(f), y: SURFACE + (FLOOR - SURFACE) * easeIn(f), pose, face: 'surprised' })
  }
  if (t < NOTICE) {
    // どすん。ひざで うけとめ、いたそうな顔 → しくしく
    const dip = Math.sin(span(t, LAND, LAND + 0.35) * Math.PI)
    const pose: PersonPose = { leftLeg: { swing: 20 * dip, bend: 40 * dip }, rightLeg: { swing: 14 * dip, bend: 36 * dip }, torso: 4 + 6 * dip, head: mix(t, LAND, LAND + 0.5, 0, 15), leftArm: { swing: 6, bend: 10 }, rightArm: { swing: 2, bend: 8 } }
    return done({ x: 41, y: FLOOR, pose, face: t < LAND + 0.45 ? 'strain' : 'cry' })
  }
  if (t < TO_LADDER) {
    // 上を見る。ひかりと はしご に きづく
    const pose: PersonPose = { torso: 2, head: mix(t, NOTICE, NOTICE + 0.3, 15, -24, backOut), leftArm: { swing: 4, bend: 10 }, rightArm: { swing: 2, bend: 8 } }
    return done({ x: 41, y: FLOOR, pose, face: 'surprised' })
  }
  if (t < CLIMB) {
    const w = walk(t, { from: 41, to: climbStance(-1).x, start: TO_LADDER, end: CLIMB, build: 'child', height: HEIGHT })
    return done({ x: w.x, y: FLOOR, pose: { ...w.pose, head: -8 }, face: 'normal' })
  }
  if (t < STEP) return done(climbStance(mix(t, CLIMB, STEP, -1, Q_END, (x) => x)))
  if (t < CHEER) return done(stepStance(span(t, STEP, CHEER)))
  return done(cheerStance(t))
}

/* ───────── けしき ───────── */

/** あなと じめん(よこから 見た だんめん) */
function Ground({ t }: SceneProps) {
  const open = span(t, 0.05, 0.6, easeOut)
  const pitPath = `M${PIT_LEFT} ${SURFACE} L${PIT_LEFT} 86 Q${PIT_LEFT} ${FLOOR + 1.2} ${PIT_LEFT + 5} ${FLOOR + 1.2} L${PIT_RIGHT - 5} ${FLOOR + 1.2} Q${PIT_RIGHT} ${FLOOR + 1.2} ${PIT_RIGHT} 86 L${PIT_RIGHT} ${SURFACE} Z`
  // ひかりが あなの なかへ さしこむ(上を見たとき すこし つよく)
  const beam = 0.13 + 0.12 * during(t, NOTICE - 0.1, TO_LADDER + 0.5, 0.3)
  return (
    <>
      <rect x="-2" y={SURFACE} width="113" height={101 - SURFACE} fill={DIRT} />
      {[[8, 56], [16, 72], [6, 86], [98, 58], [102, 74], [94, 88], [20, 94]].map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="2.2" ry="1.4" fill={DIRT_DARK} />
      ))}
      <ellipse cx="104" cy="66" rx="1.6" ry="1" fill={DIRT_LIGHT} />
      <ellipse cx="12" cy="64" rx="1.6" ry="1" fill={DIRT_LIGHT} />
      <g opacity={open}>
        <path d={pitPath} fill={PIT} />
        <path d={`M${PIT_LEFT + 4} ${FLOOR - 0.6} L${PIT_RIGHT - 4} ${FLOOR - 0.6}`} stroke={PIT_FLOOR} strokeWidth="2.4" strokeLinecap="round" />
        <path d={`M50 ${SURFACE} L${PIT_RIGHT} ${SURFACE} L${PIT_RIGHT} 70 L62 ${FLOOR} L40 ${FLOOR} Z`} fill="#ffe9a8" opacity={beam} />
        <path d={`M${PIT_LEFT} ${SURFACE} L${PIT_LEFT} 86`} stroke={DIRT_DARK} strokeWidth="1.2" />
      </g>
      {/* おもての くさ(あなの ふち は まるく) */}
      <path d={`M-2 ${SURFACE - 0.4} H${PIT_LEFT + 0.6} Q${PIT_LEFT + 1.6} ${SURFACE + 0.6} ${PIT_LEFT - 0.6} ${SURFACE + 4.2} H-2 Z`} fill={GRASS} />
      <path d={`M${PIT_RIGHT - 0.6} ${SURFACE - 0.4} H111 V${SURFACE + 4.2} H${PIT_RIGHT + 0.6} Q${PIT_RIGHT - 1.6} ${SURFACE + 0.6} ${PIT_RIGHT - 0.6} ${SURFACE - 0.4} Z`} fill={GRASS} />
      {[4, 14, 21, 92, 100, 106].map((x) => (
        <path key={x} d={`M${x} ${SURFACE + 0.4} l1.1 -3 l0.9 2.6 l1.4 -3.4 l0.7 3.8 Z`} fill={LEAF} />
      ))}
      <path d={`M-2 ${SURFACE + 3.2} H${PIT_LEFT} V${SURFACE + 4.4} H-2 Z M${PIT_RIGHT} ${SURFACE + 3.2} H111 V${SURFACE + 4.4} H${PIT_RIGHT} Z`} fill={LEAF_DARK} opacity="0.5" />
    </>
  )
}

function Ladder({ t }: SceneProps) {
  const show = span(t, 0.5, 1.0, backOut)
  const depth: Pt = [2.4, -1.2]
  const rungs = Array.from({ length: 9 }, (_, i) => i - 1)
  return (
    <Layer opacity={clamp01(show)}>
      <path d={`M${LADDER_BOTTOM[0] + depth[0]} ${LADDER_BOTTOM[1] + depth[1]} L${LADDER_TOP[0] + depth[0]} ${LADDER_TOP[1] + depth[1]}`} stroke={WOOD_DARK} strokeWidth="1.8" strokeLinecap="round" />
      {rungs.map((r) => {
        const y = rungY(r) + 1.4
        return <path key={r} d={`M${ladderX(y)} ${y} L${ladderX(y) + depth[0]} ${y + depth[1]}`} stroke={WOOD_DARK} strokeWidth="1.6" strokeLinecap="round" />
      })}
      <path d={`M${LADDER_BOTTOM[0]} ${LADDER_BOTTOM[1]} L${LADDER_TOP[0]} ${LADDER_TOP[1]}`} stroke={WOOD} strokeWidth="2" strokeLinecap="round" />
      {/* ふいたとき ひかる */}
      <Layer opacity={during(t, NOTICE + 0.2, TO_LADDER + 0.4, 0.15)}>
        <Star cx={74.5} cy={64} r={3.2 + wave(t, 0.5) * 0.6} color="#fff3b0" spin={t * 60} />
      </Layer>
    </Layer>
  )
}

/** おちた とき の つち(かべ から ぱらぱら) と、くるくる まわる ほし。 */
function Crash({ t, head }: SceneProps & { readonly head: Pt }) {
  const crumbs = span(t, FALL + 0.1, LAND + 0.2)
  const stars = during(t, LAND + 0.05, LAND + 0.75, 0.15)
  return (
    <>
      {crumbs > 0 && crumbs < 1 && (
        <g fill={DIRT_DARK} opacity={1 - crumbs * 0.6}>
          {[0, 1, 2].map((i) => (
            <rect key={i} x={PIT_LEFT + 2 + i * 2.4} y={SURFACE + 2 + crumbs * (30 + i * 12)} width="1.6" height="1.6" rx="0.6" />
          ))}
        </g>
      )}
      {stars > 0 && (
        <g opacity={stars}>
          {[0, 1, 2].map((i) => {
            const a = t * 6 + (i * Math.PI * 2) / 3
            return <Star key={i} cx={head[0] + Math.cos(a) * 7} cy={head[1] - 8 + Math.sin(a) * 2} r={2} color="#ffd24a" spin={t * 100} />
          })}
        </g>
      )}
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)
  const boy = stanceAt(t)
  const { face, ...place } = boy
  const head = personRig({ ...place, build: 'child', height: HEIGHT }).world.head
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const enter = span(t, WALK - 0.05, WALK + 0.1)
  // ちょうちょ。ふわふわ とんで、子の 目を ひく
  const flutter: Pt = [45 + Math.sin(t * 0.9) * 7 + 5 * span(t, FALL, LAND + 0.5, easeOut), 9.5 + Math.sin(t * 1.7) * 2.2]
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[72, 12]} ground={46} tufts={[]} />
        <Ground t={t} />
        <Ladder t={t} />
        <Layer opacity={span(t, 0.15, 0.5)}>
          <Butterfly x={flutter[0]} y={flutter[1]} t={t} />
        </Layer>
        <Layer opacity={enter}>
          <Person {...place} build="child" height={HEIGHT} look={BOY_LOOK} face={face} />
        </Layer>
        <Dust x={41} y={FLOOR - 1} p={span(t, LAND, LAND + 0.7, easeOut)} reach={9} />
        <Notice x={head[0] + 7} y={head[1] - 11} r={3} show={during(t, NOTICE, TO_LADDER, 0.15)} dir={1} />
      </Layer>
      <Crash t={t} head={head} />
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
    { at: 0, label: 'ちょうちょ を 見あげて、子が あるいてくる', sound: 'pop' },
    { at: FALL, label: 'あなに あしを ふみ出して おちる', sound: 'pop' },
    { at: LAND, label: 'どすん。あなの そこで しくしく' },
    { at: NOTICE, label: '上を見て、はしごに「あっ!」' },
    { at: CLIMB, label: 'はしごを 1だん ずつ のぼる' },
    { at: STEP, label: 'あしを そとへ ふみ出して でる', sound: 'pop' },
    { at: CHEER, label: 'やった! ばんざい' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '出 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
