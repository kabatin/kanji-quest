/*
 * 男(おとこ): たんぼで ちからを 出して はたらく人。
 *
 * ほね(画と絵の対応)
 *   1〜5画目(田) … たんぼの あぜ(土を もりあげた ほそい道)。あぜ で 4つに くぎった たんぼ
 *   6画目(力の よこ)  … たがやす 手まえの 土の ひろば の うえの ふち と、右がわの ふち
 *   7画目(力の ノ)   … 人が ふりおろした くわ の え(さいごに、くわが 土に ささった しゅんかん だけ 重なる)
 *
 * ながれ
 *   たんぼの あぜ が のびる(土は からから に かわいている)
 *   → くわを ひきずって、つかれた人が あるいてくる
 *   → 2回 たたくけど、かたくて「こつん」と はね かえされる(こまった顔)
 *   → 大きく いきを すって、ぎゅっと 力を ためて、くわを たかく ふりあげる
 *   → ざくっ! 土が くだけて ほかほかの こい色に なり、たんぼに 水が はいって、なえ が 出る
 *   → 人は にっこり。ほね が ひかって、絵が うすくなり、字「男」が のこる
 *
 * 人と くわ は、ほんものの つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがり、両手で くわの え を にぎる。くび は みじかく、どう の 上。
 *   くわは、え の さきに 平らな はが ついた 道具。ふりあげると はが うしろ(あたまの上)に まわる。
 *   字の形になるのは、くわが 土に ささった さいごの しゅんかん だけ。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '男'

const SKY = '#e6f4fb'
const LAND = '#d6edb6'
const LAND_FAR = '#e2f2d2'
const SUN = '#ffd24a'
const BANK = '#a67c52'
const MUD_CRACK = '#b8935a'
const WATER = '#7cc4f2'
const WATER_LIGHT = '#d8effc'
const SOIL_DRY = '#e2c892'
const SOIL_WET = '#8b5a3c'
const SOIL_WET_DARK = '#6e4228'
const SOIL_WET_LIGHT = '#a87650'
const SPROUT = '#55b86e'
const SPROUT_DARK = '#3f9c59'
const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TOWEL = '#fbfbf5'
const TOWEL_DOT = '#4f9be0'
const SHIRT = '#4f9be0'
const SHIRT_DARK = '#3c82c4'
const SHIRT_FAR = '#33709f'
const PANTS = '#6b5b8c'
const PANTS_DARK = '#594a78'
const SHOE = '#6b4a36'
const WOOD = '#b98852'
const WOOD_DARK = '#8f6538'
const IRON = '#9aa6b2'
const IRON_LIGHT = '#cdd6de'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const WALK = 0.7
const ARRIVE = 2.0
/** 1・2回めの 「こつん」(かたくて はね かえされる) */
const HIT1 = 2.98
const HIT2 = 4.16
/** ためて ふりあげる/ふりおろす */
const GATHER = 4.5
const TOP = 5.3
const SWING = 5.45
/** ざくっ! くわが 土に ささる */
const HIT = 5.7
const INK = 6.7
const DONE = 9.4
const DURATION = 10

/** 人の こし(体が かたむく じく) */
const HIP: readonly [number, number] = [63.5, 75]
/** 人の 体(あし・どう・あたま)を 右へ ずらす 分。手が 顔に かぶらず、うで が まえへ のびる */
const BODY_DX = 5
/** 体が まっすぐ のときの かた */
const SHOULDER: readonly [number, number] = [60, 62]
/** うで の ほね1本の 長さ */
const ARM_PART = 9.6

/** くわ(7画目): え の さき。ふりおろして 土に ささったとき、この線に 重なる */
const HOE_END: readonly [number, number] = [17.1, 92.1]
/** え の 上の はし(手より 上に はみ出す 分は みじかく。ふりまわしても 顔に とどかない) */
const HOE_GRIP_TOP: readonly [number, number] = [49.7, 51.4]
/** くわの え を にぎる 手。上の手(じく)と 下の手 */
const GRIP: readonly [number, number] = [50, 58.5]
const GRIP_LOW_OFFSET: readonly [number, number] = [-3, 5.5]
/** くわの はの さき(土に ささる ところ) */
const BLADE_TIP: readonly [number, number] = [15, 100]
/** ふりあげきった ときの くわの 角度(まえ から うしろ へ ぐるっと まわす) */
const RAISE_DEG = 145

const rad = (deg: number) => (deg * Math.PI) / 180

