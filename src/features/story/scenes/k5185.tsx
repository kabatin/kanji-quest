/*
 * 内(うち): 雨の中、家の いりぐちから 中に はいると、そこが「うち」。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … 家の 左の かべ
 *   2画目(𠃍)  … 家の やね と 右の かべ(右の かべの 下は、いりぐち の とびら)
 *   3・4画目(入) … 家の中に はいった子の 体と あし(中に「入る」すがた。あしを ひらいて 立つ)
 *                  (字と ぴったりは 重ならない。子は ほんものの 人の つくり で かく)
 *
 * ながれ
 *   雨が ふる → 葉っぱの かさを さした子が、さむそうに あるいてくる
 *   → 家の いりぐちで ぶるぶる。とびらが あいて、あたたかい ひかりが もれる
 *   → 葉っぱを かべに たてかけて、中に はいる。とびらが しまる(雨は そとの もの)
 *   → あったかい 家の中で にっこり、りょうてを あげて 大よろこび
 *   → ほね が ひかって、絵が うすくなり、字「内」が のこる
 *
 * 子は、ほんものの 人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく どう の上。あし は こし から。
 *   むきは ずっと 左(家の ほう)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '内'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const COAT = '#ffc04a'
const COAT_DARK = '#e0992f'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#d5524a'
const WOOD = '#c98a54'
const WOOD_DARK = '#a8764a'
const DOOR = '#b9774a'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const GRASS = '#c5e8a9'
const RAIN = '#5aaee8'
const CLOUD = '#9aa9bd'
const CLOUD_LIGHT = '#b7c3d3'
const WARM = '#fff0c2'
const LAMP = '#ffb84a'

/** くぎり の時間(秒) */
const COME = 0.8
const AT_DOOR = 2.4
const OPEN = 2.6
const PUT_DOWN = 3.0
const ENTER = 3.3
const CLOSE = 4.4
const CHEER = 4.95
const INK = 5.8
const DONE = 8.4
const DURATION = 9

/** 子の 足もとの 高さ(家の ゆか) と、いりぐち・まん中の x */
const FLOOR_Y = 93.5
const WAIT_X = 97
const HOME_X = 55

/** 雨の しずく(そとの 雨だけ。やね の上は やね で とまる) */
const RAIN_COLUMNS = [4, 12, 20, 30, 40, 50, 60, 70, 80, 93, 100, 106]
const ROOF_Y = 30
const GROUND_Y = 95

type Mood = 'cold' | 'happy'
type ArmPose = { readonly swing: number; readonly bend: number }

const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const lerpPose = (a: ArmPose, b: ArmPose, k: number): ArmPose => ({ swing: lerp(a.swing, b.swing, k), bend: lerp(a.bend, b.bend, k) })

function Sky({ t }: SceneProps) {
  const pop = span(t, 0, 0.5, easeOut)
  const drift = wave(t, 6) * 1.6
  return (
    <>
      <Layer opacity={pop} x={drift}>
        <ellipse cx="30" cy="9" rx="18" ry="5.4" fill={CLOUD} />
        <ellipse cx="58" cy="7" rx="22" ry="6" fill={CLOUD} />
        <ellipse cx="88" cy="9" rx="18" ry="5.4" fill={CLOUD} />
        <ellipse cx="56" cy="5.2" rx="12" ry="2.6" fill={CLOUD_LIGHT} />
      </Layer>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {/* いりぐち の まえの みずたまり */}
      <ellipse cx="102" cy="96.4" rx="6.4" ry="1.5" fill="#a9d9f7" />
    </>
  )
}

