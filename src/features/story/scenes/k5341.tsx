/*
 * 十(じゅう): ぼうを 10本 たばねて 1つに。まとまりの しるし。(共通部品 sceneFigures で 書きなおした もの)
 *
 * ほね(画と絵の対応)  ※ 人は 本当の 体の 大きさ で 描く ので、字とは「だいたい」重なる くらい
 *   1画目(一)  … 10本の ぼうを ひもで たばねた 「たばの ぼう」(ひもを まいた まんなかが 字の まんなか)
 *   2画目(丨)  … 地面に 立てた 「しるしの ぼう」(たばを これに むすびつける)
 *
 * ながれ
 *   しるしの ぼうが 立つ → 子どもが 10本の ぼうを かかえて あるいてくる
 *   → ぼうが ばらばらで こまった顔(ゆれて、まとまらない)
 *   → しるしの ぼうに かかっていた ひもを ひっぱって、ぐるぐる まく
 *   → ひもが しまると、10本が ぴたっと そろって 1つの たばに(顔が ぱっと うれしく なる)
 *   → 子どもが 手を あげて ぴょんぴょん よろこぶ
 *   → ほね が ひかって、絵が うすくなり、字「十」が のこる
 *
 * 人は Person。あるきは walk、ぼうの たばは 子どもの held(体の まえ、てまえの うで の おく)。
 *   むこうの うで は どう の うしろ(たばを おさえる)、ひもを まく 手は てまえの うで(たばの 上に 見える)。
 *   ぼうは ほんとうに 長い もの(子どもの せいたけ より 長い)として 描き、字の線に 合わせて 少し 右上がりに かまえる。
 *   しるしの ぼう・ひも・ぼうの たば は ここで 描く。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, LOOKS, mixLimb, PALETTE, Person, personRig, Sweat, walk, type Limb, type PersonProps, type Point } from '../sceneFigures'

const CHAR = '十'

const TUNIC = '#f0a23c'
const STICK = '#e0ac6c'
const STICK_DARK = '#c48f52'
const STICK_LIGHT = '#f0c88e'
const ROPE = '#e2554a'
const ROPE_DARK = '#bd3d34'

/** くぎり の時間(秒) */
const WALK = 0.3
const ARRIVE = 1.8
/** こまった顔 → ひもを とりに いく */
const REACH = 3.0
const PULL = 3.8
const TIGHT = 4.9
const CHEER = 5.1
const CHEER_END = 6.5
const INK = 6.7
const DONE = 9.2
const DURATION = 9.8

/** 子どもの 立つ場所(こし の x)と 背たけ。たての ぼう の 左がわ */
const GROUND = 96
const KID_HEIGHT = 60
const STAND_X = 40
const LOOK = { ...LOOKS.boy, top: TUNIC } as const

/** たばの まんなか(ひもを まく ところ)。字の 1画目の まんなか あたり */
const BUNDLE_CENTER: Point = [54, 63]
/** かかえて いる あいだ、たばの まんなか は 子どもの こし より これだけ まえ */
const BUNDLE_AHEAD = BUNDLE_CENTER[0] - STAND_X
/** 字の 1画目に 合わせた かたむき(右が 少し 上がる) */
const BUNDLE_TILT = -3.3
/** ぼう の 長さ・あつさ */
const STICK_LEN = 83
const STICK_THICK = 2.6

/** ひもの わ(しるしの ぼうに かかっている) */
const COIL: Point = [54, 39]

/** 10本の ぼう。loose = ばらばらの ときの かたむき(度) / dy = そろったときの 上下 */
const STICKS = [
  { loose: -13, dy: -5.4, left: 1.2, right: -1.4, color: STICK_DARK },
  { loose: 9, dy: -4.2, left: -1.4, right: 1.6, color: STICK },
  { loose: -6, dy: -3, left: 0.6, right: 0.8, color: STICK_DARK },
  { loose: 14, dy: -1.8, left: -0.8, right: -1.8, color: STICK },
  { loose: -3, dy: -0.6, left: 1.8, right: 1.2, color: STICK_DARK },
  { loose: 7, dy: 0.6, left: -1.8, right: -0.6, color: STICK },
  { loose: -10, dy: 1.8, left: 0.2, right: 1.8, color: STICK_DARK },
  { loose: 4, dy: 3, left: -0.4, right: -1.2, color: STICK },
  { loose: 12, dy: 4.2, left: 1.4, right: 0.4, color: STICK_DARK },
  { loose: -8, dy: 5.4, left: -1, right: -0.2, color: STICK },
] as const

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k

/** しるしの ぼう: 地面から ぽん と 立つ。 */
function Post({ t }: SceneProps) {
  const rise = span(t, 0.1, 0.8, backOut)
  return (
    <>
      <ellipse cx="54.2" cy="98.4" rx={7 * rise} ry="2" fill="#000000" opacity="0.12" />
      <Layer scaleY={rise} origin={[54.2, 99.4]}>
        <Bone char={CHAR} n={2} color={PALETTE.bark} width={5.4} />
        <path d="M52.4 20 q-0.3 28 0.1 66" fill="none" stroke={PALETTE.barkDark} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      </Layer>
    </>
  )
}

