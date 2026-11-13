/*
 * 遠(とおい): 子どもが みちを ずっと ずっと あるいて いく。それでも ゴールの おうちは まだ とおい。
 *
 * ほね(画と絵の対応)
 *   13画目(辶の 下の よこ線)  … 子どもが あるく みち(ながい みち)
 *   11画目(辶の てん)        … みちの はじまり(左うえ)。いまは ぼうしの かわりに 空のくも
 *   12画目(辶の ジグザグ)    … 子どもの あるいてきた あし あと の みち(ここは 絵の 右うえの ほうを うすく のこす)
 *   1〜10画目(袁)            … 右の おかの うえの とおい おうち と、そのまわりの 空(だいたい 同じ あたり)
 *   ※ 子どもの からだ は 字の形に合わせず、ほんものの 人の つくり で かく
 *
 * ながれ
 *   子どもが おうちを 出て、げんきに みちを あるく(まわりの 木が うしろへ ながれていく)
 *   → ずっと あるいて あせが 出て、つかれてくる(あしが おそく なる)
 *   → とまって「ふう」。手を ひたいに かざして、おかの 上の とおい おうちを 見る(まだ とおい)
 *   → 「よし!」と こぶしを あげる(また あるく ぞ) → ほね が ひかり、絵が うすくなって 字「遠」が のこる
 *
 * 人は、ほんものの 人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく、あたま は どう の まんなか の上。
 *   まわりの ようすは「おそくなる うごき」と「うしろへ ながれる 木」で、とおさ を見せる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Bone, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '遠'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#4f9be0'
const TUNIC_DARK = '#3c82c4'
const TUNIC_FAR = '#33709f'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const PACK = '#e8534a'
const PACK_DARK = '#c9433b'
const BARK = '#8c5b3c'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const GRASS = '#c5e8a9'
const HILL = '#e2f2d2'
const HILL_NEAR = '#cfe9b8'
const ROAD = '#ead3a4'
const ROAD_DARK = '#d6b983'
const SUN = '#ffd24a'
const SWEAT = '#7cc4f2'

/** くぎり の時間(秒) */
const START = 0.3
const TIRED = 2.8
/** とまって「ふう」 */
const STOP = 4.9
/** 手を ひたいに かざして、とおくを 見る */
const LOOK = 5.4
/** 「よし!」 */
const CHEER = 5.95
const INK = 6.3
const DONE = 9.3
const DURATION = 9.8

/** みち の まんなかの 点(13画目の 線と、左右に のばした ところ)。子どもの 足もとの 高さを きめる */
const ROAD_POINTS: readonly (readonly [number, number])[] = [
  [-6, 82.4],
  [15.3, 83],
  [26.6, 81.9],
  [37.7, 84.5],
  [48.8, 87.4],
  [59.8, 90.3],
  [70.8, 93.2],
  [82.1, 94.8],
  [93.5, 94],
  [116, 92.5],
]

/** x の ところの みち の高さ(点と点の間は まっすぐ つなぐ) */
function roadY(x: number): number {
  for (let i = 1; i < ROAD_POINTS.length; i += 1) {
    const [x1, y1] = ROAD_POINTS[i]
    if (x <= x1) {
      const [x0, y0] = ROAD_POINTS[i - 1]
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
    }
  }
  return ROAD_POINTS[ROAD_POINTS.length - 1][1]
}

/** 子どもの 立つ ばしょ(画面の x)。ここで 足ぶみ しながら、まわりが うしろへ ながれる */
const KID_X = 31
/** 子どもの 大きさ(足もとが じく)。からだの たかさは 約46 なので、画面では 約28 */
const KID_SCALE = 0.62

/** あるいた きょり。はじめ は 早く、つかれて だんだん おそく、とまる */
function walked(t: number): number {
  return mix(t, START, STOP, 0, 118, easeOut)
}

/* ───────── まわりの ようす ───────── */

