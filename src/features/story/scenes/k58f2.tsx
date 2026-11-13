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
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(手の さき を きめて、ひじ は 計算で つなぐ)。
 *   くび は みじかく、あたま は どう の まんなか の上。左右の あし が ある。
 *   お店(ひさし・はしら・のぼり)は、字の ほね を そのまま 使う(もともと そういう形のもの)。
 */
import {
  backOut,
  during,
  easeInOut,
  easeOut,
  inkTiming,
  mix,
  span,
  wave,
  type SceneModule,
  type SceneProps,
} from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '売'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const CHEEK = '#ff9d9d'
const MOUTH = '#b9483f'
const EYE = '#2b2b2b'
const WOOD = '#8c5b3c'
const WOOD_DARK = '#70452b'
const WOOD_LIGHT = '#b98557'
const AWNING = '#e8534a'
const AWNING_DARK = '#c8403a'
const CREAM = '#fff6dc'
const BANNER = '#ffd24a'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const APPLE = '#e8534a'
const APPLE_LIGHT = '#ff8f86'
const COIN = '#ffc233'
const COIN_DARK = '#e0a01c'

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

/** 店の子・おきゃく の たちいち(足もとの y と 大きさ) */
const FLOOR = 96
const SHOP_X = 40
const SHOP_SCALE = 0.95
const GUEST_X = 76
const GUEST_SCALE = 0.85
/** 台の 上の面(y) と、かごの おき場所(x) */
const TABLE_TOP = 76
const BASKET_X = 54
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

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[96, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="95.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 96 13)`} />
        ))}
      </Layer>
      <circle cx="96" cy="13" r={Math.max(0, 6.2 * sun)} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="6" cy="14" rx="7" ry="3.2" />
        <ellipse cx="11" cy="12.2" rx="5" ry="3.2" />
        <ellipse cx="-30" cy="22" rx="6" ry="2.8" />
        <ellipse cx="-25.5" cy="20.4" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 30, 90, 102].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 空を よこぎる 小鳥(にぎやかし) */
