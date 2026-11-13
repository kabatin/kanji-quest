/*
 * 西(にし): 鳥の巣の形。夕方、ことりが 巣に かえる。おひさまが しずむ ほうが 西。
 *
 * ほね(画と絵の対応)
 *   1画目(一)    … 木の えだ(左の みき から のびて、巣を つるす)
 *   4・5画目の 上 … 巣を えだから つるす 2本の なわ(わら)
 *   2・3・6画目  … 巣の かご。左の かべ・上の ふち(と 右の かべ)・そこ
 *   4・5画目の 下 … かごの 中へ つづく、わらの あみ目
 *
 * ながれ
 *   夕ぐれ。えだから 巣が ぶらさがる。おひさまが 右へ かたむく
 *   → ことりが 空を いそいで とぶ(ひが くれそうで しんぱい)
 *   → 巣を 見つけて「!」。ほっとして とびこむ
 *   → 巣の中で ぐっすり(おひさまは 西へ しずみ、星が出る)
 *   → 巣の かご が 光って、絵が うすくなり、字「西」が のこる
 *
 * ことりは ほんものの つくり を守る(まるい体、はね は 左右の かた から、くちばしは 顔の まんなか)。
 * 巣は 上が ひらいた かご。ことりの 体の 下半分は かご の かげに かくれる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '西'

const BARK = '#8c5b3c'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const ROPE = '#a07a4a'
const STRAW = '#e6b960'
const STRAW_DARK = '#b97f3a'
const STRAW_LIGHT = '#f3d48c'
const BIRD = '#d9954f'
const BIRD_DARK = '#b3743c'
const BIRD_BELLY = '#f7e6c8'
const BEAK = '#f2a02e'
const EYE = '#2b2b2b'
const CHEEK = '#ff9d9d'
const ALERT = '#ff7a4d'

/** くぎり の時間(秒) */
const FLY = 1.0
/** 巣を 見つける */
const SEE = 1.9
/** 巣の ま上に ついて、おりはじめる */
const ARRIVE = 3.5
const SETTLE = 4.3
const SLEEP = 4.7
const INK = 6.9
const DONE = 9.9
const DURATION = 10.5

/** 巣の かご の ひろがり。上の ふち は 3画目の よこ線(y 47) */
const NEST_TOP = 45
/** なわ を つるす えだ の高さ(巣が ぶらさがる じく) */
const HANG: readonly [number, number] = [52, 24]
/** ことりの 体の はんけい */
const BIRD_R = 8.5
/** 主役が 小さく見えないよう、ことり ぜんたいを 少し 大きくする */
const BIRD_SCALE = 1.15
/** 巣に とまった ときの ことりの 中心(頭が かご の ふち から 出る) */
const SEAT: readonly [number, number] = [52, 37.5]

/** 16進の 色を、k(0〜1)の ぶんだけ もう1つの色へ ちかづける */
function tint(from: string, to: string, k: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
  const part = (i: number) =>
    Math.round(channel(from, i) + (channel(to, i) - channel(from, i)) * k)
      .toString(16)
      .padStart(2, '0')
  return `#${part(0)}${part(1)}${part(2)}`
}

/** ひるから 夕ぐれへ すすんだ度合い(0〜1) */
const dusk = (t: number) => span(t, 0.5, 5.6, easeInOut)

/* ───────── 空・おひさま・地面 ───────── */

function Sky({ t }: SceneProps) {
  const k = dusk(t)
  const top = tint('#8fd3f5', '#6f6fc8', k)
  const mid = tint('#c4e9fa', '#e79aa0', k)
  const low = tint('#e6f6fd', '#ffb36b', k)
  return (
    <>
      <rect x="0" y="0" width="109" height="109" fill={low} />
      <rect x="0" y="0" width="109" height="70" fill={mid} />
      <rect x="0" y="0" width="109" height="42" fill={top} />
      <rect x="0" y="36" width="109" height="8" fill={mid} opacity="0.5" />
      <rect x="0" y="64" width="109" height="8" fill={low} opacity="0.5" />
    </>
  )
}

/** 右がわの 空で、おひさまが しずむ(西) */
function Sun({ t }: SceneProps) {
  const k = dusk(t)
  const appear = span(t, 0, 0.6, easeOut)
  const y = mix(t, 0.4, 5.6, 32, 95, easeInOut)
  const color = tint('#ffd24a', '#ff7a3c', k)
  return (
    <>
      <circle cx="97" cy={y} r={14 * appear} fill={color} opacity="0.3" />
      <circle cx="97" cy={y} r={8 * appear} fill={color} />
    </>
  )
}

