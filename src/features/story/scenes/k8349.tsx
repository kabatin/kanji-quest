/*
 * 草(くさ): かぜに ゆれる くさ。おなかを すかせた うさぎが、かかしの ぼうし の くさ を ねらう。
 *
 * ほね(画と絵の対応)
 *   1画目(一)    … かかしの わらぼうし の つば(よこに ひろい)
 *   2・3画目(丨)  … ぼうし に さした 2本の くさ(上に とび出して、つばの下に すこし たれる)
 *   4・5画目(口)  … かかしの あたま(ぬのぶくろ。上が ひろく、下が すこし せまい)
 *   6画目(一)    … あたまに まいた あかい ぬのの おび
 *   7画目(一)    … あたまの ふくろの くち を しばった なわ
 *   8画目(一)    … かかしの 木の うで(よこぼう)
 *   9画目(丨)    … かかしの 木の はしら
 *
 * ながれ
 *   かかしが 立つ → おなかを すかせた うさぎが、とぼとぼ やってくる(耳が たれている)
 *   → かかしの ぼうし の くさ が たべたくて とびはねる けど、とどかない(しょんぼり)
 *   → かぜが ふいて、ぼうし が ふわっと うきあがる。くさ が 2本 ぬけて ひらひら おちてくる
 *   → うさぎ は びっくり、くさ を ぱくっ と たべて にこにこ
 *   → ぼうし が あたまの上で ゆれている しゅんかん に ほね が ひかって、絵が うすくなり 字「草」になる
 *
 * かかし・うさぎは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   かかしの うで は よこぼうに ぬのを かけたもの、あたまは ぬのふくろ、あしは 1本の はしら。
 *   うさぎは 耳が あたまの上、まえあしは かた から、うしろあしは おおきな 足を おりたたむ。
 *   ぼうしは かぜで ういた ままに なる(かぜが ふいている あいだ は、ぼうしが ういて ゆれる)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '草'

const SUN = '#ffd24a'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const WOOD = '#8c5b3c'
const WOOD_DARK = '#70452b'
const BURLAP = '#e9cc92'
const BURLAP_DARK = '#d3b073'
const CLOTH = '#4f9be0'
const CLOTH_DARK = '#3c82c4'
const BAND = '#e8534a'
const ROPE = '#a8743f'
const STRAW = '#e8c564'
const STRAW_DARK = '#c9a04a'
const BUNNY = '#d9a273'
const BUNNY_SHADE = '#bd8451'
const BUNNY_BELLY = '#f6e0c4'
const EAR_INNER = '#f5a8b4'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const ENTER = 0.8
const LOOK = 2.1
const HOP1 = 2.7
const HOP2 = 3.5
const GIVE_UP = 4.05
/** かぜが ふきはじめる / ぼうしが うきあがる */
const WIND = 4.1
const LIFT = 4.3
const LIFT_END = 5.1
const EAT = 5.7
const INK = 6.9
const DONE = 9.4
const DURATION = 10

/** 絵の 地面の たかさ と、うさぎの いる場所(はしらの みぎ) */
const GROUND = 97
const BUNNY_X = 78
const BUNNY_SCALE = 1.05
/** ぼうしが あたまに かぶさっているときの さがり(ういた ときの ぶん だけ 上にずれる) */
const HAT_SEATED = 13
/** つばの かたむき(1画目は 右が すこし 上がる) */
const BRIM_TILT = -2.7
/** かぜの ふいている あいだ(0〜1) */
const windAmount = (t: number) => during(t, WIND, 5.9, 0.35)

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[10, 10]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="9.2" y="-1.4" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 10 10)`} />
        ))}
      </Layer>
      <circle cx="10" cy="10" r={5.2 * sun} fill={SUN} />
      {/* とおくの おか と、ゆっくり ながれる 雲(おくゆき を出す) */}
      <path d="M-4 99 Q18 78 44 90 Q72 70 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.8} 0)`}>
        <ellipse cx="-6" cy="52" rx="7" ry="3.2" />
        <ellipse cx="-1" cy="50" rx="5" ry="3.2" />
        <ellipse cx="92" cy="8" rx="6" ry="2.8" />
        <ellipse cx="96.5" cy="6.4" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 30, 84, 102].map((x, i) => (
        <Layer key={x} rotate={wave(t, 0.7, i * 0.3) * 9 * windAmount(t)} origin={[x + 2, 97.5]}>
          <path d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
        </Layer>
      ))}
    </>
  )
}

