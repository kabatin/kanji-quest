/*
 * 場(ば): 広い 土の ばしょ。ひなたの 土の上に、「ここだよ」と しるしを たてる。
 *
 * ほね(画と絵の対応)
 *   1画目(一)    … しるしの いた(ぼうに 打ちつけた よこ長の いた)
 *   2画目(丨)    … しるしの ぼう(土に ささる)
 *   3画目(ノ)    … ぼうが たつ 土もりの 上の ライン(土の ななめの ひょうめん)
 *   4〜7画目     … お日さま(日の わく。まるい 太陽を そこに おく)
 *   8画目(一)    … 広い 野原の ちへいせん(お日さまは ここから のぼる)
 *   9・11・12画目 … 野原に さしこむ ひかりの すじ
 *   10画目       … ひかりが 広がった ひなた(まるい ひなたの ふち)
 *
 * ながれ
 *   くらい 朝。しょんぼりした 子が、しるしの ぼうを かついで あるいてくる(土の 場所を さがしている)
 *   → 地平線から お日さまが のぼり、野原いっぱいに ひなたが 広がる → 子が びっくり、そして にっこり
 *   → 「ここに しよう!」と ぼうを 土もりに ぐいっと さす(つちけむり)
 *   → 手を あげて ぴょんぴょん よろこぶ → ほね が ひかって、絵が うすくなり 字「場」が のこる
 *
 * 人は Person。あるきは walk(左へ)。ぼうを もつ 両手は { to } で ぼうの 手もとへ、ぼうは 子の うしろに 描く(手が ぼうの まえ)。
 * さしたあと ぼうから 手を はなして ばんざい(posture('banzai'))。ためいき・つちけむり・雲・小鳥 は 共通部品。
 */
import { during, easeIn, easeOut, inkTiming, span, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Bird, Clouds, Dust, HANG_ARM, LOOKS, mixLimb, PALETTE, Person, personRig, posture, Sigh, walk } from '../sceneFigures'
import type { Expression } from '../sceneFigures'

const CHAR = '場'

const SKY_DIM = '#5b6d8a'
const SUN = '#ffd24a'
const SUN_CORE = '#ffe784'
const FIELD = '#c5e8a9'
const FIELD_FAR = '#e2f2d2'
const LEAF = PALETTE.leaf
const LEAF_DARK = '#3f9c59'
const EARTH = '#b27b52'
const EARTH_DARK = '#966340'
const EARTH_LIGHT = '#c8956a'
const WOOD = '#b8834f'
const PLANK = '#e6b878'
const NAIL = '#6b4a36'
const SUNNY = '#fff1a6'
const BEAM = '#ffd24a'
const CHILD_LOOK = { ...LOOKS.boy, top: '#e8654f', bottom: '#3e5c86' } as const

/** くぎり の時間(秒) */
const ENTER = 0.5
const ARRIVE = 3.4
/** お日さまを みつけて、のぼりはじめる */
const SUNRISE = 3.8
const NOTICE = 3.9
const SMILE = 4.9
/** ぼうを ぐいっと さす(3回に わけて 下げる) */
const PUSH = 5.3
const PLANTED = 6.05
/** よろこんで ぴょんぴょん */
const CHEER = 6.4
const INK = 7.3
const DONE = 10.4
const DURATION = 11

type Pt = readonly [number, number]

/** 子の 足もと(y)・背の高さ・とまる x */
const FEET_Y = 70
const CHILD_HEIGHT = 40
const CHILD_STOP = 44
/** ぼうの よこ(子の まえ)。ぼうは 2画目の x のあたり */
const GRIP_X = -14.7
/** ぼうを かついで あるくとき、地面から うかせる 高さ と、手を かける 高さ */
const CARRY = 5
const GRIP_HEIGHT = 19
/** 土もりの 上の ぼうの 根もと(2画目の おわり)と、お日さまの いち */
const STAKE_FOOT: Pt = [29.3, 62]
const SUN_HOME: Pt = [67.5, 26]
const SUN_R = 10.5

