/*
 * 雨(あめ): 空の 雲から しずくが ぽつぽつ。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 空いっぱいに ひろがった 雨雲の てっぺん(空)
 *   2画目(丨)  … 雲の 左はし から ふる 雨の すじ
 *   3画目(𠃍)  … 雲の たいらな そこ と、右はし から ふる 雨の すじ
 *   4画目(丨)  … 雲の まんなか から ふる 雨の すじ(上の はし は 雲の中。下は みずたまり に おちる)
 *   5・6画目   … 左に ぽつぽつ おちる しずく(カエルの あたまの上)
 *   7・8画目   … 右に ぽつぽつ おちる しずく(あじさい の上)
 *
 * ながれ
 *   お日さまが てって、カエルは あつくて ぐったり
 *   → 雲が 左と右から あつまって 1つの 大きな 雨雲になり、空が くらくなる
 *   → 雲の そこ に しずくが ふくらんで、ぽつん。カエルの あたまに あたる
 *   → ぽつぽつ 雨。カエルが よろこんで はねる(あじさい が ゆれる・みずたまり に わ が ひろがる)
 *   → 左と右に 2つずつ おちる しずく が 点の場所に そろった しゅんかん、ほね が ひかって 字「雨」になる
 *
 * 雲・雨・カエルは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   雲の そこ は たいら(ほんものの 雲も、そこ が たいらになる)。雨は まっすぐ 下に おちる。
 *   カエルは 目が あたまの上に とび出て、まえあし は かた から 地面へ、うしろあし は 体の よこで おりたたむ。
 */
import type { ReactNode } from 'react'
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '雨'

const SUN = '#ffd24a'
const SKY_DIM = '#5b6d8a'
const HILL = '#e2f2d2'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const STEM = '#4c8f52'
const RAIN = '#5aaee8'
const DROP = '#7cc4f2'
const DROP_SHADE = '#56aae6'
const DROP_LIGHT = '#e8f6ff'
const POOL = '#a9d9f7'
const POOL_LIGHT = '#d8effc'
const FROG = '#7cc843'
const FROG_DARK = '#5ca83c'
const FROG_LIGHT = '#9edb6a'
const BELLY = '#eef6c6'
const BLOOM = '#8f9cec'
const BLOOM_DARK = '#6f7cd8'
const BLOOM_LIGHT = '#c8cffb'
const EYE = '#2b2b2b'
const MOUTH = '#c4504a'
const TONGUE = '#ff8a8a'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const GATHER = 1.0
const DARK = 2.2
/** 1つめの しずく が、雲の そこ で ふくらみ はじめる */
const DRIP = 2.9
/** 雨の すじ が ふりだし、みずたまり が でき はじめる */
const RAIN_AT = 4.5
const INK = 6.6
const DONE = 10.0
const DURATION = 10.6

/* ───────── 雲 ───────── */

/** 雲の そこ の まんなか。ここを じく に、3画目の よこ線(右が 少し上がる)と 同じだけ 雲を かたむける */
const BASE: readonly [number, number] = [54, 41.5]
/** 3画目の よこ線: 書きはじめ (18.25, 44.25) から、右の まがりかど (87.75, 38.25) まで */
const TILT_RAD = Math.atan2(38.25 - 44.25, 87.75 - 18.25)
const TILT = (TILT_RAD * 180) / Math.PI
/** x の所の、雲の そこ の 高さ */
const baseY = (x: number) => BASE[1] + (x - BASE[0]) * Math.tan(TILT_RAD)
/** 雲の どう(たいらな そこ を作る 長四角)の 上はし */
const SLAB_TOP = 29
/** 雲の かげ: 色の面を この分だけ 上に ずらして、そこ に こい色の おび を のこす */
const SHADE_BAND = 2.6

type Puff = readonly [cx: number, cy: number, r: number]
/** 雲の ひとかたまり。from〜to が たいらな そこ、puffs が 上の もくもく */
type CloudPart = { readonly from: number; readonly to: number; readonly puffs: readonly Puff[] }

const LEFT_CLOUD: CloudPart = { from: 11, to: 46, puffs: [[20.5, 33, 8.5], [33, 27, 10.5]] }
const MID_CLOUD: CloudPart = { from: 38, to: 71, puffs: [[45.5, 27, 9.5], [57, 25, 11.5]] }
const RIGHT_CLOUD: CloudPart = { from: 64, to: 97, puffs: [[71.5, 27, 9], [80, 27.5, 9.5], [88.5, 32.5, 8.5]] }

type Tone = { readonly body: string; readonly shade: string; readonly light: string }
/** はれた日の 白い雲 と、雨を ふらせる 灰色の 雨雲 */
const WHITE_TONE: Tone = { body: '#f8fbfe', shade: '#dbe5f0', light: '#ffffff' }
const RAIN_TONE: Tone = { body: '#a3b0c2', shade: '#8494aa', light: '#c3cddb' }

