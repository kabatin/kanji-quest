/*
 * 午(ご): もちを つく きねの かたち。お昼の あいず。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … おまつりの 笹竹(ななめに たてかけた 竹)の うえの ほう
 *   2画目(一)  … 竹から わたした なわ と、ぶらさがる ちょうちん
 *   3画目(一)  … 子どもが きねの 持つところ(まきぬの)を にぎる 2本の うで
 *   4画目(丨)  … きね の えの(たかい ぼう)。したは うす の中
 *
 * ながれ
 *   お日さまが のぼる → おなかが ぺこぺこの子が うすの まえに あるいてくる
 *   → きねを もちあげて ドン!(うさぎが もちを ひっくりかえす)× 3かい
 *   → もちが まるく しろく なって、お日さまは まうえ(お昼)。子も うさぎも にっこり
 *   → きね が まっすぐ たち、ほね が ひかって、絵が うすくなり、字「午」が のこる
 *
 * 人と うさぎは、ほんものの つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(ひじ は 2つの ほね の長さから 計算)。くび は みじかい。
 *   きね は まっすぐ もちあげて、まっすぐ おろす。うさぎは 長い 耳と ふわふわの しっぽ。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '午'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const HAPPI = '#e8634a'
const HAPPI_DARK = '#c94d38'
const HAPPI_FAR = '#a83f30'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const BARK_LIGHT = '#a8714b'
const WOOD_INSIDE = '#4a2f20'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const BAMBOO = '#6dac5a'
const BAMBOO_DARK = '#4c8f52'
const LANTERN = '#e8534a'
const LANTERN_DARK = '#b83d36'
const MOCHI = '#ffffff'
const MOCHI_RICE = '#f3e8c6'
const MOCHI_SHADE = '#e3e8f2'
const RABBIT = '#fdfdff'
const RABBIT_SHADE = '#e0e4f0'
const PINK = '#ff9db0'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'

/** くぎり の時間(秒) */
const ARRIVE = 1.1
/** きねを にぎりはじめる */
const GRAB = 1.5
/** きねが うすの もちを つく しゅんかん */
const HITS: readonly number[] = [2.9, 4.1, 5.3]
const INK = 6.1
const DONE = 8.7
const DURATION = 9.4

/** きね と うす の じく(きねの ぼう の まんなか = 4画目の x) */
const POLE_X = 54.7
/** もちあげたとき、きねが 上がる 高さ */
const LIFT = 14
/** うすの ふち の高さ */
const RIM_Y = 85
/** きねの 持つところ(2本の うで が にぎる 高さ) */
const GRIP_Y = 52

type Point = readonly [number, number]

/**
 * 2つの ほね(かた→ひじ→手)の ひじ を 計算する。ほねの長さは 変わらない。
 * back = ひじ が うしろ(左)へ まがる とき(たれた うで)/ そうでなければ 下へ まがる
 */
function elbowOf(shoulder: Point, hand: Point, part: number, back: boolean): Point {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const dist = Math.min(Math.hypot(dx, dy), part * 2 - 0.01)
  const h = Math.sqrt(Math.max(part * part - (dist / 2) ** 2, 0))
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const candidates: readonly Point[] = [
    [-uy, ux],
    [uy, -ux],
  ]
  const score = ([px, py]: Point) => py - (back ? px * 2 : 0)
  const [px, py] = score(candidates[0]) >= score(candidates[1]) ? candidates[0] : candidates[1]
  return [shoulder[0] + (ux * dist) / 2 + px * h, shoulder[1] + (uy * dist) / 2 + py * h]
}

/** きねの 上下。0 = うすの中 / マイナス = もちあげた(その分 上へ) */
function pestleLift(t: number): number {
  // さいしょは ぼうが 上から ストンと たつ
  const settle = (1 - span(t, 0.15, 0.75, easeOut)) * -40
  const pound = HITS.reduce((sum, hit) => {
    if (t < hit - 0.95 || t > hit) return sum
    const up = span(t, hit - 0.95, hit - 0.4, easeOut)
    const down = span(t, hit - 0.4, hit, easeIn)
    return sum - LIFT * up * (1 - down)
  }, 0)
  return settle + pound
}

