/*
 * 川(かわ): きしの あいだを、水が ながれる。
 *
 * 空から 見おろした 絵(ちず の ような 見かた)。かわき かけた かわ で、さかなが こまっている。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … 左の きし(かわの 左のふち。下へ いくほど 左へ ひろがる)
 *   2画目(丨)  … 水の まんなかを ながれる 白い あわの すじ(水が ながれる とおりみち)
 *   3画目(丨)  … 右の きし(かわの 右のふち)
 *
 * ながれ
 *   かわいた かわ。さかなが 小さな みずたまり で ぴちぴち こまっている
 *   → 上の いわの あいだから いずみが わく → 水が どんどん ながれだして さかなが びっくり
 *   → 水が きしの あいだを 下へ ひろがり、さかなが うれしそうに およぐ
 *   → ほね が ひかって、絵が うすくなり、字「川」が のこる
 *
 * 川は、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   かわは きし に はさまれ、水は 上から 下へ ながれる。さかなは 頭を すすむ むきに むけ、
 *   体を くねらせて およぐ。きしの 左の ふちは、字と おなじ ように すこし まがって ひろがる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '川'

const GRASS = '#cdeab0'
const GRASS_DARK = '#9fd47f'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const SAND = '#ecd9ae'
const PEBBLE = '#cdb88e'
const BANK = '#c9a56e'
const ROCK = '#a8a39a'
const ROCK_DARK = '#8f8a82'
const ROCK_LIGHT = '#c4c0b8'
const WATER = '#7cc4f2'
const WATER_LIGHT = '#b4defa'
const FOAM = '#f0f9ff'
const FISH = '#ff9a5c'
const FISH_DARK = '#e2733f'
const FISH_LIGHT = '#ffb98a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const SPRING = 0.9
/** 水が いずみから ながれだす */
const FLOW = 1.9
/** さかなが 水に のって 下へ およぎだす */
const SWIM = 2.8
const INK = 5.9
const DONE = 8.5
const DURATION = 9.2

/** いずみの 場所 */
const SPRING_AT: readonly [number, number] = [55, 13]
/** 水の さき(先頭)の 高さ: いずみ から 下のはし まで */
const FRONT_FROM = 12
const FRONT_TO = 110
/** さかなの はじめの場所(小さな みずたまり) と おわりの場所 */
const FISH_START: readonly [number, number] = [55, 40]
const FISH_END: readonly [number, number] = [55, 68]

/** かわの かたち(ふたつの きし の あいだ)。左は 1画目、右は 3画目 の線に そわせる */
const CHANNEL = 'M26.4 12 L86 12 L87.4 14 L87.4 112 L5 112 L9.6 100 L13.6 91 L17.4 84.2 L21.7 76.6 L24.6 68.5 L26.5 60 L27.7 51.5 L28.3 42.8 L28.4 34.2 L27.2 25.7 Z'

/** 水の さき の高さ */
const frontAt = (t: number) => mix(t, FLOW, 5.2, FRONT_FROM, FRONT_TO, easeOut)

/** さかなの 高さ: みずたまり で じっとして、水が きたら 下へ およぐ */
const fishY = (t: number) => mix(t, SWIM, INK + 0.2, FISH_START[1], FISH_END[1], easeInOut)

type Mood = 'sad' | 'wow' | 'happy'

function Ground() {
  return (
    <>
      <rect x="0" y="0" width="109" height="109" fill={GRASS} />
      {/* くさの こい 色の はっぱ */}
      {[
        [8, 22],
        [16, 52],
        [5, 66],
        [100, 44],
        [97, 74],
        [102, 98],
        [10, 96],
      ].map(([x, y]) => (
        <path key={`${x}-${y}`} d={`M${x} ${y} l1.2 -3.4 l1 3 l1.5 -3.8 l0.8 4.2 Z`} fill={GRASS_DARK} />
      ))}
    </>
  )
}

/** はなと ちょうちょ(にぎやかし)。はなは 風で ゆれる */
function Flowers({ t }: SceneProps) {
  const sway = wave(t, 2.6) * 4
  const spots: readonly (readonly [number, number, string])[] = [
    [98, 28, '#ff8fa8'],
    [101, 60, '#ffd24a'],
    [95, 90, '#ff8fa8'],
    [6, 80, '#ffd24a'],
    [10, 12, '#ff8fa8'],
  ]
  return (
    <>
      {spots.map(([x, y, color]) => (
        <Layer key={`${x}-${y}`} x={x} y={y} rotate={sway}>
          <path d="M0 1 v5" stroke={LEAF_DARK} strokeWidth="1" strokeLinecap="round" />
          {[0, 72, 144, 216, 288].map((angle) => (
            <circle key={angle} cx={Math.sin((angle * Math.PI) / 180) * 2} cy={-Math.cos((angle * Math.PI) / 180) * 2} r="1.5" fill={color} />
          ))}
          <circle cx="0" cy="0" r="1.1" fill="#fff3c4" />
        </Layer>
      ))}
    </>
  )
}

