/*
 * 生(うまれる): 土から 草の めが 出てきた。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … 男の子が よろこんで 上げた 右うで(かた から まっすぐ 上へ。さいごの しゅんかんだけ 重なる)
 *   2画目(一)  … 草の 上の ほうの 葉(左右に ひらく)
 *   3画目(丨)  … 草の くき(土から ぐんぐん のびる)
 *   4画目(一)  … 草の 下の ほうの 葉(左右に ひらく)
 *   5画目(一)  … 土と はたけの 地面
 *
 * ながれ
 *   はたけに 男の子が しょんぼり(なにも はえていない)
 *   → じょうろで 土に みずを やる → じっと まつ
 *   → 土が もりあがって、草の めが でてくる(くきが のびて、葉が ひらく)
 *   → 男の子は びっくり、そして ばんざい!
 *   → ほね が ひかって、絵が うすくなり、字「生」が のこる
 *
 * 男の子と じょうろは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる。じょうろは 取っ手を もち、水は 口から まっすぐ 下に おちる。
 *   草は 土から くき が のびて、葉は くき から 左右に 出る。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '生'

const SUN = '#ffd24a'
const HILL = '#e2f2d2'
const GRASS = '#c5e8a9'
const GRASS_EDGE = '#a9d98a'
const BLADE = '#55b86e'
const SOIL = '#9a6b47'
const SOIL_LIGHT = '#b58459'
const SOIL_WET = '#6e4a30'
const STEM = '#3f9c59'
const LEAF = '#6cc97e'
const LEAF_DARK = '#4aae62'
const LEAF_LIGHT = '#b7eac0'
const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#ff9f4a'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const CAN = '#4fa7e0'
const CAN_DARK = '#3a88bf'
const WATER = '#7cc4f2'
const WATER_LIGHT = '#e8f6ff'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const LIFT = 0.9
const TILT_AT = 1.6
const POUR = 2.0
const POUR_END = 3.4
const WAIT = 3.7
const BUMP = 4.1
const GROW = 4.4
const WOW = 4.4
const CHEER = 5.4
const INK = 6.6
const DONE = 9.4
const DURATION = 10

type Pt = readonly [number, number]

/* ───────── 男の子 ───────── */

/** かた(つけね)。体は まっすぐ こちらを むく。右 = 見ている人から 見て 右 */
const SHOULDER_R: Pt = [22.5, 54]
const SHOULDER_L: Pt = [10.5, 54]
/** にのうで・うでさき の長さ(のばすと 28 ほど) */
const ARM_PART = 14
const CENTER_X = 16.5
/** うで の 行き先 */
const HANG_R: Pt = [35, 86]
const HANG_L: Pt = [4, 90]
const POUR_HAND: Pt = [49, 46]
const CHEER_R: Pt = [30.5, 25]
const CHEER_L: Pt = [3, 22]

const lerp = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/**
 * かた から 行き先へ とどく 2本の ほね(かた → ひじ → 手)を もとめる。
 * とどかない ときは うで を まっすぐ のばす。side は ひじ が まがる むき(+1 / -1)。
 */
function reach(shoulder: Pt, target: Pt, side: 1 | -1): { readonly elbow: Pt; readonly hand: Pt } {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.hypot(dx, dy) || 1
  const d = Math.min(dist, ARM_PART * 2 - 0.02)
  const ux = dx / dist
  const uy = dy / dist
  const h = Math.sqrt(ARM_PART ** 2 - (d / 2) ** 2)
  const elbow: Pt = [shoulder[0] + (ux * d) / 2 - uy * h * side, shoulder[1] + (uy * d) / 2 + ux * h * side]
  return { elbow, hand: [shoulder[0] + ux * d, shoulder[1] + uy * d] }
}

/** じょうろを おいた ときの 手の 場所(ここに じょうろが のこる) */
const REST_HAND = reach(SHOULDER_R, HANG_R, 1).hand

type ArmProps = { readonly shoulder: Pt; readonly elbow: Pt; readonly hand: Pt }

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。 */
function Arm({ shoulder, elbow, hand }: ArmProps) {
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={SHIRT} strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.1" fill={SKIN} />
    </>
  )
}

type Mood = 'sad' | 'hope' | 'wow' | 'joy'

