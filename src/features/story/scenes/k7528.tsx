/*
 * 用(もちいる・つかう どうぐ): とっての ついた おけ。いどから みずを くむ。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … おけの 左がわ(木の いた の ふち)。したの はし は、ぽたぽた おちる みずの すじ
 *   2画目(𠃍)  … おけの ふち(いちばん上)と 右がわ
 *   3・4画目   … おけを しめる 鉄の わ(たが)が 2本
 *   5画目(丨)  … おけの まんなかの いた の つぎめ
 *   (おけの とって は、絵にだけ のこる。さいごに 絵が うすくなると、字「用」が のこる)
 *
 * ながれ
 *   あつい日。ぼうしの 子が のどが かわいて ぐったり
 *   → いどの つるべ(とっての ついた おけ)を ロープで おろす → ぽちゃん と みずを くむ
 *   → うんしょ うんしょ と ロープを ひっぱる(おけが あがって くる、みずが こぼれる)
 *   → みずで いっぱいの おけが とどき、子は にっこり
 *   → カメラが おけに ぐーっと よって、ほね が ひかり、絵が うすくなって 字「用」になる
 *
 * ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   おけは いたを たがで しめた つくり。みずを くむ ための とって(つる)が ついている。
 *   つるべは、いどの わき の はしら から のびた うで に 車(かっしゃ)を つるし、
 *   ロープが 車を こえて 子の 手に とどく。子は 足を ふんばって からだを うしろに たおし、
 *   うで は かた から出て ひじ で まがり、両手で ロープを かわるがわる ひく。
 *   おけは 子より ずっと 大きく 描くので、はじめは 遠くから(ひき)見せ、あとで おけに よる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '用'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#f29c38'
const TUNIC_DARK = '#d9822a'
const TUNIC_FAR = '#b8691f'
const PANTS = '#4d6fa8'
const PANTS_DARK = '#3f5e90'
const SHOE = '#6b4a36'
const STRAW = '#f3cf7a'
const STRAW_DARK = '#e0ae4f'
const WOOD = '#b97d46'
const WOOD_SHADE = '#a46c3b'
const WOOD_LIGHT = '#cf935a'
const WOOD_DARK = '#8c5b3c'
const IRON = '#7f8a99'
const IRON_LIGHT = '#a9b3c0'
const WATER = '#7cc4f2'
const WATER_LIGHT = '#d8effc'
const STONE = '#cfc7bb'
const STONE_SHADE = '#bdb4a7'
const STONE_JOINT = '#a99f92'
const ROPE = '#c9a15b'
const GRASS = '#c5e8a9'
const HILL = '#e2f2d2'
const LEAF = '#55b86e'
const SUN = '#ffd24a'

/** くぎり の時間(秒) */
/** おけを いどに おろしはじめる */
const LOWER = 1.5
/** おけが みずに ぽちゃん */
const SPLASH = 2.6
/** ひっぱりはじめる / ひっぱり おわり(おけが とどく) */
const PULL0 = 2.9
const PULL_HALF = 0.45
const PULL_COUNT = 6
const ARRIVE = PULL0 + PULL_HALF * PULL_COUNT
/** カメラが おけに よる */
const ZOOM0 = 6.0
const ZOOM1 = 6.9
const INK = 7.2
const DONE = 10.0
const DURATION = 10.6

/* ───────── 世界の ものさし(カメラが よる前の 大きな 世界) ───────── */

type Pt = readonly [number, number]

/** 地面の たかさ と、いどの ふち(まんなか)の たかさ */
const GROUND = 140
const RIM = 108
/** いどの まんなか(おけの まんなか と そろえる) */
const WELL_X = 57
const WELL_RX = 56
const WELL_RY = 9.5
/** おけが いどの 中へ かくれる ふかさ(とって の てっぺんまで ふちの 下に かくれる) */
const DEPTH = 122

/** カメラ: さいごは 絵と字が かさなる(ひき 0.5 → よる 1) */
const FOCUS: Pt = [57, 55]
const CAM_FROM: Pt = [44, 50]
const ZOOM_FROM = 0.5

