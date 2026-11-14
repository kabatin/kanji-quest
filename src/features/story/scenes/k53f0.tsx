/*
 * 台(だい): 四角い台に、三角の つみきを のせる。
 *
 * ほね(画と絵の対応)
 *   1・2画目(厶) … 台の 上に のせた 三角の つみき(ななめの 2本の へん と てっぺん)
 *   3画目(丨)    … 四角い台の 左の かべ
 *   4画目(𠃍)    … 台の いちばん上の たいらな面 と、右の かべ
 *   5画目(一)    … 台の 下の へり(地面に ついている ところ)
 *
 * ながれ
 *   四角い台が ぽん と できる
 *   → 子どもが 三角の つみきを かかえて あるいてくる(台の上に のせたい。てん線の かげ が その あいず)
 *   → 1回目: 「うーん」と もちあげるけど、おもくて ずるっと さがる。ぐったり
 *   → ふうっと いきを して、もういちど。ぐっと もちあげて、台の上へ そうっと のせる
 *   → ぽん! のった。大よろこびで ばんざい
 *   → ほね が ひかって、絵が うすくなり、字「台」が のこる
 *
 * 人は Person(あるきは walk、手は { to } で つみきの 底に そえる。つみきは held で 両手の あいだ)。
 * 背景は Backdrop・Flower・Butterfly、あせ・ためいきは Sweat・Sigh。台と つみきは ここで 描く。
 * つみきは 台に のせたとき 底が ぺたっと つく。
 *   字の形と ぴったりは 重ならないが、三角が 上・四角が 下 という ならびは 同じ。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, Butterfly, Flower, LOOKS, mixLimb, Person, personRig, Sigh, Sweat, walk, type Expression, type Limb } from '../sceneFigures'

const CHAR = '台'

const WOOD = '#d9a066'
const WOOD_LIGHT = '#ebc088'
const WOOD_DARK = '#bd8450'
const BLOCK = '#e8634a'
const BLOCK_LIGHT = '#f58f76'
const BLOCK_DARK = '#c94c36'
const STAR_YELLOW = '#ffd24a'

/** くぎり の時間(秒) */
const WALK_FROM = 0.7
const WALK_TO = 2.5
/** 「のせたい」の てん線の かげ が出る */
const WISH = 2.1
/** 1回目: もちあげる → ずるっと さがる → ぐったり */
const TRY1 = 2.7
const DROP = 3.3
const SLUMP = 3.8
/** ふうっと いきを して、もういちど */
const RESOLVE = 4.6
const HEAVE = 4.9
const PUSH = 5.5
const SET_DOWN = 6.0
const PLACED = 6.3
const INK = 7.3
const DONE = 10.3
const DURATION = 10.8

/* ───────── ばしょ・大きさ ───────── */

/** 台(四角い きの はこ)。上の面が y = 62、地面に ついている そこが y = 93 */
const TABLE = { left: 29.5, right: 80.5, top: 62, bottom: 93 } as const
/** つみき の 大きさ(元の 絵を この ばいりつ で ちぢめる。子どもが かかえられる 大きさ) */
const BLOCK_SCALE = 0.62
const BLOCK_HALF = 21.5 * BLOCK_SCALE
/** つみきを のせる 台の 上の まんなか */
const BLOCK_ON_TABLE_X = 54
/** かかえているとき の つみきの 底の 高さ と、子どもの すこし まえ(こし からの きょり) */
const BLOCK_CARRY_Y = 72
const BLOCK_AHEAD = 22
const KID_Y = 96
const KID_HEIGHT = 52
const KID_STOP_X = 14
/** 台へ ちかづく ぶん(2回目で 1歩) */
const STEP_CLOSER = 8

/** 四角い台。下から ぽん と ふくらむ。 */
function Table({ t }: SceneProps) {
  const grow = span(t, 0.1, 0.8, backOut)
  const width = TABLE.right - TABLE.left
  const height = TABLE.bottom - TABLE.top
  return (
    <>
      <ellipse cx="55" cy="97.6" rx={31 * grow} ry="3" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.7 + 0.3 * grow} scaleY={grow} origin={[55, TABLE.bottom]}>
        <rect x={TABLE.left} y={TABLE.top} width={width} height={height} rx="3.5" fill={WOOD} />
        {/* 上の ふち を 明るく、右の かべ を 少し くらく */}
        <rect x={TABLE.left} y={TABLE.top} width={width} height="4.4" rx="2.2" fill={WOOD_LIGHT} />
        <rect x={TABLE.right - 4.6} y={TABLE.top + 3} width="4.6" height={height - 3} rx="2" fill={WOOD_DARK} opacity="0.55" />
        {/* きの いた の すじ */}
        <path d={`M${TABLE.left + 2} 77 H${TABLE.right - 4} M${TABLE.left + 2} 86 H${TABLE.right - 4}`} stroke={WOOD_DARK} strokeWidth="1" strokeLinecap="round" opacity="0.75" />
      </Layer>
    </>
  )
}

