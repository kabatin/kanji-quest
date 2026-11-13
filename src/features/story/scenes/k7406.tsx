/*
 * 理(り): 玉(たま)を みがいて、きれいな すじを 出す。
 *
 * ほね(画と絵の対応)
 *   1・3・4画目(王の 3本の よこ) … みがくと うかびあがる、玉(ぎょく)の 3本の すじ
 *   2画目(王の たて)             … 玉の まんなかを とおる たての すじ
 *   5〜9画目(里の まど)          … 木の いえの まど(まわりの わく・よこの しきり・たての しきり)
 *   10画目                      … かべの よこ木(はり)
 *   11画目                      … いえの いちばん下の どだい
 *   (まど・はり・どだい は 字の線と だいたい 同じ場所。字の 音「リ」の パーツの 里 を、村の いえ として のこす)
 *
 * ながれ
 *   木の いえの よこに、ざらざらの 大きな 石が ある。子どもが あるいてきて、ふみ台に ぴょんと のる
 *   → 「なんだろう?」と ふしぎそうに 見る → ぬのを もって ごしごし みがく(あせ が ひかる)
 *   → 下から だんだん つやつやの 玉(みどり色)に なり、ぽわっと すじが うかぶ → 子どもが びっくり、にっこり
 *   → 上まで みがけて、「やったー!」と ばんざい
 *   → すじ(ほね)が ひかって、絵が うすくなり、字「理」が のこる
 *
 * 子どもは ほんものの つくり を守る(字の形に合わせるために 体を ゆがめない):
 *   うで は かた から出て、ひじ で まがる(かた → ひじ → 手)。くび は みじかい。
 *   石は ほんものの 石らしく ざらざらで、みがくと 下から つやが 出る。まどの わくも まっすぐに かく。
 */
