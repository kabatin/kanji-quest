/*
 * 声(こえ): つるした 石の がっきを たたくと、いい 音が 耳に とどく。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 石の がっきを つるす 木の よこぼう(はり)
 *   2画目(丨)  … はり に かけて 石を つるす ひも
 *   3画目(一)  … ひもに ぶらさがった 平たい 石の がっき
 *   4〜6画目   … 石を たたく 子の あたま と 耳(まんなかに 立つ 子が、石の下に いる)
 *   7画目(ノ)  … 子の 左がわ(石のほうへ 手を のばした ほう)
 *   (絵と字は、だいたい おなじ場所・おなじ向き。ぴったりは 重ねない)
 *
 * ながれ
 *   木の わく に 石の がっきが ぶらさがる → 子どもが あるいてきて、石を 見上げる(なんだろう?)
 *   → ぼうを ふりあげて、こん! と たたく → 石が ゆれて、音の わ が ひろがる(びっくり)
 *   → 音が 耳に とどいて、手を 耳に あてる → いい 音! にこにこ(音符が ふわふわ)
 *   → ほね が ひかって、絵が うすくなり、字「声」が のこる
 *
 * 子どもは Person。左へ walk してきて、石の下で turnAround して 正面を むく。
 * ぼうは tools の 'stick'(手に にぎる)で、先の 木づち は 先の 点に 描く。手は { to } で 石へ のばす。
 * 石は ひもで ぶらさがって、たたくと ひもの つけね を じくに ゆれる。背景は Backdrop。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, HANG_ARM, LOOKS, mixLimb, PALETTE, Person, personRig, toolEnds, turnAround, walk, type Expression, type Point } from '../sceneFigures'

const CHAR = '声'

const TUNIC = '#e8795a'
const BARK = PALETTE.bark
const BARK_DARK = '#70452b'
const ROPE = '#d9b36a'
const STONE = '#8f9aa6'
const STONE_LIGHT = '#b9c3cd'
const MALLET = '#e0645a'
const WAVE = '#5aaee8'
const NOTE = '#f07f9e'
const CHILD_LOOK = { ...LOOKS.boy, top: TUNIC } as const

/** くぎり の時間(秒) */
const WALK = 1.0
const ARRIVE = 2.3
const LOOK = 2.5
const WIND = 3.3
const HIT = 4.2
const CUP = 4.9
const INK = 6.7
const DONE = 9.2
const DURATION = 10

/** 子どもの 足もと・背の高さ・立つ x */
const CX = 55
const FLOOR = 96
const CHILD_HEIGHT = 50
/** 石に ぼう が とどく ところ(手の いち) */
const STRIKE: Point = [41.5, 63.2]
/** 音の わ の まんなか(ぼう が 石に あたる 場所) */
const IMPACT: Point = [41.5, 42.5]
/** 石を つるす ひもの つけね(石は ここを じくに ゆれる) */
const HANG: Point = [54.4, 22]
/** ぼうの 木づち の 大きさ と、手から 先までの 長さ */
const MALLET_LEN = 19

/** 石を つるす 木の わく。はり(1画目)と 2本の はしら が 下から のびる。 */
function Frame({ t }: SceneProps) {
  const posts = span(t, 0, 0.5, backOut)
  const beam = span(t, 0.25, 0.7, backOut)
  return (
    <>
      <Layer scaleY={posts} origin={[54.5, 97]}>
        <rect x="20.3" y="22" width="4.4" height="75" rx="1.6" fill={BARK} />
        <rect x="83.3" y="20.5" width="4.4" height="76.5" rx="1.6" fill={BARK} />
        <ellipse cx="22.5" cy="96.8" rx="6" ry="2" fill={BARK_DARK} />
        <ellipse cx="85.5" cy="96.8" rx="6" ry="2" fill={BARK_DARK} />
      </Layer>
      <Layer scaleX={beam} origin={[54, 22]}>
        <Bone char={CHAR} n={1} color={BARK} width={5.2} />
        <circle cx="22.8" cy="24.3" r="2.8" fill={BARK_DARK} />
        <circle cx="85.2" cy="19.9" r="2.8" fill={BARK_DARK} />
      </Layer>
    </>
  )
}

