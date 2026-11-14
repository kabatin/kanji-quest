/*
 * 切(きる): ほうちょうで だいこんを すぱっと きる。(共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)  ※ 字の形に合わせず、人の つくり を 先に 守った。だいたい 同じ 場所・向き
 *   1画目(一)  … ほうちょうが とおった あと、だいこんが きれた よこの線(きりくち)
 *   2画目(𠃍)  … 立っている だいこん と、それを のせた 台の ふち
 *   3画目(𠃍)  … 右がわに 立つ 子ども(あたま から せなか、あし)
 *   4画目(ノ)  … ほうちょうを ふりおろす 方向(右上から 左下へ)
 *
 * ながれ
 *   大きな だいこんが 台の上に でる → おなかを すかせた 子が あるいてくる(おなかが ぐるぐる)
 *   → 「きって たべよう」と ひらめく → ほうちょうを ふりあげ、ぐっと 前へ ふみこんで すぱっ!
 *   → だいこんの 上が ずれて ころがり、子は にっこり。ぴょんと よろこぶ
 *   → ほね が ひかって、絵が うすくなり、字「切」が のこる
 *
 * 子どもは Person(walk で あるく。うで は 手の 場所を { to } で きめる)。
 * ほうちょうは 手の 先に held で もたせる(てまえの 手が ほうちょうの 上に くる)。
 * だいこんの 上は、きりくちの 斜めに そって ずれ、しぜんに ころがる(下がりの 方向=左)。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, CLOTHES, Dust, LOOKS, PALETTE, Person, personRig, walk, type PersonPose } from '../sceneFigures'

const CHAR = '切'

const WOOD = '#d9a066'
const WOOD_DARK = '#b97f4a'
const WOOD_TOP = '#e9b97e'
const RADISH = '#f6f3e6'
const RADISH_SHADE = '#e1dac0'
const CUT_FACE = '#fff2b8'
const LEAF = PALETTE.leaf
const LEAF_DARK = '#3f9c59'
const STEEL = '#dfe8f0'
const STEEL_SHADE = '#b3c2d2'
const HANDLE = '#8a5a3c'
const HAT = '#ffffff'
const HAT_SHADE = '#e4eaf1'

/** くぎり の時間(秒) */
const WALK_IN = 0.7
const ARRIVE = 1.7
/** 「きって たべよう」と ひらめく */
const THINK = 2.8
const RAISE = 3.8
const SLASH = 4.4
/** ほうちょうが だいこんを とおりぬけた しゅんかん */
const CUT = 4.75
const JOY = 6.0
const INK = 6.8
const DONE = 9.5
const DURATION = 10.1

type Pt = readonly [number, number]

/* ───────── 場所 ───────── */

/** 台の 上の めん(ここに だいこんが のる)。2画目の さいごの よこ線と おなじ高さ */
const TABLE_TOP = 69.5
/** 子どもの 立つ ところ(こし の x)と 地面、背の高さ */
const STAND_X = 80
const GROUND = 94
const BOY_HEIGHT = 62
/** だいこんの きりくち(左はし・右はし)。右が 少し高い(1画目と おなじ むき) */
const CUT_L: Pt = [19.5, 44.6]
const CUT_R: Pt = [34.5, 42]
/** 刃が きりくちを とおりぬけた ときの 手の 場所(とどかなければ その むきへ のばす) */
const SLASH_HAND: Pt = [46, 40]
/** 手の 場所(かた からの ずれ)と、ほうちょうの むき(度) */
const REST_OFF: Pt = [-3, 14]
const WIND_OFF: Pt = [-12, -18]
const LOW_OFF: Pt = [-15, 6]
const KNIFE_REST = -72
const KNIFE_WIND = 55
const KNIFE_SLASH = -10
const KNIFE_LOW = -28

const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const lerpPt = (a: Pt, b: Pt, k: number): Pt => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]
const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]]

