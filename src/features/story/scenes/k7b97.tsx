/*
 * 算(さん): 竹の ぼうを ならべて、数を かぞえる。
 *
 * ほね(画と絵の対応)
 *   1〜6画目   … 竹(たけ)。たけの みき(まんなか)から のびた えだ に、はが たれる(左に 3まい・右に 3まい)
 *   7画目(丨)  … ぼうを ならべる だい(かご)の 左の はしら
 *   8画目      … だい の 上の よこぼう と 右の はしら
 *   9〜11画目  … だい に ならべた 3ぼんの 竹の ぼう(上から 1ぽん・2ひき…ではなく 3ぼん)
 *   12画目(一) … つくえ の てんばん
 *   13・14画目 … つくえ の あし(左は すこし ひらく)
 *
 * ながれ
 *   竹が のびて、つくえと だい が でる → 子どもが 右から あるいてきて、ぼうの たばを 見て こまる(はてな)
 *   → ぼうを 1ぽん ずつ だいに ならべる。ならべるたびに、ふきだしの 点が 1つ ふえる(1・2・3)
 *   → 3ぼん ならんだ。「さん!」と かぞえおわって、うれしくて とびはねる
 *   → ほね が ひかって、絵が うすくなり、字「算」が のこる
 *
 *
 * 子どもは Person(共通部品)。左むき。あるきは walk、ぼうを つかむ手は { to }。
 * つくえは 子どもの held に わたして、体の まえ・てまえの うでの うしろに 置く(子どもは つくえの むこうに 立つ)。
 * 空と おかは Backdrop、あせは Sweat。竹・だい・ぼう・ふきだしは ここで 描く。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, LOOKS, mixLimb, Person, posture, Sweat, walk, type Limb, type PersonProps } from '../sceneFigures'

const CHAR = '算'

const WOOD = '#c98f56'
const WOOD_LIGHT = '#dca36a'
const WOOD_DARK = '#a8743f'
const PANEL = '#fbefcf'
const STALK = '#62b36e'
const STALK_DARK = '#4a9a58'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const ROD = '#b9d36b'
const ROD_LIGHT = '#d6e8a0'
const ROD_DARK = '#8fae48'
const SHIRT = '#ef7f5a'
const BUBBLE_LINE = '#c9d6e6'
const BUBBLE_INK = '#6b7fb8'

/** くぎり の時間(秒) */
const WALK_FROM = 0.4
const WALK_TO = 1.1
/** 1ぽんめの ぼうを とりはじめる。1ぽん ごとに STEP 秒 */
const WORK = 2.4
const STEP = 1.15
/** ぼうに 手を のばす / はこぶ(STEP との合計が STEP になる。のこりは 手を もどす時間) */
const GRAB = 0.3
const CARRY = 0.55
/** 3ぼん ならべおえて、よろこぶ */
const CHEER = 5.9
const INK = 7.3
const DONE = 10.4
const DURATION = 11

type Pt = readonly [number, number]

/* ───────── だい と ぼう の 場所(絵の座標) ───────── */

/** ぼうの 左はし の x、長さ、あつさ(7画目・8画目の はしらの あいだ に ぴったり おさまる) */
const ROD_X = 34.5
const ROD_LEN = 39
const ROD_H = 3.6
/** 子どもが つかむ ところ: ぼうの 右はし から すこし 中(ぼうの なかの x) */
const GRIP_IN_ROD = ROD_LEN - 2.9
/** だい に ならぶ 3ぼん の 高さ(9〜11画目の 線の ところ)。上から じゅんに うまる */
const ROW_Y: readonly number[] = [43, 52.5, 62]
/** つくえの 上に つんである ぼうの 高さ(上の ものから とる) */
const PILE_Y: readonly number[] = [65.5, 69.5, 73.5]
/** つくえの てんばん の うえの たかさ */
const TABLE_TOP = 75.5

/* ───────── 子ども(左むき。つくえの むこうに 立つ) ───────── */