/** つるした 石(3画目)と、ひも(2画目)。たたかれると ひもの つけね を じくに ゆれる。 */
function HangingStone({ t }: SceneProps) {
  const drop = span(t, 0.55, 1.1, backOut)
  const since = t - HIT
  const swing = since > 0 ? Math.exp(-since * 1.5) * Math.sin(since * 17) * 4.2 : 0
  return (
    <Layer scaleY={drop} rotate={swing} origin={HANG}>
      <Bone char={CHAR} n={2} color={ROPE} width={1.7} />
      <Bone char={CHAR} n={3} color={STONE} width={7.6} />
      <Bone char={CHAR} n={3} color={STONE_LIGHT} width={2.2} />
      <circle cx="54.4" cy="36.5" r="1.8" fill={ROPE} />
    </Layer>
  )
}

/** たたいた しゅんかん の 小さな ひかり。 */
function Spark({ t }: SceneProps) {
  const p = span(t, HIT, HIT + 0.35, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p} stroke="#ffd24a" strokeWidth="1.2" strokeLinecap="round">
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2 + 0.3
        const r1 = 4.5 + p * 3
        const r2 = 7 + p * 5
        return <line key={i} x1={IMPACT[0] + Math.cos(a) * r1} y1={IMPACT[1] + Math.sin(a) * r1} x2={IMPACT[0] + Math.cos(a) * r2} y2={IMPACT[1] + Math.sin(a) * r2} />
      })}
    </g>
  )
}

/** 音の わ。石から まるく ひろがって、子どもの 耳に とどく。 */
function SoundRings({ t }: SceneProps) {
  return (
    <>
      {[0, 0.3, 0.6].map((offset) => {
        const p = span(t, HIT + offset, HIT + offset + 1.4, easeOut)
        if (p <= 0 || p >= 1) return null
        return <circle key={offset} cx={IMPACT[0]} cy={IMPACT[1]} r={3 + p * 33} fill="none" stroke={WAVE} strokeWidth={1.4 - p * 0.7} opacity={(1 - p) * 0.85} />
      })}
    </>
  )
}


/** ぼうを もつ 手(画面の 点)と ぼうの かたむき(度。0 = 上、+ = 右へ) */
function malletAt(t: number): { readonly hand: Point; readonly angle: number } {
  const windUp = span(t, WIND, HIT - 0.12, easeInOut)
  const strike = span(t, HIT - 0.12, HIT, easeIn)
  const after = span(t, HIT, HIT + 0.6, easeOut)
  const carry = -15
  const angle = t < HIT - 0.12 ? mix(t, WIND, HIT - 0.12, carry, -38, easeInOut) : t < HIT ? mix(t, HIT - 0.12, HIT, -38, 0, easeIn) : -16 * after
  const k = Math.max(windUp, strike)
  const hand: Point = t < HIT ? [43 + (STRIKE[0] - 43) * k, 68 + (STRIKE[1] - 68) * k] : [STRIKE[0] + (42.5 - STRIKE[0]) * after, STRIKE[1] + (68 - STRIKE[1]) * after]
  return { hand, angle }
}

