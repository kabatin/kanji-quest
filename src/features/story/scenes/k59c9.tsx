/*
 * 姉(あね): 女の子(おねえさん)が、ないている おとうとを つれて 市(いち)へ。
 * (共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … おねえさんの あたまの てっぺん から、からだ を通って、すそ のほうへ
 *   2画目(ノ)  … からだ の ななめの 線(女の 左がわ)
 *   3画目(一)  … 「ほら、市(いち)だよ」と まえへ のばした うで(おとうとの あたまの 上を とおる)
 *   4画目(丨)  … 市の 屋根の てっぺんに たつ はた の さお
 *   5画目(一)  … 市の 屋根(ひさし)
 *   6画目(丨)  … 市の ぬのの 左の はしら
 *   7画目(𠃍)  … 市の ぶらさがった ぬの(巾)の ふち
 *   8画目(丨)  … 市の まんなかの 大きな はしら
 *   (女の 画とは だいたい 重なる くらい。字の 形より 人の 体の つくり を 先に した)
 *
 * ながれ
 *   市(みせ)が できる → おなかが すいて ないている おとうとの 手を ひいて、おねえさんが こまった顔で あるいてくる
 *   → 市の りんごに 気づいて「そうだ!」(おもいついた ほし)→ 「ほら、市だよ」と うでを のばして おしえる
 *   → おとうとは なきやんで、よろこんで ぴょんぴょん
 *   → ほね が ひかって、絵が うすくなり、字「姉」が のこる
 *
 * 人は Person。おねえさんは teen、おとうとは child。ふたりは walk で いっしょに あるき、手は { to } で つなぐ。
 * 市の みせは 本来 その形の ほね なので Bone で 描く。
 */
import { backOut, during, easeInOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, ByDepth, LOOKS, mixLimb, Person, personRig, walk, type Point } from '../sceneFigures'

const CHAR = '姉'

const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const LEAF = '#55b86e'
const AWNING = '#e8534a'
const AWNING_LIGHT = '#fff4e6'
const CLOTH = '#fff1c9'
const CLOTH_SHADE = '#f1dca0'
const FLAG = '#f07f9e'
const APPLE = '#e8534a'
const APPLE_DARK = '#c93e3a'
const CRATE = '#c98a4d'
const CRATE_DARK = '#a86e38'

const SISTER_LOOK = { ...LOOKS.girl, top: '#ef7d9a', accent: '#e8534a' } as const
const BROTHER_LOOK = { ...LOOKS.boy, hair: '#3b2a20', top: '#f2a23a' } as const

/** くぎり の時間(秒) */
const WALK = 0.9
/** 市の まえに ついて とまる */
const ARRIVE = 2.7
/** りんごに 気づく(おもいつく) */
const NOTICE = 3.0
/** うでを のばして、市を おしえる */
const POINT = 3.5
/** おとうとが なきやんで、よろこぶ */
const CHEER = 4.5
const INK = 6.3
const DONE = 9.3
const DURATION = 10

/** おねえさんの 足もと(さいごに 立つ場所)と、ふたりの 背 */
const SISTER_X = 27.5
const GROUND = 96
const SISTER_HEIGHT = 62
const BROTHER_HEIGHT = 40
/** おとうとは、おねえさんの 右がわ(市のほう)を あるく */
const GAP = 17
/** 手を つなぐ高さ と、おねえさんの 手の よこの いち */
const HOLD_Y = 72
const HOLD_DX = 10
/** うでを のばした 手さきの いち(3画目の おわり あたり) */
const POINT_DX = 26
const POINT_Y = 43

const lerpPt = (a: Point, b: Point, k: number): Point => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
type Mood = 'worried' | 'idea' | 'happy' | 'cry'
const FACES = { worried: 'worried', idea: 'surprised', happy: 'joy', cry: 'cry' } as const

/** りんごを つんだ 木の はこ。x = 左はし */
function Crate({ x, apples }: { readonly x: number; readonly apples: readonly number[] }) {
  return (
    <>
      <rect x={x} y="80" width="14.5" height="13" rx="1.8" fill={CRATE} />
      <path d={`M${x + 0.8} 86.4 h12.9`} stroke={CRATE_DARK} strokeWidth="1" strokeLinecap="round" />
      {apples.map((dx, i) => (
        <g key={dx}>
          <circle cx={x + dx} cy={79 - (i % 2) * 1.4} r="3.4" fill={APPLE} />
          <circle cx={x + dx - 1} cy={78 - (i % 2) * 1.4} r="1" fill="#ff9b8e" />
          <path d={`M${x + dx} ${75.6 - (i % 2) * 1.4} l0.6 -1.6`} stroke={BARK_DARK} strokeWidth="0.7" strokeLinecap="round" />
        </g>
      ))}
    </>
  )
}

