/*
 * 円(えん): まるい おかねが ぴかり。(共通部品 sceneFigures で 書きなおした)
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
 *   → 地面で まるい おかねが ぴかり! → かけよって、しゃがんで ひろう
 *   → やった! おかねを たかく かかげる(まるい かたち = 円)
 *   → ほね が ひかって、絵が うすくなり、字「円」が のこる
 *
 * 人は Person。あるきは walk、むきは turnAround、しゃがむのは posture('squat')、
 * おかねを かかげる うで は holdPose('overhead')。空・のはらは Backdrop、あせ・「!」は Sweat・Notice。
 * たな・おかし・おかね は ここで 描く。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, HANG_ARM, holdPose, LOOKS, mixLimb, mixPose, Notice, PALETTE, Person, personRig, posture, Sweat, turnAround, walk, type Look, type PersonProps } from '../sceneFigures'

const CHAR = '円'

const WOOD = PALETTE.bark
const WOOD_DARK = PALETTE.barkDark
const WOOD_LIGHT = '#a8734e'
const COIN = '#ffd24a'
const COIN_DULL = '#d6b45a'
const COIN_RIM = '#e0a42a'
const COIN_RING = '#f2b934'

/** 子どもの 見た目(だいだいの シャツ・あおい ズボン) */
const KID_LOOK: Look = { ...LOOKS.boy, top: '#ef7d57', bottom: '#4a6fa5' }

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
/** かけよる → しゃがむ → ひろう → かかげる */
const PICK = 4.7
const BEND = 5.35
const GET = 5.75
const UP = 6.25
const INK = 7.0
const DONE = 9.7
const DURATION = 10.2

/** 地面に おちている おかね */
const COIN_AT: readonly [number, number] = [72, 93.6]
/** 子どもが たなの まえで とまる x と、おかねの よこで とまる x */
const STALL_X = 36
const COIN_STAND_X = 63
const FEET_Y = 94
const KID_HEIGHT = 40
/** おかしを みあげる 目線・しょんぼりの 目線 */
const LOOK_UP = -0.8
const LOOK_DOWN = 0.6

const lerp = (a: number, b: number, k: number) => a + (b - a) * k

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

/** 地面の おかね を つかむ 手 */
const REACH_COIN = { to: [COIN_AT[0] - 1, COIN_AT[1] - 1] } as const

/** おかね を かかげる ときの 立ちかた(うでの 場所は holdPose('overhead')) */
function cheerPlace(x: number): PersonProps {
  return { x, y: FEET_Y, build: 'child', height: KID_HEIGHT, facing: 'front' }
}

/** 子どもの 場所・向き・かっこう: たなの まえ(正面)→ おかねの よこ(右むき・しゃがむ)→ 正面で かかげる */
function kidAt(t: number): PersonProps {
  const face = t < WISH ? 'smile' : t < SHRUG ? 'surprised' : t < NOTICE ? 'sad' : t < PICK ? 'surprised' : t < GET ? 'smile' : 'joy'
  const common = { y: FEET_Y, build: 'child', height: KID_HEIGHT, look: KID_LOOK, face } as const
  if (t < ARRIVE) {
    const w = walk(t, { from: -18, to: STALL_X, start: WALK, end: ARRIVE, build: 'child', height: KID_HEIGHT })
    return { ...common, x: w.x, facing: w.facing, pose: w.pose }
  }
  if (t < PICK - 0.3) {
    // たなの まえで 正面を むき、おかしを みあげる → しょんぼり(かたを すくめる)
    const shrug = span(t, SHRUG, SHRUG + 0.25, easeOut) * (1 - span(t, GLINT + 0.1, GLINT + 0.35))
    const arm = mixLimb(HANG_ARM, { swing: 38, bend: -62 }, shrug)
    const gazeY = t < SHRUG ? LOOK_UP : t < NOTICE ? LOOK_DOWN : 0
    return { ...common, x: STALL_X, ...turnAround(t, ARRIVE, 'right', 'front', 0.2), gaze: t < SHRUG ? -0.5 : 0, gazeY, pose: { leftArm: arm, rightArm: arm, head: t >= SHRUG && t < NOTICE ? 6 : 0 } }
  }
  if (t < GET) {
    const w = walk(t, { from: STALL_X, to: COIN_STAND_X, start: PICK, end: BEND, build: 'child', height: KID_HEIGHT })
    const squat = span(t, BEND, GET - 0.1, easeInOut)
    const pose = mixPose(w.pose, { ...posture('squat', 'right'), rightArm: REACH_COIN }, squat)
    return { ...common, x: w.x, ...turnAround(t, PICK - 0.3, 'front', 'right', 0.2), pose }
  }
  // 立って ふりむき、りょうてで おかねを たかく かかげる
  const raise = span(t, GET, UP, easeOut)
  const stand = span(t, GET, GET + 0.4, easeInOut)
  const hold = holdPose(cheerPlace(COIN_STAND_X), 'overhead', 9)
  const rise = mixPose(posture('squat', 'front'), {}, stand)
  const hop = t >= UP ? Math.abs(Math.sin((t - UP) * Math.PI * 2 * 1.6)) * 2.6 * (1 - span(t, INK - 0.4, INK)) : 0
  const arm = (side: 'leftArm' | 'rightArm') => mixLimb(mixLimb(REACH_COIN, HANG_ARM, stand), hold.pose[side] ?? HANG_ARM, raise)
  return { ...common, x: COIN_STAND_X, ...turnAround(t, GET, 'right', 'front', 0.2), lift: hop, pose: { ...rise, leftArm: arm('leftArm'), rightArm: arm('rightArm') } }
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

/** かかげた おかね(りょうての あいだ)。ひろった ところ から 手の上へ あがり、きらきら */
function HeldCoin({ t, lift }: { readonly t: number; readonly lift: number }) {
  if (t < GET) return null
  const raise = span(t, GET, UP, easeOut)
  const at = holdPose(cheerPlace(COIN_STAND_X), 'overhead', 9).at
  const x = lerp(COIN_AT[0], at[0], raise)
  const y = lerp(COIN_AT[1] - 2, at[1] - 1, raise) - lift
  return (
    <Layer x={x} y={y}>
      <Layer scaleY={0.4 + 0.6 * raise}>
        <CoinFace r={4.6} />
      </Layer>
      {raise >= 1 &&
        [
          [-7.5, -5.5],
          [7.5, -4],
          [0.5, -9],
        ].map(([sx, sy], i) => <Star key={i} cx={sx} cy={sy} r={Math.max(0, 1.8 + 1.4 * wave(t, 0.5, i * 0.17))} color="#ffe27a" spin={t * 90} />)}
    </Layer>
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

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)
  const kid = kidAt(t)
  const head = personRig(kid).world.head
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[10, 10]} clouds={[[92, 8, 0.6]]} tufts={[6, 40, 100]} />
        <Stall t={t} />
        <JarTwinkle t={t} />
        <GroundCoin t={t} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <Person {...kid} />
        </Layer>
        <HeldCoin t={t} lift={kid.lift ?? 0} />
        <Sweat t={t} x={head[0] + 7} y={head[1] - 3} show={during(t, SHRUG + 0.25, NOTICE, 0.2)} dir={1} />
        <Notice x={head[0] + 9} y={head[1] - 12} r={6} show={during(t, NOTICE, PICK + 0.4, 0.15)} />
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
