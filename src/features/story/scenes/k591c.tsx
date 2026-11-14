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
 * 子は Person(正面)。うでは 角度({ swing, bend })と { to }(だきしめる)で まぜる。
 * うでを ひろげるのは「はなしの なかの しぐさ」で、字の線とは だいたい 同じ向き で よい。
 * 空・丘・星 は Backdrop(time で 昼 → 夕やけ → 夜)、小鳥は Bird。月・雲・1つめの星 は 字の ほね なので 場面で 描く。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, Bird, byTime, LOOKS, mixLimb, Person, type Expression, type Limb, type LimbAngles } from '../sceneFigures'

const CHAR = '夜'

const TUNIC = '#f0a04b'
const MOON = '#fff3b0'
const MOON_SHADE = '#f2d874'
const MOON_GLOW = '#ffe98a'
const KID_LOOK = { ...LOOKS.boy, top: TUNIC, bottom: '#4a6a9c' } as const

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

/** 子の 足もと・背の高さ(正面) */
const FEET: readonly [number, number] = [29, 96]
const KID_HEIGHT = 72
/** さむくて うでで 体を だきしめる とき の 手(むねの 前) */
const HUG_Y = 54

/** 昼 → 夕やけ → よる を あらわす time(0 = 昼、1 = 夕やけ、2 = よる) */
const skyTime = (t: number): number => span(t, DUSK_FROM, DUSK_TO) + span(t, NIGHT_FROM, NIGHT_TO)

/* ───────── 空に うかぶ 字の ほね ───────── */

/** 夕ぐれの よこに ながい 雲(2画目)。右から ゆっくり ながれてくる */
function LongCloud({ t }: { readonly t: number }) {
  const drift = span(t, 0.7, 1.8, easeOut)
  if (drift <= 0) return null
  const time = skyTime(t)
  const fill = byTime(time, '#fff0e0', '#ffc2a0', '#4c5a99')
  const shade = byTime(time, '#f6dcc4', '#eba184', '#3a4784')
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

/** みかづき。そとがわ は 6画目、うちがわ は 5画目に そう */
const MOON_PATH = 'M60.5 33 C75 31 85 42 77 58 C70 73 54 84 37 92 C45 82 52 72 54 60 C55 50 57 42 60.5 33 Z'

function MoonBody({ t }: { readonly t: number }) {
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
function MoonBeam({ t }: { readonly t: number }) {
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
function FirstStar({ t }: { readonly t: number }) {
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

/** お日さまに てを ふる(うでを 上げる) */
const waving = (flap: number): LimbAngles => ({ swing: 132 + flap, bend: 14 })
/** さむくて、うでで 体を だきしめる(手が むねの まんなかへ。左右の 手が かさなる) */
const HUG_SCREEN_LEFT: Limb = { to: [31, HUG_Y] }
const HUG_SCREEN_RIGHT: Limb = { to: [27, HUG_Y + 1] }

/** さむくて ぶるぶる(体の りょうがわ) */
function Shiver({ t }: { readonly t: number }) {
  const show = during(t, 2.4, NOTICE, 0.25)
  if (show <= 0) return null
  const dx = wave(t, 0.16) * 0.8
  return (
    <g opacity={show} fill="none" stroke="#9fb2e8" strokeWidth="1" strokeLinecap="round">
      <path d={`M${7 + dx} 46 q-1.6 2.4 0 4.8 M${4 + dx} 45 q-1.6 2.4 0 4.8`} />
      <path d={`M${51 + dx} 46 q1.6 2.4 0 4.8 M${54 + dx} 45 q1.6 2.4 0 4.8`} />
    </g>
  )
}

function Child({ t }: { readonly t: number }) {
  const arrive = span(t, 0.15, 0.7, backOut)
  if (arrive <= 0) return null
  const face: Expression = t < NIGHT_FROM ? 'smile' : t < NOTICE ? 'worried' : t < SPREAD_FROM ? 'surprised' : 'smile'
  // 見るほう: お日さま(右)→ 下 → おつきさま(右)
  const gaze = t < NIGHT_FROM ? 0.7 : t < NOTICE ? 0 : 1
  const wave1 = span(t, WAVE_FROM, WAVE_FROM + 0.4) * (1 - span(t, 1.7, 2.1))
  const hug = span(t, NIGHT_FROM, NIGHT_FROM + 0.5, easeOut)
  const spread = span(t, SPREAD_FROM, SPREAD_TO, easeOut)
  const hop = Math.abs(Math.sin(span(t, CHEER_FROM, CHEER_TO) * Math.PI * 2))
  const flap = hop * 5 + wave(t, 0.5) * 12 * wave1
  const lift = hop * 3.4
  const head = t < NIGHT_FROM ? 3 : t < NOTICE ? -3 : t < SPREAD_FROM ? -7 : 3 + hop * 2
  // 画面の 右の うで = 人の 左うで。お日さま(右)に てを ふり、ひろげる ときは すこし 高く
  const leftArm = mixLimb(mixLimb(mixLimb(HANG_REST, waving(flap), wave1), HUG_SCREEN_LEFT, hug), { swing: 112 + hop * 5, bend: 8 }, spread)
  // 画面の 左の うで = 人の 右うで
  const rightArm = mixLimb(mixLimb(HANG_REST, HUG_SCREEN_RIGHT, hug), { swing: 97 - hop * 5, bend: 6 }, spread)
  const shake = wave(t, 0.16) * 0.8 * during(t, 2.4, NOTICE, 0.25)
  return (
    <Layer scale={arrive} origin={FEET}>
      <Person x={FEET[0]} y={FEET[1]} height={KID_HEIGHT} build="child" facing="front" look={KID_LOOK} face={face} gaze={gaze} lean={shake} lift={lift} pose={{ leftArm, rightArm, head }} />
    </Layer>
  )
}

const HANG_REST: LimbAngles = { swing: 8, bend: 6 }

/** おつきさまが 出て うれしい しゅんかんの きらきら(おつきさまの まわり) */
function Cheer({ t }: { readonly t: number }) {
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
  // お日さまは 右の 丘の うしろへ しずむ
  const sunY = mix(t, 0.3, 2.4, 64, 114, easeInOut)
  const birdP = span(t, 0.5, 2.8)
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[84, sunY]} clouds={[]} tufts={[8, 46, 82, 100]} time={skyTime(t)} moon={null} />
        <MoonBody t={t} />
        <LongCloud t={t} />
        {birdP > 0 && birdP < 1 && <Bird x={118 - birdP * 132} y={9 + Math.sin(birdP * 6) * 1.6} t={t} flying facing="left" size={0.9} />}
        <MoonBeam t={t} />
        <FirstStar t={t} />
        <Child t={t} />
        <Shiver t={t} />
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
