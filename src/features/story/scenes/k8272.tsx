/*
 * 色(いろ): 雨の あとに にじ。いろが いっぱい。
 *
 * ほね(画と絵の対応)
 *   1・2画目   … 上の ほうの 雨雲(雨が やむと、右へ きえていく)
 *   3〜6画目   … 子どもを かこむ にじ(6しょくの おび が、左の はし から 右の はし まで 山なりに かかる)
 *                  (にじ の ねもと が、6画目の 左はしと 右はし の あたり)
 *
 * ながれ
 *   雨雲が きて 雨が ふりだす → 子どもが かさを さして、しょんぼり(「はあ」)
 *   → 雨が やんで、雲が さり、お日さまが 出る → 子どもは かさを たたんで 空を みあげる(おや?)
 *   → 赤・だいだい・黄・みどり・青・むらさき の にじが かかる → 子どもは おおよろこびで ばんざい
 *   → ほね が ひかって、絵が うすくなり、字「色」が のこる
 *
 * 人・かさ・にじ は、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる。かさ は 柄(え)を 手で もち、ほね(軸)の てっぺんに 布が ある。
 *   にじ は 地面から 山なりに のびて、いちばん外が 赤、いちばん 内が むらさき。
 *   雨は まっすぐ 下に おち、かさ の 布に あたって、子どもには かからない。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '色'

const SUN = '#ffd24a'
const HILL = '#e2f2d2'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const COAT = '#4f9be0'
const COAT_DARK = '#3c82c4'
const PANTS = '#3e5c86'
const BOOT = '#e2733f'
const EYE = '#2b2b2b'
const MOUTH = '#c4504a'
const CHEEK = '#ff9d9d'
const CLOUD = '#8b98ad'
const CLOUD_SHADE = '#74829a'
const CLOUD_LIGHT = '#a9b4c6'
const RAIN = '#5aaee8'
const POOL = '#a9d9f7'
const POOL_LIGHT = '#d8effc'
const UMB = '#ffc233'
const UMB_DARK = '#ef8a3c'
const POLE = '#6b4a36'

/** くぎり の時間(秒) */
const RAIN_ON = 0.9
const STOP = 3.0
const LOOK = 3.5
const GONE = 4.6
const RAINBOW = 4.6
const CHEER = 5.4
const INK = 6.8
const DONE = 9.8
const DURATION = 10.4

/** 子どもの まんなか(x)・足もと(y)・かた(うでの つけね) */
const CX = 58
const FEET_Y = 94
const SHOULDER_L: readonly [number, number] = [51.5, 74.5]
const SHOULDER_R: readonly [number, number] = [64.5, 74.5]
/** うでの 長さ(かた→ひじ、ひじ→手) */
const ARM_PART = 6.2

/** にじ の ねもと(地面)・まんなか。6本の おび を 外から 内へ かさねる */
const BOW_Y = 95
const BOW_COLORS = ['#f0544f', '#ff9a3c', '#ffd24a', '#6cc86b', '#4aa8e8', '#8f6fd6'] as const
const BOW_OUTER_RX = 30.5
const BOW_OUTER_RY = 54
const BOW_STEP = 2.9
const BOW_WIDTH = 3.2

/** くもの そこ の たかさ。雨は ここから ふる */
const CLOUD_BASE = 26

const rad = (deg: number) => (deg * Math.PI) / 180

/* ───────── 空と地面 ───────── */

function Ground({ t }: SceneProps) {
  const rainy = span(t, 0.2, 1.2) * (1 - span(t, STOP + 0.3, GONE))
  const rainDrops = span(t, RAIN_ON, STOP)
  return (
    <>
      {/* 雨の日の くらい空(雨が やむと はれる) */}
      <rect x="0" y="0" width="109" height="109" fill="#6f7f99" opacity={0.26 * rainy} />
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill={HILL} />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 46, 82, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
      {/* みずたまり: 雨が ふると できる。ふっている間は わ が ひろがる */}
      <Puddle t={t} cx={20} cy={97.6} rx={8} amount={span(t, RAIN_ON + 0.3, RAIN_ON + 1.2)} ripple={rainDrops} />
      <Puddle t={t} cx={95} cy={97.8} rx={7} amount={span(t, RAIN_ON + 0.5, RAIN_ON + 1.4)} ripple={rainDrops} />
    </>
  )
}

