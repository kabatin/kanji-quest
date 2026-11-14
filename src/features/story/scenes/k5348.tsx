/*
 * 午(ご): もちを つく きねの かたち。お昼の あいず。(共通部品 sceneFigures で 書きなおした もの)
 *
 * ほね(画と絵の対応)  ※ 人は 本当の 体の 大きさ で 描く ので、字とは「だいたい」重なる くらい
 *   1画目(ノ)  … おまつりの 笹竹(ななめに たてかけた 竹)の うえの ほう
 *   2画目(一)  … 竹から わたした なわ と、ぶらさがる ちょうちん
 *   3画目(一)  … 子どもが きねの 持つところ(まきぬの)を にぎる 2本の うで
 *   4画目(丨)  … きね の えの(たかい ぼう)。したは うす の中
 *
 * ながれ
 *   お日さまが のぼる → おなかが ぺこぺこの子が うすの まえに あるいてくる
 *   → きねを もちあげて ドン!(うさぎが もちを ひっくりかえす)× 3かい
 *   → もちが まるく しろく なって、お日さまは まうえ(お昼)。子も うさぎも にっこり
 *   → きね が まっすぐ たち、ほね が ひかって、絵が うすくなり、字「午」が のこる
 *
 * 子どもは Person(あるきは walk、はちまきは headwear)。きねを にぎる のは 両手を { to } で きね の 持つところ へ。
 *   きね は 子どもの held(むこうの 手 は きね の おく、てまえの 手 は きね の まえ)。
 *   うすの ふち より 下は、うすの てまえの かべ が きね を かくす ので、held の きね は ふち より 上だけ 見せる。
 * 動物の部品は まだ ないので、うさぎ は 元の絵の まま(長い 耳と ふわふわの しっぽ、うで は 2つの ほね から ひじ を 計算)。
 * きね は まっすぐ もちあげて、まっすぐ おろす。笹竹・なわ・ちょうちん・うす・もち は ここで 描く。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Dust, HANG_ARM, LOOKS, mixLimb, PALETTE, Person, Sun, Tree, walk, type Expression, type Limb, type Point } from '../sceneFigures'

const CHAR = '午'

const HAPPI = '#e8634a'
const BARK_LIGHT = '#a8714b'
const WOOD_INSIDE = '#4a2f20'
const BAMBOO = '#6dac5a'
const BAMBOO_DARK = '#4c8f52'
const LANTERN = '#e8534a'
const LANTERN_DARK = '#b83d36'
const MOCHI = '#ffffff'
const MOCHI_RICE = '#f3e8c6'
const MOCHI_SHADE = '#e3e8f2'
const RABBIT = '#fdfdff'
const RABBIT_SHADE = '#e0e4f0'
const PINK = '#ff9db0'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'

/** くぎり の時間(秒) */
const ARRIVE = 1.1
/** きねを にぎりはじめる */
const GRAB = 1.5
/** きねが うすの もちを つく しゅんかん */
const HITS: readonly number[] = [2.9, 4.1, 5.3]
const INK = 6.1
const DONE = 8.7
const DURATION = 9.4

/** きね と うす の じく(きねの ぼう の まんなか = 4画目の x) */
const POLE_X = 54.7
/** もちあげたとき、きねが 上がる 高さ */
const LIFT = 14
/** うすの ふち の高さ */
const RIM_Y = 85
/** きねの 持つところ(2本の うで が にぎる 高さ。子どもの むねの あたり) */
const GRIP_Y = 60

/** 子どもの 場所: うすの 左がわ に 立って、まえへ うで を のばして きねを にぎる */
const GROUND = 96
const KID_X = 33
const KID_HEIGHT = 56
const KID_LOOK = { ...LOOKS.boy, top: HAPPI } as const

/** 2つの ほね(かた→ひじ→手)の ひじ を 計算する(うさぎ の うで)。ほねの長さは 変わらない */
function elbowOf(shoulder: Point, hand: Point, part: number): Point {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const dist = Math.min(Math.hypot(dx, dy), part * 2 - 0.01)
  const h = Math.sqrt(Math.max(part * part - (dist / 2) ** 2, 0))
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  // ひじ は 下へ まがる
  const [px, py] = -uy >= uy ? [-uy, ux] : [uy, -ux]
  return [shoulder[0] + (ux * dist) / 2 + px * h, shoulder[1] + (uy * dist) / 2 + py * h]
}

