/*
 * 夏(なつ): あたまの 上に、おひさまが ぎらぎら。あつい きせつ。
 *
 * ほね(画と絵の対応)
 *   1画目(一)    … 子どもの あたまの 上に ぎらぎら かがやく おひさま
 *   2画目(ノ)    … おひさまの したに ならぶ ひたいの かみ(ちょこんと のびた ひとふさ)
 *   3〜7画目     … 子どもの あたま(かお)。四角く 見える あたまの かたち
 *   8〜10画目    … 子どもの 体と あし(だいたい 同じ 場所)
 *   ※ 字と ぴったり重ならなくても、人の 形が ただしい ことを だいじにした
 *
 * ながれ
 *   子どもが うれしそうに たっている → おひさまが のぼって、あたまの 真上で ぎらぎら
 *   → 子どもは あつくて あせが たらり。ひたいの あせを ぬぐって ふうふう
 *   → うちわを もちあげて ぱたぱた。すこし ほっとする
 *   → ほね が ひかり、絵が うすくなって 字「夏」になる
 *
 * 子どもは、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(ひじは 外がわへ)。くび は みじかく、あたま は どう の まんなか の上。
 *   ひたいを ぬぐうときも、かた → ひじ → 手 の じゅんに つながる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '夏'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#4fb6a8'
const SHIRT_DARK = '#3c9a8d'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const CHEEK = '#ff8f8f'
const MOUTH = '#b9483f'
const EYE = '#2b2b2b'
const SUN = '#ffd24a'
const SUN_DEEP = '#ffb02e'
const SUN_RAY = '#ffc233'
const GRASS = '#c5e8a9'
const HILL = '#e2f2d2'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const SWEAT = '#7cc4f2'
const SWEAT_LIGHT = '#e8f6ff'
const FAN_RED = '#f0627a'
const FAN_LIGHT = '#ffe7ea'
const FAN_STICK = '#c99a5b'
const PETAL = '#ffd24a'
const PETAL_DARK = '#f2b632'
const CORE = '#7a4a2a'

/** くぎり の時間(秒) */
const SUN_ARRIVE = 2.0
/** あつくなる(おひさまが あたまの 真上に きたとき) */
const HOT = 1.9
/** ひたいの あせを ぬぐう */
const WIPE_FROM = 2.7
const WIPE_TO = 4.3
/** うちわを もちあげて ぱたぱた */
const FAN = 4.4
const INK = 6.6
const DONE = 9.4
const DURATION = 10

/** 子どもの ばしょ(あし もと の まんなか) */
const FEET_Y = 95.5
const HEAD_C: readonly [number, number] = [54.5, 43]
const NECK: readonly [number, number] = [54.5, 59]
/** かた の ばしょ(左 = 画面の左) */
const SHOULDER_L: readonly [number, number] = [45.5, 63.5]
const SHOULDER_R: readonly [number, number] = [63.5, 63.5]
/** うで の 1ぶし の長さ(かた → ひじ、ひじ → 手) */
const SEG = 14.5

type Pt = readonly [number, number]

const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/** かた と 手の ばしょ から、ひじ の ばしょを もとめる(ひじ は 体の 外がわへ まがる)。 */
function elbowOf(shoulder: Pt, hand: Pt, side: -1 | 1): { readonly elbow: Pt; readonly hand: Pt } {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const raw = Math.hypot(dx, dy)
  // とどかない ときは、手を すこし ひきよせる
  const d = Math.min(Math.max(raw, 4), SEG * 2 - 0.2)
  const ux = dx / (raw || 1)
  const uy = dy / (raw || 1)
  const reach: Pt = [shoulder[0] + ux * d, shoulder[1] + uy * d]
  const h = Math.sqrt(Math.max(SEG * SEG - (d / 2) ** 2, 0))
  const px = -uy
  const py = ux
  const sign = px * side >= 0 ? 1 : -1
  const mid: Pt = [shoulder[0] + ux * (d / 2), shoulder[1] + uy * (d / 2)]
  return { elbow: [mid[0] + px * h * sign, mid[1] + py * h * sign], hand: reach }
}

