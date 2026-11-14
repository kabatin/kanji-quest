/*
 * 玉(たま): きれいな 石を ひもで つないで、点を ひとつ つけて めじるし。(共通部品 sceneFigures で 書きなおした もの)
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … ひもに つないだ いちばん上の 石
 *   2画目(丨)  … 石を とおした ひも(木の えだ から ぶらさがる)
 *   3画目(一)  … まんなかの 石
 *   4画目(一)  … いちばん下の 大きな 石
 *   5画目(丶)  … 石の よこに さげた ふだ に ぬる、赤い 点(めじるし)
 *
 * ながれ
 *   木の えだ から ひもが さがり、大きな 石が ひとつ → 女の子が あるいてきて
 *   「ひとつだけ じゃ さびしいな」と ひもを 見上げる
 *   → はこ(バケツ)の 中で きれいな 石が きらり。「わあ」と 見つける
 *   → 石を 1こずつ バケツから とり出して、ひもに つないでいく(まんなか → 上)
 *   → ふでで 赤い 点を ぬって 「めじるし」 → にっこり
 *   → ほね が ひかって、絵が うすくなり、字「玉」が のこる
 *
 * 女の子は Person(あるきは walk、しゃがむのは posture('squat') を まぜる)。手は 石・ふでの 点へ { to }。
 * うでは みじかい ので、バケツや ふだ の ところは しゃがみ、上の 石を つなぐ ときは のびあがる。
 * 石は held、ふでは tools、バケツは Bucket、小鳥は Bird、えだの しげみは Canopy、「ふう」は Sigh。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, Bird, Bucket, Canopy, HANG_ARM, LOOKS, mixLimb, mixPose, PALETTE, Person, personRig, posture, Sigh, Tool, walk, type Limb, type PersonProps } from '../sceneFigures'

const CHAR = '玉'

const BARK = PALETTE.bark
const BARK_DARK = PALETTE.barkDark
const LEAF = PALETTE.leaf
const LEAF_DARK = PALETTE.leafDark
const JADE = '#4fcf9f'
const JADE_DARK = '#33b58a'
const JADE_LIGHT = '#b8f5de'
const STRING = '#d8a45c'
const TAG = '#f3dfb0'
const TAG_SHADE = '#e0c88e'
const PAINT = '#e8453c'

/** くぎり の時間(秒) */
const WALK_FROM = 0.3
const WALK_TO = 1.1
/** 石が ひとつだけ で さびしそう */
const WISH = 1.1
/** はこの中の 石を 見つける */
const FIND = 1.9
/** まんなかの石を バケツ から とる・ひもに つなぐ */
const GRAB_A = 2.95
const RELEASE_A = 3.95
/** 上の石 */
const GRAB_B = 4.5
const RELEASE_B = 5.5
/** ふで を とって 点を ぬる */
const GRAB_BRUSH = 6.1
const PAINT_FROM = 6.4
const PAINT_TO = 7.0
const BRUSH_BACK = 7.7
const INK = 8.0
const DONE = 10.7
const DURATION = 11.3

/* ───────── 場所の きまり(字の画に そろえる) ───────── */

type Pt = readonly [number, number]

/** ひもの x。2画目の 線 */
const STRING_X = 54
/** えだ の高さ(ひもの うえの はし) */
const BRANCH_Y = 12.5
/** 石の まんなかの 高さ と 長さ(1・3・4画目) */
const TOP_Y = 21
const MID_Y = 54.5
const BOTTOM_Y = 88
const TOP_LENGTH = 50
const MID_LENGTH = 50
const BOTTOM_LENGTH = 54
/** ふだ(5画目の 点を ぬる 板)の ひもを むすぶ ところ */
const TAG_HANG: Pt = [77.5, 58.5]

/** 女の子(左むき)の こし の x と 背の高さ */
const GX = 92
const GIRL_HEIGHT = 84
const GIRL_LOOK = { ...LOOKS.girl, top: '#f283a0', bottomKind: 'dress', accent: '#ffd24a' } as const

