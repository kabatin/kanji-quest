/*
 * 谷(たに): 山と 山の あいだから みずが ながれでる。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … 左の山の そとがわの すそ(てっぺん から 左へ おりる)
 *   2画目(㇏)  … 右の山の そとがわの すそ(てっぺん から 右へ おりる)
 *   3画目(ノ)  … 山と山の あいだ(われめ)から ながれでて、左へ むかう こがわ
 *   4画目(㇏)  … 同じ われめ から 右へ むかう こがわ
 *   5・6・7画目 … 石で かこんだ いけ(口: みずが たまる ところ)
 *
 * ながれ
 *   かんかん照りで、山の まえの いけは からっぽ
 *   → のどが かわいた くまの子が、あせを かきながら あるいてくる。いけを のぞいて、がっかり
 *   → 雲が きて 雨。山に ふった 雨が、山と山の あいだに あつまって、わきだす
 *   → こがわが 左と右に ながれ、いけにも みずが たまる。くまの子は 大よろこびで ごくごく
 *   → ばんざい! の しゅんかん、ほね が ひかって、絵が うすくなり 字「谷」が のこる
 *
 * 山・くま・みず は、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   山は 三角で、てっぺんだけ 白い。みずは 高い所(われめ)から 低い所へ ながれる。
 *   くまの子は まるい あたまに まるい 耳、うで は かた から ひじ で まがる。
 *   こがわ と いけの ふち だけ、字の画に なる線を そのまま つかった(もともと そういう形のもの)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '谷'

const SUN = '#ffd24a'
const ROCK = '#9fb0c4'
const ROCK_SHADE = '#8296ae'
const SNOW = '#ffffff'
const DRY_GROUND = '#e9d99f'
const WET_GROUND = '#c5e8a9'
const DRY_GRASS = '#cdb877'
const GRASS = '#55b86e'
const BANK = '#cdb98a'
const WATER = '#5aaee8'
const WATER_LIGHT = '#d4f0fe'
const POND_WATER = '#7cc4f2'
const DIRT = '#cfae72'
const CRACK = '#a98a50'
const STONE = '#9b968c'
const STONE_LIGHT = '#cfcabf'
const CLOUD_BODY = '#a3b0c2'
const CLOUD_SHADE = '#8494aa'
const CLOUD_LIGHT = '#c3cddb'
const BEAR = '#b98458'
const BEAR_DARK = '#9c6c44'
const BELLY = '#f0d3a8'
const EAR_IN = '#e8b98f'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const TONGUE = '#ff8a8a'
const CHEEK = '#ff9d9d'
const SWEAT = '#7cc4f2'

/** くぎり の時間(秒) */
const WALK = 0.8
const ARRIVE = 2.5
const CLOUD = 3.0
const RAIN = 3.6
const RAIN_END = 5.6
const GUSH = 4.3
const BROOK = 4.8
const BROOK_END = 6.1
const POND_FILL = 5.4
const POND_FULL = 6.4
const RUN = 5.7
const DRINK = 6.2
const CHEER = 7.0
const INK = 7.5
const DONE = 10.9
const DURATION = 11.5

/** 山の すそ(ふもと)の高さ。山は ここから せりあがる */
const FOOT_Y = 38.5
/** 山と山の あいだの われめ(みずが わきだす ところ)。3・4画目の 書きはじめ */
const NOTCH: readonly [number, number] = [53, 29.8]
/** くまの子の 足もと(じめん) */
const GROUND_Y = 96.6
/** くまの子が いけの ふちまで 近よる きょり */
const CREEP = 8.5

const hexToRgb = (hex: string): readonly [number, number, number] => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
/** 2つの色を k(0〜1)で まぜる */
function mixHex(a: string, b: string, k: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  const f = (x: number, y: number) => Math.round(x + (y - x) * k)
  return `rgb(${f(ar, br)} ${f(ag, bg)} ${f(ab, bb)})`
}

/* ───────── おひさま・雲 ───────── */

