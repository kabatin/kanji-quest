/*
 * 半(はん): 大きな うしを まんなかで 2つに わける。
 * ( 大きな「うしの かたちの パン」を、おなかが すいた ともだちと はんぶんこ )
 *
 * ほね(画と絵の対応)
 *   1・2画目   … うしの 左右の つの(あたまの上から、外がわへ のびる)
 *   3画目(一)  … あたまの よこに ひらいた 左右の みみ
 *   4画目(一)  … むねに まいた 大きな 赤いリボン
 *   5画目(丨)  … まんなかの わりめ(ここで 2つに わかれる)
 *
 * ながれ
 *   うしパンが ぽん と でき、女の子が 「大きいな」と とくいげ
 *   → おなかが ぐう と なった ともだちが しょんぼり あるいてくる
 *   → 女の子が 気づいて(!)、にっこり。パンの 左と右を それぞれ つかむ
 *   → ぐいっと ひっぱって、まんなかで 2つに わける(パンの くずが ぽろぽろ)
 *   → 2人とも にこにこ。ほね が ひかって、絵が うすくなり、字「半」が のこる
 *
 * 人は、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく、どう の 上。
 *   うしの 耳は あたまの よこに ひらき、つのは あたまの上の そとがわから 生える。
 *   字の形になるのは、わりめ が まんなかに できた さいごの しゅんかん だけ。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '半'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const CHEEK = '#ff9d9d'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const GIRL_HAIR = '#5a3b2a'
const GIRL_DRESS = '#f0708f'
const GIRL_DRESS_DARK = '#d9577a'
const BOY_HAIR = '#3c3030'
const BOY_TUNIC = '#f5a23c'
const BOY_TUNIC_DARK = '#dd8b27'
const BARK = '#b7824f'
const BARK_DARK = '#946537'
const COW = '#fffaf0'
const COW_SHADE = '#eadfc4'
const COW_SPOT = '#6b4a36'
const HORN = '#f6e7bf'
const MUZZLE = '#f6b6b2'
const NOSTRIL = '#c4766f'
const RIBBON = '#e8534a'
const RIBBON_LIGHT = '#f58a80'
const CRUMB = '#f1e0b4'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'

/** くぎり の時間(秒) */
const BREAD_UP = 0.6
const GIRL_CHEER = 1.0
const FRIEND_IN = 1.6
const FRIEND_HERE = 3.0
const NOTICE = 3.6
const GRAB = 4.2
const PULL = 4.9
const PULLED = 5.7
const INK = 6.7
const DONE = 9.3
const DURATION = 9.9

/** パンの まんなか(5画目) と、パンの 左右の はし・ふち(おさら の上) */
const CENTER_X = 54.5
const BREAD_LEFT = 17
const BREAD_RIGHT = 91
const BREAD_BOTTOM = 89
/** ひっぱって ひらく 長さ(左右 それぞれ) */
const PULL_DISTANCE = 3
/** 子どもの 立つ場所(足もと の x)と 地面 */
const GIRL_X = 11
const FRIEND_X = 97.5
const GROUND_Y = 98
/** 子どもの かた の 高さ(子どもの 体の ざひょう で) */
const SHOULDER_Y = 76.5
const ARM_PART = 6.3

type Point = readonly [number, number]

