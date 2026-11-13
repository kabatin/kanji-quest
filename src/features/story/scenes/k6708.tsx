/*
 * 月(つき): かけた 月の形。夜に ひかる。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ→)  … かけた 月(みかづき)の、まるく ふくらんだ 左がわの ふち
 *   2画目(┐)    … 月の かけた ところ(右がわ)。みかづきの 2つの とがった先を むすぶ 線
 *                  (かげになって 見えない 部分 が、うっすら まるく のこっている)
 *   3・4画目(一) … 月の 前を ゆっくり よこぎる、2本の ほそい 夜の雲
 *
 * ながれ
 *   くらい 夜。小さな うさぎが ひとりで こわくて ぶるぶる ふるえている
 *   → 空に 月が のぼってくる(かけた 月。かげの 部分は うっすら 見える)
 *   → うさぎが 気づいて 見あげる。ひかりが ひろがり、夜が あかるくなる
 *   → あんしんして にっこり。うれしくて ぴょんぴょん はねる。月の 前を 雲が よこぎる
 *   → 月の ふち が ひかって、絵が うすくなり、字「月」が のこる
 *
 * 月と うさぎは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   みかづき は、まるい 月から まるい かげを ひいた 形(2つの 円の ちがい)。ふくらみは 左、とがった先は 右。
 *   うさぎは 耳が 長く、こわいと うしろへ たれ、うれしいと ぴんと 立つ。まえあし は 地面に ついて すわる。
 */
