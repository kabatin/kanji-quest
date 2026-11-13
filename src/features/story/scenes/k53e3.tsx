/*
 * 口(くち): あーんと あけた くち。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … あけた くち の 左の ふち
 *   2画目(𠃍)  … くち の うえの ふち から、右の ふち
 *   3画目(一)  … くち の 下の ふち
 *   (ひなの くち の 中の まっくらな ところが、ちょうど 字の 四角の 中に 入る)
 *
 * ながれ
 *   木の えだの すで、ひなが おなかを すかせて しょんぼり(ふきだしに ミミズ)
 *   → おかあさん鳥が ミミズを くわえて とんでくる → ひなが ぱっと うれしくなる
 *   → 「あーん」と くちを おおきく あける → カメラが ぐーんと よって、くちが 画面いっぱい に
 *   → ほね が ひかって、絵が うすくなり、字「口」が のこる
 *
 * ひなと 鳥は、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   ひなは まるい ふわふわの 体、目は 顔の 上のほう、くちばしは 口の まわり。
 *   おかあさん鳥は はね が せなか から、くちばし が あたま の さき、足は 体の 下。
 *   くち の 形は、カメラが よる(ズーム)ことで 大きく見えるだけ で、ゆがめて いない。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '口'

const SUN = '#ffd24a'
const HILL = '#e2f2d2'
const GRASS = '#c5e8a9'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const NEST = '#c9955a'
const NEST_DARK = '#a8743f'
const NEST_BACK = '#8f6234'
const CHICK = '#ffd84d'
const CHICK_LIGHT = '#ffe98e'
const CHICK_DARK = '#f2b832'
const BEAK = '#ff9a3c'
const BEAK_LIGHT = '#ffb86a'
const MOUTH = '#c4504a'
const THROAT = '#8f2d3a'
const TONGUE = '#ff8a8a'
const EYE = '#2b2b2b'
const CHEEK = '#ff9d9d'
const MOM = '#5f8fd6'
const MOM_DARK = '#4673b8'
const MOM_BELLY = '#d6e6f8'
const WORM = '#e8707c'
const WORM_LIGHT = '#f6a3ab'

/** くぎり の時間(秒) */
const POP = 0.5
const THINK = 1.4
const FLY = 2.6
const SEE = 3.5
const OPEN = 4.1
const ZOOM = 4.5
const INK = 6.6
const DONE = 9.4
const DURATION = 10.2

/** ひなの くち の まんなか(絵の中の 場所)と、ひなの 大きさ(さいしょは 小さい) */
const MOUTH_CENTER: readonly [number, number] = [54.5, 54.5]
const CHICK_AT: readonly [number, number] = [50, 64]
const CHICK_SMALL = 0.42
/** 字の 4つの かど に 合わせた、あけた くち の 形(ひなの 絵の 座標) */
const TOP_LEFT: readonly [number, number] = [25.5, 35]
const TOP_RIGHT: readonly [number, number] = [83, 32]
const BOTTOM_LEFT: readonly [number, number] = [30, 77]
const BOTTOM_RIGHT: readonly [number, number] = [79, 74]

type Mood = 'hungry' | 'happy'

const along = (from: readonly [number, number], to: readonly [number, number], amount: number): readonly [number, number] => [from[0] + (to[0] - from[0]) * amount, from[1] + (to[1] - from[1]) * amount]

function Backdrop({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="3.4" width="1.6" height="3.4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={5.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 92 Q72 72 113 94 V104 H-4 Z" fill={HILL} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="22" cy="12" rx="6.5" ry="2.8" />
        <ellipse cx="26.5" cy="10.4" rx="4.4" ry="2.8" />
        <ellipse cx="70" cy="8" rx="5.5" ry="2.4" />
      </g>
      <ellipse cx="54.5" cy="101" rx="56" ry="6" fill={GRASS} />
    </>
  )
}