/** 場所を ひろげる 野原と 土もり(絵の うしろ側) */
function Land({ t }: { readonly t: number }) {
  const appear = span(t, 0, 0.7, easeOut)
  return (
    <Layer opacity={appear} origin={[54.5, 98]} scaleY={0.9 + 0.1 * appear}>
      {/* ちへいせん(8画目)から下が 野原。とおくは 少し うすい色 */}
      <path d="M-2 48.2 L43.6 47.8 C63 46.6 74 45 89.1 44 C93 43.8 95.9 44.1 96 44.3 L111 44.6 V101 H-2 Z" fill={FIELD} />
      <path d="M-2 48.2 L43.6 47.8 C63 46.6 74 45 89.1 44 C93 43.8 95.9 44.1 96 44.3 L111 44.6 V54 C80 52 40 56 -2 54 Z" fill={FIELD_FAR} />
      <circle cx="104" cy="43" r="4.4" fill={LEAF_DARK} />
      <circle cx="107" cy="44" r="3.2" fill={LEAF} />
      <circle cx="6" cy="46.5" r="3.6" fill={LEAF_DARK} />
      <circle cx="9.4" cy="47.2" r="2.6" fill={LEAF} />
      {[10, 34, 60, 98, 104].map((x, i) => (
        <path key={x} d={`M${x} ${95 + (i % 2) * 2} l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
      {/* 土もり。うえの ふち が 3画目の ななめの ライン */}
      <path d="M-4 72 L13.5 68.6 C15.25 70 16.64 69.96 19.17 68.55 C20.66 67.71 34.17 61.28 40.5 57.3 C46 60.5 50 66 51 72 Q52 80 38 80 L-4 80 Z" fill={EARTH} />
      <path d="M-4 76 Q20 72 40 79 L38 80 L-4 80 Z" fill={EARTH_DARK} />
      <path d="M13.5 68.6 C15.25 70 16.64 69.96 19.17 68.55 C20.66 67.71 34.17 61.28 40.5 57.3" fill="none" stroke={LEAF} strokeWidth="2.2" strokeLinecap="round" />
      <ellipse cx="14" cy="75" rx="2" ry="1.2" fill={EARTH_LIGHT} />
      <ellipse cx="34" cy="73" rx="2.6" ry="1.5" fill={EARTH_LIGHT} />
      <ellipse cx="24" cy="77" rx="1.5" ry="0.9" fill={EARTH_DARK} />
    </Layer>
  )
}

/** お日さま。ちへいせん の うしろから のぼる(野原を あとから かさねて かくす)。 */
function RisingSun({ t }: { readonly t: number }) {
  const rise = span(t, SUNRISE, SUNRISE + 1.8, easeOut)
  const y = SUN_HOME[1] + (1 - rise) * 32
  return (
    <>
      <Layer opacity={rise} rotate={t * 14} origin={[SUN_HOME[0], y]}>
        {Array.from({ length: 10 }, (_, i) => (
          <rect key={i} x={SUN_HOME[0] - 0.9} y={y - SUN_R - 6.8} width="1.8" height="4.4" rx="0.9" fill={SUN} transform={`rotate(${i * 36} ${SUN_HOME[0]} ${y})`} />
        ))}
      </Layer>
      <circle cx={SUN_HOME[0]} cy={y} r={SUN_R * Math.min(rise * 3, 1)} fill={SUN} />
      <circle cx={SUN_HOME[0] - 1.6} cy={y - 1.6} r={SUN_R * 0.62 * Math.min(rise * 3, 1)} fill={SUN_CORE} />
    </>
  )
}

/** ひなた(10画目の ふち)と、ひかりの すじ(9・11・12画目)。お日さまが のぼると 野原に ひろがる。 */
function Sunlight({ t }: { readonly t: number }) {
  const spread = span(t, SUNRISE + 0.6, SUNRISE + 2.2, easeOut)
  if (spread <= 0) return null
  return (
    <>
      <Layer opacity={spread * 0.85} scaleX={0.3 + 0.7 * spread} scaleY={0.3 + 0.7 * spread} origin={[54.9, 58]}>
        <path d="M54.87 58.05 c2.13 0.33 3.68 0.08 5.42 -0.04 c6.96 -0.5 23.33 -3.25 27.59 -3.74 c3.27 -0.37 4.98 1.05 4.45 4.29 C91 66.75 86.15 83.96 78.92 92.78 c-2.17 2.65 -3.4 -0.44 -5.34 -2.37 Q44 90 54.87 58.05 Z" fill={SUNNY} />
      </Layer>
      <Layer opacity={spread}>
        <Bone char={CHAR} n={9} color={BEAM} width={2.2} opacity={0.9} to={spread} />
        <Bone char={CHAR} n={11} color={BEAM} width={2.2} opacity={0.9} to={spread} />
        <Bone char={CHAR} n={12} color={BEAM} width={2.2} opacity={0.9} to={spread} />
      </Layer>
    </>
  )
}

/** しるしの ぼう(2画目)と いた(1画目)。dx・dy は 子が もって うごかす ぶん。 */
function Stake({ dx, dy }: { readonly dx: number; readonly dy: number }) {
  return (
    <Layer x={dx} y={dy}>
      <Bone char={CHAR} n={2} color={WOOD} width={4} />
      <Bone char={CHAR} n={1} color={PLANK} width={6.4} />
      <circle cx="17.6" cy="41" r="0.9" fill={NAIL} />
      <circle cx="38.6" cy="38.4" r="0.9" fill={NAIL} />
      {/* いたの しるし(ここだよ) */}
      <Star cx={28.2} cy={39.6} r={2.6} color="#e8534a" />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 12)

  // 朝の くらさ: お日さまが のぼると 明るくなる
  const dawn = span(t, SUNRISE, SUNRISE + 1.6)

  // あるく: 右から しるしの ぼうを かついで きて、土もりの 前で 止まる(左むき)
  const w = walk(t, { from: 150, to: CHILD_STOP, start: ENTER, end: ARRIVE, build: 'child', height: CHILD_HEIGHT, step: 13 })

  // ぼうを さす: 3回に わけて ぐいっと 下げる(かついで いる間は うかせる)
  const lift = CARRY - 3.2 * span(t, PUSH, PUSH + 0.25, easeIn) + 1.8 * span(t, PUSH + 0.25, PUSH + 0.5, easeOut) - 3.6 * span(t, PUSH + 0.5, PLANTED, easeIn)

  // 気持ち: しょんぼり → お日さまに びっくり → にっこり → 大よろこび
  const face: Expression = t < NOTICE ? 'sad' : t < SMILE ? 'surprised' : t < CHEER ? 'smile' : 'joy'
  const head = 9 - 17 * span(t, NOTICE, NOTICE + 0.3) + 8 * span(t, SMILE, SMILE + 0.4) - 4 * span(t, CHEER, CHEER + 0.3)

  // ぼうを もつ 手(ぼうの よこ)。よろこぶ とき は 手を はなして ばんざい
  const release = span(t, CHEER - 0.1, CHEER + 0.2, easeOut)
  const hop = t >= CHEER && t < CHEER + 0.8 ? Math.abs(Math.sin(((t - CHEER) / 0.4) * Math.PI)) * 5 : 0
  const gripX = w.x + GRIP_X
  const gripY = FEET_Y - GRIP_HEIGHT - lift
  const banzai = posture('banzai', 'left')
  const nearArm = mixLimb({ to: [gripX + 0.3, gripY + 0.4] }, banzai.rightArm ?? HANG_ARM, release)
  const farArm = mixLimb({ to: [gripX - 0.3, gripY - 0.4] }, banzai.leftArm ?? HANG_ARM, release)
  const planted = t >= PLANTED
  const stake = planted ? <Stake dx={0} dy={0} /> : <Stake dx={gripX - STAKE_FOOT[0]} dy={-lift} />
  const kid = { ...w, y: FEET_Y, look: CHILD_LOOK, face, lift: hop, pose: { ...w.pose, rightArm: nearArm, leftArm: farArm, head } } as const
  const headAt = personRig({ ...kid, pose: {} }).world.head

  return (
    <>
      <Layer opacity={ink.picture}>
        <RisingSun t={t} />
        <Land t={t} />
        <Clouds t={t} at={[[12, 14, 1], [94, 21, 0.85]]} speed={0.9} />
        <Sunlight t={t} />
        {/* ぼうの 根もとの ほった土 */}
        {planted && <ellipse cx={STAKE_FOOT[0]} cy={STAKE_FOOT[1] + 1.6} rx="5.4" ry="1.8" fill={EARTH_LIGHT} />}
        <Dust x={STAKE_FOOT[0]} y={STAKE_FOOT[1] + 1.4} p={span(t, PUSH + 0.25, PUSH + 0.75, easeOut)} reach={5} />
        <Dust x={STAKE_FOOT[0]} y={STAKE_FOOT[1] + 1.4} p={span(t, PLANTED - 0.05, PLANTED + 0.45, easeOut)} reach={7} />
        {stake}
        <Layer opacity={span(t, ENTER - 0.1, ENTER + 0.2)}>
          <Person {...kid} />
        </Layer>
        <Sigh x={headAt[0] - 6} y={headAt[1]} p={span(t, ARRIVE + 0.1, SUNRISE + 0.4)} show={during(t, ARRIVE + 0.1, SUNRISE + 0.4, 0.2)} />
        <Bird x={116 - span(t, SUNRISE + 0.8, SUNRISE + 3.4) * 128} y={10 + Math.sin(span(t, SUNRISE + 0.8, SUNRISE + 3.4) * 7) * 2} t={t} flying facing="left" size={0.9} />
        <rect x="0" y="0" width="109" height="109" fill={SKY_DIM} opacity={0.3 * (1 - dawn)} />
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Layer scale={1 + Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06} origin={[54.5, 54.5]}>
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
    { at: 0, label: '野原と 土もりが あらわれる', sound: 'pop' },
    { at: ENTER, label: 'しょんぼりした 子が、しるしの ぼうを かついで あるいてくる' },
    { at: SUNRISE, label: 'お日さまが のぼり、野原に ひなたが 広がる', sound: 'pop' },
    { at: SMILE, label: '子が にっこり。ここだよ、と ぼうを 土に さす' },
    { at: CHEER, label: 'ぴょんぴょん よろこぶ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '場 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
