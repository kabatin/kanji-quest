/*
 * 前(まえ): 男の子が 足を ふねに のせて、ふねは まえへ すすむ。
 *
 * ほね(画と絵の対応)  ※ 字の形に合わせて 絵を ゆがめず、だいたい 同じ場所・同じ向き に おいた
 *   1・2画目(丷)   … 空を とぶ 2わの かもめ
 *   3画目(一)      … 空に ながれる 平たい 雲
 *   4・5画目       … ざんばしの 2ほんの くい と、そのあいだの ロープ
 *   6・7画目       … ざんばしの 板(男の子の 足もと)と、したの はり
 *   8画目(丨)      … ふねの 小さな はしら
 *   9画目(丨)      … ふねの 大きな はしら(ほは その みぎに ふくらむ)
 *
 * ながれ
 *   水べに ざんばしが でき、ふねが うかぶ → 男の子が あるいてきて、ふねを ふしぎそうに 見る
 *   → どきどき しながら 足を そっと ふねへ のばし、「ぽん」と のせる(ふねが ゆれて、ひやり)
 *   → もう 片足も のって、ゆれが おさまると にっこり
 *   → 風が ふいて ほが ふくらみ、ふねが すいすい まえ(みぎ)へ すすむ。男の子は まえを ゆびさして ごきげん
 *   → ほね が ひかって、絵が うすくなり、字「前」が のこる
 *
 * 人は、ほんものの人の つくり を守る:
 *   足は こし から、ひざ で まがる(足が とどく ところに ひざを きめる)。うで は かた から出て ひじ で まがる。
 *   ふねは 水に うかび、体が のった ぶんだけ しずんで ゆれる。ほは 風を うけると ふくらむ。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '前'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#f5c542'
const TUNIC_DARK = '#dba52c'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const DECK_TOP = '#b88555'
const HULL = '#d95f48'
const HULL_DARK = '#b84a36'
const HULL_RIM = '#f3e4c2'
const SAIL = '#ffeebd'
const SAIL_LINE = '#e6c98a'
const ROPE = '#d9c28a'
const WATER = '#7cc4f2'
const WATER_FRONT = '#5aaee8'
const WATER_LIGHT = '#bfe4fa'
const HILL = '#e2f2d2'
const SUN = '#ffd24a'
const GULL = '#6b7a8f'
const CHEEK = '#ff9d9d'
const MOUTH = '#b9483f'
const EYE = '#2b2b2b'

/** くぎり の時間(秒) */
const WALK_FROM = 0.4
/** ざんばしの はしに ついて、ふねを 見る */
const ARRIVE = 2.3
/** 足を ふねへ のばしはじめる */
const REACH = 2.9
/** 1ほんめの 足が ふねに のる */
const LAND = 3.5
/** もう 片足を のせる */
const BOARD_FROM = 3.8
const BOARD_TO = 4.4
/** 風が ふいて、ほが ふくらみ、ふねが すすむ */
const WIND = 4.6
const SAIL_END = 6.2
const INK = 6.5
const DONE = 9.7
const DURATION = 10.2

/* ───────── 寸法(座標は 109 x 109) ───────── */

type Pt = readonly [number, number]

/** ざんばしの 板の うえ、ふねの かんぱん の たかさ、水面 */
const PIER_TOP = 59.5
const DECK_Y = 66
const WATER_Y = 74
/** 足くびから 地面までの たかさ */
const ANKLE = 1.8
/** もものと すねの 長さ(ひざ で まがる) */
const THIGH = 5.3
/** こしから 足くびまで とどく いちばん長い きょり(ほんの少し まげた まま) */
const REACH_MAX = THIGH * 2 - 0.3
/** ざんばしの うえで 立つ ときの 足くびの たかさ */
const PIER_ANKLE = PIER_TOP - ANKLE
/** ふねの 左はし(ふねの 絵は この ざひょうで かく。bx で よこに うごく) */
const BOAT_PIVOT: Pt = [78, 70]

