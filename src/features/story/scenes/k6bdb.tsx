/*
 * 毛(け): どうぶつの からだに ふさふさ はえている、ながく のびた け。
 *
 * ほね(画と絵の対応)
 *   4画目(丨 → 右へ はねる) … きつねの しっぽ。がけの ふちから 下へ たれて、地面を はって 右の先が 上を むく
 *   2・3画目(一)            … しっぽの よこに ふさっと はえた け の たば(上と 下の 2だん)
 *   1画目(ノ)               … きつねの せなか から あたま へ つづく、毛なみの ライン(ほね が ひかるとき だけ 重なる)
 *
 * ながれ
 *   雪の日。きつねは さむくて ぶるぶる。しっぽは ほそくて すかすか
 *   → 雪が ふりつづけて、さむさに まけまいと しっぽの け が ぞわぞわ のびる
 *   → 上の だん・下の だん と ふさっ ふさっ。しっぽの 先は 白い ふさ
 *   → きつねは びっくり、ふりむいて しっぽを 見て にっこり(ほっぺが ほんのり ピンク)
 *   → ほね が ひかって、絵が うすくなり、字「毛」が のこる
 *
 * きつねは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   すわった きつねは、おしりの下から しっぽが 下へ たれる。耳は あたまの上、鼻は 先がとがった 口もと。
 *   ふりむくときは、あたまだけ くるっと 反対むきになる(体は がけの ふちに すわったまま)。
 */
import { backOut, during, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '毛'

const FUR = '#f08a3c'
const FUR_SHADE = '#d9702a'
const FUR_LIGHT = '#ffb26b'
const CREAM = '#fff6e8'
const SOCK = '#5a3b2a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const BLUSH = '#ff9d9d'
const CHILL = '#9ec9ef'
const ROCK = '#9aa7b8'
const ROCK_DARK = '#7f8ca0'
const SNOW = '#f4f9fd'
const FLAKE_EDGE = '#bcd6ee'

/** くぎり の時間(秒) */
const COLD = 0.6
/** しっぽの け が のびはじめる */
const SPROUT = 3.1
/** ふりむいて しっぽを 見る */
const LOOK = 4.5
const INK = 6.6
const DONE = 9.6
const DURATION = 10.2

/** しっぽの つけね(4画目の 書きはじめ)と、きつねが すわる 場所 */
const TAIL_ROOT: readonly [number, number] = [44, 29]
const SEAT_Y = 33.5

type Point = readonly [number, number]
/** け の たば。center は しっぽの まんなか、left / right は 2・3画目の はし */
type Row = { readonly center: Point; readonly left: Point; readonly right: Point }
const ROW_UPPER: Row = { center: [45, 45], left: [20.5, 47.8], right: [76.6, 40.8] }
const ROW_LOWER: Row = { center: [45, 64.5], left: [13, 69.1], right: [85.1, 60.3] }

/* ───────── けしき ───────── */

function Land({ pop }: { readonly pop: number }) {
  return (
    <Layer scale={pop} origin={[54, 98]}>
      <ellipse cx="54.5" cy="99" rx="56" ry="4.8" fill={SNOW} />
      {/* がけ: 左がわ。ふちに きつねが すわる */}
      <path d="M-4 33 H49 Q52 33 52 37 V99 H-4 Z" fill={ROCK} />
      <path d="M-4 33 H49 Q52 33 52 37 V45 Q40 41 30 46 Q16 41 -4 46 Z" fill={ROCK_DARK} opacity="0.35" />
      <path d="M12 60 l2 8 l-2.4 6" fill="none" stroke={ROCK_DARK} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* つもった雪 */}
      <path d="M-4 29 Q8 27 20 30.5 Q34 27.5 49 30 Q53 31 53 35.5 Q50 38 46 36 Q40 39 34 36.5 Q24 39.5 16 36.5 Q6 39 -4 36 Z" fill={SNOW} />
    </Layer>
  )
}

