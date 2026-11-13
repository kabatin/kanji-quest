/*
 * 朝(あさ): 草の あいだから お日さまが のぼり、空には まだ 月。にわとりが「コケコッコー」。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 左の はし から のびた 木の えだ(わかい 葉が ついている)
 *   2画目(丨)  … えだ から 上に のびる わかめ と、下に さがる つる(つるの さきが お日さまの すぐ上)
 *   3〜6画目   … のぼってきた お日さま(日)。まるい お日さまを 四角い 日の 場所に のせる
 *   7画目(一)  … たおれない 木の よこぼう(さく の よこぎ)。にわとりが のっている
 *   8画目(丨)  … さく の たてぼう(地面まで)
 *   9画目(ノ)  … 右の 空に のこる 大きな 三日月の、ないがわ の ふち
 *   10画目      … 三日月の そとがわ(まるく ふくらむ ほう)
 *   11・12画目 … 月の まえを ながれていく 細い うす雲 2本
 *
 * ながれ
 *   まだ くらい 夜あけ。月が 空に のこり、にわとりは さくの上で ぐっすり ねている(ぐうぐう)
 *   → 地平線の 草の あいだから お日さまが のぼり、空が 明るくなる
 *   → まぶしくて にわとりが めをさまし、びっくり! → お日さまを 見て にっこり
 *   → 大きく むねを ふくらませて「コケコッコー!」(月の前を 雲が ながれる)
 *   → 朝の できあがり。ほね が ひかって、絵が うすくなり、字「朝」が のこる
 *
 * にわとりは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   くび は 体の まえから のび、あたまに とさか・くちばし・あご、体の うしろに 長い おび(尾)。
 *   足は 2本で さくの よこぎに のり、はね は かた(せなか)の ほうから 出て はばたく。
 */