/** 世界の x が 画面を 1しゅう する はば(これを こえると 同じ木が また 出る) */
const WORLD = 150

/** 世界の位置 wx の ものが、あるいた分 scroll だけ うしろ(左)へ ながれたときの 画面の x */
const screenX = (wx: number, scroll: number) => ((((wx - scroll) % WORLD) + WORLD) % WORLD) - 22

function Sky({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[96, 14]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="95.2" y="2.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 96 14)`} />
        ))}
      </Layer>
      <circle cx="96" cy="14" r={6.2 * sun} fill={SUN} />
      {/* ゆっくり ながれる 雲(とおい ものは ゆっくり うごく) */}
      <g fill="#ffffff" opacity="0.92" transform={`translate(${-t * 1.1} 0)`}>
        <ellipse cx="40" cy="14" rx="7.5" ry="3.4" />
        <ellipse cx="45" cy="12" rx="5" ry="3.4" />
        <ellipse cx="85" cy="32" rx="6" ry="2.8" />
        <ellipse cx="89.5" cy="30.4" rx="4.4" ry="3" />
      </g>
    </>
  )
}

/** とおくの おか と、その うえの ゴールの おうち。ほとんど うごかない(まだ とおい) */
function FarHill({ t }: SceneProps) {
  const glow = during(t, LOOK - 0.1, CHEER + 0.25, 0.25)
  return (
    <>
      <path d="M20 90 Q55 60 125 74 V92 H20 Z" fill={HILL} />
      <path d="M40 90 Q70 52 125 66 V92 H40 Z" fill={HILL_NEAR} />
      {/* ゴールの おうち(ちいさい)。ちいさい のは とおい から */}
      <g transform="translate(86 62.4)">
        <rect x="-4.6" y="-3.6" width="9.2" height="6" rx="0.8" fill="#fff4dc" />
        <path d="M-6 -3.4 L0 -8.4 L6 -3.4 Z" fill="#e2733f" />
        <rect x="-1" y="-0.6" width="2" height="3" rx="0.5" fill="#8c5b3c" />
        <rect x="2.6" y="-8.6" width="1.6" height="3" fill="#b9483f" />
        <path d={`M3.4 ${-9.6 - (t % 1.6) * 1.4} q1.4 -1.6 0 -3`} fill="none" stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round" opacity="0.8" />
      </g>
      {/* 子どもが 見たとき、おうちが ぱっと ひかる */}
      <g opacity={glow * 0.8} fill="none" stroke={SUN} strokeWidth="1" strokeLinecap="round">
        <circle cx="86" cy="62" r={7 + glow * 2} />
        <path d="M86 49 v-3 M95 52 l2 -2 M77 52 l-2 -2" />
      </g>
    </>
  )
}

function Tree({ x, scale }: { readonly x: number; readonly scale: number }) {
  return (
    <Layer x={x} y={80.5} scale={scale}>
      <rect x="-1.6" y="-9" width="3.2" height="9.5" rx="1.4" fill={BARK} />
      <circle cx="0" cy="-14" r="7.4" fill={LEAF_DARK} />
      <circle cx="-0.8" cy="-15" r="5.6" fill={LEAF} />
      <circle cx="-2.6" cy="-17" r="2" fill={LEAF_LIGHT} />
    </Layer>
  )
}

/** みちの ざり(いしころ)。あるいた分だけ うしろへ ながれて、すすんでいる のが わかる */
function Pebbles({ scroll }: { readonly scroll: number }) {
  return (
    <>
      {[4, 22, 41, 58, 77, 96, 113, 131].map((wx, i) => {
        const x = screenX(wx, scroll * 1.5)
        return <ellipse key={wx} cx={x} cy={roadY(x) + (i % 2 === 0 ? 1.4 : -1.2)} rx={i % 3 === 0 ? 1.5 : 1} ry="0.6" fill={ROAD_DARK} />
      })}
    </>
  )
}

