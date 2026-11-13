/*
 * 夜(よる): うでを ひろげた 子の わきの したに、おつきさま。つきが でたら、よる。
 *
 * ほね(画と絵の対応)
 *   1画目(丶)  … 夜空に さいしょに ひかる 星(たてに ながい きらり)
 *   2画目(一)  … 夕ぐれの よこに ながい 雲
 *   3画目(ノ)  … 子の ひだりの うで(よこから ななめ下へ ひらく)
 *   4画目(丨)  … 子の どう と あし
 *   5・6画目   … おつきさま(みかづき)の うちがわ と そとがわ
 *   7画目(丶)  … おつきさまの くぼみ
 *   8画目(㇏)  … おつきさまから 地面へ とどく 月あかりの おび
 *
 * ながれ
 *   夕やけ。子が お日さまに てを ふる → お日さまが しずんで、空が くらくなる
 *   → さむくて こわくて、うでで 体を だきしめる → 丘の うしろから おつきさまが のぼる
 *   → 子が 気づいて「あっ」→ うでを ひろげて にっこり。うでの わきの したに おつきさま、
 *     星が ひかり、月あかりが 地面を てらす → ほね が ひかって、絵が うすくなり、字「夜」が のこる
 *
 * 子は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく、どう の まんなか の上。左右の うで・あし が ある。
 *   うでを ひろげるのは「はなしの なかの しぐさ」で、字の線とは だいたい 同じ向き で よい。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '夜'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#f0a04b'
const TUNIC_DARK = '#d9893a'
const PANTS = '#4a6a9c'
const PANTS_DARK = '#3e5c86'
const SHOE = '#6b4a36'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const SUN = '#ffd24a'
const MOON = '#fff3b0'
const MOON_SHADE = '#f2d874'
const MOON_GLOW = '#ffe98a'

/** くぎり の時間(秒) */
const WAVE_FROM = 0.5
const DUSK_FROM = 0.6
const DUSK_TO = 1.9
/** お日さまが しずんで 空が くらくなる */
const NIGHT_FROM = 2.0
const NIGHT_TO = 3.3
/** おつきさまが 丘の うしろから のぼる */
const RISE_FROM = 3.4
const RISE_TO = 5.0
/** 子が おつきさまに 気づく */
const NOTICE = 4.1
/** うでを ひろげる */
const SPREAD_FROM = 4.8
const SPREAD_TO = 5.5
const CHEER_FROM = 5.7
const CHEER_TO = 6.6
const INK = 6.8
const DONE = 10.4
const DURATION = 11

/** 子の 足もと・かた・あたま の場所 */
const FEET: readonly [number, number] = [29, 96]
const SHOULDER_L: readonly [number, number] = [23.5, 41]
const SHOULDER_R: readonly [number, number] = [34.5, 41]
const NECK: readonly [number, number] = [29, 36]
const UPPER_ARM = 10.5
const FORE_ARM = 10

/** 2つの色(#rrggbb)を k(0〜1)の割合で まぜる */
function blend(a: string, b: string, k: number): string {
  const parse = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))
  const [ar, ag, ab] = parse(a)
  const [br, bg, bb] = parse(b)
  const part = (x: number, y: number) =>
    Math.round(x + (y - x) * k)
      .toString(16)
      .padStart(2, '0')
  return `#${part(ar, br)}${part(ag, bg)}${part(ab, bb)}`
}

/** 空の ようす: dusk(夕やけ)と night(よる)の 度合い */
function skyState(t: number) {
  return { dusk: span(t, DUSK_FROM, DUSK_TO), night: span(t, NIGHT_FROM, NIGHT_TO) }
}

/** 昼 → 夕やけ → よる と かわる色 */
function tint(t: number, day: string, dusk: string, night: string): string {
  const s = skyState(t)
  return blend(blend(day, dusk, s.dusk), night, s.night)
}

/* ───────── 空・丘・地面 ───────── */

