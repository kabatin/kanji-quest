/*
 * 売(うる): 買った りんごを お店の 外に 出して、ほしい人に わたして うる。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … のぼり(ほし旗)の 上の よこぼう
 *   2画目(丨)  … のぼりの ぼう(お店の やねの上に 立つ)
 *   3画目(一)  … のぼりの 下の よこぼう(1画目と 3画目の間に 黄色い 布が はってある)
 *   4画目(丶)  … お店の ひさし(日よけ)の 左に たれた ふち
 *   5画目(乛)  … お店の ひさし の てっぺん(しま もよう の 布)
 *   6画目(ノ)  … ひさし を ささえる 左の はしら(ななめの つっかい)
 *   7画目(乚)  … ひさし を ささえる 右の はしら
 *
 * ながれ
 *   お店が できる → 買った りんごを かごに入れて、店の子が はこんでくる(「うれるかな…」と しんぱい)
 *   → かごを 店の 台に のせる → おなかを すかせた 子が あるいてくる
 *   → お金を おいて、りんごを ゆびさす → 店の子が りんごを わたす
 *   → 2人とも にっこり(店の子は 手を あげて よろこぶ) → ほね が ひかって、絵が うすくなり、字「売」が のこる
 *
 * 人は Person。店の子は 右へ、おきゃくは 左へ walk。手の さきは { to } で つなぐ(ひじ は 部品が 計算する)。
 * かごは 店の子の held。背景は Backdrop、小鳥は Bird、あせは Sweat。
 * お店(ひさし・はしら・のぼり)は、字の ほね を そのまま 使う(もともと そういう形のもの)。
 */
import { backOut, during, easeInOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Basket, Bird, LOOKS, PALETTE, Person, personRig, Sweat, walk, type Expression } from '../sceneFigures'

const CHAR = '売'

const WOOD = PALETTE.bark
const WOOD_DARK = '#70452b'
const WOOD_LIGHT = '#b98557'
const AWNING = '#e8534a'
const AWNING_DARK = '#c8403a'
const CREAM = '#fff6dc'
const BANNER = '#ffd24a'
const APPLE = '#e8534a'
const APPLE_LIGHT = '#ff8f86'
const COIN = '#ffc233'
const COIN_DARK = '#e0a01c'
const SHOP_LOOK = { ...LOOKS.boy, top: '#f2a33c', bottom: '#3e5c86' } as const
const GUEST_LOOK = { ...LOOKS.girl, hair: '#2f2a4a', top: '#f08fb0', bottom: '#6b6bb0' } as const

/** くぎり の時間(秒) */
const WALK = 0.7
const ARRIVE = 2.6
const SLIDE = 3.0
const SLID = 3.5
const THINK = 4.0
const GUEST = 4.2
const GUEST_ARRIVE = 5.8
const GREET = 5.1
const PAY = 5.9
const GIVE = 6.4
const INK = 7.7
const DONE = 10.7
const DURATION = 11.4

/** 店の子・おきゃく の たちいち(足もとの y と 背の高さ) */
const FLOOR = 96
const SHOP_X = 40
const SHOP_HEIGHT = 52
const GUEST_X = 76
const GUEST_HEIGHT = 46
/** 台の 上の面(y) と、かごの おき場所(x・y) */
const TABLE_TOP = 76
const BASKET_X = 54
const BASKET_Y = 72
/** りんごを わたす 場所 */
const HANDOFF: Point = [58, 62]
/** おきゃくの お金が 台に おちる 場所 */
const COIN_SPOT: Point = [66, 73.4]

type Point = readonly [number, number]

const lerpPoint = (a: Point, b: Point, k: number): Point => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/** じかん と 場所 の ならび。前の場所から つぎの場所へ なめらかに うごく手の さき。 */
type Key = readonly [number, Point]
function follow(t: number, keys: readonly Key[]): Point {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i += 1) {
    if (t <= keys[i][0]) return lerpPoint(keys[i - 1][1], keys[i][1], span(t, keys[i - 1][0], keys[i][0], easeInOut))
  }
  return keys[keys.length - 1][1]
}

