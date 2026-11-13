/*
 * 女(おんな): ひざを ついて、てを まえに かさねる 女の人。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ→一) … あたま から せなか、こし まで おりて、ひざ へ のびる(ひざを ついた すがた)
 *   2画目(ノ)    … まえに のばした うで から、からだ、しゃがんだ あし
 *   3画目(一)    … まえに さしだした りょううで(てを かさねる ところ)
 *   (絵は ほんものの 人の つくり を守る。字と ぴったり重ならなくても、だいたい同じ場所・向き)
 *
 * ながれ
 *   きりかぶの 上で ひよこが ひとり ないている
 *   → 女の人が しんぱいそうに あるいてくる
 *   → ひざを ついて しゃがみ、ひよこと 同じ 高さに なる
 *   → りょうてを まえに かさねて、そっと さしだす
 *   → ひよこが ぴょんと てに のり、あんしん して にっこり(女の人も にっこり)
 *   → ほね が ひかって、絵が うすくなり、字「女」が のこる
 *
 * 人は、ほんものの 人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   あし は こし から ひざ で まがり、うで は かた から ひじ で まがる(ひざ・ひじ は 長さを 守って 計算する)。
 *   くび は みじかく、どう の 上。あるくときは うで と あし を ぎゃくに ふる。
 */
