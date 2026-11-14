/*
 * 野(の): さと の まわりに ひろがる 野原。右は 音(おと)の パーツ。
 *
 * ほね(画と絵の対応)
 *   1〜4画目   … 里の 上: たんぼ(田)の あぜみち。まわりの 3本 と まんなかの 1本
 *   5画目(丨)  … たんぼを 二つに わける あぜ。その下は、水が 土(つち)の畑に ながれる みぞ
 *   6・7画目   … 里の 下: 畑の 土の うね(つち)
 *   8画目(一)  … 野原に 立つ かかしの 麦わらぼうし の ひさし
 *   10画目(一) … かかしの りょううで(よこぼう)
 *   11画目(丨)  … かかしの 立ち木(ぼう)
 *   9画目      … かかしの かお の まえ(ひさし の かげ。絵には ほぼ出さない)
 *
 * ながれ
 *   たんぼと 畑の ある さと が できる → 子どもが 歩いてきて、たんぼの なえを ながめて にっこり(里)
 *   → もっと 見たくて さと を出て 右へ 歩く。道の先に 野原が ひろがっていく(野原)
 *   → かかしが 立っていて、上の 小鳥が うたう。子どもは「あっ!」と おどろいて、
 *      うたに 合わせて ばんざい(音)
 *   → ほね が ひかって、絵が うすくなり、字「野」が のこる
 *
 * 子どもは 共通部品 Person(あるきは walk()。字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。ばんざい は うでを ま上に近く あげる。
 *   かかしは、ぼう と よこぼう に ふく を かけて 立てた ほんものの かかし。
 */
import { backOut, during, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Bird, LOOKS, mixLimb, Person, personRig, Sun, walk, type Expression, type Limb, type PersonPose } from '../sceneFigures'

const CHAR = '野'

const SKIN = '#f8cfa6'
const MOUTH = '#b9483f'
/** 子ども: おれんじ いろの 服・青い ズボン */
const KID_LOOK = { ...LOOKS.boy, top: '#f2a64a', bottom: '#4d6aa0' } as const
const KID_HEIGHT = 38
const BANK = '#a8754f'
const WOOD = '#8c5b3c'
const SOIL = '#c79a6e'
const FURROW = '#9a6a45'
const WATER = '#9ad3f4'
const RICE = '#55b86e'
const RICE_DARK = '#3f9c59'
const GRASS = '#c5e8a9'
const MEADOW = '#a8dd86'
const HILL = '#d6efbd'
const LEAF = '#55b86e'
const STRAW = '#e8c35a'
const STRAW_DARK = '#d1a63a'
const SHIRT = '#d8564f'

/** くぎり の時間(秒) */
const WALK_IN = 0.9
const STOP_AT = 2.5
const LOOK = 3.3
const WALK_OUT = 5.0
const SURPRISE = 4.7
const SING = 5.4
const CHEER = 5.7
const INK = 6.6
const DONE = 9.0
const DURATION = 9.6

/** ゆうびん: 子どもの 足もと の 高さ と、とまる 場所 */
const GROUND_Y = 96
/** かかしの ぼう の x(11画目) */
const POST_X = 74.8
/** 小鳥が とまる、ぼうし の ひさし の 右はし */
const PERCH: readonly [number, number] = [85.5, 10.6]

/** なえ(いね の 子): 3本の は。 */
function Sprout({ x, y, size = 1, color = RICE }: { readonly x: number; readonly y: number; readonly size?: number; readonly color?: string }) {
  const s = size
  return (
    <path
      d={`M${x - 1.6 * s} ${y} Q${x - 2.4 * s} ${y - 2.6 * s} ${x - 3.2 * s} ${y - 3.8 * s} M${x} ${y} Q${x + 0.2 * s} ${y - 3 * s} ${x} ${y - 4.8 * s} M${x + 1.6 * s} ${y} Q${x + 2.4 * s} ${y - 2.6 * s} ${x + 3.2 * s} ${y - 3.8 * s}`}
      fill="none"
      stroke={color}
      strokeWidth={1.15 * s}
      strokeLinecap="round"
    />
  )
}

/** そら・お日さま・とおくの おか。野原が ひろがると おかも 出てくる。 */
function Backdrop({ t }: SceneProps) {
  const hill = span(t, LOOK - 0.1, WALK_OUT - 0.2, easeOut)
  return (
    <>
      <Layer scaleY={hill} origin={[80, 96]}>
        <path d="M46 96 Q64 74 84 84 Q98 74 114 88 V97 H46 Z" fill={HILL} />
      </Layer>
    </>
  )
}

