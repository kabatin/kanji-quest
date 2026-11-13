/*
 * 矢(や): ゆみで とばす やの かたち。とがった さき と、うしろの はね。
 *
 * ほね(画と絵の対応)
 *   1・2画目   … やの さき(やじり)のあたり。とがった ほうへ とんでいく
 *   3画目(一)  … ゆみで ひいた ひもの あたり
 *   4画目(ノ)  … ひだりした から みぎうえ へ ななめに とぶ、や の ぼう(や じく)
 *   5画目      … やの うしろの はね(の ひろがり)
 *   (字と ぴったり重ならなくても、や が ななめに とんで 字の まんなかを とおる)
 *
 * ながれ
 *   木に おいしそうな りんご → おなかが ぺこぺこの 子が、ぐう と なって りんごを 見あげる
 *   → えびらから や を ぬいて、ゆみに つがえ、ぎゅーっと ひく
 *   → ぱっと はなす。や が ななめ上へ とんで、りんごの えだ に さくっ
 *   → りんごが おちて、子は とびはねて よろこび、りんごを とりに はしる
 *   → ほね が ひかって、絵が うすくなり、字「矢」が のこる
 *
 * 子は ほんものの人の つくり を守る(うで は かた から出て ひじ で まがる。くび は みじかい):
 *   ゆみを もつ うで は まっすぐ のばし、や を ひく うで は ひじ を うしろへ ひく。
 *   や は、ひいた ところ(あご)から ゆみの 手の さきを とおって、まとの えだ へ まっすぐ とぶ。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '矢'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#f2994a'
const SHIRT_DARK = '#d9812f'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const APPLE = '#e8534a'
const APPLE_DARK = '#c93f3a'
const BOW = '#8c5b3c'
const STRING = '#6b5a48'
const SHAFT = '#c79a62'
const HEAD_METAL = '#8d98a8'
const FEATHER = '#ffffff'
const FEATHER_RED = '#e8534a'
const QUIVER = '#a0673f'

/** くぎり の時間(秒) */
const HUNGRY = 0.8
const NOTICE = 2.0
const GRAB = 2.8
const RAISE = 3.0
const DRAW = 3.2
const RELEASE = 4.4
/** や が えだ に とどく(りんごの くき を きる) */
const HIT = 4.7
const LAND = 5.38
const RUN = 5.3
const INK = 6.5
const DONE = 9.3
const DURATION = 10

type Pt = readonly [number, number]

/* ───────── 子の 体の きまり(ぜんぶ 109 x 109 の 座標) ───────── */

/** かた(てまえの うで・むこうの うで)。うで の ふし の ながさ は 1つぶん */
const SHOULDER_NEAR: Pt = [21.5, 56]
const SHOULDER_FAR: Pt = [24, 56]
const ARM = 9.2
/** ゆみを もつ 手(のばした うで の さき)と、ねらう ところ(りんごの くき) */
const HAND_AIM: Pt = [34.5, 43.5]
const TARGET: Pt = [60.5, 17.5]
/** ねらう むき(水平から 上へ 何度か)。ゆみの 手 から まとへ まっすぐ */
const AIM = Math.atan2(HAND_AIM[1] - TARGET[1], TARGET[0] - HAND_AIM[0])
const AIM_DEG = (AIM * 180) / Math.PI
/** ねらう むき の たんい ベクトル(SVG なので 上が マイナス) */
const AIM_DIR: Pt = [Math.cos(AIM), -Math.sin(AIM)]
/** ゆみの 手から、や を ひく 手 まで(あご の ところ)の ながさ */
const DRAW_LEN = 14
const NOCK_FULL: Pt = [HAND_AIM[0] - AIM_DIR[0] * DRAW_LEN, HAND_AIM[1] - AIM_DIR[1] * DRAW_LEN]
/** や の ながさ(ひいた とき、さき が 手の 少し まえに 出る) */
const ARROW_LEN = 22
/** や が とんで いく きょり(や の さき が くき を こえて、はっぱ に 少し さささる) */
const FLY_VEC: Pt = [TARGET[0] - HAND_AIM[0], TARGET[1] - HAND_AIM[1]]
/** えびら(せなかの や いれ)の くちの 手の とどく ところ */
const QUIVER_MOUTH: Pt = [11.6, 48.6]
const QUIVER_TILT = 18

