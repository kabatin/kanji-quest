/*
 * 土(つち): じめんの 上に 土が もりあがった。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … もぐらが よろこんで ひろげた りょううで(かた から ひじ を通って 手まで)
 *   2画目(丨)  … もぐらの あたま から どう(あたま の てっぺん から 下へ)
 *   3画目(一)  … たいらな じめん(土の もりあがりの いちばん下)
 *
 * ながれ
 *   たいらな じめん。もぐらが ちょこんと かおを 出して、「つまんないな」→「そうだ!」と ひらめく
 *   → もぐって じめんの 下を すすむ(じめんが 細長く もりあがって ついてくる)
 *   → まんなかで 土を ほりあげる。土が とんで、ぐぐっ ぐぐっ と 3かい もりあがる
 *   → てっぺん から もぐらが ぽこっ と かおを 出し、できた つちやま の上で りょううでを ひろげて 大よろこび
 *   → ほね が ひかって、絵が うすくなり、字「土」が のこる
 *
 * もぐらは、ほんものの つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   あたま は まるく、はな は ピンクで とがり、目は ごく小さい。
 *   うで は かた から出て、ひじ で まがり、手は ピンクで 大きい。くび は ほとんど なく、あたま は どう の すぐ上。
 *   土の やま も、ほんものの 土のやま の ように、下が ひろく 上が まるい。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '土'

const SUN = '#ffd24a'
const HILL = '#e2f2d2'
const GRASS_TOP = '#9bd67f'
const GRASS_BLADE = '#55b86e'
const EARTH = '#c99a6b'
const EARTH_DARK = '#b3835a'
const SOIL = '#8d5a34'
const SOIL_LIGHT = '#a8703f'
const SOIL_SHADE = '#74482a'
const FUR = '#6e5a6a'
const FUR_DARK = '#5a4858'
const FUR_BELLY = '#8f7b8d'
const PINK = '#ff9fb0'
const PINK_DARK = '#e9788f'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const PEEK = 0.7
const IDEA = 1.4
const DIVE = 1.85
const TUNNEL = 2.2
const HEAVE = 3.2
const POP = 5.0
const CHEER = 6.0
const INK = 6.6
const DONE = 9.3
const DURATION = 10

/** じめんの たかさ(土のやま の ふもと) */
const GROUND_Y = 86
/** のぞく ばしょ(左) と、土を ほりあげる ばしょ(まんなか) */
const PEEK_X = 22
const MOUND_X = 54
/** 土のやま の てっぺん の たかさ */
const MOUND_TOP = 62

/** もぐらの かた の たかさ と、かた の はば(まんなか から) */
const SHOULDER_Y = 42
const SHOULDER_DX = 9
/** うで の ひとふし の ながさ */
const ARM_PART = 8.5

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
      <path d="M-4 90 Q18 70 44 84 Q72 64 113 88 V101 H-4 Z" fill={HILL} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="86" cy="22" rx="7" ry="3.2" />
        <ellipse cx="91" cy="20.2" rx="5" ry="3.2" />
        <ellipse cx="-6" cy="40" rx="6" ry="2.8" />
        <ellipse cx="-1.6" cy="38.6" rx="4.2" ry="2.8" />
      </g>
    </>
  )
}

/** たいらな じめん。草の しま と、土の中の こいし */
function Ground() {
  return (
    <>
      <rect x="-4" y={GROUND_Y - 0.5} width="117" height="30" fill={EARTH} />
      <rect x="-4" y={GROUND_Y - 0.5} width="117" height="4.6" fill={GRASS_TOP} />
      {[10, 36, 70, 98].map((x, i) => (
        <ellipse key={x} cx={x} cy={96 + (i % 2) * 5} rx="2.6" ry="1.5" fill={EARTH_DARK} />
      ))}
      {[6, 30, 78, 102].map((x) => (
        <path key={x} d={`M${x} ${GROUND_Y} l1.2 -3.4 l1 3 l1.6 -3.8 l0.8 4.2 Z`} fill={GRASS_BLADE} />
      ))}
    </>
  )
}

type Mood = 'bored' | 'idea' | 'happy'

