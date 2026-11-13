/*
 * 春(はる): おひさまを あびて、草の めが にょきにょき。
 *
 * ほね(画と絵の対応)
 *   1〜3画目(よこ3本) … 草の め の くき に ついた、3だん の 葉(うえ から 小・小・大 の よこに ひらいた 葉)
 *   4画目(ノ)         … くき の てっぺん から、左の したへ たれる 長い 葉
 *   5画目(丶)         … くき の まんなか から、右の したへ たれる 長い 葉
 *   6〜9画目(日)      … 地平線の ところに のぼった おひさま(まんなかの よこ線は 空いた ところ)
 *
 * ながれ
 *   おひさまが のぼる。つちから ちょこんと かおを出した 草の め は、さむくて ぶるぶる
 *   → ひかりの つぶが とどくと、目を まるくして ぽかぽか
 *   → ひかりを のむたびに、にょき・にょき・にょき と のびて、葉が ひらく
 *   → てっぺんまで のびて、にっこり。ちょうちょも やってくる
 *   → ほね が ひかって、絵が うすくなり、字「春」が のこる
 *
 * 草の め は、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   くき は つちから まっすぐ。葉は くきの ふし から 左右に ひとつずつ。ひらく ときは、
 *   くきに そって たたまれた 葉が、ふし を じく に ひらいていく。
 *   おひさまは まるい。地平線から のぼる ので、したは つち に かくれる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '春'

const SUN = '#ffd24a'
const SUN_SHADE = '#ffb52e'
const SKY_GLOW = '#fff1b8'
const SOIL = '#8c5b3c'
const SOIL_DARK = '#70452b'
const GRASS = '#c5e8a9'
const GRASS_DARK = '#a9d98a'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const HEAD = '#a6e0a0'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const WARM = 1.2
/** にょきっと のびる 3回(はじまり) */
const GROW_A = 1.9
const GROW_B = 3.6
const GROW_C = 4.5
const INK = 6.2
const DONE = 9.7
const DURATION = 10.5

/** くき の よこ位置、つちの 高さ */
const STEM_X = 53
const GROUND = 96.5
/** おひさま(日の字の まんなか) と 大きさ */
const SUN_X = 53.5
const SUN_Y = 80.5
const SUN_R = 16.5

/** 草の め の あたま の 高さ(つち から のぞく → のびる ×3)。さいごは 15 */
function headY(t: number): number {
  return 92 - 52 * span(t, GROW_A, GROW_A + 1.1, easeInOut) - 13 * span(t, GROW_B, GROW_B + 0.6, easeInOut) - 12 * span(t, GROW_C, GROW_C + 0.6, backOut)
}

/** ひかりの つぶ: おひさまから 草の め へ とんでいく。ついた しゅんかん に のびる */
const MOTES: readonly { readonly arrive: number; readonly fromX: number }[] = [
  { arrive: GROW_A, fromX: 42 },
  { arrive: GROW_B, fromX: 65 },
  { arrive: GROW_C, fromX: 42 },
]

type Mood = 'cold' | 'wow' | 'happy'

function Sky({ t }: SceneProps) {
  const rise = span(t, 0.05, 1.5, easeOut)
  const sunY = SUN_Y + 34 * (1 - rise)
  const glow = 0.22 + 0.06 * wave(t, 1.6)
  return (
    <>
      <circle cx={SUN_X} cy={sunY} r={(SUN_R + 7) * rise} fill={SKY_GLOW} opacity={glow + 0.2} />
      <Layer rotate={t * 12} origin={[SUN_X, sunY]} opacity={rise}>
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={SUN_X - 0.9} y={sunY - SUN_R - 8.4} width="1.8" height="4.6" rx="0.9" fill={SUN} transform={`rotate(${i * 30} ${SUN_X} ${sunY})`} />
        ))}
      </Layer>
      <circle cx={SUN_X} cy={sunY} r={SUN_R} fill={SUN_SHADE} />
      <circle cx={SUN_X - 0.8} cy={sunY - 0.9} r={SUN_R - 1.8} fill={SUN} />
      <circle cx={SUN_X - 6} cy={sunY - 6.5} r="3.4" fill="#fff0a8" />
    </>
  )
}

