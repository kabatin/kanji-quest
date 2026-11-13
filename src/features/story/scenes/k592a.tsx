/*
 * 太(ふとい): 大の字に とびはねる 子の まんなかに、おにぎり(点)。 たべて、どっしり ふとる。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … ばんざいで ひろげた りょううで(「大の字」の よこ)
 *   2画目(ノ)  … あたま から どう、ひだりの あし(おなかが ふくらんでも、まんなかを とおる)
 *   3画目(乀)  … みぎの あし(ひだりの あしと ハの字に ひらく)
 *   4画目(丶)  … 2ほんの あしの あいだに おちた おにぎり(点)
 *
 * ながれ
 *   おなかが ぺこぺこの 子(ポケットに おにぎりが 3つ)
 *   → 1つめを もぐもぐ。おなかが ぷくっ → 2つめも もぐもぐ。おなかが ぷくぷく
 *   → うれしくて、さいごの 1つを ぽーんと ほうりなげ、りょううで りょうあしを ひろげて「大の字」で ジャンプ
 *   → おにぎりが 2ほんの あしの あいだに ぽとん。 どっしり ふとった 子が「大」の字に なり、点が つく
 *   → ほね が ひかって、絵が うすくなり、字「太」が のこる
 *
 * 人は、ほんものの つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(ふたつの ほね を つなぐ)。 あし は こし から。 くび は みじかい。
 *   「大の字」は、ほんとうに ジャンプで ひろげる ポーズ。 ほうりなげた おにぎりは、ちゃんと おちてくる。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '太'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#ffb94a'
const SHIRT_DARK = '#f09a2a'
const PANTS = '#4f7fc2'
const SHOE = '#6b4a36'
const MOUTH = '#b9483f'
const TONGUE = '#ff8a8a'
const CHEEK = '#ff9d9d'
const RICE = '#fbfaf2'
const RICE_SHADE = '#e3dfca'
const NORI = '#2f4a3a'
const LEAF = '#55b86e'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'

/** くぎり の時間(秒) */
const POP = 0.7
/** 1つめ: ポケットから とって、もぐもぐ */
const GRAB1 = 1.5
const EAT1 = 2.0
const END1 = 3.0
/** 2つめ */
const GRAB2 = 3.5
const EAT2 = 4.0
const END2 = 4.8
/** さいごの 1つ: ほうりなげて、ジャンプ */
const GRAB3 = 5.1
const THROW = 5.45
const SPREAD = 6.0
const LAND = 6.4
const INK = 6.9
const DONE = 9.7
const DURATION = 10.4

type Point = readonly [number, number]
type Key = readonly [time: number, point: Point]

/** からだの ばしょ(まんなか x = 51。1画目・2画目・3画目の線に のるように 決めた) */
const CENTER = 51
const SHOULDER_L: Point = [44.5, 43]
const SHOULDER_R: Point = [57.5, 43]
const HIP_L: Point = [47.5, 50]
const HIP_R: Point = [54.5, 50]
/** あし の長さ(こし から くるぶし まで)。うで は ひとつ ぶんの ほね の長さ */
const LEG = 44.5
const ARM = 13.5
const ARM_REACH = ARM * 2 * 0.995
/** あし を ひらく角度(ま下から そとへ)。2画目・3画目の 線に そろう */
const LEG_SPREAD_L = -33
const LEG_SPREAD_R = 37

/** 手の ばしょ を じかん で つなぐ。かた から ひじ を へて とどくように、うで は あとで 計算する。 */
const L_HAND: readonly Key[] = [
  [0, [38.5, 70]],
  [GRAB2 - 0.3, [38.5, 70]],
  [GRAB2, [46.5, 49.5]],
  [EAT2, [44, 38.5]],
  [END2, [44, 38.5]],
  [GRAB3 - 0.1, [38.5, 70]],
  [THROW - 0.15, [39, 21]],
  [THROW, [38, 17]],
  [SPREAD, [19.5, 48]],
]
const R_HAND: readonly Key[] = [
  [0, [63.5, 70]],
  [GRAB1 - 0.3, [63.5, 70]],
  [GRAB1, [55.5, 49.5]],
  [EAT1, [58, 38.5]],
  [END1, [58, 38.5]],
  [END1 + 0.3, [63.5, 70]],
  [GRAB3 - 0.3, [63.5, 70]],
  [GRAB3, [51.5, 49.5]],
  [THROW - 0.15, [61, 22]],
  [THROW, [64, 17]],
  [SPREAD, [84.5, 43.3]],
]