/** そとの 雨。家の やね の上は やね で とまり、とびらの そとは 地面まで おちる。 */
function Rain({ t }: SceneProps) {
  const fade = span(t, 0.35, 0.9)
  if (fade <= 0) return null
  return (
    <g opacity={fade * 0.85} stroke={RAIN} strokeWidth="0.9" strokeLinecap="round">
      {RAIN_COLUMNS.map((x, i) => {
        const y = 14 + ((t * 55 + i * 23) % 84)
        const endY = x > 24 && x < 88 ? ROOF_Y : GROUND_Y
        if (y > endY) return null
        return <path key={x} d={`M${x} ${y - 5} L${x - 0.8} ${y}`} />
      })}
    </g>
  )
}

/** 家の中: あたたかい ひかり・ランプ・ちゃわんの ある つくえ。 */
function Room({ t }: SceneProps) {
  const steam = (i: number) => {
    const p = ((t * 0.6 + i * 0.33) % 1)
    return <path key={i} d={`M${33 + i * 1.6 + Math.sin(p * 6 + i) * 0.8} ${77 - p * 6} q1 -1.4 0 -2.6`} fill="none" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" opacity={Math.sin(p * Math.PI) * 0.8} />
  }
  return (
    <>
      <rect x="27" y="33" width="59" height="60.5" fill={WARM} />
      <ellipse cx="56" cy="93.2" rx="16" ry="1.6" fill="#e8806f" />
      {/* ランプ: ひもで つるす */}
      <circle cx="54" cy="48" r="13" fill="#ffe58a" opacity={0.3 + 0.04 * wave(t, 2.2)} />
      <path d="M54 33 V41" stroke={WOOD_DARK} strokeWidth="0.8" />
      <path d="M48.6 47.6 Q54 39 59.4 47.6 Z" fill={LAMP} />
      <circle cx="54" cy="48.2" r="1.9" fill="#fff6c8" />
      {/* つくえ と ゆげの出る ちゃわん */}
      <rect x="28.6" y="80" width="12.4" height="2.6" rx="1.2" fill={WOOD_DARK} />
      <path d="M30.6 82.6 V93.4 M39 82.6 V93.4" stroke={WOOD_DARK} strokeWidth="1.6" strokeLinecap="round" />
      <rect x="32" y="76.6" width="5" height="3.6" rx="1.2" fill="#ffffff" />
      <path d="M32.4 77.4 h4.2" stroke="#f07f9e" strokeWidth="0.8" />
      {[0, 1].map(steam)}
    </>
  )
}

/** いりぐち の とびら と、もれてくる ひかり。 */
function Door({ open }: { readonly open: number }) {
  return (
    <>
      <rect x="85.2" y="52" width="6.6" height="41.5" fill="#ffe9a0" opacity={open} />
      <polygon points="91.5,58 109,96 91.5,93.5" fill="#ffe9a0" opacity={open * 0.55} />
      <Layer scaleX={1 - 0.85 * open} origin={[85.4, 70]}>
        <rect x="85.4" y="52" width="6.2" height="41.5" rx="1" fill={DOOR} />
        <circle cx="89.6" cy="75" r="0.9" fill="#ffd24a" />
      </Layer>
    </>
  )
}

/** かべに たてかけた 葉っぱの かさ。 */
function LeanLeaf({ show }: { readonly show: number }) {
  if (show <= 0) return null
  return (
    <Layer scale={show} origin={[98, 94]} rotate={-14}>
      <path d="M98 94 C92 84 93 70 98 62 C103 70 104 84 98 94 Z" fill={LEAF} />
      <path d="M98 93 V66" stroke={LEAF_DARK} strokeWidth="0.9" strokeLinecap="round" />
    </Layer>
  )
}