/* ───────── 水・空 ───────── */

function waterPath(t: number, amp: number): string {
  const points = Array.from({ length: 29 }, (_, i) => {
    const x = -4 + i * 4.2
    return `${x.toFixed(1)} ${(WATER_Y + amp * Math.sin(x * 0.16 + t * 1.9)).toFixed(2)}`
  })
  return `M-4 102 L${points.join(' L')} L114 102 Z`
}

function Sky({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun} fill={SUN} />
      {/* 3画目: 空に ながれる 平たい 雲(そこ が たいら) */}
      <g transform={`translate(${wave(t, 9) * 1.6} 0)`} opacity={span(t, 0.1, 0.7)}>
        <rect x="12" y="22.4" width="84" height="4.4" rx="2.2" fill="#dde9f5" />
        <rect x="12" y="21.4" width="84" height="4.2" rx="2.1" fill="#ffffff" />
        <circle cx="30" cy="21" r="4.2" fill="#ffffff" />
        <circle cx="52" cy="19.6" r="5.2" fill="#ffffff" />
        <circle cx="73" cy="21" r="4.2" fill="#ffffff" />
      </g>
      {/* とおくの おか(水の むこう) */}
      <path d={`M-4 ${WATER_Y + 2} Q16 64 38 72 Q64 60 90 70 Q104 64 114 71 V${WATER_Y + 2} Z`} fill={HILL} />
    </>
  )
}

/** 1・2画目: 空を ゆったり とぶ かもめ。はばたきで 羽が 上下する。 */
function Gull({ t, x, y, phase }: SceneProps & { readonly x: number; readonly y: number; readonly phase: number }) {
  const appear = span(t, 0.3, 0.9)
  const gx = x + 9 * Math.sin(((t - INK) / 5.5) * Math.PI * 2)
  const gy = y + 1.6 * wave(t, 1.9, phase)
  const tip = 1.2 + 2.2 * wave(t, 0.8, phase)
  return (
    <Layer x={gx} y={gy} opacity={appear}>
      <path d={`M-5.2 ${tip} Q-2.6 -2.2 0 0.4 Q2.6 -2.2 5.2 ${tip}`} fill="none" stroke={GULL} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </Layer>
  )
}

/** なみの 白い すじ。水が ながれる(ふねが すすむと はやく ながれる)。 */
function Ripples({ scroll }: { readonly scroll: number }) {
  return (
    <>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const row = i % 3
        const x = ((((i * 41 - scroll) % 130) + 130) % 130) - 12
        return <path key={i} d={`M${x} ${80 + row * 7} q3 -1.6 6 0`} fill="none" stroke={WATER_LIGHT} strokeWidth="1.1" strokeLinecap="round" />
      })}
    </>
  )
}

/* ───────── ざんばし ───────── */

/** 4〜7画目: くい と 板。くい は 水から 立ちあがる。 */
function Pier({ t }: SceneProps) {
  const grow = span(t, 0, 0.6, backOut)
  return (
    <Layer scaleY={grow} scaleX={0.7 + 0.3 * grow} origin={[26, 96]}>
      {/* ひだりの くい(1ぽん ふやして 板を ささえる) */}
      <rect x="5" y="62" width="3.4" height="34" rx="1.4" fill={BARK_DARK} />
      {/* 4・5画目: 2ほんの くい。うしろがわ に立つ(男の子は てまえを あるく) */}
      <rect x="24.6" y="45" width="3.8" height="51" rx="1.7" fill={BARK} />
      <rect x="45.8" y="45" width="3.8" height="51" rx="1.7" fill={BARK} />
      {/* くい の あいだの ロープ */}
      <path d="M28 47.2 Q37 51.4 45.8 47.2" fill="none" stroke={ROPE} strokeWidth="1.4" strokeLinecap="round" />
      {/* 7画目: したの はり */}
      <rect x="27" y="70.4" width="19" height="3" rx="1" fill={BARK_DARK} />
      {/* 6画目: 板(あるく ところ) */}
      <rect x="-4" y={PIER_TOP} width="54" height="3.6" rx="1" fill={DECK_TOP} />
      <rect x="-4" y={PIER_TOP + 3.6} width="54" height="3" fill={BARK_DARK} />
      <path d="M6 60.4 v1.4 M17 60.4 v1.4 M29 60.4 v1.4 M41 60.4 v1.4" stroke={BARK} strokeWidth="0.7" strokeLinecap="round" />
    </Layer>
  )
}

