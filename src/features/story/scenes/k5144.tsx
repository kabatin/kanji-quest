/*
 * 兄(あに): おおきな 口で、みんなに こえを かける としうえの 人。
 *
 * ほね(画と絵の対応)
 *   1・2・3画目(口) … 兄の 大きく あいた 口(左の たて・上と右・下の よこ が、口の ふち)
 *   4画目(ノ)       … ひだりの あし(こしから ななめ左へ ふみだす)
 *   5画目(乚)       … みぎの あし(まっすぐ立って、つま先が 右へ)
 *
 * ながれ
 *   お兄ちゃんが 立っている → 左と右に 小さな 子どもが まいごで しょんぼり
 *   → お兄ちゃんは 気づいて しんぱい顔 → 「よし」と 大きく いきを すう(ほっぺが ふくらむ)
 *   → 両手を 口に そえて、大きな 口を あけて「おーい!」(声の わ が ひろがる)
 *   → 声が とどいて、子どもたちは びっくり → うれしくて ばんざい で はねる
 *   → 大きな 口と 2本の あし の ほね が ひかって、絵が うすくなり、字「兄」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく どう の まんなか の上。あし は こし から。
 *   あたまは 子どもらしく 大きめ(3頭身ぐらい)。大きく あけた 口が そのまま 字の「口」になる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '兄'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const HAIR_KID = '#3b2f2f'
const TUNIC = '#e8734a'
const TUNIC_DARK = '#cf5d38'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const SHOE_SOLE = '#f3ead8'
const INSIDE = '#8a2f3a'
const TONGUE = '#ff8a8a'
const MOUTH_LINE = '#b9483f'
const EYE = '#2b2b2b'
const CHEEK = '#ff9d9d'
const SUN = '#ffd24a'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const HILL = '#e2f2d2'
const VOICE = '#ffb84d'
const TEAR = '#7cc4f2'

/** くぎり の時間(秒) */
const APPEAR = 0.2
const KID_IN = 0.8
/** お兄ちゃんが まいごに 気づく */
const NOTICE = 1.9
/** 「よし」と いきを すいはじめる */
const RESOLVE = 3.2
/** 大きな 口で 「おーい!」 */
const SHOUT = 4.1
/** 声が とどいて 子どもが びっくり → よろこぶ */
const REACT = 5.0
const CHEER = 5.3
const INK = 6.6
const DONE = 9.3
const DURATION = 9.9

const rad = (deg: number) => (deg * Math.PI) / 180

/* ───────── うで(かた → ひじ → 手 の じゅんに つなぐ) ───────── */

type ArmProps = {
  readonly shoulder: readonly [number, number]
  /** -1 = 左のうで(外がわ = 左) / 1 = 右のうで */
  readonly side: -1 | 1
  readonly upper: number
  readonly fore: number
  /** ま下から 外へ ひらいた 角度(度) */
  readonly upperDeg: number
  readonly foreDeg: number
  readonly sleeve: string
  readonly sleeveWidth: number
  readonly foreWidth: number
  readonly handR: number
}

function Arm({ shoulder, side, upper, fore, upperDeg, foreDeg, sleeve, sleeveWidth, foreWidth, handR }: ArmProps) {
  const dir = (deg: number) => [side * Math.sin(rad(deg)), Math.cos(rad(deg))] as const
  const [ux, uy] = dir(upperDeg)
  const elbow = [shoulder[0] + ux * upper, shoulder[1] + uy * upper] as const
  const [fx, fy] = dir(foreDeg)
  const hand = [elbow[0] + fx * fore, elbow[1] + fy * fore] as const
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]}`} stroke={sleeve} strokeWidth={sleeveWidth} strokeLinecap="round" fill="none" />
      <path d={`M${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} stroke={SKIN} strokeWidth={foreWidth} strokeLinecap="round" fill="none" />
      <circle cx={elbow[0]} cy={elbow[1]} r={foreWidth / 2} fill={SKIN} />
      <circle cx={hand[0]} cy={hand[1]} r={handR} fill={SKIN} />
    </>
  )
}

