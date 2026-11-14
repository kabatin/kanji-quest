/*
 * 文(ぶん): 人の むねに もようが かいて ある。もようから 字に なった。(共通部品 sceneFigures で 書きなおした もの)
 *
 * ほね(画と絵の対応)
 *   1〜4画     … 人の むねに ふでで かいた もよう(1画目 てん・2画目 よこ・3画目 4画目 ななめの ばつ)
 *                 むねの もようが 大きく ふくらんで、字の形に なる
 *   2画目(一)  … さいごに こどもが りょううでを よこに ひろげたとき、うで が この線に だいたい 重なる
 *
 * ながれ
 *   むねに もようが ない こどもが しょんぼり(ふきだしに ほしい もよう)
 *   → もようを かく おじいさんが ふで を もって あるいてくる
 *   → てん・よこ・ななめ ふたつ の じゅんに、ふで で むねに かいていく(こどもは くすぐったくて にこにこ)
 *   → こどもは うれしくて りょううでを ひろげて「ほら!」と みせる
 *   → むねの もようが ぐんぐん 大きくなり、ほね が ひかって、絵が うすくなって 字「文」に なる
 *
 * 人は Person(こども は 正面・はだか、おじいさん は 左むき の elder)。
 * おじいさんは walk で あるいてきて、ふで(tools)を もった 手を { to } で むねの もようへ。かえる ときは turnAround で むきを かえて walk。
 * こどもの むねの もようは held(どう と うで の あいだ)に 描く。
 * 赤い はちまき・白い ひげ は headwear、こしの おび と すみつぼ は held で ここに 描く。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Butterfly, LOOKS, mixLimb, PALETTE, Person, personRig, turnAround, walk, type PersonProps, type Point } from '../sceneFigures'

const CHAR = '文'

const SHORTS = '#4f9be0'
const PAINT = '#d9463f'
const ELDER_TUNIC = '#5aa36a'
const ELDER_PANTS = '#7a6040'
const ELDER_HAIR = '#d7d7de'
const BELT = '#8c5b3c'
const POT = '#c75a3a'

/** くぎり の時間(秒) */
const ELDER_IN = 0.9
const ELDER_HERE = 1.7
const PAINT_AT = 2.1
const PAINT_END = 5.5
const BRUSH_AWAY = 5.8
const CHEER = 5.8
/** おじいさんが かえって から、りょううでを ひろげて「ほら!」と みせる */
const ARMS = 6.6
const GROW = 6.7
const INK = 7.5
const DONE = 10.4
const DURATION = 11

/* ───────── もよう(むねに かく 文) ───────── */

/** 字の まんなか。むねの もようは、字を この 大きさ で ちぢめて むねの まんなかに おく */
const GLYPH_CENTER: Point = [54.5, 53.5]
const CHEST_SCALE = 0.2
/** もようの 線の ふとさ(字の 大きさで) */
const PAINT_WIDTH = 7

/** 画の とおり道(scene-info の 点)。ふでの さきを うごかすのに つかう */
const STROKE_POINTS: readonly (readonly Point[])[] = [
  [[51.6, 12.8], [52.9, 14.7], [53.3, 17], [53.3, 19.4], [53.3, 21.8], [53.3, 24.2], [53.2, 26.5], [53.2, 28.9]],
  [[16.9, 32.7], [27.4, 33], [38, 31.8], [48.5, 30.5], [59.1, 29.3], [69.6, 28.2], [80.2, 27.3], [90.8, 27.8]],
  [[69.9, 32.5], [66.8, 43.6], [61.1, 53.9], [54.3, 63.4], [46.6, 72.3], [38, 80.4], [28.7, 87.6], [18.8, 93.8]],
  [[31, 43.8], [40.1, 50], [48.2, 57.7], [56.2, 65.4], [64.4, 73], [72.9, 80.2], [81.8, 86.9], [91.7, 91.9]],
]

/** それぞれの画を かく時間(画と画の あいだに、ふでを うかせる 0.15 秒) */
const STROKE_TIMES: readonly (readonly [number, number])[] = [
  [2.1, 2.5],
  [2.65, 3.4],
  [3.55, 4.5],
  [4.65, 5.5],
]

/** 画の とちゅう(0〜1)の 点 */
function pointOn(points: readonly Point[], u: number): Point {
  const f = Math.min(Math.max(u, 0), 1) * (points.length - 1)
  const i = Math.min(Math.floor(f), points.length - 2)
  const k = f - i
  return [points[i][0] + (points[i + 1][0] - points[i][0]) * k, points[i + 1][1] + (points[i + 1][1] - points[i][1]) * k]
}

