/*
 * 九(きゅう): うでを ぐっと まげた 形。ちからこぶ を みせる おとこの子。(共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … まげた うで の 先(ひじ から 上へ たてた うでさき と こぶし)
 *   2画目(乙)  … かた から よこへ のばした うで(上うで)と、まっすぐ立つ 体・あし
 *                  (字と ぴったり重ならなくても、だいたい 同じ場所・同じ向き)
 *
 * ながれ
 *   おとこの子が 立っている → ひよこが やってきて「ちからこぶ みせて」と ふきだしで ねがう
 *   → おとこの子は ちょっと はずかしそう → よし と うなずいて、うでを よこへ あげ、ぐっと まげる
 *   (かおは がんばり顔) → ちからこぶ が ぽこっ。ほこらしい顔、ひよこは おおよろこび
 *   → ほね が ひかって、まげた うで が 字「九」になる
 *
 * 男の子は Person(正面)。うで は かた から出て ひじ で まがる。上うで を よこへ あげてから、
 * ひじ を 曲げて うでさき を たてる。ちからこぶ は ひじ の内がわ(まがった がわ)の 上うで が もりあがる。
 * ひよこ(動物の 部品は まだ ない)は 元の絵のまま。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, PALETTE, Person, personRig, Sweat, type Expression, type PersonProps } from '../sceneFigures'

const CHAR = '九'

const SKIN = PALETTE.skin
const SKIN_SHADE = '#eeb98a'
const SKIN_LIGHT = '#fde3c6'
const HAIR = PALETTE.hair
const SUN = '#ffd24a'
const CHICK = '#ffd95a'
const CHICK_DARK = '#f2bd2f'
const BEAK = '#f08a3c'
const INKY = '#2b2b2b'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const CHICK_IN = 0.8
const ASK = 2.0
const NOD = 3.0
const RAISE_END = 3.9
const BEND_END = 4.8
const CHEER = 4.9
const INK = 6.2
const DONE = 8.8
const DURATION = 9.4

/** 体の まんなか(たて)と、足もと、背の高さ */
const CX = 64
const GROUND = 96
const HEIGHT = 76

const BOY_LOOK = { top: '#f0894a', bottom: '#4f6fb5' } as const

/** 男の子の おきかた。from から ひじ を ぐっと まげた うで まで、おなじ props で personRig に わたす */
function boyProps(t: number): PersonProps {
  // うで: さいしょは ま下に たれる → よこへ あげる → ひじ を まげて うでさき を たてる
  const swing = mix(t, NOD + 0.1, RAISE_END, 6, 90, easeInOut)
  const bend = mix(t, RAISE_END, BEND_END, 0, 90, backOut)
  const flex = { swing, bend }
  const hang = { swing: 6 + wave(t, 2.2) * 1.2, bend: 8 }
  const asking = t >= ASK && t < NOD
  const head = asking ? 4 + wave(t, 1.2) * 1.5 : t < NOD ? 2 : mix(t, BEND_END, BEND_END + 0.4, -2, -4)
  return { x: CX, y: GROUND, build: 'child', height: HEIGHT, facing: 'front', pose: { rightArm: flex, leftArm: hang, head } }
}

/** ちからこぶ: ひじ の内がわ(まがった がわ)の 上うで が、ぽこっと もりあがる */
function Bump({ props, size }: { readonly props: PersonProps; readonly size: number }) {
  if (size <= 0) return null
  const arm = personRig(props).world.arms.right
  const dx = arm.mid[0] - arm.root[0]
  const dy = arm.mid[1] - arm.root[1]
  const len = Math.max(Math.hypot(dx, dy), 0.01)
  // うで の向きの 内がわ(うで を よこにしたとき 上がわ)
  const nx = -dy / len
  const ny = dx / len
  const cx = arm.root[0] + dx * 0.55 + nx * 2.8 * size
  const cy = arm.root[1] + dy * 0.55 + ny * 2.8 * size
  const r = Math.max(0, 4.6 * size)
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={SKIN} />
      <circle cx={cx - r * 0.25} cy={cy - r * 0.3} r={r * 0.42} fill={SKIN_LIGHT} />
      <path d={`M${cx - r * 0.7} ${cy + r * 0.85} Q${cx} ${cy + r * 1.1} ${cx + r * 0.8} ${cy + r * 0.75}`} fill="none" stroke={SKIN_SHADE} strokeWidth="0.9" strokeLinecap="round" />
    </>
  )
}