/* ───────── 空と 地面 ───────── */

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
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 93 V101 H-4 Z" fill={HILL} />
      {/* ゆっくり ながれる 雲 */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="-10" cy="62" rx="7" ry="3" />
        <ellipse cx="-5" cy="60.2" rx="4.6" ry="3" />
        <ellipse cx="96" cy="56" rx="6" ry="2.6" />
        <ellipse cx="100.5" cy="54.4" rx="4.2" ry="2.8" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[4, 30, 76, 104].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/* ───────── 声の わ ───────── */

/** 口から 左右へ ひろがる 声の わ。ゆっくり 大きくなって うすれる。 */
function Voice({ t }: SceneProps) {
  const cx = 52.5
  const cy = 33
  return (
    <>
      {Array.from({ length: 5 }, (_, k) => {
        const p = (t - (SHOUT + 0.1 + k * 0.42)) / 1.2
        if (p <= 0 || p >= 1) return null
        const r = 28 + 50 * p
        const reach = rad(55)
        return [-1, 1].map((side) => {
          const sx = cx + side * r * Math.cos(reach)
          const top = cy - r * Math.sin(reach)
          const bottom = cy + r * Math.sin(reach)
          return <path key={`${k}${side}`} d={`M${sx} ${top} A${r} ${r} 0 0 ${side === 1 ? 1 : 0} ${sx} ${bottom}`} fill="none" stroke={VOICE} strokeWidth={2.4 - p} strokeLinecap="round" opacity={Math.sin(p * Math.PI) * 0.9} />
        })
      })}
    </>
  )
}

/* ───────── お兄ちゃん(主役) ───────── */

type BrotherMood = 'calm' | 'worry' | 'resolve' | 'squeeze' | 'happy'

type FaceProps = {
  readonly mood: BrotherMood
  /** 口の あき(0 = とじている / 1 = 字の「口」ぐらい 大きく) */
  readonly open: number
  /** 目の むき(左右) */
  readonly look: number
  /** いきを すって ふくらんだ ほっぺ(0〜1) */
  readonly puff: number
}

/** 目と まゆ。気持ちで かわる。 */
function Eyes({ mood, look }: Pick<FaceProps, 'mood' | 'look'>) {
  const brow = { fill: 'none', stroke: HAIR, strokeWidth: 1.3, strokeLinecap: 'round' } as const
  const dots = (
    <>
      <circle cx={41 + look} cy="15.6" r="1.6" fill={EYE} />
      <circle cx={64 + look} cy="15.6" r="1.6" fill={EYE} />
    </>
  )
  if (mood === 'squeeze') {
    // 声を出すときの ぎゅっと つぶった 目
    return (
      <>
        <path d="M37.5 12.8 L43.5 15.4 L37.5 18" fill="none" stroke={EYE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M67.5 12.8 L61.5 15.4 L67.5 18" fill="none" stroke={EYE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M36.5 11 Q41 9.4 45.5 11 M59.5 11 Q64 9.4 68.5 11" {...brow} />
      </>
    )
  }
  if (mood === 'happy') {
    return (
      <>
        <path d="M37.5 17.2 Q41 12.6 44.5 17.2 M60.5 17.2 Q64 12.6 67.5 17.2" fill="none" stroke={EYE} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M36.5 11 Q41 9.4 45.5 11 M59.5 11 Q64 9.4 68.5 11" {...brow} />
      </>
    )
  }
  const brows =
    mood === 'worry' ? 'M36.5 12.6 L45 10.4 M60 10.4 L68.5 12.6' : mood === 'resolve' ? 'M36.5 10.4 L45 12.6 M60 12.6 L68.5 10.4' : 'M36.5 11.4 Q41 10.4 45.5 11.4 M59.5 11.4 Q64 10.4 68.5 11.4'
  return (
    <>
      {dots}
      <path d={brows} {...brow} />
    </>
  )
}

/** 口。とじているときは 気持ちの 線、あくと 大きな 長四角(これが 字の「口」)。 */
function Mouth({ mood, open }: Pick<FaceProps, 'mood' | 'open'>) {
  if (open <= 0.02) {
    const d = mood === 'worry' ? 'M48.5 37.4 Q52.5 34.4 56.5 37.4' : mood === 'resolve' ? 'M48.5 36 H56.5' : 'M48.5 35 Q52.5 38.4 56.5 35'
    return <path d={d} fill="none" stroke={MOUTH_LINE} strokeWidth="1.5" strokeLinecap="round" />
  }
  const w = 7 + 34 * open
  const h = 3 + 21 * open
  const cx = 52.5
  const cy = 36 - 3 * open
  const left = cx - w / 2
  const top = cy - h / 2
  const bottom = cy + h / 2
  return (
    <>
      <rect x={left} y={top} width={w} height={h} rx={Math.min(8, h / 2)} fill={INSIDE} />
      {open > 0.3 && (
        <>
          <rect x={cx - w * 0.36} y={top} width={w * 0.72} height={3.2 * open} rx="1.2" fill="#ffffff" />
          <path d={`M${cx - w * 0.26} ${bottom} Q${cx} ${bottom - h * 0.52} ${cx + w * 0.26} ${bottom} Z`} fill={TONGUE} />
        </>
      )}
    </>
  )
}

type BrotherProps = FaceProps & {
  readonly headTilt: number
  /** いきを すって 胸が ふくらむ(0〜1) */
  readonly inhale: number
  /** 両手を 口に そえる度合い(0 = たらしている / 1 = 口の よこ) */
  readonly cup: number
}

function Brother({ mood, open, look, puff, headTilt, inhale, cup }: BrotherProps) {
  const upperDeg = mix(cup, 0, 1, 8, 66, easeInOut)
  const foreDeg = mix(cup, 0, 1, 6, 168, easeInOut)
  const arm = { upper: 14.8, fore: 14, upperDeg, foreDeg, sleeve: TUNIC_DARK, sleeveWidth: 6.4, foreWidth: 4.8, handR: 3.3 } as const
  return (
    <>
      {/* あし: こし から。左は ななめに ふみだし、右は まっすぐ(つま先が 右) */}
      <path d="M47 66 L22 90" stroke={PANTS_DARK} strokeWidth="7.6" strokeLinecap="round" fill="none" />
      <ellipse cx="18.4" cy="92.4" rx="7" ry="3.4" fill={SHOE} />
      <path d="M57 66 L57.6 88" stroke={PANTS} strokeWidth="7.6" strokeLinecap="round" fill="none" />
      <rect x="52.6" y="88.4" width="28" height="6.6" rx="3.3" fill={SHOE} />
      <rect x="52.6" y="93" width="28" height="2" rx="1" fill={SHOE_SOLE} />
      {/* どう: いきを すうと ふくらむ */}
      <Layer scaleX={1 + 0.07 * inhale} scaleY={1 + 0.03 * inhale} origin={[52.5, 68]}>
        <rect x="42" y="47" width="21" height="22" rx="6.5" fill={TUNIC} />
        <path d="M43.5 64 H61.5" stroke={TUNIC_DARK} strokeWidth="1.8" strokeLinecap="round" />
      </Layer>
      {/* くび: みじかい。あたまの 下に すこし 見えるだけ */}
      <path d="M47.5 51 Q52.5 57 57.5 51 Z" fill={SKIN_SHADE} />
      {/* あたま(大きめ) */}
      <Layer rotate={headTilt} origin={[52.5, 50]}>
        <circle cx="25.8" cy="27" r="3.2" fill={SKIN_SHADE} />
        <circle cx="79.2" cy="27" r="3.2" fill={SKIN_SHADE} />
        <rect x="26" y="2.5" width="53" height="48.5" rx="18" fill={SKIN} />
        <path d="M25.5 20 C24 3 38 0.8 52.5 0.8 C67 0.8 81 3 79.5 20 C76 12 70 8.8 52.5 8.8 C35 8.8 29 12 25.5 20 Z" fill={HAIR} />
        <circle cx="29.4" cy="27.5" r={2.2 + puff * 2.4} fill={CHEEK} opacity={0.5 + puff * 0.3} />
        <circle cx="75.6" cy="27.5" r={2.2 + puff * 2.4} fill={CHEEK} opacity={0.5 + puff * 0.3} />
        <Eyes mood={mood} look={look} />
        <Mouth mood={mood} open={open} />
      </Layer>
      {/* うで: あたまの 前に 出る。手は 口の よこ */}
      <Arm shoulder={[43.5, 52]} side={-1} {...arm} />
      <Arm shoulder={[61.5, 52]} side={1} {...arm} />
    </>
  )
}

/* ───────── 小さな 子ども ───────── */

type KidMood = 'lost' | 'surprise' | 'happy'

type KidProps = {
  readonly t: number
  readonly x: number
  /** 外がわ(画面の はし)の むき。左の子 = -1 / 右の子 = 1 */
  readonly outward: -1 | 1
  readonly tunic: string
  readonly delay: number
  readonly phase: number
}

function KidFace({ mood, dx }: { readonly mood: KidMood; readonly dx: number }) {
  if (mood === 'happy') {
    return (
      <>
        <path d="M-3.6 -15.4 Q-2.4 -17.6 -1.2 -15.4 M1.2 -15.4 Q2.4 -17.6 3.6 -15.4" fill="none" stroke={EYE} strokeWidth="0.9" strokeLinecap="round" />
        <path d="M-2.5 -13.4 Q0 -9.4 2.5 -13.4 Z" fill={INSIDE} />
      </>
    )
  }
  const r = mood === 'surprise' ? 1.35 : 0.9
  return (
    <>
      <circle cx={-2.3 + dx} cy="-16" r={r} fill={EYE} />
      <circle cx={2.3 + dx} cy="-16" r={r} fill={EYE} />
      {mood === 'surprise' ? <ellipse cx="0" cy="-12.6" rx="1" ry="1.3" fill={INSIDE} /> : <path d="M-1.8 -12.2 Q0 -13.8 1.8 -12.2" fill="none" stroke={MOUTH_LINE} strokeWidth="0.9" strokeLinecap="round" />}
    </>
  )
}

function Kid({ t, x, outward, tunic, delay, phase }: KidProps) {
  const appear = span(t, KID_IN + delay, KID_IN + delay + 0.4, backOut)
  const mood: KidMood = t < REACT ? 'lost' : t < CHEER ? 'surprise' : 'happy'
  // よろこぶと、ぴょんぴょん はねる
  const hop = mood === 'happy' ? Math.abs(Math.sin(((t - CHEER + phase) * Math.PI * 2) / 0.7)) * 3.2 : 0
  const armUp = span(t, CHEER, CHEER + 0.4, backOut)
  const upperDeg = mix(armUp, 0, 1, 10, 118, easeOut)
  const foreDeg = mix(armUp, 0, 1, 6, 150, easeOut)
  // まいごの間は うなだれて、きょろきょろ。とどくと 声の ほうを むく
  const dx = mood === 'happy' ? -outward * 0.9 : mood === 'surprise' ? -outward * 0.7 : wave(t, 2.1, phase) * 1.0
  const droop = mood === 'lost' ? 4 : 0
  const arm = { upper: 4.4, fore: 4.4, upperDeg, foreDeg, sleeve: tunic, sleeveWidth: 3, foreWidth: 2.3, handR: 1.6 } as const
  const tearP = (t * 1.1 + phase) % 1
  return (
    <Layer x={x} y={96 - hop} scale={Math.max(0.01, 0.6 + 0.65 * appear)} opacity={span(t, KID_IN + delay, KID_IN + delay + 0.15)} origin={[0, 0]}>
      <ellipse cx="0" cy="0.6" rx="6" ry="1.4" fill="#000000" opacity="0.1" />
      <rect x="-2.8" y="-5.4" width="2.5" height="5" rx="1.2" fill={PANTS} />
      <rect x="0.3" y="-5.4" width="2.5" height="5" rx="1.2" fill={PANTS} />
      <ellipse cx="-1.6" cy="-0.2" rx="2.1" ry="1" fill={SHOE} />
      <ellipse cx="1.6" cy="-0.2" rx="2.1" ry="1" fill={SHOE} />
      <rect x="-3.9" y="-12.4" width="7.8" height="7.8" rx="2.6" fill={tunic} />
      <Layer rotate={droop * outward} origin={[0, -11]}>
        <circle cx="0" cy="-16.5" r="5.8" fill={SKIN} />
        <path d="M-6 -16.6 C-6.6 -25 6.6 -25 6 -16.6 C3.6 -19.8 -3.6 -19.8 -6 -16.6 Z" fill={HAIR_KID} />
        <circle cx="-3.9" cy="-13.4" r="1.2" fill={CHEEK} opacity="0.55" />
        <circle cx="3.9" cy="-13.4" r="1.2" fill={CHEEK} opacity="0.55" />
        <KidFace mood={mood} dx={dx} />
      </Layer>
      {mood === 'lost' && <path d={`M${-2.3 + dx} ${-14.6 + tearP * 4} q0.8 1 0 1.8 q-0.8 -0.8 0 -1.8 Z`} fill={TEAR} opacity={1 - tearP} />}
      <Arm shoulder={[-3.5, -10.8]} side={-1} {...arm} />
      <Arm shoulder={[3.5, -10.8]} side={1} {...arm} />
    </Layer>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)

  const appear = span(t, APPEAR, APPEAR + 0.5, backOut)
  const mood: BrotherMood = t < NOTICE ? 'calm' : t < RESOLVE ? 'worry' : t < SHOUT ? 'resolve' : t < CHEER ? 'squeeze' : 'happy'
  // 気づいてから、左の子・右の子を じゅんに 見る
  const look = t >= NOTICE && t < RESOLVE ? wave(t - NOTICE, 2.4) * 1.4 : 0
  // いきを すう → 口を ひらく(2かい めの「おーい」の 前に 少し ちぢむ)
  const inhale = span(t, RESOLVE, SHOUT - 0.1, easeInOut)
  const shoutOpen = span(t, SHOUT, SHOUT + 0.35, easeOut)
  const open = shoutOpen * (1 - 0.3 * during(t, 5.0, 5.6, 0.25))
  const puff = inhale * (1 - span(t, SHOUT, SHOUT + 0.12))
  const cup = span(t, RESOLVE + 0.3, SHOUT - 0.05, easeInOut)
  // あたま: すうとき うしろへ、さけぶとき まえへ
  const headTilt = -5 * inhale * (1 - span(t, SHOUT, SHOUT + 0.15)) + 2.5 * span(t, SHOUT, SHOUT + 0.2) + (t > SHOUT ? wave(t, 0.7) * 0.8 : 0)
  const bob = wave(t, 1.6) * 0.35

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Kid t={t} x={10} outward={-1} tunic="#f2c23c" delay={0} phase={0} />
        <Kid t={t} x={98} outward={1} tunic="#6cc5a1" delay={0.25} phase={0.35} />
        <Voice t={t} />
        <Layer opacity={span(t, APPEAR, APPEAR + 0.2)} scale={0.5 + 0.5 * appear} origin={[52.5, 95]}>
          <ellipse cx="50" cy="97.4" rx="35" ry="2.6" fill="#000000" opacity="0.12" />
          <Layer y={bob}>
            <Brother mood={mood} open={open} look={look} puff={puff} headTilt={headTilt} inhale={inhale} cup={cup} />
          </Layer>
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
    { at: 0, label: '空と 地面', sound: 'pop' },
    { at: APPEAR, label: 'お兄ちゃんが あらわれる' },
    { at: KID_IN, label: '小さな 子どもたちが まいごで しょんぼり' },
    { at: NOTICE, label: 'お兄ちゃんが 気づいて しんぱい顔' },
    { at: RESOLVE, label: '「よし」と 大きく いきを すう' },
    { at: SHOUT, label: '大きな 口で「おーい!」声の わが ひろがる', sound: 'pop' },
    { at: REACT, label: '声が とどいて、子どもたちは びっくり → うれしい' },
    { at: INK, label: '大きな 口と あしの ほね が ひかり、字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '兄 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
