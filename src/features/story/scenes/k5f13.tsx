/*
 * 弓(ゆみ): ぐにゃりと まがった、やを とばす どうぐ。
 *
 * ほね(画と絵の対応)  ※ 弓は 分けない字。1つの絵(弓)として 描く
 *   1・2画目   … 弓の 上の はし(やじりを かける ところ)。ひもが とまる 先たん
 *   3画目      … 弓の ぐにゃり と まがった 本たい。右に ふくらんで、下の はしへ
 *   (弓の かたちは 右へ ふくらむ。右が やの とんでいく むき)
 *
 * ながれ
 *   男の子が りんごを とろうとして とびはねるけど とどかない → しょんぼり
 *   → 「そうだ!」と ひらめいて、まっすぐな えだを もつ
 *   → ひもを はると、えだが ぐにゃり と しなって 弓に なる
 *   → やを つがえて、ひゅっ と はなつと りんごに あたって おちる → 大よろこび
 *   → 弓の ほね が ひかって、絵が うすくなり、字「弓」が のこる
 *
 * 人と 弓は、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる(手は 弓の まんなかの にぎりを もつ)。
 *   弓は 先たんから先たんへ ひもを はり、ひもを ひくと 弓が しなる。やは 弓の まんなかに のせて とばす。
 *   ひだりの手で 弓を もち、みぎの手で ひもを ひく(体は 右むき・手前の うで が 弓の手)。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '弓'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#e8734a'
const TUNIC_DARK = '#cf5d37'
const TUNIC_FAR = '#b84f2e'
const PANTS = '#4a5f8a'
const PANTS_DARK = '#3e5078'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const WOOD = '#a8703f'
const WOOD_LIGHT = '#c99461'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const APPLE = '#e8534a'
const APPLE_DARK = '#c53f3a'
const STRING = '#f3ead2'

/** くぎり の時間(秒) */
const ENTER_END = 1.0
const HOP_START = 1.1
const HOP_END = 2.0
const SAD = 2.0
const TURN_BACK = 2.7
const WALK_BACK_END = 3.7
const FACE_RIGHT = 4.0
const STICK = 4.0
const TIE = 4.3
const BEND = 4.7
const NOCK = 5.5
const RELEASE = 6.4
const FALL = 6.7
const CHEER = 7.3
const INK = 8.4
const DONE = 10.8
const DURATION = 11.4

/** 男の子が りんごの下に たつ ところ(右へ) と、もとの たち ばしょ */
const TREE_SIDE_X = 43

/** かた(うでの つけね)。うで は ここから出る */
const SHOULDER: readonly [number, number] = [47, 64]
/** うで の ほね1本ぶんの長さ(のばすと かた から 弓の にぎり に とどく) */
const ARM_PART = 19.5

type Pt = readonly [number, number]

/** 弓の 先たん(上・下)。字の 1・2画目の 上はし と 3画目の 下はし の あたり */
const BOW_TOP: Pt = [72, 15]
const BOW_BOTTOM: Pt = [55, 91]
/** 弓が しなりきった ときの 制御点(3画目の 右の ふくらみに 重なる) */
const BENT_1: Pt = [90, 32]
const BENT_2: Pt = [88, 68]

/** まっすぐな えだ のとき の 制御点(先たんを むすぶ 線の 3ぶんの1) */
const straightPoint = (k: number): Pt => [BOW_TOP[0] + (BOW_BOTTOM[0] - BOW_TOP[0]) * k, BOW_TOP[1] + (BOW_BOTTOM[1] - BOW_TOP[1]) * k]

/** しなり bend(0 = まっすぐ / 1 = 字の 弓)での 制御点 */
function bowControls(bend: number): readonly [Pt, Pt] {
  const s1 = straightPoint(1 / 3)
  const s2 = straightPoint(2 / 3)
  return [
    [s1[0] + (BENT_1[0] - s1[0]) * bend, s1[1] + (BENT_1[1] - s1[1]) * bend],
    [s2[0] + (BENT_2[0] - s2[0]) * bend, s2[1] + (BENT_2[1] - s2[1]) * bend],
  ]
}