/** かんかん照りの おひさま。雲が くると かくれ、雨が あがると また 出る */
function Sun({ t }: SceneProps) {
  const rise = span(t, 0, 0.6, easeOut)
  const hidden = during(t, CLOUD + 0.2, RAIN_END + 0.6, 0.5)
  const show = rise * (1 - hidden)
  if (show <= 0) return null
  return (
    <Layer opacity={show}>
      <Layer rotate={t * 14} origin={[10, 10]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="9.2" y="-1.6" width="1.6" height="3.8" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 10 10)`} />
        ))}
      </Layer>
      <circle cx="10" cy="10" r="5.2" fill={SUN} />
    </Layer>
  )
}

/** 雨雲: そこ は たいら。左から ながれてきて、雨が あがると 右へ いく */
function Cloud({ t }: SceneProps) {
  const arrive = span(t, CLOUD, CLOUD + 0.8, easeOut)
  const leave = span(t, RAIN_END + 0.1, RAIN_END + 1.0)
  if (arrive <= 0 || leave >= 1) return null
  const x = -70 * (1 - arrive) + 80 * leave
  const puffs: readonly (readonly [number, number, number])[] = [
    [34, 8, 5.5],
    [46, 5.6, 6.6],
    [60, 5.6, 7],
    [73, 8, 5.5],
  ]
  return (
    <Layer x={x}>
      <g fill={CLOUD_SHADE}>
        <rect x="24" y="6" width="60" height="8.2" rx="4" />
        {puffs.map(([cx, cy, r]) => (
          <circle key={cx} cx={cx} cy={cy} r={r} />
        ))}
      </g>
      <g fill={CLOUD_LIGHT} transform="translate(-0.8 0)">
        {puffs.map(([cx, cy, r]) => (
          <circle key={cx} cx={cx} cy={cy - 1.3} r={r} />
        ))}
      </g>
      <g fill={CLOUD_BODY} transform="translate(0 -2.2)">
        <rect x="24" y="6" width="60" height="8.2" rx="4" />
        {puffs.map(([cx, cy, r]) => (
          <circle key={cx} cx={cx} cy={cy} r={r} />
        ))}
      </g>
    </Layer>
  )
}

/** 雨つぶ: 雲から おちて、山や じめん や いけ に ぶつかる。[x, おちる高さ] */
const DROPS: readonly (readonly [number, number])[] = [
  [30, 28],
  [41, 21],
  [47, 25.5],
  [58, 25.5],
  [64, 19.5],
  [76, 21.5],
  [82, 27],
  [24, 58],
  [88, 60],
  [40, 78],
  [50, 85],
  [60, 74],
  [67, 87],
]

function Rain({ t }: SceneProps) {
  const amount = during(t, RAIN, RAIN_END, 0.3)
  if (amount <= 0) return null
  return (
    <g opacity={amount}>
      {DROPS.map(([x, land], i) => {
        const cycle = 0.55 + (i % 4) * 0.06
        const p = (((t - RAIN + i * 0.17) % cycle) + cycle) % cycle / cycle
        if (p < 0.8) {
          const y = 14 + ((land - 14) * p) / 0.8
          return <path key={i} d={`M${x} ${y - 3} V${y}`} stroke={WATER} strokeWidth="0.9" strokeLinecap="round" />
        }
        const s = (p - 0.8) / 0.2
        return <ellipse key={i} cx={x} cy={land} rx={0.6 + s * 2.2} ry={0.3 + s * 0.8} fill="none" stroke={WATER_LIGHT} strokeWidth="0.6" opacity={1 - s} />
      })}
    </g>
  )
}

/* ───────── 山・じめん ───────── */

/** 2つの山。せりあがる。1・2画目は、それぞれの そとがわの すそ */
function Mountains({ t }: SceneProps) {
  const left = span(t, 0.1, 0.85, backOut)
  const right = span(t, 0.25, 1.0, backOut)
  return (
    <>
      <Layer scaleY={left} origin={[53, FOOT_Y]}>
        <path d="M36.8 16.5 Q35 24.5 19.5 38.5 L53 38.5 L53 29.5 Z" fill={ROCK} />
        <path d="M36.8 16.5 L53 29.5 L53 38.5 L38 38.5 Z" fill={ROCK_SHADE} />
        <path d="M36.8 16.5 L34.8 21 L36.4 20.2 L37.6 22.4 L39.2 20.4 L40.8 21.2 Z" fill={SNOW} />
      </Layer>
      <Layer scaleY={right} origin={[53, FOOT_Y]}>
        <path d="M67.8 15.9 Q76 19.5 88.5 34.5 L88.5 38.5 L53 38.5 L53 29.5 Z" fill={ROCK_SHADE} />
        <path d="M67.8 15.9 L53 29.5 L53 38.5 L64 38.5 Z" fill={ROCK} />
        <path d="M67.8 15.9 L70.8 19.2 L69.5 19.5 L68.2 21.8 L66.4 19.8 L64.6 20.6 Z" fill={SNOW} />
      </Layer>
    </>
  )
}

/** じめん: はじめは かわいて 黄色い。みずが くると しっとり みどりに */
function Ground({ t }: SceneProps) {
  const wet = span(t, BROOK, POND_FULL + 0.4)
  const tufts = [6, 46, 80, 102]
  return (
    <>
      <path d="M-2 40 Q25 35 53 39.5 Q80 35 111 40 V101 H-2 Z" fill={mixHex(DRY_GROUND, WET_GROUND, wet)} />
      {tufts.map((x) => (
        <path key={x} d={`M${x} 97.6 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={mixHex(DRY_GRASS, GRASS, wet)} />
      ))}
    </>
  )
}