/** バケツ(石が 入って いる)と、ふで が たっている ところ */
const PAIL: Pt = [80, 88.8]
const PAIL_WIDTH = 16
const PAIL_HAND: Pt = [80, 79]
const BRUSH_GRIP: Pt = [86, 72]
/** 石の はしを もつので、手 は 石の 右はし */
const MID_HAND: Pt = [STRING_X + MID_LENGTH / 2, MID_Y]
const TOP_HAND: Pt = [STRING_X + TOP_LENGTH / 2, TOP_Y]
/** 5画目の はじまり・おわり(ふでの さき)と、にぎる 手との ずれ */
const DOT_FROM: Pt = [72, 64]
const DOT_TO: Pt = [83.3, 76]
const BRUSH_REST_VEC: Pt = [-3, 8.5]
const BRUSH_PAINT_VEC: Pt = [-5, 9.5]

/* ───────── 動きの 道具 ───────── */

type Keys = readonly (readonly [number, number])[]
type PointKeys = readonly (readonly [number, Pt])[]

/** (時間, 値) の ならびを なめらかに つなぐ */
function keyed(t: number, keys: Keys): number {
  const first = keys[0]
  const last = keys[keys.length - 1]
  if (t <= first[0]) return first[1]
  if (t >= last[0]) return last[1]
  const i = keys.findIndex(([at]) => at > t)
  const [from, a] = keys[i - 1]
  const [to, b] = keys[i]
  return a + (b - a) * span(t, from, to, easeInOut)
}

function keyedPoint(t: number, keys: PointKeys): Pt {
  return [keyed(t, keys.map(([at, p]) => [at, p[0]] as const)), keyed(t, keys.map(([at, p]) => [at, p[1]] as const))]
}

const brushHandAt = (dot: Pt, vec: Pt): Pt => [dot[0] - vec[0], dot[1] - vec[1]]

/** 手 の うごき。バケツ → ひも(まんなか) → バケツ → ひも(うえ) → ふで → 点 → もどす */
const HAND_KEYS: PointKeys = [
  [2.5, PAIL_HAND],
  [GRAB_A, PAIL_HAND],
  [3.0, PAIL_HAND],
  [3.8, MID_HAND],
  [RELEASE_A, MID_HAND],
  [4.4, PAIL_HAND],
  [GRAB_B, PAIL_HAND],
  [5.3, TOP_HAND],
  [RELEASE_B, TOP_HAND],
  [6.0, BRUSH_GRIP],
  [GRAB_BRUSH, BRUSH_GRIP],
  [PAINT_FROM, brushHandAt(DOT_FROM, BRUSH_PAINT_VEC)],
  [PAINT_TO, brushHandAt(DOT_TO, BRUSH_PAINT_VEC)],
  [7.2, brushHandAt(DOT_TO, BRUSH_PAINT_VEC)],
  [BRUSH_BACK, BRUSH_GRIP],
  [7.8, BRUSH_GRIP],
]

/** しゃがむ 度合い(0 = 立つ / 1 = しゃがむ)。バケツ・ふだ の ところは しゃがみ、上の 石は のびあがる */
const CROUCH_KEYS: Keys = [
  [0, 0],
  [2.2, 0],
  [2.9, 1],
  [3.2, 1],
  [3.85, 0],
  [4.15, 0],
  [4.5, 1],
  [4.75, 1],
  [5.35, 0],
  [5.7, 0],
  [6.1, 1],
  [7.7, 1],
  [8.4, 0],
]

/** あたまの かたむき(度。+ で うつむく、- で 上を 見る) */
const HEAD_KEYS: Keys = [
  [0, 0],
  [WISH, 0],
  [1.45, -14],
  [FIND, -14],
  [2.3, 14],
  [GRAB_A, 14],
  [3.6, -4],
  [RELEASE_A, -4],
  [4.4, 10],
  [GRAB_B, 10],
  [5.3, -8],
  [RELEASE_B, -8],
  [6.0, 8],
  [GRAB_BRUSH, 8],
  [PAINT_FROM, 2],
  [PAINT_TO, 8],
  [7.3, 0],
  [BRUSH_BACK, 0],
]

function faceAt(t: number): PersonProps['face'] {
  if (t < WISH) return 'normal'
  if (t < FIND) return 'sad'
  if (t < GRAB_A) return 'surprised'
  if ((t >= RELEASE_A && t < 4.4) || (t >= RELEASE_B && t < 6.0) || t >= 7.3) return 'smile'
  return 'normal'
}

