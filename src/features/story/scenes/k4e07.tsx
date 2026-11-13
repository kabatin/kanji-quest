/*
 * 万(まん): サソリの え。おとが おなじだから、かずの「万」に かりた。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 岩のやねに なる、よこに ながい たいらな 岩
 *   2画目(㇀)  … サソリの しっぽ。せなかから 高く たちあがって、さきの はり(どく)が 前(左)を むく
 *                  (はり の さき が 書きはじめ。しっぽの ねもと は 体の中)
 *   3画目(ノ)  … やねを ささえる ななめの 岩(上は やねの 岩、下は 地面)
 *
 * ながれ
 *   岩の いえが できる(やね → ななめの 岩)
 *   → つかれた おかあさんサソリが、せなかに 赤ちゃんを のせて あるいてくる
 *   → 岩の かげに ついて ほっと する → 赤ちゃんが ぴょんぴょん おりて、たくさん ならぶ
 *   → おかあさんは うれしくて しっぽを たてて ゆらす(ハートが ふわり)
 *   → ほね が ひかって、絵が うすくなり、字「万」が のこる
 *
 * サソリは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   足は 4ほん(よこから 見ると 下へ のびる)、まえに 大きな はさみ、しっぽは せなかから 上へ まがって さきに はり。
 *   おかあさんサソリは 赤ちゃんを せなかに のせて はこぶ(ほんとうに そうする)。
 */
import { backOut, during, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '万'

const SUN = '#ffd24a'
const HILL = '#fbefd0'
const SAND = '#f2deb0'
const SAND_DARK = '#e3c98f'
const ROCK = '#a79b92'
const ROCK_DARK = '#85796f'
const ROCK_LIGHT = '#c4baaf'
const SCORP = '#d9824a'
const SCORP_DARK = '#b8642f'
const SCORP_LIGHT = '#f0a26a'
const STING = '#8a3d22'
const BABY = '#f0a26a'
const BABY_DARK = '#d9824a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const HEART = '#f07f9e'

/** くぎり の時間(秒) */
const WALK = 0.9
const STOP = 2.5
/** 赤ちゃんが 1ぴきずつ おりはじめる */
const HOP = 3.4
const HOP_GAP = 0.32
const HOP_TIME = 0.55
const GLAD = 4.9
const INK = 6.4
const DONE = 9.4
const DURATION = 10

/** サソリの 体(ねもと): 地面に ついた 足の高さ と、しっぽの ねもと */
const TAIL_ROOT: readonly [number, number] = [63, 90]
/** しっぽを たらした ときの かたむき(ねもと を じく に、うしろ=右へ) */
const TAIL_DOWN = 55

/** 赤ちゃんが せなかに のっている 場所 と、おりて ならぶ 場所 */
const BABY_BACK_X = [44, 48.5, 53, 57.5] as const
const BABY_BACK_Y = 77.4
const BABY_LAND_X = [72, 80, 88, 96] as const
const BABY_GROUND_Y = 92.6

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[10, 8]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="9.2" y="0.6" width="1.6" height="3.4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 10 8)`} />
        ))}
      </Layer>
      <circle cx="10" cy="8" r={4.6 * sun} fill={SUN} />
      <path d="M-4 99 Q20 76 48 90 Q78 70 113 92 V101 H-4 Z" fill={HILL} />
      <ellipse cx="54.5" cy="98" rx="52" ry="5.8" fill={SAND} />
      {[6, 40, 63, 104].map((x) => (
        <ellipse key={x} cx={x} cy="98.6" rx="2.6" ry="1" fill={SAND_DARK} />
      ))}
    </>
  )
}

/** 岩の いえ: やね(1画目)と、ななめに ささえる 岩(3画目)。どちらも 本物の 岩の かたち。 */
function RockHouse({ t }: SceneProps) {
  const roof = span(t, 0.15, 0.7, backOut)
  const prop = span(t, 0.4, 0.95, easeOut)
  return (
    <>
      <Layer scaleX={roof} origin={[55, 22]}>
        <Bone char={CHAR} n={1} color={ROCK_DARK} width={9.4} />
        <Layer y={-1.1}>
          <Bone char={CHAR} n={1} color={ROCK} width={6.8} />
        </Layer>
        <Layer y={-2.4}>
          <Bone char={CHAR} n={1} color={ROCK_LIGHT} width={2} from={0.08} to={0.5} />
        </Layer>
      </Layer>
      <Bone char={CHAR} n={3} color={ROCK_DARK} width={8} from={1 - prop} />
      <Layer x={-0.7}>
        <Bone char={CHAR} n={3} color={ROCK} width={5.4} from={1 - prop} />
      </Layer>
    </>
  )
}

type Mood = 'tired' | 'glad'

type MotherProps = {
  readonly stride: number
  readonly mood: Mood
  readonly tailAngle: number
  readonly pincer: number
}

