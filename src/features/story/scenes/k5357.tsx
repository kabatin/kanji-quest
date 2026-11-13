/*
 * 南(みなみ): あたたかい こやで 草の めが ぐんぐん のびる。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … こやの やねの 中ほどを わたす よこの はり
 *   2画目(丨)  … やねの まんなかに 立つ はしら
 *   3画目(丨)  … こやの 左の かべ
 *   4画目(冂)  … こやの 右の かべ(上と 左は やねの ひさし に かくれる)
 *   5・6画目   … 草の めの 左右に ひらく ふたば
 *   7・8画目   … かべに つけた 2だんの たな
 *   9画目(丨)  … 草の めの くき
 *
 * ながれ
 *   ガラスばりの こやが できる。外は ゆきで さむくて、子どもが ぶるぶる ふるえている
 *   → 子どもが たねを つちに おとして うめる。そこへ くもが きれて、お日さまが さす
 *   → こやが ぽかぽか あたたかくなる(おんどけいが のぼり、ゆきが とける)。子どもも ほっとして えがおに
 *   → くきが ぐんぐん のびて、ふたばが ひらく。子どもが 目を まるくして、うれしくて ばんざい
 *   → ほね が ひかって、絵が うすくなり、字「南」が のこる
 *
 * 子どもは ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく、どう の まんなか の上。足は こし から。
 *   草の めは、地面から くき が のびて、先に ふたばが 左右に ひらく(ほんものの 草の めの かたち)。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '南'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SWEATER = '#f2a23c'
const SWEATER_DARK = '#d88a28'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const SCARF = '#e8534a'
const SCARF_DARK = '#c7403a'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const PLANK = '#c79b6a'
const SOIL = '#7a5238'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const STEM = '#4c8f52'
const SUN = '#ffd24a'
const WATER = '#5aaee8'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const KID_IN = 0.7
/** 子どもが たねを おとす ために うでを のばす */
const REACH = 1.9
/** たねが 手から はなれる / つちに おちる */
const DROP = 2.5
const LAND = 2.95
/** くもが きれて お日さまが さす */
const SUN_AT = 3.0
const WARM_FROM = 3.3
const WARM_TO = 5.0
/** めが のびはじめる・のびきる */
const SPROUT = 4.3
const GROWN = 6.0
/** 子どもが ばんざい */
const JOY = 5.7
const INK = 6.8
const DONE = 9.8
const DURATION = 10.4

/* ───────── ばしょ ───────── */

/** こやの ゆかの たかさ、つちの ベッドの うえ */
const FLOOR_Y = 94.2
const BED_Y = 93
/** 草の め の くき の 上のはし(のびきったとき。9画目の 書きはじめ のあたり) */
const STEM_TOP = 62.5
const STEM_X = 54
/** やね: てっぺん と ひさしの 左右(ひさし の たかさ は 4画目の 上はし の あたり) */
const APEX: readonly [number, number] = [53.7, 6]
const EAVE_Y = 42
const EAVE_L = 4.2
const EAVE_R = 103.2

/** 子どもの ばしょ(あしもと の まんなか) */
const KID_X = 76
const SHOULDER_L: readonly [number, number] = [KID_X - 5.5, 70.5]
const SHOULDER_R: readonly [number, number] = [KID_X + 5.5, 70.5]
const ARM_LEN = 7

