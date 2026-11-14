/*
 * 歩(あるく): 子どもが 砂はまを あるいて、あしあとが ならぶ。(共通部品 sceneFigures で 書きなおした ためし)
 *
 * ほね(画と絵の対応)
 *   1画目(丨)   … 子どもの あたまから どう(まんなかの たて線)
 *   2画目(一)   … 空に うかぶ 細長い 雲
 *   3画目(丨)   … 水平線に 立つ とうだい
 *   4画目(一)   … 海と 空の さかいめ(水平線)
 *   5〜8画目    … 子どもの こし・うで・あし(だいたい 同じ 場所)
 *   ※ 子どもの 体は 部品(Person)の ほんものの つくり。字には「だいたい」重なる くらい。
 *
 * ながれ
 *   砂はまに 子どもが ぽん と 立つ。とおくに キラキラ ひかる 貝がら。「ほしいな」と 見つめる
 *   → 右あし(てまえ)を ふみだす。あしあとが ぺた。にこっと うれしくなる
 *   → 左あし、また 右あし と あるく。あしあとが ならぶ(貝がらに ちかづく)
 *   → あしを そろえて とまった ところで、ほね が ひかって 絵が うすくなり、字「歩」が のこる
 *
 * あしあとの 場所は、walk の 足あと(着地の 場所と 時刻)から 計算して、絵の 足あとと そろえている。
 */
