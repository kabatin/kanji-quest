/*
 * 買(かう): あみで かいを あつめて、おかねにして パンを かう。
 *
 * ほね(画と絵の対応)
 *   1〜5画目  … 子どもが ぼうの さきに もった 大きな あみ(たて あみめ 3本 と、よこの ふち)
 *               1画目 = あみの 左はし、3・4画目 = あみの たて あみめ、2画目 = うえの ふち と 右はし、
 *               5画目 = あみの そこ(かいが のる)
 *   6〜10画目 … 大きな はまぐりの かい(6・7画目 = かいの ふち、8〜10画目 = 3本の すじ)
 *   11・12画目 … かいを のせた 木の だい の ひらいた あし
 *
 * ながれ
 *   はまべに 子どもが きて、パンが たべたくて ほしそうに する(ふきだしに パン)
 *   → あみを すなに おろして、かいを すくう(かいが あみに のる)
 *   → あみを 高く もちあげて にっこり
 *   → 木の だい が でて、かいが ぴょんと とんで いき、大きな かい(おかね)に なる
 *   → パンを かって、大よろこび(パンを だきしめる)
 *   → ほね が ひかって、絵が うすくなり、字「買」が のこる
 *
 * 子どもは、ほんものの人の つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる。ぼうを もつ 手 は、ぼうの上に ちゃんと のる。
 *   かがむときは、こし から 前に たおれて、あし は みじかく たたむ。
 *   あみは、ぼうの さきに ついた わく。すなに おろすと、よこから 見て 平たく なる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '買'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#ef7a5a'
const TUNIC_DARK = '#d9654a'
const TUNIC_FAR = '#c05a42'
const PANTS = '#4a6fa5'
const PANTS_DARK = '#3d5d8f'
const SHOE = '#6b4a36'
const WOOD = '#8c5b3c'
const WOOD_DARK = '#70452b'
const CORD = '#d9a86a'
const SAND = '#f6e2b3'
const SAND_DARK = '#ecd09a'
const SEA = '#a9dcf5'
const SEA_LIGHT = '#d6f0fb'
const SHELL = '#f7b6c2'
const SHELL_DARK = '#e8879b'
const CLAM = '#f6c6b8'
const CLAM_RIDGE = '#e79c8c'
const CLAM_RIM = '#d9826f'
const BUN = '#e9a85a'
const BUN_DARK = '#c98638'
const BUN_LIGHT = '#f7cf8c'

/** くぎり の時間(秒) */
const WANT = 1.0
const DIP_FROM = 2.4
const DIP_TO = 3.3
/** あみ が すなに ついて、かいが のる */
const LAND = 3.4
const LIFT_FROM = 3.8
const LIFT_TO = 4.7
const STOOL = 4.4
const HOP_FROM = 4.9
const HOP_TO = 5.7
const BUY = 6.2
const INK = 6.9
const DONE = 9.3
const DURATION = 10

/** 子どもの 立つ場所(こし の まんなかの x)と、足の下の 地面 */
const CX = 12
const GROUND = 95
const HIP_STAND = 70
/** かがんだとき、こしが 下がる ぶん */
const CROUCH = 7
const LEAN_MAX = 20
const ARM_PART = 11.5

type Pt = readonly [number, number]

/** あみの つなぎめ(1画目の おわり = あみの 左した)。ぼうは ここから でる */
const NET_JOINT: Pt = [25, 32]
/** あみを 上げたとき と おろしたとき の ぼうの さき */
const JOINT_UP: Pt = NET_JOINT
const JOINT_DOWN: Pt = [35, 95]
/** ぼうを にぎる手 */
const GRIP_UP: Pt = [23.5, 64]
const GRIP_DOWN: Pt = [26, 80]
const POLE_LENGTH = 38
/** すなに おろしたとき、あみは よこから 見て 平たい */
const NET_FLAT = 0.22

/** あみに のる かい(あみの 中の x) */
const NET_SHELLS = [42, 53, 64, 75] as const
const SHELL_LIFT = 8

const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/** あみを おろしている度合い(0 = 上 / 1 = すなに ぺたり) */
function dip(t: number): number {
  return span(t, DIP_FROM, DIP_TO, easeInOut) - span(t, LIFT_FROM, LIFT_TO, easeInOut)
}

/* ───────── 場所 ───────── */