function Sky({ t }: SceneProps) {
  const show = span(t, 0, 0.4)
  const night = skyState(t).night
  // お日さまは 右の 丘の うしろへ しずむ
  const sunY = mix(t, 0.3, 2.4, 64, 114, easeInOut)
  return (
    <g opacity={show}>
      <rect x="-2" y="-2" width="113" height="104" fill={tint(t, '#ffd9a0', '#f0906d', '#27336f')} />
      {/* 地平線の ぼんやり した あかり */}
      <ellipse cx="84" cy="92" rx="48" ry="24" fill="#ffb067" opacity={0.55 * (1 - night)} />
      <circle cx="84" cy={sunY} r="12" fill="#ffe08a" opacity="0.5" />
      <circle cx="84" cy={sunY} r="8.6" fill={SUN} />
    </g>
  )
}

/** よる の空の 小さな 星。ちかちか ひかる */
const TINY_STARS: readonly (readonly [number, number])[] = [
  [9, 9], [26, 6], [40, 11], [71, 8], [86, 12], [101, 7], [102, 27], [8, 21],
]

function NightStars({ t }: SceneProps) {
  const night = span(t, NIGHT_FROM + 0.5, NIGHT_TO + 0.5)
  if (night <= 0) return null
  return (
    <g fill="#fff6c8" opacity={night}>
      {TINY_STARS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={Math.max(0, 0.9 + 0.35 * wave(t, 1.3, i * 0.37))} />
      ))}
    </g>
  )
}

function Land({ t }: SceneProps) {
  const show = span(t, 0, 0.5)
  return (
    <g opacity={show}>
      <path d="M-4 93 Q22 86 46 91 Q74 84 113 91 V112 H-4 Z" fill={tint(t, '#c9d98f', '#9fae7a', '#2f4a63')} />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={tint(t, '#c5e8a9', '#a8c58a', '#3c6a5c')} />
      {/* ふちの 下は 地面で うめる(しずんだ お日さまが のぞかないように) */}
      <rect x="-4" y="101" width="117" height="10" fill={tint(t, '#c5e8a9', '#a8c58a', '#3c6a5c')} />
      {[8, 46, 82, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={tint(t, '#55b86e', '#4a9a5c', '#2a6552')} />
      ))}
    </g>
  )
}

/** 夕ぐれの よこに ながい 雲(2画目)。右から ゆっくり ながれてくる */
function Cloud({ t }: SceneProps) {
  const drift = span(t, 0.7, 1.8, easeOut)
  if (drift <= 0) return null
  const fill = tint(t, '#fff0e0', '#ffc2a0', '#4c5a99')
  const shade = tint(t, '#f6dcc4', '#eba184', '#3a4784')
  return (
    <Layer x={30 * (1 - drift)} opacity={drift}>
      <g transform="rotate(-3.9 54 25)">
        <rect x="18" y="23.4" width="74" height="6.4" rx="3.2" fill={shade} />
        <rect x="18" y="22" width="74" height="6.2" rx="3.1" fill={fill} />
        <circle cx="36" cy="22.4" r="3.8" fill={fill} />
        <circle cx="50" cy="21.2" r="4.8" fill={fill} />
        <circle cx="68" cy="22.2" r="4" fill={fill} />
      </g>
    </Layer>
  )
}

/** 夕ぐれに おうちへ かえる 小鳥(空の たかい ところ) */
function Bird({ t }: SceneProps) {
  const p = span(t, 0.5, 2.8)
  if (p <= 0 || p >= 1) return null
  const x = 118 - p * 132
  const y = 9 + Math.sin(p * 6) * 1.6
  const flap = wave(t, 0.3) * 2.6
  return <path d={`M${x - 4} ${y - flap} Q${x - 2} ${y - 1.6} ${x} ${y} Q${x + 2} ${y - 1.6} ${x + 4} ${y - flap}`} fill="none" stroke={SHOE} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
}

/* ───────── おつきさま ───────── */

/** みかづき。そとがわ は 6画目、うちがわ は 5画目に そう */
const MOON_PATH = 'M60.5 33 C75 31 85 42 77 58 C70 73 54 84 37 92 C45 82 52 72 54 60 C55 50 57 42 60.5 33 Z'

