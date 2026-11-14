/*
 * 弟(おとうと): ぼうに ひもを じゅんばんに まく。じゅんばんが あとの おとこのこ。(共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)
 *   1・2画目   … ぼうの てっぺん に むすんだ ひもの ちょうちょ(左と右の わっか)
 *   3・4・5画目 … ぼうに 上から じゅんばんに まいた ひもの 3だん(上・まんなか・下)
 *   6画目(丨)  … ぼう(地面に 立てた まっすぐな ぼう)
 *   7画目(ノ)  … 3だんめ から、左下の ひもの たま まで ぴんと はった ひも の はし
 *
 * ながれ
 *   ぼうが 立つ → おにいちゃんが てっぺんに ひもを むすぶ(ちょうちょ)
 *   → 上の だん、まんなかの だん と、おにいちゃんが じゅんばんに まく
 *   → ずっと 見ていた 小さな おとうとが「ぼくも!」という顔。おにいちゃんが どうぞ と ゆずる
 *   → おとうとは さいごの 下の だん を まいて、にっこり(ばんざい)
 *   → ほね が ひかって、絵が うすくなり、字「弟」が のこる
 *
 * 人は Person(おにいちゃん = teen、おとうと = child)。ふたりとも 横むきで ぼうの ほうを むく。
 * 手は まく ところ に { to } で とどかせる。おにいちゃんは せが高い ので 上の だん、おとうとは 下の だん。
 * おにいちゃんが さがる ときは 右へ むきを かえて walk、また 左へ もどす(うしろ あるき は しない)。
 */
import { backOut, during, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, Butterfly, HANG_ARM, LOOKS, mixLimb, Notice, Person, personRig, posture, turnAround, walk, type Limb, type Look, type PersonProps } from '../sceneFigures'

const CHAR = '弟'

const POLE = '#d9a066'
const POLE_LIGHT = '#ecc08a'
const POLE_DARK = '#b9824c'
const CORD = '#e8534a'
const CORD_DARK = '#c4403a'
const CORD_LIGHT = '#ff8f86'
const BIG_LOOK: Look = { ...LOOKS.boy, hair: '#4a3022', top: '#4cae6a', bottom: '#3e5c86', sleeves: 'short' }
const LITTLE_LOOK: Look = { ...LOOKS.boy, hair: '#6b4328', top: '#ffb84a', bottom: '#4d6fa8', sleeves: 'short' }
const BIG = { build: 'teen', height: 74 } as const
const LITTLE = { build: 'child', height: 46 } as const

/** くぎり の時間(秒) */
const BOW = 1.0
const BOW_END = 1.6
const W1 = 1.8
const W1_END = 2.9
const W2 = 3.2
const W2_END = 4.3
/** おにいちゃんが「どうぞ」と ゆずる */
const OFFER = 4.5
const W3 = 5.5
const W3_END = 6.7
const CHEER = 6.9
const INK = 7.4
const DONE = 10.2
const DURATION = 10.8

type Pt = readonly [number, number]

/** ぼう の まんなか(6画目の x) */
const POLE_X = 54.8
/** 地面(人の 足の うら) */
const GROUND = 97
/** ひもの 3だん の いちばん上の たかさ(上・まんなか・下)。じゅんばん に まく */
const BAND_Y: readonly number[] = [34, 46.5, 59]
/** 1だん の まきかず と、1まき ごとの すきま */
const COILS = 4
const COIL_GAP = 2.4
/** 1だん を まきおわる たかさ(いちばん下の まき) */
const BAND_SPAN = COIL_GAP * (COILS - 1)
/** ぼうの てっぺん の むすびめ */
const KNOT: Pt = [POLE_X, 30]
/** 左下に おいてある ひもの たま(7画目の おわり あたり) */
const BALL: Pt = [20.5, 93]
/** おにいちゃんの たつ ばしょ と、さがる ばしょ / おとうとの たつ ばしょ と、まく ときの ばしょ */
const BIG_X = 68
const BIG_AWAY_X = 84
const LITTLE_X = 34
const LITTLE_WORK_X = 41

