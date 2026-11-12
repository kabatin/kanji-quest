/*
 * 明(あかるい): お日さま と お月さま が ならんで ひかって、とても あかるい。
 *
 * ほね(画と絵の対応)
 *   1〜4画目(日) … お日さま。まるい おひさま が、日の わく の中に ちょうど おさまる
 *                    (1・2画目 = おひさまの 左右の ふち、3画目 = かお の まんなか、
 *                     2画目の上 と 4画目 = 上下に のびた ひかり)
 *   5画目(ノ)    … 三日月の うちがわ の ふち(上の つの から、左下の つの まで)
 *   6画目        … 三日月の そとがわ の まるい ふち(上の つの から 右へ まわって 下へ)
 *   7・8画目     … 三日月の からだ の中(かお の 上と下)
 *
 * ながれ
 *   よるに なる(山が あらわれ、ほしが きらきら。うさぎ は ねている・あさがお は つぼみ)
 *   → 右の 山から お月さま が のぼる(すこし あかるくなる)
 *   → 左の 山から お日さま も のぼる(あさやけ。そらが あおく なり、ほしが きえる)
 *   → ならんだ ふたり が 見あわせて にっこり。あさがお が ひらく
 *   → ふたりで ぴかぴか ひかって、とても あかるい(うさぎ が 目をさまして ぴょんぴょん)
 *   → ほね が ひかって、絵が うすくなり、字「明」が のこる
 *
 * お日さま・お月さま は、ほんものの かたち を守る(字の形に合わせるために ゆがめない):
 *   お日さま は まんまる。日の わく は 四角だが、まるい おひさま と 上下の ひかり で だいたい 重ねる。
 *   お月さま は まるい月の 右がわ だけが ひかる 三日月(そとがわ は まんまるの 円、うちがわ は だ円)。
 *   ふたり の 大きさ は ちがうが、字の 日 と 月 の 大きさに 合わせた。
 *   (ほんとうの 空では、三日月の ひかる がわ は お日さま の ほうを むく。ここでは 字の 月 と、
 *    むかしの 字の 形〈左に 日、右に ふくらんだ 月〉に 合わせて、右が ふくらんだ 三日月に した)
 */