function MoonBody({ t }: SceneProps) {
  const rise = span(t, RISE_FROM, RISE_TO, easeOut)
  if (rise <= 0) return null
  return (
    <Layer x={(1 - rise) * 12} y={(1 - rise) * 72}>
      <circle cx="60" cy="60" r="36" fill={MOON_GLOW} opacity="0.12" />
      <circle cx="60" cy="60" r="27" fill={MOON_GLOW} opacity="0.14" />
      <path d={MOON_PATH} fill={MOON_SHADE} transform="translate(1.6 1.4)" />
      <path d={MOON_PATH} fill={MOON} />
      {/* くぼみ(7画目) */}
      <ellipse cx="60.8" cy="52.6" rx="3.7" ry="2" transform="rotate(48 60.8 52.6)" fill={MOON_SHADE} />
    </Layer>
  )
}

/** 月あかりの おび(8画目)。おつきさまから 地面へ のびる */
function MoonBeam({ t }: SceneProps) {
  const beam = span(t, 5.1, 5.9, easeOut)
  if (beam <= 0) return null
  return (
    <Layer scale={beam} origin={[44, 62]} opacity={0.9}>
      {/* おつきさまの ふもとから ひろがって、地面で いちばん ひろい */}
      <path d="M44 61 L96 88 Q99 95 92 98 L41 68 Q40 64 44 61 Z" fill="#fff6c0" opacity="0.26" />
    </Layer>
  )
}

/** さいしょに ひかる 星(1画目)。たてに ながい きらり */
function FirstStar({ t }: SceneProps) {
  const pop = span(t, 5.0, 5.6, backOut)
  if (pop <= 0) return null
  const twinkle = 1 + 0.08 * wave(t, 0.9)
  return (
    <Layer x={53.2} y={17.2} scale={Math.max(0, pop) * twinkle}>
      <path d="M0 -7.4 Q0.9 -1.1 3.6 0 Q0.9 1.1 0 7.4 Q-0.9 1.1 -3.6 0 Q-0.9 -1.1 0 -7.4 Z" fill="#fff3a0" />
      <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
    </Layer>
  )
}

/* ───────── 子(主役) ───────── */

type Mood = 'happy' | 'worried' | 'surprised'
type ArmPose = { readonly swing: number; readonly bend: number }

const rad = (deg: number) => (deg * Math.PI) / 180
const lerpPose = (a: ArmPose, b: ArmPose, k: number): ArmPose => ({ swing: a.swing + (b.swing - a.swing) * k, bend: a.bend + (b.bend - a.bend) * k })

const RELAXED: ArmPose = { swing: 8, bend: 6 }
/** お日さまに てを ふる(右のうでを 上げる) */
const WAVING: ArmPose = { swing: 132, bend: 14 }
/** さむくて、うでで 体を だきしめる(手が むねの まんなかへ) */
const HUGGING: ArmPose = { swing: 28, bend: -128 }
/** うでを ひろげる(よこへ。右は 少し 高く) */
const SPREAD_LEFT: ArmPose = { swing: 97, bend: 6 }
const SPREAD_RIGHT: ArmPose = { swing: 112, bend: 8 }

/** かた から出て ひじ で まがる うで。side = ひだり(-1)・みぎ(+1)。swing = ま下から 外へ ひらいた角度 */
function Arm({ shoulder, side, pose, color }: { readonly shoulder: readonly [number, number]; readonly side: -1 | 1; readonly pose: ArmPose; readonly color: string }) {
  const elbow = [shoulder[0] + side * Math.sin(rad(pose.swing)) * UPPER_ARM, shoulder[1] + Math.cos(rad(pose.swing)) * UPPER_ARM] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] + side * Math.sin(rad(fore)) * FORE_ARM, elbow[1] + Math.cos(rad(fore)) * FORE_ARM] as const
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.2" fill={SKIN} />
    </>
  )
}