/** つるべの 車(かっしゃ)。おけの とって の まうえ で、ロープは 車の 左がわ から おけに おりる */
const WHEEL: Pt = [62.5, -24]
const WHEEL_R = 5.5
/** おけの とって の てっぺん(おけの 中の じぶんの 座標) */
const BAIL_TOP: Pt = [57, 2.75]

/** 子 の 立つ 場所と 大きさ(サンプルの 人の つくり を 1.4 ばい にして つかう) */
const CHILD_X = 144
const SCALE = 1.4
const FEET: Pt = [27.5, 94]
const SHOULDER: Pt = [25.4, 40]
const NECK: Pt = [28, 35]
/** うで の ほねの 長さ(かた→ひじ、ひじ→手) */
const ARM = 20

/** 子が にぎる ロープの 線: 車の 右がわ から ななめに おりる。手の高さ y から 手の x が きまる */
const ROPE_TOP: Pt = [WHEEL[0] + WHEEL_R, WHEEL[1]]
const HAND_HIGH = 76
const HAND_STEP = DEPTH / PULL_COUNT
const HAND_LOW = HAND_HIGH + HAND_STEP
const ROPE_SLOPE = (126 - ROPE_TOP[0]) / (96.33 - ROPE_TOP[1])
const ropeX = (y: number) => ROPE_TOP[0] + (y - ROPE_TOP[1]) * ROPE_SLOPE
/** ロープの とぐろ(ひっぱった ロープが たまる) */
const COIL: Pt = [124, 138]

/** おけの いまの ふかさ(0 = いちばん上、DEPTH = いどの そこ) */
function bucketDrop(t: number): number {
  if (t < PULL0) return DEPTH * span(t, LOWER, SPLASH, (x) => x * x)
  return DEPTH * (1 - span(t, PULL0, ARRIVE))
}

/* ───────── 子の うごき ───────── */

type Mood = 'tired' | 'hope' | 'effort' | 'happy'

/** りょうてが ロープを にぎる たかさ。かわるがわる ひく */
function handHeights(t: number): { readonly near: number; readonly far: number } {
  const restNear = 90
  const restFar = 86
  if (t < PULL0) {
    const ready = span(t, PULL0 - 0.4, PULL0, easeInOut)
    return { near: mix(ready, 0, 1, restNear, HAND_HIGH, (x) => x), far: mix(ready, 0, 1, restFar, HAND_LOW, (x) => x) }
  }
  if (t < ARRIVE) {
    const rel = (t - PULL0) / PULL_HALF
    const k = Math.floor(rel)
    const u = rel - k
    const pulling = HAND_HIGH + HAND_STEP * u
    const returning = HAND_LOW - HAND_STEP * easeInOut(u)
    const nearPulls = k % 2 === 0
    return { near: nearPulls ? pulling : returning, far: nearPulls ? returning : pulling }
  }
  const settle = span(t, ARRIVE, ARRIVE + 0.4, easeInOut)
  return { near: HAND_HIGH + (restNear - HAND_HIGH) * settle, far: HAND_LOW + (restFar - HAND_LOW) * settle }
}

type Stance = {
  readonly lean: number
  readonly bob: number
  readonly mood: Mood
  readonly step: number
  readonly shoulder: Pt
  readonly nearY: number
  readonly farY: number
}

function stanceAt(t: number): Stance {
  // ふんばって、からだを うしろ(右)へ すこし たおす。ひく たびに ゆれる
  const strain = during(t, PULL0 - 0.2, ARRIVE + 0.2, 0.3)
  const lean = strain * (3 + wave(t - PULL0, PULL_HALF * 2))
  // とどいた とき、うれしくて ぴょん と はねる
  const hop = t >= ARRIVE ? Math.abs(Math.sin(((t - ARRIVE) / 0.7) * Math.PI)) * 3 * (1 - span(t, ARRIVE + 0.7, ARRIVE + 1.4)) : 0
  const bob = -hop
  const mood: Mood = t < LOWER ? 'tired' : t < PULL0 ? 'hope' : t < ARRIVE ? 'effort' : 'happy'
  const rad = (lean * Math.PI) / 180
  const vx = (SHOULDER[0] - FEET[0]) * SCALE
  const vy = (SHOULDER[1] - FEET[1]) * SCALE
  const shoulder: Pt = [CHILD_X + vx * Math.cos(rad) - vy * Math.sin(rad), GROUND + bob + vx * Math.sin(rad) + vy * Math.cos(rad)]
  const hands = handHeights(t)
  return { lean, bob, mood, step: 0.3 * strain, shoulder, nearY: hands.near, farY: hands.far }
}

