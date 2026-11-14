import type { ReactNode } from 'react'
import { backOut, clamp01, easeOut, span } from '../sceneKit'
import { Layer } from '../sceneParts'
import { byTime, mixColor, PALETTE, shade } from './palette'
import { Moon, Sky, Stars } from './sky'

/**
 * 背景の 定番: お日さま・雲・おか・のはら・草・木・家・花。「休」の 背景と 同じ 絵がら。
 * どれも t か 進みぐあい(grow など 0〜1)を もらって描く だけ(じぶんで 時間を もたない)。
 * Backdrop は time で 昼 → 夕方 → 夜 に かわる(空・月・星 は sky.tsx)。
 */

const r2 = (n: number) => Math.round(n * 100) / 100

/** お日さま。ひかり が ゆっくり まわる。from 秒から 0.6 秒で あらわれる */
export function Sun({ t, x = 13, y = 13, r = 6.2, from = 0, color = PALETTE.sun, rays = 1 }: { readonly t: number; readonly x?: number; readonly y?: number; readonly r?: number; readonly from?: number; readonly color?: string; readonly rays?: number }) {
  const show = span(t, from, from + 0.6, easeOut)
  if (show <= 0) return null
  // ひかり は 円の 少し外から(「休」と 同じ わりあい)
  const inner = r * 1.19
  const long = r * 0.65
  const width = r * 0.26
  return (
    <>
      <Layer opacity={show * rays} rotate={t * 14} origin={[x, y]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={r2(x - width / 2)} y={r2(y - inner - long)} width={r2(width)} height={r2(long)} rx={r2(width / 2)} fill={color} transform={`rotate(${i * 45} ${x} ${y})`} />
        ))}
      </Layer>
      <circle cx={x} cy={y} r={r2(r * show)} fill={color} />
    </>
  )
}

/** 雲 ひとつ(大きい だ円 と 小さい だ円)。size 1 で はば 18 くらい */
export function Cloud({ x, y, size = 1, opacity = 0.9, color = PALETTE.cloud }: { readonly x: number; readonly y: number; readonly size?: number; readonly opacity?: number; readonly color?: string }) {
  return (
    <g fill={color} opacity={opacity}>
      <ellipse cx={x} cy={y} rx={r2(7 * size)} ry={r2(3.4 * size)} />
      <ellipse cx={r2(x + 5 * size)} cy={r2(y - 2 * size)} rx={r2(5 * size)} ry={r2(3.4 * size)} />
    </g>
  )
}

export type CloudSpot = readonly [x: number, y: number, size: number]

/** ゆっくり ながれる 雲(speed は 1秒に すすむ きょり) */
export function Clouds({ t, at, speed = 1.6, color, opacity }: { readonly t: number; readonly at: readonly CloudSpot[]; readonly speed?: number; readonly color?: string; readonly opacity?: number }) {
  return (
    <g transform={`translate(${r2(t * speed)} 0)`}>
      {at.map(([x, y, size]) => (
        <Cloud key={`${x}:${y}`} x={x} y={y} size={size} color={color} opacity={opacity} />
      ))}
    </g>
  )
}

/** とおくの おか(おくゆき を出す)。y を かえると 上下に ずらせる */
export function Hills({ y = 0, color = PALETTE.hill }: { readonly y?: number; readonly color?: string }) {
  return <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill={color} transform={y === 0 ? undefined : `translate(0 ${y})`} />
}

/** 草 ひとむら(ぎざぎざ の 葉 3まい)。x, y は ねもと の 左はし */
export function Tuft({ x, y, color = PALETTE.leaf, size = 1 }: { readonly x: number; readonly y: number; readonly color?: string; readonly size?: number }) {
  const s = size
  return <path d={`M${x} ${y} l${r2(1.4 * s)} ${r2(-3.6 * s)} l${r2(1 * s)} ${r2(3.2 * s)} l${r2(1.6 * s)} ${r2(-4.2 * s)} l${r2(0.8 * s)} ${r2(4.6 * s)} Z`} fill={color} />
}