/* ---------------- 人(おにいちゃん・おとうと) ---------------- */

type Mood = 'happy' | 'focus' | 'wish' | 'surprise' | 'joy'
const FACES = { happy: 'smile', focus: 'normal', wish: 'worried', surprise: 'surprised', joy: 'joy' } as const

const BANZAI = posture('banzai', 'right')
const arm = (limb: Limb | undefined): Limb => limb ?? HANG_ARM

/** 手の まわす まるい うごき(ひもを まく) */
const circle = (center: Pt, spin: number, w: number): Pt => [center[0] + Math.cos(spin) * 2 * w, center[1] + Math.sin(spin) * 1.4 * w]

/** おにいちゃん: 左を むいて、てっぺんに むすび、2だん まく。ゆずる ときは 右へ さがって また 左を むく */
function bigAt(t: number, brotherY: number, spin: number, windBro: number): PersonProps {
  const away = walk(t, { from: BIG_X, to: BIG_AWAY_X, start: OFFER + 0.5, end: OFFER + 1.1, ...BIG })
  const turn = t < OFFER + 1.15 ? turnAround(t, OFFER + 0.35, 'left', 'right') : turnAround(t, OFFER + 1.15, 'right', 'left')
  const wWork = span(t, 0.8, 1.2)
  const work: Limb = { to: circle([POLE_X + 4.8, brotherY], spin, windBro) }
  const give: Limb = { to: [POLE_X - 6, 69] }
  const offer = span(t, OFFER, OFFER + 0.2) * (1 - span(t, OFFER + 0.3, OFFER + 0.42))
  const cheer = span(t, CHEER, CHEER + 0.3)
  // 左むき: てまえ(ぼうに ちかい がわ)の うで は 右うで
  const near = mixLimb(mixLimb(mixLimb(away.pose.rightArm ?? HANG_ARM, work, wWork * (1 - span(t, OFFER + 0.3, OFFER + 0.42))), give, offer), arm(BANZAI.rightArm), cheer)
  const farHold: Limb = { to: [POLE_X + 3, brotherY + 6] }
  const far = mixLimb(mixLimb(away.pose.leftArm ?? HANG_ARM, farHold, windBro * (1 - span(t, OFFER, OFFER + 0.2))), arm(BANZAI.leftArm), cheer)
  const mood: Mood = t >= CHEER ? 'joy' : t >= BOW - 0.1 && t < W2_END + 0.1 ? 'focus' : 'happy'
  return { x: t < OFFER + 0.5 ? BIG_X : away.x, y: GROUND - cheerHop(t), ...BIG, ...turn, look: BIG_LOOK, face: FACES[mood], pose: { ...(t < OFFER + 0.5 ? {} : away.pose), rightArm: near, leftArm: far } }
}

const cheerHop = (t: number) => span(t, CHEER, CHEER + 0.3) * Math.abs(Math.sin((t - CHEER) * 8)) * 2.6

/** おとうと: あるいてきて、じっと 見て、「ぼくも!」と きづき、さいごの 下の だん を まく */
function littleAt(t: number, spin: number, littleY: number, windLittle: number): PersonProps {
  const walkIn = walk(t, { from: -12, to: LITTLE_X, start: 0.2, end: 1.3, ...LITTLE })
  const step = walk(t, { from: LITTLE_X, to: LITTLE_WORK_X, start: 5.0, end: 5.4, ...LITTLE })
  const bump = Math.sin(span(t, 4.8, 5.3) * Math.PI)
  const x = t < 5.0 ? walkIn.x : step.x
  const legs = t < 5.0 ? walkIn.pose : step.pose
  const rig = personRig({ x, y: GROUND, ...LITTLE, facing: 'right' })
  const shoulderY = rig.world.arms.left.root[1]
  const wish = span(t, 1.3, 1.7) * (1 - span(t, OFFER + 0.2, OFFER + 0.4))
  const clasp: Limb = { to: [x + 5, shoulderY + 7] }
  const wWork = span(t, 5.2, 5.5)
  const work: Limb = { to: circle([POLE_X - 4.8, littleY], spin, windLittle) }
  const up = Math.max(bump, span(t, CHEER, CHEER + 0.3))
  // 右むき: てまえの うで は 左うで
  const near = mixLimb(mixLimb(mixLimb(legs.leftArm ?? HANG_ARM, clasp, wish), work, wWork), arm(BANZAI.leftArm), up)
  const far = mixLimb(mixLimb(legs.rightArm ?? HANG_ARM, clasp, wish), arm(BANZAI.rightArm), up)
  const mood: Mood = t < OFFER + 0.2 ? 'wish' : t < OFFER + 0.7 ? 'surprise' : t >= W3 && t < W3_END ? 'focus' : 'joy'
  const tilt = t >= 1.7 && t < OFFER ? wave(t, 1.6) * 3 : 0
  return { x, y: GROUND, ...LITTLE, facing: 'right', look: LITTLE_LOOK, face: FACES[mood], lift: bump * 4 + cheerHop(t), pose: { ...legs, leftArm: near, rightArm: far, head: tilt }, hairSway: 0 }
}

