/*
 * 光(ひかり): 人が あたまの 上に 火を かかげる。あたりを てらす。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … たいまつの 火の まんなか(ほのおの しん)
 *   2・3画目   … 火の 左右に とびちる ひかりの つぶ(ひかりが ひろがる すじ)
 *   4画目(一)  … かた から ひじ にかけて ひろがる 人の うで(火を かかげた 人の かた はば)
 *   5・6画目   … 人の 左右の あし
 *   (字の形に合わせて 人を ゆがめない。人は ほんものの つくりで 立ち、だいたい 同じ場所に そろう)
 *
 * ながれ
 *   くらい 夜。子どもが たいまつを もって ひとりで 立ち、こわくて きょろきょろ
 *   → こうもりが とんできて びっくり(ぶるぶる)
 *   → そこへ ながれぼしが おちてきて、たいまつに ぽっと 火が つく(わけ)
 *   → 子どもは おどろき、火を あたまの 上に かかげる。まわりが ぱあっと あかるくなり、にっこり
 *   → ほね が ひかって、絵が うすくなり、字「光」が のこる
 *
 * 人は Person(正面)。たいまつは 手に もつ 道具 tools(ぼう)に、火の 入れもの と ほのお を のせる。
 *   手は 点で 指定して、ひじ は 部品が 計算する(あたまの よこを まわって のぼる)。
 */
import { backOut, during, easeIn, easeInOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, Canopy, Flame, Flower, LOOKS, Person, personRig, Sweat, Tree, type Expression, type Point } from '../sceneFigures'

const CHAR = '光'

const NIGHT = '#141c3a'
const CUP = '#5a3b2a'
const FIRE_CORE = '#ffd24a'
const BAT = '#6c5b8a'

/** くぎり の時間(秒) */
const BAT_AT = 1.2
const STAR_AT = 2.3
const LIGHT_AT = 3.1
const RAISE = 4.2
const RAISED = 5.4
const INK = 6.3
const DONE = 9.5
const DURATION = 10

/** 人の 足もと・こし の x・背の高さ。からだの まんなか は x = 54 */
const KID_X = 54
const GROUND = 93
const KID_HEIGHT = 68
/** たいまつを さげているとき・あたまの上に かかげたとき の 手の いち(たいまつは 画面の 右の 手) */
const HANG_R: Point = [66, 77]
const HANG_L: Point = [42, 77]
const HIGH_R: Point = [63, 26]
const HIGH_L: Point = [46, 30]
/** たいまつの 火の いれものは、にぎる手より これだけ 上 */
const CUP_RISE = 12

const lerpPoint = (a: Point, b: Point, k: number): Point => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/* ───────── 森 ───────── */

function Forest({ t }: SceneProps) {
  const grow = span(t, 0, 0.6, backOut)
  return (
    <>
      <Backdrop t={t} sun={null} clouds={[]} tufts={[]} />
      <Tree x={14} y={97} height={62} grow={grow} />
      <Canopy x={93} y={88} r={9} grow={grow} />
      {/* 地面の 花(あかるくなると 色が 見える) */}
      <Flower x={30} y={97} color="#f07f9e" grow={grow} />
      <Flower x={38} y={98.4} color="#ffd24a" grow={grow} />
      <Flower x={75} y={98} color="#8f9cec" grow={grow} />
      <Flower x={82} y={96.6} color="#f07f9e" grow={grow} />
    </>
  )
}

/* ───────── たいまつ・火 ───────── */

/** 火の いれもの。ぼうの さきに のる(tip が ぼうの さき) */
function TorchCup({ tip }: { readonly tip: Point }) {
  const [x, y] = tip
  return <path d={`M${x - 3.4} ${y - 2} L${x + 3.4} ${y - 2} L${x + 2.2} ${y + 2.4} L${x - 2.2} ${y + 2.4} Z`} fill={CUP} strokeLinejoin="round" />
}