function Ground({ t }: SceneProps) {
  const scroll = walked(t)
  return (
    <>
      <path d="M-4 80 Q30 76 60 80 T113 82 V101 H-4 Z" fill={GRASS} />
      {[[0, 0.95], [38, 1.15], [76, 0.85], [112, 1.05]].map(([wx, s]) => (
        <Tree key={wx} x={screenX(wx, scroll)} scale={s} />
      ))}
      {/* みち: 13画目の線の うえ。ながい ながい みち */}
      <Layer opacity={span(t, 0, 0.5)}>
        <path d="M-6 82.4 L15.25 83 M93.5 94 L116 92.5" fill="none" stroke={ROAD} strokeWidth="8" strokeLinecap="round" />
        <Bone char={CHAR} n={13} color={ROAD} width={8} />
        <Pebbles scroll={scroll} />
      </Layer>
    </>
  )
}

/* ───────── 子ども(主役) ───────── */

type Mood = 'cheer' | 'tired' | 'look' | 'glad'

/** うで の かっこう。swing = ま下から まえへ ふった角度(90 で まえ水平、180 で ま上) / bend = ひじ の まがり */
type ArmPose = { readonly swing: number; readonly bend: number }

const rad = (deg: number) => (deg * Math.PI) / 180
/** かた(からだの 上の ほう)と、うで の ぶぶん の長さ。足もとが 0,0 */
const SHOULDER: readonly [number, number] = [0, -38]
const ARM_PART = 10.5

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。まえ = 右 */
function Arm({ pose, color }: { readonly pose: ArmPose; readonly color: string }) {
  const elbow = [SHOULDER[0] + Math.sin(rad(pose.swing)) * ARM_PART, SHOULDER[1] + Math.cos(rad(pose.swing)) * ARM_PART] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] + Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART] as const
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.5" fill={SKIN} />
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

