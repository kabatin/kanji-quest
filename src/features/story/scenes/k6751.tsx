/*
 * 村(むら): 木の ある ところに、ひとが あつまって 村になる。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 木の よこに のびた えだ
 *   2画目(丨)  … 木の みき
 *   3・4画目   … 左右に たれた えだ
 *   5画目(一)  … 子が りょうてを ひろげて「おいで」と まねく うで(かた の たかさ)
 *   6画目(亅)  … その子の からだ(あたま から あし まで)と、さきが ひだりを むく くつ
 *   7画目(丶)  … (絵の 点は とくに 作らない。字の 点は <Ink> が書く)
 *
 * ながれ
 *   木が そだつ → 木の そばで 子が ひとり、さびしそうに きょろきょろ
 *   → 「おーい」と よぶ → 木の むこうから 人が 1人ずつ あるいて あつまってくる
 *   → 手を ふって あいさつ。いえが ぽん ぽん と たって、子は うれしくて ぴょんぴょん
 *   → りょうてを ひろげて「ようこそ」 → ほね が ひかって、絵が うすくなり、字「村」が のこる
 *
 * 子は ほんものの人の つくり を守る(字の形に合わせるために 体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく、どう の 上に あたまが のる。
 *   りょうてを ひろげた ときだけ、ひだりの うで が 5画目 に ほぼ重なる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '村'

const SKIN = '#f8cfa6'
const HAIR = '#5a3b2a'
const DRESS = '#e8647a'
const DRESS_DARK = '#c94d63'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

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

/** 子の あし もと(うしろ より)。からだの なか の じく */
const GIRL_X = 82
const GIRL_FEET = 91.5
const SHOULDER_L: readonly [number, number] = [77.5, 38.5]
const SHOULDER_R: readonly [number, number] = [86.5, 38.5]
/** うで の ぶぶん の長さ(ひろげると、かた から 木の えだの さきの ほうまで とどく) */
const ARM_PART = 12

type Mood = 'sad' | 'call' | 'happy'

const rad = (deg: number) => (deg * Math.PI) / 180
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[98, 12]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="97.2" y="0.6" width="1.6" height="3.6" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 98 12)`} />
        ))}
      </Layer>
      <circle cx="98" cy="12" r={5.4 * sun} fill={SUN} />
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill="#e2f2d2" />
      {/* ゆっくり ながれる 雲(おくゆき を出す) */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.0} 0)`}>
        <ellipse cx="56" cy="6" rx="5.6" ry="2.6" />
        <ellipse cx="60" cy="4.6" rx="3.8" ry="2.6" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 52, 66, 102].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

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
        {/* ねもと: すこし ひろがる */}
        <path d="M27 97 Q33 91 32 83 L40.6 83 Q40 91 46 97 Z" fill={BARK} />
        <Bone char={CHAR} n={2} color={BARK} width={9.5} />
        <path d="M33.8 56 q1.6 5 0 11 M38.6 70 q-1.4 5 0.2 10" fill="none" stroke={BARK_DARK} strokeWidth="1.3" strokeLinecap="round" />
      </Layer>
      <Layer scale={boughs} origin={[36, 38]}>
        <Bone char={CHAR} n={1} color={BARK} width={6.2} />
        <Bone char={CHAR} n={3} color={BARK} width={5.6} />
        <Bone char={CHAR} n={4} color={BARK} width={5.2} />
      </Layer>
      {/* えだの先の 小さな しげみ */}
      <Layer scale={leaves} origin={[36, 38]} rotate={sway * 0.6}>
        <circle cx="14.5" cy="74" r="5" fill={LEAF_DARK} />
        <circle cx="16.4" cy="71.4" r="3.6" fill={LEAF} />
        <circle cx="50.4" cy="61.4" r="4.4" fill={LEAF_DARK} />
        <circle cx="49" cy="59" r="3.2" fill={LEAF} />
      </Layer>
      {/* 上の しげみ: 風で ゆっくり ゆれる */}
      <Layer scale={leaves} rotate={sway} origin={[36, 36]}>
        <circle cx="16" cy="25" r="13" fill={LEAF_DARK} />
        <circle cx="54" cy="24" r="13" fill={LEAF_DARK} />
        <circle cx="35" cy="16" r="16" fill={LEAF_DARK} />
        <circle cx="26" cy="27" r="11" fill={LEAF} />
        <circle cx="45" cy="27" r="11" fill={LEAF} />
        <circle cx="35" cy="21" r="12" fill={LEAF} />
        <circle cx="28" cy="14.5" r="4.6" fill={LEAF_LIGHT} />
        <circle cx="47" cy="17.5" r="3.4" fill={LEAF_LIGHT} />
        <circle cx="21" cy="30" r="2.2" fill="#e8534a" />
        <circle cx="49" cy="30" r="2.2" fill="#e8534a" />
      </Layer>
    </>
  )
}