/** 足 4ほん: 体の したから 外へ ひらいて、下へ おりる(ひざ で まがる) */
function Legs({ stride }: { readonly stride: number }) {
  const spread = [-4, -1.6, 1.6, 4] as const
  return (
    <g fill="none" stroke={SCORP_DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {spread.map((dx, i) => {
        const x0 = 43 + i * 5.4
        const swing = stride * 3 * (i % 2 === 0 ? 1 : -1)
        return <path key={i} d={`M${x0} 90.5 L${x0 + dx * 0.8} 93.6 L${x0 + dx * 1.2 + swing} 97`} />
      })}
    </g>
  )
}

/** はさみ: かた(体の まえ)から うで、さきに ひらく はさみ。pincer 0 = とじる / 1 = ひらく */
function Claw({ pincer, color }: { readonly pincer: number; readonly color: string }) {
  return (
    <>
      <path d="M36.5 86 L32.6 85" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="29.8" cy={83.4 - pincer * 0.9} rx="3" ry="1.5" fill={color} transform={`rotate(${-18 - pincer * 18} 29.8 83.4)`} />
      <ellipse cx="29.8" cy={85.4 + pincer * 0.9} rx="2.8" ry="1.4" fill={color} transform={`rotate(${12 + pincer * 14} 29.8 85.4)`} />
    </>
  )
}

/** しっぽ: ねもと を じく に 立ちあがる。さきに はり(どく)。2画目の線 */
function Tail({ angle }: { readonly angle: number }) {
  return (
    <Layer rotate={angle} origin={TAIL_ROOT}>
      <Bone char={CHAR} n={2} color={SCORP_DARK} width={7} />
      <Layer x={-0.5} y={-0.5}>
        <Bone char={CHAR} n={2} color={SCORP} width={4.6} />
      </Layer>
      {/* はり: しっぽの さきの ふくらみ と、まえ(左)した へ むいた とげ */}
      <ellipse cx="52" cy="42.8" rx="4.4" ry="3.9" fill={SCORP_DARK} />
      <path d="M49.2 44 Q46.6 48 44.2 49 Q47.2 45.4 49.6 42.6 Z" fill={STING} />
    </Layer>
  )
}

function Mother({ stride, mood, tailAngle, pincer }: MotherProps) {
  const happy = mood === 'glad'
  return (
    <>
      <Legs stride={stride} />
      <Tail angle={tailAngle} />
      {/* 体: したに こい色の おび、その上に 明るい 色の面 */}
      <ellipse cx="53" cy="88" rx="15" ry="6.2" fill={SCORP_DARK} />
      <circle cx="40.5" cy="86.4" r="6.2" fill={SCORP_DARK} />
      <ellipse cx="53" cy="86.2" rx="15" ry="6.2" fill={SCORP} />
      <circle cx="40.5" cy="84.8" r="6.2" fill={SCORP} />
      <ellipse cx="56" cy="82.6" rx="9" ry="1.8" fill={SCORP_LIGHT} />
      <path d="M48 81.5 v7.5 M53 81 v8.5 M58 81.5 v7.5" stroke={SCORP_DARK} strokeWidth="1.1" strokeLinecap="round" />
      <Claw pincer={pincer} color={SCORP_DARK} />
      <Claw pincer={pincer} color={SCORP_LIGHT} />
      {/* かお */}
      <circle cx="41.4" cy="87.8" r="1.9" fill={CHEEK} opacity="0.6" />
      {happy ? (
        <>
          <path d="M37.4 84 Q39 82 40.6 84" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M36.6 87.4 Q38.4 89.8 40.4 87.8" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M36.8 82 l3.8 1.3" stroke={SCORP_DARK} strokeWidth="1" strokeLinecap="round" />
          <circle cx="38.8" cy="84.4" r="1.2" fill={EYE} />
          <ellipse cx="37.2" cy="88" rx="1.1" ry="1.4" fill={MOUTH} />
        </>
      )}
    </>
  )
}

/** 赤ちゃん(まんなか が 0,0。左むき)。おかあさんと おなじ つくりを 小さく。 */
function Baby({ glad }: { readonly glad: boolean }) {
  return (
    <>
      <path d="M-1 2.2 l-1 2.2 M1.2 2.2 l0 2.4 M3 2 l1 2.2" stroke={BABY_DARK} strokeWidth="0.9" strokeLinecap="round" />
      <path d="M2.8 -0.6 Q6.4 -1 5.6 -4.6 Q5 -6.6 3 -5.8" fill="none" stroke={BABY_DARK} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="2.8" cy="-5.6" r="0.9" fill={STING} />
      <ellipse cx="0.4" cy="0" rx="3.7" ry="2.2" fill={BABY_DARK} />
      <ellipse cx="0.4" cy="-0.5" rx="3.7" ry="2.2" fill={BABY} />
      <circle cx="-3" cy="-0.6" r="1.8" fill={BABY} />
      <ellipse cx="-5.6" cy="-1.4" rx="1.5" ry="0.9" fill={BABY_DARK} />
      {glad ? (
        <path d="M-4.2 -1.4 Q-3.5 -2.4 -2.8 -1.4" fill="none" stroke={EYE} strokeWidth="0.6" strokeLinecap="round" />
      ) : (
        <circle cx="-3.6" cy="-1.2" r="0.6" fill={EYE} />
      )}
    </>
  )
}

/** 赤ちゃんたち: せなか に のって いて、1ぴきずつ ぴょん と おりて ならぶ。 */
function Babies({ t, motherX, motherY }: SceneProps & { readonly motherX: number; readonly motherY: number }) {
  return (
    <>
      {BABY_BACK_X.map((bx, i) => {
        const start = HOP + i * HOP_GAP
        const p = span(t, start, start + HOP_TIME)
        const landed = p >= 1
        const x = landed ? BABY_LAND_X[i] : mix(t, start, start + HOP_TIME, bx + motherX, BABY_LAND_X[i], (u) => u)
        const arc = Math.sin(p * Math.PI) * 15
        // おりてからは うれしくて ちいさく はねる
        const bounce = landed && t > GLAD ? Math.abs(wave(t, 0.8, i * 0.2)) * 1.8 : 0
        const y = landed ? BABY_GROUND_Y - bounce : mix(t, start, start + HOP_TIME, BABY_BACK_Y + motherY, BABY_GROUND_Y, (u) => u) - arc
        return (
          <Layer key={bx} x={x} y={y}>
            <Layer scale={1.15}>
              <Baby glad={landed && t > GLAD} />
            </Layer>
          </Layer>
        )
      })}
    </>
  )
}

/** あるいている間の あせ。体の うしろへ とぶ。 */
function Sweat({ t }: SceneProps) {
  const show = during(t, WALK + 0.2, STOP, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.45].map((offset) => {
        const p = ((t + offset) % 0.9) / 0.9
        return <path key={offset} d="M0 -2.2 Q1.9 0.6 0 1.9 Q-1.9 0.6 0 -2.2 Z" fill="#7cc4f2" transform={`translate(${33 - p * 3} ${76 + p * 5}) rotate(-20)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** うれしい ハートが あたまの上へ ふわり。 */
function Hearts({ t }: SceneProps) {
  const show = during(t, GLAD, INK + 0.2, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show} fill={HEART}>
      {[0, 0.7].map((offset) => {
        const p = ((t - GLAD + offset) % 1.4) / 1.4
        return <path key={offset} d="M0 1.8 C-3.2 -0.8 -2 -3.6 0 -2 C2 -3.6 3.2 -0.8 0 1.8 Z" transform={`translate(${37 - p * 4 + Math.sin(p * 6) * 1.2} ${76 - p * 12}) scale(${0.8 + p * 0.5})`} opacity={Math.sin(p * Math.PI)} />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 3)

  // あるく: 右から 岩の かげへ。足を ふって 体が 上下する
  const walking = 1 - span(t, STOP - 0.25, STOP)
  const stride = t < WALK ? 0 : Math.sin((t - WALK) * Math.PI * 2 * 1.9) * walking
  const walkX = mix(t, WALK, STOP, 80, 0, easeOut)
  const bob = -Math.abs(stride) * 0.9

  // ほっとして、しっぽを たてる(ほんの 少し 行きすぎて もどる)。さいごは ぴったり 0 に もどす
  const lift = span(t, STOP - 0.1, STOP + 0.8, backOut)
  const wag = wave(t, 0.7) * 4 * span(t, GLAD, GLAD + 0.4) * (1 - span(t, INK - 0.9, INK - 0.1))
  const tailAngle = TAIL_DOWN * (1 - lift) + wag
  const mood: Mood = t < HOP ? 'tired' : 'glad'
  // はさみ: うれしいと ひらく
  const pincer = mix(t, GLAD - 0.3, GLAD + 0.3, 0, 1) * (1 - span(t, INK - 0.9, INK - 0.1))

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <RockHouse t={t} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <ellipse cx={51 + walkX} cy="97.4" rx="17" ry="2.2" fill="#000000" opacity="0.1" />
          <Layer x={walkX} y={bob}>
            <Mother stride={stride} mood={mood} tailAngle={tailAngle} pincer={pincer} />
            <Sweat t={t} />
          </Layer>
          <Babies t={t} motherX={walkX} motherY={bob} />
          <Hearts t={t} />
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
    { at: 0, label: '岩の いえが できる', sound: 'pop' },
    { at: WALK, label: 'つかれた サソリが 赤ちゃんを のせて あるいてくる' },
    { at: STOP, label: '岩の かげに ついて ほっと する', sound: 'pop' },
    { at: HOP, label: '赤ちゃんが ぴょんぴょん おりる' },
    { at: GLAD, label: 'たくさんの 子に かこまれて うれしい' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: 'サソリの え が かずの 万 に かりられた', sound: 'ok' },
  ],
  Scene,
}

export default scene
