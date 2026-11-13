/*
 * 風(かぜ): ふねの ほ(帆)が かぜを うけて ふくらむ。ほの なかに、むしが いっぴき。
 *
 * ほね(画と絵の対応)
 *   1画目(丿)   … ふねの マスト(はしら)。すこし まえに かたむいた はしら
 *   2画目(几)   … ほの うえの ふち と、かぜを うけて ふくらんだ ほの ふち(右がわ)
 *   3画目(ノ)   … ふくらんだ ほに できる おおきな しわ(ひだ)
 *   4〜6画目    … てんとうむしの はね(まるい せなか)
 *   7画目(丨)   … てんとうむしの せなかの まんなかの せんと、あたま
 *   8・9画目    … てんとうむしの あし(しっかり つかまっている)
 *   (むしの 形は、字と ぴったりは かさならない。だいたい 同じ ばしょ・同じ むき)
 *
 * ながれ
 *   うみに ふねが うかぶ → ほが だらりと たれて、てんとうむしが のっている(かぜが なくて たいくつ。あせ・ふう)
 *   → かぜが ビューッと ふいてくる(はたが ゆれる・むしは びっくり して ぎゅっと つかまる)
 *   → ほが ぷくーっと ふくらみ、ふねが すすむ(なみが ながれる)→ むしは おおよろこび
 *   → ほね が ひかって、絵が うすくなり、字「風」が のこる
 *
 * 絵は、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   ほは マストに つながっていて、かぜが ふくと かぜの むき(右)へ ふくらむ。
 *   てんとうむしは あたま・せなか(はね)・6ぽんの あし。あしは からだの よこから出る。
 */
import { backOut, clamp01, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '風'

const SUN = '#ffd24a'
const SEA_BACK = '#a9d9f7'
const SEA_FRONT = '#5aaee8'
const FOAM = '#ffffff'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const BARK_LIGHT = '#a8744c'
const SAIL = '#fff4d6'
const SAIL_SHADE = '#f0d9a8'
const SAIL_FOLD = '#e0c284'
const FLAG = '#ff9a5c'
const WIND = '#8ccaf0'
const CLOUD = '#ffffff'
const BUG_RED = '#e8534a'
const BUG_RED_DARK = '#c4403a'
const BUG_BLACK = '#3d3a47'
const BUG_SEAM = '#8f2b2b'
const CHEEK = '#ff9d9d'
const MOUTH = '#ff9d9d'
const SWEAT = '#7cc4f2'

/** くぎり の時間(秒) */
const BUG_IN = 0.9
/** かぜが ふいてくる */
const GUST = 3.0
/** ほが ふくらみきる */
const FILL_END = 4.6
/** むしが よろこぶ */
const CHEER = 4.7
const INK = 6.2
const DONE = 9.4
const DURATION = 10.2

type Pt = readonly [number, number]

const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const lerpPt = (a: Pt, b: Pt, k: number): Pt => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]

/* ───────── ほ(帆) ───────── */

/** はしら(マスト): 1画目に だいたい そった、すこし まえ(右)へ かたむいた まっすぐな 棒 */
const MAST_TOP: Pt = [26.9, 12]
const MAST_FOOT: Pt = [19, 88]
/** はしらの x(y の所) */
const mastX = (y: number) => lerp(MAST_TOP[0], MAST_FOOT[0], (y - MAST_TOP[1]) / (MAST_FOOT[1] - MAST_TOP[1]))

/** ほの 左の ふち(はしらに つながる) の うえ と した */
const SAIL_TOP_LEFT: Pt = [mastX(23) + 1.7, 23]
const SAIL_BOTTOM_LEFT: Pt = [mastX(87) + 1.7, 87]

/** ほの 右の ふち。うえの かど → 右はし → した の かど(2画目と だいたい 同じ ばしょ) */
const FULL_EDGE: readonly Pt[] = [[77, 20], [79.5, 32], [78.5, 46], [80.5, 64], [86, 78], [92, 87]]
const FULL_TOP_CTRL: Pt = [50, 18]
/** かぜが ない ときは、ほが だらりと たれさがる(はしらの ちかくに あつまる) */
const SLACK_EDGE: readonly Pt[] = [[59, 31], [61, 42], [59, 54], [60, 66], [56, 78], [54, 87]]
const SLACK_TOP_CTRL: Pt = [42, 29]

