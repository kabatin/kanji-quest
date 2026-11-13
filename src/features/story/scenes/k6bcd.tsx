/*
 * 母(はは): あかちゃんに おちちを あげる お母さん。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ→)  … お母さんの せなか(あたまの うしろ から こしまで)と、すわった ひざ
 *   2画目(コ)   … お母さんの むね・おなか と、だっこされた あかちゃんの あたり
 *   3画目(てん) … おちちの 1つぶ め(むねの まえ から あかちゃんの ほうへ)
 *   4画目(てん) … おちちの 2つぶ め(すこし 下)
 *   5画目(一)   … あかちゃんを だいている うで(ひじ で まがって、手 が あかちゃんの そこ へ)
 *
 * ながれ
 *   シートの上に すわった お母さん。よこで あかちゃんが 「おなか すいた」と ないている
 *   → お母さんが きづいて(!)、からだを たおして うでを のばす
 *   → だっこして ひざの上へ。あかちゃんは なきやみ、おちちが 2つぶ ぽとぽと
 *   → ふたりとも にっこり(ハートが ふわり)→ ほね が ひかって、絵が うすくなり、字「母」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。ものを だくときは、ひじ が 下を むく。
 *   お母さんは こしを じくに からだを たおす。あかちゃんは あたまが 大きく、手足が みじかい。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '母'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const DRESS = '#ee7c70'
const DRESS_DARK = '#d86157'
const DRESS_FAR = '#c4564d'
const SKIRT = '#e26a5f'
const SHOE = '#6b4a36'
const BLANKET = '#fbe09a'
const BLANKET_DARK = '#f0c96a'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const WRAP = '#fff1b8'
const WRAP_DARK = '#f4dc84'
const MILK = '#ffffff'
const MILK_SHADE = '#8ccbf5'
const TEAR = '#7cc4f2'
const CHEEK = '#ff9d9d'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const HEART = '#f07f9e'

/** くぎり の時間(秒) */
const SETTLE = 0.9
const NOTICE = 1.5
const REACH = 1.9
const LIFT = 3.1
const DRINK = 4.5
const SMILE = 5.5
const INK = 6.5
const DONE = 9.5
const DURATION = 10.2

/** お母さんの こし(からだを たおす じく)と、かた(こし から見た 場所) */
const HIP: readonly [number, number] = [30, 74]
const SHOULDER: readonly [number, number] = [38, 41]
/** あたま の まんなか(こし から見て) */
const HEAD: readonly [number, number] = [44, 21]
const NECK: readonly [number, number] = [42, 32]
/** うで の ほね1本の 長さ(かた→ひじ、ひじ→手) */
const ARM_PART = 21

/** あかちゃんが ねている 場所(シートの上)と、だっこされた 場所 */
const BABY_FLOOR: readonly [number, number] = [86, 92]
const BABY_HELD: readonly [number, number] = [67, 54]
const BABY_HELD_TILT = 18
/** てを おくときの、ひざの上 */
const LAP_REST: readonly [number, number] = [56, 69]

type Point = readonly [number, number]

const toRad = (deg: number) => (deg * Math.PI) / 180

/** 点 p を、c を じく に deg 度(右まわり)まわした 場所 */
function rotateAround(p: Point, c: Point, deg: number): Point {
  const r = toRad(deg)
  const dx = p[0] - c[0]
  const dy = p[1] - c[1]
  return [c[0] + dx * Math.cos(r) - dy * Math.sin(r), c[1] + dx * Math.sin(r) + dy * Math.cos(r)]
}

/** かた から 手 まで、ひじ で まがる うで。ひじ は いつも 下がわ に まがる。 */
function reachArm(shoulder: Point, target: Point): { readonly elbow: Point; readonly hand: Point } {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.max(Math.hypot(dx, dy), 0.001)
  // うでは のばしても 2本ぶんより 長くは とどかない
  const d = Math.min(dist, ARM_PART * 2 - 0.01)
  const ux = dx / dist
  const uy = dy / dist
  const hand: Point = [shoulder[0] + ux * d, shoulder[1] + uy * d]
  const h = Math.sqrt(ARM_PART ** 2 - (d / 2) ** 2)
  const sign = ux >= 0 ? 1 : -1
  const mid: Point = [shoulder[0] + (ux * d) / 2, shoulder[1] + (uy * d) / 2]
  return { elbow: [mid[0] + -uy * h * sign, mid[1] + ux * h * sign], hand }
}

