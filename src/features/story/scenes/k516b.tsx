/*
 * 八(はち): 1本の 小川が 石に あたって、右と左の 2本に わかれる。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … 石の 左を ながれる 小川(左へ ながれて、さいごは 小さな 池)
 *   2画目(へ)  … 石の 右を ながれる 小川(右へ ながれて、さいごは 小さな 池)
 *   (うえから 見おろした 絵。小川は 画の線を そのまま 水の しん にする)
 *
 * ながれ
 *   なかよしの 2ひきの さかな(主役は オレンジの さかな)が、1本の 小川を いっしょに およぐ
 *   → 水が 大きな 石に あたって、右と 左の 2本に わかれる
 *   → さかなは びっくり! 水に ながされて、ひだりと みぎに わかれていく(しょんぼり)
 *   → それぞれの 池に ついて「またね」と ひれを ふる(にっこり)
 *   → ほね が ひかって、絵が うすくなり、字「八」が のこる
 *
 * さかなは 上から 見た ほんものの つくり を守る(字の形に合わせて ゆがめない):
 *   あたま が すすむ ほう、おびれ は うしろ、むなびれ は 体の よこ。すすむ 向きに 体を むける。
 *   水は 石の ところで わかれる(ひとりでに わかれたようには 見せない)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '八'

const MEADOW = '#c5e8a9'
const MEADOW_DARK = '#b3dc92'
const BUSH = '#55b86e'
const BUSH_DARK = '#3f9c59'
const SAND = '#ecdcab'
const WATER = '#7cc4f2'
const WATER_DARK = '#5aaee8'
const FOAM = '#ffffff'
const ROCK = '#9ea7b2'
const ROCK_DARK = '#808a97'
const ROCK_LIGHT = '#c2c9d2'
const MOSS = '#6fbf73'
const PAD = '#3f9c59'
const ORANGE = '#ff9a3c'
const ORANGE_LIGHT = '#ffc78a'
const ORANGE_FIN = '#f27a1f'
const BLUE = '#5b9be8'
const BLUE_LIGHT = '#a9ccf5'
const BLUE_FIN = '#3f7fd0'
const CHEEK = '#ff8fa0'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const ALERT = '#ff5f4d'
const HEART = '#f0607e'

/** くぎり の時間(秒) */
const FLOW_START = 0.15
const FRONT_HIT = 1.1
const SWIM = 1.3
/** さかなが 水の わかれめの てまえで びっくりして 止まる */
const FORK_AT = 3.3
const SHOCK_END = 3.9
/** ながされて わかれる */
const ARRIVE = 5.7
const INK = 6.6
const DONE = 9.2
const DURATION = 10

/** 石の ばしょ(2本の 小川の まんなか) */
const ROCK_AT: readonly [number, number] = [47, 43]
/** 水の わかれめの てまえで 止まるまでに すすむ 道のり */
const FORK_DIST = 36
/** 池の まんなかより 少し てまえで 止まる(おびれが わくから はみ出さないように) */
const STOP_SHORT = 5

type Pt = readonly [number, number]

/** 小川(画の線)の 通り道の点。scene-info の点と同じ。 */
const STROKE_1: readonly Pt[] = [[37.2, 45], [36, 51.3], [32.9, 57.1], [29.4, 62.7], [25.6, 68], [21.4, 73.1], [17, 77.9], [12.3, 82.5]]
const STROKE_2: readonly Pt[] = [[48, 27.3], [56.2, 33.1], [62.2, 41.4], [67.8, 50], [73.5, 58.6], [79.7, 66.8], [86.7, 74.3], [95.3, 80]]
const END_1: Pt = STROKE_1[STROKE_1.length - 1]
const END_2: Pt = STROKE_2[STROKE_2.length - 1]

/** さかなが およぐ 道: 上から おりてきて、石の てまえで 左と右に わかれる */
const ROUTE_ORANGE: readonly Pt[] = [[40, -8], [40, 24], [39.2, 32], ...STROKE_1]
const ROUTE_BLUE: readonly Pt[] = [[50.5, -8], [50.5, 16], [50.5, 25], [53.5, 30.5], ...STROKE_2.slice(1)]

type Track = { readonly pts: readonly Pt[]; readonly cum: readonly number[]; readonly total: number }