function Butterfly({ t }: SceneProps) {
  const flap = 0.35 + 0.65 * Math.abs(wave(t, 0.34))
  const x = 12 + wave(t, 4.2) * 4
  const y = 40 + wave(t, 3.1, 0.7) * 5
  return (
    <Layer x={x} y={y}>
      <Layer scaleX={flap}>
        <ellipse cx="-2.6" cy="-1" rx="2.6" ry="2.2" fill="#c8a2f2" />
        <ellipse cx="2.6" cy="-1" rx="2.6" ry="2.2" fill="#c8a2f2" />
        <ellipse cx="-2" cy="1.8" rx="1.8" ry="1.5" fill="#a77fe0" />
        <ellipse cx="2" cy="1.8" rx="1.8" ry="1.5" fill="#a77fe0" />
      </Layer>
      <rect x="-0.4" y="-2.4" width="0.8" height="5.2" rx="0.4" fill="#5a3b2a" />
    </Layer>
  )
}

/** かわき かけた かわ そこ。小石が ころがっている */
function Riverbed() {
  return (
    <>
      <path d={CHANNEL} fill={SAND} />
      {[
        [40, 46],
        [70, 40],
        [75, 76],
        [42, 82],
        [60, 94],
        [36, 62],
      ].map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="2.4" ry="1.5" fill={PEBBLE} />
      ))}
    </>
  )
}

/** きし(1画目と3画目)。本来 その形の もの なので、画の線を そのまま つかう。かわの はし まで のびている */
function Banks({ t }: SceneProps) {
  const grow = span(t, 0.05, 0.8, easeOut)
  return (
    <>
      <Bone char={CHAR} n={1} color={BANK} width={5.4} to={grow} />
      <Bone char={CHAR} n={3} color={BANK} width={5.4} to={grow} />
      <g opacity={grow} fill="none" stroke={BANK} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.4 84.2 L13.6 91 L9.6 100 L6 109" />
        <path d="M27.2 25.7 L26.6 14" />
        <path d="M87.3 94.6 L87.3 110" />
        <path d="M85.6 15.6 L85.8 10" />
      </g>
    </>
  )
}

/** いわの おか と、そこから わく いずみ */
function Rocks({ t }: SceneProps) {
  const pop = span(t, 0.0, 0.5, backOut)
  const pool = span(t, SPRING, SPRING + 0.7, backOut)
  const bubble = Math.abs(wave(t, 0.5)) * 0.8
  return (
    <>
      <Layer scale={pop} origin={[55, 0]}>
        <path d="M14 -4 H96 V8 Q94 18 82 16.5 Q68 20 55 19 Q42 20 28 16.5 Q16 18 14 8 Z" fill={ROCK_DARK} />
        <path d="M14 -4 H96 V6 Q92 15 82 13.5 Q68 17 55 16 Q42 17 28 13.5 Q16 15 14 6 Z" fill={ROCK} />
        <circle cx="30" cy="7" r="5" fill={ROCK_LIGHT} />
        <circle cx="42" cy="3" r="4.2" fill={ROCK_LIGHT} />
        <circle cx="72" cy="4" r="4.6" fill={ROCK_LIGHT} />
        <circle cx="84" cy="9" r="4" fill={ROCK_LIGHT} />
      </Layer>
      {/* いずみ: ぷくぷく わく */}
      <ellipse cx={SPRING_AT[0]} cy={SPRING_AT[1] + 1} rx={7.6 * pool} ry={4.8 * pool} fill={WATER} />
      <ellipse cx={SPRING_AT[0] - 1.8} cy={SPRING_AT[1]} rx={2.2 * pool} ry={1.2 * pool} fill={WATER_LIGHT} />
      <circle cx={SPRING_AT[0] + 2} cy={SPRING_AT[1] - 1 - bubble * 2} r={(0.9 + bubble) * pool} fill={FOAM} />
    </>
  )
}

/** いずみから とびちる しずく */
function Droplets({ t }: SceneProps) {
  const p = span(t, SPRING + 0.35, FLOW + 0.5)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={Math.sin(p * Math.PI)}>
      {[-50, -22, 0, 22, 50].map((angle) => {
        const rad = (angle * Math.PI) / 180
        const dist = 3 + p * 11
        return <circle key={angle} cx={SPRING_AT[0] + Math.sin(rad) * dist} cy={SPRING_AT[1] + 3 + Math.cos(rad) * dist * 0.8 + p * p * 4} r={1.5 - p * 0.6} fill={WATER_LIGHT} />
      })}
    </g>
  )
}

