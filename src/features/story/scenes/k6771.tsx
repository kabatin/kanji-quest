/*
 * 東(ひがし): 木の むこうから お日さまが のぼる。
 *
 * ほね(画と絵の対応)
 *   1画目(一)    … 木の いちばん上の、よこに のびた えだ(上に 葉が しげる)
 *   2〜5画目     … 木の むこうに のぼった お日さま(2・3・4・5 = 日 の わく)。
 *                  ほんものの お日さまは まるいので、わくの まんなかに 大きな まるを 重ねる
 *   6画目(丨)    … 木の みき
 *   7・8画目     … みきの 下から 左右へ たれて 地面に とどく 大きな えだ
 *
 * ながれ
 *   まだ くらい あさ。木が そだつ。さむそうな 子どもが 木の まえまで あるいてきて、ふるえて まつ
 *   → 木の むこうの おか から お日さまが 顔を出し、空が あかるく なる。子どもは ふしぎそうに 見上げる
 *   → お日さまが 木の うしろの まんなかまで のぼる。子どもは うれしくて ばんざい
 *   → ほね が ひかって、絵が うすくなり、字「東」が のこる
 *
 * 子どもは ほんものの人の つくり を守る(かた から うで が出て ひじ で まがる。くび は みじかい):
 *   お日さまは 空の いちばん たかい ところに いるので、見上げる ときは あたまを 少し上に むける。
 *   お日さまが のぼる ほうが ひがし。字の 日 は、木の むこう(うしろ)に いる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '東'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#e8665a'
const SHIRT_DARK = '#cf5247'
const SHIRT_FAR = '#b84339'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const GRASS = '#c5e8a9'
const HILL = '#a6d88a'
const SUN = '#ffd24a'
const SUN_LIGHT = '#fff0a8'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const ARRIVE = 1.1
const RISE = 2.1
const TOP = 4.6
const CHEER = 4.2
const INK = 6.0
const DONE = 8.7
const DURATION = 9.4

/** お日さまが 木の うしろで とまる ばしょ(2〜5画目の 日 の わく の まんなか) */
const SUN_POS: readonly [number, number] = [53, 50]
const SUN_R = 17
/** 子どもの 足もと(足の うらの まんなか) */
const KID_FEET: readonly [number, number] = [11, 96]
/** 子どもの かた(足もとから の ずれ) */
const SHOULDER: readonly [number, number] = [0, -23]
const ARM_PART = 6.4

/** 16進の色(#rrggbb)を a から b へ まぜる */
function blend(a: string, b: string, k: number): string {
  const part = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
  const channel = (i: number) => Math.round(part(a, i) + (part(b, i) - part(a, i)) * Math.min(Math.max(k, 0), 1))
  return `#${[0, 1, 2].map((i) => channel(i).toString(16).padStart(2, '0')).join('')}`
}

/** あけがたの 空。くらい 青から、あかるい 水いろへ */
function Sky({ t }: SceneProps) {
  const dawn = span(t, RISE - 0.3, TOP, easeInOut)
  const stars = 1 - span(t, RISE - 0.4, RISE + 1.2)
  return (
    <>
      <rect x="0" y="0" width="109" height="109" fill={blend('#5a6aa8', '#bfe6ff', dawn)} />
      {/* ひがしの そら は ほんのり ももいろ(お日さまの ほう) */}
      <ellipse cx={SUN_POS[0]} cy="88" rx="62" ry="30" fill="#ffb98a" opacity={0.55 * span(t, RISE - 0.3, RISE + 1.2) * (1 - dawn * 0.6)} />
      <g fill="#fff6c8" opacity={stars}>
        {([[10, 10], [27, 22], [90, 12], [100, 34], [72, 6]] as const).map(([x, y], i) => (
          <circle key={x} cx={x} cy={y} r={0.9 + 0.5 * Math.abs(wave(t, 1.3, i * 0.4))} />
        ))}
      </g>
    </>
  )
}

/** お日さま。木の うしろ、おか の うしろ から のぼる。 */
function Sun({ t }: SceneProps) {
  const rise = span(t, RISE, TOP, easeOut)
  const y = mix(t, RISE, TOP, 102, SUN_POS[1], easeOut)
  const halo = 0.3 + 0.1 * wave(t, 1.6)
  if (rise <= 0) return null
  return (
    <>
      <circle cx={SUN_POS[0]} cy={y} r={SUN_R + 8} fill="#ffe38a" opacity={halo * rise} />
      <Layer rotate={t * 14} origin={[SUN_POS[0], y]} opacity={rise}>
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={SUN_POS[0] - 1} y={y - SUN_R - 7} width="2" height="4.6" rx="1" fill={SUN} transform={`rotate(${i * 30} ${SUN_POS[0]} ${y})`} />
        ))}
      </Layer>
      <circle cx={SUN_POS[0]} cy={y} r={SUN_R} fill={SUN} />
      <circle cx={SUN_POS[0] - 4} cy={y - 4} r={SUN_R - 6} fill={SUN_LIGHT} opacity="0.7" />
    </>
  )
}

/** とおくの おか。お日さまの した はんぶんを かくす。 */
function Hills() {
  return (
    <>
      <path d="M-4 100 L-4 84 Q16 74 40 82 Q60 76 80 82 Q100 74 113 84 V100 Z" fill={HILL} />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
    </>
  )
}

/** 木の 葉の かたまり(大きい まる 2こ + ハイライト) */
function Clump({ cx, cy, r }: { readonly cx: number; readonly cy: number; readonly r: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={LEAF_DARK} />
      <circle cx={cx - r * 0.12} cy={cy - r * 0.15} r={r * 0.82} fill={LEAF} />
      <circle cx={cx - r * 0.3} cy={cy - r * 0.4} r={r * 0.32} fill={LEAF_LIGHT} />
    </>
  )
}

function Tree({ t }: SceneProps) {
  // みき が下から のびて、えだ が ひろがり、さいごに 葉が ぽん と しげる
  const trunk = span(t, 0, 0.55, backOut)
  const boughs = span(t, 0.3, 0.8, backOut)
  const leaves = span(t, 0.5, 1.0, backOut)
  const sway = wave(t, 3.4) * 1.2
  return (
    <>
      <ellipse cx="53.5" cy="97.6" rx={18 * trunk} ry="2.8" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.6 + 0.4 * trunk} scaleY={trunk} origin={[53.4, 98]}>
        {/* みきの ねもと: 少し ひろがる */}
        <path d="M46.5 98 Q52 93 51 86 L56 86 Q55.4 93 60.5 98 Z" fill={BARK} />
        <Bone char={CHAR} n={6} color={BARK} width={7.6} />
      </Layer>
      {/* 下へ たれる 左右の えだ(7・8画目) */}
      <Layer scale={boughs} origin={[53.5, 64]}>
        <Bone char={CHAR} n={7} color={BARK} width={5} />
        <Bone char={CHAR} n={8} color={BARK} width={5} />
      </Layer>
      {/* 上の よこえだ(1画目) */}
      <Layer scale={boughs} origin={[53.5, 24]}>
        <Bone char={CHAR} n={1} color={BARK} width={4.6} />
      </Layer>
      {/* えだの先の しげみ */}
      <Layer scale={leaves} origin={[53.5, 40]} rotate={sway * 0.5}>
        <Clump cx={23} cy={91} r={4.6} />
        <Clump cx={92} cy={87.5} r={4.8} />
        <Clump cx={31} cy={22} r={5.6} />
        <Clump cx={77} cy={19.5} r={5.8} />
      </Layer>
      {/* てっぺんの しげみ: 風で ゆっくり ゆれる */}
      <Layer scale={leaves} rotate={sway} origin={[53.5, 24]}>
        <Clump cx={44} cy={14} r={8.5} />
        <Clump cx={63} cy={13} r={8.8} />
        <Clump cx={53.5} cy={8} r={8} />
      </Layer>
    </>
  )
}

type Mood = 'sleepy' | 'wonder' | 'happy'

/** うで の かっこう。swing = ま下から まえ(右)へ ふった角度 / bend = ひじ の まがり(まえへ) */
type ArmPose = { readonly swing: number; readonly bend: number }