import { backOut, clamp01, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '朝'

/** くぎり の時間(秒) */
const SUNRISE = 1.4
/** まぶしくて めをさます */
const WAKE = 3.6
/** コケコッコー の はじまり と おわり */
const CROW = 5.0
const CROW_END = 6.3
const INK = 6.6
const DONE = 9.6
const DURATION = 10.2

/** お日さまの 場所(日の 四角の まんなか)と 大きさ */
const SUN_AT: readonly [number, number] = [36, 48]
const SUN_R = 12.5
/** にわとりが たつ 場所(さくの よこぎの 上)と 大きさ */
const ROOST: readonly [number, number] = [18, 73.7]
const ROOSTER_SCALE = 1.1

const NIGHT_TINT = '#243063'
const SKY_NIGHT = '#27346b'
const SKY_DAWN = '#f3b08c'
const SKY_DAY = '#bfe5ff'
const SUN = '#ffd24a'
const SUN_LIGHT = '#ffe786'
const MOON = '#fff3b8'
const MOON_SHADE = '#f0db8c'

/** 夜は ぜんぶの いろが 青ぐらく なる。物の いろは ここに ならべて、夜の ぶんだけ そめる。 */
const BASE = {
  hill: '#a6d99f',
  grass: '#c5e8a9',
  blade: '#55b86e',
  bladeDark: '#3f9c59',
  bark: '#8c5b3c',
  barkDark: '#70452b',
  leaf: '#6fcb82',
  leafDark: '#3f9c59',
  body: '#e8803a',
  bodyLight: '#f7c885',
  neck: '#ef8f45',
  wing: '#f2a64e',
  tail: '#2f8a78',
  tailLight: '#4aae96',
  comb: '#e8534a',
  beak: '#f2b632',
  cloud: '#b3bfe8',
} as const
type Pal = { readonly [K in keyof typeof BASE]: string }

function mixHex(a: string, b: string, k: number): string {
  const parts = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const [ar, ag, ab] = parts(a)
  const [br, bg, bb] = parts(b)
  const f = (x: number, y: number) => Math.round(x + (y - x) * clamp01(k)).toString(16).padStart(2, '0')
  return `#${f(ar, br)}${f(ag, bg)}${f(ab, bb)}`
}

function palette(night: number): Pal {
  return Object.fromEntries(Object.entries(BASE).map(([name, color]) => [name, mixHex(color, NIGHT_TINT, night * 0.5)])) as Pal
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/** 空: 夜の 青 → 夜あけの だいだい → 朝の 水いろ。星は 夜だけ。 */
function Sky({ t, night }: SceneProps & { readonly night: number }) {
  const dawn = mixHex(SKY_NIGHT, SKY_DAWN, span(t, SUNRISE, 3.6))
  const color = mixHex(dawn, SKY_DAY, span(t, 3.4, 5.6))
  const glow = during(t, SUNRISE, 5.8, 1.6) * 0.55
  const stars: readonly (readonly [number, number, number])[] = [
    [9, 8, 2],
    [22, 13, 1.6],
    [50, 8, 2.2],
    [58, 20, 1.5],
    [7, 40, 1.8],
  ]
  return (
    <>
      <rect x="0" y="0" width="109" height="109" fill={color} />
      <ellipse cx={SUN_AT[0]} cy="92" rx="62" ry="42" fill="#ffb877" opacity={glow} />
      {stars.map(([x, y, r], i) => (
        <Star key={i} cx={x} cy={y} r={r * (0.8 + 0.2 * wave(t, 1.3, i))} color="#fff6c8" spin={i * 20} />
      )).map((star, i) => (
        <g key={i} opacity={night * 0.9}>
          {star}
        </g>
      ))}
    </>
  )
}

/** のこっている 月: 右の 空に 大きな 三日月。 */
function Moon({ night }: { readonly night: number }) {
  return (
    <>
      <circle cx="80" cy="56" r="40" fill={MOON} opacity={night * 0.12} />
      <path d="M65.8 20 C100 18 104 82 55 93 C60 84 67.5 66 67.6 42 C67.6 32 66.5 24 65.8 20 Z" fill={MOON} />
      <circle cx="84" cy="70" r="2.4" fill={MOON_SHADE} />
      <circle cx="79" cy="82" r="1.7" fill={MOON_SHADE} />
      <circle cx="87" cy="48" r="1.5" fill={MOON_SHADE} />
    </>
  )
}

/** 月の まえを 右から ながれてくる 細い うす雲(11・12画目の 場所に とまる)。 */
function Wisps({ t, pal }: SceneProps & { readonly pal: Pal }) {
  const a = (1 - span(t, 2.2, 5.6, easeOut)) * 42
  const b = (1 - span(t, 2.6, 6.0, easeOut)) * 34
  return (
    <>
      <Layer x={a}>
        <Bone char={CHAR} n={11} color={pal.cloud} width={4.4} />
        <circle cx="75" cy="38.3" r="2.8" fill={pal.cloud} />
      </Layer>
      <Layer x={b}>
        <Bone char={CHAR} n={12} color={pal.cloud} width={4.4} />
        <circle cx="82" cy="58.4" r="2.8" fill={pal.cloud} />
      </Layer>
    </>
  )
}

/** お日さま: じめんの かげ から ゆっくり のぼる。 */
function Sun({ t }: SceneProps) {
  const rise = span(t, SUNRISE, 4.8, easeOut)
  if (rise <= 0) return null
  const [cx, cy] = SUN_AT
  return (
    <Layer y={(1 - rise) * 60}>
      <circle cx={cx} cy={cy} r={19 * rise} fill="#fff1b5" opacity={0.4} />
      <Layer rotate={t * 16} origin={[cx, cy]} opacity={span(rise, 0.5, 1)}>
        {Array.from({ length: 10 }, (_, i) => (
          <rect key={i} x={cx - 0.9} y={cy - 19.4} width="1.8" height="4.2" rx="0.9" fill={SUN} transform={`rotate(${i * 36} ${cx} ${cy})`} />
        ))}
      </Layer>
      <circle cx={cx} cy={cy} r={SUN_R} fill={SUN} />
      <circle cx={cx - 3} cy={cy - 3} r={SUN_R * 0.62} fill={SUN_LIGHT} />
    </Layer>
  )
}

/** とおくの おか と 地面。お日さまは おかの うしろから のぼる。 */
function Land({ pal }: { readonly pal: Pal }) {
  return (
    <>
      <path d="M-4 101 L-4 91 Q20 80 40 88 Q72 79 113 90 L113 101 Z" fill={pal.hill} />
      <ellipse cx="54.5" cy="98.6" rx="53" ry="5.2" fill={pal.grass} />
    </>
  )
}

function Leaf({ x, y, rot, size = 3, fill }: { readonly x: number; readonly y: number; readonly rot: number; readonly size?: number; readonly fill: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={`M0 0 Q${size * 0.7} ${-size * 0.9} ${size * 1.9} 0 Q${size * 0.7} ${size * 0.9} 0 0 Z`} fill={fill} />
    </g>
  )
}

/** 1・2画目: 左から のびた えだ。わかめ が 上に、つる が 下に さがる。 */
function Branch({ t, pal }: SceneProps & { readonly pal: Pal }) {
  const grow = span(t, 0, 0.9, backOut)
  const sway = wave(t, 3.2) * 1.6
  return (
    <Layer scale={0.4 + 0.6 * grow} opacity={span(t, 0, 0.3)} origin={[8, 28]}>
      <path d="M-6 30.8 Q6 28.8 16.9 27.13" fill="none" stroke={pal.bark} strokeWidth="4.2" strokeLinecap="round" />
      <Bone char={CHAR} n={1} color={pal.bark} width={3.2} />
      <Leaf x={8} y={29.6} rot={-50} fill={pal.leaf} />
      <Leaf x={21} y={27} rot={-60} fill={pal.leaf} />
      <Leaf x={29} y={25.6} rot={50} fill={pal.leafDark} />
      <Leaf x={42} y={24.6} rot={-55} fill={pal.leaf} />
      <Leaf x={48} y={24.2} rot={55} fill={pal.leafDark} />
      <Layer rotate={sway} origin={[35.8, 24.5]}>
        <Bone char={CHAR} n={2} color={pal.bark} width={2.2} to={0.52} />
        <Bone char={CHAR} n={2} color={pal.bladeDark} width={1.6} from={0.52} />
        <Leaf x={35.7} y={19} rot={-35} fill={pal.leaf} />
        <Leaf x={35.7} y={15.5} rot={-145} fill={pal.leafDark} />
        <Leaf x={35.5} y={12.4} rot={-80} fill={pal.leaf} size={3.4} />
        <Leaf x={35.8} y={29} rot={35} fill={pal.leaf} size={2.6} />
        <Leaf x={35.8} y={32.5} rot={150} fill={pal.leafDark} size={2.6} />
        <Leaf x={35.8} y={35.2} rot={80} fill={pal.leaf} size={2.4} />
      </Layer>
    </Layer>
  )
}

/** 7・8画目: さくの よこぎ と たてぼう。にわとりが のる。 */
function Fence({ pal }: { readonly pal: Pal }) {
  return (
    <>
      <Bone char={CHAR} n={8} color={pal.bark} width={4.8} />
      <Bone char={CHAR} n={7} color={pal.barkDark} width={4} />
      <ellipse cx="36" cy="62.4" rx="2.6" ry="1.4" fill={pal.bark} />
    </>
  )
}

/** 地面の 草。お日さまが 草の あいだから のぼって 見える。 */
function Tufts({ t, pal }: SceneProps & { readonly pal: Pal }) {
  const xs = [4, 14, 28, 44, 52, 64, 76, 92, 104]
  return (
    <>
      {xs.map((x, i) => {
        const lean = wave(t, 2.6, i * 0.7) * 1.1
        return (
          <path key={x} d={`M${x} 98 Q${x + lean * 0.5} ${94 - (i % 3)} ${x + lean} ${91 - (i % 3) * 1.4} Q${x + 1.6 + lean * 0.4} ${94} ${x + 2.4} 98 Q${x + 3 + lean * 0.3} ${95} ${x + 4 + lean} ${92.5 - (i % 2)} Q${x + 4.4} 95.6 ${x + 4.8} 98 Z`} fill={i % 2 ? pal.blade : pal.bladeDark} />
        )
      })}
    </>
  )
}

type Mood = 'asleep' | 'startled' | 'looking' | 'crow' | 'proud'

function moodAt(t: number): Mood {
  if (t < WAKE) return 'asleep'
  if (t < WAKE + 0.8) return 'startled'
  if (t < CROW) return 'looking'
  if (t < CROW_END + 0.2) return 'crow'
  return 'proud'
}

function Eye({ mood }: { readonly mood: Mood }) {
  if (mood === 'asleep') return <path d="M0.2 -0.4 Q1.8 1 3.4 -0.4" fill="none" stroke="#2b2b2b" strokeWidth="0.9" strokeLinecap="round" />
  if (mood === 'crow') return <path d="M0.2 0.4 Q1.8 -1.3 3.4 0.4" fill="none" stroke="#2b2b2b" strokeWidth="0.95" strokeLinecap="round" />
  if (mood === 'startled') {
    return (
      <>
        <circle cx="1.9" cy="-0.5" r="1.7" fill="#ffffff" />
        <circle cx="2.2" cy="-0.5" r="0.85" fill="#2b2b2b" />
      </>
    )
  }
  return (
    <>
      <circle cx="1.9" cy="-0.5" r="1.05" fill="#2b2b2b" />
      <circle cx="2.2" cy="-0.9" r="0.35" fill="#ffffff" />
    </>
  )
}

/** あたま: とさか・目・くちばし・あご。くちばしは ひらく。 */
function Head({ mood, open, pal }: { readonly mood: Mood; readonly open: number; readonly pal: Pal }) {
  return (
    <>
      <circle cx="0" cy="-3.9" r="1.6" fill={pal.comb} />
      <circle cx="-1.7" cy="-3.2" r="1.5" fill={pal.comb} />
      <circle cx="1.7" cy="-3.9" r="1.5" fill={pal.comb} />
      <circle cx="0" cy="0" r="4.1" fill={pal.neck} />
      <ellipse cx="2.5" cy="3.4" rx="1.05" ry="1.7" fill={pal.comb} />
      <circle cx="0.2" cy="1.9" r="1" fill="#ff9d9d" opacity="0.65" />
      <Eye mood={mood} />
      {open > 0.12 && <ellipse cx="4.6" cy="0.9" rx="1.8" ry={Math.max(0.1, open * 1.5)} fill="#c4504a" />}
      <path d="M3.2 -1.5 L7.4 0.2 L3.2 0.5 Z" fill={pal.beak} transform={`rotate(${-open * 14} 3.2 0.4)`} />
      <path d="M3.2 0.7 L6.4 1.5 L3.2 2.4 Z" fill={pal.beak} transform={`rotate(${open * 16} 3.2 0.9)`} />
    </>
  )
}

/** コケコッコー: くちばしの さきから ひろがる 音の すじ。 */
function CrowWaves({ t, tip, angle, strength }: SceneProps & { readonly tip: readonly [number, number]; readonly angle: number; readonly strength: number }) {
  if (strength <= 0.05) return null
  return (
    <>
      {[0, 1, 2].map((i) => {
        const p = (t * 1.8 + i / 3) % 1
        const r = 3 + p * 10
        const a0 = angle - 0.62
        const a1 = angle + 0.62
        const d = `M${tip[0] + Math.cos(a0) * r} ${tip[1] + Math.sin(a0) * r} A${r} ${r} 0 0 1 ${tip[0] + Math.cos(a1) * r} ${tip[1] + Math.sin(a1) * r}`
        return <path key={i} d={d} fill="none" stroke="#e0472b" strokeWidth="1.2" strokeLinecap="round" opacity={(1 - p) * strength} />
      })}
    </>
  )
}

/** 主役の にわとり。ねむる → びっくり → にっこり → コケコッコー。 */
function Rooster({ t, pal }: SceneProps & { readonly pal: Pal }) {
  const mood = moodAt(t)
  const lift = span(t, WAKE, WAKE + 0.6, backOut)
  const crow = span(t, CROW, CROW + 0.35, easeOut) * (1 - span(t, CROW_END, CROW_END + 0.4))
  const puff = span(t, CROW - 0.6, CROW, easeInOut) * (1 - span(t, CROW_END, CROW_END + 0.5))
  const jump = Math.sin(span(t, WAKE, WAKE + 0.4) * Math.PI) * 2.5
  const asleep = mood === 'asleep'
  // あたまの ばしょ: ねむる(体の上に のせる) → おきる(くびを のばす) → のけぞる
  const hx = lerp(lerp(4.5, 7, lift), 8, crow)
  const hy = lerp(lerp(-16.5, -21, lift), -24.2, crow) + (asleep ? wave(t, 1.8) * 0.3 : 0)
  const headRot = lerp(lerp(10, 0, lift), -24, crow)
  const open = crow * (0.35 + 0.65 * Math.abs(wave(t, 0.34)))
  const breath = asleep ? wave(t, 1.8) * 0.025 : 0
  const flap = crow * Math.abs(wave(t, 0.3)) * 30
  const rad = (headRot * Math.PI) / 180
  const tip = [hx + 7 * Math.cos(rad) - 0.8 * Math.sin(rad), hy + 7 * Math.sin(rad) + 0.8 * Math.cos(rad)] as const
  const zShow = during(t, 0.4, WAKE - 0.1, 0.4)
  const bang = during(t, WAKE, WAKE + 0.8, 0.12)
  return (
    <>
      <Layer x={ROOST[0]} y={ROOST[1]} scale={ROOSTER_SCALE}>
        {/* 足: さくの よこぎに のる 2本 */}
        <path d="M-2.4 -7 V0 M3 -7 V0 M-2.4 0 h-2.4 M-2.4 0 h2.6 M3 0 h-2.4 M3 0 h2.6" fill="none" stroke={pal.beak} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <Layer y={-0.8 * crow - jump} scale={1 + 0.07 * puff + breath} origin={[0, -11]}>
          {/* 尾(うしろへ はね上がる 長い 羽) */}
          <Layer rotate={6 * crow + wave(t, 2.2) * 1.2} origin={[-5, -11]}>
            <path d="M-5 -11 Q-14 -13 -13 -24 Q-8 -19 -4 -14 Z" fill={pal.tail} />
            <path d="M-5 -10 Q-15 -8 -15 -17 Q-10 -15 -4 -12 Z" fill={pal.tailLight} />
            <path d="M-5 -12 Q-11 -18 -9 -27 Q-6 -21 -3 -15 Z" fill={pal.tail} />
          </Layer>
          {/* 体 */}
          <ellipse cx="0" cy="-11" rx="8" ry="6.4" fill={pal.body} transform="rotate(8 0 -11)" />
          <ellipse cx="3.4" cy="-9" rx="4" ry="3.8" fill={pal.bodyLight} />
          {/* くび: 体の まえから あたまへ */}
          <path d={`M4.5 -13.5 L${hx} ${hy}`} fill="none" stroke={pal.neck} strokeWidth="5.4" strokeLinecap="round" />
          {/* はね: かたの ほうから 出て、うしろへ。コケコッコーで ばたばた */}
          <Layer rotate={flap} origin={[1, -14]}>
            <ellipse cx="-1.4" cy="-11" rx="5.4" ry="3.6" fill={pal.wing} transform="rotate(14 -1.4 -11)" />
          </Layer>
          <Layer x={hx} y={hy} rotate={headRot}>
            <Head mood={mood} open={open} pal={pal} />
          </Layer>
        </Layer>
        {/* ぐうぐう の z */}
        {zShow > 0 && (
          <g opacity={zShow} fill="#8fa3ea" fontWeight="700" fontFamily="inherit">
            {[0, 0.7].map((offset, i) => {
              const p = ((t + offset) % 1.4) / 1.4
              return (
                <text key={offset} x={hx + 5 + p * 5} y={hy - 4 - p * 9} fontSize={3.4 + i * 1.2 + p} opacity={Math.sin(p * Math.PI)}>
                  z
                </text>
              )
            })}
          </g>
        )}
        {/* びっくりの しるし */}
        {bang > 0 && (
          <g opacity={bang} stroke="#ff8a4a" strokeWidth="1.1" strokeLinecap="round">
            {[-70, -90, -110].map((deg) => {
              const a = (deg * Math.PI) / 180
              return <path key={deg} d={`M${hx + Math.cos(a) * 7.5} ${hy + Math.sin(a) * 7.5 - 2} L${hx + Math.cos(a) * 10.5} ${hy + Math.sin(a) * 10.5 - 2}`} />
            })}
          </g>
        )}
        <CrowWaves t={t} tip={tip} angle={rad} strength={crow} />
      </Layer>
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 12)
  // 夜あけ前は くらく、お日さまが のぼると 明るくなる
  const night = 1 - span(t, 1.6, 4.4)
  const pal = palette(night)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} night={night} />
        <Moon night={night} />
        <Wisps t={t} pal={pal} />
        <Sun t={t} />
        <Land pal={pal} />
        <Branch t={t} pal={pal} />
        <Fence pal={pal} />
        <Rooster t={t} pal={pal} />
        <Tufts t={t} pal={pal} />
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
    { at: 0, label: 'まだ くらい 夜あけ。月が のこり、にわとりは ぐっすり', sound: 'pop' },
    { at: SUNRISE, label: '草の あいだから お日さまが のぼる' },
    { at: WAKE, label: 'まぶしくて、にわとりが めをさます', sound: 'tap' },
    { at: CROW, label: 'コケコッコー! 月の まえを 雲が ながれる', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '朝 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
