/*
 * 花(はな): 草の つぼみが、みずを もらって ひらく。(共通部品 sceneFigures で 書きなおした もの)
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 木の えだ(右の木から ひだりへ のびる)
 *   2・3画目   … えだ に まきついた つる(草)。上へ のびた はさき と、下へ たれた はさき
 *   4画目(ノ)  … 女の子の ながい ポニーテール(あたまの うしろから 左下へ)
 *   5画目(丨)  … 女の子の からだ と あし
 *   6画目(ノ)  … 花の くきから ななめに のびた 葉
 *   7画目(乙)  … 花の くき と、まるい 花ばち
 *
 * ながれ
 *   木の えだに つるが のびる → 女の子が じょうろを もって あるいてくる
 *   → つぼみが しおれている。しんぱいで かおが くもる(地めんも かわいている)
 *   → 「そうだ」と ひらめいて、じょうろで みずを あげる(土が しめる)
 *   → つぼみが ぐんと おきあがり、ぽんと ひらく。女の子は ばんざいで とびはねて よろこぶ(ちょうちょも くる)
 *   → ほね が ひかって、絵が うすくなり、字「花」が のこる
 *
 * 女の子は Person(あるきは walk)。じょうろは てまえの 手で にぎり、みず口から みずが まっすぐ 下へ おちる。
 * 花は くきの先に つぼみが つき、みずを もらうと くきが のびて ひらく。
 */
import { backOut, clamp01, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, Butterfly, Canopy, HANG_ARM, LOOKS, mixLimb, Person, personRig, Sweat, walk, type Expression, type PersonProps } from '../sceneFigures'

const CHAR = '花'

const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const STEM = '#4c8f52'
const SUN = '#ffd24a'
const POT = '#d98255'
const POT_LIGHT = '#ec9f74'
const RIM = '#e8a070'
const SOIL_DRY = '#c29a6c'
const SOIL_WET = '#6b4630'
const PETAL = '#ff8fb1'
const PETAL_LIGHT = '#ffb5cb'
const CAN = '#4fb3a8'
const CAN_DARK = '#3c9a90'
const DROP = '#7cc4f2'

/** くぎり の時間(秒) */
const WALK = 0.8
const ARRIVE = 2.3
/** みずを あげはじめる / やめる */
const POUR = 3.4
const POUR_END = 5.0
/** つぼみが おきあがる */
const PERK = 4.5
/** つぼみが ひらく */
const OPEN = 5.0
/** 女の子が とびはねる */
const JOY = 5.8
const INK = 6.8
const DONE = 10.1
const DURATION = 10.7

type Pt = readonly [number, number]

const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const lerpPt = (a: Pt, b: Pt, k: number): Pt => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]
const rad = (deg: number) => (deg * Math.PI) / 180

/** 2つの色を まぜる(k = 0 で a、1 で b) */
function hexMix(a: string, b: string, k: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
  const part = (i: number) => Math.round(lerp(channel(a, i), channel(b, i), clamp01(k))).toString(16).padStart(2, '0')
  return `#${part(0)}${part(1)}${part(2)}`
}

/** 葉っぱの形。もと(bx,by)から さき(tx,ty)へ、はば w で ふくらむ */
function leafPath(bx: number, by: number, tx: number, ty: number, w: number): string {
  const mx = (bx + tx) / 2
  const my = (by + ty) / 2
  const len = Math.hypot(tx - bx, ty - by) || 1
  const nx = (-(ty - by) / len) * w
  const ny = ((tx - bx) / len) * w
  return `M${bx} ${by} Q${mx + nx} ${my + ny} ${tx} ${ty} Q${mx - nx} ${my - ny} ${bx} ${by} Z`
}

/* ───────── ばしょ(木・つる) ───────── */

/** 右がわの 大きな木。みき と しげみ。えだ(1画目)は Branch で のばす */
function BigTree({ t }: SceneProps) {
  const trunk = span(t, 0, 0.5, backOut)
  const crown = span(t, 0.2, 0.8, backOut)
  return (
    <>
      <Layer scaleY={trunk} origin={[107, 99]}>
        <path d="M98 99 Q103 93 103 86 L112 86 Q112 93 117 99 Z" fill={BARK} />
        <rect x="102" y="20" width="10" height="70" rx="3" fill={BARK} />
        <rect x="108" y="20" width="4" height="70" fill={BARK_DARK} opacity="0.5" />
      </Layer>
      <Canopy x={105} y={13} r={12.5} grow={crown} sway={wave(t, 3.6) * 1.2} />
    </>
  )
}

