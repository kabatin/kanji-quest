/*
 * 同(おなじ): ふとさが ぴったり おなじ つつ に、カバーが ぴたっと かさなる。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)   … カバー(上から かぶせる つつ)の 左の かべ
 *   2画目(𠃍)   … カバーの てっぺん と 右の かべ
 *   3画目(一)   … ぴったり の つつ の もちて(ひもの よこぼう)
 *   4〜6画目(口) … ぴったり の つつ の「のぞき まど」(まわりの わく)
 *
 * ながれ
 *   女の子が ひもを もって やってくる(ひもを ひくと カバーが あがり、はなすと おりる)
 *   → ほそい つつ に カバーを おろす → すかすか(がたがた)。女の子は「あれ?」
 *   → ふとい つつ に かえる → カバーが つつの上に ごつん と のって おりない。女の子は びっくり、しょんぼり
 *   → ちょうど いい ふとさの つつ に かえて おろす → ぴたっ! 女の子は 大よろこび(ばんざい)
 *   → ほね が ひかって、絵が うすくなり、字「同」が のこる
 *
 * 女の子は Person(共通部品)。あるきは walk、正面へ むくのは turnAround、
 * ひもを にぎる・ばんざい は 手の 点({ to })と mixLimb で 作る。背景は Backdrop。
 * カバーは すきとおった 上から かぶさる つつ。
 *   カバーは すきとおった オレンジ色にして、中の つつ が見えるようにした(すきま が わかるように)。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, CLOTHES, LOOKS, mixLimb, Person, turnAround, walk, type Expression, type Limb } from '../sceneFigures'

const CHAR = '同'

const SLEEVE = '#ef8a4c'
const SLEEVE_DARK = '#d36d34'
const SLEEVE_LIGHT = '#ffb98a'
const SLEEVE_GLASS = '#ffc9a0'
const ROPE = '#a9825a'
const BARK = '#8c5b3c'
const WINDOW_RIM = '#f6f0dc'
const WINDOW_DARK = '#34506b'
const ALERT = '#ff6b6b'

/** くぎり の時間(秒) */
const LAND_THIN = 2.0
const LAND_FAT = 4.35
const LAND_FIT = 7.3
const CHEER = 7.4
const INK = 8.0
const DONE = 10.8
const DURATION = 11.4

/** カバーの かたち(1・2画目の位置)。かべ の まんなか の線 */
const WALL_L = 22.4
const WALL_R = 88.4
const TOP_Y = 16.6
const FLOOR = 95.4
const WALL_W = 6
/** カバーの まんなか(つつは ここに ならぶ) */
const MID_X = (WALL_L + WALL_R) / 2
/** カバーの 中の よこはば(かべの うちがわ どうし) */
const INNER_L = WALL_L + WALL_W / 2
const INNER_R = WALL_R - WALL_W / 2
/** カバーを 上げきった ときの もちあげ(わく の外へ きえる) */
const UP = 100
/** ふとい つつ の上に カバーが のって とまる もちあげ(つつの たかさ) */
const FAT_STOP = 43.2

/** カバーの うごき: おろす・あげる の くり返し。[はじまり, おわり, はじめの高さ, おわりの高さ, かんきゅう] */
type Move = readonly [from: number, to: number, a: number, b: number, ease: (x: number) => number]
const SLEEVE_MOVES: readonly Move[] = [
  [1.1, 2.0, UP, 0, easeIn],
  [2.5, 3.1, 0, UP, easeInOut],
  [3.75, LAND_FAT, UP, FAT_STOP, easeIn],
  [5.2, 5.8, FAT_STOP, UP, easeInOut],
  [6.5, LAND_FIT, UP, 0, easeInOut],
]

/** おちて ぶつかった ときの はねかえり(うえへ ぽん と はねて おさまる) */
function bounce(t: number, landAt: number, height: number): number {
  const u = t - landAt
  if (u <= 0 || u >= 0.4) return 0
  return Math.abs(Math.sin((u * Math.PI) / 0.2)) * height * (1 - u / 0.4)
}

function sleeveLift(t: number): number {
  const base = SLEEVE_MOVES.reduce((value, [from, to, a, b, ease]) => (t >= from ? mix(t, from, to, a, b, ease) : value), UP)
  return Math.min(UP, base + bounce(t, LAND_THIN, 4) + bounce(t, LAND_FAT, 5))
}

