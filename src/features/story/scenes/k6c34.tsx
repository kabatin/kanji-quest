/*
 * 水(みず): いわの下から わきでた 水が まんなかを ながれ、りょうがわに しぶきが とぶ。
 *
 * ほね(画と絵の対応)
 *   1画目(亅)  … いわの すきまから わきでて、がけを おちて 地面を ながれる 水の ながれ
 *   2画目      … ながれが 地面に あたって、左に とびちる しぶき
 *   3画目      … ながれの そばから、右うえに とびちる しぶき
 *   4画目      … ながれの そばから、右したに とびちる しぶき
 *
 * ながれ
 *   お日さまが かんかん。のどが かわいた うさぎが ぐったり
 *   → おおきな いわの下が しめっているのに 気づいて、耳が ぴん
 *   → うんしょ と いわを おす → いわが ごろごろ ころがって、水が ぷしゅー と わきだす
 *   → 水が がけを おちて 地面を ながれ、しぶきが とぶ。うさぎは 大よろこび
 *   → ほね が ひかって、絵が うすくなり、字「水」が のこる
 *
 * うさぎは 部品が まだ ないので 元の 絵のまま。お日さま・のはら は 共通部品(Sun・Meadow)。
 * うさぎ・いわ・水は、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うさぎは 耳が 長く、うで は かた から出て ひじ で まがる。いわは まるく ころがる。
 *   水は 上から 下へ ながれ、しぶきは ぶつかった ところから 外へ とぶ。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Meadow, Sun } from '../sceneFigures'

const CHAR = '水'

const FUR = '#efe2d2'
const FUR_SHADE = '#d9c3ab'
const BELLY = '#fffaf2'
const EAR_IN = '#f7b6bd'
const EYE = '#2b2b2b'
const NOSE = '#f08a9a'
const MOUTH = '#b9483f'
const TONGUE = '#ff8a8a'
const CHEEK = '#ff9d9d'
const ROCK = '#a89c8c'
const ROCK_DARK = '#8f8374'
const HOLE = '#5e554b'
const BOULDER_COLOR = '#b9bcc2'
const BOULDER_DARK = '#9a9ea6'
const BOULDER_LIGHT = '#d9dce0'
const EARTH = '#d9b98c'
const EARTH_DARK = '#c3a074'
const CAP = '#8bd69a'
const MEADOW = '#e2f2d2'
const LEAF = '#55b86e'
const WATER = '#7cc4f2'
const WATER_LIGHT = '#e8f6ff'
const WATER_SHADE = '#56aae6'
const POOL = '#a9d9f7'
const DRY = '#e8d3a8'
const DRY_CRACK = '#c9ad7a'

/** くぎり の時間(秒) */
const NOTICE = 2.0
const PUSH = 3.0
const GUSH = 4.3
const SPLASH = 5.0
const INK = 6.4
const DONE = 9.2
const DURATION = 9.8

/** がけの うえの 地面の高さ(うさぎの 足もと) */
const LEDGE_Y = 30
/** うさぎの 足もと の x と、大きさ */
const RABBIT_X = 37.5
const RABBIT_SCALE = 0.72
/** いわの 中心(いわの すきま)と、はんけい */
const BOULDER: readonly [number, number] = [55, 19]
const BOULDER_R = 7.5
/** 水が わきでる ところ(1画目の はじまり の すこし下) */
const SPRING: readonly [number, number] = [53.6, 18]
/** ながれが 地面に あたる ところ(しぶきの もと) */
const IMPACT: readonly [number, number] = [54.6, 43]

/** がけ(上は 草、下は 土)と、いわの でっぱり、下の 草はら */
function Land({ t }: SceneProps) {
  const rise = span(t, 0, 0.5, easeOut)
  return (
    <Layer opacity={rise}>
      <path d="M0 43 Q54 48 109 43 V101 H0 Z" fill={MEADOW} />
      <Meadow y={98} tufts={[8, 30, 78, 100]} />
      {/* いわの でっぱり(水の もと) */}
      <path d="M41 32 Q40 12 47 7 Q55 3 63 7 Q70 12 68 32 Z" fill={ROCK} />
      <path d="M62 8 Q69 12 68 32 L60 32 Q63 18 62 8 Z" fill={ROCK_DARK} />
      <ellipse cx={SPRING[0] + 0.4} cy={SPRING[1] + 1} rx="7.6" ry="8.6" fill={HOLE} />
      {/* がけ */}
      <path d="M4 31.5 Q16 29 32 30 L78 30 Q94 29 105 31.5 L105 41 Q54 46 4 41 Z" fill={EARTH} />
      <path d="M4 41 Q54 46 105 41 L105 38.6 Q54 43.6 4 38.6 Z" fill={EARTH_DARK} />
      <path d="M4 31.5 Q16 29 32 30 L78 30 Q94 29 105 31.5 L105 34 Q54 35.4 4 34 Z" fill={CAP} />
      {[12, 24, 80, 96].map((x) => (
        <path key={x} d={`M${x} 30.2 l1 -2.6 l0.8 2.4 l1.2 -3 l0.6 3.2 Z`} fill={LEAF} />
      ))}
    </Layer>
  )
}