import { backOut, during, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '月'

const NIGHT = '#27324f'
const NIGHT_LIT = '#3d4f80'
const STAR = '#fff6c8'
const MOON = '#ffe58a'
const MOON_CRATER = '#f2cd68'
const MOON_GHOST = '#8e9bc9'
const CLOUD = '#e3e9f8'
const CLOUD_SHADE = '#b9c4e0'
const GROUND_DARK = '#2c5446'
const GROUND_LIT = '#8fd0a0'
const GRASS_DARK = '#3d7a5c'
const GRASS_LIT = '#c5e8a9'
const FUR = '#f6f1e8'
const FUR_SHADE = '#e1d7c6'
const BELLY = '#fffaf0'
const EAR_INNER = '#f5b5b5'
const EYE = '#2b2b2b'
const NOSE = '#f08a8a'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const SWEAT = '#7cc4f2'

/** くぎり の時間(秒) */
const LOOK_AROUND = 1.0
/** 月が じめんの 下から のぼりはじめる */
const RISE = 2.2
/** うさぎが 月に 気づく */
const NOTICE = 2.9
/** 気づいて あんしんする */
const RELIEF = 3.8
const HOP = 4.5
const CLOUDS = 4.0
const INK = 6.4
const DONE = 9.1
const DURATION = 9.8

/** 月の もとの まるい 形(かげの 部分も ふくむ)の まんなかと 半径 */
const FULL: readonly [number, number] = [62, 54]
const FULL_R = 40
/** かげ(かけた 部分)を つくる まるい 円(まんなかは (92, 54))。この円の 外が ひかっている */
const SHADOW_R = 40
/** 2つの円が まじわる 2つの とがった先(みかづきの 上と 下) */
const TIP_TOP: readonly [number, number] = [77, 16.9]
const TIP_BOTTOM: readonly [number, number] = [77, 91.1]

/** みかづき: 左へ ふくらんだ 大きな 円の ふち と、かげの円の まるい へこみ */
const CRESCENT = `M${TIP_TOP[0]} ${TIP_TOP[1]} A${FULL_R} ${FULL_R} 0 1 0 ${TIP_BOTTOM[0]} ${TIP_BOTTOM[1]} A${SHADOW_R} ${SHADOW_R} 0 0 1 ${TIP_TOP[0]} ${TIP_TOP[1]} Z`

/** 空の ほし: x, y, 大きさ, ちかちか の ずれ */
const STARS: readonly (readonly [number, number, number, number])[] = [
  [10, 12, 1.6, 0],
  [18, 31, 1.2, 0.35],
  [51, 6.5, 1.3, 0.7],
  [93, 9, 1.7, 0.2],
  [101, 33, 1.3, 0.55],
  [8, 62, 1.4, 0.85],
]

function Sky({ t, lit }: SceneProps & { readonly lit: number }) {
  return (
    <>
      <rect x="-2" y="-2" width="113" height="113" fill={NIGHT} />
      <rect x="-2" y="-2" width="113" height="113" fill={NIGHT_LIT} opacity={lit * 0.85} />
      {STARS.map(([x, y, size, phase], i) => (
        <Star key={i} cx={x} cy={y} r={size * (1.5 + 0.5 * wave(t, 2.2, phase * 3)) * span(t, 0.3 + i * 0.12, 0.9 + i * 0.12)} color={STAR} />
      ))}
    </>
  )
}

/** みかづき。じめんの 下から のぼってきて、ひかりが ひろがる。 */
function Moon({ t, lit, rise }: SceneProps & { readonly lit: number; readonly rise: number }) {
  if (t < RISE) return null
  const glow = lit * (0.9 + 0.1 * wave(t, 1.6))
  return (
    <Layer y={rise}>
      {/* かけた ところ: かげに なって 見えにくいけど、うっすら まるく のこっている */}
      <circle cx={FULL[0]} cy={FULL[1]} r={FULL_R} fill={MOON_GHOST} opacity={0.2 * lit} />
      <g fill={MOON} opacity={0.07 * glow}>
        <circle cx="46" cy="54" r="52" />
        <circle cx="46" cy="54" r="60" />
        <circle cx="46" cy="54" r="68" />
      </g>
      <path d={CRESCENT} fill={MOON} />
      <g fill={MOON_CRATER}>
        <circle cx="31" cy="46" r="3" />
        <circle cx="30" cy="70" r="3.6" />
        <circle cx="45" cy="80" r="2.4" />
        <circle cx="42" cy="26" r="2.2" />
      </g>
    </Layer>
  )
}

/** 月の 前を よこぎる ほそい 雲(3・4画目の 位置で とまる) */
function NightClouds({ t }: SceneProps) {
  const appear = span(t, CLOUDS - 0.1, CLOUDS + 0.5)
  if (appear <= 0) return null
  const drift = span(t, CLOUDS, INK - 0.5, easeOut)
  const puffs = [
    [3, 45, 36.2, 2.8],
    [3, 55, 34.4, 3.4],
    [3, 66, 33.2, 2.6],
    [4, 48, 56.2, 2.6],
    [4, 60, 54.4, 3.2],
    [4, 70, 53.2, 2.4],
  ] as const
  return (
    <Layer x={-46 * (1 - drift)} opacity={appear}>
      {[3, 4].map((n) => (
        <g key={n}>
          <g transform="translate(0 1.1)">
            <Bone char={CHAR} n={n} color={CLOUD_SHADE} width={3.6} />
          </g>
          <Bone char={CHAR} n={n} color={CLOUD} width={3.6} />
          {puffs
            .filter(([stroke]) => stroke === n)
            .map(([, cx, cy, r]) => (
              <circle key={cx} cx={cx} cy={cy} r={r} fill={CLOUD} />
            ))}
        </g>
      ))}
    </Layer>
  )
}

function Ground({ lit }: { readonly lit: number }) {
  const ridge = 'M-2 95 Q25 90.5 52 94 T112 92 V112 H-2 Z'
  const tufts = [6, 30, 62, 100]
  return (
    <>
      <path d={ridge} fill={GROUND_DARK} />
      <path d={ridge} fill={GROUND_LIT} opacity={lit} />
      {tufts.map((x) => (
        <path key={x} d={`M${x} 98 l1.4 -3.8 l1 3.2 l1.6 -4.4 l0.8 4.8 Z`} fill={GRASS_DARK} />
      ))}
      <g opacity={lit}>
        {tufts.map((x) => (
          <path key={x} d={`M${x} 98 l1.4 -3.8 l1 3.2 l1.6 -4.4 l0.8 4.8 Z`} fill={GRASS_LIT} />
        ))}
      </g>
    </>
  )
}

type Mood = 'scared' | 'surprised' | 'happy'

type RabbitProps = {
  readonly mood: Mood
  /** 耳の 立ちぐあい(0 = うしろへ たれる / 1 = ぴんと 立つ) */
  readonly perk: number
  readonly headTilt: number
  readonly shake: number
  readonly hop: number
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <ellipse cx="85.6" cy="72.4" rx="2.1" ry="1.6" fill={CHEEK} opacity="0.5" />
      {mood === 'happy' ? (
        <>
          <path d="M82.8 66.4 Q84.6 63.8 86.4 66.4" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M79.6 73.4 Q82 76.2 84.8 73.6" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="84.6" cy="66.4" r={mood === 'surprised' ? 1.9 : 1.5} fill={EYE} />
          <circle cx="84.1" cy="65.8" r="0.55" fill="#ffffff" />
          {mood === 'scared' ? (
            <>
              <path d="M82.2 62.6 L87 64.2" stroke={FUR_SHADE} strokeWidth="1.1" strokeLinecap="round" />
              <path d="M80.4 74.4 q1.2 -1.2 2.4 0 q1.2 1.2 2.4 0" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
            </>
          ) : (
            <ellipse cx="82.2" cy="74.4" rx="1.1" ry="1.5" fill={MOUTH} />
          )}
        </>
      )}
      <circle cx="78.6" cy="70.2" r="1.15" fill={NOSE} />
    </>
  )
}