/* ───────── ふね ───────── */

/** 8・9画目: 2ほんの はしら と ほ。belly は ほの ふくらみ(0 = だらん / 1 = 風で ぱんぱん) */
function Boat({ t, belly }: { readonly t: number; readonly belly: number }) {
  const flutter = wave(t, 0.5) * 0.8
  const sailRight = 81.2 + 17 * belly + 2
  return (
    <>
      {/* 小さな はしら と はた */}
      <rect x="62.9" y="47.4" width="2.2" height="19.6" rx="1" fill={BARK} />
      <path d={`M65 48.4 q${3.6 + flutter} -1.2 ${7 + flutter} 0.4 q${-3.4} 2.4 -7 2.6 Z`} fill="#e8534a" />
      {/* 大きな はしら と ほ */}
      <rect x="79.9" y="40" width="2.2" height="26.6" rx="1" fill={BARK} />
      <path d={`M82.1 41 q${4 + flutter} -1.4 ${8} 0.5 q-4 2.4 -8 1.8 Z`} fill="#e8534a" />
      <path d={`M81.2 44 C${82.2 + 9 * belly} 47 ${83.2 + 20 * belly} 54 ${sailRight} 61.6 L81.2 61.6 Z`} fill={SAIL} />
      <path d={`M81.2 52.6 Q${84 + 8 * belly} 54.6 ${sailRight - 2.2} 57.6`} fill="none" stroke={SAIL_LINE} strokeWidth="0.9" strokeLinecap="round" />
      <rect x="80.2" y="61.4" width="19.4" height="1.8" rx="0.9" fill={BARK_DARK} />
      {/* ふなばた(かんぱん) と ふな ぞこ */}
      <path d={`M51 ${DECK_Y} H100 Q98.5 77 90 80.5 H61.5 Q53 77 51 ${DECK_Y} Z`} fill={HULL} />
      <path d="M54 75.2 H97 Q95 78.6 90 80.5 H61.5 Q56 78.6 54 75.2 Z" fill={HULL_DARK} />
      <path d={`M51 ${DECK_Y} H100 L99.6 ${DECK_Y + 2.4} H51.4 Z`} fill={HULL_RIM} />
      {[63, 72, 81].map((x) => (
        <circle key={x} cx={x} cy="72.2" r="1.7" fill="#fff3c4" />
      ))}
    </>
  )
}

/** ざんばしの くい と ふねを むすぶ ロープ。風で ふねが うごきだすと、ほどけて 水に たれる。 */
function MooringRope({ t, bx }: { readonly t: number; readonly bx: number }) {
  const cut = span(t, WIND - 0.1, WIND + 0.3)
  if (cut < 1) {
    const end: Pt = [52 + bx, DECK_Y + 0.6]
    const drop = cut * 10
    return <path d={`M48 58 Q${(48 + end[0]) / 2} ${(58 + end[1]) / 2 + 2 + drop} ${end[0]} ${end[1] + cut * 8}`} fill="none" stroke={ROPE} strokeWidth="1.3" strokeLinecap="round" />
  }
  const sway = wave(t, 1.6) * 0.8
  return <path d={`M48 58 q${0.4 + sway} 8 ${1.4 + sway} 15.4`} fill="none" stroke={ROPE} strokeWidth="1.3" strokeLinecap="round" />
}

/* ───────── 男の子 ───────── */

