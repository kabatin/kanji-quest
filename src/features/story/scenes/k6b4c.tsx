/*
 * 歌(うた): 口を 大きく あけて 歌う。「カ」の おと。(共通部品 sceneFigures で 書きなおした もの)
 *
 * ほね(画と絵の対応)
 *   1・6画目(一)   … 木の ポールの 2本の よこぼう(うえ と まんなか)
 *   2〜4画目・7〜9画目(口) … よこぼう から さがった 2まいの「おと の ふだ」(左がわ)
 *   5・10画目(丨)  … ポール(たて)。下の 先は ひっかけた かたち の あし
 *   11画目(ノ)     … こどもの 立てた かみ から、むねに あてた 手 の あたり(かた〜まえ)
 *   12画目(一+フ)  … こどもの まえへ ひらいた うで(かた → ひじ → 手)。だいたい 同じ 場所・向き
 *   13画目(ノ)     … こどもの どう と、まえに ひらいた あし
 *   14画目(\)      … うしろに ひらいた あし
 *
 * ながれ
 *   ポールが たつ → もじもじした こどもが でてくる(歌いたいのに ちょっと はずかしい)
 *   → すーっと いきを すって、足を ひらく → 口を 大きく あけて「あー!」と 歌う
 *   → 口から でた おんぷが ポールへ とんでいき、ぽん と「おと の ふだ」に なる(2まい)
 *   → こどもは にこにこ。うでを ひらいて 歌いきる → ほね が ひかって、絵が うすくなり、字「歌」が のこる
 *
 * 子は Person(左むき)。足を ひらくのは 足の swing、むねに あてる 手は { to }。
 * 人の うで は うしろへ そんなに ひらかないので、ひらく うで は まえ(ポールの ほう)へ のばす。
 * 画との 重なりは 弱く なっても、体の つくり を まもる。
 */
import { backOut, during, easeIn, easeInOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, HANG_ARM, LOOKS, mixLimb, PALETTE, Person, personRig, type PersonProps } from '../sceneFigures'

const CHAR = '歌'

const BARK = PALETTE.bark
const BARK_DARK = PALETTE.barkDark
const BOARD = '#d9a35f'
const BOARD_DARK = '#c08840'
const PAPER = '#fffaf0'
const PINK = '#f07f9e'
const BLUE = '#5f7fd6'

/** くぎり の時間(秒) */
const KID_IN = 0.5
const BREATH = 1.4
const SING = 2.3
/** 1つめ・2つめ・3つめ の おんぷ が とびだして、ふだ に とどく時間 */
const NOTE1: readonly [number, number] = [2.5, 3.7]
const NOTE2: readonly [number, number] = [3.4, 4.7]
const NOTE3: readonly [number, number] = [4.1, 5.5]
const INK = 6.2
const DONE = 9.6
const DURATION = 10.4

/** 子の 場所(こし の x と 足もと)・背の高さ */
const KID_X = 72
const FOOT_Y = 91.5
const KID_HEIGHT = 70
/** 足を ひらいた ときの かくど(ま下から)。ひらくと こし は 部品が 下げる */
const SPREAD_DEG = 22

/** おんぷの ふだ(左がわ)。ふだの 中心と、ぶらさげる よこぼうの 高さ */
type BoardSpec = { readonly x: number; readonly y: number; readonly w: number; readonly h: number; readonly ropeX: number; readonly barY: number }
const BOARD_1: BoardSpec = { x: 17, y: 32, w: 16, h: 12, ropeX: 25, barY: 21.5 }
const BOARD_2: BoardSpec = { x: 14.5, y: 64, w: 17.5, h: 12.5, ropeX: 23.2, barY: 54.5 }

/** おと の ふだ を ぶらさげる ポール。ほんものの 木の ポールと よこぼう */
function Pole({ t }: SceneProps) {
  const rise = span(t, 0, 0.55, backOut)
  const arms = span(t, 0.25, 0.75, backOut)
  return (
    <>
      <ellipse cx="44" cy="97" rx={Math.max(0, 9 * rise)} ry="2.2" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.6 + 0.4 * rise} scaleY={rise} origin={[44, 95]}>
        <Bone char={CHAR} n={5} color={BARK} width={4.6} />
        <rect x="41.9" y="46" width="4.4" height="10" fill={BARK} />
        <Bone char={CHAR} n={10} color={BARK} width={4.6} />
        <path d="M43.4 30 q1 3 0 6 M44.8 66 q-1 3 0 6" fill="none" stroke={BARK_DARK} strokeWidth="1" strokeLinecap="round" />
      </Layer>
      <Layer scaleX={arms} origin={[44, 30]}>
        <Bone char={CHAR} n={1} color={BARK} width={3.4} />
      </Layer>
      <Layer scaleX={arms} origin={[44, 54]}>
        <Bone char={CHAR} n={6} color={BARK} width={3.4} />
      </Layer>
    </>
  )
}

