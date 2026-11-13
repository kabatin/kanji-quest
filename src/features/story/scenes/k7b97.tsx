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
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(かた と 手 の 場所から、ひじ を けいさんして つなぐ)。
 *   くび は みじかく、どう の まんなか の上。あし は こし から。子どもは つくえの むこうに 立つ。
 *   竹は、まんなかの みき から えだ が のび、えだの先に 細長い はが たれる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '算'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#ef7f5a'
const SHIRT_DARK = '#d96a46'
const SHIRT_FAR = '#b95a3c'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const CHEEK = '#ff9d9d'
const MOUTH = '#b9483f'
const EYE = '#2b2b2b'
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
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const DROP = '#7cc4f2'
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

/** 子どもは 左むきの 絵として かいて、右がわに うつして(左右を ひっくり返して)おく。この数字で ひっくり返す */
const FLIP = 109

type Pt = readonly [number, number]
const lerp = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

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

/* ───────── 子どもの からだ(左むきの 絵の座標) ───────── */

const SHOULDER_NEAR: Pt = [24.5, 51.5]
const SHOULDER_FAR: Pt = [26, 51.5]
/** うで の ひとふし の 長さ(かた〜ひじ、ひじ〜手) */
const ARM_PART = 13.5
const NECK: Pt = [25, 44]
/** ぼうを つかむ 手の x(子どもの 絵の中) */
const GRIP_X = FLIP - (ROD_X + GRIP_IN_ROD)
const REST_NEAR: Pt = [30, 70]
const REST_FAR: Pt = [31, 72.5]
/** よろこぶ ときの 手(てまえの うで は こぶしを あげ、むこうの うで は ばんざい) */
const FIST: Pt = [36.5, 39]
const HANDS_UP: Pt = [14, 42]

type Mood = 'puzzled' | 'focus' | 'happy'

/** ぼう k ばんめを とりはじめる時間 */
const startOf = (k: number) => WORK + STEP * k
/** ぼう k が だいの 上に おさまる時間 */
const placedAt = (k: number) => startOf(k) + GRAB + CARRY
/** ぼう k の 今の 高さ(つくえの 上 → だいの 上) */
const rodY = (t: number, k: number) => mix(t, startOf(k) + GRAB, placedAt(k), PILE_Y[k], ROW_Y[k], easeInOut)

/** てまえの 手が いま どこに いるか(子どもの 絵の座標) */
function nearTarget(t: number): Pt {
  if (t >= CHEER) return lerp(REST_NEAR, FIST, span(t, CHEER, CHEER + 0.4, backOut))
  if (t < WORK) return REST_NEAR
  const k = Math.min(2, Math.floor((t - WORK) / STEP))
  const local = t - startOf(k)
  if (local < GRAB) return lerp(REST_NEAR, [GRIP_X, PILE_Y[k]], span(local, 0, GRAB, easeOut))
  if (local < GRAB + CARRY) return [GRIP_X, rodY(t, k)]
  return lerp([GRIP_X, ROW_Y[k]], REST_NEAR, span(local, GRAB + CARRY, STEP, easeInOut))
}

/** むこうの 手: ふだんは つくえに のせ、よろこぶと ばんざい */
function farTarget(t: number): Pt {
  return lerp(REST_FAR, HANDS_UP, span(t, CHEER + 0.05, CHEER + 0.45, backOut))
}

/* ───────── まわりの けしき ───────── */