type Mood = 'curious' | 'nervous' | 'happy'
/** うで の かっこう。swing = ま下から まえ(みぎ)へ ふった角度 / bend = ひじ の まがり(まえへ) */
type ArmPose = { readonly swing: number; readonly bend: number }

const SHOULDER: Pt = [0.4, -8.2]
const ARM_PART = 5.3
const rad = (deg: number) => (deg * Math.PI) / 180

/** こし(ひとつの てん)から 足くびまで。ひざ は まえ(みぎ)へ まがる。足くびが 遠すぎるときは のばしきる。 */
function legPoints(hip: Pt, foot: Pt): { readonly knee: Pt; readonly ankle: Pt } {
  const dx = foot[0] - hip[0]
  const dy = foot[1] - hip[1]
  const dist = Math.max(Math.hypot(dx, dy), 0.001)
  const reach = Math.min(dist, THIGH * 2 - 0.01)
  const ux = dx / dist
  const uy = dy / dist
  const half = Math.sqrt(Math.max(0, THIGH * THIGH - (reach / 2) ** 2))
  const px = uy >= 0 ? uy : -uy
  const py = uy >= 0 ? -ux : ux
  const knee: Pt = [hip[0] + ux * (reach / 2) + px * half, hip[1] + uy * (reach / 2) + py * half]
  return { knee, ankle: [hip[0] + ux * reach, hip[1] + uy * reach] }
}

/** 両足を ちゃんと とどかせる こしの たかさ(足が ながくなったり ちぢんだり しない) */
function hipHeight(feet: readonly Pt[], hx: number): number {
  return Math.min(...feet.map(([x, y]) => y - Math.sqrt(Math.max(0, REACH_MAX ** 2 - (x - hx) ** 2))))
}

function Leg({ hip, foot, color }: { readonly hip: Pt; readonly foot: Pt; readonly color: string }) {
  const { knee, ankle } = legPoints(hip, foot)
  return (
    <>
      <path d={`M${hip[0]} ${hip[1]} L${knee[0]} ${knee[1]} L${ankle[0]} ${ankle[1]}`} fill="none" stroke={color} strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx={ankle[0] + 1.6} cy={ankle[1] + 0.9} rx="3.3" ry="1.5" fill={SHOE} />
    </>
  )
}

/** かた から出て、ひじ で まがる うで(こしを げんてん にした ざひょう) */
function Arm({ pose, color }: { readonly pose: ArmPose; readonly color: string }) {
  const elbow: Pt = [SHOULDER[0] + Math.sin(rad(pose.swing)) * ARM_PART, SHOULDER[1] + Math.cos(rad(pose.swing)) * ARM_PART]
  const fore = pose.swing + pose.bend
  const hand: Pt = [elbow[0] + Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART]
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.3" fill={SKIN} />
    </>
  )
}

