/*
 * 聞(きく): もんの そとの 音を、耳で よく きく。
 *
 * ほね(画と絵の対応)
 *   1画目       … 左の もんばしら(いちばん 外がわの 長い たてぼう)
 *   2〜4画目    … 左の とびらの 上の こうし まど(ふちと、2つの よこぼう)
 *   5〜8画目    … 右の とびらの 上の こうし まど と、右の ふちの とびら(6画目の 長い たて)
 *   9〜14画目   … 門の まんなかに 立つ 子どもの 耳(あたまの よこの 耳と、てを あてた ところ)
 *                  ※ 耳の画は だいたい 子どもの 立つ ばしょ(まんなか)に かさなる
 *
 * ながれ
 *   もんが たつ → もんの まんなかで 子どもが ボールで あそぶ
 *   → もんの そとの しげみに ことりが とんできて、ぴよぴよ なく
 *   → 子どもが ボールを おとして「はっ」と 気づく → 手を 耳に あてて、じっと きく
 *   → 音が 耳に とどいて「ことりの こえだ」と わかって にっこり
 *   → ほね が ひかって、絵が うすくなり、字「聞」が のこる
 *
 * 子どもと ことりは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる(手が 耳に とどくよう、ひじ の まがりを 計算する)。
 *   くび は みじかく、あたま は どう の 上。あたまを 音のほうへ かたむけて、てを 耳の よこに あてる。
 *   ことりの はね は せなか から、くちばし は あたま の まえ。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '聞'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#f2994a'
const TUNIC_DARK = '#d9802f'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const WOOD = '#c28a5c'
const WOOD_DARK = '#a06c45'
const POST = '#70452b'
const PANE = '#d6ecff'
const HILL = '#e2f2d2'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const BALL = '#e8534a'
const BIRD = '#ffd24a'
const BIRD_DARK = '#f2b632'
const BEAK = '#e2733f'
const NOTE = '#f07f9e'
const ALERT = '#f2733f'

/** くぎり の時間(秒) */
/** 子どもが もんの まんなかに あらわれて、ボールで あそびはじめる */
const CHILD_IN = 0.6
/** ことりが とんでくる */
const BIRD_FLY = 2.2
/** ことりが とまって、なきはじめる(音が でる) */
const SING = 2.9
/** 子どもが 音に 気づく */
const HEAR = 3.3
/** 手を 耳に あてる */
const CUP = 3.8
/** 目を とじて、じっと きく */
const LISTEN = 4.5
/** ことりの こえだと わかって にっこり */
const GLAD = 5.7
const INK = 6.6
const DONE = 10
const DURATION = 10.6

/* ───────── ならぶ ばしょ ───────── */

/** 地面の たかさ(あしの うら) */
const FLOOR = 95
/** 子どもの まんなか(もんの 道のまんなか) */
const MID = 55
/** あたまの じく(くび の ところ)と、あたまの まんなか */
const NECK: readonly [number, number] = [55, 68]
/** あたまの 右がわの 耳(画面の 右) */
const EAR: readonly [number, number] = [65.2, 60.4]
/** かた(画面の 左・右) */
const SHOULDER_L: readonly [number, number] = [49.2, 72]
const SHOULDER_R: readonly [number, number] = [60.8, 72]
/** うで の ふたつの ほね の 長さ(かた→ひじ、ひじ→手) */
const UPPER = 9
const FORE = 9.5
/** ボールを つく ばしょ(左の 手の まえ)と 大きさ */
const BALL_X = 46.5
const BALL_R = 3.8
const BOUNCE = 0.62
/** ことりが とまる しげみ の うえ と、くちばし の さき(音の でどころ) */
const PERCH: readonly [number, number] = [101.5, 82.4]
const BEAK_TIP: readonly [number, number] = [96, 81.2]

type Point = readonly [number, number]

/* ───────── けしき ───────── */

