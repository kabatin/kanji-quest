/*
 * 知(しる): やの ように はやく、口(くち)で こたえる。よく わかっている。
 *
 * ほね(画と絵の対応)
 *   1〜5画目(矢) … 地面の まとに ささった「や」。上から 下へ ななめに のびる ほそ長い やがら(4画目)と、
 *                  その まわりの はね・やじり。(さいごに 字と ぴったり重ならなくても、だいたい 左下へ おちる向き)
 *   6〜8画目(口) … 子どもが「はい!」と 大きく あける 口と、その まわり
 *                  (子どもは 右がわ。あたまと 口の あたりが 口の ばしょ)
 *
 * ながれ
 *   子どもが たっている → やが びゅんと とんできて、地面の まとの まんなかに ささる(子どもは 目で おう)
 *   → 「もんだい」(?)。子どもは うーんと かんがえる(あせ・首を かしげる)
 *   → ぱっと ひらめく → 手を あげて「はい!」と 大きな 口で こたえる
 *   → こたえが、さっきの やの ように まっすぐ とんで まとに あたる。「せいかい!」(? が ○ に かわる)
 *   → 子どもは うれしくて ぴょんぴょん → ほね が ひかって、絵が うすくなり、字「知」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(あげるときも、かた → ひじ → 手)。くび は みじかく、どう の まんなか の上。
 *   やは、まっすぐな やがら・とがった やじり・うしろの はね。とんでいる向き に そって かたむく。
 */
import { backOut, during, easeIn, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '知'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#f0a23c'
const TUNIC_DARK = '#d98a26'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const TONGUE = '#ff8a8a'
const CHEEK = '#ff9d9d'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const ARROW_WOOD = '#c28a54'
const ARROW_STEEL = '#8e9db0'
const FEATHER = '#e8534a'
const FEATHER_DARK = '#c13f38'
const TARGET_RED = '#e8534a'
const TARGET_WHITE = '#fff8ec'
const TARGET_EDGE = '#b7413a'
const VOICE = '#ffb22e'
const BUBBLE_EDGE = '#c9d6e6'

/** くぎり の時間(秒) */
const FLY = 0.9
const LAND = 1.55
const ASK = 2.1
const IDEA = 3.9
const HANDUP = 4.2
const SHOUT = 4.55
const HIT = 5.05
const INK = 6.6
const DONE = 9.8
const DURATION = 10.3

/** 子どもの たつ ばしょ(体の まんなか の x)と、あたま の中心・足もと */
const CX = 78
const HEAD: readonly [number, number] = [78, 35]
const NECK: readonly [number, number] = [78, 45]
const FEET_Y = 93.5
/** かた(うで の つけね) */
const SHOULDER_L: readonly [number, number] = [70.5, 52]
const SHOULDER_R: readonly [number, number] = [85.5, 52]
const UPPER = 9
const FORE = 9

/** まと(地面に ねている まるい まと)の まんなか。やが ささる 場所 */
const TARGET: readonly [number, number] = [17, 93]

/** やが とぶ 通り道(2じ ベジェ): 右上の そとから、まとへ。さいごは 少し かたむいて ささる */
const P0: readonly [number, number] = [112, 2]
const P1: readonly [number, number] = [44, 27.6]
const P2: readonly [number, number] = TARGET
const ARROW_LEN = 40

const bezier = (u: number, a: number, b: number, c: number) => (1 - u) ** 2 * a + 2 * (1 - u) * u * b + u ** 2 * c

/** こたえが とんでいく 向き(口の よこ から まとへ まっすぐ) */
const VOICE_FROM: readonly [number, number] = [63, 45]
const VOICE_DIST = Math.hypot(TARGET[0] - VOICE_FROM[0], TARGET[1] - VOICE_FROM[1])
const VOICE_DIR: readonly [number, number] = [(TARGET[0] - VOICE_FROM[0]) / VOICE_DIST, (TARGET[1] - VOICE_FROM[1]) / VOICE_DIST]

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.5, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 12} origin={[10, 10]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="9.3" y="1.8" width="1.4" height="3.2" rx="0.7" fill={SUN} transform={`rotate(${i * 45} 10 10)`} />
        ))}
      </Layer>
      <circle cx="10" cy="10" r={Math.max(0, 5 * sun)} fill={SUN} />
      {/* とおくの おか と、ゆっくり ながれる 雲 */}
      <path d="M-4 99 Q18 78 44 92 Q72 72 113 94 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.2} 0)`}>
        <ellipse cx="26" cy="22" rx="7" ry="3.2" />
        <ellipse cx="31" cy="20.2" rx="4.6" ry="3.2" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 40, 58, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 地面に ねている まるい まと。ななめ上から 見ているので、たいらな だえん に見える。 */
