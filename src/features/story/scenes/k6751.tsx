/*
 * 村(むら): 木の ある ところに、ひとが あつまって 村になる。(共通部品 sceneFigures で 書きなおした ためし)
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 木の よこに のびた えだ
 *   2画目(丨)  … 木の みき
 *   3・4画目   … 左右に たれた えだ
 *   5画目(一)  … 子が りょうてを ひろげて「おいで」と まねく うで(かた の たかさ)
 *   6画目(亅)  … その子の からだ(あたま から あし まで)
 *   7画目(丶)  … (絵の 点は とくに 作らない。字の 点は <Ink> が書く)
 *
 * ながれ
 *   木が そだつ → 木の そばで 子が ひとり、さびしそうに きょろきょろ
 *   → 「おーい」と よぶ → 木の むこうから 人が 1人ずつ あるいて あつまってくる
 *   → 手を ふって あいさつ。いえが ぽん ぽん と たって、子は うれしくて ぴょんぴょん
 *   → りょうてを ひろげて「ようこそ」 → ほね が ひかって、絵が うすくなり、字「村」が のこる
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Canopy, CLOTHES, Clouds, Hills, House, LOOKS, Meadow, mixLimb, PALETTE, Person, Sun, walk, type Expression, type LimbAngles } from '../sceneFigures'

const CHAR = '村'

/** くぎり の時間(秒) */
const GIRL = 0.9
/** 「おーい」と よぶ */
const CALL = 2.7
/** 人が あるきはじめる */
const COME = 3.1
/** みんな あつまって よろこぶ */
const HAPPY = 4.9
/** りょうてを ひろげる */
const WIDE = 5.9
const INK = 7.0
const DONE = 10.0
const DURATION = 10.6

/** 子の 足もと。からだ が 6画目に のる */
const GIRL_X = 82
const GIRL_FEET = 92.5
/** ひろげた うで の 手先(5画目の 書きはじめ の あたり) */
const ARM_GOAL: readonly [number, number] = [54, 40.6]

function Tree({ t }: SceneProps) {
  // みき が下から のびて、えだ が ひろがり、さいごに 葉が ぽん と しげる
  const trunk = span(t, 0, 0.55, backOut)
  const boughs = span(t, 0.3, 0.75, backOut)
  const leaves = span(t, 0.5, 1.0, backOut)
  const sway = wave(t, 3.4) * 1.3
  return (
    <>
      <ellipse cx="36" cy="97.4" rx={19 * trunk} ry="3" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.6 + 0.4 * trunk} scaleY={trunk} origin={[36, 96]}>
        <path d="M27 97 Q33 91 32 83 L40.6 83 Q40 91 46 97 Z" fill={PALETTE.bark} />
        <Bone char={CHAR} n={2} color={PALETTE.bark} width={9.5} />
        <path d="M33.8 56 q1.6 5 0 11 M38.6 70 q-1.4 5 0.2 10" fill="none" stroke={PALETTE.barkDark} strokeWidth="1.3" strokeLinecap="round" />
      </Layer>
      <Layer scale={boughs} origin={[36, 38]}>
        {[1, 3, 4].map((n) => (
          <Bone key={n} char={CHAR} n={n} color={PALETTE.bark} width={n === 1 ? 6.2 : 5.4} />
        ))}
      </Layer>
      {/* えだの先の 小さな しげみ */}
      <Layer scale={leaves} origin={[36, 38]} rotate={sway * 0.6}>
        <circle cx="14.5" cy="74" r="5" fill={PALETTE.leafDark} />
        <circle cx="16.4" cy="71.4" r="3.6" fill={PALETTE.leaf} />
        <circle cx="50.4" cy="61.4" r="4.4" fill={PALETTE.leafDark} />
        <circle cx="49" cy="59" r="3.2" fill={PALETTE.leaf} />
      </Layer>
      <Canopy x={35} y={20} r={31} grow={span(t, 0.5, 1)} sway={sway} fruit />
    </>
  )
}

/** 主役の 子。まえむき。うで は「たらす → よぶ(手を ふる)→ ひろげる」 */
function Girl({ t }: SceneProps) {
  const pop = span(t, 0.3, GIRL + 0.3, backOut)
  if (pop <= 0) return null
  const face: Expression = t < CALL ? 'sad' : t < COME + 0.9 ? 'surprised' : 'joy'
  const wide = span(t, HAPPY + 0.9, WIDE + 0.9, easeInOut)
  const raise = span(t, CALL, CALL + 0.5, easeOut)
  // 画面の 左の うで(この子の 右うで): さいごに 5画目の 上へ のばす
  const right = mixLimb({ swing: 8, bend: -5 }, { to: ARM_GOAL }, wide)
  // 画面の 右の うで(左うで):「おーい」で 上げて ふり、さいごは ひじを まげて ひらく
  const waving: LimbAngles = { swing: 8 + 142 * raise, bend: -4 + 22 * raise + wave(t, 0.5) * 14 * raise * (1 - wide) }
  const left = mixLimb(waving, { swing: 75, bend: 75 }, wide)
  const hop = Math.abs(wave(t - HAPPY, 0.55)) * 2.4 * during(t, HAPPY, WIDE + 0.2, 0.15)
  return (
    <Layer scale={pop} origin={[GIRL_X, GIRL_FEET]}>
      <Person x={GIRL_X} y={GIRL_FEET} facing="front" height={80} look={LOOKS.little} face={face} gaze={t < CALL ? Math.sin(t * 2.4) : -0.8} lift={hop} pose={{ rightArm: right, leftArm: left, head: t < CALL ? 4 : 0 }} />
    </Layer>
  )
}

