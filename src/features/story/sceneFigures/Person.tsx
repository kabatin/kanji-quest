import type { ReactNode } from 'react'
import { personRig, type BodySide, type LimbJoints, type Placement, type Point, type Proportions } from './body'
import { Head, type Expression } from './head'
import { DEFAULT_LOOK, type BottomKind, type Look } from './looks'
import { shade } from './palette'

/**
 * 人。場面に 出てくる 人は、かならず これで描く(体の つくり の まちがいを 部品の中で ふせぐため)。
 *
 *   <Person x={40} y={96} facing="right" pose={{ rightArm: { to: [60, 50] } }} face="smile" look={LOOKS.girl} />
 *
 * 描く じゅんばん は 部品が きめる(使う人は 気にしなくてよい):
 *   横むき … むこうの うで → むこうの 足 → てまえの 足 → くび → どう → あたま → てまえの うで
 *   正面   … 足 → くび → どう → あたま → うで
 * むこうがわ の 手足 は 少し こい色 に して、体の おく に あると わかるように する。
 */

export type PersonProps = Placement & {
  readonly look?: Look
  readonly face?: Expression
  /** 正面の 目線(-1 = 画面の左 〜 1 = 右) */
  readonly gaze?: number
  /** 足もと の かげ(ふつうは 出す) */
  readonly shadow?: boolean
  readonly opacity?: number
  /**
   * あたまに つける もの(ぼうし・はねた かみ など)。あたまの まんなか が 0,0、半径 1 の 座標で描く
   * (横むき は 右むき の 形で。あたま と いっしょに かたむき、左むき なら はんてん する)
   */
  readonly headwear?: ReactNode
}

const LINE = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const
const r2 = (n: number) => Math.round(n * 100) / 100
const pt = (p: Point) => `${r2(p[0])} ${r2(p[1])}`
const lerp = (a: Point, b: Point, k: number): Point => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
const limbPath = (j: LimbJoints) => `M${pt(j.root)} L${pt(j.mid)} L${pt(j.end)}`
const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi)

type Paint = { readonly cloth: string; readonly skin: string; readonly shoe: string }