/** かた から出て、ひじ で まがる うで。からだは 左むき。swing = ま下から まえ(左)へ ふった角度 */
function Arm({ pose, color }: { readonly pose: ArmPose; readonly color: string }) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const upper = 6.5
  const sx = 0
  const sy = -24
  const ex = sx - Math.sin(rad(pose.swing)) * upper
  const ey = sy + Math.cos(rad(pose.swing)) * upper
  const fore = pose.swing + pose.bend
  const hx = ex - Math.sin(rad(fore)) * upper
  const hy = ey + Math.cos(rad(fore)) * upper
  return (
    <>
      <path d={`M${sx} ${sy} L${ex} ${ey} L${hx} ${hy}`} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hx} cy={hy} r="2.3" fill={SKIN} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="-2" cy="-29.4" r="1.5" fill="#ff9d9d" opacity="0.55" />
      {mood === 'cold' ? (
        <>
          <path d="M-4.4 -33.4 l3 -0.8" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <circle cx="-2.8" cy="-31.6" r="0.95" fill="#2b2b2b" />
          <path d="M-4.6 -27.6 q1 -1 2 0 q1 1 2 0" fill="none" stroke="#b9483f" strokeWidth="0.9" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M-4.2 -31.2 Q-2.8 -33 -1.4 -31.2" fill="none" stroke="#2b2b2b" strokeWidth="1" strokeLinecap="round" />
          <path d="M-4.6 -28.6 Q-2.8 -26 -0.8 -28.6 Z" fill="#b9483f" />
        </>
      )}
    </>
  )
}

type ChildProps = {
  readonly step: number
  readonly mood: Mood
  readonly nearArm: ArmPose
  readonly farArm: ArmPose
  readonly leaf: number
}

/** 子ども(足もとが 0,0。高さ 38 ほど)。 */
function Child({ step, mood, nearArm, farArm, leaf }: ChildProps) {
  return (
    <>
      <Arm pose={farArm} color={COAT_DARK} />
      <Layer rotate={step * 22} origin={[0, -14]}>
        <rect x="-1.2" y="-15" width="4" height="15" rx="2" fill={PANTS_DARK} />
        <ellipse cx="0.2" cy="-0.9" rx="3.6" ry="1.9" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 22} origin={[0, -14]}>
        <rect x="-2.8" y="-15" width="4" height="15" rx="2" fill={PANTS} />
        <ellipse cx="-1.6" cy="-0.9" rx="3.6" ry="1.9" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう の上 */}
      <rect x="-1.8" y="-28" width="3.6" height="4.4" rx="1.4" fill={SKIN_SHADE} />
      <rect x="-5.4" y="-26.4" width="10.8" height="13.4" rx="4.6" fill={COAT} />
      <path d="M-4 -16 h8" stroke={COAT_DARK} strokeWidth="1" strokeLinecap="round" />
      {/* あたま(むきは 左) */}
      <circle cx="0" cy="-31.6" r="6.3" fill={SKIN} />
      <circle cx="3.6" cy="-30.6" r="1.2" fill={SKIN_SHADE} />
      <path d="M-5.9 -33 C-6.2 -39.4 5.6 -39.4 6.3 -32.4 L6.3 -27.4 C3.6 -28.6 1.6 -31 -1 -33.6 Q-3.6 -34 -5.9 -33 Z" fill={HAIR} />
      <Face mood={mood} />
      {/* てまえの うで: かおの まえに 出る(よろこぶとき、かおの よこで 見える) */}
      <Arm pose={nearArm} color={COAT} />
      {/* 葉っぱの かさ: てで もつ。しまうとき ちいさくなる */}
      <Layer scale={leaf} origin={[-4.7, -34.2]}>
        <path d="M-4.7 -34.2 L-3.6 -39" stroke={LEAF_DARK} strokeWidth="0.9" strokeLinecap="round" />
        <path d="M-14 -39.4 C-12 -45.6 8 -45.6 10 -39.4 C6 -37.6 -10 -37.6 -14 -39.4 Z" fill={LEAF} />
        <path d="M-12.6 -39.6 C-6 -41.2 4 -41.2 8.6 -39.6" fill="none" stroke={LEAF_DARK} strokeWidth="0.8" strokeLinecap="round" />
      </Layer>
    </>
  )
}

