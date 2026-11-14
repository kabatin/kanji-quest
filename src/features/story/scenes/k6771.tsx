/*
 * 東(ひがし): 木の むこうから お日さまが のぼる。
 *
 * ほね(画と絵の対応)
 *   1画目(一)    … 木の いちばん上の、よこに のびた えだ(上に 葉が しげる)
 *   2〜5画目     … 木の むこうに のぼった お日さま(2・3・4・5 = 日 の わく)。
 *                  ほんものの お日さまは まるいので、わくの まんなかに 大きな まるを 重ねる
 *   6画目(丨)    … 木の みき
 *   7・8画目     … みきの 下から 左右へ たれて 地面に とどく 大きな えだ
 *
 * ながれ
 *   まだ くらい あさ。木が そだつ。さむそうな 子どもが 木の まえまで あるいてきて、ふるえて まつ
 *   → 木の むこうの おか から お日さまが 顔を出し、空が あかるく なる。子どもは ふしぎそうに 見上げる
 *   → お日さまが 木の うしろの まんなかまで のぼる。子どもは うれしくて ばんざい
 *   → ほね が ひかって、絵が うすくなり、字「東」が のこる
 *
 * 子どもは 共通部品 Person(右むき。かた から うで が出て ひじ で まがる):
 *   お日さまは 空の いちばん たかい ところに いるので、見上げる ときは あたまを 少し上に むける。
 *   お日さまが のぼる ほうが ひがし。字の 日 は、木の むこう(うしろ)に いる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Bird, Canopy, CLOTHES, Hills, LOOKS, Meadow, mixLimb, PALETTE, Person, Sigh, Sky, Stars, turnAround, walk } from '../sceneFigures'

const CHAR = '東'

const BARK = PALETTE.bark
const SUN = '#ffd24a'
const SUN_LIGHT = '#fff0a8'

/** くぎり の時間(秒) */
const ARRIVE = 1.1
const RISE = 2.1
const TOP = 4.6
const CHEER = 4.2
const INK = 6.0
const DONE = 8.7
const DURATION = 9.4

/** お日さまが 木の うしろで とまる ばしょ(2〜5画目の 日 の わく の まんなか) */
const SUN_POS: readonly [number, number] = [53, 50]
const SUN_R = 17
/** 子どもの 足もと(足の うらの まんなか) */
const KID_FEET: readonly [number, number] = [11, 96]

/** あけがたの 空。くらい 夜から、あかるい 昼へ(Sky の time: 2 = 夜 → 0 = 昼) */
function Dawn({ t }: SceneProps) {
  const dawn = span(t, RISE - 0.3, TOP, easeInOut)
  return (
    <>
      <Sky time={2 * (1 - dawn)} />
      <Stars t={t} show={1 - span(t, RISE - 0.4, RISE + 1.2)} />
    </>
  )
}

/** お日さま。木の うしろ、おか の うしろ から のぼる。 */
function Sun({ t }: SceneProps) {
  const rise = span(t, RISE, TOP, easeOut)
  const y = mix(t, RISE, TOP, 102, SUN_POS[1], easeOut)
  const halo = 0.3 + 0.1 * wave(t, 1.6)
  if (rise <= 0) return null
  return (
    <>
      <circle cx={SUN_POS[0]} cy={y} r={SUN_R + 8} fill="#ffe38a" opacity={halo * rise} />
      <Layer rotate={t * 14} origin={[SUN_POS[0], y]} opacity={rise}>
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={SUN_POS[0] - 1} y={y - SUN_R - 7} width="2" height="4.6" rx="1" fill={SUN} transform={`rotate(${i * 30} ${SUN_POS[0]} ${y})`} />
        ))}
      </Layer>
      <circle cx={SUN_POS[0]} cy={y} r={SUN_R} fill={SUN} />
      <circle cx={SUN_POS[0] - 4} cy={y - 4} r={SUN_R - 6} fill={SUN_LIGHT} opacity="0.7" />
    </>
  )
}

function Tree({ t }: SceneProps) {
  // みき が下から のびて、えだ が ひろがり、さいごに 葉が ぽん と しげる
  const trunk = span(t, 0, 0.55, backOut)
  const boughs = span(t, 0.3, 0.8, backOut)
  const sway = wave(t, 3.4) * 1.2
  return (
    <>
      <ellipse cx="53.5" cy="97.6" rx={18 * trunk} ry="2.8" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.6 + 0.4 * trunk} scaleY={trunk} origin={[53.4, 98]}>
        {/* みきの ねもと: 少し ひろがる */}
        <path d="M46.5 98 Q52 93 51 86 L56 86 Q55.4 93 60.5 98 Z" fill={BARK} />
        <Bone char={CHAR} n={6} color={BARK} width={7.6} />
      </Layer>
      {/* 下へ たれる 左右の えだ(7・8画目) */}
      <Layer scale={boughs} origin={[53.5, 64]}>
        <Bone char={CHAR} n={7} color={BARK} width={5} />
        <Bone char={CHAR} n={8} color={BARK} width={5} />
      </Layer>
      {/* 上の よこえだ(1画目) */}
      <Layer scale={boughs} origin={[53.5, 24]}>
        <Bone char={CHAR} n={1} color={BARK} width={4.6} />
      </Layer>
      {/* えだの先の しげみ と てっぺんの しげみ(風で ゆっくり ゆれる) */}
      <Canopy x={23} y={90} r={8} grow={span(t, 0.5, 1.0)} sway={sway * 0.5} />
      <Canopy x={92} y={86.5} r={8.4} grow={span(t, 0.5, 1.0)} sway={sway * 0.5} />
      <Canopy x={31} y={21} r={9.6} grow={span(t, 0.5, 1.0)} sway={sway * 0.5} />
      <Canopy x={77} y={18.5} r={10} grow={span(t, 0.5, 1.0)} sway={sway * 0.5} />
      <Canopy x={53.5} y={11} r={19} grow={span(t, 0.5, 1.0)} sway={sway} />
    </>
  )
}

