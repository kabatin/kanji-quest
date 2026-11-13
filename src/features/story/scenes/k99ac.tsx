/*
 * 馬(うま): たてがみを なびかせて 走る 馬の 形。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)      … 首の うしろがわ(たてがみの はえぎわ)
 *   2・4・5画目(一) … 風に なびく たてがみ(3つの たば。右へ まっすぐ ながれる)
 *   3画目(丨)      … たてがみの まんなかの 1本(ほね が ひかるとき だいたい 重なる)
 *   6画目(𠃍)      … せなか から おしり、うしろあし へ つづく せ
 *   7〜10画目      … 4本の あし(まえあし 2本は 前へ、うしろあし 2本は うしろへ)
 *
 * ながれ
 *   ひとりぼっちの 馬が しょんぼり うつむいている(たてがみも しっぽも たれている)
 *   → 小鳥が とんできて ぴぴっと さえずる。馬は はっと 顔を上げ、にこにこ に なる
 *   → 小鳥が とんでいくのを おいかけて 走りだす(景色が うしろへ ながれ、たてがみが 風でなびく)
 *   → ぴょーんと とびはねた しゅんかん、たてがみ・せ・4本のあし が 字の形に そろう
 *   → ほね が ひかって、絵が うすくなり、字「馬」が のこる
 *
 * 馬は ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   くび は どう の まえ(左)から ななめ上へ のびて、先に あたま。あたま は 前(左)をむく。
 *   あし は 2かんせつ(ひざ で まがる)。走るときは まえあし が 前へ、うしろあし が うしろへ。
 *   たてがみ・しっぽ は、風に ふかれて うしろ(右)へ ながれる。止まっていると 下へ たれる。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '馬'

const COAT = '#c98a4f'
const COAT_DARK = '#a76d3b'
const COAT_LIGHT = '#e3b27a'
const MUZZLE = '#ecc592'
const MANE = '#5a3b2a'
const MANE_LIGHT = '#85593d'
const HOOF = '#4a3a30'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const SUN = '#ffd24a'
const HILL = '#e2f2d2'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const DUST = '#e8dcc0'
const BIRD = '#5aa9e6'
const BIRD_DARK = '#3d86c6'

/** くぎり の時間(秒) */
const BIRD_IN = 1.1
/** 小鳥に きづく */
const SEE = 2.0
/** 顔を上げて にこにこ */
const LIFT = 3.0
/** 走りだす */
const RUN = 4.0
/** ぴょーんと とびはねる(字の形に そろう) */
const FLY = 6.4
const INK = 7.4
const DONE = 10.4
const DURATION = 10.8

/** 地面の 上はし */
const GROUND = 95
/** 立っているとき、体が 地面まで さがる 分(足の ながさに 合わせる) */
const STAND_DROP = 8

type Pt = readonly [number, number]
type LegPose = readonly [hip: Pt, knee: Pt, hoof: Pt]

const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
const lerpLeg = (a: LegPose, b: LegPose, k: number): LegPose => [lerpPt(a[0], b[0], k), lerpPt(a[1], b[1], k), lerpPt(a[2], b[2], k)]

/** かた(くび の つけね)。くび は ここから ななめ上へ */
const SHOULDER: Pt = [31, 60]
const NECK_LEN = 38
/** 字の形に そろったときの くび の ふり(ま上から 左へ 何度か) */
const NECK_FINAL = 8
/** 字の形に そろったときの あたま の つけね(てっぺん) */
const POLL_FINAL: Pt = [SHOULDER[0] - Math.sin((NECK_FINAL * Math.PI) / 180) * NECK_LEN, SHOULDER[1] - Math.cos((NECK_FINAL * Math.PI) / 180) * NECK_LEN]

const rad = (deg: number) => (deg * Math.PI) / 180

/** 4本の あし。stand = 立つ / reach・tuck = 走る(のばす・たたむ)/ final = 字の形(7〜10画目) */
type Leg = {
  readonly far: boolean
  readonly phase: number
  readonly stand: LegPose
  readonly a: LegPose
  readonly b: LegPose
  readonly final: LegPose
}

