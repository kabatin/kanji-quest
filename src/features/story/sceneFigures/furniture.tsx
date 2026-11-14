import { personRig, type Placement, type Point } from './body'
import { mixColor, PALETTE, shade } from './palette'

/**
 * いす・つくえ・こくばん。
 *
 * いす は、すわる 人 と 同じ props を わたす と、その人の 体に 合わせて 置かれる(高さ・おく行き・せもたれ の 場所):
 *   const kid = { x: 40, y: 96, facing: 'right', pose: posture('sitChair', 'right') } as const
 *   <Chair {...kid} />
 *   <Person {...kid} />
 *   <Chair {...kid} layer="front" />   // うしろむき の とき、せもたれ は 人の てまえ(ほかの 向き では 何も 描かない)
 */

const r2 = (n: number) => Math.round(n * 100) / 100
const pt = (p: Point) => `${r2(p[0])} ${r2(p[1])}`

type ChairProps = Placement & {
  /** 'back' は いす の ぜんぶ(人の うしろ)。'front' は 人の てまえ に 来る ところ(うしろむき の せもたれ)だけ */
  readonly layer?: 'back' | 'front'
  readonly color?: string
}

/** すわる 人の 体 から、いす の 形を きめる(画面の 座標) */
function chairShape(placement: Placement) {
  const rig = personRig(placement)
  const { body, scale, world } = rig
  const pelvis = world.pelvis
  const knee = world.legs.left.mid
  const seat = pelvis[1] + (body.legW / 2) * scale
  return { rig, body, scale, pelvis, knee, seat }
}

/** 横から 見た いす: ざめん・あし 2本・せもたれ(せなか の うしろ) */
function SideChair({ placement, color }: { readonly placement: Placement; readonly color: string }) {
  const { body, scale, pelvis, knee, seat } = chairShape(placement)
  const ahead = placement.facing === 'left' ? -1 : 1
  const back = pelvis[0] - ahead * (body.torsoW / 2 + 1.2) * scale
  const front = knee[0] - ahead * 1.2 * scale
  const thick = Math.max(1.1, 4 * scale)
  const leg = Math.max(1, 3 * scale)
  const top = seat - body.torso * 0.62 * scale
  const ground = placement.y
  const dark = shade(color, 0.22)
  return (
    <g data-part="chair">
      {/* せもたれ の はしら と いた */}
      <path d={`M${r2(back)} ${r2(ground)} V${r2(top)}`} stroke={dark} strokeWidth={r2(leg)} strokeLinecap="round" />
      <rect x={r2(Math.min(back, back + ahead * leg * 1.4) - leg * 0.2)} y={r2(top)} width={r2(leg * 1.6)} height={r2((seat - top) * 0.55)} rx={r2(leg * 0.5)} fill={color} />
      {/* まえの あし */}
      <path d={`M${r2(front)} ${r2(seat)} V${r2(ground)}`} stroke={dark} strokeWidth={r2(leg)} strokeLinecap="round" />
      <rect x={r2(Math.min(back, front) - leg * 0.5)} y={r2(seat)} width={r2(Math.abs(front - back) + leg)} height={r2(thick)} rx={r2(thick * 0.4)} fill={color} />
    </g>
  )
}

/** 正面・うしろ から 見た いす。ざめん は 上の 面 が 少し 見え、せもたれ は せなか の うしろ(正面)か てまえ(うしろむき) */
function FrontalChair({ placement, color, layer }: { readonly placement: Placement; readonly color: string; readonly layer: 'back' | 'front' }) {
  const { rig, body, scale, pelvis, knee, seat } = chairShape(placement)
  const facingBack = rig.view === 'back'
  const half = (body.torsoFrontW / 2 + 2) * scale
  const leg = Math.max(1, 3 * scale)
  const ground = placement.y
  const dark = shade(color, 0.22)
  // ざめん の おく と てまえ の へり(画面の 上下)。正面 は ひざ の がわ が てまえ
  const kneeSeat = knee[1] + (body.legW / 2) * scale
  const near = Math.max(seat, kneeSeat)
  const far = Math.min(seat, kneeSeat)
  const thick = Math.max(1.1, 4 * scale)
  // てまえ の あし は 地面 まで、おく の あし は おくゆき の ぶん 上 で 地面に つく
  const farGround = ground - (near - far)
  const nearGround = facingBack ? ground + (near - far) * 0.15 : ground
  const backrest = { x: pelvis[0] - half * 0.9, y: seat - body.torso * 0.62 * scale, w: half * 1.8, h: body.torso * 0.5 * scale }
  if (layer === 'front') {
    if (!facingBack) return null
    return (
      <g data-part="chair-front">
        <path d={`M${r2(backrest.x + leg * 0.4)} ${r2(near)} V${r2(backrest.y + 1)} M${r2(backrest.x + backrest.w - leg * 0.4)} ${r2(near)} V${r2(backrest.y + 1)}`} stroke={dark} strokeWidth={r2(leg)} strokeLinecap="round" />
        <rect x={r2(backrest.x)} y={r2(backrest.y)} width={r2(backrest.w)} height={r2(backrest.h)} rx={r2(leg)} fill={color} />
      </g>
    )
  }
  const x0 = pelvis[0] - half
  const x1 = pelvis[0] + half
  return (
    <g data-part="chair">
      {!facingBack && (
        <>
          <path d={`M${r2(backrest.x + leg * 0.4)} ${r2(far)} V${r2(backrest.y + 1)} M${r2(backrest.x + backrest.w - leg * 0.4)} ${r2(far)} V${r2(backrest.y + 1)}`} stroke={dark} strokeWidth={r2(leg)} strokeLinecap="round" />
          <rect x={r2(backrest.x)} y={r2(backrest.y)} width={r2(backrest.w)} height={r2(backrest.h)} rx={r2(leg)} fill={color} />
        </>
      )}
      {/* おく の あし → ざめん の 上の 面 → てまえ の へり と あし */}
      <path d={`M${r2(x0 + leg)} ${r2(far)} V${r2(farGround)} M${r2(x1 - leg)} ${r2(far)} V${r2(farGround)}`} stroke={shade(color, 0.35)} strokeWidth={r2(leg)} strokeLinecap="round" />
      <path d={`M${pt([x0 + 0.6, far])} H${r2(x1 - 0.6)} L${r2(x1)} ${r2(near)} H${r2(x0)} Z`} fill={mixColor(color, '#ffffff', 0.12)} />
      <rect x={r2(x0)} y={r2(near)} width={r2(x1 - x0)} height={r2(thick)} rx={r2(thick * 0.4)} fill={dark} />
      <path d={`M${r2(x0 + leg * 0.6)} ${r2(near + thick)} V${r2(nearGround)} M${r2(x1 - leg * 0.6)} ${r2(near + thick)} V${r2(nearGround)}`} stroke={dark} strokeWidth={r2(leg)} strokeLinecap="round" />
    </g>
  )
}

