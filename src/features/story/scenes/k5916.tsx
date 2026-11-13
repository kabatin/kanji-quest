/*
 * 外(そと): ゆうがた、つきが でた。そとに でて、うらないを する。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … 月の ひだりがわ(かげに なって うすく 見える ところ の ふち)
 *   2画目(ノ)  … 月の みぎがわ の かがやく ふち(三日月の そと の まるみ)
 *   3画目(丶)  … 月の うすい ところに ある、小さな くぼみ(クレーター)
 *   4画目(丨)  … うらないの 竹ざお(竹の 本来の まっすぐな 形)
 *   5画目(丶)  … 竹ざおに むすんだ 吹き流しの リボン(かぜ に ふかれて ななめ下へ なびく)
 *
 * ながれ
 *   ゆうやけ。お日さまが おかの むこうへ しずみ、空が くらくなって、月が のぼる
 *   → 家の ドアが あいて、子どもが そとに でてくる(月を 見あげながら あるく)
 *   → 竹ざおの 前で 立ちどまる。リボンは だらんと たれて、「あした てんき どうかな?」と ふあん
 *   → かぜが ふいて リボンが ふわっと なびく。おひさま の ゆめ が うかんで、子どもは 大よろこび
 *   → 月・竹ざお・リボン の 形に ほね が ひかって、絵が うすくなり、字「外」が のこる
 *
 * 子どもは、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかい。あるくときは 足を かわりばんこに ふる。
 *   月・竹ざお・リボン だけが、字の線に そのまま 重なる(もともと その形の もの)。
 *   子どもは 前に あるいてくると 大きく 見える(とおくから ちかくへ)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '外'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#4cbfae'
const SHIRT_DARK = '#38a091'
const SHIRT_FAR = '#2f8a7d'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const SUN = '#ffd24a'
const MOON = '#ffe9a0'
const MOON_DIM = '#fff3c4'
const MOON_SHADE = '#f0d27a'
const BAMBOO = '#8cc06b'
const BAMBOO_DARK = '#5f9a47'
const RIBBON = '#f0508a'
const RIBBON_LIGHT = '#ffd0e0'
const GOLD = '#f2b632'
const GRASS = '#a9d98c'
const GRASS_DARK = '#7fbf6b'
const HILL = '#8fae7a'
const WALL = '#f3e0c4'
const WALL_SHADE = '#e0c9a4'
const ROOF = '#8a5a4a'
const DOOR_WOOD = '#8c5b3c'
const LIGHT_ROOM = '#ffdc8a'

/** くぎり の時間(秒) */
const DOOR = 1.5
const WALK0 = 1.85
const WALK1 = 3.5
const TURN1 = 3.85
/** うらないの ふあん → かぜ → よろこび */
const WONDER = 3.9
const GUST = 4.5
const LIFT_END = 5.2
const CHEER = 5.3
const INK = 6.6
const DONE = 9.4
const DURATION = 10

/** 竹ざおの 根もと(4画目の おわり)・リボンの むすびめ(5画目の はじまり) */
const POLE_FOOT: readonly [number, number] = [67.1, 97]
const KNOT: readonly [number, number] = [71.5, 42.5]
/** 5画目の 長さ と 向き(右ななめ下) */
const RIBBON_LEN = Math.hypot(93.75 - 71.5, 63.75 - 42.5)
const RIBBON_DEG = (Math.atan2(63.75 - 42.5, 93.75 - 71.5) * 180) / Math.PI

/** 家の ドアの 足もと と、子どもが そとに 出る道すじ。ちかづくと 大きくなる */
const DOOR_FOOT: readonly [number, number] = [94, 94.5]
const STAND: readonly [number, number] = [50, 96]
const SCALE_FAR = 0.42
const SCALE_NEAR = 1.1

/* ───────── けしき ───────── */