/** 市の みせ。ほね(4〜8画)を そのまま みせの はしら・やね・ぬの にする。 */
function Stall({ t }: SceneProps) {
  const pole = span(t, 0, 0.5, backOut)
  const awning = span(t, 0.25, 0.8, backOut)
  const cloth = span(t, 0.5, 1.0, backOut)
  const flag = span(t, 0.8, 1.2, backOut)
  const goods = span(t, 1.0, 1.5, backOut)
  const flutter = wave(t, 0.9) * 1.2
  return (
    <>
      <ellipse cx="72" cy="97.6" rx={24 * pole} ry="2.8" fill="#000000" opacity="0.1" />
      {/* 大きな はしら(8画目) */}
      <Layer scaleY={pole} origin={[72, 96]}>
        <Bone char={CHAR} n={8} color={BARK} width={3.8} />
      </Layer>
      {/* ぬの(巾): ふち(7画目)と 左の はしら(6画目) */}
      <Layer scaleY={cloth} origin={[73, 44]}>
        <path d="M55.5 47.9 L88 43.5 Q92.5 43.5 92.5 48 L92 68 Q91.4 72 85.8 71.4 Q70 73.6 55.5 71.4 Z" fill={CLOTH} />
        <path d="M58 66 Q72 69 90 66.4 L89.6 69.6 Q72 72.4 58 69.4 Z" fill={CLOTH_SHADE} />
        <Bone char={CHAR} n={7} color={BARK_DARK} width={2.2} />
        <Bone char={CHAR} n={6} color={BARK_DARK} width={2.6} />
        {/* ぬのに えがいた りんご(はしら の 左がわ) */}
        <circle cx="63.4" cy="58" r="5" fill={APPLE} />
        <circle cx="61.8" cy="56.4" r="1.4" fill="#ff9b8e" />
        <path d="M63.4 53.2 q0.4 -2.2 2.2 -2.8" fill="none" stroke={LEAF} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="81.4" cy="58" r="5" fill={APPLE_DARK} />
        <circle cx="79.8" cy="56.4" r="1.4" fill="#ff9b8e" />
        <path d="M81.4 53.2 q0.4 -2.2 2.2 -2.8" fill="none" stroke={LEAF} strokeWidth="1.5" strokeLinecap="round" />
      </Layer>
      {/* やね(5画目): しましま */}
      <Layer scale={awning} origin={[72, 27]}>
        <Bone char={CHAR} n={5} color={AWNING} width={6.8} />
        {[50, 59, 68, 77, 86].map((x) => (
          <path key={x} d={`M${x} ${29.8 - (x - 44.5) * 0.06 - 3.2} l3.6 -0.2 l0 6.2 l-3.6 0.2 Z`} fill={AWNING_LIGHT} />
        ))}
      </Layer>
      {/* てっぺんの はた(4画目が さお) */}
      <Layer scale={flag} origin={[70, 26]}>
        <Bone char={CHAR} n={4} color={BARK} width={1.8} />
        <path d={`M70.8 13.8 Q${76 + flutter} 12 ${82 + flutter * 1.4} 15.6 Q${76 + flutter} 18 70.8 20.6 Z`} fill={FLAG} />
      </Layer>
      {/* りんごの はこ(はしらを はさんで 左と右) */}
      <Layer scale={goods} origin={[72, 93]}>
        <Crate x={54.6} apples={[4, 10]} />
        <Crate x={75.4} apples={[4, 10.4]} />
      </Layer>
    </>
  )
}

/** りんごの きらきら(おねえさんが 気づく もと) */
function Glints({ t }: SceneProps) {
  const show = during(t, ARRIVE - 0.4, INK, 0.4)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      <Star cx={63} cy={73.6} r={2.6 + wave(t, 0.8) * 0.8} color="#ffffff" spin={t * 40} />
      <Star cx={86} cy={74} r={2.2 + wave(t, 0.8, 0.4) * 0.7} color="#fff4a8" spin={-t * 40} />
    </g>
  )
}