/** 足もとが (0,0)、みぎむき。たかさ 約46。あたま は どう の まんなか の上、くび は みじかい */
function Kid({ step, mood, nearArm, farArm, headTilt }: KidProps) {
  return (
    <>
      <Arm pose={farArm} color={TUNIC_FAR} />
      {/* うしろの足・まえの足(あるくとき、かわりばんこに ふる) */}
      <Layer rotate={step * 24} origin={[0, -20]}>
        <rect x="-3" y="-21" width="6" height="21.5" rx="3" fill={PANTS_DARK} />
        <ellipse cx="1.8" cy="-0.6" rx="5.2" ry="2.7" fill={SHOE} />
      </Layer>
      {/* せおった リュック(せなか = 左がわ) */}
      <rect x="-13.5" y="-41" width="8.4" height="18" rx="3.4" fill={PACK} />
      <rect x="-13.5" y="-33" width="8.4" height="2" fill={PACK_DARK} />
      <Layer rotate={-step * 24} origin={[0, -20]}>
        <rect x="-3" y="-21" width="6" height="21.5" rx="3" fill={PANTS} />
        <ellipse cx="1.8" cy="-0.6" rx="5.2" ry="2.7" fill={SHOE} />
      </Layer>
      {/* くび(みじかく どう と あたま を つなぐ) */}
      <rect x="-2.2" y="-47" width="4.8" height="8" rx="2.2" fill={SKIN_SHADE} />
      {/* どう */}
      <rect x="-7.2" y="-42.4" width="14.4" height="24" rx="6.6" fill={TUNIC} />
      <path d="M-5.6 -26 h11.2" stroke={TUNIC_DARK} strokeWidth="1.5" strokeLinecap="round" />
      {/* てまえの うで */}
      <Arm pose={nearArm} color={TUNIC_DARK} />
      {/* あたま(くび の さき を じく に かたむく) */}
      <Layer rotate={headTilt} origin={[0.6, -46]}>
        <circle cx="1.6" cy="-54.4" r="9.2" fill={SKIN} />
        <path d="M-7.4 -54 C-8.6 -64.6 3.6 -67.6 9.6 -60.6 C11 -58.6 11 -55.6 10.2 -53.4 C8.6 -58.4 4.4 -60.4 -1.6 -59.6 C-4.4 -59.2 -6.4 -57 -7.4 -54 Z" fill={HAIR} />
        <circle cx="6.8" cy="-49.4" r="2" fill="#ff9d9d" opacity="0.55" />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

/** 気持ちで 目と口を かえる */
function Face({ mood }: { readonly mood: Mood }) {
  if (mood === 'cheer') {
    return (
      <>
        <circle cx="5.6" cy="-54" r="1.25" fill="#2b2b2b" />
        <path d="M4.4 -49.2 Q6.6 -46.4 9.4 -49" fill="none" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
      </>
    )
  }
  if (mood === 'tired') {
    return (
      <>
        <path d="M3.6 -57.6 l3.6 1.3" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="5.6" cy="-54.2" r="1.15" fill="#2b2b2b" />
        <ellipse cx="7.4" cy="-48.6" rx="1.4" ry="1.8" fill="#b9483f" />
      </>
    )
  }
  if (mood === 'look') {
    return (
      <>
        <path d="M3.8 -57 l3.6 -0.6" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="5.8" cy="-54.6" r="1.2" fill="#2b2b2b" />
        <path d="M5.6 -48.8 h3" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
      </>
    )
  }
  return (
    <>
      <path d="M4 -53.6 Q5.8 -56 7.6 -53.6" fill="none" stroke="#2b2b2b" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4.6 -49.6 Q7 -45.4 9.8 -49.4 Z" fill="#b9483f" />
    </>
  )
}

/** あるいて ひたいから とぶ あせ。うしろ(左)へ とぶ */
function Sweat({ t }: SceneProps) {
  const show = during(t, TIRED + 0.1, STOP + 0.6, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.5].map((offset) => {
        const p = ((t + offset) % 1) / 1
        return <path key={offset} d="M0 -2.6 Q2.2 0.6 0 2.2 Q-2.2 0.6 0 -2.6 Z" fill={SWEAT} transform={`translate(${-8 - p * 8} ${-62 + p * 9 - Math.sin(p * Math.PI) * 4}) rotate(-30)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** とまった しゅんかんの「ふう」。口の まえから ふわっと */
function Sigh({ t }: SceneProps) {
  const show = during(t, STOP + 0.1, LOOK + 0.35, 0.2)
  if (show <= 0) return null
  const p = span(t, STOP + 0.1, LOOK + 0.35, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={12 + p * 8} cy={-47 - p * 3} rx={2.8 + p * 2.4} ry={1.9 + p * 1.5} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
      <ellipse cx={11.5 + p * 4} cy={-46 - p} rx={1.4 + p} ry={1 + p * 0.5} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
    </g>
  )
}

/** そらを とぶ 小鳥(にぎやかし) */
function Bird({ t }: SceneProps) {
  const p = span(t, 1.2, 5.2)
  if (p <= 0 || p >= 1) return null
  const x = -6 + p * 125
  const y = 22 + Math.sin(p * 9) * 3
  const flap = wave(t, 0.3) * 24
  return (
    <Layer x={x} y={y}>
      <ellipse cx="0" cy="0" rx="3.4" ry="2.4" fill="#ff9a5c" />
      <circle cx="2.6" cy="-1.4" r="1.9" fill="#ff9a5c" />
      <path d="M4.2 -1.4 l2.2 0.5 l-2.2 0.9 Z" fill="#f2b632" />
      <circle cx="3.2" cy="-1.9" r="0.45" fill="#2b2b2b" />
      <Layer rotate={flap} origin={[-0.4, -0.6]}>
        <path d="M1 -0.6 Q-1.4 -4.6 -4 -0.6 Q-1.4 0.8 1 -0.6 Z" fill="#e2733f" />
      </Layer>
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 13)

  // あるく: 足ぶみは あるいた きょり に合わせる(おそくなると 足も ゆっくり)。とまると ぴたっと止まる
  const scroll = walked(t)
  const stopping = 1 - span(t, STOP - 0.45, STOP)
  const stride = t < START ? 0 : Math.sin(scroll * 0.36) * stopping
  // 子どもは さいしょ 左から 入ってきて、まんなか(KID_X)で 足ぶみ
  const kidX = mix(t, START, START + 1, -10, KID_X, easeOut)
  const feetY = roadY(kidX)
  // みちの かたむき に合わせて 少し 体を かたむける
  const slope = (Math.atan2(roadY(kidX + 4) - roadY(kidX - 4), 8) * 180) / Math.PI

  // つかれて まえかがみ になる → とまる → しゃんと する
  const tired = span(t, TIRED, STOP - 0.3, easeInOut)
  const lean = tired * 5 * (1 - span(t, LOOK, LOOK + 0.4)) + slope * 0.4
  const bob = t < START ? 0 : -Math.abs(stride) * 1.3 * (1 - tired * 0.5)
  // 「よし!」で ぴょん と はねる
  const hop = Math.sin(span(t, CHEER, CHEER + 0.45) * Math.PI) * 4
  const mood: Mood = t >= CHEER ? 'glad' : t >= LOOK ? 'look' : t >= TIRED ? 'tired' : 'cheer'

  // うで: あるくときは 足と ぎゃくに ふる(つかれると ふりが 小さく)。
  // とまると だらんと下げ、手を ひたいに かざし、さいごは こぶしを ま上へ
  const amp = 28 - tired * 12
  const swing = stride * amp
  const hang: ArmPose = { swing: 4, bend: 8 }
  const salute = span(t, LOOK, LOOK + 0.45, easeInOut)
  const fist = span(t, CHEER - 0.05, CHEER + 0.3, backOut)
  const walking: ArmPose = { swing, bend: 16 }
  const nearBase: ArmPose = t < STOP ? walking : { swing: hang.swing + (110 - hang.swing) * salute, bend: hang.bend + (60 - hang.bend) * salute }
  const nearArm: ArmPose = t >= CHEER - 0.05 ? { swing: 110 + 55 * fist, bend: 60 - 50 * fist } : nearBase
  const farArm: ArmPose = t < STOP ? { swing: -swing, bend: 16 } : hang
  const headTilt = t < TIRED ? 0 : t < LOOK ? 6 * tired : mix(t, LOOK, LOOK + 0.4, 6, -7) + (t >= CHEER ? 5 * fist : 0)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <FarHill t={t} />
        <Ground t={t} />
        <Bird t={t} />
        <Layer opacity={span(t, START - 0.1, START + 0.15)}>
          <ellipse cx={kidX} cy={feetY + 0.4} rx={8 * KID_SCALE + 3} ry="1.8" fill="#000000" opacity="0.12" />
          <Layer x={kidX} y={feetY + bob - hop} rotate={lean} scale={KID_SCALE}>
            <Kid step={stride} mood={mood} nearArm={nearArm} farArm={farArm} headTilt={headTilt} />
            <Sweat t={t} />
            <Sigh t={t} />
          </Layer>
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
    { at: 0, label: '長い みちが ある。子どもが おうちを 出る', sound: 'pop' },
    { at: START + 1, label: 'げんきに あるく。木が うしろへ ながれる' },
    { at: TIRED, label: 'ずっと あるいて、あせ が 出て つかれてくる' },
    { at: STOP, label: 'とまって「ふう」', sound: 'pop' },
    { at: LOOK, label: '手を かざして とおくの おうちを 見る。まだ とおい' },
    { at: CHEER, label: '「よし!」また あるくぞ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '遠 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