/** ふってくる 雪。くり返しの動きも ぜんぶ t から計算する */
const FLAKES: readonly { readonly x: number; readonly phase: number; readonly speed: number; readonly r: number }[] = [
  { x: 8, phase: 0.0, speed: 17, r: 1.2 },
  { x: 24, phase: 0.45, speed: 21, r: 1.0 },
  { x: 38, phase: 0.2, speed: 19, r: 1.3 },
  { x: 58, phase: 0.7, speed: 23, r: 1.0 },
  { x: 68, phase: 0.1, speed: 18, r: 1.4 },
  { x: 79, phase: 0.55, speed: 22, r: 1.1 },
  { x: 91, phase: 0.3, speed: 20, r: 1.3 },
  { x: 102, phase: 0.8, speed: 17, r: 1.0 },
]

function Snowfall({ t }: SceneProps) {
  const show = span(t, 0.3, 1.1)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {FLAKES.map((flake) => {
        const y = (((t * flake.speed + flake.phase * 120) % 118) + 118) % 118 - 6
        const x = flake.x + wave(t, 2.2, flake.phase * 5) * 2.4
        return <circle key={flake.x} cx={x} cy={y} r={flake.r} fill="#ffffff" stroke={FLAKE_EDGE} strokeWidth="0.45" />
      })}
    </g>
  )
}

/* ───────── しっぽ ───────── */

/** 3本の とがった け を、中心から 先へ ひらいて はやす */
function spikePath(base: Point, tip: Point, half: number): string {
  const dx = tip[0] - base[0]
  const dy = tip[1] - base[1]
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const mx = (base[0] + tip[0]) / 2
  const my = (base[1] + tip[1]) / 2 - 1
  const bulge = half * 1.05
  return `M${base[0] + nx * half} ${base[1] + ny * half} Q${mx + nx * bulge} ${my + ny * bulge} ${tip[0]} ${tip[1]} Q${mx - nx * bulge} ${my - ny * bulge} ${base[0] - nx * half} ${base[1] - ny * half} Z`
}

function sideSpikes(center: Point, tip: Point): string {
  const dx = tip[0] - center[0]
  const dy = tip[1] - center[1]
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  // 5本の とがった け。まんなかが いちばん ながい(2・3画目の 先)。はしほど みじかい
  return [-2, -1, 0, 1, 2]
    .map((k) => {
      const reach = [0.72, 0.88, 1, 0.88, 0.72][k + 2]
      const end: Point = [center[0] + dx * reach + nx * k * 3.6, center[1] + dy * reach + ny * k * 3.6]
      const base: Point = [center[0] + nx * k * 1.8, center[1] + ny * k * 1.8]
      return spikePath(base, end, k === 0 ? 2.8 : 2.2)
    })
    .join(' ')
}

function Tuft({ row, grow, sway }: { readonly row: Row; readonly grow: number; readonly sway: number }) {
  if (grow <= 0) return null
  const d = `${sideSpikes(row.center, row.left)} ${sideSpikes(row.center, row.right)}`
  return (
    <Layer scale={grow} rotate={sway} origin={row.center}>
      <path d={d} fill={FUR_SHADE} transform="translate(0 1.1)" />
      <path d={d} fill={FUR} />
    </Layer>
  )
}

function Tail({ t, sway }: SceneProps & { readonly sway: number }) {
  const thick = span(t, SPROUT, SPROUT + 1.4, easeOut)
  const upper = span(t, SPROUT, SPROUT + 0.6, backOut)
  const lower = span(t, SPROUT + 0.5, SPROUT + 1.1, backOut)
  const tipFluff = span(t, SPROUT + 0.9, SPROUT + 1.5, backOut)
  // さむい間は ほそくて すかすか。ふさふさに なると 太い
  const width = Math.max(0, 3.4 + 8.8 * thick)
  const tipWidth = Math.max(0, 3.4 + 9.8 * tipFluff)
  return (
    <Layer rotate={sway} origin={TAIL_ROOT}>
      <Layer y={1.1}>
        <Bone char={CHAR} n={4} color={FUR_SHADE} width={width} />
      </Layer>
      <Bone char={CHAR} n={4} color={FUR} width={width} />
      <Bone char={CHAR} n={4} color={FUR_LIGHT} width={width * 0.32} from={0.08} to={0.7} opacity={thick} />
      {/* しっぽの先は 白い ふさ */}
      <Bone char={CHAR} n={4} color={CREAM} width={tipWidth} from={0.86} to={1} />
      <Tuft row={ROW_UPPER} grow={upper} sway={wave(t, 1.3) * 2.2 * upper} />
      <Tuft row={ROW_LOWER} grow={lower} sway={wave(t, 1.3, 0.4) * 2.2 * lower} />
    </Layer>
  )
}

