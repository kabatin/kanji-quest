/*
 * 妹(いもうと): 女の子の なかま。右は「未(マイ)」= まだ のびている わかい木。年下の おんなの子。
 * (共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)
 *   1〜3画目(女) … おねえさん。あたま から 体、のばした うで(3画目 は 手を さしだす あたり)
 *   4画目(一)    … わかい木の 上の みじかい えだ
 *   5画目(一)    … わかい木の 下の ながい えだ
 *   6画目(丨)    … わかい木の みき
 *   7・8画目     … 木の 左右に たれた 大きな えだ
 *   (「未」は まだ 大きくなりきらない 木。その下に いる 小さい子 = 年下の いもうと。女の字とは だいたい 重なる くらい)
 *
 * ながれ
 *   わかい木が そだつ。木の下で、小さい いもうと が ひとりで さびしくて ぽろり と なみだ
 *   → 左から おねえさん が あるいてくる。いもうと が ふりむいて「あっ!」
 *   → おねえさん が 手を さしだす。いもうと は ぱっと わらって 手を つなぐ(はずむ・ハートが ふわり)
 *   → ほね が ひかって、絵が うすくなり、字「妹」が のこる
 *
 * 人は Person。おねえさんは teen、いもうとは child(体格で 見分ける)。あるきは walk、ふりむきは turnAround。
 * 手を つなぐ ところは { to } で 同じ 点へ。木(未)は 本来 その形の ほね なので Bone で 描く。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Bird, ByDepth, Hearts, LOOKS, mixLimb, Notice, Person, personRig, turnAround, walk, type Point } from '../sceneFigures'

const CHAR = '妹'

const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'

/** くぎり の時間(秒) */
const WALK = 1.3
const NOTICE = 2.4
const ARRIVE = 3.3
const REACH = 3.5
const JOIN = 4.3
const INK = 6.4
const DONE = 9.7
const DURATION = 10.3

/** 地面の高さ(ふたりの 足もと) */
const GROUND = 96
/** おねえさん・いもうと の 場所(x)と 背の高さ */
const BIG_STOP = 31
const BIG_HEIGHT = 60
const KID_X = 60
const KID_HEIGHT = 38
/** 手を つなぐ場所(木の 左がわ、いもうと の かた の すこし下) */
const MEET: Point = [47, 70]

const BIG_LOOK = { ...LOOKS.girl, top: '#ef6f8f', accent: '#4f9be0' } as const
const KID_LOOK = { ...LOOKS.little, top: '#ffc233', accent: '#e8534a' } as const

/* ───────── 木(未) ───────── */

/** 小さな はっぱの かたまり(えだの先) */
function Tuft({ cx, cy, r }: { readonly cx: number; readonly cy: number; readonly r: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={LEAF_DARK} />
      <circle cx={cx - r * 0.25} cy={cy - r * 0.3} r={r * 0.72} fill={LEAF} />
    </>
  )
}

/** まだ のびている わかい木。みき が 下から のびて、えだ が ひろがり、葉が ぽん としげる */
function Tree({ t }: SceneProps) {
  const trunk = span(t, 0, 0.55, backOut)
  const boughs = span(t, 0.3, 0.8, backOut)
  const leaves = span(t, 0.5, 1.05, backOut)
  const sway = wave(t, 3.4) * 1.2
  return (
    <>
      <ellipse cx="67" cy="97.6" rx={14 * trunk} ry="2.6" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.6 + 0.4 * trunk} scaleY={trunk} origin={[66.8, 96]}>
        <path d="M60 97 Q65.5 92 65 86 L69 86 Q68.8 92 74 97 Z" fill={BARK} />
        <Bone char={CHAR} n={6} color={BARK} width={5.6} />
        <path d="M65 62 q1.2 4 0 8 M68.6 76 q-1 4 0.2 8" fill="none" stroke={BARK_DARK} strokeWidth="1.1" strokeLinecap="round" />
      </Layer>
      <Layer scale={boughs} origin={[66.8, 45]}>
        <Bone char={CHAR} n={4} color={BARK} width={3.6} />
        <Bone char={CHAR} n={5} color={BARK} width={4.4} />
      </Layer>
      <Layer scale={boughs} origin={[66, 52]}>
        <Bone char={CHAR} n={7} color={BARK} width={4.4} />
        <Bone char={CHAR} n={8} color={BARK} width={4.4} />
      </Layer>
      {/* えだの先 の 小さな しげみ */}
      <Layer scale={leaves} origin={[66.8, 50]} rotate={sway * 0.6}>
        <Tuft cx={45.5} cy={51} r={3.8} />
        <Tuft cx={92} cy={48.4} r={3.8} />
        <Tuft cx={37.4} cy={87.2} r={3.4} />
        <Tuft cx={95.6} cy={84} r={3.8} />
        <Tuft cx={52.4} cy={33.6} r={3.2} />
        <Tuft cx={82.4} cy={31.6} r={3.2} />
      </Layer>
      {/* 上の しげみ: 風で ゆっくり ゆれる */}
      <Layer scale={leaves} rotate={sway} origin={[66.8, 34]}>
        <circle cx="54" cy="21" r="10.5" fill={LEAF_DARK} />
        <circle cx="79" cy="21" r="10.5" fill={LEAF_DARK} />
        <circle cx="66.8" cy="14" r="13" fill={LEAF_DARK} />
        <circle cx="66.8" cy="23" r="12" fill={LEAF_DARK} />
        <circle cx="58" cy="22" r="8.6" fill={LEAF} />
        <circle cx="75.6" cy="22" r="8.6" fill={LEAF} />
        <circle cx="66.8" cy="16" r="9.6" fill={LEAF} />
        <circle cx="62" cy="11" r="4.2" fill={LEAF_LIGHT} />
        <circle cx="74" cy="14" r="3" fill={LEAF_LIGHT} />
      </Layer>
    </>
  )
}

