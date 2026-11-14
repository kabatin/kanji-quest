/*
 * 道(みち): あたまを まえに むけて、みちを すすむ。(共通部品 sceneFigures で 書きなおした ためし)
 *
 * ほね(画と絵の対応)
 *   1・2画目   … 子どもの あたまの上で ぴょこんと はねた かみ(あほ毛)
 *   3画目(一)  … あたまの すぐ下の よこの ライン(くびまわり)
 *   4〜9画目   … 「首」の 目の ぶぶん。子どもの あたま・かお から 体の あたり
 *   10画目(丶) … 空を とぶ ちょうちょ の あたり
 *   11画目     … 丘を くねくね おりてくる 道
 *   12画目(ノ) … 丘の ふもとから 右の おうちへ のびる 長い みち(子どもの あしもと)
 *   (子どもは 部品の 大きさで 立つ。字と ぴったり重ならなくても、だいたい同じ場所なら よい)
 *
 * ながれ
 *   丘から おりてくる 道が のびる → ランドセルの子が、下を むいて とぼとぼ あるいてくる
 *   → ちょうちょが めのまえを ひらひら。びっくりして とまり、ふっと あたまを あげる
 *   → ちょうちょは 右へ とんでいき、その先に おうち が見える。にこっと わらって
 *   → あたまを まえに むけて、すたすた みちを すすむ → ほね が ひかって、絵が うすくなり、字「道」が のこる
 *
 * あるくのは walk()。2つの 区間(とぼとぼ・すたすた)を 1人の Person で つづけて 描く。
 * 道は 画の線(11・12画目)そのまま なので Bone で 描く。子どもの 足もとの 高さ は 道の 通り道の点 から 出す。
 */
import { during, easeInOut, easeOut, inkTiming, mix, span, type SceneModule, type SceneProps } from '../../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../../sceneParts'
import { Butterfly, Clouds, Flower, House, LOOKS, mixLimb, Notice, Person, personRig, Sun, Tuft, walk, type Expression, type PersonProps, type WalkPlan } from '../../sceneFigures'

const CHAR = '道'

const ROAD = '#ecd3a0'
const ROAD_EDGE = '#d6b87c'
const GRASS = '#c5e8a9'
const HILL = '#d3edb9'
const HILL_FAR = '#e2f2d2'

/** くぎり の時間(秒) */
const ROAD_GROW = 0.9
/** 子どもが 左から あるきはじめる */
const WALK = 0.9
/** ちょうちょが とんでくる */
const FLUTTER = 2.4
/** 子どもが ちょうちょに きづいて とまる */
const STOP = 3.2
/** ちょうちょが 右へ とびさる・子どもが また あるきだす */
const GO = 4.5
const ARRIVE = 6.0
const INK = 6.3
const DONE = 9.6
const DURATION = 10.2

const START_X = -16
const STOP_X = 36
const END_X = 64
/** 子どもの 背の高さ */
const KID_HEIGHT = 65

const KID_LOOK = { ...LOOKS.boy, top: '#f2a93b', bottom: '#3e5c86' } as const
/** とぼとぼ(うでを あまり ふらない)→ すたすた */
const WALK_SLOW: WalkPlan = { from: START_X, to: STOP_X, start: WALK, end: STOP, build: 'child', height: KID_HEIGHT, step: 16, armSwing: 10 }
const WALK_FAST: WalkPlan = { from: STOP_X, to: END_X, start: GO, end: ARRIVE, build: 'child', height: KID_HEIGHT, step: 18, armSwing: 26 }

/** 12画目の 道の 通り道の点。道の たかさ を x から しらべるのに使う */
const ROAD_POINTS: readonly (readonly [number, number])[] = [
  [12.5, 81.7],
  [24, 81],
  [35.3, 82.6],
  [46.4, 85.7],
  [57.3, 89],
  [68.4, 92.1],
  [79.6, 94.7],
  [91, 96.1],
]

/** x の所の 道の まんなかの たかさ(y)。はしの外は まっすぐ のばす */
function roadY(x: number): number {
  const first = ROAD_POINTS[0]
  const last = ROAD_POINTS[ROAD_POINTS.length - 1]
  if (x <= first[0]) return first[1]
  if (x >= last[0]) return last[1] + (x - last[0]) * 0.05
  const i = ROAD_POINTS.findIndex((p) => p[0] >= x)
  const [x0, y0] = ROAD_POINTS[i - 1]
  const [x1, y1] = ROAD_POINTS[i]
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
}

/** 足の うら が 道に つく たかさ(まんなかより 少し 下) */
const footY = (x: number) => roadY(x) + 1.4

/* ───────── けしき ───────── */

function Field() {
  return (
    <>
      {/* 右の とおくの 丘(さいしょから ちいさく 見えている おうちの 場所) */}
      <path d="M62 100 Q86 70 118 80 V104 Z" fill={HILL_FAR} />
      <House x={100} y={85.4} width={12} />
      {/* 左の 丘(11画目の くねくね道 が おりてくる) */}
      <path d="M-6 100 L-6 66 Q4 40 24 40 Q44 42 54 84 Z" fill={HILL} />
      <path d="M-4 74 Q50 78 113 84 V113 H-4 Z" fill={GRASS} />
      {[6, 44, 74, 100].map((x) => (
        <Tuft key={x} x={x} y={104} />
      ))}
      <Flower x={30} y={102} />
      <Flower x={86} y={104} color="#ff9db0" />
    </>
  )
}

