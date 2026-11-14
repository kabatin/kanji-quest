/*
 * 市(いち): やねの したに ぬのの はたを たてると、人が あつまって いちに なる。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … やねの てっぺんに たつ かざり ぼう
 *   2画目(一)  … やねの ひさし(のきの はり)。右が 少し 上がっている
 *   3画目(丨)  … ぬのの 左はし
 *   4画目(𠃍)  … ぬの(たれまく)の ぜんたい。上は ぬのを つるす ぼう、右は ぬのの 右はし
 *   5画目(丨)  … 店の まんなかの はしら(やねを ささえ、ぬのの うしろを 通る)
 *
 * ながれ
 *   やねと はしらが できる → 店ばんの女の子が 来て、お客が いなくて しょんぼり
 *   → ぬのの すみを つかんで 下へ ひっぱると、ぬのの はたが ひらく(目じるし ができて 元気になる)
 *   → お客さんが 2人 あるいてきて あつまる → 1人が お金を なげ、店ばんが うけとって 大よろこび
 *   → ほね が ひかって、絵が うすくなり、字「市」が のこる
 *
 * 人は Person。お客は walk で 右から あるいてきて、turnAround で 正面を むく。店ばんは 正面で、手は { to } で ぬのと お金へ。
 * 背景は Backdrop、ためいき は Sigh。店・ぬの・お金 は 場面で 描く。
 *   ぬのは、上の ぼう から まっすぐ たれる。人は、ぬのの よこと 前に 立つ。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, HANG_ARM, LOOKS, mixLimb, Person, personRig, Sigh, turnAround, walk, type Limb, type PersonProps } from '../sceneFigures'

const CHAR = '市'

const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const ROOF = '#e0694c'
const ROOF_DARK = '#c0523a'
const GOLD = '#ffc233'
const CREAM = '#ffe9b0'
const CLOTH = '#5aa5e6'
const CLOTH_LIGHT = '#8cc4f0'
const CLOTH_DARK = '#438bcb'

/** くぎり の時間(秒) */
const ROOF_AT = 0.3
const KEEPER_IN = 0.6
const REACH = 1.5
const PULL_FROM = 2.0
const PULL_TO = 3.0
const CHEER = 3.4
const C1_IN = 3.3
const C1_STOP = 4.6
const C2_IN = 3.9
const C2_STOP = 5.2
const THROW = 5.1
const CATCH = 5.9
const INK = 6.7
const DONE = 9.6
const DURATION = 10

type Pt = readonly [number, number]

/** 店ばんが ひっぱる つかみどころ(ぬのの 左下すみ)。すみは ぬのの したはしに ついてくる */
const CLOTH_TOP = 45
const CLOTH_BOTTOM = 78
const GRIP_X = 26.5
/** 店ばんの 足もと と 背 */
const KEEPER_FEET: Pt = [17, 96.5]
const KEEPER_HEIGHT = 54
const KEEPER_LOOK = { ...LOOKS.little, top: '#f2a53a', bottom: '#6f5a9e', accent: '#e8534a' } as const
/** お客の 足もと(まえの人・うしろの人)と 背 */
const C1_FEET: Pt = [85, 97]
const C2_FEET: Pt = [98, 95.5]
/** 店ばんの 手の かっこう(足もと から 見た 位置。画面の 右 = 人の ひだり手 の がわ) */
const HANG_L: Pt = [-8.5, -11]
const HANG_R: Pt = [8.5, -11]
const UP_L: Pt = [-13, -40]
const UP_R: Pt = [13, -40]
/** お金を なげる はじめ(お客1の 右手の 上)と、うけとる ところ(店ばんの 手の まえ) */
const COIN_FROM: Pt = [C1_FEET[0] - 9, C1_FEET[1] - 33]
const COIN_TO: Pt = [33, 61]

const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/** 店の はしら・やね・ぬの。はしらが のび、やねが ぽんと のり、ぬのは 店ばんが ひっぱると 下へ ひらく。 */
function Stall({ t, unroll }: SceneProps & { readonly unroll: number }) {
  const pole = span(t, 0, 0.5, easeOut)
  const roof = span(t, ROOF_AT, ROOF_AT + 0.5, backOut)
  const sway = t > PULL_TO ? wave(t, 2.4) * 0.8 : 0
  return (
    <>
      <Layer scaleY={pole} origin={[54, 97.5]}>
        <Bone char={CHAR} n={5} color={BARK} width={3.6} />
        <rect x="52.4" y="26" width="3.2" height="9" fill={BARK} />
      </Layer>
      <Layer scaleY={roof} origin={[54, 29]}>
        <path d="M12 31 Q32 26 54 14.8 Q77 19.5 99 25.8 L97 28 L14 33 Z" fill={ROOF} />
        <path d="M54 14.8 Q77 19.5 99 25.8 L97 28 L54 30 Z" fill={ROOF_DARK} />
        <Bone char={CHAR} n={2} color={BARK_DARK} width={4.6} />
        <Bone char={CHAR} n={1} color={CREAM} width={3} />
        <circle cx="52.8" cy="10.6" r="2.4" fill={GOLD} />
      </Layer>
      {/* ぬの: 上の ぼう から たれる */}
      <Layer opacity={unroll} rotate={sway} origin={[56, CLOTH_TOP]}>
        <Layer scaleY={unroll} origin={[56, CLOTH_TOP]}>
          <rect x="28" y={CLOTH_TOP + 1} width="56" height={CLOTH_BOTTOM - CLOTH_TOP - 1} rx="3" fill={CLOTH} />
          <rect x="28" y="62" width="56" height="4.2" fill={CLOTH_LIGHT} />
          <path d={`M28 ${CLOTH_BOTTOM - 4} H84 V${CLOTH_BOTTOM - 3} Q84 ${CLOTH_BOTTOM} 81 ${CLOTH_BOTTOM} H31 Q28 ${CLOTH_BOTTOM} 28 ${CLOTH_BOTTOM - 3} Z`} fill={CLOTH_DARK} />
        </Layer>
      </Layer>
      <Layer opacity={pole}>
        <rect x="26.5" y={CLOTH_TOP - 1.8} width="59" height="3.6" rx="1.8" fill={BARK_DARK} />
        <circle cx="26.5" cy={CLOTH_TOP} r="2.4" fill={BARK} />
        <circle cx="85.5" cy={CLOTH_TOP} r="2.4" fill={BARK} />
      </Layer>
    </>
  )
}