function Sky({ t }: SceneProps) {
  const dusk = span(t, 0.2, 3.2)
  return (
    <>
      <rect x="0" y="0" width="109" height="109" fill="#ffcf99" />
      <rect x="0" y="48" width="109" height="61" fill="#ff9c6e" opacity={0.6 * (1 - dusk)} />
      <rect x="0" y="0" width="109" height="109" fill="#5d5fa8" opacity={0.86 * dusk} />
      {/* くらくなると 出てくる ほし */}
      {[
        [10, 22, 2.2, 1.6],
        [22, 9, 2.6, 2.0],
        [80, 11, 2.4, 2.4],
        [97, 27, 2.0, 2.8],
      ].map(([cx, cy, r, at]) => (
        <Star key={`${cx}-${cy}`} cx={cx} cy={cy} r={Math.max(0, r * span(t, at, at + 0.5, backOut)) * (1 + 0.12 * wave(t, 1.4, cx))} color="#ffffff" />
      ))}
    </>
  )
}

/** お日さまが おかの むこうへ しずむ */
function SettingSun({ t }: SceneProps) {
  const y = mix(t, 0, 1.7, 60, 100, easeInOut)
  return (
    <>
      <circle cx="57" cy={y} r="13" fill="#ffb347" opacity="0.28" />
      <circle cx="57" cy={y} r="8" fill="#ffb347" />
    </>
  )
}

/** 月: ひだり(1画目)は かげ、みぎ(2画目)は かがやく ふち。かがやく所だけ、まるく けずった形 */
const MOON_BODY =
  'M35.4 15.8 L44 22 L49.8 26.8 L52.6 35.2 L47.2 47.3 L41 59.1 L33.8 70.3 L25.3 80.5 L14.8 88.5 L15.4 70 L16.5 55 L20.7 50.2 L24.5 45.1 L27.8 39.6 L30.7 33.9 L33.2 28.1 L35.3 22 Z'
/** かがやく ところ: 左うえの まるい へこみ(かげ)を のぞいた 形 */
const MOON_LIT =
  'M30.5 34.2 L33.2 28.1 L35.3 22 L35.4 15.8 L44 22 L49.8 26.8 L52.6 35.2 L47.2 47.3 L41 59.1 L33.8 70.3 L25.3 80.5 L14.8 88.5 L15.5 69.1 A23 23 0 0 0 30.5 34.2 Z'

function Moon({ t }: SceneProps) {
  const rise = span(t, 0.6, 2.4, easeOut)
  const appear = span(t, 0.6, 1.2)
  if (appear <= 0) return null
  return (
    <Layer y={46 * (1 - rise)} opacity={appear}>
      <circle cx="31" cy="54" r="40" fill={MOON_DIM} opacity={0.14 * rise} />
      {/* かげの ところ(うすく 見える) */}
      <path d={MOON_BODY} fill={MOON_DIM} stroke={MOON_DIM} strokeWidth="3" strokeLinejoin="round" opacity="0.3" />
      <Bone char={CHAR} n={3} color={MOON_SHADE} width={2.8} opacity={0.6} />
      {/* かがやく ふち(三日月) */}
      <g>
        <path d={MOON_LIT} fill={MOON} stroke={MOON} strokeWidth="3" strokeLinejoin="round" />
        <circle cx="45" cy="50" r="2.2" fill={MOON_SHADE} opacity="0.7" />
        <circle cx="40" cy="38" r="1.5" fill={MOON_SHADE} opacity="0.7" />
        <circle cx="30" cy="76" r="1.4" fill={MOON_SHADE} opacity="0.7" />
      </g>
    </Layer>
  )
}

/** 巣へ かえる 鳥(小さな にぎやかし) */
function HomeBird({ t }: SceneProps) {
  const p = span(t, 0.3, 3.3)
  if (p <= 0 || p >= 1) return null
  const x = 118 - p * 130
  const y = 17 + Math.sin(p * 6) * 2.4
  const flap = 0.4 + 0.6 * Math.abs(wave(t, 0.5))
  return (
    <Layer x={x} y={y} scaleY={flap}>
      <path d="M-4.2 0 Q-2.1 -3.2 0 0 Q2.1 -3.2 4.2 0" fill="none" stroke="#4a3f66" strokeWidth="1.2" strokeLinecap="round" />
    </Layer>
  )
}