/** け が ふさっと のびた しゅんかんの きらきら */
function FurSparks({ t }: SceneProps) {
  const upper = during(t, SPROUT + 0.35, SPROUT + 1.1, 0.2)
  const lower = during(t, SPROUT + 0.85, SPROUT + 1.6, 0.2)
  return (
    <>
      {upper > 0 && (
        <g opacity={upper}>
          <Star cx={ROW_UPPER.left[0] - 1} cy={ROW_UPPER.left[1] - 7} r={2.6} color="#ffd95a" spin={t * 90} />
          <Star cx={ROW_UPPER.right[0] + 1} cy={ROW_UPPER.right[1] - 7} r={2.2} color="#ffffff" spin={-t * 90} />
        </g>
      )}
      {lower > 0 && (
        <g opacity={lower}>
          <Star cx={ROW_LOWER.left[0] + 1} cy={ROW_LOWER.left[1] - 7} r={2.6} color="#ffd95a" spin={t * 90} />
          <Star cx={ROW_LOWER.right[0] - 1} cy={ROW_LOWER.right[1] - 7} r={2.2} color="#ffffff" spin={-t * 90} />
        </g>
      )}
    </>
  )
}

/* ───────── きつね ───────── */

type Mood = 'cold' | 'surprised' | 'happy'

