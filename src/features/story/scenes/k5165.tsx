/*
 * 入(はいる): さむい 夕ぐれ、あかりの もれる テントの 入り口から、子どもが 中に はいる。
 * (共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … テントの 左がわの ささえの ぼう(てっぺん から 左の 地面まで)
 *   2画目(㇏)  … テントの 右がわの ささえの ぼう。ながい ぼうは てっぺん から つきぬけて、はたが ひらひら
 *   (2本の ぼうが ななめに 立つ「入り口の かたち」。まんなかの 三角が、中に はいる 入り口)
 *
 * ながれ
 *   テントが 立つ → さむそうな 子どもが 右から あるいてくる(息が しろい)
 *   → テントの 入り口から あかりが もれているのに 気づいて、ぱっと うれしい 顔
 *   → 入り口の 前で むきを 変えて、うしろ向きで 中に はいる
 *   → 中で ふりむいて、あたたかい あかりの 中で にっこり 手を ふる
 *   → ほね が ひかって、絵が うすくなり、字「入」が のこる
 *
 * 人は Person。あるきは walk(横)と walkDepth(おくへ)、むきがえは turnAround。
 * ゆうぐれの 空は Backdrop(time)。テントと はた は ここで 描く。
 */
import { backOut, during, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, HANG_ARM, LOOKS, mixLimb, Notice, PALETTE, Person, personRig, Sigh, turnAround, walk, walkDepth, type Look, type PersonProps } from '../sceneFigures'

const CHAR = '入'

const POLE = '#8c5b3c'
const CLOTH = '#f6dca4'
const CLOTH_SHADE = '#e8c485'
const CLOTH_FOLD = '#d9a95f'
const WARM = '#f4b04f'
const WARM_LIGHT = '#ffd978'

/** 子どもの 見た目(だいだいの 上着・あおい ズボン) */
const KID_LOOK: Look = { ...LOOKS.boy, top: '#e8715a', bottom: '#3e5c86' }

/** くぎり の時間(秒) */
const WALK0 = 0.9
/** あかりに 気づく */
const SEE = 2.4
/** 入り口の 前に ついて とまる */
const ARRIVE = 3.3
/** よこ向き → うしろ向き */
const TURN1 = 3.5
const ENTER0 = 3.9
const ENTER1 = 5.0
/** うしろ向き → 正面 */
const TURN2 = 5.1
const SMILE = 5.5
const INK = 6.6
const DONE = 9.6
const DURATION = 10.2

/** テントの 地面と、入り口(三角)の かたち */
const BASE_Y = 88.6
const TENT_ORIGIN: readonly [number, number] = [55, BASE_Y]
const DOOR_POINTS = '55,56 29,88.6 81,88.6'
/** 入り口の まんなか(子どもが はいる 場所) */
const DOOR_X = 55
/** 子どもの 足もとの 高さ・背の高さ: てまえ(あるくとき)と、入り口の 中 */
const FRONT_Y = 96
const INSIDE_Y = 90.4
const START_HEIGHT = 36
const INSIDE_HEIGHT = 29
/** さむい ときに むねの まえで ぎゅっと にぎる うで */
const HUG = { swing: 28, bend: 118 }

/* ───────── テント ───────── */

/** 左の ぼう(1画目)の 点を 下から 上へ、右の ぼう(2画目)の 点を 上から 下へ つないだ、布の ふち */
const CLOTH_POINTS =
  '14.5,88.6 21.6,83.9 28.2,79.1 34.4,73.9 40.3,68.2 45.8,62.2 50.9,55.9 54.8,48.8 58.3,51.9 66,62.4 74.7,72.1 84.2,81 94.8,88.6'

function Flag({ t }: SceneProps) {
  // 長い ぼうの さき(2画目の 書きはじめ)で ひらひら
  const flutter = wave(t, 0.7) * 1.6
  return <path d={`M37.6 19.6 Q43 ${16.4 + flutter} 49.6 ${18.4 + flutter * 1.4} Q44 ${21.6 + flutter} 40.6 25 Z`} fill="#e8534a" />
}

