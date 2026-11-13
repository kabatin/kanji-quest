/*
 * 秋(あき): みのった いねを むしが たべにきたので、子どもが 火を たいて おいはらう。
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
 * 人・いね・むし・火は、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる。むしは 体・あたま・足・はね・しょっかく。
 *   ほのおは 下が ひろく 上が とがり、ひのこ と けむりは 上へ のぼる。
 *   字の画に ぴったり重なるのは、火が もえて いねが みのった さいごの しゅんかん だけ。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '秋'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#e9863d'
const TUNIC_DARK = '#cf6f2c'
const TUNIC_FAR = '#b95f24'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
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
const FLAME_CORE = '#fff3b0'
const BUG = '#6b3a2a'
const BUG_LIGHT = '#9a5a40'
const SUN = '#ffd24a'
const GROUND = '#ead9a0'
const HILL = '#f7e9bf'
const STRAW = '#d9b84a'

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

/** 子どもの 足もと と、てまえ・むこうの かた */
const FEET: readonly [number, number] = [98, 97]
const SHOULDER_NEAR: readonly [number, number] = [96, 68]
const SHOULDER_FAR: readonly [number, number] = [99, 68]
const ARM_PART = 8
const NECK: readonly [number, number] = [97, 63]

/** 1画目(ほ)の 通り道。つぶを ならべるのに使う */
const EAR_POINTS: readonly (readonly [number, number])[] = [
  [39.6, 15.4], [37.3, 18.9], [33.8, 21.6], [30.2, 24], [26.4, 26.2], [22.5, 28.3], [18.5, 30.1], [14.5, 31.8],
]
/** むしが とまる ほの上の場所(ほの すこし上。ほは 左へ さがっている) */
const LANDING: readonly (readonly [number, number])[] = [[36.5, 14.8], [27.5, 20.7], [17.8, 25.9]]
/** ほの かたむき(左へ さがる) */
const EAR_SLOPE = -28
/** むしが にげていく わく の外 */
const EXITS: readonly (readonly [number, number])[] = [[-14, -4], [-14, 12], [-6, -14]]
/** 2つの ひのこ の おちつく場所(6画目・7画目の まんなか)と かたむき */
const EMBER_LEFT = { x: 53.7, y: 47.8, tilt: -21 }
const EMBER_RIGHT = { x: 81.8, y: 44.4, tilt: 31 }

const rad = (deg: number) => (deg * Math.PI) / 180

