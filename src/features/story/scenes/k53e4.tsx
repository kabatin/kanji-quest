/*
 * 古(ふるい): むかしの はなしが、くちから くちへ、10回 つたわった。ふるい はなし。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … むらの「はなしの はた」の よこぼう(10本の リボンを むすぶ)
 *   2画目(丨)  … はた の たてぼう(上に はたが ひらひら)
 *   3・4・5画目 … 井戸(いど)の いしの わく。上から見ると 井戸は「口」の かたち
 *                  (井戸ばたで おしゃべり、は むかしの むらの ふつうの けしき)
 *
 * ながれ
 *   はたと 井戸が できる → おばあさんが あるいてくる → バケツを もった 女の子も やってくる
 *   (女の子は つかれて たいくつ)
 *   → おばあさんが むかしばなしを はじめる。ふきだしが 口から 口へ とんでいく
 *   → 女の子は びっくり → おもしろくて、こんどは 女の子が おばあさんに はなしかえす
 *   → ふきだしが 1つ とどくたびに、はた に リボンが 1本ずつ ふえて、10本
 *   → 女の子は うれしくて とびはねる → ほね が ひかって、絵が うすくなり、字「古」が のこる
 *
 * 人は Person(おばあさんは build="elder")。あるきは walk、バケツは Bucket を 手の 位置に もたせる。
 * 小鳥は Bird、ためいきは Sigh、背景は Backdrop。井戸の わく と はたの ぼうは、本来 その形の もの なので Bone で 画の線を そのまま使う。
 */
import { backOut, during, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, Bird, Bucket, HANG_ARM, LOOKS, mixLimb, Person, personRig, Sigh, walk, type Expression, type Limb } from '../sceneFigures'

const CHAR = '古'

const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const STONE = '#b9b3a6'
const STONE_DARK = '#9a9486'
const WATER = '#5aaee8'
const WATER_LIGHT = '#bfe4fa'
const FLAG = '#e8534a'

/** くぎり の時間(秒) */
const GRANNY_IN = 0.4
const GIRL_IN = 0.9
const TELL = 2.2
/** ふきだし 1つ の 間かく と、とんでいる 時間 */
const STEP = 0.38
const FLY = 0.3
const COUNT = 10
const INK = 6.4
const DONE = 9.0
const DURATION = 9.6

const startOf = (i: number) => TELL + i * STEP
const arriveOf = (i: number) => startOf(i) + FLY
const WOW_AT = arriveOf(0)
const HAPPY_AT = arriveOf(5)

/** 地面 */
const GROUND_Y = 96
const GRANNY_X = 15
const GIRL_X = 95
const GRANNY_SHAPE = { build: 'elder', height: 54, y: GROUND_Y } as const
const GIRL_SHAPE = { build: 'child', height: 44, y: GROUND_Y } as const
const GRANNY_LOOK = LOOKS.grandma
const GIRL_LOOK = { ...LOOKS.little, hairStyle: 'ponytail', bottomKind: 'dress', top: '#ff8fa3', accent: '#ffd24a' } as const
/** 口の 高さ(あたまの まんなか より 少し下)。ふきだし が とぶ たかさ */
const MOUTH_DROP = 2.2
const BUCKET_WIDTH = 9

/** 1画目の よこぼう の 高さ(x の所) */
const barY = (x: number) => 43.3 - (x - 11.3) * 0.044

/** はなしの はた: たてぼう(2画目)と よこぼう(1画目)。上に はた が ひらひら。 */
function Pole({ t }: SceneProps) {
  const up = span(t, 0, 0.7, backOut)
  const cross = span(t, 0.3, 0.9, backOut)
  const flutter = wave(t, 1.1) * 5
  return (
    <>
      <Layer scaleY={up} origin={[54.5, 66]}>
        <Bone char={CHAR} n={2} color={BARK} width={4.6} />
        <Layer rotate={flutter} origin={[55.5, 17]}>
          <path d="M56 13 L68.5 16.8 L56 20.6 Z" fill={FLAG} />
        </Layer>
      </Layer>
      <Layer scaleX={cross} origin={[54.5, 41]}>
        <Bone char={CHAR} n={1} color={BARK} width={4.2} />
        <Bone char={CHAR} n={1} color={BARK_DARK} width={1} opacity={0.35} />
      </Layer>
    </>
  )
}

/** 井戸: 上から見ると 四角い いし の わく(3・4・5画目)。中に 水。 */
function Well({ t }: SceneProps) {
  const grow = span(t, 0.05, 0.65, backOut)
  const shimmer = wave(t, 1.6)
  return (
    <Layer scale={grow} origin={[56, 97]}>
      <path d="M33.8 69.4 L77 67.6 L75 91 L37.6 93.4 Z" fill={WATER} />
      <ellipse cx={52 + shimmer * 3} cy="79" rx="6" ry="1.2" fill={WATER_LIGHT} opacity="0.8" />
      <ellipse cx={66 - shimmer * 2} cy="85" rx="4" ry="0.9" fill={WATER_LIGHT} opacity="0.6" />
      <Bone char={CHAR} n={3} color={STONE} width={6} />
      <Bone char={CHAR} n={4} color={STONE} width={6} />
      <Bone char={CHAR} n={5} color={STONE_DARK} width={6} />
    </Layer>
  )
}

