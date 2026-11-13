/*
 * 鳴(なく): あさ、おひさまで めをさました にわとりが、くちを おおきく あけて コケコッコー。
 *
 * ほね(画と絵の対応)
 *   1・2・3画目(口) … にわとりの くちから とびだした「こえ」の ふきだし(しかくい 口の かたち)
 *   4画目(ノ)      … あたまの上の とさか
 *   5画目(丨)      … にわとりの むね から くび の まえがわ
 *   6〜9画目        … あたま(めと くちばし)と、せなかの ライン
 *   10画目          … まるい おなか から 右の おしり
 *   11〜14画目      … あし(ゆびの さき)
 *
 * ながれ
 *   あさ やけ。にわとりは ねむっている → おひさまが のぼって まぶしい!めを さます
 *   → むねを ふくらませて いきを すいこみ、くびを うしろに そらす
 *   → くちを おおきく あけて コケコッコー!こえの ふきだしが ぽんと ひろがる
 *   → ほこらしげな かお。こえの ふきだし(口)と にわとり(鳥)の ほね が ひかって 字「鳴」になる
 *
 * にわとりは ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   むねを はって、くびは ながく。とさか・くちばし・にくぜん(あご の した の ひらひら)・
 *   せなかの 上へ そりかえる おび(おの はね)・やせた 2本あし。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '鳴'

const SUN = '#ffd24a'
const HILL = '#e2f2d2'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const DAWN = '#e6e0fa'
const BODY = '#ff9a5c'
const BODY_DARK = '#e2733f'
const HACKLE = '#f2b632'
const TAIL_A = '#3f9c9c'
const TAIL_B = '#2f7f8f'
const TAIL_C = '#e8534a'
const COMB = '#e8534a'
const BEAK = '#f2b632'
const BEAK_DARK = '#e09a1c'
const MOUTH = '#c4504a'
const TONGUE = '#ff8a8a'
const LEG = '#f2b632'
const EYE = '#2b2b2b'
const CHEEK = '#ff9d9d'
const BUBBLE = '#fff7cf'
const BUBBLE_SHADE = '#f4e29a'
const VOICE = '#f0a030'

/** くぎり の時間(秒) */
const SUNRISE = 0.3
const WAKE = 2.4
const BREATH = 3.0
const CROW = 3.9
const CROW_END = 5.8
const INK = 6.2
const DONE = 9.9
const DURATION = 10.4

/** くびの つけね(あたまを うしろに そらす じく)と、からだの まんなか */
const NECK: readonly [number, number] = [58, 44]
const TORSO: readonly [number, number] = [73, 63]
/** おびの はね の つけね */
const TAIL_ROOT: readonly [number, number] = [87, 60]
/** くちばしの つけね */
const HINGE: readonly [number, number] = [52, 32.4]

