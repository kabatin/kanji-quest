/*
 * 新(あたらしい): おので 木を きると、きりくち が ぴかぴかの あたらしい色。(共通部品 sceneFigures で 書きなおした もの)
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
 * 子は Person(左むき。あるきは walk)。おのの 柄は 両手で にぎる:
 *   てまえの 手を おのの 位置に { to } で おき、むこうの 手は 柄の もと(手の うしろ)に { to }。
 *   おのは held(むこうの 手 と てまえの 手 の あいだ)に 描く ので、手が おのの 柄を つかんで 見える。
 *   木は、きりくち(おのの あと)が ある ので ここで 描く(みき・えだ は Bone)。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, span, wave, type Ease, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Bone, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, Bird, LOOKS, PALETTE, Person, personRig, Sweat, walk, type PersonProps, type Point } from '../sceneFigures'

const CHAR = '新'

const BARK = PALETTE.bark
const BARK_DARK = '#70452b'
const FRESH = '#f7e0a3'
const FRESH_DARK = '#e6bf6a'
const LEAF = PALETTE.leaf
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const STEEL = '#9aa5b4'
const STEEL_DARK = '#7c8798'
const STEEL_EDGE = '#e4ebf2'
const HANDLE = '#b07a4a'
/** 元の 子の 服(だいだい の うわぎ・あおい ズボン) */
const KID_LOOK = { ...LOOKS.boy, top: '#e8743b', bottom: '#4a6d8c' } as const

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

/** 子の 背の高さ と、立つ ばしょ */
const KID_HEIGHT = 62
const STAND_X = 70
const FLOOR = 95

/** 木の みき の まんなか と、おのを うちこむ たかさ */
const TRUNK_X = 35.7
const TRUNK_EDGE = 40.2
const CHOP_Y = 73

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
function Sparrow({ t }: SceneProps) {
  const appear = span(t, 0.9, 1.2)
  if (appear <= 0) return null
  const flee = span(t, HIT1 - 0.02, HIT1 + 1.2, easeIn)
  const fled = flee > 0
  const x = 46 - flee * 60
  const y = 44.6 - flee * 40 - Math.sin(flee * Math.PI) * 6
  const hop = fled ? 0 : Math.max(0, wave(t, 0.9)) * 0.8
  return (
    <Layer opacity={appear * (1 - span(flee, 0.85, 1))}>
      <Bird x={x} y={y - hop} t={t} flying={fled} facing="left" color="#ff9a5c" dark="#e2733f" />
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
 * gx は 子の こし(x)から、gy は 画面の上から の手の ばしょ。
 */
const AXE_KEYS: readonly AxeKey[] = [
  { at: 0, phi: 160, gx: -4, gy: 60 },
  { at: ARRIVE + 0.1, phi: 160, gx: -4, gy: 60 },
  { at: 2.95, phi: 100, gx: 11, gy: 42, ease: easeInOut },
  { at: 3.1, phi: 100, gx: 11, gy: 42 },
  { at: HIT1, phi: -6, gx: -7, gy: 66, ease: easeIn },
  { at: HIT1 + 0.15, phi: -6, gx: -7, gy: 66 },
  { at: 4.25, phi: 100, gx: 11, gy: 42, ease: easeInOut },
  { at: 4.38, phi: 100, gx: 11, gy: 42 },
  { at: HIT2, phi: -6, gx: -7, gy: 66, ease: easeIn },
  { at: HIT2 + 0.15, phi: -6, gx: -7, gy: 66 },
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

/** 子の 場所と かっこう。ちゅうで おのの 位置に 手を { to } で おく */
function kidAt(t: number): PersonProps {
  const walking = walk(t, { from: 124, to: STAND_X, start: ENTER, end: ARRIVE, build: 'child', height: KID_HEIGHT })
  // おのを うつ ひょうしに、体が まえへ しずむ
  const swing = (hit: number) => span(t, hit - 0.05, hit, easeOut) * (1 - span(t, hit, hit + 0.3))
  const strike = Math.max(swing(HIT1), swing(HIT2))
  const hop = t > GLAD && t < GLAD + 0.9 ? Math.abs(Math.sin(((t - GLAD) / 0.45) * Math.PI)) * 2.6 : 0
  const mood =
    t >= GLAD ? 'joy' : t >= NOTICE ? 'surprised' : t >= TIRED ? 'worried' : (t >= HIT1 - 0.45 && t < HIT1 + 0.2) || (t >= HIT2 - 0.45 && t < HIT2 + 0.2) ? 'strain' : 'normal'
  const axe = axePose(t)
  const x = walking.x
  const base: PersonProps = {
    ...walking,
    y: FLOOR,
    look: KID_LOOK,
    lift: hop,
    face: mood,
    opacity: span(t, ENTER - 0.1, ENTER + 0.2),
    pose: { ...walking.pose, torso: 10 * strike, head: t >= NOTICE ? -6 : -5 * strike },
  }
  // 手の とどく ところに おさめる(1回 かたちを つくって、手の さきを たしかめる)
  const near: PersonProps = { ...base, pose: { ...base.pose, rightArm: { to: [x + axe.gx, axe.gy] } } }
  const hand = personRig(near).world.arms.right.end
  const rad = (axe.phi * Math.PI) / 180
  const back: Point = [hand[0] + Math.cos(rad) * 3.5, hand[1] + Math.sin(rad) * 3.5]
  return { ...near, pose: { ...near.pose, rightArm: { to: hand }, leftArm: { to: back } } }
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 13)
  const kid = kidAt(t)
  const rig = personRig(kid)
  const hand = rig.world.arms.right.end
  const axe = axePose(t)
  const head = rig.world.head
  const headR = rig.body.headR * rig.scale
  const held = (
    <Layer x={hand[0]} y={hand[1]} rotate={axe.phi}>
      <Axe />
    </Layer>
  )

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[98, 10.5]} clouds={[]} tufts={[6, 24, 52, 92, 104]} />
        <Tree t={t} />
        <Sparrow t={t} />
        <FallingLeaves t={t} />
        <Glint t={t} />
        <Person {...kid} held={held} />
        <Sweat t={t} x={head[0] + headR} y={head[1] - headR * 0.4} show={during(t, TIRED, NOTICE + 0.1, 0.15)} />
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
