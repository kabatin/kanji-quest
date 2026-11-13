/*
 * 羽(はね): ひよこが、とんでいく 大きな とりを見て、はねを ぱたぱた。2まいの はねを たかく あげる。
 *
 * ほね(画と絵の対応)
 *   1画目(つの字の ふち)  … ひだりの はね の ふち(てっぺん の まるい ところ から、そとがわ・うちがわ)
 *   2画目(点)            … ひだりの はね の はねすじ(ひだりうえ)
 *   3画目(はらい)         … ひだりの はね の はねすじ(ひだりした)
 *   4・5・6画目           … みぎの はね の おなじ もよう
 *   (2まい の はね は、ひよこの りょうがわ に ならんで、たかく あがる。字に そろうのは そのとき だけ)
 *
 * ながれ
 *   くさはらに ひよこが いる。はね は しょんぼり たれている
 *   → 大きな とりが ぱたぱた とんでいく。ひよこは 目を まるくして 見あげる
 *   → ひよこも まねして はねを ぱたぱた。ぴょんぴょん はねて、はねが 1まい ぬける
 *   → ひとやすみ してから、もう1ど「えいっ」。ふわっと うかんで、はねを たかく あげて ちゃくち(うれしい)
 *   → 2まい の はね が ならんだ ところで ほね が ひかり、絵が うすくなって 字「羽」になる
 *
 * ひよこは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   はね は どう の よこ(かた)から出る。たれているときは からだに そって したむき、
 *   あげると 上へ のびる。あたま は まるく、どう の 上に のる。足は どう の下。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '羽'

const BODY = '#ffd95e'
const BODY_DARK = '#f2bb3a'
const BELLY = '#fff1b4'
const WING = '#f6c445'
const WING_DARK = '#d99a22'
const WING_LIGHT = '#ffe596'
const BEAK = '#f08a3c'
const FEET_COLOR = '#f08a3c'
const EYE = '#2b2b2b'
const CHEEK = '#ff9d9d'
const HILL = '#e2f2d2'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const GLIDER = '#6a7fa8'
const GLIDER_FAR = '#556a92'

/** くぎり の時間(秒) */
const CHICK_IN = 0.3
const GLIDE = 1.0
const GLIDE_END = 3.1
const TRY = 3.1
const TIRED = 4.5
const JUMP = 4.9
const LAND = 5.85
const INK = 6.4
const DONE = 8.8
const DURATION = 9.4

/** ひよこの 足もと(ぴょんと はねる ときの じく) */
const FEET: readonly [number, number] = [54.5, 96]
/** はね の つけね(かた)。ひだり。みぎ は 中心 x = 52 で ひっくり返す */
const SHOULDER: readonly [number, number] = [40, 70]
const MIRROR_AXIS = 52

type Mood = 'sad' | 'wonder' | 'try' | 'happy'

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[93, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="92.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 93 13)`} />
        ))}
      </Layer>
      <circle cx="93" cy="13" r={6.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill={HILL} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="6" cy="42" rx="7" ry="3.4" />
        <ellipse cx="11" cy="40" rx="5" ry="3.4" />
        <ellipse cx="60" cy="52" rx="6" ry="2.8" />
        <ellipse cx="64.5" cy="50.4" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 22, 86, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
      {/* 小さな はな */}
      <g transform="translate(92 92)">
        <path d="M0 6 V0" stroke={LEAF} strokeWidth="1.2" strokeLinecap="round" />
        {[0, 72, 144, 216, 288].map((a) => (
          <circle key={a} cx={Math.sin((a * Math.PI) / 180) * 2} cy={-Math.cos((a * Math.PI) / 180) * 2} r="1.5" fill="#ff9db8" />
        ))}
        <circle cx="0" cy="0" r="1.1" fill={SUN} />
      </g>
    </>
  )
}

