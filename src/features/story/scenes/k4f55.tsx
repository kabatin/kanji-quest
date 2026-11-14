/*
 * 何(なに): にもつを かついだ 人が あるいてくる。「それ、なあに?」
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … あたまの はねた かみ から、かた を通って、まえに ふった うで
 *                  (さいごに うで を まえへ ふって あいさつ したときだけ、この線に重なる)
 *   2画目(丨)  … 人の どう と あし
 *   3画目(一)  … にもつを のせた せおいわく の いちばん上の よこ木
 *   4・5・6画目 … わくに しばった 四角い はこ(左がわ・上と右がわ・した)
 *   7画目(亅)  … せおいわく の 右の 長い はしら と、した の ささえ
 *
 * ながれ
 *   木の わく に 大きな にもつ を のせた 人が、おもくて ふうふう いいながら あるいてくる
 *   → 立ちどまって ひとやすみ。にもつの上に 小鳥が とまって「なあに?」と くびを かしげる
 *   → 人は びっくり して、にっこり。うでを まえへ ふって「やあ」と あいさつ
 *   → ほね が ひかって、絵が うすくなり、字「何」が のこる
 *
 * 人は Person(左むき)・あるきは walk()・小鳥は Bird(共通部品)。字の形に合わせるために ゆがめない:
 *   にもつは ひもで かた に かける(ひもは 手に もつ物の ところに はさんで、どうの 上に 描く)。
 *   せおいわく は 人の せなか がわ(右)に あり、人は 左むきに あるく。
 *   字の形になるのは、あいさつで うでを ふった さいごの しゅんかん だけ。
 */
import { during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Bird, mixLimb, PALETTE, Person, personRig, Question, Sigh, Sweat, walk, type Expression, type Limb, type PersonPose } from '../sceneFigures'

const CHAR = '何'

const ROPE = '#e2c48c'
const CRATE = '#e8b062'
const CRATE_LIGHT = '#f4cc8a'
const CRATE_DARK = '#c58a43'
const SACK = '#f2e6c8'
const SACK_DARK = '#dcc9a0'
const NOTE = '#f07f9e'

/** くぎり の時間(秒) */
const WALK = 0.45
/** 立ちどまる */
const STOP = 3.3
/** 小鳥が とんでくる・とまる */
const FLY = 3.6
const PERCH = 4.3
/** 人が 小鳥に きづく */
const NOTICE = 4.8
/** うれしくなって、うでを まえへ ふりはじめる */
const GREET = 5.2
const INK = 6.3
const DONE = 8.9
const DURATION = 9.4

/** 人(こし)の たちどまる x・地面・背の高さ。左むき。にもつの わく は 立つ 場所 を きじゅん に 描く */
const STAND_X = 27.5
const GROUND = 94
const KID_HEIGHT = 78
/** あるきはじめ の x(画面の 右の そと) */
const START_X = 112
/** 1画目の 書きおわり(うで を ふったときの 手先) */
const HAND_GOAL: readonly [number, number] = [11.3, 56.8]
/** 小鳥が とまる 場所(にもつの 上の よこ木 の まんなか あたり) */
const PERCH_AT: readonly [number, number] = [70, 19]

/** せおいわく と にもつ。人の せなか がわ(右)に ひもで かける。 */
function Load() {
  return (
    <>
      {/* 左の はしら(人の せなか のすぐ うしろ。うすい色で おくに) */}
      <path d="M36.6 25 V90" fill="none" stroke={PALETTE.barkDark} strokeWidth="3.2" strokeLinecap="round" />
      {/* した の ささえ(にもつの ざぶとん) */}
      <path d="M36.6 90.6 H84" fill="none" stroke={PALETTE.bark} strokeWidth="3.2" strokeLinecap="round" />
      {/* まるい ふくろ(わくの した の ほうに おく) */}
      <path d="M58 70.5 Q62 66 66 70.5 Z" fill={SACK_DARK} />
      <circle cx="62" cy="80" r="10.2" fill={SACK_DARK} />
      <circle cx="61.2" cy="79" r="9.6" fill={SACK} />
      <path d="M58.6 70 L65.4 70" stroke={PALETTE.bark} strokeWidth="1.6" strokeLinecap="round" />
      {/* 四角い はこ(4・5・6画目) */}
      <path d="M40 44.6 L66.8 40.8 Q68.8 40.6 68.4 42.6 L64.8 61.4 Q64.5 62.6 63.4 62.8 L45.8 65.2 Q44.6 65.3 44.4 64 L39.6 46.4 Q39.4 44.8 40 44.6 Z" fill={CRATE} />
      <path d="M40.4 45 L66.6 41.3 Q68 41.2 67.8 42.4 L67.4 44.6 L41.6 48 Z" fill={CRATE_LIGHT} />
      {/* はこの ふた の あわせめ(ガムテープ) */}
      <path d="M54 41.8 L52.6 63.6" fill="none" stroke={CRATE_DARK} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
      <path d="M44.4 64 L64.2 61.4 L64.6 59.6 L43.8 62.4 Z" fill={CRATE_DARK} />
      {/* はこ と 右の はしら を つなぐ ひも */}
      <path d="M67.6 52 L83 52" fill="none" stroke={ROPE} strokeWidth="1.8" strokeLinecap="round" />
      {/* 3画目 の よこ木 と 7画目 の 長い はしら */}
      <Bone char={CHAR} n={3} color={PALETTE.bark} width={4.4} />
      <Bone char={CHAR} n={7} color={PALETTE.bark} width={4.2} />
    </>
  )
}