/** きねの 上下。0 = うすの中 / マイナス = もちあげた(その分 上へ) */
function pestleLift(t: number): number {
  // さいしょは ぼうが 上から ストンと たつ
  const settle = (1 - span(t, 0.15, 0.75, easeOut)) * -40
  const pound = HITS.reduce((sum, hit) => {
    if (t < hit - 0.95 || t > hit) return sum
    const up = span(t, hit - 0.95, hit - 0.4, easeOut)
    const down = span(t, hit - 0.4, hit, easeIn)
    return sum - LIFT * up * (1 - down)
  }, 0)
  return settle + pound
}

/** 1つ前の つきから の ちぢみ(つぶれた もちが もどる)。 */
function squashOf(t: number): number {
  return HITS.reduce((sum, hit) => (t < hit ? sum : sum + (1 - span(t, hit, hit + 0.4)) ** 2), 0)
}

/** おまつりの 笹竹: 1画目の すじ。左下の わく の外から ななめに たてかけてある。 */
function BambooPole({ t }: { readonly t: number }) {
  const grow = span(t, 0.05, 0.6, backOut)
  const sway = wave(t, 3.2) * 2.2
  return (
    <Layer scale={grow} origin={[0, 70]}>
      <path d="M17.5 39 L-3 60.5" fill="none" stroke={BAMBOO} strokeWidth="3.6" strokeLinecap="round" />
      <Bone char={CHAR} n={1} color={BAMBOO} width={3.6} />
      {/* ふし */}
      <path d="M26.4 28.2 l-2.6 -1.6 M20.4 36 l-2.8 -1.6 M12 45 l-2.8 -1.6 M5 52.4 l-2.8 -1.6" stroke={BAMBOO_DARK} strokeWidth="1" strokeLinecap="round" />
      {/* 竹の先の 葉(風で ゆれる) */}
      <Layer rotate={sway} origin={[37.5, 9.1]}>
        <path d="M37.5 9.2 Q45 6 52 9.4 Q44 11 37.5 9.2 Z" fill={PALETTE.leaf} />
        <path d="M37.5 9.2 Q32 2.6 24 3.6 Q30 8 37.5 9.2 Z" fill={PALETTE.leafDark} />
        <path d="M37.5 9.2 Q43 1.6 48.6 0.8 Q44 6.4 37.5 9.2 Z" fill={PALETTE.leaf} />
      </Layer>
    </Layer>
  )
}

/** 竹から 木へ わたした なわ と、ぶらさがる ちょうちん: 2画目。 */
function LanternRope({ t }: { readonly t: number }) {
  const show = span(t, 0.3, 0.9, easeOut)
  if (show <= 0) return null
  const ropeY = (x: number) => 27.4 - (x - 30) * 0.1
  return (
    <Layer opacity={show}>
      <path d="M26 27.8 Q55 27.4 93 21.4" fill="none" stroke="#a98a6a" strokeWidth="1.1" strokeLinecap="round" />
      {[37, 46, 64, 73].map((x, i) => {
        const y = ropeY(x) + 0.2
        return (
          <Layer key={x} rotate={wave(t, 2.4, i * 0.5) * 5} origin={[x, y]}>
            <path d={`M${x} ${y} v2.2`} stroke="#a98a6a" strokeWidth="0.8" />
            <ellipse cx={x} cy={y + 6} rx="3.4" ry="4" fill={LANTERN} />
            <path d={`M${x - 1.6} ${y + 2.5} Q${x - 3.6} ${y + 6} ${x - 1.6} ${y + 9.5}`} fill="none" stroke={LANTERN_DARK} strokeWidth="0.9" />
            <rect x={x - 2} y={y + 1.8} width="4" height="1.1" rx="0.5" fill={PALETTE.hair} />
            <rect x={x - 2} y={y + 9.1} width="4" height="1.1" rx="0.5" fill={PALETTE.hair} />
          </Layer>
        )
      })}
    </Layer>
  )
}

/** うす: きの 木ぐち(まるい 木のどうぐ)。うしろの ふち と 中。 */
function MortarBack() {
  return (
    <>
      <ellipse cx={POLE_X} cy={RIM_Y} rx="16" ry="4.6" fill={BARK_LIGHT} />
      <ellipse cx={POLE_X} cy={RIM_Y + 0.2} rx="13.6" ry="3.4" fill={WOOD_INSIDE} />
    </>
  )
}

