/*
 * 来(くる): むぎが てんから やって 来る。
 *
 * ほね(画と絵の対応)
 *   1画目(一)    … むぎの 上の ほう の よこに のびた くき(左右の うでの くき)
 *   2・3画目     … その くき の先に、おもくて うなだれた 左右の ほ(むぎの み)
 *   4画目(一)    … まんなかの ふしから 左右に ひらいた 2まいの は
 *   5画目(丨)    … むぎの くき(まんなか の はしら)
 *   6・7画目     … 下の ふしから 左右へ たれた 2まいの は
 *
 * ながれ
 *   はたけで おなかを すかせた 子が しょんぼり(おなかが ぐう)
 *   → そらから ひかる たね が ふってくる。子は 「あっ」と みあげる
 *   → たね が つちに もぐり、めが のびて は が ひらき、ほ が ふくらんで みのる
 *   → 子が とびはねて よろこぶ → ほね が ひかって、むぎの 絵が 字「来」になる
 *
 * 子は 共通部品 Person(あるいて きて、正面を むく)。
 *   むぎは、くき に ふし が あり、は は ふし から ひらき、ほ は おもくて うなだれる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { CLOTHES, Clouds, Hills, LOOKS, mixLimb, Notice, PALETTE, Person, Sun, turnAround, walk, type Expression, type Limb, type LimbAngles } from '../sceneFigures'

const CHAR = '来'

const SOIL = '#d8b88a'
const SOIL_DARK = '#c29a68'
const MOUND = '#b88a5c'
const STALK_GREEN = '#7fbf4d'
const STALK_GOLD = '#d9b44a'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const EAR_GREEN = '#a9c95a'
const EAR_GOLD = '#f1c14d'
const EAR_GOLD_DARK = '#c99a2e'
const SEED = PALETTE.sun

/** くぎり の時間(秒) */
const WALK_IN = 1.1
const LOOK_UP = 1.4
const FALL_FROM = 1.7
const LAND = 3.1
const SPROUT = 3.5
const CHEER = 5.6
const INK = 6.8
const DONE = 9.9
const DURATION = 10.5

/** 子の 足もと(ここを じく に ならべる) と、むぎの たね が おちる所 */
const KID_X = 21
const GROUND_Y = 97
const SEED_X = 53.8

const lerpHex = (a: string, b: string, k: number): string => {
  const mixAt = (i: number) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - k) + parseInt(b.slice(i, i + 2), 16) * k)
  return `#${[1, 3, 5].map((i) => mixAt(i).toString(16).padStart(2, '0')).join('')}`
}

/* ───────── ばしょ ───────── */

function Ground({ t }: SceneProps) {
  return (
    <>
      <Sun t={t} />
      <Hills />
      <Clouds t={t} at={[[76, 14, 0.9], [92, 26, 0.8]]} speed={1.4} />
      {/* はたけ: たがやした つち。まだ なにも はえていない */}
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={SOIL} />
      {[10, 30, 78, 98].map((x) => (
        <path key={x} d={`M${x} 98 q4 -1.4 8 0`} fill="none" stroke={SOIL_DARK} strokeWidth="1.1" strokeLinecap="round" />
      ))}
    </>
  )
}

/** 天からの ひかり。たね が ふってくる あいだ、そら から ふわっと さす */
function Sunbeam({ t }: SceneProps) {
  const show = during(t, FALL_FROM - 0.3, SPROUT + 0.7, 0.4)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      <path d="M44 -2 L64 -2 L72 95 L36 95 Z" fill="#fff3b0" opacity="0.16" />
      <path d="M49 -2 L59 -2 L63 95 L45 95 Z" fill="#fff3b0" opacity="0.2" />
    </g>
  )
}

/* ───────── たね ───────── */