const REST_NEAR: Pt = [22.5, 73]
const BELLY_NEAR: Pt = [26.5, 64]
const REST_FAR: Pt = [29, 72]
const CHEER_NEAR: Pt = [14, 40]
const CHEER_FAR: Pt = [36, 38]

/** りんごの いち。えだ から ぶらさがる */
const APPLE_POS: Pt = [60.5, 22.6]
const GROUND_Y = 92.6
const GRAVITY = 2 * (GROUND_Y - APPLE_POS[1]) / (LAND - HIT) ** 2

/* ───────── 小さな どうぐ ───────── */

const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/** (時間, 値) の ならび を、かんなめらかに つなぐ */
function track(t: number, keys: readonly (readonly [number, number])[]): number {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 0; i < keys.length - 1; i += 1) {
    if (t < keys[i + 1][0]) return lerp(keys[i][1], keys[i + 1][1], span(t, keys[i][0], keys[i + 1][0], easeInOut))
  }
  return keys[keys.length - 1][1]
}

function trackPt(t: number, keys: readonly (readonly [number, Pt])[]): Pt {
  return [track(t, keys.map(([time, p]) => [time, p[0]] as const)), track(t, keys.map(([time, p]) => [time, p[1]] as const))]
}

/** かた から 手 まで とどく ところ(うで の ながさ より 遠い ときは、のびきった ところ) */
function reach(shoulder: Pt, target: Pt): Pt {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const d = Math.hypot(dx, dy)
  const max = ARM * 2 * 0.999
  if (d <= max) return target
  return [shoulder[0] + (dx / d) * max, shoulder[1] + (dy / d) * max]
}

/** かた → ひじ → 手 の ひじ の いち。pref の ほうへ ひじ が まがる。 */
function elbowOf(shoulder: Pt, hand: Pt, pref: Pt): Pt {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const d = Math.max(Math.hypot(dx, dy), 0.001)
  const ux = dx / d
  const uy = dy / d
  const mid: Pt = [shoulder[0] + dx / 2, shoulder[1] + dy / 2]
  const h = Math.sqrt(Math.max(ARM ** 2 - (d / 2) ** 2, 0))
  const side = -uy * pref[0] + ux * pref[1] >= 0 ? 1 : -1
  return [mid[0] - uy * h * side, mid[1] + ux * h * side]
}

/* ───────── 木・りんご ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={Math.max(0, 6.2 * sun)} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 70 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="30" cy="8" rx="7" ry="3" />
        <ellipse cx="35" cy="6.4" rx="5" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 52, 74, 104].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 空を わたる 小鳥。にぎやかし。 */
function Bird({ t }: SceneProps) {
  const p = span(t, 0.5, 3.8)
  if (p <= 0 || p >= 1) return null
  const x = -6 + p * 70
  const y = 10 + Math.sin(p * 9) * 2
  const flap = wave(t, 0.3) * 24
  return (
    <Layer x={x} y={y}>
      <ellipse cx="0" cy="0" rx="3.4" ry="2.2" fill="#7a6fd0" />
      <circle cx="2.8" cy="-1" r="1.8" fill="#7a6fd0" />
      <path d="M4.4 -1 l2.4 0.6 l-2.4 0.8 Z" fill="#f2b632" />
      <circle cx="3.4" cy="-1.4" r="0.45" fill="#2b2b2b" />
      <Layer rotate={flap} origin={[-0.4, -0.6]}>
        <path d="M-2.4 -0.6 Q-0.4 -4.6 2 -0.4 Q-0.4 0.8 -2.4 -0.6 Z" fill="#5d52b8" />
      </Layer>
    </Layer>
  )
}

