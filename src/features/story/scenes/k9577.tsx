/*
 * 長(ながい): かみの ながい おじいさんが、つえを ついて たっている。
 *
 * ほね(画と絵の対応)  ※ おじいさんは 左を むいて 立つ。かぜは 左から ふく。
 *   1画目(丨)    … あたまから せなかへ たれた ながい かみ(かぜが ないときは 下へ たれる)
 *   2・3・4画目  … かぜに なびいた 3本の ながい もの: あたまの上の かみ・うしろの かみ・あごの ひげ
 *   5画目(一)    … つえを にぎる 手(左はし)から、かたの マフラーが 右へ なびく線
 *   6画目(𠃍)    … おじいさんの あし(まっすぐ 立つ)
 *   7画目(ノ)    … マフラーの はしの たれた ところ
 *   8画目(㇏)    … かぜに ふくらむ マント(かたから 右下へ)
 *   ※ 字の ほぼ 同じ ばしょに かさなる のは、かぜを うけて 立った さいごの しゅんかん だけ。
 *
 * ながれ
 *   はらっぱを、つかれた おじいさんが つえを かついで あるいてくる(かみは ながく たれている)
 *   → つよい かぜ! かみ・ひげ・マフラーが なびいて、おじいさんは ふらふら(びっくり)
 *   → つえを「とん」と つくと、ぴたっと 立てる(ほっと して にっこり)
 *   → かぜに ながい かみが なびく まま、ほね が ひかって 絵が うすくなり、字「長」が のこる
 *
 * おじいさんは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがり、手で つえを にぎる。くび は みじかい。あし は こし から。
 *   かみ・ひげ・マフラー・マント は、かぜが ないと 下へ たれ、かぜが ふくと 右へ なびく。
 */
