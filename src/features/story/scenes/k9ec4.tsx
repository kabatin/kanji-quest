/*
 * 黄(き): こしに さげた 黄色い 玉(たま)の かたち。
 *
 * ほね(画と絵の対応)
 *   この字は「こしに さげた 玉」の かたち。ひもの上の よこ線(1〜4画目)が こしの ひも、
 *   まんなかの わく(5〜9画目)が 玉、したに ひろがる 2本(10・11画目)が ふさ。
 *   子どもの 体の大きさを ほんものらしく 守るので、玉は 字より 小さく なる。
 *   絵と字は だいたい 同じ あたり(まんなか〜したがわ)で かさなればよい、として 1 を えらんだ。
 *   (Bone は 使わない。玉の かたちを 字に 合わせて ゆがめないため)
 *
 * ながれ
 *   子どもが ひとり たっている → 黄色い 玉を くわえた 鳥が とんでくる(子どもは びっくり)
 *   → 鳥が 玉を ぽとん と おとす → 子どもが りょうてで うけとって 大よろこび
 *   → こしの ひもに ゆわえつける → 玉が ゆらゆら ゆれる(うれしそう)
 *   → ほね が ひかって、絵が うすくなり、字「黄」が のこる
 *
 * 子どもは Person(正面)。手は { to, depth } で 玉を うける・ひもに ゆわえる。
 *   こしの ひも(赤い おび と 黄色い とめぐ)は Person の held に わたして、どうの 上・うでの 下に 描く。
 *   玉・ふさ・鳥の ようす は ここで 描く(鳥は Bird)。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Bird, HANG_ARM, mixLimb, PALETTE, Person, personRig, type Limb } from '../sceneFigures'

const CHAR = '黄'

const BELT = '#b9503a'
const LEAF = PALETTE.leaf
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const JADE = '#ffd24a'
const JADE_DARK = '#e0a21a'
const CORD = '#d9534f'
const BIRD = '#6fb1e8'
const BIRD_DARK = '#4a8fcb'

/** くぎり の時間(秒) */
const FLY_IN = 0.7
const HOVER = 2.0
const DROP = 2.4
const LAND = 3.0
const TIE0 = 4.4
const TIE1 = 5.3
const FREE = 5.9
const INK = 6.5
const DONE = 9.3
const DURATION = 10

type Pt = readonly [number, number]
const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/** 子どもの まんなか(x)と 足もと(y)、背の高さ、見た目 */
const X0 = 46
const FEET_Y = 95
const KID_HEIGHT = 66
const KID_LOOK = { top: '#4f9be0', bottom: '#3e5c86' } as const
/** 手を まえへ のばす おくゆき(玉を うける・ひもを ゆわえる) */
const REACH_DEPTH = 7
/** こし(ひも の たかさ)から の ずれ。玉を つるす ところ・うけとる ところ・手の めあて */
const HANG_DX = 12.5
const HELD_DX = 11
const HELD_DY = -17
/** 鳥が とまって(うかんで)いる ばしょ。くちばしの さきが HELD の 上に くる */
const BIRD_X = X0 + 19.6
const BIRD_Y = 7

/** 玉の ひもの 上はし から 玉の まんなか までの 長さ */
const JADE_DROP = 10.5

type Mood = 'plain' | 'surprised' | 'happy' | 'focus'
const FACES = { plain: 'normal', surprised: 'surprised', happy: 'joy', focus: 'normal' } as const

function moodAt(t: number): Mood {
  if (t < 1.3) return 'plain'
  if (t < LAND) return 'surprised'
  if (t < TIE0) return 'happy'
  if (t < TIE1) return 'focus'
  return 'happy'
}

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
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="-4" cy="40" rx="7" ry="3.4" />
        <ellipse cx="1" cy="38" rx="5" ry="3.4" />
        <ellipse cx="96" cy="46" rx="6" ry="2.8" />
        <ellipse cx="100.5" cy="44.4" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 30, 70, 90, 102].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 黄色い 玉。ひもの 上はし が (0,0)。ふさ は すこし おくれて ゆれる。 */
function Pendant({ tassel }: { readonly tassel: number }) {
  return (
    <>
      <path d="M0 0 V5" stroke={CORD} strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="0" cy="-0.2" r="1.3" fill="none" stroke={CORD} strokeWidth="0.9" />
      <circle cx="0" cy={JADE_DROP} r="5.5" fill={JADE} stroke={JADE_DARK} strokeWidth="1" />
      <circle cx="0" cy={JADE_DROP} r="1.9" fill={JADE_DARK} />
      <path d={`M-3.7 ${JADE_DROP - 1.2} Q-3 ${JADE_DROP - 3.4} -1 ${JADE_DROP - 4.1}`} fill="none" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      <Layer rotate={tassel} origin={[0, 16.5]}>
        <circle cx="0" cy="16.5" r="1.3" fill={CORD} />
        <path d="M0 16.5 L-2.4 27 M0 16.5 L0 28 M0 16.5 L2.4 27" fill="none" stroke={CORD} strokeWidth="1.3" strokeLinecap="round" />
      </Layer>
    </>
  )
}

