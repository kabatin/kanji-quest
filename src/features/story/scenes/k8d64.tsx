/*
 * 赤(あか): さむい夕方、こどもが ふーっと ふくと 火が 大きく もえて、まっかに なる。
 *
 * ほね(画と絵の対応)  ※ 絵は ほんものの つくり を守る。字との ずれは「だいたい 同じ場所」でよい
 *   1画目(一)  … 麦わらぼうし の つば(はしが 少し 上がる)
 *   2画目(丨)  … ぼうし の てっぺん から、顔の まんなか
 *   3画目(一)  … 「わーい」と 大きく ひろげた りょううで(ひだり が 少し 下、みぎ が 少し 上)
 *   4画目      … まんなか左 の 火の した
 *   5画目      … まんなか右 の 火(さいごに はねる ところは 火の ねもと)
 *   6・7画目   … 左と右の ほそい 火の ほのお
 *   (字の「大」の ところは 人が うでを ひろげた かたち、「火」の ところは 火。そのまま 絵に なっている)
 *
 * ながれ
 *   さむい 夕方、ちいさな 火。こどもが ぶるぶる ふるえる(あつぎの うで、白い いき、ゆき)
 *   → 火に ふーっと いきを ふきかける。火が ぼうっと ふくらむ
 *   → ごうっと 大きく もえあがり、こどもは びっくり
 *   → あったかい。ほっぺが まっかに なって、「わーい」と うでを ひろげる(字の 3画目 の ところ)
 *   → ほね が ひかって、絵が うすくなり、字「赤」が のこる
 *
 * こども・火は、ほんものの つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。さむいときは むねの前で かかえ、よろこぶときは 左右に ひらく。
 *   くび は みじかく、あたま は どう の まんなか の上。火は 下が ふとく、先が とがる。
 *   こどもは 火の むこうがわ に 立つので、火が 大きくなると 体の したのほうが 火で かくれる。
 */
import { backOut, during, easeInOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '赤'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const HAT = '#3fb0a3'
const HAT_DARK = '#2f8f85'
const JACKET = '#4f9be0'
const JACKET_DARK = '#3c82c4'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const BARK_END = '#d9b48c'
const FLAME_RED = '#e8442f'
const FLAME_ORANGE = '#ff8a3d'
const FLAME_YELLOW = '#ffd24a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const TONGUE = '#ff8a8a'
const COLD_SKY = '#cdd9ee'
const WARM_SKY = '#ffe2bd'
const COLD_GROUND = '#b9c9ad'
const WARM_GROUND = '#c5e8a9'
const GLOW = '#ffb347'

/** くぎり の時間(秒) */
const KID_IN = 0.6
const COLD_AT = 1.0
/** 火に ふーっと いきを ふく */
const BLOW = 2.9
/** 火が ごうっと 大きくなる */
const SURGE = 4.3
/** びっくり → うれしい */
const WOW = 4.4
const JOY = 5.3
/** うでを ひらきはじめる・ひらききる */
const OPEN_FROM = 5.0
const OPEN_TO = 6.2
const INK = 6.6
const DONE = 9.7
const DURATION = 10.3

/** 火の ねもと の高さ(地面の すこし手前) */
const FIRE_BASE = 94
/** こどもの 足もと(火の むこうがわ なので、火の ねもと より 少し上) */
const KID_FEET = 92
/** かた の場所。うで は ここから出て、ひじ(16)・手先(16)の じゅんに つながる */
const SHOULDER_L: readonly [number, number] = [47, 48]
const SHOULDER_R: readonly [number, number] = [61, 48]
const ARM_PART = 16
/** 3画目の よこ線に 手先が とどく かくど(ま下から 外へ)。ひだり は 少し 下、みぎ は 少し 上 */
const T_UP_L = 88
const T_UP_R = 102

const toRad = (deg: number) => (deg * Math.PI) / 180
const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1)

function parseHex(color: string): readonly number[] {
  return [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16))
}

/** 2つの色(#rrggbb)を、k(0〜1)の割合で まぜる */
function blend(a: string, b: string, k: number): string {
  const from = parseHex(a)
  const to = parseHex(b)
  return `rgb(${from.map((v, i) => Math.round(v + (to[i] - v) * clamp01(k))).join(',')})`
}

/* ───────── 地面・空 ───────── */