/** かた から出て ひじ で まがる うで。a1・a2 は ま下から 右へ まわした角度(0 = ま下、90 = 右、-90 = 左、180 = ま上) */
function Limb({ from, a1, a2, len, width, color, handR }: { readonly from: readonly [number, number]; readonly a1: number; readonly a2: number; readonly len: number; readonly width: number; readonly color: string; readonly handR: number }) {
  const elbow = [from[0] + Math.sin(rad(a1)) * len, from[1] + Math.cos(rad(a1)) * len] as const
  const hand = [elbow[0] + Math.sin(rad(a2)) * len, elbow[1] + Math.cos(rad(a2)) * len] as const
  return (
    <>
      <path d={`M${from[0]} ${from[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r={handR} fill={SKIN} />
    </>
  )
}

type Arm = { readonly a1: number; readonly a2: number }

function Face({ mood, look, t }: { readonly mood: Mood; readonly look: number; readonly t: number }) {
  // まばたき(ときどき)
  const blink = t % 2.6 > 2.5
  return (
    <>
      <circle cx="76.4" cy="27" r="2" fill={CHEEK} opacity="0.55" />
      <circle cx="87.6" cy="27" r="2" fill={CHEEK} opacity="0.55" />
      {mood === 'happy' ? (
        <>
          <path d="M76.9 24.6 Q78.7 22.4 80.5 24.6" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M83.5 24.6 Q85.3 22.4 87.1 24.6" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M78.6 27.2 Q82 31.6 85.4 27.2 Z" fill={MOUTH} />
        </>
      ) : (
        <>
          {blink ? (
            <>
              <path d="M77 24 h3.2 M83.8 24 h3.2" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx={78.6 + look} cy="24" r="1.25" fill={EYE} />
              <circle cx={85.4 + look} cy="24" r="1.25" fill={EYE} />
            </>
          )}
          {mood === 'sad' ? (
            <>
              <path d="M76.2 21.6 l3.4 -1.4 M87.8 21.6 l-3.4 -1.4" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
              <path d="M79.8 29.4 Q82 27.6 84.2 29.4" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
            </>
          ) : (
            <ellipse cx="82" cy="28.6" rx="1.9" ry="2.3" fill={MOUTH} />
          )}
        </>
      )}
    </>
  )
}

type GirlProps = {
  readonly t: number
  readonly mood: Mood
  readonly look: number
  readonly left: Arm
  readonly right: Arm
  readonly tilt: number
}

/** 主役の 子。まえむきに 立つ。あし・くつ は ひだり(木のほう)を むく。 */
function Girl({ t, mood, look, left, right, tilt }: GirlProps) {
  return (
    <>
      {/* あし と くつ(さきが ひだりを むく) */}
      <rect x="76.4" y="62" width="4.6" height="27.5" rx="2.3" fill={PANTS} />
      <rect x="83" y="62" width="4.6" height="27.5" rx="2.3" fill={PANTS} />
      <ellipse cx="76.8" cy="90.2" rx="5.2" ry="2.5" fill={SHOE} />
      <ellipse cx="83.6" cy="90.2" rx="5" ry="2.5" fill={SHOE} />
      {/* くび(みじかい)と どう */}
      <rect x="79.6" y="28" width="4.8" height="8" rx="2.2" fill="#eeb98a" />
      {/* ワンピース: かた から すそ へ すこし ひろがる */}
      <path d="M76.8 35 Q75.4 35 75.2 38.4 L72.4 67 Q82 70.4 91.6 67 L88.8 38.4 Q88.6 35 87.2 35 Z" fill={DRESS} />
      <path d="M73.4 62 Q82 65.6 90.6 62" fill="none" stroke={DRESS_DARK} strokeWidth="1.5" strokeLinecap="round" />
      {/* むこう(みぎ)の うで・てまえ(ひだり)の うで */}
      <Limb from={SHOULDER_R} a1={right.a1} a2={right.a2} len={ARM_PART} width={4.8} color={DRESS_DARK} handR={2.8} />
      <Limb from={SHOULDER_L} a1={left.a1} a2={left.a2} len={ARM_PART} width={4.8} color={DRESS_DARK} handR={2.8} />
      {/* あたま */}
      <Layer rotate={tilt} origin={[GIRL_X, 31]}>
        {/* ふたつ むすびの かみ */}
        <circle cx="72.2" cy="27.6" r="3.6" fill={HAIR} />
        <circle cx="91.8" cy="27.6" r="3.6" fill={HAIR} />
        <circle cx="73.6" cy="23.6" r="1.5" fill="#ffd24a" />
        <circle cx="90.4" cy="23.6" r="1.5" fill="#ffd24a" />
        <ellipse cx="82" cy="22.4" rx="10" ry="9.6" fill={HAIR} />
        <circle cx="82" cy="23.6" r="8.3" fill={SKIN} />
        <path d="M73.6 22 Q73.8 12.9 82 12.9 Q90.2 12.9 90.4 22 Q86.4 17.2 82 18 Q77.6 17.2 73.6 22 Z" fill={HAIR} />
        <Face mood={mood} look={look} t={t} />
      </Layer>
    </>
  )
}

/** 「おーい」の こえ。くちの ひだりへ、ひろがる 3本の すじ。 */
function Voice({ t }: SceneProps) {
  const show = during(t, CALL + 0.2, COME + 0.9, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show} fill="none" stroke="#f0a43c" strokeWidth="1.2" strokeLinecap="round">
      {[0, 0.33, 0.66].map((offset) => {
        const p = ((t - CALL + offset) % 1) / 1
        return <path key={offset} d={`M${67 - p * 8} ${28.6 - 2.6 - p * 1.4} Q${65 - p * 8} 28.6 ${67 - p * 8} ${28.6 + 2.6 + p * 1.4}`} opacity={1 - p} />
      })}
    </g>
  )
}

type VillagerProps = {
  readonly stride: number
  /** 手を ふる 度合い(0〜1) */
  readonly greet: number
  readonly t: number
  readonly shirt: string
  readonly shirtDark: string
  readonly hair: string
}

/** とおくの 村人。足もとが (0, 0)、みぎ を むいて あるく。小さいので うで は 1本ずつ。 */
function Villager({ stride, greet, t, shirt, shirtDark, hair }: VillagerProps) {
  const swing = stride * 32
  const wavy = wave(t, 0.45) * 12
  const armA1 = lerp(swing, 150, greet)
  const armA2 = lerp(swing + 14, 168 + wavy, greet)
  return (
    <>
      <Layer rotate={stride * 22} origin={[0, -9]}>
        <rect x="-1.8" y="-9.5" width="3.4" height="9.6" rx="1.7" fill="#4b5f86" />
        <ellipse cx="0.6" cy="0" rx="2.6" ry="1.3" fill={SHOE} />
      </Layer>
      <Layer rotate={-stride * 22} origin={[0, -9]}>
        <rect x="-1.6" y="-9.5" width="3.4" height="9.6" rx="1.7" fill="#3e5c86" />
        <ellipse cx="0.8" cy="0" rx="2.6" ry="1.3" fill={SHOE} />
      </Layer>
      <rect x="-3.2" y="-20" width="6.4" height="12.4" rx="3" fill={shirt} />
      <Limb from={[0, -17.4]} a1={armA1} a2={armA2} len={4.2} width={2.6} color={shirtDark} handR={1.5} />
      {/* くび は みじかい。あたま は どう の すぐ上 */}
      <circle cx="-0.5" cy="-24" r="4.5" fill={hair} />
      <circle cx="0.6" cy="-23.4" r="4" fill={SKIN} />
      <circle cx="2" cy="-23.8" r="0.6" fill={EYE} />
      <path d="M1 -21.6 q1.4 1.2 2.6 0" fill="none" stroke={MOUTH} strokeWidth="0.6" strokeLinecap="round" />
      <path d="M-3.4 -24.6 Q-1 -29 3.8 -25.8 Q0.6 -26.4 -3.4 -24.6 Z" fill={hair} />
    </>
  )
}

type Walker = {
  readonly start: number
  readonly arrive: number
  readonly target: number
  readonly size: number
  readonly shirt: string
  readonly shirtDark: string
  readonly hair: string
}

/** いちばん とおくまで 行く人から じゅんに 出てくる(おいこさない ように) */
const WALKERS: readonly Walker[] = [
  { start: COME, arrive: COME + 1.5, target: 58, size: 1.0, shirt: '#f2a63b', shirtDark: '#d98c24', hair: '#3a2a22' },
  { start: COME + 0.3, arrive: COME + 1.7, target: 29, size: 0.86, shirt: '#59b88a', shirtDark: '#3f9b6e', hair: '#8a5a2e' },
  { start: COME + 0.6, arrive: COME + 1.9, target: 12, size: 0.94, shirt: '#8f7be0', shirtDark: '#6f5cc6', hair: '#222222' },
]

function Walkers({ t }: SceneProps) {
  return (
    <>
      {WALKERS.map((w) => {
        if (t < w.start) return null
        const x = mix(t, w.start, w.arrive, -14, w.target, easeOut)
        const walking = 1 - span(t, w.arrive - 0.3, w.arrive)
        const stride = Math.sin((t - w.start) * Math.PI * 2 * 2.2) * walking
        const bob = -Math.abs(stride) * 0.9 * w.size
        // ついて すぐ、手を ふって あいさつ
        const greet = span(t, w.arrive + 0.05, w.arrive + 0.35)
        return (
          <g key={w.target}>
            <ellipse cx={x} cy="97.3" rx={5 * w.size} ry="1.4" fill="#000000" opacity="0.12" />
            <Layer x={x} y={97 + bob} scale={w.size}>
              <Villager stride={stride} greet={greet} t={t} shirt={w.shirt} shirtDark={w.shirtDark} hair={w.hair} />
            </Layer>
          </g>
        )
      })}
    </>
  )
}

function House({ cx, base, w, wall, roof, pop }: { readonly cx: number; readonly base: number; readonly w: number; readonly wall: string; readonly roof: string; readonly pop: number }) {
  const h = w * 0.7
  return (
    <Layer scale={pop} origin={[cx, base]}>
      <rect x={cx - w / 2} y={base - h} width={w} height={h} rx="1.2" fill={wall} />
      <path d={`M${cx - w / 2 - 1.8} ${base - h + 0.8} L${cx} ${base - h - w * 0.42} L${cx + w / 2 + 1.8} ${base - h + 0.8} Z`} fill={roof} stroke={roof} strokeWidth="1.4" strokeLinejoin="round" />
      <rect x={cx - w * 0.11} y={base - h * 0.52} width={w * 0.22} height={h * 0.52} rx="0.8" fill="#8c5b3c" />
      <rect x={cx + w * 0.22} y={base - h * 0.78} width={w * 0.2} height={w * 0.2} rx="0.5" fill="#fff3b0" />
    </Layer>
  )
}

/** わたしたちの むらの いえ。みんなが あつまったころ、ぽん ぽん と たつ。 */
function Houses({ t }: SceneProps) {
  const a = span(t, HAPPY - 0.3, HAPPY + 0.35, backOut)
  const b = span(t, HAPPY - 0.1, HAPPY + 0.55, backOut)
  return (
    <>
      <House cx={63} base={92.5} w={12} wall="#fff1d6" roof="#d9654b" pop={Math.max(0, a)} />
      <House cx={101} base={93} w={11} wall="#fde7c8" roof="#5f8fd1" pop={Math.max(0, b)} />
    </>
  )
}

/** ひとりの あいだ、葉が 1まい ひらひら おちる(さびしさ を出す) */
function FallingLeaf({ t }: SceneProps) {
  const p = span(t, 1.3, CALL + 0.6)
  if (p <= 0 || p >= 1) return null
  const x = 62 + p * 4 + Math.sin(p * 9) * 4
  const y = 22 + p * 66
  return <path d="M0 -3 Q2.6 0 0 3 Q-2.6 0 0 -3 Z" fill={LEAF_LIGHT} stroke={LEAF_DARK} strokeWidth="0.5" transform={`translate(${x} ${y}) rotate(${Math.sin(p * 9) * 50 + 20})`} />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)

  const mood: Mood = t < CALL ? 'sad' : t < COME + 0.9 ? 'call' : 'happy'
  const pop = span(t, 0.3, GIRL + 0.3, backOut)
  // ひとりの ときは きょろきょろ。みんなが 来たら 木のほう(ひだり)を 見る
  const look = t < CALL ? Math.sin(t * 2.4) * 1.1 : -0.8
  const wide = span(t, HAPPY + 0.9, WIDE + 0.9, easeInOut)
  const raise = span(t, CALL, CALL + 0.5, easeOut)
  // ひだりの うで: ふだんは たれて、さいごに 5画目の うえ へ ひろげる
  const left: Arm = { a1: lerp(-8, -85, wide), a2: lerp(-3, -85, wide) }
  // みぎの うで: 「おーい」で ばんざい、あつまると 手を ふり、さいごは ひじを まげて ひらく
  const waveAmount = raise * (1 - wide)
  const base1 = 8 + 142 * raise
  const base2 = 4 + 164 * raise
  const right: Arm = { a1: lerp(base1, 75, wide), a2: lerp(base2 + wave(t, 0.5) * 14 * waveAmount, 150, wide) }
  const happy = during(t, HAPPY, WIDE + 0.2, 0.15)
  const hop = Math.abs(wave(t - HAPPY, 0.55)) * 2.4 * happy
  const tilt = t < CALL ? 4 : 0
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Houses t={t} />
        <Tree t={t} />
        <FallingLeaf t={t} />
        <Walkers t={t} />
        <Layer opacity={span(t, 0.3, 0.55)}>
          <ellipse cx={GIRL_X} cy="92.3" rx={10 - hop * 0.8} ry="2.2" fill="#000000" opacity="0.12" />
          <Layer scale={pop} origin={[GIRL_X, GIRL_FEET]}>
            <Layer y={-hop}>
              <Girl t={t} mood={mood} look={look} left={left} right={right} tilt={tilt} />
            </Layer>
          </Layer>
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