function Face({ mood, look }: { readonly mood: Mood; readonly look: number }) {
  const dx = look * 1.1
  return (
    <>
      <circle cx="24" cy="29.6" r="2" fill={CHEEK} opacity="0.55" />
      <circle cx="34" cy="29.6" r="2" fill={CHEEK} opacity="0.55" />
      {mood === 'happy' && (
        <>
          <path d={`M${24 + dx} 26.4 Q${25.6 + dx} 24.2 ${27.2 + dx} 26.4`} fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          <path d={`M${30.8 + dx} 26.4 Q${32.4 + dx} 24.2 ${34 + dx} 26.4`} fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M26 29.8 Q29 34 32 29.8 Z" fill={MOUTH} />
        </>
      )}
      {mood === 'worried' && (
        <>
          <circle cx={25.6 + dx} cy="26.4" r="1.2" fill={EYE} />
          <circle cx={32.4 + dx} cy="26.4" r="1.2" fill={EYE} />
          <path d="M23.2 23.8 L27 22.2 M31 22.2 L34.8 23.8" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M26.4 31.6 q1.15 -1.4 2.6 0 q1.45 1.4 2.6 0" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'surprised' && (
        <>
          <circle cx={25.6 + dx} cy="26.2" r="1.7" fill={EYE} />
          <circle cx={32.4 + dx} cy="26.2" r="1.7" fill={EYE} />
          <circle cx={25.1 + dx} cy="25.6" r="0.55" fill="#ffffff" />
          <circle cx={31.9 + dx} cy="25.6" r="0.55" fill="#ffffff" />
          <ellipse cx="29" cy="31.6" rx="1.4" ry="1.9" fill={MOUTH} />
        </>
      )}
    </>
  )
}

type KidProps = { readonly mood: Mood; readonly look: number; readonly headTilt: number; readonly left: ArmPose; readonly right: ArmPose }

function Kid({ mood, look, headTilt, left, right }: KidProps) {
  return (
    <>
      {/* あし(ふたつ) */}
      <rect x="23" y="62" width="5.6" height="33" rx="2.8" fill={PANTS_DARK} />
      <rect x="30.4" y="62" width="5.6" height="33" rx="2.8" fill={PANTS} />
      <ellipse cx="24.8" cy="95.4" rx="4.6" ry="2.5" fill={SHOE} />
      <ellipse cx="33.8" cy="95.4" rx="4.6" ry="2.5" fill={SHOE} />
      {/* くび: みじかく、どう の まんなか の上 */}
      <rect x="27" y="33" width="4" height="8" rx="2" fill={SKIN_SHADE} />
      {/* どう */}
      <rect x="21.6" y="37.6" width="14.8" height="29" rx="6.4" fill={TUNIC} />
      <path d="M23 62.6 h12" stroke={TUNIC_DARK} strokeWidth="1.6" strokeLinecap="round" />
      <Arm shoulder={SHOULDER_L} side={-1} pose={left} color={TUNIC_DARK} />
      <Arm shoulder={SHOULDER_R} side={1} pose={right} color={TUNIC_DARK} />
      {/* あたま */}
      <Layer rotate={headTilt} origin={NECK}>
        <circle cx="19.6" cy="27.4" r="2" fill={SKIN_SHADE} />
        <circle cx="38.4" cy="27.4" r="2" fill={SKIN_SHADE} />
        <circle cx="29" cy="26" r="9.5" fill={SKIN} />
        <Face mood={mood} look={look} />
        <path d="M19.4 24 C18.4 13.5 39.6 13.5 38.6 24 C36.5 20 32 19 29 20.5 C26 19 21.5 20 19.4 24 Z" fill={HAIR} />
        <path d="M28.2 16.4 Q27 12.8 29.6 12.2 Q29.4 14.4 30.8 16.2" fill={HAIR} />
      </Layer>
    </>
  )
}

