/*
 * 声(こえ): つるした 石の がっきを たたくと、いい 音が 耳に とどく。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 石の がっきを つるす 木の よこぼう(はり)
 *   2画目(丨)  … はり に かけて 石を つるす ひも
 *   3画目(一)  … ひもに ぶらさがった 平たい 石の がっき
 *   4〜6画目   … 石を たたく 子の あたま と 耳(まんなかに 立つ 子が、石の下に いる)
 *   7画目(ノ)  … 子の 左がわ(石のほうへ 手を のばした ほう)
 *   (絵と字は、だいたい おなじ場所・おなじ向き。ぴったりは 重ねない)
 *
 * ながれ
 *   木の わく に 石の がっきが ぶらさがる → 子どもが あるいてきて、石を 見上げる(なんだろう?)
 *   → ぼうを ふりあげて、こん! と たたく → 石が ゆれて、音の わ が ひろがる(びっくり)
 *   → 音が 耳に とどいて、手を 耳に あてる → いい 音! にこにこ(音符が ふわふわ)
 *   → ほね が ひかって、絵が うすくなり、字「声」が のこる
 *
 * 子どもは、ほんものの つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(下の ikElbow が かた・ひじ・手を つなぐ)。
 *   くび は みじかく、あたま は どう の まんなか の上。耳は あたまの 左右に 1つずつ。
 *   石は ひもで ぶらさがって、たたくと ひもの つけね を じく に ゆれる。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '声'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#e8795a'
const TUNIC_DARK = '#cf6244'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const ROPE = '#d9b36a'
const STONE = '#8f9aa6'
const STONE_LIGHT = '#b9c3cd'
const MALLET = '#e0645a'
const STICK = '#b57d4a'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const WAVE = '#5aaee8'
const NOTE = '#f07f9e'

/** くぎり の時間(秒) */
const WALK = 1.0
const ARRIVE = 2.3
const LOOK = 2.5
const WIND = 3.3
const HIT = 4.2
const CUP = 4.9
const INK = 6.7
const DONE = 9.2
const DURATION = 10

/** 子どもの 足もと・かた・手の きまり */
const CX = 55
const LEFT_SHOULDER: readonly [number, number] = [48.5, 72]
const RIGHT_SHOULDER: readonly [number, number] = [61.5, 72]
/** うでの 2つの ふしの 長さ(かた→ひじ、ひじ→手) */
const ARM_PART = 8.5
/** 石に ぼう が とどく ところ(石の 下) */
const STRIKE: readonly [number, number] = [41.5, 63.2]
/** 音の わ の まんなか(ぼう が 石に あたる 場所) */
const IMPACT: readonly [number, number] = [41.5, 42.5]
/** 石を つるす ひもの つけね(石は ここを じくに ゆれる) */
const HANG: readonly [number, number] = [54.4, 22]

type Point = readonly [number, number]

/** かた と 手 から、ひじの 場所を 出す。ひじは 体の そとがわ へ まがる。 */
function ikElbow(shoulder: Point, hand: Point): Point {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const d = Math.min(Math.max(Math.hypot(dx, dy), 0.001), ARM_PART * 2 - 0.01)
  const along = d / 2
  const height = Math.sqrt(Math.max(ARM_PART * ARM_PART - along * along, 0))
  const mid: Point = [shoulder[0] + (dx / Math.hypot(dx, dy || 0.001)) * along, shoulder[1] + (dy / Math.hypot(dx, dy || 0.001)) * along]
  const nx = -dy / Math.hypot(dx, dy || 0.001)
  const ny = dx / Math.hypot(dx, dy || 0.001)
  const a: Point = [mid[0] + nx * height, mid[1] + ny * height]
  const b: Point = [mid[0] - nx * height, mid[1] - ny * height]
  return Math.abs(a[0] - CX) >= Math.abs(b[0] - CX) ? a : b
}

