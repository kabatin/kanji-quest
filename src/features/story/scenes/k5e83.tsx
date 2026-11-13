/*
 * 広(ひろい): 大きな やねの 下は ひろびろ。
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
 *   → 「ふう」 と ひといき。見まわして、「ひろーい!」 と りょううでを ひろげる
 *   → うれしくて ボールを たかく なげる。ボールは はずんで おくへ ころがり、男の子は おいかけて はしゃぐ
 *   → ボールの みち が 4画目、男の子の ななめの 動き が 5画目の あたりに そろった しゅんかん、
 *     ほね が ひかって、絵が うすくなり、字「広」が のこる
 *
 * 人・ボール・やね は、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく、どう の まんなか の上。
 *   ボールが ころがる とき、おくへ ゆくほど 絵の上のほうに なり、少し 小さく なる(おくゆき)。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '広'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#f2a93b'
const SHIRT_DARK = '#d98f22'
const SHORTS = '#4f7fc4'
const SHOE = '#6b4a36'
const CHEEK = '#ff9d9d'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const ROOF = '#d9604a'
const ROOF_DARK = '#b44a37'
const ROOF_LIGHT = '#f08a74'
const WOOD = '#8c5b3c'
const WOOD_DARK = '#70452b'
const STONE = '#b7b2a8'
const STONE_DARK = '#98938a'
const FLAG = '#e8534a'
const FLOOR = '#ecd9ad'
const FLOOR_DARK = '#d9c18a'
const SHADE = '#6f9fc8'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const BALL = '#e8534a'
const BALL_LIGHT = '#ff8a7c'

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
const BOUNCE = 5.95
const ROLL_END = 6.7
const INK = 6.9
const DONE = 9.6
const DURATION = 10

/** 地面(男の子の 足もと) */
const FEET_Y = 95.5
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

type Mood = 'tired' | 'relieved' | 'amazed' | 'joy'
/** うで の かっこう。swing = ま下から 外へ ひらいた角度 / bend = ひじ の まがり */
type ArmPose = { readonly swing: number; readonly bend: number }

type ChildState = {
  readonly cx: number
  readonly lift: number
  readonly step: number
  readonly mood: Mood
  readonly armL: ArmPose
  readonly armR: ArmPose
  readonly tilt: number
}

const ARM_PART = 6.4
const SHOULDER_X = 5.2
const SHOULDER_Y = -21
const rad = (deg: number) => (deg * Math.PI) / 180

/** かた → ひじ → 手 の 場所(男の子の 足もと が 0,0)。side: 左 = -1 / 右 = 1 */
function armPoints(side: 1 | -1, pose: ArmPose) {
  const sh = [side * SHOULDER_X, SHOULDER_Y] as const
  const elbow = [sh[0] + side * Math.sin(rad(pose.swing)) * ARM_PART, sh[1] + Math.cos(rad(pose.swing)) * ARM_PART] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] + side * Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART] as const
  // 手の さき(ボールを にぎる 向き)
  const tip = [side * Math.sin(rad(fore)), Math.cos(rad(fore))] as const
  return { sh, elbow, hand, tip }
}