/** お店: ひさし・はしら・のぼり。ほね(画)を そのまま 使う。 */
function Shop({ t }: SceneProps) {
  const rise = Math.max(0, span(t, 0, 0.8, backOut))
  const flag = Math.max(0, span(t, 0.35, 1.0, backOut))
  const stripeY = (x: number) => 54.7 - (x - 19.75) * 0.093
  return (
    <>
      {/* はしら(ななめの つっかい と 右の はしら) */}
      <Layer scaleY={rise} origin={[54, 97]}>
        <Bone char={CHAR} n={6} color={WOOD} width={3.6} />
        <Bone char={CHAR} n={7} color={WOOD} width={3.6} />
        <ellipse cx="31" cy="97.4" rx="5" ry="1.4" fill="#000000" opacity="0.1" />
      </Layer>
      {/* のぼり: 上と下の よこぼう の間に 黄色い 布。ぼう は やねの上に 立つ */}
      <Layer scale={flag} origin={[54, 50]}>
        <polygon points="28.6,24.4 77.9,21.6 76.8,35.9 32,39" fill={BANNER} />
        <circle cx="43" cy="31" r="4.6" fill={AWNING} />
        <circle cx="43" cy="31" r="2.2" fill={BANNER} />
        <circle cx="66" cy="29.4" r="3.4" fill={AWNING} />
        <Bone char={CHAR} n={1} color={WOOD_DARK} width={2.6} />
        <Bone char={CHAR} n={3} color={WOOD_DARK} width={2.6} />
        <Bone char={CHAR} n={2} color={WOOD} width={3.4} />
        <path d="M54.3 37.3 V50" stroke={WOOD} strokeWidth="3.4" strokeLinecap="round" />
        <circle cx="52.4" cy="8.4" r="2.2" fill={AWNING} />
      </Layer>
      {/* ひさし(日よけ): 赤と白の しま */}
      <Layer scale={rise} origin={[54, 56]}>
        <Bone char={CHAR} n={5} color={AWNING} width={9} />
        <Bone char={CHAR} n={4} color={AWNING_DARK} width={5.4} />
        {[28, 44, 60, 76].map((x) => (
          <rect key={x} x={x - 2.6} y={stripeY(x) - 3.6} width="5.2" height="7.2" rx="1.2" fill={CREAM} transform={`rotate(-5.3 ${x} ${stripeY(x)})`} />
        ))}
        {/* 台(うりもの を のせる 板) */}
        <rect x="37" y={TABLE_TOP} width="41" height="4.4" rx="1.6" fill={WOOD_LIGHT} />
        <rect x="37" y={TABLE_TOP + 3} width="41" height="1.4" rx="0.7" fill={WOOD} />
      </Layer>
    </>
  )
}

/** りんご ひとつ(お金と ひきかえに 手から 手へ わたる) */
function AppleShape({ cx, cy, r = 3.2 }: { readonly cx: number; readonly cy: number; readonly r?: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={APPLE} />
      <circle cx={cx - r * 0.35} cy={cy - r * 0.3} r={r * 0.3} fill={APPLE_LIGHT} />
      <path d={`M${cx} ${cy - r * 0.9} q0.4 -${r * 0.7} ${r * 0.8} -${r * 0.9}`} fill="none" stroke={WOOD_DARK} strokeWidth="0.7" strokeLinecap="round" />
    </>
  )
}

function CoinShape({ cx, cy }: { readonly cx: number; readonly cy: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r="2.6" fill={COIN} />
      <circle cx={cx} cy={cy} r="1.5" fill="none" stroke={COIN_DARK} strokeWidth="0.6" />
    </>
  )
}

