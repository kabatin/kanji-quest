/*
 * 字(じ): やねの 下で、こどもが そだつ。
 *
 * ほね(画と絵の対応)
 *   1画目(丶)  … やねの てっぺんに ある えんとつ(けむり が のぼる)
 *   2画目(ノ)  … やねの 左はし の たれた ひさし
 *   3画目(㇐)  … やねの 下はし(のきした)。右はしは 少し たれる
 *   4画目      … こどもの あたま(かみ の はえぎわ から ほっぺ)
 *   5画目(亅)  … こどもの どう と あし
 *   6画目(一)  … こどもが りょううで を ひろげた かたち(さいごに「やったー」と ひろげる)
 *
 * ながれ
 *   やねと はしらの いえが できる。雨が ふってきて、ぬれた こどもが しょんぼり はしってくる
 *   → やねの 下に はいって ほっと する(雨は やねに あたって、中は ぬれない)
 *   → おなかが すいた。だいに のった おにぎりを とって、もぐもぐ たべる
 *   → たべたら、ぐんぐん 大きく そだつ(雨は やんで、お日さまが 出る)
 *   → 「やったー」と りょううで を ひろげた しゅんかんに ほね が ひかって、絵が うすくなり、字「字」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   くび は みじかく、うで は かた から出て ひじ で まがる(ひじ は 2つの ほね の きょり から 計算する)。
 *   あしは こし から。おにぎりを たべるときは、手が 口の よこまで とどく。
 *   体の 大きさは、たべて そだつ ときだけ 足もとを じく に 大きくする。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Bone, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '字'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#ffb44a'
const SHIRT_DARK = '#f09a2b'
const SHORTS = '#4f9be0'
const SHOE = '#6b4a36'
const ROOF = '#d9694f'
const ROOF_LIGHT = '#ec8a6b'
const ROOF_DARK = '#b04e3b'
const BRICK = '#b5654a'
const BRICK_DARK = '#8f4b36'
const WOOD = '#b9824f'
const WOOD_DARK = '#8c5b3c'
const FLOOR = '#d3a56f'
const GRASS = '#c5e8a9'
const HILL = '#e2f2d2'
const SUN = '#ffd24a'
const CLOUD = '#9aa6b8'
const CLOUD_LIGHT = '#b5bfce'
const RAIN = '#5aaee8'
const RICE = '#fbfbf3'
const RICE_SHADE = '#e6e3cf'
const NORI = '#2f4a3a'
const PLATE = '#cfe3f2'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const RUN = 0.9
const ARRIVE = 2.4
const HUNGRY = 2.9
const REACH = 3.3
const GRAB = 3.9
const BITE = 4.8
const GROW = 5.7
const WIDE = 6.1
const INK = 7.0
const DONE = 10.0
const DURATION = 10.6

type Pt = readonly [number, number]
const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/* ───────── こどもの からだ(大きさ 1 のときの 場所。足もと = [55, 96]) ───────── */

const FEET: Pt = [55, 96]
const HEAD: Pt = [55, 45]
const HEAD_R = 12
const SHOULDER_L: Pt = [49, 62]
const SHOULDER_R: Pt = [61, 62]
/** うで の ほね の 長さ(かた→ひじ、ひじ→手 は 同じ) */
const BONE = 11
/** 小さい ときの 大きさ。たべると 1 まで そだつ */
const SMALL = 0.7

/** かた と 手の 目あて から ひじ を計算する。ひじ は 下(と そと)がわ に まがる */
function arm(shoulder: Pt, target: Pt, side: 1 | -1): { readonly elbow: Pt; readonly hand: Pt } {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.min(Math.hypot(dx, dy), BONE * 2 - 0.05)
  const ux = dx / (Math.hypot(dx, dy) || 1)
  const uy = dy / (Math.hypot(dx, dy) || 1)
  const half = dist / 2
  const lift = Math.sqrt(Math.max(0, BONE * BONE - half * half))
  const around = (sign: number): Pt => [shoulder[0] + ux * half - uy * lift * sign, shoulder[1] + uy * half + ux * lift * sign]
  const a = around(1)
  const b = around(-1)
  const score = (p: Pt) => p[1] + 0.25 * side * (p[0] - shoulder[0])
  return { elbow: score(a) >= score(b) ? a : b, hand: [shoulder[0] + ux * dist, shoulder[1] + uy * dist] }
}

