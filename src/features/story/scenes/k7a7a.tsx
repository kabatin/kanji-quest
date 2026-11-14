/*
 * 空(そら・から): がけの あなを のぞくと からっぽ。ふりあおぐと 空も ひろくて からっぽ。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)    … がけの うえに はえた わかい 木の みき
 *   2画目(ノ)    … がけの ひだりの かどから たれた つた
 *   3画目(ノ一)  … がけの てっぺん(くさの ぼうし)
 *   4画目(ノ)    … あなの ひだり がわの ななめの いわはだ
 *   5画目(乚)    … あなの みぎ がわの かべ と、その したの でっぱり
 *   6画目(一)    … あなの まえに つくった 木の いた(だい)。子どもは この上に のる
 *   7画目(丨)    … 台を ささえる 木の はしら
 *   8画目(一)    … はしらの 下の どだい の 木
 *
 * ながれ
 *   がけ と 台が できる → ランタンを もった 子どもが あるいてきて、台に ぴょんと のる
 *   → わくわく あなを のぞく(ランタンで 中を てらす) → なんにも ない。ほこりの たまが ころがるだけ
 *   → がっかり ため息 → ふと 見あげる。空も なんにも ない、どこまでも ひろい
 *   → わあ! と 手を あげて よろこぶ → ほね が ひかって、絵が うすくなり、字「空」が のこる
 *
 * 子どもは Person(共通部品)。あるきは walk、こちらを むくのは turnAround、しゃがむのは posture。
 *   ランタンは 右手(画面の 左)の 先に personRig で 合わせて 描く。ため息は Sigh、お日さまは Sun。
 *   あなを のぞくときも、見あげるときも、体の つくり は かわらず、目と むき だけで 見せる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Cloud, LOOKS, mixPose, Person, personRig, posture, Sigh, Sun, turnAround, walk, type Limb, type PersonProps } from '../sceneFigures'

const CHAR = '空'

const SKY = '#e4f5fc'
const GRASS = '#c5e8a9'
const GRASS_DARK = '#a9d48a'
const CAP = '#7cc65f'
const ROCK = '#b9b3a8'
const ROCK_DARK = '#9d968a'
const ROCK_LIGHT = '#d3cdc2'
const CAVE_DARK = '#3b3550'
const CAVE_LIT = '#d9bb82'
const CAVE_BACK = '#bf9f6c'
const WOOD = '#8c5b3c'
const WOOD_DARK = '#70452b'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const VINE = '#4c8f52'
const GLOW = '#ffe58a'

/** くぎり の時間(秒) */
const ENTER_FROM = 0.9
const HOP_FROM = 2.5
const HOP_TO = 3.2
/** ランタンを あげて、あなを のぞく */
const PEEK = 3.3
const LIGHT = 3.7
/** なんにも ない と わかって がっかり */
const SAD = 4.4
/** ふと 空を 見あげる */
const LOOK_UP = 5.3
/** わあ! と よろこぶ */
const JOY = 6.0
const INK = 6.9
const DONE = 9.8
const DURATION = 10.5

/** 地面(草の うえ)と、台(いた)の うえの 高さ */
const GROUND_Y = 90.5
const DECK_Y = 64.4
/** 台に のぼった 子どもの 場所、あるいてくる はじまりの場所 */
const KID_X = 68
const KID_START_X = 82

/** あなの かたち。左の ふち は 4画目、右の ふち は 5画目の たてせん。 */
const MOUTH_PATH = 'M40.5 27 L60.2 25 L61.3 50 L61.5 66.5 L22 66.5 L25 61.2 L41.5 39 Z'

/** コマの あいだを なめらかに つなぐ。[時間, 値] を じゅんに ならべる */
function keys(t: number, frames: readonly (readonly [number, number])[]): number {
  if (t <= frames[0][0]) return frames[0][1]
  for (let i = 1; i < frames.length; i += 1) {
    const [from, a] = frames[i - 1]
    const [to, b] = frames[i]
    if (t < to) return mix(t, from, to, a, b)
  }
  return frames[frames.length - 1][1]
}

/* ───────── ばしょ(そら・がけ・あな・台) ───────── */