/** 点 p を、center を じく に deg 度(右まわり)まわした 点 */
function rotateAround(p: readonly [number, number], center: readonly [number, number], deg: number): readonly [number, number] {
  const dx = p[0] - center[0]
  const dy = p[1] - center[1]
  const c = Math.cos(rad(deg))
  const s = Math.sin(rad(deg))
  return [center[0] + dx * c - dy * s, center[1] + dx * s + dy * c]
}

/**
 * くわを どれだけ ふりあげているか(0 = 土に ついている / 1 = うしろへ たかく ふりあげた)。
 * 1・2回めは 小さく あげて ぽこん と おとす。3回めは ためて、大きく ふりおろす。
 */
function raiseAmount(t: number): number {
  const lift1 = span(t, 2.3, 2.8, easeOut) * (1 - span(t, 2.85, HIT1, easeIn)) * 0.13
  const lift2 = span(t, 3.4, 3.95, easeOut) * (1 - span(t, 4.0, HIT2, easeIn)) * 0.2
  const big = span(t, GATHER, TOP, easeInOut) * (1 - span(t, SWING, HIT, easeIn))
  // かたい土に はね かえされて、少しだけ うく
  const bounce = (during(t, HIT1, HIT1 + 0.18, 0.09) + during(t, HIT2, HIT2 + 0.18, 0.09)) * 0.03
  // 力を ためて ぷるぷる
  const tremble = span(t, TOP, TOP + 0.02) * (1 - span(t, SWING - 0.02, SWING)) * wave(t, 0.1) * 0.015
  return lift1 + lift2 + big + bounce + tremble
}

type HoePose = { readonly x: number; readonly y: number; readonly rotate: number }

/** くわの かっこう。ふりあげるほど、手が上がり、はが うしろへ まわる */
function hoePose(raise: number): HoePose {
  const turn = Math.sin(Math.PI * Math.min(raise, 1))
  return { x: 8 * turn - 5 * raise, y: -8 * turn - 3 * raise, rotate: RAISE_DEG * raise }
}

/** くわの え で、にぎっている 2つの手の 場所(くわの かっこう から) */
function hoeHands(pose: HoePose): { readonly upper: readonly [number, number]; readonly lower: readonly [number, number] } {
  const base: readonly [number, number] = [GRIP[0] + pose.x, GRIP[1] + pose.y]
  const low = rotateAround([GRIP[0] + GRIP_LOW_OFFSET[0], GRIP[1] + GRIP_LOW_OFFSET[1]], GRIP, pose.rotate)
  return { upper: base, lower: [low[0] + pose.x, low[1] + pose.y] }
}

/** かた と 手 から、ひじの 場所を 出す(ひじは 下へ まがる) */
function elbowOf(shoulder: readonly [number, number], hand: readonly [number, number]): readonly [number, number] {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const d = Math.hypot(dx, dy) || 1
  const mid: readonly [number, number] = [shoulder[0] + dx / 2, shoulder[1] + dy / 2]
  const h = Math.sqrt(Math.max(0, ARM_PART * ARM_PART - (d / 2) * (d / 2)))
  const nx = -dy / d
  const ny = dx / d
  const sign = ny >= 0 ? 1 : -1
  return [mid[0] + nx * h * sign, mid[1] + ny * h * sign]
}

