/*
 * 丸(まる): 9 みたいな あそび場で、まるい 玉が ころん。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … 上から 下へ ゆるく まがって おりる すべりだい(ボールが ころがる みち)
 *   2画目(乙)  … ジャングルジムの よこの ぼう と、たてのはしら と、まがった あし
 *                  (女の子は この よこの ぼう に こしかける)
 *   3画目(丶)  … ころころ おちる 玉(ボール)が、すべりだいの なかほどを とおる ところ
 *
 * ながれ
 *   女の子が ぼうに こしかけて、ボールを もって たいくつ
 *   → すべりだいに 気づいて、ボールを すべりだいの てっぺんに もっていく(わくわく)
 *   → えいっ と 手を はなすと、ボールが ころころ ころん と すべりおりる(わけ)
 *   → 女の子は 大よろこび。ボールが なかほどを とおる しゅんかんに、ほね が ひかって 絵が うすくなり、字「丸」になる
 *
 * 女の子は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく どう の上。あし は こし から 下へ たれる。
 *   すべりだい・ジャングルジム・ボールも、ほんものの つくり のまま(字の画の線 の上に 置いている)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Bone, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '丸'

const SUN = '#ffd24a'
const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const RIBBON = '#ffd24a'
const DRESS = '#f58fa0'
const DRESS_DARK = '#e0748a'
const DRESS_FAR = '#c95f78'
const SOCK = '#ffffff'
const SHOE = '#d9534f'
const GYM = '#4f9be0'
const GYM_LIGHT = '#8cc4f2'
const SLIDE = '#f0793a'
const SLIDE_LIGHT = '#ffa36b'
const BALL = '#e8534a'
const BALL_LIGHT = '#ff9d8f'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const HILL = '#e2f2d2'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const POP = 0.5
/** すべりだい に 気づいて、ボールを てっぺんへ もっていく */
const NOTICE = 1.6
/** てっぺんで わくわく まって、えいっ と はなす */
const HOLD = 2.6
const RELEASE = 3.6
const ROLL_TIME = 2.8
const INK = 5.5
const DONE = 8.2
const DURATION = 8.8

type Pt = readonly [number, number]

/** すべりだい(1画目)の とおる点。ボールは この上を ころがる */
const SLIDE_PATH: readonly Pt[] = [
  [44.4, 17.4],
  [45.8, 28.9],
  [45.2, 40.7],
  [43.4, 52.4],
  [40.1, 63.8],
  [34.7, 74.3],
  [27, 83.3],
  [17.4, 90.3],
]
const BALL_R = 4.6
/** すべりだい の てっぺん(ボールを はなす ところ) */
const TOP: Pt = SLIDE_PATH[0]

/** 女の子の こし(ジャングルジムの よこの ぼう の上) */
const HIP: Pt = [56, 33.5]
const SHOULDER_NEAR: Pt = [53.8, 22]
const SHOULDER_FAR: Pt = [58.4, 22]
const ARM_PART = 6.3

const segLen = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1])
const TOTAL_LEN = SLIDE_PATH.slice(1).reduce((sum, p, i) => sum + segLen(SLIDE_PATH[i], p), 0)

/** すべりだい の上で、はじめから 全体の p(0〜1)のところ の場所 */
function slideAt(p: number): Pt {
  let rest = Math.min(Math.max(p, 0), 1) * TOTAL_LEN
  for (let i = 1; i < SLIDE_PATH.length; i += 1) {
    const len = segLen(SLIDE_PATH[i - 1], SLIDE_PATH[i])
    if (rest <= len || i === SLIDE_PATH.length - 1) {
      const k = Math.min(rest / len, 1)
      return [SLIDE_PATH[i - 1][0] + (SLIDE_PATH[i][0] - SLIDE_PATH[i - 1][0]) * k, SLIDE_PATH[i - 1][1] + (SLIDE_PATH[i][1] - SLIDE_PATH[i - 1][1]) * k]
    }
    rest -= len
  }
  return SLIDE_PATH[SLIDE_PATH.length - 1]
}

/** かた と 手 から、ひじ の場所を 出す(ひじ は preferred の ほうへ まがる) */
function elbowFor(shoulder: Pt, hand: Pt, preferred: Pt): Pt {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const dist = Math.max(Math.hypot(dx, dy), 0.001)
  const reach = Math.min(dist, ARM_PART * 2 * 0.999)
  const half = Math.sqrt(ARM_PART ** 2 - (reach / 2) ** 2)
  const ux = dx / dist
  const uy = dy / dist
  const side = -uy * preferred[0] + ux * preferred[1] >= 0 ? 1 : -1
  return [shoulder[0] + (ux * reach) / 2 - uy * half * side, shoulder[1] + (uy * reach) / 2 + ux * half * side]
}

/** うでの 先: かた から とどく はんい に おさめる */
function clampHand(shoulder: Pt, hand: Pt): Pt {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const dist = Math.hypot(dx, dy)
  const max = ARM_PART * 2 * 0.999
  return dist <= max ? hand : [shoulder[0] + (dx / dist) * max, shoulder[1] + (dy / dist) * max]
}