type SailShape = { readonly topCtrl: Pt; readonly edge: readonly Pt[] }

/** fill(0 = だらり / 1 = ふくらんだ)のときの ほの かたち。ひらひら ゆれる ぶんも入れる */
function sailShape(fill: number, t: number, flap: number): SailShape {
  const slackness = clamp01(1 - fill)
  const edge = FULL_EDGE.map((full, i) => {
    const [x, y] = lerpPt(SLACK_EDGE[i], full, fill)
    const sway = Math.sin(t * 3.2 + i * 1.3) * 1.5 * slackness * flap + Math.sin(t * 2 + i) * 0.5 * clamp01(fill)
    return [x + sway, y] as Pt
  })
  return { topCtrl: lerpPt(SLACK_TOP_CTRL, FULL_TOP_CTRL, fill), edge }
}

const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
const pt = (p: Pt) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`

/** ほの ふちを なめらかに つなぐ。dx だけ 左へ ずらして、ふくらみの かげ(おび)を作る */
function sailPath(shape: SailShape, dx: number): string {
  const edge = shape.edge.map(([x, y]) => [x - dx, y] as Pt)
  const last = edge.length - 1
  let d = `M${pt(SAIL_TOP_LEFT)} Q${pt(shape.topCtrl)} ${pt(edge[0])}`
  for (let i = 1; i < last; i += 1) d += ` Q${pt(edge[i])} ${pt(mid(edge[i], edge[i + 1]))}`
  d += ` L${pt(edge[last])} L${pt(SAIL_BOTTOM_LEFT)} Z`
  return d
}

function Sail({ shape, fill }: { readonly shape: SailShape; readonly fill: number }) {
  return (
    <>
      <path d={sailPath(shape, 0)} fill={SAIL_SHADE} />
      <path d={sailPath(shape, 3.4 * clamp01(fill))} fill={SAIL} />
      {/* ふくらむと できる しわ(ひだ)。3画目あたり */}
      <path d="M63.5 24.8 C62.6 27 61.3 27.8 57 30.2 C52 33 44 36 35.9 38" fill="none" stroke={SAIL_FOLD} strokeWidth="1.5" strokeLinecap="round" opacity={clamp01(fill) * 0.85} />
    </>
  )
}

/** マストの てっぺんの はた。かぜが ないと した へ たれ、ふくと かぜの むき(右)へ なびく */
function Flag({ t }: SceneProps) {
  const wind = span(t, GUST, GUST + 0.5, easeOut)
  const angle = lerp(88, 0, wind) + wave(t, 0.28) * 7 * wind
  return (
    <Layer x={MAST_TOP[0]} y={13.4} rotate={angle} scale={span(t, 0.75, 1.15, backOut)}>
      <path d="M0 -2.6 Q6 -3.4 12 0 Q6 3.4 0 2.6 Z" fill={FLAG} />
    </Layer>
  )
}

/* ───────── ふね ───────── */

function Hull() {
  return (
    <>
      <path d="M5 86.5 H103 Q99 99.5 86 99.5 H23 Q10 99 5 86.5 Z" fill={BARK} />
      <path d="M5 86.5 H103 L102.2 90 H5.8 Z" fill={BARK_LIGHT} />
      <path d="M8.4 94 H99.6" stroke={BARK_DARK} strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />
      <circle cx="62" cy="92.6" r="2.7" fill={BARK_DARK} />
      <circle cx="62" cy="92.6" r="1.8" fill="#b9e3fa" />
    </>
  )
}

/** 波の ふち。off だけ 左へ ながれる(ふねが すすむと はやく ながれる) */
function Waves({ off, y, color }: { readonly off: number; readonly y: number; readonly color: string }) {
  const period = 16
  const phase = ((off % period) + period) % period
  const x0 = -phase - period
  let d = `M${x0} ${y}`
  for (let i = 0; i < 10; i += 1) d += ' q4 -3 8 0 q4 3 8 0'
  d += ` V112 H${x0} Z`
  return <path d={d} fill={color} />
}

/* ───────── てんとうむし(主役) ───────── */

type Mood = 'bored' | 'surprised' | 'happy'

type BugProps = {
  readonly mood: Mood
  /** 目と口の まわり: 0(だらり) 〜 1(ぎゅっと つかまる) */
  readonly grip: number
  /** しょっかく の むき(まっすぐ上から、右へ 何度) */
  readonly antennaL: number
  readonly antennaR: number
  readonly breath: number
  readonly sweat: number
  readonly sigh: number
}

/** あしの つけね の たかさ(からだの よこ。まえ・まんなか・うしろ) */
const LEG_ROOTS = [-5, 2, 9] as const

function Antenna({ side, angle }: { readonly side: -1 | 1; readonly angle: number }) {
  const rad = (angle * Math.PI) / 180
  const base: Pt = [side * 2.4, -22.4]
  const tip: Pt = [base[0] + Math.sin(rad) * 8.5, base[1] - Math.cos(rad) * 8.5]
  return (
    <>
      <path d={`M${pt(base)} L${pt(tip)}`} stroke={BUG_BLACK} strokeWidth="1.1" strokeLinecap="round" />
      <circle cx={tip[0]} cy={tip[1]} r="1.3" fill={BUG_BLACK} />
    </>
  )
}

function Legs({ grip }: { readonly grip: number }) {
  return (
    <g fill="none" stroke={BUG_BLACK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {([-1, 1] as const).map((side) =>
        LEG_ROOTS.map((y) => {
          // だらりと ぶらさがる → つめを たてて ぎゅっと つかまる
          const kneeX = side * lerp(16, 18.5, grip)
          const kneeY = y + lerp(2.5, -0.5, grip)
          const footX = side * lerp(15.5, 20.5, grip)
          const footY = y + lerp(9, 5.5, grip)
          return <path key={`${side}${y}`} d={`M${side * 12.4} ${y} L${kneeX} ${kneeY} L${footX} ${footY}`} />
        }),
      )}
    </g>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  const eyeX = 2.9
  const eyeY = -17.6
  return (
    <>
      <ellipse cx={-4.9} cy={-14.6} rx="1.5" ry="1" fill={CHEEK} opacity="0.7" />
      <ellipse cx={4.9} cy={-14.6} rx="1.5" ry="1" fill={CHEEK} opacity="0.7" />
      {mood === 'happy' ? (
        <>
          <path d={`M${-eyeX - 1.9} ${eyeY + 0.6} q1.9 -2.4 3.8 0 M${eyeX - 1.9} ${eyeY + 0.6} q1.9 -2.4 3.8 0`} fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M-2.4 -13.6 q2.4 2.8 4.8 0 Z" fill={MOUTH} stroke={MOUTH} strokeWidth="0.6" strokeLinejoin="round" />
        </>
      ) : (
        <>
          {[-eyeX, eyeX].map((x) => (
            <g key={x}>
              <circle cx={x} cy={eyeY} r={mood === 'surprised' ? 2.3 : 2} fill="#ffffff" />
              <circle cx={x} cy={eyeY + (mood === 'surprised' ? 0 : 0.7)} r={mood === 'surprised' ? 1.05 : 0.95} fill="#2b2b2b" />
              {/* たいくつな とき は、まぶたが 半分 おちている */}
              {mood === 'bored' && <path d={`M${x - 2.2} ${eyeY - 0.1} a2.2 2.2 0 0 1 4.4 0 Z`} fill={BUG_BLACK} />}
            </g>
          ))}
          {mood === 'bored' ? <path d="M-1.8 -12.6 q1.8 -1.5 3.6 0" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" /> : <ellipse cx="0" cy="-12.8" rx="1.2" ry="1.7" fill={MOUTH} />}
        </>
      )}
    </>
  )
}

/** てんとうむし。からだの まんなか が (0, 0)。上が あたま */
function Bug({ mood, grip, antennaL, antennaR, breath, sweat, sigh }: BugProps) {
  return (
    <>
      <Legs grip={grip} />
      <Antenna side={-1} angle={antennaL} />
      <Antenna side={1} angle={antennaR} />
      {/* せなか(はね): すこし ふくらむ いき */}
      <Layer scaleX={1 + breath * 0.03} scaleY={1 + breath * 0.02} origin={[0, 3]}>
        <ellipse cx="0" cy="3.4" rx="14.2" ry="14.8" fill={BUG_RED_DARK} />
        <ellipse cx="0" cy="2.6" rx="14.2" ry="14.8" fill={BUG_RED} />
        <path d="M0 -10.6 V17.4" stroke={BUG_SEAM} strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="-7" cy="-1.4" r="2.6" fill={BUG_BLACK} />
        <circle cx="7" cy="-1.4" r="2.6" fill={BUG_BLACK} />
        <circle cx="-6.4" cy="9" r="2.2" fill={BUG_BLACK} />
        <circle cx="6.4" cy="9" r="2.2" fill={BUG_BLACK} />
      </Layer>
      {/* あたま */}
      <circle cx="0" cy="-17" r="6.9" fill={BUG_BLACK} />
      <Face mood={mood} />
      {/* たいくつ: あせ と ためいき */}
      {sweat > 0 && <path d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill={SWEAT} opacity={sweat} transform={`translate(${9.4} ${-24 + (1 - sweat) * 3})`} />}
      {sigh > 0 && (
        <g opacity={sigh}>
          <ellipse cx={-13 - (1 - sigh) * 3} cy={-14 - (1 - sigh) * 3} rx="3.4" ry="2.2" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
          <ellipse cx={-9.6 - (1 - sigh) * 2} cy={-12.4} rx="1.6" ry="1.1" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
        </g>
      )}
    </>
  )
}

/* ───────── まわりの 絵 ───────── */

function Sky({ t, drift }: SceneProps & { readonly drift: number }) {
  const clouds: readonly (readonly [number, number, number])[] = [
    [118, 42, 1],
    [52, 8, 0.7],
  ]
  return (
    <>
      <Layer rotate={t * 14} origin={[96, 14]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="95.2" y="2.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 96 14)`} />
        ))}
      </Layer>
      <circle cx="96" cy="14" r="6.2" fill={SUN} />
      {clouds.map(([x0, y, s]) => {
        const x = ((((x0 - drift * s * 0.5) % 150) + 150) % 150) - 22
        return (
          <g key={y} fill={CLOUD} opacity="0.92" transform={`translate(${x} ${y}) scale(${s})`}>
            <ellipse cx="0" cy="0" rx="8" ry="3.4" />
            <ellipse cx="4" cy="-2.2" rx="5.2" ry="3.4" />
            <ellipse cx="-3.4" cy="-1.6" rx="4.2" ry="2.8" />
          </g>
        )
      })}
    </>
  )
}

