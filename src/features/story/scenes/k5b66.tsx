/*
 * 学(まなぶ): やねの 下で、子どもが せんせいに おそわる。(共通部品 sceneFigures で 書きなおした ためし)
 *
 * ほね(画と絵の対応)
 *   1・2・3画目(ツ) … やねの むこうから のぼる 朝日の ひかり 3本
 *                       (子どもが「できた!」と よろこんだ しゅんかんに、さっと さす)
 *   4画目           … やねの 左はし と、それを ささえる はしら の上
 *   5画目           … やねの てっぺん(むね)の 線と、右はし
 *   6画目           … 子どもの あたま
 *   7画目           … 子どもの どう と あし
 *   8画目           … 「やったあ」と 左右に ひろげた 子どもの うで(かた の たかさ で よこ むき)
 *
 * ながれ
 *   朝。やねの ある きょうしつ が できる(お日さまは まだ やねの うしろ)
 *   → 女の子が あるいてきて、ひくい つくえの まえに せいざ する(せんせいは となり)
 *   → せんせいが 手を とって、いっしょに 紙に まる を かく
 *   → とちゅうで せんせいの 手が はなれ、のこりは ひとりで かきあげる
 *   → せんせいが 赤い ふで で、まる の まわりに 花びら を かく(はなまる)
 *   → 女の子は 立って とびあがり、りょううで を ひろげる。やねの むこうから 朝日が さす
 *   → ほね が ひかって、絵が うすくなり、字「学」が のこる
 *
 * 人は Person。あるきは walk、すわるのは posture('seiza')、ふりむきは turnAround。
 * 正面の 子が 字を かく うで は、{ to, depth } で まえへ のばす(手は 紙の 上、うで は まえへ むく)。
 * ひくい つくえ は 子の held、子は せんせいの held に わたす(せんせい の 体 → 子 の 体 → つくえ → 子 の うで → せんせい の うで)。
 * 広間は Hall、つくえは LowTable、ふでは tools、めがねは look.glasses。花びん・すずめ・朝日 は ここで 描く。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Bird, Hall, LOOKS, LowTable, mixLimb, mixPose, PALETTE, Person, personRig, posture, TiledRoof, Tool, turnAround, walk, type Limb, type PersonProps } from '../sceneFigures'

const CHAR = '学'

const SAKURA = '#f7b6c8'
const BARK = PALETTE.bark
const WOOD_DARK = '#a5764b'
const SUN = PALETTE.sun
const SUN_GLOW = '#fff1b8'
const SUMI = '#2b2b2b'
const SHU = '#e5463b'

/** くぎり の時間(秒) */
const ARRIVE = 1.0
const SIT = 2.3
const LESSON = 3.0
/** せんせいの 手が はなれて、ひとりで かく */
const ALONE = 4.0
const HANAMARU = 4.6
const CHEER = 5.6
const INK = 6.6
const DONE = 10.0
const DURATION = 10.8

/** いっしょに まる を かきはじめる(手を とって、ふでを 紙に おろしてから) */
const GUIDE_FROM = LESSON + 0.42
/** 花びら を かく あいだ */
const PETAL_FROM = HANAMARU + 0.2
const PETAL_TO = HANAMARU + 0.82
/** はくしゅ を はじめる */
const CLAP_FROM = CHEER + 0.2