/**
 * 遠くを とんでいく 大きな とり(よこ向き。左へ とぶ)。ひよこが あこがれる もと。
 * はね は 体の 上から出て、ぱたぱた と 上下する。
 */
function Glider({ t }: SceneProps) {
  const p = span(t, GLIDE, GLIDE_END)
  if (p <= 0 || p >= 1) return null
  const x = 120 - p * 138
  const y = 17 + wave(t, 1.6) * 2.2
  const flap = wave(t, 0.3) * 32
  const wingPath = 'M-1 -0.6 Q-4.6 -9.5 2.6 -11 Q4.4 -5.6 3.2 -0.6 Z'
  return (
    <Layer x={x} y={y} scale={1.5}>
      <Layer rotate={-flap * 0.7} origin={[0, -0.6]}>
        <path d={wingPath} fill={GLIDER_FAR} />
      </Layer>
      <path d="M3.4 0.4 L9 -1.6 L9 2.4 Z" fill={GLIDER_FAR} />
      <ellipse cx="0" cy="1" rx="5.4" ry="2.7" fill={GLIDER} />
      <circle cx="-5" cy="-0.2" r="2.1" fill={GLIDER} />
      <path d="M-6.8 -0.8 L-9.2 0 L-6.8 0.9 Z" fill={BEAK} />
      <circle cx="-5.4" cy="-0.7" r="0.45" fill={EYE} />
      <Layer rotate={flap} origin={[0, -0.6]}>
        <path d={wingPath} fill={GLIDER} />
      </Layer>
    </Layer>
  )
}

/**
 * ひよこの はね 1まい。字の「羽」の ひだり の かたち(うえに のびた はね)で かく。
 * a = あげた角度 の ぎゃく(0 = まっすぐ 上 / 90 = よこ / 140 = 下にたれる)
 * たれるときは、はね が おりたたまれる ので 少し みじかく する。
 */
function Wing({ a, mirror }: { readonly a: number; readonly mirror: boolean }) {
  const fold = 1 - 0.5 * span(a, 0, 140)
  const flip = mirror ? `translate(${MIRROR_AXIS * 2} 0) scale(-1 1)` : undefined
  return (
    <g transform={flip}>
      <Layer rotate={-a} scaleX={1 - 0.38 * span(a, 0, 140)} scaleY={fold} origin={SHOULDER}>
        <path d="M18 31 Q18 21.5 29 21.8 L38.5 22.2 Q46.7 22 46.7 30 L46.4 74 Q46.2 87.5 39.5 87.5 Q30 86 24 76 Q18.5 62 18 31 Z" fill={WING} />
        {/* はねすじ(2本) */}
        <path d="M22 41.5 Q27 43 30.3 48.4 M24.2 70.5 Q28.5 67 33 59" fill="none" stroke={WING_DARK} strokeWidth="2.2" strokeLinecap="round" />
        {/* つやの ハイライト */}
        <path d="M24 28 Q30 26 38 27" fill="none" stroke={WING_LIGHT} strokeWidth="2.2" strokeLinecap="round" />
      </Layer>
    </g>
  )
}

type FaceProps = { readonly mood: Mood; readonly look: readonly [number, number] }