/** さむくて ぶるぶる(体の りょうがわ) */
function Shiver({ t }: SceneProps) {
  const show = during(t, 2.4, NOTICE, 0.25)
  if (show <= 0) return null
  const dx = wave(t, 0.16) * 0.8
  return (
    <g opacity={show} fill="none" stroke="#9fb2e8" strokeWidth="1" strokeLinecap="round">
      <path d={`M${13 + dx} 46 q-1.6 2.4 0 4.8 M${10 + dx} 45 q-1.6 2.4 0 4.8`} />
      <path d={`M${45 + dx} 46 q1.6 2.4 0 4.8 M${48 + dx} 45 q1.6 2.4 0 4.8`} />
    </g>
  )
}

function Child({ t }: SceneProps) {
  const arrive = span(t, 0.15, 0.7, backOut)
  if (arrive <= 0) return null
  const mood: Mood = t < NIGHT_FROM ? 'happy' : t < NOTICE ? 'worried' : t < SPREAD_FROM ? 'surprised' : 'happy'
  // 見るほう: お日さま(右)→ 下 → おつきさま(右)
  const look = t < NIGHT_FROM ? 0.7 : t < NOTICE ? 0 : 1
  const wave1 = span(t, WAVE_FROM, WAVE_FROM + 0.4) * (1 - span(t, 1.7, 2.1))
  const hug = span(t, NIGHT_FROM, NIGHT_FROM + 0.5, easeOut)
  const spread = span(t, SPREAD_FROM, SPREAD_TO, easeOut)
  const shake = wave(t, 0.16) * 2.5 * during(t, 2.4, NOTICE, 0.25)
  const hop = Math.abs(Math.sin(span(t, CHEER_FROM, CHEER_TO) * Math.PI * 2))
  const flap = hop * 5 + wave(t, 0.5) * 12 * wave1
  const base = lerpPose(RELAXED, WAVING, wave1)
  const rightAfter = lerpPose(lerpPose(base, HUGGING, hug), SPREAD_RIGHT, spread)
  const leftAfter = lerpPose(lerpPose(RELAXED, HUGGING, hug), SPREAD_LEFT, spread)
  const right: ArmPose = { swing: rightAfter.swing + shake + flap, bend: rightAfter.bend }
  const left: ArmPose = { swing: leftAfter.swing - shake + hop * 5, bend: leftAfter.bend }
  const headTilt = t < NIGHT_FROM ? 3 : t < NOTICE ? -3 : t < SPREAD_FROM ? -7 : 3 + hop * 2
  return (
    <>
      <ellipse cx="29" cy="97" rx={10 * arrive} ry="2.3" fill="#000000" opacity="0.14" />
      <Layer scale={arrive} y={-hop * 3.4} origin={FEET}>
        <Kid mood={mood} look={look} headTilt={headTilt} left={left} right={right} />
      </Layer>
      <Shiver t={t} />
    </>
  )
}

/** おつきさまが 出て うれしい しゅんかんの きらきら(おつきさまの まわり) */
function Cheer({ t }: SceneProps) {
  const show = during(t, 5.4, 6.8, 0.25)
  if (show <= 0) return null
  const spin = t * 60
  return (
    <g opacity={show}>
      <Star cx={86} cy={50} r={2.8 + wave(t, 0.7) * 0.6} color="#ffe27a" spin={spin} />
      <Star cx={84} cy={72} r={2.2 + wave(t, 0.6, 0.3) * 0.5} color="#ffffff" spin={-spin} />
      <Star cx={44} cy={38} r={2.2 + wave(t, 0.8, 0.5) * 0.5} color="#ffe27a" spin={spin} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.05
  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <NightStars t={t} />
        <MoonBody t={t} />
        <Cloud t={t} />
        <Bird t={t} />
        <Land t={t} />
        <MoonBeam t={t} />
        <FirstStar t={t} />
        <Child t={t} />
        <Cheer t={t} />
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
    { at: 0, label: '夕やけ。子が お日さまに てを ふる', sound: 'pop' },
    { at: NIGHT_FROM, label: 'お日さまが しずんで、くらくなる。こわくて ぎゅっ' },
    { at: RISE_FROM, label: '丘の うしろから おつきさまが のぼる', sound: 'pop' },
    { at: SPREAD_FROM, label: '気づいて、うでを ひろげて にっこり。わきの したに おつきさま' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '夜 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
