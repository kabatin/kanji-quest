/*
 * 広(ひろい): 大きな やねの 下は ひろびろ。(共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … やねの てっぺんに 立てた はた の ぼう
 *   2画目(一)  … 大きな やね(よこに ながい 平らな やね)
 *   3画目(ノ)  … やねの 左はしを ささえる ななめの はしら(下は 石の だい)
 *   4画目(厶)  … 男の子が 高く なげた ボール が、おちて はずみ、おくへ ころがる みち
 *   5画目(丶)  … ボールを おいかけて 走る 男の子の ななめの 動き(おわりの あたり)
 *
 * ながれ
 *   はしら が たち、大きな やね が ぽん と のる(はた も あがる)
 *   → あつくて ぐったりした 男の子が あるいてくる。やねの 下に はいると、かげで すずしい
 *   → 「ふう」 と ひといき。こちらを むいて、「ひろーい!」 と りょううでを ひろげる
 *   → うれしくて ボールを たかく なげる。ボールは はずんで おくへ ころがり、男の子は おいかけて はしゃぐ
 *   → ボールの みち が 4画目、男の子の ななめの 動き が 5画目の あたりに そろった しゅんかん、
 *     ほね が ひかって、絵が うすくなり、字「広」が のこる
 *
 * 人は Person。あるきは walk、はしりは run、むきは turnAround(横 → 正面 → 横 → 右むき)。
 * ボールは 右手(体の みぎ)に もち、手の さきの 場所は personRig で 出す。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, span, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, HANG_ARM, LOOKS, mixLimb, PALETTE, Person, personRig, run, Sigh, Sweat, turnAround, walk, type Limb, type PersonProps } from '../sceneFigures'

const CHAR = '広'

const ROOF = '#d9604a'
const ROOF_DARK = '#b44a37'
const ROOF_LIGHT = '#f08a74'
const WOOD_DARK = '#70452b'
const STONE = '#b7b2a8'
const STONE_DARK = '#98938a'
const FLAG = '#e8534a'
const FLOOR = '#ecd9ad'
const FLOOR_DARK = '#d9c18a'
const SHADE = '#6f9fc8'
const BALL = '#e8534a'
const BALL_LIGHT = '#ff8a7c'
const BOY_LOOK = { ...LOOKS.boy, top: '#f2a93b', bottom: '#4f7fc4', bottomKind: 'shorts', sleeves: 'short' } as const

/** くぎり の時間(秒) */
const ROOF_AT = 0.5
const FLAG_AT = 0.95
const WALK = 1.0
const WALK_TO = 2.9
/** やねの 下に はいって、かげで ほっとする */
const ENTER = 2.1
/** 見まわして りょううでを ひろげる */
const SPREAD = 3.3
const SHIFT = 4.15
const WINDUP = 4.7
/** ボールが 手から はなれる */
const RELEASE = 4.95
const APEX = 5.35
/** ボールを みおくって、体を 右へ むける */
const FACE_RIGHT = 5.6
const BOUNCE = 5.95
const ROLL_END = 6.7
const INK = 6.9
const DONE = 9.6
const DURATION = 10

/** 地面(男の子の 足もと) */
const FEET_Y = 95.5
const KID_HEIGHT = 40
/** 男の子の いる ばしょ: やねの 下 → ボールを なげる ばしょ → おいかけて とまる ばしょ */
const UNDER_X = 75
const THROW_X = 66
const CHASE_X = 78
/** ボールの みち(4画目の 通り道の点) */
const FALL_PATH: readonly (readonly [number, number])[] = [[59.5, 45], [54.6, 58.1], [47.5, 70.5], [40.1, 82.7], [39.4, 92]]
const ROLL_PATH: readonly (readonly [number, number])[] = [[39.4, 92], [53.4, 89], [67.4, 86.1], [81.4, 83.3]]