/** 弓の u(0〜1)の ところの 点 */
function bowPoint(bend: number, u: number): Pt {
  const [c1, c2] = bowControls(bend)
  const a = (1 - u) ** 3
  const b = 3 * (1 - u) ** 2 * u
  const c = 3 * (1 - u) * u * u
  const d = u ** 3
  return [a * BOW_TOP[0] + b * c1[0] + c * c2[0] + d * BOW_BOTTOM[0], a * BOW_TOP[1] + b * c1[1] + c * c2[1] + d * BOW_BOTTOM[1]]
}

/** 弓の u の ところの むき(角度・度) */
function bowAngle(bend: number, u: number): number {
  const [c1, c2] = bowControls(bend)
  const a = 3 * (1 - u) ** 2
  const b = 6 * (1 - u) * u
  const c = 3 * u * u
  const dx = a * (c1[0] - BOW_TOP[0]) + b * (c2[0] - c1[0]) + c * (BOW_BOTTOM[0] - c2[0])
  const dy = a * (c1[1] - BOW_TOP[1]) + b * (c2[1] - c1[1]) + c * (BOW_BOTTOM[1] - c2[1])
  return (Math.atan2(dy, dx) * 180) / Math.PI
}

/** ひもを つがえる ところ(ひもの まんなかの すこし下) と、ひいた ときの いち */
const NOCK_REST: Pt = [63.05, 55]
const NOCK_PULL = 6

const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/** かた S と 手 H から、ひじ の いち。side で ひじが 出る むき(+1 / -1)を えらぶ */
function elbowOf(hand: Pt, side: number): Pt {
  const dx = hand[0] - SHOULDER[0]
  const dy = hand[1] - SHOULDER[1]
  const dist = Math.min(Math.hypot(dx, dy), ARM_PART * 2 - 0.01)
  const h = Math.sqrt(Math.max(0, ARM_PART ** 2 - (dist / 2) ** 2))
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  return [SHOULDER[0] + dx / 2 + nx * h * side, SHOULDER[1] + dy / 2 + ny * h * side]
}

/** とどかない ほど とおい 手は、のばせる ところまで で とめる */
function reachable(hand: Pt): Pt {
  const dx = hand[0] - SHOULDER[0]
  const dy = hand[1] - SHOULDER[1]
  const dist = Math.hypot(dx, dy)
  const max = ARM_PART * 2 - 0.2
  if (dist <= max) return hand
  return [SHOULDER[0] + (dx / dist) * max, SHOULDER[1] + (dy / dist) * max]
}

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
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="-2" cy="30" rx="7" ry="3.2" />
        <ellipse cx="3" cy="28" rx="5" ry="3.2" />
        <ellipse cx="60" cy="9" rx="6" ry="2.6" />
        <ellipse cx="64.5" cy="7.6" rx="4.4" ry="2.8" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 30, 82, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** りんごの木: みき が のびて、えだ と 葉が しげり、りんごが ぶらさがる(みぎはしの 木) */
function Tree({ t }: SceneProps) {
  const trunk = span(t, 0, 0.5, backOut)
  const leaves = span(t, 0.3, 0.9, backOut)
  const sway = wave(t, 3.4) * 1.1
  return (
    <>
      <ellipse cx="104" cy="97.6" rx={11 * trunk} ry="2.4" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.6 + 0.4 * trunk} scaleY={trunk} origin={[104, 97]}>
        <path d="M98.5 98 Q102 92 101.6 86 L106.8 86 Q106.6 92 110 98 Z" fill={BARK} />
        <rect x="101.2" y="34" width="5.6" height="56" rx="2.6" fill={BARK} />
        <path d="M103 50 q1 4 0 9 M105 68 q-1 4 0 8" fill="none" stroke={BARK_DARK} strokeWidth="1" strokeLinecap="round" />
      </Layer>
      <Layer scale={leaves} rotate={sway} origin={[104, 38]}>
        <circle cx="93" cy="31" r="8" fill={LEAF_DARK} />
        <circle cx="112" cy="31" r="8" fill={LEAF_DARK} />
        <circle cx="103" cy="24" r="12.5" fill={LEAF_DARK} />
        <circle cx="96" cy="32" r="6.6" fill={LEAF} />
        <circle cx="109" cy="32" r="6.6" fill={LEAF} />
        <circle cx="103" cy="26" r="9.8" fill={LEAF} />
        <circle cx="99" cy="21" r="3.8" fill={LEAF_LIGHT} />
      </Layer>
    </>
  )
}

