/*
 * 鳥(とり): さむくて ふるえていた 小鳥が、お日さまで あたたまって、
 *           くちばし・はね・あし を ぜんぶ つかって よろこぶ。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)   … あたまの てっぺんの ぴょこんと はねた かんむり(とさか)
 *   2画目(丨)   … くちばしの うしろから おなかへ おりる 胸の ライン
 *   3〜5画目    … あたま(目の まわりの まるい ところ)
 *   6画目(一)   … はね の つけね
 *   7画目       … まるい 体 と、右に のびた 尾
 *   8〜11画目   … あし と ゆびさき の ちょん ちょん
 *   (絵は 小鳥の ほんものの かたち。字と 少しずれても ゆがめない。だいたい同じ場所・向きで そろえる)
 *
 * ながれ
 *   小鳥が ぽんと あらわれる。さむくて ふるえて、はく息が 白い(くもり空)
 *   → お日さまが のぼって 雲が はれる。小鳥は 空を 見あげて ぱっと 目を ひらく
 *   → あたたかくて うれしい。くちばしを ひらいて ぴぴぴ と うたう
 *   → はね を ばたばた ひろげる
 *   → ぴょんと とびはねて、あし で ぽん と 着地
 *   → ほね が ひかって、くちばし・はね・あし の 小鳥の 形が 字「鳥」になる
 *
 * 小鳥は、ほんものの つくり を守る:
 *   はね は せなか(かた)から 出る。くちばしは あたまの 前。あし は おなかの 下から 2本。
 *   くび は みじかい。尾は うしろ(右)へ。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '鳥'

const SUN = '#ffd24a'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const HILL = '#e2f2d2'
const BODY = '#f0a85a'
const BODY_DARK = '#d9823b'
const BELLY = '#fff0cf'
const BEAK = '#f2b632'
const BEAK_DARK = '#c9831e'
const LEG = '#e2733f'
const EYE = '#2b2b2b'
const CHEEK = '#ff9d9d'
const NOTE = '#f07f9e'
const SKY_DIM = '#b9c6d8'

/** くぎり の時間(秒) */
const SUN_UP = 1.5
const WARM = 2.9
const SING = 3.3
const FLAP = 4.8
const HOP = 6.0
const INK = 7.0
const DONE = 10.0
const DURATION = 10.6

/** 小鳥の 足もと(ぽん と出る・とびはねる ときの じく) と、はね の つけね(かた) */
const FEET: readonly [number, number] = [58, 96]
const SHOULDER: readonly [number, number] = [62, 58]
/** くちばしの つけね(あごの 先) */
const BEAK_ROOT: readonly [number, number] = [36, 40.5]

type Mood = 'cold' | 'wonder' | 'happy'

function Ground({ t }: SceneProps) {
  const flowers = span(t, WARM, WARM + 0.7, backOut)
  return (
    <>
      <path d="M-4 99 Q18 78 44 90 Q72 72 113 93 V101 H-4 Z" fill={HILL} />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 22, 84, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
      {/* お日さまで あたたまると 花が ぽんぽん と さく */}
      {[
        [13, 95],
        [92, 95.5],
        [101, 93.5],
      ].map(([x, y], i) => (
        <Layer key={x} scale={Math.max(0, flowers)} origin={[x, y]}>
          <path d={`M${x} ${y} v-5`} stroke={LEAF} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx={x} cy={y - 6.2} r="2.4" fill={i === 1 ? '#8f9cec' : '#ff9ac0'} />
          <circle cx={x} cy={y - 6.2} r="1" fill={SUN} />
        </Layer>
      ))}
    </>
  )
}