/** 10本の ぼう。ばらばら(loose)から、ひもが しまると ぴたっと そろう(tight 0 → 1)。 */
function Bundle({ t, tight }: { readonly t: number; readonly tight: number }) {
  const left = BUNDLE_CENTER[0] - STICK_LEN / 2
  const shake = 1 - tight
  return (
    <>
      {STICKS.map((stick, i) => {
        const angle = (stick.loose + wave(t, 0.8, i * 0.21) * 2.2) * shake
        const spread = (i % 2 === 0 ? -1 : 1) * 2.4 * shake
        const x = left + stick.left
        const length = STICK_LEN + stick.right - stick.left
        return (
          <Layer key={i} rotate={angle} y={spread} origin={BUNDLE_CENTER}>
            <rect x={x} y={BUNDLE_CENTER[1] + stick.dy - STICK_THICK / 2} width={length} height={STICK_THICK} rx={STICK_THICK / 2} fill={stick.color} />
            <rect x={x + 2} y={BUNDLE_CENTER[1] + stick.dy - STICK_THICK / 2 + 0.4} width={length - 4} height="0.7" rx="0.35" fill={STICK_LIGHT} opacity="0.7" />
          </Layer>
        )
      })}
    </>
  )
}

/** ひもの まきつけ(3まき)と、ちょうちょ むすび。 */
function Wraps({ t }: { readonly t: number }) {
  const bow = span(t, TIGHT - 0.15, TIGHT + 0.15, backOut)
  const [cx, cy] = BUNDLE_CENTER
  return (
    <>
      {[50.9, 53.3, 55.7].map((x, k) => {
        const grow = span(t, PULL + 0.15 + k * 0.33, PULL + 0.45 + k * 0.33, easeOut)
        return (
          <Layer key={x} scaleY={grow} origin={[x, cy]}>
            <rect x={x} y={cy - 8.4} width="1.9" height="16.8" rx="0.9" fill={ROPE} />
            <rect x={x + 0.25} y={cy - 7.6} width="0.5" height="15" rx="0.25" fill="#ffffff" opacity="0.4" />
          </Layer>
        )
      })}
      <Layer scale={bow} origin={[cx, cy - 7.4]}>
        <ellipse cx={cx - 2.6} cy={cy - 9} rx="2.8" ry="1.5" fill={ROPE} transform={`rotate(-25 ${cx - 2.6} ${cy - 9})`} />
        <ellipse cx={cx + 2.6} cy={cy - 9} rx="2.8" ry="1.5" fill={ROPE} transform={`rotate(25 ${cx + 2.6} ${cy - 9})`} />
        <path d={`M${cx} ${cy - 8.4} l-2.2 6 M${cx} ${cy - 8.4} l2.4 5.4`} fill="none" stroke={ROPE_DARK} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy - 8.4} r="1.5" fill={ROPE_DARK} />
      </Layer>
    </>
  )
}

/** うで の かっこう を きまった 時間で つなぐ */
function keyed(t: number, keys: readonly (readonly [number, Limb])[]): Limb {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i += 1) {
    const [t0, a] = keys[i - 1]
    const [t1, b] = keys[i]
    if (t <= t1) return mixLimb(a, b, span(t, t0, t1, easeInOut))
  }
  return keys[keys.length - 1][1]
}

type Kid = PersonProps & { readonly nearHand: Point; readonly center: Point }