const lerpPoint = (a: Point, b: Point, k: number): Point => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/* ───────── 人の ばしょ ───────── */

const FLOOR = 94
const KID_X = 54
const KID_HEIGHT = 60
const ELDER_STAND = 78
const ELDER_HEIGHT = 64
/** こどもは はだか(はだ色 の うわぎ・青い ズボン) */
const KID_LOOK = { ...LOOKS.boy, top: PALETTE.skin, sleeves: 'short', bottomKind: 'shorts', bottom: SHORTS } as const
const ELDER_LOOK = { ...LOOKS.elder, hairStyle: 'bun', top: ELDER_TUNIC, bottom: ELDER_PANTS } as const
/** ふでを もつ 手は、ふでの さきの 右上(てまえの 手。ふでの 長さ ぶん) */
const BRUSH_HAND: Point = [7, -4]

/** こどもの むね(くび の つけね と こし の あいだ)の 場所 と 大きさ。うごかない 体で たしかめる */
const kidBase: PersonProps = { x: KID_X, y: FLOOR, build: 'child', height: KID_HEIGHT, facing: 'front', look: KID_LOOK }
const KID_RIG = personRig(kidBase)
const CHEST_CENTER = lerpPoint(KID_RIG.world.neck, KID_RIG.world.pelvis, 0.32)
const CHEST_K = CHEST_SCALE * (KID_HEIGHT / 60)

/** 字の 点 → むねの 上の 点 */
const toChest = ([x, y]: Point): Point => [CHEST_CENTER[0] + (x - GLYPH_CENTER[0]) * CHEST_K, CHEST_CENTER[1] + (y - GLYPH_CENTER[1]) * CHEST_K]

/** ふでの さきが かいていない とき いる ところ(手を おろした まま) */
const BRUSH_REST: Point = [ELDER_STAND - 12, 70]

/** ふでの さき の いま の いち。かく前は 下がっていて、かいたあとは また おろす */
function brushTip(t: number): Point {
  const first = toChest(STROKE_POINTS[0][0])
  const last = toChest(STROKE_POINTS[3][7])
  if (t < STROKE_TIMES[0][0]) return lerpPoint(BRUSH_REST, first, span(t, STROKE_TIMES[0][0] - 0.35, STROKE_TIMES[0][0], easeInOut))
  for (let i = 0; i < STROKE_TIMES.length; i += 1) {
    const [from, to] = STROKE_TIMES[i]
    if (t <= to) return toChest(pointOn(STROKE_POINTS[i], span(t, from, to)))
    const next = STROKE_TIMES[i + 1]
    if (next && t < next[0]) return lerpPoint(toChest(STROKE_POINTS[i][7]), toChest(STROKE_POINTS[i + 1][0]), span(t, to, next[0], easeInOut))
  }
  return lerpPoint(last, BRUSH_REST, span(t, PAINT_END, BRUSH_AWAY, easeInOut))
}

/** むねの もよう。progress は 各画を どこまで かいたか(0〜1) */
function ChestPattern({ progress, opacity = 1 }: { readonly progress: readonly number[]; readonly opacity?: number }) {
  return (
    <>
      {progress.map((to, i) => (
        <Bone key={i} char={CHAR} n={i + 1} color={PAINT} width={PAINT_WIDTH} to={to} opacity={opacity} />
      ))}
    </>
  )
}

/** ふきだし: むねに もようが ほしい(こどもの あたまの ななめ上) */
function Wish({ t, head }: { readonly t: number; readonly head: Point }) {
  const show = during(t, 0.3, 1.45, 0.2)
  if (show <= 0) return null
  const pop = backOut(span(t, 0.3, 0.6))
  const [cx, cy] = [head[0] + 22, head[1] - 20]
  return (
    <g opacity={show}>
      <circle cx={head[0] + 11} cy={head[1] - 9} r="1.6" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <circle cx={head[0] + 14} cy={head[1] - 14} r="2.4" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <Layer x={cx} y={cy} scale={Math.max(0, pop)} origin={[0, 0]}>
        <ellipse cx="0" cy="0" rx="10" ry="8" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
        <Layer x={-GLYPH_CENTER[0] * 0.16} y={-GLYPH_CENTER[1] * 0.16} scale={0.16}>
          {[1, 2, 3, 4].map((n) => (
            <Bone key={n} char={CHAR} n={n} color={PAINT} width={8} />
          ))}
        </Layer>
      </Layer>
    </g>
  )
}

