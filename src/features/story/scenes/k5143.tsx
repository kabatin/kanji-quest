/*
 * 元(もと): あたまは からだの いちばん うえ。はじまり。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … あたまに かぶった ぼうしの つば(あたまの いちばん うえ)
 *   2画目(一)  … 「ばんざい」で よこに ひろげた りょううで(かた の たかさ)
 *   3画目(ノ)  … ひだりの あし(ジャンプで ひらいた あし)
 *   4画目(乚)  … みぎの あし(おなじく ひらいた あし)
 *   (あし は こし から ひらくので、画と だいたい おなじ場所・向き になる。ぴったりでは なくて よい)
 *
 * ながれ
 *   子どもが ぼうしを かぶって たっている(あたまの いちばん上に ぼうし)
 *   → つよい かぜで ぼうしが とんでいく。子どもは おどろいて、あたまを見あげ、てを のばして ジャンプ
 *   → ぼうしは ひらひら おちてきて、あたまの いちばん上に ぽん と のる(「ここが いちばん上」)
 *   → 子どもは うれしくて、りょうてと りょうあしを ひろげて ばんざいジャンプ
 *   → ほね が ひかって、絵が うすくなり、字「元」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   かた から うで が出て ひじ で まがる。くび は みじかく どう の まんなか の上。
 *   あし は こし から。ジャンプ すると、あし を ひらくぶん、こし が 上がる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '元'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#ef7d57'
const SHIRT_DARK = '#d9633f'
const PANTS = '#4a5f8c'
const PANTS_DARK = '#3c4f78'
const SHOE = '#6b4a36'
const STRAW = '#f2c35a'
const STRAW_DARK = '#d9a53a'
const BAND = '#e8534a'
const LEAF = '#55b86e'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const WIND = '#9fc7e8'
const CHEEK = '#ff9d9d'
const MOUTH = '#b9483f'
const EYE = '#2b2b2b'

/** くぎり の時間(秒) */
const POP = 0.2
/** かぜが ふいて、ぼうしが とぶ */
const GUST = 1.5
const FLY_END = 2.5
const FLOAT_END = 3.6
/** ぼうしが あたまに のる */
const LAND = 4.6
/** ばんざいジャンプ */
const CHEER = 4.85
const INK = 5.9
const DONE = 8.5
const DURATION = 9

/** 子どもの からだ(体は 足もと y=94 を じく。こし=68 が 立っているときの たかさ) */
const GROUND = 94
const HIP_Y = 68
const LEG = 26
const HIP_X = { left: 46, right: 56 } as const
const SHOULDER_X = { left: 43, right: 59 } as const
/** こし から かた までの たかさ */
const SHOULDER_UP = 23
const ARM_PART = 14.5
const HEAD: readonly [number, number] = [51, 29]
const NECK: readonly [number, number] = [51, 40]
/** ばんざいジャンプの いちばん たかい所の 高さ(あし を 45度 ひらいた とき、こし が 画と おなじ たかさ になる) */
const JUMP_H = 7.6
const SPREAD = 45

type Side = 'left' | 'right'
const sideSign = (side: Side) => (side === 'left' ? -1 : 1)
const rad = (deg: number) => (deg * Math.PI) / 180

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
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="-6" cy="38" rx="7" ry="3.4" />
        <ellipse cx="-1" cy="36" rx="5" ry="3.4" />
        <ellipse cx="96" cy="50" rx="6" ry="2.8" />
        <ellipse cx="100.5" cy="48.4" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 36, 78, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** かぜの すじ。左から 右へ ながれる。ぼうしが とぶ ころ だけ 出る。 */
function WindStreaks({ t }: SceneProps) {
  const show = during(t, GUST - 0.15, FLOAT_END - 0.4, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show * 0.9} fill="none" stroke={WIND} strokeWidth="1.4" strokeLinecap="round">
      {[
        { y: 24, w: 22, off: 0 },
        { y: 52, w: 28, off: 40 },
        { y: 70, w: 20, off: 85 },
      ].map(({ y, w, off }) => {
        const x = -40 + (((t - GUST) * 95 + off) % 160)
        return <path key={y} d={`M${x} ${y} q${w * 0.3} -3 ${w * 0.55} 0 t${w * 0.45} 0`} />
      })}
    </g>
  )
}

