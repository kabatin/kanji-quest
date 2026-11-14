/*
 * 紙(かみ): 糸のような ほそい せんいを あつめて、紙を つくる。
 *
 * ほね(画と絵の対応)
 *   糸(1〜6画目) … 左の ほしだい に つるした 糸のような せんい(長く たれた すじ)
 *   氏(7〜10画目) … 右の おけ から すくいあげた、できたての 紙(ぬれた 紙を のせた わく)
 *   ※ 絵は ほんものの 道具の かたち を守る。字と ぴったり重ならなくても、だいたい 左に せんい・右に 紙。
 *
 * ながれ
 *   子どもが「紙が ほしいな」と こまっている(ふきだしに まっしろな 紙)
 *   → ほしだい から 糸のような せんいを ひとたば とる
 *   → おけの 水に 入れて、ぼうで ぐるぐる まぜる(せんいが ほぐれて 水が にごる)
 *   → すきわく を すくいあげると、せんい が 集まって うすい 紙に なっている
 *   → 紙を かかげて にっこり → ほね が ひかって、絵が うすくなり、字「紙」が のこる
 *
 *
 * 子どもは Person(共通部品)。左むきで せんいを とり、turnAround で 右を むいて、walk で おけへ。
 * 手は { to } で せんい・おけ・すきわくへ(ぼうは tools の stick)。空と おかは Backdrop、あせは Sweat。
 * ほしだい・せんい・おけ・すきわく・ふきだしは ここで 描く。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, LOOKS, mixLimb, Person, personRig, Sweat, turnAround, walk, type Limb, type PersonProps } from '../sceneFigures'

const CHAR = '紙'

const TUNIC = '#f2a65a'
const PANTS = '#4f6aa0'
const WOOD = '#8c5b3c'
const WOOD_DARK = '#70452b'
const WOOD_LIGHT = '#a97650'
const FIBER = '#e6cf98'
const FIBER_DARK = '#cdb274'
const WATER = '#7cc4f2'
const WATER_LIGHT = '#d8effc'
const PULP = '#f3e8cc'
const PAPER = '#fffdf6'
const PAPER_SHADE = '#e4dcc6'
/** くぎり の時間(秒) */
const REACH = 2.0
const GRAB = 2.8
const TURN0 = 2.9
const TURN1 = 3.4
const WALK1 = 4.5
const RELEASE = 5.1
const STIR0 = 5.5
const STIR1 = 6.3
const DIP = 6.3
const LIFT0 = 6.75
const LIFT1 = 7.4
const INK = 7.6
const DONE = 10.9
const DURATION = 11

type Pt = readonly [number, number]

/** 子どもの 足もとの 高さと 背の高さ */
const GROUND = 95.5
const KID_HEIGHT = 68
/** 子どもの こし の x: ほしだいの まえ / おけの まえ */
const KID_FROM_X = 49
const KID_TO_X = 66

/** ほしだい(左)の きまった所 */
const RACK_BAR_Y = 16
/** つかむ せんいの 先(手が とどく高さ) */
const GRAB_AT: Pt = [33, 60]
const GRAB_STRAND_X = 33

/** おけ(右): まんなか と ふち の高さ */
const VAT_X = 87
const VAT_TOP = 70

const HANG: Limb = { swing: 4, bend: 12 }

/** ほしだい: 2本の はしら と よこぼう に、糸のような せんいを つるす */
function Rack({ t }: SceneProps) {
  const grow = span(t, 0, 0.6, backOut)
  const taken = t >= GRAB
  // よこぼう から たれる せんい(x と 長さ)。つかむ 1本は、とる と 手に うつる
  const strands: readonly (readonly [number, number])[] = [
    [13, 52],
    [17.5, 70],
    [22, 44],
    [27, 79],
    [GRAB_STRAND_X, GRAB_AT[1] - RACK_BAR_Y],
    [29.8, 60],
  ]
  return (
    <Layer scaleY={grow} origin={[23, 97]}>
      <rect x="6.6" y="14" width="3.4" height="83" rx="1.6" fill={WOOD_DARK} />
      <rect x="37" y="14" width="3.4" height="83" rx="1.6" fill={WOOD_DARK} />
      <rect x="5" y={RACK_BAR_Y - 2.4} width="37" height="3.6" rx="1.8" fill={WOOD} />
      {strands.map(([x, length], i) => {
        if (taken && x === GRAB_STRAND_X) return null
        const sway = wave(t, 3 + i * 0.4, i) * 0.8
        return <path key={x} d={`M${x} ${RACK_BAR_Y} q${2 + sway} ${length * 0.25} 0 ${length * 0.5} t0 ${length * 0.5}`} fill="none" stroke={i % 2 === 0 ? FIBER : FIBER_DARK} strokeWidth="1.5" strokeLinecap="round" />
      })}
    </Layer>
  )
}

