/*
 * 青(あお): 草の めと、いどの みず。どちらも あおい。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 草の いちばん上の 葉(左右に ひらく 1まい ずつ)
 *   2画目(丨)  … 草の くき
 *   3画目(一)  … 草の 2だんめの 葉
 *   4画目(一)  … 草の いちばん下の 大きな 葉(左右に ながく のびる)
 *   5画目(丨)  … いど の 左がわ
 *   6画目(𠃍)  … いど の ふち(上)と 右がわ
 *   7・8画目   … いど の いし の つぎめ(よこ線)
 *
 * ながれ
 *   あつい日。いどの ふちに はえた 草の めが、みずが なくて しおれている
 *   → 子どもが いどの みずを じょうろに くんで、あるいてくる(しんぱいな 顔)
 *   → じょうろで 草の ねもとに みずを かける
 *   → 草が げんきに 立ちあがり、ぐんぐん のびて 葉が ひろがる(子どもは おどろいて、うれしそうに)
 *   → 子どもが じょうろを おいて、バンザイ! ちょうちょも きた
 *   → ほね が ひかって、絵が うすくなり、字「青」が のこる
 *
 * 人は Person(あるきは walk、うでは 角度で じょうろを もちあげる)。ちょうちょ・あせ は 部品。
 *   草の 葉は くき から 左右に のび、みずが ないと しおれて 下を むく。
 *   いど は 石を つんだ はこ で、ふち に 土が たまって 草が はえる。じょうろ・おけ は ここで 描く。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Butterfly, HANG_ARM, mixColor, mixLimb, Person, personRig, Sweat, walk, type Limb } from '../sceneFigures'

const CHAR = '青'

const SUN = '#ffd24a'
const GRASS = '#c5e8a9'
const HILL = '#e2f2d2'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const STEM = '#4c9e54'
const WILT_LEAF = '#bdb866'
const WILT_LEAF_DARK = '#a29e55'
const WILT_STEM = '#a9a35a'
const STONE = '#cfc8ba'
const STONE_DARK = '#b3ab9b'
const STONE_CAP = '#e4ddd0'
const SOIL = '#8a6a4a'
const SOIL_WET = '#5e4630'
const WATER = '#7cc4f2'
const WATER_LIGHT = '#d8effc'
const WOOD = '#b27a4c'
const WOOD_DARK = '#8f5e37'
const CAN = '#e8645a'
const CAN_DARK = '#c94d45'

/** くぎり の時間(秒) */
const WALK = 0.7
const ARRIVE = 2.3
/** じょうろ を もちあげる */
const RAISE = 2.4
/** みず を かけはじめる / かけおわる */
const POUR_FROM = 3.1
const POUR_TO = 4.6
/** みず が しみて、草が ぴんと 立つ */
const PERK = 3.6
/** ぐんぐん のびる */
const GROW_FROM = 3.9
const GROW_TO = 5.7
/** じょうろ を おく / バンザイ */
const LOWER_END = 5.2
const CHEER = 5.45
const INK = 6.6
const DONE = 9.6
const DURATION = 10.2

/** 絵の きまった 場所 */
const GROUND_Y = 96.5
/** いど の ふち(上)の たかさ。草は ここの 土から はえる */
const RIM_Y = 52
const STEM_X = 54.5

type Point = readonly [number, number]

/* ───────── けしき ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 76 44 91 Q72 70 113 93 V101 H-4 Z" fill={HILL} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="88" cy="14" rx="7" ry="3.2" />
        <ellipse cx="93" cy="12" rx="5" ry="3.2" />
        <ellipse cx="-2" cy="30" rx="6" ry="2.8" />
        <ellipse cx="2.4" cy="28.4" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 46, 82, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** いど: 石を つんだ はこ。ふち(上)に 土が たまって いる。 */
function Well({ t }: SceneProps) {
  const rise = span(t, 0.1, 0.7, backOut)
  return (
    <Layer scaleY={rise} origin={[55, GROUND_Y]}>
      <rect x="36.8" y="56" width="36.7" height={GROUND_Y - 56} rx="2" fill={STONE} />
      {/* 石の つぎめ: よこ線 2本(7・8画目)と、たて の みじかい線 */}
      <g stroke={STONE_DARK} strokeWidth="1.3" strokeLinecap="round" fill="none">
        <path d="M37.4 67.4 H72.9 M37.4 78.4 H72.9" />
        <path d="M49 58 V66.8 M62 58 V66.8 M43 68 V77.8 M55.5 68 V77.8 M67.5 68 V77.8 M49 79 V95.5 M62 79 V95.5" />
      </g>
      <rect x="68.5" y="58" width="5" height={GROUND_Y - 58} rx="2" fill={STONE_DARK} opacity="0.55" />
      <rect x="33.6" y={RIM_Y} width="43" height="6.4" rx="3.2" fill={STONE_CAP} />
      <ellipse cx="55" cy={GROUND_Y + 0.6} rx="22" ry="2.6" fill="#000000" opacity="0.1" />
    </Layer>
  )
}