/** りんごの 木。みき が のびて 葉が しげる。りんごは えだの さきから ぶらさがる。 */
function Tree({ t }: SceneProps) {
  const trunk = span(t, 0, 0.55, backOut)
  const leaves = span(t, 0.3, 0.9, backOut)
  const sway = wave(t, 3.4) * 1.0
  return (
    <>
      <ellipse cx="94" cy="97.6" rx={Math.max(0, 14 * trunk)} ry="2.6" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.6 + 0.4 * trunk} scaleY={trunk} origin={[94, 97]}>
        <path d="M85 98 Q91.5 91 90.8 74 L90.4 30 L98.4 30 L98 74 Q98 91 104 98 Z" fill={BARK} />
        <path d="M93.4 52 q1.4 5 0 10 M96 68 q-1.2 5 0.2 9" fill="none" stroke={BARK_DARK} strokeWidth="1.2" strokeLinecap="round" />
      </Layer>
      <Layer scale={leaves} origin={[88, 30]}>
        {/* りんごの えだ: 葉の かたまり から のびて、さき に りんごが ぶらさがる */}
        <path d="M69 16 Q64 14 60.5 17.5" fill="none" stroke={BARK} strokeWidth="2" strokeLinecap="round" />
        <path d="M63.6 13.6 q-3.4 -1.4 -4.4 0.8 q2.4 1.8 4.4 -0.8 Z" fill={LEAF} />
      </Layer>
      <Layer scale={leaves} rotate={sway} origin={[90, 32]}>
        <circle cx="78" cy="17" r="11" fill={LEAF_DARK} />
        <circle cx="90" cy="11" r="13" fill={LEAF_DARK} />
        <circle cx="100" cy="21" r="10" fill={LEAF_DARK} />
        <circle cx="86" cy="26" r="9" fill={LEAF_DARK} />
        <circle cx="79" cy="15" r="9" fill={LEAF} />
        <circle cx="90" cy="14" r="10.5" fill={LEAF} />
        <circle cx="98" cy="22" r="7.6" fill={LEAF} />
        <circle cx="84" cy="9" r="4.2" fill={LEAF_LIGHT} />
        <circle cx="75" cy="12" r="3" fill={LEAF_LIGHT} />
      </Layer>
    </>
  )
}

/** りんご。くき が きれると おちて、ぽん と はずむ。 */
function Apple({ t }: SceneProps) {
  const show = span(t, 0.5, 1.1, backOut)
  const fall = Math.max(0, t - HIT)
  const dropping = t >= HIT && t < LAND
  const landed = t >= LAND
  const bounce = landed ? Math.sin(span(t, LAND, LAND + 0.42) * Math.PI) * 7 : 0
  const y = dropping ? APPLE_POS[1] + 0.5 * GRAVITY * fall * fall : landed ? GROUND_Y - bounce : APPLE_POS[1]
  const spin = dropping ? fall * 220 : landed ? 150 : 0
  // くき が つながっている あいだ だけ、くき を 見せる(きれたら りんご と いっしょに おちる)
  return (
    <Layer y={y - APPLE_POS[1]} scale={show} origin={APPLE_POS}>
      <g transform={`rotate(${spin} ${APPLE_POS[0]} ${APPLE_POS[1]})`}>
        <path d={`M${APPLE_POS[0]} ${APPLE_POS[1] - 4} v-2.4`} stroke={BARK_DARK} strokeWidth="1" strokeLinecap="round" fill="none" />
        <circle cx={APPLE_POS[0] - 1.6} cy={APPLE_POS[1] + 0.4} r="3.7" fill={APPLE} />
        <circle cx={APPLE_POS[0] + 1.6} cy={APPLE_POS[1] + 0.4} r="3.7" fill={APPLE} />
        <circle cx={APPLE_POS[0] + 2.4} cy={APPLE_POS[1] + 1.4} r="2.3" fill={APPLE_DARK} />
        <ellipse cx={APPLE_POS[0] - 2} cy={APPLE_POS[1] - 1.4} rx="1.1" ry="0.7" fill="#ffffff" opacity="0.6" />
      </g>
    </Layer>
  )
}