/** くき の ふし から 左右に ひらく 葉 1まい。ひらく前は くきに そって うえへ たたまれている */
function Leaf({ node, tip, open, flap }: { readonly node: readonly [number, number]; readonly tip: readonly [number, number]; readonly open: number; readonly flap: number }) {
  if (open <= 0) return null
  const dx = tip[0] - node[0]
  const dy = tip[1] - node[1]
  const length = Math.hypot(dx, dy)
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI
  const side = dx < 0 ? 1 : -1
  const half = 3.3
  const fold = side * (1 - Math.min(open, 1)) * 75
  return (
    <Layer x={node[0]} y={node[1]} rotate={angle} scale={Math.max(0, open)} origin={[0, 0]}>
      <Layer rotate={fold} origin={[0, 0]}>
        <Layer rotate={side * flap} origin={[0, 0]}>
          <path d={`M0 0 C${length * 0.25} ${-half * 1.3} ${length * 0.7} ${-half} ${length} 0 C${length * 0.7} ${half * 0.9} ${length * 0.25} ${half * 1.2} 0 0 Z`} fill={LEAF} />
          <path d={`M0 0 L${length * 0.85} 0`} stroke={LEAF_LIGHT} strokeWidth="0.8" strokeLinecap="round" />
        </Layer>
      </Layer>
    </Layer>
  )
}

/** 草の め の かお(あたま の 中心が 0,0、半径 9 の ときの 大きさ) */
function Face({ mood, blink }: { readonly mood: Mood; readonly blink: number }) {
  if (mood === 'cold') {
    return (
      <>
        <path d="M-5.6 -1.8 l3.2 -1.3" stroke="#5a3b2a" strokeWidth="1" strokeLinecap="round" />
        <path d="M5.6 -1.8 l-3.2 -1.3" stroke="#5a3b2a" strokeWidth="1" strokeLinecap="round" />
        <path d="M-5.4 0.2 Q-3.8 1.6 -2.2 0.2" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
        <path d="M2.2 0.2 Q3.8 1.6 5.4 0.2" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
        <path d="M-2.6 4.8 l1.3 -1 l1.3 1 l1.3 -1 l1.3 1" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="-6.2" cy="3.6" r="1.7" fill={CHEEK} opacity="0.5" />
        <circle cx="6.2" cy="3.6" r="1.7" fill={CHEEK} opacity="0.5" />
      </>
    )
  }
  if (mood === 'wow') {
    return (
      <>
        <circle cx="-3.6" cy="-0.4" r="1.9" fill="#ffffff" />
        <circle cx="3.6" cy="-0.4" r="1.9" fill="#ffffff" />
        <circle cx="-3.6" cy="-0.2" r="1.1" fill={EYE} />
        <circle cx="3.6" cy="-0.2" r="1.1" fill={EYE} />
        <ellipse cx="0" cy="4.6" rx="1.5" ry="1.9" fill={MOUTH} />
        <circle cx="-6.2" cy="3.4" r="1.7" fill={CHEEK} opacity="0.6" />
        <circle cx="6.2" cy="3.4" r="1.7" fill={CHEEK} opacity="0.6" />
      </>
    )
  }
  return (
    <>
      {blink > 0.5 ? (
        <>
          <path d="M-5.6 0 l3.2 0" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M2.4 0 l3.2 0" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M-5.6 0.8 Q-4 -1.6 -2.4 0.8" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M2.4 0.8 Q4 -1.6 5.6 0.8" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
        </>
      )}
      <path d="M-3 3.6 Q0 8 3 3.6 Z" fill={MOUTH} />
      <circle cx="-6.4" cy="3.4" r="1.8" fill={CHEEK} opacity="0.65" />
      <circle cx="6.4" cy="3.4" r="1.8" fill={CHEEK} opacity="0.65" />
    </>
  )
}

/** あたま: ふたばの かんむり つき。半径 9 を 基準に、radius で 大きさを かえる */
function Head({ x, y, radius, tilt, mood, blink }: { readonly x: number; readonly y: number; readonly radius: number; readonly tilt: number; readonly mood: Mood; readonly blink: number }) {
  return (
    <Layer x={x} y={y} rotate={tilt} scale={radius / 9} origin={[0, 0]}>
      <path d="M0 -8 Q-5.4 -15 -10 -10.4 Q-5 -6.6 0 -8 Z" fill={LEAF} />
      <path d="M0 -8 Q5.4 -15 10 -10.4 Q5 -6.6 0 -8 Z" fill={LEAF_DARK} />
      <circle cx="0" cy="0" r="9" fill={HEAD} />
      <Face mood={mood} blink={blink} />
    </Layer>
  )
}