function FallingSeed({ t }: SceneProps) {
  const p = span(t, FALL_FROM, LAND, easeInOut)
  if (p <= 0) return null
  const sink = span(t, LAND, LAND + 0.3)
  if (sink >= 1) return null
  const sway = Math.sin(p * 7) * 2.6 * (1 - p)
  const x = SEED_X + sway
  const y = -4 + p * 98 + sink * 2.5
  const glow = 0.45 + 0.2 * wave(t, 0.5)
  return (
    <>
      {[1, 2, 3].map((i) => {
        const q = Math.max(0, p - i * 0.045)
        return <circle key={i} cx={SEED_X + Math.sin(q * 7) * 2.6 * (1 - q)} cy={-4 + q * 98 - 1} r={1.6 - i * 0.3} fill="#fff3b0" opacity={(0.7 - i * 0.18) * (1 - sink)} />
      })}
      <g opacity={1 - sink}>
        <circle cx={x} cy={y} r="5.6" fill="#fff3b0" opacity={glow} />
        <Layer x={x} y={y} rotate={-20 + p * 90}>
          <ellipse cx="0" cy="0" rx="2" ry="3.4" fill={SEED} />
          <path d="M0 -3 V3" stroke={EAR_GOLD_DARK} strokeWidth="0.5" strokeLinecap="round" />
        </Layer>
      </g>
      <Star cx={x + 5.5} cy={y - 4} r={1.8 + wave(t, 0.4)} color="#ffffff" spin={t * 90} />
    </>
  )
}

/** たね が つちに おちた しゅんかん: つちが もりあがり、つぶが ちる */
function Landing({ t }: SceneProps) {
  const rise = span(t, LAND, LAND + 0.4, backOut)
  if (rise <= 0) return null
  const puff = span(t, LAND, LAND + 0.7, easeOut)
  return (
    <>
      <ellipse cx={SEED_X} cy="95.6" rx={5.8 * rise} ry={2.5 * rise} fill={MOUND} />
      {puff < 1 &&
        [-1, 1].flatMap((s) =>
          [0, 1].map((k) => (
            <circle key={`${s}${k}`} cx={SEED_X + s * (3 + puff * (7 + k * 4))} cy={94.4 - Math.sin(puff * Math.PI) * (4 + k * 2)} r={1.3 - puff * 0.7} fill={SOIL_DARK} opacity={1 - puff} />
          )),
        )}
    </>
  )
}

/* ───────── むぎ ───────── */

/** ほ(むぎの み)。もと(0,0)から 上へ。つぶが 2れつ ならび、先に のぎ が のびる */
function Ear({ len, half, color, dark }: { readonly len: number; readonly half: number; readonly color: string; readonly dark: string }) {
  const rows = 5
  const step = len / rows
  return (
    <>
      <path d={`M0 ${-len - 1} V${-len - 5} M${-half * 0.5} ${-len} L${-half * 1.1} ${-len - 4.5} M${half * 0.5} ${-len} L${half * 1.1} ${-len - 4.5}`} fill="none" stroke={dark} strokeWidth="0.55" strokeLinecap="round" />
      <ellipse cx="0" cy={-len / 2} rx={half * 0.55} ry={len / 2} fill={color} />
      {Array.from({ length: rows }, (_, i) => {
        const y = -(i + 0.7) * step
        return (
          <g key={i}>
            <ellipse cx={-half * 0.55} cy={y} rx={half * 0.55} ry={step * 0.62} fill={i % 2 === 0 ? color : dark} transform={`rotate(-24 ${-half * 0.55} ${y})`} />
            <ellipse cx={half * 0.55} cy={y} rx={half * 0.55} ry={step * 0.62} fill={i % 2 === 0 ? dark : color} transform={`rotate(24 ${half * 0.55} ${y})`} />
          </g>
        )
      })}
    </>
  )
}