function makeTrack(pts: readonly Pt[]): Track {
  const cum = pts.reduce<number[]>((acc, p, i) => (i === 0 ? [0] : [...acc, acc[i - 1] + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1])]), [])
  return { pts, cum, total: cum[cum.length - 1] }
}

/** 道のり s の ところの 点 */
function pointAt(track: Track, s: number): Pt {
  const d = Math.min(Math.max(s, 0), track.total)
  const i = Math.min(track.cum.findIndex((c) => c >= d) - 1, track.pts.length - 2)
  const k = Math.max(i, 0)
  const len = track.cum[k + 1] - track.cum[k]
  const f = len > 0 ? (d - track.cum[k]) / len : 0
  const a = track.pts[k]
  const b = track.pts[k + 1]
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]
}

/** すすむ むき(あたま が 上のとき 0 度、右が 90 度) */
function headingAt(track: Track, s: number): number {
  const a = pointAt(track, s - 2.5)
  const b = pointAt(track, s + 2.5)
  return (Math.atan2(b[0] - a[0], -(b[1] - a[1])) * 180) / Math.PI
}

/** 角度を いちばん みじかい まわりかたで 近づける */
function turnToward(from: number, to: number, amount: number): number {
  const diff = ((((to - from) % 360) + 540) % 360) - 180
  return from + diff * amount
}

const TRACK_ORANGE = makeTrack(ROUTE_ORANGE)
const TRACK_BLUE = makeTrack(ROUTE_BLUE)
const TRACK_RIPPLE_MAIN = makeTrack([[45, -4], [45, 31]])
const TRACK_RIPPLE_1 = makeTrack(STROKE_1)
const TRACK_RIPPLE_2 = makeTrack(STROKE_2)

type Mood = 'happy' | 'surprised' | 'sad'

function moodAt(t: number): Mood {
  if (t < FORK_AT) return 'happy'
  if (t < SHOCK_END) return 'surprised'
  if (t < ARRIVE) return 'sad'
  return 'happy'
}

/** 時間 t での さかなの 道のり。わかれめの てまえで 止まり、そのあと ながされる。 */
function swimDistance(t: number, total: number): number {
  return FORK_DIST * span(t, SWIM, FORK_AT) + (total - FORK_DIST) * span(t, SHOCK_END, ARRIVE, easeInOut)
}

function Meadow({ t }: SceneProps) {
  const sway = wave(t, 2.6) * 6
  return (
    <>
      <rect x="0" y="0" width="109" height="109" fill={MEADOW} />
      <ellipse cx="20" cy="40" rx="14" ry="9" fill={MEADOW_DARK} opacity="0.55" />
      <ellipse cx="82" cy="92" rx="15" ry="8" fill={MEADOW_DARK} opacity="0.55" />
      <ellipse cx="72" cy="20" rx="10" ry="6" fill={MEADOW_DARK} opacity="0.5" />
      {/* 木の しげみ(上から 見た まるい かたち) */}
      {[
        [8, 12, 8],
        [101, 100, 7],
        [70, 9, 5.5],
        [15, 27, 5],
      ].map(([x, y, r]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r={r} fill={BUSH_DARK} />
          <circle cx={x - r * 0.15} cy={y - r * 0.2} r={r * 0.78} fill={BUSH} />
        </g>
      ))}
      {/* 花: かぜで ゆらゆら */}
      {[
        [22, 18, '#ff9db4'],
        [88, 22, '#ffe066'],
        [6, 50, '#ffe066'],
        [100, 52, '#ff9db4'],
        [70, 96, '#ff9db4'],
        [42, 90, '#ffe066'],
        [28, 101, '#ff9db4'],
      ].map(([x, y, color], i) => (
        <Layer key={`${x}-${y}`} x={Number(x)} y={Number(y)} rotate={sway * (i % 2 === 0 ? 1 : -1)}>
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={Math.sin((a * Math.PI) / 180) * 1.7} cy={-Math.cos((a * Math.PI) / 180) * 1.7} r="1.25" fill={String(color)} />
          ))}
          <circle cx="0" cy="0" r="0.95" fill="#ffffff" />
        </Layer>
      ))}
    </>
  )
}

