import type { Point } from './limbs'
import { PALETTE, shade } from './palette'
import { TOOL_SIZE, type ToolKind } from './toolSize'

/**
 * 手に もつ 細い 道具(ふで・えんぴつ・ぼう)。
 *
 * 人に もたせる ときは <Person tools={{ right: { kind: 'brush', tip: [x, y] } }} /> と わたす。
 * 道具 は その うで と いっしょ に 描かれ(うで が 体の おく なら 道具 も おく)、にぎった 手 の 中を 通る:
 *   道具 → 手(まるい こぶし)→ おや指 の じゅん に かさねる ので、こぶし から 先 と おしり が 出て 見える。
 * tip(画面の 点)を わたすと 先 が そこ に とどき、おしり は 手 の うしろ へ 出る。
 * tip の かわりに angle(画面の 角度。0 = 右、90 = 下)と length(画面の 長さ)でも よい。
 * 机 に おく ときなど、手 に もたない 道具 は <Tool kind="brush" end={[x, y]} tip={[x, y]} width={1.3} />。
 */

const BAMBOO = '#d9b77a'
const SUMI = '#2b2b2b'
const PENCIL = '#f4c542'
const WOOD = '#f2d3a2'
const LEAD = '#3a3a3a'
const ERASER = '#f29bb0'
const BAND = '#c9cdd4'

const r2 = (n: number) => Math.round(n * 100) / 100
const at = (a: Point, b: Point, k: number): Point => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
const xy = (p: Point) => `${r2(p[0])} ${r2(p[1])}`
const seg = (a: Point, b: Point, color: string, width: number, cap: 'round' | 'butt' = 'round') => <path d={`M${xy(a)} L${xy(b)}`} stroke={color} strokeWidth={r2(width)} strokeLinecap={cap} />

/** 道具 の 絵。end(おしり)から tip(先)へ。width は 太さ(座標 の 単位。手 に もつ ときは 体の中 の 単位) */
export function Tool({ kind, end, tip, width, ink = SUMI }: { readonly kind: ToolKind; readonly end: Point; readonly tip: Point; readonly width?: number; readonly ink?: string }) {
  const w = width ?? TOOL_SIZE[kind].width * 0.5
  if (kind === 'brush') {
    // え(たけ)と、先 が すぼまった 毛
    const neck = at(end, tip, 0.7)
    const dx = tip[0] - neck[0]
    const dy = tip[1] - neck[1]
    const len = Math.hypot(dx, dy) || 1
    const n: Point = [(-dy / len) * w * 0.6, (dx / len) * w * 0.6]
    return (
      <g data-part="tool">
        {seg(end, neck, BAMBOO, w)}
        <path d={`M${xy([neck[0] + n[0], neck[1] + n[1]])} Q${xy([neck[0] + n[0] * 1.2 + dx * 0.5, neck[1] + n[1] * 1.2 + dy * 0.5])} ${xy(tip)} Q${xy([neck[0] - n[0] * 1.2 + dx * 0.5, neck[1] - n[1] * 1.2 + dy * 0.5])} ${xy([neck[0] - n[0], neck[1] - n[1]])} Z`} fill={ink} />
      </g>
    )
  }
  if (kind === 'pencil') {
    // けしゴム → 金具 → じく(黄色)→ けずった 木 → しん
    return (
      <g data-part="tool">
        {seg(end, at(end, tip, 0.1), ERASER, w)}
        {seg(at(end, tip, 0.08), at(end, tip, 0.14), BAND, w, 'butt')}
        {seg(at(end, tip, 0.14), at(end, tip, 0.8), PENCIL, w, 'butt')}
        {seg(at(end, tip, 0.8), at(end, tip, 0.93), WOOD, w * 0.7)}
        {seg(at(end, tip, 0.92), tip, LEAD, w * 0.35)}
      </g>
    )
  }
  return (
    <g data-part="tool">
      {seg(end, tip, PALETTE.bark, w)}
      {seg(at(end, tip, 0.02), at(end, tip, 0.5), shade(PALETTE.bark, 0.15), w * 0.35)}
    </g>
  )
}
