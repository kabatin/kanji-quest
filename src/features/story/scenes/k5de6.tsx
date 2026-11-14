/*
 * 左(ひだり): どうぐを しっかり もつ 手。
 *
 * ほね(画と絵の対応)
 *   1・2画目(ナ) … 子どもの 手。1画目は、ひだり手で しっかり もった 木づちの えと うで(まっすぐ まえへ)
 *                  (2画目の ななめの線は、まえに のりだした 子どもの せなか あたり)
 *   3画目(一)   … こうさくだいの 上の いた
 *   4画目(丨)   … こうさくだいの はしら
 *   5画目(一)   … こうさくだいの 下の どだい
 *   (3〜5画目で「工」= 大工さんの どうぐの かたち)
 *
 * ながれ
 *   子どもが 木づちを かついで やってくる → こうさくだいの 上の いたが ぐらぐら(くぎが ういている)
 *   → 子どもは こまった顔 → 木づちを ふりあげて、トン・トン・トン と くぎを うつ
 *   → いたが ぴたっと とまる → ひだり手に 赤い わっか(ひだり手の しるし)。木づちを しっかり もって にっこり
 *   → ほね が ひかって、絵が うすくなり、字「左」が のこる
 *
 * 子どもは Person(あるきは walk、木づちを もつ 手は { to } で 点に おく)。木づちは held で 手に もたせる。
 * 背景は Backdrop、あせ は Sweat。こうさくだい・くぎ・木づち・赤い わっか は 場面で 描く。
 *   くぎは、いたに さしてあって、うつたびに 少しずつ 入っていく。
 *   木づちを しっかり もった さいごの しゅんかんだけ、うで と えが 1画目の線に だいたい重なる。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, LOOKS, Person, personRig, Sweat, walk, type PersonProps } from '../sceneFigures'

const CHAR = '左'

const WOOD_BOARD = '#d29a5e'
const WOOD_POST = '#b9814b'
const WOOD_BASE = '#9a6638'
const WOOD_DARK = '#7c4f2a'
const HANDLE = '#a8723f'
const MALLET_HEAD = '#c98f55'
const MALLET_BAND = '#7c4f2a'
const NAIL = '#9aa5b3'
const NAIL_LIGHT = '#d8e0ea'
const BAND_RED = '#e8534a'

/** くぎり の時間(秒) */
const WALK = 0.5
const ARRIVE = 1.8
const RAISE = 2.7
/** トン・トン・トン と うつ しゅんかん */
const HITS: readonly number[] = [3.55, 4.3, 5.05]
const HOLD = 5.9
const INK = 6.5
const DONE = 8.8
const DURATION = 9.4

/** 子どもの こし の x(立ちどまった ところ)と 背。手の 点は、この こし から 見た 位置 */
const KID_X = 27
const KID_HEIGHT = 70
const KID_LOOK = { ...LOOKS.boy, top: '#f0a23c', bottom: '#3e5c86' } as const

/** 木づちの えの ながさ(手 から 先の あたま まで) */
const MALLET = 34
/** くぎの いち(いたの 上) */
const NAIL_X = 72
const BOARD_TOP = 59.5
const POST_TOP: readonly [number, number] = [61.5, 62]

type HandPose = { readonly hand: readonly [number, number]; readonly mallet: number }

/** もつ かっこう。mallet は えの むき(ま下から まえへ 何度か) */
const CARRY: HandPose = { hand: [28, 56], mallet: 30 }
const UP: HandPose = { hand: [46, 30], mallet: 125 }
const STRIKE: HandPose = { hand: [38, 48], mallet: 80 }
/** 1画目の 線と だいたい 同じ: 手から えが ほぼ まっすぐ まえへ */
const FIRM: HandPose = { hand: [50, 38], mallet: 96 }

const lerpPose = (t: number, from: number, to: number, a: HandPose, b: HandPose, ease = easeInOut): HandPose => ({
  hand: [mix(t, from, to, a.hand[0], b.hand[0], ease), mix(t, from, to, a.hand[1], b.hand[1], ease)],
  mallet: mix(t, from, to, a.mallet, b.mallet, ease),
})

