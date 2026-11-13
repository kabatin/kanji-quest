/*
 * 足(あし): かべに こしかけた 子の まるい ひざの 下に、あるいてきた あしあと。
 *
 * ほね(画と絵の対応)
 *   1〜3画目(口) … あたまと かお(上の まるい ところ)
 *   4画目(丨)   … ひざから 下へ たれた すね(まっすぐ ぶらぶら)
 *   5画目(一)   … ぶらぶら する足の あたり
 *   6画目(ノ)   … かべに のった もも と こし から 下へ のびる 線
 *   7画目       … 砂はまに ずっと つづく あしあと(右へ 下がっていく)
 *
 * ながれ
 *   はまべが できる → つかれた子が 右から あるいてくる(あせ・うつむき)。うしろに あしあとが のこる
 *   → かべの 前で「ふう」。くるっと ふりかえる → ずっと つづく 自分の あしあとに びっくり「!」
 *   → ぴょん と かべに こしかけて、ひざ を ぶらぶら。にこにこ して ばんざい
 *   → ほね が ひかって、絵が うすくなり、字「足」が のこる
 *
 * 子は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   もも(19.5)と すね(19.5)は 同じ長さ。ひざ は まえへ まがる。うで は かた から出て ひじ で まがる。
 *   足は ひざ と 足くび の 2かんせつ を、足くび の 場所から 計算(IK)して つなぐので、
 *   あるくときも こしかけるときも、ももと すね の 長さは かわらない。
 *   字の形と ぴったり重ならなくても、だいたい 同じ場所・同じ向き(ひざ=口の 下、すね=たて線)にしてある。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, linear, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '足'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const SKIN_LIGHT = '#fde8d2'
const HAIR = '#5a3b2a'
const SHIRT = '#e8604f'
const SHIRT_DARK = '#c9483a'
const SHORTS = '#4a6fa5'
const SHORTS_DARK = '#3d5c8e'
const SOCK = '#ffffff'
const SHOE = '#6b4a36'
const SAND = '#f6e3b0'
const SAND_DARK = '#e2c98c'
const PRINT = '#d9bf86'
const PRINT_LIGHT = '#fff3cf'
const STONE = '#b9b3a6'
const STONE_LIGHT = '#d6d0c2'
const STONE_DARK = '#9d978a'
const SEA = '#bfe3f7'
const SEA_LIGHT = '#e6f5fd'
const SUN = '#ffd24a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const ALERT = '#ff6b4a'

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

type V = readonly [number, number]

/** 子の 体の長さ(もも・すね は 同じ)。数字は ぜんぶ 109 x 109 の わく の中の長さ */
const THIGH = 19.5
const SHIN = 19.5
const TORSO = 24
const NECK = 11.5
const UPPER_ARM = 14.5
const FORE_ARM = 13.5

/** 立っている ときの こし と 足くび の高さ(砂の上) */
const STAND_HIP: V = [50, 53]
const GROUND_ANKLE_Y = 91
/** 子が 立ち止まる じく(ここを じく に 左右を ひっくり返す) */
const PIVOT = 50
/** あるきはじめの 位置(わく の 右の外) */
const WALK_START_X = 76
/** かべに こしかけた ときの こし と、ぶらぶら する足くび */
const SEAT_HIP: V = [24, 57]
const DANGLE_NEAR: V = [44, 77]
const DANGLE_FAR: V = [40.5, 78]
/** かべの てっぺん と、かべの はし */
const WALL_TOP = 62
const WALL_EDGE = 36
/** あるくときの 足の ふり(1びょうに 何しゅう) */
const STRIDE_HZ = 1.3

const lerpV = (a: V, b: V, k: number): V => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
const at = (p: V) => `${Math.round(p[0] * 100) / 100} ${Math.round(p[1] * 100) / 100}`

/**
 * 2つの ほね(かた→ひじ→手、こし→ひざ→足くび)を つなぐ。
 * root から target へ とどくように、まんなかの かんせつ を まげる向き(bend の側)に 出す。
 * とどかないときは、のばしきった ところまで(end が 実さい の はし)。
 */
