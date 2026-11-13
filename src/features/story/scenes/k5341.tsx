/*
 * 十(じゅう): ぼうを 10本 たばねて 1つに。まとまりの しるし。
 *
 * ほね(画と絵の対応)
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
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(手の場所から 2つの ほね で ひじを 計算する)。
 *   ぼうは ほんとうに 長い もの(子どもの せいたけ より 長い)として 描き、字の線に 合わせて 少し 右上がりに かまえる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '十'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#f0a23c'
const TUNIC_DARK = '#d98a26'
const TUNIC_FAR = '#b9751f'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const STICK = '#e0ac6c'
const STICK_DARK = '#c48f52'
const STICK_LIGHT: string = '#f0c88e'
const ROPE = '#e2554a'
const ROPE_DARK = '#bd3d34'
const LEAF = '#55b86e'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'

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

/** 子どもの 立つ場所(たて のぼうの 左がわ) */
const CHILD_X = 8
/** 左むきに かいた 人を ひっくり返すので、かた は 世界では この場所 */
const SHOULDER_W: readonly [number, number] = [55 - 25.4 + CHILD_X, 40]
/** うで の 1つぶん の長さ(かた→ひじ、ひじ→手) */
const ARM_PART = 13
const NECK: readonly [number, number] = [28, 35]

/** たばの まんなか(ひもを まく ところ)。字の 1画目の まんなか あたり */
const BUNDLE_CENTER: readonly [number, number] = [54, 48.4]
/** 字の 1画目に 合わせた かたむき(右が 少し 上がる) */
const BUNDLE_TILT = -3.3
/** ぼう の 長さ・あつさ */
const STICK_LEN = 83
const STICK_THICK = 2.6

/** ひもの わ(しるしの ぼうに かかっている) */
const COIL: readonly [number, number] = [54, 33]
/** ぼうを かかえる 手の場所 */
const HOLD_NEAR: readonly [number, number] = [46, 52]
const HOLD_FAR: readonly [number, number] = [44, 49]
/** よろこぶ ときの 手(Vの字に あげる) */
const CHEER_NEAR: readonly [number, number] = [47, 17]
const CHEER_FAR: readonly [number, number] = [24, 19]

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

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[96, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="95.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 96 13)`} />
        ))}
      </Layer>
      <circle cx="96" cy="13" r={6.2 * sun} fill={SUN} />
      {/* とおくの おか(おくゆき を出す) */}
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 30, 78, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** しるしの ぼう: 地面から ぽん と 立つ。 */
function Post({ t }: SceneProps) {
  const rise = span(t, 0.1, 0.8, backOut)
  return (
    <>
      <ellipse cx="54.2" cy="98.4" rx={7 * rise} ry="2" fill="#000000" opacity="0.12" />
      <Layer scaleY={rise} origin={[54.2, 99.4]}>
        <Bone char={CHAR} n={2} color={BARK} width={5.4} />
        <path d="M52.4 20 q-0.3 28 0.1 66" fill="none" stroke={BARK_DARK} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      </Layer>
    </>
  )
}

type Mood = 'worried' | 'focus' | 'happy'

function Face({ mood }: { readonly mood: Mood }) {
  if (mood === 'happy') {
    return (
      <>
        <path d="M23.8 25.6 Q25.4 23.4 27 25.6" fill="none" stroke="#2b2b2b" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M22.8 28.6 Q25 33.6 28.2 28.8 Z" fill="#b9483f" />
      </>
    )
  }
  if (mood === 'focus') {
    return (
      <>
        <path d="M23.6 23.4 l3.2 0.2" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="25.4" cy="25.6" r="1.15" fill="#2b2b2b" />
        <path d="M23.4 30.2 h3" stroke="#b9483f" strokeWidth="1.3" strokeLinecap="round" />
      </>
    )
  }
  return (
    <>
      <path d="M23.2 24.6 l3.4 -1.8" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="25.4" cy="26" r="1.15" fill="#2b2b2b" />
      <path d="M22.8 30.6 q1 -1.3 2 0 q1 1.3 2 0" fill="none" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
    </>
  )
}

type PersonProps = {
  readonly step: number
  readonly mood: Mood
  readonly headTilt: number
}

