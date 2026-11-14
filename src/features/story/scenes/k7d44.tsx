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
 * 人は Person。あるきは walk、ふりむきは turnAround、うでは { to } で 糸の ところへ とどかせる(ひじ は 部品が 計算する)。
 * あみひも は 3本の糸が かわりばんこに 前と うしろに 通る。あんだ ところだけ 太くなり、下は ほどけて たれている。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, HANG_ARM, LOOKS, mixLimb, Person, personRig, Sweat, turnAround, walk, type Expression, type Limb } from '../sceneFigures'

const CHAR = '組'

const SHIRT = '#4fb8a8'
const PANTS = '#5b6fb5'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const WOOD_LIGHT = '#fbe9c8'

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

/** 女の子の 立つ場所の x(こし) */
const BASE_X = 44.5

type Pt = readonly [number, number]

/* ───────── はり・たな ───────── */

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

type Mood = 'calm' | 'worry' | 'idea' | 'effort' | 'happy'

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

/** 女の子の 背の高さ と 見た目(みどりの シャツ・あおい ズボン) */
const GIRL_HEIGHT = 58
const GIRL_FLOOR = 96
const GIRL_LOOK = { ...LOOKS.girl, hairStyle: 'bob', top: SHIRT, bottom: PANTS, bottomKind: 'pants', sleeves: 'long' } as const
const FACES: Readonly<Record<Mood, Expression>> = { calm: 'normal', worry: 'worried', idea: 'surprised', effort: 'strain', happy: 'joy' }

/** 2つの うで の かっこう を まぜる(k が 0 か 1 の ときは そのまま) */
const blendLimb = (a: Limb, b: Limb, k: number): Limb => (k <= 0 ? a : k >= 1 ? b : mixLimb(a, b, k))

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 11)

  // あるく: 左から。むきを 変えて、はり の糸のほう(左)を むく
  const w = walk(t, { from: -22, to: BASE_X, start: WALK, end: TURN, build: 'child', height: GIRL_HEIGHT })
  const turn = turnAround(t, TURN, 'right', 'left')
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

  // 手の ばしょ(糸に とどく ところ)。左むき なので、てまえは 右手
  const grab: Pt = [threadX(2, GRAB_Y, state), GRAB_Y]
  const working = Math.sin(t * 14) * 1.5 * span(t, BRAID + 0.1, BRAID_END) * (1 - span(t, BRAID_END, BRAID_END + 0.2))
  const tugDown = Math.sin(span(t, TEST, CHEER) * Math.PI) * 1.8
  const braidNear: Pt = [31.4, braidY + 0.5 + working + tugDown]
  const braidFar: Pt = [30.2, braidY + 2.5 - working + tugDown]
  const idea: Pt = [BASE_X - 15, 40]
  const cheerNear: Pt = [BASE_X - 12, 30]
  const cheerFar: Pt = [BASE_X + 4, 30]
  let near: Limb = w.pose.rightArm ?? HANG_ARM
  near = blendLimb(near, { to: grab }, span(t, TUG, TUG + 0.55, easeInOut))
  near = blendLimb(near, { to: idea }, span(t, LET_GO, LET_GO + 0.5, easeInOut))
  near = blendLimb(near, { to: braidNear }, span(t, IDEA + 0.6, BRAID, easeInOut))
  near = blendLimb(near, { to: cheerNear }, span(t, CHEER, CHEER + 0.5, easeOut))
  let far: Limb = w.pose.leftArm ?? HANG_ARM
  far = blendLimb(far, { to: braidFar }, span(t, IDEA + 0.5, BRAID - 0.1, easeInOut))
  far = blendLimb(far, { to: cheerFar }, span(t, CHEER, CHEER + 0.5, easeOut))

  const mood: Mood = t < TUG + 0.5 ? 'calm' : t < IDEA ? 'worry' : t < BRAID ? 'idea' : t < TIE ? 'effort' : 'happy'
  const tilt = mood === 'worry' ? 6 : mood === 'idea' ? -6 : mood === 'effort' ? 8 : mood === 'happy' ? 2 + Math.sin(t * 9) * 2 : 0
  const girl = {
    ...w,
    ...turn,
    y: GIRL_FLOOR,
    lift: jump,
    pose: { ...w.pose, rightArm: near, leftArm: far, head: tilt },
  } as const
  const head = personRig({ ...girl, facing: 'left' }).world.head

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[99, 14]} clouds={[]} tufts={[6, 24, 46, 82, 102]} />
        <Beam t={t} />
        <Shelf t={t} />
        <Threads t={t} state={state} />
        <Band y={64} pop={tie} />
        <Taut t={t} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.1)}>
          <Person {...girl} look={GIRL_LOOK} face={FACES[mood]} />
        </Layer>
        <Sweat t={t} x={head[0] + 6} y={head[1] - 5} dir={1} show={during(t, PULL + 0.2, IDEA, 0.2)} />
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
