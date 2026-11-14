/*
 * 原(はら): がけの 下から いずみが わき出る。かわの はじまり。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … がけの 上に つき出た 大きな いわの ひさし(やね)
 *   2画目(ノ)  … ひさし から ななめに おりる がけの かべ(厂 の かたち)
 *   3画目(ノ)  … ひさし から おちる しずく(いずみの もと)
 *   4・5画目   … いわの 穴(いずみの 口)の ふち の いし(左と、上・右)
 *   6画目(一)  … 穴の 中の 水に ひかる すじ
 *   7画目(一)  … 穴の 下の ふち(ここから 水が あふれる)
 *   8画目      … まんなかに おちる 水
 *   9・10画目  … 左と右へ わかれて ながれる 水
 *
 * ながれ
 *   がけが でき、じめんは からから。のどが かわいた子が ふらふら あるいてくる
 *   → がけを みあげる。ひさし から しずくが ぽとん と 穴に おちる
 *   → 穴の 中に 水が わいてきて、子は びっくり
 *   → 水が あふれて 3本の ながれになり、子は 大よろこび(じめんも みどりに)
 *   → ほね が ひかって、絵が うすくなり、字「原」が のこる
 *
 * 絵は、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   がけは ひさし と かべ が つながった いわ。水は 上から 下へ ながれる。
 *   子は うで が かた から出て ひじ で まがり、くび は みじかく、あし は こし から。
 */
import { backOut, during, easeIn, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, LOOKS, mixLimb, Person, personRig, Sweat, walk, type Expression } from '../sceneFigures'

const CHAR = '原'

const SUN = '#ffd24a'
const ROCK = '#b4a18c'
const ROCK_DARK = '#988470'
const ROCK_CRACK = '#8a7763'
const WALL = '#8c7b72'
const WALL_DARK = '#76665e'
const HOLE = '#4d403d'
const RIM = '#cdbca6'
const DIRT = '#e6d2a2'
const DIRT_CRACK = '#b99a63'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const WATER = '#6fbdf0'
const WATER_LIGHT = '#c4e8fc'
const POOL = '#8fd0f6'

/** くぎり の時間(秒) */
const WALK = 0.7
const ARRIVE = 2.3
/** しずく が ひさし の下に ふくらみ、おちて、穴に はいる */
const DRIP = 3.0
const FALL = 3.5
const SPLASH = 3.95
/** 穴の 水が ふちから あふれ、3本の ながれに なる */
const SPILL = 5.0
const REACH = 5.9
const INK = 6.6
const DONE = 9.7
const DURATION = 10

/** いずみの 穴(4・5・7画目の ふちの 中)の 4すみ */
const HOLE_TL: readonly [number, number] = [39.5, 34.2]
const HOLE_TR: readonly [number, number] = [82.3, 29.8]
const HOLE_BR: readonly [number, number] = [78.8, 58.2]
const HOLE_BL: readonly [number, number] = [43.8, 59]
/** 地面の 上の ふち(がけの 足もと) */
const GROUND_Y = 91.5
/** こどもが 立つ 地面の 高さ(がけ より 手前) */
const FEET_Y = 97.5

type Point = readonly [number, number]
const lerpPoint = (a: Point, b: Point, k: number): Point => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/** がけ: おくの かべ・ひさし(1画目)・かべ(2画目)。ひさしの 下は かげ。 */
function Cliff({ t }: SceneProps) {
  const rise = span(t, 0, 0.7, backOut)
  return (
    <Layer opacity={span(t, 0, 0.35)} scale={0.9 + 0.1 * rise} origin={[54, GROUND_Y]}>
      {/* おくの かべ(ひさし と かべ の あいだの へこみ) */}
      <rect x="8" y="14" width="86" height={GROUND_Y - 14} rx="3" fill={WALL} />
      <rect x="26" y="19.5" width="66" height="3.4" fill="#000000" opacity="0.1" />
      <path d="M88 24 l-3 6 M92 40 l-4 5 M15 70 l8 -5 M90 70 l-3 6" stroke={WALL_DARK} strokeWidth="1.3" strokeLinecap="round" fill="none" />
      {/* 左の いわの かたまり(2画目の 線が その ふち) */}
      <path d="M-6 14 L25 13.2 L27.75 19 L28.4 22.4 C27.75 43 25.5 67.5 10.75 83 L8 91.5 H-6 Z" fill={ROCK} />
      <path d="M2 36 q4 -2 7 1 M12 52 q3 -1 6 1 M0 64 q4 -2 8 0 M4 80 q3 -1 5 0" stroke={ROCK_CRACK} strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <Layer x={1.4}>
        <Bone char={CHAR} n={2} color={ROCK_DARK} width={9.5} />
      </Layer>
      <Bone char={CHAR} n={2} color={ROCK} width={9.5} />
      <Layer y={1.4}>
        <Bone char={CHAR} n={1} color={ROCK_DARK} width={9.5} />
      </Layer>
      <Bone char={CHAR} n={1} color={ROCK} width={9.5} />
      {/* ひさしの 上の くさ */}
      <path d="M48 11 l1 -4 l1.2 3 l1.4 -3.6 l0.8 4.6 Z M14 14 l1 -3.6 l1 3 l1.4 -3.4 l0.6 4 Z" fill={LEAF} />
    </Layer>
  )
}

