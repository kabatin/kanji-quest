/*
 * 引(ひく): 子どもが 大きな ゆみの つるを、ぐいっと ひく。
 *
 * ほね(画と絵の対応)
 *   1〜3画目(弓) … 左がわに かまえた ゆみ(まんなかを にぎり、うえ と した が まえへ そる)
 *   4画目(丨)    … ひきしぼった つる と、それを ひく 子の うで・からだ の あたり(右はし)
 *                  (字と ぴったりは かさならない。だいたい 同じ 右がわ・たて むき)
 *
 * ながれ
 *   はれた日。まとが たつ → ゆみを もった子が やってきて、まとを みつける(!)
 *   → ゆみを かまえ、つるに や を つがえる → ぐっと ひくが、かたくて ひけない(うーん)
 *   → もう一度、力いっぱい ぐいっと ひく → ひききった! にっこり(まとに ねらいが きまる)
 *   → ほね が ひかって、絵が うすくなり、字「引」が のこる
 *
 * 子と ゆみは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   ゆみを にぎる うで は かた から まえへ のびて、ひじ は ほとんど のびきる。
 *   つる を ひく うで は、手を あご のところへ もってきて、ひじ を うしろへ たかく あげる。
 *   ゆみ は、ひくほど うえ と した が 子の ほうへ しなる。つる は まっすぐ な 糸(ひくと「く」の字)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '引'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#f08a4b'
const TUNIC_DARK = '#d9712f'
const TUNIC_FAR = '#b95f27'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const LEAF = '#55b86e'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const BOW_WOOD = '#a8693a'
const BOW_GRIP = '#d94f45'
const STRING = '#9c8156'
const SHAFT = '#d4a86a'
const RED = '#e8534a'

/** くぎり の時間(秒) */
const ARRIVE = 0.5
const NOTICE = 1.4
const RAISE = 2.0
const NOCK = 3.0
const TRY = 3.0
const SLIP = 3.9
const HARD = 4.4
const FULL = 5.4
const INK = 6.2
const DONE = 9.2
const DURATION = 9.6

type Pt = readonly [number, number]

/** かた の いち(てまえ = ゆみを にぎる うで / むこう = つるを ひく うで) */
const SHOULDER_BOW: Pt = [78, 47]
const SHOULDER_DRAW: Pt = [88, 47]
/** ゆみを にぎる 手の いち: はこぶとき → かまえたとき(ひくほど うで が のびて 左へ) */
const GRIP_CARRY: Pt = [62, 60]
const GRIP_READY: Pt = [56, 46]
/** ひききった とき、ゆみ が まえへ のびる 分 */
const REACH = 11
/** つる を ひく 長さ(や の 長さと 同じ くらい) */
const DRAW_LEN = 27
/** や の 長さ */
const ARROW_LEN = 34
/** や の たかさ(にぎりの すこし 上) */
const ARROW_LIFT = 4
/** 手を おろした とき の、つる を ひく ほうの 手 */
const HAND_HANG: Pt = [84, 76]
const TARGET: Pt = [12, 42]

/** ひく ふかさ(0 = ゆるい / 1 = ひききった)。うーん と ひけず、もどって、もう一度 ぐいっと。 */
function pullAmount(t: number): number {
  return 0.3 * span(t, TRY, TRY + 0.5, easeOut) - 0.18 * span(t, SLIP, SLIP + 0.3) + 0.88 * span(t, HARD, FULL, easeInOut)
}

/** かた・ひじ・手 の じゅんに つながる うで の ひじ の いち。side で まがる むき を えらぶ。 */
function elbowOf(s: Pt, h: Pt, upper: number, fore: number, side: 1 | -1): Pt {
  const dx = h[0] - s[0]
  const dy = h[1] - s[1]
  const dist = Math.max(Math.hypot(dx, dy), 0.01)
  const reach = Math.min(Math.max(dist, Math.abs(upper - fore) + 0.01), upper + fore - 0.01)
  const along = (upper * upper - fore * fore + reach * reach) / (2 * reach)
  const out = Math.sqrt(Math.max(0, upper * upper - along * along))
  const ux = dx / dist
  const uy = dy / dist
  return [s[0] + ux * along - side * uy * out, s[1] + uy * along + side * ux * out]
}