/** 道。11画目(丘を おりる くねくね) と 12画目(ふもとから 右へ のびる みち)を 画の線 そのままに。 */
function Road({ t }: SceneProps) {
  const hill = span(t, 0, ROAD_GROW * 0.5, easeOut)
  const flat = span(t, ROAD_GROW * 0.35, ROAD_GROW, easeOut)
  return (
    <>
      <Bone char={CHAR} n={11} color={ROAD_EDGE} width={6.4} from={1 - hill} to={1} />
      <Bone char={CHAR} n={11} color={ROAD} width={4.4} from={1 - hill} to={1} />
      {/* わく の外へ つづく ところは、道が のびきって から あらわれる */}
      <g opacity={span(t, ROAD_GROW * 0.85, ROAD_GROW)}>
        {['M-6 81.6 L12.5 81.7', 'M91 96.05 L113 97.1'].map((d) => (
          <g key={d} fill="none" strokeLinecap="round">
            <path d={d} stroke={ROAD_EDGE} strokeWidth="9" />
            <path d={d} stroke={ROAD} strokeWidth="7" />
          </g>
        ))}
      </g>
      <Bone char={CHAR} n={12} color={ROAD_EDGE} width={9} to={flat} />
      <Bone char={CHAR} n={12} color={ROAD} width={7} to={flat} />
    </>
  )
}

/* ───────── ちょうちょ ───────── */

/** 右の空から ひらひら きて、子どもの かおの まえで とまり、右の おうちの ほうへ とんでいく */
function butterflyAt(t: number): { readonly x: number; readonly y: number; readonly size: number } {
  const come = span(t, FLUTTER, STOP + 0.3, easeOut)
  const leave = span(t, GO, ARRIVE - 0.2, easeInOut)
  const hover = Math.sin(t * 7) * 1.6
  const comeX = 118 - come * 66
  const comeY = 6 + come * 23 + Math.sin(come * 7) * 3
  return {
    x: t < GO ? comeX : 52 + leave * 46 + Math.sin(leave * 9) * 2,
    y: t < GO ? comeY + (come >= 1 ? hover : 0) : 29 + leave * 30 + hover * (1 - leave),
    size: 1 - leave * 0.4,
  }
}

/* ───────── 子ども ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 12)

  // あるく: 左から とぼとぼ → ちょうちょで 止まる → あたまを あげて すたすた
  const w = t < GO ? walk(t, WALK_SLOW) : walk(t, WALK_FAST)
  const bf = butterflyAt(t)

  // 気持ち: うつむく → おどろく → にこっ
  const face: Expression = t < STOP + 0.1 ? 'normal' : t < GO - 0.2 ? 'surprised' : 'joy'
  // 目線: 下を 見て あるく → ちょうちょを 見あげる → まっすぐ まえ
  const gazeY = t < STOP ? 0.9 : t < GO - 0.2 ? mix(t, STOP, STOP + 0.4, 0.9, -0.8) : mix(t, GO - 0.2, GO + 0.5, -0.8, 0)
  // あたま: うつむいて あるく → ちょうちょを 見あげる → まっすぐ まえを 向く
  const head = t < STOP ? 18 : t < GO - 0.2 ? mix(t, STOP, STOP + 0.5, 18, -12) : mix(t, GO - 0.2, GO + 0.5, -12, 0)
  // からだ: とぼとぼは 少し まえかがみ。あたまを あげると のびる
  const torso = (w.pose.torso ?? 0) + mix(t, STOP, STOP + 0.7, 5, 0)
  // うで: ちょうちょに 手を のばす(手先を ちょうちょの ほうへ)
  const reach = span(t, STOP + 0.3, STOP + 0.6, easeOut) * (1 - span(t, GO - 0.2, GO + 0.2))
  const leftArm = mixLimb(w.pose.leftArm ?? { swing: 4, bend: 10 }, { to: [bf.x - 3, bf.y + 3] }, reach)
  // さいごに 立ちどまって、うれしくて ぴょん
  const hop = Math.sin(span(t, ARRIVE, ARRIVE + 0.4) * Math.PI) * 2.4
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  const kid: PersonProps = { ...w, y: footY(w.x), lift: hop, pose: { ...w.pose, leftArm, torso, head } }
  const rig = personRig(kid)
  const headR = rig.body.headR * rig.scale
  const butterflyShow = span(t, FLUTTER, FLUTTER + 0.2) * (1 - span(t, ARRIVE - 0.3, ARRIVE + 0.1))

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sun t={t} x={93} y={12} r={6.2} />
        <Clouds t={t} at={[[6, 13, 1], [50, 8, 0.8]]} speed={1.4} />
        <Field />
        <Road t={t} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <Person {...kid} look={KID_LOOK} face={face} gazeY={gazeY} pack="randoseru" />
        </Layer>
        <Notice x={rig.world.head[0]} y={rig.world.head[1]} r={headR} show={during(t, STOP, STOP + 0.9, 0.15)} dir={1} />
        {butterflyShow > 0 && (
          <Layer opacity={butterflyShow}>
            <Butterfly x={bf.x} y={bf.y} t={t} size={bf.size} />
          </Layer>
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
    { at: 0, label: '丘から おりてくる 道が のびる', sound: 'pop' },
    { at: WALK, label: '子どもが 下を むいて とぼとぼ あるいてくる' },
    { at: FLUTTER, label: 'ちょうちょが ひらひら とんでくる' },
    { at: STOP, label: 'びっくり。あたまを あげて 見あげる', sound: 'pop' },
    { at: GO, label: 'ちょうちょが 右へ。にこっと わらって あるきだす' },
    { at: ARRIVE, label: 'あたまを まえに むけて、みちを すすむ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '道 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
