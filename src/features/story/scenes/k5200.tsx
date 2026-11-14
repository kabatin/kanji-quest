/*
 * 刀(かたな): かじやさんが、まっかな 鉄の ぼうを 水に ジュッ と つけたら、そった かたなに なった。
 * (共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)
 *   1画目(つり手の かたち) … かたなを たてかける 木の だい(うえの よこぼう と、右の はしら と、足もと)
 *   2画目(ノ)              … そった かたな(うえの つか から、したの きっさき まで。体は そっている)
 *                             (できあがりで、かじやさんが だいに たてかけた かたなが この線に重なる)
 *
 * ながれ
 *   かじばが できる → かじやさんが まっかに やけた 鉄の ぼうを もって あるいてくる(あつくて しんぱい)
 *   → 水の おけに ジュッ と つける(ぎゅっと 目をつぶる。けむりが ふわっ)
 *   → 引きあげると、はが そった かたなに なっている(びっくり → にっこり)
 *   → つかを つけて、だいに たてかける → ほね が ひかって、絵が うすくなり、字「刀」が のこる
 *
 * かじやさんは Person(左むき。walk で あるき、手は かたなの 上の 点を { to } で にぎる)。
 * かたなは、そりが 1つの なめらかな カーブ。まっすぐな 鉄が、水で ひやされて そる。
 */
import { backOut, during, easeInOut, inkTiming, span, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { LOOKS, PALETTE, Person, Room, Sweat, mixColor, personRig, walk, type PersonPose } from '../sceneFigures'

const CHAR = '刀'

const WALL = '#fbeed6'
const FLOOR = '#e7cfa5'
const BARK = '#8c5b3c'
const TUB = '#b07c52'
const TUB_DARK = '#8f5f3a'
const TUB_BAND = '#6b4a36'
const WATER = PALETTE.water
const WATER_LIGHT = '#bfe3f9'
const STEEL = '#cfd9e6'
const STEEL_SHADE = '#9fb0c4'
const HOT = '#ff7a3d'
const HOT_LIGHT = '#ffd27a'
const GOLD = '#e3b84a'
const WRAP = '#b8453a'
const WRAP_DARK = '#8e2f28'

/** くぎり の時間(秒) */
const WALK = 0.5
const ARRIVE = 1.7
/** 鉄の ぼうを 水に おろしはじめる */
const DIP = 2.6
/** 水に つかって、ジュッ と けむりが出る */
const QUENCH = 3.2
/** 引きあげる */
const LIFT = 4.0
/** つかを つける */
const WRAPPED = 4.75
/** だいに たてかける */
const PROP = 5.1
const INK = 6.5
const DONE = 9.0
const DURATION = 9.6

/** かじやさんの 立つ ところ(こし の x)と 地面、背の高さ */
const SMITH_X = 68
const GROUND = 94.4
const SMITH_HEIGHT = 68
const SMITH_LOOK = { ...LOOKS.man, hair: '#5a3b2a', top: '#4a66a8', bottom: '#2f3f66' } as const

/* ───────── かたなの かたち ───────── */

type Vec = readonly [number, number]

/** 2画目の はじまり(つかの てっぺん)と おわり(きっさき)。かたなの ながさは この2点の きょり */
const FINAL_HILT: Vec = [49.8, 29.1]
const FINAL_TIP: Vec = [16.6, 86.9]
const CHORD = Math.hypot(FINAL_TIP[0] - FINAL_HILT[0], FINAL_TIP[1] - FINAL_HILT[1])
/** できあがりの かたなの むき(度)。ま右を 0 として、した むきが プラス */
const FINAL_ANGLE = (Math.atan2(FINAL_TIP[1] - FINAL_HILT[1], FINAL_TIP[0] - FINAL_HILT[0]) * 180) / Math.PI
/** 2画目の そり(まっすぐな線から いちばん はなれた ところ) */
const SAG = 8.4
/** つかが 全体の どこまで か */
const HILT_END = 0.25
/** 手で にぎる ところ(つかの 上のほう と 下のほう) */
const GRIP_NEAR = 0.07
const GRIP_FAR = 0.16

const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const lerpVec = (a: Vec, b: Vec, k: number): Vec => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]

type SwordPose = {
  /** つかの てっぺん */
  readonly hilt: Vec
  /** むき(度)。180 = 左むき / FINAL_ANGLE = できあがり */
  readonly angle: number
  /** そり 0 = まっすぐ / 1 = できあがり */
  readonly bend: number
}