function MortarFront() {
  return (
    <>
      <path d={`M${POLE_X - 16} ${RIM_Y} Q${POLE_X} ${RIM_Y + 6} ${POLE_X + 16} ${RIM_Y} L${POLE_X + 17} ${RIM_Y + 9} Q${POLE_X + 17.4} 98.6 ${POLE_X + 13} 98.6 L${POLE_X - 13} 98.6 Q${POLE_X - 17.4} 98.6 ${POLE_X - 17} ${RIM_Y + 9} Z`} fill={PALETTE.bark} />
      <path d={`M${POLE_X - 15.6} ${RIM_Y + 6.4} Q${POLE_X} ${RIM_Y + 11.4} ${POLE_X + 15.6} ${RIM_Y + 6.4}`} fill="none" stroke={PALETTE.barkDark} strokeWidth="1.3" strokeLinecap="round" />
      <path d={`M${POLE_X - 12} ${RIM_Y + 8} q-0.4 3 0.2 5`} fill="none" stroke={BARK_LIGHT} strokeWidth="1.2" strokeLinecap="round" />
    </>
  )
}

/** もち: さいしょは ごはんつぶの かたまり、つくたびに まるく しろく なる。つくと ぺたんと つぶれる。 */
function Mochi({ t, squash }: { readonly t: number; readonly squash: number }) {
  const made = span(t, HITS[0], HITS[HITS.length - 1] + 0.3)
  const pop = span(t, 0.3, 0.8, backOut)
  const body = made > 0.5 ? MOCHI : MOCHI_RICE
  return (
    <Layer scaleX={(1 + 0.14 * squash) * (0.9 + 0.1 * made) * pop} scaleY={(1 - 0.34 * squash) * (0.8 + 0.3 * made) * pop} origin={[POLE_X, RIM_Y + 1]}>
      <path d={`M${POLE_X - 12.4} ${RIM_Y + 0.4} Q${POLE_X - 13} ${RIM_Y - 7.6} ${POLE_X} ${RIM_Y - 8.2} Q${POLE_X + 13} ${RIM_Y - 7.6} ${POLE_X + 12.4} ${RIM_Y + 0.4} Q${POLE_X} ${RIM_Y + 3.4} ${POLE_X - 12.4} ${RIM_Y + 0.4} Z`} fill={body} />
      <path d={`M${POLE_X - 12} ${RIM_Y + 0.4} Q${POLE_X} ${RIM_Y + 3} ${POLE_X + 12} ${RIM_Y + 0.4} Q${POLE_X} ${RIM_Y + 1.4} ${POLE_X - 12} ${RIM_Y + 0.4} Z`} fill={MOCHI_SHADE} />
      <ellipse cx={POLE_X - 4.4} cy={RIM_Y - 5} rx="3.4" ry="1.3" fill="#ffffff" opacity="0.8" />
      {made < 0.5 && [-6, -1, 5, 8].map((dx, i) => <circle key={dx} cx={POLE_X + dx} cy={RIM_Y - 2.4 - (i % 2) * 2.6} r="0.8" fill="#d9c99a" />)}
    </Layer>
  )
}

/** きね: 4画目の ぼう。太い あたま と、まきぬの(にぎるところ)つき。 */
function Pestle({ lift }: { readonly lift: number }) {
  return (
    <Layer y={lift}>
      <Bone char={CHAR} n={4} color={PALETTE.bark} width={4.8} to={0.87} />
      <circle cx="53.5" cy="27.4" r="3.2" fill={BARK_LIGHT} />
      <rect x={POLE_X - 4.9} y="66" width="9.8" height="24" rx="3.4" fill={BARK_LIGHT} />
      <rect x={POLE_X - 4.9} y="66" width="4.2" height="24" rx="2" fill={PALETTE.bark} opacity="0.55" />
      {/* まきぬの: すべらないように 赤い ぬのを まく */}
      <rect x={POLE_X - 3.8} y={GRIP_Y - 5} width="7.6" height="10.4" rx="1.6" fill={LANTERN} />
      <path d={`M${POLE_X - 3.8} ${GRIP_Y - 1.4} h7.6 M${POLE_X - 3.8} ${GRIP_Y + 2} h7.6`} stroke={LANTERN_DARK} strokeWidth="0.9" />
    </Layer>
  )
}

