/*
 * 妹(いもうと): 女の子の なかま。右は「未(マイ)」= まだ のびている わかい木。年下の おんなの子。
 *
 * ほね(画と絵の対応)
 *   1〜3画目(女) … おねえさん。あたま から 体、のばした うで(3画目 は 手を さしだす あたり)
 *   4画目(一)    … わかい木の 上の みじかい えだ
 *   5画目(一)    … わかい木の 下の ながい えだ
 *   6画目(丨)    … わかい木の みき
 *   7・8画目     … 木の 左右に たれた 大きな えだ
 *   (「未」は まだ 大きくなりきらない 木。その下に いる 小さい子 = 年下の いもうと)
 *
 * ながれ
 *   わかい木が そだつ。木の下で、小さい いもうと が ひとりで さびしくて ぽろり と なみだ
 *   → 左から おねえさん が あるいてくる。いもうと が 気づいて「あっ!」
 *   → おねえさん が 手を さしだす。いもうと は ぱっと わらって 手を つなぐ(はずむ・ハートが ふわり)
 *   → ほね が ひかって、絵が うすくなり、字「妹」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(2つの ほね を つなぐ)。くび は みじかい。
 *   おねえさん は 大きく、いもうと は 小さく あたまが 大きい(年下の子の つりあい)。
 *   手が つながる しゅんかん は、おねえさん の うで と いもうと の うで の 先が 同じ場所に くる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '妹'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const DRESS_BIG = '#ef6f8f'
const DRESS_BIG_DARK = '#d85a7b'
const DRESS_KID = '#ffc233'
const DRESS_KID_DARK = '#eaa820'
const RIBBON = '#4f9be0'
const RIBBON_KID = '#e8534a'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const TEAR = '#7cc4f2'
const HEART = '#f26b8d'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'

/** くぎり の時間(秒) */
const WALK = 1.3
const NOTICE = 2.4
const ARRIVE = 3.3
const REACH = 3.5
const JOIN = 4.3
const INK = 6.4
const DONE = 9.7
const DURATION = 10.3

/** 地面の高さ(ふたりの 足もと) */
const GROUND = 96
/** おねえさん・いもうと が 立つ場所(x)と、体の 大きさ(足もと から あたま までを 100 とした ときの ばいりつ) */
const BIG_X = 25
const BIG_SCALE = 0.84
const KID_X = 60
const KID_SCALE = 0.46
/** 手を つなぐ場所(木の 左がわ、いもうと の かた の すこし上) */
const MEET: readonly [number, number] = [48, 61]

type Pt = readonly [number, number]

/* ───────── 木(未) ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[10, 9]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="9.2" y="1.2" width="1.6" height="3.4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 10 9)`} />
        ))}
      </Layer>
      <circle cx="10" cy="9" r={4.8 * sun} fill={SUN} />
      {/* とおくの おか と ゆっくり ながれる 雲 */}
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 94 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="86" cy="8" rx="6" ry="2.6" />
        <ellipse cx="90" cy="6.6" rx="4" ry="2.6" />
        <ellipse cx="2" cy="60" rx="5" ry="2.2" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 40, 84, 102].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 小さな はっぱの かたまり(えだの先) */
function Tuft({ cx, cy, r }: { readonly cx: number; readonly cy: number; readonly r: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={LEAF_DARK} />
      <circle cx={cx - r * 0.25} cy={cy - r * 0.3} r={r * 0.72} fill={LEAF} />
    </>
  )
}

