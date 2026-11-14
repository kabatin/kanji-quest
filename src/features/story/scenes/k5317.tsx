/*
 * 北(きた): ふたりが せなかを むけあう。(共通部品 sceneFigures で 書きなおした もの)
 *
 * ほね(画と絵の対応)  ※ 人は 本当の 体の 大きさ で 描く ので、字とは「だいたい」重なる くらい
 *   1画目(一)  … 左の子が まえへ のばした うで(ぷいっと そっぽを むく うで)
 *   2画目(丨)  … 左の子の せなか(どう)
 *   3画目(ノ)  … 左の子の まえへ おろした あし
 *   4画目(ノ)  … 右の子が ボールを もって ななめ上へ のばした うで
 *   5画目(乚)  … 右の子の せなか から あし
 *
 * ながれ
 *   丸太に ふたりが むかいあって すわり、ボールで なかよく あそぶ(おひさま が てっている)
 *   → 右の子が ボールを ひょいと とって、ほら と たかく もちあげる
 *   → 左の子は びっくり、そして ぷんぷん おこる
 *   → ふたりとも ぷいっと むきを かえて、せなかを むけあう(ずりずり と せなかあわせ)
 *   → ほね が ひかって、絵が うすくなり、字「北」が のこる
 *   (おひさまに せなかを むけたほう = 右の子が むいた ほうが「きた」)
 *
 * 人は Person。丸太に こしかける のは posture('sitChair')、ぷいっと むくのは turnAround。
 * ボールは 手の さき(personRig の 手の 場所)に おいて、手に もたせる(held)。
 * 丸太・ボール は ここで 描く。
 */
import { backOut, during, easeInOut, inkTiming, mix, span, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, LOOKS, mixLimb, PALETTE, Person, personRig, posture, seatHeight, turnAround, type Limb, type PersonProps, type Point } from '../sceneFigures'

const CHAR = '北'

const BARK_END = '#d9a679'
const BALL = '#ef5b5b'
const BALL_DARK = '#d04646'

/** 左の子: 青い ふく / 右の子: だいだい色の ふく */
const LOOK_LEFT = LOOKS.boy
const LOOK_RIGHT = { ...LOOKS.boy, top: '#f0944f', bottom: '#5d6a9a', hair: '#2f2a32' } as const

/** くぎり の時間(秒) */
const PLAY = 0.9
const GRAB = 2.4
const SHOCK = 2.85
const RAISED = 3.5
const TURN_LEFT = 4.1
const TURN_RIGHT = 4.3
const TURN_TIME = 0.45
const SCOOT = 4.6
const SCOOT_END = 5.6
const INK = 6.4
const DONE = 9.2
const DURATION = 10

/** 地面 と、子どもの せたけ。丸太の 上は、すわった おしり の たかさ に 合わせる */
const GROUND = 96
const KID_HEIGHT = 50
const LOG_TOP = GROUND - seatHeight('child', KID_HEIGHT)
const LOG_THICK = GROUND - 1 - LOG_TOP
/** さいしょ むかいあう ざ位置 と、せなかあわせ の ざ位置 */
const LEFT_FROM = 37
const RIGHT_FROM = 71
const LEFT_TO = 47.5
const RIGHT_TO = 61.5
/** ボールを あそぶ 場所(ふたりの まんなか、むねの たかさ) */
const PLAY_BALL: Point = [54, 73]
/** ボールを たかく もつ ときの 手の 場所(右の子の こしから よこ・うえ) */
const RAISE_REACH: Point = [14, 45]

type Key = readonly [number, Limb]

/** きまった 時間に きまった かっこう を 通り、あいだ を なめらかに つなぐ */
function keyed(t: number, keys: readonly Key[]): Limb {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i += 1) {
    const [t0, a] = keys[i - 1]
    const [t1, b] = keys[i]
    if (t <= t1) return mixLimb(a, b, span(t, t0, t1, easeInOut))
  }
  return keys[keys.length - 1][1]
}

