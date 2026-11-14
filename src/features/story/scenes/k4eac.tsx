/*
 * 京(みやこ): たかい ところに たつ、大きな たてもの。(共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)
 *   1画目(丶)  … たてものの てっぺんに のびた かざり(とがった とう)
 *   2画目(一)  … 大きな 屋根の ひさし(ふちの ライン)
 *   3画目(丨)  … 大きな まどの 左のわく
 *   4画目(𠃍)  … 大きな まどの 上のわく と 右のわく
 *   5画目(一)  … 大きな まどの したのわく
 *   6画目(亅)  … ゆかを ささえる まんなかの はしら(足もとは 石の上)
 *   7・8画目   … 左右に ふんばる ななめの はしら(たかい ゆかを ささえる)
 *
 * ながれ
 *   きりが たちこめて、なにも 見えない
 *   → つかれた子が みちを あるいてきて、手を おでこに あてて「どこだろう」ときょろきょろ
 *   → 風が ふいて、きりが はれていく
 *   → 大きな たてもの が あらわれる。子は びっくり、まどに あかりが ともって 大よろこびで ぴょんぴょん はねる
 *   → ほね が ひかって、絵が うすくなり、字「京」が のこる
 *
 * 子は Person(左むき・あるきは walk・リュックは pack)。手を おでこに あてる ときは、手先を
 * あたまの 点で 指す(ひじ は 部品が 曲げる)。
 * たてもの は、たかい ゆかを ななめの はしらで ささえる つくり。きり は ふくらんだ かたまり が、風で ちらばって うすくなる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, Bird, HANG_ARM, mixLimb, PALETTE, Person, personRig, Sweat, walk, Wind, type Expression, type PersonPose } from '../sceneFigures'

const CHAR = '京'

const BARK = PALETTE.bark
const WALL = '#f3e2c0'
const ROOF = '#c4533f'
const ROOF_LIGHT = '#dc7058'
const ROOF_EDGE = '#8f3a2e'
const GOLD = '#e0a830'
const NIGHT = '#3d3a58'
const LAMP = '#ffdc8a'
const FLOOR = '#b8814f'
const FLOOR_DARK = '#8f5f38'
const STONE = '#b9b4aa'
const LEAF = PALETTE.leaf
const ROAD = '#ead3a4'
const FOG_MAIN = '#eef2f7'
const FOG_SHADE = '#d3dce8'

/** くぎり の時間(秒) */
const WALK = 0.5
/** 子が たちどまって、きょろきょろ しはじめる */
const ARRIVE = 2.1
/** 風が ふいて、きりが はれはじめる */
const CLEAR = 3.0
/** きりが はれて、たてものが 見える */
const SEE = 4.6
/** よろこんで はねる */
const CHEER = 5.2
const INK = 6.3
const DONE = 9.2
const DURATION = 9.8

/** 子が たちどまる場所(こしの x)と、地面の y。たてものが 大きく 見えるように、小さめ */
const STAND_X = 99
const GROUND_Y = 97
const CHILD_HEIGHT = 34

/* ───────── ばしょ ───────── */