function twoBone(root: V, target: V, a: number, b: number, bend: V): { readonly mid: V; readonly end: V } {
  const dx = target[0] - root[0]
  const dy = target[1] - root[1]
  const raw = Math.hypot(dx, dy)
  const ux = raw < 1e-6 ? 0 : dx / raw
  const uy = raw < 1e-6 ? 1 : dy / raw
  const d = Math.min(Math.max(raw, Math.abs(a - b) + 0.01), a + b - 0.01)
  const along = (a * a - b * b + d * d) / (2 * d)
  const h = Math.sqrt(Math.max(0, a * a - along * along))
  const px = -uy
  const py = ux
  const side = px * bend[0] + py * bend[1] >= 0 ? 1 : -1
  return {
    mid: [root[0] + ux * along + px * h * side, root[1] + uy * along + py * h * side],
    end: [root[0] + ux * d, root[1] + uy * d],
  }
}

type Mood = 'tired' | 'surprised' | 'happy'

type KidPose = {
  readonly hip: V
  readonly ankleNear: V
  readonly ankleFar: V
  readonly lean: number
  readonly headTilt: number
  readonly handNear: V
  readonly handFar: V
  readonly mood: Mood
}

/** その しゅんかん の 子の かっこう を、時間から 計算する */
function computePose(t: number): KidPose {
  // あるく: つかれて 少し ぐったり。足を かわりばんこに 出す
  const walking = span(t, WALK_FROM, WALK_FROM + 0.01) * (1 - span(t, ARRIVE - 0.35, ARRIVE))
  const phase = (t - WALK_FROM) * Math.PI * 2 * STRIDE_HZ
  const step = Math.sin(phase) * walking
  const liftNear = Math.max(0, Math.cos(phase)) * 3.2 * walking
  const liftFar = Math.max(0, -Math.cos(phase)) * 3.2 * walking
  const standHip: V = [STAND_HIP[0], STAND_HIP[1] + Math.abs(step) * 0.6]
  const standNear: V = [PIVOT + 2 + step * 5, GROUND_ANKLE_Y - liftNear]
  const standFar: V = [PIVOT - 2 - step * 5, GROUND_ANKLE_Y - liftFar]

  // ぴょん と かべに とびのる: こし が 弓なり に あがって、かべの うえ へ
  const hop = span(t, HOP_A, HOP_B, easeInOut)
  const arc = Math.sin(hop * Math.PI)
  const sway = wave(t, 1.2) * span(t, HOP_B, HOP_B + 0.3)
  const dangleNear: V = [DANGLE_NEAR[0] + sway * 2.6, DANGLE_NEAR[1]]
  const dangleFar: V = [DANGLE_FAR[0] - sway * 2.6, DANGLE_FAR[1]]
  const hipBase = lerpV(standHip, SEAT_HIP, hop)
  const hip: V = [hipBase[0], hipBase[1] - 9 * arc]
  const nearBase = lerpV(standNear, dangleNear, hop)
  const farBase = lerpV(standFar, dangleFar, hop)
  const ankleNear: V = [nearBase[0], nearBase[1] - 8 * arc]
  const ankleFar: V = [farBase[0], farBase[1] - 8 * arc]

  // からだ: あるくときは まえへ かがむ。こしかけて あしあとを 見るときは 少し のりだす
  const lean = 7 * (1 - span(t, ARRIVE, ARRIVE + 0.4)) + 4 * span(t, HOP_B, HOP_B + 0.3)

  // あたま: うつむく → あしあとを 見る → かお を あげる
  const headTilt = mix(t, TURN_B, TURN_B + 0.3, 7, 14) - 9 * span(t, HOP_A, HOP_B) + 10 * span(t, HOP_B, HOP_B + 0.3) - 12 * during(t, CHEER_A, INK - 0.2, 0.25)

  const mood: Mood = t < TURN_B ? 'tired' : t < HOP_A ? 'surprised' : 'happy'

  const sh = shoulderOf(hip, lean)
  // うで: あるくときは ぶらぶら。こしかけたら 手を ももの上に。うれしくて ばんざい
  const hangNear: V = [sh[0] + 3 - step * 5, sh[1] + 25]
  const hangFar: V = [sh[0] - 1 + step * 5, sh[1] + 25]
  const sit = span(t, HOP_B - 0.1, HOP_B + 0.3)
  const cheer = during(t, CHEER_A, INK - 0.2, 0.25)
  const thighSpot: V = [37, 53]
  const wallSpot: V = [30, 59]
  const raised: V = [sh[0] + 14 + wave(t, 0.4) * 2.2, sh[1] - 15]
  const handNear = lerpV(lerpV(hangNear, thighSpot, sit), raised, cheer)
  const handFar = lerpV(hangFar, wallSpot, sit)

  return { hip, ankleNear, ankleFar, lean, headTilt, handNear, handFar, mood }
}