/** さむくて ぶるぶる。 */
function Shiver({ t, x }: SceneProps & { readonly x: number }) {
  const show = during(t, AT_DOOR + 0.05, PUT_DOWN, 0.12)
  if (show <= 0) return null
  const j = wave(t, 0.14) * 0.6
  return (
    <g opacity={show} stroke="#5f7fd6" strokeWidth="0.8" strokeLinecap="round" fill="none" transform={`translate(${x + j} ${FLOOR_Y - 20})`}>
      <path d="M8 -4 q1.4 1.6 0 3.2 q-1.4 1.6 0 3.2" />
      <path d="M-9 -3 q-1.4 1.6 0 3.2 q1.4 1.6 0 3.2" />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  // あるく: いりぐち まで → (とまって ぶるぶる) → 家の中へ
  const walk1 = during(t, COME, AT_DOOR, 0.12)
  const walk2 = during(t, ENTER, CLOSE + 0.1, 0.2)
  const moving = Math.max(walk1, walk2)
  const stride = Math.sin(t * Math.PI * 2 * 1.8) * moving
  const x = t < ENTER ? mix(t, COME, AT_DOOR, WAIT_X + 23, WAIT_X, undefined) : mix(t, ENTER, CLOSE + 0.1, WAIT_X, HOME_X + 4, easeInOut) - span(t, CLOSE + 0.1, CHEER, easeOut) * 4
  const shiver = t >= AT_DOOR && t < PUT_DOWN ? wave(t, 0.14) * 0.6 : 0
  const hop = t >= CHEER && t < INK ? -Math.abs(Math.sin((t - CHEER) * Math.PI * 2.2)) * 2.6 : 0
  const bob = -Math.abs(stride) * 1.2

  const open = span(t, OPEN, OPEN + 0.5, easeOut) * (1 - span(t, CLOSE, CLOSE + 0.5, easeInOut))
  const putDown = span(t, PUT_DOWN, ENTER, easeInOut)
  const mood: Mood = t < ENTER + 0.1 ? 'cold' : 'happy'

  // うで: かさを もつ → おろして あるく → りょうてを あげて 大よろこび
  const holdPose: ArmPose = { swing: 125, bend: 60 }
  const walkNear: ArmPose = { swing: stride * 26, bend: 12 }
  const cheer = span(t, CHEER, CHEER + 0.35, backOut)
  const near = lerpPose(lerpPose(holdPose, walkNear, putDown), { swing: 125, bend: 35 }, cheer)
  const far = lerpPose(lerpPose({ swing: 8, bend: 10 }, { swing: -stride * 26, bend: 12 }, putDown), { swing: 100, bend: 20 }, cheer)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Room t={t} />
        <Door open={open} />
        {/* 家: 左の かべ・やね・右の かべ(右の かべの 下は とびら の ぶん あけておく) */}
        <rect x="20" y="93" width="71" height="3" rx="1.2" fill={WOOD_DARK} />
        <Bone char={CHAR} n={1} color={WOOD} width={6} />
        <Bone char={CHAR} n={2} color={WOOD} width={6} to={0.62} />
        <Rain t={t} />
        <LeanLeaf show={span(t, PUT_DOWN + 0.1, PUT_DOWN + 0.35, backOut)} />
        <ellipse cx={x} cy="94.4" rx="8" ry="1.8" fill="#000000" opacity="0.1" />
        <Layer x={x + shiver} y={FLOOR_Y + hop + bob}>
          <Child step={stride} mood={mood} nearArm={near} farArm={far} leaf={Math.max(0, 1 - putDown)} />
        </Layer>
        <Shiver t={t} x={x} />
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
    { at: 0, label: '雨が ふる', sound: 'pop' },
    { at: COME, label: '葉っぱの かさを さした子が あるいてくる' },
    { at: AT_DOOR, label: 'いりぐちで ぶるぶる。とびらが あく', sound: 'pop' },
    { at: ENTER, label: 'かさを たてかけて、家の中へ はいる' },
    { at: CLOSE, label: 'とびらが しまる' },
    { at: CHEER, label: 'あったかい うちで 大よろこび', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '内 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
