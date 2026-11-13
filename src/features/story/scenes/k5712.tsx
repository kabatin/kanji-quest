/*
 * 園(えん): かこい(囗)の中の にわ。うさぎが こない よう、さくで ぐるりと かこむ。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)      … 左の さく
 *   2画目(コ)      … 上の さく と 右の さく(つながった 1本の さく)
 *   13画目(一)     … 下の さく
 *   3〜12画目(袁)  … かこいの 中の にわ。子どもが たち、花が さく(ほね が ひかるとき、中の ものが 字の まんなかに あつまる)
 *
 * ながれ
 *   はたけに 子どもと 花。左はしの 芽を、うさぎが たべに くる → 子どもは こまる
 *   → 子どもが かなづち で トントン、上・右・下・左 の じゅんに さくを たてる(うさぎは 左の あき から にげる)
 *   → さいごの 左の さくで ぐるりと かこめた → じょうろで 水を やると 芽が 花に そだつ
 *   → ほね が ひかって、絵が うすくなり、字「園」が のこる
 *
 * 子どもと うさぎは、ほんものの つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく どう の上。うさぎは 長い耳、ちいさな しっぽ。
 *   さく は、はたけを ぐるりと かこむ 四角い かこい(上から見た 形)。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '園'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#f2a03d'
const SHIRT_DARK = '#d98a2a'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const FENCE = '#b57a45'
const FENCE_DARK = '#8c5b3c'
const LAWN = '#dff0c8'
const SOIL = '#c99a6b'
const SOIL_DARK = '#b3835a'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const SUN = '#ffd24a'
const RABBIT = '#cdbba7'
const RABBIT_DARK = '#b3a08c'
const RABBIT_EAR = '#f1b5b5'
const CAN = '#5aaee8'
const CAN_DARK = '#3f8cc8'
const DROP = '#7cc4f2'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'

/** くぎり の時間(秒) */
const RABBIT_IN = 1.2
const NIBBLE = 2.5
const WORRY = 1.8
const IDEA = 3.0
const SCARE = 3.8
/** かなづち で たたく しゅんかん: 上・右・下・左 の さく */
const HITS = [3.8, 4.2, 4.6, 5.0] as const
const RAISE = 3.3
const WATER = 5.6
const WATER_END = 6.8
const INK = 7.0
const DONE = 10.2
const DURATION = 10.8

/** 子どもの まんなか(x)。子どもは この線を じく に、左右対称に 描く */
const KX = 58
const ARM_LEN = 8
const SHOULDER_L: readonly [number, number] = [-5.6, 51.5]
const SHOULDER_R: readonly [number, number] = [5.6, 51.5]
const FEET_Y = 88
/** 芽(左はし の 1本)の いち。うさぎが たべに くる */
const SPROUT_X = 30
const GROUND_Y = 88

const rad = (deg: number) => (deg * Math.PI) / 180
const lerp = (a: number, b: number, p: number) => a + (b - a) * p

/** うで の かっこう。swing = ま下から 右へ ふった角度 / bend = ひじ の まがり */
type ArmPose = { readonly swing: number; readonly bend: number }

/** かた → ひじ → 手 の いち(子どもの まんなか が x=0) */
function armGeom(shoulder: readonly [number, number], pose: ArmPose) {
  const elbow = [shoulder[0] + Math.sin(rad(pose.swing)) * ARM_LEN, shoulder[1] + Math.cos(rad(pose.swing)) * ARM_LEN] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] + Math.sin(rad(fore)) * ARM_LEN, elbow[1] + Math.cos(rad(fore)) * ARM_LEN] as const
  return { elbow, hand, fore }
}