/** 雲の かたまり が いま どこに いるか */
type PartMove = { readonly part: CloudPart; readonly x: number; readonly scale: number; readonly origin: readonly [number, number] }

function PartShape({ part, lift }: { readonly part: CloudPart; readonly lift: number }) {
  return (
    <g transform={`translate(0 ${-lift})`}>
      <rect x={part.from} y={SLAB_TOP} width={part.to - part.from} height={BASE[1] - SLAB_TOP} rx="8" />
      {part.puffs.map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
      ))}
    </g>
  )
}

/**
 * 雲を 1つの色で ぬる。かげ → ハイライト → 色の面 の じゅんに、かたまり ぜんぶ を 重ねる。
 * ハイライト は 左上に、色の面 は そのまま 重ねるので、もくもく の 左上の ふち だけ が 明るく のこる。
 */
function CloudTone({ moves, tone }: { readonly moves: readonly PartMove[]; readonly tone: Tone }) {
  const each = (render: (part: CloudPart) => ReactNode) =>
    moves.map((move, i) => (
      <Layer key={i} x={move.x} scale={move.scale} origin={move.origin}>
        {render(move.part)}
      </Layer>
    ))
  return (
    <>
      <g fill={tone.shade}>{each((part) => <PartShape part={part} lift={0} />)}</g>
      <g fill={tone.light} transform="translate(-0.9 0)">
        {each((part) => <PartShape part={part} lift={SHADE_BAND + 1.3} />)}
      </g>
      <g fill={tone.body}>{each((part) => <PartShape part={part} lift={SHADE_BAND} />)}</g>
    </>
  )
}

/** 白い雲が 左右から ながれてきて、まんなか で もくもく ふくらみ、1つの 雨雲になる。dark で 灰色に かわる */
function Cloud({ t, dark }: SceneProps & { readonly dark: number }) {
  const drift = span(t, GATHER - 0.25, GATHER + 1.1, easeOut)
  const billow = span(t, GATHER + 0.35, GATHER + 1.2, backOut)
  if (drift <= 0) return null
  const moves: readonly PartMove[] = [
    { part: LEFT_CLOUD, x: -60 * (1 - drift), scale: 0.8 + 0.2 * drift, origin: [28, BASE[1]] },
    { part: RIGHT_CLOUD, x: 60 * (1 - drift), scale: 0.8 + 0.2 * drift, origin: [80, BASE[1]] },
    { part: MID_CLOUD, x: 0, scale: billow, origin: [55, BASE[1]] },
  ]
  return (
    <Layer rotate={TILT} origin={BASE}>
      <CloudTone moves={moves} tone={WHITE_TONE} />
      <Layer opacity={dark}>
        <CloudTone moves={moves} tone={RAIN_TONE} />
      </Layer>
    </Layer>
  )
}

/* ───────── しずく ───────── */

/** しずく(まんなか が 0,0。とがった先が 上) */
const DROP_PATH = 'M0 -6.2 C1.2 -3.8 3.7 -1.6 3.7 1.1 A3.7 3.7 0 0 1 -3.7 1.1 C-3.7 -1.6 -1.2 -3.8 0 -6.2 Z'
/** しずく の まんなか から 下はし まで */
const DROP_LOW = 4.8
/** 雲の そこ から、ぶらさがった しずく の まんなか まで */
const HANG = 4.4
/** おちる はやさ(1秒に すすむ きょり)と、はなれてから その はやさに なるまで の 時間 */
const FALL_SPEED = 42
const SPEED_UP = 0.18
/** しずく が 雲の そこ で ふくらむ 時間 */
const SWELL = 0.25

type Target = 'frog' | 'bloom' | 'pool'
type Drop = { readonly x: number; readonly born: number; readonly swell: number; readonly land: number; readonly target: Target }

const hangY = (x: number) => baseY(x) + HANG
/** 雲から はなれて time 秒で おちた きょり(はじめ だけ だんだん はやくなる) */
const fallen = (time: number) => (time < SPEED_UP ? (FALL_SPEED * time * time) / (2 * SPEED_UP) : FALL_SPEED * (time - SPEED_UP / 2))
/** distance だけ おちるのに かかる 時間(fallen の ぎゃく) */
const fallTime = (distance: number) =>
  distance < (FALL_SPEED * SPEED_UP) / 2 ? Math.sqrt((2 * SPEED_UP * distance) / FALL_SPEED) : distance / FALL_SPEED + SPEED_UP / 2
const landTime = (drop: Drop) => drop.born + drop.swell + fallTime(drop.land - hangY(drop.x))
/** at の しゅんかん に (x, y) を とおる しずく(点の場所に そろえるのに 使う) */
const passing = (x: number, y: number, at: number, land: number, target: Target): Drop => ({ x, born: at - SWELL - fallTime(y - hangY(x)), swell: SWELL, land, target })

/* ───────── カエル・あじさい・みずたまり の 場所 ───────── */

/**
 * カエルの 足もと(まんなか)。左の 点の しずく が、ちょうど 目と目の間 に おちてくる 場所に すわる
 * (字になる しゅんかん に、しずく が 目に かさならない)
 */