/** のはら: 地面の だ円 と 草。地面の 上の はし は だいたい y - 5 */
export function Meadow({ y = 98, tufts = [8, 46, 82, 100], color = PALETTE.grass, tuftColor = PALETTE.leaf }: { readonly y?: number; readonly tufts?: readonly number[]; readonly color?: string; readonly tuftColor?: string }) {
  return (
    <>
      <ellipse cx="54.5" cy={y} rx="51" ry="5.6" fill={color} />
      {tufts.map((x) => (
        <Tuft key={x} x={x} y={y - 0.5} color={tuftColor} />
      ))}
    </>
  )
}

/**
 * いつもの 背景 ひとそろい(お日さま・とおくの おか・雲・のはら)。「休」の 背景と 同じ。
 * sun={null} で お日さま なし、clouds={[]} で 雲 なし。
 * time で 時間を かえる: 0 = 昼(いつもの)、1 = 夕方、2 = 夜。とちゅう の 値で だんだん くれていく
 * (mix(t, 2, 4, 0, 2) のように わたす)。夕方 は お日さま を ひくく(sun={[90, 72]} など)おくと しずむ ように 見える。
 * 夜は 月(moon。null で なし)と 星 が 出る。雨・雪 の 日 は overcast(くもり)を 1 に。
 */
export function Backdrop({
  t,
  sun = [13, 13],
  clouds = [
    [-4, 46, 1],
    [94, 52, 0.86],
  ],
  tufts,
  ground = 98,
  time = 0,
  moon = [88, 16],
  moonPhase = 'full',
  overcast = 0,
}: {
  readonly t: number
  readonly sun?: readonly [number, number] | null
  readonly clouds?: readonly CloudSpot[]
  readonly tufts?: readonly number[]
  /** のはら の だ円 の まんなか の y */
  readonly ground?: number
  /** 0 = 昼、1 = 夕方、2 = 夜 */
  readonly time?: number
  readonly moon?: readonly [number, number] | null
  readonly moonPhase?: 'full' | 'crescent'
  /** くもり(0〜1)。空 が はい色 に なり、お日さま が かくれ、雲 が くらくなる(雨・雪 の 日) */
  readonly overcast?: number
}) {
  if (time <= 0 && overcast <= 0) {
    return (
      <>
        {sun && <Sun t={t} x={sun[0]} y={sun[1]} />}
        <Hills y={ground - 98} />
        <Clouds t={t} at={clouds} />
        <Meadow y={ground} tufts={tufts} />
      </>
    )
  }
  const night = Math.min(1, Math.max(0, time - 1))
  const dusk = Math.min(1, time)
  const gray = Math.min(1, Math.max(0, overcast))
  const cloud = mixColor(byTime(time, PALETTE.cloud, PALETTE.cloudEvening, PALETTE.cloudNight), PALETTE.cloudGray, gray)
  return (
    <>
      <Sky time={time} />
      {gray > 0 && <rect x="-2" y="-2" width="113" height="113" fill={mixColor(PALETTE.skyGray, PALETTE.skyNight, night)} opacity={r2(gray * 0.85)} />}
      <Stars t={t} show={night * (1 - gray)} />
      {moon && <Moon x={moon[0]} y={moon[1]} phase={moonPhase} show={night} />}
      {sun && night < 1 && gray < 1 && (
        <g opacity={(1 - night) * (1 - gray)}>
          <circle cx={sun[0]} cy={sun[1]} r={r2(6.2 + 5 * dusk)} fill={PALETTE.sunEvening} opacity={r2(0.3 * dusk)} />
          <Sun t={t} x={sun[0]} y={sun[1]} color={byTime(time, PALETTE.sun, PALETTE.sunEvening, PALETTE.sunEvening)} rays={1 - dusk} />
        </g>
      )}
      <Hills y={ground - 98} color={byTime(time, PALETTE.hill, PALETTE.hillEvening, PALETTE.hillNight)} />
      {/* のはら より てまえ の 地面(昼 は 場面の 下地 の 色。くれると いっしょに くらく) */}
      <rect x="-2" y={ground} width="113" height={r2(111 - ground)} fill={byTime(time, '#fffdf7', '#f6e3c6', '#2b3d55')} />
      <Clouds t={t} at={clouds} color={cloud} opacity={0.9 - 0.4 * night * (1 - gray)} />
      <Meadow y={ground} tufts={tufts} color={byTime(time, PALETTE.grass, PALETTE.grassEvening, PALETTE.grassNight)} tuftColor={byTime(time, PALETTE.leaf, PALETTE.leafEvening, PALETTE.leafNight)} />
    </>
  )
}

