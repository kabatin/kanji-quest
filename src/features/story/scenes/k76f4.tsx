/*
 * 直(なおす): 目で まっすぐ 見て、ななめに なった たなを まっすぐに 直す。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … てっぺんに たてた 十字の かざり の よこぼう
 *   2画目(丨)  … 十字の かざり の たてぼう(たなの 上に さしてある)
 *   3画目(丨)  … たなの 左の かべ
 *   4画目(𠃍)  … たなの 天ばん と 右の かべ(子が おして 直す ところ)
 *   5・6・7画目 … たなの 3まいの いた(本・はち・つみき が のっている)
 *   8画目(L)   … ゆかに おいてある L字の さしがね(まっすぐ を はかる どうぐ)
 *
 * ながれ
 *   さしがねが ゆかに おいてあり、たなが ぽん と できる。たなは ななめに かたむいている
 *   → 子が あるいてきて、たなを じーっと 見る。「あれ?」と 首を かしげる(目で 見くらべる)
 *   → 「そうだ!」と ひらめいて、右がわを ぐいっと おす → たなが まっすぐに もどる
 *   → 子は よろこんで ぴょん。さしがねと たなが 「直」の形に そろって、字になる
 *
 * たなは「ななめ」を、体を ゆがめず 本ものの つくり で 見せる:
 *   ゆかに あしが ついたまま、上のほうが よこへ ずれる(ほんものの がたついた たなと おなじ)。
 *   子は 目が あたまの よこに あり、うで は かた → ひじ → 手 と つながる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '直'

const WALL = '#fdf3df'
const FLOOR = '#e6c79a'
const FLOOR_LINE = '#d9b888'
const SUN = '#ffd24a'
const GLASS = '#cdeafc'
const FRAME = '#a77b52'
const STEEL = '#b4c0cf'
const STEEL_LIGHT = '#e6edf5'
const STEEL_MARK = '#7d8ca0'
const WOOD = '#c98a4e'
const WOOD_DARK = '#a86d38'
const WOOD_LIGHT = '#e2a868'
const BACK = '#f6e3c3'
const RIBBON = '#e8534a'
const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#f2a03d'
const SHIRT_DARK = '#d9892a'
const SHIRT_FAR = '#bd7522'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'

/** くぎり の時間(秒) */
const WALK_IN = 1.0
const ARRIVE = 2.4
const THINK = 3.0
const IDEA = 4.2
const PUSH = 4.6
const STRAIGHT = 5.5
const INK = 6.5
const DONE = 9.2
const DURATION = 10

/** たなの かたむき(上へ いくほど よこへ ずれる 割合)。0.2 = 11度ほど */
const LEAN = 0.2
/** ゆかの 高さ(たなの あしの 先)。たなは ここで ゆかに ついている */
const FLOOR_Y = 92
/** 十字の かざり の さし口(たなの 天ばんの 上) */
const PEG: readonly [number, number] = [56, 38]

/* ───────── 子の からだ(体は 左むき。ほんものの つくり を守る) ───────── */

const SHOULDER: readonly [number, number] = [95.2, 70]
const SHOULDER_FAR: readonly [number, number] = [100.2, 70]
const UPPER = 10.5
const FORE = 10
/** 子が ゆかに立つ 高さ(てまえ なので、さしがね より 下) */
const GROUND = 99.5
const HEAD: readonly [number, number] = [98, 56]
const NECK: readonly [number, number] = [98, 64]
/** おしている 手の 高さ と、たなの 右がわ に そえる 位置(たなが 0.2 かたむいた とき) */
const PUSH_Y = 62
const EDGE_X = 78.6

type Pt = readonly [number, number]
const lerpPt = (a: Pt, b: Pt, u: number): Pt => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]