const LEGS: readonly Leg[] = [
  // 7画目: まえあし(むこう)。前へ ぐーんと のばす
  { far: true, phase: 0, stand: [[33, 70], [33, 79], [33, 88]], a: [[30, 70], [17.3, 76.3], [15.7, 93.3]], b: [[30, 70], [24, 80], [28, 88]], final: [[30, 70], [17.3, 76.3], [15.7, 93.3]] },
  // 8画目: まえあし(てまえ)
  { far: false, phase: 0.07, stand: [[39, 70], [39, 79], [39, 88]], a: [[34, 70], [26, 77], [22, 90]], b: [[34, 70], [36, 80], [42, 86]], final: [[34, 70], [34, 74.5], [39.4, 88.3]] },
  // 9画目: うしろあし(むこう)
  { far: true, phase: 0.2, stand: [[66, 70], [66, 79], [66, 88]], a: [[50, 68], [46, 79], [44, 88]], b: [[50, 68], [52, 72], [56.8, 83.6]], final: [[50, 68], [51, 71], [56.8, 83.6]] },
  // 10画目: うしろあし(てまえ)。うしろへ けりだす
  { far: false, phase: 0.27, stand: [[72, 70], [72, 79], [72, 88]], a: [[66, 68], [62, 78], [60, 88]], b: [[66, 68], [72, 74], [80, 84]], final: [[66, 66], [68.3, 67.8], [76, 79.9]] },
]

/* ───────── 景色 ───────── */

/** 景色が ながれて ぐるっと もどってくる ための わりざん */
const wrap = (x: number, period = 150) => (((x % period) + period) % period) - 25