/** もぐらの あたま(中心が 0,0、はんけい 9.5)。まえむき。 */
function MoleHead({ mood, sniff }: { readonly mood: Mood; readonly sniff: number }) {
  return (
    <>
      <circle r="9.5" fill={FUR} />
      <path d="M-8.6 3 Q-9 -6 0 -9.4 Q-6 -5 -6 3 Z" fill={FUR_DARK} opacity="0.35" />
      <circle cx="-6.4" cy="3.4" r="2" fill={CHEEK} opacity="0.5" />
      <circle cx="6.4" cy="3.4" r="2" fill={CHEEK} opacity="0.5" />
      {/* 目: ほんものの もぐらは ごく小さい */}
      {mood === 'happy' ? (
        <>
          <path d="M-5.6 -1.4 Q-3.8 -3.6 -2 -1.4" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M2 -1.4 Q3.8 -3.6 5.6 -1.4" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
        </>
      ) : mood === 'idea' ? (
        <>
          <circle cx="-3.8" cy="-1.6" r="1.5" fill={EYE} />
          <circle cx="3.8" cy="-1.6" r="1.5" fill={EYE} />
          <circle cx="-3.3" cy="-2.1" r="0.5" fill="#ffffff" />
          <circle cx="4.3" cy="-2.1" r="0.5" fill="#ffffff" />
        </>
      ) : (
        <>
          <path d="M-5.6 -2.4 l3.4 0.9 M5.6 -2.4 l-3.4 0.9" stroke={FUR_DARK} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="-3.8" cy="-0.8" r="0.95" fill={EYE} />
          <circle cx="3.8" cy="-0.8" r="0.95" fill={EYE} />
        </>
      )}
      {/* はな: ピンクで とがっていて、ひくひく うごく */}
      <g transform={`translate(0 4.6) scale(${1 + sniff * 0.12})`}>
        <path d="M-3.8 -1.6 Q0 -3.4 3.8 -1.6 Q3.4 2.8 0 3.2 Q-3.4 2.8 -3.8 -1.6 Z" fill={PINK} />
        <ellipse cx="-1.2" cy="0.4" rx="0.6" ry="0.8" fill={PINK_DARK} />
        <ellipse cx="1.2" cy="0.4" rx="0.6" ry="0.8" fill={PINK_DARK} />
      </g>
      {mood === 'happy' ? (
        <path d="M-3.4 7.6 Q0 11.2 3.4 7.6 Z" fill={MOUTH} />
      ) : mood === 'idea' ? (
        <ellipse cx="0" cy="8.4" rx="1.1" ry="1.3" fill={MOUTH} />
      ) : (
        <path d="M-2 8.4 Q0 7.4 2 8.4" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
      )}
    </>
  )
}

/** かた から出て、ひじ で まがる うで。side: 左 = -1、右 = 1。swing = ま下から そとへ ひらいた角度。 */
function MoleArm({ side, swing, bend }: { readonly side: -1 | 1; readonly swing: number; readonly bend: number }) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const shoulder = [MOUND_X + side * SHOULDER_DX, SHOULDER_Y] as const
  const elbow = [shoulder[0] + side * Math.sin(rad(swing)) * ARM_PART, shoulder[1] + Math.cos(rad(swing)) * ARM_PART] as const
  const forearm = swing + bend
  const hand = [elbow[0] + side * Math.sin(rad(forearm)) * ARM_PART, elbow[1] + Math.cos(rad(forearm)) * ARM_PART] as const
  const claw = side * 3.6
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={FUR_DARK} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx={hand[0]} cy={hand[1]} rx="4.4" ry="3.6" fill={PINK} />
      <path d={`M${hand[0] + claw} ${hand[1] - 1.4} l${side * 1.6} -0.4 M${hand[0] + claw} ${hand[1]} l${side * 1.8} 0 M${hand[0] + claw} ${hand[1] + 1.4} l${side * 1.6} 0.5`} stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round" />
    </>
  )
}