/** かた と 手の 場所から、ひじ の場所を 出す(ひじ は 下がわへ まがる)。手が とどかない ときは のばしきる */
function reach(shoulder: Pt, target: Pt): { elbow: Pt; hand: Pt } {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const far = Math.hypot(dx, dy) || 0.01
  const d = Math.min(Math.max(far, Math.abs(UPPER - FORE) + 0.5), UPPER + FORE - 0.3)
  const ux = dx / far
  const uy = dy / far
  const a = (UPPER * UPPER - FORE * FORE + d * d) / (2 * d)
  const h = Math.sqrt(Math.max(0, UPPER * UPPER - a * a))
  // ひじ の まがる 向き: 下がわ(下が ないときは 右 = うしろ)
  const down = ux > 0 ? 1 : -1
  const sign = Math.abs(ux) < 0.001 ? 1 : down
  const elbow: Pt = [shoulder[0] + ux * a + -uy * h * sign, shoulder[1] + uy * a + ux * h * sign]
  const hand: Pt = [shoulder[0] + ux * d, shoulder[1] + uy * d]
  return { elbow, hand }
}

function Arm({ shoulder, target, sleeve }: { readonly shoulder: Pt; readonly target: Pt; readonly sleeve: string }) {
  const { elbow, hand } = reach(shoulder, target)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]}`} stroke={sleeve} strokeWidth="5.6" strokeLinecap="round" fill="none" />
      <path d={`M${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} stroke={SKIN} strokeWidth="4.2" strokeLinecap="round" fill="none" />
      <circle cx={hand[0]} cy={hand[1]} r="2.9" fill={SKIN} />
    </>
  )
}

type Mood = 'cheery' | 'puzzled' | 'idea' | 'effort' | 'glad'

/** あたま。目は 1つ(よこむき)。気持ちで 目・まゆ・口を かえる */
function Head({ mood, tilt }: { readonly mood: Mood; readonly tilt: number }) {
  return (
    <Layer rotate={tilt} origin={NECK}>
      <g transform={`translate(${HEAD[0]} ${HEAD[1]}) scale(0.9) translate(-30.2 -24.6)`}>
        <circle cx="30.2" cy="24.6" r="9.2" fill={SKIN} />
        <path d="M21.5 23 C21.4 13.8 31.8 11.2 37.8 17 C40.2 20.2 40.2 26 38.2 30.2 C37.6 24.4 33.4 20.2 26.6 20.6 C24.4 20.8 22.6 21.8 21.5 23 Z" fill={HAIR} />
        <circle cx="26.2" cy="28.8" r="2.1" fill="#ff9d9d" opacity="0.55" />
        {mood === 'cheery' || mood === 'glad' ? (
          <>
            <path d="M23.8 26 Q25.4 23.6 27 26" fill="none" stroke="#2b2b2b" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M23 29.6 Q24.8 32 27 30" fill="none" stroke="#b9483f" strokeWidth="1.3" strokeLinecap="round" />
          </>
        ) : null}
        {mood === 'puzzled' ? (
          <>
            <path d="M23 22.6 l3.6 -1.2" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="25.2" cy="25.4" r="1.2" fill="#2b2b2b" />
            <path d="M23.2 30.6 q1.1 -1.1 2.2 0 q1.1 1.1 2.2 0" fill="none" stroke="#b9483f" strokeWidth="1.1" strokeLinecap="round" />
          </>
        ) : null}
        {mood === 'idea' ? (
          <>
            <path d="M23.2 21.8 l3.2 -0.8" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="25.2" cy="25" r="1.6" fill="#2b2b2b" />
            <circle cx="24.7" cy="24.4" r="0.5" fill="#ffffff" />
            <ellipse cx="24.6" cy="30.4" rx="1.4" ry="1.8" fill="#b9483f" />
          </>
        ) : null}
        {mood === 'effort' ? (
          <>
            <path d="M23.4 23.8 l3 1.4 l-3 1.4" fill="none" stroke="#2b2b2b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M23 29.8 h3.6" stroke="#b9483f" strokeWidth="1.3" strokeLinecap="round" />
          </>
        ) : null}
      </g>
    </Layer>
  )
}