/** 点を つないだ みち の上の、はじめから p(0〜1)の ところ */
function along(points: readonly (readonly [number, number])[], p: number): readonly [number, number] {
  const lengths = points.slice(1).map((pt, i) => Math.hypot(pt[0] - points[i][0], pt[1] - points[i][1]))
  const total = lengths.reduce((sum, len) => sum + len, 0)
  let rest = Math.min(Math.max(p, 0), 1) * total
  for (let i = 0; i < lengths.length; i += 1) {
    if (rest <= lengths[i] || i === lengths.length - 1) {
      const q = lengths[i] === 0 ? 0 : Math.min(rest / lengths[i], 1)
      return [points[i][0] + (points[i + 1][0] - points[i][0]) * q, points[i][1] + (points[i + 1][1] - points[i][1]) * q]
    }
    rest -= lengths[i]
  }
  return points[points.length - 1]
}

/* ───────── 男の子の ようす(時間から きまる) ───────── */

const WALK_PLAN = { build: 'child', height: KID_HEIGHT, armSwing: 10 } as const
const RIGHT_REST: Limb = { swing: 10, bend: 20 }
const LEFT_REST: Limb = { swing: 8, bend: 12 }
/** ボールを もって あるく 右うで / りょううでを 横へ ひろげる / ボールを あたまの 上へ ふりあげる */
const RIGHT_CARRY: Limb = { swing: 18, bend: 50 }
const SPREAD_ARM: Limb = { swing: 88, bend: 6 }
const OVERHEAD: Limb = { swing: 138, bend: 10 }

/** 男の子の ばしょ・むき・ポーズ。右手が ボールを もつ */
function kidAt(t: number): PersonProps {
  const arrive = walk(t, { from: 122, to: UNDER_X, start: WALK, end: WALK_TO, ...WALK_PLAN })
  const shift = walk(t, { from: UNDER_X, to: THROW_X, start: SHIFT, end: WINDUP, ...WALK_PLAN })
  const chase = run(t, { from: THROW_X, to: CHASE_X, start: BOUNCE, end: ROLL_END, build: 'child', height: KID_HEIGHT, stride: 14 })

  if (t >= BOUNCE) {
    // おいかけて、とまったら りょうてを あげて よろこぶ
    const cheer = span(t, ROLL_END, ROLL_END + 0.3, easeOut)
    const hop = Math.sin(span(t, ROLL_END + 0.05, ROLL_END + 0.35) * Math.PI) * 2.5
    const up: Limb = { swing: 150, bend: 12 }
    const pose = { ...chase.pose, rightArm: mixLimb(chase.pose.rightArm ?? HANG_ARM, up, cheer), leftArm: mixLimb(chase.pose.leftArm ?? HANG_ARM, up, cheer) }
    return { ...chase, y: FEET_Y, look: BOY_LOOK, face: 'joy', pose, lift: (chase.lift ?? 0) + hop }
  }

  const turn = t < SHIFT - 0.3 ? turnAround(t, WALK_TO, 'left', 'front') : t < FACE_RIGHT ? turnAround(t, SHIFT - 0.3, 'front', 'left') : turnAround(t, FACE_RIGHT, 'left', 'right')
  const x = t < WALK_TO ? arrive.x : t < SHIFT ? UNDER_X : shift.x
  const legs = t < WALK_TO ? arrive.pose : t >= SHIFT && t < WINDUP ? shift.pose : {}
  const walkArm = t < WALK_TO ? arrive.pose.leftArm : shift.pose.leftArm

  // みぎうで(ボール): もって あるく → ひろげる → ふりあげて なげる → おろす
  const spread = span(t, SPREAD, SPREAD + 0.6, easeOut) - span(t, SHIFT - 0.1, SHIFT + 0.3)
  const windup = span(t, WINDUP, RELEASE, easeOut)
  const drop = span(t, 5.2, FACE_RIGHT, easeInOut)
  const rest = mixLimb(t < WALK_TO ? RIGHT_CARRY : RIGHT_REST, SPREAD_ARM, spread)
  const right = mixLimb(mixLimb(rest, OVERHEAD, windup), RIGHT_REST, drop)
  const left = mixLimb(walkArm ?? LEFT_REST, SPREAD_ARM, spread)
  const tired = t < ENTER
  const face = tired ? 'sleepy' : t < SPREAD ? 'smile' : t < SHIFT ? 'surprised' : 'joy'
  return { x, y: FEET_Y, ...WALK_PLAN, ...turn, look: BOY_LOOK, face, pose: { ...legs, rightArm: right, leftArm: left, torso: tired ? 5 : 0 } }
}

