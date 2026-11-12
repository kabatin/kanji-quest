/*
 * 読(よむ): ことばを 声に 出して、本を よむ。
 *
 * ほね(画と絵の対応)
 *   1〜4画目(言の 上) … 子どもの くちから 出てくる 声(ことば)の ならび
 *   5〜7画目(言の 口) … 子どもの 口(声が 出てくる ところ)
 *   8〜10画目(士)     … 空に ならんだ ことば(声)の かたまり
 *   11・12画目(冖)    … ひらいた 本
 *   13・14画目(儿)    … 本を もって 立つ 子ども(あし)
 *   ※ 字と ぴったり 重ならなくても、同じへんの 同じ向き で 十分(絵を ゆがめない ほうを えらぶ)
 *
 * ながれ
 *   木と 岩のある 草はらに、本を もった 子どもが 立つ。字が よめなくて こまっている(あせ・ふあん)
 *   → 小鳥が 岩に とんできて ちゅんちゅん うたう。子どもは それを聞いて「そうだ、声に 出してみよう」
 *   → 大きく いきを すって、本の 字を 1行ずつ 声に 出して よむ。ことばが ふわふわ 空へ のぼる
 *   → よめた! にっこり。ほね が ひかって、絵が うすくなり、字「読」が のこる
 *
 * 子どもは、ほんものの 人の つくり を守る(字の形に 合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがり、本を 両手で もつ。くび は みじかく、どう の まんなか の上。
 *   あし は こし から 2本。あたまは 体に くらべて 少し 大きい(子どもらしさ)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '読'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#f28a5c'
const SHIRT_DARK = '#d9724a'
const SHIRT_FAR = '#b95f3d'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const ROCK = '#aeb4bd'
const ROCK_DARK = '#8e959f'
const COVER = '#d65a4a'
const PAGE = '#fffaf0'
const TEXT_LINE = '#b9a98f'
const LINE_LIT = '#ffb62e'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const SWEAT = '#7cc4f2'

/** くぎり の時間(秒) */
const BOOK_AT = 0.8
const PUZZLE = 1.4
const BIRD_AT = 1.7
const SING = 2.5
/** 声に 出して よみはじめる */
const READ = 3.3
const READ_END = 5.6
const INK = 6.1
const DONE = 8.6
const DURATION = 9.2

/** 子どもの 足もと。 */
const FEET_X = 28
const GROUND_Y = 95
/** くちの 場所(声が 出てくる ところ) */
const MOUTH_POS: readonly [number, number] = [35.4, 48.8]
/** 声の ふきだしが たどりつく 空の 場所(1行ぶんに 1つ) */
const VOICE_GOALS: readonly (readonly [number, number])[] = [
  [47, 33],
  [60, 22],
  [73, 36],
  [84, 17],
  [40, 12],
]
const VOICE_COLORS = ['#ff9d6b', '#6fb8ee', '#f07f9e', '#6fcf8a', '#ffc233'] as const
/** 声の ふきだしが 出はじめる間かく と、とんでいる 時間 */
const VOICE_GAP = 0.42
const VOICE_LIFE = 1.55
/** 本の 左右の ページの 行(はじめの x, おわりの x, y) */
const BOOK_LINES: readonly (readonly [number, number, number])[] = [
  [42.2, 46.2, 58.6],
  [42.2, 46.2, 61.6],
  [42.2, 46.2, 64.6],
  [48.6, 52.6, 58.6],
  [48.6, 52.6, 61.6],
  [48.6, 52.6, 64.6],
]

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
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="60" cy="8" rx="7" ry="3" />
        <ellipse cx="65" cy="6.4" rx="5" ry="3" />
        <ellipse cx="98" cy="14" rx="6" ry="2.6" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 52, 66, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 右がわの 木。みき が のびて、葉が ぽん と しげる。 */
function Tree({ t }: SceneProps) {
  const trunk = span(t, 0, 0.5, backOut)
  const leaves = span(t, 0.3, 0.9, backOut)
  const sway = wave(t, 3.4) * 1.2
  return (
    <>
      <ellipse cx="92" cy="97.4" rx={9 * trunk} ry="2.2" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.6 + 0.4 * trunk} scaleY={trunk} origin={[92, 97]}>
        <path d="M88 97 Q91.6 90 90.6 80 L96 80 Q95.6 90 98 97 Z" fill={BARK} />
        <rect x="90" y="52" width="6.4" height="40" rx="3.2" fill={BARK} />
        <path d="M92 62 q1 4 0 8" fill="none" stroke={BARK_DARK} strokeWidth="1.1" strokeLinecap="round" />
      </Layer>
      <Layer scale={leaves} rotate={sway} origin={[93, 54]}>
        <circle cx="86" cy="44" r="11" fill={LEAF_DARK} />
        <circle cx="100" cy="46" r="10" fill={LEAF_DARK} />
        <circle cx="93" cy="35" r="12.5" fill={LEAF_DARK} />
        <circle cx="90" cy="44" r="9" fill={LEAF} />
        <circle cx="98" cy="43" r="8" fill={LEAF} />
        <circle cx="93" cy="37" r="9.5" fill={LEAF} />
        <circle cx="89" cy="33" r="3.6" fill={LEAF_LIGHT} />
      </Layer>
    </>
  )
}