/** 子ども(うで は のぞく)。左むきに かいて、場面で ひっくり返して 右を むかせる。 */
function Person({ step, mood, headTilt }: PersonProps) {
  return (
    <>
      <Layer rotate={step * 17} origin={[30, 68]}>
        <rect x="27.2" y="65" width="6.2" height="27.5" rx="3.1" fill={PANTS_DARK} />
        <ellipse cx="28.6" cy="93.4" rx="5.2" ry="2.8" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 17} origin={[25, 68]}>
        <rect x="21.6" y="65" width="6.2" height="27.5" rx="3.1" fill={PANTS} />
        <ellipse cx="23" cy="93.4" rx="5.2" ry="2.8" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう と あたま を つなぐ */}
      <rect x="24.8" y="32" width="5.2" height="8" rx="2.4" fill={SKIN_SHADE} />
      <rect x="20.4" y="36.6" width="14" height="34" rx="6.8" fill={TUNIC} />
      <path d="M22.4 62.5 h10" stroke={TUNIC_DARK} strokeWidth="1.6" strokeLinecap="round" />
      <Layer rotate={headTilt} origin={NECK}>
        <g transform="translate(-1.4 0.6)">
          <circle cx="30.2" cy="24.6" r="9.2" fill={SKIN} />
          <path d="M21.5 23 C21.4 13.8 31.8 11.2 37.8 17 C40.2 20.2 40.2 26 38.2 30.2 C37.6 24.4 33.4 20.2 26.6 20.6 C24.4 20.8 22.6 21.8 21.5 23 Z" fill={HAIR} />
          <circle cx="26.5" cy="28.8" r="2.1" fill="#ff9d9d" opacity="0.55" />
          <Face mood={mood} />
        </g>
      </Layer>
    </>
  )
}