/** 女の子。あるいて きて、しゃがんで 石を とり、立って ひもへ(手の 点は { to }) */
function girlAt(t: number): { readonly girl: PersonProps; readonly hand: Pt; readonly holding: boolean } {
  const w = walk(t, { from: GX + 32, to: GX, start: WALK_FROM, end: WALK_TO, build: 'child', height: GIRL_HEIGHT })
  const crouch = keyed(t, CROUCH_KEYS)
  const hand = keyedPoint(t, HAND_KEYS)
  // 手が しごとを している あいだ は 手の 点へ、おわると ぶらり
  const work = span(t, 2.3, 2.9) * (1 - span(t, 7.9, 8.4))
  const rest: Limb = t < WALK_TO ? (w.pose.rightArm ?? HANG_ARM) : HANG_ARM
  const restFar: Limb = t < WALK_TO ? (w.pose.leftArm ?? HANG_ARM) : HANG_ARM
  const carrying = (t >= GRAB_A && t < RELEASE_A) || (t >= GRAB_B && t < RELEASE_B)
  // 石を はこぶ ときは、もう かたほうの 手も 石の はし に そえる
  const farTarget: Pt = [hand[0] - 9, hand[1] + 1]
  const stand = posture('stand', 'left')
  const squat = posture('squat', 'left')
  const body = mixPose(stand, squat, crouch)
  const near: Limb = mixLimb(rest, { to: hand }, work)
  const far: Limb = mixLimb(restFar, carrying ? { to: farTarget } : { to: [hand[0] - 3, hand[1] + 2] }, work)
  const girl: PersonProps = {
    ...w,
    y: 96,
    build: 'child',
    height: GIRL_HEIGHT,
    look: GIRL_LOOK,
    face: faceAt(t),
    hairSway: wave(t, 0.36) * (w.moving ? 8 : 0),
    opacity: span(t, WALK_FROM, WALK_FROM + 0.1),
    pose: { ...(t < WALK_TO ? w.pose : {}), leftLeg: body.leftLeg, rightLeg: body.rightLeg, torso: body.torso, head: keyed(t, HEAD_KEYS), rightArm: near, leftArm: far },
  }
  return { girl, hand, holding: carrying }
}

/* ───────── 景色 ───────── */

/** 左の 木。みき から えだ が のびて、ひもが さがる(しげみ は Canopy) */
function BranchTree({ t }: SceneProps) {
  const grow = span(t, 0, 0.6, backOut)
  return (
    <>
      <Layer scaleY={grow} origin={[8, 98]}>
        <path d="M7.5 99 C7 70 6.5 44 8.6 26" fill="none" stroke={BARK} strokeWidth="9" strokeLinecap="round" />
        <path d="M5.4 80 q1.4 -5 0.2 -11 M9.6 58 q-1.4 -5 0 -10" fill="none" stroke={BARK_DARK} strokeWidth="1.2" strokeLinecap="round" />
        {/* えだ: ひもの うえの はし(1画目の すぐ上)まで */}
        <path d="M8 28 C14 12 34 8 58 12.5" fill="none" stroke={BARK} strokeWidth="4.4" strokeLinecap="round" />
      </Layer>
      <Canopy x={13} y={14} r={14} grow={span(t, 0.25, 0.8)} sway={wave(t, 3.4) * 1.1} />
      <Layer scale={span(t, 0.25, 0.8, backOut)} origin={[38, 9.4]}>
        <circle cx="38" cy="9.4" r="4" fill={LEAF_DARK} />
        <circle cx="37.4" cy="8.4" r="2.8" fill={LEAF} />
      </Layer>
    </>
  )
}

/* ───────── 石・ひも・ふだ ───────── */

/** きれいな 石(ひすい)。まんなか が 原点、長さ と 色の面で かく */
function Jade({ length }: { readonly length: number }) {
  const half = length / 2
  return (
    <>
      <rect x={-half} y={-4} width={length} height={8} rx={4} fill={JADE_DARK} />
      <rect x={-half} y={-4} width={length} height={5.6} rx={2.8} fill={JADE} />
      <rect x={-half + 3.4} y={-2.8} width={length * 0.4} height={1.5} rx={0.75} fill={JADE_LIGHT} />
    </>
  )
}