const lerpPoint = (a: Point, b: Point, k: number): Point => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/* ───────── 地面・テーブル ───────── */

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
      {/* とおくの おか と、ゆっくり ながれる 雲 */}
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="62" cy="9" rx="7" ry="3.2" />
        <ellipse cx="67" cy="7.4" rx="5" ry="3.2" />
        <ellipse cx="-4" cy="30" rx="6" ry="2.8" />
        <ellipse cx="0.5" cy="28.6" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98.4" rx="53" ry="5.2" fill={GRASS} />
      {[4, 46, 70, 104].map((x) => (
        <path key={x} d={`M${x} 98 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** パンを のせる テーブル。足は 左右の ふち に 2本。 */
function Table({ t }: SceneProps) {
  const rise = span(t, 0, 0.4, easeOut)
  return (
    <Layer opacity={rise} scaleY={0.8 + 0.2 * rise} origin={[54.5, GROUND_Y]}>
      <ellipse cx="54.5" cy="98" rx="40" ry="2.4" fill="#000000" opacity="0.1" />
      <rect x="21" y="92" width="3.4" height="6" rx="1" fill={BARK_DARK} />
      <rect x="85" y="92" width="3.4" height="6" rx="1" fill={BARK_DARK} />
      <rect x="18" y="89" width="73" height="3.6" rx="1.4" fill={BARK} />
      <rect x="18" y="91.4" width="73" height="1.2" rx="0.6" fill={BARK_DARK} />
    </Layer>
  )
}

/* ───────── うしパン ───────── */

/** うしの かたちの パン(ぜんたい)。正面むき。まんなかで 左右に わかれる。 */
function CowBread() {
  return (
    <>
      {/* つの: 1・2画目。あたまの上の はし から、外がわへ のびる */}
      <Bone char={CHAR} n={1} color={HORN} width={5.2} />
      <Bone char={CHAR} n={2} color={HORN} width={5.2} />
      {/* みみ: 3画目。あたまの よこへ ひらく */}
      <g transform="rotate(-8 33 48)">
        <ellipse cx="32" cy="48" rx="8.4" ry="3.8" fill={COW_SPOT} />
        <ellipse cx="33.4" cy="48" rx="4.6" ry="1.9" fill={MUZZLE} />
      </g>
      <g transform="rotate(8 76 48)">
        <ellipse cx="77" cy="48" rx="8.4" ry="3.8" fill={COW_SPOT} />
        <ellipse cx="75.6" cy="48" rx="4.6" ry="1.9" fill={MUZZLE} />
      </g>
      {/* どう */}
      <rect x={BREAD_LEFT} y="58" width={BREAD_RIGHT - BREAD_LEFT} height={BREAD_BOTTOM - 58} rx="12" fill={COW_SHADE} />
      <rect x={BREAD_LEFT} y="58" width={BREAD_RIGHT - BREAD_LEFT} height={BREAD_BOTTOM - 61.5} rx="12" fill={COW} />
      <ellipse cx="28" cy="78" rx="7.5" ry="5.4" fill={COW_SPOT} />
      <ellipse cx="82" cy="75" rx="6" ry="6.4" fill={COW_SPOT} />
      {/* むねの 赤いリボン: 4画目 */}
      <rect x={BREAD_LEFT} y="62.6" width={BREAD_RIGHT - BREAD_LEFT} height="5.8" rx="1.2" fill={RIBBON} />
      <rect x={BREAD_LEFT} y="63.6" width={BREAD_RIGHT - BREAD_LEFT} height="1.1" fill={RIBBON_LIGHT} />
      {/* あたま */}
      <rect x="36" y="30" width="37" height="33" rx="15" fill={COW_SHADE} />
      <rect x="36" y="30" width="37" height="29.5" rx="15" fill={COW} />
      <ellipse cx="66" cy="40" rx="5.4" ry="5" fill={COW_SPOT} />
      <path d="M49 31.4 Q54.5 27.2 60 31.4 Q54.5 34 49 31.4 Z" fill="#3b2a22" />
      <circle cx="46.5" cy="45" r="1.9" fill={EYE} />
      <circle cx="62.5" cy="45" r="1.9" fill={EYE} />
      <circle cx="42.5" cy="51" r="2" fill={CHEEK} opacity="0.5" />
      <circle cx="66.5" cy="51" r="2" fill={CHEEK} opacity="0.5" />
      <ellipse cx="54.5" cy="55.5" rx="11" ry="6.6" fill={MUZZLE} />
      <ellipse cx="50.6" cy="54.6" rx="1.1" ry="1.5" fill={NOSTRIL} />
      <ellipse cx="58.4" cy="54.6" rx="1.1" ry="1.5" fill={NOSTRIL} />
      <path d="M51.5 58.6 Q54.5 60.4 57.5 58.6" fill="none" stroke={NOSTRIL} strokeWidth="0.9" strokeLinecap="round" />
    </>
  )
}

/** 左右の はんぶん。まんなかで きって、わりめ を すこし 見せる。 */
function BreadHalf({ side, shift }: { readonly side: 'left' | 'right'; readonly shift: number }) {
  const isLeft = side === 'left'
  const left = isLeft ? -30 : CENTER_X - 0.3
  const width = isLeft ? CENTER_X + 30.3 : 90
  return (
    <Layer x={shift}>
      {/* 入れ子の svg で、まんなかから 左 / 右だけ を 見せる */}
      <svg x={left} y="-10" width={width} height="130" viewBox={`${left} -10 ${width} 130`} overflow="hidden">
        <CowBread />
        <rect x={isLeft ? CENTER_X - 1.4 : CENTER_X} y="31" width="1.4" height={BREAD_BOTTOM - 31} fill={CRUMB} />
      </svg>
    </Layer>
  )
}

function Bread({ t, pull }: SceneProps & { readonly pull: number }) {
  const pop = span(t, 0.05, BREAD_UP, backOut)
  const whole = pull <= 0.01
  return (
    <Layer scale={pop} origin={[CENTER_X, BREAD_BOTTOM]}>
      {/* おさら */}
      <ellipse cx="54.5" cy="89.6" rx="39" ry="2.2" fill="#ffffff" />
      <ellipse cx="54.5" cy="90.2" rx="39" ry="1.4" fill="#d9e2ec" opacity="0.8" />
      {whole ? (
        <>
          <CowBread />
          {/* まんなかの うすい きりめ */}
          <path d={`M${CENTER_X} 33 V${BREAD_BOTTOM}`} stroke="#d9c49a" strokeWidth="0.7" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <BreadHalf side="left" shift={-pull} />
          <BreadHalf side="right" shift={pull} />
        </>
      )}
    </Layer>
  )
}

/** わけた とき、わりめ から こぼれる パンの くず。わりめの すきまを おちて、おさら に のこる。 */
function Crumbs({ t }: SceneProps) {
  const p = span(t, PULL - 0.1, PULLED + 0.4)
  if (p <= 0) return null
  const drift = [-2.2, 1.6, -0.6, 2.4, -1.6, 0.6]
  return (
    <g fill={CRUMB}>
      {drift.map((dx, i) => {
        const q = Math.min(1, p * (1.2 + i * 0.05))
        const y = 56 + i * 3 + easeOut(q) * (BREAD_BOTTOM - 58 - i * 3) + Math.sin(q * 6 + i) * 0.4
        return <circle key={i} cx={CENTER_X + dx * (0.6 + q * 0.5)} cy={Math.min(y, 88.4)} r={1 - (i % 3) * 0.18} />
      })}
    </g>
  )
}

/* ───────── 子ども ───────── */

type Mood = 'proud' | 'surprised' | 'kind' | 'happy' | 'sad'

type Look = {
  readonly hair: string
  readonly outfit: string
  readonly outfitDark: string
  readonly girl: boolean
}

const GIRL_LOOK: Look = { hair: GIRL_HAIR, outfit: GIRL_DRESS, outfitDark: GIRL_DRESS_DARK, girl: true }
const BOY_LOOK: Look = { hair: BOY_HAIR, outfit: BOY_TUNIC, outfitDark: BOY_TUNIC_DARK, girl: false }

/** かた から出て ひじ で まがる うで。shoulder・hand は 子どもの 体の ざひょう(さきが +x)。 */
function Arm({ shoulder, hand, color }: { readonly shoulder: Point; readonly hand: Point; readonly color: string }) {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const distance = Math.hypot(dx, dy) || 0.001
  // うでの 長さ より とおくへは とどかない
  const reach = Math.min(distance, ARM_PART * 2 - 0.05)
  const end: Point = [shoulder[0] + (dx / distance) * reach, shoulder[1] + (dy / distance) * reach]
  const height = Math.sqrt(Math.max(ARM_PART ** 2 - (reach / 2) ** 2, 0))
  // ひじ は、かた と 手の まんなかから ななめ下へ でる
  const sign = dx >= 0 ? 1 : -1
  const elbow: Point = [(shoulder[0] + end[0]) / 2 + sign * (-dy / distance) * height, (shoulder[1] + end[1]) / 2 + sign * (dx / distance) * height]
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${end[0]} ${end[1]}`} fill="none" stroke={color} strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={end[0]} cy={end[1]} r="2.2" fill={SKIN} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  const eyes = [1.2, 4.6]
  const smile = <path d="M2 68.2 Q3.4 69.8 4.8 68.2" fill="none" stroke={MOUTH} strokeWidth="0.9" strokeLinecap="round" />
  if (mood === 'happy') {
    return (
      <>
        {eyes.map((x) => (
          <path key={x} d={`M${x - 1.1} 65.9 Q${x} 64.1 ${x + 1.1} 65.9`} fill="none" stroke={EYE} strokeWidth="0.9" strokeLinecap="round" />
        ))}
        <path d="M2.1 67.7 Q3.5 71.4 4.9 67.7 Z" fill={MOUTH} />
      </>
    )
  }
  if (mood === 'sad') {
    return (
      <>
        {eyes.map((x) => (
          <circle key={x} cx={x} cy="65.6" r="0.95" fill={EYE} />
        ))}
        <path d="M0 63.9 L2.2 62.7 M3.6 62.7 L5.8 63.9" stroke={EYE} strokeWidth="0.7" strokeLinecap="round" fill="none" />
        <path d="M2.2 69.6 Q3.5 68.1 4.8 69.6" fill="none" stroke={MOUTH} strokeWidth="0.9" strokeLinecap="round" />
      </>
    )
  }
  if (mood === 'surprised') {
    return (
      <>
        {eyes.map((x) => (
          <circle key={x} cx={x} cy="65.4" r="1.35" fill={EYE} />
        ))}
        <ellipse cx="3.5" cy="69" rx="0.95" ry="1.25" fill={MOUTH} />
      </>
    )
  }
  return (
    <>
      {eyes.map((x) => (
        <circle key={x} cx={x} cy="65.5" r="0.95" fill={EYE} />
      ))}
      {smile}
    </>
  )
}

type KidProps = {
  readonly look: Look
  readonly mood: Mood
  readonly nearHand: Point
  readonly farHand: Point
  readonly step: number
  readonly headTilt: number
}

/** 子ども(足もと が x=0、さき が +x むき)。あたまは 体より 少し大きい。くび は みじかい。 */
function Kid({ look, mood, nearHand, farHand, step, headTilt }: KidProps) {
  return (
    <>
      {/* むこうの うで: 体の うしろ */}
      <Arm shoulder={[-1.2, SHOULDER_Y]} hand={farHand} color={look.outfitDark} />
      {/* 足 */}
      <Layer rotate={step * 22} origin={[-2.2, 87]}>
        <rect x="-3.6" y="87" width="2.8" height="8.8" rx="1.4" fill={PANTS} />
        <ellipse cx="-1.8" cy="96.6" rx="3.2" ry="1.7" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 22} origin={[2.2, 87]}>
        <rect x="0.8" y="87" width="2.8" height="8.8" rx="1.4" fill={PANTS} />
        <ellipse cx="2.6" cy="96.6" rx="3.2" ry="1.7" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう と あたま に はさまれる */}
      <rect x="-1.6" y="70" width="3.2" height="5" rx="1.4" fill={SKIN_SHADE} />
      {/* どう */}
      {look.girl ? (
        <path d="M-4.4 74.6 H4.4 L6.8 89.6 H-6.8 Z" fill={look.outfit} stroke={look.outfit} strokeWidth="2.4" strokeLinejoin="round" />
      ) : (
        <rect x="-5" y="73" width="10" height="16.5" rx="4.2" fill={look.outfit} />
      )}
      <path d="M-4.6 83 H4.6" stroke={look.outfitDark} strokeWidth="1.1" strokeLinecap="round" />
      {/* てまえの うで */}
      <Arm shoulder={[1.4, SHOULDER_Y]} hand={nearHand} color={look.outfit} />
      {/* あたま: かみ → かお → まえがみ → 目と口 */}
      <Layer rotate={headTilt} origin={[0, 71]}>
        {look.girl && (
          <>
            <circle cx="-5.6" cy="67.4" r="2.5" fill={look.hair} />
            <circle cx="-5.4" cy="64.6" r="1" fill={GIRL_DRESS_DARK} />
          </>
        )}
        <circle cx="-0.8" cy="64.2" r="6.6" fill={look.hair} />
        <circle cx="0.8" cy="65.8" r="5.9" fill={SKIN} />
        <path d="M-4.4 62.4 Q0.8 57.8 6.2 63 Q2.4 61 -4.4 62.4 Z" fill={look.hair} />
        <circle cx="5.7" cy="67.8" r="1.2" fill={CHEEK} opacity="0.55" />
        <Face mood={mood} />
        {look.girl && (
          <>
            <circle cx="-2.6" cy="58.8" r="1.5" fill={GIRL_DRESS} />
            <circle cx="0.2" cy="58.2" r="1.5" fill={GIRL_DRESS} />
          </>
        )}
      </Layer>
    </>
  )
}

