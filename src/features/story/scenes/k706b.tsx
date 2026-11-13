/*
 * 火(ひ): たきぎに 火が うつって、めらめら もえる ほのお。
 *
 * ほね(画と絵の対応)
 *   1画目(丶)  … ほのおの 左へ のびる 小さな した(左の ほのおの ひとなめ)
 *   2画目(丶)  … ほのおの 右へ のびる 小さな した(右の ほのおの ひとなめ)
 *   3画目(ノ)  … 上半分は、まんなかの 大きな ほのおの せぼね(さきっぽ から ねもと まで)。
 *                  下半分は、左に たおれかかる たきぎ
 *   4画目(乀)  … 右に たおれかかる たきぎ(上の はし は ほのおの 中)
 *
 * ながれ
 *   夜、さむそうな 子が ふるえている(いきが 白い)。 たきぎが 2本 くまれている
 *   → 子が、ひだね の ついた えだ を たきぎ へ のばす
 *   → えだ の ひ が たきぎに うつって、ちいさな ほのお が ぽっと ともる
 *   → ほのお が ぐんぐん 大きくなり、子は びっくり。 つぎに、あったかくて にっこり(まわりも あかるくなる)
 *   → ほのおの かたちが ゆれながら 落ちつき、ほね が ひかって、絵が うすくなり、字「火」が のこる
 *
 * 子・たきぎ・ほのおは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる。ほのお は 下が ふくらんで 上が とがり、ゆらゆら ゆれる。
 *   たきぎ は 地面に ななめに くまれて、火は その まんなか から もえあがる。
 *   ひ が うつる わけ は、子が えだ の ひだね を たきぎ に ふれさせるから。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '火'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#4fb3b0'
const TUNIC_DARK = '#3b9a98'
const TUNIC_FAR = '#2f807e'
const SCARF = '#f2b632'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const WOOD_CUT = '#d9b087'
const GRASS = '#c5e8a9'
const HILL = '#e2f2d2'
const STONE = '#a8adb6'
const STONE_LIGHT = '#c9cdd4'
const DUSK = '#4a5a8c'
const FLAME_OUT = '#ff7a2e'
const FLAME_MID = '#ffb02e'
const FLAME_IN = '#ffe27a'
const FLAME_CORE = '#fff6c4'
const EMBER = '#ff6a3a'

/** くぎり の時間(秒) */
const LIFT = 1.3
/** えだ の ひ が たきぎに ふれる */
const TOUCH = 2.5
const GROW = 3.0
const WARM = 4.6
const INK = 6.0
const DONE = 8.6
const DURATION = 9.4

/** 子の かた・こし(ひだり に いて、右(ほのお)を むいている) */
const SHOULDER: readonly [number, number] = [10, 72]
const HIP: readonly [number, number] = [9, 88]
const ARM_PART = 7
/** ひだね の えだ の 長さ(のばすと、さきっぽ が 左の たきぎ に とどく) */
const STICK = 20
/** ほのおの ねもと(ここを じく に 大きくなる) */
const FLAME_BASE: readonly [number, number] = [48, 67]

const rad = (deg: number) => (deg * Math.PI) / 180

/* ───────── ばしょ(空・地面・いし) ───────── */

function Backdrop({ t }: SceneProps) {
  // 夜の あおぐらさ は、ほのお が つくと うすれる
  const dusk = 0.5 * (1 - span(t, TOUCH + 0.4, WARM + 0.6)) + 0.06
  const sky = span(t, 0, 0.5, easeOut)
  const glow = span(t, TOUCH + 0.3, GROW + 1.4, easeOut)
  return (
    <>
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 94 V101 H-4 Z" fill={HILL} opacity={sky} />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} opacity={sky} />
      <rect x="0" y="0" width="109" height="109" fill={DUSK} opacity={dusk * sky} />
      {/* 月 と 星(あかるくなると 見えにくくなる) */}
      <g opacity={sky * Math.min(1, dusk * 2.2)}>
        <circle cx="95" cy="12" r="5.4" fill="#fff1b8" />
        <circle cx="97.6" cy="10.6" r="4.6" fill={DUSK} />
        <Star cx={14} cy={14} r={2.4 + wave(t, 1.6) * 0.5} color="#ffe9a8" />
        <Star cx={34} cy={7} r={1.8 + wave(t, 1.3, 0.4) * 0.4} color="#ffe9a8" />
        <Star cx={72} cy={9} r={2 + wave(t, 1.9, 0.9) * 0.5} color="#ffe9a8" />
        <Star cx={101} cy={38} r={1.7 + wave(t, 1.5, 0.2) * 0.4} color="#ffe9a8" />
      </g>
      {/* ほのおの あかり: まわりが ぽうっと あたたかくなる */}
      <circle cx="50" cy="56" r="40" fill="#ffcf7a" opacity={0.16 * glow} />
      <circle cx="50" cy="60" r="26" fill="#ffc15a" opacity={0.16 * glow} />
      <ellipse cx="54" cy="96.4" rx={48 * glow} ry="7" fill="#ffb347" opacity={0.3 * glow} />
    </>
  )
}