export type CanopyProps = {
  readonly x: number
  readonly y: number
  /** しげみ の はば の 半分 */
  readonly r: number
  /** そだつ 度合い(0〜1)。ぽん と ふくらむ */
  readonly grow?: number
  /** ゆれ(度)。wave(t, 3.4) * 1.3 くらい */
  readonly sway?: number
  /** 赤い 実 を つける */
  readonly fruit?: boolean
}

/** 葉の しげみ(こい みどり の 上に みどり、ひかる ところ を 少し)。「休」の 木の しげみ と 同じ形 */
const CANOPY_DARK = [[-0.56, 0.09, 0.43], [0.59, 0.06, 0.43], [0, -0.15, 0.52], [-0.71, 0.5, 0.19], [0.82, 0.43, 0.19]] as const
const CANOPY_MID = [[-0.29, 0.15, 0.37], [0.31, 0.15, 0.37], [0, 0, 0.4]] as const
const CANOPY_SHINE = [[-0.21, -0.19, 0.15], [0.38, -0.1, 0.11]] as const
const CANOPY_FRUIT = [[-0.44, 0.27, 0.07], [0.47, 0.28, 0.07]] as const

export function Canopy({ x, y, r, grow = 1, sway = 0, fruit = false }: CanopyProps) {
  const size = Math.max(0, backOut(clamp01(grow)))
  if (size <= 0) return null
  const dot = (list: readonly (readonly [number, number, number])[], color: string) =>
    list.map(([u, v, w]) => <circle key={`${color}${u}:${v}`} cx={r2(x + u * r)} cy={r2(y + v * r)} r={r2(w * r)} fill={color} />)
  return (
    <Layer scale={size} rotate={sway} origin={[x, y + r * 0.5]}>
      {dot(CANOPY_DARK, PALETTE.leafDark)}
      {dot(CANOPY_MID, PALETTE.leaf)}
      {dot(CANOPY_SHINE, PALETTE.leafLight)}
      {fruit && dot(CANOPY_FRUIT, PALETTE.fruit)}
    </Layer>
  )
}

/**
 * 葉の しげった 木(広葉樹)。x, y は みき の ねもと(地面)。
 * みき が のびて → えだ が わかれて → しげみ が ぽん と ふくらむ(grow 0〜1)。
 * えだ は みき から 出て、えだ先 と みき の てっぺん は しげみ に うもれる。
 */
export function Tree({ x, y, height = 60, grow = 1, sway = 0, fruit = false }: { readonly x: number; readonly y: number; readonly height?: number; readonly grow?: number; readonly sway?: number; readonly fruit?: boolean }) {
  const trunk = Math.max(0, backOut(span(grow, 0, 0.5)))
  if (trunk <= 0) return null
  const boughs = Math.max(0, backOut(span(grow, 0.3, 0.75)))
  const h = height
  const w = h * 0.12
  const top = y - h * 0.62
  const crown = y - h * 0.72
  return (
    <>
      <ellipse cx={x} cy={y + 0.6} rx={r2(h * 0.3 * trunk)} ry={r2(h * 0.045)} fill="#000000" opacity="0.1" />
      <Layer scaleX={0.6 + 0.4 * trunk} scaleY={trunk} origin={[x, y]}>
        {/* みき: ねもと が 少し ひろがる */}
        <path d={`M${r2(x - w * 1.05)} ${y + 0.8} Q${r2(x - w * 0.5)} ${r2(y - h * 0.08)} ${r2(x - w * 0.5)} ${r2(y - h * 0.2)} L${r2(x - w * 0.42)} ${r2(top)} L${r2(x + w * 0.42)} ${r2(top)} L${r2(x + w * 0.5)} ${r2(y - h * 0.2)} Q${r2(x + w * 0.5)} ${r2(y - h * 0.08)} ${r2(x + w * 1.05)} ${y + 0.8} Z`} fill={PALETTE.bark} />
        <path d={`M${r2(x - w * 0.1)} ${r2(y - h * 0.42)} q${r2(w * 0.16)} ${r2(h * 0.07)} 0 ${r2(h * 0.15)}`} fill="none" stroke={PALETTE.barkDark} strokeWidth={r2(Math.max(0.8, w * 0.15))} strokeLinecap="round" />
      </Layer>
      <Layer scale={boughs} origin={[x, top]}>
        <path d={`M${x} ${r2(top + h * 0.06)} L${r2(x - h * 0.17)} ${r2(crown + h * 0.02)} M${x} ${r2(top + h * 0.03)} L${r2(x + h * 0.15)} ${r2(crown - h * 0.01)}`} fill="none" stroke={PALETTE.bark} strokeWidth={r2(w * 0.5)} strokeLinecap="round" />
      </Layer>
      <Canopy x={x} y={crown} r={h * 0.42} grow={span(grow, 0.5, 1)} sway={sway} fruit={fruit} />
    </>
  )
}