/** 木の 台。だいこんを のせて きる。ゆっくり でてくる */
function Table({ t }: SceneProps) {
  const rise = span(t, 0, 0.55, backOut)
  return (
    <Layer scaleY={rise} origin={[30, 96.5]}>
      <ellipse cx="29" cy="97.4" rx="34" ry="2.4" fill="#000000" opacity="0.1" />
      <rect x="3" y="76" width="5.6" height="20.5" rx="1.6" fill={WOOD_DARK} />
      <rect x="50" y="76" width="5.6" height="20.5" rx="1.6" fill={WOOD_DARK} />
      <rect x="-4" y={TABLE_TOP} width="66" height="7.4" rx="2.4" fill={WOOD} />
      <rect x="-4" y={TABLE_TOP} width="66" height="2.6" rx="1.3" fill={WOOD_TOP} />
    </Layer>
  )
}

/* ───────── だいこん ───────── */

/** 下の ぶぶん(根もと)。きりくちは 右が 少し高い */
function RadishBase() {
  return (
    <>
      <path d={`M${CUT_L[0]} ${CUT_L[1]} L${CUT_R[0]} ${CUT_R[1]} L34.5 56 Q34.2 66 31 ${TABLE_TOP} L23 ${TABLE_TOP} Q19.8 66 19.5 56 Z`} fill={RADISH} />
      <path d="M32.3 45 L32.4 56 Q32 64.5 29.6 68.6" fill="none" stroke={RADISH_SHADE} strokeWidth="2" strokeLinecap="round" />
      <path d="M21.4 54 h2.6 M22 61 h2.4" stroke={RADISH_SHADE} strokeWidth="1" strokeLinecap="round" />
    </>
  )
}

/** きりくち(うえから 見えるめん)。上のぶぶんが どくと あらわれる */
function CutFace() {
  return <path d={`M${CUT_L[0]} ${CUT_L[1]} L${CUT_R[0]} ${CUT_R[1]} L${CUT_R[0]} 40.4 L${CUT_L[0]} 43 Z`} fill={CUT_FACE} />
}

/** 上の ぶぶん(はっぱの つき)。きりくちは 下がわ */
function RadishTop() {
  return (
    <>
      <path d="M25.6 35 Q23.6 32 22.6 30 M27 35 L27 29.6 M28.6 35 Q30.8 32 31.8 30.2" fill="none" stroke={LEAF_DARK} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M25.6 35 Q23 31 21.6 27.4 M28.6 35 Q31.2 31 32.6 27.6" fill="none" stroke={LEAF} strokeWidth="1.5" strokeLinecap="round" />
      <path d={`M${CUT_L[0]} ${CUT_L[1]} L19.5 40 Q19.5 33.6 27 33.6 Q34.5 33.6 34.5 40 L${CUT_R[0]} ${CUT_R[1]} Z`} fill={RADISH} />
      <path d="M32.3 38 L32.4 41.6" stroke={RADISH_SHADE} strokeWidth="2" strokeLinecap="round" />
    </>
  )
}

/** 上のぶぶんが 下の きりくちを すべって、左へ たおれて 台の上に ころがる */
const LAND = CUT + 0.72
/** たおれて ころがったあとの 下がる 高さ(下はしが 台の上に とどく) */
const DROP_TO_TABLE = TABLE_TOP - CUT_L[1]

function Radish({ t }: SceneProps) {
  const grow = span(t, 0.25, 0.85, backOut)
  const slide = span(t, CUT, CUT + 0.22, easeOut)
  const tip = span(t, CUT + 0.18, LAND, easeIn)
  const u = (t - LAND) / 0.4
  const bounce = u > 0 && u < 1 ? Math.sin(u * Math.PI) * 2.2 * (1 - u) : 0
  const shine = during(t, CUT, CUT + 0.8, 0.15)
  return (
    <Layer scale={Math.max(0, grow)} origin={[27, TABLE_TOP]}>
      <RadishBase />
      <CutFace />
      <Layer x={-0.5 * slide} y={0.3 * slide + DROP_TO_TABLE * tip - bounce} rotate={-90 * tip} origin={CUT_L}>
        <RadishTop />
      </Layer>
      {shine > 0 && (
        <g opacity={shine}>
          <Star cx={22} cy={39} r={3.2} color="#ffffff" spin={t * 120} />
          <Star cx={33} cy={37.4} r={2.4} color="#fff2a8" spin={-t * 100} />
        </g>
      )}
    </Layer>
  )
}