/** あかるくなったときの ひかりの すじ(火の まわりに ひろがる) */
function Rays({ cx, cy, amount, t }: { readonly cx: number; readonly cy: number; readonly amount: number; readonly t: number }) {
  if (amount <= 0) return null
  return (
    <g opacity={amount} stroke={FIRE_CORE} strokeWidth="1.7" strokeLinecap="round" transform={`rotate(${t * 12} ${cx} ${cy})`}>
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2
        const near = 15 + wave(t, 0.8, i * 0.1) * 1.2
        const far = near + 5 + amount * 1.5
        return <path key={i} d={`M${cx + Math.cos(angle) * near} ${cy + Math.sin(angle) * near} L${cx + Math.cos(angle) * far} ${cy + Math.sin(angle) * far}`} />
      })}
    </g>
  )
}

/* ───────── にぎやかし ───────── */

const STARS: readonly (readonly [number, number, number])[] = [
  [10, 10, 2.4],
  [32, 6, 2],
  [76, 8, 2.6],
  [98, 16, 2],
  [90, 36, 1.8],
  [24, 28, 1.8],
]

function NightStars({ t, opacity }: { readonly t: number; readonly opacity: number }) {
  if (opacity <= 0) return null
  return (
    <g opacity={opacity}>
      {STARS.map(([x, y, r], i) => (
        <Star key={x} cx={x} cy={y} r={r * (0.85 + 0.15 * wave(t, 1.4, i * 0.4))} color="#fff6c8" />
      ))}
    </g>
  )
}

/** こうもり: 右から とんできて、子どもの あたまの上を とおって 左へ にげる。 */
function Bat({ t }: SceneProps) {
  const p = span(t, BAT_AT, BAT_AT + 1.6)
  if (p <= 0 || p >= 1) return null
  const x = 116 - p * 124
  const y = 22 + Math.sin(p * Math.PI * 3) * 4
  const flap = wave(t, 0.18) * 32
  return (
    <Layer x={x} y={y}>
      <Layer rotate={-flap} origin={[-1.2, 0]}>
        <path d="M-1.2 0 Q-6 -5 -11 -1 Q-8 -0.6 -7 2.4 Q-4.4 0.4 -1.2 1.6 Z" fill={BAT} />
      </Layer>
      <Layer rotate={flap} origin={[1.2, 0]}>
        <path d="M1.2 0 Q6 -5 11 -1 Q8 -0.6 7 2.4 Q4.4 0.4 1.2 1.6 Z" fill={BAT} />
      </Layer>
      <ellipse cx="0" cy="0.8" rx="2.4" ry="3" fill={BAT} />
      <path d="M-1.8 -1.6 l0.2 -2.2 l1.4 1.2 l1.4 -1.2 l0.2 2.2 Z" fill={BAT} />
      <circle cx="-0.9" cy="0" r="0.5" fill="#ffffff" />
      <circle cx="0.9" cy="0" r="0.5" fill="#ffffff" />
    </Layer>
  )
}

/** ながれぼし: 右上から おちてきて、たいまつの さきに とどく。 */
function ShootingStar({ t, target }: { readonly t: number; readonly target: Point }) {
  const p = span(t, STAR_AT, LIGHT_AT, easeIn)
  if (p <= 0 || p >= 1) return null
  const from: Point = [106, 2]
  const [x, y] = lerpPoint(from, target, p)
  const tail = lerpPoint(from, target, Math.max(0, p - 0.28))
  return (
    <>
      <path d={`M${tail[0]} ${tail[1]} L${x} ${y}`} stroke="#fff6c8" strokeWidth="2.2" strokeLinecap="round" opacity="0.75" />
      <Star cx={x} cy={y} r={3.6} color="#ffe27a" spin={p * 200} />
    </>
  )
}

/* ───────── 場面 ───────── */

type Gaze = { readonly x: number; readonly y: number }

function gazeAt(t: number): Gaze {
  if (t < BAT_AT) return { x: wave(t, 1.8), y: 0 }
  if (t < STAR_AT) return { x: -0.6, y: -1 }
  if (t < LIGHT_AT) return { x: 0.9, y: -1.1 }
  return t < RAISE ? { x: 0.9, y: 0.9 } : { x: 0, y: -1.1 }
}

