/*
 * 京(みやこ): たかい ところに たつ、大きな たてもの。
 *
 * ほね(画と絵の対応)
 *   1画目(丶)  … たてものの てっぺんに のびた かざり(とがった とう)
 *   2画目(一)  … 大きな 屋根の ひさし(ふちの ライン)
 *   3画目(丨)  … 大きな まどの 左のわく
 *   4画目(𠃍)  … 大きな まどの 上のわく と 右のわく
 *   5画目(一)  … 大きな まどの したのわく
 *   6画目(亅)  … ゆかを ささえる まんなかの はしら(足もとは 石の上)
 *   7・8画目   … 左右に ふんばる ななめの はしら(たかい ゆかを ささえる)
 *
 * ながれ
 *   きりが たちこめて、なにも 見えない
 *   → つかれた子が みちを あるいてきて、手を おでこに あてて「どこだろう」ときょろきょろ
 *   → 風が ふいて、きりが はれていく
 *   → 大きな たてもの が あらわれる。子は びっくり、まどに あかりが ともって 大よろこびで ぴょんぴょん はねる
 *   → ほね が ひかって、絵が うすくなり、字「京」が のこる
 *
 * 人と たてものは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   子の うで は かた から出て ひじ で まがる。手を おでこに あてるときも、ひじ が まがる。
 *   たてもの は、たかい ゆかを ななめの はしらで ささえる つくり。
 *   きり は ふくらんだ かたまり が、風で ちらばって うすくなる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '京'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#4f9be0'
const TUNIC_DARK = '#3c82c4'
const TUNIC_FAR = '#33709f'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const PACK = '#e8934a'
const PACK_DARK = '#c97a38'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const BARK = '#8c5b3c'
const WALL = '#f3e2c0'
const ROOF = '#c4533f'
const ROOF_LIGHT = '#dc7058'
const ROOF_EDGE = '#8f3a2e'
const GOLD = '#e0a830'
const NIGHT = '#3d3a58'
const LAMP = '#ffdc8a'
const FLOOR = '#b8814f'
const FLOOR_DARK = '#8f5f38'
const STONE = '#b9b4aa'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const ROAD = '#ead3a4'
const SUN = '#ffd24a'
const FOG_MAIN = '#eef2f7'
const FOG_SHADE = '#d3dce8'

/** くぎり の時間(秒) */
const WALK = 0.5
/** 子が たちどまって、きょろきょろ しはじめる */
const ARRIVE = 2.1
/** 風が ふいて、きりが はれはじめる */
const CLEAR = 3.0
/** きりが はれて、たてものが 見える */
const SEE = 4.6
/** よろこんで はねる */
const CHEER = 5.2
const INK = 6.3
const DONE = 9.2
const DURATION = 9.8

/** 子が たちどまる場所(足もとの x)と、地面の y */
const STAND_X = 99
const GROUND_Y = 97
/** 子の 大きさ(たてものが 大きく見えるように、小さめ) */
const CHILD_SCALE = 0.95