/** たきぎの まわりの いし(火が ひろがらないように) */
function Stones({ t }: SceneProps) {
  const pop = span(t, 0.2, 0.7, backOut)
  const stones: readonly (readonly [number, number, number])[] = [[41, 97.4, 4], [53, 98.2, 3.4], [63, 97.8, 3.8], [75, 97.2, 3.6]]
  return (
    <Layer scale={pop} origin={[58, 98]}>
      {stones.map(([cx, cy, r]) => (
        <g key={cx}>
          <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.66} fill={STONE} />
          <ellipse cx={cx - r * 0.25} cy={cy - r * 0.2} rx={r * 0.5} ry={r * 0.3} fill={STONE_LIGHT} />
        </g>
      ))}
    </Layer>
  )
}

/* ───────── たきぎ ───────── */

/** たきぎ2本。3画目の 下半分 と 4画目 の線の上に、ななめに くむ */
function Logs({ t }: SceneProps) {
  const pop = span(t, 0.2, 0.8, backOut)
  // ひ が うつった ところ は あかく ほんのり もえる
  const burn = span(t, TOUCH + 0.1, GROW + 0.6)
  return (
    <>
      <ellipse cx="58" cy="97.6" rx={Math.max(0, 38 * pop)} ry="2.6" fill="#000000" opacity="0.12" />
      <Layer scaleX={0.7 + 0.3 * pop} scaleY={pop} origin={[58, 96]}>
        {/* 左の たきぎ(3画目の 下半分) */}
        <Bone char={CHAR} n={3} color={BARK} width={8} from={0.56} />
        <Bone char={CHAR} n={3} color={BARK_DARK} width={2.2} from={0.6} to={0.97} opacity={0.5} />
        <circle cx="21" cy="91.4" r="3.4" fill={BARK_DARK} />
        <circle cx="21" cy="91.4" r="2.2" fill={WOOD_CUT} />
        <circle cx="21" cy="91.4" r="0.9" fill={BARK} />
        {/* 右の たきぎ(4画目) */}
        <Bone char={CHAR} n={4} color={BARK} width={8} />
        <Bone char={CHAR} n={4} color={BARK_DARK} width={2.2} from={0.12} to={0.9} opacity={0.5} />
        <circle cx="94.8" cy="91" r="3.4" fill={BARK_DARK} />
        <circle cx="94.8" cy="91" r="2.2" fill={WOOD_CUT} />
        <circle cx="94.8" cy="91" r="0.9" fill={BARK} />
        {/* もえている ところ */}
        <Bone char={CHAR} n={3} color={EMBER} width={3.4} from={0.56} to={0.74} opacity={0.75 * burn} />
        <Bone char={CHAR} n={4} color={EMBER} width={3.4} from={0} to={0.22} opacity={0.75 * burn} />
      </Layer>
    </>
  )
}

/* ───────── ほのお ───────── */

/** まんなかの 大きな ほのお。さきっぽ が 3画目の 上のはし、ねもと が 3画目の まんなか あたり */
const CORE = 'M52.5 14 C54 27 66 38 64 54 C63 63 56 69 49 69 C41 69 38 62 41 54 C44 45 51 37 51 25 C51.2 20.5 51.8 17 52.5 14 Z'
/** 左の ほのおの した(1画目の線の まわり) */
const LEFT_TONGUE = 'M24.3 34 C31 38 42 47 42 58 C42 63 34 63 32 56 C30 50 26.5 42 24.3 34 Z'
/** 右の ほのおの した(2画目の線の まわり) */
const RIGHT_TONGUE = 'M83 27.3 C86 37 82 46 72 55 C67 60 60 60 61 54 C66 48 77 40 83 27.3 Z'