/** 子どもの こし の x(とまった ところ)と、地面、背の高さ */
const KID_X = 84.5
const FLOOR = 98.5
const KID_HEIGHT = 68
/** ぼうを つかむ 手の x(ぼうの 右はし から すこし 中) */
const GRIP_X = ROD_X + GRIP_IN_ROD
/** よろこぶ ときの こぶし(てまえの 手)と、ふだんの たらした うで */
const FIST: Pt = [67, 45]
const HANG: Limb = { swing: 6, bend: 12 }
/** むこうの 手は ふだん つくえに のせ、よろこぶと ばんざい */
const FAR_REST: Limb = { to: [78, 74] }
const FAR_UP: Limb = { swing: 160, bend: 14 }

type Mood = 'puzzled' | 'focus' | 'happy'
const FACES = { puzzled: 'worried', focus: 'normal', happy: 'joy' } as const

/** ぼう k ばんめを とりはじめる時間 */
const startOf = (k: number) => WORK + STEP * k
/** ぼう k が だいの 上に おさまる時間 */
const placedAt = (k: number) => startOf(k) + GRAB + CARRY
/** ぼう k の 今の 高さ(つくえの 上 → だいの 上) */
const rodY = (t: number, k: number) => mix(t, startOf(k) + GRAB, placedAt(k), PILE_Y[k], ROW_Y[k], easeInOut)

/** てまえの 手: ぼうを つかんで はこぶ → もどす → さいごは こぶし */
function nearLimb(t: number): Limb {
  if (t >= CHEER) return mixLimb(HANG, { to: FIST }, Math.min(1, span(t, CHEER, CHEER + 0.4, backOut)))
  if (t < WORK) return HANG
  const k = Math.min(2, Math.floor((t - WORK) / STEP))
  const local = t - startOf(k)
  if (local < GRAB) return mixLimb(HANG, { to: [GRIP_X, PILE_Y[k]] }, span(local, 0, GRAB, easeOut))
  if (local < GRAB + CARRY) return { to: [GRIP_X, rodY(t, k)] }
  return mixLimb({ to: [GRIP_X, ROW_Y[k]] }, HANG, span(local, GRAB + CARRY, STEP, easeInOut))
}

/** 子どもの 場所と かっこう。右から あるいてきて、つくえの むこうに とまる */
function kidAt(t: number, table: PersonProps['held']): PersonProps {
  const walking = walk(t, { from: KID_X + 32, to: KID_X, start: WALK_FROM, end: WALK_TO, build: 'child', height: KID_HEIGHT, step: 22 })
  const mood: Mood = t >= CHEER ? 'happy' : t >= WORK - 0.15 ? 'focus' : 'puzzled'
  // うれしくて はねる
  const hopWeight = span(t, CHEER, CHEER + 0.3) * (1 - span(t, INK - 0.3, INK))
  const hop = Math.abs(Math.sin((t - CHEER) * Math.PI * 2 * 1.1)) * 2.4 * hopWeight
  const settled = t >= WALK_TO
  const head = mood === 'puzzled' ? 7 + wave(t, 1.2) * 3 : mood === 'focus' ? 5 : -4
  return {
    ...walking,
    y: FLOOR,
    look: { ...LOOKS.boy, top: SHIRT },
    face: FACES[mood],
    lift: hop,
    opacity: span(t, WALK_FROM, WALK_FROM + 0.1),
    held: table,
    pose: settled ? { ...posture('stand', 'left'), head, rightArm: nearLimb(t), leftArm: t >= CHEER + 0.05 ? mixLimb(FAR_REST, FAR_UP, Math.min(1, span(t, CHEER + 0.05, CHEER + 0.45, backOut))) : FAR_REST } : walking.pose,
  }
}

/* ───────── 竹 ───────── */

type LeafShape = { readonly base: Pt; readonly tip: Pt; readonly half: number; readonly dark?: boolean }

