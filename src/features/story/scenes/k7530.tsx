/*
 * 田(た): 四角い たんぼを あぜみちで 4つに くぎった。(共通部品 sceneFigures で 書きなおした もの)
 *
 * ほね(画と絵の対応)  ※ たんぼを まうえから 見た 地図の ような 絵
 *   1画目(丨)  … たんぼの 左の あぜ(土手)
 *   2画目(冂)  … たんぼの 上の あぜ と 右の あぜ
 *   3画目(丨)  … のうふが たてに ほった まんなかの あぜみち
 *   4画目(一)  … のうふが よこに ほった まんなかの あぜみち
 *   5画目(一)  … たんぼの 下の あぜ
 *
 * ながれ
 *   四角い たんぼが できる
 *   → のうふが あぜを あるいてくる。たんぼが ひろくて、中へ はいれず こまった かお
 *   → 「そうだ！」 ひらめく(あたまの ふきだしに、4つに わけた たんぼ)
 *   → くわで、たてに あぜみちを ほる(ほった所を、のうふが すすむ)
 *   → よこにも ほる。たんぼが 4つに くぎられる
 *   → のうふが 大よろこび。4つの たんぼに 苗が ぽん ぽん と 出る
 *   → ほね が ひかって、絵が うすくなり、字「田」が のこる
 *
 * のうふは Person(むきは turnAround、あるきは walk、まえへ すすむ ほり は walkDepth)。ぼうしは look.hat。
 * くわは えを tools の 'stick'、鉄の はを 場面で 描く(両手は えの 上に { to })。
 */
import { backOut, clamp01, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Bird, Dust, LOOKS, mixLimb, nearSide, Person, personRig, Sweat, Tuft, turnAround, walk, walkDepth, type BodySide, type Facing, type Limb, type PersonProps } from '../sceneFigures'

const CHAR = '田'

const WATER = '#9ccfe8'
const WATER_LIGHT = '#c9e8f6'
const SOIL = '#8c5b3c'
const SOIL_LIGHT = '#b07a52'
const GRASS = '#c5e8a9'
const IRON = '#8e98a4'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'

/** くぎり の時間(秒) */
const FIELD_DONE = 0.9
const WALK_IN_END = 2.3
const IDEA_END = 3.2
const DIG_V_END = 4.6
const TURN_A_END = 4.85
const WALK_END = 5.6
const TURN_B_END = 5.9
const DIG_H_END = 7.1
const TURN_C_END = 7.35
const INK = 7.9
const DONE = 10.8
const DURATION = 11.2

/** 人の 大きさ(うえから見た地図の 中なので、たんぼの 4分の1 くらいの 小ささ) */
const BODY = { build: 'child', height: 34 } as const
const S = 0.72
/** くわの はが 地面に とどく 場所(足もとから)。まえむき = 下へ / よこむき = まえへ */
const FRONT_REACH = 4
const SIDE_REACH = 12
/** たんぼの あぜ(画)の 場所。画データから */
const WALK_START_X = 124
const TOP_BANK_Y = 33.4
const V_LINE_X = 54
const V_HEAD_END = 79.8
const H_LINE_X0 = 24
const H_LINE_LEN = 62.5
/** 4画目の 書きはじめの たかさ と、右への のぼり(2点の高さの差) */
const H_LINE_Y0 = 55.5
const H_LINE_RISE = 3.5
/** くわを かついで あるく ときの もちあげ(digLift の 値) */
const CARRY = 1.3

type Pt = readonly [number, number]

const V_END_Y = V_HEAD_END - FRONT_REACH * S
const H_FEET_X0 = H_LINE_X0 - SIDE_REACH * S
const H_FEET_Y0 = H_LINE_Y0 - 0.7
const H_END_X = H_FEET_X0 + H_LINE_LEN
const H_END_Y = H_FEET_Y0 - H_LINE_RISE

const FARMER_LOOK = { ...LOOKS.boy, top: '#e0705a', bottom: '#3e5c86', hat: 'straw', hatColor: '#e8c36a' } as const