/** 右手に もった ボールの 中心(手の さきの すこし さき) */
function heldBall(kid: PersonProps): readonly [number, number] {
  const arm = personRig(kid).world.arms.right
  const len = Math.hypot(arm.end[0] - arm.mid[0], arm.end[1] - arm.mid[1]) || 1
  return [arm.end[0] + ((arm.end[0] - arm.mid[0]) / len) * 3.2, arm.end[1] + ((arm.end[1] - arm.mid[1]) / len) * 3.2]
}

/* ───────── ぶひん ───────── */

/** やね の 下の ゆか(おくに ゆくほど 上に 見える)と、すずしい かげ */
function Floor({ t }: SceneProps) {
  const shade = span(t, ROOF_AT + 0.3, ROOF_AT + 0.9)
  return (
    <Layer opacity={shade}>
      <polygon points="27.6,34 97,34 97,97 13,97 12,87" fill={SHADE} opacity="0.1" />
      <polygon points="24,80 95,80 100,97.5 12,97.5" fill={FLOOR} />
      <path d="M12 97.5 H100" stroke={FLOOR_DARK} strokeWidth="1.6" strokeLinecap="round" />
    </Layer>
  )
}

/** はしら: 右の 立ちばしら と、左の ななめの はしら(3画目)と その 石の だい */
function Posts({ t }: SceneProps) {
  const rise = span(t, 0.05, 0.55, backOut)
  return (
    <>
      <Layer scaleY={rise} origin={[93.5, 97]}>
        <rect x="91.4" y="30" width="4.2" height="66" rx="1.8" fill={PALETTE.bark} />
        <rect x="94.2" y="30" width="1.4" height="66" fill={WOOD_DARK} />
      </Layer>
      <ellipse cx="93.5" cy="96.8" rx={5.2 * Math.min(rise, 1)} ry="2.3" fill={STONE} />
      <Layer scale={rise} origin={[12, 87]}>
        <Bone char={CHAR} n={3} color={PALETTE.bark} width={4.6} />
      </Layer>
      <Layer scale={Math.min(rise, 1)} origin={[11, 92]}>
        <ellipse cx="11.5" cy="90.5" rx="7" ry="5.4" fill={STONE_DARK} />
        <ellipse cx="11" cy="89.2" rx="6" ry="4.2" fill={STONE} />
      </Layer>
    </>
  )
}

/** 大きな やね(2画目)。ぽん と のって、はた(1画目)が あがる */
function Roof({ t }: SceneProps) {
  const drop = span(t, ROOF_AT, ROOF_AT + 0.5, backOut)
  const flag = span(t, FLAG_AT, FLAG_AT + 0.4, backOut)
  const flutter = Math.sin(t * 9) * 3
  return (
    <Layer y={-26 * (1 - drop)} opacity={span(t, ROOF_AT - 0.2, ROOF_AT + 0.1)}>
      <g transform="translate(0 1.8)">
        <Bone char={CHAR} n={2} color={ROOF_DARK} width={8.4} />
        <path d="M89.6 28.6 L96.4 29" stroke={ROOF_DARK} strokeWidth="8.4" strokeLinecap="round" />
      </g>
      <Bone char={CHAR} n={2} color={ROOF} width={7.2} />
      <path d="M89.6 28.6 L96.4 29" stroke={ROOF} strokeWidth="7.2" strokeLinecap="round" />
      <g transform="translate(0 -2.1)">
        <Bone char={CHAR} n={2} color={ROOF_LIGHT} width={1.6} from={0.05} to={0.95} />
      </g>
      {/* はた の ぼう(1画目)と はた */}
      <Layer scale={flag} origin={[56.6, 28.7]}>
        <Bone char={CHAR} n={1} color={WOOD_DARK} width={1.9} />
        <Layer rotate={flutter} origin={[56.2, 19.4]}>
          <path d="M56.8 15.4 L67.4 18.6 L56.8 22.2 Z" fill={FLAG} />
        </Layer>
      </Layer>
    </Layer>
  )
}

