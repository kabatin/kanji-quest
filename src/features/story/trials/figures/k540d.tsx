/*
 * 名(な): くらい ゆうがた、遠くの ともだちの かおが 見えない。そこで 口で 名前を よぶ。(共通部品 sceneFigures で 書きなおした ためし)
 *
 * ほね(画と絵の対応)
 *   1〜3画目(夕) … ゆうがたの 空に のぼった 三日月(夕)。1画目は 月の かさ(ほそい ひかり)、
 *                   2画目は 月の ふくらんだ ふち、3画目は 月の となりの 一番ぼし
 *   4〜6画目(口) … 口から とび出した「ことば」の ふきだし(口の 四角)
 *                   (子どもが 口を 大きく あけて ともだちの 名前を よぶ)
 *
 * ながれ
 *   日が くれて 空が くらくなり、月が のぼる → 子どもが 帰り道を あるいてくる
 *   → むこうに 人かげ。くらくて かおが 見えず、手を おでこに あてて「だれだろう?」
 *   → 大きく いきを すって、口を あけて 名前を よぶ(ふきだしに ともだちの すがた)
 *   → ともだちが ふりむき、かおが 見えて にっこり 手を ふる。子どもも ぴょんと よろこぶ
 *   → ほね が ひかって、絵が うすくなり、字「名」が のこる
 *
 * ふきだしは、口の 近くから しっぽを のばす。
 */