const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[95, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="94.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 95 13)`} />
        ))}
      </Layer>
      <circle cx="95" cy="13" r={6.2 * sun} fill={SUN} />
      {/* とおくの おか と、ゆっくり ながれる 雲(おくゆき を出す) */}
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill={HILL} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="-4" cy="46" rx="7" ry="3.4" />
        <ellipse cx="1" cy="44" rx="5" ry="3.4" />
        <ellipse cx="80" cy="30" rx="6" ry="2.8" />
        <ellipse cx="84.5" cy="28.4" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 28, 76, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** あそび場: すべりだい(1画目)と ジャングルジム(2画目)。下から ぽん と できる */
function Playground({ t }: SceneProps) {
  const gym = span(t, 0.1, 0.65, backOut)
  const slide = span(t, 0.3, 0.8, backOut)
  return (
    <>
      <Layer scaleX={0.6 + 0.4 * gym} scaleY={gym} origin={[64, 92]}>
        <Bone char={CHAR} n={2} color={GYM} width={4.4} />
        <Bone char={CHAR} n={2} color={GYM_LIGHT} width={1.4} />
      </Layer>
      <Layer scale={slide} origin={[44, 50]}>
        <Bone char={CHAR} n={1} color={SLIDE} width={8.2} />
        <Bone char={CHAR} n={1} color={SLIDE_LIGHT} width={2.8} />
      </Layer>
    </>
  )
}

type Mood = 'bored' | 'curious' | 'cheer'

type GirlProps = {
  readonly mood: Mood
  readonly nearHand: Pt
  readonly farHand: Pt
  readonly headTilt: number
  readonly kick: number
}