/** ボール。おくへ ゆくほど 少し 小さく、上に 見える。かげ が 足もとに のこる */
function BallPicture({ t, ball, groundY }: { readonly t: number; readonly ball: readonly [number, number]; readonly groundY: number }) {
  const depth = Math.min(Math.max((FEET_Y - groundY) / 14, 0), 1)
  const r = Math.max(0.5, 3.7 - depth * 0.7)
  const spin = (ball[0] + ball[1]) * 9 + t * 40
  const flying = ball[1] < groundY - 1
  return (
    <>
      <ellipse cx={ball[0]} cy={groundY + 0.4} rx={r * (flying ? 0.8 : 1)} ry={r * 0.32} fill="#000000" opacity={flying ? 0.1 : 0.16} />
      <Layer x={ball[0]} y={ball[1]} rotate={spin}>
        <circle cx="0" cy="0" r={r} fill={BALL} />
        <path d={`M${-r} 0 Q0 ${r * 0.5} ${r} 0`} fill="none" stroke="#ffffff" strokeWidth={r * 0.32} />
        <circle cx={-r * 0.35} cy={-r * 0.4} r={r * 0.28} fill={BALL_LIGHT} />
      </Layer>
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)
  const kid = kidAt(t)
  const head = personRig(kid).world.head
  const visible = span(t, WALK - 0.1, WALK)

  // ボール: 手に もつ → たかく なげる → おちて はずむ → おくへ ころがる
  const released = heldBall(kidAt(RELEASE))
  let ball: readonly [number, number]
  // ボールの かげ(地面)の 高さ
  let groundY: number
  if (t < RELEASE) {
    ball = heldBall(kid)
    groundY = FEET_Y
  } else if (t < APEX) {
    const p = span(t, RELEASE, APEX)
    ball = [released[0] + (FALL_PATH[0][0] - released[0]) * p, released[1] + (FALL_PATH[0][1] - released[1]) * easeOut(p)]
    groundY = 90
  } else if (t < BOUNCE) {
    ball = along(FALL_PATH, span(t, APEX, BOUNCE, easeIn))
    groundY = 95
  } else {
    // おくへ ころがる: ボールの すぐ下が 地面
    ball = along(ROLL_PATH, span(t, BOUNCE, ROLL_END, easeOut))
    groundY = ball[1] + 3.4
  }
  const showBall = t >= WALK + 0.1
  // はしゃぐ ほし
  const cheerStars = during(t, ROLL_END, INK + 0.3, 0.2)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} clouds={[[84, 12, 0.8], [102, 22, 0.6]]} tufts={[6, 104]} />
        <Floor t={t} />
        <Posts t={t} />
        <Roof t={t} />
        {showBall && t >= APEX ? <BallPicture t={t} ball={ball} groundY={groundY} /> : null}
        <Layer opacity={visible}>
          <Person {...kid} />
          <Sweat t={t} x={head[0] + 7} y={head[1] - 2} show={during(t, WALK + 0.1, ENTER + 0.3, 0.2)} dir={1} />
          <Sigh x={head[0] - 6} y={head[1] + 6} p={span(t, ENTER, ENTER + 0.8, easeOut)} show={during(t, ENTER, ENTER + 0.8, 0.2)} />
        </Layer>
        {showBall && t < APEX ? <BallPicture t={t} ball={ball} groundY={groundY} /> : null}
        {cheerStars > 0 ? (
          <g opacity={cheerStars}>
            <Star cx={kid.x - 15} cy={FEET_Y - 44} r={2.4} color="#ffc233" spin={t * 90} />
            <Star cx={kid.x + 16} cy={FEET_Y - 42} r={2.9} color="#ff7a4d" spin={-t * 80} />
            <Star cx={kid.x + 2} cy={FEET_Y - 52} r={2} color="#ffd95a" spin={t * 70} />
          </g>
        ) : null}
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
    { at: 0, label: 'はしらが たち、大きな やねが のる', sound: 'pop' },
    { at: WALK, label: 'あつくて ぐったりした 男の子が あるいてくる' },
    { at: ENTER, label: 'やねの 下は かげで すずしい。ふう', sound: 'pop' },
    { at: SPREAD, label: 'こちらを むいて「ひろーい!」と りょううでを ひろげる' },
    { at: WINDUP, label: 'うれしくて ボールを たかく なげる', sound: 'pop' },
    { at: BOUNCE, label: 'ボールが はずんで おくへ ころがる。おいかけて はしゃぐ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '広 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