/** くわを ふりおろす くりかえし。0 = 地面を うつ / 1 = いちばん 上 */
const digLift = (t: number) => 0.5 - 0.5 * Math.cos((t / 0.5) * Math.PI * 2)

/* ───────── のうふ ───────── */

type Hoe = { readonly pose: PersonProps['pose']; readonly tools: PersonProps['tools']; readonly blade: Pt; readonly angle: number }

/** 手と くわ。両手は えの 上、はは 地面(lift が 大きいほど もちあがる)。cheer で 右手 ばんざい、左手 で くわを かかげる */
function holdHoe(base: PersonProps, lift: number, cheer: number): Hoe {
  const facing: Facing = base.facing ?? 'right'
  const rig = personRig({ ...base, pose: {} })
  const l = Math.min(lift, CARRY)
  if (facing === 'front') {
    const [lx, ly] = rig.world.arms.left.root
    const low: Pt = [base.x - 0.8, ly + 8 - 4 * l]
    const high: Pt = [base.x - 1.6, ly + 4.5 - 4 * l]
    const down: Pt = [base.x - 0.6, base.y + FRONT_REACH * S - 9 * l]
    const upHand: Pt = [lx + 3, ly + 3]
    const upTip: Pt = [lx + 5.5, ly - 11]
    const tip: Pt = [down[0] + (upTip[0] - down[0]) * cheer, down[1] + (upTip[1] - down[1]) * cheer]
    const grip: Limb = { to: low, depth: 6 }
    const leftArm = mixLimb(grip, { to: upHand, depth: 4 }, cheer)
    const rightArm = mixLimb({ to: high, depth: 6 }, { swing: 155, bend: 15 }, cheer)
    return { pose: { leftArm, rightArm }, tools: { left: { kind: 'stick', tip, length: 28 } }, blade: tip, angle: cheer > 0.5 ? -90 : 90 }
  }
  const d = facing === 'left' ? -1 : 1
  const near = (nearSide(facing) ?? 'left') as BodySide
  const [px, py] = rig.world.arms[near].root
  const hand: Pt = [px + d * (4.2 - 1.2 * Math.min(l, 1)), py + 6.5 - 4 * l]
  const blade: Pt = [base.x + d * (SIDE_REACH - 2.5 * l) * S, base.y + (3 - 12 * l) * S]
  const len = Math.hypot(hand[0] - blade[0], hand[1] - blade[1]) || 1
  const upper: Pt = [hand[0] + ((hand[0] - blade[0]) / len) * 1.8, hand[1] + ((hand[1] - blade[1]) / len) * 1.8]
  const pose = near === 'left' ? { leftArm: { to: hand }, rightArm: { to: upper } } : { rightArm: { to: hand }, leftArm: { to: upper } }
  const angle = (Math.atan2(blade[1] - hand[1], blade[0] - hand[0]) * 180) / Math.PI
  return { pose, tools: { [near]: { kind: 'stick', tip: blade, length: 22 } } as PersonProps['tools'], blade, angle }
}

type FarmerState = {
  readonly base: PersonProps
  /** くわの もちあがり(0 = うつ / 1 = いちばん 上 / CARRY = かつぐ) */
  readonly lift: number
  readonly cheer: number
  readonly face: PersonProps['face']
}