function Scenery({ t }: SceneProps) {
  const rise = span(t, 0, 0.6, backOut)
  return (
    <>
      <path d="M-4 99 Q18 78 44 90 Q72 72 113 93 V101 H-4 Z" fill={HILL} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="22" cy="6.4" rx="7" ry="2.8" />
        <ellipse cx="27" cy="5" rx="4.6" ry="3" />
        <ellipse cx="70" cy="5.2" rx="5.4" ry="2.4" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {/* 外がわ(左)の 小さな しげみ と 花 */}
      <Layer scale={rise} origin={[6, 96]}>
        <circle cx="6" cy="92.5" r="5.4" fill={LEAF_DARK} />
        <circle cx="8.4" cy="91" r="4" fill={LEAF} />
        <circle cx="4.4" cy="88.6" r="1.3" fill="#ff9db4" />
        <circle cx="9.6" cy="87.8" r="1.3" fill="#ffffff" />
      </Layer>
    </>
  )
}

/** もん。左右に 1まい ずつ とびら。いちばん外がわが ばしら。 */
function Gate({ t }: SceneProps) {
  const grow = span(t, 0.05, 0.65, backOut)
  return (
    <Layer scaleY={grow} origin={[MID, 96]}>
      {/* 左の とびら(1〜4画目) */}
      <rect x="19" y="17.5" width="23" height="73.5" rx="1.6" fill={WOOD} />
      <path d="M26.5 42 V90 M34.5 42 V90" stroke={WOOD_DARK} strokeWidth="1" strokeLinecap="round" />
      <rect x="22" y="20.5" width="17.5" height="19" rx="1.2" fill={PANE} />
      <path d="M22 30 H39.5 M22 20.5 H39.5 V39.5" fill="none" stroke={POST} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 39.5 H39.5" stroke={POST} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="39" cy="64" r="1.8" fill="none" stroke={POST} strokeWidth="1" />
      <rect x="15" y="13" width="4.6" height="82" rx="2.3" fill={POST} />
      {/* 右の とびら(5〜8画目) */}
      <rect x="67" y="17.5" width="23.8" height="73.5" rx="1.6" fill={WOOD} />
      <path d="M74 42 V90 M82 42 V90" stroke={WOOD_DARK} strokeWidth="1" strokeLinecap="round" />
      <rect x="69.5" y="20.5" width="18.5" height="19" rx="1.2" fill={PANE} />
      <path d="M69.5 30 H88 M69.5 20.5 H88 M69.5 20.5 V39.5 M69.5 39.5 H88" fill="none" stroke={POST} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="70" cy="64" r="1.8" fill="none" stroke={POST} strokeWidth="1" />
      <rect x="90.6" y="13" width="4.6" height="82" rx="2.3" fill={POST} />
    </Layer>
  )
}

/** 外がわ(右)の しげみ。ことりが とまる。 */
function Bush({ t }: SceneProps) {
  const rise = span(t, 0.1, 0.7, backOut)
  return (
    <Layer scale={rise} origin={[102, 96]}>
      <circle cx="97.8" cy="93" r="5.2" fill={LEAF_DARK} />
      <circle cx="103.5" cy="91.4" r="6.6" fill={LEAF_DARK} />
      <circle cx="107.6" cy="93.6" r="4.6" fill={LEAF_DARK} />
      <circle cx="100.6" cy="90.6" r="3.8" fill={LEAF} />
      <circle cx="105.4" cy="88.6" r="3.2" fill={LEAF_LIGHT} />
      <circle cx="106.4" cy="93.6" r="1.2" fill="#ff9db4" />
    </Layer>
  )
}

/* ───────── ことり ───────── */

