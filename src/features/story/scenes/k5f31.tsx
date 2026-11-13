/*
 * 弱(よわい): ぐにゃりと まがる やわらかい ゆみが 2つ。やを とおくへ とばせない。
 *
 * ほね(画と絵の対応)  ※ 字は「弓」が 左と右に 1つずつ。絵では、ふたりの こどもが それぞれ ゆみを もつ
 *   1〜5画目  … 左の こどもの ゆみ(ゆみの 上の はし、ぐにゃりと まがった ゆみの 本体、にぎり あたり)
 *   6〜10画目 … 右の こどもの ゆみ(左と 同じ形)
 *   (ゆみの 形は ほんものの つくり を守るので、字の線とは だいたい 同じ場所・同じ むき で ゆるす)
 *
 * ながれ
 *   はれた 草はら。とおくに まとが ふたつ(左と右)
 *   → ふたりの こどもが、せなか あわせで ゆみを もって あらわれる(ゆみは ゴムみたいに ぷるぷる ゆれる)
 *   → 「どっちが とおくへ とばせるか」 やを つがえて、ぐーっと ひきしぼる(ゆみが まがりすぎる)
 *   → ぱっと はなす → ゆみが ぐにゃり と ぎゃくに まがり、やは すこし とんで ぽとっ と おちる
 *   → びっくり → しょんぼり(まとには ぜんぜん とどかない)
 *   → ほね が ひかって、絵が うすくなり、字「弱」が のこる
 *
 * 人・ゆみ・やは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる。ゆみは にぎり が いちばん 前に出て、りょうはし が 後ろへ そる(ひいた人の ほうへ)。
 *   ゆみを ひく うで は、ひじ を 後ろへ ひいて、手を ほっぺ の下に もってくる。
 *   やは 手から はなれたら、すぐ 下へ おちはじめる(よわい ゆみだから すこしだけ 前へ)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '弱'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const LEAF = '#55b86e'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const ARROW_WOOD = '#c9a06a'
const FEATHER = '#e8534a'
const STRING = '#efe9d6'
const DUST = '#e9e2cf'
const TEAR = '#7cc4f2'

/** こどもの いろ(右の こどもが はじめ。左の こどもは ひっくり返して 出す) */
type Palette = { readonly tunic: string; readonly tunicDark: string; readonly hair: string; readonly bow: string; readonly bowLight: string }
const RIGHT_KID: Palette = { tunic: '#4f9be0', tunicDark: '#3c82c4', hair: '#5a3b2a', bow: '#7ccf7c', bowLight: '#b5ebb0' }
const LEFT_KID: Palette = { tunic: '#f08a4b', tunicDark: '#d6713a', hair: '#2f2a35', bow: '#f08fb0', bowLight: '#fbc6d8' }

/** くぎり の時間(秒)。ふたりめ は 少し おくれて おなじ うごきを する */
const POP = 0.35
const RAISE_FROM = 1.2
const RAISE_TO = 1.9
const NOCK = 2.2
const DRAW_FROM = 2.4
const DRAW_TO = 3.5
const RELEASE = 3.6
const LAND = 4.4
const SAD = 4.7
const SAD_FULL = 5.6
const FRIEND_DELAY = 0.25
/** ふたりの あたまが ぶつからないよう、まんなかから 左右へ はなす */
const KID_GAP = 5
const INK = 6.6
const DONE = 9.8
const DURATION = 10.4

/** こどもの 体の ばしょ(右むきの こどもの 絵。ここから 左の こどもを つくる) */
const GROUND = 95
const HEAD: readonly [number, number] = [61, 43]
const NECK: readonly [number, number] = [61, 51]
/** ゆみを もつ うでの かた と、ゆみを ひく うでの かた(うしろ) */
const SHOULDER_BOW: readonly [number, number] = [66, 58]
const SHOULDER_STRING: readonly [number, number] = [57, 58]
const ARM_LEN = 8.7
/** ゆみの 長さ(まんなか から はしまで) */
const BOW_HALF = 27
/** 手が ゆみを ひくときの 手の場所(ほっぺ の 下)と、ひじ(うしろ) */
const DRAW_HAND: readonly [number, number] = [58, 53.5]
const DRAW_ELBOW: readonly [number, number] = [49, 57.5]
/** ゆみを ひかない ときの 手 と ひじ(だらんと 下げる) */
const REST_HAND: readonly [number, number] = [60, 74]
const REST_ELBOW: readonly [number, number] = [55, 67]
/** はなす しゅんかん の にぎり の場所 */
const GRIP_READY: readonly [number, number] = [80, 55]
/** やの 長さ の はんぶん(中心 から おしり まで) */
const ARROW_HALF = 12
/** やが おちる ばしょ: 中心が まえへ 12、下へ 30 動く */
const ARROW_FLY_X = 12
const ARROW_FLY_Y = 30
const ARROW_END_ANGLE = 68