function Clouds({ t }: SceneProps) {
  const color = tint('#ffffff', '#ffc2b0', dusk(t))
  return (
    <g fill={color} opacity="0.9">
      <g transform={`translate(${-t * 0.8} 0)`}>
        <ellipse cx="9" cy="40" rx="7" ry="3.2" />
        <ellipse cx="13.5" cy="38.2" rx="4.4" ry="3" />
      </g>
      <g transform={`translate(${-t * 0.6} 0)`}>
        <ellipse cx="100" cy="62" rx="6" ry="2.6" />
        <ellipse cx="103.5" cy="60.6" rx="3.6" ry="2.6" />
      </g>
    </g>
  )
}

function Hills({ t }: SceneProps) {
  const k = dusk(t)
  return (
    <>
      <path d="M52 100 Q80 80 113 82 V101 H52 Z" fill={tint('#cfe6b9', '#8aa070', k)} />
      <path d="M-4 90 Q22 82 52 97 V101 H-4 Z" fill={tint('#e2f2d2', '#a3b88a', k)} />
      <ellipse cx="54.5" cy="99" rx="55" ry="5" fill={tint('#c5e8a9', '#8fae72', k)} />
    </>
  )
}

/** 夕ぐれの 空に 出る 星 */
function Stars({ t }: SceneProps) {
  const show = span(t, 4.8, 6.0)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {(
        [
          [8, 10, 2.2],
          [99, 9, 2.6],
          [105, 40, 1.8],
          [9, 58, 1.8],
        ] as const
      ).map(([cx, cy, r], i) => (
        <Star key={i} cx={cx} cy={cy} r={r * (0.85 + 0.15 * wave(t, 1.3, i * 0.4))} color="#fff3b0" />
      ))}
    </g>
  )
}

/** とおくで、ほかの 鳥も 家へ かえっていく */
function Flock({ t }: SceneProps) {
  const x = 116 - t * 13
  return (
    <g fill="none" stroke="#6a5a78" strokeWidth="0.9" strokeLinecap="round" opacity="0.75">
      {[
        [0, 9, 0],
        [9, 13, 0.3],
        [-8, 6, 0.6],
      ].map(([dx, y, phase], i) => {
        const flap = 0.5 + 0.5 * wave(t, 0.5, phase)
        return <path key={i} d={`M${x + dx - 3} ${y - flap * 1.4} Q${x + dx - 1.2} ${y - 0.6 - flap} ${x + dx} ${y} Q${x + dx + 1.2} ${y - 0.6 - flap} ${x + dx + 3} ${y - flap * 1.4}`} />
      })}
    </g>
  )
}

/* ───────── 木の えだ と 巣 ───────── */

/** えだ: 左の みき から のびる。1画目の 線を ほね にする */
function Branch({ t }: SceneProps) {
  const grow = span(t, 0, 0.6, backOut)
  return (
    <Layer scaleX={grow} origin={[-8, 24]}>
      <path d="M-8 21 Q8 24.6 22 24.2" fill="none" stroke={BARK} strokeWidth="5.4" strokeLinecap="round" />
      <Bone char={CHAR} n={1} color={BARK} width={5.2} />
      {/* 葉 */}
      {(
        [
          [12, 19.5, 4.2],
          [28, 19, 4],
          [46, 17.8, 4.6],
          [64, 17.4, 4.2],
          [82, 18.4, 4.4],
        ] as const
      ).map(([cx, cy, r]) => (
        <g key={cx}>
          <circle cx={cx} cy={cy} r={r} fill={LEAF_DARK} />
          <circle cx={cx - 0.8} cy={cy - 1} r={r * 0.68} fill={LEAF} />
        </g>
      ))}
    </Layer>
  )
}

/** 巣を つるす 2本の なわ。かご の ふち より 上だけ 見える */
function Ropes() {
  return (
    <g clipPath="url(#ropeClip897f)">
      <defs>
        <clipPath id="ropeClip897f">
          <rect x="0" y="0" width="109" height={NEST_TOP + 2} />
        </clipPath>
      </defs>
      <Bone char={CHAR} n={4} color={ROPE} width={2.4} />
      <Bone char={CHAR} n={5} color={ROPE} width={2.4} />
    </g>
  )
}