/** りんごが ぴかっと 見える きらり(「ほしいな」の きもち) */
function AppleShine({ t }: SceneProps) {
  const show = during(t, NOTICE - 0.1, GRAB + 0.1, 0.2)
  if (show <= 0) return null
  const pulse = 0.7 + 0.3 * wave(t, 0.5)
  return (
    <g opacity={show}>
      <Star cx={APPLE_POS[0] + 4} cy={APPLE_POS[1] - 3.4} r={3.2 * pulse} color="#fff6a8" spin={t * 40} />
    </g>
  )
}

/** や が えだ に あたった しゅんかんの ぱっと ひろがる すじ と、おちる 葉。 */
function Impact({ t }: SceneProps) {
  const burst = during(t, HIT - 0.1, HIT + 0.35, 0.1)
  const p = span(t, HIT - 0.1, HIT + 0.35, easeOut)
  const leafP = span(t, HIT, HIT + 1.3)
  return (
    <>
      {burst > 0 && (
        <g opacity={burst} stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round">
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * Math.PI * 2 + 0.4
            return <line key={i} x1={TARGET[0] + Math.cos(a) * (3 + p * 2)} y1={TARGET[1] + Math.sin(a) * (3 + p * 2)} x2={TARGET[0] + Math.cos(a) * (6 + p * 5)} y2={TARGET[1] + Math.sin(a) * (6 + p * 5)} />
          })}
        </g>
      )}
      {leafP > 0 && leafP < 1 && (
        <path d="M0 -2.6 Q2.4 0 0 2.6 Q-2.4 0 0 -2.6 Z" fill={LEAF_LIGHT} stroke={LEAF_DARK} strokeWidth="0.4" opacity={1 - leafP ** 3} transform={`translate(${70 + Math.sin(leafP * 8) * 4} ${14 + leafP * 70}) rotate(${Math.sin(leafP * 8) * 50})`} />
      )}
    </>
  )
}

/** りんごが じめんに おちた ときの ほこり。 */
function Dust({ t }: SceneProps) {
  const p = span(t, LAND, LAND + 0.5, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p} fill="#ffffff">
      <ellipse cx={APPLE_POS[0] - 5 - p * 5} cy={GROUND_Y + 1.4 - p * 1.4} rx={1.6 + p} ry={1.1 + p * 0.5} />
      <ellipse cx={APPLE_POS[0] + 5 + p * 5} cy={GROUND_Y + 1.4 - p * 1.4} rx={1.6 + p} ry={1.1 + p * 0.5} />
    </g>
  )
}

/* ───────── ゆみ・や ───────── */

/** や。tail(はね の ほう)を 原点に、右へ のびる。angle は 水平から 上へ の角度。 */
function Arrow({ tail, angle }: { readonly tail: Pt; readonly angle: number }) {
  return (
    <g transform={`translate(${tail[0]} ${tail[1]}) rotate(${-angle})`}>
      <rect x="0" y="-0.65" width={ARROW_LEN - 4} height="1.3" rx="0.6" fill={SHAFT} />
      <path d={`M${ARROW_LEN - 5} -2.5 L${ARROW_LEN} 0 L${ARROW_LEN - 5} 2.5 Z`} fill={HEAD_METAL} />
      <path d="M-0.8 0 L1.8 -3 L6 -3 L4.4 0 Z" fill={FEATHER_RED} />
      <path d="M-0.8 0 L1.8 3 L6 3 L4.4 0 Z" fill={FEATHER} />
    </g>
  )
}