function Bird({ t }: SceneProps) {
  const p = span(t, 1.2, 5.2)
  if (p <= 0 || p >= 1) return null
  const x = -6 + p * 122
  const y = 10 + Math.sin(p * 9) * 2.2
  const flap = 0.4 + Math.abs(wave(t, 0.5)) * 0.9
  return (
    <g transform={`translate(${x} ${y}) scale(1 ${flap})`}>
      <path d="M-3.4 0 Q-1.7 -2.8 0 0 Q1.7 -2.8 3.4 0" fill="none" stroke="#5a6b86" strokeWidth="0.9" strokeLinecap="round" />
    </g>
  )
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

type Mood = 'worried' | 'happy' | 'hungry' | 'cheer'

type PersonProps = {
  readonly x: number
  readonly y: number
  /** 1 = みぎむき / -1 = ひだりむき */
  readonly dir: 1 | -1
  readonly scale: number
  readonly stride: number
  readonly mood: Mood
  /** 手の さき(世界の場所)。null のときは 体の よこに たらして ふる */
  readonly nearHand: Point | null
  readonly farHand: Point | null
  readonly swing: number
  readonly headTilt: number
  readonly sweat: number
  readonly tunic: string
  readonly tunicDark: string
  readonly pants: string
  readonly hair: string
  readonly role: 'shop' | 'guest'
}

/** うで の 半分の長さ(かた→ひじ、ひじ→手) */
const ARM = 11
const SHOULDER: Point = [0.5, -37]

/** 手の さき に とどくように、ひじ の場所を 計算する(かた→ひじ→手 と つながる)。 */
function elbowFor(target: Point): { readonly elbow: Point; readonly hand: Point } {
  const dx = target[0] - SHOULDER[0]
  const dy = target[1] - SHOULDER[1]
  const dist = Math.hypot(dx, dy)
  const reach = Math.min(dist, 2 * ARM - 0.05)
  const ux = dist === 0 ? 0 : dx / dist
  const uy = dist === 0 ? 1 : dy / dist
  const hand: Point = [SHOULDER[0] + ux * reach, SHOULDER[1] + uy * reach]
  const mid: Point = [SHOULDER[0] + (ux * reach) / 2, SHOULDER[1] + (uy * reach) / 2]
  const h = Math.sqrt(Math.max(0, ARM * ARM - (reach / 2) ** 2))
  const a: Point = [mid[0] - uy * h, mid[1] + ux * h]
  const b: Point = [mid[0] + uy * h, mid[1] - ux * h]
  // ひじ は 下か うしろへ まがる
  const score = (p: Point) => p[1] - p[0] * 0.3
  return { elbow: score(a) >= score(b) ? a : b, hand }
}

function Arm({ target, color }: { readonly target: Point; readonly color: string }) {
  const { elbow, hand } = elbowFor(target)
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3" fill={SKIN} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  const smiling = mood === 'happy' || mood === 'cheer'
  return (
    <>
      <circle cx="3.4" cy="-46.4" r="1.9" fill={CHEEK} opacity="0.55" />
      {smiling ? (
        <path d="M3.2 -50 Q4.6 -52.4 6 -50" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="4.6" cy="-50" r={mood === 'hungry' ? 1.6 : 1.2} fill={EYE} />
          {mood === 'hungry' && <circle cx="5" cy="-50.5" r="0.5" fill="#ffffff" />}
        </>
      )}
      {mood === 'worried' && (
        <>
          <path d="M3 -53.6 L6.6 -52.4" stroke={EYE} strokeWidth="1" strokeLinecap="round" />
          <path d="M3.8 -44.4 q0.9 -1.2 1.8 0 t1.8 0" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'happy' && <path d="M3.6 -45.8 Q5.6 -43 7.8 -45.6" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />}
      {mood === 'cheer' && <path d="M3.6 -45.8 Q5.8 -41.6 8 -45.8 Z" fill={MOUTH} />}
      {mood === 'hungry' && <ellipse cx="6" cy="-44.8" rx="1.3" ry="1.8" fill={MOUTH} />}
    </>
  )
}

function Person(props: PersonProps) {
  const { x, y, dir, scale, stride, mood, nearHand, farHand, swing, headTilt, sweat, tunic, tunicDark, pants, hair, role } = props
  const toLocal = (p: Point): Point => [(p[0] - x) / (dir * scale), (p[1] - y) / scale]
  const hang = (deg: number): Point => [SHOULDER[0] + Math.sin((deg * Math.PI) / 180) * 19, SHOULDER[1] + Math.cos((deg * Math.PI) / 180) * 19]
  const near = nearHand ? toLocal(nearHand) : hang(swing)
  const far = farHand ? toLocal(farHand) : hang(-swing)
  return (
    <g transform={`translate(${x} ${y}) scale(${dir * scale} ${scale})`}>
      <Arm target={far} color={tunicDark} />
      {/* あし: かわりばんこに ふる(こし が じく) */}
      <Layer rotate={stride * 18} origin={[0, -20]}>
        <rect x="-0.6" y="-20" width="5.2" height="19.6" rx="2.6" fill={pants} opacity="0.85" />
        <ellipse cx="2.6" cy="-0.8" rx="4.6" ry="2.2" fill="#6b4a36" />
      </Layer>
      <Layer rotate={-stride * 18} origin={[0, -20]}>
        <rect x="-4.4" y="-20" width="5.2" height="19.6" rx="2.6" fill={pants} />
        <ellipse cx="-1.2" cy="-0.8" rx="4.6" ry="2.2" fill="#6b4a36" />
      </Layer>
      {/* くび と どう */}
      <rect x="-1.6" y="-43.6" width="3.6" height="7" rx="1.6" fill={SKIN_SHADE} />
      <rect x="-5.4" y="-40" width="11" height="22.4" rx="5" fill={tunic} />
      {role === 'shop' ? (
        <path d="M-4 -31 H4.6 V-18 Q0.3 -16 -4 -18 Z" fill={CREAM} />
      ) : (
        <path d="M-5.4 -24 H5.6 L8 -15 H-8 Z" fill={tunic} />
      )}
      <Arm target={near} color={tunic} />
      {/* あたま(くび を じく に すこし かたむく) */}
      <Layer rotate={headTilt} origin={[0, -42]}>
        {role === 'guest' && <circle cx="-5.4" cy="-58.6" r="3.2" fill={hair} />}
        <circle cx="0.8" cy="-49.5" r="8.2" fill={SKIN} />
        <path d="M-7.2 -50 C-7.6 -59.5 5 -61.5 8.6 -53.5 C5 -55.5 1 -55 -2.4 -52.8 C-4 -51.8 -6 -51 -7.2 -50 Z" fill={hair} />
        {role === 'shop' && (
          <>
            <path d="M-7.2 -52.6 Q1 -57.6 8.1 -54.2" fill="none" stroke={AWNING} strokeWidth="2.6" strokeLinecap="round" />
            <path d="M-7 -52.4 l-4 1.8 M-7 -52.4 l-3.2 3.4" fill="none" stroke={AWNING} strokeWidth="1.8" strokeLinecap="round" />
          </>
        )}
        <Face mood={mood} />
        {sweat > 0 && <path d="M-8.4 -55 q1.7 2.4 0 4 q-1.7 -1.6 0 -4 Z" fill="#7cc4f2" opacity={sweat} transform={`translate(0 ${sweat * 2})`} />}
      </Layer>
    </g>
  )
}

function AppleShape({ cx, cy, r = 3.2 }: { readonly cx: number; readonly cy: number; readonly r?: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={APPLE} />
      <circle cx={cx - r * 0.35} cy={cy - r * 0.3} r={r * 0.3} fill={APPLE_LIGHT} />
      <path d={`M${cx} ${cy - r * 0.9} q0.4 -${r * 0.7} ${r * 0.8} -${r * 0.9}`} fill="none" stroke={WOOD_DARK} strokeWidth="0.7" strokeLinecap="round" />
    </>
  )
}

/** りんごの かご(かい物かご)。apple2 は 1こ だけ とりだせる りんご。 */
function Basket({ cx, cy, apple2 }: { readonly cx: number; readonly cy: number; readonly apple2: boolean }) {
  return (
    <g>
      <AppleShape cx={cx - 4.2} cy={cy - 3.6} />
      <AppleShape cx={cx + 0.6} cy={cy - 4.6} />
      {apple2 && <AppleShape cx={cx + 5} cy={cy - 3.4} />}
      <path d={`M${cx - 8} ${cy - 2.6} H${cx + 8} L${cx + 6.4} ${cy + 3.4} Q${cx} ${cy + 4.4} ${cx - 6.4} ${cy + 3.4} Z`} fill={WOOD_LIGHT} />
      <path d={`M${cx - 7.4} ${cy + 0.2} H${cx + 7.4} M${cx - 6.9} ${cy + 2.2} H${cx + 6.9}`} stroke={WOOD} strokeWidth="0.7" />
    </g>
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

  // ---- 店の子(主役) ----
  const shopWalk = span(t, WALK, WALK + 0.2) * (1 - span(t, ARRIVE - 0.3, ARRIVE))
  const shopStride = Math.sin((t - WALK) * Math.PI * 2 * 1.9) * shopWalk
  const sx = mix(t, WALK, ARRIVE, -16, SHOP_X, easeOut)
  const cheering = t >= GIVE + 0.3
  const shopHop = cheering ? -Math.abs(wave(t, 0.55)) * 2.2 : -Math.abs(shopStride) * 1.2
  const shopMood: Mood = t < GREET ? 'worried' : t < GIVE ? 'happy' : 'cheer'

  // かご: はこぶ間は 店の子の 前。つぎに 台の上へ すべらせる
  const basketX = sx + 10 + (BASKET_X - (SHOP_X + 10)) * span(t, SLIDE, SLID, easeInOut)
  const basketY = 72 + (t < SLIDE ? shopHop : 0)
  const carryNear: Point = [basketX - 4, basketY + 2.5]
  const carryFar: Point = [basketX + 5, basketY + 3]
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
          [GIVE + 0.3, [SHOP_X + 7, 43 + shopHop]],
        ])
  const shopFar: Point =
    t < SLID
      ? carryFar
      : follow(t, [
          [SLID, [BASKET_X + 5, 75]],
          [THINK, hangShop],
          [GIVE, hangShop],
          [GIVE + 0.3, [SHOP_X + 1, 42 + shopHop]],
        ])

  // ---- おきゃく ----
  const gx = mix(t, GUEST, GUEST_ARRIVE, 125, GUEST_X, easeOut)
  const guestWalk = span(t, GUEST, GUEST + 0.2) * (1 - span(t, GUEST_ARRIVE - 0.3, GUEST_ARRIVE))
  const guestStride = Math.sin((t - GUEST) * Math.PI * 2 * 2) * guestWalk
  const joy = t >= GIVE + 0.5
  const guestHop = joy ? -Math.abs(wave(t, 0.6)) * 1.6 : -Math.abs(guestStride) * 1.1
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
  const guestMood: Mood = t < GIVE ? 'hungry' : 'cheer'

  // お金: おきゃくの手 → 台の上へ ちゃりん。りんごは かご → 店の子の手 → おきゃくの手
  const coinFall = span(t, PAY + 0.1, PAY + 0.4)
  const coinAt: Point | null = t < PAY - 0.2 ? null : t < PAY + 0.1 ? [63, 65.4] : lerpPoint([63, 65.4], COIN_SPOT, coinFall ** 2)
  const appleTaken = t >= PAY + 0.1
  const appleAt: Point | null = t < PAY + 0.1 ? null : t < GIVE ? [shopNear[0] + 1, shopNear[1] - 1] : [guestNear?.[0] ?? 0, (guestNear?.[1] ?? 0) - 1]

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Bird t={t} />
        <Shop t={t} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <ellipse cx={sx} cy="97.4" rx="8" ry="2.2" fill="#000000" opacity="0.12" />
          <Person
            x={sx}
            y={FLOOR + shopHop}
            dir={1}
            scale={SHOP_SCALE}
            stride={shopStride}
            mood={shopMood}
            nearHand={t < WALK + 0.2 && t < 0 ? null : shopNear}
            farHand={shopFar}
            swing={0}
            headTilt={t < GREET ? 4 + wave(t, 1.6) * 2 : -3}
            sweat={t > ARRIVE - 0.8 && t < GREET ? 0.5 + Math.abs(wave(t, 1.2)) * 0.5 : 0}
            tunic="#f2a33c"
            tunicDark="#d9892a"
            pants="#3e5c86"
            hair="#5a3b2a"
            role="shop"
          />
        </Layer>
        {/* かご(はこぶ間 と 台の上) */}
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <Basket cx={basketX} cy={basketY} apple2={!appleTaken} />
        </Layer>
        {coinAt && <CoinShape cx={coinAt[0]} cy={coinAt[1]} />}
        <Layer opacity={span(t, GUEST - 0.1, GUEST + 0.15)}>
          <ellipse cx={gx} cy="97.4" rx="7" ry="2" fill="#000000" opacity="0.12" />
          <Person
            x={gx}
            y={FLOOR + guestHop}
            dir={-1}
            scale={GUEST_SCALE}
            stride={guestStride}
            mood={guestMood}
            nearHand={guestNear}
            farHand={guestFar}
            swing={guestStride * 24}
            headTilt={t < GIVE ? -3 : 2}
            sweat={0}
            tunic="#f08fb0"
            tunicDark="#d9779a"
            pants="#6b6bb0"
            hair="#2f2a4a"
            role="guest"
          />
        </Layer>
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