/** 地面: はじめは さと の まわりだけ。野原が、右へ ひろがる。 */
function Ground({ t }: SceneProps) {
  const spread = span(t, LOOK, WALK_OUT, easeOut)
  return (
    <>
      <ellipse cx="30" cy="98" rx="38" ry="5.4" fill={GRASS} />
      <Layer scaleX={spread} origin={[46, 96]}>
        <ellipse cx="80" cy="97.4" rx="40" ry="6.4" fill={MEADOW} />
      </Layer>
    </>
  )
}

/** 野原の くさ と 花。ひろがる 道すじ に そって、左から じゅんばんに ぽこぽこ 出る。 */
const TUFTS: readonly (readonly [number, number])[] = [
  [55, 96.5], [60, 94], [64, 97.4], [68, 94.6], [82, 96.8], [88, 94.2], [93, 97.2], [98, 94.8], [103, 97.2], [107, 94.4], [78, 98.2], [71, 98.2],
]
const FLOWERS: readonly (readonly [number, number, string])[] = [
  [58, 93, '#f07f9e'], [66, 96, '#ffffff'], [84, 93.6, '#ffd24a'], [91, 96.4, '#f07f9e'], [96, 92.6, '#ffffff'], [101, 95.6, '#ffd24a'], [75, 97.4, '#f07f9e'],
]

