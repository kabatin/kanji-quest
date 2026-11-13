/*
 * 国(くに): かこいの 中に たからの 玉。みんなで まもる くに。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … 左の 石がき(かこい の 左がわ)
 *   2画目(𠃍)  … うしろの 石がき と 右の 石がき(上の よこ線 から 右へ まがって 下へ)
 *   3画目(一)  … たからの 台の いちばん上の 皿(玉を のせる)
 *   4画目(丨)  … 台の まんなかの はしら
 *   5画目(一)  … 台の まんなかの 皿
 *   6画目(一)  … 台の いちばん下の 皿
 *   7画目(丶)  … 皿から ぶらさがった まがたま(玉の かざり)
 *   8画目(一)  … 手前の 石がき(かこい の 下がわ)
 *
 * ながれ
 *   たからの 台が でき、玉が ぽん と のる
 *   → こどもが 玉を 見に きて「わあ!」と びっくり(うれしい)
 *   → きつねが 玉を ねらって 近づく。こどもは あわてる(しんぱい)
 *   → こどもが 「ふんっ」と ちからを こめて、石がきを つんで かこいを つくる
 *   → きつねは かこいに ぶつかって、はいれず しょんぼり かえっていく
 *   → こどもは「やったー!」と ばんざい → ほね が ひかって、絵が うすくなり、字「国」が のこる
 *
 * 人・きつねは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   こどもの うで は かた から出て ひじ で まがる。くび は みじかく、どう の まんなか の上。
 *   きつねは よつあし で、みみ は あたまの上、しっぽ は おしりから。
 *   石がきは、下から つみあがる(上から ぶらさがらない)。
 */