/** ほうちょうが とおった あとの 白い すじ(きりくちの 場所に そって、右から 左へ) */
function SlashTrail({ t }: SceneProps) {
  const go = span(t, CUT - 0.18, CUT + 0.05)
  const fade = 1 - span(t, CUT + 0.05, CUT + 0.4)
  if (go <= 0 || fade <= 0) return null
  return <path d="M44 41.6 Q28 41.4 8 47" pathLength={1} strokeDasharray={`${go} 2`} fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" opacity={0.9 * fade} />
}

/* ───────── 子ども(しゅやく) ───────── */

/** ほうちょう。手の ところが 原点。刃は 左へ のびる(R=0 で ま横。+ で 刃先が 上へ) */
function Knife({ at, rotate }: { readonly at: Pt; readonly rotate: number }) {
  return (
    <Layer x={at[0]} y={at[1]} rotate={rotate}>
      <rect x="-6" y="-2.6" width="15" height="5.4" rx="2.4" fill={HANDLE} />
      <circle cx="3.6" cy="0.1" r="0.6" fill="#e8c9a0" />
      <circle cx="7" cy="0.1" r="0.6" fill="#e8c9a0" />
      <path d="M-6 -3.2 L-22 -3.2 Q-28.4 -2.6 -31 1.6 Q-18 4.8 -6 4.4 Z" fill={STEEL} />
      <path d="M-6.6 2.6 Q-18 3.2 -28 1.8 Q-18 4.8 -6 4.4 Z" fill={STEEL_SHADE} />
      <path d="M-8 -1.8 L-22 -1.8" stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round" opacity="0.85" />
      <rect x="-7.4" y="-3.6" width="1.8" height="8.4" rx="0.6" fill={STEEL_SHADE} />
    </Layer>
  )
}

/** コックぼうし(あたまの まんなか が 0,0、半径 1) */
const COOK_HAT = (
  <>
    <circle cx="-0.45" cy="-1.55" r="0.56" fill={HAT_SHADE} />
    <circle cx="0.45" cy="-1.5" r="0.56" fill={HAT_SHADE} />
    <circle cx="0" cy="-1.95" r="0.69" fill={HAT} />
    <circle cx="-0.5" cy="-1.6" r="0.49" fill={HAT} />
    <circle cx="0.5" cy="-1.55" r="0.49" fill={HAT} />
    <rect x="-0.87" y="-1.28" width="1.74" height="0.44" rx="0.16" fill={HAT} />
    <rect x="-0.87" y="-1.04" width="1.74" height="0.2" rx="0.1" fill={HAT_SHADE} />
  </>
)

const BOY_LOOK = { ...LOOKS.boy, top: CLOTHES.orange.top, bottom: '#3e5c86', hair: PALETTE.hair } as const

/** おなかが ぐるぐる。体のまえ(左)に ひろがる。 */
function Rumble({ t, x, y }: { readonly t: number; readonly x: number; readonly y: number }) {
  const show = during(t, ARRIVE, THINK + 0.1, 0.2)
  if (show <= 0) return null
  const beat = wave(t, 0.5)
  return (
    <g opacity={show} fill="none" stroke="#c99a55" strokeWidth="1.2" strokeLinecap="round">
      <path d={`M${x - 3 - beat} ${y} Q${x - 6 - beat} ${y + 4.4} ${x - 3 - beat} ${y + 8.8}`} />
      <path d={`M${x - 7 - beat * 1.4} ${y - 2.4} Q${x - 11.4 - beat * 1.4} ${y + 4.4} ${x - 7 - beat * 1.4} ${y + 11.2}`} opacity="0.8" />
    </g>
  )
}

/** 「きって たべよう」と ひらめく ふきだし。だいこんが 2つに きれる えが 出る */
function Idea({ t }: SceneProps) {
  const k = during(t, THINK, THINK + 1.1, 0.25)
  if (k <= 0) return null
  const pop = backOut(span(t, THINK, THINK + 0.3))
  const apart = span(t, THINK + 0.45, THINK + 0.8, easeOut)
  return (
    <Layer opacity={k} scale={Math.max(0, pop)} origin={[59, 11]}>
      <circle cx="72" cy="20.6" r="1.5" fill="#eaf6ff" stroke="#c9d6e6" strokeWidth="0.6" />
      <circle cx="68" cy="17.6" r="2.3" fill="#eaf6ff" stroke="#c9d6e6" strokeWidth="0.6" />
      <circle cx="59" cy="11" r="10.5" fill="#eaf6ff" stroke="#c9d6e6" strokeWidth="0.8" />
      <path d="M56.4 12.6 h6.6 v5 q0 2 -2 2 h-2.6 q-2 0 -2 -2 Z" fill={RADISH} stroke={RADISH_SHADE} strokeWidth="0.5" />
      <Layer x={-1.4 * apart} y={-1.8 * apart}>
        <path d="M56.4 12 v-2.4 q0 -2.8 3.3 -2.8 q3.3 0 3.3 2.8 v1.4 Z" fill={RADISH} stroke={RADISH_SHADE} strokeWidth="0.5" />
        <path d="M58.4 6.8 l-0.8 -2.4 M60.2 6.8 l0.8 -2.4" stroke={LEAF_DARK} strokeWidth="1" strokeLinecap="round" />
      </Layer>
    </Layer>
  )
}