/** はりの 葉の 木(針葉樹)。x, y は ねもと。三角の 葉が 3だん かさなる。日の あたる 左がわ が 少し あかるい */
export function PineTree({ x, y, height = 40, grow = 1, sway = 0 }: { readonly x: number; readonly y: number; readonly height?: number; readonly grow?: number; readonly sway?: number }) {
  const size = Math.max(0, backOut(clamp01(grow)))
  if (size <= 0) return null
  const h = height
  /** だん ごとの すそ の 高さ・てっぺん の 高さ・すその はば の 半分(背の高さ に たいする わりあい) */
  const tiers = [
    [0.18, 0.66, 0.36],
    [0.36, 0.84, 0.28],
    [0.54, 1, 0.2],
  ] as const
  return (
    <Layer scale={size} origin={[x, y]}>
      <rect x={r2(x - h * 0.045)} y={r2(y - h * 0.24)} width={r2(h * 0.09)} height={r2(h * 0.24 + 0.6)} rx={r2(h * 0.02)} fill={PALETTE.bark} />
      <Layer rotate={sway} origin={[x, y - h * 0.2]}>
        {tiers.map(([bottom, top, half]) => {
          const by = y - h * bottom
          const tip = y - h * top
          return (
            <g key={bottom}>
              <path d={`M${x} ${r2(tip)} Q${r2(x - h * half * 0.3)} ${r2(by - h * 0.12)} ${r2(x - h * half)} ${r2(by)} Q${x} ${r2(by + h * 0.05)} ${r2(x + h * half)} ${r2(by)} Q${r2(x + h * half * 0.3)} ${r2(by - h * 0.12)} ${x} ${r2(tip)} Z`} fill={PALETTE.pine} />
              <path d={`M${x} ${r2(tip)} Q${r2(x - h * half * 0.3)} ${r2(by - h * 0.12)} ${r2(x - h * half)} ${r2(by)} Q${r2(x - h * half * 0.4)} ${r2(by + h * 0.035)} ${x} ${r2(by + h * 0.03)} Z`} fill={PALETTE.pineLight} />
            </g>
          )
        })}
      </Layer>
    </Layer>
  )
}

/**
 * 家(三角の やね・かべ・ドア・まど)。x は 家の まんなか、y は 地面。
 * grow(0〜1)で ぽん と たつ。まど に あかり を ともす ときは light(0〜1)。
 */
