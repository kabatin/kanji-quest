/*
 * 友(とも): てと てを つないで、なかよし。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … ふたりが まえに のばして つないだ うで(かた の たかさで 左右に ひとすじ)
 *   2〜4画目   … ふたりの 体と あし(からだ を よせあって たつ すがた。ぴったりは 重ならない)
 *
 * ながれ
 *   ひとりぼっちの 子が、ボールの よこで しょんぼり(ためいき)
 *   → ともだちが あるいてきて、手を さしだす
 *   → 子が 気づいて びっくり、うれしくなって 手を のばす
 *   → てと てを つないで、ふたりで にこにこ ぴょんぴょん(ハートが のぼる)
 *   → ほね が ひかって、絵が うすくなり、字「友」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。あるくときは ふり、手を のばすときは まえへ。
 *   つないだ 手は、まっすぐ のばした 2本の うで が 中ほどで あう ところ。
 */
import { during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '友'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const HAIR_B = '#8a5a34'
const TUNIC_A = '#4f9be0'
const TUNIC_A_DARK = '#3c82c4'
const TUNIC_A_FAR = '#33709f'
const PANTS_A = '#3e5c86'
const PANTS_A_DARK = '#34507a'
const TUNIC_B = '#f0a14a'
const TUNIC_B_DARK = '#d98a34'
const TUNIC_B_FAR = '#bd7628'
const PANTS_B = '#5b7a58'
const PANTS_B_DARK = '#4a6648'
const SHOE = '#6b4a36'
const LEAF = '#55b86e'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const BALL = '#ee6a5a'
const BALL_LIGHT = '#f59a8e'

/** くぎり の時間(秒) */
const COME = 1.3
const STOP = 2.7
const NOTICE = 2.0
const OFFER = 2.9
const REACH = 3.6
const CLASP = 4.3
const INK = 6.7
const DONE = 9.7
const DURATION = 10.3

/** ふたりの 立つ場所(x)。かた から のばした うで が、まんなか(x=54)で あう */
const A_X = 27
const B_X = 81
/** うで の ながさ(かた→ひじ、ひじ→手)。2本のばすと 26.8 で、まんなかに とどく */
const ARM_PART = 13.4
/** かた の たかさ と、つないだ 手の たかさ(1画目の 線の すぐ下) */
const SHOULDER_Y = 38
const FEET_Y = 93

type Mood = 'sad' | 'surprised' | 'happy'

type Palette = {
  readonly hair: string
  readonly tunic: string
  readonly tunicDark: string
  readonly tunicFar: string
  readonly pants: string
  readonly pantsDark: string
}

const PALETTE_A: Palette = { hair: HAIR, tunic: TUNIC_A, tunicDark: TUNIC_A_DARK, tunicFar: TUNIC_A_FAR, pants: PANTS_A, pantsDark: PANTS_A_DARK }
const PALETTE_B: Palette = { hair: HAIR_B, tunic: TUNIC_B, tunicDark: TUNIC_B_DARK, tunicFar: TUNIC_B_FAR, pants: PANTS_B, pantsDark: PANTS_B_DARK }

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun} fill={SUN} />
      {/* とおくの おか と、ゆっくり ながれる 雲(おくゆき を出す) */}
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="60" cy="14" rx="7" ry="3.2" />
        <ellipse cx="65" cy="12.4" rx="5" ry="3.2" />
        <ellipse cx="92" cy="8" rx="6" ry="2.8" />
        <ellipse cx="96.5" cy="6.6" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 50, 66, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** うで の かっこう。swing = ま下から まえへ ふった角度 / bend = ひじ の まがり(まえへ) */
type ArmPose = { readonly swing: number; readonly bend: number }

const rad = (deg: number) => (deg * Math.PI) / 180