function Face({ mood }: { readonly mood: Mood }) {
  // 目は 草の ほう(右)を 見る。しょんぼり の ときは 少し 下を 見る
  const gx = 0.9
  const gy = mood === 'sad' ? 0.7 : 0
  return (
    <>
      <circle cx="11" cy="44.6" r="1.9" fill={CHEEK} opacity="0.5" />
      <circle cx="22" cy="44.6" r="1.9" fill={CHEEK} opacity="0.5" />
      {mood === 'joy' ? (
        <>
          <path d="M11.3 41.8 Q13 39.4 14.7 41.8" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M18.3 41.8 Q20 39.4 21.7 41.8" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M13.2 44.8 Q16.5 51.2 19.8 44.8 Z" fill={MOUTH} strokeLinejoin="round" stroke={MOUTH} strokeWidth="0.8" />
        </>
      ) : (
        <>
          {mood === 'wow' ? (
            <>
              <circle cx="13" cy="41" r="2.6" fill="#ffffff" />
              <circle cx="20" cy="41" r="2.6" fill="#ffffff" />
              <circle cx={13 + gx} cy="41" r="1.5" fill={EYE} />
              <circle cx={20 + gx} cy="41" r="1.5" fill={EYE} />
              <path d="M10.8 36.6 Q13 34.8 15.2 36.6 M17.8 36.6 Q20 34.8 22.2 36.6" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
              <ellipse cx="16.5" cy="46.8" rx="1.5" ry="2" fill={MOUTH} />
            </>
          ) : (
            <>
              <circle cx={13 + gx} cy={41 + gy} r="1.3" fill={EYE} />
              <circle cx={20 + gx} cy={41 + gy} r="1.3" fill={EYE} />
              {mood === 'sad' ? (
                <>
                  <path d="M10.6 38.8 L14.4 37.2 M22.4 38.8 L18.6 37.2" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
                  <path d="M14 47.4 Q16.5 45.2 19 47.4" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <path d="M11 37.8 L14.8 37.6 M18.2 37.6 L22 37.8" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
                  <path d="M14.5 46 Q16.5 47.8 18.5 46" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
                </>
              )}
            </>
          )}
        </>
      )}
    </>
  )
}

type BoyProps = { readonly mood: Mood; readonly right: ReturnType<typeof reach>; readonly left: ReturnType<typeof reach>; readonly headTilt: number }