type Arm = ReturnType<typeof arm>

/** うでの 目あて。りょううで ともに、立っているとき は 下に たらす */
const HANG_R: Pt = [63, 83]
const HANG_L: Pt = [47, 83]
/** おにぎりを とるときの 右手(だい の おにぎりに とどく) */
const REACH_R: Pt = [75.5, 70]
/** たべるときの 右手(口の よこ) */
const MOUTH_R: Pt = [64, 52]
/** さいごの「やったー」: 6画目の 線に そって りょううで を ひろげる(右が 少し 上) */
const WIDE_L: Pt = [28, 63.5]
const WIDE_R: Pt = [82, 59]

/** 大きさ s の こども の 体の 点 を、絵の 場所に うつす */
const toWorld = (p: Pt, s: number): Pt => [FEET[0] + s * (p[0] - FEET[0]), FEET[1] + s * (p[1] - FEET[1])]

/** おにぎり の 中心。小さい こども の 手が とどく 場所(手の すこし 上) */
const BALL_LIFT = 2.2
const RICE_AT: Pt = (() => {
  const hand = toWorld(arm(SHOULDER_R, REACH_R, 1).hand, SMALL)
  return [hand[0], hand[1] - BALL_LIFT]
})()

/* ───────── まわり ───────── */

function Sky({ t }: SceneProps) {
  const sun = span(t, 3.4, 4.2, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[11, 12]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="10.2" y="1" width="1.6" height="3.6" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 11 12)`} />
        ))}
      </Layer>
      <circle cx="11" cy="12" r={5.4 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 70 113 93 V101 H-4 Z" fill={HILL} />
      <ellipse cx="54.5" cy="98.6" rx="54" ry="5.4" fill={GRASS} />
    </>
  )
}

/** 雨雲: そらいっぱいに ひろがり、雨が やむと 右へ ながれていく */
function Clouds({ t }: SceneProps) {
  const enter = span(t, 0, 0.6, easeOut)
  const leave = span(t, 3.2, 4.4, easeInOut)
  const x = -110 * (1 - enter) + 120 * leave
  const stops = [2, 16, 30, 44, 58, 72, 86, 100]
  return (
    <Layer x={x} opacity={1 - leave * 0.6}>
      <rect x="-14" y="-8" width="140" height="15" fill={CLOUD} />
      {stops.map((cx, i) => (
        <circle key={cx} cx={cx} cy={i % 2 === 0 ? 7 : 5} r={i % 2 === 0 ? 8 : 9} fill={CLOUD} />
      ))}
      {stops.map((cx, i) => (
        <circle key={`l${cx}`} cx={cx - 1.4} cy={i % 2 === 0 ? 3.4 : 1.4} r="4.6" fill={CLOUD_LIGHT} />
      ))}
    </Layer>
  )
}

/** やねの 上の線(x の 所の、やねの いちばん上の 高さ)。雨は ここで とまる */
const ROOF_PROFILE: readonly Pt[] = [[14, 40], [17, 33], [22, 27], [34, 21.5], [54, 12.5], [75, 20], [86, 24.5], [91, 30]]
function roofTop(x: number): number {
  if (x < ROOF_PROFILE[0][0] || x > ROOF_PROFILE[ROOF_PROFILE.length - 1][0]) return FEET[1]
  const i = ROOF_PROFILE.findIndex((p, k) => k > 0 && x <= p[0])
  const a = ROOF_PROFILE[i - 1]
  const b = ROOF_PROFILE[i]
  return a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0])
}

/** 雨: まっすぐ 下に おちる。やねの 下の あたりは、やねで とまって しぶき に なる */
function Rain({ t }: SceneProps) {
  const alpha = during(t, 0.5, 3.6, 0.35)
  if (alpha <= 0) return null
  return (
    <g opacity={alpha * 0.85} fill="none" stroke={RAIN} strokeWidth="0.9" strokeLinecap="round">
      {Array.from({ length: 15 }, (_, i) => {
        const x = 3 + i * 7.1
        const end = roofTop(x)
        const y = ((t * 58 + i * 37) % 110) - 10
        if (y < 6) return null
        if (y <= end) return <path key={i} d={`M${x} ${y - 5} L${x} ${y}`} />
        if (y < end + 3.5) return <ellipse key={i} cx={x} cy={end} rx={1 + (y - end) * 0.5} ry="0.5" />
        return null
      })}
    </g>
  )
}

/** いえ: やねを たくさんの はしら が ささえる(ふきぬけの あずまや)。かべは なく、こどもが 入れる */
function House({ t }: SceneProps) {
  const posts = span(t, 0.15, 0.7, backOut)
  const roof = span(t, 0.3, 0.95, backOut)
  const chimney = span(t, 0.7, 1.1, backOut)
  return (
    <>
      <rect x="17" y="95" width="76" height="3.4" rx="1.4" fill={FLOOR} />
      <Layer scaleY={posts} origin={[54, 96]}>
        <rect x="22.5" y="26" width="3.6" height="70" rx="1.2" fill={WOOD} />
        <rect x="84.2" y="26" width="3.6" height="70" rx="1.2" fill={WOOD} />
        <rect x="22.5" y="26" width="1.3" height="70" fill={WOOD_DARK} opacity="0.5" />
        <rect x="84.2" y="26" width="1.3" height="70" fill={WOOD_DARK} opacity="0.5" />
      </Layer>
      <Layer scale={chimney} origin={[54.4, 20]}>
        <Bone char={CHAR} n={1} color={BRICK} width={7} />
        <rect x="50.4" y="7.8" width="8" height="2.4" rx="1" fill={BRICK_DARK} />
      </Layer>
      <Layer scale={roof} origin={[54, 30]}>
        <path d="M15 41.5 C16 33 20.5 27 32 22 Q54 10 76 20.5 C85 23.5 90.5 26.5 89.8 31 C88.5 28.6 84 27 78 27 L26 28.4 C21.5 29.5 18.5 34 15 41.5 Z" fill={ROOF} />
        <path d="M33 22.6 Q54 12 75 21 Q54 16.8 33 25 Z" fill={ROOF_LIGHT} />
        <path d="M26 28.4 L78 27 L77.6 24.6 L25.6 26 Z" fill={ROOF_DARK} />
      </Layer>
    </>
  )
}

/** えんとつの けむり。ゆっくり のぼって、ふくらんで きえる */
function Smoke({ t }: SceneProps) {
  const show = span(t, 1.0, 1.4)
  if (show <= 0) return null
  return (
    <g fill="#ffffff" opacity={show * 0.9}>
      {[0, 0.9, 1.8].map((offset) => {
        const p = ((t + offset) % 2.7) / 2.7
        return <circle key={offset} cx={54.4 + Math.sin(p * 6) * 1.8 + p * 3} cy={7 - p * 11} r={1.2 + p * 2.6} opacity={Math.sin(p * Math.PI) * 0.8} />
      })}
    </g>
  )
}

/** おにぎり(まんなか が 0,0。とがった先が 上) */
function RiceBall({ at, size }: { readonly at: Pt; readonly size: number }) {
  if (size <= 0) return null
  return (
    <Layer x={at[0]} y={at[1]} scale={size}>
      <path d="M0 -4.4 L-4.6 3.2 L4.6 3.2 Z" fill={RICE} stroke={RICE} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M2.2 -2.2 L4.6 3.2 L1 3.2 Z" fill={RICE_SHADE} stroke={RICE_SHADE} strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="-2.9" y="0.8" width="5.8" height="3.8" rx="0.9" fill={NORI} />
    </Layer>
  )
}

/** おにぎりを のせた だい。おにぎり の まんなか(at)から 下に ならべる */
function Stool({ t, at }: { readonly t: number; readonly at: Pt }) {
  const show = span(t, 0.5, 1.0, backOut)
  const top = at[1] + BALL_LIFT + 3.2
  return (
    <Layer scale={show} origin={[at[0], FEET[1]]}>
      <rect x={at[0] - 5.4} y={top + 2.6} width="2.4" height={FEET[1] - top - 2.6} rx="0.8" fill={WOOD_DARK} />
      <rect x={at[0] + 3} y={top + 2.6} width="2.4" height={FEET[1] - top - 2.6} rx="0.8" fill={WOOD_DARK} />
      <rect x={at[0] - 7} y={top} width="14" height="3" rx="1.2" fill={WOOD} />
      <ellipse cx={at[0]} cy={top - 0.6} rx="6.4" ry="1.5" fill={PLATE} />
    </Layer>
  )
}

/** おにぎりの ゆげ(だいに おいてあるあいだ) */
function Steam({ t, at }: { readonly t: number; readonly at: Pt }) {
  const show = span(t, 1.2, 1.6) * (1 - span(t, GRAB - 0.1, GRAB + 0.1))
  if (show <= 0) return null
  return (
    <g opacity={show} fill="none" stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round">
      {[-2.2, 2.2].map((dx, i) => {
        const p = ((t * 0.9 + i * 0.5) % 1)
        return <path key={dx} d={`M${at[0] + dx} ${at[1] - 5 - p * 4} q-1.2 -1.4 0 -2.6 q1.2 -1.4 0 -2.6`} opacity={Math.sin(p * Math.PI)} />
      })}
    </g>
  )
}

/* ───────── こども ───────── */

type Mood = 'sad' | 'glad' | 'eat' | 'happy'

type ChildProps = {
  readonly step: number
  readonly mood: Mood
  /** 目の むき(1 = 右の おにぎりを 見る) */
  readonly look: number
  readonly chew: number
  readonly tilt: number
  readonly armL: Arm
  readonly armR: Arm
  readonly rumble: number
}

function Limb({ limb, shoulder }: { readonly limb: Arm; readonly shoulder: Pt }) {
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${limb.elbow[0]} ${limb.elbow[1]}`} stroke={SHIRT_DARK} strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d={`M${limb.elbow[0]} ${limb.elbow[1]} L${limb.hand[0]} ${limb.hand[1]}`} stroke={SKIN} strokeWidth="4.6" strokeLinecap="round" fill="none" />
      <circle cx={limb.hand[0]} cy={limb.hand[1]} r="2.9" fill={SKIN} />
    </>
  )
}