/** いわの下から しみだす しずく(うさぎが 気づく きっかけ) */
function Seep({ t }: SceneProps) {
  const show = during(t, NOTICE - 0.3, GUSH, 0.3)
  if (show <= 0) return null
  const p = ((t - NOTICE + 0.3) % 0.9) / 0.9
  return (
    <g opacity={show}>
      <ellipse cx="50.5" cy="27.6" rx={2 + 0.8 * Math.sin(p * Math.PI)} ry="0.9" fill={WATER_SHADE} opacity="0.6" />
      <Drop x={50.5} y={22.5 + p * 4.5} r={0.9} rotate={0} color={WATER} />
    </g>
  )
}

/** しずく(さきが 上。rotate は 上から 時計まわりの角度) */
function Drop({ x, y, r, rotate, color }: { readonly x: number; readonly y: number; readonly r: number; readonly rotate: number; readonly color: string }) {
  if (r <= 0) return null
  const d = `M0 ${-1.6 * r} C${0.5 * r} ${-0.6 * r} ${r} ${0.1 * r} ${r} ${0.7 * r} A${r} ${r} 0 0 1 ${-r} ${0.7 * r} C${-r} ${0.1 * r} ${-0.5 * r} ${-0.6 * r} 0 ${-1.6 * r} Z`
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <path d={d} fill={color} />
      <circle cx={-0.35 * r} cy={0.45 * r} r={0.28 * r} fill={WATER_LIGHT} />
    </g>
  )
}

type Mood = 'tired' | 'alert' | 'push' | 'shock' | 'joy'

/** うで の かっこう。swing = ま下から まえへ ふった角度 / bend = ひじ の まがり(まえへ) */
type ArmPose = { readonly swing: number; readonly bend: number }

/** うさぎの かた(うさぎの 内がわの 座標) */
const SHOULDER: readonly [number, number] = [3, -14]
const ARM_PART = 4.6

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。 */
function Arm({ pose, color }: { readonly pose: ArmPose; readonly color: string }) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const elbow = [SHOULDER[0] + Math.sin(rad(pose.swing)) * ARM_PART, SHOULDER[1] + Math.cos(rad(pose.swing)) * ARM_PART] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] + Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART] as const
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.1" fill={color} />
    </>
  )
}

/** みみ。かた(つけね)を じく に ふる。angle = ま上から の角度(うしろへ たおすと マイナス) */
function Ear({ angle, px, py, back }: { readonly angle: number; readonly px: number; readonly py: number; readonly back?: boolean }) {
  return (
    <Layer x={px} y={py} rotate={angle}>
      <ellipse cx="0" cy="-5.6" rx="2.1" ry="6.2" fill={back ? FUR_SHADE : FUR} />
      <ellipse cx="0.1" cy="-5.2" rx="1.0" ry="4.2" fill={EAR_IN} />
    </Layer>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="3.8" cy="-20" r="1.7" fill={CHEEK} opacity="0.55" />
      {mood === 'tired' && (
        <>
          <path d="M4 -23.3 L6.6 -22.8" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M3.6 -25 L6.6 -24" stroke={FUR_SHADE} strokeWidth="1" strokeLinecap="round" />
          <path d="M5 -19.4 Q6.4 -18.6 7.6 -19.4" fill="none" stroke={MOUTH} strokeWidth="0.9" strokeLinecap="round" />
          <ellipse cx="6.4" cy="-17.4" rx="1.1" ry="1.8" fill={TONGUE} />
        </>
      )}
      {mood === 'alert' && (
        <>
          <circle cx="5.2" cy="-23.2" r="1.4" fill={EYE} />
          <circle cx="5.6" cy="-23.7" r="0.45" fill="#ffffff" />
          <path d="M5.2 -19.2 Q6.4 -18.4 7.4 -19.2" fill="none" stroke={MOUTH} strokeWidth="0.9" strokeLinecap="round" />
        </>
      )}
      {mood === 'push' && (
        <>
          <path d="M4.2 -24.6 L6.4 -23.2 L4.2 -21.8" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4.8 -19 L7.4 -19" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'shock' && (
        <>
          <circle cx="5.2" cy="-23.2" r="1.9" fill="#ffffff" stroke={EYE} strokeWidth="0.5" />
          <circle cx="5.5" cy="-23.2" r="0.9" fill={EYE} />
          <ellipse cx="6.2" cy="-18.6" rx="1" ry="1.4" fill={MOUTH} />
        </>
      )}
      {mood === 'joy' && (
        <>
          <path d="M4 -22.6 Q5.3 -24.9 6.6 -22.6" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M4.6 -19.8 Q6.2 -16.6 7.6 -19.8 Z" fill={MOUTH} />
        </>
      )}
      <ellipse cx="7.9" cy="-21.4" rx="1.1" ry="0.8" fill={NOSE} />
    </>
  )
}