function Sky({ t }: SceneProps) {
  const flapY = wave(t, 0.34) * 1.4
  return (
    <>
      <rect x="0" y="0" width="109" height="109" fill={SKY} />
      <circle cx="102" cy="3" r="6" fill={SUN} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.2} 0)`}>
        <ellipse cx="6" cy="3.2" rx="7" ry="2.6" />
        <ellipse cx="11" cy="2" rx="4.6" ry="2.6" />
      </g>
      {/* とおくを とんでいく 小鳥 */}
      <path
        d={`M${-3} 0 Q${-1.6} ${-2.6 + flapY} 0 0 Q${1.6} ${-2.6 + flapY} ${3} 0`}
        fill="none"
        stroke="#5a6a7a"
        strokeWidth="0.8"
        strokeLinecap="round"
        transform={`translate(${118 - t * 13} 5.5)`}
      />
      <path d="M0 11 Q28 4 55 8 Q85 4 109 9 V109 H0 Z" fill={LAND_FAR} />
      <path d="M0 46 Q30 40 60 46 Q90 52 109 44 V109 H0 Z" fill={LAND} />
    </>
  )
}

/** たんぼの なえ: 小さな 3本の 葉 */
function Sprout({ x, y, grow }: { readonly x: number; readonly y: number; readonly grow: number }) {
  return (
    <Layer scale={grow} origin={[x, y]}>
      <path d={`M${x} ${y} Q${x - 1} ${y - 3} ${x - 3} ${y - 5} Q${x - 0.6} ${y - 4.2} ${x + 0.4} ${y - 1.4} Z`} fill={SPROUT_DARK} />
      <path d={`M${x} ${y} Q${x} ${y - 4} ${x + 0.2} ${y - 7} Q${x + 1.6} ${y - 4} ${x + 1} ${y - 0.6} Z`} fill={SPROUT} />
      <path d={`M${x} ${y} Q${x + 1.4} ${y - 3} ${x + 3.6} ${y - 4.6} Q${x + 2.2} ${y - 3} ${x + 1.2} ${y - 0.8} Z`} fill={SPROUT_DARK} />
    </Layer>
  )
}

/** なえ を うえる 場所(4つの たんぼの なか。手まえほど 下) */
const SPROUT_SPOTS: readonly (readonly [number, number])[] = [
  [38, 52],
  [47, 56],
  [63, 52],
  [72, 56],
  [24, 78],
  [40, 86],
  [80, 80],
  [92, 92],
]

/** たんぼ ぜんたいの 形(おくは せまく、手まえは ひろい。字の 田 と だいたい 同じ場所) */
const FIELD = 'M30 38 L80 38 L112 104 L-2 104 Z'

/**
 * 1〜5画目の たんぼ。人が たがやす 土の ひろば そのものを、あぜ で 4つに くぎる。
 * はじめは かわいた 土。たがやされると こい色に なり、水が はいって なえが 出る。
 */
function Paddy({ t }: SceneProps) {
  const banks = span(t, 0, 0.7, backOut)
  const mud = span(t, 0, 0.35)
  const till = Math.min(1, 0.1 * span(t, HIT1, HIT1 + 0.2) + 0.12 * span(t, HIT2, HIT2 + 0.2) + 0.8 * span(t, HIT, HIT + 0.5, easeOut))
  const wet = span(t, HIT + 0.2, HIT + 0.8, easeInOut)
  const water = 0.92 * wet
  return (
    <>
      <path d={FIELD} fill={SOIL_DRY} opacity={mud} />
      <g opacity={(1 - till) * mud} fill="none" stroke={MUD_CRACK} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M36 44 l4 3 l-1 4 M60 42 l3 4 l4 1 M70 50 l-3 4 l2 3 M44 56 l4 -2 l1 4 M22 72 l6 4 l-2 6 l7 3 M38 66 l3 6 l-3 5 M74 66 l-4 6 l5 4 M82 84 l-6 3 M26 94 l7 -3 l1 -5 M54 98 l2 -6 l6 -1 M94 98 l-5 -4" />
      </g>
      <path d={FIELD} fill={SOIL_WET} opacity={till} />
      <g opacity={till * (1 - wet)}>
        <path d="M18 76 q6 -2 12 0 M30 88 q8 -2 14 1 M70 72 q7 -2 13 0 M76 94 q-6 3 -12 2 M22 98 q8 -2 14 0 M40 48 q6 -1 10 0 M64 46 q6 -1 10 0" fill="none" stroke={SOIL_WET_DARK} strokeWidth="1.3" strokeLinecap="round" />
        <ellipse cx="42" cy="74" rx="3" ry="1.5" fill={SOIL_WET_LIGHT} />
        <ellipse cx="86" cy="76" rx="2.6" ry="1.4" fill={SOIL_WET_LIGHT} />
        <ellipse cx="26" cy="90" rx="2.6" ry="1.4" fill={SOIL_WET_LIGHT} />
        <ellipse cx="52" cy="100" rx="3" ry="1.4" fill={SOIL_WET_LIGHT} />
      </g>
      <path d={FIELD} fill={WATER} opacity={water} />
      <g opacity={water} stroke={WATER_LIGHT} strokeWidth="0.9" strokeLinecap="round" fill="none">
        <path d="M36 46 h5 M62 44 h6 M28 74 h6 M70 76 h7 M84 94 h6 M44 94 h7" />
      </g>
      {SPROUT_SPOTS.map(([x, y], i) => (
        <Sprout key={i} x={x} y={y} grow={span(t, HIT + 0.55 + i * 0.06, HIT + 1.0 + i * 0.06, backOut)} />
      ))}
      {/* あぜ(1〜5画目): 土を もりあげた ほそい道。ふちと、まんなかの たて・よこ。手まえほど 太く見える */}
      <Layer scale={banks} origin={[55, 70]}>
        <g fill={BANK} stroke={BANK} strokeWidth="0.8" strokeLinejoin="round">
          <path d="M29 36.6 L81 36.6 L81 39.8 L29 39.8 Z" />
          <path d="M28.6 37 L31.6 37 L1 104 L-6 104 Z" />
          <path d="M78.4 37 L81.4 37 L115 104 L108 104 Z" />
          <path d="M53.6 38 L56.4 38 L59 104 L51 104 Z" />
          <path d="M23 58.4 L87 58.4 L88.4 62.6 L21.6 62.6 Z" />
        </g>
      </Layer>
    </>
  )
}

type Mood = 'tired' | 'set' | 'happy'

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="58.6" cy="55.4" r="2" fill={CHEEK} opacity="0.55" />
      {mood === 'tired' ? (
        <>
          <path d="M56.6 50.6 l3.4 1.4" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="58.8" cy="53.4" r="1.15" fill={EYE} />
          <path d="M57 57.8 Q58.6 56.6 60.2 57.8" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      ) : mood === 'set' ? (
        <>
          <path d="M56.4 51.6 l3.8 -1.4" stroke={HAIR} strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="58.8" cy="53.6" r="1.2" fill={EYE} />
          <path d="M57.2 57.4 h3" stroke={MOUTH} strokeWidth="1.3" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M57.4 53.8 Q58.9 52 60.4 53.8" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M56.8 56.4 Q58.8 59.6 61.2 56.6 Z" fill={MOUTH} />
        </>
      )}
    </>
  )
}

type BodyProps = {
  readonly mood: Mood
  /** 体の かたむき(右まわり が うしろ。ひくい 数は まえ) */
  readonly lean: number
  readonly tail: number
}

/** どう と あたま。こし を じく に かたむく。 */
function Torso({ mood, lean, tail }: BodyProps) {
  return (
    <Layer rotate={lean} origin={HIP}>
      {/* くび: みじかく、どう と あたま に ほとんど かくれる */}
      <rect x="60.6" y="56" width="5.4" height="7" rx="2.4" fill={SKIN_SHADE} />
      <rect x="56" y="58.5" width="15" height="18" rx="6.5" fill={SHIRT} />
      <path d="M57.6 71.6 h12" stroke={SHIRT_DARK} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="63" cy="50.4" r="8.2" fill={SKIN} />
      {/* かみ と、はちまき(てぬぐい) */}
      <path d="M54.8 48.4 C54.4 40.8 66.4 38.6 71 45 C72.4 47 72 49.4 71.4 50.6 C70 46.6 66 44 60.4 44.4 C57.6 44.6 55.8 46.4 54.8 48.4 Z" fill={HAIR} />
      <path d="M55 48 Q63 43.6 71.2 47.4 L71 50.6 Q63 47 55.2 51 Z" fill={TOWEL} />
      <circle cx="60" cy="47.6" r="0.8" fill={TOWEL_DOT} />
      <circle cx="64" cy="46.8" r="0.8" fill={TOWEL_DOT} />
      <circle cx="68" cy="47.6" r="0.8" fill={TOWEL_DOT} />
      {/* むすびめ から ひらひら する てぬぐいの はし */}
      <Layer rotate={tail} origin={[71, 48.6]}>
        <path d="M71 48.6 Q75.4 49 78 53.4 Q75 52.6 71.6 51 Z" fill={TOWEL} />
        <path d="M71 48.8 Q74 46.4 76.2 47.4 Q74 49.6 71.6 50.6 Z" fill={TOWEL} />
      </Layer>
      <Face mood={mood} />
    </Layer>
  )
}

function Legs({ step }: { readonly step: number }) {
  return (
    <>
      <Layer rotate={-step * 14} origin={[66.6, 74]}>
        <rect x="64" y="73" width="5.2" height="16.4" rx="2.6" fill={PANTS_DARK} />
        <ellipse cx="65.4" cy="90.2" rx="4.8" ry="2.4" fill={SHOE} />
      </Layer>
      <Layer rotate={step * 14} origin={[60, 74]}>
        <rect x="57.4" y="73" width="5.2" height="16.4" rx="2.6" fill={PANTS} />
        <ellipse cx="58.8" cy="90.2" rx="4.8" ry="2.4" fill={SHOE} />
      </Layer>
    </>
  )
}

/** かた から出て ひじ で まがり、手で くわを にぎる うで。 */
function Arm({ shoulder, hand, color }: { readonly shoulder: readonly [number, number]; readonly hand: readonly [number, number]; readonly color: string }) {
  const elbow = elbowOf(shoulder, hand)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3" fill={SKIN} />
    </>
  )
}

/** くわ(7画目): まっすぐな え と、さきに ついた 平らな はの 鉄 */
function Hoe({ pose }: { readonly pose: HoePose }) {
  return (
    <Layer x={pose.x} y={pose.y} rotate={pose.rotate} origin={GRIP}>
      <path d={`M${HOE_GRIP_TOP[0]} ${HOE_GRIP_TOP[1]} L${HOE_END[0]} ${HOE_END[1]}`} stroke={WOOD} strokeWidth="2.8" strokeLinecap="round" />
      <path d={`M${HOE_GRIP_TOP[0] + 0.8} ${HOE_GRIP_TOP[1] + 0.6} L${HOE_END[0] + 0.8} ${HOE_END[1] + 0.6}`} stroke={WOOD_DARK} strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
      <path d={`M${HOE_END[0]} ${HOE_END[1]} L16 95`} stroke={IRON} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M13.4 94 L19.8 95.4 L18.2 100.2 L12.4 99 Z" fill={IRON} />
      <path d="M12.4 99 L18.2 100.2" stroke={IRON_LIGHT} strokeWidth="1" strokeLinecap="round" />
    </Layer>
  )
}

type FarmerProps = {
  readonly step: number
  readonly mood: Mood
  readonly lean: number
  readonly tail: number
  readonly pose: HoePose
}

function Farmer({ step, mood, lean, tail, pose }: FarmerProps) {
  const hands = hoeHands(pose)
  const rotated = rotateAround(SHOULDER, HIP, lean)
  const shoulder: readonly [number, number] = [rotated[0] + BODY_DX, rotated[1]]
  return (
    <>
      <Layer x={BODY_DX}>
        <Legs step={step} />
      </Layer>
      {/* くわ は 体の うしろ がわ を とおる(ふりあげ・ふりおろしで 顔の まえを よこぎらない) */}
      <Hoe pose={pose} />
      <Arm shoulder={[shoulder[0] + 2.4, shoulder[1]]} hand={hands.lower} color={SHIRT_FAR} />
      <Layer x={BODY_DX}>
        <Torso mood={mood} lean={lean} tail={tail} />
      </Layer>
      <Arm shoulder={shoulder} hand={hands.upper} color={SHIRT_DARK} />
    </>
  )
}

/** つかれて 出る あせ。おでこ の よこから 下へ。 */
function Sweat({ t }: SceneProps) {
  const show = during(t, 1.0, GATHER, 0.25)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.45].map((offset) => {
        const p = ((t + offset) % 0.9) / 0.9
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill={WATER} transform={`translate(${54.4 - p * 2} ${46 + p * 9}) rotate(20)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** 力を ためる とき の「ふー」と、ぎゅっ の しるし */
function Effort({ t }: SceneProps) {
  const puff = during(t, GATHER + 0.1, GATHER + 0.9, 0.2)
  const strain = during(t, TOP - 0.1, SWING + 0.05, 0.05)
  return (
    <>
      {puff > 0 && (
        <g opacity={puff}>
          <ellipse cx={54 - span(t, GATHER + 0.1, GATHER + 0.9) * 4} cy={52 - span(t, GATHER + 0.1, GATHER + 0.9) * 6} rx="2" ry="1.4" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
          <ellipse cx={51 - span(t, GATHER + 0.1, GATHER + 0.9) * 5} cy={50 - span(t, GATHER + 0.1, GATHER + 0.9) * 7} rx="1.1" ry="0.8" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
        </g>
      )}
      {strain > 0 && (
        <g opacity={strain} stroke="#e8534a" strokeWidth="1.1" strokeLinecap="round">
          <path d="M53.6 41.6 l-2.4 -2.4 M57.6 38.6 l-0.6 -3.2 M62 37.6 l0.8 -3.2" />
        </g>
      )}
    </>
  )
}

