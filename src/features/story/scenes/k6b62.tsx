/*
 * 止(とまる): あしあと を のこして あるいてきた 子が、ふみきり の前で ぴたっと とまる。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … ふみきり の ささえの はしら(てっぺんに 赤い ランプ)
 *   2画目(一)  … はしら から よこに おりた しゃだんき の ぼう
 *   3画目(丨)  … とまった 子の どう と あし(まっすぐ 立っている)
 *   4画目(一)  … 子が あるいてきた 道の ふち(じめん)
 *
 * ながれ
 *   子が ふんふん♪ と あしあと を つけながら あるいてくる
 *   → ふみきり の ランプが カンカン と ひかり、しゃだんき が おりてくる
 *   → 子は「あっ!」と おどろいて、ぴたっと とまる(あしを そろえて)
 *   → とおくを でんしゃが はしっていく。子は じっと まつ
 *   → でんしゃが いったあと「ちゃんと とまれた」と にっこり
 *   → ほね が ひかって、絵が うすくなり、字「止」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがり、くび は みじかく、あし は こし から。
 *   とまった とき の 体が、3画目の たて線に 重なる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '止'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#ff9a5c'
const SHIRT_DARK = '#e2733f'
const SHIRT_FAR = '#c95f31'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const GRASS = '#c5e8a9'
const HILL = '#e2f2d2'
const SUN = '#ffd24a'
const ROAD = '#ecd9b0'
const ROAD_EDGE = '#cfae80'
const PRINT = '#b08658'
const POLE = '#f4f4f8'
const RED = '#e8534a'
const RED_DARK = '#8a3b3b'
const METAL = '#8d8d99'
const TRAIN = '#4f9be0'
const TRAIN_DARK = '#3c82c4'
const WINDOW = '#fff1b8'

/** くぎり の時間(秒) */
const WALK_END = 3.0
const ALARM = 2.1
const SURPRISE = 2.25
const WAIT = 3.7
const TRAIN_FROM = 4.2
const TRAIN_TO = 6.6
const PROUD = 6.3
const INK = 7.1
const DONE = 10.0
const DURATION = 10.5

/** 子の かた・こし・あたま の場所(3画目の たて線 x=33.4 の上に のる) */
const CHILD_X = 33.4
const SHOULDER: readonly [number, number] = [CHILD_X, 49]
const HIP: readonly [number, number] = [CHILD_X, 68]
const ARM_PART = 8.5
/** 道の はじまり(画面の外ちかく) と とまる場所 の ずれ */
const START_OFFSET = -30
/** しゃだんき の ささえ(2画目の 書きはじめ) と、おりた ときの かたむき */
const PIVOT: readonly [number, number] = [55.8, 49.8]
const BAR_LEN = 29
const BAR_REST = (Math.atan2(47 - 49.8, 84.4 - 55.8) * 180) / Math.PI
const BAR_UP = -62

function Ground() {
  return (
    <>
      <circle cx="13" cy="13" r="6.2" fill={SUN} />
      <path d="M-4 76 Q22 56 48 70 Q76 54 113 72 V90 H-4 Z" fill={HILL} />
      <rect x="-4" y="76" width="117" height="12" fill={GRASS} />
      {/* とおくを はしる でんしゃの せん路(ささえの はしら から はなれた 向こう がわ) */}
      <path d="M-4 74.5 H113" stroke={METAL} strokeWidth="1.2" />
      {Array.from({ length: 24 }, (_, i) => (
        <rect key={i} x={-3 + i * 5} y="74.8" width="1.8" height="2.4" rx="0.5" fill="#a98963" />
      ))}
      <rect x="-4" y="85" width="117" height="14" fill={ROAD} />
      <Bone char={CHAR} n={4} color={ROAD_EDGE} width={3.2} />
    </>
  )
}

function Cloud({ t }: SceneProps) {
  const drift = t * 1.2
  return (
    <g fill="#ffffff" opacity="0.9" transform={`translate(${drift} 0)`}>
      <ellipse cx="74" cy="12" rx="7" ry="3.2" />
      <ellipse cx="79" cy="10.4" rx="4.6" ry="3" />
    </g>
  )
}