/** 2つの色(#rrggbb)を k の割合で まぜる */
function tint(from: string, to: string, k: number): string {
  const part = (s: string, i: number) => parseInt(s.slice(i, i + 2), 16)
  const channel = (i: number) =>
    Math.round(part(from, i) + (part(to, i) - part(from, i)) * k)
      .toString(16)
      .padStart(2, '0')
  return `#${channel(1)}${channel(3)}${channel(5)}`
}

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 12} origin={[99, 11]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="98.2" y="1.2" width="1.6" height="3.6" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 99 11)`} />
        ))}
      </Layer>
      <circle cx="99" cy="11" r={5.4 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 94 V101 H-4 Z" fill={HILL} />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GROUND} />
      {/* かれはじめた 小さな いね の たば */}
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
        return (
          <path
            key={x}
            d="M0 -3 Q2.6 0 0 3 Q-2.6 0 0 -3 Z"
            fill={color}
            transform={`translate(${x + Math.sin(p * 14) * 5} ${-4 + p * 108}) rotate(${Math.sin(p * 14) * 55})`}
          />
        )
      })}
    </>
  )
}

/** いねの ほ。つぶが ぎっしり ならぶ。みのると きんいろに なって、おもくて たれる */
function Ear({ ripe }: { readonly ripe: number }) {
  const body = tint(EAR_GREEN, EAR_GOLD, ripe)
  const grain = tint(GRAIN_GREEN, GRAIN_GOLD, ripe)
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

/** 大きな ほのお。下が ひろく、上が とがる。ゆらゆら ゆれる */
function Flame({ t }: SceneProps) {
  const grow = span(t, GROW, GROW + 0.7, backOut)
  if (grow <= 0) return null
  const flick = 1 + wave(t, 0.27) * 0.04
  const lean = wave(t, 0.6) * 1.4
  return (
    <>
      <circle cx="66.5" cy="42" r={26 * grow} fill="#ffd27a" opacity="0.13" />
      <Layer scaleX={grow} scaleY={grow * flick} rotate={lean} origin={[66.5, 61]}>
        <path d="M66.6 16.5 C69 26 77 36 76.4 48 C76 57 71 61 66.5 61 C61.5 61 57 57 57.2 49 C57.6 39 64 33 66.6 16.5 Z" fill={FLAME_OUT} />
        <path d="M66.7 26 C68.6 34 73.6 41 73.2 50 C72.8 57 70 60 66.5 60 C63 60 60.2 57 60.4 50.5 C60.7 42 65 37 66.7 26 Z" fill={FLAME_MID} />
        <path d="M66.8 37 C68.6 43 71.6 47 71.2 53 C70.8 58 69 59.6 66.6 59.6 C64.2 59.6 62.4 57.5 62.6 53 C62.8 47.5 65.6 44 66.8 37 Z" fill={FLAME_IN} />
        <path d="M66.8 47 C67.8 50 69.2 52 69 55 C68.8 58 68 59 66.6 59 C65.2 59 64.4 57.5 64.6 55 C64.8 52 66 50 66.8 47 Z" fill={FLAME_CORE} />
      </Layer>
    </>
  )
}

/** たいまつが ふれた ところの 小さな 火。ほのおが あがると きえる */
function FirstSpark({ t }: SceneProps) {
  const show = span(t, TOUCH, TOUCH + 0.3, easeOut) * (1 - span(t, GROW + 0.2, GROW + 0.7))
  if (show <= 0) return null
  const flick = 1 + wave(t, 0.2) * 0.12
  return (
    <Layer scale={show * flick} origin={[77, 71]} x={0} y={-3}>
      <path d="M77 62 Q80 67 79 71 Q77 73.4 75 71 Q74 67 77 62 Z" fill={FLAME_OUT} />
      <path d="M77 66 Q78.8 69 78 71 Q77 72 76 71 Q75.6 69 77 66 Z" fill={FLAME_IN} />
    </Layer>
  )
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
        const p = (t - start) % 2.1 / 2.1
        return <circle key={i} cx={64 - p * 40} cy={18 - p * 6} r={3.6 + p * 4.8} fill="#b4bbc4" opacity={Math.sin(p * Math.PI) * 0.55 * (1 - span(t, INK - 0.4, INK + 0.3))} />
      })}
    </>
  )
}

type ArmPose = { readonly swing: number; readonly bend: number }

/** かた から出て ひじ で まがる うで。たいまつを もつときは、手の さきに 火が つく */
function Arm({ shoulder, pose, color, torch, t }: { readonly shoulder: readonly [number, number]; readonly pose: ArmPose; readonly color: string; readonly torch?: boolean; readonly t: number }) {
  const elbow = [shoulder[0] - Math.sin(rad(pose.swing)) * ARM_PART, shoulder[1] + Math.cos(rad(pose.swing)) * ARM_PART] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] - Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART] as const
  const tip = [hand[0] - Math.sin(rad(fore)) * 8, hand[1] + Math.cos(rad(fore)) * 8] as const
  const flick = 1 + wave(t, 0.18) * 0.12
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
      {torch ? (
        <>
          <path d={`M${hand[0]} ${hand[1]} L${tip[0]} ${tip[1]}`} stroke={WOOD} strokeWidth="2" strokeLinecap="round" />
          <g transform={`translate(${tip[0]} ${tip[1] - 0.6}) scale(${flick})`}>
            <path d="M0 -5.4 Q3.2 -1.6 2.2 1 Q0 2.6 -2.2 1 Q-3.2 -1.6 0 -5.4 Z" fill={FLAME_OUT} />
            <path d="M0 -2.8 Q1.6 -0.8 1.1 0.8 Q0 1.6 -1.1 0.8 Q-1.6 -0.8 0 -2.8 Z" fill={FLAME_IN} />
          </g>
        </>
      ) : null}
      <circle cx={hand[0]} cy={hand[1]} r="2.8" fill={SKIN} />
    </>
  )
}

type Mood = 'happy' | 'worried' | 'grit' | 'cheer'

/** あたま。左むき。目・まゆ・口 で きもちを見せる */
function Head({ mood }: { readonly mood: Mood }) {
  return (
    <g transform="translate(96.6 57) scale(0.74) translate(-30.2 -24.6)">
      <circle cx="30.2" cy="24.6" r="9.2" fill={SKIN} />
      <path d="M21.5 23 C21.4 13.8 31.8 11.2 37.8 17 C40.2 20.2 40.2 26 38.2 30.2 C37.6 24.4 33.4 20.2 26.6 20.6 C24.4 20.8 22.6 21.8 21.5 23 Z" fill={HAIR} />
      <circle cx="26.5" cy="28.8" r="2.1" fill="#ff9d9d" opacity="0.55" />
      {mood === 'cheer' ? (
        <>
          <path d="M23.8 26.2 Q25.4 23.6 27 26.2" fill="none" stroke="#2b2b2b" strokeWidth="1.25" strokeLinecap="round" />
          <path d="M22.8 29 Q25 33.6 27.8 29 Z" fill="#b9483f" />
        </>
      ) : (
        <>
          <circle cx="25.4" cy="25.4" r="1.2" fill="#2b2b2b" />
          {mood === 'happy' ? <path d="M23 29.2 Q24.8 31.6 27 29.6" fill="none" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" /> : null}
          {mood === 'worried' ? (
            <>
              <path d="M23.4 22.8 L27 20.6" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
              <ellipse cx="24.6" cy="30.4" rx="1.3" ry="1.7" fill="#b9483f" />
            </>
          ) : null}
          {mood === 'grit' ? (
            <>
              <path d="M23.4 21.6 L27 23" stroke={HAIR} strokeWidth="1.3" strokeLinecap="round" />
              <path d="M23.2 30 h3.6" stroke="#b9483f" strokeWidth="1.3" strokeLinecap="round" />
            </>
          ) : null}
        </>
      )}
    </g>
  )
}

/** 主役の 子ども。たいまつを もって いねを みにきて、むしを おいはらう */
function Child({ t }: SceneProps) {
  const enter = span(t, ENTER, STAND, easeOut)
  const walking = t < ENTER ? 0 : 1 - span(t, STAND - 0.25, STAND)
  const stride = Math.sin((t - ENTER) * Math.PI * 2 * 1.8) * walking
  const mood: Mood = t < WORRY ? 'happy' : t < GRIT ? 'worried' : t < CHEER ? 'grit' : 'cheer'
  // ばんざいの とき すこし はねる
  const hop = t >= CHEER && t < CHEER + 1 ? -Math.abs(Math.sin((t - CHEER) * Math.PI * 2.2)) * 2 : 0
  const bob = -Math.abs(stride) * 1.2 + hop
  // たいまつを たきぎへ のばす → もどす
  const reach = span(t, REACH_FROM, TOUCH, easeInOut) - span(t, REACH_BACK, REACH_BACK + 0.55, easeInOut)
  const near: ArmPose = { swing: 40 + 5 * reach + stride * 4, bend: 110 - 45 * reach }
  // むこうの うで: あるくときは ふり、さいごは ばんざい
  const up = span(t, CHEER, CHEER + 0.45, easeOut)
  const far: ArmPose = { swing: (4 - stride * 22) * (1 - up) + -135 * up, bend: 8 * (1 - up) + -40 * up }
  const worryDrop = during(t, WORRY, GRIT + 0.2, 0.2)
  return (
    <>
      <ellipse cx={FEET[0] + 44 * (1 - enter)} cy="97.6" rx="8" ry="2" fill="#000000" opacity="0.12" />
      <Layer x={44 * (1 - enter)} y={bob}>
        <Arm shoulder={SHOULDER_FAR} pose={far} color={TUNIC_FAR} t={t} />
        <Layer rotate={stride * 17} origin={[101, 80]}>
          <rect x="98.6" y="79" width="5" height="17" rx="2.5" fill={PANTS_DARK} />
          <ellipse cx="100.6" cy="96.6" rx="4" ry="2.1" fill={SHOE} />
        </Layer>
        <Layer rotate={-stride * 17} origin={[96.5, 80]}>
          <rect x="94" y="79" width="5" height="17" rx="2.5" fill={PANTS} />
          <ellipse cx="95.6" cy="96.6" rx="4" ry="2.1" fill={SHOE} />
        </Layer>
        <rect x="94.6" y="60.6" width="4.4" height="7" rx="2" fill={SKIN_SHADE} />
        <rect x="91.8" y="64.6" width="11" height="19" rx="5" fill={TUNIC} />
        <path d="M93.6 76 h7.4" stroke={TUNIC_DARK} strokeWidth="1.3" strokeLinecap="round" />
        <Arm shoulder={SHOULDER_NEAR} pose={near} color={TUNIC_DARK} torch t={t} />
        <Layer rotate={t >= WORRY && t < GRIT ? -4 : 0} origin={NECK}>
          <Head mood={mood} />
        </Layer>
        {worryDrop > 0 ? (
          <path d="M89.2 49 Q91 52 89.2 53.6 Q87.4 52 89.2 49 Z" fill="#7cc4f2" opacity={worryDrop} />
        ) : null}
      </Layer>
    </>
  )
}

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
        <Ground t={t} />
        <FallingLeaves t={t} />
        <Rice t={t} />
        <Glint t={t} />
        <Layer opacity={span(t, 0.5, 0.9)}>
          <Logs />
        </Layer>
        <Flame t={t} />
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