/** すわっている うさぎ(左むき)。耳は あたまの 上から、まえあしは 地面へ。 */
function Rabbit({ mood, perk, headTilt, shake, hop }: RabbitProps) {
  // 耳: ぴんと 立つと ほぼ ま上、たれると うしろ(右)へ ねる
  const nearEar = (1 - perk) * 72 - 4
  const farEar = (1 - perk) * 60 + 6
  return (
    <>
      <ellipse cx="94" cy="97" rx={12 - hop * 0.5} ry="2.2" fill="#000000" opacity="0.2" />
      <Layer x={shake} y={-hop}>
        <circle cx="103" cy="87.4" r="3.4" fill={BELLY} />
        {/* うしろあし: ふとももから まえへ ながい 足 */}
        <ellipse cx="96" cy="88" rx="8" ry="7.4" fill={FUR_SHADE} />
        <ellipse cx="91" cy="95.2" rx="7" ry="2.7" fill={FUR} />
        <ellipse cx="93.5" cy="83" rx="8.6" ry="11" fill={FUR} />
        <ellipse cx="89.4" cy="85" rx="4.6" ry="7.6" fill={BELLY} />
        {/* まえあし */}
        <rect x="85.8" y="84" width="4" height="10.4" rx="2" fill={FUR} />
        <ellipse cx="86.8" cy="94.6" rx="3.4" ry="2" fill={FUR} />
        <Layer rotate={headTilt} origin={[91, 75]}>
          <Layer rotate={farEar} origin={[91, 62]}>
            <ellipse cx="91" cy="53" rx="3" ry="9.5" fill={FUR_SHADE} />
          </Layer>
          <Layer rotate={nearEar} origin={[87.2, 62]}>
            <ellipse cx="87.2" cy="53" rx="3.2" ry="9.8" fill={FUR} />
            <ellipse cx="87.2" cy="53.4" rx="1.5" ry="6.8" fill={EAR_INNER} />
          </Layer>
          <circle cx="88" cy="69" r="8.6" fill={FUR} />
          <ellipse cx="82" cy="71.6" rx="4.2" ry="3.4" fill={BELLY} />
          <Face mood={mood} />
        </Layer>
      </Layer>
    </>
  )
}

/** こわくて ふるえる ときの ぶるぶる と あせ */
function Shiver({ t, fear }: SceneProps & { readonly fear: number }) {
  if (fear <= 0) return null
  const pulse = Math.abs(wave(t, 0.3))
  const drip = ((t % 1.1) / 1.1) * 4
  return (
    <g opacity={fear}>
      <g fill="none" stroke="#9fb0d8" strokeWidth="1" strokeLinecap="round" opacity={0.4 + 0.6 * pulse}>
        <path d="M75.4 62 q-2 3 0 6" />
        <path d="M73 61 q-2.6 4 0 8" />
        <path d="M105.4 74 q2 3 0 6" />
      </g>
      <path d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill={SWEAT} transform={`translate(97 ${61 + drip})`} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)
  const lit = span(t, RISE, 4.8, easeOut)
  const rise = mix(t, RISE, 4.6, 92, 0, easeOut)

  const noticed = span(t, NOTICE, NOTICE + 0.6)
  const mood: Mood = t < NOTICE ? 'scared' : t < RELIEF ? 'surprised' : 'happy'
  const perk = t < NOTICE ? 0.1 : mix(t, NOTICE, NOTICE + 0.5, 0.1, 1, backOut)
  // こわい間は きょろきょろ、気づいたら 月を 見あげる、あんしんしたら ぴょんぴょん
  const around = wave(t, 1.7) * 6 * (1 - noticed)
  const lookUp = 14 * noticed - 8 * span(t, HOP + 0.6, HOP + 1.2)
  const shake = t < NOTICE ? Math.sin(t * 38) * 0.45 * (1 - noticed) : 0
  const hopT = span(t, HOP, HOP + 1.4)
  const hop = Math.abs(Math.sin(hopT * Math.PI * 2)) * 5
  const rabbitIn = span(t, 0.3, 0.9, backOut)
  const twinkle = during(t, 4.8, INK, 0.4)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} lit={lit} />
        <Moon t={t} lit={lit} rise={rise} />
        <NightClouds t={t} />
        <Ground lit={lit} />
        <Layer scale={rabbitIn} origin={[94, 97]}>
          <Rabbit mood={mood} perk={perk} headTilt={around + lookUp} shake={shake} hop={hop} />
          <Shiver t={t} fear={Math.max(0, 1 - noticed) * span(t, 0.8, 1.2)} />
        </Layer>
        {/* うれしい ときの きらきら */}
        <g opacity={twinkle}>
          <Star cx={30} cy={32} r={2.4 + wave(t, 0.9)} color="#ffffff" spin={t * 60} />
          <Star cx={46} cy={86} r={2 + wave(t, 0.9, 0.3)} color="#ffffff" spin={-t * 60} />
          <Star cx={96} cy={50} r={1.8 + wave(t, 0.9, 0.6)} color={STAR} spin={t * 60} />
        </g>
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
    { at: 0, label: 'くらい 夜。うさぎが ひとりで こわがる', sound: 'pop' },
    { at: LOOK_AROUND, label: 'きょろきょろ して ぶるぶる' },
    { at: RISE, label: '空に かけた 月が のぼってくる', sound: 'pop' },
    { at: NOTICE, label: 'うさぎが 気づいて 見あげる' },
    { at: RELIEF, label: '月が ひかり、夜が あかるくなる。にっこり' },
    { at: HOP, label: 'うれしくて ぴょんぴょん。雲が 月の 前を よこぎる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '月 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