/** 小鳥が とまる 岩 */
function Rock() {
  return (
    <>
      <path d="M65 96.5 Q65 87 72 86 Q80 85 83 96.5 Z" fill={ROCK_DARK} />
      <path d="M66.5 96.5 Q67 89 72.4 87.6 Q78 86.6 80 93 Q74 91 66.5 96.5 Z" fill={ROCK} />
    </>
  )
}

type Mood = 'puzzled' | 'singing' | 'proud'

function Face({ mood, t }: { readonly mood: Mood; readonly t: number }) {
  // 顔は 右むき(本の ほう)。目は 右よりに、くちは あたまの 右はし ちかく
  const glance = wave(t, 1.3) * 0.7
  return (
    <>
      <circle cx="33" cy="49.2" r="2" fill={CHEEK} opacity="0.55" />
      {mood === 'puzzled' ? (
        <>
          <path d="M31.2 40.2 l4.2 1.4" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx={34 + glance} cy="43.8" r="1.2" fill={EYE} />
          <path d={`M33 ${49.6 + Math.abs(glance) * 0.3} q2 -1 4 0.4`} fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M32.6 44.6 Q34.2 42.6 35.8 44.6" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          {mood === 'singing' ? (
            <ellipse cx={MOUTH_POS[0]} cy={MOUTH_POS[1]} rx="1.5" ry={0.7 + Math.abs(wave(t, 0.36)) * 1.5} fill={MOUTH} />
          ) : (
            <path d="M33.2 48.4 Q35.4 51.6 37.4 48.2" fill="none" stroke={MOUTH} strokeWidth="1.3" strokeLinecap="round" />
          )}
        </>
      )}
    </>
  )
}

function Head({ mood, t, tilt }: { readonly mood: Mood; readonly t: number; readonly tilt: number }) {
  return (
    <Layer rotate={tilt} origin={[29, 54]}>
      <circle cx="29" cy="44" r="9.6" fill={SKIN} />
      <circle cx="21.6" cy="45.6" r="2" fill={SKIN_SHADE} />
      {/* かみ: あたまの うえ と うしろ(左)。ひたいは 少し 出す */}
      <path d="M19.4 45.6 C17.8 32.6 30 31 36.4 36.6 C38.4 38.4 38.8 40.8 38.6 42.2 C35.4 38.6 29.4 38.2 25.4 40.8 C23.4 42.2 22.4 44 22.2 47.4 Z" fill={HAIR} />
      <path d="M27 33.4 Q28 30.4 29.8 32.4" fill="none" stroke={HAIR} strokeWidth="1.6" strokeLinecap="round" />
      <Face mood={mood} t={t} />
    </Layer>
  )
}

/** かた(30,60)→ひじ→手 の じゅんに つながる うで。どちらの うで も、同じ長さ。 */
function Arm({ shoulder, elbow, hand, color }: { readonly shoulder: readonly [number, number]; readonly elbow: readonly [number, number]; readonly hand: readonly [number, number]; readonly color: string }) {
  return (
    <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
  )
}

/** ひらいた 本。いま よんでいる 行が 黄色く ひかる。 */
function Book({ lit }: { readonly lit: number }) {
  return (
    <>
      <rect x="40" y="55" width="14" height="14.6" rx="1.6" fill={COVER} />
      <rect x="41" y="56" width="6.4" height="12.6" rx="0.8" fill={PAGE} />
      <rect x="47.6" y="56" width="6.4" height="12.6" rx="0.8" fill={PAGE} />
      <path d="M47.5 56 v12.6" stroke="#e3d6bd" strokeWidth="0.7" />
      {BOOK_LINES.map(([x1, x2, y], i) => {
        const on = lit === i
        return <path key={i} d={`M${x1} ${y} H${x2}`} stroke={on ? LINE_LIT : TEXT_LINE} strokeWidth={on ? 1.5 : 1} strokeLinecap="round" />
      })}
    </>
  )
}