const FROG_AT: readonly [number, number] = [36.3, 97]
/** カエルの あたま(だえん)と、上に とび出た 目の こぶ(足もと から) */
const FROG_HEAD = { cy: -13.2, rx: 10.6, ry: 5.8 } as const
const FROG_EYE_BUMP = { dx: 6.2, cy: -17.6, r: 3.9 } as const
/** x の所の、カエルの いちばん上(あたま か 目の こぶ)の 高さ */
function frogTop(x: number) {
  const dx = x - FROG_AT[0]
  const head = Math.abs(dx) < FROG_HEAD.rx ? FROG_HEAD.cy - FROG_HEAD.ry * Math.sqrt(1 - (dx / FROG_HEAD.rx) ** 2) : 0
  const eyes = [-1, 1].map((side) => {
    const ex = dx - side * FROG_EYE_BUMP.dx
    return Math.abs(ex) < FROG_EYE_BUMP.r ? FROG_EYE_BUMP.cy - Math.sqrt(FROG_EYE_BUMP.r ** 2 - ex ** 2) : 0
  })
  return FROG_AT[1] + Math.min(head, ...eyes)
}
/** カエルに あたる ときの、しずく の まんなか */
const frogLand = (x: number) => frogTop(x) - DROP_LOW + 1
/** あじさい の ねもと */
const BUSH_AT: readonly [number, number] = [74, 97]
type Cluster = { readonly x: number; readonly y: number; readonly r: number }
/** あじさい の 花の まり(ねもと から)。うしろの 2つ → まえの 大きな 1つ の じゅんに 描く */
const CLUSTERS: readonly Cluster[] = [
  { x: -8.6, y: -9.8, r: 4.8 },
  { x: 8, y: -10.8, r: 5.4 },
  { x: -0.6, y: -14.4, r: 6.8 },
]
const bloomLand = (cluster: Cluster) => BUSH_AT[1] + cluster.y - cluster.r - DROP_LOW + 1
/** みずたまり(地面の てまえ) */
const POOL_AT: readonly [number, number] = [57.5, 99.6]
const POOL_LAND = POOL_AT[1] - DROP_LOW + 2

/** 点(5〜8画目)の まんなか。さいごの しずく が、字になる しゅんかん に ここを とおる */
const DOTS = [
  [36.65, 56.5],
  [36.4, 72.8],
  [73.2, 52.7],
  [72.8, 70.4],
] as const

/** born 秒に 雲の そこ で できて、カエル・あじさい の 花・みずたまり に おちる しずく */
const toFrog = (x: number, born: number): Drop => ({ x, born, swell: SWELL, land: frogLand(x), target: 'frog' })
const toBloom = (x: number, born: number, cluster: Cluster): Drop => ({ x, born, swell: SWELL, land: bloomLand(cluster), target: 'bloom' })
const toPool = (x: number, born: number): Drop => ({ x, born, swell: SWELL, land: POOL_LAND, target: 'pool' })

const DROPS: readonly Drop[] = [
  // 1つめ: ゆっくり ふくらんで、カエルの あたまに ぽつん
  { x: 36.2, born: DRIP, swell: 0.6, land: frogLand(36.2), target: 'frog' },
  // ぽつぽつ(1つめが あたる まで、ほかの しずく は できない)
  toBloom(73, 4.0, CLUSTERS[2]),
  toPool(57.5, 4.2),
  toBloom(66, 4.45, CLUSTERS[0]),
  toFrog(39.5, 4.6),
  toPool(56, 4.75),
  toBloom(82, 4.85, CLUSTERS[1]),
  toFrog(32.5, 5.1),
  // 点の場所に、字になる しゅんかん に そろう 4つ(左右に 2つずつ)。ほかの しずく は、その前に おちきる
  passing(DOTS[1][0], DOTS[1][1], INK, frogLand(DOTS[1][0]), 'frog'),
  passing(DOTS[0][0], DOTS[0][1], INK, frogLand(DOTS[0][0]), 'frog'),
  passing(DOTS[3][0], DOTS[3][1], INK, bloomLand(CLUSTERS[2]), 'bloom'),
  passing(DOTS[2][0], DOTS[2][1], INK, bloomLand(CLUSTERS[2]), 'bloom'),
  // 字になる間も、うしろで うすく ふりつづける
  toPool(55.5, 6.9),
  toBloom(81, 7.3, CLUSTERS[1]),
  toFrog(40.5, 7.6),
  toPool(51.5, 8.1),
  toBloom(66, 8.5, CLUSTERS[0]),
  toFrog(33.5, 8.9),
]

const hitsOn = (target: Target) => DROPS.filter((drop) => drop.target === target)
const FIRST_HIT = landTime(DROPS[0])
const FROG_HITS = hitsOn('frog').map(landTime)

