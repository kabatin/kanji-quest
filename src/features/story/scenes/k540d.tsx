/*
 * 名(な): くらい ゆうがた、遠くの ともだちの かおが 見えない。そこで 口で 名前を よぶ。
 *
 * ほね(画と絵の対応)
 *   1〜3画目(夕) … ゆうがたの 空に のぼった 三日月(夕)。1画目は 月の かさ(ほそい ひかり)、
 *                   2画目は 月の ふくらんだ ふち、3画目は 月の となりの 一番ぼし
 *   4〜6画目(口) … 口から とび出した「ことば」の ふきだし(口の 四角)
 *                   (子どもが 口を 大きく あけて ともだちの 名前を よぶ)
 *
 * ながれ
 *   日が くれて 空が くらくなり、月が のぼる → 子どもが 帰り道を あるいてくる
 *   → むこうに 人かげ。くらくて かおが 見えず、手を おでこに あてて「だれだろう?」
 *   → 大きく いきを すって、口を あけて 名前を よぶ(ふきだしに ともだちの かお)
 *   → ともだちが ふりむき、かおが 見えて にっこり 手を ふる。子どもも ぴょんと よろこぶ
 *   → ほね が ひかって、絵が うすくなり、字「名」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく、どう の まんなか の上。あし は こし から。
 *   ふきだしは、口の 近くから しっぽを のばす。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '名'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const HAIR_FRIEND = '#3a2a22'
const TUNIC = '#ee7a4c'
const TUNIC_DARK = '#d4633a'
const TUNIC_FAR = '#b5532f'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const FRIEND_TUNIC = '#3fb0a0'
const FRIEND_TUNIC_DARK = '#2f9486'
const FRIEND_PANTS = '#6a5a9a'
const SHADOW_TONE = '#2b3050'
const MOON = '#fff3b8'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const WALK_FROM = 0.5
const WALK_TO = 1.9
const FRIEND_FROM = 1.2
const FRIEND_TO = 2.4
/** 手を おでこに あてて、じっと 見る */
const SQUINT = 2.5
/** いきを すって、口を あけ、ふきだしが 出る */
const CALL = 3.8
const BUBBLE = 4.1
/** ともだちが ふりむく */
const TURN = 4.9
const JOY = 5.5
const INK = 6.4
const DONE = 9.4
const DURATION = 10

/** 子どもが たつ 場所の ずれ と、ともだちの 足もと */
const FRIEND_FEET: readonly [number, number] = [98, 96]
/** ふきだし(口 の 四角)。左がわ の まんなかへ、しっぽ を のばす */
const BUBBLE_BOX = { x: 44, y: 66, w: 40, h: 28 }
const BUBBLE_TAIL_TIP: readonly [number, number] = [30.2, 67.8]

/** 2つの いろ(#rrggbb)を k の割合で まぜる */
function tone(a: string, b: string, k: number): string {
  const amount = Math.min(Math.max(k, 0), 1)
  const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const from = parse(a)
  const to = parse(b)
  return `#${from.map((v, i) => Math.round(v + (to[i] - v) * amount).toString(16).padStart(2, '0')).join('')}`
}

/** うで の かっこう。a1 = かた から ひじ、a2 = ひじ から 手 の むき(ま下 = 0、まえ = 90、ま上 = 180 度) */
type ArmPose = { readonly a1: number; readonly a2: number }

const HANG: ArmPose = { a1: 6, a2: 20 }
/** 手を おでこの まえに かざす */
const SHADE: ArmPose = { a1: 115, a2: 178 }
/** 手を 口の そばに そえて よぶ */
const CUP: ArmPose = { a1: 95, a2: 165 }
const CHEER: ArmPose = { a1: 140, a2: 176 }

const mixPose = (a: ArmPose, b: ArmPose, k: number): ArmPose => ({ a1: a.a1 + (b.a1 - a.a1) * k, a2: a.a2 + (b.a2 - a.a2) * k })

const rad = (deg: number) => (deg * Math.PI) / 180

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。 */
function Arm({ shoulder, length, pose, color, width }: { readonly shoulder: readonly [number, number]; readonly length: number; readonly pose: ArmPose; readonly color: string; readonly width: number }) {
  const elbow = [shoulder[0] + Math.sin(rad(pose.a1)) * length, shoulder[1] + Math.cos(rad(pose.a1)) * length] as const
  const hand = [elbow[0] + Math.sin(rad(pose.a2)) * length, elbow[1] + Math.cos(rad(pose.a2)) * length] as const
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r={width * 0.6} fill={SKIN} />
    </>
  )
}

