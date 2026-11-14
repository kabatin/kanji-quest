/*
 * 高(たかい): やねの ある、たかい たてもの。みあげるほど たかい。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)   … やねの てっぺんに 立つ はた の ぽーる(あか い はた が ひらひら)
 *   2画目(一)   … やねの ひさし(のき)
 *   3・4・5画目 … 上の ほうの まど(わく と ガラス)
 *   6・7画目    … 下の 大きな たてもの の かべ(ひだりの はしら・上の ひさし・みぎの はしら)
 *   8・9・10画目… 下の 大きな まど
 *
 * ながれ
 *   たてものが 下から せりあがる → ふうせんを もった 子が うれしそうに あるいてくる
 *   → ふうっと かぜが ふいて ふうせんが 手から ぬける(「あっ!」と 手を のばす)
 *   → ふうせんは ぐんぐん のぼって、たてものの てっぺんの 高さまで とどく
 *   → 子は あたまを うしろに たおして みあげて「わあ、たかい!」と にっこり
 *   → ほね が ひかって、絵が うすくなり、字「高」が のこる
 *
 * 子は Person(あるきは walk、ふうせんを もつ手・のばす手・ばんざいは 角度、みあげるのは head と gazeY)。
 *   たてもの は まっすぐ 立ち、まど・かべ・やね は 水平と 垂直。字の画との ずれは すこし ゆるす。
 *   ふうせん・糸・かぜ は ここで 描く。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { HANG_ARM, mixLimb, PALETTE, Person, personRig, walk, type Limb, type LimbAngles } from '../sceneFigures'

const CHAR = '高'

const WALL = '#f7e6c4'
const WALL_SHADE = '#e3c999'
const TRIM = '#c98a5b'
const TRIM_DARK = '#a96d43'
const FRAME = '#8c5b3c'
const GLASS = '#bfe4fb'
const GLASS_WARM = '#ffe9a8'
const GLASS_LIGHT = '#eaf7ff'
const ROOF = '#d9604f'
const ROOF_DARK = '#b44a3e'
const ROOF_LIGHT = '#ec8272'
const POLE = '#8a8f99'
const FLAG = '#ff6a5a'
const BALLOON = '#ef5a5a'
const BALLOON_DARK = '#d44646'
const GRASS = '#c5e8a9'
const LEAF = PALETTE.leaf
const SUN = '#ffd24a'
const WIND = '#9fc4e0'

/** くぎり の時間(秒) */
const BUILD_END = 1.2
const WALK_START = 0.7
const STOP = 2.7
/** かぜが ふきはじめる / ふうせんが 手から ぬける */
const GUST = 2.9
const SLIP = 3.2
/** ふうせんが てっぺんに ついて、子が「わあ」となる */
const TOP_T = 5.4
const INK = 6.6
const DONE = 9.6
const DURATION = 10.2

/** 子: 足もとが 地面。背の高さ */
const FLOOR = 97
const KID_HEIGHT = 32
/** 子の 見た目(青い 上着・こん の ズボン) */
const KID_LOOK = { top: '#4f9be0', bottom: '#3e5c86' } as const
const KID_STOP = 13
const KID_START = -14
/** ふうせんの たまの 中心から 手までの 糸の長さ */
const STRING = 11
/** ふうせんが のぼりつく ばしょ(やねの すこし上、ひだり) */
const TOP_POS: readonly [number, number] = [19, 9]
/** のぼるとき、たてものの ひさしに ぶつからないよう ひだりへ ふくらむ ぶん */
const BULGE = 7