function Puddle({ t, cx, cy, rx, amount, ripple }: SceneProps & { readonly cx: number; readonly cy: number; readonly rx: number; readonly amount: number; readonly ripple: number }) {
  if (amount <= 0) return null
  const stillRaining = t < STOP + 0.3
  const p = ((t * 1.3 + cx * 0.07) % 1 + 1) % 1
  return (
    <>
      <ellipse cx={cx} cy={cy} rx={rx * amount} ry={1.6 * amount} fill={POOL} />
      <ellipse cx={cx - rx * 0.25} cy={cy - 0.4} rx={rx * 0.4 * amount} ry={0.5 * amount} fill={POOL_LIGHT} />
      {stillRaining && ripple > 0 && (
        <ellipse cx={cx} cy={cy} rx={1 + p * 4.5} ry={0.3 + p * 0.9} fill="none" stroke={POOL_LIGHT} strokeWidth="0.5" opacity={1 - p} />
      )}
    </>
  )
}

/* ───────── 雨雲と雨 ───────── */

/** 雨雲。右から ながれてきて、雨が やむと 右へ きえていく */
function RainCloud({ t }: SceneProps) {
  const arrive = 1 - span(t, 0.1, 1.0, easeOut)
  const leave = span(t, STOP + 0.2, GONE, easeIn)
  const x = arrive * 80 + leave * 85
  if (x >= 84 && t > 1) return null
  return (
    <Layer x={x}>
      <g fill={CLOUD_SHADE}>
        <rect x="33" y="17" width="51" height="11" rx="5.5" />
        <circle cx="35" cy="20.5" r="8" />
        <circle cx="46" cy="15" r="10" />
        <circle cx="60.5" cy="13" r="11" />
        <circle cx="74" cy="17" r="9" />
        <circle cx="82" cy="21" r="7" />
      </g>
      <g fill={CLOUD} transform="translate(0 -2)">
        <rect x="33" y="17" width="51" height="11" rx="5.5" />
        <circle cx="35" cy="20.5" r="8" />
        <circle cx="46" cy="15" r="10" />
        <circle cx="60.5" cy="13" r="11" />
        <circle cx="74" cy="17" r="9" />
        <circle cx="82" cy="21" r="7" />
      </g>
      <circle cx="43" cy="11.5" r="4" fill={CLOUD_LIGHT} />
      <circle cx="57" cy="8.5" r="4.4" fill={CLOUD_LIGHT} />
    </Layer>
  )
}

/** かさ(子どもの うえ)の 布が ある 高さ。雨は ここで とまる(かさ に あたる) */
function umbrellaStop(x: number): number {
  const across = (x - 64) / 21
  return Math.abs(across) >= 1 ? 95 : 44 - 17 * Math.sqrt(1 - across * across)
}

const RAIN_COLUMNS = Array.from({ length: 17 }, (_, i) => ({ x: 28 + i * 3.9, phase: (i * 0.37) % 1 }))

function Rain({ t }: SceneProps) {
  const amount = span(t, RAIN_ON, RAIN_ON + 0.4) * (1 - span(t, STOP, STOP + 0.5))
  if (amount <= 0) return null
  return (
    <g opacity={amount} stroke={RAIN} strokeWidth="0.9" strokeLinecap="round">
      {RAIN_COLUMNS.map(({ x, phase }) => {
        const end = umbrellaStop(x)
        const p = (t * 1.3 + phase) % 1
        const y = CLOUD_BASE + p * (end - CLOUD_BASE)
        const top = Math.max(CLOUD_BASE, y - 6)
        if (y <= CLOUD_BASE + 0.5) return null
        return <line key={x} x1={x} y1={top} x2={x} y2={y} />
      })}
    </g>
  )
}