type FlameProps = SceneProps & { readonly calm: number }

function Flame({ t, calm }: FlameProps) {
  const seed = span(t, TOUCH, TOUCH + 0.5, easeOut) * 0.2
  const grow = span(t, GROW, GROW + 1.4, backOut)
  const size = Math.max(0, seed + 0.8 * grow)
  if (size <= 0) return null
  // ゆらゆら: 落ちつく ころには とまって、字の線と かさなる
  const sway = wave(t, 0.9) * 2.6 * calm
  const flick = 1 + (wave(t, 0.31) * 0.05 + wave(t, 0.19, 0.3) * 0.035) * calm
  const left = Math.max(0, span(t, GROW + 0.3, GROW + 1.3, backOut))
  const right = Math.max(0, span(t, GROW + 0.5, GROW + 1.5, backOut))
  return (
    <>
      <Layer scaleX={1} scaleY={left} scale={left} rotate={wave(t, 0.55, 0.3) * 3.5 * calm} origin={[40, 58]}>
        <path d={LEFT_TONGUE} fill={FLAME_OUT} />
        <Layer scale={0.58} origin={[40, 59]}>
          <path d={LEFT_TONGUE} fill={FLAME_IN} />
        </Layer>
      </Layer>
      <Layer scale={right} rotate={wave(t, 0.5, 0.7) * 3.5 * calm} origin={[63, 57]}>
        <path d={RIGHT_TONGUE} fill={FLAME_OUT} />
        <Layer scale={0.58} origin={[63, 58]}>
          <path d={RIGHT_TONGUE} fill={FLAME_IN} />
        </Layer>
      </Layer>
      <Layer scaleX={size} scaleY={size * flick} rotate={sway} origin={FLAME_BASE}>
        <path d={CORE} fill={FLAME_OUT} />
        <Layer scaleX={0.7} scaleY={0.72} origin={[48, 68]}>
          <path d={CORE} fill={FLAME_MID} />
        </Layer>
        <Layer scaleX={0.42} scaleY={0.46} origin={[48, 68]}>
          <path d={CORE} fill={FLAME_IN} />
        </Layer>
        <Layer scaleX={0.2} scaleY={0.22} origin={[48, 68]}>
          <path d={CORE} fill={FLAME_CORE} />
        </Layer>
      </Layer>
    </>
  )
}

/** ほのおから 上へ とぶ ひのこ */
function Sparks({ t }: SceneProps) {
  const show = span(t, GROW + 0.4, GROW + 0.9) * (1 - span(t, INK - 0.7, INK - 0.1))
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const p = (t * 0.5 + i * 0.17) % 1
        const x = 40 + i * 5 + Math.sin(p * 6 + i) * 3
        const y = 58 - p * 40
        return <circle key={i} cx={x} cy={y} r={1.2 * (1 - p * 0.5)} fill="#ffd24a" opacity={Math.sin(p * Math.PI)} />
      })}
    </g>
  )
}

/* ───────── 子 ───────── */

type Mood = 'cold' | 'hope' | 'wow' | 'happy'
/** うで の かっこう。swing = ま下から まえ(右)へ ふった角度 / bend = ひじ の まがり */
type ArmPose = { readonly swing: number; readonly bend: number }

function armPoints(pose: ArmPose) {
  const elbow = [SHOULDER[0] + Math.sin(rad(pose.swing)) * ARM_PART, SHOULDER[1] + Math.cos(rad(pose.swing)) * ARM_PART] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] + Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART] as const
  return { elbow, hand }
}

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。 */
function Arm({ pose, color }: { readonly pose: ArmPose; readonly color: string }) {
  const { elbow, hand } = armPoints(pose)
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="4.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.7" fill={SKIN} />
    </>
  )
}