type KidProps = {
  readonly mood: Mood
  readonly tilt: number
  /** てまえの うで・むこうの うで の 手の 場所 */
  readonly nearHand: Pt
  readonly farHand: Pt
  readonly step: number
}

function Kid({ mood, tilt, nearHand, farHand, step }: KidProps) {
  return (
    <>
      <Arm shoulder={SHOULDER_FAR} target={farHand} sleeve={SHIRT_FAR} />
      <Layer rotate={step * 17} origin={[98, 83]}>
        <rect x="98.6" y="82" width="5.6" height="14.5" rx="2.8" fill={PANTS_DARK} />
        <ellipse cx="100.4" cy="97.4" rx="4.8" ry="2.4" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 17} origin={[98, 83]}>
        <rect x="92.8" y="82" width="5.6" height="14.5" rx="2.8" fill={PANTS} />
        <ellipse cx="94.4" cy="97.4" rx="4.8" ry="2.4" fill={SHOE} />
      </Layer>
      <rect x="95.6" y="61.5" width="4.8" height="6" rx="2" fill={SKIN_SHADE} />
      <rect x="91.8" y="65.6" width="12.4" height="19" rx="6" fill={SHIRT} />
      <path d="M93.6 80.4 h8.8" stroke={SHIRT_DARK} strokeWidth="1.4" strokeLinecap="round" />
      <Arm shoulder={SHOULDER} target={nearHand} sleeve={SHIRT_DARK} />
      <Head mood={mood} tilt={tilt} />
    </>
  )
}

/* ───────── へや・さしがね ───────── */

/** さしがね(8画目)の 下のうでの 中心の 高さ(画の線の すじ から) */
function squareY(x: number): number {
  const pts: ReadonlyArray<Pt> = [[26.4, 94.8], [43.4, 93], [60.3, 91.9], [77.4, 91.3], [94.2, 92.5]]
  const i = pts.findIndex((p) => x <= p[0])
  if (i <= 0) return pts[0][1]
  const [x0, y0] = pts[i - 1]
  const [x1, y1] = pts[i]
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
}

function Room({ t }: SceneProps) {
  const fade = span(t, 0, 0.5, easeOut)
  return (
    <Layer opacity={fade}>
      <rect x="0" y="0" width="109" height="96" fill={WALL} />
      <rect x="0" y="95" width="109" height="14" fill={FLOOR} />
      <path d="M0 103 H109 M0 108 H109" stroke={FLOOR_LINE} strokeWidth="0.6" />
      {/* まどと お日さま(まどの そとで ゆっくり まわる) */}
      <rect x="2" y="3" width="18" height="18" rx="2" fill={FRAME} />
      <rect x="3.6" y="4.6" width="14.8" height="14.8" rx="1" fill={GLASS} />
      <Layer rotate={t * 14} origin={[11, 11]}>
        {Array.from({ length: 6 }, (_, i) => (
          <rect key={i} x="10.4" y="5.4" width="1.2" height="2" rx="0.6" fill={SUN} transform={`rotate(${i * 60} 11 11)`} />
        ))}
      </Layer>
      <circle cx="11" cy="11" r="2.8" fill={SUN} />
      <rect x="10.6" y="4.6" width="0.8" height="14.8" fill={FRAME} />
      <rect x="3.6" y="10.6" width="14.8" height="0.8" fill={FRAME} />
    </Layer>
  )
}

