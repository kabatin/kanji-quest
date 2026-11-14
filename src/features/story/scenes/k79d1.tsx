/*
 * 科(か): いねを ますで はかって わける。(共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)  ← 禾(いね) + 斗(ます)
 *   1画目(ノ)  … いねの ほ。おもたくて 左へ たれる
 *   2画目(一)  … いねの 葉(よこに のびる)
 *   3画目(丨)  … いねの くき
 *   4・5画目   … いねの 左と右の 葉
 *   6・7画目   … ますから ぽんと とびはねる もみ(2つぶ)
 *   8画目(一)  … ますの ふち(いっぱいに はかった ところ)
 *   9画目(丨)  … ますに たてた ながい ひしゃく の え
 *
 * ながれ
 *   いねが そだって、ほが きいろく みのる
 *   → 子どもが かごに もみを いっぱい 入れて あるいてくる。「どれだけ あるのかな」と こまり顔
 *   → かごを かかげて、もみを ますに さらさら あける。ますが いっぱいに なる
 *   → ぴったり はかれて にっこり。かごを おいて ばんざい、もみが ぽーんと とびはねる
 *   → ほね が ひかって、絵が うすくなり、字「科」が のこる
 *
 * 子どもは Person。あるいてくる ところは 右むきの walk() で かごを holdPose で もち、
 * 立ちどまって 正面を むく(turnAround)。かごを かかげる 手は 、かごの 下の かど に {to, depth} で そえる。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Basket, HANG_ARM, holdPose, LOOKS, mixColor, mixLimb, PALETTE, Person, personRig, Sweat, turnAround, walk, type Expression, type Limb } from '../sceneFigures'

const CHAR = '科'

const TUNIC = '#f29b4b'
const LEAF = PALETTE.leaf
const LEAF_DARK = PALETTE.leafDark
const STALK = '#6fbf5a'
const EAR_GREEN = '#9bd06b'
const GOLD = '#e8b93a'
const GOLD_LIGHT = '#f8dc7a'
const GOLD_DARK = '#c99522'
const WOOD = '#c98b4a'
const WOOD_DARK = '#a06a34'
const WOOD_LIGHT = '#e0a965'

/** くぎり の時間(秒) */
const RIPE = 1.4
const WALK = 1.0
const ARRIVE = 2.6
const LIFT = 3.3
const POUR = 3.7
const POUR_END = 5.0
const CHEER = 5.2
const INK = 6.4
const DONE = 9.4
const DURATION = 10

type Point = readonly [number, number]

/** こどもの 足もと・背の高さ・とちゅうの 立つ場所と、ますの 場所 */
const GROUND_Y = 96
const KID_HEIGHT = 52
const STAND_X = 56
const KID_LOOK = { ...LOOKS.boy, top: TUNIC, bottom: '#4f6fa8' } as const
/** ますの ふち(8画目の たかさ)と 左右のはし */
const RIM_Y = 62
const BARREL_L = 70
const BARREL_R = 98
/** かごの はば と、かごを もちあげて あける とき の ずれ(かごの まんなか) */
const BASKET_W = 19
const POUR_SHIFT: Point = [5, -6]

/** 点 p を 角度 deg(右まわり)だけ まわして、中心 c へ うつす */
function turn(p: Point, deg: number, c: Point): Point {
  const r = (deg * Math.PI) / 180
  return [c[0] + p[0] * Math.cos(r) - p[1] * Math.sin(r), c[1] + p[0] * Math.sin(r) + p[1] * Math.cos(r)]
}

/* ───────── いね ───────── */

/** 1画目の ほ(左へ たれる)の 上に ならべる もみ。通り道の点 */
const EAR_POINTS: readonly Point[] = [
  [39.8, 17.3],
  [36.8, 20.1],
  [33.5, 22.5],
  [30, 24.7],
  [26.3, 26.6],
  [22.6, 28.3],
]

function Rice({ t }: SceneProps) {
  const grow = span(t, 0, 1.0, backOut)
  const ripe = span(t, 0.9, RIPE + 1.0)
  // かぜで ゆっくり ゆれる(字になる まえに とまる)
  const sway = wave(t, 3.2) * 1.1 * (1 - span(t, INK - 0.8, INK - 0.2))
  const ear = mixColor(EAR_GREEN, GOLD, ripe)
  return (
    <Layer scaleX={0.7 + 0.3 * grow} scaleY={grow} rotate={sway} origin={[36, 96]}>
      {/* ねもとの はっぱ */}
      <path d="M30.5 97 Q32 90 34.4 88 Q34 93 36.4 97 Z M37.6 97 Q39 91 42.6 89.5 Q41 94 43 97 Z" fill={LEAF} />
      <Bone char={CHAR} n={4} color={LEAF} width={2.2} />
      <Bone char={CHAR} n={5} color={LEAF} width={2.2} />
      <Bone char={CHAR} n={2} color={LEAF_DARK} width={2} />
      <Bone char={CHAR} n={3} color={STALK} width={2.2} />
      <Bone char={CHAR} n={1} color={ear} width={4.2} />
      {/* もみ の つぶ(みのると きいろく ふくらむ) */}
      {EAR_POINTS.map(([x, y], i) => (
        <ellipse key={i} cx={x - 0.6} cy={y + 2.4} rx={1.7 + ripe * 0.3} ry={1.1 + ripe * 0.3} fill={mixColor('#b8de86', GOLD_LIGHT, ripe)} transform={`rotate(${28 + i * 3} ${x - 0.6} ${y + 2.4})`} />
      ))}
    </Layer>
  )
}

