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
 * 子どもは Person(共通部品)。かなづち・じょうろ は 手に もつ 1回きりの 物なので、
 *   手の 場所(personRig)に 合わせて 場面で 描き、held で わたす。うさぎ(動物)は 部品が ないので 元の絵のまま。
 *   さく は、はたけを ぐるりと かこむ 四角い かこい(上から見た 形)。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { CLOTHES, Flower, LOOKS, mixLimb, Notice, Person, personRig, Sun, Sweat, type Expression, type Limb } from '../sceneFigures'

const CHAR = '園'

const FENCE = '#b57a45'
const FENCE_DARK = '#8c5b3c'
const LAWN = '#dff0c8'
const SOIL = '#c99a6b'
const SOIL_DARK = '#b3835a'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const RABBIT = '#cdbba7'
const RABBIT_DARK = '#b3a08c'
const RABBIT_EAR = '#f1b5b5'
const CAN = '#5aaee8'
const CAN_DARK = '#3f8cc8'
const DROP = '#7cc4f2'
const EYE = '#2b2b2b'

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

/** 子どもの まんなか(こし の x)と 足もと、せたけ */
const KX = 58
const FEET_Y = 88
const KID_HEIGHT = 56
/** 芽(左はし の 1本)の いち。うさぎが たべに くる */
const SPROUT_X = 30
const GROUND_Y = 88

const rad = (deg: number) => (deg * Math.PI) / 180
const lerp = (a: number, b: number, p: number) => a + (b - a) * p

type Pt = readonly [number, number]
type Mood = 'smile' | 'worried' | 'determined' | 'happy'

/** 右手(画面の 右)の うで: かなづち の ふりあげ・ふりおろし の 手の 場所 */
const HAMMER_UP: Limb = { to: [KX + 10, 31] }
const HAMMER_HIT: Limb = { to: [KX + 16, 56] }
/** 左手(画面の 左)で じょうろ を かたむける とき の 手 */
const CAN_HAND: Pt = [KX - 17, 50]

/** かなづち を ふる うで。ふりあげて、ふりおろす(HITS の しゅんかんに 当たる) */
function hammerArm(t: number, rest: Limb): Limb {
  if (t < RAISE) return rest
  const next = HITS.findIndex((h) => h > t)
  const last = HITS[HITS.length - 1]
  if (next < 0) return mixLimb(HAMMER_HIT, rest, easeInOut(span(t, last, last + 0.5)))
  const start = next === 0 ? RAISE : HITS[next - 1]
  const hit = HITS[next]
  const strikeFrom = hit - 0.1
  if (t >= strikeFrom) return mixLimb(HAMMER_UP, HAMMER_HIT, easeIn(span(t, strikeFrom, hit)))
  return mixLimb(next === 0 ? rest : HAMMER_HIT, HAMMER_UP, span(t, start, strikeFrom, easeOut))
}

/* ───────── にわ ───────── */