/** 木づちを もつ 手の うごき。ふりあげ → うつ を 3回 → しっかり もつ */
function handPoseAt(t: number): HandPose {
  if (t < RAISE) return CARRY
  const firstReady = HITS[0] - 0.25
  if (t < firstReady) return lerpPose(t, RAISE, firstReady, CARRY, UP)
  for (let i = 0; i < HITS.length; i += 1) {
    // 2回目からは、うった あと 手を もどして(ready まで)、また ふりおろす
    const ready = i === 0 ? firstReady : HITS[i - 1] + 0.38
    if (i > 0 && t < ready) return lerpPose(t, HITS[i - 1], ready, STRIKE, UP, easeOut)
    if (t < HITS[i]) return lerpPose(t, ready, HITS[i], UP, STRIKE, easeIn)
  }
  const last = HITS[HITS.length - 1] + 0.12
  return t < last ? STRIKE : lerpPose(t, last, HOLD, STRIKE, FIRM)
}

/* ───────── こうさくだい(工) ───────── */

/** 木づちで うった回数(0〜3)。うつたびに くぎが 入り、いたの ぐらぐら が へる。 */
function hitCount(t: number): number {
  return HITS.filter((hit) => t >= hit).length
}

function Stand({ t }: SceneProps) {
  const built = span(t, 0.05, 0.6, backOut)
  const n = hitCount(t)
  // いたは、くぎが うきぎみ の間 ぐらぐら ゆれる(うつ たびに、ゆれが 小さくなる)
  const settle = n === 0 ? 1 : n === 1 ? 0.6 : n === 2 ? 0.28 : 0
  const shake = t < 0.9 ? 0 : wave(t, 0.55) * 9 * settle * span(t, 0.9, 1.3)
  const nailHeight = 6 - 2 * n
  // うつ しゅんかん、くぎが ぐっと しずむ
  const hitGlow = HITS.map((hit) => during(t, hit, hit + 0.35, 0.1))
  return (
    <Layer scaleY={built} scaleX={0.7 + 0.3 * built} origin={[61.5, 96]}>
      <ellipse cx="61.5" cy="97.8" rx="36" ry="2.6" fill="#000000" opacity="0.1" />
      <Bone char={CHAR} n={5} color={WOOD_BASE} width={5.6} />
      <Bone char={CHAR} n={4} color={WOOD_POST} width={6} />
      {/* はしらの こうつなぎ(ねじ) */}
      <circle cx="60.5" cy="75" r="0.9" fill={WOOD_DARK} />
      <circle cx="60.5" cy="84" r="0.9" fill={WOOD_DARK} />
      <Layer rotate={shake} origin={POST_TOP}>
        <Bone char={CHAR} n={3} color={WOOD_BOARD} width={5.6} />
        <path d="M48 61 q4 -1.2 8 -0.6 M66 60.2 q4 -0.6 8 -1" fill="none" stroke={WOOD_DARK} strokeWidth="0.7" strokeLinecap="round" opacity="0.6" />
        {/* くぎ(あたまが 上に ういている) */}
        <g transform={`translate(${NAIL_X} ${BOARD_TOP})`}>
          <rect x="-0.7" y={-nailHeight} width="1.4" height={nailHeight + 2} fill={NAIL} />
          <rect x="-2.2" y={-nailHeight - 1.2} width="4.4" height="1.6" rx="0.8" fill={NAIL_LIGHT} />
        </g>
        {hitGlow.map((g, i) =>
          g > 0 ? (
            <Star key={HITS[i]} cx={NAIL_X} cy={BOARD_TOP - 4} r={5.5 * g + 1} color="#ffe27a" spin={t * 200} />
          ) : null,
        )}
      </Layer>
    </Layer>
  )
}

/** 木づち。手が さきに あり、えは 手より すこし 後ろから のびる。 */
function Mallet({ hand, angle }: { readonly hand: readonly [number, number]; readonly angle: number }) {
  const rotate = 90 - angle
  return (
    <g transform={`translate(${hand[0]} ${hand[1]}) rotate(${rotate})`}>
      <rect x="-5" y="-1.6" width={MALLET + 5} height="3.2" rx="1.6" fill={HANDLE} />
      <rect x={MALLET - 5} y="-6.6" width="11" height="13.2" rx="2.4" fill={MALLET_HEAD} />
      <rect x={MALLET - 5} y="-6.6" width="2.6" height="13.2" rx="1.2" fill={MALLET_BAND} opacity="0.55" />
      <rect x={MALLET + 4.2} y="-6.6" width="1.8" height="13.2" rx="0.9" fill={MALLET_BAND} opacity="0.55" />
    </g>
  )
}

