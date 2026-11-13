/*
 * 食(たべる): うつわに ごはんが やまもり。おおきな くちで いただきます。
 *
 * ほね(画と絵の対応)
 *   1・2画目(ノ・丶) … うつわの上に こんもり もられた ごはんの やま(てっぺんから 左右へ すそが ひろがる)
 *   3画目(丶)       … やまの てっぺんの ごはんつぶ
 *   4〜6画目         … 高さのある うつわ(たかつき)の 入れもの(ふち と ごはんの あたり)
 *   7画目            … うつわの あし(だい)
 *   8・9画目         … うつわを のせた テーブルの そこ
 *   (絵は 字に ぴったりは 重ならない。やまの てっぺん・すその ひろがりが だいたい 同じ場所・向き)
 *
 * ながれ
 *   男の子が テーブルの前に すわる。おなかが ぐう。うつわは からっぽで、しょんぼり
 *   → おひつ(ごはんの入れもの)から しゃもじで ごはんを すくって、うつわに もる(3かい)。やまもりに なって にっこり
 *   → 手を あわせて「いただきます」 → スプーンで ひとくち すくって、おおきな くちを あけて ぱくっ
 *   → もぐもぐ(ハートが ふわり) → ほね が ひかって、絵が うすくなり、字「食」が のこる
 *
 * 男の子は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(かた・ひじ・手 を 長さそのままで つなぐ)。くび は みじかい。
 *   いきおいで うで が のびすぎないよう、とどく はんい を こえたら 手を てまえに ひく。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '食'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#f2a93b'
const TUNIC_DARK = '#d98f22'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const LEAF = '#55b86e'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const WOOD = '#c98a52'
const WOOD_DARK = '#a86f3c'
const LACQUER = '#d9573f'
const LACQUER_DARK = '#b8432e'
const LACQUER_IN = '#8f3322'
const RICE = '#fffaf0'
const RICE_SHADE = '#ece3c8'
const POT = '#b9793f'
const POT_DARK = '#946029'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const HEART = '#f07f9e'

/** くぎり の時間(秒) */
const SIT = 0.5
const HUNGRY = 1.0
const PADDLE = 2.2
/** しゃもじで すくって もる(1かい 0.7秒 x 3かい) */
const SCOOP = 2.9
const SCOOP_TIMES = 3
const SCOOP_LEN = 0.7
const SCOOP_END = SCOOP + SCOOP_LEN * SCOOP_TIMES
/** 手を あわせる・スプーン・ぱくっ・もぐもぐ */
const GASSHO = 5.4
const SPOON = 5.85
const BITE = 6.3
const EAT = 6.9
const CHEEK = 7.5
const INK = 7.9
const DONE = 10.9
const DURATION = 11.5

type Pt = readonly [number, number]

/** 男の子の ばしょ。かた・あたま・おなか・口。 */
const SHOULDER: Pt = [19, 67]
const NECK: Pt = [14.5, 62]
const BELLY: Pt = [19, 78]
const ARM_PART = 12

/** うつわ・おひつ の ばしょ */
const CX = 55
const RIM_Y = 56
const TABLE_Y = 76

/* ───────── うで(かた → ひじ → 手) ───────── */

/**
 * ふたつの ほね(かた→ひじ→手)。手が とどかないときは、手を てまえに ひいて つながり を 守る。
 * ひじ は 下むき(おなじ高さなら うしろ)に まがる。
 */
function reach(target: Pt): { readonly elbow: Pt; readonly hand: Pt } {
  const dx = target[0] - SHOULDER[0]
  const dy = target[1] - SHOULDER[1]
  const dist = Math.max(Math.hypot(dx, dy), 0.01)
  const d = Math.min(dist, ARM_PART * 2 * 0.98)
  const ux = dx / dist
  const uy = dy / dist
  const hand: Pt = [SHOULDER[0] + ux * d, SHOULDER[1] + uy * d]
  const half = Math.sqrt(Math.max(0, ARM_PART ** 2 - (d / 2) ** 2))
  const mid: Pt = [SHOULDER[0] + (ux * d) / 2, SHOULDER[1] + (uy * d) / 2]
  const a: Pt = [-uy, ux]
  const b: Pt = [uy, -ux]
  const side = Math.abs(a[1] - b[1]) < 1e-6 ? (a[0] < b[0] ? a : b) : a[1] > b[1] ? a : b
  return { elbow: [mid[0] + side[0] * half, mid[1] + side[1] * half], hand }
}

