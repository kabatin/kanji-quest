/*
 * 数(かず・かぞえる): ぼうを もって、ひとつ、ふたつ と たたいて かぞえる。
 *
 * ほね(画と絵の対応)
 *   1〜9画目(娄) … 左がわ。丸太の上の どんぐり(かぞえられる もの)と、かぞえた ぶんだけ ならぶ 黄色い まる
 *   10〜13画目(攵) … 右がわ。ぼう(むち)を 手に もって たたく 子ども
 *                    (字の形に合わせず、子どもは ほんものの 人の つくり のまま 描く。
 *                     さいごは「だいたい 左に どんぐり、右に ぼうを もつ人」の 場所に そろう)
 *
 * ながれ
 *   丸太の上に どんぐりが 3つ → 子どもが ぼうを もって やってくる。「いくつ あるのかな?」と くびを かしげる
 *   → 「そうだ!」と ぼうを かまえる → どんぐりを 1つ たたいて「ひとつ」(まる が 1こ ふえる)
 *   → 1ほ ふみだして「ふたつ」(まる 2こ)→ もう 1ほ ふみだして「みっつ」(まる 3こ)
 *   → かぞえ おわって にっこり、ぼうを かかげて とびはねる → ほね が ひかって、絵が うすくなり、字「数」が のこる
 *
 * 子どもは、ほんものの 人の つくり を守る(字の形に合わせるために 体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(かた → ひじ → 手 を 自分で つなぐ)。くび は みじかく どう の上。
 *   ぼうは 手の中で きまった 長さ。とおい どんぐりには、1ほ 近づいて、体を 少し かたむけて とどかせる。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '数'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#ef7a5a'
const TUNIC_DARK = '#d9654a'
const TUNIC_FAR = '#b9523c'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const LOG = '#a8724a'
const LOG_DARK = '#8c5b3c'
const LOG_RING = '#f0d3a4'
const LOG_RING_DARK = '#d9b27a'
const STICK = '#c98b4e'
const STICK_DARK = '#a56a3f'
const ACORN = '#c98b4e'
const ACORN_LIGHT = '#e3a96c'
const ACORN_CAP = '#7a4a2b'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const COUNT = '#ffc233'
const COUNT_DARK = '#e8a010'
const MOUTH = '#b9483f'

/** くぎり の時間(秒) */
const WALK = 1.0
const ARRIVE = 2.5
/** ぼうを かまえる */
const READY = 2.8
/** どんぐりを たたく しゅんかん(1つめ・2つめ・3つめ) */
const TAPS = [3.9, 4.9, 5.9] as const
/** かぞえおわって よろこぶ */
const CHEER = 6.3
const INK = 7.3
const DONE = 10.3
const DURATION = 10.9

type Vec = readonly [number, number]
const rad = (deg: number) => (deg * Math.PI) / 180

/** 子どもの 足もと・こし(体を かたむける じく)・かた */
const HIP: Vec = [79, 68]
const SHOULDER: Vec = [79, 48]
/** にのうで・うでさき の長さ */
const ARM_PART = 11
/** ぼうの 長さ。手から 先まで / 手から 後ろ */
const STICK_FRONT = 23
const STICK_BACK = 4

/** 丸太の上の どんぐり(左から 3つ)。右の ほうから 数える */
const LOG_TOP = 70
const ACORN_X = [42, 32, 22] as const
/** ぼうの さきが ふれる ところ(どんぐりの ぼうし の上) */
const TAP_Y = 60
/** どんぐりに ちかづくための 1ほ ぶん(左へ)と 体の かたむき(1つめ・2つめ・3つめ) */
const STEP_X = [0, -7, -14] as const
const LEAN = [-8, -8, -10] as const
const DOT_Y = 46

/** 配列の 間を、u(0〜配列の数-1)で なめらかに つなぐ */
function lerpAt(values: readonly number[], u: number): number {
  const i = Math.min(Math.floor(u), values.length - 2)
  return values[i] + (values[i + 1] - values[i]) * (u - i)
}

/** こしを じく に かたむけたときの かた の場所 */
function shoulderAt(lean: number): Vec {
  const dx = SHOULDER[0] - HIP[0]
  const dy = SHOULDER[1] - HIP[1]
  const r = rad(lean)
  return [HIP[0] + dx * Math.cos(r) - dy * Math.sin(r), HIP[1] + dx * Math.sin(r) + dy * Math.cos(r)]
}

