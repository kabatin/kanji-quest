/*
 * 才(さい): つちの中の たねが 雨を のんで、めを ちょこんと 出す。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 地面の ながい線(つち の うえの へり。まえ から 見た「だんめん」)
 *   2画目(丨)  … たねから 地面を つきぬけて のびる くき(さいごの はね は たね の まるみ)
 *   3画目(ノ)  … たねから ななめ下に のびる ひげ根
 *
 * ながれ
 *   つちの中で たねが ぐうぐう ねている(お日さまが てっている)
 *   → 雨雲が きて 雨が ふる → しみた 水が たねに とどく
 *   → たねが 目をさまして びっくり、うれしい かお に なる
 *   → ひげ根が ななめに のび、くき が つちを ぽこっと つきぬけて、ふたば が ひらく
 *   → 「これから のびる ちから!」 ほね が ひかって、絵が うすくなり 字「才」が のこる
 *
 * ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   くき は たね の上から まっすぐ。ふたば は くき の さき に 左右ひとつずつ。
 *   根は 下へ のびる。雨は まっすぐ 下に おちて、つち に しみこむ。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '才'

const SUN = '#ffd24a'
const SOIL = '#b98558'
const SOIL_DARK = '#a06f46'
const SOIL_WET = '#7c5233'
const PEBBLE = '#d4a877'
const GRASS = '#55b86e'
const GRASS_LIGHT = '#8bd69a'
const STEM = '#55b86e'
const STEM_DARK = '#3f9c59'
const LEAF = '#7fd08a'
const LEAF_DARK = '#4aa862'
const ROOT = '#f6e6c4'
const SEED = '#e3ac62'
const SEED_SHADE = '#c98d46'
const SEED_LIGHT = '#f2c98a'
const CLOUD = '#a3b0c2'
const CLOUD_SHADE = '#8494aa'
const CLOUD_LIGHT = '#c3cddb'
const DROP = '#7cc4f2'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const RAIN_IN = 0.5
const RAIN_AT = 1.5
const WET = 2.2
/** 水が たねに とどいて、目を さます */
const WAKE = 3.2
const SPROUT = 3.6
const BREAK = 4.4
const LEAVES = 5.0
const INK = 6.6
const DONE = 9.2
const DURATION = 9.8

/** 1画目 の 地面: 左(18.6, 38.5)から 右(92.7, 34.5)へ ほんの少し あがる */
const surfaceY = (x: number) => 38.5 - (x - 18.6) * 0.054
/** くき の よこの いち(2画目) */
const STEM_X = 63
/** たね の まんなか。2画目の おわりの はね(54.3, 90.2)が たね の中に おさまる */
const SEED_C: readonly [number, number] = [60, 85]
/** たね の てっぺん(くき の はじまり) */
const SEED_TOP = SEED_C[1] - 8

