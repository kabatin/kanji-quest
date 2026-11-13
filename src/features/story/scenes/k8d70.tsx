/*
 * 走(はしる): うでを おおきく ふって、あしで びゅんびゅん かける。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … はちまきの うしろへ なびく しっぽ(かぜで ひらひら)
 *   2画目(丨)  … 人の あたま と くび(まんなか を とおる)
 *   3画目(一)  … ふった りょううで(まえの うで は まえへ、うしろの うで は うしろへ)
 *   4画目(丨)  … どう(からだ)
 *   5画目(一)  … ぐんと あげた まえあしの ふともも(ひざ が まえへ)
 *   6画目(ノ)  … うしろへ けりだした あし
 *   7画目(㇏)  … (絵では はっきり 合わせない。ちゅういの ところ)
 *
 * ながれ
 *   ゴールの はた を 見つけた 子が、わくわく して「よーい」と 前に かがむ
 *   → うでを ふって かけだし、まんなかへ。けしきが うしろへ びゅんびゅん ながれる(ほこりも たつ)
 *   → はた の よこを かけぬけて、にっこり
 *   → いちばん かっこいい はしりの かたちで ぴたっと とまり、ほね が ひかって 字「走」になる
 *
 * 人は、ほんものの つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがり、まえ と うしろ で ぎゃくに ふる。
 *   あし は こし から出て ひざ で まがる。まえの ひざ を あげると、うしろの あし は のびる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '走'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#f2a43a'
const TUNIC_NEAR = '#f7b85a'
const TUNIC_FAR = '#d98a22'
const PANTS = '#3e5c86'
const PANTS_FAR = '#34507a'
const SHOE = '#e8534a'
const SHOE_FAR = '#c4413a'
const BAND = '#e8534a'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const DUST = '#f1e4cc'

/** くぎり の時間(秒) */
const NOTICE = 0.7
const CROUCH = 1.3
const GO = 1.8
const ARRIVE = 3.3
const INK = 5.9
const DONE = 8.4
const DURATION = 9
/** はたが 子の よこを とおる ころ */
const PASS = 4.5

/** 地面の たかさ と、こし(足の つけね)・あたま の 場所 */
const GROUND = 94
const HIP_Y = 56
const HIP_X = 55
const THIGH = 19
const SHIN = 19
const UPPER = 11
const FORE = 11
const TORSO = 23
/** 1秒 に あしが 何しゅう するか */
const STRIDE_HZ = 2.2
/** けしきが ながれる はやさ(1秒 に 何 すすむか)と、とまる ころ */
const SCROLL_SPEED = 18.6

const rad = (deg: number) => (deg * Math.PI) / 180
type Pt = readonly [number, number]
/** ま下から まえへ ふった角度 ang の むきに、len だけ すすんだ 点 */
const along = (p: Pt, ang: number, len: number): Pt => [p[0] + Math.sin(rad(ang)) * len, p[1] + Math.cos(rad(ang)) * len]
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/** けしきが どれだけ ながれたか(はしっている間 だけ ふえる) */
const scrollOf = (t: number) => SCROLL_SPEED * Math.max(0, Math.min(t, INK - 0.2) - GO)
const wrap = (x: number, size: number) => ((x % size) + size) % size