/** かたなの 中心線(2次の ベジェ)。u = 0 が つかの てっぺん、1 が きっさき */
function swordCurve({ hilt, angle, bend }: SwordPose) {
  const rad = (angle * Math.PI) / 180
  const dir: Vec = [Math.cos(rad), Math.sin(rad)]
  const normal: Vec = [dir[1], -dir[0]]
  const tip: Vec = [hilt[0] + dir[0] * CHORD, hilt[1] + dir[1] * CHORD]
  const mid: Vec = [(hilt[0] + tip[0]) / 2, (hilt[1] + tip[1]) / 2]
  const ctrl: Vec = [mid[0] + normal[0] * 2 * SAG * bend, mid[1] + normal[1] * 2 * SAG * bend]
  const at = (u: number): Vec => [(1 - u) ** 2 * hilt[0] + 2 * u * (1 - u) * ctrl[0] + u * u * tip[0], (1 - u) ** 2 * hilt[1] + 2 * u * (1 - u) * ctrl[1] + u * u * tip[1]]
  const tangent = (u: number): Vec => {
    const x = 2 * (1 - u) * (ctrl[0] - hilt[0]) + 2 * u * (tip[0] - ctrl[0])
    const y = 2 * (1 - u) * (ctrl[1] - hilt[1]) + 2 * u * (tip[1] - ctrl[1])
    const len = Math.hypot(x, y) || 1
    return [x / len, y / len]
  }
  return { at, tangent }
}

const SAMPLES = 16
const range = (from: number, to: number): number[] => Array.from({ length: SAMPLES + 1 }, (_, i) => from + ((to - from) * i) / SAMPLES)
const polyline = (points: readonly Vec[]) => points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')

/** かたな。heat = やけて まっか(1)→ ひえて はがね色(0) / wrap = つかを つけた 度合い */
function Sword({ pose, heat, wrap }: { readonly pose: SwordPose; readonly heat: number; readonly wrap: number }) {
  const curve = swordCurve(pose)
  const us = range(HILT_END, 1)
  // はば: つばの所は 太く、きっさき に向かって 細くなる(さきが とがる)
  const half = (u: number) => lerp(2.7, 0.35, ((u - HILT_END) / (1 - HILT_END)) ** 1.4)
  const side = (sign: number) =>
    us.map((u): Vec => {
      const p = curve.at(u)
      const tan = curve.tangent(u)
      const w = half(u) * sign
      return [p[0] + tan[1] * w, p[1] - tan[0] * w]
    })
  const edge = side(1)
  const spine = side(-1)
  const body = `${polyline(edge)} L${spine[spine.length - 1][0].toFixed(2)} ${spine[spine.length - 1][1].toFixed(2)} ${polyline([...spine].reverse()).replace('M', 'L')} Z`
  const steel = mixColor(STEEL, HOT, heat)
  const shade = mixColor(STEEL_SHADE, HOT, heat)
  const bright = mixColor('#ffffff', HOT_LIGHT, heat)
  const hiltPoints = range(0, HILT_END).map((u) => curve.at(u))
  const tsuba = curve.at(HILT_END)
  const tsubaTan = curve.tangent(HILT_END)
  const tsubaAngle = (Math.atan2(tsubaTan[1], tsubaTan[0]) * 180) / Math.PI
  return (
    <>
      {heat > 0.01 ? <path d={polyline(us.map((u) => curve.at(u)))} fill="none" stroke={HOT} strokeWidth="9" strokeLinecap="round" opacity={0.32 * heat} /> : null}
      {/* つかの まだ ない 鉄の ぼう(なかご) */}
      <path d={polyline(hiltPoints)} fill="none" stroke={mixColor('#6d7686', HOT, heat)} strokeWidth="2.8" strokeLinecap="round" />
      <path d={body} fill={steel} />
      <path d={polyline(spine.map(([x, y], i): Vec => lerpVec([x, y], curve.at(us[i]), 0.35)))} fill="none" stroke={shade} strokeWidth="0.9" strokeLinecap="round" />
      <path d={polyline(edge.map(([x, y], i): Vec => lerpVec([x, y], curve.at(us[i]), 0.35)))} fill="none" stroke={bright} strokeWidth="0.8" strokeLinecap="round" opacity="0.9" />
      {wrap > 0 ? (
        <g opacity={wrap}>
          <path d={polyline(hiltPoints)} fill="none" stroke={WRAP} strokeWidth="5" strokeLinecap="round" />
          {[0.04, 0.09, 0.14, 0.19].map((u) => {
            const p = curve.at(u)
            const tan = curve.tangent(u)
            const nx = tan[1]
            const ny = -tan[0]
            return <path key={u} d={`M${p[0] + nx * 2.3 - tan[0] * 0.9} ${p[1] + ny * 2.3 - tan[1] * 0.9} L${p[0] - nx * 2.3 + tan[0] * 0.9} ${p[1] - ny * 2.3 + tan[1] * 0.9}`} stroke={WRAP_DARK} strokeWidth="0.9" strokeLinecap="round" />
          })}
          <circle cx={curve.at(0)[0]} cy={curve.at(0)[1]} r="2.9" fill={GOLD} />
          <ellipse cx={tsuba[0]} cy={tsuba[1]} rx="1.5" ry="5.8" fill={GOLD} stroke="#c79a30" strokeWidth="0.4" transform={`rotate(${tsubaAngle} ${tsuba[0]} ${tsuba[1]})`} />
        </g>
      ) : null}
    </>
  )
}