/** 細長い 葉(はの もと から さき へ。まんなかが ふくらむ) */
function leafPath({ base, tip, half }: LeafShape): string {
  const mx = (base[0] + tip[0]) / 2
  const my = (base[1] + tip[1]) / 2
  const len = Math.hypot(tip[0] - base[0], tip[1] - base[1])
  const nx = -(tip[1] - base[1]) / len
  const ny = (tip[0] - base[0]) / len
  // 2つの ひかえ点(ふくらみ は その はんぶん)
  const bulge = half * 2
  return `M${base[0]} ${base[1]} Q${mx + nx * bulge} ${my + ny * bulge} ${tip[0]} ${tip[1]} Q${mx - nx * bulge} ${my - ny * bulge} ${base[0]} ${base[1]} Z`
}

/** 1〜3画目(左)と 4〜6画目(右)の 葉。えだ の先から たれる */
const LEFT_LEAVES: readonly LeafShape[] = [
  { base: [30.5, 10.5], tip: [17, 30], half: 2.2 },
  { base: [50, 18.5], tip: [30, 20.5], half: 2.1, dark: true },
  { base: [38.9, 12.7], tip: [39.6, 24], half: 1.8 },
]
const RIGHT_LEAVES: readonly LeafShape[] = [
  { base: [62.1, 8.5], tip: [54.2, 24], half: 2.2 },
  { base: [62.5, 17.5], tip: [91, 14], half: 2.2, dark: true },
  { base: [72, 17.8], tip: [67, 28.2], half: 1.9 },
]

function Bamboo({ t }: SceneProps) {
  // みき が下から のびて、えだ が ひろがり、さいごに 葉が ぽん と でる
  const grow = span(t, 0, 0.7, backOut)
  const sprout = span(t, 0.45, 1.0, backOut)
  const sway = wave(t, 3.4)
  return (
    <>
      <Layer scaleY={grow} origin={[52.5, 76]}>
        <rect x="50.5" y="6" width="4" height="72" rx="2" fill={STALK} />
        <rect x="53" y="6" width="1.5" height="72" rx="0.75" fill={STALK_DARK} opacity="0.55" />
        {/* ふし(たけの ふし) */}
        {[14, 27].map((y) => (
          <rect key={y} x="49.8" y={y} width="5.4" height="1.6" rx="0.8" fill={STALK_DARK} />
        ))}
      </Layer>
      <Layer scale={sprout} origin={[52.5, 16]}>
        <path d="M51 14 Q41 14 30.5 10.5 M54 14 Q58 12 62.1 8.5 M54.5 19.5 Q62 17.5 72 17.8" fill="none" stroke={STALK_DARK} strokeWidth="1.3" strokeLinecap="round" />
        <Layer rotate={sway * 2.4} origin={[50, 15]}>
          {LEFT_LEAVES.map((leaf) => (
            <path key={`${leaf.base[0]}-${leaf.base[1]}`} d={leafPath(leaf)} fill={leaf.dark ? LEAF_DARK : LEAF} />
          ))}
          <path d={leafPath({ base: [31.4, 11.6], tip: [20, 27], half: 0.7 })} fill={LEAF_LIGHT} opacity="0.8" />
        </Layer>
        <Layer rotate={-sway * 2.4} origin={[55, 15]}>
          {RIGHT_LEAVES.map((leaf) => (
            <path key={`${leaf.base[0]}-${leaf.base[1]}`} d={leafPath(leaf)} fill={leaf.dark ? LEAF_DARK : LEAF} />
          ))}
          <path d={leafPath({ base: [63.5, 16.6], tip: [84, 14.6], half: 0.6 })} fill={LEAF_LIGHT} opacity="0.8" />
        </Layer>
      </Layer>
    </>
  )
}

/* ───────── だい(ぼうを ならべる たな)と つくえ ───────── */

