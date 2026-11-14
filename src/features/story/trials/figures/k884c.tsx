/*
 * 行(いく): みちと みちが であう じゅうじろ。ひとが いく。(共通部品 sceneFigures で 書きなおした ためし)
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … 左うえの ほうから おりてくる 山みち
 *   2画目(ノ)  … 左の 山みち。したで、3画目の みちと ひとつに あつまる(Y字の わかれみち)
 *   3画目(丨)  … 左の まっすぐな 村みち
 *   4画目(一)  … うえの 横みち(お家の ほうへ のびる)
 *   5画目(一)  … まんなかの 横みち。お家の 玄関まで つづく
 *   6画目(亅)  … したから のぼってくる たて みち。5画目と まじわる T字ろ
 *
 * ながれ(主役: ランドセルの 男の子)
 *   みちが ひろがる → 男の子が したから あるいてくる(うしろ すがた)
 *   → じゅうじろ で たちどまり、ふりむいて「どっちへ いこう?」ときょろきょろ(ハテナ)
 *   → お家の とびらが あいて、ともだちが てを ふる → 男の子が うれしくなって てを ふりかえす
 *   → 右むきに からだごと むきを かえて かけだし、ともだちの ところへ「いく」
 *   → ほね が ひかって、絵が うすくなり、字「行」が のこる
 *
 * 字に なる とき、人は 字に 重ならない(みち が 字に なる。人は みち の うえを いく もの)。
 */
