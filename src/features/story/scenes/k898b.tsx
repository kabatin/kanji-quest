/*
 * 見(みる): ちょうちょうに きづいた子が、めを まんまるに あけて じっと みる。(共通部品 sceneFigures で 書きなおした もの)
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … 「めの まど」の 左の わく
 *   2画目(コ)  … 「めの まど」の 上と 右の わく
 *   3画目(一)  … まどの 中の まゆ(おどろいて 上がる)
 *   4画目(一)  … まどの 中の おおきな め の まんなか
 *   5画目(一)  … まどの いちばん下の まどべ(した の わく)
 *   6画目(ノ)  … 子どもの ひだりあし(あし と どうの かたむき)
 *   7画目(乚)  … 子どもの みぎあし と、ちょうちょうの いる みぎ がわ
 *   (子どもの あし は ほんものの 形のまま。字の 6・7画目とは だいたい 同じ あたり)
 *
 * ながれ
 *   たいくつそうな子が あるいてきて たちどまり、正面を むく(うつむいて、ぼんやり)
 *   → ちょうちょうが とんでくる。「はっ」 と めを まんまるに(おどろき)
 *   → あたまの上に 「めの まど」が ぽん と ひらき、おおきな ひとみが ちょうちょうを おいかける
 *   → 子どもが 手を のばすと、ちょうちょうが ゆびに とまる。にこにこ(うれしい)
 *   → ほね が ひかって、絵が うすくなり、字「見」が のこる
 *
 * 子どもは Person。あるく ときは 横むき(walk)で、たちどまって から 正面へ ふりむく(turnAround)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Butterfly, HANG_ARM, LOOKS, mixLimb, Notice, Person, personRig, turnAround, walk, type Expression, type PersonProps } from '../sceneFigures'

const CHAR = '見'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const BARK = '#8c5b3c'
const IRIS = '#7a5238'
const WING = '#ff9ac1'
const WING_DARK = '#f2709e'

/** くぎり の時間(秒) */
const WALK = 0.5
const STOP = 2.0
const FLY = 2.3
const NOTICE = 3.1
const FRAME = 3.9
const REACH = 5.0
const LAND = 5.9
const INK = 6.6
const DONE = 9.2
const DURATION = 10.2

/** 子どもの 足もと(x は こし、y は 地面)と 背の高さ */
const CHILD_X = 51
const GROUND_Y = 97
const CHILD_HEIGHT = 38
const CHILD_LOOK = { ...LOOKS.boy, top: '#f08a5d', bottom: '#3e5c86' } as const

/** 「めの まど」の まんなか(ひとみ の ゆれる中心) */
const EYE_C: Vec = [52, 42]

type Vec = readonly [number, number]

/** ゆびを さすときの 左うで(正面。ま下から そとへ 108度、ひじ から さらに 16度) */
const REACH_POSE = { swing: 108, bend: 16 } as const

const standing: PersonProps = { x: CHILD_X, y: GROUND_Y, build: 'child', height: CHILD_HEIGHT, facing: 'front', look: CHILD_LOOK }

/** 手の さき の 画面の場所(子どもが うでを のばしたときの 左手 = 画面の 右) */
const HAND: Vec = personRig({ ...standing, pose: { leftArm: REACH_POSE } }).world.arms.left.end

/** ちょうちょう の いま の場所 と、とんでいる か */
type Fly = { readonly pos: Vec; readonly flying: boolean; readonly seen: boolean }

function butterfly(t: number): Fly {
  if (t < FLY) return { pos: [118, 6], flying: true, seen: false }
  const hoverAt = (u: number): Vec => [89 + Math.sin(u * 2.1) * 5, 32 + Math.sin(u * 3.3) * 3]
  const arrive = span(t, FLY, NOTICE + 0.4, easeOut)
  const hover = hoverAt(t)
  if (t < NOTICE + 0.4) return { pos: [mix(t, FLY, NOTICE + 0.4, 118, hover[0], easeOut), mix(t, FLY, NOTICE + 0.4, 6, hover[1], easeOut) + Math.sin(arrive * 12) * 1.2], flying: true, seen: true }
  const leave = REACH + 0.2
  if (t < leave) return { pos: hover, flying: true, seen: true }
  const from = hoverAt(leave)
  const land = span(t, leave, LAND, easeInOut)
  if (land < 1) return { pos: [from[0] + (HAND[0] - from[0]) * land, from[1] + (HAND[1] - 2.4 - from[1]) * land + Math.sin(land * Math.PI) * -3], flying: true, seen: true }
  return { pos: [HAND[0], HAND[1] - 2.4], flying: false, seen: true }
}

