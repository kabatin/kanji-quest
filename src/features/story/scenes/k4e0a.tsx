/*
 * 上(うえ): 地面の 上に、しるしを つける。(共通部品 sceneFigures で 書きなおした もの)
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … 地面に 立った 高い ぼう(てっぺんは 金色の たま)
 *   2画目(一)  … ぼうの 高いところに むすんだ、風に ゆれる 赤いリボン(しるし)
 *   3画目(一)  … 地面(よこせん)。くさの おびが 土の いちばん上に のっている
 *
 * ながれ
 *   地面が できて、ぼうが すっと 立つ
 *   → リボンを もった 子が あるいてくる(にこにこ)
 *   → ぼうの てっぺんの ほうに リボンを むすびたい。見あげる → せのびしても とどかない(しょんぼり)
 *   → しゃがんで、ぴょーんと ジャンプ。とどいた ところで リボンを きゅっと むすぶ
 *   → ちゃくち。リボンが 風に ゆれて、子は 大よろこび
 *   → ほね が ひかって、絵が うすくなり、字「上」が のこる
 *
 * 人は Person。あるきは walk、しゃがむのは posture('squat')、ジャンプは lift、
 * リボンに のばす うでは { to }(とどかない ときは のばしきった うで が その むき を さす)。
 * リボンを 手に もつ・ぼう・土・風に ゆれる リボン は ここで 描く。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Clouds, Hearts, Hills, LOOKS, mixLimb, mixPose, PALETTE, Person, personRig, posture, Sun, Sweat, walk, type Limb, type PersonProps } from '../sceneFigures'

const CHAR = '上'

const POLE = '#a8744a'
const GOLD = '#ffd24a'
const RIBBON = '#e8534a'
const RIBBON_DARK = '#c9403a'
const SOIL = '#b98a5e'
const SOIL_DARK = '#9c6f47'
const GRASS_TOP = PALETTE.leaf
const GRASS_LIGHT = PALETTE.leafLight

/** くぎり の時間(秒) */
const WALK = 0.8
const LOOK = 2.3
const TRY = 2.95
const FAIL = 3.6
const CROUCH = 4.1
const LEAP = 4.3
const LAND = 5.05
const PEAK = (LEAP + LAND) / 2
const INK = 6.6
const DONE = 9.2
const DURATION = 9.8

/** 地面の たかさ(3画目の よこせん)と、子が たつ ばしょ */
const GROUND_Y = 87
const STAND_X = 42
/** 子の 背の高さ(子ども) */
const KID_HEIGHT = 40
/** ぼうの よこ(1画目) と、リボンを むすぶ たかさ(2画目の はじまり) */
const POLE_X = 54.3
const KNOT_Y = 44.7
/** ジャンプの たかさ: て が ぼうの KNOT_Y に とどく */
const JUMP_HEIGHT = 12

const STAND = posture('stand', 'right')
const SQUAT = posture('squat', 'right')
const HANG: Limb = { swing: 3, bend: 8 }
const STRETCH: Limb = { swing: 150, bend: 10 }
const CHEER: Limb = { swing: 120, bend: 10 }
const FAR_REACH: Limb = { swing: 100, bend: 20 }

function Ground({ t }: SceneProps) {
  const rise = span(t, 0, 0.55, easeOut)
  return (
    <>
      <Sun t={t} />
      <Clouds t={t} at={[[0, 29, 1], [94, 21, 0.85]]} />
      <Layer y={(1 - rise) * 26}>
        <Hills y={-10} />
        {/* 土: 3画目の よこせん が いちばん上 */}
        <rect x="-4" y={GROUND_Y} width="117" height="30" fill={SOIL} />
        <path d="M6 99 q3 -2 6 0 M40 104 q3 -2 6 0 M78 98 q3 -2 6 0 M96 106 q3 -2 6 0" fill="none" stroke={SOIL_DARK} strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="26" cy="102" r="2" fill={SOIL_DARK} />
        <circle cx="68" cy="106" r="2.4" fill={SOIL_DARK} />
        {/* 地面の くさ の おび(画の線に のせる) */}
        <path d={`M-4 ${GROUND_Y} H113`} stroke={GRASS_TOP} strokeWidth="5.4" strokeLinecap="round" />
        <Bone char={CHAR} n={3} color={GRASS_TOP} width={5.4} />
        {[8, 30, 68, 90, 104].map((x) => (
          <path key={x} d={`M${x} ${GROUND_Y - 2} l1.2 -3.2 l1 2.8 l1.5 -3.8 l0.8 4.2 Z`} fill={GRASS_LIGHT} />
        ))}
      </Layer>
    </>
  )
}