/** ひよこ。右から ぴょんぴょん はねて きて、さいごは おおよろこびで とびはねる。 */
function Chick({ t }: SceneProps) {
  const arrive = span(t, CHICK_IN, ASK, easeOut)
  if (arrive <= 0) return null
  const x = 125 - arrive * 34
  const walking = arrive < 1
  const cheering = during(t, CHEER, INK + 0.4, 0.2)
  const hop = (walking ? Math.abs(Math.sin(arrive * Math.PI * 4)) * 4 : 0) + Math.abs(wave(t - CHEER, 0.6)) * 8 * cheering
  const wing = walking ? wave(t, 0.2) * 12 : cheering > 0 ? -55 + wave(t, 0.2) * 18 * cheering : 0
  const y = GROUND - 6.5 - hop
  return (
    <>
      <ellipse cx={x} cy="97.4" rx={6.4 - hop * 0.3} ry="1.6" fill="#000000" opacity="0.12" />
      <Layer x={x} y={y}>
        <path d="M-1.6 5 V7 M1.6 5 V7" stroke={BEAK} strokeWidth="1" strokeLinecap="round" />
        <path d="M5.6 -1 l3.2 -1.8 l-0.6 3.4 Z" fill={CHICK_DARK} />
        <ellipse cx="0" cy="0" rx="6.4" ry="5.6" fill={CHICK} />
        <circle cx="-3.4" cy="-5.4" r="4.4" fill={CHICK} />
        <path d="M-7.2 -5.2 l-2.8 0.9 l2.7 1.2 Z" fill={BEAK} />
        <circle cx="-4.4" cy="-6" r="0.75" fill={INKY} />
        <circle cx="-2.2" cy="-3.6" r="1.1" fill={CHEEK} opacity="0.7" />
        <path d="M-3.4 -9.6 q0.6 -2 1.8 -0.8" fill="none" stroke={CHICK_DARK} strokeWidth="0.9" strokeLinecap="round" />
        <Layer rotate={wing} origin={[1.4, -1.8]}>
          <ellipse cx="1.8" cy="0.6" rx="3.8" ry="2.4" fill={CHICK_DARK} />
        </Layer>
      </Layer>
    </>
  )
}

/** ひよこの ふきだし: まげた うでの え(「ちからこぶ みせて」) */
function Wish({ t }: SceneProps) {
  const show = during(t, ASK + 0.1, NOD + 0.2, 0.25)
  if (show <= 0) return null
  const pop = span(t, ASK + 0.1, ASK + 0.5, backOut)
  return (
    <Layer opacity={show} scale={pop} origin={[90, 80]}>
      <circle cx="89.4" cy="78" r="1.5" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <circle cx="88.4" cy="81.6" r="0.95" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <ellipse cx="91" cy="64.5" rx="12.5" ry="10" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.8" />
      <path d="M84.5 69.5 H92.5 V59.5" fill="none" stroke={HAIR} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="92.5" cy="58.6" r="2.2" fill={SKIN_SHADE} />
    </Layer>
  )
}

/** ちからこぶ が出た しゅんかんの「ぐっ」の すじ(ひじの まわり) */
function Power({ t, at }: { readonly t: number; readonly at: readonly [number, number] }) {
  const show = during(t, BEND_END - 0.1, BEND_END + 0.9, 0.15)
  if (show <= 0) return null
  const grow = span(t, BEND_END - 0.1, BEND_END + 0.3, easeOut)
  return (
    <g opacity={show} stroke="#ffb02e" strokeWidth="1.3" strokeLinecap="round" fill="none" transform={`translate(${at[0]} ${at[1]})`}>
      <path d={`M0 ${-2 * grow} v${-3 * grow}`} />
      <path d={`M${4.6 + grow} ${-grow} l${2.4 * grow} ${-2.4 * grow}`} />
      <path d={`M${-4.4 - grow} ${-grow} l${-2.4 * grow} ${-2.4 * grow}`} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 2)
  const appear = span(t, 0, 0.6, backOut)
  const props = boyProps(t)
  const rig = personRig(props)
  const elbow = rig.world.arms.right.mid
  const head = rig.world.head
  const asking = t >= ASK && t < NOD
  // ちからこぶ: ぽこっと出て、ほこらしい間は ぐっぐっと ちから が入る
  const pulse = span(t, BEND_END - 0.3, BEND_END + 0.2, backOut) * (1 + 0.12 * wave(t - BEND_END, 0.55) * span(t, BEND_END + 0.3, BEND_END + 0.6))
  const face: Expression = t < NOD ? 'worried' : t < BEND_END ? 'strain' : 'joy'
  // ひよこを 見る(右がわ)
  const gaze = asking ? 1 : t < NOD ? 0.6 * span(t, CHICK_IN, ASK) : 0
  const pop = 1 + Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.05

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} />
        <Layer scale={appear} origin={[CX, GROUND]}>
          <Person {...props} look={BOY_LOOK} face={face} gaze={gaze} />
          <Bump props={props} size={pulse} />
          <Sweat t={t} x={head[0] + 11} y={head[1] - 8} dir={1} show={during(t, NOD + 0.4, BEND_END, 0.2)} />
          <Power t={t} at={[elbow[0], elbow[1] - 6]} />
        </Layer>
        <Chick t={t} />
        <Wish t={t} />
        <Layer opacity={during(t, CHEER + 0.1, INK + 0.3, 0.2)}>
          <Star cx={84} cy={72 - wave(t, 0.7) * 1.5} r={3} color={SUN} spin={t * 90} />
          <Star cx={98} cy={80 + wave(t, 0.9) * 1.5} r={2.2} color="#ff7a4d" spin={-t * 90} />
          <Star cx={26} cy={58} r={2.4} color={SUN} spin={t * 70} />
        </Layer>
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Layer scale={pop} origin={[54.5, 54.5]}>
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
    { at: 0, label: 'おとこの子が 立っている', sound: 'pop' },
    { at: CHICK_IN, label: 'ひよこが やってくる' },
    { at: ASK, label: 'ひよこが「ちからこぶ みせて」と ねがう', sound: 'pop' },
    { at: NOD, label: 'うでを ぐっと まげる(がんばり顔)' },
    { at: BEND_END, label: 'ちからこぶ が ぽこっ。ほこらしい', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '九 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
