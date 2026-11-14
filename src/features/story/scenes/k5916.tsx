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
 * 子どもは Person。ドアから 左へ walk して、竹ざおの 前で turnAround して 右を むく。
 * ドアの そばでは 小さく、手前へ くると 大きく(背の高さ を mix で かえる)。
 * 背景は Backdrop(time で 夕方 → 夜)、家は House、小鳥は Bird、かぜは Wind。
 * 月・竹ざお・リボン だけが、字の線に そのまま 重なる(もともと その形の もの)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Bird, HANG_ARM, House, LOOKS, mixLimb, Person, posture, turnAround, walk, Wind, type Expression } from '../sceneFigures'

const CHAR = '外'

const SUN = '#ffd24a'
const MOON = '#ffe9a0'
const MOON_DIM = '#fff3c4'
const MOON_SHADE = '#f0d27a'
const BAMBOO = '#8cc06b'
const BAMBOO_DARK = '#5f9a47'
const RIBBON = '#f0508a'
const RIBBON_LIGHT = '#ffd0e0'
const GOLD = '#f2b632'
const LIGHT_ROOM = '#ffdc8a'
const KID_LOOK = { ...LOOKS.boy, top: '#4cbfae', bottom: '#3e5c86' } as const

/** くぎり の時間(秒) */
const DOOR = 1.5
const WALK0 = 1.85
const WALK1 = 3.5
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

/** 家(まんなか x・地面 y・はば)。ドアは 家の まんなか */
const HOUSE: readonly [number, number, number] = [92, 95, 30]
/** 子どもが そとに 出る道すじ(足もと)と 背の高さ。ちかづくと 大きくなる */
const DOOR_FOOT: readonly [number, number] = [92, 94.5]
const STAND: readonly [number, number] = [50, 96]
const HEIGHT_FAR = 14
const HEIGHT_NEAR = 48

/* ───────── けしき ───────── */

/** 月: ひだり(1画目)は かげ、みぎ(2画目)は かがやく ふち。かがやく所だけ、まるく けずった形 */
const MOON_BODY =
  'M35.4 15.8 L44 22 L49.8 26.8 L52.6 35.2 L47.2 47.3 L41 59.1 L33.8 70.3 L25.3 80.5 L14.8 88.5 L15.4 70 L16.5 55 L20.7 50.2 L24.5 45.1 L27.8 39.6 L30.7 33.9 L33.2 28.1 L35.3 22 Z'
/** かがやく ところ: 左うえの まるい へこみ(かげ)を のぞいた 形 */
const MOON_LIT =
  'M30.5 34.2 L33.2 28.1 L35.3 22 L35.4 15.8 L44 22 L49.8 26.8 L52.6 35.2 L47.2 47.3 L41 59.1 L33.8 70.3 L25.3 80.5 L14.8 88.5 L15.5 69.1 A23 23 0 0 0 30.5 34.2 Z'

function CrescentMoon({ t }: SceneProps) {
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

/** ドアが あくと、中の あかりが 見える(家の ドアの 上に かさねる) */
function DoorLight({ t }: SceneProps) {
  const [x, y, w] = HOUSE
  const open = span(t, DOOR, DOOR + 0.4, easeOut) * (1 - span(t, 2.9, 3.3))
  if (open <= 0) return null
  const h = w * 0.7
  return <rect x={x - w * 0.11} y={y - h * 0.52} width={w * 0.22} height={h * 0.52} rx="0.8" fill={LIGHT_ROOM} opacity={open} />
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

/* ───────── 子ども ───────── */

function Kid({ t }: SceneProps) {
  if (t < DOOR + 0.2) return null
  const w = walk(t, { from: DOOR_FOOT[0], to: STAND[0], start: WALK0, end: WALK1, build: 'child', height: 34, step: 10 })
  // ドアの そばは 小さく、ちかづくほど 大きく(足もと も ドア から 立つ場所へ)
  const height = mix(t, WALK0, WALK1, HEIGHT_FAR, HEIGHT_NEAR, easeOut)
  const y = mix(t, WALK0, WALK1, DOOR_FOOT[1], STAND[1], easeOut)
  const walking = t < WALK1
  // つきを 見あげる → リボンを 見る
  const moonLook = span(t, 2.3, 2.8) * (1 - span(t, WALK1 - 0.2, WALK1))
  const wonder = span(t, WALK1, WONDER) * (1 - span(t, GUST + 0.3, GUST + 0.7))
  // ふあんな ときは リボンを ゆびさす / よろこぶと ばんざい
  const point = span(t, WALK1 + 0.2, WONDER + 0.1, easeOut) * (1 - span(t, GUST + 0.4, GUST + 0.8))
  const cheer = span(t, CHEER, CHEER + 0.35, backOut)
  const sway = wave(t, 0.4) * 9 * span(t, CHEER + 0.5, CHEER + 0.8) * (1 - span(t, INK - 0.4, INK - 0.1))
  const banzai = posture('banzai', 'right')
  const pointing = mixLimb(HANG_ARM, { to: [64, 45] }, point)
  const standPose = {
    leftArm: mixLimb(pointing, banzai.leftArm ?? HANG_ARM, cheer),
    rightArm: mixLimb(HANG_ARM, { swing: 160 + sway, bend: 14 }, cheer),
    head: -9 * wonder,
  }
  const pose = walking ? { ...w.pose, head: -12 * moonLook } : standPose
  const facing = walking ? { facing: w.facing } : turnAround(t, WALK1, 'left', 'right')
  const face: Expression = t < GUST + 0.6 ? (t < WONDER ? 'normal' : 'worried') : 'joy'
  const hop = t > CHEER + 0.2 ? Math.abs(Math.sin((t - CHEER - 0.2) * Math.PI * 1.7)) * 4.2 * (1 - span(t, INK - 0.35, INK - 0.05)) : 0
  return <Person x={w.x} y={y} height={height} build="child" {...facing} pose={pose} look={KID_LOOK} face={face} lift={(hop * height) / 44} />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const sunY = mix(t, 0, 1.7, 60, 100, easeInOut)
  const birdP = span(t, 0.3, 3.3)
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[57, sunY]} clouds={[]} tufts={[6, 30, 44, 76, 101]} time={1 + span(t, 0.2, 3.2)} moon={null} />
        <CrescentMoon t={t} />
        {birdP > 0 && birdP < 1 && <Bird x={118 - birdP * 130} y={17 + Math.sin(birdP * 6) * 2.4} t={t} flying facing="left" size={0.9} />}
        <House x={HOUSE[0]} y={HOUSE[1]} width={HOUSE[2]} grow={span(t, 0, 0.4)} light={span(t, 0.8, 3.2)} />
        <DoorLight t={t} />
        <Pole t={t} />
        <Wind t={t} x={40} y={60} dir={1} reach={34} show={during(t, GUST - 0.2, GUST + 1.0, 0.3)} color="#ffffff" />
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