function Bird({ t }: SceneProps) {
  const arrive = span(t, BIRD_FLY, SING - 0.05, easeOut)
  if (arrive <= 0) return null
  // 右上から、ゆるい山なり で しげみの 上へ おりてくる
  const x = 122 + (PERCH[0] - 122) * arrive
  const y = 58 + (PERCH[1] - 58) * arrive - Math.sin(arrive * Math.PI) * 8
  const landed = arrive >= 1
  const singing = landed && t >= SING
  // なくとき、くちばしが ひらいて、体が ぴょこぴょこ はずむ
  const beat = singing ? Math.max(0, wave(t, 0.36)) : 0
  const hop = singing ? beat * 0.9 : 0
  const flap = landed ? 0 : wave(t, 0.16) * 30
  return (
    <Layer x={x} y={y - hop}>
      {/* おび(しっぽ) */}
      <path d="M3 0.2 l5 -1.8 l-1.2 3.6 Z" fill={BIRD_DARK} />
      <ellipse cx="0" cy="0" rx="4.4" ry="3.7" fill={BIRD} />
      {/* あたま(まえ=左) */}
      <circle cx="-3" cy="-2.9" r="2.9" fill={BIRD} />
      {/* くちばし: なくとき ひらく */}
      <path d={`M-5.4 ${-3.2 - beat * 0.5} l-2.4 0.9 l2.4 0.4 Z`} fill={BEAK} />
      <path d={`M-5.4 ${-2.4 + beat * 0.6} l-2.2 ${0.5 + beat * 0.5} l2.2 -0.1 Z`} fill={BEAK} />
      <circle cx="-3.6" cy="-3.5" r="0.6" fill={EYE} />
      <circle cx="-2" cy="-1.6" r="0.9" fill="#ff9d9d" opacity="0.6" />
      {/* はね は せなか から */}
      <Layer rotate={flap} origin={[0.6, -1.6]}>
        <path d="M-1.4 -1.2 Q1.8 -4.6 4.6 -0.8 Q2 1.2 -1.4 -1.2 Z" fill={BIRD_DARK} />
      </Layer>
    </Layer>
  )
}

/** ことりの こえ: くちばし から ひろがる 音の わ。 */
function SoundWaves({ t }: SceneProps) {
  const show = during(t, SING, INK + 0.1, 0.2)
  if (show <= 0) return null
  const [cx, cy] = BEAK_TIP
  return (
    <g opacity={show} fill="none" stroke={NOTE} strokeWidth="1.2" strokeLinecap="round">
      {[0, 1, 2].map((k) => {
        const p = (((t - SING) * 0.9 + k / 3) % 1 + 1) % 1
        const r = 3 + p * 19
        const a = 0.7
        const x1 = cx + Math.cos(Math.PI - a) * r
        const y1 = cy + Math.sin(Math.PI - a) * r
        const x2 = cx + Math.cos(Math.PI + a) * r
        const y2 = cy + Math.sin(Math.PI + a) * r
        return <path key={k} d={`M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}`} opacity={Math.sin(p * Math.PI) * 0.85} />
      })}
    </g>
  )
}

function Note({ x, y, scale = 1 }: { readonly x: number; readonly y: number; readonly scale?: number }) {
  return (
    <Layer x={x} y={y} scale={scale}>
      <path d="M1.3 -0.2 v-5.4 q0.2 1.6 2.6 2.6" fill="none" stroke={NOTE} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="0" cy="0" rx="1.7" ry="1.2" fill={NOTE} transform="rotate(-20)" />
    </Layer>
  )
}

/** 音が、ことりから 子どもの 耳へ とんでいく。 */
function Notes({ t }: SceneProps) {
  const show = during(t, SING + 0.2, INK + 0.1, 0.25)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 1, 2].map((k) => {
        const p = (((t - SING) / 1.5 + k / 3) % 1 + 1) % 1
        const x = BEAK_TIP[0] - 1 - p * 27
        const y = BEAK_TIP[1] - 1 - p * 18 - Math.sin(p * Math.PI) * 5
        return (
          <g key={k} opacity={Math.sin(p * Math.PI)}>
            <Note x={x} y={y} scale={1 + 0.2 * Math.sin(p * Math.PI)} />
          </g>
        )
      })}
    </g>
  )
}