import { during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '長'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#f3f5f8'
const HAIR_SHADE = '#c9d1dd'
const ROBE = '#4f9be0'
const ROBE_DARK = '#3c82c4'
const ROBE_FAR = '#33709f'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const SCARF = '#e8534a'
const SCARF_DARK = '#c23f38'
const CAPE = '#d08a4e'
const CAPE_DARK = '#b06f38'
const STAFF = '#a6743f'
const STAFF_DARK = '#85592c'
const LEAF = '#55b86e'
const LEAF_LIGHT = '#8bd69a'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const WIND = '#9cc9ec'

/** くぎり の時間(秒) */
const WALK = 0.7
const ARRIVE = 2.6
/** つよい かぜが ふきはじめる */
const GUST = 2.8
/** つえを「とん」と つく */
const PLANT = 4.0
const INK = 5.7
const DONE = 8.8
const DURATION = 9.4

/** おじいさんの かたの いち(てまえの うで・むこうの うで) */
const SHOULDER_NEAR: readonly [number, number] = [35, 44]
const SHOULDER_FAR: readonly [number, number] = [39, 44]
/** にのうで・うでさき の長さ */
const ARM_PART = 12.5
/** つえの 手から 上の長さ・下の長さ(下は 地面に とどく) */
const STAFF_UP = 11
const STAFF_DOWN = 39
/** くび の つけね(あたまを かたむける じく)と あたま の まんなか */
const NECK: readonly [number, number] = [37, 37]
const HEAD: readonly [number, number] = [37, 28]

const lerp = (a: number, b: number, k: number) => a + (b - a) * k
type Pt = readonly [number, number]
const mixPt = (a: Pt, b: Pt, k: number): Pt => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  // かぜが ふくと、雲が はやく ながれる
  const drift = t * 1.6 + span(t, GUST, GUST + 1.5) * 8
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 70 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${drift} 0)`}>
        <ellipse cx="-4" cy="46" rx="7" ry="3.4" />
        <ellipse cx="1" cy="44" rx="5" ry="3.4" />
        <ellipse cx="86" cy="6" rx="6" ry="2.8" />
        <ellipse cx="90.5" cy="4.4" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 52, 82, 101].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** つよい かぜ: 左から 右へ ながれる すじ と、とんでいく 葉 */
function Gust({ t }: SceneProps) {
  const show = during(t, GUST, DONE, 0.4)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[7, 21, 48, 66, 80].map((y, i) => {
        const x = ((t * 80 + i * 41) % 170) - 40
        return <path key={y} d={`M${x} ${y} h${14 + (i % 2) * 6}`} stroke={WIND} strokeWidth="1.1" strokeLinecap="round" opacity="0.8" />
      })}
      {[0, 1, 2].map((k) => {
        const p = ((t - GUST) * 0.55 + k * 0.33) % 1
        const x = -6 + p * 122
        const y = 66 - k * 17 + Math.sin(p * 11 + k) * 6 - p * 8
        return <path key={k} d="M0 -2.6 Q2.4 0 0 2.6 Q-2.4 0 0 -2.6 Z" fill={k === 1 ? LEAF_LIGHT : LEAF} transform={`translate(${x} ${y}) rotate(${p * 520 + k * 70})`} />
      })}
    </g>
  )
}

/** うで の かっこう。swing = ま下から まえ(左)へ ふった角度 / bend = ひじ の まがり */
type ArmPose = { readonly swing: number; readonly bend: number }

/** かた → ひじ → 手 の じゅんに つながる。体は 左むき(まえ = x が へる ほう)。 */
function armPoints(shoulder: Pt, pose: ArmPose): { readonly elbow: Pt; readonly hand: Pt } {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const elbow: Pt = [shoulder[0] - Math.sin(rad(pose.swing)) * ARM_PART, shoulder[1] + Math.cos(rad(pose.swing)) * ARM_PART]
  const fore = pose.swing + pose.bend
  const hand: Pt = [elbow[0] - Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART]
  return { elbow, hand }
}

function Arm({ shoulder, pose, color }: { readonly shoulder: Pt; readonly pose: ArmPose; readonly color: string }) {
  const { elbow, hand } = armPoints(shoulder, pose)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.2" fill={SKIN} />
    </>
  )
}

/** つえ(手の ところが じく)。rotate = ま下から まえ(左)へ かたむけた角度 */
function Staff({ hand, rotate }: { readonly hand: Pt; readonly rotate: number }) {
  return (
    <Layer x={hand[0]} y={hand[1]} rotate={rotate}>
      <rect x="-1.7" y={-STAFF_UP} width="3.4" height={STAFF_UP + STAFF_DOWN} rx="1.7" fill={STAFF} />
      <rect x="0.2" y={-STAFF_UP + 1} width="1.2" height={STAFF_UP + STAFF_DOWN - 2} rx="0.6" fill={STAFF_DARK} opacity="0.5" />
      <circle cx="0" cy={-STAFF_UP} r="2.7" fill={STAFF_DARK} />
      <circle cx="-0.4" cy={-STAFF_UP - 0.4} r="1.6" fill={STAFF} />
    </Layer>
  )
}

/** かみ・ひげ の 1ふさ。かぜが ないと 下へ たれ、かぜが ふくと 右へ なびく。 */
type Lock = { readonly from: Pt; readonly hangCtrl: Pt; readonly hangEnd: Pt; readonly windCtrl: Pt; readonly windEnd: Pt; readonly width: number }

const LOCK_TOP: Lock = { from: [40, 19.5], hangCtrl: [48, 28], hangEnd: [47, 46], windCtrl: [52, 13.5], windEnd: [67, 13.5], width: 4 }
const LOCK_BACK: Lock = { from: [45, 27], hangCtrl: [50, 40], hangEnd: [48, 56], windCtrl: [58, 28], windEnd: [70, 27.5], width: 4.6 }
const BEARD: Lock = { from: [33, 34.5], hangCtrl: [30, 43], hangEnd: [33, 52], windCtrl: [48, 41], windEnd: [68, 40], width: 4.6 }

function HairLock({ lock, wind, flutter }: { readonly lock: Lock; readonly wind: number; readonly flutter: number }) {
  const ctrl = mixPt(lock.hangCtrl, lock.windCtrl, wind)
  const end = mixPt(lock.hangEnd, lock.windEnd, wind)
  const d = `M${lock.from[0]} ${lock.from[1]} Q${ctrl[0]} ${ctrl[1] + flutter * 0.6} ${end[0]} ${end[1] + flutter}`
  return (
    <>
      <path d={d} fill="none" stroke={HAIR_SHADE} strokeWidth={lock.width + 1.4} strokeLinecap="round" />
      <path d={d} fill="none" stroke={HAIR} strokeWidth={lock.width} strokeLinecap="round" />
    </>
  )
}

/** かたの マフラー。かぜで 右へ なびく。 */
function Scarf({ wind, flutter }: { readonly wind: number; readonly flutter: number }) {
  const ctrl = mixPt([46, 50], [62, 47], wind)
  const end = mixPt([44, 66], [92, 53], wind)
  const d = `M38 41.5 Q${ctrl[0]} ${ctrl[1] + flutter * 0.6} ${end[0]} ${end[1] + flutter}`
  return (
    <>
      <path d={d} fill="none" stroke={SCARF_DARK} strokeWidth="5.4" strokeLinecap="round" />
      <path d={d} fill="none" stroke={SCARF} strokeWidth="4" strokeLinecap="round" />
    </>
  )
}

/** せなかの マント。かぜを うけて 右下へ ふくらむ。 */
function Cape({ wind, flutter }: { readonly wind: number; readonly flutter: number }) {
  const c1 = mixPt([47, 60], [66, 50], wind)
  const tip = mixPt([49, 86], [96, 91], wind)
  const c2 = mixPt([50, 75], [64, 80], wind)
  const d = `M41 41 Q${c1[0]} ${c1[1]} ${tip[0]} ${tip[1] + flutter} Q${c2[0]} ${c2[1] + flutter * 0.4} 44 66 Z`
  return (
    <>
      <path d={d} fill={CAPE} />
      <path d={`M43 44 Q${c1[0] - 2} ${c1[1] + 6} ${lerp(tip[0], 44, 0.22)} ${lerp(tip[1] + flutter, 66, 0.22)}`} fill="none" stroke={CAPE_DARK} strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    </>
  )
}

type Mood = 'tired' | 'scared' | 'happy'

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <g transform={`translate(${HEAD[0]} ${HEAD[1]})`}>
      <circle cx="3.6" cy="0.8" r="2.2" fill={SKIN_SHADE} />
      <circle cx="0" cy="0" r="9.5" fill={SKIN} />
      {/* はな: 左(まえ)へ ちょこんと */}
      <circle cx="-9.4" cy="1.4" r="1.9" fill={SKIN} />
      <circle cx="-4.2" cy="3.4" r="2" fill="#ff9d9d" opacity={mood === 'happy' ? 0.7 : 0.4} />
      {mood === 'tired' && (
        <>
          <path d="M-7.6 -3.2 L-2.8 -2.2" stroke={HAIR_SHADE} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M-6.4 -0.6 Q-4.7 0.4 -3 -0.6" fill="none" stroke="#2b2b2b" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M-6.4 5.2 Q-5 4.2 -3.6 5.2" fill="none" stroke="#b9483f" strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'scared' && (
        <>
          <path d="M-7.8 -5.4 L-3 -6.6" stroke={HAIR_SHADE} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="-4.8" cy="-1.6" r="2" fill="#ffffff" />
          <circle cx="-5" cy="-1.6" r="1.1" fill="#2b2b2b" />
          <ellipse cx="-5.4" cy="5.4" rx="1.5" ry="2" fill="#b9483f" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M-7.6 -4.4 L-2.8 -4.6" stroke={HAIR_SHADE} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M-6.6 -0.4 Q-4.8 -2.6 -3 -0.4" fill="none" stroke="#2b2b2b" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M-7.2 4 Q-5.2 7 -2.8 4.2" fill="none" stroke="#b9483f" strokeWidth="1.3" strokeLinecap="round" />
        </>
      )}
      {/* あたまの かみ(うしろと 上を おおう) */}
      <path d="M-8.2 -4 C-8 -10.6 1 -12.4 6 -9.5 C10.6 -6.6 11 0 9.2 6 C7.5 2.4 6 -1.5 1 -3.4 C-2.5 -4.6 -6 -4.4 -8.2 -4 Z" fill={HAIR} stroke={HAIR_SHADE} strokeWidth="0.6" strokeLinejoin="round" />
    </g>
  )
}

type PersonProps = {
  readonly t: number
  readonly step: number
  readonly mood: Mood
  readonly nearArm: ArmPose
  readonly farArm: ArmPose
  readonly staffRot: number
  readonly headTilt: number
  readonly wind: number
}

function Person({ t, step, mood, nearArm, farArm, staffRot, headTilt, wind }: PersonProps) {
  // かぜの中の ひらひら: 先っぽほど ゆれる
  const flutter = wind * wave(t, 0.34) * 2.4
  const flutter2 = wind * wave(t, 0.4, 0.17) * 2.4
  const near = armPoints(SHOULDER_NEAR, nearArm)
  return (
    <>
      <Arm shoulder={SHOULDER_FAR} pose={farArm} color={ROBE_FAR} />
      <Cape wind={wind} flutter={flutter2} />
      {/* あし: こし から ふる。つま先は 左(まえ) */}
      <Layer rotate={step * 17} origin={[38, 76]}>
        <rect x="38.2" y="74" width="5.4" height="19" rx="2.7" fill={PANTS_DARK} />
        <ellipse cx="39.4" cy="94.4" rx="4.6" ry="2.5" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 17} origin={[35, 76]}>
        <rect x="30.4" y="74" width="5.4" height="19" rx="2.7" fill={PANTS} />
        <ellipse cx="31.6" cy="94.4" rx="4.6" ry="2.5" fill={SHOE} />
      </Layer>
      {/* どう: ながい ふく */}
      <path d="M32.5 40 Q37 37 42.5 40 L45 79 Q37 82 29.5 79 Z" fill={ROBE} />
      <path d="M31.2 62 Q37 64 43.8 62" fill="none" stroke={ROBE_DARK} strokeWidth="1.6" strokeLinecap="round" />
      <Scarf wind={wind} flutter={flutter} />
      <HairLock lock={LOCK_TOP} wind={wind} flutter={flutter2} />
      <HairLock lock={LOCK_BACK} wind={wind} flutter={flutter} />
      {/* くび: みじかく、どう と あたま を つなぐ */}
      <rect x="34.4" y="34" width="5.2" height="7" rx="2.4" fill={SKIN_SHADE} />
      <Layer rotate={headTilt} origin={NECK}>
        <Face mood={mood} />
        <HairLock lock={BEARD} wind={wind} flutter={flutter} />
      </Layer>
      <Staff hand={near.hand} rotate={staffRot} />
      <Arm shoulder={SHOULDER_NEAR} pose={nearArm} color={ROBE_DARK} />
    </>
  )
}

/** ふらついた ときの 「!」と あせ。 */
function Alarm({ t, show }: { readonly t: number; readonly show: number }) {
  if (show <= 0) return null
  const bob = wave(t, 0.3) * 0.8
  return (
    <g opacity={show}>
      <g transform={`translate(24 ${12 + bob})`}>
        <rect x="-1.3" y="-6" width="2.6" height="7" rx="1.3" fill="#e8534a" />
        <circle cx="0" cy="4" r="1.5" fill="#e8534a" />
      </g>
      {[0, 0.5].map((offset) => {
        const p = ((t * 1.6 + offset) % 1)
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" transform={`translate(${30 + p * 12} ${20 - p * 5 + p * p * 12}) rotate(-60)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** つえを ついた しゅんかん の ほこり と ひびき。 */
function Thump({ t, x }: { readonly t: number; readonly x: number }) {
  const p = span(t, PLANT, PLANT + 0.8, easeOut)
  if (p <= 0 || p >= 1) return null
  const y = 96.4
  return (
    <g opacity={1 - p}>
      <ellipse cx={x - 3 - p * 6} cy={y - 1 - p * 2} rx={2 + p * 3} ry={1.4 + p * 1.6} fill="#ffffff" stroke="#d8e4d0" strokeWidth="0.6" />
      <ellipse cx={x + 3 + p * 6} cy={y - 1 - p * 2} rx={2 + p * 3} ry={1.4 + p * 1.6} fill="#ffffff" stroke="#d8e4d0" strokeWidth="0.6" />
      {[-1, 0, 1].map((k) => (
        <path key={k} d={`M${x + k * 4} ${y - 4 - p * 3} v${-3 - p * 2}`} stroke="#f0b04a" strokeWidth="1.1" strokeLinecap="round" transform={`rotate(${k * 28} ${x} ${y})`} />
      ))}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)

  // かぜ: GUST から ふきはじめ、さいごまで ふきつづける
  const wind = span(t, GUST, GUST + 0.5, easeOut)
  // ふらつく ひつよう の ある あいだ(つえを つくと おさまる)
  const stumble = span(t, GUST, GUST + 0.3) * (1 - span(t, PLANT - 0.05, PLANT + 0.35, easeInOut))
  // つえが ま下に おりて ささる 度合い
  const plant = span(t, PLANT - 0.45, PLANT, easeIn)

  // あるく: 右から 来て、つえの ある ばしょ まで
  const walking = (1 - span(t, ARRIVE - 0.3, ARRIVE)) * (t < WALK ? 0 : 1)
  const stride = Math.sin((t - WALK) * Math.PI * 2 * 1.5) * walking
  const stagger = Math.sin((t - GUST) * Math.PI * 2 * 2.2) * stumble * 0.8
  const step = stride + stagger
  const walkX = mix(t, WALK, ARRIVE, 100, 0, easeInOut)
  const bob = -Math.abs(stride) * 1.2 + Math.sin(span(t, PLANT, PLANT + 0.25) * Math.PI) * 1.2

  // かぜに おされて 右へ のけぞる
  const lean = 13 * stumble * (0.75 + 0.25 * wave(t - GUST, 0.6))

  // うで と つえ: あるくときは つえを かついで ふり、ふらつくと ばたばた、つくと ま下に ささる
  const flail = wave(t, 0.5, 0.2) * stumble
  const nearArm: ArmPose = {
    swing: lerp(25 + stride * 14 + flail * 18, 45, plant),
    bend: lerp(35, 23, plant),
  }
  const farArm: ArmPose = {
    swing: lerp(8 - stride * 14 - flail * 18, 6, plant),
    bend: lerp(20, 8, plant),
  }
  const staffRot = lerp(-38 + stride * 6 + flail * 28, 0, plant)

  const mood: Mood = t < GUST ? 'tired' : t < PLANT ? 'scared' : 'happy'
  const headTilt = t < GUST ? -5 + stride * 2 : t < PLANT ? 10 * stumble : -4 * span(t, PLANT, PLANT + 0.3) * (1 - span(t, PLANT + 0.4, PLANT + 0.9))
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <ellipse cx={36 + walkX} cy="97.4" rx="12" ry="2.4" fill="#000000" opacity="0.12" />
        <Layer x={walkX} y={bob}>
          <Layer rotate={lean} origin={[37, 94]}>
            <Person t={t} step={step} mood={mood} nearArm={nearArm} farArm={farArm} staffRot={staffRot} headTilt={headTilt} wind={wind} />
            <Alarm t={t} show={stumble} />
          </Layer>
        </Layer>
        <Thump t={t} x={14.6 + walkX} />
        <Gust t={t} />
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
    { at: 0, label: 'はらっぱに お日さまが でる', sound: 'pop' },
    { at: WALK, label: 'かみの ながい おじいさんが つえを かついで あるいてくる' },
    { at: GUST, label: 'つよい かぜ! かみが なびいて ふらふら', sound: 'pop' },
    { at: PLANT, label: 'つえを とん と つく。ほっと にっこり', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '長 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