/** ひだね の えだ。手に にぎって、さきっぽ が ぽっと あかい。angle は ま下から まえへ(180 = 上むき) */
function Stick({ pose, angle, ember }: { readonly pose: ArmPose; readonly angle: number; readonly ember: number }) {
  const { hand } = armPoints(pose)
  const tip = [hand[0] + Math.sin(rad(angle)) * STICK, hand[1] + Math.cos(rad(angle)) * STICK] as const
  const back = [hand[0] - Math.sin(rad(angle)) * 3, hand[1] - Math.cos(rad(angle)) * 3] as const
  return (
    <>
      <path d={`M${back[0]} ${back[1]} L${tip[0]} ${tip[1]}`} stroke="#a9764a" strokeWidth="1.9" strokeLinecap="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.7" fill={SKIN} />
      <circle cx={tip[0]} cy={tip[1]} r={1.5 + 1.4 * ember} fill="#ffb24a" opacity={0.45 + 0.4 * ember} />
      <circle cx={tip[0]} cy={tip[1]} r={1.1 + 0.4 * ember} fill={EMBER} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  const ink = '#2b2b2b'
  const mouth = '#b9483f'
  return (
    <>
      {mood === 'cold' && (
        <>
          {/* まゆ: さむくて こまった かお(なかよせ側が 上がる) */}
          <path d="M1.4 -1.6 l3.2 -1.3" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <path d="M1.6 -0.2 l2.8 0.6" stroke={ink} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M1.4 3.6 q1 -1 2 0 q1 1 2 0" fill="none" stroke={mouth} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="6.2" cy="1.8" r="1" fill="#ff8c8c" />
        </>
      )}
      {mood === 'hope' && (
        <>
          <path d="M1.4 -2.4 l3.2 -0.6" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <circle cx="3.2" cy="-0.4" r="1.15" fill={ink} />
          <ellipse cx="4.2" cy="3.6" rx="1" ry="1.1" fill={mouth} />
        </>
      )}
      {mood === 'wow' && (
        <>
          <path d="M1.2 -3.2 l3.4 -1" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <circle cx="3.2" cy="-0.6" r="1.7" fill="#ffffff" stroke={ink} strokeWidth="0.5" />
          <circle cx="3.7" cy="-0.5" r="1" fill={ink} />
          <ellipse cx="4.4" cy="3.8" rx="1.4" ry="1.9" fill={mouth} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M1.4 -0.2 Q3 -2.4 4.6 -0.2" fill="none" stroke={ink} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M1.8 2.8 Q4 5.8 6.4 2.6" fill="none" stroke={mouth} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="1.2" cy="2.6" r="1.9" fill="#ff9d9d" opacity="0.65" />
        </>
      )}
    </>
  )
}

type ChildProps = {
  readonly mood: Mood
  readonly nearArm: ArmPose
  readonly farArm: ArmPose
  readonly stickAngle: number
  readonly ember: number
  readonly lean: number
  readonly headTilt: number
}

function Child({ mood, nearArm, farArm, stickAngle, ember, lean, headTilt }: ChildProps) {
  return (
    <>
      {/* あし: こしを おろして ひざを たてる。ひざ から したは じめんへ */}
      <path d="M8 87 L15 81.6 L15.6 92.5" fill="none" stroke={PANTS_DARK} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="17" cy="94" rx="4" ry="2.1" fill={SHOE} />
      <path d="M10.5 88 L18.6 83.4 L19.4 93" fill="none" stroke={PANTS} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="20.6" cy="94.4" rx="4" ry="2.1" fill={SHOE} />
      <Layer rotate={lean} origin={HIP}>
        <Arm pose={farArm} color={TUNIC_FAR} />
        {/* どう */}
        <rect x="3.6" y="67.8" width="11.6" height="21" rx="5.4" fill={TUNIC} />
        <path d="M5.4 80.6 h8" stroke={TUNIC_DARK} strokeWidth="1.4" strokeLinecap="round" />
        {/* くび の まきもの(くび は みじかく、これで すきまが かくれる) */}
        <rect x="4.6" y="65.8" width="10.2" height="3.6" rx="1.8" fill={SCARF} />
        <path d="M5 67.6 l-3.6 4.4 l3.4 0.8 Z" fill={SCARF} />
        <Arm pose={nearArm} color={TUNIC_DARK} />
        <Stick pose={nearArm} angle={stickAngle} ember={ember} />
        {/* あたま(右を むいている) */}
        <Layer rotate={headTilt} origin={[10, 66]}>
          <g transform="translate(10.4 59.4)">
            <circle cx="0" cy="0" r="6.6" fill={SKIN} />
            <path d="M-6.7 0.8 C-7.8 -6.8 0.6 -9.4 5.8 -5.6 C3.4 -5.2 1 -4 0.2 -2.4 C-1.8 -3.4 -4.6 -2.6 -6.7 0.8 Z" fill={HAIR} />
            <path d="M-0.4 -6.8 Q0.6 -9.6 2 -7.2" fill="none" stroke={HAIR} strokeWidth="1.6" strokeLinecap="round" />
            <ellipse cx="-3.4" cy="1.8" rx="1.5" ry="2.2" fill={SKIN_SHADE} />
            <Face mood={mood} />
          </g>
        </Layer>
      </Layer>
    </>
  )
}

/** さむくて はく、白い いき。 */
function Breath({ t }: SceneProps) {
  const show = during(t, 0.5, TOUCH + 0.3, 0.3)
  if (show <= 0) return null
  const p = ((t - 0.5) % 1) / 1
  return (
    <g opacity={show * (1 - p)}>
      <ellipse cx={17 + p * 6} cy={63.6 - p * 4} rx={1.6 + p * 2.2} ry={1.1 + p * 1.4} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
      <ellipse cx={20 + p * 4} cy={62.4 - p * 2} rx={0.9 + p * 1.2} ry={0.7 + p * 0.8} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.4" />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)
  // 字になる ちょくぜん、ほのおの ゆれ を とめて 字の線に そろえる
  const calm = 1 - span(t, INK - 0.6, INK - 0.1)

  const lift = span(t, LIFT, TOUCH - 0.1, easeInOut)
  const draw = span(t, TOUCH + 0.4, WARM - 0.3, easeInOut)
  const warm = span(t, GROW + 0.4, WARM, easeInOut)
  const cold = 1 - span(t, GROW, GROW + 1.2)
  const mood: Mood = t < LIFT + 0.7 ? 'cold' : t < GROW ? 'hope' : t < WARM ? 'wow' : 'happy'
  // うで: はじめは ひざを かかえ、えだ を ほのお へ のばし、ひとやすみ で ひく。
  // あったまると 空いた うで も ほのお へ むける
  const nearArm: ArmPose = { swing: 20 + 65 * lift - 35 * draw, bend: 45 * (1 - lift) + 10 * draw }
  const farArm: ArmPose = { swing: 15 + 55 * warm, bend: 55 * (1 - warm) + 5 * warm }
  const stickAngle = 180 - 92 * lift - 38 * draw
  const ember = span(t, TOUCH - 0.2, TOUCH + 0.2) * (1 - span(t, GROW, WARM))
  // びっくり して のけぞる → あったまって ゆらゆら
  const startle = span(t, GROW - 0.1, GROW + 0.4, easeOut) * (1 - span(t, GROW + 0.9, GROW + 1.8))
  const lean = -8 * startle + wave(t, 0.9) * 1.8 * span(t, WARM, WARM + 0.5) * calm
  const headTilt = mood === 'cold' ? 4 : mood === 'happy' ? -3 : -6 * startle
  const shiver = wave(t, 0.1) * 0.45 * cold * span(t, 0.3, 0.7)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} />
        <Stones t={t} />
        <Logs t={t} />
        <Flame t={t} calm={calm} />
        <Sparks t={t} />
        <Layer x={shiver} opacity={span(t, 0.1, 0.5)}>
          <Child mood={mood} nearArm={nearArm} farArm={farArm} stickAngle={stickAngle} ember={ember} lean={lean} headTilt={headTilt} />
        </Layer>
        <Breath t={t} />
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
    { at: 0, label: '夜。さむそうな 子が ふるえている', sound: 'pop' },
    { at: LIFT, label: 'ひだね の えだ を たきぎ へ のばす' },
    { at: TOUCH, label: 'たきぎに 火が うつる', sound: 'pop' },
    { at: GROW, label: 'ほのお が ぐんぐん 大きくなる' },
    { at: WARM, label: 'あったかい! 子が にっこり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '火 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