const RIBBON_COLORS = ['#e8534a', '#4f9be0', '#ffd24a', '#55b86e', '#c77ad8'] as const

/** ふきだしが 1つ とどくたびに、よこぼう に リボンが 1本 むすばれる */
function Ribbons({ t }: SceneProps) {
  return (
    <>
      {Array.from({ length: COUNT }, (_, i) => {
        const at = arriveOf(i)
        const pop = span(t, at, at + 0.3, backOut)
        if (pop <= 0) return null
        // よこぼう の 左から 右へ ならべる(たてぼう の すぐ よこは さける)
        const x = 17 + i * 8.3 + (i >= 5 ? 1 : 0)
        const y = barY(x)
        const flash = t >= at && t < at + 0.35 ? Math.sin(span(t, at, at + 0.35) * Math.PI) * 3.4 : 0
        return (
          <g key={i}>
            <Layer x={x} y={y + 1.2} scale={pop} rotate={wave(t, 1.6, i * 0.4) * 6} origin={[0, 0]}>
              <circle cx="0" cy="0" r="1.8" fill={RIBBON_COLORS[i % RIBBON_COLORS.length]} />
              <path d="M-1.6 0.4 H1.6 V6.4 L0 4.9 L-1.6 6.4 Z" fill={RIBBON_COLORS[i % RIBBON_COLORS.length]} />
            </Layer>
            {flash > 0 && <Star cx={x} cy={y - 4} r={flash} color="#ffd95a" spin={t * 200} />}
          </g>
        )
      })}
    </>
  )
}

type Mouth = readonly [number, number]

/** 口から 口へ とぶ ふきだし(お話)。 */
function Bubble({ t, index, granny, girl }: SceneProps & { readonly index: number; readonly granny: Mouth; readonly girl: Mouth }) {
  const s = startOf(index)
  if (t < s || t > s + FLY + 0.14) return null
  const grannyToGirl = index % 2 === 0
  const p = span(t, s, s + FLY)
  const from = grannyToGirl ? granny : girl
  const to = grannyToGirl ? girl : granny
  const x = from[0] + (to[0] - from[0]) * p
  const y = from[1] + (to[1] - from[1]) * p - Math.sin(p * Math.PI) * 5
  const fade = 1 - span(t, s + FLY, s + FLY + 0.14)
  const pop = span(t, s, s + 0.1, backOut)
  return (
    <Layer x={x} y={y} scale={pop} opacity={fade}>
      <path d={`M${grannyToGirl ? -3 : 3} 2.6 l${grannyToGirl ? -2.2 : 2.2} 2.2 l${grannyToGirl ? 4 : -4} -0.9 Z`} fill="#ffffff" />
      <ellipse cx="0" cy="0" rx="4.8" ry="3.7" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
      <circle cx="-2" cy="0" r="0.85" fill="#f07f9e" />
      <circle cx="0" cy="0" r="0.85" fill="#5aaee8" />
      <circle cx="2" cy="0" r="0.85" fill="#ffc233" />
    </Layer>
  )
}

/** ふたりの 話す あいだ、口が ぱくぱく ひらく大きさ */
function talking(t: number, parity: number): number {
  const open = Array.from({ length: COUNT }, (_, i) => i)
    .filter((i) => i % 2 === parity)
    .reduce((best, i) => Math.max(best, during(t, startOf(i) - 0.04, startOf(i) + 0.26, 0.06)), 0)
  return open * (0.55 + 0.45 * Math.abs(Math.sin(t * 22)))
}

/** 手ぶり(話す人)の つよさ: 0 = おろす / 1 = ぜんぶ ひらく */
function gesturing(t: number, parity: number): number {
  return Array.from({ length: COUNT }, (_, i) => i)
    .filter((i) => i % 2 === parity)
    .reduce((best, i) => Math.max(best, during(t, startOf(i) - 0.1, startOf(i) + 0.4, 0.12)), 0)
}

/** 話を きいた しゅんかん の うなずき(度) */
function nodding(t: number, parity: number): number {
  return Array.from({ length: COUNT }, (_, i) => i)
    .filter((i) => i % 2 === parity)
    .reduce((sum, i) => sum + Math.sin(span(t, arriveOf(i), arriveOf(i) + 0.28) * Math.PI) * (t >= arriveOf(i) && t < arriveOf(i) + 0.28 ? 6 : 0), 0)
}

/** あたまの まんなか(rig)から、口の 場所を 出す。向きに 合わせて 少し まえへ */
function mouthOf(shape: typeof GRANNY_SHAPE | typeof GIRL_SHAPE, x: number, facing: 'left' | 'right'): Mouth {
  const head = personRig({ ...shape, x, facing }).world.head
  return [head[0] + (facing === 'right' ? 5 : -5), head[1] + MOUTH_DROP]
}

