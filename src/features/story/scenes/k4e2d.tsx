/*
 * 中(なか): ぼうが 四角の まんなかを とおる。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … 板(しかくい かんばん)の 左はし
 *   2画目(コ)  … 板の うえ と 右はし
 *   3画目(一)  … 板の した(板が ぼうの でっぱり に のる ところ)
 *   4画目(丨)  … 地面に 立った ぼう。板の まんなかを 上から 下まで つらぬく
 *
 * ながれ
 *   ぼうが 地面に 立つ → 子どもが おもい 板を はこんでくる(あせ、つかれた顔)
 *   → ぼうの そばで ひとやすみ → 「うんしょ」と 板を もちあげる
 *   → 板が ぼうの でっぱり に ストンと のる。ぼうが 板の まんなかを とおった!
 *   → 子どもは ばんざいで はねて、ハートが ふわり
 *   → ほね が ひかって、絵が うすくなり、字「中」が のこる
 *
 * 子どもと 板は、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる(かた と 手の 場所から ひじ を計算する)。
 *   板は 手で 持つところ(左はし)を じく に、はこぶ間は 右が 少し さがる。
 *   のせたあとは ゆらゆら ゆれて、少し 右あがりで とまる(1・2・3画目と 同じ むき)。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '中'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#ee8a4a'
const TUNIC_DARK = '#d4733a'
const TUNIC_FAR = '#bd6330'
const PANTS = '#4b6a9b'
const PANTS_DARK = '#3f5b88'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const WOOD = '#f0d3a0'
const WOOD_EDGE = '#b98650'
const HEART = '#e8534a'
const LEAF = '#55b86e'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const SWEAT = '#7cc4f2'
const MOUTH = '#b9483f'

/** くぎり の時間(秒) */
const WALK = 0.9
const ARRIVE = 3.4
const LIFT = 4.0
const PEAK = 4.9
const PLACE = 5.25
const HOP = 5.7
const INK = 6.9
const DONE = 9.4
const DURATION = 10

type Pt = readonly [number, number]

/** 子どもの かた(うで の つけね)。体の まんなか の上 */
const SHOULDER: Pt = [11, 63]
/** うで の ほね1本の 長さ(かた→ひじ、ひじ→手) */
const ARM = 9
/** 板の 持つところ(左はし の まんなか)。字の 1画目の 場所 */
const GRIP: Pt = [21.5, 49.5]
/** 板の よこはば の はんぶん(持つところ から 板の まんなかまで) */
const HALF_WIDTH = 33
/** のせおわった ときの 板の かたむき(右あがり) と、そのときの 持つところの 高さ */
const REST_TILT = -4
const REST_GRIP_Y = GRIP[1] + HALF_WIDTH * Math.sin((-REST_TILT * Math.PI) / 180)
/** 板を もちあげた いちばん高い ところ(のる でっぱり より 少し上)と、はこぶ間の 高さ */
const PEAK_GRIP_Y = 45.5
const CARRY_GRIP_Y = 64
const CARRY_TILT = 5

const glide = (x: number) => 1 - (1 - x) ** 2