import { backOut, clamp01, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '明'

const SUN = '#ffcc3d'
const SUN_LIGHT = '#ffe17f'
const RAY = '#ffad38'
const MOON = '#fff0a6'
const MOON_SHADE = '#f4d878'
const GLOW = '#fff4c2'
const FACE_INK = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const HILL_FAR = '#d6eebf'
const HILL_NEAR = '#c9e7ad'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const FUR = '#ffffff'
const FUR_SHADE = '#e6e1ee'
const PINK = '#f7a8b8'
const PETAL = '#8a7cf2'
const PETAL_LIGHT = '#cbc2ff'
/** よるの いろ。山や 生きものは、くらいほど この色に ちかづく */
const NIGHT = '#141c3c'

/** そらの いろ。あかるさ(0 = まよなか 〜 1 = とても あかるい)ごとに */
const SKY: readonly (readonly [number, string])[] = [
  [0, '#18224a'],
  [0.24, '#27376f'],
  [0.5, '#7488cb'],
  [0.74, '#8fd0fb'],
  [1, '#a6dcff'],
]

/** くぎり の時間(秒) */
const MOON_RISE = 0.9
const SUN_RISE = 2.6
/** ならんで、見あわせる */
const SIDE = 4.3
/** ふたりで ぴかぴか ひかる */
const SHINE = 5.1
const INK = 6.9
const DONE = 9.8
const DURATION = 10.5

/** お日さま: まんなか と 大きさ(日の わく の まんなかに おさまる) */
const SUN_C: readonly [number, number] = [30.5, 46.3]
const SUN_R = 13.4
/** ひかりの 先(上下の ひかりが、2画目の上 と 4画目に とどく) */
const RAY_FROM = 16.6
const RAY_LONG = 21.2
const RAY_SHORT = 19.2

/** お月さま: 三日月の 上の つの(5画目の 書きはじめ)と 下の つの(5画目の 書きおわり) */
const MOON_TOP: readonly [number, number] = [57.6, 16.2]
const MOON_BOTTOM: readonly [number, number] = [42.2, 93.8]
/** まるい月の まんなか と 大きさ(2つの つの は、円の ちょうど はんたいがわ) */
const MOON_C: readonly [number, number] = [(MOON_TOP[0] + MOON_BOTTOM[0]) / 2, (MOON_TOP[1] + MOON_BOTTOM[1]) / 2]
const MOON_R = Math.hypot(MOON_TOP[0] - MOON_BOTTOM[0], MOON_TOP[1] - MOON_BOTTOM[1]) / 2
/** 月の かたむき(つの と つの を むすぶ線が、ま上から 何度 たおれているか) */
const MOON_TILT = (Math.atan2(MOON_TOP[0] - MOON_BOTTOM[0], MOON_BOTTOM[1] - MOON_TOP[1]) * 180) / Math.PI
/** うちがわ の ふち(だ円)が、右へ どれだけ ふくらむか(5画目の ふくらみ に合わせる) */
const MOON_INNER = 10
/** 三日月の からだ の まんなか: うちがわ と そとがわ の ふち の ちょうど あいだ(ひかる ときの じく) */
const MOON_BODY: readonly [number, number] = [
  MOON_C[0] + (Math.cos((MOON_TILT * Math.PI) / 180) * (MOON_R + MOON_INNER)) / 2,
  MOON_C[1] + (Math.sin((MOON_TILT * Math.PI) / 180) * (MOON_R + MOON_INNER)) / 2,
]

const SUN_FACE: readonly [number, number] = [30.5, 44.6]
const MOON_FACE: readonly [number, number] = [74.2, 53]

/** うさぎ の 足もと と、あさがお の ねもと */
const RABBIT: readonly [number, number] = [98.6, 96.4]
const ASAGAO: readonly [number, number] = [9, 97.5]

type Stop = readonly [number, string]

/** '#rrggbb' を [赤, 緑, 青] に */
function rgbOf(hex: string): readonly [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** 色 a から 色 b へ、p(0〜1)だけ 近づけた色 */
function mixColor(a: string, b: string, p: number): string {
  const from = rgbOf(a)
  const to = rgbOf(b)
  const k = clamp01(p)
  const [r, g, bl] = from.map((c, i) => Math.round(c + (to[i] - c) * k))
  return `rgb(${r}, ${g}, ${bl})`
}

/** x(0〜1)に 合った色を、ならべた色の あいだから 作る */
function ramp(stops: readonly Stop[], x: number): string {
  const next = stops.findIndex(([at]) => at > x)
  if (next === 0) return stops[0][1]
  if (next === -1) return stops[stops.length - 1][1]
  const [fromAt, fromColor] = stops[next - 1]
  const [toAt, toColor] = stops[next]
  return mixColor(fromColor, toColor, (x - fromAt) / (toAt - fromAt))
}

/** よるの くらさ(0〜1)で、色を くらく する。まっくら には しない(形が 見えるように) */
const dim = (color: string, dark: number) => mixColor(color, NIGHT, dark * 0.72)

/** 三日月の かたち。inner = うちがわ の だ円の ふくらみ */
function crescent(inner: number): string {
  const [tx, ty] = MOON_TOP
  const [bx, by] = MOON_BOTTOM
  // そとがわ: 上の つの から 右まわり に 半円。うちがわ: 下の つの から だ円で 上へ もどる
  return `M${tx} ${ty} A${MOON_R} ${MOON_R} 0 0 1 ${bx} ${by} A${inner} ${MOON_R} ${MOON_TILT} 0 0 ${tx} ${ty} Z`
}

/** うちがわ の ふち に そった かげ(だ円 inner から だ円 outer の あいだ) */
function terminatorBand(inner: number, outer: number): string {
  const [tx, ty] = MOON_TOP
  const [bx, by] = MOON_BOTTOM
  return `M${tx} ${ty} A${outer} ${MOON_R} ${MOON_TILT} 0 1 ${bx} ${by} A${inner} ${MOON_R} ${MOON_TILT} 0 0 ${tx} ${ty} Z`
}

/** そらの あかるさ(0 = まよなか 〜 1 = とても あかるい) */
function lightAt(t: number): number {
  return 0.24 * span(t, MOON_RISE, MOON_RISE + 1.6, easeOut) + 0.5 * span(t, SUN_RISE + 0.1, SIDE, easeInOut) + 0.26 * span(t, SHINE, SHINE + 0.4, easeOut)
}

/** ぴかぴか: 1秒に 2回 ふくらむ */
function pulseAt(t: number): number {
  const p = span(t, SHINE, SHINE + 1)
  return p > 0 && p < 1 ? Math.abs(Math.sin(p * Math.PI * 2)) : 0
}

function Sky({ t, light }: { readonly t: number; readonly light: number }) {
  // あさやけ: お日さまが のぼってくる 左の 山の うしろ だけが、だいだい色に そまる。
  // そらが あおく なるころには きえる
  const dawn = during(t, SUN_RISE - 0.3, SUN_RISE + 1.3, 0.55)
  return (
    <Layer opacity={span(t, 0, 0.35)}>
      <rect x="-1" y="-1" width="111" height="111" fill={ramp(SKY, light)} />
      <ellipse cx="24" cy="94" rx="62" ry="30" fill="#ffae8a" opacity={dawn * 0.35} />
      <ellipse cx="24" cy="94" rx="44" ry="21" fill="#ffbf8f" opacity={dawn * 0.5} />
      <ellipse cx="24" cy="94" rx="27" ry="13" fill="#ffe0a3" opacity={dawn * 0.6} />
    </Layer>
  )
}

/** よるの ほし: 1つずつ ぽつぽつ ともり、またたく。そらが あかるくなると きえる */
const STARS: readonly (readonly [number, number, number])[] = [
  [8, 9, 1.8],
  [22, 4.6, 1.2],
  [35, 13, 1.5],
  [14, 27, 1.1],
  [47, 6, 1.3],
  [64, 5, 1.1],
  [97, 9, 1.7],
  [104, 25, 1.2],
  [95, 40, 1.4],
  [6, 46, 1.2],
  [101, 55, 1.1],
]

function Stars({ t, light }: { readonly t: number; readonly light: number }) {
  const fade = 1 - span(light, 0.3, 0.62)
  if (fade <= 0) return null
  return (
    <g opacity={fade}>
      {STARS.map(([x, y, r], i) => {
        const pop = span(t, 0.3 + i * 0.06, 0.55 + i * 0.06, backOut)
        const twinkle = 0.7 + 0.3 * wave(t, 1.4, i * 0.37)
        return <Star key={i} cx={x} cy={y} r={r * pop * twinkle} color="#fff6c4" />
      })}
    </g>
  )
}

type Mood = 'sleepy' | 'smile' | 'blink' | 'happy'

/** まるい かお。look = ひとみ の むき(-1 = 左 〜 1 = 右) */
function Face({ mood, look }: { readonly mood: Mood; readonly look: number }) {
  return (
    <>
      <circle cx="-7" cy="4.4" r="2.2" fill={CHEEK} opacity="0.6" />
      <circle cx="7" cy="4.4" r="2.2" fill={CHEEK} opacity="0.6" />
      {mood === 'sleepy' && (
        <>
          {/* のぼりはじめ は まだ ねむい: 目を とじて、ふあぁ と あくび */}
          <path d="M-5.6 -0.4 Q-4.2 1.2 -2.8 -0.4 M2.8 -0.4 Q4.2 1.2 5.6 -0.4" fill="none" stroke={FACE_INK} strokeWidth="1.1" strokeLinecap="round" />
          <ellipse cx="0" cy="5.2" rx="1.3" ry="1.6" fill={MOUTH} />
        </>
      )}
      {(mood === 'smile' || mood === 'blink') && (
        <>
          {mood === 'smile' ? (
            <>
              <circle cx={-4.2 + look * 1.1} cy="0" r="1.3" fill={FACE_INK} />
              <circle cx={4.2 + look * 1.1} cy="0" r="1.3" fill={FACE_INK} />
            </>
          ) : (
            // まばたき: 目が いっしゅん 線に なる
            <path d="M-5.4 0.2 H-3 M3 0.2 H5.4" stroke={FACE_INK} strokeWidth="1.1" strokeLinecap="round" />
          )}
          <path d="M-2.7 4.4 Q0 7.2 2.7 4.4" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'happy' && (
        <>
          {/* うれしくて、目が にっこり 弓なり */}
          <path d="M-5.7 0.6 Q-4.2 -1.5 -2.7 0.6 M2.7 0.6 Q4.2 -1.5 5.7 0.6" fill="none" stroke={FACE_INK} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M-3 3.8 Q0 9.2 3 3.8 Z" fill={MOUTH} />
        </>
      )}
    </>
  )
}

type BodyProps = { readonly t: number; readonly mood: Mood; readonly look: number; readonly lean: number; readonly glow: number }

/** お日さま。ひかり は ゆっくり まわり、字になる しゅんかん に 上下の ひかり が まっすぐ たつ */
function Sun({ t, mood, look, lean, glow }: BodyProps) {
  const [cx, cy] = SUN_C
  return (
    <>
      {/* まわりの ひかり: 白を うすく かさねて、そらを あかるく する */}
      <circle cx={cx} cy={cy} r={SUN_R + 11 + glow * 4} fill="#ffffff" opacity={0.12 + glow * 0.12} />
      <circle cx={cx} cy={cy} r={SUN_R + 6 + glow * 3} fill="#ffffff" opacity={0.16 + glow * 0.14} />
      <circle cx={cx} cy={cy} r={SUN_R + 2.2} fill="#fff3b8" opacity={0.3} />
      <Layer rotate={(t - INK) * 9} origin={SUN_C}>
        {Array.from({ length: 12 }, (_, i) => {
          // 先の とがった ひかり。長いのと 短いのを かわりばんこに
          const reach = (i % 2 === 0 ? RAY_LONG : RAY_SHORT) + glow * 2.6
          const half = i % 2 === 0 ? 1.8 : 1.4
          return (
            <path
              key={i}
              d={`M${cx - half} ${cy - RAY_FROM} Q${cx - 0.5} ${cy - reach + 1} ${cx} ${cy - reach} Q${cx + 0.5} ${cy - reach + 1} ${cx + half} ${cy - RAY_FROM} Z`}
              fill={RAY}
              strokeLinejoin="round"
              stroke={RAY}
              strokeWidth="0.8"
              transform={`rotate(${i * 30} ${cx} ${cy})`}
            />
          )
        })}
      </Layer>
      <circle cx={cx} cy={cy} r={SUN_R} fill={SUN} />
      {/* ひかりが あたる 左上の ふち */}
      <path d={`M${cx - 10.4} ${cy - 2.2} A10.6 10.6 0 0 1 ${cx - 2.2} ${cy - 10.4}`} fill="none" stroke={SUN_LIGHT} strokeWidth="2.4" strokeLinecap="round" />
      <Layer x={SUN_FACE[0]} y={SUN_FACE[1]} rotate={lean}>
        <Face mood={mood} look={look} />
      </Layer>
    </>
  )
}

/** お月さま。まるい月の 右がわ だけが ひかる 三日月。night = よるの こさ(よるほど まわりが ぼんやり ひかる) */
function Moon({ mood, look, lean, glow, night }: Omit<BodyProps, 't'> & { readonly night: number }) {
  const shape = crescent(MOON_INNER)
  return (
    <>
      {/* ぼんやり ひかる まわり: 月の からだ の 少し 左上(つの の ほうまで とどくよう)を まんなかに、うすい わ を かさねる */}
      {[46, 37, 29].map((r) => (
        <circle key={r} cx={MOON_BODY[0] - 4} cy={MOON_BODY[1] - 4.5} r={r + glow * 3} fill={GLOW} opacity={0.035 + night * 0.06 + glow * 0.05} />
      ))}
      <path d={shape} fill={MOON} />
      {/* うちがわ の ふち は、ひかりが ななめに あたるので 少し くらい */}
      <path d={terminatorBand(MOON_INNER, MOON_INNER + 5)} fill={MOON_SHADE} />
      {/* くぼみ(クレーター) */}
      <circle cx="79" cy="36" r="2.2" fill={MOON_SHADE} />
      <circle cx="82.5" cy="72" r="1.8" fill={MOON_SHADE} />
      <circle cx="65" cy="83" r="1.6" fill={MOON_SHADE} />
      <Layer x={MOON_FACE[0]} y={MOON_FACE[1]} rotate={lean}>
        <Face mood={mood} look={look} />
      </Layer>
    </>
  )
}

/** ぴかぴか の わ: お日さま と お月さま から、ひかりの わ が ひろがる */
function Rings({ t }: SceneProps) {
  return (
    <>
      {[0, 0.5].map((delay) => {
        const p = span(t, SHINE + delay, SHINE + delay + 0.8, easeOut)
        if (p <= 0 || p >= 1) return null
        const width = 2.6 * (1 - p) + 0.5
        const grow = 1.08 + p * 0.3
        return (
          <g key={delay} fill="none" stroke="#ffffff" opacity={(1 - p) * 0.9}>
            <circle cx={SUN_C[0]} cy={SUN_C[1]} r={RAY_LONG + 2 + p * 14} strokeWidth={width} />
            <Layer scale={grow} origin={MOON_BODY}>
              <path d={crescent(MOON_INNER)} strokeWidth={width / grow} strokeLinejoin="round" />
            </Layer>
          </g>
        )
      })}
    </>
  )
}

/** ぴかぴか の ほし: ふたりの まわりで、じゅんばんに きらっ と ひかる */
const TWINKLES: readonly (readonly [number, number, number])[] = [
  [11, 27, 3.2],
  [50, 33, 2.6],
  [12, 66, 2.4],
  [96, 28, 3.4],
  [99, 70, 2.6],
  [70, 9, 2.8],
]

function Twinkles({ t }: SceneProps) {
  return (
    <>
      {TWINKLES.map(([x, y, r], i) => {
        const show = during(t, SHINE + 0.1 + i * 0.12, SHINE + 1.2 + i * 0.1, 0.2)
        if (show <= 0) return null
        return <Star key={i} cx={x} cy={y} r={r * show} color={i % 2 === 0 ? '#ffffff' : '#ffe27a'} spin={t * 90} />
      })}
    </>
  )
}

function Land({ t, dark }: { readonly t: number; readonly dark: number }) {
  // 山は、よるの そらが できてから、下から せりあがる
  const rise = span(t, 0.1, 0.65, easeOut)
  return (
    <Layer opacity={span(t, 0.05, 0.3)} y={(1 - rise) * 22}>
      {/* 左の 山(お日さま が のぼってくる)・右の 山(お月さま が のぼってくる) */}
      <path d="M-4 82 C6 73 24 72 33 83 Q38 89 42 99 H-4 Z" fill={dim(HILL_FAR, dark)} />
      <path d="M62 99 Q88 80 113 83 V99 Z" fill={dim(HILL_NEAR, dark)} />
      <path d="M-4 96 Q24 93.5 50 96.6 Q80 99.4 113 95.4 V110 H-4 Z" fill={dim(GRASS, dark)} />
      {[24, 54, 72, 86].map((x) => (
        <path key={x} d={`M${x} 98.4 l1.3 -3.4 l1 3 l1.5 -4 l0.8 4.4 Z`} fill={dim(LEAF, dark)} />
      ))}
    </Layer>
  )
}

/** あさがお: よるは ねじれた つぼみ。あさの ひかりで、ぱっと ひらく */
function Asagao({ t, dark }: { readonly t: number; readonly dark: number }) {
  const show = span(t, 0.35, 0.8)
  if (show <= 0) return null
  const bloom = span(t, SIDE + 0.15, SIDE + 0.7, backOut)
  const sway = wave(t, 2.8) * 2.5
  const [x, y] = ASAGAO
  const leaf = dim(LEAF, dark)
  return (
    <Layer opacity={show} rotate={sway} origin={ASAGAO}>
      <path d={`M${x} ${y} C${x - 2.4} ${y - 6} ${x + 2.6} ${y - 10} ${x + 0.8} ${y - 16}`} fill="none" stroke={dim(LEAF_DARK, dark)} strokeWidth="1.2" strokeLinecap="round" />
      {/* 葉の え(くき から 出て、葉の つけね に つながる) */}
      <path d={`M${x + 0.1} ${y - 5.4} L${x - 1.2} ${y - 6.4} M${x + 0.7} ${y - 9.8} L${x + 1.6} ${y - 10.6}`} fill="none" stroke={dim(LEAF_DARK, dark)} strokeWidth="0.8" strokeLinecap="round" />
      {/* ハートの形の 葉: くき から 出た 葉の え の先に つく */}
      <path d="M0 0 C-1.8 -1.8 -4.2 -0.4 -3.4 1.8 C-2.6 3.6 -0.8 4.4 0 5.8 C0.8 4.4 2.6 3.6 3.4 1.8 C4.2 -0.4 1.8 -1.8 0 0 Z" fill={leaf} transform={`translate(${x - 1.2} ${y - 6.4}) rotate(58)`} />
      <path d="M0 0 C-1.8 -1.8 -4.2 -0.4 -3.4 1.8 C-2.6 3.6 -0.8 4.4 0 5.8 C0.8 4.4 2.6 3.6 3.4 1.8 C4.2 -0.4 1.8 -1.8 0 0 Z" fill={dim(LEAF_DARK, dark)} transform={`translate(${x + 1.6} ${y - 10.6}) rotate(-62) scale(0.85)`} />
      <Layer x={x + 0.8} y={y - 16}>
        {/* がく */}
        <path d="M-1.6 0.6 L0 -1.4 L1.6 0.6 Z" fill={leaf} />
        {/* つぼみ: ねじれた かさ の ような 形 */}
        <Layer scale={1 - bloom} origin={[0, -1]}>
          <path d="M0 -1 C-1.7 -3.4 -1.1 -6.6 0.2 -8.4 C1.3 -6.6 1.7 -3.4 0 -1 Z" fill={dim(PETAL_LIGHT, dark)} />
          <path d="M-0.6 -2.4 Q0.8 -4.6 0 -7" fill="none" stroke={dim(PETAL, dark)} strokeWidth="0.7" strokeLinecap="round" />
        </Layer>
        {/* ひらいた 花: がく から ほそい つつ が のびて、先が ラッパ の ように ひらく。お日さま の ほうを むく */}
        <Layer scale={bloom} origin={[0, -1]}>
          <path d="M-0.6 -0.8 L-1.8 -5.6 L1.6 -6 L0.6 -0.8 Z" fill={dim(PETAL_LIGHT, dark)} />
        </Layer>
        <Layer y={-6.6} rotate={-20} scale={bloom}>
          <ellipse cx="0" cy="0" rx="5" ry="3.4" fill={dim(PETAL, dark)} />
          {[0, 72, 144, 216, 288].map((deg) => (
            <path key={deg} d="M0 0 L0 -4.4" stroke={dim(PETAL_LIGHT, dark)} strokeWidth="0.7" strokeLinecap="round" transform={`scale(1 0.68) rotate(${deg})`} />
          ))}
          <ellipse cx="0" cy="0" rx="1.8" ry="1.25" fill="#f6f3ff" />
        </Layer>
      </Layer>
    </Layer>
  )
}

/** うさぎ(左むき)。よるは まるくなって ねむり、とても あかるくなると 目をさまして とびはねる */
function Rabbit({ t, dark }: { readonly t: number; readonly dark: number }) {
  const show = span(t, 0.4, 0.85)
  if (show <= 0) return null
  const awake = span(t, SHINE + 0.25, SHINE + 0.6, easeOut)
  const hopP = span(t, SHINE + 0.65, SHINE + 1.65)
  const hop = hopP > 0 && hopP < 1 ? Math.abs(Math.sin(hopP * Math.PI * 2)) * 3.4 : 0
  const fur = dim(FUR, dark)
  const shade = dim(FUR_SHADE, dark)
  const pink = dim(PINK, dark)
  // みみ: ねていると せなか に ねかせ、おきると ぴんと たてる
  const earNear = mix(t, SHINE + 0.25, SHINE + 0.6, 72, 10, backOut)
  const earFar = earNear + 14
  return (
    <Layer opacity={show} x={RABBIT[0]} y={RABBIT[1]}>
      <ellipse cx="0.6" cy="0.3" rx={6.6 - hop * 0.6} ry="1.2" fill="#000000" opacity="0.12" />
      <Layer y={-hop} rotate={hop * 2.4} origin={[0, 0]}>
        <circle cx="6.8" cy="-4.4" r="2.1" fill={fur} />
        <ellipse cx="2.8" cy="-0.8" rx="3.4" ry="1.2" fill={shade} />
        <ellipse cx="1.6" cy="-4.8" rx="6" ry="4.6" fill={fur} />
        <ellipse cx="3.8" cy="-3.4" rx="2.9" ry="2.5" fill={shade} />
        <ellipse cx="-3.6" cy="-0.9" rx="1.7" ry="1.1" fill={fur} />
        {/* あたま: ねていると 下を むく(くび の つけね を じく に) */}
        <Layer rotate={-(1 - awake) * 26} origin={[-2.2, -7]}>
          <Layer x={-2.4} y={-12.2} rotate={earFar}>
            <ellipse cx="0" cy="-3.7" rx="1.3" ry="4" fill={shade} />
          </Layer>
          <Layer x={-3.8} y={-12.4} rotate={earNear}>
            <ellipse cx="0" cy="-3.7" rx="1.35" ry="4" fill={fur} />
            <ellipse cx="0" cy="-3.5" rx="0.6" ry="2.8" fill={pink} />
          </Layer>
          <circle cx="-4.4" cy="-9.4" r="3.9" fill={fur} />
          <circle cx="-5.4" cy="-7.9" r="1.1" fill={pink} opacity="0.55" />
          <circle cx="-8.1" cy="-9.1" r="0.6" fill={pink} />
          {awake > 0.5 ? <circle cx="-5.9" cy="-10.1" r="0.7" fill={FACE_INK} /> : <path d="M-6.8 -10 Q-5.9 -9.2 -5 -10" fill="none" stroke={FACE_INK} strokeWidth="0.6" strokeLinecap="round" />}
        </Layer>
      </Layer>
    </Layer>
  )
}

/** うさぎ の「すやすや」。あたまの上から 右上へ のぼる(左上は お月さま に かさなって 見えにくい) */
function Snore({ t }: SceneProps) {
  const show = during(t, 0.9, SHINE + 0.3, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show} fill="#b9c6ff" fontWeight="700" fontFamily="inherit">
      {[0, 0.7].map((offset, i) => {
        const p = ((t + offset) % 1.4) / 1.4
        return (
          <text key={offset} x={RABBIT[0] - 4.5 + p * 5} y={RABBIT[1] - 15 - p * 9} fontSize={3.2 + i * 1 + p * 1.6} opacity={Math.sin(p * Math.PI)}>
            z
          </text>
        )
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)
  const light = lightAt(t)
  const dark = 1 - light
  const pulse = pulseAt(t)

  // のぼる: 山の うしろ(わく の下)から、いまの ばしょ まで
  const moonUp = span(t, MOON_RISE, MOON_RISE + 1.7, easeOut)
  const sunUp = span(t, SUN_RISE, SUN_RISE + 1.6, easeOut)
  // 見あわせる: お日さま は 右(お月さま)を、お月さま は 左(お日さま)を 見て、すこし かたむく
  const side = span(t, SIDE, SIDE + 0.45, easeInOut)
  // 目が あったら、お日さま → お月さま の じゅんに こくん と うなずく(「いっしょに ひかろう」「うん」)
  const sunNod = Math.sin(span(t, SIDE + 0.4, SIDE + 0.7) * Math.PI) * 1.4
  const moonNod = Math.sin(span(t, SIDE + 0.5, SIDE + 0.8) * Math.PI) * 1.4
  const mood: Mood = t >= SHINE ? 'happy' : 'smile'
  // ときどき まばたき して、生きている 感じを出す
  const blinking = (at: number) => t >= at && t < at + 0.13
  const moonMood: Mood = blinking(MOON_RISE + 1.45) ? 'blink' : mood
  // お日さま は、のぼりはじめ は まだ ねむくて、のぼりきる 前に ぱちっと 目をあけ、ぱちぱち まばたき
  const sunMood: Mood = t < SUN_RISE + 1.05 ? 'sleepy' : blinking(SUN_RISE + 1.35) ? 'blink' : mood
  const relax = 1 - span(t, INK - 0.6, INK - 0.1)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} light={light} />
        <Stars t={t} light={light} />
        {/* お日さま は お月さま より とおく に あるので、先に描く(かさなると 月の うしろ) */}
        <Layer opacity={span(t, SUN_RISE, SUN_RISE + 0.1)} x={(1 - sunUp) * -4} y={(1 - sunUp) * 74 + sunNod}>
          <Layer scale={1 + pulse * 0.06} origin={SUN_C}>
            <Sun t={t} mood={sunMood} look={side * relax} lean={side * 7 * relax} glow={pulse} />
          </Layer>
        </Layer>
        <Layer opacity={span(t, MOON_RISE, MOON_RISE + 0.1)} x={(1 - moonUp) * 10} y={(1 - moonUp) * 90 + moonNod}>
          <Layer scale={1 + pulse * 0.05} origin={MOON_BODY}>
            <Moon mood={moonMood} look={-side * relax} lean={-side * 6 * relax} glow={pulse} night={dark} />
          </Layer>
        </Layer>
        <Rings t={t} />
        <Land t={t} dark={dark} />
        <Asagao t={t} dark={dark} />
        <Rabbit t={t} dark={dark} />
        <Snore t={t} />
        <Twinkles t={t} />
        {/* ぴかっ: そら いちめん が まぶしく なる */}
        <rect x="-1" y="-1" width="111" height="111" fill="#fffbea" opacity={pulse * 0.24} />
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Layer scale={1 + bump} origin={[54.5, 54.5]}>
        <Ink char={CHAR} progress={ink.progress} tint={ink.tint} />
      </Layer>
      <Sparkles cx={54.5} cy={55} progress={ink.sparkle} />
    </>
  )
}

const scene: SceneModule = {
  char: CHAR,
  duration: DURATION,
  beats: [
    { at: 0, label: 'よるに なる。ほしが きらきら', sound: 'pop' },
    { at: MOON_RISE, label: 'お月さまが のぼる' },
    { at: SUN_RISE, label: 'お日さまも のぼって、そらが あかるくなる', sound: 'pop' },
    { at: SIDE, label: 'ならんで、にっこり 見あわせる' },
    { at: SHINE, label: 'ふたりで ぴかぴか ひかって、とても あかるい', sound: 'coin' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '明 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