function Arm({ target, color }: { readonly target: Pt; readonly color: string }) {
  const { elbow, hand } = reach(target)
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.9" fill={SKIN} />
    </>
  )
}

/** 手の うごき(かぎ の 時間・場所・もちものの 角度)。まのあいだは なめらかに つなぐ。 */
type Key = { readonly at: number; readonly pos: Pt; readonly angle: number }

function track(t: number, keys: readonly Key[]): { readonly pos: Pt; readonly angle: number } {
  const next = keys.findIndex((key) => key.at > t)
  if (next <= 0) return keys[next === 0 ? 0 : keys.length - 1]
  const a = keys[next - 1]
  const b = keys[next]
  const k = span(t, a.at, b.at, easeInOut)
  return { pos: [a.pos[0] + (b.pos[0] - a.pos[0]) * k, a.pos[1] + (b.pos[1] - a.pos[1]) * k], angle: a.angle + (b.angle - a.angle) * k }
}

/** しゃもじの 先が ごはんに とどく手の ばしょ(おひつ・うつわの上) */
const AT_POT: Pt = [22, 63]
const OVER_BOWL: Pt = [32, 54]
const AT_CHEST: Pt = [24, 66]
const AT_FLANK: Pt = [34, 55]
const AT_MOUTH: Pt = [14.5, 66]
const AT_CHEEK: Pt = [20.5, 62]

const scoopKeys: readonly Key[] = Array.from({ length: SCOOP_TIMES }, (_, k) => {
  const s = SCOOP + SCOOP_LEN * k
  return [
    { at: s, pos: OVER_BOWL, angle: 25 },
    { at: s + 0.25, pos: AT_POT, angle: 30 },
    { at: s + 0.38, pos: AT_POT, angle: 30 },
    { at: s + 0.62, pos: OVER_BOWL, angle: 25 },
  ] as const
}).flat()

const HAND_KEYS: readonly Key[] = [
  { at: 0, pos: BELLY, angle: 0 },
  { at: PADDLE, pos: BELLY, angle: 0 },
  ...scoopKeys,
  { at: SCOOP_END, pos: OVER_BOWL, angle: 25 },
  { at: GASSHO, pos: AT_CHEST, angle: 0 },
  { at: SPOON - 0.05, pos: AT_CHEST, angle: 0 },
  { at: BITE - 0.35, pos: AT_FLANK, angle: -30 },
  { at: BITE + 0.1, pos: AT_FLANK, angle: -30 },
  { at: EAT, pos: AT_MOUTH, angle: -40 },
  { at: EAT + 0.3, pos: AT_MOUTH, angle: -40 },
  { at: CHEEK, pos: AT_CHEEK, angle: 0 },
]

/* ───────── 男の子 ───────── */

type Mood = 'hungry' | 'glad' | 'wide' | 'chew'