/** かた の場所: こし から からだ の ながさ だけ 上(lean 度 だけ まえへ かたむく) */
function shoulderOf(hip: V, lean: number): V {
  const rad = (lean * Math.PI) / 180
  return [hip[0] + TORSO * Math.sin(rad), hip[1] - TORSO * Math.cos(rad)]
}

/** あたま の中心: かた から くび の ながさ だけ 上 */
function headOf(sh: V, lean: number): V {
  const rad = (lean * Math.PI) / 180
  return [sh[0] + NECK * Math.sin(rad), sh[1] - NECK * Math.cos(rad)]
}

/* ───────── はまべ ───────── */

function Beach({ t }: SceneProps) {
  const pop = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={pop} rotate={t * 14} origin={[96, 14]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="95.2" y="2.4" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 96 14)`} />
        ))}
      </Layer>
      <circle cx="96" cy="14" r={6.2 * pop} fill={SUN} />
      {/* ゆっくり ながれる 雲 */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.2} 0)`}>
        <ellipse cx="56" cy="9" rx="7" ry="3.2" />
        <ellipse cx="61" cy="7.4" rx="4.6" ry="3" />
        <ellipse cx="88" cy="36" rx="6" ry="2.8" />
        <ellipse cx="92.5" cy="34.6" rx="4.2" ry="2.8" />
      </g>
      {/* うみ: かべの うしろ から 右へ */}
      <path d="M-10 68 Q50 63.5 66 68 T98 68 T116 66 V92 H-10 Z" fill={SEA} />
      {[
        [52, 76, 0],
        [78, 73.5, 1],
        [92, 82, 2],
        [62, 84, 3],
      ].map(([x, y, i]) => (
        <path key={i} d={`M${x + wave(t, 2.4, i) * 2} ${y} q3 -1.7 6 0 t6 0`} fill="none" stroke={SEA_LIGHT} strokeWidth="1.1" strokeLinecap="round" />
      ))}
      {/* すなはま */}
      <ellipse cx="54.5" cy="98" rx="56" ry="9" fill={SAND} />
      <ellipse cx="86" cy="101" rx="26" ry="4" fill={SAND_DARK} opacity="0.35" />
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

/* ───────── あしあと ───────── */

/** あしあと が のこる 場所(右から 左へ、子が あるいた じゅん)。さいごの 2つ は 立ち止まった ところ */
const PRINT_XS: readonly number[] = [106, 98, 90, 82, 74, 66, 58, 50]
/** 子が この x の すこし 手前を 通りすぎた とき、あしあと が つく時間 */
function printTime(x: number): number {
  const hipX = x + 3
  return WALK_FROM + (ARRIVE - WALK_FROM) * (1 - Math.min(WALK_START_X, Math.max(0, hipX - PIVOT)) / WALK_START_X)
}

/** 左むき(あるいていく むき)の あしあと: かかと は 右、つまさき は 左 */
function Print({ x, y, scale }: { readonly x: number; readonly y: number; readonly scale: number }) {
  return (
    <Layer x={x} y={y} scale={scale}>
      <ellipse cx="0.4" cy="0.2" rx="4.6" ry="2.3" fill={PRINT_LIGHT} />
      <ellipse cx="0" cy="0" rx="4.2" ry="2" fill={PRINT} />
      <ellipse cx="-5.2" cy="-0.2" rx="1.4" ry="1.3" fill={PRINT} />
      <ellipse cx="3.6" cy="0.2" rx="2.1" ry="1.7" fill={PRINT} />
    </Layer>
  )
}

function Footprints({ t }: SceneProps) {
  return (
    <>
      {PRINT_XS.map((x, i) => {
        const age = t - printTime(x)
        if (age <= 0) return null
        return <Print key={x} x={x} y={i % 2 === 0 ? 94.4 : 96.8} scale={backOut(span(age, 0, 0.25))} />
      })}
    </>
  )
}

/* ───────── 子 ───────── */