/** ゆみ。手(grip)を まんなか に、axis の むきに のびる。nock は ひいた ひもの 手。 */
function Bow({ grip, axisDeg, nock }: { readonly grip: Pt; readonly axisDeg: number; readonly nock: Pt }) {
  const rad = (axisDeg * Math.PI) / 180
  const u: Pt = [Math.cos(rad), -Math.sin(rad)]
  // ゆみの ふくらむ むき(うでを のばす むき)
  const a: Pt = [Math.cos(rad - Math.PI / 2), -Math.sin(rad - Math.PI / 2)]
  const half = 11
  const back = 4
  const top: Pt = [grip[0] - a[0] * back + u[0] * half, grip[1] - a[1] * back + u[1] * half]
  const bottom: Pt = [grip[0] - a[0] * back - u[0] * half, grip[1] - a[1] * back - u[1] * half]
  const ctrl: Pt = [grip[0] + a[0] * back, grip[1] + a[1] * back]
  return (
    <>
      <path d={`M${top[0]} ${top[1]} L${nock[0]} ${nock[1]} L${bottom[0]} ${bottom[1]}`} fill="none" stroke={STRING} strokeWidth="0.55" strokeLinejoin="round" />
      <path d={`M${top[0]} ${top[1]} Q${ctrl[0]} ${ctrl[1]} ${bottom[0]} ${bottom[1]}`} fill="none" stroke={BOW} strokeWidth="2.1" strokeLinecap="round" />
    </>
  )
}

/* ───────── 子 ───────── */

type Mood = 'hungry' | 'wish' | 'aim' | 'happy'

function Arm({ shoulder, hand, color, pref }: { readonly shoulder: Pt; readonly hand: Pt; readonly color: string; readonly pref: Pt }) {
  const elbow = elbowOf(shoulder, hand, pref)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.2" fill={SKIN} />
    </>
  )
}