/** かた から出て、ひじ で まがる うで。そで は シャツの 色、さきは はだの 色。 */
function Arm({ shoulder, target, side }: { readonly shoulder: Pt; readonly target: Pt; readonly side: -1 | 1 }) {
  const { elbow, hand } = elbowOf(shoulder, target, side)
  // そで: かた から うで の 3わり ぶん くらい
  const sleeve: Pt = lerpPt(shoulder, elbow, 0.45)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={SKIN} strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${shoulder[0]} ${shoulder[1]} L${sleeve[0]} ${sleeve[1]}`} fill="none" stroke={SHIRT_DARK} strokeWidth="7" strokeLinecap="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.4" fill={SKIN} />
    </>
  )
}

/* ───────── うしろの けしき ───────── */

function Ground({ t }: SceneProps) {
  const appear = span(t, 0, 0.5, easeOut)
  return (
    <>
      {/* あつくなると、空が ほんのり きいろく そまる */}
      <rect x="0" y="0" width="109" height="109" fill="#ffe08a" opacity={0.3 * span(t, HOT - 0.4, HOT + 0.8)} />
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 93 V101 H-4 Z" fill={HILL} opacity={appear} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.2} 0)`}>
        <ellipse cx="6" cy="36" rx="7" ry="3.2" />
        <ellipse cx="11" cy="34.2" rx="5" ry="3.2" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} opacity={appear} />
      {[8, 26, 82, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** ひまわり: おひさまの ほうへ からだ を かたむける。 */
function Sunflower({ t }: SceneProps) {
  const grow = span(t, 0.1, 0.8, backOut)
  // おひさまが 近づくほど、左(おひさまの ほう)へ むく
  const lean = mix(t, 0, SUN_ARRIVE, -4, -20)
  const sway = wave(t, 3) * 1.2
  const center: Pt = [93, 62]
  return (
    <Layer scale={grow} origin={[93, 97]}>
      <path d="M93 98 Q94.5 80 93 62" fill="none" stroke={LEAF_DARK} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M93 88 Q86 84 83 87 Q88 91 93 88 Z" fill={LEAF} />
      <path d="M93.4 82 Q100 78 103 81 Q98 85 93.4 82 Z" fill={LEAF} />
      <Layer rotate={lean + sway} origin={[93, 76]}>
        {Array.from({ length: 10 }, (_, i) => (
          <ellipse key={i} cx={center[0]} cy={center[1] - 8.2} rx="2.7" ry="4.4" fill={i % 2 === 0 ? PETAL : PETAL_DARK} transform={`rotate(${i * 36} ${center[0]} ${center[1]})`} />
        ))}
        <circle cx={center[0]} cy={center[1]} r="5.2" fill={CORE} />
        <circle cx={center[0] - 1.3} cy={center[1] - 1.3} r="1.4" fill="#9a6338" />
      </Layer>
    </Layer>
  )
}

/* ───────── おひさま ───────── */

/** ぎらぎらの おひさま: 左ななめ上から のぼって、あたまの 真上で おおきく かがやく。 */
function Sun({ t }: SceneProps) {
  const rise = span(t, 0, SUN_ARRIVE, easeInOut)
  const cx = 88 + (54.5 - 88) * rise
  const cy = 9 + (14.5 - 9) * rise
  // ついた しゅんかん ぽん と ふくらんで、そのあと どくどく かがやく
  const pop = Math.sin(span(t, SUN_ARRIVE - 0.2, SUN_ARRIVE + 0.5) * Math.PI) * 1.6
  const r = 5.5 + 4.8 * rise + pop + Math.max(wave(t, 0.9), 0) * 0.5 * span(t, SUN_ARRIVE, SUN_ARRIVE + 0.4)
  const hot = span(t, HOT - 0.4, HOT + 0.6)
  return (
    <>
      {/* ひかりの わ: 近づくほど あつさが ひろがる */}
      <circle cx={cx} cy={cy} r={r + 7 + hot * 4} fill={SUN} opacity={0.18 + 0.1 * hot} />
      <circle cx={cx} cy={cy} r={r + 3.6} fill={SUN} opacity={0.3} />
      <Layer rotate={t * 16} origin={[cx, cy]}>
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={cx - 1.1} y={cy - r - 6.4 - hot * 1.6} width="2.2" height={4.2 + hot * 1.6} rx="1.1" fill={SUN_RAY} transform={`rotate(${i * 30} ${cx} ${cy})`} />
        ))}
      </Layer>
      <circle cx={cx} cy={cy} r={r} fill={SUN_DEEP} />
      <circle cx={cx - 0.6} cy={cy - 0.6} r={Math.max(r - 1.6, 0)} fill={SUN} />
      {/* ぎらぎら: ひかりの ほし が ちかちか */}
      <Star cx={cx - r - 1} cy={cy - r * 0.5} r={2.2 + Math.max(wave(t, 0.6), 0) * 1.6} color="#ffffff" spin={t * 60} />
      <Star cx={cx + r + 0.5} cy={cy + r * 0.2} r={1.8 + Math.max(wave(t, 0.6, 0.3), 0) * 1.4} color="#ffffff" spin={-t * 50} />
    </>
  )
}