/** もと から 先へ とがる は。arch は ふくらみ(右むきは + で上、左むきは − で上) */
function Blade({ base, tip, arch, width, color, grow }: { readonly base: readonly [number, number]; readonly tip: readonly [number, number]; readonly arch: number; readonly width: number; readonly color: string; readonly grow: number }) {
  const dx = tip[0] - base[0]
  const dy = tip[1] - base[1]
  const len = Math.hypot(dx, dy)
  const n: readonly [number, number] = [dy / len, -dx / len]
  const c: readonly [number, number] = [(base[0] + tip[0]) / 2 + n[0] * arch, (base[1] + tip[1]) / 2 + n[1] * arch]
  const half = width / 2
  const f = (v: number) => v.toFixed(2)
  const d = `M${f(base[0] + n[0] * half)} ${f(base[1] + n[1] * half)} Q${f(c[0] + n[0] * half * 0.7)} ${f(c[1] + n[1] * half * 0.7)} ${f(tip[0])} ${f(tip[1])} Q${f(c[0] - n[0] * half * 0.7)} ${f(c[1] - n[1] * half * 0.7)} ${f(base[0] - n[0] * half)} ${f(base[1] - n[1] * half)} Z`
  return (
    <Layer scale={grow} origin={base}>
      <path d={d} fill={color} />
      <path d={`M${f(base[0])} ${f(base[1])} Q${f(c[0])} ${f(c[1])} ${f(tip[0])} ${f(tip[1])}`} fill="none" stroke={LEAF_DARK} strokeWidth="0.55" strokeLinecap="round" opacity="0.6" />
    </Layer>
  )
}

/** 下へ うなだれる ほ。もと から 先 へむかって ぶらさがる */
function HangingEar({ base, tip, scale, color, dark }: { readonly base: readonly [number, number]; readonly tip: readonly [number, number]; readonly scale: number; readonly color: string; readonly dark: string }) {
  const dx = tip[0] - base[0]
  const dy = tip[1] - base[1]
  const len = Math.hypot(dx, dy)
  const angle = (Math.atan2(dx, -dy) * 180) / Math.PI
  return (
    <Layer x={base[0]} y={base[1]} rotate={angle} scale={scale}>
      <Ear len={len - 4} half={3.2} color={color} dark={dark} />
    </Layer>
  )
}

function Wheat({ t }: SceneProps) {
  const stalk = span(t, SPROUT, SPROUT + 1.3, easeOut)
  if (stalk <= 0) return null
  const leaves = span(t, SPROUT + 0.9, SPROUT + 1.9, backOut)
  const low = span(t, SPROUT + 1.2, SPROUT + 2.1, backOut)
  const arms = span(t, SPROUT + 1.5, SPROUT + 2.3, easeOut)
  const ears = span(t, SPROUT + 1.9, SPROUT + 2.7, backOut)
  const ripe = span(t, SPROUT + 2.3, SPROUT + 3.0)
  const stalkColor = lerpHex(STALK_GREEN, STALK_GOLD, ripe * 0.6)
  const earColor = lerpHex(EAR_GREEN, EAR_GOLD, ripe)
  const earDark = lerpHex('#86a844', EAR_GOLD_DARK, ripe)
  const sway = wave(t, 2.6) * 1.2 * ears
  return (
    <Layer rotate={sway} origin={[SEED_X, 97]}>
      {/* 下の は(6・7画目): 下の ふし から 左右へ たれる */}
      <Blade base={[50.2, 58]} tip={[15.8, 90.5]} arch={-3.5} width={4.6} color={LEAF_DARK} grow={low} />
      <Blade base={[55.4, 58]} tip={[94.7, 87.8]} arch={3.5} width={4.6} color={LEAF_DARK} grow={low} />
      {/* まんなかの は(4画目): ふしから 左右に ひらく */}
      <Blade base={[53.2, 56]} tip={[16.6, 57]} arch={-5} width={4.6} color={LEAF} grow={leaves} />
      <Blade base={[54.4, 56]} tip={[91.6, 53.8]} arch={5} width={4.6} color={LEAF} grow={leaves} />
      {/* くき(5画目): 下から のびる */}
      <Bone char={CHAR} n={5} color={stalkColor} width={3.4} from={1 - stalk} to={1} />
      {/* 左右の うでの くき(1画目) */}
      <Bone char={CHAR} n={1} color={stalkColor} width={2.4} from={0.5 - 0.42 * arms} to={0.5} />
      <Bone char={CHAR} n={1} color={stalkColor} width={2.4} from={0.5} to={0.5 + 0.38 * arms} />
      {/* うなだれた 左右の ほ(2・3画目) */}
      <HangingEar base={[30.6, 29]} tip={[38, 48.7]} scale={ears} color={earColor} dark={earDark} />
      <HangingEar base={[74.6, 28.5]} tip={[64.9, 46.6]} scale={ears} color={earColor} dark={earDark} />
      {/* てっぺんの ほ */}
      <Layer x={53.4} y={26} scale={ears}>
        <Ear len={17} half={3.8} color={earColor} dark={earDark} />
      </Layer>
    </Layer>
  )
}

