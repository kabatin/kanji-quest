/*
 * 正(ただしい): あしが 線に むかって まっすぐ すすむ。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … スタートの ポール と ゴールの ポール の間に はった、かざりの はた(上の 線)
 *   2画目(丨)  … 立ちどまった子の あたま・どう・あし(まっすぐ立つ 体)
 *   3画目(一)  … その子が ゴールに むかって まっすぐ のばした うで(ゆびさす)
 *   4画目(丨)  … 子が はじめに いた「スタートの くい」(うしろに のこる)
 *   5画目(一)  … 地面に ひいた チョークの 線(子の あし は この 線の上を すすむ)
 *   2〜5画目   … 止(とまる)= あし。あしが 線に むかって すすんで、ぴたっと とまる
 *
 * ながれ
 *   スタートの くいと、地面の チョークの線 → 子が どっちへ いけば いいか わからず きょろきょろ(「?」)
 *   → 線の さきに ゴールの はたが ぽんと たつ。子は「あっ!」と おどろき、かざりの はたが ひろがる
 *   → うれしくなって、線の上を まっすぐ あるいていく(ほこりが ふわっ)
 *   → ゴールの まえで ぴたっと とまって、うでを まっすぐ のばして ゆびさす
 *   → ほね が ひかって、絵が うすくなり、字「正」が のこる
 *
 * 子は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。あるくときは ふり、ゆびさすときは まっすぐ のばす。
 *   字の形になるのは、とまって ゆびさした さいごの しゅんかん だけ。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '正'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#ee7a4d'
const SHIRT_DARK = '#d4603a'
const SHIRT_FAR = '#b9532f'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const WOOD = '#a8743f'
const WOOD_DARK = '#8c5b3c'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const HILL = '#e2f2d2'
const PATH = '#f0e1bb'
const CHALK = '#ffffff'
const SUN = '#ffd24a'
const RED = '#e8534a'
const BLUE = '#5f7fd6'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const SHOW = 0.3
const WORRY = 1.0
/** ゴールの はたが ぽんと たつ(子が「あっ!」) */
const FLAG = 2.4
const BUNTING = 2.8
const MARCH = 3.4
const STOP = 5.4
const INK = 6.2
const DONE = 8.8
const DURATION = 9.6

/** 子の まんなか(2画目の 線の x)と、足もと・かた */
const CX = 55
const FEET_Y = 92
const SHOULDER: readonly [number, number] = [CX, 47]
/** 子が さいしょに いる ばしょ(まんなか から 左へ ずれた分) */
const START_OFFSET = -35
/** 3画目の 書きおわり(ゆびさした 手先) */
const HAND_GOAL: readonly [number, number] = [81.9, 51.8]
/** にのうで・うでさき の長さ(のばすと、かた から 3画目の書きおわりに ちょうど とどく) */
const ARM_PART = Math.hypot(HAND_GOAL[0] - SHOULDER[0], HAND_GOAL[1] - SHOULDER[1]) / 2
/** ゆびさす うで の角度(ま下から、まえへ 何度か) */
const POINT = (Math.atan2(HAND_GOAL[0] - SHOULDER[0], HAND_GOAL[1] - SHOULDER[1]) * 180) / Math.PI

/** ゴールの ポール(右)と スタートの ポール(左) */
const GOAL_X = 94
const START_X = 8
/** かざりの はた の ひも の 高さ(1画目の 線に そろえる) */
const stringY = (x: number) => 20.5 + (GOAL_X - x) * 0.058

/** 子が いま どこに いるか(さいしょは 左、まっすぐ すすんで 線の まんなか へ) */
const walkAt = (t: number) => mix(t, MARCH, STOP, START_OFFSET, 0, easeInOut)

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.5, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[74, 11]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="73.2" y="1.2" width="1.6" height="3.6" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 74 11)`} />
        ))}
      </Layer>
      <circle cx="74" cy="11" r={5.2 * sun} fill={SUN} />
      <path d="M-4 90 Q14 70 40 82 Q70 62 113 84 V100 H-4 Z" fill={HILL} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="42" cy="8" rx="7" ry="3" />
        <ellipse cx="47" cy="6.6" rx="5" ry="3" />
      </g>
      <rect x="-2" y="82" width="113" height="30" fill={GRASS} />
      {/* 地面の みち: ここを あるく */}
      <rect x="-2" y="85.5" width="113" height="9.5" rx="4.7" fill={PATH} />
      {[44, 76, 102].map((x) => (
        <path key={x} d={`M${x} 101 l1.4 -3.8 l1 3.4 l1.6 -4.4 l0.8 4.8 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** スタートの くい(4画目)と チョークの 線(5画目)。じめんの 絵は さいしょから ある。 */