/** 気づいた しるし「!」 */
function Notice({ t, x }: SceneProps & { readonly x: number }) {
  const show = during(t, NOTICE - 0.45, NOTICE + 0.5, 0.15)
  if (show <= 0) return null
  const pop = span(t, NOTICE - 0.45, NOTICE - 0.2, backOut)
  return (
    <Layer opacity={show} scale={pop} origin={[x, 54]}>
      <rect x={x - 1.2} y="44" width="2.4" height="7" rx="1.2" fill="#f0a020" />
      <circle cx={x} cy="54" r="1.5" fill="#f0a020" />
    </Layer>
  )
}

/** ともだちの おなかの「ぐう」。おなかの まえ(左)に ひろがる ふるえ。 */
function Rumble({ t, x }: SceneProps & { readonly x: number }) {
  const show = during(t, FRIEND_HERE - 0.4, GRAB + 0.2, 0.2)
  if (show <= 0) return null
  const pulse = 0.5 + 0.5 * wave(t, 0.5)
  return (
    <g opacity={show} fill="none" stroke="#e06a3a" strokeWidth="0.9" strokeLinecap="round">
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${x - 7.4 - i * 2.8 - pulse * 1.2} 78 Q${x - 9.4 - i * 2.8 - pulse * 1.2} 81 ${x - 7.4 - i * 2.8 - pulse * 1.2} 84`} opacity={1 - i * 0.28} />
      ))}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)

  // ひっぱる: まず ぐいぐい ためして、わりめ が ひらく
  const tug = wave(t, 0.12) * 0.35 * during(t, GRAB + 0.3, PULL, 0.15)
  const open = PULL_DISTANCE * span(t, PULL, PULLED, easeOut)
  const pull = open > 0 ? open : 0

  // 女の子(主役): はじめは とくいげ、気づいて(!)、にっこり、わけて うれしい
  const girlPop = span(t, 0.2, 0.75, backOut)
  const cheer = during(t, GIRL_CHEER, FRIEND_IN + 0.3, 0.3)
  const hop = Math.abs(wave(t, 0.7)) * 1.4 * cheer
  const girlMood: Mood = t < NOTICE - 0.45 ? 'proud' : t < NOTICE + 0.3 ? 'surprised' : t < PULLED ? 'kind' : 'happy'
  const girlHang: Point = [1.6, SHOULDER_Y + 12]
  const girlCheer: Point = [5, 67]
  const grabAmt = span(t, GRAB, GRAB + 0.55, easeInOut)
  const girlIdle = lerpPoint(girlHang, girlCheer, cheer)
  const girlNear = lerpPoint(girlIdle, [BREAD_LEFT - GIRL_X + 1.2 - (open > 0 ? 0 : 0), 73], grabAmt)
  const girlFar = lerpPoint(lerpPoint([-0.4, SHOULDER_Y + 12], [-1, 68], cheer), [BREAD_LEFT - GIRL_X + 1.2, 78], grabAmt)
  const girlX = GIRL_X - pull + tug

  // ともだち: おなかを おさえて しょんぼり あるいてくる → 気づいて よろこぶ
  const friendWalk = mix(t, FRIEND_IN - 0.2, FRIEND_HERE, 140, FRIEND_X, easeOut)
  const walking = 1 - span(t, FRIEND_HERE - 0.25, FRIEND_HERE)
  const stride = t < FRIEND_IN - 0.2 ? 0 : Math.sin((t - FRIEND_IN) * Math.PI * 2 * 1.8) * walking
  const friendX = friendWalk + pull - tug
  const friendMood: Mood = t < GRAB - 0.1 ? 'sad' : t < PULL ? 'surprised' : 'happy'
  const bellyAmt = span(t, FRIEND_HERE - 0.5, FRIEND_HERE, easeOut)
  const friendHang: Point = [1.2 + stride * -2, SHOULDER_Y + 11.5]
  const friendIdle = lerpPoint(friendHang, [3.4, 81], bellyAmt)
  const friendNear = lerpPoint(friendIdle, [FRIEND_X - (BREAD_RIGHT - 0.8) + 0, 73], grabAmt)
  const friendFar = lerpPoint(lerpPoint([-0.8 + stride * 2, SHOULDER_Y + 11.5], [2.4, 83], bellyAmt), [FRIEND_X - (BREAD_RIGHT - 0.8), 78], grabAmt)
  const friendBob = -Math.abs(stride) * 1.1
  const joy = span(t, PULLED, PULLED + 0.3) * during(t, PULLED, INK + 0.4, 0.1)
  const bounce = Math.abs(wave(t, 0.6)) * 1.3 * joy

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Table t={t} />
        <Bread t={t} pull={pull} />
        <Crumbs t={t} />

        {/* 女の子 */}
        <Layer scale={girlPop} origin={[girlX, GROUND_Y]}>
          <ellipse cx={girlX} cy="97.6" rx="7" ry="1.8" fill="#000000" opacity="0.12" />
          <Layer x={girlX} y={-hop - bounce}>
            <Kid look={GIRL_LOOK} mood={girlMood} nearHand={girlNear} farHand={girlFar} step={0} headTilt={girlMood === 'surprised' ? -3 : 0} />
          </Layer>
        </Layer>
        <Notice t={t} x={girlX + 3} />

        {/* ともだち(左むき) */}
        <ellipse cx={friendX} cy="97.6" rx="7" ry="1.8" fill="#000000" opacity="0.12" />
        <Layer x={friendX} y={friendBob - bounce} scaleX={-1}>
          <Kid look={BOY_LOOK} mood={friendMood} nearHand={friendNear} farHand={friendFar} step={stride} headTilt={friendMood === 'sad' ? 6 : 0} />
        </Layer>
        <Rumble t={t} x={friendX} />
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
    { at: 0, label: '大きな うしパンが できる。女の子は とくいげ', sound: 'pop' },
    { at: FRIEND_IN, label: 'おなかが ぐう の ともだちが しょんぼり あるいてくる' },
    { at: NOTICE, label: '女の子が 気づいて、にっこり', sound: 'pop' },
    { at: GRAB, label: 'パンの 左と右を つかむ' },
    { at: PULL, label: 'ぐいっと ひっぱって、まんなかで 2つに わける', sound: 'pop' },
    { at: PULLED, label: 'はんぶんこ。2人とも にこにこ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '半 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