/** かた → ひじ → 手 と つながる うで。 */
function Arm({ shoulder, hand }: { readonly shoulder: Point; readonly hand: Point }) {
  const elbow = ikElbow(shoulder, hand)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={TUNIC_DARK} strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.9" fill={SKIN} />
    </>
  )
}

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[11, 11]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="10.3" y="1.4" width="1.5" height="3.4" rx="0.75" fill={SUN} transform={`rotate(${i * 45} 11 11)`} />
        ))}
      </Layer>
      <circle cx="11" cy="11" r={5.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="2" cy="40" rx="6.5" ry="3" />
        <ellipse cx="6.5" cy="38.4" rx="4.6" ry="3" />
        <ellipse cx="96" cy="48" rx="6" ry="2.7" />
        <ellipse cx="100.5" cy="46.5" rx="4.2" ry="2.9" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[7, 36, 74, 101].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 石を つるす 木の わく。はり(1画目)と 2本の はしら が 下から のびる。 */
function Frame({ t }: SceneProps) {
  const posts = span(t, 0, 0.5, backOut)
  const beam = span(t, 0.25, 0.7, backOut)
  return (
    <>
      <Layer scaleY={posts} origin={[54.5, 97]}>
        <rect x="20.3" y="22" width="4.4" height="75" rx="1.6" fill={BARK} />
        <rect x="83.3" y="20.5" width="4.4" height="76.5" rx="1.6" fill={BARK} />
        <ellipse cx="22.5" cy="96.8" rx="6" ry="2" fill={BARK_DARK} />
        <ellipse cx="85.5" cy="96.8" rx="6" ry="2" fill={BARK_DARK} />
      </Layer>
      <Layer scaleX={beam} origin={[54, 22]}>
        <Bone char={CHAR} n={1} color={BARK} width={5.2} />
        <circle cx="22.8" cy="24.3" r="2.8" fill={BARK_DARK} />
        <circle cx="85.2" cy="19.9" r="2.8" fill={BARK_DARK} />
      </Layer>
    </>
  )
}

/** つるした 石(3画目)と、ひも(2画目)。たたかれると ひもの つけね を じくに ゆれる。 */
function HangingStone({ t }: SceneProps) {
  const drop = span(t, 0.55, 1.1, backOut)
  const since = t - HIT
  const swing = since > 0 ? Math.exp(-since * 1.5) * Math.sin(since * 17) * 4.2 : 0
  return (
    <Layer scaleY={drop} rotate={swing} origin={HANG}>
      <Bone char={CHAR} n={2} color={ROPE} width={1.7} />
      <Bone char={CHAR} n={3} color={STONE} width={7.6} />
      <Bone char={CHAR} n={3} color={STONE_LIGHT} width={2.2} />
      <circle cx="54.4" cy="36.5" r="1.8" fill={ROPE} />
    </Layer>
  )
}

/** たたいた しゅんかん の 小さな ひかり。 */
function Spark({ t }: SceneProps) {
  const p = span(t, HIT, HIT + 0.35, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p} stroke="#ffd24a" strokeWidth="1.2" strokeLinecap="round">
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2 + 0.3
        const r1 = 4.5 + p * 3
        const r2 = 7 + p * 5
        return <line key={i} x1={IMPACT[0] + Math.cos(a) * r1} y1={IMPACT[1] + Math.sin(a) * r1} x2={IMPACT[0] + Math.cos(a) * r2} y2={IMPACT[1] + Math.sin(a) * r2} />
      })}
    </g>
  )
}

/** 音の わ。石から まるく ひろがって、子どもの 耳に とどく。 */
function SoundRings({ t }: SceneProps) {
  return (
    <>
      {[0, 0.3, 0.6].map((offset) => {
        const p = span(t, HIT + offset, HIT + offset + 1.4, easeOut)
        if (p <= 0 || p >= 1) return null
        return <circle key={offset} cx={IMPACT[0]} cy={IMPACT[1]} r={3 + p * 33} fill="none" stroke={WAVE} strokeWidth={1.4 - p * 0.7} opacity={(1 - p) * 0.85} />
      })}
    </>
  )
}

type Mood = 'curious' | 'surprised' | 'happy'