function Hills() {
  return (
    <>
      <path d="M-4 94 Q18 86 44 92 Q70 84 113 92 V101 H-4 Z" fill={HILL} />
      <ellipse cx="54.5" cy="99" rx="58" ry="6.4" fill={GRASS} />
    </>
  )
}

/** かぜで ゆれる 草(かぜが ふくと、右へ たおれる) */
function Grass({ t }: SceneProps) {
  const gust = during(t, GUST - 0.1, GUST + 1.1, 0.4)
  return (
    <>
      {[6, 30, 44, 76, 101].map((x, i) => (
        <Layer key={x} rotate={wave(t, 1.9, i * 0.5) * 3 + gust * 14} origin={[x, 98]}>
          <path d={`M${x} 98 l1.2 -4.6 l1 3.6 l1.6 -5 l0.9 5.4 Z`} fill={GRASS_DARK} />
        </Layer>
      ))}
    </>
  )
}

/* ───────── 家と ドア ───────── */

function House({ t }: SceneProps) {
  // ドアが あいて、子どもが 出たら しまる
  const open = span(t, DOOR, DOOR + 0.4, easeOut) * (1 - span(t, 2.9, 3.3))
  const window = span(t, 0.8, 3.2)
  return (
    <>
      <rect x="82" y="74" width="23" height="21" rx="1" fill={WALL} />
      <rect x="82" y="91.5" width="23" height="3.5" fill={WALL_SHADE} />
      <path d="M79.5 75.5 L93.5 61.5 L107.5 75.5 Z" fill={ROOF} stroke={ROOF} strokeWidth="1.6" strokeLinejoin="round" />
      {/* まど: くらくなると あかりが つく */}
      <rect x="84" y="79" width="5" height="5" rx="0.8" fill="#cfd6e4" />
      <rect x="84" y="79" width="5" height="5" rx="0.8" fill={LIGHT_ROOM} opacity={window} />
      {/* ドア: あくと 中の あかりが 見える */}
      <rect x="90" y="79" width="8" height="16" fill={LIGHT_ROOM} />
      <Layer scaleX={1 - 0.8 * open} origin={[90, 87]}>
        <rect x="90" y="79" width="8" height="16" fill={DOOR_WOOD} />
        <circle cx="96" cy="87.5" r="0.8" fill={GOLD} />
      </Layer>
    </>
  )
}

/* ───────── うらないの 竹ざお ───────── */

/** リボンの ふち。u0〜u1 の 部分を、かぜで ゆれる 波つきで 返す(u=0 が むすびめ) */
function ribbonPath(u0: number, u1: number, amp: number, t: number, notch: boolean): string {
  const steps = 10
  const us = Array.from({ length: steps + 1 }, (_, i) => u0 + ((u1 - u0) * i) / steps)
  const center = (u: number) => amp * Math.sin(u * 0.36 - t * 11) * (u / RIBBON_LEN)
  const half = (u: number) => 2.7 * (1 - 0.3 * (u / RIBBON_LEN))
  const top = us.map((u) => `${u.toFixed(2)} ${(center(u) - half(u)).toFixed(2)}`)
  const bottom = [...us].reverse().map((u) => `${u.toFixed(2)} ${(center(u) + half(u)).toFixed(2)}`)
  const tail = notch ? [`${(u1 - 4.5).toFixed(2)} ${center(u1).toFixed(2)}`] : []
  return `M${top.join(' L')} ${tail.length ? `L${tail[0]} ` : ''}L${bottom.join(' L')} Z`
}