function Face({ mood, look, chew }: Pick<ChildProps, 'mood' | 'look' | 'chew'>) {
  const lx = 50.2 + look * 0.9
  const rx = 59.8 + look * 0.9
  const eyes =
    mood === 'eat' || mood === 'happy' ? (
      <>
        <path d="M48 46.4 Q50.2 43.6 52.4 46.4" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
        <path d="M57.6 46.4 Q59.8 43.6 62 46.4" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
      </>
    ) : (
      <>
        <circle cx={lx} cy="45.6" r="1.4" fill={EYE} />
        <circle cx={rx} cy="45.6" r="1.4" fill={EYE} />
      </>
    )
  const mouth =
    mood === 'sad' ? (
      <>
        <path d="M47.4 42.4 L52 40.4" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
        <path d="M58 40.4 L62.6 42.4" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
        <path d="M52.4 52.2 Q55 49.8 57.6 52.2" fill="none" stroke={MOUTH} strokeWidth="1.3" strokeLinecap="round" />
      </>
    ) : mood === 'glad' ? (
      <path d="M51.8 49.4 Q55 53 58.2 49.4" fill="none" stroke={MOUTH} strokeWidth="1.3" strokeLinecap="round" />
    ) : mood === 'eat' ? (
      <ellipse cx="55.6" cy="50.8" rx={2.2 + chew * 0.5} ry={0.9 + chew * 1.3} fill={MOUTH} />
    ) : (
      <>
        <path d="M49.6 48.6 Q55 59 60.4 48.6 Z" fill={MOUTH} />
        <path d="M52.2 53.4 Q55 51.6 57.8 53.4 Q55 56 52.2 53.4 Z" fill="#ff8a8a" />
      </>
    )
  return (
    <>
      {eyes}
      {mouth}
      <circle cx="47.4" cy="49.6" r={mood === 'eat' ? 2.6 : 2} fill={CHEEK} opacity="0.55" />
      <circle cx="62.6" cy="49.6" r={mood === 'eat' ? 2.6 : 2} fill={CHEEK} opacity="0.55" />
    </>
  )
}