/** 青 から だいだい へ 直ぐ まぜると 灰色に くすむので、ゆうやけ の うすむらさき を はさむ */
const DUSK_SKY = '#ecd6e2'
const skyColor = (warm: number) => (warm < 0.5 ? blend(COLD_SKY, DUSK_SKY, warm * 2) : blend(DUSK_SKY, WARM_SKY, (warm - 0.5) * 2))

function Backdrop({ warm }: { readonly warm: number }) {
  return (
    <>
      <rect x="0" y="0" width="109" height="109" fill={skyColor(warm)} />
      {/* 火の あかり: 大きくなるほど まわりが あたたかく ひかる */}
      <circle cx="54" cy="72" r="58" fill={GLOW} opacity={warm ** 3 * 0.16} />
      <circle cx="54" cy="76" r="38" fill={GLOW} opacity={warm ** 3 * 0.2} />
      <path d="M-4 99 Q18 78 44 90 Q72 72 113 93 V101 H-4 Z" fill={blend('#dfe8dc', '#e2f2d2', warm)} />
      <ellipse cx="54.5" cy="98" rx="51" ry="6" fill={blend(COLD_GROUND, WARM_GROUND, warm)} />
    </>
  )
}

/** さむい間 だけ ふる ゆき。ゆっくり ゆれながら おちる。 */
function Snow({ t }: SceneProps) {
  const show = during(t, 0.2, SURGE + 0.3, 0.5)
  if (show <= 0) return null
  const xs = [10, 26, 41, 57, 73, 88, 100] as const
  return (
    <g opacity={show} fill="#ffffff" stroke="#aebfda" strokeWidth="0.4">
      {xs.map((x, i) => {
        const p = (t * 0.13 + i * 0.17) % 1
        return <circle key={x} cx={x + Math.sin(p * 8 + i) * 3} cy={p * 100} r={i % 2 === 0 ? 1.2 : 0.9} />
      })}
    </g>
  )
}

/* ───────── 火 ───────── */

/** ほのおの ひとつぶ。from は 火が これくらい 大きくなったら 出てくる、という目安 */
type Tongue = { readonly x: number; readonly w: number; readonly h: number; readonly lean: number; readonly from: number }

/** うしろから まえへ。まんなか が いちばん さいしょに もえ、そとがわが あとから ひろがる */
const TONGUES: readonly Tongue[] = [
  { x: 53, w: 13, h: 37, lean: 1, from: 0 },
  { x: 41, w: 11, h: 40, lean: 4, from: 0.28 },
  { x: 64, w: 10, h: 42, lean: -3, from: 0.28 },
  { x: 24, w: 9, h: 31, lean: 5, from: 0.5 },
  { x: 84, w: 9, h: 31, lean: -5, from: 0.5 },
]

/** 下が ふとく、先が とがった しずく形 */
function tonguePath({ x, w, h, lean }: Tongue): string {
  const top = FIRE_BASE - h
  return `M${x - w} ${FIRE_BASE} C${x - w} ${FIRE_BASE - h * 0.45} ${x + lean * 0.3 - w * 0.3} ${FIRE_BASE - h * 0.72} ${x + lean} ${top} C${x + lean * 0.7 + w * 0.5} ${FIRE_BASE - h * 0.7} ${x + w} ${FIRE_BASE - h * 0.42} ${x + w} ${FIRE_BASE} Z`
}

function TongueShape({ tongue, fill }: { readonly tongue: Tongue; readonly fill: string }) {
  return (
    <g fill={fill}>
      <path d={tonguePath(tongue)} />
      <ellipse cx={tongue.x} cy={FIRE_BASE} rx={tongue.w} ry={tongue.w * 0.45} />
    </g>
  )
}

/** 火。size 0 = ちいさな ひ、1 = 大きく もえている。赤 → だいだい → 黄 の 3だん */
function Flame({ t, size }: { readonly t: number; readonly size: number }) {
  return (
    <>
      {TONGUES.map((tongue, i) => {
        const s = Math.max(0, (size - tongue.from) / (1 - tongue.from))
        if (s <= 0) return null
        const flicker = 1 + 0.05 * wave(t, 0.45 + i * 0.11, i * 0.3)
        const sway = wave(t, 0.6 + i * 0.13, i * 0.4) * 1.1 * Math.min(s, 1)
        return (
          <Layer key={i} x={sway} scaleX={0.55 + 0.45 * Math.min(s, 1.05)} scaleY={s * flicker} origin={[tongue.x, FIRE_BASE]}>
            <TongueShape tongue={tongue} fill={FLAME_RED} />
            <Layer scaleX={0.62} scaleY={0.7} origin={[tongue.x, FIRE_BASE]}>
              <TongueShape tongue={tongue} fill={FLAME_ORANGE} />
              {tongue.from < 0.3 && (
                <Layer scaleX={0.55} scaleY={0.6} origin={[tongue.x, FIRE_BASE]}>
                  <TongueShape tongue={tongue} fill={FLAME_YELLOW} />
                </Layer>
              )}
            </Layer>
          </Layer>
        )
      })}
    </>
  )
}