function Limb({ from, hand, upper, fore, side, color }: { readonly from: Pt; readonly hand: Pt; readonly upper: number; readonly fore: number; readonly side: 1 | -1; readonly color: string }) {
  const elbow = elbowOf(from, hand, upper, fore, side)
  return <path d={`M${from[0]} ${from[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="6.4" strokeLinecap="round" strokeLinejoin="round" />
}

function Hand({ at }: { readonly at: Pt }) {
  return <circle cx={at[0]} cy={at[1]} r="3.5" fill={SKIN} />
}

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
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 94 V101 H-4 Z" fill="#e2f2d2" />
      {/* ゆっくり ながれる 雲 */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="40" cy="12" rx="7" ry="3.2" />
        <ellipse cx="45" cy="10.4" rx="5" ry="3.2" />
        <ellipse cx="86" cy="9" rx="6" ry="2.8" />
        <ellipse cx="90.5" cy="7.6" rx="4.2" ry="2.8" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 30, 62, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** まと: 木の あしの うえに のった 輪。ひかりの きらめきは ひききった とき。 */
function Target({ t }: SceneProps) {
  const pop = span(t, 0.15, 0.75, backOut)
  const glint = during(t, FULL + 0.1, INK - 0.1, 0.2)
  return (
    <>
      <ellipse cx={TARGET[0]} cy="97.6" rx={Math.max(0, 11 * pop)} ry="2.4" fill="#000000" opacity="0.1" />
      <Layer scale={pop} origin={[TARGET[0], 96]}>
        <path d={`M${TARGET[0]} ${TARGET[1] + 4} L${TARGET[0] - 8} 96.5 M${TARGET[0]} ${TARGET[1] + 4} L${TARGET[0] + 8} 96.5`} fill="none" stroke={BARK} strokeWidth="2.8" strokeLinecap="round" />
        <circle cx={TARGET[0]} cy={TARGET[1]} r="11.4" fill={BARK_DARK} />
        <circle cx={TARGET[0]} cy={TARGET[1]} r="10.2" fill="#f7efd9" />
        <circle cx={TARGET[0]} cy={TARGET[1]} r="8" fill={RED} />
        <circle cx={TARGET[0]} cy={TARGET[1]} r="5.8" fill="#f7efd9" />
        <circle cx={TARGET[0]} cy={TARGET[1]} r="3.7" fill={RED} />
        <circle cx={TARGET[0]} cy={TARGET[1]} r="1.6" fill={SUN} />
      </Layer>
      <g opacity={glint}>
        <path d={`M${TARGET[0] - 7} ${TARGET[1] - 11} l1 -3 l1 3 l3 1 l-3 1 l-1 3 l-1 -3 l-3 -1 Z`} fill="#fff6c2" />
      </g>
    </>
  )
}

type Mood = 'eager' | 'strain' | 'proud'

/** 顔。左(まと)を むいている。 */
function Face({ mood }: { readonly mood: Mood }) {
  return (
    <g transform="translate(51.8 4.4)">
      <circle cx="30.2" cy="24.6" r="9.2" fill={SKIN} />
      <path d="M21.5 23 C21.4 13.8 31.8 11.2 37.8 17 C40.2 20.2 40.2 26 38.2 30.2 C37.6 24.4 33.4 20.2 26.6 20.6 C24.4 20.8 22.6 21.8 21.5 23 Z" fill={HAIR} />
      <circle cx="26.5" cy="28.8" r="2.1" fill="#ff9d9d" opacity="0.55" />
      {mood === 'eager' && (
        <>
          <path d="M23.4 22.9 l3.2 -0.5" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="25.2" cy="25.2" r="1.2" fill="#2b2b2b" />
          <path d="M22.8 29.4 Q24.6 31.4 26.6 29.8" fill="none" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'strain' && (
        <>
          <path d="M23 22.2 l3.8 1.5" stroke={HAIR} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M23.8 24.2 l2.8 1.4 l-2.8 1.4" fill="none" stroke="#2b2b2b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="22.6" y="29" width="4.4" height="2.4" rx="1" fill="#ffffff" stroke="#b9483f" strokeWidth="0.8" />
          <path d="M24.8 29 v2.4" stroke="#b9483f" strokeWidth="0.5" />
        </>
      )}
      {mood === 'proud' && (
        <>
          <path d="M23.4 22.6 l3.2 -0.4" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M23.6 25.8 Q25.2 24 26.8 25.8" fill="none" stroke="#2b2b2b" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M22.4 29 Q24.6 33.2 27.2 29 Z" fill="#b9483f" />
        </>
      )}
      {/* 1画目の あたりに ぴょこんと はねた かみ */}
      <path d="M31.4 15.6 Q32.2 12.6 33.8 14.6 Q35 12 35.8 15" fill="none" stroke={HAIR} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

type ArcherProps = {
  readonly mood: Mood
  /** ゆみ を にぎる 手 / つる を ひく 手 */
  readonly grip: Pt
  readonly draw: Pt
  readonly bow: ReactBow
  readonly arrow: number
}
type ReactBow = { readonly rotate: number; readonly pull: number }

function Bow({ grip, rotate, pull, draw }: { readonly grip: Pt; readonly rotate: number; readonly pull: number; readonly draw: Pt }) {
  // 手元の ざひょう(ゆみの まんなか を 0,0 にした もの)。ひくほど 上と下の さき が 子の ほうへ しなる。
  const flex = 3.6 * pull
  const lift = 1.3 * pull
  const top: Pt = [4 + flex, -38 + lift]
  const bottom: Pt = [4 + flex, 38 - lift]
  const nock: Pt = [4 + DRAW_LEN * pull, -ARROW_LIFT]
  void draw
  return (
    <g transform={`translate(${grip[0]} ${grip[1]}) rotate(${rotate})`}>
      <path d={`M${top[0]} ${top[1]} C-12 -22 -12 22 ${bottom[0]} ${bottom[1]}`} fill="none" stroke={BOW_WOOD} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M-8.2 -7 q-0.6 7 0 14" fill="none" stroke={BOW_GRIP} strokeWidth="4" strokeLinecap="round" />
      <path d={`M${top[0]} ${top[1]} L${nock[0]} ${nock[1]} L${bottom[0]} ${bottom[1]}`} fill="none" stroke={STRING} strokeWidth="0.9" strokeLinejoin="round" strokeLinecap="round" />
    </g>
  )
}

function Arrow({ draw, opacity }: { readonly draw: Pt; readonly opacity: number }) {
  if (opacity <= 0) return null
  const tail = draw[0] + 1.5
  const tip = draw[0] + 1.5 - ARROW_LEN
  const y = draw[1]
  return (
    <g opacity={opacity}>
      <path d={`M${tail} ${y} L${tip} ${y}`} stroke={SHAFT} strokeWidth="1.3" strokeLinecap="round" />
      <path d={`M${tip - 3.4} ${y} L${tip + 0.6} ${y - 1.9} L${tip + 0.6} ${y + 1.9} Z`} fill="#8c97a6" />
      <path d={`M${tail} ${y} l3 -2.6 l-1.2 2.6 l1.2 2.6 Z`} fill={RED} />
      <path d={`M${tail - 3} ${y} l3 -2.4 l-1 2.4 l1 2.4 Z`} fill={RED} />
    </g>
  )
}

function Archer({ mood, grip, draw, bow, arrow }: ArcherProps) {
  return (
    <>
      {/* むこうの うで(つるを ひく うで): からだの うしろ */}
      <Limb from={SHOULDER_DRAW} hand={draw} upper={14} fore={20} side={1} color={TUNIC_FAR} />
      {/* あし */}
      <path d="M79 66 L74 93" stroke={PANTS_DARK} strokeWidth="6.6" strokeLinecap="round" />
      <path d="M87 66 L91 93" stroke={PANTS} strokeWidth="6.6" strokeLinecap="round" />
      <ellipse cx="72.4" cy="94.4" rx="5.4" ry="2.8" fill={SHOE} />
      <ellipse cx="92.4" cy="94.4" rx="5.4" ry="2.8" fill={SHOE} />
      {/* くび と どう */}
      <rect x="79.6" y="35.5" width="5" height="8" rx="2.4" fill={SKIN_SHADE} />
      <rect x="75" y="41" width="16" height="28" rx="7" fill={TUNIC} />
      <path d="M77 62 h12" stroke={TUNIC_DARK} strokeWidth="1.6" strokeLinecap="round" />
      {/* あたま */}
      <Face mood={mood} />
      {/* ゆみ と や */}
      <Bow grip={grip} rotate={bow.rotate} pull={bow.pull} draw={draw} />
      <Arrow draw={draw} opacity={arrow} />
      {/* てまえの うで(ゆみを にぎる うで) */}
      <Limb from={SHOULDER_BOW} hand={grip} upper={17} fore={17} side={-1} color={TUNIC_DARK} />
      <Hand at={grip} />
      <Hand at={draw} />
    </>
  )
}

/** 「!」: まとを みつけた。 */
function Notice({ t }: SceneProps) {
  const show = during(t, NOTICE, RAISE + 0.1, 0.2)
  if (show <= 0) return null
  const pop = span(t, NOTICE, NOTICE + 0.3, backOut)
  return (
    <Layer opacity={show} scale={pop} origin={[82, 14]}>
      <rect x="80.7" y="3.6" width="2.6" height="7.2" rx="1.3" fill="#ef5a3c" />
      <circle cx="82" cy="14" r="1.6" fill="#ef5a3c" />
    </Layer>
  )
}

/** ひけなくて 出る あせ。あたまから とぶ。 */
function Sweat({ t }: SceneProps) {
  const show = during(t, TRY + 0.3, FULL - 0.1, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.45].map((offset) => {
        const p = ((t + offset) % 0.9) / 0.9
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" transform={`translate(${94 + p * 4} ${19 + p * 8 - Math.sin(p * Math.PI) * 4}) rotate(25)`} opacity={1 - p} />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  const pop = span(t, ARRIVE, ARRIVE + 0.6, backOut)
  const raise = span(t, RAISE, RAISE + 0.8, easeInOut)
  const hook = span(t, RAISE + 0.4, NOCK, easeInOut)
  const pull = pullAmount(t)
  // うーん と 力が はいっている間は、体が ぷるぷる ふるえる
  const shake = during(t, TRY + 0.3, FULL, 0.2) * wave(t, 0.13) * 0.45
  const idle = (1 - raise) * wave(t, 1.5) * 0.35

  const baseX = mix(t, RAISE, RAISE + 0.8, GRIP_CARRY[0], GRIP_READY[0])
  const baseY = mix(t, RAISE, RAISE + 0.8, GRIP_CARRY[1], GRIP_READY[1])
  const grip: Pt = [baseX - REACH * pull + shake, baseY]
  const stringPoint: Pt = [grip[0] + 4 + DRAW_LEN * pull, grip[1] - ARROW_LIFT]
  const draw: Pt = [HAND_HANG[0] + (stringPoint[0] - HAND_HANG[0]) * hook, HAND_HANG[1] + (stringPoint[1] - HAND_HANG[1]) * hook]
  const mood: Mood = t < TRY ? 'eager' : t < FULL ? 'strain' : 'proud'
  const arrow = span(t, NOCK - 0.1, NOCK)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Target t={t} />
        <ellipse cx="82" cy="97.4" rx={Math.max(0, 14 * pop)} ry="2.4" fill="#000000" opacity="0.12" />
        <Layer scale={pop} origin={[82, 95]} y={idle}>
          <Archer mood={mood} grip={grip} draw={draw} bow={{ rotate: -10 * (1 - raise), pull }} arrow={arrow} />
          <Sweat t={t} />
        </Layer>
        <Notice t={t} />
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
    { at: 0, label: 'はれた日。まとが たつ', sound: 'pop' },
    { at: ARRIVE, label: 'ゆみを もった子が やってくる' },
    { at: NOTICE, label: 'まとを みつけた', sound: 'pop' },
    { at: RAISE, label: 'ゆみを かまえて、つるに や を つがえる' },
    { at: TRY, label: 'ぐっと ひくが、かたくて うーん' },
    { at: HARD, label: 'もう一度、力いっぱい ぐいっと ひく', sound: 'pop' },
    { at: FULL, label: 'ひききった! にっこり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '引 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
