/*
 * 休(やすむ): 人が 木に もたれて ひとやすみ。(共通部品 sceneFigures で 書きなおした ためし)
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … あたまの てっぺんの はねた かみ から、かた を通って、まえに のばした うで
 *                  (さいごに「うーん」と のびを したときだけ、うで が この線に重なる)
 *   2画目(丨)  … 人の どう と あし
 *   3画目(一)  … 木の よこに のびた 大きな えだ
 *   4画目(丨)  … 木の みき
 *   5・6画目   … 左右に たれた えだ
 *
 * ながれ
 *   木が そだつ → つかれた人が あるいてくる → くるっと むきを変えて 木に もたれる
 *   → ぐうぐう ひとやすみ(小鳥が とまる・葉が おちる)
 *   → 目をさまして まっすぐ立ち、うーんと のびを する → ほね が ひかって、絵が うすくなり、字「休」が のこる
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../../sceneParts'
import { Backdrop, Bird, Canopy, mixLimb, PALETTE, Person, personRig, Sigh, Sweat, turnAround, walk, type PersonPose, type Placement } from '../../sceneFigures'

const CHAR = '休'

/** くぎり の時間(秒) */
const WALK = 0.9
const TURN = 2.7
const LEAN = 3.0
const REST = 3.6
/** 目をさまして、のびを しはじめる */
const WAKE = 5.1
const INK = 5.8
const DONE = 8.4
const DURATION = 9

const GROUND = 96
/** 人(こし)の x。どう と あし が 2画目に のる */
const STAND_X = 27.5
const HEIGHT = 80
/** 1画目の 書きおわり(のびを したときの 手先) */
const HAND_GOAL: readonly [number, number] = [10.5, 60.3]

function Tree({ t }: SceneProps) {
  // みき が下から のびて、えだ が ひろがり、さいごに 葉が ぽん と しげる
  const trunk = span(t, 0, 0.55, backOut)
  const boughs = span(t, 0.3, 0.75, backOut)
  const leaves = span(t, 0.5, 1.0, backOut)
  const sway = wave(t, 3.4) * 1.3
  return (
    <>
      <ellipse cx="63" cy="97.6" rx={20 * trunk} ry="3" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.6 + 0.4 * trunk} scaleY={trunk} origin={[62.5, 96]}>
        <path d="M53.5 97 Q59.5 91 58.6 83 L67.4 83 Q67 91 73 97 Z" fill={PALETTE.bark} />
        <Bone char={CHAR} n={4} color={PALETTE.bark} width={9.5} />
        <path d="M60.6 52 q1.6 5 0 11 M65.2 66 q-1.4 5 0.2 10" fill="none" stroke={PALETTE.barkDark} strokeWidth="1.3" strokeLinecap="round" />
      </Layer>
      <Layer scale={boughs} origin={[63, 38]}>
        {[3, 5, 6].map((n) => (
          <Bone key={n} char={CHAR} n={n} color={PALETTE.bark} width={n === 3 ? 6.2 : 5.6} />
        ))}
      </Layer>
      {/* えだの先の 小さな しげみ */}
      <Layer scale={leaves} origin={[63, 38]} rotate={sway * 0.6}>
        <circle cx="96.5" cy="76.5" r="7" fill={PALETTE.leafDark} />
        <circle cx="94" cy="73" r="5" fill={PALETTE.leaf} />
        <circle cx="37.5" cy="80" r="5.4" fill={PALETTE.leafDark} />
        <circle cx="39.5" cy="77" r="4" fill={PALETTE.leaf} />
      </Layer>
      <Canopy x={63} y={20} r={34} grow={span(t, 0.5, 1)} sway={sway} fruit />
    </>
  )
}

/** 人の 場所と かっこう */
function personAt(t: number): Placement & { readonly face: 'sad' | 'closed' | 'smile' } {
  const walking = walk(t, { from: STAND_X - 50, to: STAND_X, start: WALK, end: TURN, build: 'adult', height: HEIGHT, armSwing: 18 })
  const turn = turnAround(t, TURN, 'right', 'left')
  // もたれる: 足もとを じく に、うしろ(木のほう)へ かたむく。目をさますと まっすぐ もどる
  const lean = -mix(t, LEAN, REST - 0.1, 0, 9, backOut) * (1 - span(t, WAKE, WAKE + 0.45))
  const asleep = t >= REST && t < WAKE
  const breath = asleep ? wave(t - REST, 1.8) : 0
  const wake = span(t, WAKE, INK - 0.1, easeInOut)
  // うで は おもさで ま下に たれる(体が かたむいても)。さいごに てまえの うで を 1画目の 先へ のばす
  const hang = { swing: 3 + lean, bend: 8 }
  const resting: PersonPose = { rightArm: mixLimb(hang, { to: HAND_GOAL }, wake), leftArm: hang, torso: breath * 1.2, head: asleep ? -6 + breath : 3 - wake * 7 }
  const pose = t < TURN ? { ...walking.pose, torso: 6, head: 8 } : resting
  return { ...walking, ...(t < TURN ? {} : turn), y: GROUND, lean, pose, face: t < TURN ? 'sad' : asleep ? 'closed' : 'smile' }
}