/* ───────── ばしょ ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[99, 12]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="98.2" y="1.2" width="1.6" height="3.4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 99 12)`} />
        ))}
      </Layer>
      <circle cx="99" cy="12" r={5.2 * sun} fill={SUN} />
      {/* とおくの おか と、ゆっくり ながれる 雲(おくゆき を出す) */}
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${wave(t, 9) * 3} 0)`}>
        <ellipse cx="100" cy="40" rx="7" ry="3.2" />
        <ellipse cx="104.5" cy="38.4" rx="4.6" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 14, 94, 102].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/* ───────── たてもの ───────── */

/** はた: かぜで ひらひら。先が 上下に ゆれる */
function Flag({ t }: SceneProps) {
  const a = wave(t, 0.9) * 1.1
  const b = wave(t, 0.9, 0.3) * 0.9
  return <path d={`M54.4 12.3 Q57.6 ${11.3 + a} 61.2 ${12.7 + b} Q57.6 ${14.6 + a} 54.4 15.2 Z`} fill={FLAG} />
}

function Building({ t }: SceneProps) {
  return (
    <>
      {/* 下の 大きな たてもの: 左右の はしら と、上の ひさし */}
      <rect x="22" y="58" width="65" height="38" fill={WALL} />
      <rect x="80" y="58" width="7" height="38" fill={WALL_SHADE} />
      <rect x="22" y="58" width="5" height="38" fill={TRIM} />
      <rect x="82" y="58" width="5" height="38" fill={TRIM_DARK} />
      <rect x="21" y="93" width="67" height="3.5" fill="#bfa27a" />
      <rect x="20" y="56.5" width="69" height="5.5" rx="1.6" fill={TRIM_DARK} />
      {/* 下の 大きな まど: あたたかい あかり */}
      <rect x="41" y="70" width="27" height="18.5" rx="2.2" fill={FRAME} />
      <rect x="43.5" y="72.5" width="22" height="13.5" rx="1.2" fill={GLASS_WARM} />
      <rect x="45.5" y="74.2" width="5" height="1.5" rx="0.75" fill="#fff6d2" />
      <rect x="40" y="88" width="29" height="2.4" rx="1.1" fill={TRIM} />
      {/* 上の とう(たて に のびた ぶぶん) */}
      <rect x="30" y="25" width="48" height="33" rx="1.2" fill={WALL} />
      <rect x="71" y="25" width="7" height="33" fill={WALL_SHADE} />
      {/* 上の まど */}
      <rect x="35" y="33" width="37" height="19" rx="2.2" fill={FRAME} />
      <rect x="37.5" y="35.5" width="32" height="14" rx="1.2" fill={GLASS} />
      <rect x="40" y="37.4" width="6" height="1.6" rx="0.8" fill={GLASS_LIGHT} />
      <rect x="34" y="51.6" width="39" height="2.4" rx="1.1" fill={TRIM} />
      {/* ひさし と やね */}
      <rect x="21" y="21" width="68" height="5" rx="2" fill={ROOF_DARK} />
      <path d="M22 22 L54 15.8 L88 22 Z" fill={ROOF} />
      <path d="M22 22 L54 15.8 L54 22 Z" fill={ROOF_LIGHT} />
      {/* はたの ぽーる: やねの てっぺんから 上へ */}
      <rect x="53" y="11.8" width="1.5" height="9.6" rx="0.75" fill={POLE} />
      <Flag t={t} />
    </>
  )
}

/* ───────── 子 ───────── */

type Mood = 'happy' | 'worry' | 'wow' | 'joy'
const FACES = { happy: 'smile', worry: 'worried', wow: 'surprised', joy: 'joy' } as const

/** うで の かっこう(ふうせんを もつ / だらんと さげる / 手を のばす / ばんざい) */
const HOLD: Limb = { swing: 38, bend: 55 }
const REACH: Limb = { swing: 85, bend: 45 }
const CHEER_NEAR: LimbAngles = { swing: 130, bend: 25 }
const CHEER_FAR: LimbAngles = { swing: 150, bend: 20 }
const rad = (deg: number) => (deg * Math.PI) / 180

/* ───────── ふうせん と ほか ───────── */

type BalloonProps = {
  readonly x: number
  readonly y: number
  readonly tilt: number
  /** 糸の ゆれ(はなれたあと の ひらひら) */
  readonly tail: number
}

function Balloon({ x, y, tilt, tail }: BalloonProps) {
  return (
    <Layer x={x} y={y} rotate={tilt} origin={[0, 0]}>
      <ellipse cx="0" cy="0" rx="4.2" ry="5" fill={BALLOON} />
      <ellipse cx="1.3" cy="1.2" rx="2.7" ry="3.4" fill={BALLOON_DARK} opacity="0.35" />
      <ellipse cx="-1.5" cy="-1.9" rx="1.1" ry="1.7" fill="#ffffff" opacity="0.7" transform="rotate(20 -1.5 -1.9)" />
      <path d="M-0.9 5.8 L0 4.6 L0.9 5.8 Z" fill={BALLOON_DARK} />
      {tail !== 0 && <path d={`M0 5.8 Q${-tail} 9 0 12 T0 18`} fill="none" stroke="#7a6a5a" strokeWidth="0.45" strokeLinecap="round" />}
    </Layer>
  )
}

/** かぜ: 左から ふきぬける 3本の すじ */
function Gust({ t }: SceneProps) {
  const show = during(t, GUST - 0.1, SLIP + 0.9, 0.2)
  if (show <= 0) return null
  const p = span(t, GUST - 0.1, SLIP + 0.9)
  return (
    <g opacity={show * 0.9} fill="none" stroke={WIND} strokeWidth="0.9" strokeLinecap="round">
      {[62, 72, 80].map((y, i) => (
        <path key={y} d={`M${-14 + p * 52 + i * 3} ${y} q5 -3 10 0 t10 0`} />
      ))}
    </g>
  )
}

/** 「わあ!」: 子の あたまの まわりに ひろがる すじ */
function WowRays({ t, head }: SceneProps & { readonly head: readonly [number, number] }) {
  const show = during(t, TOP_T, TOP_T + 1.2, 0.2)
  if (show <= 0) return null
  const grow = span(t, TOP_T, TOP_T + 0.4, easeOut)
  return (
    <g opacity={show} stroke="#f2a93b" strokeWidth="0.9" strokeLinecap="round">
      {[-125, -90, -55].map((deg) => {
        const r1 = 8 + grow * 1.5
        const r2 = r1 + 2.6
        const c = Math.cos(rad(deg))
        const s = Math.sin(rad(deg))
        return <path key={deg} d={`M${head[0] + c * r1} ${head[1] + s * r1} L${head[0] + c * r2} ${head[1] + s * r2}`} />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 10)

  // たてものが 下から せりあがる
  const rise = span(t, 0.1, BUILD_END, backOut)

  // あるく: 左から 立ち止まる ところまで(walk)
  const w = walk(t, { from: KID_START, to: KID_STOP, start: WALK_START, end: STOP, build: 'child', height: KID_HEIGHT, step: 9, armSwing: 20 })

  // ふうせんが 手から ぬける → ぐんぐん のぼる → みあげる
  const up = span(t, SLIP, TOP_T, easeInOut)
  const lookUp = span(t, SLIP + 0.1, TOP_T, easeInOut)
  const reachK = span(t, SLIP, SLIP + 0.35, easeOut)
  const cheer = span(t, TOP_T - 0.2, TOP_T + 0.3, easeOut)
  const joyful = t >= TOP_T + 0.9
  const mood: Mood = t < GUST ? 'happy' : t < TOP_T ? 'worry' : joyful ? 'joy' : 'wow'

  // 右むき: てまえ = ひだりうで(ふうせんを もつ)、むこう = みぎうで
  const nearBase = t < SLIP ? HOLD : mixLimb(HOLD, REACH, reachK)
  const nearArm = mixLimb(nearBase, { swing: CHEER_NEAR.swing + wave(t, 0.55) * 5 * cheer, bend: CHEER_NEAR.bend }, cheer)
  const walkFar = w.pose.rightArm ?? HANG_ARM
  const farBase = mixLimb(walkFar, { swing: 60, bend: 40 }, reachK)
  const farArm = mixLimb(farBase, { swing: CHEER_FAR.swing - wave(t, 0.55) * 5 * cheer, bend: CHEER_FAR.bend }, cheer)
  const kid = {
    ...w,
    y: FLOOR,
    look: KID_LOOK,
    face: FACES[mood],
    gazeY: -lookUp,
    lean: -3 * lookUp,
    pose: { ...w.pose, leftArm: nearArm, rightArm: farArm, head: -22 * lookUp },
  } as const
  const rig = personRig(kid)
  const stopRig = personRig({ ...kid, x: KID_STOP, lean: 0, pose: { leftArm: HOLD } })

  // ふうせん: 手に もっている間は 手の 上、ぬけたら のぼる
  const hand = rig.world.arms.left.end
  const holdX = hand[0]
  const holdY = hand[1]
  const startX = stopRig.world.arms.left.end[0]
  const startY = stopRig.world.arms.left.end[1] - STRING
  const tug = during(t, GUST, SLIP + 0.15, 0.2)
  const held = t < SLIP
  const sway = wave(t, 1.1) * 0.8
  const balloonX = held ? holdX + sway * 0.5 + tug * 1.6 : mix(t, SLIP, TOP_T, startX, TOP_POS[0], easeInOut) - BULGE * Math.sin(up * Math.PI) + sway
  const balloonY = held ? holdY - STRING : startY + (TOP_POS[1] - startY) * up + (t > TOP_T ? wave(t, 1.6) * 0.7 : 0)
  const balloonTilt = held ? tug * 10 : sway * 3

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <ellipse cx="54.5" cy="97.4" rx={36 * rise} ry="2.6" fill="#000000" opacity="0.1" />
        <Layer scaleX={0.85 + 0.15 * rise} scaleY={rise} origin={[54.5, 96.5]}>
          <Building t={t} />
        </Layer>
        <Layer opacity={span(t, WALK_START - 0.1, WALK_START + 0.1)}>
          <ellipse cx={w.x} cy="97.4" rx="5" ry="1.5" fill="#000000" opacity="0.12" />
          <Person {...kid} />
        </Layer>
        <Gust t={t} />
        {held && <path d={`M${holdX} ${holdY} L${balloonX} ${balloonY + 5.8}`} stroke="#7a6a5a" strokeWidth="0.45" strokeLinecap="round" />}
        <Balloon x={balloonX} y={balloonY} tilt={balloonTilt} tail={held ? 0 : wave(t, 0.9) * 1.6 + 0.01} />
        <WowRays t={t} head={rig.world.head} />
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
    { at: 0, label: 'たてものが せりあがる', sound: 'pop' },
    { at: WALK_START, label: 'ふうせんを もった 子が あるいてくる' },
    { at: GUST, label: 'かぜが ふいて、ふうせんが 手から ぬける', sound: 'pop' },
    { at: SLIP + 0.5, label: 'ふうせんが ぐんぐん のぼる。子が みあげる' },
    { at: TOP_T, label: 'てっぺんの 高さ! 「わあ、たかい」' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '高 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