/** お客1が 左手の お金を なげ、店ばんの ところへ ひらひら とんでいく。 */
function Coin({ t }: SceneProps) {
  if (t < C1_STOP + 0.2 || t > CATCH + 0.15) return null
  const held = t < THROW
  const p = span(t, THROW, CATCH, easeInOut)
  const x = held ? COIN_FROM[0] : COIN_FROM[0] + (COIN_TO[0] - COIN_FROM[0]) * p
  const y = held ? COIN_FROM[1] - 4 - Math.abs(wave(t, 0.5)) * 0.8 : COIN_FROM[1] + (COIN_TO[1] - COIN_FROM[1]) * p - Math.sin(p * Math.PI) * 14
  const flip = held ? 1 : Math.max(0.25, Math.abs(Math.cos(p * 16)))
  const appear = span(t, C1_STOP + 0.2, C1_STOP + 0.5)
  return (
    <Layer x={x} y={y} scaleX={flip} scaleY={1} opacity={appear}>
      <circle r="2.6" fill={GOLD} />
      <circle r="1.5" fill="none" stroke="#e29a10" strokeWidth="0.6" />
    </Layer>
  )
}

/** お金を うけとった しゅんかんの きらり。 */
function Cheer({ t }: SceneProps) {
  const p = span(t, CATCH, CATCH + 0.7)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p}>
      {[0, 1, 2].map((i) => (
        <Star key={i} cx={20 + i * 8 + Math.sin(i * 2) * 2} cy={46 - p * 8 - i * 2} r={2.6 * (1 - p * 0.3)} color={i === 1 ? GOLD : '#ffffff'} spin={p * 160 + i * 50} />
      ))}
    </g>
  )
}

/** 店ばんの おんな の子。主役。しょんぼり → ぬのを ひっぱる → げんき → お金を うけとって 大よろこび。 */
function keeperProps(t: number): PersonProps {
  const mood = t < PULL_FROM ? 'sad' : t < PULL_TO ? 'smile' : 'joy'
  const toAbs = (p: Pt): Pt => [KEEPER_FEET[0] + p[0] * 1.25, KEEPER_FEET[1] + p[1] * 1.25]
  const grabStart: Pt = [GRIP_X, CLOTH_TOP + 2]
  const gripY = mix(t, PULL_FROM, PULL_TO, CLOTH_TOP + 2, CLOTH_BOTTOM - 2, easeOut)
  const grabNow: Pt = [GRIP_X, gripY]
  const catchPose: Pt = toAbs([13, -28])
  const hangR = toAbs(HANG_R)
  const upR = toAbs(UP_R)
  // 画面の 右の 手(人の ひだり手): ぬのを つかんで ひっぱり、お金を うけとる
  let handR: Pt = hangR
  if (t >= REACH && t < PULL_FROM) handR = lerpPt(hangR, grabStart, span(t, REACH, PULL_FROM, easeInOut))
  else if (t >= PULL_FROM && t < PULL_TO) handR = grabNow
  else if (t >= PULL_TO && t < CHEER) handR = lerpPt(grabNow, upR, span(t, PULL_TO, CHEER, easeInOut))
  else if (t >= CHEER && t < C1_STOP + 0.2) handR = lerpPt(upR, toAbs([12, -36]), span(t, CHEER, CHEER + 0.3))
  if (t >= C1_STOP && t < THROW) handR = toAbs([12 + wave(t, 0.5) * 4, -36 - Math.abs(wave(t, 0.5)) * 2])
  else if (t >= THROW && t < CATCH) handR = lerpPt(toAbs([12, -36]), catchPose, span(t, THROW, THROW + 0.5, easeOut))
  else if (t >= CATCH) handR = lerpPt(catchPose, upR, span(t, CATCH, CATCH + 0.3, easeOut))
  // 画面の 左の 手(人の 右手): ばんざい
  const hangL = toAbs(HANG_L)
  const upL = toAbs(UP_L)
  let handL: Pt = hangL
  if (t >= PULL_TO && t < CHEER) handL = lerpPt(hangL, upL, span(t, PULL_TO, CHEER, easeInOut))
  else if (t >= CHEER && t < CHEER + 0.4) handL = lerpPt(upL, hangL, span(t, CHEER, CHEER + 0.4, easeInOut))
  else if (t >= CATCH) handL = lerpPt(hangL, upL, span(t, CATCH, CATCH + 0.3, easeOut))
  const hop = Math.sin(span(t, PULL_TO, PULL_TO + 0.6) * Math.PI) * 3 + Math.sin(span(t, CATCH, CATCH + 0.6) * Math.PI) * 3.5
  const finalHop = t > CATCH + 0.6 ? Math.abs(wave(t, 0.7)) * 1.2 : 0
  // くびを きょろきょろ(お客を さがす)
  const look = t < REACH ? wave(t, 1.6) * 3 : 0
  return {
    x: KEEPER_FEET[0] + look * 0.2,
    y: KEEPER_FEET[1],
    build: 'child',
    height: KEEPER_HEIGHT,
    facing: 'front',
    look: KEEPER_LOOK,
    face: mood,
    gaze: t < REACH ? look / 3 : 0,
    lift: hop + finalHop,
    lean: look * 0.5,
    pose: { rightArm: { to: handL }, leftArm: { to: handR } },
  }
}