type Mood = 'calm' | 'worried' | 'happy'
type ArmPose = { readonly upper: number; readonly fore: number }

/** かた から出て、ひじ で まがる うで。upper・fore は ま下から そとへ ひらいた角度(90 = よこ、180 = ま上)。 */
function Arm({ side, pose, y }: { readonly side: Side; readonly pose: ArmPose; readonly y: number }) {
  const s = sideSign(side)
  const sx = SHOULDER_X[side]
  const sy = y
  const ex = sx + s * Math.sin(rad(pose.upper)) * ARM_PART
  const ey = sy - Math.cos(rad(pose.upper)) * -ARM_PART
  const hx = ex + s * Math.sin(rad(pose.fore)) * ARM_PART
  const hy = ey - Math.cos(rad(pose.fore)) * -ARM_PART
  return (
    <>
      <path d={`M${sx} ${sy} L${ex} ${ey} L${hx} ${hy}`} fill="none" stroke={SHIRT_DARK} strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hx} cy={hy} r="3.5" fill={SKIN} />
    </>
  )
}

/** あし。こし から まっすぐ のびて、さきに くつ。 */
function Leg({ side, angle, y }: { readonly side: Side; readonly angle: number; readonly y: number }) {
  const s = sideSign(side)
  const hx = HIP_X[side]
  const fx = hx + s * Math.sin(rad(angle)) * LEG
  const fy = y + Math.cos(rad(angle)) * LEG
  return (
    <>
      <path d={`M${hx} ${y} L${fx} ${fy}`} stroke={side === 'left' ? PANTS : PANTS_DARK} strokeWidth="7" strokeLinecap="round" />
      <ellipse cx={fx + s * 1.6} cy={fy + 0.8} rx="5" ry="2.7" fill={SHOE} transform={`rotate(${-s * angle * 0.7} ${fx} ${fy})`} />
    </>
  )
}

function Face({ mood, lookX, lookY }: { readonly mood: Mood; readonly lookX: number; readonly lookY: number }) {
  const ex = lookX * 1.1
  const ey = lookY * 0.9
  return (
    <>
      <circle cx="43.4" cy="34" r="2" fill={CHEEK} opacity="0.55" />
      <circle cx="58.6" cy="34" r="2" fill={CHEEK} opacity="0.55" />
      {mood === 'happy' ? (
        <>
          <path d="M44.2 31.2 Q46.8 28.4 49.4 31.2" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M52.6 31.2 Q55.2 28.4 57.8 31.2" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M46.8 34.2 Q51 40.4 55.2 34.2 Z" fill={MOUTH} />
        </>
      ) : (
        <>
          <circle cx={46.8 + ex} cy={30.6 + ey} r="1.3" fill={EYE} />
          <circle cx={55.2 + ex} cy={30.6 + ey} r="1.3" fill={EYE} />
          {mood === 'worried' ? (
            <>
              <path d="M43.6 27.6 L49 25.8 M53 25.8 L58.4 27.6" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
              <ellipse cx="51" cy="36" rx="1.5" ry="1.9" fill={MOUTH} />
            </>
          ) : (
            <path d="M48.4 34.6 Q51 36.8 53.6 34.6" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
          )}
        </>
      )}
    </>
  )
}

type KidProps = {
  readonly mood: Mood
  readonly legAngle: number
  readonly armLeft: ArmPose
  readonly armRight: ArmPose
  readonly lookX: number
  readonly lookY: number
  readonly headTilt: number
  /** からだの 上下(こし の 上がり ぐあい。ジャンプや あし の ひらき で かわる) */
  readonly hipY: number
}