function DropShape({ x, y, scale = 1 }: { readonly x: number; readonly y: number; readonly scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d={DROP_PATH} fill={DROP_SHADE} />
      <path d={DROP_PATH} fill={DROP} transform="translate(-0.45 -0.35) scale(0.86)" />
      <ellipse cx="-1.3" cy="-0.2" rx="0.9" ry="1.6" fill={DROP_LIGHT} transform="rotate(18 -1.3 -0.2)" />
    </g>
  )
}

/** 1つぶ の しずく。雲の そこ で ふくらんで、はなれて おちる。あたったら きえる */
function FallingDrop({ drop, t }: { readonly drop: Drop; readonly t: number }) {
  if (t < drop.born) return null
  const release = drop.born + drop.swell
  if (t < release) {
    // 雲の うしろ から、ぶらさがる ように ふくらんでくる
    const grow = span(t, drop.born, release, easeOut)
    return <DropShape x={drop.x} y={baseY(drop.x) + HANG * grow} scale={0.3 + 0.7 * grow} />
  }
  const y = hangY(drop.x) + fallen(t - release)
  if (y >= drop.land) return null
  return <DropShape x={drop.x} y={y} />
}

/** あたった所で、小さな しぶき が 左右に はねる */
function Splash({ x, y, age }: { readonly x: number; readonly y: number; readonly age: number }) {
  if (age <= 0 || age >= 1) return null
  const rise = Math.sin(age * Math.PI) * 3.2
  return (
    <g fill={DROP} opacity={1 - age}>
      <circle cx={x - 1.5 - age * 4.5} cy={y - rise} r={0.95} />
      <circle cx={x + 1.5 + age * 4.5} cy={y - rise} r={0.95} />
      <circle cx={x - 0.6 - age * 1.6} cy={y - rise * 1.5} r={0.7} />
      <circle cx={x + 0.6 + age * 1.6} cy={y - rise * 1.5} r={0.7} />
    </g>
  )
}

function Drops({ t }: SceneProps) {
  return (
    <>
      {DROPS.map((drop, i) => (
        <FallingDrop key={i} drop={drop} t={t} />
      ))}
    </>
  )
}

function Splashes({ t }: SceneProps) {
  return (
    <>
      {DROPS.filter((drop) => drop.target !== 'pool').map((drop, i) => (
        <Splash key={i} x={drop.x} y={drop.land + DROP_LOW - 0.6} age={(t - landTime(drop)) / 0.4} />
      ))}
    </>
  )
}

/* ───────── 雨の すじ ───────── */

/** 雨の すじ(左・まんなか・右)。2画目・4画目・3画目の たて の所に ふる */
const RAIN_LINES: readonly { readonly x: number; readonly bottom: number }[] = [
  { x: 18, bottom: 95.4 },
  { x: 53.6, bottom: POOL_AT[1] - 0.6 },
  { x: 89.6, bottom: 95 },
]
/** すじ の 点線(雨つぶ の ながさ と すきま)と、ながれる はやさ */
const DASH = 5
const GAP = 6.5
const RAIN_SPEED = 70
const LINE_START = RAIN_AT + 0.1
const LINE_GROWN = RAIN_AT + 0.85

function RainLines({ t }: SceneProps) {
  const grow = span(t, LINE_START, LINE_GROWN, easeIn)
  if (grow <= 0) return null
  // 点線を 下へ ずらしていくと、雨つぶ が おちていく ように見える
  const offset = -((t * RAIN_SPEED) % (DASH + GAP))
  return (
    <g stroke={RAIN} strokeWidth="1.7" strokeLinecap="round" strokeDasharray={`${DASH} ${GAP}`} strokeDashoffset={offset}>
      {RAIN_LINES.map(({ x, bottom }) => {
        const top = baseY(x) + 0.6
        return <line key={x} x1={x} y1={top} x2={x} y2={top + (bottom - top) * grow} />
      })}
    </g>
  )
}

/** 左右の すじ が 地面に とどいた所で、はねる しぶき */
function LineSplashes({ t }: SceneProps) {
  if (t < LINE_GROWN) return null
  return (
    <>
      {[RAIN_LINES[0], RAIN_LINES[2]].map(({ x, bottom }, i) => (
        <Splash key={x} x={x} y={bottom} age={((t - LINE_GROWN + i * 0.21) % 0.42) / 0.42} />
      ))}
    </>
  )
}

/* ───────── みずたまり ───────── */

/** みずたまり に できる わ。ひろがりながら きえる */
function Ripple({ x, age }: { readonly x: number; readonly age: number }) {
  if (age <= 0 || age >= 1) return null
  return <ellipse cx={x} cy={POOL_AT[1]} rx={0.8 + age * 5.4} ry={0.35 + age * 1.4} fill="none" stroke="#ffffff" strokeWidth="0.6" opacity={1 - age} />
}

/** まんなか の すじ が みずたまり に とどいてから、わ が できる 間かく と、わ が きえるまで の 時間 */
const LINE_RIPPLE_EVERY = 0.5
const RIPPLE_LIFE = 0.9

