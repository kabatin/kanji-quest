/*
 * 千(せん): 人に よこぼうを 1本 たして、千。とても 大きな かず。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … こどもの かみの リボンの 長い おび。風に ふかれて 左へ なびく
 *   2画目(一)  … こどもが 両手で もちあげた 長い たけ(よこぼう)。ちょうちんが たくさん さがる
 *   3画目(丨)  … こどもの からだ(どう と あし)。まんなかを とおる
 *
 * ながれ
 *   こどもが 立っている → 切りかぶの上に 長い たけが ある のを 見つけて「おや?」
 *   → 両手で よいしょ と もちあげる(ちからいっぱい)
 *   → もちあげた! うれしい。風が ふいて リボンが なびく
 *   → たけに ちょうちんが ぽん ぽん ぽん と たくさん さがる(とても 大きな かず)
 *   → ほね が ひかって、絵が うすくなり、字「千」が のこる
 *
 * 人は ほんものの つくり を守る(字に合わせて ゆがめない):
 *   前むきの こども。くび は みじかく、うで は かた から出て ひじ で まがる。
 *   てまえに もつ たけは、前むきから 見ると ひじ が 下で、うでさき が みじかく 見える。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '千'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#4f9be0'
const TUNIC_DARK = '#3c82c4'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const BAMBOO = '#7fb85a'
const BAMBOO_DARK = '#5f9a40'
const RIBBON = '#e8534a'
const WOOD = '#a8734a'
const WOOD_TOP = '#d9b185'
const WOOD_DARK = '#8c5b3c'
const LEAF = '#55b86e'
const LEAF_LIGHT = '#8bd69a'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const LANTERNS = ['#ef5b5b', '#ffc233', '#f07f9e', '#7cc4f2'] as const

/** くぎり の時間(秒) */
const NOTICE = 1.0
const LIFT_FROM = 3.0
const LIFT_TO = 4.6
const WIND = 4.9
const LANTERN_AT = 5.3
const INK = 6.9
const DONE = 9.6
const DURATION = 10.2