/** 子どもの 場所と かっこう(右むき)。てまえ = 左の うで(ひもを まく)、むこう = 右の うで(たばを おさえる) */
function kidAt(t: number): Kid {
  const w = walk(t, { from: STAND_X - 56, to: STAND_X, start: WALK, end: ARRIVE, build: 'child', height: KID_HEIGHT, armSwing: 0 })
  const bob = w.moving ? -Math.abs(wave(t, 0.34)) * 0.8 : 0
  // たばは、ひもで しるしの ぼうに むすばれる まで 子どもと いっしょに うごく
  const center: Point = t < TIGHT ? [w.x + BUNDLE_AHEAD, BUNDLE_CENTER[1] + bob] : BUNDLE_CENTER
  const nearGrip: Point = [center[0] - 4, center[1] + 3]
  const farGrip: Point = [center[0] + 2, center[1] - 1]

  const reach = span(t, REACH, REACH + 0.7, easeInOut)
  const coilHand: Point = [lerp(nearGrip[0], COIL[0] + 2, reach), lerp(nearGrip[1], COIL[1] + 1, reach)]
  // ひもを まく手: たばの まわりを ぐるぐる(てまえの うで だから たばの 上に 見える)
  const wrapU = span(t, PULL, TIGHT - 0.05)
  const phase = -Math.PI / 2 + wrapU * Math.PI * 2 * 3
  const wrapping = span(t, PULL - 0.15, PULL + 0.1)
  const loop: Point = [BUNDLE_CENTER[0] - 2 + 5 * Math.cos(phase), BUNDLE_CENTER[1] + 7 * Math.sin(phase)]
  const nearBase: Point = [lerp(coilHand[0], loop[0], wrapping), lerp(coilHand[1], loop[1], wrapping)]

  const cheer = span(t, CHEER, CHEER + 0.3, backOut) * (1 - span(t, CHEER_END - 0.3, CHEER_END))
  const hop = Math.abs(Math.sin(((t - CHEER) * Math.PI) / 0.7)) * 5 * cheer
  const banzai: Limb = { swing: 150, bend: 12 }
  const near = keyed(t, [[TIGHT, { to: nearBase }], [TIGHT + 0.3, { to: [nearBase[0] + 2, nearBase[1] - 4] }], [CHEER + 0.3, banzai]])
  const far = keyed(t, [[CHEER - 0.1, { to: farGrip }], [CHEER + 0.3, banzai]])
  const lookUp = span(t, REACH, REACH + 0.4) * (1 - span(t, PULL + 0.6, PULL + 1)) * 8 + cheer * 5
  const mood = t < REACH ? 'worried' : t < TIGHT ? 'normal' : 'joy'
  return {
    ...w,
    y: GROUND,
    look: LOOK,
    face: mood,
    lift: hop,
    opacity: span(t, WALK - 0.1, WALK + 0.2),
    pose: { ...w.pose, leftArm: t < TIGHT ? { to: nearBase } : near, rightArm: t < CHEER ? { to: farGrip } : far, head: -lookUp },
    nearHand: nearBase,
    center,
  }
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 2)
  const kid = kidAt(t)
  const rig = personRig(kid)
  const head = rig.world.head
  const tight = span(t, PULL + 0.3, TIGHT, easeInOut)
  const appear = span(t, WALK - 0.1, WALK + 0.2)
  // ひもが ぴん と はる ようす(手と わ を むすぶ)
  const ropeShow = span(t, REACH + 0.5, REACH + 0.7) * (1 - span(t, TIGHT - 0.05, TIGHT + 0.2))
  const sag = 7 * (1 - span(t, PULL - 0.15, PULL + 0.1) * 0.7)
  const hand = kid.nearHand
  const stars = during(t, CHEER + 0.1, CHEER_END, 0.25)

  // たば(字の 1画目): かかえて いる あいだは 子どもの held。むすんだ あとは しるしの ぼうに かさなる
  const bundle = (
    <Layer x={kid.center[0] - BUNDLE_CENTER[0]} y={kid.center[1] - BUNDLE_CENTER[1]} rotate={BUNDLE_TILT} origin={BUNDLE_CENTER} opacity={appear}>
      <Bundle t={t} tight={tight} />
      <Wraps t={t} />
    </Layer>
  )

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[96, 13]} clouds={[]} tufts={[8, 30, 78, 100]} />
        <Post t={t} />
        {/* ひもの わ: しるしの ぼうに かかっている */}
        <Layer opacity={span(t, 0.6, 0.9) * (1 - span(t, PULL + 0.4, PULL + 1.2))}>
          <ellipse cx={COIL[0]} cy={COIL[1] - 1.5} rx="5" ry="2.4" fill="none" stroke={ROPE} strokeWidth="1.8" />
          <ellipse cx={COIL[0]} cy={COIL[1] + 0.8} rx="5" ry="2.4" fill="none" stroke={ROPE_DARK} strokeWidth="1.8" />
        </Layer>
        <Person {...kid} held={bundle} />
        <Sweat t={t} x={head[0] - 6} y={head[1] - 8} show={during(t, ARRIVE + 0.1, REACH + 0.2, 0.2)} />
        {/* ひもを ひっぱる ようす */}
        {ropeShow > 0 && (
          <path
            d={`M${COIL[0]} ${COIL[1] + 1.5} Q${(COIL[0] + hand[0]) / 2} ${Math.max(COIL[1], hand[1]) + sag} ${hand[0]} ${hand[1]}`}
            fill="none"
            stroke={ROPE}
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity={ropeShow}
          />
        )}
        <g opacity={stars}>
          <Star cx={14} cy={36} r={3.2 * stars} color="#ffd24a" spin={t * 90} />
          <Star cx={92} cy={34} r={3.6 * stars} color="#ffffff" spin={-t * 90} />
          <Star cx={80} cy={62} r={2.6 * stars} color="#ffd24a" spin={t * 70} />
        </g>
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
    { at: 0, label: 'しるしの ぼうが 立つ', sound: 'pop' },
    { at: WALK + 0.4, label: '子どもが 10本の ぼうを かかえて あるいてくる' },
    { at: ARRIVE, label: 'ぼうが ばらばら。こまった顔' },
    { at: REACH, label: 'ぼうに かかった ひもを とりに いく' },
    { at: PULL, label: 'ひもを ぐるぐる まく', sound: 'pop' },
    { at: TIGHT, label: 'ぴたっと 10本が 1つの たばに' },
    { at: CHEER, label: 'やった! 手を あげて よろこぶ', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '十 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
