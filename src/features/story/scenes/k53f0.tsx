/*
 * 台(だい): 四角い台に、三角の つみきを のせる。
 *
 * ほね(画と絵の対応)
 *   1・2画目(厶) … 台の 上に のせた 三角の つみき(ななめの 2本の へん と てっぺん)
 *   3画目(丨)    … 四角い台の 左の かべ
 *   4画目(𠃍)    … 台の いちばん上の たいらな面 と、右の かべ
 *   5画目(一)    … 台の 下の へり(地面に ついている ところ)
 *
 * ながれ
 *   四角い台が ぽん と できる
 *   → 子どもが 三角の つみきを かかえて あるいてくる(台の上に のせたい。てん線の かげ が その あいず)
 *   → 1回目: 「うーん」と もちあげるけど、おもくて ずるっと さがる。ぐったり
 *   → ふうっと いきを して、もういちど。ぐっと もちあげて、台の上へ そうっと のせる
 *   → ぽん! のった。大よろこびで ばんざい
 *   → ほね が ひかって、絵が うすくなり、字「台」が のこる
 *
 * 人と つみき・台は、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる(かた → ひじ → 手)。くび は みじかく、どう の上。
 *   台は 四角で たいら。つみき は 台の 上に 底を ぺたっと つけて のせる。
 *   字の形と ぴったりは 重ならないが、三角が 上・四角が 下 という ならびは 同じ。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '台'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#4f9be0'
const TUNIC_ARM = '#3c82c4'
const TUNIC_FAR = '#33709f'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const WOOD = '#d9a066'
const WOOD_LIGHT = '#ebc088'
const WOOD_DARK = '#bd8450'
const BLOCK = '#e8634a'
const BLOCK_LIGHT = '#f58f76'
const BLOCK_DARK = '#c94c36'
const STAR_YELLOW = '#ffd24a'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const MOUTH = '#b9483f'
const EYE = '#2b2b2b'

/** くぎり の時間(秒) */
const WALK_FROM = 0.7
const WALK_TO = 2.5
/** 「のせたい」の てん線の かげ が出る */
const WISH = 2.1
/** 1回目: もちあげる → ずるっと さがる → ぐったり */
const TRY1 = 2.7
const DROP = 3.3
const SLUMP = 3.8
/** ふうっと いきを して、もういちど */
const RESOLVE = 4.6
const HEAVE = 4.9
const PUSH = 5.5
const SET_DOWN = 6.0
const PLACED = 6.3
const INK = 7.3
const DONE = 10.3
const DURATION = 10.8

/* ───────── ばしょ・大きさ ───────── */

/** 台(四角い きの はこ)。上の面が y = 62、地面に ついている そこが y = 93 */
const TABLE = { left: 29.5, right: 80.5, top: 62, bottom: 93 } as const
/** つみきを のせる 台の 上の まんなか と、かかえているとき の まんなか(子どもの 前) */
const BLOCK_ON_TABLE_X = 54
const BLOCK_CARRY_X = 40
/** かかえているとき の つみきの 底の 高さ */
const BLOCK_CARRY_Y = 80
/** 子どもの 足もと(体の じく)と、かた */
const HIP: readonly [number, number] = [14, 78]
const SHOULDER_LOCAL: readonly [number, number] = [13.5, 60]
const NECK: readonly [number, number] = [15, 55]
/** うで の 1本ぶん(かた → ひじ、ひじ → 手)の長さ */
const ARM_PART = 13

type Point = readonly [number, number]

/* ───────── 背景・台 ───────── */

function Backdrop({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[95, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="94.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 95 13)`} />
        ))}
      </Layer>
      <circle cx="95" cy="13" r={6.2 * sun} fill={SUN} />
      {/* ゆっくり ながれる 雲(おくゆき を出す) */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="14" cy="14" rx="7" ry="3.2" />
        <ellipse cx="19" cy="12.2" rx="5" ry="3.2" />
      </g>
      <path d="M-4 99 Q18 78 44 92 Q72 72 113 94 V101 H-4 Z" fill="#e2f2d2" />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 24, 86, 102].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 台の そばに さく 花 */
