/*
 * 秋(あき): みのった いねを むしが たべにきたので、子どもが 火を たいて おいはらう。(共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)
 *   禾(いね)
 *   1画目(ノ)  … みのって おもくなり、たれさがった いねの ほ(つぶが ぎっしり)
 *   2画目(一)  … くき の ふし から よこに のびた 葉
 *   3画目(丨)  … いねの くき
 *   4画目(ノ)  … 左へ たれた 長い 葉
 *   5画目(丶)  … 右へ のびた 小さい 葉
 *   火(ひ)
 *   6画目(丶)  … 左へ とんだ ひのこ
 *   7画目(丶)  … 右へ とんだ ひのこ
 *   8画目(ノ)  … たかく もえあがる ほのお(下の ほうは、左へ もたせた たきぎ)
 *   9画目(㇏)  … 右へ もたせた たきぎ
 *
 * ながれ
 *   いねが そだって、ほが きんいろに みのる → 子どもが たいまつを もって みにくる(にこにこ)
 *   → むしが とんできて ほに とまり、たべはじめる。子どもは びっくり(しんぱい)
 *   → たいまつで たきぎに 火を つける。ほのおが あがり、ひのこが 左右へ とぶ
 *   → けむりが ほの ほうへ ながれて、むしは にげていく。子どもは ばんざい
 *   → ほね が ひかって、絵が うすくなり、字「秋」が のこる
 *
 * 子どもは Person(左むき)。あるきは walk()。たいまつは tools(ぼう)で 手に にぎらせ、火は Flame を さきに のせる。
 * ひのこ と むし は 場面で 描く(むしの 部品は まだ ない)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Flame, HANG_ARM, Hills, LOOKS, Meadow, mixColor, mixLimb, Person, personRig, Sun, Sweat, walk } from '../sceneFigures'
import type { Expression } from '../sceneFigures'

const CHAR = '秋'

const STEM = '#7fbe4a'
const LEAF = '#6fb445'
const EAR_GREEN = '#a9cf55'
const EAR_GOLD = '#f2c230'
const GRAIN_GREEN = '#c3dd6e'
const GRAIN_GOLD = '#ffd45a'
const WOOD = '#8c5b3c'
const WOOD_CUT = '#d8b184'
const FLAME_OUT = '#ff7a3d'
const FLAME_MID = '#ffa53a'
const FLAME_IN = '#ffd24a'
const BUG = '#6b3a2a'
const BUG_LIGHT = '#9a5a40'
const STRAW = '#d9b84a'
const TUNIC = '#e9863d'

/** くぎり の時間(秒) */
const RIPE_FROM = 0.8
const RIPE_TO = 2.0
/** 子どもが あるいてきて、立ちどまる */
const ENTER = 1.6
const STAND = 2.9
/** 3ひきの むしが とんでくる時間 と、にげはじめる時間 */
const ARRIVE = [3.0, 3.25, 3.5] as const
const FLEE = [5.4, 5.52, 5.64] as const
const FLY_TIME = 0.8
const ESCAPE_TIME = 1.0
/** 子どもの きもち: しんぱい → きっと → よろこぶ */
const WORRY = 3.3
const GRIT = 4.0
const CHEER = 5.5
/** たいまつを たきぎに ちかづける・つける */
const REACH_FROM = 3.9
const TOUCH = 4.5
const REACH_BACK = 5.15
const GROW = 4.85
const SMOKE = 5.2
const EMBER = 5.2
const INK = 6.5
const DONE = 9.7
const DURATION = 10.4

type Pt = readonly [number, number]

/** 子どもの 立つ x・足もと・背の高さ・はじめの いち(わく の 外) */
const CHILD_X = 98
const GROUND_Y = 97
const KID_HEIGHT = 48
const KID_FROM = 142
const KID_LOOK = { ...LOOKS.boy, top: TUNIC } as const
/** たいまつ: もちはこぶ とき(手・さき)と、たきぎに つける とき(手・さき)。長さ は みじかい */
const CARRY: { readonly hand: Pt; readonly tip: Pt } = { hand: [89, 64], tip: [85.5, 54] }
const LIGHT: { readonly hand: Pt; readonly tip: Pt } = { hand: [86, 67.5], tip: [77, 71] }
const TORCH_LEN = 11

