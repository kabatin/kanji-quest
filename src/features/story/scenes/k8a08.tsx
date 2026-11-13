/*
 * 計(はかる): 声に出して 10まで かぞえる。
 *
 * ほね(画と絵の対応)
 *   1〜7画目(言) … 子どもの あたま・口もとの あたり。声(おんぱ)が 口から 出る
 *                    (字になるとき、子どもが 言の 場所に 立っている)
 *   8画目(一)    … りんごを ならべる 横木(たな)。10この りんご が のる
 *   9画目(丨)    … たなを ささえる 柱
 *
 * ながれ
 *   りんごが 10こ。「いくつ あるのかな?」と 子どもは ふしぎそう
 *   → 「いち、に、さん…」と 声に出して、1つ かぞえるたびに りんごを ほうって たなに ならべる
 *   → 10こ そろった! 声の数と りんごの数が ぴたり。うれしくて とびはねる
 *   → ほね が ひかって、絵が うすくなり、字「計」が のこる
 *
 * 人・物は、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる。手が とどく ところまで、ひじ の まがりは 自動で きまる(2つの ほね を つなぐ計算)。
 *   りんごは 山なり に とんで、たなの 上に のる。たなの 柱は まっすぐ たつ。
 */
import { backOut, clamp01, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '計'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#f0a04b'
const TUNIC_DARK = '#d98a36'
const TUNIC_FAR = '#bd7630'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const BARK_LIGHT = '#a97652'
const LEAF = '#55b86e'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const APPLE = '#e8534a'
const APPLE_LIGHT = '#f58a80'
const VOICE = '#5f9fe0'
const MOUTH = '#b9483f'

type Vec = readonly [number, number]

/** くぎり の時間(秒) */
/** 1こめを かぞえはじめる */
const START = 1.35
/** 1こ かぞえる のに かかる時間 */
const CYCLE = 0.44
const COUNT = 10
const END = START + COUNT * CYCLE
/** 10こ そろって、よろこぶ */
const CHEER = 6.2
const INK = 7.3
const DONE = 10.2
const DURATION = 10.8

/** 子どもの 足もと と かた(うでの じく) */
const SHOULDER_NEAR: Vec = [29.3, 41]
const SHOULDER_FAR: Vec = [24.7, 41]
/** うで の 1ほんの 長さ(かた→ひじ、ひじ→手) */
const ARM_PART = 15.5
/** 手を おろしている とき の 手の場所 */
const REST_NEAR: Vec = [30.5, 70]
const REST_FAR: Vec = [14, 68]
/** りんごを ほうる しゅんかん の 手の場所(した から ふわっと) */
const RELEASE: Vec = [46, 40]
/** よろこぶとき、ばんざい の 手の場所 */
const UP_NEAR: Vec = [40, 14]
const UP_FAR: Vec = [14, 14]
/** 手のひらの 上に のる りんご の ずれ */
const HOLD: Vec = [1.2, -3.6]

const APPLE_R = 1.95

/** はこ に つんだ りんご(下の だん から 上へ)。上から 1こずつ とる */
const PILE: readonly Vec[] = [
  [38.9, 64.5], [42.3, 64.5], [45.7, 64.5], [49.1, 64.5],
  [40.6, 61.2], [44, 61.2], [47.4, 61.2],
  [42.3, 57.9], [45.7, 57.9],
  [44, 54.6],
]
/** とる じゅん(上から) */
const ORDER: readonly Vec[] = [...PILE].reverse()

/** たな(8画目)の 上面の 高さ。画の線は x が ふえると 少し 上がる */
const boardY = (x: number) => 47.9 - (x - 52.2) * 0.0893
/** 柱(9画目)を よけて、左に 5こ・右に 5こ ならべる */
const SLOTS: readonly Vec[] = Array.from({ length: COUNT }, (_, k) => {
  const x = k < 5 ? 55.4 + k * 3.9 : 81.2 + (k - 5) * 3.9
  return [x, boardY(x) - 4.2] as const
})

const lerpV = (a: Vec, b: Vec, s: number): Vec => [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s]

/** とんで いく 時間: とおい ところほど ゆっくり(おなじ はやさ に見える) */
const flightTime = (k: number) => 0.3 + 0.006 * Math.max(0, SLOTS[k][0] - 47)
/** りんごを ほうる しゅんかん(その かぞえ の まんなか) */
const releaseTime = (k: number) => START + k * CYCLE + CYCLE * 0.5

/** はねる 動き: tt 秒め の 高さ(2回 はねて とまる) */
const hop = (tt: number, height: number) => (tt < 0 || tt > 1 ? 0 : Math.abs(Math.sin((tt / 0.5) * Math.PI)) * height)

/** 手の場所。かぞえる たびに、はこ → ほうる → つぎの りんご と くり返す */
function nearHandAt(t: number): Vec {
  if (t < START - 0.6) return REST_NEAR
  if (t < START) return lerpV(REST_NEAR, ORDER[0], span(t, START - 0.6, START, easeInOut))
  if (t >= END) return REST_NEAR
  const k = Math.floor((t - START) / CYCLE)
  const u = (t - START) / CYCLE - k
  if (u < 0.5) return lerpV(ORDER[k], RELEASE, easeInOut(u * 2))
  return lerpV(RELEASE, k < COUNT - 1 ? ORDER[k + 1] : REST_NEAR, easeInOut((u - 0.5) * 2))
}

/**
 * 2本の ほね(かた→ひじ→手)を つなぐ計算。手が とどく かぎり、手を target に おく。
 * prefer は「ひじ が どちらへ 出るか」の ほうこう(体の つくり として しぜんな ほう を えらぶ)。
 */
function reach(shoulder: Vec, target: Vec, prefer: Vec) {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.max(Math.hypot(dx, dy), 0.001)
  const d = Math.min(dist, ARM_PART * 2 * 0.999)
  const ux = dx / dist
  const uy = dy / dist
  const half = d / 2
  const h = Math.sqrt(Math.max(0, ARM_PART ** 2 - half ** 2))
  const side = -uy * prefer[0] + ux * prefer[1] >= 0 ? 1 : -1
  const elbow: Vec = [shoulder[0] + ux * half - uy * h * side, shoulder[1] + uy * half + ux * h * side]
  const hand: Vec = [shoulder[0] + ux * d, shoulder[1] + uy * d]
  return { elbow, hand }
}

function Arm({ shoulder, target, prefer, color }: { readonly shoulder: Vec; readonly target: Vec; readonly prefer: Vec; readonly color: string }) {
  const { elbow, hand } = reach(shoulder, target, prefer)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3" fill={SKIN} />
    </>
  )
}