/* ───────── みず(こがわ・わきみず・いけ) ───────── */

/** こがわ。われめ から ながれだし、p(0〜1)まで のびる。3画目は左へ、4画目は右へ */
function Brook({ t, n, p }: SceneProps & { readonly n: number; readonly p: number }) {
  if (p <= 0) return null
  return (
    <>
      <Bone char={CHAR} n={n} color={BANK} width={8} to={p} />
      <Bone char={CHAR} n={n} color={WATER} width={5.2} to={p} />
      {[0, 1, 2].map((k) => {
        // きらきらが うえ から した へ ながれる
        const head = (((t * 0.55 + k / 3) % 1) + 1) % 1
        const from = head * p
        return <Bone key={k} char={CHAR} n={n} color={WATER_LIGHT} width={1.7} from={from} to={Math.min(p, from + 0.09)} />
      })}
    </>
  )
}

/** 山と山の あいだの われめ から、みずが ぽこぽこ わきだす */
function Spring({ t }: SceneProps) {
  const jet = span(t, GUSH, GUSH + 0.6, backOut)
  if (jet <= 0) return null
  const [nx, ny] = NOTCH
  return (
    <>
      <ellipse cx={nx} cy={ny + 1.2} rx={3.6 * jet} ry={2.4 * jet} fill={WATER} />
      <ellipse cx={nx - 0.8} cy={ny + 0.6} rx={1.4 * jet} ry={0.9 * jet} fill={WATER_LIGHT} />
      {[0, 1, 2, 3].map((k) => {
        const p = (((t - GUSH) * 1.5 + k / 4) % 1 + 1) % 1
        const side = k - 1.5
        return <circle key={k} cx={nx + side * 3.2 * p} cy={ny - Math.sin(p * Math.PI) * 5.5} r={Math.max(0, 1 - p * 0.4) * jet} fill={WATER} opacity={1 - p * 0.6} />
      })}
    </>
  )
}

/** 石で かこんだ いけ(5・6・7画目が ふち)。からっぽ → みずが たまる */
const POND_FLOOR = 'M33.8 69.2 L70.6 65.5 Q76 65.5 75 70 L70.2 89.3 L38.7 92.8 L31.6 67.9 Z'
const POND_SURFACE = 'M34.5 69.4 L71 66.2 L70 89.6 L38.8 92.4 Z'

