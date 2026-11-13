/*
 * 雲(くも): もくもく のぼって 雨を ふらせる 雲。
 *
 * ほね(画と絵の対応)
 *   1画目(一)    … 雨雲の てっぺん(もくもくの 上のふち)
 *   2画目(丨)    … 雲の 左はし から ふる 雨の すじ
 *   3画目(𠃍)    … 雲の たいらな そこ
 *   4画目(丨)    … 雲の まんなか から ふる 雨の すじ(池の上に おちる)
 *   5・6画目     … 女の子の あたまの上に おちる しずく
 *   7・8画目     … お花の上に おちる しずく
 *   9〜12画目(云) … 池から もくもく のぼっていく 水の けむり(云 は「くもが わきあがる」形)
 *
 * ながれ
 *   あつい日。女の子は あせを かいて ぐったり。お花も しおれている
 *   → 池から 水の けむりが もくもく のぼる。女の子は ふしぎそうに 見あげる
 *   → けむりが 空で あつまって 1つの 大きな 雨雲になり、お日さまが かくれる
 *   → 雲の そこ から しずくが ぽつん。女の子の あたまに あたる
 *   → ぽつぽつ 雨。女の子は 大よろこび、お花も 元気に 立ちあがる
 *   → しずく が 点の場所に そろった しゅんかん、ほね が ひかって、絵が うすくなり、字「雲」が のこる
 *
 * ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   雲の そこ は たいら。雨は まっすぐ 下に おちる。水の けむり は 池から 上へ のぼって 雲になる。
 *   女の子は 正面むき。うで は かた から出て ひじ で まがる。くび は みじかく どう の まんなか の上。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '雲'

const SUN = '#ffd24a'
const SKY_DIM = '#5b6d8a'
const HILL_DRY = '#efe6c8'
const HILL = '#e2f2d2'
const GROUND_DRY = '#e9d9ae'
const CRACK = '#c9b283'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const STEM = '#4c8f52'
const STEM_WILT = '#9aa86b'
const LEAF_WILT = '#a9b27a'
const PETAL = '#ff8fb0'
const PETAL_WILT = '#c9ab7a'
const CENTER = '#ffd24a'
const CENTER_WILT = '#b9955a'
const POND = '#7cc4f2'
const POND_LIGHT = '#bfe3fa'
const DROP = '#7cc4f2'
const DROP_LIGHT = '#e8f6ff'
const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const DRESS = '#4f9be0'
const DRESS_DARK = '#3c82c4'
const SHOE = '#6b4a36'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const RIBBON = '#e8534a'

/** くぎり の時間(秒) */
/** 池から 水の けむり が のぼりはじめる(女の子は 見あげる) */
const STEAM = 1.5
/** けむり が 空に あつまって、雲に なる */
const GATHER = 3.5
/** 雲の そこ で しずく が ふくらみ はじめる */
const DRIP = 4.5
/** 雨が ふりだす */
const RAIN_AT = 5.3
/** 女の子が よろこぶ */
const HAPPY = 5.5
const INK = 7.2
const DONE = 10.3
const DURATION = 10.9

const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/* ───────── 地面・池・お花 ───────── */

const POND_X = 55
const POND_Y = 97.2
/** 女の子と お花の よこの位置 */
const GIRL_X = 36
const FLOWER_X = 74

/** 雨が ふって 土が うるおい、草が はえる(0〜1) */
function Ground({ revive }: { readonly revive: number }) {
  return (
    <>
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill={HILL_DRY} />
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill={HILL} opacity={revive} />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GROUND_DRY} />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} opacity={revive} />
      {/* かわいて ひびわれた 土 */}
      <path d="M12 96 l3 1.2 l-1 1.6 M26 98.4 l2.5 -1 l2 1.2 M86 97 l3 1 l-0.8 1.8 M96 95.8 l2.5 1.4 M66 98.6 l2.4 -1.2" fill="none" stroke={CRACK} strokeWidth="0.8" strokeLinecap="round" opacity={1 - revive} />
      {[6, 18, 47, 62, 88, 101].map((x) => (
        <Layer key={x} scale={revive} origin={[x, 97.5]}>
          <path d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
        </Layer>
      ))}
    </>
  )
}