/** かぜの すじ。左から 右へ ながれる。 */
function WindStreaks({ t }: SceneProps) {
  const show = windAmount(t)
  if (show <= 0) return null
  return (
    <g opacity={show * 0.9} fill="none" stroke="#9fd0ee" strokeWidth="1.1" strokeLinecap="round">
      {[
        [12, 0],
        [30, 0.3],
        [47, 0.6],
        [66, 0.15],
        [84, 0.45],
      ].map(([y, offset]) => {
        const p = ((t + offset) % 0.9) / 0.9
        return <path key={y} d="M0 0 q5 -2 10 0 t10 0" transform={`translate(${-24 + p * 150} ${y})`} opacity={Math.sin(p * Math.PI)} />
      })}
    </g>
  )
}

/** かかしの ふとい 1本の はしら と、よこぼう の うで と、ぬのの ぼろ。 */
function Scarecrow({ t }: SceneProps) {
  const sway = windAmount(t)
  return (
    <>
      <ellipse cx="55.6" cy="98.6" rx="9" ry="2" fill={WOOD_DARK} opacity="0.35" />
      {/* 9画目: はしら(あたまの下から 地面まで) */}
      <Bone char={CHAR} n={9} color={WOOD} width={4.8} />
      {/* 8画目: うで の よこぼう。りょうはしに ぬのを まいて、先から わらが でる */}
      <Bone char={CHAR} n={8} color={WOOD} width={4.4} />
      <Bone char={CHAR} n={8} color={CLOTH} width={8} from={0.04} to={0.34} />
      <Bone char={CHAR} n={8} color={CLOTH} width={8} from={0.68} to={0.97} />
      <Bone char={CHAR} n={8} color={CLOTH_DARK} width={2.2} from={0.3} to={0.34} />
      <Bone char={CHAR} n={8} color={CLOTH_DARK} width={2.2} from={0.68} to={0.72} />
      <path d="M17.6 77 l-4 -3 M17.6 77 l-4.6 0.6 M17.6 77 l-3.6 3.4" fill="none" stroke={STRAW} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M94 74 l4 -3 M94 74 l4.6 0.6 M94 74 l3.6 3.4" fill="none" stroke={STRAW} strokeWidth="1.5" strokeLinecap="round" />
      {/* むねの ぬのの ぼろ: はしら の りょうがわ に たれる(かぜで ゆれる) */}
      <Layer rotate={wave(t, 0.45) * 8 * sway} origin={[48, 76]}>
        <path d="M43.6 76 L52 76 L51.6 88 L49.4 85.4 L47.2 89 L44.6 85.8 Z" fill={BAND} />
      </Layer>
      <Layer rotate={wave(t, 0.45, 0.2) * 8 * sway} origin={[63, 76]}>
        <path d="M59.4 76 L67.6 76 L66.8 85.8 L64.4 89 L62.2 85.4 L59.8 88 Z" fill={BAND} />
      </Layer>
      <Head />
    </>
  )
}

