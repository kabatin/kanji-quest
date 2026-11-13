/*
 * 大(おおきい): 人が 手と 足を 大きく ひろげた。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 子どもが ひろげた 左右の うで(かた の高さ)
 *   2画目(ノ)  … あたまの てっぺん から、どう の まんなか を通って、左の 足
 *   3画目(乀)  … どう の まんなか から、右の 足
 *   (字の形になるのは、手と足を いっぱいに ひろげた さいごの しゅんかん だけ)
 *
 * ながれ
 *   池の そばで つまらなそうな 子ども
 *   → 池から 大きな さかなが ざぶん と とびはねる(わけ)。子どもは びっくり「!」
 *   → ぽちゃん と おちて、子どもは うれしくて ぴょんぴょん
 *   → 「こーんなに おおきかった!」と 手と足を いっぱいに ひろげる(子どもも 大きく 見える)
 *   → ほね が ひかって、絵が うすくなり、字「大」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。足は こし から ひざ で まがる。
 *   くび は みじかく、あたま は どう の まんなか の上。ひろげる ときだけ 字と同じ形になる。
 */
import { backOut, during, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '大'

const SKIN = '#f8cfa6'
const HAIR = '#5a3b2a'
const TUNIC = '#f0a94a'
const TUNIC_DARK = '#d98f33'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const SUN = '#ffd24a'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const POOL = '#7cc4f2'
const POOL_LIGHT = '#b4e0fa'
const FISH = '#4f9be0'
const FISH_DARK = '#3c82c4'
const FISH_BELLY = '#e8f6ff'
const EYE = '#2b2b2b'
const MOUTH = '#c4504a'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const BORED_END = 1.1
/** さかなが とびはねている間 */
const JUMP_FROM = 1.1
const JUMP_TO = 2.4
/** びっくり の「!」が出る */
const SURPRISE = 1.25
/** よろこんで はねる */
const HOP_FROM = 2.5
const HOP_TO = 3.3
/** 手と足を ひろげはじめる・ひろげおわる */
const SPREAD_FROM = 3.3
const SPREAD_TO = 4.6
const INK = 5.5
const DONE = 8.2
const DURATION = 8.8

/** 池の まんなかと、さかなが とびだす・おちる 場所 */
const POOL_AT: readonly [number, number] = [88, 83]
const FISH_OUT = 90
const FISH_IN = 72
const FISH_WATER_Y = 82
const FISH_TOP_Y = 32
/** 足が 地面に つくところ(字の 足の さきの 高さ) */
const FOOT_Y = 91

const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const rad = (deg: number) => (deg * Math.PI) / 180

/* ───────── 景色 ───────── */

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
      {/* ゆっくり ながれる 雲 */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="62" cy="10" rx="7" ry="3.2" />
        <ellipse cx="67" cy="8.4" rx="5" ry="3.2" />
        <ellipse cx="-2" cy="38" rx="6" ry="2.8" />
      </g>
      <path d="M-4 99 Q18 78 44 90 Q72 70 113 90 V101 H-4 Z" fill="#e2f2d2" />
      <ellipse cx="54.5" cy="97" rx="52" ry="6" fill={GRASS} />
      {[8, 30, 104].map((x) => (
        <path key={x} d={`M${x} 98 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 池: 手まえの 子どもより おくに ある。さかなは ここから とびだす。 */
function Pool({ t }: SceneProps) {
  const shimmer = wave(t, 1.6) * 1.2
  return (
    <>
      <ellipse cx={POOL_AT[0]} cy={POOL_AT[1]} rx="18" ry="4.6" fill={POOL} />
      <path d={`M${POOL_AT[0] - 9 + shimmer} ${POOL_AT[1] - 0.6} h6 M${POOL_AT[0] + 3 - shimmer} ${POOL_AT[1] + 1.6} h7`} stroke={POOL_LIGHT} strokeWidth="1.1" strokeLinecap="round" />
    </>
  )
}

/** 水面に ひろがる わ */
function Ripple({ t, from, x }: { readonly t: number; readonly from: number; readonly x: number }) {
  const p = span(t, from, from + 0.9)
  if (p <= 0 || p >= 1) return null
  const rx = 3 + 10 * p
  return <ellipse cx={x} cy={FISH_WATER_Y + 1} rx={rx} ry={rx * 0.26} fill="none" stroke={POOL_LIGHT} strokeWidth="1.1" opacity={1 - p} />
}

/** しぶき: 水面から 上に とびちる 水の つぶ(おもさで 山なりに おちる) */
function Spray({ t, from, x, power }: { readonly t: number; readonly from: number; readonly x: number; readonly power: number }) {
  const q = t - from
  if (q <= 0 || q >= 0.7) return null
  const drops = [-1, -0.5, 0, 0.5, 1]
  return (
    <g opacity={1 - q / 0.7} fill={POOL_LIGHT}>
      {drops.map((d, i) => (
        <circle key={d} cx={x + d * 5 * power * q * 3} cy={FISH_WATER_Y - (9 - Math.abs(d) * 3 + i * 0.4) * power * q * 2 + 22 * q * q * power} r={1.3 * power} />
      ))}
    </g>
  )
}

/** 大きな さかな。あたまを むいている ほうへ すすむ。 */
function Fish({ t }: SceneProps) {
  const p = span(t, JUMP_FROM, JUMP_TO)
  if (p <= 0 || p >= 1) return null
  const x = lerp(FISH_OUT, FISH_IN, p)
  const y = FISH_WATER_Y - (FISH_WATER_Y - FISH_TOP_Y) * Math.sin(p * Math.PI)
  const vx = FISH_IN - FISH_OUT
  const vy = -(FISH_WATER_Y - FISH_TOP_Y) * Math.PI * Math.cos(p * Math.PI)
  const angle = (Math.atan2(vy, vx) * 180) / Math.PI
  return (
    <Layer x={x} y={y} rotate={angle + 180}>
      {/* ローカル座標では さかなの あたまが -x がわ。angle+180 で すすむ向きに あたまが来る */}
      <path d="M11 0 L19 -6 Q17 0 19 6 Z" fill={FISH_DARK} />
      <ellipse cx="0" cy="0" rx="13" ry="6.8" fill={FISH} />
      {/* おなか: 体の 下がわ だけ 白く(体の中に おさめる) */}
      <path d="M-9 3 Q0 7.4 9 3 Q0 4.6 -9 3 Z" fill={FISH_BELLY} />
      <path d="M-2 -6 Q1 -11 5 -5.4 Z" fill={FISH_DARK} />
      <path d="M2 1 Q6 4 9 2" fill="none" stroke={FISH_DARK} strokeWidth="0.9" strokeLinecap="round" />
      <circle cx="-8" cy="-1.6" r="1.5" fill="#ffffff" />
      <circle cx="-8.3" cy="-1.6" r="0.8" fill={EYE} />
    </Layer>
  )
}

/* ───────── 子ども ───────── */

type Mood = 'bored' | 'surprised' | 'happy'

type ArmDef = { readonly side: -1 | 1; readonly shoulder: readonly [number, number]; readonly lenU: number; readonly lenF: number; readonly spreadU: number; readonly spreadF: number }
/** 字の 1画目(よこ線)に とどく ながさと 角度(ま下から そとへ 何度か) */
const LEFT_ARM: ArmDef = { side: -1, shoulder: [44, 45.5], lenU: 12.8, lenF: 12.8, spreadU: 84, spreadF: 86 }
const RIGHT_ARM: ArmDef = { side: 1, shoulder: [55, 45.5], lenU: 14.8, lenF: 14.8, spreadU: 90, spreadF: 96 }

/** かた から出て、ひじ で まがる うで。かた → ひじ → 手 の じゅんに つながる。 */
function Arm({ def, spread, cheer, wiggle }: { readonly def: ArmDef; readonly spread: number; readonly cheer: number; readonly wiggle: number }) {
  // ふだんは ま下に たれる。おどろくと ひじを まげて 少し あげる。ひろげると 字の 1画目に そろう
  const upper = lerp(7 + 23 * cheer + wiggle, def.spreadU, spread)
  const fore = lerp(17 + 63 * cheer + wiggle, def.spreadF, spread)
  const [sx, sy] = def.shoulder
  const ex = sx + def.side * def.lenU * Math.sin(rad(upper))
  const ey = sy + def.lenU * Math.cos(rad(upper))
  const hx = ex + def.side * def.lenF * Math.sin(rad(fore))
  const hy = ey + def.lenF * Math.cos(rad(fore))
  return (
    <>
      <path d={`M${sx} ${sy} L${ex} ${ey}`} stroke={TUNIC_DARK} strokeWidth="6" strokeLinecap="round" />
      <path d={`M${ex} ${ey} L${hx} ${hy}`} stroke={SKIN} strokeWidth="4.6" strokeLinecap="round" />
      <circle cx={hx} cy={hy} r="3" fill={SKIN} />
    </>
  )
}

type LegDef = { readonly side: -1 | 1; readonly hip: readonly [number, number]; readonly len: number; readonly spreadThigh: number; readonly spreadShin: number }
/** 字の 2画目・3画目の 足のさきに とどく ながさと 角度 */
const LEFT_LEG: LegDef = { side: -1, hip: [46, 58], len: 21, spreadThigh: 40, spreadShin: 35 }
const RIGHT_LEG: LegDef = { side: 1, hip: [53, 58], len: 23.5, spreadThigh: 47, spreadShin: 41 }
const STAND_LEG = 21

/** こし から ひざ で まがる 足。ズボン(もも) → はだ(すね) → くつ。 */
function Leg({ def, spread }: { readonly def: LegDef; readonly spread: number }) {
  const len = def.side === 1 ? lerp(STAND_LEG, def.len, spread) : def.len
  const thigh = lerp(3, def.spreadThigh, spread)
  const shin = lerp(1, def.spreadShin, spread)
  const [hx, hy] = def.hip
  const kx = hx + def.side * len * Math.sin(rad(thigh))
  const ky = hy + len * Math.cos(rad(thigh))
  const fx = kx + def.side * len * Math.sin(rad(shin))
  const fy = ky + len * Math.cos(rad(shin))
  return (
    <>
      <path d={`M${hx} ${hy} L${kx} ${ky}`} stroke={PANTS} strokeWidth="7" strokeLinecap="round" />
      <path d={`M${kx} ${ky} L${fx} ${fy}`} stroke={SKIN} strokeWidth="4.8" strokeLinecap="round" />
      <ellipse cx={fx + def.side * 1.8} cy={fy + 1.2} rx="4.6" ry="2.4" fill={SHOE} />
    </>
  )
}

function Face({ mood, gaze }: { readonly mood: Mood; readonly gaze: number }) {
  return (
    <>
      <circle cx="43.6" cy="29.8" r="1.9" fill={CHEEK} opacity="0.55" />
      <circle cx="55.4" cy="29.8" r="1.9" fill={CHEEK} opacity="0.55" />
      {mood === 'bored' && (
        <>
          <path d="M44 26.6 h3.6 M51.4 26.6 h3.6" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M44 25.4 l3.6 -0.6 M51.4 24.8 l3.6 0.6" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <path d="M47.6 31.2 q1.9 -1 3.8 0" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'surprised' && (
        <>
          <circle cx="45.8" cy="26.4" r="1.7" fill={EYE} />
          <circle cx="53.2" cy="26.4" r="1.7" fill={EYE} />
          <circle cx={46.3 + gaze} cy="25.8" r="0.55" fill="#ffffff" />
          <circle cx={53.7 + gaze} cy="25.8" r="0.55" fill="#ffffff" />
          <path d="M43.8 22.8 q2 -1.4 4 0 M51.2 22.8 q2 -1.4 4 0" fill="none" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <ellipse cx="49.5" cy="31.2" rx="1.6" ry="2.2" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M44.2 27 Q45.9 24.4 47.6 27 M51.4 27 Q53.1 24.4 54.8 27" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M45.4 29.6 Q49.5 35.6 53.6 29.6 Z" fill={MOUTH} />
          <path d="M47.4 32.6 Q49.5 31.6 51.6 32.6 Q49.5 34.2 47.4 32.6 Z" fill="#ff8a8a" />
        </>
      )}
    </>
  )
}

type PersonProps = { readonly spread: number; readonly cheer: number; readonly wiggle: number; readonly mood: Mood; readonly gaze: number; readonly tilt: number }

function Person({ spread, cheer, wiggle, mood, gaze, tilt }: PersonProps) {
  return (
    <>
      <Leg def={LEFT_LEG} spread={spread} />
      <Leg def={RIGHT_LEG} spread={spread} />
      {/* ズボン と どう */}
      <rect x="42.2" y="52" width="14.6" height="9" rx="3.4" fill={PANTS} />
      {/* くび: みじかく、どう と あたま の間を つなぐ */}
      <rect x="46.8" y="31" width="5.4" height="7" rx="2.4" fill={SKIN} />
      <rect x="42" y="36" width="15" height="21" rx="6.4" fill={TUNIC} />
      <path d="M43.6 53.4 h11.8" stroke={TUNIC_DARK} strokeWidth="1.5" strokeLinecap="round" />
      <Arm def={LEFT_ARM} spread={spread} cheer={cheer} wiggle={wiggle} />
      <Arm def={RIGHT_ARM} spread={spread} cheer={cheer} wiggle={wiggle} />
      {/* あたま: くび の上で、少し かたむく */}
      <Layer rotate={tilt} origin={[49.5, 33]}>
        <circle cx="49.5" cy="24.5" r="8.6" fill={SKIN} />
        <path d="M40.9 25 C39.6 14.6 59.4 14.6 58.1 25 C55.5 20 46 19.4 40.9 25 Z" fill={HAIR} />
        <path d="M49.5 17.4 Q48 14.4 50.2 13.6 Q52.2 13.4 51.4 15.8" fill="none" stroke={HAIR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <Face mood={mood} gaze={gaze} />
      </Layer>
    </>
  )
}

/** びっくり の「!」 */
function Surprise({ t }: SceneProps) {
  const show = during(t, SURPRISE, JUMP_TO + 0.1, 0.12)
  if (show <= 0) return null
  const pop = span(t, SURPRISE, SURPRISE + 0.25, backOut)
  return (
    <Layer x={60} y={15} scale={Math.max(0, pop)} origin={[0, 4]} opacity={show}>
      <rect x="-1.3" y="-6" width="2.6" height="7.6" rx="1.3" fill="#e8534a" />
      <circle cx="0" cy="4.4" r="1.5" fill="#e8534a" />
    </Layer>
  )
}

/** つまらなくて ためいき「ふう」。 */
function Sigh({ t }: SceneProps) {
  const show = during(t, 0.35, BORED_END + 0.1, 0.2)
  if (show <= 0) return null
  const p = span(t, 0.35, BORED_END + 0.1, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={42 - p * 8} cy={39 - p * 4} rx={2.6 + p * 2.2} ry={1.8 + p * 1.4} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
      <ellipse cx={45 - p * 5} cy={40 - p * 1.4} rx={1.3 + p * 0.8} ry={1 + p * 0.5} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 3)

  // 手と足を ひろげる度合い(0 = ふつうに立つ / 1 = 字と同じ)
  const spread = span(t, SPREAD_FROM, SPREAD_TO, backOut)
  const cheer = span(t, SURPRISE, SURPRISE + 0.25) * (1 - Math.min(spread, 1))
  const wiggle = t > SURPRISE + 0.3 && t < SPREAD_FROM ? wave(t, 0.22) * 5 * cheer : 0
  const mood: Mood = t < SURPRISE ? 'bored' : t < JUMP_TO ? 'surprised' : 'happy'
  const tilt = t < SURPRISE ? -5 + wave(t, 2) * 1.2 : t < JUMP_TO ? 3 : 3 * (1 - Math.min(spread, 1))
  // うれしくて はねる
  const hop = t > HOP_FROM && t < HOP_TO ? Math.abs(Math.sin(((t - HOP_FROM) / 0.4) * Math.PI)) * 4 : 0
  // 立っている ときは 小さく、ひろげると 大きく 見える
  const size = 0.8 + 0.2 * spread
  const standFootY = 58 + STAND_LEG * (Math.cos(rad(lerp(3, LEFT_LEG.spreadThigh, spread))) + Math.cos(rad(lerp(1, LEFT_LEG.spreadShin, spread))))
  // 体の おおきさが かわっても、足は 地面に つけておく
  const lift = FOOT_Y - standFootY - hop
  const shadow = 8 + 26 * Math.min(spread, 1)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Pool t={t} />
        <Ripple t={t} from={JUMP_FROM - 0.1} x={FISH_OUT} />
        <Ripple t={t} from={JUMP_TO - 0.05} x={FISH_IN} />
        <Fish t={t} />
        <Spray t={t} from={JUMP_FROM - 0.1} x={FISH_OUT} power={0.7} />
        <Spray t={t} from={JUMP_TO - 0.05} x={FISH_IN} power={1} />
        <ellipse cx={lerp(49.5, 53, Math.min(spread, 1))} cy="94.8" rx={shadow} ry="2.4" fill="#000000" opacity="0.12" />
        <Layer y={lift} scale={size} origin={[49.5, standFootY]}>
          <Person spread={spread} cheer={cheer} wiggle={wiggle} mood={mood} gaze={0.7} tilt={tilt} />
        </Layer>
        <Sigh t={t} />
        <Surprise t={t} />
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
    { at: 0, label: 'つまらなそうな 子ども', sound: 'pop' },
    { at: JUMP_FROM, label: '池から 大きな さかなが とびはねる!' },
    { at: JUMP_TO, label: 'ぽちゃん。びっくり して よろこぶ', sound: 'pop' },
    { at: SPREAD_FROM, label: '「こーんなに おおきかった!」手と足を ひろげる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '大 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