function Flowers({ t }: SceneProps) {
  const sway = wave(t, 2.6) * 1.2
  return (
    <>
      {[
        { x: 90, h: 8, color: '#ff9db8' },
        { x: 96.5, h: 11, color: '#ffd24a' },
        { x: 102, h: 7, color: '#c8a6f2' },
      ].map(({ x, h, color }, i) => (
        <g key={x} transform={`rotate(${sway * (i % 2 === 0 ? 1 : -1)} ${x} 96)`}>
          <path d={`M${x} 96.5 V${96.5 - h}`} stroke="#4c8f52" strokeWidth="1.1" strokeLinecap="round" />
          <circle cx={x} cy={96.5 - h} r="2.5" fill={color} />
          <circle cx={x} cy={96.5 - h} r="0.9" fill="#fff4c2" />
        </g>
      ))}
    </>
  )
}

/** ひらひら とぶ ちょうちょ(にぎやかし) */
function Butterfly({ t }: SceneProps) {
  const x = 92 + Math.sin(t * 0.9) * 7
  const y = 58 + Math.sin(t * 1.7) * 5
  const flap = 0.35 + 0.65 * Math.abs(wave(t, 0.28))
  return (
    <Layer x={x} y={y}>
      <Layer scaleX={flap}>
        <ellipse cx="-2.3" cy="-1" rx="2.4" ry="1.9" fill="#ffb36b" />
        <ellipse cx="2.3" cy="-1" rx="2.4" ry="1.9" fill="#ffb36b" />
        <ellipse cx="-1.8" cy="1.4" rx="1.7" ry="1.3" fill="#ff8f5c" />
        <ellipse cx="1.8" cy="1.4" rx="1.7" ry="1.3" fill="#ff8f5c" />
      </Layer>
      <rect x="-0.4" y="-2" width="0.8" height="4.6" rx="0.4" fill="#6b4a36" />
    </Layer>
  )
}

/** 四角い台。下から ぽん と ふくらむ。 */
function Table({ t }: SceneProps) {
  const grow = span(t, 0.1, 0.8, backOut)
  const width = TABLE.right - TABLE.left
  const height = TABLE.bottom - TABLE.top
  return (
    <>
      <ellipse cx="55" cy="97.6" rx={31 * grow} ry="3" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.7 + 0.3 * grow} scaleY={grow} origin={[55, TABLE.bottom]}>
        <rect x={TABLE.left} y={TABLE.top} width={width} height={height} rx="3.5" fill={WOOD} />
        {/* 上の ふち を 明るく、右の かべ を 少し くらく */}
        <rect x={TABLE.left} y={TABLE.top} width={width} height="4.4" rx="2.2" fill={WOOD_LIGHT} />
        <rect x={TABLE.right - 4.6} y={TABLE.top + 3} width="4.6" height={height - 3} rx="2" fill={WOOD_DARK} opacity="0.55" />
        {/* きの いた の すじ */}
        <path d={`M${TABLE.left + 2} 77 H${TABLE.right - 4} M${TABLE.left + 2} 86 H${TABLE.right - 4}`} stroke={WOOD_DARK} strokeWidth="1" strokeLinecap="round" opacity="0.75" />
      </Layer>
    </>
  )
}

/* ───────── つみき ───────── */

/** 三角の つみき。底の まんなか が (0, 0)。ふちを まるく する */
function BlockShape() {
  return (
    <>
      <path d="M-21.5 -2.5 L21.5 -2.5 L0 -37 Z" fill={BLOCK} stroke={BLOCK} strokeWidth="5" strokeLinejoin="round" />
      {/* 底に 1だん くらい かげ・左上に ハイライト */}
      <path d="M-23 -2.5 H23 L23.4 0.6 Q23 2.2 21 2.2 H-21 Q-23 2.2 -23.4 0.6 Z" fill={BLOCK_DARK} />
      <path d="M-3 -31 L-15.5 -9 L-8.5 -9 Z" fill={BLOCK_LIGHT} />
      <circle cx="0" cy="-14" r="4.2" fill={STAR_YELLOW} />
    </>
  )
}

