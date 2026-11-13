/*
 * 歌(うた): 口を 大きく あけて 歌う。「カ」の おと。
 *
 * ほね(画と絵の対応)
 *   1・6画目(一)   … 木の ポールの 2本の よこぼう(うえ と まんなか)
 *   2〜4画目・7〜9画目(口) … よこぼう から さがった 2まいの「おと の ふだ」(左がわ)
 *   5・10画目(丨)  … ポール(たて)。下の 先は ひっかけた かたち の あし
 *   11画目(ノ)     … こどもの 立てた かみ から、むねに あてた 手 の あたり(かた〜まえ)
 *   12画目(一+フ)  … こどもの 右がわに ひろげた うで(かた → ひじ → 手)
 *   13画目(ノ)     … こどもの どう と、まえに ひらいた あし
 *   14画目(\)      … うしろに ひらいた あし
 *
 * ながれ
 *   ポールが たつ → もじもじした こどもが でてくる(歌いたいのに ちょっと はずかしい)
 *   → すーっと いきを すって、足を ひらく → 口を 大きく あけて「あー!」と 歌う
 *   → 口から でた おんぷが ポールへ とんでいき、ぽん と「おと の ふだ」に なる(2まい)
 *   → こどもは にこにこ。うでを ひろげて 歌いきる → ほね が ひかって、絵が うすくなり、字「歌」が のこる
 *
 * 人は、ほんものの つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。あし は こし から。くび は みじかく どう の まんなか の上。
 *   足を ひらくと、こし が すこし 下がる(あしの 長さは かわらない)。
 *   字の画とは、だいたい 同じ場所・同じ むき に なる だけ(ぴったりには あわせない)。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '歌'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TOP = '#ef8a4b'
const TOP_DARK = '#d96f35'
const TOP_FAR = '#c9622d'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const GRASS = '#c5e8a9'
const BOARD = '#d9a35f'
const BOARD_DARK = '#c08840'
const PAPER = '#fffaf0'
const PINK = '#f07f9e'
const BLUE = '#5f7fd6'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const EYE = '#2b2b2b'

/** くぎり の時間(秒) */
const KID_IN = 0.5
const BREATH = 1.4
const SING = 2.3
/** 1つめ・2つめの おんぷ が とびだして、ふだ に とどく時間 */
const NOTE1: readonly [number, number] = [2.5, 3.7]
const NOTE2: readonly [number, number] = [3.4, 4.7]
const NOTE3: readonly [number, number] = [4.1, 5.5]
const INK = 6.2
const DONE = 9.6
const DURATION = 10.4

/** 足の つき方。足の長さは いつも同じ。ひらくと こし が下がる */
const LEG_LEN = 32.7
const FOOT_Y = 91.5
/** 足を ひらいたときの かくど(ま下から) */
const SPREAD_DEG = 23.4
const REST_DEG = 2
const HIP_FINAL_Y = FOOT_Y - LEG_LEN * Math.cos((SPREAD_DEG * Math.PI) / 180)
const FRONT_HIP_X = 65
const BACK_HIP_X = 70

/** おんぷの ふだ(左がわ)。ふだの 中心と、ぶらさげる よこぼうの 高さ */
type BoardSpec = { readonly x: number; readonly y: number; readonly w: number; readonly h: number; readonly ropeX: number; readonly barY: number }
const BOARD_1: BoardSpec = { x: 17, y: 32, w: 16, h: 12, ropeX: 25, barY: 21.5 }
const BOARD_2: BoardSpec = { x: 14.5, y: 64, w: 17.5, h: 12.5, ropeX: 23.2, barY: 54.5 }
/** 口から おんぷが でる ところ(あたまの 左がわ) */
const MOUTH_POS: readonly [number, number] = [59, 28.5]