import { during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '女'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const DRESS = '#f2788c'
const DRESS_DARK = '#d95f76'
const DRESS_FAR = '#c24f66'
const LEG = '#7664a3'
const LEG_FAR = '#5f4f8a'
const SHOE = '#b8473f'
const RIBBON = '#ffd24a'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const WOOD_TOP = '#d9a874'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const CHICK = '#ffd84a'
const CHICK_DARK = '#f0b82a'
const BEAK = '#f08a3a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const HEART = '#f2587a'

/** くぎり の時間(秒) */
const WALK = 0.9
const WALK_END = 2.7
/** ひざを ついて しゃがむ */
const KNEEL = 2.9
const KNEEL_END = 4.1
/** てを まえに さしだす */
const REACH = 4.2
const REACH_END = 5.0
/** ひよこが てに とびのる */
const HOP = 5.1
const LAND = 5.6
const INK = 6.6
const DONE = 9.4
const DURATION = 10

type Pt = readonly [number, number]

const lerp = (a: number, b: number, x: number) => a + (b - a) * x
const rad = (d: number) => (d * Math.PI) / 180

/* ───────── 人の からだの 寸法(ぜんぶ 長さを まもる) ───────── */
const THIGH = 21
const SHIN = 21
const TORSO = 27
const NECK_LEN = 3
const HEAD_R = 8
const UPPER_ARM = 16
const FORE_ARM = 15
/** たっているときの あしの 左右の はば の じく、足くびの 高さ、こしの 高さ */
const STAND_X = 36
const STAND_ANKLE_Y = 94
const STAND_HIP_Y = 52
/** ひざ立ち(おしりを かかとに のせる)の ときの こし・足くび */
const KNEEL_HIP: Pt = [44, 75]
const KNEEL_ANKLE_Y = 92.5
/** ひよこが いる きりかぶ の 上 と、ひよこの 高さ */
const STUMP_X = 90
const STUMP_TOP = 85.5
const CHICK_Y = 80
/** てを さしだす 場所(かた から とどく きょりに する) */
const REACH_GOAL: Pt = [74, 68]
const HOLD_GOAL: Pt = [71, 64]

/** 2つの ほね(ふとももと すね、うでと ひじから先)で できた関節を、とどく所まで 計算する */
function ik(a: Pt, goal: Pt, l1: number, l2: number, side: 1 | -1): { readonly mid: Pt; readonly end: Pt } {
  const dx = goal[0] - a[0]
  const dy = goal[1] - a[1]
  const d = Math.max(Math.hypot(dx, dy), 0.001)
  const reach = Math.min(d, l1 + l2 - 0.05)
  const ux = dx / d
  const uy = dy / d
  const along = (l1 * l1 - l2 * l2 + reach * reach) / (2 * reach)
  const h = Math.sqrt(Math.max(0, l1 * l1 - along * along))
  return {
    mid: [a[0] + ux * along - uy * h * side, a[1] + uy * along + ux * h * side],
    end: [a[0] + ux * reach, a[1] + uy * reach],
  }
}

type Mood = 'worry' | 'soft' | 'happy'

type Pose = {
  readonly k: number
  readonly lean: number
  readonly tilt: number
  readonly hip: Pt
  readonly shoulder: Pt
  readonly headC: Pt
  readonly kneeN: Pt
  readonly ankleN: Pt
  readonly kneeF: Pt
  readonly ankleF: Pt
  readonly elbowN: Pt
  readonly handN: Pt
  readonly elbowF: Pt
  readonly handF: Pt
  readonly mood: Mood
}

/** 時間 t の 人の かっこう(関節の 場所)を ぜんぶ 計算する */
function poseAt(t: number): Pose {
  // あるく: 足と うでを ぎゃくに ふる。とまる 前に だんだん おさまる
  const amp = t < WALK ? 0 : 1 - span(t, WALK_END - 0.35, WALK_END)
  const phase = (t - WALK) * Math.PI * 2 * 1.6
  const sw = Math.sin(phase) * amp
  const liftN = Math.max(0, Math.cos(phase)) * amp
  const liftF = Math.max(0, -Math.cos(phase)) * amp
  const bob = Math.abs(Math.sin(phase)) * 1.2 * amp
  const k = span(t, KNEEL, KNEEL_END, easeInOut)
  const reach = span(t, REACH, REACH_END, easeInOut)

  const hip: Pt = [lerp(STAND_X, KNEEL_HIP[0], k), lerp(STAND_HIP_Y, KNEEL_HIP[1], k) - bob]
  const ankleGoalN: Pt = [lerp(STAND_X + 8 * sw, STAND_X - 4, k), lerp(STAND_ANKLE_Y - 3.5 * liftN, KNEEL_ANKLE_Y, k)]
  const ankleGoalF: Pt = [lerp(STAND_X - 8 * sw, STAND_X - 2, k), lerp(STAND_ANKLE_Y - 3.5 * liftF, KNEEL_ANKLE_Y + 0.5, k)]
  const legN = ik(hip, ankleGoalN, THIGH, SHIN, -1)
  const legF = ik(hip, ankleGoalF, THIGH, SHIN, -1)

  // からだの かたむき: しゃがむと まえのめり、てを のばすと もっと まえへ、あんしん すると もどる
  const lean = 4 + 8 * k + 8 * reach - 5 * span(t, LAND, LAND + 0.7)
  const tilt = 4 + 10 * span(t, WALK_END - 0.4, WALK_END) - 4 * span(t, LAND, LAND + 0.6) + wave(t, 1.4) * 2 * span(t, LAND, LAND + 0.6)
  const dir: Pt = [Math.sin(rad(lean)), -Math.cos(rad(lean))]
  const shoulder: Pt = [hip[0] + dir[0] * TORSO, hip[1] + dir[1] * TORSO]
  const headAngle = rad(lean + tilt * 0.6)
  const headC: Pt = [shoulder[0] + Math.sin(headAngle) * (NECK_LEN + HEAD_R), shoulder[1] - Math.cos(headAngle) * (NECK_LEN + HEAD_R)]

  // うで: ふだんは たれて、あるくと あしと ぎゃくに ふる。さいごに りょうてを まえへ
  const hold = span(t, LAND, LAND + 0.6, easeOut)
  const goal: Pt = [lerp(REACH_GOAL[0], HOLD_GOAL[0], hold), lerp(REACH_GOAL[1], HOLD_GOAL[1], hold)]
  const restN: Pt = [shoulder[0] + 3 - 7 * sw, shoulder[1] + 26]
  const restF: Pt = [shoulder[0] + 3 + 7 * sw, shoulder[1] + 26]
  const goalF: Pt = [goal[0] - 1.6, goal[1] + 1.6]
  const armN = ik(shoulder, [lerp(restN[0], goal[0], reach), lerp(restN[1], goal[1], reach)], UPPER_ARM, FORE_ARM, 1)
  const armF = ik(shoulder, [lerp(restF[0], goalF[0], reach), lerp(restF[1], goalF[1], reach)], UPPER_ARM, FORE_ARM, 1)

  const mood: Mood = t < REACH_END ? 'worry' : t < LAND ? 'soft' : 'happy'
  return { k, lean, tilt, hip, shoulder, headC, kneeN: legN.mid, ankleN: legN.end, kneeF: legF.mid, ankleF: legF.end, elbowN: armN.mid, handN: armN.end, elbowF: armF.mid, handF: armF.end, mood }
}

/* ───────── せかい ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="60" cy="14" rx="7" ry="3.2" />
        <ellipse cx="65" cy="12" rx="5" ry="3.2" />
        <ellipse cx="100" cy="30" rx="6" ry="2.8" />
        <ellipse cx="104.5" cy="28.4" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 24, 70, 102].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
      {/* 小さな はな */}
      {[16, 66].map((x) => (
        <g key={x}>
          <path d={`M${x} 97 v-4`} stroke={LEAF_DARK} strokeWidth="0.9" strokeLinecap="round" />
          <circle cx={x} cy="91.8" r="1.9" fill="#ffffff" />
          <circle cx={x} cy="91.8" r="0.8" fill={SUN} />
        </g>
      ))}
    </>
  )
}

