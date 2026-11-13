/*
 * 切(きる): かたな(ほうちょう)で だいこんを すぱっと きる。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … かたなが とおった あと、だいこんが きれた よこの線(きりくち)
 *   2画目(𠃍)  … 立っている だいこん と、それを のせた 台の ふち
 *   3画目(𠃍)  … 右がわに 立つ 子ども(あたま から せなか、あし)
 *   4画目(ノ)  … かたなを ふりおろす 方向(右上から 左下へ)
 *
 * ながれ
 *   大きな だいこんが 台の上に でる → おなかを すかせた 子が あるいてくる(おなかが ぐるぐる)
 *   → 「きって たべよう」と ひらめく → かたなを ふりあげ、ぐっと 前へ ふみこんで すぱっ!
 *   → だいこんの 上が ずれて ころがり、子は にっこり。ぴょんと よろこぶ
 *   → ほね が ひかって、絵が うすくなり、字「切」が のこる
 *
 * 人と ほうちょうは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる(ひじは 下むき)。かた と 手 の 場所から ひじを 計算して つなぐ。
 *   ほうちょうは、えと 刃(は)が はっきり ある かたち。刃は 手の 前に のびて、だいこんを とおりぬける。
 *   だいこんの 上は、きりくちの 斜めに そって ずれ、しぜんに ころがる(下がりの 方向=左)。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '切'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#ef6a4d'
const TUNIC_DARK = '#d4553b'
const TUNIC_FAR = '#b9462f'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const HAT = '#ffffff'
const HAT_SHADE = '#e4eaf1'
const WOOD = '#d9a066'
const WOOD_DARK = '#b97f4a'
const WOOD_TOP = '#e9b97e'
const RADISH = '#f6f3e6'
const RADISH_SHADE = '#e1dac0'
const CUT_FACE = '#fff2b8'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const STEEL = '#dfe8f0'
const STEEL_SHADE = '#b3c2d2'
const HANDLE = '#8a5a3c'

/** くぎり の時間(秒) */
const WALK_IN = 0.7
const ARRIVE = 1.7
/** 「きって たべよう」と ひらめく */
const THINK = 2.8
const RAISE = 3.8
const SLASH = 4.4
/** かたなが だいこんを とおりぬけた しゅんかん */
const CUT = 4.75
const JOY = 6.0
const INK = 6.8
const DONE = 9.5
const DURATION = 10.1

type Pt = readonly [number, number]

/* ───────── 場所 ───────── */

/** 台の 上の めん(ここに だいこんが のる)。2画目の さいごの よこ線と おなじ高さ */
const TABLE_TOP = 69.5
/** 子どもの 足もと(ふみこむときの じく)と、かた */
const FEET: Pt = [86, 94]
const SHOULDER: Pt = [86, 50]
/** だいこんの きりくち(左はし・右はし)。右が 少し高い(1画目と おなじ むき) */
const CUT_L: Pt = [19.5, 44.6]
const CUT_R: Pt = [34.5, 42]
/** 刃が きりくちを とおりぬけた ときの 手の 場所 */
const SLASH_HAND: Pt = [49, 39]
/** うで の ぶぶんの長さ(かた→ひじ→手) */
const ARM_PART = 14.5

const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const lerpPt = (a: Pt, b: Pt, k: number): Pt => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]
const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]]

/** 体の中の点が、ふみこみ・かたむき・とびはね の あとで どこに くるか */
function toWorld(p: Pt, dx: number, lift: number, lean: number): Pt {
  const rad = (lean * Math.PI) / 180
  const rx = p[0] - FEET[0]
  const ry = p[1] - FEET[1]
  return [FEET[0] + rx * Math.cos(rad) - ry * Math.sin(rad) + dx, FEET[1] + rx * Math.sin(rad) + ry * Math.cos(rad) - lift]
}

/** かた と 手 から ひじを きめる(ひじは 下がわ へ まがる)。手が とどかないときは、とどく所まで。 */
function solveArm(shoulder: Pt, target: Pt): { readonly elbow: Pt; readonly hand: Pt } {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const reach = Math.hypot(dx, dy)
  const d = Math.min(Math.max(reach, 4), ARM_PART * 2 - 0.05)
  const ux = dx / (reach || 1)
  const uy = dy / (reach || 1)
  const along = d / 2
  const h = Math.sqrt(Math.max(0, ARM_PART * ARM_PART - along * along))
  const a: Pt = [shoulder[0] + ux * along - uy * h, shoulder[1] + uy * along + ux * h]
  const b: Pt = [shoulder[0] + ux * along + uy * h, shoulder[1] + uy * along - ux * h]
  return { elbow: a[1] >= b[1] ? a : b, hand: [shoulder[0] + ux * d, shoulder[1] + uy * d] }
}

/* ───────── まわり ───────── */

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
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 94 V101 H-4 Z" fill="#e2f2d2" />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 62, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

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