/** うすの ふち より 上だけ 見える きね(子どもが にぎる ほう。ふち より 下は うすの かべ が かくす) */
function PestleAboveRim({ lift }: { readonly lift: number }) {
  return (
    <svg x="0" y="0" width="109" height={RIM_Y + 1} viewBox={`0 0 109 ${RIM_Y + 1}`} overflow="hidden">
      <Pestle lift={lift} />
    </svg>
  )
}

type RabbitProps = { readonly hand: Point; readonly happy: boolean; readonly ear: number }

/** うさぎ: ひだり(うす)を むいて すわる。てまえの うで で もちを ひっくりかえす。 */
function Rabbit({ hand, happy, ear }: RabbitProps) {
  const shoulder: Point = [78, 83]
  const elbow = elbowOf(shoulder, hand, 8.6)
  return (
    <>
      <circle cx="92.8" cy="92.4" r="3.3" fill={RABBIT} />
      <ellipse cx="84.6" cy="88.6" rx="8.8" ry="9.8" fill={RABBIT} />
      <path d="M80.4 96 Q86 98.6 92 94 Q91 98.6 86 98.6 Z" fill={RABBIT_SHADE} />
      <ellipse cx="79.2" cy="98" rx="5.4" ry="2.3" fill={RABBIT} />
      <ellipse cx="88.4" cy="98" rx="4.8" ry="2.2" fill={RABBIT_SHADE} />
      {/* みみ: あたま から 長くのびる */}
      <Layer rotate={ear} origin={[79.6, 68]}>
        <ellipse cx="78.4" cy="58.4" rx="2.7" ry="8.8" fill={RABBIT} transform="rotate(-6 78.4 58.4)" />
        <ellipse cx="78.4" cy="58.8" rx="1.2" ry="6" fill={PINK} transform="rotate(-6 78.4 58.8)" />
      </Layer>
      <Layer rotate={-ear * 0.6} origin={[83.8, 68]}>
        <ellipse cx="84.6" cy="59" rx="2.7" ry="8.4" fill={RABBIT_SHADE} transform="rotate(7 84.6 59)" />
      </Layer>
      <circle cx="81" cy="75" r="7.2" fill={RABBIT} />
      <circle cx="77.4" cy="78.4" r="1.9" fill={PINK} opacity="0.6" />
      <circle cx="73.9" cy="75.6" r="1" fill={PINK} />
      {happy ? <path d="M76 74.8 Q77.4 72.8 78.8 74.8" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" /> : <circle cx="77.4" cy="73.8" r="1" fill={EYE} />}
      <path d="M74.2 77.2 Q75.4 78.8 77 77.8" fill="none" stroke={MOUTH} strokeWidth="0.9" strokeLinecap="round" />
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={RABBIT} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.5" fill={RABBIT} stroke={RABBIT_SHADE} strokeWidth="0.7" />
    </>
  )
}

/** あたまに まく はちまき(あたまの まんなか が 0,0、半径 1。右むき) */
function Headband() {
  return (
    <g fill="none" stroke="#ffffff" strokeLinecap="round">
      <path d="M-0.96 -0.28 Q0 -0.82 0.96 -0.28" strokeWidth="0.3" />
      <path d="M-0.96 -0.28 l-0.5 0.12 M-0.96 -0.28 l-0.44 -0.2" strokeWidth="0.2" />
    </g>
  )
}

/** つくたびに、うすの ふちから ほこりが ぱっと とぶ。 */
function Puffs({ t }: { readonly t: number }) {
  return (
    <>
      {HITS.map((hit) => (
        <g key={hit}>
          <Dust x={POLE_X - 17} y={RIM_Y + 2} p={span(t, hit, hit + 0.55, easeOut)} reach={6} />
          <Dust x={POLE_X + 17} y={RIM_Y + 2} p={span(t, hit, hit + 0.55, easeOut)} reach={6} />
        </g>
      ))}
    </>
  )
}

/** おなかが ぐう と なる しるし(ぺこぺこの間だけ)。おなかの まえに ひろがる ふるえ。 */
function Rumble({ t, x, y }: { readonly t: number; readonly x: number; readonly y: number }) {
  const show = during(t, 0.7, GRAB + 0.3, 0.2)
  if (show <= 0) return null
  const j = wave(t, 0.3) * 0.8
  return (
    <g opacity={show} fill="none" stroke="#7a8aa8" strokeWidth="1" strokeLinecap="round">
      <path d={`M${x + 8} ${y + j} q2 -1.6 4 0`} />
      <path d={`M${x + 9} ${y + 4 - j} q2 -1.6 4 0`} />
    </g>
  )
}

function Scene({ t }: { readonly t: number }) {
  const ink = inkTiming(t, INK, DONE, 4)

  const lift = pestleLift(t)
  const squash = squashOf(t)
  const grab = span(t, GRAB, GRAB + 0.55, easeInOut)

  // あるいてくる: 左から うすの まえまで
  const w = walk(t, { from: KID_X - 46, to: KID_X, start: 0.1, end: ARRIVE + 0.3, build: 'child', height: KID_HEIGHT })
  const happyAt = HITS[HITS.length - 1] + 0.45
  const face: Expression = t < GRAB ? 'worried' : t < happyAt ? 'strain' : 'joy'
  // きねの 持つところ を りょうてで にぎる(てまえ = 左の うで、むこう = 右の うで)
  const gripNear: Limb = { to: [POLE_X - 0.4, GRIP_Y + lift + 1] }
  const gripFar: Limb = { to: [POLE_X - 0.8, GRIP_Y + lift - 1.5] }
  const leftArm = mixLimb(w.pose.leftArm ?? HANG_ARM, gripNear, grab)
  const rightArm = mixLimb(w.pose.rightArm ?? HANG_ARM, gripFar, grab)
  const cheerTilt = t >= happyAt ? wave(t, 0.9) * 3 : 0
  const kid = { ...w, y: GROUND, look: KID_LOOK, face, pose: { ...w.pose, leftArm, rightArm, head: face === 'worried' ? 6 : cheerTilt }, opacity: span(t, 0.1, 0.3) }

  // うさぎ: きねが もちあがっている間に、てを のばして もちを ひっくりかえす
  const reach = HITS.reduce((best, hit) => Math.max(best, during(t, hit - 0.9, hit - 0.3, 0.2)), 0)
  const rest: Point = [75.6, 92]
  const mochiSpot: Point = [65.5, RIM_Y - 3.4]
  const cheer = span(t, happyAt, happyAt + 0.3)
  const cheerHand: Point = [74 + wave(t, 0.5) * 1.6, 70 - Math.abs(wave(t, 0.5)) * 2]
  const baseHand: Point = [mix(reach, 0, 1, rest[0], mochiSpot[0]), mix(reach, 0, 1, rest[1], mochiSpot[1])]
  const rabbitHand: Point = [mix(cheer, 0, 1, baseHand[0], cheerHand[0]), mix(cheer, 0, 1, baseHand[1], cheerHand[1])]
  const rabbitPop = span(t, 0.5, 1.1, backOut)

  // お日さま: のぼって、お昼には まうえ
  const sunX = mix(t, 0.3, 5.6, 12, 72, easeInOut)
  const sunY = mix(t, 0.3, 5.6, 38, 9, easeInOut)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={null} clouds={[[2, 52, 0.9]]} tufts={[8, 22, 82, 100]} />
        <Sun t={t} x={sunX} y={sunY} />
        <Layer scale={span(t, 0, 0.6, backOut)} origin={[98, 97]}>
          <Tree x={98} y={97} height={56} sway={wave(t, 3.6) * 1.1} />
        </Layer>
        <BambooPole t={t} />
        <LanternRope t={t} />
        <MortarBack />
        <Mochi t={t} squash={squash} />
        <Pestle lift={lift} />
        <MortarFront />
        <Puffs t={t} />
        <Layer scale={rabbitPop} origin={[84, 98]}>
          <Rabbit hand={rabbitHand} happy={t >= happyAt} ear={wave(t, 1.4) * 2 + (t >= happyAt ? wave(t, 0.5) * 4 : 0)} />
        </Layer>
        <Person {...kid} headwear={<Headband />} held={<PestleAboveRim lift={lift} />} />
        <Rumble t={t} x={w.x - 1} y={GROUND - 36} />
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
    { at: 0, label: 'お日さまが のぼる', sound: 'pop' },
    { at: ARRIVE, label: 'おなかが ぺこぺこの子が うすの まえへ' },
    { at: GRAB, label: 'きねを にぎる', sound: 'pop' },
    { at: HITS[0], label: 'ドン! きねで もちを つく', sound: 'pop' },
    { at: HITS[2], label: 'もちが できた! お日さまは まうえ(お昼)', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '午 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene

