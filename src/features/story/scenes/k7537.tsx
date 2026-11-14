/*
 * 男(おとこ): たんぼで ちからを 出して はたらく人。(共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)
 *   1〜5画目(田) … たんぼの あぜ(土を もりあげた ほそい道)。あぜ で 4つに くぎった たんぼ
 *   6画目(力の よこ)  … たがやす 手まえの 土の ひろば の うえの ふち と、右がわの ふち
 *   7画目(力の ノ)   … 人が ふりおろした くわ の え(さいごに、くわが 土に ささった しゅんかん だけ 重なる)
 *
 * ながれ
 *   たんぼの あぜ が のびる(土は からから に かわいている)
 *   → くわを ひきずって、つかれた人が あるいてくる(はちまきの てぬぐい)
 *   → 2回 たたくけど、かたくて「こつん」と はね かえされる(こまった顔)
 *   → 大きく いきを すって、ぎゅっと 力を ためて、くわを たかく ふりあげる
 *   → ざくっ! 土が くだけて ほかほかの こい色に なり、たんぼに 水が はいって、なえ が 出る
 *   → 人は にっこり。ほね が ひかって、絵が うすくなり、字「男」が のこる
 *
 * 人は Person(左むき)。あるきは walk()。くわは held で 描き、りょうてを { to } で えの 2か所に のせる。
 * くわの えの 位置は、人の かたから 出す(体が かたむいても 手と くわが ずれない)。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, Bird, LOOKS, Person, personRig, Sweat, walk, type Expression } from '../sceneFigures'

const CHAR = '男'

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
const TOWEL = '#fbfbf5'
const TOWEL_DOT = '#4f9be0'
const WOOD = '#b98852'
const WOOD_DARK = '#8f6538'
const IRON = '#9aa6b2'
const IRON_LIGHT = '#cdd6de'

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

/** 農家の人: おとな(左むき)。立つ 場所(こし の x)と 地面、背の高さ、服 */
const FARMER_X = 67
const GROUND = 91
const FARMER_HEIGHT = 52
const FARMER_LOOK = { ...LOOKS.man, top: '#4f9be0', bottom: '#6b5b8c', sleeves: 'long' } as const

/** くわ(7画目): え の さき。ふりおろして 土に ささったとき、この線に 重なる */
const HOE_END: readonly [number, number] = [17.1, 92.1]
/** え の 上の はし(手より 上に はみ出す 分は みじかい) */
const HOE_GRIP_TOP: readonly [number, number] = [49.7, 51.4]
/** くわの え を にぎる 手(くわの 元の 形での 場所)。上の手(じく)と 下の手 */
const GRIP: readonly [number, number] = [50, 58.5]
const GRIP_LOW_OFFSET: readonly [number, number] = [-3, 5.5]
/** 体が まっすぐ のとき、かた から 上の手 まで(左むき。まえへ のばす) */
const GRIP_FROM_SHOULDER: readonly [number, number] = [-15, -3.5]
/** くわの はの さき(土に ささる ところ) */
const BLADE_TIP: readonly [number, number] = [15, 100]
/** ふりあげきった ときの くわの 角度 */
const RAISE_DEG = 145

type Pt = readonly [number, number]

const rad = (deg: number) => (deg * Math.PI) / 180

/** 点 p を、center を じく に deg 度(右まわり)まわした 点 */
function rotateAround(p: Pt, center: Pt, deg: number): Pt {
  const dx = p[0] - center[0]
  const dy = p[1] - center[1]
  const c = Math.cos(rad(deg))
  const s = Math.sin(rad(deg))
  return [center[0] + dx * c - dy * s, center[1] + dx * s + dy * c]
}

/**
 * くわを どれだけ ふりあげているか(0 = 土に ついている / 1 = たかく ふりあげた)。
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

/** くわの 手の 動き(ふりあげるほど 手が 上がる)。まっすぐ のときの 手 からの ずれ */
function gripShift(raise: number): Pt {
  const turn = Math.sin(Math.PI * Math.min(raise, 1))
  return [8 * turn - 5 * raise, -8 * turn - 3 * raise]
}

/** 体の かたむき(左むき の人は、ふりあげで うしろ(右)へ そり、ふりおろしで まえへ のめる) */
function leanOf(t: number, raise: number): number {
  const kick = span(t, SWING, HIT, easeIn) * (1 - span(t, HIT + 0.05, HIT + 0.8, easeInOut))
  return LEAN_SIGN * (6 * raise - 5 * kick)
}
const LEAN_SIGN = -1

type Hoe = { readonly grip: Pt; readonly lower: Pt; readonly rotate: number }

