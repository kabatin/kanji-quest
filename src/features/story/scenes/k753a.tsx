/*
 * 町(まち): たんぼの あいだの みち。右は 音の しるし(丁)。
 *
 * ほね(画と絵の対応)
 *   1〜5画目(田) … たんぼ。まわりの あぜ(1・2・5画目)と、まんなかの あぜ道(3・4画目)。
 *                   あぜ道で 4つの 田んぼに わかれる
 *   6画目(一)   … みちしるべの 木の ふだ(町の ほうこうを しめす 板)
 *   7画目(丨)   … みちしるべの 木の はしら(した は じめんに うまり、足もとに 土を もる)
 *
 * ながれ
 *   たんぼが 見え、みちしるべが たつ → 麦わらぼうしの 子が みちを あるいてくる
 *   → たんぼの よこで、どっちへ いくのか わからず きょろきょろ(あせ・こまった顔)
 *   → みちしるべの ふだに 家の えが ひかる! 「あっ」と 見つける
 *   → かけだして、みちしるべの ところへ。町の 家々が 見えてきて、ばんざい(うれしい顔)
 *   → ほね が ひかって、絵が うすくなり、字「町」が のこる
 *
 * 子は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく、どう の まんなか の上。足は こし から。
 *   みちしるべ は 田んぼの よこ に 立つ ふつうの 木の ふだ。町の 絵は ふだ の 上に のせた 家の しるし。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '町'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const TUNIC = '#4f9be0'
const TUNIC_DARK = '#3c82c4'
const TUNIC_FAR = '#33709f'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const HAT = '#f0cf7a'
const HAT_DARK = '#dcb352'
const HAT_BAND = '#e8534a'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const RIDGE = '#9ccf6f'
const RIDGE_DARK = '#7fb457'
const MUD = '#7fb457'
const WATER = '#9fd8dc'
const WATER_LIGHT = '#c6ebfa'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const GRASS = '#c5e8a9'
const ROAD = '#ecd3a4'
const SUN = '#ffd24a'
const BOARD = '#e3b878'
const BOARD_DARK = '#c08f55'
const ROOF = '#e8534a'
const WALL = '#fff4d6'
const MOUTH = '#b9483f'

/** くぎり の時間(秒) */
const SIGN_AT = 0.3
const ENTER = 0.7
/** たんぼの よこで 立ちどまる */
const STOP = 2.8
/** みちしるべの 家の しるしに 気づく */
const SPOT = 4.3
/** かけだす・ついて ばんざい */
const RUN = 4.8
const ARRIVE = 6.2
const INK = 6.9
const DONE = 9.7
const DURATION = 10.2

/** 子の いる みちの 高さ(足もと) */
const ROAD_Y = 95
/** 立ちどまる ばしょ と、みちしるべの よこ */
const STOP_X = 22
const SIGN_X = 53
/** 子の 足もとから、かた・あたま までの 高さ(足もとを 0 とした ひくい 方が 上) */
const SHOULDER_Y = -24.5
const ARM_PART = 6.4

/* ───────── じめん・そら ───────── */

function Sky({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[103, 12]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="102.2" y="2" width="1.6" height="3.6" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 103 12)`} />
        ))}
      </Layer>
      <circle cx="103" cy="12" r={5.4 * sun} fill={SUN} />
      {/* ゆっくり ながれる 雲 */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.8} 0)`}>
        <ellipse cx="22" cy="9" rx="7" ry="3.2" />
        <ellipse cx="27" cy="7.4" rx="5" ry="3.2" />
      </g>
    </>
  )
}