/** きまった 時間に きまった ところ。あるき は walk、まえへ ほりすすむ ところ は walkDepth、むき かえ は turnAround */
function farmerState(t: number): FarmerState {
  const still = (x: number, y: number, facing: Facing, squash = 1): PersonProps => ({ x, y, ...BODY, facing, squash })
  const digWeight = (from: number, to: number) => span(t, from, from + 0.25) * (1 - span(t, to - 0.3, to))
  const dig = (from: number, to: number) => CARRY * (1 - digWeight(from, to)) + digLift(t) * digWeight(from, to)
  // 1. あぜを あるいてくる(左むき・こまった かお)
  if (t < WALK_IN_END) {
    const w = walk(t, { from: WALK_START_X, to: V_LINE_X, start: FIELD_DONE, end: WALK_IN_END, ...BODY })
    return { base: { ...w, y: TOP_BANK_Y }, lift: CARRY, cheer: 0, face: 'worried' }
  }
  // 2. くるっと まえを むく。ひらめく
  if (t < IDEA_END) {
    const turn = turnAround(t, WALK_IN_END, 'left', 'front', 0.5)
    return { base: { ...still(V_LINE_X, TOP_BANK_Y, turn.facing, turn.squash) }, lift: CARRY, cheer: 0, face: turn.facing === 'left' ? 'worried' : 'surprised' }
  }
  // 3. たてに ほる(下へ すすむ)
  if (t < DIG_V_END) {
    const w = walkDepth(t, { from: [V_LINE_X, TOP_BANK_Y], to: [V_LINE_X, V_END_Y], start: IDEA_END, end: DIG_V_END - 0.15, ...BODY })
    return { base: { ...w, stance: undefined }, lift: dig(IDEA_END, DIG_V_END), cheer: 0, face: 'normal' }
  }
  // 4. 左むきに かわる
  if (t < TURN_A_END) {
    const turn = turnAround(t, DIG_V_END, 'front', 'left', TURN_A_END - DIG_V_END)
    return { base: still(V_LINE_X, V_END_Y, turn.facing, turn.squash), lift: CARRY, cheer: 0, face: 'normal' }
  }
  // 5. 左はしへ あるく(あがりながら)
  if (t < WALK_END) {
    const w = walk(t, { from: V_LINE_X, to: H_FEET_X0, start: TURN_A_END, end: WALK_END, ...BODY })
    return { base: { ...w, y: V_END_Y + (H_FEET_Y0 - V_END_Y) * span(t, TURN_A_END, WALK_END, easeInOut) }, lift: CARRY, cheer: 0, face: 'normal' }
  }
  // 6. 右むきに くるっと かわる
  if (t < TURN_B_END) {
    const turn = turnAround(t, WALK_END, 'left', 'right', TURN_B_END - WALK_END)
    return { base: still(H_FEET_X0, H_FEET_Y0, turn.facing, turn.squash), lift: CARRY, cheer: 0, face: 'normal' }
  }
  // 7. よこに ほる(右へ すすむ)
  if (t < DIG_H_END) {
    const w = walk(t, { from: H_FEET_X0, to: H_END_X, start: TURN_B_END, end: DIG_H_END - 0.15, ...BODY })
    return { base: { ...w, y: H_FEET_Y0 - H_LINE_RISE * span(t, TURN_B_END, DIG_H_END - 0.15) }, lift: dig(TURN_B_END, DIG_H_END), cheer: 0, face: 'normal' }
  }
  // 8. こちらを むく
  if (t < TURN_C_END) {
    const turn = turnAround(t, DIG_H_END, 'right', 'front', TURN_C_END - DIG_H_END)
    return { base: still(H_END_X, H_END_Y, turn.facing, turn.squash), lift: CARRY, cheer: 0, face: turn.facing === 'right' ? 'normal' : 'smile' }
  }
  // 9. 大よろこび(くわを かかげて ぴょんぴょん)
  const cheer = span(t, TURN_C_END, TURN_C_END + 0.3, easeOut)
  const hop = Math.abs(Math.sin((t - TURN_C_END) * Math.PI * 2 * 1.3)) * 3
  return { base: { ...still(H_END_X, H_END_Y, 'front'), lift: hop }, lift: CARRY, cheer, face: 'joy' }
}

/** くわの 鉄の は(えの さきに ついて、えと 同じ むき) */
function Blade({ at, angle }: { readonly at: Pt; readonly angle: number }) {
  return <rect x="-0.6" y="-2.4" width="1.7" height="4.8" rx="0.7" fill={IRON} transform={`translate(${at[0]} ${at[1]}) rotate(${angle})`} />
}