/* ---------------- ぼう・ひも・まわり ---------------- */

/** 地面に 立てた まっすぐな ぼう(6画目)。下から ぐんと のびる。 */
function Pole({ t }: SceneProps) {
  const grow = span(t, 0.15, 0.7, backOut)
  return (
    <>
      <ellipse cx={POLE_X} cy="97.4" rx={9 * Math.max(0, Math.min(grow, 1))} ry="2.2" fill="#000000" opacity="0.12" />
      <Layer scaleY={grow} origin={[POLE_X, 98]}>
        <Bone char={CHAR} n={6} color={POLE} width={7} />
        {/* 画のはじめの かぎ を かくす まるい ふた(ぼうの てっぺん は まっすぐ) */}
        <circle cx="53.2" cy="32.6" r="3.5" fill={POLE} />
        <path d="M53.2 38 L53.4 94" fill="none" stroke={POLE_LIGHT} strokeWidth="1.3" strokeLinecap="round" />
        <path d="M57.6 38 L57.6 94" fill="none" stroke={POLE_DARK} strokeWidth="1.1" strokeLinecap="round" />
      </Layer>
    </>
  )
}

/** 1だん ぶんの まき。w は どこまで まけたか(0〜1)。1まき ずつ あらわれる。 */
function Band({ y0, w }: { readonly y0: number; readonly w: number }) {
  return (
    <>
      {Array.from({ length: COILS }, (_, i) => {
        const o = Math.min(Math.max(w * COILS - i, 0), 1)
        if (o <= 0) return null
        const y = y0 + COIL_GAP * i
        return (
          <g key={i} opacity={o}>
            <path d={`M${POLE_X - 4.6} ${y + 0.5} Q${POLE_X} ${y + 3.3} ${POLE_X + 4.6} ${y + 0.5}`} fill="none" stroke={CORD_DARK} strokeWidth="2.8" strokeLinecap="round" />
            <path d={`M${POLE_X - 4.4} ${y} Q${POLE_X} ${y + 2.6} ${POLE_X + 4.4} ${y}`} fill="none" stroke={CORD} strokeWidth="1.9" strokeLinecap="round" />
          </g>
        )
      })}
    </>
  )
}

/** 上の だん から 下の だん へ ぼうの おもてを おりる ひも */
function Connector({ from, to, k }: { readonly from: number; readonly to: number; readonly k: number }) {
  if (k <= 0) return null
  return <path d={`M${POLE_X + 1.6} ${from + 1.4} L${POLE_X + 1.6} ${from + 1.4 + (to - from - 1.4) * k}`} fill="none" stroke={CORD} strokeWidth="1.3" strokeLinecap="round" />
}