/** からだの まんなか(3画目の線の上) */
const CX = 56
/** 切りかぶの上に のっている ときの、たけの さがり(もちあげると 0 になる) */
const REST_DROP = 14
/** 2画目の線の高さ(x の所)。たけは この線に そって ほんの少し 右あがり */
const poleY = (x: number) => 50.9 - (x - 12) * 0.0465

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[97, 14]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="96.2" y="2.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 97 14)`} />
        ))}
      </Layer>
      <circle cx="97" cy="14" r={6.2 * sun} fill={SUN} />
      {/* とおくの おか と、ゆっくり ながれる 雲 */}
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.8} 0)`}>
        <ellipse cx="6" cy="12" rx="7" ry="3.2" />
        <ellipse cx="11" cy="10.2" rx="5" ry="3.2" />
        <ellipse cx="78" cy="28" rx="6" ry="2.6" />
        <ellipse cx="82.5" cy="26.6" rx="4.2" ry="2.8" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 34, 78, 100].map((x, i) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} transform={`rotate(${wave(t, 2.4, i) * 4} ${x + 2} 97.5)`} />
      ))}
    </>
  )
}

/** たけを のせている 2つの 切りかぶ。たけの ひだり・みぎ の はしの下 */
function Stumps({ t }: SceneProps) {
  const pop = span(t, 0, 0.5, backOut)
  const stump = (x: number, top: number) => (
    <Layer scaleY={pop} origin={[x + 6, 97]}>
      <rect x={x} y={top} width="12" height={97 - top} rx="2.4" fill={WOOD} />
      <path d={`M${x + 3} ${top + 6} v${86 - top} M${x + 8} ${top + 8} v${84 - top}`} stroke={WOOD_DARK} strokeWidth="0.9" strokeLinecap="round" fill="none" />
      <ellipse cx={x + 6} cy={top} rx="6" ry="1.7" fill={WOOD_TOP} />
    </Layer>
  )
  return (
    <>
      {stump(14, 67.4)}
      {stump(86, 63)}
    </>
  )
}

/** 1画目: リボンの おび。風が ふくと、したに たれた おび が 左へ なびく */
function RibbonTail({ t }: SceneProps) {
  const w = span(t, WIND, WIND + 0.8, easeOut)
  const flutter = Math.sin(t * 9) * w
  const end = [mix(t, WIND, WIND + 0.8, 71, 27, easeOut), mix(t, WIND, WIND + 0.8, 30, 31, easeOut) + flutter * 0.9] as const
  const ctrl = [mix(t, WIND, WIND + 0.8, 74, 45.3, easeOut), mix(t, WIND, WIND + 0.8, 19, 28.1, easeOut) + flutter * 1.6] as const
  return <path d={`M68.6 11.4 Q${ctrl[0]} ${ctrl[1]} ${end[0]} ${end[1]}`} fill="none" stroke={RIBBON} strokeWidth="2.6" strokeLinecap="round" />
}

type Mood = 'curious' | 'effort' | 'happy'

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="50.5" cy="29" r="2" fill="#ff9d9d" opacity="0.55" />
      <circle cx="61.5" cy="29" r="2" fill="#ff9d9d" opacity="0.55" />
      {mood === 'curious' && (
        <>
          <path d="M49.4 21.6 q2.2 -1.6 4.4 0 M58.2 21.6 q2.2 -1.6 4.4 0" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="51.6" cy="25.6" r="1.5" fill="#2b2b2b" />
          <circle cx="60.4" cy="25.6" r="1.5" fill="#2b2b2b" />
          <ellipse cx="56" cy="31" rx="1.3" ry="1.7" fill="#b9483f" />
        </>
      )}
      {mood === 'effort' && (
        <>
          <path d="M49.4 22.4 l4.2 1.4 M62.6 22.4 l-4.2 1.4" fill="none" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M49.8 26.4 l3.4 -1.2 M62.2 26.4 l-3.4 -1.2" fill="none" stroke="#2b2b2b" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M52.6 31.2 q1.8 -1.2 3.4 0 q1.6 1.2 3.4 0" fill="none" stroke="#b9483f" strokeWidth="1.3" strokeLinecap="round" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M49.6 26.4 Q51.6 23.4 53.6 26.4 M58.4 26.4 Q60.4 23.4 62.4 26.4" fill="none" stroke="#2b2b2b" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M52 29.8 Q56 35 60 29.8 Z" fill="#b9483f" />
        </>
      )}
    </>
  )
}

/** あし・どう・くび・あたま。前むきで、3画目の線が まんなかを とおる */
function Body({ t, mood, tilt }: { readonly t: number; readonly mood: Mood; readonly tilt: number }) {
  return (
    <>
      <rect x="48.7" y="66" width="5.8" height="29" rx="2.9" fill={PANTS} />
      <rect x="57.5" y="66" width="5.8" height="29" rx="2.9" fill={PANTS_DARK} />
      <ellipse cx="50.4" cy="95.4" rx="4.8" ry="2.4" fill={SHOE} />
      <ellipse cx="61.8" cy="95.4" rx="4.8" ry="2.4" fill={SHOE} />
      {/* くび: みじかく、どう と あたま の間 */}
      <rect x="53.2" y="32" width="5.6" height="6" rx="2.2" fill={SKIN_SHADE} />
      <rect x="45" y="36" width="22" height="33" rx="8" fill={TUNIC} />
      <path d="M47.4 62 h17.2" stroke={TUNIC_DARK} strokeWidth="1.6" strokeLinecap="round" />
      {/* リボンの おび は あたまの うしろ */}
      <RibbonTail t={t} />
      <Layer rotate={tilt} origin={[56, 34]}>
        <circle cx="46.4" cy="25.6" r="1.9" fill={SKIN_SHADE} />
        <circle cx="65.6" cy="25.6" r="1.9" fill={SKIN_SHADE} />
        <circle cx="56" cy="24.5" r="9.6" fill={SKIN} />
        <path d="M46.6 23.5 C45.8 13.4 54 11.8 58 12 C65 12.2 67 18 65.4 23.5 C62.5 19.6 58 18.4 52.6 19 C49.8 19.3 47.8 21 46.6 23.5 Z" fill={HAIR} />
        <circle cx="63.8" cy="14.4" r="2.6" fill={HAIR} />
        <path d="M67.6 11.6 l-3.4 -2.4 v4.8 Z M67.6 11.6 l3.4 -2.4 v4.8 Z" fill={RIBBON} />
        <circle cx="67.6" cy="11.6" r="1.2" fill="#c4413a" />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

/** うで: かた → ひじ(下へ) → 手(たけの上)。ひじ は からだの よこ で 下に まがる */
function Arms({ drop, squeeze }: { readonly drop: number; readonly squeeze: number }) {
  const hands = [
    { shoulder: [46.5, 40.5], elbow: [43, 52.4], hand: [43, poleY(43) + drop + 0.4] },
    { shoulder: [65.5, 40.5], elbow: [69, 52.4], hand: [69, poleY(69) + drop + 0.4] },
  ] as const
  return (
    <>
      {hands.map(({ shoulder, elbow, hand }) => (
        <g key={shoulder[0]}>
          <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={TUNIC_DARK} strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={hand[0]} cy={hand[1]} r={3.3 - squeeze * 0.4} fill={SKIN} />
        </g>
      ))}
    </>
  )
}

/** 2画目: 長い たけ。ふしが ある。ちょうちんが さがる */
function Pole({ t, drop }: { readonly t: number; readonly drop: number }) {
  const appear = span(t, 0.2, 0.75, backOut)
  const xs = [15, 22, 29, 36, 76, 83, 90, 96]
  return (
    <Layer y={drop} scaleX={appear} origin={[55, 50]}>
      <Bone char={CHAR} n={2} color={BAMBOO} width={4.4} />
      {[24, 48, 74, 90].map((x) => (
        <path key={x} d={`M${x} ${poleY(x) - 2.2} v4.4`} stroke={BAMBOO_DARK} strokeWidth="1.1" strokeLinecap="round" />
      ))}
      {xs.map((x, i) => {
        const pop = span(t, LANTERN_AT + i * 0.15, LANTERN_AT + i * 0.15 + 0.4, backOut)
        const top = poleY(x) + 2.2
        return (
          <Layer key={x} scale={pop} rotate={wave(t, 1.6, i * 0.4) * 5} origin={[x, top]}>
            <path d={`M${x} ${top} v3.2`} stroke="#6b4a36" strokeWidth="0.7" strokeLinecap="round" />
            <ellipse cx={x} cy={top + 6.6} rx="3" ry="3.5" fill={LANTERNS[i % LANTERNS.length]} />
            <path d={`M${x - 2.2} ${top + 5.2} Q${x} ${top + 4.4} ${x + 2.2} ${top + 5.2}`} fill="none" stroke="#ffffff" strokeWidth="0.7" strokeLinecap="round" opacity="0.6" />
            <rect x={x - 1.6} y={top + 3} width="3.2" height="1.1" rx="0.5" fill="#5a3b2a" />
          </Layer>
        )
      })}
    </Layer>
  )
}

/** たけを 見つけた「おや?」 */
function Exclaim({ t }: SceneProps) {
  const show = during(t, NOTICE, 2.5, 0.2)
  if (show <= 0) return null
  const pop = span(t, NOTICE, NOTICE + 0.35, backOut)
  return (
    <Layer opacity={show} scale={pop} origin={[36, 22]}>
      <path d="M36 7 v9" stroke="#f2a31b" strokeWidth="3" strokeLinecap="round" />
      <circle cx="36" cy="21.4" r="1.8" fill="#f2a31b" />
    </Layer>
  )
}

/** もちあげている間の あせ。あたまの 左がわ を おちる */
function Sweat({ t }: SceneProps) {
  const show = during(t, LIFT_FROM + 0.2, LIFT_TO, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.5].map((offset) => {
        const p = ((t + offset) % 1) / 1
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" transform={`translate(${42.6 - p * 2} ${17 + p * 12})`} opacity={1 - p * 0.6} />
      })}
    </g>
  )
}

/** 風に のって とぶ 葉(右から 左へ) */
function WindLeaves({ t }: SceneProps) {
  const show = during(t, WIND, INK - 0.1, 0.4)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.34, 0.68].map((offset, i) => {
        const p = (((t - WIND) * 0.3 + offset) % 1 + 1) % 1
        const x = 114 - p * 124
        const y = 74 + i * 9 + Math.sin(p * 11 + i) * 3
        return <path key={offset} d="M0 -2.8 Q2.6 0 0 2.8 Q-2.6 0 0 -2.8 Z" fill={i % 2 === 0 ? LEAF_LIGHT : LEAF} transform={`translate(${x} ${y}) rotate(${p * 300})`} />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 3)

  const appear = span(t, 0.3, 0.95, backOut)
  const lift = span(t, LIFT_FROM, LIFT_TO, easeInOut)
  const drop = REST_DROP * (1 - lift)
  const mood: Mood = t < LIFT_FROM ? 'curious' : t < LIFT_TO ? 'effort' : 'happy'
  // おや?: あたまを たけの ほうへ かしげる → よいしょ: ちからを入れて 少し うつむく → うれしくて ぴょん
  const tilt = mix(t, NOTICE, NOTICE + 0.5, 0, -5) * (1 - span(t, 2.6, 3.0)) + wave(t, 0.5) * 1.2 * during(t, LIFT_FROM, LIFT_TO, 0.2) + mix(t, LIFT_TO, LIFT_TO + 0.4, 0, 3)
  const hop = -Math.sin(span(t, LIFT_TO, LIFT_TO + 0.5) * Math.PI) * 2.4
  const strain = Math.sin(span(t, LIFT_FROM, LIFT_TO) * Math.PI)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Stumps t={t} />
        <Layer y={hop}>
          <Layer scaleX={1 + strain * 0.015} scaleY={1 - strain * 0.02} origin={[CX, 97]}>
            <Layer scale={appear} origin={[CX, 97]}>
              <Body t={t} mood={mood} tilt={tilt} />
            </Layer>
            <Pole t={t} drop={drop} />
            <Layer scale={appear} origin={[CX, 97]}>
              <Arms drop={drop} squeeze={strain} />
            </Layer>
          </Layer>
        </Layer>
        <Exclaim t={t} />
        <Sweat t={t} />
        <WindLeaves t={t} />
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
    { at: 0, label: 'こどもが 立っている。切りかぶに 長い たけ', sound: 'pop' },
    { at: NOTICE, label: 'たけを 見つけて「おや?」' },
    { at: LIFT_FROM, label: 'よいしょ と たけを もちあげる', sound: 'pop' },
    { at: LIFT_TO, label: 'もちあげた! うれしい' },
    { at: WIND, label: '風が ふいて リボンが なびく' },
    { at: LANTERN_AT, label: 'ちょうちんが たくさん さがる', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '千 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