/** まんなか の すじ が おちる所に、つぎつぎ できる わ(いま 見えている 2つ) */
function LineRipples({ t }: SceneProps) {
  if (t < LINE_GROWN) return null
  const latest = LINE_GROWN + Math.floor((t - LINE_GROWN) / LINE_RIPPLE_EVERY) * LINE_RIPPLE_EVERY
  return (
    <>
      {[latest, latest - LINE_RIPPLE_EVERY]
        .filter((start) => start >= LINE_GROWN)
        .map((start) => (
          <Ripple key={start} x={RAIN_LINES[1].x} age={(t - start) / RIPPLE_LIFE} />
        ))}
    </>
  )
}

/** 雨が ふりだすと、地面の てまえ に みずたまり が できる */
function Puddle({ t }: SceneProps) {
  const grow = span(t, RAIN_AT, RAIN_AT + 1.2, easeOut)
  if (grow <= 0) return null
  const [cx, cy] = POOL_AT
  return (
    <>
      <ellipse cx={cx} cy={cy} rx={10 * grow} ry={2.6 * grow} fill={POOL} />
      <ellipse cx={cx - 3.2 * grow} cy={cy - 0.7 * grow} rx={3.6 * grow} ry={0.7 * grow} fill={POOL_LIGHT} />
      {hitsOn('pool').map((drop, i) => (
        <Ripple key={i} x={drop.x} age={(t - landTime(drop)) / RIPPLE_LIFE} />
      ))}
      <LineRipples t={t} />
    </>
  )
}

/* ───────── 空・地面 ───────── */

const SUN_AT: readonly [number, number] = [54, 17]