function Meadow({ t }: SceneProps) {
  const appear = (x: number) => span(t, LOOK + ((x - 50) / 60) * 1.7, LOOK + ((x - 50) / 60) * 1.7 + 0.4, backOut)
  return (
    <>
      {TUFTS.map(([x, y]) => (
        <Layer key={`${x}-${y}`} scale={appear(x)} origin={[x, y]}>
          <path d={`M${x} ${y} l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
        </Layer>
      ))}
      {FLOWERS.map(([x, y, color]) => (
        <Layer key={`f${x}`} scale={appear(x)} origin={[x, y]}>
          <path d={`M${x} ${y} v3`} stroke={RICE_DARK} strokeWidth="0.7" strokeLinecap="round" />
          <circle cx={x} cy={y} r="1.5" fill={color} />
          <circle cx={x} cy={y} r="0.55" fill="#f2b632" />
        </Layer>
      ))}
    </>
  )
}

/** 里(さと)の 上: たんぼ。あぜみち で 4つに わかれた 水田に、なえが のびる。 */
function Paddy({ t }: SceneProps) {
  const water = span(t, 0.1, 0.6, easeOut)
  const bank = (a: number, b: number) => span(t, a, b, easeOut)
  const grow = (a: number) => span(t, a, a + 0.5, backOut)
  const plots: readonly (readonly [number, number, number])[] = [
    [20, 27.5, 0.8],
    [27, 27.5, 0.9],
    [38, 25.5, 1.0],
    [45, 25.5, 1.1],
    [20, 42, 1.2],
    [27, 42, 1.3],
    [38, 40, 1.4],
    [45, 40, 1.5],
  ]
  return (
    <>
      <Layer opacity={water}>
        <rect x="14.5" y="17.6" width="36" height="31" rx="3" fill={WATER} />
      </Layer>
      {plots.map(([x, y, at]) => (
        <Layer key={`${x}-${y}`} scale={grow(at)} origin={[x, y]}>
          <Sprout x={x} y={y} size={1.15} />
        </Layer>
      ))}
      <Bone char={CHAR} n={1} color={BANK} width={3.6} to={bank(0.1, 0.4)} />
      <Bone char={CHAR} n={2} color={BANK} width={3.6} to={bank(0.3, 0.6)} />
      <Bone char={CHAR} n={3} color={BANK} width={3.2} to={bank(0.5, 0.7)} />
      <Bone char={CHAR} n={4} color={BANK} width={3.2} to={bank(0.6, 0.8)} />
      <Bone char={CHAR} n={5} color={BANK} width={3.2} to={bank(0.7, 0.9) * 0.46} />
    </>
  )
}

/** 里(さと)の 下: 土の 畑。水が みぞ を ながれて きて、うね の 上に なえが 出る。 */
function Patch({ t }: SceneProps) {
  const knoll = span(t, 0.0, 0.5, easeOut)
  const patch = span(t, 0.5, 1.0, easeOut)
  const furrow6 = span(t, 0.8, 1.1, easeOut)
  const furrow7 = span(t, 0.95, 1.25, easeOut)
  const channel = span(t, 1.0, 1.5)
  const grow = (a: number) => span(t, a, a + 0.5, backOut)
  return (
    <>
      {/* さと の おか: たんぼと 畑が のっている ひとつづきの 土地 */}
      <Layer scaleY={knoll} origin={[30, 94]}>
        <path d="M6 94 L6 26 Q6 11 20 11 L44 11 Q57 11 57 26 L57 94 Z" fill="#e2f2cf" />
      </Layer>
      <Layer scaleY={patch} origin={[30, 90]}>
        <path d="M9 56.5 Q30 53 52 55.5 L53 88.5 Q30 93 8 89 Z" fill={SOIL} />
      </Layer>
      <Bone char={CHAR} n={6} color={FURROW} width={3.4} to={furrow6} />
      <Bone char={CHAR} n={7} color={FURROW} width={3.4} to={furrow7} />
      {/* たんぼから 畑へ ながれる 水の みぞ(5画目の 下はんぶん) */}
      <Bone char={CHAR} n={5} color={WATER} width={2.4} from={0.46} to={0.46 + channel * 0.54} />
      <Layer scale={grow(1.5)} origin={[22, 59.4]}>
        <Sprout x={22} y={59.4} size={0.95} color={RICE_DARK} />
      </Layer>
      <Layer scale={grow(1.65)} origin={[44, 56.6]}>
        <Sprout x={44} y={56.6} size={0.95} color={RICE_DARK} />
      </Layer>
      <Layer scale={grow(1.8)} origin={[20, 77.6]}>
        <Sprout x={20} y={77.6} size={0.95} color={RICE_DARK} />
      </Layer>
      <Layer scale={grow(1.95)} origin={[42, 72.4]}>
        <Sprout x={42} y={72.4} size={0.95} color={RICE_DARK} />
      </Layer>
    </>
  )
}

/** 野原に 立つ かかし。ぼう(11画目)に よこぼう(10画目)、麦わらぼうし(8画目)。 */
function Scarecrow({ t }: SceneProps) {
  const rise = span(t, LOOK + 0.7, WALK_OUT - 0.2, backOut)
  if (rise <= 0) return null
  const sway = wave(t, 2.6) * 1.2
  return (
    <Layer scaleY={rise} scaleX={0.7 + 0.3 * Math.min(rise, 1)} origin={[POST_X, 92]}>
      {/* ぼう: 上は くび、下は 地面に さす */}
      <rect x={POST_X - 1.6} y="30" width="3.2" height="18" fill={WOOD} />
      <Bone char={CHAR} n={11} color={WOOD} width={3.4} to={0.84} />
      {/* ふく: よこぼうの そで と どう */}
      <Bone char={CHAR} n={10} color={SHIRT} width={5.4} to={0.72} />
      <rect x={POST_X - 6.2} y="43" width="12.4" height="19" rx="3.6" fill={SHIRT} />
      <path d={`M${POST_X - 4} 55 h8`} stroke="#b8423c" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="88.4" cy="46.4" r="2.8" fill={STRAW} />
      <circle cx="54.6" cy="43.4" r="2.8" fill={STRAW} />
      {/* かお と ぼうし(ひさし は 8画目) */}
      <circle cx={POST_X - 0.4} cy="27" r="6.4" fill={SKIN} />
      <circle cx={POST_X - 2.6} cy="26.4" r="0.95" fill="#2b2b2b" />
      <circle cx={POST_X + 2.2} cy="26.4" r="0.95" fill="#2b2b2b" />
      <path d={`M${POST_X - 2} 29.6 Q${POST_X - 0.4} 31.2 ${POST_X + 1.4} 29.6`} fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
      <Layer rotate={sway} origin={[POST_X, 20]}>
        <path d="M65.5 15 Q66 2.8 74.4 3.2 Q83.6 3.6 83.6 15 Z" fill={STRAW} />
        <path d="M66 11 H83" stroke={SHIRT} strokeWidth="1.8" strokeLinecap="round" />
        <Bone char={CHAR} n={8} color={STRAW_DARK} width={3.4} to={0.62} />
      </Layer>
    </Layer>
  )
}


/** 小鳥の うたう おんぷ。右上へ ふわっと のぼる。 */
function Notes({ t }: SceneProps) {
  const show = during(t, SING + 0.5, INK + 0.2, 0.25)
  if (show <= 0) return null
  return (
    <g opacity={show} fill="#f07f9e" stroke="#f07f9e">
      {[0, 0.55, 1.1].map((offset) => {
        const p = ((t + offset) % 1.65) / 1.65
        const x = 90 + p * 12
        const y = 8 - p * 6
        return (
          <g key={offset} opacity={Math.sin(p * Math.PI)}>
            <path d={`M${x + 1.1} ${y} v-4.4 l2.4 -0.8`} fill="none" strokeWidth="0.8" strokeLinecap="round" />
            <ellipse cx={x} cy={y} rx="1.2" ry="0.9" stroke="none" />
          </g>
        )
      })}
    </g>
  )
}

/** 「あっ!」の しるし。あたまの 上に ぴょんと 出る。 */
function Surprise({ t, x, y }: SceneProps & { readonly x: number; readonly y: number }) {
  const show = during(t, SURPRISE, SING + 0.1, 0.12)
  if (show <= 0) return null
  const pop = span(t, SURPRISE, SURPRISE + 0.25, backOut)
  return (
    <Layer x={x} y={y} scale={pop} origin={[0, 0]} opacity={show}>
      <path d="M-1.3 -9 Q0 -10 1.3 -9 L0.8 -3.2 Q0 -2.6 -0.8 -3.2 Z" fill="#e8534a" />
      <circle cx="0" cy="-0.9" r="1.2" fill="#e8534a" />
    </Layer>
  )
}


function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 11)

  // あるく: さとに 入り、たんぼを ながめて、野原へ むかう(2回に わけて walk)
  const plan = { build: 'child', height: KID_HEIGHT, step: KID_HEIGHT * 0.34 } as const
  const w = t < LOOK ? walk(t, { from: -14, to: 16, start: WALK_IN, end: STOP_AT, ...plan }) : walk(t, { from: 16, to: 50, start: LOOK, end: WALK_OUT, ...plan })
  const hop = t >= CHEER ? Math.abs(Math.sin(span(t, CHEER, CHEER + 1.1) * Math.PI * 2)) * 4 * (1 - span(t, CHEER + 0.9, CHEER + 1.1)) : 0

  const face: Expression = t < STOP_AT ? 'normal' : t < SURPRISE ? 'smile' : t < CHEER ? 'surprised' : 'joy'
  // たんぼを 見あげて うなずく(立ち止まっている間)
  const lookUp = during(t, STOP_AT, LOOK, 0.2) * (-7 + wave(t, 0.6) * 2)
  const cheer = span(t, CHEER, CHEER + 0.3, easeOut)
  // うで: あるくときは 足と ぎゃくに ふる(walk)。ばんざい では 上へ あげる
  const hang: Limb = { swing: 4, bend: 10 }
  const pose: PersonPose = {
    ...w.pose,
    leftArm: mixLimb(w.pose.leftArm ?? hang, { swing: 162, bend: 8 }, cheer),
    rightArm: mixLimb(w.pose.rightArm ?? hang, { swing: 152, bend: 8 }, cheer),
    head: lookUp + (face === 'joy' ? -4 : 0),
  }
  const kid = { ...w, y: GROUND_Y }
  const head = personRig({ ...kid, pose: {} }).world.head
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const kidOpacity = span(t, WALK_IN - 0.1, WALK_IN + 0.05)

  // 小鳥: かかしの ぼうしに おりて、うたう(おんぷ)
  const arrive = span(t, WALK_OUT - 0.2, SING + 0.6, easeOut)
  const landed = arrive >= 1
  const birdX = 124 + (PERCH[0] - 124) * arrive
  const birdY = -6 + (PERCH[1] + 6) * arrive - Math.sin(arrive * Math.PI) * 6 - (landed ? Math.max(0, wave(t, 0.5)) * 0.8 : 0)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sun t={t} x={8} y={9} r={4.2} />
        <Backdrop t={t} />
        <Ground t={t} />
        <Patch t={t} />
        <Paddy t={t} />
        <Scarecrow t={t} />
        <Meadow t={t} />
        <Layer opacity={kidOpacity}>
          <Person {...kid} look={KID_LOOK} face={face} lift={hop} pose={pose} />
          <Surprise t={t} x={head[0] + 1} y={head[1] - 8} />
        </Layer>
        {arrive > 0 && <Bird x={birdX} y={birdY} t={t} flying={!landed} facing="left" size={1.05} />}
        <Notes t={t} />
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
    { at: 0, label: 'たんぼと 畑の ある さと が できる', sound: 'pop' },
    { at: WALK_IN, label: '子どもが 歩いてきて、たんぼを ながめる' },
    { at: LOOK, label: 'さと を出て、野原へ。くさ が ひろがる', sound: 'pop' },
    { at: SURPRISE, label: 'かかしが 立っていて「あっ!」' },
    { at: SING, label: '小鳥の うた(音)。ばんざい' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '野 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