/** ふみきり: はしら(1画目)と、おりてくる ぼう(2画目)。ランプは カンカン と こうごに ひかる。 */
function Crossing({ t }: SceneProps) {
  const lower = span(t, ALARM + 0.2, ALARM + 1.2, easeInOut)
  const bar = BAR_UP + (BAR_REST - BAR_UP) * lower
  const alarm = t >= ALARM && t < DONE ? 1 : 0
  const blink = alarm > 0 ? (wave(t, 0.5) > 0 ? 1 : 0) : 0
  const leftOn = blink > 0
  const rightOn = alarm > 0 && !leftOn
  return (
    <>
      <rect x="49.6" y="83" width="12" height="5.4" rx="1.6" fill={METAL} />
      <Bone char={CHAR} n={1} color={POLE} width={4.6} />
      {[58, 70].map((y) => (
        <rect key={y} x="53.3" y={y} width="4.6" height="4.4" fill={RED} />
      ))}
      <rect x="45.4" y="16.6" width="20.2" height="3.6" rx="1.8" fill="#dedee6" />
      <circle cx="49.6" cy="24" r="3.6" fill={leftOn ? '#ff4a3d' : RED_DARK} />
      <circle cx="61.4" cy="24" r="3.6" fill={rightOn ? '#ff4a3d' : RED_DARK} />
      {leftOn && <circle cx="49.6" cy="24" r="6" fill="#ff4a3d" opacity="0.28" />}
      {rightOn && <circle cx="61.4" cy="24" r="6" fill="#ff4a3d" opacity="0.28" />}
      <Layer rotate={bar} origin={PIVOT}>
        <rect x={PIVOT[0]} y={PIVOT[1] - 1.7} width={BAR_LEN} height="3.4" rx="1.7" fill={POLE} />
        {[4, 11, 18, 25].map((dx) => (
          <rect key={dx} x={PIVOT[0] + dx - 1.4} y={PIVOT[1] - 1.7} width="3.6" height="3.4" fill={RED} />
        ))}
        <circle cx={PIVOT[0] + BAR_LEN - 0.6} cy={PIVOT[1]} r="2.1" fill={RED} />
      </Layer>
      <circle cx={PIVOT[0]} cy={PIVOT[1]} r="2.6" fill={METAL} />
    </>
  )
}

/** とおくを とおる でんしゃ: 右から 左へ。ささえの はしら の うしろ。 */
function Train({ t }: SceneProps) {
  const head = mix(t, TRAIN_FROM, TRAIN_TO, 122, -78, (x) => x)
  if (t < TRAIN_FROM || t > TRAIN_TO) return null
  const sway = wave(t, 0.14) * 0.3
  return (
    <g transform={`translate(0 ${sway})`}>
      {[0, 1, 2].map((i) => {
        const x = head + i * 24
        return (
          <g key={i}>
            <rect x={x} y="60" width="22.4" height="13" rx="3" fill={i === 0 ? TRAIN_DARK : TRAIN} />
            <rect x={x + 3} y="63" width="4.4" height="4.4" rx="1" fill={WINDOW} />
            <rect x={x + 9} y="63" width="4.4" height="4.4" rx="1" fill={WINDOW} />
            <rect x={x + 15} y="63" width="4.4" height="4.4" rx="1" fill={WINDOW} />
            <circle cx={x + 5.5} cy="73.4" r="1.7" fill="#3b3b46" />
            <circle cx={x + 16.9} cy="73.4" r="1.7" fill="#3b3b46" />
          </g>
        )
      })}
    </g>
  )
}

type Mood = 'happy' | 'surprised' | 'wait' | 'proud'
type ArmPose = { readonly swing: number; readonly bend: number }