function Arm({ shoulder, hand, color, preferred }: { readonly shoulder: Pt; readonly hand: Pt; readonly color: string; readonly preferred: Pt }) {
  const reachable = clampHand(shoulder, hand)
  const elbow = elbowFor(shoulder, reachable, preferred)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${reachable[0]} ${reachable[1]}`} fill="none" stroke={color} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={reachable[0]} cy={reachable[1]} r="2.6" fill={SKIN} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="51.8" cy="16.2" r="1.7" fill={CHEEK} opacity="0.55" />
      {mood === 'bored' && (
        <>
          <circle cx="52.9" cy="13.8" r="1" fill={EYE} />
          <path d="M51.2 12.6 l3.2 0.9" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <path d="M51.2 17.6 h2.2" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'curious' && (
        <>
          <circle cx="52.7" cy="13.6" r="1.35" fill={EYE} />
          <circle cx="52.3" cy="13.1" r="0.45" fill="#ffffff" />
          <path d="M51.3 17.2 Q52.6 18.8 54.2 17.4" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'cheer' && (
        <>
          <path d="M51.2 14.4 Q52.8 12.2 54.4 14.4" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M50.9 16.8 Q52.8 20.4 55 16.8 Z" fill={MOUTH} />
        </>
      )}
    </>
  )
}

/** ぼうに こしかけた 女の子。左むき。 */
function Girl({ mood, nearHand, farHand, headTilt, kick }: GirlProps) {
  return (
    <>
      {/* むこうの うで と あし(体の うしろ) */}
      <Arm shoulder={SHOULDER_FAR} hand={farHand} color={DRESS_FAR} preferred={[0.7, 0.7]} />
      <Layer rotate={-kick} origin={[58.5, 33.5]}>
        <rect x="56.6" y="32" width="4.2" height="17" rx="2.1" fill={SKIN_SHADE} />
        <rect x="56.6" y="44" width="4.2" height="4.6" fill={SOCK} />
        <ellipse cx="58" cy="50.2" rx="3.6" ry="2.1" fill={SHOE} />
      </Layer>
      <Layer rotate={kick} origin={[54, 33.5]}>
        <rect x="51.8" y="32" width="4.4" height="17" rx="2.2" fill={SKIN} />
        <rect x="51.8" y="44" width="4.4" height="4.6" fill={SOCK} />
        <ellipse cx="53" cy="50.2" rx="3.6" ry="2.1" fill={SHOE} />
      </Layer>
      {/* くび: どう と あたま の間を みじかく つなぐ */}
      <rect x="54.2" y="16.6" width="3.6" height="6" rx="1.6" fill={SKIN_SHADE} />
      {/* どう(ワンピース) */}
      <path d="M51.4 21 Q51.4 19.2 53.2 19.2 H58.8 Q60.6 19.2 60.6 21 L62.2 31.4 Q62.4 34.4 59.2 34.4 H52.8 Q49.6 34.4 50.2 31.4 Z" fill={DRESS} />
      <path d="M50.4 30.2 L61.8 30.2" stroke={DRESS_DARK} strokeWidth="1.5" strokeLinecap="round" />
      {/* てまえの うで */}
      <Arm shoulder={SHOULDER_NEAR} hand={nearHand} color={DRESS_DARK} preferred={[-0.5, 0.9]} />
      {/* あたま */}
      <Layer rotate={headTilt} origin={[56, 19]}>
        <circle cx="56" cy="13" r="6.2" fill={SKIN} />
        <path d="M49.8 12.6 C49.6 6.6 56 5 60 7.4 C63 9.4 62.8 14 62 17.4 C61 13.6 58 10.6 53.8 10.2 C51.8 10.4 50.4 11.2 49.8 12.6 Z" fill={HAIR} />
        <ellipse cx="63.2" cy="14" rx="2.2" ry="4.2" fill={HAIR} transform="rotate(-12 63.2 14)" />
        <circle cx="61.4" cy="9.8" r="1.5" fill={RIBBON} />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

/** ころがる ボール。かいてんして、白い おび が まわる */
function Ball({ x, y, spin }: { readonly x: number; readonly y: number; readonly spin: number }) {
  return (
    <>
      <Layer x={x} y={y} rotate={spin}>
        <circle r={BALL_R} fill={BALL} />
        <path d="M-4.3 -1.6 Q0 2.4 4.3 -1.6" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      </Layer>
      <circle cx={x - 1.7} cy={y - 1.9} r="1.1" fill={BALL_LIGHT} />
    </>
  )
}

/** わくわく の きらきら(女の子の まわり) */
function Cheer({ t }: SceneProps) {
  const show = during(t, RELEASE + 0.4, INK + 0.4, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      <Star cx={68} cy={10 + wave(t, 0.7) * 1.2} r={2.6} color="#ffd95a" spin={t * 80} />
      <Star cx={44} cy={6 - wave(t, 0.7, 0.3) * 1.2} r={2.1} color="#ff9fb4" spin={-t * 80} />
      <Star cx={72} cy={26} r={1.7} color="#ffffff" spin={t * 60} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 3)

  // 女の子が ぽん と ぼうに あらわれる
  const pop = span(t, POP, POP + 0.4, backOut)
  const girlOpacity = span(t, POP - 0.05, POP + 0.1)

  // きもち: たいくつ → 気づく → えいっ のあとは 大よろこび
  const mood: Mood = t < NOTICE ? 'bored' : t < RELEASE + 0.3 ? 'curious' : 'cheer'

  // ボール: はじめは おなかの前 → てっぺんへ → はなす → ころがる
  const belly: Pt = [49.4, 27.4]
  const carry = span(t, NOTICE, HOLD, easeInOut)
  const wiggle = t >= HOLD && t < RELEASE ? wave(t, 0.3) * 0.35 : 0
  const held = lerpPt(belly, [TOP[0], TOP[1] + wiggle], carry)
  const roll = span(t, RELEASE, RELEASE + ROLL_TIME, (x) => x ** 1.6)
  const rolling = t >= RELEASE
  const ballPos = rolling ? slideAt(roll) : held
  const spin = roll * (TOTAL_LEN / BALL_R) * (180 / Math.PI)

  // うで: ボールを もっている間、手は ボールの 右がわ に そえる。はなしたら ばんざい
  const handOnBall: Pt = [held[0] + 4, held[1] + 1.2]
  const cheerUp = span(t, RELEASE + 0.15, RELEASE + 0.6, easeOut)
  const nearHand = lerpPt(handOnBall, [45.5, 4.5], cheerUp)
  const idleFar: Pt = [59.6, 32]
  const farHand = lerpPt(idleFar, [67, 5], cheerUp)

  // あたま: ボールを 目でおう(はなしたあとは ころがる ボールを 見おろす)
  const headTilt = rolling ? mix(t, RELEASE, RELEASE + 0.8, 0, -8) : mix(t, NOTICE, HOLD, 2, -6)
  // あし: たいくつな間は ゆっくり ぶらぶら。よろこぶと ばたばた
  const kick = (t < RELEASE ? wave(t, 1.6) * 4 : wave(t, 0.45) * 12) * (t < POP ? 0 : 1)
  const hop = rolling ? Math.abs(wave(t, 0.9)) * 1.1 * span(t, RELEASE + 0.3, RELEASE + 0.6) : 0
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Playground t={t} />
        <Layer opacity={girlOpacity} scale={pop} y={-hop} origin={HIP}>
          <Girl mood={mood} nearHand={nearHand} farHand={farHand} headTilt={headTilt} kick={kick} />
        </Layer>
        <Cheer t={t} />
        <Layer opacity={span(t, POP + 0.25, POP + 0.4)}>
          <Ball x={ballPos[0]} y={ballPos[1]} spin={spin} />
        </Layer>
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
    { at: 0, label: 'すべりだい と ジャングルジム が できる', sound: 'pop' },
    { at: POP, label: '女の子が ぼうに こしかけて、ボールを もって たいくつ' },
    { at: NOTICE, label: 'すべりだいに 気づいて、ボールを てっぺんへ もっていく' },
    { at: RELEASE, label: 'えいっ と 手を はなす。ボールが ころころ ころん', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '丸 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