function Backdrop({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[8, 9]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="7.4" y="1" width="1.4" height="3" rx="0.7" fill={SUN} transform={`rotate(${i * 45} 8 9)`} />
        ))}
      </Layer>
      <circle cx="8" cy="9" r={4.4 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 92 Q72 72 113 94 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="-2" cy="52" rx="7" ry="3.2" />
        <ellipse cx="3" cy="50" rx="5" ry="3.2" />
      </g>
      <ellipse cx="54.5" cy="100" rx="54" ry="5.6" fill={GRASS} />
      {[4, 100, 106].map((x) => (
        <path key={x} d={`M${x} 99.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
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
      <ellipse cx="54.5" cy="99.4" rx="44" ry="2.6" fill="#000000" opacity="0.1" />
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

/* ───────── 子ども ───────── */

/** かた から ひじ を へて 手 まで。手が とどかない ときは、まっすぐ のばして とどく ところまで */
function armJoints(shoulder: Pt, target: Pt): { readonly elbow: Pt; readonly hand: Pt } {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.max(0.001, Math.hypot(dx, dy))
  const reach = Math.min(dist, ARM_PART * 2 - 0.02)
  const ux = dx / dist
  const uy = dy / dist
  const half = reach / 2
  const bend = Math.sqrt(Math.max(0, ARM_PART * ARM_PART - half * half))
  // ひじは 下(まっすぐ 下を むく ときは うしろ)がわに まがる
  let px = -uy
  let py = ux
  if (py < 0) {
    px = -px
    py = -py
  }
  return {
    elbow: [shoulder[0] + ux * half + px * bend, shoulder[1] + uy * half + py * bend],
    hand: [shoulder[0] + ux * reach, shoulder[1] + uy * reach],
  }
}

function Arm({ shoulder, target, color }: { readonly shoulder: Pt; readonly target: Pt; readonly color: string }) {
  const { elbow, hand } = armJoints(shoulder, target)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.3" fill={SKIN} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  if (mood === 'happy') {
    return (
      <>
        <path d="M27.7 39.2 Q29.3 36.8 30.9 39.2" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
        <path d="M28.3 42 Q30.3 46.4 32.5 42 Z" fill={MOUTH} />
      </>
    )
  }
  return (
    <>
      <circle cx="29.3" cy="38.6" r="1.2" fill={EYE} />
      {mood === 'puzzled' ? (
        <>
          <path d="M27.6 36.4 L31 35" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M28.6 43.4 q0.9 -1 1.8 0 t1.8 0" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M27.6 36 L31 36" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <ellipse cx="31" cy="43.2" rx="1" ry="1.1" fill={MOUTH} />
        </>
      )}
    </>
  )
}

type ChildProps = { readonly stride: number; readonly mood: Mood; readonly headTilt: number; readonly farHand: Pt }

/** 子どもの からだ(てまえの うで 以外)。左むき。うしろの うで → あし → どう → あたま の じゅん */
function ChildBody({ stride, mood, headTilt, farHand }: ChildProps) {
  return (
    <>
      <Arm shoulder={SHOULDER_FAR} target={farHand} color={SHIRT_FAR} />
      <Layer rotate={stride * 16} origin={[27, 70]}>
        <rect x="24.6" y="68" width="4.6" height="28" rx="2.3" fill={PANTS_DARK} />
        <ellipse cx="27.4" cy="97" rx="5" ry="2.6" fill={SHOE} />
      </Layer>
      <Layer rotate={-stride * 16} origin={[22.5, 70]}>
        <rect x="19.8" y="68" width="4.6" height="28" rx="2.3" fill={PANTS} />
        <ellipse cx="22.6" cy="97" rx="5" ry="2.6" fill={SHOE} />
      </Layer>
      {/* くび: どう と あたま の間を みじかく つなぐ */}
      <rect x="22.6" y="42" width="4.8" height="7" rx="2.2" fill={SKIN_SHADE} />
      <rect x="17.5" y="47" width="14" height="27" rx="6.5" fill={SHIRT} />
      <path d="M19.6 68.6 h10" stroke={SHIRT_DARK} strokeWidth="1.5" strokeLinecap="round" />
      <Layer rotate={headTilt} origin={NECK}>
        <circle cx="18.4" cy="40" r="1.9" fill={SKIN_SHADE} />
        <circle cx="25" cy="38.5" r="8.2" fill={SKIN} />
        <ellipse cx="33.3" cy="40.2" rx="1.3" ry="1.1" fill={SKIN} />
        <path d="M16.8 38.5 A8.2 8.2 0 0 1 33.2 38.5 C32.2 35 28.6 33.4 24.8 33.8 C21 34.2 18.2 36 16.8 38.5 Z" fill={HAIR} />
        <path d="M23 30.6 Q22.2 27.6 24.8 28.4 Q25 26.6 27 28" fill="none" stroke={HAIR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="28.6" cy="42.4" r="2" fill={CHEEK} opacity="0.55" />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

/* ───────── ふきだし・にぎやかし ───────── */

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

/** こまっている間の あせ(あたまの 前がわ から たれる) */
function Sweat({ t }: SceneProps) {
  const show = during(t, WALK_TO + 0.1, WORK - 0.1, 0.2)
  if (show <= 0) return null
  const p = ((t * 1.1) % 1)
  return <path d="M0 -2.6 Q2.2 0.6 0 2.4 Q-2.2 0.6 0 -2.6 Z" fill={DROP} opacity={show * (1 - p * 0.6)} transform={`translate(34.8 ${30 + p * 6})`} />
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

  // あるいてくる: 右から つくえの むこうへ。あしを ふって、とまる
  const walkX = mix(t, WALK_FROM, WALK_TO, 32, 0, easeOut)
  const stride = Math.sin((t - WALK_FROM) * Math.PI * 2 * 2.2) * (1 - span(t, WALK_TO - 0.15, WALK_TO)) * (t < WALK_FROM ? 0 : 1)
  // うれしくて はねる
  const hopWeight = span(t, CHEER, CHEER + 0.3) * (1 - span(t, INK - 0.3, INK))
  const hop = -Math.abs(Math.sin((t - CHEER) * Math.PI * 2 * 1.1)) * 2.4 * hopWeight

  const mood: Mood = t >= CHEER ? 'happy' : t >= WORK - 0.15 ? 'focus' : 'puzzled'
  const headTilt = mood === 'puzzled' ? 7 + wave(t, 1.2) * 3 : mood === 'focus' ? 5 : -4
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const arrived = span(t, WALK_FROM, WALK_FROM + 0.1)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} />
        <FallingLeaf t={t} />
        <Bamboo t={t} />
        <Rack t={t} />
        <Rods t={t} />
        <Pops t={t} />
        {/* 子ども: 左むきに かいて、右がわへ うつす。つくえの むこうに 立つ */}
        <Layer opacity={arrived}>
          <ellipse cx={FLIP - 24.5 + walkX} cy="99" rx="9" ry="2" fill="#000000" opacity="0.12" />
          <Layer x={walkX} y={hop}>
            <g transform={`translate(${FLIP} 0) scale(-1 1)`}>
              <ChildBody stride={stride} mood={mood} headTilt={headTilt} farHand={farTarget(t)} />
              <Sweat t={t} />
            </g>
          </Layer>
        </Layer>
        <Table t={t} />
        {/* てまえの うで は つくえの 前に 出る(ぼうを つかむ ため) */}
        <Layer opacity={span(t, WALK_TO - 0.1, WALK_TO)}>
          <Layer x={walkX} y={hop}>
            <g transform={`translate(${FLIP} 0) scale(-1 1)`}>
              <Arm shoulder={SHOULDER_NEAR} target={nearTarget(t)} color={SHIRT_DARK} />
            </g>
          </Layer>
        </Layer>
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