type RabbitProps = {
  readonly mood: Mood
  readonly nearArm: ArmPose
  readonly farArm: ArmPose
  readonly earFront: number
  readonly earBack: number
  readonly headTilt: number
  readonly breath: number
}

/** うさぎ(右むき。足もとが 0,0)。耳は 長く、うで は かた から。 */
function Rabbit({ mood, nearArm, farArm, earFront, earBack, headTilt, breath }: RabbitProps) {
  return (
    <>
      <Arm pose={farArm} color={FUR_SHADE} />
      <circle cx="-6.8" cy="-6.6" r="2.8" fill={BELLY} stroke={FUR_SHADE} strokeWidth="0.6" />
      <ellipse cx="-1" cy="-3.4" rx="4.6" ry="3.4" fill={FUR_SHADE} />
      <ellipse cx="3.4" cy="-1.1" rx="5" ry="1.9" fill={FUR} />
      <Layer scaleX={1 + breath * 0.04} scaleY={1 + breath * 0.03} origin={[0, -2]}>
        <ellipse cx="0" cy="-10" rx="6.6" ry="8.4" fill={FUR} />
        <ellipse cx="1.8" cy="-9" rx="3.6" ry="6" fill={BELLY} />
      </Layer>
      <Arm pose={nearArm} color={FUR} />
      <Layer rotate={headTilt} origin={[1.5, -17]}>
        <Ear angle={earBack} px={0.4} py={-27} back />
        <Ear angle={earFront} px={3.6} py={-27.4} />
        <circle cx="2.6" cy="-22.5" r="6.2" fill={FUR} />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

/** あつくて かいた あせ(うさぎの あたまの そば) */
function Sweat({ t }: SceneProps) {
  const show = during(t, 0.5, NOTICE + 0.2, 0.25)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.5].map((offset) => {
        const p = ((t + offset) % 1) / 1
        return <Drop key={offset} x={RABBIT_X - 4.5 - p * 3} y={9 + p * 8} r={0.9} rotate={-20} color={WATER} />
      })}
    </g>
  )
}

/** いわ。ころがるとき、まるいので くるくる まわる */
function Boulder({ x, y, rotate }: { readonly x: number; readonly y: number; readonly rotate: number }) {
  return (
    <Layer x={x} y={y} rotate={rotate}>
      <circle cx="0" cy="0" r={BOULDER_R} fill={BOULDER_DARK} />
      <circle cx="-0.6" cy="-0.7" r={BOULDER_R - 1.1} fill={BOULDER_COLOR} />
      <circle cx="-2.6" cy="-3" r="2.3" fill={BOULDER_LIGHT} />
      <path d="M1.5 -1 l2 2.4 l-1 2.4" fill="none" stroke={BOULDER_DARK} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
    </Layer>
  )
}

/** いわが どいた しゅんかん、すきまから ぷしゅー と とびだす しずく */
function Spurt({ t }: SceneProps) {
  const p = span(t, GUSH + 0.05, GUSH + 0.85)
  if (p <= 0 || p >= 1) return null
  const spread = [-7, -3.6, 0, 3.6, 7]
  return (
    <g opacity={1 - p ** 2}>
      {spread.map((vx, i) => {
        const lift = 15 + (i % 2) * 3
        const x = SPRING[0] + vx * (0.35 + p) * 1.4
        const y = SPRING[1] - 4 + (-lift * p + 17 * p * p)
        return <Drop key={vx} x={x} y={y} r={0.85} rotate={vx * 5 + p * 60 * Math.sign(vx)} color={WATER} />
      })}
    </g>
  )
}