type PersonProps = {
  readonly mood: Mood
  readonly t: number
  readonly tilt: number
  readonly breath: number
  /** いま よんでいる 行(-1 = よんでいない) */
  readonly lit: number
}

function Person({ mood, t, tilt, breath, lit }: PersonProps) {
  return (
    <>
      {/* むこうの うで(体の うしろ) */}
      <Arm shoulder={[33, 60]} elbow={[38, 70.9]} hand={[49.5, 68.4]} color={SHIRT_FAR} />
      {/* あし */}
      <rect x="29.6" y="78" width="5.6" height="15.6" rx="2.8" fill={PANTS_DARK} />
      <ellipse cx="33.4" cy="94.2" rx="4.8" ry="2.2" fill={SHOE} />
      <rect x="23" y="78" width="5.8" height="15.6" rx="2.9" fill={PANTS} />
      <ellipse cx="27.6" cy="94.2" rx="4.8" ry="2.2" fill={SHOE} />
      {/* くび: みじかく、どう と あたま の間 */}
      <rect x="26.4" y="50" width="5" height="9" rx="2.2" fill={SKIN_SHADE} />
      {/* どう: いきを すうと ふくらむ */}
      <Layer scaleX={1 + breath * 0.06} scaleY={1 + breath * 0.025} origin={[29, 78]}>
        <rect x="21.4" y="55.6" width="15" height="25" rx="6.5" fill={SHIRT} />
        <path d="M23.4 74 h11" stroke={SHIRT_DARK} strokeWidth="1.4" strokeLinecap="round" />
      </Layer>
      <Head mood={mood} t={t} tilt={tilt} />
      {/* 本 と てまえの うで・両手 */}
      <Book lit={lit} />
      <Arm shoulder={[30, 60]} elbow={[32, 71.9]} hand={[43.5, 69.2]} color={SHIRT_DARK} />
      <circle cx="43.6" cy="69.6" r="2.5" fill={SKIN} />
      <circle cx="50" cy="68.8" r="2.3" fill={SKIN_SHADE} />
    </>
  )
}

/** こまって かいた あせ。あたまの 左うえから つたう。 */
function Sweat({ t }: SceneProps) {
  const show = during(t, PUZZLE + 0.2, SING + 0.2, 0.2)
  if (show <= 0) return null
  const p = ((t - PUZZLE) % 0.9) / 0.9
  return (
    <path
      d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z"
      fill={SWEAT}
      opacity={show * (1 - p * 0.6)}
      transform={`translate(${22 - p * 1.5} ${36 + p * 9}) rotate(10)`}
    />
  )
}

/** 小鳥: 空から とんできて 岩に とまり、ちゅんちゅん うたう。 */
function Bird({ t }: SceneProps) {
  const arrive = span(t, BIRD_AT, BIRD_AT + 0.8, easeOut)
  if (arrive <= 0) return null
  const x = mix(t, BIRD_AT, BIRD_AT + 0.8, 118, 74.5, easeOut)
  const y = 6 + arrive * 80 - Math.sin(arrive * Math.PI) * 8
  const landed = arrive >= 1
  const singing = landed && t >= SING && t < READ_END + 0.4
  const hop = singing ? Math.abs(wave(t, 0.5)) * 0.9 : 0
  const flap = landed ? 0 : wave(t, 0.16) * 28
  const notes = during(t, SING, READ + 0.9, 0.25)
  const rise = (t * 5) % 7
  return (
    <>
      <Layer x={x} y={y - hop} scale={1.15}>
        <path d="M2.6 0.4 l4.6 -1.6 l-3.4 3.2 Z" fill="#e2733f" />
        <ellipse cx="0" cy="0" rx="4" ry="3.1" fill="#ff9a5c" />
        <circle cx="-3" cy="-2.3" r="2.3" fill="#ff9a5c" />
        <path d={singing ? `M-5 -2.6 l-2.4 ${0.2 - Math.abs(wave(t, 0.5)) * 1.2} l2.3 0.9 Z` : 'M-5 -2.4 l-2.4 0.7 l2.3 0.9 Z'} fill="#f2b632" />
        <circle cx="-3.6" cy="-2.8" r="0.55" fill={EYE} />
        <Layer rotate={flap} origin={[0.4, -0.6]}>
          <path d="M-1.2 -0.8 Q1.6 -3.8 4 -0.6 Q1.6 0.8 -1.2 -0.8 Z" fill="#e2733f" />
        </Layer>
      </Layer>
      <g opacity={notes} fill="#f07f9e" stroke="#f07f9e">
        <path d={`M68 ${80 - rise} v-4.4 l2.6 -0.8 v4.2`} fill="none" strokeWidth="0.8" />
        <ellipse cx="67.2" cy={80 - rise} rx="1.1" ry="0.8" stroke="none" />
        <ellipse cx="69.8" cy={79.2 - rise} rx="1.1" ry="0.8" stroke="none" />
      </g>
    </>
  )
}