/* ───────── まわりの もの ───────── */

function Workshop({ t }: SceneProps) {
  const pop = span(t, 0, 0.6, backOut)
  return (
    <>
      <Room floor={84} window={null} wall={WALL} floorColor={FLOOR} />
      {/* かたなを たてかける だい(1画目) */}
      <Layer scale={pop} origin={[55, 84]}>
        <ellipse cx="67" cy="85.4" rx="12" ry="2" fill="#000000" opacity="0.1" />
        <Bone char={CHAR} n={1} color={BARK} width={5.4} />
      </Layer>
    </>
  )
}

/** 水の おけ(ながい はこ)。うしろの ふち・かたな・まえの かべ の じゅんに 重ねる */
function TubBack({ t }: SceneProps) {
  const pop = span(t, 0.1, 0.65, backOut)
  return (
    <Layer scale={pop} origin={[33, 90]}>
      <ellipse cx="33" cy="70" rx="31" ry="3.6" fill={TUB_DARK} />
      <ellipse cx="33" cy="70.2" rx="29" ry="2.8" fill={WATER} />
      <ellipse cx="25" cy="69.6" rx="9" ry="0.9" fill={WATER_LIGHT} />
    </Layer>
  )
}

function TubFront({ t }: SceneProps) {
  const pop = span(t, 0.1, 0.65, backOut)
  return (
    <Layer scale={pop} origin={[33, 90]}>
      <path d="M2 70 Q33 76 64 70 V88 Q64 91 61 91 H5 Q2 91 2 88 Z" fill={TUB} />
      <path d="M2 79 Q33 85 64 79 V81.4 Q33 87.4 2 81.4 Z" fill={TUB_BAND} />
      <path d="M2 70 Q33 76 64 70" fill="none" stroke={TUB_DARK} strokeWidth="1.2" />
    </Layer>
  )
}

/** ジュッ と ひやした ときの けむり。おけの上から ふわっと のぼる */
function Steam({ t }: SceneProps) {
  const show = during(t, QUENCH, LIFT + 1.2, 0.25)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const p = ((t - QUENCH + i * 0.3) % 1.8) / 1.8
        return <circle key={i} cx={8 + i * 9.4 + Math.sin(p * 6 + i) * 2.2} cy={68 - p * 30} r={2.6 + p * 4.2} fill="#ffffff" stroke="#d5e1ee" strokeWidth="0.6" opacity={Math.sin(p * Math.PI) * 0.92} />
      })}
    </g>
  )
}

/** かたなから ぽたぽた おちる 水 */
function Drips({ t }: SceneProps) {
  const show = during(t, LIFT + 0.2, WRAPPED + 0.5, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 1, 2].map((i) => {
        const p = ((t - LIFT + i * 0.27) % 0.8) / 0.8
        return <path key={i} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill={WATER} transform={`translate(${10 + i * 15} ${62 + p * 8})`} opacity={1 - p} />
      })}
    </g>
  )
}

/** かたなの 上を すべる きらり */
function Glint({ t, pose }: { readonly t: number; readonly pose: SwordPose }) {
  const p = span(t, PROP + 0.9, INK - 0.2)
  if (p <= 0 || p >= 1) return null
  const [x, y] = swordCurve(pose).at(lerp(0.35, 0.92, p))
  return <Star cx={x + 1.5} cy={y} r={3.8 * Math.sin(p * Math.PI)} color="#ffffff" spin={p * 120} />
}