/** 1画目の 水の ながれ。上から 下へ のびて、ひかる すじが ながれていく */
function Stream({ t }: SceneProps) {
  const front = span(t, GUSH + 0.1, GUSH + 1.7, easeInOut)
  if (front <= 0) return null
  // わきだしは ほそく はじまり、だんだん ふとくなる
  const swell = Math.min(1, 0.45 + front * 3)
  const glints = [0, 0.34, 0.67].map((offset) => {
    const head = (((t - GUSH) * 0.55 + offset) % 1) * front
    return { key: offset, from: Math.max(0, head - 0.09), to: head }
  })
  return (
    <>
      <Bone char={CHAR} n={1} color={WATER_SHADE} width={7.6 * swell} to={front} />
      <Bone char={CHAR} n={1} color={WATER} width={6 * swell} to={front} />
      {glints.map((g) => (
        <Bone key={g.key} char={CHAR} n={1} color={WATER_LIGHT} width={2.2} from={g.from} to={g.to} />
      ))}
    </>
  )
}

/** 水が 地面に あたる ところの あわ と、下に できる みずたまり */
function Pool({ t }: SceneProps) {
  const foam = span(t, GUSH + 0.8, SPLASH + 0.3, backOut)
  const pool = span(t, GUSH + 1.4, GUSH + 2.6, easeOut)
  const ripple = span(t, GUSH + 1.6, INK + 1)
  return (
    <>
      <ellipse cx="52" cy="92.5" rx="19" ry="5.2" fill={DRY} />
      <path d="M38 91 l3 1.4 l-1 2.4 M66 92 l-3 1.2 l1.2 2.2 M52 96.4 l0.8 -2.2" fill="none" stroke={DRY_CRACK} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="51" cy="92.5" rx={Math.max(0, 19 * pool)} ry={Math.max(0, 5.2 * pool)} fill={POOL} />
      <ellipse cx="48" cy="91.6" rx={Math.max(0, 7 * pool)} ry={Math.max(0, 1.5 * pool)} fill={WATER_LIGHT} opacity="0.8" />
      {ripple > 0 && ripple < 1 && <ellipse cx="51" cy="92.5" rx={4 + 12 * ripple} ry={1.2 + 3.2 * ripple} fill="none" stroke={WATER_LIGHT} strokeWidth="0.8" opacity={1 - ripple} />}
      <ellipse cx={IMPACT[0]} cy={IMPACT[1] + 0.8} rx={Math.max(0, 7 * foam)} ry={Math.max(0, 2.2 * foam)} fill="#ffffff" opacity="0.9" />
      <ellipse cx={IMPACT[0]} cy={IMPACT[1] + 1.2} rx={Math.max(0, 4.6 * foam)} ry={Math.max(0, 1.3 * foam)} fill={WATER_LIGHT} />
    </>
  )
}

type Point = readonly [number, number]
/** 2〜4画目の 線の上の 点(画の とおり道)。ここに しぶきが ならぶ */
const SPRAY_LEFT: readonly Point[] = [[17.5, 45.8], [27, 44.4], [36.1, 41.4], [41, 45], [36.5, 54], [30, 63], [25, 69], [19, 74.8]]
const SPRAY_UP_RIGHT: readonly Point[] = [[81.2, 27.5], [77, 32.5], [72.3, 36.3], [66, 40.2], [60, 43.2]]
const SPRAY_DOWN_RIGHT: readonly Point[] = [[58, 47], [63.5, 53], [70.7, 61.1], [77, 66.5], [83.5, 71.2], [91.5, 76.6]]