type VineLeaf = { readonly base: Pt; readonly tip: Pt }
/** つる(2画目・3画目)に つく葉。上から じゅんに 出る */
const VINE_2: readonly VineLeaf[] = [
  { base: [34.7, 18.5], tip: [29.6, 15.4] },
  { base: [36.3, 25.5], tip: [41.6, 22.4] },
  { base: [38.1, 32.5], tip: [32.8, 34.8] },
  { base: [39.8, 39.5], tip: [41.4, 45.6] },
]
const VINE_3: readonly VineLeaf[] = [
  { base: [71.4, 16.2], tip: [77, 13.2] },
  { base: [69.2, 23.4], tip: [63.4, 21] },
  { base: [66.9, 30.6], tip: [72.6, 32.8] },
  { base: [64.5, 37.8], tip: [63, 43.8] },
]

function Vine({ n, leaves, grow, t }: { readonly n: number; readonly leaves: readonly VineLeaf[]; readonly grow: number; readonly t: number }) {
  return (
    <>
      <Bone char={CHAR} n={n} color={STEM} width={2.2} to={grow} />
      {leaves.map((leaf, i) => {
        const size = span(grow, (i + 1) / (leaves.length + 1), (i + 1) / (leaves.length + 1) + 0.25, backOut)
        if (size <= 0) return null
        const flutter = wave(t, 3.2, i * 0.7) * 2
        return (
          <Layer key={i} scale={Math.max(0, size)} rotate={flutter} origin={leaf.base}>
            <path d={leafPath(leaf.base[0], leaf.base[1], leaf.tip[0], leaf.tip[1], 4.4)} fill={i % 2 === 0 ? LEAF : LEAF_DARK} />
          </Layer>
        )
      })}
    </>
  )
}

/** 木の えだ(1画目)が 右から 左へ のびて、つるが からまる */
function Branch({ t }: SceneProps) {
  const reach = span(t, 0.25, 0.85, easeOut)
  const vines = span(t, 0.7, 1.5)
  return (
    <>
      <path d="M90 25.8 C95 25.4 99 24.6 104 22.6" fill="none" stroke={BARK} strokeWidth="5.4" strokeLinecap="round" />
      <Bone char={CHAR} n={1} color={BARK} width={4.4} from={1 - reach} />
      <Vine n={2} leaves={VINE_2} grow={vines} t={t} />
      <Vine n={3} leaves={VINE_3} grow={span(t, 0.9, 1.7)} t={t} />
    </>
  )
}

/* ───────── 花ばち と 花 ───────── */

const SOIL_Y = 83.3
const STEM_BASE: Pt = [59.5, 83]
/** しおれた つぼみ(右へ うなだれる)と、おきあがった つぼみ の くきの先 */
const DROOP_TOP: Pt = [67, 64]
const UP_TOP: Pt = [59.5, 52]

function PlanterBack({ t, wet }: SceneProps & { readonly wet: number }) {
  const sprout = span(t, 0.1, 0.6, backOut)
  const soil = hexMix(SOIL_DRY, SOIL_WET, wet)
  return (
    <Layer scale={Math.max(0, sprout)} origin={[75, 95]}>
      <ellipse cx="75" cy="83" rx="23" ry="3.8" fill={RIM} />
      <ellipse cx="75" cy={SOIL_Y} rx="20.4" ry="2.6" fill={soil} />
      {/* かわいた 土の ひびわれ。みずを もらうと きえる */}
      <path d="M62 83.6 l3 0.7 l2.2 -0.6 M71 82.6 l2.6 0.8 M80 83.8 l3 -0.5 l1.8 0.7" fill="none" stroke={SOIL_WET} strokeWidth="0.6" strokeLinecap="round" opacity={0.55 * (1 - wet)} />
      {/* 右の すみの 小さな 草 */}
      {[
        [85, 80, 4.2],
        [87.5, 74, 4.6],
        [90, 77, 3.8],
      ].map(([x, ty, dx], i) => (
        <path key={i} d={leafPath(x, SOIL_Y, x + (i - 1) * dx + wave(t, 2.8, i) * 0.8, ty - 2, 1.8)} fill={i === 1 ? LEAF_LIGHT : LEAF} />
      ))}
    </Layer>
  )
}

