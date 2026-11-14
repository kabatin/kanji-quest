/*
 * 六(ろく): やねの ある 家の 形。(共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)
 *   1画目(丶)  … やねの 上に たつ えんとつ(火の けむり が 出る)
 *   2画目(一)  … 大きな ひろい やね(わらの いた)
 *   3・4画目   … やねを ささえる 左右の はしら(「八」の かたち。上で よせあって 家の 骨になる)
 *
 * ながれ
 *   はしら が 立っている ところへ、雨の中を 子どもが あるいてくる → さむくて ぶるぶる(かなしい顔)
 *   → 切り株の上の 大きな いた を、よいしょ と もちあげる(がんばる顔)
 *   → はしら の 上に のせると 雨が はじかれて、中は ぬくぬく。えんとつが 立ち、たき火に あたって にっこり
 *   → 雨が やんで お日さまが 出る → ほね が ひかって、絵が うすくなり、字「六」が のこる
 *
 * 人は Person。あるきは walk(横)→ turnAround で 正面。うで は { to } で いた・むね・火 に とどかせる。
 * 雨は Rain(やね が のると、はしらの 間は やね で とまる)、たき火は Campfire、空は Backdrop(くもり → 晴れ)。
 * 家の 骨・いた・えんとつ・切り株 は ここで 描く。
 */
import { backOut, during, easeInOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Campfire, HANG_ARM, LOOKS, mixLimb, PALETTE, Person, personRig, Rain, Sweat, turnAround, walk, type Limb, type Look, type PersonProps } from '../sceneFigures'

const CHAR = '六'

const WOOD = PALETTE.bark
const WOOD_DARK = PALETTE.barkDark
const WOOD_LIGHT = '#b07a52'
const THATCH = '#c9a05a'
const THATCH_DARK = '#a8783d'
const THATCH_LIGHT = '#e6c47c'
const BRICK = '#c4574a'
const BRICK_DARK = '#9c3f35'

/** 子どもの 見た目(あかい シャツ・あおい ズボン) */
const KID_LOOK: Look = { ...LOOKS.boy, top: '#e8645a', bottom: '#3e5c86' }

/** くぎり の時間(秒) */
const WALK = 0.8
const ARRIVE = 2.4
const HUG = 2.6
const GRAB = 3.4
const LIFT = 3.9
/** いた が やね の場所に とどく */
const SET = 5.0
const WARM = 5.8
const INK = 6.6
const DONE = 9.3
const DURATION = 10

/** 子どもは 家の中(はしら の間)に 立つ。足もとが 地面の y=88 */
const CX = 47
const FEET_Y = 88
const KID_HEIGHT = 44
/** むね・うで を のばす はば(いたを もつ ところ は あたまの よこ) */
const CHEST_Y = FEET_Y - KID_HEIGHT * 0.62
const HOLD_DX = 9

/** いた が 切り株に のっている とき、やね の場所より どれだけ 下か */
const BOARD_REST = 31.5
/** 切り株の 上の たかさ */
const STUMP_TOP = 75
/** いた の したの ふち(やね の 場所で)。手 は ここ から 少し 下 を もつ */
const BOARD_EDGE_Y = 44
/** たき火の 場所 */
const FIRE_X = 66
const FIRE_Y = 87

/** 雨が やねの 上で とまる はば(はしら の 外 から 外)と、やね の たかさ */
const ROOF_LEFT = 13
const ROOF_RIGHT = 96
const ROOF_Y = 36
const GROUND_Y = 92

/** 家の骨。はしら(3・4画目)は 上で よせあって、やね を ささえる */
function Frame({ t }: SceneProps) {
  const rise = span(t, 0, 0.7, backOut)
  const warm = span(t, SET + 0.2, WARM)
  return (
    <Layer scaleY={rise} origin={[54, 89]} opacity={Math.min(1, rise * 3)}>
      {/* 中の ぬくもり(やね が のったあと ほんのり あかるくなる) */}
      <path d="M53 44 L15.4 89 L93.3 89 Z" fill="#fff0c6" opacity={warm * 0.9} />
      {/* 左の はしら(3画目): やね の下まで のびている */}
      <path d="M49.5 43.5 L38.11 58.6 c0.51,1.37,0.42,3.67,-0.49,5.29 C33.38,71.38,24,82.38,15.41,88.75" fill="none" stroke={WOOD} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
      {/* 右の はしら(4画目) */}
      <path d="M57.5 43.5 L70.16 59.92 c9.96,8.61,18.18,18.54,23.16,28.99" fill="none" stroke={WOOD_DARK} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
    </Layer>
  )
}

