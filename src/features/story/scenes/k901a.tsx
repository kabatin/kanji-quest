/*
 * 通(とおる): ゆうやけの みちを すすんで、ちょうちんの ともる いえの まえを とおりぬける。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ… ) … いえの やね の ひさし(よこに のびた はり)
 *   2画目(丶)  … ひさし から さがる ちょうちん
 *   3画目(丨)  … いえの 左の はしら
 *   4画目(冂)  … いえの かべ の わく(うえの はり・右の はしら)
 *   5・6画目   … 戸の 2本の よこざん(よこの さん)
 *   7画目(丨)  … 戸の まんなかの はしら
 *   8画目(丶)  … 左うえから とんでくる 小鳥(とぶ むき)
 *   9画目       … おかを くだる うねうね道
 *   10画目      … いえの まえを のびる まっすぐな みち
 *
 * ながれ
 *   ゆうやけ。子どもが おかの上で、日が しずむのを 見て しんぱい(あせ)
 *   → うねうね道を いそいで くだる → 道の とちゅうで 立ちどまると、ちょうちんが ぽっと ともる
 *   → ほっとして えがお。まっすぐな 道を すすんで、いえの まえを とおりぬける
 *   → むこうまで ついて 「ばんざい!」(小鳥も とんでくる)
 *   → ほね が ひかって、絵が うすくなり、字「通」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。あし は こし から。くび は みじかく どう の上。
 *   道は 絵の「みち」として そのまま 字の 10画目と 9画目に 重なる(もともと 道の形)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '通'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#f0705a'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const PACK = '#ffd24a'
const PACK_DARK = '#e0b030'
const GRASS = '#c5e8a9'
const MOUND = '#a8dc86'
const MOUND_LIGHT = '#bfe8a0'
const FAR_HILL = '#e2f2d2'
const ROAD = '#ecd3a2'
const ROAD_EDGE = '#d9b97f'
const WALL = '#d9b98a'
const WALL_LIT = '#ffe9a8'
const WOOD = '#8c5b3c'
const WOOD_DARK = '#70452b'
const ROOF = '#c25b43'
const ROOF_DARK = '#a8472f'
const STEP = '#b8b2a6'
const LAMP_DIM = '#c9b28a'
const LAMP_LIT = '#ffd24a'
const SUN = '#ff9a4a'
const DUSK = '#6b7fb8'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const BIRD = '#5aaee8'
const BIRD_DARK = '#3f8fcb'
const BEAK = '#f2b632'

/** くぎり の時間(秒) */
const WALK_A = 1.4
const PAUSE_A = 3.4
const LAMP = 3.5
const WALK_B = 4.0
const ARRIVE = 6.0
const INK = 6.6
const DONE = 10.0
const DURATION = 10.4

/* ───────── 道すじ(9画目と10画目の 通り道の点) ───────── */

type Pt = readonly [number, number]
/** おかを くだる うねうね道(9画目) */
const TRAIL: readonly Pt[] = [[10.8, 52], [19.3, 50.1], [27.2, 47], [23.5, 55.3], [24.1, 63.5], [29.6, 70.2], [22.1, 75.5], [14.5, 80.8]]
/** まっすぐな みち(10画目)。おか の ふもと から 右へ */
const STREET: readonly Pt[] = [[22.2, 82.6], [33.7, 83.9], [45, 86.5], [56.2, 89.5], [67.5, 92.3], [78.9, 93.8], [90.5, 93.1]]
const PATH: readonly Pt[] = [...TRAIL, ...STREET]
const SEGMENTS = PATH.slice(1).map((p, i) => Math.hypot(p[0] - PATH[i][0], p[1] - PATH[i][1]))
const CUMULATIVE = SEGMENTS.reduce<readonly number[]>((acc, len) => [...acc, acc[acc.length - 1] + len], [0])
const TOTAL = CUMULATIVE[CUMULATIVE.length - 1]
/** おかを くだりきった ところ(道の きりかえ) */
const HILL_END = CUMULATIVE[TRAIL.length - 1]
/** 立ちどまる ところ: ふもと から 少し すすんだ 道の上 */
const PAUSE_AT = HILL_END + 7

/** 道すじの上で、はじめから s だけ すすんだ 場所 */
function pointAt(s: number): Pt {
  const d = Math.min(Math.max(s, 0), TOTAL)
  const i = Math.min(CUMULATIVE.filter((c) => c <= d).length - 1, SEGMENTS.length - 1)
  const f = (d - CUMULATIVE[i]) / SEGMENTS[i]
  return [PATH[i][0] + (PATH[i + 1][0] - PATH[i][0]) * f, PATH[i][1] + (PATH[i + 1][1] - PATH[i][1]) * f]
}