function lerpColor(a: string, b: string, k: number): string {
  const c = Math.min(Math.max(k, 0), 1)
  const channel = (i: number) => {
    const from = parseInt(a.slice(1 + i * 2, 3 + i * 2), 16)
    const to = parseInt(b.slice(1 + i * 2, 3 + i * 2), 16)
    return Math.round(from + (to - from) * c).toString(16).padStart(2, '0')
  }
  return `#${channel(0)}${channel(1)}${channel(2)}`
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/* ───────── 外の けしき ───────── */

/** お日さま。くもに かくれているあいだは 光らない */
function Sun({ t }: SceneProps) {
  const shine = span(t, SUN_AT, SUN_AT + 0.8, easeOut)
  return (
    <>
      <Layer opacity={shine} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.2" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r="6.2" fill={SUN} />
    </>
  )
}

/** お日さまを かくす 灰色の くも。ゆっくり 左へ ながれて、お日さまが 出る */
function Cloud({ t }: SceneProps) {
  const appear = span(t, 0, 0.5)
  const drift = span(t, SUN_AT - 0.1, SUN_AT + 1.0, easeIn)
  if (appear <= 0 || drift >= 1) return null
  return (
    <Layer x={-46 * drift} opacity={appear}>
      <ellipse cx="13" cy="15.6" rx="12.4" ry="4.4" fill="#9aa8ba" />
      <circle cx="7.6" cy="13.2" r="5.6" fill="#9aa8ba" />
      <circle cx="14.4" cy="10.2" r="6.6" fill="#a9b5c6" />
      <circle cx="20.4" cy="13.6" r="5.6" fill="#9aa8ba" />
      <circle cx="12.6" cy="8.8" r="3.2" fill="#c3ccd8" />
    </Layer>
  )
}

const FLAKES: readonly (readonly [x: number, phase: number])[] = [
  [3, 0.0], [9, 0.45], [15, 0.8], [20, 0.25], [93, 0.1], [98, 0.6], [104, 0.9], [87, 0.35], [31, 0.7], [76, 0.55],
]

/** ふっている ゆき。ふんわり ゆれながら おちる(お日さまが さすと やむ) */
function Snow({ t }: SceneProps) {
  const show = span(t, 0.2, 0.6) * (1 - span(t, SUN_AT, SUN_AT + 0.8))
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {FLAKES.map(([x, phase], i) => {
        const y = ((t * (16 + phase * 8) + phase * 100) % 108) - 4
        const sway = Math.sin(t * 1.7 + phase * 9) * 1.8
        return <circle key={i} cx={x + sway} cy={y} r={i % 3 === 0 ? 1.5 : 1.1} fill="#ffffff" stroke="#b9d3ea" strokeWidth="0.5" />
      })}
    </g>
  )
}

/** とおくの おか と じめん。さむい間は 白く、あたたかくなると 草の 色に かわる */
function Ground({ warm }: { readonly warm: number }) {
  return (
    <>
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill={lerpColor('#e9eff6', '#e2f2d2', warm)} />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={lerpColor('#f3f7fb', '#c5e8a9', warm)} />
      <Layer opacity={1 - warm}>
        <ellipse cx="10" cy="96.4" rx="7" ry="2.4" fill="#ffffff" />
        <ellipse cx="99" cy="96" rx="6" ry="2.2" fill="#ffffff" />
      </Layer>
      <Layer opacity={warm}>
        {[8, 100].map((x) => (
          <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
        ))}
      </Layer>
    </>
  )
}

/** あたたかくなると とんでくる ちょうちょ(こやの 外) */
function Butterfly({ t }: SceneProps) {
  const show = span(t, 5.4, 5.9)
  if (show <= 0) return null
  const flap = 0.25 + 0.75 * Math.abs(wave(t, 0.5))
  return (
    <Layer x={93 + Math.sin(t * 2) * 5} y={25 + Math.cos(t * 2.6) * 4} opacity={show}>
      <ellipse cx="-2.4" cy="-0.6" rx={2.8 * flap} ry="2.4" fill="#f07f9e" />
      <ellipse cx="2.4" cy="-0.6" rx={2.8 * flap} ry="2.4" fill="#f07f9e" />
      <ellipse cx="-1.8" cy="1.8" rx={2 * flap} ry="1.6" fill="#f7a8bd" />
      <ellipse cx="1.8" cy="1.8" rx={2 * flap} ry="1.6" fill="#f7a8bd" />
      <rect x="-0.5" y="-2.2" width="1" height="5.4" rx="0.5" fill="#5a3b2a" />
    </Layer>
  )
}

/* ───────── こや ───────── */