function Kid({ mood, legAngle, armLeft, armRight, lookX, lookY, headTilt, hipY }: KidProps) {
  const shoulderY = hipY - SHOULDER_UP
  return (
    <>
      <Leg side="left" angle={legAngle} y={hipY} />
      <Leg side="right" angle={legAngle} y={hipY} />
      {/* くび: どう と あたま の間を みじかく つなぐ */}
      <rect x="48.4" y={hipY - 31} width="5.2" height="8" rx="2.4" fill={SKIN_SHADE} />
      <rect x="42" y={hipY - 27} width="18" height="29" rx="6.5" fill={SHIRT} />
      <path d={`M43.6 ${hipY - 4} h14.8`} stroke={SHIRT_DARK} strokeWidth="1.4" strokeLinecap="round" />
      <Arm side="left" pose={armLeft} y={shoulderY} />
      <Arm side="right" pose={armRight} y={shoulderY} />
      <Layer rotate={headTilt} origin={[NECK[0], hipY - 28]}>
        <g transform={`translate(0 ${hipY - HIP_Y})`}>
          <circle cx="40" cy="31" r="2.4" fill={SKIN_SHADE} />
          <circle cx="62" cy="31" r="2.4" fill={SKIN_SHADE} />
          <circle cx={HEAD[0]} cy={HEAD[1]} r="11" fill={SKIN} />
          <path d="M39.6 29 C38.5 16.5 63.5 16.5 62.4 29 C60.5 24.5 56 22.8 51 22.8 C46 22.8 41.5 24.5 39.6 29 Z" fill={HAIR} />
          <Face mood={mood} lookX={lookX} lookY={lookY} />
        </g>
      </Layer>
    </>
  )
}

/** わら の ぼうし。つば の まんなか(51, 20)が じく。 */
function Hat() {
  return (
    <>
      <ellipse cx="51" cy="21.2" rx="22" ry="3.4" fill={STRAW_DARK} />
      <ellipse cx="51" cy="20.2" rx="22" ry="3.2" fill={STRAW} />
      <path d="M39 20.6 C39 8.6 63 8.6 63 20.6 Z" fill={STRAW} />
      <path d="M39.2 18.2 Q51 21 62.8 18.2 L63 20.6 Q51 23.2 39 20.6 Z" fill={BAND} />
      <path d="M44 13.6 Q47 11.6 51 11.4" fill="none" stroke="#fbe29a" strokeWidth="1.2" strokeLinecap="round" />
    </>
  )
}

/** ぼうしの 場所(こし の うごき に あわせて あたまの上 → かぜで とぶ → ひらひら おちる) */
type HatMove = { readonly x: number; readonly y: number; readonly rotate: number }

function hatMove(t: number, headY: number): HatMove {
  if (t < GUST) return { x: 0, y: headY - 20, rotate: 0 }
  const apexY = 15
  const rightX = 80
  const leftX = 33
  if (t < FLY_END) {
    const p = span(t, GUST, FLY_END, easeOut)
    return { x: (rightX - 51) * p, y: headY - 20 + (apexY - headY) * p, rotate: 30 * p }
  }
  if (t < FLOAT_END) {
    const p = span(t, FLY_END, FLOAT_END, easeInOut)
    return { x: rightX - 51 + (leftX - rightX) * p, y: apexY - 20 - 1.5 * Math.sin(p * Math.PI), rotate: 28 * Math.cos(p * Math.PI) + 2 * (1 - p) }
  }
  if (t < LAND) {
    const p = span(t, FLOAT_END, LAND, easeInOut)
    return { x: leftX - 51 + (51 - leftX) * p, y: apexY - 20 + (headY - apexY) * p, rotate: -26 * (1 - p) + Math.sin(p * Math.PI * 3) * 10 * (1 - p) }
  }
  // のった しゅんかん、ぽん と すこし しずむ
  const press = Math.sin(span(t, LAND, LAND + 0.3) * Math.PI) * 1.2
  return { x: 0, y: headY - 20 + press, rotate: 0 }
}

