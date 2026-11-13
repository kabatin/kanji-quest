/*
 * 活(かつ): わき水が いきおいよく ながれて、しおれた はちうえが 元気になる。
 *
 * ほね(画と絵の対応)
 *   1・2画目(氵の 上の2つ) … わき水から とびちる しぶき(下むきに 切れた、しずくの形)
 *   3画目(氵の 3つめ)    … 岩の あいだから わきだす 水の はじまり(下から 右うえへ)
 *   4画目(ノ)            … くきの てっぺんの 小さな 葉(ふたば)
 *   5画目(一)            … くきから 左右に ひろがる 大きな 葉
 *   6画目(丨)            … はちうえの くき
 *   7・8・9画目(口)      … はちうえの はち(少し 下が せまい かたち)
 *
 * ながれ
 *   あつい日。はちうえが 水が なくて ぐったり(葉は たれ、くきは まがり、顔も つらそう)
 *   → 左の岩が ごろごろ ふるえて、ぼこっ と水が わき出す。はちうえが 気づく
 *   → 水が ざあっ と 弧を えがいて はち に そそぐ。土が しめって、はちうえが 目をまるくして ごくごく
 *   → くきが ぴん と のび、葉が ひらいて 元気に! にこにこで ぴょんぴょん はねる(ちょうちょも くる)
 *   → ほね が ひかって、絵が うすくなり、字「活」が のこる
 *
 * ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   水は 岩から 出て、山なりに とび、重さで まっすぐ 下へ おちる。
 *   葉は くき の ふし から 左右に 出る。水が たりないと 葉は たれて、くきは 重みで まがる。
 *   はちは 下が せまい ふつうの うえ木ばち。
 */
import { backOut, during, easeOut, inkTiming, pose, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '活'

const SUN = '#ffd24a'
const GRASS = '#c5e8a9'
const HILL = '#e2f2d2'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const STEM = '#4c9a5a'
const DRY = '#c4b96e'
const DRY_DARK = '#a39a52'
const DRY_STEM = '#a39a5c'
const POT = '#d9774a'
const POT_DARK = '#c0653a'
const POT_RIM = '#e8935f'
const SOIL_DRY = '#d2b48c'
const SOIL_WET = '#5e4030'
const ROCK = '#a7b0ba'
const ROCK_DARK = '#8b95a1'
const ROCK_LIGHT = '#c6cdd5'
const MOSS = '#7fb36a'
const WATER = '#7cc4f2'
const WATER_DARK = '#56aae6'
const WATER_LIGHT = '#e8f6ff'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const TONGUE = '#ff8a8a'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const POP = 0.6
/** 岩が ごろごろ ふるえはじめる */
const RUMBLE = 1.7
/** 水が ぼこっ と わき出して、弧を のばしはじめる */
const BURST = 2.6
/** 水が はちに とどく */
const ARRIVE = 3.8
/** はちうえが 元気を とりもどす */
const REVIVE = 4.4
const REVIVED = 6.1
const INK = 6.5
const DONE = 9.5
const DURATION = 10

type Point = readonly [number, number]

/** はちの 土の ところ(くき の もと) */
const STEM_BASE: Point = [65.7, 67]
/** くき の ふくらみ(のびた とき、ふし が 5画目の 高さに くる) */
const STEM_CTRL: Point = [66.9, 49.5]
/** のびた ときの くき の てっぺん(4画目の 葉の つけね) */
const STEM_TOP: Point = [63.3, 24]
/** しおれると、てっぺんは この ぶん だけ 右下へ たおれる */
const STEM_FLOP: Point = [17, 14]
/** 水の とび方: 岩の あな から はじまり、はち の 左がわ の 土へ おちる */
const JET = 'M16 84 C26 62 46 46 54 56 C56.5 59 57 62 57 65.4'

const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1)
const rad = (deg: number) => (deg * Math.PI) / 180

/** くき の 点(s = 0 もと 〜 1 てっぺん)。2次の まがり線。 */
function stemPoint(s: number, top: Point): Point {
  const a = (1 - s) ** 2
  const b = 2 * s * (1 - s)
  const c = s ** 2
  return [a * STEM_BASE[0] + b * STEM_CTRL[0] + c * top[0], a * STEM_BASE[1] + b * STEM_CTRL[1] + c * top[1]]
}

function Ground() {
  return (
    <>
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill={HILL} />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[40, 90, 102].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 空の お日さま(あつい日)。ゆっくり まわる。 */
function Sun({ t }: SceneProps) {
  const rise = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={rise} rotate={t * 14} origin={[99, 12]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="98.2" y="0.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 99 12)`} />
        ))}
      </Layer>
      <circle cx="99" cy="12" r={6.2 * rise} fill={SUN} />
    </>
  )
}