function Leg({ hip, knee, ankle, shorts, near }: { readonly hip: V; readonly knee: V; readonly ankle: V; readonly shorts: string; readonly near: boolean }) {
  const hem = lerpV(hip, knee, 0.62)
  const sock = lerpV(knee, ankle, 0.7)
  return (
    <>
      <path d={`M${at(hip)} L${at(knee)}`} fill="none" stroke={SKIN} strokeWidth="8.4" strokeLinecap="round" />
      <path d={`M${at(knee)} L${at(ankle)}`} fill="none" stroke={SKIN} strokeWidth="6.4" strokeLinecap="round" />
      <path d={`M${at(sock)} L${at(ankle)}`} fill="none" stroke={SOCK} strokeWidth="6.8" strokeLinecap="round" />
      <path d={`M${at(hip)} L${at(hem)}`} fill="none" stroke={shorts} strokeWidth="10.4" strokeLinecap="round" />
      <ellipse cx={ankle[0] + 3.2} cy={ankle[1] + 1.9} rx="5.4" ry="3" fill={SHOE} />
      {/* まるい ひざ */}
      <circle cx={knee[0]} cy={knee[1]} r="4.7" fill={SKIN} />
      <circle cx={knee[0] - 1} cy={knee[1] - 1.4} r="1.6" fill={SKIN_LIGHT} />
      {near && <rect x={knee[0] - 2.9} y={knee[1] - 1.3} width="5.8" height="2.6" rx="0.9" fill="#ffffff" transform={`rotate(-28 ${knee[0]} ${knee[1]})`} />}
    </>
  )
}