/** ひよこの いる きりかぶ */
function Stump() {
  return (
    <>
      <ellipse cx={STUMP_X} cy="97.2" rx="11" ry="2.4" fill="#000000" opacity="0.1" />
      <rect x={STUMP_X - 9} y={STUMP_TOP} width="18" height="12" rx="2.2" fill={BARK} />
      <path d={`M${STUMP_X - 5} ${STUMP_TOP + 4} v6 M${STUMP_X + 3} ${STUMP_TOP + 3} v7`} stroke={BARK_DARK} strokeWidth="1.2" strokeLinecap="round" />
      <ellipse cx={STUMP_X} cy={STUMP_TOP} rx="9" ry="2.6" fill={WOOD_TOP} />
      <ellipse cx={STUMP_X} cy={STUMP_TOP} rx="4.6" ry="1.3" fill="none" stroke={BARK} strokeWidth="0.6" />
    </>
  )
}

/** とんでいく ちょうちょ(にぎやかし) */
function Butterfly({ t }: SceneProps) {
  const x = mix(t, 0.5, 7, 118, -8, (v) => v)
  const y = 9 + Math.sin(t * 1.7) * 3
  const flap = 0.35 + 0.65 * Math.abs(wave(t, 0.34))
  return (
    <Layer x={x} y={y}>
      <Layer scaleY={flap} origin={[0, 0]}>
        <ellipse cx="-2.2" cy="-1.6" rx="2.6" ry="2" fill="#ffb066" />
        <ellipse cx="2.2" cy="-1.6" rx="2.6" ry="2" fill="#ffb066" />
        <ellipse cx="-1.6" cy="1.2" rx="1.8" ry="1.4" fill="#ff8f4a" />
        <ellipse cx="1.6" cy="1.2" rx="1.8" ry="1.4" fill="#ff8f4a" />
      </Layer>
      <rect x="-0.4" y="-2.4" width="0.8" height="5" rx="0.4" fill={HAIR} />
    </Layer>
  )
}

/* ───────── ひよこ(主役その2: 気持ちが かわる) ───────── */

type ChickMood = 'sad' | 'calm' | 'happy'

