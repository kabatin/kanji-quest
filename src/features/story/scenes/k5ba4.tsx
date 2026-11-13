/*
 * 室(しつ): やねの したに ある へや。あめの なか、さむい子が へやに はいって ほっとする。
 *
 * ほね(画と絵の対応)
 *   1画目(丶)  … やねの うえに のびた えんとつ
 *   2画目(ノ)  … へやの ひだりの かべ(とびら の上の かべ)。その下は あいていて、子が はいってくる
 *   3画目(一)  … やねの ふち(ひさし)。みぎはしが すこし たれる
 *   4画目(一)  … かべの たな
 *   5・6画目   … たなから さがる、ひも の かざり(ゆれる)
 *   7画目(一)  … ベンチの すわる いた
 *   8画目(丨)  … ベンチの まえに たつ スタンド(あかり)の ぼう
 *   9画目(一)  … ゆか
 *
 * ながれ
 *   あめが ふりだし、ゆか・かべ・ベンチ・やねが できて「やねの したの へや」になる
 *   → きいろい かっぱの子が、あめに ぬれて ふるえながら あるいてくる
 *   → へやに はいって ぶるぶると みずを ふるい、ほっと ひといき(やねで あめの おとが ぽつぽつ)
 *   → ベンチに ぴょんと すわり、スタンドの ひもを ひくと あかりが ついて、へやが ぽかぽか
 *   → 子が ばんざい して にこにこ → ほね が ひかり、絵が うすくなって 字「室」が のこる
 *
 * 子は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(ひじ は うしろ、うでさき は まえ)。くび は みじかく、どう の上。
 *   ベンチに すわると、あしは ぶらぶら(ゆかに とどかない たかさ)。あめは ずっと まっすぐ 下に おちる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '室'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const COAT = '#ffcf4a'
const COAT_DARK = '#e6ad2c'
const COAT_FAR = '#d9a024'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const BOOT = '#d95b4b'
const BOOT_DARK = '#b84538'
const WOOD = '#b9824f'
const WOOD_DARK = '#8c5b3c'
const WOOD_DEEP = '#6b4a36'
const BRICK = '#c4694a'
const BRICK_DARK = '#b24f38'
const ROOF = '#e0674a'
const WALL_DIM = '#a9b5c9'
const WALL_WARM = '#ffeccb'
const SKY = '#dbe6f1'
const SKY_DARK = '#6f7f99'
const CLOUD = '#b3bfcf'
const GRASS = '#c5e8a9'
const HILL = '#e2f2d2'
const RAIN = '#5aaee8'
const DROP = '#7cc4f2'
const LAMP_SHADE_ON = '#ffc95e'
const LAMP_SHADE_OFF = '#b9a27c'
const BULB_ON = '#fff6c8'
const BULB_OFF = '#cfd3da'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const POT = '#d98a5a'

/** くぎり の時間(秒) */
const WALK = 1.2
const ARRIVE = 2.8
const SIGH = 3.4
const HOP = 3.9
const REACH = 4.6
const PULL = 5.3
const LIGHT = 5.45
const INK = 6.8
const DONE = 9.4
const DURATION = 10

/** ゆか(子の あしの うら)の たかさ。やねの ひくい ところ と ゆか の ひろさ */
const FLOOR = 93.8
const SCALE = 0.95
const STAND_X = 27
const SEAT_X = 41.5
/** ベンチに すわったとき、からだ が うかぶ たかさ(いた の うえ に おしりが のる) */
const SEAT_LIFT = 3.8
/** ひも の 先(スタンドの かさ の ふちから さがる) */
const CORD: readonly [number, number] = [56.2, 68.4]

/** からだの ながさ(ゆか から あし、かた、あたま) */
const HIP_Y = -17.6
const SHOULDER_Y = -33
const PELVIS: readonly [number, number] = [0, -16]
const THIGH = 8
const ARM_PART = 8.6

type Pt = readonly [number, number]

/** やねの たかさ(x の ところ)。まんなかが いちばん たかい */
const roofTop = (x: number) => 15.5 + Math.abs(x - 54) * 0.2857

function rotatePoint(p: Pt, origin: Pt, deg: number): Pt {
  const rad = (deg * Math.PI) / 180
  const dx = p[0] - origin[0]
  const dy = p[1] - origin[1]
  return [origin[0] + dx * Math.cos(rad) - dy * Math.sin(rad), origin[1] + dx * Math.sin(rad) + dy * Math.cos(rad)]
}