import { backOut, during, easeIn, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '国'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#4f9be0'
const TUNIC_DARK = '#3c82c4'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const CHEEK = '#ff9d9d'
const MOUTH = '#b9483f'
const EYE = '#2b2b2b'

const FOX = '#f08a3c'
const FOX_SHADE = '#d8702a'
const FOX_WHITE = '#fff4e6'
const FOX_DARK = '#5b3a2a'

const WOOD = '#d9a066'
const WOOD_DARK = '#a9743f'
const JADE = '#2fc4a0'
const JADE_DARK = '#1f9c80'
const JADE_LIGHT = '#b8f2e2'
const MAGATAMA = '#f0708a'
const MAGATAMA_LIGHT = '#ffb3c3'

const STONE = '#b8a58e'
const STONE_DARK = '#8f7d68'
const STONE_LIGHT = '#dccfbb'

const GRASS = '#c5e8a9'
const GRASS_DARK = '#a9d98a'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const HILL = '#e2f2d2'

/** くぎり の時間(秒) */
const KID_IN = 0.9
const KID_STOP = 2.4
const FOX_IN = 2.7
/** こどもが しんぱいに なる(きつねに きづく) */
const WORRY = 3.2
/** かこいを つくりはじめる時間 と、左・手前・右と上 の できあがり */
const WALL1 = 3.7
const BUMP = 4.45
const WALL8 = 4.55
const WALL8_END = 5.05
const WALL2_MID = 5.5
const WALL_END = 5.95
const FOX_TURN = 4.95
const FOX_LEAVE = 5.35
const FOX_END = 6.9
const INK = 7.0
const DONE = 10.2
const DURATION = 10.7

/** 地面の たかさ */
const GROUND = 97
/** きつねが かこいに ぶつかる 場所(きつねの まんなか) */
const FOX_STOP = 2
/** こどもが たつ 場所(かこいの 右そと) */
const KID_AT = 98
const KID_SCALE = 0.9
const FOX_SCALE = 0.85

/** 2画目の うち、上の よこ線 が おわって 右がわの たて線 に かわる 長さの わりあい */
const CORNER = 0.46

/* ───────── 地面 ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[100, 11]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="99.2" y="0.2" width="1.6" height="3.6" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 100 11)`} />
        ))}
      </Layer>
      <circle cx="100" cy="11" r={5.4 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 93 V101 H-4 Z" fill={HILL} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="6" cy="6" rx="6" ry="2.8" />
        <ellipse cx="10.5" cy="4.6" rx="4.4" ry="2.8" />
      </g>
      <rect x="-4" y="98" width="117" height="12" fill={GRASS_DARK} />
      <ellipse cx="54.5" cy="98.4" rx="64" ry="6" fill={GRASS} />
      {[6, 40, 68, 104].map((x) => (
        <path key={x} d={`M${x} 99 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/* ───────── たからの 台 と 玉 ───────── */

/** 玉(まる い 宝石)の まんなか。いちばん上の 皿に のっている */
const JEWEL_AT: readonly [number, number] = [54.3, 25.2]
const JEWEL_R = 5
/** 皿の 下の かげ(うすい おび)。ほんの 少し 下に ずらす */
const PLATE_SHADOW = 0.7

/** まがたま(日本の むかしの 玉)。7画目の 点の 向き(左上から 右下)に 合わせて、皿から ぶらさげる */
const MAGATAMA_PATH =
  'M65.6 57.6 Q66 54.8 69.2 55 Q72.4 55.4 73.6 58.6 Q75.5 62 77.4 65.8 Q74.2 66.8 71.8 64 Q69.4 61.6 66.8 61.2 Q65.2 60.2 65.6 57.6 Z'
/** まがたま を つるす ひもの かたはし(5画目の 皿の下) */
const CORD_TOP: readonly [number, number] = [67.6, 50.6]

function Plate({ n }: { readonly n: number }) {
  return (
    <>
      <g transform={`translate(0 ${PLATE_SHADOW})`}>
        <Bone char={CHAR} n={n} color={WOOD_DARK} width={4.4} />
      </g>
      <Bone char={CHAR} n={n} color={WOOD} width={3.4} />
    </>
  )
}

function Stand({ t }: SceneProps) {
  const grow = span(t, 0.05, 0.7, backOut)
  const jewel = span(t, 0.7, 1.2, backOut)
  const glow = 0.28 + 0.12 * wave(t, 1.6)
  // 玉に ひかりが あたって きらっと ひかる(こどもが 見つけた とき と、まもりきった とき)
  const glint = Math.max(during(t, KID_STOP, WORRY, 0.3), span(t, WALL_END, WALL_END + 0.4) * (1 - span(t, INK - 0.1, INK + 0.3)))
  return (
    <>
      <Layer scale={grow} origin={[54, 93]}>
        {/* はしら(4画目)と、地面まで のびる 足 */}
        <rect x="52.6" y="70" width="3.4" height="24" rx="1.4" fill={WOOD_DARK} />
        <Bone char={CHAR} n={4} color={WOOD_DARK} width={3.4} />
        <Plate n={3} />
        <Plate n={5} />
        <Plate n={6} />
        {/* まがたま: ひもで 5画目の 皿から ぶらさがる(ゆらゆら) */}
        <Layer rotate={wave(t, 2.2) * 3} origin={CORD_TOP}>
          <path d={`M${CORD_TOP[0]} ${CORD_TOP[1]} L67.6 55.8`} stroke={FOX_DARK} strokeWidth="0.7" strokeLinecap="round" />
          <path d={MAGATAMA_PATH} fill={MAGATAMA} />
          <path d="M67.2 56.6 Q69 55.6 71 56.6" fill="none" stroke={MAGATAMA_LIGHT} strokeWidth="1" strokeLinecap="round" />
          <circle cx="68" cy="57.8" r="0.7" fill={FOX_DARK} />
        </Layer>
      </Layer>
      {/* 玉: ぽん と のって、ほんのり ひかる */}
      <Layer scale={jewel} origin={[JEWEL_AT[0], JEWEL_AT[1] + JEWEL_R]}>
        <circle cx={JEWEL_AT[0]} cy={JEWEL_AT[1]} r={JEWEL_R + 3 + glint * 1.5} fill="#ffffff" opacity={glow + glint * 0.25} />
        <circle cx={JEWEL_AT[0]} cy={JEWEL_AT[1]} r={JEWEL_R} fill={JADE_DARK} />
        <circle cx={JEWEL_AT[0] - 0.4} cy={JEWEL_AT[1] - 0.5} r={JEWEL_R - 0.9} fill={JADE} />
        <ellipse cx={JEWEL_AT[0] - 1.8} cy={JEWEL_AT[1] - 2} rx="1.5" ry="1" fill={JADE_LIGHT} transform={`rotate(-30 ${JEWEL_AT[0] - 1.8} ${JEWEL_AT[1] - 2})`} />
      </Layer>
      {glint > 0 && (
        <>
          <Star cx={JEWEL_AT[0] - 8.4} cy={JEWEL_AT[1] - 3} r={2.3 * glint} color="#fff7b0" spin={t * 60} />
          <Star cx={JEWEL_AT[0] + 8.6} cy={JEWEL_AT[1] - 5.4} r={1.9 * glint} color="#ffffff" spin={-t * 60} />
        </>
      )}
    </>
  )
}

/* ───────── 石がき(かこい) ───────── */

/** 石がきの 1本。うしろに かげ、まんなかに 石の色、左上に ハイライト を重ねる */
function WallStroke({ n, from, to }: { readonly n: number; readonly from: number; readonly to: number }) {
  if (to - from <= 0) return null
  return (
    <>
      <g transform="translate(0 0.9)">
        <Bone char={CHAR} n={n} color={STONE_DARK} width={7.4} from={from} to={to} />
      </g>
      <Bone char={CHAR} n={n} color={STONE} width={6.2} from={from} to={to} />
      <g transform="translate(-1 -1)">
        <Bone char={CHAR} n={n} color={STONE_LIGHT} width={1.8} from={from} to={to} />
      </g>
    </>
  )
}

/** 左 → 手前 → 右と上 の じゅんに、下から つみあがる */
function Walls({ t }: SceneProps) {
  const left = span(t, WALL1, BUMP, easeOut)
  const front = span(t, WALL8, WALL8_END, easeOut)
  const right = span(t, WALL8_END, WALL2_MID, easeOut)
  const top = span(t, WALL2_MID, WALL_END, easeOut)
  // 2画目は 右がわを 下から のぼり、かどを まがって 上の よこ線が 左へ のびる
  const backFrom = 1 - (1 - CORNER) * right - CORNER * top
  return (
    <>
      <WallStroke n={1} from={1 - left} to={1} />
      <WallStroke n={8} from={0} to={front} />
      <WallStroke n={2} from={backFrom} to={1} />
    </>
  )
}

/* ───────── こども(主役) ───────── */

type KidMood = 'happy' | 'wonder' | 'worry' | 'effort' | 'cheer'
/** うで の かっこう。angle = ま下から 外へ ひらいた角度 / bend = ひじ で さらに ひらく角度 */
type ArmPose = { readonly angle: number; readonly bend: number }

const ARM_PART = 6.2
const SHOULDER_X = 6.2
const SHOULDER_Y = -24.2
const rad = (deg: number) => (deg * Math.PI) / 180

/** かた から出て、ひじ で まがる うで。side は 左 -1 / 右 1。 */
function KidArm({ pose, side }: { readonly pose: ArmPose; readonly side: -1 | 1 }) {
  const sx = side * SHOULDER_X
  const ex = sx + side * Math.sin(rad(pose.angle)) * ARM_PART
  const ey = SHOULDER_Y + Math.cos(rad(pose.angle)) * ARM_PART
  const fore = pose.angle + pose.bend
  const hx = ex + side * Math.sin(rad(fore)) * ARM_PART
  const hy = ey + Math.cos(rad(fore)) * ARM_PART
  return (
    <>
      <path d={`M${sx} ${SHOULDER_Y} L${ex} ${ey} L${hx} ${hy}`} fill="none" stroke={TUNIC_DARK} strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hx} cy={hy} r="2.3" fill={SKIN} />
    </>
  )
}