/* ───────── ます ───────── */

/** ひしゃくの え は ますの 中に たっている。もみ の山は え の手前に、ますの 前がわ は いちばん手前に 描く */
function Barrel({ t, fill }: SceneProps & { readonly fill: number }) {
  const pop = span(t, 0.4, 1.0, backOut)
  if (pop <= 0) return null
  const peak = RIM_Y - 1 - 5.5 * fill
  const ctrl = 2 * peak - (RIM_Y + 1)
  return (
    <Layer scale={pop} origin={[(BARREL_L + BARREL_R) / 2, 97]}>
      <ellipse cx="84" cy="97.6" rx="17" ry="2.6" fill="#000000" opacity="0.1" />
      <Bone char={CHAR} n={9} color={WOOD_LIGHT} width={3.6} />
      <circle cx="77.9" cy="13.4" r="3" fill={WOOD_DARK} />
      {fill > 0 && <path d={`M${BARREL_L + 1.5} ${RIM_Y + 1} Q84 ${ctrl} ${BARREL_R - 1.5} ${RIM_Y + 1} Z`} fill={GOLD} />}
      {fill > 0 && <path d={`M${BARREL_L + 5} ${RIM_Y + 1} Q80 ${ctrl + 2} 90 ${RIM_Y + 1} Z`} fill={GOLD_LIGHT} opacity="0.7" />}
      <path d={`M${BARREL_L} ${RIM_Y} H${BARREL_R} L${BARREL_R - 1.6} 97 Q84 98.6 ${BARREL_L + 1.6} 97 Z`} fill={WOOD} />
      <rect x={BARREL_L - 1} y={RIM_Y - 0.6} width={BARREL_R - BARREL_L + 2} height="3.6" rx="1.6" fill={WOOD_LIGHT} />
      {[73.5, 91].map((y) => (
        <path key={y} d={`M${BARREL_L + 0.6} ${y} H${BARREL_R - 0.6}`} stroke={WOOD_DARK} strokeWidth="2" strokeLinecap="round" />
      ))}
      {[77, 84, 91].map((x) => (
        <path key={x} d={`M${x} 67 V70.5 M${x} 76.5 V88 M${x} 93.5 V96`} stroke={WOOD_DARK} strokeWidth="0.7" opacity="0.55" />
      ))}
    </Layer>
  )
}

/* ───────── にぎやかし ───────── */

/** かごの ふち から ますへ おちる もみ。ふち の場所(ふち 右はし)から 小さな山なり で おちる */
function Stream({ t, rim, amount }: SceneProps & { readonly rim: Point; readonly amount: number }) {
  if (amount <= 0.05) return null
  return (
    <g opacity={Math.min(1, amount)}>
      {Array.from({ length: 9 }, (_, i) => {
        const p = ((t - POUR) * 2.1 + i / 9) % 1
        const tau = p * 0.5
        const x = rim[0] + (4 + (i % 3) * 3) * tau * 2
        const y = rim[1] + 0.5 * 75 * tau * tau
        return <ellipse key={i} cx={x} cy={y} rx="1.2" ry="0.8" fill={GOLD} transform={`rotate(${i * 40} ${x} ${y})`} />
      })}
    </g>
  )
}

/** ますが いっぱいに なって、もみが 2つぶ ぽーんと とびはねる。字の 6・7画目の 点の あたりで とまる。 */
function Hop({ t }: SceneProps) {
  const goals: readonly (readonly [number, number, number])[] = [
    [63.5, 25.5, 0],
    [60.5, 45, 0.15],
  ]
  return (
    <>
      {goals.map(([gx, gy, delay], i) => {
        const p = span(t, CHEER + delay, INK - 0.05, easeOut)
        if (p <= 0) return null
        const x = 84 + (gx - 84) * p + Math.sin(p * 9) * (1 - p) * 2
        const y = RIM_Y - 3 + (gy - RIM_Y + 3) * p
        return <ellipse key={i} cx={x} cy={y} rx="2.3" ry="1.6" fill={GOLD} stroke={GOLD_DARK} strokeWidth="0.5" transform={`rotate(${35 - i * 70 + p * 160} ${x} ${y})`} />
      })}
    </>
  )
}

/** ますに さわった しゅんかんの きらり */
function Glint({ t }: SceneProps) {
  const show = during(t, POUR_END - 0.3, CHEER + 0.8, 0.2)
  if (show <= 0) return null
  const sz = 2.2 + wave(t, 0.5) * 0.4
  const stars: readonly Point[] = [
    [74, 55],
    [93, 54],
  ]
  return (
    <g opacity={show} fill="#ffffff" stroke={GOLD} strokeWidth="0.4">
      {stars.map(([x, y]) => (
        <path key={x} d={`M${x} ${y - sz} L${x + sz * 0.3} ${y - sz * 0.3} L${x + sz} ${y} L${x + sz * 0.3} ${y + sz * 0.3} L${x} ${y + sz} L${x - sz * 0.3} ${y + sz * 0.3} L${x - sz} ${y} L${x - sz * 0.3} ${y - sz * 0.3} Z`} />
      ))}
    </g>
  )
}

