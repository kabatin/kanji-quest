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
 * 人と どうぐは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる(手が とどく ところへ、2本の ほねで 計算する)。
 *   くぎは、いたに さしてあって、うつたびに 少しずつ 入っていく。
 *   木づちを しっかり もった さいごの しゅんかんだけ、うで と えが 1画目の線に だいたい重なる。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '左'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#f0a23c'
const TUNIC_DARK = '#d98a26'
const TUNIC_FAR = '#bd7620'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
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
const LEAF = '#55b86e'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'

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

/** かた(うでの じく)と、うでの 2本の ながさ */
const SHOULDER: readonly [number, number] = [27, 40]
const UPPER = 11
const FORE = 13
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

/** 2本の ほね(かた → ひじ → 手)。ひじ は 下がわ に まがる。 */
function elbowFor(hand: readonly [number, number]): readonly [number, number] {
  const dx = hand[0] - SHOULDER[0]
  const dy = hand[1] - SHOULDER[1]
  const reach = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(UPPER - FORE) + 0.01), UPPER + FORE - 0.01)
  const base = Math.atan2(dy, dx)
  const cosA = (UPPER * UPPER + reach * reach - FORE * FORE) / (2 * UPPER * reach)
  const a = base + Math.acos(Math.min(Math.max(cosA, -1), 1))
  return [SHOULDER[0] + UPPER * Math.cos(a), SHOULDER[1] + UPPER * Math.sin(a)]
}

/** てがとどく ところまで しか うでは のびない: 手の いちを、とどく はんいに おさめる */
function reachableHand(hand: readonly [number, number]): readonly [number, number] {
  const dx = hand[0] - SHOULDER[0]
  const dy = hand[1] - SHOULDER[1]
  const d = Math.hypot(dx, dy)
  const max = UPPER + FORE - 0.02
  if (d <= max) return hand
  return [SHOULDER[0] + (dx / d) * max, SHOULDER[1] + (dy / d) * max]
}

/* ───────── 景色 ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[93, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="92.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 93 13)`} />
        ))}
      </Layer>
      <circle cx="93" cy="13" r={6.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 92 Q72 72 113 95 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="6" cy="12" rx="7" ry="3.2" />
        <ellipse cx="11" cy="10.4" rx="5" ry="3.2" />
        <ellipse cx="60" cy="8" rx="6" ry="2.6" />
        <ellipse cx="64.5" cy="6.6" rx="4.4" ry="2.8" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 46, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
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

/* ───────── 子ども ───────── */

type Mood = 'worried' | 'resolute' | 'happy'