/* ───────── まわりの けしき ───────── */

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
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill="#e2f2d2" />
      {/* ゆっくり ながれる 雲 */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="78" cy="15" rx="7" ry="3.2" />
        <ellipse cx="83" cy="13" rx="5" ry="3.2" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[40, 76, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 小さな ちょうちょ。右のほうを ひらひら とぶ */
function Butterfly({ t }: SceneProps) {
  const show = span(t, 0.8, 1.3)
  if (show <= 0) return null
  const flap = 0.3 + 0.7 * Math.abs(wave(t, 0.5))
  return (
    <Layer x={95 + wave(t, 3.1) * 3.5} y={78 + wave(t, 2.3) * 4} opacity={show}>
      <Layer scaleX={flap}>
        <ellipse cx="-2.1" cy="-0.6" rx="2.4" ry="2" fill="#f07f9e" />
        <ellipse cx="2.1" cy="-0.6" rx="2.4" ry="2" fill="#f07f9e" />
        <ellipse cx="-1.6" cy="1.6" rx="1.6" ry="1.4" fill="#f7a8bd" />
        <ellipse cx="1.6" cy="1.6" rx="1.6" ry="1.4" fill="#f7a8bd" />
      </Layer>
      <ellipse cx="0" cy="0.4" rx="0.55" ry="1.9" fill="#5a3b2a" />
    </Layer>
  )
}

/* ───────── ぼう と 板 ───────── */

/** ぼうの でっぱり(板を のせる ところ)と、足もとの つち。板の うしろに かくれる */
function PegAndMound({ grow }: { readonly grow: number }) {
  return (
    <>
      <ellipse cx="54.6" cy="98.3" rx={7 * grow} ry="2.2" fill="#9a7050" />
      <rect x="47.5" y="64" width="14.2" height="3.2" rx="1.3" fill={BARK_DARK} opacity={grow} />
    </>
  )
}

/** 地面に 立った ぼう(4画目)。板の まえを とおる */
function Pole({ grow }: { readonly grow: number }) {
  return (
    <Layer scaleX={0.6 + 0.4 * grow} scaleY={grow} origin={[54.5, 98]}>
      <Bone char={CHAR} n={4} color={BARK} width={4.8} from={0.07} />
      <circle cx="54.8" cy="16.4" r="3.2" fill={BARK_DARK} />
    </Layer>
  )
}

function Heart({ x, y, s, color }: { readonly x: number; readonly y: number; readonly s: number; readonly color: string }) {
  return <path d="M0 2.6 C-4.4 -0.4 -2.8 -4.4 0 -2.2 C2.8 -4.4 4.4 -0.4 0 2.6 Z" fill={color} transform={`translate(${x} ${y}) scale(${s})`} />
}

/** しかくい 板。字の 1・2・3画目の 場所に ぴったり 合う大きさで 描く */
function Board() {
  return (
    <>
      <rect x="21.5" y="34.5" width="66" height="29.5" rx="3.6" fill={WOOD_EDGE} />
      <rect x="23.6" y="36.6" width="61.8" height="25.3" rx="2.4" fill={WOOD} />
      <Heart x={38} y={49.5} s={1.5} color={HEART} />
      <Heart x={71} y={49.5} s={1.5} color={HEART} />
    </>
  )
}

/** 板の いま の かっこう。持つところ の高さ(gy)と かたむき(tilt) */
type BoardPose = { readonly gy: number; readonly tilt: number }

function boardPose(t: number): BoardPose {
  const lift = span(t, LIFT, PEAK, easeInOut)
  const drop = span(t, PEAK + 0.05, PLACE, easeIn)
  const since = Math.max(t - PLACE, 0)
  // のせた あとは ゆらゆら ゆれて しずまる
  const wobble = since > 0 ? 2.6 * Math.exp(-since * 4) * Math.sin(since * 14) : 0
  const gy = CARRY_GRIP_Y + (PEAK_GRIP_Y - CARRY_GRIP_Y) * lift + (REST_GRIP_Y - PEAK_GRIP_Y) * drop
  const tilt = CARRY_TILT * (1 - lift) + REST_TILT * drop + wobble
  return { gy, tilt }
}

/* ───────── 子ども ───────── */

/** かた と 手の 場所から、ひじ を 計算する(うで は かた から出て ひじ で まがる)。ひじ は 下がわ に まがる */
function reachArm(hand: Pt): { readonly elbow: Pt; readonly hand: Pt } {
  const dx = hand[0] - SHOULDER[0]
  const dy = hand[1] - SHOULDER[1]
  const d = Math.max(Math.hypot(dx, dy), 0.01)
  const reach = Math.min(d, ARM * 2 - 0.05)
  const ux = dx / d
  const uy = dy / d
  const half = reach / 2
  const rise = Math.sqrt(Math.max(ARM * ARM - half * half, 0))
  const a: Pt = [SHOULDER[0] + ux * half - uy * rise, SHOULDER[1] + uy * half + ux * rise]
  const b: Pt = [SHOULDER[0] + ux * half + uy * rise, SHOULDER[1] + uy * half - ux * rise]
  return { elbow: a[1] >= b[1] ? a : b, hand: [SHOULDER[0] + ux * reach, SHOULDER[1] + uy * reach] }
}

function Arm({ target, color }: { readonly target: Pt; readonly color: string }) {
  const { elbow, hand } = reachArm(target)
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.7" fill={SKIN} />
    </>
  )
}

type Mood = 'tired' | 'effort' | 'happy'

function Face({ mood }: { readonly mood: Mood }) {
  if (mood === 'tired') {
    return (
      <>
        <path d="M7.4 51.9 L10.6 50.4 M13.6 50.4 L16.8 51.9" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
        <circle cx="9.3" cy="53.6" r="1.05" fill="#2b2b2b" />
        <circle cx="14.8" cy="53.6" r="1.05" fill="#2b2b2b" />
        <path d="M11.2 58.3 Q12.8 56.9 14.4 58.3" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
      </>
    )
  }
  if (mood === 'effort') {
    return (
      <>
        <path d="M8.4 52 l2.6 1.3 l-2.6 1.3 M16.6 52 l-2.6 1.3 l2.6 1.3" fill="none" stroke="#2b2b2b" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11.2 58 h3.2" stroke={MOUTH} strokeWidth="1.3" strokeLinecap="round" />
      </>
    )
  }
  return (
    <>
      <path d="M8 53.8 Q9.4 51.9 10.8 53.8 M13.4 53.8 Q14.8 51.9 16.2 53.8" fill="none" stroke="#2b2b2b" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M10.6 56.2 Q12.9 60.6 15.2 56.2 Z" fill={MOUTH} />
    </>
  )
}

type ChildProps = {
  readonly step: number
  readonly mood: Mood
  readonly nearHand: Pt
  readonly farHand: Pt
  readonly headTilt: number
}

/** 子ども。右むき(ぼうのほう)。体の まんなかが x=11 */
function Child({ step, mood, nearHand, farHand, headTilt }: ChildProps) {
  return (
    <>
      {/* むこうの うで: 体の うしろ */}
      <Arm target={farHand} color={TUNIC_FAR} />
      <Layer rotate={step * 16} origin={[10.5, 78]}>
        <rect x="11.2" y="76" width="4.4" height="20.4" rx="2.2" fill={PANTS_DARK} />
        <ellipse cx="14.2" cy="96.8" rx="3.9" ry="2" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 16} origin={[10.5, 78]}>
        <rect x="6.4" y="76" width="4.4" height="20.4" rx="2.2" fill={PANTS} />
        <ellipse cx="9.4" cy="96.8" rx="3.9" ry="2" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう の まんなか の上 */}
      <rect x="9.2" y="57" width="3.6" height="5" rx="1.4" fill={SKIN_SHADE} />
      <rect x="5.4" y="59" width="11.2" height="21.5" rx="5" fill={TUNIC} />
      <path d="M7 74.5 h8" stroke={TUNIC_DARK} strokeWidth="1.2" strokeLinecap="round" />
      <Arm target={nearHand} color={TUNIC_DARK} />
      <Layer rotate={headTilt} origin={[11, 60]}>
        <circle cx="3.9" cy="54.2" r="1.7" fill={SKIN_SHADE} />
        <circle cx="11" cy="53.5" r="7.4" fill={SKIN} />
        <path d="M3.7 52.5 C3.1 45.4 8 43.2 11.5 43.4 C16.4 43.7 18.8 47.4 18.4 51.6 C16.4 48.4 12.2 47.4 8.6 48.4 C6.2 49 4.8 50.6 3.7 52.5 Z" fill={HAIR} />
        <path d="M11 43.4 Q9.6 40 12.6 39.2" fill="none" stroke={HAIR} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="7.4" cy="56.8" r="1.7" fill="#ff9d9d" opacity="0.55" />
        <circle cx="16.4" cy="56.8" r="1.5" fill="#ff9d9d" opacity="0.55" />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

/** あるいている間の あせ。あたまの うしろ(左)へ とぶ */
function Sweat({ t }: SceneProps) {
  const show = during(t, WALK + 0.3, ARRIVE, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.45].map((offset) => {
        const p = ((t + offset) % 0.9) / 0.9
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill={SWEAT} transform={`translate(${5 - p * 4} ${46 + p * 7}) rotate(-20)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** ストンと のった しゅんかんの ほこり */
function Dust({ t }: SceneProps) {
  const p = span(t, PLACE, PLACE + 0.6, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g fill="#f6efe0" opacity={(1 - p) * 0.9}>
      {[-1, 1].map((side) => (
        <ellipse key={side} cx={54.6 + side * (7 + p * 9)} cy={68 - p * 3} rx={2 + p * 3} ry={1.6 + p * 2} />
      ))}
    </g>
  )
}

/** うれしくて、あたまの上に ふわっと ハート */
function Hearts({ t }: SceneProps) {
  const from = PLACE + 0.5
  const show = during(t, from, INK - 0.1, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.5].map((offset, i) => {
        const p = ((t - from + offset) % 1) / 1
        return <Heart key={offset} x={5 + i * 7 + Math.sin(p * 6) * 1.2} y={38 - p * 9} s={0.9 + i * 0.2} color="#f07f9e" />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)
  const grow = span(t, 0.1, 0.7, backOut)

  // あるく: 左から 板を はこんでくる。ついたら 足を とめる
  const walking = t < WALK ? 0 : 1 - span(t, ARRIVE - 0.3, ARRIVE)
  const stride = Math.sin((t - WALK) * Math.PI * 2 * 2.2) * walking
  const dx = mix(t, WALK, ARRIVE, -90, 0, glide)
  const bob = -Math.abs(stride) * 1.2

  // 板と 手: 手は 板の 持つところ(左はし)に ついていく。のせたら はなして ばんざい
  const board = boardPose(t)
  const rad = (board.tilt * Math.PI) / 180
  const onBoard = (ox: number, oy: number): Pt => [GRIP[0] + 0.08 + ox * Math.cos(rad) - oy * Math.sin(rad), board.gy + ox * Math.sin(rad) + oy * Math.cos(rad)]
  const release = span(t, PLACE + 0.1, PLACE + 0.5, easeOut)
  const toward = (hold: Pt, up: Pt): Pt => [hold[0] + (up[0] - hold[0]) * release, hold[1] + (up[1] - hold[1]) * release]
  const nearHand = toward(onBoard(0.8, 10.5), [4, 47.5])
  const farHand = toward(onBoard(1.2, 5.5), [17, 47.5])

  // うれしくて 2かい はねる
  const q = span(t, HOP, HOP + 0.8)
  const hop = q > 0 && q < 1 ? Math.abs(Math.sin(q * Math.PI * 2)) * 5.2 : 0

  const mood: Mood = t < LIFT ? 'tired' : t < PLACE + 0.1 ? 'effort' : 'happy'
  const headTilt = mood === 'tired' ? 5 + stride * 2 : mood === 'effort' ? 0 : -4
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <PegAndMound grow={grow} />
        <Layer x={dx + 0.08} y={board.gy - GRIP[1]} rotate={board.tilt} origin={GRIP}>
          <Board />
        </Layer>
        <Pole grow={grow} />
        <Butterfly t={t} />
        <ellipse cx={11 + dx} cy="97.6" rx={8 - hop * 0.5} ry="2.1" fill="#000000" opacity="0.12" />
        <Layer x={dx} y={bob - hop}>
          <Child step={stride} mood={mood} nearHand={nearHand} farHand={farHand} headTilt={headTilt} />
          <Sweat t={t} />
        </Layer>
        <Dust t={t} />
        <Hearts t={t} />
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
    { at: 0, label: 'ぼうが 地面に たつ', sound: 'pop' },
    { at: WALK, label: '子どもが おもい 板を はこんでくる' },
    { at: ARRIVE, label: 'ぼうの そばで ひとやすみ' },
    { at: LIFT, label: 'うんしょ と 板を もちあげる' },
    { at: PLACE, label: '板が ぼうの でっぱり に のる。ぼうが 板の まんなかを とおる', sound: 'pop' },
    { at: HOP, label: 'ばんざいで はねる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '中 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