function KidFace({ mood, sweat }: { readonly mood: KidMood; readonly sweat: number }) {
  return (
    <>
      <ellipse cx="-5" cy="-30.4" rx="1.9" ry="1.1" fill={CHEEK} opacity="0.55" />
      <ellipse cx="5" cy="-30.4" rx="1.9" ry="1.1" fill={CHEEK} opacity="0.55" />
      {mood === 'happy' && (
        <>
          <circle cx="-3.6" cy="-33.6" r="1.1" fill={EYE} />
          <circle cx="2" cy="-33.6" r="1.1" fill={EYE} />
          <path d="M-2.4 -30 Q-0.4 -28 1.6 -30" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'wonder' && (
        <>
          <ellipse cx="-3.4" cy="-33.8" rx="2" ry="2.3" fill="#ffffff" />
          <ellipse cx="2.2" cy="-33.8" rx="2" ry="2.3" fill="#ffffff" />
          <circle cx="-4" cy="-34.1" r="1.2" fill={EYE} />
          <circle cx="1.6" cy="-34.1" r="1.2" fill={EYE} />
          <ellipse cx="-1" cy="-29.4" rx="1.3" ry="1.7" fill={MOUTH} />
        </>
      )}
      {mood === 'worry' && (
        <>
          <circle cx="-3.9" cy="-33.4" r="1.2" fill={EYE} />
          <circle cx="1.7" cy="-33.4" r="1.2" fill={EYE} />
          <path d="M-6 -36.2 L-2.2 -37.4 M2.2 -37.4 L5.6 -36.2" fill="none" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <path d="M-3 -29.4 Q-1.8 -30.6 -0.6 -29.6 Q0.6 -28.6 1.8 -29.8" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M7 -36.4 Q8.6 -34 7 -33 Q5.4 -34 7 -36.4 Z" fill="#7cc4f2" transform={`translate(0 ${sweat * 2.4})`} opacity={1 - sweat * 0.5} />
        </>
      )}
      {mood === 'effort' && (
        <>
          <path d="M-5.4 -35 L-2.8 -33.8 L-5.4 -32.6 M3.6 -35 L1 -33.8 L3.6 -32.6" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M-3 -29.6 h4.2" stroke={MOUTH} strokeWidth="1.3" strokeLinecap="round" />
        </>
      )}
      {mood === 'cheer' && (
        <>
          <path d="M-5.4 -33 Q-3.8 -35.4 -2.2 -33 M0.6 -33 Q2.2 -35.4 3.8 -33" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M-3.4 -30.6 Q-0.2 -26.4 3 -30.6 Z" fill={MOUTH} />
        </>
      )}
    </>
  )
}

type KidProps = { readonly mood: KidMood; readonly left: ArmPose; readonly right: ArmPose; readonly stride: number; readonly sweat: number }

/** こども(足もとが 0,0)。まえ向きの 体で、目だけ 左(玉・きつね の ほう)を 見る。 */
function Kid({ mood, left, right, stride, sweat }: KidProps) {
  return (
    <>
      {/* あし: こしから。あるくときは かわりばんこに ふる */}
      <Layer rotate={stride * 18} origin={[-3.2, -12]}>
        <rect x="-5" y="-12" width="3.6" height="11.6" rx="1.8" fill={PANTS} />
        <ellipse cx="-3.4" cy="-0.8" rx="3.2" ry="1.8" fill={SHOE} />
      </Layer>
      <Layer rotate={-stride * 18} origin={[3.2, -12]}>
        <rect x="1.4" y="-12" width="3.6" height="11.6" rx="1.8" fill={PANTS} />
        <ellipse cx="3.4" cy="-0.8" rx="3.2" ry="1.8" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう と あたま の間に ちょっと 見える */}
      <rect x="-2" y="-29" width="4" height="4" rx="1.6" fill={SKIN_SHADE} />
      {/* どう */}
      <rect x="-6.6" y="-27" width="13.2" height="16.4" rx="5.4" fill={TUNIC} />
      <path d="M-5.6 -15.4 h11.2" stroke={TUNIC_DARK} strokeWidth="1.5" strokeLinecap="round" />
      <KidArm pose={left} side={-1} />
      <KidArm pose={right} side={1} />
      {/* あたま */}
      <circle cx="0" cy="-33.5" r="7.4" fill={SKIN} />
      <path d="M-7.6 -33 C-8.2 -41.6 8.2 -42.2 7.6 -33.4 C5.4 -37.4 -4 -38 -7.6 -33 Z" fill={HAIR} />
      <path d="M-1 -40.6 Q0 -43.6 1.8 -41.4" fill="none" stroke={HAIR} strokeWidth="1.6" strokeLinecap="round" />
      <KidFace mood={mood} sweat={sweat} />
    </>
  )
}