export function House({ x, y, width = 22, grow = 1, wall = PALETTE.wall, roof = PALETTE.roof, light = 0 }: { readonly x: number; readonly y: number; readonly width?: number; readonly grow?: number; readonly wall?: string; readonly roof?: string; readonly light?: number }) {
  const pop = Math.max(0, backOut(clamp01(grow)))
  if (pop <= 0) return null
  const w = width
  const h = w * 0.7
  const roofTop = y - h - w * 0.42
  const win = w * 0.2
  return (
    <Layer scale={pop} origin={[x, y]}>
      <rect x={r2(x - w / 2)} y={r2(y - h)} width={w} height={r2(h)} rx="1.2" fill={wall} />
      <rect x={r2(x - w / 2)} y={r2(y - h)} width={w} height={r2(h * 0.12)} fill={shade(wall, 0.08)} />
      {/* やね: かべ より 少し 外へ 出る(のき) */}
      <path d={`M${r2(x - w / 2 - w * 0.08)} ${r2(y - h + 0.8)} L${x} ${r2(roofTop)} L${r2(x + w / 2 + w * 0.08)} ${r2(y - h + 0.8)} Z`} fill={roof} stroke={roof} strokeWidth="1.4" strokeLinejoin="round" />
      <path d={`M${r2(x - w / 2 - w * 0.08)} ${r2(y - h + 0.8)} H${r2(x + w / 2 + w * 0.08)}`} stroke={shade(roof, 0.2)} strokeWidth="1.2" strokeLinecap="round" />
      {/* ドア と まど */}
      <rect x={r2(x - w * 0.11)} y={r2(y - h * 0.52)} width={r2(w * 0.22)} height={r2(h * 0.52)} rx="0.8" fill={PALETTE.wood} />
      <circle cx={r2(x + w * 0.06)} cy={r2(y - h * 0.25)} r={r2(w * 0.02 + 0.2)} fill={PALETTE.sun} />
      <rect x={r2(x + w * 0.22)} y={r2(y - h * 0.78)} width={r2(win)} height={r2(win)} rx="0.5" fill={light > 0 ? PALETTE.windowLight : '#cfe6f5'} opacity={light > 0 ? 0.6 + 0.4 * clamp01(light) : 1} />
      <path d={`M${r2(x + w * 0.22 + win / 2)} ${r2(y - h * 0.78)} v${r2(win)} M${r2(x + w * 0.22)} ${r2(y - h * 0.78 + win / 2)} h${r2(win)}`} stroke={shade(wall, 0.25)} strokeWidth="0.7" />
    </Layer>
  )
}

/** 地面に さく 花(くき・葉・5まい の 花びら)。x, y は ねもと */
export function Flower({ x, y, color = '#f07f9e', grow = 1, sway = 0, size = 1 }: { readonly x: number; readonly y: number; readonly color?: string; readonly grow?: number; readonly sway?: number; readonly size?: number }) {
  const g = Math.max(0, backOut(clamp01(grow))) * size
  if (g <= 0) return null
  return (
    <Layer scale={g} rotate={sway} origin={[x, y]}>
      <path d={`M${x} ${y} Q${x - 0.8} ${y - 5} ${x} ${y - 9.5}`} fill="none" stroke={PALETTE.leafDark} strokeWidth="1.3" strokeLinecap="round" />
      <path d={`M${x} ${y - 4} q3 -2.8 4.6 -0.6 q-2.6 2.2 -4.6 0.6 Z`} fill={PALETTE.leaf} />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={r2(x + Math.cos((i / 5) * Math.PI * 2) * 2.5)} cy={r2(y - 11.6 + Math.sin((i / 5) * Math.PI * 2) * 2.5)} r="1.9" fill={color} />
      ))}
      <circle cx={x} cy={y - 11.6} r="1.6" fill={PALETTE.sun} />
    </Layer>
  )
}

export type DepthItem = { readonly key: string; readonly z: number; readonly node: ReactNode }

/**
 * 地面に 立つ もの を、おくから てまえ の じゅん(足もと の y が 小さい じゅん)に 描く。
 * z は 足もと の y。同じ z なら ならべた じゅん。人が 木の まえを 通るなら、人の z を 木より 大きく する
 * (とちゅうで 重なりの じゅん が 入れかわらない。入れかわる のは、z を かえた ときだけ)。
 */
export function ByDepth({ items }: { readonly items: readonly DepthItem[] }) {
  const sorted = items.map((item, i) => ({ item, i })).sort((a, b) => a.item.z - b.item.z || a.i - b.i)
  return (
    <>
      {sorted.map(({ item }) => (
        <g key={item.key}>{item.node}</g>
      ))}
    </>
  )
}
