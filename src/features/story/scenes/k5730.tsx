/*
 * 地(ち): 土の なかま。どこまでも ひろがる 土。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 芽の まんなかから ひらいた 左右の ふた葉(右が 少し 上がる)
 *   2画目(丨)  … 芽の くき(土から のびて、あたまを ささえる)
 *   3画目(ノ)  … 芽が はえている 土の もりあがりの てっぺん(くさの ふち)
 *   4画目(つ)  … とおくに ひろがる 丸い 丘
 *   5画目(丨)  … 丘の まえに たつ 大きな 木の みき
 *   6画目(乚)  … とおくから 手前へ ながれて、右へ まがる 川
 *
 * ながれ
 *   土が もりあがり、お日さまが のぼる → 土から 芽が ぽこんと 出て、ぐんぐん のびる
 *   → でも 右がわは まっ白な きりで なにも みえない(しんぱい)
 *   → 芽が 大きく いきを すって「ふーっ」と きりを ふく(わけ)
 *   → きりが はれて、丘・木・川が どこまでも ひろがって いる ことに びっくり
 *   → うれしくて ふた葉を ふる → ほね が ひかり、絵が うすくなって 字「地」になる
 *
 * 芽は、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   くき は 土から まっすぐ のびて、ふた葉は くきの おなじ高さから 左右に ひらく。
 *   あたま(つぼみ)に 顔を つけた まんが の 芽。ふたつの 葉が 手の かわり。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '地'

const SKY = '#bfe3fa'
const SUN = '#ffd24a'
const PLAIN = '#d5eeb4'
const PLAIN_FAR = '#c3e6a6'
const HILL = '#92d47c'
const HILL_DARK = '#6db860'
const BANK = '#b6e08f'
const RIVER = '#7cc4f2'
const RIVER_LIGHT = '#d8effc'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const HEAD = '#7fd08f'
const SOIL = '#a87050'
const SOIL_DARK = '#8d5a3a'
const SOIL_LIGHT = '#c08a63'
const MIST = '#f6f9fc'
const MIST_SHADE = '#e1e9f1'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** 4画目(丘)と 6画目(川)の線の式(scene-info の出力) */
const D_HILL =
  'M41,53.06c2.12,0.69,4.88,0.69,7.38-0.04c11.34-3.34,29.47-9.63,37.12-12.26c3.51-1.21,5.25,0.75,4.76,3.61c-0.93,5.4-3.34,11.85-5.26,15.89c-2.5,5.25-5.62,2.75-7.75,0'
const D_RIVER =
  'M49.49,37.62c1.26,1.26,2.02,3.13,2.02,4.85c0,8.57-0.38,20.78-0.38,28.03c0,16.5,0.87,19,22.37,19c20,0,20.64-1.75,20.64-13.07'

/** くぎり の時間(秒) */
const POP = 0.8
const GROWN = 3.0
const BLOW = 3.5
const CLEAR = 4.4
const CHEER = 5.4
const INK = 6.6
const DONE = 9.6
const DURATION = 10.2

/** 芽の 足もと(土から 出る ところ)・ふた葉の つけね・くきの まんなか */
const ROOT: readonly [number, number] = [27.2, 75]
const NODE: readonly [number, number] = [27.3, 46.5]
/** 2画目の くき: 上の はし(あたまの 下)と 下の はし */
const STEM_TOP: readonly [number, number] = [25.4, 26.3]

function Sky({ t }: SceneProps) {
  const sun = span(t, 0, 0.7, backOut)
  return (
    <>
      <rect x="0" y="0" width="109" height="109" fill={SKY} />
      <Layer opacity={sun} rotate={t * 12} origin={[9, 9]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="8.3" y="0.4" width="1.5" height="3.2" rx="0.75" fill={SUN} transform={`rotate(${i * 45} 9 9)`} />
        ))}
      </Layer>
      <circle cx="9" cy="9" r={Math.max(0, 4.6 * sun)} fill={SUN} />
      {/* とおくの 野原 */}
      <rect x="0" y="36" width="109" height="73" fill={PLAIN} />
      <path d="M0 38 Q14 31 30 36 Q44 41 60 35 Q80 29 109 37 V42 H0 Z" fill={PLAIN_FAR} />
    </>
  )
}