function Pole({ t }: SceneProps) {
  // ぼうが 地面から すっと のびて、てっぺんの たまが ぽん と出る
  const grow = span(t, 0.2, 0.85, backOut)
  return (
    <Layer scaleY={grow} origin={[POLE_X, GROUND_Y]}>
      <Bone char={CHAR} n={1} color={POLE} width={3.4} />
      <ellipse cx={POLE_X} cy={GROUND_Y - 0.6} rx="4.4" ry="1.6" fill={SOIL_DARK} />
      <circle cx="52.5" cy="15.4" r="3.2" fill={GOLD} />
      <circle cx="51.6" cy="14.4" r="1.1" fill="#fff3b8" />
    </Layer>
  )
}

/** ぼうに むすんだ リボン(2画目の線の まわり)。むすんだ しゅんかん から のびて、風に ゆれる。 */
function Ribbon({ t }: SceneProps) {
  const grow = span(t, PEAK, PEAK + 0.7, backOut)
  if (grow <= 0) return null
  const length = 26.2 * grow
  const calm = 1 - 0.75 * span(t, INK - 0.7, INK)
  const steps = 14
  const centers = Array.from({ length: steps + 1 }, (_, i) => {
    const s = i / steps
    const x = POLE_X + length * s
    const y = KNOT_Y - (x - 58) * 0.133 + 1.8 * calm * s ** 1.2 * Math.sin(s * 5.5 - t * 7)
    const half = 2.5 * (1 - 0.15 * s)
    return { x, top: y - half, bottom: y + half, y }
  })
  const topEdge = centers.map((c) => `${c.x.toFixed(2)} ${c.top.toFixed(2)}`)
  const bottomEdge = [...centers].reverse().map((c) => `${c.x.toFixed(2)} ${c.bottom.toFixed(2)}`)
  const end = centers[steps]
  // さきっぽは ツバメの おのように 切れこみ
  const notch = `${(end.x - 3.4).toFixed(2)} ${end.y.toFixed(2)}`
  const d = `M${topEdge.join(' L')} L${notch} L${bottomEdge.join(' L')} Z`
  const lower = centers.map((c) => `${c.x.toFixed(2)} ${(c.y + 0.2).toFixed(2)}`)
  const lowerBottom = [...centers].reverse().map((c) => `${c.x.toFixed(2)} ${c.bottom.toFixed(2)}`)
  return (
    <>
      <path d={d} fill={RIBBON} stroke={RIBBON} strokeWidth="0.6" strokeLinejoin="round" />
      <path d={`M${lower.join(' L')} L${lowerBottom.join(' L')} Z`} fill={RIBBON_DARK} opacity="0.55" />
      <circle cx={POLE_X + 0.6} cy={KNOT_Y} r="2" fill={RIBBON_DARK} />
    </>
  )
}