function Sky({ t }: SceneProps) {
  const sun = span(t, SUNRISE, WAKE - 0.1, easeOut)
  const dawn = 0.55 * (1 - span(t, SUNRISE, WAKE + 0.4))
  const cy = 90 - 72 * sun
  const cloud = t * 1.4
  return (
    <>
      <rect x="0" y="0" width="109" height="109" fill={DAWN} opacity={dawn} />
      <Layer rotate={t * 14} origin={[16, cy]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="15.2" y={cy - 11.4} width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 16 ${cy})`} />
        ))}
      </Layer>
      <circle cx="16" cy={cy} r="7" fill={SUN} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${cloud} 0)`}>
        <ellipse cx="82" cy="13" rx="7" ry="3.2" />
        <ellipse cx="87" cy="11.2" rx="5" ry="3.2" />
      </g>
      {/* とおくの おか(おひさまは ここから のぼる) */}
      <path d="M-4 99 Q18 78 44 91 Q72 70 113 93 V101 H-4 Z" fill={HILL} />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 40, 84, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** おびの はね。つけね から 上へ そりかえる。 */
function Tail({ wag }: { readonly wag: number }) {
  return (
    <Layer rotate={wag} origin={TAIL_ROOT}>
      {[
        { angle: 46, color: TAIL_C },
        { angle: 29, color: TAIL_B },
        { angle: 12, color: TAIL_A },
      ].map(({ angle, color }) => (
        <Layer key={angle} rotate={angle} origin={TAIL_ROOT}>
          <ellipse cx={TAIL_ROOT[0]} cy={TAIL_ROOT[1] - 12} rx="4.4" ry="13" fill={color} />
        </Layer>
      ))}
    </Layer>
  )
}

/** 2本の あし。じめんに 立つ(ゆびは 3本)。 */
function Legs() {
  return (
    <g fill="none" stroke={LEG} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M64 78 V94 M58 96 L64 94 L70 96 M64 94 V97" />
      <path d="M78 78 V94 M72 96 L78 94 L84 96 M78 94 V97" />
    </g>
  )
}

type Mood = 'asleep' | 'awake' | 'crow' | 'proud'

type HeadProps = {
  readonly mood: Mood
  /** あたまの かたむき(+ で くちばしが 上へ、- で 下へ) */
  readonly tilt: number
  /** くちばしを あける度合い 0〜1 */
  readonly open: number
  readonly wobble: number
}

/** あたま: とさか・くちばし・にくぜん・め。くび の つけね を じく に かたむく。 */
function Head({ mood, tilt, open, wobble }: HeadProps) {
  const upper = [44.5, 31.6 - 3.4 * open] as const
  const lower = [45, 32.8 + 4.2 * open] as const
  return (
    <Layer rotate={tilt} origin={NECK}>
      {/* にくぜん(あご の した の ひらひら) */}
      <ellipse cx="52.4" cy={38.4 + open * 1.2} rx="2" ry={3.2 + wobble * 0.5} fill={COMB} />
      {/* とさか */}
      <circle cx="57" cy="17" r="4" fill={COMB} />
      <circle cx="62" cy="14" r="4.2" fill={COMB} />
      <circle cx="66.6" cy="16.6" r="3.6" fill={COMB} />
      <circle cx="60" cy="30" r="9.8" fill={BODY} />
      {/* くちの なか と くちばし */}
      <path d={`M${HINGE[0]} 32.2 L${upper[0]} ${upper[1]} L${lower[0]} ${lower[1]} L${HINGE[0]} 32.8 Z`} fill={MOUTH} />
      {open > 0.25 && <ellipse cx="49.4" cy={34.4 + open * 1.2} rx="2.6" ry={0.9 + open * 0.8} fill={TONGUE} />}
      <path d={`M${HINGE[0] + 1} 28.6 L${upper[0]} ${upper[1]} L${HINGE[0]} 32.2 Z`} fill={BEAK} />
      <path d={`M${HINGE[0]} 32.8 L${lower[0]} ${lower[1]} L${HINGE[0] + 1} 36.2 Z`} fill={BEAK_DARK} />
      <circle cx="56" cy="33.4" r="2.1" fill={CHEEK} opacity="0.6" />
      {mood === 'asleep' && <path d="M54.6 27.6 Q56.4 29.6 58.2 27.6" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />}
      {mood === 'crow' && <path d="M54.6 28.6 Q56.4 25.8 58.2 28.6" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />}
      {(mood === 'awake' || mood === 'proud') && (
        <>
          <circle cx="56.4" cy="27.6" r={mood === 'awake' ? 1.9 : 1.5} fill={EYE} />
          <circle cx="56.9" cy="27" r="0.55" fill="#ffffff" />
        </>
      )}
    </Layer>
  )
}

/** にわとり本体。うしろ(おび)→あし→からだ→くび→あたま の じゅん。 */
function Rooster({ mood, tilt, open, puff, wag, wobble }: HeadProps & { readonly puff: number; readonly wag: number }) {
  return (
    <>
      <Tail wag={wag} />
      <Legs />
      <Layer scale={1 + puff * 0.07} origin={TORSO}>
        <ellipse cx={TORSO[0]} cy={TORSO[1]} rx="23" ry="18" fill={BODY} />
        {/* むねの かげ と はね */}
        <ellipse cx="76" cy="66" rx="13" ry="8.4" fill={BODY_DARK} transform="rotate(18 76 66)" />
      </Layer>
      {/* くび: ながく、あたま まで つなぐ。きんいろの くびの はね */}
      <rect x="52.4" y="30" width="13" height="19" rx="6" fill={BODY} />
      <path d="M52.6 40 Q58.6 52 67 44 L66 38 L52.8 36 Z" fill={HACKLE} />
      <Head mood={mood} tilt={tilt} open={open} wobble={wobble} />
    </>
  )
}

/** こえの ふきだし(口の かたち)。くちばしの さきから ぽんと ひろがる。 */
function Voice({ t }: SceneProps) {
  const pop = span(t, CROW + 0.1, CROW + 0.7, backOut)
  if (pop <= 0) return null
  const beat = 1 + 0.04 * wave(t, 0.5) * span(t, CROW + 0.7, CROW + 1.0)
  return (
    <Layer scale={pop * beat} origin={[41, 36]}>
      <path d="M35 41 L35 49 L43.5 35 Z" fill={BUBBLE_SHADE} />
      <rect x="14" y="38.4" width="23" height="21" rx="4.6" fill={BUBBLE_SHADE} />
      <path d="M35 40 L35 48 L43.5 34 Z" fill={BUBBLE} />
      <rect x="14" y="37" width="23" height="21" rx="4.6" fill={BUBBLE} />
      {[42.2, 47.4, 52.6].map((y, i) => (
        <path key={y} d={`M18.4 ${y} q2.3 -2.6 4.6 0 t4.6 0 t4.6 0`} fill="none" stroke={VOICE} strokeWidth="1.6" strokeLinecap="round" transform={`translate(${wave(t, 0.4, i * 0.13) * 0.8} 0)`} />
      ))}
    </Layer>
  )
}

/** ねむっている間の「z」。 */
function Snore({ t }: SceneProps) {
  const show = during(t, 0.2, WAKE, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show} fill="#5f7fd6" fontWeight="700" fontFamily="inherit">
      {[0, 0.7].map((offset, i) => {
        const p = ((t + offset) % 1.4) / 1.4
        return (
          <text key={offset} x={44 - p * 8} y={22 - p * 8} fontSize={4.2 + i * 1.4 + p * 2} opacity={Math.sin(p * Math.PI)}>
            z
          </text>
        )
      })}
    </g>
  )
}