/** 水と きし(すな)。水が 上から のびて 石に あたり、右と左に わかれていく。 */
function Stream({ t }: SceneProps) {
  const front = span(t, FLOW_START, FRONT_HIT)
  const pool = span(t, FRONT_HIT - 0.1, FRONT_HIT + 0.35, backOut)
  const left = span(t, FRONT_HIT + 0.35, 2.3)
  const right = span(t, FRONT_HIT, 2.6)
  // 水が 石に あたって まず ひだりへ まわりこむ(つなぎの 水)
  const connector = span(t, FRONT_HIT, FRONT_HIT + 0.35)
  const pondLeft = span(t, 2.25, 2.7, backOut)
  const pondRight = span(t, 2.55, 3.0, backOut)
  return (
    <>
      {/* きし(すな) */}
      <Layer scaleY={front} origin={[45, -4]}>
        <rect x="33" y="-4" width="24" height="35" rx="3" fill={SAND} />
      </Layer>
      <Layer scale={pool} origin={[45, 33]}>
        <ellipse cx="45" cy="33" rx="13.5" ry="8.4" fill={SAND} />
      </Layer>
      <path d="M40 33 Q36.5 39 37.2 45" fill="none" stroke={SAND} strokeWidth="13" strokeLinecap="round" pathLength={1} strokeDasharray="1 2" strokeDashoffset={1 - connector} opacity={connector > 0 ? 1 : 0} />
      <Bone char={CHAR} n={1} color={SAND} width={13} to={left} />
      <Bone char={CHAR} n={2} color={SAND} width={13} to={right} />
      <Layer scale={pondLeft} origin={END_1}>
        <circle cx={END_1[0]} cy={END_1[1]} r="11.5" fill={SAND} />
      </Layer>
      <Layer scale={pondRight} origin={END_2}>
        <circle cx={END_2[0]} cy={END_2[1]} r="11.5" fill={SAND} />
      </Layer>
      {/* 水 */}
      <Layer scaleY={front} origin={[45, -4]}>
        <rect x="36" y="-4" width="18" height="35" rx="2" fill={WATER} />
        <path d="M39 -4 V31 M51 -4 V31" stroke={WATER_DARK} strokeWidth="1" opacity="0.35" />
      </Layer>
      <Layer scale={pool} origin={[45, 33]}>
        <ellipse cx="45" cy="33" rx="10.6" ry="6.4" fill={WATER} />
      </Layer>
      <path d="M40 33 Q36.5 39 37.2 45" fill="none" stroke={WATER} strokeWidth="9" strokeLinecap="round" pathLength={1} strokeDasharray="1 2" strokeDashoffset={1 - connector} opacity={connector > 0 ? 1 : 0} />
      <Bone char={CHAR} n={1} color={WATER} width={9} to={left} />
      <Bone char={CHAR} n={2} color={WATER} width={9} to={right} />
      <Layer scale={pondLeft} origin={END_1}>
        <circle cx={END_1[0]} cy={END_1[1]} r="9.2" fill={WATER} />
        <circle cx={END_1[0] + 1} cy={END_1[1] + 1.4} r="5.4" fill={WATER_DARK} opacity="0.35" />
      </Layer>
      <Layer scale={pondRight} origin={END_2}>
        <circle cx={END_2[0]} cy={END_2[1]} r="9.2" fill={WATER} />
        <circle cx={END_2[0] - 1} cy={END_2[1] + 1.4} r="5.4" fill={WATER_DARK} opacity="0.35" />
      </Layer>
    </>
  )
}

/** 水の うえを ながれる 白い さざなみ。ながれた ところにだけ 出る。 */
function Ripples({ t, track, speed, reach, count, from }: { readonly t: number; readonly track: Track; readonly speed: number; readonly reach: number; readonly count: number; readonly from: number }) {
  if (t < from) return null
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const s = (t * speed + (i * track.total) / count) % track.total
        if (s > reach * track.total) return null
        const p = pointAt(track, s)
        const angle = headingAt(track, s)
        const fade = Math.sin((s / track.total) * Math.PI)
        return <ellipse key={i} cx="0" cy="0" rx="0.65" ry="2" fill={FOAM} opacity={0.75 * fade} transform={`translate(${p[0]} ${p[1]}) rotate(${angle})`} />
      })}
    </>
  )
}