/** かお。気持ちで 目と まゆ を かえる */
function Face({ mood, look }: FaceProps) {
  const [lx, ly] = look
  const eyeY = 49 + ly
  return (
    <>
      <circle cx="47.6" cy="52.6" r="1.9" fill={CHEEK} opacity="0.6" />
      <circle cx="61.4" cy="52.6" r="1.9" fill={CHEEK} opacity="0.6" />
      {mood === 'happy' ? (
        <path d="M48.4 49.8 Q50.3 47.2 52.2 49.8 M56.8 49.8 Q58.7 47.2 60.6 49.8" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
      ) : (
        <>
          <circle cx={50.3 + lx} cy={eyeY} r={mood === 'wonder' ? 1.8 : 1.35} fill={EYE} />
          <circle cx={58.7 + lx} cy={eyeY} r={mood === 'wonder' ? 1.8 : 1.35} fill={EYE} />
          {mood === 'wonder' && (
            <>
              <circle cx={50.8 + lx} cy={eyeY - 0.6} r="0.55" fill="#ffffff" />
              <circle cx={59.2 + lx} cy={eyeY - 0.6} r="0.55" fill="#ffffff" />
            </>
          )}
        </>
      )}
      {/* まゆ: しょんぼり は 内がわが 上、がんばる は 内がわが 下 */}
      {mood === 'sad' && <path d="M48.2 45.8 L52.2 44.4 M60.8 45.8 L56.8 44.4" stroke="#8a6a2a" strokeWidth="1.1" strokeLinecap="round" />}
      {mood === 'try' && <path d="M48.2 44.4 L52.2 45.8 M60.8 44.4 L56.8 45.8" stroke="#8a6a2a" strokeWidth="1.2" strokeLinecap="round" />}
      {/* くちばし */}
      <path d="M52.6 51.6 Q54.5 50.4 56.4 51.6 Q54.5 55.4 52.6 51.6 Z" fill={BEAK} />
    </>
  )
}

type ChickProps = { readonly a: number; readonly mood: Mood; readonly look: readonly [number, number] }

/** ひよこ。はね(うしろ)→ 足 → どう → あたま の じゅんに かさねる */
function Chick({ a, mood, look }: ChickProps) {
  return (
    <>
      <Wing a={a} mirror={false} />
      <Wing a={a} mirror />
      {/* あし */}
      <path d="M50 90 V95.4 M47.6 96.2 L50 95.4 L52.4 96.2 M59 90 V95.4 M56.6 96.2 L59 95.4 L61.4 96.2" fill="none" stroke={FEET_COLOR} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* どう */}
      <ellipse cx="54.5" cy="75" rx="17" ry="16" fill={BODY} />
      <ellipse cx="54.5" cy="79.5" rx="10.5" ry="9.5" fill={BELLY} />
      {/* あたま(どう の上に のる。まえに 出して、はね の ふち に かさねる) */}
      <Layer y={look[1] * 0.5}>
        <circle cx="54.5" cy="49.2" r="10.4" fill={BODY} />
        <path d="M54.5 39.4 Q52 35.6 49.6 37 M54.5 39.4 Q55.4 34.8 58.2 36.2" fill="none" stroke={BODY_DARK} strokeWidth="1.5" strokeLinecap="round" />
        <Face mood={mood} look={look} />
      </Layer>
    </>
  )
}