/** まだ のびている わかい木。みき が 下から のびて、えだ が ひろがり、葉が ぽん としげる */
function Tree({ t }: SceneProps) {
  const trunk = span(t, 0, 0.55, backOut)
  const boughs = span(t, 0.3, 0.8, backOut)
  const leaves = span(t, 0.5, 1.05, backOut)
  const sway = wave(t, 3.4) * 1.2
  return (
    <>
      <ellipse cx="67" cy="97.6" rx={14 * trunk} ry="2.6" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.6 + 0.4 * trunk} scaleY={trunk} origin={[66.8, 96]}>
        <path d="M60 97 Q65.5 92 65 86 L69 86 Q68.8 92 74 97 Z" fill={BARK} />
        <Bone char={CHAR} n={6} color={BARK} width={5.6} />
        <path d="M65 62 q1.2 4 0 8 M68.6 76 q-1 4 0.2 8" fill="none" stroke={BARK_DARK} strokeWidth="1.1" strokeLinecap="round" />
      </Layer>
      <Layer scale={boughs} origin={[66.8, 45]}>
        <Bone char={CHAR} n={4} color={BARK} width={3.6} />
        <Bone char={CHAR} n={5} color={BARK} width={4.4} />
      </Layer>
      <Layer scale={boughs} origin={[66, 52]}>
        <Bone char={CHAR} n={7} color={BARK} width={4.4} />
        <Bone char={CHAR} n={8} color={BARK} width={4.4} />
      </Layer>
      {/* えだの先 の 小さな しげみ */}
      <Layer scale={leaves} origin={[66.8, 50]} rotate={sway * 0.6}>
        <Tuft cx={45.5} cy={51} r={3.8} />
        <Tuft cx={92} cy={48.4} r={3.8} />
        <Tuft cx={37.4} cy={87.2} r={3.4} />
        <Tuft cx={95.6} cy={84} r={3.8} />
        <Tuft cx={52.4} cy={33.6} r={3.2} />
        <Tuft cx={82.4} cy={31.6} r={3.2} />
      </Layer>
      {/* 上の しげみ: 風で ゆっくり ゆれる */}
      <Layer scale={leaves} rotate={sway} origin={[66.8, 34]}>
        <circle cx="54" cy="21" r="10.5" fill={LEAF_DARK} />
        <circle cx="79" cy="21" r="10.5" fill={LEAF_DARK} />
        <circle cx="66.8" cy="14" r="13" fill={LEAF_DARK} />
        <circle cx="66.8" cy="23" r="12" fill={LEAF_DARK} />
        <circle cx="58" cy="22" r="8.6" fill={LEAF} />
        <circle cx="75.6" cy="22" r="8.6" fill={LEAF} />
        <circle cx="66.8" cy="16" r="9.6" fill={LEAF} />
        <circle cx="62" cy="11" r="4.2" fill={LEAF_LIGHT} />
        <circle cx="74" cy="14" r="3" fill={LEAF_LIGHT} />
      </Layer>
    </>
  )
}

/* ───────── 女の子 ───────── */

type Mood = 'sad' | 'surprised' | 'happy'

/**
 * ふたつの ほね(かた→ひじ→手)で つなぐ うで。手の場所を きめると、ひじ は 外がわ・下に まがる。
 * うでの 長さ は 1本 len。(体の 大きさに 合わせた 絵の座標)
 */