/** ばんざいの あと と、ほし の きらきら(うれしさ) */
function Joy({ t }: SceneProps) {
  const show = during(t, CHEER + 0.3, INK + 0.6, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      <Star cx={10} cy={30} r={3.2} color="#ffc233" spin={t * 90} />
      <Star cx={98} cy={28} r={3.6} color="#ff7a4d" spin={-t * 90} />
      <Star cx={90} cy={62} r={2.4} color="#ffd95a" spin={t * 120} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  const pop = span(t, POP, POP + 0.7, backOut)
  const reach = span(t, GUST + 0.2, GUST + 0.8, backOut)
  const spread = span(t, CHEER, INK - 0.1, easeInOut)

  // ジャンプ: ぼうしを つかまえようと 2回 はねる / うれしくて ばんざいジャンプ(いちばん上で 字になる)
  const hop = t >= 2.6 && t < 3.9 ? Math.abs(Math.sin(((t - 2.6) / 1.3) * Math.PI * 2)) * 6 : 0
  const bigJump = JUMP_H * Math.sin(span(t, CHEER, CHEER + 2.0) * Math.PI)
  const lift = hop + bigJump
  const legAngle = 7 + (SPREAD - 7) * spread
  // あし を ひらくと こし が さがる。足もとが 地面から はなれた ぶんだけ、こし も 上がる
  const hipY = GROUND - lift - LEG * Math.cos(rad(legAngle))
  const dy = hipY - HIP_Y

  // うで: たっている → うえに のばす → ばんざい(よこに ひろげる)
  const flutter = t >= GUST + 0.8 && t < LAND ? wave(t, 0.5) * 7 : 0
  const upLeft: ArmPose = { upper: 10 + (125 - 10) * reach + flutter, fore: 6 + (148 - 6) * reach + flutter }
  const upRight: ArmPose = { upper: 10 + (125 - 10) * reach - flutter, fore: 6 + (148 - 6) * reach - flutter }
  const armLeft: ArmPose = t < CHEER ? upLeft : { upper: mix(t, CHEER, INK - 0.1, upLeft.upper, 90, backOut), fore: mix(t, CHEER, INK - 0.1, upLeft.fore, 90, backOut) }
  const armRight: ArmPose = t < CHEER ? upRight : { upper: mix(t, CHEER, INK - 0.1, upRight.upper, 98, backOut), fore: mix(t, CHEER, INK - 0.1, upRight.fore, 98, backOut) }

  const hat = hatMove(t, 20 + dy)
  const worried = t >= GUST + 0.1 && t < LAND
  const mood: Mood = t >= LAND ? 'happy' : worried ? 'worried' : 'calm'
  // ぼうしを 目で おう
  const hatWorldX = 51 + hat.x
  const follow = worried ? Math.max(-1, Math.min(1, (hatWorldX - 51) / 30)) : 0
  const lookY = worried ? -1 : 0
  const headTilt = follow * 5
  // ぼうしが のった しゅんかん、からだが すこし ちぢむ
  const squash = 1 - 0.05 * Math.sin(span(t, LAND, LAND + 0.3) * Math.PI)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <ellipse cx="51" cy="96.4" rx={14 - lift * 0.8 + 8 * spread} ry="2.4" fill="#000000" opacity={0.12 * pop} />
        <WindStreaks t={t} />
        <Layer scale={Math.max(pop, 0.001)} origin={[51, GROUND]}>
          <Layer scaleY={squash} origin={[51, GROUND]}>
            <Kid mood={mood} legAngle={legAngle} armLeft={armLeft} armRight={armRight} lookX={follow} lookY={lookY} headTilt={headTilt} hipY={HIP_Y + dy} />
          </Layer>
          <Layer x={hat.x} y={hat.y} rotate={hat.rotate} origin={[51, 20]}>
            <Hat />
          </Layer>
        </Layer>
        <Joy t={t} />
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
    { at: 0, label: '子どもが ぼうしを かぶって たっている', sound: 'pop' },
    { at: GUST, label: 'かぜで ぼうしが とぶ。子どもは おどろく' },
    { at: 2.6, label: 'ぼうしを つかまえようと ジャンプ' },
    { at: FLOAT_END, label: 'ぼうしが ひらひら おちてくる' },
    { at: LAND, label: 'ぼうしが あたまの いちばん上に ぽん', sound: 'pop' },
    { at: CHEER, label: 'うれしくて ばんざいジャンプ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '元 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
