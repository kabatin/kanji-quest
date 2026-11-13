/*
 * 星(ほし): よぞらで きらきら ひかる、ほし。
 *
 * ほね(画と絵の対応)
 *   1〜4画目(日) … 空の まんなかに ひかる 大きな ほし(まるい 光の かたまり)
 *   5〜9画目(生) … 地面から のびる 若い芽のような もの。絵では ほしを みあげる 子どもと 地面
 *                    (字の形に 合わせて 子どもを ゆがめない。大きな ほしの 場所が「日」に だいたい重なる)
 *
 * ながれ
 *   日が しずんで 空が 夕やけ → よぞらに なり、子どもが 心ぼそくなる(くらい)
 *   → ちいさな ほしが 1つ ぴかっ。子どもが 気づいて みあげる
 *   → ほしが つぎつぎ ふえて、いちばん 大きな ほしが ぽんと かがやく
 *   → 子どもが ゆびさして にっこり、よろこぶ
 *   → ほね が ひかって、絵が うすくなり、字「星」が のこる
 *
 * 子どもは、ほんものの人の つくり を守る(正面むき):
 *   うで は かた から出て ひじ で まがる。ゆびさす ときは、かた から ほしへ まっすぐ のばす。
 *   くび は みじかく、どう の まんなか の上。ほし は ほんものと おなじ 5つの とがり。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '星'

const SKIN = '#f8cfa6'
const HAIR = '#5a3b2a'
const SHIRT = '#f0846a'
const SHIRT_DARK = '#d96a52'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const SUN = '#ffd24a'
const STAR_YELLOW = '#ffd24a'
const STAR_LIGHT = '#fff3a8'
const STAR_SMALL = '#fff6c8'

/** くぎり の時間(秒) */
const SUNSET_FROM = 0.3
const SUNSET_TO = 2.6
/** あたりが くらくなって、子どもが 心ぼそくなる */
const DARK = 2.4
/** 1つめの ちいさな ほし が ぴかっ */
const FIRST = 3.2
/** 子どもが 気づいて みあげる */
const NOTICE = 3.9
/** いちばん 大きな ほし が かがやく */
const BIG = 4.6
const BIG_DONE = 5.4
const POINT = 4.9
const HAPPY = 5.4
const INK = 7.0
const DONE = 9.9
const DURATION = 10.4

/** 子どもの 足もとの 地面の 高さ と、まんなかの x */
const GROUND_Y = 93
const KID_X = 76
/** 大きな ほし の まんなか(日の 四角の まんなか あたり) */
const BIG_STAR: readonly [number, number] = [53.5, 29.5]
/** かた の場所(左・右)。どう の かどの すこし 内がわ */
const SHOULDER_L: readonly [number, number] = [71, 60]
const SHOULDER_R: readonly [number, number] = [81, 60]
/** うで の ぶぶん(かた〜ひじ・ひじ〜手)の 長さ */
const ARM_PART = 7.2
/** かた から 大きな ほし への むき(ま下から 何度か。左うでは そとがわ へ) */
const POINT_ANGLE = 180 - (Math.atan2(SHOULDER_L[0] - BIG_STAR[0], SHOULDER_L[1] - BIG_STAR[1]) * 180) / Math.PI

/* ───────── 色の まぜあわせ ───────── */

const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)

/** 2つの色(#rrggbb)を k(0〜1)で まぜる */
function lerpHex(a: string, b: string, k: number): string {
  const part = (i: number) =>
    Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * k)
      .toString(16)
      .padStart(2, '0')
  return `#${part(0)}${part(1)}${part(2)}`
}

/* ───────── 空と地面 ───────── */

/** 空の 色の 帯の数 */
const SKY_BANDS = 30

function Sky({ t }: SceneProps) {
  // ひる → 夕やけ → よぞら の じゅんに 色が かわる
  const dusk = span(t, SUNSET_FROM, 2.0)
  const night = span(t, 1.8, 3.2)
  const top = lerpHex(lerpHex('#8fd3f4', '#8a6fb8', dusk), '#18244f', night)
  const bottom = lerpHex(lerpHex('#d8f1fb', '#ffb27a', dusk), '#34478a', night)
  // グラデーションの id は、コマ送りで 絵が ならぶと ぶつかるので、よこ帯を かさねて 色の変化を作る
  return (
    <>
      {Array.from({ length: SKY_BANDS }, (_, i) => (
        <rect key={i} x="-1" y={(i * 109) / SKY_BANDS} width="111" height={109 / SKY_BANDS + 0.6} fill={lerpHex(top, bottom, i / (SKY_BANDS - 1))} />
      ))}
    </>
  )
}

