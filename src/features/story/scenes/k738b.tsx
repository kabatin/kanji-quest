/*
 * 王(おう): 大きな おのを もちあげた つよい わかものが、王さまに なる。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … おのの てっぺんの はたざお(よこぼう)。りょうはしに ふさ
 *   2画目(丨)  … おのの え(ながい もちて)。まんなかを まっすぐ
 *   3画目(一)  … おのの は の うえの へり(え が とおる ところ)
 *   4画目(一)  … おのの は の さき(ひろがった 刃)。地めんに ささっている ところ
 *
 * ながれ
 *   大きな おのが ずしんと 地めんに ささる(つよさの しるし)
 *   → わかものが あるいてきて、おのを 見あげる。とおくの おか では 村の人が 見まもる
 *   → えを りょうてで つかんで ぐいっ…ぐいっ…(ふんばる)→ ぬけて もちあがる!(みんな 大よろこび)
 *   → しろい はとが 王かんを はこんできて、わかものの あたまに のせる
 *   → おのを どしんと たてて、王さまの できあがり → ほね が ひかって、絵が うすくなり 字「王」が のこる
 *
 * 人・はと・おのは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   人は よこむき。うで は かた から出て ひじ で まがり、手が えを にぎる。くび は みじかく どう の上。
 *   おのは え が は の まんなかを とおり、は は ひろがった 台形で、さき が 地めんに むく。
 *   はとは はね が せなか から出て、あしで 王かんを つかんで はこぶ。
 */
import { during, easeIn, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '王'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#e8745a'
const TUNIC_DARK = '#cf5c44'
const TUNIC_FAR = '#b44d3a'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const GOLD = '#f2b632'
const GOLD_DARK = '#d99a1c'
const RED = '#e8534a'
const WOOD = '#9a6a45'
const WOOD_DARK = '#7a5033'
const STEEL = '#a9b8cb'
const STEEL_DARK = '#8396ad'
const STEEL_LIGHT = '#dbe4ee'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const HILL = '#e2f2d2'
const MOUND = '#b5df94'
const SUN = '#ffd24a'

/** くぎり の時間(秒) */
const LAND = 0.7
const WALK = 1.0
const ARRIVE = 2.2
const GRIP = 2.5
const STRAIN = 2.9
const LIFT = 3.9
const DOVE = 4.4
const DROP = 5.0
const CROWNED = 5.3
const SET_DOWN = 5.5
const INK = 6.3
const DONE = 9.5
const DURATION = 10.1

/** おのの え の まんなか(x)と、地めん(足もと・は の さき) */
const SHAFT_X = 54
const GROUND_Y = 91
/** おのを もちあげる高さ */
const LIFT_HEIGHT = 12
/** 人の かた(うで の つけね)と 足の つけね、あたまの まんなか */
const SHOULDER: readonly [number, number] = [44, 49]
const HIP: readonly [number, number] = [44, 70]
const NECK: readonly [number, number] = [44.5, 43]
const ARM_PART = 10
/** 王かんが あたまに のるときの 場所(まんなか・そこ) */
const CROWN_SEAT: readonly [number, number] = [44.5, 29.4]

type Pt = readonly [number, number]

/** かた と 手 の 場所から、ひじ の場所を 出す(うで の 2つの ほね は 同じ長さ)。 */
function limb(shoulder: Pt, hand: Pt, len: number): { readonly elbow: Pt; readonly hand: Pt } {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const dist = Math.hypot(dx, dy) || 1
  const reach = Math.min(dist, 2 * len - 0.05)
  const ux = dx / dist
  const uy = dy / dist
  const half = reach / 2
  const bulge = Math.sqrt(Math.max(0, len * len - half * half))
  // ひじ は 下・うしろ(左)へ とび出す
  return {
    elbow: [shoulder[0] + ux * half - uy * bulge, shoulder[1] + uy * half + ux * bulge],
    hand: [shoulder[0] + ux * reach, shoulder[1] + uy * reach],
  }
}

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill={HILL} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="-4" cy="40" rx="7" ry="3.4" />
        <ellipse cx="1" cy="38" rx="5" ry="3.4" />
        <ellipse cx="74" cy="30" rx="6" ry="2.8" />
        <ellipse cx="78.5" cy="28.4" rx="4.4" ry="3" />
      </g>
      {/* 村の人が 見まもる とおくの おか */}
      <path d="M82 92 Q85 66 108 62 V92 Z" fill={MOUND} />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
    </>
  )
}