function Beach({ t }: SceneProps) {
  const appear = span(t, 0, 0.5, easeOut)
  const drift = wave(t, 3.2) * 1.4
  return (
    <Layer opacity={appear}>
      <circle cx="101" cy="9" r="5" fill="#ffd24a" />
      <rect x="-2" y="70" width="113" height="24" fill={SEA} />
      <g fill="none" stroke={SEA_LIGHT} strokeWidth="1.4" strokeLinecap="round">
        <path d={`M${6 + drift} 76 q4 -2 8 0 t8 0`} />
        <path d={`M${60 - drift} 73 q4 -2 8 0 t8 0`} />
        <path d={`M${84 + drift} 82 q4 -2 8 0 t8 0`} />
        <path d={`M${30 - drift} 84 q4 -2 8 0 t8 0`} />
      </g>
      <path d="M-2 90 Q30 85 58 90 T112 88 V112 H-2 Z" fill={SAND} />
      <ellipse cx="54.5" cy="98" rx="51" ry="5" fill={SAND_DARK} opacity="0.55" />
      {[8, 90, 100].map((x) => (
        <circle key={x} cx={x} cy={96} r="0.9" fill={SAND_DARK} />
      ))}
    </Layer>
  )
}

/** はるか うえを とぶ かもめ */
function Gull({ t }: SceneProps) {
  const x = 118 - t * 12
  if (x < -8) return null
  const flap = wave(t, 0.7) * 1.6
  return (
    <path d={`M${x - 4} ${5 - flap} Q${x - 2} ${3 - flap} ${x} ${5.4} Q${x + 2} ${3 - flap} ${x + 4} ${5 - flap}`} fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
  )
}

/* ───────── かい・パン ───────── */

/** 小さな かい(ほたてがい): すじ が 3本 */
function Shell({ x, y, scale = 1, rotate = 0 }: { readonly x: number; readonly y: number; readonly scale?: number; readonly rotate?: number }) {
  return (
    <Layer x={x} y={y} scale={scale} rotate={rotate}>
      <path d="M-4.2 2 Q-5 -3.4 0 -4.6 Q5 -3.4 4.2 2 Q0 3.4 -4.2 2 Z" fill={SHELL} />
      <path d="M0 3 V-4 M-2.2 2.6 L-3 -2.6 M2.2 2.6 L3 -2.6" fill="none" stroke={SHELL_DARK} strokeWidth="0.7" strokeLinecap="round" />
      <rect x="-1.6" y="2" width="3.2" height="1.6" rx="0.8" fill={SHELL_DARK} />
    </Layer>
  )
}

/** まるい パン */
function BunBread({ x, y, scale = 1 }: { readonly x: number; readonly y: number; readonly scale?: number }) {
  return (
    <Layer x={x} y={y} scale={scale}>
      <ellipse cx="0" cy="0" rx="6.4" ry="5" fill={BUN} />
      <path d="M-5.6 1.6 Q0 5.6 5.6 1.6 Q5.4 4.4 0 5 Q-5.4 4.4 -5.6 1.6 Z" fill={BUN_DARK} />
      <ellipse cx="-2" cy="-2" rx="2.8" ry="1.5" fill={BUN_LIGHT} />
      <circle cx="2.4" cy="-1.6" r="0.55" fill={BUN_DARK} />
      <circle cx="0.4" cy="0.6" r="0.55" fill={BUN_DARK} />
      <circle cx="3.2" cy="1.2" r="0.55" fill={BUN_DARK} />
    </Layer>
  )
}

/** パンを おもう ふきだし(子どもの あたまの 右上) */
function Wish({ t }: SceneProps) {
  const show = during(t, WANT, DIP_FROM + 0.1, 0.3)
  if (show <= 0) return null
  const pop = span(t, WANT, WANT + 0.4, backOut)
  return (
    <Layer opacity={show}>
      <circle cx="26" cy="49" r="1.5" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <circle cx="30" cy="45" r="2.3" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <Layer scale={Math.max(0, pop)} origin={[40, 36]}>
        <circle cx="40" cy="36" r="10.5" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.8" />
        <BunBread x={40} y={36} scale={1.1} />
      </Layer>
    </Layer>
  )
}

