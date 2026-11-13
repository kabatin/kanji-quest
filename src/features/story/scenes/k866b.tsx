/*
 * 虫(むし): ちいさな いきものが くねくね うごく。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … しゃくとりむしの 前あし(あたま)が えだに ついた ところ
 *   2画目(コ)  … しゃくとりむしの 山なりに もちあげた せなか と、うしろの おしり
 *   3画目(一)  … むしが のっている 小さな えだ
 *   4画目(丨)  … 草の くき(えだ は くき から のびている)
 *   5画目(ノ)  … 草が はえている 土の ゆるい のぼりざか
 *   6画目(丶)  … 土から のびた 草の は
 *
 * ながれ
 *   草の くき と えだ が のびて、えだ の 左のはしに おいしそうな 葉が ひらく
 *   → おなかを すかせた しゃくとりむし が、右から えだ に あらわれる(しょんぼり)
 *   → からだを のばして ちぢめて、くねくね と すすむ(葉が 目に入ると 目が きらり)
 *   → 葉に たどりついて もぐもぐ。おなかが いっぱいで にこにこ
 *   → 山なりに からだを もちあげた しゅんかん、ほね が ひかって 絵が うすくなり 字「虫」になる
 *
 * しゃくとりむしは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   あたま と おしり の あし だけ えだ に つけて、まん中を 山なりに もちあげて すすむ。
 *   からだの ながさは かわらず、のびると ひらたく、ちぢむと 高い山に なる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '虫'

const SUN = '#ffd24a'
const SOIL = '#b98a5e'
const SOIL_DARK = '#9c7048'
const BARK = '#8c5b3c'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const BODY = '#b4e05a'
const BODY_BAND = '#8fc53f'
const HEAD = '#ffd166'
const FOOT = '#7aa832'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** じかん(秒): あたまが 前へ / おしりが ついていく を くり返す */
const HEAD_MOVES: readonly (readonly [number, number])[] = [
  [1.0, 1.6],
  [2.4, 3.0],
  [3.8, 4.4],
]
const TAIL_MOVES: readonly (readonly [number, number])[] = [
  [1.7, 2.3],
  [3.1, 3.7],
]
const NOTICE = 3.0
const EAT = 4.5
const FULL = 5.8
const INK = 6.3
const DONE = 9.3
const DURATION = 10

/** むしの ながさ と、1ぽの はば */
const LENGTH = 60
const STEP = 25
/** さいしょの あたま・おしり の いち(わく の 右の そと から 入ってくる) */
const HEAD_START = 108
const TAIL_START = 128
/** かみつく 3回 の じかん */
const BITES: readonly number[] = [4.6, 5.0, 5.4]

/** えだ(3画目)の 中心の 高さ。右が 少し上がる */
const twigY = (x: number) => 60 - (x - 30) * 0.0775
/** むしの からだの 中心線: えだ の 上に ちょうど のる 高さ */
const wormY = (x: number) => twigY(x) - 6.1

type Mood = 'sad' | 'hope' | 'eat' | 'happy'

function Ground() {
  return (
    <>
      <path d="M-4 99 Q18 78 44 92 Q72 70 113 90 V101 H-4 Z" fill="#e2f2d2" />
      {/* 土: 5画目の のぼりざか の下を うめる */}
      <path d="M-5 92 Q10 91 23 90 L82 78 Q98 74 114 76 V112 H-5 Z" fill={SOIL} />
      <path d="M8 102 q4 -2 8 0 M46 98 q4 -2 8 0 M88 94 q4 -2 8 0" fill="none" stroke={SOIL_DARK} strokeWidth="1.4" strokeLinecap="round" />
      <Bone char={CHAR} n={5} color={LEAF} width={6} />
      <path d="M-5 92 Q10 91 23 90" fill="none" stroke={LEAF} strokeWidth="6" strokeLinecap="round" />
      <path d="M81.8 78.5 Q98 74.5 114 76.5" fill="none" stroke={LEAF} strokeWidth="6" strokeLinecap="round" />
    </>
  )
}

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
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="86" cy="12" rx="7" ry="3.2" />
        <ellipse cx="91" cy="10.2" rx="5" ry="3.2" />
      </g>
    </>
  )
}

