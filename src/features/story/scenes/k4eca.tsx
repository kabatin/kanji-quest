/*
 * 今(いま): ふたを ぱたんと かぶせる。いま、この とき。
 *
 * ほね(画と絵の対応)
 *   1・2画目  … ガラスの ふた。てっぺんから 左右へ なだらかに ひろがる やね
 *                  (さいごに テーブルの上へ ぱたんと ふせたとき、ふたの やね が 1・2画目に重なる)
 *   3画目(一)  … ふたの 中で はねを ひろげた ちょうちょ(はなに とまった ところ)
 *   4画目(𠃍)  … まるい テーブル。上の たいらな 板 と、まんなかの 1本あし
 *
 * ながれ
 *   テーブルに はなが さく → ふたを もった 女の子が でてくる
 *   → ちょうちょが ふわっと あらわれて、はなの まわりを ひらひら
 *   → 女の子は 目で おいかける。ちょうちょが はなに とまった「いま!」 いきを とめて じっと まつ
 *   → ぱたん! と ふたを かぶせる。ちょうちょは 中で びっくり、ふたの 中を ぱたぱた
 *   → つかまえた! 女の子は 両手を あげて ぴょんぴょん。ちょうちょは 中で おちつく
 *   → ほね が ひかって、絵が うすくなり、字「今」が のこる
 *
 * ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   ふたは、右の はし を テーブルに つけたまま 左を もちあげて いる(ふたを あけた ところ)。
 *   女の子の うで は かた から出て ひじ で まがり、手で ふたの ふち を つかむ。くび は みじかい。
 *   ちょうちょは 体の まんなか に 4まいの はね。はなに とまると はね を ひろげて ゆっくり うごかす。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '今'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const DRESS = '#f27d95'
const DRESS_DARK = '#d96382'
const SOCK = '#ffffff'
const SHOE = '#6b4a36'
const WOOD = '#c98a52'
const WOOD_DARK = '#a86b3e'
const WOOD_LIGHT = '#dea66f'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const SUN = '#ffd24a'
const PETAL = '#f07f9e'
const PETAL_DARK = '#d9638a'
const WING = '#ff9a5c'
const WING_DARK = '#e2733f'
const WING_SPOT = '#ffd24a'
const GLASS = '#bfe6fa'
const GLASS_SHINE = '#ffffff'
const GLASS_RIM = '#6d8fb3'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const GIRL_IN = 0.5
const FLY = 0.9
/** ちょうちょが はなに とまる */
const LAND = 2.9
/** いきを とめて、ふたを おろす */
const DROP = 3.7
const CHEER = 4.7
const INK = 6.5
const DONE = 9.5
const DURATION = 10.1

/** ふた(ガラス)は、右の ふち の 下はし を じく に、左を もちあげる */
const PIVOT: readonly [number, number] = [95, 62.5]
/** 左を もちあげた 角度(度) */
const OPEN = 24
/** ふたの 左の ふち(女の子が つかむ ところ)。ふた が 平らな ときの 場所 */
const GRIP: readonly [number, number] = [14, 60.5]
/** テーブルの 上の 板 の たかさ */
const TABLE_TOP = 62.5

/** 女の子の まんなか(体の たて の中心 x)と、かた の たかさ */
const GX = 11
const SHOULDER_Y = 53
const ARM_PART = 14

/** ちょうちょが とまる 場所(はなの 上) */
const PERCH: readonly [number, number] = [52, 52]

const rad = (deg: number) => (deg * Math.PI) / 180
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/** ふた の 左の ふち が いま どこに あるか(角度 と 大きさ から) */
function gripPoint(angle: number, scale: number): readonly [number, number] {
  const rx = (GRIP[0] - PIVOT[0]) * scale
  const ry = (GRIP[1] - PIVOT[1]) * scale
  const a = rad(angle)
  return [PIVOT[0] + rx * Math.cos(a) - ry * Math.sin(a), PIVOT[1] + rx * Math.sin(a) + ry * Math.cos(a)]
}

/** ふた の かたむき(度)。もちあげて ふるえる → ぱたん と おりる → ぽん と はずむ */
function lidAngle(t: number): number {
  const shake = t < DROP ? wave(t, 0.5) * 0.5 * span(t, LAND, LAND + 0.3) : 0
  const down = easeIn(span(t, DROP, DROP + 0.26))
  const rebound = Math.sin(span(t, DROP + 0.26, DROP + 0.7) * Math.PI) * (1 - span(t, DROP + 0.26, DROP + 0.7)) * 3.2
  return (OPEN + shake) * (1 - down) + rebound
}

/** かた → ひじ → 手 の じゅんに つながる うで。sign は ひじ が どちらへ まがるか */
function Arm({ shoulder, target, sign, color }: { readonly shoulder: readonly [number, number]; readonly target: readonly [number, number]; readonly sign: 1 | -1; readonly color: string }) {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.max(Math.hypot(dx, dy), 0.001)
  const reach = Math.min(dist, ARM_PART * 2 - 0.05)
  const ux = dx / dist
  const uy = dy / dist
  const hand: readonly [number, number] = [shoulder[0] + ux * reach, shoulder[1] + uy * reach]
  const bend = Math.sqrt(Math.max(0, ARM_PART * ARM_PART - (reach / 2) ** 2))
  const elbow: readonly [number, number] = [shoulder[0] + (ux * reach) / 2 - uy * bend * sign, shoulder[1] + (uy * reach) / 2 + ux * bend * sign]
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.4" fill={SKIN} />
    </>
  )
}

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.5, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[99, 12]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="98.2" y="0.6" width="1.6" height="3.6" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 99 12)`} />
        ))}
      </Layer>
      <circle cx="99" cy="12" r={5.4 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="-2" cy="24" rx="6.5" ry="3.2" />
        <ellipse cx="3" cy="22.2" rx="4.6" ry="3.2" />
        <ellipse cx="86" cy="30" rx="5.6" ry="2.6" />
        <ellipse cx="90.4" cy="28.6" rx="4" ry="2.8" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 30, 78, 102].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** まるい テーブル。上の たいらな 板 と、まんなかの 1本あし(4画目) */
function Table({ t }: SceneProps) {
  const grow = span(t, 0, 0.5, backOut)
  return (
    <>
      <ellipse cx="53" cy="97.4" rx={20 * grow} ry="2.4" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.7 + 0.3 * grow} scaleY={grow} origin={[53, 96.5]}>
        <rect x="40" y="92" width="26" height="4.6" rx="2.3" fill={WOOD_DARK} />
        <path d="M47 67 L59 67 Q57 82 61.6 92.4 L44.4 92.4 Q49 82 47 67 Z" fill={WOOD_DARK} />
        <rect x="20" y={TABLE_TOP} width="76" height="5.2" rx="2.6" fill={WOOD} />
        <rect x="22" y={TABLE_TOP} width="72" height="1.6" rx="0.8" fill={WOOD_LIGHT} />
      </Layer>
    </>
  )
}

/** テーブルの 上の 花。ちょうちょが とまる ところ */
function Flower({ t }: SceneProps) {
  const grow = span(t, 0.3, 0.85, backOut)
  const sway = wave(t, 3) * 1.2
  return (
    <Layer scale={grow} rotate={sway} origin={[52, TABLE_TOP]}>
      <path d="M52 62.8 Q52.6 60 52 57.5" fill="none" stroke={LEAF_DARK} strokeWidth="1.8" strokeLinecap="round" />
      <ellipse cx="55" cy="60.8" rx="2.8" ry="1.4" fill={LEAF} transform="rotate(-25 55 60.8)" />
      <ellipse cx="49" cy="60.6" rx="2.6" ry="1.3" fill={LEAF} transform="rotate(25 49 60.6)" />
      {[0, 72, 144, 216, 288].map((deg) => (
        <circle key={deg} cx={52 + Math.sin(rad(deg)) * 2.6} cy={56.6 - Math.cos(rad(deg)) * 2.6} r="2.1" fill={deg % 144 === 0 ? PETAL : PETAL_DARK} />
      ))}
      <circle cx="52" cy="56.6" r="1.6" fill={SUN} />
    </Layer>
  )
}

/** ちょうちょ。ひらひら とんで、はなに とまり、ふたの 中で ぱたぱた して、おちつく */
function Butterfly({ t }: SceneProps) {
  const appear = span(t, FLY, FLY + 0.35, backOut)
  if (appear <= 0) return null
  // はなの まわりを 8の字に ひらひら(ふたの ふち より 下の 空いた ところ)
  const s = t - FLY
  const amp = span(t, FLY, FLY + 0.7)
  const hoverX = 52 + 15 * Math.sin(s * 2.4) * amp
  const hoverY = 54 + 2.5 * Math.sin(s * 4.8) * amp
  // とまる: とぶ位置 から、はなの 上へ すっと よる
  const settle = span(t, LAND - 0.5, LAND, easeInOut)
  // ふたの 中: びっくりして とびまわり、だんだん おちつく
  const scare = span(t, DROP + 0.28, DROP + 0.6, easeOut) * (1 - span(t, CHEER + 0.2, CHEER + 1.1, easeInOut))
  const ss = t - DROP
  const x = lerp(hoverX, PERCH[0], settle) + 7 * Math.sin(ss * 7) * scare
  const y = lerp(hoverY, PERCH[1], settle) - scare * (7 + 6 * Math.sin(ss * 5.3))
  // はね の ひらき(1 = ぜんぶ ひらく)。とぶときは はやく、とまると ゆっくり
  const flying = settle < 1 || scare > 0.05
  const flap = flying ? 0.55 + 0.45 * Math.abs(wave(t, 0.26)) : 0.82 + 0.18 * wave(t, 1.6)
  const spread = Math.max(0.2, flap)
  const wingY = Math.max(0.2, spread)
  return (
    <Layer x={x} y={y} scale={appear * 1.15}>
      <g fill={WING_DARK}>
        <ellipse cx={-4 * spread} cy="2.2" rx={Math.max(0.2, 3.4 * spread)} ry="2.6" transform="rotate(20 0 0)" />
        <ellipse cx={4 * spread} cy="2.2" rx={Math.max(0.2, 3.4 * spread)} ry="2.6" transform="rotate(-20 0 0)" />
      </g>
      <g fill={WING}>
        <ellipse cx={-5.4 * spread} cy="-1.6" rx={Math.max(0.2, 5.2 * spread)} ry={3.4 * wingY} />
        <ellipse cx={5.4 * spread} cy="-1.6" rx={Math.max(0.2, 5.2 * spread)} ry={3.4 * wingY} />
      </g>
      <circle cx={-6 * spread} cy="-1.8" r={Math.max(0.1, 1.3 * spread)} fill={WING_SPOT} />
      <circle cx={6 * spread} cy="-1.8" r={Math.max(0.1, 1.3 * spread)} fill={WING_SPOT} />
      <ellipse cx="0" cy="0" rx="1.1" ry="3.6" fill="#5a3b2a" />
      <path d="M-0.4 -3.2 Q-1.8 -5.6 -3 -5.8 M0.4 -3.2 Q1.8 -5.6 3 -5.8" fill="none" stroke="#5a3b2a" strokeWidth="0.5" strokeLinecap="round" />
    </Layer>
  )
}

/** ガラスの ふた。右の ふち を テーブルに つけて、左を もちあげる */
function Lid({ angle, scale }: { readonly angle: number; readonly scale: number }) {
  return (
    <Layer rotate={angle} scale={scale} origin={PIVOT}>
      <path d="M13 60 C20 44 36 29 50 17 C66 30 84 46 94 60 Z" fill={GLASS} opacity="0.55" />
      <ellipse cx="38" cy="43" rx="2.6" ry="1.5" fill={GLASS_SHINE} opacity="0.7" transform="rotate(-48 38 43)" />
      <circle cx="50" cy="15.6" r="3" fill={GLASS_RIM} />
      <rect x="11" y="58.5" width="86" height="4" rx="2" fill={GLASS_RIM} />
    </Layer>
  )
}

type Mood = 'curious' | 'focus' | 'hold' | 'wow' | 'happy'

function Face({ mood, sway }: { readonly mood: Mood; readonly sway: number }) {
  const ex = [GX + 1.5, GX + 6.2] as const
  const ey = 41.4
  return (
    <>
      {/* うしろ髪と ポニーテール */}
      <ellipse cx={GX - 2.4} cy="38.6" rx="8.4" ry="7.4" fill={HAIR} />
      <Layer rotate={sway} origin={[GX - 7, 35]}>
        <ellipse cx={GX - 10} cy="39" rx="2.8" ry="5.4" fill={HAIR} />
        <circle cx={GX - 8.4} cy="34.6" r="1.5" fill="#e8534a" />
      </Layer>
      <circle cx={GX} cy="40" r="7.8" fill={SKIN} />
      <path d={`M${GX - 7.6} 38 Q${GX - 5.4} 30.8 ${GX + 0.8} 31.2 Q${GX + 7.4} 31 ${GX + 7.8} 37.4 Q${GX + 3.4} 34.8 ${GX - 1} 36.2 Q${GX - 4.4} 35 ${GX - 7.6} 38 Z`} fill={HAIR} />
      <circle cx={GX - 0.4} cy="45" r={mood === 'hold' ? 2.9 : 2} fill={CHEEK} opacity={mood === 'hold' ? 0.7 : 0.55} />
      <circle cx={GX + 7.4} cy="44.6" r={mood === 'hold' ? 2.2 : 1.6} fill={CHEEK} opacity="0.4" />
      {mood === 'happy' ? (
        <>
          {ex.map((x) => (
            <path key={x} d={`M${x - 1.5} ${ey + 0.6} Q${x} ${ey - 1.8} ${x + 1.5} ${ey + 0.6}`} fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          ))}
          <path d={`M${GX + 1.8} 44.6 Q${GX + 4.2} 49.4 ${GX + 6.6} 44.6 Z`} fill={MOUTH} />
        </>
      ) : (
        <>
          {ex.map((x) => (
            <circle key={x} cx={x + (mood === 'focus' || mood === 'hold' ? 0.5 : 0)} cy={ey} r={mood === 'wow' ? 1.8 : mood === 'curious' ? 1.5 : 1.15} fill={EYE} />
          ))}
          {mood === 'focus' || mood === 'hold' ? (
            <path d={`M${ex[0] - 1.8} ${ey - 2.6} l3.2 0.4 M${ex[1] + 1.8} ${ey - 2.6} l-3.2 0.4`} stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          ) : null}
          {mood === 'hold' ? (
            <path d={`M${GX + 2.8} 45.4 h2.4`} stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
          ) : mood === 'focus' ? (
            <path d={`M${GX + 2.6} 45.4 q1.4 0.6 2.8 0`} fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
          ) : (
            <ellipse cx={GX + 4} cy="45.6" rx={mood === 'wow' ? 1.6 : 1.1} ry={mood === 'wow' ? 2 : 1.4} fill={MOUTH} />
          )}
        </>
      )}
    </>
  )
}

type GirlProps = {
  readonly mood: Mood
  readonly nearHand: readonly [number, number]
  readonly farHand: readonly [number, number]
  readonly sway: number
}

/** ふたを もった 女の子。体は 右(ちょうちょ)を むく。 */
function Girl({ mood, nearHand, farHand, sway }: GirlProps) {
  return (
    <>
      <Arm shoulder={[GX - 5, SHOULDER_Y]} target={farHand} sign={-1} color={SKIN_SHADE} />
      {[GX - 4.6, GX + 1.4].map((x) => (
        <g key={x}>
          <rect x={x} y="77" width="3.2" height="17.5" rx="1.6" fill={SKIN} />
          <rect x={x} y="88" width="3.2" height="6" fill={SOCK} />
          <ellipse cx={x + 2} cy="95" rx="3.4" ry="1.7" fill={SHOE} />
        </g>
      ))}
      {/* くび(みじかく どう と あたま の間) と どう(ワンピース) */}
      <rect x={GX - 1.8} y="45" width="3.6" height="8" rx="1.6" fill={SKIN_SHADE} />
      <path d={`M${GX - 5.8} 52 Q${GX} 50.4 ${GX + 5.8} 52 L${GX + 8.4} 79.4 Q${GX} 81 ${GX - 8.4} 79.4 Z`} fill={DRESS} />
      <path d={`M${GX - 7.4} 75.4 Q${GX} 77 ${GX + 7.4} 75.4`} fill="none" stroke={DRESS_DARK} strokeWidth="1.4" strokeLinecap="round" />
      <Arm shoulder={[GX + 5, SHOULDER_Y]} target={nearHand} sign={1} color={SKIN} />
      <Face mood={mood} sway={sway} />
    </>
  )
}

/** ちょうちょが とまった「いま!」の しるし。あたまの 上で ぴょこっと はねる */
function Notice({ t }: SceneProps) {
  const show = during(t, LAND - 0.1, DROP - 0.1, 0.15)
  if (show <= 0) return null
  const hop = Math.max(0, Math.sin(span(t, LAND - 0.1, LAND + 0.3) * Math.PI)) * 2
  return (
    <g opacity={show} fill={PETAL_DARK} transform={`translate(0 ${-hop})`}>
      <rect x={GX - 1.1} y="16" width="2.2" height="7.2" rx="1.1" />
      <circle cx={GX} cy="26.4" r="1.4" />
    </g>
  )
}

/** ぱたん! の ほこり。ふたの 左右から ぽわっと ひろがる */
function Dust({ t }: SceneProps) {
  const p = span(t, DROP + 0.24, DROP + 0.8, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g fill="#ffffff" opacity={(1 - p) * 0.9} stroke="#d5dde6" strokeWidth="0.5">
      <circle cx={16 - p * 7} cy={61 - p * 5} r={1.5 + p * 2.2} />
      <circle cx={21 - p * 3} cy={62 - p * 2} r={1 + p * 1.4} />
      <circle cx={95 + p * 7} cy={61 - p * 5} r={1.5 + p * 2.2} />
      <circle cx={90 + p * 3} cy={62 - p * 2} r={1 + p * 1.4} />
    </g>
  )
}

/** うれしい きらきら。女の子の まわりで ちかちか */
function Joy({ t }: SceneProps) {
  const show = during(t, CHEER + 0.2, INK - 0.1, 0.25)
  if (show <= 0) return null
  const a = 0.8 + 0.2 * wave(t, 0.5)
  return (
    <g opacity={show}>
      <Star cx={4} cy={22} r={3 * a} color="#ffc233" spin={t * 60} />
      <Star cx={21} cy={19} r={2.2 * a} color="#ff7a4d" spin={-t * 60} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  // 女の子と ふたが でてくる
  const girlIn = span(t, GIRL_IN, GIRL_IN + 0.5, easeOut)
  const lidScale = span(t, GIRL_IN + 0.05, GIRL_IN + 0.6, backOut)
  const angle = lidAngle(t)

  // ぴょんぴょん: 両手を あげて 2かい とぶ
  const hopping = t > CHEER + 0.4 && t < CHEER + 1.4
  const hop = hopping ? Math.abs(Math.sin(((t - CHEER - 0.4) / 0.5) * Math.PI)) * 4 : 0
  const dy = (1 - girlIn) * 8 - hop

  const mood: Mood = t >= CHEER ? 'happy' : t >= DROP + 0.2 ? 'wow' : t >= LAND + 0.1 ? 'hold' : t >= FLY + 0.5 ? 'focus' : 'curious'

  // うで: ふたを もっている あいだは 左の ふち を つかみ、おわったら 両手を あげる
  const cheer = span(t, CHEER + 0.1, CHEER + 0.55, easeOut)
  const grip = gripPoint(angle, lidScale)
  const nearHold: readonly [number, number] = [grip[0], grip[1] - dy]
  const nearHand: readonly [number, number] = [lerp(nearHold[0], GX + 8, cheer), lerp(nearHold[1], 29, cheer) + Math.sin(t * 14) * 0.8 * cheer]
  const farRest: readonly [number, number] = [GX - 3, 75]
  const farHand: readonly [number, number] = [lerp(farRest[0], GX - 7, cheer), lerp(farRest[1], 29, cheer) + Math.sin(t * 14 + 1.5) * 0.8 * cheer]
  const sway = wave(t, 1.4) * 4 + (hopping ? hop * 2 : 0)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Table t={t} />
        <Flower t={t} />
        <Butterfly t={t} />
        <Lid angle={angle} scale={lidScale} />
        <Dust t={t} />
        <Layer opacity={girlIn} y={dy}>
          <Girl mood={mood} nearHand={nearHand} farHand={farHand} sway={sway} />
        </Layer>
        <Notice t={t} />
        <Joy t={t} />
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
    { at: 0, label: 'テーブルに はなが さく', sound: 'pop' },
    { at: GIRL_IN, label: 'ふたを もった 女の子が でてくる' },
    { at: FLY, label: 'ちょうちょが ひらひら とぶ' },
    { at: LAND, label: 'はなに とまった「いま!」', sound: 'pop' },
    { at: DROP, label: 'ぱたん! と ふたを かぶせる', sound: 'pop' },
    { at: CHEER, label: 'つかまえた! 両手を あげて よろこぶ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '今 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