function follow(t: number, keys: readonly Key[]): Point {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i += 1) {
    const [t1, p1] = keys[i]
    if (t <= t1) {
      const [t0, p0] = keys[i - 1]
      const k = span(t, t0, t1, easeInOut)
      return [p0[0] + (p1[0] - p0[0]) * k, p0[1] + (p1[1] - p0[1]) * k]
    }
  }
  return keys[keys.length - 1][1]
}

type ArmShape = { readonly shoulder: Point; readonly elbow: Point; readonly hand: Point }

/** かた → ひじ → 手 を つなぐ。ひじ は 下か そと がわ に まがる(2つの ほね の長さ は いつも 同じ)。 */
function armOf(shoulder: Point, target: Point, side: -1 | 1): ArmShape {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.hypot(dx, dy) || 0.001
  const reach = Math.min(dist, ARM_REACH)
  const ux = dx / dist
  const uy = dy / dist
  const hand: Point = [shoulder[0] + ux * reach, shoulder[1] + uy * reach]
  const mid: Point = [shoulder[0] + (ux * reach) / 2, shoulder[1] + (uy * reach) / 2]
  const lift = Math.sqrt(Math.max(ARM * ARM - (reach / 2) ** 2, 0))
  const a: Point = [mid[0] - uy * lift, mid[1] + ux * lift]
  const b: Point = [mid[0] + uy * lift, mid[1] - ux * lift]
  const score = (p: Point) => 0.4 * p[1] + side * p[0]
  return { shoulder, elbow: score(a) >= score(b) ? a : b, hand }
}

function Arm({ arm }: { readonly arm: ArmShape }) {
  const { shoulder, elbow, hand } = arm
  return (
    <>
      <path d={`M${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={SKIN} strokeWidth="5.2" strokeLinecap="round" />
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]}`} fill="none" stroke={SHIRT_DARK} strokeWidth="6.6" strokeLinecap="round" />
      <circle cx={elbow[0]} cy={elbow[1]} r="3.3" fill={SHIRT_DARK} />
      <circle cx={hand[0]} cy={hand[1]} r="3.2" fill={SKIN} />
    </>
  )
}

/** おにぎり(まんなか が 0,0)。かどは まるく、したに のり。 */
function Onigiri({ x, y, scale = 1, rotate = 0 }: { readonly x: number; readonly y: number; readonly scale?: number; readonly rotate?: number }) {
  if (scale <= 0) return null
  return (
    <Layer x={x} y={y} scale={scale} rotate={rotate}>
      <path d="M0 -5.2 L5.6 4 L-5.6 4 Z" fill={RICE} stroke={RICE} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M-5.6 4 L-3.4 0.6 L3.4 0.6 L5.6 4 Z" fill={RICE_SHADE} stroke={RICE_SHADE} strokeWidth="2.4" strokeLinejoin="round" opacity="0.7" />
      <rect x="-3.6" y="0.8" width="7.2" height="5" rx="1.2" fill={NORI} />
    </Layer>
  )
}

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
      {/* とおくの おか と、ゆっくり ながれる 雲(おくゆき を出す) */}
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="22" cy="16" rx="7" ry="3.2" />
        <ellipse cx="27" cy="14" rx="5" ry="3.2" />
        <ellipse cx="86" cy="12" rx="6" ry="2.8" />
        <ellipse cx="90.5" cy="10.4" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 30, 78, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** ひらひら とぶ ちょうちょ(おくゆき の にぎやかし) */
function Butterfly({ t }: SceneProps) {
  const show = span(t, 0.9, 1.3)
  const x = 82 + Math.sin(t * 1.1) * 12
  const y = 27 + Math.sin(t * 2.3) * 4
  const flap = 0.35 + 0.65 * Math.abs(wave(t, 0.34))
  return (
    <Layer x={x} y={y} opacity={show}>
      <Layer scaleX={flap}>
        <ellipse cx="-2.6" cy="-1.2" rx="2.8" ry="2.2" fill="#f07f9e" />
        <ellipse cx="2.6" cy="-1.2" rx="2.8" ry="2.2" fill="#f07f9e" />
        <ellipse cx="-2" cy="1.6" rx="1.9" ry="1.5" fill="#f6a8bd" />
        <ellipse cx="2" cy="1.6" rx="1.9" ry="1.5" fill="#f6a8bd" />
      </Layer>
      <rect x="-0.4" y="-2.2" width="0.8" height="5" rx="0.4" fill="#5a3b2a" />
    </Layer>
  )
}