/** お日さま。雨雲の うしろに かくれて、空が くらくなると きえる */
function Sun({ t, dark }: SceneProps & { readonly dark: number }) {
  const pop = span(t, 0, 0.55, backOut)
  const [cx, cy] = SUN_AT
  return (
    <Layer opacity={1 - dark}>
      <Layer opacity={Math.min(pop, 1)} rotate={t * 14} origin={SUN_AT}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={cx - 0.8} y={cy - 11.6} width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} ${cx} ${cy})`} />
        ))}
      </Layer>
      <circle cx={cx} cy={cy} r={6.2 * pop} fill={SUN} />
    </Layer>
  )
}

function Ground() {
  return (
    <>
      {/* とおくの おか(おくゆき を出す) */}
      <path d="M-4 99 Q18 77 44 90 Q72 71 113 93 V101 H-4 Z" fill={HILL} />
      <ellipse cx="54.5" cy="98.5" rx="52" ry="6" fill={GRASS} />
      {[4, 10, 97, 103].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/* ───────── あじさい ───────── */

/** あじさい の 小さな 花(4まい の はなびら) */
function Floret({ x, y, size }: { readonly x: number; readonly y: number; readonly size: number }) {
  const d = size * 0.55
  return (
    <>
      {[
        [d, 0],
        [-d, 0],
        [0, d],
        [0, -d],
      ].map(([dx, dy]) => (
        <circle key={`${dx}-${dy}`} cx={x + dx} cy={y + dy} r={size * 0.5} fill={BLOOM_LIGHT} />
      ))}
      <circle cx={x} cy={y} r={size * 0.22} fill={BLOOM_DARK} />
    </>
  )
}

/** あじさい の 花の まり。小さな 花が たくさん あつまって、まるく なる */
function Bloom({ cluster }: { readonly cluster: Cluster }) {
  const { x, y, r } = cluster
  const ring = Array.from({ length: 6 }, (_, i) => [x + Math.cos((i / 6) * Math.PI * 2 + 0.4) * r * 0.58, y + Math.sin((i / 6) * Math.PI * 2 + 0.4) * r * 0.58] as const)
  return (
    <>
      <circle cx={x} cy={y} r={r} fill={BLOOM_DARK} />
      <circle cx={x - r * 0.1} cy={y - r * 0.12} r={r * 0.86} fill={BLOOM} />
      {[[x, y] as const, ...ring].map(([fx, fy]) => (
        <Floret key={`${fx}-${fy}`} x={fx} y={fy} size={r * 0.24} />
      ))}
    </>
  )
}

/** あじさい の 葉(ねもと が 0,0。とがった先が 上) */
function Leaf({ x, y, angle, length, width, color }: { readonly x: number; readonly y: number; readonly angle: number; readonly length: number; readonly width: number; readonly color: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path d={`M0 0 Q${width} ${-length * 0.4} 0 ${-length} Q${-width} ${-length * 0.4} 0 0 Z`} fill={color} />
      <path d={`M0 -0.6 L0 ${-length * 0.8}`} stroke={LEAF_DARK} strokeWidth="0.5" strokeLinecap="round" opacity="0.6" />
    </g>
  )
}

/** しずく が あたると、花の まり が ぽよん と ゆれる */
function bounceOf(cluster: Cluster, t: number) {
  const world = BUSH_AT[0] + cluster.x
  return hitsOn('bloom')
    .filter((drop) => Math.abs(drop.x - world) <= cluster.r)
    .reduce((sum, drop) => {
      const age = (t - landTime(drop)) / 0.55
      return age > 0 && age < 1 ? sum + Math.sin(age * Math.PI * 2.5) * (1 - age) * 1.4 : sum
    }, 0)
}

/** あつい間は、花の まり が 外へ うなだれる角度(うしろ左・うしろ右・まえ) */
const WILT_ANGLES = [-17, 17, -7] as const
/** はじめて 花に しずく が あたった しゅんかん。ここから しゃんと 立ちなおる */
const PERK_UP = Math.min(...hitsOn('bloom').map(landTime))

/** あじさい。はれて あつい間は しおれて、雨に あたると 元気に 立ちなおる */
function Hydrangea({ t }: SceneProps) {
  const grow = span(t, 0.15, 0.7, backOut)
  if (grow <= 0) return null
  const wilt = 1 - span(t, PERK_UP, PERK_UP + 0.6, backOut)
  return (
    <Layer x={BUSH_AT[0]} y={BUSH_AT[1]} scale={grow}>
      <Leaf x={-3} y={-1.5} angle={-62 - 14 * wilt} length={11} width={4.6} color={LEAF_DARK} />
      <Leaf x={3} y={-1.5} angle={62 + 14 * wilt} length={11} width={4.6} color={LEAF_DARK} />
      {CLUSTERS.map((cluster, i) => {
        // くき は ねもと から 花の まり へ。しおれると、ねもと から かたむき、花の おもさ で 先が たれる
        const side = cluster.x > 0 ? 1 : -1
        const tipX = cluster.x + side * 1.2 * wilt
        const tipY = cluster.y + 2.2 * wilt
        return (
          <Layer key={cluster.x} rotate={WILT_ANGLES[i] * wilt}>
            <path d={`M0 0 Q${cluster.x * 0.1} ${cluster.y * 0.65} ${tipX} ${tipY}`} fill="none" stroke={STEM} strokeWidth="1.2" />
            <Layer x={tipX - cluster.x} y={tipY - cluster.y + bounceOf(cluster, t)}>
              <Bloom cluster={cluster} />
            </Layer>
          </Layer>
        )
      })}
      <Leaf x={-1.5} y={0} angle={-34 - 18 * wilt} length={10} width={4.4} color={LEAF} />
      <Leaf x={1.5} y={0} angle={36 + 18 * wilt} length={10} width={4.4} color={LEAF} />
    </Layer>
  )
}

/* ───────── カエル ───────── */

type FrogMood = 'hot' | 'look' | 'squint' | 'joy' | 'smile'

/** 白目の まんなか(足もと から)。目は あたまの上に とび出た こぶ の中 */
const EYES: readonly (readonly [number, number])[] = [
  [-FROG_EYE_BUMP.dx, FROG_EYE_BUMP.cy - 0.3],
  [FROG_EYE_BUMP.dx, FROG_EYE_BUMP.cy - 0.3],
]

function FrogEye({ at, mood, look }: { readonly at: readonly [number, number]; readonly mood: FrogMood; readonly look: readonly [number, number] }) {
  const [ex, ey] = at
  const inward = ex < 0 ? 1 : -1
  if (mood === 'squint') {
    // ぎゅっと つぶった目(> <)
    return <path d={`M${ex - inward * 1.4} ${ey - 1.5} L${ex + inward * 1.4} ${ey} L${ex - inward * 1.4} ${ey + 1.5}`} fill="none" stroke={EYE} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
  }
  if (mood === 'joy') {
    // にっこり 目
    return <path d={`M${ex - 2} ${ey + 0.9} Q${ex} ${ey - 1.9} ${ex + 2} ${ey + 0.9}`} fill="none" stroke={EYE} strokeWidth="0.9" strokeLinecap="round" />
  }
  // 黒目は、見ている ほう へ よる
  const dx = look[0] - ex
  const dy = look[1] - ey
  const len = Math.hypot(dx, dy) || 1
  const px = ex + (dx / len) * 1.05
  const py = ey + (dy / len) * 1.05
  return (
    <>
      <circle cx={ex} cy={ey} r="2.8" fill="#ffffff" />
      <circle cx={px} cy={py} r="1.5" fill={EYE} />
      <circle cx={px - 0.5} cy={py - 0.5} r="0.45" fill="#ffffff" />
      {mood === 'hot' && (
        // あつくて ねむそうな、はんぶん とじた まぶた
        <>
          <path d={`M${ex - 3} ${ey + 0.3} A3 3 0 0 1 ${ex + 3} ${ey + 0.3} Z`} fill={FROG} />
          <path d={`M${ex - 2.7} ${ey + 0.3} H${ex + 2.7}`} stroke={FROG_DARK} strokeWidth="0.7" strokeLinecap="round" />
        </>
      )}
    </>
  )
}

function FrogMouth({ mood }: { readonly mood: FrogMood }) {
  if (mood === 'joy' || mood === 'smile') {
    // 大きく あけて わらう
    return (
      <>
        <path d="M-5.8 -12.2 Q0 -12.9 5.8 -12.2 Q4.6 -7.6 0 -7.3 Q-4.6 -7.6 -5.8 -12.2 Z" fill={MOUTH} />
        <ellipse cx="0" cy="-8.5" rx="2.6" ry="1.1" fill={TONGUE} />
      </>
    )
  }
  if (mood === 'hot') {
    // はあはあ。べろ を 出している
    return (
      <>
        <ellipse cx="1.6" cy="-10.2" rx="1.3" ry="1.7" fill={TONGUE} />
        <path d="M-5.6 -11.4 Q0 -10.6 5.6 -11.4" fill="none" stroke={EYE} strokeWidth="0.8" strokeLinecap="round" />
      </>
    )
  }
  if (mood === 'squint') {
    return <path d="M-4.6 -11.2 Q-2.3 -12.4 0 -11.2 Q2.3 -10 4.6 -11.2" fill="none" stroke={EYE} strokeWidth="0.8" strokeLinecap="round" />
  }
  // ぽかん と 見あげる
  return (
    <>
      <path d="M-5.4 -11.6 Q0 -10.8 5.4 -11.6" fill="none" stroke={EYE} strokeWidth="0.8" strokeLinecap="round" />
      <ellipse cx="0" cy="-10.6" rx="1.3" ry="1.1" fill={MOUTH} />
    </>
  )
}

/** すわった カエル(まえから 見た ところ)。足もと の まんなか が 0,0 */
function Frog({ mood, look }: { readonly mood: FrogMood; readonly look: readonly [number, number] }) {
  return (
    <>
      {/* うしろあし: 体の よこで おりたたんだ もも と、地面に ひらいた 足 */}
      {[-1, 1].map((side) => (
        <g key={side} fill={FROG_DARK}>
          <ellipse cx={side * 8.6} cy="-4.6" rx="5" ry="4.3" transform={`rotate(${side * 18} ${side * 8.6} -4.6)`} />
          <ellipse cx={side * 11.8} cy="-1" rx="3.8" ry="1.5" />
          <circle cx={side * 15.3} cy="-1.6" r="0.8" />
          <circle cx={side * 15.5} cy="-0.3" r="0.8" />
        </g>
      ))}
      {/* どう と おなか */}
      <ellipse cx="0" cy="-6.8" rx="8.3" ry="6.8" fill={FROG} />
      <ellipse cx="0" cy="-5.3" rx="5.5" ry="4.7" fill={BELLY} />
      {/* まえあし: かた(あたまの下)から 地面へ */}
      {[-1, 1].map((side) => (
        <g key={side} fill={FROG}>
          <path d={`M${side * 4.4} -8.6 L${side * 5.3} -1.3`} stroke={FROG} strokeWidth="2.7" strokeLinecap="round" />
          <ellipse cx={side * 5.8} cy="-0.9" rx="2.4" ry="1.1" />
        </g>
      ))}
      {/* あたま と、上に とび出た 目の こぶ */}
      <ellipse cx="0" cy={FROG_HEAD.cy} rx={FROG_HEAD.rx} ry={FROG_HEAD.ry} fill={FROG} />
      <ellipse cx="-2.6" cy="-15.6" rx="3.4" ry="1.3" fill={FROG_LIGHT} />
      {EYES.map(([ex]) => (
        <circle key={ex} cx={ex} cy={FROG_EYE_BUMP.cy} r={FROG_EYE_BUMP.r} fill={FROG} />
      ))}
      <circle cx="-1.2" cy="-14.4" r="0.4" fill={FROG_DARK} />
      <circle cx="1.2" cy="-14.4" r="0.4" fill={FROG_DARK} />
      <circle cx="-8.2" cy="-11" r="1.5" fill={CHEEK} opacity="0.85" />
      <circle cx="8.2" cy="-11" r="1.5" fill={CHEEK} opacity="0.85" />
      {EYES.map((at) => (
        <FrogEye key={at[0]} at={at} mood={mood} look={look} />
      ))}
      <FrogMouth mood={mood} />
    </>
  )
}

/** カエルが はねる 時間(1つめの しずく に あたった あと、よろこんで 2かい) */
const HOPS = [4.7, 5.12] as const
const HOP_TIME = 0.38
const LOOK_UP = 1.6

function frogMood(t: number): FrogMood {
  if (t < LOOK_UP) return 'hot'
  if (t < FIRST_HIT) return 'look'
  if (t < FIRST_HIT + 0.35) return 'squint'
  if (t < HOPS[1] + HOP_TIME + 0.05) return 'joy'
  // あとから あたる しずく には、にっこり 目を つぶる
  return FROG_HITS.some((hit) => hit > FIRST_HIT && t >= hit && t < hit + 0.3) ? 'joy' : 'smile'
}

/** カエルが 見ている 点(場面の 座標) */
function frogLook(t: number): readonly [number, number] {
  if (t < LOOK_UP) return [FROG_AT[0], FROG_AT[1] + 20]
  const first = DROPS[0]
  if (t >= first.born && t < FIRST_HIT) {
    const release = first.born + first.swell
    return [first.x, t < release ? baseY(first.x) + 3 : hangY(first.x) + fallen(t - release)]
  }
  if (t < first.born) return [54, 34]
  return [FROG_AT[0] + 1, 50]
}

/** あつい間の あせ。あたまの よこ を つたって おちる */
function Sweat({ t }: SceneProps) {
  const show = during(t, 0.6, LOOK_UP + 0.2, 0.15)
  if (show <= 0) return null
  const p = ((t - 0.6) % 0.8) / 0.8
  return <path d={DROP_PATH} fill={DROP} transform={`translate(${11.6 + p * 0.9} ${-19.5 + p * 6}) scale(0.42)`} opacity={show * (1 - p * 0.5)} />
}

/** しずく が あたった しゅんかん の「びっくり」の線 */
function Shock({ t }: SceneProps) {
  const show = during(t, FIRST_HIT, FIRST_HIT + 0.4, 0.06)
  if (show <= 0) return null
  const out = span(t, FIRST_HIT, FIRST_HIT + 0.2, easeOut) * 1.2
  return (
    <g stroke={EYE} strokeWidth="0.8" strokeLinecap="round" opacity={show}>
      <path d={`M${-9 - out} ${-23 - out} l-1.8 -2`} />
      <path d={`M0 ${-25 - out} v-2.4`} />
      <path d={`M${9 + out} ${-23 - out} l1.8 -2`} />
    </g>
  )
}

function FrogActor({ t }: SceneProps) {
  const pop = span(t, 0.35, 0.8, backOut)
  if (pop <= 0) return null
  const hop = HOPS.reduce((sum, at) => sum + Math.sin(Math.PI * span(t, at, at + HOP_TIME)), 0)
  // とぶ まえに かがみ、おりたら ぺたん と つぶれる。しずく が あたっても 首を すくめる
  const crouch = HOPS.reduce((m, at) => Math.max(m, during(t, at - 0.12, at + 0.03, 0.06), during(t, at + HOP_TIME - 0.02, at + HOP_TIME + 0.14, 0.06)), 0)
  const flinch = FROG_HITS.reduce((m, hit) => Math.max(m, during(t, hit, hit + 0.28, 0.06)), 0)
  const squash = Math.max(crouch, flinch * 0.8)
  const pant = t < LOOK_UP ? wave(t, 0.45) * 0.025 : 0
  const lift = hop * 5.5
  // つぶれる(+)・のびる(-)。とんでいる間は、体が すこし たてに のびる
  const flatten = squash * 0.1 - pant - hop * 0.06
  const [lx, ly] = frogLook(t)
  return (
    <>
      <ellipse cx={FROG_AT[0]} cy={FROG_AT[1] + 0.6} rx={14 * pop * (1 - hop * 0.3)} ry="1.8" fill="#000000" opacity="0.12" />
      <Layer x={FROG_AT[0]} y={FROG_AT[1] - lift} scale={pop}>
        <Layer scaleX={1 + flatten * 0.7} scaleY={1 - flatten}>
          <Frog mood={frogMood(t)} look={[lx - FROG_AT[0], ly - (FROG_AT[1] - lift)]} />
        </Layer>
        <Sweat t={t} />
        <Shock t={t} />
      </Layer>
    </>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)
  // 雲が あつまると 灰色の 雨雲になり、空も うす暗くなる
  const dark = span(t, DARK, DARK + 0.7, easeInOut)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <rect x="0" y="0" width="109" height="109" fill={SKY_DIM} opacity={dark * 0.2} />
        <Sun t={t} dark={dark} />
        <Ground />
        <Puddle t={t} />
        <Hydrangea t={t} />
        <FrogActor t={t} />
        <RainLines t={t} />
        <Drops t={t} />
        <Splashes t={t} />
        <LineSplashes t={t} />
        <Cloud t={t} dark={dark} />
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Layer scale={1 + bump} origin={[54.5, 54.5]}>
        <Ink char={CHAR} progress={ink.progress} tint={ink.tint} />
      </Layer>
      <Sparkles cx={54.5} cy={54} progress={ink.sparkle} />
    </>
  )
}

const scene: SceneModule = {
  char: CHAR,
  duration: DURATION,
  beats: [
    { at: 0, label: 'あつい日。カエルは ぐったり、あじさい は しおれる', sound: 'pop' },
    { at: GATHER, label: '白い雲が 左右から あつまってくる' },
    { at: DARK, label: '雲が 灰色の 雨雲になり、空が くらくなる' },
    { at: DRIP, label: '雲の そこ に しずくが ふくらんで、おちてくる' },
    { at: FIRST_HIT, label: 'ぽつん! カエルの あたまに あたる', sound: 'tap' },
    { at: HOPS[0], label: 'ぽつぽつ 雨。カエルは はねて よろこび、あじさい も 元気になる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '雨 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