/** あたま: ぬのぶくろ。上が ひろく、下が すこし せまい。4・5画目が ふち、6画目の おび、7画目の なわ。 */
function Head() {
  return (
    <>
      {/* ふくろの 口から はみ出る わら */}
      <path d="M45 62 l-2 5 M50 62.4 l-0.6 6 M56 61.8 l0.6 6.4 M62 61 l1.6 5.4 M67 60.6 l2.6 4" fill="none" stroke={STRAW} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M32.4 37.6 L76.6 36 L73.6 62.2 L37.4 64 Z" fill={BURLAP} stroke={BURLAP} strokeWidth="3" strokeLinejoin="round" />
      <path d="M37.4 64 L73.6 62.2 L75.6 53 L35.4 55 Z" fill={BURLAP_DARK} stroke={BURLAP_DARK} strokeWidth="2" strokeLinejoin="round" />
      {/* おでこの つぎはぎ */}
      <path d="M58.6 38.6 L68 38.2 L67.6 44 L58.2 44.4 Z" fill="#c9d8a0" />
      <path d="M59.4 39.8 l7.4 -0.3 M59.2 42.8 l7.4 -0.3" stroke="#8aa06a" strokeWidth="0.7" strokeLinecap="round" strokeDasharray="1.4 1.2" />
      {/* 6画目: あかい おび */}
      <path d="M32.6 50.9 L76 47.2" stroke={BAND} strokeWidth="4" fill="none" />
      {/* 目(ボタン)と、ぬった 口 */}
      <circle cx="45" cy="54.6" r="1.7" fill={EYE} />
      <circle cx="65" cy="52.6" r="1.7" fill={EYE} />
      <circle cx="45.5" cy="54" r="0.5" fill="#ffffff" />
      <circle cx="65.5" cy="52" r="0.5" fill="#ffffff" />
      <circle cx="40" cy="57.6" r="1.8" fill={CHEEK} opacity="0.5" />
      <circle cx="70" cy="55.4" r="1.8" fill={CHEEK} opacity="0.5" />
      <path d="M49.4 57.2 Q55 60 60.6 56.8" fill="none" stroke={EYE} strokeWidth="1" strokeLinecap="round" />
      {/* 7画目: ふくろの 口を しばった なわ */}
      <path d="M37.8 62.6 L72.8 59.8" stroke={ROPE} strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </>
  )
}

/** ぼうし: 1画目の つば と、2・3画目の 2本の くさ。dy が 0 のとき ういて、字の位置に そろう。 */
function Hat({ t }: SceneProps) {
  // かぜが ふくまえ から かたかた ふるえ、ふわっと うく。うきおわっても、すこし ゆれる
  const lift = span(t, LIFT, LIFT_END)
  const dy = HAT_SEATED * (1 - backOut(lift))
  const shake = span(t, WIND, LIFT) * (1 - span(t, LIFT, LIFT + 0.1)) * wave(t, 0.18) * 2.2
  const flutter = span(t, LIFT, LIFT + 0.15) * (1 - span(t, LIFT_END + 0.3, INK - 0.3)) * wave(t - LIFT, 0.8) * 9
  const bob = span(t, LIFT_END, LIFT_END + 0.4) * (1 - span(t, INK - 0.6, INK)) * wave(t, 1.3) * 0.7
  const bladeSway = windAmount(t) * wave(t, 0.5) * 7
  // くさ が 2本 ぬけたあと も、1画目・2・3画目の 形が のこるよう、ぬけるのは 小さな べつの くさ
  return (
    <Layer y={dy + bob} rotate={BRIM_TILT + shake + flutter} origin={[55, 22.4]}>
      <ellipse cx="55" cy="24" rx="35.4" ry="3.6" fill={STRAW_DARK} />
      <ellipse cx="55" cy="22.4" rx="35.4" ry="3.5" fill={STRAW} />
      <path d="M37 22 Q38 17.2 55 17.2 Q72 17.2 73 22 Z" fill={STRAW} />
      <path d="M39 20.6 Q55 16.4 71 20.6" fill="none" stroke={STRAW_DARK} strokeWidth="0.9" strokeLinecap="round" />
      <rect x="37.4" y="19.6" width="35.6" height="2.6" rx="1" fill={BAND} />
      {/* 2・3画目: ぼうしに さした くさ */}
      <Layer rotate={bladeSway} origin={[41, 17]}>
        <Bone char={CHAR} n={2} color={LEAF} width={2.8} />
      </Layer>
      <Layer rotate={-bladeSway} origin={[66, 17]}>
        <Bone char={CHAR} n={3} color={LEAF_DARK} width={2.8} />
      </Layer>
    </Layer>
  )
}

type Mood = 'sad' | 'try' | 'surprised' | 'happy'

type BunnyProps = {
  readonly mood: Mood
  /** 耳の たれぐあい(0 = ぴん / 1 = うしろに たれる) */
  readonly droop: number
  /** まえあしを 上に のばす 度合い(0〜1) */
  readonly reach: number
  /** くちを もぐもぐ する 度合い(0〜1) */
  readonly chew: number
}