/** うれしくて とびはねる しゅんかん の「ぱっ」という 線(あたまの まわり) */
function Cheer({ t, head, r }: { readonly t: number; readonly head: Point; readonly r: number }) {
  const show = during(t, CHEER + 0.1, CHEER + 1.3, 0.2)
  if (show <= 0) return null
  const k = span(t, CHEER + 0.1, CHEER + 0.6, easeOut)
  return (
    <g opacity={show} stroke="#ffb02e" strokeWidth="1.3" strokeLinecap="round">
      {[-1, 1].map((side) =>
        [-24, 0, 24].map((deg) => {
          const rad = ((deg - 90) * Math.PI) / 180
          const near = r * 1.4 + k * 2
          const far = r * 1.9 + k * 3
          return <path key={`${side}${deg}`} d={`M${head[0] + side * Math.cos(rad) * near + side * 4} ${head[1] + Math.sin(rad) * near} L${head[0] + side * Math.cos(rad) * far + side * 4} ${head[1] + Math.sin(rad) * far}`} />
        }),
      )}
    </g>
  )
}

/** あたまに まく 赤い はちまき と、白い ひげ(右むき の 形。左むき なら 部品が はんてん する) */
const ELDER_HEADWEAR = (
  <>
    <path d="M-1 -0.28 Q0.05 -0.78 1 -0.28" fill="none" stroke={PAINT} strokeWidth="0.26" strokeLinecap="round" />
    <path d="M0.05 0.55 Q0.2 1.2 0.7 1.12 Q1.1 0.9 1 0.4 Q0.6 0.85 0.05 0.55 Z" fill={ELDER_HAIR} />
  </>
)

/** おじいさんの こしの おび と すみつぼ(体の うしろがわ の こし)。向きで 左右 を かえる */
function Belt({ pelvis, scale, facing }: { readonly pelvis: Point; readonly scale: number; readonly facing: 'left' | 'right' }) {
  const dir = facing === 'left' ? 1 : -1
  const w = 13 * scale
  return (
    <>
      <rect x={pelvis[0] - w / 2} y={pelvis[1] - 4 * scale} width={w} height={3.4 * scale} fill={BELT} />
      <circle cx={pelvis[0] + dir * 7.4 * scale} cy={pelvis[1] + 0.6 * scale} r={3.6 * scale} fill={POT} />
      <ellipse cx={pelvis[0] + dir * 7.4 * scale} cy={pelvis[1] - 2.4 * scale} rx={2.4 * scale} ry={0.9 * scale} fill={PAINT} />
    </>
  )
}

/** こども: しょんぼり → おじいさんに きづく → くすぐったい → うれしい */
function kidAt(t: number): PersonProps {
  const mood = t < 1.3 ? 'worried' : t < PAINT_AT ? 'normal' : t < CHEER ? 'smile' : 'joy'
  const tickle = during(t, PAINT_AT, PAINT_END, 0.2)
  const arm = span(t, ARMS, ARMS + 0.6, backOut)
  const hang = (sign: number) => ({ swing: 6 + sign * wave(t, 0.3) * 2.5 * tickle, bend: 4 })
  const spread = { swing: 92, bend: 4 }
  const hop = Math.sin(span(t, CHEER + 0.15, CHEER + 0.6) * Math.PI) * 3
  const headTilt = t < 1.3 ? 3 : tickle > 0 ? wave(t, 0.3) * 3 * tickle : mix(t, CHEER, CHEER + 0.4, 0, -2)
  return {
    ...kidBase,
    x: KID_X + (t < 1.3 ? wave(t, 1.6) * 0.2 : 0),
    face: mood,
    lift: hop,
    pose: { leftArm: mixLimb(hang(1), spread, arm), rightArm: mixLimb(hang(-1), spread, arm), head: headTilt },
  }
}