/** 手に もった せんいの たば(ほぐれて ゆれる) */
function Bundle({ x, y, t, fall }: { readonly x: number; readonly y: number; readonly t: number; readonly fall: number }) {
  return (
    <g transform={`translate(${x} ${y})`} opacity={1 - Math.max(0, fall - 0.75) * 4}>
      {[-2.4, -1.2, 0, 1.2, 2.4].map((dx, i) => {
        const len = 11 + (i % 3) * 2.6
        const sway = wave(t, 0.9 + i * 0.07, i) * 1.1
        return <path key={dx} d={`M${dx * 0.5} 0 q${dx + sway} ${len * 0.5} ${dx * 0.9} ${len * 0.5} t${-dx * 0.4 + sway * 0.6} ${len * 0.5}`} fill="none" stroke={i % 2 === 0 ? FIBER : FIBER_DARK} strokeWidth="1.4" strokeLinecap="round" />
      })}
    </g>
  )
}

/** おけ: 木の たる。水と、ほぐれた せんい */
function VatBack() {
  return (
    <>
      <path d={`M${VAT_X - 15} ${VAT_TOP} L${VAT_X - 14} 92 Q${VAT_X} 97 ${VAT_X + 14} 92 L${VAT_X + 15} ${VAT_TOP} Z`} fill={WOOD} />
      <path d={`M${VAT_X - 5} ${VAT_TOP + 3} L${VAT_X - 4.6} 94 M${VAT_X + 5} ${VAT_TOP + 3} L${VAT_X + 4.6} 94`} stroke={WOOD_DARK} strokeWidth="1.1" strokeLinecap="round" />
      <path d={`M${VAT_X - 14.8} 79 Q${VAT_X} 82.5 ${VAT_X + 14.8} 79 L${VAT_X + 14.8} 81.4 Q${VAT_X} 85 ${VAT_X - 14.8} 81.4 Z`} fill={WOOD_DARK} />
      <ellipse cx={VAT_X} cy={VAT_TOP} rx="15" ry="4.2" fill={WOOD_LIGHT} />
    </>
  )
}

function VatWater({ t }: SceneProps) {
  const pulp = span(t, RELEASE + 0.3, STIR1)
  const strands = span(t, RELEASE + 0.25, RELEASE + 0.7)
  const ring = span(t, RELEASE + 0.25, RELEASE + 1.4)
  return (
    <>
      <ellipse cx={VAT_X} cy={VAT_TOP + 0.3} rx="13.2" ry="3.3" fill={WATER} />
      <ellipse cx={VAT_X} cy={VAT_TOP + 0.3} rx="13.2" ry="3.3" fill={PULP} opacity={pulp * 0.8} />
      <path d={`M${VAT_X - 9} ${VAT_TOP - 0.4} q3 -1 6 0`} fill="none" stroke={WATER_LIGHT} strokeWidth="0.7" strokeLinecap="round" opacity={1 - pulp} />
      {/* おちた せんい: 水に ういて ほぐれる */}
      <g opacity={strands} fill="none" stroke={FIBER_DARK} strokeWidth="0.9" strokeLinecap="round">
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const x = VAT_X - 8 + i * 3.2 + wave(t, 2.2, i) * 0.8
          const y = VAT_TOP + 0.4 + ((i * 7) % 5) * 0.4 - 1
          return <path key={i} d={`M${x - 2.4} ${y} q1.2 -1.2 2.4 0 t2.4 0`} />
        })}
      </g>
      {ring > 0 && ring < 1 && <ellipse cx={VAT_X - 3.5} cy={VAT_TOP + 0.4} rx={1.5 + 9 * ring} ry={0.5 + 2.4 * ring} fill="none" stroke="#ffffff" strokeWidth="0.9" opacity={1 - ring} />}
    </>
  )
}