function Arm({ shoulder, hand, len, out, color }: { readonly shoulder: Pt; readonly hand: Pt; readonly len: number; readonly out: number; readonly color: string }) {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const reach = Math.min(Math.hypot(dx, dy), len * 2 - 0.01)
  const ux = dx / (Math.hypot(dx, dy) || 1)
  const uy = dy / (Math.hypot(dx, dy) || 1)
  const along = reach / 2
  const rise = Math.sqrt(Math.max(0, len * len - along * along))
  // ひじ の まがる ほうこう は、外がわ・下 に なる ほう
  const candidates: readonly Pt[] = [
    [shoulder[0] + ux * along - uy * rise, shoulder[1] + uy * along + ux * rise],
    [shoulder[0] + ux * along + uy * rise, shoulder[1] + uy * along - ux * rise],
  ]
  const [elbow] = [...candidates].sort((a, b) => b[1] + 0.4 * out * b[0] - (a[1] + 0.4 * out * a[0]))
  const end: Pt = [shoulder[0] + ux * reach, shoulder[1] + uy * reach]
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${end[0]} ${end[1]}`} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={end[0]} cy={end[1]} r="5.4" fill={SKIN} />
    </>
  )
}

type GirlProps = {
  readonly kid: boolean
  readonly mood: Mood
  /** 手の場所(この子の 足もとを 0,0・たかさ 100 の 座標) */
  readonly leftHand: Pt
  readonly rightHand: Pt
  /** あしを ふる 角度 */
  readonly step: number
  /** 目の むき(左 = -1 / 右 = 1) */
  readonly gaze: number
}

const SHOULDER_Y = -64
const SHOULDER_X = 11

/** 足もとが (0,0)、たかさ 100 の 女の子。kid は 頭が 大きい 年下の子。 */
function Girl({ kid, mood, leftHand, rightHand, step, gaze }: GirlProps) {
  const dress = kid ? DRESS_KID : DRESS_BIG
  const dressDark = kid ? DRESS_KID_DARK : DRESS_BIG_DARK
  const ribbon = kid ? RIBBON_KID : RIBBON
  const R = kid ? 15 : 11
  const hy = SHOULDER_Y - 6 - R * (kid ? 0.8 : 0.9)
  const er = R * 0.12
  const eyeY = hy + R * 0.18
  const eyeX = R * 0.4
  const g = gaze * R * 0.07
  const armLen = kid ? 15 : 16
  return (
    <>
      {/* かみ(うしろ): おねえさん は 長いかみ */}
      {!kid && <path d={`M${-R - 1.5} ${hy} Q${-R - 3} ${SHOULDER_Y + 8} ${-R + 2} ${SHOULDER_Y + 6} L${R - 2} ${SHOULDER_Y + 6} Q${R + 3} ${SHOULDER_Y + 8} ${R + 1.5} ${hy} Z`} fill={HAIR} />}
      {/* むこうがわ の うで(体の うしろ) */}
      <Arm shoulder={[-SHOULDER_X, SHOULDER_Y + 3]} hand={leftHand} len={armLen} out={-1} color={dressDark} />
      {/* あし(あるくとき かわりばんこ) */}
      <Layer rotate={step} origin={[-5, -30]}>
        <rect x="-8" y="-30" width="6" height="28" rx="3" fill={SKIN_SHADE} />
        <ellipse cx="-5.4" cy="-1.8" rx="6.4" ry="3.2" fill={SHOE} />
      </Layer>
      <Layer rotate={-step} origin={[5, -30]}>
        <rect x="2" y="-30" width="6" height="28" rx="3" fill={SKIN} />
        <ellipse cx="5.4" cy="-1.8" rx="6.4" ry="3.2" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう と あたま の間 */}
      <rect x="-3.4" y={SHOULDER_Y - 9} width="6.8" height="10" rx="3" fill={SKIN_SHADE} />
      {/* どう と スカート */}
      <path d={`M${-SHOULDER_X + 1} ${SHOULDER_Y} Q0 ${SHOULDER_Y - 4} ${SHOULDER_X - 1} ${SHOULDER_Y} L${SHOULDER_X + 6} -26 Q0 -21 ${-SHOULDER_X - 6} -26 Z`} fill={dress} />
      <path d={`M${-SHOULDER_X - 5} -29 Q0 -24 ${SHOULDER_X + 5} -29`} fill="none" stroke={dressDark} strokeWidth="2.4" strokeLinecap="round" />
      <rect x={-SHOULDER_X + 0.5} y={SHOULDER_Y + 1} width={SHOULDER_X * 2 - 1} height="5" rx="2.5" fill={dressDark} opacity="0.5" />
      {/* てまえ の うで */}
      <Arm shoulder={[SHOULDER_X, SHOULDER_Y + 3]} hand={rightHand} len={armLen} out={1} color={dress} />
      {/* あたま */}
      <circle cx="0" cy={hy} r={R} fill={SKIN} />
      {kid && (
        <>
          <circle cx={-R * 0.98} cy={hy + R * 0.2} r={R * 0.3} fill={HAIR} />
          <circle cx={R * 0.98} cy={hy + R * 0.2} r={R * 0.3} fill={HAIR} />
        </>
      )}
      <path d={`M${-R * 0.99} ${hy - R * 0.1} A${R} ${R} 0 0 1 ${R * 0.99} ${hy - R * 0.1} Q0 ${hy + R * 0.16} ${-R * 0.99} ${hy - R * 0.1} Z`} fill={HAIR} />
      <circle cx={R * 0.62} cy={hy - R * 0.62} r={R * 0.2} fill={ribbon} />
      <circle cx={-R * 0.4} cy={eyeY + R * 0.42} r={R * 0.17} fill="#ff9d9d" opacity="0.55" />
      <circle cx={R * 0.4} cy={eyeY + R * 0.42} r={R * 0.17} fill="#ff9d9d" opacity="0.55" />
      <Face mood={mood} eyeX={eyeX} eyeY={eyeY} er={er} g={g} R={R} />
    </>
  )
}

function Face({ mood, eyeX, eyeY, er, g, R }: { readonly mood: Mood; readonly eyeX: number; readonly eyeY: number; readonly er: number; readonly g: number; readonly R: number }) {
  const mouthY = eyeY + R * 0.5
  const m = R * 0.18
  if (mood === 'happy') {
    return (
      <>
        {[-1, 1].map((s) => (
          <path key={s} d={`M${s * eyeX - er * 1.4} ${eyeY + er * 0.6} Q${s * eyeX} ${eyeY - er * 1.6} ${s * eyeX + er * 1.4} ${eyeY + er * 0.6}`} fill="none" stroke={EYE} strokeWidth={er * 0.8} strokeLinecap="round" />
        ))}
        <path d={`M${-m * 1.2} ${mouthY - m * 0.3} Q0 ${mouthY + m * 2.4} ${m * 1.2} ${mouthY - m * 0.3} Z`} fill={MOUTH} />
      </>
    )
  }
  if (mood === 'surprised') {
    return (
      <>
        {[-1, 1].map((s) => (
          <circle key={s} cx={s * eyeX + g} cy={eyeY} r={er * 1.45} fill={EYE} />
        ))}
        <ellipse cx="0" cy={mouthY + m * 0.3} rx={m * 0.8} ry={m * 1.1} fill={MOUTH} />
      </>
    )
  }
  return (
    <>
      {[-1, 1].map((s) => (
        <g key={s}>
          <circle cx={s * eyeX + g} cy={eyeY} r={er * 1.1} fill={EYE} />
          <path d={`M${s * eyeX - s * er * 2.4} ${eyeY - er * 3.4} L${s * eyeX + s * er * 1.8} ${eyeY - er * 2}`} stroke={HAIR} strokeWidth={er * 0.7} strokeLinecap="round" transform={`scale(${s === 1 ? 1 : 1} 1)`} />
        </g>
      ))}
      <path d={`M${-m * 1.1} ${mouthY + m * 0.7} Q0 ${mouthY - m * 0.9} ${m * 1.1} ${mouthY + m * 0.7}`} fill="none" stroke={MOUTH} strokeWidth={er * 0.8} strokeLinecap="round" />
    </>
  )
}

/* ───────── にぎやかし ───────── */

/** いもうと の ほほ を つたう なみだ。さびしい間だけ ぽろり と おちる */
function Tears({ t, cx, cy }: SceneProps & { readonly cx: number; readonly cy: number }) {
  const show = during(t, 0.7, NOTICE, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.55].map((offset) => {
        const p = ((t + offset) % 1.1) / 1.1
        return <path key={offset} d="M0 -2 Q1.5 0.4 0 1.6 Q-1.5 0.4 0 -2 Z" fill={TEAR} transform={`translate(${cx - 2.2} ${cy + p * 9})`} opacity={1 - p * 0.7} />
      })}
    </g>
  )
}

/** 気づいた しゅんかん の「!」(あたまの上) */
function Notice({ t, cx, cy }: SceneProps & { readonly cx: number; readonly cy: number }) {
  const show = during(t, NOTICE, ARRIVE + 0.1, 0.12)
  if (show <= 0) return null
  const pop = span(t, NOTICE, NOTICE + 0.25, backOut)
  return (
    <g opacity={show} transform={`translate(${cx} ${cy}) scale(${Math.max(0, pop) * 1.6})`}>
      <rect x="-1.1" y="-6" width="2.2" height="6.4" rx="1.1" fill="#f2b632" />
      <circle cx="0" cy="3" r="1.3" fill="#f2b632" />
    </g>
  )
}

function Heart({ cx, cy, size, opacity }: { readonly cx: number; readonly cy: number; readonly size: number; readonly opacity: number }) {
  return <path d="M0 3 C-5 -1 -3 -5 0 -2.2 C3 -5 5 -1 0 3 Z" fill={HEART} opacity={opacity} transform={`translate(${cx} ${cy}) scale(${size})`} />
}

/** 手を つないだ あとの ハート。ふわり と 上へ */
function Hearts({ t }: SceneProps) {
  const show = during(t, JOIN + 0.1, INK - 0.1, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.7, 1.4].map((offset, i) => {
        const p = ((t - JOIN + offset) % 2.1) / 2.1
        return <Heart key={offset} cx={46 + i * 6 + Math.sin(p * 6 + i) * 2} cy={56 - p * 16} size={0.8 + i * 0.15} opacity={Math.sin(p * Math.PI)} />
      })}
    </g>
  )
}

/** 木の えだ に 小鳥 が とまって うたう */
function Bird({ t }: SceneProps) {
  const arrive = span(t, 2.0, 2.9, easeOut)
  if (arrive <= 0) return null
  const x = 118 - arrive * 33
  const y = 6 + arrive * 25.4 - Math.sin(arrive * Math.PI) * 8
  const landed = arrive >= 1
  const hop = landed ? Math.abs(wave(t, 0.7)) * 0.8 : 0
  const flap = landed ? 0 : wave(t, 0.16) * 28
  return (
    <Layer x={x} y={y - hop}>
      <path d="M2.6 0.4 l4.6 -1.6 l-3.4 3.2 Z" fill="#e2733f" />
      <ellipse cx="0" cy="0" rx="4" ry="3.1" fill="#ff9a5c" />
      <circle cx="-3" cy="-2.3" r="2.3" fill="#ff9a5c" />
      <path d="M-5 -2.4 l-2.4 0.7 l2.3 0.9 Z" fill="#f2b632" />
      <circle cx="-3.6" cy="-2.8" r="0.55" fill={EYE} />
      <Layer rotate={flap} origin={[0.4, -0.6]}>
        <path d="M-1.2 -0.8 Q1.6 -3.8 4 -0.6 Q1.6 0.8 -1.2 -0.8 Z" fill="#e2733f" />
      </Layer>
    </Layer>
  )
}

/** 葉が 1まい ひらひら おちる */
function FallingLeaf({ t }: SceneProps) {
  const p = span(t, 3.4, INK - 0.1)
  if (p <= 0) return null
  const x = 90 + Math.sin(p * 9) * 4
  const y = 50 + p * 44
  return <path d="M0 -3.2 Q2.8 0 0 3.2 Q-2.8 0 0 -3.2 Z" fill={LEAF_LIGHT} stroke={LEAF_DARK} strokeWidth="0.5" transform={`translate(${x} ${y}) rotate(${Math.sin(p * 9) * 50 + 20})`} />
}

/* ───────── ぜんたい ───────── */

/** 場所 + 体の大きさ から、世界の座標を この子の 座標に直す */
const toLocal = (world: Pt, x: number, scale: number): Pt => [(world[0] - x) / scale, (world[1] - GROUND) / scale]
const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)

  // おねえさん: 左から あるいてきて、いもうと の 手の 前で とまる
  const walking = 1 - span(t, ARRIVE - 0.3, ARRIVE)
  const stride = t < WALK ? 0 : Math.sin((t - WALK) * Math.PI * 2 * 1.7) * walking
  const walkX = mix(t, WALK, ARRIVE, -52, 0, easeOut)
  const bigBob = -Math.abs(stride) * 1.2
  const reach = span(t, REACH, JOIN, easeInOut)

  // いもうと: さびしい → 気づく → 手を つないで よろこぶ(はずむ)
  const kidMood: Mood = t < NOTICE ? 'sad' : t < REACH ? 'surprised' : 'happy'
  const joined = t >= JOIN
  const hop = joined && t < INK - 0.2 ? -Math.abs(wave(t - JOIN, 0.8)) * 2.4 : 0
  const happyWave = t >= JOIN ? wave(t - JOIN, 0.9) : 0
  const gaze = t < WALK ? 0 : -1

  // 手の 場所(世界の座標)。つないだ あとは はずみに あわせて ふたりの 手が いっしょに 上下する
  const meet: Pt = [MEET[0], MEET[1] + hop]
  const bigX = BIG_X + walkX
  const bigShoulderR: Pt = [bigX + SHOULDER_X * BIG_SCALE, GROUND + (SHOULDER_Y + 3) * BIG_SCALE]
  const bigHangR: Pt = [bigShoulderR[0] + 1.5, bigShoulderR[1] + 26 - stride * 0.15]
  const bigHandR = lerpPt(bigHangR, meet, reach)
  const bigShoulderL: Pt = [bigX - SHOULDER_X * BIG_SCALE, GROUND + (SHOULDER_Y + 3) * BIG_SCALE]
  const bigHandL: Pt = [bigShoulderL[0] - 1.5, bigShoulderL[1] + 26 + stride * 0.15]

  const kidShoulderL: Pt = [KID_X - SHOULDER_X * KID_SCALE, GROUND + hop + (SHOULDER_Y + 3) * KID_SCALE]
  const kidHangL: Pt = [kidShoulderL[0] - 1.2, kidShoulderL[1] + 12.5]
  const kidHandL = lerpPt(kidHangL, meet, span(t, REACH + 0.1, JOIN, easeInOut))
  const kidShoulderR: Pt = [KID_X + SHOULDER_X * KID_SCALE, GROUND + hop + (SHOULDER_Y + 3) * KID_SCALE]
  const kidHangR: Pt = [kidShoulderR[0] + 1.2, kidShoulderR[1] + 12.5]
  // うれしくて、あいている 手を ばんざい と ふる
  const kidUpR: Pt = [kidShoulderR[0] + 4 + happyWave * 1.5, kidShoulderR[1] - 10 - happyWave * 1.5]
  const kidHandR = lerpPt(kidHangR, kidUpR, joined ? span(t, JOIN, JOIN + 0.4, easeOut) : 0)

  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const kidHeadX = KID_X
  const kidHeadY = GROUND + hop - 76 * KID_SCALE

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Tree t={t} />
        <Bird t={t} />
        <FallingLeaf t={t} />
        {/* おねえさん */}
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <ellipse cx={bigX} cy="97.4" rx="11" ry="2.4" fill="#000000" opacity="0.12" />
          <Layer x={bigX} y={GROUND + bigBob} scale={BIG_SCALE}>
            <Girl kid={false} mood="happy" leftHand={toLocal(bigHandL, bigX, BIG_SCALE)} rightHand={toLocal(bigHandR, bigX, BIG_SCALE)} step={stride * 14} gaze={1} />
          </Layer>
        </Layer>
        {/* いもうと(主役) */}
        <Layer opacity={span(t, 0.35, 0.7)}>
          <ellipse cx={KID_X} cy="97.4" rx="6" ry="1.8" fill="#000000" opacity="0.12" />
          <Layer x={KID_X} y={GROUND + hop} scale={KID_SCALE}>
            <Girl kid mood={kidMood} leftHand={toLocal(kidHandL, KID_X, KID_SCALE) as Pt} rightHand={toLocal(kidHandR, KID_X, KID_SCALE)} step={0} gaze={gaze} />
          </Layer>
          <Tears t={t} cx={kidHeadX} cy={kidHeadY} />
          <Notice t={t} cx={kidHeadX} cy={kidHeadY - 12} />
        </Layer>
        <Hearts t={t} />
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
    { at: 0, label: '木が そだつ。小さい いもうと が ひとりで さびしい', sound: 'pop' },
    { at: WALK, label: '左から おねえさん が あるいてくる' },
    { at: NOTICE, label: 'いもうと が 気づいて「あっ!」', sound: 'pop' },
    { at: REACH, label: 'おねえさん が 手を さしだす' },
    { at: JOIN, label: '手を つないで にっこり。ハートが ふわり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '妹 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
