import type { ReactNode } from 'react'
import { Layer } from '../sceneParts'
import type { Point } from './limbs'
import { mountainPoint, slopeControl, type MountainShape } from './mountainShape'
import { PALETTE } from './palette'

/**
 * 山(「山」の 場面 の 山 を 部品 に した もの)。形 を わたして 描く:
 *   const peak: MountainShape = { top: [52, 14], foot: 90, half: 44 }
 *   <Mountain shape={peak} rise={span(t, 1, 2)} snow={29} />
 * ほんものの 山 の つくり:
 *   すそ が ひろがった 三角(straight が 小さい ほど すそ が ひろがる)。てっぺん は 少し まるい。
 *   日 は 左上 から さす ので、りょうせん(てっぺん から ふもと へ おりる 線)の 左 が 日なた、右 が ひかげ。
 *   snow を わたすと、その 高さ より 上 に 雪 が のこる(ふち は とけて たれた ように 下へ ふくらむ)。
 * rise(0〜1)で 地面 の 下 から せりあがる(rise = 0 では 何も 描かない)。地面・のはら は 山 の あと に 描いて ふもと を かくす。
 * far で とおく の 山 の 色(青み の ある みどり)。山はだ に たて の すじ は 描かない(字 の たて線 と まぎれる)。
 */

const r2 = (n: number) => Math.round(n * 100) / 100
const pt = ([x, y]: Point) => `${r2(x)} ${r2(y)}`
/** てっぺん を まるくする 長さ(とがりすぎない ように) */
const ROUND = 1.8

const tipDepth = (p: MountainShape) => ROUND / Math.max(1, p.foot - p.top[1])
const apex = (p: MountainShape): Point => [p.top[0], p.top[1] + ROUND / 2]
/** りょうせん(省いたとき): てっぺん から ほぼ まっすぐ 下 へ、すそ で 少し 右 へ */
const ridgeOf = (p: MountainShape) => p.ridge ?? `Q${pt([p.top[0] + p.half * 0.02, (p.top[1] + p.foot) / 2])} ${pt([p.top[0] + p.half * 0.08, p.foot])}`
/** りょうせん の x(雪 の ふち と まじわる 所)。じぶん で きめた りょうせん は てっぺん の 真下 と みなす */
const ridgeX = (p: MountainShape, y: number) => (p.ridge ? p.top[0] : p.top[0] + p.half * 0.08 * ((y - p.top[1]) / (p.foot - p.top[1])) ** 2)

function outlinePath(p: MountainShape): string {
  const d0 = tipDepth(p)
  return `M${pt(mountainPoint(p, -1, 1))} Q${pt(slopeControl(p, -1, d0, 1))} ${pt(mountainPoint(p, -1, d0))} Q${pt(p.top)} ${pt(mountainPoint(p, 1, d0))} Q${pt(slopeControl(p, 1, d0, 1))} ${pt(mountainPoint(p, 1, 1))} Z`
}

function shadePath(p: MountainShape): string {
  const d0 = tipDepth(p)
  const r0 = mountainPoint(p, 1, d0)
  const half: Point = [(p.top[0] + r0[0]) / 2, (p.top[1] + r0[1]) / 2]
  return `M${pt(apex(p))} ${ridgeOf(p)} L${pt(mountainPoint(p, 1, 1))} Q${pt(slopeControl(p, 1, d0, 1))} ${pt(r0)} Q${pt(half)} ${pt(apex(p))} Z`
}

/** てっぺん の 雪。line は 雪 の ふち の 高さ */
function Snow({ p, line }: { readonly p: MountainShape; readonly line: number }) {
  const d0 = tipDepth(p)
  const ds = Math.min(0.9, Math.max(d0 * 2, (line - p.top[1]) / (p.foot - p.top[1])))
  const y = p.top[1] + (p.foot - p.top[1]) * ds
  const l = mountainPoint(p, -1, ds)
  const r = mountainPoint(p, 1, ds)
  const l0 = mountainPoint(p, -1, d0)
  const r0 = mountainPoint(p, 1, d0)
  const drop = (r[0] - l[0]) * 0.1
  const ridge: Point = [ridgeX(p, y), y + drop * 0.2]
  const mid: Point = [(ridge[0] + l[0]) / 2, y + drop * 0.25]
  const dripR: Point = [(r[0] + ridge[0]) / 2, y + drop]
  const edge = `Q${pt(dripR)} ${pt(ridge)} Q${pt([(ridge[0] + mid[0]) / 2, y + drop * 1.2])} ${pt(mid)} Q${pt([(mid[0] + l[0]) / 2, y + drop * 0.9])} ${pt(l)}`
  const cap = `M${pt(l)} Q${pt(slopeControl(p, -1, d0, ds))} ${pt(l0)} Q${pt(p.top)} ${pt(r0)} Q${pt(slopeControl(p, 1, d0, ds))} ${pt(r)} ${edge} Z`
  const half: Point = [(p.top[0] + r0[0]) / 2, (p.top[1] + r0[1]) / 2]
  const shadeD = `M${pt(apex(p))} L${pt(ridge)} Q${pt(dripR)} ${pt(r)} Q${pt(slopeControl(p, 1, d0, ds))} ${pt(r0)} Q${pt(half)} ${pt(apex(p))} Z`
  return (
    <>
      <path d={cap} fill={PALETTE.snow} />
      <path d={shadeD} fill={PALETTE.snowShade} />
    </>
  )
}

/** 山 ひとつ。children は 山 と いっしょ に せりあがる もの(山小屋 など) */
export function Mountain({ shape, rise = 1, shake = 0, far = false, lit, shade, snow, children }: { readonly shape: MountainShape; readonly rise?: number; readonly shake?: number; readonly far?: boolean; readonly lit?: string; readonly shade?: string; readonly snow?: number; readonly children?: ReactNode }) {
  if (rise <= 0) return null
  return (
    <Layer x={shake} y={(1 - rise) * (shape.foot - shape.top[1])}>
      <g data-part="mountain">
        <path d={outlinePath(shape)} fill={lit ?? (far ? PALETTE.mountainFar : PALETTE.mountain)} />
        <path d={shadePath(shape)} fill={shade ?? (far ? PALETTE.mountainFarShade : PALETTE.mountainShade)} />
        {snow !== undefined && <Snow p={shape} line={snow} />}
        {children}
      </g>
    </Layer>
  )
}