/** 大きな はまぐりの かい(字の 6〜10画目の ところ)。むかしの おかね */
function Clam({ t }: SceneProps) {
  const pop = Math.max(0, span(t, HOP_TO - 0.1, HOP_TO + 0.5, backOut))
  if (pop <= 0) return null
  return (
    <Layer scale={pop} origin={[57, 80]}>
      {/* ちょうつがい(かいの 上の とんがり) と、そこから ひろがる ほそい すじ */}
      <path d="M49 40 Q50 35.4 57 35.4 Q64 35.4 65 40 Z" fill={CLAM_RIM} />
      <path d="M44 41 Q57 36.4 70 41 Q76 49 76 62 V71 Q76 80 66 80 H48 Q38 80 38 71 V62 Q38 49 44 41 Z" fill={CLAM} stroke={CLAM_RIM} strokeWidth="1.6" strokeLinejoin="round" />
      <g fill="none" stroke={CLAM_RIDGE} strokeWidth="1.8" strokeLinecap="round">
        <path d="M37.8 52.2 Q56 51.4 74.8 50" />
        <path d="M37.8 64.8 Q56 64 74.6 62.4" />
        <path d="M38.4 76.9 Q56 76 74.6 74.8" />
      </g>
      <path d="M43 43.4 Q48 41 54 41.4" fill="none" stroke="#fff0e8" strokeWidth="2" strokeLinecap="round" />
    </Layer>
  )
}

/** 木の だい。かいを のせる(11・12画目が ひらいた あし) */
function Stool({ t }: SceneProps) {
  const grow = Math.max(0, span(t, STOOL, STOOL + 0.5, backOut))
  if (grow <= 0) return null
  return (
    <Layer scaleY={grow} origin={[54, 99]}>
      <Bone char={CHAR} n={11} color={WOOD} width={3.6} />
      <Bone char={CHAR} n={12} color={WOOD} width={3.6} />
      <rect x="39" y="79.6" width="38" height="4.4" rx="2.2" fill={WOOD} />
      <rect x="39" y="82" width="38" height="2" rx="1" fill={WOOD_DARK} />
    </Layer>
  )
}

/* ───────── 子ども と あみ ───────── */

type ChildPose = {
  readonly hip: Pt
  readonly lean: number
  readonly mood: 'wish' | 'work' | 'joy'
  readonly nearHand: Pt
  readonly farHand: Pt
  readonly breath: number
}

const rad = (deg: number) => (deg * Math.PI) / 180

/** かたから 手まで 2本の ほね で つなぐ。ひじは 下(うしろ)へ 出る。 */
function reachArm(shoulder: Pt, target: Pt): { readonly elbow: Pt; readonly hand: Pt } {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.min(Math.hypot(dx, dy), ARM_PART * 2 - 0.01)
  const ux = dx / (Math.hypot(dx, dy) || 1)
  const uy = dy / (Math.hypot(dx, dy) || 1)
  const h = Math.sqrt(Math.max(0, ARM_PART * ARM_PART - (dist / 2) ** 2))
  const mid: Pt = [shoulder[0] + ux * (dist / 2), shoulder[1] + uy * (dist / 2)]
  // ひじの むき の ふたつ の うち、下・うしろ に ある ほう
  const a: Pt = [mid[0] - uy * h, mid[1] + ux * h]
  const b: Pt = [mid[0] + uy * h, mid[1] - ux * h]
  const elbow = a[1] - a[0] * 0.4 > b[1] - b[0] * 0.4 ? a : b
  return { elbow, hand: [shoulder[0] + ux * dist, shoulder[1] + uy * dist] }
}

function Arm({ shoulder, target, color }: { readonly shoulder: Pt; readonly target: Pt; readonly color: string }) {
  const { elbow, hand } = reachArm(shoulder, target)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3" fill={SKIN} />
    </>
  )
}