import { backOut, during, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../../sceneParts'
import { Bird, Clouds, Dust, Footprint, LOOKS, Person, Seashore, Sun, walk, walkPrints, type Expression, type WalkPlan } from '../../sceneFigures'

const CHAR = '歩'

const SHELL = '#ff9fb2'
const SHELL_DARK = '#ee7f98'

/** くぎり の時間(秒) */
const SHELL_AT = 0.9
const WALK_START = 2.3
const WALK_END = 5.6
const INK = 6.1
const DONE = 8.9
const DURATION = 9.6

/** 地面(あしの うら の たかさ) */
const GROUND = 95.5
const KID_LOOK = { ...LOOKS.boy, top: '#f2766b', bottom: '#4f9be0', bottomKind: 'shorts', sleeves: 'short' } as const
/** あるく 子ども。元の 場面 と おなじ くらい の 歩幅(1歩 およそ 20)で、足あと が ならぶ */
const PLAN: WalkPlan = { from: 20, to: 78, start: WALK_START, end: WALK_END, build: 'child', height: 80, step: 20, armSwing: 20 }
const PRINTS = walkPrints(PLAN)
/** 足あとの 高さ(地面 より 少し てまえ)。むこうの 足 は 少し おく */
const PRINT_Y = 96.6

/* ───────── けしき ───────── */

function Scenery({ t }: SceneProps) {
  const open = span(t, 0, 0.7, easeOut)
  return (
    <Layer opacity={open}>
      <Seashore t={t} horizon={40} shore={58} sky="#d5f0fb" />
      <Sun t={t} x={97} y={12} r={5.8} />
      {/* 2画目: 細長い 雲 */}
      <Clouds t={t} at={[[73, 21, 1.1]]} speed={0.4} />
      {/* 3画目: とうだい */}
      <path d="M31.6 40 L32.8 28 H35.2 L36.4 40 Z" fill="#ffffff" />
      <path d="M32.2 33.2 H35.8 L36.1 36.4 H31.9 Z" fill="#e8534a" />
      <rect x="32.4" y="25" width="3.2" height="3.4" rx="0.6" fill="#ffe17a" />
      <path d="M31.6 25 L34 21.8 L36.4 25 Z" fill="#e8534a" />
    </Layer>
  )
}

/** とおくで はばたく かもめ */
function Gull({ t }: SceneProps) {
  const x = 72 + wave(t, 7) * 4
  const y = 9 + wave(t, 3.5) * 1.6
  return (
    <Layer opacity={span(t, 0.4, 0.9)}>
      <Bird x={x} y={y} t={t} flying facing="left" size={0.9} color="#ffffff" dark="#9aa9bf" />
    </Layer>
  )
}

/* ───────── 貝がら(子どもが ほしくなる もの) ───────── */

function Shell({ t }: SceneProps) {
  const pop = span(t, SHELL_AT, SHELL_AT + 0.5, backOut)
  const bounce = Math.max(0, wave(t, 1.3)) * 0.8
  const glint = Math.max(0, wave(t, 1.4))
  if (pop <= 0) return null
  return (
    <Layer scale={pop} origin={[98, 95]}>
      <ellipse cx="98" cy="96.4" rx="8" ry="1.8" fill="#000000" opacity="0.1" />
      <Layer y={-bounce}>
        <path d="M98 95 L88.5 87.4 Q88.5 79.4 98 78.6 Q107.5 79.4 107.5 87.4 Z" fill={SHELL} />
        <path d="M98 95 L92.5 82.6 M98 95 L98 79 M98 95 L103.5 82.6" stroke={SHELL_DARK} strokeWidth="1" strokeLinecap="round" fill="none" />
        <path d="M95.2 95.6 Q98 93.6 100.8 95.6 Q98 97 95.2 95.6 Z" fill={SHELL_DARK} />
        <Star cx={105} cy={77} r={3.6 * glint} color="#ffffff" spin={t * 60} />
      </Layer>
    </Layer>
  )
}

/* ───────── あしあと ───────── */

/** 足が ついた ところ の 砂けむり */
function Puff({ t, x, at }: { readonly t: number; readonly x: number; readonly at: number }) {
  return <Dust x={x} y={PRINT_Y - 1} p={span(t, at, at + 0.5, easeOut)} />
}

/** あしあとが つくたび、ちいさな ほし が ぽん と はじける */
function PrintStar({ t, x, at }: { readonly t: number; readonly x: number; readonly at: number }) {
  const p = span(t, at + 0.05, at + 0.6, easeOut)
  if (p <= 0 || p >= 1) return null
  return <Star cx={x} cy={89 - p * 6} r={3 * (1 - p * 0.5)} color="#ffc233" spin={p * 120} />
}

/* ───────── 子ども ───────── */

function Kid({ t }: SceneProps) {
  const w = walk(t, PLAN)
  const pop = span(t, 0.5, 1.0, backOut)
  // 貝がらを 見つめる → 1歩め の あしあとで にこっ
  const face: Expression = t < PRINTS[0].at ? 'normal' : 'smile'
  const breath = t < WALK_START ? wave(t, 1.8) * 0.25 : 0
  const head = t < PRINTS[0].at ? -4 : 2
  return (
    <Layer scale={pop} origin={[PLAN.from, GROUND]}>
      <Person {...w} y={GROUND + breath} look={KID_LOOK} face={face} pose={{ ...w.pose, head }} />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)
  return (
    <>
      <Layer opacity={ink.picture}>
        <Scenery t={t} />
        <Gull t={t} />
        <Shell t={t} />
        {PRINTS.map((p) => (
          <Footprint key={p.at} x={p.x} y={PRINT_Y + (p.side === 'left' ? 0.8 : -0.6)} size={11} facing={p.facing} kind="shoe" grow={span(t, p.at, p.at + 0.25)} />
        ))}
        {PRINTS.slice(0, 3).map((p) => (
          <Puff key={p.at} t={t} x={p.x} at={p.at} />
        ))}
        <Kid t={t} />
        {PRINTS.slice(0, 3).map((p) => (
          <PrintStar key={p.at} t={t} x={p.x} at={p.at} />
        ))}
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
    { at: 0, label: '砂はまに 子どもが 立つ', sound: 'pop' },
    { at: SHELL_AT, label: 'とおくに ひかる 貝がら。ほしいな' },
    { at: WALK_START, label: '右あしを ふみだす', sound: 'pop' },
    { at: PRINTS[0].at, label: 'あしあとが ぺた。うれしい。つぎは 左あし' },
    { at: PRINTS[2].at, label: 'あしあとが ならぶ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '歩 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