/** かなづち を ふる うで。ふりあげて、ふりおろす(HITS の しゅんかんに 当たる) */
function hammerPose(t: number): ArmPose {
  const REST = 12
  const UP = 150
  const HIT = 40
  const toBend = (a: number) => 10 + ((a - REST) * 15) / (UP - REST)
  const make = (a: number): ArmPose => ({ swing: a, bend: toBend(a) })
  if (t < RAISE) return make(REST)
  const next = HITS.findIndex((h) => h > t)
  if (next < 0) return make(mix(t, HITS[HITS.length - 1], HITS[HITS.length - 1] + 0.5, HIT, REST, easeInOut))
  const start = next === 0 ? RAISE : HITS[next - 1]
  const hit = HITS[next]
  const strikeFrom = hit - 0.1
  if (t >= strikeFrom) return make(lerp(UP, HIT, easeIn(span(t, strikeFrom, hit))))
  return make(lerp(next === 0 ? REST : HIT, UP, span(t, start, strikeFrom, easeOut)))
}

/** かなづち が 当たる 場所(画面の 座標)。どの回も 同じ 姿勢で 当たる */
const HIT_POSE = hammerPose(HITS[0])
const HIT_GEOM = armGeom(SHOULDER_R, HIT_POSE)
const HIT_POINT: readonly [number, number] = [
  KX + HIT_GEOM.hand[0] + Math.sin(rad(HIT_GEOM.fore)) * 9,
  HIT_GEOM.hand[1] + Math.cos(rad(HIT_GEOM.fore)) * 9,
]

type Mood = 'smile' | 'worried' | 'determined' | 'happy'

/* ───────── にわ ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  const soil = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[9, 9]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="8.3" y="0.8" width="1.4" height="3" rx="0.7" fill={SUN} transform={`rotate(${i * 45} 9 9)`} />
        ))}
      </Layer>
      <circle cx="9" cy="9" r={4.8 * sun} fill={SUN} />
      <rect x="3" y="12" width="103" height="87" rx="12" fill={LAWN} />
      <Layer scaleY={soil} origin={[54.5, 94]}>
        <rect x="20" y="21" width="69" height="73" rx="5" fill={SOIL} />
        {/* つちの もりあがり(すじ では なく 点で) */}
        {[
          [30, 30],
          [44, 26],
          [70, 30],
          [80, 44],
          [27, 60],
          [82, 62],
          [37, 78],
          [78, 80],
        ].map(([x, y]) => (
          <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="2.6" ry="1.3" fill={SOIL_DARK} />
        ))}
      </Layer>
    </>
  )
}

/** 花の 芽。size 0〜1(おおきいほど そだつ)。0.7 を こえると 花が ひらく。 */
function Plant({ x, size, color }: { readonly x: number; readonly size: number; readonly color: string }) {
  const s = Math.max(0, size)
  const height = 14 * s
  const top = GROUND_Y - height
  const bloom = Math.min(1, Math.max(0, (s - 0.68) / 0.3))
  return (
    <>
      <ellipse cx={x} cy={GROUND_Y + 0.4} rx="4.6" ry="1.8" fill={SOIL_DARK} />
      <path d={`M${x} ${GROUND_Y} Q${x + 0.8} ${GROUND_Y - height * 0.5} ${x} ${top}`} fill="none" stroke={LEAF_DARK} strokeWidth="1.6" strokeLinecap="round" />
      <ellipse cx={x - 2.8 * s} cy={GROUND_Y - height * 0.45} rx={3 * s} ry={1.5 * s} fill={LEAF} transform={`rotate(-25 ${x - 2.8 * s} ${GROUND_Y - height * 0.45})`} />
      <ellipse cx={x + 2.8 * s} cy={GROUND_Y - height * 0.62} rx={3 * s} ry={1.5 * s} fill={LEAF} transform={`rotate(25 ${x + 2.8 * s} ${GROUND_Y - height * 0.62})`} />
      {bloom <= 0 ? (
        <circle cx={x} cy={top} r={1.8 * s + 0.4} fill={LEAF} />
      ) : (
        <g transform={`translate(${x} ${top}) scale(${bloom})`}>
          {Array.from({ length: 5 }, (_, i) => (
            <circle key={i} cx={Math.cos(rad(i * 72 - 90)) * 2.9} cy={Math.sin(rad(i * 72 - 90)) * 2.9} r="2.3" fill={color} />
          ))}
          <circle r="1.9" fill="#ffd24a" />
        </g>
      )}
    </>
  )
}

/* ───────── うさぎ ───────── */