function Sky({ t }: SceneProps) {
  const dusk = span(t, 0, 2.2)
  const stars = span(t, 1.0, 2.4)
  const rise = span(t, 0, 1.1, easeOut)
  const twinkle = 0.8 + wave(t, 1.3) * 0.2
  return (
    <>
      <rect x="0" y="0" width="109" height="109" fill={tone('#f6b27a', '#46568c', dusk)} />
      {/* とおくの おか(ゆうやけの そこ だけ ほんのり あかるい) */}
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill={tone('#d99a78', '#3e5878', dusk)} />
      {/* ほし */}
      <g fill="#ffffff" opacity={stars * 0.85}>
        <circle cx="12" cy="14" r="0.9" />
        <circle cx="26" cy="7" r="0.7" />
        <circle cx="92" cy="12" r="1" />
        <circle cx="100" cy="30" r="0.7" />
        <circle cx="84" cy="40" r="0.7" />
      </g>
      {/* 月: ふくらんだ ふちが 右がわ。まわりに うすい かさ */}
      <Layer y={(1 - rise) * 14} opacity={rise}>
        <circle cx="50" cy="42" r="34" fill={MOON} opacity="0.1" />
        <Bone char={CHAR} n={1} color={MOON} width={2} opacity={0.5} />
        <path d="M54 13 C84 22 80 60 42 70 C54 58 58 40 54 13 Z" fill={MOON} />
        <path d="M60 22 C74 30 71 50 46 64" fill="none" stroke="#ffe27a" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
        {/* 3画目: 月の となりの 一番ぼし */}
        <Star cx={48.4} cy={45.6} r={4.2 * twinkle} color="#ffffff" spin={wave(t, 4) * 12} />
      </Layer>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={tone('#c5e8a9', '#5d8a63', dusk)} />
      {[8, 34, 82, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={tone('#55b86e', '#3e6e50', dusk)} />
      ))}
    </>
  )
}

/** ゆうぐれの 空を とぶ コウモリ(かげ)。右から 左へ。 */
function Bat({ t }: SceneProps) {
  const p = span(t, 1.4, 4.2)
  if (p <= 0 || p >= 1) return null
  const flap = 0.35 + Math.abs(wave(t, 0.3)) * 0.65
  return (
    <Layer x={112 - p * 70} y={26 + Math.sin(p * 9) * 3 - p * 4}>
      <ellipse cx="0" cy="0" rx="2" ry="1.4" fill="#2b3050" />
      <Layer scaleY={flap} origin={[0, 0]}>
        <path d="M-1 -0.4 Q-4 -3 -7 -1.5 Q-5 0 -4.4 1.2 Q-3 0.2 -1 0.8 Z" fill="#2b3050" />
        <path d="M1 -0.4 Q4 -3 7 -1.5 Q5 0 4.4 1.2 Q3 0.2 1 0.8 Z" fill="#2b3050" />
      </Layer>
    </Layer>
  )
}

type Mood = 'plain' | 'squint' | 'call' | 'happy'