function Apple({ x, y, scale = 1 }: { readonly x: number; readonly y: number; readonly scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle r={APPLE_R} fill={APPLE} />
      <circle cx="-0.7" cy="-0.6" r="0.6" fill={APPLE_LIGHT} />
      <path d="M0 -1.6 q0.2 -1.1 0.9 -1.6" fill="none" stroke={SHOE} strokeWidth="0.5" strokeLinecap="round" />
      <ellipse cx="1.3" cy="-2.5" rx="1" ry="0.5" fill={LEAF} transform="rotate(-25 1.3 -2.5)" />
    </g>
  )
}

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[98, 14]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="97.2" y="2.4" width="1.6" height="3.6" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 98 14)`} />
        ))}
      </Layer>
      <circle cx="98" cy="14" r={5.6 * sun} fill={SUN} />
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill="#e2f2d2" />
      {/* ゆっくり ながれる 雲 */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="40" cy="7.5" rx="6.5" ry="2.8" />
        <ellipse cx="44.5" cy="6" rx="4.4" ry="2.9" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 60, 104].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** たな: 柱(9画目)が たち、横木(8画目)が わたる。10この りんごを ならべる */
function Rack({ t }: SceneProps) {
  const post = span(t, 0, 0.6, backOut)
  const board = span(t, 0.3, 0.85, backOut)
  return (
    <>
      <ellipse cx="76" cy="98" rx={7 * post} ry="2" fill={BARK_DARK} opacity="0.55" />
      <Layer scaleY={post} origin={[76, 98]}>
        <Bone char={CHAR} n={9} color={BARK} width={4.8} />
        <Layer x={-1.1}>
          <Bone char={CHAR} n={9} color={BARK_LIGHT} width={1.4} />
        </Layer>
        <circle cx="76" cy="13.2" r="3.4" fill={BARK_DARK} />
      </Layer>
      <Layer scaleX={board} origin={[76, 46]}>
        <Bone char={CHAR} n={8} color={BARK} width={5} />
        <Layer y={-1.4}>
          <Bone char={CHAR} n={8} color={BARK_LIGHT} width={1.5} />
        </Layer>
      </Layer>
    </>
  )
}

/** りんごを つんだ はこ。うしろの板 → りんご → まえの板 の じゅんに かさねる */
function Crate({ t }: SceneProps) {
  const pop = span(t, 0.1, 0.55, backOut)
  return (
    <Layer scale={pop} origin={[44, 95]}>
      <rect x="36" y="62.5" width="16" height="32.5" rx="2" fill={BARK_DARK} />
      {PILE.map(([x, y], i) => {
        const taken = PILE.length - 1 - i
        return t < START + taken * CYCLE ? <Apple key={i} x={x} y={y} /> : null
      })}
      <rect x="35" y="66.5" width="18" height="29" rx="2.4" fill={BARK} />
      <path d="M37 69.6 h14" stroke={BARK_LIGHT} strokeWidth="1.2" strokeLinecap="round" />
    </Layer>
  )
}

type Mood = 'puzzle' | 'count' | 'cheer'

function Face({ mood, open }: { readonly mood: Mood; readonly open: number }) {
  return (
    <>
      <circle cx="27.4" cy="28.8" r="1.9" fill="#ff9d9d" opacity="0.55" />
      {mood === 'puzzle' && (
        <>
          <path d="M26.8 22.6 l3.2 -1" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="28.6" cy="25.4" r="1.2" fill="#2b2b2b" />
          <path d="M28.4 30.8 q0.9 -1 1.8 0 t1.8 0" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'count' && (
        <>
          <circle cx="28.6" cy="25.4" r="1.2" fill="#2b2b2b" />
          <ellipse cx="30.6" cy="30.4" rx="1.8" ry={0.5 + open * 2} fill={MOUTH} />
        </>
      )}
      {mood === 'cheer' && (
        <>
          <path d="M27.2 25.9 Q28.8 23.5 30.4 25.9" fill="none" stroke="#2b2b2b" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M28 29.4 Q30.4 29.2 32.6 29.4 Q31.9 33.6 30.3 33.5 Q28.7 33.4 28 29.4 Z" fill={MOUTH} />
          <ellipse cx="30.4" cy="32.6" rx="1.2" ry="0.7" fill="#ff8a8a" />
        </>
      )}
    </>
  )
}

type ChildProps = {
  readonly near: Vec
  readonly far: Vec
  readonly preferNear: Vec
  readonly preferFar: Vec
  readonly mood: Mood
  readonly open: number
  readonly tilt: number
}

/** 右むきの 子ども。足・どう・あたま は 24.5 を まんなかに 描いて、2.5 右へ ずらす */
function Child({ near, far, preferNear, preferFar, mood, open, tilt }: ChildProps) {
  return (
    <>
      <Arm shoulder={SHOULDER_FAR} target={far} prefer={preferFar} color={TUNIC_FAR} />
      <g transform="translate(2.5 0)">
        <rect x="18.8" y="65" width="6.2" height="27.5" rx="3.1" fill={PANTS_DARK} />
        <ellipse cx="23.6" cy="93.4" rx="5.2" ry="2.8" fill={SHOE} />
        <rect x="23.6" y="65" width="6.2" height="27.5" rx="3.1" fill={PANTS} />
        <ellipse cx="28.6" cy="93.4" rx="5.2" ry="2.8" fill={SHOE} />
        {/* くび: どう と あたま の間を みじかく つなぐ */}
        <rect x="21.9" y="32" width="5.2" height="8" rx="2.4" fill={SKIN_SHADE} />
        <rect x="17.4" y="36.6" width="14.2" height="34" rx="6.8" fill={TUNIC} />
        <path d="M19.4 62.5 h10" stroke={TUNIC_DARK} strokeWidth="1.6" strokeLinecap="round" />
      </g>
      <Arm shoulder={SHOULDER_NEAR} target={near} prefer={preferNear} color={TUNIC_DARK} />
      <Layer rotate={tilt} origin={[27, 34]}>
        <g transform="translate(2.5 0)">
          <circle cx="19.6" cy="26.6" r="2.1" fill={SKIN_SHADE} />
          <circle cx="24.5" cy="25" r="9" fill={SKIN} />
          <path d="M15.4 24 C14.8 14 26 10.6 32 14.6 C34.6 17 34.6 21 33.8 24 C31 19.6 26 18.8 22 19.8 C19 20.5 16.6 22 15.4 24 Z" fill={HAIR} />
          <path d="M26.4 15.4 Q27 12 28.8 13.6 Q29.8 11.2 31 14" fill="none" stroke={HAIR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <Face mood={mood} open={open} />
        </g>
      </Layer>
    </>
  )
}

/** 口から ひろがる 声。かぞえる たびに、3本の すじ が 右うえへ ひろがる */
function Voice({ t }: SceneProps) {
  if (t < START || t >= END) return null
  const k = Math.floor((t - START) / CYCLE)
  const u = (t - START) / CYCLE - k
  const p = clamp01((u - 0.15) / 0.6)
  if (p <= 0 || p >= 1) return null
  const [cx, cy] = [33.2, 30.4]
  const arc = (r: number) => {
    const a0 = (-60 * Math.PI) / 180
    const a1 = (10 * Math.PI) / 180
    return `M${cx + Math.cos(a0) * r} ${cy + Math.sin(a0) * r} A${r} ${r} 0 0 1 ${cx + Math.cos(a1) * r} ${cy + Math.sin(a1) * r}`
  }
  return (
    <>
      {[0, 1, 2].map((i) => {
        const pi = clamp01(p * 1.5 - i * 0.3)
        if (pi <= 0 || pi >= 1) return null
        return <path key={i} d={arc(3.8 + i * 3 + pi * 3)} fill="none" stroke={VOICE} strokeWidth="1.3" strokeLinecap="round" opacity={Math.sin(pi * Math.PI)} />
      })}
    </>
  )
}

/** かぞえた りんご: 手の上 → 山なりに とぶ → たなに のる(ぽん と はずむ) */
function FlyingApples({ t }: SceneProps) {
  return (
    <>
      {SLOTS.map(([sx, sy], k) => {
        const rel = releaseTime(k)
        if (t < rel) return null
        const fly = flightTime(k)
        const land = rel + fly
        if (t < land) {
          const s = (t - rel) / fly
          const from: Vec = [RELEASE[0] + HOLD[0], RELEASE[1] + HOLD[1]]
          const arc = 10 + 0.12 * Math.abs(sx - from[0])
          const x = from[0] + (sx - from[0]) * s
          const y = from[1] + (sy - from[1]) * s - Math.sin(s * Math.PI) * arc
          return <Apple key={k} x={x} y={y} scale={1} />
        }
        const since = t - land
        const bounce = Math.abs(Math.sin(since * 14)) * Math.exp(-since * 8) * 1.6
        const jump = hop(t - CHEER - k * 0.03, 2.4)
        return <Apple key={k} x={sx} y={sy - bounce - jump} />
      })}
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 9)

  const counting = t >= START && t < END
  const k = counting ? Math.floor((t - START) / CYCLE) : -1
  const u = counting ? (t - START) / CYCLE - k : 0
  const cheer = span(t, CHEER - 0.15, CHEER + 0.35, easeOut)
  const pop = span(t, 0.15, 0.6, backOut)

  // 手: かぞえている間は はこ ⇔ ほうる。よろこぶと、りょう手を ばんざい
  const nearBase = nearHandAt(t)
  const near = lerpV(nearBase, [UP_NEAR[0] + wave(t, 0.3) * 1.5 * cheer, UP_NEAR[1]], cheer)
  const far = lerpV([REST_FAR[0] + wave(t, 2.4) * 0.6, REST_FAR[1]], [UP_FAR[0] - wave(t, 0.3, 0.1) * 1.5 * cheer, UP_FAR[1]], cheer)
  const preferNear: Vec = [-0.4 + 1.4 * cheer, 1 - 0.5 * cheer]
  const preferFar: Vec = [-1, 0.5]

  // 口: かぞえる たびに 声を出す
  const speak = counting && u > 0.15 && u < 0.75 ? Math.sin(((u - 0.15) / 0.6) * Math.PI) : 0
  const mood: Mood = t >= CHEER - 0.1 ? 'cheer' : t >= START - 0.3 ? 'count' : 'puzzle'
  const tilt = mood === 'puzzle' ? wave(t, 1.6) * 6 : mood === 'count' ? 2 + wave(t, CYCLE) * 2 : -5
  const jump = hop(t - CHEER, 3.6)
  const holding = counting && u < 0.5

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Rack t={t} />
        <Crate t={t} />
        <ellipse cx="27" cy="97.4" rx="9" ry="2.4" fill="#000000" opacity="0.12" />
        <Layer opacity={span(t, 0.1, 0.3)} scale={pop} origin={[27, 94]}>
          <Layer y={-jump}>
            <Child near={near} far={far} preferNear={preferNear} preferFar={preferFar} mood={mood} open={speak} tilt={tilt} />
          </Layer>
        </Layer>
        <Voice t={t} />
        {holding && <Apple x={nearBase[0] + HOLD[0]} y={nearBase[1] + HOLD[1]} />}
        <FlyingApples t={t} />
        <g opacity={during(t, CHEER + 0.1, INK - 0.1, 0.25)}>
          <Star cx={56} cy={34} r={2.6} color="#ffc233" spin={t * 90} />
          <Star cx={96} cy={32} r={2.6} color="#ffc233" spin={-t * 90} />
          <Star cx={76} cy={6.5} r={2.2} color="#ffd95a" spin={t * 70} />
          <Star cx={50} cy={22} r={1.8} color="#ff7a4d" spin={t * 60} />
        </g>
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
    { at: 0, label: 'りんごが 10こ。いくつ あるのかな?', sound: 'pop' },
    { at: START, label: '声に出して「いち、に、さん」と かぞえ、1つずつ たなに ならべる', sound: 'pop' },
    { at: CHEER, label: '10こ そろった! うれしくて とびはねる', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '計 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