/** 「ふんっ」と ちからを こめる ときの、あたまの上の 3本の すじ */
function EffortLines({ t }: SceneProps) {
  const show = span(t, WALL1 - 0.2, WALL1 + 0.1) * (1 - span(t, WALL_END - 0.1, WALL_END + 0.15))
  if (show <= 0) return null
  const pulse = 0.5 + 0.5 * wave(t, 0.34)
  return (
    <g opacity={show} stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round">
      {[-1, 0, 1].map((k) => (
        <path key={k} d={`M${k * 6.6} ${-45.5 - pulse * 0.8} l${k * 1.6} ${-2.6}`} />
      ))}
    </g>
  )
}

/** うで の かっこう を 時間から きめる(あるく → びっくり → しんぱい → ちからを こめる → ばんざい) */
function armPoses(t: number, stride: number): { readonly left: ArmPose; readonly right: ArmPose } {
  const surprise = during(t, KID_STOP, WORRY, 0.25)
  const worry = during(t, WORRY, WALL1 - 0.2, 0.2) * (0.8 + 0.2 * wave(t, 0.25))
  const push = span(t, WALL1 - 0.3, WALL1 + 0.15, easeOut) * (1 - span(t, WALL_END, WALL_END + 0.3))
  const cheer = span(t, WALL_END + 0.1, WALL_END + 0.5, backOut)
  const base = 8 + 42 * surprise + 16 * worry + 114 * push + 140 * cheer
  const bend = 6 + 4 * surprise + 8 * worry + 34 * push + 4 * cheer
  const wiggle = wave(t, 0.28) * 4 * push + wave(t, 0.5) * 7 * cheer
  const swing = stride * 12
  return {
    left: { angle: Math.max(0, base + swing + wiggle), bend },
    right: { angle: Math.max(0, base - swing - wiggle), bend },
  }
}