/** つちやま から 出てきた もぐら(まえむき)。lift = どれだけ 下に もぐっているか */
function Mole({ lift, spread, mood, tilt, sniff }: { readonly lift: number; readonly spread: number; readonly mood: Mood; readonly tilt: number; readonly sniff: number }) {
  // とじた ときは 体の よこに たれ、ひらく と ひじを のばして よこへ ひろがる
  const swing = 18 + 52 * spread
  const bend = 8 - 14 * spread
  return (
    <Layer y={lift}>
      <ellipse cx={MOUND_X} cy="50" rx="11.5" ry="18" fill={FUR} />
      <ellipse cx={MOUND_X} cy="52" rx="7" ry="11" fill={FUR_BELLY} />
      <MoleArm side={-1} swing={swing} bend={bend} />
      <MoleArm side={1} swing={swing} bend={bend} />
      <Layer rotate={tilt} origin={[MOUND_X, 34]}>
        <g transform={`translate(${MOUND_X} 26.2)`}>
          <MoleHead mood={mood} sniff={sniff} />
        </g>
      </Layer>
    </Layer>
  )
}

/** のぞいている もぐら(左)。じめんの 下から、かおだけ 出す。 */
function Peeker({ t }: SceneProps) {
  const up = span(t, PEEK, PEEK + 0.4, easeOut) * (1 - span(t, DIVE, DIVE + 0.3, easeIn))
  if (up <= 0) return null
  const mood: Mood = t < IDEA ? 'bored' : 'idea'
  // 「つまんないな」と、左右を きょろきょろ
  const look = t < IDEA ? wave(t - PEEK, 1.0) * 7 : 0
  const bang = during(t, IDEA, DIVE + 0.1, 0.12)
  return (
    <>
      <clipPath id="k571f-peek">
        <rect x="0" y="40" width="60" height={GROUND_Y + 1.5 - 40} />
      </clipPath>
      <g clipPath="url(#k571f-peek)">
        <g transform={`translate(${PEEK_X} ${93.5 - 10.5 * up}) scale(0.78) rotate(${look})`}>
          <MoleHead mood={mood} sniff={wave(t, 0.35)} />
        </g>
      </g>
      {/* ひらめき の「!」 */}
      <g opacity={bang} fill="#f2a31b" transform={`translate(${PEEK_X + 7} ${70 - 2 * bang})`}>
        <rect x="-1" y="-5" width="2" height="5.6" rx="1" />
        <circle cx="0" cy="2.4" r="1.1" />
      </g>
    </>
  )
}

/** もぐって すすむ もぐら の上の じめん が、ほそながく もりあがって ついてくる */
function Ridge({ t }: SceneProps) {
  const go = span(t, TUNNEL, HEAVE, easeInOut)
  const show = span(t, DIVE + 0.1, TUNNEL) * (1 - span(t, HEAVE, HEAVE + 0.2))
  if (show <= 0) return null
  const x = PEEK_X + (MOUND_X - PEEK_X) * go
  const trail = wave(t, 0.3) * 0.5
  return (
    <g opacity={show}>
      <path d={`M${x - 9} ${GROUND_Y} Q${x} ${GROUND_Y - 6.4 + trail} ${x + 9} ${GROUND_Y} Z`} fill={SOIL} />
      <path d={`M${x - 7} ${GROUND_Y} Q${x - 1} ${GROUND_Y - 5.4 + trail} ${x + 3} ${GROUND_Y - 3} Q${x - 3} ${GROUND_Y - 1} ${x - 7} ${GROUND_Y} Z`} fill={SOIL_LIGHT} />
    </g>
  )
}

/** 土を とばす: 小さな 土のかたまりが、とんで おちる(ほりあげる たびに ぐぐっと もりあがる わけ) */
function Clods({ t, height }: SceneProps & { readonly height: number }) {
  const show = during(t, HEAVE - 0.1, POP + 0.05, 0.15)
  if (show <= 0) return null
  const top = GROUND_Y - (GROUND_Y - MOUND_TOP) * height
  const dirs = [-14, 9, -5, 16, -10, 4]
  return (
    <g opacity={show} fill={SOIL}>
      {dirs.map((vx, i) => {
        const p = (((t - HEAVE + i * 0.3) % 1.2) + 1.2) % 1.2 / 1.2
        const x = MOUND_X + vx * p
        const y = top - 26 * 4 * p * (1 - p) * (1 - 0.25 * (i % 3)) + 2 * p
        return <circle key={i} cx={x} cy={y} r={1.5 + (i % 3) * 0.35} opacity={1 - p * p} />
      })}
    </g>
  )
}