type Pt = readonly [number, number]
const lerp = (a: number, b: number, k: number): number => a + (b - a) * k
const lerpPt = (a: Pt, b: Pt, k: number): Pt => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]
const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]]
const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]]
const xy = (p: Pt): string => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`
const rad = (deg: number): number => (deg * Math.PI) / 180

/** きまった時間に きまった かっこう を通り、あいだ を なめらかに つなぐ */
function keyed<T>(t: number, keys: readonly (readonly [number, T])[], blend: (a: T, b: T, k: number) => T): T {
  const [first] = keys
  if (t <= first[0]) return first[1]
  for (let i = 1; i < keys.length; i += 1) {
    const [t0, a] = keys[i - 1]
    const [t1, b] = keys[i]
    if (t <= t1) return blend(a, b, span(t, t0, t1, easeInOut))
  }
  return keys[keys.length - 1][1]
}

/* ───── 人の ばしょ ───── */
const KID_X = 54.5
const KID_HEIGHT = 50
const FLOOR = 96
const TEACHER_HEIGHT = 62
const TEACHER_FLOOR = 95
/** はくしゅ する 手の 高さ */
const CLAP_Y = 74

/* ───── ひくい つくえ・紙・ふで(つくえの 上の 面 は y = 86.5〜91.5) ───── */
const TABLE_X = 54.5
const TABLE_TOP = 91.5
const TABLE_FACE = 5
const CIRCLE: Pt = [53.5, 89]
const CIRCLE_RX = 4.2
const CIRCLE_RY = 1.4
/** はなまる の 花びら(まる の 何ばい の ところに かくか) */
const PETAL_IN = 1.22
const PETAL_OUT = 1.62
/** ふで を たてて もつ 手 は、ふで の 先 の 少し 上 */
const HAND_ABOVE_TIP: Pt = [-0.8, -4.8]
/** 正面 の 子 の 手 の おくゆき(体 の まえ へ。つくえ の 紙 の 上)と、せんせい の 手 の おくゆき */
const REACH = 10
const TEACHER_REACH = 8
/** ふで を 手 に もっている あいだ(つくえ から とる → もどす) */
const BRUSH_IN_HAND_FROM = LESSON + 0.16
const BRUSH_IN_HAND_TO = ALONE + 0.7
/** つくえの 上に ねかせた ふで(先 と おしり)と、それを つまむ ところ */
const BRUSH_TIP_REST: Pt = [47.5, 90]
const BRUSH_END_REST: Pt = [54, 88.6]
const BRUSH_GRIP: Pt = [53, 88.9]

/* ───── お日さま(やねの うしろ。ひかりの 3本が この まんなか から のびて 見える) ───── */
const HALL_WIDTH = 76 // はしら の 外 から 外
const SUN_C: Pt = [59, 47]
const SUN_R = 21


/** まる の 上の点(p = 0 で てっぺん。左まわりに 1しゅう) */
function circlePoint(p: number): Pt {
  return [CIRCLE[0] - CIRCLE_RX * Math.sin(p * Math.PI * 2), CIRCLE[1] - CIRCLE_RY * Math.cos(p * Math.PI * 2)]
}

/** はなまる の 花びら の 上の点(まる の まわりを、7まい の 花びら で ひとまわり) */
function petalPoint(q: number): Pt {
  const a = q * Math.PI * 2
  const k = PETAL_IN + (PETAL_OUT - PETAL_IN) * Math.abs(Math.sin(a * 3.5))
  return [CIRCLE[0] - CIRCLE_RX * k * Math.sin(a), CIRCLE[1] - CIRCLE_RY * k * Math.cos(a)]
}

/** 線を q まで かいた ところ を、こまかい点で つなぐ(ふでの 先 と 線の はし が ぴったり そろう) */
function partialPath(point: (q: number) => Pt, q: number, steps: number): string {
  if (q <= 0) return ''
  const n = Math.max(2, Math.ceil(steps * q))
  return Array.from({ length: n + 1 }, (_, i) => `${i === 0 ? 'M' : 'L'}${xy(point((q * i) / n))}`).join(' ')
}

/** まる を どこまで かいたか。はんぶん までは せんせいと いっしょ、のこりは ひとりで */
const circleDrawn = (t: number): number => 0.5 * span(t, GUIDE_FROM, ALONE) + 0.5 * span(t, ALONE + 0.05, ALONE + 0.5)
const petalsDrawn = (t: number): number => span(t, PETAL_FROM, PETAL_TO)

/** せんせいの 赤い ふで: 手 から 先 まで。先が 外へ いくほど ふでを ねかせる */
const redBrushReach = (tip: Pt): Pt => [(tip[0] - CIRCLE[0]) * 0.45, 6.4]
const redBrushHand = (tip: Pt): Pt => sub(tip, redBrushReach(tip))
/** 花びら を かいていない ときの、手 から 先 まで */
const RED_BRUSH_IDLE = redBrushReach(petalPoint(0))

/** やねの うしろの お日さま。おか の むこう から ゆっくり のぼって、さいごに ひかり が 3本 さす */
function Dawn({ t }: SceneProps) {
  const cy = lerp(86, SUN_C[1], span(t, 0, CHEER + 0.1, easeOut))
  // ひかり は、まんなか(お日さま がわ)から 外へ のびる。画の かきおわり が お日さま がわ
  const beam = span(t, CHEER + 0.15, CHEER + 0.55, easeOut)
  const shimmer = 1 + wave(t, 0.7) * 0.1
  return (
    <>
      <circle cx={SUN_C[0]} cy={cy} r={SUN_R + 11} fill={SUN_GLOW} opacity={0.45} />
      <circle cx={SUN_C[0]} cy={cy} r={SUN_R + 5} fill={SUN_GLOW} opacity={0.7} />
      <circle cx={SUN_C[0]} cy={cy} r={SUN_R} fill={SUN} />
      {beam > 0 &&
        [1, 2, 3].map((n) => (
          <g key={n}>
            <Bone char={CHAR} n={n} color={SUN_GLOW} width={6.4 * shimmer} opacity={0.7} from={1 - beam} to={1} />
            <Bone char={CHAR} n={n} color={SUN} width={2.6} from={1 - beam} to={1} />
          </g>
        ))}
    </>
  )
}

/** はるかぜ に のって、さくら の 花びら が ひらひら とんでくる(学校が はじまる きせつ) */
function FallingPetals({ t }: SceneProps) {
  return (
    <>
      {[0.9, 3.0, 5.0].map((start, i) => {
        const p = span(t, start, start + 3.6)
        if (p <= 0 || p >= 1) return null
        const x = 4 + i * 3 + p * (34 + i * 10) + Math.sin(p * 8 + i) * 4
        const y = -2 + p * 72
        return <ellipse key={start} cx="0" cy="0" rx="1.5" ry="0.9" fill={SAKURA} opacity={1 - p * 0.3} transform={`translate(${x} ${y}) rotate(${Math.sin(p * 9 + i) * 60 + 30})`} />
      })}
    </>
  )
}

/** やね の ある きょうしつ(まえは あいていて、中が 見える)。広間 は Hall、やね は TiledRoof */
function Classroom({ t }: SceneProps) {
  // ゆか・かべ・はしら が 下から たちあがり、さいごに やね が 上から おりてきて、とん と のる
  const posts = span(t, 0, 0.45, backOut)
  const roofDrop = mix(t, 0.3, 0.75, -24, 0, backOut)
  return (
    <>
      <Layer scaleY={posts} origin={[54.5, 107.6]}>
        <Hall x={54.5} width={HALL_WIDTH} top={42} floor={89.8} front={105} roof={false} />
      </Layer>
      <Layer y={roofDrop} opacity={span(t, 0.3, 0.45)}>
        <TiledRoof x={54.5} y={42.8} width={HALL_WIDTH + 2} height={13} />
      </Layer>
    </>
  )
}

/** かべぎわ の いけばな(さくら の えだ) */
function Vase({ t }: SceneProps) {
  const blossoms: readonly Pt[] = [[72.6, 68.6], [82.2, 70.4], [76.8, 67.6], [74.2, 72.4], [80.6, 74.4]]
  return (
    <Layer scale={span(t, 0.75, 1.05, backOut)} origin={[77.5, 89.6]}>
      <rect x="71.6" y="87.4" width="11.8" height="2.4" rx="0.8" fill={WOOD_DARK} />
      <path d="M77.5 80 Q74 74 72.6 68.6 M77.5 80 Q80.6 75 82.2 70.4 M77.5 80 Q77.8 74 76.8 67.6" fill="none" stroke={BARK} strokeWidth="0.9" strokeLinecap="round" />
      {blossoms.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.7" fill={SAKURA} />)}
      <path d="M74.8 87.6 Q73.6 83 75.6 79.4 L79.4 79.4 Q81.4 83 80.2 87.6 Z" fill="#6f9fd8" />
      <path d="M75.4 82.6 H79.6" stroke="#ffffff" strokeWidth="0.7" opacity="0.7" />
    </Layer>
  )
}

/* ───── 子ども ───── */

const SEIZA = posture('seiza', 'front')
/** よろこんで ひろげた うで(かた の たかさ で よこ。手先が 8画目の 線に のる) */
const SPREAD: Limb = { swing: 92, bend: 4 }

/** 子どもの 場所と かっこう。あるいてきて、くるっと こちらを むき、せいざ → 立って とびあがる */
function kidAt(t: number): PersonProps {
  const walking = walk(t, { from: KID_X + 72, to: KID_X, start: ARRIVE, end: SIT - 0.05, build: 'child', height: KID_HEIGHT })
  const turn = turnAround(t, SIT, 'left', 'front')
  const kneel = span(t, SIT + 0.32, SIT + 0.66, easeInOut) * (1 - span(t, CHEER, CHEER + 0.22, easeOut))
  const sit = mixPose(posture('stand', 'front'), SEIZA, kneel)
  const tip = circlePoint(circleDrawn(t))
  const writing: Limb = { to: add(tip, HAND_ABOVE_TIP), depth: REACH }
  const grip: Limb = { to: BRUSH_GRIP, depth: REACH }
  const lap = sit.rightArm ?? SEIZA.rightArm ?? { swing: 4, bend: 8 }
  // ふでを とる → まる を かく → ふでを もどす → 手を ひざへ(ふでを もつ のは 右手 = 画面の 左)
  const right = keyed<Limb>(t, [[SIT + 0.66, lap], [BRUSH_IN_HAND_FROM, grip], [GUIDE_FROM - 0.03, writing], [ALONE + 0.5, writing], [BRUSH_IN_HAND_TO, grip], [ALONE + 0.9, lap]], mixLimb)
  const spread = span(t, CHEER + 0.18, CHEER + 0.55, easeInOut)
  const lean = mix(t, ALONE, ALONE + 0.35, 0, 5) * (1 - span(t, CHEER, CHEER + 0.15))
  const writingNow = t >= GUIDE_FROM - 0.1 && t < ALONE + 0.55
  const face = t >= HANAMARU + 0.75 ? 'joy' : t >= HANAMARU + 0.15 ? 'surprised' : writingNow ? 'normal' : 'smile'
  // ポニーテール: 歩く あいだ は 小さく、とびはねる あいだ は 大きく ゆれる
  const jump = span(t, CHEER + 0.12, CHEER + 0.5)
  return {
    ...walking,
    ...turn,
    y: FLOOR,
    look: LOOKS.girl,
    lift: Math.sin(jump * Math.PI) * 3,
    face,
    // 書く あいだは 紙を 見る。それ いがいは せんせい(画面の 左)を ちらっと 見る
    gaze: writingNow ? 0 : -0.5 * during(t, LESSON + 0.05, CHEER, 0.2),
    gazeY: writingNow ? 1 : 0,
    hairSway: wave(t, 0.4) * (walking.moving ? 6 : 0) + Math.sin(jump * Math.PI) * wave(t, 0.36) * 14,
    opacity: span(t, ARRIVE - 0.05, ARRIVE + 0.1),
    pose: t < SIT ? walking.pose : { ...sit, rightArm: t < CHEER ? right : mixLimb(right, SPREAD, spread), leftArm: t < CHEER ? sit.leftArm : mixLimb(sit.leftArm ?? lap, SPREAD, spread), torso: lean },
  }
}

/* ───── せんせい ───── */

/** せんせいの 場所と かっこう。ずっと せいざ。子どもの 手を とる・ふでを うごかす・はくしゅ は うで だけ かえる */
function teacherAt(t: number, kidHand: Pt): PersonProps & { readonly cx: number; readonly clapPhase: number } {
  // 子どもが すわると、少し そばへ よる(すわった まま すこし ずれる)
  const cx = keyed(t, [[LESSON, 33.5], [LESSON + 0.3, 35.5], [PETAL_TO + 0.05, 35.5], [CHEER + 0.12, 33.5]], lerp)
  const lapRight = SEIZA.rightArm ?? { swing: 6, bend: -10 }
  const lapLeft = SEIZA.leftArm ?? { swing: 6, bend: -10 }
  const hello: Limb = { swing: 150, bend: 25 + wave(t, 0.5) * 8 }
  const guide: Limb = { to: add(kidHand, [-2.2, 0.6]), depth: TEACHER_REACH }
  const petal: Limb = { to: redBrushHand(petalPoint(petalsDrawn(t))) }
  /** はくしゅ の まわり(手が あうたびに 1 ふえる) */
  const clapPhase = t >= CLAP_FROM ? (t - CLAP_FROM) * 3 : -1
  const open = 2 + 3 * Math.abs(Math.sin(Math.max(0, clapPhase) * Math.PI))
  // 手 を むね の まえ へ のばす(まえ へ むく ので うで が みじかく まるく 見えない)
  const clapLeft: Limb = { to: [cx + open, CLAP_Y], depth: TEACHER_REACH }
  const clapRight: Limb = { to: [cx - open, CLAP_Y], depth: TEACHER_REACH }
  const leftArm = keyed<Limb>(t, [[LESSON + 0.18, lapLeft], [GUIDE_FROM - 0.04, guide], [ALONE, guide], [ALONE + 0.25, lapLeft], [PETAL_FROM - 0.2, lapLeft], [PETAL_FROM, petal], [PETAL_TO, petal], [PETAL_TO + 0.12, lapLeft], [CLAP_FROM, clapLeft]], mixLimb)
  const rightArm = keyed<Limb>(t, [[ARRIVE + 0.25, lapRight], [ARRIVE + 0.5, hello], [SIT + 0.15, hello], [SIT + 0.45, lapRight], [CHEER, lapRight], [CLAP_FROM, clapRight]], mixLimb)
  const torso = keyed(t, [[LESSON, 0], [LESSON + 0.3, 5], [PETAL_TO, 5], [CHEER + 0.15, 0]], lerp)
  const head = keyed(t, [[LESSON, 3], [LESSON + 0.3, 6], [PETAL_TO, 6], [CHEER + 0.15, -4]], lerp)
  return {
    x: cx,
    y: TEACHER_FLOOR,
    build: 'adult',
    height: TEACHER_HEIGHT,
    facing: 'front',
    look: { ...LOOKS.woman, glasses: true },
    // 子どもが 入ってくると そちら(画面の 右)を 見る
    gaze: mix(t, ARRIVE, ARRIVE + 0.4, 0, 0.8),
    face: t >= CHEER + 0.1 ? 'joy' : 'smile',
    // 子ども の 手元 を 見る あいだ は 目線 を 下げる
    gazeY: 0.8 * during(t, LESSON + 0.2, PETAL_TO + 0.1, 0.2),
    pose: { ...SEIZA, leftArm, rightArm, torso, head },
    cx,
    clapPhase,
  }
}

/* ───── つくえ・ふで・はくしゅ ───── */

/** ひくい つくえ・紙 と、紙に かいた まる と はなまる。子どもの held に わたす(体の まえ、うで の おく) */
function Table({ t, brushOnTable }: { readonly t: number; readonly brushOnTable: boolean }) {
  const circle = partialPath(circlePoint, circleDrawn(t), 48)
  const petals = partialPath(petalPoint, petalsDrawn(t), 120)
  return (
    <>
      <LowTable x={TABLE_X} y={FLOOR} width={30} height={FLOOR - TABLE_TOP} top={TABLE_FACE} paper />
      {circle && <path d={circle} fill="none" stroke={SUMI} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />}
      {petals && <path d={petals} fill="none" stroke={SHU} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />}
      {brushOnTable && <Tool kind="brush" end={BRUSH_END_REST} tip={BRUSH_TIP_REST} ink={SUMI} />}
    </>
  )
}

/** はくしゅ の「ぱちぱち」。手が あうたびに、よこへ 小さな線が とぶ */
function ClapMarks({ cx, phase }: { readonly cx: number; readonly phase: number }) {
  const hit = phase < 0.5 ? 0 : 1 - Math.min(1, Math.abs(Math.sin(phase * Math.PI)) / 0.5)
  if (hit <= 0) return null
  const at = (a: number, r: number): Pt => [cx + Math.cos(rad(a)) * r, CLAP_Y + Math.sin(rad(a)) * r]
  return (
    <g opacity={hit} stroke="#f2a93b" strokeWidth="0.9" strokeLinecap="round">
      {[-160, 160, -20, 20].map((a) => <path key={a} d={`M${xy(at(a, 4.6))} L${xy(at(a, 7))}`} />)}
    </g>
  )
}

/** すずめ: やねの むね に とまって、子どもが とびあがると おどろいて とんでいく */
function Sparrow({ t }: SceneProps) {
  const arrive = span(t, ARRIVE + 0.5, ARRIVE + 1.1, easeOut)
  const leave = span(t, CHEER + 0.02, CHEER + 0.7, easeInOut)
  if (arrive <= 0 || leave >= 1) return null
  const perch: Pt = [80.4, 27.4]
  const x = arrive < 1 ? lerp(118, perch[0], arrive) : lerp(perch[0], 122, leave)
  const y = arrive < 1 ? lerp(4, perch[1], arrive) - Math.sin(arrive * Math.PI) * 4 : lerp(perch[1], -6, leave)
  const flying = arrive < 1 || leave > 0
  const hop = flying ? 0 : Math.max(0, wave(t, 1.1))
  return <Bird x={x} y={y - hop} t={t} flying={flying} facing={leave > 0 ? 'right' : 'left'} color="#a8743f" dark="#7d5230" />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)
  const kid = kidAt(t)
  const kidHand = personRig(kid).world.arms.right.end
  const teacher = teacherAt(t, kidHand)
  const teacherHand = personRig(teacher).world.arms.left.end
  const holding = span(t, BRUSH_IN_HAND_FROM, BRUSH_IN_HAND_FROM + 0.16) * (1 - span(t, ALONE + 0.55, BRUSH_IN_HAND_TO))
  const brushInHand = t >= BRUSH_IN_HAND_FROM && t < BRUSH_IN_HAND_TO
  const brushTip = lerpPt(BRUSH_TIP_REST, circlePoint(circleDrawn(t)), holding)
  // せんせい と 紙・つくえ は、きょうしつ が できたあと ぽん と出る
  const teacherPop = span(t, 0.6, 0.95, backOut)
  const deskPop = span(t, 0.7, 1.0, backOut)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.05
  // 赤い ふで は、花びら を かく あいだ 先が 線に つく。それ いがいは 手 の 少し 先
  const redBrush = t >= HANAMARU + 0.06 && t <= PETAL_TO + 0.12
  const redTip = t >= PETAL_FROM && t <= PETAL_TO ? petalPoint(petalsDrawn(t)) : add(teacherHand, RED_BRUSH_IDLE)
  const table = (
    <Layer scale={deskPop} origin={[TABLE_X, FLOOR]}>
      <Table t={t} brushOnTable={!brushInHand} />
    </Layer>
  )
  // かさなり: せんせい の 体 → 子 の 体 → つくえ → 子 の うで → せんせい の うで(held に 人 を まるごと わたす)
  const child = <Person {...kid} tools={brushInHand ? { right: { kind: 'brush', tip: brushTip } } : undefined} held={table} />
  return (
    <>
      <Layer opacity={ink.picture}>
        <Dawn t={t} />
        <Backdrop t={t} sun={null} ground={107} clouds={[[92, 15, 0.7]]} tufts={[6, 100]} />
        <Classroom t={t} />
        <Vase t={t} />
        <Sparrow t={t} />
        <Layer scale={teacherPop} opacity={span(t, 0.6, 0.7)} origin={[teacher.cx, TEACHER_FLOOR]}>
          <Person {...teacher} tools={redBrush ? { left: { kind: 'brush', tip: redTip, ink: SHU } } : undefined} held={child} />
        </Layer>
        <ClapMarks cx={teacher.cx} phase={teacher.clapPhase} />
        <FallingPetals t={t} />
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Layer scale={1 + bump} origin={[54.5, 54.5]}>
        <Ink char={CHAR} progress={ink.progress} tint={ink.tint} />
      </Layer>
      <Sparkles cx={54.5} cy={56} progress={ink.sparkle} />
    </>
  )
}

const scene: SceneModule = {
  char: CHAR,
  duration: DURATION,
  beats: [
    { at: 0, label: 'あさ。やねの ある きょうしつ が できる', sound: 'pop' },
    { at: ARRIVE, label: '女の子が やねの 下に やってくる' },
    { at: SIT, label: 'せんせいの となりに すわる', sound: 'pop' },
    { at: LESSON, label: 'せんせいが 手を とって、いっしょに かく' },
    { at: ALONE, label: 'こんどは ひとりで かく' },
    { at: HANAMARU, label: 'せんせいが はなまる を くれる' },
    { at: CHEER, label: 'できた! とびあがって 手を ひろげる。朝日が さす', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '学 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