/** りんご(えだから ぶらさがる。やが あたると おちる) */
function Apple({ t }: SceneProps) {
  const show = span(t, 0.5, 0.9, backOut)
  const hit = span(t, RELEASE + 0.3, RELEASE + 0.35)
  // おちる: じめん まで 41。ぶつかって すこし はずむ
  const fall = span(t, FALL, FALL + 0.55, easeIn)
  const bounce = Math.sin(span(t, FALL + 0.55, FALL + 0.85) * Math.PI) * 3
  const drop = fall * 41 - bounce
  const wiggle = hit > 0 && fall < 1 ? wave(t, 0.15) * 1.4 * (1 - fall) : 0
  const shake = t > HOP_START && t < HOP_END ? wave(t, 0.45) * 0.8 : 0
  return (
    <Layer opacity={show} x={wiggle + shake} y={drop} scale={Math.max(0, show)} origin={[96, 53]}>
      {/* えだ に つながる へた。おちるとき は へた ごと はなれる */}
      <path d="M96 45 Q96 48 96 49.5" stroke={BARK_DARK} strokeWidth="1" strokeLinecap="round" fill="none" opacity={1 - fall} />
      <path d="M96.6 46.4 q3 -2.2 4 0.4 q-2.2 1.6 -4 -0.4 Z" fill={LEAF_DARK} />
      <circle cx="96" cy="53" r="4.2" fill={APPLE} />
      <path d="M92.6 51.4 q0.6 -2.2 2.6 -2.8" stroke="#ff9a8f" strokeWidth="1.1" strokeLinecap="round" fill="none" />
      <path d="M99.4 54 q-0.6 2.6 -3 3.4" stroke={APPLE_DARK} strokeWidth="1" strokeLinecap="round" fill="none" />
    </Layer>
  )
}

type Mood = 'hungry' | 'sad' | 'idea' | 'aim' | 'happy'