/** こやの うしろ がわ: ガラスの やね・へや の いろ・たな・おんどけい・つちの ベッド・ゆか */
function HutBack({ warm }: { readonly warm: number }) {
  const glass = lerpColor('#d4e8f7', '#ffe9ad', warm)
  const room = lerpColor('#d6e6f3', '#fff1c8', warm)
  // おんどけいの 赤い えきが のぼる
  const level = 0.12 + 0.85 * easeInOut(warm)
  const mercury = 4 + 22 * level
  return (
    <>
      <polygon points={`${EAVE_L},${EAVE_Y} ${APEX[0]},${APEX[1]} ${EAVE_R},${EAVE_Y}`} fill={glass} />
      <path d="M22 33 L32 26 M30 38 L44 28" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      <rect x="24" y="42" width="64" height="54.6" fill={room} />
      {/* たな(7・8画目): かべに つけた 2だん */}
      <rect x="34" y="60.2" width="43" height="2.2" rx="1" fill={BARK} />
      <rect x="33" y="72.4" width="44" height="2.2" rx="1" fill={BARK} />
      {/* うえの たな: じょうろ */}
      <rect x="37" y="54.4" width="8" height="5.8" rx="1.4" fill={WATER} />
      <path d="M45 57.4 L49.4 54.6" stroke={WATER} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M37.2 55.6 Q33.6 55.8 34.6 59.2" fill="none" stroke={WATER} strokeWidth="1.2" strokeLinecap="round" />
      {/* したの たな: はちうえ */}
      <path d="M38.5 67.4 H46.5 L45.3 72.4 H39.7 Z" fill="#d9825b" />
      <ellipse cx="41.2" cy="66.4" rx="2.4" ry="1.3" fill={LEAF} transform="rotate(-25 41.2 66.4)" />
      <ellipse cx="44" cy="66.2" rx="2.4" ry="1.3" fill={LEAF_DARK} transform="rotate(25 44 66.2)" />
      {/* おんどけい */}
      <rect x="27.6" y="50" width="3" height="28" rx="1.5" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <circle cx="29.1" cy="80" r="3.3" fill="#e8534a" />
      <rect x="28.2" y={78 - mercury + 4} width="1.8" height={mercury} rx="0.9" fill="#e8534a" />
      {/* ゆか と つちの ベッド */}
      <rect x="19" y={FLOOR_Y} width="74" height="2.8" rx="1.4" fill={PLANK} />
      <rect x="36" y="90.6" width="35" height="4.4" rx="2" fill={SOIL} />
    </>
  )
}