/** たきぎ。うしろで 組んだ 2本 と、火の ねもと を かくす 手前の 1本 */
function BackLogs() {
  return (
    <>
      <g transform="rotate(8 35 91.5)">
        <rect x="17" y="88" width="36" height="7" rx="3.5" fill={BARK} />
        <ellipse cx="18.6" cy="91.5" rx="1.8" ry="3" fill={BARK_END} />
      </g>
      <g transform="rotate(-8 74 91.5)">
        <rect x="56" y="88" width="36" height="7" rx="3.5" fill={BARK_DARK} />
        <ellipse cx="90.4" cy="91.5" rx="1.8" ry="3" fill={BARK_END} />
      </g>
    </>
  )
}

function FrontLog() {
  return (
    <>
      <rect x="33" y="92.4" width="42" height="6.4" rx="3.2" fill={BARK} />
      <rect x="35" y="93.2" width="38" height="1.5" rx="0.75" fill="#a87650" />
      <ellipse cx="34.6" cy="95.6" rx="1.7" ry="2.8" fill={BARK_END} />
    </>
  )
}

/** ごうっと もえたあと、ひのこ が 上へ とぶ。こどもの 顔に かからない 左右 */
function Embers({ t }: SceneProps) {
  const show = during(t, SURGE, DONE - 0.9, 0.3)
  if (show <= 0) return null
  const xs = [20, 30, 36, 72, 79, 88] as const
  return (
    <g opacity={show} fill={FLAME_YELLOW}>
      {xs.map((x, i) => {
        const p = ((t - SURGE + i * 0.37) % 2.2) / 2.2
        return <circle key={x} cx={x + Math.sin(p * 6 + i) * 3} cy={64 - p * 40} r={i % 2 === 0 ? 1.1 : 0.8} opacity={Math.sin(p * Math.PI)} />
      })}
    </g>
  )
}

/* ───────── こども ───────── */

type Mood = 'cold' | 'blow' | 'wow' | 'joy'

type ArmAngles = { readonly up: number; readonly fore: number }

/** かた → ひじ → 手 の じゅんに つながる うで。side は ひだり = -1 / みぎ = 1。かくどは ま下から 外へ */
function Arm({ shoulder, side, angles }: { readonly shoulder: readonly [number, number]; readonly side: -1 | 1; readonly angles: ArmAngles }) {
  const elbow = [shoulder[0] + side * Math.sin(toRad(angles.up)) * ARM_PART, shoulder[1] + Math.cos(toRad(angles.up)) * ARM_PART] as const
  const hand = [elbow[0] + side * Math.sin(toRad(angles.fore)) * ARM_PART, elbow[1] + Math.cos(toRad(angles.fore)) * ARM_PART] as const
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={JACKET_DARK} strokeWidth="6.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.4" fill={SKIN} />
    </>
  )
}

type FaceProps = { readonly mood: Mood; readonly cold: number; readonly warm: number; readonly puff: number }