function Marks({ t }: SceneProps) {
  const chalk = span(t, 0.2, 1.1, easeOut)
  const stake = span(t, 0.1, 0.5, backOut)
  return (
    <>
      <Bone char={CHAR} n={5} color={CHALK} width={2.4} to={chalk} />
      <Layer scaleY={stake} origin={[28.5, 92]}>
        <Bone char={CHAR} n={4} color={WOOD} width={3.8} />
        <circle cx="29.7" cy="57" r="1.9" fill={WOOD_DARK} />
        {/* くいの 先の 小さな はた */}
        <path d="M30.6 58.4 L37.4 61 L30.6 63.8 Z" fill={BLUE} />
      </Layer>
    </>
  )
}

function Pole({ x, top, grow }: { readonly x: number; readonly top: number; readonly grow: number }) {
  return (
    <Layer scaleY={grow} origin={[x, FEET_Y]}>
      <rect x={x - 0.9} y={top} width="1.8" height={FEET_Y - top} rx="0.9" fill={WOOD} />
      <circle cx={x} cy={top - 0.4} r="2" fill={SUN} />
    </Layer>
  )
}

const FLAG_COLORS = [RED, SUN, '#4f9be0', LEAF] as const
const FLAG_XS = [88, 79, 70, 61, 52, 43, 34, 25, 16] as const

/** ゴールの ポールの はた と、かざりの はた の ひも(1画目の 線)。 */
function Goal({ t }: SceneProps) {
  const pole = span(t, FLAG - 0.2, FLAG + 0.45, backOut)
  const flagWave = wave(t, 0.9) * 1.3
  const unfurl = span(t, BUNTING, BUNTING + 0.9, easeOut)
  return (
    <>
      <Pole x={START_X} top={17} grow={span(t, 0.1, 0.5, backOut)} />
      <Pole x={GOAL_X} top={11} grow={pole} />
      <Layer scale={pole} origin={[GOAL_X, 12]}>
        <path d={`M${GOAL_X + 0.8} 12.4 Q${GOAL_X + 5.4} ${12.8 + flagWave} ${GOAL_X + 11} ${15 + flagWave * 0.6} Q${GOAL_X + 5.4} ${18.6 + flagWave} ${GOAL_X + 0.8} 20 Z`} fill={RED} />
        <circle cx={GOAL_X + 4.2} cy={16.2 + flagWave * 0.3} r="1.5" fill="#ffffff" />
      </Layer>
      {unfurl > 0 && (
        <>
          <line x1={GOAL_X} y1={stringY(GOAL_X)} x2={START_X} y2={stringY(START_X)} stroke={WOOD_DARK} strokeWidth="0.9" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - unfurl} />
          {FLAG_XS.map((x, i) => {
            const pop = span(unfurl, (GOAL_X - x) / (GOAL_X - START_X), (GOAL_X - x) / (GOAL_X - START_X) + 0.12, backOut)
            const y = stringY(x)
            return (
              <Layer key={x} scale={pop} origin={[x, y]}>
                <path d={`M${x - 3} ${y} L${x + 3} ${y} L${x} ${y + 6} Z`} fill={FLAG_COLORS[i % FLAG_COLORS.length]} />
              </Layer>
            )
          })}
        </>
      )}
    </>
  )
}

type Mood = 'lost' | 'surprised' | 'happy'

/** うで の かっこう。swing = ま下から まえへ ふった角度 / bend = ひじ の まがり(まえへ) */
type ArmPose = { readonly swing: number; readonly bend: number }

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。 */
function Arm({ pose, color }: { readonly pose: ArmPose; readonly color: string }) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  // 子は 右むき。まえ = 右(x が ふえる ほう)
  const elbow = [SHOULDER[0] + Math.sin(rad(pose.swing)) * ARM_PART, SHOULDER[1] + Math.cos(rad(pose.swing)) * ARM_PART] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] + Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART] as const
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.1" fill={SKIN} />
    </>
  )
}