/** 1画目(ほ)の 通り道。つぶを ならべるのに使う */
const EAR_POINTS: readonly Pt[] = [
  [39.6, 15.4], [37.3, 18.9], [33.8, 21.6], [30.2, 24], [26.4, 26.2], [22.5, 28.3], [18.5, 30.1], [14.5, 31.8],
]
/** むしが とまる ほの上の場所(ほの すこし上。ほは 左へ さがっている) */
const LANDING: readonly Pt[] = [[36.5, 14.8], [27.5, 20.7], [17.8, 25.9]]
/** ほの かたむき(左へ さがる) */
const EAR_SLOPE = -28
/** むしが にげていく わく の外 */
const EXITS: readonly Pt[] = [[-14, -4], [-14, 12], [-6, -14]]
/** 2つの ひのこ の おちつく場所(6画目・7画目の まんなか)と かたむき */
const EMBER_LEFT = { x: 53.7, y: 47.8, tilt: -21 }
const EMBER_RIGHT = { x: 81.8, y: 44.4, tilt: 31 }

/* ───────── 景色 ───────── */

/** かれはじめた 小さな いね の たば(地面の かざり) */
function Straw() {
  return (
    <>
      {[6, 16, 22].map((x, i) => (
        <g key={x} fill="none" stroke={STRAW} strokeWidth="1.1" strokeLinecap="round">
          <path d={`M${x} 97.5 q-1.6 -4 -3.6 -7.4 M${x} 97.5 q0.2 -4.6 0.4 -8.4 M${x} 97.5 q1.6 -4 3.4 -6.4`} />
          <circle cx={x - 3.6} cy={90 - i * 0.3} r="0.9" fill={STRAW} stroke="none" />
          <circle cx={x + 0.4} cy={88.8 - i * 0.3} r="0.9" fill={STRAW} stroke="none" />
        </g>
      ))}
    </>
  )
}

/** ひらひら おちる 秋の葉(2まい) */
function FallingLeaves({ t }: SceneProps) {
  const leaves = [
    { start: 0.2, x: 70, color: '#e0573a' },
    { start: 0.62, x: 100, color: '#f09a3a' },
  ]
  return (
    <>
      {leaves.map(({ start, x, color }) => {
        const p = (((t * 0.1 + start) % 1) + 1) % 1
        return <path key={x} d="M0 -3 Q2.6 0 0 3 Q-2.6 0 0 -3 Z" fill={color} transform={`translate(${x + Math.sin(p * 14) * 5} ${-4 + p * 108}) rotate(${Math.sin(p * 14) * 55})`} />
      })}
    </>
  )
}

/* ───────── いね ───────── */

/** いねの ほ。つぶが ぎっしり ならぶ。みのると きんいろに なって、おもくて たれる */
function Ear({ ripe }: { readonly ripe: number }) {
  const body = mixColor(EAR_GREEN, EAR_GOLD, ripe)
  const grain = mixColor(GRAIN_GREEN, GRAIN_GOLD, ripe)
  return (
    <>
      <Bone char={CHAR} n={1} color={body} width={4.6} />
      {EAR_POINTS.slice(1).map(([x, y], i) => {
        const [px, py] = EAR_POINTS[i]
        const angle = (Math.atan2(y - py, x - px) * 180) / Math.PI
        const len = Math.hypot(x - px, y - py)
        const nx = -(y - py) / len
        const ny = (x - px) / len
        return [1, -1].map((side) => (
          <ellipse key={`${i}-${side}`} cx={x + nx * 1.7 * side} cy={y + ny * 1.7 * side} rx="2.3" ry="1.25" fill={grain} transform={`rotate(${angle} ${x + nx * 1.7 * side} ${y + ny * 1.7 * side})`} />
        ))
      })}
    </>
  )
}