/** みのった しゅんかんの ひかり */
function RipeGlints({ t }: SceneProps) {
  const p = span(t, SPROUT + 2.6, INK + 0.2)
  if (p <= 0 || p >= 1) return null
  const spots: readonly (readonly [number, number])[] = [[53.4, 6], [33, 40], [71, 38], [46, 20], [62, 18]]
  return (
    <g opacity={Math.sin(p * Math.PI)}>
      {spots.map(([x, y], i) => (
        <Star key={i} cx={x + (i % 2 === 0 ? -4 : 4)} cy={y} r={2.2 + (i % 3) * 0.5} color={i % 2 === 0 ? '#ffffff' : '#ffd95a'} spin={p * 160 + i * 30} />
      ))}
    </g>
  )
}

/* ───────── 子 ───────── */

type Mood = 'sad' | 'wow' | 'smile' | 'happy'

const FACES: Record<Mood, Expression> = { sad: 'sad', wow: 'surprised', smile: 'smile', happy: 'joy' }
const KID_HEIGHT = 40
/** おなかを おさえる 手の ばしょ(画面の 点)と まえへの きょり */
const BELLY_Y = 79
const BELLY_DEPTH = 7
const BELLY_LEFT: Limb = { to: [KID_X + 2.5, BELLY_Y], depth: BELLY_DEPTH }
const BELLY_RIGHT: Limb = { to: [KID_X - 2.5, BELLY_Y], depth: BELLY_DEPTH }
const SKY_ARM: LimbAngles = { swing: 125, bend: 22 }
const OPEN_ARM: LimbAngles = { swing: 45, bend: 18 }
const UP_ARM: LimbAngles = { swing: 150, bend: 14 }

/** くぎり ごとの ポーズを、なめらかに つなぐ */
function armAt(t: number, keys: readonly { readonly at: number; readonly pose: Limb }[]): Limb {
  const i = keys.findIndex((key) => key.at > t)
  if (i < 0) return keys[keys.length - 1].pose
  if (i === 0) return keys[0].pose
  return mixLimb(keys[i - 1].pose, keys[i].pose, span(t, keys[i - 1].at, keys[i].at, easeInOut))
}

/** おなかが「ぐう」。体の よこに ゆれる すじ */
function Growl({ t }: SceneProps) {
  const show = during(t, 0.5 + 0.7, LOOK_UP + 0.1, 0.2)
  if (show <= 0) return null
  const pulse = 0.5 + 0.5 * wave(t, 0.45)
  return (
    <g opacity={show * (0.4 + 0.6 * pulse)} fill="none" stroke="#8a7a68" strokeWidth="0.9" strokeLinecap="round" transform={`translate(${KID_X} ${GROUND_Y})`}>
      {[-1, 1].map((s) => (
        <path key={s} d={`M${s * 11.4} -20 q${s * 1.8} 1.4 0 2.8 q${-s * 1.8} 1.4 0 2.8`} />
      ))}
    </g>
  )
}