/** さしがね: ゆかに おいた L字の ものさし。たなが 「まっすぐ」かを くらべる もと */
function Square({ t }: SceneProps) {
  const grow = span(t, 0.1, 0.9, easeOut)
  if (grow <= 0) return null
  const ticks = [30, 37, 44, 51, 58, 65, 72, 79, 86]
  return (
    <>
      <Bone char={CHAR} n={8} color={STEEL} width={4.6} to={grow} />
      <Bone char={CHAR} n={8} color={STEEL_LIGHT} width={1.2} to={grow} />
      {grow >= 1 ? (
        <g stroke={STEEL_MARK} strokeWidth="0.55" strokeLinecap="round">
          {ticks.map((x) => (
            <path key={x} d={`M${x} ${squareY(x) - 0.6} v1.8`} />
          ))}
          {[58, 64, 70, 76, 82].map((y) => (
            <path key={y} d={`M19.2 ${y} h1.8`} />
          ))}
        </g>
      ) : null}
    </>
  )
}

/* ───────── たな ───────── */

/** たな(3〜7画目)。あしは ゆかに ついたまま、上が よこへ ずれる */
function Shelf({ lean, rise }: { readonly lean: number; readonly rise: number }) {
  // x' = x + lean * (FLOOR_Y - y): ゆか(FLOOR_Y)の高さは うごかず、上ほど よこへ ずれる
  const skew = `matrix(1 0 ${-lean} 1 ${lean * FLOOR_Y} 0)`
  return (
    <Layer scaleY={rise} scaleX={0.7 + 0.3 * rise} origin={[56, FLOOR_Y + 2]}>
      <g transform={skew}>
        <rect x="38" y="40" width="36.6" height="40" fill={BACK} />
        <rect x="38" y="40" width="36.6" height="11" fill="#efd8b0" />
        {/* 上の だん: 本 */}
        <rect x="44" y="45.4" width="14" height="4.2" rx="0.8" fill="#4f9be0" />
        <rect x="46" y="41.6" width="12" height="3.8" rx="0.8" fill="#e8534a" />
        {/* まんなかの だん: はちうえ */}
        <path d="M49 58.6 h8 l-1 4.2 h-6 Z" fill="#d9764a" />
        <path d="M53 58.6 v-3.6" stroke="#3f9c59" strokeWidth="1" strokeLinecap="round" />
        <ellipse cx="50.6" cy="55.4" rx="2.8" ry="1.4" fill="#55b86e" transform="rotate(-25 50.6 55.4)" />
        <ellipse cx="55.6" cy="54.6" rx="2.8" ry="1.4" fill="#3f9c59" transform="rotate(25 55.6 54.6)" />
        {/* 下の だん: ボール と つみき */}
        <circle cx="48" cy="72.4" r="5" fill="#e8534a" />
        <path d="M44.6 70.4 Q48 68.6 51.4 70.4" fill="none" stroke="#f5958d" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="62" y="70" width="8" height="8" rx="1" fill="#55b86e" />
        {/* あし */}
        <rect x="36.5" y="80" width="3.6" height="12" fill={WOOD_DARK} />
        <rect x="72.7" y="80" width="3.6" height="12" fill={WOOD_DARK} />
        {[3, 4, 5, 6, 7].map((n) => (
          <g key={n}>
            <g transform="translate(0 0.9)">
              <Bone char={CHAR} n={n} color={WOOD_DARK} width={n <= 4 ? 4.4 : 3.4} />
            </g>
            <Bone char={CHAR} n={n} color={WOOD} width={n <= 4 ? 4.4 : 3.4} />
          </g>
        ))}
      </g>
    </Layer>
  )
}

/** 十字の かざり(1・2画目)。たなの 上に さしてあるので、たなと いっしょに かたむく */
function Cross({ lean, rise }: { readonly lean: number; readonly rise: number }) {
  const angle = (Math.atan(lean) * 180) / Math.PI
  const shift = lean * (FLOOR_Y - PEG[1])
  return (
    <Layer x={shift} y={(1 - rise) * 50} opacity={Math.min(1, rise * 3)}>
      <Layer rotate={angle} origin={PEG}>
        <Bone char={CHAR} n={2} color={WOOD_LIGHT} width={3.6} />
        <Bone char={CHAR} n={1} color={WOOD_LIGHT} width={3.4} />
        {/* まんなかに むすんだ リボン */}
        <path d="M55.8 26.4 l-4 -2.2 v4.4 Z M55.8 26.4 l4 -2.2 v4.4 Z" fill={RIBBON} />
        <circle cx="55.8" cy="26.4" r="1.5" fill="#c9433b" />
      </Layer>
    </Layer>
  )
}