function Face({ mood, chew }: { readonly mood: Mood; readonly chew: number }) {
  return (
    <>
      <circle cx="19" cy="57.4" r="2" fill="#ff9d9d" opacity="0.55" />
      {mood === 'hungry' ? (
        <>
          <path d="M16.6 49.8 l4.2 1.4" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="19.4" cy="53.3" r="1.15" fill={EYE} />
          <path d="M19.3 59.6 Q20.7 57.6 22.2 59.6" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
        </>
      ) : null}
      {mood === 'glad' ? (
        <>
          <path d="M17.8 54 Q19.4 51.8 21 54" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M19.2 57.6 Q20.8 60 22.6 57.6" fill="none" stroke={MOUTH} strokeWidth="1.3" strokeLinecap="round" />
        </>
      ) : null}
      {mood === 'wide' ? (
        <>
          <circle cx="19.4" cy="52.8" r="1.4" fill={EYE} />
          <circle cx="19.8" cy="52.4" r="0.45" fill="#ffffff" />
          <ellipse cx="21" cy="58.6" rx="3.2" ry="3.7" fill={MOUTH} />
          <ellipse cx="21" cy="60.4" rx="2" ry="1.4" fill="#ff8a8a" />
        </>
      ) : null}
      {mood === 'chew' ? (
        <>
          <path d="M17.8 54 Q19.4 51.8 21 54" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <ellipse cx="20.2" cy="57.8" rx={2.4 + chew * 0.5} ry={2 + chew * 0.4} fill={SKIN} stroke={MOUTH} strokeWidth="0.9" />
        </>
      ) : null}
    </>
  )
}

function Boy({ mood, chew, tilt, nearTarget, farTarget, breath }: { readonly mood: Mood; readonly chew: number; readonly tilt: number; readonly nearTarget: Pt; readonly farTarget: Pt; readonly breath: number }) {
  return (
    <>
      {/* むこうの うで: 体の うしろ */}
      <Arm target={farTarget} color={TUNIC_DARK} />
      {/* あぐらの あし: テーブルの下に のびる */}
      <rect x="11" y="84.5" width="29" height="9" rx="4.5" fill={PANTS_DARK} />
      <ellipse cx="40" cy="90.6" rx="3.6" ry="4.4" fill={SHOE} />
      {/* くび: みじかく、どうと あたまの すきま */}
      <rect x="12.4" y="59" width="5.2" height="8" rx="2.4" fill={SKIN_SHADE} />
      {/* どう: いき に合わせて 少し ふくらむ */}
      <Layer scaleX={1 + breath * 0.04} scaleY={1 + breath * 0.015} origin={[15.5, 90]}>
        <rect x="8.4" y="63" width="14.6" height="29" rx="6.8" fill={TUNIC} />
        <path d="M10.6 85 h10" stroke={TUNIC_DARK} strokeWidth="1.4" strokeLinecap="round" />
      </Layer>
      {/* てまえの うで */}
      <Arm target={nearTarget} color={TUNIC} />
      {/* あたま */}
      <Layer rotate={tilt} origin={NECK}>
        <circle cx="15" cy="54" r="8.2" fill={SKIN} />
        <circle cx="9.6" cy="55.4" r="1.7" fill={SKIN_SHADE} />
        <path d="M6.9 54.4 C5.6 44.5 12 42 17.5 43.4 C21.8 44.4 23.2 48 22.8 50.4 C19.5 47.6 14.5 47.8 11 51 C9.5 52 8 53.4 6.9 54.4 Z" fill={HAIR} />
        <Face mood={mood} chew={chew} />
      </Layer>
    </>
  )
}

/* ───────── うつわ・おひつ・テーブル ───────── */

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
      <path d="M-4 99 Q18 78 44 91 Q72 70 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="86" cy="18" rx="7" ry="3.2" />
        <ellipse cx="91" cy="16" rx="5" ry="3.2" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 100, 104].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** ひくい テーブル。あしは 男の子の あし の はんたいがわ に。 */
function Table({ t }: SceneProps) {
  const rise = span(t, 0.1, 0.6, backOut)
  return (
    <Layer scaleY={rise} origin={[66, 96]} opacity={span(t, 0.1, 0.3)}>
      <rect x="50" y="80" width="4.4" height="16" fill={WOOD_DARK} />
      <rect x="94" y="80" width="4.4" height="16" fill={WOOD_DARK} />
      <rect x="28" y={TABLE_Y} width="76" height="4.6" rx="2" fill={WOOD} />
      <rect x="28" y="79" width="76" height="1.6" rx="0.8" fill={WOOD_DARK} />
    </Layer>
  )
}

