/*
 * 夕(ゆうがた): 日が しずんで、空に 三日月が 出てくる。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … 三日月の 内がわの ふち(へこんだ ほう)
 *   2画目(ノ)  … 三日月の 外がわの ふち(まるく ふくらんだ ほう)
 *   3画目(丶)  … 月の 表面の くぼみ(クレーター)
 *
 * ながれ
 *   ゆうやけの 空。お日さまが しずんでいき、カラスが 巣へ かえる
 *   → うさぎは 一日あそんで あくび。くらくなって、ちょっと しょんぼり
 *   → 丘の うしろから、三日月が ゆっくり のぼってくる
 *   → うさぎが 気づいて びっくり。うれしくて ぴょんぴょん はねる(星も ひかりだす)
 *   → 三日月の ほねが ひかって、絵が うすくなり、字「夕」が のこる
 *
 * 三日月は、ほんものの つくり を守る: 両はしが とがって、外がわは まるく、内がわは へこむ。
 * うさぎは、耳が 頭の上から 長く のびて、うれしいと 耳が ぴんと立ち、ねむいと うしろへ たれる。
 * 月が 夕方の 空に 出る、という 話なので、さいごに 絵が 字の形と だいたい 重なれば よい。
 */
import { backOut, during, easeIn, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '夕'

const SUN = '#ff9f4a'
const SUN_LIGHT = '#ffd27a'
const MOON = '#ffe27a'
const MOON_SHADE = '#f0c24a'
const CRATER = '#f2cc5a'
const HALO = '#fff3b8'
const CROW = '#4a3d6a'
const CLOUD = '#ffd7c8'
const FUR = '#f6f1ea'
const FUR_SHADE = '#e0d6ca'
const EAR_IN = '#ffb9c0'
const EYE = '#2b2b2b'
const NOSE = '#f08a95'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const SUNSET = 2.8
const YAWN = 1.2
/** 三日月が 丘の うしろから のぼりはじめる / のぼりおわる */
const RISE = 3.0
const RISEN = 5.0
/** うさぎが 月に 気づく */
const NOTICE = 3.6
const HAPPY = 4.8
const INK = 6.2
const DONE = 8.6
const DURATION = 9.2

/** 月が のぼるときの さいしょの しずみぐあい(丘の下に かくれている高さ) */
const MOON_DROP = 72
/** 月の 内がわの ふち と 外がわの ふち(画の線に そわせて 描く) */
const MOON_PATH =
  'M57 13.6 C71 15.5 82 24 77.4 36 C70 56 48.6 78.4 17.8 93 C34 80 52 58 58 38 C60.5 30 59.5 21 57 13.6 Z'
/** 月の くぼみ(3画目の 場所) */
const CRATER_AT: readonly [number, number] = [66.5, 38.5]
const CRATER_ANGLE = 60

/** うさぎの 場所(足もと)と、頭の じく(くび) */
const NECK: readonly [number, number] = [84, 86]

/** #rrggbb を 2つ まぜる(空の色の かわりぐあい に使う) */
function lerpColor(a: string, b: string, k: number): string {
  const pick = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
  const ch = (i: number) => Math.round(pick(a, i) + (pick(b, i) - pick(a, i)) * Math.min(Math.max(k, 0), 1))
  return `rgb(${ch(0)} ${ch(1)} ${ch(2)})`
}

/** 空の いろ: ひるの あかるさ → ゆうやけ → 夜の はじまり */
function skyColor(t: number): string {
  const sunset = lerpColor('#ffe9bd', '#ffb98a', span(t, 0.2, 1.8))
  return t < 1.8 ? sunset : lerpColor('#ffb98a', '#7d78c0', span(t, 1.8, 4.2))
}

function Sky({ t }: SceneProps) {
  const fade = span(t, 0, 0.5, easeOut)
  return <rect x="0" y="0" width="109" height="109" fill={skyColor(t)} opacity={fade} />
}

/** お日さま: 丘の うしろへ しずんでいく。まわりに ほんのり ひかり */
function Sun({ t }: SceneProps) {
  const down = span(t, 0.3, SUNSET, easeIn)
  const y = 44 + down * 62
  return (
    <>
      <circle cx="96" cy={y} r={13 - down * 2} fill={SUN_LIGHT} opacity="0.4" />
      <circle cx="96" cy={y} r="8" fill={SUN} />
    </>
  )
}

/** ゆうやけ雲: ゆっくり ながれて、くらくなると うすくなる */
function EveningCloud({ t }: SceneProps) {
  const fade = span(t, 0.3, 0.9) * (1 - 0.7 * span(t, 2.0, 4.2))
  const x = 4 + t * 0.8
  return (
    <g opacity={fade} fill={CLOUD}>
      <ellipse cx={x + 8} cy="31" rx="8" ry="3.2" />
      <ellipse cx={x + 6} cy="28.6" rx="4.6" ry="3.2" />
      <ellipse cx={x + 11.5} cy="29" rx="3.8" ry="2.8" />
    </g>
  )
}

/** カラス: 巣へ かえっていく(左へ とんでいく)。はねを ぱたぱた */
function Crow({ t }: SceneProps) {
  const p = span(t, 0.6, 3.4)
  if (p <= 0 || p >= 1) return null
  const x = 118 - p * 132
  const y = 17 + Math.sin(p * 5) * 2
  const flap = wave(t, 0.45)
  return (
    <Layer x={x} y={y}>
      <ellipse cx="0" cy="0" rx="2.4" ry="1.2" fill={CROW} />
      <circle cx="-2.4" cy="-0.5" r="1.1" fill={CROW} />
      <path d="M-3.4 -0.4 l-1.6 0.5 l1.6 0.4 Z" fill={CROW} />
      <path d={`M-0.6 -0.4 Q-0.4 ${-4.4 * flap - 1.2} 3.2 ${-3 * flap - 0.6} Q1.4 -0.6 -0.6 -0.4 Z`} fill={CROW} />
    </Layer>
  )
}

/** 夜が くると ひかりだす 星 */
function Stars({ t }: SceneProps) {
  const night = span(t, 4.0, 5.2)
  if (night <= 0) return null
  const spots: readonly (readonly [number, number, number])[] = [
    [12, 12, 0],
    [36, 6, 0.3],
    [66, 7, 0.6],
    [97, 18, 0.2],
    [102, 37, 0.5],
    [10, 55, 0.8],
  ]
  return (
    <g opacity={night}>
      {spots.map(([cx, cy, phase], i) => (
        <Star key={i} cx={cx} cy={cy} r={2.1 + wave(t, 1.4, phase * 3) * 0.7} color="#fff6c8" spin={0} />
      ))}
    </g>
  )
}

/** 三日月: 丘の うしろから ゆっくり のぼってくる。まわりに やわらかい ひかり */
function CrescentMoon({ t }: SceneProps) {
  const rise = span(t, RISE, RISEN, easeOut)
  if (rise <= 0) return null
  const glow = (0.14 + wave(t, 2.4) * 0.03) * span(t, RISE, RISEN)
  return (
    <Layer y={(1 - rise) * MOON_DROP}>
      <circle cx="46" cy="52" r="44" fill={HALO} opacity={glow * 0.6} />
      <circle cx="46" cy="52" r="36" fill={HALO} opacity={glow * 0.8} />
      <circle cx="46" cy="52" r="28" fill={HALO} opacity={glow} />
      <path d={MOON_PATH} fill={MOON_SHADE} transform="translate(1.5 1.2)" />
      <path d={MOON_PATH} fill={MOON} />
      <ellipse cx={CRATER_AT[0]} cy={CRATER_AT[1]} rx="3.2" ry="1.9" fill={CRATER} transform={`rotate(${CRATER_ANGLE} ${CRATER_AT[0]} ${CRATER_AT[1]})`} />
    </Layer>
  )
}

/** じめん: 丘。夕やけから 夜に かけて、色が しずむ */
function Ground({ t }: SceneProps) {
  const dusk = span(t, 1.2, 4.2)
  const grow = span(t, 0, 0.6, easeOut)
  const grass = lerpColor('#a8d98a', '#4f8a62', dusk)
  return (
    <Layer scaleY={grow} origin={[54, 109]}>
      <path d="M-4 96 Q18 91.5 44 94.5 Q72 90.5 113 93.5 V113 H-4 Z" fill={grass} />
      {[8, 46, 82, 102].map((x) => (
        <path key={x} d={`M${x} 98 l1.4 -3.4 l1 3 l1.6 -4 l0.8 4.4 Z`} fill={lerpColor('#7cc866', '#3b7552', dusk)} />
      ))}
    </Layer>
  )
}

type Mood = 'sleepy' | 'yawn' | 'surprised' | 'happy'

/** うさぎ: 耳は 頭の上から 長く のびる。ねむいと たれ、気づくと ぴん と立つ */
function Rabbit({ t }: SceneProps) {
  const pop = span(t, 0.5, 1.0, backOut)
  if (pop <= 0) return null
  const mood: Mood = t >= HAPPY ? 'happy' : t >= NOTICE ? 'surprised' : t >= YAWN && t < YAWN + 1.2 ? 'yawn' : 'sleepy'
  // 耳: ねむい間は うしろへ たれ、月に 気づくと ぴん と立つ
  const nearEar = mix(t, NOTICE + 0.05, NOTICE + 0.45, 58, -4, backOut) + (t >= HAPPY ? wave(t, 0.6) * 3 : 0)
  const farEar = mix(t, NOTICE + 0.05, NOTICE + 0.45, 68, 7, backOut) + (t >= HAPPY ? wave(t, 0.6, 0.2) * 3 : 0)
  // 頭: うつむく → あくびで 少し 上 → 月を 見上げる
  const headTilt = t < NOTICE ? -6 + span(t, YAWN, YAWN + 0.5) * 12 - span(t, YAWN + 1.2, YAWN + 1.8) * 12 : mix(t, NOTICE, NOTICE + 0.6, -6, 24, easeOut) - span(t, HAPPY, HAPPY + 0.5) * 12
  // うれしくて 2回 ぴょんぴょん
  const hopping = t >= HAPPY && t < HAPPY + 1.2
  const hop = hopping ? Math.abs(Math.sin(((t - HAPPY) / 0.6) * Math.PI)) * 3.4 : 0
  const mouthOpen = mood === 'yawn' ? Math.sin(span(t, YAWN, YAWN + 1.2) * Math.PI) : 0
  return (
    <Layer scale={pop} origin={[88, 96]}>
      <ellipse cx="88" cy="96.6" rx="11" ry="2.2" fill="#000000" opacity="0.12" />
      <Layer y={-hop}>
        {/* しっぽ・うしろ足・どう */}
        <circle cx="97.4" cy="87" r="3" fill="#ffffff" />
        <ellipse cx="89.4" cy="88.4" rx="9.6" ry="7.6" fill={FUR} />
        <ellipse cx="91.4" cy="91.6" rx="6.2" ry="4.2" fill={FUR_SHADE} />
        <ellipse cx="91" cy="95.2" rx="6.2" ry="2.3" fill={FUR} />
        <ellipse cx="80" cy="95.6" rx="3.4" ry="1.8" fill={FUR} />
        {/* あたま(くびを じくに かたむける) */}
        <Layer rotate={headTilt} origin={NECK}>
          <Layer x={79.2} y={76} rotate={farEar}>
            <ellipse cx="0" cy="-6.2" rx="2.2" ry="6.6" fill={FUR_SHADE} />
          </Layer>
          <circle cx="80.2" cy="81" r="6.6" fill={FUR} />
          <Layer x={82.6} y={75.6} rotate={nearEar}>
            <ellipse cx="0" cy="-6.6" rx="2.4" ry="7" fill={FUR} />
            <ellipse cx="0" cy="-6.2" rx="1.1" ry="4.8" fill={EAR_IN} />
          </Layer>
          <circle cx="79.6" cy="83.6" r="1.9" fill={CHEEK} opacity="0.5" />
          <ellipse cx="73.8" cy="82" rx="1.3" ry="1" fill={NOSE} />
          <Face mood={mood} open={mouthOpen} />
        </Layer>
      </Layer>
    </Layer>
  )
}

/** 顔: 気もちで 目と口が かわる */
function Face({ mood, open }: { readonly mood: Mood; readonly open: number }) {
  return (
    <>
      {mood === 'sleepy' && (
        <>
          <path d="M76 80.6 Q77.6 82 79.2 80.6" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M74.6 84.6 q1.5 -0.7 3 0" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
        </>
      )}
      {mood === 'yawn' && (
        <>
          <path d="M76 80.6 Q77.6 82 79.2 80.6" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <ellipse cx="76.4" cy="85" rx={1 + open * 1.1} ry={0.8 + open * 2.2} fill={MOUTH} />
        </>
      )}
      {mood === 'surprised' && (
        <>
          <circle cx="77.6" cy="79.8" r="1.9" fill={EYE} />
          <circle cx="77.1" cy="79.2" r="0.6" fill="#ffffff" />
          <ellipse cx="76.2" cy="85" rx="0.9" ry="1.3" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M75.8 80.4 Q77.6 77.8 79.4 80.4" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M74.8 84 Q76.4 86.4 78.4 84.2" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
    </>
  )
}

/** あくびの ときの ねむけ「ふわぁ」: 頭の 上に ふんわり 息 */
function Breath({ t }: SceneProps) {
  const show = during(t, YAWN + 0.3, YAWN + 1.5, 0.25)
  if (show <= 0) return null
  const p = span(t, YAWN + 0.3, YAWN + 1.5, easeOut)
  return (
    <g opacity={show * 0.9}>
      <ellipse cx={72 - p * 7} cy={80 - p * 6} rx={2.2 + p * 1.8} ry={1.6 + p * 1.2} fill="#ffffff" stroke="#e6d8cc" strokeWidth="0.6" />
      <ellipse cx={76 - p * 4} cy={77 - p * 3} rx={1.1 + p * 0.8} ry={0.8 + p * 0.5} fill="#ffffff" stroke="#e6d8cc" strokeWidth="0.5" />
    </g>
  )
}

/** 月に 気づいた しゅんかんの「!」 */
function Notice({ t }: SceneProps) {
  const show = during(t, NOTICE, NOTICE + 0.9, 0.12)
  if (show <= 0) return null
  const pop = span(t, NOTICE, NOTICE + 0.25, backOut)
  return (
    <Layer x={92} y={62} scale={Math.max(0, pop)} origin={[0, 8]} opacity={show}>
      <rect x="-1.2" y="-6" width="2.4" height="7" rx="1.2" fill="#e8534a" />
      <circle cx="0" cy="3.6" r="1.4" fill="#e8534a" />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 3)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Stars t={t} />
        <EveningCloud t={t} />
        <Sun t={t} />
        <Crow t={t} />
        <CrescentMoon t={t} />
        <Ground t={t} />
        <Rabbit t={t} />
        <Breath t={t} />
        <Notice t={t} />
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
    { at: 0, label: 'ゆうやけ。お日さまが しずんでいく', sound: 'pop' },
    { at: YAWN, label: 'うさぎが ふわぁ と あくび' },
    { at: RISE, label: '丘の うしろから 三日月が のぼる', sound: 'pop' },
    { at: NOTICE, label: 'うさぎが 気づいて びっくり' },
    { at: HAPPY, label: 'うれしくて ぴょんぴょん。星も ひかる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '夕 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