/* ───────── にぎやかし ───────── */

/** 「あれ?」の しるし(線だけで かく。文字は つかわない) */
function Question({ t }: SceneProps) {
  const show = during(t, ARRIVE + 0.1, IDEA - 0.1, 0.3)
  if (show <= 0) return null
  const pop = span(t, ARRIVE + 0.1, ARRIVE + 0.5, backOut)
  return (
    <Layer x={88.5} y={42 + wave(t, 1.2) * 0.8} scale={Math.max(0, pop)} opacity={show} origin={[0, 0]}>
      <path d="M-2.8 -2.4 Q-2.8 -5.6 0 -5.6 Q3 -5.6 3 -3 Q3 -1.2 0.8 0 Q-0.2 0.7 -0.2 2.2" fill="none" stroke="#5f7fd6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="-0.2" cy="4.6" r="1" fill="#5f7fd6" />
    </Layer>
  )
}

/** 「そうだ!」の しるし */
function Bang({ t }: SceneProps) {
  const show = during(t, IDEA, PUSH + 0.15, 0.15)
  if (show <= 0) return null
  const pop = span(t, IDEA, IDEA + 0.3, backOut)
  return (
    <Layer x={88.5} y={41} scale={Math.max(0, pop)} opacity={show}>
      <path d="M0 -6 V0.6" stroke="#f0a020" strokeWidth="2" strokeLinecap="round" />
      <circle cx="0" cy="4.2" r="1.1" fill="#f0a020" />
    </Layer>
  )
}

/** 目で 見くらべる ときの 3本の 線(目の まえ) */
function Gaze({ t, x }: { readonly t: number; readonly x: number }) {
  const show = during(t, ARRIVE + 0.2, IDEA - 0.2, 0.3) * (0.6 + 0.4 * Math.abs(wave(t, 0.9)))
  if (show <= 0) return null
  return (
    <g opacity={show} stroke="#9a7a55" strokeWidth="0.9" strokeLinecap="round" transform={`translate(${x} 0)`}>
      <path d="M89.4 54.4 l-3 -1.4 M89 57 l-3.6 0 M89.4 59.6 l-3 1.4" />
    </g>
  )
}

/** おすときの ほこり(たなの あしもとから ふわっと) */
function Dust({ t }: SceneProps) {
  const p = span(t, PUSH + 0.1, STRAIGHT + 0.3)
  if (p <= 0 || p >= 1) return null
  return (
    <>
      {[0, 1].map((i) => (
        <circle key={i} cx={80 + i * 5 + p * 6} cy={93.4 - p * 3 - i * 1.4} r={1.6 + p * 2.4} fill="#ffffff" opacity={(1 - p) * 0.8} />
      ))}
    </>
  )
}