/* ───────── たんぼ ───────── */

function Ground({ t }: SceneProps) {
  return (
    <>
      <rect x="-2" y="-2" width="113" height="113" fill={GRASS} />
      {[[6, 14], [100, 20], [8, 94], [100, 98], [96, 62], [8, 60]].map(([x, y]) => (
        <g key={`${x}-${y}`} opacity={0.9} transform={`translate(${wave(t, 3.6, x) * 0.3} 0)`}>
          <Tuft x={x} y={y} color={LEAF_DARK} size={0.9} />
        </g>
      ))}
    </>
  )
}

/** みずを はった たんぼ(2画目・1画目・5画目の あぜ の 中) */
function Paddy({ t }: SceneProps) {
  const fill = span(t, 0.45, 1.0, easeOut)
  return (
    <g opacity={fill}>
      <path d="M22 29 L88 28 L85 82 L25 83 Z" fill={WATER} />
      <path d="M26 33 q5 -1.6 10 0 M60 34 q6 -1.6 12 0 M30 76 q5 -1.6 10 0 M66 77 q6 -1.6 12 0" fill="none" stroke={WATER_LIGHT} strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />
    </g>
  )
}

/** あぜ(土の みち)。土のいろ の 上に、ひとすじ 明るい色 */
function Bank({ n, width, to }: { readonly n: number; readonly width: number; readonly to: number }) {
  return (
    <>
      <Bone char={CHAR} n={n} color={SOIL} width={width} to={to} />
      <Bone char={CHAR} n={n} color={SOIL_LIGHT} width={width * 0.34} to={to} opacity={0.8} />
    </>
  )
}

function Seedling({ x, y, grow }: { readonly x: number; readonly y: number; readonly grow: number }) {
  const g = Math.max(0, grow)
  if (g <= 0) return null
  return (
    <Layer x={x} y={y} scale={g}>
      <ellipse cx="0" cy="0.4" rx="3.4" ry="1.3" fill={SOIL} />
      <path d="M-1.2 0 Q-2.6 -3 -3.2 -5.4 M0 0 Q0.2 -3.6 0 -7 M1.2 0 Q2.6 -3 3.4 -5.2" fill="none" stroke={LEAF} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M0 0 Q0.2 -3.6 0 -7" fill="none" stroke={LEAF_DARK} strokeWidth="0.6" strokeLinecap="round" />
    </Layer>
  )
}

/** 4つの たんぼに ふたつずつ 苗(あぜみちの 上には おかない) */
const SEEDLINGS: readonly Pt[] = [[32, 38], [44, 47], [62, 37], [75, 47], [32, 64], [44, 74], [62, 66], [75, 74]]

/** 足もとの みずの わ。みずの 上(あぜ みち いがい)を すすむとき だけ */
function Ripples({ t, x, y, show }: { readonly t: number; readonly x: number; readonly y: number; readonly show: number }) {
  if (show <= 0) return null
  return (
    <g fill="none" stroke="#ffffff" strokeWidth="0.8" opacity={show}>
      {[0, 0.5].map((offset) => {
        const p = (t + offset) % 1
        return <ellipse key={offset} cx={x} cy={y} rx={2.5 + p * 8} ry={1 + p * 3} opacity={(1 - p) * 0.8} />
      })}
    </g>
  )
}

