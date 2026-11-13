/*
 * 円(えん): まるい おかねが ぴかり。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … おかしやさんの たなの 左の はしら
 *   2画目(𠃍)  … たなの 上の いた と、右の はしら(下は 小さな あし)
 *   3画目(丨)  … 上のだんを 左右に わける しきり
 *   4画目(一)  … おかしを のせる いた(下は あいていて、子どもが 立てる)
 *
 * ながれ
 *   おかしやさんの たなが できる(おかしが ならぶ)
 *   → おかしを ほしがる 子が あるいてくる → じーっと おかしを みる
 *   → ポケットを みせて「おかねが ない…」としょんぼり
 *   → 地面で まるい おかねが ぴかり! → かけよって ひろう
 *   → やった! おかねを たかく かかげる(まるい かたち = 円)
 *   → ほね が ひかって、絵が うすくなり、字「円」が のこる
 *
 * 子どもは、ほんものの人の つくり を守る(体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(かた・ひじ・手 を 2本の ほねで つなぐ)。
 *   くび は みじかく、あたま は どう の まんなか の上。
 *   たなの いた は ほんとうは すいへい。字の画との ずれは 2 ほどだけ なので、そのまま 水平に描く。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '円'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#ef7d57'
const SHIRT_DARK = '#d9633f'
const PANTS = '#4a6fa5'
const SHOE = '#6b4a36'
const WOOD = '#8c5b3c'
const WOOD_DARK = '#70452b'
const WOOD_LIGHT = '#a8734e'
const LEAF = '#55b86e'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const COIN = '#ffd24a'
const COIN_DULL = '#d6b45a'
const COIN_RIM = '#e0a42a'
const COIN_RING = '#f2b934'
const MOUTH = '#b9483f'

/** くぎり の時間(秒) */
const WALK = 1.0
const ARRIVE = 2.4
/** おかしを じっと みる */
const WISH = 2.4
/** おかねが なくて しょんぼり */
const SHRUG = 3.1
/** 地面の おかねが ぴかり */
const GLINT = 4.0
const NOTICE = 4.25
/** かけよる → かがむ → ひろう → かかげる */
const PICK = 4.7
const BEND = 5.35
const GET = 5.75
const UP = 6.25
const INK = 7.0
const DONE = 9.7
const DURATION = 10.2

/** 地面に おちている おかね */
const COIN_AT: readonly [number, number] = [72, 93.6]
/** 子どもが かけよって とまる ばしょ(x) */
const STAND_X = 63
const FEET_Y = 94

type Vec = readonly [number, number]
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const lerpVec = (a: Vec, b: Vec, k: number): Vec => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]

/* ───────── 空と地面 ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[10, 10]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="9.3" y="0.6" width="1.4" height="3.2" rx="0.7" fill={SUN} transform={`rotate(${i * 45} 10 10)`} />
        ))}
      </Layer>
      <circle cx="10" cy="10" r={4.8 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="92" cy="8" rx="6" ry="2.8" />
        <ellipse cx="96.5" cy="6.4" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 40, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/* ───────── おかしやさんの たな ───────── */

/** 木の いた。上に ハイライト、下に かげ(1だん だけ) */
function Board({ x, y, w, h }: { readonly x: number; readonly y: number; readonly w: number; readonly h: number }) {
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx="1.6" fill={WOOD} />
      <rect x={x + 0.8} y={y + 0.6} width={Math.max(0, w - 1.6)} height="1" rx="0.5" fill={WOOD_LIGHT} />
      <rect x={x} y={y + h - 1.1} width={w} height="1.1" rx="0.5" fill={WOOD_DARK} />
    </>
  )
}

/** たての はしら。左がわに ハイライト、右がわに かげ */
function Post({ x, y, w, h }: { readonly x: number; readonly y: number; readonly w: number; readonly h: number }) {
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx="1.6" fill={WOOD} />
      <rect x={x + 0.7} y={y + 0.8} width="1" height={Math.max(0, h - 1.6)} rx="0.5" fill={WOOD_LIGHT} />
      <rect x={x + w - 1.2} y={y} width="1.2" height={h} rx="0.5" fill={WOOD_DARK} />
    </>
  )
}

