/*
 * 新(あたらしい): おので 木を きると、きりくち が ぴかぴかの あたらしい色。
 *
 * ほね(画と絵の対応)
 *   1〜4画目   … 木の 上の しげみ(葉っぱの かたまり)
 *   5・6画目   … 木の よこに のびた 2本の えだ
 *   7画目(丨)  … 木の みき(おのを うちこむ ところ)
 *   8画目      … 左に たれた 下の えだ
 *   9画目      … おのが あたって とびちる 木くず(の むき)
 *   10画目(ノ) … おのの 刃(は)
 *   11画目     … おのの 柄(え)
 *   12・13画目 … 右がわの 子の うで と 体
 *   (おの と 子は、字と ぴったり重ならなくてよい。右はんぶんに 立っている)
 *
 * ながれ
 *   木が そだつ → おのを かついだ 子が やってくる(木を きる ぞ、と まじめな顔)
 *   → おのを ふりあげて、かーん。小鳥が おどろいて にげる。もう 1かい、かーん。木くずが とぶ
 *   → ふう、と つかれる → 木の きりくち が ぴかぴか あたらしい色! 子が びっくり、そして にっこり
 *   → ほね が ひかって、絵が うすくなり、字「新」が のこる
 *
 * 子は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(かた と 手 の 場所から ひじ を計算する)。
 *   おの は 柄(え)の さきに 刃(は)が ついて、ふりおろすと 刃が 木を むく。
 *   木を きる と、きりくち は 木の はだ より あかるい 木の中の色 になる。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type Ease, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Bone, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '新'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#e8743b'
const TUNIC_DARK = '#d4622c'
const TUNIC_FAR = '#b5521f'
const PANTS = '#4a6d8c'
const PANTS_DARK = '#3d5c78'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const FRESH = '#f7e0a3'
const FRESH_DARK = '#e6bf6a'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const STEEL = '#9aa5b4'
const STEEL_DARK = '#7c8798'
const STEEL_EDGE = '#e4ebf2'
const HANDLE = '#b07a4a'

/** くぎり の時間(秒) */
const ENTER = 0.7
const ARRIVE = 2.2
/** おのが 木に あたる しゅんかん(1かいめ・2かいめ) */
const HIT1 = 3.4
const HIT2 = 4.65
/** つかれる → きりくち に気づく → よろこぶ */
const TIRED = 4.9
const NOTICE = 5.35
const GLAD = 5.75
const INK = 6.5
const DONE = 9.7
const DURATION = 10.4

/** 子の おおきさ(休の 人を ちいさく した もの)と、立つ ばしょ */
const S = 0.8
const STAND_X = 70
const FEET_LOCAL: readonly [number, number] = [27.5, 94]
const FLOOR = 95
/** うで の ほね1本の長さ(かた→ひじ、ひじ→手) */
const ARM_LEN = 10.4

/** 木の みき の まんなか と、おのを うちこむ たかさ */
const TRUNK_X = 35.7
const TRUNK_EDGE = 40.2
const CHOP_Y = 73

type Point = readonly [number, number]