function Rack({ t }: SceneProps) {
  const pop = span(t, 0.2, 0.75, backOut)
  return (
    <Layer scale={pop} origin={[54, 76]}>
      {/* うしろの いた(たけの みき が すけない ように) */}
      <rect x="36" y="34" width="35" height="42" fill={PANEL} />
      <rect x="36" y="34" width="35" height="5" fill="#f1dcae" />
      {/* はしら(7画目・8画目)と 上の よこぼう */}
      <rect x="33.2" y="32" width="3.8" height="44" rx="1.2" fill={WOOD} />
      <rect x="70.2" y="32" width="3.8" height="44" rx="1.2" fill={WOOD} />
      <rect x="33.2" y="31.6" width="40.8" height="4" rx="1.6" fill={WOOD_LIGHT} />
      {/* ぼうを のせる きりこみ */}
      {ROW_Y.map((y) => (
        <g key={y} fill={WOOD_DARK}>
          <rect x="33.4" y={y - 2.2} width="1.6" height="4.4" rx="0.6" />
          <rect x="72.4" y={y - 2.2} width="1.6" height="4.4" rx="0.6" />
        </g>
      ))}
    </Layer>
  )
}

function Table({ t }: SceneProps) {
  const pop = span(t, 0, 0.45, backOut)
  return (
    <Layer scale={pop} origin={[54.5, 80]}>
      {/* あし(13・14画目): 右は まっすぐ、左は すこし ひらく */}
      <path d="M41.5 80 L24 100" fill="none" stroke={WOOD_DARK} strokeWidth="4" strokeLinecap="round" />
      <rect x="65.3" y="79" width="4" height="21" rx="1.6" fill={WOOD_DARK} />
      {/* てんばん(12画目) */}
      <rect x="13.5" y={TABLE_TOP} width="82" height="5.4" rx="2" fill={WOOD} />
      <rect x="13.5" y={TABLE_TOP} width="82" height="1.8" rx="0.9" fill={WOOD_LIGHT} />
    </Layer>
  )
}

/* ───────── ぼう ───────── */

/** 竹の ぼう 1ぽん。ぼうの まんなか(y = 0)から かく。tilt は 手に もった ところ を じくに すこし かたむく */
function Rod({ y, tilt }: { readonly y: number; readonly tilt: number }) {
  return (
    <Layer x={ROD_X} y={y} rotate={tilt} origin={[GRIP_IN_ROD, 0]}>
      <rect x="0" y={-ROD_H / 2} width={ROD_LEN} height={ROD_H} rx={ROD_H / 2} fill={ROD} />
      <rect x="1.4" y={-ROD_H / 2 + 0.5} width={ROD_LEN - 2.8} height="0.9" rx="0.45" fill={ROD_LIGHT} />
      {[13, 26].map((x) => (
        <rect key={x} x={x} y={-ROD_H / 2} width="1.1" height={ROD_H} fill={ROD_DARK} />
      ))}
    </Layer>
  )
}

function Rods({ t }: SceneProps) {
  const appear = span(t, 0.7, 1.1, backOut)
  return (
    <Layer scale={appear} origin={[54, TABLE_TOP]}>
      {[0, 1, 2].map((k) => {
        const carrying = span(t, startOf(k) + GRAB, placedAt(k))
        const tilt = -4 * Math.sin(carrying * Math.PI)
        return <Rod key={k} y={rodY(t, k)} tilt={tilt} />
      })}
    </Layer>
  )
}

/** ぼうが だいに おさまった しゅんかんの きらり */
function Pops({ t }: SceneProps) {
  return (
    <>
      {[0, 1, 2].map((k) => {
        const p = span(t, placedAt(k), placedAt(k) + 0.5)
        if (p <= 0 || p >= 1) return null
        return (
          <g key={k} opacity={1 - p}>
            <Star cx={ROD_X + ROD_LEN * 0.3} cy={ROW_Y[k] - 3 - p * 2} r={2.4 * (1 - p * 0.3)} color="#ffd95a" spin={p * 120} />
            <Star cx={ROD_X + ROD_LEN * 0.72} cy={ROW_Y[k] - 3.5 - p * 2} r={1.9 * (1 - p * 0.3)} color="#ffffff" spin={-p * 120} />
          </g>
        )
      })}
    </>
  )
}