/** 草: くき(4画目)・えだ(3画目)・いちばん上の 葉・土から のびる は(6画目) */
function Plant({ t }: SceneProps) {
  const stem = span(t, 0, 0.55, backOut)
  const twig = span(t, 0.3, 0.8, backOut)
  const sway = wave(t, 3.4) * 1.2
  return (
    <>
      <Layer scaleX={0.6 + 0.4 * stem} scaleY={stem} origin={[54, 84]}>
        <Bone char={CHAR} n={4} color={BARK} width={6} />
      </Layer>
      {/* えだ: 3画目の 線を、左右へ すこし のばしている */}
      <Layer scale={twig} origin={[54, 58]}>
        <path d={`M24 ${twigY(24)} L106 ${twigY(106)}`} stroke={BARK} strokeWidth="5" strokeLinecap="round" />
        <Bone char={CHAR} n={3} color={BARK} width={5} />
      </Layer>
      <Layer scale={twig} rotate={sway} origin={[54, 18]}>
        <path d="M54 17 C46 16 40 10 38 4 C47 3 54 9 54 17 Z" fill={LEAF_DARK} />
        <path d="M54 17 C62 16 68 10 70 4 C61 3 54 9 54 17 Z" fill={LEAF} />
        <path d="M54 17 C54 12 54 8 54 3 C57 7 56 13 54 17 Z" fill={LEAF_LIGHT} />
      </Layer>
      {/* 土から のびる は(6画目) */}
      <Layer rotate={sway * 1.4} origin={[89, 90]}>
        <Bone char={CHAR} n={6} color={LEAF_DARK} width={3.4} />
      </Layer>
      <ellipse cx="88" cy="92" rx="7" ry="3" fill={SOIL} />
      <path d="M82 92 l1.6 -4 l1.2 3.4 l1.8 -4.4 l0.8 4.6 Z" fill={LEAF_DARK} />
    </>
  )
}

/** えだ の 左のはしの 葉。かじられると ちいさく なる */
function FoodLeaf({ t }: SceneProps) {
  const grow = span(t, 0.3, 0.9, backOut)
  const eaten = BITES.reduce((sum, at) => sum + 0.15 * span(t, at, at + 0.2), 0)
  // 葉は 目だつように 大きめに(はじめの 1.25ばい)
  const scale = Math.max(0, grow * (1 - eaten) * 1.25)
  const shine = during(t, 0.9, 2.6, 0.3)
  return (
    <>
      <Layer scale={scale} origin={[25, 60]}>
        <path d="M25 60 C18 58 9 54 6 45 C16 44 24 50 25 60 Z" fill={LEAF} />
        <path d="M25 60 C18 58 9 54 6 45 C12 47 20 52 25 60 Z" fill={LEAF_DARK} />
        <path d="M24 59 Q16 53 9 47" fill="none" stroke={LEAF_LIGHT} strokeWidth="0.9" strokeLinecap="round" />
      </Layer>
      {shine > 0 && <Star cx={13} cy={42} r={3.2 * shine} color="#ffffff" spin={t * 90} />}
    </>
  )
}

type WormProps = {
  /** あたま・おしり の x */
  readonly head: number
  readonly tail: number
  readonly mood: Mood
  /** くち の ひらき(0〜1) */
  readonly open: number
}

function Face({ x, y, mood, open }: { readonly x: number; readonly y: number; readonly mood: Mood; readonly open: number }) {
  // あたま は 左むき。目は ふたつ、くち は 左下
  const eyes: readonly (readonly [number, number])[] = [
    [x - 3, y - 1],
    [x - 0.1, y - 1.2],
  ]
  return (
    <>
      <circle cx={x - 3.6} cy={y + 2.1} r="1.1" fill={CHEEK} opacity="0.6" />
      {eyes.map(([ex, ey], i) =>
        mood === 'eat' || mood === 'happy' ? (
          <path key={i} d={`M${ex - 1.2} ${ey + 0.5} Q${ex} ${ey - 1.3} ${ex + 1.2} ${ey + 0.5}`} fill="none" stroke={EYE} strokeWidth="0.9" strokeLinecap="round" />
        ) : (
          <g key={i}>
            <circle cx={ex} cy={ey} r={mood === 'hope' ? 1.35 : 1} fill={EYE} />
            {mood === 'hope' && <circle cx={ex + 0.4} cy={ey - 0.45} r="0.42" fill="#ffffff" />}
            {mood === 'sad' && <path d={i === 0 ? `M${ex - 1.3} ${ey - 1.4} L${ex + 1} ${ey - 2.6}` : `M${ex - 1} ${ey - 2.6} L${ex + 1.3} ${ey - 1.4}`} stroke={EYE} strokeWidth="0.7" strokeLinecap="round" />}
          </g>
        ),
      )}
      {mood === 'sad' && <path d={`M${x - 4.8} ${y + 3.4} Q${x - 3.4} ${y + 2.2} ${x - 2} ${y + 3.4}`} fill="none" stroke={MOUTH} strokeWidth="0.8" strokeLinecap="round" />}
      {mood === 'hope' && <ellipse cx={x - 3.4} cy={y + 3} rx="0.9" ry="1.1" fill={MOUTH} />}
      {mood === 'eat' && <ellipse cx={x - 3.4} cy={y + 3} rx="1.3" ry={0.35 + open * 1.4} fill={MOUTH} />}
      {mood === 'happy' && <path d={`M${x - 5} ${y + 2.4} Q${x - 3.4} ${y + 4.6} ${x - 1.8} ${y + 2.4}`} fill="none" stroke={MOUTH} strokeWidth="0.9" strokeLinecap="round" />}
    </>
  )
}