function Face({ mood }: { readonly mood: Mood }) {
  // あたまの 左むき(顔の 中心 33,15)。近い目 29、遠い目 35
  return (
    <>
      <ellipse cx="29.8" cy="20.2" rx="2.6" ry="1.6" fill={mood === 'cold' ? CHILL : BLUSH} opacity="0.6" />
      {mood === 'cold' && (
        <>
          <path d="M26.8 11.8 l3.2 1.2 M33.6 12.8 l3 -1" stroke={FUR_SHADE} strokeWidth="1" strokeLinecap="round" />
          <circle cx="28.6" cy="14.8" r="1.1" fill={EYE} />
          <circle cx="34.6" cy="14.8" r="1.1" fill={EYE} />
          <path d="M22.4 21.4 q0.9 -1 1.8 0 q0.9 1 1.8 0 q0.9 -1 1.8 0" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
        </>
      )}
      {mood === 'surprised' && (
        <>
          <circle cx="28.8" cy="14.4" r="1.8" fill={EYE} />
          <circle cx="34.8" cy="14.4" r="1.8" fill={EYE} />
          <circle cx="28.3" cy="13.8" r="0.6" fill="#ffffff" />
          <circle cx="34.3" cy="13.8" r="0.6" fill="#ffffff" />
          <ellipse cx="24.4" cy="21.6" rx="1.2" ry="1.5" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M27.2 15.6 Q28.8 13.2 30.4 15.6" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M33.2 15.6 Q34.8 13.2 36.4 15.6" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M22.6 20.8 Q24.4 23 27 21" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
    </>
  )
}

function Head({ mood, facing }: { readonly mood: Mood; readonly facing: number }) {
  return (
    <Layer scaleX={facing} origin={[37, 20]}>
      {/* 耳: あたまの上に 2つ */}
      <path d="M27.4 10.2 L28.2 2.2 L33.6 8.2 Z" fill={FUR} />
      <path d="M32.6 8.2 L38.2 2.4 L39.2 11 Z" fill={FUR_SHADE} />
      <path d="M28.9 8.6 L29.3 5 L31.6 7.8 Z" fill={SOCK} opacity="0.55" />
      <circle cx="33" cy="15" r="7.2" fill={FUR} />
      {/* ほほの 白い毛 と 先のとがった 口もと */}
      <path d="M26 18.2 Q31 24.6 38 20 Q34 23.4 31 23.2 Q27.6 23 26 18.2 Z" fill={CREAM} />
      <ellipse cx="25.4" cy="18.6" rx="4.8" ry="2.9" fill={FUR_LIGHT} />
      <ellipse cx="25.6" cy="20.2" rx="3.6" ry="1.9" fill={CREAM} />
      <circle cx="21.5" cy="17.9" r="1.3" fill={EYE} />
      <Face mood={mood} />
    </Layer>
  )
}

type FoxProps = { readonly mood: Mood; readonly facing: number; readonly shiver: number }

function Fox({ mood, facing, shiver }: FoxProps) {
  return (
    <Layer x={shiver}>
      <ellipse cx="43" cy="24.5" rx="10" ry="9" fill={FUR} />
      {/* むねの 白い毛 */}
      <ellipse cx="36.6" cy="27.5" rx="3.8" ry="5.6" fill={CREAM} />
      {/* おしり(しっぽは この下から 出る) */}
      <ellipse cx="46.4" cy="28.2" rx="7" ry="6" fill={FUR_SHADE} />
      <rect x="34.6" y="28" width="4.4" height={SEAT_Y - 28} rx="2" fill={FUR} />
      <rect x="34.6" y={SEAT_Y - 2.6} width="4.4" height="2.6" rx="1.2" fill={SOCK} />
      <Head mood={mood} facing={facing} />
    </Layer>
  )
}

/** さむい間の 白い いき。口の前から 上へ ふわっと */
function Breath({ t }: SceneProps) {
  const show = during(t, 0.9, SPROUT, 0.3)
  if (show <= 0) return null
  const p = (((t - 0.9) % 1.3) + 1.3) % 1.3 / 1.3
  return (
    <g opacity={show * (1 - p)}>
      <ellipse cx={19 - p * 7} cy={20 - p * 6} rx={1.8 + p * 2.4} ry={1.3 + p * 1.6} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
    </g>
  )
}

/** ぶるぶる の しるし: からだの よこの みじかい線 */
function ShiverMarks({ t }: SceneProps) {
  const show = during(t, 1.0, SPROUT + 0.1, 0.25)
  if (show <= 0) return null
  const blink = wave(t, 0.24) > 0 ? 1 : 0.35
  return (
    <g opacity={show * blink} stroke="#6aa5d8" strokeWidth="1" strokeLinecap="round" fill="none">
      <path d="M54.6 19 l1.8 2 l-1.8 2" />
      <path d="M57 26 l1.8 2 l-1.8 2" />
      <path d="M31 6 l-1.4 -2" />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  const pop = span(t, 0, COLD, backOut)
  const foxPop = span(t, 0.2, COLD + 0.3, backOut)
  // さむい間は ぶるぶる。しっぽの け が のびると とまる
  const shiver = wave(t, 0.1) * 0.45 * during(t, COLD + 0.4, SPROUT + 0.2, 0.3)
  // びっくり → ふりむく → にっこり
  const mood: Mood = t < SPROUT ? 'cold' : t < LOOK ? 'surprised' : 'happy'
  // ふりむくと、あたまが 反対むき(右)になって しっぽを 見る
  const facing = 1 - 2 * span(t, LOOK - 0.15, LOOK + 0.3)
  // しっぽの ゆれ。字になる前に とまって、2・3画目の位置に そろう
  const sway = wave(t, 1.6) * 1.4 * span(t, SPROUT + 1.2, SPROUT + 1.8) * (1 - span(t, INK - 0.6, INK - 0.1))
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.05

  return (
    <>
      <Layer opacity={ink.picture}>
        <Land pop={pop} />
        <Layer scale={pop} origin={[54, 98]}><Tail t={t} sway={sway} /></Layer>
        <Layer scale={foxPop} origin={[43, SEAT_Y]}>
          <Fox mood={mood} facing={facing} shiver={shiver} />
        </Layer>
        <Breath t={t} />
        <ShiverMarks t={t} />
        <FurSparks t={t} />
        <Snowfall t={t} />
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
    { at: 0, label: '雪の日。きつねが ぶるぶる、しっぽは すかすか', sound: 'pop' },
    { at: SPROUT, label: 'さむさに まけず、しっぽに け が ふさふさ のびる', sound: 'pop' },
    { at: LOOK, label: 'ふりむいて しっぽを 見て にっこり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '毛 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
