/*
 * 北(きた): ふたりが せなかを むけあう。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 左の子が まえへ のばした うで(ぷいっと そっぽを むく うで)
 *   2画目(丨)  … 左の子の あたまの てっぺん から つづく せなか(どう)
 *   3画目(ノ)  … 左の子の まえへ なげだした あし
 *   4画目(ノ)  … 右の子が ボールを もって ななめ上へ のばした うで
 *   5画目(乚)  … 右の子の あたま から せなか、まえへ なげだした あし
 *
 * ながれ
 *   丸太に ふたりが むかいあって すわり、ボールで なかよく あそぶ(おひさま が てっている)
 *   → 右の子が ボールを ひょいと とって、ほら と たかく もちあげる
 *   → 左の子は びっくり、そして ぷんぷん おこる
 *   → ふたりとも ぷいっと むきを かえて、せなかを むけあう(ずりずり と せなかあわせ)
 *   → ほね が ひかって、絵が うすくなり、字「北」が のこる
 *   (おひさまに せなかを むけたほう = 右の子が むいた ほうが「きた」)
 *
 * 人は、ほんものの つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく どう の上。
 *   丸太に こしかけて、あしを まえへ なげだす。左右の うで・あし が ある。
 *   ぷいっと むくときは、体ごと くるっと まわる。
 */
import { backOut, during, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '北'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const BARK_END = '#d9a679'
const LEAF = '#55b86e'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const BALL = '#ef5b5b'
const BALL_DARK = '#d04646'
const ANGRY = '#e8534a'

type Look = {
  readonly tunic: string
  readonly tunicDark: string
  readonly tunicFar: string
  readonly pants: string
  readonly pantsDark: string
  readonly hair: string
}
/** 左の子(主役): 青い ふく */
const LOOK_LEFT: Look = { tunic: '#4f9be0', tunicDark: '#3c82c4', tunicFar: '#33709f', pants: '#3e5c86', pantsDark: '#34507a', hair: '#5a3b2a' }
/** 右の子: だいだい色の ふく */
const LOOK_RIGHT: Look = { tunic: '#f0944f', tunicDark: '#d97a35', tunicFar: '#b8642a', pants: '#5d6a9a', pantsDark: '#4f5b88', hair: '#2f2a32' }

/** くぎり の時間(秒) */
const PLAY = 0.9
const GRAB = 2.4
const SHOCK = 2.85
const RAISED = 3.5
const TURN_LEFT = 4.1
const TURN_RIGHT = 4.3
const TURN_TIME = 0.45
const SCOOT = 4.6
const SCOOT_END = 5.6
const INK = 6.4
const DONE = 9.2
const DURATION = 10

/** 丸太の うえ(こしかける たかさ) と、人の かたち(左むき を もとに かく) */
const LOG_TOP = 84
const AXIS = 39
const HIP: readonly [number, number] = [AXIS, 81]
const SHOULDER: readonly [number, number] = [AXIS, 44]
const ARM_PART = 13
/** さいしょ むかいあう ときの ざ位置 と、せなかあわせ の ざ位置(字の どう の線) */
const LEFT_FROM = 28
const RIGHT_FROM = 81
const LEFT_TO = 39
const RIGHT_TO = 62

type Key = readonly [number, number]
/** (時間, 値) の ならびを、なめらかに つなぐ */
function track(t: number, keys: readonly Key[]): number {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 0; i < keys.length - 1; i += 1) {
    const [from, a] = keys[i]
    const [to, b] = keys[i + 1]
    if (t < to) return mix(t, from, to, a, b)
  }
  return keys[keys.length - 1][1]
}

/** うで の かっこう。swing = ま下から まえへ ふった角度 / bend = ひじ の まがり(まえへ) */
type ArmPose = { readonly swing: number; readonly bend: number }
type Mood = 'happy' | 'smug' | 'shock' | 'angry' | 'sulk'

type KidState = {
  readonly ax: number
  readonly facing: number
  readonly y: number
  readonly lean: number
  readonly near: ArmPose
  readonly far: ArmPose
  readonly mood: Mood
  readonly pop: number
}

const rad = (deg: number) => (deg * Math.PI) / 180

function armPoints(pose: ArmPose) {
  const elbow = [SHOULDER[0] - Math.sin(rad(pose.swing)) * ARM_PART, SHOULDER[1] + Math.cos(rad(pose.swing)) * ARM_PART] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] - Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART] as const
  return { elbow, hand }
}