function Stall({ t }: SceneProps) {
  // はしら が下から のび、いた が よこへ のび、さいごに おかしが ぽん と ならぶ
  const posts = span(t, 0.05, 0.55, backOut)
  const top = span(t, 0.3, 0.7, easeOut)
  const shelf = span(t, 0.4, 0.8, easeOut)
  const goods = span(t, 0.8, 1.3, backOut)
  return (
    <>
      <ellipse cx="55" cy="97.4" rx={36 * posts} ry="2.2" fill="#000000" opacity="0.1" />
      <Layer scaleY={posts} origin={[23.3, 96]}>
        <Post x={20.6} y={17} w={5.4} h={77} />
      </Layer>
      <Layer scaleY={posts} origin={[86.8, 96]}>
        <Post x={84.1} y={17} w={5.4} h={73} />
        {/* 右の はしらの あし(2画目の はね) */}
        <Board x={78} y={87.4} w={11.5} h={3.4} />
      </Layer>
      <Layer scaleY={shelf} origin={[53.5, 55]}>
        <Post x={51.5} y={20} w={4} h={36} />
      </Layer>
      <Layer scaleX={top} origin={[20, 19.5]}>
        <Board x={20.6} y={17} w={68.9} h={5} />
      </Layer>
      <Layer scaleX={shelf} origin={[22, 57]}>
        <Board x={22.5} y={55} w={64} h={4.6} />
      </Layer>
      {/* 左のだん: キャンディの びん */}
      <Layer scale={goods} origin={[39, 55.2]}>
        <rect x="30.4" y="38.6" width="17.2" height="16.6" rx="4.4" fill="#cfeaf7" />
        <rect x="32.4" y="35" width="13.2" height="4.6" rx="2" fill="#e8534a" />
        {[
          [35, 51, '#ff7aa8'],
          [40, 52, '#ffd24a'],
          [44, 50.5, '#6fcf8a'],
          [37.5, 46.5, '#7cc4f2'],
          [42.5, 45.5, '#ff7aa8'],
        ].map(([cx, cy, fill]) => (
          <circle key={`${cx}-${cy}`} cx={cx as number} cy={cy as number} r="2.4" fill={fill as string} />
        ))}
        <rect x="32.2" y="41" width="1.8" height="9" rx="0.9" fill="#ffffff" opacity="0.75" />
      </Layer>
      {/* 右のだん: いちごの ケーキ */}
      <Layer scale={goods} origin={[70, 55.2]}>
        <ellipse cx="70" cy="54.4" rx="12" ry="1.8" fill="#f4f4f4" />
        <rect x="61.6" y="43.4" width="16.8" height="11" rx="3" fill="#f4c98a" />
        <rect x="61.6" y="43.4" width="16.8" height="4.4" rx="2.2" fill="#ffffff" />
        <circle cx="70" cy="41.6" r="2.8" fill="#e8534a" />
        <circle cx="69.2" cy="40.8" r="0.7" fill="#ffd5d0" />
      </Layer>
    </>
  )
}

/* ───────── 子ども ───────── */

type Mood = 'smile' | 'wish' | 'sad' | 'surprised' | 'happy'

/** かた(左右)の いち。体の まんなかを x = 0 に して描く */
const SHOULDER_X = 6.2
const SHOULDER_Y = 78
/** 上うで・したうでの 長さ(にのうでと うでさき) */
const ARM_PART = 7.2

/** 手の いち と、ひじ を どっちへ まげるか */
type HandPose = { readonly hand: Vec; readonly prefer: Vec }
const lerpPose = (a: HandPose, b: HandPose, k: number): HandPose => ({ hand: lerpVec(a.hand, b.hand, k), prefer: lerpVec(a.prefer, b.prefer, k) })

type SolvedArm = { readonly shoulder: Vec; readonly elbow: Vec; readonly hand: Vec }

/** かた → ひじ → 手 の 2本で つなぐ。手が とどかないときは、うでを のばしきった ところまで。 */
function solveArm(side: number, pose: HandPose): SolvedArm {
  const sx = side * SHOULDER_X
  const dx = pose.hand[0] - sx
  const dy = pose.hand[1] - SHOULDER_Y
  const dist = Math.hypot(dx, dy) || 0.001
  const reach = Math.min(dist, ARM_PART * 2 - 0.05)
  const ux = dx / dist
  const uy = dy / dist
  const half = reach / 2
  const bulge = Math.sqrt(Math.max(0, ARM_PART * ARM_PART - half * half))
  const flip = -uy * pose.prefer[0] + ux * pose.prefer[1] < 0 ? -1 : 1
  return {
    shoulder: [sx, SHOULDER_Y],
    elbow: [sx + ux * half - uy * bulge * flip, SHOULDER_Y + uy * half + ux * bulge * flip],
    hand: [sx + ux * reach, SHOULDER_Y + uy * reach],
  }
}

