/*
 * 少(すこし): ちいさい つぶを、ななめに けずりとって、のこりは ほんの すこし。
 *
 * ほね(画と絵の対応)
 *   1画目(亅)  … いちばん さいごに とびあがる 大きめの つぶ(まんなか。たてに とぶ)
 *   2画目(ノ)  … 左へ とぶ つぶ(左下むき)
 *   3画目(丶)  … 右で とびあがる つぶ(右下むき)
 *   4画目(ノ)  … 木のはこ から 左下へ すべりおりる 長い いた(すべりだい)。つぶを ななめに けずりとる ところ
 *
 * ながれ
 *   はらぺこの ねずみが、はこの上で おなかを おさえている
 *   → つぶの やまを みつけて「あっ」(びっくり)
 *   → つぶを 手で おして、すべりだいを すべらせる。左はしの ぬのに つぶが たまっていく(やまは どんどん へる)
 *   → うれしくなって、さいごの 3つぶを えいっ と とばす(のこったのは ほんの すこし)
 *   → 3つぶが 空で 小の形に ならんだ しゅんかん、ほね が ひかって、絵が うすくなり、字「少」が のこる
 *
 * ねずみ・つぶ・すべりだいは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる。あし は ゆかに のっている。
 *   すべりだいは はこに もたれて、つぶは 上の おもて(左うえの めん)を すべる。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Dust, Notice } from '../sceneFigures'

const CHAR = '少'

const WOOD = '#d9a66a'
const WOOD_DARK = '#bd8750'
const BARK = '#8c5b3c'
const BARK_LIGHT = '#a97351'
const CLOTH = '#e8736f'
const CLOTH_DARK = '#c95b58'
const GRAIN = '#ecc765'
const GRAIN_DARK = '#d4a944'
const GRAIN_LIGHT = '#fff2bd'
const MOUSE = '#b9bccb'
const MOUSE_DARK = '#9a9eb2'
const MOUSE_FAR = '#8d92a8'
const BELLY = '#f1edf5'
const PINK = '#f4a3b3'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const NOTICE = 1.6
const PUSH = 2.6
/** 1回 おして もどす 時間 */
const PERIOD = 0.6
/** ふつうに おす回数。そのあとの 1回は、さいごの 3つぶを とばす */
const SWEEPS = 6
const END = PUSH + (SWEEPS + 1) * PERIOD
const INK = 7.4
const DONE = 10.4
const DURATION = 11

/** はこの上の ゆか(ねずみの あしもと・つぶの おき場所)と、はこの左はし */
const BOX_TOP = 41.5
const BOX_LEFT = 75.5
const BOX_RIGHT = 108
/** ねずみの 立つ場所(あしもと) */
const MOUSE_X = 100
/** 主役が 小さく ならないよう、少し 大きめに描く */
const MOUSE_SIZE = 1.2
/** ぬの(つぶが たまる ところ)。すべりだいの 下はし(24, 98)に つながる */
const MAT_Y = 96

/* ───────── すべりだい(4画目の線にそって つぶが すべる) ───────── */

/** 4画目の 通り道の点(scene-info の値) */
const RAMP: readonly (readonly [number, number])[] = [
  [76.8, 41],
  [73.2, 51.7],
  [67.1, 61.3],
  [60, 70.3],
  [52.2, 78.6],
  [43.5, 86.1],
  [34.1, 92.6],
  [24, 98],
]
const SEG_LENGTHS = RAMP.slice(1).map(([x, y], i) => Math.hypot(x - RAMP[i][0], y - RAMP[i][1]))
const RAMP_LENGTH = SEG_LENGTHS.reduce((a, b) => a + b, 0)
/** つぶの 中心が、いたの おもて(左うえ)から はなれる 分 */
const SURFACE = 3.1

type Placed = { readonly x: number; readonly y: number; readonly rot: number }