/** 人の中の点(左むき)を、絵の ぜんたいの 場所に うつす(ボールを 手に もたせるため) */
function toWorld(local: readonly [number, number], kid: KidState): readonly [number, number] {
  const a = rad(-kid.lean)
  const dx = local[0] - HIP[0]
  const dy = local[1] - HIP[1]
  const x = HIP[0] + dx * Math.cos(a) - dy * Math.sin(a)
  const y = HIP[1] + dx * Math.sin(a) + dy * Math.cos(a)
  return [kid.ax + kid.facing * (x - AXIS), y + kid.y]
}

function leftKid(t: number): KidState {
  const hop = t > SCOOT && t < SCOOT_END ? -Math.abs(Math.sin(span(t, SCOOT, SCOOT_END) * Math.PI * 3)) * 1.8 : 0
  return {
    ax: mix(t, SCOOT, SCOOT_END, LEFT_FROM, LEFT_TO),
    facing: mix(t, TURN_LEFT, TURN_LEFT + TURN_TIME, -1, 1),
    y: hop,
    // びっくりして、ボールのほうへ のりだす
    lean: track(t, [[2.85, 0], [3.2, 8], [3.6, 0]]),
    // ボールを もつ → あっ と手を のばす → こぶしを にぎる → ぷいっと うでを のばす(1画目)
    near: {
      swing: track(t, [[0, 78], [SHOCK, 78], [3.25, 86], [3.5, 86], [4.0, 20], [4.9, 20], [5.4, 82]]),
      bend: track(t, [[0, 6], [SHOCK, 6], [3.25, 0], [3.5, 0], [4.0, 55], [4.9, 55], [5.4, 4]]),
    },
    far: { swing: 30, bend: 40 },
    mood: t < SHOCK ? 'happy' : t < 3.5 ? 'shock' : t < TURN_LEFT + 0.3 ? 'angry' : 'sulk',
    pop: span(t, 0.1, 0.6, backOut),
  }
}

function rightKid(t: number): KidState {
  const hop = t > SCOOT && t < SCOOT_END ? -Math.abs(Math.sin(span(t, SCOOT, SCOOT_END) * Math.PI * 3 + 0.8)) * 1.8 : 0
  return {
    ax: mix(t, SCOOT, SCOOT_END, RIGHT_FROM, RIGHT_TO),
    facing: mix(t, TURN_RIGHT, TURN_RIGHT + TURN_TIME, 1, -1),
    y: hop,
    // ボールに むかって のりだす → すわりなおして、ボールを ななめ上へ たかく もつ(4画目)
    lean: track(t, [[1.9, 0], [GRAB + 0.1, 13], [2.9, 13], [RAISED, 0]]),
    near: {
      swing: track(t, [[0, 28], [1.9, 28], [GRAB + 0.1, 80], [2.9, 80], [RAISED, 122]]),
      bend: track(t, [[0, 30], [1.9, 30], [GRAB + 0.1, 6], [2.9, 6], [RAISED, 4]]),
    },
    far: { swing: 30, bend: 40 },
    mood: t < 1.9 ? 'happy' : t < TURN_RIGHT + 0.3 ? 'smug' : 'sulk',
    pop: span(t, 0.2, 0.7, backOut),
  }
}

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  const logGrow = span(t, 0, 0.5, backOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={Math.max(0, 6.2 * sun)} fill={SUN} />
      <path d="M-4 99 Q18 78 44 92 Q72 72 113 95 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="62" cy="14" rx="7" ry="3.2" />
        <ellipse cx="67" cy="12" rx="5" ry="3.2" />
        <ellipse cx="96" cy="26" rx="6" ry="2.8" />
        <ellipse cx="100.5" cy="24.4" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 46, 82, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
      {/* 丸太: ふたりが こしかける */}
      <Layer scaleX={logGrow} origin={[54.5, 0]}>
        <ellipse cx="54.5" cy="95.6" rx="50" ry="2.2" fill="#000000" opacity="0.1" />
        <rect x="5" y={LOG_TOP} width="99" height="11" rx="5.5" fill={BARK} />
        <path d="M14 90.5 h16 M44 88 h22 M80 90.8 h14" stroke={BARK_DARK} strokeWidth="1.2" strokeLinecap="round" />
        <ellipse cx="6.2" cy={LOG_TOP + 5.5} rx="2.4" ry="5.2" fill={BARK_END} />
        <ellipse cx="102.8" cy={LOG_TOP + 5.5} rx="2.4" ry="5.2" fill={BARK_END} />
      </Layer>
    </>
  )
}

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。 */
function Arm({ pose, color }: { readonly pose: ArmPose; readonly color: string }) {
  const { elbow, hand } = armPoints(pose)
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.4" fill={SKIN} />
    </>
  )
}