/** もわもわ ゆらぐ ねつ(かげろう)。あつい とき だけ のぼる。 */
function HeatShimmer({ t }: SceneProps) {
  const show = during(t, HOT + 0.3, INK - 0.1, 0.5) * 0.55
  if (show <= 0) return null
  const line = (baseX: number, phase: number) => {
    const points = Array.from({ length: 11 }, (_, i) => {
      const y = 92 - i * 3.4
      return `${i === 0 ? 'M' : 'L'}${(baseX + Math.sin(y * 0.45 - t * 4 + phase) * 1.7).toFixed(2)} ${y.toFixed(2)}`
    })
    return <path key={baseX} d={points.join(' ')} fill="none" stroke="#ff9f43" strokeWidth="1.1" strokeLinecap="round" />
  }
  return (
    <g opacity={show}>
      {line(12, 0)}
      {line(24, 1.6)}
      {line(83, 0.8)}
    </g>
  )
}

/* ───────── 主役の 子ども ───────── */

type Mood = 'happy' | 'hot' | 'relief'

/** かお。あつい ときは まゆ が さがって 口が あく(はぁはぁ)。ほっと する ときは 目を とじて えがお。 */
function Face({ mood, pant }: { readonly mood: Mood; readonly pant: number }) {
  const [hx, hy] = HEAD_C
  const eyeY = hy + 1.5
  return (
    <>
      <circle cx={hx - 11} cy={hy + 8} r="3.1" fill={CHEEK} opacity={mood === 'hot' ? 0.85 : 0.5} />
      <circle cx={hx + 11} cy={hy + 8} r="3.1" fill={CHEEK} opacity={mood === 'hot' ? 0.85 : 0.5} />
      {mood === 'happy' && (
        <>
          <circle cx={hx - 6.5} cy={eyeY} r="1.7" fill={EYE} />
          <circle cx={hx + 6.5} cy={eyeY} r="1.7" fill={EYE} />
          <path d={`M${hx - 4.2} ${hy + 8} Q${hx} ${hy + 12.6} ${hx + 4.2} ${hy + 8}`} fill="none" stroke={MOUTH} strokeWidth="1.3" strokeLinecap="round" />
        </>
      )}
      {mood === 'hot' && (
        <>
          <path d={`M${hx - 9.6} ${eyeY - 2.4} L${hx - 3.8} ${eyeY - 4.4} M${hx + 9.6} ${eyeY - 2.4} L${hx + 3.8} ${eyeY - 4.4}`} stroke={HAIR} strokeWidth="1.3" strokeLinecap="round" />
          <circle cx={hx - 6.5} cy={eyeY + 0.4} r="1.5" fill={EYE} />
          <circle cx={hx + 6.5} cy={eyeY + 0.4} r="1.5" fill={EYE} />
          <ellipse cx={hx} cy={hy + 9.6} rx="3.2" ry={2.2 + pant * 1.3} fill={MOUTH} />
          <ellipse cx={hx} cy={hy + 10.6 + pant * 0.5} rx="1.8" ry="0.9" fill="#ff8a8a" />
        </>
      )}
      {mood === 'relief' && (
        <>
          <path d={`M${hx - 9} ${eyeY + 1} Q${hx - 6.5} ${eyeY - 2} ${hx - 4} ${eyeY + 1} M${hx + 4} ${eyeY + 1} Q${hx + 6.5} ${eyeY - 2} ${hx + 9} ${eyeY + 1}`} fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          <path d={`M${hx - 3.6} ${hy + 8.4} Q${hx} ${hy + 11.6} ${hx + 3.6} ${hy + 8.4}`} fill="none" stroke={MOUTH} strokeWidth="1.3" strokeLinecap="round" />
        </>
      )}
    </>
  )
}

