/*
 * 組(くむ): 糸を なんぼんも あわせて、ひもを あむ。
 *
 * ほね(画と絵の対応)
 *   1〜3画目  … はりの かぎ から ぶらさがる 3本の 糸(あわせて あんだ ひも の上のほう)
 *   4画目(丨)  … あみおわった ひもの まんなか と、そこから たれる ふさ
 *   5・6画目   … ひもの 下で ひらく ふさ(左と右の 糸)
 *   7画目(丨)  … 木の たなの 左の はしら
 *   8画目(コ)  … たなの 上の いた と 右の はしら
 *   9・10画目  … たなの 中の 2まいの いた(毛糸玉を のせる)
 *   11画目(一) … たなの いちばん下の いた
 *   (糸は はりから ほぼ まっすぐ たれる。字の 斜めの線と ぴったりは 重ならないが、だいたい 同じ場所)
 *
 * ながれ
 *   木の たなが でき、赤・黄・青の 毛糸玉が ぽんと のる。女の子が あるいてきて、はりに つるした 3本の 糸を 見あげる
 *   → 1本だけ ひっぱってみる。ぷるぷる して よわそう。しょんぼり
 *   → 「あっ」(ひらめき)。3本を あわせて あめば きっと つよい
 *   → 上から 下へ、手を さげながら 3本を くみあわせて ひもを あむ。むずかしいけど がんばる
 *   → すえを むすんで ふさに する。ぐいっと ひっぱっても びくともしない。やった!
 *   → ほね が ひかって、絵が うすくなり、字「組」が のこる
 *
 * 人と ひもは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる(手の場所から ひじ を 計算する)。くび は みじかく、あたま は どう の まんなか の上。
 *   あみひも は 3本の糸が かわりばんこに 前と うしろに 通る。あんだ ところだけ 太くなり、下は ほどけて たれている。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '組'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#4fb8a8'
const SHIRT_DARK = '#3ea090'
const SHIRT_FAR = '#35887b'
const PANTS = '#5b6fb5'
const PANTS_DARK = '#4d5f9f'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const WOOD_LIGHT = '#fbe9c8'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const MOUTH = '#b9483f'
const TONGUE = '#ff8a8a'

/** 3本の糸の いろ(左から、赤・黄・青)と、ふくらんだ ところの こい色 */
const THREAD = ['#ef6a5a', '#ffc933', '#4a9be0'] as const
const THREAD_DARK = ['#cf4a3b', '#e0a812', '#2f7fc4'] as const

/** くぎり の時間(秒) */
const WALK = 0.4
const TURN = 1.15
/** 1本だけ ひっぱってみる(ひっぱる → はなす) */
const TUG = 1.4
const PULL = 2.2
const LET_GO = 2.9
/** ひらめき */
const IDEA = 3.3
/** あむ(上から 下へ) */
const BRAID = 4.4
const BRAID_END = 6.4
/** むすんで ふさに する → ひっぱる → よろこぶ */
const TIE = 6.4
const TEST = 6.8
const CHEER = 7.2
const INK = 7.8
const DONE = 11.0
const DURATION = 11.5

/** ひもを つるす かぎ の x と、糸の つけね の高さ */
const HOOK_X = 30
const KNOT_Y = 13.5
/** あみはじめの高さ(ここより上は 3本が たばに なっている)と、糸の さき */
const BRAID_TOP = 40
const THREAD_END = 93
/** あみめ: 左右の はば と、ひとまわり の たて の長さ */
const BRAID_SWING = 2.7
const BRAID_PERIOD = 8
const THREAD_WIDTH = 2.8
/** ひっぱる 糸(青)が つかまれる 高さ */
const GRAB_Y = 74

/** 女の子の 立つ場所の x、かた の高さ、うで の ぶぶん の長さ */
const BASE_X = 44.5
const SHOULDER_Y = 59.5
const ARM_PART = 12.4

type Pt = readonly [number, number]
const blend = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/* ───────── 地面・はり・たな ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[99, 14]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="98.2" y="6.6" width="1.6" height="3.2" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 99 14)`} />
        ))}
      </Layer>
      <circle cx="99" cy="14" r={4.8 * sun} fill={SUN} />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 24, 46, 82, 102].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 家の はり。ここに かぎ が ついていて、糸を つるす */