function Chick({ x, y, mood, flap, t }: { readonly x: number; readonly y: number; readonly mood: ChickMood; readonly flap: number; readonly t: number }) {
  const tear = (t * 1.1) % 1
  return (
    <Layer x={x} y={y}>
      {/* あし */}
      <path d="M-1.6 4.2 v2.2 M1.8 4.2 v2.2" stroke={BEAK} strokeWidth="1" strokeLinecap="round" />
      {/* からだ と あたま */}
      <ellipse cx="0" cy="0" rx="5.4" ry="4.8" fill={CHICK} />
      <circle cx="-2.6" cy="-4.6" r="3.7" fill={CHICK} />
      <path d="M-3.2 -8.2 q0.4 -2 1.6 -1.4 M-1.8 -8 q1.6 -1.6 2.2 0" fill="none" stroke={CHICK_DARK} strokeWidth="0.9" strokeLinecap="round" />
      {/* はね(うしろに) */}
      <Layer rotate={flap} origin={[1.6, -1]}>
        <ellipse cx="2" cy="0.6" rx="3" ry="1.9" fill={CHICK_DARK} />
      </Layer>
      {/* くちばし と ほっぺ */}
      {mood === 'sad' ? <path d="M-5.6 -5 l-3 1.2 l3 1.1 Z" fill={BEAK} /> : <path d="M-5.7 -4.9 l-2.7 0.9 l2.7 0.9 Z" fill={BEAK} />}
      <circle cx="-3.2" cy="-2.9" r="1" fill={CHEEK} opacity="0.7" />
      {/* め */}
      {mood === 'happy' ? (
        <path d="M-4.6 -5.2 Q-3.7 -6.5 -2.8 -5.2" fill="none" stroke={EYE} strokeWidth="0.8" strokeLinecap="round" />
      ) : (
        <circle cx="-3.7" cy="-5.4" r="0.7" fill={EYE} />
      )}
      {mood === 'sad' && <path d="M-5 -6.2 l2.4 -0.9" stroke={EYE} strokeWidth="0.6" strokeLinecap="round" />}
      {mood === 'sad' && (
        <path d={`M-3.9 ${-4 + tear * 5} q0.7 1 0 1.6 q-0.7 -0.6 0 -1.6 Z`} fill="#7cc4f2" opacity={1 - tear * 0.6} />
      )}
    </Layer>
  )
}

/** ひよこが ないている「ぴぃ」の おと の すじ */
function Cry({ t }: SceneProps) {
  const show = during(t, 0.4, REACH + 0.2, 0.3)
  if (show <= 0) return null
  const pulse = 0.5 + 0.5 * wave(t, 0.7)
  return (
    <g opacity={show * pulse} fill="none" stroke="#6f8fd6" strokeWidth="0.9" strokeLinecap="round">
      <path d={`M${STUMP_X - 14} ${CHICK_Y - 8} q-2 1.6 0 3.4`} />
      <path d={`M${STUMP_X - 17} ${CHICK_Y - 9.4} q-3.2 3 0 6.2`} />
    </g>
  )
}

/* ───────── 女の人(主役) ───────── */

function Head({ c, tilt, mood }: { readonly c: Pt; readonly tilt: number; readonly mood: Mood }) {
  return (
    <Layer x={c[0]} y={c[1]} rotate={tilt}>
      {/* うしろがみ と おだんご(1画目の はじまりは、あたまの てっぺん) */}
      <circle cx="-2" cy="-1" r="8.6" fill={HAIR} />
      <circle cx="-5.2" cy="-8.2" r="3.6" fill={HAIR} />
      <circle cx="-2.6" cy="-9.4" r="1.2" fill={RIBBON} />
      <circle cx="0" cy="0" r={HEAD_R} fill={SKIN} />
      <path d="M-7.6 -1 C-8 -9.4 6.4 -11 8 -3 C4.4 -6.2 0.4 -5.4 -2.8 -4 C-5 -3.2 -6.6 -2 -7.6 -1 Z" fill={HAIR} />
      <ellipse cx="3.6" cy="3.2" rx="1.9" ry="1.3" fill={CHEEK} opacity="0.55" />
      {mood === 'worry' && (
        <>
          <path d="M1.8 -3.9 L5.4 -4.9" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <ellipse cx="3.6" cy="-0.6" rx="1" ry="1.4" fill={EYE} />
          <ellipse cx="6.4" cy="4.4" rx="0.9" ry="1.1" fill={MOUTH} />
        </>
      )}
      {mood === 'soft' && (
        <>
          <ellipse cx="3.6" cy="-0.6" rx="1" ry="1.4" fill={EYE} />
          <path d="M4.2 4 Q5.8 5.6 7.4 4" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M2.2 -0.2 Q3.7 -2.2 5.2 -0.2" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M3.8 3.4 Q5.6 7 7.6 3.4 Z" fill={MOUTH} />
        </>
      )}
    </Layer>
  )
}