function Head({ mood, pant, tilt }: { readonly mood: Mood; readonly pant: number; readonly tilt: number }) {
  const [hx, hy] = HEAD_C
  return (
    <Layer rotate={tilt} origin={NECK}>
      {/* くび: みじかく、あたま の したに すこし 見える */}
      <rect x={hx - 3.2} y={hy + 12} width="6.4" height="7" rx="2.4" fill={SKIN_SHADE} />
      <circle cx={hx - 18.6} cy={hy + 1.6} r="3.3" fill={SKIN} />
      <circle cx={hx + 18.6} cy={hy + 1.6} r="3.3" fill={SKIN} />
      <ellipse cx={hx} cy={hy} rx="19" ry="16.4" fill={SKIN} />
      {/* かみ: あたま の うえ を おおう。ひとふさ だけ ひたい に たれる */}
      <path d={`M${hx - 19} ${hy - 1.6} C${hx - 21} ${hy - 17} ${hx - 9} ${hy - 19} ${hx} ${hy - 18.6} C${hx + 10} ${hy - 19} ${hx + 21} ${hy - 16} ${hx + 19} ${hy - 1.6} C${hx + 15} ${hy - 9} ${hx + 8} ${hy - 11.6} ${hx} ${hy - 11.6} C${hx - 8} ${hy - 11.6} ${hx - 14} ${hy - 9} ${hx - 19} ${hy - 1.6} Z`} fill={HAIR} />
      <path d={`M${hx - 4.2} ${hy - 11.4} Q${hx - 2.8} ${hy - 6.2} ${hx - 5.8} ${hy - 4.4} Q${hx - 6.4} ${hy - 8.2} ${hx - 8.4} ${hy - 10.4} Z`} fill={HAIR} />
      <Face mood={mood} pant={pant} />
    </Layer>
  )
}

/** うちわ(手が 原点。うちわの まるい 所は 上) */
function Fan() {
  return (
    <>
      <rect x="-1" y="-7" width="2" height="8" rx="1" fill={FAN_STICK} />
      <circle cx="0" cy="-14" r="8.2" fill={FAN_RED} />
      <circle cx="0" cy="-14" r="4.6" fill={FAN_LIGHT} />
    </>
  )
}

type ChildProps = {
  readonly t: number
  readonly mood: Mood
}

function Child({ t, mood }: ChildProps) {
  // 出てくる: ぽん と はねて あらわれる
  const entrance = span(t, 0.2, 0.8, backOut)
  const hotAmt = span(t, HOT, HOT + 0.6)
  const relief = span(t, FAN + 0.3, FAN + 1.0)
  // あつくて ぐったり: からだ が すこし ちぢみ、あたま が さがる。ほっと すると もどる
  const slump = hotAmt * (1 - relief * 0.7)
  const pant = mood === 'hot' ? Math.max(wave(t, 0.55), 0) : 0
  const breath = wave(t, 2.2) * 0.012
  const headTilt = mood === 'happy' ? wave(t, 1.6) * 1.2 : mood === 'hot' ? -5 * slump + wave(t, 0.55) * 1.4 : 2
  const headDrop = slump * 1.6

  // ひだりうで: ひたいを ぬぐう
  const wipe = span(t, WIPE_FROM, WIPE_FROM + 0.5, easeOut) * (1 - span(t, WIPE_TO - 0.4, WIPE_TO, easeInOut))
  const hangL: Pt = [43, 91.5]
  const wipeSpot: Pt = [47 + wave(t, 0.55) * 5, 34.5 + headDrop * 0.6]
  const handL = lerpPt(hangL, wipeSpot, wipe)

  // みぎうで: うちわを もつ。ぱたぱた あおぐ
  const raise = span(t, FAN - 0.4, FAN + 0.3, easeInOut)
  const hangR: Pt = [66.5, 87]
  const fanSpot: Pt = [75, 59]
  const handR = lerpPt(hangR, fanSpot, raise)
  const flutter = raise >= 1 ? wave(t, 0.3) * 14 : 0
  const fanAngle = mix(t, FAN - 0.4, FAN + 0.3, 155, 0, easeInOut) + flutter
  const handRPt = elbowOf(SHOULDER_R, handR, 1).hand

  return (
    <Layer scale={entrance} origin={[54.5, FEET_Y]}>
      <Layer scaleY={1 - slump * 0.03 + breath} origin={[54.5, FEET_Y]}>
        {/* あし */}
        <rect x="46.8" y="76" width="5.8" height="19" rx="2.9" fill={SKIN} />
        <rect x="56.4" y="76" width="5.8" height="19" rx="2.9" fill={SKIN} />
        <ellipse cx="49.4" cy={FEET_Y} rx="5" ry="2.6" fill={SHOE} />
        <ellipse cx="59.6" cy={FEET_Y} rx="5" ry="2.6" fill={SHOE} />
        {/* どう: かたはば より すこし せまい */}
        <rect x="44" y="59" width="21" height="20" rx="8" fill={SHIRT} />
        <rect x="44.4" y="73.6" width="20.2" height="9" rx="4" fill={PANTS} />
        <path d="M46.6 69 h16" stroke={SHIRT_DARK} strokeWidth="1.5" strokeLinecap="round" />
        {/* うで(かた から ひじ を とおって 手) */}
        <Arm shoulder={SHOULDER_L} target={handL} side={-1} />
        <Arm shoulder={SHOULDER_R} target={handR} side={1} />
        <Layer x={handRPt[0]} y={handRPt[1]} rotate={fanAngle}>
          <Fan />
        </Layer>
        <Layer y={headDrop}>
          <Head mood={mood} pant={pant} tilt={headTilt} />
        </Layer>
      </Layer>
    </Layer>
  )
}