const LAP = posture('sitChair', 'right')
const lap = (side: 'leftArm' | 'rightArm'): Limb => LAP[side] ?? { swing: 30, bend: 40 }
/** ぷいっと そっぽを むく うで(まえへ まっすぐ) */
const SULK_ARM: Limb = { swing: 82, bend: 4 }


function Log({ t }: SceneProps) {
  const grow = span(t, 0, 0.5, backOut)
  return (
    <Layer scaleX={grow} origin={[54.5, 0]}>
      <ellipse cx="54.5" cy="95.6" rx="50" ry="2.2" fill="#000000" opacity="0.1" />
      <rect x="5" y={LOG_TOP} width="99" height={LOG_THICK} rx={LOG_THICK / 2} fill={PALETTE.bark} />
      <path d={`M14 ${LOG_TOP + 6.5} h16 M44 ${LOG_TOP + 4} h22 M80 ${LOG_TOP + 6.8} h14`} stroke={PALETTE.barkDark} strokeWidth="1.2" strokeLinecap="round" />
      <ellipse cx="6.2" cy={LOG_TOP + LOG_THICK / 2} rx="2.4" ry={LOG_THICK / 2 - 0.3} fill={BARK_END} />
      <ellipse cx="102.8" cy={LOG_TOP + LOG_THICK / 2} rx="2.4" ry={LOG_THICK / 2 - 0.3} fill={BARK_END} />
    </Layer>
  )
}

/** ボール(x, y は まんなか) */
function Ball({ x, y, spin, size }: { readonly x: number; readonly y: number; readonly spin: number; readonly size: number }) {
  const r = Math.max(0, 4.4 * size)
  return (
    <g transform={`translate(${x} ${y}) rotate(${spin})`}>
      <circle r={r} fill={BALL} />
      <path d={`M${-r} 0 Q0 ${r * 0.5} ${r} 0`} fill="none" stroke="#ffffff" strokeWidth="1.1" />
      <path d={`M${-r * 0.7} ${-r * 0.7} Q${-r * 0.2} ${-r * 0.9} 0 ${-r * 0.4}`} fill="none" stroke={BALL_DARK} strokeWidth="0.9" strokeLinecap="round" />
    </g>
  )
}

type Kid = PersonProps & { readonly x: number }

const withArms = (kid: Kid, leftArm: Limb, rightArm: Limb): Kid => ({ ...kid, pose: { ...kid.pose, leftArm, rightArm } })
/** 両手の さきの まんなか(ボールを はさむ ところ) */
function handsAt(kid: Kid): Point {
  const { arms } = personRig(kid).world
  return [(arms.left.end[0] + arms.right.end[0]) / 2, (arms.left.end[1] + arms.right.end[1]) / 2]
}

/** 左の子(主役): ボールを もつ → びっくり → おこる → ぷいっと うでを のばす */
function leftKid(t: number, ballAt: Point): Kid {
  const hop = t > SCOOT && t < SCOOT_END ? Math.abs(Math.sin(span(t, SCOOT, SCOOT_END) * Math.PI * 3)) * 1.8 : 0
  const turn = turnAround(t, TURN_LEFT, 'right', 'left', TURN_TIME)
  const hold: Limb = { to: ballAt }
  const reachOut: Limb = { to: PLAY_BALL }
  const right = keyed(t, [[GRAB + 0.1, hold], [SHOCK, reachOut], [RAISED, reachOut], [TURN_LEFT + 0.2, lap('rightArm')], [TURN_LEFT + 0.7, SULK_ARM]])
  const left = keyed(t, [[GRAB + 0.1, hold], [SHOCK, reachOut], [RAISED, reachOut], [TURN_LEFT + 0.4, lap('leftArm')]])
  // びっくりして、ボールのほうへ のりだす
  const torso = mix(t, 2.85, 3.2, 0, 8) * (1 - span(t, 3.2, 3.6))
  return {
    x: mix(t, SCOOT, SCOOT_END, LEFT_FROM, LEFT_TO),
    y: GROUND - hop,
    build: 'child',
    height: KID_HEIGHT,
    ...turn,
    look: LOOK_LEFT,
    face: t < SHOCK ? 'smile' : t < RAISED ? 'surprised' : 'angry',
    pose: { ...LAP, leftArm: left, rightArm: right, torso },
  }
}

