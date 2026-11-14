/*
 * 体(からだ): 木の ねもと の ように、人を ささえる もの。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … あたまの てっぺんの はねた かみ から、かた を通って、まえに のばした うで
 *                  (さいごに 手を ひろげて バランスを とった しゅんかん、うで が この線に重なる)
 *   2画目(丨)  … 子どもの どう と あし(これが 人を ささえる「体」)
 *   3画目(一)  … 木の よこに のびた 大きな えだ
 *   4画目(丨)  … 木の みき(ねもと は どっしり ひろがる)
 *   5・6画目   … 左右に たれた えだ
 *   7画目(一)  … 木の ねもとの ベンチ(みきの したの 高さ)
 *
 * ながれ
 *   木が そだつ → 子どもが あらわれる
 *   → つよい風が ふいて、子どもは よろよろ(うで を ばたばた・こわい顔)。木は 風で はっぱが ゆれても みき は どっしり
 *   → 子どもは 木の ねもとを 見て、足を どん と ふんばる(ほこり が ふわっ)
 *   → 風に まけずに まっすぐ立てた! うれしい顔で 手を ひろげる
 *   → ほね が ひかって、絵が うすくなり、字「体」が のこる
 *
 * 人は 共通部品 Person(左むき)。風を うけて たおれそうなときは、足もとを じく に かたむく(lean)。
 *   木は 風で はっぱ は ゆれても、みき と ねもと は うごかない。ベンチも じめん に 足が ついている。
 *   字の形になるのは、手を ひろげた さいごの しゅんかん だけ(手先を 点で 指定)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Canopy, Dust, HANG_ARM, mixLimb, PALETTE, Person, personRig, Sweat, Wind, type Expression, type Limb, type PersonPose } from '../sceneFigures'

const CHAR = '体'

const PLANK = '#d9a366'
const PLANK_DARK = '#b57e47'

/** くぎり の時間(秒) */
const POP = 0.5
/** つよい風が ふきはじめる / 子どもが ふんばる / 風が よわまる */
const WIND = 1.7
const STEADY = 4.3
const CALM = 5.0
const INK = 6.0
const DONE = 8.8
const DURATION = 9.4

/** 人(こし)の 場所と 大きさ。左むき。絵は 2画目に そろえるため、少し 左に おく */
const KID_X = 23.5
const GROUND = 94
const KID_HEIGHT = 76
/** 1画目の 書きおわり(手を ひろげたときの 手先) */
const HAND_GOAL: readonly [number, number] = [9.1, 60.2]

/** 風の つよさ(0〜1)。ふきはじめ と やむとき は ふわっと かわる */
const windAt = (t: number): number => during(t, WIND, CALM + 0.7, 0.5)

function Tree({ t }: SceneProps) {
  // みき が下から のびて、えだ が ひろがり、さいごに 葉が ぽん と しげる
  const trunk = span(t, 0, 0.55, backOut)
  const boughs = span(t, 0.3, 0.75, backOut)
  const leaves = span(t, 0.5, 1.0, backOut)
  const wind = windAt(t)
  // 風が右から ふくと 葉の かたまり は 左へ しなる。みき・えだ は うごかない
  const sway = wave(t, 3.4) * 1.3 * (1 - wind) - wind * (3 + 1.8 * wave(t, 0.55))
  return (
    <>
      <ellipse cx="63" cy="97.6" rx={20 * trunk} ry="3" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.6 + 0.4 * trunk} scaleY={trunk} origin={[62.5, 96]}>
        {/* ねもと: どっしり ひろがって、木を ささえる */}
        <path d="M53.5 97 Q59.5 91 58.6 83 L67.4 83 Q67 91 73 97 Z" fill={PALETTE.bark} />
        <Bone char={CHAR} n={4} color={PALETTE.bark} width={9.5} />
        <path d="M60.6 52 q1.6 5 0 11 M65.2 66 q-1.4 5 0.2 10" fill="none" stroke={PALETTE.barkDark} strokeWidth="1.3" strokeLinecap="round" />
      </Layer>
      <Layer scale={boughs} origin={[63, 38]}>
        {[3, 5, 6].map((n) => (
          <Bone key={n} char={CHAR} n={n} color={PALETTE.bark} width={n === 3 ? 6.2 : 5.6} />
        ))}
      </Layer>
      {/* えだの先の 小さな しげみ と りんご */}
      <Layer scale={leaves} origin={[63, 38]} rotate={sway * 0.6}>
        <circle cx="96.5" cy="76.5" r="7" fill={PALETTE.leafDark} />
        <circle cx="94" cy="73" r="5" fill={PALETTE.leaf} />
        <circle cx="97.5" cy="79" r="2.2" fill={PALETTE.fruit} />
        <circle cx="37.5" cy="80" r="5.4" fill={PALETTE.leafDark} />
        <circle cx="39.5" cy="77" r="4" fill={PALETTE.leaf} />
        <circle cx="35" cy="82.6" r="2.1" fill={PALETTE.fruit} />
      </Layer>
      <Canopy x={63} y={20} r={34} grow={span(t, 0.5, 1)} sway={sway} fruit />
    </>
  )
}