function Ground() {
  return (
    <>
      {/* お日さまは 右の上(おのの 刃と ぶつからない すみ) */}
      <g>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="97.2" y="1.2" width="1.6" height="3.6" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 98 10.5)`} />
        ))}
      </g>
      <circle cx="98" cy="10.5" r="5.4" fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 24, 52, 92, 104].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** おのが あたった あと の きりくち(V の かたち)。ふかさ depth は 0 〜 6 */
function Notch({ depth, shine }: { readonly depth: number; readonly shine: number }) {
  if (depth <= 0) return null
  const half = 2 + depth * 0.9
  const tipX = TRUNK_EDGE - depth
  return (
    <>
      <path d={`M${TRUNK_EDGE + 0.2} ${CHOP_Y - half} L${tipX} ${CHOP_Y} L${TRUNK_EDGE + 0.2} ${CHOP_Y + half} Z`} fill={shine > 0 ? FRESH : '#e9cd8c'} />
      <path d={`M${TRUNK_EDGE + 0.2} ${CHOP_Y - half} L${tipX} ${CHOP_Y} L${TRUNK_EDGE + 0.2} ${CHOP_Y + half}`} fill="none" stroke={FRESH_DARK} strokeWidth="1" strokeLinejoin="round" />
      {/* きりくち の とし の わ(木の中の すじ) */}
      <path d={`M${TRUNK_EDGE - 0.4} ${CHOP_Y - half * 0.45} L${tipX + depth * 0.35} ${CHOP_Y} L${TRUNK_EDGE - 0.4} ${CHOP_Y + half * 0.45}`} fill="none" stroke={FRESH_DARK} strokeWidth="0.6" strokeLinejoin="round" opacity="0.8" />
    </>
  )
}

function Tree({ t }: SceneProps) {
  // みき が下から のびて、えだ が ひろがり、さいごに 葉が ぽん と しげる
  const trunk = span(t, 0, 0.55, backOut)
  const boughs = span(t, 0.3, 0.75, backOut)
  const leaves = span(t, 0.45, 0.95, backOut)
  const sway = wave(t, 3.4) * 1
  // おのが あたるたびに、木が ぶるっと ゆれる
  const shakeOf = (hit: number) => (t < hit ? 0 : Math.sin((t - hit) * 38) * 1.3 * Math.exp(-(t - hit) * 6))
  const shake = shakeOf(HIT1) + shakeOf(HIT2)
  const depth = 3 * span(t, HIT1, HIT1 + 0.08) + 3 * span(t, HIT2, HIT2 + 0.08)
  const shine = span(t, NOTICE - 0.2, NOTICE + 0.2)
  return (
    <Layer rotate={shake} origin={[TRUNK_X, 95]}>
      <ellipse cx={TRUNK_X + 1} cy="97.6" rx={18 * trunk} ry="3" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.6 + 0.4 * trunk} scaleY={trunk} origin={[TRUNK_X, 96]}>
        <path d="M27.5 97 Q33 91.5 32 83 L39.8 83 Q39 91 44.5 97 Z" fill={BARK} />
        <rect x="31.2" y="38" width="9" height="20" fill={BARK} />
        <Bone char={CHAR} n={7} color={BARK} width={9} />
        <path d="M33.6 56 q1.4 4.4 0 9 M38 84 q-1.2 4 0.3 8" fill="none" stroke={BARK_DARK} strokeWidth="1.2" strokeLinecap="round" />
        <Notch depth={depth} shine={shine} />
      </Layer>
      {/* 2本の よこえだ と、下に たれた えだ */}
      <Layer scale={boughs} origin={[TRUNK_X, 55]}>
        <Bone char={CHAR} n={5} color={BARK} width={3.2} />
        <Bone char={CHAR} n={6} color={BARK} width={3.2} />
        <Bone char={CHAR} n={8} color={BARK} width={3.2} />
      </Layer>
      <Layer scale={leaves} rotate={sway * 0.8} origin={[TRUNK_X, 55]}>
        {/* えだの先の 小さな はっぱ */}
        {([[14.5, 51], [54, 48], [17, 63.4], [52, 60.6], [14.5, 86.5]] as readonly Point[]).map(([cx, cy]) => (
          <g key={`${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r="4.6" fill={LEAF_DARK} />
            <circle cx={cx - 0.8} cy={cy - 1} r="3.2" fill={LEAF} />
          </g>
        ))}
      </Layer>
      {/* 上の しげみ: 風で ゆっくり ゆれる */}
      <Layer scale={leaves} rotate={sway} origin={[TRUNK_X, 48]}>
        <circle cx="23" cy="34" r="11.5" fill={LEAF_DARK} />
        <circle cx="48" cy="32" r="11.5" fill={LEAF_DARK} />
        <circle cx="35.5" cy="22" r="14" fill={LEAF_DARK} />
        <circle cx="29" cy="32" r="9.5" fill={LEAF} />
        <circle cx="43.5" cy="30" r="9.5" fill={LEAF} />
        <circle cx="35.5" cy="20" r="10.5" fill={LEAF} />
        <circle cx="29" cy="14.5" r="4.4" fill={LEAF_LIGHT} />
        <circle cx="46" cy="22" r="3.2" fill={LEAF_LIGHT} />
        <circle cx="22" cy="39" r="2.2" fill="#e8534a" />
        <circle cx="49" cy="38" r="2.2" fill="#e8534a" />
      </Layer>
    </Layer>
  )
}