function Ground({ t }: SceneProps) {
  const soil = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Sun t={t} x={9} y={9} r={4.8} />
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

const FACES: Readonly<Record<Mood, Expression>> = { smile: 'smile', worried: 'worried', determined: 'strain', happy: 'joy' }

/** かなづち。手が にぎった ところから、うでの むき に そって のびる(あたまが さき) */
function Hammer({ hand, angle }: { readonly hand: Pt; readonly angle: number }) {
  return (
    <g transform={`translate(${hand[0]} ${hand[1]}) rotate(${angle})`}>
      <rect x="-2" y="-1" width="11" height="2" rx="1" fill={FENCE_DARK} />
      <rect x="7.4" y="-4.2" width="4.2" height="8.4" rx="1.2" fill="#8a96a6" />
      <rect x="10.2" y="-4.2" width="1.4" height="8.4" rx="0.7" fill="#b9c3d0" />
    </g>
  )
}

/** じょうろ。ななめに かたむけて 水を そそぐ。 */
function WateringCan({ hand }: { readonly hand: Pt }) {
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

/** 子どもの 場所・かっこう・きもち(正面)。うで は 点({ to })と 角度で。 */
function kidAt(t: number) {
  const mood: Mood = t < WORRY ? 'smile' : t < SCARE - 0.1 ? 'worried' : t < 5.2 ? 'determined' : t < 5.9 ? 'smile' : 'happy'
  const shake = t >= WORRY && t < RAISE ? wave(t, 0.3) * 6 : 0
  const joy = span(t, 6.0, 6.8)
  const jump = Math.abs(Math.sin(joy * Math.PI * 2)) * 3.2 * (joy > 0 && joy < 1 ? 1 : 0)
  // 右手(画面の 右)で かなづち、左手(画面の 左)で じょうろ
  const pour = span(t, 5.2, 5.7, easeInOut) * (1 - span(t, WATER_END, WATER_END + 0.35))
  const hang: Limb = { swing: 12 + shake, bend: 10 }
  const tilt = mood === 'worried' ? -4 : mood === 'happy' ? 3 : 0
  return {
    x: KX,
    y: FEET_Y,
    build: 'child' as const,
    height: KID_HEIGHT,
    facing: 'front' as const,
    lift: jump,
    pose: { leftArm: hammerArm(t, hang), rightArm: mixLimb(hang, { to: CAN_HAND }, pour), head: tilt },
    face: FACES[mood],
  }
}

/** 手に もたせる もの(かなづち・じょうろ)。手の 場所は personRig から */
function KidHeld({ t, rig }: { readonly t: number; readonly rig: ReturnType<typeof personRig> }) {
  const hammer = span(t, RAISE - 0.15, RAISE) * (1 - span(t, 5.15, 5.4))
  const can = span(t, 5.2, 5.4) * (1 - span(t, WATER_END, WATER_END + 0.3))
  const { mid, end } = rig.world.arms.left
  const angle = (Math.atan2(end[1] - mid[1], end[0] - mid[0]) * 180) / Math.PI
  return (
    <>
      {hammer > 0 && (
        <Layer opacity={hammer}>
          <Hammer hand={end} angle={angle} />
        </Layer>
      )}
      {can > 0 && (
        <Layer opacity={can}>
          <WateringCan hand={rig.world.arms.right.end} />
        </Layer>
      )}
    </>
  )
}

/** かなづち の あたまの 場所(当たる しゅんかん): 手から うでの むき に 9.5 すすんだ ところ */
function hammerHead(t: number): Pt {
  const { mid, end } = personRig(kidAt(t)).world.arms.left
  const dx = end[0] - mid[0]
  const dy = end[1] - mid[1]
  const len = Math.hypot(dx, dy) || 1
  return [end[0] + (dx / len) * 9.5, end[1] + (dy / len) * 9.5]
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
  const point = hammerHead(HITS[0])
  return (
    <>
      {HITS.map((h) => {
        const q = span(t, h, h + 0.28, easeOut)
        if (q <= 0 || q >= 1) return null
        return (
          <g key={h} opacity={1 - q}>
            <ellipse cx={point[0]} cy={point[1] + 1} rx={2 + 7 * q} ry={1 + 2.4 * q} fill="none" stroke="#ffffff" strokeWidth="1.2" />
            <circle cx={point[0] - 3 - 4 * q} cy={point[1] - 3 * q} r="0.9" fill="#ffffff" />
            <circle cx={point[0] + 3 + 4 * q} cy={point[1] - 3.4 * q} r="0.9" fill="#ffffff" />
          </g>
        )
      })}
    </>
  )
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

  // 子ども: ぽん と あらわれる
  const kidIn = span(t, 0.25, 0.85, backOut)
  const kid = kidAt(t)
  const rig = personRig(kid)
  const head = rig.world.head
  const headR = rig.body.headR * rig.scale
  const tip: Pt = [rig.world.arms.right.end[0] - 9.5, rig.world.arms.right.end[1] + 2.8]

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
          <Flower x={70} y={GROUND_Y} color="#ffd24a" size={1.15} />
          <Flower x={77.5} y={GROUND_Y} color="#ffffff" size={1.15} />
        </Layer>
        {rabbitShown && (
          <Layer x={rabbitX + 8} y={GROUND_Y + 1 - hop - startle} scaleX={flee > 0 ? 1 : -1}>
            <Rabbit headDown={headDown} chew={chew} />
          </Layer>
        )}
        <Fence t={t} />
        <Layer opacity={span(t, 0.25, 0.5)} scale={kidIn} origin={[KX, FEET_Y]}>
          <Person {...kid} look={{ ...LOOKS.boy, top: CLOTHES.orange.top }} held={<KidHeld t={t} rig={rig} />} />
        </Layer>
        <Impact t={t} />
        <Notice x={head[0]} y={head[1]} r={headR} show={during(t, IDEA, IDEA + 0.5, 0.12)} dir={1} />
        <Sweat t={t} x={head[0] + headR} y={head[1] - headR} show={during(t, WORRY + 0.1, SCARE, 0.2)} dir={1} />
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