function Pole({ t }: SceneProps) {
  const grow = span(t, 0.2, 0.9, backOut)
  const show = span(t, 0.7, 1.0)
  // かぜで リボンが もちあがる: ま下に たれた形 → ななめ下へ なびく形(5画目の向き)
  const lift = span(t, GUST, LIFT_END, easeOut)
  const flutter = span(t, GUST + 0.1, LIFT_END) * (1 - span(t, INK - 0.35, INK - 0.05))
  const droop = (90 - RIBBON_DEG) * (1 - lift)
  const limp = wave(t, 2.6) * 2.2 * (1 - lift)
  const amp = 2.4 * flutter
  return (
    <>
      <Layer scaleY={grow} scaleX={0.7 + 0.3 * grow} origin={POLE_FOOT}>
        <ellipse cx="67.3" cy="97.4" rx="6" ry="1.8" fill="#000000" opacity="0.12" />
        <Bone char={CHAR} n={4} color={BAMBOO} width={3.8} />
        {/* 竹の ふし */}
        {[28, 50, 72].map((y) => (
          <rect key={y} x="64.4" y={y} width="5.8" height="1.3" rx="0.6" fill={BAMBOO_DARK} />
        ))}
        <circle cx="65.6" cy="11.4" r="2.7" fill={GOLD} />
      </Layer>
      <Layer opacity={show}>
        <path d={`M67.4 ${KNOT[1]} L${KNOT[0]} ${KNOT[1]}`} stroke={RIBBON} strokeWidth="1.8" strokeLinecap="round" />
        <Layer x={KNOT[0]} y={KNOT[1]} rotate={RIBBON_DEG + droop + limp}>
          <path d={ribbonPath(0, RIBBON_LEN, amp, t, true)} fill={RIBBON} />
          <path d={ribbonPath(9, 14.5, amp, t, false)} fill={RIBBON_LIGHT} />
        </Layer>
        <circle cx="69.6" cy={KNOT[1]} r="1.9" fill={RIBBON} />
      </Layer>
    </>
  )
}

/** かぜ: ひだりから ふいてくる すじ */
function Wind({ t }: SceneProps) {
  const p = span(t, GUST - 0.2, GUST + 1.0)
  if (p <= 0 || p >= 1) return null
  const fade = Math.sin(p * Math.PI)
  return (
    <g opacity={fade * 0.85} fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round">
      {[
        [58, 0],
        [66, 0.12],
        [74, 0.06],
      ].map(([y, lag]) => {
        const q = Math.max(0, p - lag)
        return <path key={y} d="M0 0 q5 -2.4 10 0 q3 1.4 5 -1.4" transform={`translate(${-14 + q * 120} ${y})`} />
      })}
    </g>
  )
}

/* ───────── 子ども ───────── */

type Mood = 'wonder' | 'happy'
type ArmPose = { readonly swing: number; readonly bend: number }

/** からだの 長さ(あしもと = 0、うえが マイナス) */
const SHOULDER_AT: readonly [number, number] = [0, -27.5]
const ARM_PART = 6.4