/** 日が 左の 地面の むこうへ しずんでいく(地面に かくれる) */
function SettingSun({ t }: SceneProps) {
  const sink = span(t, SUNSET_FROM, SUNSET_TO, easeInOut)
  const y = 66 + sink * 36
  return (
    <>
      <circle cx="26" cy={y} r="13" fill={SUN} opacity={0.22} />
      <circle cx="26" cy={y} r="8.2" fill={SUN} />
      <circle cx="26" cy={y} r="5" fill="#fff0a0" opacity="0.7" />
    </>
  )
}

function Ground({ t }: SceneProps) {
  const night = span(t, 1.8, 3.2)
  const body = lerpHex('#8ed48a', '#2f5b57', night)
  const rim = lerpHex('#b7e8a3', '#3f7a6e', night)
  return (
    <>
      <path d="M-4 95 Q26 88 56 91.5 Q86 95 113 90.5 V113 H-4 Z" fill={body} />
      {/* 地面の ふち を 1だん あかるく */}
      <path d="M-4 95 Q26 88 56 91.5 Q86 95 113 90.5 L113 93 Q86 97.5 56 94 Q26 91 -4 97.5 Z" fill={rim} />
      {[10, 36, 100].map((x, i) => (
        <path key={x} d={`M${x} ${91 + i * 0.4} l1.2 -3.4 l1 3 l1.5 -3.8 l0.8 4 Z`} fill={rim} />
      ))}
    </>
  )
}

/** ちいさな ほし。ぽんと出て、ちかちか またたく */
const SMALL_STARS: readonly (readonly [x: number, y: number, r: number, at: number])[] = [
  [16, 14, 2.8, FIRST],
  [93, 12, 3, 3.55],
  [101, 34, 2.4, 3.95],
  [10, 40, 2.6, 4.15],
  [38, 6, 2.2, 4.3],
  [70, 8, 2.4, 4.5],
  [95, 58, 2.2, 4.75],
  [13, 62, 2.6, 4.85],
]

function SmallStars({ t }: SceneProps) {
  return (
    <>
      {SMALL_STARS.map(([x, y, r, at], i) => {
        const pop = span(t, at, at + 0.4, backOut)
        if (pop <= 0) return null
        const twinkle = 1 + wave(t, 1.3, i * 0.37) * 0.22
        return <Star key={x} cx={x} cy={y} r={Math.max(0, r * pop * twinkle)} color={STAR_SMALL} />
      })}
    </>
  )
}

/** いちばん 大きな ほし。ほんものの ほしと おなじ 5つの とがり。かどは まるく。 */
function BigStar({ t }: SceneProps) {
  const rise = span(t, BIG, BIG_DONE, backOut)
  if (rise <= 0) return null
  const shine = span(t, BIG, BIG_DONE)
  const pulse = 1 + wave(t, 1.1) * 0.05
  const outer = 11
  const inner = 5.2
  const points = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner
    const a = (i * Math.PI) / 5 - Math.PI / 2
    return `${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`
  }).join(' ')
  return (
    <Layer x={BIG_STAR[0]} y={BIG_STAR[1]} scale={Math.max(0, rise * pulse)}>
      {/* まわりの ぼんやりした 光 */}
      <circle r="19" fill={STAR_YELLOW} opacity={0.14 * shine} />
      <circle r="14.5" fill={STAR_YELLOW} opacity={0.2 * shine} />
      <polygon points={points} fill={STAR_YELLOW} stroke={STAR_YELLOW} strokeWidth="2.4" strokeLinejoin="round" />
      <polygon points={points} fill={STAR_LIGHT} transform="scale(0.5)" />
      {/* 目に見える ちいさな きらきら */}
      <g opacity={shine}>
        <Star cx={-15} cy={-8} r={2.8 + wave(t, 0.8) * 0.8} color={STAR_SMALL} spin={t * 30} />
        <Star cx={16} cy={6} r={2.4 + wave(t, 0.8, 0.3) * 0.8} color={STAR_SMALL} spin={-t * 30} />
      </g>
    </Layer>
  )
}