function Rice({ t }: SceneProps) {
  const stem = span(t, 0, 0.7, backOut)
  const leaves = span(t, 0.4, 1.0, backOut)
  const earGrow = span(t, 0.7, 1.3, backOut)
  const ripe = span(t, RIPE_FROM, RIPE_TO, easeInOut)
  // はじめは ほが 上を むいて、みのるほど おもくなって たれる
  const droop = 28 * (1 - span(t, RIPE_FROM + 0.3, RIPE_TO + 0.2, easeInOut))
  // 字になる ちょくぜんには ゆれを とめて、ほね と そろえる
  const calm = 1 - span(t, INK - 1.2, INK - 0.4)
  const sway = wave(t, 3.2) * 0.9 * calm
  return (
    <Layer rotate={sway} origin={[30, 96]}>
      <ellipse cx="30.5" cy="96.8" rx={8 * stem} ry="2" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.6 + 0.4 * stem} scaleY={stem} origin={[30, 96]}>
        <Bone char={CHAR} n={3} color={STEM} width={3.6} />
      </Layer>
      <Layer scale={leaves} origin={[30, 45]}>
        <Bone char={CHAR} n={2} color={LEAF} width={2.8} />
        <Bone char={CHAR} n={4} color={LEAF} width={2.8} />
        <Bone char={CHAR} n={5} color={LEAF} width={2.6} />
      </Layer>
      <Layer scale={earGrow} rotate={droop} origin={[31, 25]}>
        <Ear ripe={ripe} />
      </Layer>
    </Layer>
  )
}

/** みのった ほの きらり(みのったとき・むしが いなくなったとき) */
function Glint({ t }: SceneProps) {
  const show = Math.max(during(t, 1.9, 2.8, 0.3), during(t, 6.0, 6.5, 0.2))
  if (show <= 0) return null
  return (
    <Layer opacity={show} rotate={t * 60} origin={[24, 20]}>
      <Star cx={24} cy={20} r={3.4} color="#ffffff" />
    </Layer>
  )
}

/* ───────── たきぎ・火・けむり ───────── */

/** たきぎ: 2本の 木を もたれさせた つみかた。上の はし が ほのおの そこ */
function Logs() {
  return (
    <>
      <Bone char={CHAR} n={8} color={WOOD} width={6} from={0.6} />
      <Bone char={CHAR} n={9} color={WOOD} width={6} to={0.8} />
      <ellipse cx="42.2" cy="91" rx="2.4" ry="3.1" fill={WOOD_CUT} transform="rotate(35 42.2 91)" />
      <ellipse cx="89" cy="85.4" rx="2.4" ry="3.1" fill={WOOD_CUT} transform="rotate(-45 89 85.4)" />
    </>
  )
}

/** 大きな ほのお(8画目)。下が ひろく、上が とがる。ぼんやり あたりを てらす */
function BigFire({ t }: SceneProps) {
  const grow = span(t, GROW, GROW + 0.7, backOut)
  if (grow <= 0) return null
  return (
    <>
      <circle cx="66.5" cy="42" r={26 * grow} fill="#ffd27a" opacity="0.13" />
      <Flame t={t} x={66.5} y={61} size={2.6 * grow} glow={false} />
    </>
  )
}

/** たいまつが ふれた ところの 小さな 火。ほのおが あがると きえる */
function FirstSpark({ t }: SceneProps) {
  const show = span(t, TOUCH, TOUCH + 0.3, easeOut) * (1 - span(t, GROW + 0.2, GROW + 0.7))
  if (show <= 0) return null
  return <Flame t={t} x={77} y={72} size={0.6 * show} glow={false} />
}