const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const lerp2 = (a: readonly [number, number], b: readonly [number, number], k: number): readonly [number, number] => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]

/** かた(s)から 手(h)まで、2つの ほね で つなぐ。ひじ は 下がわ に まがる。 */
function elbowBetween(s: readonly [number, number], h: readonly [number, number]): readonly [number, number] {
  const dx = h[0] - s[0]
  const dy = h[1] - s[1]
  const d = Math.hypot(dx, dy)
  const bend = Math.sqrt(Math.max(0, ARM_LEN ** 2 - (d / 2) ** 2))
  return [(s[0] + h[0]) / 2 + (-dy / d) * bend, (s[1] + h[1]) / 2 + (dx / d) * bend]
}

/* ───────── けしき ───────── */

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
      {/* とおくの おか と、ゆっくり ながれる 雲 */}
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 92 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="38" cy="14" rx="7" ry="3.2" />
        <ellipse cx="43" cy="12.4" rx="5" ry="3.2" />
        <ellipse cx="86" cy="20" rx="6" ry="2.8" />
        <ellipse cx="90.5" cy="18.4" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 40, 76, 99].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** とおくの まと(右がわ)。左の まと は ひっくり返して 出す。ぽん と 立つ。 */
function Target({ t }: SceneProps) {
  const pop = span(t, 0.4, 0.9, backOut)
  return (
    <Layer scale={pop} origin={[103, GROUND]}>
      <rect x="102.2" y="82" width="1.7" height="14" fill={BARK} />
      <path d="M99 96.5 L103 91 L107 96.5 Z" fill={BARK} />
      <circle cx="103" cy="82" r="6" fill="#ffffff" />
      <circle cx="103" cy="82" r="4.6" fill={FEATHER} />
      <circle cx="103" cy="82" r="3" fill="#ffffff" />
      <circle cx="103" cy="82" r="1.5" fill={FEATHER} />
    </Layer>
  )
}

/* ───────── ゆみ と や ───────── */

type BowProps = {
  readonly gx: number
  readonly gy: number
  /** りょうはし が 後ろへ そる 大きさ(マイナスだと ぎゃくに ぐにゃり) */
  readonly sag: number
  /** ぷるぷる ゆれる 大きさ と 位相 */
  readonly amp: number
  readonly phase: number
  /** ゆみ づるを ひく 手の場所。ひかない ときは null */
  readonly pull: readonly [number, number] | null
  readonly palette: Palette
}

/** ゴムみたいに やわらかい ゆみ。にぎり は うごかず、りょうはし ほど ゆれる。 */
function Bow({ gx, gy, sag, amp, phase, pull, palette }: BowProps) {
  const steps = 18
  const points = Array.from({ length: steps + 1 }, (_, i) => {
    const s = -1 + (2 * i) / steps
    return [gx - sag * s * s + amp * Math.sin(s * 3.3 + phase) * Math.abs(s), gy + BOW_HALF * s] as const
  })
  const wood = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')
  const top = points[0]
  const bottom = points[steps]
  const middle: readonly [number, number] = [(top[0] + bottom[0]) / 2 + amp * 0.5 * Math.sin(phase + 1), gy]
  const mid = pull ?? middle
  return (
    <>
      <path d={`M${top[0]} ${top[1]} L${mid[0]} ${mid[1]} L${bottom[0]} ${bottom[1]}`} fill="none" stroke={STRING} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d={wood} fill="none" stroke={palette.bow} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d={wood} fill="none" stroke={palette.bowLight} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" transform="translate(-0.7 0)" opacity="0.8" />
      {/* にぎり の まきもの */}
      <rect x={gx - 2.4} y={gy - 3.6} width="4.8" height="7.2" rx="1.6" fill="#e8534a" />
    </>
  )
}