function PlanterFront({ t }: SceneProps) {
  const sprout = span(t, 0.1, 0.6, backOut)
  return (
    <Layer scale={Math.max(0, sprout)} origin={[75, 95]}>
      <path d="M52 83 A23 3.8 0 0 0 98 83 C96 93 88 95.6 75 95.6 C62 95.6 54 93 52 83 Z" fill={POT} />
      <path d="M56 86 Q58 92 64 94" fill="none" stroke={POT_LIGHT} strokeWidth="2" strokeLinecap="round" opacity="0.8" />
    </Layer>
  )
}

const PETAL_ANGLES = [0, 45, 90, 135, 180, -135, -90, -45] as const

/** つぼみ → 花。くきの先(0,0)から 上へ。open = 0 でとじ、1 でひらく */
function Bloom({ open }: { readonly open: number }) {
  const cy = -(2.5 + 4.5 * open)
  const calyx = 1 - open * 0.3
  return (
    <>
      {PETAL_ANGLES.map((angle, i) => (
        <Layer key={angle} rotate={angle * open} origin={[0, cy]}>
          <ellipse cx="0" cy={cy - 4.6} rx={2.6 + 0.9 * open} ry="5" fill={i % 2 === 0 ? PETAL : PETAL_LIGHT} />
        </Layer>
      ))}
      <circle cx="0" cy={cy} r={3.2 * span(open, 0.35, 0.85, backOut)} fill={SUN} />
      <circle cx="-0.8" cy={cy - 0.8} r={1.1 * span(open, 0.4, 0.9)} fill="#fff0a8" />
      <Layer rotate={-open * 46} origin={[0, 0.4]} scale={calyx}>
        <path d={leafPath(0, 0.4, -3.4, -6.4, 3)} fill={LEAF_DARK} />
      </Layer>
      <Layer rotate={open * 46} origin={[0, 0.4]} scale={calyx}>
        <path d={leafPath(0, 0.4, 3.4, -6.4, 3)} fill={LEAF_DARK} />
      </Layer>
    </>
  )
}

/** くき・葉・つぼみ。perk = おきあがり、open = ひらき */
function Plant({ t, perk, open }: SceneProps & { readonly perk: number; readonly open: number }) {
  const sprout = span(t, 0.1, 0.6, backOut)
  const sway = open > 0.9 ? wave(t, 2.6) * 2 : 0
  const top = lerpPt(DROOP_TOP, UP_TOP, perk)
  // くきの先の むき(ま上から 右まわりに何度か)。しおれていると ほぼ 下
  const heading = lerp(165, 0, perk)
  const dir: Pt = [Math.sin(rad(heading)), -Math.cos(rad(heading))]
  const c2: Pt = [top[0] - dir[0] * 13, top[1] - dir[1] * 13]
  const leafTip = lerpPt([82, 77], [84.3, 50.3], clamp01(perk))
  const smallTip = lerpPt([70, 80], [71.5, 72.6], clamp01(perk))
  const leafColor = hexMix('#7fa86a', LEAF, perk)
  return (
    <Layer scale={Math.max(0, sprout)} origin={[59.5, 83]}>
      <path d={`M${STEM_BASE[0]} ${STEM_BASE[1]} C59.5 58 ${c2[0]} ${c2[1]} ${top[0]} ${top[1]}`} fill="none" stroke={STEM} strokeWidth="3.2" strokeLinecap="round" />
      <path d={leafPath(60.4, 78, smallTip[0], smallTip[1], 3.2)} fill={leafColor} />
      <Layer rotate={wave(t, 3, 0.4) * 1.5} origin={[60.6, 66]}>
        <path d={leafPath(60.6, 66, leafTip[0], leafTip[1], 6.4)} fill={leafColor} />
        <path d={`M60.6 66 L${lerp(60.6, leafTip[0], 0.8)} ${lerp(66, leafTip[1], 0.8)}`} stroke={LEAF_DARK} strokeWidth="0.7" strokeLinecap="round" />
      </Layer>
      <Layer x={top[0]} y={top[1]} rotate={heading + sway}>
        <Bloom open={open} />
      </Layer>
    </Layer>
  )
}

/* ───────── 女の子と じょうろ ───────── */

