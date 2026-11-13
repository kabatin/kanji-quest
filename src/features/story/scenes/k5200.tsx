/*
 * 刀(かたな): かじやさんが、まっかな 鉄の ぼうを 水に ジュッ と つけたら、そった かたなに なった。
 *
 * ほね(画と絵の対応)
 *   1画目(つり手の かたち) … かたなを たてかける 木の だい(うえの よこぼう と、右の はしら と、足もと)
 *   2画目(ノ)              … そった かたな(うえの つか から、したの きっさき まで。体は そっている)
 *                             (できあがりで、かじやさんが だいに たてかけた かたなが この線に重なる)
 *
 * ながれ
 *   かじばが できる → かじやさんが まっかに やけた 鉄の ぼうを もって あるいてくる(あつくて しんぱい)
 *   → 水の おけに ジュッ と つける(ぎゅっと 目をつぶる。けむりが ふわっ)
 *   → 引きあげると、はが そった かたなに なっている(びっくり → にっこり)
 *   → つかを つけて、だいに たてかける → ほね が ひかって、絵が うすくなり、字「刀」が のこる
 *
 * 人と かたなは、ほんものの つくり を守る(字の形に合わせるために、ゆがめない):
 *   うで は かた から出て ひじ で まがる(かた と 手 の 場所から ひじ を計算する)。
 *   かたなは、そりが 1つの なめらかな カーブ。まっすぐな 鉄が、水で ひやされて そる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '刀'

const WALL = '#fbeed6'
const WALL_LINE = '#f0dfc0'
const FLOOR = '#e7cfa5'
const FLOOR_EDGE = '#d8bb8a'
const BARK = '#8c5b3c'
const TUB = '#b07c52'
const TUB_DARK = '#8f5f3a'
const TUB_BAND = '#6b4a36'
const WATER = '#7cc4f2'
const WATER_LIGHT = '#bfe3f9'
const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const BAND = '#ffffff'
const TUNIC = '#4a66a8'
const TUNIC_DARK = '#3a5390'
const TUNIC_FAR = '#2f4478'
const APRON = '#9a6a43'
const PANTS = '#2f3f66'
const PANTS_DARK = '#27345a'
const SHOE = '#6b4a36'
const STEEL = '#cfd9e6'
const STEEL_SHADE = '#9fb0c4'
const HOT = '#ff7a3d'
const HOT_LIGHT = '#ffd27a'
const GOLD = '#e3b84a'
const WRAP = '#b8453a'
const WRAP_DARK = '#8e2f28'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const WALK = 0.5
const ARRIVE = 1.7
/** 鉄の ぼうを 水に おろしはじめる */
const DIP = 2.6
/** 水に つかって、ジュッ と けむりが出る */
const QUENCH = 3.2
/** 引きあげる */
const LIFT = 4.0
/** つかを つける */
const WRAPPED = 4.75
/** だいに たてかける */
const PROP = 5.1
const INK = 6.5
const DONE = 9.0
const DURATION = 9.6

/* ───────── かたなの かたち ───────── */

type Vec = readonly [number, number]

/** 2画目の はじまり(つかの てっぺん)と おわり(きっさき)。かたなの ながさは この2点の きょり */
const FINAL_HILT: Vec = [49.8, 29.1]
const FINAL_TIP: Vec = [16.6, 86.9]
const CHORD = Math.hypot(FINAL_TIP[0] - FINAL_HILT[0], FINAL_TIP[1] - FINAL_HILT[1])
/** できあがりの かたなの むき(度)。ま右を 0 として、した むきが プラス */
const FINAL_ANGLE = (Math.atan2(FINAL_TIP[1] - FINAL_HILT[1], FINAL_TIP[0] - FINAL_HILT[0]) * 180) / Math.PI
/** 2画目の そり(まっすぐな線から いちばん はなれた ところ)。かたなの そり と 同じ */
const SAG = 8.4
/** つかが 全体の どこまで か(のこりが は) */
const HILT_END = 0.25
/** 手で にぎる ところ(つかの 上のほう と 下のほう) */
const GRIP_NEAR = 0.07
const GRIP_FAR = 0.16