/** 巣の かご(手まえ)。ことりの 下半分を かくす */
function NestFront() {
  return (
    <>
      <path d="M20 47 C40 46 70 45 85 45 C91 45 91.5 51 90.5 57 L84 90 L27 90 Z" fill={STRAW} stroke={STRAW} strokeWidth="3" strokeLinejoin="round" />
      {/* わらの あみ目(ななめの ちいさな しるし) */}
      <g stroke={STRAW_LIGHT} strokeWidth="1.2" strokeLinecap="round" opacity="0.85">
        {[56, 66, 76].flatMap((y, row) =>
          [31, 43, 55, 67, 78].map((x) => <path key={`${row}-${x}`} d={`M${x + (row % 2) * 5} ${y} l2.4 -2.4`} />),
        )}
      </g>
      {/* ふち と そこ と かべ(2・3・6画目)、中の わら(4・5画目の 下) */}
      <Bone char={CHAR} n={2} color={STRAW_DARK} width={4.6} />
      <Bone char={CHAR} n={3} color={STRAW_DARK} width={4.6} />
      <Bone char={CHAR} n={6} color={STRAW_DARK} width={4.6} />
      <g clipPath="url(#weaveClip897f)">
        <defs>
          <clipPath id="weaveClip897f">
            <rect x="0" y={NEST_TOP + 3} width="109" height="60" />
          </clipPath>
        </defs>
        <Bone char={CHAR} n={4} color={STRAW_DARK} width={2.6} />
        <Bone char={CHAR} n={5} color={STRAW_DARK} width={2.6} />
      </g>
    </>
  )
}

/* ───────── ことり(主役) ───────── */

type Mood = 'worried' | 'hopeful' | 'relieved' | 'asleep'

type BirdProps = {
  readonly mood: Mood
  /** 顔の むき(-1 左 〜 1 右)。とぶ ほうへ 向く */
  readonly look: number
  /** はばたき の 角度(0 = たたんでいる) */
  readonly flap: number
  /** ねむる いき(-1〜1) */
  readonly breath: number
}

function Eyes({ mood, look }: { readonly mood: Mood; readonly look: number }) {
  const xs = [-3.4 + look * 0.9, 3.4 + look * 0.9]
  if (mood === 'asleep')
    return (
      <g fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round">
        {xs.map((x) => (
          <path key={x} d={`M${x - 1.6} -1.6 Q${x} 0.4 ${x + 1.6} -1.6`} />
        ))}
      </g>
    )
  if (mood === 'relieved')
    return (
      <g fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round">
        {xs.map((x) => (
          <path key={x} d={`M${x - 1.6} -0.4 Q${x} -2.6 ${x + 1.6} -0.4`} />
        ))}
      </g>
    )
  const big = mood === 'hopeful'
  return (
    <>
      {xs.map((x) => (
        <g key={x}>
          <circle cx={x} cy={-1.2} r={big ? 1.6 : 1.2} fill={EYE} />
          {big && <circle cx={x + 0.5} cy={-1.8} r="0.5" fill="#ffffff" />}
        </g>
      ))}
      {mood === 'worried' && (
        <g fill="none" stroke={EYE} strokeWidth="0.9" strokeLinecap="round">
          <path d={`M${xs[0] - 2} -3.4 L${xs[0] + 1.4} -4.8`} />
          <path d={`M${xs[1] + 2} -3.4 L${xs[1] - 1.4} -4.8`} />
        </g>
      )}
    </>
  )
}

/** はね: かた(体の よこ)から出る。angle 0 で 体に そって たれ、おおきいほど 外へ ひらく */
function Wing({ side, angle }: { readonly side: 1 | -1; readonly angle: number }) {
  return (
    <Layer rotate={side * angle} origin={[side * 7, -1]}>
      <ellipse cx={side * 8} cy="5" rx="3.2" ry="6.8" fill={BIRD_DARK} />
    </Layer>
  )
}

function Bird({ mood, look, flap, breath }: BirdProps) {
  const sweat = mood === 'worried'
  return (
    <Layer scaleX={1 + breath * 0.025} scaleY={1 + breath * 0.04} origin={[0, 8]}>
      {/* 尾 */}
      <path d="M-3.2 6.5 L0 13.5 L3.2 6.5 Z" fill={BIRD_DARK} />
      <circle cx="0" cy="0" r={BIRD_R} fill={BIRD} />
      <ellipse cx="0" cy="3.4" rx="5.4" ry="4.4" fill={BIRD_BELLY} />
      {/* あたまの 小さな はね */}
      <path d="M-1.6 -7.6 Q-0.4 -11.4 1.8 -7.4" fill="none" stroke={BIRD_DARK} strokeWidth="1.3" strokeLinecap="round" />
      <Wing side={-1} angle={flap} />
      <Wing side={1} angle={flap} />
      <circle cx={-5.6 + look * 0.9} cy="1.6" r="1.5" fill={CHEEK} opacity="0.6" />
      <circle cx={5.6 + look * 0.9} cy="1.6" r="1.5" fill={CHEEK} opacity="0.6" />
      <Eyes mood={mood} look={look} />
      <path d={`M${-1.7 + look * 0.8} 1.4 L${1.7 + look * 0.8} 1.4 L${look * 0.8} 4 Z`} fill={BEAK} strokeLinejoin="round" stroke={BEAK} strokeWidth="0.6" />
      {sweat && <path d="M7.4 -7.6 Q9 -5.2 7.4 -4 Q5.8 -5.2 7.4 -7.6 Z" fill="#7cc4f2" />}
    </Layer>
  )
}