function Pond({ t }: SceneProps) {
  const level = span(t, POND_FILL, POND_FULL, easeOut)
  const dry = 1 - span(t, POND_FILL, POND_FILL + 0.8)
  const shimmer = wave(t, 1.4) * 0.8
  return (
    <>
      <path d={POND_FLOOR} fill={DIRT} />
      {/* かわいた じめんの ひびわれ(みずが たまると きえる) */}
      <g opacity={dry} fill="none" stroke={CRACK} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M44 76 l4 2.4 l-1 3.2 M58 72 l-2 4 l4 2.6 M60 84 l4 1.6" />
      </g>
      {level > 0 && (
        <Layer scaleY={level} origin={[54, 92]}>
          <path d={POND_SURFACE} fill={POND_WATER} />
          <path d={`M42 ${76 + shimmer} h9 M56 ${82 - shimmer} h8`} stroke={WATER_LIGHT} strokeWidth="1.1" strokeLinecap="round" fill="none" />
        </Layer>
      )}
      {[5, 6, 7].map((n) => (
        <g key={n}>
          <Bone char={CHAR} n={n} color={STONE} width={4.6} />
          <Bone char={CHAR} n={n} color={STONE_LIGHT} width={1.5} opacity={0.7} />
        </g>
      ))}
    </>
  )
}

/** いけの ふちで みずを のむとき、ちゃぷちゃぷ ひろがる わ */
function Lapping({ t, dx }: SceneProps & { readonly dx: number }) {
  const show = during(t, DRINK + 0.35, CHEER, 0.1)
  if (show <= 0) return null
  return (
    <g opacity={show} fill="none" stroke={SNOW} strokeWidth="0.7">
      {[0, 0.45].map((offset) => {
        const p = (((t * 1.8 + offset) % 1) + 1) % 1
        return <ellipse key={offset} cx={35.5 + dx * 0.1} cy={82.5} rx={1 + p * 4} ry={0.5 + p * 1.5} opacity={1 - p} />
      })}
    </g>
  )
}

/** みずが くると、ほとりに 花が ぽん ぽん と さく */
function Flowers({ t }: SceneProps) {
  const spots: readonly (readonly [number, number, string])[] = [
    [24, 50, '#f07f9e'],
    [78, 43, '#ffc233'],
    [62, 57, '#f07f9e'],
    [91, 72, '#ffc233'],
  ]
  return (
    <>
      {spots.map(([x, y, color], i) => {
        const grow = span(t, POND_FULL - 0.2 + i * 0.18, POND_FULL + 0.4 + i * 0.18, backOut)
        if (grow <= 0) return null
        return (
          <Layer key={x} scale={grow} origin={[x, y + 4]}>
            <path d={`M${x} ${y} V${y + 4.4}`} stroke={GRASS} strokeWidth="1" strokeLinecap="round" />
            {[0, 72, 144, 216, 288].map((a) => (
              <circle key={a} cx={x + Math.cos((a * Math.PI) / 180) * 1.7} cy={y + Math.sin((a * Math.PI) / 180) * 1.7} r="1.25" fill={color} />
            ))}
            <circle cx={x} cy={y} r="1" fill="#fff6c4" />
          </Layer>
        )
      })}
    </>
  )
}

/* ───────── くまの子(主役) ───────── */

type Mood = 'thirsty' | 'hopeful' | 'happy' | 'drink'

const rad = (deg: number) => (deg * Math.PI) / 180