/* ───────── つつ ───────── */

type PipeSpec = {
  readonly x0: number
  readonly x1: number
  readonly top: number
  readonly body: string
  readonly light: string
}

/** ほそい つつ(すかすか)・ふとい つつ(はいらない)・ちょうど いい つつ(ぴったり) */
const THIN: PipeSpec = { x0: 41.2, x1: 69.2, top: 36, body: '#ffd24a', light: '#ffe58a' }
const FAT: PipeSpec = { x0: 20.4, x1: 90.4, top: 52, body: '#a58be8', light: '#c6b5f5' }
const FIT: PipeSpec = { x0: INNER_L + 1, x1: INNER_R - 1, top: 21, body: '#7ed08a', light: '#a8e6b0' }

const PIPE_BOTTOM = 95.2

/** つつ 1本。もちて(一)と のぞき まど(口)が ついている。 */
function Pipe({ spec }: { readonly spec: PipeSpec }) {
  const { x0, x1, top, body, light } = spec
  const w = x1 - x0
  const cx = (x0 + x1) / 2
  const handleHalf = w * 0.31
  const winHalf = w * 0.27
  // ひくい つつ(ふとい つつ)は、もちて・まど を 上に よせる
  const squat = PIPE_BOTTOM - top < 60
  const winTop = top + (squat ? 12 : 26)
  const handleY = top + (squat ? 4 : 10.4)
  return (
    <>
      <rect x={x0} y={top} width={w} height={PIPE_BOTTOM - top} rx="4" fill={body} />
      <rect x={x0 + 2.6} y={top + 3} width="3.2" height={PIPE_BOTTOM - top - 9} rx="1.6" fill={light} />
      {/* もちて(3画目): ひもを とおす よこぼう */}
      <rect x={cx - handleHalf} y={handleY} width={handleHalf * 2} height="3.2" rx="1.6" fill={BARK} />
      {/* のぞき まど(4〜6画目): わく と くらい 中 */}
      <rect x={cx - winHalf} y={winTop} width={winHalf * 2} height="23" rx="2.2" fill={WINDOW_RIM} />
      <rect x={cx - winHalf + 2.2} y={winTop + 2.2} width={Math.max(winHalf * 2 - 4.4, 1)} height="18.6" rx="1.2" fill={WINDOW_DARK} />
      <path d={`M${cx - winHalf + 3.8} ${winTop + 5.2} l${Math.min(winHalf, 4)} 0`} stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    </>
  )
}

/** つつ が ぽん と でて、ぽん と きえる(あしもとを じく に) */
function PipeSlot({ t, spec, from, until }: { readonly t: number; readonly spec: PipeSpec; readonly from: number; readonly until: number }) {
  const pop = span(t, from, from + 0.5, backOut) * (1 - span(t, until, until + 0.3, easeIn))
  if (pop <= 0) return null
  return (
    <Layer scale={pop} origin={[MID_X, PIPE_BOTTOM]}>
      <ellipse cx={MID_X} cy="97.4" rx={(spec.x1 - spec.x0) / 2 + 3} ry="2.4" fill="#000000" opacity="0.1" />
      <Pipe spec={spec} />
    </Layer>
  )
}

/* ───────── カバー ───────── */