/** 「!」: 巣を 見つけた */
function Alert({ t, x, y }: SceneProps & { readonly x: number; readonly y: number }) {
  const show = during(t, SEE - 0.05, SEE + 0.7, 0.15)
  if (show <= 0) return null
  const pop = span(t, SEE - 0.05, SEE + 0.25, backOut)
  return (
    <Layer x={x + 9} y={y - 13} scale={pop} origin={[0, 3]} opacity={show}>
      <rect x="-0.9" y="-3" width="1.8" height="4.4" rx="0.9" fill={ALERT} />
      <circle cx="0" cy="3" r="1" fill={ALERT} />
    </Layer>
  )
}

/** ぐっすり ねむる「z」 */
function Zzz({ t }: SceneProps) {
  const show = during(t, SLEEP + 0.1, INK - 0.1, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show} fill="#5f7fd6" fontWeight="700" fontFamily="inherit">
      {[0, 0.6, 1.2].map((offset, i) => {
        const p = ((t - SLEEP + offset) % 1.8) / 1.8
        return (
          <text key={offset} x={62 + p * 9 + Math.sin(p * 7) * 1.1} y={34 - p * 9} fontSize={3.8 + i * 1.1 + p * 1.8} opacity={Math.sin(p * Math.PI)}>
            z
          </text>
        )
      })}
    </g>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  // 巣: 先に えだ から ぶらさがる。ことりが とびこむと すこし ゆれて しずむ
  const unfurl = span(t, 0.3, 1.0, backOut)
  const settle = span(t, ARRIVE + 0.5, SETTLE)
  const calm = 1 - span(t, INK - 0.6, INK)
  const dip = Math.sin(settle * Math.PI) * 1.3 * (t < SETTLE ? 1 : 1)
  const ring = t >= SETTLE ? Math.sin((t - SETTLE) * 9) * Math.max(0, 1 - (t - SETTLE) / 1.1) * 1.1 : 0
  const sway = (wave(t, 3.2) * 0.5 + ring) * calm
  const nestProps = { scale: unfurl, rotate: sway, y: dip, origin: HANG } as const

  // ことり: 左うえから、えだ の まえを よこぎって、巣の ま上へ。そこから かごの 中へ おりる
  const fly = span(t, FLY, ARRIVE, (x) => 1 - (1 - x) ** 2)
  const drop = span(t, ARRIVE, SETTLE, easeInOut)
  const birdX = mix(t, FLY, ARRIVE, -14, SEAT[0], (x) => 1 - (1 - x) ** 2)
  const hover = SEAT[1] - 3.5
  const cruiseY = 17 + (hover - 17) * fly + Math.sin(fly * Math.PI * 3.4) * 2.4 * (1 - fly)
  const birdY = t < ARRIVE ? cruiseY : hover + (SEAT[1] - hover) * drop + dip
  const flapAmp = 1 - span(t, ARRIVE + 0.3, SETTLE + 0.1)
  const flap = 12 + (60 + 48 * wave(t, 0.26)) * flapAmp * (t >= FLY ? 1 : 0)
  const mood: Mood = t < SEE ? 'worried' : t < SETTLE ? 'hopeful' : t < SLEEP ? 'relieved' : 'asleep'
  const look = t < ARRIVE ? 1 : mix(t, ARRIVE, ARRIVE + 0.4, 1, 0)
  const breath = t >= SLEEP ? wave(t - SLEEP, 1.8) * span(t, SLEEP, SLEEP + 0.4) : 0
  const onStage = t >= FLY

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Sun t={t} />
        <Clouds t={t} />
        <Stars t={t} />
        <Flock t={t} />
        <Hills t={t} />
        <Branch t={t} />
        <Layer {...nestProps}>
          <Ropes />
        </Layer>
        {onStage && (
          <Layer x={birdX} y={birdY} scale={BIRD_SCALE}>
            <Bird mood={mood} look={look} flap={flap} breath={breath} />
          </Layer>
        )}
        <Layer {...nestProps}>
          <NestFront />
        </Layer>
        {onStage && <Alert t={t} x={birdX} y={birdY} />}
        <Zzz t={t} />
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
    { at: 0, label: '夕ぐれ。えだに 巣が ぶらさがる', sound: 'pop' },
    { at: FLY, label: 'ことりが 空を いそいで とぶ' },
    { at: SEE, label: '巣を 見つけて「!」', sound: 'pop' },
    { at: ARRIVE, label: '巣へ おりて、ほっとする' },
    { at: SLEEP, label: 'ぐっすり ねむる。おひさまは 西へ しずむ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '西 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