function Pond() {
  return (
    <>
      <ellipse cx={POND_X} cy={POND_Y} rx="12" ry="3" fill={POND} />
      <ellipse cx={POND_X - 3} cy={POND_Y - 0.6} rx="4.6" ry="0.9" fill={POND_LIGHT} />
    </>
  )
}

/** お花。droop 1 = しおれて うなだれる / 0 = 元気に 立つ */
function Flower({ droop, revive }: { readonly droop: number; readonly revive: number }) {
  const topX = FLOWER_X + droop * 10
  const topY = 76 + droop * 9
  const leaves = [
    { cx: FLOWER_X - 4.2, cy: 90.5, turn: -25 + droop * 40 },
    { cx: FLOWER_X + 4.2, cy: 88.5, turn: 25 + droop * 30 },
  ]
  return (
    <>
      {[
        { stem: STEM_WILT, leaf: LEAF_WILT, petal: PETAL_WILT, center: CENTER_WILT, op: 1 },
        { stem: STEM, leaf: LEAF_DARK, petal: PETAL, center: CENTER, op: revive },
      ].map((tone) => (
        <g key={tone.stem} opacity={tone.op}>
          <path d={`M${FLOWER_X} 96.5 Q${FLOWER_X} 84 ${topX} ${topY}`} fill="none" stroke={tone.stem} strokeWidth="1.8" strokeLinecap="round" />
          {leaves.map((leaf) => (
            <ellipse key={leaf.cx} cx={leaf.cx} cy={leaf.cy} rx="4" ry="1.8" fill={tone.leaf} transform={`rotate(${leaf.turn} ${leaf.cx} ${leaf.cy})`} />
          ))}
          {Array.from({ length: 6 }, (_, i) => (
            <circle key={i} cx={topX + Math.cos((i / 6) * Math.PI * 2) * 3.6} cy={topY + Math.sin((i / 6) * Math.PI * 2) * 3.6} r="2.7" fill={tone.petal} />
          ))}
          <circle cx={topX} cy={topY} r="2.4" fill={tone.center} />
        </g>
      ))}
    </>
  )
}

/** 池から ゆらゆら たちのぼる 水の けむり(さいしょの ぶん) */
function Wisps({ t }: SceneProps) {
  const show = during(t, STEAM - 0.4, GATHER, 0.4)
  if (show <= 0) return null
  return (
    <g opacity={show * 0.8} fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round">
      {[-6, 0, 6].map((dx, i) => {
        const p = ((t - STEAM + i * 0.5) % 1.5) / 1.5
        return <path key={dx} d={`M${POND_X + dx} 94 q-2 -3 0 -6 t0 -6`} transform={`translate(0 ${-p * 8})`} opacity={Math.sin(Math.max(p, 0) * Math.PI)} stroke="#cfe0ef" />
      })}
    </g>
  )
}

/* ───────── 雲 ───────── */

type Puff = readonly [cx: number, cy: number, r: number]
/** 雲の もくもく(そこ が y=30.5 の たいらに なる大きさ) */
const BASE_Y = 30.5
const PUFFS: readonly Puff[] = [
  [26, 24, 6.5],
  [38, 22.5, 8],
  [52, 22, 8.5],
  [66, 22, 8.5],
  [79, 23.5, 7],
  [89, 25, 5.5],
]
/** けむり が 池の どこから のぼるか(x の ずれ) */
const START_DX: readonly number[] = [-7, -3, 0, 3, 7, -1]
const SLAB = { x: 20, y: 24, w: 74 } as const
/** 雲の そこ の ほんの 少しの かたむき(3画目の線に あわせる) */
const TILT = -2.5
const SHADE_BAND = 2.2