/** まっすぐに なった しゅんかん の きらっ */
function Gleam({ t }: SceneProps) {
  const show = during(t, STRAIGHT - 0.1, STRAIGHT + 0.6, 0.15)
  if (show <= 0) return null
  const spin = (t - STRAIGHT) * 200
  return (
    <g opacity={show}>
      <Star cx={85} cy={36} r={3.2} color="#ffd95a" spin={spin} />
      <Star cx={28} cy={46} r={2.4} color="#ffffff" spin={-spin} />
    </g>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)

  // たな: ぽん と できて ななめ → ぐいっと おされて まっすぐ(すこし ゆれもどる)
  const rise = span(t, 0.5, 1.2, backOut)
  const creak = during(t, 1.4, PUSH - 0.1, 0.4) * 0.012 * wave(t, 0.8)
  const push = span(t, PUSH, STRAIGHT, backOut)
  const settle = t > STRAIGHT && t < INK - 0.3 ? 0.012 * Math.exp(-(t - STRAIGHT) * 5) * Math.sin((t - STRAIGHT) * 16) : 0
  const lean = LEAN * (1 - push) + creak + settle

  // 子: あるいてくる → たちどまる → おしながら たなの 右がわに ついていく
  const walkX = mix(t, WALK_IN, ARRIVE, 56, 0, easeOut)
  const dx = -30 * LEAN * push
  const walking = t >= WALK_IN && t < ARRIVE
  const pushing = t >= PUSH && t < STRAIGHT + 0.1
  const step = walking ? Math.sin((t - WALK_IN) * Math.PI * 3.6) * (1 - span(t, ARRIVE - 0.3, ARRIVE)) : pushing ? Math.sin((t - PUSH) * Math.PI * 4) * 0.5 : 0
  const hop = t > STRAIGHT + 0.3 && t < INK ? -Math.abs(Math.sin((t - STRAIGHT - 0.3) * Math.PI * 1.6)) * 3.2 : 0
  const bob = walking ? -Math.abs(step) * 1.4 : hop

  const hang: Pt = [SHOULDER[0] - step * 5.5, 89.5]
  const chin: Pt = [91.4, 63.6]
  const edge: Pt = [EDGE_X + 30 * lean - dx, PUSH_Y]
  const cheer: Pt = [84.5, 55]
  let near = lerpPt(hang, chin, span(t, ARRIVE + 0.1, THINK, easeInOut))
  near = lerpPt(near, edge, span(t, IDEA + 0.2, PUSH, easeInOut))
  near = lerpPt(near, cheer, span(t, STRAIGHT + 0.1, STRAIGHT + 0.6, backOut))
  const farHang: Pt = [SHOULDER_FAR[0] + step * 5.5, 89.5]
  const far = lerpPt(farHang, [104, 52], span(t, STRAIGHT + 0.15, STRAIGHT + 0.65, backOut))

  const mood: Mood = t < ARRIVE ? 'cheery' : t < IDEA ? 'puzzled' : t < PUSH ? 'idea' : t < STRAIGHT ? 'effort' : 'glad'
  // くびを かしげて、ななめを 見くらべる
  const tilt = during(t, ARRIVE + 0.2, IDEA - 0.1, 0.3) * 8 * wave(t - ARRIVE, 1.8) + (t >= PUSH && t < STRAIGHT ? -4 : 0)
  const kidX = walkX + dx

  return (
    <>
      <Layer opacity={ink.picture}>
        <Room t={t} />
        <Square t={t} />
        <ellipse cx="56" cy="95.6" rx={20 * Math.min(1, rise)} ry="2" fill="#000000" opacity="0.1" />
        <Shelf lean={lean} rise={rise} />
        <Cross lean={lean} rise={rise} />
        <Dust t={t} />
        <Layer opacity={span(t, WALK_IN - 0.1, WALK_IN + 0.1)}>
          <ellipse cx={98 + kidX} cy={GROUND} rx="9" ry="2.2" fill="#000000" opacity="0.12" />
          <Layer x={kidX} y={bob}>
            <Kid mood={mood} tilt={tilt} nearHand={near} farHand={far} step={step} />
            <Gaze t={t} x={0} />
            <Question t={t} />
            <Bang t={t} />
          </Layer>
        </Layer>
        <Gleam t={t} />
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
    { at: 0, label: 'さしがねが ゆかに あり、たなが できる', sound: 'pop' },
    { at: WALK_IN, label: '子が あるいてくる' },
    { at: ARRIVE, label: 'たなが ななめ。「あれ?」と 見くらべる', sound: 'pop' },
    { at: IDEA, label: '「そうだ!」ぐいっと おして まっすぐに 直す' },
    { at: STRAIGHT, label: 'まっすぐ になって 子が よろこぶ', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '直 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