/** かわの 左ふち(きし の線)の 点。上から 下へ (高さ, x) */
const LEFT_EDGE: readonly (readonly [number, number])[] = [
  [12, 26.4], [25.7, 27.2], [34.2, 28.4], [42.8, 28.3], [51.5, 27.7], [60, 26.5], [68.5, 24.6], [76.6, 21.7], [84.2, 17.4], [91, 13.6], [100, 9.6], [112, 5],
]
const RIGHT_EDGE = 87.4

/** 高さ y での 左ふち の x(点と点の あいだは まっすぐ つなぐ) */
function leftAt(y: number): number {
  const i = LEFT_EDGE.findIndex(([ey]) => ey >= y)
  if (i <= 0) return LEFT_EDGE[0][1]
  const [y0, x0] = LEFT_EDGE[i - 1]
  const [y1, x1] = LEFT_EDGE[i]
  return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0)
}

/** ながれる 水。きし の あいだ だけを、さき(先頭)が なみうちながら 下へ すすむ */
function River({ t }: SceneProps) {
  const front = frontAt(t)
  if (t < FLOW - 0.1) return null
  const left = leftAt(front)
  const wavy = Array.from({ length: 9 }, (_, i) => {
    const x = RIGHT_EDGE - ((RIGHT_EDGE - left) * i) / 8
    return `L${x} ${front + Math.sin(x * 0.35 + t * 6) * 1.6}`
  }).join(' ')
  const side = LEFT_EDGE.filter(([ey]) => ey < front)
    .reverse()
    .map(([ey, ex]) => `L${ex} ${ey}`)
    .join(' ')
  return (
    <>
      <path d={`M${LEFT_EDGE[0][1]} 12 L86 12 L${RIGHT_EDGE} 14 L${RIGHT_EDGE} ${front} ${wavy} ${side} Z`} fill={WATER} />
      {/* ながれる さざなみ: 小さな ゆるい 弧。上から 下へ ながれる */}
      {[
        [36, 4],
        [46, 40],
        [66, 18],
        [76, 58],
        [82, 30],
        [34, 70],
        [70, 76],
      ].map(([x, phase]) => {
        const y = 16 + ((phase + t * 11) % 92)
        const life = (y - 16) / 92
        if (y > front - 3 || x < leftAt(y) + 6) return null
        return <path key={`${x}-${phase}`} d={`M${x - 2.6} ${y} q2.6 -2.2 5.2 0`} fill="none" stroke={WATER_LIGHT} strokeWidth="1.2" strokeLinecap="round" opacity={Math.sin(life * Math.PI)} />
      })}
      {/* 2画目: 水の まんなかを ながれる あわの すじ。水の さき と いっしょに のびる */}
      <Bone char={CHAR} n={2} color={FOAM} width={2.8} to={(front - 23.6) / 52.3} opacity={0.9} />
    </>
  )
}

/** みずたまり: かわく まえの、さかなの いる ところ。水が くると かわの 水に のみこまれる */
function Puddle({ t }: SceneProps) {
  const shrink = 1 - 0.14 * span(t, 0, FLOW)
  return <ellipse cx={FISH_START[0]} cy={FISH_START[1] + 1} rx={11.5 * shrink} ry={7.6 * shrink} fill={WATER} />
}

/** 水に ういて ながれる 葉っぱ */
function FloatingLeaf({ t }: SceneProps) {
  const start = FLOW + 1.2
  const y = FRONT_FROM + 4 + (t - start) * 13
  if (t < start || y > frontAt(t) - 3 || t > INK + 0.4) return null
  const x = 72 + Math.sin((t - start) * 1.7) * 4
  return <path d="M0 -3.4 Q3 0 0 3.4 Q-3 0 0 -3.4 Z" fill={LEAF_LIGHT} stroke={LEAF_DARK} strokeWidth="0.5" transform={`translate(${x} ${y}) rotate(${Math.sin(t * 2) * 30 + 20})`} />
}

/** さかなの かお。上から 見たので 目は 頭の りょうがわ。気もちで 目と口を かえる */
function FishFace({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="-3.6" cy="7.6" r="1.7" fill={CHEEK} opacity="0.6" />
      <circle cx="3.6" cy="7.6" r="1.7" fill={CHEEK} opacity="0.6" />
      {mood === 'happy' ? (
        <>
          <path d="M-4.8 5.2 Q-3.2 3.2 -1.6 5.2" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M1.6 5.2 Q3.2 3.2 4.8 5.2" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M-1.6 8 Q0 10.2 1.6 8" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="-3.2" cy="5" r="1.3" fill={EYE} />
          <circle cx="3.2" cy="5" r="1.3" fill={EYE} />
          <circle cx="-2.8" cy="4.6" r="0.4" fill="#ffffff" />
          <circle cx="3.6" cy="4.6" r="0.4" fill="#ffffff" />
          {mood === 'sad' ? (
            <>
              <path d="M-5 3 l3.2 1" stroke={FISH_DARK} strokeWidth="0.9" strokeLinecap="round" />
              <path d="M5 3 l-3.2 1" stroke={FISH_DARK} strokeWidth="0.9" strokeLinecap="round" />
              <path d="M-1.4 9.4 Q0 8 1.4 9.4" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
            </>
          ) : (
            <ellipse cx="0" cy="8.6" rx="1.4" ry="1.7" fill={MOUTH} />
          )}
        </>
      )}
    </>
  )
}