/** 地めんの 前がわの くさ(おのの は の さきが ささって いるように 見せる) */
function FrontGrass() {
  return (
    <>
      {[16, 30, 44, 62, 76, 90].map((x) => (
        <path key={x} d={`M${x} 93.2 l1.4 -3.8 l1 3.2 l1.6 -4.4 l0.8 4.8 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** おの。え・は・はたざお。 */
function Axe({ t }: SceneProps) {
  const sway = wave(t, 1.6) * 1.2
  return (
    <>
      {/* は: かたい ぎん色の 刃。え の まわりは ほそく、さきへ ひろがり、さき は まるく ふくらむ */}
      <path d="M29.5 53.6 L80 52.6 Q84 70 96 87 Q56 99 14 90.6 Q26 72 29.5 53.6 Z" fill={STEEL} />
      <path d="M29.5 53.6 L80 52.6 Q81 62 85 72 Q56 77 24 72 Q28 62 29.5 53.6 Z" fill={STEEL_LIGHT} opacity="0.55" />
      <path d="M96 87 Q56 99 14 90.6 L17 85.6 Q56 93.6 93 82 Z" fill={STEEL_DARK} />
      <path d="M14 90.6 Q56 99 96 87" fill="none" stroke="#eef3f8" strokeWidth="1.6" strokeLinecap="round" />
      {/* え を とおす 金ぐ(は の ねもと) */}
      <rect x="45" y="50.6" width="18" height="9" rx="2.4" fill={STEEL_DARK} />
      <path d="M40 62 L66 61.4" stroke={GOLD} strokeWidth="2" strokeLinecap="round" />
      {[38, 70].map((x) => (
        <circle key={x} cx={x} cy="74" r="1.7" fill={STEEL_DARK} />
      ))}
      {/* え */}
      <rect x={SHAFT_X - 1.9} y="17" width="3.8" height="72" rx="1.9" fill={WOOD} />
      <rect x={SHAFT_X + 0.4} y="17" width="1.5" height="72" rx="0.75" fill={WOOD_DARK} />
      {/* きんの わ と、いちばん 上の かざり */}
      <rect x={SHAFT_X - 2.6} y="52" width="5.2" height="3.4" rx="1.2" fill={GOLD_DARK} />
      <path d={`M${SHAFT_X} 8.4 L${SHAFT_X + 2.8} 13.4 L${SHAFT_X} 18 L${SHAFT_X - 2.8} 13.4 Z`} fill={GOLD} />
      {/* はたざお と ふさ */}
      <rect x="29" y="16.8" width="51" height="2.6" rx="1.3" fill={GOLD_DARK} />
      {[29.5, 79.5].map((x, i) => (
        <g key={x} transform={`rotate(${sway * (i === 0 ? 1 : -1)} ${x} 19)`}>
          <path d={`M${x} 19 v4.4`} stroke={RED} strokeWidth="1" />
          <circle cx={x} cy="25.4" r="2.2" fill={RED} />
        </g>
      ))}
    </>
  )
}

/** 土けむり。at で ふくらんで きえる。 */
function Dust({ t, at, x }: { readonly t: number; readonly at: number; readonly x: number }) {
  const p = span(t, at, at + 0.7, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={0.8 * (1 - p)} fill="#f1ecd9">
      <circle cx={x - 5 - p * 9} cy={GROUND_Y + 1 - p * 3} r={2 + p * 2.6} />
      <circle cx={x + 5 + p * 9} cy={GROUND_Y + 1 - p * 3} r={2 + p * 2.6} />
      <circle cx={x - p * 2} cy={GROUND_Y - p * 6} r={1.6 + p * 2.2} />
    </g>
  )
}

type Mood = 'wonder' | 'strain' | 'happy'

function Crown({ x, y, rotate = 0 }: { readonly x: number; readonly y: number; readonly rotate?: number }) {
  return (
    <Layer x={x} y={y} rotate={rotate}>
      <path d="M-6.4 0 L-7.2 -8 L-3.4 -4.2 L0 -9.4 L3.4 -4.2 L7.2 -8 L6.4 0 Z" fill={GOLD} />
      <rect x="-6.4" y="-2.2" width="12.8" height="2.2" fill={GOLD_DARK} />
      <circle cx="0" cy="-5.4" r="1" fill={RED} />
    </Layer>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="48.6" cy="39.6" r="1.9" fill="#ff9d9d" opacity="0.55" />
      {mood === 'wonder' && (
        <>
          <circle cx="47.2" cy="35.2" r="1.25" fill="#2b2b2b" />
          <circle cx="51.2" cy="35.4" r="1.25" fill="#2b2b2b" />
          <path d="M45.6 32.4 q1.6 -1 3.2 0 M49.6 32.6 q1.6 -1 3 0" fill="none" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <ellipse cx="50.4" cy="40.6" rx="1.1" ry="1.5" fill="#b9483f" />
        </>
      )}
      {mood === 'strain' && (
        <>
          <path d="M45.6 33.8 l2.8 1.4 l-2.8 1.4 M52.6 33.8 l-2.8 1.4 l2.8 1.4" fill="none" stroke="#2b2b2b" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M45.2 32.6 l3.4 0.8 M52.8 32.6 l-3.2 0.8" fill="none" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <rect x="47.8" y="39.2" width="4.6" height="2.4" rx="1" fill="#ffffff" stroke="#b9483f" strokeWidth="0.8" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M45.8 35.8 Q47.3 33.6 48.8 35.8 M49.8 35.9 Q51.3 33.7 52.6 35.9" fill="none" stroke="#2b2b2b" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M47.4 39 Q50 43.6 52.4 39 Z" fill="#b9483f" />
        </>
      )}
    </>
  )
}

type HeroProps = {
  readonly step: number
  readonly mood: Mood
  readonly nearHand: Pt
  readonly farHand: Pt
  readonly headTilt: number
  readonly crowned: boolean
}

function Hero({ step, mood, nearHand, farHand, headTilt, crowned }: HeroProps) {
  const near = limb(SHOULDER, nearHand, ARM_PART)
  const far = limb(SHOULDER, farHand, ARM_PART)
  return (
    <>
      {/* むこうの うで: どう の うしろ。手は え の むこうがわ を にぎる */}
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${far.elbow[0]} ${far.elbow[1]} L${far.hand[0]} ${far.hand[1]}`} fill="none" stroke={TUNIC_FAR} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      {/* あし(あるくとき かわりばんこ。立つと そろう) */}
      <Layer rotate={-step * 20} origin={HIP}>
        <rect x="41.4" y="67" width="5.2" height="24" rx="2.6" fill={PANTS_DARK} />
        <ellipse cx="45.4" cy="92" rx="4.6" ry="2.4" fill={SHOE} />
      </Layer>
      <Layer rotate={step * 20} origin={HIP}>
        <rect x="41.4" y="67" width="5.2" height="24" rx="2.6" fill={PANTS} />
        <ellipse cx="45.4" cy="92" rx="4.6" ry="2.4" fill={SHOE} />
      </Layer>
      <rect x="42.2" y="38" width="4.6" height="8" rx="2" fill={SKIN_SHADE} />
      <rect x="37" y="43" width="14" height="28" rx="6.4" fill={TUNIC} />
      <path d="M37.6 62 h12.8" stroke={TUNIC_DARK} strokeWidth="2" strokeLinecap="round" />
      <rect x="42.6" y="60.6" width="3.6" height="3" rx="0.8" fill={GOLD} />
      {/* てまえの うで */}
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${near.elbow[0]} ${near.elbow[1]} L${near.hand[0]} ${near.hand[1]}`} fill="none" stroke={TUNIC_DARK} strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={near.hand[0]} cy={near.hand[1]} r="3.1" fill={SKIN} />
      <circle cx={far.hand[0]} cy={far.hand[1]} r="3.1" fill={SKIN} />
      {/* あたま(右むき) */}
      <Layer rotate={headTilt} origin={NECK}>
        <circle cx="44.5" cy="35.5" r="8.2" fill={SKIN} />
        <path d="M36.3 36.4 C34.4 26.4 44 24.2 51 29.4 C47 29 43 30.4 40.4 34.4 C39.6 36.2 38 37.8 36.3 36.4 Z" fill={HAIR} />
        <circle cx="41.4" cy="37.6" r="1.6" fill={SKIN_SHADE} />
        <Face mood={mood} />
        {crowned && <Crown x={CROWN_SEAT[0]} y={CROWN_SEAT[1]} />}
      </Layer>
    </>
  )
}

/** ふんばる ときの あせ。あたまの うしろへ とぶ。 */
function Sweat({ t }: SceneProps) {
  const show = during(t, STRAIN + 0.1, LIFT + 0.1, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.4].map((offset) => {
        const p = ((t + offset) % 0.8) / 0.8
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" transform={`translate(${35 - p * 6} ${28 + p * 8}) rotate(25)`} opacity={1 - p} />
      })}
    </g>
  )
}

type VillagerProps = {
  readonly x: number
  readonly y: number
  readonly tunic: string
  readonly hair: string
  /** 0 = 見まもる / 1 = ばんざい */
  readonly cheer: number
  readonly t: number
}

/** とおくの おかの 村の人(まえむき)。 */
function Villager({ x, y, tunic, hair, cheer, t }: VillagerProps) {
  const hop = cheer > 0 ? Math.abs(wave(t, 0.5)) * 2.2 * cheer : 0
  const armUp = cheer
  const hand = (side: number): Pt => [side * (3.8 + armUp * 3.4), -16 - armUp * 11]
  const left = hand(-1)
  const right = hand(1)
  return (
    <Layer x={x} y={y - hop} scale={1.1}>
      <rect x="-2.8" y="-8" width="2.4" height="8" rx="1.2" fill={PANTS} />
      <rect x="0.4" y="-8" width="2.4" height="8" rx="1.2" fill={PANTS} />
      <path d={`M-3.6 -16 L${left[0]} ${armUp > 0.5 ? left[1] + 5 : -10} L${left[0]} ${left[1] + (armUp > 0.5 ? 0 : 0)}`} fill="none" stroke={tunic} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M3.6 -16 L${right[0]} ${armUp > 0.5 ? right[1] + 5 : -10} L${right[0]} ${right[1]}`} fill="none" stroke={tunic} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="-4.2" y="-18.4" width="8.4" height="11.4" rx="3.4" fill={tunic} />
      <circle cx={left[0]} cy={left[1]} r="1.4" fill={SKIN} />
      <circle cx={right[0]} cy={right[1]} r="1.4" fill={SKIN} />
      <circle cx="0" cy="-22.8" r="4.4" fill={SKIN} />
      <path d="M-4.6 -23 C-4.6 -28.4 4.6 -28.4 4.6 -23 C2.6 -25.4 -2.6 -25.4 -4.6 -23 Z" fill={hair} />
      <circle cx="-1.6" cy="-22.6" r="0.55" fill="#2b2b2b" />
      <circle cx="1.6" cy="-22.6" r="0.55" fill="#2b2b2b" />
      {cheer > 0.5 ? <ellipse cx="0" cy="-20.4" rx="1.1" ry="0.9" fill="#b9483f" /> : <path d="M-0.9 -20.5 h1.8" stroke="#b9483f" strokeWidth="0.6" strokeLinecap="round" />}
    </Layer>
  )
}

/** はと。王かんを あしで つかんで はこぶ(むきは 左むき。かえりは 右へ ひっくりかえす)。 */
const DOVE_Y = 7
/** はとの あし から 王かんの そこ まで(王かんは はとの まっすぐ下に ぶらさがる) */
const CROWN_HANG = 19
function Dove({ t }: SceneProps) {
  const arrive = span(t, DOVE, DROP, easeOut)
  const leave = span(t, DROP + 0.15, DROP + 0.95, easeIn)
  if (arrive <= 0 || leave >= 1) return null
  const x = leave > 0 ? CROWN_SEAT[0] + leave * 75 : CROWN_SEAT[0] + (1 - arrive) * 75
  const y = leave > 0 ? DOVE_Y - leave * 14 : DOVE_Y + (1 - arrive) * 6 + wave(t, 0.5) * 0.4
  const dir = leave > 0 ? -1 : 1
  const flap = wave(t, 0.18) * 30
  const carrying = t < DROP
  return (
    <>
      <Layer x={x} y={y} scaleX={dir * 1.25} scaleY={1.25}>
        <path d="M4.4 0.2 l5.4 -1.6 l-0.2 3.2 Z" fill="#dfe6ef" />
        <ellipse cx="0" cy="0" rx="5.2" ry="3.4" fill="#f6f9fc" />
        <circle cx="-4.8" cy="-2.4" r="2.5" fill="#f6f9fc" />
        <path d="M-7 -2.7 l-2.4 0.6 l2.3 1.1 Z" fill="#f2a04a" />
        <circle cx="-5.5" cy="-3" r="0.55" fill="#2b2b2b" />
        <Layer rotate={flap} origin={[0.6, -1.6]}>
          <path d="M-2.4 -1.4 Q1 -7.4 7 -3 Q2.6 -0.2 -2.4 -1.4 Z" fill="#dfe6ef" />
        </Layer>
        {carrying && <path d="M-2 2.8 L-2.6 6.2 M2 2.8 L2.6 6.2" stroke="#f2a04a" strokeWidth="0.9" strokeLinecap="round" />}
      </Layer>
      {carrying && <Crown x={x} y={y + CROWN_HANG} />}
    </>
  )
}

/** はとが はなした 王かんが、あたまに おちる。 */
function FallingCrown({ t }: SceneProps) {
  const p = span(t, DROP, CROWNED, easeIn)
  if (p <= 0 || t >= CROWNED) return null
  const startY = DOVE_Y + CROWN_HANG
  return <Crown x={CROWN_SEAT[0]} y={startY + (CROWN_SEAT[1] - startY) * p} rotate={Math.sin(p * Math.PI * 2) * 8} />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  // おの: ずしんと ささる → もちあがる → どしんと おろす
  const fall = span(t, 0, LAND, easeIn)
  const lift = mix(t, LIFT, LIFT + 0.5, 0, LIFT_HEIGHT, easeOut) - mix(t, SET_DOWN, SET_DOWN + 0.35, 0, LIFT_HEIGHT, easeIn)
  const axeY = -(1 - fall) * 90 - lift
  // 地めんに ささった しゅんかん、はずむ
  const thud = Math.sin(span(t, LAND, LAND + 0.3) * Math.PI) * 1.4

  // わかもの: ひだりから あるいてくる
  const walking = 1 - span(t, ARRIVE - 0.25, ARRIVE)
  const stride = t < WALK ? 0 : Math.sin((t - WALK) * Math.PI * 2 * 1.8) * walking
  const heroX = mix(t, WALK, ARRIVE, -52, 0, easeOut)
  const bob = t < WALK ? 0 : -Math.abs(stride) * 1.4
  const heroAppear = span(t, WALK - 0.1, WALK + 0.1)
  // ふんばる: 2回 ぐいっ と ひっぱる(1回目は だめ、2回目で ぬける)
  const tryAmt = Math.max(during(t, STRAIN + 0.05, STRAIN + 0.5, 0.1), during(t, STRAIN + 0.6, LIFT + 0.05, 0.1))
  const jitter = wave(t, 0.1) * 0.5 * tryAmt
  const dip = tryAmt * 1.2

  // 手の場所: あるくとき ふる → ぶらり → え を にぎる(おのと いっしょに あがる)
  const grip = span(t, GRIP, GRIP + 0.4, easeOut)
  const hangNear: Pt = [SHOULDER[0] + stride * 6, 66]
  const hangFar: Pt = [SHOULDER[0] - stride * 6, 66]
  const gripNear: Pt = [SHAFT_X - 1.6, 58 - lift]
  const gripFar: Pt = [SHAFT_X - 1.2, 51.5 - lift]
  const nearHand: Pt = [mix(t, GRIP, GRIP + 0.4, hangNear[0], gripNear[0], easeOut), hangNear[1] + (gripNear[1] - hangNear[1]) * grip]
  const farHand: Pt = [mix(t, GRIP, GRIP + 0.4, hangFar[0], gripFar[0], easeOut), hangFar[1] + (gripFar[1] - hangFar[1]) * grip]

  const mood: Mood = t < STRAIN ? 'wonder' : t < LIFT + 0.1 ? 'strain' : 'happy'
  // あたま: おのを 見あげる → ふんばって うつむく → はとを 見あげる → まっすぐ
  const lookDove = during(t, DOVE - 0.2, CROWNED - 0.1, 0.3)
  const headTilt = t < STRAIN ? -7 * span(t, ARRIVE, ARRIVE + 0.3) : t < LIFT ? 6 * tryAmt : -8 * lookDove
  const crowned = t >= CROWNED

  // むらの人: とおくで 見まもり、おのが あがると ばんざい
  const cheer = span(t, LIFT + 0.1, LIFT + 0.3) * (1 - span(t, SET_DOWN + 0.4, SET_DOWN + 0.7))
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Villager x={95} y={64} tunic="#6bb36b" hair="#3d2b1f" cheer={cheer} t={t} />
        <Villager x={103.5} y={62.4} tunic="#8f7ad6" hair="#b5651d" cheer={cheer} t={t + 0.2} />
        <Layer y={axeY - thud}>
          <Axe t={t} />
        </Layer>
        <FrontGrass />
        <Dust t={t} at={LAND} x={SHAFT_X} />
        <Dust t={t} at={LIFT} x={SHAFT_X} />
        <Dust t={t} at={SET_DOWN + 0.3} x={SHAFT_X} />
        <ellipse cx="46" cy="94.6" rx="10" ry="2.2" fill="#000000" opacity={0.12 * heroAppear} />
        <Layer opacity={heroAppear}>
          <Layer x={heroX + jitter} y={bob + dip}>
            <Hero step={stride} mood={mood} nearHand={nearHand} farHand={farHand} headTilt={headTilt} crowned={crowned} />
          </Layer>
        </Layer>
        <Sweat t={t} />
        <FallingCrown t={t} />
        <Dove t={t} />
        {t >= CROWNED && t < CROWNED + 0.7 && <Star cx={CROWN_SEAT[0] + 7} cy={CROWN_SEAT[1] - 8} r={3 * (1 - span(t, CROWNED, CROWNED + 0.7))} color="#ffffff" spin={t * 200} />}
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
    { at: 0, label: '大きな おのが ずしんと ささる', sound: 'pop' },
    { at: WALK, label: 'わかものが あるいてきて、おのを 見あげる' },
    { at: GRIP, label: 'えを つかんで ぐいっ…ぐいっ…' },
    { at: LIFT, label: 'ぬけた! おのが もちあがる', sound: 'pop' },
    { at: DOVE, label: 'はとが 王かんを はこんでくる' },
    { at: CROWNED, label: '王かんを かぶって、おのを どしんと たてる', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '王 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