/** すべりだいの うえの、上から s(0〜1)の ところ。いたの おもて側 に のせた つぶの 位置と むき */
function rampAt(s: number): Placed {
  let rest = Math.min(Math.max(s, 0), 1) * RAMP_LENGTH
  let i = 0
  while (i < SEG_LENGTHS.length - 1 && rest > SEG_LENGTHS[i]) {
    rest -= SEG_LENGTHS[i]
    i += 1
  }
  const [x0, y0] = RAMP[i]
  const [x1, y1] = RAMP[i + 1]
  const k = rest / SEG_LENGTHS[i]
  const dx = (x1 - x0) / SEG_LENGTHS[i]
  const dy = (y1 - y0) / SEG_LENGTHS[i]
  // 左うえの おもて側(いたの ほうせん)
  return { x: x0 + (x1 - x0) * k - dy * SURFACE, y: y0 + (y1 - y0) * k + dx * SURFACE, rot: (Math.atan2(dy, dx) * 180) / Math.PI }
}

/* ───────── つぶの やま ───────── */

/**
 * つぶの はじめの場所。上の つぶから じゅんに すべっていく(0〜10)。
 * 11〜13 は さいごに 空へ とぶ 3つぶ(一ばん下の だんの 3つ)
 */
const HEAP: readonly (readonly [number, number])[] = [
  [84.2, 31.1],
  [82.8, 33.3],
  [85.6, 33.3],
  [81.4, 35.5],
  [84.2, 35.5],
  [87, 35.5],
  [80, 37.7],
  [82.8, 37.7],
  [85.6, 37.7],
  [88.4, 37.7],
  [78.6, 39.9],
  [81.4, 39.9],
  [84.2, 39.9],
  [87, 39.9],
]
const SLID = 11
/** ぬのの上に たまる 場所(さいしょに くる つぶほど 右はし) */
const MOUND: readonly (readonly [number, number])[] = [
  [19.8, 95],
  [16.6, 95],
  [13.4, 95],
  [10.2, 95],
  [7, 95],
  [18.2, 92.8],
  [15, 92.8],
  [11.8, 92.8],
  [8.6, 92.8],
  [15, 90.6],
  [11.8, 90.6],
]
/** さいごに とぶ 3つぶの、空での 場所(小 の 1・2・3画目の あたり)と、字の画と おなじ むき */
const FLY: readonly { readonly to: readonly [number, number]; readonly rot: number; readonly scale: number }[] = [
  { to: [27, 41], rot: 129, scale: 1.5 },
  { to: [53, 36], rot: 90, scale: 1.7 },
  { to: [86.5, 37], rot: 37, scale: 1.5 },
]

/** つぶが おされて やまを はなれる時間(おす 手の うごきの いちばん つよい ところ) */
const departAt = (i: number) => PUSH + PERIOD * Math.floor(i / 2) + 0.42 + (i % 2) * 0.2
const LEG_EDGE = 0.35
const LEG_SLIDE = 0.95
const LEG_MAT = 0.35
const arriveAt = (i: number) => departAt(i) + LEG_EDGE + LEG_SLIDE
/** さいごの 3つぶを とばす時間(7回目の おす うごき) */
const FLICK = PUSH + PERIOD * SWEEPS + 0.42

type GrainPlace = Placed & { readonly scale: number }

function grainPlace(i: number, t: number): GrainPlace {
  const [hx, hy] = HEAP[i]
  const pop = Math.max(0, span(t, 0.5 + i * 0.04, 0.95 + i * 0.04, backOut))
  if (i >= SLID) {
    const fly = FLY[i - SLID]
    const rise = span(t, FLICK, INK, easeOut)
    // いきおいよく とび上がり、字の形の ところで いちばん たかく なる。そのあとは おちる
    const fall = Math.max(0, t - INK)
    const x = hx + (fly.to[0] - hx) * rise - fall * 3
    const y = hy + (fly.to[1] - hy) * rise + fall * fall * 40
    const rot = fly.rot + (1 - rise) * 200 + fall * 60
    const scale = (1 + (fly.scale - 1) * rise) * pop
    return { x, y, rot, scale }
  }
  const depart = departAt(i)
  if (t < depart) return { x: hx, y: hy, rot: 0, scale: pop }
  // 1) はこの はしまで おされる
  const edge = span(t, depart, depart + LEG_EDGE, easeInOut)
  if (t < depart + LEG_EDGE) {
    return { x: hx + (BOX_LEFT + 0.9 - hx) * edge, y: hy + (BOX_TOP - 1.6 - hy) * edge, rot: 0, scale: 1 }
  }
  // 2) すべりだいを すべりおりる(だんだん はやく)
  if (t < arriveAt(i)) {
    const s = span(t, depart + LEG_EDGE, arriveAt(i), easeIn)
    return { ...rampAt(s), scale: 1 }
  }
  // 3) ぬのの上へ ころがって、やまに なる
  const end = rampAt(1)
  const [mx, my] = MOUND[i]
  const k = span(t, arriveAt(i), arriveAt(i) + LEG_MAT, easeOut)
  const hop = Math.sin(k * Math.PI) * (1.5 + (end.x - mx) * 0.18)
  return { x: end.x + (mx - end.x) * k, y: end.y + (my - end.y) * k - hop, rot: end.rot * (1 - k), scale: 1 }
}