function Arrow({ cx, cy, angle }: { readonly cx: number; readonly cy: number; readonly angle: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${angle})`}>
      <path d={`M${-ARROW_HALF} 0 H${ARROW_HALF - 3}`} stroke={ARROW_WOOD} strokeWidth="1.3" strokeLinecap="round" />
      <path d={`M${ARROW_HALF - 3.4} -2 L${ARROW_HALF + 1.4} 0 L${ARROW_HALF - 3.4} 2 Z`} fill="#8a8f99" />
      <path d={`M${-ARROW_HALF} 0 L${-ARROW_HALF - 3} -2.6 L${-ARROW_HALF + 3.4} -2.6 L${-ARROW_HALF + 4.6} 0 L${-ARROW_HALF + 3.4} 2.6 L${-ARROW_HALF - 3} 2.6 Z`} fill={FEATHER} />
    </g>
  )
}

/* ───────── こども ───────── */

type Mood = 'happy' | 'focus' | 'shock' | 'sad'

function Face({ mood, tl, hair }: { readonly mood: Mood; readonly tl: number; readonly hair: string }) {
  const tearP = ((tl * 1.3) % 1)
  return (
    <>
      <circle cx={HEAD[0]} cy={HEAD[1]} r="8.6" fill={SKIN} />
      {/* はな(右むき の しるし) */}
      <circle cx="69.6" cy="44.8" r="1.5" fill={SKIN_SHADE} />
      <circle cx="65.4" cy="47.6" r="2" fill="#ff9d9d" opacity="0.55" />
      {mood === 'happy' && (
        <>
          <circle cx="66" cy="42.4" r="1.2" fill="#2b2b2b" />
          <path d="M64 48.2 Q66.4 50.8 68.8 47.8" fill="none" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'focus' && (
        <>
          <path d="M64.2 42.8 l3.4 0.2" stroke="#2b2b2b" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M63.4 39.8 l4.4 1.4" stroke={hair} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M64.6 48.6 h3.6" stroke="#b9483f" strokeWidth="1.3" strokeLinecap="round" />
        </>
      )}
      {mood === 'shock' && (
        <>
          <circle cx="66" cy="42.4" r="2.3" fill="#ffffff" stroke="#2b2b2b" strokeWidth="0.6" />
          <circle cx="66.3" cy="42.4" r="1" fill="#2b2b2b" />
          <path d="M63.6 38.4 q2.4 -1.6 4.8 -0.2" fill="none" stroke={hair} strokeWidth="1.1" strokeLinecap="round" />
          <ellipse cx="66.6" cy="48.8" rx="1.5" ry="2" fill="#b9483f" />
        </>
      )}
      {mood === 'sad' && (
        <>
          <circle cx="66" cy="43" r="1.2" fill="#2b2b2b" />
          <path d="M63.4 41 l4 -1.6" stroke={hair} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M64.2 50 Q66.4 47.8 68.6 49.8" fill="none" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
          {/* なみだ: めの下から ぽろり */}
          <path d="M0 -1.6 Q1.4 0.4 0 1.4 Q-1.4 0.4 0 -1.6 Z" fill={TEAR} opacity={1 - tearP} transform={`translate(66.4 ${45 + tearP * 7})`} />
        </>
      )}
      {/* かみ: あたまの うしろ から てっぺん を おおう */}
      <path d="M52.4 43 C51.4 31.6 62 30 68.6 36 C70.4 38 70.5 40.6 70 42.6 C66 38.4 59.4 38.2 52.4 43 Z" fill={hair} />
      <path d="M59.4 34.2 Q58.4 30.6 61.4 30.8 Q62.2 28.6 64.2 30.6" fill="none" stroke={hair} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )
}

/** かた → ひじ → 手 の じゅんに つながる うで */
function Arm({ shoulder, elbow, hand, color }: { readonly shoulder: readonly [number, number]; readonly elbow: readonly [number, number]; readonly hand: readonly [number, number]; readonly color: string }) {
  return (
    <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
  )
}

/** ひっこ抜かれた やが とぶ とき(まっすぐ ではなく、ほとんど すぐ おちる) */
function arrowFlight(hand: readonly [number, number], grip: readonly [number, number]) {
  const dx = grip[0] - hand[0]
  const dy = grip[1] - hand[1]
  const len = Math.hypot(dx, dy)
  const startAngle = (Math.atan2(dy, dx) * 180) / Math.PI
  const center0: readonly [number, number] = [hand[0] + (dx / len) * ARROW_HALF, hand[1] + (dy / len) * ARROW_HALF]
  return { startAngle, center0 }
}

/**
 * ゆみを もった こども(右むき)。tl は この子の じかん。
 * ほんものの つくり: うで は かた から ひじ を通って 手へ。ゆみを ひくときは ひじ を 後ろへ。
 */
function Archer({ tl, palette }: { readonly tl: number; readonly palette: Palette }) {
  const appear = span(tl, POP, POP + 0.55, backOut)
  const raise = span(tl, RAISE_FROM, RAISE_TO, easeInOut)
  const draw = tl < RELEASE ? span(tl, DRAW_FROM, DRAW_TO, easeInOut) : 0
  const slump = span(tl, SAD, SAD_FULL, easeInOut)
  const released = tl >= RELEASE

  const mood: Mood = tl < DRAW_FROM ? 'happy' : tl < RELEASE ? 'focus' : tl < SAD ? 'shock' : 'sad'

  // うれしくて ぴょんぴょん(ゆみを もって あらわれたとき)
  const hop = Math.abs(Math.sin((tl - POP - 0.4) * Math.PI * 3)) * 1.6 * during(tl, POP + 0.4, RAISE_TO, 0.2)

  // ゆみを もつ手: はじめは 体の ちかく、ゆみを かまえると 前へ。がっかりで すこし 下がる
  const grip: readonly [number, number] = [72 + 8 * raise - 4 * slump, 64 - 9 * raise + 8 * slump]
  const pullHand = lerp2(REST_HAND, DRAW_HAND, draw)
  const pullElbow = lerp2(REST_ELBOW, DRAW_ELBOW, draw)
  const bowElbow = elbowBetween(SHOULDER_BOW, grip)

  // ゆみの ようす: ひくと まがりすぎ、はなすと ぐにゃり と ぎゃくに まがって ぷるぷる ゆれる
  const shaking = 3.4 * during(tl, RAISE_FROM, 2.6, 0.2)
  const strain = tl < RELEASE ? 0.9 * span(tl, DRAW_FROM, DRAW_TO) : 0
  const afterShake = released ? 5.5 * (1 - span(tl, RELEASE, 5.2)) + 0.7 : 0
  const amp = shaking + strain + afterShake
  const sag = released ? mix(tl, RELEASE, RELEASE + 0.5, 11, -9, backOut) : 5 + 6 * draw
  const phase = tl * 16

  // や: つがえる(手の中) → はなす → すこし とんで ぽとっ と おちる
  const arrowHand = pullHand
  const flight = span(tl, RELEASE, LAND)
  const nocked = span(tl, NOCK, NOCK + 0.3)
  let arrow: { readonly cx: number; readonly cy: number; readonly angle: number } | null = null
  if (!released && nocked > 0) {
    const f = arrowFlight(arrowHand, grip)
    arrow = { cx: f.center0[0], cy: f.center0[1], angle: f.startAngle }
  } else if (released) {
    const f = arrowFlight(DRAW_HAND, GRIP_READY)
    arrow = {
      cx: f.center0[0] + ARROW_FLY_X * easeOut(flight),
      cy: f.center0[1] + ARROW_FLY_Y * flight * flight,
      angle: f.startAngle + (ARROW_END_ANGLE - f.startAngle) * flight ** 1.4,
    }
  }

  // 草に おちた ところの ほこり
  const puff = span(tl, LAND, LAND + 0.6, easeOut)
  const landX = arrowFlight(DRAW_HAND, GRIP_READY).center0[0] + ARROW_FLY_X

  const pullPoint = tl < RELEASE && draw > 0.02 ? pullHand : null
  const headTilt = mood === 'shock' ? -5 : mood === 'sad' ? 9 * slump + 2 : 0
  const slouch = 3 * slump

  return (
    <Layer scaleX={0.75 + 0.25 * appear} scaleY={appear} origin={[60.5, GROUND]}>
      <ellipse cx="60.5" cy="97.4" rx="12" ry="2.5" fill="#000000" opacity="0.12" />
      <Layer y={-hop}>
        {/* あし: よこむきに ふみ出す(ゆみを ひくときの たちかた) */}
        <rect x="53" y="72" width="5.8" height="22" rx="2.9" fill={PANTS_DARK} />
        <ellipse cx="56.6" cy="94.2" rx="5.4" ry="2.8" fill={SHOE} />
        <rect x="62.4" y="72" width="5.8" height="22" rx="2.9" fill={PANTS} />
        <ellipse cx="66.4" cy="94.2" rx="5.4" ry="2.8" fill={SHOE} />
        {/* どう と くび(がっかりで すこし まるまる) */}
        <Layer rotate={slouch} origin={[61, 76]}>
          <rect x="58.4" y="48" width="5.2" height="8" rx="2.4" fill={SKIN_SHADE} />
          <rect x="53" y="53" width="15.4" height="24" rx="7.2" fill={palette.tunic} />
          <path d="M54.6 69 h12" stroke={palette.tunicDark} strokeWidth="1.6" strokeLinecap="round" />
          <Layer rotate={headTilt} origin={NECK}>
            <Face mood={mood} tl={tl} hair={palette.hair} />
          </Layer>
          {/* ゆみを ひく うで(うしろの かた から ひじ、ひじ から 手) */}
          <Arm shoulder={SHOULDER_STRING} elbow={pullElbow} hand={pullHand} color={palette.tunicDark} />
          {/* ゆみを もつ うで */}
          <Arm shoulder={SHOULDER_BOW} elbow={bowElbow} hand={grip} color={palette.tunic} />
        </Layer>
        <Bow gx={grip[0]} gy={grip[1]} sag={sag} amp={amp} phase={phase} pull={pullPoint} palette={palette} />
        {arrow && <Arrow cx={arrow.cx} cy={arrow.cy} angle={arrow.angle} />}
        <circle cx={grip[0]} cy={grip[1]} r="3.3" fill={SKIN} />
        <circle cx={pullHand[0]} cy={pullHand[1]} r="3.1" fill={SKIN} />
        {/* びっくり の せん */}
        <g opacity={during(tl, RELEASE + 0.05, SAD, 0.15)} stroke="#f0a030" strokeWidth="1.3" strokeLinecap="round">
          <path d="M61 28 v-4" />
          <path d="M67 30 l2.6 -2.8" />
          <path d="M55 30 l-2.6 -2.8" />
        </g>
      </Layer>
      {puff > 0 && puff < 1 && (
        <g opacity={0.85 * (1 - puff)} fill={DUST}>
          <circle cx={landX - 2} cy={94 - puff * 3} r={1.8 + puff * 2.6} />
          <circle cx={landX + 3} cy={94.5 - puff * 4} r={1.4 + puff * 3} />
          <circle cx={landX + 7} cy={95 - puff * 2} r={1 + puff * 2.2} />
        </g>
      )}
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 10)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Target t={t} />
        <Layer scaleX={-1} origin={[54.5, 0]}>
          <Target t={t} />
        </Layer>
        {/* ふたり せなか あわせ。左の子は ひっくり返して、すこし おくれて うごく */}
        <Layer scaleX={-1} origin={[54.5, 0]}>
          <Layer x={KID_GAP}>
            <Archer tl={t - FRIEND_DELAY} palette={LEFT_KID} />
          </Layer>
        </Layer>
        <Layer x={KID_GAP}>
          <Archer tl={t} palette={RIGHT_KID} />
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
    { at: 0, label: 'はれた 草はら。とおくに まとが ふたつ', sound: 'pop' },
    { at: POP + 0.3, label: 'ふたりの こどもが ゆみを もって あらわれる', sound: 'pop' },
    { at: RAISE_FROM + 0.2, label: 'ゆみは ゴムみたいに ぐにゃり と やわらかい' },
    { at: NOCK + 0.2, label: 'やを つがえて ぐーっと ひきしぼる' },
    { at: RELEASE, label: 'はなすと ゆみが ぐにゃり。やは すぐ おちる', sound: 'pop' },
    { at: SAD, label: 'まとに とどかない。しょんぼり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '弱 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