type ArmProps = { readonly hand: Pt; readonly side: number; readonly color: string; readonly withHand?: boolean }

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。 */
function Arm({ hand, side, color, withHand = true }: ArmProps) {
  const target = reachable(hand)
  const e = elbowOf(target, side)
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${e[0]} ${e[1]} L${target[0]} ${target[1]}`} fill="none" stroke={color} strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
      {withHand ? <circle cx={target[0]} cy={target[1]} r="3.3" fill={SKIN} /> : null}
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="53.2" cy="52.4" r="2" fill="#ff9d9d" opacity="0.55" />
      {mood === 'happy' ? (
        <>
          <path d="M50.7 49.2 Q52.5 46.8 54.3 49.2" fill="none" stroke="#2b2b2b" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M51.4 52.6 Q54 57.4 56 52.6 Z" fill="#b9483f" />
        </>
      ) : null}
      {mood === 'sad' ? (
        <>
          <path d="M50.3 45.6 l4.2 -1.4" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="52.6" cy="48.6" r="1.15" fill="#2b2b2b" />
          <path d="M51.4 55.6 Q53.6 53.2 55.8 55.2" fill="none" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
        </>
      ) : null}
      {mood === 'hungry' ? (
        <>
          <circle cx="53" cy="47.6" r="1.3" fill="#2b2b2b" />
          <ellipse cx="54.6" cy="53.8" rx="1.5" ry="2" fill="#b9483f" />
        </>
      ) : null}
      {mood === 'idea' ? (
        <>
          <circle cx="52.8" cy="48.4" r="1.5" fill="#2b2b2b" />
          <circle cx="53.3" cy="47.9" r="0.5" fill="#ffffff" />
          <path d="M51.8 53 Q54 55.6 56 53" fill="none" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
        </>
      ) : null}
      {mood === 'aim' ? (
        <>
          <path d="M50.4 45.6 l4 1.4" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M51 48.8 h3" stroke="#2b2b2b" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M52 53.8 h3.2" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
        </>
      ) : null}
    </>
  )
}

type ArcherProps = {
  readonly t: number
  readonly step: number
  readonly mood: Mood
  readonly headTilt: number
  readonly nearHand: Pt
  readonly nearSide: number
  readonly farHand: Pt
  readonly farSide: number
  readonly bend: number
  readonly bowScale: number
  readonly stringGrow: number
  readonly pull: number
  readonly arrowScale: number
  readonly showFarHand: boolean
}

/** 弓の ひもを ひいている(ひく ほど、つがえる ところが ひだりへ) */
function BowAndString({ bend, bowScale, stringGrow, pull }: Pick<ArcherProps, 'bend' | 'bowScale' | 'stringGrow' | 'pull'>) {
  const [c1, c2] = bowControls(bend)
  const wood = `M${BOW_TOP[0]} ${BOW_TOP[1]} C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${BOW_BOTTOM[0]} ${BOW_BOTTOM[1]}`
  const mid = bowPoint(bend, 0.5)
  const midAngle = bowAngle(bend, 0.5)
  const nock: Pt = [NOCK_REST[0] - pull * NOCK_PULL, NOCK_REST[1]]
  const stringPath = pull === 0 ? `M${BOW_TOP[0]} ${BOW_TOP[1]} L${BOW_BOTTOM[0]} ${BOW_BOTTOM[1]}` : `M${BOW_TOP[0]} ${BOW_TOP[1]} L${nock[0]} ${nock[1]} L${BOW_BOTTOM[0]} ${BOW_BOTTOM[1]}`
  return (
    <>
      <Layer scale={bowScale} origin={mid}>
        <path d={wood} fill="none" stroke={BARK_DARK} strokeWidth="3.8" strokeLinecap="round" />
        <path d={wood} fill="none" stroke={WOOD} strokeWidth="2.7" strokeLinecap="round" />
        <path d={wood} fill="none" stroke={WOOD_LIGHT} strokeWidth="0.9" strokeLinecap="round" transform="translate(-0.6 -0.5)" />
        {/* まんなかの にぎり(てが すべらない よう、ぬのを まく) */}
        <rect x={mid[0] - 2.6} y={mid[1] - 4.6} width="5.2" height="9.2" rx="1.8" fill={TUNIC_DARK} transform={`rotate(${midAngle - 90} ${mid[0]} ${mid[1]})`} />
        {/* 先たんの ひもが かかる ところ */}
        <circle cx={BOW_TOP[0]} cy={BOW_TOP[1]} r="1.9" fill={BARK_DARK} />
        <circle cx={BOW_BOTTOM[0]} cy={BOW_BOTTOM[1]} r="1.9" fill={BARK_DARK} />
      </Layer>
      {stringGrow > 0 ? <path d={stringPath} fill="none" stroke={STRING} strokeWidth="0.9" strokeLinecap="round" pathLength={1} strokeDasharray={stringGrow < 1 ? `${stringGrow} 2` : undefined} /> : null}
    </>
  )
}

function ArrowShape() {
  return (
    <>
      <path d="M0 0 H28" stroke="#b58850" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M26.6 -2 L31.4 0 L26.6 2 Z" fill="#9aa4ae" />
      <path d="M0 0 l-2.4 -2.4 h3.2 l1.8 2.4 l-1.8 2.4 h-3.2 Z" fill={APPLE} />
    </>
  )
}

/** 男の子(右むき)。手前の うで が 弓を もち、むこうの うで が ひもを ひく。 */
function Archer(props: ArcherProps) {
  const { step, mood, headTilt, nearHand, nearSide, farHand, farSide, bend, bowScale, stringGrow, pull, arrowScale, showFarHand } = props
  const nock: Pt = [NOCK_REST[0] - pull * NOCK_PULL, NOCK_REST[1]]
  return (
    <>
      {/* むこうの うで: 体の うしろ。手は ひもの ところ(あとで 手前に かさねる) */}
      <Arm hand={farHand} side={farSide} color={TUNIC_FAR} withHand={false} />
      {/* あし(あるくとき かわりばんこに ふる) */}
      <Layer rotate={step * 17} origin={[48, 78]}>
        <rect x="46.2" y="76" width="5.6" height="18" rx="2.8" fill={PANTS_DARK} />
        <ellipse cx="50.4" cy="94.4" rx="4.8" ry="2.4" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 17} origin={[44, 78]}>
        <rect x="40.8" y="76" width="5.6" height="18" rx="2.8" fill={PANTS} />
        <ellipse cx="45" cy="94.4" rx="4.8" ry="2.4" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう と あたま の間 */}
      <rect x="45" y="53" width="5" height="9" rx="2.2" fill={SKIN_SHADE} />
      {/* どう */}
      <rect x="40" y="58" width="14" height="24" rx="7" fill={TUNIC} />
      <path d="M41.6 76 h10.8" stroke={TUNIC_DARK} strokeWidth="1.4" strokeLinecap="round" />
      {/* 弓と ひも・やを つがえた ところ(手の うしろ) */}
      <BowAndString bend={bend} bowScale={bowScale} stringGrow={stringGrow} pull={pull} />
      {arrowScale > 0 ? (
        <Layer x={nock[0]} y={nock[1]} scale={arrowScale} origin={[14, 0]}>
          <ArrowShape />
        </Layer>
      ) : null}
      {/* てまえの うで: 弓の にぎり を もつ */}
      <Arm hand={nearHand} side={nearSide} color={TUNIC_DARK} />
      {/* あたま */}
      <Layer rotate={headTilt} origin={[47.5, 56]}>
        <circle cx="47.5" cy="49" r="8.6" fill={SKIN} />
        <path d="M38.9 50 C37.4 38.8 50 36 55.6 43.4 C50.4 41.8 44.6 44 43.2 51 C41.8 53.4 39.8 52.8 38.9 50 Z" fill={HAIR} />
        <path d="M44 40.6 Q45 37.4 46.8 39.4 Q48 36.6 49 39.6" fill="none" stroke={HAIR} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <Face mood={mood} />
      </Layer>
      {/* ひもを ひく 手(ひもの うえ・あたまの まえ) */}
      {showFarHand ? <circle cx={reachable(farHand)[0]} cy={reachable(farHand)[1]} r="3.3" fill={SKIN} /> : null}
    </>
  )
}

/** しょんぼり の あせ・ひらめき の ひかり・ひゅっ の すじ・ほこり などの 小さな にぎやかし */
function SweatDrop({ t }: SceneProps) {
  const show = during(t, SAD, TURN_BACK + 0.1, 0.2)
  if (show <= 0) return null
  const p = span(t, SAD, TURN_BACK + 0.1)
  return <path d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" opacity={show} transform={`translate(${60 + TREE_SIDE_X} ${44 + p * 7})`} />
}

function IdeaBulb({ t }: SceneProps) {
  const show = during(t, TURN_BACK, FACE_RIGHT + 0.4, 0.2)
  if (show <= 0) return null
  const pop = span(t, TURN_BACK, TURN_BACK + 0.3, backOut)
  const x = 47 + TREE_SIDE_X * (1 - span(t, TURN_BACK, WALK_BACK_END, easeInOut))
  return (
    <Layer opacity={show} x={x} y={-wave(t, 0.5) * 0.8} scale={Math.max(0, pop)} origin={[0, 28]}>
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x="-0.5" y="13" width="1" height="3" rx="0.5" fill={SUN} transform={`rotate(${-75 + i * 30} 0 24)`} />
      ))}
      <circle cx="0" cy="24" r="4.2" fill={SUN} />
      <circle cx="-1.2" cy="22.6" r="1.3" fill="#fff3b0" />
      <rect x="-2" y="27.6" width="4" height="2.6" rx="0.8" fill="#9aa4ae" />
    </Layer>
  )
}

/** ひゅっ: やが とぶ ときの すじ */
function Swoosh({ t }: SceneProps) {
  const show = during(t, RELEASE, RELEASE + 0.3, 0.1)
  if (show <= 0) return null
  return (
    <g opacity={show} stroke="#ffffff" strokeWidth="1" strokeLinecap="round">
      <path d="M62 51.5 h9" />
      <path d="M60 55 h11" />
      <path d="M62 58.5 h9" />
    </g>
  )
}

/** りんごが じめんに おちた ときの ほこり */
function Dust({ t }: SceneProps) {
  const p = span(t, FALL + 0.5, FALL + 1.1)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p} fill="#ffffff" stroke="#d9e3d0" strokeWidth="0.5">
      <circle cx={92 - p * 4} cy={95 - p * 3} r={1.4 + p * 1.6} />
      <circle cx={100 + p * 4} cy={95 - p * 3} r={1.2 + p * 1.6} />
    </g>
  )
}

/** やが りんごに ささって いっしょに おちる(やは ひだりへ とびだした まま) */
function FlyingArrow({ t }: SceneProps) {
  if (t < RELEASE) return null
  const fly = span(t, RELEASE, RELEASE + 0.3)
  const fall = span(t, FALL, FALL + 0.55, easeIn)
  const bounce = Math.sin(span(t, FALL + 0.55, FALL + 0.85) * Math.PI) * 3
  // しっぽの いち: ひもを はなれて りんごに ささる まで
  const tailX = NOCK_REST[0] - NOCK_PULL + fly * (65 - (NOCK_REST[0] - NOCK_PULL))
  return (
    <g transform={`translate(${tailX} ${NOCK_REST[1] - fly * 2 + fall * 41 - bounce}) rotate(${-3 * (1 - fall)})`}>
      <ArrowShape />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 3)

  // あるく: はじめ(右へ)と、ひらめいた あと(もとの ばしょへ ひだり むき)
  const walkX = -50 + (TREE_SIDE_X + 50) * span(t, 0.1, ENTER_END, easeOut) - TREE_SIDE_X * span(t, TURN_BACK + 0.3, WALK_BACK_END, easeInOut)
  const moving = Math.max(during(t, 0.1, ENTER_END, 0.1), during(t, TURN_BACK + 0.3, WALK_BACK_END, 0.1))
  const stride = Math.sin(t * 11.5) * moving
  const facing = 1 - 2 * span(t, TURN_BACK, TURN_BACK + 0.3) + 2 * span(t, WALK_BACK_END, FACE_RIGHT)
  // ぴょんぴょん(りんごに とどかない)と、よろこびの ジャンプ
  const hop1 = t >= HOP_START && t <= HOP_END ? -Math.abs(Math.sin(((t - HOP_START) * Math.PI) / 0.45)) * 5 : 0
  const hop2 = t >= CHEER && t <= CHEER + 0.8 ? -Math.abs(Math.sin(((t - CHEER) * Math.PI) / 0.4)) * 4 : 0
  const hop = hop1 + hop2

  const mood: Mood = t < HOP_END ? 'hungry' : t < TURN_BACK ? 'sad' : t < NOCK ? 'idea' : t < RELEASE + 0.3 ? 'aim' : 'happy'
  const headTilt = t < HOP_END ? -4 - 6 * during(t, HOP_START, HOP_END, 0.15) : t < TURN_BACK ? 7 : 0

  // 弓: まっすぐ な えだ が、ひもを はると ぐにゃり と しなる
  const bend = span(t, BEND, BEND + 0.8, easeInOut)
  const bowScale = span(t, STICK, STICK + 0.35, backOut)
  const stringGrow = span(t, TIE, TIE + 0.4)
  const drawn = span(t, NOCK, NOCK + 0.6, easeInOut)
  const released = span(t, RELEASE, RELEASE + 0.08)
  // はなした あと、ひもが ぶるぶる ふるえる
  const twang = released > 0 ? Math.cos((t - RELEASE) * 60) * Math.max(0, 1 - (t - RELEASE) / 0.35) * 0.35 : 0
  const pull = Math.max(0, drawn * (1 - released) + twang * released)
  const arrowScale = t >= NOCK && t < RELEASE ? Math.max(0, span(t, NOCK, NOCK + 0.2, backOut)) : 0

  // うで
  const handGrip = bowPoint(bend, 0.5)
  const hang = (swing: number): Pt => [SHOULDER[0] + swing * 8, SHOULDER[1] + 31]
  const reach = during(t, HOP_START - 0.05, HOP_END + 0.05, 0.15)
  const up: Pt = [SHOULDER[0] + 17, SHOULDER[1] - 33 + wave(t, 0.45) * 2]
  const grip = span(t, STICK - 0.1, STICK + 0.3, easeOut)
  const nearBase = lerpPt(hang(-stride), up, reach)
  const nearHand = lerpPt(nearBase, handGrip, grip)
  const nearSide = -1 + 2 * grip
  const nockPos: Pt = [NOCK_REST[0] - pull * NOCK_PULL, NOCK_REST[1]]
  const farRaw = lerpPt(hang(stride), up, reach)
  const farDraw = lerpPt(farRaw, nockPos, span(t, NOCK, NOCK + 0.5, easeOut))
  const farRecoil = lerpPt(farDraw, hang(0), span(t, RELEASE, RELEASE + 0.5, easeOut))
  const cheerUp: Pt = [SHOULDER[0] + 12, SHOULDER[1] - 34 + wave(t, 0.4) * 2.5]
  const farHand = lerpPt(farRecoil, cheerUp, during(t, CHEER - 0.1, CHEER + 1.0, 0.2))
  const showFarHand = true

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Tree t={t} />
        <Apple t={t} />
        <Layer opacity={span(t, 0.1, 0.25)}>
          <ellipse cx={47 + walkX} cy="97.4" rx="9" ry="2.4" fill="#000000" opacity="0.12" />
          <Layer x={walkX} y={hop}>
            <Layer scaleX={facing} origin={[47, 60]}>
              <Archer
                t={t}
                step={stride}
                mood={mood}
                headTilt={headTilt}
                nearHand={nearHand}
                nearSide={nearSide}
                farHand={farHand}
                farSide={-1}
                bend={bend}
                bowScale={bowScale}
                stringGrow={stringGrow}
                pull={pull}
                arrowScale={arrowScale}
                showFarHand={showFarHand}
              />
            </Layer>
          </Layer>
        </Layer>
        <FlyingArrow t={t} />
        <Swoosh t={t} />
        <Dust t={t} />
        <SweatDrop t={t} />
        <IdeaBulb t={t} />
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
    { at: 0, label: 'りんごの木が そだつ', sound: 'pop' },
    { at: HOP_START, label: '男の子が とびはねるけど りんごに とどかない' },
    { at: SAD, label: 'しょんぼり。「そうだ!」と ひらめく', sound: 'pop' },
    { at: STICK, label: 'まっすぐな えだを もつ' },
    { at: BEND, label: 'ひもを はると、えだが ぐにゃり としなる', sound: 'pop' },
    { at: NOCK, label: 'やを つがえて ひく' },
    { at: RELEASE, label: 'ひゅっ! りんごに あたって おちる', sound: 'ok' },
    { at: CHEER, label: '大よろこび' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '弓 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
