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
 * 子は、ほんものの人の つくり を守る(正面むき):
 *   うで は かた から出て ひじ で まがる。くび は みじかく、どう の まんなか の上。
 *   むぎは、くき に ふし が あり、は は ふし から ひらき、ほ は おもくて うなだれる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '来'

const SKIN = '#f8cfa6'
const HAIR = '#5a3b2a'
const TUNIC = '#f0884a'
const TUNIC_DARK = '#d9703a'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const SUN = '#ffd24a'
const HILL = '#e2f2d2'
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
const SEED = '#ffd24a'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const EYE = '#2b2b2b'

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
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill={HILL} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="80" cy="14" rx="7" ry="3.2" />
        <ellipse cx="85" cy="12.4" rx="5" ry="3.2" />
        <ellipse cx="96" cy="26" rx="6" ry="2.6" />
      </g>
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
type ArmKey = { readonly at: number; readonly a: number; readonly f: number }
/** かた から ま下を 0 として そとへ ひらいた角度 a / ひじ から さきの 角度 f */
type ArmPose = { readonly a: number; readonly f: number }

/** くぎり ごとの 角度を、なめらかに つなぐ */
function armAt(t: number, keys: readonly ArmKey[]): ArmPose {
  const last = keys[keys.length - 1]
  if (t >= last.at) return { a: last.a, f: last.f }
  const i = keys.findIndex((key) => key.at > t)
  if (i <= 0) return { a: keys[0].a, f: keys[0].f }
  const [from, to] = [keys[i - 1], keys[i]]
  const k = span(t, from.at, to.at, easeInOut)
  return { a: from.a + (to.a - from.a) * k, f: from.f + (to.f - from.f) * k }
}

const SHOULDER_X = 6.2
const SHOULDER_Y = -25
const UPPER = 7.2
const FORE = 6.6
const rad = (deg: number) => (deg * Math.PI) / 180

/** かた → ひじ → 手 と つながる うで。side: 右がわ = 1 / 左がわ = -1 */
function Arm({ side, pose }: { readonly side: 1 | -1; readonly pose: ArmPose }) {
  const sx = side * SHOULDER_X
  const ex = sx + side * Math.sin(rad(pose.a)) * UPPER
  const ey = SHOULDER_Y + Math.cos(rad(pose.a)) * UPPER
  const hx = ex + side * Math.sin(rad(pose.f)) * FORE
  const hy = ey + Math.cos(rad(pose.f)) * FORE
  return (
    <>
      <path d={`M${sx} ${SHOULDER_Y} L${ex} ${ey}`} fill="none" stroke={TUNIC_DARK} strokeWidth="4.4" strokeLinecap="round" />
      <path d={`M${ex} ${ey} L${hx} ${hy}`} fill="none" stroke={SKIN} strokeWidth="3.2" strokeLinecap="round" />
      <circle cx={hx} cy={hy} r="2" fill={SKIN} />
    </>
  )
}

function Face({ mood, up }: { readonly mood: Mood; readonly up: number }) {
  const eyeY = -34 - up * 1.4
  const mouthY = -30 - up * 0.6
  return (
    <>
      <ellipse cx="-4.9" cy="-31" rx="1.7" ry="1.1" fill={CHEEK} opacity="0.55" />
      <ellipse cx="4.9" cy="-31" rx="1.7" ry="1.1" fill={CHEEK} opacity="0.55" />
      {mood === 'happy' ? (
        <>
          <path d={`M-4.2 ${eyeY} Q-2.8 ${eyeY - 2.2} -1.4 ${eyeY}`} fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d={`M1.4 ${eyeY} Q2.8 ${eyeY - 2.2} 4.2 ${eyeY}`} fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d={`M-2.6 ${mouthY - 1} Q0 ${mouthY + 3} 2.6 ${mouthY - 1} Z`} fill={MOUTH} />
        </>
      ) : (
        <>
          <circle cx="-2.8" cy={eyeY} r={mood === 'wow' ? 1.5 : 1.15} fill={EYE} />
          <circle cx="2.8" cy={eyeY} r={mood === 'wow' ? 1.5 : 1.15} fill={EYE} />
          {mood === 'sad' && (
            <>
              <path d="M-4.6 -36.2 L-1.8 -37.6" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
              <path d="M4.6 -36.2 L1.8 -37.6" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
              <path d={`M-1.8 ${mouthY} Q0 ${mouthY - 1.8} 1.8 ${mouthY}`} fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
            </>
          )}
          {mood === 'wow' && <ellipse cx="0" cy={mouthY} rx="1.2" ry="1.6" fill={MOUTH} />}
          {mood === 'smile' && <path d={`M-2 ${mouthY - 0.4} Q0 ${mouthY + 1.8} 2 ${mouthY - 0.4}`} fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />}
        </>
      )}
    </>
  )
}

type KidProps = {
  readonly mood: Mood
  readonly up: number
  readonly stride: number
  readonly squash: number
  readonly nearArm: ArmPose
  readonly farArm: ArmPose
}