/** 男の子。あたま は 体の まんなか の上、くび は みじかい。足は こし から。 */
function Boy({ mood, right, left, headTilt }: BoyProps) {
  return (
    <>
      {/* あし と くつ */}
      <rect x="9.6" y="72" width="6" height="21" rx="3" fill={PANTS} />
      <rect x="17.4" y="72" width="6" height="21" rx="3" fill={PANTS} />
      <ellipse cx="12" cy="93.6" rx="4.6" ry="2.4" fill={SHOE} />
      <ellipse cx="21" cy="93.6" rx="4.6" ry="2.4" fill={SHOE} />
      {/* どう と くび */}
      <rect x="14" y="46" width="5" height="8" rx="2.4" fill={SKIN_SHADE} />
      <rect x="8" y="51" width="17" height="25" rx="6.5" fill={SHIRT} />
      <path d="M10 70.5 h13" stroke="#e8842f" strokeWidth="1.5" strokeLinecap="round" />
      {/* うで(かた から ひじ を通って 手へ) */}
      <Arm shoulder={SHOULDER_L} elbow={left.elbow} hand={left.hand} />
      <Arm shoulder={SHOULDER_R} elbow={right.elbow} hand={right.hand} />
      {/* あたま */}
      <Layer rotate={headTilt} origin={[CENTER_X, 47]}>
        <circle cx="7.3" cy="41.6" r="2.1" fill={SKIN} />
        <circle cx="25.7" cy="41.6" r="2.1" fill={SKIN} />
        <circle cx={CENTER_X} cy="40" r="9.4" fill={SKIN} />
        <path d="M7.2 39 C6.4 29.4 12.6 27.4 16.6 27.6 C22.8 27.2 26.6 31 25.8 39 C23.4 34.4 20.4 33.2 16.6 33.4 C12.8 33.2 9.6 34.6 7.2 39 Z" fill={HAIR} />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

/* ───────── じょうろ ───────── */

/** じょうろ。取っ手の てっぺん(0,0)を 手で もつ。口は 右。かたむけると 口が 下を むく。 */
function Can({ x, y, tilt }: { readonly x: number; readonly y: number; readonly tilt: number }) {
  return (
    <Layer x={x} y={y} rotate={tilt}>
      <path d="M-4.5 8 Q-4.5 0 0 0 Q4.5 0 4.5 8" fill="none" stroke={CAN_DARK} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M5 14.4 L14.2 5.8 L15.8 7.4 L7 15.6 Z" fill={CAN_DARK} />
      <ellipse cx="15.2" cy="6.8" rx="1.3" ry="2.7" transform="rotate(40 15.2 6.8)" fill={CAN_DARK} />
      <rect x="-6.5" y="7" width="13" height="9" rx="2.4" fill={CAN} />
      <path d="M-4.2 9.6 h4.6" stroke="#9fd6f5" strokeWidth="1.2" strokeLinecap="round" />
    </Layer>
  )
}

/** じょうろを tilt 度 かたむけた ときの 口の先(手 から の ずれ) */
function spoutTip(tilt: number): Pt {
  const rad = (tilt * Math.PI) / 180
  const [lx, ly] = [14.6, 6.8]
  return [lx * Math.cos(rad) - ly * Math.sin(rad), lx * Math.sin(rad) + ly * Math.cos(rad)]
}

/* ───────── 草 ───────── */

/** 葉の つけね(くき の 上)と 先(画の線の はし) */
const UPPER_BASE: Pt = [54, 37.9]
const UPPER_LEFT_TIP: Pt = [34, 40.5]
const UPPER_RIGHT_TIP: Pt = [79.5, 34.4]
const LOWER_BASE: Pt = [54, 61.7]
const LOWER_LEFT_TIP: Pt = [30, 64]
const LOWER_RIGHT_TIP: Pt = [79.9, 59.6]

/** くき から 出た 葉1まい。grow 0〜1 で つけね から 先へ のびる。 */
function Leaf({ base, tip, grow, sway }: { readonly base: Pt; readonly tip: Pt; readonly grow: number; readonly sway: number }) {
  if (grow <= 0) return null
  const tx = base[0] + (tip[0] - base[0]) * grow
  const ty = base[1] + (tip[1] - base[1]) * grow + sway * grow
  const dx = tx - base[0]
  const dy = ty - base[1]
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const mx = (base[0] + tx) / 2
  const my = (base[1] + ty) / 2
  // 葉の はば: ふくらみの いちばん太い所で 3.6。かど は まるく
  const off = 7.2 * Math.min(1, Math.sqrt(grow))
  const up = `${mx + nx * off} ${my + ny * off}`
  const down = `${mx - nx * off} ${my - ny * off}`
  return (
    <>
      <path d={`M${base[0]} ${base[1]} Q${up} ${tx} ${ty} Q${down} ${base[0]} ${base[1]} Z`} fill={LEAF} />
      <path d={`M${base[0]} ${base[1]} Q${down} ${tx} ${ty} Z`} fill={LEAF_DARK} />
      <path d={`M${base[0]} ${base[1]} L${base[0] + dx * 0.82} ${base[1] + dy * 0.82}`} stroke={LEAF_LIGHT} strokeWidth="0.9" strokeLinecap="round" fill="none" />
    </>
  )
}

function Sprout({ t }: SceneProps) {
  // くき は 土から ぐんぐん のびる。そのあと 葉が 下から じゅんに ひらく
  const g = span(t, GROW, 5.6, easeOut)
  if (g <= 0) return null
  const sway = wave(t, 2.6) * 0.9 * span(t, 5.6, 6.0)
  const lower = span(t, 4.85, 5.55, backOut)
  const upper = span(t, 4.95, 5.7, backOut)
  const bud = span(t, 5.3, 5.8, backOut)
  return (
    <>
      <Leaf base={LOWER_BASE} tip={LOWER_LEFT_TIP} grow={lower} sway={sway} />
      <Leaf base={LOWER_BASE} tip={LOWER_RIGHT_TIP} grow={lower} sway={-sway} />
      <Leaf base={UPPER_BASE} tip={UPPER_LEFT_TIP} grow={upper} sway={sway} />
      <Leaf base={UPPER_BASE} tip={UPPER_RIGHT_TIP} grow={upper} sway={-sway} />
      {/* くき: 3画目の線を、土から 上へ のばす */}
      <Bone char={CHAR} n={3} color={STEM} width={4.4} from={1 - g} to={1} />
      {/* てっぺんの 小さな め */}
      <Layer scale={Math.max(0, bud)} origin={[53, 15]}>
        <ellipse cx="51.2" cy="12.4" rx="2.2" ry="3.8" transform="rotate(-35 51.2 12.4)" fill={LEAF} />
        <ellipse cx="55.2" cy="12" rx="2.2" ry="3.8" transform="rotate(35 55.2 12)" fill={LEAF_DARK} />
      </Layer>
    </>
  )
}

/** 土: 水で こくなり、草が 出る ところで もりあがる。 */
function Mound({ t }: SceneProps) {
  const wet = span(t, POUR + 0.3, POUR_END)
  const swell = Math.sin(span(t, BUMP, GROW + 0.5) * Math.PI)
  return (
    <Layer scaleX={1 + swell * 0.18} scaleY={1 + swell * 0.6} origin={[54, 90]}>
      <ellipse cx="54" cy="89.6" rx="13" ry="3.8" fill={SOIL} />
      <ellipse cx="54" cy="89.6" rx="13" ry="3.8" fill={SOIL_WET} opacity={wet * 0.75} />
      <ellipse cx="50.5" cy="88.4" rx="4.2" ry="1" fill={SOIL_LIGHT} opacity={1 - wet * 0.6} />
    </Layer>
  )
}

/** 土が もりあがる ときの 土のかけら。 */
function Crumbs({ t }: SceneProps) {
  const p = span(t, GROW - 0.1, GROW + 0.9)
  if (p <= 0 || p >= 1) return null
  const bits: readonly (readonly [number, number, number])[] = [
    [-9, 11, 1.1],
    [-4, 14, 0.9],
    [5, 13, 1],
    [10, 10, 1.2],
    [1, 16, 0.8],
  ]
  return (
    <g opacity={1 - p ** 2}>
      {bits.map(([vx, vy, r]) => (
        <circle key={vx} cx={54 + vx * p} cy={87.5 - vy * p + 22 * p * p} r={r} fill={SOIL} />
      ))}
    </g>
  )
}

/** じょうろの みず: 口から まっすぐ おちて、土の上で ひろがる。 */
function Water({ t, tip }: { readonly t: number; readonly tip: Pt }) {
  const show = during(t, POUR, POUR_END, 0.2)
  if (show <= 0) return null
  const ground = 88.4
  return (
    <g opacity={show}>
      {[0, 1, 2, 3].map((k) => {
        const p = (((t - POUR) / 0.4 + k / 4) % 1 + 1) % 1
        const y = tip[1] + p * (ground - tip[1])
        return <path key={k} d="M0 -2.2 Q1.5 0.4 0 1.6 Q-1.5 0.4 0 -2.2 Z" fill={k % 2 === 0 ? WATER : WATER_LIGHT} transform={`translate(${tip[0] + (k - 1.5) * 0.9} ${y})`} />
      })}
      {[0, 0.5].map((k) => {
        const p = (((t - POUR) / 0.8 + k) % 1 + 1) % 1
        return <ellipse key={k} cx={tip[0] + 0.4} cy={ground} rx={1 + p * 6} ry={0.4 + p * 1.4} fill="none" stroke={WATER_LIGHT} strokeWidth="0.8" opacity={1 - p} />
      })}
    </g>
  )
}

/* ───────── まわりの 景色・にぎやかし ───────── */

function Backdrop({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[96, 14]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="95.2" y="2.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 96 14)`} />
        ))}
      </Layer>
      <circle cx="96" cy="14" r={6.2 * sun} fill={SUN} />
      <path d="M-4 90 Q16 72 42 83 Q72 66 113 85 V92 H-4 Z" fill={HILL} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="2" cy="22" rx="7" ry="3.2" />
        <ellipse cx="7" cy="20.2" rx="5" ry="3.2" />
        <ellipse cx="70" cy="9" rx="6" ry="2.6" />
        <ellipse cx="74.5" cy="7.6" rx="4.2" ry="2.8" />
      </g>
      {/* はたけ: うえの ふち が 5画目の 線(地面)の 高さ */}
      <rect x="-4" y="87" width="117" height="26" fill={GRASS} />
      <rect x="-4" y="87" width="117" height="2" fill={GRASS_EDGE} />
      {[40, 70, 88, 101].map((x) => (
        <path key={x} d={`M${x} 98 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={BLADE} />
      ))}
    </>
  )
}

/** くき が のびきった あと、ちょうちょ が とんでくる。 */
function Butterfly({ t }: SceneProps) {
  const p = span(t, 5.2, 6.3, easeOut)
  if (p <= 0) return null
  const x = 118 - p * 38
  const y = 16 + p * 10 + wave(t, 0.9) * 2.4
  const flap = 0.35 + Math.abs(wave(t, 0.3)) * 0.65
  return (
    <Layer x={x} y={y}>
      <Layer scaleX={flap}>
        <ellipse cx="-2.6" cy="-1.4" rx="3" ry="2.4" fill="#f58fb0" />
        <ellipse cx="2.6" cy="-1.4" rx="3" ry="2.4" fill="#f58fb0" />
        <ellipse cx="-2" cy="1.6" rx="2.2" ry="1.8" fill="#f9b5cb" />
        <ellipse cx="2" cy="1.6" rx="2.2" ry="1.8" fill="#f9b5cb" />
      </Layer>
      <rect x="-0.5" y="-3" width="1" height="6.4" rx="0.5" fill="#5a3b2a" />
    </Layer>
  )
}

/** びっくり した ときの 3本の すじ(あたまの上) */
function Gasp({ t }: SceneProps) {
  const show = during(t, WOW, CHEER - 0.1, 0.15)
  if (show <= 0) return null
  return (
    <g opacity={show} stroke="#e8534a" strokeWidth="1.3" strokeLinecap="round">
      {[-48, 0, 48].map((deg) => (
        <path key={deg} d="M0 -16 L0 -21" transform={`translate(${CENTER_X} 40) rotate(${deg})`} />
      ))}
    </g>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)

  // 男の子: ぽん と 出てきて、しょんぼり → のぞみ → びっくり → ばんざい
  const pop = Math.max(0, span(t, 0.15, 0.7, backOut))
  const mood: Mood = t < TILT_AT ? 'sad' : t < WOW ? 'hope' : t < CHEER ? 'wow' : 'joy'
  const headTilt = t < TILT_AT ? 5 : t < WOW ? 0 : t < CHEER ? -3 : 0
  const hopP = span(t, CHEER + 0.1, CHEER + 0.9)
  const hop = -Math.abs(Math.sin(hopP * Math.PI * 2)) * 3.5

  // みぎうで: じょうろを もち上げ、かたむけて みずを やり、おろして、ばんざい
  const pourK = span(t, LIFT, LIFT + 0.8, easeInOut) * (1 - span(t, POUR_END + 0.1, WAIT + 0.5, easeInOut))
  const cheerK = span(t, CHEER, CHEER + 0.6, easeOut)
  const rightTarget = lerp(lerp(HANG_R, POUR_HAND, pourK), CHEER_R, cheerK)
  const right = reach(SHOULDER_R, rightTarget, 1)
  // ひだりうで: ぶらん と たらして、ばんざい の ときに 上げる(手を ふる)
  const leftTarget = lerp(HANG_L, [CHEER_L[0] + wave(t, 0.4) * 1.5 * cheerK, CHEER_L[1]], cheerK)
  const left = reach(SHOULDER_L, leftTarget, -1)

  // じょうろ: 手に もたれて いる あいだは 手に ついて 動く。ばんざい で 手が はなれると 地面に のこる
  const tilt = 50 * span(t, TILT_AT, TILT_AT + 0.4, easeInOut) * (1 - span(t, POUR_END - 0.1, POUR_END + 0.3, easeInOut))
  const canHand = t < CHEER ? right.hand : REST_HAND
  const tip = spoutTip(50)
  const waterTip: Pt = [POUR_HAND[0] + tip[0], POUR_HAND[1] + tip[1]]

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} />
        <Mound t={t} />
        <Sprout t={t} />
        <Crumbs t={t} />
        <Water t={t} tip={waterTip} />
        <Butterfly t={t} />
        <ellipse cx="16.5" cy="94" rx="11" ry="2.4" fill="#000000" opacity="0.12" />
        <Layer scale={pop} origin={[CENTER_X, 94]}>
          <Layer y={hop}>
            <Boy mood={mood} right={right} left={left} headTilt={headTilt} />
            <Gasp t={t} />
          </Layer>
        </Layer>
        {pop > 0.6 ? <Can x={canHand[0]} y={canHand[1] + (t < CHEER ? hop : 0)} tilt={t < CHEER ? tilt : 0} /> : null}
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
    { at: 0, label: 'はたけで 男の子が しょんぼり', sound: 'pop' },
    { at: LIFT, label: 'じょうろを もち上げる' },
    { at: POUR, label: '土に みずを やる' },
    { at: WAIT, label: 'じっと まつ' },
    { at: GROW, label: '土が もりあがって、草の めが 出てくる', sound: 'pop' },
    { at: CHEER, label: '葉が ひらいて、男の子は ばんざい' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '生 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