/** 小鳥: えだ に とまっている。1かいめの かーん で おどろいて、左上へ にげる。 */
function Bird({ t }: SceneProps) {
  const appear = span(t, 0.9, 1.2)
  if (appear <= 0) return null
  const flee = span(t, HIT1 - 0.02, HIT1 + 1.2, easeIn)
  const fled = flee > 0
  const x = 46 - flee * 60
  const y = 44.6 - flee * 40 - Math.sin(flee * Math.PI) * 6
  const hop = fled ? 0 : Math.max(0, wave(t, 0.9)) * 0.8
  const flap = fled ? wave(t, 0.14) * 32 : 0
  return (
    <Layer x={x} y={y - hop} opacity={appear * (1 - span(flee, 0.85, 1))}>
      <path d="M2.6 0.4 l4.6 -1.6 l-3.4 3.2 Z" fill="#e2733f" />
      <ellipse cx="0" cy="0" rx="4" ry="3.1" fill="#ff9a5c" />
      <circle cx="-3" cy="-2.3" r="2.3" fill="#ff9a5c" />
      <path d="M-5 -2.4 l-2.4 0.7 l2.3 0.9 Z" fill="#f2b632" />
      <circle cx="-3.6" cy="-2.8" r="0.55" fill="#2b2b2b" />
      <Layer rotate={flap} origin={[0.4, -0.6]}>
        <path d="M-1.2 -0.8 Q1.6 -3.8 4 -0.6 Q1.6 0.8 -1.2 -0.8 Z" fill="#e2733f" />
      </Layer>
    </Layer>
  )
}

/** おのが あたった ひょうしに 木から ちる 葉っぱ */
function FallingLeaves({ t }: SceneProps) {
  const leaves: readonly (readonly [hit: number, x0: number, drift: number])[] = [
    [HIT1, 30, 5],
    [HIT1, 45, -4],
    [HIT2, 24, 4],
    [HIT2, 42, -5],
  ]
  return (
    <>
      {leaves.map(([hit, x0, drift], i) => {
        const p = span(t, hit + 0.05 + (i % 2) * 0.15, hit + 1.7)
        if (p <= 0 || p >= 1) return null
        const x = x0 + drift * p * 2 + Math.sin(p * 9 + i) * 4
        const y = 36 + p * 58
        return <path key={i} d="M0 -3.2 Q2.8 0 0 3.2 Q-2.8 0 0 -3.2 Z" fill={LEAF_LIGHT} stroke={LEAF_DARK} strokeWidth="0.5" transform={`translate(${x} ${y}) rotate(${Math.sin(p * 9 + i) * 50 + 20})`} opacity={1 - span(p, 0.85, 1)} />
      })}
    </>
  )
}

/** おのが あたった ところ から とびちる 木くず。ほんの すこし、右うえへ とんで おちる */
const CHIPS: readonly (readonly [vx: number, vy: number, rot: number])[] = [
  [9, 16, 20],
  [15, 11, 70],
  [11, 21, 120],
]

function Chips({ t }: SceneProps) {
  return (
    <>
      {[HIT1, HIT2].flatMap((hit) =>
        CHIPS.map(([vx, vy, rot], j) => {
          const p = (t - hit - 0.04) / 0.7
          if (p <= 0 || p >= 1) return null
          const x = TRUNK_EDGE + 1 + vx * p
          const y = CHOP_Y - vy * p + 36 * p * p
          return <rect key={`${hit}-${j}`} x="-1.7" y="-1" width="3.4" height="2" rx="0.8" fill={FRESH} stroke={FRESH_DARK} strokeWidth="0.4" transform={`translate(${x} ${y}) rotate(${rot + p * 300})`} opacity={1 - p * p} />
        }),
      )}
    </>
  )
}

/* ───────── 子 ───────── */

type Mood = 'ready' | 'effort' | 'tired' | 'wow' | 'happy'