/** かた の 場所と ふりあげ から、くわ と 2つの手 の 場所を きめる */
function hoeOf(shoulder: Pt, raise: number): Hoe {
  const shift = gripShift(raise)
  const grip: Pt = [shoulder[0] + GRIP_FROM_SHOULDER[0] + shift[0], shoulder[1] + GRIP_FROM_SHOULDER[1] + shift[1]]
  const rotate = RAISE_DEG * raise
  const off = rotateAround([GRIP[0] + GRIP_LOW_OFFSET[0], GRIP[1] + GRIP_LOW_OFFSET[1]], GRIP, rotate)
  return { grip, rotate, lower: [grip[0] + off[0] - GRIP[0], grip[1] + off[1] - GRIP[1]] }
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

/** くわ(7画目): まっすぐな え と、さきに ついた 平らな はの 鉄 */
function HoeShape({ hoe }: { readonly hoe: Hoe }) {
  return (
    <g transform={`translate(${hoe.grip[0]} ${hoe.grip[1]}) rotate(${hoe.rotate}) translate(${-GRIP[0]} ${-GRIP[1]})`}>
      <path d={`M${HOE_GRIP_TOP[0]} ${HOE_GRIP_TOP[1]} L${HOE_END[0]} ${HOE_END[1]}`} stroke={WOOD} strokeWidth="2.8" strokeLinecap="round" />
      <path d={`M${HOE_GRIP_TOP[0] + 0.8} ${HOE_GRIP_TOP[1] + 0.6} L${HOE_END[0] + 0.8} ${HOE_END[1] + 0.6}`} stroke={WOOD_DARK} strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
      <path d={`M${HOE_END[0]} ${HOE_END[1]} L16 95`} stroke={IRON} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M13.4 94 L19.8 95.4 L18.2 100.2 L12.4 99 Z" fill={IRON} />
      <path d="M12.4 99 L18.2 100.2" stroke={IRON_LIGHT} strokeWidth="1" strokeLinecap="round" />
    </g>
  )
}

/** はちまき(てぬぐい)。あたまの まんなか が 0,0、半径 1。右むき の形(左むき は 部品が 反転)。しっぽ は うしろへ ひらひら */
function Towel({ tail }: { readonly tail: number }) {
  return (
    <g strokeLinecap="round" fill="none">
      <path d="M-0.95 -0.28 Q0 -0.78 0.97 -0.26" stroke={TOWEL} strokeWidth="0.34" />
      {[-0.55, -0.05, 0.45].map((x) => (
        <circle key={x} cx={x} cy={-0.55 + Math.abs(x) * 0.16} r="0.06" fill={TOWEL_DOT} stroke="none" />
      ))}
      <g transform={`rotate(${tail} -0.95 -0.28)`}>
        <path d="M-0.95 -0.28 Q-1.4 -0.1 -1.75 0.3" stroke={TOWEL} strokeWidth="0.28" />
        <path d="M-0.95 -0.3 Q-1.35 -0.55 -1.65 -0.5" stroke={TOWEL} strokeWidth="0.26" />
      </g>
    </g>
  )
}

/** 力を ためる とき の「ふー」と、ぎゅっ の しるし(あたま の まわり) */
function Effort({ t, head }: SceneProps & { readonly head: Pt }) {
  const puff = during(t, GATHER + 0.1, GATHER + 0.9, 0.2)
  const strain = during(t, TOP - 0.1, SWING + 0.05, 0.05)
  const p = span(t, GATHER + 0.1, GATHER + 0.9)
  return (
    <>
      {puff > 0 && (
        <g opacity={puff}>
          <ellipse cx={head[0] - 9 - p * 4} cy={head[1] + 3 - p * 6} rx="2" ry="1.4" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
          <ellipse cx={head[0] - 12 - p * 5} cy={head[1] + 1 - p * 7} rx="1.1" ry="0.8" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
        </g>
      )}
      {strain > 0 && (
        <g opacity={strain} stroke="#e8534a" strokeWidth="1.1" strokeLinecap="round" transform={`translate(${head[0]} ${head[1]})`}>
          <path d="M-8.4 -8.4 l-2.4 -2.4 M-4.4 -11.4 l-0.6 -3.2 M0 -12.4 l0.8 -3.2" />
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

function faceOf(t: number): Expression {
  if (t < HIT1 - 0.1) return 'sad'
  if (t < GATHER) return 'worried'
  return t < HIT + 0.1 ? 'strain' : 'joy'
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)
  const raise = raiseAmount(t)

  // あるく: 右から くわを ひきずって。つかれた あしどり(うで は くわを にぎる)
  const w = walk(t, { from: 112, to: FARMER_X, start: WALK, end: ARRIVE, build: 'adult', height: FARMER_HEIGHT, armSwing: 8 })
  const lean = leanOf(t, raise)
  const base = { ...w, y: GROUND, lean }
  const shoulder = personRig({ ...base, pose: {} }).world.arms.right.root
  const hoe = hoeOf(shoulder, raise)
  const pose = { ...w.pose, rightArm: { to: hoe.grip }, leftArm: { to: hoe.lower } }
  const head = personRig({ ...base, pose }).world.head
  const tail = wave(t, 0.8) * 8 + (t >= HIT ? 6 : 0)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const cheer = during(t, HIT + 0.4, INK + 0.3, 0.2)
  const sweat = during(t, 1.0, GATHER, 0.25)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[102, 5]} ground={103} tufts={[]} clouds={[[6, 6, 0.6]]} />
        <Bird x={118 - t * 13} y={8 + wave(t, 1.7) * 1.2} t={t} flying size={0.55} />
        <Paddy t={t} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <Person {...base} pose={pose} look={FARMER_LOOK} face={faceOf(t)} headwear={<Towel tail={tail} />} held={<HoeShape hoe={hoe} />} />
          <Sweat t={t} x={head[0] - 4} y={head[1] - 3} show={sweat} />
          <Effort t={t} head={head} />
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