/** かぜの すじ(左から 右へ ふきぬける) */
function Gust({ t }: SceneProps) {
  const lanes = [34, 55, 73]
  return (
    <>
      {lanes.map((y, i) => {
        const p = span(t, GUST + i * 0.2, GUST + i * 0.2 + 1.3)
        if (p <= 0 || p >= 1) return null
        const x = -24 + p * 150
        return (
          <path
            key={y}
            d={`M${x - 38} ${y} q9 -5 19 0 t19 0 a2.8 2.8 0 1 0 -2.6 -3`}
            fill="none"
            stroke={WIND}
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity={Math.sin(p * Math.PI) * 0.95}
          />
        )
      })}
    </>
  )
}

/** ふねが すすむ ときの しぶき(へさき) */
function Spray({ t }: SceneProps) {
  const show = during(t, FILL_END - 0.4, INK - 0.2, 0.4)
  if (show <= 0) return null
  return (
    <g opacity={show} fill={FOAM}>
      {[0, 0.27, 0.55].map((offset) => {
        const p = ((t + offset) % 0.8) / 0.8
        return <circle key={offset} cx={103 + p * 6} cy={95 - Math.sin(p * Math.PI) * 6} r={1.3 * (1 - p * 0.4)} opacity={1 - p * 0.5} />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 9)

  // ふねの でてくる: 海の中から ぽこっと あらわれる
  const boatIn = span(t, 0, 0.7, backOut)
  const mastGrow = span(t, 0.25, 0.8, easeOut)
  const sailOpen = span(t, 0.6, 1.2, easeOut)
  // 字になる ときには ふねも ほも じっと する
  const settle = 1 - span(t, INK - 0.5, INK)
  const bob = wave(t, 2.2) * 0.8 * settle
  const heel = wave(t, 2.2, 0.3) * 1.1 * settle
  // かぜで ふくらむ。ほが ふくらみきる ちょっと まえに、ぽん と ふくらみすぎてから おちつく
  const fill = span(t, GUST + 0.3, FILL_END, backOut)
  const flap = 1 + 2 * during(t, GUST - 0.2, GUST + 0.8, 0.3)
  const shape = sailShape(fill, t, flap)
  // なみ の ながれ: ふねが すすむと はやくなる
  const sail = Math.max(0, t - (GUST + 0.4))
  const waveOff = t * 2 + Math.min(sail, 3.6) ** 2 * 3 + Math.max(0, sail - 3.6) * 22
  const drift = waveOff

  // むし: ほに のっている。ほが ふくらむと、かぜに おされて まんなかへ
  const slide = span(t, GUST + 0.2, FILL_END, easeInOut)
  const mood: Mood = t < GUST ? 'bored' : t < CHEER ? 'surprised' : 'happy'
  const hop = Math.abs(wave(t - CHEER, 0.7)) * 2.4 * during(t, CHEER, INK - 0.45, 0.3)
  const bugX = lerp(43, 51, slide)
  const bugY = lerp(68, 61, slide) - hop
  const bugLean = lerp(-7, 0, slide)
  const windy = span(t, GUST, GUST + 0.25)
  const joy = span(t, FILL_END, FILL_END + 0.5)
  const flutter = wave(t, 0.12) * 7 * windy * (1 - joy)
  const antennaL = lerp(lerp(-78, 66, windy), -22, joy) + flutter
  const antennaR = lerp(lerp(78, 92, windy), 22, joy) + flutter
  const grip = mood === 'bored' ? 0.1 : mood === 'surprised' ? 1 : 0.7
  const calm = t < GUST
  const sweat = calm ? during(t, 1.3, GUST - 0.1, 0.3) : 0
  const sigh = calm ? during(t, 1.9, 2.8, 0.3) : 0
  const breath = calm ? wave(t - BUG_IN, 1.8) : 0
  const bugPop = span(t, BUG_IN, BUG_IN + 0.5, backOut)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} drift={drift} />
        <rect x="0" y="89" width="109" height="22" fill={SEA_BACK} />
        <Waves off={waveOff * 0.5} y={89} color={SEA_BACK} />
        <Layer y={bob + (1 - boatIn) * 16} rotate={heel} origin={[54, 94]}>
          <Layer scaleY={mastGrow} origin={[MAST_FOOT[0], MAST_FOOT[1]]}>
            <path d={`M${pt(MAST_TOP)} L${pt(MAST_FOOT)}`} stroke={BARK} strokeWidth="3.2" strokeLinecap="round" />
          </Layer>
          <Flag t={t} />
          <Layer scale={sailOpen} origin={SAIL_TOP_LEFT}>
            <Sail shape={shape} fill={fill} />
          </Layer>
          {bugPop > 0 && (
            <Layer x={bugX} y={bugY} rotate={bugLean} scale={bugPop}>
              <Bug mood={mood} grip={grip} antennaL={antennaL} antennaR={antennaR} breath={breath} sweat={sweat} sigh={sigh} />
            </Layer>
          )}
          <Hull />
        </Layer>
        <Waves off={waveOff} y={95} color={SEA_FRONT} />
        <Spray t={t} />
        <Gust t={t} />
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
    { at: 0, label: 'うみに ふねが うかぶ', sound: 'pop' },
    { at: BUG_IN, label: 'ほに てんとうむしが のっている', sound: 'pop' },
    { at: 1.8, label: 'かぜが なくて ほが だらり。むしは たいくつ' },
    { at: GUST, label: 'かぜが ビューッと ふいてくる!', sound: 'pop' },
    { at: GUST + 0.8, label: 'ほが ふくらむ。むしは ぎゅっと つかまる' },
    { at: CHEER, label: 'ふねが すすむ。むしは おおよろこび', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '風 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