type CustomerSpec = {
  readonly feet: Pt
  readonly height: number
  readonly enter: number
  readonly stop: number
  readonly fromX: number
  readonly look: PersonProps['look']
}

/** あるいてきて、立ちどまって 正面を むき、わくわく はねる お客。 */
function customerProps(t: number, spec: CustomerSpec, throwing: boolean): PersonProps {
  const { feet, height, enter, stop, fromX, look } = spec
  const w = walk(t, { from: fromX, to: feet[0], start: enter, end: stop, build: 'child', height, armSwing: 18 })
  const turn = turnAround(t, stop, 'left', 'front')
  const arrived = t >= stop + 0.15
  const excited = span(t, stop + 0.5, stop + 0.8, easeOut)
  const raised: Limb = mixLimb(HANG_ARM, { swing: 150, bend: 8 }, excited)
  // お金を なげる お客: 画面の 左の 手(人の 右手)に お金を もって かまえる
  const coinHand = lerpPt([feet[0] - 8, feet[1] - height * 0.5], COIN_FROM, span(t, C1_STOP, C1_STOP + 0.4, easeOut))
  const holding = throwing && t >= C1_STOP && t < THROW + 0.3
  const pose = arrived ? { leftArm: raised, rightArm: holding ? { to: coinHand } : raised } : w.pose
  const bounce = t > stop ? Math.abs(wave(t, 0.8, stop)) * 1.6 : 0
  return {
    x: w.x,
    y: feet[1],
    build: 'child',
    height,
    facing: arrived || t >= stop ? turn.facing : w.facing,
    squash: turn.squash,
    look,
    face: t < stop ? 'smile' : 'joy',
    lift: bounce,
    pose,
  }
}

const CUSTOMER_1: CustomerSpec = { feet: C1_FEET, height: 42, enter: C1_IN, stop: C1_STOP, fromX: 130, look: { ...LOOKS.boy, top: '#ef7a8a', bottom: '#3e5c86' } }
const CUSTOMER_2: CustomerSpec = { feet: C2_FEET, height: 38, enter: C2_IN, stop: C2_STOP, fromX: 135, look: { ...LOOKS.boy, hair: '#8a5a3a', hat: 'cap', hatColor: '#e8534a', top: '#7bc86c', bottom: '#4a6a8a' } }

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)
  const unroll = span(t, PULL_FROM, PULL_TO, easeOut)
  const appear = span(t, KEEPER_IN, KEEPER_IN + 0.5, backOut)
  const keeper = keeperProps(t)
  const head = personRig(keeper).world.head
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[97, 10]} clouds={[[-2, 14, 0.9]]} tufts={[6, 40, 70, 105]} />
        <Stall t={t} unroll={unroll} />
        <Sigh x={head[0] - 2} y={head[1] + 4} p={span(t, 0.9, 1.9, easeOut)} show={during(t, 0.9, 1.9, 0.25)} dir={-1} />
        <Layer opacity={appear}>
          <Person {...keeper} />
        </Layer>
        <Person {...customerProps(t, CUSTOMER_2, false)} />
        <Person {...customerProps(t, CUSTOMER_1, true)} />
        <Coin t={t} />
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
    { at: 0, label: 'はしらが たち、やねが のる', sound: 'pop' },
    { at: KEEPER_IN, label: '店ばんの女の子。お客が いなくて しょんぼり' },
    { at: PULL_FROM, label: 'ぬのを ひっぱって、はたが ひらく', sound: 'pop' },
    { at: C1_IN, label: 'お客さんが あるいてくる' },
    { at: THROW, label: 'お金を なげて、店ばんが うけとる', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '市 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