/** にもつを かける ひも: うしろの はしら から かた を こえて、むねへ。人の どう の 上に 描く */
function Straps({ neck, dx }: { readonly neck: readonly [number, number]; readonly dx: number }) {
  return (
    <path d={`M${36.6 + dx} 30 L${neck[0] + 2} ${neck[1] + 1} L${neck[0] - 3} ${neck[1] + 12}`} fill="none" stroke={ROPE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  )
}

/** 1画目の 書きはじめ: ぴょこんと はねた かみ(あたま の まんなか が 0,0、半径 1。右むき の 形) */
const TUFT = <path d="M-0.39 -0.83 Q-0.48 -1.17 -0.67 -0.95 Q-0.8 -1.24 -0.89 -0.9" fill="none" stroke={PALETTE.hair} strokeWidth="0.21" strokeLinecap="round" strokeLinejoin="round" />

/** 小鳥が とんできて、にもつの 上に とまる。うれしくなると うたう。 */
function Songbird({ t }: SceneProps) {
  const arrive = span(t, FLY, PERCH, easeOut)
  if (arrive <= 0) return null
  // 右上から、ゆるい山なり で おりてくる
  const x = PERCH_AT[0] + 46 - arrive * 46
  const y = PERCH_AT[1] - 22 + arrive * 22 - Math.sin(arrive * Math.PI) * 8
  const landed = arrive >= 1
  const hop = landed && t > GREET ? Math.abs(wave(t, 0.7)) * 0.9 : 0
  const song = during(t, GREET + 0.2, INK + 0.3, 0.25)
  const sway = wave(t, 1.2) * 1.2
  const noteY = 15 - ((t * 5) % 6)
  return (
    <>
      <Bird x={x} y={y - hop} t={t} flying={!landed} facing="left" />
      <g opacity={song} fill={NOTE}>
        <path d={`M${80 - sway} ${noteY} v-4.4 l2.6 -0.8 v4.2`} fill="none" stroke={NOTE} strokeWidth="0.8" />
        <ellipse cx={79.2 - sway} cy={noteY} rx="1.1" ry="0.8" />
        <ellipse cx={81.8 - sway} cy={noteY - 0.8} rx="1.1" ry="0.8" />
      </g>
    </>
  )
}

function moodAt(t: number): Expression {
  if (t < STOP) return 'worried'
  if (t < NOTICE) return 'sleepy'
  if (t < GREET) return 'surprised'
  return 'joy'
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)

  // あるく: 右から 左へ。おもい にもつで、少し まえかがみ。立ちどまると まっすぐ に
  const walking = walk(t, { from: START_X, to: STAND_X, start: WALK, end: STOP, build: 'child', height: KID_HEIGHT, armSwing: 14 })
  const dx = walking.x - STAND_X
  const lean = 5 * (1 - span(t, STOP - 0.7, STOP + 0.6))
  const bob = t < STOP && t > WALK ? -Math.abs(wave(t, 0.48)) * 0.8 : 0

  // うで: 立っているときは ま下に たれる。うれしくなったら まえへ ふって あいさつ
  const greet = span(t, GREET, INK - 0.1, easeInOut)
  const hanging: Limb = { swing: 3, bend: 8 }
  const standing: PersonPose = { rightArm: mixLimb(hanging, { to: HAND_GOAL }, greet), leftArm: hanging, head: t < NOTICE ? -4 : 6 * (1 - span(t, NOTICE, GREET)) + 2 * (1 - greet) }
  const pose: PersonPose = t < STOP ? { ...walking.pose, head: -4 } : standing
  const kid = { ...walking, y: GROUND + bob, lean, pose, build: 'child', height: KID_HEIGHT } as const
  const rig = personRig(kid)
  const head = rig.world.head
  const appear = span(t, WALK - 0.1, WALK + 0.1)

  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[103, 8]} tufts={[8, 46, 82, 100]} />
        <Layer opacity={appear}>
          <Layer x={dx} y={bob}>
            <Load />
          </Layer>
          <Person {...kid} face={moodAt(t)} headwear={TUFT} held={<Straps neck={rig.world.neck} dx={dx} />} />
          <Sweat t={t} x={head[0] + 8} y={head[1] - 6} show={during(t, WALK + 0.3, STOP + 0.3, 0.2)} dir={1} />
          <Sigh x={head[0] - 6} y={head[1] + 6} p={span(t, STOP, STOP + 1, easeOut)} show={during(t, STOP, STOP + 1, 0.25)} />
        </Layer>
        <Songbird t={t} />
        <Question x={PERCH_AT[0] + 6} y={PERCH_AT[1] - 9} show={during(t, PERCH + 0.15, GREET + 0.2, 0.2)} t={t} size={7} />
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
    { at: 0, label: 'お日さまが でる', sound: 'pop' },
    { at: WALK, label: 'にもつを かついだ 人が あるいてくる' },
    { at: STOP, label: '立ちどまって ふう', sound: 'pop' },
    { at: PERCH, label: '小鳥が にもつに とまって「なあに?」' },
    { at: GREET, label: '人は にっこり。うでを ふって あいさつ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '何 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
