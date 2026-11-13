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
 * 人は、ほんものの 人の つくり を守る(字の形に合わせるために 体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(`limb` が かた と 手の位置から ひじ を 決める)。
 *   くび は みじかく、どう の まんなか の上。字の形に なるのは、さいごの しゅんかん だけ。
 */
import { during, easeIn, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '場'

const SKY_DIM = '#5b6d8a'
const SUN = '#ffd24a'
const SUN_CORE = '#ffe784'
const FIELD = '#c5e8a9'
const FIELD_FAR = '#e2f2d2'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const EARTH = '#b27b52'
const EARTH_DARK = '#966340'
const EARTH_LIGHT = '#c8956a'
const WOOD = '#b8834f'
const PLANK = '#e6b878'
const NAIL = '#6b4a36'
const SUNNY = '#fff1a6'
const BEAM = '#ffd24a'
const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#e8654f'
const SHIRT_DARK = '#cf4f3b'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const DUST = '#dcc7a2'

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

/** 子の 足もと(画面の ざひょう)と、ぼうを もつ手 */
const FEET_Y = 70
const CHILD_STOP = 44
/** ぼうの よこ(子の まえ)。ぼうは 2画目の x のあたり */
const GRIP_X = -14.7
/** ぼうを かついで あるくとき、地面から うかせる 高さ */
const CARRY = 5
/** 土もりの 上の ぼうの 根もと(2画目の おわり)と、いたの 中心 */
const STAKE_FOOT: Pt = [29.3, 62]
const SUN_HOME: Pt = [67.5, 26]
const SUN_R = 10.5

/** かた と 手の位置から、ひじ の位置を きめる(2本の ぶぶん は おなじ長さ)。手が とどかない ときは のばせる所まで。 */
function limb(shoulder: Pt, hand: Pt, part: number, side: 1 | -1): { readonly elbow: Pt; readonly hand: Pt } {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const dist = Math.max(Math.hypot(dx, dy), 0.001)
  const reach = Math.min(dist, part * 2 * 0.99)
  const ux = dx / dist
  const uy = dy / dist
  const half = reach / 2
  const bulge = Math.sqrt(Math.max(part * part - half * half, 0))
  const elbow: Pt = [shoulder[0] + ux * half - uy * bulge * side, shoulder[1] + uy * half + ux * bulge * side]
  return { elbow, hand: [shoulder[0] + ux * reach, shoulder[1] + uy * reach] }
}

/** 場所を ひろげる 野原と 土もり(絵の うしろ側) */
function Land({ t }: SceneProps) {
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
function Sun({ t }: SceneProps) {
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

/** ゆっくり ながれる 雲 */
function Clouds({ t }: SceneProps) {
  const drift = t * 0.9
  return (
    <g fill="#ffffff" opacity="0.9" transform={`translate(${drift} 0)`}>
      <ellipse cx="12" cy="14" rx="7" ry="3.2" />
      <ellipse cx="17" cy="12.2" rx="5" ry="3.2" />
      <ellipse cx="94" cy="21" rx="6" ry="2.7" />
      <ellipse cx="98.4" cy="19.4" rx="4.2" ry="2.8" />
    </g>
  )
}

/** ひなた(10画目の ふち)と、ひかりの すじ(9・11・12画目)。お日さまが のぼると 野原に ひろがる。 */
function Sunlight({ t }: SceneProps) {
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

type Mood = 'sad' | 'surprised' | 'happy'

type ChildProps = {
  /** あしを ふる角度(あるくとき) */
  readonly step: number
  readonly mood: Mood
  /** あたまの かたむき(+ で 上を見る) */
  readonly headTilt: number
  /** 手の 位置(子の 足もとが 0,0 の ざひょう) */
  readonly nearHand: Pt
  readonly farHand: Pt
  readonly breath: number
  readonly sigh: number
}

const ARM_PART = 8.6
/** かた(てまえ・むこう) */
const NEAR_SHOULDER: Pt = [0.8, -21]
const FAR_SHOULDER: Pt = [-0.8, -21.2]

function Arm({ shoulder, target, color, side }: { readonly shoulder: Pt; readonly target: Pt; readonly color: string; readonly side: 1 | -1 }) {
  const { elbow, hand } = limb(shoulder, target, ARM_PART, side)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.5" fill={SKIN} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  if (mood === 'sad') {
    return (
      <>
        <path d="M-5.6 -32.2 L-2.4 -31.2" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
        <circle cx="-3.6" cy="-29.4" r="1.05" fill="#2b2b2b" />
        <path d="M-5.2 -24.8 Q-3.6 -26.4 -1.8 -24.8" fill="none" stroke="#b9483f" strokeWidth="1.1" strokeLinecap="round" />
      </>
    )
  }
  if (mood === 'surprised') {
    return (
      <>
        <path d="M-5.6 -32.6 L-2.4 -33" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
        <circle cx="-3.6" cy="-29.6" r="1.5" fill="#2b2b2b" />
        <circle cx="-4.1" cy="-30.1" r="0.5" fill="#ffffff" />
        <ellipse cx="-3.9" cy="-25.4" rx="1.1" ry="1.5" fill="#b9483f" />
      </>
    )
  }
  return (
    <>
      <path d="M-5.4 -29 Q-3.6 -31.2 -1.8 -29" fill="none" stroke="#2b2b2b" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M-5.6 -26.2 Q-3.6 -23.4 -1.2 -26.2 Z" fill="#b9483f" />
    </>
  )
}

function Child({ step, mood, headTilt, nearHand, farHand, breath, sigh }: ChildProps) {
  return (
    <>
      <Arm shoulder={FAR_SHOULDER} target={farHand} color={SHIRT_DARK} side={-1} />
      {/* あし: こし から ふる */}
      <Layer rotate={step * 20} origin={[0.8, -12]}>
        <rect x="-1.4" y="-13" width="4.4" height="12.6" rx="2.2" fill={PANTS_DARK} />
        <ellipse cx="0" cy="-0.8" rx="3.6" ry="1.9" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 20} origin={[-0.8, -12]}>
        <rect x="-3" y="-13" width="4.4" height="12.6" rx="2.2" fill={PANTS} />
        <ellipse cx="-1.6" cy="-0.8" rx="3.6" ry="1.9" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう と あたま の間 */}
      <rect x="-2" y="-27.2" width="3.6" height="4.4" rx="1.6" fill={SKIN_SHADE} />
      <Layer scaleX={1 + breath * 0.03} origin={[0, -12]}>
        <rect x="-5.2" y="-25.6" width="10.4" height="14.6" rx="4.4" fill={SHIRT} />
        <path d="M-4.6 -15.4 h9.2" stroke={SHIRT_DARK} strokeWidth="1.2" strokeLinecap="round" />
      </Layer>
      <Arm shoulder={NEAR_SHOULDER} target={nearHand} color={SHIRT} side={-1} />
      <Layer rotate={headTilt} origin={[-0.2, -24]}>
        <circle cx="-0.5" cy="-29.5" r="6.2" fill={SKIN} />
        <path d="M-5.7 -31 C-6.3 -37.5 4 -38.4 6 -33 C6.6 -31 6.3 -28 5.7 -26 C5 -30 1 -32.8 -3 -32.2 C-4.4 -32 -5.2 -31.5 -5.7 -31 Z" fill={HAIR} />
        <path d="M-1 -35.6 Q-0.4 -38.6 1.2 -36.6" fill="none" stroke={HAIR} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="-4.2" cy="-26.6" r="1.5" fill="#ff9d9d" opacity="0.55" />
        <Face mood={mood} />
      </Layer>
      {/* しょんぼりの ためいき */}
      {sigh > 0 && (
        <g opacity={sigh}>
          <ellipse cx={-9 - (1 - sigh) * 6} cy={-25 - (1 - sigh) * 4} rx="2.6" ry="1.8" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
          <ellipse cx={-13 - (1 - sigh) * 6} cy={-26.6 - (1 - sigh) * 3} rx="1.4" ry="1" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
        </g>
      )}
    </>
  )
}

/** ぼうを さしたとき の つちけむり */
function Dust({ t, at, size }: { readonly t: number; readonly at: number; readonly size: number }) {
  const p = span(t, at, at + 0.5, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p} fill={DUST}>
      <ellipse cx={STAKE_FOOT[0] - 3 - p * 7 * size} cy={STAKE_FOOT[1] + 1.4 - p * 2.6} rx={1.6 + p * 2.2 * size} ry={1.2 + p * 1.6 * size} />
      <ellipse cx={STAKE_FOOT[0] + 3 + p * 7 * size} cy={STAKE_FOOT[1] + 1.4 - p * 2.6} rx={1.6 + p * 2.2 * size} ry={1.2 + p * 1.6 * size} />
    </g>
  )
}

/** お日さまの 空を よこぎる 小鳥 */
function Bird({ t }: SceneProps) {
  const p = span(t, SUNRISE + 0.8, SUNRISE + 3.4)
  if (p <= 0 || p >= 1) return null
  const x = 116 - p * 128
  const y = 10 + Math.sin(p * 7) * 2
  const flap = wave(t, 0.3) * 24
  return (
    <Layer x={x} y={y}>
      <path d="M-4 0.4 l-2.6 0.8 l2.4 0.8 Z" fill="#f2b632" />
      <ellipse cx="0" cy="0" rx="4.2" ry="2.8" fill="#6c8fd8" />
      <circle cx="-3.2" cy="-1.8" r="2.2" fill="#6c8fd8" />
      <circle cx="-3.9" cy="-2.2" r="0.5" fill="#2b2b2b" />
      <path d="M3.4 0 l3.6 -1 l-2.2 2.4 Z" fill="#4a6fc0" />
      <Layer rotate={flap} origin={[0.4, -0.8]}>
        <path d="M-1.4 -1 Q1.6 -5 4.4 -0.8 Q1.6 0.6 -1.4 -1 Z" fill="#4a6fc0" />
      </Layer>
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 12)

  // 朝の くらさ: お日さまが のぼると 明るくなる
  const dawn = span(t, SUNRISE, SUNRISE + 1.6)

  // あるく: 右から しるしの ぼうを かついで きて、土もりの 前で 止まる
  const walking = 1 - span(t, ARRIVE - 0.4, ARRIVE)
  const stride = t < ENTER ? 0 : Math.sin((t - ENTER) * Math.PI * 2 * 1.5) * walking
  const childX = mix(t, ENTER, ARRIVE, 150, CHILD_STOP, easeOut)
  const bob = -Math.abs(stride) * 1.2

  // ぼうを さす: 3回に わけて ぐいっと 下げる(かついで いる間は うかせる)
  const lift = CARRY - 3.2 * span(t, PUSH, PUSH + 0.25, easeIn) + 1.8 * span(t, PUSH + 0.25, PUSH + 0.5, easeOut) - 3.6 * span(t, PUSH + 0.5, PLANTED, easeIn)

  // 気持ち: しょんぼり → お日さまに びっくり → にっこり
  const mood: Mood = t < NOTICE ? 'sad' : t < SMILE ? 'surprised' : 'happy'
  const headTilt = -9 + 23 * span(t, NOTICE, NOTICE + 0.3) - 9 * span(t, SMILE, SMILE + 0.4) + 7 * span(t, CHEER, CHEER + 0.3) + stride * 1.5
  const sigh = during(t, ARRIVE + 0.1, SUNRISE + 0.4, 0.2)

  // よろこぶ: ぼうから 手をはなして、ばんざい ぴょんぴょん(2かい)
  const release = span(t, CHEER - 0.1, CHEER + 0.2, easeOut)
  const hop = t >= CHEER && t < CHEER + 0.8 ? Math.abs(Math.sin(((t - CHEER) / 0.4) * Math.PI)) * 5 : 0
  const gripNear: Pt = [GRIP_X + 0.3, -19 - lift + 0.4]
  const gripFar: Pt = [GRIP_X - 0.3, -19.4 - lift]
  const cheerNear: Pt = [-7, -35]
  const cheerFar: Pt = [6, -36]
  const nearHand: Pt = [gripNear[0] + (cheerNear[0] - gripNear[0]) * release, gripNear[1] + (cheerNear[1] - gripNear[1]) * release]
  const farHand: Pt = [gripFar[0] + (cheerFar[0] - gripFar[0]) * release, gripFar[1] + (cheerFar[1] - gripFar[1]) * release]
  const breath = wave(t, 1.6)

  // ぼう: ぼうの よこ が 子の まえ。手を はなす まえ は 子と いっしょに うごく
  const stakeDx = childX + GRIP_X - STAKE_FOOT[0]
  const stakeDy = -lift + bob
  const planted = t >= PLANTED

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sun t={t} />
        <Land t={t} />
        <Clouds t={t} />
        <Sunlight t={t} />
        <Stake dx={planted ? 0 : stakeDx} dy={planted ? 0 : stakeDy} />
        {/* ぼうの 根もとの ほった土 */}
        {planted && <ellipse cx={STAKE_FOOT[0]} cy={STAKE_FOOT[1] + 1.6} rx="5.4" ry="1.8" fill={EARTH_LIGHT} />}
        <Dust t={t} at={PUSH + 0.25} size={0.7} />
        <Dust t={t} at={PLANTED - 0.05} size={1.1} />
        <ellipse cx={childX} cy={FEET_Y + 0.6} rx={7 - hop * 0.3} ry="1.8" fill="#000000" opacity={0.12 * span(t, ENTER, ENTER + 0.4)} />
        <Layer x={childX} y={FEET_Y + bob - hop}>
          <Child step={stride} mood={mood} headTilt={headTilt} nearHand={nearHand} farHand={farHand} breath={breath} sigh={sigh} />
        </Layer>
        <Bird t={t} />
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