type Mood = 'sleepy' | 'wonder' | 'happy'

const KID_HEIGHT = 38
const FACES = { sleepy: 'sleepy', wonder: 'surprised', happy: 'joy' } as const

/** あけがたの 小鳥。お日さまが のぼると、右から とんできて うたう。 */
function MorningBird({ t }: SceneProps) {
  const fly = span(t, TOP - 0.6, TOP + 1.4)
  if (fly <= 0 || fly >= 1) return null
  const y = 28 + Math.sin(fly * Math.PI * 2) * 3 - fly * 4
  return (
    <Layer opacity={Math.min(1, Math.min(fly, 1 - fly) * 8)}>
      <Bird x={112 - fly * 96} y={y} t={t} flying facing="left" />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)

  // あるく: 左から 木の そばまで(右むき)
  const w = walk(t, { from: KID_FEET[0] - 28, to: KID_FEET[0], start: 0.2, end: ARRIVE, build: 'child', height: KID_HEIGHT })

  // きもち: さむくて ねむい → ふしぎ(見上げる)→ うれしい
  const mood: Mood = t < RISE + 0.2 ? 'sleepy' : t < CHEER - 0.4 ? 'wonder' : 'happy'
  const shiver = t >= ARRIVE && t < RISE + 0.2 ? wave(t, 0.14) * 0.35 : 0

  // うで: さむい ときは 体を だいて ちぢこまる / 見上げる ときは だらんと / うれしい ときは ばんざい
  const hug = span(t, ARRIVE, ARRIVE + 0.3) * (1 - span(t, RISE + 0.3, RISE + 0.7))
  const cheer = span(t, CHEER, CHEER + 0.7, backOut)
  const idle = { swing: 5 + wave(t, 1.6) * 2, bend: 8 }
  const huddle = { swing: 30, bend: 115 }
  const banzai = { swing: 150, bend: 20 }
  const arm = mixLimb(mixLimb(idle, huddle, hug), banzai, cheer)
  const pose = t < ARRIVE ? w.pose : { ...w.pose, leftArm: arm, rightArm: arm }

  // 見上げる(あたまを 少し 上へ)→ うれしくて ぴょんぴょん はねる
  const look = span(t, RISE + 0.2, RISE + 0.9) * (1 - span(t, CHEER - 0.2, CHEER + 0.3))
  const hopping = span(t, CHEER + 0.7, CHEER + 0.9) * (1 - span(t, INK - 0.15, INK))
  const hop = Math.abs(wave(t - CHEER, 0.7)) * 4 * hopping
  const kidX = (t < ARRIVE ? w.x : KID_FEET[0]) + shiver

  return (
    <>
      <Layer opacity={ink.picture}>
        <Dawn t={t} />
        <Sun t={t} />
        <Hills />
        <Meadow tufts={[6, 88, 102]} />
        <Tree t={t} />
        <Layer opacity={span(t, 0.15, 0.4)}>
          <ellipse cx={kidX} cy="97" rx="6.5" ry="1.8" fill="#000000" opacity="0.14" />
          <Person {...w} {...turnAround(t, CHEER - 0.1, 'right', 'front')} x={kidX} y={KID_FEET[1]} pose={{ ...pose, head: -14 * look }} look={{ ...LOOKS.boy, top: CLOTHES.red.top, bottom: CLOTHES.red.bottom }} face={FACES[mood]} gazeY={-look} lift={hop} />
          <Sigh x={KID_FEET[0] + 5} y={KID_FEET[1] - 29} p={span(t, ARRIVE + 0.2, RISE + 0.6)} show={during(t, ARRIVE + 0.2, RISE + 0.6, 0.25)} dir={1} />
        </Layer>
        <MorningBird t={t} />
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
    { at: 0, label: 'まだ くらい あさ。木が そだつ', sound: 'pop' },
    { at: ARRIVE, label: 'さむそうな 子どもが 木の まえで まつ' },
    { at: RISE, label: '木の むこうから お日さまが のぼりはじめる', sound: 'pop' },
    { at: CHEER, label: '子どもが うれしくて ばんざい' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '東 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