/** めを さました しゅんかんの びっくり せん。 */
function Startle({ t }: SceneProps) {
  const show = during(t, WAKE - 0.05, WAKE + 0.5, 0.15)
  if (show <= 0) return null
  return (
    <g opacity={show} stroke="#f0a030" strokeWidth="1.3" strokeLinecap="round">
      <path d="M50 12 l-3 -3.4" />
      <path d="M56 8.6 l-0.6 -4" />
      <path d="M43.6 19 l-4 -1.2" />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 14)

  const sleep = 1 - span(t, WAKE - 0.2, WAKE + 0.3)
  const mood: Mood = t < WAKE ? 'asleep' : t < CROW ? 'awake' : t < CROW_END + 0.2 ? 'crow' : 'proud'
  // あたま: ねむると 下へ うなだれ、いきを すうと うしろへ そり、おわると もどる
  const crowShake = t >= CROW && t < CROW_END ? wave(t, 0.2) * 1.1 : 0
  const tilt = -16 * sleep + 12 * span(t, BREATH, CROW - 0.1, easeOut) - 9 * span(t, CROW_END, CROW_END + 0.5, easeInOut) + crowShake
  const open = span(t, CROW, CROW + 0.25) * (1 - span(t, CROW_END - 0.1, CROW_END + 0.2)) * (0.82 + 0.18 * Math.abs(wave(t, 0.5)))
  // むねの ふくらみ: ねむっている間は ゆっくり、いきを すうと ふくらむ
  const puff = t < WAKE ? 0.15 * wave(t, 1.6) : span(t, BREATH, CROW - 0.1, easeOut) * (1 - span(t, CROW_END, CROW_END + 0.6))
  const hop = Math.sin(span(t, WAKE, WAKE + 0.4) * Math.PI) * 3
  const wag = t >= CROW && t < CROW_END ? wave(t, 0.35) * 2.5 : 0
  const wobble = t >= CROW && t < CROW_END ? wave(t, 0.25) : 0

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <ellipse cx="72" cy="97.4" rx="26" ry="2.4" fill="#000000" opacity="0.1" />
        <Layer y={-hop}>
          <Rooster mood={mood} tilt={tilt} open={open} puff={puff} wag={wag} wobble={wobble} />
        </Layer>
        <Voice t={t} />
        <Snore t={t} />
        <Startle t={t} />
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
    { at: 0, label: 'あさやけ。にわとりは ねむっている', sound: 'pop' },
    { at: SUNRISE, label: 'おひさまが のぼる' },
    { at: WAKE, label: 'まぶしくて めを さます', sound: 'pop' },
    { at: BREATH, label: 'むねを ふくらませて いきを すう' },
    { at: CROW, label: 'くちを あけて コケコッコー!', sound: 'stroke' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '鳴 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