function Ground() {
  return (
    <>
      <rect x="-2" y="90.5" width="113" height="22" fill={GRASS} />
      <rect x="-2" y="90.5" width="113" height="2" fill={GRASS_DARK} opacity="0.6" />
      {[6, 40, 76, 102].map((x) => (
        <path key={x} d={`M${x} 98 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** がけ。てっぺん(3画目)は くさの ぼうし。あな の ふち が 4・5画目。 */
function Cliff({ lit }: { readonly lit: number }) {
  return (
    <>
      <path d="M12 91 L12 42 Q12 31 27.6 30 L80.6 24.3 Q96 24 96 40 L96 91 Z" fill={ROCK} />
      {/* いわの もよう(すじ は 字の画から はなして おく) */}
      <ellipse cx="86" cy="76" rx="5" ry="2.4" fill={ROCK_DARK} />
      <ellipse cx="18" cy="78" rx="4" ry="2" fill={ROCK_DARK} />
      <ellipse cx="88" cy="40" rx="3" ry="2.2" fill={ROCK_LIGHT} />
      <ellipse cx="16" cy="54" rx="2.6" ry="2" fill={ROCK_LIGHT} />
      {/* あな: ランタンで てらすと、そこ の かべが 見えてくる */}
      <path d={MOUTH_PATH} fill={CAVE_DARK} />
      <g opacity={lit}>
        <path d={MOUTH_PATH} fill={CAVE_LIT} />
        <path d="M30 66 Q31 46 50.5 41 Q58 40 60 48 L60 66 Z" fill={CAVE_BACK} />
        {/* くも の す: だれも いない しるし(上の かど に ちいさく) */}
        <path d="M43 28.6 L52 38 M47.5 27.8 L53 33 M43 28.6 L43.6 38 M44.4 32.6 Q47 33.4 48.6 31.4 M44 36 Q48 36.6 51 34.4" fill="none" stroke="#fff6e0" strokeWidth="0.5" strokeLinecap="round" opacity="0.9" />
      </g>
      <Bone char={CHAR} n={4} color={ROCK_DARK} width={2.6} />
      <Bone char={CHAR} n={5} color={ROCK_DARK} width={2.6} />
      <Bone char={CHAR} n={3} color={CAP} width={4.6} />
    </>
  )
}

/** がけの うえの わかい 木(1画目)と、たれた つた(2画目) */
function Plants({ t }: SceneProps) {
  const grow = span(t, 0.6, 1.1, backOut)
  const vine = span(t, 0.7, 1.2, easeOut)
  const sway = wave(t, 3.2) * 2
  return (
    <>
      <Layer scaleY={grow} scaleX={0.7 + 0.3 * grow} origin={[53, 26]}>
        <Bone char={CHAR} n={1} color={WOOD} width={2.4} />
        <Layer rotate={sway} origin={[52.5, 14]}>
          <circle cx="52" cy="10.5" r="5.2" fill={LEAF_DARK} />
          <circle cx="50.2" cy="9.2" r="3.8" fill={LEAF} />
          <circle cx="55" cy="12.6" r="3" fill={LEAF} />
        </Layer>
      </Layer>
      <Layer scaleY={vine} origin={[27, 29]} rotate={sway * 0.5}>
        <Bone char={CHAR} n={2} color={VINE} width={1.8} />
        <circle cx="25.6" cy="36.5" r="1.7" fill={LEAF} />
        <circle cx="23.6" cy="41" r="1.9" fill={LEAF} />
      </Layer>
    </>
  )
}

/** 台(6画目の いた・7画目の はしら・8画目の どだい) */
function Deck({ t }: SceneProps) {
  const base = span(t, 0.1, 0.5, backOut)
  const post = span(t, 0.3, 0.65, backOut)
  const plank = span(t, 0.5, 0.9, backOut)
  return (
    <>
      <Layer scaleX={base} origin={[56, 90]}>
        <Bone char={CHAR} n={8} color={WOOD_DARK} width={5.4} />
        <Bone char={CHAR} n={8} color={WOOD} width={3.6} />
      </Layer>
      <Layer scaleY={post} origin={[54, 90]}>
        <Bone char={CHAR} n={7} color={WOOD} width={4.4} />
      </Layer>
      <Layer scaleX={plank} origin={[32, 68]}>
        <Bone char={CHAR} n={6} color={WOOD_DARK} width={5} />
        <Bone char={CHAR} n={6} color={WOOD} width={3.6} />
      </Layer>
    </>
  )
}

/* ───────── 子ども(しゅじんこう) ───────── */

type Mood = 'hope' | 'flat' | 'wow' | 'joy'

const FACES: Readonly<Record<Mood, 'smile' | 'sad' | 'surprised' | 'joy'>> = { hope: 'smile', flat: 'sad', wow: 'surprised', joy: 'joy' }
const KID_HEIGHT = 45
const KID_LOOK = { ...LOOKS.boy, top: '#e8715a' }
/** あるいてきて とまる(ふりむく のは そのあと) */
const WALK_END = 1.9
const TURN_AT = 1.95
const CROUCH_FROM = 2.25

/** ランタン。手から ぶら下がる(体が かたむいても、まっすぐ下を むく) */
function Lantern({ x, y, glow }: { readonly x: number; readonly y: number; readonly glow: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx="0" cy="4" r={7 + glow * 6} fill={GLOW} opacity={0.14 + glow * 0.1} />
      <circle cx="0" cy="4" r={4.4 + glow * 3} fill={GLOW} opacity={0.22 + glow * 0.12} />
      <path d="M-1.6 0.4 Q0 -1.6 1.6 0.4" fill="none" stroke={WOOD_DARK} strokeWidth="0.8" />
      <rect x="-2.3" y="0.2" width="4.6" height="1.3" rx="0.6" fill={WOOD_DARK} />
      <rect x="-2.1" y="1.3" width="4.2" height="5" rx="1.1" fill="#ffcf5a" />
      <rect x="-2.3" y="6" width="4.6" height="1.1" rx="0.5" fill={WOOD_DARK} />
    </g>
  )
}

/** 子どもの 場所と かっこう。あるいてきて、こちらを むき、しゃがんで ぴょんと 台へ。ランタンは 右手(画面の 左) */
function kidAt(t: number): PersonProps {
  const walking = walk(t, { from: 125, to: KID_START_X, start: ENTER_FROM, end: WALK_END, build: 'child', height: KID_HEIGHT, step: 15, armSwing: 12 })
  const turn = turnAround(t, TURN_AT, 'left', 'front')
  const hop = span(t, HOP_FROM, HOP_TO, easeInOut)
  const rise = span(t, HOP_FROM + 0.05, HOP_TO, easeOut)
  const arc = Math.sin(hop * Math.PI) * 11
  // よろこぶと、ぴょんぴょん はずむ
  const bounce = t >= JOY ? Math.abs(Math.sin((t - JOY) * Math.PI * 2.2)) * 2.2 * (1 - span(t, JOY + 1.2, INK)) : 0
  const crouch = span(t, CROUCH_FROM, HOP_FROM) * (1 - span(t, HOP_FROM, HOP_FROM + 0.1)) * 0.6 + during(t, HOP_TO - 0.05, HOP_TO + 0.3, 0.1) * 0.35
  const body = mixPose(posture('stand', 'front'), posture('squat', 'front'), crouch)

  // うで: ランタンの うで は、あなへ のばす → がっかりで さがる → よろこびで 上へ
  const raise = span(t, PEEK, PEEK + 0.5, easeOut)
  const droop = span(t, SAD, SAD + 0.5)
  const cheer = span(t, JOY, JOY + 0.7, backOut)
  const lanternArm: Limb = { swing: 8 + 67 * raise - 45 * droop + 100 * cheer, bend: 5 + 20 * raise * (1 - droop) - 10 * cheer }
  const freeArm: Limb = { swing: 6 + 100 * cheer, bend: 5 + 4 * cheer }

  const mood: Mood = t < SAD ? 'hope' : t < LOOK_UP ? 'flat' : t < JOY ? 'wow' : 'joy'
  const gaze = keys(t, [[0, -1], [SAD, -0.8], [SAD + 0.4, -0.2], [LOOK_UP, -0.2], [LOOK_UP + 0.4, 0.2], [JOY, 0]])
  const gazeY = keys(t, [[0, 0], [HOP_FROM, 0], [HOP_TO, -0.4], [PEEK, 0.1], [SAD, 0.1], [SAD + 0.4, 0.9], [LOOK_UP, 0.9], [LOOK_UP + 0.5, -1], [JOY, -1]])
  return {
    ...walking,
    ...turn,
    x: walking.x + (KID_X - KID_START_X) * hop,
    y: GROUND_Y + (DECK_Y - GROUND_Y) * rise - bounce,
    look: KID_LOOK,
    lift: arc,
    lean: keys(t, [[PEEK, 0], [PEEK + 0.5, -5], [SAD, -5], [SAD + 0.6, 0]]),
    face: FACES[mood],
    gaze,
    gazeY,
    opacity: span(t, ENTER_FROM - 0.1, ENTER_FROM),
    pose: t < CROUCH_FROM ? { ...walking.pose, rightArm: t < PEEK ? walking.pose.rightArm : lanternArm } : { ...body, rightArm: lanternArm, leftArm: freeArm },
  }
}

/* ───────── にぎやかし ───────── */

/** あなの 中から ころがってくる ほこりの たま。台の はしから おちる。 */
function DustBall({ t }: SceneProps) {
  const roll = span(t, 4.0, 5.0)
  const drop = span(t, 5.0, 5.6)
  if (roll <= 0 || drop >= 1) return null
  const x = 54 - 21 * roll - drop * 4
  const y = DECK_Y - 2.7 + drop * drop * 40
  const turn = -roll * 560 - drop * 200
  return (
    <Layer x={x} y={y} rotate={turn} opacity={Math.min(roll * 6, 1)}>
      <circle cx="0" cy="0" r="2.7" fill="#cfc7bb" />
      <circle cx="-0.8" cy="-0.6" r="1.6" fill="#e2dcd2" />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <path key={a} d="M0 -2.4 l0.5 -1.4 l0.5 1.4" fill="none" stroke="#b5ad9f" strokeWidth="0.6" strokeLinecap="round" transform={`rotate(${a})`} />
      ))}
    </Layer>
  )
}

/** よろこぶとき、子どもの まわりで はじける ほし(字の画の 上は さける) */
function Cheer({ t }: SceneProps) {
  const p = span(t, JOY, JOY + 0.9, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p}>
      {[[-16, -12], [16, -14], [-20, 6], [20, 4]].map(([dx, dy], i) => (
        <path key={i} d="M0 -2 L0.6 -0.6 L2 0 L0.6 0.6 L0 2 L-0.6 0.6 L-2 0 L-0.6 -0.6 Z" fill="#ffc233" transform={`translate(${KID_X + dx * (0.5 + p)} ${DECK_Y - 28 + dy * (0.5 + p)}) scale(${1 + p})`} />
      ))}
    </g>
  )
}

/** くもが ゆっくり ながれて、見あげるころには 空が からっぽに なる */
function DriftingClouds({ t }: SceneProps) {
  const drift = span(t, 3.0, 6.4, easeInOut)
  return (
    <>
      <Layer x={drift * 110}>
        <Cloud x={22} y={12} size={1.3} opacity={0.95} />
        <Cloud x={38} y={14} size={0.7} opacity={0.95} />
      </Layer>
      <Layer x={drift * 90}>
        <Cloud x={82} y={16} size={1} opacity={0.9} />
      </Layer>
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)

  // ばしょが できる
  const cliff = span(t, 0, 0.55, backOut)
  const lit = span(t, LIGHT, LIGHT + 0.6, easeOut)

  const kid = kidAt(t)
  const rig = personRig(kid)
  const lanternAt = rig.world.arms.right.end
  const glow = keys(t, [[0, 0.3], [PEEK, 0.3], [PEEK + 0.5, 1], [SAD + 0.5, 0.5], [JOY, 0.5], [JOY + 0.7, 1]])
  const head = rig.world.head
  const headR = rig.body.headR * rig.scale
  const sighShow = during(t, SAD, LOOK_UP + 0.1, 0.25)
  const sighP = span(t, SAD, LOOK_UP + 0.1, easeOut)

  return (
    <>
      <Layer opacity={ink.picture}>
        <rect x="0" y="0" width="109" height="109" fill={SKY} />
        <Sun t={t} x={98} y={10} r={5.4} />
        <DriftingClouds t={t} />
        <Ground />
        <Layer scaleY={cliff} scaleX={0.85 + 0.15 * cliff} origin={[54, 91]}>
          <Cliff lit={lit} />
        </Layer>
        <Plants t={t} />
        <Deck t={t} />
        <DustBall t={t} />
        <Person {...kid} />
        {t >= ENTER_FROM && <Lantern x={lanternAt[0]} y={lanternAt[1] + 1.2} glow={glow} />}
        <Sigh x={head[0] - headR * 0.4} y={head[1] + headR * 0.5} p={sighP} show={sighShow} dir={-1} />
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
    { at: 0, label: 'がけ と 台が できる', sound: 'pop' },
    { at: ENTER_FROM, label: 'ランタンを もった 子どもが あるいてくる' },
    { at: HOP_FROM, label: 'ぴょんと 台に のる', sound: 'pop' },
    { at: PEEK, label: 'わくわく あなを のぞく' },
    { at: SAD, label: 'なんにも ない。がっかり' },
    { at: LOOK_UP, label: 'ふと 見あげる。空も からっぽ' },
    { at: JOY, label: 'わあ! ひろい 空' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '空 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