/** おきゃくの「りんご ほしいな」の ふきだし */
function Wish({ t }: SceneProps) {
  const show = during(t, GUEST_ARRIVE - 0.4, PAY + 0.2, 0.25)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      <circle cx="88" cy="55" r="1.2" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
      <circle cx="91" cy="50" r="1.9" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
      <ellipse cx="95" cy="39" rx="9" ry="7.6" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <AppleShape cx={95} cy={39.6} r={4.6} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)

  // ---- 店の子(主役): 右へ あるいて、かごを 台へ ----
  const sw = walk(t, { from: -28, to: SHOP_X, start: WALK, end: ARRIVE, build: 'child', height: SHOP_HEIGHT, step: 12 })
  const cheering = t >= GIVE + 0.3
  const shopHop = cheering ? Math.abs(wave(t, 0.55)) * 2.2 : 0
  const shopFace: Expression = t < GREET ? 'worried' : t < GIVE ? 'smile' : 'joy'

  // かご: はこぶ間は 店の子の 前。つぎに 台の上へ すべらせる
  const basketX = sw.x + 12 + (BASKET_X - (SHOP_X + 12)) * span(t, SLIDE, SLID, easeInOut)
  const carryNear: Point = [basketX - 4, BASKET_Y + 2.5]
  const carryFar: Point = [basketX + 5, BASKET_Y + 3]
  const hangShop: Point = [SHOP_X + 3, 79.4]
  const shopNear: Point =
    t < SLID
      ? carryNear
      : follow(t, [
          [SLID, [BASKET_X - 4, 74.5]],
          [THINK, hangShop],
          [THINK + 0.4, [SHOP_X + 6, 57]],
          [GREET, [SHOP_X + 6, 57]],
          [GREET + 0.3, [SHOP_X + 11 + wave(t, 0.4) * 2, 49]],
          [PAY - 0.2, [SHOP_X + 11 + wave(t, 0.4) * 2, 49]],
          [PAY + 0.1, [BASKET_X + 1, 64]],
          [GIVE - 0.1, HANDOFF],
          [GIVE + 0.3, [SHOP_X + 7, 43]],
        ])
  const shopFar: Point =
    t < SLID
      ? carryFar
      : follow(t, [
          [SLID, [BASKET_X + 5, 75]],
          [THINK, hangShop],
          [GIVE, hangShop],
          [GIVE + 0.3, [SHOP_X + 1, 42]],
        ])
  // 右むき: てまえ の 手 は 左 の 手
  const carrying = t >= WALK + 0.2
  const shopPose = carrying ? { ...sw.pose, leftArm: { to: shopNear }, rightArm: { to: shopFar } } : sw.pose
  const shop = { ...sw, y: FLOOR, look: SHOP_LOOK, face: shopFace, lift: shopHop, pose: shopPose } as const
  const shopHead = personRig({ ...shop, pose: {} }).world.head

  // ---- おきゃく: 左へ あるいて、お金を おいて、りんごを うけとる ----
  const gw = walk(t, { from: 125, to: GUEST_X, start: GUEST, end: GUEST_ARRIVE, build: 'child', height: GUEST_HEIGHT, step: 11 })
  const guestHop = t >= GIVE + 0.5 ? Math.abs(wave(t, 0.6)) * 1.6 : 0
  const hangGuest: Point = [GUEST_X - 3, 81.1]
  const guestNear: Point | null =
    t < GUEST_ARRIVE
      ? null
      : follow(t, [
          [GUEST_ARRIVE, hangGuest],
          [PAY + 0.3, HANDOFF],
          [GIVE, HANDOFF],
          [GIVE + 0.5, [GUEST_X - 7, 60]],
        ])
  const guestFar: Point | null =
    t < GUEST_ARRIVE - 0.5
      ? null
      : follow(t, [
          [GUEST_ARRIVE - 0.5, hangGuest],
          [PAY - 0.2, [63, 68]],
          [PAY + 0.1, [63, 68]],
          [GIVE, hangGuest],
        ])
  // 左むき: てまえ の 手 は 右 の 手
  const guestPose = { ...gw.pose, ...(guestNear && { rightArm: { to: guestNear } }), ...(guestFar && { leftArm: { to: guestFar } }) }
  const guestFace: Expression = t < GIVE ? 'normal' : 'joy'
  const guest = { ...gw, y: FLOOR, look: GUEST_LOOK, face: guestFace, lift: guestHop, pose: guestPose } as const

  // お金: おきゃくの手 → 台の上へ ちゃりん。りんごは かご → 店の子の手 → おきゃくの手
  const coinFall = span(t, PAY + 0.1, PAY + 0.4)
  const coinAt: Point | null = t < PAY - 0.2 ? null : t < PAY + 0.1 ? [63, 65.4] : lerpPoint([63, 65.4], COIN_SPOT, coinFall ** 2)
  const appleTaken = t >= PAY + 0.1
  const appleAt: Point | null = t < PAY + 0.1 ? null : t < GIVE ? [shopNear[0] + 1, shopNear[1] - 1] : [guestNear?.[0] ?? 0, (guestNear?.[1] ?? 0) - 1]
  const basket = <Basket x={basketX} y={BASKET_Y} width={16} items={appleTaken ? [APPLE, APPLE] : [APPLE, APPLE, APPLE]} />
  const flyP = span(t, 1.2, 5.2)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[96, 13]} clouds={[[6, 14, 1], [-30, 22, 0.9]]} tufts={[6, 30, 90, 102]} />
        {flyP > 0 && flyP < 1 && <Bird x={-6 + flyP * 122} y={10 + Math.sin(flyP * 9) * 2.2} t={t} flying facing="right" size={0.9} />}
        <Shop t={t} />
        <Person {...shop} held={basket} />
        <Sweat t={t} x={shopHead[0] - 7} y={shopHead[1] - 2} show={t > ARRIVE - 0.8 && t < GREET ? 1 : 0} />
        {coinAt && <CoinShape cx={coinAt[0]} cy={coinAt[1]} />}
        <Person {...guest} />
        {appleAt && <AppleShape cx={appleAt[0]} cy={appleAt[1]} r={3} />}
        <Wish t={t} />
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
    { at: 0, label: 'お店が できる', sound: 'pop' },
    { at: WALK, label: '買った りんごを はこんでくる(うれるかな…)' },
    { at: SLIDE, label: 'かごを 台に のせる', sound: 'pop' },
    { at: GUEST, label: 'おなかを すかせた 子が あるいてくる' },
    { at: PAY, label: 'お金を おいて、りんごを わたす', sound: 'pop' },
    { at: GIVE + 0.3, label: 'うれて にっこり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '売 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