/** うで の 手の位置(体の 中心が x=0、まえ が +x) */
function handOf(pose: ArmPose): readonly [number, number] {
  const elbowX = Math.sin(rad(pose.swing)) * ARM_PART
  const elbowY = SHOULDER_Y + Math.cos(rad(pose.swing)) * ARM_PART
  const fore = pose.swing + pose.bend
  return [elbowX + Math.sin(rad(fore)) * ARM_PART, elbowY + Math.cos(rad(fore)) * ARM_PART]
}

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。 */
function Arm({ pose, color }: { readonly pose: ArmPose; readonly color: string }) {
  const elbowX = Math.sin(rad(pose.swing)) * ARM_PART
  const elbowY = SHOULDER_Y + Math.cos(rad(pose.swing)) * ARM_PART
  const [handX, handY] = handOf(pose)
  return (
    <>
      <path d={`M0 ${SHOULDER_Y} L${elbowX} ${elbowY} L${handX} ${handY}`} fill="none" stroke={color} strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={handX} cy={handY} r="3.4" fill={SKIN} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  if (mood === 'sad') {
    return (
      <>
        <path d="M2.8 20.6 L6.6 19" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
        <circle cx="5.2" cy="23.4" r="1.15" fill={EYE} />
        <ellipse cx="6.1" cy="26.2" rx="0.8" ry="1.2" fill="#7cc4f2" />
        <path d="M5.4 30 Q7 28.4 8.6 30" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
      </>
    )
  }
  if (mood === 'surprised') {
    return (
      <>
        <path d="M3 19.4 L6.6 18.4" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
        <circle cx="5.2" cy="22.4" r="1.6" fill={EYE} />
        <circle cx="5.7" cy="21.8" r="0.5" fill="#ffffff" />
        <ellipse cx="7.2" cy="28.8" rx="1.3" ry="1.7" fill={MOUTH} />
      </>
    )
  }
  return (
    <>
      <circle cx="4.8" cy="27" r="2.1" fill={CHEEK} opacity="0.55" />
      <path d="M3.4 23.2 Q5.2 21 7 23.2" fill="none" stroke={EYE} strokeWidth="1.25" strokeLinecap="round" />
      <path d="M5.2 27.2 Q7.4 31.8 9.4 27.2 Z" fill={MOUTH} strokeLinejoin="round" stroke={MOUTH} strokeWidth="0.6" />
    </>
  )
}

type KidProps = {
  readonly palette: Palette
  readonly mood: Mood
  readonly step: number
  readonly nearArm: ArmPose
  readonly farArm: ArmPose
  readonly headTilt: number
  readonly breath: number
}

/** 子ども(まえむき = +x の よこがお)。体の まんなかが x=0。 */
function Kid({ palette, mood, step, nearArm, farArm, headTilt, breath }: KidProps) {
  return (
    <>
      {/* むこうの うで: 体の うしろに かくれる */}
      <Arm pose={farArm} color={palette.tunicFar} />
      {/* うしろの足・まえの足(あるくとき、かわりばんこに ふる) */}
      <Layer rotate={step * 17} origin={[1, 63]}>
        <rect x="-1.8" y="62" width="5.6" height="29.5" rx="2.8" fill={palette.pantsDark} />
        <ellipse cx="1.4" cy={FEET_Y - 0.6} rx="5" ry="2.6" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 17} origin={[-1, 63]}>
        <rect x="-4.2" y="62" width="5.6" height="29.5" rx="2.8" fill={palette.pants} />
        <ellipse cx="-0.8" cy={FEET_Y - 0.6} rx="5" ry="2.6" fill={SHOE} />
      </Layer>
      {/* くび: どう と あたま の間を、みじかく つなぐ */}
      <rect x="-2" y="29" width="5" height="8" rx="2.4" fill={SKIN_SHADE} />
      {/* どう: いきに合わせて 少し ふくらむ */}
      <Layer scaleX={1 + breath * 0.04} scaleY={1 + breath * 0.02} origin={[0, 66]}>
        <rect x="-6.8" y="33.6" width="13.6" height="33" rx="6.6" fill={palette.tunic} />
        <path d="M-5 59 h9.6" stroke={palette.tunicDark} strokeWidth="1.5" strokeLinecap="round" />
      </Layer>
      {/* てまえの うで */}
      <Arm pose={nearArm} color={palette.tunicDark} />
      {/* あたま */}
      <Layer rotate={headTilt} origin={[0.4, 31]}>
        <circle cx="0.8" cy="22.6" r="9" fill={SKIN} />
        <path d="M-8.2 22.4 C-9.4 12 2 10.2 8 15.2 C10 18 10 20 9.6 21.8 C7.4 17.8 2.4 16.6 -3 17.6 C-5.6 18.2 -7.4 20 -8.2 22.4 Z" fill={palette.hair} />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

/** ひとりぼっちの ためいき。子の くち から まえへ ふわっと。 */
function Sigh({ t }: SceneProps) {
  const show = during(t, 0.7, 1.9, 0.25)
  if (show <= 0) return null
  const p = span(t, 0.7, 1.9, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={A_X + 10 + p * 7} cy={29 + p * 3} rx={2.2 + p * 2.4} ry={1.6 + p * 1.4} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
      <ellipse cx={A_X + 8.5 + p * 3} cy={30 + p} rx={1.2 + p * 0.8} ry={0.9 + p * 0.5} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
    </g>
  )
}

/** 子の あしもとの ボール。ひとりだと ころがせない。うれしいと ぽんと はねる。 */
function Ball({ t }: SceneProps) {
  const hopAt = CLASP + 0.1
  const hop = Math.abs(Math.sin(span(t, hopAt, hopAt + 0.7) * Math.PI)) * 7
  return (
    <>
      <ellipse cx="41" cy="95.6" rx={3.6 - hop * 0.2} ry="0.9" fill="#000000" opacity="0.12" />
      <g transform={`translate(0 ${-hop})`}>
        <circle cx="41" cy="92.2" r="3.5" fill={BALL} />
        <path d="M38.4 90.6 Q41 88.6 43.4 90.6" fill="none" stroke={BALL_LIGHT} strokeWidth="1" strokeLinecap="round" />
      </g>
    </>
  )
}

const HEART = 'M0 2.6 C-4.2 -0.6 -3 -4 -1.2 -3.6 C-0.4 -3.4 0 -2.6 0 -2.2 C0 -2.6 0.4 -3.4 1.2 -3.6 C3 -4 4.2 -0.6 0 2.6 Z'

/** 手を つないだ しゅんかんから、ハートが ふわふわ のぼる。 */
function Hearts({ t }: SceneProps) {
  const show = during(t, CLASP + 0.1, INK - 0.2, 0.25)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.55, 1.1].map((offset, i) => {
        const p = ((t - CLASP + offset) % 1.65) / 1.65
        const x = 54 + (i - 1) * 8 + Math.sin(p * 6 + i) * 2
        const y = 32 - p * 14
        return <path key={offset} d={HEART} fill="#f07f9e" opacity={Math.sin(p * Math.PI)} transform={`translate(${x} ${y}) scale(${0.8 + (i % 2) * 0.3})`} />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  // ともだち: 右から あるいてきて、A の まえで 止まる
  const bx = mix(t, COME, STOP, 150, B_X, easeOut)
  const walking = t < COME ? 0 : 1 - span(t, STOP - 0.25, STOP)
  const stride = Math.sin((t - COME) * Math.PI * 2 * 1.7) * walking
  const bob = -Math.abs(stride) * 1.4

  // ふたり いっしょに ぴょんぴょん(手は つないだまま)
  const jump = span(t, CLASP + 0.3, CLASP + 0.6) * (1 - span(t, INK - 0.9, INK - 0.4))
  const hopY = -Math.abs(Math.sin((t - CLASP) * Math.PI * 1.5)) * 3.2 * jump

  // A: しょんぼり → きづく → よろこぶ
  const aMood: Mood = t < NOTICE ? 'sad' : t < OFFER + 0.5 ? 'surprised' : 'happy'
  const aBreath = t < NOTICE ? wave(t, 2.2) : 0
  const aTilt = t < NOTICE ? 9 : mix(t, NOTICE, NOTICE + 0.5, 9, -3) + (t >= CLASP ? wave(t, 0.9) * 2 * jump : 0)
  const reachA = span(t, REACH, REACH + 0.6, easeInOut)
  const aNear: ArmPose = { swing: 4 + 88 * reachA, bend: 10 * (1 - reachA) }
  const aFar: ArmPose = { swing: 3, bend: 8 }

  // B: あるく → 手を さしだす
  const offerB = span(t, OFFER, OFFER + 0.6, easeInOut)
  const bNear: ArmPose = t < STOP ? { swing: stride * 26, bend: 16 } : { swing: 4 + 88 * offerB, bend: 10 * (1 - offerB) }
  const bFar: ArmPose = t < STOP ? { swing: -stride * 26, bend: 16 } : { swing: 3, bend: 8 }
  const bMood: Mood = 'happy'
  const bTilt = t < STOP ? -2 + stride * 2 : -2 + (t >= CLASP ? wave(t, 0.9, 0.3) * 2 * jump : 0)

  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Ball t={t} />
        {/* A(しゅやく) */}
        <ellipse cx={A_X} cy="95.6" rx={9 + hopY * 0.3} ry="2.3" fill="#000000" opacity="0.12" />
        <Layer x={A_X} y={hopY}>
          <Kid palette={PALETTE_A} mood={aMood} step={0} nearArm={aNear} farArm={aFar} headTilt={aTilt} breath={aBreath} />
        </Layer>
        {/* ともだち B */}
        <Layer opacity={span(t, COME - 0.05, COME + 0.05)}>
          <ellipse cx={bx} cy="95.6" rx={9 + hopY * 0.3} ry="2.3" fill="#000000" opacity="0.12" />
          <Layer x={bx} y={bob + hopY}>
            <Layer scaleX={-1}>
              <Kid palette={PALETTE_B} mood={bMood} step={stride} nearArm={bNear} farArm={bFar} headTilt={bTilt} breath={0} />
            </Layer>
          </Layer>
        </Layer>
        <Sigh t={t} />
        <Hearts t={t} />
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
    { at: 0, label: 'ひとりぼっちで しょんぼり', sound: 'pop' },
    { at: COME, label: 'ともだちが あるいてくる' },
    { at: OFFER, label: '手を さしだす' },
    { at: REACH, label: 'うれしくて 手を のばす', sound: 'pop' },
    { at: CLASP, label: '手と 手を つないで なかよし' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '友 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
