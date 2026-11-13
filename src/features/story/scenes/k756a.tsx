/*
 * 番(ばん): たんぼに たねを、ひとつずつ じゅんばんに まく。
 *
 * ほね(画と絵の対応)
 *   1〜7画目(釆) … 手から ぱらぱらと まかれて ちらばる たね(空を とぶ たね の ひろがり)
 *   8〜12画目(田) … たんぼ。まわりの あぜ(8・9・12画目)と、まんなかの あぜ(10・11画目)
 *                    4つに わかれた たんぼに、たねを 1つずつ じゅんばんに まく
 *
 * ながれ
 *   たんぼが できる → 麦わらぼうしの子が あるいてきて、からっぽの たんぼを見て ちょっと こまる
 *   → ふくろから たねを つかんで、ぱらぱら と まく(左上 → 右上 → 左下 → 右下 の じゅんばん)
 *   → まいたところから、芽が ぴょこっと 出る → 子が にっこり 手をあげて よろこぶ
 *   → ほね が ひかって、絵が うすくなり、字「番」が のこる
 *
 * 子どもは ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。手が とどく場所を きめると、ひじ の位置は 長さから きまる。
 *   くび は みじかく、どう の まんなか の上。字と だいたい 重なるのは、たね が ちらばる 空の ひろがり。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type Ease, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '番'

const SKIN = '#f8cfa6'
const HAIR = '#5a3b2a'
const HAT = '#e8c66a'
const HAT_DARK = '#cfa94a'
const TUNIC = '#e8734a'
const TUNIC_DARK = '#c95a35'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const SOIL = '#b98a5e'
const SOIL_DARK = '#a37449'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const SEED = '#f3d27a'
const SEED_DARK = '#c9a23f'
const BAG = '#d9b98a'

/** くぎり の時間(秒) */
const FIELD_DONE = 0.9
const ARRIVE = 1.5
const SOW = 2.0
/** 1回 まくのに かかる時間と、ひとつぶ の とぶ時間 */
const THROW_GAP = 0.95
const FLIGHT = 0.65
const CHEER = 6.5
const INK = 7.6
const DONE = 10.4
const DURATION = 11

type Point = readonly [number, number]

/** 子どもの 足もとの 中心 x と、かた の位置 */
const CX = 13
const SHOULDER: Point = [CX + 1, 66]
/** うで の ほんの 1ほんぶん の長さ(かた→ひじ、ひじ→手) */
const ARM_PART = 8.5

/** まく手の 場所 */
const HAND_REST: Point = [CX + 1, 80]
const HAND_PICK: Point = [CX + 10, 78]
const HAND_WIND: Point = [CX - 2, 62]
const HAND_THROW: Point = [CX + 15, 57]
const HAND_CHEER: Point = [CX + 13, 52]

/** たんぼ の 4つの ます の まんなか(左上 → 右上 → 左下 → 右下) */
const CELLS: readonly Point[] = [
  [42, 72],
  [65, 72],
  [42, 89],
  [65, 89],
]
/** ひとつのますに おちる 3つぶ の ちらばり */
const SPREAD: readonly Point[] = [
  [-5, -3],
  [1, 3],
  [5, -3],
]

/** k回目に まきはじめる時間 / たねを はなす時間 */
const sowStart = (k: number) => SOW + k * THROW_GAP
const release = (k: number) => sowStart(k) + 0.68

/** 手の いどう: (時間, 場所) の きっかけを じゅんに なめらかに つなぐ */
function handPath(t: number): Point {
  const keys: ReadonlyArray<readonly [number, Point]> = [
    [0, HAND_REST],
    ...CELLS.flatMap((_, k): ReadonlyArray<readonly [number, Point]> => [
      [sowStart(k) + 0.25, HAND_PICK],
      [sowStart(k) + 0.5, HAND_WIND],
      [release(k), HAND_THROW],
    ]),
    [CHEER - 0.4, HAND_REST],
    [CHEER + 0.2, HAND_CHEER],
  ]
  const after = keys.findIndex(([time]) => time > t)
  if (after === -1) return keys[keys.length - 1][1]
  if (after === 0) return keys[0][1]
  const [t0, p0] = keys[after - 1]
  const [t1, p1] = keys[after]
  const ease: Ease = easeInOut
  const a = span(t, t0, t1, ease)
  return [p0[0] + (p1[0] - p0[0]) * a, p0[1] + (p1[1] - p0[1]) * a]
}