function Child({ t }: { readonly t: number }) {
  // あるく: 右から 石の下まで(左むき)。ぼうを まえに かついで いる
  const w = walk(t, { from: 135, to: CX, start: WALK, end: ARRIVE, build: 'child', height: CHILD_HEIGHT, step: 14 })
  const turn = turnAround(t, ARRIVE, 'left', 'front')
  const walking = t < ARRIVE
  const cup = span(t, CUP, CUP + 0.5, easeInOut)
  const lookUp = span(t, LOOK, LOOK + 0.4, easeOut) * (1 - span(t, HIT + 0.1, HIT + 0.5))
  const happyBounce = t > CUP + 0.7 ? Math.abs(wave(t, 0.9)) * 0.9 : 0
  const hop = t >= HIT && t < HIT + 0.2 ? Math.sin(span(t, HIT, HIT + 0.2) * Math.PI) * 1.6 : 0
  const mallet = malletAt(t)
  const strikeTip: Point = [mallet.hand[0] + MALLET_LEN * Math.sin((mallet.angle * Math.PI) / 180), mallet.hand[1] - MALLET_LEN * Math.cos((mallet.angle * Math.PI) / 180)]

  // あたま: 石を 見あげる → びっくり → 耳のほうへ かたむけて にこにこ
  const tilt = -5 * lookUp + 5 * cup + (t > CUP + 0.7 ? wave(t, 0.9) * 2 : 0)
  const face: Expression = t < HIT ? 'normal' : t < HIT + 0.7 ? 'surprised' : 'smile'
  const rest = HANG_ARM
  const frontPose = { rightArm: { to: mallet.hand }, leftArm: mixLimb(rest, { to: [68.4, 59.5] }, cup), head: tilt }
  const base = walking ? { ...w, pose: { ...w.pose, rightArm: { swing: 35, bend: 50 } } } : { ...w, ...turn, x: CX, pose: frontPose }
  const place = { ...base, y: FLOOR, lift: hop + happyBounce, look: CHILD_LOOK, face, gaze: -0.5, gazeY: -lookUp * 0.8 } as const
  const tool = walking ? ({ kind: 'stick', angle: -100 } as const) : ({ kind: 'stick', tip: strikeTip } as const)
  const rig = personRig(place)
  const hand = rig.world.arms.right.end
  const tip = toolEnds(tool, hand, rig.scale).tip
  const rot = (Math.atan2(tip[0] - hand[0], hand[1] - tip[1]) * 180) / Math.PI
  return (
    <>
      <Person {...place} tools={{ right: tool }} />
      <Layer rotate={rot} origin={tip}>
        <rect x={tip[0] - 3.5} y={tip[1] - 5} width="7" height="7.5" rx="3.2" fill={MALLET} />
      </Layer>
    </>
  )
}

/** 音を たのしむ「おんぷ」。耳の そばから ふわふわ のぼる。 */
function Notes({ t }: SceneProps) {
  const show = during(t, CUP + 0.6, INK + 0.1, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.7, 1.4].map((offset, i) => {
        const p = ((t - CUP + offset) % 2.1) / 2.1
        const x = 72 + i * 5 + Math.sin(p * 6 + i) * 1.6
        const y = 52 - p * 20 - i * 2
        return (
          <g key={offset} opacity={Math.sin(p * Math.PI)}>
            <path d={`M${x + 1.1} ${y} v-4.6 l2.6 -0.9 v4.4`} fill="none" stroke={NOTE} strokeWidth="0.85" />
            <ellipse cx={x} cy={y} rx="1.3" ry="0.95" fill={NOTE} />
            <ellipse cx={x + 2.6} cy={y - 0.9} rx="1.3" ry="0.95" fill={NOTE} />
          </g>
        )
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[11, 11]} clouds={[[2, 40, 1], [96, 48, 0.9]]} tufts={[7, 36, 74, 101]} />
        <Frame t={t} />
        <HangingStone t={t} />
        <SoundRings t={t} />
        <Child t={t} />
        <Spark t={t} />
        <Notes t={t} />
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Layer scale={1 + bump} origin={[54.5, 54.5]}>
        <Ink char={CHAR} progress={ink.progress} tint={ink.tint} />
      </Layer>
      <Sparkles cx={54.5} cy={54} progress={ink.sparkle} />
    </>
  )
}

const scene: SceneModule = {
  char: CHAR,
  duration: DURATION,
  beats: [
    { at: 0, label: '木の わく に、石の がっきが ぶらさがる', sound: 'pop' },
    { at: WALK, label: '子どもが あるいてきて、石を 見あげる' },
    { at: WIND, label: 'ぼうを ふりあげる' },
    { at: HIT, label: 'こん! 石を たたく', sound: 'tap' },
    { at: CUP, label: '音が 耳に とどく。いい 音!' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '声 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