const hanging = (side: number, stride: number): HandPose => ({ hand: [side * 8.6, 90 - side * stride * 2.4], prefer: [side, 0.2] })
const shrugging = (side: number): HandPose => ({ hand: [side * 13.5, 73.5], prefer: [side * 0.5, 1] })
const cheering = (side: number): HandPose => ({ hand: [side * 10.5, 65.5], prefer: [side, 0] })

function Arm({ arm }: { readonly arm: SolvedArm }) {
  const { shoulder, elbow, hand } = arm
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={SHIRT_DARK} strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.7" fill={SKIN} />
    </>
  )
}

/** かお。まんなか(0, 66)。気持ちで 目と口を かえる */
function Face({ mood }: { readonly mood: Mood }) {
  const dot = (x: number, y: number, r: number) => <circle cx={x} cy={y} r={r} fill="#2b2b2b" />
  return (
    <>
      <circle cx="-5.6" cy="70.4" r="1.7" fill="#ff9d9d" opacity="0.6" />
      <circle cx="5.6" cy="70.4" r="1.7" fill="#ff9d9d" opacity="0.6" />
      {mood === 'happy' && (
        <>
          <path d="M-4.8 67.6 Q-3.3 65.2 -1.8 67.6 M1.8 67.6 Q3.3 65.2 4.8 67.6" fill="none" stroke="#2b2b2b" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M-2.6 70.2 Q0 75 2.6 70.2 Z" fill={MOUTH} />
        </>
      )}
      {mood === 'smile' && (
        <>
          {dot(-3.3, 67, 1.2)}
          {dot(3.3, 67, 1.2)}
          <path d="M-2 70.6 Q0 72.6 2 70.6" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'wish' && (
        <>
          {dot(-3.3, 66, 1.6)}
          {dot(3.3, 66, 1.6)}
          <circle cx="-3.8" cy="65.4" r="0.6" fill="#ffffff" />
          <circle cx="2.8" cy="65.4" r="0.6" fill="#ffffff" />
          <ellipse cx="0" cy="71.2" rx="1.2" ry="1.6" fill={MOUTH} />
        </>
      )}
      {mood === 'sad' && (
        <>
          {dot(-3.3, 67.4, 1.2)}
          {dot(3.3, 67.4, 1.2)}
          <path d="M-5.4 65.2 L-2.2 63.8 M5.4 65.2 L2.2 63.8" fill="none" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <path d="M-2.2 72.6 Q0 70.4 2.2 72.6" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'surprised' && (
        <>
          {dot(-3.3, 66.6, 1.7)}
          {dot(3.3, 66.6, 1.7)}
          <circle cx="-3.8" cy="66" r="0.6" fill="#ffffff" />
          <circle cx="2.8" cy="66" r="0.6" fill="#ffffff" />
          <ellipse cx="0" cy="71.6" rx="1.4" ry="1.9" fill={MOUTH} />
        </>
      )}
    </>
  )
}

/** まんなかを 0 に した おかね(正面)。手の上で まるく かがやく */
function CoinFace({ r }: { readonly r: number }) {
  return (
    <>
      <circle r={r} fill={COIN_RIM} />
      <circle r={r - 0.8} fill={COIN} />
      <circle r={r * 0.62} fill="none" stroke={COIN_RING} strokeWidth="0.9" />
      <path d={`M${-r * 0.6} ${-r * 0.25} Q${-r * 0.4} ${-r * 0.68} ${r * 0.05} ${-r * 0.7}`} fill="none" stroke="#fff6c8" strokeWidth="1" strokeLinecap="round" />
    </>
  )
}

type PersonProps = {
  readonly t: number
  readonly stride: number
  readonly mood: Mood
  readonly left: SolvedArm
  readonly right: SolvedArm
  readonly headTilt: number
  /** おかねを 手に もっているとき、手の上に あがった度合い(0〜1)。もっていないときは null */
  readonly coinUp: number | null
}

function Person({ t, stride, mood, left, right, headTilt, coinUp }: PersonProps) {
  return (
    <>
      {/* あし: 体の した から。あるくとき かわりばんこ */}
      {[-1, 1].map((s) => (
        <Layer key={s} rotate={s * stride * 16} origin={[s * 2.9, 87]}>
          <rect x={s * 2.9 - 1.9} y="87" width="3.8" height="6.4" rx="1.9" fill={SKIN} />
          <ellipse cx={s * 2.9 + 0.4} cy="93.7" rx="3.5" ry="2" fill={SHOE} />
        </Layer>
      ))}
      <rect x="-6.8" y="84.4" width="13.6" height="6" rx="2.6" fill={PANTS} />
      {/* くび: みじかく、どう と あたま の間 */}
      <rect x="-2.2" y="73" width="4.4" height="5" rx="1.8" fill={SKIN_SHADE} />
      {/* どう */}
      <rect x="-6.6" y="75.6" width="13.2" height="12.6" rx="5" fill={SHIRT} />
      <Arm arm={left} />
      <Arm arm={right} />
      {/* あたま */}
      <Layer rotate={headTilt} origin={[0, 75]}>
        <circle cx="0" cy="66" r="8.6" fill={SKIN} />
        <path d="M-8.8 64.6 C-9.4 55 9.4 55 8.8 64.6 C5.6 60.4 -4.6 60.4 -8.8 64.6 Z" fill={HAIR} />
        <path d="M0.6 57.4 Q1.4 54.2 3.2 55.8 Q3.4 53.4 5 55" fill="none" stroke={HAIR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <Face mood={mood} />
      </Layer>
      {coinUp !== null && (
        <Layer x={right.hand[0]} y={right.hand[1] - 4.8 * coinUp}>
          <Layer scaleY={0.4 + 0.6 * coinUp}>
            <CoinFace r={4.6} />
          </Layer>
          {coinUp >= 1 &&
            [
              [-7.5, -5.5],
              [7.5, -4],
              [0.5, -9],
            ].map(([sx, sy], i) => (
              <Star key={i} cx={sx} cy={sy} r={Math.max(0, 1.8 + 1.4 * wave(t, 0.5, i * 0.17))} color="#ffe27a" spin={t * 90} />
            ))}
        </Layer>
      )}
    </>
  )
}

/* ───────── 地面の おかね ───────── */

/** ひろわれる まえの おかね。ぴかり と ひかって、目を ひく */
function GroundCoin({ t }: SceneProps) {
  const pop = span(t, 1.2, 1.5, backOut)
  if (pop <= 0 || t >= GET) return null
  const bright = t >= GLINT
  const pulse = Math.sin(span(t, GLINT, GLINT + 0.5) * Math.PI)
  const flash = during(t, GLINT, GLINT + 0.9, 0.2)
  return (
    <Layer x={COIN_AT[0]} y={COIN_AT[1]} scale={Math.max(0, pop * (1 + 0.25 * pulse))}>
      {/* よこから 見た おかね: あつみ と おもて */}
      <ellipse cx="0" cy="1" rx="4.6" ry="1.8" fill={COIN_RIM} />
      <ellipse cx="0" cy="0" rx="4.6" ry="1.8" fill={bright ? COIN : COIN_DULL} />
      <ellipse cx="0" cy="0" rx="2.8" ry="1" fill="none" stroke={bright ? COIN_RING : '#b99a45'} strokeWidth="0.6" />
      {flash > 0 && (
        <g opacity={flash}>
          <Star cx={0} cy={-5} r={Math.max(0, 7 * pulse)} color="#ffffff" spin={0} />
          <Star cx={-6} cy={-3} r={Math.max(0, 3 * pulse)} color="#fff3a8" spin={20} />
          <Star cx={6.5} cy={-7} r={Math.max(0, 3.4 * pulse)} color="#fff3a8" spin={40} />
        </g>
      )}
    </Layer>
  )
}

/** おかしを みているとき、びんが きらり */
function JarTwinkle({ t }: SceneProps) {
  const show = during(t, WISH + 0.1, SHRUG, 0.2)
  if (show <= 0) return null
  const r = Math.max(0, 3 + 1.2 * wave(t, 0.5))
  return <Star cx={44.5} cy={42} r={r * show} color="#ffffff" spin={t * 60} />
}

/** あせ(しょんぼり) */
function Sweat({ t, x }: { readonly t: number; readonly x: number }) {
  const show = during(t, SHRUG + 0.25, NOTICE, 0.2)
  if (show <= 0) return null
  const p = span(t, SHRUG + 0.25, NOTICE)
  return <path d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" opacity={show} transform={`translate(${x + 9} ${62 + p * 5})`} />
}

/** 「!」: おかねを みつけた */
function Notice({ t, x }: { readonly t: number; readonly x: number }) {
  const show = during(t, NOTICE, PICK + 0.4, 0.15)
  if (show <= 0) return null
  const pop = span(t, NOTICE, NOTICE + 0.25, backOut)
  return (
    <Layer x={x + 11} y={52} scale={Math.max(0, pop)} opacity={show}>
      <circle r="6" fill="#ffffff" stroke="#e8534a" strokeWidth="0.9" />
      <rect x="-1.1" y="-3.8" width="2.2" height="5.2" rx="1.1" fill="#e8534a" />
      <circle cy="3" r="1.3" fill="#e8534a" />
    </Layer>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  // あるく: 左から たなの まえまで。そのあと おかねへ かけよる
  const px = -18 + (STAND_X - 27 + 18) * span(t, WALK, ARRIVE, easeOut) + 27 * span(t, PICK, BEND, easeInOut)
  const walking = Math.max(during(t, WALK, ARRIVE, 0.25), during(t, PICK, BEND + 0.1, 0.15))
  const stride = Math.sin(t * Math.PI * 2 * 2.3) * walking
  const hop = t >= UP ? Math.abs(Math.sin((t - UP) * Math.PI * 2 * 1.6)) * 2.6 * (1 - span(t, INK - 0.4, INK)) : 0
  const bob = -Math.abs(stride) * 1.2 - hop

  // かがむ: 足もとを じく に まえへ かたむく。ひろったら 立つ
  const lean = 17 * span(t, BEND, GET - 0.1, easeInOut) * (1 - span(t, GET, UP, easeInOut))
  const leanRad = (lean * Math.PI) / 180
  // 地面の おかね の いち を、かたむいた体の中の いち に なおす
  const relX = COIN_AT[0] - px
  const relY = COIN_AT[1] - FEET_Y
  const reachHand: Vec = [relX * Math.cos(leanRad) + relY * Math.sin(leanRad), FEET_Y - relX * Math.sin(leanRad) + relY * Math.cos(leanRad)]
  const reach: HandPose = { hand: reachHand, prefer: [1, 0.3] }

  // うで: ふだんは たれる / しょんぼりで 肩をすくめる / おかねを つかむ / かかげる
  const shrug = span(t, SHRUG, SHRUG + 0.25, easeOut) * (1 - span(t, GLINT + 0.1, GLINT + 0.35))
  const reaching = span(t, BEND - 0.1, BEND + 0.15, easeInOut)
  const raise = span(t, GET, UP, easeOut)
  const rightPose = lerpPose(lerpPose(lerpPose(hanging(1, stride), shrugging(1), shrug), reach, reaching), cheering(1), raise)
  const leftPose = lerpPose(lerpPose(hanging(-1, stride), shrugging(-1), shrug), cheering(-1), raise)

  const mood: Mood = t < WISH ? 'smile' : t < SHRUG ? 'wish' : t < NOTICE ? 'sad' : t < PICK ? 'surprised' : t < GET ? 'smile' : 'happy'
  const headTilt = mood === 'sad' ? 5 : mood === 'happy' ? wave(t, 0.62) * 3 : 0

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Stall t={t} />
        <JarTwinkle t={t} />
        <GroundCoin t={t} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <ellipse cx={px} cy="97.4" rx={9 - hop} ry="2.2" fill="#000000" opacity="0.12" />
          <Layer x={px}>
            <Layer y={bob} rotate={lean} origin={[0, FEET_Y]}>
              <Person t={t} stride={stride} mood={mood} left={solveArm(-1, leftPose)} right={solveArm(1, rightPose)} headTilt={headTilt} coinUp={t >= GET ? raise : null} />
            </Layer>
          </Layer>
          <Sweat t={t} x={px} />
          <Notice t={t} x={px} />
        </Layer>
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
    { at: 0, label: 'おかしやさんの たなが できる', sound: 'pop' },
    { at: WALK, label: 'おかしが ほしい子が あるいてくる' },
    { at: WISH, label: 'おかしを じーっと みる' },
    { at: SHRUG, label: 'おかねが ない… と しょんぼり' },
    { at: GLINT, label: '地面で まるい おかねが ぴかり', sound: 'pop' },
    { at: PICK, label: 'かけよって、ひろう' },
    { at: GET, label: 'やった! おかねを かかげる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '円 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