/** いどの そばに おいた、みずの はいった おけ。 */
function Bucket({ t }: SceneProps) {
  const pop = span(t, 0.3, 0.8, backOut)
  const ripple = 1.4 + wave(t, 1.6) * 0.5
  return (
    <Layer scale={pop} origin={[83.5, GROUND_Y]}>
      <ellipse cx="83.5" cy={GROUND_Y + 0.4} rx="8" ry="1.8" fill="#000000" opacity="0.1" />
      <path d="M77.6 85.5 L89.4 85.5 L88 96 L79 96 Z" fill={WOOD} />
      <path d="M78 89 H89 M78.6 93 H88.4" stroke={WOOD_DARK} strokeWidth="1.1" />
      <ellipse cx="83.5" cy="85.5" rx="5.9" ry="1.8" fill={WATER} />
      <ellipse cx="82.6" cy="85.3" rx={ripple + 1.2} ry="0.55" fill={WATER_LIGHT} />
      <path d="M77.8 85.5 Q83.5 75 89.2 85.5" fill="none" stroke={WOOD_DARK} strokeWidth="1.2" strokeLinecap="round" />
    </Layer>
  )
}

/* ───────── 草 ───────── */

type LeafPairProps = {
  readonly ax: number
  readonly ay: number
  readonly length: number
  /** 字の よこ線に そろえて、まとめて かたむける角度 */
  readonly tilt: number
  /** しおれて 下を むく角度 */
  readonly droop: number
  readonly scale: number
  readonly main: string
  readonly dark: string
}

/** 右むきの 葉 1まい。上半分を 明るく、下半分を 少し くらく ぬる。 */
function LeafShape({ length, main, dark }: { readonly length: number; readonly main: string; readonly dark: string }) {
  const w = 2.2 + length * 0.1
  return (
    <>
      <path d={`M0 0 C${length * 0.25} ${-w} ${length * 0.7} ${-w * 0.9} ${length} 0 Z`} fill={main} />
      <path d={`M0 0 C${length * 0.25} ${w * 0.8} ${length * 0.7} ${w * 0.8} ${length} 0 Z`} fill={dark} />
      <path d={`M0.5 0 H${length * 0.9}`} stroke="#ffffff" strokeOpacity="0.35" strokeWidth="0.7" strokeLinecap="round" />
    </>
  )
}

/** くき の 左右に でる 葉。みぎは そのまま、ひだり は ひっくりかえして 同じ形。 */
function LeafPair({ ax, ay, length, tilt, droop, scale, main, dark }: LeafPairProps) {
  if (scale <= 0.01) return null
  return (
    <Layer scale={scale} origin={[ax, ay]}>
      <g transform={`translate(${ax} ${ay}) rotate(${tilt + droop})`}>
        <LeafShape length={length} main={main} dark={dark} />
      </g>
      <g transform={`translate(${ax} ${ay}) scale(-1 1) rotate(${-tilt + droop})`}>
        <LeafShape length={length} main={main} dark={dark} />
      </g>
    </Layer>
  )
}

type PlantProps = {
  /** みず を もらって ぴんと 立った度合い(0 = しおれている) */
  readonly perk: number
  /** のびた 度合い(0 = ちいさな め) */
  readonly grow: number
  readonly sway: number
  readonly wet: number
}