/* ───────── ボール ───────── */

/** はずむ ボールの たかさ(0 = じめん)。気づいたら だんだん 小さく はずんで とまる。 */
function ballLift(t: number): number {
  const amp = 13 * (1 - span(t, HEAR, HEAR + 0.9))
  const u = (((t - CHILD_IN) % BOUNCE) + BOUNCE) % BOUNCE / BOUNCE
  return 4 * u * (1 - u) * amp
}

function ballPos(t: number): Point {
  const roll = span(t, HEAR, HEAR + 1.4, easeOut) * 8
  return [BALL_X - roll, FLOOR - 0.6 - BALL_R - ballLift(t)]
}

function Ball({ t }: SceneProps) {
  const appear = span(t, CHILD_IN, CHILD_IN + 0.25)
  if (appear <= 0) return null
  const [x, y] = ballPos(t)
  const lift = ballLift(t)
  return (
    <>
      <ellipse cx={x} cy={FLOOR + 0.2} rx={BALL_R * (1 - lift / 36)} ry="1.1" fill="#000000" opacity="0.14" />
      <Layer x={x} y={y} rotate={x * -18 + t * 40 * (1 - span(t, HEAR, HEAR + 0.9))} scale={appear}>
        <circle cx="0" cy="0" r={BALL_R} fill={BALL} />
        <path d={`M${-BALL_R} 0 H${BALL_R}`} stroke="#ffffff" strokeWidth="1.1" />
        <circle cx="-1.3" cy="-1.5" r="0.9" fill="#ff9a92" />
      </Layer>
    </>
  )
}

/* ───────── 子ども ───────── */

type Mood = 'happy' | 'surprised' | 'listen' | 'glad'

/**
 * うで: かた から ひじ を とおって 手に つながる。手の ばしょ(target)を きめると、
 * ひじ は 体の そとがわ(side)へ まがる。ほね の 長さは かわらない。
 */
function Arm({ shoulder, target, side }: { readonly shoulder: Point; readonly target: Point; readonly side: 1 | -1 }) {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const raw = Math.hypot(dx, dy) || 1
  const d = Math.min(Math.max(raw, Math.abs(UPPER - FORE) + 0.05), UPPER + FORE - 0.05)
  const ux = dx / raw
  const uy = dy / raw
  const along = (UPPER * UPPER - FORE * FORE + d * d) / (2 * d)
  const height = Math.sqrt(Math.max(0, UPPER * UPPER - along * along))
  const bx = shoulder[0] + ux * along
  const by = shoulder[1] + uy * along
  const outward = (px: number) => (px - shoulder[0]) * side
  const a: Point = [bx - uy * height, by + ux * height]
  const b: Point = [bx + uy * height, by - ux * height]
  const elbow = outward(a[0]) >= outward(b[0]) ? a : b
  const hand: Point = [shoulder[0] + ux * d, shoulder[1] + uy * d]
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={TUNIC_DARK} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.1" fill={SKIN} />
    </>
  )
}

function Face({ mood, gaze }: { readonly mood: Mood; readonly gaze: Point }) {
  const [gx, gy] = gaze
  return (
    <>
      <circle cx="49.6" cy="63" r="2.1" fill={CHEEK} opacity={mood === 'glad' ? 0.85 : 0.55} />
      <circle cx="60.4" cy="63" r="2.1" fill={CHEEK} opacity={mood === 'glad' ? 0.85 : 0.55} />
      {(mood === 'happy' || mood === 'surprised') &&
        [51.2, 58.8].map((ex) => (
          <g key={ex}>
            {mood === 'surprised' && <circle cx={ex} cy="59.2" r="2.7" fill="#ffffff" />}
            <circle cx={ex + gx * 0.8} cy={59.2 + gy * 0.6} r={mood === 'surprised' ? 1.5 : 1.3} fill={EYE} />
            <circle cx={ex + gx * 0.8 + 0.5} cy={58.7 + gy * 0.6} r="0.45" fill="#ffffff" />
          </g>
        ))}
      {mood === 'listen' && <path d="M49.4 59.4 q1.8 1.4 3.6 0 M57 59.4 q1.8 1.4 3.6 0" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />}
      {mood === 'glad' && <path d="M49.4 60 q1.8 -2.2 3.6 0 M57 60 q1.8 -2.2 3.6 0" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />}
      {mood === 'happy' && <path d="M52.4 63.6 q2.6 2.6 5.2 0" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />}
      {mood === 'surprised' && <ellipse cx="55" cy="64.4" rx="1.5" ry="2" fill={MOUTH} />}
      {mood === 'listen' && <ellipse cx="55" cy="64.2" rx="0.95" ry="1.1" fill={MOUTH} />}
      {mood === 'glad' && <path d="M52 63 q3 5 6 0 Z" fill={MOUTH} />}
    </>
  )
}