function Face({ mood }: { readonly mood: Mood }) {
  switch (mood) {
    case 'squint':
      return (
        <>
          <path d="M32.6 59.4 l3.6 0.9" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M32.9 62.4 h3" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M34 67.4 q1.4 -1.2 2.8 0" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )
    case 'call':
      return (
        <>
          <path d="M32.6 58.6 l3.2 -0.5" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="34.5" cy="62.2" r="1.3" fill={EYE} />
          <ellipse cx="36" cy="67" rx="1.8" ry="2.5" fill={MOUTH} />
        </>
      )
    case 'happy':
      return (
        <>
          <path d="M32.8 62.8 q1.6 -2.2 3.2 0" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M33.8 66 q1.8 2.4 3.6 -0.2" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )
    default:
      return (
        <>
          <circle cx="34.4" cy="62.2" r="1.1" fill={EYE} />
          <path d="M34 66.8 h2.2" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )
  }
}

type ChildProps = {
  readonly step: number
  readonly mood: Mood
  readonly nearArm: ArmPose
  readonly farArm: ArmPose
  readonly headTilt: number
  readonly breath: number
}

/** 主役の 子ども(右むき)。足もとが y = 96。 */
function Child({ step, mood, nearArm, farArm, headTilt, breath }: ChildProps) {
  const shoulder = [29.7, 73.2] as const
  return (
    <>
      <Arm shoulder={shoulder} length={8.4} pose={farArm} color={TUNIC_FAR} width={4.2} />
      <Layer rotate={-step * 20} origin={[27.4, 84]}>
        <rect x="25.6" y="84" width="3.6" height="12" rx="1.8" fill={PANTS_DARK} />
        <ellipse cx="28.4" cy="95.6" rx="3" ry="1.6" fill={SHOE} />
      </Layer>
      <Layer rotate={step * 20} origin={[31.4, 84]}>
        <rect x="29.6" y="84" width="3.6" height="12" rx="1.8" fill={PANTS} />
        <ellipse cx="32.4" cy="95.6" rx="3" ry="1.6" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう の まんなか の上 */}
      <rect x="27.9" y="66.4" width="3.8" height="5.4" rx="1.8" fill={SKIN_SHADE} />
      <Layer scaleX={1 + breath * 0.08} scaleY={1 + breath * 0.03} origin={[29.7, 86]}>
        <rect x="24" y="69.5" width="11.4" height="17" rx="5.2" fill={TUNIC} />
        <path d="M25.6 82 h8.2" stroke={TUNIC_DARK} strokeWidth="1.2" strokeLinecap="round" />
      </Layer>
      <Arm shoulder={shoulder} length={8.4} pose={nearArm} color={TUNIC_DARK} width={4.2} />
      <Layer rotate={headTilt} origin={[29.8, 68]}>
        <circle cx="30.4" cy="62.5" r="7.6" fill={SKIN} />
        <path d="M22.8 62 C22.5 54 31 51.5 36 55 C38 56.5 38.4 59 38 60.5 C35 57.5 31 57 27 58.5 C25 59.2 23.6 60.4 22.8 62 Z" fill={HAIR} />
        <circle cx="33" cy="66" r="1.7" fill={CHEEK} opacity="0.55" />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

type FriendProps = {
  readonly step: number
  /** 0 = うしろむきで かげ / 1 = かおが 見えて いろが もどる */
  readonly reveal: number
  /** 0〜1。むきを かえる とちゅう の はば */
  readonly turn: number
  readonly arm: ArmPose
}

/** ともだち(はじめは くらくて かげ。むこうへ むいている)。足もとが (0, 0)。 */
function Friend({ step, reveal, turn, arm }: FriendProps) {
  const dim = (color: string) => tone(color, SHADOW_TONE, 0.82 * (1 - reveal))
  const face = span(turn, 0.5, 0.8)
  const shoulder = [0, -23] as const
  return (
    <Layer scaleX={Math.cos(turn * Math.PI)}>
      <Layer rotate={-step * 20} origin={[-2.8, -12]}>
        <rect x="-4.6" y="-12" width="3.6" height="12" rx="1.8" fill={dim(FRIEND_PANTS)} />
      </Layer>
      <Layer rotate={step * 20} origin={[2.8, -12]}>
        <rect x="1" y="-12" width="3.6" height="12" rx="1.8" fill={dim(FRIEND_PANTS)} />
      </Layer>
      <rect x="-1.8" y="-27.6" width="3.6" height="5" rx="1.8" fill={dim(SKIN_SHADE)} />
      <rect x="-5.6" y="-26" width="11.2" height="16" rx="5" fill={dim(FRIEND_TUNIC)} />
      <Arm shoulder={shoulder} length={7.6} pose={arm} color={dim(FRIEND_TUNIC_DARK)} width={3.8} />
      <circle cx="0" cy="-32.4" r="7" fill={dim(SKIN)} />
      {/* うしろ向きの あいだは、あたまの うしろ(かみ)が 見える */}
      <circle cx="0" cy="-32.4" r="7" fill={dim(HAIR_FRIEND)} opacity={1 - face} />
      <path d="M-6.8 -33 C-7 -40 0 -41.4 4.6 -38.6 C6.4 -37.4 6.8 -35.2 6.4 -34 C3.6 -36.2 0 -36.4 -3.4 -35.4 C-5 -35 -6.2 -34 -6.8 -33 Z" fill={dim(HAIR_FRIEND)} opacity={face} />
      <g opacity={face}>
        <circle cx="3" cy="-32.6" r="1" fill={EYE} />
        <circle cx="2.4" cy="-29.4" r="1.5" fill={CHEEK} opacity="0.55" />
        <path d="M2 -28.2 q1.8 2 3.4 -0.2" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
      </g>
    </Layer>
  )
}

/** ふきだし の なかの ともだちの かお(「名前」の しるし) */
function NameFace() {
  return (
    <>
      <circle cx="64" cy="80" r="8" fill={SKIN} />
      <path d="M56 78.6 C55.8 71.6 63 70 68 72 C70.6 73.2 71.8 76 71.8 78 C68.6 75.4 64 75 60.4 75.8 C58.4 76.2 56.8 77.2 56 78.6 Z" fill={HAIR_FRIEND} />
      <circle cx="61" cy="80.6" r="1.1" fill={EYE} />
      <circle cx="67" cy="80.6" r="1.1" fill={EYE} />
      <path d="M61.2 84 q2.8 2.6 5.6 0" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
    </>
  )
}

/** 口から とび出した ふきだし。口の 四角に なる。 */
function SpeechBubble({ t }: SceneProps) {
  const grow = span(t, BUBBLE, BUBBLE + 0.6, backOut)
  if (grow <= 0) return null
  const { x, y, w, h } = BUBBLE_BOX
  const [tipX, tipY] = BUBBLE_TAIL_TIP
  const sound = during(t, CALL, BUBBLE + 0.8, 0.15)
  return (
    <>
      <g opacity={sound} fill="none" stroke="#fff3b8" strokeWidth="1" strokeLinecap="round">
        <path d="M33.2 63.8 q1.6 2.4 0 4.8" />
        <path d="M35.6 62.4 q2.4 3.8 0 7.6" />
      </g>
      <Layer scale={Math.max(0, grow)} origin={[x, y + h / 2]}>
        <path d={`M${x} ${y + 5} L${tipX} ${tipY} L${x} ${y + 11} Z`} fill="#ffffff" />
        <rect x={x} y={y} width={w} height={h} rx="5" fill="#ffffff" />
        <NameFace />
      </Layer>
    </>
  )
}

/** 「だれだろう?」 */
function Question({ t }: SceneProps) {
  const show = during(t, SQUINT + 0.15, CALL, 0.2)
  if (show <= 0) return null
  const pop = Math.max(0, span(t, SQUINT + 0.15, SQUINT + 0.6, backOut))
  return (
    <g opacity={show} transform={`translate(36 ${44 - wave(t, 0.9) * 0.8}) scale(${pop})`}>
      <path d="M-3 -2 Q-3 -6.4 1 -6.4 Q5 -6.4 5 -3 Q5 -0.8 1.8 0.6 Q1 1.4 1 3" fill="none" stroke="#fff3b8" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="1" cy="6.2" r="1.1" fill="#fff3b8" />
    </g>
  )
}

function Heart({ x, y, size, color }: { readonly x: number; readonly y: number; readonly size: number; readonly color: string }) {
  return <path d="M0 2 C-4 -1 -3 -4.4 0 -2.6 C3 -4.4 4 -1 0 2 Z" fill={color} transform={`translate(${x} ${y}) scale(${size})`} />
}

/** なまえを よんだ あとの うれしい ハート。 */
function Hearts({ t }: SceneProps) {
  const p = span(t, JOY, INK - 0.1)
  if (p <= 0) return null
  const fade = Math.sin(p * Math.PI)
  return (
    <g opacity={fade}>
      <Heart x={78 - Math.sin(p * 6) * 1.5} y={74 - p * 18} size={Math.max(0, 1.5 * span(t, JOY, JOY + 0.4, backOut))} color="#f07f9e" />
      <Heart x={22 + Math.sin(p * 6) * 1.5} y={50 - p * 12} size={Math.max(0, 1.2 * span(t, JOY + 0.2, JOY + 0.6, backOut))} color="#f6a0b6" />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  // 子ども: ひだりから あるいてきて 立ちどまる
  const walking = 1 - span(t, WALK_TO - 0.25, WALK_TO)
  const stride = t < WALK_FROM ? 0 : Math.sin((t - WALK_FROM) * Math.PI * 2 * 1.8) * walking
  const childX = mix(t, WALK_FROM, WALK_TO, -42, -8, easeOut)
  const joy = span(t, JOY, JOY + 0.3)
  const hop = t >= JOY && t < JOY + 0.9 ? -Math.abs(Math.sin((t - JOY) * Math.PI * 2.2)) * 2.4 : 0
  const bob = -Math.abs(stride) * 1.2 + hop

  const squint = span(t, SQUINT, SQUINT + 0.4) * (1 - span(t, CALL - 0.2, CALL))
  const cup = span(t, CALL - 0.2, CALL + 0.1) * (1 - span(t, JOY - 0.2, JOY + 0.1))
  const cheer = span(t, JOY, JOY + 0.35)
  const walkArm: ArmPose = { a1: HANG.a1 + stride * 26, a2: HANG.a2 + stride * 26 }
  const swayArm: ArmPose = t < WALK_TO ? walkArm : HANG
  const cheerPose: ArmPose = { a1: CHEER.a1, a2: CHEER.a2 + wave(t, 0.5) * 9 * cheer }
  const nearArm = mixPose(mixPose(mixPose(swayArm, SHADE, squint), CUP, cup), cheerPose, cheer)
  const farArm = mixPose(t < WALK_TO ? { a1: HANG.a1 - stride * 26, a2: HANG.a2 - stride * 26 } : HANG, { a1: CHEER.a1, a2: CHEER.a2 - wave(t, 0.5) * 9 }, cheer)
  const mood: Mood = t < SQUINT ? 'plain' : t < CALL ? 'squint' : t < JOY ? 'call' : 'happy'
  const breath = t >= CALL - 0.4 && t < CALL ? span(t, CALL - 0.4, CALL) : 0
  const headTilt = t < SQUINT ? 0 : t < CALL ? 4 : joy * -4

  // ともだち: みぎから あるいてきて 立ちどまる。名前を よばれて ふりむく
  const friendWalking = 1 - span(t, FRIEND_TO - 0.25, FRIEND_TO)
  const friendStride = t < FRIEND_FROM ? 0 : Math.sin((t - FRIEND_FROM) * Math.PI * 2 * 1.8) * friendWalking
  const friendX = mix(t, FRIEND_FROM, FRIEND_TO, 26, 0, easeOut)
  const turn = span(t, TURN, TURN + 0.6, easeInOut)
  const reveal = span(t, TURN + 0.2, TURN + 0.9)
  const wavePose: ArmPose = { a1: 120, a2: 172 + wave(t, 0.5) * 18 }
  const friendArm = mixPose({ a1: HANG.a1 + friendStride * 26, a2: HANG.a2 + friendStride * 26 }, wavePose, span(t, TURN + 0.7, TURN + 1.1))
  const friendHop = t >= TURN + 0.8 && t < TURN + 1.5 ? -Math.abs(Math.sin((t - TURN - 0.8) * Math.PI * 2)) * 1.6 : 0

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Bat t={t} />
        {/* ともだち */}
        <Layer opacity={span(t, FRIEND_FROM, FRIEND_FROM + 0.2)}>
          <ellipse cx={FRIEND_FEET[0] + friendX} cy="97.4" rx="7.5" ry="2" fill="#000000" opacity="0.15" />
          <Layer x={FRIEND_FEET[0] + friendX} y={FRIEND_FEET[1] + friendHop}>
            <Layer scale={0.92} origin={[0, 0]}>
              <Friend step={friendStride} reveal={reveal} turn={turn} arm={friendArm} />
            </Layer>
          </Layer>
        </Layer>
        {/* 主役の 子ども */}
        <Layer opacity={span(t, WALK_FROM - 0.1, WALK_FROM + 0.1)}>
          <ellipse cx={29.7 + childX} cy="97.4" rx="8" ry="2.2" fill="#000000" opacity="0.15" />
          <Layer x={childX} y={bob}>
            <Child step={stride} mood={mood} nearArm={nearArm} farArm={farArm} headTilt={headTilt} breath={breath} />
          </Layer>
        </Layer>
        <Question t={t} />
        <SpeechBubble t={t} />
        <Hearts t={t} />
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
    { at: 0, label: '日が くれて、月が のぼる', sound: 'pop' },
    { at: WALK_FROM, label: '子どもが あるいてくる' },
    { at: SQUINT, label: 'むこうに 人かげ。くらくて かおが 見えない' },
    { at: CALL, label: '大きく いきを すって、口で 名前を よぶ', sound: 'pop' },
    { at: TURN, label: 'ともだちが ふりむいて にっこり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '名 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