/** 1つ前の つきから の ちぢみ(つぶれた もちが もどる)。 */
function squashOf(t: number): number {
  return HITS.reduce((sum, hit) => (t < hit ? sum : sum + (1 - span(t, hit, hit + 0.4)) ** 2), 0)
}

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  const sx = mix(t, 0.3, 5.6, 12, 72, easeInOut)
  const sy = mix(t, 0.3, 5.6, 38, 9, easeInOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[sx, sy]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={sx - 0.8} y={sy - 11.4} width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} ${sx} ${sy})`} />
        ))}
      </Layer>
      <circle cx={sx} cy={sy} r={6.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 94 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="2" cy="52" rx="6" ry="2.8" />
        <ellipse cx="6.4" cy="50.4" rx="4.2" ry="2.8" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 22, 82, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** うしろの 小さな 木。なわの 右はし を むすぶ。 */
function FarTree({ t }: SceneProps) {
  const sway = wave(t, 3.6) * 1.1
  const grow = span(t, 0, 0.6, backOut)
  return (
    <Layer scale={grow} origin={[94, 97]}>
      <rect x="92" y="26" width="4.2" height="72" rx="1.8" fill={BARK_DARK} />
      <Layer rotate={sway} origin={[94, 30]}>
        <circle cx="94" cy="22" r="8.6" fill={LEAF_DARK} />
        <circle cx="99.5" cy="26.5" r="6" fill={LEAF_DARK} />
        <circle cx="91" cy="21" r="6.6" fill={LEAF} />
        <circle cx="96.5" cy="19" r="4.4" fill={LEAF} />
      </Layer>
    </Layer>
  )
}

/** おまつりの 笹竹: 1画目の すじ。左下の わく の外から ななめに たてかけてある。 */
function BambooPole({ t }: SceneProps) {
  const grow = span(t, 0.05, 0.6, backOut)
  const sway = wave(t, 3.2) * 2.2
  return (
    <Layer scale={grow} origin={[0, 70]}>
      <path d="M17.5 39 L-3 60.5" fill="none" stroke={BAMBOO} strokeWidth="3.6" strokeLinecap="round" />
      <Bone char={CHAR} n={1} color={BAMBOO} width={3.6} />
      {/* ふし */}
      <path d="M26.4 28.2 l-2.6 -1.6 M20.4 36 l-2.8 -1.6 M12 45 l-2.8 -1.6 M5 52.4 l-2.8 -1.6" stroke={BAMBOO_DARK} strokeWidth="1" strokeLinecap="round" />
      {/* 竹の先の 葉(風で ゆれる) */}
      <Layer rotate={sway} origin={[37.5, 9.1]}>
        <path d="M37.5 9.2 Q45 6 52 9.4 Q44 11 37.5 9.2 Z" fill={LEAF} />
        <path d="M37.5 9.2 Q32 2.6 24 3.6 Q30 8 37.5 9.2 Z" fill={LEAF_DARK} />
        <path d="M37.5 9.2 Q43 1.6 48.6 0.8 Q44 6.4 37.5 9.2 Z" fill={LEAF} />
      </Layer>
    </Layer>
  )
}

/** 竹から 木へ わたした なわ と、ぶらさがる ちょうちん: 2画目。 */
function LanternRope({ t }: SceneProps) {
  const show = span(t, 0.3, 0.9, easeOut)
  if (show <= 0) return null
  const ropeY = (x: number) => 27.4 - (x - 30) * 0.1
  return (
    <Layer opacity={show}>
      <path d="M26 27.8 Q55 27.4 93 21.4" fill="none" stroke="#a98a6a" strokeWidth="1.1" strokeLinecap="round" />
      {[37, 46, 64, 73].map((x, i) => {
        const y = ropeY(x) + 0.2
        return (
          <Layer key={x} rotate={wave(t, 2.4, i * 0.5) * 5} origin={[x, y]}>
            <path d={`M${x} ${y} v2.2`} stroke="#a98a6a" strokeWidth="0.8" />
            <ellipse cx={x} cy={y + 6} rx="3.4" ry="4" fill={LANTERN} />
            <path d={`M${x - 1.6} ${y + 2.5} Q${x - 3.6} ${y + 6} ${x - 1.6} ${y + 9.5}`} fill="none" stroke={LANTERN_DARK} strokeWidth="0.9" />
            <rect x={x - 2} y={y + 1.8} width="4" height="1.1" rx="0.5" fill={HAIR} />
            <rect x={x - 2} y={y + 9.1} width="4" height="1.1" rx="0.5" fill={HAIR} />
          </Layer>
        )
      })}
    </Layer>
  )
}

/** うす: きの 木ぐち(まるい 木のどうぐ)。うしろの ふち と 中。 */
function MortarBack() {
  return (
    <>
      <ellipse cx={POLE_X} cy={RIM_Y} rx="16" ry="4.6" fill={BARK_LIGHT} />
      <ellipse cx={POLE_X} cy={RIM_Y + 0.2} rx="13.6" ry="3.4" fill={WOOD_INSIDE} />
    </>
  )
}

function MortarFront() {
  return (
    <>
      <path d={`M${POLE_X - 16} ${RIM_Y} Q${POLE_X} ${RIM_Y + 6} ${POLE_X + 16} ${RIM_Y} L${POLE_X + 17} ${RIM_Y + 9} Q${POLE_X + 17.4} 98.6 ${POLE_X + 13} 98.6 L${POLE_X - 13} 98.6 Q${POLE_X - 17.4} 98.6 ${POLE_X - 17} ${RIM_Y + 9} Z`} fill={BARK} />
      <path d={`M${POLE_X - 15.6} ${RIM_Y + 6.4} Q${POLE_X} ${RIM_Y + 11.4} ${POLE_X + 15.6} ${RIM_Y + 6.4}`} fill="none" stroke={BARK_DARK} strokeWidth="1.3" strokeLinecap="round" />
      <path d={`M${POLE_X - 12} ${RIM_Y + 8} q-0.4 3 0.2 5`} fill="none" stroke={BARK_LIGHT} strokeWidth="1.2" strokeLinecap="round" />
    </>
  )
}

/** もち: さいしょは ごはんつぶの かたまり、つくたびに まるく しろく なる。つくと ぺたんと つぶれる。 */
function Mochi({ t, squash }: SceneProps & { readonly squash: number }) {
  const made = span(t, HITS[0], HITS[HITS.length - 1] + 0.3)
  const pop = span(t, 0.3, 0.8, backOut)
  const body = made > 0.5 ? MOCHI : MOCHI_RICE
  return (
    <Layer scaleX={(1 + 0.14 * squash) * (0.9 + 0.1 * made) * pop} scaleY={(1 - 0.34 * squash) * (0.8 + 0.3 * made) * pop} origin={[POLE_X, RIM_Y + 1]}>
      <path d={`M${POLE_X - 12.4} ${RIM_Y + 0.4} Q${POLE_X - 13} ${RIM_Y - 7.6} ${POLE_X} ${RIM_Y - 8.2} Q${POLE_X + 13} ${RIM_Y - 7.6} ${POLE_X + 12.4} ${RIM_Y + 0.4} Q${POLE_X} ${RIM_Y + 3.4} ${POLE_X - 12.4} ${RIM_Y + 0.4} Z`} fill={body} />
      <path d={`M${POLE_X - 12} ${RIM_Y + 0.4} Q${POLE_X} ${RIM_Y + 3} ${POLE_X + 12} ${RIM_Y + 0.4} Q${POLE_X} ${RIM_Y + 1.4} ${POLE_X - 12} ${RIM_Y + 0.4} Z`} fill={MOCHI_SHADE} />
      <ellipse cx={POLE_X - 4.4} cy={RIM_Y - 5} rx="3.4" ry="1.3" fill="#ffffff" opacity="0.8" />
      {made < 0.5 &&
        [-6, -1, 5, 8].map((dx, i) => <circle key={dx} cx={POLE_X + dx} cy={RIM_Y - 2.4 - (i % 2) * 2.6} r="0.8" fill="#d9c99a" />)}
    </Layer>
  )
}

/** きね: 4画目の ぼう。太い あたま と、まきぬの(にぎるところ)つき。 */
function Pestle({ lift }: { readonly lift: number }) {
  return (
    <Layer y={lift}>
      <Bone char={CHAR} n={4} color={BARK} width={4.8} to={0.87} />
      <circle cx="53.5" cy="27.4" r="3.2" fill={BARK_LIGHT} />
      <rect x={POLE_X - 4.9} y="66" width="9.8" height="24" rx="3.4" fill={BARK_LIGHT} />
      <rect x={POLE_X - 4.9} y="66" width="4.2" height="24" rx="2" fill={BARK} opacity="0.55" />
      {/* まきぬの: すべらないように 赤い ぬのを まく */}
      <rect x={POLE_X - 3.8} y={GRIP_Y - 5} width="7.6" height="10.4" rx="1.6" fill={LANTERN} />
      <path d={`M${POLE_X - 3.8} ${GRIP_Y - 1.4} h7.6 M${POLE_X - 3.8} ${GRIP_Y + 2} h7.6`} stroke={LANTERN_DARK} strokeWidth="0.9" />
    </Layer>
  )
}

type Mood = 'hungry' | 'working' | 'happy'

type ChildProps = {
  readonly mood: Mood
  readonly stride: number
  readonly lift: number
  readonly grab: number
  readonly t: number
}

const SHOULDER_NEAR: Point = [34, 42]
const SHOULDER_FAR: Point = [28, 42]
const ARM_PART = 15

/** 子ども: 右むき。うで は かた → ひじ → 手 と つながる。 */
function Child({ mood, stride, lift, grab, t }: ChildProps) {
  const hangNear: Point = [36.5 + stride * 5, 69]
  const hangFar: Point = [27.5 - stride * 5, 69]
  const gripNear: Point = [POLE_X - 0.4, GRIP_Y + lift - 1.4]
  const gripFar: Point = [POLE_X - 0.8, GRIP_Y + lift + 2.2]
  const lerp = (a: Point, b: Point): Point => [a[0] + (b[0] - a[0]) * grab, a[1] + (b[1] - a[1]) * grab]
  const nearHand = lerp(hangNear, gripNear)
  const farHand = lerp(hangFar, gripFar)
  const nearElbow = elbowOf(SHOULDER_NEAR, nearHand, ARM_PART, grab < 0.5)
  const farElbow = elbowOf(SHOULDER_FAR, farHand, ARM_PART, grab < 0.5)
  const arm = (shoulder: Point, elbow: Point, hand: Point, color: string) => (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="5.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.3" fill={SKIN} />
    </>
  )
  const tilt = mood === 'happy' ? wave(t, 0.9) * 2 : mood === 'hungry' ? 4 : 0
  return (
    <>
      {/* むこうの うで: どう の うしろ */}
      {arm(SHOULDER_FAR, farElbow, farHand, HAPPI_FAR)}
      {/* あし(あるくとき かわりばんこ) */}
      <Layer rotate={stride * 18} origin={[31, 68]}>
        <rect x="28.4" y="66" width="6.2" height="26.6" rx="3.1" fill={PANTS_DARK} />
        <ellipse cx="32.4" cy="93.6" rx="5.6" ry="2.8" fill={SHOE} />
      </Layer>
      <Layer rotate={-stride * 18} origin={[27, 68]}>
        <rect x="24" y="66" width="6.2" height="26.6" rx="3.1" fill={PANTS} />
        <ellipse cx="28" cy="93.6" rx="5.6" ry="2.8" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう の まんなか の上 */}
      <rect x="28" y="32" width="5.2" height="8" rx="2.4" fill={SKIN_SHADE} />
      {/* どう: はっぴ */}
      <rect x="22.8" y="36.6" width="14.4" height="33.6" rx="6.8" fill={HAPPI} />
      <path d="M24.4 62.5 h11" stroke={HAPPI_DARK} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M30 37.6 v24" stroke={HAPPI_DARK} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      {/* てまえの うで */}
      {arm(SHOULDER_NEAR, nearElbow, nearHand, HAPPI_DARK)}
      <Layer rotate={tilt} origin={[30.6, 35]}>
        <ChildHead mood={mood} />
      </Layer>
    </>
  )
}

function ChildHead({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="31" cy="26" r="9.2" fill={SKIN} />
      <path d="M21.8 25.5 C21.2 15.6 31.5 12.4 38.6 18.4 C35 17.6 29.8 18.8 27.6 22.4 C26 25 25.6 28 25.8 31 C23.6 30.4 22 28.4 21.8 25.5 Z" fill={HAIR} />
      {/* はちまき */}
      <path d="M22.2 21.4 Q31 16 39.6 21.2" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M22.4 21.6 l-3.6 1.8 M22.4 21.6 l-3.2 -1.6" stroke="#ffffff" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="35.2" cy="29.8" r="2" fill="#ff9d9d" opacity="0.55" />
      {mood === 'hungry' && (
        <>
          <path d="M32.6 23.2 L36.2 24.2" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="34.6" cy="26.4" r="1.15" fill={EYE} />
          <ellipse cx="36.2" cy="30.8" rx="1.1" ry="1.5" fill={MOUTH} />
        </>
      )}
      {mood === 'working' && (
        <>
          <path d="M32.8 23.4 h3.8" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="34.8" cy="26" r="1.15" fill={EYE} />
          <path d="M34.6 30.4 Q36.4 32 38 30.2" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M33.2 26.8 Q34.8 24.4 36.4 26.8" fill="none" stroke={EYE} strokeWidth="1.25" strokeLinecap="round" />
          <path d="M34.4 29.4 Q36.4 33.6 38.4 29.6 Z" fill={MOUTH} />
        </>
      )}
    </>
  )
}

type RabbitProps = { readonly hand: Point; readonly happy: boolean; readonly ear: number }

/** うさぎ: ひだり(うす)を むいて すわる。てまえの うで で もちを ひっくりかえす。 */
function Rabbit({ hand, happy, ear }: RabbitProps) {
  const shoulder: Point = [78, 83]
  const elbow = elbowOf(shoulder, hand, 8.6, false)
  return (
    <>
      <circle cx="92.8" cy="92.4" r="3.3" fill={RABBIT} />
      <ellipse cx="84.6" cy="88.6" rx="8.8" ry="9.8" fill={RABBIT} />
      <path d="M80.4 96 Q86 98.6 92 94 Q91 98.6 86 98.6 Z" fill={RABBIT_SHADE} />
      <ellipse cx="79.2" cy="98" rx="5.4" ry="2.3" fill={RABBIT} />
      <ellipse cx="88.4" cy="98" rx="4.8" ry="2.2" fill={RABBIT_SHADE} />
      {/* みみ: あたま から 長くのびる */}
      <Layer rotate={ear} origin={[79.6, 68]}>
        <ellipse cx="78.4" cy="58.4" rx="2.7" ry="8.8" fill={RABBIT} transform="rotate(-6 78.4 58.4)" />
        <ellipse cx="78.4" cy="58.8" rx="1.2" ry="6" fill={PINK} transform="rotate(-6 78.4 58.8)" />
      </Layer>
      <Layer rotate={-ear * 0.6} origin={[83.8, 68]}>
        <ellipse cx="84.6" cy="59" rx="2.7" ry="8.4" fill={RABBIT_SHADE} transform="rotate(7 84.6 59)" />
      </Layer>
      <circle cx="81" cy="75" r="7.2" fill={RABBIT} />
      <circle cx="77.4" cy="78.4" r="1.9" fill={PINK} opacity="0.6" />
      <circle cx="73.9" cy="75.6" r="1" fill={PINK} />
      {happy ? (
        <path d="M76 74.8 Q77.4 72.8 78.8 74.8" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
      ) : (
        <circle cx="77.4" cy="73.8" r="1" fill={EYE} />
      )}
      <path d="M74.2 77.2 Q75.4 78.8 77 77.8" fill="none" stroke={MOUTH} strokeWidth="0.9" strokeLinecap="round" />
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={RABBIT} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.5" fill={RABBIT} stroke={RABBIT_SHADE} strokeWidth="0.7" />
    </>
  )
}

/** つくたびに、うすの ふちから ほこりが ぱっと とぶ。 */
function Dust({ t }: SceneProps) {
  return (
    <>
      {HITS.map((hit) => {
        const p = span(t, hit, hit + 0.55, easeOut)
        if (p <= 0 || p >= 1) return null
        return (
          <g key={hit} opacity={1 - p} fill="#ffffff" stroke="#d9e2ee" strokeWidth="0.5">
            <circle cx={POLE_X - 17 - p * 8} cy={RIM_Y + 2 - p * 4} r={1.6 + p * 2} />
            <circle cx={POLE_X - 14 - p * 4} cy={RIM_Y - 3 - p * 5} r={1.1 + p * 1.6} />
            <circle cx={POLE_X + 17 + p * 8} cy={RIM_Y + 2 - p * 4} r={1.6 + p * 2} />
            <circle cx={POLE_X + 14 + p * 4} cy={RIM_Y - 3 - p * 5} r={1.1 + p * 1.6} />
          </g>
        )
      })}
    </>
  )
}

/** おなかが ぐう と なる しるし(ぺこぺこの間だけ)。 */
function Rumble({ t, x }: SceneProps & { readonly x: number }) {
  const show = during(t, 0.7, GRAB + 0.3, 0.2)
  if (show <= 0) return null
  const j = wave(t, 0.3) * 0.8
  return (
    <g opacity={show} fill="none" stroke="#7a8aa8" strokeWidth="1" strokeLinecap="round">
      <path d={`M${x + 8} ${52 + j} q2 -1.6 4 0`} />
      <path d={`M${x + 9} ${56 - j} q2 -1.6 4 0`} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  const lift = pestleLift(t)
  const squash = squashOf(t)
  const grab = span(t, GRAB, GRAB + 0.55, easeInOut)

  // あるいてくる: 左から うすの まえまで。あしを ふる
  const walkX = mix(t, 0.1, ARRIVE + 0.3, -46, 0, easeOut)
  const walking = t > 0.1 && t < ARRIVE + 0.3 ? 1 - span(t, ARRIVE, ARRIVE + 0.3) : 0
  const stride = Math.sin((t - 0.1) * Math.PI * 2 * 1.8) * walking
  const bob = -Math.abs(stride) * 1.2

  const happyAt = HITS[HITS.length - 1] + 0.45
  const mood: Mood = t < GRAB ? 'hungry' : t < happyAt ? 'working' : 'happy'

  // うさぎ: きねが もちあがっている間に、てを のばして もちを ひっくりかえす
  const reach = HITS.reduce((best, hit) => Math.max(best, during(t, hit - 0.9, hit - 0.3, 0.2)), 0)
  const rest: Point = [75.6, 92]
  const mochiSpot: Point = [65.5, RIM_Y - 3.4]
  const cheer = span(t, happyAt, happyAt + 0.3)
  const cheerHand: Point = [74 + wave(t, 0.5) * 1.6, 70 - Math.abs(wave(t, 0.5)) * 2]
  const baseHand: Point = [rest[0] + (mochiSpot[0] - rest[0]) * reach, rest[1] + (mochiSpot[1] - rest[1]) * reach]
  const rabbitHand: Point = [baseHand[0] + (cheerHand[0] - baseHand[0]) * cheer, baseHand[1] + (cheerHand[1] - baseHand[1]) * cheer]
  const rabbitPop = span(t, 0.5, 1.1, backOut)

  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <FarTree t={t} />
        <BambooPole t={t} />
        <LanternRope t={t} />
        <MortarBack />
        <Mochi t={t} squash={squash} />
        <Pestle lift={lift} />
        <MortarFront />
        <Dust t={t} />
        <Layer scale={rabbitPop} origin={[84, 98]}>
          <Rabbit hand={rabbitHand} happy={t >= happyAt} ear={wave(t, 1.4) * 2 + (t >= happyAt ? wave(t, 0.5) * 4 : 0)} />
        </Layer>
        <Layer x={walkX} y={bob}>
          <Child mood={mood} stride={stride} lift={lift} grab={grab} t={t} />
          <Rumble t={t} x={30} />
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
    { at: 0, label: 'お日さまが のぼる', sound: 'pop' },
    { at: ARRIVE, label: 'おなかが ぺこぺこの子が うすの まえへ' },
    { at: GRAB, label: 'きねを にぎる', sound: 'pop' },
    { at: HITS[0], label: 'ドン! きねで もちを つく', sound: 'pop' },
    { at: HITS[2], label: 'もちが できた! お日さまは まうえ(お昼)', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '午 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