/* ───────── 小鳥・葉 ───────── */

/** 木の えだ に 小鳥 が とまって うたう */
function Perching({ t }: SceneProps) {
  const arrive = span(t, 2.0, 2.9, easeOut)
  if (arrive <= 0) return null
  const x = 118 - arrive * 33
  const y = 6 + arrive * 25.4 - Math.sin(arrive * Math.PI) * 8
  const landed = arrive >= 1
  return <Bird x={x} y={y - (landed ? Math.abs(wave(t, 0.7)) * 0.8 : 0)} t={t} flying={!landed} facing="left" />
}

/** 葉が 1まい ひらひら おちる */
function FallingLeaf({ t }: SceneProps) {
  const p = span(t, 3.4, INK - 0.1)
  if (p <= 0) return null
  const x = 90 + Math.sin(p * 9) * 4
  const y = 50 + p * 44
  return <path d="M0 -3.2 Q2.8 0 0 3.2 Q-2.8 0 0 -3.2 Z" fill={LEAF_LIGHT} stroke={LEAF_DARK} strokeWidth="0.5" transform={`translate(${x} ${y}) rotate(${Math.sin(p * 9) * 50 + 20})`} />
}

/* ───────── ぜんたい ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)

  // いもうと: さびしい → 気づく(ふりむく) → 手を つないで よろこぶ(はずむ)
  const joined = t >= JOIN
  const hop = joined && t < INK - 0.2 ? Math.abs(wave(t - JOIN, 0.8)) * 2.4 : 0
  const meet: Point = [MEET[0], MEET[1] - hop]

  // おねえさん: 左から あるいてきて、いもうと の 手の 前で とまる
  const w = walk(t, { from: -26, to: BIG_STOP, start: WALK, end: ARRIVE, build: 'teen', height: BIG_HEIGHT })
  const reach = span(t, REACH, JOIN, easeInOut)
  const bigHand = mixLimb(w.pose.leftArm ?? { swing: 4, bend: 8 }, { to: meet }, reach)
  const big = { ...w, y: GROUND, look: BIG_LOOK, face: 'smile', opacity: span(t, WALK - 0.1, WALK + 0.15), pose: { ...w.pose, leftArm: bigHand } } as const

  const kidTurn = turnAround(t, NOTICE, 'front', 'left')
  const kidFace = t < NOTICE ? 'cry' : t < REACH ? 'surprised' : 'joy'
  const cheerArm = mixLimb({ swing: 8, bend: 4 }, { swing: 150 + wave(t, 0.9) * 8, bend: 20 }, joined ? span(t, JOIN, JOIN + 0.4, easeOut) : 0)
  const reachKid = mixLimb({ swing: 8, bend: 4 }, { to: meet }, span(t, REACH + 0.1, JOIN, easeInOut))
  const kid = {
    x: KID_X,
    y: GROUND,
    build: 'child',
    height: KID_HEIGHT,
    ...kidTurn,
    look: KID_LOOK,
    face: kidFace,
    lift: hop,
    opacity: span(t, 0.35, 0.7),
    pose: t < NOTICE ? {} : { rightArm: reachKid, leftArm: cheerArm },
  } as const
  const kidHead = personRig({ ...kid, pose: {} }).world.head
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  const items = [
    { key: 'kid', z: GROUND, node: <Person {...kid} /> },
    { key: 'big', z: GROUND - 0.1, node: <Person {...big} /> },
  ]

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[10, 9]} clouds={[[86, 8, 0.8], [2, 60, 0.7]]} tufts={[6, 40, 84, 102]} />
        <Tree t={t} />
        <Perching t={t} />
        <FallingLeaf t={t} />
        <ByDepth items={items} />
        <Notice x={kidHead[0]} y={kidHead[1]} r={KID_HEIGHT * 0.17} show={during(t, NOTICE, ARRIVE + 0.1, 0.12)} dir={1} />
        <Hearts t={t} x={MEET[0] - 2} y={MEET[1] - 14} show={during(t, JOIN + 0.1, INK - 0.1, 0.3)} />
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
    { at: 0, label: '木が そだつ。小さい いもうと が ひとりで さびしい', sound: 'pop' },
    { at: WALK, label: '左から おねえさん が あるいてくる' },
    { at: NOTICE, label: 'いもうと が 気づいて「あっ!」', sound: 'pop' },
    { at: REACH, label: 'おねえさん が 手を さしだす' },
    { at: JOIN, label: '手を つないで にっこり。ハートが ふわり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '妹 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