/** かた から出て、ひじ で まがる うで。swing = ま下から まえ(左)へ ふった角度 */
function Arm({ pose, color }: { readonly pose: ArmPose; readonly color: string }) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const elbow = [SHOULDER_AT[0] - Math.sin(rad(pose.swing)) * ARM_PART, SHOULDER_AT[1] + Math.cos(rad(pose.swing)) * ARM_PART] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] - Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART] as const
  return (
    <>
      <path d={`M${SHOULDER_AT[0]} ${SHOULDER_AT[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.5" fill={SKIN} />
    </>
  )
}

type ChildProps = {
  readonly step: number
  readonly mood: Mood
  readonly nearArm: ArmPose
  readonly farArm: ArmPose
  readonly headTilt: number
}

/** 左むきの 子ども(足もとが 原点)。右を むくときは、まるごと 左右を ひっくり返す */
function Child({ step, mood, nearArm, farArm, headTilt }: ChildProps) {
  return (
    <>
      <Arm pose={farArm} color={SHIRT_FAR} />
      <Layer rotate={step * 20} origin={[1.6, -15]}>
        <rect x="-0.6" y="-15.5" width="4.4" height="14.6" rx="2.2" fill={PANTS_DARK} />
        <ellipse cx="0.6" cy="-0.9" rx="3.6" ry="1.9" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 20} origin={[-2.4, -15]}>
        <rect x="-4.6" y="-15.5" width="4.4" height="14.6" rx="2.2" fill={PANTS} />
        <ellipse cx="-3.6" cy="-0.9" rx="3.6" ry="1.9" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう と あたま の間を つなぐ */}
      <rect x="-2.6" y="-30.4" width="4.4" height="4.2" rx="1.8" fill={SKIN_SHADE} />
      <rect x="-5" y="-29" width="10" height="14.2" rx="5" fill={SHIRT} />
      <path d="M-3.6 -20 h7.2" stroke={SHIRT_DARK} strokeWidth="1.2" strokeLinecap="round" />
      <Arm pose={nearArm} color={SHIRT_DARK} />
      <Layer rotate={headTilt} origin={[-0.4, -27.8]}>
        <g transform="translate(-0.6 -33.2) scale(0.739) translate(-30.2 -24.6)">
          <circle cx="30.2" cy="24.6" r="9.2" fill={SKIN} />
          <path d="M21.5 23 C21.4 13.8 31.8 11.2 37.8 17 C40.2 20.2 40.2 26 38.2 30.2 C37.6 24.4 33.4 20.2 26.6 20.6 C24.4 20.8 22.6 21.8 21.5 23 Z" fill={HAIR} />
          <circle cx="26.5" cy="28.8" r="2.1" fill="#ff9d9d" opacity="0.55" />
          {mood === 'wonder' ? (
            <>
              <path d="M23.2 21.8 Q25 20.4 27 21.6" fill="none" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="25.2" cy="24.8" r="1.4" fill="#2b2b2b" />
              <circle cx="24.8" cy="24.3" r="0.45" fill="#ffffff" />
              <ellipse cx="24.4" cy="30.4" rx="1.2" ry="1.6" fill="#b9483f" />
            </>
          ) : (
            <>
              <path d="M23.8 24.9 Q25.4 26.6 27 24.9" fill="none" stroke="#2b2b2b" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M22.4 28.6 Q24.6 33.2 27.4 29.2 Z" fill="#b9483f" />
            </>
          )}
        </g>
      </Layer>
    </>
  )
}

/** うかぶ ゆめ: 「あした」の 空。はじめは くもって、かぜの あと おひさま が 出る */
function Dream({ t }: SceneProps) {
  const pop = span(t, WONDER + 0.1, WONDER + 0.6, backOut)
  if (pop <= 0) return null
  const clear = span(t, GUST + 0.5, GUST + 1.2, easeOut)
  const joy = Math.max(0, 1 + 0.06 * wave(t, 0.6)) * (1 + 0.12 * Math.sin(span(t, GUST + 0.5, GUST + 1.0) * Math.PI))
  return (
    <>
      <circle cx="51" cy="44" r={Math.max(0, 1.2 * pop)} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
      <circle cx="52" cy="38.6" r={Math.max(0, 2 * pop)} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
      <Layer x={55} y={25} scale={pop}>
        <circle cx="0" cy="0" r="9" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
        <g transform={`scale(${joy})`}>
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x="-0.5" y="-7.4" width="1" height="2" rx="0.5" fill={SUN} transform={`rotate(${i * 45})`} opacity={0.4 + 0.6 * clear} />
          ))}
          <circle cx="0" cy="0" r="4.2" fill={SUN} />
        </g>
        {/* くもり: かぜで どこかへ ながれる */}
        <g opacity={1 - clear} transform={`translate(${clear * 9} 0)`}>
          <ellipse cx="0" cy="1.2" rx="6.4" ry="3" fill="#b9c2d3" />
          <ellipse cx="-2.2" cy="-1" rx="3.4" ry="2.6" fill="#b9c2d3" />
          <ellipse cx="2.2" cy="-1.6" rx="3.2" ry="2.8" fill="#c9d1df" />
        </g>
      </Layer>
    </>
  )
}

function Kid({ t }: SceneProps) {
  const appear = span(t, DOOR + 0.2, DOOR + 0.5)
  if (appear <= 0) return null
  const walking = t < WALK1
  // あるく: ドアから 立ちどまる 場所へ。ちかづくほど 大きくなる
  const slow = 1 - span(t, WALK1 - 0.3, WALK1)
  const stride = walking && t >= WALK0 ? Math.sin((t - WALK0) * Math.PI * 2 * 2.2) * slow : 0
  const x = mix(t, WALK0, WALK1, DOOR_FOOT[0], STAND[0], easeOut)
  const footY = mix(t, WALK0, WALK1, DOOR_FOOT[1], STAND[1], easeOut)
  const scale = mix(t, WALK0, WALK1, SCALE_FAR, SCALE_NEAR, easeOut)
  // はじめは 左(月のほう)を むいて あるき、竹ざおの前で 右を むく
  const facing = mix(t, WALK1, TURN1, 1, -1)
  const bob = -Math.abs(stride) * 1.2
  // うで: あるくと ふる / ふあんなときは リボンを ゆびさす / よろこぶと ばんざい
  const base = walking ? stride * 24 : 3
  const point = span(t, WALK1 + 0.2, WONDER + 0.1, easeOut) * (1 - span(t, GUST + 0.4, GUST + 0.8))
  const cheer = span(t, CHEER, CHEER + 0.35, backOut)
  const arm1 = base + (135 - base) * point
  const sway = wave(t, 0.4) * 9 * span(t, CHEER + 0.5, CHEER + 0.8) * (1 - span(t, INK - 0.4, INK - 0.1))
  const nearArm: ArmPose = { swing: arm1 + (245 - arm1) * cheer + sway, bend: walking ? 12 : 8 * (1 - cheer) - 28 * cheer }
  const farBase = walking ? -stride * 24 : 3
  const farArm: ArmPose = { swing: farBase + (118 - farBase) * cheer - sway, bend: walking ? 12 : 8 * (1 - cheer) + 30 * cheer }
  // つきを 見あげる → リボンを 見る → うれしくて ぴょん
  const moonLook = span(t, 2.3, 2.8) * (1 - span(t, WALK1 - 0.2, WALK1))
  const wonder = span(t, WALK1, WONDER) * (1 - span(t, GUST + 0.3, GUST + 0.7))
  const headTilt = 14 * moonLook + 9 * wonder + 4 * span(t, CHEER, CHEER + 0.3)
  const mood: Mood = t < GUST + 0.6 ? 'wonder' : 'happy'
  const hop = t > CHEER + 0.2 ? Math.abs(Math.sin((t - CHEER - 0.2) * Math.PI * 1.7)) * 4.2 * (1 - span(t, INK - 0.35, INK - 0.05)) : 0
  return (
    <Layer opacity={appear}>
      <ellipse cx={x} cy={footY + 0.8} rx={7 * scale} ry={1.9 * scale} fill="#000000" opacity="0.14" />
      <Layer x={x} y={footY + bob - hop * scale} scale={scale}>
        <Layer scaleX={facing}>
          <Child step={stride} mood={mood} nearArm={nearArm} farArm={farArm} headTilt={headTilt} />
        </Layer>
      </Layer>
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <SettingSun t={t} />
        <Moon t={t} />
        <HomeBird t={t} />
        <Hills />
        <House t={t} />
        <Grass t={t} />
        <Pole t={t} />
        <Wind t={t} />
        <Kid t={t} />
        <Dream t={t} />
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
    { at: 0, label: 'ゆうやけ。お日さまが しずむ', sound: 'pop' },
    { at: 0.9, label: '月が のぼる' },
    { at: DOOR, label: 'ドアが あいて、子どもが そとに でる', sound: 'pop' },
    { at: WALK1, label: '竹ざおの前で たちどまる。あした てんき どうかな' },
    { at: GUST, label: 'かぜで リボンが なびく' },
    { at: CHEER, label: 'おひさま の ゆめ。大よろこび', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '外 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
