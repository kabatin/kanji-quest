/*
 * 体(からだ): 木の ねもと の ように、人を ささえる もの。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … あたまの てっぺんの はねた かみ から、かた を通って、まえに のばした うで
 *                  (さいごに 手を ひろげて バランスを とった しゅんかん、うで が この線に重なる)
 *   2画目(丨)  … 子どもの どう と あし(これが 人を ささえる「体」)
 *   3画目(一)  … 木の よこに のびた 大きな えだ
 *   4画目(丨)  … 木の みき(ねもと は どっしり ひろがる)
 *   5・6画目   … 左右に たれた えだ
 *   7画目(一)  … 木の ねもとの ベンチ(みきの したの 高さ)
 *
 * ながれ
 *   木が そだつ → 子どもが あらわれる
 *   → つよい風が ふいて、子どもは よろよろ(うで を ばたばた・こわい顔)。木は 風で はっぱが ゆれても みき は どっしり
 *   → 子どもは 木の ねもとを 見て、足を どん と ふんばる(ほこり が ふわっ)
 *   → 風に まけずに まっすぐ立てた! うれしい顔で 手を ひろげる
 *   → ほね が ひかって、絵が うすくなり、字「体」が のこる
 *
 * 人・木は、ほんものの つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。風を うけて たおれそうなときは、足もとを じく に かたむく。
 *   木は 風で はっぱ は ゆれても、みき と ねもと は うごかない。ベンチも じめん に 足が ついている。
 *   字の形になるのは、手を ひろげた さいごの しゅんかん だけ。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '体'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#4f9be0'
const TUNIC_DARK = '#3c82c4'
const TUNIC_FAR = '#33709f'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const PLANK = '#d9a366'
const PLANK_DARK = '#b57e47'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const APPLE = '#e8534a'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const WIND_LINE = '#a9c6e6'

/** くぎり の時間(秒) */
const POP = 0.5
/** つよい風が ふきはじめる / 子どもが ふんばる / 風が よわまる */
const WIND = 1.7
const STEADY = 4.3
const CALM = 5.0
const INK = 6.0
const DONE = 8.8
const DURATION = 9.4