const rad = (deg: number) => (deg * Math.PI) / 180

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。体は 右むき。 */
function Arm({ pose, color }: { readonly pose: ArmPose; readonly color: string }) {
  const [sx, sy] = SHOULDER
  const elbow = [sx + Math.sin(rad(pose.swing)) * ARM_PART, sy + Math.cos(rad(pose.swing)) * ARM_PART] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] + Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART] as const
  return (
    <>
      <path d={`M${sx} ${sy} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.1" fill={SKIN} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="5.6" cy="-29.4" r="1.2" fill={CHEEK} opacity="0.55" />
      {mood === 'sleepy' && (
        <>
          <path d="M0.2 -31.6 h2.4 M3.8 -31.6 h2.4" stroke={EYE} strokeWidth="0.9" strokeLinecap="round" />
          <ellipse cx="3.6" cy="-28.6" rx="1" ry="1.3" fill={MOUTH} />
        </>
      )}
      {mood === 'wonder' && (
        <>
          <circle cx="1.4" cy="-31.8" r="1.25" fill={EYE} />
          <circle cx="5" cy="-31.8" r="1.25" fill={EYE} />
          <circle cx="1.8" cy="-32.2" r="0.4" fill="#ffffff" />
          <circle cx="5.4" cy="-32.2" r="0.4" fill="#ffffff" />
          <ellipse cx="3.6" cy="-28.6" rx="0.9" ry="1.1" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M0.2 -31.4 Q1.4 -33.2 2.6 -31.4 M3.8 -31.4 Q5 -33.2 6.2 -31.4" fill="none" stroke={EYE} strokeWidth="0.95" strokeLinecap="round" />
          <path d="M1.8 -29.2 Q3.6 -26.4 5.4 -29.2 Z" fill={MOUTH} />
        </>
      )}
    </>
  )
}

type KidProps = {
  readonly step: number
  readonly mood: Mood
  readonly nearArm: ArmPose
  readonly farArm: ArmPose
  readonly headTilt: number
}

/** 子ども(足の うらの まんなかが 0,0。右むき。せ の高さ 38 ほど)。 */
function Kid({ step, mood, nearArm, farArm, headTilt }: KidProps) {
  return (
    <>
      <Arm pose={farArm} color={SHIRT_FAR} />
      <Layer rotate={step * 18} origin={[0.6, -12]}>
        <rect x="-0.8" y="-13" width="3.6" height="12.4" rx="1.8" fill={PANTS_DARK} />
        <ellipse cx="1.6" cy="-0.7" rx="3.3" ry="1.5" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 18} origin={[-0.6, -12]}>
        <rect x="-2.8" y="-13" width="3.6" height="12.4" rx="1.8" fill={PANTS} />
        <ellipse cx="-0.4" cy="-0.7" rx="3.3" ry="1.5" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう と あたま を つなぐ */}
      <rect x="-1.4" y="-27.4" width="3.2" height="5" rx="1.4" fill={SKIN_SHADE} />
      <rect x="-4.6" y="-25" width="9.2" height="14.4" rx="4" fill={SHIRT} />
      <path d="M-3.4 -15.4 h7" stroke={SHIRT_DARK} strokeWidth="1" strokeLinecap="round" />
      <Arm pose={nearArm} color={SHIRT_DARK} />
      <Layer rotate={headTilt} origin={[0.4, -25]}>
        <circle cx="0.8" cy="-31.4" r="6.4" fill={SKIN} />
        <path d="M-5.4 -31.4 C-5.8 -38 4.2 -39.6 7 -33.4 C5.2 -35 1.8 -35.6 -1.6 -34.6 C-3.6 -34 -4.8 -32.8 -5.4 -31.4 Z" fill={HAIR} />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

/** さむい あさの 白い いき。口の まえから ふわっと のぼる。 */
function Breath({ t, x, y }: SceneProps & { readonly x: number; readonly y: number }) {
  const show = during(t, ARRIVE + 0.2, RISE + 0.6, 0.25)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.5].map((offset) => {
        const p = ((t + offset) % 1) / 1
        return <ellipse key={offset} cx={x + 3 + p * 6} cy={y - p * 4} rx={1.2 + p * 2.2} ry={0.9 + p * 1.5} fill="#ffffff" opacity={0.85 * (1 - p)} />
      })}
    </g>
  )
}

/** あさの 小鳥。お日さまが のぼると、右から とんできて うたう。 */
function Bird({ t }: SceneProps) {
  const fly = span(t, TOP - 0.6, TOP + 1.4)
  if (fly <= 0 || fly >= 1) return null
  const x = 112 - fly * 96
  const y = 28 + Math.sin(fly * Math.PI * 2) * 3 - fly * 4
  const flap = wave(t, 0.18) * 30
  return (
    <Layer x={x} y={y} opacity={Math.min(1, Math.min(fly, 1 - fly) * 8)}>
      <path d="M2.8 0.4 l4.2 -1.4 l-3.2 3 Z" fill="#e2733f" />
      <ellipse cx="0" cy="0" rx="3.8" ry="2.9" fill="#ff9a5c" />
      <circle cx="-2.8" cy="-2.1" r="2.2" fill="#ff9a5c" />
      <path d="M-4.8 -2.2 l-2.2 0.6 l2.1 0.9 Z" fill="#f2b632" />
      <circle cx="-3.4" cy="-2.6" r="0.5" fill={EYE} />
      <Layer rotate={flap} origin={[0.4, -0.6]}>
        <path d="M-1.2 -0.8 Q1.6 -3.6 3.8 -0.6 Q1.6 0.8 -1.2 -0.8 Z" fill="#e2733f" />
      </Layer>
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)

  // あるく: 左から 木の そばまで
  const walking = 1 - span(t, ARRIVE - 0.25, ARRIVE)
  const stride = t < 0.2 ? 0 : Math.sin((t - 0.2) * Math.PI * 2 * 1.8) * walking
  const walkX = mix(t, 0.2, ARRIVE, -28, 0, easeOut)
  const bob = -Math.abs(stride) * 0.8

  // きもち: さむくて ねむい → ふしぎ(見上げる)→ うれしい
  const mood: Mood = t < RISE + 0.2 ? 'sleepy' : t < CHEER - 0.4 ? 'wonder' : 'happy'
  const shiver = t >= ARRIVE && t < RISE + 0.2 ? wave(t, 0.14) * 0.35 : 0

  // うで: さむい ときは 体を だいて ちぢこまる / 見上げる ときは だらんと / うれしい ときは ばんざい
  const hug = span(t, ARRIVE, ARRIVE + 0.3) * (1 - span(t, RISE + 0.3, RISE + 0.7))
  const cheer = span(t, CHEER, CHEER + 0.7, backOut)
  const idle = 5 + wave(t, 1.6) * 2
  const armSwing = (base: number) => base * (1 - hug) * (1 - cheer) + 16 * hug + 118 * cheer
  const nearArm: ArmPose =
    t < ARRIVE - 0.1 ? { swing: -stride * 26, bend: 14 } : { swing: armSwing(idle), bend: 130 * hug + 26 * cheer + 8 * (1 - hug) * (1 - cheer) }
  const farArm: ArmPose =
    t < ARRIVE - 0.1 ? { swing: stride * 26, bend: 14 } : { swing: armSwing(idle - 3), bend: 120 * hug + 26 * cheer + 8 * (1 - hug) * (1 - cheer) }

  // 見上げる(あたまを 少し 上へ)→ うれしくて ぴょんぴょん はねる
  const look = span(t, RISE + 0.2, RISE + 0.9) * (1 - span(t, CHEER - 0.2, CHEER + 0.3))
  const headTilt = -14 * look - 3 * cheer + (t < RISE ? 4 : 0)
  const hopping = span(t, CHEER + 0.7, CHEER + 0.9) * (1 - span(t, INK - 0.15, INK))
  const hop = -Math.abs(wave(t - CHEER, 0.7)) * 4 * hopping

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Sun t={t} />
        <Hills />
        <Tree t={t} />
        <Layer opacity={span(t, 0.15, 0.4)}>
          <ellipse cx={KID_FEET[0] + walkX} cy="97" rx="6.5" ry="1.8" fill="#000000" opacity="0.14" />
          <Layer x={KID_FEET[0] + walkX + shiver} y={KID_FEET[1] + bob + hop}>
            <Kid step={stride} mood={mood} nearArm={nearArm} farArm={farArm} headTilt={headTilt} />
          </Layer>
          <Breath t={t} x={KID_FEET[0] + 4} y={KID_FEET[1] - 28} />
        </Layer>
        <Bird t={t} />
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
    { at: 0, label: 'まだ くらい あさ。木が そだつ', sound: 'pop' },
    { at: ARRIVE, label: 'さむそうな 子どもが 木の まえで まつ' },
    { at: RISE, label: '木の むこうから お日さまが のぼりはじめる', sound: 'pop' },
    { at: CHEER, label: '子どもが うれしくて ばんざい' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '東 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