/** けむり が 池から のぼって、雲の もくもく に なる とちゅうの すがた */
function puffAt(t: number, i: number) {
  const [tx, ty, tr] = PUFFS[i]
  const begin = STEAM + i * 0.28
  const end = GATHER + i * 0.1
  const p = span(t, begin, end, easeInOut)
  return {
    // さきに 上へ のぼり、高い所で よこへ ながれる(女の子の かおの前を とおらない)
    x: lerp(POND_X + START_DX[i], tx, span(p, 0.45, 1, easeInOut)) + Math.sin(p * Math.PI * 2.5 + i * 1.3) * 3.2 * (1 - p),
    y: lerp(91, ty, p),
    r: Math.max(0, lerp(1.6, tr, easeOut(p))),
    show: span(t, begin, begin + 0.25),
  }
}

type Tone = { readonly body: string; readonly shade: string; readonly light: string }
const WHITE_TONE: Tone = { body: '#f8fbfe', shade: '#d3dfec', light: '#ffffff' }
const RAIN_TONE: Tone = { body: '#a3b0c2', shade: '#8494aa', light: '#c3cddb' }

function CloudShapes({ t, slab }: { readonly t: number; readonly slab: number }) {
  return (
    <>
      {PUFFS.map((_, i) => {
        const puff = puffAt(t, i)
        if (puff.show <= 0 || puff.r <= 0) return null
        return <circle key={i} cx={puff.x} cy={puff.y} r={puff.r} opacity={puff.show} />
      })}
      {slab > 0 && (
        <Layer scaleY={slab} origin={[SLAB.x + SLAB.w / 2, BASE_Y]}>
          <rect x={SLAB.x} y={SLAB.y} width={SLAB.w} height={BASE_Y - SLAB.y} rx="2.5" />
        </Layer>
      )}
    </>
  )
}

/** 色を ぬる じゅんは、かげ → ハイライト → 色の面。色の面を 上に ずらして、そこ に かげの おびを のこす */
function CloudTone({ t, slab, tone }: { readonly t: number; readonly slab: number; readonly tone: Tone }) {
  return (
    <>
      <g fill={tone.shade}>
        <CloudShapes t={t} slab={slab} />
      </g>
      <g fill={tone.light} transform={`translate(-0.9 ${-SHADE_BAND - 1.3})`}>
        <CloudShapes t={t} slab={slab} />
      </g>
      <g fill={tone.body} transform={`translate(0 ${-SHADE_BAND})`}>
        <CloudShapes t={t} slab={slab} />
      </g>
    </>
  )
}

function Cloud({ t, dark }: SceneProps & { readonly dark: number }) {
  const slab = span(t, GATHER + 0.4, GATHER + 1.0, backOut)
  const settle = span(t, GATHER + 0.4, GATHER + 1.0)
  return (
    <Layer rotate={TILT * settle} origin={[55, BASE_Y]}>
      <CloudTone t={t} slab={slab} tone={WHITE_TONE} />
      <Layer opacity={dark}>
        <CloudTone t={t} slab={slab} tone={RAIN_TONE} />
      </Layer>
    </Layer>
  )
}