type Mood = 'hungry' | 'chew' | 'happy' | 'cheer'

type FaceProps = { readonly mood: Mood; readonly chew: number; readonly look: number }

/** かお。気もちで 目と口が かわる。 */
function Face({ mood, chew, look }: FaceProps) {
  const eyeY = 26 + look
  const closed = mood === 'chew' || mood === 'happy'
  return (
    <>
      <ellipse cx="44.6" cy="29.8" rx={2.1 + chew * 0.9} ry={1.7 + chew * 0.6} fill={CHEEK} opacity="0.6" />
      <ellipse cx="57.4" cy="29.8" rx={2.1 + chew * 0.9} ry={1.7 + chew * 0.6} fill={CHEEK} opacity="0.6" />
      {closed ? (
        <>
          <path d="M45.2 26.8 Q47.2 24 49.2 26.8" fill="none" stroke="#2b2b2b" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M52.8 26.8 Q54.8 24 56.8 26.8" fill="none" stroke="#2b2b2b" strokeWidth="1.3" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="47.2" cy={eyeY} r="1.35" fill="#2b2b2b" />
          <circle cx="54.8" cy={eyeY} r="1.35" fill="#2b2b2b" />
          {mood === 'cheer' && (
            <>
              <circle cx="47.6" cy={eyeY - 0.5} r="0.45" fill="#ffffff" />
              <circle cx="55.2" cy={eyeY - 0.5} r="0.45" fill="#ffffff" />
            </>
          )}
        </>
      )}
      {mood === 'hungry' && (
        <>
          <path d="M44.6 23.6 L48.6 22" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M53.4 22 L57.4 23.6" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M48.8 32 Q51 29.8 53.2 32" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'chew' && <ellipse cx="51" cy="31" rx={1.7 + chew * 0.6} ry={0.5 + chew * 1.3} fill={MOUTH} />}
      {mood === 'happy' && <path d="M48.2 30 Q51 33.6 53.8 30" fill="none" stroke={MOUTH} strokeWidth="1.25" strokeLinecap="round" />}
      {mood === 'cheer' && (
        <>
          <path d="M47.6 29.4 Q51 36 54.4 29.4 Z" fill={MOUTH} />
          <ellipse cx="51" cy="32.6" rx="1.8" ry="0.9" fill={TONGUE} />
        </>
      )}
    </>
  )
}

type KidProps = {
  readonly t: number
  readonly mood: Mood
  readonly chew: number
  readonly look: number
  /** おなかの ふくらみ(0 = ぺたんこ / 1 = どっしり) */
  readonly belly: number
  /** あしを ひらいた度合い(0〜1) */
  readonly legs: number
}

/** 正面むきの 子。あし → どう → あたま → うで の じゅんに かさねる。 */
function Kid({ t, mood, chew, look, belly, legs }: KidProps) {
  const aL = (LEG_SPREAD_L * legs * Math.PI) / 180
  const aR = (LEG_SPREAD_R * legs * Math.PI) / 180
  const ankleL: Point = [HIP_L[0] + LEG * Math.sin(aL), HIP_L[1] + LEG * Math.cos(aL)]
  const ankleR: Point = [HIP_R[0] + LEG * Math.sin(aR), HIP_R[1] + LEG * Math.cos(aR)]
  const armL = armOf(SHOULDER_L, follow(t, L_HAND), -1)
  const armR = armOf(SHOULDER_R, follow(t, R_HAND), 1)
  const pocketY = 47.5 + belly * 1.6
  const bellyRx = 7.8 + belly * 3.6
  const bellyRy = 10 + belly * 1.8
  const stored = [
    { x: 47, until: GRAB2 },
    { x: 51, until: GRAB3 },
    { x: 55, until: GRAB1 },
  ]
  return (
    <>
      {/* あし: こし から のびて、ひらくと ハの字に なる。くつ は よこ むき のまま */}
      <path d={`M${HIP_L[0]} ${HIP_L[1]} L${ankleL[0]} ${ankleL[1]}`} stroke={PANTS} strokeWidth="7.6" strokeLinecap="round" fill="none" />
      <path d={`M${HIP_R[0]} ${HIP_R[1]} L${ankleR[0]} ${ankleR[1]}`} stroke={PANTS} strokeWidth="7.6" strokeLinecap="round" fill="none" />
      <ellipse cx={ankleL[0] - 0.4} cy={ankleL[1] + 0.9} rx="5.4" ry="2.9" fill={SHOE} transform={`rotate(${aL * 20} ${ankleL[0]} ${ankleL[1]})`} />
      <ellipse cx={ankleR[0] + 0.4} cy={ankleR[1] + 0.9} rx="5.4" ry="2.9" fill={SHOE} transform={`rotate(${aR * 20} ${ankleR[0]} ${ankleR[1]})`} />
      <ellipse cx={CENTER} cy="52.5" rx="8" ry="4.2" fill={PANTS} />
      {/* くび: みじかく、どう と あたま に かくれる */}
      <rect x={CENTER - 2.8} y="32.5" width="5.6" height="6" rx="2.2" fill={SKIN_SHADE} />
      {/* どう: おなか が ふくらむ */}
      <ellipse cx={CENTER} cy={44.5 + belly * 1.2} rx={bellyRx} ry={bellyRy} fill={SHIRT} />
      <ellipse cx={CENTER + bellyRx * 0.35} cy={46 + belly * 2} rx={bellyRx * 0.55} ry={bellyRy * 0.5} fill={SHIRT_DARK} opacity="0.22" />
      {/* ポケットの おにぎり(のこっている ぶん だけ) */}
      {stored.map(({ x, until }) => (t < until ? <Onigiri key={x} x={x} y={pocketY + 0.6} scale={0.62} /> : null))}
      <rect x="45" y={pocketY} width="12" height="7.6" rx="2" fill={SHIRT_DARK} />
      {/* あたま: ふとると ほっぺ も 少し ふくらむ */}
      <Layer scale={1 + belly * 0.06} origin={[CENTER, 35]}>
        <circle cx={CENTER - 8.4} cy="27" r="2.1" fill={SKIN} />
        <circle cx={CENTER + 8.4} cy="27" r="2.1" fill={SKIN} />
        <circle cx={CENTER} cy="26" r="8.8" fill={SKIN} />
        <path d="M42.2 25 C41.6 15.8 60.4 15.8 59.8 25 C57 21.2 54 20 51 20 C48 20 45 21.2 42.2 25 Z" fill={HAIR} />
        {/* 2画目の 書きはじめ: ぴょこんと はねた かみ */}
        <path d="M50 18.2 Q49 15.4 51.2 14.6" fill="none" stroke={HAIR} strokeWidth="1.8" strokeLinecap="round" />
        <Face mood={mood} chew={chew} look={look} />
      </Layer>
      <Arm arm={armL} />
      <Arm arm={armR} />
    </>
  )
}

/** てに もっている おにぎり。かじると ちいさく なる。 */
function Held({ t }: SceneProps) {
  const r = follow(t, R_HAND)
  const l = follow(t, L_HAND)
  const firstScale = 1 - 0.4 * span(t, EAT1 + 0.1, EAT1 + 0.5) - 0.6 * span(t, EAT1 + 0.6, END1)
  const secondScale = 1 - 0.4 * span(t, EAT2 + 0.1, EAT2 + 0.4) - 0.6 * span(t, EAT2 + 0.5, END2)
  const first = t >= GRAB1 && t < END1
  const second = t >= GRAB2 && t < END2
  const third = t >= GRAB3 && t < THROW
  return (
    <>
      {first && <Onigiri x={r[0] - 4.5} y={r[1] - 6.5} scale={firstScale} rotate={-12} />}
      {second && <Onigiri x={l[0] + 4.5} y={l[1] - 6.5} scale={secondScale} rotate={12} />}
      {third && <Onigiri x={r[0] - 2} y={r[1] - 4} />}
    </>
  )
}

/** ほうりなげた おにぎり。のぼって、おちて、2ほんの あし の あいだ(4画目の 点)に ぽとん。 */
function Thrown({ t }: SceneProps) {
  if (t < THROW) return null
  const PEAK = THROW + 0.3
  const up = span(t, THROW, PEAK, easeOut)
  const down = span(t, PEAK, LAND, easeIn)
  const x = t < PEAK ? 62 - 4 * up : 58 - 8 * down
  const y = t < PEAK ? 14 - 12 * up : 2 + 87.5 * down
  const bounce = Math.sin(span(t, LAND, LAND + 0.3) * Math.PI) * 3
  const spin = 20 + 720 * (1 - span(t, THROW, LAND, easeOut))
  return <Onigiri x={x} y={y - bounce} scale={1.15} rotate={spin} />
}

/** おにぎりが おちた ときの ほこり */
function Dust({ t }: SceneProps) {
  const p = span(t, LAND, LAND + 0.6, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p} fill="#ffffff" stroke="#d9e3cf" strokeWidth="0.5">
      <circle cx={42 - p * 6} cy={95 - p * 3} r={1.6 + p * 1.8} />
      <circle cx={60 + p * 6} cy={95 - p * 3} r={1.6 + p * 1.8} />
    </g>
  )
}