/**
 * しゃくとりむし。おしり と あたま だけ えだ に ついて、まん中が 山なり に もちあがる。
 * からだの ながさ(LENGTH)は かわらないので、はなれると ひらたく、ちかづくと 高い山に なる。
 */
function Worm({ head, tail, mood, open }: WormProps) {
  const d = tail - head
  const rise = Math.sqrt(Math.max(0, (3 * d * (LENGTH - d)) / 8))
  const lift = rise / 0.75
  const yT = wormY(tail)
  const yH = wormY(head)
  const body = `M${tail} ${yT} C${tail - 0.04 * d} ${yT - lift} ${head + 0.04 * d} ${yH - lift} ${head} ${yH}`
  return (
    <>
      <ellipse cx={tail + 0.6} cy={yT + 3.2} rx="3.6" ry="2.6" fill={FOOT} />
      <path d={body} fill="none" stroke={BODY} strokeWidth="7.4" strokeLinecap="round" />
      {/* ふし: からだの ながさ に そって ならぶので、のびると ひろがり ちぢむと つまる */}
      <path d={body} fill="none" stroke={BODY_BAND} strokeWidth="7.4" pathLength={100} strokeDasharray="2 7.5" strokeDashoffset={-4} />
      <circle cx={head} cy={yH + 0.4} r="5.2" fill={HEAD} />
      <ellipse cx={head - 3.8} cy={yH + 5.4} rx="2.8" ry="1.5" fill={FOOT} />
      <Face x={head} y={yH + 0.4} mood={mood} open={open} />
    </>
  )
}

/** もぐもぐ の ときに とびちる 葉の かけら */
function Crumbs({ t }: SceneProps) {
  return (
    <>
      {BITES.map((at) => {
        const p = span(t, at, at + 0.45, easeOut)
        if (p <= 0 || p >= 1) return null
        return [0, 1, 2].map((i) => (
          <circle key={`${at}-${i}`} cx={22 - p * (4 + i * 3)} cy={52 + p * (6 + i * 3) - Math.sin(p * Math.PI) * 5} r={1 - p * 0.5} fill={LEAF_LIGHT} opacity={1 - p} />
        ))
      })}
    </>
  )
}

/** ひらひら とぶ ちょうちょ(にぎやかし) */
function Butterfly({ t }: SceneProps) {
  const show = during(t, 2.0, 6.0, 0.4)
  if (show <= 0) return null
  const p = span(t, 2.0, 6.0)
  const flap = 0.35 + Math.abs(wave(t, 0.3)) * 0.65
  return (
    <Layer x={104 - p * 70} y={28 + Math.sin(p * 9) * 4} opacity={show}>
      <ellipse cx="-1.8" cy="-1.2" rx="2.4" ry={2.6 * flap} fill="#f07f9e" />
      <ellipse cx="1.8" cy="-1.2" rx="2.4" ry={2.6 * flap} fill="#f07f9e" />
      <ellipse cx="-1.4" cy="1.2" rx="1.6" ry={1.8 * flap} fill="#f7b3c6" />
      <ellipse cx="1.4" cy="1.2" rx="1.6" ry={1.8 * flap} fill="#f7b3c6" />
      <rect x="-0.4" y="-2.6" width="0.8" height="5.6" rx="0.4" fill="#5a3b2a" />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  // あたま・おしり の いち: 1ぽ ずつ 交ごに すすむ
  const head = HEAD_START - STEP * HEAD_MOVES.reduce((sum, [a, b]) => sum + span(t, a, b, easeInOut), 0)
  const tail = TAIL_START - STEP * TAIL_MOVES.reduce((sum, [a, b]) => sum + span(t, a, b, easeInOut), 0)

  const mood: Mood = t < NOTICE ? 'sad' : t < EAT ? 'hope' : t < FULL ? 'eat' : 'happy'
  const open = t >= EAT && t < FULL ? (wave(t, 0.4) + 1) / 2 : 0
  const entrance = span(t, 0.6, 1.0)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Ground />
        <Plant t={t} />
        <FoodLeaf t={t} />
        <Layer opacity={entrance}>
          <Worm head={head} tail={tail} mood={mood} open={open} />
        </Layer>
        <Crumbs t={t} />
        <Butterfly t={t} />
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
    { at: 0, label: '草が のびて、えだ に おいしそうな 葉が ひらく', sound: 'pop' },
    { at: 1.0, label: 'おなかを すかせた しゃくとりむしが くねくね すすむ' },
    { at: NOTICE, label: '葉が 目に入って きらり', sound: 'pop' },
    { at: EAT, label: 'もぐもぐ たべる' },
    { at: FULL, label: 'おなかが いっぱいで にこにこ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '虫 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