/** おひつ(ごはんの入れもの)。ゆげ が ふわふわ。 */
function Pot({ t }: SceneProps) {
  const pop = span(t, 0.3, 0.8, backOut)
  const steam = during(t, 1.4, SCOOP_END + 0.2, 0.4)
  return (
    <>
      <Layer scale={pop} origin={[30.5, TABLE_Y]}>
        <rect x="25" y="66" width="11" height="10" rx="2.2" fill={POT} />
        <rect x="25" y="68.6" width="11" height="1.1" fill={POT_DARK} />
        <rect x="25" y="72.4" width="11" height="1.1" fill={POT_DARK} />
        <ellipse cx="30.5" cy="66" rx="5.5" ry="1.7" fill={RICE} />
        <ellipse cx="30.5" cy="66" rx="5.5" ry="1.7" fill="none" stroke={POT_DARK} strokeWidth="0.8" />
      </Layer>
      {steam > 0 && pop >= 1 ? (
        <g opacity={steam * 0.8} fill="none" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round">
          {[0, 0.5, 1].map((off) => {
            const p = ((t * 0.8 + off) % 1)
            return <path key={off} d="M0 0 q-1.6 -2 0 -4 q1.6 -2 0 -4" opacity={Math.sin(p * Math.PI)} transform={`translate(${28 + off * 3 + wave(t, 1.6, off) * 0.8} ${64 - p * 9})`} />
          })}
        </g>
      ) : null}
    </>
  )
}

/** たかつき(あしの高い うつわ)。ふち の うしろ と まえ に 分けて、ごはんを はさむ。 */
function BowlBack() {
  return <ellipse cx={CX} cy={RIM_Y} rx="15" ry="3.2" fill={LACQUER_IN} />
}

function BowlFront({ pop }: { readonly pop: number }) {
  return (
    <Layer scale={pop} origin={[CX, TABLE_Y]}>
      <rect x={CX - 3} y="71.4" width="6" height="3.6" fill={LACQUER_DARK} />
      <path d={`M${CX - 7} ${TABLE_Y} Q${CX - 3} 74 ${CX - 3} 73.6 H${CX + 3} Q${CX + 3} 74 ${CX + 7} ${TABLE_Y} Z`} fill={LACQUER_DARK} />
      <path d={`M${CX - 15} ${RIM_Y} H${CX + 15} Q${CX + 15} 69 ${CX + 7} 71.6 H${CX - 7} Q${CX - 15} 69 ${CX - 15} ${RIM_Y} Z`} fill={LACQUER} />
      <path d={`M${CX - 13} 59.6 Q${CX - 12} 66 ${CX - 7} 68.6`} fill="none" stroke="#ff9a82" strokeWidth="1.1" strokeLinecap="round" />
      <path d={`M${CX - 15} ${RIM_Y} H${CX + 15}`} stroke={LACQUER_DARK} strokeWidth="1.2" />
    </Layer>
  )
}

/** ごはんの やま。ふち から もりあがる。 */
const GRAINS: readonly (readonly [number, number, number])[] = [
  [50, 46, 20], [57, 40, -25], [53, 33, 10], [60, 28, 30], [56, 20, -10], [46, 52, -15], [63, 48, 25], [68, 54, 5], [42, 55, 30], [57, 52, 0], [51, 25, 35], [60, 38, -35],
]

function Heap({ rise, dent }: { readonly rise: number; readonly dent: number }) {
  if (rise <= 0.01) return null
  const hump = 'M36 57 C37 46 46 36 51 22 Q53 14 55 10 Q57 14 59 22 C64 36 73 46 74 57 Z'
  return (
    <Layer scaleY={rise} scaleX={0.72 + 0.28 * rise} origin={[CX, RIM_Y + 1]}>
      <path d={hump} fill={RICE_SHADE} stroke={RICE_SHADE} strokeWidth="3" strokeLinejoin="round" transform="translate(1.6 0.5)" />
      <path d={hump} fill={RICE} stroke={RICE} strokeWidth="3" strokeLinejoin="round" />
      {GRAINS.map(([x, y, a], i) => (
        <ellipse key={i} cx={x} cy={y} rx="1.5" ry="0.75" fill={RICE_SHADE} transform={`rotate(${a} ${x} ${y})`} />
      ))}
      {dent > 0 ? <ellipse cx="41.2" cy="50.6" rx="3.4" ry="2.5" fill={RICE_SHADE} opacity={dent} /> : null}
    </Layer>
  )
}