/** 火の なかから とびだして、左右に おちつく ひのこ(6画目・7画目) */
function Embers({ t }: SceneProps) {
  const calm = 1 - span(t, INK - 1.2, INK - 0.4)
  const one = (goal: { x: number; y: number; tilt: number }, delay: number, side: number) => {
    const p = span(t, EMBER + delay, EMBER + delay + 0.7, easeOut)
    if (p <= 0) return null
    const x = 66.5 + (goal.x - 66.5) * p
    const y = 50 + (goal.y - 50) * p - Math.sin(p * Math.PI) * 9
    const bob = wave(t, 1.1, side) * 0.9 * calm * (p >= 1 ? 1 : 0)
    return (
      <g key={side} transform={`translate(${x} ${y + bob})`}>
        <circle r="5.2" fill={FLAME_MID} opacity="0.22" />
        <ellipse rx="2" ry="5" fill={FLAME_OUT} transform={`rotate(${goal.tilt})`} />
        <ellipse rx="1" ry="3" fill={FLAME_IN} transform={`rotate(${goal.tilt})`} />
      </g>
    )
  }
  return (
    <>
      {one(EMBER_LEFT, 0, 0)}
      {one(EMBER_RIGHT, 0.12, 1)}
    </>
  )
}

/** けむり。ほのおの上から ほの ほうへ ながれて、むしを おいはらう */
function Smoke({ t }: SceneProps) {
  return (
    <>
      {[0, 1, 2].map((i) => {
        const start = SMOKE + i * 0.7
        if (t < start) return null
        const p = ((t - start) % 2.1) / 2.1
        return <circle key={i} cx={64 - p * 40} cy={18 - p * 6} r={3.6 + p * 4.8} fill="#b4bbc4" opacity={Math.sin(p * Math.PI) * 0.55 * (1 - span(t, INK - 0.4, INK + 0.3))} />
      })}
    </>
  )
}

/* ───────── 子ども ───────── */

function faceAt(t: number): Expression {
  if (t < WORRY) return 'smile'
  if (t < GRIT) return 'worried'
  return t < CHEER ? 'strain' : 'joy'
}

/** 主役の 子ども(左むき)。たいまつを もって いねを みにきて、むしを おいはらう */
function Child({ t }: SceneProps) {
  const come = walk(t, { from: KID_FROM, to: CHILD_X, start: ENTER, end: STAND, height: KID_HEIGHT })
  const dx = come.x - CHILD_X
  // ばんざいの とき すこし はねる
  const hop = t >= CHEER && t < CHEER + 1 ? Math.abs(Math.sin((t - CHEER) * Math.PI * 2.2)) * 2 : 0
  // たいまつを たきぎへ のばす → もどす
  const reach = span(t, REACH_FROM, TOUCH, easeInOut) - span(t, REACH_BACK, REACH_BACK + 0.55, easeInOut)
  const at = (a: Pt, b: Pt): Pt => [mix(reach, 0, 1, a[0], b[0]) + dx, mix(reach, 0, 1, a[1], b[1])]
  const hand = at(CARRY.hand, LIGHT.hand)
  const tipWant = at(CARRY.tip, LIGHT.tip)
  // むこうの うで(左うで): あるくときは ふり、さいごは ばんざい
  const up = span(t, CHEER, CHEER + 0.45, easeOut)
  const far = mixLimb(come.pose.leftArm ?? HANG_ARM, { swing: 150, bend: 25 }, up)
  const worry = t >= WORRY && t < GRIT
  const props = { ...come, y: GROUND_Y, lift: hop, pose: { ...come.pose, rightArm: { to: hand }, leftArm: far, head: worry ? 4 : 0 } }
  const realHand = personRig(props).world.arms.right.end
  const tip: Pt = [realHand[0] + tipWant[0] - hand[0], realHand[1] + tipWant[1] - hand[1]]
  const head = personRig(props).world.head
  return (
    <>
      <Person {...props} look={KID_LOOK} face={faceAt(t)} tools={{ right: { kind: 'stick', tip, length: TORCH_LEN } }} />
      <Flame t={t} x={tip[0]} y={tip[1] + 0.8} size={0.42} glow={false} />
      <Sweat t={t} x={head[0] + 5} y={head[1] - 4} show={during(t, WORRY, GRIT + 0.2, 0.2)} dir={1} />
    </>
  )
}

/* ───────── むし ───────── */