/* ───────── ぜんたい ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  // あるいてくる(はやあし)→ ふりあげ → ふみこんで ふりおろす → もどる
  const w = walk(t, { from: 130, to: STAND_X, start: WALK_IN, end: ARRIVE, build: 'child', height: BOY_HEIGHT, step: 24 })
  const raise = span(t, RAISE, SLASH, easeInOut)
  const slash = span(t, SLASH, CUT, easeIn)
  const recover = span(t, 5.1, 5.75, easeInOut)
  const lunge = slash * (1 - span(t, 5.4, 6.1, easeInOut))
  const wind = raise * (1 - slash)
  const joy = t - JOY
  const hop = joy > 0 && joy < 0.6 ? Math.abs(Math.sin((joy * Math.PI) / 0.3)) * 3 : 0
  const mood = t < THINK ? 'worried' : t < CUT + 0.05 ? 'strain' : 'joy'

  // 体: 前へ ふみこむと 左へ すすみ、上体が まえ(左)へ かたむく
  const body = { ...w, y: GROUND, x: w.x - 10 * lunge, lean: 8 * lunge - 3 * wind, lift: hop }
  const legs: PersonPose = lunge > 0.02 ? { rightLeg: { swing: 30 * lunge, bend: 8 * lunge }, leftLeg: { swing: -26 * lunge, bend: 0 } } : {}
  const base: PersonPose = { ...w.pose, ...legs, leftArm: lunge > 0.02 ? { swing: -30 * lunge, bend: 10 } : w.pose.leftArm, head: mood === 'worried' ? 4 : -3 }

  // うで: かた の場所は 体といっしょに うごく。手の 場所だけ きめて、ひじは 部品が 計算
  const shoulder = personRig({ ...body, pose: base }).world.arms.right.root
  const pre = add(shoulder, lerpPt(REST_OFF, WIND_OFF, raise))
  const swung = lerpPt(pre, SLASH_HAND, slash)
  const hand = lerpPt(swung, add(shoulder, LOW_OFF), recover)
  const pose: PersonPose = { ...base, rightArm: { to: hand } }
  const reached = personRig({ ...body, pose }).world.arms.right.end
  const knifeTurn = lerp(lerp(lerp(KNIFE_REST, KNIFE_WIND, raise), KNIFE_SLASH, slash), KNIFE_LOW, recover)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} tufts={[6, 62, 100]} />
        <Table t={t} />
        <Radish t={t} />
        <Dust x={10} y={TABLE_TOP - 1} p={span(t, LAND - 0.03, LAND + 0.5)} reach={10} />
        <Person {...body} pose={pose} look={BOY_LOOK} face={mood} headwear={COOK_HAT} held={<Knife at={reached} rotate={knifeTurn} />} />
        <Rumble t={t} x={body.x} y={GROUND - 36} />
        <SlashTrail t={t} />
        <Idea t={t} />
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
    { at: 0, label: '台の上に 大きな だいこん', sound: 'pop' },
    { at: WALK_IN, label: 'おなかを すかせた 子が あるいてくる' },
    { at: THINK, label: '「きって たべよう」と ひらめく', sound: 'pop' },
    { at: RAISE, label: 'ほうちょうを ふりあげる' },
    { at: SLASH, label: 'ふみこんで ふりおろす' },
    { at: CUT, label: 'すぱっ! だいこんが きれる', sound: 'pop' },
    { at: JOY, label: 'ぴょんと よろこぶ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '切 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