/** 丘・川・木: きりが はれると 見える、どこまでも ひろがる 土地 */
function Land({ t }: SceneProps) {
  const glint = (t * 0.12) % 0.2
  return (
    <>
      <ellipse cx="62" cy="62.5" rx="30" ry="3.2" fill={HILL_DARK} opacity="0.55" />
      <path d={D_HILL} fill={HILL} stroke={HILL} strokeWidth="3" strokeLinejoin="round" />
      <path d="M54 49 Q64 45 74 43" fill="none" stroke="#c7ecb2" strokeWidth="2" strokeLinecap="round" />
      <path d="M78 56 Q82 52 84 47" fill="none" stroke={HILL_DARK} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
      {/* 川: 土手 → 水 → きらきら */}
      <Bone char={CHAR} n={6} color={BANK} width={10.5} />
      <Bone char={CHAR} n={6} color={RIVER} width={6.4} />
      <g transform="translate(0 -0.9)">
        <Bone char={CHAR} n={6} color={RIVER_LIGHT} width={1.8} opacity={0.75} />
      </g>
      <path d={D_RIVER} pathLength={1} fill="none" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" strokeDasharray="0.012 0.188" strokeDashoffset={-glint} opacity="0.9" />
      {/* 手前の くさ */}
      <ellipse cx="80" cy="104" rx="40" ry="9" fill="#c5e8a9" />
      {[58, 76, 96, 104].map((x) => (
        <path key={x} d={`M${x} 101 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

function Tree({ t }: SceneProps) {
  const sway = wave(t, 3.2) * 1.1
  return (
    <>
      <ellipse cx="68.5" cy="72" rx="9" ry="2.2" fill="#000000" opacity="0.1" />
      <path d="M62.5 72 Q67.4 69 67.8 62 L69.6 62 Q69.6 69 74.6 72 Z" fill={BARK} />
      <Bone char={CHAR} n={5} color={BARK} width={6.4} />
      <path d="M66.8 34 q1.2 4 0 9 M70.2 52 q-1 4 0.2 8" fill="none" stroke={BARK_DARK} strokeWidth="1.1" strokeLinecap="round" />
      <Layer rotate={sway} origin={[68, 22]}>
        <circle cx="58.5" cy="14" r="8" fill={LEAF_DARK} />
        <circle cx="77.5" cy="14" r="8" fill={LEAF_DARK} />
        <circle cx="68" cy="9.5" r="9.2" fill={LEAF_DARK} />
        <circle cx="62" cy="14.5" r="7.4" fill={LEAF} />
        <circle cx="74.5" cy="14.5" r="7.4" fill={LEAF} />
        <circle cx="68" cy="11" r="8" fill={LEAF} />
        <circle cx="64.5" cy="7.5" r="3.2" fill={LEAF_LIGHT} />
        <circle cx="72.5" cy="9" r="2.2" fill="#e8534a" />
        <circle cx="61" cy="17" r="2" fill="#e8534a" />
      </Layer>
    </>
  )
}

/** きり の ひとかたまり(ふーっ と ふかれると、右へ とんでいく) */
type Puff = { readonly x: number; readonly y: number; readonly rx: number; readonly ry: number; readonly delay: number; readonly phase: number }

const PUFFS: readonly Puff[] = [40, 54, 68, 82, 96, 110].flatMap((x, col) =>
  [-2, 11, 24, 37, 50, 63, 76, 89, 102].map((y, row) => {
    const i = col * 9 + row
    return {
      x: x + ((i * 5) % 7) - 3,
      y: y + ((i * 3) % 5) - 2,
      rx: 11 + (i % 3) * 2.2,
      ry: 8.5 + (i % 4) * 1.4,
      delay: ((x - 36) / 80) * 0.7 + (i % 4) * 0.05,
      phase: i * 0.37,
    }
  }),
)

function Mist({ t }: SceneProps) {
  return (
    <>
      {PUFFS.map((puff, i) => {
        const go = span(t, BLOW + 0.2 + puff.delay, CLEAR + 1.0 + puff.delay, easeIn)
        const opacity = 1 - span(go, 0.55, 1)
        if (opacity <= 0) return null
        const dx = go * 62 + wave(t, 3 + (i % 3) * 0.4, puff.phase) * 0.8 * (1 - go)
        const dy = -go * 8
        return (
          <g key={i} opacity={opacity} transform={`translate(${dx} ${dy})`}>
            <ellipse cx={puff.x} cy={puff.y + 1.3} rx={puff.rx} ry={puff.ry} fill={MIST_SHADE} />
            <ellipse cx={puff.x} cy={puff.y} rx={puff.rx} ry={puff.ry} fill={MIST} />
          </g>
        )
      })}
    </>
  )
}

type Mood = 'sleep' | 'worry' | 'puff' | 'wow' | 'happy'

function moodAt(t: number): Mood {
  if (t < 2.2) return 'sleep'
  if (t < BLOW - 0.1) return 'worry'
  if (t < CLEAR) return 'puff'
  if (t < CHEER) return 'wow'
  return 'happy'
}

/** つぼみの 顔。気もちで、目・まゆ・口 を かえる。 */
function Face({ mood, cx, cy, look }: { readonly mood: Mood; readonly cx: number; readonly cy: number; readonly look: number }) {
  const lx = cx - 3.3 + look
  const rx = cx + 3.3 + look
  const ey = cy - 0.8
  return (
    <>
      {mood !== 'worry' && (
        <>
          <ellipse cx={cx - 5.8 + look * 0.5} cy={cy + 3} rx="1.9" ry="1.3" fill={CHEEK} opacity="0.6" />
          <ellipse cx={cx + 5.8 + look * 0.5} cy={cy + 3} rx="1.9" ry="1.3" fill={CHEEK} opacity="0.6" />
        </>
      )}
      {mood === 'sleep' && (
        <>
          <path d={`M${lx - 1.7} ${ey} Q${lx} ${ey + 1.6} ${lx + 1.7} ${ey}`} fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d={`M${rx - 1.7} ${ey} Q${rx} ${ey + 1.6} ${rx + 1.7} ${ey}`} fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <ellipse cx={cx + look * 0.5} cy={cy + 4.2} rx="1" ry="1.1" fill={MOUTH} />
        </>
      )}
      {mood === 'worry' && (
        <>
          <circle cx={lx} cy={ey + 0.4} r="1.2" fill={EYE} />
          <circle cx={rx} cy={ey + 0.4} r="1.2" fill={EYE} />
          <path d={`M${lx - 2.4} ${ey - 1.6} L${lx + 1.2} ${ey - 3.2}`} stroke={LEAF_DARK} strokeWidth="1" strokeLinecap="round" />
          <path d={`M${rx - 1.2} ${ey - 3.2} L${rx + 2.4} ${ey - 1.6}`} stroke={LEAF_DARK} strokeWidth="1" strokeLinecap="round" />
          <path d={`M${cx - 1.8 + look * 0.5} ${cy + 5} q1.8 -1.5 3.6 0`} fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'puff' && (
        <>
          <path d={`M${lx - 1.8} ${ey} h3.4`} stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d={`M${rx - 1.8} ${ey} h3.4`} stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx={cx + 1.6 + look * 0.5} cy={cy + 4.2} r="1.5" fill={MOUTH} />
        </>
      )}
      {mood === 'wow' && (
        <>
          <circle cx={lx} cy={ey} r="2.3" fill="#ffffff" stroke={EYE} strokeWidth="0.6" />
          <circle cx={rx} cy={ey} r="2.3" fill="#ffffff" stroke={EYE} strokeWidth="0.6" />
          <circle cx={lx + 0.5} cy={ey} r="1.2" fill={EYE} />
          <circle cx={rx + 0.5} cy={ey} r="1.2" fill={EYE} />
          <ellipse cx={cx + look * 0.5} cy={cy + 4.6} rx="1.5" ry="1.9" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d={`M${lx - 1.8} ${ey + 0.9} Q${lx} ${ey - 1.8} ${lx + 1.8} ${ey + 0.9}`} fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d={`M${rx - 1.8} ${ey + 0.9} Q${rx} ${ey - 1.8} ${rx + 1.8} ${ey + 0.9}`} fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d={`M${cx - 2.6 + look * 0.5} ${cy + 3} Q${cx + look * 0.5} ${cy + 7.6} ${cx + 2.6 + look * 0.5} ${cy + 3} Z`} fill={MOUTH} />
        </>
      )}
    </>
  )
}

/** ふた葉。つけね(NODE)から、左右に ひらく。lift で 葉さきを 上げる(ばんざい)。 */
function Leaves({ open, lift }: { readonly open: number; readonly lift: number }) {
  if (open <= 0) return null
  return (
    <Layer scale={open} origin={NODE}>
      <Layer rotate={lift} origin={NODE}>
        <path d="M27.3 46.6 Q19.5 42.6 11.5 49.5 Q20 52 27.3 46.6 Z" fill={LEAF} />
        <path d="M26.4 47.2 Q19.5 47.4 13.6 49.2" fill="none" stroke={LEAF_LIGHT} strokeWidth="0.9" strokeLinecap="round" />
      </Layer>
      <Layer rotate={-lift} origin={NODE}>
        <path d="M27.3 46.4 Q34.2 41.6 40.5 44.8 Q34 50 27.3 46.4 Z" fill={LEAF} />
        <path d="M28.2 46.6 Q34.5 45.6 38.8 44.9" fill="none" stroke={LEAF_LIGHT} strokeWidth="0.9" strokeLinecap="round" />
      </Layer>
    </Layer>
  )
}

function Sprout({ t }: SceneProps) {
  const grow = span(t, 0.9, GROWN, easeOut)
  const headPop = Math.max(0, span(t, POP, POP + 0.5, backOut))
  const rest = 1 - grow
  // くき の てっぺん(あたまの 下)は、のびるほど 上へ
  const topX = STEM_TOP[0] + rest * (ROOT[0] - STEM_TOP[0])
  const topY = STEM_TOP[1] + rest * (ROOT[1] - STEM_TOP[1])
  const headX = topX + 0.4
  const headY = topY - 5
  const mood = moodAt(t)
  const happyEnd = 1 - span(t, INK - 0.9, INK - 0.2)
  const look = mood === 'sleep' ? 0 : mood === 'happy' ? 0.7 * happyEnd : 1.4
  // いきを すって うしろへ、ふいて まえへ、たかく のびて ゆれる
  const inhale = span(t, GROWN - 0.1, BLOW, easeInOut)
  const blow = span(t, BLOW, BLOW + 0.5, easeOut)
  const lean = -3.5 * inhale + 8.5 * blow - 5 * span(t, CLEAR, CLEAR + 0.6, easeInOut)
  const settle = 1 - span(t, CLEAR + 0.4, CLEAR + 1.0)
  const sway = wave(t, 2.4) * 1.1 * (1 - span(t, CHEER + 0.6, INK - 0.3))
  const rotate = (lean * settle + sway) * grow
  const cheerAmp = during(t, CHEER, INK - 0.3, 0.2)
  const lift = cheerAmp * (16 + 12 * Math.abs(wave(t, 0.5)))
  const squash = 1 + 0.07 * inhale * (1 - blow)
  const open = Math.max(0, span(t, 1.7, 2.4, backOut))
  const hop = Math.sin(span(t, CHEER, CHEER + 0.5) * Math.PI) * 2.2
  return (
    <Layer rotate={rotate} y={-hop} origin={ROOT}>
      <Bone char={CHAR} n={2} color={LEAF} width={3.8} from={rest} to={1} />
      <Leaves open={open} lift={lift} />
      <Layer scaleX={squash} scaleY={1 / squash} origin={[headX, headY + 8]}>
        <Layer scale={headPop} origin={[headX, headY + 4]}>
          {/* つぼみ: ちいさな ふた葉の かんむり */}
          <path d={`M${headX - 1} ${headY - 8} Q${headX - 5.5} ${headY - 12} ${headX - 6.8} ${headY - 8.4} Q${headX - 4} ${headY - 7} ${headX - 1} ${headY - 8} Z`} fill={LEAF} />
          <path d={`M${headX + 1} ${headY - 8} Q${headX + 5.5} ${headY - 12.4} ${headX + 6.8} ${headY - 8.4} Q${headX + 4} ${headY - 7} ${headX + 1} ${headY - 8} Z`} fill={LEAF} />
          <circle cx={headX} cy={headY} r="9.2" fill={HEAD} />
          <path d={`M${headX - 7.4} ${headY + 4.6} Q${headX} ${headY + 11.4} ${headX + 7.6} ${headY + 4.4} Q${headX + 5} ${headY + 9.6} ${headX} ${headY + 9.4} Q${headX - 5} ${headY + 9.6} ${headX - 7.4} ${headY + 4.6} Z`} fill={LEAF} opacity="0.55" />
          <ellipse cx={headX - 3.4} cy={headY - 5.2} rx="2.4" ry="1.3" fill="#ffffff" opacity="0.4" transform={`rotate(-30 ${headX - 3.4} ${headY - 5.2})`} />
          <Face mood={mood} cx={headX} cy={headY} look={look} />
        </Layer>
      </Layer>
    </Layer>
  )
}

/** 土から 芽が 出る しゅんかん の つちつぶ */
function Crumbs({ t }: SceneProps) {
  const p = span(t, POP - 0.1, POP + 0.7)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p}>
      {[-1, -0.45, 0.35, 1].map((dir, i) => (
        <circle key={i} cx={ROOT[0] + dir * 9 * p} cy={ROOT[1] - 1 - Math.sin(p * Math.PI) * (6 - Math.abs(dir) * 2)} r={1.3 + (i % 2) * 0.5} fill={SOIL_LIGHT} />
      ))}
    </g>
  )
}

/** ねむっている 間の「z」 */
function Snore({ t }: SceneProps) {
  const show = during(t, 1.1, 2.4, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show} fill="#5f7fd6" fontWeight="700" fontFamily="inherit">
      {[0, 0.5].map((offset, i) => {
        const p = ((t - 1.1 + offset) % 1.1) / 1.1
        return (
          <text key={offset} x={36 + p * 5 + Math.sin(p * 7)} y={50 - p * 11} fontSize={4 + i * 1.3 + p * 1.6} opacity={Math.sin(p * Math.PI)}>
            z
          </text>
        )
      })}
    </g>
  )
}

/** ふーっ: 口から きりへ むかう かぜ。 */
function Wind({ t }: SceneProps) {
  const show = during(t, BLOW + 0.1, CLEAR + 0.3, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show} fill="none" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round">
      {[0, 1, 2].map((k) => {
        const p = ((t - BLOW + k * 0.25) % 0.75) / 0.75
        const x = 36 + p * 14
        const y = 25 + k * 4.5
        return <path key={k} d={`M${x} ${y} q4 -1.6 8 0`} opacity={Math.sin(p * Math.PI)} stroke="#9fc4e0" />
      })}
    </g>
  )
}

/** きりが はれてから、空を わたる 小鳥 */
function Birds({ t }: SceneProps) {
  const p = span(t, CLEAR + 0.4, CLEAR + 3.2)
  if (p <= 0 || p >= 1) return null
  return (
    <g fill="none" stroke="#4a5a6a" strokeWidth="1" strokeLinecap="round">
      {[0, 1].map((k) => {
        const x = 118 - (p * 135 - k * 9)
        const y = 20 + k * 6 + Math.sin(p * 9 + k) * 1.6
        const flap = wave(t, 0.4, k * 0.2) * 1.8
        return <path key={k} d={`M${x - 3} ${y - flap * 0.6} Q${x - 1.5} ${y - 2.4 - flap} ${x} ${y} Q${x + 1.5} ${y - 2.4 - flap} ${x + 3} ${y - flap * 0.6}`} />
      })}
    </g>
  )
}

/** 土の もりあがり: 芽は ここから はえる。てっぺんの くさの ふち が 3画目。 */
function Mound({ t }: SceneProps) {
  const rise = Math.max(0, span(t, 0, 0.7, backOut))
  return (
    <Layer scaleY={rise} origin={[22, 109]}>
      <path d="M-2 110 V85.5 Q5 85 11 82 L38.8 67.5 Q45 63.5 46 72 Q47 90 45 110 Z" fill={SOIL} />
      <path d="M-2 98 Q20 92 46 99 V110 H-2 Z" fill={SOIL_DARK} />
      <circle cx="12" cy="92" r="1.6" fill={SOIL_LIGHT} />
      <circle cx="33" cy="86" r="1.3" fill={SOIL_LIGHT} />
      <circle cx="22" cy="102" r="1.8" fill={SOIL_LIGHT} />
      <circle cx="39" cy="96" r="1.4" fill={SOIL_LIGHT} />
      <Bone char={CHAR} n={3} color={LEAF} width={3.4} />
      <path d="M-2 86 Q4 86.6 11 83.4" fill="none" stroke={LEAF} strokeWidth="3.2" strokeLinecap="round" />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Land t={t} />
        <Tree t={t} />
        <Mist t={t} />
        <Birds t={t} />
        <Wind t={t} />
        <Snore t={t} />
        <Sprout t={t} />
        <Mound t={t} />
        <Crumbs t={t} />
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
    { at: 0, label: '土が もりあがり、お日さまが のぼる', sound: 'pop' },
    { at: POP, label: '土から 芽が ぽこんと 出て、のびる', sound: 'pop' },
    { at: GROWN, label: '右は まっ白な きりで みえない' },
    { at: BLOW, label: 'ふーっ と きりを ふく' },
    { at: CLEAR, label: 'きりが はれて、ひろい 土地に びっくり', sound: 'pop' },
    { at: CHEER, label: 'うれしくて ふた葉を ふる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '地 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