/** はちまき(あたまの まんなか が 0,0、半径 1。右むきの 形。うしろへ むすび目) */
const HEADBAND = (
  <g fill="none" stroke="#ffffff" strokeLinecap="round">
    <path d="M-0.97 -0.2 Q0 -0.68 0.97 -0.2" strokeWidth="0.3" />
    <path d="M-0.92 -0.28 q-0.5 -0.15 -0.85 0.12 M-0.92 -0.26 q-0.55 0.15 -0.7 0.55" strokeWidth="0.2" />
  </g>
)

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 2)

  // あるいてくる: 右から 入って、おけの そばで とまる。だいに たてかけるとき、かたなを とどかせる ため 一歩 左へ
  const come = walk(t, { from: SMITH_X + 40, to: SMITH_X, start: WALK, end: ARRIVE, build: 'adult', height: SMITH_HEIGHT, armSwing: 10 })
  const shift = walk(t, { from: SMITH_X, to: SMITH_X - 4, start: PROP, end: PROP + 1.0, build: 'adult', height: SMITH_HEIGHT })
  const body = t < PROP ? come : shift

  // かたな: まっかな まっすぐな 鉄の ぼう → 水で ひえて そる → つかを つけて だいへ
  const lower = span(t, DIP, QUENCH, easeInOut) - span(t, LIFT, LIFT + 0.6, easeInOut)
  const toStand = span(t, PROP, PROP + 1.0, easeInOut)
  const hold: Vec = [body.x - 10, 62 + 9 * lower]
  const finalGrip: Vec = [FINAL_HILT[0] + Math.cos((FINAL_ANGLE * Math.PI) / 180) * GRIP_NEAR * CHORD, FINAL_HILT[1] + Math.sin((FINAL_ANGLE * Math.PI) / 180) * GRIP_NEAR * CHORD]
  const gripAt = lerpVec(hold, finalGrip, toStand)
  const angle = lerp(180, FINAL_ANGLE, toStand)
  const rad = (angle * Math.PI) / 180
  const hilt: Vec = [gripAt[0] - Math.cos(rad) * GRIP_NEAR * CHORD, gripAt[1] - Math.sin(rad) * GRIP_NEAR * CHORD]
  const pose: SwordPose = { hilt, angle, bend: span(t, QUENCH + 0.4, LIFT + 0.8, easeInOut) }
  const heat = 1 - span(t, QUENCH, LIFT + 0.6)
  const wrap = span(t, WRAPPED, WRAPPED + 0.3)
  const curve = swordCurve(pose)
  const sword = (
    <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
      <Sword pose={pose} heat={heat} wrap={wrap} />
    </Layer>
  )

  // 人: 左むき。てまえ = 右の 手(つかの 上)、むこう = 左の 手(つかの 下)。おけに おろす ときは 上体を まえへ
  const face = t < QUENCH - 0.1 ? 'worried' : t < LIFT ? 'strain' : t < WRAPPED ? 'surprised' : 'joy'
  const stoop = 14 * Math.max(0, lower)
  const place = {
    ...body,
    y: GROUND,
    pose: { ...body.pose, rightArm: { to: curve.at(GRIP_NEAR) }, leftArm: { to: curve.at(GRIP_FAR) }, torso: stoop, head: face === 'worried' ? 2 : face === 'strain' ? -3 : 3 } satisfies PersonPose,
  }
  const head = personRig({ ...place, build: 'adult', height: SMITH_HEIGHT }).world.head
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const pop = Math.sin(span(t, WRAPPED, WRAPPED + 0.4) * Math.PI)
  const grip = curve.at(GRIP_NEAR)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Workshop t={t} />
        <TubBack t={t} />
        {/* 水に つかっている間は おけの かべの うしろ。引きあげたら おけの まえに出す */}
        {t < LIFT + 0.5 ? sword : null}
        <TubFront t={t} />
        {t >= LIFT + 0.5 ? sword : null}
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <Person {...place} build="adult" height={SMITH_HEIGHT} look={SMITH_LOOK} face={face} headwear={HEADBAND} />
        </Layer>
        <Sweat t={t} x={head[0] - 9} y={head[1] - 6} show={during(t, WALK + 0.3, DIP + 0.2, 0.2)} />
        <Steam t={t} />
        <Drips t={t} />
        {pop > 0 ? <Star cx={grip[0] + 2} cy={grip[1] - 6} r={4 * pop} color={GOLD} spin={pop * 90} /> : null}
        <Glint t={t} pose={pose} />
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
    { at: 0, label: 'かじばが できる', sound: 'pop' },
    { at: WALK, label: 'かじやさんが まっかな 鉄の ぼうを もって くる' },
    { at: DIP, label: '水の おけに おろす' },
    { at: QUENCH, label: 'ジュッ と ひやす。けむりが ふわっ', sound: 'pop' },
    { at: LIFT, label: '引きあげると、はが そっている' },
    { at: PROP, label: 'つかを つけて、だいに たてかける' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '刀 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