const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/** '#rrggbb' を k の分だけ まぜる(0 = a / 1 = b)。やけた 鉄の いろ の へんか に使う */
function lerpColor(a: string, b: string, k: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
  const mixed = [0, 1, 2].map((i) => Math.round(lerp(channel(a, i), channel(b, i), Math.min(Math.max(k, 0), 1))))
  return `#${mixed.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

type SwordPose = {
  /** つかの てっぺん */
  readonly hilt: Vec
  /** むき(度)。180 = 左むき / FINAL_ANGLE = できあがり */
  readonly angle: number
  /** そり 0 = まっすぐ / 1 = できあがり */
  readonly bend: number
}

/** かたなの 中心線(2次の ベジェ)。u = 0 が つかの てっぺん、1 が きっさき */
function swordCurve({ hilt, angle, bend }: SwordPose) {
  const rad = (angle * Math.PI) / 180
  const dir: Vec = [Math.cos(rad), Math.sin(rad)]
  // そりの ほうこう(できあがりの むき から 右へ 90 度。左むき のときは した)
  const normal: Vec = [dir[1], -dir[0]]
  const tip: Vec = [hilt[0] + dir[0] * CHORD, hilt[1] + dir[1] * CHORD]
  const mid: Vec = [(hilt[0] + tip[0]) / 2, (hilt[1] + tip[1]) / 2]
  const ctrl: Vec = [mid[0] + normal[0] * 2 * SAG * bend, mid[1] + normal[1] * 2 * SAG * bend]
  const at = (u: number): Vec => [(1 - u) ** 2 * hilt[0] + 2 * u * (1 - u) * ctrl[0] + u * u * tip[0], (1 - u) ** 2 * hilt[1] + 2 * u * (1 - u) * ctrl[1] + u * u * tip[1]]
  const tangent = (u: number): Vec => {
    const x = 2 * (1 - u) * (ctrl[0] - hilt[0]) + 2 * u * (tip[0] - ctrl[0])
    const y = 2 * (1 - u) * (ctrl[1] - hilt[1]) + 2 * u * (tip[1] - ctrl[1])
    const len = Math.hypot(x, y) || 1
    return [x / len, y / len]
  }
  return { at, tangent, tip }
}

const SAMPLES = 16
const range = (from: number, to: number): number[] => Array.from({ length: SAMPLES + 1 }, (_, i) => from + ((to - from) * i) / SAMPLES)
const polyline = (points: readonly Vec[]) => points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')

/** 手の ばしょ(つかの うえ) */
function gripPoints(pose: SwordPose): { readonly near: Vec; readonly far: Vec } {
  const curve = swordCurve(pose)
  return { near: curve.at(GRIP_NEAR), far: curve.at(GRIP_FAR) }
}

type SwordProps = { readonly pose: SwordPose; readonly heat: number; readonly wrap: number }

/** かたな。heat = やけて まっか(1)→ ひえて はがね色(0) / wrap = つかを つけた 度合い */
function Sword({ pose, heat, wrap }: SwordProps) {
  const curve = swordCurve(pose)
  const us = range(HILT_END, 1)
  // はば: つばの所は 太く、きっさき に向かって 細くなる(さきが とがる)
  const half = (u: number) => lerp(2.7, 0.35, ((u - HILT_END) / (1 - HILT_END)) ** 1.4)
  const side = (sign: number, scale = 1) =>
    us.map((u): Vec => {
      const p = curve.at(u)
      const tan = curve.tangent(u)
      const w = half(u) * scale * sign
      return [p[0] + tan[1] * w, p[1] - tan[0] * w]
    })
  const edge = side(1)
  const spine = side(-1)
  const body = `${polyline(edge)} L${spine[spine.length - 1][0].toFixed(2)} ${spine[spine.length - 1][1].toFixed(2)} ${polyline([...spine].reverse()).replace('M', 'L')} Z`
  const steel = lerpColor(STEEL, HOT, heat)
  const shade = lerpColor(STEEL_SHADE, HOT, heat)
  const bright = lerpColor('#ffffff', HOT_LIGHT, heat)
  const hiltPoints = range(0, HILT_END).map((u) => curve.at(u))
  const tsuba = curve.at(HILT_END)
  const tsubaTan = curve.tangent(HILT_END)
  const tsubaAngle = (Math.atan2(tsubaTan[1], tsubaTan[0]) * 180) / Math.PI
  return (
    <>
      {heat > 0.01 ? <path d={polyline(us.map((u) => curve.at(u)))} fill="none" stroke={HOT} strokeWidth="9" strokeLinecap="round" opacity={0.32 * heat} /> : null}
      {/* つかの まだ ない 鉄の ぼう(なかご) */}
      <path d={polyline(hiltPoints)} fill="none" stroke={lerpColor('#6d7686', HOT, heat)} strokeWidth="2.8" strokeLinecap="round" />
      <path d={body} fill={steel} />
      <path d={polyline(spine.map(([x, y], i): Vec => lerpVec([x, y], curve.at(us[i]), 0.35)))} fill="none" stroke={shade} strokeWidth="0.9" strokeLinecap="round" />
      <path d={polyline(edge.map(([x, y], i): Vec => lerpVec([x, y], curve.at(us[i]), 0.35)))} fill="none" stroke={bright} strokeWidth="0.8" strokeLinecap="round" opacity="0.9" />
      {wrap > 0 ? (
        <g opacity={wrap}>
          <path d={polyline(hiltPoints)} fill="none" stroke={WRAP} strokeWidth="5" strokeLinecap="round" />
          {[0.04, 0.09, 0.14, 0.19].map((u) => {
            const p = curve.at(u)
            const tan = curve.tangent(u)
            const nx = tan[1]
            const ny = -tan[0]
            return <path key={u} d={`M${p[0] + nx * 2.3 - tan[0] * 0.9} ${p[1] + ny * 2.3 - tan[1] * 0.9} L${p[0] - nx * 2.3 + tan[0] * 0.9} ${p[1] - ny * 2.3 + tan[1] * 0.9}`} stroke={WRAP_DARK} strokeWidth="0.9" strokeLinecap="round" />
          })}
          <circle cx={curve.at(0)[0]} cy={curve.at(0)[1]} r="2.9" fill={GOLD} />
          <ellipse cx={tsuba[0]} cy={tsuba[1]} rx="1.5" ry="5.8" fill={GOLD} stroke="#c79a30" strokeWidth="0.4" transform={`rotate(${tsubaAngle} ${tsuba[0]} ${tsuba[1]})`} />
        </g>
      ) : null}
    </>
  )
}

function lerpVec(a: Vec, b: Vec, k: number): Vec {
  return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]
}

/* ───────── かじやさん ───────── */

type Mood = 'worried' | 'brave' | 'surprised' | 'happy'

/** うで の ながさ(かた→ひじ、ひじ→手) */
const ARM = 17

/** かた と 手 の 場所から、ひじ の 場所を 出す(ひじ は したへ まがる) */
function elbowFor(shoulder: Vec, hand: Vec): Vec {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const dist = Math.max(Math.hypot(dx, dy), 0.01)
  const reach = Math.min(dist, 2 * ARM - 0.2)
  const height = Math.sqrt(Math.max(ARM * ARM - (reach / 2) ** 2, 0))
  const ux = dx / dist
  const uy = dy / dist
  const down = uy >= -ux ? 1 : -1
  const px = uy * down
  const py = -ux * down
  const sign = py >= 0 ? 1 : -1
  return [shoulder[0] + (dx * reach) / dist / 2 + px * sign * height, shoulder[1] + (dy * reach) / dist / 2 + py * sign * height]
}

function ArmLine({ shoulder, hand, color }: { readonly shoulder: Vec; readonly hand: Vec; readonly color: string }) {
  const elbow = elbowFor(shoulder, hand)
  return <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0].toFixed(2)} ${elbow[1].toFixed(2)} L${hand[0].toFixed(2)} ${hand[1].toFixed(2)}`} fill="none" stroke={color} strokeWidth="6.4" strokeLinecap="round" strokeLinejoin="round" />
}