function Sky({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun} fill={SUN} />
      {/* とおくの 小さな 雲(おくゆき) */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.2} 0)`}>
        <ellipse cx="22" cy="26" rx="6" ry="2.8" />
        <ellipse cx="26" cy="24.4" rx="4.2" ry="2.8" />
      </g>
    </>
  )
}

/** つち の だんめん。上に 草の ふち が あり、水が しみた ところ は こい色に なる。 */
function Soil({ t }: SceneProps) {
  const rise = span(t, 0, 0.5, easeOut)
  const wet = span(t, WET, WET + 1.1, easeOut)
  return (
    <Layer opacity={rise}>
      <path d={`M-2 ${surfaceY(-2)} L111 ${surfaceY(111)} V101 H-2 Z`} fill={SOIL} />
      <path d="M-2 90 Q30 84 60 92 Q90 98 111 88 V101 H-2 Z" fill={SOIL_DARK} />
      {/* 水が しみた ところ(たねの上を まるく) */}
      <ellipse cx={STEM_X} cy="60" rx={12 * wet} ry={24 * wet} fill={SOIL_WET} opacity="0.35" />
      {[
        [12, 56, 2.2],
        [26, 70, 1.6],
        [40, 50, 1.8],
        [86, 58, 2.4],
        [96, 76, 1.8],
        [80, 88, 2],
        [18, 92, 1.8],
        [34, 64, 1.2],
        [92, 46, 1.4],
      ].map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={PEBBLE} />
      ))}
      {/* 1画目: 地面の 草の ふち */}
      <path d={`M-2 ${surfaceY(-2)} L111 ${surfaceY(111)}`} stroke={GRASS} strokeWidth="3.4" strokeLinecap="round" fill="none" />
      {[6, 28, 44, 80, 100].map((x) => (
        <path key={x} d={`M${x} ${surfaceY(x) - 0.6} l1.2 -3.4 l1 3 l1.5 -3.8 l0.7 4 Z`} fill={GRASS_LIGHT} />
      ))}
    </Layer>
  )
}

/** 雨雲。右から きて、雨を ふらせ、ふりおわると 左へ さる。 */
function RainCloud({ t }: SceneProps) {
  const x = t < 3 ? mix(t, RAIN_IN, RAIN_IN + 1.0, 135, STEM_X, easeOut) : mix(t, 3.8, 4.9, STEM_X, 150, easeInOut)
  if (x > 130) return null
  return (
    <Layer x={x - STEM_X}>
      <g fill={CLOUD_SHADE}>
        <rect x="46" y="9" width="34" height="9.6" rx="4.8" />
        <circle cx="56" cy="9" r="7" />
        <circle cx="67" cy="7" r="8.4" />
      </g>
      <g fill={CLOUD} transform="translate(0 -1.4)">
        <rect x="46" y="9" width="34" height="9.6" rx="4.8" />
        <circle cx="56" cy="9" r="7" />
        <circle cx="67" cy="7" r="8.4" />
      </g>
      <circle cx="62.5" cy="4.6" r="3.2" fill={CLOUD_LIGHT} />
    </Layer>
  )
}

/** まっすぐ 下に おちる 雨と、つちに おちた ときの 小さな わ。 */
function Rain({ t }: SceneProps) {
  const show = during(t, RAIN_AT, 3.7, 0.2)
  if (show <= 0) return null
  const surface = surfaceY(STEM_X)
  return (
    <g opacity={show}>
      {Array.from({ length: 6 }, (_, i) => {
        const p = (t * 1.7 + i / 6) % 1
        const x = STEM_X - 11 + i * 4.4
        const y = 20 + p * (surface - 22)
        return <path key={i} d="M0 -2.6 Q1.6 0.4 0 1.6 Q-1.6 0.4 0 -2.6 Z" fill={DROP} transform={`translate(${x} ${y})`} />
      })}
    </g>
  )
}

/** つちに しみた 水の つぶ。たねの 上へ むかって、下へ おりていく。 */
function Seep({ t }: SceneProps) {
  return (
    <>
      {[0, 1, 2].map((i) => {
        const from = WET - 0.1 + i * 0.28
        const p = span(t, from, from + 0.95)
        if (p <= 0 || p >= 1) return null
        const x = STEM_X + (i - 1) * 3.4
        const y = surfaceY(STEM_X) + 4 + p * (SEED_TOP - surfaceY(STEM_X) - 5)
        return <path key={i} d="M0 -2.4 Q1.5 0.3 0 1.5 Q-1.5 0.3 0 -2.4 Z" fill={DROP} opacity={1 - p ** 4} transform={`translate(${x} ${y})`} />
      })}
    </>
  )
}

type Mood = 'asleep' | 'surprised' | 'happy'

function SeedFace({ mood }: { readonly mood: Mood }) {
  const [cx, cy] = SEED_C
  const leftEye = cx - 3.4
  const rightEye = cx + 2.8
  const eyeY = cy - 0.8
  return (
    <>
      <circle cx={cx - 5.8} cy={cy + 3} r="1.7" fill={CHEEK} opacity="0.55" />
      <circle cx={cx + 5.2} cy={cy + 3} r="1.7" fill={CHEEK} opacity="0.55" />
      {mood === 'asleep' && (
        <>
          <path d={`M${leftEye - 1.5} ${eyeY} Q${leftEye} ${eyeY + 1.5} ${leftEye + 1.5} ${eyeY}`} fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d={`M${rightEye - 1.5} ${eyeY} Q${rightEye} ${eyeY + 1.5} ${rightEye + 1.5} ${eyeY}`} fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d={`M${cx - 1.4} ${cy + 4.2} h2.8`} stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'surprised' && (
        <>
          <circle cx={leftEye} cy={eyeY} r="1.9" fill="#ffffff" />
          <circle cx={rightEye} cy={eyeY} r="1.9" fill="#ffffff" />
          <circle cx={leftEye} cy={eyeY} r="1.1" fill={EYE} />
          <circle cx={rightEye} cy={eyeY} r="1.1" fill={EYE} />
          <ellipse cx={cx - 0.3} cy={cy + 4.4} rx="1.3" ry="1.7" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d={`M${leftEye - 1.6} ${eyeY + 0.8} Q${leftEye} ${eyeY - 1.3} ${leftEye + 1.6} ${eyeY + 0.8}`} fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d={`M${rightEye - 1.6} ${eyeY + 0.8} Q${rightEye} ${eyeY - 1.3} ${rightEye + 1.6} ${eyeY + 0.8}`} fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d={`M${cx - 2.4} ${cy + 3.6} Q${cx - 0.2} ${cy + 6.4} ${cx + 2} ${cy + 3.6}`} fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
    </>
  )
}

/** つちの中の たね。おおきな まめ の かたち に、顔が ある。 */
function Seed({ t }: SceneProps) {
  const mood: Mood = t < WAKE ? 'asleep' : t < SPROUT + 0.3 ? 'surprised' : 'happy'
  const breath = t < WAKE ? wave(t, 1.8) * 0.03 : 0
  // びっくりして ぽよん、水を のんで ぐんと のびる
  const pop = Math.sin(span(t, WAKE, WAKE + 0.4) * Math.PI) * 0.12 + Math.sin(span(t, SPROUT, SPROUT + 0.6) * Math.PI) * 0.06
  return (
    <Layer scaleX={1 + breath - pop * 0.5} scaleY={1 - breath + pop} origin={[SEED_C[0], SEED_C[1] + 8]}>
      <ellipse cx={SEED_C[0]} cy={SEED_C[1]} rx="9" ry="8" fill={SEED} />
      <path d={`M${SEED_C[0] - 8} ${SEED_C[1] + 3} Q${SEED_C[0]} ${SEED_C[1] + 12} ${SEED_C[0] + 8.4} ${SEED_C[1] + 2} Q${SEED_C[0] + 4} ${SEED_C[1] + 8.6} ${SEED_C[0]} ${SEED_C[1] + 8} Q${SEED_C[0] - 6} ${SEED_C[1] + 8.2} ${SEED_C[0] - 8} ${SEED_C[1] + 3} Z`} fill={SEED_SHADE} />
      <ellipse cx={SEED_C[0] - 4.6} cy={SEED_C[1] - 4.6} rx="2.8" ry="1.6" fill={SEED_LIGHT} transform={`rotate(-30 ${SEED_C[0] - 4.6} ${SEED_C[1] - 4.6})`} />
      <SeedFace mood={mood} />
    </Layer>
  )
}

/** ねている間の「ぐうぐう」。 */
function Snore({ t }: SceneProps) {
  const show = during(t, 0.5, WAKE - 0.4, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show} fill="#5f7fd6" fontWeight="700" fontFamily="inherit">
      {[0, 0.7].map((offset, i) => {
        const p = ((t + offset) % 1.4) / 1.4
        return (
          <text key={offset} x={71 + p * 6} y={78 - p * 9} fontSize={4 + i * 1.4 + p * 2} opacity={Math.sin(p * Math.PI)}>
            z
          </text>
        )
      })}
    </g>
  )
}

/** ひげ根(3画目): 水を すいあげて、くき の よこから ななめ下へ のびる。 */
function Root({ t }: SceneProps) {
  // くき が この高さを とおりすぎて から のびる(くき から 出ているように 見せる)
  const g = span(t, SPROUT + 0.5, BREAK + 0.6, easeOut)
  if (g <= 0) return null
  return <path d="M63 54.3 Q42 72 24 85.5" pathLength={1} strokeDasharray={`${g} 2`} fill="none" stroke={ROOT} strokeWidth="2.6" strokeLinecap="round" />
}

/** くき(2画目): たね の てっぺん から まっすぐ のびて、つちを つきぬけ、さきに ふたばが ひらく。 */
function Sprout({ t }: SceneProps) {
  const g = span(t, SPROUT, LEAVES, easeInOut)
  if (g <= 0) return null
  const leaves = span(t, LEAVES - 0.2, LEAVES + 0.6, backOut)
  const sway = wave(t, 1.6) * 3 * span(t, LEAVES + 0.4, LEAVES + 1.0)
  const joy = Math.max(0, wave(t, 0.9)) * span(t, LEAVES + 0.6, INK - 0.2)
  const stem = 'M63 82 L63 22 Q63 17 61 14'
  return (
    <>
      <path d={stem} pathLength={1} strokeDasharray={`${g} 2`} fill="none" stroke={STEM_DARK} strokeWidth="4.2" strokeLinecap="round" />
      <path d={stem} pathLength={1} strokeDasharray={`${g} 2`} fill="none" stroke={STEM} strokeWidth="2.8" strokeLinecap="round" />
      <Layer scale={leaves} rotate={sway} origin={[61.4, 15]}>
        <Layer y={-joy * 0.8} origin={[61.4, 15]}>
          <path d="M61 15 Q52 4.4 44.5 10.4 Q51 18.6 61 15 Z" fill={LEAF} />
          <path d="M61 15 Q52 12 46 10.8" fill="none" stroke={LEAF_DARK} strokeWidth="0.8" strokeLinecap="round" />
          <path d="M62 15 Q72 3.6 80.5 9.4 Q73 19.4 62 15 Z" fill={LEAF} />
          <path d="M62 15 Q72 11 79 9.8" fill="none" stroke={LEAF_DARK} strokeWidth="0.8" strokeLinecap="round" />
          <circle cx="61.5" cy="15.2" r="1.8" fill={LEAF_DARK} />
        </Layer>
      </Layer>
    </>
  )
}

/** くき が 地面を つきぬける とき の、つちの かけら。 */
function Crumbs({ t }: SceneProps) {
  const p = span(t, BREAK - 0.2, BREAK + 0.7)
  if (p <= 0 || p >= 1) return null
  const y0 = surfaceY(STEM_X) - 1.5
  return (
    <g opacity={1 - p ** 2} fill={SOIL}>
      {[-9, -5, -2, 3, 6, 10].map((dx, i) => (
        <circle key={dx} cx={STEM_X + dx * (0.4 + p)} cy={y0 - Math.sin(p * Math.PI) * (7 + (i % 3) * 3) + p * p * 5} r={1.3 + (i % 2) * 0.5} />
      ))}
    </g>
  )
}

/** ふたばが ひらいた とき の よろこびの ほし。 */
function Cheer({ t }: SceneProps) {
  const p = span(t, LEAVES + 0.3, INK - 0.1)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={Math.sin(p * Math.PI)}>
      <Star cx={44} cy={24 - p * 4} r={2.6} color={SUN} spin={p * 120} />
      <Star cx={79} cy={22 - p * 4} r={2.2} color="#ffffff" spin={-p * 120} />
      <Star cx={70} cy={28 - p * 3} r={1.6} color="#ffb36b" spin={p * 90} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 3)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Soil t={t} />
        <Root t={t} />
        <Sprout t={t} />
        <Seep t={t} />
        <Seed t={t} />
        <Snore t={t} />
        <Crumbs t={t} />
        <RainCloud t={t} />
        <Rain t={t} />
        <Cheer t={t} />
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
    { at: 0, label: 'つちの中で たねが ねている', sound: 'pop' },
    { at: RAIN_AT, label: '雨が ふって、水が つちに しみる' },
    { at: WAKE, label: '水が とどいて、たねが 目をさます', sound: 'pop' },
    { at: BREAK, label: 'めが つちを つきぬけて ちょこんと 出る', sound: 'pop' },
    { at: LEAVES, label: 'ふたばが ひらく。これから のびる ちから' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '才 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