import { backOut, during, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../../sceneParts'
import { Butterfly, Clouds, Flower, House, LOOKS, Meadow, mixLimb, Person, personRig, Pond, Question, run, Sun, Tree, turnAround, walkDepth, type DepthWalkPlan, type Look, type PersonProps } from '../../sceneFigures'

const CHAR = '行'

const ROAD = '#ecd29a'
const ROAD_EDGE = '#d6b373'
const GRASS_BG = '#d7efbd'
const DOOR_INSIDE = '#4a3020'
const HELLO = '#f07f9e'

/** 友だちの 見た目(ももいろの 服・みどりの ズボン・くろい かみ) */
const FRIEND_LOOK: Look = { hair: '#2f2a2a', top: '#f07f9e', bottom: '#6f8f4f' }

/** くぎり の時間(秒) */
const WALK = 0.8
const ARRIVE = 3.6
/** じゅうじろ で こちらを むき おわる */
const FACE = 3.9
/** ともだちが とびらから 出てくる */
const POP = 5.0
/** 右を むく(からだ ごと) */
const TURN_R = 6.0
const RUN = 6.3
const ARRIVED = 7.4
const INK = 7.6
const DONE = 10.2
const DURATION = 10.6

/** じゅうじろ の まんなか(男の子の 足もと) */
const CROSS_X = 72.8
const CROSS_Y = 40
/** 5画目の みち は、右へ すこし のぼる */
const roadY = (x: number) => CROSS_Y - (x - CROSS_X) * 0.1
/** ともだちの 立つ ばしょ(お家の 玄関の よこ) */
const FRIEND_POS: readonly [number, number] = [101.5, 38]
const RUN_END_X = 86
const KID_HEIGHT = 22
const FRIEND_HEIGHT = 20

/** ひとつの みち: ふちどり(うすい 色)の うえに、すな色の みち。grow は のびた 度合い。 */
function RoadBone({ n, grow, width }: { readonly n: number; readonly grow: number; readonly width: number }) {
  return (
    <>
      <Bone char={CHAR} n={n} color={ROAD_EDGE} width={width + 1.8} to={grow} />
      <Bone char={CHAR} n={n} color={ROAD} width={width} to={grow} />
    </>
  )
}

/** そら・草・お日さま・雲(みち は うえから 見た 地図の ように 草の うえ) */
function Ground({ t }: SceneProps) {
  return (
    <>
      <rect x="0" y="0" width="109" height="109" fill={GRASS_BG} />
      <Sun t={t} x={8} y={9} r={4.4} />
      <Clouds t={t} at={[[42, 7, 0.9]]} speed={1.3} />
      <Meadow y={107} tufts={[4, 38, 58, 104]} />
    </>
  )
}

/** みち の よこの ふうけい: 池・木・花・ちょうちょ。みち の よこ には 線を 描かない。 */
function Scenery({ t }: SceneProps) {
  const grow = span(t, 0.2, 0.9)
  const sway = wave(t, 3.4) * 1.5
  const fx = 38 + Math.sin(t * 1.3) * 5
  const fy = 66 + Math.sin(t * 2.1) * 3
  return (
    <>
      <Pond t={t} x={48} y={86} rx={11.5} ry={5.6} fill={grow} />
      <Tree x={48} y={70} height={20} grow={grow} sway={sway} />
      <Tree x={10} y={90} height={22} grow={grow} sway={-sway} />
      <Tree x={92} y={76} height={19} grow={grow} sway={sway} />
      <Flower x={36} y={74} grow={grow} size={0.8} />
      <Flower x={39.5} y={76} color="#ffffff" grow={grow} size={0.8} />
      <Flower x={18} y={46} grow={grow} size={0.8} />
      <Flower x={20.5} y={48.2} color="#8f9cec" grow={grow} size={0.8} />
      <Flower x={58} y={52} color="#ffffff" grow={grow} size={0.8} />
      <Flower x={84} y={92} grow={grow} size={0.8} />
      {grow > 0.5 && <Butterfly x={fx} y={fy} t={t} size={0.8} />}
    </>
  )
}

/** ともだちの お家。玄関の とびらが ひらいて、中が 見える。 */
function Home({ t }: SceneProps) {
  const open = span(t, POP - 0.25, POP, easeOut)
  // 共通の 家は ドアが 家の まんなか(width 19 なら 幅 4.2・高さ 7)
  return (
    <>
      <House x={96.5} y={37.2} width={19} grow={span(t, 0.3, 1.0)} />
      {open > 0 && <rect x="94.4" y="30.2" width="4.2" height="7" rx="0.8" fill={DOOR_INSIDE} />}
    </>
  )
}

const KID_WALK: DepthWalkPlan = { from: [CROSS_X, 108], to: [CROSS_X, CROSS_Y], start: WALK, end: ARRIVE, build: 'child', height: 30, toHeight: KID_HEIGHT }

/** 男の子の いち・向き・ポーズ: あるいてくる → たちどまる → ふりむく → 右を むく → かけだす */
function kidAt(t: number): PersonProps {
  const walking = walkDepth(t, KID_WALK)
  const { x, y, height, build, stance } = walking
  if (t < ARRIVE) return { x, y, height, build, facing: walking.facing, pose: walking.pose, stance, look: LOOKS.boy }
  const standing = { x: CROSS_X, y: CROSS_Y, height: KID_HEIGHT, build: 'child' } as const
  if (t < TURN_R) return { ...standing, ...turnAround(t, ARRIVE, 'back', 'front', (FACE - ARRIVE) / 2, 'right'), look: LOOKS.boy, ...frontMood(t, standing) }
  const r = run(t, { from: CROSS_X, to: RUN_END_X, start: RUN, end: ARRIVED, build: 'child', height: KID_HEIGHT })
  const hop = t > ARRIVED ? Math.abs(wave(t, 0.5)) * 1.2 : 0
  const joy = t > ARRIVED ? { lift: hop } : { lift: r.lift }
  return { ...standing, x: r.x, y: roadY(r.x), pose: r.pose, ...turnAround(t, TURN_R, 'front', 'right'), ...joy, face: 'joy', look: LOOKS.boy }
}

/** 正面を むいて いる 間の かお・うで: きょろきょろ → あたまを かく → てを ふりかえす */
function frontMood(t: number, standing: { readonly x: number; readonly y: number; readonly height: number; readonly build: 'child' }): Pick<PersonProps, 'face' | 'gaze' | 'pose'> {
  const gaze = t < 4.5 ? mix(t, FACE, 4.3, 0, -1) : t < 4.9 ? mix(t, 4.5, 4.8, -1, 0) : mix(t, POP, POP + 0.3, 0, 1)
  const head = personRig({ ...standing, facing: 'front' }).world.head
  const headR = personRig({ ...standing, facing: 'front' }).body.headR * (standing.height / 100)
  const scratch = span(t, FACE + 0.1, FACE + 0.4) * (1 - span(t, 4.8, 5.0))
  const waving = span(t, 5.4, 5.6) * (1 - span(t, 5.9, 6.1))
  // 画面の 右の うで(この子の 左うで)が あたまを かく → あげて ふる
  const rest = { swing: 6, bend: 10 }
  const scratching = mixLimb(rest, { to: [head[0] + headR * 1.05, head[1] - headR * 0.25] }, scratch)
  const leftArm = mixLimb(scratching, { swing: 135, bend: 22 + wave(t, 0.4) * 18 }, waving)
  return { gaze, face: t < FACE ? 'normal' : t < POP + 0.2 ? 'worried' : 'joy', pose: { leftArm, rightArm: rest, head: gaze * 5 } }
}

/** ともだちが 出てくる ときの「おーい」の しるし。 */
function Hello({ t }: SceneProps) {
  const show = during(t, POP + 0.35, ARRIVED, 0.2)
  if (show <= 0) return null
  const p = (t * 2.2) % 1
  return (
    <g opacity={show * (1 - p)} fill="none" stroke={HELLO} strokeWidth="0.8" strokeLinecap="round">
      <path d={`M${FRIEND_POS[0] - 6.5 - p * 1.5} ${FRIEND_POS[1] - 17} q-1.6 1.6 0 3.4`} />
      <path d={`M${FRIEND_POS[0] - 8.6 - p * 2.5} ${FRIEND_POS[1] - 18} q-2.4 2.6 0 5.4`} />
    </g>
  )
}

/** ともだち: とびらから ぽん と出て、正面で てを ふる */
function Friend({ t }: SceneProps) {
  const pop = span(t, POP, POP + 0.5, backOut)
  if (pop <= 0) return null
  const hello = span(t, POP + 0.3, POP + 0.6)
  const hop = t > ARRIVED ? Math.abs(wave(t, 0.5, 0.25)) * 1.2 : 0
  const waving = { swing: 130 + wave(t, 0.45) * 8, bend: 25 + wave(t, 0.45) * 18 }
  return (
    <Layer scale={pop} origin={FRIEND_POS}>
      <Person x={FRIEND_POS[0]} y={FRIEND_POS[1]} height={FRIEND_HEIGHT} facing="front" look={FRIEND_LOOK} face="joy" gaze={-0.6} lift={hop} pose={{ rightArm: mixLimb({ swing: 6, bend: 10 }, waving, hello) }} />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)
  const grow = [span(t, 0.1, 0.6), span(t, 0.2, 0.7), span(t, 0.3, 0.9), span(t, 0.3, 0.9), span(t, 0.2, 0.8), span(t, 0.1, 0.8)]
  const kid = kidAt(t)
  const stopped = t >= ARRIVE && t < TURN_R
  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        {[5.6, 5.6, 6.4, 5.6, 6.6, 6.6].map((width, i) => (
          <RoadBone key={i} n={i + 1} grow={grow[i]} width={width} />
        ))}
        <Scenery t={t} />
        <Home t={t} />
        <Friend t={t} />
        <Hello t={t} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.1)}>
          <Person {...kid} pack="randoseru" />
        </Layer>
        <Question t={t} x={CROSS_X + 1} y={CROSS_Y - 30} show={stopped ? during(t, 4.0, 5.0, 0.2) : 0} />
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
    { at: 0, label: 'みちが ひろがる', sound: 'pop' },
    { at: WALK, label: '男の子が みちを あるいてくる' },
    { at: ARRIVE, label: 'じゅうじろ で たちどまる。どっちへ いこう?', sound: 'pop' },
    { at: POP, label: 'ともだちが 出てきて てを ふる', sound: 'pop' },
    { at: RUN, label: 'うれしくて かけだして いく' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '行 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
