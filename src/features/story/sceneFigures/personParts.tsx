import type { LimbJoints, Point, Proportions, View } from './body'
import type { BottomKind, Look } from './looks'
import { mixColor, shade } from './palette'

/**
 * 人の 体の 部分(うで・あし・どう・スカート)。Person.tsx が 体の中の 座標(local)で ならべて描く。
 * どれも 関節の 場所(LimbJoints)を つなぐ だけで、ほね の 長さ や まがり は body.ts が きめる。
 */

const LINE = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const
const r2 = (n: number) => Math.round(n * 100) / 100
const pt = (p: Point) => `${r2(p[0])} ${r2(p[1])}`
const lerp = (a: Point, b: Point, k: number): Point => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
const limbPath = (j: LimbJoints) => `M${pt(j.root)} L${pt(j.mid)} L${pt(j.end)}`
const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi)

export type Paint = { readonly cloth: string; readonly skin: string; readonly shoe: string }

/** うで: かた → ひじ → 手 */
export function Arm({ j, body, paint, sleeves, part }: { readonly j: LimbJoints; readonly body: Proportions; readonly paint: Paint; readonly sleeves: 'long' | 'short'; readonly part: string }) {
  return (
    <g data-part={part}>
      {sleeves === 'short' ? (
        <>
          <path d={limbPath(j)} stroke={paint.skin} strokeWidth={body.armW * 0.84} {...LINE} />
          <path d={`M${pt(j.root)} L${pt(lerp(j.root, j.mid, 0.6))}`} stroke={paint.cloth} strokeWidth={body.armW * 1.12} {...LINE} />
        </>
      ) : (
        <path d={limbPath(j)} stroke={paint.cloth} strokeWidth={body.armW} {...LINE} />
      )}
      <circle cx={r2(j.end[0])} cy={r2(j.end[1])} r={body.handR} fill={paint.skin} />
    </g>
  )
}

type LegProps = {
  readonly j: LimbJoints
  readonly body: Proportions
  readonly paint: Paint
  readonly kind: BottomKind
  readonly view: View
  /** 正面・うしろむき: つまさき が 外へ ひらく むき(体の中の 座標で -1 / 1) */
  readonly outward: number
  /** 正面・うしろむき: すね が 見る人から とおざかる(足が ひざ より おく)。くつ を あし の うしろに 描く */
  readonly footBehind?: boolean
  /** 正面・うしろむき: ひざ が 見る人の ほうへ 出ている。ひざ がしら を 少し あかるく まるく 描く */
  readonly knee?: boolean
  readonly part: string
}

/** あし: こし → ひざ → くるぶし と くつ。横むき の くつ は つまさき が まえ、うしろむき は かかと が 見える */
export function Leg({ j, body, paint, kind, view, outward, footBehind = false, knee = false, part }: LegProps) {
  const side = view === 'side'
  // かかと で ついた ときは つまさき が 上がり、けりだす ときは かかと が 上がる
  const tilt = side ? clamp(-(j.swing - j.bend) * 0.3, -18, 14) : 0
  const ry = body.footH * 0.8
  const shoeX = side ? body.footL * 0.3 : outward * body.footL * (view === 'back' ? 0.15 : 0.25)
  const rx = side ? body.footL : body.footL * (view === 'back' ? 0.72 : 0.8)
  const shoe = <ellipse cx={r2(j.end[0] + shoeX)} cy={r2(j.end[1] + body.footH - ry)} rx={rx} ry={ry} fill={paint.shoe} transform={`rotate(${r2(tilt)} ${pt(j.end)})`} />
  return (
    <g data-part={part}>
      {footBehind && shoe}
      <path d={limbPath(j)} stroke={kind === 'pants' ? paint.cloth : paint.skin} strokeWidth={kind === 'pants' ? body.legW : body.legW * 0.86} {...LINE} />
      {kind === 'shorts' && <path d={`M${pt(j.root)} L${pt(lerp(j.root, j.mid, 0.55))}`} stroke={paint.cloth} strokeWidth={body.legW * 1.1} {...LINE} />}
      {knee && <circle cx={r2(j.mid[0])} cy={r2(j.mid[1])} r={r2(body.legW * 0.56)} fill={mixColor(kind === 'pants' ? paint.cloth : paint.skin, '#ffffff', 0.14)} />}
      {!footBehind && shoe}
    </g>
  )
}