/** 「めの まど」: 子どもの め を おおきく うつす。ひとみが ちょうちょうを おいかける。 */
function EyeWindow({ t, fly }: { readonly t: number; readonly fly: Fly }) {
  const pop = span(t, FRAME, FRAME + 0.5, backOut)
  if (pop <= 0) return null
  const open = mix(t, FRAME + 0.25, FRAME + 0.85, 0.08, 1, easeOut)
  // ひとみ: ちょうちょうの ほうへ(まんなか から 4 まで)
  const dx = fly.pos[0] - EYE_C[0]
  const dy = fly.pos[1] - EYE_C[1]
  const len = Math.max(1, Math.hypot(dx, dy))
  const reach = Math.min(1, len / 22) * 4.2
  const ix = EYE_C[0] + (dx / len) * reach
  const iy = EYE_C[1] + (dy / len) * reach * 0.8
  const [cx, cy] = EYE_C
  const almond = `M37.5 ${cy} Q${cx} ${cy - 24 * open} 66.5 ${cy} Q${cx} ${cy + 18 * open} 37.5 ${cy} Z`
  return (
    <Layer scale={Math.max(0.01, pop)} origin={[51, 62]}>
      {/* ふきだし の しっぽ: あたま の 上 から まど へ */}
      <path d="M46 59 L51 65 L56 59 Z" fill={BARK} />
      {/* まど の わく(1・2画目)と まどべ(5画目) */}
      <rect x="33.4" y="13.4" width="37" height="46.6" rx="5" fill={SKIN} stroke={BARK} strokeWidth="2.6" />
      <rect x="31.2" y="56.2" width="41.6" height="4.8" rx="2.2" fill={BARK} />
      {/* まゆ(3画目): ひとみが ひらく と 上がる */}
      <path d={`M39.5 ${31 - 2 * open} Q${cx} ${23 - 2.4 * open} 64.5 ${30 - 2 * open}`} fill="none" stroke={HAIR} strokeWidth="2.4" strokeLinecap="round" />
      <clipPath id="k898b-eye-clip">
        <path d={almond} />
      </clipPath>
      <path d={almond} fill="#ffffff" />
      <g clipPath="url(#k898b-eye-clip)">
        <circle cx={ix} cy={iy} r="8" fill={IRIS} />
        <circle cx={ix} cy={iy} r="4.2" fill="#2b2b2b" />
        <circle cx={ix - 2.6} cy={iy - 2.8} r="2" fill="#ffffff" />
        <circle cx={ix + 2.4} cy={iy + 2.6} r="1" fill="#ffffff" opacity="0.8" />
      </g>
      <path d={`M37.5 ${cy} Q${cx} ${cy - 24 * open} 66.5 ${cy}`} fill="none" stroke={HAIR} strokeWidth="1.8" strokeLinecap="round" />
      {/* したまぶた の かげ: ひらくほど こく */}
      <path d={`M41 ${cy + 10 * open + 2} Q${cx} ${cy + 15 * open + 2} 63 ${cy + 10 * open + 2}`} fill="none" stroke={SKIN_SHADE} strokeWidth="1.2" strokeLinecap="round" opacity={open} />
    </Layer>
  )
}

/** 子ども: あるく(横)→ たちどまって 正面へ ふりむく → 気づく → 左手を のばす */
function childProps(t: number, fly: Fly): PersonProps {
  const w = walk(t, { from: CHILD_X - 62, to: CHILD_X, start: WALK, end: STOP, build: 'child', height: CHILD_HEIGHT })
  const turn = turnAround(t, STOP, 'right', 'front')
  const reach = span(t, REACH, REACH + 0.5, easeInOut)
  const pose = t < STOP + 0.15 ? w.pose : { leftArm: mixLimb(HANG_ARM, REACH_POSE, reach) }
  const face: Expression = t < NOTICE ? 'normal' : t < REACH + 0.2 ? 'surprised' : 'joy'

  // ひとみの むき: たいくつ の間は 足もと、きづいてからは ちょうちょう を おう
  const head = personRig({ ...standing, pose: {} }).world.head
  const gx = fly.pos[0] - head[0]
  const gy = fly.pos[1] - head[1]
  const glen = Math.max(1, Math.hypot(gx, gy))
  const look = span(t, NOTICE, NOTICE + 0.3)
  return { ...w, ...standing, ...turn, x: t < STOP ? w.x : CHILD_X, facing: t < STOP ? w.facing : turn.facing, pose, face, gaze: look * (gx / glen), gazeY: mix(t, NOTICE, NOTICE + 0.3, 0.8, gy / glen) }
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)
  const fly = butterfly(t)
  const child = childProps(t, fly)
  const head = personRig({ ...child, facing: 'front', pose: {} }).world.head

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} tufts={[8, 30, 84, 100]} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <Person {...child} />
        </Layer>
        <Notice x={head[0]} y={head[1]} r={5.4} show={during(t, NOTICE, FRAME + 0.2, 0.15)} />
        <EyeWindow t={t} fly={fly} />
        {fly.seen && <Butterfly x={fly.pos[0]} y={fly.pos[1]} t={t} perched={!fly.flying} color={WING} dark={WING_DARK} />}
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
    { at: 0, label: 'たいくつそうな子が あるいてくる', sound: 'pop' },
    { at: FLY, label: 'ちょうちょうが とんでくる' },
    { at: NOTICE, label: 'きづいて、めを まんまるに', sound: 'pop' },
    { at: FRAME, label: 'おおきな め で じっと みる' },
    { at: LAND, label: 'ゆびに とまって にっこり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '見 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