/** 右がわの 木。えだ が ひなの すを ささえる。 */
function Tree({ t }: SceneProps) {
  const sway = wave(t, 3.4) * 1.2
  return (
    <>
      <Layer rotate={sway} origin={[100, 30]}>
        <circle cx="98" cy="16" r="13" fill={LEAF_DARK} />
        <circle cx="86" cy="26" r="9" fill={LEAF_DARK} />
        <circle cx="104" cy="32" r="9" fill={LEAF_DARK} />
        <circle cx="96" cy="18" r="10" fill={LEAF} />
        <circle cx="90" cy="12" r="4.2" fill={LEAF_LIGHT} />
      </Layer>
      <path d="M99 100 L100 40 L109 40 L109 100 Z" fill={BARK} />
      <path d="M103 52 q1.4 5 0 10 M105 74 q-1.4 5 0.2 9" fill="none" stroke={BARK_DARK} strokeWidth="1.2" strokeLinecap="round" />
      {/* すを のせる えだ(みき から よこへ) */}
      <path d="M102 91 L24 94" fill="none" stroke={BARK} strokeWidth="6.4" strokeLinecap="round" />
      <path d="M72 93 q1 -2.4 -0.4 -4.4" fill="none" stroke={BARK_DARK} strokeWidth="1.1" strokeLinecap="round" />
    </>
  )
}

function NestBack() {
  return <ellipse cx="50" cy="80" rx="28" ry="8" fill={NEST_BACK} />
}

/** すの まえがわ: ひなの 下の ほう を かくす。 */
function NestFront() {
  return (
    <>
      <path d="M22 80 Q23 95 50 96 Q77 95 78 80 Q50 88 22 80 Z" fill={NEST} />
      <path d="M26 84 Q50 91 74 84 M30 90 Q50 95 70 90 M36 82 l4 8 M54 86 l3 8 M66 83 l-4 8" fill="none" stroke={NEST_DARK} strokeWidth="1.3" strokeLinecap="round" />
    </>
  )
}

type ChickProps = {
  /** くち の ひらき(0 = とじる / 1 = 字の大きさ まで あける) */
  readonly open: number
  readonly mood: Mood
  /** はね の ばたばた(度) */
  readonly wing: number
}

/** ひな。まるい ふわふわの 体。字の くち の 形 が、あけた くち の ちょうど 中に 入る。 */
function Chick({ open, mood, wing }: ChickProps) {
  const bottomLeft = along(TOP_LEFT, BOTTOM_LEFT, open)
  const bottomRight = along(TOP_RIGHT, BOTTOM_RIGHT, open)
  const shape = `M${TOP_LEFT[0]} ${TOP_LEFT[1]} L${TOP_RIGHT[0]} ${TOP_RIGHT[1]} L${bottomRight[0]} ${bottomRight[1]} L${bottomLeft[0]} ${bottomLeft[1]} Z`
  const midX = (bottomLeft[0] + bottomRight[0]) / 2
  const floor = (bottomLeft[1] + bottomRight[1]) / 2
  const top = (TOP_LEFT[1] + TOP_RIGHT[1]) / 2
  return (
    <>
      {/* はね: あたまの よこ から 出る */}
      <Layer rotate={-wing} origin={[14, 58]}>
        <ellipse cx="6" cy="68" rx="7.5" ry="13" fill={CHICK_DARK} />
      </Layer>
      <Layer rotate={wing} origin={[96, 58]}>
        <ellipse cx="104" cy="68" rx="7.5" ry="13" fill={CHICK_DARK} />
      </Layer>
      {/* 体(まるい あたま と おなか) */}
      <ellipse cx="55" cy="52" rx="48" ry="46" fill={CHICK} />
      <ellipse cx="55" cy="74" rx="36" ry="22" fill={CHICK_LIGHT} />
      {/* あたまの 上の ふわふわの け */}
      <path d="M49 7 Q47 -1 52 1 M56 6 Q57 -3 61 0 M63 8 Q66 1 69 5" fill="none" stroke={CHICK_DARK} strokeWidth="2.4" strokeLinecap="round" />
      {/* くちばし(くち の まわり) */}
      <path d={shape} fill={BEAK} stroke={BEAK} strokeWidth="17" strokeLinejoin="round" />
      <path d={`M${TOP_LEFT[0] + 2} ${TOP_LEFT[1] - 6.5} L${TOP_RIGHT[0] - 2} ${TOP_RIGHT[1] - 6.5}`} stroke={BEAK_LIGHT} strokeWidth="2.6" strokeLinecap="round" />
      {/* くち の なか */}
      <path d={shape} fill={MOUTH} stroke={MOUTH} strokeWidth="3" strokeLinejoin="round" />
      {open > 0.15 && <ellipse cx={midX} cy={top + (floor - top) * 0.3} rx="15" ry={9 * open} fill={THROAT} />}
      {open > 0.15 && <ellipse cx={midX} cy={floor - 5 * open} rx="17" ry={6.5 * open} fill={TONGUE} />}
      {/* ほっぺ */}
      <circle cx="12" cy="44" r="5.2" fill={CHEEK} opacity="0.6" />
      <circle cx="98" cy="44" r="5.2" fill={CHEEK} opacity="0.6" />
      <Eyes mood={mood} />
    </>
  )
}