/** こやの てまえ がわ: かべ(3・4画目)・やねの はり(1・2画目)・ひさし・ゆき */
function HutFront({ warm }: { readonly warm: number }) {
  return (
    <>
      <Bone char={CHAR} n={3} color={BARK} width={4.4} />
      <Bone char={CHAR} n={4} color={BARK} width={4.4} from={0.52} to={0.86} />
      <rect x="19" y={FLOOR_Y} width="74" height="2.8" rx="1.4" fill={PLANK} />
      {/* やねの わく */}
      <path d={`M${EAVE_L} ${EAVE_Y} L${APEX[0]} ${APEX[1]} L${EAVE_R} ${EAVE_Y}`} fill="none" stroke={BARK_DARK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <Bone char={CHAR} n={1} color={BARK} width={3} />
      <Bone char={CHAR} n={2} color={BARK} width={3.4} />
      <rect x="2" y="40.2" width="103" height="4.2" rx="2" fill={BARK_DARK} />
      {/* やねの ゆき: あたたかくなると とける */}
      <Layer opacity={1 - warm}>
        <path d={`M${EAVE_L + 1.4} 40 L${APEX[0]} 4.6 L${EAVE_R - 1.4} 40`} fill="none" stroke="#b9d3ea" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M${EAVE_L + 1.4} 39.4 L${APEX[0]} 4.2 L${EAVE_R - 1.4} 39.4`} fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </Layer>
    </>
  )
}

/** こやの 外に さす 日ざしの おび(へやが あたたまる わけ) */
function Beams({ t }: SceneProps) {
  const beam = span(t, SUN_AT + 0.3, SUN_AT + 1.2) * (1 - 0.25 * span(t, WARM_TO, WARM_TO + 1))
  if (beam <= 0) return null
  return (
    <g opacity={beam * 0.3} fill="#fff2a8">
      <polygon points="30,30 46,26 70,93 42,93" />
      <polygon points="52,24 60,22 82,93 72,93" opacity="0.7" />
    </g>
  )
}

/* ───────── 草の め ───────── */

type Point = readonly [number, number]

/** ふたば 1まい。base(くきに つながる ほう)から tip(さき)へ のびる。grow で ひらく */
function Leaf({ base, tip, grow }: { readonly base: Point; readonly tip: Point; readonly grow: number }) {
  const dx = tip[0] - base[0]
  const dy = tip[1] - base[1]
  const len = Math.hypot(dx, dy)
  const nx = (-dy / len) * 7.4
  const ny = (dx / len) * 7.4
  const mx = base[0] + dx / 2
  const my = base[1] + dy / 2
  const shape = `M${base[0]} ${base[1]} Q${mx + nx} ${my + ny} ${tip[0]} ${tip[1]} Q${mx - nx} ${my - ny} ${base[0]} ${base[1]} Z`
  const half = `M${base[0]} ${base[1]} Q${mx + nx} ${my + ny} ${tip[0]} ${tip[1]} Z`
  return (
    <Layer scale={Math.max(0, grow)} origin={base}>
      {/* くき から ふたばへ つながる えだ */}
      <path d={`M${STEM_X} ${STEM_TOP} Q${(STEM_X + base[0]) / 2} ${STEM_TOP + 1.5} ${base[0]} ${base[1]}`} fill="none" stroke={STEM} strokeWidth="1.6" strokeLinecap="round" />
      <path d={shape} fill={LEAF} />
      <path d={half} fill={LEAF_LIGHT} opacity="0.6" />
      <path d={`M${base[0]} ${base[1]} L${tip[0]} ${tip[1]}`} stroke={LEAF_DARK} strokeWidth="0.8" strokeLinecap="round" />
    </Layer>
  )
}

/** 草の め: つちから くきが のびて、さいごに ふたばが 左右に ひらく(5・6・9画目) */
function Sprout({ t }: SceneProps) {
  const g = span(t, SPROUT, GROWN, easeOut)
  if (g <= 0) return null
  const top = BED_Y - (BED_Y - STEM_TOP) * g
  const unfurl = span(t, 5.0, 6.1, backOut)
  const sway = wave(t, 2.6) * 1.2 * span(t, GROWN, GROWN + 0.3)
  return (
    <Layer rotate={sway} origin={[STEM_X, BED_Y]}>
      <path d={`M${STEM_X} ${BED_Y} L${STEM_X} ${top}`} stroke={STEM} strokeWidth="2.6" strokeLinecap="round" />
      {/* はじめは ちいさな つぼみ */}
      <circle cx={STEM_X} cy={top - 0.4} r={1.9 * Math.max(0, 1 - unfurl * 2)} fill={LEAF} />
      <Layer y={top - STEM_TOP}>
        <Leaf base={[46, 59.2]} tip={[38.5, 49.4]} grow={unfurl} />
        <Leaf base={[60.6, 57.8]} tip={[66.3, 45.5]} grow={unfurl} />
      </Layer>
    </Layer>
  )
}

/* ───────── 子ども ───────── */

type ArmPose = { readonly swing: number; readonly fore: number }
type Mood = 'cold' | 'warm' | 'wonder' | 'joy'

const rad = (deg: number) => (deg * Math.PI) / 180

/** うで の ひじ と 手。swing = かた から ま下を 0 として まえへ ふった角度 / fore = ひじ から さきの角度 */
function armPoints(shoulder: Point, pose: ArmPose): { readonly elbow: Point; readonly hand: Point } {
  const elbow: Point = [shoulder[0] + Math.sin(rad(pose.swing)) * ARM_LEN, shoulder[1] + Math.cos(rad(pose.swing)) * ARM_LEN]
  const hand: Point = [elbow[0] + Math.sin(rad(pose.fore)) * ARM_LEN, elbow[1] + Math.cos(rad(pose.fore)) * ARM_LEN]
  return { elbow, hand }
}

/** かた → ひじ → 手 と つながる うで */
function Arm({ shoulder, pose }: { readonly shoulder: Point; readonly pose: ArmPose }) {
  const { elbow, hand } = armPoints(shoulder, pose)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={SWEATER_DARK} strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.5" fill={SKIN} />
    </>
  )
}

function Face({ mood, look }: { readonly mood: Mood; readonly look: number }) {
  const cx = KID_X
  return (
    <>
      <ellipse cx={cx - 4.8} cy="62.4" rx="1.8" ry="1.2" fill={CHEEK} opacity="0.55" />
      <ellipse cx={cx + 4.8} cy="62.4" rx="1.8" ry="1.2" fill={CHEEK} opacity="0.55" />
      {mood === 'cold' && (
        <>
          {/* ぎゅっと つぶった 目と、ふるえる 口 */}
          <path d={`M${cx - 3.8} 58.6 L${cx - 1.6} 59.9 L${cx - 3.8} 61.2`} fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M${cx + 3.8} 58.6 L${cx + 1.6} 59.9 L${cx + 3.8} 61.2`} fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M${cx - 1.9} 64.2 q0.95 -1 1.9 0 t1.9 0`} fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
          <circle cx={cx} cy="62.2" r="0.9" fill="#f08a7a" />
        </>
      )}
      {mood === 'warm' && (
        <>
          <circle cx={cx - 2.8} cy="60" r="1.1" fill={EYE} />
          <circle cx={cx + 2.8} cy="60" r="1.1" fill={EYE} />
          <path d={`M${cx - 1.9} 63 Q${cx} 65 ${cx + 1.9} 63`} fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'wonder' && (
        <>
          <circle cx={cx - 2.8 + look} cy="60" r="1.6" fill={EYE} />
          <circle cx={cx + 2.8 + look} cy="60" r="1.6" fill={EYE} />
          <circle cx={cx - 3.2 + look} cy="59.4" r="0.5" fill="#ffffff" />
          <circle cx={cx + 2.4 + look} cy="59.4" r="0.5" fill="#ffffff" />
          <ellipse cx={cx + look * 0.5} cy="64.2" rx="0.95" ry="1.15" fill={MOUTH} />
        </>
      )}
      {mood === 'joy' && (
        <>
          <path d={`M${cx - 4.2} 60.8 Q${cx - 2.8} 58.4 ${cx - 1.4} 60.8`} fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d={`M${cx + 1.4} 60.8 Q${cx + 2.8} 58.4 ${cx + 4.2} 60.8`} fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d={`M${cx - 2.4} 62.8 Q${cx} 67.4 ${cx + 2.4} 62.8 Z`} fill={MOUTH} />
        </>
      )}
    </>
  )
}

type KidProps = {
  readonly mood: Mood
  readonly left: ArmPose
  readonly right: ArmPose
  readonly look: number
  readonly tilt: number
}

/** 主人公の 子ども。あし → どう → うで → マフラー → あたま の じゅん */
function Kid({ mood, left, right, look, tilt }: KidProps) {
  return (
    <>
      <rect x={KID_X - 5.4} y="83" width="4.6" height="10.4" rx="2.3" fill={PANTS} />
      <rect x={KID_X + 0.8} y="83" width="4.6" height="10.4" rx="2.3" fill={PANTS} />
      <ellipse cx={KID_X - 3.4} cy="93.6" rx="3.4" ry="1.7" fill={SHOE} />
      <ellipse cx={KID_X + 3.4} cy="93.6" rx="3.4" ry="1.7" fill={SHOE} />
      <rect x={KID_X - 6.5} y="66.6" width="13" height="18.4" rx="5.6" fill={SWEATER} />
      <path d={`M${KID_X - 5.2} 78 h10.4`} stroke={SWEATER_DARK} strokeWidth="1.4" strokeLinecap="round" />
      <Arm shoulder={SHOULDER_L} pose={left} />
      <Arm shoulder={SHOULDER_R} pose={right} />
      {/* くび は みじかく、マフラー に かくれる */}
      <rect x={KID_X - 2} y="64" width="4" height="4" fill={SKIN_SHADE} />
      <rect x={KID_X - 6.2} y="65.6" width="12.4" height="3.6" rx="1.8" fill={SCARF} />
      <rect x={KID_X + 2.6} y="67.4" width="3" height="6.4" rx="1.4" fill={SCARF_DARK} />
      <Layer rotate={tilt} origin={[KID_X, 66]}>
        <circle cx={KID_X} cy="59.5" r="6.8" fill={SKIN} />
        <path d={`M${KID_X - 6.6} 58 Q${KID_X - 7} 52 ${KID_X} 52.2 Q${KID_X + 7} 52 ${KID_X + 6.6} 58 Q${KID_X + 3.5} 55 ${KID_X} 55.6 Q${KID_X - 3.5} 55 ${KID_X - 6.6} 58 Z`} fill={HAIR} />
        <Face mood={mood} look={look} />
      </Layer>
    </>
  )
}

/** さむくて ふるえる しるし(あたまの よこの 小さな せん)と、白い いき */
function Shiver({ t, cold }: SceneProps & { readonly cold: number }) {
  if (cold <= 0) return null
  const flick = Math.abs(wave(t, 0.22))
  const breath = during(t, 1.0, REACH + 0.2, 0.25) * cold
  const p = span(t, 1.0, REACH + 0.2, easeOut)
  return (
    <>
      <g opacity={flick * cold} stroke="#6f8fd6" strokeWidth="0.9" strokeLinecap="round">
        <path d={`M${KID_X - 10} 55 l-1.8 -1.4 M${KID_X - 10.4} 59 l-2.2 0 M${KID_X - 10} 63 l-1.8 1.4`} />
        <path d={`M${KID_X + 10} 55 l1.8 -1.4 M${KID_X + 10.4} 59 l2.2 0 M${KID_X + 10} 63 l1.8 1.4`} />
      </g>
      <g opacity={breath}>
        <ellipse cx={KID_X - 2 - p * 8} cy={64 - p * 7} rx={2.6 + p * 2} ry={1.8 + p * 1.4} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
        <ellipse cx={KID_X - 5 - p * 5} cy={64.6 - p * 3} rx={1.3 + p * 0.8} ry={1 + p * 0.5} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      </g>
    </>
  )
}

/** ほっと した ときの 「ふう」 */
function Relief({ t }: SceneProps) {
  const show = during(t, 3.5, 4.4, 0.2)
  if (show <= 0) return null
  const p = span(t, 3.5, 4.4, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={KID_X - 4 - p * 8} cy={52 - p * 4} rx={2.4 + p * 2} ry={1.7 + p * 1.2} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
    </g>
  )
}

/** うめる たね。手に もっていて、つちに おちる */
function Seed({ t, hand }: SceneProps & { readonly hand: Point }) {
  if (t >= LAND) return null
  const fall = span(t, DROP, LAND, easeIn)
  const from = armPoints(SHOULDER_L, PLANT_POSE).hand
  const [x, y] = t < DROP ? hand : [lerp(from[0], STEM_X + 0.4, fall), lerp(from[1], BED_Y - 0.4, fall)]
  return (
    <g transform={`translate(${x} ${y}) rotate(30)`}>
      <ellipse cx="0" cy="0" rx="1.5" ry="2.2" fill="#8a5a32" />
      <ellipse cx="-0.4" cy="-0.7" rx="0.4" ry="0.8" fill="#c79a6a" />
    </g>
  )
}

/** うめた あとの つちの もりあがり */
function Mound({ t }: SceneProps) {
  const pop = span(t, LAND, LAND + 0.3, backOut)
  if (pop <= 0) return null
  return <ellipse cx={STEM_X + 0.4} cy={BED_Y + 0.4} rx={4.6 * pop} ry={2.2 * pop} fill={BARK} />
}

/** 手から おとす ときの うで(のばして ひらく) */
const PLANT_POSE: ArmPose = { swing: -40, fore: 285 }
/** さむい ときの うで(むねの まえで かかえる) */
const COLD_L: ArmPose = { swing: -10, fore: 150 }
const COLD_R: ArmPose = { swing: 10, fore: 210 }
/** ほっと した ときの うで(だらんと 下げる) */
const HANG_L: ArmPose = { swing: -8, fore: 354 }
const HANG_R: ArmPose = { swing: 8, fore: 6 }
/** ばんざい */
const JOY_L: ArmPose = { swing: -165, fore: 188 }
const JOY_R: ArmPose = { swing: 165, fore: 172 }

const blend = (a: ArmPose, b: ArmPose, k: number): ArmPose => ({ swing: lerp(a.swing, b.swing, k), fore: lerp(a.fore, b.fore, k) })

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 9)

  const hutUp = span(t, 0, 0.9, easeOut)
  const warm = span(t, WARM_FROM, WARM_TO, easeInOut)
  const kidIn = span(t, KID_IN, KID_IN + 0.4, backOut)
  // さむい あいだ ぶるぶる ふるえる(たねを おとす ときと、ほっと した あとは ふるえない)
  const cold = 1 - span(t, WARM_FROM, WARM_FROM + 0.5)
  const shaking = t < REACH || (t >= LAND && t < WARM_FROM + 0.3)
  const shake = shaking ? wave(t, 0.11) * 0.45 * cold : 0

  // うで: たねを おとす → ほっと → ばんざい
  const reach = span(t, REACH, REACH + 0.55, easeInOut)
  const relax = span(t, SUN_AT + 0.2, SUN_AT + 1.0, easeInOut)
  const joy = span(t, JOY, JOY + 0.5, easeOut)
  const cheer = wave(t, 0.4) * 7 * joy
  const leftBase = blend(blend(blend(COLD_L, PLANT_POSE, reach), HANG_L, relax), JOY_L, joy)
  const rightBase = blend(blend(COLD_R, HANG_R, relax), JOY_R, joy)
  const left: ArmPose = { swing: leftBase.swing, fore: leftBase.fore + cheer }
  const right: ArmPose = { swing: rightBase.swing, fore: rightBase.fore + cheer }

  const mood: Mood = t < WARM_FROM + 0.1 ? 'cold' : t < SPROUT + 0.3 ? 'warm' : t < JOY ? 'wonder' : 'joy'
  const look = -0.9
  const tilt = mood === 'wonder' ? -5 : 0
  // ばんざいで ぴょんぴょん はねる(字になる 前に ちゃんと おりる)
  const hop = joy > 0 ? Math.abs(wave(t - JOY, 0.7)) * 2.4 * (1 - span(t, INK - 0.4, INK - 0.1)) : 0

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground warm={warm} />
        <Sun t={t} />
        <Cloud t={t} />
        <Snow t={t} />
        <Butterfly t={t} />
        <Layer scale={hutUp} origin={[54, 96]} opacity={span(t, 0, 0.3)}>
          <HutBack warm={warm} />
        </Layer>
        <Beams t={t} />
        <Mound t={t} />
        <Sprout t={t} />
        <Layer scale={kidIn} origin={[KID_X, FLOOR_Y]}>
          <Layer x={shake} y={-hop}>
            <Kid mood={mood} left={left} right={right} look={look} tilt={tilt} />
            <Seed t={t} hand={armPoints(SHOULDER_L, left).hand} />
            <Shiver t={t} cold={cold} />
            <Relief t={t} />
          </Layer>
        </Layer>
        <Layer scale={hutUp} origin={[54, 96]} opacity={span(t, 0, 0.3)}>
          <HutFront warm={warm} />
        </Layer>
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
    { at: 0, label: 'ガラスの こやが できる。外は ゆきで さむい', sound: 'pop' },
    { at: KID_IN, label: '子どもが さむくて ぶるぶる' },
    { at: REACH, label: 'たねを つちに うめる', sound: 'pop' },
    { at: SUN_AT, label: 'くもが きれて お日さま。こやが あたたかく' },
    { at: SPROUT, label: '草の めが ぐんぐん のびる' },
    { at: JOY, label: '子どもが よろこぶ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '南 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