function Face({ mood, cold, warm, puff }: FaceProps) {
  const cheek = mood === 'joy' ? 0.85 : warm * 0.7
  return (
    <>
      <circle cx="54" cy="36" r="8.5" fill={SKIN} />
      {/* さむいと 顔が 青ざめる。あたたまると ほんのり あかく */}
      <circle cx="54" cy="36" r="8.5" fill="#9fb6e8" opacity={cold * 0.38} />
      <circle cx="54" cy="36" r="8.5" fill="#ff8a5c" opacity={warm * 0.2} />
      <ellipse cx="47.9" cy="39.6" rx="2.1" ry="1.4" fill="#ff7d7d" opacity={cheek} />
      <ellipse cx="60.1" cy="39.6" rx="2.1" ry="1.4" fill="#ff7d7d" opacity={cheek} />
      {mood === 'cold' && (
        <>
          <path d="M48.8 33.8 l3.4 -1.1 M59.2 33.8 l-3.4 -1.1" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <path d="M49 36.6 q1.6 1.4 3.2 0 M55.8 36.6 q1.6 1.4 3.2 0" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M51.6 41.2 q1.2 -1.4 2.4 0 t2.4 0" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'blow' && (
        <>
          {/* ほっぺを ふくらませて、ちいさく すぼめた 口 で ふーっ */}
          <circle cx={48.4 - puff * 0.5} cy="40" r={2.6 + puff * 0.7} fill="#ffc9b0" />
          <circle cx={59.6 + puff * 0.5} cy="40" r={2.6 + puff * 0.7} fill="#ffc9b0" />
          <path d="M49 36.6 q1.6 1.4 3.2 0 M55.8 36.6 q1.6 1.4 3.2 0" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <ellipse cx="54" cy="41" rx="1.3" ry="1.5" fill={MOUTH} />
        </>
      )}
      {mood === 'wow' && (
        <>
          <path d="M48.8 32.6 q1.8 -1.3 3.6 0 M55.6 32.6 q1.8 -1.3 3.6 0" fill="none" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <circle cx="50.6" cy="36.2" r="1.8" fill={EYE} />
          <circle cx="57.4" cy="36.2" r="1.8" fill={EYE} />
          <circle cx="51.1" cy="35.6" r="0.55" fill="#ffffff" />
          <circle cx="57.9" cy="35.6" r="0.55" fill="#ffffff" />
          <ellipse cx="54" cy="41.2" rx="1.9" ry="2.4" fill={MOUTH} />
        </>
      )}
      {mood === 'joy' && (
        <>
          <path d="M49 36.8 q1.6 -2.3 3.2 0 M55.8 36.8 q1.6 -2.3 3.2 0" fill="none" stroke={EYE} strokeWidth="1.25" strokeLinecap="round" />
          <path d="M50.6 39.4 Q54 46 57.4 39.4 Z" fill={MOUTH} />
          <ellipse cx="54" cy="42.4" rx="1.5" ry="0.9" fill={TONGUE} />
        </>
      )}
    </>
  )
}

/** 麦わらぼうし。つばの 右はしが 少し 上がる(1画目) */
function Hat() {
  return (
    <g transform="rotate(-5 54 28)">
      <ellipse cx="54" cy="29" rx="24" ry="3.2" fill={HAT_DARK} />
      <path d="M41 28.4 Q41 13 54 13 Q67 13 67 28.4 Z" fill={HAT} />
      <path d="M41.6 25.2 h24.8 v2.6 h-24.8 Z" fill={HAT_DARK} />
      <ellipse cx="54" cy="28" rx="24" ry="3" fill={HAT} />
    </g>
  )
}

type KidProps = {
  readonly mood: Mood
  readonly cold: number
  readonly warm: number
  readonly puff: number
  readonly armL: ArmAngles
  readonly armR: ArmAngles
  readonly headY: number
}

function Kid({ mood, cold, warm, puff, armL, armR, headY }: KidProps) {
  return (
    <>
      {/* あし */}
      <rect x="46.6" y="68" width="7" height="22" rx="3.5" fill={PANTS} />
      <rect x="55.4" y="68" width="7" height="22" rx="3.5" fill={PANTS} />
      <ellipse cx="49.4" cy={KID_FEET - 0.4} rx="5" ry="2.6" fill={SHOE} />
      <ellipse cx="58.6" cy={KID_FEET - 0.4} rx="5" ry="2.6" fill={SHOE} />
      {/* どう */}
      <rect x="44.5" y="45.5" width="19" height="27" rx="7" fill={JACKET} />
      <path d="M54 50 v21" stroke={JACKET_DARK} strokeWidth="1.2" strokeLinecap="round" />
      <Arm shoulder={SHOULDER_L} side={-1} angles={armL} />
      <Arm shoulder={SHOULDER_R} side={1} angles={armR} />
      {/* あたま: くび は みじかく、どう の まんなか の上 */}
      <Layer y={headY} origin={[54, 44]}>
        <circle cx="45.8" cy="37" r="1.9" fill={SKIN_SHADE} />
        <circle cx="62.2" cy="37" r="1.9" fill={SKIN_SHADE} />
        <ellipse cx="46.6" cy="32.8" rx="2" ry="3.2" fill={HAIR} />
        <ellipse cx="61.4" cy="32.8" rx="2" ry="3.2" fill={HAIR} />
        <Face mood={mood} cold={cold} warm={warm} puff={puff} />
        <Hat />
      </Layer>
    </>
  )
}

