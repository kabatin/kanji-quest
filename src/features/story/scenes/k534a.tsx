/*
 * 半(はん): 大きな うしを まんなかで 2つに わける。(共通部品 sceneFigures で 書きなおした もの)
 * ( 大きな「うしの かたちの パン」を、おなかが すいた ともだちと はんぶんこ )
 *
 * ほね(画と絵の対応)  ※ 人は 本当の 体の 大きさ で 描く ので、字とは「だいたい」重なる くらい
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
 * 人は Person。ともだち の あるきは walk(右から 左むき)、パンを つかむ のは 手を { to } で パンの ふち へ。
 *   字の形になるのは、わりめ が まんなかに できた さいごの しゅんかん だけ。
 * うしパン・テーブル・パンの くずは ここで 描く。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, HANG_ARM, LOOKS, mixLimb, Notice, Person, personRig, walk, type Expression, type Limb, type Point } from '../sceneFigures'

const CHAR = '半'

const EYE = '#2b2b2b'
const CHEEK = '#ff9d9d'
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
/** 子どもの 立つ場所(こし の x)と 地面 と 背たけ */
const GIRL_X = 10
const FRIEND_X = 99
const GROUND = 98
const KID_HEIGHT = 44
/** パンを つかむ 高さ(てまえの 手 / むこうの 手) */
const GRIP_NEAR_Y = 73
const GRIP_FAR_Y = 77

const GIRL_LOOK = { ...LOOKS.little, top: '#f0708f' } as const
const BOY_LOOK = { ...LOOKS.boy, hair: '#3c3030', top: '#f5a23c' } as const

/* ───────── 地面・テーブル ───────── */

/** パンを のせる テーブル。足は 左右の ふち に 2本。 */
function Table({ t }: SceneProps) {
  const rise = span(t, 0, 0.4, easeOut)
  return (
    <Layer opacity={rise} scaleY={0.8 + 0.2 * rise} origin={[54.5, GROUND]}>
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

/** ともだちの おなかの「ぐう」。おなかの まえ(左)に ひろがる ふるえ。 */
function Rumble({ t, x }: SceneProps & { readonly x: number }) {
  const show = during(t, FRIEND_HERE - 0.4, GRAB + 0.2, 0.2)
  if (show <= 0) return null
  const pulse = 0.5 + 0.5 * wave(t, 0.5)
  return (
    <g opacity={show} fill="none" stroke="#e06a3a" strokeWidth="0.9" strokeLinecap="round">
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${x - 7.4 - i * 2.8 - pulse * 1.2} 68 Q${x - 9.4 - i * 2.8 - pulse * 1.2} 71 ${x - 7.4 - i * 2.8 - pulse * 1.2} 74`} opacity={1 - i * 0.28} />
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
  const grabAmt = span(t, GRAB, GRAB + 0.55, easeInOut)
  const bounce = Math.abs(wave(t, 0.6)) * 1.3 * span(t, PULLED, PULLED + 0.3) * during(t, PULLED, INK + 0.4, 0.1)
  const cheerArm: Limb = { swing: 140, bend: 24 }

  // 女の子(主役): はじめは とくいげ、気づいて(!)、にっこり、わけて うれしい
  const girlPop = span(t, 0.2, 0.75, backOut)
  const cheer = during(t, GIRL_CHEER, FRIEND_IN + 0.3, 0.3)
  const hop = Math.abs(wave(t, 0.7)) * 1.4 * cheer
  const girlFace: Expression = t < NOTICE - 0.45 ? 'smile' : t < NOTICE + 0.3 ? 'surprised' : t < PULLED ? 'smile' : 'joy'
  const girlX = GIRL_X - pull + tug
  const girlHold: Point = [BREAD_LEFT - pull + 1.2, GRIP_NEAR_Y]
  const girlHoldFar: Point = [BREAD_LEFT - pull + 1.2, GRIP_FAR_Y]
  const girlLeft = mixLimb(mixLimb(HANG_ARM, cheerArm, cheer), { to: girlHold }, grabAmt)
  const girlRight = mixLimb(mixLimb(HANG_ARM, cheerArm, cheer), { to: girlHoldFar }, grabAmt)
  const girl = {
    x: girlX,
    y: GROUND - hop - bounce,
    build: 'child',
    height: KID_HEIGHT,
    facing: 'right',
    look: GIRL_LOOK,
    face: girlFace,
    pose: { leftArm: girlLeft, rightArm: girlRight, head: girlFace === 'surprised' ? -3 : 0 },
  } as const
  const girlHead = personRig({ ...girl, pose: {} }).world.head

  // ともだち: おなかを おさえて しょんぼり あるいてくる → 気づいて よろこぶ
  const w = walk(t, { from: 140, to: FRIEND_X, start: FRIEND_IN - 0.2, end: FRIEND_HERE, build: 'child', height: KID_HEIGHT })
  const friendX = w.x + pull - tug
  const friendFace: Expression = t < GRAB - 0.1 ? 'sad' : t < PULL ? 'surprised' : 'joy'
  const bellyAmt = span(t, FRIEND_HERE - 0.5, FRIEND_HERE, easeOut)
  const belly: Limb = { to: [friendX - 4, GROUND - 22] }
  const holdNear: Limb = { to: [BREAD_RIGHT + pull - 1.2, GRIP_NEAR_Y] }
  const holdFar: Limb = { to: [BREAD_RIGHT + pull - 1.2, GRIP_FAR_Y] }
  const friendLeft = mixLimb(mixLimb(w.pose.leftArm ?? HANG_ARM, belly, bellyAmt), holdFar, grabAmt)
  const friendRight = mixLimb(mixLimb(w.pose.rightArm ?? HANG_ARM, belly, bellyAmt), holdNear, grabAmt)
  const friend = {
    ...w,
    x: friendX,
    y: GROUND - bounce,
    look: BOY_LOOK,
    face: friendFace,
    pose: { ...w.pose, leftArm: friendLeft, rightArm: friendRight, torso: friendFace === 'sad' ? 6 : 0, head: friendFace === 'sad' ? 6 : 0 },
  } as const

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} ground={98.4} tufts={[4, 46, 70, 104]} />
        <Table t={t} />
        <Bread t={t} pull={pull} />
        <Crumbs t={t} />

        <Layer scale={girlPop} origin={[girlX, GROUND]}>
          <Person {...girl} />
        </Layer>
        <Notice x={girlHead[0] + 1} y={girlHead[1]} r={6.5} show={during(t, NOTICE - 0.45, NOTICE + 0.5, 0.15)} dir={-1} />

        <Person {...friend} />
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