/** さかな(上から 見た すがた)。頭が 下(すすむ むき)、おびれ が 上。 */
function Fish({ mood, tail }: { readonly mood: Mood; readonly tail: number }) {
  return (
    <>
      {/* おびれ: 体の うしろ(上)から ひろがる */}
      <Layer rotate={tail} origin={[0, -7]}>
        <path d="M0 -6 Q-7.5 -12 -7 -19 Q0 -15.5 7 -19 Q7.5 -12 0 -6 Z" fill={FISH_DARK} />
      </Layer>
      {/* むねびれ: 体の よこ */}
      <ellipse cx="-6.6" cy="1.4" rx="3.4" ry="1.9" fill={FISH_DARK} transform="rotate(32 -6.6 1.4)" />
      <ellipse cx="6.6" cy="1.4" rx="3.4" ry="1.9" fill={FISH_DARK} transform="rotate(-32 6.6 1.4)" />
      <ellipse cx="0" cy="0" rx="6.4" ry="10.4" fill={FISH} />
      <path d="M-4.8 -3 Q0 -6 4.8 -3 M-5.2 1 Q0 -2 5.2 1" fill="none" stroke={FISH_LIGHT} strokeWidth="1.1" strokeLinecap="round" />
      <FishFace mood={mood} />
    </>
  )
}

/** さかなが くるしくて かく あせ(みずたまり の間) */
function Sweat({ t }: SceneProps) {
  const show = during(t, 0.5, FLOW + 0.4, 0.2)
  if (show <= 0) return null
  const p = (t % 0.8) / 0.8
  return <path d="M0 -2.2 Q2 0.6 0 2 Q-2 0.6 0 -2.2 Z" fill={WATER_LIGHT} stroke={WATER} strokeWidth="0.4" opacity={show * (1 - p)} transform={`translate(${FISH_START[0] + 9} ${FISH_START[1] - 6 + p * 4})`} />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 3)

  const y = t < SWIM ? FISH_START[1] : fishY(t)
  const front = frontAt(t)
  const inWater = t >= FLOW && front > y + 6
  const mood: Mood = !inWater ? 'sad' : t < SWIM + 0.5 ? 'wow' : 'happy'

  // さかなの うごき: みずたまり では くるしくて ぴちぴち、水に のったら くねくね およぐ
  const swim = span(t, SWIM, SWIM + 0.5) * (1 - span(t, INK - 0.9, INK))
  const flop = t < FLOW + 0.3 ? wave(t, 0.5) * 9 * (1 - span(t, FLOW, FLOW + 0.3)) : 0
  const phase = (t - SWIM) * 1.8
  const x = FISH_START[0] + (FISH_END[0] - FISH_START[0]) * span(t, SWIM, INK + 0.2) + Math.sin(phase) * 4 * swim
  const heading = -Math.cos(phase) * 28 * swim + flop
  const tail = wave(t, swim > 0.05 ? 0.38 : 0.55) * (swim > 0.05 ? 20 : 12)

  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.05

  return (
    <>
      <Layer opacity={ink.picture}>
        <Layer opacity={span(t, 0, 0.4)}>
          <Ground />
          <Flowers t={t} />
          <Riverbed />
          <Puddle t={t} />
          <River t={t} />
          <Banks t={t} />
          <Rocks t={t} />
          <Butterfly t={t} />
        </Layer>
        <Droplets t={t} />
        <FloatingLeaf t={t} />
        <Layer opacity={span(t, 0.3, 0.6)}>
          <Layer x={x} y={y} rotate={heading}>
            <Fish mood={mood} tail={tail} />
          </Layer>
          <Sweat t={t} />
        </Layer>
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
    { at: 0, label: 'かわいた かわ。さかなが みずたまり で こまっている', sound: 'pop' },
    { at: SPRING, label: 'いわの あいだから いずみが わく' },
    { at: FLOW, label: '水が ながれだして、さかなが びっくり', sound: 'pop' },
    { at: SWIM, label: 'さかなが うれしそうに 水に のって およぐ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '川 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