function Backdrop({ t, scroll }: { readonly t: number; readonly scroll: number }) {
  const appear = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={appear} rotate={t * 14} origin={[97, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="96.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 97 13)`} />
        ))}
      </Layer>
      <circle cx="97" cy="13" r={6.2 * appear} fill={SUN} />
      {/* ゆっくり ながれる 雲(とおいほど おそい) */}
      <g fill="#ffffff" opacity="0.9">
        {[30, 88].map((base, i) => {
          const x = wrap(base + scroll * 0.08 + t * 1.2)
          const y = i === 0 ? 26 : 38
          return (
            <g key={base}>
              <ellipse cx={x} cy={y} rx="7" ry="3.2" />
              <ellipse cx={x + 4.5} cy={y - 1.8} rx="4.6" ry="3.2" />
            </g>
          )
        })}
      </g>
      {/* とおくの おか */}
      {[20, 85].map((base) => (
        <ellipse key={base} cx={wrap(base + scroll * 0.25)} cy="100" rx="42" ry="17" fill={HILL} />
      ))}
      <rect x="-2" y={GROUND} width="113" height="16" fill={GRASS} />
      {/* てまえの 草 */}
      {[10, 40, 70, 100, 130].map((base, i) => {
        const x = wrap(base + scroll)
        const y = 99 + (i % 2) * 5
        return <path key={base} d={`M${x} ${y} l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      })}
    </>
  )
}

/* ───────── 小鳥 ───────── */

function Bird({ t }: SceneProps) {
  const x = t < RUN ? mix(t, BIRD_IN, SEE, 125, 52, easeOut) : 52 - span(t, RUN, RUN + 1.6, easeIn) * 80
  if (t < BIRD_IN || x < -10) return null
  const y = 9 + 1.6 * wave(t, 0.55)
  const flap = wave(t, 0.14) * 30
  const note = during(t, SEE, LIFT + 0.7, 0.2)
  const rise = (t * 5) % 6
  return (
    <>
      <Layer x={x} y={y}>
        <path d="M2.6 0.4 l4.6 -1.6 l-3.4 3.2 Z" fill={BIRD_DARK} />
        <ellipse cx="0" cy="0" rx="4" ry="3.1" fill={BIRD} />
        <circle cx="-3" cy="-2.3" r="2.3" fill={BIRD} />
        <path d="M-5 -2.4 l-2.4 0.7 l2.3 0.9 Z" fill="#f2b632" />
        <circle cx="-3.6" cy="-2.8" r="0.55" fill={EYE} />
        <Layer rotate={flap} origin={[0.4, -0.6]}>
          <path d="M-1.2 -0.8 Q1.6 -3.8 4 -0.6 Q1.6 0.8 -1.2 -0.8 Z" fill={BIRD_DARK} />
        </Layer>
      </Layer>
      {/* ぴぴっ: さえずりの おんぷ */}
      <g opacity={note} fill="#f07f9e" transform={`translate(${x + 7} ${y + 9 - rise})`}>
        <path d="M2.2 0 v-4.4 l2.6 -0.8 v4.2" fill="none" stroke="#f07f9e" strokeWidth="0.8" />
        <ellipse cx="1.2" cy="0" rx="1.1" ry="0.8" />
        <ellipse cx="3.8" cy="-0.8" rx="1.1" ry="0.8" />
      </g>
    </>
  )
}

/** 「！」: 小鳥に きづいた しゅんかん */
function Notice({ t }: SceneProps) {
  const pop = span(t, SEE, SEE + 0.3, backOut) * during(t, SEE, LIFT, 0.15)
  const s = Math.max(0, pop)
  if (s <= 0) return null
  return (
    <Layer scale={s} origin={[18, 14]}>
      <rect x="16.8" y="4" width="2.6" height="7" rx="1.3" fill="#e8534a" />
      <circle cx="18.1" cy="14" r="1.5" fill="#e8534a" />
    </Layer>
  )
}

/** 走る ときの 土けむり。うしろ(右)へ ながれる */
function Dust({ t }: SceneProps) {
  const show = span(t, RUN + 0.3, RUN + 0.9) * (1 - span(t, FLY - 0.5, FLY))
  if (show <= 0) return null
  return (
    <>
      {[0, 1, 2, 3].map((i) => {
        const p = (t * 1.8 + i / 4) % 1
        return <circle key={i} cx={86 + p * 20} cy={94 - p * 6} r={1.4 + p * 3.2} fill={DUST} opacity={(1 - p) * show * 0.9} />
      })}
    </>
  )
}

/* ───────── 馬 ───────── */

type Mood = 'sad' | 'surprised' | 'happy'

/** あたま。字の形のときの 向き(左下へ のびる)で 描き、くび に 合わせて まわす */
function Head({ mood, earTilt }: { readonly mood: Mood; readonly earTilt: number }) {
  const [px, py] = POLL_FINAL
  return (
    <>
      {/* むこうの みみ */}
      <Layer rotate={earTilt} origin={[px + 3.5, py - 1.5]}>
        <path d={`M${px + 1.8} ${py - 0.6} L${px + 1.4} ${py - 10} L${px + 7} ${py - 3} Z`} fill={COAT_DARK} />
      </Layer>
      {/* かお: ひたいから 鼻さきへ ななめ下に のびる */}
      <g transform="rotate(-49 19 30)">
        <ellipse cx="19" cy="30" rx="12.5" ry="6.4" fill={COAT} />
        <ellipse cx="18" cy="32.2" rx="9" ry="2.6" fill={COAT_LIGHT} opacity="0.7" />
      </g>
      <circle cx="13.2" cy="36.8" r="5" fill={MUZZLE} />
      {/* てまえの みみ */}
      <Layer rotate={earTilt} origin={[px - 0.2, py - 1.5]}>
        <path d={`M${px - 1.6} ${py - 0.6} L${px - 2.4} ${py - 11} L${px + 3.6} ${py - 3.6} Z`} fill={COAT} />
        <path d={`M${px - 1.2} ${py - 3} L${px - 1.5} ${py - 7.6} L${px + 1.4} ${py - 4} Z`} fill={CHEEK} opacity="0.6" />
      </Layer>
      {/* ひたいの かみ(1画目の はじまり あたり) */}
      <path d={`M${px - 1} ${py - 1} Q${px - 3.6} ${py + 1.8} ${px - 4.2} ${py + 5}`} fill="none" stroke={MANE} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="24.4" cy="32.2" r="2.1" fill={CHEEK} opacity="0.55" />
      <ellipse cx="10.6" cy="37.4" rx="0.9" ry="1.2" fill={COAT_DARK} />
      {mood === 'sad' && (
        <>
          <path d="M20.2 26.6 Q22.2 28.2 24.2 26.6" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M19.6 24.6 l4.4 -1.6" stroke={MANE} strokeWidth="1" strokeLinecap="round" />
          <path d="M10.6 41.8 Q13.4 39.8 16.4 41.4" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'surprised' && (
        <>
          <circle cx="22.2" cy="27" r="2.1" fill="#ffffff" />
          <circle cx="22" cy="27.2" r="1.3" fill={EYE} />
          <ellipse cx="13.2" cy="41.4" rx="1.3" ry="1.5" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M20.2 27.6 Q22.2 25 24.2 27.6" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M10.4 40.2 Q13.4 43.6 17 40.6" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
    </>
  )
}

/** 1本の あし。ひざ で まがる 2かんせつ */
function LegShape({ pose, far }: { readonly pose: LegPose; readonly far: boolean }) {
  const [h, k, f] = pose
  return (
    <>
      <path d={`M${h[0]} ${h[1]} L${k[0]} ${k[1]} L${f[0]} ${f[1]}`} fill="none" stroke={far ? COAT_DARK : COAT} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={f[0]} cy={f[1]} r="2.9" fill={HOOF} />
    </>
  )
}

/** たてがみ・しっぽ の 1たば。from から tip へ、すこし しなって のびる */
function Lock({ from, tip, bend, width, color, light }: { readonly from: Pt; readonly tip: Pt; readonly bend: number; readonly width: number; readonly color: string; readonly light: string }) {
  const dx = tip[0] - from[0]
  const dy = tip[1] - from[1]
  const len = Math.hypot(dx, dy) || 1
  const c: Pt = [(from[0] + tip[0]) / 2 - (dy / len) * bend, (from[1] + tip[1]) / 2 + (dx / len) * bend]
  const d = `M${from[0]} ${from[1]} Q${c[0]} ${c[1]} ${tip[0]} ${tip[1]}`
  return (
    <>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />
      <path d={d} fill="none" stroke={light} strokeWidth={width * 0.3} strokeLinecap="round" opacity="0.8" />
    </>
  )
}

/** 字の形で、たてがみ が 右へ まっすぐ ながれる 向き(ま下から 右へ 何度か。すこし 上がる) */
const MANE_FINAL_ANGLE = 97
const TAIL_FINAL_ANGLE = 100

const MANES = [
  { u: -0.09, len: 47, phase: 0 },
  { u: 0.32, len: 43, phase: 0.25 },
  { u: 0.68, len: 42, phase: 0.5 },
] as const

function Horse({ t }: SceneProps) {
  const run = span(t, RUN, RUN + 0.6, easeInOut)
  const settle = span(t, FLY, FLY + 0.7, easeInOut)
  const wind = Math.max(span(t, RUN - 0.2, RUN + 1.0, easeInOut), 0.12 * span(t, LIFT, LIFT + 0.6))
  const mood: Mood = t < SEE ? 'sad' : t < LIFT ? 'surprised' : 'happy'
  const earTilt = mood === 'sad' ? 50 : mood === 'surprised' ? -4 : wave(t, 0.5) * 4 * (1 - settle)

  // くび: しょんぼり(下へ のばす)→ 小鳥に きづく → 顔を上げる(ぽん と)→ 走る
  const droop = 28 + wave(t, 2.4) * 1.5 * (1 - span(t, SEE, SEE + 0.3))
  const neck =
    mix(t, LIFT, LIFT + 0.6, mix(t, SEE, SEE + 0.5, droop, 24, easeOut), 14, backOut) + wave(t, 0.4) * 3 * run * (1 - settle) + (NECK_FINAL - 14) * settle
  const dir: Pt = [-Math.sin(rad(neck)), -Math.cos(rad(neck))]
  const poll: Pt = [SHOULDER[0] + dir[0] * NECK_LEN, SHOULDER[1] + dir[1] * NECK_LEN]
  // くび の うしろがわ(右がわ)の むき
  const back: Pt = [Math.cos(rad(neck)), -Math.sin(rad(neck))]

  // 体: 立っていると 地面まで さがる。走ると はずみ、とびはねて 字の形の たかさに
  const lift = Math.sin(settle * Math.PI) * 5
  const bodyY = (STAND_DROP * (1 - run) + run * (2 + 2 * wave(t, 0.4, 0.3))) * (1 - settle) - lift
  const pitch = wave(t, 0.4, 0.1) * 1.2 * run * (1 - settle)

  const legs = LEGS.map((leg) => {
    const cycle = (wave(t, 0.4, leg.phase) + 1) / 2
    const gallop = lerpLeg(leg.a, leg.b, cycle)
    return { far: leg.far, pose: lerpLeg(lerpLeg(leg.stand, gallop, run), leg.final, settle) }
  })

  // たてがみ・しっぽ: 風が ふくほど 右へ ながれる(止まっていると 下へ たれる)
  const flutter = (1 - settle) * 4.5 + 0.8
  const tailBase: Pt = [91, 60]
  const tailAngle = wave(t, 1.8) * 6 * (1 - wind) + TAIL_FINAL_ANGLE * wind
  const tailLen = 24 + (13 - 24) * wind
  const tailTip: Pt = [tailBase[0] + Math.sin(rad(tailAngle)) * tailLen, tailBase[1] + Math.cos(rad(tailAngle)) * tailLen]

  return (
    <>
      <ellipse cx="60" cy="96.6" rx={34 * (1 - 0.3 * Math.sin(settle * Math.PI))} ry="2.6" fill="#000000" opacity={0.12 * (1 - 0.5 * settle)} />
      <Layer y={bodyY} rotate={pitch} origin={[60, 70]}>
        {legs.filter((l) => l.far).map((l, i) => <LegShape key={i} pose={l.pose} far />)}
        <Lock from={tailBase} tip={tailTip} bend={2.4 * wave(t, 0.4) * wind * (1 - settle)} width={4.6} color={MANE} light={MANE_LIGHT} />
        {/* どう: せなか(6画目の ほね)から おしり、はら */}
        <path d="M29 62 C45 59 75 56 86 56 C94 56 97 63 94 68 C91 74 83 75 74 74 L36 74 C30 74 27 69 29 62 Z" fill={COAT} />
        <ellipse cx="85" cy="67" rx="8" ry="9.5" fill={COAT_DARK} opacity="0.55" />
        <path d="M34 71.5 C44 73.4 66 73.4 76 71.8" fill="none" stroke={COAT_LIGHT} strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />
        {legs.filter((l) => !l.far).map((l, i) => <LegShape key={i} pose={l.pose} far={false} />)}
        {/* くび: かた から ななめ上へ */}
        <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${poll[0]} ${poll[1]}`} fill="none" stroke={COAT} strokeWidth="12" strokeLinecap="round" />
        {/* たてがみの つけね: とまっているとき、くび の うしろがわに そって ねている */}
        <path d={`M${poll[0] + back[0] * 5.5} ${poll[1] + back[1] * 5.5} L${SHOULDER[0] + back[0] * 5.5} ${SHOULDER[1] + back[1] * 5.5}`} fill="none" stroke={MANE} strokeWidth="3.4" strokeLinecap="round" opacity={1 - wind} />
        {/* たてがみ: くび の うしろがわ から はえる */}
        {MANES.map((m) => {
          const base: Pt = [poll[0] + (SHOULDER[0] - poll[0]) * m.u + back[0] * 5.5, poll[1] + (SHOULDER[1] - poll[1]) * m.u + back[1] * 5.5]
          const angle = wave(t, 1.8, m.phase) * 5 * (1 - wind) + MANE_FINAL_ANGLE * wind
          const length = 5 + (m.len - 5) * wind
          const tip: Pt = [base[0] + Math.sin(rad(angle)) * length, base[1] + Math.cos(rad(angle)) * length]
          return <Lock key={m.u} from={base} tip={tip} bend={flutter * wave(t, 0.33, m.phase) * wind} width={5} color={MANE} light={MANE_LIGHT} />
        })}
        {/* あたま: くび の さきに つく。くび と いっしょに まわる */}
        <Layer x={poll[0] - POLL_FINAL[0]} y={poll[1] - POLL_FINAL[1]} rotate={-(neck - NECK_FINAL)} origin={POLL_FINAL}>
          <Head mood={mood} earTilt={earTilt} />
        </Layer>
      </Layer>
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 10)
  // 景色が うしろへ ながれる。はしりだしで はやくなり、とびはねる ころには とまる
  const scroll = 150 * span(t, RUN, FLY + 0.4, easeInOut)
  const cheer = during(t, LIFT + 0.1, LIFT + 1.1, 0.25)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} scroll={scroll} />
        <Dust t={t} />
        <Horse t={t} />
        <Bird t={t} />
        <Notice t={t} />
        {cheer > 0 && (
          <g opacity={cheer}>
            <Star cx={6} cy={14} r={3} color="#ffc233" spin={t * 120} />
            <Star cx={34} cy={8} r={2.4} color="#ff7a4d" spin={-t * 120} />
          </g>
        )}
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
    { at: 0, label: 'ひとりぼっちの 馬が しょんぼり', sound: 'pop' },
    { at: SEE, label: '小鳥の こえに はっと きづく', sound: 'pop' },
    { at: LIFT, label: '顔を上げて にこにこ' },
    { at: RUN, label: '小鳥を おいかけて 走りだす。たてがみが なびく' },
    { at: FLY, label: 'ぴょーんと とびはねる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '馬 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