function Tent({ t }: SceneProps) {
  // ぼう が 立ち、布が ぴん と はられる
  const raise = span(t, 0, 0.8, backOut)
  const flicker = 1 + wave(t, 0.37) * 0.06 + wave(t, 0.23) * 0.04
  return (
    <>
      {/* あかりが 地面に もれる */}
      <ellipse cx="55" cy="93.6" rx={24 * span(t, 0.5, 1.0)} ry="3.8" fill={WARM_LIGHT} opacity={0.5 * flicker} />
      <Layer scaleX={0.6 + 0.4 * raise} scaleY={raise} origin={TENT_ORIGIN}>
        <polygon points={CLOTH_POINTS} fill={CLOTH} stroke={CLOTH} strokeWidth="2" strokeLinejoin="round" />
        {/* 右がわは かげ */}
        <polygon points="57.5,52.5 94.8,88.6 81,88.6 55,56" fill={CLOTH_SHADE} />
        {/* 入り口: 中は あたたかい あかり */}
        <polygon points={DOOR_POINTS} fill={WARM} stroke={WARM} strokeWidth="0.6" strokeLinejoin="round" />
        {/* 中の ぬくもり(入り口の 三角を ひとまわり ちいさく した 明るい面。ゆらゆら) */}
        <polygon points="55,66 38,88.6 72,88.6" fill={WARM_LIGHT} opacity={0.55 + (flicker - 1) * 2} />
        {/* 床の ざぶとん と ランタン */}
        <rect x="38" y="86" width="16" height="2.6" rx="1.3" fill="#c0763c" />
        <path d="M66.2 82.4 Q68.2 79.4 70.2 82.4" fill="none" stroke="#7a4a2a" strokeWidth="0.8" />
        <rect x="65.2" y="82" width="6" height="6.4" rx="1.6" fill="#b9722f" />
        <rect x="66.4" y="83.2" width="3.6" height="3.4" rx="1" fill="#fff6c0" />
        {/* 入り口の ふち の 布(めくれた ところ) */}
        <polygon points="55,56 29,88.6 33.5,88.6 55,61" fill={CLOTH_FOLD} />
        <polygon points="55,56 81,88.6 76.5,88.6 55,61" fill={CLOTH_FOLD} />
        {/* ささえの ぼう */}
        <Bone char={CHAR} n={1} color={POLE} width={3.8} />
        <Bone char={CHAR} n={2} color={POLE} width={3.8} />
        <Flag t={t} />
      </Layer>
    </>
  )
}

/* ───────── 子ども ───────── */