function Face({ mood }: { readonly mood: Mood }) {
  const eye = '#2b2b2b'
  const mouth = '#b9483f'
  switch (mood) {
    case 'ready':
      return (
        <>
          <path d="M23.2 24.2 l3.6 -1.5" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="25.4" cy="25.8" r="1.15" fill={eye} />
          <path d="M22.9 30 h2.8" stroke={mouth} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )
    case 'effort':
      return (
        <>
          <path d="M23.4 24 l3 1.5 l-3 1.5" fill="none" stroke={eye} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx="24.2" cy="30.4" rx="1.6" ry="1.8" fill={mouth} />
        </>
      )
    case 'tired':
      return (
        <>
          <path d="M23.6 23.8 l3 1.2" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="25.4" cy="25.6" r="1.15" fill={eye} />
          <ellipse cx="24.6" cy="30.2" rx="1.3" ry="1.7" fill={mouth} />
        </>
      )
    case 'wow':
      return (
        <>
          <path d="M23.2 21.6 Q25 20.2 26.8 21.6" fill="none" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="25.2" cy="25.2" r="1.9" fill="#ffffff" stroke={eye} strokeWidth="0.6" />
          <circle cx="24.8" cy="25.2" r="0.95" fill={eye} />
          <ellipse cx="24" cy="30.4" rx="1.3" ry="1.8" fill={mouth} />
        </>
      )
    case 'happy':
      return (
        <>
          <path d="M23.6 26.2 Q25.4 23.4 27.2 26.2" fill="none" stroke={eye} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M22.4 29 Q24.8 33.2 27.2 29.2 Z" fill={mouth} stroke={mouth} strokeWidth="0.8" strokeLinejoin="round" />
        </>
      )
  }
}

/** 子の どう・あし・あたま(休の 人と おなじ つくり。うでは 外で つなげる) */
function ChildBody({ step, mood, headTilt }: { readonly step: number; readonly mood: Mood; readonly headTilt: number }) {
  return (
    <>
      <Layer rotate={step * 17} origin={[30, 68]}>
        <rect x="27.2" y="65" width="6.2" height="27.5" rx="3.1" fill={PANTS_DARK} />
        <ellipse cx="28.6" cy="93.4" rx="5.2" ry="2.8" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 17} origin={[25, 68]}>
        <rect x="21.6" y="65" width="6.2" height="27.5" rx="3.1" fill={PANTS} />
        <ellipse cx="23" cy="93.4" rx="5.2" ry="2.8" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう と あたま に かくれる */}
      <rect x="24.8" y="32" width="5.2" height="8" rx="2.4" fill={SKIN_SHADE} />
      <rect x="20.4" y="36.6" width="14" height="34" rx="6.8" fill={TUNIC} />
      <path d="M22.4 62.5 h10" stroke={TUNIC_DARK} strokeWidth="1.6" strokeLinecap="round" />
      <Layer rotate={headTilt} origin={[28, 35]}>
        <g transform="translate(-1.4 0.6)">
          <circle cx="30.2" cy="24.6" r="9.2" fill={SKIN} />
          <path d="M21.5 23 C21.4 13.8 31.8 11.2 37.8 17 C40.2 20.2 40.2 26 38.2 30.2 C37.6 24.4 33.4 20.2 26.6 20.6 C24.4 20.8 22.6 21.8 21.5 23 Z" fill={HAIR} />
          <circle cx="26.5" cy="28.8" r="2.1" fill="#ff9d9d" opacity="0.55" />
          <Face mood={mood} />
        </g>
      </Layer>
    </>
  )
}

/** かた・ひじ・手 の じゅんに つながる うで。ひじ は 手の場所から 計算する(下・うしろへ まがる) */
function elbowOf(shoulder: Point, hand: Point): Point {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const dist = Math.hypot(dx, dy) || 1
  const reach = Math.min(dist, 2 * ARM_LEN - 0.2)
  const bend = Math.sqrt(Math.max(0, ARM_LEN * ARM_LEN - (reach / 2) ** 2))
  const along = reach / 2 / dist
  let px = -dy / dist
  let py = dx / dist
  if (py < 0 || (py === 0 && px < 0)) {
    px = -px
    py = -py
  }
  return [shoulder[0] + dx * along + px * bend, shoulder[1] + dy * along + py * bend]
}