/** おじいさん: みぎ から あるいてきて、かく。かきおわったら むきを かえて かえる */
function elderAt(t: number, tip: Point): PersonProps & { readonly painting: boolean } {
  const common = { build: 'elder', height: ELDER_HEIGHT } as const
  const come = walk(t, { ...common, from: 130, to: ELDER_STAND, start: ELDER_IN, end: ELDER_HERE })
  const leave = walk(t, { ...common, from: ELDER_STAND, to: 130, start: BRUSH_AWAY + 0.35, end: BRUSH_AWAY + 1.5 })
  const turn = turnAround(t, BRUSH_AWAY, 'left', 'right')
  const going = t >= BRUSH_AWAY
  const plan = going ? leave : come
  const brushing = t >= ELDER_HERE + 0.05 && t < BRUSH_AWAY
  const lean = brushing ? 3 : 0
  const hand: Point = brushing ? [tip[0] + BRUSH_HAND[0], tip[1] + BRUSH_HAND[1]] : [plan.x + (going ? 7 : -7), 66]
  return {
    ...plan,
    ...(going ? turn : {}),
    y: FLOOR,
    look: ELDER_LOOK,
    face: 'smile',
    pose: { ...plan.pose, rightArm: brushing || !plan.moving ? { to: hand } : plan.pose.rightArm, torso: lean },
    painting: brushing && t >= STROKE_TIMES[0][0] && t <= PAINT_END,
  }
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  // もよう: 画ごとに かけた度合い。そのあと むねの もよう は のこし、大きな もよう が ふくらむ
  const progress = STROKE_TIMES.map(([from, to]) => span(t, from, to))
  const grow = span(t, GROW, INK - 0.1, easeInOut)
  const bigScale = mix(t, GROW, INK - 0.1, CHEST_K, 1, easeInOut)
  const bigX = (1 - grow) * (CHEST_CENTER[0] - GLYPH_CENTER[0])
  const bigY = (1 - grow) * (CHEST_CENTER[1] - GLYPH_CENTER[1])
  const bigOpacity = span(t, GROW, GROW + 0.25) * 0.9
  const puff = span(t, CHEER, CHEER + 0.5) * (1 - span(t, GROW + 0.8, GROW + 1.2))

  const kidProps = kidAt(t)
  const hop = kidProps.lift ?? 0
  const chest = (
    <Layer y={-hop}>
      <Layer scale={1 + puff * 0.04} origin={CHEST_CENTER}>
        <Layer x={CHEST_CENTER[0] - GLYPH_CENTER[0]} y={CHEST_CENTER[1] - GLYPH_CENTER[1]} scale={CHEST_K} origin={GLYPH_CENTER}>
          <ChestPattern progress={progress} />
        </Layer>
        <Layer x={bigX} y={bigY} scale={bigScale} origin={GLYPH_CENTER} opacity={bigOpacity}>
          <ChestPattern progress={[1, 1, 1, 1]} />
        </Layer>
      </Layer>
    </Layer>
  )

  const tip = brushTip(t)
  const elder = elderAt(t, tip)
  const elderRig = personRig(elder)
  const elderHand = elderRig.world.arms.right.end
  const brushTipNow: Point = elder.painting || (t >= ELDER_HERE && t < BRUSH_AWAY) ? tip : [elderHand[0] - 5, elderHand[1] + 8]
  const kidHead = KID_RIG.world.head
  const kidHeadR = KID_RIG.body.headR * KID_RIG.scale
  const belt = <Belt pelvis={elderRig.world.pelvis} scale={elderRig.scale} facing={elder.facing === 'right' ? 'right' : 'left'} />

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} tufts={[8, 30, 76, 100]} />
        <Layer opacity={during(t, 2.4, 7.0, 0.3)}>
          <Butterfly x={18 + wave(t, 3.1) * 6} y={74 + wave(t, 1.7) * 4} t={t} />
        </Layer>
        <Person {...kidProps} held={chest} />
        <Wish t={t} head={kidHead} />
        <Cheer t={t} head={kidHead} r={kidHeadR} />
        <Person {...elder} headwear={ELDER_HEADWEAR} held={belt} tools={{ right: { kind: 'brush', tip: brushTipNow, ink: PAINT } }} />
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
    { at: 0, label: 'むねに もようが ない こどもが しょんぼり', sound: 'pop' },
    { at: ELDER_IN, label: 'ふでを もった おじいさんが あるいてくる' },
    { at: PAINT_AT, label: 'むねに もようを かく(てん・よこ・ななめ)', sound: 'stroke' },
    { at: CHEER, label: 'うれしくて とびはねる', sound: 'pop' },
    { at: ARMS, label: 'うでを ひろげて「ほら!」', sound: 'pop' },
    { at: GROW, label: 'むねの もようが 大きく なる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '文 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