/** 子どもの いち・向き・ポーズ: あるいてくる → とまる → うしろむき → 中へ → 正面で てを ふる */
function kidAt(t: number): PersonProps {
  const cold = 1 - span(t, SEE, SEE + 0.5)
  const hop = Math.sin(span(t, SEE, SEE + 0.3) * Math.PI) * 3
  const shiver = cold > 0 && t >= WALK0 ? wave(t, 0.1) * 0.5 * cold : 0
  const common = { build: 'child', look: KID_LOOK, face: cold > 0.5 ? 'worried' : 'smile', lift: hop } as const
  if (t < TURN1) {
    const w = walk(t, { from: 128, to: DOOR_X, start: WALK0, end: ARRIVE, build: 'child', height: START_HEIGHT })
    // さむい あいだは、りょうてを むねの まえで ぎゅっと にぎったまま あるく
    const pose = { ...w.pose, leftArm: mixLimb(w.pose.leftArm ?? HANG_ARM, HUG, cold), rightArm: mixLimb(w.pose.rightArm ?? HANG_ARM, HUG, cold), head: cold * 5 }
    return { ...common, x: w.x + shiver, y: FRONT_Y, height: START_HEIGHT, facing: w.facing, pose }
  }
  if (t < ENTER0) return { ...common, x: DOOR_X, y: FRONT_Y, height: START_HEIGHT, ...turnAround(t, TURN1, 'left', 'back', 0.2) }
  if (t < TURN2) {
    const d = walkDepth(t, { from: [DOOR_X, FRONT_Y], to: [DOOR_X, INSIDE_Y], start: ENTER0, end: ENTER1, build: 'child', height: START_HEIGHT, toHeight: INSIDE_HEIGHT })
    return { ...common, x: d.x, y: d.y, height: d.height, facing: d.facing, pose: d.pose, stance: d.stance }
  }
  const wavePhase = wave(t, 0.6)
  const waving = span(t, SMILE, SMILE + 0.35)
  const wavingArm = { swing: 130 + 10 * waving * wavePhase, bend: 24 + 24 * waving * wavePhase }
  return { ...common, x: DOOR_X, y: INSIDE_Y, height: INSIDE_HEIGHT, face: 'joy', ...turnAround(t, TURN2, 'back', 'front', 0.2, 'right'), pose: { leftArm: mixLimb(HANG_ARM, wavingArm, waving) } }
}

/** はいった あと、入り口から ぽかぽか ほし が のぼる */
function Warmth({ t }: SceneProps) {
  const show = during(t, SMILE, INK + 0.3, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.55, 1.1].map((offset, i) => {
        const p = ((t - SMILE + offset) % 1.6) / 1.6
        const sx = 48 + i * 7.5 + Math.sin(p * 6 + i) * 1.6
        return <Star key={offset} cx={sx} cy={80 - p * 26} r={2.2 * Math.sin(p * Math.PI)} color={i === 1 ? '#ffffff' : '#ffc233'} spin={p * 120} />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 2)
  const kid = kidAt(t)
  const head = personRig(kid).world.head
  const noticeShow = during(t, SEE + 0.05, SEE + 0.85, 0.15)
  const breath = breathing(t) ? ((t + 0.3) % 1.1) / 1.1 : 0
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={null} ground={90} time={1.2} clouds={[[96, 20, 0.6]]} tufts={[6, 22, 90, 103]} />
        <rect x="-2" y="90" width="113" height="21" fill={PALETTE.grassEvening} />
        <Tent t={t} />
        <Layer opacity={span(t, WALK0 - 0.3, WALK0 - 0.1)}>
          <Person {...kid} />
        </Layer>
        {/* しろい いき(さむい あいだ、口の まえへ ふわっと) */}
        <Sigh x={head[0] - 4} y={head[1] + 4} p={breath} show={breath > 0 ? 1 - breath : 0} dir={-1} />
        <Notice x={head[0] - 2} y={head[1] - 12} r={5} show={noticeShow} />
        <Warmth t={t} />
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Layer scale={1 + bump} origin={[54.5, 54.5]}>
        <Ink char={CHAR} progress={ink.progress} tint={ink.tint} />
      </Layer>
      <Sparkles cx={54.5} cy={52} progress={ink.sparkle} />
    </>
  )
}

/** あるいている さむい あいだ(息が 白い) */
const breathing = (t: number): boolean => t > WALK0 + 0.2 && t < SEE

const scene: SceneModule = {
  char: CHAR,
  duration: DURATION,
  beats: [
    { at: 0, label: '夕ぐれ。テントが 立つ', sound: 'pop' },
    { at: WALK0, label: 'さむそうな 子どもが あるいてくる' },
    { at: SEE, label: 'あかりに 気づいて うれしい顔', sound: 'pop' },
    { at: TURN1, label: '入り口の 前で うしろを むく' },
    { at: ENTER0, label: '中に はいる' },
    { at: SMILE, label: 'ふりむいて にっこり 手を ふる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '入 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