function kidMood(t: number): KidMood {
  if (t < KID_STOP) return 'happy'
  if (t < WORRY) return 'wonder'
  if (t < WALL1) return 'worry'
  if (t < WALL_END + 0.1) return 'effort'
  return 'cheer'
}

/* ───────── きつね ───────── */

type FoxMood = 'sly' | 'sad'

type FoxProps = { readonly mood: FoxMood; readonly stride: number; readonly tailSway: number; readonly headShake: number }

/** きつね(足もとの まんなかが 0,0。右むき)。よつあし、みみ は あたまの上、しっぽ は おしりから。 */
function FoxBody({ mood, stride, tailSway, headShake }: FoxProps) {
  const sad = mood === 'sad'
  return (
    <>
      {/* しっぽ: ふさふさ。しょんぼり すると 下がる */}
      <Layer rotate={sad ? -35 : tailSway} origin={[-7, -10]}>
        <path d="M-6 -9 C-12 -8 -17 -12 -19 -17 C-14 -17 -10 -15 -5 -13 Z" fill={FOX} />
        <ellipse cx="-18.2" cy="-16.4" rx="2.3" ry="2" fill={FOX_WHITE} />
      </Layer>
      {/* むこうがわの あし */}
      <Layer rotate={-stride * 24} origin={[-3.5, -8]}>
        <rect x="-4.8" y="-9" width="2.8" height="9" rx="1.4" fill={FOX_SHADE} />
        <rect x="-4.8" y="-3.6" width="2.8" height="3.6" rx="1.4" fill={FOX_DARK} />
      </Layer>
      <Layer rotate={stride * 24} origin={[7.5, -8]}>
        <rect x="6.2" y="-9" width="2.8" height="9" rx="1.4" fill={FOX_SHADE} />
        <rect x="6.2" y="-3.6" width="2.8" height="3.6" rx="1.4" fill={FOX_DARK} />
      </Layer>
      {/* どう */}
      <ellipse cx="0" cy="-9.5" rx="9" ry="5" fill={FOX} />
      <ellipse cx="2" cy="-6.8" rx="5" ry="2.2" fill={FOX_WHITE} />
      {/* てまえの あし */}
      <Layer rotate={stride * 24} origin={[-6.5, -8]}>
        <rect x="-7.8" y="-9" width="2.8" height="9" rx="1.4" fill={FOX} />
        <rect x="-7.8" y="-3.6" width="2.8" height="3.6" rx="1.4" fill={FOX_DARK} />
      </Layer>
      <Layer rotate={-stride * 24} origin={[4.5, -8]}>
        <rect x="3.2" y="-9" width="2.8" height="9" rx="1.4" fill={FOX} />
        <rect x="3.2" y="-3.6" width="2.8" height="3.6" rx="1.4" fill={FOX_DARK} />
      </Layer>
      {/* あたま: ぶつかると ちょっと ゆれる */}
      <Layer rotate={headShake} origin={[6, -11]}>
        <Layer rotate={sad ? -40 : 0} origin={[8, -17]}>
          <path d="M6 -16 L6.6 -22.4 L10 -17.6 Z" fill={FOX} />
        </Layer>
        <Layer rotate={sad ? 40 : 0} origin={[11.2, -17]}>
          <path d="M9.5 -17.3 L12.4 -22.2 L13 -16.3 Z" fill={FOX} />
          <path d="M10.8 -17.6 L12.2 -20.4 L12.4 -17.2 Z" fill={FOX_DARK} />
        </Layer>
        <circle cx="9.5" cy="-13.5" r="4.6" fill={FOX} />
        <path d="M12 -16 L17.5 -11.8 L12 -9.8 Z" fill={FOX} />
        <path d="M8.6 -10.6 Q12 -8.4 15.6 -11.2 L12 -9.8 Z" fill={FOX_WHITE} />
        <circle cx="17.3" cy="-12" r="1" fill={FOX_DARK} />
        {sad ? (
          <>
            <circle cx="11.6" cy="-14.4" r="1" fill={EYE} />
            <path d="M10 -16.6 L13 -15.8" stroke={FOX_DARK} strokeWidth="0.8" strokeLinecap="round" />
            <path d="M13.4 -10.2 Q15.2 -11.4 16.6 -10" fill="none" stroke={FOX_DARK} strokeWidth="0.7" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M10 -14.6 Q11.6 -15.8 13 -14.2" fill="none" stroke={EYE} strokeWidth="1" strokeLinecap="round" />
            <path d="M10 -16.4 L13.2 -16.8" stroke={FOX_DARK} strokeWidth="0.8" strokeLinecap="round" />
            <path d="M13.4 -10.8 Q15.4 -9.4 16.8 -10.8" fill="none" stroke={FOX_DARK} strokeWidth="0.7" strokeLinecap="round" />
          </>
        )}
      </Layer>
    </>
  )
}