/** すきとおった カバー。上は ふさがり、したは ひらいている。ひもを むすぶ わっか つき。 */
function Sleeve({ lift, squash }: { readonly lift: number; readonly squash: number }) {
  const r = 6
  const outline = `M${WALL_L} ${FLOOR} V${TOP_Y + r} Q${WALL_L} ${TOP_Y} ${WALL_L + r} ${TOP_Y} H${WALL_R - r} Q${WALL_R} ${TOP_Y} ${WALL_R} ${TOP_Y + r} V${FLOOR}`
  return (
    <Layer y={-lift}>
      <Layer scaleY={squash} origin={[MID_X, FLOOR]}>
        <path d={`${outline} Z`} fill={SLEEVE_GLASS} fillOpacity="0.28" />
        <path d={outline} fill="none" stroke={SLEEVE} strokeWidth={WALL_W} strokeLinejoin="round" />
        <path d={`M${WALL_L + 1.6} ${FLOOR - 6} V${TOP_Y + r + 1} Q${WALL_L + 1.6} ${TOP_Y + 1.6} ${WALL_L + r + 1} ${TOP_Y + 1.6} H${WALL_R - r - 2}`} fill="none" stroke={SLEEVE_LIGHT} strokeWidth="1.4" strokeLinecap="round" />
        <rect x={WALL_L - 3.6} y={FLOOR - 3} width="7.2" height="3" rx="1.2" fill={SLEEVE_DARK} />
        <rect x={WALL_R - 3.6} y={FLOOR - 3} width="7.2" height="3" rx="1.2" fill={SLEEVE_DARK} />
        <ellipse cx={MID_X} cy={TOP_Y - 3.2} rx="3.4" ry="2.4" fill={SLEEVE_DARK} />
        {/* ひも: カバーの わっか から 上へ(わく の外の かっしゃ を とおって 女の子の手へ) */}
        <path d={`M${MID_X} ${TOP_Y - 5} V-140`} stroke={ROPE} strokeWidth="1.2" fill="none" />
      </Layer>
    </Layer>
  )
}

/* ───────── 女の子 ───────── */

type Mood = 'smile' | 'puzzled' | 'shock' | 'sad' | 'joy'

/** 女の子の まんなか(こし) と 地面、せたけ(子ども) */
const KID_X = 99
const KID_Y = 96
const KID_HEIGHT = 44
/** 女の子が ひもを にぎる 手の よこの ずれ(ひもを はさんで 両手) */
const GRIP_GAP = 0.9
/** あるいてきて 正面を むく 時間 */
const ARRIVE = 0.95

const FACES: Readonly<Record<Mood, Expression>> = { smile: 'smile', puzzled: 'worried', shock: 'surprised', sad: 'sad', joy: 'joy' }
const HANG: Limb = { swing: 3, bend: 8 }
const BANZAI: Limb = { swing: 155, bend: 15 }

/* ───────── こまかい にぎやかし ───────── */

/** ほそい つつ の すきま を しらせる あかい おび と、がたがた の ゆれ */
function Gaps({ t }: SceneProps) {
  const show = during(t, LAND_THIN + 0.1, 3.0, 0.15) * (0.65 + 0.35 * wave(t, 0.4))
  if (show <= 0) return null
  return (
    <g fill={ALERT} opacity={show * 0.4}>
      <rect x={INNER_L} y={TOP_Y + 3} width={THIN.x0 - INNER_L} height={FLOOR - TOP_Y - 3} />
      <rect x={THIN.x1} y={TOP_Y + 3} width={INNER_R - THIN.x1} height={FLOOR - TOP_Y - 3} />
    </g>
  )
}

/** ごつん: カバーの かべ が ふとい つつ の上に あたって、ほしが とぶ。 */
function Bonk({ t }: SceneProps) {
  const p = span(t, LAND_FAT, LAND_FAT + 0.6, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p}>
      <Star cx={WALL_L - 4 - p * 7} cy={FAT.top - 4 - p * 4} r={3.4} color="#ffc233" spin={p * 160} />
      <Star cx={WALL_R + 4 + p * 4} cy={FAT.top - 4 - p * 5} r={3} color="#ffd95a" spin={-p * 160} />
      <Star cx={MID_X} cy={FAT.top - 3 - p * 6} r={2.4} color="#ffffff" spin={p * 120} />
    </g>
  )
}