/** うで を かた・ひじ・手 で つなぐ。ひじ は 下か うしろ に まがる。とどかない ときは のばしきる。 */
function solveArm(shoulder: Pt, target: Pt): { readonly elbow: Pt; readonly hand: Pt } {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.hypot(dx, dy) || 0.001
  const reach = Math.min(dist, 2 * ARM_PART - 0.05)
  const ux = dx / dist
  const uy = dy / dist
  const h = Math.sqrt(Math.max(0, ARM_PART * ARM_PART - (reach / 2) ** 2))
  const mx = shoulder[0] + (ux * reach) / 2
  const my = shoulder[1] + (uy * reach) / 2
  const a: Pt = [mx - uy * h, my + ux * h]
  const b: Pt = [mx + uy * h, my - ux * h]
  const score = (p: Pt) => p[1] - 0.5 * p[0]
  return { elbow: score(a) >= score(b) ? a : b, hand: [shoulder[0] + ux * reach, shoulder[1] + uy * reach] }
}

/** じかん と かたち の ならび(キーフレーム)から、いまの かたち を ゆるやかに つなぐ */
function track(t: number, keys: readonly (readonly [number, number])[]): number {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i += 1) {
    if (t <= keys[i][0]) return mix(t, keys[i - 1][0], keys[i][0], keys[i - 1][1], keys[i][1], easeInOut)
  }
  return keys[keys.length - 1][1]
}

function trackPt(t: number, keys: readonly (readonly [number, Pt])[]): Pt {
  const x = track(t, keys.map(([time, p]) => [time, p[0]] as const))
  const y = track(t, keys.map(([time, p]) => [time, p[1]] as const))
  return [x, y]
}

/* ───────── 子(からだの ざひょうは、あしの うら が 0,0・まえ が +x) ───────── */

type Mood = 'cold' | 'calm' | 'happy'

type ChildPose = {
  readonly mood: Mood
  /** あし: ふとももの かくど(ま下から まえへ)・すねの かくど */
  readonly thigh: number
  readonly shin: number
  readonly thighFar: number
  readonly shinFar: number
  /** ねこぜ・まえかがみ(こしを じく に まえへ たおす かくど) */
  readonly lean: number
  readonly headTilt: number
  readonly nearHand: Pt
  readonly farHand: Pt
}

function Leg({ thigh, shin, pants, boot }: { readonly thigh: number; readonly shin: number; readonly pants: string; readonly boot: string }) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const knee: Pt = [Math.sin(rad(thigh)) * THIGH, HIP_Y + Math.cos(rad(thigh)) * THIGH]
  const ankle: Pt = [knee[0] + Math.sin(rad(shin)) * THIGH, knee[1] + Math.cos(rad(shin)) * THIGH]
  return (
    <>
      <path d={`M0 ${HIP_Y} L${knee[0]} ${knee[1]} L${ankle[0]} ${ankle[1]}`} fill="none" stroke={pants} strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx={ankle[0] + 0.8} cy={ankle[1] + 0.6} rx="2.7" ry="1.9" fill={boot} transform={`rotate(${shin} ${ankle[0]} ${ankle[1]})`} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <ellipse cx="1.1" cy="-40.4" rx="1.3" ry="0.9" fill={CHEEK} opacity="0.6" />
      {mood === 'cold' && (
        <>
          <path d="M1.0 -45.7 L3.7 -46.6" stroke={HAIR} strokeWidth="0.7" strokeLinecap="round" />
          <circle cx="2.6" cy="-43.4" r="0.85" fill={EYE} />
          <path d="M2.2 -38.9 q0.7 -0.9 1.4 0 q0.7 0.9 1.4 0" fill="none" stroke={MOUTH} strokeWidth="0.7" strokeLinecap="round" />
        </>
      )}
      {mood === 'calm' && (
        <>
          <circle cx="2.6" cy="-43.4" r="0.85" fill={EYE} />
          <path d="M2.3 -39.4 Q3.4 -38.5 4.6 -39.6" fill="none" stroke={MOUTH} strokeWidth="0.7" strokeLinecap="round" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M1.6 -43 Q2.6 -44.5 3.7 -43" fill="none" stroke={EYE} strokeWidth="0.8" strokeLinecap="round" />
          <path d="M2.0 -39.9 Q3.4 -37.2 4.9 -39.9 Z" fill={MOUTH} />
        </>
      )}
    </>
  )
}