/** うで: かた → ひじ → 手 */
function Arm({ j, body, paint, sleeves, part }: { readonly j: LimbJoints; readonly body: Proportions; readonly paint: Paint; readonly sleeves: 'long' | 'short'; readonly part: string }) {
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

/** あし: こし → ひざ → くるぶし と くつ。横むき の くつ は つまさき が まえ */
function Leg({ j, body, paint, kind, side, outward, part }: { readonly j: LimbJoints; readonly body: Proportions; readonly paint: Paint; readonly kind: BottomKind; readonly side: boolean; readonly outward: number; readonly part: string }) {
  // かかと で ついた ときは つまさき が 上がり、けりだす ときは かかと が 上がる
  const tilt = side ? clamp(-(j.swing - j.bend) * 0.3, -18, 14) : 0
  const ry = body.footH * 0.8
  const shoeX = side ? body.footL * 0.3 : outward * body.footL * 0.25
  return (
    <g data-part={part}>
      <path d={limbPath(j)} stroke={kind === 'pants' ? paint.cloth : paint.skin} strokeWidth={kind === 'pants' ? body.legW : body.legW * 0.86} {...LINE} />
      {kind === 'shorts' && <path d={`M${pt(j.root)} L${pt(lerp(j.root, j.mid, 0.55))}`} stroke={paint.cloth} strokeWidth={body.legW * 1.1} {...LINE} />}
      <ellipse cx={r2(j.end[0] + shoeX)} cy={r2(j.end[1] + body.footH - ry)} rx={side ? body.footL : body.footL * 0.8} ry={ry} fill={paint.shoe} transform={`rotate(${r2(tilt)} ${pt(j.end)})`} />
    </g>
  )
}

/**
 * スカート・ワンピース の すそ。こし から、もも に そって ももの なかほど まで ひろがる
 * (すわって ももが まえを むくと、すそ も まえを むく)。
 */
function Skirt({ width, body, color, tilt, thighs }: { readonly width: number; readonly body: Proportions; readonly color: string; readonly tilt: number; readonly thighs: readonly LimbJoints[] }) {
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

/** どう(と くび)。こし を じく に かたむく */
function Torso({ body, look, front, tilt }: { readonly body: Proportions; readonly look: Required<Look>; readonly front: boolean; readonly tilt: number }) {
  const width = front ? body.torsoFrontW : body.torsoW
  const skirt = look.bottomKind === 'skirt' || look.bottomKind === 'dress'
  const hemLine = shade(look.top, 0.15)
  return (
    <g transform={`rotate(${r2(tilt)})`} data-part="torso">
      {/* くび は みじかく、どう の 上の まんなか から(あたま と どう に かくれて、すきま だけ 見える) */}
      <rect x={-body.neckW / 2} y={-body.torso - body.neck - 3} width={body.neckW} height={body.neck + 7} rx={body.neckW / 2} fill={shade(look.skin, 0.08)} />
      <rect x={-width / 2} y={-body.torso} width={width} height={body.torso + 4} rx={width * (front ? 0.3 : 0.46)} fill={look.top} />
      {front && <path d={`M-3.4 ${-body.torso + 0.6} Q0 ${-body.torso + 4} 3.4 ${-body.torso + 0.6}`} stroke={hemLine} strokeWidth="1.6" {...LINE} />}
      {!skirt && <path d={`M${-width / 2 + 2.4} -7 h${width - 4.8}`} stroke={hemLine} strokeWidth="1.8" {...LINE} />}
    </g>
  )
}

export function Person({ look, face = 'normal', gaze = 0, shadow = true, opacity = 1, headwear, ...placement }: PersonProps) {
  if (opacity <= 0) return null
  const rig = personRig(placement)
  const l: Required<Look> = { ...DEFAULT_LOOK, ...look }
  const { body, local, view, world } = rig
  const tilt = placement.pose?.torso ?? 0
  const front = view === 'front'
  const near = rig.near ?? 'left'
  const far: BodySide = near === 'left' ? 'right' : 'left'
  // てまえ の そで は どう より 少し こく(どう の まえ に あると わかる)、むこう は もっと こく
  const nearPaint: Paint = { cloth: shade(l.top, front ? 0.1 : 0.12), skin: l.skin, shoe: l.shoes }
  const farPaint: Paint = { cloth: shade(l.top, 0.32), skin: shade(l.skin, 0.1), shoe: shade(l.shoes, 0.15) }
  const legPaint = (isFar: boolean): Paint => ({ cloth: isFar ? shade(l.bottom, 0.18) : l.bottom, skin: isFar ? shade(l.skin, 0.1) : l.skin, shoe: isFar ? farPaint.shoe : l.shoes })
  const skirt =
    l.bottomKind === 'skirt' || l.bottomKind === 'dress' ? (
      <Skirt width={front ? body.torsoFrontW : body.torsoW} body={body} color={l.bottomKind === 'dress' ? l.top : l.bottom} tilt={tilt} thighs={[local.legs.left, local.legs.right]} />
    ) : null
  const head = (
    <g transform={`translate(${pt(local.head)}) rotate(${r2(tilt + (placement.pose?.head ?? 0))}) scale(${body.headR})`} data-part="head">
      <Head view={view} face={face} hairStyle={l.hairStyle} hair={l.hair} skin={l.skin} accent={l.accent} gaze={gaze} />
      {headwear}
    </g>
  )
  // かげ: 足もと の 地面に。ジャンプ すると うすく なる
  const feet = [world.legs.left.end[0], world.legs.right.end[0]]
  const lift = placement.lift ?? 0
  const shadowOpacity = 0.12 * (1 - clamp(lift / (20 * rig.scale), 0, 0.7))
  return (
    <g opacity={opacity}>
      {shadow && <ellipse cx={r2((feet[0] + feet[1]) / 2)} cy={r2(placement.y + 0.3)} rx={r2(Math.abs(feet[0] - feet[1]) / 2 + 9.5 * rig.scale)} ry={r2(2.8 * rig.scale)} fill="#000000" opacity={r2(shadowOpacity)} />}
      <g transform={rig.transform}>
        {front ? (
          <>
            <Leg j={local.legs.right} body={body} paint={legPaint(false)} kind={l.bottomKind} side={false} outward={-1} part="leg-right" />
            <Leg j={local.legs.left} body={body} paint={legPaint(false)} kind={l.bottomKind} side={false} outward={1} part="leg-left" />
            <Torso body={body} look={l} front tilt={tilt} />
            {skirt}
            {head}
            <Arm j={local.arms.right} body={body} paint={nearPaint} sleeves={l.sleeves} part="arm-right" />
            <Arm j={local.arms.left} body={body} paint={nearPaint} sleeves={l.sleeves} part="arm-left" />
          </>
        ) : (
          <>
            <Arm j={local.arms[far]} body={body} paint={farPaint} sleeves={l.sleeves} part="arm-far" />
            <Leg j={local.legs[far]} body={body} paint={legPaint(true)} kind={l.bottomKind} side outward={1} part="leg-far" />
            <Leg j={local.legs[near]} body={body} paint={legPaint(false)} kind={l.bottomKind} side outward={1} part="leg-near" />
            <Torso body={body} look={l} front={false} tilt={tilt} />
            {skirt}
            {head}
            <Arm j={local.arms[near]} body={body} paint={nearPaint} sleeves={l.sleeves} part="arm-near" />
          </>
        )}
      </g>
    </g>
  )
}