/** おもいついた! の ほし(おねえさんの あたまの 上) */
function IdeaStar({ t, x }: { readonly t: number; readonly x: number }) {
  const show = during(t, NOTICE, POINT + 0.4, 0.2)
  if (show <= 0) return null
  const pop = span(t, NOTICE, NOTICE + 0.3, backOut)
  return (
    <g opacity={show}>
      <Star cx={x + 10} cy={9 - wave(t, 0.6) * 0.6} r={5.2 * pop} color="#ffd24a" spin={0} />
      <Star cx={x + 17} cy={13} r={2.4 * pop} color="#ffb703" spin={0} />
      <Star cx={x + 2} cy={7} r={2 * pop} color="#ffb703" spin={0} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)

  // あるく: 左から 市の まえまで。ふたり いっしょ に、ちかくで とまる
  const sisterWalk = walk(t, { from: SISTER_X - 52, to: SISTER_X, start: WALK, end: ARRIVE, build: 'teen', height: SISTER_HEIGHT })
  const brotherWalk = walk(t, { from: SISTER_X - 52 + GAP, to: SISTER_X + GAP, start: WALK, end: ARRIVE, build: 'child', height: BROTHER_HEIGHT })
  const sisterX = sisterWalk.x

  const sisterMood: Mood = t < NOTICE ? 'worried' : t < POINT + 0.5 ? 'idea' : 'happy'
  const brotherMood: Mood = t < CHEER ? 'cry' : 'happy'

  // おねえさんの うで: 手を つなぐ → まっすぐ まえへ のばして、市を おしえる
  const hold: Point = [sisterX + HOLD_DX, HOLD_Y]
  const point: Point = [sisterX + POINT_DX, POINT_Y + wave(t, 1.1) * 0.5 * span(t, POINT + 0.8, POINT + 1.2)]
  const reach = lerpPt(hold, point, span(t, POINT, POINT + 0.8, easeInOut))
  const sisterArm = t < WALK ? sisterWalk.pose.leftArm : { to: reach }

  // おとうと: 手を つなぐ → はなす → ぴょんぴょん(うでを あげる)
  const release = span(t, POINT, POINT + 0.7)
  const cheer = span(t, CHEER, CHEER + 0.4, backOut)
  const hopAmp = span(t, CHEER + 0.2, CHEER + 0.5)
  const hop = Math.abs(wave(t - CHEER, 1.0)) * 2.8 * hopAmp
  const brotherHold = mixLimb({ to: hold }, { swing: 8, bend: 4 }, release)
  const brotherArm = mixLimb(brotherHold, { swing: 172, bend: 0 }, cheer)

  const sister = { ...sisterWalk, y: GROUND, look: SISTER_LOOK, face: FACES[sisterMood], opacity: span(t, WALK - 0.1, WALK + 0.15), pose: { ...sisterWalk.pose, leftArm: sisterArm } } as const
  const brother = { ...brotherWalk, y: GROUND, look: BROTHER_LOOK, face: FACES[brotherMood], lift: hop, opacity: span(t, WALK - 0.1, WALK + 0.15), pose: { ...brotherWalk.pose, leftArm: brotherArm } } as const
  const sisterHead = personRig({ ...sister, pose: {} }).world.head

  const items = [
    { key: 'brother', z: GROUND, node: <Person {...brother} /> },
    { key: 'sister', z: GROUND - 0.1, node: <Person {...sister} /> },
  ]

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[13, 13]} clouds={[[-4, 46, 1], [94, 8, 0.8]]} tufts={[6, 46, 100]} />
        <Stall t={t} />
        <Glints t={t} />
        <ByDepth items={items} />
        <IdeaStar t={t} x={sisterHead[0] - 8} />
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
    { at: 0, label: '市(いち)の みせが できる', sound: 'pop' },
    { at: WALK, label: 'ないている おとうとの 手を ひいて、おねえさんが こまった顔で あるいてくる' },
    { at: NOTICE, label: '市の りんごに 気づいて「そうだ!」', sound: 'pop' },
    { at: POINT, label: 'うでを のばして「ほら、市だよ」と おしえる' },
    { at: CHEER, label: 'おとうとは なきやんで ぴょんぴょん', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '姉 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