function childAt(t: number): ChildState {
  // あるく: 右から やねの 下まで。つぎに 少し ボールを なげる 場所へ。さいごに ボールを おいかける
  const s1 = span(t, SHIFT, WINDUP, easeInOut)
  const s2 = span(t, 5.5, ROLL_END, easeInOut)
  const cx = mix(t, WALK, WALK_TO, 122, 75, (x) => x) - 9 * s1 + 8 * s2
  const walk1 = t >= WALK && t < WALK_TO ? Math.sin((t - WALK) * Math.PI * 2 * 1.9) * (1 - span(t, WALK_TO - 0.25, WALK_TO)) : 0
  const walk2 = t >= SHIFT && t < WINDUP ? Math.sin((t - SHIFT) * Math.PI * 2 * 2) * Math.sin(span(t, SHIFT, WINDUP) * Math.PI) : 0
  const step = walk1 + walk2
  // はしゃぐ: ボールを おいかけて とびはねる(字になる ちょくぜんは 地面に もどる)
  const cheering = t >= 5.45 && t < INK
  const hop = cheering ? Math.abs(Math.sin(((t - 5.45) * Math.PI) / 0.42)) * 2.4 * (1 - span(t, INK - 0.35, INK)) : 0
  const lift = hop + Math.abs(step) * 0.9

  const mood: Mood = t < ENTER ? 'tired' : t < SPREAD ? 'relieved' : t < SHIFT ? 'amazed' : 'joy'

  const spread = span(t, SPREAD, SPREAD + 0.6, easeOut) - span(t, SHIFT - 0.1, SHIFT + 0.3)
  const windup = span(t, WINDUP, RELEASE, easeOut)
  const cheer = span(t, 5.2, 5.6, easeOut)
  const tired = t < ENTER ? 1 : 0
  // ボールを もつ 左手: ひろげて、たかく ふりあげて、はなす
  const swingL = Math.max(0, 8 - tired * 3 + 72 * spread + 150 * windup - 8 * cheer - walk1 * 6)
  const swingR = Math.max(0, 8 - tired * 3 + 72 * spread + 142 * cheer + walk1 * 6 + (cheer > 0.99 ? wave(t, 0.35) * 8 : 0))
  const upL = windup > 0.5 ? 8 : 0
  const armL: ArmPose = { swing: swingL, bend: tired ? 8 : 12 - 12 * spread + upL }
  const armR: ArmPose = { swing: swingR, bend: tired ? 8 : 12 - 12 * spread + 10 * cheer }

  const tilt = t < ENTER ? -6 + wave(t, 0.5) * 1.2 : t < SPREAD ? 3 : t < SHIFT ? -wave(t, 1.6) * 3 : cheering ? wave(t, 0.42) * 4 : -4 * span(t, 4.7, RELEASE)
  return { cx, lift, step, mood, armL, armR, tilt }
}

/* ───────── ぶひん ───────── */

function Ground({ t }: { readonly t: number }) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 94 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="80" cy="14" rx="7" ry="3.2" />
        <ellipse cx="85" cy="12.4" rx="5" ry="3.2" />
        <ellipse cx="100" cy="24" rx="6" ry="2.6" />
        <ellipse cx="104.4" cy="22.6" rx="4.2" ry="2.8" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 104].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** やね の 下の ゆか(おくに ゆくほど 上に 見える)と、すずしい かげ */
function Floor({ t }: { readonly t: number }) {
  const shade = span(t, ROOF_AT + 0.3, ROOF_AT + 0.9)
  return (
    <>
      <Layer opacity={shade}>
        <polygon points="27.6,34 97,34 97,97 13,97 12,87" fill={SHADE} opacity="0.1" />
        <polygon points="24,80 95,80 100,97.5 12,97.5" fill={FLOOR} />
        <path d="M12 97.5 H100" stroke={FLOOR_DARK} strokeWidth="1.6" strokeLinecap="round" />
      </Layer>
    </>
  )
}

/** はしら: 右の 立ちばしら と、左の ななめの はしら(3画目)と その 石の だい */
function Posts({ t }: { readonly t: number }) {
  const rise = span(t, 0.05, 0.55, backOut)
  return (
    <>
      <Layer scaleY={rise} origin={[93.5, 97]}>
        <rect x="91.4" y="30" width="4.2" height="66" rx="1.8" fill={WOOD} />
        <rect x="94.2" y="30" width="1.4" height="66" fill={WOOD_DARK} />
      </Layer>
      <ellipse cx="93.5" cy="96.8" rx={5.2 * Math.min(rise, 1)} ry="2.3" fill={STONE} />
      <Layer scale={rise} origin={[12, 87]}>
        <Bone char={CHAR} n={3} color={WOOD} width={4.6} />
      </Layer>
      <Layer scale={Math.min(rise, 1)} origin={[11, 92]}>
        <ellipse cx="11.5" cy="90.5" rx="7" ry="5.4" fill={STONE_DARK} />
        <ellipse cx="11" cy="89.2" rx="6" ry="4.2" fill={STONE} />
      </Layer>
    </>
  )
}

/** 大きな やね(2画目)。ぽん と のって、はた(1画目)が あがる */
function Roof({ t }: { readonly t: number }) {
  const drop = span(t, ROOF_AT, ROOF_AT + 0.5, backOut)
  const flag = span(t, FLAG_AT, FLAG_AT + 0.4, backOut)
  const flutter = wave(t, 0.7) * 3
  return (
    <>
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
    </>
  )
}

