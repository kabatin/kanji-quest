/*
 * 弟(おとうと): ぼうに ひもを じゅんばんに まく。じゅんばんが あとの おとこのこ。
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
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる。手は まく ところ(ぼうの ひもの 高さ)に とどく。
 *   おにいちゃんは せが高いので 上の だん、おとうとは せが ひくいので いちばん下の だん を まく。
 *   ひもは ぼうの ひもの たま から のびて、おとうとの いる 左下まで 斜めに はる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '弟'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const CHEEK = '#ff9d9d'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const SUN = '#ffd24a'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const POLE = '#d9a066'
const POLE_LIGHT = '#ecc08a'
const POLE_DARK = '#b9824c'
const CORD = '#e8534a'
const CORD_DARK = '#c4403a'
const CORD_LIGHT = '#ff8f86'

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

const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/* ---------------- 人(おにいちゃん・おとうと 同じ つくり) ---------------- */

/** 人の 体の 大きさ(足の うら を 0 として、上が マイナス)。かたの ひろさ・たかさ・うで の ながさ */
const SHOULDER_X = 8
const SHOULDER_Y = -40
const ARM = 13

const shoulderAt = (x: number, y: number, s: number, side: 1 | -1): Pt => [x + side * SHOULDER_X * s, y + SHOULDER_Y * s]
/** だらんと 下げた 手の いち */
const handDown = (shoulder: Pt, side: 1 | -1, s: number, swing = 0): Pt => [shoulder[0] + side * 1.4 * s + swing * s, shoulder[1] + ARM * 2 * 0.9 * s]
/** ばんざい の 手の いち */
const handUp = (shoulder: Pt, side: 1 | -1, s: number): Pt => [shoulder[0] + side * 4 * s, shoulder[1] - ARM * 2 * 0.9 * s]

/** かた から 出て、ひじ で まがる うで。手が とどかない ときは、手の ほうへ まっすぐ のばす。 */
function twoJoint(shoulder: Pt, target: Pt, side: number): { readonly elbow: Pt; readonly hand: Pt } {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.max(Math.hypot(dx, dy), 0.001)
  const reach = Math.min(dist, ARM * 2 * 0.999)
  const ux = dx / dist
  const uy = dy / dist
  const h = Math.sqrt(ARM * ARM - (reach / 2) ** 2)
  const mid: Pt = [shoulder[0] + (ux * reach) / 2, shoulder[1] + (uy * reach) / 2]
  const a: Pt = [mid[0] - uy * h, mid[1] + ux * h]
  const b: Pt = [mid[0] + uy * h, mid[1] - ux * h]
  // ひじ は 下か そと がわ へ まがる(うちがわ へ は まがらない)
  const score = (p: Pt) => p[1] - mid[1] + (p[0] - mid[0]) * side * 0.6
  return { elbow: score(a) >= score(b) ? a : b, hand: [shoulder[0] + ux * reach, shoulder[1] + uy * reach] }
}

type Mood = 'happy' | 'focus' | 'wish' | 'surprise' | 'joy'

type Palette = { readonly shirt: string; readonly shirtDark: string; readonly pants: string; readonly hair: string }

const BIG: Palette = { shirt: '#4cae6a', shirtDark: '#3a9356', pants: '#3e5c86', hair: '#4a3022' }
const LITTLE: Palette = { shirt: '#ffb84a', shirtDark: '#e89a2c', pants: '#4d6fa8', hair: '#6b4328' }

