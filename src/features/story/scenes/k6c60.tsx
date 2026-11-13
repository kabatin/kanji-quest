/*
 * 池(いけ): 雨で 水が たまって、あひるの およぐ 池に なる。
 *
 * ほね(画と絵の対応)
 *   1画目(丶)  … 雨雲から おちる しずく(ひとつぶ め)
 *   2画目(丶)  … その下を おちる しずく(ふたつぶ め)
 *   3画目(ノ)  … 手前から 池へ ながれこむ 小川(おわりは 池の ふち)
 *   4画目      … 池の むこうの おか(右はしが まるく 下がる)
 *   5画目(丨)  … 池の まんなかに 立つ がまの ほ
 *   6画目      … 池の ふち(水の たまった くぼち)
 *
 * ながれ
 *   水の ない かわいた くぼち で、あひるが あつくて ぐったり(がまも しおれている)
 *   → 雨雲が きて、雨が ぽつぽつ。あひるが 空を見上げる
 *   → 雨で 小川に 水が ながれ、くぼちに ながれこんで 水が たまっていく
 *   → あひるが ういて およぎ、がまも しゃんと のびて、よろこぶ
 *   → 雨の ふたつぶ と 小川と 池の ふち が 点の場所に そろった しゅんかん、ほね が ひかって 字「池」になる
 *
 * 雨は ま下に おちる。あひるは ほんものの つくり を守る:
 *   足は 体の した から。くびは みじかく、あたまは からだの まえに のる。はねは せなか から。
 *   (さんずい の 3つの 点は、雨の しずく 2つ と、水の ながれ 1本)
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '池'

const SUN = '#ffd24a'
const GRASS = '#c5e8a9'
const HILL = '#d3edb4'
const HILL_DARK = '#b5dc93'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const STEM = '#4c8f52'
const WILT = '#a8a45a'
const RIM = '#a07650'
const MUD = '#cfa879'
const MUD_DARK = '#b98c5e'
const BED = '#d2b48a'
const WATER = '#7cc4f2'
const WATER_DARK = '#56aae6'
const WATER_LIGHT = '#d8effc'
const CLOUD = '#a3b0c2'
const CLOUD_DARK = '#8494aa'
const CLOUD_LIGHT = '#c3cddb'
const DUCK = '#ffd24a'
const DUCK_LIGHT = '#ffe58a'
const DUCK_DARK = '#f2b632'
const BEAK = '#ff8f3a'
const EYE = '#2b2b2b'
const CHEEK = '#ff9d9d'
const CATTAIL = '#7a4a2a'

/** くぎり の時間(秒) */
const CLOUD_AT = 1.0
const RAIN_AT = 1.9
/** 小川に 水が ながれはじめ、池に とどく */
const CREEK = 2.5
const CREEK_END = 4.1
/** 池に 水が たまる */
const FILL = 3.9
const FILL_END = 5.7
/** あひるが ういて、よろこぶ */
const FLOAT = 4.5
const CHEER = 5.7
const INK = 6.9
const DONE = 10.2
const DURATION = 10.6

/** 池(くぼち)の 中心と 大きさ。6画目の 池の ふち に だいたい 合わせる */
const POND: readonly [number, number] = [71, 67]
const POND_RX = 24.5
const POND_RY = 22
/** がまの 根もと(5画目の おわり)と、くきの 中ほど(ここで おれ曲がる) */
const REED_BASE: readonly [number, number] = [66.4, 72]
const REED_KNEE: readonly [number, number] = [66.5, 49]
/** あひるの いる場所(体の まんなか) */
const DUCK_AT: readonly [number, number] = [83, 63]
/** 雨の おちる はやさ(1秒に すすむ 長さ)と、雲の そこ */
const FALL = 36
const CLOUD_BOTTOM = 14