/** 顔(左むき)。気持ちで、目・まゆ・口を かえる */
function Face({ cx, cy, mood }: { readonly cx: number; readonly cy: number; readonly mood: Mood }) {
  const ex = cx - 4.2
  const ey = cy + 0.4
  return (
    <>
      <circle cx={cx - 6.6} cy={cy + 3.6} r="2" fill={CHEEK} opacity="0.55" />
      {mood === 'worried' ? (
        <>
          <path d={`M${ex - 2.4} ${ey - 3.2} l4.4 -1.2`} stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx={ex} cy={ey} r="1.25" fill={EYE} />
          <path d={`M${cx - 8} ${cy + 6.6} q1.6 -1.6 3.2 0 q1.6 1.4 3 -0.2`} fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      ) : null}
      {mood === 'brave' ? (
        <>
          <path d={`M${ex - 2.2} ${ey - 1.6} l3.6 1.6 l-3.6 1.6`} fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M${cx - 8.2} ${cy + 6.4} h5.4`} stroke={MOUTH} strokeWidth="1.3" strokeLinecap="round" />
        </>
      ) : null}
      {mood === 'surprised' ? (
        <>
          <circle cx={ex} cy={ey} r="2.3" fill="#ffffff" stroke={EYE} strokeWidth="0.7" />
          <circle cx={ex - 0.5} cy={ey} r="1.05" fill={EYE} />
          <path d={`M${ex - 2.6} ${ey - 4} l4.6 -0.6`} stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <ellipse cx={cx - 5.8} cy={cy + 6.6} rx="1.5" ry="1.9" fill={MOUTH} />
        </>
      ) : null}
      {mood === 'happy' ? (
        <>
          <path d={`M${ex - 2.1} ${ey + 0.9} Q${ex} ${ey - 1.8} ${ex + 2.1} ${ey + 0.9}`} fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d={`M${cx - 8.6} ${cy + 5.2} Q${cx - 5.6} ${cy + 9.6} ${cx - 2.4} ${cy + 5.6} Z`} fill={MOUTH} />
        </>
      ) : null}
    </>
  )
}

type SmithProps = {
  readonly px: number
  readonly bob: number
  readonly step: number
  readonly mood: Mood
  readonly headTilt: number
  readonly nearHand: Vec
  readonly farHand: Vec
}

/** かた の 場所(人の 足もと から)。てまえの かた・むこうの かた */
const SHOULDER_NEAR: Vec = [70.5, 51.5]
const SHOULDER_FAR: Vec = [74.2, 51.5]
const HEAD_CENTER: Vec = [71.5, 36]

/** 人の からだ(うで・あたま・どう・足)。かたなと 手 は 外で 描く */
function SmithBody({ px, bob, step, mood, headTilt, nearHand, farHand }: SmithProps) {
  const near: Vec = [SHOULDER_NEAR[0] + px, SHOULDER_NEAR[1] + bob]
  const far: Vec = [SHOULDER_FAR[0] + px, SHOULDER_FAR[1] + bob]
  const cx = HEAD_CENTER[0] + px
  const cy = HEAD_CENTER[1] + bob
  return {
    behind: (
      <>
        <ArmLine shoulder={far} hand={farHand} color={TUNIC_FAR} />
        <Layer rotate={step * 17} origin={[px + 74, 74]}>
          <rect x={px + 71.4} y="72" width="6.4" height="21" rx="3.2" fill={PANTS_DARK} />
          <ellipse cx={px + 73} cy="93.4" rx="5.4" ry="2.8" fill={SHOE} />
        </Layer>
        <Layer rotate={-step * 17} origin={[px + 69, 74]}>
          <rect x={px + 66.4} y="72" width="6.4" height="21" rx="3.2" fill={PANTS} />
          <ellipse cx={px + 67.4} cy="93.4" rx="5.4" ry="2.8" fill={SHOE} />
        </Layer>
        <rect x={px + 66.4} y={46 + bob} width="13.4" height="29" rx="6.4" fill={TUNIC} />
        <rect x={px + 66.4} y={62 + bob} width="13.4" height="13" rx="3" fill={APRON} />
        <path d={`M${px + 67.4} ${61.6 + bob} h11.4`} stroke={TUNIC_DARK} strokeWidth="1.5" strokeLinecap="round" />
        <rect x={cx - 2.6} y={cy + 6.4} width="5.4" height="7" rx="2.4" fill={SKIN_SHADE} />
        <Layer rotate={headTilt} origin={[cx + 0.5, cy + 8]}>
          <circle cx={cx} cy={cy} r="9.5" fill={SKIN} />
          <path d={`M${cx - 9} ${cy - 1.5} C${cx - 10} ${cy - 11.5} ${cx + 2} ${cy - 14} ${cx + 8} ${cy - 8} C${cx + 11} ${cy - 4} ${cx + 10.6} ${cy + 4} ${cx + 8.2} ${cy + 8} C${cx + 7.8} ${cy + 0.5} ${cx + 3} ${cy - 5.6} ${cx - 4} ${cy - 5.6} C${cx - 6.6} ${cy - 5.6} ${cx - 8.2} ${cy - 4} ${cx - 9} ${cy - 1.5} Z`} fill={HAIR} />
          {/* はちまき: おでこに ぐるっと まいて、うしろで むすぶ */}
          <path d={`M${cx - 9.2} ${cy - 3} Q${cx} ${cy - 7.4} ${cx + 9.4} ${cy - 3}`} fill="none" stroke={BAND} strokeWidth="2.8" strokeLinecap="round" />
          <path d={`M${cx + 9} ${cy - 3.4} q4 -1.6 6.6 1 M${cx + 9} ${cy - 3.2} q4.4 1.8 5.4 5`} fill="none" stroke={BAND} strokeWidth="1.8" strokeLinecap="round" />
          <Face cx={cx} cy={cy} mood={mood} />
        </Layer>
      </>
    ),
    front: <ArmLine shoulder={near} hand={nearHand} color={TUNIC_DARK} />,
  }
}

/* ───────── まわりの もの ───────── */

function Room({ t }: SceneProps) {
  const pop = span(t, 0, 0.6, backOut)
  return (
    <>
      <rect x="-2" y="-2" width="113" height="88" fill={WALL} />
      {[18, 40, 62, 84, 104].map((x) => (
        <path key={x} d={`M${x} 0 V86`} stroke={WALL_LINE} strokeWidth="0.8" />
      ))}
      <rect x="-2" y="84" width="113" height="27" fill={FLOOR} />
      <rect x="-2" y="84" width="113" height="2.2" fill={FLOOR_EDGE} />
      {/* かたなを たてかける だい(1画目) */}
      <Layer scale={pop} origin={[55, 84]}>
        <ellipse cx="67" cy="85.4" rx="12" ry="2" fill="#000000" opacity="0.1" />
        <Bone char={CHAR} n={1} color={BARK} width={5.4} />
      </Layer>
    </>
  )
}

/** 水の おけ(ながい はこ)。うしろの ふち・かたな・まえの かべ の じゅんに 重ねる */
function TubBack({ t }: SceneProps) {
  const pop = span(t, 0.1, 0.65, backOut)
  return (
    <Layer scale={pop} origin={[33, 90]}>
      <ellipse cx="33" cy="70" rx="31" ry="3.6" fill={TUB_DARK} />
      <ellipse cx="33" cy="70.2" rx="29" ry="2.8" fill={WATER} />
      <ellipse cx="25" cy="69.6" rx="9" ry="0.9" fill={WATER_LIGHT} />
    </Layer>
  )
}

function TubFront({ t }: SceneProps) {
  const pop = span(t, 0.1, 0.65, backOut)
  return (
    <Layer scale={pop} origin={[33, 90]}>
      <path d="M2 70 Q33 76 64 70 V88 Q64 91 61 91 H5 Q2 91 2 88 Z" fill={TUB} />
      <path d="M2 79 Q33 85 64 79 V81.4 Q33 87.4 2 81.4 Z" fill={TUB_BAND} />
      <path d="M2 70 Q33 76 64 70" fill="none" stroke={TUB_DARK} strokeWidth="1.2" />
    </Layer>
  )
}

/** ジュッ と ひやした ときの けむり。おけの上から ふわっと のぼる */
function Steam({ t }: SceneProps) {
  const show = during(t, QUENCH, LIFT + 1.2, 0.25)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const p = ((t - QUENCH + i * 0.3) % 1.8) / 1.8
        const x = 8 + i * 9.4 + Math.sin(p * 6 + i) * 2.2
        const y = 68 - p * 30
        return <circle key={i} cx={x} cy={y} r={2.6 + p * 4.2} fill="#ffffff" stroke="#d5e1ee" strokeWidth="0.6" opacity={Math.sin(p * Math.PI) * 0.92} />
      })}
    </g>
  )
}

/** かたなから ぽたぽた おちる 水 */
function Drips({ t }: SceneProps) {
  const show = during(t, LIFT + 0.2, WRAPPED + 0.5, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 1, 2].map((i) => {
        const p = ((t - LIFT + i * 0.27) % 0.8) / 0.8
        return <path key={i} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill={WATER} transform={`translate(${10 + i * 15} ${62 + p * 8})`} opacity={1 - p} />
      })}
    </g>
  )
}

/** あつくて でる あせ(おでこから ほほへ) */
function Sweat({ t, px }: SceneProps & { readonly px: number }) {
  const show = during(t, WALK + 0.3, DIP + 0.2, 0.2)
  if (show <= 0) return null
  const p = ((t * 1.1) % 1) / 1
  return <path d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill={WATER} opacity={show * (1 - p * 0.6)} transform={`translate(${px + 79.6} ${31 + p * 6})`} />
}

/** かたなの 上を すべる きらり */
function Glint({ t, pose }: { readonly t: number; readonly pose: SwordPose }) {
  const p = span(t, PROP + 0.9, INK - 0.2)
  if (p <= 0 || p >= 1) return null
  const [x, y] = swordCurve(pose).at(lerp(0.35, 0.92, p))
  return <Star cx={x + 1.5} cy={y} r={3.8 * Math.sin(p * Math.PI)} color="#ffffff" spin={p * 120} />
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 2)

  // あるいてくる: 右から 入って、おけの そばで とまる
  const walking = 1 - span(t, ARRIVE - 0.25, ARRIVE)
  const stride = t < WALK ? 0 : Math.sin((t - WALK) * Math.PI * 2 * 1.7) * walking
  const bob = -Math.abs(stride) * 1.4
  const walkX = mix(t, WALK, ARRIVE, 40, 0, easeOut)
  // だいに たてかけるとき、かたなを とどかせるため 一歩 左へ
  const step = mix(t, PROP, PROP + 1.0, 0, -3)
  const px = walkX + step

  // かたな: まっかな まっすぐな 鉄の ぼう → 水で ひえて そる → つかを つけて だいへ
  const lower = span(t, DIP, QUENCH, easeInOut) - span(t, LIFT, LIFT + 0.6, easeInOut)
  const toStand = span(t, PROP, PROP + 1.0, easeInOut)
  const hold: Vec = [58 + walkX, 60 + 11.5 * lower + bob * 0.5]
  const finalGrip: Vec = [FINAL_HILT[0] + Math.cos((FINAL_ANGLE * Math.PI) / 180) * GRIP_NEAR * CHORD, FINAL_HILT[1] + Math.sin((FINAL_ANGLE * Math.PI) / 180) * GRIP_NEAR * CHORD]
  const gripAt = lerpVec(hold, finalGrip, toStand)
  const angle = lerp(180, FINAL_ANGLE, toStand)
  const rad = (angle * Math.PI) / 180
  // つかの てっぺん = にぎる所 から つかの 上のほうへ
  const hilt: Vec = [gripAt[0] - Math.cos(rad) * GRIP_NEAR * CHORD, gripAt[1] - Math.sin(rad) * GRIP_NEAR * CHORD]
  const pose: SwordPose = { hilt, angle, bend: span(t, QUENCH + 0.4, LIFT + 0.8, easeInOut) }
  const heat = 1 - span(t, QUENCH, LIFT + 0.6)
  const wrap = span(t, WRAPPED, WRAPPED + 0.3)
  const hands = gripPoints(pose)
  const sword = (
    <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
      <Sword pose={pose} heat={heat} wrap={wrap} />
    </Layer>
  )

  const mood: Mood = t < QUENCH - 0.1 ? 'worried' : t < LIFT ? 'brave' : t < WRAPPED ? 'surprised' : 'happy'
  const headTilt = mood === 'worried' ? 2 : mood === 'brave' ? -3 : mood === 'surprised' ? -4 : 3 * Math.min(1, toStand + 0.3)
  const smith = SmithBody({ px, bob, step: stride, mood, headTilt, nearHand: hands.near, farHand: hands.far })
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const pop = Math.sin(span(t, WRAPPED, WRAPPED + 0.4) * Math.PI)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Room t={t} />
        <TubBack t={t} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <ellipse cx={px + 73} cy="94.4" rx="11" ry="2.4" fill="#000000" opacity="0.12" />
          {smith.behind}
          {smith.front}
        </Layer>
        {/* 水に つかっている間は おけの かべの うしろ。引きあげたら おけの まえに出す */}
        {t < LIFT + 0.5 ? sword : null}
        <TubFront t={t} />
        {t >= LIFT + 0.5 ? sword : null}
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <circle cx={hands.far[0]} cy={hands.far[1]} r="3.5" fill={SKIN_SHADE} />
          <circle cx={hands.near[0]} cy={hands.near[1]} r="3.6" fill={SKIN} />
          <Sweat t={t} px={px} />
        </Layer>
        <Steam t={t} />
        <Drips t={t} />
        {pop > 0 ? <Star cx={hands.near[0] + 2} cy={hands.near[1] - 6} r={4 * pop} color={GOLD} spin={pop * 90} /> : null}
        <Glint t={t} pose={pose} />
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
    { at: 0, label: 'かじばが できる', sound: 'pop' },
    { at: WALK, label: 'かじやさんが まっかな 鉄の ぼうを もって くる' },
    { at: DIP, label: '水の おけに おろす' },
    { at: QUENCH, label: 'ジュッ と ひやす。けむりが ふわっ', sound: 'pop' },
    { at: LIFT, label: '引きあげると、はが そっている' },
    { at: PROP, label: 'つかを つけて、だいに たてかける' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '刀 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