/** そら: はじめは くもり。お日さまが のぼると はれる。 */
function Sky({ t }: SceneProps) {
  const clear = span(t, SUN_UP, WARM, easeInOut)
  const rise = span(t, SUN_UP - 0.3, WARM, easeOut)
  const sunY = 40 - rise * 25
  return (
    <>
      <rect x="0" y="0" width="109" height="109" fill={SKY_DIM} opacity={0.55 * (1 - clear)} />
      <Layer opacity={rise} rotate={t * 14} origin={[90, sunY]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="89.2" y={sunY - 11.4} width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 90 ${sunY})`} />
        ))}
      </Layer>
      <circle cx="90" cy={sunY} r={6.4 * rise} fill={SUN} />
      {/* くもは お日さまが のぼると、左右へ はなれていく */}
      <g fill="#ffffff" opacity={0.95 - 0.5 * clear} transform={`translate(${-clear * 22} 0)`}>
        <ellipse cx="22" cy="14" rx="11" ry="4.6" />
        <ellipse cx="30" cy="11.5" rx="7" ry="4.2" />
      </g>
      <g fill="#ffffff" opacity={0.95 - 0.5 * clear} transform={`translate(${clear * 20} 0)`}>
        <ellipse cx="66" cy="20" rx="10" ry="4.2" />
        <ellipse cx="72" cy="17.6" rx="6.4" ry="3.8" />
      </g>
    </>
  )
}

type BirdProps = {
  readonly mood: Mood
  /** くちばしの ひらき(0〜1) */
  readonly open: number
  /** はね の 角度(0 = たたむ / マイナス = 上へ ひろげる) */
  readonly wing: number
  /** ふるえ(よこの ずれ) */
  readonly shiver: number
  /** ふくらみ(さむいと 羽を ふくらます) */
  readonly puff: number
  readonly headTilt: number
}

/** はね: かた から 出て、うしろ(右)へ たれる。wing で かたを じくに 上へ ひらく。 */
function Wing({ wing, color }: { readonly wing: number; readonly color: string }) {
  return (
    <Layer rotate={wing} origin={SHOULDER} scale={1 + Math.min(0, wing) * -0.004}>
      <path d="M62 58 Q82 58 86 82 Q74 88 60 72 Z" fill={color} />
      <path d="M76 70 Q81 74 82 80 M70 68 Q76 74 76 82" fill="none" stroke={BODY} strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />
    </Layer>
  )
}

function Eye({ mood }: { readonly mood: Mood }) {
  if (mood === 'cold') {
    return (
      <>
        <path d="M40.5 33 l5 1.6" stroke={BODY_DARK} strokeWidth="1.3" strokeLinecap="round" />
        <path d="M41 36.6 Q43 35.2 45 36.6" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
      </>
    )
  }
  if (mood === 'wonder') {
    return (
      <>
        <circle cx="43" cy="35.6" r="2.7" fill="#ffffff" />
        <circle cx="42.6" cy="35.8" r="1.9" fill={EYE} />
        <circle cx="42" cy="35" r="0.65" fill="#ffffff" />
      </>
    )
  }
  return <path d="M40.6 36.8 Q43 33.6 45.4 36.8" fill="none" stroke={EYE} strokeWidth="1.4" strokeLinecap="round" />
}

function Bird({ mood, open, wing, shiver, puff, headTilt }: BirdProps) {
  return (
    <g transform={`translate(${shiver} 0)`}>
      {/* むこうがわの はね と 尾 */}
      <Wing wing={wing * 0.8} color={BODY_DARK} />
      <path d="M76 74 Q96 78 101 93 Q86 92 74 84 Z" fill={BODY_DARK} />
      <path d="M78 79 Q90 82 95 90" fill="none" stroke={BODY} strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      {/* あし: おなかの 下から 2本。ゆびは 3本 */}
      {[52, 64].map((x) => (
        <g key={x} stroke={LEG} strokeWidth="2.1" strokeLinecap="round" fill="none">
          <path d={`M${x} 86 V95.4`} />
          <path d={`M${x} 95.6 l-4.4 0.4 M${x} 95.6 l3.6 0.8 M${x} 95.6 l-1.8 1.4`} strokeWidth="1.5" />
        </g>
      ))}
      {/* どう: 小さな 卵のような まるい 体。さむいと ふくらむ */}
      <Layer scale={1 + puff * 0.07} origin={[58, 92]}>
        <ellipse cx="58" cy="72" rx="26" ry="22" fill={BODY} />
        <ellipse cx="46" cy="77" rx="14" ry="15" fill={BELLY} />
        <path d="M60 52 Q76 54 82 66" fill="none" stroke={BODY_DARK} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      </Layer>
      {/* てまえの はね: かた から */}
      <Wing wing={wing} color={BODY_DARK} />
      {/* あたま: くびは みじかく、どう の すぐ上 */}
      <Layer rotate={headTilt} origin={[50, 46]} y={puff * 1.6}>
        <circle cx="48" cy="37" r="12.4" fill={BODY} />
        <path d="M46 25.6 Q43 18.6 40 17.6 M49 25 Q48 18 45.4 15.6 M52 26 Q53 20.6 51 17.6" fill="none" stroke={BODY_DARK} strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="41.4" cy="41.4" rx="2.7" ry="1.9" fill={CHEEK} opacity="0.6" />
        <Eye mood={mood} />
        {/* くちばし: うえは そのまま、したが ひらく */}
        <Layer rotate={-open * 24} origin={BEAK_ROOT}>
          <path d="M36.4 35.4 L26 38.8 L36.4 40.4 Z" fill={BEAK} />
        </Layer>
        {open > 0.05 ? <path d="M36.4 40.4 L28.6 41.2 L36.4 44.6 Z" fill="#b9483f" /> : null}
        <Layer rotate={open * 30} origin={BEAK_ROOT}>
          <path d="M36.4 40.6 L28 41.6 L36.4 43.8 Z" fill={BEAK_DARK} />
        </Layer>
      </Layer>
    </g>
  )
}

/** さむいときの はく息(白い もや)。くちばしから 左へ。 */
function Breath({ t }: SceneProps) {
  const show = during(t, 0.9, WARM - 0.3, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.55].map((offset) => {
        const p = ((t + offset) % 1.1) / 1.1
        return <ellipse key={offset} cx={26 - p * 9} cy={38 - p * 6} rx={1.8 + p * 3} ry={1.2 + p * 1.8} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" opacity={1 - p} />
      })}
    </g>
  )
}

/** さむくて ぶるぶる(体の まわりの ふるえ線) */
function ShiverLines({ t }: SceneProps) {
  const show = during(t, 0.8, WARM - 0.2, 0.2)
  if (show <= 0) return null
  const flick = wave(t, 0.14) > 0 ? 1 : 0.4
  return (
    <g opacity={show * flick} stroke="#6f86b6" strokeWidth="1" strokeLinecap="round" fill="none">
      <path d="M28 56 q-3 2 0 4 q3 2 0 4" />
      <path d="M88 52 q3 2 0 4 q-3 2 0 4" />
    </g>
  )
}

/** うたう「ぴぴぴ」の おんぷ。くちばしから 左うえへ。 */
function Notes({ t }: SceneProps) {
  const show = during(t, SING + 0.15, FLAP + 0.4, 0.25)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.6, 1.2].map((offset) => {
        const p = ((t - SING + offset) % 1.8) / 1.8
        const x = 22 - p * 12
        const y = 30 - p * 16
        return (
          <g key={offset} opacity={Math.sin(p * Math.PI)} fill={NOTE} stroke={NOTE}>
            <path d={`M${x + 2.2} ${y} v-5 l2.6 -0.9 v4.4`} fill="none" strokeWidth="0.9" />
            <ellipse cx={x} cy={y} rx="1.9" ry="1.3" stroke="none" />
          </g>
        )
      })}
    </g>
  )
}

/** 「ここを 見てね」の わっか。くちばし・はね・あし が 大きくなる しゅんかんに 出す。 */
function Ping({ t, at, cx, cy }: SceneProps & { readonly at: number; readonly cx: number; readonly cy: number }) {
  const p = span(t, at, at + 0.7, easeOut)
  if (p <= 0 || p >= 1) return null
  return <circle cx={cx} cy={cy} r={Math.max(0, 3 + p * 8)} fill="none" stroke="#ffd24a" strokeWidth="1.4" opacity={1 - p} />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 11)

  // ぽん と出る(足もとから ふくらむ)
  const pop = span(t, 0, 0.7, backOut)
  const cold = t < WARM
  const mood: Mood = t < SUN_UP + 0.6 ? 'cold' : t < SING - 0.2 ? 'wonder' : 'happy'
  // ふるえ(さむい間だけ)。あたたまると おさまる
  const shiver = cold ? wave(t, 0.1) * 0.7 * (1 - span(t, SUN_UP, WARM)) : 0
  const puff = (1 - span(t, SUN_UP, WARM, easeInOut)) * span(t, 0.4, 0.9)
  // うたう: くちばしを ぱくぱく
  const singing = during(t, SING, FLAP + 0.2, 0.15)
  const open = singing > 0 ? (0.5 + 0.5 * Math.abs(wave(t, 0.5))) * singing : 0
  // はね: ばたばた(ひろげて はばたく)。字になる前に たたむ
  const flapping = during(t, FLAP, INK - 0.25, 0.3)
  const wing = flapping > 0 ? (-34 + wave(t, 0.26) * 20) * flapping : 0
  // とびはねる
  const hopP = span(t, HOP, HOP + 0.7)
  const hop = Math.sin(hopP * Math.PI) * 9
  // あたまの むき: お日さまを 見あげる → うたう → まえ
  const headTilt = mix(t, SUN_UP, SUN_UP + 0.4, 0, -8) * (1 - span(t, WARM, WARM + 0.4)) + (singing > 0 ? -3 * singing : 0)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Ground t={t} />
        <ellipse cx="58" cy="97.6" rx={20 * pop * (1 - hop * 0.04)} ry="2.4" fill="#000000" opacity="0.12" />
        <Layer opacity={span(t, 0, 0.2)} scale={pop} origin={FEET} y={-hop}>
          <Bird mood={mood} open={open} wing={wing} shiver={shiver} puff={puff} headTilt={headTilt} />
        </Layer>
        <Layer y={-hop}>
          <Breath t={t} />
          <ShiverLines t={t} />
          <Notes t={t} />
        </Layer>
        <Ping t={t} at={SING + 0.1} cx={30} cy={39} />
        <Ping t={t} at={FLAP + 0.1} cx={76} cy={68} />
        <Ping t={t} at={HOP + 0.65} cx={58} cy={96} />
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
    { at: 0, label: '小鳥が ぽんと あらわれる。さむくて ぶるぶる', sound: 'pop' },
    { at: SUN_UP, label: 'お日さまが のぼる。小鳥は 空を 見あげる' },
    { at: SING, label: 'あたたかい。くちばしを ひらいて ぴぴぴ', sound: 'pop' },
    { at: FLAP, label: 'はね を ばたばた ひろげる' },
    { at: HOP, label: 'ぴょんと とびはねて、あし で ぽん', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '鳥 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