/** ころがって 台に ぶつかった ときの ほこり */
function Dust({ t }: SceneProps) {
  const p = span(t, LAND - 0.03, LAND + 0.5)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={(1 - p) * 0.85} fill="#ffffff" stroke="#e6dfcc" strokeWidth="0.5">
      {[3, 10, 17].map((x, i) => (
        <circle key={x} cx={x - p * (i - 1) * 3} cy={TABLE_TOP - 1 - p * 3.5} r={1.2 + p * 2.6} />
      ))}
    </g>
  )
}

/** かたなが とおった あとの 白い すじ(きりくちの 場所に そって、右から 左へ) */
function SlashTrail({ t }: SceneProps) {
  const go = span(t, CUT - 0.18, CUT + 0.05)
  const fade = 1 - span(t, CUT + 0.05, CUT + 0.4)
  if (go <= 0 || fade <= 0) return null
  return (
    <path d="M44 41.6 Q28 41.4 8 47" pathLength={1} strokeDasharray={`${go} 2`} fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" opacity={0.9 * fade} />
  )
}

/* ───────── 子ども(しゅやく) ───────── */

type Mood = 'hungry' | 'ready' | 'happy'

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="83.4" cy="38.8" r="2" fill="#ff9d9d" opacity="0.55" />
      {mood === 'happy' ? (
        <>
          <path d="M78.8 35 Q81 32.4 83.2 35" fill="none" stroke="#2b2b2b" strokeWidth="1.3" strokeLinecap="round" />
          <ellipse cx="79.6" cy="40.2" rx="2.5" ry="2.2" fill="#b9483f" />
          <ellipse cx="79.8" cy="41.2" rx="1.4" ry="0.9" fill="#ff8a8a" />
        </>
      ) : (
        <>
          <circle cx="81.2" cy="34.6" r="1.25" fill="#2b2b2b" />
          {mood === 'hungry' ? (
            <>
              <path d="M78.6 32.2 L83.4 30.6" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
              <path d="M76.8 40.6 Q78.2 39.2 79.6 40.6 T82.4 40.6" fill="none" stroke="#b9483f" strokeWidth="1.1" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d="M78.6 30.8 L83.4 32.2" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
              <path d="M77.4 39.4 Q79.8 42.6 82.4 39.8" fill="none" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
            </>
          )}
        </>
      )}
    </>
  )
}

function Head({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="86" cy="34" r="9" fill={SKIN} />
      <circle cx="77" cy="36.6" r="1.4" fill={SKIN} />
      <path d="M89.5 26 C95.4 28 96 38 91.5 42.2 C89.2 38 88.2 31 89.5 26 Z" fill={HAIR} />
      <circle cx="88.8" cy="36" r="2.1" fill={SKIN_SHADE} />
      <Face mood={mood} />
      {/* コックぼうし */}
      <circle cx="82" cy="20.6" r="5" fill={HAT_SHADE} />
      <circle cx="90" cy="21" r="5" fill={HAT_SHADE} />
      <circle cx="86" cy="17" r="6.2" fill={HAT} />
      <circle cx="81.6" cy="20" r="4.4" fill={HAT} />
      <circle cx="90.4" cy="20.4" r="4.4" fill={HAT} />
      <rect x="78.2" y="23.4" width="15.6" height="4" rx="1.4" fill={HAT} />
      <rect x="78.2" y="25.6" width="15.6" height="1.8" rx="0.9" fill={HAT_SHADE} />
    </>
  )
}

type BoyProps = {
  readonly mood: Mood
  readonly stride: number
  /** ふみこみ(0〜1)。前の足を まえへ、うしろの足を うしろへ ひらく */
  readonly lunge: number
  readonly headTilt: number
  readonly breath: number
}

function Boy({ mood, stride, lunge, headTilt, breath }: BoyProps) {
  const front = stride * 20 + lunge * 26
  const back = -stride * 20 - lunge * 22
  return (
    <>
      {/* むこうの うで: たれて、体の うしろに かくれる */}
      <path d="M86.6 50 L89.6 61 L87.4 71" fill="none" stroke={TUNIC_FAR} strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="87.4" cy="72.4" r="3" fill={SKIN_SHADE} />
      <Layer rotate={back} origin={[87, 69]}>
        <rect x="84.6" y="66" width="6.2" height="26.5" rx="3.1" fill={PANTS_DARK} />
        <ellipse cx="84.4" cy="93.4" rx="5.6" ry="2.8" fill={SHOE} />
      </Layer>
      <Layer rotate={front} origin={[85, 69]}>
        <rect x="82" y="66" width="6.2" height="26.5" rx="3.1" fill={PANTS} />
        <ellipse cx="81.8" cy="93.4" rx="5.6" ry="2.8" fill={SHOE} />
      </Layer>
      <rect x="83.4" y="40" width="5.2" height="8" rx="2.4" fill={SKIN_SHADE} />
      <Layer scaleX={1 + breath * 0.04} scaleY={1 + breath * 0.02} origin={[86, 70]}>
        <rect x="79" y="45" width="14" height="27.5" rx="6.6" fill={TUNIC} />
        <path d="M80.4 66.6 h11.4" stroke={TUNIC_DARK} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="81.8" cy="52.4" r="0.9" fill="#ffffff" />
        <circle cx="81.8" cy="58.4" r="0.9" fill="#ffffff" />
      </Layer>
      <Layer rotate={headTilt} origin={[86, 43]}>
        <Head mood={mood} />
      </Layer>
    </>
  )
}

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