/** かた から ひじ を へて 手へ。ひじ は 下むき(うしろ)に まがる。とどかない ときは のばせる だけ のばす。 */
function reachArm(shoulder: Pt, target: Pt): { readonly elbow: Pt; readonly hand: Pt } {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.hypot(dx, dy) || 1
  const reach = Math.min(dist, ARM * 2 - 0.6)
  const ux = dx / dist
  const uy = dy / dist
  const half = reach / 2
  const bend = Math.sqrt(Math.max(ARM * ARM - half * half, 0))
  const [nx, ny] = ux > 0 ? [-uy, ux] : [uy, -ux]
  return {
    elbow: [shoulder[0] + ux * half + nx * bend, shoulder[1] + uy * half + ny * bend],
    hand: [shoulder[0] + ux * reach, shoulder[1] + uy * reach],
  }
}

function Arm({ shoulder, handY, sleeve }: { readonly shoulder: Pt; readonly handY: number; readonly sleeve: string }) {
  const { elbow, hand } = reachArm(shoulder, [ropeX(handY), handY])
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]}`} fill="none" stroke={sleeve} strokeWidth="9" strokeLinecap="round" />
      <path d={`M${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={SKIN} strokeWidth="6.4" strokeLinecap="round" />
      <circle cx={hand[0]} cy={hand[1]} r="4.2" fill={SKIN} />
    </>
  )
}

/** かお。左むき。気もちで 目と口を かえる */
function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="26.5" cy="28.8" r="2.1" fill="#ff8f8f" opacity={mood === 'tired' ? 0.85 : 0.55} />
      {mood === 'tired' && (
        <>
          <path d="M23.6 23.8 l3 1.2" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="25.4" cy="25.6" r="1.15" fill="#2b2b2b" />
          <ellipse cx="24.6" cy="30.2" rx="1.3" ry="1.7" fill="#b9483f" />
        </>
      )}
      {mood === 'hope' && (
        <>
          <circle cx="25.4" cy="25.2" r="1.25" fill="#2b2b2b" />
          <circle cx="25.8" cy="24.7" r="0.4" fill="#ffffff" />
          <path d="M23.2 29.4 Q25 31.3 27 29.8" fill="none" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'effort' && (
        <>
          <path d="M22.8 22.6 l3.8 1.8" stroke={HAIR} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M23.4 24.2 L26.4 25.7 L23.4 27.2" fill="none" stroke="#2b2b2b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="22.6" y="29.2" width="4.8" height="2.6" rx="1.1" fill="#ffffff" stroke="#b9483f" strokeWidth="0.8" />
          <path d="M25 29.4 v2.2" stroke="#b9483f" strokeWidth="0.6" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M23.6 26.4 Q25.2 23.6 26.8 26.4" fill="none" stroke="#2b2b2b" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M22.8 29.2 Q25 34 27.6 29.4 Z" fill="#b9483f" />
          <ellipse cx="25.2" cy="31.8" rx="1.3" ry="0.8" fill="#ff8a8a" />
        </>
      )}
    </>
  )
}