/** 水が あたる 大きな 石。水が ぶつかる ところに しぶき。 */
function Rock({ t }: SceneProps) {
  const [rx, ry] = ROCK_AT
  const splash = span(t, FRONT_HIT, FRONT_HIT + 0.5, easeOut)
  const ring = during(t, FRONT_HIT, FRONT_HIT + 0.9, 0.2)
  return (
    <>
      <ellipse cx={rx + 0.8} cy={ry + 1.6} rx="7.6" ry="5.8" fill="#000000" opacity="0.12" />
      <ellipse cx={rx} cy={ry} rx="7" ry="5.4" fill={ROCK} />
      <path d={`M${rx - 6.4} ${ry + 1.5} Q${rx} ${ry + 7.4} ${rx + 6.6} ${ry + 1.2} Q${rx + 5} ${ry + 5.4} ${rx} ${ry + 5.4} Q${rx - 5} ${ry + 5.4} ${rx - 6.4} ${ry + 1.5} Z`} fill={ROCK_DARK} />
      <ellipse cx={rx - 2.2} cy={ry - 2.2} rx="3" ry="1.6" fill={ROCK_LIGHT} />
      <ellipse cx={rx + 3.2} cy={ry + 0.4} rx="2" ry="1.2" fill={MOSS} />
      {/* ぶつかった 水の しぶき */}
      <g opacity={ring} fill="none" stroke={FOAM} strokeWidth="1.2" strokeLinecap="round">
        <path d={`M${rx - 5 - splash * 3} ${ry - 5} Q${rx - 7 - splash * 4} ${ry - 8 - splash * 2} ${rx - 4 - splash * 3} ${ry - 10 - splash * 2}`} />
        <path d={`M${rx + 5 + splash * 3} ${ry - 5} Q${rx + 7 + splash * 4} ${ry - 8 - splash * 2} ${rx + 4 + splash * 3} ${ry - 10 - splash * 2}`} />
      </g>
      <g opacity={ring} fill={FOAM}>
        <circle cx={rx - 2 - splash * 2} cy={ry - 9 - splash * 4} r="1" />
        <circle cx={rx + 2 + splash * 2} cy={ry - 10 - splash * 3} r="0.9" />
        <circle cx={rx} cy={ry - 12 - splash * 4} r="0.8" />
      </g>
    </>
  )
}

/** 池の はすの 葉 */
function LilyPad({ cx, cy, rotate }: { readonly cx: number; readonly cy: number; readonly rotate: number }) {
  return (
    <Layer x={cx} y={cy} rotate={rotate}>
      <path d="M0 0 L3.4 -1 A3.6 3.6 0 1 1 1 -3.5 Z" fill={PAD} />
      <circle cx="-1" cy="1.2" r="0.9" fill="#ffb3c8" />
    </Layer>
  )
}

type FishLook = {
  readonly body: string
  readonly belly: string
  readonly fin: string
}

const LOOK_ORANGE: FishLook = { body: ORANGE, belly: ORANGE_LIGHT, fin: ORANGE_FIN }
const LOOK_BLUE: FishLook = { body: BLUE, belly: BLUE_LIGHT, fin: BLUE_FIN }

function FishFace({ mood }: { readonly mood: Mood }) {
  if (mood === 'surprised') {
    return (
      <>
        <circle cx="-2" cy="-2.6" r="1.5" fill="#ffffff" />
        <circle cx="2" cy="-2.6" r="1.5" fill="#ffffff" />
        <circle cx="-2" cy="-2.4" r="0.75" fill={EYE} />
        <circle cx="2" cy="-2.4" r="0.75" fill={EYE} />
        <ellipse cx="0" cy="-4.6" rx="0.85" ry="1" fill={MOUTH} />
      </>
    )
  }
  if (mood === 'sad') {
    return (
      <>
        <circle cx="-2" cy="-2.6" r="0.85" fill={EYE} />
        <circle cx="2" cy="-2.6" r="0.85" fill={EYE} />
        <path d="M-3.3 -4 L-1.2 -4.9 M3.3 -4 L1.2 -4.9" stroke={EYE} strokeWidth="0.6" strokeLinecap="round" />
        <path d="M-1 -4.9 Q0 -5.8 1 -4.9" fill="none" stroke={MOUTH} strokeWidth="0.6" strokeLinecap="round" />
      </>
    )
  }
  return (
    <>
      <path d="M-3.1 -2.4 Q-2 -3.8 -0.9 -2.4 M0.9 -2.4 Q2 -3.8 3.1 -2.4" fill="none" stroke={EYE} strokeWidth="0.75" strokeLinecap="round" />
      <path d="M-1.2 -4.5 Q0 -3.4 1.2 -4.5" fill="none" stroke={MOUTH} strokeWidth="0.65" strokeLinecap="round" />
    </>
  )
}