/** ぼうの てっぺんの ちょうちょむすび(1・2画目)。わっかが 2つ ひらく。 */
function Bow({ t }: SceneProps) {
  const pop = span(t, BOW + 0.3, BOW_END, backOut)
  if (pop <= 0) return null
  const flutter = wave(t, 2.6) * 1.6
  return (
    <Layer scale={pop} rotate={flutter} origin={KNOT}>
      <ellipse cx="45.4" cy="23" rx="11.4" ry="4.4" transform="rotate(36.7 45.4 23)" fill="none" stroke={CORD} strokeWidth="2.3" />
      <ellipse cx="61.2" cy="21" rx="11" ry="4.2" transform="rotate(-54.8 61.2 21)" fill="none" stroke={CORD} strokeWidth="2.3" />
      <path d="M54.8 30 q-1.4 3.6 -3.6 5 M54.8 30 q1.4 3.6 3.2 4.6" fill="none" stroke={CORD} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={KNOT[0]} cy={KNOT[1]} r="2.5" fill={CORD_DARK} />
      <circle cx={KNOT[0] - 0.5} cy={KNOT[1] - 0.6} r="1.1" fill={CORD_LIGHT} />
    </Layer>
  )
}

/** ひもの たま(左下)。ひもが ひかれると ころがり、少し ちいさくなる。 */
function Ball({ roll, size }: { readonly roll: number; readonly size: number }) {
  return (
    <>
      <ellipse cx={BALL[0]} cy="97.2" rx={size + 1.4} ry="1.4" fill="#000000" opacity="0.14" />
      <Layer x={BALL[0]} y={BALL[1]} rotate={roll}>
        <circle cx="0" cy="0" r={size} fill={CORD} />
        <path d={`M${-size * 0.9} ${-size * 0.3} Q0 ${size * 0.5} ${size * 0.9} ${-size * 0.3} M${-size * 0.6} ${size * 0.6} Q0 ${-size * 0.1} ${size * 0.6} ${size * 0.6}`} fill="none" stroke={CORD_DARK} strokeWidth="0.9" strokeLinecap="round" />
        <circle cx={-size * 0.35} cy={-size * 0.4} r={size * 0.22} fill={CORD_LIGHT} />
      </Layer>
    </>
  )
}