function moodAt(t: number): Expression {
  if (t < LIGHT_AT) return 'worried'
  return t < RAISE + 0.2 ? 'surprised' : 'joy'
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  // 子ども: ぽん と出る → こうもりに びっくり(のけぞる)→ 火が ついて おどろく → かかげて にっこり
  const pop = span(t, 0.3, 0.9, backOut)
  const flinch = during(t, BAT_AT + 0.35, BAT_AT + 1.0, 0.15)
  const shiver = (during(t, 0.9, 1.3, 0.1) + during(t, 1.9, LIGHT_AT, 0.2)) * wave(t, 0.1) * 0.45
  const gaze = gazeAt(t)

  // うで: 右手は たいまつを にぎって あたまの 上へ。左手は あとから そえる。手は あたまの 横を まわって のぼる
  const lift = span(t, RAISE, RAISED, easeInOut)
  const liftL = span(t, RAISE + 0.4, RAISED + 0.1, easeInOut)
  const baseR = lerpPoint(HANG_R, HIGH_R, lift)
  const baseL = lerpPoint(HANG_L, HIGH_L, liftL)
  const handR: Point = [baseR[0] + Math.sin(lift * Math.PI) * 6, baseR[1]]
  const handL: Point = [baseL[0] - Math.sin(liftL * Math.PI) * 6, baseL[1]]
  const place = { x: KID_X + shiver + flinch * 1.2, y: GROUND, build: 'child', height: KID_HEIGHT, facing: 'front', lean: flinch * 5, pose: { leftArm: { to: handR }, rightArm: { to: handL } } } as const
  // 画面の 右の 手(人の ひだり)が たいまつを にぎる。手の いち は 部品が きめた もの を 使う
  const grip = personRig(place).world.arms.left.end
  const tip: Point = [grip[0], grip[1] - CUP_RISE]
  const rig = personRig(place)
  const head = rig.world.head

  // 火: ながれぼしが とどいた しゅんかん に つく
  const flame = Math.max(0, span(t, LIGHT_AT, LIGHT_AT + 0.45, backOut))
  const night = span(t, 0.2, 0.8) * (1 - span(t, LIGHT_AT + 0.3, RAISED))
  // 火が ついて、ひろがるにつれ、まわりが ぱあっと あかるくなる(よるの くらさが ぬける)
  const darkness = 0.7 * span(t, 0.2, 0.8) * (1 - span(t, LIGHT_AT + 0.1, RAISED + 0.2, easeInOut))
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Forest t={t} />
        <Layer opacity={pop}>
          <Layer scale={0.7 + 0.3 * pop} origin={[KID_X, GROUND]}>
            <Person {...place} look={LOOKS.boy} face={moodAt(t)} gaze={gaze.x} gazeY={gaze.y} tools={{ left: { kind: 'stick', tip } }} />
            <TorchCup tip={tip} />
            <Sweat t={t} x={head[0] + 9} y={head[1] - 2} show={during(t, 0.7, LIGHT_AT, 0.2)} dir={1} />
          </Layer>
        </Layer>
        {/* よるの くらさ(火の まわりだけ ぬける) */}
        <rect x="-10" y="-10" width="130" height="130" fill={NIGHT} opacity={darkness} />
        <NightStars t={t} opacity={night} />
        <Layer opacity={night}>
          <Bat t={t} />
        </Layer>
        <ShootingStar t={t} target={[HANG_R[0], HANG_R[1] - CUP_RISE - 1]} />
        <Flame t={t} x={tip[0]} y={tip[1] - 1} size={flame * 0.9} />
        <Rays cx={tip[0]} cy={tip[1] - 7} amount={span(t, RAISED, RAISED + 0.4) * 0.9} t={t} />
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
    { at: 0, label: 'くらい 夜。子どもが たいまつを もって ひとり', sound: 'pop' },
    { at: BAT_AT, label: 'こうもりが とんできて びっくり' },
    { at: STAR_AT, label: 'ながれぼしが おちてくる' },
    { at: LIGHT_AT, label: 'たいまつに 火が ついて、まわりが あかるくなる', sound: 'pop' },
    { at: RAISE, label: '火を あたまの 上に かかげる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '光 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
