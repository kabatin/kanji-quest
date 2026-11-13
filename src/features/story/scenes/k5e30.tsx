/*
 * 帰(かえる): ほうきの ある 家へ、あるいて 帰る。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)    … 子どもの たれた うで(かた から ひじ を通って 手まで)
 *   2画目(丨ノ)  … 子どもの どう と、うしろへ ひいた あし
 *   3画目(𠃍)    … 家の いちばん上の まど(わく)
 *   4・5画目     … まどの まんなかの さん と、したの でっぱり
 *   6画目        … ほうきの 上の ところ(にぎる ぶぶん)
 *   7画目        … ドアの 上に ついた ひさし(ひよけ)
 *   8画目        … ほうきの え(まっすぐ立てかけた ぼう)
 *   9画目(𠃍)    … ドアの ガラスの わく
 *   10画目(丨)   … ドアの まんなか(りょうびらき の さかい)
 *
 * ながれ
 *   夕ぐれ。家が たつ → かばんを せおった 子どもが つかれて とぼとぼ あるいてくる(あせ・うつむき)
 *   → まどに あかりが ぽっと ついて、子どもが「!」と 顔を上げる(かえる家 だと 気づく)
 *   → うれしくて かけだす。鳥も 屋根へ かえってくる
 *   → 家の前に ついて、ドアが ひらき、手を ふって「ただいま」(ハートが ぽん)
 *   → ほね が ひかって、絵が うすくなり、字「帰」が のこる
 *
 * 子どもは、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく、あたま は どう の まんなか の上。
 *   字の形になるのは、家の前に ついて 立ち止まった さいごの しゅんかん(うで は 下に たれる)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '帰'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#4f9be0'
const TUNIC_DARK = '#3c82c4'
const TUNIC_FAR = '#33709f'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const BAG = '#e8534a'
const BAG_DARK = '#c43f38'
const WALL = '#f6dfbd'
const WALL_SHADE = '#e8c99c'
const ROOF = '#c8574a'
const ROOF_DARK = '#a8443a'
const DOOR = '#b5764a'
const DOOR_DARK = '#8f5a36'
const FRAME = '#ffffff'
const GLASS_DIM = '#9fb3c8'
const GLASS_WARM = '#ffe38a'
const WARM = '#ffd24a'
const BARK = '#8c5b3c'
const STRAW = '#e6bd4f'
const STRAW_DARK = '#c29a33'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ff9e4a'

/** くぎり の時間(秒) */
const WALK = 0.6
/** あかりが ついて、足を止める */
const STOP = 3.2
const LAMP = 3.4
const HURRY = 4.2
const ARRIVE = 5.3
/** 手を ふりおわる(うで を おろす) */
const WAVE_END = 6.15
const INK = 6.4
const DONE = 9.5
const DURATION = 10