function Arm({ shoulder, elbow, hand, sleeve }: { readonly shoulder: V; readonly elbow: V; readonly hand: V; readonly sleeve: string }) {
  const cuff = lerpV(shoulder, elbow, 0.7)
  return (
    <>
      <path d={`M${at(shoulder)} L${at(elbow)} L${at(hand)}`} fill="none" stroke={SKIN} strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${at(shoulder)} L${at(cuff)}`} fill="none" stroke={sleeve} strokeWidth="6.6" strokeLinecap="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.9" fill={SKIN} />
    </>
  )
}

/** かお(あたま の中心が 0,0。右むき)。気持ちで 目と口を かえる */
function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="0" cy="0" r="9.5" fill={SKIN} />
      <circle cx="-1.6" cy="1.8" r="2.1" fill={SKIN_SHADE} />
      <circle cx="4.2" cy="4.6" r="2" fill={CHEEK} opacity={mood === 'happy' ? 0.8 : 0.5} />
      {mood === 'tired' && (
        <>
          <path d="M2.4 -3.4 l3.8 1.3" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="4.7" cy="0" r="1.2" fill={EYE} />
          <ellipse cx="6.2" cy="5.8" rx="1.2" ry="1.6" fill={MOUTH} />
        </>
      )}
      {mood === 'surprised' && (
        <>
          <path d="M2.6 -4.8 Q4.8 -6.4 7 -4.8" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="4.9" cy="-0.4" r="2.2" fill="#ffffff" />
          <circle cx="5.2" cy="-0.2" r="1.15" fill={EYE} />
          <ellipse cx="6.4" cy="5.9" rx="1.5" ry="2" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M2.9 0.8 Q4.8 -1.8 6.8 0.8" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M3.6 4.2 Q6 9 8.4 4.2 Z" fill={MOUTH} />
          <path d="M4.8 6.4 Q6 7.8 7.2 6.4 Z" fill="#ff8a8a" />
        </>
      )}
    </>
  )
}

function Hair() {
  return (
    <>
      <path d="M-9.4 1.2 C-11 -9.5 0 -14 7.4 -8.6 C9.4 -6.6 9.8 -3 9.2 -1 C6.2 -5 2 -5.8 -2 -4.6 C-5.6 -3.6 -7.6 -1.6 -9.4 1.2 Z" fill={HAIR} />
      <path d="M1 -11.6 Q2 -15.2 4 -12.8 Q5.4 -15.4 6.2 -11.6" fill="none" stroke={HAIR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )
}

/** あるきつかれた あせ(うしろ=左 へ とぶ) */
function Sweat({ t, head }: { readonly t: number; readonly head: V }) {
  const show = during(t, WALK_FROM + 0.3, ARRIVE, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.45].map((offset) => {
        const p = ((t + offset) % 0.9) / 0.9
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" transform={`translate(${head[0] - 9 - p * 7} ${head[1] - 5 + p * 8 - Math.sin(p * Math.PI) * 4}) rotate(-35)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** たちどまった ときの「ふう」 */
function Sigh({ t, head }: { readonly t: number; readonly head: V }) {
  const show = during(t, ARRIVE, TURN_A + 0.2, 0.15)
  if (show <= 0) return null
  const p = span(t, ARRIVE, TURN_A + 0.2, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={head[0] + 12 + p * 6} cy={head[1] + 5 - p * 3} rx={2.6 + p * 2.2} ry={1.8 + p * 1.4} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
      <ellipse cx={head[0] + 11 + p * 2} cy={head[1] + 7 - p} rx={1.3 + p * 0.8} ry="1" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
    </g>
  )
}

/** あしあとを 見つけた「!」 */
function Alert({ t, head }: { readonly t: number; readonly head: V }) {
  const show = during(t, TURN_B, HOP_A + 0.1, 0.12)
  if (show <= 0) return null
  const k = backOut(span(t, TURN_B, TURN_B + 0.25))
  return (
    <Layer x={head[0] + 15} y={head[1] - 7} scale={k} opacity={show}>
      <rect x="-1.2" y="-4.2" width="2.4" height="5.6" rx="1.2" fill={ALERT} />
      <circle cx="0" cy="3.6" r="1.4" fill={ALERT} />
    </Layer>
  )
}

function Kid({ t, pose }: { readonly t: number; readonly pose: KidPose }) {
  const { hip, ankleNear, ankleFar, lean, headTilt, handNear, handFar, mood } = pose
  const sh = shoulderOf(hip, lean)
  const head = headOf(sh, lean)
  const legBend: V = [1, 0]
  const armBend: V = [-0.4, 0.9]
  const legNear = twoBone(hip, ankleNear, THIGH, SHIN, legBend)
  const legFar = twoBone(hip, ankleFar, THIGH, SHIN, legBend)
  const armNear = twoBone(sh, handNear, UPPER_ARM, FORE_ARM, armBend)
  const armFar = twoBone(sh, handFar, UPPER_ARM, FORE_ARM, armBend)
  const torsoBottom: V = [hip[0], hip[1] - 2]
  return (
    <>
      {/* むこうがわ の足・うで(いろ を 少し くらく) */}
      <Leg hip={hip} knee={legFar.mid} ankle={legFar.end} shorts={SHORTS_DARK} near={false} />
      <Arm shoulder={sh} elbow={armFar.mid} hand={armFar.end} sleeve={SHIRT_DARK} />
      {/* どう: こし から かた まで */}
      <path d={`M${at(torsoBottom)} L${at(sh)}`} fill="none" stroke={SHIRT} strokeWidth="13" strokeLinecap="round" />
      {/* くび: どう と あたま を みじかく つなぐ */}
      <path d={`M${at(sh)} L${at(head)}`} fill="none" stroke={SKIN_SHADE} strokeWidth="5" strokeLinecap="round" />
      <Leg hip={hip} knee={legNear.mid} ankle={legNear.end} shorts={SHORTS} near />
      <Arm shoulder={sh} elbow={armNear.mid} hand={armNear.end} sleeve={SHIRT} />
      <Layer rotate={headTilt} origin={[sh[0], sh[1] - 3]}>
        <g transform={`translate(${at(head)})`}>
          <Face mood={mood} />
          <Hair />
        </g>
      </Layer>
      <Sweat t={t} head={head} />
      <Sigh t={t} head={head} />
      <Alert t={t} head={head} />
    </>
  )
}

/** とおくを とぶ 小鳥(かもめ)。はばたきながら よこぎる */
function Gull({ t }: SceneProps) {
  const x = -10 + t * 12.5
  const y = 24 + wave(t, 3.2) * 2.5
  const flap = wave(t, 0.5)
  if (x > 120) return null
  return (
    <Layer x={x} y={y}>
      <path d={`M-5 ${-flap * 1.6} Q-2.4 ${-3.4 - flap * 2} 0 0 Q2.4 ${-3.4 - flap * 2} 5 ${-flap * 1.6}`} fill="none" stroke="#7e93ad" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)
  const pose = computePose(t)
  const walkX = mix(t, WALK_FROM, ARRIVE, WALK_START_X, 0, linear)
  // ふりかえる: 左むき(-1)から 右むき(1)へ。まよこ(0)で 消えないよう 少しだけ 厚みを のこす
  const facing = mix(t, TURN_A, TURN_B, -1, 1)
  const flip = facing >= 0 ? Math.max(0.08, facing) : Math.min(-0.08, facing)
  const shadow = 1 - span(t, HOP_A, HOP_A + 0.25)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Beach t={t} />
        <Wall t={t} />
        <Footprints t={t} />
        <Layer x={walkX}>
          <ellipse cx={PIVOT} cy="96.2" rx="10" ry="2.2" fill="#000000" opacity={0.12 * shadow} />
          <Layer scaleX={flip} origin={[PIVOT, 0]}>
            <Kid t={t} pose={pose} />
          </Layer>
        </Layer>
        <Gull t={t} />
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