function Ground() {
  return (
    <>
      <path d="M-4 90 Q22 78 48 88 Q76 74 113 86 V100 H-4 Z" fill="#e2f2d2" />
      <ellipse cx="54.5" cy="97" rx="58" ry="12" fill={GRASS} />
      {/* みち: 土の いろ */}
      <path d="M-4 91.5 Q54 89 113 91.5 V99.5 H-4 Z" fill={ROAD} />
      <path d="M-4 91.5 Q54 89 113 91.5" fill="none" stroke={GRASS} strokeWidth="1.6" />
      {[6, 40, 90, 104].map((x) => (
        <path key={x} d={`M${x} 90 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/* ───────── たんぼ(田) ───────── */

/** 4つの 田んぼの みず面(あぜ道で 左右・上下に わかれる) */
const PADDIES: readonly (readonly [x: number, y: number, w: number, h: number])[] = [
  [12.6, 31.6, 13, 18],
  [27.2, 31.6, 12.6, 18],
  [12.6, 51.4, 13, 19],
  [27.2, 51.4, 12.6, 19],
]

/** 稲の なえ。みずの 中から 3本 のびて、風で ゆれる */
function Sprouts({ x, y, w, h, grow, sway, seed }: { readonly x: number; readonly y: number; readonly w: number; readonly h: number; readonly grow: number; readonly sway: number; readonly seed: number }) {
  return (
    <>
      {[0.18, 0.5, 0.82, 0.34, 0.66].map((fx, i) => {
        const bx = x + w * fx
        const by = y + h * (i < 3 ? 0.5 + ((i + seed) % 2) * 0.06 : 0.86)
        const lean = sway * 1.2 + (i % 3 - 1) * 0.6
        const top = by - 5.2 * grow
        return (
          <path key={i} d={`M${bx - 1} ${by} Q${bx + lean * 0.5} ${by - 3 * grow} ${bx + lean} ${top} Q${bx + lean * 0.5 + 0.8} ${by - 2.5 * grow} ${bx + 1} ${by} Z`} fill={i % 2 === 0 ? LEAF : LEAF_DARK} />
        )
      })}
    </>
  )
}

function Paddy({ t }: SceneProps) {
  const fill = span(t, 0, 0.6, easeOut)
  const grow = span(t, 0.3, 1.3, backOut)
  const sway = wave(t, 2.4)
  return (
    <Layer opacity={fill}>
      {/* どろ の下地 */}
      <rect x="11.4" y="30.4" width="29.6" height="41.4" rx="2" fill={MUD} />
      {PADDIES.map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} rx="1.6" fill={WATER} />
          {/* みずの ひかり */}
          <path d={`M${x + 1.4} ${y + 2.4} h${w * 0.4}`} stroke={WATER_LIGHT} strokeWidth="1" strokeLinecap="round" />
          <Sprouts x={x} y={y} w={w} h={h} grow={grow} sway={sway} seed={i} />
        </g>
      ))}
      {/* あぜ: 田の 画の線 そのもの(まわり と あぜ道) */}
      {[1, 2, 3, 4, 5].map((n) => (
        <Bone key={`d${n}`} char={CHAR} n={n} color={RIDGE_DARK} width={3.8} />
      ))}
      {[1, 2, 3, 4, 5].map((n) => (
        <Bone key={n} char={CHAR} n={n} color={RIDGE} width={2.8} />
      ))}
    </Layer>
  )
}

/* ───────── みちしるべ(丁) ───────── */

function Sign({ t }: SceneProps) {
  const grow = span(t, SIGN_AT, SIGN_AT + 0.7, backOut)
  // 見つける しゅんかん、家の しるしが ぴかっと ひかる
  const flash = during(t, SPOT - 0.5, SPOT + 1.0, 0.25)
  const bounce = Math.sin(span(t, SPOT - 0.3, SPOT + 0.2) * Math.PI) * 0.14 + Math.sin(span(t, ARRIVE, ARRIVE + 0.5) * Math.PI) * 0.1
  return (
    <>
      <ellipse cx="71" cy="95.4" rx={11 * grow} ry="3" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.6 + 0.4 * grow} scaleY={grow} origin={[73.5, 96]}>
        {/* はしら(7画目)。足もとの まがりは、土から ぬけない ための そえぎ */}
        <Bone char={CHAR} n={7} color={BARK_DARK} width={5.6} />
        <Bone char={CHAR} n={7} color={BARK} width={4.2} />
        <ellipse cx="71" cy="95" rx="7.4" ry="2.4" fill="#cfa070" />
        {/* ふだ(6画目) */}
        <g transform="translate(0 1.1)">
          <Bone char={CHAR} n={6} color={BOARD_DARK} width={10} />
        </g>
        <Bone char={CHAR} n={6} color={BOARD} width={9.2} />
        {/* 家の しるし */}
        <Layer scale={1 + bounce + flash * 0.1} origin={[73.5, 25]}>
          <path d="M69.6 24.2 L73.5 20.6 L77.4 24.2 Z" fill={ROOF} />
          <rect x="70.6" y="24" width="5.8" height="4" rx="0.6" fill={WALL} />
          <rect x="72.7" y="25.4" width="1.6" height="2.6" rx="0.4" fill={BARK} />
        </Layer>
      </Layer>
      {/* ひかり */}
      <Star cx={80.5} cy={21} r={4.2 * flash} color="#ffd24a" spin={t * 120} />
      <Star cx={66.5} cy={17.6} r={2.6 * flash} color="#ffffff" spin={-t * 120} />
    </>
  )
}

/** 町の 家々。みちしるべに ついた ころ、右の ほうに ぽん と 見えてくる */
function Town({ t }: SceneProps) {
  const pop = span(t, RUN + 0.9, ARRIVE + 0.2, backOut)
  if (pop <= 0) return null
  return (
    <Layer scale={pop} origin={[96, 93]}>
      <rect x="82" y="80" width="12" height="13" rx="1" fill={WALL} />
      <path d="M80 81 L88 73 L96 81 Z" fill={ROOF} />
      <rect x="84.4" y="83.6" width="3" height="3" rx="0.5" fill={SUN} />
      <rect x="88.6" y="86" width="3" height="7" rx="0.6" fill={BARK} />
      <rect x="97" y="84" width="9.5" height="9" rx="1" fill="#ffe3b3" />
      <path d="M95.4 85 L101.7 78.6 L108 85 Z" fill="#4f9be0" />
      <rect x="99.2" y="87" width="2.6" height="2.6" rx="0.5" fill={SUN} />
    </Layer>
  )
}

/* ───────── 子(主役) ───────── */

type Mood = 'lost' | 'notice' | 'happy'
/** うで の かっこう。swing = ま下から まえ(右)へ ふった角度 / bend = ひじ の まがり(まえへ) */
type ArmPose = { readonly swing: number; readonly bend: number }

const rad = (deg: number) => (deg * Math.PI) / 180

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。 */
function Arm({ pose, color }: { readonly pose: ArmPose; readonly color: string }) {
  const elbow = [Math.sin(rad(pose.swing)) * ARM_PART, SHOULDER_Y + Math.cos(rad(pose.swing)) * ARM_PART] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] + Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART] as const
  return (
    <>
      <path d={`M0 ${SHOULDER_Y} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.3" fill={SKIN} />
    </>
  )
}

function Face({ mood, look }: { readonly mood: Mood; readonly look: number }) {
  // かお は あたま の まえ側 に よる。look = 1 で 右むき、-1 で 左むき
  const ex = 0.6 + 2.4 * look
  const mx = 0.6 + 2.8 * look
  return (
    <>
      <circle cx={0.6 - 3.4 * look} cy="-35.4" r="1.4" fill={SKIN_SHADE} />
      <circle cx={0.6 + 1.6 * look} cy="-33.2" r="1.5" fill="#ff9d9d" opacity="0.55" />
      {mood === 'lost' && (
        <>
          <path d={`M${ex - 1.8} -38.1 L${ex + 1.6} -39.5`} stroke="#5a3b2a" strokeWidth="0.9" strokeLinecap="round" />
          <circle cx={ex} cy="-36.2" r="1.1" fill="#2b2b2b" />
          <path d={`M${mx - 1.5} -31.8 q0.75 -1.1 1.5 0 t1.5 0`} fill="none" stroke={MOUTH} strokeWidth="0.9" strokeLinecap="round" />
        </>
      )}
      {mood === 'notice' && (
        <>
          <circle cx={ex} cy="-36.2" r="1.7" fill="#2b2b2b" />
          <circle cx={ex + 0.5} cy="-36.8" r="0.55" fill="#ffffff" />
          <ellipse cx={mx} cy="-31.8" rx="1" ry="1.4" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d={`M${ex - 1.4} -35.8 Q${ex} -37.8 ${ex + 1.4} -35.8`} fill="none" stroke="#2b2b2b" strokeWidth="1.1" strokeLinecap="round" />
          <path d={`M${mx - 1.9} -32.6 Q${mx} -29.4 ${mx + 1.9} -32.6 Z`} fill={MOUTH} />
        </>
      )}
    </>
  )
}

type ChildProps = { readonly step: number; readonly mood: Mood; readonly look: number; readonly nearArm: ArmPose; readonly farArm: ArmPose }

function Child({ step, mood, look, nearArm, farArm }: ChildProps) {
  const swing = step * 24
  return (
    <>
      <Arm pose={farArm} color={TUNIC_FAR} />
      {/* うしろの足・まえの足(あるくとき、かわりばんこに ふる) */}
      <Layer rotate={swing} origin={[1.6, -12]}>
        <rect x="-0.4" y="-12" width="4" height="11.6" rx="2" fill={PANTS_DARK} />
        <ellipse cx="2.6" cy="-1.2" rx="3.4" ry="1.8" fill={SHOE} />
      </Layer>
      <Layer rotate={-swing} origin={[-1.6, -12]}>
        <rect x="-3.6" y="-12" width="4" height="11.6" rx="2" fill={PANTS} />
        <ellipse cx="-0.6" cy="-1.2" rx="3.4" ry="1.8" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう の まんなか の上 */}
      <rect x="-1.8" y="-30.6" width="3.6" height="5" rx="1.6" fill={SKIN_SHADE} />
      {/* どう */}
      <rect x="-4.6" y="-27.4" width="9.2" height="15.6" rx="4.2" fill={TUNIC} />
      <path d="M-3.4 -16.6 h6.8" stroke={TUNIC_DARK} strokeWidth="1.1" strokeLinecap="round" />
      <Arm pose={nearArm} color={TUNIC_DARK} />
      {/* あたま と 麦わらぼうし */}
      <circle cx="0.6" cy="-35.4" r="6" fill={SKIN} />
      <Face mood={mood} look={look} />
      <path d="M-5.8 -38.6 a6.4 6.4 0 0 1 12.8 0 Z" fill={HAT} />
      <rect x="-5.9" y="-41.1" width="12.9" height="1.8" fill={HAT_BAND} />
      <ellipse cx="0.6" cy="-38.4" rx="9.6" ry="2.2" fill={HAT_DARK} />
      <ellipse cx="0.6" cy="-38.8" rx="9.6" ry="2.1" fill={HAT} />
    </>
  )
}

/** あるいて いるあいだの あせ。うしろへ とぶ。 */
function Sweat({ t }: SceneProps) {
  const show = during(t, ENTER + 0.5, SPOT, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.45].map((offset) => {
        const p = ((t + offset) % 0.9) / 0.9
        return <path key={offset} d="M0 -2.2 Q1.8 0.5 0 1.9 Q-1.8 0.5 0 -2.2 Z" fill="#7cc4f2" transform={`translate(${-8 - p * 5} ${-40 + p * 7}) rotate(30)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** 「あっ」: 見つけた しゅんかん、あたまの 上に とび出す しるし。 */
function Surprise({ t }: SceneProps) {
  const show = during(t, SPOT, RUN + 0.3, 0.12)
  if (show <= 0) return null
  const pop = span(t, SPOT, SPOT + 0.25, backOut)
  return (
    <Layer opacity={show} scale={pop} origin={[2, -47]}>
      <rect x="0.7" y="-60" width="2.6" height="8.4" rx="1.3" fill="#ff7a4d" />
      <circle cx="2" cy="-48.6" r="1.6" fill="#ff7a4d" />
    </Layer>
  )
}

const WALK_ARM = (stride: number, k: number): ArmPose => ({ swing: stride * 30 * k, bend: 14 })

/** うで を 場面ごとの かっこうから まぜて つくる(おろおろ → 指さし → かける → ばんざい) */
function armPose(t: number, stride: number, side: 'near' | 'far'): ArmPose {
  const lost = span(t, STOP, STOP + 0.3) * (1 - span(t, SPOT - 0.1, SPOT + 0.15))
  const point = side === 'near' ? span(t, SPOT, SPOT + 0.3) * (1 - span(t, RUN - 0.05, RUN + 0.2)) : 0
  const cheer = span(t, ARRIVE - 0.1, ARRIVE + 0.3) * (1 - span(t, INK - 0.1, INK))
  const move = Math.max(0, 1 - lost - point - cheer)
  const run = span(t, RUN, RUN + 0.3) * (1 - span(t, ARRIVE - 0.4, ARRIVE))
  const sign = side === 'near' ? -1 : 1
  const walkArm = WALK_ARM(sign * stride, 1 + run * 0.5)
  const shrug = wave(t, 1.2, side === 'near' ? 0 : 0.5) * 6
  const lostSwing = 28 + shrug
  const cheerSwing = 158 + wave(t, 0.5, side === 'near' ? 0 : 0.25) * 8
  const swing = walkArm.swing * move + lostSwing * lost + 92 * point + cheerSwing * cheer
  const bend = (walkArm.bend + run * 30) * move + 66 * lost + (side === 'near' ? 22 : 48) * cheer
  return { swing, bend }
}

function Person({ t }: SceneProps) {
  // あるく(たんぼの よこ まで) → 立ちどまる → かけだす → ついて ばんざい
  const walkEnd = STOP
  const runEnd = ARRIVE - 0.2
  const x = t < STOP ? mix(t, ENTER, walkEnd, -14, STOP_X, easeOut) : mix(t, RUN, runEnd, STOP_X, SIGN_X, easeInOut)
  const walking = span(t, ENTER, ENTER + 0.2) * (1 - span(t, walkEnd - 0.3, walkEnd))
  const running = span(t, RUN, RUN + 0.2) * (1 - span(t, runEnd - 0.3, runEnd))
  const stride = Math.sin(t * Math.PI * 2 * 1.8) * walking + Math.sin(t * Math.PI * 2 * 2.8) * running * 1.3
  const bob = -Math.abs(stride) * 1.1
  // ばんざい の ジャンプ(さいごは かならず 地面に もどる)
  const hopP = span(t, ARRIVE, INK - 0.15)
  const hop = -Math.abs(Math.sin(hopP * Math.PI * 3)) * 4.5
  const mood: Mood = t < SPOT ? 'lost' : t < RUN + 0.3 ? 'notice' : 'happy'
  // きょろきょろ: 立ちどまって いる間、左右を 見る
  const lostK = span(t, STOP, STOP + 0.25) * (1 - span(t, SPOT - 0.1, SPOT))
  const look = 1 - lostK * (1 - wave(t - STOP, 1.3)) * 1
  return (
    <>
      <ellipse cx={x} cy={ROAD_Y + 0.6} rx="8" ry="2" fill="#000000" opacity={0.14 + hop * 0.01} />
      <Layer x={x} y={ROAD_Y + bob + hop}>
        <Child step={stride} mood={mood} look={look} nearArm={armPose(t, stride, 'near')} farArm={armPose(t, stride, 'far')} />
        <Sweat t={t} />
        <Surprise t={t} />
      </Layer>
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Ground />
        <Paddy t={t} />
        <Town t={t} />
        <Sign t={t} />
        <Layer opacity={span(t, ENTER - 0.1, ENTER + 0.15)}>
          <Person t={t} />
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
    { at: 0, label: 'たんぼが 見える。みちしるべが たつ', sound: 'pop' },
    { at: ENTER, label: '麦わらぼうしの 子が あるいてくる' },
    { at: STOP, label: 'どっちへ いくのか わからず きょろきょろ' },
    { at: SPOT, label: 'ふだに 家の しるし! 「あっ」', sound: 'pop' },
    { at: RUN, label: 'かけだす。町の 家が 見えてくる' },
    { at: ARRIVE, label: 'ついた! ばんざい', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '町 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