import { backOut, clamp01, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '理'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#f08a5d'
const TUNIC_DARK = '#d96f44'
const TUNIC_FAR = '#c25f3a'
const PANTS = '#4a6fa5'
const PANTS_DARK = '#3d5d8f'
const SHOE = '#6b4a36'
const CLOTH = '#f4f8ff'
const CLOTH_SHADE = '#cfdcf0'
const ROCK = '#a39d92'
const ROCK_DARK = '#868075'
const ROCK_LIGHT = '#bcb6aa'
const JADE = '#5fc79a'
const JADE_DARK = '#3fa97c'
const JADE_LIGHT = '#a9edcb'
const VEIN = '#effff6'
const WALL = '#f1dcb4'
const WALL_SHADE = '#e3c998'
const WOOD = '#8c5b3c'
const WOOD_DARK = '#70452b'
const ROOF = '#d65a43'
const GLASS = '#cdeaf9'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'

/** くぎり の時間(秒) */
const WALK = 0.5
const HOP = 1.4
const STAND = 1.85
const RUB = 2.5
const SURPRISE = 3.0
const HAPPY = 3.8
const POLISHED = 5.8
const INK = 6.6
const DONE = 9.8
const DURATION = 10.4

/** 子どもの ふみ台の うえ: 地面から このぶん 上がる */
const STOOL_LIFT = 7
/** 子どもの かた(足が 地面のときの 場所)と、うでの 1ほんぶんの 長さ */
const SHOULDER: readonly [number, number] = [60.5, 68]
const ARM_PART = 15
/** 石の ひょうめん(みがく 場所)の x。ここに 手を あてる */
const ROCK_FACE_X = 44.5
/** 石の 上と下(ここを 下から 上へ みがきあげる) */
const ROCK_BOTTOM = 94
const ROCK_TOP = 12

type Point = readonly [number, number]

const ROCK_PATH = 'M17 17 Q30 12 40 20 Q46 28 44 42 L45 78 Q45 92 34 92 H18 Q7 92 8 78 L8.5 30 Q9 20 17 17 Z'

/** うでを 2本の ほね(かた → ひじ → 手)で つなぐ。手の場所 から ひじを きめる(pole に ちかい ほうへ まがる)。 */
function solveElbow(shoulder: Point, hand: Point, pole: Point): Point {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const dist = Math.min(Math.max(Math.hypot(dx, dy), 0.01), ARM_PART * 2 - 0.02)
  const half = dist / 2
  const rise = Math.sqrt(Math.max(ARM_PART * ARM_PART - half * half, 0))
  const mx = shoulder[0] + (dx / Math.hypot(dx, dy || 0.01)) * half
  const my = shoulder[1] + (dy / Math.hypot(dx, dy || 0.01)) * half
  const nx = -dy / Math.hypot(dx, dy || 0.01)
  const ny = dx / Math.hypot(dx, dy || 0.01)
  const a: Point = [mx + nx * rise, my + ny * rise]
  const b: Point = [mx - nx * rise, my - ny * rise]
  const near = (p: Point) => Math.hypot(p[0] - pole[0], p[1] - pole[1])
  return near(a) <= near(b) ? a : b
}

/** 手が とどく ところまでに おさえる(うでを のばしすぎない) */
function clampReach(shoulder: Point, hand: Point): Point {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const dist = Math.hypot(dx, dy)
  const limit = ARM_PART * 2 - 0.6
  if (dist <= limit) return hand
  return [shoulder[0] + (dx / dist) * limit, shoulder[1] + (dy / dist) * limit]
}

function Ground() {
  return (
    <>
      <path d="M-4 94 Q16 74 40 90 Q70 72 113 92 V96 H-4 Z" fill="#e2f2d2" />
      <rect x="-2" y="92.5" width="113" height="20" fill={GRASS} />
      {[4, 36, 78, 104].map((x) => (
        <path key={x} d={`M${x} 95 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

function Sun({ t }: SceneProps) {
  const show = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={show} rotate={t * 14} origin={[8, 8]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="7.3" y="-1.2" width="1.4" height="3.2" rx="0.7" fill={SUN} transform={`rotate(${i * 45} 8 8)`} />
        ))}
      </Layer>
      <circle cx="8" cy="8" r={4.6 * show} fill={SUN} />
    </>
  )
}

/** 木の いえ。まどの わく は まっすぐに かく(字の 里 の 場所と だいたい 同じ) */
function House() {
  return (
    <>
      {/* かべ と やね */}
      <rect x="44" y="9" width="66" height="84" fill={WALL} />
      <rect x="44" y="9" width="66" height="4" fill={WALL_SHADE} />
      <path d="M40 10 L46 1.5 H112 V10 Z" fill={ROOF} />
      {/* はり と どだい(10画目・11画目) */}
      <rect x="44" y="66" width="66" height="4.2" rx="1" fill={WOOD} />
      <rect x="40" y="87.6" width="70" height="4.8" rx="1.2" fill={WOOD_DARK} />
      {/* たての はしら(9画目の 下のほう): まどの 下から どだいまで */}
      <rect x="67.8" y="52" width="3.6" height="36" fill={WOOD} />
      {/* まど: 外わく・ガラス・しきり */}
      <rect x="47.5" y="18.5" width="44" height="35.5" rx="2" fill={WOOD} />
      <rect x="50.6" y="21.6" width="37.8" height="29.3" rx="1" fill={GLASS} />
      <path d="M53 29 l6 -6 M53 36 l12 -12" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
      <rect x="50.6" y="32.2" width="37.8" height="2.8" fill={WOOD} />
      <rect x="67.8" y="21.6" width="3" height="29.3" fill={WOOD} />
    </>
  )
}

function Stool() {
  return (
    <>
      <rect x="54" y="86" width="22" height="3.4" rx="1.4" fill="#b98558" />
      <rect x="56.5" y="89" width="3.6" height="4" fill={WOOD} />
      <rect x="69.9" y="89" width="3.6" height="4" fill={WOOD} />
    </>
  )
}

/** ざらざらの 石(みがく まえ)。かげ・くぼみ・ひび を つける */
function RoughRock() {
  return (
    <>
      <path d={ROCK_PATH} fill={ROCK} />
      <path d="M37 18 Q46 26 44 42 L45 78 Q45 92 34 92 H31 Q41 80 40 56 Q40 30 33 17 Z" fill={ROCK_DARK} />
      <path d="M14 20 Q22 16 30 17 Q20 20 13 28 Z" fill={ROCK_LIGHT} />
      <ellipse cx="17" cy="44" rx="3.2" ry="2.2" fill={ROCK_DARK} opacity="0.7" />
      <ellipse cx="33" cy="62" rx="2.6" ry="1.8" fill={ROCK_DARK} opacity="0.7" />
      <ellipse cx="22" cy="76" rx="3.4" ry="2" fill={ROCK_DARK} opacity="0.7" />
      <ellipse cx="30" cy="33" rx="2" ry="1.4" fill={ROCK_DARK} opacity="0.7" />
      <path d="M20 58 l3 -3 l1.4 3.4 M28 82 l2 -3.6" fill="none" stroke={ROCK_DARK} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )
}

/** みがかれて つやつやの 玉。boundary より 下が みがけた ところ */
function PolishedRock({ boundary }: { readonly boundary: number }) {
  if (boundary >= ROCK_BOTTOM) return null
  return (
    <>
      <clipPath id="k7406-polished">
        <rect x="0" y={boundary} width="52" height="110" />
      </clipPath>
      <clipPath id="k7406-rock">
        <path d={ROCK_PATH} />
      </clipPath>
      <g clipPath="url(#k7406-polished)">
        <g clipPath="url(#k7406-rock)">
          <rect x="0" y="0" width="52" height="100" fill={JADE} />
          <rect x="34" y="0" width="12" height="100" fill={JADE_DARK} />
          <rect x="11" y="0" width="5" height="100" fill={JADE_LIGHT} opacity="0.85" />
          {/* ぬのが とおった あとの ひかる おび */}
          <rect x="0" y={boundary} width="52" height="2.6" fill="#ffffff" opacity="0.75" />
        </g>
      </g>
    </>
  )
}

/** みがくと うかぶ すじ(1・3・4画目の よこ と 2画目の たて)。みがき線(boundary)が とおると のびる */
function Veins({ boundary }: { readonly boundary: number }) {
  const grow = (y: number) => clamp01((y + 4 - boundary) / 9)
  const bars: readonly (readonly [n: number, y: number])[] = [[4, 82], [3, 50], [1, 28]]
  const standing = clamp01((82 - boundary) / 54)
  return (
    <>
      {bars.map(([n, y]) => (
        <g key={n}>
          <Bone char={CHAR} n={n} color={JADE_DARK} width={4.6} to={grow(y)} />
          <Bone char={CHAR} n={n} color={VEIN} width={2.6} to={grow(y)} />
        </g>
      ))}
      <Bone char={CHAR} n={2} color={JADE_DARK} width={4.6} from={1 - standing} />
      <Bone char={CHAR} n={2} color={VEIN} width={2.6} from={1 - standing} />
    </>
  )
}

/** みがけた ところで きらっと ひかる ほし */
function Glints({ t, boundary }: SceneProps & { readonly boundary: number }) {
  const spots: readonly (readonly [number, number, number])[] = [
    [16, 38, 0],
    [35, 62, 0.4],
    [23, 86, 0.2],
    [34, 30, 0.7],
  ]
  return (
    <>
      {spots.map(([x, y, phase]) => {
        if (boundary > y - 6) return null
        const size = 1.6 + 1.6 * Math.abs(wave(t, 0.9, phase))
        return <Star key={`${x}-${y}`} cx={x} cy={y} r={size} color="#ffffff" spin={t * 40} />
      })}
    </>
  )
}

type Mood = 'calm' | 'puzzled' | 'effort' | 'surprised' | 'happy' | 'joy'

/** 顔(左むき)。頭の まんなかは (61.5, 55) */
function Face({ mood }: { readonly mood: Mood }) {
  const INK_EYE = '#2b2b2b'
  const MOUTH = '#b9483f'
  return (
    <>
      <circle cx="59.2" cy="58.4" r="2.1" fill="#ff9d9d" opacity="0.55" />
      {mood === 'calm' && (
        <>
          <circle cx="58.1" cy="55.2" r="1.15" fill={INK_EYE} />
          <path d="M56.4 59.6 Q57.8 61 59.4 59.8" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'puzzled' && (
        <>
          <path d="M56.2 52.2 l3.4 -1.4" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="58.1" cy="55.4" r="1.25" fill={INK_EYE} />
          <ellipse cx="57.4" cy="59.8" rx="1.1" ry="1.3" fill={MOUTH} />
        </>
      )}
      {mood === 'effort' && (
        <>
          <path d="M56.4 53.6 L59.6 55 L56.4 56.4" fill="none" stroke={INK_EYE} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M56 59.8 h3.2" stroke={MOUTH} strokeWidth="1.3" strokeLinecap="round" />
        </>
      )}
      {mood === 'surprised' && (
        <>
          <circle cx="58" cy="55" r="1.9" fill="#ffffff" stroke={INK_EYE} strokeWidth="0.7" />
          <circle cx="57.7" cy="55.2" r="0.95" fill={INK_EYE} />
          <ellipse cx="57.4" cy="60" rx="1.5" ry="2" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M56.4 56.2 Q58 53.8 59.6 56.2" fill="none" stroke={INK_EYE} strokeWidth="1.25" strokeLinecap="round" />
          <path d="M55.8 59 Q57.6 62 59.8 59.4" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'joy' && (
        <>
          <path d="M56.4 56.2 Q58 53.6 59.6 56.2" fill="none" stroke={INK_EYE} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M55.6 58.6 Q57.8 59.2 60 58.6 Q59.4 62.8 57.8 62.8 Q56.2 62.8 55.6 58.6 Z" fill={MOUTH} />
        </>
      )}
    </>
  )
}

type ArmProps = { readonly hand: Point; readonly color: string; readonly cloth?: boolean }

/** かた から出て、ひじ で まがる うで。手に ぬのを もつことも ある */
function Arm({ hand, color, cloth = false }: ArmProps) {
  const reach = clampReach(SHOULDER, hand)
  const elbow = solveElbow(SHOULDER, reach, [90, 90])
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${reach[0]} ${reach[1]}`} fill="none" stroke={color} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={reach[0]} cy={reach[1]} r="3.2" fill={SKIN} />
      {cloth && (
        <g transform={`translate(${reach[0] - 3.4} ${reach[1]})`}>
          <rect x="-3.4" y="-4.4" width="6.8" height="8.8" rx="2.2" fill={CLOTH} />
          <path d="M-1.6 -2.4 v4.8" stroke={CLOTH_SHADE} strokeWidth="1" strokeLinecap="round" />
        </g>
      )}
    </>
  )
}

type PersonProps = {
  readonly step: number
  readonly mood: Mood
  readonly nearHand: Point
  readonly farHand: Point
  readonly headTilt: number
  readonly rub: boolean
}

/** 子ども(左むき)。足は 地面(y=93)に ついたときの 場所でかく */
function Person({ step, mood, nearHand, farHand, headTilt, rub }: PersonProps) {
  return (
    <>
      <Arm hand={farHand} color={TUNIC_FAR} />
      <Layer rotate={step * 17} origin={[63, 77]}>
        <rect x="60.6" y="75" width="5.6" height="16.5" rx="2.8" fill={PANTS_DARK} />
        <ellipse cx="62" cy="92.6" rx="5" ry="2.6" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 17} origin={[58, 77]}>
        <rect x="55" y="75" width="5.6" height="16.5" rx="2.8" fill={PANTS} />
        <ellipse cx="56.4" cy="92.6" rx="5" ry="2.6" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう と あたま の間を つなぐ */}
      <rect x="58.8" y="60" width="5.2" height="7" rx="2.4" fill={SKIN_SHADE} />
      <rect x="54.2" y="63.6" width="13.6" height="19" rx="6.6" fill={TUNIC} />
      <path d="M56 76 h10" stroke={TUNIC_DARK} strokeWidth="1.5" strokeLinecap="round" />
      <Arm hand={nearHand} color={TUNIC_DARK} cloth={rub} />
      <Layer rotate={headTilt} origin={[61, 63]}>
        <circle cx="61.5" cy="55" r="9.4" fill={SKIN} />
        <path d="M54.2 46.8 C54.1 37.6 64.5 35 70.5 40.8 C72.9 44 72.9 49.8 70.9 54 C70.3 48.2 66.1 44 59.3 44.4 C57.1 44.6 55.3 45.6 54.2 46.8 Z" fill={HAIR} />
        <path d="M65 40 Q65.8 37 67.6 39 Q68.8 36.4 69.6 39.4" fill="none" stroke={HAIR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

/** みがいているときの あせ。あたまの うしろ(右)へ とぶ */
function Sweat({ t, ox, oy }: SceneProps & { readonly ox: number; readonly oy: number }) {
  const show = during(t, RUB + 0.1, SURPRISE + 0.1, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.4].map((offset) => {
        const p = ((t + offset) % 0.8) / 0.8
        const x = 71 + p * 7 + ox
        const y = 48 + p * 9 - Math.sin(p * Math.PI) * 5 + oy
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" transform={`translate(${x} ${y}) rotate(35)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** 「なんだろう?」の はてな。あたまの上に ぽんと出る */
function Wonder({ t, ox, oy }: SceneProps & { readonly ox: number; readonly oy: number }) {
  const show = during(t, STAND, RUB, 0.2)
  if (show <= 0) return null
  const pop = span(t, STAND, STAND + 0.3, backOut)
  return (
    <g opacity={show} transform={`translate(${60 + ox} ${34 + oy}) scale(${Math.max(pop, 0.01)})`} fill="none" stroke="#5f7fd6" strokeWidth="1.6" strokeLinecap="round">
      <path d="M-2.4 -2.6 Q-2.4 -5.8 0.4 -5.8 Q3.2 -5.8 3.2 -3.2 Q3.2 -1.4 0.8 -0.4 Q0.2 0 0.2 1.6" />
      <circle cx="0.2" cy="4.4" r="0.5" fill="#5f7fd6" />
    </g>
  )
}

/** 小鳥。石の上に とんできて とまり、ちゅんちゅん うたう */
function Bird({ t }: SceneProps) {
  const arrive = span(t, 1.7, 2.6, easeOut)
  if (arrive <= 0) return null
  const x = -8 + arrive * 36
  const y = 0 + arrive * 11.6 - Math.sin(arrive * Math.PI) * 6
  const landed = arrive >= 1
  const hop = landed ? Math.max(Math.abs(wave(t, 0.7)), 0) * 0.9 : 0
  const flap = landed ? 0 : wave(t, 0.16) * 28
  const note = during(t, 3.0, POLISHED, 0.25)
  return (
    <>
      <Layer x={x} y={y - hop}>
        <path d="M2.6 0.4 l4.6 -1.6 l-3.4 3.2 Z" fill="#e2733f" />
        <ellipse cx="0" cy="0" rx="4" ry="3.1" fill="#ff9a5c" />
        <circle cx="-3" cy="-2.3" r="2.3" fill="#ff9a5c" />
        <path d="M-5 -2.4 l-2.4 0.7 l2.3 0.9 Z" fill="#f2b632" />
        <circle cx="-3.6" cy="-2.8" r="0.55" fill="#2b2b2b" />
        <Layer rotate={flap} origin={[0.4, -0.6]}>
          <path d="M-1.2 -0.8 Q1.6 -3.8 4 -0.6 Q1.6 0.8 -1.2 -0.8 Z" fill="#e2733f" />
        </Layer>
      </Layer>
      <g opacity={note * (landed ? 1 : 0)} fill="#f07f9e">
        <path d={`M${36 - wave(t, 1.2) * 1.2} ${9 - ((t * 5) % 5)} v-4.4 l2.6 -0.8 v4.2`} fill="none" stroke="#f07f9e" strokeWidth="0.8" />
        <ellipse cx={35.2 - wave(t, 1.2) * 1.2} cy={9 - ((t * 5) % 5)} rx="1.1" ry="0.8" />
      </g>
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 11)

  // 子どもの うごき: 右から あるく → ふみ台に ぴょんと のる
  const walking = span(t, WALK, HOP) < 1 && t >= WALK
  const stride = walking ? Math.sin((t - WALK) * Math.PI * 2 * 1.8) : 0
  const walkX = t < HOP ? mix(t, WALK, HOP, 58, 22, easeOut) : mix(t, HOP, STAND, 22, 0, easeInOut)
  const hopP = span(t, HOP, STAND)
  const lift = mix(t, HOP, STAND, 0, -STOOL_LIFT, easeInOut) - Math.sin(hopP * Math.PI) * 6
  const bob = walking ? -Math.abs(stride) * 1.2 : 0
  const rubbing = t >= RUB && t < POLISHED
  const cheer = span(t, POLISHED, POLISHED + 0.4, backOut)
  // 下から 上へ みがく線。これより 下が つやつやの 玉
  const boundary = mix(t, RUB, POLISHED, ROCK_BOTTOM, ROCK_TOP, easeInOut)
  // 子どもが つま先立ちするのは、石の 上のほうを みがく とき
  const tiptoe = rubbing ? -2 * clamp01((46 - boundary) / 14) : 0
  const joyHop = t >= POLISHED ? -Math.abs(wave(t - POLISHED, 0.9)) * 1.6 * span(t, POLISHED + 0.3, POLISHED + 0.5) : 0
  const oy = lift + bob + tiptoe + joyHop
  const ox = walkX

  const mood: Mood = t < STAND - 0.3 ? 'calm' : t < RUB ? 'puzzled' : t < SURPRISE ? 'effort' : t < HAPPY ? 'surprised' : t < POLISHED ? 'happy' : 'joy'
  const headTilt = t < STAND - 0.3 ? 0 : t < RUB ? -9 : t < SURPRISE ? 3 : t < POLISHED ? -2 : -5 + wave(t, 0.9) * 2

  // うで: あるくときは 足と ぎゃくに ふる。ざらざらの 石に ぬのを あてて ごしごし。さいごは ばんざい
  const hangFor = (swing: number): Point => [SHOULDER[0] - Math.sin((swing * Math.PI) / 180) * 26, SHOULDER[1] + Math.cos((swing * Math.PI) / 180) * 26]
  const place = span(t, STAND, RUB, easeInOut)
  const wiggle = wave(t, 0.56)
  const rubCenter = Math.min(Math.max(boundary, 36), 68)
  const rubNear: Point = [ROCK_FACE_X - ox + 0.5 * wiggle, rubCenter + 4.5 * wiggle - oy]
  const rubFar: Point = [ROCK_FACE_X + 1 - ox, Math.min(rubCenter + 9, 76) + 2 * wave(t, 0.56, 0.2) - oy]
  const mixPoint = (a: Point, b: Point, k: number): Point => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
  const hangNear = hangFor(stride * 25)
  const hangFar = hangFor(-stride * 25)
  const workNear = mixPoint(hangNear, rubNear, place)
  const workFar = mixPoint(hangFar, rubFar, place)
  const cheerNear: Point = [54 + wave(t, 0.5) * 0.8, 42]
  const cheerFar: Point = [68, 41 + wave(t, 0.5, 0.25) * 0.8]
  const nearHand = t >= POLISHED ? mixPoint(workNear, cheerNear, cheer) : workNear
  const farHand = t >= POLISHED ? mixPoint(workFar, cheerFar, cheer) : workFar

  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground />
        <Sun t={t} />
        <Layer opacity={span(t, 0.1, 0.5)}>
          <House />
        </Layer>
        <Layer scaleY={span(t, 0.2, 0.8, backOut)} origin={[26, 92]} opacity={span(t, 0.2, 0.4)}>
          <ellipse cx="26" cy="92.4" rx="22" ry="2.8" fill="#000000" opacity="0.1" />
          <RoughRock />
          <PolishedRock boundary={boundary} />
          <Veins boundary={boundary} />
          <Glints t={t} boundary={boundary} />
        </Layer>
        <Layer opacity={span(t, 0.3, 0.6)}>
          <Stool />
        </Layer>
        <Layer opacity={span(t, WALK, WALK + 0.1)}>
          <ellipse cx={ox + 61} cy="93.6" rx="9" ry="2" fill="#000000" opacity={t >= STAND ? 0 : 0.12} />
          <Layer x={ox} y={oy}>
            <Person step={stride} mood={mood} nearHand={nearHand} farHand={farHand} headTilt={headTilt} rub={t < POLISHED} />
          </Layer>
          <Sweat t={t} ox={ox} oy={oy} />
          <Wonder t={t} ox={ox} oy={oy} />
        </Layer>
        <Bird t={t} />
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
    { at: 0, label: '木の いえと、ざらざらの 石', sound: 'pop' },
    { at: WALK, label: '子どもが あるいてきて、ふみ台に のる' },
    { at: STAND, label: '「なんだろう?」と 石を 見る', sound: 'pop' },
    { at: RUB, label: 'ぬので ごしごし みがく' },
    { at: SURPRISE, label: '下から つやつやの 玉に なり、すじが うかぶ', sound: 'pop' },
    { at: POLISHED, label: 'ぜんぶ みがけて「やったー!」' },
    { at: INK, label: 'すじ(ほね)が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '理 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