/* ───────── けしき ───────── */

function Ground({ t }: SceneProps) {
  // はじめから おかと 道は 見えている(いきなり まっ白に しない)
  const appear = 0.35 + 0.65 * span(t, 0, 0.5, easeOut)
  // 日が しずんでいく(しんぱいの わけ)
  const sunY = mix(t, 0, LAMP, 24, 44, easeInOut)
  return (
    <Layer opacity={appear}>
      <circle cx="96" cy={sunY} r="12" fill={SUN} opacity="0.25" />
      <circle cx="96" cy={sunY} r="7.5" fill={SUN} />
      <path d="M-4 80 Q22 62 48 74 Q76 58 113 76 V101 H-4 Z" fill={FAR_HILL} />
      <rect x="-2" y="76" width="113" height="34" fill={GRASS} />
      {[3, 91, 103].map((x) => (
        <path key={x} d={`M${x} 82 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill="#55b86e" />
      ))}
      {/* おか(うねうね道の うしろ) */}
      <path d="M-2 109 V56 Q8 44 24 42 Q36 44 40 62 Q44 76 52 84 L52 109 Z" fill={MOUND} />
      <path d="M-2 62 V56 Q8 44 24 42 Q16 46 8 54 Q2 58 -2 62 Z" fill={MOUND_LIGHT} />
      {/* 道: ふち の こい色を 下に、道の色を 上に */}
      <Bone char={CHAR} n={9} color={ROAD_EDGE} width={5.2} />
      <Bone char={CHAR} n={10} color={ROAD_EDGE} width={8.2} />
      <Bone char={CHAR} n={9} color={ROAD} width={3.4} />
      <Bone char={CHAR} n={10} color={ROAD} width={6.2} />
    </Layer>
  )
}

/** いえ: やね・かべ・格子の戸・ちょうちん */
function House({ t }: SceneProps) {
  const grow = span(t, 0.1, 0.9, backOut)
  const lamp = span(t, LAMP, LAMP + 0.4, easeOut)
  const pop = Math.max(0, backOut(span(t, LAMP, LAMP + 0.5)))
  const sway = wave(t, 2.6) * 2.5
  return (
    <Layer scaleY={Math.max(grow, 0)} scaleX={0.8 + 0.2 * Math.min(grow, 1)} origin={[62.5, 77]}>
      {/* かべ(やね の下から 土間まで) */}
      <rect x="45" y="15" width="36.8" height="62" fill={WALL} />
      <rect x="45" y="15" width="36.8" height="62" fill={WALL_LIT} opacity={lamp * 0.55} />
      <rect x="41" y="76.5" width="45" height="4" rx="1.2" fill={STEP} />
      {/* やね: したの へり が 1画目の ひさし */}
      <path d="M38.5 18 L46 5 Q58 2 69 2.6 L77.5 14 Z" fill={ROOF} />
      <path d="M46 5 Q58 2 69 2.6 L70.6 5.2 Q58 4.6 47.6 7.6 Z" fill={ROOF_DARK} />
      <Bone char={CHAR} n={1} color={WOOD_DARK} width={5} to={0.62} />
      {/* かべの わく と 格子の戸 */}
      <Bone char={CHAR} n={4} color={WOOD} width={3.4} to={0.88} />
      <Bone char={CHAR} n={5} color={WOOD} width={2.6} />
      <Bone char={CHAR} n={6} color={WOOD} width={2.6} />
      <Bone char={CHAR} n={3} color={WOOD_DARK} width={3.4} />
      <Bone char={CHAR} n={7} color={WOOD_DARK} width={2.6} />
      {/* ちょうちん: ひさし から さがって、ともると ぽっと ひかる(2画目) */}
      <Layer rotate={sway} origin={[58.5, 17]}>
        <path d="M58.5 16.4 V23.4" stroke={WOOD_DARK} strokeWidth="0.9" strokeLinecap="round" />
        <circle cx="58.5" cy="27.4" r={6.5 + 5 * pop} fill={LAMP_LIT} opacity={0.3 * lamp} />
        <rect x="55.6" y="22.8" width="5.8" height="1.6" rx="0.8" fill={WOOD_DARK} />
        <ellipse cx="58.5" cy="27.6" rx="3.5" ry="4.2" fill={LAMP_DIM} />
        <ellipse cx="58.5" cy="27.6" rx="3.5" ry="4.2" fill={LAMP_LIT} opacity={lamp} />
        <path d="M55.5 27.6 H61.5" stroke={WOOD_DARK} strokeWidth="0.5" opacity="0.5" />
        <rect x="56" y="31.2" width="5" height="1.4" rx="0.7" fill={WOOD_DARK} />
      </Layer>
    </Layer>
  )
}

/** ゆうぐれの くらさ。ちょうちん が ともると、少し あかるくなる */
function Dusk({ t }: SceneProps) {
  const dim = t < LAMP ? mix(t, 0, LAMP, 0.08, 0.3) : mix(t, LAMP, LAMP + 1, 0.3, 0.1)
  return <rect x="0" y="0" width="109" height="109" fill={DUSK} opacity={dim} />
}

/* ───────── 主役: 子ども(右むき。足もとが 原点) ───────── */

type Mood = 'worried' | 'happy' | 'cheer'
type ArmPose = { readonly swing: number; readonly bend: number }

const SHOULDER: Pt = [0, -20.4]
/** うで の 2つの ふし の長さ(かた→ひじ、ひじ→手) */
const ARM_PART = 5.2
const HIP_Y = -11

/** かた から出て、ひじ で まがる うで。swing = ま下から まえへ ふった角度 */
function Arm({ pose, color }: { readonly pose: ArmPose; readonly color: string }) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const elbow = [SHOULDER[0] + Math.sin(rad(pose.swing)) * ARM_PART, SHOULDER[1] + Math.cos(rad(pose.swing)) * ARM_PART] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] + Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART] as const
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.1" fill={SKIN} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="1.6" cy="-26.8" r="1.5" fill={CHEEK} opacity="0.55" />
      {mood === 'worried' && (
        <>
          <path d="M1.4 -32 L4.6 -30.6" stroke={HAIR} strokeWidth="0.8" strokeLinecap="round" />
          <circle cx="3" cy="-28.9" r="0.95" fill={EYE} />
          <path d="M1.8 -25.4 Q3.2 -26.8 4.8 -25.4" fill="none" stroke={MOUTH} strokeWidth="0.8" strokeLinecap="round" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <circle cx="3" cy="-28.9" r="0.95" fill={EYE} />
          <path d="M1.8 -26.2 Q3.3 -24.4 4.9 -26.2" fill="none" stroke={MOUTH} strokeWidth="0.9" strokeLinecap="round" />
        </>
      )}
      {mood === 'cheer' && (
        <>
          <path d="M1.8 -28.6 Q3 -30.2 4.2 -28.6" fill="none" stroke={EYE} strokeWidth="0.9" strokeLinecap="round" />
          <ellipse cx="3.4" cy="-25.6" rx="1.5" ry="1.6" fill={MOUTH} />
        </>
      )}
    </>
  )
}

type ChildProps = {
  /** あし の ふり(+ で てまえの足が まえ) */
  readonly stride: number
  readonly mood: Mood
  readonly headTilt: number
  /** 手を あげる 度合い(0〜1) */
  readonly cheer: number
  readonly sweat: number
}

function Child({ stride, mood, headTilt, cheer, sweat }: ChildProps) {
  // ばんざい: うで を まえへ あげ、ひじ を まげて 手を 顔の まえに もちあげる(顔に かくれない)
  const nearArm: ArmPose = { swing: -stride * 26 + (95 + stride * 26) * cheer, bend: 20 + 40 * cheer }
  const farArm: ArmPose = { swing: stride * 26 + (70 - stride * 26) * cheer, bend: 20 + 70 * cheer }
  return (
    <>
      <Arm pose={farArm} color={SHIRT} />
      {/* せおった ランドセル(せなか=左がわ) */}
      <rect x="-8.2" y="-21" width="5" height="10.4" rx="2" fill={PACK} />
      <path d="M-8.2 -14.6 H-3.2 V-13.4 Q-3.2 -10.6 -5.6 -10.6 Q-8.2 -10.6 -8.2 -13.4 Z" fill={PACK_DARK} />
      {/* あし(こし から ふる) */}
      <Layer rotate={stride * 26} origin={[0, HIP_Y]}>
        <rect x="-1.7" y="-11" width="3.4" height="10" rx="1.7" fill={PANTS_DARK} />
        <ellipse cx="1" cy="-1.1" rx="3" ry="1.7" fill={SHOE} />
      </Layer>
      <Layer rotate={-stride * 26} origin={[0, HIP_Y]}>
        <rect x="-1.7" y="-11" width="3.4" height="10" rx="1.7" fill={PANTS} />
        <ellipse cx="1" cy="-1.1" rx="3" ry="1.7" fill={SHOE} />
      </Layer>
      {/* くび(みじかく)と どう */}
      <rect x="-1.4" y="-25" width="2.8" height="4.4" rx="1.2" fill={SKIN_SHADE} />
      <rect x="-4" y="-22.4" width="8" height="12.2" rx="3.2" fill={SHIRT} />
      <Arm pose={nearArm} color="#d95a45" />
      {/* あたま */}
      <Layer rotate={headTilt} origin={[0, -24]}>
        <circle cx="0.4" cy="-28.6" r="5.4" fill={SKIN} />
        <path d="M-5 -28.6 C-5.6 -35.6 4 -37 5.6 -31 C3.6 -33 -0.4 -32.8 -2.6 -30.4 C-3.6 -29.4 -4.4 -28.8 -5 -28.6 Z" fill={HAIR} />
        <path d="M-0.4 -34.2 Q-0.6 -37.4 1.6 -35.8" fill="none" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
        <Face mood={mood} />
        {sweat > 0 && <path d="M-3.4 -34.4 Q-2.2 -32.4 -3.4 -31.4 Q-4.6 -32.4 -3.4 -34.4 Z" fill="#7cc4f2" opacity={sweat} />}
      </Layer>
    </>
  )
}

/* ───────── にぎやかし: 小鳥(8画目の とぶ むき) ───────── */

function Bird({ t }: SceneProps) {
  const p = span(t, 4.8, INK - 0.1, easeOut)
  if (p <= 0) return null
  // 左うえから、右したへ(8画目と おなじ むき)
  const x = -6 + p * 31
  const y = 10 + p * 15.5
  const flap = wave(t, 0.18) * 30
  return (
    <Layer x={x} y={y} rotate={27}>
      <path d="M-2.8 0.2 l-4.4 -1.6 l3.2 3 Z" fill={BIRD_DARK} />
      <ellipse cx="0" cy="0" rx="4" ry="3" fill={BIRD} />
      <circle cx="3" cy="-1.6" r="2.3" fill={BIRD} />
      <path d="M5 -1.9 l2.4 0.7 l-2.3 0.9 Z" fill={BEAK} />
      <circle cx="3.6" cy="-2.2" r="0.55" fill={EYE} />
      <Layer rotate={flap} origin={[-0.4, -0.8]}>
        <path d="M1.2 -0.8 Q-1.6 -4.2 -4.4 -0.8 Q-1.6 0.8 1.2 -0.8 Z" fill={BIRD_DARK} />
      </Layer>
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 10)

  // あるく: おか → 立ちどまる → いえの まえ → むこうの はし
  const s = PAUSE_AT * span(t, WALK_A, PAUSE_A) + (TOTAL - PAUSE_AT) * span(t, WALK_B, ARRIVE)
  const [px, py] = pointAt(s)
  const heading = (pointAt(s + 3)[0] - pointAt(s - 3)[0]) / 3
  const facing = Math.min(Math.max(heading * 1.5, -1), 1) || 1
  const moving = Math.max(during(t, WALK_A, PAUSE_A, 0.2), during(t, WALK_B, ARRIVE, 0.2))
  const stride = Math.sin((s / 16) * Math.PI * 2) * moving
  const bob = -Math.abs(stride) * 1.2
  const cheer = span(t, ARRIVE, ARRIVE + 0.3, easeOut)
  const hop = t >= ARRIVE ? Math.abs(wave(t - ARRIVE, 0.6)) * 3 : 0

  const mood: Mood = t < LAMP ? 'worried' : t < ARRIVE ? 'happy' : 'cheer'
  // うつむく → ちょうちんを 見上げる → まえを むく → ばんざい
  const lookUp = during(t, PAUSE_A - 0.1, WALK_B + 0.2, 0.3)
  const headTilt = t < WALK_A ? wave(t, 1.2) * 4 : 2 - lookUp * 14 - cheer * 6
  const sweat = t < LAMP ? during(t, 0.7, LAMP, 0.2) * (0.6 + 0.4 * Math.abs(wave(t, 0.7))) : 0
  const appear = span(t, 0.4, 0.8, backOut)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <House t={t} />
        <Dusk t={t} />
        <Layer opacity={span(t, 0.4, 0.6)}>
          <ellipse cx={px} cy={py + 0.6} rx="7" ry="1.8" fill="#000000" opacity="0.14" />
          <Layer x={px} y={py + bob - hop} scale={Math.max(appear, 0) * 1.15} origin={[0, 0]}>
            <Layer scaleX={facing}>
              <Child stride={stride} mood={mood} headTilt={headTilt} cheer={cheer} sweat={sweat} />
            </Layer>
          </Layer>
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
    { at: 0, label: 'ゆうやけ。子どもが おかの上で しんぱい', sound: 'pop' },
    { at: WALK_A, label: 'うねうね道を いそいで くだる' },
    { at: LAMP, label: '立ちどまると ちょうちんが ぽっと ともる', sound: 'pop' },
    { at: WALK_B, label: 'ほっとして、道を すすんで いえの まえを とおる' },
    { at: ARRIVE, label: 'とおりぬけて ばんざい', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '通 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