/** 「こつん」: かたい 土に はね かえされて、小さな ほこり が ぽっ と出る */
function WeakPuff({ t, at }: SceneProps & { readonly at: number }) {
  const p = span(t, at, at + 0.4, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p} fill="#f2e3c4">
      <circle cx={BLADE_TIP[0] + 7 + p * 3} cy={BLADE_TIP[1] - 2 - p * 4} r={1.2 + p * 1.6} />
      <circle cx={BLADE_TIP[0] + 3 + p} cy={BLADE_TIP[1] - 3 - p * 6} r={0.9 + p * 1.2} />
    </g>
  )
}

/** ざくっ!: 土が くだけて とびちり、しょうげきの せん が ひろがる */
function Crash({ t }: SceneProps) {
  const p = span(t, HIT, HIT + 0.75)
  if (p <= 0 || p >= 1) return null
  const chunks: readonly (readonly [number, number, number])[] = [
    [-9, -26, 2.2],
    [12, -30, 1.8],
    [24, -20, 2.4],
    [6, -34, 1.4],
    [32, -14, 1.6],
    [-3, -18, 1.6],
    [18, -24, 1.2],
  ]
  const burst = span(t, HIT, HIT + 0.25, easeOut)
  return (
    <>
      <g opacity={1 - burst} stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" transform={`translate(${BLADE_TIP[0] + 4} ${BLADE_TIP[1] - 4})`}>
        {[-70, -35, 0, 35, 70].map((angle) => (
          <path key={angle} d={`M0 ${-5 - burst * 3} L0 ${-9 - burst * 8}`} transform={`rotate(${angle + 45})`} />
        ))}
      </g>
      {chunks.map(([vx, vy, size], i) => (
        <circle key={i} cx={BLADE_TIP[0] + 3 + vx * p} cy={BLADE_TIP[1] - 3 + vy * p + 55 * p * p} r={size} fill={i % 2 === 0 ? SOIL_WET : SOIL_WET_LIGHT} opacity={1 - p * 0.7} />
      ))}
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)
  const raise = raiseAmount(t)
  const pose = hoePose(raise)

  // あるく: 右から くわを ひきずって。つかれた あしどり
  const walking = span(t, WALK, WALK + 0.1) * (1 - span(t, ARRIVE - 0.1, ARRIVE))
  const stride = Math.sin((t - WALK) * Math.PI * 2 * 1.6) * walking
  const walkX = mix(t, WALK, ARRIVE, 48, 0, easeOut)
  const bob = -Math.abs(stride) * 0.9
  // 体: ふりあげで うしろへ そり、ふりおろしで まえへ のめり、もとにもどる
  const kick = span(t, SWING, HIT, easeIn) * (1 - span(t, HIT + 0.05, HIT + 0.8, easeInOut))
  const lean = 6 * raise - 5 * kick
  const mood: Mood = t < GATHER ? 'tired' : t < HIT + 0.1 ? 'set' : 'happy'
  const tail = wave(t, 0.8) * 8 + (t >= HIT ? 6 : 0)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const cheer = during(t, HIT + 0.4, INK + 0.3, 0.2)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Paddy t={t} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <ellipse cx={69 + walkX} cy="91" rx="12" ry="2.6" fill="#000000" opacity="0.12" />
          <Layer x={walkX} y={bob}>
            <Farmer step={stride} mood={mood} lean={lean} tail={tail} pose={pose} />
            <Layer x={BODY_DX}>
              <Sweat t={t} />
              <Effort t={t} />
            </Layer>
          </Layer>
        </Layer>
        <WeakPuff t={t} at={HIT1} />
        <WeakPuff t={t} at={HIT2} />
        <Crash t={t} />
        {cheer > 0 && (
          <g opacity={cheer}>
            <Star cx={74} cy={44 - wave(t, 0.9) * 0.8} r={2.8} color={SUN} spin={t * 40} />
            <Star cx={52} cy={39} r={2} color={SUN} spin={-t * 40} />
          </g>
        )}
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
    { at: 0, label: 'たんぼの あぜ が のびる。土は からから', sound: 'pop' },
    { at: WALK, label: 'つかれた人が くわを ひきずって あるいてくる' },
    { at: HIT1 - 0.5, label: 'こつん。かたくて はね かえされる', sound: 'tap' },
    { at: GATHER, label: 'いきを すって、ぎゅっと 力を ためる' },
    { at: SWING, label: 'ふりおろす' },
    { at: HIT, label: 'ざくっ! 土が ほぐれて、たんぼに 水と なえ', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '男 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