const unit = (v: Vec): Vec => {
  const len = Math.hypot(v[0], v[1]) || 1
  return [v[0] / len, v[1] / len]
}

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
      <path d="M-4 99 Q18 76 44 90 Q72 70 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="86" cy="12" rx="7" ry="3.2" />
        <ellipse cx="91" cy="10.4" rx="5" ry="3.2" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 62, 98, 104].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 丸太: よこに ねた 木の みき。左はし の 切り口に 年輪が 見える。 */
function Log({ t }: SceneProps) {
  const grow = span(t, 0.15, 0.75, backOut)
  return (
    <Layer scaleY={grow} scaleX={0.7 + 0.3 * grow} origin={[34, 92]}>
      <ellipse cx="34" cy="92.6" rx="26" ry="2.6" fill="#000000" opacity="0.1" />
      <rect x="15" y={LOG_TOP} width="39" height="21" rx="3" fill={LOG} />
      <rect x="15" y={LOG_TOP} width="39" height="4" rx="2" fill="#bd855a" />
      <path d="M27 80 h9 M41 84.5 h8 M20 87 h7" stroke={LOG_DARK} strokeWidth="1.1" strokeLinecap="round" fill="none" />
      <ellipse cx="15" cy="80.5" rx="5.2" ry="10.5" fill={LOG_RING_DARK} />
      <ellipse cx="15" cy="80.5" rx="4" ry="8.6" fill={LOG_RING} />
      <ellipse cx="15" cy="80.5" rx="2.2" ry="4.8" fill="none" stroke={LOG_RING_DARK} strokeWidth="0.9" />
    </Layer>
  )
}

/** どんぐり。足もと(丸太の上)を じく に、はね・つぶれる。 */
function Acorn({ x, appear, hop, squash }: { readonly x: number; readonly appear: number; readonly hop: number; readonly squash: number }) {
  return (
    <Layer x={x} y={LOG_TOP - hop} scale={appear} origin={[0, 0]}>
      <Layer scaleY={1 - 0.3 * squash} scaleX={1 + 0.15 * squash} origin={[0, 0]}>
        <ellipse cx="0" cy="-4.2" rx="3.7" ry="4.5" fill={ACORN} />
        <path d="M-0.7 0.1 L0 1.5 L0.7 0.1 Z" fill={ACORN_CAP} />
        <ellipse cx="-1.3" cy="-3.6" rx="0.9" ry="1.8" fill={ACORN_LIGHT} />
        <path d="M-4.6 -7.2 Q0 -12.6 4.6 -7.2 Q4.8 -5.4 3.6 -5.2 L-3.6 -5.2 Q-4.8 -5.4 -4.6 -7.2 Z" fill={ACORN_CAP} />
        <rect x="-0.6" y="-11.4" width="1.2" height="2" rx="0.6" fill={ACORN_CAP} />
      </Layer>
    </Layer>
  )
}

/** かぞえた しるし: どんぐりの上に、かぞえた ぶんの 黄色い まる(1つめは 1こ、2つめは 2こ、3つめは 3こ)。 */
function CountDots({ t, x, count, at, bounce }: { readonly t: number; readonly x: number; readonly count: number; readonly at: number; readonly bounce: number }) {
  const pop = span(t, at + 0.05, at + 0.3, backOut)
  if (pop <= 0) return null
  return (
    <Layer y={-bounce}>
      {Array.from({ length: count }, (_, i) => {
        const cx = x + (i - (count - 1) / 2) * 4.8
        return (
          <g key={i}>
            <circle cx={cx} cy={DOT_Y + 0.5} r={2.1 * pop} fill={COUNT_DARK} />
            <circle cx={cx} cy={DOT_Y} r={2.1 * pop} fill={COUNT} />
            <circle cx={cx - 0.6} cy={DOT_Y - 0.7} r={0.6 * pop} fill="#fff3c4" />
          </g>
        )
      })}
    </Layer>
  )
}

/** たたいた しゅんかん の ぽん(まるい わ) */
function TapRing({ t, x, at }: { readonly t: number; readonly x: number; readonly at: number }) {
  const p = span(t, at, at + 0.4, easeOut)
  if (p <= 0 || p >= 1) return null
  return <circle cx={x} cy={TAP_Y + 1} r={2 + p * 6} fill="none" stroke="#fff3c4" strokeWidth={1.4 * (1 - p)} opacity={1 - p} />
}

type Mood = 'puzzled' | 'focus' | 'happy'