function Arm({ shoulder, target, color }: { readonly shoulder: Point; readonly target: Point; readonly color: string }) {
  const { elbow, hand } = reachArm(shoulder, target)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="6.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.4" fill={SKIN} />
    </>
  )
}

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[96, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="95.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 96 13)`} />
        ))}
      </Layer>
      <circle cx="96" cy="13" r={6.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 92 Q72 72 113 94 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="62" cy="9" rx="7" ry="3.2" />
        <ellipse cx="67" cy="7.4" rx="5" ry="3.2" />
      </g>
      <ellipse cx="54.5" cy="98" rx="53" ry="6" fill={GRASS} />
      {[6, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** すわる シート(ピクニックの ぬの) */
function Blanket({ t }: SceneProps) {
  const grow = span(t, 0.1, 0.6, backOut)
  return (
    <Layer scale={grow} origin={[54, 92]}>
      <ellipse cx="54" cy="92.5" rx="50" ry="6.6" fill={BLANKET_DARK} />
      <ellipse cx="54" cy="91.6" rx="50" ry="6.2" fill={BLANKET} />
      <path d="M22 91.5 h64" stroke={BLANKET_DARK} strokeWidth="1.2" strokeLinecap="round" />
    </Layer>
  )
}

type Mood = 'worried' | 'happy'

/** お母さん の からだ。こし を じくに まえへ たおれる。あたまは むこう(右)むき。 */
function MotherBody({ lean, headTilt, mood }: { readonly lean: number; readonly headTilt: number; readonly mood: Mood }) {
  return (
    <Layer rotate={lean} origin={HIP}>
      {/* くび: どう と あたま の間を みじかく つなぐ */}
      <rect x="39.4" y="28" width="6" height="12" rx="2.6" fill={SKIN_SHADE} />
      {/* どう: かた から こし まで。せなか が 左がわ */}
      <path d="M36 40 L29 70" fill="none" stroke={DRESS} strokeWidth="18" strokeLinecap="round" />
      <path d="M24 60 L35 62" stroke={DRESS_DARK} strokeWidth="1.6" strokeLinecap="round" />
      <Layer rotate={headTilt} origin={NECK}>
        {/* かみ: うしろ(左)と 上。おだんご */}
        <circle cx="34.4" cy="13.4" r="4.8" fill={HAIR} />
        <circle cx={HEAD[0] - 1.6} cy={HEAD[1] - 0.8} r="10.4" fill={HAIR} />
        <circle cx={HEAD[0] + 0.6} cy={HEAD[1] + 1.2} r="8.8" fill={SKIN} />
        <circle cx={HEAD[0] - 2} cy={HEAD[1] + 2.8} r="1.8" fill={SKIN_SHADE} />
        <path d="M37 18 C42 11 52 13 53 21 C49 17 43 16.5 37 18 Z" fill={HAIR} />
        <circle cx="53.6" cy="23.8" r="1.2" fill={SKIN} />
        <circle cx="49.4" cy="26.6" r="2" fill={CHEEK} opacity="0.55" />
        {mood === 'worried' ? (
          <>
            <path d="M46.4 20 l3.6 -1.4" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
            <circle cx="49.2" cy="22.4" r="1.15" fill={EYE} />
            <path d="M50 28.6 Q51.6 27.6 53 28.8" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M47.4 22.6 Q49.2 20.6 51 22.6" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
            <path d="M49.6 27.2 Q51.6 29.8 53.4 27.4" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
          </>
        )}
      </Layer>
    </Layer>
  )
}

type BabyMood = 'cry' | 'drink' | 'happy'

/** あかちゃん。よこ向きに ねていて、あたまが 左・あしが 右。あたまが 大きい。 */
function Baby({ t, mood }: { readonly t: number; readonly mood: BabyMood }) {
  const kick = mood === 'cry' ? wave(t, 0.3) * 14 : 0
  return (
    <>
      <Layer rotate={kick} origin={[11, 0]}>
        <circle cx="12.6" cy="-1.6" r="2.4" fill={SKIN} />
      </Layer>
      <Layer rotate={-kick} origin={[11, 0]}>
        <circle cx="12.6" cy="2.4" r="2.4" fill={SKIN_SHADE} />
      </Layer>
      <rect x="-3" y="-5.6" width="15" height="11.2" rx="5.2" fill={WRAP} />
      <path d="M3 -5 v10" stroke={WRAP_DARK} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="-9" cy="0" r="7" fill={SKIN} />
      <path d="M-11 -6.6 Q-9 -9.4 -7 -6.6" fill="none" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="-12.4" cy="2.6" r="1.5" fill={CHEEK} opacity="0.6" />
      <circle cx="-5.6" cy="2.6" r="1.5" fill={CHEEK} opacity="0.6" />
      {mood === 'cry' && (
        <>
          <path d="M-12.2 -2.6 l2 1 l-2 1 M-5.8 -2.6 l-2 1 l2 1" fill="none" stroke={EYE} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx="-9" cy="3.2" rx="2" ry={1.8 + Math.abs(wave(t, 0.35)) * 0.8} fill={MOUTH} />
        </>
      )}
      {mood === 'drink' && (
        <>
          <path d="M-11.8 -1.4 Q-10.2 0 -8.6 -1.4 M-9.4 -1.4 Q-7.8 0 -6.2 -1.4" fill="none" stroke={EYE} strokeWidth="1" strokeLinecap="round" />
          <ellipse cx="-9" cy="3" rx={0.9 + Math.abs(wave(t, 0.5)) * 0.5} ry="1.1" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M-12 -1 Q-10.4 -2.8 -8.8 -1 M-9.2 -1 Q-7.6 -2.8 -6 -1" fill="none" stroke={EYE} strokeWidth="1" strokeLinecap="round" />
          <path d="M-11 2.4 Q-9 5 -7 2.4" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
    </>
  )
}

/** あかちゃんの なみだ。ないている間、ほっぺから とぶ。 */
function Tears({ t, x, y, rot }: { readonly t: number; readonly x: number; readonly y: number; readonly rot: number }) {
  const show = during(t, 0.7, LIFT + 1.2, 0.25)
  if (show <= 0) return null
  return (
    <Layer x={x} y={y} rotate={rot} opacity={show}>
      {[0, 0.5].map((offset) => {
        const p = ((t + offset) % 1) / 1
        return [-1, 1].map((side) => (
          <path key={`${offset}-${side}`} d="M0 -1.6 Q1.4 0.4 0 1.4 Q-1.4 0.4 0 -1.6 Z" fill={TEAR} opacity={1 - p} transform={`translate(${-9 + side * 6.6 + side * p * 4} ${3 - p * 5 - Math.sin(p * Math.PI) * 3})`} />
        ))
      })}
    </Layer>
  )
}

/** 「！」 お母さんが きづいた。かたちで 描く(文字は 使わない)。 */
function Notice({ t, at }: { readonly t: number; readonly at: Point }) {
  const show = during(t, NOTICE, REACH + 0.9, 0.2)
  if (show <= 0) return null
  const pop = span(t, NOTICE, NOTICE + 0.3, backOut)
  return (
    <Layer x={at[0]} y={at[1]} scale={pop} opacity={show} origin={[0, 0]}>
      <rect x="-1.5" y="-8" width="3" height="7.4" rx="1.5" fill="#e8534a" />
      <circle cx="0" cy="2.4" r="1.7" fill="#e8534a" />
    </Layer>
  )
}

/** おちち の ひとつぶ。stroke の線の ように、むね の まえ から あかちゃんへ。 */
function MilkDrop({ t, from, to, start, end }: { readonly t: number; readonly from: Point; readonly to: Point; readonly start: number; readonly end: number }) {
  const p = span(t, start, end, easeOut)
  if (p <= 0) return null
  const fade = 1 - span(t, end + 0.4, end + 0.8)
  if (fade <= 0) return null
  const x = from[0] + (to[0] - from[0]) * p
  const y = from[1] + (to[1] - from[1]) * p
  const size = Math.min(1, p * 3) * (0.8 + 0.2 * backOut(Math.min(1, p * 2)))
  return (
    <Layer x={x} y={y} opacity={fade} scale={Math.max(0, size) * 1.5} rotate={-38}>
      <path d="M0 -4 Q3.4 0.2 0 3 Q-3.4 0.2 0 -4 Z" fill={MILK_SHADE} />
      <path d="M0 -3.4 Q2.6 0 0 2.2 Q-2.6 0 0 -3.4 Z" fill={MILK} />
    </Layer>
  )
}

function Heart({ x, y, s, color }: { readonly x: number; readonly y: number; readonly s: number; readonly color: string }) {
  return <path d="M0 3 C-5 -0.5 -3.5 -4.5 0 -2 C3.5 -4.5 5 -0.5 0 3 Z" fill={color} transform={`translate(${x} ${y}) scale(${s})`} />
}

/** ふたりが にっこり したあと、ハートが ふわり と のぼる。 */
function Hearts({ t }: SceneProps) {
  const show = during(t, SMILE, INK + 0.3, 0.25)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.5, 1.0].map((offset, i) => {
        const p = span(t, SMILE + offset * 0.4, SMILE + 1.4 + offset * 0.4)
        return <Heart key={offset} x={58 + i * 6 + Math.sin(p * 6 + i) * 2} y={30 - p * 14 - i * 2} s={(1 + i * 0.12) * Math.min(1, p * 4)} color={HEART} />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)

  // お母さん: シートに すわっている。ふわっと あらわれる
  const mother = span(t, SETTLE - 0.6, SETTLE, backOut)
  const baby = span(t, SETTLE - 0.1, SETTLE + 0.3, backOut)
  // からだを たおして あかちゃんへ → だっこして すこし もどる
  const lean = mix(t, REACH, LIFT - 0.1, 0, 50, easeInOut) - mix(t, LIFT, DRINK - 0.3, 0, 44, easeInOut)
  const bob = t >= DRINK ? wave(t, 2.4) * 0.25 : 0
  const headTilt = mix(t, REACH, LIFT, 0, 6, easeInOut) + (t >= DRINK ? 4 : 0)
  const mood: Mood = t < DRINK ? 'worried' : 'happy'

  // あかちゃん: ひざの上へ ゆっくり もちあげられる(山なりに)
  const lift = span(t, LIFT, DRINK - 0.4, easeInOut)
  const babyX = BABY_FLOOR[0] + (BABY_HELD[0] - BABY_FLOOR[0]) * lift
  const babyY = BABY_FLOOR[1] + (BABY_HELD[1] - BABY_FLOOR[1]) * lift - Math.sin(lift * Math.PI) * 3
  const babyTilt = BABY_HELD_TILT * lift + (lift < 1 && t < LIFT ? wave(t, 0.3) * 2 : 0)
  const babyMood: BabyMood = t < DRINK ? 'cry' : t < SMILE ? 'drink' : 'happy'
  // うで が とどく 場所は、あかちゃんの そこ(だっこされると 下に うでが まわる)
  const carry = span(t, LIFT, DRINK - 0.4)
  const under = (dx: number): Point => {
    const local: Point = [dx, 5.8 * carry]
    const r = toRad(babyTilt)
    return [babyX + local[0] * Math.cos(r) - local[1] * Math.sin(r), babyY + local[0] * Math.sin(r) + local[1] * Math.cos(r)]
  }
  const grab = span(t, REACH + 0.2, LIFT - 0.2, easeInOut)
  const lerp = (a: Point, b: Point): Point => [a[0] + (b[0] - a[0]) * grab, a[1] + (b[1] - a[1]) * grab]
  const shoulder = rotateAround([SHOULDER[0], SHOULDER[1] + bob], HIP, lean)
  const nearTarget = lerp(LAP_REST, under(4))
  const farTarget = lerp([LAP_REST[0] - 8, LAP_REST[1] - 1], under(-6))

  const motherWorldHead = rotateAround(HEAD, HIP, lean)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Blanket t={t} />
        <Layer opacity={mother} y={bob} origin={[30, 92]}>
          {/* むこうの うで: どう の うしろ */}
          <Arm shoulder={shoulder} target={farTarget} color={DRESS_FAR} />
          <MotherBody lean={lean} headTilt={headTilt} mood={mood} />
          {/* ひざ: すわった ふとももの あたり */}
          <ellipse cx="68" cy="85.6" rx="5.4" ry="2.8" fill={SHOE} />
          <rect x="22" y="71" width="46" height="15" rx="7" fill={SKIRT} />
          <path d="M34 80 h22" stroke={DRESS_DARK} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
        </Layer>
        <Layer opacity={baby} scale={baby} x={babyX} y={babyY} rotate={babyTilt}>
          <Baby t={t} mood={babyMood} />
        </Layer>
        <Tears t={t} x={babyX} y={babyY} rot={babyTilt} />
        {/* てまえの うで: あかちゃんの したから ささえる */}
        <Layer opacity={mother} y={bob} origin={[30, 92]}>
          <Arm shoulder={shoulder} target={nearTarget} color={DRESS_DARK} />
        </Layer>
        <Notice t={t} at={[motherWorldHead[0] + 2, motherWorldHead[1] - 17]} />
        {/* おちち: 3画目・4画目の 場所を とおる */}
        <MilkDrop t={t} from={[48.5, 28.5]} to={[60.5, 41]} start={DRINK} end={DRINK + 0.6} />
        <MilkDrop t={t} from={[45, 57.4]} to={[56.4, 70]} start={DRINK + 0.5} end={DRINK + 1.1} />
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
    { at: 0, label: 'シートの上に お母さんが すわる', sound: 'pop' },
    { at: SETTLE, label: 'あかちゃんが 「おなか すいた」と なく' },
    { at: NOTICE, label: 'お母さんが きづいて、うでを のばす', sound: 'pop' },
    { at: LIFT, label: 'だっこして ひざの上へ' },
    { at: DRINK, label: 'おちちを のんで なきやむ(ふたつぶ)', sound: 'pop' },
    { at: SMILE, label: 'ふたりとも にっこり。ハートが ふわり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '母 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