/** 顔。右むき。気持ちで 目・まゆ・口 が かわる。 */
function Face({ cx, cy, mood, wind }: { readonly cx: number; readonly cy: number; readonly mood: Mood; readonly wind: number }) {
  const ex = cx + 2.3
  const ey = cy - 0.4
  return (
    <>
      <circle cx={cx} cy={cy} r="4.9" fill={SKIN} />
      <path d={`M${cx - 4.9} ${cy + 1.2} C${cx - 5.6} ${cy - 5.6} ${cx + 0.6} ${cy - 7.4} ${cx + 4.2} ${cy - 3.8} C${cx + 1.6} ${cy - 4.2} ${cx - 1.4} ${cy - 2.4} ${cx - 2.2} ${cy + 1.8} Z`} fill={HAIR} />
      {/* ぴょこんと はねた かみ(風で うしろへ なびく) */}
      <path d={`M${cx - 1} ${cy - 6.2} q${-2.2 - wind * 2} ${-1.6 + wind * 0.4} ${-4.2 - wind * 2.6} ${-0.4 + wind * 1.2}`} fill="none" stroke={HAIR} strokeWidth="1.7" strokeLinecap="round" />
      <circle cx={cx + 0.9} cy={cy + 2.6} r="1.4" fill={CHEEK} opacity="0.55" />
      {mood === 'curious' && (
        <>
          <circle cx={ex} cy={ey} r="1.1" fill={EYE} />
          <path d={`M${ex - 1.5} ${ey - 2.3} l2.8 -0.8`} stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <circle cx={cx + 3} cy={cy + 2.7} r="0.8" fill={MOUTH} />
        </>
      )}
      {mood === 'nervous' && (
        <>
          <circle cx={ex} cy={ey} r="1.1" fill={EYE} />
          <path d={`M${ex - 1.4} ${ey - 2.2} L${ex + 1.4} ${ey - 3.3}`} stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <path d={`M${cx + 1.2} ${cy + 3.1} q0.9 -0.9 1.8 0 t1.8 0`} fill="none" stroke={MOUTH} strokeWidth="0.9" strokeLinecap="round" />
          <path d={`M${cx - 4.6} ${cy - 3} q1.1 1.6 0 2.4 q-1.1 -0.8 0 -2.4 Z`} fill="#7cc4f2" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d={`M${ex - 1.3} ${ey + 0.6} Q${ex} ${ey - 1.2} ${ex + 1.3} ${ey + 0.6}`} fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d={`M${cx + 1.2} ${cy + 2.2} Q${cx + 2.8} ${cy + 5.4} ${cx + 4.4} ${cy + 2} Z`} fill={MOUTH} />
        </>
      )}
    </>
  )
}

type BoyProps = {
  readonly feetFar: Pt
  readonly feetNear: Pt
  readonly nearArm: ArmPose
  readonly farArm: ArmPose
  readonly lean: number
  readonly mood: Mood
  readonly wind: number
}

/** 男の子。足の ばしょ から こしの たかさ を きめるので、足は いつも ちゃんと 地面(板・かんぱん)に ついている。 */
function Boy({ feetFar, feetNear, nearArm, farArm, lean, mood, wind }: BoyProps) {
  const hx = (feetFar[0] + feetNear[0]) / 2
  const hip: Pt = [hx, hipHeight([feetFar, feetNear], hx)]
  return (
    <>
      <Leg hip={hip} foot={feetFar} color={PANTS_DARK} />
      <Leg hip={hip} foot={feetNear} color={PANTS} />
      <Layer x={hip[0]} y={hip[1]} rotate={lean}>
        <Arm pose={farArm} color={TUNIC_DARK} />
        {/* どう と くび(みじかく) */}
        <rect x="-4" y="-10.4" width="8.4" height="11.2" rx="3.6" fill={TUNIC} />
        <path d="M-3.4 -2 h7.2" stroke={TUNIC_DARK} strokeWidth="1.2" strokeLinecap="round" />
        <rect x="-0.8" y="-12" width="3.6" height="2.8" rx="1.2" fill={SKIN_SHADE} />
        <Face cx={1} cy={-15.4} mood={mood} wind={wind} />
        <Arm pose={nearArm} color={TUNIC} />
      </Layer>
    </>
  )
}

/* ───────── 小さな にぎやかし ───────── */

/** ふねが のった しゅんかんの みずしぶき と わ */
function Splash({ t, bx }: { readonly t: number; readonly bx: number }) {
  const show = during(t, LAND, LAND + 1, 0.1)
  if (show <= 0) return null
  const p = span(t, LAND, LAND + 1, easeOut)
  const cx = 54 + bx
  return (
    <g opacity={show}>
      <ellipse cx={cx} cy={WATER_Y + 1} rx={3 + 9 * p} ry={0.8 + 2 * p} fill="none" stroke="#ffffff" strokeWidth="0.9" />
      {[-1, 0, 1].map((k) => (
        <circle key={k} cx={cx + k * 3.4 * (0.6 + p)} cy={WATER_Y - Math.sin(Math.min(1, p * 1.6) * Math.PI) * (4 + (k === 0 ? 2 : 0))} r={1 - p * 0.5} fill="#ffffff" />
      ))}
    </g>
  )
}