/** むし。右むきに かく(あたまが +x)。とんでいる間だけ はねが ひらく */
function Pest({ flying, flap }: { readonly flying: boolean; readonly flap: number }) {
  return (
    <g>
      {flying ? (
        <g opacity="0.8">
          <Layer rotate={-30 + flap} origin={[-0.4, -1.6]}>
            <ellipse cx="-1.6" cy="-3.4" rx="3.4" ry="1.2" fill="#e8f1f7" stroke="#b9c8d4" strokeWidth="0.4" />
          </Layer>
        </g>
      ) : null}
      <path d="M-1.4 1.4 l-1.6 2.2 M0.4 1.8 l0 2.4 M2 1.4 l1.6 2.2" fill="none" stroke={BUG} strokeWidth="0.7" strokeLinecap="round" />
      <path d="M4.2 -1.2 q1.6 -2 3.4 -1.8 M4 -0.4 q2 -0.8 3.4 0.2" fill="none" stroke={BUG} strokeWidth="0.5" strokeLinecap="round" />
      <ellipse cx="0" cy="0" rx="3.6" ry="2.5" fill={BUG} />
      <ellipse cx="-0.6" cy="-0.9" rx="2.2" ry="0.9" fill={BUG_LIGHT} />
      <circle cx="3.6" cy="-0.2" r="1.8" fill={BUG_LIGHT} />
      <circle cx="4.1" cy="-0.7" r="0.55" fill="#ffffff" />
    </g>
  )
}

/** ほに とまる むし: 左から とんできて、ほを たべ、けむりで にげていく */
function Bugs({ t }: SceneProps) {
  return (
    <>
      {LANDING.map(([lx, ly], i) => {
        const arrive = span(t, ARRIVE[i], ARRIVE[i] + FLY_TIME, easeOut)
        if (arrive <= 0) return null
        const flee = span(t, FLEE[i], FLEE[i] + ESCAPE_TIME, easeInOut)
        const [ex, ey] = EXITS[i]
        const fleeing = t >= FLEE[i]
        const flying = arrive < 1 || fleeing
        const flap = wave(t, 0.09, i * 0.03) * 35
        let x: number
        let y: number
        let tilt: number
        if (!fleeing) {
          x = -10 + (lx + 10) * arrive
          y = 2 + i * 8 + (ly - 2 - i * 8) * arrive - Math.sin(arrive * Math.PI) * 8
          tilt = EAR_SLOPE * span(t, ARRIVE[i] + FLY_TIME - 0.25, ARRIVE[i] + FLY_TIME)
        } else {
          const jump = Math.sin(span(t, FLEE[i], FLEE[i] + 0.25) * Math.PI) * 3
          x = lx + (ex - lx) * flee
          y = ly + (ey - ly) * flee - jump - Math.sin(flee * Math.PI) * 5 + wave(t, 0.15) * 0.5
          tilt = mix(t, FLEE[i], FLEE[i] + 0.3, EAR_SLOPE, 12)
        }
        // たべている間は、あたまを こくこく さげる
        const chew = !flying ? Math.abs(wave(t, 0.35, i * 0.1)) * 0.7 : 0
        return (
          <Layer key={i} x={x} y={y + chew} rotate={tilt} scaleX={fleeing ? -1 : 1}>
            <Pest flying={flying} flap={flap} />
          </Layer>
        )
      })}
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 9)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Sun t={t} x={99} y={11} r={5.4} />
        <Hills color="#f7e9bf" />
        <Meadow tufts={[]} color="#ead9a0" />
        <Straw />
        <FallingLeaves t={t} />
        <Rice t={t} />
        <Glint t={t} />
        <Layer opacity={span(t, 0.5, 0.9)}>
          <Logs />
        </Layer>
        <BigFire t={t} />
        <FirstSpark t={t} />
        <Embers t={t} />
        <Smoke t={t} />
        <Child t={t} />
        <Bugs t={t} />
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
    { at: 0, label: 'いねが そだつ', sound: 'pop' },
    { at: ENTER, label: 'ほが みのって、子どもが みにくる' },
    { at: ARRIVE[0], label: 'むしが とんできて、ほを たべる', sound: 'pop' },
    { at: TOUCH, label: 'たいまつで たきぎに 火を つける', sound: 'pop' },
    { at: FLEE[0], label: 'けむりで むしが にげる。ばんざい' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '秋 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