/* ───────── お日さま ───────── */

function Sun({ t }: SceneProps) {
  const sun = span(t, STOP + 0.5, STOP + 1.3, backOut)
  if (sun <= 0) return null
  return (
    <>
      <Layer opacity={Math.min(sun, 1)} rotate={t * 14} origin={[14, 14]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="13.2" y="2.4" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 14 14)`} />
        ))}
      </Layer>
      <circle cx="14" cy="14" r={Math.max(0, 6.2 * sun)} fill={SUN} />
    </>
  )
}

/* ───────── にじ ───────── */

function Rainbow({ t }: SceneProps) {
  return (
    <g fill="none" strokeWidth={BOW_WIDTH} strokeLinecap="round">
      {BOW_COLORS.map((color, i) => {
        const draw = span(t, RAINBOW + i * 0.1, RAINBOW + 0.9 + i * 0.1, easeInOut)
        if (draw <= 0) return null
        const rx = BOW_OUTER_RX - i * BOW_STEP
        const ry = BOW_OUTER_RY - i * BOW_STEP
        return <path key={color} d={`M${CX - rx} ${BOW_Y} A${rx} ${ry} 0 0 1 ${CX + rx} ${BOW_Y}`} stroke={color} pathLength={1} strokeDasharray="1 2" strokeDashoffset={1 - draw} />
      })}
    </g>
  )
}

/** にじ が かかった あとの きらきら */
function Twinkles({ t }: SceneProps) {
  const show = during(t, RAINBOW + 1.0, INK - 0.1, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[
        [23, 56, 0],
        [95, 54, 1],
        [58, 33, 2],
        [30, 80, 3],
      ].map(([cx, cy, k]) => (
        <Star key={k} cx={cx} cy={cy} r={2 + 0.9 * Math.abs(wave(t, 0.9, k * 0.3))} color={k % 2 === 0 ? '#ffd95a' : '#ffffff'} spin={t * 40 + k * 30} />
      ))}
    </g>
  )
}

/* ───────── 子ども ───────── */

type Mood = 'sad' | 'wonder' | 'happy'
/** うで の かっこう。a = かた から ひじ、b = ひじ から 手 の むき(ま下が 0 度、外へ ひらいて 上が 180 度) */
type ArmPose = { readonly a: number; readonly b: number }

function dir(deg: number, side: number): readonly [number, number] {
  return [side * Math.sin(rad(deg)), Math.cos(rad(deg))]
}

/** かた → ひじ → 手 の 3点 */
function armPoints(shoulder: readonly [number, number], side: number, pose: ArmPose) {
  const [ax, ay] = dir(pose.a, side)
  const elbow = [shoulder[0] + ax * ARM_PART, shoulder[1] + ay * ARM_PART] as const
  const [bx, by] = dir(pose.b, side)
  const hand = [elbow[0] + bx * ARM_PART, elbow[1] + by * ARM_PART] as const
  return { elbow, hand }
}

function Arm({ shoulder, side, pose }: { readonly shoulder: readonly [number, number]; readonly side: number; readonly pose: ArmPose }) {
  const { elbow, hand } = armPoints(shoulder, side, pose)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={COAT_DARK} strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.7" fill={SKIN} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="52.9" cy="68.4" r="1.9" fill={CHEEK} opacity="0.55" />
      <circle cx="63.1" cy="68.4" r="1.9" fill={CHEEK} opacity="0.55" />
      {mood === 'sad' && (
        <>
          <path d="M52.6 63.6 L55.8 62.2 M60.2 62.2 L63.4 63.6" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <circle cx="54.6" cy="66.2" r="1.15" fill={EYE} />
          <circle cx="61.4" cy="66.2" r="1.15" fill={EYE} />
          <path d="M55.4 71.2 Q58 69.2 60.6 71.2" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'wonder' && (
        <>
          <path d="M52.8 63.2 Q54.6 61.8 56.4 62.8 M59.6 62.8 Q61.4 61.8 63.2 63.2" fill="none" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <circle cx="54.6" cy="65.6" r="1.5" fill={EYE} />
          <circle cx="61.4" cy="65.6" r="1.5" fill={EYE} />
          <circle cx="55" cy="65" r="0.5" fill="#ffffff" />
          <circle cx="61.8" cy="65" r="0.5" fill="#ffffff" />
          <ellipse cx="58" cy="70.3" rx="1.2" ry="1.6" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M53 66.4 Q54.7 64 56.4 66.4 M59.6 66.4 Q61.3 64 63 66.4" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M54.2 69 Q58 74.4 61.8 69 Z" fill={MOUTH} />
          <path d="M56.4 71.6 Q58 70.6 59.6 71.6 Q58 73 56.4 71.6 Z" fill="#ff8a8a" />
        </>
      )}
    </>
  )
}

type ChildProps = { readonly mood: Mood; readonly near: ArmPose; readonly far: ArmPose; readonly headTilt: number }

/** 子ども(正面)。くび は みじかく、どう の まんなか の上。うで は かた から。 */
function Child({ mood, near, far, headTilt }: ChildProps) {
  return (
    <>
      <Arm shoulder={SHOULDER_L} side={-1} pose={far} />
      {/* あし と 長ぐつ */}
      <rect x="52.6" y="82" width="4.6" height="11" rx="2.3" fill={PANTS} />
      <rect x="58.8" y="82" width="4.6" height="11" rx="2.3" fill={PANTS} />
      <ellipse cx="54.4" cy="93.4" rx="3.8" ry="2.2" fill={BOOT} />
      <ellipse cx="61.6" cy="93.4" rx="3.8" ry="2.2" fill={BOOT} />
      {/* くび と どう(あめ ぐつ に 合わせた 青い かっぱ) */}
      <rect x="55.6" y="69.4" width="4.8" height="4" rx="2" fill={SKIN_SHADE} />
      <rect x="50" y="71.6" width="16" height="13.4" rx="5" fill={COAT} />
      <path d="M52 80.6 h12" stroke={COAT_DARK} strokeWidth="1.4" strokeLinecap="round" />
      <Arm shoulder={SHOULDER_R} side={1} pose={near} />
      {/* あたま */}
      <Layer rotate={headTilt} origin={[CX, 71]}>
        <circle cx={CX} cy="64.5" r="7.4" fill={SKIN} />
        <path d="M50.5 63.2 C49.6 55.4 66.4 55.4 65.5 63.2 C63.4 60 61 59.6 58 60.4 C55 59.6 52.6 60 50.5 63.2 Z" fill={HAIR} />
        <path d="M57 57 Q58.2 54.2 59.6 56.4" fill="none" stroke={HAIR} strokeWidth="1.6" strokeLinecap="round" />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

/** かさ。手(原点)から 柄 が のび、てっぺんに 布。たたむと 布が ほそくなる。 */
function Umbrella({ open }: { readonly open: number }) {
  const k = 0.22 + 0.78 * open
  return (
    <>
      <path d="M0 -29 V9 q0 3.4 -2.8 3.4" fill="none" stroke={POLE} strokeWidth="1.3" strokeLinecap="round" />
      <Layer scaleX={k} scaleY={0.8 + 0.2 * open} origin={[0, -30]}>
        <path d="M-21 -30 C-21 -42 -11 -47 0 -47 C11 -47 21 -42 21 -30 Q14 -33.5 7 -30 Q0 -33.5 -7 -30 Q-14 -33.5 -21 -30 Z" fill={UMB} />
        <path d="M-7 -30 C-7 -40 -4 -46.5 0 -47 C4 -46.5 7 -40 7 -30 Q3.5 -33.5 0 -30 Q-3.5 -33.5 -7 -30 Z" fill={UMB_DARK} />
      </Layer>
      <circle cx="0" cy="0" r="2.7" fill={SKIN} />
    </>
  )
}

/** しょんぼり の「はあ」。くち から 左へ。 */
function Sigh({ t }: SceneProps) {
  const show = during(t, 1.7, 2.9, 0.25)
  if (show <= 0) return null
  const p = span(t, 1.7, 2.9, easeOut)
  return (
    <g opacity={show * 0.9}>
      <ellipse cx={50 - p * 8} cy={71 - p * 3} rx={2 + p * 2.2} ry={1.4 + p * 1.2} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <ellipse cx={53 - p * 5} cy={71.6 - p * 1.4} rx={1.1 + p * 0.8} ry={0.9 + p * 0.5} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
    </g>
  )
}

/* ───────── 場面 ───────── */

const HOLD_NEAR: ArmPose = { a: 40, b: 150 }
const CHEER_ARM: ArmPose = { a: 150, b: 168 }
const REST_FAR: ArmPose = { a: 8, b: 12 }

const blend = (from: ArmPose, to: ArmPose, s: number, wag: number): ArmPose => ({
  a: from.a + (to.a - from.a) * s + wag,
  b: from.b + (to.b - from.b) * s + wag,
})

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  // 子どもが ぽん と 出て、かさを ひらく
  const pop = span(t, 0.25, 0.8, backOut)
  const umbrellaOpen = span(t, RAIN_ON - 0.2, RAIN_ON + 0.3, backOut) * (1 - span(t, LOOK + 0.1, LOOK + 0.8))
  const mood: Mood = t < LOOK ? 'sad' : t < CHEER ? 'wonder' : 'happy'

  // ばんざい: うで を 上げて、はねる。字になる 前に ぴたっと 立つ
  const cheer = span(t, CHEER, CHEER + 0.4, backOut)
  const wag = wave(t, 0.5) * 9 * during(t, CHEER + 0.5, INK - 0.25, 0.2)
  const near = blend(HOLD_NEAR, CHEER_ARM, cheer, wag)
  const far = blend(REST_FAR, CHEER_ARM, cheer, -wag)
  const jump = 4 * Math.abs(wave(t, 0.7)) * during(t, CHEER + 0.3, INK - 0.25, 0.15)
  // しょんぼり は 少し うつむき、おや? で 空を みあげる
  const headTilt = mix(t, LOOK - 0.3, LOOK + 0.3, 3, -3) + (t >= CHEER ? 2 : 0)
  const umbrellaTilt = -15 + 37 * Math.min(cheer, 1.1)
  const hand = armPoints(SHOULDER_R, 1, near).hand

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Sun t={t} />
        <Rain t={t} />
        <RainCloud t={t} />
        <Rainbow t={t} />
        <Layer opacity={Math.min(pop, 1)}>
          <ellipse cx={CX} cy="97.4" rx={10 - jump} ry="2.4" fill="#000000" opacity="0.13" />
          <Layer scale={Math.max(pop, 0)} origin={[CX, FEET_Y]}>
            <Layer y={-jump}>
              <Child mood={mood} near={near} far={far} headTilt={headTilt} />
              <Layer x={hand[0]} y={hand[1]} rotate={umbrellaTilt}>
                <Umbrella open={umbrellaOpen} />
              </Layer>
              <Sigh t={t} />
            </Layer>
          </Layer>
        </Layer>
        <Twinkles t={t} />
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
    { at: 0, label: '雨雲が きて、雨が ふりだす', sound: 'pop' },
    { at: RAIN_ON + 0.4, label: '子どもは かさを さして しょんぼり' },
    { at: STOP, label: '雨が やんで、雲が さり、お日さまが 出る' },
    { at: LOOK, label: 'かさを たたんで、おや?と 空を みあげる' },
    { at: RAINBOW, label: '6しょくの にじが かかる', sound: 'pop' },
    { at: CHEER, label: 'おおよろこびで ばんざい' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '色 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