/** ぴたっ: ちょうど いい つつ に かぶさった しゅんかん の ひかり。 */
function Snug({ t }: SceneProps) {
  const show = during(t, LAND_FIT, LAND_FIT + 0.9, 0.12)
  if (show <= 0) return null
  const p = span(t, LAND_FIT, LAND_FIT + 0.9, easeOut)
  return (
    <g opacity={show}>
      <rect x={FIT.x0 - 0.8} y={FIT.top - 0.8} width={FIT.x1 - FIT.x0 + 1.6} height={PIPE_BOTTOM - FIT.top + 0.8} rx="4.4" fill="none" stroke="#fff6a8" strokeWidth="1.6" />
      <Star cx={INNER_L - 1 - p * 3} cy={36 - p * 6} r={3.2 * (1 - p * 0.3)} color="#ffc233" spin={p * 140} />
      <Star cx={INNER_R + 1 + p * 3} cy={36 - p * 6} r={3.2 * (1 - p * 0.3)} color="#ffd95a" spin={-p * 140} />
      <Star cx={MID_X} cy={TOP_Y - 3 - p * 6} r={2.6} color="#ffffff" spin={p * 100} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  const lift = sleeveLift(t)
  // おちて ぶつかる しゅんかん、少し ちぢむ
  const squash = 1 - Math.sin(span(t, LAND_FIT, LAND_FIT + 0.3) * Math.PI) * 0.012
  const rattle = wave(t, 0.16) * 3 * during(t, LAND_THIN + 0.05, 2.9, 0.1)
  const bonkShake = wave(t, 0.08) * 0.8 * during(t, LAND_FAT, LAND_FAT + 0.5, 0.05)

  const mood: Mood = t >= CHEER ? 'joy' : t >= 6.3 ? 'smile' : t >= 4.8 ? 'sad' : t >= LAND_FAT ? 'shock' : t >= 3.3 ? 'smile' : t >= LAND_THIN ? 'puzzled' : 'smile'

  // ひもを にぎる 高さ: カバーが あがるほど 手は 下がる
  const holdY = 64 + 8 * (lift / UP)
  const grip = span(t, ARRIVE + 0.25, ARRIVE + 0.55)
  const cheer = span(t, CHEER, CHEER + 0.45, backOut)
  // 右手 = 画面の 左(正面)。ひもを にぎる → ばんざい
  const rightArm = mixLimb(mixLimb(HANG, { to: [KID_X - GRIP_GAP, holdY] }, grip), BANZAI, cheer)
  const leftArm = mixLimb(mixLimb(HANG, { to: [KID_X + GRIP_GAP, holdY] }, grip), BANZAI, cheer)
  const walking = walk(t, { from: KID_X + 27, to: KID_X, start: 0.15, end: ARRIVE, build: 'child', height: KID_HEIGHT })
  const turn = turnAround(t, ARRIVE, 'left', 'front')
  const arrived = t >= ARRIVE + 0.3
  const hop = t >= CHEER ? Math.abs(wave(t - CHEER, 0.7)) * 1.8 : 0
  const head = mood === 'puzzled' ? 8 : mood === 'sad' ? -7 : mood === 'joy' ? 3 * wave(t, 0.7) : 0
  const ropeEnd = holdY + cheer * 20

  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} clouds={[[-2, 9, 1], [96, 8, 0.85]]} />
        <Layer rotate={rattle} origin={[MID_X, PIPE_BOTTOM]}>
          <PipeSlot t={t} spec={THIN} from={0.5} until={3.05} />
        </Layer>
        <PipeSlot t={t} spec={FAT} from={3.35} until={5.75} />
        <PipeSlot t={t} spec={FIT} from={6.05} until={99} />
        <Gaps t={t} />
        <Layer x={bonkShake}>
          <Sleeve lift={lift} squash={squash} />
        </Layer>
        <Snug t={t} />
        <Bonk t={t} />
        {/* 女の子の ひも(わく の外の かっしゃ から おりてくる) */}
        <path d={`M${KID_X} -140 V${ropeEnd}`} stroke={ROPE} strokeWidth="1.2" fill="none" />
        <Person
          {...walking}
          {...turn}
          y={KID_Y}
          look={{ ...LOOKS.girl, hairStyle: 'pigtails', top: CLOTHES.pink.top }}
          face={FACES[mood]}
          lift={hop}
          pose={arrived ? { rightArm, leftArm, head } : walking.pose}
        />
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
    { at: 0, label: '女の子が ひもを もちに くる', sound: 'pop' },
    { at: 1.1, label: 'ほそい つつ に カバーを おろす' },
    { at: LAND_THIN, label: 'すかすか。ぴったり じゃなくて「あれ?」' },
    { at: 3.75, label: 'ふとい つつ に かえて おろす', sound: 'pop' },
    { at: LAND_FAT, label: 'ごつん! はいらなくて しょんぼり' },
    { at: 6.5, label: 'ちょうど いい ふとさの つつ に おろす' },
    { at: LAND_FIT, label: 'ぴたっ! 大よろこび', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '同 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