function Target({ t }: SceneProps) {
  const pop = span(t, 0.1, 0.6, backOut)
  const hit = span(t, HIT, HIT + 0.6)
  // あたったとき、まとが 少し ふくらむ
  const bump = 1 + Math.sin(hit * Math.PI) * 0.07
  const [x, y] = TARGET
  return (
    <Layer scale={pop * bump} origin={[x, y + 1]}>
      <ellipse cx={x} cy={y + 2} rx="14.5" ry="4.6" fill={TARGET_EDGE} />
      <ellipse cx={x} cy={y} rx="14.5" ry="4.4" fill={TARGET_RED} />
      <ellipse cx={x} cy={y} rx="10.8" ry="3.2" fill={TARGET_WHITE} />
      <ellipse cx={x} cy={y} rx="7.2" ry="2.1" fill={TARGET_RED} />
      <ellipse cx={x} cy={y} rx="3.4" ry="1" fill={SUN} />
    </Layer>
  )
}

/** や。さき(やじり)が 原点で、やがら が うしろ(-x)へ のびる。とぶ向き が +x。 */
function Arrow({ t }: SceneProps) {
  const fly = span(t, FLY, LAND, easeIn)
  if (t < FLY) return null
  const x = bezier(fly, P0[0], P1[0], P2[0])
  const y = bezier(fly, P0[1], P1[1], P2[1])
  // とぶ向き = 通り道の せんの 向き
  const dx = 2 * (1 - fly) * (P1[0] - P0[0]) + 2 * fly * (P2[0] - P1[0])
  const dy = 2 * (1 - fly) * (P1[1] - P0[1]) + 2 * fly * (P2[1] - P1[1])
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI
  // ささった あと、やがらが ぷるぷる ふるえる
  const since = Math.max(0, t - LAND)
  const quiver = Math.sin(since * 42) * 7 * Math.max(0, 1 - since / 0.55)
  return (
    <>
      {/* とんでいる間の すじ(うしろへ のびる) */}
      <Layer opacity={during(t, FLY, LAND + 0.05, 0.1) * 0.7}>
        <g transform={`translate(${x} ${y}) rotate(${angle})`} stroke="#9ec9ee" strokeWidth="1" strokeLinecap="round">
          <path d={`M${-ARROW_LEN - 4} -3 h-12 M${-ARROW_LEN - 6} 3 h-16`} fill="none" />
        </g>
      </Layer>
      <g transform={`translate(${x} ${y}) rotate(${angle + quiver})`}>
        <path d={`M${-ARROW_LEN} 0 H-5`} stroke={ARROW_WOOD} strokeWidth="1.9" strokeLinecap="round" fill="none" />
        <path d="M0 0 L-7.4 -3.1 L-5.6 0 L-7.4 3.1 Z" fill={ARROW_STEEL} />
        {/* うしろの はね: 上と 下に 1まいずつ */}
        <path d={`M${-ARROW_LEN} 0 L${-ARROW_LEN - 3.4} -4.6 L${-ARROW_LEN + 6} -4.6 L${-ARROW_LEN + 9.4} 0 Z`} fill={FEATHER} />
        <path d={`M${-ARROW_LEN} 0 L${-ARROW_LEN - 3.4} 4.6 L${-ARROW_LEN + 6} 4.6 L${-ARROW_LEN + 9.4} 0 Z`} fill={FEATHER_DARK} />
      </g>
    </>
  )
}

type Mood = 'watch' | 'think' | 'idea' | 'shout' | 'joy'

/** かた から出て、ひじ で まがる うで。side: 左の うで -1 / 右の うで +1。raise: 0 = ま下に たれる / 1 = 上に あげる */
function Arm({ side, shoulder, raise, wiggle = 0 }: { readonly side: -1 | 1; readonly shoulder: readonly [number, number]; readonly raise: number; readonly wiggle?: number }) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  // ま下を 0 度として、外へ ひらく角度。あげると、ひじ は 外へ、手 は 上へ むく
  const upper = side * (7 + 93 * raise)
  const fore = side * (3 + 172 * raise + wiggle)
  const elbow = [shoulder[0] + Math.sin(rad(upper)) * UPPER, shoulder[1] + Math.cos(rad(upper)) * UPPER] as const
  const hand = [elbow[0] + Math.sin(rad(fore)) * FORE, elbow[1] + Math.cos(rad(fore)) * FORE] as const
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={side === 1 ? TUNIC_DARK : TUNIC} strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.3" fill={SKIN} />
    </>
  )
}