function Child({ pose }: { readonly pose: ChildPose }) {
  const shoulder = rotatePoint([0, SHOULDER_Y], PELVIS, pose.lean)
  const near = solveArm(shoulder, pose.nearHand)
  const far = solveArm(shoulder, pose.farHand)
  const sleeve = (arm: { readonly elbow: Pt; readonly hand: Pt }, color: string) => (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${arm.elbow[0]} ${arm.elbow[1]} L${arm.hand[0]} ${arm.hand[1]}`} fill="none" stroke={color} strokeWidth="3.9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={arm.hand[0]} cy={arm.hand[1]} r="2" fill={SKIN} />
    </>
  )
  return (
    <>
      {sleeve(far, COAT_FAR)}
      <Leg thigh={pose.thighFar} shin={pose.shinFar} pants={PANTS_DARK} boot={BOOT_DARK} />
      <Leg thigh={pose.thigh} shin={pose.shin} pants={PANTS} boot={BOOT} />
      <Layer rotate={pose.lean} origin={PELVIS}>
        {/* くび: どう と あたま の間を みじかく つなぐ */}
        <rect x="-1.5" y="-38" width="3" height="5.5" rx="1.4" fill={SKIN_SHADE} />
        <rect x="-4.4" y="-35.5" width="8.8" height="20.5" rx="4.4" fill={COAT} />
        <path d="M0.4 -33.5 V-17" stroke={COAT_DARK} strokeWidth="0.8" strokeLinecap="round" />
        {/* せなかに たれた フード */}
        <circle cx="-4.3" cy="-33.8" r="2.7" fill={COAT_DARK} />
        <Layer rotate={pose.headTilt} origin={[0, -36.5]}>
          <circle cx="0" cy="-42.5" r="5.4" fill={SKIN} />
          <path d="M-5.5 -42 C-6.2 -49.4 2.2 -50.4 5.2 -46 C2.6 -46.6 0.2 -45.6 -1 -43.4 C-2.6 -44 -4.2 -43 -5.5 -42 Z" fill={HAIR} />
          <Face mood={pose.mood} />
        </Layer>
      </Layer>
      {sleeve(near, COAT_DARK)}
    </>
  )
}

/* ───────── まわり ───────── */

function Sky({ t, rain }: { readonly t: number; readonly rain: number }) {
  return (
    <>
      <rect x="-2" y="-2" width="113" height="100" fill={SKY} />
      <rect x="-2" y="-2" width="113" height="100" fill={SKY_DARK} opacity={0.28 * rain} />
      <g fill={CLOUD} transform={`translate(${((t * 1.2) % 40) - 20} 0)`}>
        <ellipse cx="14" cy="2" rx="16" ry="6" />
        <ellipse cx="38" cy="0" rx="12" ry="5" />
        <ellipse cx="80" cy="3" rx="15" ry="6" />
        <ellipse cx="104" cy="1" rx="13" ry="5" />
      </g>
      <path d="M-4 94 Q18 84 42 92 Q70 80 113 92 V96 H-4 Z" fill={HILL} />
      <rect x="-2" y={FLOOR} width="113" height="18" fill={GRASS} />
    </>
  )
}

/** あめ。まっすぐ 下に おちる。やねや かべの うしろ を通るので、へやの中には ふらない。 */
function Rain({ t, amount }: { readonly t: number; readonly amount: number }) {
  if (amount <= 0) return null
  const columns = [3, 11, 19, 27, 35, 43, 51, 59, 67, 75, 83, 91, 99, 106]
  return (
    <g opacity={0.8 * amount} stroke={RAIN} strokeWidth="0.9" strokeLinecap="round">
      {columns.flatMap((x, i) =>
        [0, 0.5].map((half) => {
          const p = (t * 1.5 + i * 0.37 + half) % 1
          const y = -4 + p * 97
          return <path key={`${x}-${half}`} d={`M${x} ${y} v4.2`} />
        }),
      )}
    </g>
  )
}

/** やねに あたって はねる あめ(ぽつぽつ の おと) */
function RoofSplash({ t, amount }: { readonly t: number; readonly amount: number }) {
  if (amount <= 0) return null
  return (
    <g fill="none" stroke="#ffffff" strokeWidth="0.7" strokeLinecap="round" opacity={amount}>
      {[26, 40, 68, 82].map((x, k) => {
        const phase = (t * 1.5 + k * 0.31) % 1
        if (phase > 0.22) return null
        const u = phase / 0.22
        const y = roofTop(x) + 0.6
        return <path key={x} d={`M${x - 1 - u * 2.2} ${y} q${1 + u * 2.2} ${-2.6 - u * 1.4} ${2 + u * 4.4} 0`} opacity={1 - u} />
      })}
    </g>
  )
}

/** かべの たな・かざり・うえきばち */
function ShelfThings({ t, lit }: { readonly t: number; readonly lit: number }) {
  const sway = wave(t, 2.6) * 1.6
  const bulbs: readonly Pt[] = [[46.2, 48.8], [40.7, 55.2], [39.2, 60], [47.2, 58.7], [55.5, 56.7], [63.7, 54.8]]
  const bulbColors = ['#ff9d9d', '#ffd24a', '#9edb6a', '#7cc4f2', '#ff9d9d', '#ffd24a']
  return (
    <>
      <path d="M38 40 v5 l-4 -5 Z M70 40 v5 l4 -5 Z" fill={WOOD_DARK} />
      <Bone char={CHAR} n={4} color={WOOD_DARK} width={3.4} />
      <g>
        <path d="M33.4 38 h7.2 l-1 -7.6 h-5.2 Z" fill={POT} />
        <circle cx="35.6" cy="27.6" r="3.8" fill={LEAF_DARK} />
        <circle cx="39.2" cy="28.6" r="3.2" fill={LEAF} />
        <circle cx="37" cy="25" r="3" fill={LEAF} />
      </g>
      <Layer rotate={sway} origin={[49.8, 41]}>
        <Bone char={CHAR} n={5} color={WOOD_DEEP} width={1} />
        {bulbs.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.7" fill={bulbColors[i]} opacity={0.55 + 0.45 * lit} />
        ))}
      </Layer>
      <Layer rotate={-sway * 0.8} origin={[66, 40]}>
        <path d="M66 39.4 L66.1 46.9" stroke="#8f9cec" strokeWidth="1.5" strokeLinecap="round" />
        <Bone char={CHAR} n={6} color="#8f9cec" width={1.6} />
        <circle cx="77.2" cy="58.4" r="2.2" fill="#ffd24a" />
        <circle cx="77.2" cy="58.4" r="0.9" fill="#fff6c8" />
      </Layer>
    </>
  )
}

function Lamp({ lit, pull }: { readonly lit: number; readonly pull: number }) {
  const cordEnd = CORD[1] + pull * 1.8
  return (
    <>
      <ellipse cx="54" cy="93.4" rx="6.4" ry="1.7" fill={WOOD_DEEP} />
      <Bone char={CHAR} n={8} color={WOOD_DEEP} width={2.2} />
      <ellipse cx="54" cy="66.2" rx="2.4" ry="1.5" fill={lit > 0.5 ? BULB_ON : BULB_OFF} />
      <path d="M50.8 56.5 L57.2 56.5 L60.5 65.5 L47.5 65.5 Z" fill={lit > 0.5 ? LAMP_SHADE_ON : LAMP_SHADE_OFF} stroke={lit > 0.5 ? LAMP_SHADE_ON : LAMP_SHADE_OFF} strokeWidth="1.2" strokeLinejoin="round" />
      <path d={`M${CORD[0]} 65.6 L${CORD[0]} ${cordEnd}`} stroke={WOOD_DEEP} strokeWidth="0.6" />
      <circle cx={CORD[0]} cy={cordEnd + 0.6} r="0.9" fill={WOOD_DEEP} />
    </>
  )
}

/** あかりが ついたときの ひかり(スタンドの したへ ひろがる) */
function LampLight({ lit, t }: { readonly lit: number; readonly t: number }) {
  if (lit <= 0) return null
  const flicker = 1 + wave(t, 0.9) * 0.04
  return (
    <>
      <path d="M49 65.5 L59 65.5 L74 93.8 L34 93.8 Z" fill="#ffe9a0" opacity={0.34 * lit} />
      <circle cx="54" cy="66" r={16 * lit * flicker} fill="#fff3b0" opacity={0.3 * lit} />
    </>
  )
}

/** からだを ぶるぶる したときの みずしぶき */
function Droplets({ t, x }: { readonly t: number; readonly x: number }) {
  const show = during(t, ARRIVE, SIGH + 0.2, 0.1)
  if (show <= 0) return null
  const p = span(t, ARRIVE, SIGH + 0.2)
  return (
    <g fill={DROP} opacity={show}>
      {[-1, 1].flatMap((dir) =>
        [0, 1, 2].map((i) => {
          const q = (p * 2 + i * 0.33) % 1
          return <circle key={`${dir}-${i}`} cx={x + dir * (7 + q * 9)} cy={66 - i * 5 + q * 9 - Math.sin(q * Math.PI) * 6} r={1.1 * (1 - q * 0.5)} opacity={1 - q} />
        }),
      )}
    </g>
  )
}

/** ほっと した ときの「ふう」 */
function Sigh({ t, x }: { readonly t: number; readonly x: number }) {
  const show = during(t, SIGH, HOP + 0.2, 0.2)
  if (show <= 0) return null
  const p = span(t, SIGH, HOP + 0.2, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={x + 8 + p * 7} cy={54 - p * 4} rx={2.6 + p * 2.2} ry={1.8 + p * 1.4} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <ellipse cx={x + 5.5 + p * 4} cy={55.4 - p * 1.5} rx={1.3 + p * 0.8} ry={1 + p * 0.5} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
    </g>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 9)

  // できあがり: ゆか → かべ → ベンチ → あかり → やね の じゅんに できる
  const floor = span(t, 0.1, 0.5, backOut)
  const wall = span(t, 0.25, 0.75, backOut)
  const bench = span(t, 0.55, 0.95, backOut)
  const things = span(t, 0.8, 1.2, backOut)
  const roofP = span(t, 0.5, 1.15, backOut)
  const rain = span(t, 0.2, 1.4)
  const lit = span(t, LIGHT, LIGHT + 0.25)

  // 子の うごき
  const arriving = t >= WALK
  const walkX = mix(t, WALK, ARRIVE, -18, STAND_X, easeInOut)
  const hopP = span(t, HOP, HOP + 0.6)
  const sitP = span(t, HOP + 0.3, HOP + 0.6, easeOut)
  const x = t < ARRIVE ? walkX : STAND_X + (SEAT_X - STAND_X) * easeInOut(hopP)
  const stride = t < WALK || t >= ARRIVE ? 0 : Math.sin((t - WALK) * Math.PI * 2 * 1.9) * (1 - span(t, ARRIVE - 0.35, ARRIVE))
  const arc = Math.sin(hopP * Math.PI) * 7
  const bob = -Math.abs(stride) * 0.8
  const y = FLOOR - SEAT_LIFT * sitP - arc + bob
  const shake = during(t, ARRIVE, SIGH, 0.08) * wave(t - ARRIVE, 0.14) * 7
  const happy = t >= LIGHT
  const mood: Mood = t < SIGH ? 'cold' : happy ? 'happy' : 'calm'

  // あしの かっこう: あるく → ぴょん と すわる → ぶらぶら(うれしいと おおきく)
  const tuck = easeOut(span(t, HOP, HOP + 0.5))
  const kick = sitP * (happy ? 15 : 5)
  const walkAngle = stride * 17
  const thigh = walkAngle * (1 - tuck) + 90 * tuck
  const shin = walkAngle * (1 - tuck) - 35 * Math.sin(hopP * Math.PI) + wave(t, 0.8) * kick
  const thighFar = -walkAngle * (1 - tuck) + 82 * tuck
  const shinFar = -walkAngle * (1 - tuck) - 35 * Math.sin(hopP * Math.PI) - wave(t, 0.8) * kick

  // うで: さむくて だきかかえる → だらんと下げる → ひざ → ひも → ばんざい → ひざ
  const hug: Pt = [5, -26]
  const hugFar: Pt = [3.5, -24.5]
  const hang: Pt = [1, -17]
  const thighHand: Pt = [4.5, -20.6]
  const thighHandFar: Pt = [3, -20.2]
  const cord: Pt = [(CORD[0] - SEAT_X) / SCALE, (CORD[1] - (FLOOR - SEAT_LIFT)) / SCALE]
  const cheer: Pt = [10, -47]
  const cheerFar: Pt = [-6, -46]
  const nearBase = trackPt(t, [[0, hug], [SIGH, hug], [SIGH + 0.4, hang], [HOP + 0.4, hang], [HOP + 0.6, thighHand], [REACH, thighHand], [REACH + 0.55, cord], [LIGHT + 0.15, cord], [LIGHT + 0.55, cheer], [6.2, cheer], [6.6, thighHand]])
  const pullDip = Math.sin(span(t, PULL, LIGHT + 0.15) * Math.PI) * (1.8 / SCALE)
  const shiver = t < SIGH ? wave(t, 0.1) * 0.4 : 0
  const nearHand: Pt = [nearBase[0] + shiver, nearBase[1] + pullDip]
  const farHand = trackPt(t, [[0, hugFar], [SIGH, hugFar], [SIGH + 0.4, hang], [HOP + 0.4, hang], [HOP + 0.6, thighHandFar], [LIGHT + 0.15, thighHandFar], [LIGHT + 0.55, cheerFar], [6.2, cheerFar], [6.6, thighHandFar]])
  const lean = track(t, [[0, 7], [SIGH, 7], [HOP, 0], [REACH, 0], [REACH + 0.5, 10], [LIGHT + 0.1, 10], [LIGHT + 0.5, 0]])
  const headTilt = track(t, [[0, 9], [SIGH, 9], [SIGH + 0.4, 0], [REACH, 0], [REACH + 0.4, -6], [LIGHT + 0.1, -6], [LIGHT + 0.5, -4]])

  const pose: ChildPose = { mood, thigh, shin, thighFar, shinFar, lean, headTilt, nearHand, farHand }
  const wallColor = lit > 0 ? WALL_WARM : WALL_DIM

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} rain={rain} />
        <Rain t={t} amount={rain} />

        {/* へやの なか: かべ・ゆか・ベンチ */}
        <Layer scaleY={wall} origin={[54, FLOOR]}>
          <rect x="18" y="27" width="72" height="68" fill={WALL_DIM} />
          <rect x="18" y="27" width="72" height="68" fill={wallColor} opacity={lit} />
          <rect x="89.6" y="27" width="3.4" height="68" fill={WOOD_DARK} />
        </Layer>
        <Layer opacity={things} scale={0.6 + 0.4 * things} origin={[54, 40]}>
          <ShelfThings t={t} lit={lit} />
        </Layer>
        <Layer scaleX={floor} origin={[54, 95]}>
          <Bone char={CHAR} n={9} color={WOOD} width={3.8} />
        </Layer>
        <LampLight lit={lit} t={t} />
        <Layer scaleY={bench} origin={[54, FLOOR]}>
          <rect x="32.6" y="78" width="3" height="16" fill={WOOD_DARK} />
          <rect x="72.4" y="78" width="3" height="16" fill={WOOD_DARK} />
          <Bone char={CHAR} n={7} color={WOOD} width={4.6} />
        </Layer>
        <Layer scaleY={things} origin={[54, FLOOR]}>
          <Lamp lit={lit} pull={Math.sin(span(t, PULL, LIGHT + 0.15) * Math.PI)} />
        </Layer>

        {/* 子 */}
        {arriving && (
          <>
            <ellipse cx={x} cy={FLOOR + 0.8} rx="6" ry="1.4" fill="#000000" opacity={0.14 * (1 - sitP)} />
            <Layer x={x} y={y} rotate={shake} scale={SCALE}>
              <Child pose={pose} />
            </Layer>
            <Droplets t={t} x={x} />
            <Sigh t={t} x={x} />
          </>
        )}

        {/* やね(ひさし と えんとつ)は いちばん うえ から ぽん と のる */}
        <Layer y={-(1 - roofP) * 30} opacity={Math.min(1, roofP * 3)}>
          <Bone char={CHAR} n={1} color={BRICK} width={6.4} />
          <rect x="49" y="7.6" width="8.6" height="2.8" rx="1.2" fill={BRICK_DARK} />
          <path d="M12 29 L54 17 L96 29 Z" fill={ROOF} stroke={ROOF} strokeWidth="3" strokeLinejoin="round" />
          <Bone char={CHAR} n={3} color={BRICK_DARK} width={3.6} />
          <Bone char={CHAR} n={2} color={WOOD_DARK} width={4.2} />
        </Layer>
        <RoofSplash t={t} amount={rain * roofP} />
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
    { at: 0, label: 'あめが ふり、へやと やねが できる', sound: 'pop' },
    { at: WALK, label: 'ぬれた子が ふるえながら あるいてくる' },
    { at: ARRIVE, label: 'やねの したに はいって ぶるぶる', sound: 'pop' },
    { at: HOP, label: 'ほっと して ベンチに すわる' },
    { at: PULL, label: 'ひもを ひくと、あかりが つく', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '室 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