/** こめつぶ 1つ。よこ長の だ円(ぶぶん に かげと ひかり) */
function Grain({ place }: { readonly place: GrainPlace }) {
  if (place.scale <= 0) return null
  return (
    <Layer x={place.x} y={place.y} rotate={place.rot} scale={place.scale}>
      <ellipse cx="0" cy="0" rx="2.5" ry="1.6" fill={GRAIN_DARK} />
      <ellipse cx="0" cy="-0.2" rx="2.4" ry="1.35" fill={GRAIN} />
      <ellipse cx="-0.7" cy="-0.6" rx="1.1" ry="0.45" fill={GRAIN_LIGHT} />
    </Layer>
  )
}

/** つぶが ぬのに おちた しゅんかんの ちいさな ほこり(共通部品 Dust) */
function LandDust({ t }: SceneProps) {
  const end = rampAt(1)
  return (
    <>
      {MOUND.map((_, i) => (
        <Dust key={i} x={end.x - 3} y={MAT_Y} p={span(t, arriveAt(i), arriveAt(i) + 0.4, easeOut)} reach={3} />
      ))}
    </>
  )
}

/* ───────── まわりの けしき ───────── */

/** つぶの やまを のせた 木のはこ と、それに もたれた いた(4画目) と、つぶを うける ぬの */
function Stage({ t }: SceneProps) {
  const rise = span(t, 0, 0.5, backOut)
  const cloth = span(t, 0.2, 0.7, backOut)
  return (
    <>
      <ellipse cx="92" cy="98.4" rx={19 * span(t, 0, 0.5, easeOut)} ry="2.6" fill="#000000" opacity="0.1" />
      <Layer scaleY={rise} origin={[92, 99]}>
        <rect x={BOX_LEFT} y={BOX_TOP} width={BOX_RIGHT - BOX_LEFT} height={99 - BOX_TOP} rx="2.6" fill={WOOD} />
        <path d={`M${BOX_LEFT + 2} 54 H${BOX_RIGHT - 2} M${BOX_LEFT + 2} 68 H${BOX_RIGHT - 2} M${BOX_LEFT + 2} 82 H${BOX_RIGHT - 2}`} stroke={WOOD_DARK} strokeWidth="1.1" strokeLinecap="round" />
        <rect x={BOX_LEFT} y={BOX_TOP} width={BOX_RIGHT - BOX_LEFT} height="2.4" rx="1.2" fill={WOOD_DARK} />
      </Layer>
      <Layer opacity={rise}>
        <Bone char={CHAR} n={4} color={BARK} width={5} />
        <Bone char={CHAR} n={4} color={BARK_LIGHT} width={1.4} from={0.04} to={0.96} />
      </Layer>
      <Layer scaleX={cloth} origin={[14, MAT_Y]}>
        <rect x="2.5" y={MAT_Y} width="23" height="3.2" rx="1.6" fill={CLOTH} />
        <rect x="2.5" y={MAT_Y + 2.1} width="23" height="1.1" rx="0.55" fill={CLOTH_DARK} />
      </Layer>
    </>
  )
}

/* ───────── 主役の ねずみ ───────── */

type Mood = 'sad' | 'surprised' | 'happy'
/** うで の かっこう。swing = ま下から まえ(左)へ ふった角度 / bend = ひじ の まがり(まえへ) */
type ArmPose = { readonly swing: number; readonly bend: number }