const GIRL_Y = 95
const GIRL_HEIGHT = 52
const GIRL_LOOK = { ...LOOKS.girl, top: '#f2837a', bottomKind: 'dress', accent: SUN } as const
/** かた から 手までの きょり(背の高さ に たいする わりあい)。もちはこぶ 手 と、かたむける 手 */
const CARRY_REACH: Pt = [0.14, 0.17]
const POUR_REACH: Pt = [0.24, 0.07]

/** じょうろ。手(にぎり)を 0,0 に して、みず口は 右むき。 */
const SPOUT_TIP: Pt = [16.8, 4.2]

function tipOf(hand: Pt, tilt: number): Pt {
  const c = Math.cos(rad(tilt))
  const s = Math.sin(rad(tilt))
  return [hand[0] + SPOUT_TIP[0] * c - SPOUT_TIP[1] * s, hand[1] + SPOUT_TIP[0] * s + SPOUT_TIP[1] * c]
}

function WateringCan({ hand, tilt }: { readonly hand: Pt; readonly tilt: number }) {
  return (
    <Layer x={hand[0]} y={hand[1]} rotate={tilt}>
      <path d="M-4.2 7 C-5 1.2 -2 -0.2 0.2 -0.2 C2.6 -0.2 5 1.4 4.6 7" fill="none" stroke={CAN_DARK} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.4 14 L16 4.8" stroke={CAN_DARK} strokeWidth="2.6" strokeLinecap="round" />
      <rect x="-5.6" y="5" width="12.8" height="11" rx="3" fill={CAN} />
      <rect x="-5.6" y="12.4" width="12.8" height="3.6" rx="1.8" fill={CAN_DARK} />
      <ellipse cx="16.8" cy="4.2" rx="1.8" ry="3.2" transform="rotate(42 16.8 4.2)" fill={CAN_DARK} />
    </Layer>
  )
}

type GirlState = {
  readonly face: Expression
  readonly hold: number
  readonly canTilt: number
  readonly cheer: number
  readonly hop: number
  readonly headTilt: number
}

/** 女の子の 場所・ポーズ(あるきは walk)。じょうろを もつ 手は 点で 指定する */
function girlProps(t: number, s: GirlState): { readonly props: PersonProps; readonly hand: Pt; readonly tip: Pt } {
  const w = walk(t, { from: -32, to: 32, start: WALK, end: ARRIVE, build: 'child', height: GIRL_HEIGHT, armSwing: 18 })
  const sway = w.moving ? wave(t, 0.72) * 8 : wave(t, 0.7) * 1.5
  const base: PersonProps = {
    ...w,
    y: GIRL_Y,
    look: GIRL_LOOK,
    face: s.face,
    lift: s.hop,
    hairSway: sway + (s.hop > 0 ? 6 : 0),
    pose: { ...w.pose, rightArm: mixLimb(w.pose.rightArm ?? HANG_ARM, { swing: 150, bend: 0 }, s.cheer), head: s.headTilt },
  }
  const shoulder = personRig(base).world.arms.left.root
  const reach = (r: Pt): Pt => [shoulder[0] + r[0] * GIRL_HEIGHT, shoulder[1] + r[1] * GIRL_HEIGHT]
  const target = lerpPt(reach(CARRY_REACH), reach(POUR_REACH), s.hold)
  const props: PersonProps = { ...base, pose: { ...base.pose, leftArm: { to: target } } }
  const hand = personRig(props).world.arms.left.end
  return { props: { ...props, held: <WateringCan hand={hand} tilt={s.canTilt} /> }, hand, tip: tipOf(hand, s.canTilt) }
}

/* ───────── 小さな にぎやかし ───────── */

/** じょうろから おちる みず と、土に できる わ */
function Water({ t, tip }: SceneProps & { readonly tip: Pt }) {
  const show = during(t, POUR + 0.35, POUR_END + 0.15, 0.15)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {Array.from({ length: 6 }, (_, i) => {
        const p = (t * 2.2 + i / 6) % 1
        const x = tip[0] + 1.6 * p
        const y = tip[1] + (SOIL_Y - tip[1]) * p ** 1.6
        return <ellipse key={i} cx={x} cy={y} rx="0.9" ry="1.6" fill={DROP} />
      })}
      {[0, 0.5].map((offset) => {
        const p = (t * 2.2 + offset) % 1
        return <ellipse key={offset} cx={tip[0] + 1.6} cy={SOIL_Y + 0.2} rx={1 + p * 4} ry={0.4 + p * 0.8} fill="none" stroke="#d8effc" strokeWidth="0.6" opacity={1 - p} />
      })}
    </g>
  )
}