/** 人の 足もと(かたむくときの じく)。絵は 2画目に そろえるため、人は 左へ ずらして おく */
const SHIFT_X = -2.9
const FEET: readonly [number, number] = [24.6, 94]
/** 人の かた(うでを ふる じく。ずらす まえの 場所) */
const SHOULDER: readonly [number, number] = [25.4, 40]
/** 1画目の 書きおわり(手を ひろげたときの 手先。ずらす まえの 場所) */
const HAND_GOAL: readonly [number, number] = [9.1 - SHIFT_X, 60.2]
/** にのうで・うでさき の長さ(手を ひろげると、かた から 1画目の書きおわりに ちょうど とどく) */
const ARM_PART = Math.hypot(HAND_GOAL[0] - SHOULDER[0], HAND_GOAL[1] - SHOULDER[1]) / 2
/** 手を ひろげたときの うで の角度(ま下から、まえへ 何度か) */
const STRETCH = (Math.atan2(SHOULDER[0] - HAND_GOAL[0], HAND_GOAL[1] - SHOULDER[1]) * 180) / Math.PI
const NECK: readonly [number, number] = [28, 35]

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
      {/* とおくの おか と、風で 左へ ながれる 雲(おくゆき を出す) */}
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${-t * 2.2} 0)`}>
        <ellipse cx="96" cy="52" rx="6" ry="2.8" />
        <ellipse cx="100.5" cy="50.4" rx="4.4" ry="3" />
        <ellipse cx="108" cy="8" rx="7" ry="3.2" />
        <ellipse cx="112.5" cy="6.4" rx="5" ry="3.2" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 46, 82, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 風の つよさ(0〜1)。ふきはじめ と やむとき は ふわっと かわる */
const windAt = (t: number): number => during(t, WIND, CALM + 0.7, 0.5)

function Tree({ t }: SceneProps) {
  // みき が下から のびて、えだ が ひろがり、さいごに 葉が ぽん と しげる
  const trunk = span(t, 0, 0.55, backOut)
  const boughs = span(t, 0.3, 0.75, backOut)
  const leaves = span(t, 0.5, 1.0, backOut)
  const wind = windAt(t)
  // 風が右から ふくと 葉の かたまり は 左へ しなる。みき・えだ は うごかない
  const sway = wave(t, 3.4) * 1.3 * (1 - wind) - wind * (3 + 1.8 * wave(t, 0.55))
  return (
    <>
      <ellipse cx="63" cy="97.6" rx={20 * trunk} ry="3" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.6 + 0.4 * trunk} scaleY={trunk} origin={[62.5, 96]}>
        {/* ねもと: どっしり ひろがって、木を ささえる */}
        <path d="M53.5 97 Q59.5 91 58.6 83 L67.4 83 Q67 91 73 97 Z" fill={BARK} />
        <Bone char={CHAR} n={4} color={BARK} width={9.5} />
        <path d="M60.6 52 q1.6 5 0 11 M65.2 66 q-1.4 5 0.2 10" fill="none" stroke={BARK_DARK} strokeWidth="1.3" strokeLinecap="round" />
      </Layer>
      <Layer scale={boughs} origin={[63, 38]}>
        <Bone char={CHAR} n={3} color={BARK} width={6.2} />
        <Bone char={CHAR} n={5} color={BARK} width={5.6} />
        <Bone char={CHAR} n={6} color={BARK} width={5.6} />
      </Layer>
      {/* えだの先の 小さな しげみ と りんご */}
      <Layer scale={leaves} origin={[63, 38]} rotate={sway * 0.6}>
        <circle cx="96.5" cy="76.5" r="7" fill={LEAF_DARK} />
        <circle cx="94" cy="73" r="5" fill={LEAF} />
        <circle cx="97.5" cy="79" r="2.2" fill={APPLE} />
        <circle cx="37.5" cy="80" r="5.4" fill={LEAF_DARK} />
        <circle cx="39.5" cy="77" r="4" fill={LEAF} />
        <circle cx="35" cy="82.6" r="2.1" fill={APPLE} />
      </Layer>
      {/* 上の しげみ: 風で ゆれる */}
      <Layer scale={leaves} rotate={sway} origin={[63, 36]}>
        <circle cx="44" cy="23" r="14.5" fill={LEAF_DARK} />
        <circle cx="83" cy="22" r="14.5" fill={LEAF_DARK} />
        <circle cx="63" cy="15" r="17.5" fill={LEAF_DARK} />
        <circle cx="39" cy="37" r="6.4" fill={LEAF_DARK} />
        <circle cx="91" cy="34.5" r="6.4" fill={LEAF_DARK} />
        <circle cx="53" cy="25" r="12.5" fill={LEAF} />
        <circle cx="73.5" cy="25" r="12.5" fill={LEAF} />
        <circle cx="63" cy="20" r="13.5" fill={LEAF} />
        <circle cx="56" cy="13.5" r="5.2" fill={LEAF_LIGHT} />
        <circle cx="76" cy="16.5" r="3.8" fill={LEAF_LIGHT} />
        <circle cx="48" cy="29" r="2.3" fill={APPLE} />
        <circle cx="79" cy="29.5" r="2.3" fill={APPLE} />
      </Layer>
    </>
  )
}

/** 木の ねもとの ベンチ(7画目)。足は じめん に ついている。 */
function Bench({ t }: SceneProps) {
  const rise = span(t, 0.45, 0.9, backOut)
  return (
    <Layer scaleY={rise} origin={[63, 96]}>
      <rect x="49.4" y="76" width="3.2" height="20" rx="1.2" fill={PLANK_DARK} />
      <rect x="74.4" y="76" width="3.2" height="20" rx="1.2" fill={PLANK_DARK} />
      <rect x="46" y="71.6" width="35" height="5" rx="2.4" fill={PLANK} />
      <rect x="47" y="75" width="33" height="1.6" rx="0.8" fill={PLANK_DARK} />
    </Layer>
  )
}

type Mood = 'scared' | 'brace' | 'happy'

/** うで の かっこう。swing = ま下から まえへ ふった角度 / bend = ひじ の まがり(まえへ) */
type ArmPose = { readonly swing: number; readonly bend: number }

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。 */
function Arm({ pose, color }: { readonly pose: ArmPose; readonly color: string }) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  // 体は 左むき。まえ = 左(x が へる ほう)
  const elbow = [SHOULDER[0] - Math.sin(rad(pose.swing)) * ARM_PART, SHOULDER[1] + Math.cos(rad(pose.swing)) * ARM_PART] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] - Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART] as const
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="6.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.6" fill={SKIN} />
    </>
  )
}

function Face({ mood, wobble }: { readonly mood: Mood; readonly wobble: number }) {
  if (mood === 'scared') {
    return (
      <>
        {/* まゆ は 中ほど が上(ふあん) */}
        <path d="M23.2 23.4 L27 21.4" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="25.4" cy="25.6" r="1.5" fill="#2b2b2b" />
        <circle cx="25" cy="25.1" r="0.45" fill="#ffffff" />
        <ellipse cx="24.4" cy="30.4" rx={1.2 + wobble * 0.3} ry={1.5 + wobble * 0.5} fill="#b9483f" />
      </>
    )
  }
  if (mood === 'brace') {
    return (
      <>
        {/* まゆ は 中ほど が下(ぐっと がんばる) */}
        <path d="M23.2 22.8 L27 24.4" stroke={HAIR} strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="25.4" cy="26.2" r="1.2" fill="#2b2b2b" />
        <path d="M22.8 30.2 h3.4" stroke="#b9483f" strokeWidth="1.3" strokeLinecap="round" />
      </>
    )
  }
  return (
    <>
      <path d="M23.8 24.9 Q25.4 26.6 27 24.9" fill="none" stroke="#2b2b2b" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M23 29.4 Q24.8 32 26.8 29.9" fill="none" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
    </>
  )
}

type PersonProps = {
  readonly step: number
  readonly mood: Mood
  readonly nearArm: ArmPose
  readonly farArm: ArmPose
  readonly headTilt: number
  /** むねを はる(ふんばる とき)0〜1 */
  readonly chest: number
  /** 風で かみ が なびく角度 */
  readonly hairBlow: number
  readonly wobble: number
}

function Person({ step, mood, nearArm, farArm, headTilt, chest, hairBlow, wobble }: PersonProps) {
  return (
    <g transform={`translate(${SHIFT_X} 0)`}>
      {/* むこうの うで: 体の うしろに かくれる */}
      <Arm pose={farArm} color={TUNIC_FAR} />
      {/* うしろの足・まえの足(よろけるとき、ばらばらに ふるえる) */}
      <Layer rotate={step * 17} origin={[30, 68]}>
        <rect x="27.2" y="65" width="6.2" height="27.5" rx="3.1" fill={PANTS_DARK} />
        <ellipse cx="28.6" cy="93.4" rx="5.2" ry="2.8" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 17} origin={[25, 68]}>
        <rect x="21.6" y="65" width="6.2" height="27.5" rx="3.1" fill={PANTS} />
        <ellipse cx="23" cy="93.4" rx="5.2" ry="2.8" fill={SHOE} />
      </Layer>
      {/* くび: どう と あたま の間を、みじかく つなぐ */}
      <rect x="24.8" y="32" width="5.2" height="8" rx="2.4" fill={SKIN_SHADE} />
      {/* どう: ふんばると むねが ふくらむ */}
      <Layer scaleX={1 + chest * 0.06} scaleY={1 + chest * 0.02} origin={[27.4, 70]}>
        <rect x="20.4" y="36.6" width="14" height="34" rx="6.8" fill={TUNIC} />
        <path d="M22.4 62.5 h10" stroke={TUNIC_DARK} strokeWidth="1.6" strokeLinecap="round" />
      </Layer>
      {/* てまえの うで: さいごに 手を ひろげて、1画目の線に重なる */}
      <Arm pose={nearArm} color={TUNIC_DARK} />
      {/* あたま */}
      <Layer rotate={headTilt} origin={NECK}>
        <g transform="translate(-1.4 0.6)">
          <circle cx="30.2" cy="24.6" r="9.2" fill={SKIN} />
          <path d="M21.5 23 C21.4 13.8 31.8 11.2 37.8 17 C40.2 20.2 40.2 26 38.2 30.2 C37.6 24.4 33.4 20.2 26.6 20.6 C24.4 20.8 22.6 21.8 21.5 23 Z" fill={HAIR} />
          <circle cx="26.5" cy="28.8" r="2.1" fill="#ff9d9d" opacity="0.55" />
          <Face mood={mood} wobble={wobble} />
        </g>
        {/* 1画目の 書きはじめ: ぴょこんと はねた かみ。風で 左へ なびく */}
        <Layer rotate={hairBlow} origin={[35, 17.6]}>
          <path d="M32.4 17.6 Q33.2 14.4 35 16.5 Q36.2 13.8 37 16.9" fill="none" stroke={HAIR} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </Layer>
      </Layer>
    </g>
  )
}

/** 風。右から 左へ、くるんと まいた すじ が とおりぬける。 */
function Gusts({ t }: SceneProps) {
  const wind = windAt(t)
  if (wind <= 0) return null
  return (
    <>
      {[30, 52, 68, 84].map((y, i) => {
        const p = (t * 0.9 + i * 0.37) % 1
        return (
          <path
            key={y}
            d="M0 0 h-15 q-4.4 0 -4.4 3.2 q0 2.8 2.8 2.4"
            fill="none"
            stroke={WIND_LINE}
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity={wind * Math.sin(p * Math.PI) * 0.9}
            transform={`translate(${122 - p * 145} ${y})`}
          />
        )
      })}
      {/* 木から ちぎれて とぶ 葉 */}
      {[0, 1, 2].map((i) => {
        const p = (t * 0.7 + i * 0.31) % 1
        const x = 88 - p * 100
        const y = 24 + i * 14 + p * 22 + Math.sin(p * 12 + i) * 4
        return <path key={i} d="M0 -3.4 Q3 0 0 3.4 Q-3 0 0 -3.4 Z" fill={LEAF_LIGHT} stroke={LEAF_DARK} strokeWidth="0.5" opacity={wind * Math.sin(p * Math.PI)} transform={`translate(${x} ${y}) rotate(${p * 400})`} />
      })}
    </>
  )
}

/** よろけている間の あせ。うしろ(右)ではなく、風と ぎゃくの 上へ とぶ。 */
function Sweat({ t, show }: { readonly t: number; readonly show: number }) {
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.4].map((offset) => {
        const p = ((t + offset) % 0.8) / 0.8
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" transform={`translate(${14 - p * 5} ${17 + p * 6 - Math.sin(p * Math.PI) * 5}) rotate(-20)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** ふんばった しゅんかん の ほこり。足もとから 左右へ ふわっと ひろがる。 */
function Dust({ t }: SceneProps) {
  const p = span(t, STEADY, STEADY + 0.7, easeOut)
  const show = during(t, STEADY, STEADY + 0.7, 0.1)
  if (show <= 0) return null
  return (
    <g opacity={show * 0.9} fill="#fbf4e4" stroke="#d9cdb5" strokeWidth="0.6">
      <circle cx={14 - p * 7} cy={94.5 - p * 3} r={1.6 + p * 3} />
      <circle cx={18 - p * 6} cy={96 - p * 1} r={1.2 + p * 2.2} />
      <circle cx={36 + p * 7} cy={94.5 - p * 3} r={1.6 + p * 3} />
      <circle cx={32 + p * 6} cy={96 - p * 1} r={1.2 + p * 2.2} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)
  const wind = windAt(t)

  const pop = span(t, POP, POP + 0.5, backOut)
  // よろよろ: 風に おされて 左へ かたむき、ゆれもどる(足もとが じく)
  const wobble = span(t, WIND, WIND + 0.3) * (1 - span(t, STEADY - 0.1, STEADY + 0.25))
  const sway = wave(t, 0.8)
  // ふんばる: 風に むかって 少し まえかがみ。風が やむと まっすぐ もどる
  const brace = span(t, STEADY, STEADY + 0.3, backOut) * (1 - span(t, CALM, CALM + 0.6))
  const lean = wobble * (-11 + 9 * sway) + brace * 5
  const step = wobble * 0.5 * wave(t, 0.8, 0.2)
  // 手を ひろげる: 字になる 少し前に、てまえの うで を まえへ のばす
  const open = span(t, CALM + 0.2, INK - 0.1, easeInOut)
  const mood: Mood = t < STEADY - 0.1 ? 'scared' : t < CALM + 0.1 ? 'brace' : 'happy'
  const hang = 6
  const nearArm: ArmPose = {
    swing: wobble * (42 + 24 * sway) + (1 - wobble) * (hang + (STRETCH - hang) * open),
    bend: wobble * 22 + (1 - wobble) * 8 * (1 - open),
  }
  const farArm: ArmPose = {
    swing: wobble * (-30 + 22 * sway) + (1 - wobble) * hang,
    bend: wobble * 14 + (1 - wobble) * 8,
  }
  // かみ は 風で なびく(ふきおわると まっすぐ はねる)
  const hairBlow = -wind * (20 + 10 * wave(t, 0.25))
  const headTilt = wobble * -5 * sway + brace * 2 - open * 4
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Tree t={t} />
        <Bench t={t} />
        <Layer opacity={span(t, POP, POP + 0.2)}>
          <ellipse cx="24.6" cy="97.4" rx="9" ry="2.4" fill="#000000" opacity="0.12" />
          <Layer scale={pop} origin={FEET}>
            <Layer rotate={lean} origin={FEET}>
              <Person step={step} mood={mood} nearArm={nearArm} farArm={farArm} headTilt={headTilt} chest={brace} hairBlow={hairBlow} wobble={wobble * sway} />
              <Sweat t={t} show={wobble} />
            </Layer>
          </Layer>
          <Dust t={t} />
        </Layer>
        <Gusts t={t} />
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
    { at: 0, label: '木が そだつ。子どもが あらわれる', sound: 'pop' },
    { at: WIND, label: 'つよい風。子どもが よろよろ' },
    { at: STEADY, label: '木の ねもとを 見て、足を どん と ふんばる', sound: 'pop' },
    { at: CALM, label: '風に まけずに まっすぐ立つ。手を ひろげる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '体 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