/** 台の上の「ここに のせたい」の てん線の かげ */
function WishGhost({ t }: SceneProps) {
  const show = during(t, WISH, PLACED, 0.3)
  if (show <= 0) return null
  const pulse = 0.5 + 0.18 * wave(t, 0.9)
  return (
    <g opacity={show * pulse} transform={`translate(${BLOCK_ON_TABLE_X} ${TABLE.top})`}>
      <path d="M-21.5 -2.5 L21.5 -2.5 L0 -37 Z" fill="none" stroke={BLOCK} strokeWidth="1.5" strokeDasharray="3 2.6" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

/* ───────── 子ども ───────── */

type Mood = 'eager' | 'strain' | 'tired' | 'happy'

function Face({ mood }: { readonly mood: Mood }) {
  const cheeks = (
    <>
      <circle cx="13.4" cy="51.6" r="1.9" fill="#ff9d9d" opacity="0.55" />
      <circle cx="22.6" cy="51.2" r="1.9" fill="#ff9d9d" opacity="0.55" />
    </>
  )
  switch (mood) {
    case 'strain':
      // 目を ぎゅっと つぶり、はを くいしばる
      return (
        <>
          <path d="M14.2 46.4 l2.8 1.4 l-2.8 1.4 M22.2 46.4 l-2.8 1.4 l2.8 1.4" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="15.6" y="51" width="5.6" height="2.8" rx="1.3" fill="#ffffff" stroke={MOUTH} strokeWidth="0.9" />
          {cheeks}
        </>
      )
    case 'tired':
      // まゆが ハの字、口は への字
      return (
        <>
          <circle cx="15.8" cy="48.4" r="1.2" fill={EYE} />
          <circle cx="21" cy="48.4" r="1.2" fill={EYE} />
          <path d="M13.8 45.8 L17.2 44.4 M22.8 45.8 L19.6 44.4" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M16.4 53.4 Q18.4 51.4 20.6 53.4" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
          {cheeks}
        </>
      )
    case 'happy':
      // にっこり わらった目と、大きく あいた口
      return (
        <>
          <path d="M14.4 48.8 Q15.8 46.2 17.2 48.8 M19.8 48.8 Q21.2 46.2 22.6 48.8" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M15.6 51 Q18.4 50.6 21.2 51 Q20.8 55.4 18.4 55.4 Q16 55.4 15.6 51 Z" fill={MOUTH} />
          <ellipse cx="18.4" cy="54.3" rx="1.7" ry="0.9" fill="#ff8a8a" />
          {cheeks}
        </>
      )
    default:
      // やる気: 点の目と、にっこり した口
      return (
        <>
          <circle cx="15.8" cy="47.8" r="1.2" fill={EYE} />
          <circle cx="21" cy="47.8" r="1.2" fill={EYE} />
          <path d="M16.2 51.4 Q18.4 53.8 20.8 51.4" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
          {cheeks}
        </>
      )
  }
}

type PersonProps = {
  /** あるくときの 足の ふり(-1〜1) */
  readonly stride: number
  readonly mood: Mood
  /** 体を 前へ かたむける 角度 */
  readonly lean: number
  readonly headTilt: number
}

/** 右むきの 子ども(うで は 別の部品で かく)。足もと が y = 96 あたり。 */
function Person({ stride, mood, lean, headTilt }: PersonProps) {
  return (
    <>
      {/* むこうの足・てまえの足(あるくとき かわりばんこに ふる) */}
      <Layer rotate={stride * 20} origin={HIP}>
        <rect x="11" y="76" width="5.2" height="15.6" rx="2.6" fill={PANTS_DARK} />
        <ellipse cx="14.6" cy="93.6" rx="4.8" ry="2.8" fill={SHOE} />
      </Layer>
      <Layer rotate={-stride * 20} origin={HIP}>
        <rect x="13.4" y="76" width="5.2" height="15.6" rx="2.6" fill={PANTS} />
        <ellipse cx="17" cy="93.6" rx="4.8" ry="2.8" fill={SHOE} />
      </Layer>
      {/* うわ体: こしを じく に 前へ かたむく */}
      <Layer rotate={lean} origin={HIP}>
        {/* くび: どう と あたま の間を みじかく つなぐ */}
        <rect x="12.6" y="53" width="5" height="6" rx="2.2" fill={SKIN_SHADE} />
        <rect x="7.8" y="56.4" width="13.4" height="23" rx="6.4" fill={TUNIC} />
        <path d="M9.6 72 h9.6" stroke="#3c82c4" strokeWidth="1.5" strokeLinecap="round" />
        <Layer rotate={headTilt} origin={NECK}>
          <circle cx="15" cy="46.5" r="9.2" fill={SKIN} />
          <ellipse cx="5.9" cy="47.6" rx="1.7" ry="2.2" fill={SKIN_SHADE} />
          {/* かみ: あたまの上と うしろ。てっぺんに ぴょこんと はねた かみ */}
          <path d="M5.7 47.5 C4.2 37.5 12 34.5 18.5 35.8 C23.6 36.8 26 41 24.4 45 C21.5 41.8 16.5 41.4 12.5 43.2 C9.5 44.5 7 46 5.7 47.5 Z" fill={HAIR} />
          <path d="M14 36.2 Q12.6 32.4 16.6 32.2" fill="none" stroke={HAIR} strokeWidth="1.8" strokeLinecap="round" />
          <Face mood={mood} />
        </Layer>
      </Layer>
    </>
  )
}

/** かたを 中心に した 位置を、うわ体の かたむき と 子どもの いどう に合わせて 出す */
function shoulderAt(kid: Point, lean: number): Point {
  const r = (lean * Math.PI) / 180
  const dx = SHOULDER_LOCAL[0] - HIP[0]
  const dy = SHOULDER_LOCAL[1] - HIP[1]
  return [kid[0] + HIP[0] + dx * Math.cos(r) - dy * Math.sin(r), kid[1] + HIP[1] + dx * Math.sin(r) + dy * Math.cos(r)]
}

/**
 * かた → ひじ → 手 と つながる うで。手が とどかないときは、のびきった ところで とまる。
 * side: ひじの まがる むき(+1 = 手の 線の 下がわ・ -1 = 上がわ)
 */
function Arm({ shoulder, hand, side, color }: { readonly shoulder: Point; readonly hand: Point; readonly side: number; readonly color: string }) {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const reach = Math.min(Math.hypot(dx, dy), ARM_PART * 2 - 0.01)
  const toward = Math.atan2(dy, dx)
  const elbowAngle = toward + side * Math.acos(reach / (ARM_PART * 2))
  const elbow: Point = [shoulder[0] + Math.cos(elbowAngle) * ARM_PART, shoulder[1] + Math.sin(elbowAngle) * ARM_PART]
  const tip: Point = [shoulder[0] + Math.cos(toward) * reach, shoulder[1] + Math.sin(toward) * reach]
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${tip[0]} ${tip[1]}`} fill="none" stroke={color} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={tip[0]} cy={tip[1]} r="3.2" fill={SKIN} />
    </>
  )
}

/* ───────── にぎやかし・できごと の しるし ───────── */

/** がんばっている ときの あせ(子どもの うしろ(左)へ とぶ) */
function Sweat({ t, on }: { readonly t: number; readonly on: number }) {
  if (on <= 0) return null
  return (
    <g opacity={on}>
      {[0, 0.4].map((offset) => {
        const p = ((t + offset) % 0.8) / 0.8
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" transform={`translate(${8 - p * 7} ${39 + p * 7 - Math.sin(p * Math.PI) * 4}) rotate(-35)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** ぐったり した ときの「ふう」。口から 右上へ。 */
function Sigh({ t }: SceneProps) {
  const show = during(t, SLUMP + 0.1, RESOLVE + 0.1, 0.25)
  if (show <= 0) return null
  const p = span(t, SLUMP + 0.1, RESOLVE + 0.1, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={25 + p * 5} cy={53 - p * 4} rx={2.2 + p * 2} ry={1.5 + p * 1.3} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
      <ellipse cx={22.2 + p * 2.6} cy={53.6 - p * 1.4} rx={1.2 + p * 0.8} ry={0.9 + p * 0.4} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
    </g>
  )
}

/** のせた しゅんかんの ほこり と、きらきら */
function PlacedEffects({ t }: SceneProps) {
  const p = span(t, PLACED, PLACED + 0.7, easeOut)
  if (p <= 0 || p >= 1) return null
  const fade = 1 - p
  return (
    <>
      {[-1, 1].map((side) => (
        <circle key={side} cx={BLOCK_ON_TABLE_X + side * (25 + p * 6)} cy={TABLE.top - 1.5 - p * 3} r={1.8 + p * 2.4} fill="#f3e6d3" opacity={fade * 0.9} />
      ))}
      <g opacity={fade}>
        <Star cx={26} cy={26 - p * 4} r={3.4 * fade + 1} color={STAR_YELLOW} spin={p * 120} />
        <Star cx={82} cy={24 - p * 4} r={3 * fade + 1} color="#ffffff" spin={-p * 120} />
        <Star cx={54} cy={10 - p * 3} r={2.6 * fade + 1} color="#ff9d6a" spin={p * 90} />
      </g>
    </>
  )
}

/* ───────── 場面 ───────── */

function lerp(a: number, b: number, k: number): number {
  return a + (b - a) * k
}

function moodAt(t: number): Mood {
  if (t >= PLACED) return 'happy'
  if (t >= HEAVE) return 'strain'
  if (t >= RESOLVE) return 'eager'
  if (t >= SLUMP) return 'tired'
  if (t >= TRY1) return 'strain'
  return 'eager'
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)

  // あるく: 左から 台の そばまで。あしを ふって、体が 上下する
  const walkX = mix(t, WALK_FROM, WALK_TO, -48, 0, easeOut)
  const walking = t < WALK_FROM ? 0 : 1 - span(t, WALK_TO - 0.3, WALK_TO)
  const stride = Math.sin((t - WALK_FROM) * Math.PI * 2 * 2) * walking
  const bob = -Math.abs(stride) * 1.2
  // 1回目で ずるっと さがったとき、うしろへ よろける。2回目は 台へ 1歩 ちかづく。よろこんで 少し はねる
  const stagger = -2.5 * Math.sin(span(t, DROP, SLUMP + 0.1) * Math.PI)
  const step = 6 * span(t, HEAVE, SET_DOWN - 0.1, easeInOut) - 6 * span(t, PLACED + 0.1, PLACED + 0.7, easeInOut)
  const jumpPower = span(t, PLACED + 0.2, PLACED + 0.35) * (1 - span(t, INK, INK + 0.5))
  const jump = Math.abs(Math.sin(((t - PLACED - 0.2) * Math.PI) / 0.7)) * 3.6 * jumpPower
  const kid: Point = [walkX + step + stagger, bob - jump]

  // 体の かたむき・あたまの かたむき
  const lean = 6 * during(t, TRY1, SLUMP, 0.4) + 4 * during(t, SLUMP, RESOLVE, 0.4) + 10 * during(t, HEAVE, PLACED, 0.5)
  const headTilt = 9 * during(t, SLUMP, RESOLVE, 0.4)

  // つみきの 高さ: 1回目は すこし あがって ずるっと もどる。2回目は 台より 上まで もちあげて、おろす
  const firstTry = 9 * (span(t, TRY1, DROP - 0.1, easeOut) - span(t, DROP, SLUMP - 0.1, easeIn))
  const LIFT = 20
  const secondTry = LIFT * span(t, HEAVE, PUSH, easeInOut) - (TABLE.top - (BLOCK_CARRY_Y - LIFT)) * span(t, SET_DOWN, PLACED, easeIn)
  const blockY = BLOCK_CARRY_Y - firstTry - secondTry
  const blockX = BLOCK_CARRY_X + walkX + stagger + (BLOCK_ON_TABLE_X - BLOCK_CARRY_X) * span(t, HEAVE + 0.1, SET_DOWN - 0.1, easeInOut)
  const wobble = wave(t - TRY1, 0.36) * 5 * during(t, TRY1 + 0.2, SLUMP, 0.3)
  const thump = Math.sin(span(t, PLACED, PLACED + 0.3) * Math.PI)

  // うで: つみきの 底を 両手で ささえる → のせたら 手を はなして ばんざい
  const shoulder = shoulderAt(kid, lean)
  const release = span(t, PLACED - 0.1, PLACED + 0.2)
  const cheer = span(t, PLACED + 0.1, PLACED + 0.6, easeOut)
  const flail = wave(t, 0.35) * 2 * cheer
  const nearHold: Point = [blockX - 15 - 6 * release, blockY + 2]
  const farHold: Point = [blockX - 6 - 4 * release, blockY + 2]
  const nearHand: Point = [lerp(nearHold[0], shoulder[0] - 8 + flail, cheer), lerp(nearHold[1], shoulder[1] - 23, cheer)]
  const farHand: Point = [lerp(farHold[0], shoulder[0] + 9 - flail, cheer), lerp(farHold[1], shoulder[1] - 22, cheer)]

  const sweat = Math.max(during(t, TRY1 + 0.1, SLUMP, 0.2), during(t, HEAVE + 0.1, PLACED, 0.2))

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} />
        <Flowers t={t} />
        <Table t={t} />
        <WishGhost t={t} />
        <Layer opacity={span(t, WALK_FROM - 0.1, WALK_FROM + 0.15)}>
          {/* むこうの うで(体の うしろ) */}
          <Arm shoulder={shoulder} hand={farHand} side={1} color={TUNIC_FAR} />
          <ellipse cx={14 + kid[0]} cy="97.4" rx="9" ry="2.3" fill="#000000" opacity="0.12" />
          <Layer x={kid[0]} y={kid[1]}>
            <Person stride={stride} mood={moodAt(t)} lean={lean} headTilt={headTilt} />
            <Sweat t={t} on={sweat} />
          </Layer>
          <Sigh t={t} />
          {/* つみき と てまえの うで(つみきの 底に そえた 手) */}
          <Layer x={blockX} y={blockY} rotate={wobble} scaleX={1 + 0.05 * thump} scaleY={1 - 0.08 * thump}>
            <BlockShape />
          </Layer>
          <Arm shoulder={shoulder} hand={nearHand} side={1 - 2 * cheer} color={TUNIC_ARM} />
        </Layer>
        <PlacedEffects t={t} />
        <Butterfly t={t} />
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
    { at: 0, label: '四角い台が できる', sound: 'pop' },
    { at: WALK_FROM, label: '子どもが 三角の つみきを かかえて あるいてくる' },
    { at: WISH, label: '台の 上に のせたい' },
    { at: TRY1, label: 'うーんと もちあげるけど、おもくて ずるっと さがる' },
    { at: SLUMP, label: 'ぐったり。ふうっと いきを する' },
    { at: HEAVE, label: 'もういちど ぐっと もちあげて、台の上へ' },
    { at: PLACED, label: 'のった! ばんざい', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '台 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