function Ground({ t }: SceneProps) {
  const scroll = scrollOf(t)
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 76 44 90 Q72 70 113 93 V101 H-4 Z" fill="#e2f2d2" />
      {/* くも: ゆっくり ながれる */}
      {[0, 1].map((i) => {
        const x = wrap(40 + i * 62 - scroll * 0.12 - t * 1.2, 150) - 20
        return (
          <g key={i} fill="#ffffff" opacity="0.9" transform={`translate(${x} ${i * 6})`}>
            <ellipse cx="0" cy="40" rx="7" ry="3.2" />
            <ellipse cx="4" cy="38" rx="5" ry="3.2" />
          </g>
        )
      })}
      {/* とおくの しげみ: はやく うしろへ ながれる */}
      {[0, 1, 2].map((i) => {
        const x = wrap(i * 52 - scroll * 0.6, 156) - 22
        return (
          <g key={i}>
            <circle cx={x} cy="88" r="7.5" fill={LEAF_DARK} />
            <circle cx={x + 5} cy="86" r="6" fill={LEAF} />
          </g>
        )
      })}
      <ellipse cx="54.5" cy="98" rx="56" ry="6.4" fill={GRASS} />
      {/* ちかくの 草: いちばん はやく ながれる */}
      {Array.from({ length: 6 }, (_, i) => {
        const x = wrap(i * 24 - scroll, 144) - 16
        return <path key={i} d={`M${x} 98 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      })}
    </>
  )
}

/** ゴールの はた: 地面に たつ ぼう と、かぜで ゆれる 赤い はた。けしき と いっしょに ながれる */
function Flag({ t }: SceneProps) {
  const x = 100 - scrollOf(t)
  if (x < -14) return null
  const flap = wave(t, 0.5) * 1.6
  const rise = span(t, 0.2, 0.8, backOut)
  return (
    <Layer x={x} origin={[0, GROUND]}>
      <Layer scale={rise} origin={[0, GROUND]}>
        <rect x="-0.9" y="60" width="1.8" height={GROUND - 60} rx="0.9" fill="#8c5b3c" />
        <circle cx="0" cy="59.6" r="2" fill={SUN} />
        <path d={`M0.9 62 Q${5 + flap} ${59.6 + flap * 0.4} ${10} ${63} Q${15 - flap} ${66.4 - flap * 0.4} ${20} ${63.5} L0.9 74 Z`} fill={BAND} />
      </Layer>
    </Layer>
  )
}

type Mood = 'wonder' | 'ready' | 'happy'

/** ひとつの あしを かく: こし → ひざ → あし。ひざ で まがる。 */
function Leg({ hip, thigh, bend, pants, shoe, skin }: { readonly hip: Pt; readonly thigh: number; readonly bend: number; readonly pants: string; readonly shoe: string; readonly skin: string }) {
  const knee = along(hip, thigh, THIGH)
  // すね は ひざ から うしろ むきに おれる(まえへは まがらない)
  const foot = along(knee, thigh - bend, SHIN)
  const thighTip = along(hip, thigh, 9)
  return (
    <>
      <path d={`M${hip[0]} ${hip[1]} L${knee[0]} ${knee[1]} L${foot[0]} ${foot[1]}`} fill="none" stroke={skin} strokeWidth="7.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${hip[0]} ${hip[1]} L${thighTip[0]} ${thighTip[1]}`} fill="none" stroke={pants} strokeWidth="9" strokeLinecap="round" />
      <ellipse cx={foot[0] + 2.4} cy={foot[1] + 1.4} rx="5" ry="2.8" fill={shoe} />
    </>
  )
}

/** かた から出て、ひじ で まがる うで。 */
function Arm({ shoulder, upper, bend, sleeve }: { readonly shoulder: Pt; readonly upper: number; readonly bend: number; readonly sleeve: string }) {
  const elbow = along(shoulder, upper, UPPER)
  const hand = along(elbow, upper + bend, FORE)
  return (
    <>
      <path d={`M${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={SKIN} strokeWidth="5" strokeLinecap="round" />
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]}`} fill="none" stroke={sleeve} strokeWidth="6.4" strokeLinecap="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.1" fill={SKIN} />
    </>
  )
}

function Head({ c, mood, tail }: { readonly c: Pt; readonly mood: Mood; readonly tail: number }) {
  const [cx, cy] = c
  return (
    <>
      {/* はちまき の しっぽ: かぜで うしろへ ひらひら */}
      <path d={`M${cx - 8.6} ${cy - 3.6} Q${cx - 16} ${cy - 2 + tail} ${cx - 24} ${cy + 3 + tail * 1.6}`} fill="none" stroke={BAND} strokeWidth="2.6" strokeLinecap="round" />
      <path d={`M${cx - 8.6} ${cy - 2.6} Q${cx - 15} ${cy + 2 - tail} ${cx - 21} ${cy + 8 - tail * 1.4}`} fill="none" stroke={BAND} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="9.4" fill={SKIN} />
      <path d={`M${cx - 9.4} ${cy + 1} A9.6 9.6 0 0 1 ${cx + 8.4} ${cy - 5} Q${cx} ${cy - 6} ${cx - 9.4} ${cy + 1} Z`} fill={HAIR} />
      <path d={`M${cx - 8.8} ${cy - 3.2} Q${cx} ${cy - 8.4} ${cx + 8.2} ${cy - 5.4}`} fill="none" stroke={BAND} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx={cx + 3.2} cy={cy + 4.6} r="2" fill="#ff9d9d" opacity="0.55" />
      {mood === 'happy' ? (
        <>
          <path d={`M${cx + 2.8} ${cy + 0.2} Q${cx + 4.5} ${cy - 1.8} ${cx + 6.2} ${cy + 0.2}`} fill="none" stroke="#2b2b2b" strokeWidth="1.3" strokeLinecap="round" />
          <path d={`M${cx + 3.6} ${cy + 3.6} Q${cx + 6} ${cy + 8.4} ${cx + 8.2} ${cy + 3.4} Z`} fill="#b9483f" />
        </>
      ) : (
        <>
          <circle cx={cx + 4.6} cy={cy + 0.4} r="1.5" fill="#2b2b2b" />
          <circle cx={cx + 5.1} cy={cy - 0.1} r="0.5" fill="#ffffff" />
          {mood === 'wonder' ? (
            <ellipse cx={cx + 6} cy={cy + 5.2} rx="1.2" ry="1.5" fill="#b9483f" />
          ) : (
            <path d={`M${cx + 3.2} ${cy + 5.2} Q${cx + 5.4} ${cy + 6.6} ${cx + 7.4} ${cy + 4.8}`} fill="none" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
          )}
        </>
      )}
    </>
  )
}

type RunnerProps = {
  /** 走りの 足ぶみ の 角(ラジアン) */
  readonly phase: number
  /** 0=たっている 1=ぜんりょく で はしる */
  readonly amp: number
  readonly mood: Mood
  readonly tail: number
}

/** はしる 子。体は よこむき で、右へ むかう。 */
function Runner({ phase, amp, mood, tail }: RunnerProps) {
  const s = Math.sin(phase)
  // はしっているとき: からだ が すこし 上下(とんでいる しゅんかん は 高い)
  const hipY = HIP_Y - amp * 1.2 * (1 - Math.cos(2 * phase)) * 0.5
  const hip: Pt = [HIP_X, hipY]
  const tilt = amp * 6
  const shoulder = along(hip, 180 + tilt, TORSO)
  const headC: Pt = [shoulder[0] + 1.6 + amp * 1.4, shoulder[1] - 12.5]
  const mix2 = (stand: number, run: number) => lerp(stand, run, amp)
  // あし A(てまえ): s=1 で ひざ を まえへ あげる / あし B(むこう): はんたい
  const thighA = mix2(0, 17 + 47 * s)
  const bendA = mix2(0, 50 + 35 * s)
  const thighB = mix2(0, 17 - 47 * s)
  const bendB = mix2(0, 50 - 35 * s)
  // うで: あし と ぎゃくに ふる。ひじ は 90度 ぐらい まげる
  const nearUpper = mix2(4, -55 * s)
  const nearBend = mix2(8, 70 + 20 * s)
  const farUpper = mix2(-2, 42 * s)
  const farBend = mix2(8, 80 - 20 * s)
  return (
    <>
      <Arm shoulder={shoulder} upper={farUpper} bend={farBend} sleeve={TUNIC_FAR} />
      <Leg hip={hip} thigh={thighB} bend={bendB} pants={PANTS_FAR} shoe={SHOE_FAR} skin={SKIN_SHADE} />
      {/* くび: みじかく、どう と あたま を つなぐ */}
      <path d={`M${shoulder[0]} ${shoulder[1]} L${headC[0] - 1} ${headC[1] + 5}`} fill="none" stroke={SKIN_SHADE} strokeWidth="5" strokeLinecap="round" />
      {/* どう と ズボン */}
      <path d={`M${hip[0]} ${hip[1]} L${shoulder[0]} ${shoulder[1]}`} fill="none" stroke={TUNIC} strokeWidth="13" strokeLinecap="round" />
      <path d={`M${hip[0]} ${hip[1] + 2} L${hip[0] + Math.sin(rad(tilt)) * 4} ${hip[1] - 4}`} fill="none" stroke={PANTS} strokeWidth="12.6" strokeLinecap="round" />
      <Leg hip={hip} thigh={thighA} bend={bendA} pants={PANTS} shoe={SHOE} skin={SKIN} />
      <Head c={headC} mood={mood} tail={tail} />
      <Arm shoulder={shoulder} upper={nearUpper} bend={nearBend} sleeve={TUNIC_NEAR} />
    </>
  )
}

/** はしっている 間の ほこり。あしもとから うしろ(左)へ ながれて きえる。 */
function Dust({ t }: SceneProps) {
  const show = span(t, GO + 0.3, GO + 0.6) * (1 - span(t, INK - 0.3, INK + 0.1))
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 1, 2, 3].map((i) => {
        const p = (t * STRIDE_HZ * 0.5 + i / 4) % 1
        return <circle key={i} cx={36 - p * 26} cy={GROUND - 1.5 - p * 3} r={1.6 + p * 3.4} fill={DUST} opacity={(1 - p) * 0.9} />
      })}
    </g>
  )
}