/* ───────── ばしょ ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.5, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[12, 12]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="11.2" y="1.2" width="1.6" height="3.6" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 12 12)`} />
        ))}
      </Layer>
      <circle cx="12" cy="12" r={5.4 * sun} fill={SUN} />
      {/* とおくの おか(おくゆき を出す) */}
      <path d="M-4 96 Q18 78 44 90 Q72 72 113 92 V101 H-4 Z" fill="#e2f2d2" />
      <ellipse cx="54.5" cy="100" rx="60" ry="9" fill={GRASS} />
      {/* たてものへ つづく みち。子は ここを あるいてくる */}
      <path d="M44 94.4 Q70 93 112 96.6 L112 100.6 Q72 98 40 97 Z" fill={ROAD} />
      {[6, 30, 78, 104].map((x) => (
        <path key={x} d={`M${x} 99 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/* ───────── たかい たてもの ───────── */

function Building({ t }: SceneProps) {
  // まどの あかり: きりが はれて 見えたころ、ぽっと ともる
  const lamp = span(t, CLEAR + 1.2, SEE + 0.5)
  return (
    <>
      {/* かべ: 屋根の ひさしの 下に かくれる */}
      <rect x="23" y="26" width="62" height="38" rx="2" fill={WALL} />
      {/* まど: 中は くらい → あかりが つく */}
      <path d="M33.2 42.6 L73.4 38.4 L70.8 56.4 L36.4 60.2 Z" fill={NIGHT} />
      <path d="M33.2 42.6 L73.4 38.4 L70.8 56.4 L36.4 60.2 Z" fill={LAMP} opacity={lamp} />
      {/* 3・4・5画目: まどの わく */}
      <Bone char={CHAR} n={3} color={BARK} width={3.2} />
      <Bone char={CHAR} n={4} color={BARK} width={3.2} />
      <Bone char={CHAR} n={5} color={BARK} width={3.2} />
      {/* たかい ゆか: ななめの はしら と まんなかの はしら が ささえる */}
      <Bone char={CHAR} n={7} color={BARK} width={4.4} />
      <Bone char={CHAR} n={8} color={BARK} width={4.4} />
      <Bone char={CHAR} n={6} color={BARK} width={5.2} to={0.74} />
      <ellipse cx="54.8" cy="93.4" rx="6.6" ry="2" fill={STONE} />
      <ellipse cx="17.8" cy="91.8" rx="4.2" ry="1.8" fill={STONE} />
      <ellipse cx="89.6" cy="91.4" rx="4.2" ry="1.8" fill={STONE} />
      <rect x="19" y="63" width="70" height="9.5" rx="2.2" fill={FLOOR} />
      <rect x="19" y="70" width="70" height="2.5" rx="1.2" fill={FLOOR_DARK} />
      {/* 屋根: 大きく はりだす */}
      <path d="M12 30.5 L38 15.5 L66 13.5 L95 24.5 Z" fill={ROOF} />
      <path d="M38 15.5 L66 13.5 L95 24.5" fill="none" stroke={ROOF_LIGHT} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <Bone char={CHAR} n={2} color={ROOF_EDGE} width={4.2} />
      {/* ひさしの したに ぶらさがる ちょうちん */}
      <circle cx="21" cy="37" r="2.6" fill="#e8534a" />
      <circle cx="84" cy="32.4" r="2.6" fill="#e8534a" />
      {/* 1画目: てっぺんの とがった かざり */}
      <Bone char={CHAR} n={1} color={GOLD} width={3} to={0.32} />
      <circle cx="51.3" cy="10.8" r="2.1" fill={GOLD} />
    </>
  )
}

/* ───────── きり ───────── */

type Puff = { readonly cx: number; readonly cy: number; readonly r: number }
/** 画面ぜんたいを おおう きりの かたまり(たて4だん) */
const FOG: readonly Puff[] = [
  [18, 44, 70, 94],
  [10, 34, 58, 82, 104],
  [18, 42, 66, 90],
  [10, 34, 58, 82, 104],
  [22, 50, 78, 100],
].flatMap((row, rowIndex) => row.map((cx, i) => ({ cx, cy: [14, 34, 56, 78, 92][rowIndex], r: 16 + ((rowIndex * 3 + i) % 3) })))

type PuffState = { readonly x: number; readonly y: number; readonly r: number; readonly o: number }

/** きりの 1つぶ が いま どこに いるか。右がわから 先に、風に ふかれて ちらばって きえる */
function puffState(puff: Puff, i: number, t: number): PuffState {
  const grow = span(t, 0.05 + (i % 7) * 0.05, 0.45 + (i % 7) * 0.05, backOut)
  const delay = ((109 - puff.cx) / 109) * 0.4
  const k = span(t, CLEAR + delay, CLEAR + delay + 1.3, easeInOut)
  return {
    x: puff.cx + (puff.cx - 54) * 1.9 * k - 16 * k,
    y: puff.cy + (puff.cy - 50) * 0.9 * k - 5 * k,
    r: Math.max(0, puff.r * grow * (1 - 0.45 * k)),
    o: 1 - span(k, 0.55, 1),
  }
}

function Fog({ t }: SceneProps) {
  const states = FOG.map((puff, i) => puffState(puff, i, t)).filter((s) => s.o > 0 && s.r > 0)
  if (states.length === 0) return null
  return (
    <>
      {states.map((s, i) => (
        <circle key={`s${i}`} cx={s.x} cy={s.y + 1.8} r={s.r} fill={FOG_SHADE} opacity={s.o} />
      ))}
      {states.map((s, i) => (
        <circle key={`m${i}`} cx={s.x} cy={s.y} r={s.r} fill={FOG_MAIN} opacity={s.o} />
      ))}
    </>
  )
}

/** 風の すじ。右から 左へ ふく(きりが はれるときだけ) */
function WindStreaks({ t }: SceneProps) {
  const wind = during(t, CLEAR - 0.2, CLEAR + 1.7, 0.3)
  if (wind <= 0) return null
  return (
    <>
      {[0, 0.45, 0.9].map((offset, i) => {
        const p = ((t - CLEAR + offset + 2) % 1.4) / 1.4
        return (
          <path
            key={offset}
            d="M0 0 Q5 -2 10 0 T20 0"
            fill="none"
            stroke="#a9bdd6"
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity={Math.sin(p * Math.PI) * wind * 0.9}
            transform={`translate(${108 - p * 70} ${[46, 66, 84][i]})`}
          />
        )
      })}
    </>
  )
}

/* ───────── 子 ───────── */

type Mood = 'worried' | 'surprised' | 'happy'

/** うで の かっこう。swing = ま下から まえへ ふった角度 / bend = ひじ の まがり(まえへ) */
type ArmPose = { readonly swing: number; readonly bend: number }

const blend = (a: ArmPose, b: ArmPose, k: number): ArmPose => ({ swing: a.swing + (b.swing - a.swing) * k, bend: a.bend + (b.bend - a.bend) * k })

/** 子の からだ(足もとが 0,0。左むき)。かた の位置と うで の ぶぶんの 長さ */
const SHOULDER: readonly [number, number] = [0, -18.4]
const ARM_PART = 5.2

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。 */
function Arm({ pose, color }: { readonly pose: ArmPose; readonly color: string }) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const elbow = [SHOULDER[0] - Math.sin(rad(pose.swing)) * ARM_PART, SHOULDER[1] + Math.cos(rad(pose.swing)) * ARM_PART] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] - Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART] as const
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="1.9" fill={SKIN} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <ellipse cx="-2.9" cy="-23.4" rx="1.1" ry="0.8" fill={CHEEK} opacity="0.6" />
      {mood === 'worried' && (
        <>
          <path d="M-4.4 -27.2 L-1.4 -28.2" stroke={HAIR} strokeWidth="0.7" strokeLinecap="round" />
          <circle cx="-2.7" cy="-25.6" r="0.85" fill="#2b2b2b" />
          <path d="M-4.4 -22.2 q0.9 -0.8 1.8 0" fill="none" stroke={MOUTH} strokeWidth="0.7" strokeLinecap="round" />
        </>
      )}
      {mood === 'surprised' && (
        <>
          <path d="M-4.4 -28.2 L-1.4 -28.4" stroke={HAIR} strokeWidth="0.7" strokeLinecap="round" />
          <circle cx="-2.7" cy="-25.6" r="1.25" fill="#2b2b2b" />
          <circle cx="-3.1" cy="-26" r="0.4" fill="#ffffff" />
          <ellipse cx="-3.6" cy="-22.2" rx="0.95" ry="1.25" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M-3.8 -25.2 Q-2.7 -26.7 -1.6 -25.2" fill="none" stroke="#2b2b2b" strokeWidth="0.8" strokeLinecap="round" />
          <path d="M-5 -22.8 Q-3.3 -20.2 -1.4 -22.8 Z" fill={MOUTH} />
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
  readonly tuft: number
  readonly sweat: number
}

function Child({ step, mood, nearArm, farArm, headTilt, tuft, sweat }: ChildProps) {
  return (
    <>
      {/* むこうの うで: 体の うしろ */}
      <Arm pose={farArm} color={TUNIC_FAR} />
      {/* せおった リュック */}
      <rect x="2.8" y="-19.4" width="5.6" height="9.2" rx="2.4" fill={PACK} />
      <path d="M3.4 -14.6 h4.6" stroke={PACK_DARK} strokeWidth="1" strokeLinecap="round" />
      {/* あし: こしから(あるくとき かわりばんこに ふる) */}
      <Layer rotate={step * 20} origin={[0.8, -10]}>
        <rect x="-0.9" y="-10" width="3.4" height="9.6" rx="1.7" fill={PANTS_DARK} />
        <ellipse cx="0" cy="-0.5" rx="3" ry="1.6" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 20} origin={[-0.8, -10]}>
        <rect x="-2.5" y="-10" width="3.4" height="9.6" rx="1.7" fill={PANTS} />
        <ellipse cx="-1.8" cy="-0.5" rx="3" ry="1.6" fill={SHOE} />
      </Layer>
      {/* くび と どう */}
      <rect x="-1.6" y="-22.4" width="3.2" height="4.2" rx="1.4" fill={SKIN_SHADE} />
      <rect x="-4.2" y="-20" width="8.4" height="11" rx="3.6" fill={TUNIC} />
      {/* てまえの うで */}
      <Arm pose={nearArm} color={TUNIC_DARK} />
      {/* あたま */}
      <Layer rotate={headTilt} origin={[0, -21.8]}>
        <circle cx="-0.6" cy="-25.2" r="5.2" fill={SKIN} />
        <path d="M-5.4 -26.3 C-5.6 -31.6 1.4 -32.8 4.4 -29.2 C5.9 -27 5.6 -23.6 4.4 -21.8 C4.1 -25.4 1.6 -27.8 -2 -27.6 C-3.6 -27.5 -4.7 -27 -5.4 -26.3 Z" fill={HAIR} />
        <Layer rotate={tuft} origin={[-0.4, -30.6]}>
          <path d="M-0.4 -30.4 Q-0.3 -33 1.4 -33.4" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
        </Layer>
        <Face mood={mood} />
        {/* あせ: こまって あるいているあいだ、あたまの うしろ へ */}
        <Layer opacity={sweat}>
          <path d="M5.8 -27 Q7 -25 5.8 -23.8 Q4.6 -25 5.8 -27 Z" fill="#7cc4f2" />
        </Layer>
      </Layer>
    </>
  )
}

/* ───────── にぎやかし ───────── */

/** よろこんでいる ときに、空を とおる 小鳥 */
function Bird({ t }: SceneProps) {
  const show = during(t, CHEER - 0.1, CHEER + 1.3, 0.2)
  if (show <= 0) return null
  const p = span(t, CHEER - 0.1, CHEER + 1.3)
  const x = 112 - p * 52
  const y = 8 + Math.sin(p * Math.PI * 2) * 1.6
  const flap = wave(t, 0.16) * 28
  return (
    <Layer x={x} y={y} opacity={show}>
      <path d="M2.6 0.4 l4.6 -1.6 l-3.4 3.2 Z" fill="#e2733f" />
      <ellipse cx="0" cy="0" rx="4" ry="3.1" fill="#ff9a5c" />
      <circle cx="-3" cy="-2.3" r="2.3" fill="#ff9a5c" />
      <path d="M-5 -2.4 l-2.4 0.7 l2.3 0.9 Z" fill="#f2b632" />
      <circle cx="-3.6" cy="-2.8" r="0.55" fill="#2b2b2b" />
      <Layer rotate={flap} origin={[0.4, -0.6]}>
        <path d="M-1.2 -0.8 Q1.6 -3.8 4 -0.6 Q1.6 0.8 -1.2 -0.8 Z" fill="#e2733f" />
      </Layer>
    </Layer>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)

  // あるく: 右から みちを あるいて、たちどまる
  const walking = t < WALK ? 0 : 1 - span(t, ARRIVE - 0.3, ARRIVE)
  const stride = Math.sin((t - WALK) * Math.PI * 2 * 1.9) * walking
  const childX = mix(t, WALK, ARRIVE, 122, STAND_X, easeOut)
  const bob = -Math.abs(stride) * 1.2

  // はねる: よろこびの あいだ だけ。字になる ころには おちつく
  const settle = 1 - span(t, INK + 0.3, INK + 0.9)
  const hop = t < CHEER ? 0 : Math.abs(Math.sin((t - CHEER) * Math.PI * 1.6)) * 5 * settle
  const legs = Math.min(1, hop / 5) * 0.5

  // うで: あるく → おでこに 手を あてて きょろきょろ → びっくり(ひろげる)→ ばんざい
  const walkNear: ArmPose = { swing: stride * 25, bend: 12 }
  const walkFar: ArmPose = { swing: -stride * 25, bend: 12 }
  const hangFar: ArmPose = { swing: 3, bend: 8 }
  const brow: ArmPose = { swing: 100, bend: 70 }
  const open: ArmPose = { swing: 38, bend: 10 }
  const cheer = wave(t, 0.62)
  const hooray: ArmPose = { swing: 150 + cheer * 12, bend: 15 }
  const hoorayFar: ArmPose = { swing: 140 - cheer * 12, bend: 15 }
  const toBrow = span(t, ARRIVE, ARRIVE + 0.4, easeInOut)
  const toOpen = span(t, SEE, SEE + 0.3, easeOut)
  const toCheer = span(t, CHEER, CHEER + 0.3, easeOut)
  const nearArm: ArmPose = t < ARRIVE ? walkNear : t < SEE ? blend(walkNear, brow, toBrow) : t < CHEER ? blend(brow, open, toOpen) : blend(open, hooray, toCheer)
  const farArm: ArmPose = t < ARRIVE ? walkFar : t < SEE ? blend(walkFar, hangFar, toBrow) : t < CHEER ? blend(hangFar, open, toOpen) : blend(open, hoorayFar, toCheer)

  const mood: Mood = t < SEE ? 'worried' : t < CHEER ? 'surprised' : 'happy'
  // あたま: あるくとき うつむき、さがすとき 左右を見まわし、見つけると 上を見あげる
  const look = t < ARRIVE ? -3 + stride * 2 : t < SEE ? wave(t - ARRIVE, 1.3) * 4 : 12 + (t >= CHEER ? wave(t, 0.62) * 3 : 0)
  // 風: かみの けが 左へ なびく
  const wind = during(t, CLEAR - 0.2, CLEAR + 1.7, 0.3)
  const tuft = -wind * 16 + wave(t, 0.3) * 5 * wind
  const sweat = during(t, WALK + 0.6, CLEAR, 0.3)

  // たてものは、きりの うしろ に できあがっている(きりが はれると 見える)
  const buildingShown = span(t, 0.8, 0.82)
  const twinkle = during(t, SEE - 0.1, SEE + 0.9, 0.3)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Layer opacity={buildingShown}>
          <Building t={t} />
        </Layer>
        <Fog t={t} />
        <WindStreaks t={t} />
        <ellipse cx={childX} cy={GROUND_Y + 0.4} rx={5.6 * (1 - hop / 22)} ry="1.6" fill="#000000" opacity="0.12" />
        <Layer x={childX} y={GROUND_Y - hop + bob} scale={CHILD_SCALE}>
          <Child step={stride + legs} mood={mood} nearArm={nearArm} farArm={farArm} headTilt={look} tuft={tuft} sweat={sweat} />
        </Layer>
        <Bird t={t} />
        {twinkle > 0 && <Star cx={51.3} cy={10.8} r={3.6 * twinkle} color="#fff6c0" spin={t * 90} />}
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
    { at: 0, label: 'きりが たちこめて、なにも 見えない', sound: 'pop' },
    { at: WALK, label: 'つかれた子が みちを あるいてくる' },
    { at: ARRIVE, label: '手を おでこに あてて、きょろきょろ' },
    { at: CLEAR, label: '風が ふいて、きりが はれていく', sound: 'pop' },
    { at: SEE, label: '大きな たてものが 見える。まどに あかりが ともる' },
    { at: CHEER, label: '大よろこびで ぴょんぴょん はねる', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '京 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