function Beam({ t }: SceneProps) {
  const show = span(t, 0, 0.4, easeOut)
  return (
    <Layer opacity={show}>
      <rect x="-2" y="-3" width="113" height="8" fill={BARK} />
      <rect x="-2" y="3.6" width="113" height="1.6" fill={BARK_DARK} />
      <path d="M8 0.6 h14 M48 1.4 h18 M84 0.4 h16" stroke={BARK_DARK} strokeWidth="0.8" strokeLinecap="round" />
      {/* かぎ(わ)と、糸の むすびめ */}
      <circle cx={HOOK_X} cy="8.4" r="3.2" fill="none" stroke="#8a929c" strokeWidth="1.3" />
      <circle cx={HOOK_X} cy="12.4" r="2.6" fill={SHOE} />
    </Layer>
  )
}

/** 毛糸玉。まいた すじ を 3本 いれる */
function Yarn({ cx, cy, color, dark, pop }: { readonly cx: number; readonly cy: number; readonly color: string; readonly dark: string; readonly pop: number }) {
  if (pop <= 0) return null
  return (
    <Layer x={cx} y={cy} scale={pop} origin={[0, 7]}>
      <circle cx="0" cy="0" r="7" fill={color} />
      <g fill="none" stroke={dark} strokeWidth="1.1" strokeLinecap="round">
        <path d="M-6 -1 Q0 3 6 -3" />
        <path d="M-5 3 Q0 -1 5 1" />
        <path d="M-2 -6 Q2 0 -1 6.5" />
      </g>
      <path d="M-5 -3.4 Q-3.4 -5.4 -1 -5.8" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    </Layer>
  )
}

/** 木の たな(且)。はしら と いた は、字の画の線そのもの */
function Shelf({ t }: SceneProps) {
  const grow = span(t, 0, 0.6, backOut)
  const pops = [0, 1, 2].map((i) => span(t, 0.45 + i * 0.15, 0.85 + i * 0.15, backOut))
  return (
    <>
      <ellipse cx="72" cy="97.6" rx={30 * grow} ry="3" fill="#000000" opacity="0.1" />
      <Layer scaleY={grow} origin={[70, 96]}>
        <rect x="57" y="23" width="28.6" height="65" fill={WOOD_LIGHT} />
        <Bone char={CHAR} n={7} color={BARK} width={4.2} />
        <Bone char={CHAR} n={8} color={BARK} width={4.2} />
        <Bone char={CHAR} n={9} color={BARK_DARK} width={3.2} />
        <Bone char={CHAR} n={10} color={BARK_DARK} width={3.2} />
        <Bone char={CHAR} n={11} color={BARK} width={4.6} />
      </Layer>
      {/* 毛糸玉: 糸と 同じ 赤・黄・青。いた の上に のる */}
      <Yarn cx={70} cy={34.9} color={THREAD[0]} dark={THREAD_DARK[0]} pop={pops[0]} />
      <Yarn cx={74} cy={55.4} color={THREAD[1]} dark={THREAD_DARK[1]} pop={pops[1]} />
      <Yarn cx={68} cy={79.7} color={THREAD[2]} dark={THREAD_DARK[2]} pop={pops[2]} />
    </>
  )
}

/* ───────── 3本の糸と あみひも ───────── */

/** 糸の ようす(いつの しゅんかん か) */
type ThreadState = {
  readonly t: number
  /** あみおわった 高さ(これより上が あみめ、下は ほどけて たれる) */
  readonly braidY: number
  /** ほどけた糸が ひらく いきおい */
  readonly spread: number
  /** ゆれの つよさ */
  readonly sway: number
  /** 青い糸を 女の子のほうへ ひっぱった 量 */
  readonly pull: number
}

const clampY = (y: number, lo: number, hi: number) => Math.min(Math.max(y, lo), hi)

/** あみめ の ある所の x。上の たば(BRAID_TOP)から、だんだん あみめ に なる */
function braidX(i: number, y: number): number {
  const env = clampY((y - BRAID_TOP) / 3, 0, 1)
  const bundle = (i - 1) * 1.3
  return HOOK_X + bundle * (1 - env) + BRAID_SWING * env * Math.sin(((y - BRAID_TOP) / BRAID_PERIOD) * Math.PI * 2 + (i * Math.PI * 2) / 3)
}