function Face({ mood, look }: { readonly mood: Mood; readonly look: number }) {
  const ex = look * 1.1
  const eyes = (r: number) => (
    <>
      <circle cx={-3.6 + ex} cy="-54" r={r} fill={EYE} />
      <circle cx={3.6 + ex} cy="-54" r={r} fill={EYE} />
    </>
  )
  return (
    <>
      <ellipse cx="-6" cy="-50.2" rx="2.1" ry="1.5" fill={CHEEK} opacity="0.55" />
      <ellipse cx="6" cy="-50.2" rx="2.1" ry="1.5" fill={CHEEK} opacity="0.55" />
      {mood === 'joy' ? (
        <>
          <path d={`M${-5.2 + ex} -53.4 Q${-3.6 + ex} -56.2 ${-2 + ex} -53.4 M${2 + ex} -53.4 Q${3.6 + ex} -56.2 ${5.2 + ex} -53.4`} fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M-3.2 -49.6 Q0 -44.2 3.2 -49.6 Z" fill={MOUTH} />
        </>
      ) : mood === 'surprise' ? (
        <>
          {eyes(1.8)}
          <ellipse cx="0" cy="-47.6" rx="1.7" ry="2.2" fill={MOUTH} />
        </>
      ) : mood === 'wish' ? (
        <>
          {eyes(1.35)}
          {/* こまった まゆ(うちがわ が 上) と、ちいさな くちびる */}
          <path d={`M${-5.6 + ex} -56.6 L${-2.2 + ex} -57.8 M${5.6 + ex} -56.6 L${2.2 + ex} -57.8`} fill="none" stroke={EYE} strokeWidth="0.9" strokeLinecap="round" />
          <path d="M-1.8 -47.6 Q0 -49.2 1.8 -47.6" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      ) : (
        <>
          {eyes(1.3)}
          <path d={mood === 'focus' ? 'M-1.8 -48.4 Q0 -47 1.8 -48.4' : 'M-2.6 -49 Q0 -46.6 2.6 -49'} fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
    </>
  )
}

type KidProps = {
  /** 足の うら の ばしょ(世界の 座標) と 大きさ */
  readonly x: number
  readonly y: number
  readonly s: number
  readonly step: number
  readonly mood: Mood
  readonly look: number
  readonly tilt?: number
  /** 画面の 左がわ・右がわ の 手が とどく ばしょ(世界の 座標) */
  readonly left: Pt
  readonly right: Pt
  readonly palette: Palette
  readonly tuft?: boolean
}

function Kid({ x, y, s, step, mood, look, tilt = 0, left, right, palette, tuft = false }: KidProps) {
  const toLocal = (p: Pt): Pt => [(p[0] - x) / s, (p[1] - y) / s]
  const arms = [
    { side: -1 as const, ...twoJoint([-SHOULDER_X, SHOULDER_Y], toLocal(left), -1) },
    { side: 1 as const, ...twoJoint([SHOULDER_X, SHOULDER_Y], toLocal(right), 1) },
  ]
  return (
    <Layer x={x} y={y} scale={s}>
      <ellipse cx="0" cy="0.6" rx="10" ry="2.6" fill="#000000" opacity="0.12" />
      {/* あし(あるくとき かわりばんこ に ふる) */}
      <Layer rotate={step * 14} origin={[3.4, -24]}>
        <rect x="1.2" y="-25" width="4.6" height="22" rx="2.3" fill={palette.pants} />
        <ellipse cx="3.8" cy="-2.4" rx="4.4" ry="2.5" fill="#6b4a36" />
      </Layer>
      <Layer rotate={-step * 14} origin={[-3.4, -24]}>
        <rect x="-5.8" y="-25" width="4.6" height="22" rx="2.3" fill={palette.pants} />
        <ellipse cx="-3.8" cy="-2.4" rx="4.4" ry="2.5" fill="#6b4a36" />
      </Layer>
      {/* どう */}
      <rect x="-8.4" y="-43" width="16.8" height="21" rx="6.4" fill={palette.shirt} />
      <path d="M-7.2 -27 h14.4" stroke={palette.shirtDark} strokeWidth="1.4" strokeLinecap="round" />
      {/* うで: かた → ひじ → 手 の じゅんに つなぐ(そで は ふくの いろ、うでさき は はだ) */}
      {arms.map(({ side, elbow, hand }) => (
        <g key={side}>
          <path d={`M${side * SHOULDER_X} ${SHOULDER_Y} L${elbow[0]} ${elbow[1]}`} fill="none" stroke={palette.shirt} strokeWidth="5.6" strokeLinecap="round" />
          <path d={`M${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={SKIN} strokeWidth="4.2" strokeLinecap="round" />
          <circle cx={hand[0]} cy={hand[1]} r="2.7" fill={SKIN} />
        </g>
      ))}
      {/* くび(みじかい)と あたま */}
      <rect x="-2.8" y="-46" width="5.6" height="5" rx="2" fill={SKIN_SHADE} />
      <Layer rotate={tilt} origin={[0, -44]}>
        <circle cx="-9.4" cy="-52" r="1.9" fill={SKIN_SHADE} />
        <circle cx="9.4" cy="-52" r="1.9" fill={SKIN_SHADE} />
        <circle cx="0" cy="-53" r="9.6" fill={SKIN} />
        <path d="M-9.7 -53 A9.7 9.7 0 0 1 9.7 -53 Q5.4 -59.4 -0.6 -58.2 Q-6.2 -57.4 -9.7 -53 Z" fill={palette.hair} />
        {tuft && <path d="M0.4 -62.2 Q-2.4 -66.6 1.6 -66 Q3.6 -65.8 2.4 -62.4" fill="none" stroke={palette.hair} strokeWidth="1.5" strokeLinecap="round" />}
        <Face mood={mood} look={look} />
      </Layer>
    </Layer>
  )
}

/* ---------------- ぼう・ひも・まわり ---------------- */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[96, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="95.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 96 13)`} />
        ))}
      </Layer>
      <circle cx="96" cy="13" r={6.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 70 113 93 V101 H-4 Z" fill="#e2f2d2" />
      {/* ゆっくり ながれる 雲(おくゆき を出す) */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="-2" cy="20" rx="7" ry="3.2" />
        <ellipse cx="3" cy="18.2" rx="5" ry="3.2" />
        <ellipse cx="60" cy="8" rx="5.5" ry="2.4" />
        <ellipse cx="64" cy="6.6" rx="3.8" ry="2.6" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 40, 70, 102].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 地面に 立てた まっすぐな ぼう(6画目)。下から ぐんと のびる。 */
function Pole({ t }: SceneProps) {
  const grow = span(t, 0.15, 0.7, backOut)
  return (
    <>
      <ellipse cx={POLE_X} cy="97.4" rx={9 * Math.min(grow, 1)} ry="2.2" fill="#000000" opacity="0.12" />
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
    <>
      <Layer scale={pop} rotate={flutter} origin={KNOT}>
        <ellipse cx="45.4" cy="23" rx="11.4" ry="4.4" transform="rotate(36.7 45.4 23)" fill="none" stroke={CORD} strokeWidth="2.3" />
        <ellipse cx="61.2" cy="21" rx="11" ry="4.2" transform="rotate(-54.8 61.2 21)" fill="none" stroke={CORD} strokeWidth="2.3" />
        <path d="M54.8 30 q-1.4 3.6 -3.6 5 M54.8 30 q1.4 3.6 3.2 4.6" fill="none" stroke={CORD} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx={KNOT[0]} cy={KNOT[1]} r="2.5" fill={CORD_DARK} />
        <circle cx={KNOT[0] - 0.5} cy={KNOT[1] - 0.6} r="1.1" fill={CORD_LIGHT} />
      </Layer>
    </>
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

/** 「ぼくも!」と きづいた しるし(おとうとの あたまの上に ぽん と出る)。 */
function Bang({ x, y, k }: { readonly x: number; readonly y: number; readonly k: number }) {
  if (k <= 0) return null
  return (
    <Layer x={x} y={y} scale={k} opacity={Math.min(k * 2, 1)} origin={[0, 4]}>
      <rect x="-1" y="-6" width="2" height="6.4" rx="1" fill="#f2603a" />
      <circle cx="0" cy="2.6" r="1.2" fill="#f2603a" />
    </Layer>
  )
}

/** ちょうちょ: おとうとの そばを ひらひら とぶ。 */
function Butterfly({ t }: SceneProps) {
  const show = during(t, W1 - 0.2, CHEER + 0.2, 0.4)
  if (show <= 0) return null
  const flap = 0.35 + Math.abs(wave(t, 0.28)) * 0.65
  return (
    <Layer x={13 + Math.sin(t * 1.1) * 5} y={38 + Math.sin(t * 1.7) * 3} opacity={show}>
      <Layer scaleX={flap}>
        <ellipse cx="-1.7" cy="-0.8" rx="2.2" ry="1.8" fill="#f07f9e" />
        <ellipse cx="1.7" cy="-0.8" rx="2.2" ry="1.8" fill="#f07f9e" />
        <ellipse cx="-1.4" cy="1.4" rx="1.5" ry="1.2" fill="#f7b3c6" />
        <ellipse cx="1.4" cy="1.4" rx="1.5" ry="1.2" fill="#f7b3c6" />
      </Layer>
      <rect x="-0.3" y="-1.6" width="0.6" height="4" rx="0.3" fill="#5a3b2a" />
    </Layer>
  )
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

  const wWorkBro = span(t, 0.8, 1.2)
  const wOffer = span(t, OFFER, OFFER + 0.35)
  const wCheer = span(t, CHEER, CHEER + 0.3)
  const cheerHop = wCheer * Math.abs(Math.sin((t - CHEER) * 8)) * 2.6

  // おにいちゃん(右): ぽん と あらわれ、まいて、おとうとに ゆずって うしろへ さがる
  const broPop = span(t, 0.3, 0.8, backOut)
  const broX = 78 + 13 * span(t, OFFER, OFFER + 0.7, easeInOut)
  const broS = 1.15 * Math.max(broPop, 0)
  const broL = shoulderAt(broX, GROUND, broS, -1)
  const broR = shoulderAt(broX, GROUND, broS, 1)
  const broWork: Pt = [POLE_X + 4.8 + Math.cos(spin) * 2 * windBro, broY + Math.sin(spin) * 1.4 * windBro]
  const broGive: Pt = [POLE_X - 6, 69]
  const broLeft = lerpPt(lerpPt(lerpPt(handDown(broL, -1, broS), broWork, wWorkBro), broGive, wOffer), handUp(broL, -1, broS), wCheer)
  const broRight = lerpPt(handDown(broR, 1, broS, wave(t, 2.2) * 0.8), handUp(broR, 1, broS), wCheer)
  const broMood: Mood = t >= CHEER ? 'joy' : t >= BOW - 0.1 && t < W2_END + 0.1 ? 'focus' : 'happy'

  // おとうと(左): あるいてきて、じっと 見て、「ぼくも!」と きづき、さいごの 下の だん を まく
  const moving = 1 - span(t, 1.0, 1.3)
  const step = t < 0.2 ? 0 : Math.sin((t - 0.2) * 14) * moving
  const bump = Math.sin(span(t, 4.8, 5.3) * Math.PI)
  const wish = span(t, 1.3, 1.7) * (1 - span(t, OFFER + 0.2, OFFER + 0.4))
  const wWork3 = span(t, 5.2, 5.5)
  const littleX = mix(t, 0.2, 1.3, -12, 33, easeOut) + 4 * span(t, 5.0, 5.4, easeInOut)
  const littleS = 0.78
  const littleY0 = GROUND - bump * 4 - cheerHop
  const litL = shoulderAt(littleX, littleY0, littleS, -1)
  const litR = shoulderAt(littleX, littleY0, littleS, 1)
  const clasp = (side: 1 | -1): Pt => [littleX + side * 1.8 * littleS, littleY0 - 31 * littleS]
  const litWork: Pt = [POLE_X - 4.8 + Math.cos(spin) * 2 * windLittle, littleY + Math.sin(spin) * 1.4 * windLittle]
  const littleUp = Math.max(bump, wCheer)
  const litLeft = lerpPt(lerpPt(handDown(litL, -1, littleS, -step * 4), clasp(-1), wish), handUp(litL, -1, littleS), littleUp)
  const litRight = lerpPt(lerpPt(lerpPt(handDown(litR, 1, littleS, step * 4), clasp(1), wish), litWork, wWork3), handUp(litR, 1, littleS), littleUp)
  const littleMood: Mood = t < OFFER + 0.2 ? 'wish' : t < OFFER + 0.7 ? 'surprise' : t >= W3 && t < W3_END ? 'focus' : 'joy'
  const littleLook = t < 1.0 ? 1 : t < CHEER ? 1 : 0
  const littleTilt = t >= 1.7 && t < OFFER ? wave(t, 1.6) * 3 : 0

  const stars = during(t, CHEER + 0.1, INK + 0.4, 0.3)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
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
        <Butterfly t={t} />
        <Kid x={littleX} y={littleY0} s={littleS} step={step} mood={littleMood} look={littleLook} tilt={littleTilt} left={litLeft} right={litRight} palette={LITTLE} tuft />
        {broPop > 0 && <Kid x={broX} y={GROUND - cheerHop} s={broS} step={0} mood={broMood} look={t >= CHEER ? 0 : -1} left={broLeft} right={broRight} palette={BIG} />}
        <Bang x={littleX + 9} y={43} k={during(t, OFFER + 0.3, OFFER + 1.1, 0.25)} />
        {stars > 0 && (
          <g opacity={stars}>
            <Star cx={littleX - 11} cy={45} r={2.8} color="#ffc233" spin={t * 90} />
            <Star cx={littleX + 12} cy={60} r={2.2} color="#ffd95a" spin={-t * 80} />
            <Star cx={broX + 12} cy={32} r={2.6} color="#ffc233" spin={t * 70} />
            <Star cx={broX - 12} cy={25} r={2} color="#ffd95a" spin={-t * 90} />
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