/** 子の 場所と かっこう。あるく → 見あげる → せのび → しゃがむ → ジャンプ → ちゃくち → 大よろこび */
function kidAt(t: number): PersonProps {
  const walking = walk(t, { from: -10, to: STAND_X, start: WALK, end: LOOK, build: 'child', height: KID_HEIGHT })

  const tiptoe = 1.5 * span(t, TRY, TRY + 0.3) * (1 - span(t, FAIL, FAIL + 0.2))
  const airborne = Math.sin(span(t, LEAP, LAND) * Math.PI)
  const cheerHop = 2.2 * Math.abs(Math.sin(span(t, LAND + 0.3, LAND + 1.5) * Math.PI * 3)) * (1 - span(t, LAND + 1.0, LAND + 1.5))
  // しゃがむ: とびだす 直前まで ふかく、とんだら すぐ のびる。ちゃくちで 少し ひざを まげる
  const squat = span(t, CROUCH, LEAP - 0.05, easeInOut) * (1 - span(t, LEAP - 0.05, LEAP + 0.1)) + 0.3 * Math.sin(span(t, LAND, LAND + 0.25) * Math.PI)
  const sit = mixPose(STAND, SQUAT, squat)

  // てまえの うで(右むき は 左うで): だらん → せのび(とどかない)→ しっぱい → ジャンプで リボンへ → 大よろこび
  const base = t < LOOK ? (walking.pose.leftArm ?? HANG) : HANG
  const near = [
    (a: Limb) => mixLimb(a, STRETCH, span(t, TRY, TRY + 0.3)),
    (a: Limb) => mixLimb(a, HANG, span(t, FAIL, FAIL + 0.3)),
    (a: Limb) => mixLimb(a, { to: [POLE_X - 1, KNOT_Y] }, span(t, LEAP, PEAK, easeOut)),
    (a: Limb) => mixLimb(a, CHEER, span(t, PEAK + 0.15, LAND + 0.2)),
  ].reduce((arm, step) => step(arm), base)
  const farBase = t < LOOK ? (walking.pose.rightArm ?? HANG) : HANG
  const far = mixLimb(mixLimb(farBase, FAR_REACH, span(t, LEAP, PEAK)), CHEER, span(t, PEAK + 0.15, LAND + 0.2))

  const sad = span(t, FAIL, FAIL + 0.3) * (1 - span(t, CROUCH, CROUCH + 0.2))
  // 見あげる(うしろへ かたむける)。しょんぼりのときは うつむく
  const head = -14 * span(t, LOOK, LOOK + 0.4) * (1 - span(t, FAIL, FAIL + 0.3)) + 8 * sad - 8 * span(t, LEAP, PEAK) * (1 - span(t, PEAK + 0.2, LAND))
  const face = t < LOOK ? 'smile' : t < FAIL ? 'surprised' : t < PEAK - 0.15 ? 'sad' : 'joy'
  return {
    ...walking,
    y: GROUND_Y,
    look: LOOKS.boy,
    lift: JUMP_HEIGHT * airborne + tiptoe + cheerHop,
    face,
    gazeY: t >= LOOK && t < FAIL ? -1 : 0,
    pose: { ...walking.pose, ...sit, leftArm: near, rightArm: far, head },
  }
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 3)
  const kid = kidAt(t)
  const rig = personRig(kid)
  const head = rig.world.head
  const hand = rig.world.arms.left.end
  // リボンを 手に もっている(むすぶ まで)
  const holding = 1 - span(t, PEAK - 0.05, PEAK + 0.15)
  const sway = wave(t, 0.5) * 8

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Pole t={t} />
        <Ribbon t={t} />
        <Person {...kid} />
        {holding > 0 && t >= WALK && (
          <Layer x={hand[0]} y={hand[1]} rotate={sway} opacity={holding}>
            <path d="M-1.1 0 L1.1 0 L1.3 6.4 L0 5 L-1.3 6.4 Z" fill={RIBBON} />
          </Layer>
        )}
        <Sweat t={t} x={head[0] - 4} y={head[1] - 3} show={during(t, FAIL - 0.1, CROUCH, 0.2)} />
        <Hearts t={t} x={head[0] - 6} y={head[1] - 8} show={during(t, LAND + 0.25, INK + 0.2, 0.3)} />
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
    { at: 0, label: '地面が できて、ぼうが 立つ', sound: 'pop' },
    { at: WALK, label: 'リボンを もった 子が あるいてくる' },
    { at: LOOK, label: 'ぼうの 上を 見あげる' },
    { at: TRY, label: 'せのびしても とどかない' },
    { at: CROUCH, label: 'しゃがんで ジャンプ' },
    { at: PEAK, label: '高い所に リボンを むすぶ', sound: 'pop' },
    { at: LAND + 0.2, label: '大よろこび' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '上 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