const seg = (a: Pt, b: Pt) => `M${a[0]} ${a[1]} L${b[0]} ${b[1]}`

function Person({ pose }: { readonly pose: Pose }) {
  const { hip, shoulder, k, lean } = pose
  const torsoDir: Pt = [Math.sin(rad(lean)), -Math.cos(rad(lean))]
  const perp: Pt = [-torsoDir[1], torsoDir[0]]
  // スカート: こし から ふとももの とちゅう まで ひろがる
  const thigh: Pt = [(pose.kneeN[0] - hip[0]) / THIGH, (pose.kneeN[1] - hip[1]) / THIGH]
  const side: Pt = [-thigh[1], thigh[0]]
  const waist: Pt = [hip[0] + torsoDir[0] * 7, hip[1] + torsoDir[1] * 7]
  const hem: Pt = [hip[0] + thigh[0] * 13, hip[1] + thigh[1] * 13]
  const skirt = [
    [waist[0] + perp[0] * 6.2, waist[1] + perp[1] * 6.2],
    [waist[0] - perp[0] * 6.2, waist[1] - perp[1] * 6.2],
    [hem[0] + side[0] * 10, hem[1] + side[1] * 10],
    [hem[0] - side[0] * 10, hem[1] - side[1] * 10],
  ]
  // くつ: たっているときは まえむき、ひざを つくと うしろむき(足の うらが 上)
  const theta = Math.PI * k
  const shoe = (ankle: Pt) => {
    const cx = ankle[0] + Math.cos(theta) * 2.8
    const cy = ankle[1] + Math.sin(theta) * 2.8
    return <ellipse cx={cx} cy={cy} rx="4.4" ry="2.3" fill={SHOE} transform={`rotate(${(theta * 180) / Math.PI} ${cx} ${cy})`} />
  }
  return (
    <>
      {/* むこうの うで(からだの うしろ) */}
      <path d={seg(shoulder, pose.elbowF)} stroke={DRESS_FAR} strokeWidth="5.2" strokeLinecap="round" fill="none" />
      <path d={seg(pose.elbowF, pose.handF)} stroke={SKIN_SHADE} strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx={pose.handF[0]} cy={pose.handF[1]} r="2.7" fill={SKIN_SHADE} />
      {/* あし(むこう → てまえ) と くつ */}
      <path d={`${seg(hip, pose.kneeF)} L${pose.ankleF[0]} ${pose.ankleF[1]}`} stroke={LEG_FAR} strokeWidth="6.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {shoe(pose.ankleF)}
      <path d={`${seg(hip, pose.kneeN)} L${pose.ankleN[0]} ${pose.ankleN[1]}`} stroke={LEG} strokeWidth="6.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {shoe(pose.ankleN)}
      {/* くび: どう と あたま を みじかく つなぐ */}
      <path d={seg(shoulder, pose.headC)} stroke={SKIN_SHADE} strokeWidth="4.4" strokeLinecap="round" />
      {/* どう と スカート */}
      <path d={seg(hip, shoulder)} stroke={DRESS} strokeWidth="12.4" strokeLinecap="round" />
      <path d={`M${skirt.map((p) => p.join(' ')).join(' L')} Z`} fill={DRESS} stroke={DRESS} strokeWidth="2" strokeLinejoin="round" />
      <path d={`M${hem[0] + side[0] * 10} ${hem[1] + side[1] * 10} L${hem[0] - side[0] * 10} ${hem[1] - side[1] * 10}`} stroke={DRESS_DARK} strokeWidth="1.6" strokeLinecap="round" />
      <path d={`M${waist[0] + perp[0] * 6} ${waist[1] + perp[1] * 6} L${waist[0] - perp[0] * 6} ${waist[1] - perp[1] * 6}`} stroke={DRESS_DARK} strokeWidth="1.6" strokeLinecap="round" />
      {/* てまえの うで: ふくは はんそで、ひじから先は はだ */}
      <path d={seg(shoulder, pose.elbowN)} stroke={DRESS_DARK} strokeWidth="5.4" strokeLinecap="round" fill="none" />
      <path d={seg(pose.elbowN, pose.handN)} stroke={SKIN} strokeWidth="4.2" strokeLinecap="round" fill="none" />
      <circle cx={pose.handN[0]} cy={pose.handN[1]} r="2.8" fill={SKIN} />
      <Head c={pose.headC} tilt={pose.tilt} mood={pose.mood} />
    </>
  )
}