/** 糸 i の、高さ y での x */
function threadX(i: number, y: number, s: ThreadState): number {
  const knotSpread = (i - 1) * 1.3 * span(y, KNOT_Y, 24)
  if (y <= BRAID_TOP) return HOOK_X + knotSpread
  if (y <= s.braidY) return braidX(i, y)
  const below = y - s.braidY
  const sway = Math.sin(s.t * 2.2 + i * 1.7) * 0.9 * Math.min(1, below / 30) * s.sway
  // 青い糸だけ、つかまれた高さ(GRAB_Y)を ひっぱられて「く」の字に なる
  const tri = y <= GRAB_Y ? (y - BRAID_TOP) / (GRAB_Y - BRAID_TOP) : (THREAD_END - y) / (THREAD_END - GRAB_Y)
  const pulled = i === 2 ? Math.max(tri, 0) * s.pull : 0
  return braidX(i, s.braidY) + (i - 1) * s.spread * below + sway + pulled
}

function Threads({ t, state }: { readonly t: number; readonly state: ThreadState }) {
  const grow = span(t, 0.15, 0.6, easeOut)
  if (grow <= 0) return null
  const end = KNOT_Y + (THREAD_END - KNOT_Y) * grow
  const ys: number[] = []
  for (let y = KNOT_Y; y < end; y += 2) ys.push(y)
  ys.push(end)
  const strands = [ys, ys, ys]
  // あみめ(BRAID_TOP 〜 braidY)の ぶぶんを、1センチずつ 線に分けて、前に来る糸を うしろから じゅんに かさねる
  const segments: { readonly i: number; readonly y1: number; readonly y2: number; readonly depth: number }[] = []
  if (state.braidY > BRAID_TOP + 0.5) {
    for (let y = BRAID_TOP; y < state.braidY; y += 1) {
      const y2 = Math.min(y + 1, state.braidY)
      for (let i = 0; i < 3; i++) {
        const depth = Math.cos((((y + y2) / 2 - BRAID_TOP) / BRAID_PERIOD) * Math.PI * 2 + (i * Math.PI * 2) / 3)
        segments.push({ i, y1: y, y2, depth })
      }
    }
    segments.sort((a, b) => a.depth - b.depth)
  }
  return (
    <>
      {strands.map((ys, i) => {
        const upper = ys.filter((y) => y <= BRAID_TOP)
        const lower = [state.braidY, ...ys.filter((y) => y > state.braidY)]
        const path = (list: readonly number[]) => list.map((y, k) => `${k === 0 ? 'M' : 'L'}${threadX(i, y, state).toFixed(2)} ${y.toFixed(2)}`).join(' ')
        // ひっぱられている 青い糸は、のびて 少し ほそくなる
        const width = THREAD_WIDTH - (i === 2 ? 0.9 * Math.min(1, Math.abs(state.pull) / 3) : 0)
        return (
          <g key={i} fill="none" stroke={THREAD[i]} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
            {upper.length > 1 && <path d={path([...upper, BRAID_TOP])} />}
            {lower.length > 1 && <path d={path(lower)} />}
          </g>
        )
      })}
      {segments.map((seg, k) => (
        <line key={k} x1={braidX(seg.i, seg.y1)} y1={seg.y1} x2={braidX(seg.i, seg.y2)} y2={seg.y2} stroke={seg.depth > 0.3 ? THREAD[seg.i] : THREAD_DARK[seg.i]} strokeWidth={THREAD_WIDTH} strokeLinecap="round" />
      ))}
    </>
  )
}

/** むすびめ の ひも(すえ を しばる) */
function Band({ y, pop }: { readonly y: number; readonly pop: number }) {
  if (pop <= 0) return null
  return (
    <Layer x={HOOK_X} y={y} scale={pop} origin={[0, 0]}>
      <rect x="-5.6" y="-1.4" width="11.2" height="4" rx="1.8" fill={SHOE} />
      <rect x="-5.6" y="-1.4" width="11.2" height="1.3" rx="0.65" fill="#8c6a54" />
    </Layer>
  )
}

/* ───────── 女の子 ───────── */

type Mood = 'calm' | 'worry' | 'idea' | 'effort' | 'happy'