type KidProps = {
  readonly step: number
  readonly mood: Mood
  readonly pose: HandPose
  readonly sweat: number
  readonly t: number
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

function Face({ mood }: { readonly mood: Mood }) {
  // 右むき。目と口は あたまの 右がわ
  return (
    <>
      <circle cx="35.4" cy="29.2" r="2.1" fill="#ff9d9d" opacity="0.55" />
      {mood === 'worried' ? (
        <>
          <path d="M31.6 21.6 l4.4 -1.6" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="34" cy="25" r="1.2" fill="#2b2b2b" />
          <path d="M34.2 31.6 q1.6 -1.4 3.4 0" fill="none" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
        </>
      ) : mood === 'resolute' ? (
        <>
          <path d="M31.6 20 l4.6 1.8" stroke={HAIR} strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="34" cy="24.6" r="1.3" fill="#2b2b2b" />
          <path d="M34 31 h3.4" stroke="#b9483f" strokeWidth="1.3" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M32.2 25.8 Q34 23.4 35.8 25.8" fill="none" stroke="#2b2b2b" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M33.4 29.6 Q35.8 33.6 38 29.8 Z" fill="#b9483f" />
        </>
      )}
    </>
  )
}

function Kid({ step, mood, pose, sweat, t }: KidProps) {
  const hand = reachableHand(pose.hand)
  const elbow = elbowFor(hand)
  // とおい うで は 体の よこで ぶらぶら(あるくとき だけ ふる)
  const far = step * 22
  const farHand = [SHOULDER[0] + Math.sin((far * Math.PI) / 180) * 22, SHOULDER[1] + Math.cos((far * Math.PI) / 180) * 22] as const
  // 手くびの わっか: ひだり手の しるし
  const wrist = [hand[0] + (elbow[0] - hand[0]) * 0.2, hand[1] + (elbow[1] - hand[1]) * 0.2] as const
  const nearWrist = [hand[0] + (elbow[0] - hand[0]) * 0.46, hand[1] + (elbow[1] - hand[1]) * 0.46] as const
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${farHand[0]} ${farHand[1]}`} stroke={TUNIC_FAR} strokeWidth="5.6" strokeLinecap="round" />
      <circle cx={farHand[0]} cy={farHand[1]} r="3.2" fill={SKIN_SHADE} />
      <Layer rotate={step * 17} origin={[27, 68]}>
        <rect x="24.2" y="65" width="6.2" height="27.5" rx="3.1" fill={PANTS_DARK} />
        <ellipse cx="28.4" cy="93.4" rx="5.4" ry="2.8" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 17} origin={[27, 68]}>
        <rect x="22.4" y="65" width="6.2" height="27.5" rx="3.1" fill={PANTS} />
        <ellipse cx="26.6" cy="93.4" rx="5.4" ry="2.8" fill={SHOE} />
      </Layer>
      {/* くび: どう と あたま を みじかく つなぐ */}
      <rect x="23.6" y="31.4" width="5.2" height="8" rx="2.4" fill={SKIN_SHADE} />
      <rect x="20" y="36.6" width="14" height="34" rx="6.8" fill={TUNIC} />
      <path d="M22 62 h10" stroke={TUNIC_DARK} strokeWidth="1.6" strokeLinecap="round" />
      {/* 木づち(手の うしろ に えが かくれる) */}
      <Mallet hand={hand} angle={pose.mallet} />
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={TUNIC_DARK} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${nearWrist[0]} ${nearWrist[1]} L${wrist[0]} ${wrist[1]}`} stroke={BAND_RED} strokeWidth="6.4" strokeLinecap="butt" />
      <circle cx={hand[0]} cy={hand[1]} r="3.5" fill={SKIN} />
      {/* あたま(右むき) */}
      <circle cx="28.6" cy="24.6" r="9.2" fill={SKIN} />
      <path d="M19.4 25 C18.6 14.4 30 11.2 36.4 16.4 C38.4 18.4 38.4 21 38 22.6 C34 19.6 28.6 19.6 24.2 21.4 C22.4 22.4 20.6 24 19.4 25 Z" fill={HAIR} />
      <path d="M26 15.6 Q26.6 12.2 28.4 14.4 Q29.8 11.6 30.6 14.8" fill="none" stroke={HAIR} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Face mood={mood} />
      {sweat > 0 ? (
        <g opacity={sweat} transform={`translate(${18 + wave(t, 0.5) * 0.4} ${19 + ((t * 5) % 3)})`}>
          <path d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" />
        </g>
      ) : null}
    </>
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

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)

  // やってくる: 左から あるいて、とまる
  const walking = 1 - span(t, ARRIVE - 0.25, ARRIVE)
  const step = t < WALK ? 0 : Math.sin((t - WALK) * Math.PI * 2 * 1.7) * walking
  const walkX = mix(t, WALK, ARRIVE, -50, 0, easeOut)
  const bob = -Math.abs(step) * 1.4
  const mood: Mood = t < RAISE ? 'worried' : t < HITS[2] + 0.1 ? 'resolute' : 'happy'
  const pose = handPoseAt(t)
  const sweat = during(t, ARRIVE, RAISE, 0.25)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Stand t={t} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <ellipse cx={26 + walkX} cy="97.4" rx="9" ry="2.4" fill="#000000" opacity="0.12" />
          <Layer x={walkX} y={bob}>
            <Kid step={step} mood={mood} pose={pose} sweat={sweat} t={t} />
          </Layer>
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