import { backOut, during, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../../sceneParts'
import { Backdrop, DEFAULT_LOOK, Hearts, mixColor, mixLimb, PALETTE, Person, personRig, walk, walkDepth, turnAround, type DepthWalkPlan, type Look, type PersonProps } from '../../sceneFigures'

const CHAR = '名'

const SHADOW_TONE = '#2b3050'
const MOON = PALETTE.moonGlow
const BAT = '#2b3050'
const SOUND = '#fff3b8'
const WHITE = '#ffffff'

/** 友だちの 見た目(みどりの 服・むらさきの ズボン) */
const FRIEND_LOOK: Look = { hair: '#3a2a22', top: '#3fb0a0', bottom: '#6a5a9a' }
/** 子どもの 見た目(だいだいの 服) */
const KID_LOOK: Look = { top: '#ee7a4c' }

/** くぎり の時間(秒) */
const WALK_FROM = 0.5
const WALK_TO = 1.9
const FRIEND_FROM = 1.2
const FRIEND_TO = 2.4
/** 手を おでこに あてて、じっと 見る */
const SQUINT = 2.5
/** いきを すって、口を あけ、ふきだしが 出る */
const CALL = 3.8
const BUBBLE = 4.1
/** ともだちが ふりむく */
const TURN = 4.9
const JOY = 5.5
const INK = 6.4
const DONE = 9.4
const DURATION = 10

const GROUND = 96
const KID_X = 22
const KID_HEIGHT = 41
const FRIEND_X = 98
/** ふきだし(口 の 四角) */
const BUBBLE_BOX = { x: 44, y: 66, w: 40, h: 28 }

/** 立っている 子ども の 場所(あたま の 位置 を 出す ために使う) */
const KID_STAND: PersonProps = { x: KID_X, y: GROUND, build: 'child', height: KID_HEIGHT, facing: 'right' }

/** ゆうぐれの 空を とぶ コウモリ(かげ)。右から 左へ。 */
function Bat({ t }: SceneProps) {
  const p = span(t, 1.4, 4.2)
  if (p <= 0 || p >= 1) return null
  const flap = 0.35 + Math.abs(wave(t, 0.3)) * 0.65
  return (
    <Layer x={112 - p * 70} y={26 + Math.sin(p * 9) * 3 - p * 4}>
      <ellipse cx="0" cy="0" rx="2" ry="1.4" fill={BAT} />
      <Layer scaleY={flap} origin={[0, 0]}>
        <path d="M-1 -0.4 Q-4 -3 -7 -1.5 Q-5 0 -4.4 1.2 Q-3 0.2 -1 0.8 Z" fill={BAT} />
        <path d="M1 -0.4 Q4 -3 7 -1.5 Q5 0 4.4 1.2 Q3 0.2 1 0.8 Z" fill={BAT} />
      </Layer>
    </Layer>
  )
}

/** 月(夕の 1〜3画目): ふくらんだ ふちが 右がわ。まわりに うすい かさ。3画目は となりの 一番ぼし */
function CrescentMoon({ t }: SceneProps) {
  const rise = span(t, 0, 1.1, easeOut)
  const twinkle = 0.8 + wave(t, 1.3) * 0.2
  return (
    <Layer y={(1 - rise) * 14} opacity={rise}>
      <circle cx="50" cy="42" r="34" fill={MOON} opacity="0.1" />
      <Bone char={CHAR} n={1} color={MOON} width={2} opacity={0.5} />
      <path d="M54 13 C84 22 80 60 42 70 C54 58 58 40 54 13 Z" fill={MOON} />
      <path d="M60 22 C74 30 71 50 46 64" fill="none" stroke={PALETTE.moonShade} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
      <Star cx={48.4} cy={45.6} r={4.2 * twinkle} color={WHITE} spin={wave(t, 4) * 12} />
    </Layer>
  )
}

/** 子ども: あるいてくる → 手を おでこに → いきを すって よぶ → ぴょんと よろこぶ */
function kidAt(t: number): PersonProps {
  const w = walk(t, { from: -14, to: KID_X, start: WALK_FROM, end: WALK_TO, build: 'child', height: KID_HEIGHT, step: 13 })
  const rig = personRig(KID_STAND)
  const head = rig.world.head
  const r = rig.body.headR * rig.scale
  const hang = { swing: 4, bend: 8 }
  const squint = span(t, SQUINT, SQUINT + 0.4) * (1 - span(t, CALL - 0.2, CALL))
  const cup = span(t, CALL - 0.2, CALL + 0.1) * (1 - span(t, JOY - 0.2, JOY + 0.1))
  const cheer = span(t, JOY, JOY + 0.35)
  const shade = mixLimb(hang, { to: [head[0] + r * 1.15, head[1] - r * 0.55] }, squint)
  const near = mixLimb(mixLimb(shade, { to: [head[0] + r * 1.0, head[1] + r * 0.9] }, cup), { swing: 172, bend: wave(t, 0.5) * 8 }, cheer)
  const far = mixLimb(hang, { swing: 170, bend: -wave(t, 0.5) * 8 }, cheer)
  const breath = t >= CALL - 0.4 && t < CALL ? span(t, CALL - 0.4, CALL) : 0
  const hop = t >= JOY && t < JOY + 0.9 ? Math.abs(Math.sin((t - JOY) * Math.PI * 2.2)) * 2.4 : 0
  const face = t < SQUINT ? 'normal' : t < CALL ? 'normal' : t < JOY ? 'surprised' : 'joy'
  const head2 = t < SQUINT ? 0 : t < CALL ? 4 : span(t, JOY, JOY + 0.3) * -4
  const walking = t < WALK_TO
  return {
    ...KID_STAND,
    x: walking ? w.x : KID_X,
    pose: walking ? w.pose : { leftArm: near, rightArm: far, torso: -4 * breath, head: head2 },
    lift: hop,
    face,
    look: { ...KID_LOOK },
  }
}

const FRIEND_WALK: DepthWalkPlan = { from: [FRIEND_X, 108], to: [FRIEND_X, GROUND], start: FRIEND_FROM, end: FRIEND_TO, build: 'child', height: 46, toHeight: 38 }

/** ともだち: くらくて かげ(うしろむき)→ 名前を よばれて ふりむく → かおが 見えて 手を ふる */
function Friend({ t }: SceneProps) {
  if (t < FRIEND_FROM) return null
  const walking = walkDepth(t, FRIEND_WALK)
  const reveal = span(t, TURN + 0.2, TURN + 0.9)
  const dim = (color: string) => mixColor(color, SHADOW_TONE, 0.82 * (1 - reveal))
  const look: Look = { skin: dim(DEFAULT_LOOK.skin), hair: dim(FRIEND_LOOK.hair ?? ''), top: dim(FRIEND_LOOK.top ?? ''), bottom: dim(FRIEND_LOOK.bottom ?? ''), shoes: dim(DEFAULT_LOOK.shoes) }
  const turn = t < TURN ? {} : turnAround(t, TURN, 'back', 'front', 0.3, 'right')
  const hello = span(t, TURN + 0.7, TURN + 1.1)
  const hop = t >= TURN + 0.8 && t < TURN + 1.5 ? Math.abs(Math.sin((t - TURN - 0.8) * Math.PI)) * 1.6 : 0
  const waving = { swing: 125, bend: 22 + wave(t, 0.5) * 18 }
  const pose = t < TURN ? walking.pose : { rightArm: mixLimb({ swing: 4, bend: 8 }, waving, hello) }
  return (
    <Layer opacity={span(t, FRIEND_FROM, FRIEND_FROM + 0.2)}>
      <Person {...walking} {...turn} pose={pose} lift={hop} look={look} face={reveal > 0.5 ? 'smile' : 'normal'} />
    </Layer>
  )
}

/** 口から とび出した ふきだし。口の 四角に なる。中は ともだちの すがた(「名前」の しるし) */
function SpeechBubble({ t }: SceneProps) {
  const grow = span(t, BUBBLE, BUBBLE + 0.6, backOut)
  if (grow <= 0) return null
  const { x, y, w, h } = BUBBLE_BOX
  const rig = personRig(KID_STAND)
  const mouth = [rig.world.head[0] + rig.body.headR * rig.scale * 0.8, rig.world.head[1] + rig.body.headR * rig.scale * 0.45] as const
  const sound = during(t, CALL, BUBBLE + 0.8, 0.15)
  return (
    <>
      <g opacity={sound} fill="none" stroke={SOUND} strokeWidth="1" strokeLinecap="round">
        <path d={`M${mouth[0] + 3} ${mouth[1] - 2} q1.6 2.4 0 4.8`} />
        <path d={`M${mouth[0] + 5.4} ${mouth[1] - 3.4} q2.4 3.8 0 7.6`} />
      </g>
      <Layer scale={Math.max(0, grow)} origin={[x, y + h / 2]}>
        <path d={`M${x} ${y + 5} L${mouth[0] + 5} ${mouth[1]} L${x} ${y + 11} Z`} fill={WHITE} />
        <rect x={x} y={y} width={w} height={h} rx="5" fill={WHITE} />
        <Person x={x + w / 2} y={y + h - 3} height={21} build="child" facing="front" look={FRIEND_LOOK} face="smile" shadow={false} />
      </Layer>
    </>
  )
}

/** 「だれだろう?」 */
function Question({ t }: SceneProps) {
  const show = during(t, SQUINT + 0.15, CALL, 0.2)
  if (show <= 0) return null
  const pop = Math.max(0, span(t, SQUINT + 0.15, SQUINT + 0.6, backOut))
  const head = personRig(KID_STAND).world.head
  return (
    <g opacity={show} transform={`translate(${head[0] + 6} ${head[1] - 16 - wave(t, 0.9) * 0.8}) scale(${pop})`}>
      <path d="M-3 -2 Q-3 -6.4 1 -6.4 Q5 -6.4 5 -3 Q5 -0.8 1.8 0.6 Q1 1.4 1 3" fill="none" stroke={SOUND} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="1" cy="6.2" r="1.1" fill={SOUND} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)
  const kid = kidAt(t)
  const kidHead = personRig(KID_STAND).world.head
  const joy = during(t, JOY, INK - 0.1, 0.2)
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} time={mix(t, 0, 2.2, 1, 2)} sun={null} moon={null} clouds={[]} tufts={[8, 34, 82, 100]} />
        <CrescentMoon t={t} />
        <Bat t={t} />
        <Friend t={t} />
        <Layer opacity={span(t, WALK_FROM - 0.1, WALK_FROM + 0.1)}>
          <Person {...kid} />
        </Layer>
        <Question t={t} />
        <SpeechBubble t={t} />
        <Hearts t={t} x={FRIEND_X - 8} y={64} show={joy} />
        <Hearts t={t} x={kidHead[0] - 2} y={kidHead[1] - 8} show={joy} />
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
    { at: 0, label: '日が くれて、月が のぼる', sound: 'pop' },
    { at: WALK_FROM, label: '子どもが あるいてくる' },
    { at: SQUINT, label: 'むこうに 人かげ。くらくて かおが 見えない' },
    { at: CALL, label: '大きく いきを すって、口で 名前を よぶ', sound: 'pop' },
    { at: TURN, label: 'ともだちが ふりむいて にっこり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '名 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