/** 足もと が 0,0 の うさぎ(あたまが 左むき)。headDown 0〜1 で 芽を たべる */
function Rabbit({ headDown, chew }: { readonly headDown: number; readonly chew: number }) {
  return (
    <>
      <circle cx="6.4" cy="-5.6" r="2.2" fill="#ffffff" />
      <ellipse cx="0" cy="-5" rx="6.2" ry="4.4" fill={RABBIT} />
      <ellipse cx="-1" cy="-3.4" rx="4" ry="2.2" fill="#ece3d8" />
      <ellipse cx="2.8" cy="-2.2" rx="3.4" ry="2.4" fill={RABBIT_DARK} />
      <rect x="-4.8" y="-4" width="2" height="4" rx="1" fill={RABBIT_DARK} />
      <Layer rotate={headDown * 26} origin={[-4.6, -7]}>
        <ellipse cx="-4.6" cy="-13.6" rx="1.3" ry="3.8" fill={RABBIT_DARK} transform="rotate(14 -4.6 -13.6)" />
        <ellipse cx="-6.2" cy="-13.8" rx="1.3" ry="3.9" fill={RABBIT} transform="rotate(-8 -6.2 -13.8)" />
        <ellipse cx="-6.2" cy="-13.8" rx="0.55" ry="2.7" fill={RABBIT_EAR} transform="rotate(-8 -6.2 -13.8)" />
        <ellipse cx="-6.8" cy="-8.4" rx={3.5} ry={3 + chew * 0.35} fill={RABBIT} />
        <circle cx="-9.9" cy="-8.1" r="0.8" fill="#e58a8a" />
        <circle cx="-7.7" cy="-9.4" r="0.65" fill={EYE} />
        <circle cx="-5.2" cy="-7.2" r="1.1" fill="#ff9d9d" opacity="0.5" />
      </Layer>
    </>
  )
}

/* ───────── 子ども ───────── */

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="-5.6" cy="41.4" r="1.8" fill="#ff9d9d" opacity="0.55" />
      <circle cx="5.6" cy="41.4" r="1.8" fill="#ff9d9d" opacity="0.55" />
      {mood === 'happy' ? (
        <>
          <path d="M-4.9 38.8 Q-3.3 36.6 -1.7 38.8 M1.7 38.8 Q3.3 36.6 4.9 38.8" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M-2.6 41.8 Q0 46 2.6 41.8 Z" fill={MOUTH} />
        </>
      ) : (
        <>
          <circle cx="-3.3" cy="38.8" r="1.15" fill={EYE} />
          <circle cx="3.3" cy="38.8" r="1.15" fill={EYE} />
          {mood === 'worried' && (
            <>
              <path d="M-5.2 35.6 L-2 34.6 M5.2 35.6 L2 34.6" fill="none" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
              <ellipse cx="0" cy="43" rx="1.3" ry="1.7" fill={MOUTH} />
            </>
          )}
          {mood === 'determined' && (
            <>
              <path d="M-5.2 34.6 L-2 35.8 M5.2 34.6 L2 35.8" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
              <path d="M-1.8 42.8 H1.8" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
            </>
          )}
          {mood === 'smile' && <path d="M-2.4 42 Q0 44.4 2.4 42" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />}
        </>
      )}
    </>
  )
}

/** かた から出て、ひじ で まがる うで。手に さきの ものを もたせる。 */
function Arm({ shoulder, pose, children }: { readonly shoulder: readonly [number, number]; readonly pose: ArmPose; readonly children?: (hand: readonly [number, number], fore: number) => React.ReactNode }) {
  const { elbow, hand, fore } = armGeom(shoulder, pose)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={SHIRT_DARK} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.9" fill={SKIN} />
      {children?.(hand, fore)}
    </>
  )
}

/** かなづち。手が にぎった ところから、うでの むき に そって のびる(あたまが さき) */
function Hammer({ hand, fore }: { readonly hand: readonly [number, number]; readonly fore: number }) {
  return (
    <g transform={`translate(${hand[0]} ${hand[1]}) rotate(${-fore})`}>
      <rect x="-1" y="-2" width="2" height="11" rx="1" fill={FENCE_DARK} />
      <rect x="-4.2" y="7.4" width="8.4" height="4.2" rx="1.2" fill="#8a96a6" />
      <rect x="-4.2" y="7.4" width="8.4" height="1.4" rx="0.7" fill="#b9c3d0" />
    </g>
  )
}