/** かた から出て、ひじ で まがる うで。手の場所から ひじ を 2つの ほね の長さで 計算する。(世界の座標) */
function Arm({ hand, color }: { readonly hand: readonly [number, number]; readonly color: string }) {
  const [sx, sy] = SHOULDER_W
  const dx = hand[0] - sx
  const dy = hand[1] - sy
  const dist = Math.max(Math.hypot(dx, dy), 0.001)
  // とどかない ときは、うでを のばしきった ところで 止める
  const reach = Math.min(dist, ARM_PART * 2 - 0.05)
  const ux = dx / dist
  const uy = dy / dist
  const handX = sx + ux * reach
  const handY = sy + uy * reach
  const rise = Math.sqrt(Math.max(ARM_PART ** 2 - (reach / 2) ** 2, 0))
  // ひじは、下か うしろ(左)へ まがる
  const options = [
    [-uy, ux],
    [uy, -ux],
  ] as const
  const [px, py] = options.reduce((best, o) => (o[0] * -0.5 + o[1] * 1 > best[0] * -0.5 + best[1] * 1 ? o : best))
  const elbowX = sx + ux * (reach / 2) + px * rise
  const elbowY = sy + uy * (reach / 2) + py * rise
  return (
    <>
      <path d={`M${sx} ${sy} L${elbowX} ${elbowY} L${handX} ${handY}`} fill="none" stroke={color} strokeWidth="6.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={handX} cy={handY} r="3.6" fill={SKIN} />
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

/** こまっている ときの あせ(おでこ から しずく)。 */
function Sweat({ t }: SceneProps) {
  const show = during(t, ARRIVE + 0.1, REACH + 0.2, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.5].map((offset) => {
        const p = ((t + offset) % 1) / 1
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" transform={`translate(${44 + p * 3} ${15 + p * 9}) rotate(-10)`} opacity={1 - p} />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 2)

  // あるいてくる: 左から、ぼうを かかえて
  const walking = 1 - span(t, ARRIVE - 0.25, ARRIVE)
  const stride = t < WALK ? 0 : Math.sin((t - WALK) * Math.PI * 2 * 1.7) * walking
  const walkX = mix(t, WALK, ARRIVE, -58, 0, easeOut)
  const bob = -Math.abs(stride) * 1.2

  const mood: Mood = t < REACH ? 'worried' : t < TIGHT ? 'focus' : 'happy'
  const cheer = span(t, CHEER, CHEER + 0.25) * (1 - span(t, CHEER_END - 0.3, CHEER_END))
  const hop = -Math.abs(Math.sin(((t - CHEER) * Math.PI) / 0.7)) * 5 * cheer
  const lookUp = span(t, REACH, REACH + 0.4) * (1 - span(t, PULL + 0.6, PULL + 1)) * 8 + cheer * 5

  // ひもを まく手: かかえる → ひもの わ → ぼうの まわりを ぐるぐる → もどる
  const toCoil = span(t, REACH, REACH + 0.7, easeInOut)
  const wrapU = span(t, PULL, TIGHT - 0.05)
  const phase = -Math.PI / 2 + wrapU * Math.PI * 2 * 3
  const loopX = 52 + 5 * Math.cos(phase)
  const loopY = BUNDLE_CENTER[1] + 7 * Math.sin(phase)
  const wrapping = span(t, PULL - 0.15, PULL + 0.1)
  const release = span(t, TIGHT, TIGHT + 0.3, easeInOut)
  const lerp = (a: number, b: number, k: number) => a + (b - a) * k
  const coilHand: readonly [number, number] = [lerp(HOLD_FAR[0], COIL[0] + 2, toCoil), lerp(HOLD_FAR[1], COIL[1] + 1, toCoil)]
  const farBase: readonly [number, number] = [lerp(coilHand[0], loopX, wrapping), lerp(coilHand[1], loopY, wrapping)]
  const farHand: readonly [number, number] = t < TIGHT ? farBase : [lerp(farBase[0], CHEER_FAR[0], cheer || release), lerp(farBase[1], CHEER_FAR[1], cheer || release)]
  const nearUp = span(t, CHEER - 0.1, CHEER + 0.3, backOut)
  const nearHand: readonly [number, number] = [lerp(HOLD_NEAR[0], CHEER_NEAR[0], nearUp), lerp(HOLD_NEAR[1], CHEER_NEAR[1], nearUp)]

  const tight = span(t, PULL + 0.3, TIGHT, easeInOut)
  // ひもが ぴん と はる ようす(手と わ を むすぶ)
  const ropeShow = span(t, REACH + 0.5, REACH + 0.7) * (1 - span(t, TIGHT - 0.05, TIGHT + 0.2))
  const sag = 7 * (1 - wrapping * 0.7)
  const stars = during(t, CHEER + 0.1, CHEER_END, 0.25)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Post t={t} />
        {/* ひもの わ: しるしの ぼうに かかっている */}
        <Layer opacity={span(t, 0.6, 0.9) * (1 - span(t, PULL + 0.4, PULL + 1.2))}>
          <ellipse cx={COIL[0]} cy={COIL[1] - 1.5} rx="5" ry="2.4" fill="none" stroke={ROPE} strokeWidth="1.8" />
          <ellipse cx={COIL[0]} cy={COIL[1] + 0.8} rx="5" ry="2.4" fill="none" stroke={ROPE_DARK} strokeWidth="1.8" />
        </Layer>

        <ellipse cx={27.5 + CHILD_X + walkX} cy="97.4" rx="9" ry="2.4" fill="#000000" opacity={0.12 * span(t, WALK, WALK + 0.2)} />
        <Layer x={walkX} y={bob + hop} opacity={span(t, WALK - 0.1, WALK + 0.2)}>
          <Layer x={CHILD_X}>
            <Layer scaleX={-1} origin={[27.5, 60]}>
              <Person step={stride} mood={mood} headTilt={lookUp} />
            </Layer>
          </Layer>
          <Sweat t={t} />
        </Layer>

        {/* ぼうの たば と まきつけ(字の 1画目) */}
        <Layer x={walkX} rotate={BUNDLE_TILT} origin={BUNDLE_CENTER} opacity={span(t, WALK - 0.1, WALK + 0.2)}>
          <Bundle t={t} tight={tight} />
          <Wraps t={t} />
        </Layer>

        {/* うで と 手(ぼうの 上に かさねる) */}
        <Layer x={walkX} y={bob + hop}>
          <Layer opacity={span(t, WALK - 0.1, WALK + 0.2)}>
            <Arm hand={farHand} color={TUNIC_FAR} />
            <Arm hand={nearHand} color={TUNIC_DARK} />
          </Layer>
        </Layer>

        {/* ひもを ひっぱる ようす */}
        {ropeShow > 0 && (
          <path
            d={`M${COIL[0]} ${COIL[1] + 1.5} Q${(COIL[0] + farHand[0]) / 2} ${Math.max(COIL[1], farHand[1]) + sag} ${farHand[0]} ${farHand[1]}`}
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