/* ───────── もちもの・にぎやかし ───────── */

/** しゃもじ(かんじゅ): 手の ばしょ から、角度 angle の むきに のびる。 */
function Paddle({ hand, angle, lump }: { readonly hand: Pt; readonly angle: number; readonly lump: boolean }) {
  return (
    <Layer x={hand[0]} y={hand[1]} rotate={angle}>
      <rect x="-1" y="-0.8" width="7.2" height="1.6" rx="0.8" fill={WOOD_DARK} />
      <ellipse cx="7.6" cy="0" rx="3.2" ry="2.3" fill={WOOD} />
      {lump ? <ellipse cx="8.2" cy="-1.6" rx="2.3" ry="1.5" fill={RICE} /> : null}
    </Layer>
  )
}

/** スプーン: すくった ひとくち が のる。 */
function Spoon({ hand, angle, lump, pop }: { readonly hand: Pt; readonly angle: number; readonly lump: boolean; readonly pop: number }) {
  return (
    <Layer x={hand[0]} y={hand[1]} rotate={angle} scale={pop}>
      <rect x="-1" y="-0.7" width="5.4" height="1.4" rx="0.7" fill="#d6dbe2" />
      <ellipse cx="5.8" cy="0" rx="2.6" ry="2" fill="#e8ecf1" />
      {lump ? <ellipse cx="5.8" cy="-1.5" rx="2.4" ry="1.7" fill={RICE} /> : null}
    </Layer>
  )
}

/** おなかが「ぐう」。体の うしろ側(左)に ふるえる しるし。 */
function Rumble({ t }: SceneProps) {
  const show = during(t, HUNGRY, SCOOP - 0.1, 0.25)
  if (show <= 0) return null
  const shake = wave(t, 0.3) * 0.7
  return (
    <g opacity={show} fill="none" stroke="#7a8aa6" strokeWidth="1" strokeLinecap="round" transform={`translate(${shake} 0)`}>
      <path d="M6.6 73 q-2.4 2.6 0 5.2" />
      <path d="M4 71.4 q-3 4.2 0 8.4" />
    </g>
  )
}

function Hearts({ t }: SceneProps) {
  const show = during(t, EAT + 0.2, INK + 0.2, 0.25)
  if (show <= 0) return null
  return (
    <g opacity={show} fill={HEART}>
      {[0, 0.55].map((off, i) => {
        const p = (((t - EAT + off) % 1.1) + 1.1) % 1.1 / 1.1
        return <path key={off} d="M0 1.2 C-3 -1.4 -1.4 -3.6 0 -2 C1.4 -3.6 3 -1.4 0 1.2 Z" transform={`translate(${24 + i * 6 + Math.sin(p * 6) * 1.2} ${42 - p * 12}) scale(${1 + i * 0.3})`} opacity={Math.sin(p * Math.PI)} />
      })}
    </g>
  )
}