function Ground() {
  return (
    <>
      {/* むこうの おか(4画目): 右はしが まるく 下がる */}
      <path d="M20 56 L35 54 C52 51 70 43 85.5 39 C91 37.5 97 41 98.5 47 C100 54 98 62 90 66 L20 66 Z" fill={HILL} />
      <path d="M36 54.5 C52 51.5 70 43.5 85.5 39.5" fill="none" stroke={HILL_DARK} strokeWidth="1.6" strokeLinecap="round" />
      {/* 手前の 地面 */}
      <path d="M-2 58 Q18 52 40 54.5 Q72 50 111 56 V101 H-2 Z" fill={GRASS} />
      <ellipse cx="54.5" cy="99" rx="54" ry="4.5" fill="#b6df97" />
      {[6, 40, 58, 104].map((x) => (
        <path key={x} d={`M${x} 98.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** お日さま。暑さを あらわす 光の すじ が ゆっくり まわる */
function Sun({ t }: SceneProps) {
  const grow = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={grow} rotate={t * 14} origin={[96, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="95.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 96 13)`} />
        ))}
      </Layer>
      <circle cx="96" cy="13" r={6.2 * grow} fill={SUN} />
    </>
  )
}

/** 小川の みちすじ。手前から 3画目の 線を通って 池の ふちへ(3画目と 同じ 通り道) */
const CREEK_PATH = 'M-2 99 Q8 93 15.5 90 C17.5 90.5 19.31 89.79 20.25 88.24 C22.32 84.83 24.34 80.69 27.5 73.4 Q36 70.5 45 67.5'