/** 水の わきでる 岩。ふるえて、水が ぼこっ と もりあがる。 */
function Rock({ t }: SceneProps) {
  const shake = wave(t, 0.14) * 0.9 * during(t, RUMBLE, BURST + 0.25, 0.15)
  const bulge = span(t, BURST - 0.25, BURST + 0.15, backOut)
  return (
    <Layer rotate={shake} origin={[15, 98]}>
      <path d="M1 98 Q3 84 13 81.5 Q18 80.3 23 82 Q29 86 30 98 Z" fill={ROCK} />
      <path d="M13 81.5 Q18 80.3 23 82 Q26 84 27.5 90 Q20 86 13 81.5 Z" fill={ROCK_LIGHT} />
      <path d="M1.4 94 Q2 90 4.5 87 Q8 94 12 98 H1 Z" fill={ROCK_DARK} />
      <path d="M22 98 Q27 92 29 86 Q30 92 30 98 Z" fill={ROCK_DARK} />
      <ellipse cx="9" cy="85.6" rx="3.6" ry="1.8" fill={MOSS} />
      <ellipse cx="16" cy="82.6" rx="3" ry="1.5" fill="#6b7783" />
      <ellipse cx="16" cy="82.2" rx={3 * Math.max(0, bulge)} ry={2.6 * Math.max(0, bulge)} fill={WATER} />
    </Layer>
  )
}

/** わき出た 水の 弧。のびて はち に とどき、そのあとは ながれ つづける。 */
function Jet({ t }: SceneProps) {
  const grow = span(t, BURST, ARRIVE, easeOut)
  if (grow <= 0) return null
  const flowing = grow >= 1
  return (
    <>
      <path d={JET} fill="none" stroke={WATER_DARK} strokeWidth="5.4" strokeLinecap="round" pathLength={1} strokeDasharray={`${grow} 2`} />
      <path d={JET} fill="none" stroke={WATER} strokeWidth="4" strokeLinecap="round" pathLength={1} strokeDasharray={`${grow} 2`} />
      {flowing && <path d={JET} fill="none" stroke={WATER_LIGHT} strokeWidth="1.3" strokeLinecap="round" pathLength={1} strokeDasharray="0.05 0.1" strokeDashoffset={-t * 0.6} opacity="0.85" />}
    </>
  )
}

/** しぶき。水の 弧から とびちって、右下へ おちる しずく(1・2画目の ならび)。 */
function SprayDrop({ t, cx, cy, tilt, phase }: SceneProps & { readonly cx: number; readonly cy: number; readonly tilt: number; readonly phase: number }) {
  const show = span(t, BURST + 0.3, BURST + 0.8)
  if (show <= 0) return null
  // くり返し おちる。字になる しゅんかん(INK + 0.1)に、ちょうど 画の いちに くる
  const cycle = 1.5
  const p = (((t - (INK + 0.1) - phase) / cycle + 0.5) % 1 + 1) % 1
  const slide = (p - 0.5) * 20
  const dx = Math.sin(rad(-tilt)) * -1
  const dy = Math.cos(rad(-tilt))
  const x = cx + dx * slide
  const y = cy + dy * slide
  return (
    <g transform={pose({ x, y, rotate: tilt })} opacity={Math.sin(p * Math.PI) * show}>
      <path d="M0 -7 C1 -3 3.2 -0.8 3.2 2.6 A3.2 3.2 0 0 1 -3.2 2.6 C-3.2 -0.8 -1 -3 0 -7 Z" fill={WATER} />
      <ellipse cx="-1.1" cy="2.2" rx="0.8" ry="1.3" fill={WATER_LIGHT} />
    </g>
  )
}

/** 水が 土に おちる ところの しぶき。 */
function PourSplash({ t }: SceneProps) {
  const on = span(t, ARRIVE - 0.1, ARRIVE + 0.2) * (1 - span(t, INK + 0.4, INK + 0.9))
  if (on <= 0) return null
  return (
    <g opacity={on}>
      {[0, 0.5, 0.25].map((offset, i) => {
        const p = ((t + offset) % 0.75) / 0.75
        const dir = i - 1
        return <circle key={offset} cx={57 + dir * 4.4 * p} cy={65.4 - Math.sin(p * Math.PI) * 5} r={1.1 * (1 - p * 0.4)} fill={WATER_LIGHT} opacity={1 - p} />
      })}
      <ellipse cx="57" cy="65.8" rx={2.6 + wave(t, 0.3) * 0.5} ry="0.9" fill={WATER_LIGHT} opacity="0.9" />
    </g>
  )
}