/** あつくて たれる あせ。こめかみ から ほほ へ。 */
function Sweat({ t }: SceneProps) {
  const show = during(t, HOT + 0.1, FAN + 1.2, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[
        { x: 34.6, offset: 0, dir: -1 },
        { x: 74.6, offset: 0.45, dir: 1 },
        { x: 36.6, offset: 0.9, dir: -1 },
      ].map(({ x, offset, dir }) => {
        const p = ((t + offset) % 1.3) / 1.3
        const size = 1 + 0.3 * Math.sin(p * Math.PI)
        return <path key={offset} d="M0 -2.6 Q2.2 0.6 0 2.2 Q-2.2 0.6 0 -2.6 Z" fill={SWEAT} stroke={SWEAT_LIGHT} strokeWidth="0.4" transform={`translate(${x + dir * p * 2.2} ${36 + p * 22}) scale(${size})`} opacity={1 - p ** 3} />
      })}
    </g>
  )
}

/** ふうふう: あついときの いきが 口から でる。 */
function Puff({ t }: SceneProps) {
  const show = during(t, HOT + 0.5, WIPE_TO, 0.3)
  if (show <= 0) return null
  const p = ((t * 1.1) % 1)
  return (
    <g opacity={show * (1 - p)}>
      <ellipse cx={54.5 - p * 4} cy={63 + p * 3} rx={2 + p * 2.4} ry={1.4 + p * 1.4} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
    </g>
  )
}

/** うちわの かぜ。かお の ほうへ すうっと ながれる。 */
function Wind({ t }: SceneProps) {
  const show = during(t, FAN + 0.5, INK - 0.1, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show} fill="none" stroke="#8fd0f5" strokeWidth="1.1" strokeLinecap="round">
      {[0, 1, 2].map((i) => {
        const p = (((t * 1.6 + i / 3) % 1) + 1) % 1
        const y = 46 + i * 5
        return <path key={i} d={`M${68 - p * 12} ${y} q-3 -1.4 -6 0`} opacity={Math.sin(p * Math.PI)} />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 10)
  const mood: Mood = t < HOT ? 'happy' : t < FAN + 0.3 ? 'hot' : 'relief'
  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Sunflower t={t} />
        <HeatShimmer t={t} />
        {/* かげ: おひさまが 真上なので、足もとに 小さく */}
        <ellipse cx="54.5" cy="97.4" rx={7 + 4 * span(t, 0, SUN_ARRIVE)} ry="2" fill="#000000" opacity="0.13" />
        <Child t={t} mood={mood} />
        <Sweat t={t} />
        <Puff t={t} />
        <Wind t={t} />
        <Sun t={t} />
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
    { at: 0, label: '子どもが にこにこ。おひさまが のぼる', sound: 'pop' },
    { at: HOT, label: 'あたまの 上で ぎらぎら。あつくて あせが たらり', sound: 'pop' },
    { at: WIPE_FROM, label: 'ひたいの あせを ぬぐう。ふうふう' },
    { at: FAN, label: 'うちわで ぱたぱた。ほっと する' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '夏 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