const rad = (deg: number) => (deg * Math.PI) / 180

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[9, 9]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="8.3" y="0.8" width="1.5" height="3.2" rx="0.75" fill={SUN} transform={`rotate(${i * 45} 9 9)`} />
        ))}
      </Layer>
      <circle cx="9" cy="9" r={Math.max(0, 4.6 * sun)} fill={SUN} />
      <path d="M-4 99 Q18 78 44 92 Q72 72 113 94 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="92" cy="9" rx="7" ry="3" />
        <ellipse cx="97" cy="7.4" rx="4.6" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.4" fill={GRASS} />
      {[6, 30, 78, 102].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

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

/** くちから ふだ へ とぶ おんぷ。ゆるい 山なり で とんで、とどくと きえる */
function FlyingNote({ t, window, from, to, lift, color }: { readonly t: number; readonly window: readonly [number, number]; readonly from: readonly [number, number]; readonly to: readonly [number, number]; readonly lift: number; readonly color: string }) {
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

/** 2つめの おんぷ が とどいた ときの きらり */
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
function SoundRings({ t }: SceneProps) {
  const show = during(t, SING, SING + 1.0, 0.1)
  if (show <= 0) return null
  return (
    <g fill="none" stroke="#f3a6bb" strokeWidth="1.1" strokeLinecap="round" opacity={show}>
      {[0, 0.25, 0.5].map((offset) => {
        const p = span(t, SING + offset, SING + offset + 0.6)
        return <path key={offset} d="M0 -3.2 Q-2.6 0 0 3.2" transform={`translate(${MOUTH_POS[0] - 3 - p * 6} ${MOUTH_POS[1] - 1})`} opacity={Math.sin(p * Math.PI)} />
      })}
    </g>
  )
}

type Mood = 'shy' | 'breath' | 'sing'

/** うで: かた → ひじ → 手 。かくど は ま下から、+ が 右(x が ふえる ほう) */
function Arm({ shoulder, upperLen, foreLen, upper, fore, color }: { readonly shoulder: readonly [number, number]; readonly upperLen: number; readonly foreLen: number; readonly upper: number; readonly fore: number; readonly color: string }) {
  const elbowX = shoulder[0] + Math.sin(rad(upper)) * upperLen
  const elbowY = shoulder[1] + Math.cos(rad(upper)) * upperLen
  const handX = elbowX + Math.sin(rad(fore)) * foreLen
  const handY = elbowY + Math.cos(rad(fore)) * foreLen
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbowX} ${elbowY} L${handX} ${handY}`} fill="none" stroke={color} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={handX} cy={handY} r="3.2" fill={SKIN} />
    </>
  )
}

function Face({ mood, open }: { readonly mood: Mood; readonly open: number }) {
  const mouthRx = Math.max(0, 1.3 + 1.4 * open)
  const mouthRy = Math.max(0, 0.6 + 2.6 * open)
  return (
    <>
      <circle cx="68" cy="24" r="9.5" fill={SKIN} />
      <circle cx="76.2" cy="25.6" r="2.2" fill={SKIN_SHADE} />
      <path d="M58.6 22 C58 13 66 10.5 72 12.5 C77.5 14.5 78.4 20 77.6 24 C75.5 19.5 71 17.6 66 18 C62.5 18.3 60 19.8 58.6 22 Z" fill={HAIR} />
      {/* 立った かみ(11画目の はじまり の あたり) */}
      <path d="M64.6 15 Q65.2 11.8 67 13.2 Q68.4 10.6 69.4 13.6" fill="none" stroke={HAIR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="61.8" cy="28" r={mood === 'breath' ? 2.9 : 2.1} fill={CHEEK} opacity="0.6" />
      {mood === 'shy' && (
        <>
          <path d="M60.6 21.4 L64.2 19.8 M69 19.8 L72.6 21.4" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="62.8" cy="24" r="1.25" fill={EYE} />
          <circle cx="70.4" cy="24" r="1.25" fill={EYE} />
          <path d="M62.4 30.4 q1.6 -0.9 3.2 0" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'breath' && (
        <>
          <path d="M61.2 23.4 h3.4 M69 23.4 h3.4" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <ellipse cx="63.4" cy="29.4" rx="1.3" ry="1.5" fill={MOUTH} />
        </>
      )}
      {mood === 'sing' && (
        <>
          <path d="M61.2 23.4 Q62.9 21 64.6 23.4 M68.8 23.4 Q70.5 21 72.2 23.4" fill="none" stroke={EYE} strokeWidth="1.25" strokeLinecap="round" />
          <ellipse cx="63.8" cy="28.8" rx={mouthRx} ry={mouthRy} fill={MOUTH} />
          <ellipse cx="63.8" cy={28.8 + mouthRy * 0.45} rx={mouthRx * 0.6} ry={mouthRy * 0.42} fill="#ff8a8a" />
        </>
      )}
    </>
  )
}

type KidProps = {
  /** 足の ひらき 0(そろえる)〜 1(ひらく) */
  readonly stance: number
  readonly mood: Mood
  readonly open: number
  readonly breath: number
  readonly headTilt: number
  /** てまえの うで(むねに あてる 度合い)・うしろの うで(ひろげる 度合い) */
  readonly chest: number
  readonly reach: number
  readonly sway: number
}

function Kid({ stance, mood, open, breath, headTilt, chest, reach, sway }: KidProps) {
  const spread = REST_DEG + (SPREAD_DEG - REST_DEG) * stance
  const hipY = FOOT_Y - LEG_LEN * Math.cos(rad(spread))
  const drop = hipY - HIP_FINAL_Y
  const legDx = Math.sin(rad(spread)) * LEG_LEN
  // ほんもの の 人 のように、てまえの うで は むねへ、うしろの うで は よこへ ひろげる
  const front = { upper: mix(chest, 0, 1, -4, -30.5, (x) => x), fore: mix(chest, 0, 1, 2, 123.7, (x) => x) }
  const back = { upper: mix(reach, 0, 1, 6, 116.6, (x) => x) + sway * 3, fore: mix(reach, 0, 1, 4, 36.9, (x) => x) - sway * 4 }
  return (
    <>
      {/* うしろの うで: どう の うしろ */}
      <Layer y={drop}>
        <Arm shoulder={[72, 41]} upperLen={12} foreLen={10} upper={back.upper} fore={back.fore} color={TOP_FAR} />
      </Layer>
      {/* あし: こし から まっすぐ のびる(ひらくと こし が さがる) */}
      <path d={`M${BACK_HIP_X} ${hipY} L${BACK_HIP_X + legDx} ${FOOT_Y}`} stroke={PANTS_DARK} strokeWidth="6.2" strokeLinecap="round" />
      <ellipse cx={BACK_HIP_X + legDx - 1.2} cy={FOOT_Y + 1.1} rx="5" ry="2.6" fill={SHOE} />
      <path d={`M${FRONT_HIP_X} ${hipY} L${FRONT_HIP_X - legDx} ${FOOT_Y}`} stroke={PANTS} strokeWidth="6.2" strokeLinecap="round" />
      <ellipse cx={FRONT_HIP_X - legDx - 1.6} cy={FOOT_Y + 1.1} rx="5" ry="2.6" fill={SHOE} />
      <Layer y={drop}>
        {/* くび: どう の まんなか の上 に、みじかく */}
        <rect x="65.5" y="31" width="5" height="7" rx="2.2" fill={SKIN_SHADE} />
        <Layer scale={1 + breath * 0.07} origin={[68, 60]}>
          <rect x="61.5" y="36.5" width="13" height="25" rx="6.2" fill={TOP} />
          <path d="M63.4 56 h9.2" stroke={TOP_DARK} strokeWidth="1.5" strokeLinecap="round" />
        </Layer>
        <Layer rotate={headTilt} origin={[68, 34]}>
          <Face mood={mood} open={open} />
        </Layer>
        {/* てまえの うで: どう の まえ */}
        <Arm shoulder={[64.5, 41]} upperLen={10} foreLen={9} upper={front.upper} fore={front.fore} color={TOP_DARK} />
      </Layer>
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 14)

  const kidIn = span(t, KID_IN, KID_IN + 0.5, backOut)
  const stance = span(t, BREATH, BREATH + 0.9, easeInOut)
  const chest = span(t, BREATH - 0.1, BREATH + 0.7, easeInOut)
  const reach = span(t, SING + 0.4, SING + 1.1, backOut)
  const inhale = span(t, BREATH, SING - 0.05, easeInOut) * (1 - span(t, SING - 0.05, SING + 0.25))
  const singing = t >= SING
  const mood: Mood = singing ? 'sing' : t >= BREATH + 0.2 ? 'breath' : 'shy'
  const settle = 1 - span(t, 5.0, 5.4)
  const open = singing ? span(t, SING, SING + 0.25, backOut) * (0.78 + 0.22 * Math.abs(wave(t, 0.7)) * settle + 0.22 * (1 - settle)) : 0
  const headTilt = mix(t, BREATH, SING, -5, 9) + (singing ? wave(t, 1.4) * 2 * settle : 0)
  const sway = singing ? wave(t, 1.1) * settle : 0
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  const pop1 = span(t, NOTE1[1], NOTE1[1] + 0.5, backOut)
  const pop2 = span(t, NOTE2[1], NOTE2[1] + 0.5, backOut)
  const swing1 = wave(t - NOTE1[1], 1.3) * 7 * (1 - span(t, NOTE1[1], NOTE1[1] + 2.2))
  const swing2 = wave(t - NOTE2[1], 1.3) * 7 * (1 - span(t, NOTE2[1], NOTE2[1] + 2.2))

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Pole t={t} />
        <SongBoard spec={BOARD_1} pop={pop1} swing={swing1} color={PINK} />
        <SongBoard spec={BOARD_2} pop={pop2} swing={swing2} color={BLUE} />
        <Layer opacity={kidIn} scale={kidIn} origin={[68, 94]} x={sway * 0.5}>
          <ellipse cx="68" cy="97.2" rx={11 + 6 * stance} ry="2.4" fill="#000000" opacity="0.12" />
          <Kid stance={stance} mood={mood} open={open} breath={inhale + (singing ? 0.4 * Math.abs(wave(t, 0.7)) * settle : 0)} headTilt={headTilt} chest={chest} reach={reach} sway={sway} />
        </Layer>
        <SoundRings t={t} />
        <FlyingNote t={t} window={NOTE1} from={MOUTH_POS} to={[25, 38]} lift={22} color={PINK} />
        <FlyingNote t={t} window={NOTE2} from={MOUTH_POS} to={[23, 70]} lift={30} color={BLUE} />
        <FlyingNote t={t} window={NOTE3} from={MOUTH_POS} to={[34, 7]} lift={6} color="#f3a74a" />
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