/** いす。すわる 人 と 同じ props を わたす(上の 説明) */
export function Chair({ layer = 'back', color = PALETTE.furniture, ...placement }: ChairProps) {
  const facing = placement.facing ?? 'right'
  if (facing === 'front' || facing === 'back') return <FrontalChair placement={placement} color={color} layer={layer} />
  return layer === 'back' ? <SideChair placement={placement} color={color} /> : null
}

/**
 * つくえ・テーブル。x は まんなか、y は 地面、height は 上の 面 の 高さ(地面 から。deskHeight で 人に 合わせる)。
 * top は 上の 面 が 見える あつみ(正面・うしろ から 見る ときは 3 くらい、横から は 0)。
 */
export function Desk({ x, y, width = 26, height = 16, top = 0, color = PALETTE.furnitureLight }: { readonly x: number; readonly y: number; readonly width?: number; readonly height?: number; readonly top?: number; readonly color?: string }) {
  const surface = y - height
  const thick = 1.8
  const leg = 1.7
  const dark = shade(color, 0.25)
  return (
    <g data-part="desk">
      <path d={`M${r2(x - width / 2 + 2)} ${r2(surface)} V${y} M${r2(x + width / 2 - 2)} ${r2(surface)} V${y}`} stroke={dark} strokeWidth={leg} strokeLinecap="round" />
      {top > 0 && <path d={`M${r2(x - width / 2 + 1.4)} ${r2(surface - top)} H${r2(x + width / 2 - 1.4)} L${r2(x + width / 2)} ${r2(surface)} H${r2(x - width / 2)} Z`} fill={mixColor(color, '#ffffff', 0.12)} />}
      <rect x={r2(x - width / 2)} y={r2(surface)} width={width} height={thick} rx="0.8" fill={top > 0 ? dark : color} />
      {top === 0 && <path d={`M${r2(x - width / 2 + 0.8)} ${r2(surface + thick)} H${r2(x + width / 2 - 0.8)}`} stroke={dark} strokeWidth="0.7" />}
    </g>
  )
}

/** こくばん。x, y は 左上、lines は チョーク で 書いた すじ の 数(0〜) */
export function Blackboard({ x, y, width = 40, height = 22, lines = 0 }: { readonly x: number; readonly y: number; readonly width?: number; readonly height?: number; readonly lines?: number }) {
  const frame = 1.6
  return (
    <g data-part="blackboard">
      <rect x={r2(x - frame)} y={r2(y - frame)} width={r2(width + frame * 2)} height={r2(height + frame * 2)} rx="1" fill={PALETTE.furniture} />
      <rect x={x} y={y} width={width} height={height} fill={PALETTE.blackboard} />
      {/* チョーク を おく たな */}
      <rect x={r2(x - frame)} y={r2(y + height + frame - 0.4)} width={r2(width + frame * 2)} height="1.6" rx="0.6" fill={PALETTE.furnitureDark} />
      <rect x={r2(x + width * 0.7)} y={r2(y + height + frame - 1.2)} width="3" height="0.9" rx="0.4" fill={PALETTE.chalk} />
      <g stroke={PALETTE.chalk} strokeWidth="0.7" strokeLinecap="round" opacity="0.85" fill="none">
        {Array.from({ length: Math.max(0, Math.min(lines, Math.floor((height - 4) / 4))) }, (_, i) => (
          <path key={i} d={`M${r2(x + 3)} ${r2(y + 4 + i * 4)} q${r2(width * 0.15)} -1 ${r2(width * 0.3)} 0 t${r2(width * (0.2 + ((i * 7) % 3) * 0.08))} 0`} />
        ))}
      </g>
    </g>
  )
}