/** ひらめき(あたまの上の ほし と きらり) */
function Idea({ t, at }: SceneProps & { readonly at: Pt }) {
  const show = during(t, POUR - 0.55, POUR + 0.3, 0.12)
  if (show <= 0) return null
  const pop = span(t, POUR - 0.55, POUR - 0.3, backOut)
  return (
    <g opacity={show}>
      <Star cx={at[0]} cy={at[1]} r={4.4 * Math.max(0, pop)} color={SUN} spin={pop * 30} />
      {[-40, 0, 40].map((deg) => (
        <path key={deg} d="M0 -7.4 L0 -9.4" stroke={SUN} strokeWidth="1" strokeLinecap="round" transform={`translate(${at[0]} ${at[1]}) rotate(${deg})`} />
      ))}
    </g>
  )
}

/** 花が ひらいたら、ちょうちょが とんでくる */
function Visitor({ t }: SceneProps) {
  const arrive = span(t, OPEN + 0.9, OPEN + 1.8, easeOut)
  if (arrive <= 0) return null
  const hoverX = 77 + Math.sin(t * 2.4) * 4
  const hoverY = 36 + Math.cos(t * 3.2) * 2.5
  const x = lerp(116, hoverX, arrive)
  const y = lerp(8, hoverY, arrive) - Math.sin(arrive * Math.PI) * 6
  return <Butterfly x={x} y={y} t={t} />
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)

  // とびはねる(ぴょんぴょん)
  const hopping = t >= JOY && t < JOY + 0.8 ? Math.abs(Math.sin(((t - JOY) * Math.PI) / 0.4)) * 3.2 : 0

  // みずを あげる: じょうろを もちあげて かたむける
  const hold = span(t, POUR - 0.45, POUR + 0.15, easeInOut) * (1 - span(t, POUR_END + 0.1, POUR_END + 0.6, easeInOut))
  const canTilt = 36 * span(t, POUR, POUR + 0.4, easeOut) * (1 - span(t, POUR_END, POUR_END + 0.4))

  // 土が しめって、つぼみが おきあがり、ひらく
  const wet = span(t, POUR + 0.5, POUR_END + 0.6)
  const perk = span(t, PERK, PERK + 0.8, backOut)
  const open = span(t, OPEN, OPEN + 0.9, easeInOut)

  const face: Expression = t < ARRIVE ? 'normal' : t < POUR ? 'worried' : t < OPEN + 0.35 ? 'smile' : 'joy'
  const headTilt = 6 * span(t, ARRIVE, ARRIVE + 0.4) * (1 - span(t, PERK, PERK + 0.5)) - 4 * span(t, OPEN + 0.3, OPEN + 0.7)
  const cheer = span(t, JOY, JOY + 0.3, easeOut)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  const girl = girlProps(t, { face, hold, canTilt, cheer, hop: hopping, headTilt })
  const head = personRig(girl.props).world.head
  const sweat = during(t, ARRIVE + 0.2, POUR - 0.3, 0.2)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} clouds={[]} tufts={[6, 24, 46, 100]} />
        <BigTree t={t} />
        <Branch t={t} />
        <PlanterBack t={t} wet={wet} />
        <Plant t={t} perk={perk} open={open} />
        <PlanterFront t={t} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <Person {...girl.props} />
          <Sweat t={t} x={head[0] - 8} y={head[1] - 4} show={sweat} />
        </Layer>
        <Idea t={t} at={[head[0] + 13, head[1] - 13]} />
        <Water t={t} tip={girl.tip} />
        <Visitor t={t} />
        <Sparkles cx={59.5} cy={45} progress={span(t, OPEN + 0.5, OPEN + 1.4)} reach={20} count={6} />
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
    { at: 0, label: '木の えだに つるが のびる', sound: 'pop' },
    { at: WALK, label: '女の子が じょうろを もって あるいてくる' },
    { at: ARRIVE, label: 'つぼみが しおれている。しんぱい' },
    { at: POUR, label: 'ひらめいて、みずを あげる', sound: 'pop' },
    { at: PERK, label: 'つぼみが おきあがる' },
    { at: OPEN, label: 'つぼみが ひらいて 花が さく。女の子は おおよろこび', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '花 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