/* ───────── 子ども ───────── */

type Mood = 'calm' | 'scared' | 'wonder' | 'happy'

/** うで の かっこう。angle = ま下から そとがわへ ひらいた角度 / bend = ひじで 先を そとへ まげる角度 */
type ArmPose = { readonly angle: number; readonly bend: number }

const rad = (deg: number) => (deg * Math.PI) / 180

/** かた から出て、ひじ で まがる うで。side は 左うで = -1 / 右うで = 1 */
function Arm({ shoulder, side, pose }: { readonly shoulder: readonly [number, number]; readonly side: -1 | 1; readonly pose: ArmPose }) {
  const elbow = [shoulder[0] + side * Math.sin(rad(pose.angle)) * ARM_PART, shoulder[1] + Math.cos(rad(pose.angle)) * ARM_PART] as const
  const foreAngle = pose.angle + pose.bend
  const hand = [elbow[0] + side * Math.sin(rad(foreAngle)) * ARM_PART, elbow[1] + Math.cos(rad(foreAngle)) * ARM_PART] as const
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]}`} fill="none" stroke={SHIRT_DARK} strokeWidth="5.6" strokeLinecap="round" />
      <path d={`M${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={SKIN} strokeWidth="4.2" strokeLinecap="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.8" fill={SKIN} />
    </>
  )
}

/** 顔。気持ちで 目と口が かわる。look = 目の むき(ひとみの ずれ) */
function Face({ mood, look }: { readonly mood: Mood; readonly look: readonly [number, number] }) {
  const eyes = [72.6, 79.4]
  return (
    <>
      <circle cx="71.2" cy="54" r="1.9" fill={CHEEK} opacity="0.55" />
      <circle cx="80.8" cy="54" r="1.9" fill={CHEEK} opacity="0.55" />
      {mood === 'happy' ? (
        <>
          {eyes.map((x) => (
            <path key={x} d={`M${x - 1.9} 50.8 Q${x} 48.2 ${x + 1.9} 50.8`} fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          ))}
          <path d="M72.2 54.6 Q76 60.2 79.8 54.6 Z" fill={MOUTH} />
        </>
      ) : (
        <>
          {eyes.map((x) =>
            mood === 'calm' ? (
              <circle key={x} cx={x + look[0]} cy={50 + look[1]} r="1.15" fill={EYE} />
            ) : (
              <g key={x}>
                <circle cx={x} cy="50" r={mood === 'wonder' ? 2.4 : 2.2} fill="#ffffff" />
                <circle cx={x + look[0]} cy={50 + look[1]} r="1.15" fill={EYE} />
              </g>
            ),
          )}
          {mood === 'calm' && <path d="M73.6 55.6 Q76 57.6 78.4 55.6" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />}
          {mood === 'scared' && (
            <>
              <path d="M70.2 47.2 L73.7 45.6 M78.3 45.6 L81.8 47.2" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
              <path d="M73.8 56.6 q1.1 -1.3 2.2 0 q1.1 1.3 2.2 0" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
            </>
          )}
          {mood === 'wonder' && (
            <>
              <path d="M70.3 46.2 Q72.6 44.6 74.6 46 M77.4 46 Q79.4 44.6 81.7 46.2" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
              <ellipse cx="76" cy="56.6" rx="1.5" ry="2" fill={MOUTH} />
            </>
          )}
        </>
      )}
    </>
  )
}

type KidProps = {
  readonly mood: Mood
  readonly look: readonly [number, number]
  readonly leftArm: ArmPose
  readonly rightArm: ArmPose
  readonly headTilt: number
}