function Child({ step, mood, look, chew, tilt, armL, armR, rumble }: ChildProps) {
  return (
    <>
      {/* あし(こし から ふる)。はしるとき かわりばんこ */}
      <Layer rotate={step * 24} origin={[58.5, 80]}>
        <rect x="56" y="80" width="5" height="13.4" rx="2.2" fill={SKIN} />
        <ellipse cx="58.8" cy="94" rx="4.3" ry="2.1" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 24} origin={[51.5, 80]}>
        <rect x="49" y="80" width="5" height="13.4" rx="2.2" fill={SKIN} />
        <ellipse cx="51.5" cy="94" rx="4.3" ry="2.1" fill={SHOE} />
      </Layer>
      <rect x="46.5" y="78" width="17" height="8" rx="3" fill={SHORTS} />
      {/* くび: みじかく、どう と あたま の間に ちょっとだけ */}
      <rect x="52.4" y="54" width="5.2" height="8" rx="2.2" fill={SKIN_SHADE} />
      <Layer scaleY={1 + rumble * 0.03} origin={[55, 80]}>
        <rect x="46" y="59" width="18" height="24" rx="6.4" fill={SHIRT} />
        <path d="M48 72 h14" stroke={SHIRT_DARK} strokeWidth="1.3" strokeLinecap="round" />
      </Layer>
      <Limb limb={armL} shoulder={SHOULDER_L} />
      <Limb limb={armR} shoulder={SHOULDER_R} />
      {rumble > 0 && (
        <g fill="none" stroke="#c9a06b" strokeWidth="1" strokeLinecap="round">
          <path d={`M${43 - rumble} 70 q-2 1.6 0 3.2`} />
          <path d={`M${67 + rumble} 70 q2 1.6 0 3.2`} />
        </g>
      )}
      <Layer rotate={tilt} origin={[55, 56]}>
        <circle cx={HEAD[0]} cy={HEAD[1]} r={HEAD_R} fill={SKIN} />
        <path d="M43.2 43 C42 32 53 29.5 59 31.5 C64.5 33.4 67.3 39 66.8 44 C65 40.5 61.5 38.5 55 38.6 C49 38.8 45 40.2 43.2 43 Z" fill={HAIR} />
        <path d="M54 32 Q54.6 28 57.6 29.2" fill="none" stroke={HAIR} strokeWidth="1.8" strokeLinecap="round" />
        <Face mood={mood} look={look} chew={chew} />
      </Layer>
    </>
  )
}