/** ぽこっ と出た しゅんかんの 土けむり */
function Dust({ t }: SceneProps) {
  const p = span(t, POP + 0.1, POP + 0.9, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p} fill="#e4cdb0">
      <circle cx={MOUND_X - 12 - p * 7} cy={MOUND_TOP - 1 - p * 5} r={2 + p * 3} />
      <circle cx={MOUND_X + 12 + p * 7} cy={MOUND_TOP - 1 - p * 5} r={2 + p * 3} />
      <circle cx={MOUND_X - 8 - p * 4} cy={MOUND_TOP - 3 - p * 9} r={1.4 + p * 2} />
      <circle cx={MOUND_X + 8 + p * 4} cy={MOUND_TOP - 3 - p * 9} r={1.4 + p * 2} />
    </g>
  )
}

/** 土の やま。下が ひろく、上が まるい。ふもと(じめん)を じく に のびあがる */
function Mound({ t, height }: SceneProps & { readonly height: number }) {
  if (height <= 0) return null
  const shake = t >= HEAVE && t < POP ? wave(t, 0.14) * 0.35 * (1 - height * 0.5) : 0
  const shape = 'M20 86 C30 85 38 68 44 64 Q54 59 64 64 C70 68 78 85 88 86 Z'
  return (
    <Layer x={shake} scaleX={0.72 + 0.28 * height} scaleY={height} origin={[MOUND_X, GROUND_Y]}>
      <path d={shape} fill={SOIL_SHADE} />
      <path d={shape} fill={SOIL} transform="translate(-1.6 -1)" />
      <path d="M37 76 Q42 69 47 66.4" fill="none" stroke={SOIL_LIGHT} strokeWidth="2.2" strokeLinecap="round" />
      <ellipse cx="68" cy="78" rx="2.4" ry="1.5" fill={SOIL_SHADE} />
      <ellipse cx="44" cy="81" rx="2" ry="1.3" fill={SOIL_LIGHT} />
      <ellipse cx="60" cy="72" rx="1.6" ry="1.1" fill={SOIL_SHADE} />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 3)

  // 3かい ぐぐっ と もりあがる
  const height =
    0.34 * span(t, HEAVE, HEAVE + 0.55, backOut) + 0.33 * span(t, HEAVE + 0.65, HEAVE + 1.2, backOut) + 0.33 * span(t, HEAVE + 1.3, HEAVE + 1.85, backOut)

  // てっぺん から ぽこっ と出る → きょろきょろ → りょううで を ひろげる
  const rise = span(t, POP, POP + 1.0, backOut)
  const lift = mix(t, POP, POP + 1.0, 46, 0, backOut)
  const spread = span(t, CHEER, CHEER + 0.55, backOut)
  const tilt = wave(t - POP, 0.9) * 7 * rise * (1 - span(t, CHEER - 0.4, CHEER + 0.2))
  const hop = Math.abs(wave(t - CHEER, 0.7)) * 0.9 * span(t, CHEER + 0.5, CHEER + 0.7) * (1 - span(t, INK - 0.2, INK))

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Ground />
        <Peeker t={t} />
        <Ridge t={t} />
        <Dust t={t} />
        {rise > 0 && (
          <Layer y={-hop}>
            <Mole lift={lift} spread={Math.max(0, spread)} mood="happy" tilt={tilt} sniff={wave(t, 0.4) * (1 - spread)} />
          </Layer>
        )}
        <Mound t={t} height={height} />
        <Clods t={t} height={height} />
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
    { at: 0, label: 'たいらな じめん', sound: 'pop' },
    { at: PEEK, label: 'もぐらが かおを 出す。「つまんないな」' },
    { at: IDEA, label: '「そうだ!」と ひらめいて もぐる', sound: 'pop' },
    { at: TUNNEL, label: 'じめんの 下を すすむ' },
    { at: HEAVE, label: '土を ほりあげて、ぐぐっと もりあがる', sound: 'pop' },
    { at: POP, label: 'てっぺん から ぽこっ と かおを 出す', sound: 'pop' },
    { at: CHEER, label: 'できた! りょううで を ひろげて 大よろこび' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '土 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