/** がんばっている間の あせ。あたまの よこから とぶ */
function Sweat({ t }: SceneProps) {
  const show = during(t, TRY + 0.3, TIRED, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.45].map((offset) => {
        const p = ((t + offset) % 0.9) / 0.9
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" transform={`translate(${68 + p * 6} ${38 + p * 6 - Math.sin(p * Math.PI) * 4}) rotate(35)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** ひとやすみ の「ふう」(あたまの 右上へ) */
function Sigh({ t }: SceneProps) {
  const show = during(t, TIRED, JUMP, 0.2)
  if (show <= 0) return null
  const p = span(t, TIRED, JUMP, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={66 + p * 8} cy={46 - p * 5} rx={2.6 + p * 2.2} ry={1.8 + p * 1.4} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
      <ellipse cx={63 + p * 5} cy={47.4 - p * 2} rx={1.3 + p} ry={1 + p * 0.5} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
    </g>
  )
}

/** ぱたぱた したときに ぬける はねの 毛。ひらひら おちる */
function Feather({ t, from, startX }: SceneProps & { readonly from: number; readonly startX: number }) {
  const p = span(t, from, from + 1.2)
  if (p <= 0 || p >= 1) return null
  const x = startX + p * 4 + Math.sin(p * 10) * 4
  const y = 66 + p * 29
  return <path d="M0 -4 Q2.6 0 0 4 Q-2.6 0 0 -4 Z M0 -4 V4" fill={WING_LIGHT} stroke={WING_DARK} strokeWidth="0.5" transform={`translate(${x} ${y}) rotate(${Math.sin(p * 10) * 55 + 20})`} opacity={1 - span(p, 0.8, 1)} />
}

/** ちゃくち の ほこり(左右に ふわっと ひろがる) */
function Dust({ t }: SceneProps) {
  const p = span(t, LAND - 0.1, LAND + 0.5, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p} fill="#ffffff" stroke="#dfe9d0" strokeWidth="0.6">
      <ellipse cx={42 - p * 9} cy={95.6 - p * 2} rx={1.8 + p * 2.4} ry={1.2 + p * 1.4} />
      <ellipse cx={67 + p * 9} cy={95.6 - p * 2} rx={1.8 + p * 2.4} ry={1.2 + p * 1.4} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  // ひよこが ぽんと あらわれる
  const pop = span(t, CHICK_IN, CHICK_IN + 0.5, backOut)

  // はね の かっこう(0 = たかく あげる / 140 = しょんぼり たれる)
  const droop = 140 - 20 * span(t, GLIDE, GLIDE + 0.8)
  const flapOn = span(t, TRY, TRY + 0.3) * (1 - span(t, TIRED - 0.3, TIRED))
  const flapA = 62 + 52 * wave(t, 0.34)
  const resting = droop * (1 - flapOn) + flapA * flapOn
  const raise = span(t, JUMP, JUMP + 0.5, easeInOut)
  const wingA = Math.max(0, resting * (1 - raise))

  // ぴょんぴょん: はね を あげる ときに 体が うく。さいごの「えいっ」で ふわっと たかく
  const hopSmall = flapOn * 1.2 * (1 - wave(t, 0.34))
  const hopBig = 11 * Math.sin(span(t, JUMP, LAND) * Math.PI)
  const lift = hopSmall + hopBig
  const squash = 0.07 * Math.sin(span(t, LAND - 0.1, LAND + 0.2) * Math.PI)
  const cheer = t > LAND + 0.2 ? Math.abs(wave(t, 0.5)) * 0.8 * (1 - span(t, INK - 0.5, INK)) : 0

  // 気持ち
  const mood: Mood = t < GLIDE ? 'sad' : t < TRY ? 'wonder' : t < JUMP ? 'try' : 'happy'
  // 見あげる: とんでいく とりを 目で おう(右から 左へ)
  const looking = during(t, GLIDE, GLIDE_END, 0.3)
  const look: readonly [number, number] = [mix(t, GLIDE, GLIDE_END, 1.2, -1.2, easeInOut) * looking, -1.4 * looking]

  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Glider t={t} />
        <ellipse cx="54.5" cy="97.4" rx={19 * pop * (1 - lift * 0.02)} ry="2.6" fill="#000000" opacity="0.12" />
        <Layer scale={pop} origin={FEET}>
          <Layer y={-lift - cheer} scaleX={1 + squash * 0.6} scaleY={1 - squash} origin={FEET}>
            <Chick a={wingA} mood={mood} look={look} />
          </Layer>
        </Layer>
        <Sweat t={t} />
        <Sigh t={t} />
        <Feather t={t} from={TRY + 0.4} startX={26} />
        <Feather t={t} from={TRY + 1.2} startX={84} />
        <Dust t={t} />
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
    { at: 0, label: 'くさはらに しょんぼり ひよこ', sound: 'pop' },
    { at: GLIDE, label: '大きな とりが ぱたぱた とんでいく' },
    { at: TRY, label: 'まねして はねを ぱたぱた', sound: 'pop' },
    { at: TIRED, label: 'ひとやすみ「ふう」' },
    { at: JUMP, label: 'えいっ! うかんで はねを たかく あげる', sound: 'pop' },
    { at: INK, label: '2まい の はね に ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '羽 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