/** あたまの かお(右むき)。気持ちで 目と口が かわる。 */
function Face({ mood }: { readonly mood: ChildPose['mood'] }) {
  return (
    <>
      <circle cx="2.6" cy="3.8" r="1.9" fill="#ff9d9d" opacity="0.55" />
      {mood === 'wish' && (
        <>
          <path d="M3 -3.6 l3.4 -0.8" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <circle cx="4.6" cy="-1" r="1.2" fill="#2b2b2b" />
          <path d="M4 5 Q5.6 3.8 7 5" fill="none" stroke="#b9483f" strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'work' && (
        <>
          <circle cx="4.6" cy="-1" r="1.2" fill="#2b2b2b" />
          <circle cx="5.6" cy="4.4" r="1" fill="#b9483f" />
        </>
      )}
      {mood === 'joy' && (
        <>
          <path d="M3 -0.4 Q4.5 -2.4 6 -0.4" fill="none" stroke="#2b2b2b" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M3.6 3.2 Q5.4 7 7.4 3.2 Z" fill="#b9483f" />
        </>
      )}
    </>
  )
}

function Child({ pose }: { readonly pose: ChildPose }) {
  const { hip, lean, mood, nearHand, farHand, breath } = pose
  const legScale = (GROUND - hip[1]) / (GROUND - HIP_STAND)
  const shoulder: Pt = [hip[0] + 0.5 * Math.cos(rad(lean)) - -18.5 * Math.sin(rad(lean)), hip[1] + 0.5 * Math.sin(rad(lean)) + -18.5 * Math.cos(rad(lean))]
  // 体の まんなか を さがして かた に する(右むきの 子の かた)
  return (
    <>
      <Arm shoulder={shoulder} target={farHand} color={TUNIC_FAR} />
      <Layer scaleY={legScale} origin={[CX, GROUND]}>
        <rect x={CX - 0.4} y={HIP_STAND - 2} width="5.6" height={GROUND - HIP_STAND + 1} rx="2.8" fill={PANTS_DARK} />
        <ellipse cx={CX + 3.6} cy={GROUND + 0.4} rx="5.2" ry="2.6" fill={SHOE} />
        <rect x={CX - 5.8} y={HIP_STAND - 2} width="5.6" height={GROUND - HIP_STAND + 1} rx="2.8" fill={PANTS} />
        <ellipse cx={CX - 2.2} cy={GROUND + 0.4} rx="5.2" ry="2.6" fill={SHOE} />
      </Layer>
      <Layer rotate={lean} origin={hip} scaleY={1 + breath * 0.015}>
        {/* くび: どう と あたま の間を みじかく つなぐ */}
        <rect x={hip[0] - 1.8} y={hip[1] - 27} width="5" height="7" rx="2.2" fill={SKIN_SHADE} />
        <rect x={hip[0] - 6.8} y={hip[1] - 22} width="13.6" height="22" rx="6" fill={TUNIC} />
        <path d={`M${hip[0] - 5} ${hip[1] - 6} h10`} stroke={TUNIC_DARK} strokeWidth="1.5" strokeLinecap="round" />
        <g transform={`translate(${hip[0] + 0.8} ${hip[1] - 30})`}>
          <circle cx="0" cy="0" r="8.6" fill={SKIN} />
          <path d="M-8.7 1 C-9.2 -8 -1 -10.6 4.4 -8.2 C7.4 -6.6 8.6 -4 8.6 -1.4 C6 -4.4 2.6 -5.4 -1.6 -4.6 C-5 -4 -7.2 -2 -8.7 1 Z" fill={HAIR} />
          <Face mood={mood} />
        </g>
      </Layer>
      <Arm shoulder={shoulder} target={nearHand} color={TUNIC_DARK} />
    </>
  )
}

/** ぼうの さきに ついた あみ。すなに おろすと 平たい。 */
function Net({ joint, flat }: { readonly joint: Pt; readonly flat: number }) {
  return (
    <Layer x={joint[0] - NET_JOINT[0]} y={joint[1] - NET_JOINT[1]} scaleY={flat} origin={NET_JOINT}>
      {/* あみの めの うすい かげ */}
      <path d="M22 15 L88 13 L85 28 L25 31 Z" fill="#ffffff" opacity="0.4" />
      {[1, 2, 3, 4, 5].map((n) => (
        <Bone key={n} char={CHAR} n={n} color={n === 2 ? '#c58f4e' : CORD} width={n === 2 ? 2.8 : 2.2} />
      ))}
    </Layer>
  )
}

/** あみの上に のった かい(すなに ある ときは すなの上) */
function NetShells({ t, joint, flat }: { readonly t: number; readonly joint: Pt; readonly flat: number }) {
  const hop = span(t, HOP_FROM, HOP_TO)
  return (
    <>
      {NET_SHELLS.map((px, i) => {
        const base: Pt =
          t < LAND
            ? [JOINT_DOWN[0] + px - NET_JOINT[0], JOINT_DOWN[1] + (NET_JOINT[1] - SHELL_LIFT - NET_JOINT[1]) * NET_FLAT]
            : [joint[0] + px - NET_JOINT[0], joint[1] + (NET_JOINT[1] - SHELL_LIFT - NET_JOINT[1]) * flat]
        if (hop <= 0) return <Shell key={px} x={base[0]} y={base[1]} rotate={i * 12} />
        // 1つずつ すこし ずらして、だい の上へ ぴょん と とぶ
        const p = Math.min(1, Math.max(0, (hop - i * 0.1) / 0.6))
        if (p >= 1) return null
        const x = base[0] + (57 - base[0]) * p
        const y = base[1] + (79 - base[1]) * p - Math.sin(p * Math.PI) * 16
        return <Shell key={px} x={x} y={y} rotate={i * 12 + p * 200} />
      })}
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 12)

  const d = dip(t)
  const appear = Math.max(0, span(t, 0.15, 0.7, backOut))
  const joy = t >= LIFT_FROM
  const mood: ChildPose['mood'] = t < DIP_FROM ? 'wish' : joy ? 'joy' : 'work'

  // よろこんで はねる(パンを かった あと)
  const cheer = during(t, BUY, INK, 0.1)
  const jump = Math.abs(Math.sin(((t - BUY) * Math.PI) / 0.5)) * 2.4 * cheer

  const hipY = HIP_STAND + CROUCH * d
  const lean = LEAN_MAX * d
  const joint = lerpPt(JOINT_UP, JOINT_DOWN, d)
  const grip = lerpPt(GRIP_UP, GRIP_DOWN, d)
  const flat = 1 - (1 - NET_FLAT) * d
  // ぼうは、さき から にぎる手 の むき へ、いつも おなじ長さ
  const gx = grip[0] - joint[0]
  const gy = grip[1] - joint[1]
  const gl = Math.hypot(gx, gy)
  const butt: Pt = [joint[0] + (gx / gl) * POLE_LENGTH, joint[1] + (gy / gl) * POLE_LENGTH]

  // パンを かったあと、むこうの うでで パンを むねに だく
  const bread = Math.max(0, span(t, BUY, BUY + 0.4, backOut))
  const farRest: Pt = [CX - 3, 84]
  const farHold: Pt = [CX + 7, 57]
  const farHand = lerpPt(farRest, farHold, span(t, BUY - 0.1, BUY + 0.3, easeOut))
  const pose: ChildPose = { hip: [CX, hipY], lean, mood, nearHand: grip, farHand, breath: wave(t, 1.6) }

  const star = span(t, HOP_TO, HOP_TO + 0.8)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Beach t={t} />
        <Gull t={t} />
        <Stool t={t} />
        <Clam t={t} />
        <Layer y={-jump}>
          <Layer scale={appear} origin={[CX, GROUND]}>
            <Child pose={pose} />
            <path d={`M${joint[0]} ${joint[1]} L${butt[0]} ${butt[1]}`} stroke={WOOD} strokeWidth="2.6" strokeLinecap="round" />
            <Net joint={joint} flat={flat} />
            <NetShells t={t} joint={joint} flat={flat} />
            {/* ぼうを にぎる手 は ぼうの上 */}
            <circle cx={grip[0]} cy={grip[1]} r="3" fill={SKIN} />
            {bread > 0 && <BunBread x={farHold[0] + 6} y={farHold[1] + 0.5} scale={bread} />}
          </Layer>
        </Layer>
        <Wish t={t} />
        {star > 0 && star < 1 && (
          <g opacity={1 - star}>
            {[0, 1, 2, 3].map((i) => (
              <Star key={i} cx={57 + Math.cos(i * 1.57 + 0.6) * (16 + star * 18)} cy={60 + Math.sin(i * 1.57 + 0.6) * (14 + star * 14)} r={3 - star} color="#ffd95a" spin={star * 160 + i * 30} />
            ))}
          </g>
        )}
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} width={8} />
      <Ink char={CHAR} progress={ink.progress} tint={ink.tint} />
      <Sparkles cx={54.5} cy={54} progress={ink.sparkle} />
    </>
  )
}

const scene: SceneModule = {
  char: CHAR,
  duration: DURATION,
  beats: [
    { at: 0, label: 'はまべに 子どもが くる', sound: 'pop' },
    { at: WANT, label: 'パンが ほしい' },
    { at: DIP_FROM, label: 'あみを おろして、かいを すくう', sound: 'pop' },
    { at: LIFT_FROM, label: 'あみを もちあげる。にっこり' },
    { at: STOOL, label: 'だいが でて、かいが おかね に なる', sound: 'pop' },
    { at: BUY, label: 'パンを かって 大よろこび', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '買 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