function Kid({ mood, up, stride, squash, nearArm, farArm }: KidProps) {
  return (
    <>
      {/* あし: こしから。あるくとき かわりばんこに ふる */}
      <Layer rotate={stride * 18} origin={[-2.8, -14]}>
        <rect x="-4.6" y="-14.5" width="3.6" height="14" rx="1.8" fill={PANTS} />
        <ellipse cx="-3.2" cy="-0.4" rx="3" ry="1.5" fill={SHOE} />
      </Layer>
      <Layer rotate={-stride * 18} origin={[2.8, -14]}>
        <rect x="1" y="-14.5" width="3.6" height="14" rx="1.8" fill={PANTS} />
        <ellipse cx="3.2" cy="-0.4" rx="3" ry="1.5" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう と あたま の間 */}
      <rect x="-1.9" y="-30" width="3.8" height="6" rx="1.6" fill="#eeb98a" />
      {/* どう: おなかが すくと すこし へこむ */}
      <Layer scaleY={squash} origin={[0, -13]}>
        <rect x="-6.6" y="-27.4" width="13.2" height="15" rx="5" fill={TUNIC} />
        <path d="M-5 -16 h10" stroke={TUNIC_DARK} strokeWidth="1.1" strokeLinecap="round" />
      </Layer>
      <Arm side={-1} pose={farArm} />
      <Arm side={1} pose={nearArm} />
      {/* あたま */}
      <circle cx="0" cy="-34" r="7.4" fill={SKIN} />
      <path d="M-7.7 -34 C-8.8 -44.6 8.8 -44.6 7.7 -34 C4.5 -38.2 -4.5 -38.2 -7.7 -34 Z" fill={HAIR} />
      <path d="M1 -41 Q2 -44.4 3.8 -42.6" fill="none" stroke={HAIR} strokeWidth="1.5" strokeLinecap="round" />
      <Face mood={mood} up={up} />
    </>
  )
}

/** おなかが「ぐう」。体の よこに ゆれる すじ */
function Growl({ t }: SceneProps) {
  const show = during(t, 0.5, LOOK_UP + 0.1, 0.2)
  if (show <= 0) return null
  const pulse = 0.5 + 0.5 * wave(t, 0.45)
  return (
    <g opacity={show * (0.4 + 0.6 * pulse)} fill="none" stroke="#8a7a68" strokeWidth="0.9" strokeLinecap="round">
      {[-1, 1].map((s) => (
        <path key={s} d={`M${s * 11.4} -22 q${s * 1.8} 1.4 0 2.8 q${-s * 1.8} 1.4 0 2.8`} />
      ))}
    </g>
  )
}

/** 「あっ!」 */
function Surprise({ t }: SceneProps) {
  const p = span(t, LOOK_UP + 0.1, LOOK_UP + 0.4, backOut)
  const show = during(t, LOOK_UP + 0.1, LAND, 0.2)
  if (show <= 0) return null
  return (
    <Layer x={12} y={-46} scale={p} opacity={show} origin={[0, 0]}>
      <rect x="-1.2" y="-5.6" width="2.4" height="5.6" rx="1.2" fill="#ff6f3d" />
      <circle cx="0" cy="2" r="1.4" fill="#ff6f3d" />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)

  // 子: 左から あるいてくる。つかれて とぼとぼ
  const walkX = mix(t, 0.15, WALK_IN, -34, 0, easeOut)
  const walking = 1 - span(t, WALK_IN - 0.25, WALK_IN)
  const stride = t < 0.15 ? 0 : Math.sin((t - 0.15) * Math.PI * 2 * 2.2) * walking
  const bob = -Math.abs(stride) * 0.9
  const cheering = t >= CHEER
  const hop = cheering ? Math.abs(Math.sin((t - CHEER) * Math.PI * 2 * 1.1)) * 3.4 : 0
  const mood: Mood = t < LOOK_UP ? 'sad' : t < SPROUT ? 'wow' : t < CHEER ? 'smile' : 'happy'
  const up = span(t, LOOK_UP, LOOK_UP + 0.25) * (1 - span(t, LAND, LAND + 0.4)) + 0.4 * span(t, SPROUT + 1.0, SPROUT + 1.6) * (1 - span(t, CHEER - 0.2, CHEER))
  const squash = t < LOOK_UP ? 1 - 0.04 * (0.5 + 0.5 * wave(t, 0.45)) : 1

  // うで: おなかを おさえる → 天を さす → おどろいて ひらく → ばんざい
  const cheerWiggle = cheering ? wave(t, 0.5) * 9 : 0
  const nearBase = armAt(t, [
    { at: 0, a: 20, f: -80 },
    { at: LOOK_UP, a: 20, f: -80 },
    { at: LOOK_UP + 0.4, a: 125, f: 140 },
    { at: LAND, a: 125, f: 140 },
    { at: LAND + 0.5, a: 45, f: 45 },
    { at: CHEER - 0.2, a: 45, f: 45 },
    { at: CHEER + 0.2, a: 150, f: 165 },
  ])
  const farBase = armAt(t, [
    { at: 0, a: 20, f: -80 },
    { at: LAND, a: 20, f: -80 },
    { at: LAND + 0.5, a: 45, f: 45 },
    { at: CHEER - 0.2, a: 45, f: 45 },
    { at: CHEER + 0.2, a: 150, f: 165 },
  ])
  const nearArm: ArmPose = { a: nearBase.a + cheerWiggle, f: nearBase.f + cheerWiggle * 0.5 }
  const farArm: ArmPose = { a: farBase.a - cheerWiggle, f: farBase.f - cheerWiggle * 0.5 }

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Sunbeam t={t} />
        <Wheat t={t} />
        <Landing t={t} />
        <FallingSeed t={t} />
        <Layer opacity={span(t, 0.1, 0.3)}>
          <ellipse cx={KID_X + walkX} cy="97.4" rx={8 - hop} ry="2" fill="#000000" opacity="0.12" />
          <Layer x={KID_X + walkX} y={GROUND_Y + bob - hop}>
            <Kid mood={mood} up={up} stride={stride} squash={squash} nearArm={nearArm} farArm={farArm} />
            <Growl t={t} />
            <Surprise t={t} />
          </Layer>
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