/** てまえの うで(かた → ひじ → 手)と、手に にぎった ほうちょう。手は ほうちょうの上に。 */
function KnifeArm({ shoulder, target, rotate }: { readonly shoulder: Pt; readonly target: Pt; readonly rotate: number }) {
  const { elbow, hand } = solveArm(shoulder, target)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={TUNIC_DARK} strokeWidth="6.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={shoulder[0]} cy={shoulder[1]} r="3.3" fill={TUNIC_DARK} />
      <Knife at={hand} rotate={rotate} />
      <circle cx={hand[0]} cy={hand[1]} r="3.5" fill={SKIN} />
    </>
  )
}

/** おなかが ぐるぐる。体のまえ(左)に ひろがる。 */
function Rumble({ t }: SceneProps) {
  const show = during(t, ARRIVE, THINK + 0.1, 0.2)
  if (show <= 0) return null
  const beat = wave(t, 0.5)
  return (
    <g opacity={show} fill="none" stroke="#c99a55" strokeWidth="1.2" strokeLinecap="round">
      <path d={`M${76.5 - beat} 54 Q${73.5 - beat} 58.4 ${76.5 - beat} 62.8`} />
      <path d={`M${72.6 - beat * 1.4} 51.6 Q${68.2 - beat * 1.4} 58.4 ${72.6 - beat * 1.4} 65.2`} opacity="0.8" />
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

/** かたの うでの 形(かた からの ずれ)と、ほうちょうの むき */
const REST_OFF: Pt = [-5, 17]
const WIND_OFF: Pt = [-17, -22]
const LOW_OFF: Pt = [-18, 7]
const KNIFE_REST = -72
const KNIFE_WIND = 55
const KNIFE_SLASH = -10
const KNIFE_LOW = -28

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  // あるいてくる
  const walkX = mix(t, WALK_IN, ARRIVE, 46, 0, easeOut)
  const walking = 1 - span(t, ARRIVE - 0.2, ARRIVE)
  const stride = t < WALK_IN ? 0 : Math.sin((t - WALK_IN) * Math.PI * 2 * 1.9) * walking
  // ふりあげ → ふみこんで ふりおろす → もどる
  const raise = span(t, RAISE, SLASH, easeInOut)
  const slash = span(t, SLASH, CUT, easeIn)
  const recover = span(t, 5.1, 5.75, easeInOut)
  const lunge = slash * (1 - span(t, 5.4, 6.1, easeInOut))
  const wind = raise * (1 - slash)
  // うれしくて ぴょん
  const joy = t - JOY
  const hop = joy > 0 && joy < 0.6 ? Math.abs(Math.sin((joy * Math.PI) / 0.3)) * 3 : 0
  const lift = hop + Math.abs(stride) * 1.2
  const dx = walkX - 8 * lunge
  const lean = -8 * lunge + 3 * wind
  const mood: Mood = t < THINK ? 'hungry' : t < CUT + 0.05 ? 'ready' : 'happy'
  const breath = t > ARRIVE ? wave(t, 1.6) : 0

  // うで: かた の場所は 体といっしょに うごく。手の場所だけ きめて、ひじは 計算
  const shoulder = toWorld(SHOULDER, dx, lift, lean)
  const pre = add(shoulder, lerpPt(REST_OFF, WIND_OFF, raise))
  const swung = lerpPt(pre, SLASH_HAND, slash)
  const hand = lerpPt(swung, add(shoulder, LOW_OFF), recover)
  const knifeTurn = lerp(lerp(lerp(KNIFE_REST, KNIFE_WIND, raise), KNIFE_SLASH, slash), KNIFE_LOW, recover)
  const headTilt = mood === 'hungry' ? 4 + breath * 1 : mood === 'ready' ? -3 : -2

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Table t={t} />
        <Radish t={t} />
        <Dust t={t} />
        <Layer opacity={span(t, WALK_IN - 0.1, WALK_IN + 0.1)}>
          <ellipse cx={86 + dx} cy="97.4" rx="10" ry="2.4" fill="#000000" opacity="0.12" />
          <Layer x={dx} y={-lift} rotate={lean} origin={FEET}>
            <Boy mood={mood} stride={stride} lunge={lunge} headTilt={headTilt} breath={breath} />
            <Rumble t={t} />
          </Layer>
          <KnifeArm shoulder={shoulder} target={hand} rotate={knifeTurn} />
        </Layer>
        <SlashTrail t={t} />
        <Idea t={t} />
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