type ChildProps = {
  readonly stride: number
  readonly mood: Mood
  readonly say: boolean
  readonly lean: number
  readonly tilt: number
  readonly arm: { readonly shoulder: Vec; readonly elbow: Vec; readonly hand: Vec }
  readonly stick: { readonly hand: Vec; readonly dir: Vec; readonly swing: number }
}

/** あたまの 顔。左むき。 */
function Face({ mood, say }: { readonly mood: Mood; readonly say: boolean }) {
  return (
    <>
      <circle cx="26.5" cy="28.8" r="2.1" fill="#ff9d9d" opacity="0.55" />
      {mood === 'happy' ? (
        <path d="M23.8 24.9 Q25.4 26.6 27 24.9" fill="none" stroke="#2b2b2b" strokeWidth="1.25" strokeLinecap="round" />
      ) : (
        <>
          <path d={mood === 'puzzled' ? 'M23.6 22.2 l3 -0.9' : 'M23.6 23.2 l3 0.5'} stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="25.4" cy="25.6" r="1.15" fill="#2b2b2b" />
        </>
      )}
      {say ? (
        <ellipse cx="24.6" cy="30.4" rx="1.5" ry="1.9" fill={MOUTH} />
      ) : mood === 'puzzled' ? (
        <path d="M23.4 30.2 q1 -1 2 0 q1 1 2 0" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
      ) : mood === 'focus' ? (
        <path d="M23.6 30.2 h2.8" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
      ) : (
        <path d="M23 29.4 Q24.8 31.8 26.8 29.9" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
      )}
    </>
  )
}

function Child({ stride, mood, say, lean, tilt, arm, stick }: ChildProps) {
  const tip: Vec = [stick.hand[0] + stick.dir[0] * STICK_FRONT, stick.hand[1] + stick.dir[1] * STICK_FRONT]
  const back: Vec = [stick.hand[0] - stick.dir[0] * STICK_BACK, stick.hand[1] - stick.dir[1] * STICK_BACK]
  return (
    <>
      {/* あし: むこう・てまえ。あるくとき かわりばんこに ふる */}
      <Layer rotate={stride * 17} origin={[81, 67]}>
        <rect x="78.6" y="65" width="5.6" height="27.5" rx="2.8" fill={PANTS_DARK} />
        <ellipse cx="80.4" cy="93.4" rx="5" ry="2.6" fill={SHOE} />
      </Layer>
      <Layer rotate={-stride * 17} origin={[77.3, 67]}>
        <rect x="74.4" y="65" width="5.8" height="27.5" rx="2.9" fill={PANTS} />
        <ellipse cx="76" cy="93.4" rx="5" ry="2.6" fill={SHOE} />
      </Layer>
      {/* うえの 体: こし を じく に まえへ かたむく */}
      <Layer rotate={lean} origin={HIP}>
        {/* むこうの うで: たらしている */}
        <Layer rotate={-stride * 22} origin={SHOULDER}>
          <path d="M79 48 L79.4 59 L80 69" fill="none" stroke={TUNIC_FAR} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="80" cy="69.6" r="3.1" fill={SKIN_SHADE} />
        </Layer>
        {/* くび: どう と あたま の間を みじかく つなぐ */}
        <rect x="76.6" y="38" width="5.2" height="8" rx="2.4" fill={SKIN_SHADE} />
        <rect x="72.2" y="43.4" width="14.4" height="26" rx="6.6" fill={TUNIC} />
        <path d="M74.2 62.4 h10.4" stroke={TUNIC_DARK} strokeWidth="1.6" strokeLinecap="round" />
        <Layer rotate={tilt} origin={[79, 40]}>
          <g transform="translate(48.8 7.4)">
            <circle cx="30.2" cy="24.6" r="9.2" fill={SKIN} />
            <path d="M21.5 23 C21.4 13.8 31.8 11.2 37.8 17 C40.2 20.2 40.2 26 38.2 30.2 C37.6 24.4 33.4 20.2 26.6 20.6 C24.4 20.8 22.6 21.8 21.5 23 Z" fill={HAIR} />
            <path d="M32.4 16.4 Q33.2 13.2 35 15.3 Q36.2 12.6 37 15.7" fill="none" stroke={HAIR} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            <Face mood={mood} say={say} />
            {say && <path d="M20.2 28.4 q-1.8 1.6 0 3.4 M17.8 27 q-3.2 3 0 6.2" fill="none" stroke="#5f7fd6" strokeWidth="0.9" strokeLinecap="round" />}
          </g>
        </Layer>
      </Layer>
      {/* てまえの うで と ぼう: かた → ひじ → 手 の じゅんに つなぐ。ぼうは 手の中 */}
      <path d={`M${arm.shoulder[0]} ${arm.shoulder[1]} L${arm.elbow[0]} ${arm.elbow[1]} L${arm.hand[0]} ${arm.hand[1]}`} fill="none" stroke={TUNIC_DARK} strokeWidth="5.8" strokeLinecap="round" strokeLinejoin="round" />
      <Layer rotate={stick.swing} origin={stick.hand}>
        <path d={`M${back[0]} ${back[1]} L${tip[0]} ${tip[1]}`} stroke={STICK_DARK} strokeWidth="2.8" strokeLinecap="round" />
        <path d={`M${back[0]} ${back[1]} L${tip[0]} ${tip[1]}`} stroke={STICK} strokeWidth="1.7" strokeLinecap="round" />
      </Layer>
      <circle cx={arm.hand[0]} cy={arm.hand[1]} r="3.3" fill={SKIN} />
    </>
  )
}