function Arm({ shoulder, hand, color }: { readonly shoulder: Point; readonly hand: Point; readonly color: string }) {
  const elbow = elbowOf(shoulder, hand)
  // 手が とどかないときは、ひじ の ほうこうへ のびきった ところまで
  const limit = 2 * ARM_LEN - 0.2
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const dist = Math.hypot(dx, dy)
  const reachedHand: Point = dist > limit ? [shoulder[0] + (dx / dist) * limit, shoulder[1] + (dy / dist) * limit] : hand
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${reachedHand[0]} ${reachedHand[1]}`} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={reachedHand[0]} cy={reachedHand[1]} r="2.9" fill={SKIN} />
    </>
  )
}

/** おの: 手の ところ(0,0)から、左へ 柄(え)。柄の さきに 刃(は)。刃は 柄の「下がわ」に ひろがる。 */
function Axe() {
  return (
    <>
      <path d="M4 0 H-20" stroke={HANDLE} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M-17 -2.6 L-22.6 -2.6 Q-23.4 -0.4 -23.6 2 Q-26.4 6 -25 10 L-17.8 4 Z" fill={STEEL} />
      <path d="M-17 -2.6 L-22.6 -2.6 L-22.4 -0.6 L-17 -0.6 Z" fill={STEEL_DARK} />
      <path d="M-23.6 2 Q-26.4 6 -25 10" fill="none" stroke={STEEL_EDGE} strokeWidth="1.1" strokeLinecap="round" />
    </>
  )
}

type AxeKey = { readonly at: number; readonly phi: number; readonly gx: number; readonly gy: number; readonly ease?: Ease }

/**
 * おのの うごき。phi = 柄が むく角度(0 = 左へ よこ / 90 = 上)。
 * gx は 子の足もとから、gy は 画面の上から の手の ばしょ。
 */
const AXE_KEYS: readonly AxeKey[] = [
  { at: 0, phi: 160, gx: -4, gy: 60 },
  { at: ARRIVE + 0.1, phi: 160, gx: -4, gy: 60 },
  { at: 2.95, phi: 100, gx: 11, gy: 42, ease: easeInOut },
  { at: 3.1, phi: 100, gx: 11, gy: 42 },
  { at: HIT1, phi: -6, gx: -10, gy: 68, ease: easeIn },
  { at: HIT1 + 0.15, phi: -6, gx: -10, gy: 68 },
  { at: 4.25, phi: 100, gx: 11, gy: 42, ease: easeInOut },
  { at: 4.38, phi: 100, gx: 11, gy: 42 },
  { at: HIT2, phi: -6, gx: -10, gy: 68, ease: easeIn },
  { at: HIT2 + 0.15, phi: -6, gx: -10, gy: 68 },
  { at: 5.5, phi: 70, gx: -8, gy: 66, ease: easeInOut },
]

function axePose(t: number): { readonly phi: number; readonly gx: number; readonly gy: number } {
  const last = AXE_KEYS[AXE_KEYS.length - 1]
  if (t >= last.at) return last
  const next = AXE_KEYS.findIndex((key) => key.at > t)
  const from = AXE_KEYS[Math.max(0, next - 1)]
  const to = AXE_KEYS[next]
  const p = span(t, from.at, to.at, to.ease ?? easeInOut)
  return { phi: from.phi + (to.phi - from.phi) * p, gx: from.gx + (to.gx - from.gx) * p, gy: from.gy + (to.gy - from.gy) * p }
}

function Sweat({ t, base }: { readonly t: number; readonly base: Point }) {
  const show = during(t, TIRED, NOTICE + 0.1, 0.15)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.4].map((offset) => {
        const p = ((t + offset) % 0.8) / 0.8
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" transform={`translate(${base[0] + 5 + p * 4} ${base[1] - 3 + p * 8 - Math.sin(p * Math.PI) * 4}) rotate(-35)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** きりくち の まわりの ぴかぴか(あたらしい木の色) */
function Glint({ t }: SceneProps) {
  const show = during(t, NOTICE - 0.15, INK + 0.2, 0.3)
  if (show <= 0) return null
  const pulse = 1 + wave(t, 0.8) * 0.12
  return (
    <g opacity={show}>
      <circle cx={TRUNK_EDGE - 2.4} cy={CHOP_Y} r={9 * pulse} fill="#fff6c4" opacity="0.55" />
      <Star cx={TRUNK_EDGE + 9} cy={CHOP_Y - 11} r={3.4 * pulse} color="#ffd24a" spin={t * 60} />
      <Star cx={TRUNK_EDGE + 12} cy={CHOP_Y + 5} r={2.6 * pulse} color="#ffffff" spin={-t * 70} />
      <Star cx={TRUNK_EDGE - 7} cy={CHOP_Y - 14} r={2.4 * pulse} color="#ffffff" spin={t * 50} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 13)

  // あるく: 右から 木の ほうへ。あしを ふって、体が 上下する
  const walking = 1 - span(t, ARRIVE - 0.3, ARRIVE)
  const stride = t < ENTER ? 0 : Math.sin((t - ENTER) * Math.PI * 2 * 1.8) * walking
  const walkX = mix(t, ENTER, ARRIVE, 124, STAND_X, easeOut)
  // おのを うつ ひょうしに、体が すこし まえへ しずむ
  const swing = (hit: number) => span(t, hit - 0.05, hit, easeOut) * (1 - span(t, hit, hit + 0.3))
  const strike = Math.max(swing(HIT1), swing(HIT2))
  // うれしくて ぴょんと はねる
  const hop = t > GLAD && t < GLAD + 0.9 ? Math.abs(Math.sin(((t - GLAD) / 0.45) * Math.PI)) * 2.6 : 0
  const cx = walkX - 1.5 * strike
  const bob = -Math.abs(stride) * 1.4 + 1.2 * strike - hop

  const mood: Mood =
    t >= GLAD ? 'happy' : t >= NOTICE ? 'wow' : t >= TIRED ? 'tired' : (t >= HIT1 - 0.45 && t < HIT1 + 0.2) || (t >= HIT2 - 0.45 && t < HIT2 + 0.2) ? 'effort' : 'ready'
  const headTilt = t < ARRIVE ? -3 + stride * 2 : t >= NOTICE ? -4 : strike * -5

  // 体の 場所(かた)を 画面の 場所にする
  const shoulder: Point = [cx + (25.4 - FEET_LOCAL[0]) * S, FLOOR + bob + (40 - FEET_LOCAL[1]) * S]
  const axe = axePose(t)
  const hand: Point = [cx + axe.gx, axe.gy + bob]
  const rad = (axe.phi * Math.PI) / 180
  const handleDir: Point = [-Math.cos(rad), -Math.sin(rad)]
  // もうひとつの手は、柄の もとの ほうを にぎる
  const backHand: Point = [hand[0] - handleDir[0] * 3.5, hand[1] - handleDir[1] * 3.5]
  const headCenter: Point = [cx + (28.8 - FEET_LOCAL[0]) * S, FLOOR + bob + (25.2 - FEET_LOCAL[1]) * S]

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground />
        <Tree t={t} />
        <Bird t={t} />
        <FallingLeaves t={t} />
        <Glint t={t} />
        <Layer opacity={span(t, ENTER - 0.1, ENTER + 0.2)}>
          <ellipse cx={cx + 1} cy="97.4" rx="8" ry="2.2" fill="#000000" opacity="0.12" />
          {/* むこうの うで: どう の うしろ */}
          <Arm shoulder={shoulder} hand={backHand} color={TUNIC_FAR} />
          <Layer x={cx - FEET_LOCAL[0]} y={FLOOR - FEET_LOCAL[1] + bob} scale={S} origin={FEET_LOCAL}>
            <ChildBody step={stride} mood={mood} headTilt={headTilt} />
          </Layer>
          <Layer x={hand[0]} y={hand[1]} rotate={axe.phi}>
            <Axe />
          </Layer>
          {/* てまえの うで: おのの 柄を にぎる */}
          <Arm shoulder={shoulder} hand={hand} color={TUNIC_DARK} />
          <Sweat t={t} base={headCenter} />
        </Layer>
        <Chips t={t} />
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
    { at: 0, label: '木が そだつ', sound: 'pop' },
    { at: ENTER, label: 'おのを かついだ 子が やってくる' },
    { at: 2.95, label: 'おのを ふりあげる' },
    { at: HIT1, label: 'かーん! 小鳥が おどろく', sound: 'pop' },
    { at: HIT2, label: 'もう 1かい かーん! 木くずが とぶ', sound: 'pop' },
    { at: TIRED, label: 'ふう、と つかれる' },
    { at: NOTICE, label: 'きりくち が ぴかぴか あたらしい!' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '新 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