/** 玉の まわりの きらきら(つやの ひかり)。 */
function Glints({ t, at, from, to }: { readonly t: number; readonly at: Pt; readonly from: number; readonly to: number }) {
  const show = during(t, from, to, 0.25)
  if (show <= 0) return null
  const pulse = 0.7 + 0.3 * wave(t, 0.5)
  return (
    <g opacity={show}>
      <Star cx={at[0] + 7.5} cy={at[1] - 5} r={2.2 * pulse} color="#ffffff" spin={t * 60} />
      <Star cx={at[0] - 7} cy={at[1] - 2} r={1.6 * (1.7 - pulse)} color="#ffd95a" spin={-t * 50} />
      <Star cx={at[0] + 4} cy={at[1] + 8} r={1.4 * pulse} color="#ffffff" spin={t * 40} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 11)

  const pop = span(t, 0.05, 0.6, backOut)
  const mood = moodAt(t)

  // 子どもの ようす: 玉を もらって よろこんで とびはねる(2かい)。さいごは からだを ゆらゆら
  const hop = Math.abs(Math.sin(span(t, LAND + 0.15, LAND + 1.15) * Math.PI * 2)) * 2.4 * (1 - span(t, LAND + 1.15, LAND + 1.2))
  const dip = Math.sin(span(t, LAND, LAND + 0.3) * Math.PI) * 1.4
  const sway = wave(t, 1.6) * 1.1 * span(t, FREE - 0.2, FREE + 0.5) * (1 - span(t, INK - 0.2, INK + 0.5))
  const dx = sway
  const dy = -hop

  const base = { x: X0, y: FEET_Y, build: 'child', height: KID_HEIGHT, facing: 'front' } as const
  const waist = personRig(base).world.pelvis[1]
  // 玉を つるす ところ と、うけとった ときの ひもの 上はし
  const hang: Pt = [X0 + HANG_DX, waist + 0.6]
  const held: Pt = [X0 + HELD_DX, waist + HELD_DY]

  // 手: ひとやすみ → 玉を うける(まえへ) → こしの ひもへ → ふつうに たらす。画面の ひだりの 手 = 体の 右手
  const raise = span(t, HOVER, HOVER + 0.7, easeOut)
  const tie = span(t, TIE0, TIE1, easeInOut)
  const release = span(t, TIE1, FREE, easeInOut)
  const handFor = (catchAt: Pt, beltAt: Pt): Limb => {
    const toCatch = mixLimb(HANG_ARM, { to: catchAt, depth: REACH_DEPTH }, raise)
    const toBelt = mixLimb(toCatch, { to: beltAt, depth: 3 }, tie)
    return mixLimb(toBelt, HANG_ARM, release)
  }
  const rightArm = handFor([X0 + 4.8, waist - 5.5], [X0 + 4, waist - 1.5])
  const leftArm = handFor([X0 + 17.2, waist - 5.5], [X0 + 12.5, waist + 1])

  // 鳥: とんでくる → うかんで 玉を おとす → さっていく
  const comeIn = span(t, FLY_IN, HOVER, easeOut)
  const leave = span(t, LAND, LAND + 1.6, easeIn)
  const birdX = BIRD_X + (1 - comeIn) * 85 - leave * 100
  const birdY = BIRD_Y + (1 - comeIn) * 9 - leave * 4 + wave(t, 0.5) * 0.7
  const birdVisible = t >= FLY_IN && birdX > -20

  // 玉の ばしょ(ひもの 上はし)
  const fall = span(t, DROP, LAND, easeIn)
  const carried: Pt = [birdX - 8.6, birdY - 1.4]
  const place: Pt = t < DROP ? carried : t < LAND ? [held[0], carried[1] + (held[1] - carried[1]) * fall] : lerpPt([held[0], held[1] + dip], hang, tie)
  const settle = span(t, LAND, LAND + 0.3)
  const swingAmp = (22 - 10 * span(t, FREE, INK)) * span(t, TIE0 + 0.7, FREE + 0.2)
  const rot =
    t < DROP
      ? wave(t, 0.6) * mix(t, FLY_IN, HOVER, 12, 4)
      : t < LAND
        ? -8 * fall
        : -8 * (1 - settle) + wave(t, 0.9) * 3 * settle * (1 - tie) + wave(t, 1.5) * swingAmp
  const tassel = wave(t, 1.5, -0.25) * (4 + swingAmp * 0.5)
  const jadeAt: Pt = [place[0] + dx, place[1] + dy + JADE_DROP]
  const pendantOpacity = span(t, FLY_IN - 0.1, FLY_IN + 0.1)

  // こしの ひも: どうの 上、うでの 下(Person の held)
  const belt = (
    <>
      <rect x={X0 - 8.5} y={waist - 2.4} width="17" height="3.4" rx="1.2" fill={BELT} />
      <rect x={X0 - 1.5} y={waist - 2} width="3" height="2.6" rx="0.8" fill={JADE} />
    </>
  )

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Layer x={dx} y={0} scale={Math.max(pop, 0.001)} origin={[X0, FEET_Y]}>
          <Person {...base} look={KID_LOOK} face={FACES[mood]} gazeY={mood === 'surprised' ? -1 : mood === 'focus' ? 0.9 : 0} lift={hop} pose={{ leftArm, rightArm }} held={belt} />
        </Layer>
        <Layer opacity={pendantOpacity} x={place[0] + dx} y={place[1] + dy} rotate={rot}>
          <Pendant tassel={tassel} />
        </Layer>
        {birdVisible && <Bird x={birdX} y={birdY} t={t} flying facing="left" size={1.2} color={BIRD} dark={BIRD_DARK} />}
        <Glints t={t} at={jadeAt} from={FLY_IN + 0.3} to={DROP} />
        <Glints t={t} at={jadeAt} from={LAND} to={LAND + 1.6} />
        <Glints t={t} at={jadeAt} from={FREE + 0.3} to={INK} />
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
    { at: 0, label: '子どもが ひとり たっている', sound: 'pop' },
    { at: FLY_IN, label: '黄色い 玉を くわえた 鳥が とんでくる' },
    { at: DROP, label: '鳥が 玉を おとす', sound: 'pop' },
    { at: LAND, label: '子どもが うけとって 大よろこび' },
    { at: TIE0, label: 'こしの ひもに 玉を ゆわえる' },
    { at: FREE, label: '玉が ゆらゆら ゆれる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '黄 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
