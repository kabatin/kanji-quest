/*
 * 番(ばん): たんぼに たねを、ひとつずつ じゅんばんに まく。(共通部品 sceneFigures で 書きなおした)
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
 * 子は Person(麦わらぼうし・右むき)。あるきは walk()。たねを まく手は { to } で 場所を きめ、
 * たねの ふくろは むこうの 手に held で もたせる。字と だいたい 重なるのは、たね が ちらばる 空の ひろがり。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type Ease, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, HANG_ARM, LOOKS, mixLimb, Person, personRig, Sweat, walk } from '../sceneFigures'

const CHAR = '番'

const BARK = '#8c5b3c'
const SOIL = '#b98a5e'
const SOIL_DARK = '#a37449'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
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

/** 子どもの 足もとの 中心 x、立つ 地面、背の高さ、見た目 */
const CX = 13
const FLOOR = 96
const KID_HEIGHT = 52
const KID_LOOK = { ...LOOKS.boy, hat: 'straw', top: '#e8734a', bottom: '#3e5c86' } as const

/** まく手の 場所 */
const HAND_REST: Point = [CX + 1, 80]
const HAND_PICK: Point = [CX + 10, 78]
const HAND_WIND: Point = [CX - 2, 62]
const HAND_THROW: Point = [CX + 15, 57]
const HAND_CHEER: Point = [CX + 13, 52]
/** ふくろを もつ むこうの 手 */
const FAR_HAND: Point = [CX + 9, 79]

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

/** たねの ふくろ。むこうの 手が 口を にぎる(hand は その 手の 場所) */
function SeedBag({ hand }: { readonly hand: Point }) {
  const [x, y] = hand
  return (
    <g>
      <path d={`M${x - 2.5} ${y - 3} Q${x - 5} ${y + 8} ${x + 2} ${y + 9.5} Q${x + 10} ${y + 9} ${x + 8} ${y - 3} Z`} fill={BAG} />
      <path d={`M${x - 2.8} ${y - 2.6} Q${x + 2.8} ${y - 5.8} ${x + 8.2} ${y - 2.6}`} fill="none" stroke="#a58452" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={x + 2.5} cy={y + 3.4} r="1.4" fill={SEED_DARK} />
    </g>
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

  // あるいてくる: 左から たんぼの そばまで
  const w = walk(t, { from: CX - 26 + 2, to: CX + 2, start: 0.5, end: ARRIVE, build: 'child', height: KID_HEIGHT })
  const shift = w.x - (CX + 2)
  const mood = t < SOW ? 'worried' : t < CHEER ? 'normal' : 'joy'
  // たね を つかんで から はなす まで、手の なかに たね が ある
  const holding = CELLS.some((_, k) => t >= sowStart(k) + 0.3 && t < release(k))
  const cheerWave = t >= CHEER + 0.2 ? wave(t, 0.6) * 3 : 0
  const path = handPath(t)
  const reach = span(t, ARRIVE - 0.3, ARRIVE)
  const nearTarget: Point = [path[0] + shift + cheerWave, path[1]]
  const farTarget: Point = [FAR_HAND[0] + shift, FAR_HAND[1]]
  const place = { ...w, y: FLOOR, facing: 'right' as const }
  const pose = {
    ...w.pose,
    leftArm: mixLimb(w.pose.leftArm ?? HANG_ARM, { to: nearTarget }, reach),
    rightArm: mixLimb(w.pose.rightArm ?? HANG_ARM, { to: farTarget }, reach),
  }
  const rig = personRig({ ...place, pose })
  const head = rig.world.head
  const nearHand = rig.world.arms.left.end
  const farHand = rig.world.arms.right.end

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[96, 13]} tufts={[6, 24, 84, 100]} />
        <Field t={t} />
        <Layer opacity={span(t, 0.45, 0.7)}>
          <Person {...place} pose={pose} look={KID_LOOK} face={mood} held={<SeedBag hand={farHand} />} />
          {holding && <HandSeeds hand={nearHand} />}
          <Sweat t={t} x={head[0] + 8} y={head[1] - 4} show={during(t, ARRIVE + 0.1, SOW + 0.1, 0.2)} dir={1} />
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