/** きつねの「玉が ほしい」の ふきだし(あたまの上) */
function WantBubble({ t }: SceneProps) {
  const show = during(t, FOX_IN + 0.5, BUMP, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      <circle cx="3" cy="-24" r="1.3" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
      <circle cx="4.4" cy="-28" r="1.9" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
      <circle cx="8" cy="-36" r="7.4" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <circle cx="8" cy="-36" r="3.6" fill={JADE_DARK} />
      <circle cx="7.8" cy="-36.2" r="2.9" fill={JADE} />
      <ellipse cx="7" cy="-37.4" rx="1" ry="0.6" fill={JADE_LIGHT} />
    </g>
  )
}

/** かこいに ぶつかった しゅんかんの「ごんっ」の すじ */
function BumpBurst({ t }: SceneProps) {
  const show = during(t, BUMP, BUMP + 0.45, 0.08)
  if (show <= 0) return null
  const p = span(t, BUMP, BUMP + 0.45, easeOut)
  return (
    <g opacity={show} stroke="#fff3b0" strokeWidth="1.2" strokeLinecap="round">
      {[-40, 0, 40].map((deg) => (
        <path key={deg} d="M3 0 L7 0" transform={`translate(18 87) rotate(${deg}) translate(${p * 2} 0)`} />
      ))}
    </g>
  )
}