/** かた から出て、ひじ で まがる うで。まえ = 右(x が ふえる ほう)。 */
function Arm({ pose, color }: { readonly pose: ArmPose; readonly color: string }) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const elbow = [SHOULDER[0] + Math.sin(rad(pose.swing)) * ARM_PART, SHOULDER[1] + Math.cos(rad(pose.swing)) * ARM_PART] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] + Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART] as const
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.1" fill={SKIN} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  const eye = '#2b2b2b'
  return (
    <>
      <circle cx="31.4" cy="39.4" r="1.9" fill="#ff9d9d" opacity="0.55" />
      {mood === 'surprised' ? (
        <>
          <circle cx="35.2" cy="35" r="1.7" fill={eye} />
          <circle cx="40.2" cy="35" r="1.7" fill={eye} />
          <path d="M33.2 31.4 l3.4 -0.6 M38.6 30.8 l3.2 0.6" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <ellipse cx="38" cy="40.4" rx="1.5" ry="2" fill="#b9483f" />
        </>
      ) : mood === 'wait' ? (
        <>
          <circle cx="35.4" cy="35.4" r="1.2" fill={eye} />
          <circle cx="40.4" cy="35.4" r="1.2" fill={eye} />
          <path d="M35.8 40.6 h3.6" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
        </>
      ) : mood === 'proud' ? (
        <>
          <path d="M33.6 35.8 Q35.2 33.8 36.8 35.8 M38.6 35.8 Q40.2 33.8 41.8 35.8" fill="none" stroke={eye} strokeWidth="1.25" strokeLinecap="round" />
          <path d="M35 39.6 Q38 43.6 41.2 39.6 Z" fill="#b9483f" />
        </>
      ) : (
        <>
          <circle cx="35.4" cy="35.4" r="1.25" fill={eye} />
          <circle cx="40.4" cy="35.4" r="1.25" fill={eye} />
          <path d="M35.2 39.8 Q38 42.6 40.8 39.6" fill="none" stroke="#b9483f" strokeWidth="1.25" strokeLinecap="round" />
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
  readonly headTilt: number
}

function Child({ step, mood, nearArm, farArm, headTilt }: ChildProps) {
  return (
    <>
      <Arm pose={farArm} color={SHIRT_FAR} />
      <Layer rotate={step * 26} origin={HIP}>
        <rect x={CHILD_X - 3.2} y="65" width="6.4" height="23.4" rx="3.2" fill={PANTS_DARK} />
        <ellipse cx={CHILD_X + 2.6} cy="89.2" rx="5.2" ry="2.6" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 26} origin={HIP}>
        <rect x={CHILD_X - 3.2} y="65" width="6.4" height="23.4" rx="3.2" fill={PANTS} />
        <ellipse cx={CHILD_X + 2.6} cy="89.2" rx="5.2" ry="2.6" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう の まんなか の上 */}
      <rect x={CHILD_X - 2.4} y="42" width="4.8" height="6" rx="2" fill={SKIN_SHADE} />
      <rect x={CHILD_X - 6.4} y="45" width="12.8" height="24" rx="6" fill={SHIRT} />
      <path d={`M${CHILD_X - 4.6} 62 h9.2`} stroke={SHIRT_DARK} strokeWidth="1.5" strokeLinecap="round" />
      <Arm pose={nearArm} color={SHIRT_DARK} />
      <Layer rotate={headTilt} origin={[CHILD_X, 44]}>
        <circle cx="34" cy="35.5" r="8.6" fill={SKIN} />
        <path d="M25.4 35.6 C24.4 25 33 24 39.6 27.4 C42 29 43 32 42.8 33.4 C40 30.6 36 30.4 31 31.6 C28.4 32.2 26.6 33.6 25.4 35.6 Z" fill={HAIR} />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

/** あるいている あいだの ふんふん♪ */
function Notes({ t, x }: { readonly t: number; readonly x: number }) {
  const show = during(t, 0.4, ALARM + 0.1, 0.3)
  if (show <= 0) return null
  const bob = wave(t, 0.8) * 1.2
  return (
    <g opacity={show} fill="#f07f9e" transform={`translate(${x} ${bob})`}>
      <path d="M45 22 v-5.4 l3.2 -1 v5" fill="none" stroke="#f07f9e" strokeWidth="0.9" />
      <ellipse cx="43.8" cy="22.4" rx="1.4" ry="1" />
      <ellipse cx="47" cy="21" rx="1.4" ry="1" />
    </g>
  )
}

/** 「あっ!」の しるし。あたまの 上に ぽん と出る */
function Alert({ t, x }: { readonly t: number; readonly x: number }) {
  const show = during(t, SURPRISE, WAIT, 0.15)
  if (show <= 0) return null
  const pop = Math.max(0, backOut(span(t, SURPRISE, SURPRISE + 0.3)))
  return (
    <g opacity={show} transform={`translate(${x + 43} 22) scale(${pop})`}>
      <rect x="-1.3" y="-8" width="2.6" height="8" rx="1.3" fill={RED} />
      <circle cx="0" cy="3.4" r="1.5" fill={RED} />
    </g>
  )
}

/** ぴたっと とまった しゅんかんの ほこり */
function Dust({ t, x }: { readonly t: number; readonly x: number }) {
  const p = span(t, WALK_END - 0.1, WALK_END + 0.6, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p} fill="#ffffff" stroke="#e3d6b8" strokeWidth="0.5">
      <circle cx={x + 25 - p * 6} cy={89 - p * 3} r={1.6 + p * 1.8} />
      <circle cx={x + 28 - p * 8} cy={90 - p * 1} r={1 + p * 1.4} />
    </g>
  )
}

/** あしあと: 子が とおりすぎた所 に ぽん と のこる */
function Footprints({ childX }: { readonly childX: number }) {
  return (
    <>
      {Array.from({ length: 5 }, (_, k) => {
        const x = 2 + k * 6.4
        const s = Math.max(0, backOut(Math.min(1, Math.max(0, (childX - x - 3) / 2.5))))
        if (s <= 0) return null
        const y = k % 2 === 0 ? 91.4 : 90.2
        return (
          <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
            <ellipse cx="0" cy="0" rx="3.2" ry="1.4" fill={PRINT} />
            <circle cx="3.6" cy="-0.2" r="0.9" fill={PRINT} />
          </g>
        )
      })}
    </>
  )
}

/** ちゃんと まてた ごほうびの きらり */
function Proud({ t }: SceneProps) {
  const show = during(t, PROUD, INK, 0.2)
  if (show <= 0) return null
  const p = Math.max(0, backOut(span(t, PROUD, PROUD + 0.35)))
  return (
    <g opacity={show} transform={`translate(24 22) scale(${p}) rotate(${wave(t, 1) * 8})`}>
      <path d="M0 -4 Q0.9 -0.9 4 0 Q0.9 0.9 0 4 Q-0.9 0.9 -4 0 Q-0.9 -0.9 0 -4 Z" fill="#ffc233" />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  // あるく: 左から。とまる前に ぐっと ブレーキ(あしの ふりが 小さく なる)
  const walking = 1 - span(t, WALK_END - 0.3, WALK_END)
  const stride = Math.sin(t * Math.PI * 2 * 1.9) * walking
  const walkX = mix(t, 0, WALK_END, START_OFFSET, 0, easeOut)
  const bob = -Math.abs(stride) * 1.4
  // ぴたっ: ブレーキで 体が 少し うしろに のけぞって、もどる
  const lean = -Math.sin(span(t, WALK_END - 0.25, WALK_END + 0.55) * Math.PI) * 7
  // ごほうび: ちゃんと まてた とき、ぴょん と 小さく はずむ
  const hop = -Math.sin(span(t, PROUD, PROUD + 0.5) * Math.PI) * 2.6

  const mood: Mood = t < SURPRISE ? 'happy' : t < WAIT ? 'surprised' : t < PROUD ? 'wait' : 'proud'
  // うで: あるくとき ふる。おどろいた とき 手を まえへ(ストップ)。まつとき 下に たらす
  const surprised = span(t, SURPRISE, SURPRISE + 0.25) * (1 - span(t, WAIT - 0.2, WAIT + 0.3))
  const nearArm: ArmPose = { swing: stride * 28 + surprised * 80, bend: 14 - surprised * 4 }
  const farArm: ArmPose = { swing: -stride * 28 + surprised * 70, bend: 14 - surprised * 4 }
  const headTilt = mood === 'wait' ? 2 + wave(t, 1.6) * 1 : mood === 'proud' ? -2 : 0
  const bumpFlip = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground />
        <Cloud t={t} />
        <Train t={t} />
        <Footprints childX={CHILD_X + walkX} />
        <Dust t={t} x={walkX} />
        <ellipse cx={CHILD_X + 2 + walkX} cy="91.4" rx="9" ry="1.8" fill="#000000" opacity="0.1" />
        <Layer x={walkX} y={bob + hop} rotate={lean} origin={[CHILD_X, 90]}>
          <Child step={stride} mood={mood} nearArm={nearArm} farArm={farArm} headTilt={headTilt} />
        </Layer>
        <Notes t={t} x={walkX} />
        <Alert t={t} x={walkX} />
        <Crossing t={t} />
        <Proud t={t} />
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Layer scale={1 + bumpFlip} origin={[54.5, 54.5]}>
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
    { at: 0, label: '子が あしあとを つけて あるいてくる', sound: 'pop' },
    { at: ALARM, label: 'ふみきりが カンカン なりだす' },
    { at: SURPRISE, label: 'あっ! と おどろいて ぴたっと とまる', sound: 'pop' },
    { at: TRAIN_FROM, label: 'でんしゃが とおる。じっと まつ' },
    { at: PROUD, label: 'ちゃんと とまれた と にっこり', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '止 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