/** うさぎ: ひだりむき。地面(足もと)が (0,0)。耳は あたまの上、まえあしは かた から。 */
function Bunny({ mood, droop, reach, chew }: BunnyProps) {
  const earRotate = droop * 78 - 6
  const pawX = -8 - reach
  const pawY = -2.4 - reach * 11
  return (
    <>
      {/* むこうの 耳 */}
      <Layer x={-7.2} y={-16.6} rotate={earRotate - 6} origin={[0, 0]}>
        <ellipse cx="0" cy="-5.2" rx="1.9" ry="5.4" fill={BUNNY_SHADE} />
      </Layer>
      {/* しっぽ・おおきな うしろあし・どう */}
      <circle cx="7.6" cy="-7.8" r="2.7" fill="#fff5e8" />
      <ellipse cx="0.8" cy="-8" rx="7.4" ry="6.6" fill={BUNNY} />
      <ellipse cx="-3" cy="-7" rx="3.4" ry="4.6" fill={BUNNY_BELLY} />
      <ellipse cx="2.6" cy="-5.6" rx="4.8" ry="4.8" fill={BUNNY_SHADE} />
      <ellipse cx="-1.2" cy="-1.5" rx="5.4" ry="1.9" fill={BUNNY} />
      {/* まえあし: かた から のびて、手は ちいさな まるい 手 */}
      <path d={`M-4.4 -8.4 L${pawX} ${pawY}`} fill="none" stroke={BUNNY} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx={pawX} cy={pawY} r="1.7" fill={BUNNY_BELLY} />
      {/* あたま */}
      <circle cx="-6" cy="-13" r="5.3" fill={BUNNY} />
      <ellipse cx="-10" cy="-11.4" rx="2.6" ry="2.1" fill={BUNNY_BELLY} />
      <ellipse cx="-12" cy="-12.2" rx="1" ry="0.8" fill={EAR_INNER} />
      <circle cx="-5.2" cy="-10.8" r="1.5" fill={CHEEK} opacity="0.55" />
      <Face mood={mood} chew={chew} />
      {/* てまえの 耳 */}
      <Layer x={-4.6} y={-16.8} rotate={earRotate} origin={[0, 0]}>
        <ellipse cx="0" cy="-5.6" rx="2" ry="5.8" fill={BUNNY} />
        <ellipse cx="0" cy="-5.4" rx="1" ry="3.8" fill={EAR_INNER} />
      </Layer>
    </>
  )
}

function Face({ mood, chew }: { readonly mood: Mood; readonly chew: number }) {
  return (
    <>
      {mood === 'sad' && (
        <>
          <circle cx="-8.4" cy="-13.2" r="1" fill={EYE} />
          <path d="M-10.6 -16.2 L-7 -15.2" stroke={BUNNY_SHADE} strokeWidth="0.9" strokeLinecap="round" />
          <path d="M-11 -9.6 Q-10 -10.8 -8.8 -9.6" fill="none" stroke={MOUTH} strokeWidth="0.8" strokeLinecap="round" />
        </>
      )}
      {mood === 'try' && (
        <>
          <circle cx="-8.4" cy="-13.8" r="1.1" fill={EYE} />
          <path d="M-10.6 -15.8 L-7 -16.2" stroke={BUNNY_SHADE} strokeWidth="0.9" strokeLinecap="round" />
          <ellipse cx="-10.6" cy="-9.6" rx="0.9" ry="0.9" fill={MOUTH} />
        </>
      )}
      {mood === 'surprised' && (
        <>
          <circle cx="-8.4" cy="-13.6" r="1.6" fill="#ffffff" stroke={EYE} strokeWidth="0.5" />
          <circle cx="-8.7" cy="-14" r="0.8" fill={EYE} />
          <ellipse cx="-10.6" cy="-9.4" rx="1" ry="1.4" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M-9.8 -13 Q-8.4 -15 -7 -13" fill="none" stroke={EYE} strokeWidth="1" strokeLinecap="round" />
          <ellipse cx="-10.4" cy="-9.6" rx="1.5" ry={0.5 + chew * 1.3} fill={MOUTH} />
        </>
      )}
    </>
  )
}