/** 上から 見た さかな。あたま が 上(すすむ むき)、おびれ が 下。 */
function Fish({ x, y, angle, look, mood, tail, finL, finR, bob }: { readonly x: number; readonly y: number; readonly angle: number; readonly look: FishLook; readonly mood: Mood; readonly tail: number; readonly finL: number; readonly finR: number; readonly bob: number }) {
  return (
    <Layer x={x} y={y} rotate={angle} scale={1.05 + bob * 0.03}>
      {/* おびれ: 体の うしろ から ゆれる */}
      <Layer rotate={tail} origin={[0, 4.4]}>
        <path d="M0 4 Q-4.2 7.6 -3.4 11.4 Q0 9.4 3.4 11.4 Q4.2 7.6 0 4 Z" fill={look.fin} />
      </Layer>
      {/* むなびれ: 体の よこ から */}
      <Layer rotate={-18 + finL} origin={[-3.4, -0.2]}>
        <ellipse cx="-5.2" cy="0.8" rx="2.5" ry="1.2" fill={look.fin} />
      </Layer>
      <Layer rotate={18 + finR} origin={[3.4, -0.2]}>
        <ellipse cx="5.2" cy="0.8" rx="2.5" ry="1.2" fill={look.fin} />
      </Layer>
      <ellipse cx="0" cy="0" rx="4" ry="6" fill={look.body} />
      <ellipse cx="0" cy="1.6" rx="2.2" ry="3.3" fill={look.belly} />
      <circle cx="-2.6" cy="-1" r="1" fill={CHEEK} opacity="0.55" />
      <circle cx="2.6" cy="-1" r="1" fill={CHEEK} opacity="0.55" />
      <FishFace mood={mood} />
    </Layer>
  )
}

/** さかな1ぴき。道のり・むき・きもち を t から きめる。 */
function FishActor({ t, track, look, end, other, side }: { readonly t: number; readonly track: Track; readonly look: FishLook; readonly end: Pt; readonly other: Pt; readonly side: 'left' | 'right' }) {
  if (t < SWIM - 0.3) return null
  const dist = swimDistance(t, track.total - STOP_SHORT)
  const p = pointAt(track, dist)
  const toOther = (Math.atan2(other[0] - end[0], -(other[1] - end[1])) * 180) / Math.PI
  // ついたら、あいての ほうを むいて「またね」
  const angle = turnToward(headingAt(track, dist), toOther, span(t, ARRIVE - 0.3, ARRIVE + 0.4, easeInOut))
  const swimming = t < FORK_AT || (t > SHOCK_END && t < ARRIVE)
  const tail = wave(t, swimming ? 0.36 : 0.9) * (swimming ? 20 : 8)
  const bye = span(t, ARRIVE + 0.1, ARRIVE + 0.4)
  const finWave = wave(t, 0.4) * 34 * bye
  // 止まっているあいだ、石の ほうを むいて どきどき ふるえる
  const quiver = t >= FORK_AT && t < SHOCK_END ? wave(t, 0.14) * 0.6 : 0
  return (
    <Fish
      x={p[0] + quiver}
      y={p[1]}
      angle={angle}
      look={look}
      mood={moodAt(t)}
      tail={tail}
      finL={side === 'left' ? -finWave : 0}
      finR={side === 'right' ? finWave : 0}
      bob={wave(t, 1.2)}
    />
  )
}

/** びっくりの「!」。さかなの 上(画面の 上)に ぽん と出る。 */
function Alert({ t, track }: { readonly t: number; readonly track: Track }) {
  const show = during(t, FORK_AT, SHOCK_END + 0.2, 0.15)
  if (show <= 0) return null
  const p = pointAt(track, FORK_DIST)
  const pop = span(t, FORK_AT, FORK_AT + 0.25, backOut)
  return (
    <Layer x={p[0] - 9} y={p[1] - 6} scale={pop} opacity={show}>
      <rect x="-0.9" y="-5" width="1.8" height="5.4" rx="0.9" fill={ALERT} />
      <circle cx="0" cy="2.2" r="1.1" fill={ALERT} />
    </Layer>
  )
}