/** 切り株。いた を のせておく ところ */
function Stump({ x }: { readonly x: number }) {
  const h = 89 - STUMP_TOP
  return (
    <>
      <rect x={x - 5.4} y={STUMP_TOP + 1.4} width="10.8" height={h - 1.4} rx="1.4" fill={WOOD} />
      <ellipse cx={x} cy={STUMP_TOP + 1.4} rx="5.4" ry="2" fill={WOOD_LIGHT} />
      <ellipse cx={x} cy={STUMP_TOP + 1.4} rx="2.6" ry="0.9" fill="none" stroke={WOOD_DARK} strokeWidth="0.5" />
    </>
  )
}

/** やね に する 大きな いた(2画目)。わら をかさねた ひろい いた */
function Board({ dy }: { readonly dy: number }) {
  return (
    <Layer y={dy}>
      <Bone char={CHAR} n={2} color={THATCH_DARK} width={7.6} />
      <Layer y={-0.9}>
        <Bone char={CHAR} n={2} color={THATCH} width={5.8} />
      </Layer>
      <Layer y={-2}>
        <Bone char={CHAR} n={2} color={THATCH_LIGHT} width={1.6} />
      </Layer>
    </Layer>
  )
}

/** えんとつ(1画目): やね の上に ぽん と 立つ */
function Chimney({ t }: SceneProps) {
  const pop = span(t, SET + 0.1, SET + 0.55, backOut)
  if (pop <= 0) return null
  return (
    <Layer scaleY={pop} origin={[54.5, 40]}>
      <Bone char={CHAR} n={1} color={BRICK} width={6.6} />
      <path d="M52.2 21.5 h5.6 M52.6 27 h5.4 M53 32.5 h5.4" stroke={BRICK_DARK} strokeWidth="0.8" strokeLinecap="round" />
      <rect x="48.8" y="14.4" width="11.2" height="3.6" rx="1.4" fill={BRICK_DARK} />
    </Layer>
  )
}

/** えんとつの けむり。火が もえはじめてから ふわふわ のぼる */
function Smoke({ t }: SceneProps) {
  const show = span(t, SET + 0.9, SET + 1.3) * (1 - span(t, INK - 0.3, INK + 0.4))
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.34, 0.67].map((offset) => {
        const p = ((((t - SET) * 0.55 + offset) % 1) + 1) % 1
        return <circle key={offset} cx={54.5 + p * 10 + Math.sin(p * 6) * 1.6} cy={13 - p * 11} r={1.8 + p * 3} fill="#f2f2f2" stroke="#d3d8e0" strokeWidth="0.5" opacity={Math.sin(p * Math.PI) * 0.95} />
      })}
    </g>
  )
}

/** 子どもの うで。ふだんは たらす → さむくて だきしめる → いた を もつ → たらす → 火に あたる */
function armsAt(t: number, dy: number): { readonly leftArm: Limb; readonly rightArm: Limb } {
  // 右手 = 画面の 左(正面)。だきしめる ときは 手を むねの はんたいがわ へ
  const hug = (side: -1 | 1): Limb => ({ to: [CX - side * 4, CHEST_Y + (side === 1 ? 0 : 3)], depth: 7 })
  const hold = (side: -1 | 1): Limb => ({ to: [CX + side * HOLD_DX, BOARD_EDGE_Y + dy + 4] })
  const warm: Limb = { to: [CX + 17, 76] }
  const arm = (side: -1 | 1): Limb => {
    if (t < HUG) return HANG_ARM
    if (t < GRAB) return mixLimb(HANG_ARM, hug(side), span(t, HUG, HUG + 0.4))
    if (t < SET) return mixLimb(hug(side), hold(side), span(t, GRAB, GRAB + 0.5))
    const down = mixLimb(hold(side), HANG_ARM, span(t, SET, SET + 0.6))
    return side === 1 ? mixLimb(down, warm, span(t, WARM, WARM + 0.5)) : down
  }
  return { rightArm: arm(-1), leftArm: arm(1) }
}