/** ひとやすみ の「ぐうぐう」。あたまの上から 左上へ のぼる */
function Snore({ t, x, y }: { readonly t: number; readonly x: number; readonly y: number }) {
  const show = during(t, REST + 0.1, WAKE + 0.1, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show} fill={PALETTE.snore} fontWeight="700" fontFamily="inherit">
      {[0, 0.6, 1.2].map((offset, i) => {
        const p = ((t - REST + offset) % 1.8) / 1.8
        return (
          <text key={offset} x={x - p * 13 + Math.sin(p * 7) * 1.4} y={y - p * 13} fontSize={4.2 + i * 1.4 + p * 2.2} opacity={Math.sin(p * Math.PI)}>
            z
          </text>
        )
      })}
    </g>
  )
}

/** ひとやすみ の間に、小鳥が とんできて、えだ に とまる。ちゅんちゅん と うたう */
function Songbird({ t }: SceneProps) {
  const arrive = span(t, REST + 0.2, REST + 1.1, easeOut)
  if (arrive <= 0) return null
  const landed = arrive >= 1
  const note = during(t, REST + 1.3, WAKE, 0.25)
  const nx = 80 - wave(t, 1.2) * 1.2
  const ny = 22 - ((t * 5) % 6)
  return (
    <>
      <Bird x={118 - arrive * 30} y={8 + arrive * 23.4 - Math.sin(arrive * Math.PI) * 9 - (landed ? Math.abs(wave(t, 0.7)) * 0.9 : 0)} t={t} flying={!landed} />
      <g opacity={note} fill="#f07f9e">
        <path d={`M${nx} ${ny} v-4.4 l2.6 -0.8 v4.2`} fill="none" stroke="#f07f9e" strokeWidth="0.8" />
        <ellipse cx={nx - 0.8} cy={ny} rx="1.1" ry="0.8" />
        <ellipse cx={nx + 1.8} cy={ny - 0.8} rx="1.1" ry="0.8" />
      </g>
    </>
  )
}

/** ひとやすみ の間に、葉が1まい ひらひら おちてくる */
function FallingLeaf({ t }: SceneProps) {
  const p = span(t, REST + 0.3, INK - 0.1)
  if (p <= 0) return null
  const x = 76 - p * 22 + Math.sin(p * 9) * 5
  return <path d="M0 -3.4 Q3 0 0 3.4 Q-3 0 0 -3.4 Z" fill={PALETTE.leafLight} stroke={PALETTE.leafDark} strokeWidth="0.5" transform={`translate(${x} ${36 + p * 58}) rotate(${Math.sin(p * 9) * 50 + 20})`} />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)
  const person = personAt(t)
  const head = personRig(person).world.head
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} />
        <Tree t={t} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          {/* 1画目の 書きはじめ: あたまの てっぺんの ぴょこんと はねた かみ */}
          <Person {...person} headwear={<path d="M-0.39 -0.83 Q-0.48 -1.17 -0.67 -0.95 Q-0.8 -1.24 -0.89 -0.9" fill="none" stroke={PALETTE.hair} strokeWidth="0.21" strokeLinecap="round" strokeLinejoin="round" />} />
          <Sweat t={t} x={head[0] - 9} y={head[1] - 6} show={during(t, WALK + 0.2, TURN, 0.2)} />
          <Sigh x={head[0] - 6} y={head[1] + 5} p={span(t, LEAN + 0.15, REST + 0.35, easeOut)} show={during(t, LEAN + 0.15, REST + 0.35, 0.2)} />
          <Snore t={t} x={head[0]} y={head[1] - 12} />
        </Layer>
        <Songbird t={t} />
        <FallingLeaf t={t} />
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
    { at: 0, label: '木が そだつ', sound: 'pop' },
    { at: WALK, label: 'つかれた人が あるいてくる' },
    { at: LEAN, label: '木に もたれる', sound: 'pop' },
    { at: REST, label: 'ぐうぐう ひとやすみ。小鳥が とまる' },
    { at: WAKE, label: '目をさまして、うーんと のびを する' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '休 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