/** おんぷ 1つ。あたま・ぼう・はた。(0,0) が あたま の まんなか */
function NoteShape({ color }: { readonly color: string }) {
  return (
    <>
      <ellipse cx="0" cy="0" rx="2.5" ry="1.8" fill={color} transform="rotate(-20)" />
      <path d="M2.2 -0.6 V-7.4" fill="none" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <path d="M2.2 -7.4 Q5.4 -6.6 4.8 -3.4 Q4.2 -5.4 2.2 -5 Z" fill={color} />
    </>
  )
}

/** おと の ふだ。よこぼう から ひもで さがる。おんぷが とどいた ときに ぽん と あらわれる */
function SongBoard({ spec, pop, swing, color }: { readonly spec: BoardSpec; readonly pop: number; readonly swing: number; readonly color: string }) {
  if (pop <= 0) return null
  const { x, y, w, h, ropeX, barY } = spec
  return (
    <Layer rotate={swing * Math.min(1, pop)} scaleX={Math.min(pop, 1.05)} scaleY={Math.max(0, pop)} origin={[ropeX, barY]}>
      <path d={`M${ropeX} ${barY} V${y + 0.5}`} stroke={BARK_DARK} strokeWidth="0.9" strokeLinecap="round" />
      <rect x={x} y={y} width={w} height={h} rx="2.2" fill={BOARD_DARK} />
      <rect x={x} y={y - 0.8} width={w} height={h - 0.4} rx="2.2" fill={BOARD} />
      <rect x={x + 1.6} y={y + 0.9} width={w - 3.2} height={h - 3} rx="1.4" fill={PAPER} />
      <g transform={`translate(${x + w / 2 - 2} ${y + h / 2 + 2.6}) scale(1.3)`}>
        <NoteShape color={color} />
      </g>
    </Layer>
  )
}

type Pt = readonly [number, number]

/** くちから ふだ へ とぶ おんぷ。ゆるい 山なり で とんで、とどくと きえる */
function FlyingNote({ t, window, from, to, lift, color }: { readonly t: number; readonly window: readonly [number, number]; readonly from: Pt; readonly to: Pt; readonly lift: number; readonly color: string }) {
  const p = span(t, window[0], window[1])
  if (p <= 0 || p >= 1) return null
  const x = from[0] + (to[0] - from[0]) * easeInOut(p)
  const y = from[1] + (to[1] - from[1]) * easeIn(p * 0.9 + 0.1 * p) - Math.sin(p * Math.PI) * lift
  const size = Math.max(0, 0.5 + 1.0 * span(t, window[0], window[0] + 0.3, backOut)) * (1 - 0.35 * span(t, window[1] - 0.25, window[1]))
  return (
    <Layer x={x} y={y} rotate={wave(t, 0.7) * 14} scale={size}>
      <NoteShape color={color} />
    </Layer>
  )
}

/** おんぷ が とどいた ときの きらり */
function Twinkle({ t, at, cx, cy }: { readonly t: number; readonly at: number; readonly cx: number; readonly cy: number }) {
  const p = span(t, at, at + 0.5)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p}>
      <Star cx={cx} cy={cy} r={3.4 * (0.4 + p)} color="#ffd24a" spin={p * 90} />
    </g>
  )
}

/** 口から ひろがる おと の なみ */
function SoundRings({ t, mouth }: { readonly t: number; readonly mouth: Pt }) {
  const show = during(t, SING, SING + 1.0, 0.1)
  if (show <= 0) return null
  return (
    <g fill="none" stroke="#f3a6bb" strokeWidth="1.1" strokeLinecap="round" opacity={show}>
      {[0, 0.25, 0.5].map((offset) => {
        const p = span(t, SING + offset, SING + offset + 0.6)
        return <path key={offset} d="M0 -3.2 Q-2.6 0 0 3.2" transform={`translate(${mouth[0] - 3 - p * 6} ${mouth[1] - 1})`} opacity={Math.sin(p * Math.PI)} />
      })}
    </g>
  )
}

/** 1画目 の 書きはじめ に あたる、あたまの てっぺんの 立った かみ(あたまの まんなか が 0,0、半径 1。右むき の 形) */
const TUFT = <path d="M0.3 -0.86 Q0.38 -1.2 0.58 -1.02 Q0.72 -1.3 0.84 -0.98" fill="none" stroke={PALETTE.hair} strokeWidth="0.2" strokeLinecap="round" strokeLinejoin="round" />