function HeartMark({ t, at, delay }: { readonly t: number; readonly at: Pt; readonly delay: number }) {
  const show = during(t, ARRIVE + 0.4 + delay, INK + 1.0 + delay, 0.3)
  if (show <= 0) return null
  const p = span(t, ARRIVE + 0.4 + delay, INK + 1.0 + delay)
  return (
    <Layer x={at[0]} y={at[1] - 8 - p * 7} scale={0.9 + wave(t, 0.8) * 0.08} opacity={show}>
      <path d="M0 2.2 C-4 -1 -2.6 -3.8 0 -1.6 C2.6 -3.8 4 -1 0 2.2 Z" fill={HEART} />
    </Layer>
  )
}

/** とんぼ: ひだり上から みぎ上へ、ふわふわ とぶ(にぎやかし) */
function Dragonfly({ t }: SceneProps) {
  const x = 78 + wave(t, 5.5) * 14 + wave(t, 1.7) * 2
  const y = 15 + wave(t, 3.1, 0.7) * 5
  const flap = wave(t, 0.1) * 0.5
  return (
    <Layer x={x} y={y} rotate={wave(t, 5.5, 1.3) * 18 + 90}>
      <ellipse cx="-2.6" cy="-1.4" rx="3.2" ry={0.9 + flap * 0.4} fill="#ffffff" opacity="0.8" />
      <ellipse cx="-2.6" cy="1.4" rx="3.2" ry={0.9 - flap * 0.4} fill="#ffffff" opacity="0.8" />
      <path d="M0 0 H-6" stroke="#ff7a4d" strokeWidth="1" strokeLinecap="round" />
      <circle cx="0.6" cy="0" r="1.1" fill="#ff7a4d" />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 2)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const front = span(t, FLOW_START, FRONT_HIT)
  const left = span(t, FRONT_HIT + 0.35, 2.3)
  const right = span(t, FRONT_HIT, 2.6)
  return (
    <>
      <Layer opacity={ink.picture}>
        <Meadow t={t} />
        <Stream t={t} />
        <Ripples t={t} track={TRACK_RIPPLE_MAIN} speed={9} reach={front} count={4} from={0.5} />
        <Ripples t={t} track={TRACK_RIPPLE_1} speed={9} reach={left} count={4} from={1.4} />
        <Ripples t={t} track={TRACK_RIPPLE_2} speed={9} reach={right} count={5} from={1.4} />
        <Rock t={t} />
        <Layer opacity={span(t, 2.4, 3.0)}>
          <LilyPad cx={END_1[0] - 3.2} cy={END_1[1] - 3} rotate={20} />
          <LilyPad cx={END_2[0] + 3.4} cy={END_2[1] + 3} rotate={200} />
        </Layer>
        <FishActor t={t} track={TRACK_BLUE} look={LOOK_BLUE} end={END_2} other={END_1} side="right" />
        <FishActor t={t} track={TRACK_ORANGE} look={LOOK_ORANGE} end={END_1} other={END_2} side="left" />
        <Alert t={t} track={TRACK_ORANGE} />
        <HeartMark t={t} at={END_1} delay={0} />
        <HeartMark t={t} at={END_2} delay={0.2} />
        <Dragonfly t={t} />
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Layer scale={1 + bump} origin={[54.5, 54.5]}>
        <Ink char={CHAR} progress={ink.progress} tint={ink.tint} />
      </Layer>
      <Sparkles cx={54.5} cy={54} progress={ink.sparkle} />
    </>
  )
}

const scene: SceneModule = {
  char: CHAR,
  duration: DURATION,
  beats: [
    { at: 0, label: '小川が 上から ながれてくる', sound: 'pop' },
    { at: FRONT_HIT, label: '水が 大きな 石に あたって、右と左に わかれる' },
    { at: SWIM, label: 'なかよしの さかなが いっしょに およぐ' },
    { at: FORK_AT, label: 'わかれめで びっくり!', sound: 'tap' },
    { at: SHOCK_END, label: '水に ながされて、ひだりと みぎに わかれていく' },
    { at: ARRIVE, label: '池に ついて「またね」と ひれを ふる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '八 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