function Plant({ t }: SceneProps) {
  const y = headY(t)
  const cold = t < WARM
  const mood: Mood = cold ? 'cold' : t < GROW_A ? 'wow' : 'happy'
  const shiver = cold ? wave(t, 0.1) * 0.55 : 0
  const happy = span(t, GROW_C + 0.5, GROW_C + 0.9)
  const bounce = happy * Math.abs(wave(t, 0.9)) * -1.1
  const sway = wave(t, 2.6) * happy * 3
  const grown = (from: number, to: number) => backOut(span(t, from, to))
  const tier3 = grown(GROW_A + 1.1, GROW_A + 1.8)
  const tier2 = grown(GROW_B + 0.6, GROW_B + 1.2)
  const tier1 = grown(GROW_C + 0.6, GROW_C + 1.1)
  const flap = wave(t, 0.9) * 5 * happy
  const blink = wave(t, 1.9) > 0.97 ? 1 : 0
  const radius = 7 + 2 * span(t, GROW_A, GROW_C + 0.6)
  return (
    <>
      {/* 4画目・5画目: くき から 左と右の したへ たれる 長い 葉 */}
      {tier3 > 0 && (
        <>
          <path d="M53 33 L48 32" stroke={LEAF_DARK} strokeWidth="3.2" strokeLinecap="round" />
          <Bone char={CHAR} n={4} color={LEAF_DARK} width={3.8} from={0.28} to={0.28 + 0.72 * Math.min(tier3, 1)} />
          <Bone char={CHAR} n={5} color={LEAF_DARK} width={3.8} to={Math.min(tier3, 1)} />
        </>
      )}
      {/* くき */}
      <path d={`M${STEM_X} 99 L${STEM_X} ${y + 6}`} stroke={LEAF_DARK} strokeWidth="5.4" strokeLinecap="round" />
      <path d={`M${STEM_X - 0.9} 99 L${STEM_X - 0.9} ${y + 6}`} stroke={LEAF} strokeWidth="2.4" strokeLinecap="round" />
      {/* 1〜3画目: 3だん の 葉(ふし の 高さ 25・37・50) */}
      <Leaf node={[STEM_X, 50]} tip={[15.4, 53.5]} open={tier3} flap={flap} />
      <Leaf node={[STEM_X, 50]} tip={[88.1, 46.1]} open={tier3} flap={flap} />
      <Leaf node={[STEM_X, 37]} tip={[28.5, 38.7]} open={tier2} flap={flap} />
      <Leaf node={[STEM_X, 37]} tip={[75.2, 34.5]} open={tier2} flap={flap} />
      <Leaf node={[STEM_X, 25]} tip={[28.3, 25.2]} open={tier1} flap={flap} />
      <Leaf node={[STEM_X, 25]} tip={[76.3, 22.4]} open={tier1} flap={flap} />
      <Head x={STEM_X + shiver + sway * 0.3} y={y + bounce} radius={radius} tilt={sway + (cold ? 0 : -2)} mood={mood} blink={blink} />
    </>
  )
}

/** さむい とき の「ぶるぶる」の しるし。つちの そばで ふるえる */
function Chill({ t }: SceneProps) {
  const show = during(t, 0.5, WARM, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show} stroke="#7cc4f2" strokeWidth="1" strokeLinecap="round" fill="none">
      {[-1, 1].map((side) => (
        <path key={side} d={`M${STEM_X + side * 11} ${82 + wave(t, 0.12) * 0.6} q${side * 1.6} -2 0 -4 q${-side * 1.6} -2 0 -4`} />
      ))}
    </g>
  )
}