/** 子どもの ふきだし。はじめは「?」、ぼうを ならべるたびに 点が 1つ ふえる */
function Bubble({ t }: SceneProps) {
  const pop = span(t, WALK_TO + 0.05, WALK_TO + 0.4, backOut)
  const question = 1 - span(t, placedAt(0), placedAt(0) + 0.15)
  const slots: readonly Pt[] = [[-3.6, 2.2], [3.6, 2.2], [0, -3.8]]
  return (
    <Layer scale={pop} origin={[101, 20]}>
      <path d="M97 25 L91.8 31.6 L101.5 26.6 Z" fill="#ffffff" stroke={BUBBLE_LINE} strokeWidth="0.7" strokeLinejoin="round" />
      <circle cx="101" cy="20" r="7.6" fill="#ffffff" stroke={BUBBLE_LINE} strokeWidth="0.7" />
      <path d="M97.5 26.4 L101.6 26.2 L99 29.6 Z" fill="#ffffff" />
      {question > 0 && (
        <g opacity={question} transform="translate(101 20.4)">
          <path d="M-2.4 -2.6 Q-2.4 -5.4 0 -5.4 Q2.6 -5.4 2.6 -3 Q2.6 -1.2 0.3 0 Q-0.3 0.5 -0.3 2" fill="none" stroke={BUBBLE_INK} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="-0.3" cy="4.4" r="0.95" fill={BUBBLE_INK} />
        </g>
      )}
      {slots.map(([dx, dy], k) => (
        <circle key={k} cx={101 + dx} cy={20 + dy} r={2 * span(t, placedAt(k), placedAt(k) + 0.25, backOut)} fill={SHIRT} />
      ))}
    </Layer>
  )
}

/** 竹の 葉が 1まい、ひらひら おちる(つくえの 左がわ) */
function FallingLeaf({ t }: SceneProps) {
  const p = span(t, 3.0, 6.8)
  if (p <= 0 || p >= 1) return null
  const x = 17 - p * 9 + Math.sin(p * 9) * 3
  const y = 30 + p * 66
  return <path d={leafPath({ base: [0, -3.4], tip: [0, 3.4], half: 1.5 })} fill={LEAF_LIGHT} stroke={LEAF_DARK} strokeWidth="0.4" transform={`translate(${x} ${y}) rotate(${Math.sin(p * 9) * 50 + 20})`} />
}

/** よろこんだ ときの ほし */
function CheerStars({ t }: SceneProps) {
  const show = during(t, CHEER, INK - 0.2, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      <Star cx={78} cy={27 + wave(t, 0.8) * 1.2} r={2.6} color="#ffd95a" spin={t * 90} />
      <Star cx={96} cy={30 + wave(t, 0.8, 0.3) * 1.2} r={2.2} color="#ff7a4d" spin={-t * 90} />
      <Star cx={88} cy={24 + wave(t, 0.8, 0.6) * 1.2} r={1.8} color="#ffffff" spin={t * 60} />
    </g>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 14)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const kid = kidAt(t, <Table t={t} />)
  const sweatAt: Pt = [kid.x - 8, FLOOR - 40]

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[9, 10]} clouds={[[-2, 52, 0.9]]} tufts={[4, 100]} ground={100} />
        <FallingLeaf t={t} />
        <Bamboo t={t} />
        <Rack t={t} />
        <Rods t={t} />
        <Pops t={t} />
        <Person {...kid} />
        <Sweat t={t} x={sweatAt[0]} y={sweatAt[1]} show={during(t, WALK_TO + 0.1, WORK - 0.1, 0.2)} dir={-1} />
        <Bubble t={t} />
        <CheerStars t={t} />
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
    { at: 0, label: '竹が のびて、つくえと だいが でる', sound: 'pop' },
    { at: WALK_FROM, label: '子どもが あるいてきて、竹の ぼうを 見て こまる' },
    { at: WORK, label: '竹の ぼうを 1ぽん ずつ だいに ならべる', sound: 'pop' },
    { at: CHEER, label: '3ぼん ならんだ。かぞえおわって よろこぶ', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '算 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