/** こまった ふきだし: まっしろな 紙が ほしい */
function WishBubble({ t }: SceneProps) {
  const show = during(t, 0.5, REACH + 0.1, 0.3)
  if (show <= 0) return null
  const bob = wave(t, 1.6) * 0.5
  return (
    <g opacity={show} transform={`translate(0 ${bob})`}>
      <circle cx="53.5" cy="30" r="1.1" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <circle cx="56.4" cy="25.6" r="1.9" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <ellipse cx="66" cy="16.5" rx="12" ry="8" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
      <rect x="60" y="10.4" width="12" height="12.4" rx="1" fill={PAPER} stroke="#b7c4d6" strokeWidth="0.7" strokeDasharray="1.6 1.2" />
    </g>
  )
}

/** すきわく と できた 紙(おけの 水から すくいあげる) */
function Mould({ t, center }: { readonly t: number; readonly center: Pt }) {
  const [x, y] = center
  const rise = span(t, DIP + 0.15, LIFT1, easeOut)
  if (t < DIP + 0.25 || y > VAT_TOP + 2) return null
  // 紙は すくった ときは まだ ぬれて ほんのり せんい色、かかげると 白く
  const dry = span(t, LIFT1 - 0.2, INK)
  const sheetColor = dry > 0.5 ? PAPER : PULP
  const w = 11
  return (
    <>
      <path d={`M${x - w} ${y + 2.6} L${x + w} ${y + 2.6} L${x + w + 4} ${y - 2.4} L${x - w + 4} ${y - 2.4} Z`} fill={WOOD} />
      <path d={`M${x - w + 1.6} ${y + 1.6} L${x + w - 1.6} ${y + 1.6} L${x + w + 2.2} ${y - 1.4} L${x - w + 5.8} ${y - 1.4} Z`} fill={sheetColor} />
      <path d={`M${x - w + 1.6} ${y + 1.6} L${x + w - 1.6} ${y + 1.6} L${x + w - 0.4} ${y + 0.4} L${x - w + 2.8} ${y + 0.4} Z`} fill={PAPER_SHADE} opacity={0.7 + 0.3 * (1 - dry)} />
      {/* しずく: 紙から 水が ぽたぽた */}
      {[0, 1, 2].map((i) => {
        const p = (t * 1.4 + i * 0.36) % 1
        const show = rise * (1 - dry * 0.8)
        const dropX = x - w + 3 + i * 6.5
        return <path key={i} d="M0 -1.6 Q1.3 0.4 0 1.4 Q-1.3 0.4 0 -1.6 Z" fill={WATER} opacity={show * (1 - p)} transform={`translate(${dropX} ${y + 3.4 + p * 12})`} />
      })}
    </>
  )
}

type Mood = 'sad' | 'calm' | 'happy'
const FACES = { sad: 'worried', calm: 'smile', happy: 'joy' } as const

/** 手の いく所(せんいを とる → はこぶ → おけへ → かきまぜる → すくう) */
function workHand(t: number, carryX: number): Limb {
  const grab: Limb = { to: GRAB_AT }
  const carry: Limb = { to: [carryX, 59] }
  const pour: Limb = { to: [VAT_X - 4, VAT_TOP - 7] }
  const dip: Limb = { to: [VAT_X - 12.6, VAT_TOP + 4.2] }
  const lifted: Limb = { to: [VAT_X - 10.4, 57] }
  const stirAngle = (t - STIR0) * Math.PI * 2 * 1.6
  const stir = during(t, STIR0, STIR1, 0.2)
  const k = (a: number, b: number) => span(t, a, b, easeInOut)
  if (t < REACH) return HANG
  if (t < GRAB + 0.15) return mixLimb(HANG, grab, k(REACH, GRAB - 0.15))
  if (t < TURN1) return mixLimb(grab, { to: [KID_FROM_X, 59] }, k(GRAB + 0.15, TURN0))
  if (t < WALK1) return mixLimb({ to: [KID_FROM_X, 59] }, carry, k(TURN1, TURN1 + 0.3))
  if (t < WALK1 + 0.45) return mixLimb(carry, pour, k(WALK1, WALK1 + 0.45))
  if (t < DIP) {
    const wobble: Pt = [Math.cos(stirAngle) * 3.2 * stir, Math.sin(stirAngle) * 1.2 * stir]
    return { to: [VAT_X - 4 + wobble[0], VAT_TOP - 7 + wobble[1]] }
  }
  if (t < LIFT0) return mixLimb(pour, dip, k(DIP, DIP + 0.4))
  return mixLimb(dip, lifted, k(LIFT0, LIFT1))
}