/** おなかが ぐう。ふるえる 3本の しるし。 */
function Rumble({ t }: SceneProps) {
  const show = during(t, POP + 0.2, GRAB1 + 0.1, 0.25)
  if (show <= 0) return null
  const shake = wave(t, 0.16) * 0.9
  return (
    <g opacity={show} fill="none" stroke="#6b7fb3" strokeWidth="1" strokeLinecap="round" transform={`translate(${shake} 0)`}>
      <path d="M38 47 q-2 2 0 4 q2 2 0 4" />
      <path d="M33 45.5 q-2.4 3.4 0 6.8 q2.4 3.4 0 6.8" />
      <path d="M64 47 q2 2 0 4 q-2 2 0 4" />
      <path d="M69 45.5 q2.4 3.4 0 6.8 q-2.4 3.4 0 6.8" />
    </g>
  )
}

/** よろこびの ほし(あたまの まわり) */
function Cheer({ t }: SceneProps) {
  const show = during(t, THROW + 0.1, LAND + 0.5, 0.25)
  if (show <= 0) return null
  const spin = t * 160
  return (
    <g opacity={show}>
      <Star cx={34} cy={12} r={3.2} color="#ffc233" spin={spin} />
      <Star cx={69} cy={9} r={2.6} color="#ff7a4d" spin={-spin} />
      <Star cx={79} cy={24} r={2.2} color="#ffd95a" spin={spin} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  const appear = span(t, 0, POP, backOut)
  const chewing = (t >= EAT1 && t < END1) || (t >= EAT2 && t < END2)
  const chew = chewing ? 0.5 + 0.5 * wave(t, 0.42) : 0
  const mood: Mood = t < GRAB1 + 0.5 ? 'hungry' : chewing ? 'chew' : t >= THROW - 0.1 ? 'cheer' : 'happy'
  // なげた おにぎり を 目で おいかける(上 → 下)
  const look = t < THROW ? 0 : t < THROW + 0.6 ? -1 : 1
  // おなか: 1つめ・2つめを たべるたびに ふくらみ、さいごは どっしり
  const belly = 0.45 * span(t, EAT1 + 0.4, END1, easeOut) + 0.4 * span(t, EAT2 + 0.3, END2, easeOut) + 0.15 * span(t, THROW, SPREAD, easeOut)
  const legs = span(t, THROW + 0.05, SPREAD, easeInOut)
  // とびはじめの ほんの少し だけ からだが うく(さいごは 字の形に もどる)
  const hop = Math.sin(span(t, THROW - 0.1, SPREAD + 0.1) * Math.PI) * 3
  // したの かげ: あしを ひらくと ひろがる
  const shadowRx = mix(t, THROW, SPREAD, 11, 22, easeInOut)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Butterfly t={t} />
        <ellipse cx={CENTER} cy="98" rx={shadowRx * appear} ry="2.6" fill="#000000" opacity="0.12" />
        <Layer scale={appear} origin={[CENTER, 96]} opacity={span(t, 0, 0.2)}>
          <Layer y={-hop}>
            <Kid t={t} mood={mood} chew={chew} look={look} belly={belly} legs={legs} />
          </Layer>
        </Layer>
        <Held t={t} />
        <Rumble t={t} />
        <Cheer t={t} />
        <Dust t={t} />
        <Thrown t={t} />
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
    { at: 0, label: 'おなかが ぺこぺこの 子', sound: 'pop' },
    { at: GRAB1, label: 'ポケットから おにぎりを とって もぐもぐ' },
    { at: GRAB2, label: '2つめも もぐもぐ。おなかが ふくらむ' },
    { at: GRAB3, label: 'さいごの 1つを ほうりなげ、大の字で ジャンプ', sound: 'pop' },
    { at: LAND, label: 'おにぎりが あしの あいだに ぽとん(点)' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '太 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
