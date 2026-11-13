/*
 * 語(かたる): ことばで はなして、あいてに つたえる。
 *
 * ほね(画と絵の対応)
 *   1〜7画目(言)  … 左がわ。女の子が 口から ことばを だして はなす(言は「口」から ことばが 出る しるし)
 *                    左の 空に ふくらむ 吹き出し(ことば)が、言の 上の 点と よこ線の あたり
 *   8〜14画目(吾) … 右がわ。男の子が 手を 上げて「ご!」と さけぶ。
 *                    手の「5」(五) が 上、大きく あいた 口(口) が 下。「ご」の 音は「五」から来ている
 *
 * ながれ
 *   野原で 女の子が 花を 見つけて、だれかに つたえたくて うずうず。
 *   → 男の子に はなす。花の かずを 1つ・2つ…と 吹き出しに 出していく(ことばを 言う)
 *   → 男の子は 5つだと わかって、ゆびを 1本ずつ 立てて「ご!」と こたえる(音は 五)
 *   → 女の子は つたわって 大よろこび → ほね が ひかって、絵が うすくなり、字「語」が のこる
 *
 * 人は ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく、あたま は どう の まんなか の上。
 *   絵は 字と ぴったり 重ならなくてよい。女の子は 左、男の子は 右、花の 吹き出しは 上、と だいたいの場所と むきを そろえる。
 */