/** 葉。+x むきに かく(つけね が 0,0)。dry = しおれた色 / green = 元気な色の こさ */
function Leaf({ px, py, angle, length, half, green, flip }: { readonly px: number; readonly py: number; readonly angle: number; readonly length: number; readonly half: number; readonly green: number; readonly flip?: boolean }) {
  const up = `M0 0 Q${length * 0.4} ${-half * 2} ${length} 0 Z`
  const down = `M0 0 Q${length * 0.4} ${half * 2} ${length} 0 Z`
  return (
    <g transform={pose({ x: px, y: py, rotate: angle, scaleY: flip ? -1 : 1 })}>
      <path d={up} fill={DRY} />
      <path d={down} fill={DRY_DARK} />
      <g opacity={green}>
        <path d={up} fill={LEAF} />
        <path d={down} fill={LEAF_DARK} />
        <path d={`M0.6 0 L${length * 0.85} 0`} stroke={LEAF_LIGHT} strokeWidth="0.7" strokeLinecap="round" />
      </g>
    </g>
  )
}

/** はちうえ の ぶぶん(くき・葉)。wilt: 1 = しおれ / 0 = ぴん。 */
function Plant({ wilt, flutter }: { readonly wilt: number; readonly flutter: number }) {
  const w = Math.max(wilt, -0.15)
  const green = clamp01(1 - w)
  const top: Point = [STEM_TOP[0] + STEM_FLOP[0] * w, STEM_TOP[1] + STEM_FLOP[1] * w]
  const node = stemPoint(0.5, top)
  // しおれると 葉は ちぢんで、たれる
  const shrink = 0.8 + 0.2 * (1 - w)
  const stemD = `M${STEM_BASE[0]} ${STEM_BASE[1]} Q${STEM_CTRL[0]} ${STEM_CTRL[1]} ${top[0]} ${top[1]}`
  return (
    <>
      <path d={stemD} fill="none" stroke={DRY_STEM} strokeWidth="3.2" strokeLinecap="round" />
      <path d={stemD} fill="none" stroke={STEM} strokeWidth="3.2" strokeLinecap="round" opacity={green} />
      {/* 大きな 葉(5画目): 左右に ひろがる。たれると 下へ */}
      <Leaf px={node[0]} py={node[1]} angle={177.2 - 55 * w - flutter} length={29.1 * shrink} half={3.7} green={green} flip />
      <Leaf px={node[0]} py={node[1]} angle={-3.7 + 55 * w + flutter} length={29.5 * shrink} half={3.7} green={green} />
      {/* てっぺんの 小さな 葉(4画目): 右うえ と 左した */}
      <Leaf px={top[0]} py={top[1]} angle={164.3 - 70 * w - flutter} length={22.1 * shrink} half={3.4} green={green} flip />
      <Leaf px={top[0]} py={top[1]} angle={-31.5 + 90 * w + flutter} length={17.2 * shrink} half={3.2} green={green} />
    </>
  )
}

type Mood = 'tired' | 'hope' | 'happy'

/** はち の 顔。つらい → 目を まるく(わくわく) → にこにこ */
function PotFace({ mood }: { readonly mood: Mood }) {
  return (
    <>
      {mood === 'tired' && (
        <>
          <path d="M54.5 77.4 l5.4 -1.8 M77.5 77.4 l-5.4 -1.8" stroke={POT_DARK} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M55.8 80 h5 M71.2 80 h5" stroke={EYE} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M62 86.4 q4 -2.8 8 0" fill="none" stroke={MOUTH} strokeWidth="1.3" strokeLinecap="round" />
        </>
      )}
      {mood === 'hope' && (
        <>
          <circle cx="58.4" cy="79.6" r="2.5" fill="#ffffff" />
          <circle cx="73.6" cy="79.6" r="2.5" fill="#ffffff" />
          <circle cx="57.4" cy="79.8" r="1.4" fill={EYE} />
          <circle cx="72.6" cy="79.8" r="1.4" fill={EYE} />
          <ellipse cx="66" cy="85.6" rx="1.7" ry="2" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M55.8 80.6 q2.6 -3.4 5.2 0 M71 80.6 q2.6 -3.4 5.2 0" fill="none" stroke={EYE} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M60.8 83.4 Q66 90.6 71.2 83.4 Z" fill={MOUTH} />
          <path d="M63 86.6 Q66 88.8 69 86.6 Q66 85.4 63 86.6 Z" fill={TONGUE} />
          <circle cx="54.2" cy="84" r="2.1" fill={CHEEK} opacity="0.6" />
          <circle cx="77.8" cy="84" r="2.1" fill={CHEEK} opacity="0.6" />
        </>
      )}
    </>
  )
}