/** おなかが ぐう と なる しるし。うさぎの おなかの まえ に でる。 */
function Rumble({ t }: SceneProps) {
  const show = Math.max(during(t, 1.7, 2.45, 0.15), during(t, GIVE_UP + 0.05, GIVE_UP + 0.6, 0.15))
  if (show <= 0) return null
  const shake = wave(t, 0.2) * 0.8
  return (
    <g opacity={show} fill="none" stroke="#9a7650" strokeWidth="0.9" strokeLinecap="round" transform={`translate(${shake} 0)`}>
      <path d="M-14.6 -9.2 q-1.8 1.4 0 2.8 q1.8 1.4 0 2.8" />
      <path d="M-17.4 -10 q-2.4 2 0 4 q2.4 2 0 4" />
    </g>
  )
}

/** かぜで ぼうしから ぬけた くさ。ひらひら おちて、うさぎの 口に とどく。 */
function FallingBlade({ t, index }: SceneProps & { readonly index: number }) {
  const start = 4.7 + index * 0.5
  const fall = 1.0
  const p = span(t, start, start + fall)
  const size = 1 - span(t, start + fall, start + fall + 0.25)
  if (p <= 0 || size <= 0) return null
  const x0 = 88 + index * 4
  const x = x0 - (x0 - 67.5) * easeInOut(p) + Math.sin(p * 10) * 3.2 * (1 - p)
  const y = 24 + (87 - 24) * p
  const spin = Math.sin(p * 10) * 40 + 25 * (1 - p)
  return (
    <g transform={`translate(${x} ${y}) rotate(${spin}) scale(${size})`}>
      <path d="M0 -4.4 Q2.2 0 0 4.4 Q-2.2 0 0 -4.4 Z" fill={LEAF_LIGHT} stroke={LEAF_DARK} strokeWidth="0.5" />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 9)

  // かかしが 立つ: 地面から ぐんと のびる
  const rise = span(t, 0.1, 0.8, backOut)

  // うさぎ: 右から とぼとぼ はねて きて、くさを ほしがって 2かい とびはねる
  const hop = t < LOOK ? Math.abs(Math.sin((t - ENTER) * Math.PI * 2.4)) * 2.6 * span(t, ENTER, ENTER + 0.1) : 0
  const j1 = Math.sin(span(t, HOP1, HOP1 + 0.55) * Math.PI)
  const j2 = Math.sin(span(t, HOP2, HOP2 + 0.55) * Math.PI)
  const x = mix(t, ENTER, LOOK, 128, BUNNY_X, easeOut)
  const y = GROUND - hop - j1 * 13 - j2 * 16
  const mood: Mood = t < HOP1 - 0.05 ? 'sad' : t < GIVE_UP ? 'try' : t < 4.5 ? 'sad' : t < EAT - 0.15 ? 'surprised' : 'happy'
  const droop = Math.min(Math.max(1 - 0.9 * span(t, HOP1 - 0.3, HOP1) + 0.9 * span(t, GIVE_UP, GIVE_UP + 0.25) - 0.9 * span(t, 4.45, 4.7), 0), 1)
  const chew = t >= EAT && t < EAT + 1.1 ? Math.abs(wave(t, 0.34)) : 0
  const happyStars = during(t, EAT + 0.2, INK - 0.1, 0.25)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <WindStreaks t={t} />
        <Layer scaleX={0.7 + 0.3 * rise} scaleY={rise} origin={[55.6, 98.5]}>
          <Scarecrow t={t} />
          <Hat t={t} />
        </Layer>
        <Layer x={x} y={y} scale={BUNNY_SCALE} origin={[0, 0]}>
          <Rumble t={t} />
          <Bunny mood={mood} droop={droop} reach={Math.max(j1, j2)} chew={chew} />
        </Layer>
        <FallingBlade t={t} index={0} />
        <FallingBlade t={t} index={1} />
        <g opacity={happyStars}>
          <Star cx={64.5} cy={78.5} r={2.4} color="#ffc233" spin={t * 60} />
          <Star cx={90.5} cy={80} r={1.8} color="#ff7a4d" spin={-t * 70} />
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
    { at: 0, label: 'かかしが 立つ', sound: 'pop' },
    { at: ENTER, label: 'おなかを すかせた うさぎが やってくる' },
    { at: HOP1, label: 'ぼうしの くさ に とびつくけど とどかない', sound: 'pop' },
    { at: WIND, label: 'かぜが ふいて、ぼうしが うきあがる' },
    { at: EAT, label: 'おちてきた くさ を ぱくっ と たべる', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '草 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