/* ───────── つみき ───────── */

/** 三角の つみき。底の まんなか が (0, 0)。ふちを まるく する */
function BlockShape() {
  return (
    <>
      <path d="M-21.5 -2.5 L21.5 -2.5 L0 -37 Z" fill={BLOCK} stroke={BLOCK} strokeWidth="5" strokeLinejoin="round" />
      {/* 底に 1だん くらい かげ・左上に ハイライト */}
      <path d="M-23 -2.5 H23 L23.4 0.6 Q23 2.2 21 2.2 H-21 Q-23 2.2 -23.4 0.6 Z" fill={BLOCK_DARK} />
      <path d="M-3 -31 L-15.5 -9 L-8.5 -9 Z" fill={BLOCK_LIGHT} />
      <circle cx="0" cy="-14" r="4.2" fill={STAR_YELLOW} />
    </>
  )
}

/** 台の上の「ここに のせたい」の てん線の かげ */
function WishGhost({ t }: SceneProps) {
  const show = during(t, WISH, PLACED, 0.3)
  if (show <= 0) return null
  const pulse = 0.5 + 0.18 * wave(t, 0.9)
  return (
    <g opacity={show * pulse} transform={`translate(${BLOCK_ON_TABLE_X} ${TABLE.top}) scale(${BLOCK_SCALE})`}>
      <path d="M-21.5 -2.5 L21.5 -2.5 L0 -37 Z" fill="none" stroke={BLOCK} strokeWidth="1.5" strokeDasharray="3 2.6" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

/** のせた しゅんかんの ほこり と、きらきら */
function PlacedEffects({ t }: SceneProps) {
  const p = span(t, PLACED, PLACED + 0.7, easeOut)
  if (p <= 0 || p >= 1) return null
  const fade = 1 - p
  return (
    <>
      {[-1, 1].map((side) => (
        <circle key={side} cx={BLOCK_ON_TABLE_X + side * (BLOCK_HALF + 3 + p * 6)} cy={TABLE.top - 1.5 - p * 3} r={1.8 + p * 2.4} fill="#f3e6d3" opacity={fade * 0.9} />
      ))}
      <g opacity={fade}>
        <Star cx={26} cy={26 - p * 4} r={3.4 * fade + 1} color={STAR_YELLOW} spin={p * 120} />
        <Star cx={82} cy={24 - p * 4} r={3 * fade + 1} color="#ffffff" spin={-p * 120} />
        <Star cx={54} cy={10 - p * 3} r={2.6 * fade + 1} color="#ff9d6a" spin={p * 90} />
      </g>
    </>
  )
}

/* ───────── 場面 ───────── */

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k

function moodAt(t: number): Expression {
  if (t >= PLACED) return 'joy'
  if (t >= HEAVE) return 'strain'
  if (t >= RESOLVE) return 'smile'
  if (t >= SLUMP) return 'worried'
  if (t >= TRY1) return 'strain'
  return 'smile'
}

const FLOWERS = [
  { x: 90, color: '#ff9db8', size: 0.9 },
  { x: 96.5, color: '#ffd24a', size: 1.2 },
  { x: 102, color: '#c8a6f2', size: 0.8 },
] as const

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)

  // あるく: 左から 台の そばまで。つみきを かかえて ゆっくり
  const w = walk(t, { from: -34, to: KID_STOP_X, start: WALK_FROM, end: WALK_TO, build: 'child', height: KID_HEIGHT, armSwing: 6 })
  // 1回目で ずるっと さがったとき、うしろへ よろける。2回目は 台へ 1歩 ちかづく。よろこんで 少し はねる
  const stagger = -2.5 * Math.sin(span(t, DROP, SLUMP + 0.1) * Math.PI)
  const step = STEP_CLOSER * span(t, HEAVE, SET_DOWN - 0.1, easeInOut) - 6 * span(t, PLACED + 0.1, PLACED + 0.7, easeInOut)
  const jumpPower = span(t, PLACED + 0.2, PLACED + 0.35) * (1 - span(t, INK, INK + 0.5))
  const jump = Math.abs(Math.sin(((t - PLACED - 0.2) * Math.PI) / 0.7)) * 3.6 * jumpPower
  const kidX = w.x + step + stagger

  // 体の かたむき・あたまの かたむき
  const lean = 6 * during(t, TRY1, SLUMP, 0.4) + 4 * during(t, SLUMP, RESOLVE, 0.4) + 10 * during(t, HEAVE, PLACED, 0.5)
  const headTilt = 9 * during(t, SLUMP, RESOLVE, 0.4)

  // つみきの 高さ: 1回目は すこし あがって ずるっと もどる。2回目は 台より 上まで もちあげて、おろす
  const firstTry = 9 * (span(t, TRY1, DROP - 0.1, easeOut) - span(t, DROP, SLUMP - 0.1, easeIn))
  const LIFT = 20
  const secondTry = LIFT * span(t, HEAVE, PUSH, easeInOut) - (TABLE.top - (BLOCK_CARRY_Y - LIFT)) * span(t, SET_DOWN, PLACED, easeIn)
  const blockY = BLOCK_CARRY_Y - firstTry - secondTry
  const blockX = lerp(kidX + BLOCK_AHEAD, BLOCK_ON_TABLE_X, span(t, HEAVE + 0.1, SET_DOWN - 0.1, easeInOut))
  const wobble = wave(t - TRY1, 0.36) * 5 * during(t, TRY1 + 0.2, SLUMP, 0.3)
  const thump = Math.sin(span(t, PLACED, PLACED + 0.3) * Math.PI)

  // うで: つみきの 底を 両手で ささえる → のせたら 手を はなして ばんざい
  const release = span(t, PLACED - 0.1, PLACED + 0.2)
  const cheer = span(t, PLACED + 0.1, PLACED + 0.6, easeOut)
  const flail = wave(t, 0.35) * 4 * cheer
  const nearHold: Limb = { to: [blockX - BLOCK_HALF * 0.55 - 3 * release, blockY + 1] }
  const farHold: Limb = { to: [blockX - BLOCK_HALF * 0.1 - 2 * release, blockY + 1] }
  const banzai = (swing: number): Limb => ({ swing: swing + flail, bend: 12 })
  const pose = { ...w.pose, leftArm: mixLimb(nearHold, banzai(142), cheer), rightArm: mixLimb(farHold, banzai(134), cheer), torso: 0, head: headTilt }
  const kid = { ...w, x: kidX, y: KID_Y, lean, lift: jump, look: LOOKS.boy, face: moodAt(t), pose, opacity: span(t, WALK_FROM - 0.1, WALK_FROM + 0.15) }
  const head = personRig({ ...kid, pose: {} }).world.head

  const sweat = Math.max(during(t, TRY1 + 0.1, SLUMP, 0.2), during(t, HEAVE + 0.1, PLACED, 0.2))
  const block = (
    <Layer x={blockX} y={blockY} rotate={wobble}>
      <Layer scaleX={BLOCK_SCALE * (1 + 0.05 * thump)} scaleY={BLOCK_SCALE * (1 - 0.08 * thump)}>
        <BlockShape />
      </Layer>
    </Layer>
  )

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[95, 13]} clouds={[[14, 14, 0.9]]} tufts={[6, 24, 86, 102]} />
        {FLOWERS.map(({ x, color, size }, i) => (
          <Flower key={x} x={x} y={96.5} color={color} size={size} sway={wave(t, 2.6) * 6 * (i % 2 === 0 ? 1 : -1)} />
        ))}
        <Table t={t} />
        <WishGhost t={t} />
        <Person {...kid} held={block} />
        <Sweat t={t} x={head[0] - 6} y={head[1] - 2} show={sweat * kid.opacity} />
        <Sigh x={head[0] + 7} y={head[1] + 4} p={span(t, SLUMP + 0.1, RESOLVE + 0.1, easeOut)} show={during(t, SLUMP + 0.1, RESOLVE + 0.1, 0.25)} dir={1} />
        <PlacedEffects t={t} />
        <Butterfly x={92 + Math.sin(t * 0.9) * 7} y={58 + Math.sin(t * 1.7) * 5} t={t} />
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
    { at: 0, label: '四角い台が できる', sound: 'pop' },
    { at: WALK_FROM, label: '子どもが 三角の つみきを かかえて あるいてくる' },
    { at: WISH, label: '台の 上に のせたい' },
    { at: TRY1, label: 'うーんと もちあげるけど、おもくて ずるっと さがる' },
    { at: SLUMP, label: 'ぐったり。ふうっと いきを する' },
    { at: HEAVE, label: 'もういちど ぐっと もちあげて、台の上へ' },
    { at: PLACED, label: 'のった! ばんざい', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '台 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