/** 石が ひもに つながった しゅんかんの ぶるっ(ゆれて、だんだん おさまる) */
function swingAngle(t: number): number {
  return [RELEASE_A, RELEASE_B].reduce((sum, at) => {
    const dt = t - at
    return dt < 0 ? sum : sum + 2.4 * Math.exp(-2.2 * dt) * Math.sin(dt * 8)
  }, 0)
}

/** ふだ(5画目の 点を ぬる 板)。まんなかの 石の はし から さがる */
function Tag() {
  return (
    <>
      <path d="M73.6 62 L77.5 58.5 L82.2 62" fill="none" stroke={STRING} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="70.5" y="61.5" width="15" height="18" rx="3" fill={TAG_SHADE} />
      <rect x="70.5" y="61.5" width="15" height="16" rx="3" fill={TAG} />
    </>
  )
}

/** 手に もっている 石。手は 石の 右はし を つかむ(うしろから ひもへ あがる ときは すこし ななめ) */
function HeldStone({ t, grab, hand, length }: { readonly t: number; readonly grab: number; readonly hand: Pt; readonly length: number }) {
  const angle = mix(t, grab + 0.05, grab + 0.8, -10, 0)
  const rad = (angle * Math.PI) / 180
  const appear = Math.max(0.01, span(t, grab, grab + 0.2, backOut))
  return (
    <Layer x={hand[0] - (length / 2) * Math.cos(rad)} y={hand[1] - (length / 2) * Math.sin(rad)} rotate={angle} scale={appear}>
      <Jade length={length} />
    </Layer>
  )
}

/** バケツ と 中の 石(バケツの ふち から のぞく) */
function Pail({ t }: SceneProps) {
  const glint = during(t, FIND, GRAB_A - 0.1, 0.2)
  return (
    <>
      <Bucket x={PAIL[0]} y={PAIL[1]} width={PAIL_WIDTH} />
      {t < GRAB_A && <ellipse cx="77" cy="80.4" rx="3.6" ry="3.6" fill={JADE} />}
      {t < GRAB_B && <ellipse cx="82.2" cy="80.8" rx="3.4" ry="3.2" fill={JADE_DARK} />}
      {glint > 0 && (
        <>
          <Star cx={76} cy={74.4} r={3.2 * glint} color="#ffffff" spin={t * 160} />
          <Star cx={83.4} cy={75.4} r={2.4 * glint} color={JADE_LIGHT} spin={-t * 140} />
        </>
      )}
    </>
  )
}