function Kid({ mood, look, leftArm, rightArm, headTilt }: KidProps) {
  return (
    <>
      {/* あし と くつ(こし から 下へ、左右) */}
      <rect x="70.6" y="75" width="5.2" height="16" rx="2.6" fill={PANTS} />
      <rect x="76.4" y="75" width="5.2" height="16" rx="2.6" fill={PANTS} />
      <ellipse cx="72.3" cy="91.8" rx="4.3" ry="2.2" fill={SHOE} />
      <ellipse cx="79.7" cy="91.8" rx="4.3" ry="2.2" fill={SHOE} />
      {/* くび: みじかく、どう と あたま の すきまを うめる */}
      <rect x="73.4" y="55" width="5.2" height="6" rx="2.4" fill="#eeb98a" />
      {/* どう */}
      <rect x="69" y="57.6" width="14" height="20" rx="6" fill={SHIRT} />
      <path d="M71 71 h10" stroke={SHIRT_DARK} strokeWidth="1.4" strokeLinecap="round" />
      <Arm shoulder={SHOULDER_L} side={-1} pose={leftArm} />
      <Arm shoulder={SHOULDER_R} side={1} pose={rightArm} />
      {/* あたま(くびの うえ を じく に かたむく) */}
      <Layer rotate={headTilt} origin={[76, 56]}>
        <circle cx="67.6" cy="50.8" r="1.9" fill={SKIN} />
        <circle cx="84.4" cy="50.8" r="1.9" fill={SKIN} />
        <circle cx="76" cy="49.4" r="8.8" fill={SKIN} />
        <path d="M67.3 48 C66.6 39 74 36.3 79.6 38.4 C84.6 40.2 86 45 84.7 49 C83 45.4 79.5 43.6 76 43.9 C72 43.6 69 45.4 67.3 48 Z" fill={HAIR} />
        <path d="M76.4 39 Q77 36 78.6 37.6 Q79.4 35.4 80.4 38" fill="none" stroke={HAIR} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <Face mood={mood} look={look} />
      </Layer>
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 9)

  // 気持ち: ふつう → くらくて こわい → ほしに 気づく(おどろき)→ うれしい
  const mood: Mood = t < DARK ? 'calm' : t < NOTICE ? 'scared' : t < HAPPY ? 'wonder' : 'happy'
  // 目の むき: 日の しずむ ほう(左)→ きょろきょろ → ほし(左上)
  const look: readonly [number, number] = mood === 'calm' ? [-0.6, 0.1] : mood === 'scared' ? [wave(t, 1.4) * 0.7, 0.3] : [-0.7, -0.9]
  const shiver = mood === 'scared' ? wave(t, 0.14) * 0.4 : 0
  // うれしくて、その場で ぴょん ぴょん
  const hop = mood === 'happy' ? -Math.abs(wave(t - HAPPY, 0.9)) * 2.4 * span(t, HAPPY, HAPPY + 0.2) * (1 - span(t, INK - 0.4, INK)) : 0

  // うで: ふだんは たらす(こわい ときは ちぢこまる)。ほしを ゆびさす とき、かた から ほしへ のばす
  const raise = span(t, POINT, POINT + 0.7, easeOut)
  const hanging = mood === 'scared' ? 4 : 10
  const leftArm: ArmPose = { angle: mix(t, POINT, POINT + 0.7, hanging, POINT_ANGLE, easeOut), bend: mix(t, POINT, POINT + 0.7, 12, -4, easeOut) }
  // よろこんだら、右の うでも あげて ふる
  const cheer = span(t, HAPPY + 0.3, HAPPY + 0.8, easeOut)
  const rightArm: ArmPose = { angle: hanging + (135 - hanging) * cheer + wave(t, 0.5) * 8 * cheer, bend: 10 * (1 - cheer) - 10 * cheer }
  const headTilt = mood === 'calm' ? -2 : mood === 'scared' ? 2 : -7 + wave(t, 1.2) * 1.5 * raise
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <SettingSun t={t} />
        <Ground t={t} />
        <SmallStars t={t} />
        <BigStar t={t} />
        <ellipse cx={KID_X} cy={GROUND_Y + 0.6} rx="11" ry="2" fill="#000000" opacity="0.15" />
        <Layer x={shiver} y={hop}>
          <Kid mood={mood} look={look} leftArm={leftArm} rightArm={rightArm} headTilt={headTilt} />
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
    { at: 0, label: '日が しずんでいく', sound: 'pop' },
    { at: DARK, label: 'くらくなって、子どもは 心ぼそい' },
    { at: FIRST, label: 'ちいさな ほしが ぴかっ', sound: 'pop' },
    { at: NOTICE, label: '子どもが 気づいて みあげる。ほしが ふえる' },
    { at: BIG, label: '大きな ほしが かがやく。ゆびさして にっこり', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '星 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