/** 「おーい」の こえ。くちの ひだりへ、ひろがる 3本の すじ */
function Voice({ t }: SceneProps) {
  const show = during(t, CALL + 0.2, COME + 0.9, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show} fill="none" stroke="#f0a43c" strokeWidth="1.2" strokeLinecap="round">
      {[0, 0.33, 0.66].map((offset) => {
        const p = ((t - CALL + offset) % 1) / 1
        return <path key={offset} d={`M${67 - p * 8} ${26 - p * 1.4} Q${65 - p * 8} 28.6 ${67 - p * 8} ${31.2 + p * 1.4}`} opacity={1 - p} />
      })}
    </g>
  )
}

/** いちばん とおくまで 行く人から じゅんに 出てくる(おいこさない ように) */
const WALKERS = [
  { start: COME - 0.2, arrive: COME + 1.5, target: 58, size: 1.0, look: { ...LOOKS.man, top: CLOTHES.yellow.top } },
  { start: COME + 0.1, arrive: COME + 1.7, target: 29, size: 0.86, look: { ...LOOKS.woman, top: CLOTHES.green.top } },
  { start: COME + 0.4, arrive: COME + 1.9, target: 12, size: 0.94, look: { ...LOOKS.boy, top: CLOTHES.purple.top } },
] as const

/** あつまってくる 村の人。ついたら、てまえの 手を ふって あいさつ */
function Walkers({ t }: SceneProps) {
  return (
    <>
      {WALKERS.map((w) => {
        if (t < w.start) return null
        const height = 31 * w.size
        const step = walk(t, { from: -14, to: w.target, start: w.start, end: w.arrive, build: 'adult', height, step: height * 0.42 })
        const greet = span(t, w.arrive + 0.05, w.arrive + 0.35)
        const hello = mixLimb(step.pose.leftArm ?? { swing: 4, bend: 8 }, { swing: 150, bend: 20 + wave(t, 0.45) * 14 }, greet)
        return <Person key={w.target} {...step} y={97} look={w.look} face={greet > 0 ? 'smile' : 'normal'} pose={{ ...step.pose, leftArm: hello }} />
      })}
    </>
  )
}

/** ひとりの あいだ、葉が 1まい ひらひら おちる(さびしさ を出す) */
function FallingLeaf({ t }: SceneProps) {
  const p = span(t, 1.3, CALL + 0.6)
  if (p <= 0 || p >= 1) return null
  return <path d="M0 -3 Q2.6 0 0 3 Q-2.6 0 0 -3 Z" fill={PALETTE.leafLight} stroke={PALETTE.leafDark} strokeWidth="0.5" transform={`translate(${62 + p * 4 + Math.sin(p * 9) * 4} ${22 + p * 66}) rotate(${Math.sin(p * 9) * 50 + 20})`} />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Sun t={t} x={98} y={12} r={5.4} />
        <Hills />
        <Clouds t={t} at={[[56, 6, 0.8]]} speed={1} />
        <Meadow tufts={[6, 52, 66, 102]} />
        {/* わたしたちの むらの いえ。みんなが あつまったころ、ぽん ぽん と たつ */}
        <House x={63} y={92.5} width={12} grow={span(t, HAPPY - 0.3, HAPPY + 0.35)} />
        <House x={101} y={93} width={11} wall="#fde7c8" roof="#5f8fd1" grow={span(t, HAPPY - 0.1, HAPPY + 0.55)} />
        <Tree t={t} />
        <FallingLeaf t={t} />
        <Walkers t={t} />
        <Layer opacity={span(t, 0.3, 0.55)}>
          <Girl t={t} />
          <Voice t={t} />
        </Layer>
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
    { at: 0, label: '木が そだつ', sound: 'pop' },
    { at: GIRL, label: '木の そばで 子が ひとり、さびしそう' },
    { at: CALL, label: '「おーい」と よぶ', sound: 'pop' },
    { at: COME, label: '人が あるいて あつまってくる' },
    { at: HAPPY, label: 'いえが たって、子は うれしい', sound: 'pop' },
    { at: WIDE, label: 'りょうてを ひろげて まねく' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '村 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