function Eyes({ mood }: { readonly mood: Mood }) {
  if (mood === 'hungry') {
    // しょんぼり: まゆ が 下がり、目は ちいさく うるうる
    return (
      <>
        <path d="M26 15 L41 9.5 M84 15 L69 9.5" stroke={CHICK_DARK} strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="34" cy="19" r="3.8" fill={EYE} />
        <circle cx="76" cy="19" r="3.8" fill={EYE} />
        <circle cx="35.2" cy="17.8" r="1.3" fill="#ffffff" />
        <circle cx="77.2" cy="17.8" r="1.3" fill="#ffffff" />
        <path d="M30 24 q-1.4 3.6 0 5.4 q1.4 -1.8 0 -5.4 Z" fill="#7cc4f2" />
      </>
    )
  }
  // うれしい: 目が まんまるに ひらき、ひかる
  return (
    <>
      <path d="M27 8 Q34 4 41 8 M69 8 Q76 4 83 8" fill="none" stroke={CHICK_DARK} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="34" cy="17.5" r="5.2" fill={EYE} />
      <circle cx="76" cy="17.5" r="5.2" fill={EYE} />
      <circle cx="35.8" cy="15.6" r="1.9" fill="#ffffff" />
      <circle cx="77.8" cy="15.6" r="1.9" fill="#ffffff" />
      <circle cx="32.6" cy="19.6" r="0.9" fill="#ffffff" />
      <circle cx="74.6" cy="19.6" r="0.9" fill="#ffffff" />
    </>
  )
}

/** ミミズ。ぶらさがって くねくね。 */
function Worm({ t, length }: { readonly t: number; readonly length: number }) {
  const points = Array.from({ length: 6 }, (_, i) => {
    const s = i / 5
    return [Math.sin(s * 6 + t * 9) * 1.3 * s, s * length] as const
  })
  const d = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')
  return (
    <>
      <path d={d} fill="none" stroke={WORM} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={WORM_LIGHT} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1.2 1.6" />
    </>
  )
}

/** おかあさん鳥(左むき)。はね は せなか、くちばし は あたまの さき、ミミズを くわえる。 */
function MotherBird({ t, flap }: { readonly t: number; readonly flap: number }) {
  return (
    <>
      <path d="M8 -0.5 L19 -3.5 L18 4 Z" fill={MOM_DARK} />
      <ellipse cx="0" cy="0" rx="10" ry="6.5" fill={MOM} />
      <ellipse cx="-2" cy="2.6" rx="7" ry="3.6" fill={MOM_BELLY} />
      <path d="M-2 6.2 l-0.6 3.4 M2 6.2 l0.6 3.4" stroke={BEAK} strokeWidth="1" strokeLinecap="round" />
      <Layer rotate={flap} origin={[2, -3]}>
        <path d="M-4 -3 Q2 -17 13 -9 Q7 -2 -4 -3 Z" fill={MOM_DARK} />
      </Layer>
      <circle cx="-9" cy="-4.6" r="4.8" fill={MOM} />
      <circle cx="-10.8" cy="-5.6" r="0.9" fill={EYE} />
      <circle cx="-7.8" cy="-2.6" r="1.2" fill={CHEEK} opacity="0.6" />
      <path d="M-13.2 -5.4 L-19.6 -3.6 L-13.2 -2.6 Z" fill={BEAK} />
      <g transform="translate(-19 -3.2)">
        <Worm t={t} length={12 + 3 * span(t, OPEN, OPEN + 0.8)} />
      </g>
    </>
  )
}

/** おなかが すいた ひなの ふきだし(ミミズが ほしい) */
function Thought({ t }: SceneProps) {
  const show = during(t, THINK, FLY + 0.4, 0.3)
  if (show <= 0) return null
  const bob = wave(t, 1.6) * 0.8
  return (
    <g opacity={show} transform={`translate(0 ${bob})`}>
      <circle cx="33" cy="49" r="1.5" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <circle cx="29.5" cy="44" r="2.3" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <ellipse cx="21" cy="32" rx="12.5" ry="9.5" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
      <path d="M13.5 33 q2 -4.6 4 0 t4 0 t4 0 t3 -1" fill="none" stroke={WORM} strokeWidth="2.2" strokeLinecap="round" />
    </g>
  )
}