/** おちる ごはんの ひとかたまり(しゃもじ → うつわ)。 */
function DropLump({ t, pos }: { readonly t: number; readonly pos: Pt }) {
  const falling = Array.from({ length: SCOOP_TIMES }, (_, k) => span(t, SCOOP + SCOOP_LEN * k + 0.62, SCOOP + SCOOP_LEN * k + 0.8)).find((p) => p > 0 && p < 1)
  if (falling === undefined) return null
  return <ellipse cx={pos[0] + 8 + falling * 4} cy={pos[1] + 4 + falling * 6} rx={2.3 * (1 - falling * 0.6)} ry={1.5 * (1 - falling * 0.6)} fill={RICE} />
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 9)

  const appear = span(t, SIT, SIT + 0.5, backOut)
  const bowlPop = span(t, 0.25, 0.75, backOut)
  const hand = track(t, HAND_KEYS)

  // ごはんの やま: 3かいの ひとすくい ごとに ふくらむ。ひとくち たべると 少し へこむ
  const rise = Math.min(1, Array.from({ length: SCOOP_TIMES }, (_, k) => span(t, SCOOP + SCOOP_LEN * k + 0.7, SCOOP + SCOOP_LEN * k + 1.0, easeOut) / SCOOP_TIMES).reduce((a, b) => a + b, 0))
  const dent = span(t, BITE + 0.05, BITE + 0.3)

  const mood: Mood = t < SCOOP + SCOOP_LEN * 1.4 ? 'hungry' : t >= BITE + 0.35 && t < EAT + 0.05 ? 'wide' : t >= EAT + 0.05 && t < CHEEK + 0.3 ? 'chew' : 'glad'
  const chew = t >= EAT ? Math.abs(wave(t - EAT, 0.45)) : 0
  const tilt = t < SCOOP ? mix(t, HUNGRY, HUNGRY + 0.4, 0, 7) : t < GASSHO ? 2 : t < SPOON ? mix(t, GASSHO, GASSHO + 0.25, 2, 10) : mix(t, SPOON, BITE, 10, -4) + chew * 2

  const holdPaddle = t >= PADDLE && t < SCOOP_END + 0.15
  const holdSpoon = t >= SPOON && t < EAT + 0.4
  const spoonPop = Math.max(0, span(t, SPOON, SPOON + 0.2, backOut) * (1 - span(t, EAT + 0.15, EAT + 0.4)))

  // しゃもじに のる ごはん: おひつで すくって から、うつわの上で おとす まで
  const scoopPhase = Array.from({ length: SCOOP_TIMES }, (_, k) => t - (SCOOP + SCOOP_LEN * k)).find((u) => u >= 0 && u < SCOOP_LEN)
  const paddleLump = scoopPhase !== undefined && scoopPhase >= 0.3 && scoopPhase < 0.62 + 0.02
  const spoonLump = t >= BITE + 0.05 && t < EAT + 0.1

  // 手を あわせる: 両手が むねの前
  const clasp = t >= GASSHO && t < SPOON
  const nearTarget: Pt = hand.pos
  const farTarget: Pt = clasp ? [AT_CHEST[0] + 0.4, AT_CHEST[1] + 0.6] : [20, 80]
  const breath = wave(t, 2.4)

  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Table t={t} />
        <Pot t={t} />
        <Layer scale={bowlPop} origin={[CX, TABLE_Y]}>
          <BowlBack />
        </Layer>
        <Heap rise={rise} dent={dent} />
        <BowlFront pop={bowlPop} />
        <Layer scale={appear} origin={[15, 94]} opacity={appear}>
          <Boy mood={mood} chew={chew} tilt={tilt} nearTarget={nearTarget} farTarget={farTarget} breath={breath} />
          {holdPaddle ? <Paddle hand={reach(nearTarget).hand} angle={hand.angle} lump={paddleLump} /> : null}
          {holdSpoon ? <Spoon hand={reach(nearTarget).hand} angle={hand.angle} lump={spoonLump} pop={spoonPop} /> : null}
        </Layer>
        <DropLump t={t} pos={OVER_BOWL} />
        <Rumble t={t} />
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
    { at: 0, label: 'テーブルと からっぽの うつわ', sound: 'pop' },
    { at: SIT, label: '男の子が すわる' },
    { at: HUNGRY, label: 'おなかが ぐう。しょんぼり' },
    { at: SCOOP, label: 'しゃもじで ごはんを すくって、うつわに もる', sound: 'pop' },
    { at: SCOOP_END, label: 'ごはんが やまもり。にっこり' },
    { at: GASSHO, label: 'てを あわせて いただきます' },
    { at: BITE, label: 'ひとくち すくって、おおきな くちで ぱくっ', sound: 'pop' },
    { at: EAT, label: 'もぐもぐ おいしい' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '食 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