/** あせ。あたまから うしろへ とぶ。 */
function Sweat({ t }: SceneProps) {
  const show = during(t, GO + 1.2, INK - 0.1, 0.25)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.5].map((offset) => {
        const p = ((t + offset) % 1) / 1
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" transform={`translate(${42 - p * 12} ${12 + p * 6 - Math.sin(p * Math.PI) * 4}) rotate(-35)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** はたを 見つけた 子の あたまの上の「!」 */
function Notice({ t }: SceneProps) {
  const pop = span(t, NOTICE, NOTICE + 0.3, backOut) * (1 - span(t, CROUCH - 0.3, CROUCH))
  if (pop <= 0) return null
  return (
    <Layer x={80} y={-8} scale={Math.max(0, pop)} origin={[0, 30]}>
      <rect x="-1.4" y="14" width="2.8" height="9" rx="1.4" fill={BAND} />
      <circle cx="0" cy="27" r="1.7" fill={BAND} />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)

  // 走る: GO から あしが うごきだし、INK で ちょうど「まえの ひざ が あがった」かたちに そろう
  const amp = span(t, GO - 0.1, GO + 0.5, easeInOut)
  const phase = Math.PI / 2 + 2 * Math.PI * STRIDE_HZ * (Math.min(t, INK) - INK)
  // まえに かがむ(よーい): 足もとを じくに すこし まえへ
  const crouch = Math.sin(span(t, NOTICE + 0.3, GO) * Math.PI * 0.5) * 10 * (1 - span(t, GO, GO + 0.4))
  // 左から かけてきて、まんなかへ
  const kidX = mix(t, GO, ARRIVE, -24, 0, easeOut)
  const mood: Mood = t < CROUCH ? 'wonder' : t < PASS - 0.2 ? 'ready' : 'happy'
  const tail = wave(t, 0.22) * 2.6 * span(t, GO, GO + 0.6)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Flag t={t} />
        <ellipse cx={55 + kidX} cy={GROUND + 3} rx={10 - amp * 1.5} ry="2.2" fill="#000000" opacity="0.12" />
        <Dust t={t} />
        <Layer x={kidX} origin={[HIP_X, GROUND]}>
          <Layer rotate={crouch} origin={[HIP_X, GROUND]}>
            <Runner phase={phase} amp={amp} mood={mood} tail={tail} />
          </Layer>
          <Notice t={t} />
          <Sweat t={t} />
        </Layer>
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
    { at: 0, label: 'ゴールの はた を 見つける', sound: 'pop' },
    { at: CROUCH, label: 'よーい' },
    { at: GO, label: 'うでを ふって かけだす', sound: 'pop' },
    { at: PASS, label: 'はたの よこを かけぬけて にっこり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '走 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