/** 「いくつ あるのかな」の もくもく(あたまの上)。中に はてな。 */
function Thought({ t }: SceneProps) {
  const show = during(t, ARRIVE - 0.3, READY + 0.15, 0.25)
  if (show <= 0) return null
  const bob = wave(t, 1.2) * 0.8
  return (
    <g opacity={show} transform={`translate(0 ${bob})`}>
      <circle cx="68.6" cy="21" r="1.2" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <circle cx="65.4" cy="16.4" r="2" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <circle cx="59" cy="9.6" r="6.6" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
      <path d="M57.2 7.6 Q57.2 5.2 59.2 5.2 Q61.4 5.2 61.4 7.4 Q61.4 8.8 59.4 9.8 V11" fill="none" stroke="#5f7fd6" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="59.4" cy="13.4" r="0.9" fill="#5f7fd6" />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 13)

  // どんぐり: 丸太の上に ぽん ぽん ぽん と 出る
  const appear = (i: number) => span(t, 0.55 + i * 0.2, 0.95 + i * 0.2, backOut)
  // 子どもが あるいてくる
  const walking = 1 - span(t, ARRIVE - 0.25, ARRIVE)
  const walkStride = t < WALK ? 0 : Math.sin((t - WALK) * Math.PI * 2 * 1.8) * walking
  const walkX = mix(t, WALK, ARRIVE, 40, 0, easeOut)
  // かぞえる とき、とおい どんぐりへ 1ほ ずつ 近づく(ぼうを 高く あげている あいだに)
  const move = [1, 2].map((k) => span(t, TAPS[k] - 0.65, TAPS[k] - 0.3, easeInOut))
  const u = move[0] + move[1]
  const stepStride = move.reduce((sum, s) => sum + (s > 0 && s < 1 ? Math.sin(s * Math.PI * 2) * 0.9 : 0), 0)
  const stride = walkStride + stepStride
  const ox = walkX + lerpAt(STEP_X, u)
  // かまえ・よろこび
  const ready = span(t, READY, READY + 0.5, easeInOut) * (1 - span(t, CHEER, CHEER + 0.4, easeInOut))
  const cheer = span(t, CHEER, CHEER + 0.5, easeOut)
  const oy = -Math.abs(Math.sin((t - CHEER) * Math.PI * 2.2)) * 3.2 * during(t, CHEER, INK - 0.3, 0.1)
  const lean = lerpAt(LEAN, u) * ready
  // ぼうを あげて おろす(手を じく に さきが あがる)。ふれる しゅんかん に 0
  const lift = Math.max(...TAPS.map((tk) => span(t, tk - 0.8, tk - 0.55, easeOut) * (1 - span(t, tk - 0.25, tk, easeIn))))
  const swing = 30 * lift

  // うで: かた から 手 までを たしかめて つなぐ
  const shoulder = shoulderAt(lean)
  const tipWorld: Vec = [lerpAt(ACORN_X, u), TAP_Y]
  const tipHere: Vec = [tipWorld[0] - ox, tipWorld[1] - oy]
  const toTip = unit([tipHere[0] - shoulder[0], tipHere[1] - shoulder[1]])
  const holdTarget: Vec = [tipHere[0] - toTip[0] * STICK_FRONT, tipHere[1] - toTip[1] * STICK_FRONT]
  const holdIdle: Vec = [shoulder[0] - 5 + stride * 6 - 10 * cheer, shoulder[1] + 19 - 27 * cheer]
  const dirIdle = unit([-0.2 - 0.17 * cheer, 1 - 2 * cheer])
  const hand: Vec = [holdIdle[0] + (holdTarget[0] - holdIdle[0]) * ready, holdIdle[1] + (holdTarget[1] - holdIdle[1]) * ready]
  const dir = unit([dirIdle[0] + (toTip[0] - dirIdle[0]) * ready, dirIdle[1] + (toTip[1] - dirIdle[1]) * ready])
  const reach = Math.min(Math.hypot(hand[0] - shoulder[0], hand[1] - shoulder[1]), ARM_PART * 2 - 0.3)
  const toHand = unit([hand[0] - shoulder[0], hand[1] - shoulder[1]])
  const handAt: Vec = [shoulder[0] + toHand[0] * reach, shoulder[1] + toHand[1] * reach]
  const bendH = Math.sqrt(Math.max(0, ARM_PART ** 2 - (reach / 2) ** 2))
  const side: Vec = toHand[0] > 0 ? [toHand[1], -toHand[0]] : [-toHand[1], toHand[0]]
  const below: Vec = side[1] >= 0 ? side : [-side[0], -side[1]]
  const elbow: Vec = [shoulder[0] + toHand[0] * (reach / 2) + below[0] * bendH, shoulder[1] + toHand[1] * (reach / 2) + below[1] * bendH]

  const mood: Mood = t < READY ? 'puzzled' : t < TAPS[1] ? 'focus' : 'happy'
  const say = TAPS.some((tk) => t > tk && t < tk + 0.4) || (cheer > 0.2 && t < INK - 0.4)
  const tilt = -9 * (1 - span(t, READY - 0.2, READY + 0.3)) + wave(t, 1.2) * (1 - span(t, READY - 0.2, READY + 0.3)) * 2 + cheer * 3

  // どんぐり ごとの はね(たたかれて つぶれ・はねる。かぞえおわりで みんなで はねる)
  const acornMove = (k: number) => {
    const tk = TAPS[k]
    const hitP = span(t, tk, tk + 0.45)
    const cheerP = span(t, CHEER + 0.1 * k, CHEER + 0.1 * k + 0.5)
    const hop = Math.sin(hitP * Math.PI) * 4 * (1 - hitP * 0.5) + Math.sin(cheerP * Math.PI) * 5
    const squash = Math.sin(span(t, tk, tk + 0.14) * Math.PI) * (1 - span(t, tk + 0.14, tk + 0.3))
    return { hop, squash }
  }
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Log t={t} />
        {ACORN_X.map((x, k) => {
          // 右の ほう(k = 0)から かぞえる。ならんだ じゅんに 出す
          const move2 = acornMove(k)
          return <Acorn key={x} x={x} appear={appear(k)} hop={move2.hop} squash={move2.squash} />
        })}
        {ACORN_X.map((x, k) => (
          <TapRing key={x} t={t} x={x} at={TAPS[k]} />
        ))}
        {ACORN_X.map((x, k) => (
          <CountDots key={x} t={t} x={x} count={k + 1} at={TAPS[k]} bounce={acornMove(k).hop * 0.6} />
        ))}
        <Layer x={ox} y={oy}>
          <Child
            stride={stride}
            mood={mood}
            say={say}
            lean={lean}
            tilt={tilt}
            arm={{ shoulder, elbow, hand: handAt }}
            stick={{ hand: handAt, dir, swing }}
          />
        </Layer>
        <Thought t={t} />
        <Layer opacity={during(t, READY, READY + 0.6, 0.2)}>
          <Star cx={70} cy={20} r={3.6 + wave(t, 0.5) * 0.4} color={COUNT} spin={t * 60} />
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
    { at: 0, label: '丸太の上に どんぐりが 3つ', sound: 'pop' },
    { at: WALK, label: '子どもが ぼうを もって あるいてくる' },
    { at: ARRIVE, label: '「いくつ あるのかな?」と くびを かしげる' },
    { at: READY, label: '「そうだ!」と ぼうを かまえる', sound: 'pop' },
    { at: TAPS[0], label: 'ぼうで たたいて「ひとつ」', sound: 'pop' },
    { at: TAPS[1], label: '1ほ ふみだして「ふたつ」', sound: 'pop' },
    { at: TAPS[2], label: 'もう 1ほ ふみだして「みっつ」', sound: 'pop' },
    { at: CHEER, label: 'かぞえおわって にっこり、とびはねる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '数 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