/** 子どもの 場所・向き・かっこう: 左から あるいてきて、はしらの 間で 正面を むく */
function kidAt(t: number, dy: number): PersonProps {
  const w = walk(t, { from: CX - 62, to: CX, start: WALK, end: ARRIVE, build: 'child', height: KID_HEIGHT })
  const face = t < GRAB ? 'worried' : t < SET ? 'strain' : t < WARM + 0.3 ? 'smile' : 'joy'
  const shiver = t > HUG + 0.3 && t < GRAB ? wave(t, 0.12) * 0.5 : 0
  const bounce = span(t, SET, SET + 0.25) * (1 - span(t, SET + 0.25, SET + 0.5)) * 0.8
  const common = { y: FEET_Y, build: 'child', height: KID_HEIGHT, look: KID_LOOK, face, lift: bounce } as const
  if (t < ARRIVE) return { ...common, x: w.x, facing: w.facing, pose: w.pose }
  const turn = turnAround(t, ARRIVE, 'right', 'front', 0.2)
  return { ...common, x: CX + shiver, ...turn, gazeY: t < GRAB ? 0.5 : 0, pose: { ...armsAt(t, dy), head: t < GRAB ? 6 : 0 } }
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)
  // いた: 切り株 → あたまの上 → やね の場所
  const lift = span(t, LIFT, SET, easeInOut)
  const dy = BOARD_REST * (1 - lift)
  // いた が あたま の上で ふるえる(がんばっている)
  const strain = t > LIFT + 0.2 && t < SET ? wave(t, 0.16) * 0.35 : 0
  const kid = kidAt(t, dy)
  const head = personRig(kid).world.head
  // 雨雲 は 雨が やむ ころ きえて、お日さまが 出る
  const rain = span(t, 0.4, 0.9) * (1 - span(t, 5.7, 6.2))
  const cloudy = span(t, 0, 0.6) * (1 - span(t, 5.6, 6.4))
  const roofed = t >= SET
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[97, 12]} overcast={cloudy} ground={90} clouds={[[14, 6, 1.1], [72, 6, 1.1]]} tufts={[6, 40, 98]} />
        <Frame t={t} />
        <Layer opacity={span(t, 0.2, 0.7)}>
          <Stump x={18} />
          <Stump x={92} />
        </Layer>
        <Campfire t={t} x={FIRE_X} y={FIRE_Y} size={0.9} lit={span(t, SET + 0.4, SET + 0.9, backOut)} />
        <Layer opacity={span(t, 0.1, 0.6)}>
          <Board dy={dy + strain} />
        </Layer>
        <Chimney t={t} />
        <Smoke t={t} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.1)}>
          <Person {...kid} />
        </Layer>
        <Sweat t={t} x={head[0] + 8} y={head[1] - 2} show={during(t, LIFT + 0.2, SET + 0.1, 0.2)} dir={1} />
        {/* 雨: やね が のった あとは、はしらの 間は やね の上で はじかれる */}
        <Rain t={t} amount={rain} ground={GROUND_Y} top={0} left={-2} right={ROOF_LEFT} />
        <Rain t={t} amount={rain} ground={roofed ? ROOF_Y : GROUND_Y} top={0} left={ROOF_LEFT} right={ROOF_RIGHT} />
        <Rain t={t} amount={rain} ground={GROUND_Y} top={0} left={ROOF_RIGHT} right={111} />
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
    { at: 0, label: '雨が ふりだす。はしら が 立つ', sound: 'pop' },
    { at: WALK, label: '子どもが 雨の中を あるいてくる' },
    { at: HUG, label: 'さむくて ぶるぶる' },
    { at: LIFT, label: '大きな いた を よいしょ と もちあげる', sound: 'pop' },
    { at: SET, label: 'やね に なる。えんとつ と たき火。雨が はじかれる', sound: 'pop' },
    { at: WARM, label: 'にっこり あたたまる。雨が やむ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '六 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