/** 声に 出した ことば。ふきだし が くち から 出て、空へ のぼる。中に 2本の ことば の線。 */
function Voice({ t, index }: SceneProps & { readonly index: number }) {
  const born = READ + 0.1 + index * VOICE_GAP
  const p = span(t, born, born + VOICE_LIFE)
  if (p <= 0 || p >= 1) return null
  const [gx, gy] = VOICE_GOALS[index]
  const move = easeOut(p)
  const x = MOUTH_POS[0] + (gx - MOUTH_POS[0]) * move
  const y = MOUTH_POS[1] + (gy - MOUTH_POS[1]) * move - Math.sin(move * Math.PI) * 5 + wave(t, 1.1, index) * 0.7
  const r = 2.4 + 5.2 * Math.min(1, p * 2.2)
  // はじめは ぽん と ふくらみ、おわりは ふわっと きえる
  const alpha = Math.min(1, p * 8) * (1 - span(p, 0.72, 1))
  const color = VOICE_COLORS[index % VOICE_COLORS.length]
  return (
    <g opacity={alpha} transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="0" rx={r * 1.15} ry={r} fill="#ffffff" stroke={color} strokeWidth="1.2" />
      <path d={`M${-r * 0.6} ${-r * 0.25} q${r * 0.3} ${-r * 0.4} ${r * 0.6} 0 t${r * 0.6} 0 M${-r * 0.6} ${r * 0.35} q${r * 0.3} ${-r * 0.4} ${r * 0.6} 0`} fill="none" stroke={color} strokeWidth="0.9" strokeLinecap="round" />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 14)

  // 子どもが ぽんと 出てくる
  const appear = span(t, 0.3, 0.85, backOut)

  const mood: Mood = t < SING + 0.6 ? 'puzzled' : t < READ_END ? 'singing' : 'proud'
  // こまって あたまを かしげる → 小鳥に 気づいて 上を むく → よむ → うれしくて 少し はずむ
  const tilt = t < SING ? wave(t, 1.6) * 3 + 2 : mix(t, SING, READ, 2, -3, easeOut) + (t > READ_END ? 3 : 0)
  // いきを すう(まえ)→ 声を 出す(うしろ)
  const inhale = span(t, READ - 0.45, READ, easeInOut) * (1 - span(t, READ, READ + 0.3))
  const beat = t >= READ && t < READ_END ? Math.abs(wave(t, VOICE_GAP * 2)) : 0
  const breath = inhale + beat * 0.3
  const hopUp = t >= READ_END && t < INK ? Math.sin(span(t, READ_END, READ_END + 0.45) * Math.PI) * 2.2 : 0
  const bob = -beat * 0.5 - hopUp

  // いま よんでいる 行(1行ずつ ひかる)
  const reading = t >= READ && t < READ_END
  const lit = reading ? Math.min(BOOK_LINES.length - 1, Math.floor((t - READ) / ((READ_END - READ) / BOOK_LINES.length))) : -1

  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Tree t={t} />
        <Rock />
        <Bird t={t} />
        <Layer opacity={appear}>
          <ellipse cx="29" cy="97.2" rx="11" ry="2.4" fill="#000000" opacity="0.12" />
          <Layer scale={0.7 + 0.3 * appear} y={bob} origin={[FEET_X, GROUND_Y]}>
            <Layer>
              <Person mood={mood} t={t} tilt={tilt} breath={breath} lit={lit} />
            </Layer>
            <Sweat t={t} />
          </Layer>
        </Layer>
        {[0, 1, 2, 3, 4].map((i) => (
          <Voice key={i} t={t} index={i} />
        ))}
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
    { at: 0, label: '木と 岩の ある 草はら', sound: 'pop' },
    { at: BOOK_AT, label: '本を もった 子どもが 立つ' },
    { at: PUZZLE, label: '字が よめなくて こまる' },
    { at: BIRD_AT, label: '小鳥が とんできて うたう' },
    { at: READ, label: '声に 出して よむ。ことばが 空へ のぼる', sound: 'pop' },
    { at: READ_END, label: 'よめた! にっこり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '読 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