function Leg({ angle, dx, color, shoe }: { readonly angle: number; readonly dx: number; readonly color: string; readonly shoe: string }) {
  return (
    <Layer rotate={angle} origin={[CX, 66.5]}>
      <rect x={CX + dx - 2.8} y="64" width="5.6" height="25" rx="2.8" fill={color} />
      {/* くつ は まえ(右)へ つきでる */}
      <ellipse cx={CX + dx + 1.6} cy="88.6" rx="4.6" ry="2.5" fill={shoe} />
    </Layer>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  if (mood === 'lost') {
    return (
      <>
        <path d="M57.4 29.6 l3.8 1.4" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
        <circle cx="59.6" cy="33.8" r="1.2" fill={EYE} />
        <path d="M56.8 39.2 q1.1 -1 2.2 0 q1.1 1 2.2 0" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
      </>
    )
  }
  if (mood === 'surprised') {
    return (
      <>
        <path d="M57.6 29.4 q1.9 -1.5 3.9 -0.2" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
        <circle cx="59.6" cy="33.6" r="1.6" fill={EYE} />
        <ellipse cx="59.2" cy="39" rx="1.3" ry="1.8" fill={MOUTH} />
      </>
    )
  }
  return (
    <>
      <path d="M57.6 34.6 Q59.5 32.2 61.4 34.6" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M56.4 38 Q58.6 41 60.8 38" fill="none" stroke={MOUTH} strokeWidth="1.3" strokeLinecap="round" />
    </>
  )
}

type KidProps = {
  readonly stride: number
  readonly mood: Mood
  readonly nearArm: ArmPose
  readonly farArm: ArmPose
  readonly headTilt: number
  readonly shrug: number
}

/** 右むきの 子。あたま・どう・あし が まっすぐ たて に ならぶ(2画目)。 */
function Kid({ stride, mood, nearArm, farArm, headTilt, shrug }: KidProps) {
  return (
    <>
      <Arm pose={farArm} color={SHIRT_FAR} />
      <Leg angle={stride * 22} dx={1.2} color={PANTS_DARK} shoe={SHOE} />
      <Leg angle={-stride * 22} dx={-1.2} color={PANTS} shoe={SHOE} />
      {/* くび: みじかく、どう の まんなか の上 */}
      <rect x="52.6" y="39.5" width="4.8" height="6" rx="2.2" fill={SKIN_SHADE} />
      <Layer y={shrug} origin={[CX, 60]}>
        <rect x="48.4" y="43.4" width="13.2" height="24" rx="6.4" fill={SHIRT} />
        <path d="M49.8 62.6 h10.4" stroke={SHIRT_DARK} strokeWidth="1.5" strokeLinecap="round" />
      </Layer>
      <Arm pose={nearArm} color={SHIRT_DARK} />
      <Layer rotate={headTilt} origin={[CX, 42]}>
        <circle cx={CX} cy="34" r="8.5" fill={SKIN} />
        <path d="M46.6 35 C45.4 25.4 53 23.4 59 25.6 C62.6 27 63.6 30.4 63.2 32 C60.4 28.8 55.4 28.4 51.5 30.2 C49.4 31.2 48.4 33 48.2 35.8 Z" fill={HAIR} />
        <path d="M52 25.6 Q52.6 22.6 54.4 24.4 Q55.4 22 56.6 25" fill="none" stroke={HAIR} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="52.6" cy="35.4" r="1.7" fill={SKIN_SHADE} />
        <circle cx="58.6" cy="37.4" r="1.9" fill={CHEEK} opacity="0.55" />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

/** まよい中の「?」。あたまの上で ぴょこぴょこ はねる。 */
function Question({ x, y, scale, t }: { readonly x: number; readonly y: number; readonly scale: number; readonly t: number }) {
  return (
    <Layer x={x} y={y + wave(t, 0.8) * 0.8} scale={scale} origin={[0, 0]}>
      <path d="M-3.2 -2.4 Q-3 -6.4 0 -6.4 Q3.4 -6.4 3.4 -3.2 Q3.4 -1.2 0.8 0.2 Q0 0.8 0 2.6" fill="none" stroke={BLUE} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="0" cy="5.4" r="1.05" fill={BLUE} />
    </Layer>
  )
}

/** 「あっ!」の しるし。 */
function Bang({ x, y, scale }: { readonly x: number; readonly y: number; readonly scale: number }) {
  return (
    <Layer x={x} y={y} scale={scale} origin={[0, 0]}>
      <path d="M0 -5.6 L0 1.2" stroke={RED} strokeWidth="2.3" strokeLinecap="round" />
      <circle cx="0" cy="4.8" r="1.25" fill={RED} />
    </Layer>
  )
}

/** まよっている間の あせ。あたまの うしろ(左)へ とぶ。 */
function Sweat({ t }: SceneProps) {
  const show = during(t, WORRY - 0.1, FLAG, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.5].map((offset) => {
        const p = ((t + offset) % 1) / 1
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" transform={`translate(${46 - p * 4} ${27 + p * 8}) rotate(20)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** あるく ときの ほこり。あしもとから ふわっと 出る。 */
function Dust({ t }: SceneProps) {
  return (
    <>
      {[0, 1, 2, 3, 4].map((k) => {
        const start = MARCH + 0.1 + k * 0.4
        const p = (t - start) / 0.55
        if (p <= 0 || p >= 1) return null
        return <circle key={k} cx={CX + walkAt(start) - 7} cy={88.6 - p * 3} r={1.4 + p * 2.2} fill="#ffffff" opacity={0.75 * (1 - p)} />
      })}
    </>
  )
}

/** そらを とぶ 小鳥。ゴールの ほうへ むかう。 */
function Bird({ t }: SceneProps) {
  const p = span(t, MARCH, STOP + 0.8)
  if (p <= 0 || p >= 1) return null
  const x = -6 + p * 120
  const y = 11 + Math.sin(p * 8) * 2.2
  const flap = wave(t, 0.18) * 30
  return (
    <Layer x={x} y={y}>
      <ellipse cx="0" cy="0" rx="3.6" ry="2.6" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
      <circle cx="2.8" cy="-1.6" r="1.9" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
      <path d="M4.4 -1.8 l2.6 0.6 l-2.5 1 Z" fill="#f2b632" />
      <circle cx="3.2" cy="-2" r="0.45" fill={EYE} />
      <path d="M-3.4 0.4 l-3.4 -0.8 l2.4 1.8 Z" fill="#9fb4cf" />
      <Layer rotate={flap} origin={[-0.6, -1]}>
        <path d="M-2.4 -1 Q-0.4 -6.4 2.4 -1 Q0 0.2 -2.4 -1 Z" fill="#7cc4f2" />
      </Layer>
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)

  // あるく: 線の上を まっすぐ。あしを ふって、体が 上下する
  const walking = span(t, MARCH - 0.05, MARCH + 0.2) * (1 - span(t, STOP - 0.35, STOP))
  const stride = Math.sin((t - MARCH) * Math.PI * 2 * 1.5) * walking
  const walkX = walkAt(t)
  const hop = Math.sin(span(t, FLAG, FLAG + 0.4) * Math.PI) * 3.2
  const bob = -Math.abs(stride) * 1.4 - hop
  const appear = span(t, SHOW, SHOW + 0.5, backOut)

  const mood: Mood = t < FLAG ? 'lost' : t < MARCH ? 'surprised' : 'happy'
  // まよっている間は あたまを きょろきょろ。「あっ」で ぐっと 上を むき、ゴールを みつめる
  const look = t < FLAG ? 5 + wave(t, 2.0) * 7 : mix(t, FLAG, FLAG + 0.3, 5, -9, easeOut)
  const headTilt = t < FLAG ? look : look + (t > STOP ? -2 : 0)
  const shrug = t < FLAG ? Math.abs(wave(t, 2.0)) * 0.7 : 0

  // うで: まよう間は だらんと。あるくときは 足と ぎゃくに ふる。とまったら、ゴールへ まっすぐ ゆびさす
  const hanging = 4
  const point = span(t, STOP - 0.2, STOP + 0.6, easeInOut)
  const swingNear = t < MARCH ? hanging : -stride * 26 + hanging
  const nearArm: ArmPose = { swing: swingNear + (POINT - swingNear) * point, bend: 14 * (1 - point) }
  const farArm: ArmPose = { swing: t < MARCH ? hanging : stride * 26 + hanging, bend: 12 }

  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const sparkle = span(t, FLAG, FLAG + 0.7)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Marks t={t} />
        <Goal t={t} />
        <Sparkles cx={GOAL_X + 4} cy={16} progress={sparkle} reach={13} count={6} />
        <Layer opacity={appear}>
          <ellipse cx={CX + walkX} cy="91.4" rx="9" ry="2.2" fill="#000000" opacity="0.12" />
        </Layer>
        <Dust t={t} />
        <Layer scale={appear} origin={[CX + walkX, FEET_Y]}>
          <Layer x={walkX} y={bob}>
            <Kid stride={stride} mood={mood} nearArm={nearArm} farArm={farArm} headTilt={headTilt} shrug={shrug} />
            <Sweat t={t} />
          </Layer>
          {t >= WORRY && t < FLAG + 0.1 && (
            <Layer opacity={during(t, WORRY, FLAG + 0.1, 0.2)}>
              <Question x={CX + walkX + 10} y={20} scale={span(t, WORRY, WORRY + 0.3, backOut)} t={t} />
              <Question x={CX + walkX - 7} y={16} scale={span(t, WORRY + 0.4, WORRY + 0.7, backOut) * 0.75} t={t + 0.4} />
            </Layer>
          )}
          {t >= FLAG + 0.1 && t < MARCH + 0.3 && (
            <Layer opacity={during(t, FLAG + 0.1, MARCH + 0.3, 0.15)}>
              <Bang x={CX + walkX + 10} y={21} scale={span(t, FLAG + 0.1, FLAG + 0.4, backOut)} />
            </Layer>
          )}
        </Layer>
        <Bird t={t} />
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
    { at: 0, label: 'スタートの くいと、地面の 線', sound: 'pop' },
    { at: WORRY, label: 'どっちへ いけば いいのかな?' },
    { at: FLAG, label: 'あっ、線の さきに ゴールの はた!', sound: 'pop' },
    { at: MARCH, label: '線の上を まっすぐ すすむ' },
    { at: STOP, label: 'ゴールの まえで とまって ゆびさす' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '正 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