/** ふねの うしろに のこる しろい なみ(すすんでいる ときだけ) */
function Wake({ t, bx }: { readonly t: number; readonly bx: number }) {
  const going = during(t, WIND + 0.2, SAIL_END + 1.4, 0.4)
  if (going <= 0) return null
  return (
    <g opacity={going}>
      {[0, 1, 2].map((i) => (
        <ellipse key={i} cx={50 + bx - i * 6.4 - 2} cy={WATER_Y + 1.6 + wave(t, 0.8, i * 0.3) * 0.5} rx={2.6 + i * 0.8} ry="0.9" fill="#ffffff" opacity={0.95 - i * 0.25} />
      ))}
    </g>
  )
}

/** 風。ひだり から みぎへ、くるんと ふきぬける。 */
function Wind({ t }: SceneProps) {
  const show = during(t, WIND - 0.3, SAIL_END + 0.4, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show} fill="none" stroke="#9fbfe0" strokeWidth="1.1" strokeLinecap="round">
      {[0, 1, 2].map((i) => {
        const p = ((t - WIND + i * 0.4) % 1.2) / 1.2
        return <path key={i} d={`M${14 + p * 62} ${38 + i * 6} q6 -3 12 0 q3 1.6 0.4 3.2`} opacity={Math.sin(Math.max(0, p) * Math.PI)} />
      })}
    </g>
  )
}