/** うで: かた から ひじ で まがって 手。a・b は ま下から 何度 ひらいたか(+ は 右) */
function Arm({ shoulder, a, b }: { readonly shoulder: readonly [number, number]; readonly a: number; readonly b: number }) {
  const length = 4.4
  const elbow = [shoulder[0] + Math.sin(rad(a)) * length, shoulder[1] + Math.cos(rad(a)) * length] as const
  const hand = [elbow[0] + Math.sin(rad(b)) * length, elbow[1] + Math.cos(rad(b)) * length] as const
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={BEAR} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.2" fill={BEAR_DARK} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="16" cy="78.5" r="6.6" fill={BEAR} />
      <circle cx="11.2" cy="73.6" r="2.3" fill={BEAR} />
      <circle cx="20.8" cy="73.6" r="2.3" fill={BEAR} />
      <circle cx="11.2" cy="73.8" r="1.2" fill={EAR_IN} />
      <circle cx="20.8" cy="73.8" r="1.2" fill={EAR_IN} />
      <ellipse cx="16" cy="81" rx="3.3" ry="2.5" fill={BELLY} />
      <ellipse cx="16" cy="79.9" rx="1.2" ry="0.8" fill={EYE} />
      <circle cx="11.2" cy="81" r="1.3" fill={CHEEK} opacity="0.55" />
      <circle cx="20.8" cy="81" r="1.3" fill={CHEEK} opacity="0.55" />
      {mood === 'thirsty' && (
        <>
          <path d="M11.4 75.8 L14.2 74.6 M20.6 75.8 L17.8 74.6" stroke={BEAR_DARK} strokeWidth="1" strokeLinecap="round" />
          <circle cx="13.1" cy="77.2" r="1" fill={EYE} />
          <circle cx="18.9" cy="77.2" r="1" fill={EYE} />
          <ellipse cx="16" cy="83.2" rx="1.3" ry="1.4" fill={MOUTH} />
          <ellipse cx="16" cy="84.5" rx="1" ry="1.3" fill={TONGUE} />
        </>
      )}
      {mood === 'hopeful' && (
        <>
          <circle cx="13.1" cy="76.9" r="1.3" fill={EYE} />
          <circle cx="18.9" cy="76.9" r="1.3" fill={EYE} />
          <circle cx="13.5" cy="76.4" r="0.45" fill="#ffffff" />
          <circle cx="19.3" cy="76.4" r="0.45" fill="#ffffff" />
          <ellipse cx="16" cy="82.9" rx="0.9" ry="1" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M11.7 77.9 Q13.1 75.7 14.5 77.9 M17.5 77.9 Q18.9 75.7 20.3 77.9" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M13.8 82.6 Q16 86 18.2 82.6 Z" fill={MOUTH} />
          <ellipse cx="16" cy="84.2" rx="1.1" ry="0.8" fill={TONGUE} />
        </>
      )}
      {mood === 'drink' && (
        <>
          <path d="M11.8 77.2 Q13.1 78.8 14.4 77.2 M17.6 77.2 Q18.9 78.8 20.2 77.2" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <ellipse cx="16" cy="83.3" rx="1.2" ry="1.1" fill={TONGUE} />
        </>
      )}
    </>
  )
}

type BearProps = {
  readonly mood: Mood
  /** あるく あしの ふり(-1〜1) */
  readonly stride: number
  /** うでを ばんざいに あげた度合い(0〜1) */
  readonly raise: number
  readonly headTilt: number
  readonly breath: number
}

function Bear({ mood, stride, raise, headTilt, breath }: BearProps) {
  const liftL = Math.max(0, stride) * 1.8
  const liftR = Math.max(0, -stride) * 1.8
  // うで: たれている ときは 体の よこ。ばんざいは そとへ ひらいて 上へ
  const aLeft = -12 - 150 * raise
  const aRight = 12 + 150 * raise
  return (
    <>
      <circle cx="8" cy="91" r="2.3" fill={BEAR_DARK} />
      <ellipse cx="12" cy={GROUND_Y - 0.6 - liftL} rx="3.5" ry="1.9" fill={BEAR_DARK} />
      <ellipse cx="20.4" cy={GROUND_Y - 0.6 - liftR} rx="3.5" ry="1.9" fill={BEAR_DARK} />
      <Layer scaleX={1 + breath * 0.04} scaleY={1 + breath * 0.03} origin={[16, GROUND_Y]}>
        <ellipse cx="16" cy="89.2" rx="7.3" ry="7.4" fill={BEAR} />
        <ellipse cx="16.4" cy="90.4" rx="4.4" ry="5.2" fill={BELLY} />
      </Layer>
      <Arm shoulder={[9.6, 85]} a={aLeft} b={aLeft - 6 * raise - 4} />
      <Arm shoulder={[22.4, 85]} a={aRight} b={aRight + 6 * raise + 4} />
      <Layer rotate={headTilt} origin={[16, 82]}>
        <Face mood={mood} />
      </Layer>
    </>
  )
}