/** とおくの おか・草・みち。子は みちを あるいてくる */
function Land() {
  return (
    <>
      <path d="M44 94.4 Q70 93 112 96.6 L112 100.6 Q72 98 40 97 Z" fill={ROAD} />
      {[6, 30, 78, 104].map((x) => (
        <path key={x} d={`M${x} 99 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/* ───────── たかい たてもの ───────── */

function Building({ t }: SceneProps) {
  // まどの あかり: きりが はれて 見えたころ、ぽっと ともる
  const lamp = span(t, CLEAR + 1.2, SEE + 0.5)
  return (
    <>
      {/* かべ: 屋根の ひさしの 下に かくれる */}
      <rect x="23" y="26" width="62" height="38" rx="2" fill={WALL} />
      {/* まど: 中は くらい → あかりが つく */}
      <path d="M33.2 42.6 L73.4 38.4 L70.8 56.4 L36.4 60.2 Z" fill={NIGHT} />
      <path d="M33.2 42.6 L73.4 38.4 L70.8 56.4 L36.4 60.2 Z" fill={LAMP} opacity={lamp} />
      {/* 3・4・5画目: まどの わく */}
      <Bone char={CHAR} n={3} color={BARK} width={3.2} />
      <Bone char={CHAR} n={4} color={BARK} width={3.2} />
      <Bone char={CHAR} n={5} color={BARK} width={3.2} />
      {/* たかい ゆか: ななめの はしら と まんなかの はしら が ささえる */}
      <Bone char={CHAR} n={7} color={BARK} width={4.4} />
      <Bone char={CHAR} n={8} color={BARK} width={4.4} />
      <Bone char={CHAR} n={6} color={BARK} width={5.2} to={0.74} />
      <ellipse cx="54.8" cy="93.4" rx="6.6" ry="2" fill={STONE} />
      <ellipse cx="17.8" cy="91.8" rx="4.2" ry="1.8" fill={STONE} />
      <ellipse cx="89.6" cy="91.4" rx="4.2" ry="1.8" fill={STONE} />
      <rect x="19" y="63" width="70" height="9.5" rx="2.2" fill={FLOOR} />
      <rect x="19" y="70" width="70" height="2.5" rx="1.2" fill={FLOOR_DARK} />
      {/* 屋根: 大きく はりだす */}
      <path d="M12 30.5 L38 15.5 L66 13.5 L95 24.5 Z" fill={ROOF} />
      <path d="M38 15.5 L66 13.5 L95 24.5" fill="none" stroke={ROOF_LIGHT} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <Bone char={CHAR} n={2} color={ROOF_EDGE} width={4.2} />
      {/* ひさしの したに ぶらさがる ちょうちん */}
      <circle cx="21" cy="37" r="2.6" fill="#e8534a" />
      <circle cx="84" cy="32.4" r="2.6" fill="#e8534a" />
      {/* 1画目: てっぺんの とがった かざり */}
      <Bone char={CHAR} n={1} color={GOLD} width={3} to={0.32} />
      <circle cx="51.3" cy="10.8" r="2.1" fill={GOLD} />
    </>
  )
}

/* ───────── きり ───────── */

type Puff = { readonly cx: number; readonly cy: number; readonly r: number }
/** 画面ぜんたいを おおう きりの かたまり(たて5だん) */
const FOG: readonly Puff[] = [
  [18, 44, 70, 94],
  [10, 34, 58, 82, 104],
  [18, 42, 66, 90],
  [10, 34, 58, 82, 104],
  [22, 50, 78, 100],
].flatMap((row, rowIndex) => row.map((cx, i) => ({ cx, cy: [14, 34, 56, 78, 92][rowIndex], r: 16 + ((rowIndex * 3 + i) % 3) })))

type PuffState = { readonly x: number; readonly y: number; readonly r: number; readonly o: number }

/** きりの 1つぶ が いま どこに いるか。右がわから 先に、風に ふかれて ちらばって きえる */
function puffState(puff: Puff, i: number, t: number): PuffState {
  const grow = span(t, 0.05 + (i % 7) * 0.05, 0.45 + (i % 7) * 0.05, backOut)
  const delay = ((109 - puff.cx) / 109) * 0.4
  const k = span(t, CLEAR + delay, CLEAR + delay + 1.3, easeInOut)
  return {
    x: puff.cx + (puff.cx - 54) * 1.9 * k - 16 * k,
    y: puff.cy + (puff.cy - 50) * 0.9 * k - 5 * k,
    r: Math.max(0, puff.r * grow * (1 - 0.45 * k)),
    o: 1 - span(k, 0.55, 1),
  }
}

function Fog({ t }: SceneProps) {
  const states = FOG.map((puff, i) => puffState(puff, i, t)).filter((s) => s.o > 0 && s.r > 0)
  if (states.length === 0) return null
  return (
    <>
      {states.map((s, i) => (
        <circle key={`s${i}`} cx={s.x} cy={s.y + 1.8} r={s.r} fill={FOG_SHADE} opacity={s.o} />
      ))}
      {states.map((s, i) => (
        <circle key={`m${i}`} cx={s.x} cy={s.y} r={s.r} fill={FOG_MAIN} opacity={s.o} />
      ))}
    </>
  )
}

/* ───────── 子 ───────── */

/** あたまの てっぺんの かみの けば。風で 左へ なびく(あたまの まんなか が 0,0、半径 1、右むきの 形) */
function Tuft({ lean }: { readonly lean: number }) {
  return (
    <g transform={`rotate(${lean} 0 -0.95)`}>
      <path d="M0 -0.95 Q0.05 -1.25 0.35 -1.32" fill="none" stroke={PALETTE.hair} strokeWidth="0.2" strokeLinecap="round" />
    </g>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)

  // あるく: 右から みちを あるいて、たちどまる
  const w = walk(t, { from: 122, to: STAND_X, start: WALK, end: ARRIVE, build: 'child', height: CHILD_HEIGHT, armSwing: 20 })

  // はねる: よろこびの あいだ だけ。字になる ころには おちつく
  const settle = 1 - span(t, INK + 0.3, INK + 0.9)
  const hop = t < CHEER ? 0 : Math.abs(Math.sin((t - CHEER) * Math.PI * 1.6)) * 5 * settle

  // おでこの 点: あたまの まえ(左むき)の すこし 上
  const base = { x: w.x, y: GROUND_Y, build: 'child', height: CHILD_HEIGHT, facing: 'left' } as const
  const baseRig = personRig(base)
  const headR = baseRig.body.headR * baseRig.scale
  const brow = { to: [baseRig.world.head[0] - headR * 0.85, baseRig.world.head[1] - headR * 0.55] } as const

  // うで: あるく → おでこに 手を あてて きょろきょろ → びっくり(ひろげる)→ ばんざい
  const cheerWave = wave(t, 0.62)
  const open = { swing: 38, bend: 10 }
  const hooray = { swing: 150 + cheerWave * 12, bend: 15 }
  const hoorayFar = { swing: 140 - cheerWave * 12, bend: 15 }
  const toBrow = span(t, ARRIVE, ARRIVE + 0.4, easeInOut)
  const toOpen = span(t, SEE, SEE + 0.3, easeOut)
  const toCheer = span(t, CHEER, CHEER + 0.3, easeOut)
  // 左むき の てまえの うで は 体の 右
  const nearArm = t < SEE ? mixLimb(HANG_ARM, brow, toBrow) : t < CHEER ? mixLimb(mixLimb(HANG_ARM, brow, 1), open, toOpen) : mixLimb(open, hooray, toCheer)
  const farArm = t < SEE ? HANG_ARM : t < CHEER ? mixLimb(HANG_ARM, open, toOpen) : mixLimb(open, hoorayFar, toCheer)

  const face: Expression = t < SEE ? 'worried' : t < CHEER ? 'surprised' : 'joy'
  // あたま: あるくとき うつむき、さがすとき 左右を見まわし、見つけると 上を見あげる
  const headTilt = t < ARRIVE ? 5 : t < SEE ? wave(t - ARRIVE, 1.3) * 4 : -12 - (t >= CHEER ? wave(t, 0.62) * 3 : 0)
  const wind = during(t, CLEAR - 0.2, CLEAR + 1.7, 0.3)
  const tuft = wind * 16 + wave(t, 0.3) * 5 * wind
  const pose: PersonPose = t < ARRIVE ? { ...w.pose, head: headTilt } : { leftArm: farArm, rightArm: nearArm, head: headTilt }
  const place = { ...base, pose, lift: hop } as const
  const head = personRig(place).world.head

  const buildingShown = span(t, 0.8, 0.82)
  const twinkle = during(t, SEE - 0.1, SEE + 0.9, 0.3)
  const birdShow = during(t, CHEER - 0.1, CHEER + 1.3, 0.2)
  const birdP = span(t, CHEER - 0.1, CHEER + 1.3)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} tufts={[]} />
        <Land />
        <Layer opacity={buildingShown}>
          <Building t={t} />
        </Layer>
        <Fog t={t} />
        {[46, 66, 84].map((y, i) => (
          <Wind key={y} t={t + i * 0.3} x={104} y={y} dir={-1} reach={60} show={wind} />
        ))}
        <Person {...place} face={face} pack={{ kind: 'rucksack', color: '#e8934a' }} headwear={<Tuft lean={tuft} />} />
        <Sweat t={t} x={head[0] + 4} y={head[1] - 3} show={during(t, WALK + 0.6, CLEAR, 0.3)} dir={1} />
        <Layer opacity={birdShow}>
          <Bird x={112 - birdP * 52} y={8 + Math.sin(birdP * Math.PI * 2) * 1.6} t={t} flying />
        </Layer>
        {twinkle > 0 && <Star cx={51.3} cy={10.8} r={3.6 * twinkle} color="#fff6c0" spin={t * 90} />}
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
    { at: 0, label: 'きりが たちこめて、なにも 見えない', sound: 'pop' },
    { at: WALK, label: 'つかれた子が みちを あるいてくる' },
    { at: ARRIVE, label: '手を おでこに あてて、きょろきょろ' },
    { at: CLEAR, label: '風が ふいて、きりが はれていく', sound: 'pop' },
    { at: SEE, label: '大きな たてものが 見える。まどに あかりが ともる' },
    { at: CHEER, label: '大よろこびで ぴょんぴょん はねる', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '京 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