/** かお。右むき。ずっと 左むきの 見本の かお を ひっくり返して 使っている。 */
function Face({ mood }: { readonly mood: Mood }) {
  return (
    <g transform="translate(54.2 16.4) scale(-1 1)">
      <circle cx="30.2" cy="24.6" r="9.2" fill={SKIN} />
      <path d="M21.5 23 C21.4 13.8 31.8 11.2 37.8 17 C40.2 20.2 40.2 26 38.2 30.2 C37.6 24.4 33.4 20.2 26.6 20.6 C24.4 20.8 22.6 21.8 21.5 23 Z" fill={HAIR} />
      <circle cx="26.5" cy="28.8" r="2.1" fill="#ff9d9d" opacity="0.55" />
      {mood === 'hungry' && (
        <>
          <path d="M23.6 23.8 l3 1.2" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="25.4" cy="25.6" r="1.15" fill="#2b2b2b" />
          <path d="M23.4 30.6 Q24.8 29.2 26.2 30.6" fill="none" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'wish' && (
        <>
          <path d="M23.6 22.4 l3 -0.7" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="25.4" cy="25" r="1.7" fill="#2b2b2b" />
          <circle cx="24.9" cy="24.3" r="0.55" fill="#ffffff" />
          <ellipse cx="24.6" cy="30.2" rx="1.1" ry="1.5" fill="#b9483f" />
        </>
      )}
      {mood === 'aim' && (
        <>
          <path d="M23.4 23.4 l3.4 0.2" stroke={HAIR} strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="25.4" cy="25.6" r="1.05" fill="#2b2b2b" />
          <path d="M23.6 30 h2.8" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M23.8 26.2 Q25.4 23.6 27 26.2" fill="none" stroke="#2b2b2b" strokeWidth="1.25" strokeLinecap="round" />
          <path d="M22.8 29 Q25 33.6 27.6 29.2 Z" fill="#b9483f" />
        </>
      )}
    </g>
  )
}

type ChildProps = {
  readonly t: number
}

function Child({ t }: ChildProps) {
  const mood: Mood = t < NOTICE ? 'hungry' : t < GRAB + 0.1 ? 'wish' : t < HIT ? 'aim' : 'happy'
  const grumble = during(t, HUNGRY + 0.2, NOTICE - 0.1, 0.2)

  // うで の 手の いち(じかんで うごく)
  const jiggle = grumble > 0 ? ([Math.sin(t * 9) * 0.8, Math.cos(t * 9) * 0.6] as const) : ([0, 0] as const)
  const nearBase = trackPt(t, [
    [0, REST_NEAR], [HUNGRY, REST_NEAR], [HUNGRY + 0.3, BELLY_NEAR], [NOTICE, BELLY_NEAR], [NOTICE + 0.4, REST_NEAR],
    [GRAB, QUIVER_MOUTH], [GRAB + 0.2, QUIVER_MOUTH], [RELEASE - 0.4, NOCK_FULL], [RELEASE + 0.1, NOCK_FULL], [RELEASE + 0.5, CHEER_NEAR],
  ])
  const nearHand = reach(SHOULDER_NEAR, [nearBase[0] + jiggle[0] * span(t, HUNGRY + 0.3, HUNGRY + 0.4) * (1 - span(t, NOTICE - 0.1, NOTICE)), nearBase[1] + jiggle[1] * span(t, HUNGRY + 0.3, HUNGRY + 0.4) * (1 - span(t, NOTICE - 0.1, NOTICE))])
  const farHand = reach(SHOULDER_FAR, trackPt(t, [[0, REST_FAR], [RAISE, REST_FAR], [RAISE + 0.6, HAND_AIM], [RELEASE + 0.5, HAND_AIM], [RELEASE + 1.0, CHEER_FAR]]))

  // ゆみ: さげて もつ → ねらう むき → また さげる(ばんざい で もち あげる)
  const axisDeg = track(t, [[0, 90], [RAISE, 90], [RAISE + 0.6, AIM_DEG + 90], [RELEASE + 0.5, AIM_DEG + 90], [RELEASE + 1.0, 90]])
  // ひも: かまえる まで ゆるい。ひく と のびて、はなすと ぶるぶる ふるえる
  const decay = 1 - span(t, RELEASE, RELEASE + 0.5)
  const pull = t < RELEASE ? mix(t, DRAW, RELEASE - 0.4, 4, DRAW_LEN) : 4 + (DRAW_LEN - 4) * decay * Math.cos((t - RELEASE) * 36)
  const nock: Pt = [farHand[0] - AIM_DIR[0] * pull, farHand[1] - AIM_DIR[1] * pull]

  // や: えびらから ぬく → ひく → とぶ(ゆみの 手 を かすめて、えだ へ)
  const flight = span(t, RELEASE, HIT + 0.08)
  const arrowAngle = track(t, [[GRAB + 0.2, 90 + QUIVER_TILT], [RAISE + 0.6, AIM_DEG]])
  const arrowTail: Pt = t < RELEASE ? nearHand : [NOCK_FULL[0] + FLY_VEC[0] * flight, NOCK_FULL[1] + FLY_VEC[1] * flight]

  // 体
  const hop = Math.sin(span(t, HIT + 0.05, HIT + 0.55) * Math.PI) * 5 + Math.sin(span(t, RUN + 0.9, RUN + 1.3) * Math.PI) * 2.5
  const runX = mix(t, RUN, RUN + 0.85, 0, 22, easeInOut)
  const stride = Math.sin((t - RUN) * Math.PI * 2 * 2.4) * during(t, RUN, RUN + 0.85, 0.08)
  const headTilt = track(t, [[0, 2], [HUNGRY + 0.3, 6], [NOTICE, 6], [NOTICE + 0.5, -12], [HIT, -12], [HIT + 0.5, 0], [RUN + 0.8, 0], [RUN + 1.2, -6]])
  const appear = span(t, 0.1, 0.45)
  const belly = grumble > 0 ? Math.sin(t * 14) : 0

  const quiverFeathers = (
    <g transform={`rotate(${-QUIVER_TILT} 15 60)`}>
      <rect x="11.6" y="51" width="6" height="16" rx="2.6" fill={QUIVER} />
      <path d="M12.4 51 l0.8 -3.6 l1.6 3.6 Z" fill={FEATHER_RED} />
      <path d="M15.4 51 l0.4 -3.2 l1.6 3.2 Z" fill={FEATHER} />
    </g>
  )

  return (
    <Layer opacity={appear} x={runX} y={-hop}>
      <ellipse cx="22.5" cy="97.4" rx="10" ry="2.4" fill="#000000" opacity="0.12" />
      {/* ゆみ を もつ うで(むこうがわ): からだの うしろ */}
      <Arm shoulder={SHOULDER_FAR} hand={farHand} color={SHIRT_DARK} pref={[-1, 0]} />
      {quiverFeathers}
      {/* あし: はしる とき、かわりばんこ に ふる */}
      <Layer rotate={stride * 22} origin={[24, 71]}>
        <rect x="21.4" y="69" width="6.2" height="24.5" rx="3.1" fill={PANTS_DARK} />
        <ellipse cx="25.6" cy="94" rx="5.2" ry="2.7" fill={SHOE} />
      </Layer>
      <Layer rotate={-stride * 22} origin={[19, 71]}>
        <rect x="16.4" y="69" width="6.2" height="24.5" rx="3.1" fill={PANTS} />
        <ellipse cx="20.6" cy="94" rx="5.2" ry="2.7" fill={SHOE} />
      </Layer>
      {/* どう と くび */}
      <rect x="20.4" y="46" width="5.4" height="7" rx="2.4" fill={SKIN_SHADE} />
      <Layer scaleX={1 + belly * 0.02} origin={[22.5, 62]}>
        <rect x="15.5" y="49.5" width="14" height="23.5" rx="6.6" fill={SHIRT} />
        <path d="M17 66 h11" stroke={SHIRT_DARK} strokeWidth="1.4" strokeLinecap="round" />
      </Layer>
      {/* おなかが ぐう: 3本の ゆれる すじ */}
      {grumble > 0 && (
        <g opacity={grumble} fill="none" stroke="#e8534a" strokeWidth="0.9" strokeLinecap="round">
          <path d={`M32 ${60 + belly * 0.6} q2 1.6 0 3.2 q-2 1.6 0 3.2`} />
          <path d={`M35 ${59 - belly * 0.6} q2 1.6 0 3.2 q-2 1.6 0 3.2`} />
        </g>
      )}
      {/* ひいている うで(てまえがわ。あたまの うしろに 回りこむので、かおを かくさない) */}
      <Arm shoulder={SHOULDER_NEAR} hand={nearHand} color={SHIRT_DARK} pref={[-1, 0.35]} />
      {/* あたま */}
      <Layer rotate={headTilt} origin={[23, 50]}>
        <Face mood={mood} />
      </Layer>
      {/* ゆみ と や(や は、手に にぎられている あいだは 手の さきから) */}
      <Bow grip={farHand} axisDeg={axisDeg} nock={nock} />
      {t >= GRAB + 0.05 && t < RELEASE && <Arrow tail={arrowTail} angle={arrowAngle} />}
    </Layer>
  )
}

/** とんでいく や(子の うしろ から えだ へ)。はっぱ に さささる ところは、まえの 葉で かくす。 */
function FlyingArrow({ t }: SceneProps) {
  if (t < RELEASE) return null
  const flight = span(t, RELEASE, HIT + 0.08)
  const tail: Pt = [NOCK_FULL[0] + FLY_VEC[0] * flight, NOCK_FULL[1] + FLY_VEC[1] * flight]
  return <Arrow tail={tail} angle={AIM_DEG} />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)
  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Bird t={t} />
        <Tree t={t} />
        <Apple t={t} />
        <AppleShine t={t} />
        <Child t={t} />
        <FlyingArrow t={t} />
        {/* や の さき を かくす、まえの 葉 */}
        <Layer scale={span(t, 0.3, 0.9, backOut)} origin={[88, 30]}>
          <circle cx="68.4" cy="11.6" r="4.2" fill={LEAF} />
          <circle cx="70" cy="14.6" r="2.4" fill={LEAF_LIGHT} />
        </Layer>
        <Impact t={t} />
        <Dust t={t} />
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
    { at: 0, label: 'りんごの 木。おなかが ぺこぺこの 子', sound: 'pop' },
    { at: NOTICE, label: 'りんごを 見つけた' },
    { at: GRAB, label: 'えびらから や を ぬいて、ゆみに つがえる' },
    { at: DRAW, label: 'ぎゅーっと ひく' },
    { at: RELEASE, label: 'はなす。や が えだへ とんでいく', sound: 'stroke' },
    { at: HIT, label: 'さくっ。りんごが おちて、子は おおよろこび', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '矢 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