/** 子どもの 足もと・かた(うでの じく)。体の まんなか は x = 27.5 */
const FEET: readonly [number, number] = [27.5, 94]
const SHOULDER: readonly [number, number] = [27.2, 40]
/** うで の ひじまで・ひじから 手 までの長さ(たらすと 手が 1画目の おわり あたり) */
const ARM_PART = 11
const NECK: readonly [number, number] = [28, 35]
/** あるくとき、子どもが よこへ 進む 道のり(まえ) */
const START_X = -40
const TIRED_X = -14

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  // 夕日: ゆっくり しずんでいく
  const sink = mix(t, 0, DONE, 0, 5, easeInOut)
  return (
    <>
      <rect x="0" y="0" width="109" height="109" fill="#fff0dc" opacity={0.7 * sun} />
      <Layer opacity={sun} rotate={t * 10} origin={[13, 14 + sink]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y={2.6 + sink} width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 ${14 + sink})`} />
        ))}
      </Layer>
      <circle cx="13" cy={14 + sink} r={6.2 * sun} fill={SUN} />
      {/* とおくの おか(おくゆき) */}
      <path d="M-4 99 Q18 78 40 92 Q62 76 113 94 V101 H-4 Z" fill="#e8dcc0" />
      <ellipse cx="54.5" cy="98" rx="54" ry="5.6" fill={GRASS} />
      {[6, 30, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 家(ほそ長い 小さな 家)。まど・ひさし・ドア。 */
function House({ t }: SceneProps) {
  const rise = span(t, 0, 0.8, backOut)
  const lamp = span(t, LAMP, LAMP + 0.5, easeOut)
  // ドア: 家に ついた ころ、りょうびらき に ひらく
  const open = span(t, ARRIVE - 0.1, ARRIVE + 0.5, easeOut)
  const leaf = Math.max(0.25, 1 - 0.75 * open)
  const glass = lamp > 0.5 ? GLASS_WARM : GLASS_DIM
  return (
    <>
      <ellipse cx="66" cy="97.6" rx={30 * rise} ry="2.8" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.7 + 0.3 * rise} scaleY={rise} origin={[66, 97]}>
        {/* かべ と 屋根 */}
        <rect x="40" y="9" width="52" height="88" fill={WALL} />
        <rect x="84" y="9" width="8" height="88" fill={WALL_SHADE} />
        <path d="M35 11 L66 0.5 L97 11 Z" fill={ROOF} />
        <path d="M66 0.5 L97 11 L88 11 Z" fill={ROOF_DARK} />
        {/* 上の まど: あかりが つくと あたたかい色に */}
        <rect x="45" y="14" width="35" height="24" rx="2" fill={FRAME} />
        <rect x="47" y="16" width="31" height="9" fill={glass} />
        <rect x="47" y="27.5" width="31" height="8" fill={glass} />
        <circle cx="62.5" cy="26" r={24 * lamp} fill={WARM} opacity={0.22 * lamp} />
        {/* ひさし(ドアの 上) */}
        <path d="M41 46 H87 L90 54 H38 Z" fill={BAG} />
        <path d="M38 54 H90 V56 H38 Z" fill={BAG_DARK} />
        {Array.from({ length: 5 }, (_, i) => (
          <path key={i} d={`M${46 + i * 9} 46 l-2 8 h4 l2 -8 Z`} fill={FRAME} opacity="0.85" />
        ))}
        {/* ドアの なか: ひらくと あたたかい あかりが もれる */}
        <rect x="48" y="56" width="33" height="41" fill={GLASS_WARM} opacity={open} />
        {/* ドア(左びらき・右びらき) */}
        <Layer scaleX={leaf} origin={[48, 76]}>
          <rect x="48" y="56" width="15.5" height="41" fill={DOOR} />
          <rect x="51" y="59" width="10" height="17" rx="1.5" fill={glass} />
          <circle cx="60.6" cy="84" r="1.1" fill={WARM} />
        </Layer>
        <Layer scaleX={leaf} origin={[81, 76]}>
          <rect x="63.5" y="56" width="17.5" height="41" fill={DOOR_DARK} />
          <rect x="66" y="59" width="12" height="17" rx="1.5" fill={glass} />
          <circle cx="65.4" cy="84" r="1.1" fill={WARM} />
        </Layer>
      </Layer>
    </>
  )
}

/** ドアの よこに たてかけた ほうき(わらの はき先 が 下) */
function Broom({ t }: SceneProps) {
  const rise = span(t, 0.3, 0.9, backOut)
  // 子どもが 来ると、ちょっと ゆれて むかえる
  const nod = Math.sin(span(t, ARRIVE, ARRIVE + 0.6) * Math.PI * 2) * 2.4
  return (
    <Layer scale={rise} rotate={-2 + nod} origin={[44, 97]}>
      <path d="M43.2 48 L44.6 84" fill="none" stroke={BARK} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M41.6 82 H47.6 L51 97 H37.6 Z" fill={STRAW} />
      <path d="M44.6 82 L44 97 M41.2 84 L38.6 97 M48 84 L50 97" fill="none" stroke={STRAW_DARK} strokeWidth="0.9" strokeLinecap="round" />
      <rect x="41.4" y="82.4" width="6.4" height="2.2" rx="1" fill={BAG_DARK} />
    </Layer>
  )
}

type Mood = 'tired' | 'surprised' | 'happy'

/** うで の かっこう。swing = ま下から まえへ ふった角度 / bend = ひじ の まがり(まえへ) */
type ArmPose = { readonly swing: number; readonly bend: number }

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。 */
function Arm({ pose, color }: { readonly pose: ArmPose; readonly color: string }) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  // 体は 左むき(あとで ひっくり返す)。まえ = 左(x が へる ほう)
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

function Face({ mood }: { readonly mood: Mood }) {
  if (mood === 'tired') {
    return (
      <>
        <path d="M23.6 23.8 l3 1.2" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="25.4" cy="25.8" r="1.15" fill="#2b2b2b" />
        <path d="M23.4 30.8 Q24.8 29.4 26.6 30.6" fill="none" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
      </>
    )
  }
  if (mood === 'surprised') {
    return (
      <>
        <circle cx="25.4" cy="25" r="1.9" fill="#ffffff" stroke="#2b2b2b" strokeWidth="0.6" />
        <circle cx="25.1" cy="25" r="1.1" fill="#2b2b2b" />
        <ellipse cx="24.6" cy="30.2" rx="1.4" ry="1.9" fill="#b9483f" />
      </>
    )
  }
  return (
    <>
      <path d="M23.6 25.8 Q25.4 23.2 27.2 25.8" fill="none" stroke="#2b2b2b" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M22.8 29 Q25 33.2 27.6 29.4 Z" fill="#b9483f" />
    </>
  )
}

type PersonProps = {
  readonly step: number
  readonly mood: Mood
  /** てまえの うで・むこうの うで */
  readonly nearArm: ArmPose
  readonly farArm: ArmPose
  readonly headTilt: number
}

/** 左むきで 描いて、使うときに ひっくり返して 右(家のほう)をむかせる */
function Person({ step, mood, nearArm, farArm, headTilt }: PersonProps) {
  return (
    <>
      <Arm pose={farArm} color={TUNIC_FAR} />
      <Layer rotate={step * 20} origin={[30, 66]}>
        <rect x="27.2" y="63" width="6.2" height="29.5" rx="3.1" fill={PANTS_DARK} />
        <ellipse cx="28.6" cy="93.4" rx="5.2" ry="2.8" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 20} origin={[25, 66]}>
        <rect x="21.6" y="63" width="6.2" height="29.5" rx="3.1" fill={PANTS} />
        <ellipse cx="23" cy="93.4" rx="5.2" ry="2.8" fill={SHOE} />
      </Layer>
      {/* せおった かばん(せなか = 左むきの ときの 右がわ) */}
      <rect x="32.6" y="38" width="8" height="20" rx="3.4" fill={BAG} />
      <rect x="32.6" y="49" width="8" height="3" fill={BAG_DARK} />
      <rect x="24.8" y="32" width="5.2" height="8" rx="2.4" fill={SKIN_SHADE} />
      <rect x="20.4" y="36.6" width="14" height="30" rx="6.8" fill={TUNIC} />
      <path d="M22.4 58 h10" stroke={TUNIC_DARK} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M30 37.6 Q34 43 33.4 52" fill="none" stroke={BAG_DARK} strokeWidth="1.4" strokeLinecap="round" />
      <Arm pose={nearArm} color={TUNIC_DARK} />
      <Layer rotate={headTilt} origin={NECK}>
        <g transform="translate(-1.4 0.6)">
          <circle cx="30.2" cy="24.6" r="9.2" fill={SKIN} />
          <path d="M21.5 23 C21.4 13.8 31.8 11.2 37.8 17 C40.2 20.2 40.2 26 38.2 30.2 C37.6 24.4 33.4 20.2 26.6 20.6 C24.4 20.8 22.6 21.8 21.5 23 Z" fill={HAIR} />
          <circle cx="26.5" cy="28.8" r="2.1" fill="#ff9d9d" opacity="0.55" />
          <Face mood={mood} />
        </g>
      </Layer>
    </>
  )
}

/** つかれて あるく 間の あせ。うしろへ とぶ。 */
function Sweat({ t, x }: { readonly t: number; readonly x: number }) {
  const show = during(t, WALK + 0.3, STOP, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.45].map((offset) => {
        const p = ((t + offset) % 0.9) / 0.9
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" transform={`translate(${x + 14 - p * 9} ${17 + p * 7 - Math.sin(p * Math.PI) * 5}) rotate(35)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** 気づいた「!」(まどに あかりが ついた しゅんかん) */
function Notice({ t, x }: { readonly t: number; readonly x: number }) {
  const show = during(t, STOP + 0.05, STOP + 1.0, 0.15)
  if (show <= 0) return null
  const pop = span(t, STOP + 0.05, STOP + 0.4, backOut)
  return (
    <Layer x={x + 38} y={7} scale={Math.max(0, pop)} opacity={show} origin={[0, 0]}>
      <rect x="-1.2" y="-5.4" width="2.4" height="5.6" rx="1.2" fill={BAG} />
      <circle cx="0" cy="2.6" r="1.3" fill={BAG} />
    </Layer>
  )
}

/** ただいま の ハート */
function Heart({ t, x }: { readonly t: number; readonly x: number }) {
  const show = during(t, ARRIVE + 0.35, INK - 0.05, 0.2)
  if (show <= 0) return null
  const p = span(t, ARRIVE + 0.35, INK - 0.05)
  const pop = Math.max(0, span(t, ARRIVE + 0.35, ARRIVE + 0.7, backOut))
  return (
    <Layer x={x + 35} y={9 - p * 4} scale={pop * (1 + wave(t, 0.5) * 0.08)} opacity={show}>
      <path d="M0 3.2 C-5.4 -1.4 -3.4 -5 0 -2.4 C3.4 -5 5.4 -1.4 0 3.2 Z" fill="#f0627f" />
    </Layer>
  )
}

/** 鳥も 屋根へ かえってくる。屋根の 右の ななめ に とまる。 */
function Bird({ t }: SceneProps) {
  const p = span(t, 1.0, 3.2, easeInOut)
  if (p <= 0) return null
  const x = -8 + p * 92
  const y = 18 - p * 15.3 - Math.sin(p * Math.PI) * 5
  const landed = p >= 1
  const flap = landed ? 0 : wave(t, 0.16) * 30
  return (
    <Layer x={x} y={y}>
      <path d="M-2.6 0.4 l-4.6 -1.6 l3.4 3.2 Z" fill="#3a3f4d" />
      <ellipse cx="0" cy="0" rx="4" ry="3.1" fill="#4a5164" />
      <circle cx="3" cy="-2.3" r="2.3" fill="#4a5164" />
      <path d="M5 -2.4 l2.4 0.7 l-2.3 0.9 Z" fill="#f2b632" />
      <circle cx="3.6" cy="-2.8" r="0.55" fill="#ffffff" />
      <Layer rotate={flap} origin={[-0.4, -0.6]}>
        <path d="M1.2 -0.8 Q-1.6 -3.8 -4 -0.6 Q-1.6 0.8 1.2 -0.8 Z" fill="#3a3f4d" />
      </Layer>
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 10)

  // 子どもの よこの いち: つかれて あるく → あかりに 気づいて 止まる → かけだす → 家の 前
  const slow = mix(t, WALK, STOP, START_X, TIRED_X, (x) => x)
  const fast = mix(t, HURRY, ARRIVE, TIRED_X, 0, easeInOut)
  const walkX = t < HURRY ? slow : fast
  // 足は、進んだ 道のり に 合わせて ふる(止まると ぴたっと止まる)
  const dist = walkX - START_X
  const walking1 = span(t, WALK, WALK + 0.2) * (1 - span(t, STOP - 0.3, STOP))
  const walking2 = span(t, HURRY, HURRY + 0.2) * (1 - span(t, ARRIVE - 0.3, ARRIVE))
  const amp = walking1 * 0.55 + walking2 * 1.0
  const stride = Math.sin((dist / 8) * Math.PI * 2) * amp
  const bob = -Math.abs(stride) * (walking2 > 0 ? 2.2 : 0.8)

  const mood: Mood = t < STOP ? 'tired' : t < STOP + 1.0 ? 'surprised' : 'happy'
  // からだの かたむき: つかれて 前かがみ → かけだして まえのめり → ついて まっすぐ
  const lean = t < STOP ? 4 : t < HURRY ? 4 * (1 - span(t, STOP, STOP + 0.4)) : 7 * (1 - span(t, ARRIVE - 0.4, ARRIVE))
  const headTilt = t < STOP ? -8 : t < HURRY ? 5 : -1

  // うで: あるくとき あしと ぎゃくに ふる。ついたら 手を ふる(かたから 上へ あげて、ひじ から先を ゆらす)
  const wave1 = span(t, ARRIVE + 0.1, ARRIVE + 0.55, easeOut) * (1 - span(t, WAVE_END - 0.35, WAVE_END, easeInOut))
  const swingAmp = t < STOP ? 14 : 38
  const baseNear: ArmPose = { swing: -stride * swingAmp, bend: t < STOP ? 6 : 28 * walking2 }
  const baseFar: ArmPose = { swing: stride * swingAmp, bend: t < STOP ? 6 : 28 * walking2 }
  const nearArm: ArmPose = {
    swing: baseNear.swing * (1 - wave1) + 150 * wave1,
    bend: baseNear.bend * (1 - wave1) + wave(t, 0.4) * 26 * wave1,
  }
  const farArm: ArmPose = baseFar

  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  // 子どもの よこの いち(絵の はしを 出ないよう、かけだしの 先では 切れる)
  const childX = walkX

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <House t={t} />
        <Broom t={t} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <ellipse cx={27.5 + childX} cy="97.4" rx="9" ry="2.4" fill="#000000" opacity="0.12" />
          <Layer x={childX} y={bob} rotate={lean} origin={FEET}>
            <Layer scaleX={-1} origin={[27.5, 60]}>
              <Person step={stride} mood={mood} nearArm={nearArm} farArm={farArm} headTilt={headTilt} />
            </Layer>
          </Layer>
          <Sweat t={t} x={childX} />
          <Notice t={t} x={childX} />
          <Heart t={t} x={childX} />
        </Layer>
        <Bird t={t} />
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
    { at: 0, label: '夕ぐれ。家が たつ', sound: 'pop' },
    { at: WALK, label: 'つかれた子が とぼとぼ あるいてくる' },
    { at: STOP, label: 'まどに あかりが ついて「!」と 気づく', sound: 'pop' },
    { at: HURRY, label: 'うれしくて かけだす。鳥も かえってくる' },
    { at: ARRIVE, label: '家に ついて、ドアが ひらき「ただいま」' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '帰 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