/** 下で ひかれた ひもが ぼうの まきはじめ へ つながる 線。 */
function Cord({ anchor, sag }: { readonly anchor: Pt; readonly sag: number }) {
  const from: Pt = [POLE_X - 3.2, anchor[1]]
  const to: Pt = [BALL[0] + 2.6, BALL[1] - 3.2]
  return <path d={`M${from[0]} ${from[1]} Q${(from[0] + to[0]) / 2} ${(from[1] + to[1]) / 2 + sag} ${to[0]} ${to[1]}`} fill="none" stroke={CORD} strokeWidth="1.5" strokeLinecap="round" />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)

  // まく: 3だん を じゅんばん に。w1・w2 は おにいちゃん、w3 は おとうと
  const w1 = span(t, W1, W1_END)
  const w2 = span(t, W2, W2_END)
  const w3 = span(t, W3, W3_END)
  const gap1 = span(t, W1_END, W2)
  const gap2 = span(t, W2_END, W3)
  const tie = span(t, BOW_END, W1)
  // おにいちゃんの 手の たかさ = そのとき まいている ところ
  const broY = KNOT[1] + (BAND_Y[0] - KNOT[1]) * tie + BAND_SPAN * w1 + (BAND_Y[1] - BAND_Y[0] - BAND_SPAN) * gap1 + BAND_SPAN * w2
  const littleY = BAND_Y[2] + BAND_SPAN * w3
  const anchorY = broY + (BAND_Y[2] - BAND_Y[1] - BAND_SPAN) * gap2 + BAND_SPAN * w3
  const tying = span(t, BOW - 0.1, BOW + 0.1) * (1 - span(t, BOW_END - 0.1, BOW_END))
  const windBro = Math.max(tying * 0.7, Math.min(span(t, W1, W1 + 0.1), 1 - span(t, W1_END - 0.1, W1_END)), Math.min(span(t, W2, W2 + 0.1), 1 - span(t, W2_END - 0.1, W2_END)))
  const windLittle = Math.min(span(t, W3, W3 + 0.1), 1 - span(t, W3_END - 0.1, W3_END))
  const spin = t * 13

  // ひも の たま: ひかれると ころがって 少し ちいさく
  const used = (anchorY - KNOT[1]) / 36
  const sag = 3.2 - 1.6 * span(t, W3_END - 0.4, W3_END) + wave(t, 1.3) * 0.4

  const big = bigAt(t, broY, spin, windBro)
  const little = littleAt(t, spin, littleY, windLittle)
  const littleHead = personRig(little).world.head
  const bigHead = personRig(big).world.head
  const stars = during(t, CHEER + 0.1, INK + 0.4, 0.3)
  const bigPop = span(t, 0.3, 0.8, backOut)
  const flutter = during(t, W1 - 0.2, CHEER + 0.2, 0.4)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[96, 13]} clouds={[[-2, 20, 1], [60, 8, 0.8]]} tufts={[6, 40, 70, 102]} />
        <Pole t={t} />
        <Band y0={BAND_Y[0]} w={w1} />
        <Band y0={BAND_Y[1]} w={w2} />
        <Band y0={BAND_Y[2]} w={w3} />
        <Connector from={BAND_Y[0] + BAND_SPAN} to={BAND_Y[1]} k={gap1} />
        <Connector from={BAND_Y[1] + BAND_SPAN} to={BAND_Y[2]} k={gap2} />
        <Bow t={t} />
        <Layer opacity={span(t, BOW, BOW + 0.3)}>
          <Cord anchor={[POLE_X, anchorY]} sag={sag} />
        </Layer>
        <Layer opacity={span(t, 0.4, 0.8)}>
          <Ball roll={used * 220} size={4.8 - used * 0.9} />
        </Layer>
        {flutter > 0 ? (
          <Layer opacity={flutter}>
            <Butterfly x={13 + Math.sin(t * 1.1) * 5} y={38 + Math.sin(t * 1.7) * 3} t={t} />
          </Layer>
        ) : null}
        <Person {...little} headwear={<path d="M0.04 -1.02 Q-0.25 -1.45 0.12 -1.4 Q0.34 -1.36 0.2 -1.04" fill="none" stroke={LITTLE_LOOK.hair} strokeWidth="0.16" strokeLinecap="round" />} />
        <Layer opacity={bigPop}>
          <Person {...big} />
        </Layer>
        <Notice x={littleHead[0]} y={littleHead[1]} r={7} show={during(t, OFFER + 0.3, OFFER + 1.1, 0.25)} dir={1} />
        {stars > 0 && (
          <g opacity={stars}>
            <Star cx={little.x - 11} cy={45} r={2.8} color="#ffc233" spin={t * 90} />
            <Star cx={little.x + 12} cy={60} r={2.2} color="#ffd95a" spin={-t * 80} />
            <Star cx={bigHead[0] + 12} cy={bigHead[1] - 8} r={2.6} color="#ffc233" spin={t * 70} />
            <Star cx={bigHead[0] - 12} cy={bigHead[1] - 14} r={2} color="#ffd95a" spin={-t * 90} />
          </g>
        )}
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Ink char={CHAR} progress={ink.progress} tint={ink.tint} />
      <Sparkles cx={54.5} cy={54} progress={ink.sparkle} />
    </>
  )
}

const scene: SceneModule = {
  char: CHAR,
  duration: DURATION,
  beats: [
    { at: 0, label: 'ぼうが 立つ。ちいさな おとうとが あるいてくる', sound: 'pop' },
    { at: BOW, label: 'おにいちゃんが ぼうの てっぺんに ひもを むすぶ' },
    { at: W1, label: 'ひもを じゅんばんに まく(上の だん)', sound: 'tap' },
    { at: W2, label: 'つぎの だん を まく。おとうとは じっと 見ている' },
    { at: OFFER, label: '「ぼくも!」 おにいちゃんが どうぞ と ゆずる', sound: 'pop' },
    { at: W3, label: 'おとうとが さいごの 下の だん を まく' },
    { at: CHEER, label: 'できた! ふたりで ばんざい' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '弟 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