/** かお。左むき(まえ = 左)。気持ちで 目・まゆ・口 を かえる。 */
function Face({ mood }: { readonly mood: Mood }) {
  const ink = '#2b2b2b'
  const mouth = '#b9483f'
  const eyes = [30.6, 37.2]
  return (
    <>
      <circle cx="28.8" cy="33" r="2" fill="#ff9d9d" opacity={mood === 'angry' || mood === 'sulk' ? 0.85 : 0.55} />
      <circle cx="39.6" cy="33" r="2" fill="#ff9d9d" opacity={mood === 'angry' || mood === 'sulk' ? 0.85 : 0.55} />
      {mood === 'happy' && (
        <>
          {eyes.map((x) => (
            <circle key={x} cx={x} cy="29.2" r="1.2" fill={ink} />
          ))}
          <path d="M31.8 33.2 Q34 35.6 36.2 33.2" fill="none" stroke={mouth} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'smug' && (
        <>
          {eyes.map((x) => (
            <path key={x} d={`M${x - 1.5} 29.6 Q${x} 28 ${x + 1.5} 29.6`} fill="none" stroke={ink} strokeWidth="1.2" strokeLinecap="round" />
          ))}
          <path d="M31 32.6 Q34.4 36.6 37.4 32.4 Z" fill={mouth} />
        </>
      )}
      {mood === 'shock' && (
        <>
          {eyes.map((x) => (
            <circle key={x} cx={x} cy="29.2" r="1.7" fill={ink} />
          ))}
          <path d="M29 25 Q30.6 23.6 32.2 25 M35.6 25 Q37.2 23.6 38.8 25" fill="none" stroke={ink} strokeWidth="1" strokeLinecap="round" />
          <ellipse cx="34" cy="34.4" rx="1.4" ry="1.9" fill={mouth} />
        </>
      )}
      {mood === 'angry' && (
        <>
          {eyes.map((x) => (
            <circle key={x} cx={x} cy="29.8" r="1.2" fill={ink} />
          ))}
          <path d="M28.8 25.6 L32.4 27.4 M35.4 27.4 L39 25.6" fill="none" stroke={ink} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M31.8 35 Q34 32.8 36.2 35" fill="none" stroke={mouth} strokeWidth="1.3" strokeLinecap="round" />
        </>
      )}
      {mood === 'sulk' && (
        <>
          {eyes.map((x) => (
            <path key={x} d={`M${x - 1.6} 29.6 L${x + 1.4} 29.6`} fill="none" stroke={ink} strokeWidth="1.3" strokeLinecap="round" />
          ))}
          <path d="M29.2 27 L32.4 28 M35.4 28 L38.6 27" fill="none" stroke={ink} strokeWidth="1.1" strokeLinecap="round" />
          <ellipse cx="34" cy="34.2" rx="1.5" ry="0.9" fill={mouth} />
        </>
      )}
    </>
  )
}

type KidProps = { readonly look: Look; readonly state: KidState; readonly breath: number }

/** 丸太に こしかけた 子ども(左むき)。あし は まえへ なげだし、どう は ま上へ たつ。 */
function Kid({ look, state, breath }: KidProps) {
  return (
    <>
      {/* むこうの あし(すこし 上に のぞく) と てまえの あし */}
      <path d="M43 77.8 L18 78.6" stroke={look.pantsDark} strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="14.4" cy="78.8" rx="4" ry="3" fill={SHOE} />
      <path d="M42 80.8 L17 81.6" stroke={look.pants} strokeWidth="6.4" strokeLinecap="round" />
      <ellipse cx="13.6" cy="81.8" rx="4.2" ry="3.1" fill={SHOE} />
      <Layer rotate={-state.lean} origin={HIP}>
        <Arm pose={state.far} color={look.tunicFar} />
        {/* くび: どう と あたま の間を みじかく つなぐ */}
        <rect x="35.4" y="33" width="5.4" height="8" rx="2.4" fill={SKIN_SHADE} />
        <Layer scaleX={1 + breath * 0.03} origin={[AXIS, 70]}>
          <rect x="32.5" y="37" width="13" height="48" rx="6" fill={look.tunic} />
          <path d="M34 70 h10" stroke={look.tunicDark} strokeWidth="1.5" strokeLinecap="round" />
        </Layer>
        <Arm pose={state.near} color={look.tunicDark} />
        <circle cx="37.5" cy="28.5" r="9" fill={SKIN} />
        <path d="M28.6 25.8 C28.3 17.4 37.6 14.6 44.2 19.8 C47.6 23.4 47.4 30 45.6 34.2 C45.2 28.4 41 24.6 34.4 24.4 C32 24.4 30 25 28.6 25.8 Z" fill={look.hair} />
        <path d="M36.6 20.4 Q36.2 16.8 38.4 18 Q39 15.2 40.6 17.8" fill="none" stroke={look.hair} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <Face mood={state.mood} />
      </Layer>
    </>
  )
}

function Person({ look, state, t, side }: { readonly look: Look; readonly state: KidState; readonly t: number; readonly side: number }) {
  // くるっと むきを かえる とちゅうで よこむきに ぺしゃんこに なる(0に ならないように)
  const f = Math.abs(state.facing) < 0.04 ? 0.04 : state.facing
  const breath = wave(t, 1.8, side * 0.5)
  return (
    <Layer x={state.ax - AXIS} y={state.y} scale={state.pop} origin={[AXIS, 90]}>
      <Layer scaleX={f} origin={[AXIS, 0]}>
        <Kid look={look} state={state} breath={breath} />
      </Layer>
    </Layer>
  )
}

/** ぷんぷん の まーく。左の子の あたまの上で ぴくぴく する。 */
function AngryMark({ t, x }: { readonly t: number; readonly x: number }) {
  const show = during(t, 3.5, INK - 0.2, 0.2)
  if (show <= 0) return null
  const pulse = 1 + Math.abs(wave(t, 0.5)) * 0.25
  return (
    <g opacity={show} transform={`translate(${x + 7} 15) scale(${pulse})`}>
      <path d="M-3.4 -1.2 Q-1.2 -1.2 -1.2 -3.4 M3.4 -1.2 Q1.2 -1.2 1.2 -3.4 M-3.4 1.2 Q-1.2 1.2 -1.2 3.4 M3.4 1.2 Q1.2 1.2 1.2 3.4" fill="none" stroke={ANGRY} strokeWidth="1.3" strokeLinecap="round" />
    </g>
  )
}

/** ボール。右の子が とる まで 左の子の 手の上で はずむ。 */
function Ball({ t, left, right }: { readonly t: number; readonly left: KidState; readonly right: KidState }) {
  const appear = span(t, 0.3, 0.7, backOut)
  const toss = during(t, PLAY, 2.3, 0.01) > 0 ? Math.abs(Math.sin(((t - PLAY) / 0.7) * Math.PI)) * 7 : 0
  const handLeft = toWorld(armPoints(left.near).hand, left)
  const handRight = toWorld(armPoints(right.near).hand, right)
  const grab = span(t, GRAB, GRAB + 0.4)
  const x = mix(grab, 0, 1, handLeft[0], handRight[0])
  const y = mix(grab, 0, 1, handLeft[1] - 3.8 - toss, handRight[1] - 3.8)
  const r = Math.max(0, 4.4 * appear)
  return (
    <g transform={`translate(${x} ${y}) rotate(${grab >= 1 ? 0 : toss * 3})`}>
      <circle r={r} fill={BALL} />
      <path d={`M${-r} 0 Q0 ${r * 0.5} ${r} 0`} fill="none" stroke="#ffffff" strokeWidth="1.1" />
      <path d={`M${-r * 0.7} ${-r * 0.7} Q${-r * 0.2} ${-r * 0.9} 0 ${-r * 0.4}`} fill="none" stroke={BALL_DARK} strokeWidth="0.9" strokeLinecap="round" />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)
  const left = leftKid(t)
  const right = rightKid(t)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Person look={LOOK_LEFT} state={left} t={t} side={0} />
        <Person look={LOOK_RIGHT} state={right} t={t} side={1} />
        <Ball t={t} left={left} right={right} />
        <AngryMark t={t} x={left.ax} />
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
    { at: 0, label: '丸太に ふたりが むかいあって すわる', sound: 'pop' },
    { at: PLAY, label: 'ボールで なかよく あそぶ' },
    { at: GRAB, label: '右の子が ボールを とる', sound: 'pop' },
    { at: RAISED, label: '左の子が おこる' },
    { at: TURN_LEFT, label: 'ぷいっと せなかを むける' },
    { at: SCOOT, label: 'ずりずり せなかあわせ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '北 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