/** じょうろ。ななめに かたむけて 水を そそぐ。 */
function WateringCan({ hand }: { readonly hand: readonly [number, number] }) {
  return (
    <g transform={`translate(${hand[0]} ${hand[1]}) rotate(-35)`}>
      <path d="M-3.5 1.5 L-9.2 -3" stroke={CAN_DARK} strokeWidth="1.8" strokeLinecap="round" />
      <ellipse cx="-9.6" cy="-3.3" rx="1" ry="2" fill={CAN_DARK} />
      <path d="M2.6 -3 Q6.4 -3 6.4 1 Q6.4 4.4 3.6 4.4" fill="none" stroke={CAN_DARK} strokeWidth="1.3" strokeLinecap="round" />
      <rect x="-4" y="-3.2" width="8.2" height="7.4" rx="1.6" fill={CAN} />
      <rect x="-4" y="1.2" width="8.2" height="3" rx="1.4" fill={CAN_DARK} />
    </g>
  )
}

type KidProps = {
  readonly mood: Mood
  readonly left: ArmPose
  readonly right: ArmPose
  readonly hammer: number
  readonly can: number
  readonly tilt: number
}

function Kid({ mood, left, right, hammer, can, tilt }: KidProps) {
  return (
    <>
      <rect x="-5.2" y="68" width="4.4" height="18.5" rx="2.2" fill={PANTS} />
      <rect x="0.8" y="68" width="4.4" height="18.5" rx="2.2" fill={PANTS} />
      <ellipse cx="-3.4" cy="86.8" rx="4.4" ry="2.4" fill={SHOE} />
      <ellipse cx="3.4" cy="86.8" rx="4.4" ry="2.4" fill={SHOE} />
      {/* くび: どう と あたま の間を みじかく つなぐ */}
      <rect x="-2.2" y="43" width="4.4" height="6" rx="2" fill={SKIN_SHADE} />
      <rect x="-6.5" y="47" width="13" height="23" rx="5.5" fill={SHIRT} />
      <path d="M-5 63 h10" stroke={SHIRT_DARK} strokeWidth="1.4" strokeLinecap="round" />
      <Arm shoulder={SHOULDER_L} pose={left}>
        {(hand) => (can > 0 ? <Layer opacity={can}><WateringCan hand={hand} /></Layer> : null)}
      </Arm>
      <Arm shoulder={SHOULDER_R} pose={right}>
        {(hand, fore) => (hammer > 0 ? <Layer opacity={hammer}><Hammer hand={hand} fore={fore} /></Layer> : null)}
      </Arm>
      <Layer rotate={tilt} origin={[0, 44]}>
        <circle cx="-8.2" cy="39.4" r="1.9" fill={SKIN} />
        <circle cx="8.2" cy="39.4" r="1.9" fill={SKIN} />
        <circle cx="0" cy="38" r="8.4" fill={SKIN} />
        <path d="M-8.6 36 C-9.2 28 -3 25.4 0 25.6 C4 25.4 9.2 28 8.6 36 C6 32 3 31 0 31.3 C-3 31 -6 32 -8.6 36 Z" fill={HAIR} />
        <path d="M2 26.4 Q3.2 22.6 5 25 Q6 22 7 25.4" fill="none" stroke={HAIR} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

/* ───────── かこい(さく) ───────── */

type SideProps = { readonly t: number; readonly at: number; readonly dx: number; readonly dy: number; readonly children: React.ReactNode }

/** さくが 上から・よこから どすん と おちて くる */
function Side({ t, at, dx, dy, children }: SideProps) {
  const drop = 1 - span(t, at - 0.14, at + 0.1, backOut)
  return (
    <Layer opacity={span(t, at - 0.14, at - 0.02)} x={dx * drop} y={dy * drop}>
      {children}
    </Layer>
  )
}

function Rail({ n, from, to }: { readonly n: number; readonly from?: number; readonly to?: number }) {
  return (
    <>
      <Bone char={CHAR} n={n} color={FENCE_DARK} width={6.6} from={from} to={to} />
      <Bone char={CHAR} n={n} color={FENCE} width={4.4} from={from} to={to} />
    </>
  )
}

function Post({ cx, cy }: { readonly cx: number; readonly cy: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r="4.6" fill={FENCE_DARK} />
      <circle cx={cx} cy={cy} r="3.1" fill={FENCE} />
    </>
  )
}

function Fence({ t }: SceneProps) {
  const [top, right, bottom, left] = HITS
  return (
    <>
      <Side t={t} at={top} dx={0} dy={-16}>
        <Rail n={2} to={0.5} />
        <Post cx={19.6} cy={19.8} />
        <Post cx={89.4} cy={19} />
      </Side>
      <Side t={t} at={right} dx={16} dy={0}>
        <Rail n={2} from={0.49} />
        <Post cx={88.8} cy={91.5} />
      </Side>
      <Side t={t} at={bottom} dx={0} dy={16}>
        <Rail n={13} />
        <Post cx={20.4} cy={93.2} />
      </Side>
      <Side t={t} at={left} dx={-16} dy={0}>
        <Rail n={1} />
      </Side>
    </>
  )
}

/* ───────── にぎやかし ───────── */

/** かなづち が 当たった しゅんかんの わ */
function Impact({ t }: SceneProps) {
  return (
    <>
      {HITS.map((h) => {
        const q = span(t, h, h + 0.28, easeOut)
        if (q <= 0 || q >= 1) return null
        return (
          <g key={h} opacity={1 - q}>
            <ellipse cx={HIT_POINT[0]} cy={HIT_POINT[1] + 1} rx={2 + 7 * q} ry={1 + 2.4 * q} fill="none" stroke="#ffffff" strokeWidth="1.2" />
            <circle cx={HIT_POINT[0] - 3 - 4 * q} cy={HIT_POINT[1] - 3 * q} r="0.9" fill="#ffffff" />
            <circle cx={HIT_POINT[0] + 3 + 4 * q} cy={HIT_POINT[1] - 3.4 * q} r="0.9" fill="#ffffff" />
          </g>
        )
      })}
    </>
  )
}

/** 「!」 を ひらめく しゅんかん、子どもの あたまの上に */
function Alert({ t }: SceneProps) {
  const show = during(t, IDEA, IDEA + 0.5, 0.12)
  if (show <= 0) return null
  const pop = backOut(span(t, IDEA, IDEA + 0.2))
  return (
    <Layer opacity={show} scale={pop} origin={[KX + 12, 25]}>
      <rect x={KX + 10.9} y="14" width="2.4" height="8" rx="1.2" fill="#e8534a" />
      <circle cx={KX + 12.1} cy="25" r="1.4" fill="#e8534a" />
    </Layer>
  )
}

/** こまっている あいだの あせ */
function Sweat({ t }: SceneProps) {
  const show = during(t, WORRY + 0.1, SCARE, 0.2)
  if (show <= 0) return null
  const p = ((t * 1.3) % 1)
  return <path d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill={DROP} opacity={show * (1 - p)} transform={`translate(${KX + 10.5} ${30 + p * 6})`} />
}

/** じょうろ から ふる 水 */
function WaterDrops({ t, tip }: SceneProps & { readonly tip: readonly [number, number] }) {
  const show = during(t, WATER, WATER_END, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show} fill={DROP}>
      {Array.from({ length: 6 }, (_, i) => {
        const p = (t * 1.5 + i / 6) % 1
        return <ellipse key={i} cx={tip[0] - 1.5 + i * 1.5 * p} cy={tip[1] + p * p * 20} rx="0.8" ry="1.3" opacity={1 - p * 0.4} />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 13)

  // 子ども: ぽん と あらわれる。きもちは こまる → きりっ → ほっ → うれしい
  const kidIn = span(t, 0.25, 0.85, backOut)
  const mood: Mood = t < WORRY ? 'smile' : t < SCARE - 0.1 ? 'worried' : t < 5.2 ? 'determined' : t < 5.9 ? 'smile' : 'happy'
  const shake = t >= WORRY && t < RAISE ? wave(t, 0.3) * 6 : 0
  const joy = span(t, 6.0, 6.8)
  const jump = Math.abs(Math.sin(joy * Math.PI * 2)) * 3.2 * (joy > 0 && joy < 1 ? 1 : 0)

  // うで: こまると ゆれる。かなづち を ふる。さいごに じょうろ で 水を やる
  const hammerOn = span(t, RAISE - 0.15, RAISE) * (1 - span(t, 5.15, 5.4))
  const right: ArmPose = t < RAISE ? { swing: 12 + shake, bend: 10 } : hammerPose(t)
  const pour = span(t, 5.2, 5.7, easeInOut) * (1 - span(t, WATER_END, WATER_END + 0.35))
  const canOn = span(t, 5.2, 5.4) * (1 - span(t, WATER_END, WATER_END + 0.3))
  const left: ArmPose = { swing: lerp(-12 - shake, -75, pour), bend: lerp(-10, -10, pour) }
  const leftHand = armGeom(SHOULDER_L, left).hand
  const tip: readonly [number, number] = [KX + leftHand[0] - 9.5, leftHand[1] + 2.8]

  // うさぎ: 左から はねて きて、芽を たべる。かなづち の 音に びっくり して 左へ にげる
  const come = span(t, RABBIT_IN, NIBBLE - 0.1, easeOut)
  const flee = span(t, SCARE + 0.1, 4.8)
  const rabbitX = flee > 0 ? lerp(20, -16, flee) : lerp(-10, 20, come)
  const hopWave = flee > 0 && flee < 1 ? flee * 5 : come < 1 ? come * 4 : 0
  const startle = Math.sin(span(t, SCARE, SCARE + 0.25) * Math.PI) * 5
  const hop = (flee > 0 && flee < 1) || (come > 0 && come < 1) ? Math.abs(Math.sin(hopWave * Math.PI)) * 5 : 0
  const nibbling = t >= NIBBLE && t < SCARE
  const headDown = nibbling ? 0.75 + 0.2 * wave(t, 0.4) : 0
  const chew = nibbling ? wave(t, 0.4) : 0
  const rabbitShown = t >= RABBIT_IN && rabbitX > -15

  // 左の 芽: たべられて ちいさく なり、水で 花に そだつ
  const bite = span(t, NIBBLE + 0.1, SCARE - 0.3)
  const grow = span(t, WATER + 0.1, WATER_END - 0.2, backOut)
  const sprout = lerp(0.55 - 0.3 * bite, 1, grow)

  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.05

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Layer opacity={span(t, 0.3, 0.7)}>
          <Plant x={SPROUT_X} size={sprout} color="#ff8fb1" />
          <Plant x={70} size={1} color="#ffd24a" />
          <Plant x={77.5} size={1} color="#ffffff" />
        </Layer>
        {rabbitShown && (
          <Layer x={rabbitX + 8} y={GROUND_Y + 1 - hop - startle} scaleX={flee > 0 ? 1 : -1}>
            <Rabbit headDown={headDown} chew={chew} />
          </Layer>
        )}
        <Fence t={t} />
        <Layer x={KX} y={-jump} opacity={span(t, 0.25, 0.5)} scale={kidIn} origin={[0, FEET_Y]}>
          <Kid mood={mood} left={left} right={right} hammer={hammerOn} can={canOn} tilt={mood === 'worried' ? -4 : mood === 'happy' ? 3 : 0} />
        </Layer>
        <Impact t={t} />
        <Alert t={t} />
        <Sweat t={t} />
        <WaterDrops t={t} tip={tip} />
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
    { at: 0, label: 'はたけに 子どもと 花', sound: 'pop' },
    { at: RABBIT_IN, label: 'うさぎが 芽を たべに くる。子どもは こまる' },
    { at: RAISE, label: 'かなづち で トントン。さくを たてる', sound: 'pop' },
    { at: HITS[3], label: 'ぐるりと かこめた' },
    { at: WATER, label: '水を やると、芽が 花に そだつ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '園 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