/** 木の ねもとの ベンチ(7画目)。足は じめん に ついている。 */
function Bench({ t }: SceneProps) {
  const rise = span(t, 0.45, 0.9, backOut)
  return (
    <Layer scaleY={rise} origin={[63, 96]}>
      <rect x="49.4" y="76" width="3.2" height="20" rx="1.2" fill={PLANK_DARK} />
      <rect x="74.4" y="76" width="3.2" height="20" rx="1.2" fill={PLANK_DARK} />
      <rect x="46" y="71.6" width="35" height="5" rx="2.4" fill={PLANK} />
      <rect x="47" y="75" width="33" height="1.6" rx="0.8" fill={PLANK_DARK} />
    </Layer>
  )
}

/** 風。右から 左へ くるんと まいた すじ が とおりぬける。木から ちぎれて 葉も とぶ */
function Gusts({ t }: SceneProps) {
  const wind = windAt(t)
  if (wind <= 0) return null
  return (
    <>
      {[30, 52, 68, 84].map((y, i) => (
        <Wind key={y} t={t + i * 0.37} x={122} y={y} dir={-1} reach={140} show={wind} color="#a9c6e6" />
      ))}
      {[0, 1, 2].map((i) => {
        const p = (t * 0.7 + i * 0.31) % 1
        const x = 88 - p * 100
        const y = 24 + i * 14 + p * 22 + Math.sin(p * 12 + i) * 4
        return <path key={i} d="M0 -3.4 Q3 0 0 3.4 Q-3 0 0 -3.4 Z" fill={PALETTE.leafLight} stroke={PALETTE.leafDark} strokeWidth="0.5" opacity={wind * Math.sin(p * Math.PI)} transform={`translate(${x} ${y}) rotate(${p * 400})`} />
      })}
    </>
  )
}

/** 1画目の 書きはじめ: ぴょこんと はねた かみ。風で なびく(あたま の まんなか が 0,0、半径 1。右むき の 形) */
function Tuft({ blow }: { readonly blow: number }) {
  return (
    <g transform={`rotate(${blow} -0.35 -0.75)`}>
      <path d="M-0.39 -0.83 Q-0.48 -1.17 -0.67 -0.95 Q-0.8 -1.24 -0.89 -0.9" fill="none" stroke={PALETTE.hair} strokeWidth="0.21" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

/** 子どもの 気もち */
function moodAt(t: number): Expression {
  if (t < WIND) return 'normal'
  if (t < STEADY - 0.1) return 'worried'
  if (t < CALM + 0.1) return 'strain'
  return 'joy'
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)
  const wind = windAt(t)

  const pop = span(t, POP, POP + 0.5, backOut)
  // よろよろ: 風に おされて まえ(左)へ かたむき、ゆれもどる(足もとが じく)
  const wobble = span(t, WIND, WIND + 0.3) * (1 - span(t, STEADY - 0.1, STEADY + 0.25))
  const sway = wave(t, 0.8)
  // ふんばる: 風に むかって 少し うしろへ。風が やむと まっすぐ もどる
  const brace = span(t, STEADY, STEADY + 0.3, backOut) * (1 - span(t, CALM, CALM + 0.6))
  const lean = wobble * (11 - 9 * sway) - brace * 5
  // 手を ひろげる: 字になる 少し前に、てまえの うで を 1画目の さきへ
  const open = span(t, CALM + 0.2, INK - 0.1, easeInOut)
  const rest: Limb = { swing: 6, bend: 8 }
  const flailNear: Limb = { swing: 42 + 24 * sway, bend: 22 }
  const flailFar: Limb = { swing: -30 + 22 * sway, bend: 14 }
  const pose: PersonPose = {
    rightArm: mixLimb(mixLimb(HANG_ARM, { to: HAND_GOAL }, open), flailNear, wobble),
    leftArm: mixLimb(rest, flailFar, wobble),
    leftLeg: { swing: wobble * 8 * sway, bend: 0 },
    rightLeg: { swing: -wobble * 8 * sway, bend: 0 },
    head: wobble * 5 * sway - brace * 2 + open * 4,
  }
  const kid = { x: KID_X, y: GROUND, build: 'child', height: KID_HEIGHT, facing: 'left', lean, pose } as const
  const head = personRig(kid).world.head
  const hairBlow = wind * (20 + 10 * wave(t, 0.25))
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[13, 13]} tufts={[8, 46, 82, 100]} />
        <Tree t={t} />
        <Bench t={t} />
        <Layer opacity={span(t, POP, POP + 0.2)}>
          <Layer scale={pop} origin={[KID_X, GROUND]}>
            <Person {...kid} face={moodAt(t)} headwear={<Tuft blow={hairBlow} />} />
            <Sweat t={t} x={head[0] + 7} y={head[1] - 6} show={wobble} dir={1} />
          </Layer>
          <Dust x={KID_X} y={GROUND + 0.5} p={span(t, STEADY, STEADY + 0.7, easeOut)} reach={14} />
        </Layer>
        <Gusts t={t} />
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
    { at: 0, label: '木が そだつ。子どもが あらわれる', sound: 'pop' },
    { at: WIND, label: 'つよい風。子どもが よろよろ' },
    { at: STEADY, label: '木の ねもとを 見て、足を どん と ふんばる', sound: 'pop' },
    { at: CALM, label: '風に まけずに まっすぐ立つ。手を ひろげる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '体 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