function Sun({ t }: SceneProps) {
  const show = 1 - span(t, GATHER, GATHER + 1.1)
  return (
    <Layer opacity={show} rotate={t * 14} origin={[14, 14]}>
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x="13.2" y="2" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 14 14)`} />
      ))}
      <circle cx="14" cy="14" r="6.2" fill={SUN} />
    </Layer>
  )
}

/* ───────── 雨 ───────── */

/** しずく(まんなか が 0,0。とがった先が 上) */
const DROP_PATH = 'M0 -6.2 C1.2 -3.8 3.7 -1.6 3.7 1.1 A3.7 3.7 0 0 1 -3.7 1.1 C-3.7 -1.6 -1.2 -3.8 0 -6.2 Z'
const DROP_SCALE = 0.75
/** しずく の おちる はやさ(1秒に すすむ きょり) */
const FALL_SPEED = 55
/** 雲の そこ から、ぶらさがった しずく の まんなか まで */
const HANG = 3.4
/** x の所の 雲の そこ の 高さ(かたむきぶん) */
const hangY = (x: number) => BASE_Y + (x - 55) * Math.tan((TILT * Math.PI) / 180) + HANG

type Column = { readonly x: number; readonly land: number; readonly start: number }
/** 雨の すじ。2・4画目(左・まんなか)、5・6画目(女の子の あたま)、7・8画目(お花)、右はし */
const COLUMNS: readonly Column[] = [
  { x: 23, land: 96, start: RAIN_AT },
  { x: GIRL_X + 2, land: 49, start: DRIP + 0.4 },
  { x: 54, land: 96, start: RAIN_AT + 0.15 },
  { x: 70, land: 76, start: RAIN_AT + 0.3 },
  { x: 85, land: 96, start: RAIN_AT + 0.45 },
]

function RainColumn({ t, column }: { readonly t: number; readonly column: Column }) {
  const { x, land, start } = column
  const top = hangY(x)
  const fall = (land - top) / FALL_SPEED
  const period = fall + 0.35
  return (
    <>
      {[0, 1, 2].map((k) => {
        const u = t - start - (k * period) / 3
        if (u < 0) return null
        const c = u % period
        if (c < fall) {
          const grow = Math.min(1, c / 0.12)
          return (
            <g key={k} transform={`translate(${x} ${top + c * FALL_SPEED}) scale(${DROP_SCALE * grow})`}>
              <path d={DROP_PATH} fill={DROP} />
              <circle cx="-1.2" cy="1" r="0.9" fill={DROP_LIGHT} />
            </g>
          )
        }
        const s = (c - fall) / 0.3
        if (s >= 1) return null
        return <ellipse key={k} cx={x} cy={land} rx={1 + 3.4 * s} ry={0.4 + 1.2 * s} fill="none" stroke={DROP} strokeWidth="0.7" opacity={1 - s} />
      })}
      {/* さいしょの しずく: 雲の そこ で ふくらむ */}
      {x === COLUMNS[1].x && t < start && (
        <g transform={`translate(${x} ${top}) scale(${DROP_SCALE * span(t, DRIP, start, backOut)})`}>
          <path d={DROP_PATH} fill={DROP} />
        </g>
      )}
    </>
  )
}

/* ───────── 女の子(主役) ───────── */

type Mood = 'hot' | 'wonder' | 'happy'

const SHOULDER_Y = 71.6
const SHOULDER_DX = 5.2
const ARM_PART = 6.4
const NECK_Y = 69

/**
 * うで。かた から出て、ひじ で まがる。角度は ま下 = 0、よこ = 90、ま上 = 180(体の そとがわへ ひらく)。
 * side: 1 = 見ている人から 右、-1 = 左。
 */
function Arm({ side, upper, fore }: { readonly side: 1 | -1; readonly upper: number; readonly fore: number }) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const sx = GIRL_X + side * SHOULDER_DX
  const ex = sx + side * Math.sin(rad(upper)) * ARM_PART
  const ey = SHOULDER_Y + Math.cos(rad(upper)) * ARM_PART
  const hx = ex + side * Math.sin(rad(fore)) * ARM_PART
  const hy = ey + Math.cos(rad(fore)) * ARM_PART
  return (
    <>
      <path d={`M${sx} ${SHOULDER_Y} L${ex} ${ey}`} fill="none" stroke={DRESS_DARK} strokeWidth="4.2" strokeLinecap="round" />
      <path d={`M${ex} ${ey} L${hx} ${hy}`} fill="none" stroke={SKIN} strokeWidth="3.2" strokeLinecap="round" />
      <circle cx={hx} cy={hy} r="2.1" fill={SKIN} />
    </>
  )
}

function Face({ mood, look }: { readonly mood: Mood; readonly look: number }) {
  const eyes = [GIRL_X - 2.9, GIRL_X + 2.9]
  return (
    <>
      <circle cx={GIRL_X - 4.5} cy="65.4" r="1.4" fill="#ff9d9d" opacity={mood === 'hot' ? 0.8 : 0.55} />
      <circle cx={GIRL_X + 4.5} cy="65.4" r="1.4" fill="#ff9d9d" opacity={mood === 'hot' ? 0.8 : 0.55} />
      {mood === 'hot' && (
        <>
          {eyes.map((x) => (
            <path key={x} d={`M${x - 1.3} 62.2 Q${x} 63.6 ${x + 1.3} 62.2`} fill="none" stroke={EYE} strokeWidth="0.9" strokeLinecap="round" />
          ))}
          <path d={`M${GIRL_X - 4.2} 60.8 l2.6 -0.8 M${GIRL_X + 4.2} 60.8 l-2.6 -0.8`} stroke={HAIR} strokeWidth="0.8" strokeLinecap="round" />
          <path d={`M${GIRL_X - 1.8} 66.4 q0.9 -0.9 1.8 0 t1.8 0`} fill="none" stroke={MOUTH} strokeWidth="0.9" strokeLinecap="round" />
        </>
      )}
      {mood === 'wonder' && (
        <>
          {eyes.map((x) => (
            <g key={x}>
              <circle cx={x} cy={62.6 - look} r="1.35" fill={EYE} />
              <circle cx={x + 0.4} cy={62.2 - look} r="0.45" fill="#ffffff" />
            </g>
          ))}
          <ellipse cx={GIRL_X} cy="66.4" rx="0.9" ry="1.2" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          {eyes.map((x) => (
            <path key={x} d={`M${x - 1.4} 63 Q${x} 61.2 ${x + 1.4} 63`} fill="none" stroke={EYE} strokeWidth="1" strokeLinecap="round" />
          ))}
          <path d={`M${GIRL_X - 2.3} 65.3 Q${GIRL_X} 69.4 ${GIRL_X + 2.3} 65.3 Z`} fill={MOUTH} />
        </>
      )}
    </>
  )
}

type GirlProps = {
  readonly mood: Mood
  readonly look: number
  /** うで の角度。右うで(見る人から 右)・左うで */
  readonly right: { readonly upper: number; readonly fore: number }
  readonly left: { readonly upper: number; readonly fore: number }
  readonly headDip: number
}

function Girl({ mood, look, right, left, headDip }: GirlProps) {
  return (
    <>
      {/* あし */}
      <rect x={GIRL_X - 4.6} y="84.5" width="3.4" height="10" rx="1.7" fill={SKIN} />
      <rect x={GIRL_X + 1.2} y="84.5" width="3.4" height="10" rx="1.7" fill={SKIN} />
      <ellipse cx={GIRL_X - 2.9} cy="95.3" rx="3.4" ry="1.9" fill={SHOE} />
      <ellipse cx={GIRL_X + 2.9} cy="95.3" rx="3.4" ry="1.9" fill={SHOE} />
      {/* くび: みじかく、どう の まんなか の上 */}
      <rect x={GIRL_X - 1.7} y="66.4" width="3.4" height="5" rx="1.4" fill={SKIN_SHADE} />
      {/* どう(ワンピース) */}
      <path d={`M${GIRL_X - 5.4} 70.6 Q${GIRL_X} 69 ${GIRL_X + 5.4} 70.6 L${GIRL_X + 8.4} 85.6 Q${GIRL_X} 87.6 ${GIRL_X - 8.4} 85.6 Z`} fill={DRESS} />
      <path d={`M${GIRL_X - 6.6} 78 h13.2`} stroke={DRESS_DARK} strokeWidth="1.5" strokeLinecap="round" />
      <Arm side={-1} upper={left.upper} fore={left.fore} />
      <Arm side={1} upper={right.upper} fore={right.fore} />
      {/* あたま */}
      <Layer y={headDip} rotate={0} origin={[GIRL_X, NECK_Y]}>
        <circle cx={GIRL_X - 8.4} cy="63" r="2.8" fill={HAIR} />
        <circle cx={GIRL_X + 8.4} cy="63" r="2.8" fill={HAIR} />
        <circle cx={GIRL_X - 7.2} cy="59.8" r="1.2" fill={RIBBON} />
        <circle cx={GIRL_X + 7.2} cy="59.8" r="1.2" fill={RIBBON} />
        <circle cx={GIRL_X} cy="60.4" r="7.6" fill={HAIR} />
        <circle cx={GIRL_X} cy="62" r="6.6" fill={SKIN} />
        <path d={`M${GIRL_X - 6.6} 59.4 Q${GIRL_X - 3} 54.8 ${GIRL_X + 1} 57 Q${GIRL_X + 4} 55 ${GIRL_X + 6.6} 59.4 Q${GIRL_X} 58 ${GIRL_X - 6.6} 59.4 Z`} fill={HAIR} />
        <Face mood={mood} look={look} />
      </Layer>
    </>
  )
}

/** あつくて かいた あせ。あたまの よこを つたう。 */
function Sweat({ t }: SceneProps) {
  const show = during(t, 0.2, STEAM + 0.8, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.45].map((offset) => {
        const p = ((t + offset) % 0.9) / 0.9
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill={DROP} transform={`translate(${GIRL_X + 9.4 + p * 1.5} ${57 + p * 9}) scale(0.8)`} opacity={1 - p} />
      })}
    </g>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 12)

  const dark = span(t, GATHER + 0.5, GATHER + 1.4)
  const revive = span(t, RAIN_AT + 0.4, RAIN_AT + 1.8, easeInOut)

  // 女の子: あつくて ぐったり → 見あげる(うで で 空を さす)→ 雨で 大よろこび(うで を 上へ)
  const mood: Mood = t < STEAM ? 'hot' : t < HAPPY ? 'wonder' : 'happy'
  const point = span(t, GATHER - 0.3, GATHER + 0.4, backOut)
  const cheer = span(t, HAPPY, HAPPY + 0.4, backOut)
  const flap = wave(t, 0.34) * 10 * cheer
  const right = {
    upper: lerp(lerp(12, 115, point), 125, cheer),
    fore: lerp(lerp(8, 170, point), 150, cheer) + flap,
  }
  const left = { upper: lerp(12, 125, cheer), fore: lerp(8, 150, cheer) - flap }
  const hop = cheer > 0.9 ? Math.abs(wave(t, 0.5)) * 2.4 : 0
  // あつい間は うつむき、見あげる ときは あたまを 上げる
  const headDip = 1.2 * (1 - span(t, STEAM - 0.2, STEAM + 0.3)) + wave(t, 1.6) * 0.15
  const look = span(t, STEAM, STEAM + 0.5) * 0.9

  const droopNow = 1 - revive
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sun t={t} />
        <Ground revive={revive} />
        <Pond />
        <Flower droop={droopNow} revive={revive} />
        <Wisps t={t} />
        <ellipse cx={GIRL_X} cy="97.4" rx="9" ry="2.4" fill="#000000" opacity="0.12" />
        <Layer scale={1.15} y={-hop} origin={[GIRL_X, 96]}>
          <Girl mood={mood} look={look} right={right} left={left} headDip={headDip} />
          <Sweat t={t} />
        </Layer>
        <rect x="0" y="0" width="109" height="109" fill={SKY_DIM} opacity={dark * 0.14} />
        <Cloud t={t} dark={dark} />
        {COLUMNS.map((column) => (
          <RainColumn key={column.x} t={t} column={column} />
        ))}
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
    { at: 0, label: 'あつい日。女の子は ぐったり', sound: 'pop' },
    { at: STEAM, label: '池から けむりが もくもく のぼる' },
    { at: GATHER, label: '空で あつまって 雨雲に なる', sound: 'pop' },
    { at: DRIP, label: 'しずくが ぽつん' },
    { at: HAPPY, label: '雨が ふって 大よろこび' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '雲 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