/** 木づちを うった しゅんかんの ほこり(ちいさな 丸)。 */
function Puffs({ t }: SceneProps) {
  return (
    <>
      {HITS.map((hit) => {
        const p = span(t, hit, hit + 0.45, easeOut)
        if (p <= 0 || p >= 1) return null
        return (
          <g key={hit} opacity={1 - p} fill="#ffffff" stroke="#e3e8ee" strokeWidth="0.5">
            <circle cx={NAIL_X - 4 - p * 6} cy={BOARD_TOP - 1 - p * 4} r={1 + p * 1.4} />
            <circle cx={NAIL_X + 5 + p * 6} cy={BOARD_TOP - 1 - p * 3} r={0.9 + p * 1.2} />
          </g>
        )
      })}
    </>
  )
}

/** うれしい「ぴかっ」: いたが とまった あとの かがやき。 */
function Shine({ t }: SceneProps) {
  const p = span(t, HITS[2] + 0.2, HITS[2] + 1.1, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p}>
      <Star cx={44 + p * 2} cy={53 - p * 4} r={3 + p * 2} color="#ffd95a" spin={p * 120} />
      <Star cx={80 - p * 2} cy={53 - p * 5} r={2.4 + p * 1.6} color="#ffffff" spin={-p * 120} />
    </g>
  )
}

/** 手くびの 赤い わっか(ひだり手の しるし)。手の すぐ 手前の ひじがわ に 巻く */
function WristBand({ hand, elbow }: { readonly hand: readonly [number, number]; readonly elbow: readonly [number, number] }) {
  const at = (k: number) => [hand[0] + (elbow[0] - hand[0]) * k, hand[1] + (elbow[1] - hand[1]) * k] as const
  const a = at(0.3)
  const b = at(0.5)
  return <path d={`M${a[0]} ${a[1]} L${b[0]} ${b[1]}`} stroke={BAND_RED} strokeWidth="6" strokeLinecap="butt" />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)

  // やってくる: 左から あるいて、とまる
  const w = walk(t, { from: KID_X - 50, to: KID_X, start: WALK, end: ARRIVE, build: 'child', height: KID_HEIGHT, armSwing: 18 })
  const mood = t < RAISE ? 'worried' : t < HITS[2] + 0.1 ? 'strain' : 'smile'
  const pose = handPoseAt(t)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  const base: PersonProps = {
    ...w,
    y: 96,
    look: KID_LOOK,
    face: mood,
    // 木づちを もつ のは ひだり手(右むき では てまえ の 手)。手は 点に おく
    pose: { ...w.pose, leftArm: { to: [w.x + pose.hand[0] - KID_X, pose.hand[1]] } },
  }
  const rig = personRig(base)
  const hand = rig.world.arms.left.end
  const elbow = rig.world.arms.left.mid
  const head = rig.world.head

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[93, 13]} clouds={[[6, 12, 1], [60, 8, 0.9]]} tufts={[8, 46, 100]} />
        <Stand t={t} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <Person {...base} held={<Mallet hand={hand} angle={pose.mallet} />} />
          <WristBand hand={hand} elbow={elbow} />
          <Sweat t={t} x={head[0] - 5} y={head[1] - 6} show={during(t, ARRIVE, RAISE, 0.25)} />
        </Layer>
        <Puffs t={t} />
        <Shine t={t} />
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
    { at: 0, label: 'こうさくだいが できる', sound: 'pop' },
    { at: WALK, label: '子どもが 木づちを もって やってくる' },
    { at: ARRIVE, label: 'いたが ぐらぐら。こまった' },
    { at: RAISE, label: '木づちを ふりあげて、トン・トン・トン', sound: 'pop' },
    { at: HOLD, label: 'いたが とまった。ひだり手で しっかり もつ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '左 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