/** 男の子の うで。かた → ひじ → 手 の じゅんに つながる */
function Arm({ side, pose }: { readonly side: 1 | -1; readonly pose: ArmPose }) {
  const { sh, elbow, hand } = armPoints(side, pose)
  return (
    <>
      <path d={`M${sh[0]} ${sh[1]} L${elbow[0]} ${elbow[1]}`} fill="none" stroke={SHIRT_DARK} strokeWidth="4" strokeLinecap="round" />
      <path d={`M${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={SKIN} strokeWidth="3.2" strokeLinecap="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2" fill={SKIN} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="-4.6" cy="-27.2" r="1.3" fill={CHEEK} opacity="0.55" />
      <circle cx="4.6" cy="-27.2" r="1.3" fill={CHEEK} opacity="0.55" />
      {mood === 'tired' ? (
        <>
          <path d="M-4.2 -31.6 l3 1" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <path d="M4.2 -31.6 l-3 1" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <circle cx="-2.6" cy="-29.4" r="0.95" fill={EYE} />
          <circle cx="2.6" cy="-29.4" r="0.95" fill={EYE} />
          <ellipse cx="0" cy="-25.6" rx="1.2" ry="1.5" fill={MOUTH} />
        </>
      ) : null}
      {mood === 'relieved' ? (
        <>
          <path d="M-4 -29.2 Q-2.6 -31 -1.2 -29.2" fill="none" stroke={EYE} strokeWidth="1" strokeLinecap="round" />
          <path d="M1.2 -29.2 Q2.6 -31 4 -29.2" fill="none" stroke={EYE} strokeWidth="1" strokeLinecap="round" />
          <path d="M-1.8 -26 Q0 -24.4 1.8 -26" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
        </>
      ) : null}
      {mood === 'amazed' ? (
        <>
          <circle cx="-2.7" cy="-29.4" r="1.35" fill={EYE} />
          <circle cx="2.7" cy="-29.4" r="1.35" fill={EYE} />
          <circle cx="-2.3" cy="-29.9" r="0.45" fill="#ffffff" />
          <circle cx="3.1" cy="-29.9" r="0.45" fill="#ffffff" />
          <ellipse cx="0" cy="-25.3" rx="1.5" ry="1.9" fill={MOUTH} />
        </>
      ) : null}
      {mood === 'joy' ? (
        <>
          <path d="M-4 -29.2 Q-2.6 -31 -1.2 -29.2" fill="none" stroke={EYE} strokeWidth="1" strokeLinecap="round" />
          <path d="M1.2 -29.2 Q2.6 -31 4 -29.2" fill="none" stroke={EYE} strokeWidth="1" strokeLinecap="round" />
          <path d="M-2.8 -26.6 Q0 -22.6 2.8 -26.6 Z" fill={MOUTH} />
        </>
      ) : null}
    </>
  )
}

/** 男の子(まえむき)。足もと が 0,0 */
function Child({ state, t }: { readonly state: ChildState; readonly t: number }) {
  const { step, mood, armL, armR, tilt } = state
  // 足を かわりばんこに ふる
  const legRot = step * 14
  const drip = ((t * 1.1) % 1)
  return (
    <>
      <Layer rotate={legRot} origin={[-2.4, -10]}>
        <rect x="-4.2" y="-9" width="3.6" height="8" rx="1.6" fill={SKIN} />
        <ellipse cx="-2.4" cy="-1" rx="3" ry="1.5" fill={SHOE} />
      </Layer>
      <Layer rotate={-legRot} origin={[2.4, -10]}>
        <rect x="0.6" y="-9" width="3.6" height="8" rx="1.6" fill={SKIN} />
        <ellipse cx="2.4" cy="-1" rx="3" ry="1.5" fill={SHOE} />
      </Layer>
      {/* どう: シャツ と ズボン */}
      <rect x="-5.4" y="-12" width="10.8" height="5.4" rx="2" fill={SHORTS} />
      <rect x="-5.6" y="-23.6" width="11.2" height="13.8" rx="4.4" fill={SHIRT} />
      <path d="M-4.6 -12.4 h9.2" stroke={SHIRT_DARK} strokeWidth="1.2" strokeLinecap="round" />
      {/* くび: みじかく、どう の まんなか の上 */}
      <rect x="-1.8" y="-24.4" width="3.6" height="3.4" rx="1.4" fill={SKIN_SHADE} />
      <Layer rotate={tilt} origin={[0, -23]}>
        <circle cx="0" cy="-30" r="7.2" fill={SKIN} />
        <path d="M-7.3 -30.5 C-8.4 -38.8 8.4 -38.8 7.3 -30.5 C5 -34.4 -5 -34.4 -7.3 -30.5 Z" fill={HAIR} />
        <path d="M1.2 -36.4 Q2.6 -39.6 4 -36.8" fill="none" stroke={HAIR} strokeWidth="1.4" strokeLinecap="round" />
        <Face mood={mood} />
      </Layer>
      <Arm side={-1} pose={armL} />
      <Arm side={1} pose={armR} />
      {/* あせ: あつくて ぐったり している間 */}
      {mood === 'tired' ? (
        <g fill="#7cc4f2">
          {[0, 0.5].map((offset) => {
            const p = (drip + offset) % 1
            return <path key={offset} d="M0 -2.2 Q1.8 0.6 0 1.8 Q-1.8 0.6 0 -2.2 Z" transform={`translate(${offset === 0 ? 8.6 : -8.8} ${-33 + p * 8})`} opacity={1 - p} />
          })}
        </g>
      ) : null}
    </>
  )
}

/** かげに はいった しゅんかんの「ふう」 */
function Sigh({ t, x }: { readonly t: number; readonly x: number }) {
  const show = during(t, ENTER, ENTER + 0.8, 0.2)
  if (show <= 0) return null
  const p = span(t, ENTER, ENTER + 0.8, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={x - 9 - p * 6} cy={FEET_Y - 24 - p * 5} rx={2.6 + p * 2.4} ry={1.8 + p * 1.5} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
      <ellipse cx={x - 7 - p * 3} cy={FEET_Y - 22.5 - p * 2} rx={1.3 + p} ry={1 + p * 0.6} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
    </g>
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
  const child = childAt(t)
  const visible = span(t, WALK - 0.1, WALK)

  // ボール: 手に もつ → たかく なげる → おちて はずむ → おくへ ころがる
  const heldAt = (state: ChildState): readonly [number, number] => {
    const p = armPoints(-1, state.armL)
    return [state.cx + p.hand[0] + p.tip[0] * 3.2, FEET_Y - state.lift + p.hand[1] + p.tip[1] * 3.2]
  }
  const released = heldAt(childAt(RELEASE))
  let ball: readonly [number, number]
  // ボールの かげ(地面)の 高さ
  let groundY: number
  if (t < RELEASE) {
    ball = heldAt(child)
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
  const showBall = t >= WALK && span(t, WALK, WALK + 0.1) > 0

  // はしゃぐ ほし
  const cheerStars = during(t, 5.6, INK + 0.3, 0.2)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Floor t={t} />
        <Posts t={t} />
        <Roof t={t} />
        {showBall && t >= APEX ? <BallPicture t={t} ball={ball} groundY={groundY} /> : null}
        <Layer opacity={visible}>
          <Layer x={child.cx} y={FEET_Y - child.lift}>
            <Child state={child} t={t} />
          </Layer>
          <Sigh t={t} x={child.cx} />
        </Layer>
        {showBall && t < APEX ? <BallPicture t={t} ball={ball} groundY={groundY} /> : null}
        {cheerStars > 0 ? (
          <g opacity={cheerStars}>
            <Star cx={child.cx - 15} cy={FEET_Y - 44 - child.lift} r={2.4} color="#ffc233" spin={t * 90} />
            <Star cx={child.cx + 16} cy={FEET_Y - 42 - child.lift} r={2.9} color="#ff7a4d" spin={-t * 80} />
            <Star cx={child.cx + 2} cy={FEET_Y - 52 - child.lift} r={2} color="#ffd95a" spin={t * 70} />
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
    { at: SPREAD, label: '見まわして「ひろーい!」と りょううでを ひろげる' },
    { at: WINDUP, label: 'うれしくて ボールを たかく なげる', sound: 'pop' },
    { at: BOUNCE, label: 'ボールが はずんで おくへ ころがる。おいかけて はしゃぐ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '広 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