/** ながれの あたった ところ から、ぶつかった いきおいで 外へ とぶ しぶき。ならんだ しずくが 画の線に なる */
function Spray({ t }: SceneProps) {
  const groups: readonly (readonly Point[])[] = [SPRAY_LEFT, SPRAY_UP_RIGHT, SPRAY_DOWN_RIGHT]
  return (
    <>
      {groups.flatMap((points, g) =>
        points.map(([tx, ty], i) => {
          // 近い しずくから、順に とびだす
          const dist = Math.hypot(tx - IMPACT[0], ty - IMPACT[1])
          const start = SPLASH + dist * 0.012 + g * 0.05
          const p = span(t, start, start + 0.55, easeOut)
          if (p <= 0) return null
          const x = IMPACT[0] + (tx - IMPACT[0]) * p
          const y = IMPACT[1] + (ty - IMPACT[1]) * p - Math.sin(p * Math.PI) * 6
          const size = (i % 2 === 0 ? 1.9 : 1.5) * Math.min(1, p * 2)
          const angle = (Math.atan2(tx - IMPACT[0], IMPACT[1] - ty) * 180) / Math.PI
          return <Drop key={`${g}-${i}`} x={x} y={y} r={size} rotate={angle * (1 - p) * 0.6} color={WATER} />
        }),
      )}
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  // うさぎの うごき
  const pushAmt = span(t, PUSH + 0.3, GUSH - 0.1, easeInOut)
  const mood: Mood = t < NOTICE ? 'tired' : t < PUSH ? 'alert' : t < GUSH ? 'push' : t < SPLASH ? 'shock' : 'joy'
  const droop = 1 - span(t, NOTICE - 0.1, NOTICE + 0.25, easeOut)
  const joy = span(t, SPLASH, SPLASH + 0.3)
  const happyBeat = wave(t, 0.5)
  const earFront = -72 * droop - 8 * pushAmt * (1 - span(t, GUSH, GUSH + 0.2)) + (t >= GUSH ? 10 + joy * (4 + happyBeat * 6) : 0)
  const earBack = -88 * droop - 12 * pushAmt * (1 - span(t, GUSH, GUSH + 0.2)) + (t >= GUSH ? 4 + joy * (-2 - happyBeat * 5) : 0)
  const panting = t < NOTICE ? wave(t, 0.45) : 0
  // うで: ぐったり → 耳を ぴん → いわを おす → ばんざい
  const raise = span(t, GUSH, GUSH + 0.4, easeOut)
  const swing = 4 + 16 * span(t, NOTICE, NOTICE + 0.4) + 65 * span(t, PUSH - 0.1, PUSH + 0.3) + 60 * raise + joy * happyBeat * 10
  const nearArm: ArmPose = { swing, bend: t < GUSH ? 8 : 6 }
  const farArm: ArmPose = { swing: swing - (t < GUSH && t >= PUSH ? 4 : 0), bend: t < GUSH ? 8 : 6 }
  // からだ: いわを おすとき まえに かたむき、足を 少し ふみだす。よろこぶと はねる
  const lean = 7 * pushAmt * (1 - raise)
  const stepX = 2.5 * pushAmt
  const hop = Math.abs(wave(t, 0.7, 0.2)) * 4.2 * joy * (1 - span(t, INK + 0.3, INK + 0.6))
  const rabbitX = RABBIT_X + stepX
  const headTilt = 9 * droop - 4 * joy

  // いわ: おされて すこし うごき、ごろごろ ころがる
  const roll = span(t, GUSH, GUSH + 1.0, easeIn)
  const shift = 3 * pushAmt + 66 * roll
  const settle = 3.4 * span(roll, 0.05, 0.35)
  const boulderX = BOULDER[0] + shift + wave(t, 0.22) * 0.5 * (pushAmt > 0.05 && roll <= 0 ? 1 : 0)
  const boulderY = BOULDER[1] + settle
  const boulderGone = boulderX > 125

  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sun t={t} x={96} y={13} />
        <Land t={t} />
        <Seep t={t} />
        <Layer opacity={span(t, 0.1, 0.5)}>
          <ellipse cx={rabbitX + 1} cy={LEDGE_Y + 0.8} rx="8.5" ry="1.6" fill="#000000" opacity="0.12" />
          <Layer x={rabbitX} y={LEDGE_Y - hop} rotate={lean} scale={RABBIT_SCALE}>
            <Layer scaleY={1 + panting * 0.02} origin={[0, 0]}>
              <Rabbit mood={mood} nearArm={nearArm} farArm={farArm} earFront={earFront} earBack={earBack} headTilt={headTilt} breath={panting} />
            </Layer>
          </Layer>
          <Sweat t={t} />
        </Layer>
        {!boulderGone && (
          <Layer opacity={span(t, 0.1, 0.5)}>
            <Boulder x={boulderX} y={boulderY} rotate={shift * 7.6} />
          </Layer>
        )}
        <Spurt t={t} />
        <Pool t={t} />
        <Stream t={t} />
        <Spray t={t} />
        {joy > 0 && t < INK + 0.5 && (
          <>
            <Star cx={RABBIT_X - 9} cy={10 - hop} r={2.2} color="#ffd95a" spin={t * 120} />
            <Star cx={RABBIT_X + 12} cy={6 - hop} r={1.8} color="#ffffff" spin={-t * 100} />
          </>
        )}
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
    { at: 0, label: 'お日さまが かんかん。うさぎは のどが かわいて ぐったり', sound: 'pop' },
    { at: NOTICE, label: 'いわの下が しめっている。耳が ぴん' },
    { at: PUSH, label: 'うんしょ と いわを おす' },
    { at: GUSH, label: 'いわが ころがって、水が わきだす', sound: 'pop' },
    { at: SPLASH, label: '水が ながれて しぶきが とぶ。うさぎは 大よろこび' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '水 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