/** 「そうだ！」の ふきだし。中に、4つに わけた たんぼ。 */
function IdeaBubble({ t }: SceneProps) {
  const pop = Math.max(0, span(t, 2.55, 2.95, backOut))
  const show = during(t, 2.55, 3.9, 0.2)
  if (pop <= 0 || show <= 0) return null
  return (
    <g opacity={show}>
      <circle cx="63" cy="9" r="1.3" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
      <circle cx="67.4" cy="11" r="2" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
      <Layer scale={pop} origin={[81, 13]}>
        <ellipse cx="81" cy="13" rx="14.5" ry="10.6" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
        <rect x="73" y="7" width="16" height="12" rx="1" fill={WATER} stroke={SOIL} strokeWidth="1.4" />
        <path d="M81 7 V19 M73 13 H89" stroke={SOIL} strokeWidth="1.4" />
      </Layer>
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)
  const f = farmerState(t)
  const hoe = holdHoe(f.base, f.lift, f.cheer)
  const farmer: PersonProps = { ...f.base, pose: { ...f.base.pose, ...hoe.pose }, tools: hoe.tools, face: f.face, look: FARMER_LOOK, opacity: span(t, FIELD_DONE - 0.1, FIELD_DONE + 0.1) }
  const head = personRig(farmer).world.head

  // あぜの ひろがり: まず まわり、つぎに まんなか(のうふが ほった ぶんだけ)
  const topRight = span(t, 0.1, 0.75, easeOut)
  const left = span(t, 0.1, 0.55, easeOut)
  const bottom = span(t, 0.35, 0.85, easeOut)
  const vHead = f.base.y + FRONT_REACH * S
  const vDug = t < IDEA_END ? 0.1 : t < DIG_V_END ? Math.max(0.1, (vHead - 29) / (V_HEAD_END - 29)) : 1
  const hHead = f.base.x + SIDE_REACH * S
  const hDug = t < TURN_B_END ? 0 : t < DIG_H_END ? Math.max(0.01, (hHead - H_LINE_X0) / H_LINE_LEN) : 1
  const inWater = f.base.y > TOP_BANK_Y + 2 && (t < DIG_H_END || t > TURN_C_END)
  const rippleShow = inWater ? clamp01(span(t, TURN_A_END - 0.3, TURN_A_END - 0.1) + (t < TURN_A_END && t >= IDEA_END ? 1 : 0)) : 0
  const diggingNow = (t >= IDEA_END + 0.2 && t < DIG_V_END - 0.2) || (t >= TURN_B_END + 0.2 && t < DIG_H_END - 0.2)
  const dustP = diggingNow ? Math.min(0.999, digLift(t) * 2.4) : 1
  const birdP = span(t, 0.05, 1.15)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Paddy t={t} />
        {SEEDLINGS.map(([x, y], i) => (
          <Seedling key={i} x={x} y={y} grow={span(t, 7.0 + i * 0.1, 7.55 + i * 0.1, backOut)} />
        ))}
        <Bank n={1} width={5} to={left} />
        <Bank n={2} width={5.4} to={topRight} />
        <Bank n={5} width={5} to={bottom} />
        <Bank n={3} width={4.4} to={vDug} />
        <Bank n={4} width={4.4} to={hDug} />
        {birdP > 0 && birdP < 1 && <Bird x={-8 + birdP * 126} y={9 + Math.sin(birdP * 9) * 1.6} t={t} flying facing="right" />}
        <Ripples t={t} x={f.base.x} y={f.base.y - 0.4} show={rippleShow * span(t, FIELD_DONE - 0.1, FIELD_DONE + 0.1)} />
        <Dust x={hoe.blade[0]} y={f.base.y + FRONT_REACH * S} p={dustP} reach={4} color={SOIL} />
        <Person {...farmer} />
        <Blade at={hoe.blade} angle={hoe.angle} />
        <Sweat t={t} x={head[0] + 3} y={head[1] - 2} show={during(t, FIELD_DONE + 0.2, WALK_IN_END + 0.3, 0.2)} dir={1} />
        <IdeaBubble t={t} />
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
    { at: 0, label: '四角い たんぼが できる', sound: 'pop' },
    { at: FIELD_DONE, label: 'のうふが あるいてきて、こまった' },
    { at: WALK_IN_END, label: 'そうだ！ 4つに わけよう', sound: 'pop' },
    { at: IDEA_END, label: 'くわで、たてに あぜみちを ほる' },
    { at: TURN_B_END, label: 'よこにも あぜみちを ほる' },
    { at: DIG_H_END, label: '4つに くぎれた！ 大よろこび。苗が そだつ', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '田 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