type ChildProps = {
  readonly mood: Mood
  readonly gaze: Point
  readonly tilt: number
  readonly leftHand: Point
  readonly rightHand: Point
}

function Child({ mood, gaze, tilt, leftHand, rightHand }: ChildProps) {
  return (
    <>
      <ellipse cx={MID} cy={FLOOR + 0.4} rx="9.4" ry="2" fill="#000000" opacity="0.12" />
      {/* あし */}
      <rect x="49.6" y="84" width="4.4" height="10.6" rx="2.2" fill={PANTS} />
      <rect x="56" y="84" width="4.4" height="10.6" rx="2.2" fill={PANTS} />
      <ellipse cx="51.4" cy="94.7" rx="3.6" ry="2" fill={SHOE} />
      <ellipse cx="58.6" cy="94.7" rx="3.6" ry="2" fill={SHOE} />
      {/* くび: みじかく、どう と あたま の間 */}
      <rect x="53" y="65.6" width="4" height="6" rx="1.8" fill={SKIN_SHADE} />
      {/* どう */}
      <rect x="47.5" y="69" width="15" height="18" rx="6.5" fill={TUNIC} />
      <path d="M49.5 80.5 h11" stroke={TUNIC_DARK} strokeWidth="1.4" strokeLinecap="round" />
      {/* あたま: くびを じく に、音のほうへ かたむく */}
      <Layer rotate={tilt} origin={NECK}>
        <ellipse cx="44.9" cy="60.6" rx="1.8" ry="2.3" fill={SKIN_SHADE} />
        <ellipse cx={EAR[0]} cy={EAR[1]} rx="2" ry="2.5" fill={SKIN_SHADE} />
        <circle cx="55" cy="58" r="10.2" fill={SKIN} />
        <path d="M44.9 57.4 C44 46 56 44 63.4 49 C66.6 51.6 66.2 56 65.2 59 C63.8 54.6 59.4 52.6 52.6 53 C49 53.3 46.2 55 44.9 57.4 Z" fill={HAIR} />
        <path d="M54 47 Q55 43.6 57 45.8 Q58.2 43.2 59.2 46.4" fill="none" stroke={HAIR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <Face mood={mood} gaze={gaze} />
      </Layer>
      {/* うで(左は ボールを つく / 右は 耳に あてる) */}
      <Arm shoulder={SHOULDER_L} target={leftHand} side={-1} />
      <Arm shoulder={SHOULDER_R} target={rightHand} side={1} />
    </>
  )
}

/** 気づいた しゅんかんの「!」。あたまの 上に ぽん と出る。 */
function Alert({ t }: SceneProps) {
  const show = during(t, HEAR, HEAR + 1.0, 0.12)
  if (show <= 0) return null
  const pop = Math.max(0, backOut(span(t, HEAR, HEAR + 0.25)))
  return (
    <Layer x={MID} y={36} scale={pop} opacity={show}>
      <rect x="-1.3" y="-6.4" width="2.6" height="7.4" rx="1.3" fill={ALERT} />
      <circle cx="0" cy="3.4" r="1.5" fill={ALERT} />
      <path d="M-5 -3 l-2.4 -1 M5 -3 l2.4 -1" stroke={ALERT} strokeWidth="1.1" strokeLinecap="round" />
    </Layer>
  )
}

/** にっこり したときの うれしい 音符(あたまの 上) */
function Joy({ t }: SceneProps) {
  const show = during(t, GLAD, INK - 0.1, 0.2)
  if (show <= 0) return null
  const p = span(t, GLAD, INK - 0.1, easeOut)
  return (
    <g opacity={show}>
      <Note x={45 - p * 3} y={42 - p * 6} scale={1.2} />
      <Note x={65 + p * 3} y={39 - p * 5} scale={1} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 14)

  const cup = span(t, CUP, LISTEN, easeInOut)
  const tiltAmount = span(t, CUP + 0.3, LISTEN + 0.2, easeInOut)
  const tilt = 9 * tiltAmount
  const mood: Mood = t < HEAR ? 'happy' : t < LISTEN ? 'surprised' : t < GLAD ? 'listen' : 'glad'
  // 目の むき: あそぶ間は ボール(左下)、音に 気づいたら ことり(右)
  const gaze: Point = t < HEAR ? [-0.8, 0.8] : [1, -0.3]

  // あたまを かたむけた あとの 耳の ばしょ(手は ここの よこに くる)
  const rad = (tilt * Math.PI) / 180
  const ex = EAR[0] - NECK[0]
  const ey = EAR[1] - NECK[1]
  const earNow: Point = [NECK[0] + ex * Math.cos(rad) - ey * Math.sin(rad), NECK[1] + ex * Math.sin(rad) + ey * Math.cos(rad)]
  const cupTarget: Point = [earNow[0] + 2.6, earNow[1] + 1.4]
  const rightRest: Point = [62.6, 89.6]
  const rightHand: Point = [rightRest[0] + (cupTarget[0] - rightRest[0]) * cup, rightRest[1] + (cupTarget[1] - rightRest[1]) * cup]

  // 左の 手: ボールの すこし 上に ついていく。気づいたら はなして たらす
  const ball = ballPos(t)
  const dribble: Point = [BALL_X + 0.4, Math.min(Math.max(ball[1] - 3, 83), 89.6)]
  const leftRest: Point = [47.4, 89.6]
  const release = span(t, HEAR, HEAR + 0.4, easeOut)
  const leftHand: Point = [dribble[0] + (leftRest[0] - dribble[0]) * release, dribble[1] + (leftRest[1] - dribble[1]) * release]

  // うれしくて、ちいさく ぴょこん と はずむ
  const hop = -Math.abs(Math.sin(span(t, GLAD, GLAD + 0.9) * Math.PI * 2)) * 1.8
  const enter = span(t, CHILD_IN, CHILD_IN + 0.5, backOut)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Scenery t={t} />
        <Gate t={t} />
        <Bush t={t} />
        <Bird t={t} />
        <SoundWaves t={t} />
        <Layer scale={enter} origin={[MID, FLOOR]}>
          <Layer y={hop}>
            <Child mood={mood} gaze={gaze} tilt={tilt} leftHand={leftHand} rightHand={rightHand} />
          </Layer>
        </Layer>
        <Ball t={t} />
        <Notes t={t} />
        <Alert t={t} />
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
    { at: 0, label: 'もんが たつ', sound: 'pop' },
    { at: CHILD_IN, label: '子どもが ボールで あそぶ' },
    { at: BIRD_FLY, label: 'もんの そとへ ことりが とんでくる' },
    { at: SING, label: 'ぴよぴよ こえが きこえる', sound: 'pop' },
    { at: HEAR, label: 'はっ と 気づく' },
    { at: CUP, label: '手を 耳に あてて よく きく' },
    { at: GLAD, label: 'ことりの こえだ と わかって にっこり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '聞 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