/** 子どもの 場所と かっこう。ほしだいの まえで せんいを とり、ふりむいて おけへ あるく */
function kidAt(t: number): PersonProps {
  const walking = walk(t, { from: KID_FROM_X, to: KID_TO_X, start: TURN1, end: WALK1, build: 'child', height: KID_HEIGHT, step: 8 })
  const turn = turnAround(t, TURN0, 'left', 'right', TURN1 - TURN0)
  const work = workHand(t, walking.x + 10)
  // 前かがみ: せんいを とるとき・おけに 手をのばすとき・すくうとき
  const lean = Math.max(5 * during(t, REACH, GRAB + 0.7, 0.35), 8 * during(t, WALK1 - 0.1, STIR1 + 0.2, 0.3), 12 * during(t, DIP - 0.2, LIFT0 + 0.45, 0.3))
  const mood: Mood = t < GRAB ? 'sad' : t < LIFT1 - 0.2 ? 'calm' : 'happy'
  const head = t < REACH ? 7 : t < LIFT1 ? 1 : -2
  // はたらく手: ふりむく とちゅうで 右手 → 左手 に かわる(からだが よこむきの ときに 入れかわる)
  const rightWorks = t < (TURN0 + TURN1) / 2
  const free: Limb = t >= TURN1 && t < WALK1 ? (rightWorks ? walking.pose.leftArm : walking.pose.rightArm) ?? HANG : HANG
  // りょうてで すきわくを もつ
  const both = span(t, DIP - 0.3, DIP + 0.1, easeInOut)
  const other: Limb = mixLimb(free, { to: [KID_TO_X + 8 + (VAT_X - 12.6 - KID_TO_X) * span(t, DIP, DIP + 0.4), VAT_TOP + 3.6] }, both)
  return {
    ...walking,
    ...turn,
    y: GROUND,
    look: { ...LOOKS.boy, top: TUNIC, bottom: PANTS },
    face: FACES[mood],
    opacity: span(t, 0.2, 0.55),
    pose: { ...walking.pose, torso: lean, head, rightArm: rightWorks ? work : other, leftArm: rightWorks ? other : work },
  }
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 10)
  const kid = kidAt(t)
  const rig = personRig(kid)
  const rightWorks = t < (TURN0 + TURN1) / 2
  const hand = rightWorks ? rig.world.arms.right.end : rig.world.arms.left.end
  const head = rig.world.head
  const stirring = during(t, STIR0 - 0.15, STIR1 + 0.05, 0.15)
  const fall = span(t, RELEASE, RELEASE + 0.35)
  const inHand = t >= GRAB && t < RELEASE
  const bundleAt: Pt = inHand ? [hand[0], hand[1] + 1.5] : [VAT_X - 4, mix(t, RELEASE, RELEASE + 0.35, VAT_TOP - 5.5, VAT_TOP, (x) => x * x)]
  // できあがりで 字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.05
  const stick = stirring > 0 ? { [rightWorks ? 'right' : 'left']: { kind: 'stick', tip: [hand[0] + 1, VAT_TOP + 1] } } : undefined
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[98, 12]} clouds={[[62, 9, 0.8]]} tufts={[4, 50, 66, 104]} ground={98} />
        <Rack t={t} />
        <VatBack />
        <VatWater t={t} />
        <Person {...kid} tools={stick} />
        {t >= GRAB && fall < 1 && <Bundle x={bundleAt[0]} y={bundleAt[1]} t={t} fall={fall} />}
        <Mould t={t} center={[hand[0] + 6, hand[1] - 1.5]} />
        <WishBubble t={t} />
        <Sweat t={t} x={head[0] + 5} y={head[1] - 3} show={during(t, 0.7, REACH, 0.2)} />
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
    { at: 0, label: 'ほしだいに 糸のような せんい。子どもは「紙が ほしいな」', sound: 'pop' },
    { at: REACH, label: 'せんいを ひとたば とる' },
    { at: TURN1, label: 'おけの ほうへ あるく' },
    { at: RELEASE, label: '水に 入れて ぼうで まぜる', sound: 'pop' },
    { at: DIP, label: 'すきわくを すくいあげる' },
    { at: LIFT1, label: '紙が できた。にっこり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '紙 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