const SHOULDER: readonly [number, number] = [-2.6, -10]
const ARM_PART = 4.4
const NECK: readonly [number, number] = [-1.8, -11]

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。 */
function Arm({ pose, color, dx = 0 }: { readonly pose: ArmPose; readonly color: string; readonly dx?: number }) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const [sx, sy] = [SHOULDER[0] + dx, SHOULDER[1]]
  const elbow = [sx - Math.sin(rad(pose.swing)) * ARM_PART, sy + Math.cos(rad(pose.swing)) * ARM_PART] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] - Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART] as const
  return (
    <>
      <path d={`M${sx} ${sy} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="1.6" fill={PINK} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      {mood === 'sad' && (
        <>
          <path d="M-7 -17.6 l3.6 1" stroke={MOUSE_FAR} strokeWidth="0.8" strokeLinecap="round" />
          <circle cx="-5.2" cy="-15.2" r="0.95" fill={EYE} />
          <path d="M-8 -11.3 Q-6.6 -12.4 -5.2 -11.3" fill="none" stroke={MOUTH} strokeWidth="0.8" strokeLinecap="round" />
        </>
      )}
      {mood === 'surprised' && (
        <>
          <circle cx="-5.2" cy="-15.4" r="1.5" fill="#ffffff" />
          <circle cx="-5.4" cy="-15.4" r="0.95" fill={EYE} />
          <ellipse cx="-6.6" cy="-11.3" rx="0.9" ry="1.15" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M-6.4 -15 Q-5.2 -16.6 -4 -15" fill="none" stroke={EYE} strokeWidth="0.95" strokeLinecap="round" />
          <path d="M-8 -11.8 Q-6.4 -9.9 -4.8 -11.6" fill="none" stroke={MOUTH} strokeWidth="0.85" strokeLinecap="round" />
        </>
      )}
      <circle cx="-3.2" cy="-12.8" r="1.2" fill={CHEEK} opacity="0.6" />
    </>
  )
}

type MouseProps = { readonly mood: Mood; readonly nearArm: ArmPose; readonly farArm: ArmPose; readonly headTilt: number }

/** 足もと(0, 0)を じく に、左むきに 立つ ねずみ。体は ほんものの つくり。 */
function MouseBody({ mood, nearArm, farArm, headTilt }: MouseProps) {
  return (
    <>
      <path d="M4.4 -3.4 Q8 -2.8 7.2 -7.6" fill="none" stroke={PINK} strokeWidth="1.1" strokeLinecap="round" />
      <Arm pose={farArm} color={MOUSE_FAR} dx={1.3} />
      <rect x="0.6" y="-3.2" width="2.6" height="2.4" rx="1.1" fill={MOUSE_DARK} />
      <ellipse cx="2.4" cy="-0.9" rx="3" ry="1.3" fill={PINK} />
      <ellipse cx="0" cy="-6.8" rx="4.9" ry="6.4" fill={MOUSE} />
      <ellipse cx="-1.7" cy="-6" rx="2.7" ry="4.2" fill={BELLY} />
      <rect x="-3.6" y="-3.2" width="2.6" height="2.4" rx="1.1" fill={MOUSE} />
      <ellipse cx="-2.2" cy="-0.9" rx="3" ry="1.3" fill={PINK} />
      <Arm pose={nearArm} color={MOUSE_DARK} />
      <Layer rotate={headTilt} origin={NECK}>
        <circle cx="-1.3" cy="-18.4" r="3" fill={MOUSE_DARK} />
        <circle cx="-1.3" cy="-18.4" r="1.8" fill={PINK} />
        <circle cx="-3.4" cy="-14.4" r="4.3" fill={MOUSE} />
        <ellipse cx="-7.2" cy="-13.4" rx="2.4" ry="1.9" fill={BELLY} />
        <circle cx="-9.3" cy="-13.7" r="1" fill="#f28aa0" />
        <path d="M-8.4 -13 l-3 -0.9 M-8.4 -12.3 l-3 0.6" stroke={MOUSE_FAR} strokeWidth="0.4" strokeLinecap="round" />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

/** おなかが なる しるし(はらぺこ のとき) */
function Rumble({ t }: SceneProps) {
  const show = during(t, 0.7, NOTICE, 0.2)
  if (show <= 0) return null
  const shake = wave(t, 0.25) * 0.5
  return (
    <g opacity={show} fill="none" stroke="#7c86c8" strokeWidth="0.7" strokeLinecap="round">
      <path d={`M${-7.5 + shake} -8.6 q-1.6 1 0 2 q1.6 1 0 2`} />
      <path d={`M${-10 - shake} -9.4 q-2 1.4 0 2.8 q2 1.4 0 2.8`} />
    </g>
  )
}

/** つぶを みつけた「はっ」(あたまの まわりの すじ) */
function Bang({ t }: SceneProps) {
  return <Notice x={-3.4} y={-14.4} r={4.3} show={during(t, NOTICE, PUSH - 0.1, 0.1)} dir={-1} />
}

/** おす・もどす の うで と、体の かたむき。7回目は、さいごの 3つぶを とばす。 */
function mouseAction(t: number): { readonly arm: ArmPose; readonly lean: number; readonly hop: number } {
  if (t < NOTICE) return { arm: { swing: 20, bend: -55 }, lean: 0, hop: 0 }
  if (t < PUSH) {
    // びっくりして 手を あげ、そのまま おす じゅんび
    return { arm: { swing: mix(t, NOTICE, NOTICE + 0.5, 20, 60), bend: mix(t, NOTICE, NOTICE + 0.5, -55, 18) }, lean: 0, hop: -Math.abs(wave(t - NOTICE, 0.5)) * 1.2 * (1 - span(t, NOTICE + 0.5, NOTICE + 0.8)) }
  }
  if (t >= END) {
    // うれしくて 手を あげて ぴょんぴょん
    const up = span(t, END, END + 0.35, easeOut)
    return { arm: { swing: 90 + 75 * up, bend: 14 * up }, lean: 0, hop: -Math.abs(wave(t - END, 0.55)) * 2.4 * up }
  }
  const p = ((t - PUSH) % PERIOD) / PERIOD
  // 手を ひいて(ひじ が まがる)、つよく おす(うで が のびる)
  const swing = p < 0.45 ? 90 - 50 * easeInOut(p / 0.45) : p < 0.7 ? 40 + 50 * easeOut((p - 0.45) / 0.25) : 90
  const bend = 18 * (1 - (swing - 40) / 50)
  const lean = -5 * Math.sin(Math.PI * Math.min(Math.max((p - 0.3) / 0.5, 0), 1))
  return { arm: { swing, bend }, lean, hop: 0 }
}

function Mouse({ t }: SceneProps) {
  const pop = span(t, 0.1, 0.6, backOut)
  const { arm, lean, hop } = mouseAction(t)
  const mood: Mood = t < NOTICE ? 'sad' : t < PUSH ? 'surprised' : 'happy'
  const sad = t < NOTICE
  // はらぺこの ときは あたまを さげる。うれしい ときは あげる
  const headTilt = sad ? 8 : t >= END ? -4 : 0
  const farArm: ArmPose = { swing: arm.swing - 6, bend: arm.bend + 4 }
  return (
    <Layer x={MOUSE_X} y={BOX_TOP + hop} rotate={lean} scale={pop * MOUSE_SIZE}>
      <Rumble t={t} />
      <MouseBody mood={mood} nearArm={arm} farArm={farArm} headTilt={headTilt} />
      <Bang t={t} />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} clouds={[[44, 11, 1], [97, 13, 0.85]]} tufts={[46, 62, 70]} />
        <Stage t={t} />
        <LandDust t={t} />
        {HEAP.map((_, i) => (
          <Grain key={i} place={grainPlace(i, t)} />
        ))}
        <Mouse t={t} />
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
    { at: 0, label: 'はこの上で、はらぺこの ねずみ', sound: 'pop' },
    { at: NOTICE, label: '「あっ」つぶの やまを みつける', sound: 'pop' },
    { at: PUSH, label: 'つぶを おして、すべりだいを ななめに すべらせる' },
    { at: FLICK, label: 'さいごの 3つぶを えいっ と とばす。のこりは ほんの すこし' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '少 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