/** 主役の 子。あるいてきて、おなかを おさえ → 天を さす → おどろく → ばんざい */
function Kid({ t }: SceneProps) {
  const w = walk(t, { from: -14, to: KID_X, start: 0.15, end: WALK_IN, build: 'child', height: KID_HEIGHT, armSwing: 10 })
  const turn = turnAround(t, WALK_IN, 'right', 'front')
  const cheering = t >= CHEER
  const hop = cheering ? Math.abs(Math.sin((t - CHEER) * Math.PI * 2 * 1.1)) * 3.4 : 0
  const mood: Mood = t < LOOK_UP ? 'sad' : t < SPROUT ? 'wow' : t < CHEER ? 'smile' : 'happy'
  const up = span(t, LOOK_UP, LOOK_UP + 0.25) * (1 - span(t, LAND, LAND + 0.4)) + 0.4 * span(t, SPROUT + 1.0, SPROUT + 1.6) * (1 - span(t, CHEER - 0.2, CHEER))
  const wiggle = cheering ? wave(t, 0.5) * 9 : 0
  const left = armAt(t, [
    { at: WALK_IN, pose: w.pose.leftArm ?? { swing: 4, bend: 8 } },
    { at: WALK_IN + 0.3, pose: BELLY_LEFT },
    { at: LOOK_UP, pose: BELLY_LEFT },
    { at: LOOK_UP + 0.4, pose: SKY_ARM },
    { at: LAND, pose: SKY_ARM },
    { at: LAND + 0.5, pose: OPEN_ARM },
    { at: CHEER - 0.2, pose: OPEN_ARM },
    { at: CHEER + 0.2, pose: UP_ARM },
  ])
  const right = armAt(t, [
    { at: WALK_IN, pose: w.pose.rightArm ?? { swing: 4, bend: 8 } },
    { at: WALK_IN + 0.3, pose: BELLY_RIGHT },
    { at: LAND, pose: BELLY_RIGHT },
    { at: LAND + 0.5, pose: OPEN_ARM },
    { at: CHEER - 0.2, pose: OPEN_ARM },
    { at: CHEER + 0.2, pose: UP_ARM },
  ])
  const wiggled = (arm: Limb, k: number): Limb => (t >= CHEER + 0.2 ? { ...UP_ARM, swing: UP_ARM.swing + wiggle * k } : arm)
  const pose = t < WALK_IN ? w.pose : { leftArm: wiggled(left, 1), rightArm: wiggled(right, -1) }
  return <Person {...w} {...turn} y={GROUND_Y} build="child" height={KID_HEIGHT} look={{ ...LOOKS.boy, top: CLOTHES.orange.top, bottom: CLOTHES.orange.bottom }} face={FACES[mood]} gazeY={-up} lift={hop} pose={pose} />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)
  const kidX = mix(t, 0.15, WALK_IN, -14, KID_X, easeOut)
  const hop = t >= CHEER ? Math.abs(Math.sin((t - CHEER) * Math.PI * 2 * 1.1)) * 3.4 : 0
  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Sunbeam t={t} />
        <Wheat t={t} />
        <Landing t={t} />
        <FallingSeed t={t} />
        <Layer opacity={span(t, 0.1, 0.3)}>
          <ellipse cx={t < WALK_IN ? kidX : KID_X} cy="97.4" rx={8 - hop} ry="2" fill="#000000" opacity="0.12" />
          <Kid t={t} />
          <Growl t={t} />
          <Notice x={KID_X} y={GROUND_Y - KID_HEIGHT + 6} r={6.5} show={during(t, LOOK_UP + 0.1, LAND, 0.2)} dir={1} />
        </Layer>
        <RipeGlints t={t} />
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
    { at: 0, label: 'はたけで おなかを すかせた子が やってくる', sound: 'pop' },
    { at: LOOK_UP, label: 'そらを みあげる。ひかる たね が ふってくる' },
    { at: LAND, label: 'たね が つちに おちる', sound: 'pop' },
    { at: SPROUT, label: 'むぎの めが のびて、は が ひらく' },
    { at: CHEER, label: 'ほ が みのって、子が とびはねて よろこぶ', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '来 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