/** きつね の うごき: ねらって あるいてくる → ぶつかる → しょんぼり ふりむいて かえる */
function FoxActor({ t }: SceneProps) {
  if (t < FOX_IN || t >= FOX_END) return null
  const arriving = t < BUMP
  const leaving = t >= FOX_LEAVE
  const bumpOffset = 2.6 * Math.sin(span(t, BUMP, BUMP + 0.3) * Math.PI)
  const x = arriving ? mix(t, FOX_IN, BUMP, -12, FOX_STOP, (v) => v) : leaving ? mix(t, FOX_LEAVE, FOX_END, FOX_STOP, -40, easeIn) : FOX_STOP - bumpOffset
  const stepping = arriving ? Math.sin((t - FOX_IN) * Math.PI * 2 * 2.6) : leaving ? Math.sin((t - FOX_LEAVE) * Math.PI * 2 * 2.2) : 0
  const facing = 1 - 2 * span(t, FOX_TURN, FOX_TURN + 0.3)
  const mood: FoxMood = t < BUMP ? 'sly' : 'sad'
  const headShake = t >= BUMP && t < BUMP + 0.5 ? wave(t - BUMP, 0.18) * 7 * (1 - span(t, BUMP, BUMP + 0.5)) : 0
  return (
    <>
      <ellipse cx={x} cy={GROUND + 0.4} rx="9" ry="2" fill="#000000" opacity="0.12" />
      <Layer x={x} y={GROUND} scale={FOX_SCALE} origin={[0, 0]}>
        <Layer scaleX={facing} origin={[0, 0]}>
          <FoxBody mood={mood} stride={stepping} tailSway={wave(t, 0.6) * 6} headShake={headShake} />
          <WantBubble t={t} />
        </Layer>
      </Layer>
    </>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)

  // こども: 右から あるいてきて、玉の まえで 立ちどまる
  const walking = t >= KID_IN ? 1 - span(t, KID_STOP - 0.35, KID_STOP) : 0
  const stride = Math.sin((t - KID_IN) * Math.PI * 2 * 1.8) * walking
  const kidX = mix(t, KID_IN, KID_STOP, 136, KID_AT, easeOut)
  // ばんざい の ときは ぴょんぴょん はねる(ちゅうに うくので、かげは ちいさく)
  const cheerOn = span(t, WALL_END + 0.1, WALL_END + 0.4)
  const hop = Math.abs(Math.sin(((t - WALL_END) * Math.PI) / 0.55)) * 3.2 * cheerOn
  const bob = -Math.abs(stride) * 1.2 - hop
  const arms = armPoses(t, stride)
  const sweat = (t * 1.6) % 1

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Stand t={t} />
        <Walls t={t} />
        <FoxActor t={t} />
        <BumpBurst t={t} />
        <Layer opacity={span(t, KID_IN - 0.1, KID_IN + 0.1)}>
          <ellipse cx={kidX} cy={GROUND + 0.4} rx={8.4 - hop * 0.6} ry="2.2" fill="#000000" opacity="0.12" />
          <Layer x={kidX} y={GROUND + bob} scale={KID_SCALE} origin={[0, 0]}>
            <Kid mood={kidMood(t)} left={arms.left} right={arms.right} stride={stride} sweat={sweat} />
            <EffortLines t={t} />
          </Layer>
        </Layer>
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
    { at: 0, label: 'たからの 台に 玉が ぽん と のる', sound: 'pop' },
    { at: KID_IN, label: 'こどもが 玉を 見に くる' },
    { at: KID_STOP, label: '「わあ、たからの 玉!」', sound: 'pop' },
    { at: FOX_IN, label: 'きつねが 玉を ねらって 近づく' },
    { at: WALL1, label: 'こどもが 石がきで かこいを つくる' },
    { at: BUMP, label: 'きつねは かこいに ぶつかって はいれない', sound: 'pop' },
    { at: WALL_END + 0.1, label: '「やったー!」玉を まもった' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '国 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