/**
 * スカート・ワンピース の すそ。こし から、もも に そって ももの なかほど まで ひろがる
 * (すわって ももが まえを むくと、すそ も まえを むく)。
 */
export function Skirt({ width, body, color, tilt, thighs }: { readonly width: number; readonly body: Proportions; readonly color: string; readonly tilt: number; readonly thighs: readonly LimbJoints[] }) {
  const [a, b] = thighs
  // ももの むき(2本の まんなか)
  const dx = (a.mid[0] - a.root[0] + b.mid[0] - b.root[0]) / 2
  const dy = (a.mid[1] - a.root[1] + b.mid[1] - b.root[1]) / 2
  const len = Math.hypot(dx, dy) || 1
  const [ux, uy] = [dx / len, dy / len]
  const hem: Point = [ux * body.thigh * 0.6, uy * body.thigh * 0.6]
  // 立てば すそ は 前後に ひろがり、すわれば もも を うすく つつむ
  const half = width / 2 + 4 + (body.legW * 0.8 - width / 2 - 4) * Math.abs(ux)
  const waist = (x: number): Point => {
    const c = Math.cos((tilt * Math.PI) / 180)
    const s = Math.sin((tilt * Math.PI) / 180)
    return [x * c + 9 * s, x * s - 9 * c]
  }
  const front: Point = [hem[0] + uy * half, hem[1] - ux * half]
  const back: Point = [hem[0] - uy * half, hem[1] + ux * half]
  const sag: Point = [hem[0] + ux * 2.6, hem[1] + uy * 2.6]
  // おしり: すわると ここが 下に くる(立っているときは うしろの へり の とちゅう で、形を かえない)
  const backEdge = lerp(waist(-width / 2), back, 0.5)
  const seat = lerp(backEdge, [-width / 2 - 0.5, body.legW * 0.6], Math.abs(ux))
  return <path d={`M${pt(waist(-width / 2))} L${pt(waist(width / 2))} L${pt(front)} Q${pt(sag)} ${pt(back)} L${pt(seat)} Z`} fill={color} />
}

/** どう(と くび)。こし を じく に かたむく。えりぐち は 正面 だけ(うしろむき は せなか) */
export function Torso({ body, look, view, tilt }: { readonly body: Proportions; readonly look: Required<Look>; readonly view: View; readonly tilt: number }) {
  const frontal = view !== 'side'
  const width = frontal ? body.torsoFrontW : body.torsoW
  const skirt = look.bottomKind === 'skirt' || look.bottomKind === 'dress'
  const hemLine = shade(look.top, 0.15)
  return (
    <g transform={`rotate(${r2(tilt)})`} data-part="torso">
      {/* くび は みじかく、どう の 上の まんなか から(あたま と どう に かくれて、すきま だけ 見える) */}
      <rect x={-body.neckW / 2} y={-body.torso - body.neck - 3} width={body.neckW} height={body.neck + 7} rx={body.neckW / 2} fill={shade(look.skin, 0.08)} />
      <rect x={-width / 2} y={-body.torso} width={width} height={body.torso + 4} rx={width * (frontal ? 0.3 : 0.46)} fill={look.top} />
      {view === 'front' && <path d={`M-3.4 ${-body.torso + 0.6} Q0 ${-body.torso + 4} 3.4 ${-body.torso + 0.6}`} stroke={hemLine} strokeWidth="1.6" {...LINE} />}
      {!skirt && <path d={`M${-width / 2 + 2.4} -7 h${width - 4.8}`} stroke={hemLine} strokeWidth="1.8" {...LINE} />}
    </g>
  )
}