/** はち(7・8・9画目の 口)。下が 少し せまい。土は 水で こくなる。 */
function Pot({ mood, wet }: { readonly mood: Mood; readonly wet: number }) {
  return (
    <>
      <path d="M47.5 71 H85 L82.8 92 Q82.6 93.6 81 93.6 H53 Q51.4 93.6 51.2 92 Z" fill={POT} />
      <path d="M78 71 H85 L82.8 92 Q82.6 93.6 81 93.6 H76 Z" fill={POT_DARK} />
      <rect x="45.5" y="65.5" width="42" height="6.5" rx="2.6" fill={POT_RIM} />
      <ellipse cx="66" cy="66" rx="19" ry="2.2" fill={SOIL_DRY} />
      <ellipse cx="66" cy="66" rx="19" ry="2.2" fill={SOIL_WET} opacity={wet} />
      <PotFace mood={mood} />
    </>
  )
}

/** あつくて でる あせ。はち の 右がわ から とんで おちる。 */
function Sweat({ t }: SceneProps) {
  const show = during(t, 0.7, RUMBLE + 0.3, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.45].map((offset) => {
        const p = ((t + offset) % 0.9) / 0.9
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill={WATER} transform={`translate(${88 + p * 4} ${72 + p * 9 - Math.sin(p * Math.PI) * 4}) rotate(30)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** 元気になった あとに ひらひら とんでくる ちょうちょ。 */
function Butterfly({ t }: SceneProps) {
  const come = span(t, 5.0, 6.3, easeOut)
  if (come <= 0) return null
  const x = 114 - 24 * come + Math.sin(t * 3) * 2
  const y = 20 + 15 * come + wave(t, 0.9) * 2
  const flap = 0.35 + 0.65 * Math.abs(wave(t, 0.28))
  return (
    <g transform={`translate(${x} ${y})`}>
      <g transform={`scale(${flap} 1)`}>
        <ellipse cx="-2.6" cy="-1.4" rx="2.8" ry="2.2" fill="#f28fb0" />
        <ellipse cx="2.6" cy="-1.4" rx="2.8" ry="2.2" fill="#f28fb0" />
        <ellipse cx="-2" cy="1.6" rx="2" ry="1.6" fill="#f7b4cb" />
        <ellipse cx="2" cy="1.6" rx="2" ry="1.6" fill="#f7b4cb" />
      </g>
      <rect x="-0.5" y="-2.6" width="1" height="5.6" rx="0.5" fill="#5a3b2a" />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 9)
  const pop = span(t, 0, POP, backOut)
  const mood: Mood = t < RUMBLE ? 'tired' : t < ARRIVE ? 'hope' : 'happy'
  // 水を のむと、土が しめる。水を のんで はちうえが しゃきっと する(行きすぎて もどる)
  const wet = span(t, ARRIVE, ARRIVE + 1.2)
  const wilt = 1 - span(t, REVIVE, REVIVED, backOut)
  const flutter = wave(t, 0.5) * 4 * span(t, REVIVE + 0.2, REVIVE + 0.6) * (1 - span(t, REVIVED - 0.2, REVIVED + 0.6))
  // うれしくて ぴょんぴょん(字になる まえに おちつく)
  const hopPower = during(t, REVIVE + 0.3, REVIVED + 0.6, 0.2)
  const hop = -Math.abs(wave(t - REVIVE, 0.55)) * 2.6 * hopPower
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Sun t={t} />
        <Ground />
        <Rock t={t} />
        <Jet t={t} />
        <SprayDrop t={t} cx={27.2} cy={22.5} tilt={-52} phase={0} />
        <SprayDrop t={t} cx={21.6} cy={49.4} tilt={-58} phase={0.45} />
        <ellipse cx="66" cy="97.4" rx={21 * pop} ry="2.6" fill="#000000" opacity="0.12" />
        <Layer y={hop} scale={pop} origin={[66, 97]}>
          <Plant wilt={wilt} flutter={flutter} />
          <Pot mood={mood} wet={wet} />
          <Sweat t={t} />
        </Layer>
        <PourSplash t={t} />
        <Butterfly t={t} />
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
    { at: 0, label: 'あつい日。はちうえが 水が なくて ぐったり', sound: 'pop' },
    { at: RUMBLE, label: '岩が ごろごろ ふるえる。はちうえが 気づく' },
    { at: BURST, label: 'ぼこっ! わき水が いきおいよく とびだす', sound: 'tap' },
    { at: ARRIVE, label: '水が はちに そそぐ。ごくごく' },
    { at: REVIVE, label: 'くきが ぴん! 葉が ひらいて 元気に はねる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '活 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