/** ぼうしを かぶった 子。サンプルの 人と おなじ つくり(うで は 外で つなぐ) */
function Kid({ t, stance }: { readonly t: number; readonly stance: Stance }) {
  const { lean, bob, mood, step } = stance
  const breath = mood === 'tired' ? wave(t, 0.7) : mood === 'effort' ? wave(t, 0.45) : 0
  const look = t >= SPLASH - 0.2 && t < PULL0 ? -8 : 0
  const headTilt = mood === 'tired' ? -7 + breath * 1.2 : mood === 'effort' ? 3 : mood === 'happy' ? 3 + wave(t, 0.5) * 2 : look
  return (
    <Layer x={CHILD_X - FEET[0]} y={GROUND + bob - FEET[1]} rotate={lean} scale={SCALE} origin={FEET}>
      {/* うしろ足・まえ足(ふんばる ときは ひらく) */}
      <Layer rotate={step * 17} origin={[30, 68]}>
        <rect x="27.2" y="65" width="6.2" height="27.5" rx="3.1" fill={PANTS_DARK} />
        <ellipse cx="28.6" cy="93.4" rx="5.2" ry="2.8" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 17} origin={[25, 68]}>
        <rect x="21.6" y="65" width="6.2" height="27.5" rx="3.1" fill={PANTS} />
        <ellipse cx="23" cy="93.4" rx="5.2" ry="2.8" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう と あたま の間 */}
      <rect x="24.8" y="32" width="5.2" height="8" rx="2.4" fill={SKIN_SHADE} />
      <Layer scaleX={1 + breath * 0.03} scaleY={1 + breath * 0.015} origin={[27.4, 70]}>
        <rect x="20.4" y="36.6" width="14" height="34" rx="6.8" fill={TUNIC} />
        <path d="M22.4 62.5 h10" stroke={TUNIC_DARK} strokeWidth="1.6" strokeLinecap="round" />
      </Layer>
      <Layer rotate={headTilt} origin={NECK}>
        <g transform="translate(-1.4 0.6)">
          <circle cx="30.2" cy="24.6" r="9.2" fill={SKIN} />
          <path d="M21.5 23 C21.4 13.8 31.8 11.2 37.8 17 C40.2 20.2 40.2 26 38.2 30.2 C37.6 24.4 33.4 20.2 26.6 20.6 C24.4 20.8 22.6 21.8 21.5 23 Z" fill={HAIR} />
          <Face mood={mood} />
          {/* むぎわら ぼうし: あつい日 の しるし */}
          <ellipse cx="30.2" cy="18.6" rx="13.8" ry="3.2" fill={STRAW_DARK} />
          <path d="M22.4 18.4 Q22.4 8.4 30.2 8.4 Q38 8.4 38 18.4 Z" fill={STRAW} />
          <path d="M22.5 16 Q30.2 18 37.9 16 L38 18.4 Q30.2 20.6 22.4 18.4 Z" fill="#e8534a" />
        </g>
      </Layer>
    </Layer>
  )
}

function Drop({ x, y, opacity = 1, size = 1 }: { readonly x: number; readonly y: number; readonly opacity?: number; readonly size?: number }) {
  if (opacity <= 0) return null
  return <path d="M0 -2.8 Q2 0.4 0 2 Q-2 0.4 0 -2.8 Z" fill={WATER} opacity={opacity} transform={`translate(${x} ${y}) scale(${size})`} />
}

/** あつい ときと、ひっぱる ときの あせ */
function Sweat({ t }: SceneProps) {
  const hot = during(t, 0.7, LOWER + 0.2, 0.25)
  const strain = during(t, PULL0 + 0.2, ARRIVE, 0.3)
  const show = Math.max(hot, strain)
  if (show <= 0) return null
  return (
    <>
      {[0, 0.5].map((offset) => {
        const p = ((t * 1.2 + offset) % 1)
        return <Drop key={offset} x={153 + p * 9} y={36 + p * 16 - Math.sin(p * Math.PI) * 10} opacity={show * (1 - p ** 2)} size={1.1} />
      })}
    </>
  )
}

/* ───────── 世界(いど・つるべ・地面) ───────── */

function Hills() {
  return <path d="M-300 140 L-300 112 Q-250 90 -190 108 Q-130 84 -60 106 Q-10 96 40 110 Q100 92 160 108 Q230 86 300 106 Q360 94 420 112 V140 Z" fill={HILL} />
}