/** ひらひら おちる 葉 */
function FallingLeaf({ t }: SceneProps) {
  const p = span(t, 0.9, 4.6)
  if (p <= 0 || p >= 1) return null
  const x = 90 - p * 30 + Math.sin(p * 9) * 5
  const y = 26 + p * 56
  return <path d="M0 -3 Q2.6 0 0 3 Q-2.6 0 0 -3 Z" fill={LEAF_LIGHT} stroke={LEAF_DARK} strokeWidth="0.5" transform={`translate(${x} ${y}) rotate(${Math.sin(p * 9) * 50 + 20})`} />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 3)

  // ひなが すの中から ぽん と でてくる
  const pop = span(t, 0.2, POP + 0.6, backOut)
  const mood: Mood = t < SEE ? 'hungry' : 'happy'
  // おなかが ぺこぺこの ときの 「ぴよぴよ」(くち を すこし ひらく)
  const peep = 0.26 * Math.abs(wave(t, 0.7)) * during(t, THINK + 0.1, FLY + 0.6, 0.2)
  const open = t < OPEN ? peep : Math.max(0, span(t, OPEN, OPEN + 1.3, easeOut))
  const excited = during(t, SEE, OPEN + 0.5, 0.1)
  const hop = Math.abs(wave(t, 0.5)) * 5 * excited
  const wing = t < SEE ? 0 : (10 + Math.abs(wave(t, 0.22)) * 22) * (1 - span(t, ZOOM + 0.6, ZOOM + 1.2))
  // しょんぼり している間は、体が ゆっくり ゆれる
  const droop = t < SEE ? wave(t, 1.6) * 2 : 0

  // おかあさん鳥: 右上から とんできて、ひなの 上で ホバリング
  const fly = span(t, FLY, FLY + 1.4, easeOut)
  const motherX = 130 - 50 * fly
  const motherY = 12 + 24 * fly + (fly >= 1 ? wave(t, 0.6) * 1.2 : 0)
  const flapping = fly >= 1 ? wave(t, 0.3) * 18 - 8 : wave(t, 0.16) * 30 - 8

  // カメラ: ひなの くち を まんなかへ むけて ぐーんと よる
  const zoom = span(t, ZOOM, ZOOM + 1.6, easeInOut)
  const scale = mix(t, ZOOM, ZOOM + 1.6, 1, 1 / CHICK_SMALL, easeInOut)
  const focusX = CHICK_AT[0] + (MOUTH_CENTER[0] - CHICK_AT[0]) * zoom
  const focusY = CHICK_AT[1] + (MOUTH_CENTER[1] - CHICK_AT[1]) * zoom
  const camera = `translate(${focusX} ${focusY}) scale(${scale}) translate(${-CHICK_AT[0]} ${-CHICK_AT[1]})`

  return (
    <>
      <Layer opacity={ink.picture}>
        <g transform={camera}>
          <Backdrop t={t} />
          <Tree t={t} />
          <Layer scale={pop} origin={[50, 84]}>
            <NestBack />
            <g transform={`translate(${CHICK_AT[0]} ${CHICK_AT[1] + droop * 0.2}) scale(${CHICK_SMALL}) translate(${-MOUTH_CENTER[0]} ${-MOUTH_CENTER[1] - hop})`}>
              <Chick open={open} mood={mood} wing={wing} />
            </g>
            <NestFront />
          </Layer>
          <Thought t={t} />
          <FallingLeaf t={t} />
          {t >= FLY && (
            <Layer x={motherX} y={motherY} rotate={mix(t, FLY, FLY + 1.4, -10, 0)}>
              <MotherBird t={t} flap={flapping} />
            </Layer>
          )}
        </g>
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Ink char={CHAR} progress={ink.progress} tint={ink.tint} />
      <Sparkles cx={54.5} cy={54} progress={ink.sparkle} />
    </>
  )
}

const scene: SceneModule = {
  char: CHAR,
  duration: DURATION,
  beats: [
    { at: 0, label: '木の えだの すに、ひなが ぴよぴよ', sound: 'pop' },
    { at: THINK, label: 'おなかが ぺこぺこ。ミミズが たべたい' },
    { at: FLY, label: 'おかあさん鳥が ミミズを もってくる', sound: 'pop' },
    { at: SEE, label: 'ひなが うれしくなる' },
    { at: OPEN, label: 'あーんと、おおきく くちを あける' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '口 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