/** ほっと した「ふう」。あたまの 左がわ に ふわっと */
function Sigh({ t }: SceneProps) {
  const show = during(t, ARRIVE + 0.1, HUNGRY + 0.2, 0.2)
  if (show <= 0) return null
  const p = span(t, ARRIVE + 0.1, HUNGRY + 0.2, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={46 - p * 8} cy={52 - p * 4} rx={2.2 + p * 2} ry={1.5 + p * 1.2} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
    </g>
  )
}

/** そだつ しるし: 上へ のぼる やじるし と、ほし */
function Growth({ t }: SceneProps) {
  const show = during(t, GROW + 0.1, WIDE + 0.5, 0.3)
  if (show <= 0) return null
  const p = span(t, GROW + 0.1, WIDE + 0.5)
  return (
    <g opacity={show}>
      {[34, 76].map((x, i) => (
        <path key={x} d={`M${x - 3} ${58 - p * 14 - i * 3} l3 -3.6 l3 3.6`} fill="none" stroke="#4caf6a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {[[30, 44], [80, 42], [45, 30]].map(([x, y], i) => (
        <Star key={x} cx={x} cy={y - p * 4} r={2.6 - i * 0.3} color="#ffc233" spin={p * 180 + i * 50} />
      ))}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  // はしる: ひだり の そとから やねの 下まで。足と うで を ふる
  const centerX = mix(t, RUN, ARRIVE, -16, 55, (x) => x)
  const walking = t < RUN ? 0 : 1 - span(t, ARRIVE - 0.3, ARRIVE)
  const stride = Math.sin((t - RUN) * Math.PI * 2 * 2.2) * walking
  const bob = -Math.abs(stride) * 1.4
  const enter = span(t, RUN - 0.15, RUN)
  const scale = mix(t, GROW, GROW + 0.8, SMALL, 1, backOut)

  // うでの 目あて: はしる → おにぎり → 口 → たらす → ひろげる、の じゅんに つなぐ
  const swing = stride * 4
  let target: Pt = [HANG_R[0], HANG_R[1] - swing]
  target = lerpPt(target, REACH_R, span(t, REACH, GRAB, easeInOut))
  target = lerpPt(target, MOUTH_R, span(t, GRAB + 0.1, BITE, easeInOut))
  target = lerpPt(target, HANG_R, span(t, 5.6, 6.0, easeInOut))
  target = lerpPt(target, WIDE_R, span(t, WIDE, WIDE + 0.6, easeInOut))
  let targetL: Pt = [HANG_L[0], HANG_L[1] + swing]
  targetL = lerpPt(targetL, WIDE_L, span(t, WIDE, WIDE + 0.6, easeInOut))
  const armR = arm(SHOULDER_R, target, 1)
  const armL = arm(SHOULDER_L, targetL, -1)

  const mood: Mood = t >= WIDE ? 'happy' : t >= BITE && t < 5.8 ? 'eat' : t >= GROW ? 'glad' : centerX < 28 ? 'sad' : 'glad'
  const look = t >= HUNGRY && t < 4.9 ? 1 : 0
  const chew = t >= BITE ? Math.abs(wave(t, 0.36)) : 0
  const tilt = t >= BITE && t < 5.8 ? wave(t, 0.36) * 2.2 : 0
  const rumble = t >= HUNGRY && t < 3.5 ? Math.abs(wave(t, 0.25)) : 0

  // おにぎり: だい の 上 → 手の 上(たべおわるまで)。ひとくち ごとに ちいさく なる
  const held = t >= GRAB
  const handWorld = toWorld(armR.hand, scale)
  const ballAt: Pt = held ? [handWorld[0], handWorld[1] - BALL_LIFT] : RICE_AT
  const ballSize = 1 - 0.28 * span(t, 4.9, 5.05) - 0.27 * span(t, 5.2, 5.35) - 0.45 * span(t, 5.5, 5.65)

  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Clouds t={t} />
        <Stool t={t} at={RICE_AT} />
        <House t={t} />
        <Steam t={t} at={RICE_AT} />
        <RiceBall at={ballAt} size={t < 0.8 ? 0 : Math.max(0, ballSize) * span(t, 0.6, 1.1, backOut)} />
        <Layer opacity={enter}>
          <ellipse cx={centerX} cy="96.6" rx={9 * scale} ry="2.2" fill="#000000" opacity="0.12" />
          <Layer x={centerX - 55} y={bob} scale={scale} origin={FEET}>
            <Child step={stride} mood={mood} look={look} chew={chew} tilt={tilt} armL={armL} armR={armR} rumble={rumble} />
            <Sigh t={t} />
          </Layer>
        </Layer>
        <Rain t={t} />
        <Smoke t={t} />
        <Growth t={t} />
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
    { at: 0, label: 'やねの いえが できる。雨が ふる', sound: 'pop' },
    { at: RUN, label: 'ぬれた こどもが はしってくる' },
    { at: ARRIVE, label: 'やねの 下で ほっと する', sound: 'pop' },
    { at: REACH, label: 'おなかが すいて、おにぎりを とる' },
    { at: BITE, label: 'もぐもぐ たべる' },
    { at: GROW, label: 'ぐんぐん そだつ', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '字 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