function Plant({ perk, grow, sway, wet }: PlantProps) {
  const droop = 1 - perk
  const stemHeight = 6 + 38 * grow
  const top = RIM_Y - stemHeight
  // しおれた くきは、さきが 右下へ おじぎ する
  const lean = droop * (1 - grow)
  const stemColor = mixColor(WILT_STEM, STEM, perk)
  const main = mixColor(WILT_LEAF, LEAF, perk)
  const dark = mixColor(WILT_LEAF_DARK, LEAF_DARK, perk)
  const lowAttachY = 49 - 4.2 * span(grow, 0, 0.3, easeOut)
  const lowLength = 42 * (0.26 + 0.74 * span(grow, 0, 0.55, easeOut))
  const tipX = STEM_X + 5 * lean
  const tipY = top + 2.5 * lean
  return (
    <>
      {/* 土: みず を すうと こい色に */}
      <ellipse cx={STEM_X} cy={RIM_Y - 0.4} rx="6.4" ry="2" fill={mixColor(SOIL, SOIL_WET, wet)} />
      <Layer rotate={sway} origin={[STEM_X, RIM_Y]}>
        <path d={`M${STEM_X} ${RIM_Y} Q${STEM_X} ${RIM_Y - stemHeight * 0.55} ${tipX} ${tipY}`} fill="none" stroke={stemColor} strokeWidth="3" strokeLinecap="round" />
        <LeafPair ax={STEM_X} ay={lowAttachY} length={lowLength} tilt={-3} droop={42 * droop} scale={1} main={main} dark={dark} />
        <LeafPair ax={STEM_X} ay={31.7} length={20.5} tilt={-4.9} droop={20 * droop} scale={span(grow, 0.42, 0.72, backOut)} main={main} dark={dark} />
        <LeafPair ax={STEM_X} ay={20.1} length={22.3} tilt={-3.4} droop={20 * droop} scale={span(grow, 0.68, 0.95, backOut)} main={main} dark={dark} />
        {/* てっぺんの め */}
        <g transform={`translate(${tipX} ${tipY}) rotate(${lean * 75})`}>
          <ellipse cx="0" cy="-1.6" rx="1.9" ry="3.4" fill={mixColor(WILT_LEAF, LEAF_LIGHT, perk)} />
        </g>
      </Layer>
    </>
  )
}

/* ───────── 子ども ───────── */

type Mood = 'worried' | 'surprised' | 'happy'
const FACES = { worried: 'worried', surprised: 'surprised', happy: 'joy' } as const

/** 子どもの 見た目(だいだい の シャツ・青い 半ズボン) */
const KID_LOOK = { top: '#ef8a62', bottom: '#4a6fa5', bottomKind: 'shorts', sleeves: 'short' } as const
const KID_HEIGHT = 47
const KID_X = 22

/* ───────── じょうろ・みず ───────── */

/** 手の 場所(0,0)を じく に かいた じょうろ。さきの くち は (SPOUT_X, SPOUT_Y)。 */
const SPOUT: Point = [11, -9]

function WateringCan() {
  return (
    <>
      <path d="M6 8 L11 -8" stroke={CAN_DARK} strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="11.2" cy="-9.2" rx="2.4" ry="1.1" fill={CAN_DARK} transform="rotate(-18 11.2 -9.2)" />
      <path d="M-5.2 3.2 Q-5.6 0 0 0 Q5.6 0 5.2 3.2" fill="none" stroke={CAN_DARK} strokeWidth="1.6" strokeLinecap="round" />
      <rect x="-6" y="2.5" width="12" height="9" rx="2.2" fill={CAN} />
      <rect x="-6" y="6.2" width="12" height="1.4" fill={CAN_DARK} />
    </>
  )
}

function WaterStream({ from, flow, t }: { readonly from: Point; readonly flow: number; readonly t: number }) {
  if (flow <= 0) return null
  const end: Point = [STEM_X - 0.6, RIM_Y - 1.2]
  return (
    <g opacity={flow}>
      {Array.from({ length: 7 }, (_, i) => {
        const p = (t * 2.4 + i / 7) % 1
        const x = from[0] + (end[0] - from[0]) * p
        const y = from[1] + (end[1] - from[1]) * p * p
        return <path key={i} d="M0 -1.8 Q1.3 0.4 0 1.5 Q-1.3 0.4 0 -1.8 Z" fill={WATER} transform={`translate(${x} ${y}) scale(1.5)`} />
      })}
      <ellipse cx={end[0]} cy={RIM_Y - 0.6} rx={2.4 + wave(t, 0.4) * 0.7} ry="0.8" fill={WATER_LIGHT} />
    </g>
  )
}

/* ───────── 場面 ───────── */