/** 二つの ほね の うで。かた と 手 の場所から、ひじ の場所を 計算する(ひじ は 下がわ へ まがる) */
function Arm({ hand, color }: { readonly hand: Pt; readonly color: string }) {
  const shoulder: Pt = [BASE_X, SHOULDER_Y]
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const reach = Math.hypot(dx, dy)
  // うで の ながさ(ぶぶん x 2)を こえて のびない
  const k = reach > ARM_PART * 1.99 ? (ARM_PART * 1.99) / reach : 1
  const hx = shoulder[0] + dx * k
  const hy = shoulder[1] + dy * k
  const d = Math.max(reach * k, 0.001)
  const h = Math.sqrt(Math.max(ARM_PART * ARM_PART - (d / 2) ** 2, 0))
  const ux = (hx - shoulder[0]) / d
  const uy = (hy - shoulder[1]) / d
  // 2つの むき の うち、下(と 少し うしろ)へ でっぱる ほう
  const options: readonly Pt[] = [
    [-uy, ux],
    [uy, -ux],
  ]
  const [px, py] = options.reduce((best, p) => (p[1] + 0.15 * p[0] > best[1] + 0.15 * best[0] ? p : best))
  const ex = (shoulder[0] + hx) / 2 + px * h
  const ey = (shoulder[1] + hy) / 2 + py * h
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${ex.toFixed(2)} ${ey.toFixed(2)} L${hx.toFixed(2)} ${hy.toFixed(2)}`} fill="none" stroke={color} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hx} cy={hy} r="3.1" fill={SKIN} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  const ink = { fill: 'none', stroke: '#2b2b2b', strokeWidth: 1.2, strokeLinecap: 'round' } as const
  return (
    <>
      <ellipse cx="-3.2" cy="4.2" rx="2" ry="1.3" fill="#ff9d9d" opacity="0.55" />
      {mood === 'calm' && (
        <>
          <circle cx="-3.4" cy="0.9" r="1.2" fill="#2b2b2b" />
          <path d="M-6.4 4.6 Q-5.2 5.8 -3.8 4.8" {...ink} stroke={MOUTH} />
        </>
      )}
      {mood === 'worry' && (
        <>
          <path d="M-5.6 -1.6 L-1.4 -3.4" {...ink} stroke={HAIR} />
          <circle cx="-3.4" cy="1.3" r="1.3" fill="#2b2b2b" />
          <path d="M-6.4 5.8 Q-5 4 -3.6 5.6" {...ink} stroke={MOUTH} />
        </>
      )}
      {mood === 'idea' && (
        <>
          <path d="M-5.6 -3.2 Q-3.6 -4.8 -1.4 -3.4" {...ink} stroke={HAIR} />
          <circle cx="-3.4" cy="0.8" r="1.7" fill="#2b2b2b" />
          <circle cx="-3.9" cy="0.2" r="0.5" fill="#ffffff" />
          <ellipse cx="-5.2" cy="5" rx="1.3" ry="1.6" fill={MOUTH} />
        </>
      )}
      {mood === 'effort' && (
        <>
          <path d="M-5.6 -3.8 L-1.4 -2.2" {...ink} stroke={HAIR} />
          <circle cx="-3.4" cy="1" r="1.2" fill="#2b2b2b" />
          <path d="M-6.2 5 L-3.6 5" {...ink} stroke={MOUTH} />
          <ellipse cx="-5.2" cy="6.1" rx="1.1" ry="0.9" fill={TONGUE} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M-5 1.4 Q-3.4 -0.8 -1.8 1.4" {...ink} />
          <path d="M-6.6 4 Q-4.8 8 -2.8 4.2 Z" fill={MOUTH} />
        </>
      )}
    </>
  )
}

type GirlProps = {
  readonly step: number
  readonly mood: Mood
  readonly near: Pt
  readonly far: Pt
  readonly tilt: number
}

/** 左むき の女の子。あし は こし から、くび は みじかく どう の上、うで は かた から。 */
function Girl({ step, mood, near, far, tilt }: GirlProps) {
  return (
    <>
      <Arm hand={far} color={SHIRT_FAR} />
      <Layer rotate={step * 17} origin={[BASE_X + 3, 74]}>
        <rect x={BASE_X - 0.5} y="72" width="5.6" height="20.6" rx="2.8" fill={PANTS_DARK} />
        <ellipse cx={BASE_X + 1} cy="93.2" rx="4.6" ry="2.6" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 17} origin={[BASE_X - 3, 74]}>
        <rect x={BASE_X - 5.6} y="72" width="5.6" height="20.6" rx="2.8" fill={PANTS} />
        <ellipse cx={BASE_X - 4.4} cy="93.2" rx="4.6" ry="2.6" fill={SHOE} />
      </Layer>
      {/* くび: どう と あたま の間を みじかく つなぐ */}
      <rect x={BASE_X - 2.6} y="51" width="5.2" height="7" rx="2.4" fill={SKIN_SHADE} />
      <rect x={BASE_X - 7} y="55.5" width="14" height="20.5" rx="6.4" fill={SHIRT} />
      <path d={`M${BASE_X - 5} 70 h10`} stroke={SHIRT_DARK} strokeWidth="1.5" strokeLinecap="round" />
      <Arm hand={near} color={SHIRT_DARK} />
      <Layer rotate={tilt} origin={[BASE_X, 54]}>
        <g transform={`translate(${BASE_X} 46)`}>
          <circle cx="0" cy="0" r="8.4" fill={SKIN} />
          <circle cx="-8.2" cy="2.4" r="1.1" fill={SKIN} />
          <ellipse cx="3.6" cy="1.8" rx="1.5" ry="2" fill={SKIN_SHADE} />
          <path d="M-8 -1.2 C-9 -10.5 5 -12 8.2 -3.5 C8.8 0 8.4 3.4 7.6 5.6 C6.6 0 2.4 -4.4 -3 -3.8 C-5.4 -3.6 -7 -2.6 -8 -1.2 Z" fill={HAIR} />
          <path d="M-1 -9.6 Q-1.6 -13.4 1.4 -12.4" fill="none" stroke={HAIR} strokeWidth="1.8" strokeLinecap="round" />
          <Face mood={mood} />
        </g>
      </Layer>
    </>
  )
}

/* ───────── にぎやかし ───────── */

/** ひらめき の「あっ」。あたまの上に ぴかっ と出る */
function IdeaMark({ t }: SceneProps) {
  const show = during(t, IDEA, IDEA + 1.0, 0.15)
  if (show <= 0) return null
  const pop = span(t, IDEA, IDEA + 0.3, backOut)
  return (
    <Layer x={BASE_X - 3} y={26} scale={pop} opacity={show} origin={[0, 0]}>
      <Star cx={0} cy={0} r={9} color="#ffe27a" spin={t * 40} />
      <Star cx={0} cy={0} r={6.5} color="#ffc233" spin={-t * 40} />
      <rect x="-0.95" y="-4" width="1.9" height="5" rx="0.95" fill="#e8534a" />
      <circle cx="0" cy="3" r="1.1" fill="#e8534a" />
    </Layer>
  )
}

/** ひっぱって 気づいた ときの あせ */
function Sweat({ t }: SceneProps) {
  const show = during(t, PULL + 0.2, IDEA, 0.2)
  if (show <= 0) return null
  const p = span(t, PULL + 0.2, IDEA)
  return <path d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" opacity={show} transform={`translate(${BASE_X + 9} ${40 + p * 6}) rotate(-12)`} />
}

/** ひっぱったとき、ぴん と はる しるし */
function Taut({ t }: SceneProps) {
  const show = during(t, TEST, CHEER, 0.12)
  if (show <= 0) return null
  return (
    <g opacity={show} fill="none" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round">
      <path d="M22.5 50 l-3 -1.4 M22.5 55 l-3.4 0 M22.5 60 l-3 1.4" stroke="#9aa6b8" />
      <path d="M37.5 50 l3 -1.4 M37.5 55 l3.4 0 M37.5 60 l3 1.4" stroke="#9aa6b8" />
    </g>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 11)

  // あるく: 左から。むきを 変えて、はり の糸のほう(左)を むく
  const walking = 1 - span(t, TURN - 0.15, TURN)
  const stride = t < WALK ? 0 : Math.sin((t - WALK) * Math.PI * 2 * 1.8) * walking
  const walkX = mix(t, WALK, TURN, -60, 0, easeOut)
  const bob = -Math.abs(stride) * 1.2
  const facing = mix(t, TURN, TURN + 0.35, -1, 1)
  const jump = Math.sin(span(t, CHEER, CHEER + 0.6) * Math.PI) * 3.5

  // 1本だけ ひっぱる: つかむ → ぷるぷる → はなす(ぶるんと ゆれて もどる)
  const hold = span(t, PULL, PULL + 0.5, easeOut)
  const quiver = t >= PULL + 0.4 && t < LET_GO ? Math.sin(t * 55) * 0.3 : 0
  const settle = t < LET_GO ? 1 : Math.exp(-(t - LET_GO) * 5) * Math.cos((t - LET_GO) * 20) * (1 - span(t, LET_GO + 0.3, LET_GO + 0.6))
  const pull = (t < LET_GO ? hold : settle) * 5.5 + quiver

  // あむ: 上から 下へ すすむ。むすんだら ふさが ひらく
  const braidY = mix(t, BRAID, BRAID_END, BRAID_TOP, 64, (x) => x)
  const tie = span(t, TIE, TIE + 0.35, backOut)
  const spread = 0.12 + 0.3 * span(t, TIE + 0.1, TEST, easeOut)
  const state: ThreadState = { t, braidY, spread, sway: 1 - 0.6 * span(t, TIE, TIE + 0.5), pull }

  // 手の ばしょ(かた から とどく ところ)
  const grab: Pt = [threadX(2, GRAB_Y, state), GRAB_Y]
  const working = Math.sin(t * 14) * 1.5 * span(t, BRAID + 0.1, BRAID_END) * (1 - span(t, BRAID_END, BRAID_END + 0.2))
  const tugDown = Math.sin(span(t, TEST, CHEER) * Math.PI) * 1.8
  const braidNear: Pt = [31.4, braidY + 0.5 + working + tugDown]
  const braidFar: Pt = [30.2, braidY + 2.5 - working + tugDown]
  const idea: Pt = [BASE_X - 7, 42]
  const cheerNear: Pt = [BASE_X - 8, 38]
  const cheerFar: Pt = [BASE_X + 2, 38]
  const handNear: Pt = [BASE_X - 1.5 - stride * 6, 83.5]
  const handFar: Pt = [BASE_X + 2 + stride * 6, 83.5]
  let near = blend(handNear, grab, span(t, TUG, TUG + 0.55, easeInOut))
  near = blend(near, idea, span(t, LET_GO, LET_GO + 0.5, easeInOut))
  near = blend(near, braidNear, span(t, IDEA + 0.6, BRAID, easeInOut))
  near = blend(near, cheerNear, span(t, CHEER, CHEER + 0.5, easeOut))
  let far = blend(handFar, braidFar, span(t, IDEA + 0.5, BRAID - 0.1, easeInOut))
  far = blend(far, cheerFar, span(t, CHEER, CHEER + 0.5, easeOut))

  const mood: Mood = t < TUG + 0.5 ? 'calm' : t < IDEA ? 'worry' : t < BRAID ? 'idea' : t < TIE ? 'effort' : 'happy'
  const tilt = mood === 'worry' ? -5 : mood === 'idea' ? 8 : mood === 'effort' ? 9 : mood === 'happy' ? 2 + Math.sin(t * 9) * 2 : 0

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Beam t={t} />
        <Shelf t={t} />
        <Threads t={t} state={state} />
        <Band y={64} pop={tie} />
        <Taut t={t} />
        <ellipse cx={BASE_X + walkX} cy="97.4" rx="9" ry="2.4" fill="#000000" opacity={0.12 * span(t, WALK, WALK + 0.2)} />
        <Layer x={walkX} y={-jump + bob} scaleX={facing} origin={[BASE_X, 60]} opacity={span(t, WALK - 0.1, WALK + 0.1)}>
          <Girl step={stride} mood={mood} near={near} far={far} tilt={tilt} />
        </Layer>
        <Sweat t={t} />
        <IdeaMark t={t} />
        <Layer opacity={during(t, TIE, TEST + 0.2, 0.2)}>
          <Star cx={24} cy={63} r={3 + wave(t, 0.4) * 0.6} color="#ffe27a" spin={t * 120} />
          <Star cx={37} cy={68} r={2.2} color="#ffffff" spin={-t * 120} />
        </Layer>
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
    { at: 0, label: '木の たなが できて、毛糸玉が のる', sound: 'pop' },
    { at: WALK, label: '女の子が あるいてきて、はりの 3本の糸を 見あげる' },
    { at: PULL, label: '1本だけ ひっぱると ぷるぷる。よわそう' },
    { at: IDEA, label: '「あっ」3本を あわせよう', sound: 'pop' },
    { at: BRAID, label: '上から 下へ、3本を あんでいく' },
    { at: TIE, label: 'すえを むすんで ふさに する。ひっぱっても だいじょうぶ', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '組 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