/** あせ: のどが かわいて あるいている あいだ、あたまから ぽたり */
function Sweat({ t }: SceneProps) {
  const show = during(t, WALK + 0.2, CLOUD + 0.4, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.45].map((offset) => {
        const p = (((t + offset) % 0.9) / 0.9 + 1) % 1
        return <path key={offset} d="M0 -2.2 Q1.9 0.6 0 1.9 Q-1.9 0.6 0 -2.2 Z" fill={SWEAT} transform={`translate(${6 - p * 3} ${72 + p * 8}) rotate(25)`} opacity={1 - p} />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)

  // くまの子: 左から あるいてきて、いけを のぞき、雨で げんきに なり、いけの ふちへ
  const walkIn = mix(t, WALK, ARRIVE, -30, 0, easeOut)
  const walking = t >= WALK && t < ARRIVE
  const stride = walking ? Math.sin((t - WALK) * Math.PI * 2 * 1.5) * (1 - span(t, ARRIVE - 0.3, ARRIVE)) : 0
  const creep = mix(t, RUN, DRINK, 0, CREEP, easeInOut)
  const x = walkIn + creep
  const running = t >= RUN && t < DRINK
  const gait = running ? Math.sin((t - RUN) * Math.PI * 2 * 3) : stride
  const hopRun = running ? Math.abs(Math.sin((t - RUN) * Math.PI * 3)) * 1.6 : 0
  const drinking = t >= DRINK && t < CHEER
  const cheering = span(t, CHEER, CHEER + 0.3, easeOut)
  const hopCheer = t >= CHEER + 0.15 ? Math.abs(wave(t, 0.6)) * 2.6 : 0
  // のむとき: 足もとを じく に まえへ かたむき、ちゃぷちゃぷ くびを ふる
  const lean = drinking ? mix(t, DRINK, DRINK + 0.35, 0, 24, easeOut) + wave(t, 0.45) * 2 : 0
  const mood: Mood = t < CLOUD + 0.4 ? 'thirsty' : t < GUSH + 0.8 ? 'hopeful' : drinking ? 'drink' : 'happy'
  // のどが かわいて ぐったり: かたを おとし、あたまを さげる。おわりには まっすぐ
  const slump = t < CLOUD + 0.4 ? 1 : 0
  const headTilt = slump ? 7 + wave(t, 1.2) * 1.5 : drinking ? 0 : -3
  const breath = t < CLOUD + 0.4 && t >= ARRIVE ? wave(t, 0.8) : 0
  // 下をむいて がっかり → 雨を見あげる → よろこぶ
  const raise = cheering * (1 - span(t, DONE - 1.6, DONE - 1.0)) + (running ? 0.3 : 0)

  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const brookP = span(t, BROOK, BROOK_END, easeInOut)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sun t={t} />
        <Mountains t={t} />
        <Ground t={t} />
        <Spring t={t} />
        <Brook t={t} n={3} p={brookP} />
        <Brook t={t} n={4} p={brookP} />
        <Pond t={t} />
        <Flowers t={t} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.2)}>
          <ellipse cx={16 + x} cy="97.2" rx="9" ry="2.2" fill="#000000" opacity="0.12" />
          <Layer x={x} y={-Math.abs(gait) * 0.8 - hopRun - hopCheer} rotate={lean} origin={[16, GROUND_Y]}>
            <Bear mood={mood} stride={gait} raise={raise} headTilt={headTilt} breath={breath} />
          </Layer>
          <Layer x={x}>
            <Sweat t={t} />
          </Layer>
          <Lapping t={t} dx={x} />
        </Layer>
        <Cloud t={t} />
        <Rain t={t} />
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
    { at: 0, label: '山が せりあがる。いけは からっぽ', sound: 'pop' },
    { at: WALK, label: 'のどが かわいた くまの子が あるいてくる' },
    { at: ARRIVE, label: 'いけを のぞいて がっかり', sound: 'pop' },
    { at: RAIN, label: '雲が きて、山に 雨が ふる' },
    { at: GUSH, label: '山と山の あいだから みずが わきだす', sound: 'pop' },
    { at: RUN, label: 'こがわが ながれ、いけに みずが たまる。くまの子が かけよる' },
    { at: DRINK, label: 'ごくごく のんで、ばんざい!' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '谷 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