/** ひよこを だいた あとの ハート */
function Hearts({ t, at }: { readonly t: number; readonly at: Pt }) {
  return (
    <>
      {[0, 0.45, 0.9].map((delay, i) => {
        const p = span(t, LAND + 0.2 + delay, LAND + 1.5 + delay)
        if (p <= 0 || p >= 1) return null
        const size = 0.7 + i * 0.15
        return (
          <g key={delay} opacity={Math.sin(p * Math.PI)} transform={`translate(${at[0] + (i - 1) * 7 + Math.sin(p * 6 + i) * 2} ${at[1] - 8 - p * 18}) scale(${size})`}>
            <path d="M0 2.4 C-4.4 -0.8 -3.2 -4.6 0 -2.4 C3.2 -4.6 4.4 -0.8 0 2.4 Z" fill={HEART} />
          </g>
        )
      })}
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 3)
  const pose = poseAt(t)
  const walkX = mix(t, WALK, WALK_END, -70, 0, easeOut)
  // カメラが すこし よる(ひざを ついた 人が 大きく見える)
  const zoom = 1 + 0.12 * span(t, KNEEL, REACH_END, easeInOut)

  // ひよこ: きりかぶで ないている → てに ぴょんと のる → よろこぶ
  const chickMood: ChickMood = t < REACH ? 'sad' : t < LAND ? 'calm' : 'happy'
  const hop = span(t, HOP, LAND)
  const hopTo: Pt = [pose.handN[0], pose.handN[1] - 5.8]
  const hopEase = easeOut(hop)
  const shiver = chickMood === 'sad' ? wave(t, 0.14) * 0.5 : 0
  const chickX = (t < HOP ? STUMP_X + shiver : lerp(STUMP_X, hopTo[0], hopEase)) + (t >= LAND ? wave(t, 0.9) * 0.4 : 0)
  const chickY = t < HOP ? CHICK_Y : lerp(CHICK_Y, hopTo[1], hopEase) - Math.sin(hop * Math.PI) * 9
  const chickFlap = t >= HOP && t < LAND ? wave(t, 0.12) * 34 : chickMood === 'happy' ? wave(t, 0.5) * 8 : 0
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Layer scale={zoom} origin={[50, 97]}>
          <Ground t={t} />
          <Butterfly t={t} />
          <Layer opacity={span(t, 0.15, 0.5)}>
            <Stump />
          </Layer>
          {/* 女の人 と かげ */}
          <Layer x={walkX}>
            <ellipse cx={pose.hip[0] + 2} cy="97.2" rx={10 + 8 * pose.k} ry="2.4" fill="#000000" opacity="0.12" />
            <Person pose={pose} />
          </Layer>
          <Layer opacity={span(t, 0.1, 0.5)}>
            <Cry t={t} />
            <Chick x={chickX} y={chickY} mood={chickMood} flap={chickFlap} t={t} />
          </Layer>
          <Hearts t={t} at={pose.handN} />
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
    { at: 0, label: 'きりかぶの 上で ひよこが ないている', sound: 'pop' },
    { at: WALK, label: '女の人が しんぱいそうに あるいてくる' },
    { at: KNEEL, label: 'ひざを ついて しゃがむ', sound: 'pop' },
    { at: REACH, label: 'てを まえに かさねて さしだす' },
    { at: HOP, label: 'ひよこが てに のって あんしん' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '女 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