function Ground({ pop }: { readonly pop: number }) {
  return (
    <>
      <rect x="-400" y={GROUND} width="1000" height="300" fill={GRASS} />
      {[-60, -30, 138, 166, 196, 226].map((x) => (
        <path key={x} d={`M${x} 141.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
      {/* 小さな 花 */}
      <g opacity={pop}>
        <path d="M184 142 v-7" stroke={LEAF} strokeWidth="1" />
        <circle cx="184" cy="134.2" r="2.2" fill="#f07f9e" />
        <circle cx="184" cy="134.2" r="0.8" fill={SUN} />
      </g>
      <ellipse cx={WELL_X} cy={GROUND + 1} rx="66" ry="4.2" fill="#000000" opacity="0.1" />
      <ellipse cx={CHILD_X} cy={GROUND + 0.6} rx="13" ry="3" fill="#000000" opacity="0.12" />
    </>
  )
}

/** いどの わきの はしら と、車(かっしゃ)を つるす うで */
function Gantry() {
  return (
    <>
      <rect x="-17" y="-38" width="8" height={GROUND + 38} rx="2" fill={WOOD_DARK} />
      <rect x="-17" y="-38" width="3" height={GROUND + 38} rx="1.5" fill={WOOD} />
      <rect x="-17" y="-39" width="88" height="7" rx="3" fill={WOOD_DARK} />
      <path d="M-9 4 L26 -32" stroke={WOOD_DARK} strokeWidth="5" strokeLinecap="round" />
      <rect x={WHEEL[0] - 1.6} y="-32" width="3.2" height="9" fill={IRON} />
      <circle cx={WHEEL[0]} cy={WHEEL[1]} r={WHEEL_R} fill={IRON} />
      <circle cx={WHEEL[0]} cy={WHEEL[1]} r="2" fill={IRON_LIGHT} />
    </>
  )
}

function WellBack() {
  return (
    <>
      <ellipse cx={WELL_X} cy={RIM} rx={WELL_RX} ry={WELL_RY} fill={STONE} />
      <ellipse cx={WELL_X} cy={RIM + 0.6} rx={WELL_RX - 6} ry={WELL_RY - 3} fill="#2d3a47" />
      <ellipse cx={WELL_X} cy={RIM - 0.4} rx={WELL_RX - 10} ry={WELL_RY - 5.4} fill="#445566" />
    </>
  )
}

/** いどの てまえの かべ。おけは、この うしろに かくれる */
function WellFront() {
  const left = WELL_X - WELL_RX
  const right = WELL_X + WELL_RX
  return (
    <>
      <path d={`M${left} ${RIM} A${WELL_RX} ${WELL_RY} 0 0 0 ${right} ${RIM} V${GROUND - 2} Q${WELL_X} ${GROUND + 6} ${left} ${GROUND - 2} Z`} fill={STONE} />
      <path d={`M${left} ${GROUND - 12} Q${WELL_X} ${GROUND - 4} ${right} ${GROUND - 12} V${GROUND - 2} Q${WELL_X} ${GROUND + 6} ${left} ${GROUND - 2} Z`} fill={STONE_SHADE} />
      <g fill="none" stroke={STONE_JOINT} strokeWidth="1" strokeLinecap="round">
        <path d={`M${left} 119 Q${WELL_X} 128 ${right} 119`} />
        <path d={`M${left} 130 Q${WELL_X} 139 ${right} 130`} />
        <path d="M20 112 v6 M44 117 v6 M70 118 v6 M96 114 v6 M10 124 v6 M33 129 v6 M58 130 v7 M84 128 v6 M105 122 v6" />
      </g>
    </>
  )
}

/* ───────── おけ(ここが 字になる) ───────── */

const BODY = 'M27 18 V86 Q27 92 33 92 H81 Q87 92 87 86 V18 Z'

function Bucket({ t }: SceneProps) {
  const water = span(t, SPLASH + 0.05, SPLASH + 0.45)
  const wet = span(t, SPLASH, SPLASH + 0.5)
  const slosh = wave(t, 0.5)
  return (
    <>
      <path d={BODY} fill={WOOD} />
      <path d="M72 18 H87 V86 Q87 92 81 92 H72 Z" fill={WOOD_SHADE} />
      <path d="M30.4 24 V86" stroke={WOOD_LIGHT} strokeWidth="2.6" strokeLinecap="round" />
      {/* いた の つぎめ。まんなかの 1本が 5画目 */}
      <path d="M41.5 22 V91 M71 22 V91" stroke={WOOD_DARK} strokeWidth="1" opacity="0.7" />
      <Bone char={CHAR} n={5} color={WOOD_DARK} width={1.5} />
      {/* たが(鉄の わ)。上から 見おろすので、まんなかが すこし 下がる */}
      {[38.8, 59.6].map((y) => (
        <g key={y}>
          <path d={`M27 ${y} Q57 ${y + 3} 87 ${y}`} fill="none" stroke={IRON} strokeWidth="5" />
          <path d={`M27 ${y - 1.7} Q57 ${y + 1.3} 87 ${y - 1.7}`} fill="none" stroke={IRON_LIGHT} strokeWidth="1.1" />
        </g>
      ))}
      <path d={BODY} fill={WOOD_DARK} opacity={wet * 0.2} />
      {/* ふち と、中の みず */}
      <ellipse cx="57" cy="18" rx="30.5" ry="5" fill={WOOD_DARK} />
      <ellipse cx="57" cy="18" rx="27.2" ry="3.2" fill="#3f2b1f" />
      <ellipse cx="57" cy="18" rx="27.2" ry="3.2" fill={WATER} opacity={water} />
      <ellipse cx={57 + slosh * 6} cy="17.4" rx="9" ry="0.9" fill={WATER_LIGHT} opacity={water * 0.9} />
      {/* とって(つる)。ロープは この てっぺんに むすぶ */}
      <path d="M27.5 18.5 Q57 -13 86.5 18.5" fill="none" stroke={IRON} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx={BAIL_TOP[0]} cy={BAIL_TOP[1]} r="2.4" fill={IRON_LIGHT} />
    </>
  )
}

/** みずを くんだ しゅんかん の しぶき(いどの 中) */
function Spray({ t }: SceneProps) {
  const tau = t - SPLASH
  if (tau <= 0 || tau > 0.75) return null
  return (
    <>
      {[-3, -2, -1, 0, 1, 2, 3].map((i) => {
        const x = WELL_X + i * 6 * (0.4 + tau)
        const y = RIM + 2 - (110 + Math.abs(i) * -12) * tau + 300 * tau * tau
        return <Drop key={i} x={x} y={Math.min(y, RIM + 6)} opacity={y > RIM + 6 ? 0 : 1 - tau} size={1.1} />
      })}
    </>
  )
}

/** おけから こぼれる みず と、そこから ぽたぽた おちる しずく */
function Spill({ t, drop }: { readonly t: number; readonly drop: number }) {
  const on = during(t, PULL0 + 0.4, ARRIVE + 0.9, 0.3)
  if (on <= 0) return null
  const sources: readonly (readonly [number, number, number])[] = [
    [27, 22, 0],
    [87, 22, 0.5],
    [41, 92, 0.25],
    [72, 92, 0.75],
  ]
  return (
    <>
      {sources.map(([x, y, phase]) => {
        const p = (t * 1.1 + phase) % 1
        return <Drop key={`${x}-${y}`} x={x} y={y + drop + p * p * 70} opacity={on * (1 - p * 0.5)} />
      })}
    </>
  )
}

/** おけ・つるべの ロープ(いどの 中の ぶぶん)。おけが ゆれるのは、おちて とまった とき */
function Hanging({ t, drop }: { readonly t: number; readonly drop: number }) {
  const swing = t >= ARRIVE ? 5 * Math.exp(-(t - ARRIVE) * 3) * Math.sin((t - ARRIVE) * 9) : wave(t, 0.9) * 0.6
  return (
    <>
      <path d={`M${WHEEL[0] - WHEEL_R} ${WHEEL[1]} V${BAIL_TOP[1] + drop}`} fill="none" stroke={ROPE} strokeWidth="1.5" />
      <Layer y={drop} rotate={swing} origin={BAIL_TOP}>
        <Bucket t={t} />
      </Layer>
    </>
  )
}

/** 車を こえて 子の 手まで のびる ロープと、足もとの とぐろ */
function RopeToKid({ t, stance, drop }: { readonly t: number; readonly stance: Stance; readonly drop: number }) {
  const lowY = Math.max(stance.nearY, stance.farY)
  const lowX = ropeX(lowY)
  const pile = 5 + 4 * (1 - drop / DEPTH)
  return (
    <>
      <path d={`M${WHEEL[0] - WHEEL_R} ${WHEEL[1]} A${WHEEL_R} ${WHEEL_R} 0 0 1 ${ROPE_TOP[0]} ${ROPE_TOP[1]} L${lowX} ${lowY}`} fill="none" stroke={ROPE} strokeWidth="1.5" strokeLinecap="round" />
      <path d={`M${lowX} ${lowY} Q${lowX - 6} ${(lowY + COIL[1]) / 2} ${COIL[0] + 3} ${COIL[1] - 2}`} fill="none" stroke={ROPE} strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx={COIL[0]} cy={COIL[1]} rx={pile} ry={pile * 0.3} fill="#d9b574" />
      {[0.35, 0.65, 0.92].map((k) => (
        <ellipse key={k} cx={COIL[0]} cy={COIL[1]} rx={pile * k} ry={pile * k * 0.3} fill="none" stroke={ROPE} strokeWidth="1" />
      ))}
      {t < 0 && null}
    </>
  )
}

function World({ t }: SceneProps) {
  const wellPop = span(t, 0.1, 0.7, backOut)
  const gantryPop = span(t, 0.4, 0.95, backOut)
  const kidPop = span(t, 0.5, 1.0, backOut)
  const ropeShow = span(t, 0.9, 1.25)
  const drop = bucketDrop(t)
  const stance = stanceAt(t)
  const near: Pt = stance.shoulder
  return (
    <>
      <Hills />
      <Ground pop={span(t, 0, 0.5)} />
      <Layer scaleY={gantryPop} origin={[-13, GROUND]}>
        <Gantry />
      </Layer>
      <Layer scaleY={wellPop} origin={[WELL_X, GROUND]}>
        <WellBack />
      </Layer>
      <Layer opacity={ropeShow}>
        <Hanging t={t} drop={drop} />
        <Spill t={t} drop={drop} />
        <Spray t={t} />
      </Layer>
      <Layer scaleY={wellPop} origin={[WELL_X, GROUND]}>
        <WellFront />
      </Layer>
      <Layer scale={kidPop} origin={[CHILD_X, GROUND]}>
        <Arm shoulder={near} handY={stance.farY} sleeve={TUNIC_FAR} />
        <Layer opacity={ropeShow}>
          <RopeToKid t={t} stance={stance} drop={drop} />
        </Layer>
        <Kid t={t} stance={stance} />
        <Arm shoulder={near} handY={stance.nearY} sleeve={TUNIC_DARK} />
        <Sweat t={t} />
      </Layer>
    </>
  )
}

/* ───────── そら(カメラが よると きえる) ───────── */

function Sky({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  const fly = span(t, 0.8, 4.2)
  const flap = wave(t, 0.35)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[96, 11]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="95.2" y="-1.4" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 96 11)`} />
        ))}
      </Layer>
      <circle cx="96" cy="11" r={6.2 * sun} fill={SUN} />
      {/* とおくを とぶ 鳥 */}
      <Layer opacity={during(t, 0.8, 4.2, 0.3)} x={110 - fly * 125} y={22 + Math.sin(fly * 6) * 2.4}>
        <path d="M-3.6 0 Q-1.8 -2.4 0 0 Q1.8 -2.4 3.6 0" fill="none" stroke="#5a6a7a" strokeWidth="0.9" strokeLinecap="round" transform={`scale(1 ${flap})`} />
      </Layer>
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)
  // カメラ: ひき(子も いども 見える)から、おけに ぐーっと よる。さいごは 絵と字が かさなる
  const zoom = span(t, ZOOM0, ZOOM1, easeInOut)
  const scale = ZOOM_FROM + (1 - ZOOM_FROM) * zoom
  const camX = CAM_FROM[0] + (FOCUS[0] - CAM_FROM[0]) * zoom
  const camY = CAM_FROM[1] + (FOCUS[1] - CAM_FROM[1]) * zoom
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Layer x={camX - FOCUS[0]} y={camY - FOCUS[1]} scale={scale} origin={FOCUS}>
          <World t={t} />
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
    { at: 0, label: 'あつい日。ぼうしの 子が ぐったり', sound: 'pop' },
    { at: LOWER, label: 'つるべの おけを いどに おろす' },
    { at: SPLASH, label: 'ぽちゃん と みずを くむ', sound: 'pop' },
    { at: PULL0, label: 'うんしょ うんしょ と ロープを ひっぱる' },
    { at: ARRIVE, label: 'みずで いっぱいの おけが とどく。にっこり' },
    { at: ZOOM0, label: 'おけに ぐーっと よる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '用 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