/** さむい間の 白い いき。口から 右上へ ふわっと のぼる */
function Breath({ t }: SceneProps) {
  const show = during(t, COLD_AT + 0.1, BLOW - 0.1, 0.25)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.5].map((offset) => {
        const p = (t * 0.8 + offset) % 1
        return <ellipse key={offset} cx={58.5 + p * 10} cy={42 - p * 10} rx={1.5 + p * 2.8} ry={1.1 + p * 1.8} fill="#ffffff" stroke="#b8c6dc" strokeWidth="0.5" opacity={1 - p} />
      })}
    </g>
  )
}

/** ふーっ。口から 火のほうへ、白い すじが 下へ ふきつける */
function BlowLines({ t }: SceneProps) {
  const show = during(t, BLOW + 0.1, WOW, 0.15)
  if (show <= 0) return null
  return (
    <g opacity={show * 0.9} stroke="#ffffff" strokeWidth="1" strokeLinecap="round" fill="none">
      {[-3, 0, 3].map((dx, i) => {
        const y = 46 + ((t * 4 + i * 0.33) % 1) * 7
        return <path key={dx} d={`M${54 + dx * 0.8} ${y} q${dx * 0.3} 2 ${dx * 0.5} 4`} />
      })}
    </g>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)

  // 火の 大きさ: ちいさな ひ → ふーっで ふくらむ → ごうっと 大きく(少し 行きすぎる)
  const appear = span(t, 0.3, 0.9, backOut)
  const firstBlow = span(t, BLOW + 0.1, SURGE, easeInOut)
  const surge = span(t, SURGE, SURGE + 0.8, backOut)
  const size = 0.2 * appear + 0.22 * firstBlow + 0.58 * surge
  const warm = clamp01((size - 0.2) / 0.8)
  const cold = span(t, 0.7, 1.3) * (1 - span(t, BLOW + 0.3, SURGE + 0.3))

  const mood: Mood = t < BLOW ? 'cold' : t < WOW ? 'blow' : t < JOY ? 'wow' : 'joy'
  const puff = wave(t, 0.35) * 0.5 + 0.5

  // うで: さむい間は むねの前で かかえ、うれしくなると 上へ ひらいて 3画目の かたち(りょううで を よこに)になる
  const armL: ArmAngles = { up: mix(t, OPEN_FROM, OPEN_TO, 22, T_UP_L), fore: mix(t, OPEN_FROM, OPEN_TO, -120, T_UP_L - 360) }
  const armR: ArmAngles = { up: mix(t, OPEN_FROM, OPEN_TO, 22, T_UP_R), fore: mix(t, OPEN_FROM, OPEN_TO, -120, T_UP_R - 360) }

  // ぶるぶる ふるえる(さむい間だけ)/ びっくりして ぴょん と はねる / うれしくて 小さく はずむ
  const shiver = during(t, COLD_AT, BLOW - 0.2, 0.3) * wave(t, 0.11) * 0.55
  const startle = Math.sin(span(t, SURGE + 0.25, SURGE + 0.85) * Math.PI) * 2.4
  const cheer = during(t, JOY + 0.2, INK - 0.35, 0.2) * Math.abs(wave(t, 0.55)) * 0.9
  // ふーっ の間は 少し 下をむく
  const lookDown = during(t, BLOW, WOW, 0.2) * 1.2

  const kidIn = span(t, KID_IN, KID_IN + 0.5, backOut)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop warm={warm} />
        <Snow t={t} />
        <Layer opacity={span(t, 0.1, 0.4)}>
          <BackLogs />
        </Layer>
        <Layer opacity={span(t, KID_IN, KID_IN + 0.25)} x={shiver} y={-startle - cheer} scale={0.7 + 0.3 * kidIn} origin={[54, KID_FEET]}>
          <Kid mood={mood} cold={cold} warm={warm} puff={puff} armL={armL} armR={armR} headY={lookDown} />
          <Breath t={t} />
          <BlowLines t={t} />
        </Layer>
        <Flame t={t} size={size} />
        <Layer opacity={span(t, 0.1, 0.4)}>
          <FrontLog />
        </Layer>
        <Embers t={t} />
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
    { at: 0, label: 'さむい 夕方。ちいさな 火', sound: 'pop' },
    { at: KID_IN, label: 'こどもが あらわれて、ぶるぶる ふるえる' },
    { at: BLOW, label: '火に ふーっと いきを ふく' },
    { at: SURGE, label: '火が ごうっと 大きく もえる', sound: 'pop' },
    { at: JOY, label: 'あったかい! ほっぺも 火も まっかで、うでを ひろげて わーい' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '赤 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