/** ゆれ(だんだん ちいさくなる)。u は ゆれ はじめから の秒。 */
const ring = (u: number, period: number, decay: number) => (u <= 0 ? 0 : Math.exp(-decay * u) * Math.sin((u / period) * Math.PI * 2))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 9)

  // ふね: 体が のると しずんで ゆれる。風を うけると まえ(みぎ)へ すすむ
  const sail = span(t, WIND, SAIL_END, easeInOut)
  const bx = -1 + 5 * sail
  const by = 0.45 * wave(t, 2.6) + 1.8 * ring(t - LAND, 0.7, 2.6) + 1.0 * ring(t - BOARD_TO, 0.7, 2.8)
  const brot = -2.4 * ring(t - LAND, 0.9, 2) - 1.0 * ring(t - BOARD_TO, 0.9, 2.2)
  const belly = 0.12 + 0.88 * span(t, WIND - 0.2, WIND + 0.7, backOut)
  const deckFoot = (local: number): Pt => [bx + local, DECK_Y + by + (local - BOAT_PIVOT[0]) * Math.sin(rad(brot)) - ANKLE]

  // 足: あるく → のせる → もう片足 → おちつく
  const walking = 1 - span(t, ARRIVE - 0.4, ARRIVE)
  const hxWalk = mix(t, WALK_FROM, ARRIVE, -8, 44.5, easeInOut)
  const phase = (t - WALK_FROM) * Math.PI * 2 * 1.7
  const stride = Math.sin(phase) * walking
  const liftFar = Math.max(0, Math.cos(phase)) * walking * 1.8
  const liftNear = Math.max(0, -Math.cos(phase)) * walking * 1.8
  const settle = span(t, BOARD_TO, BOARD_TO + 0.6, easeOut)

  const farWalk: Pt = [hxWalk - 1.5 + stride * 3.8, PIER_ANKLE - liftFar]
  const nearWalk: Pt = [hxWalk + 1.5 - stride * 3.8, PIER_ANKLE - liftNear]
  // 手まえの足(まえの足): そっと ふねへ のばして のせる
  const reachNear = span(t, REACH, LAND, easeInOut)
  const nearLand = deckFoot(lerp(54.5, 56.5, settle))
  const nearFoot: Pt = t < REACH ? nearWalk : [lerp(nearWalk[0], nearLand[0], reachNear), lerp(nearWalk[1], nearLand[1], reachNear) - 6 * Math.sin(reachNear * Math.PI)]
  // うしろの足: ざんばしを はなれて ふねへ
  const boardFar = span(t, BOARD_FROM, BOARD_TO, easeInOut)
  const farLand = deckFoot(lerp(52, 53.5, settle))
  const farFoot: Pt = t < BOARD_FROM ? farWalk : [lerp(farWalk[0], farLand[0], boardFar), lerp(farWalk[1], farLand[1], boardFar) - 6 * Math.sin(boardFar * Math.PI)]

  const mood: Mood = t < REACH ? 'curious' : t < BOARD_TO + 0.1 ? 'nervous' : 'happy'
  const lean = 6 * span(t, REACH - 0.2, LAND, easeInOut) * (1 - span(t, BOARD_FROM, BOARD_TO + 0.3))

  // うで: あるくときは あしと ぎゃくに ふる。ふねに のるときは バランスを とる。さいごは まえを ゆびさす。
  const balance = span(t, REACH - 0.1, REACH + 0.2) * (1 - span(t, BOARD_TO, BOARD_TO + 0.5))
  const point = span(t, 5.0, 5.7, easeOut)
  const nearBase: ArmPose = { swing: 5 - stride * 24, bend: 14 }
  const farBase: ArmPose = { swing: 5 + stride * 24, bend: 14 }
  const nearBal: ArmPose = { swing: 55 + 25 * wave(t, 0.55), bend: 20 }
  const farBal: ArmPose = { swing: -50 + 25 * wave(t, 0.55, 0.3), bend: 15 }
  const nearSettled: ArmPose = { swing: lerp(lerp(nearBase.swing, nearBal.swing, balance), 108, point), bend: lerp(lerp(nearBase.bend, nearBal.bend, balance), 8, point) }
  const farSettled: ArmPose = { swing: lerp(farBase.swing, farBal.swing, balance) - 4 * point, bend: lerp(farBase.bend, farBal.bend, balance) }
  const windOn = span(t, WIND, WIND + 0.5)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Gull t={t} x={38} y={19} phase={0} />
        <Gull t={t} x={68} y={18} phase={0.9} />
        <path d={waterPath(t, 0.7)} fill={WATER} />
        <Ripples scroll={t * 3 + 22 * sail} />
        <Wind t={t} />
        <Pier t={t} />
        <Layer opacity={span(t, 0.5, 0.8)}>
          <MooringRope t={t} bx={bx} />
        </Layer>
        <Layer opacity={span(t, 0.3, 0.8)}>
          <Layer x={bx} y={by} rotate={brot} origin={BOAT_PIVOT} scale={0.6 + 0.4 * span(t, 0.3, 0.9, backOut)}>
            <Boat t={t} belly={belly} />
          </Layer>
        </Layer>
        <Layer opacity={span(t, WALK_FROM, WALK_FROM + 0.2)}>
          <Boy feetFar={farFoot} feetNear={nearFoot} nearArm={nearSettled} farArm={farSettled} lean={lean} mood={mood} wind={windOn} />
        </Layer>
        {/* 水の てまえ がわ(ふなぞこ と くい が 水に つかる) */}
        <path d={waterPath(t, 0.7)} fill={WATER_FRONT} opacity="0.5" />
        <Splash t={t} bx={bx} />
        <Wake t={t} bx={bx} />
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
    { at: 0, label: 'ざんばし と ふね が できる', sound: 'pop' },
    { at: WALK_FROM + 0.1, label: '男の子が あるいてくる' },
    { at: REACH, label: 'どきどき しながら 足を ふねへ' },
    { at: LAND, label: 'ふねに 足を のせる', sound: 'pop' },
    { at: BOARD_TO, label: 'もう 片足も のって にっこり' },
    { at: WIND, label: '風で ほが ふくらみ、まえへ すすむ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '前 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