/** 石が ひもに つながった しゅんかんの きらり */
function Twinkle({ t, at, cx, cy }: { readonly t: number; readonly at: number; readonly cx: number; readonly cy: number }) {
  const p = span(t, at, at + 0.7)
  if (p <= 0 || p >= 1) return null
  const s = Math.sin(p * Math.PI)
  return (
    <>
      <Star cx={cx - 22} cy={cy - 6} r={3.2 * s} color="#ffffff" spin={p * 120} />
      <Star cx={cx + 8} cy={cy - 7} r={2.6 * s} color={JADE_LIGHT} spin={-p * 120} />
      <Star cx={cx + 24} cy={cy + 5} r={2.2 * s} color="#ffffff" spin={p * 90} />
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)
  const { girl, hand } = girlAt(t)
  const rig = personRig(girl)
  const [hx, hy] = rig.world.head
  const headR = rig.body.headR * rig.scale
  const handEnd = rig.world.arms.right.end

  // ふで: つかむ まえは バケツの 中に たっている。つかんで いる あいだは 手に もつ
  const brushHeld = t >= GRAB_BRUSH && t < BRUSH_BACK + 0.1
  const brushVec: Pt = brushHeld
    ? [
        mix(t, GRAB_BRUSH, PAINT_FROM, BRUSH_REST_VEC[0], BRUSH_PAINT_VEC[0]) + mix(t, 7.2, BRUSH_BACK, 0, BRUSH_REST_VEC[0] - BRUSH_PAINT_VEC[0]),
        mix(t, GRAB_BRUSH, PAINT_FROM, BRUSH_REST_VEC[1], BRUSH_PAINT_VEC[1]) + mix(t, 7.2, BRUSH_BACK, 0, BRUSH_REST_VEC[1] - BRUSH_PAINT_VEC[1]),
      ]
    : BRUSH_REST_VEC
  const brushTip: Pt = [hand[0] + brushVec[0], hand[1] + brushVec[1]]
  const held = (
    <>
      {t >= GRAB_A && t < RELEASE_A && <HeldStone t={t} grab={GRAB_A} hand={handEnd} length={MID_LENGTH} />}
      {t >= GRAB_B && t < RELEASE_B && <HeldStone t={t} grab={GRAB_B} hand={handEnd} length={TOP_LENGTH} />}
    </>
  )

  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const dot = span(t, PAINT_FROM, PAINT_TO, easeInOut)
  const tagIn = span(t, RELEASE_A + 0.05, RELEASE_A + 0.4, backOut)
  const perch = span(t, 0.5, 0.9)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[99, 9]} tufts={[22, 46, 70, 103]} />
        <BranchTree t={t} />
        <Layer opacity={perch} y={-Math.max(0, wave(t, 2.2, 0.4) - 0.7) * 1.8}>
          <Bird x={31} y={6.4} t={t} facing="left" />
        </Layer>

        {/* ひも と 石(まとめて えだ から ぶらさがり、つながるたびに ぶるっと ゆれる) */}
        <Layer rotate={swingAngle(t)} origin={[STRING_X, BRANCH_Y]}>
          <Layer x={STRING_X} y={BOTTOM_Y} opacity={span(t, 0.3, 0.7)}>
            <Jade length={BOTTOM_LENGTH} />
          </Layer>
          {t >= RELEASE_A && (
            <Layer x={STRING_X} y={MID_Y}>
              <Jade length={MID_LENGTH} />
            </Layer>
          )}
          {t >= RELEASE_B && (
            <Layer x={STRING_X} y={TOP_Y}>
              <Jade length={TOP_LENGTH} />
            </Layer>
          )}
          <path d={`M${STRING_X} ${BRANCH_Y} V${BOTTOM_Y + 4}`} stroke={STRING} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx={STRING_X} cy={BRANCH_Y} r="2" fill="none" stroke={STRING} strokeWidth="1.1" />
          <circle cx={STRING_X} cy={BOTTOM_Y + 4.4} r="1.7" fill={STRING} />
        </Layer>

        {/* ふで: つかむ まえ・もどした あとは、バケツの 中に たっている */}
        {!brushHeld && <Tool kind="brush" end={BRUSH_GRIP} tip={[BRUSH_GRIP[0] + BRUSH_REST_VEC[0], BRUSH_GRIP[1] + BRUSH_REST_VEC[1]]} ink={PAINT} width={1.4} />}
        <Pail t={t} />
        {/* ふだ は バケツより 手前(ひもと いっしょに ゆれる) */}
        {t >= RELEASE_A && (
          <Layer rotate={swingAngle(t)} origin={[STRING_X, BRANCH_Y]}>
            <Layer scale={tagIn} origin={TAG_HANG}>
              <Tag />
              <Bone char={CHAR} n={5} color={PAINT} width={3.6} to={dot} />
            </Layer>
          </Layer>
        )}

        <Person {...girl} held={held} tools={brushHeld ? { right: { kind: 'brush', tip: brushTip, ink: PAINT } } : undefined} />
        <Sigh x={hx - headR * 0.9} y={hy + headR * 0.35} p={span(t, 1.35, FIND, easeOut)} show={during(t, 1.35, FIND, 0.2)} dir={-1} />
        <Twinkle t={t} at={RELEASE_A} cx={STRING_X} cy={MID_Y} />
        <Twinkle t={t} at={RELEASE_B} cx={STRING_X} cy={TOP_Y} />
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
    { at: 0, label: '木の えだ から ひもが さがり、大きな 石が ひとつ', sound: 'pop' },
    { at: WALK_FROM, label: '女の子が あるいてくる' },
    { at: WISH, label: '「ひとつだけ じゃ さびしいな」と 見上げる' },
    { at: FIND, label: 'バケツの中で きれいな 石が きらり', sound: 'pop' },
    { at: GRAB_A, label: '石を ひもに つなぐ(まんなか)' },
    { at: GRAB_B, label: 'もう ひとつ つなぐ(上)' },
    { at: GRAB_BRUSH, label: 'ふでで 赤い 点を ぬって めじるし' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '玉 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