import { backOut, during, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '語'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const TONGUE = '#ff8a8a'
const CHEEK = '#ff9d9d'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'

/** くぎり の時間(秒) */
const GIRL_IN = 0.2
const BOY_IN = 0.7
/** 女の子が はなしはじめる・はなしおわる */
const TALK = 2.1
const TALK_END = 4.5
/** 花を 吹き出しに 出す(1つめの時間 と まるごと の間かく) */
const FLOWER_AT = 2.4
const FLOWER_STEP = 0.4
const FLOWER_COUNT = 5
/** 男の子が 手を 上げる・ゆびを 立てはじめる・「ご!」と さけぶ */
const RAISE = 4.6
const FINGER_AT = 5.0
const FINGER_STEP = 0.18
const SHOUT = 5.9
const INK = 7.0
const DONE = 10.3
const DURATION = 10.9

const FEET_Y = 96
const GIRL_X = 26
const BOY_X = 76
/** うで の ひとふし の長さ(かた→ひじ、ひじ→手) */
const ARM = 8.6
const FLOWER_COLORS = ['#ff8fb1', '#ffb84a', '#8f9cec', '#ff7a6b', '#c07df0'] as const

const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const rad = (deg: number) => (deg * Math.PI) / 180

/* ───────── まわりの けしき ───────── */

function Backdrop({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  const drift = t * 1.1
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[98, 11]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="97.2" y="0.8" width="1.6" height="3.6" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 98 11)`} />
        ))}
      </Layer>
      <circle cx="98" cy="11" r={5.4 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 70 113 93 V101 H-4 Z" fill="#e2f2d2" />
      {/* ゆっくり ながれる 雲 */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${drift} 0)`}>
        <ellipse cx="58" cy="19" rx="7" ry="3.2" />
        <ellipse cx="63" cy="17.2" rx="4.8" ry="3.2" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 44, 62, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 5まいの はなびら の 花。size で 大きさ。 */
function Flower({ color, size = 1 }: { readonly color: string; readonly size?: number }) {
  return (
    <g transform={`scale(${size})`}>
      {Array.from({ length: 5 }, (_, i) => (
        <circle key={i} cx={Math.sin(rad(i * 72)) * 2.3} cy={-Math.cos(rad(i * 72)) * 2.3} r="1.9" fill={color} />
      ))}
      <circle cx="0" cy="0" r="1.4" fill="#ffd24a" />
    </g>
  )
}

/** 野原の 花(風で ゆれる)。女の子が 見つけた 花の なかま。 */
function MeadowFlowers({ t }: SceneProps) {
  const grow = span(t, 0.3, 0.9, backOut)
  return (
    <>
      {[
        { x: 49, y: 95.2, color: FLOWER_COLORS[0], phase: 0 },
        { x: 56, y: 96.4, color: FLOWER_COLORS[1], phase: 0.7 },
        { x: 100, y: 95.6, color: FLOWER_COLORS[2], phase: 1.4 },
        { x: 8, y: 95.8, color: FLOWER_COLORS[3], phase: 2.1 },
      ].map((f) => (
        <Layer key={f.x} scale={grow} origin={[f.x, f.y]} rotate={wave(t, 2.4, f.phase) * 5}>
          <path d={`M${f.x} ${f.y} v-6`} stroke="#4c8f52" strokeWidth="1" strokeLinecap="round" fill="none" />
          <g transform={`translate(${f.x} ${f.y - 7.4})`}>
            <Flower color={f.color} size={0.9} />
          </g>
        </Layer>
      ))}
    </>
  )
}

/** ひらひら とぶ ちょうちょ。2人の あいだを ゆっくり まわる。 */
function Butterfly({ t }: SceneProps) {
  const show = span(t, 0.8, 1.2)
  if (show <= 0) return null
  const x = 51 + Math.sin(t * 0.8) * 11
  const y = 74 + Math.sin(t * 1.6) * 5
  const flap = 0.35 + Math.abs(wave(t, 0.36)) * 0.65
  return (
    <Layer x={x} y={y} opacity={show}>
      <Layer scaleX={flap}>
        <ellipse cx="-2.3" cy="-1" rx="2.4" ry="2.1" fill="#ffb84a" />
        <ellipse cx="2.3" cy="-1" rx="2.4" ry="2.1" fill="#ffb84a" />
        <ellipse cx="-1.8" cy="1.6" rx="1.7" ry="1.5" fill="#ff8fb1" />
        <ellipse cx="1.8" cy="1.6" rx="1.7" ry="1.5" fill="#ff8fb1" />
      </Layer>
      <rect x="-0.4" y="-2.2" width="0.8" height="5" rx="0.4" fill="#5a3b2a" />
    </Layer>
  )
}

/* ───────── 人(2人とも 同じ つくり) ───────── */

type Eyes = 'dot' | 'happy' | 'wide'
type MouthKind = 'flat' | 'smile' | 'grin' | 'open' | 'big'
type Mouth = { readonly kind: MouthKind; readonly amount?: number }
/** うで の かっこう。ま下を 0 度 として、a1 = かた→ひじ の むき、a2 = ひじ→手 の むき(外へ あげる ほうが プラス) */
type ArmPose = { readonly a1: number; readonly a2: number }

type KidStyle = {
  readonly girl: boolean
  readonly hair: string
  readonly top: string
  readonly topDark: string
  readonly bottom: string
}

type KidState = {
  readonly lift: number
  readonly tilt: number
  readonly eyes: Eyes
  readonly mouth: Mouth
  /** ひとみの むき(x, y) */
  readonly look: readonly [number, number]
  readonly left: ArmPose
  readonly right: ArmPose
  readonly fingers: number
}

const GIRL_STYLE: KidStyle = { girl: true, hair: '#7a4a2e', top: '#f0769a', topDark: '#d95c82', bottom: '#f8cfa6' }
const BOY_STYLE: KidStyle = { girl: false, hair: '#3b2a20', top: '#4f9be0', topDark: '#3c82c4', bottom: '#3e5c86' }

const REST: ArmPose = { a1: 8, a2: 16 }
const lerpPose = (a: ArmPose, b: ArmPose, k: number): ArmPose => ({ a1: lerp(a.a1, b.a1, k), a2: lerp(a.a2, b.a2, k) })

/** ゆびを 立てる むき(手の むき から 何度 ずれるか と、長さ)。1本目が おやゆび。 */
const FINGER_SHAPES = [
  { off: 52, len: 4.4 },
  { off: 20, len: 6 },
  { off: -2, len: 6.8 },
  { off: -24, len: 6.2 },
  { off: -46, len: 5 },
] as const

/** かた から出て、ひじ で まがる うで。side = 1 は 画面の右、-1 は 左。 */
function Arm({ side, pose, color, fingers }: { readonly side: 1 | -1; readonly pose: ArmPose; readonly color: string; readonly fingers: number }) {
  const shoulder = [side * 7.4, -34] as const
  const dir = (deg: number) => [side * Math.sin(rad(deg)), Math.cos(rad(deg))] as const
  const d1 = dir(pose.a1)
  const d2 = dir(pose.a2)
  const elbow = [shoulder[0] + d1[0] * ARM, shoulder[1] + d1[1] * ARM] as const
  const hand = [elbow[0] + d2[0] * ARM, elbow[1] + d2[1] * ARM] as const
  return (
    <>
      {FINGER_SHAPES.slice(0, fingers).map((shape, i) => {
        const d = dir(pose.a2 + shape.off)
        return <path key={i} d={`M${hand[0] + d[0] * 1.6} ${hand[1] + d[1] * 1.6} L${hand[0] + d[0] * (1.6 + shape.len)} ${hand[1] + d[1] * (1.6 + shape.len)}`} stroke={SKIN} strokeWidth="2.1" strokeLinecap="round" fill="none" />
      })}
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="4.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.9" fill={SKIN} />
    </>
  )
}

function EyeShape({ x, kind, look }: { readonly x: number; readonly kind: Eyes; readonly look: readonly [number, number] }) {
  if (kind === 'happy') return <path d={`M${x - 2} -46.4 Q${x} -49.6 ${x + 2} -46.4`} fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
  if (kind === 'wide') {
    return (
      <>
        <circle cx={x + look[0] * 0.5} cy={-47.6 + look[1] * 0.5} r="2.1" fill={EYE} />
        <circle cx={x + look[0] * 0.5 + 0.7} cy={-48.3 + look[1] * 0.5} r="0.7" fill="#ffffff" />
        <path d={`M${x - 2.2} -51.6 Q${x} -53.2 ${x + 2.2} -51.6`} fill="none" stroke={EYE} strokeWidth="0.9" strokeLinecap="round" />
      </>
    )
  }
  return <circle cx={x + look[0]} cy={-47.4 + look[1]} r="1.3" fill={EYE} />
}

function MouthShape({ mouth, pulse }: { readonly mouth: Mouth; readonly pulse: number }) {
  switch (mouth.kind) {
    case 'flat':
      return <ellipse cx="0" cy="-42.2" rx="1" ry="0.9" fill={MOUTH} />
    case 'smile':
      return <path d="M-2.6 -42.8 Q0 -39.8 2.6 -42.8" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
    case 'grin':
      return <path d="M-3.6 -43.4 Q0 -37.6 3.6 -43.4 Z" fill={MOUTH} strokeLinejoin="round" stroke={MOUTH} strokeWidth="0.6" />
    case 'open': {
      const a = mouth.amount ?? 0.5
      return <ellipse cx="0" cy={-42.4 + a * 0.6} rx={1.7 + a * 0.9} ry={0.7 + a * 2.4} fill={MOUTH} />
    }
    case 'big':
      return (
        <>
          <ellipse cx="0" cy="-41.6" rx={3.4 * (1 + pulse * 0.06)} ry={3.9 * (1 + pulse * 0.1)} fill={MOUTH} />
          <ellipse cx="0" cy="-39.8" rx="2" ry="1.2" fill={TONGUE} />
        </>
      )
  }
}

function Head({ style, state, pulse }: { readonly style: KidStyle; readonly state: KidState; readonly pulse: number }) {
  return (
    <Layer rotate={state.tilt} origin={[0, -38]}>
      {/* 女の子の ふたつ むすび(あたまの うしろ) */}
      {style.girl ? (
        <>
          <ellipse cx="-10.4" cy="-42.4" rx="3.5" ry="5.2" fill={style.hair} />
          <ellipse cx="10.4" cy="-42.4" rx="3.5" ry="5.2" fill={style.hair} />
        </>
      ) : null}
      <circle cx="0" cy="-47" r="9.6" fill={SKIN} />
      {/* かみ: あたまの 上を おおう */}
      <path d="M-9.9 -47 C-10.8 -58.6 10.8 -58.6 9.9 -47 C7 -51.4 2.6 -52.8 -1 -52.2 C-4.4 -51.6 -7.6 -50.2 -9.9 -47 Z" fill={style.hair} />
      {style.girl ? (
        <>
          <circle cx="-9" cy="-48" r="1.9" fill="#e8534a" />
          <circle cx="9" cy="-48" r="1.9" fill="#e8534a" />
        </>
      ) : (
        <path d="M-5 -55.2 l1.6 -3.8 l2.2 3.2 l1.8 -4 l2 3.8 l2 -3 l0.6 4" fill={style.hair} stroke={style.hair} strokeWidth="1" strokeLinejoin="round" />
      )}
      <circle cx="-6.1" cy="-43.6" r="1.8" fill={CHEEK} opacity="0.55" />
      <circle cx="6.1" cy="-43.6" r="1.8" fill={CHEEK} opacity="0.55" />
      <EyeShape x={-3.6} kind={state.eyes} look={state.look} />
      <EyeShape x={3.6} kind={state.eyes} look={state.look} />
      <MouthShape mouth={state.mouth} pulse={pulse} />
    </Layer>
  )
}

function Kid({ x, style, state, pop, pulse = 0 }: { readonly x: number; readonly style: KidStyle; readonly state: KidState; readonly pop: number; readonly pulse?: number }) {
  return (
    <Layer opacity={pop > 0 ? 1 : 0} scale={pop} origin={[x, FEET_Y]}>
      <ellipse cx={x} cy="97.4" rx="9.5" ry="2.3" fill="#000000" opacity="0.12" />
      <g transform={`translate(${x} ${FEET_Y - state.lift})`}>
        {/* あし */}
        <rect x="-6.6" y="-15" width="5.2" height="13.6" rx="2.6" fill={style.bottom} />
        <rect x="1.4" y="-15" width="5.2" height="13.6" rx="2.6" fill={style.bottom} />
        <ellipse cx="-4" cy="-1.4" rx="4.2" ry="2.1" fill="#6b4a36" />
        <ellipse cx="4" cy="-1.4" rx="4.2" ry="2.1" fill="#6b4a36" />
        {/* くび: みじかく、どう と あたま の間 */}
        <rect x="-2.2" y="-40" width="4.4" height="7" rx="2" fill={SKIN_SHADE} />
        {/* どう。女の子は ワンピース(すそが ひろがる) */}
        {style.girl ? (
          <>
            <path d="M-7.6 -33.5 Q-7.6 -37.4 -4 -37.4 H4 Q7.6 -37.4 7.6 -33.5 L11 -13.4 Q0 -10.4 -11 -13.4 Z" fill={style.top} />
            <path d="M-10.4 -15.6 Q0 -12.6 10.4 -15.6" fill="none" stroke={style.topDark} strokeWidth="1.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <rect x="-7.6" y="-37.4" width="15.2" height="24" rx="6" fill={style.top} />
            <path d="M-6 -18 h12" stroke={style.topDark} strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}
        <Arm side={-1} pose={state.left} color={style.topDark} fingers={0} />
        <Arm side={1} pose={state.right} color={style.topDark} fingers={state.fingers} />
        <Head style={style} state={state} pulse={pulse} />
      </g>
    </Layer>
  )
}

/* ───────── 2人の 動き ───────── */

function girlState(t: number): KidState {
  const talking = t >= TALK && t < TALK_END
  const hop = Math.abs(Math.sin((t - BOY_IN) * Math.PI * 2 * 1.4)) * 2.2 * span(t, BOY_IN, BOY_IN + 0.2) * (1 - span(t, TALK - 0.35, TALK))
  const cheer = span(t, SHOUT, SHOUT + 0.25) * (1 - span(t, SHOUT + 1.5, SHOUT + 1.9))
  const jump = Math.abs(Math.sin((t - SHOUT) * Math.PI * 2 * 1.6)) * 3.4 * cheer
  // うずうず(つたえたくて ゆれている) → はなす(てまえの うで を ふって 花を おしえる) → よろこぶ(りょううで を 上げる)
  const fidget = wave(t, 0.7) * 6
  const eager: ArmPose = { a1: REST.a1 + fidget, a2: REST.a2 + fidget * 1.4 }
  const speakK = span(t, TALK, TALK + 0.3) * (1 - span(t, TALK_END, TALK_END + 0.4))
  const gesture = wave(t, 0.9) * 12
  const speak: ArmPose = { a1: 58 + gesture, a2: 105 + gesture }
  const cheerPose: ArmPose = { a1: 140 + wave(t, 0.35) * 8, a2: 168 + wave(t, 0.35) * 8 }
  const cheerK = span(t, SHOUT, SHOUT + 0.3)
  const base = t < TALK ? eager : REST
  const right = lerpPose(lerpPose(base, speak, speakK), cheerPose, cheerK)
  const left = lerpPose(base, cheerPose, cheerK)
  const mouth: Mouth = t >= SHOUT ? { kind: 'grin' } : talking ? { kind: 'open', amount: 0.15 + (0.5 + 0.5 * wave(t, 0.28)) * 0.7 } : t < TALK ? { kind: 'flat' } : { kind: 'smile' }
  return {
    lift: hop + jump,
    tilt: t >= SHOUT ? 0 : mix(t, 0, TALK, 0, 3),
    eyes: t >= SHOUT ? 'happy' : 'dot',
    mouth,
    look: [0.9, -0.3],
    left,
    right,
    fingers: 0,
  }
}

function boyState(t: number): KidState {
  const shouting = t >= SHOUT
  const raise = span(t, RAISE, RAISE + 0.45, backOut)
  const rest: ArmPose = { a1: 7, a2: 13 }
  const right: ArmPose = { a1: lerp(rest.a1, 132, raise), a2: lerp(rest.a2, 168, raise) }
  const fingers = t < FINGER_AT ? 0 : Math.min(5, Math.floor((t - FINGER_AT) / FINGER_STEP) + 1)
  const counting = t >= FINGER_AT && t < SHOUT
  const mouth: Mouth = shouting ? (t < SHOUT + 1.1 ? { kind: 'big' } : { kind: 'grin' }) : counting ? { kind: 'open', amount: 0.25 + (0.5 + 0.5 * wave(t, 0.18)) * 0.35 } : { kind: 'smile' }
  const listening = t >= TALK && t < RAISE
  const eyes: Eyes = shouting ? 'happy' : t >= RAISE ? 'wide' : 'dot'
  return {
    lift: shouting ? Math.abs(Math.sin((t - SHOUT) * Math.PI * 2 * 1.5)) * 1.6 * (1 - span(t, SHOUT + 0.8, SHOUT + 1.2)) : 0,
    tilt: listening ? -5 * span(t, TALK, TALK + 0.4) : mix(t, RAISE, RAISE + 0.4, -5, 0),
    eyes,
    mouth,
    look: listening ? [-0.8, -0.6] : [-0.9, -0.1],
    left: { a1: rest.a1 + wave(t, 2.4) * 1.5, a2: rest.a2 },
    right,
    fingers,
  }
}

/* ───────── ことば(吹き出し・音) ───────── */

/** 女の子の 口から 出た ことば。花を 1つずつ かぞえて 見せる。 */
function SpeechBubble({ t }: SceneProps) {
  const pop = span(t, TALK + 0.1, TALK + 0.5, backOut)
  if (pop <= 0) return null
  return (
    <Layer scale={pop} origin={[GIRL_X, 38]}>
      <g fill="#cfe0f2" transform="translate(0 1.3)">
        <rect x="4" y="8" width="46" height="25" rx="10" />
        <path d="M21 31 L26 39.4 L31 31 Z" />
      </g>
      <rect x="4" y="8" width="46" height="25" rx="10" fill="#ffffff" />
      <path d="M21 31 L26 39.4 L31 31 Z" fill="#ffffff" />
      {Array.from({ length: FLOWER_COUNT }, (_, i) => {
        const grow = span(t, FLOWER_AT + FLOWER_STEP * i, FLOWER_AT + FLOWER_STEP * i + 0.3, backOut)
        return (
          <Layer key={i} scale={grow} origin={[11.5 + i * 8.2, 20.5]}>
            <g transform={`translate(${11.5 + i * 8.2} 20.5)`}>
              <Flower color={FLOWER_COLORS[i]} />
            </g>
          </Layer>
        )
      })}
    </Layer>
  )
}

/** 女の子の 口から ことばが 出る ようす(ちいさな 音の すじ) */
function TalkWaves({ t }: SceneProps) {
  if (t < TALK || t >= TALK_END) return null
  const fade = during(t, TALK, TALK_END, 0.2)
  // 顔(はんけい 9.6)の すこし そと から 出す
  const origin = [GIRL_X + 11, FEET_Y - 42] as const
  return (
    <g opacity={fade} fill="none" stroke="#8bb6e8" strokeWidth="1.2" strokeLinecap="round">
      {[0, 0.35].map((offset) => {
        const p = (((t - TALK + offset) % 0.7) + 0.7) % 0.7 / 0.7
        const r = 3 + p * 7
        const c = Math.cos(rad(40)) * r
        const s = Math.sin(rad(40)) * r
        return <path key={offset} d={`M${origin[0] + c} ${origin[1] - s} A${r} ${r} 0 0 1 ${origin[0] + c} ${origin[1] + s}`} opacity={1 - p} />
      })}
    </g>
  )
}

/** 男の子の「ご!」。口から 左右へ 音が ひろがる。 */
function ShoutWaves({ t }: SceneProps) {
  const p0 = span(t, SHOUT, SHOUT + 1.1)
  if (p0 <= 0 || p0 >= 1) return null
  const lift = Math.abs(Math.sin((t - SHOUT) * Math.PI * 2 * 1.5)) * 1.6 * (1 - span(t, SHOUT + 0.8, SHOUT + 1.2))
  const mouth = [BOY_X, FEET_Y - 41.6 - lift] as const
  return (
    <g fill="none" stroke="#ff8a5c" strokeWidth="1.6" strokeLinecap="round">
      {[0, 1, 2].map((k) => {
        const p = Math.min(1, Math.max(0, p0 * 1.5 - k * 0.22))
        if (p <= 0 || p >= 1) return null
        const r = 7 + p * 14
        const c = Math.cos(rad(42)) * r
        const s = Math.sin(rad(42)) * r
        return (
          <g key={k} opacity={1 - p}>
            <path d={`M${mouth[0] - c} ${mouth[1] - s} A${r} ${r} 0 0 0 ${mouth[0] - c} ${mouth[1] + s}`} />
            <path d={`M${mouth[0] + c} ${mouth[1] - s} A${r} ${r} 0 0 1 ${mouth[0] + c} ${mouth[1] + s}`} />
          </g>
        )
      })}
    </g>
  )
}

/** 女の子が「つたえたい!」と うずうず している ときの しるし(びっくりマーク) */
function ExcitedMark({ t }: SceneProps) {
  const show = during(t, BOY_IN + 0.2, TALK, 0.2)
  if (show <= 0) return null
  const bob = Math.abs(Math.sin((t - BOY_IN) * Math.PI * 2 * 1.4)) * 2.2
  return (
    <g opacity={show} transform={`translate(0 ${-bob})`} fill="#f2b632">
      <rect x={GIRL_X - 1.2} y="19" width="2.4" height="9" rx="1.2" />
      <circle cx={GIRL_X} cy="32" r="1.5" />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 14)
  const girl = girlState(t)
  const boy = boyState(t)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} />
        <MeadowFlowers t={t} />
        <Butterfly t={t} />
        <Kid x={BOY_X} style={BOY_STYLE} state={boy} pop={span(t, BOY_IN, BOY_IN + 0.5, backOut)} pulse={wave(t, 0.2)} />
        <Kid x={GIRL_X} style={GIRL_STYLE} state={girl} pop={span(t, GIRL_IN, GIRL_IN + 0.5, backOut)} />
        <ExcitedMark t={t} />
        <SpeechBubble t={t} />
        <TalkWaves t={t} />
        <ShoutWaves t={t} />
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
    { at: 0, label: '野原に 女の子と 男の子が あらわれる', sound: 'pop' },
    { at: BOY_IN + 0.3, label: '女の子は 花を 見つけて つたえたくて うずうず' },
    { at: TALK, label: '男の子に ことばで はなす。花を 1つ・2つ…と かぞえる', sound: 'pop' },
    { at: RAISE, label: '男の子が 手を 上げて、ゆびを 1本ずつ 立てる' },
    { at: SHOUT, label: '「ご!」(五つ) つたわって 女の子は 大よろこび', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '語 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