type FaceProps = { readonly mood: Mood; readonly look: number; readonly blink: number }

/** 顔。気持ちで 目・まゆ・口を かえる。 */
function Face({ mood, look, blink }: FaceProps) {
  const eyeY = 34
  const lx = 74.2 + look
  const rx = 81.8 + look
  const closed = blink > 0.5
  const eyes =
    mood === 'joy' ? (
      <>
        <path d="M71.8 34.8 Q74 32 76.2 34.8" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
        <path d="M79.8 34.8 Q82 32 84.2 34.8" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
      </>
    ) : closed ? (
      <>
        <path d={`M${lx - 1.6} ${eyeY} h3.2`} stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
        <path d={`M${rx - 1.6} ${eyeY} h3.2`} stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
      </>
    ) : (
      <>
        <circle cx={lx} cy={eyeY} r={mood === 'idea' || mood === 'shout' ? 1.7 : 1.35} fill={EYE} />
        <circle cx={rx} cy={eyeY} r={mood === 'idea' || mood === 'shout' ? 1.7 : 1.35} fill={EYE} />
      </>
    )
  return (
    <>
      <circle cx="71.4" cy="38.6" r="2" fill={CHEEK} opacity="0.55" />
      <circle cx="84.6" cy="38.6" r="2" fill={CHEEK} opacity="0.55" />
      {eyes}
      {mood === 'think' && (
        <>
          <path d="M71.6 30.4 l4.4 -1.2" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M80 29.2 l4.4 1.2" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M75.4 41.4 Q77 40 78.6 41.4 Q80 42.6 81.6 41.2" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'watch' && <ellipse cx={CX + look * 0.5} cy="41.2" rx="1.2" ry="1.4" fill={MOUTH} />}
      {mood === 'idea' && <ellipse cx={CX} cy="41.4" rx="1.6" ry="2" fill={MOUTH} />}
      {/* 「はい!」: 大きく あけた 口。まるい 四角 */}
      {mood === 'shout' && (
        <>
          <rect x="74" y="38.2" width="8" height="6.4" rx="2.6" fill={MOUTH} />
          <ellipse cx={CX} cy="43.4" rx="2.6" ry="1.2" fill={TONGUE} />
        </>
      )}
      {mood === 'joy' && (
        <>
          <path d="M74 39.2 Q78 46 82 39.2 Z" fill={MOUTH} />
          <path d="M75.6 42 Q78 43.6 80.4 42 Q78 44.8 75.6 42 Z" fill={TONGUE} />
        </>
      )}
    </>
  )
}

type ChildProps = {
  readonly mood: Mood
  readonly look: number
  readonly blink: number
  readonly headTilt: number
  readonly leftRaise: number
  readonly rightRaise: number
  readonly wiggle: number
}

/** 子ども(正面)。あたま は くび の上、うで は かた から。 */
function Child({ mood, look, blink, headTilt, leftRaise, rightRaise, wiggle }: ChildProps) {
  return (
    <>
      {/* あし */}
      <rect x="72.4" y="74" width="5.2" height="17.5" rx="2.6" fill={PANTS_DARK} />
      <rect x="78.4" y="74" width="5.2" height="17.5" rx="2.6" fill={PANTS} />
      <ellipse cx="74.6" cy={FEET_Y - 0.4} rx="4.6" ry="2.4" fill={SHOE} />
      <ellipse cx="81.8" cy={FEET_Y - 0.4} rx="4.6" ry="2.4" fill={SHOE} />
      {/* くび: みじかく、どう と あたま の間 */}
      <rect x="75.6" y="42" width="4.8" height="8" rx="2.2" fill={SKIN_SHADE} />
      {/* どう */}
      <rect x="69" y="47" width="18" height="29" rx="7" fill={TUNIC} />
      <path d="M71 66 h14" stroke={TUNIC_DARK} strokeWidth="1.5" strokeLinecap="round" />
      <Arm side={-1} shoulder={SHOULDER_L} raise={leftRaise} wiggle={-wiggle} />
      <Arm side={1} shoulder={SHOULDER_R} raise={rightRaise} wiggle={wiggle} />
      {/* あたま */}
      <Layer rotate={headTilt} origin={NECK}>
        <circle cx={HEAD[0]} cy={HEAD[1]} r="10.4" fill={SKIN} />
        <path d="M67.6 34 C66.6 22.6 78 20 85 23 C90 25.4 90.2 31 88.6 35 C87.8 30.4 83.6 27.6 78 28 C73 28.4 69.4 30.4 67.6 34 Z" fill={HAIR} />
        <path d="M76.4 24.4 Q77 20.6 79 22.4 Q80.6 19.8 81.6 23.4" fill="none" stroke={HAIR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <Face mood={mood} look={look} blink={blink} />
      </Layer>
    </>
  )
}

/** かんがえている間の あせ。あたま の よこ から ひとつぶ おちる */
function SweatDrop({ t }: SceneProps) {
  const show = during(t, ASK + 0.5, IDEA, 0.2)
  if (show <= 0) return null
  const p = ((t - ASK) % 0.8) / 0.8
  return <path d="M0 -2.6 Q2.2 0.6 0 2.2 Q-2.2 0.6 0 -2.6 Z" fill="#7cc4f2" opacity={show * (1 - p * 0.6)} transform={`translate(${91 + p * 1.5} ${28 + p * 9})`} />
}

/** 「もんだい」の ふきだし。? が、せいかい で ○ に かわる。 */
function Question({ t }: SceneProps) {
  const pop = span(t, ASK, ASK + 0.4, backOut)
  if (pop <= 0) return null
  const mark = 1 - span(t, HIT, HIT + 0.2)
  const circle = span(t, HIT + 0.05, HIT + 0.45, backOut)
  const bob = wave(t, 1.6) * 0.5
  return (
    <Layer scale={pop} origin={[62, 22]} y={bob}>
      <circle cx="68.4" cy="23.6" r="1.1" fill="#ffffff" stroke={BUBBLE_EDGE} strokeWidth="0.6" />
      <circle cx="65.6" cy="21" r="1.7" fill="#ffffff" stroke={BUBBLE_EDGE} strokeWidth="0.6" />
      <ellipse cx="57" cy="12.5" rx="11.5" ry="8.6" fill="#ffffff" stroke={BUBBLE_EDGE} strokeWidth="0.8" />
      <g opacity={mark}>
        <path d="M53.4 9.8 Q53.4 5.8 57 5.8 Q60.6 5.8 60.6 9.2 Q60.6 11.6 57.8 13.2 Q57 13.8 57 15.6" fill="none" stroke="#5f7fd6" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="57" cy="19.2" r="1.2" fill="#5f7fd6" />
      </g>
      <Layer opacity={circle} scale={Math.max(0.01, circle)} origin={[57, 12.5]}>
        <circle cx="57" cy="12.5" r="5.4" fill="none" stroke={TARGET_RED} strokeWidth="2" />
      </Layer>
    </Layer>
  )
}

/** ひらめきの ぱっ。あたまの上で ほしが はじける */
function IdeaBurst({ t }: SceneProps) {
  const show = during(t, IDEA, HANDUP + 0.25, 0.1)
  if (show <= 0) return null
  const p = span(t, IDEA, IDEA + 0.35, backOut)
  return (
    <g opacity={show}>
      <Star cx={80} cy={13} r={5.2 * p} color={SUN} spin={p * 40} />
      {[-50, 0, 50].map((deg) => (
        <path key={deg} d="M0 -9.5 v-3.4" stroke="#ffb22e" strokeWidth="1.3" strokeLinecap="round" transform={`translate(80 13) rotate(${deg}) scale(${p})`} />
      ))}
    </g>
  )
}

/** 「はい!」の こたえ。口から まとへ、やの ように まっすぐ とぶ 3本の すじ。 */
function Voice({ t }: SceneProps) {
  const p = span(t, SHOUT + 0.05, HIT, easeIn)
  if (p <= 0 || p >= 1) return null
  const [dx, dy] = VOICE_DIR
  const hx = VOICE_FROM[0] + dx * VOICE_DIST * p
  const hy = VOICE_FROM[1] + dy * VOICE_DIST * p
  // すじの よこ むき(とぶ向きに 直角)
  const nx = -dy
  const ny = dx
  return (
    <g strokeLinecap="round" strokeWidth="1.7" stroke={VOICE}>
      {[
        [-3, 11],
        [0, 15],
        [3, 11],
      ].map(([off, len]) => (
        <path key={off} d={`M${hx + nx * off} ${hy + ny * off} l${-dx * len} ${-dy * len}`} />
      ))}
    </g>
  )
}

/** あたった しゅんかん の せいかい のわ と ほし。 */
function HitFlash({ t }: SceneProps) {
  const p = span(t, HIT, HIT + 0.7, easeOut)
  if (p <= 0 || p >= 1) return null
  const rx = 6 + 16 * p
  return (
    <g opacity={1 - p}>
      <ellipse cx={TARGET[0]} cy={TARGET[1]} rx={rx} ry={rx * 0.3} fill="none" stroke={SUN} strokeWidth="1.6" />
      <Star cx={TARGET[0] - 8} cy={TARGET[1] - 16 - p * 6} r={4.2 * (1 - p * 0.4)} color={SUN} spin={p * 120} />
      <Star cx={TARGET[0] + 9} cy={TARGET[1] - 11 - p * 5} r={3 * (1 - p * 0.4)} color="#ff7a4d" spin={-p * 100} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)

  const mood: Mood = t < ASK ? 'watch' : t < IDEA ? 'think' : t < SHOUT ? 'idea' : t < HIT ? 'shout' : 'joy'

  // 目で やを おう → うえ(ふきだし)を見る → まえ → まとを 見る
  const follow = span(t, FLY, LAND, easeOut)
  const look =
    t < FLY ? 0 : t < ASK ? -1.2 * follow : t < IDEA ? -0.4 + Math.sin((t - ASK) * 2.2) * 0.5 : t < SHOUT ? 0 : -0.8
  const blink = (t * 1.0) % 2.6 < 0.12 ? 1 : 0

  // あたまの かたむき: かんがえるとき 首を かしげる
  const think = during(t, ASK + 0.2, IDEA, 0.3)
  const joyBeat = Math.max(0, t - HIT)
  const headTilt = -7 * think + wave(t, 1.8) * 1.5 * think + Math.sin(joyBeat * 8) * 3 * (t >= HIT ? 1 : 0)

  // うで: 右手を あげて こたえる。せいかい で りょうて を あげて よろこぶ
  const handUp = span(t, HANDUP, HANDUP + 0.35, backOut)
  const cheer = span(t, HIT, HIT + 0.3, backOut)
  const rightRaise = Math.min(1, Math.max(handUp, cheer))
  const leftRaise = cheer
  const wiggle = t >= HIT + 0.3 && t < INK ? Math.sin((t - HIT) * 12) * 14 : 0

  // ぴょんぴょん(2かい はねる)
  const hopT = t - (HIT + 0.2)
  const hop = hopT > 0 && hopT < 1.4 ? Math.abs(Math.sin(hopT * Math.PI * 1.43)) * 6 : 0

  // 子どもが あらわれる(足もとから ぽん)
  const enter = span(t, 0.2, 0.8, backOut)
  // 「はい!」の 前に 体を ぐっと のばす
  const stretch = 1 + Math.sin(span(t, HANDUP - 0.1, SHOUT) * Math.PI) * 0.03

  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Target t={t} />
        <ellipse cx={CX} cy="97.2" rx={Math.max(0, 11 * enter - hop * 0.6)} ry="2.4" fill="#000000" opacity="0.12" />
        <Layer scale={enter} origin={[CX, FEET_Y]}>
          <Layer y={-hop} scaleY={stretch} origin={[CX, FEET_Y]}>
            <Child mood={mood} look={look} blink={blink} headTilt={headTilt} leftRaise={leftRaise} rightRaise={rightRaise} wiggle={wiggle} />
          </Layer>
        </Layer>
        <SweatDrop t={t} />
        <IdeaBurst t={t} />
        <Question t={t} />
        <Arrow t={t} />
        <Voice t={t} />
        <HitFlash t={t} />
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
    { at: 0, label: '子どもが あらわれる。地面に まと', sound: 'pop' },
    { at: FLY, label: 'やが びゅんと とんで、まとに ささる' },
    { at: ASK, label: '「もんだい」。子どもは うーんと かんがえる', sound: 'pop' },
    { at: IDEA, label: 'ぱっと ひらめく' },
    { at: SHOUT, label: '手を あげて「はい!」と 大きな 口で こたえる', sound: 'pop' },
    { at: HIT, label: 'こたえが やの ように とんで せいかい', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '知 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