const rad = (deg: number) => (deg * Math.PI) / 180

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)

  // あるく: 左から いどの そばまで(walk)
  const w = walk(t, { from: KID_X - 52, to: KID_X, start: WALK, end: ARRIVE, build: 'child', height: KID_HEIGHT, armSwing: 12 })
  const hp = span(t, CHEER, CHEER + 1.0)
  const hop = hp > 0 && hp < 1 ? Math.abs(Math.sin(hp * Math.PI * 2)) * 3.2 : 0

  const mood: Mood = t < 3.4 ? 'worried' : t < 4.4 ? 'surprised' : 'happy'

  // じょうろの うで(ひだりうで = てまえ): さげて あるく → もちあげて みず を かける → おろす → バンザイ
  const up = span(t, RAISE, POUR_FROM, easeInOut)
  const down = span(t, POUR_TO, LOWER_END, easeInOut)
  const cheer = span(t, LOWER_END, LOWER_END + 0.55, backOut)
  const carry: Limb = { swing: 14, bend: 60 }
  const pourPose: Limb = { to: [40, 59] }
  const cheerPose: Limb = { swing: 135, bend: 15 }
  const hold = up * (1 - down)
  const canArm = mixLimb(mixLimb(carry, pourPose, hold), cheerPose, cheer)
  const farCheer = span(t, LOWER_END + 0.1, LOWER_END + 0.65, backOut)
  const pose = { ...w.pose, leftArm: canArm, rightArm: mixLimb(w.pose.rightArm ?? HANG_ARM, { swing: 135, bend: 15 }, farCheer) }
  const kid = { ...w, y: GROUND_Y, look: KID_LOOK, face: FACES[mood], lift: hop, pose } as const

  // じょうろ: 手に もたれて うごく。かたむけると、さきから みず が でる
  const rig = personRig(kid)
  const tilt = 9 * span(t, POUR_FROM - 0.1, POUR_FROM + 0.35) * (1 - span(t, POUR_TO - 0.3, POUR_TO))
  const canHand = rig.world.arms.left.end
  const restRig = personRig({ ...kid, x: KID_X, lift: 0, pose: { leftArm: carry } })
  const restHand = restRig.world.arms.left.end
  const holding = t < LOWER_END
  const spoutTip: Point = [
    canHand[0] + SPOUT[0] * Math.cos(rad(tilt)) - SPOUT[1] * Math.sin(rad(tilt)),
    canHand[1] + SPOUT[0] * Math.sin(rad(tilt)) + SPOUT[1] * Math.cos(rad(tilt)),
  ]
  const flow = tilt > 4 ? during(t, POUR_FROM + 0.1, POUR_TO - 0.1, 0.15) : 0
  const head = rig.world.head

  // 草: みず が しみて ぴんと 立ち、ぐんぐん のびる
  const perk = span(t, PERK, PERK + 0.7, easeOut)
  const grow = span(t, GROW_FROM, GROW_TO, easeInOut)
  const wet = span(t, POUR_FROM + 0.4, POUR_FROM + 1.2) * (1 - span(t, GROW_TO, DONE))
  const sway = wave(t, 3) * 1.1 * grow * (1 - span(t, INK - 0.5, INK - 0.1))

  const sweat = during(t, WALK + 0.2, 3.2, 0.3)
  const bp = span(t, CHEER, CHEER + 1.5, easeOut)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Well t={t} />
        <Bucket t={t} />
        <Layer opacity={span(t, 0.5, 0.9)}>
          <Plant perk={perk} grow={grow} sway={sway} wet={wet} />
        </Layer>
        {/* 子どもの かげ と 子ども */}
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <ellipse cx={w.x} cy={GROUND_Y + 0.6} rx={9 - hop} ry="2.2" fill="#000000" opacity="0.12" />
          <Person {...kid} />
          {holding && (
            <g transform={`translate(${canHand[0]} ${canHand[1]}) rotate(${tilt})`}>
              <WateringCan />
            </g>
          )}
          <Sweat t={t} x={head[0] - 9} y={head[1] - 6} show={sweat} />
        </Layer>
        {!holding && (
          <g transform={`translate(${restHand[0]} ${GROUND_Y - 12.3})`}>
            <WateringCan />
          </g>
        )}
        <WaterStream from={[spoutTip[0], spoutTip[1]]} flow={flow} t={t} />
        {bp > 0 && <Butterfly x={112 - 26 * bp + wave(t, 0.9) * 2} y={30 + wave(t, 1.1) * 3 - bp * 3} t={t} />}
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
    { at: 0, label: 'いどの ふちの 草の めが しおれている', sound: 'pop' },
    { at: WALK, label: '子どもが いどの みずを じょうろに くんで あるいてくる' },
    { at: POUR_FROM, label: '草の ねもとに みずを かける', sound: 'pop' },
    { at: PERK, label: '草が ぴんと 立つ。子どもは びっくり' },
    { at: GROW_FROM, label: '草が ぐんぐん のびて 葉が ひろがる' },
    { at: CHEER, label: '子どもは バンザイ。ちょうちょも くる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '青 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