const GRANNY_MOUTH = mouthOf(GRANNY_SHAPE, GRANNY_X, 'right')
const GIRL_MOUTH = mouthOf(GIRL_SHAPE, GIRL_X, 'left')

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  // おばあさん: あるいてきて、話す(偶数ばんめ)。きくのは 奇数ばんめ
  const gw = walk(t, { from: -18, to: GRANNY_X, start: GRANNY_IN, end: GRANNY_IN + 0.9, build: 'elder', height: 54 })
  const gTalk = gesturing(t, 0)
  const gGesture: Limb = { swing: 34 + wave(t, STEP) * 6, bend: 58 }
  const grannyPose = gw.moving ? gw.pose : { leftArm: mixLimb(HANG_ARM, gGesture, gTalk), head: nodding(t, 1) }
  const granny = { ...gw, y: GROUND_Y, look: GRANNY_LOOK, face: (talking(t, 0) > 0.3 ? 'joy' : 'smile') as Expression, pose: grannyPose }

  // 女の子: あるいてきて、バケツを さげて きく → びっくり → はなしかえす → とびはねる
  const lw = walk(t, { from: 128, to: GIRL_X, start: GIRL_IN, end: GIRL_IN + 1.1, build: 'child', height: 44, armSwing: 10 })
  const bored = t < WOW_AT
  const happy = t >= HAPPY_AT
  const base: Expression = bored ? 'sleepy' : happy ? 'joy' : 'surprised'
  const hop = happy && t < INK - 0.2 ? Math.abs(wave(t, 0.5)) * 1.8 : 0
  const cheer = span(t, HAPPY_AT, HAPPY_AT + 0.4)
  const lTalk = gesturing(t, 1)
  const bucketArm: Limb = lw.moving ? lw.pose.rightArm ?? HANG_ARM : { swing: 8, bend: 6 }
  const farIdle: Limb = lw.moving ? lw.pose.leftArm ?? HANG_ARM : mixLimb(HANG_ARM, { swing: 30, bend: 46 }, lTalk)
  const farArm = mixLimb(farIdle, { swing: 150, bend: 20 }, cheer)
  const girlPose = { ...lw.pose, rightArm: bucketArm, leftArm: farArm, head: (bored ? 6 : 0) + nodding(t, 0) }
  const girl = { ...lw, y: GROUND_Y, lift: hop, look: GIRL_LOOK, face: (talking(t, 1) > 0.3 ? 'joy' : base) as Expression, pose: girlPose, hairSway: wave(t, 0.4) * (lw.moving ? 6 : 0) }
  const rig = personRig(girl)
  const hand = rig.world.arms.right.end
  const girlHead = rig.world.head

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} clouds={[[82, 20, 0.9], [14, 30, 0.8]]} tufts={[6, 47, 84, 101]} />
        <Pole t={t} />
        <Well t={t} />
        <Ribbons t={t} />
        {t >= 3.0 && <Bird x={128 - span(t, 3.0, 3.7, easeOut) * 40} y={birdY(t)} t={t} flying={span(t, 3.0, 3.7) < 1} facing="left" size={1.1} color="#ff9a5c" dark="#e2733f" />}
        <Person {...granny} />
        <Person {...girl} held={<Bucket x={hand[0]} y={hand[1] + 4.6} width={BUCKET_WIDTH} />} />
        <Sigh x={girlHead[0] - 5} y={girlHead[1] + 3} p={span(t, GIRL_IN + 1.1, WOW_AT, easeOut)} show={during(t, GIRL_IN + 1.1, WOW_AT, 0.2)} dir={-1} />
        {Array.from({ length: COUNT }, (_, i) => (
          <Bubble key={i} t={t} index={i} granny={GRANNY_MOUTH} girl={GIRL_MOUTH} />
        ))}
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Layer scale={1 + bump} origin={[54.5, 54.5]}>
        <Ink char={CHAR} progress={ink.progress} tint={ink.tint} />
      </Layer>
      <Sparkles cx={54.5} cy={52} progress={ink.sparkle} />
    </>
  )
}

/** はたの よこぼう に とまる 小鳥の 高さ(とんでくる とき ふわっと 山なり) */
function birdY(t: number): number {
  const arrive = span(t, 3.0, 3.7, easeOut)
  const landed = arrive >= 1
  const hop = landed ? Math.abs(wave(t, 0.7)) * 0.8 : 0
  return 12 + arrive * 25 - Math.sin(arrive * Math.PI) * 8 - hop
}

const scene: SceneModule = {
  char: CHAR,
  duration: DURATION,
  beats: [
    { at: 0, label: 'はなしの はた と 井戸が できる', sound: 'pop' },
    { at: GIRL_IN, label: 'おばあさんと、バケツの 女の子が やってくる' },
    { at: TELL, label: 'おばあさんの むかしばなし。口から 口へ', sound: 'pop' },
    { at: WOW_AT + 0.6, label: 'とどくたびに リボンが ふえる。女の子は びっくり' },
    { at: HAPPY_AT, label: '10回 つたわって、女の子は とびはねる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '古 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