/** 子の 場所と かっこう(左むき)。足を ひらき、むねに 手を あて、まえへ うでを ひらいて 歌う */
function kidAt(t: number): PersonProps {
  const stance = span(t, BREATH, BREATH + 0.9, easeInOut)
  const chest = span(t, BREATH - 0.1, BREATH + 0.7, easeInOut)
  const reach = span(t, SING + 0.4, SING + 1.1, backOut)
  const singing = t >= SING
  const settle = 1 - span(t, 5.0, 5.4)
  const sway = singing ? wave(t, 1.1) * settle : 0
  const spread = 2 + (SPREAD_DEG - 2) * stance
  // てまえの うで(右)は むねへ。むねの 高さ は 背の 5.6わり、まえ は こし から 少し
  const chestHand: Pt = [KID_X - 5, FOOT_Y - KID_HEIGHT * 0.56]
  const openArm = { swing: 36 + sway * 4, bend: 12 }
  const face = singing ? (t < DONE - 3.2 ? 'joy' : 'smile') : t >= BREATH + 0.2 ? 'closed' : 'worried'
  return {
    x: KID_X + sway * 0.5,
    y: FOOT_Y,
    build: 'child',
    height: KID_HEIGHT,
    facing: 'left',
    look: LOOKS.boy,
    face,
    opacity: span(t, KID_IN, KID_IN + 0.3),
    headwear: TUFT,
    pose: {
      leftLeg: { swing: -spread, bend: 0 },
      rightLeg: { swing: spread, bend: 0 },
      rightArm: mixLimb(HANG_ARM, { to: chestHand }, chest),
      leftArm: mixLimb(HANG_ARM, openArm, reach),
      head: mix(t, BREATH, SING, 8, -10) + (singing ? wave(t, 1.4) * 2 * settle : 0),
    },
  }
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 14)
  const kid = kidAt(t)
  const rig = personRig(kid)
  const headR = rig.body.headR * rig.scale
  // 口: あたまの 左がわ(まえ)、中心 より 少し 下
  const mouth: Pt = [rig.world.head[0] - headR * 0.95, rig.world.head[1] + headR * 0.3]
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const kidIn = span(t, KID_IN, KID_IN + 0.5, backOut)

  const pop1 = span(t, NOTE1[1], NOTE1[1] + 0.5, backOut)
  const pop2 = span(t, NOTE2[1], NOTE2[1] + 0.5, backOut)
  const swing1 = wave(t - NOTE1[1], 1.3) * 7 * (1 - span(t, NOTE1[1], NOTE1[1] + 2.2))
  const swing2 = wave(t - NOTE2[1], 1.3) * 7 * (1 - span(t, NOTE2[1], NOTE2[1] + 2.2))

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[9, 9]} clouds={[[94, 9, 0.9]]} tufts={[6, 30, 78, 102]} />
        <Pole t={t} />
        <SongBoard spec={BOARD_1} pop={pop1} swing={swing1} color={PINK} />
        <SongBoard spec={BOARD_2} pop={pop2} swing={swing2} color={BLUE} />
        <Layer scale={0.85 + 0.15 * kidIn} origin={[KID_X, FOOT_Y]}>
          <Person {...kid} />
        </Layer>
        <SoundRings t={t} mouth={mouth} />
        <FlyingNote t={t} window={NOTE1} from={mouth} to={[25, 38]} lift={22} color={PINK} />
        <FlyingNote t={t} window={NOTE2} from={mouth} to={[23, 70]} lift={30} color={BLUE} />
        <FlyingNote t={t} window={NOTE3} from={mouth} to={[34, 7]} lift={6} color="#f3a74a" />
        <Twinkle t={t} at={NOTE1[1]} cx={BOARD_1.x + BOARD_1.w - 1} cy={BOARD_1.y - 1} />
        <Twinkle t={t} at={NOTE2[1]} cx={BOARD_2.x + BOARD_2.w - 1} cy={BOARD_2.y - 1} />
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
    { at: 0, label: 'ふだを かける ポールが たつ', sound: 'pop' },
    { at: KID_IN, label: 'こどもが でてくる。歌いたいけど もじもじ' },
    { at: BREATH, label: 'すーっと いきを すって、足を ひらく' },
    { at: SING, label: '口を 大きく あけて 歌う', sound: 'pop' },
    { at: NOTE1[1], label: 'おんぷが ふだに なる(1まいめ)', sound: 'pop' },
    { at: NOTE2[1], label: '2まいめの おと の ふだ', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '歌 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