/* ───────── 場面 ───────── */

function faceAt(t: number): Expression {
  return t < POUR_END - 0.5 ? 'worried' : 'joy'
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 9)

  // あるいてくる(右むき)→ 立ちどまって 正面 → かごを かかげる → かたむけて あける → かごを おいて ばんざい
  const come = walk(t, { from: -14, to: STAND_X, start: WALK, end: ARRIVE, height: KID_HEIGHT })
  const spin = turnAround(t, ARRIVE, 'right', 'front', 0.3)
  const place = { x: come.x, y: GROUND_Y, build: 'child', height: KID_HEIGHT, facing: spin.facing, squash: spin.squash } as const
  const carry = holdPose(place, 'chest', BASKET_W - 2)

  const raise = span(t, LIFT - 0.6, LIFT, easeInOut)
  const turnDeg = 62 * span(t, POUR, POUR + 0.7, easeInOut) * (1 - span(t, POUR_END - 0.3, POUR_END + 0.2))
  const drop = span(t, CHEER + 0.1, CHEER + 0.55, easeIn)
  const center: Point = [carry.at[0] + POUR_SHIFT[0] * raise, carry.at[1] + POUR_SHIFT[1] * raise]
  const basketAt: Point = [center[0] - 25 * drop, center[1] + (GROUND_Y - 5.9 - center[1]) * drop]
  const fillFrac = span(t, POUR + 0.3, POUR_END - 0.2)
  const level = t >= POUR_END - 0.1 ? 0 : 1 - 0.95 * fillFrac
  const held = t < CHEER + 0.1
  const basket = (
    <Layer rotate={turnDeg} origin={basketAt}>
      <Basket x={basketAt[0]} y={basketAt[1]} width={BASKET_W} handle={false} items={Array.from({ length: Math.round(level * 5) }, () => GOLD)} />
    </Layer>
  )

  // 手: かごの 下の かど を ささえる(正面)→ ばんざい
  const front = spin.facing === 'front'
  const corner = (side: number): Point => turn([side * BASKET_W * 0.38, 5.9], turnDeg, basketAt)
  const gripK = span(t, ARRIVE + 0.3, ARRIVE + 0.6)
  const gripped = (side: number, base: Limb): Limb => (front ? mixLimb(base, { to: corner(side), depth: 8 }, gripK) : base)
  const cheerK = span(t, CHEER - 0.1, CHEER + 0.3)
  const cheer = (base: Limb): Limb => mixLimb(base, { swing: 155, bend: 15 }, cheerK)
  const baseR = carry.pose.rightArm ?? HANG_ARM
  const baseL = carry.pose.leftArm ?? HANG_ARM
  // 正面で 体の 右手 は 画面の 左がわ(かごの 左の かど)
  const arms = { rightArm: cheer(gripped(-1, baseR)), leftArm: cheer(gripped(1, baseL)) }

  const worried = t < POUR_END - 0.5
  const hop = t >= CHEER + 0.4 ? Math.abs(Math.sin((t - CHEER - 0.4) * Math.PI * 2.2)) * 2.4 * (1 - span(t, INK - 0.6, INK)) : 0
  const props = { ...place, lift: hop, pose: { ...come.pose, ...arms, head: worried ? -6 : 3 } }
  const head = personRig(props).world.head
  const rim = turn([BASKET_W * 0.5, -5.9], turnDeg, basketAt)
  const barrelFill = span(t, POUR + 0.3, POUR_END, easeOut)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.05

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[101, 11]} clouds={[[0, 9, 1], [50, 6, 0.85]]} tufts={[6, 24, 50, 68, 104]} />
        <Rice t={t} />
        <Barrel t={t} fill={barrelFill} />
        <Stream t={t} rim={rim} amount={t >= POUR && t < POUR_END ? (turnDeg - 10) / 20 : 0} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.2)}>
          <Person {...props} look={KID_LOOK} face={faceAt(t)} gaze={t >= ARRIVE ? 0.9 : 0} held={held ? basket : undefined} />
        </Layer>
        {!held && basket}
        <Sweat t={t} x={head[0] + 8} y={head[1] - 2} show={during(t, ARRIVE - 0.4, LIFT + 0.2, 0.2)} dir={1} />
        <Glint t={t} />
        <Hop t={t} />
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
    { at: 0, label: 'いねが そだつ', sound: 'pop' },
    { at: WALK, label: '子どもが もみを もって あるいてくる' },
    { at: LIFT, label: 'かごを かかげる', sound: 'pop' },
    { at: POUR, label: 'もみを ますに あける' },
    { at: CHEER, label: 'ぴったり はかれて ばんざい。もみが とびはねる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '科 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