function Ground({ t }: SceneProps) {
  const grow = span(t, REACH - 0.2, REACH + 0.8, easeOut)
  const bed = `M-4 ${GROUND_Y} Q30 ${GROUND_Y - 2} 60 ${GROUND_Y} T113 ${GROUND_Y - 0.5} V113 H-4 Z`
  return (
    <>
      <path d={bed} fill={DIRT} />
      <g opacity={grow}>
        <path d={bed} fill={GRASS} />
      </g>
      <path d="M30 96 l5 2 l3 -1.5 M72 99 l-4 -2 l-5 1 M96 96 l4 2" stroke={DIRT_CRACK} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={1 - grow} />
    </>
  )
}

/* ───────── いずみ ───────── */

/** 穴の 中の 水。level(0〜1)まで わいてきて、あわが のぼる */
function Spring({ t, level }: SceneProps & { readonly level: number }) {
  const poly = (points: readonly Point[]) => `M${points.map(([x, y]) => `${x} ${y}`).join(' L')} Z`
  const left = lerpPoint(HOLE_BL, HOLE_TL, level)
  const right = lerpPoint(HOLE_BR, HOLE_TR, level)
  const bubbles = [0, 0.37, 0.71]
  return (
    <>
      <path d={poly([HOLE_TL, HOLE_TR, HOLE_BR, HOLE_BL])} fill={HOLE} stroke={HOLE} strokeWidth="2" strokeLinejoin="round" />
      {level > 0 ? (
        <>
          <path d={poly([left, right, HOLE_BR, HOLE_BL])} fill={WATER} stroke={WATER} strokeWidth="1.2" strokeLinejoin="round" />
          {/* 水の おもての ひかる すじ(6画目) */}
          <Bone char={CHAR} n={6} color={WATER_LIGHT} width={2.2} opacity={span(t, SPLASH + 0.6, SPLASH + 1.1) * (0.7 + 0.25 * wave(t, 1.3))} />
          {bubbles.map((offset, i) => {
            const p = (t * 0.8 + offset) % 1
            const cx = 51 + i * 11 + wave(t, 1.6, i) * 1.2
            const cy = 56 - p * Math.max(level * 23, 0)
            return <circle key={offset} cx={cx} cy={cy} r={Math.max(0, (1.1 + i * 0.35) * Math.sin(p * Math.PI))} fill={WATER_LIGHT} opacity="0.9" />
          })}
        </>
      ) : null}
      {/* 穴の ふち の いし(4・5・7画目) */}
      <Bone char={CHAR} n={4} color={RIM} width={3.4} />
      <Bone char={CHAR} n={5} color={RIM} width={3.4} />
      <Bone char={CHAR} n={7} color={RIM} width={3.4} />
    </>
  )
}

/** ひさし から おちる しずく(3画目)。ふくらんで、ぽとん と 穴に おちる。 */
function Drip({ t }: SceneProps) {
  const swell = span(t, DRIP, FALL, easeOut)
  const fall = span(t, FALL, SPLASH, easeIn)
  const start: Point = [60.1, 21.4]
  const end: Point = [55.8, 30.2]
  const bead = (x: number, y: number, size: number, tilt: number) => (
    <path d="M0 -3.4 Q2.4 0.6 0 2.2 Q-2.4 0.6 0 -3.4 Z" fill={WATER} transform={`translate(${x} ${y}) rotate(${tilt}) scale(${size})`} />
  )
  if (t >= SPLASH) {
    const p = span(t, SPLASH, SPLASH + 0.5, easeOut)
    if (p >= 1) return null
    return (
      <g opacity={1 - p} fill={WATER_LIGHT}>
        <circle cx={53 - p * 4} cy={31 - Math.sin(p * Math.PI) * 6} r="1" />
        <circle cx={58.5 + p * 4} cy={31 - Math.sin(p * Math.PI) * 7} r="1.1" />
        <circle cx={56} cy={31 - Math.sin(p * Math.PI) * 9} r="0.9" />
      </g>
    )
  }
  if (swell <= 0) return null
  if (t < FALL) return bead(start[0], start[1], 0.3 + 0.8 * swell, 0)
  const [x, y] = lerpPoint(start, end, fall)
  return bead(x, y, 1.1, 26)
}

/** 水の ながれ。ふち から あふれ、まんなか と 左右の 3本(8・9・10画目)に なる。 */
function Flow({ t }: SceneProps) {
  const center = span(t, SPILL, REACH, easeOut)
  const feeder = span(t, SPILL, SPILL + 0.35)
  const side = span(t, SPILL + 0.3, REACH + 0.1, easeOut)
  if (feeder <= 0) return null
  const sheet = (d: string, p: number) => (
    <path d={d} fill="none" stroke={WATER} strokeWidth="4.2" strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 2`} />
  )
  const shine = 0.65 + 0.25 * wave(t, 0.9)
  return (
    <>
      {sheet('M44.3 58 L42.5 70.9', feeder)}
      {sheet('M78.4 57 L79.8 72', feeder)}
      {sheet('M60.2 57 L60.3 60', feeder)}
      <Bone char={CHAR} n={8} color={WATER} width={4.4} to={center} />
      <Bone char={CHAR} n={9} color={WATER} width={4.4} to={side} />
      <Bone char={CHAR} n={10} color={WATER} width={4.4} to={side} />
      <Bone char={CHAR} n={8} color={WATER_LIGHT} width={1.5} to={center} opacity={shine} />
      <Bone char={CHAR} n={9} color={WATER_LIGHT} width={1.5} to={side} opacity={shine} />
      <Bone char={CHAR} n={10} color={WATER_LIGHT} width={1.5} to={side} opacity={shine} />
    </>
  )
}

/** ながれが とどいた所に できる みずたまり。ゆっくり わ が ひろがる。 */
function Pools({ t }: SceneProps) {
  const grow = span(t, REACH - 0.1, REACH + 0.5, easeOut)
  if (grow <= 0) return null
  const pools: readonly (readonly [cx: number, cy: number, rx: number])[] = [
    [57, 93.6, 12],
    [26, 92.6, 6.5],
    [91, 91.8, 6.5],
  ]
  return (
    <>
      {pools.map(([cx, cy, rx], i) => {
        const ring = (t * 0.9 + i * 0.33) % 1
        return (
          <g key={cx}>
            <ellipse cx={cx} cy={cy} rx={rx * grow} ry={rx * 0.24 * grow} fill={POOL} />
            <ellipse cx={cx} cy={cy} rx={rx * ring * grow} ry={rx * 0.24 * ring * grow} fill="none" stroke={WATER_LIGHT} strokeWidth="0.8" opacity={1 - ring} />
          </g>
        )
      })}
    </>
  )
}

/** 水が とどいた あとに、くさ と 花が ぽん と はえる */
function Sprouts({ t }: SceneProps) {
  const grow = span(t, REACH, REACH + 0.7, backOut)
  if (grow <= 0) return null
  const tufts = [[34, 95], [43, 96.5], [72, 96], [84, 95], [101, 95.5]] as const
  return (
    <>
      {tufts.map(([x, y]) => (
        <Layer key={x} scale={grow} origin={[x, y]}>
          <path d={`M${x} ${y} l1.4 -4.4 l1 3.6 l1.6 -5 l0.8 5.8 Z`} fill={LEAF} />
          <path d={`M${x - 3} ${y} l0.6 -3 l1.2 2.4 l0.8 -3 l0.6 3.6 Z`} fill={LEAF_DARK} />
        </Layer>
      ))}
      <Layer scale={grow} origin={[48.5, 96.8]}>
        <path d="M48.5 96.8 v-4" stroke={LEAF_DARK} strokeWidth="0.8" />
        <circle cx="48.5" cy="91.8" r="1.7" fill="#ff9db8" />
        <circle cx="48.5" cy="91.8" r="0.7" fill={SUN} />
      </Layer>
    </>
  )
}

/** わいた 水の きらきら */
function Twinkles({ t }: SceneProps) {
  const show = during(t, SPLASH + 0.8, REACH + 1.2, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      <Star cx={86} cy={26} r={2.6} color="#ffffff" spin={t * 60} />
      <Star cx={36} cy={29} r={2} color="#ffffff" spin={-t * 70} />
      <Star cx={63} cy={26} r={1.6} color={WATER_LIGHT} spin={t * 90} />
    </g>
  )
}

const KID_LOOK = { ...LOOKS.boy, top: '#ff8a65', bottom: '#4a6fa5' } as const
const KID_HEIGHT = 44
const KID_STOP_X = 14.5
const HANG_TIRED = { swing: 6, bend: 14 }

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 10)

  // あるく: 左から がけの まえまで。とぼとぼ(のどが かわいている)
  const w = walk(t, { from: -20, to: KID_STOP_X, start: WALK, end: ARRIVE, build: 'child', height: KID_HEIGHT, armSwing: 12 })

  // きもち: つかれた → びっくり → うれしい
  const face: Expression = t < SPLASH ? 'sleepy' : t < SPILL ? 'surprised' : 'joy'

  // 大よろこび: 水が あふれたら うでを あげて、2かい とびはねる
  const cheer = span(t, SPILL, SPILL + 0.5, backOut)
  const hopP = span(t, SPILL + 0.5, SPILL + 1.5)
  const hop = hopP > 0 && hopP < 1 ? Math.abs(Math.sin(hopP * Math.PI * 2)) * 5 : 0
  const startled = span(t, SPLASH, SPLASH + 0.3, backOut)
  const flap = t > SPILL + 0.5 && t < INK ? wave(t, 0.5) * 7 : 0

  // びっくり: うでが すこし まえへ ひらく。よろこぶと りょううで を あげる
  const startle = mixLimb(HANG_TIRED, { swing: 38, bend: 22 }, startled)
  const raised = { swing: 150 + flap, bend: 10 }
  const arm = t < SPILL ? startle : mixLimb(startle, raised, cheer)

  // あたま: がけの 上の ほうを みあげ、よろこぶと すこし のけぞる
  const lookUp = span(t, ARRIVE, ARRIVE + 0.4) * (1 - span(t, SPLASH + 0.3, SPLASH + 0.7))
  const head = -14 * lookUp - 4 * cheer
  const pose = t < ARRIVE ? w.pose : { ...w.pose, leftArm: arm, rightArm: arm, head }
  const kid = { ...w, y: FEET_Y, look: KID_LOOK, face, lift: hop, pose, opacity: span(t, WALK - 0.2, WALK + 0.1) }
  const head0 = personRig({ ...kid, pose: {} }).world.head

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[101, 9]} clouds={[]} tufts={[]} />
        <Cliff t={t} />
        <Ground t={t} />
        <Layer opacity={span(t, 0, 0.35)}><Spring t={t} level={span(t, SPLASH, SPILL + 0.2, easeOut) * 0.97} /></Layer>
        <Drip t={t} />
        <Flow t={t} />
        <Pools t={t} />
        <Sprouts t={t} />
        <Twinkles t={t} />
        <Person {...kid} />
        <Sweat t={t} x={head0[0] - 6} y={head0[1] - 2} show={during(t, WALK + 0.3, SPLASH, 0.3) * kid.opacity} />
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
    { at: 0, label: 'がけが でき、じめんは からから', sound: 'pop' },
    { at: WALK, label: 'のどが かわいた子が あるいてくる' },
    { at: ARRIVE + 0.1, label: 'がけを みあげる' },
    { at: DRIP, label: 'ひさし から しずくが ぽとん', sound: 'pop' },
    { at: SPLASH + 0.2, label: '穴に 水が わいてきて、びっくり' },
    { at: SPILL, label: 'あふれて 3本の ながれに。大よろこび', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '原 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