function Creek({ t }: SceneProps) {
  const flow = span(t, CREEK, CREEK_END, easeInOut)
  const width = 3.4 + wave(t, 0.9) * 0.35
  return (
    <>
      {/* かわいた みぞ: さいしょから ある */}
      <path d={CREEK_PATH} fill="none" stroke={BED} strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
      {flow > 0.005 && (
        <path d={CREEK_PATH} fill="none" stroke={WATER} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${flow} 2`} />
      )}
    </>
  )
}

/** 雨雲: 左はしから ながれてきて、ぷくっと ふくらむ。そこ は たいら */
function RainCloud({ t }: SceneProps) {
  const drift = span(t, CLOUD_AT, CLOUD_AT + 1.0, easeOut)
  const billow = span(t, CLOUD_AT + 0.4, CLOUD_AT + 1.1, backOut)
  if (drift <= 0) return null
  const body = (lift: number) => (
    <g transform={`translate(0 ${-lift})`}>
      <rect x="6" y="8" width="29" height="6" rx="3" />
      <circle cx="13" cy="9" r="5" />
      <circle cx="21" cy="6.5" r="6.4" />
      <circle cx="29.5" cy="9" r="5" />
    </g>
  )
  return (
    <Layer x={-44 * (1 - drift)} scale={0.8 + 0.2 * billow} origin={[20, CLOUD_BOTTOM]}>
      <g fill={CLOUD_DARK}>{body(0)}</g>
      <g fill={CLOUD_LIGHT} transform="translate(-0.7 0)">{body(2.4)}</g>
      <g fill={CLOUD}>{body(1.4)}</g>
    </Layer>
  )
}

/** 雨の しずく ひとつぶ。ま下に おちて、じめんで わ に なる */
type Drop = { readonly x: number; readonly start: number; readonly landY: number }

/** ふつうの 雨(字になる ちょくぜんには ありません) */
const DROPS: readonly Drop[] = [
  { x: 10, start: 1.9, landY: 64 },
  { x: 16, start: 2.2, landY: 80 },
  { x: 31, start: 2.4, landY: 72 },
  { x: 13, start: 2.9, landY: 60 },
  { x: 34, start: 3.3, landY: 86 },
  { x: 9, start: 3.6, landY: 76 },
  { x: 30, start: 4.0, landY: 62 },
  { x: 14, start: 4.4, landY: 70 },
  { x: 33, start: 4.8, landY: 78 },
  { x: 8, start: 5.2, landY: 84 },
  /* 1画目・2画目に なる ふたつぶ(ほね が ひかる しゅんかん に この場所へ) */
  { x: 22, start: 5.95, landY: 70 },
  { x: 27, start: 6.57, landY: 66 },
]

function Drops({ t }: SceneProps) {
  return (
    <>
      {DROPS.map((drop) => {
        const fall = (t - drop.start) * FALL
        const y = CLOUD_BOTTOM - 1 + fall
        if (fall < 0) return null
        if (y < drop.landY) {
          return <path key={drop.start} d="M0 -3 Q2.1 0.6 0 2.2 Q-2.1 0.6 0 -3 Z" fill={WATER} transform={`translate(${drop.x} ${y})`} />
        }
        // おちたあと: ちいさな わ が ひろがって きえる
        const ring = span(t, drop.start + (drop.landY - CLOUD_BOTTOM + 1) / FALL, drop.start + (drop.landY - CLOUD_BOTTOM + 1) / FALL + 0.45, easeOut)
        if (ring <= 0 || ring >= 1) return null
        return <ellipse key={drop.start} cx={drop.x} cy={drop.landY} rx={1 + ring * 4} ry={0.5 + ring * 1.6} fill="none" stroke={WATER_DARK} strokeWidth="0.7" opacity={1 - ring} />
      })}
    </>
  )
}

/** 池: かわいた くぼち に 水が たまっていく */
function Pond({ t }: SceneProps) {
  const level = mix(t, FILL, FILL_END, 0.14, 1, easeOut)
  const wet = span(t, FILL - 0.2, FILL + 0.25)
  const [cx, cy] = POND
  const ring = (offset: number, x: number, y: number) => {
    const p = ((t * 0.6 + offset) % 1)
    return <ellipse key={offset} cx={x} cy={y} rx={1 + p * 6} ry={0.5 + p * 2.4} fill="none" stroke={WATER_LIGHT} strokeWidth="0.8" opacity={(1 - p) * span(t, FILL_END - 0.8, FILL_END)} />
  }
  return (
    <>
      <ellipse cx={cx} cy={cy + 1} rx={POND_RX + 2} ry={POND_RY + 2} fill={RIM} />
      <ellipse cx={cx} cy={cy} rx={POND_RX} ry={POND_RY} fill={MUD} />
      {/* かわいた ひび われ(水が たまると きえる) */}
      <g opacity={1 - wet} fill="none" stroke={MUD_DARK} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M52 60 l5 3 l-1 5 M60 82 l5 -3 l4 3 M86 74 l-5 -2 l-1 -5 M78 82 l1 4 M56 72 l6 1" />
      </g>
      <g opacity={wet}>
        <ellipse cx={cx} cy={cy + 1} rx={POND_RX * level} ry={POND_RY * level} fill={WATER_DARK} />
        <ellipse cx={cx} cy={cy} rx={POND_RX * level} ry={POND_RY * level} fill={WATER} />
        <path d={`M${cx - 15 * level} ${cy - 8 * level} Q${cx - 10 * level} ${cy - 14 * level} ${cx - 2 * level} ${cy - 15 * level}`} fill="none" stroke={WATER_LIGHT} strokeWidth="1.6" strokeLinecap="round" />
      </g>
      {ring(0, 56, 77)}
      {ring(0.5, 80, 53)}
    </>
  )
}

/** がま(5画目): かわくと しおれて、水を もらうと しゃんと のびる。ひざ で おれ曲がる */
function Reed({ t }: SceneProps) {
  const wilt = 1 - span(t, FILL + 0.6, FILL_END + 0.3, easeInOut)
  return (
    <Layer rotate={-9 * wilt} origin={REED_BASE}>
      {/* は: くきの ねもと から ひろがる 2まい */}
      <path d="M66 72 Q58 62 53 52 Q61 60 66.4 68 Z" fill={wilt > 0.5 ? WILT : LEAF} />
      <path d="M66.8 72 Q75 66 80 54 Q72 62 66.4 68 Z" fill={wilt > 0.5 ? WILT : LEAF_DARK} />
      <Bone char={CHAR} n={5} color={wilt > 0.5 ? WILT : STEM} width={2.3} from={0.55} />
      <Layer rotate={-46 * wilt} origin={REED_KNEE}>
        <Bone char={CHAR} n={5} color={wilt > 0.5 ? WILT : STEM} width={2.3} to={0.6} />
        <ellipse cx="65.7" cy="26.5" rx="2.7" ry="6.2" fill={CATTAIL} />
        <path d="M65.3 20.4 l0.3 -3" stroke={CATTAIL} strokeWidth="1.1" strokeLinecap="round" />
      </Layer>
    </Layer>
  )
}

type Mood = 'tired' | 'curious' | 'happy'

type DuckProps = {
  readonly mood: Mood
  /** あたまの かたむき(+ で 上を むく) */
  readonly headTilt: number
  /** くちの あき(0〜1) */
  readonly mouth: number
  /** はねの ばたつき(角度) */
  readonly flap: number
  /** 水に うかんで いる度合い(0〜1)。足が 水に かくれる */
  readonly float: number
}

/** あひる(左むき)。体の まんなかが (0,0)。足は 体の したから、あたまは からだの まえに のる */
function Duck({ mood, headTilt, mouth, flap, float }: DuckProps) {
  return (
    <>
      {/* 足: 体の したから。水に うくと かくれる */}
      <g opacity={1 - float} stroke={BEAK} strokeWidth="1.8" strokeLinecap="round" fill="none">
        <path d="M-2 5 V9.4" />
        <path d="M3 5 V9.4" />
        <path d="M-5 9.6 H-0.4 M0.2 9.6 H5" strokeWidth="1.5" />
      </g>
      {/* おしり の はね */}
      <path d="M7.4 -2 L13.4 -6 L11.2 1.6 Z" fill={DUCK_DARK} />
      <ellipse cx="0" cy="0" rx="9.4" ry="6.4" fill={DUCK} />
      <ellipse cx="-0.6" cy="2.6" rx="6.4" ry="3" fill={DUCK_LIGHT} />
      {/* はね: せなかから */}
      <Layer rotate={flap} origin={[3, -3]}>
        <path d="M-1.4 -2.4 Q6 -6.4 10 -0.6 Q5.4 5 -1 3.2 Z" fill={DUCK_DARK} />
      </Layer>
      {/* あたま: みじかい くびで、体の まえに のる */}
      <Layer rotate={headTilt} origin={[-4, -3]}>
        <circle cx="-7.4" cy="-6.4" r="4.9" fill={DUCK} />
        <circle cx="-8.4" cy="-3.8" r="1.2" fill={CHEEK} opacity="0.6" />
        <path d={`M-11.4 ${-5.4 - mouth * 0.6} Q-14.6 ${-5.6 - mouth * 0.6} -15 ${-4.8 - mouth * 0.4} Q-13 ${-4.4 - mouth * 0.4} -11.2 ${-4.6}Z`} fill={BEAK} />
        <path d={`M-11.2 ${-4.4 + mouth * 0.6} Q-14 ${-4 + mouth * 1.8} -14.2 ${-3.2 + mouth * 1.6} Q-12.4 ${-3 + mouth * 1.2} -10.8 ${-3.6}Z`} fill="#e2733f" />
        {mood === 'tired' && (
          <>
            <path d="M-10.8 -8.6 l3 1.1" stroke={DUCK_DARK} strokeWidth="1.1" strokeLinecap="round" />
            <path d="M-10.6 -7 Q-9.2 -6 -7.8 -7" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          </>
        )}
        {mood === 'curious' && (
          <>
            <circle cx="-9.2" cy="-7.2" r="1.15" fill={EYE} />
            <circle cx="-9.5" cy="-7.6" r="0.4" fill="#ffffff" />
          </>
        )}
        {mood === 'happy' && <path d="M-10.6 -6.6 Q-9.2 -8.6 -7.8 -6.6" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />}
      </Layer>
    </>
  )
}

/** あつくて でる あせ。あひるの あたまの うしろから おちる */
function Sweat({ t, x, y }: SceneProps & { readonly x: number; readonly y: number }) {
  const show = during(t, 0.3, CREEK - 0.2, 0.3)
  if (show <= 0) return null
  const p = (t * 1.1) % 1
  return <path d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill={WATER} opacity={show * (1 - p)} transform={`translate(${x - 3 + p * 3} ${y - 14 + p * 9})`} />
}

/** よろこびの みずしぶき */
function Splash({ t, x, y }: SceneProps & { readonly x: number; readonly y: number }) {
  const p = span(t, CHEER, CHEER + 1.1)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p}>
      {[-1, -0.5, 0.5, 1].map((k, i) => (
        <circle key={k} cx={x + k * (7 + p * 7)} cy={y + 7 - Math.sin(p * Math.PI) * (7 + (i % 2) * 3)} r={Math.max(0, 1.5 - p)} fill={WATER} />
      ))}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  const float = span(t, FLOAT, FLOAT + 0.6, easeInOut)
  const cheer = span(t, CHEER, CHEER + 1.1)
  const hop = float > 0.5 ? Math.abs(Math.sin(cheer * Math.PI * 2)) * 4.5 * (cheer < 1 ? 1 : 0) : 0
  const bob = float * (1.8 + wave(t, 1.6) * 0.5)
  const [duckX, duckY] = DUCK_AT
  const y = duckY + bob - hop

  // きもち: ぐったり → 雨雲を 見あげて びっくり → およいで にこにこ
  const mood: Mood = t < CLOUD_AT + 0.6 ? 'tired' : t < FLOAT ? 'curious' : 'happy'
  const panting = t < CLOUD_AT + 0.6 ? (Math.sin(t * 7) + 1) / 2 : 0
  const headTilt = t < CLOUD_AT + 0.6 ? -12 + wave(t, 1.2) * 2 : mix(t, CLOUD_AT + 0.6, RAIN_AT + 0.4, -12, 18, easeOut) * (1 - float) + float * (4 + wave(t, 1.6) * 3)
  const mouth = t < CLOUD_AT + 0.6 ? panting : mood === 'curious' ? 0.5 : 0.3 + cheer * (1 - span(t, CHEER + 1.1, CHEER + 1.3)) * 0.7
  const flap = cheer > 0 && cheer < 1 ? wave(t, 0.26) * 30 - 10 : 0

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sun t={t} />
        <Ground />
        <Pond t={t} />
        <Creek t={t} />
        <Reed t={t} />
        <Layer opacity={span(t, 0.2, 0.7)}>
          <Layer x={duckX} y={y}>
            <Duck mood={mood} headTilt={headTilt} mouth={mouth} flap={flap} float={float} />
            {/* 水に うかぶと、体の したが 水に つかる */}
            <path d="M-11 4.6 Q0 2.6 11 4.6 Q9 9.6 0 10 Q-9 9.6 -11 4.6 Z" fill={WATER} opacity={float * 0.95} />
            <ellipse cx="0" cy="8" rx="13" ry="3" fill="none" stroke={WATER_LIGHT} strokeWidth="0.9" opacity={float * (0.5 + 0.4 * wave(t, 1.2))} />
          </Layer>
          <Sweat t={t} x={duckX - 5} y={y - 5} />
          <Splash t={t} x={duckX} y={duckY} />
        </Layer>
        <Drops t={t} />
        <RainCloud t={t} />
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
    { at: 0, label: '水の ない くぼちで、あひるが ぐったり', sound: 'pop' },
    { at: CLOUD_AT, label: '雨雲が きて、あひるが 空を 見あげる' },
    { at: RAIN_AT, label: '雨が ぽつぽつ ふってくる' },
    { at: CREEK, label: '小川に 水が ながれて、池に そそぐ', sound: 'pop' },
    { at: FILL, label: '水が たまって いく' },
    { at: FLOAT, label: 'あひるが うかんで、およぐ' },
    { at: CHEER, label: '水しぶき を あげて よろこぶ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '池 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