/** おひさまから 草の め へ とんでいく ひかりの つぶ */
function Motes({ t }: SceneProps) {
  return (
    <>
      {MOTES.map(({ arrive, fromX }) => {
        const p = span(t, arrive - 0.75, arrive, easeInOut)
        if (p <= 0 || p >= 1) return null
        const x = fromX + (STEM_X - fromX) * p
        const y = SUN_Y - 12 + (headY(arrive) - (SUN_Y - 12)) * p
        return (
          <g key={arrive} opacity={Math.min(1, (1 - p) * 4)}>
            <circle cx={x} cy={y} r="7" fill={SKY_GLOW} opacity="0.75" />
            <Star cx={x} cy={y} r={4.4} color={SUN} spin={p * 200} />
          </g>
        )
      })}
    </>
  )
}

/** まわりの 草: 草の め の ともだち。おひさまを あびて すこしずつ のびる */
function Tufts({ t }: SceneProps) {
  const grow = span(t, WARM, GROW_C + 1)
  return (
    <>
      {[8, 24, 83, 99].map((x, i) => {
        const h = 3 + (4 + (i % 2) * 2) * grow
        return (
          <path key={x} d={`M${x - 2.4} ${GROUND + 1} Q${x - 2.2} ${GROUND - h * 0.6} ${x - 3.6} ${GROUND - h} Q${x} ${GROUND - h * 0.5} ${x} ${GROUND - h * 1.25} Q${x + 0.6} ${GROUND - h * 0.5} ${x + 3.6} ${GROUND - h} Q${x + 2.2} ${GROUND - h * 0.6} ${x + 2.4} ${GROUND + 1} Z`} fill={LEAF} />
        )
      })}
    </>
  )
}

function Ground() {
  return (
    <>
      <path d={`M-2 ${GROUND + 0.5} Q27 ${GROUND - 2} 54 ${GROUND} Q82 ${GROUND - 2} 111 ${GROUND + 0.5} V111 H-2 Z`} fill={GRASS} />
      <rect x="-2" y="101" width="113" height="10" fill={GRASS_DARK} />
      <path d={`M${STEM_X - 9} ${GROUND + 1} Q${STEM_X - 5} ${GROUND - 3.2} ${STEM_X} ${GROUND - 3.4} Q${STEM_X + 5} ${GROUND - 3.2} ${STEM_X + 9} ${GROUND + 1} Z`} fill={SOIL} />
      <path d={`M${STEM_X - 5} ${GROUND - 1} q2 -1 4 0 M${STEM_X + 2} ${GROUND - 1.8} q2 -1 3.4 0.2`} stroke={SOIL_DARK} strokeWidth="0.9" fill="none" strokeLinecap="round" />
    </>
  )
}

/** うれしい 草の め の まわりを とぶ ちょうちょ */
function Butterfly({ t }: SceneProps) {
  const show = during(t, GROW_C + 0.7, INK + 1.4, 0.3)
  if (show <= 0) return null
  const p = span(t, GROW_C + 0.7, INK + 1.4)
  const x = 108 - p * 30 + Math.sin(p * 11) * 3
  const y = 10 + p * 6 + Math.sin(p * 17) * 2.4
  const flap = 0.35 + 0.65 * Math.abs(wave(t, 0.34))
  return (
    <Layer x={x} y={y} opacity={show} rotate={-12}>
      <g transform={`scale(${flap} 1)`}>
        <ellipse cx="-2.6" cy="-1.4" rx="2.8" ry="2.4" fill="#f07f9e" />
        <ellipse cx="2.6" cy="-1.4" rx="2.8" ry="2.4" fill="#f07f9e" />
        <ellipse cx="-2" cy="1.6" rx="2" ry="1.8" fill="#ffb3c8" />
        <ellipse cx="2" cy="1.6" rx="2" ry="1.8" fill="#ffb3c8" />
      </g>
      <rect x="-0.6" y="-3" width="1.2" height="6.6" rx="0.6" fill="#5a3b2a" />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 9)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Plant t={t} />
        <Ground />
        <Tufts t={t} />
        <Chill t={t} />
        <Motes t={t} />
        <Butterfly t={t} />
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
    { at: 0, label: 'おひさまが のぼる。草の め は さむくて ぶるぶる', sound: 'pop' },
    { at: WARM, label: 'ひかりが とどいて ぽかぽか' },
    { at: GROW_A, label: 'にょきにょき のびて、葉が ひらく', sound: 'pop' },
    { at: GROW_C, label: 'てっぺんまで のびて にっこり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '春 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