/** 右の子: ボールに のりだす → ひょいと とる → たかく もつ(4画目) → ぷいっと むく */
function rightKid(t: number): Kid {
  const hop = t > SCOOT && t < SCOOT_END ? Math.abs(Math.sin(span(t, SCOOT, SCOOT_END) * Math.PI * 3 + 0.8)) * 1.8 : 0
  const turn = turnAround(t, TURN_RIGHT, 'left', 'right', TURN_TIME)
  const x = mix(t, SCOOT, SCOOT_END, RIGHT_FROM, RIGHT_TO)
  // たかく もつ 手は、体の まえ(顔の むく ほう)の ななめ上
  const ahead = turn.facing === 'left' ? -1 : 1
  const raise: Limb = { to: [x + ahead * RAISE_REACH[0], RAISE_REACH[1]] }
  const grab: Limb = { to: PLAY_BALL }
  const high = keyed(t, [[1.9, lap('rightArm')], [GRAB + 0.1, grab], [2.9, grab], [RAISED, raise]])
  const low = keyed(t, [[1.9, lap('leftArm')], [GRAB + 0.1, grab], [2.9, grab], [RAISED, lap('leftArm')]])
  // ボールを もつ のは てまえ(見える がわ)の うで。むきを かえると 体の 左右 が いれかわる
  const nearIsRight = turn.facing === 'left'
  const torso = mix(t, 1.9, GRAB + 0.1, 0, 13) * (1 - span(t, 2.9, RAISED))
  return {
    x,
    y: GROUND - hop,
    build: 'child',
    height: KID_HEIGHT,
    ...turn,
    look: LOOK_RIGHT,
    face: t < 1.9 ? 'smile' : t < TURN_RIGHT + 0.3 ? 'joy' : 'normal',
    pose: { ...LAP, leftArm: nearIsRight ? low : high, rightArm: nearIsRight ? high : low, torso },
  }
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  // ボール: 左の子の 手の上で はずむ → 右の子が とって たかく もちあげる
  const appear = span(t, 0.3, 0.7, backOut)
  const toss = during(t, PLAY, 2.3, 0.01) > 0 ? Math.abs(Math.sin(((t - PLAY) / 0.7) * Math.PI)) * 7 : 0
  const ballFrom: Point = [PLAY_BALL[0], PLAY_BALL[1] - toss]
  const left = leftKid(t, ballFrom)
  const right = rightKid(t)
  const takenByRight = t >= GRAB + 0.1
  const ballAt = takenByRight ? personRig(right).world.arms[right.facing === 'left' ? 'right' : 'left'].end : handsAt(withArms(left, { to: ballFrom }, { to: ballFrom }))
  const ball = <Ball x={ballAt[0]} y={ballAt[1]} spin={takenByRight ? 0 : toss * 3} size={appear} />

  const leftPop = span(t, 0.1, 0.6, backOut)
  const rightPop = span(t, 0.2, 0.7, backOut)
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} />
        <Log t={t} />
        <Layer scale={leftPop} origin={[LEFT_FROM, GROUND]}>
          <Person {...left} held={takenByRight ? undefined : ball} />
        </Layer>
        <Layer scale={rightPop} origin={[RIGHT_FROM, GROUND]}>
          <Person {...right} held={takenByRight ? ball : undefined} />
        </Layer>
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
    { at: 0, label: '丸太に ふたりが むかいあって すわる', sound: 'pop' },
    { at: PLAY, label: 'ボールで なかよく あそぶ' },
    { at: GRAB, label: '右の子が ボールを とる', sound: 'pop' },
    { at: RAISED, label: '左の子が おこる' },
    { at: TURN_LEFT, label: 'ぷいっと せなかを むける' },
    { at: SCOOT, label: 'ずりずり せなかあわせ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '北 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