/** かた と 手の場所から、ひじ の場所を きめる(ひじ は 下がわ へ まがる) */
function armJoints(shoulder: Point, target: Point): { readonly elbow: Point; readonly hand: Point } {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const d = Math.hypot(dx, dy) || 1
  const reach = Math.min(d, ARM_PART * 2 * 0.999)
  const ux = dx / d
  const uy = dy / d
  const hand: Point = [shoulder[0] + ux * reach, shoulder[1] + uy * reach]
  const h = Math.sqrt(Math.max(ARM_PART ** 2 - (reach / 2) ** 2, 0))
  const mid: Point = [shoulder[0] + (ux * reach) / 2, shoulder[1] + (uy * reach) / 2]
  const a: Point = [mid[0] - uy * h, mid[1] + ux * h]
  const b: Point = [mid[0] + uy * h, mid[1] - ux * h]
  return { elbow: a[1] >= b[1] ? a : b, hand }
}

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[96, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="95.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 96 13)`} />
        ))}
      </Layer>
      <circle cx="96" cy="13" r={6.2 * sun} fill={SUN} />
      {/* とおくの おか と、ゆっくり ながれる 雲(おくゆき を出す) */}
      <path d="M-4 99 Q18 78 44 91 Q72 70 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="-2" cy="20" rx="7" ry="3.2" />
        <ellipse cx="3" cy="18" rx="5" ry="3.2" />
        <ellipse cx="60" cy="9" rx="6" ry="2.6" />
        <ellipse cx="64.5" cy="7.6" rx="4.4" ry="2.8" />
      </g>
      <ellipse cx="54.5" cy="99" rx="51" ry="4.4" fill={GRASS} />
      {[6, 24, 84, 100].map((x) => (
        <path key={x} d={`M${x} 98.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** たんぼ。つちが ひろがって、あぜ(田の 4つの しきり)が のびる。 */
function Field({ t }: SceneProps) {
  const soil = span(t, 0.1, 0.6, backOut)
  const ridge = span(t, 0.4, FIELD_DONE, easeOut)
  return (
    <>
      <Layer scaleX={soil} scaleY={soil} origin={[54, 81]}>
        <rect x="31" y="64" width="46" height="34" rx="2" fill={SOIL} />
        <path d="M33 70 h6 M58 69 h8 M36 86 h7 M60 92 h9 M47 75 h4 M70 84 h4" stroke={SOIL_DARK} strokeWidth="1.2" strokeLinecap="round" />
      </Layer>
      <Layer opacity={ridge}>
        {[8, 9, 10, 11, 12].map((n) => (
          <Bone key={n} char={CHAR} n={n} color={BARK} width={3.2} to={ridge} />
        ))}
      </Layer>
    </>
  )
}

type Mood = 'worried' | 'focus' | 'happy'

type ChildProps = {
  readonly mood: Mood
  readonly step: number
  readonly nearHand: Point
  readonly bob: number
}

/** かた から出て ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。 */
function Arm({ shoulder, hand, color }: { readonly shoulder: Point; readonly hand: Point; readonly color: string }) {
  const joints = armJoints(shoulder, hand)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${joints.elbow[0]} ${joints.elbow[1]} L${joints.hand[0]} ${joints.hand[1]}`} fill="none" stroke={color} strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={joints.hand[0]} cy={joints.hand[1]} r="2.9" fill={SKIN} />
    </>
  )
}

/** 麦わらぼうしの子。右むき。ふくろ を もつ手(むこう)と、たねを まく手(てまえ)。 */
function Child({ mood, step, nearHand, bob }: ChildProps) {
  const farHand: Point = [CX + 9, 79]
  return (
    <Layer y={bob}>
      <ellipse cx={CX + 2} cy="96.6" rx="10" ry="2.2" fill="#000000" opacity="0.12" />
      {/* むこうの うで と ふくろ */}
      <Arm shoulder={[CX + 1, 66]} hand={farHand} color={TUNIC_DARK} />
      <g>
        <path d={`M${CX + 6.5} 76 Q${CX + 4} 87 ${CX + 11} 88.5 Q${CX + 19} 88 ${CX + 17} 76 Z`} fill={BAG} />
        <path d={`M${CX + 6.2} 76.4 Q${CX + 11.8} 73.2 ${CX + 17.2} 76.4`} fill="none" stroke="#a58452" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx={CX + 11.5} cy="82.4" r="1.4" fill={SEED_DARK} />
      </g>
      {/* あし(あるくとき かわりばんこに ふる) */}
      <Layer rotate={step * 16} origin={[CX + 2.5, 82]}>
        <rect x={CX + 0.6} y="82" width="4.6" height="12" rx="2.2" fill={PANTS_DARK} />
        <ellipse cx={CX + 4} cy="94.6" rx="4.4" ry="2.2" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 16} origin={[CX + 2.5, 82]}>
        <rect x={CX - 4.4} y="82" width="4.6" height="12" rx="2.2" fill={PANTS} />
        <ellipse cx={CX - 1.8} cy="94.6" rx="4.4" ry="2.2" fill={SHOE} />
      </Layer>
      {/* くび(みじかく) と どう */}
      <rect x={CX - 0.4} y="59.4" width="4.4" height="6" rx="2" fill="#eeb98a" />
      <rect x={CX - 5.4} y="62" width="14" height="22" rx="5.6" fill={TUNIC} />
      <path d={`M${CX - 3.4} 77 h10`} stroke={TUNIC_DARK} strokeWidth="1.5" strokeLinecap="round" />
      {/* てまえの うで(たねを まく) */}
      <Arm shoulder={[CX + 1, 66]} hand={nearHand} color={TUNIC} />
      {/* あたま と ぼうし */}
      <circle cx={CX + 2} cy="54" r="7.6" fill={SKIN} />
      <path d={`M${CX - 5.4} 52 Q${CX - 7.4} 58 ${CX - 4.6} 61 Q${CX - 2} 57 ${CX - 2.4} 52 Z`} fill={HAIR} />
      <circle cx={CX + 4} cy="57.8" r="1.7" fill="#ff9d9d" opacity="0.55" />
      {mood === 'worried' && (
        <>
          <path d={`M${CX + 3.2} 50.6 l4.2 -1`} stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <circle cx={CX + 5.6} cy="54" r="1.1" fill="#2b2b2b" />
          <path d={`M${CX + 5} 59.6 Q${CX + 6.8} 58.2 ${CX + 8.4} 59.6`} fill="none" stroke="#b9483f" strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'focus' && (
        <>
          <circle cx={CX + 5.8} cy="54" r="1.15" fill="#2b2b2b" />
          <path d={`M${CX + 5} 59 h3.4`} stroke="#b9483f" strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d={`M${CX + 4.4} 54.8 Q${CX + 6} 52.6 ${CX + 7.6} 54.8`} fill="none" stroke="#2b2b2b" strokeWidth="1.2" strokeLinecap="round" />
          <path d={`M${CX + 4.6} 58 Q${CX + 6.8} 61.6 ${CX + 9} 58 Z`} fill="#b9483f" />
        </>
      )}
      <ellipse cx={CX + 2} cy="48.4" rx="11" ry="2.4" fill={HAT} />
      <path d={`M${CX - 4} 48.4 Q${CX - 3.6} 40.6 ${CX + 2} 40.6 Q${CX + 7.6} 40.6 ${CX + 8} 48.4 Z`} fill={HAT} />
      <path d={`M${CX - 3.6} 46.2 H${CX + 7.8}`} stroke={HAT_DARK} strokeWidth="1.6" />
    </Layer>
  )
}

/** ふくろから つかんだ たね(手のなかに 3つぶ)。 */
function HandSeeds({ hand }: { readonly hand: Point }) {
  return (
    <g>
      {SPREAD.map(([ox, oy], j) => (
        <ellipse key={j} cx={hand[0] + ox * 0.3 + 0.8} cy={hand[1] + oy * 0.3 - 1.6} rx="0.9" ry="0.6" fill={SEED} stroke={SEED_DARK} strokeWidth="0.3" />
      ))}
    </g>
  )
}

/** 空を とぶ たね。山なり に とんで、ますに おちる。おちたあとは つちに のこる。 */
function SeedsFlying({ t }: SceneProps) {
  return (
    <>
      {CELLS.flatMap((cell, k) =>
        SPREAD.map(([ox, oy], j) => {
          const start = release(k) + j * 0.06
          const p = span(t, start, start + FLIGHT)
          if (p <= 0) return null
          const x = HAND_THROW[0] + (cell[0] + ox - HAND_THROW[0]) * easeOut(p)
          const flat = HAND_THROW[1] + (cell[1] + oy - HAND_THROW[1]) * p
          const y = flat - 20 * 4 * p * (1 - p)
          return <ellipse key={`${k}-${j}`} cx={x} cy={y} rx="1.5" ry="1" fill={SEED} stroke={SEED_DARK} strokeWidth="0.4" transform={`rotate(${p * 500} ${x} ${y})`} />
        }),
      )}
    </>
  )
}

/** たねが おちた ところから 出る 芽。ぽん と出て、かぜで ゆれる。 */
function Sprouts({ t }: SceneProps) {
  return (
    <>
      {CELLS.flatMap((cell, k) =>
        SPREAD.map(([ox, oy], j) => {
          const land = release(k) + j * 0.06 + FLIGHT
          const grow = Math.max(0, span(t, land + 0.15 + j * 0.07, land + 0.65 + j * 0.07, backOut))
          if (grow <= 0) return null
          const sway = wave(t, 2.2, j * 0.4 + k) * 4
          return (
            <Layer key={`${k}-${j}`} x={cell[0] + ox} y={cell[1] + oy} scale={grow} rotate={sway} origin={[0, 0]}>
              <path d="M0 0 V-4.4" stroke={LEAF_DARK} strokeWidth="1" strokeLinecap="round" />
              <path d="M0 -3.4 Q-4.2 -4.4 -4.6 -7 Q-1 -7 0 -3.4 Z" fill={LEAF} />
              <path d="M0 -4 Q3.8 -4.6 4.6 -7.4 Q1 -7.8 0 -4 Z" fill={LEAF_LIGHT} />
            </Layer>
          )
        }),
      )}
      {/* まく前の つちに おちた たね(芽が 出るまで 見える) */}
      {CELLS.flatMap((cell, k) =>
        SPREAD.map(([ox, oy], j) => {
          const land = release(k) + j * 0.06 + FLIGHT
          const visible = span(t, land, land + 0.01) * (1 - span(t, land + 0.15 + j * 0.07, land + 0.4 + j * 0.07))
          if (visible <= 0) return null
          return <ellipse key={`s${k}-${j}`} cx={cell[0] + ox} cy={cell[1] + oy} rx="1.5" ry="1" fill={SEED} stroke={SEED_DARK} strokeWidth="0.4" opacity={visible} />
        }),
      )}
    </>
  )
}

/** たね が ぱらぱら と 手から はなれる ところの 小さな きらり。 */
function Puffs({ t }: SceneProps) {
  return (
    <>
      {CELLS.map((_, k) => {
        const show = during(t, release(k) - 0.05, release(k) + 0.35, 0.1)
        if (show <= 0) return null
        const p = span(t, release(k) - 0.05, release(k) + 0.35)
        return (
          <g key={k} opacity={show} stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round">
            <path d={`M${HAND_THROW[0] + 3 + p * 2} ${HAND_THROW[1] - 3 - p * 2} l2 -1.4`} />
            <path d={`M${HAND_THROW[0] + 4 + p * 2} ${HAND_THROW[1] + p} l2.6 0.2`} />
          </g>
        )
      })}
    </>
  )
}

/** こまった とき の あせ(あたまの よこ)。 */
function Sweat({ t }: SceneProps) {
  const show = during(t, ARRIVE + 0.1, SOW + 0.1, 0.2)
  if (show <= 0) return null
  const p = ((t - ARRIVE) % 0.8) / 0.8
  return <path d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" opacity={show * (1 - p)} transform={`translate(${CX + 12} ${46 + p * 6})`} />
}

/** よろこびの きらきら(子の まわり)。 */
function Cheer({ t }: SceneProps) {
  const show = during(t, CHEER + 0.3, INK - 0.1, 0.25)
  if (show <= 0) return null
  return (
    <g opacity={show} fill="#ffc233">
      {[0, 1, 2].map((i) => {
        const p = ((t - CHEER + i * 0.5) % 1.5) / 1.5
        return <circle key={i} cx={CX + 4 + i * 7 - 3} cy={42 - p * 8 + i * 2} r={1 + (1 - p)} opacity={1 - p} />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 12)

  // あるいてくる: 左から たんぼの そばまで。あしを ふって、体が 上下する
  const walkEnd = ARRIVE
  const walkX = mix(t, 0.5, walkEnd, -26, 0, easeOut)
  const walking = 1 - span(t, walkEnd - 0.3, walkEnd)
  const stride = t < 0.5 ? 0 : Math.sin((t - 0.5) * Math.PI * 2 * 1.7) * walking
  const bob = -Math.abs(stride) * 1.2
  const mood: Mood = t < SOW ? 'worried' : t < CHEER ? 'focus' : 'happy'
  const hand = handPath(t)
  const joints = armJoints(SHOULDER, hand)
  // たね を つかんで から はなす まで、手の なかに たね が ある
  const holding = CELLS.some((_, k) => t >= sowStart(k) + 0.3 && t < release(k))
  const cheerWave = t >= CHEER + 0.2 ? wave(t, 0.6) * 3 : 0
  const nearHand: Point = [hand[0] + cheerWave, hand[1]]

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Field t={t} />
        <Layer opacity={span(t, 0.45, 0.7)}>
          <Layer x={walkX}>
            <Child mood={mood} step={stride} nearHand={nearHand} bob={bob} />
            {holding && <HandSeeds hand={joints.hand} />}
            <Sweat t={t} />
          </Layer>
        </Layer>
        <Puffs t={t} />
        <SeedsFlying t={t} />
        <Sprouts t={t} />
        <Cheer t={t} />
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
    { at: 0, label: 'たんぼが できる', sound: 'pop' },
    { at: 0.5, label: '麦わらぼうしの子が あるいてくる' },
    { at: ARRIVE, label: 'からっぽの たんぼを見て、ちょっと こまる' },
    { at: SOW, label: 'ふくろから たねを つかんで、ぱらぱら まく', sound: 'pop' },
    { at: sowStart(2), label: '左上、右上、左下… じゅんばんに まく' },
    { at: CHEER, label: '芽が 出て、子が よろこぶ', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '番 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