function Face({ mood, lookUp }: { readonly mood: Mood; readonly lookUp: number }) {
  return (
    <>
      <circle cx="49.6" cy="62" r="2.1" fill="#ff9d9d" opacity="0.55" />
      <circle cx="60.4" cy="62" r="2.1" fill="#ff9d9d" opacity="0.55" />
      {mood === 'curious' && (
        <>
          <path d="M49.6 54.6 l3.8 -0.2 M57 53.6 l3.8 -1.2" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <circle cx="51.5" cy={58 - lookUp} r="1.3" fill="#2b2b2b" />
          <circle cx="58.5" cy={58 - lookUp} r="1.3" fill="#2b2b2b" />
          <path d="M53.6 63.4 Q55 64.2 56.4 63.4" fill="none" stroke="#b9483f" strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'surprised' && (
        <>
          <path d="M49.4 54 l4 -1 M57 53 l4 1" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <circle cx="51.5" cy="58" r="1.9" fill="#2b2b2b" />
          <circle cx="58.5" cy="58" r="1.9" fill="#2b2b2b" />
          <circle cx="52" cy="57.3" r="0.6" fill="#ffffff" />
          <circle cx="59" cy="57.3" r="0.6" fill="#ffffff" />
          <ellipse cx="55" cy="63.6" rx="1.4" ry="1.9" fill="#b9483f" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M49.8 58.6 Q51.5 56.2 53.2 58.6 M56.8 58.6 Q58.5 56.2 60.2 58.6" fill="none" stroke="#2b2b2b" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M51.6 61.6 Q55 66.8 58.4 61.6 Z" fill="#b9483f" stroke="#b9483f" strokeWidth="0.8" strokeLinejoin="round" />
        </>
      )}
    </>
  )
}

/** ぼう。手に にぎって、さきに まるい 木づち。手を じくに ふる。 */
function Mallet({ hand, angle }: { readonly hand: Point; readonly angle: number }) {
  return (
    <Layer rotate={angle} origin={hand}>
      <rect x={hand[0] - 1.1} y={hand[1] - 16} width="2.2" height="20" rx="1.1" fill={STICK} />
      <rect x={hand[0] - 3.5} y={hand[1] - 21} width="7" height="7.5" rx="3.2" fill={MALLET} />
    </Layer>
  )
}

type ChildProps = {
  readonly t: number
}

function Child({ t }: ChildProps) {
  // あるく: 右から 石の下まで。あしを ふって、体が 上下する
  const walkX = mix(t, WALK, ARRIVE, 80, 0, easeOut)
  const walking = t >= WALK && t < ARRIVE ? 1 - span(t, ARRIVE - 0.3, ARRIVE) : 0
  const stride = Math.sin((t - WALK) * Math.PI * 2 * 1.8) * walking
  const happyBounce = t > CUP + 0.7 ? Math.abs(wave(t, 0.9)) * 0.9 : 0
  const bob = -Math.abs(stride) * 1.3 - happyBounce

  // ぼう: かついで あるく → ふりあげる(うしろへ たおす)→ こん! → 力をぬいて さげる
  const windUp = span(t, WIND, HIT - 0.12, easeInOut)
  const strike = span(t, HIT - 0.12, HIT, easeIn)
  const after = span(t, HIT, HIT + 0.6, easeOut)
  const carry = -15 + wave(t, 0.55) * 2 * walking
  const angle = t < HIT - 0.12 ? mix(t, WIND, HIT - 0.12, carry, -38, easeInOut) : t < HIT ? mix(t, HIT - 0.12, HIT, -38, 0, easeIn) : -16 * after
  const handX = t < HIT ? 43 + (STRIKE[0] - 43) * Math.max(windUp, strike) : STRIKE[0] + (42.5 - STRIKE[0]) * after
  const handY = (t < HIT ? 68 + (STRIKE[1] - 68) * Math.max(windUp, strike) : STRIKE[1] + (68 - STRIKE[1]) * after) + bob
  const leftHand: Point = [handX, handY]

  // ひだりの うで(ぼうを もつ)・みぎの うで(たたいたあと、耳に あてる)
  const cup = span(t, CUP, CUP + 0.5, easeInOut)
  const rightRest: Point = [65, 85 + stride * 1.8 + bob]
  const rightCup: Point = [68.4, 59.5 + bob]
  const rightHand: Point = [rightRest[0] + (rightCup[0] - rightRest[0]) * cup, rightRest[1] + (rightCup[1] - rightRest[1]) * cup]
  const shoulders = { left: [LEFT_SHOULDER[0], LEFT_SHOULDER[1] + bob] as Point, right: [RIGHT_SHOULDER[0], RIGHT_SHOULDER[1] + bob] as Point }

  // あたま: 石を 見あげる → びっくり → 耳のほうへ かたむけて にこにこ
  const lookUp = span(t, LOOK, LOOK + 0.4, easeOut) * (1 - span(t, HIT + 0.1, HIT + 0.5))
  const tilt = -5 * lookUp + 5 * cup + (t > CUP + 0.7 ? wave(t, 0.9) * 2 : 0)
  const mood: Mood = t < HIT ? 'curious' : t < HIT + 0.7 ? 'surprised' : 'happy'
  const hop = t >= HIT && t < HIT + 0.2 ? -Math.sin(span(t, HIT, HIT + 0.2) * Math.PI) * 1.6 : 0

  return (
    <Layer x={walkX} y={hop}>
      <ellipse cx={CX} cy="97" rx="10" ry="2.4" fill="#000000" opacity="0.12" />
      <Layer y={bob}>
        {/* あし: 足の つけね を じくに かわりばんこに ふる */}
        <Layer rotate={stride * 15} origin={[51.9, 82]}>
          <rect x="49.6" y="82" width="4.6" height="13" rx="2.3" fill={PANTS} />
          <ellipse cx="51.5" cy="95.2" rx="4" ry="2.3" fill={SHOE} />
        </Layer>
        <Layer rotate={-stride * 15} origin={[58.1, 82]}>
          <rect x="55.8" y="82" width="4.6" height="13" rx="2.3" fill={PANTS} />
          <ellipse cx="58.5" cy="95.2" rx="4" ry="2.3" fill={SHOE} />
        </Layer>
        {/* くび は みじかく、どう と あたま の間 */}
        <rect x="52.5" y="64" width="5" height="6" rx="2" fill={SKIN_SHADE} />
        <rect x="47" y="68" width="16" height="17" rx="6" fill={TUNIC} />
        <path d="M49.5 80 h11" stroke={TUNIC_DARK} strokeWidth="1.4" strokeLinecap="round" />
      </Layer>
      <Mallet hand={leftHand} angle={angle} />
      <Arm shoulder={shoulders.left} hand={leftHand} />
      <Arm shoulder={shoulders.right} hand={rightHand} />
      {/* あたま: 耳は 左右に 1つずつ */}
      <Layer y={bob} rotate={tilt} origin={[CX, 66]}>
        <circle cx="45.4" cy="58.5" r="2.8" fill={SKIN_SHADE} />
        <circle cx="64.6" cy="58.5" r="2.8" fill={SKIN_SHADE} />
        <circle cx="45.5" cy="58.6" r="1.3" fill="#f4a28c" />
        <circle cx="64.5" cy="58.6" r="1.3" fill="#f4a28c" />
        <circle cx={CX} cy="57.5" r="9.5" fill={SKIN} />
        <path d="M45.6 54.4 C44.6 45 52 45.6 55 45.6 C60.2 45.4 65.8 46.6 64.4 54.4 C62 50.6 58 50 55 51.6 C52 50 48 51 45.6 54.4 Z" fill={HAIR} />
        <path d="M53.2 46.4 Q54 43.6 55.6 45.4 Q57 43 57.8 46" fill="none" stroke={HAIR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <Face mood={mood} lookUp={lookUp} />
      </Layer>
    </Layer>
  )
}

/** 音を たのしむ「おんぷ」。耳の そばから ふわふわ のぼる。 */
function Notes({ t }: SceneProps) {
  const show = during(t, CUP + 0.6, INK + 0.1, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.7, 1.4].map((offset, i) => {
        const p = ((t - CUP + offset) % 2.1) / 2.1
        const x = 72 + i * 5 + Math.sin(p * 6 + i) * 1.6
        const y = 52 - p * 20 - i * 2
        return (
          <g key={offset} opacity={Math.sin(p * Math.PI)}>
            <path d={`M${x + 1.1} ${y} v-4.6 l2.6 -0.9 v4.4`} fill="none" stroke={NOTE} strokeWidth="0.85" />
            <ellipse cx={x} cy={y} rx="1.3" ry="0.95" fill={NOTE} />
            <ellipse cx={x + 2.6} cy={y - 0.9} rx="1.3" ry="0.95" fill={NOTE} />
          </g>
        )
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Frame t={t} />
        <HangingStone t={t} />
        <SoundRings t={t} />
        <Child t={t} />
        <Spark t={t} />
        <Notes t={t} />
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Layer scale={1 + bump} origin={[54.5, 54.5]}>
        <Ink char={CHAR} progress={ink.progress} tint={ink.tint} />
      </Layer>
      <Sparkles cx={54.5} cy={54} progress={ink.sparkle} />
    </>
  )
}

const scene: SceneModule = {
  char: CHAR,
  duration: DURATION,
  beats: [
    { at: 0, label: '木の わく に、石の がっきが ぶらさがる', sound: 'pop' },
    { at: WALK, label: '子どもが あるいてきて、石を 見あげる' },
    { at: WIND, label: 'ぼうを ふりあげる' },
    { at: HIT, label: 'こん! 石を たたく', sound: 'tap' },
    { at: CUP, label: '音が 耳に とどく。いい 音!' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '声 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
