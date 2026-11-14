import { Fragment, type ReactNode } from 'react'
import { personRig, type BodySide, type LimbJoints, type Placement, type Rig } from './body'
import { Head, type Expression } from './head'
import { DEFAULT_LOOK, type Look } from './looks'
import { Pack } from './pack'
import { PACK_COLORS, packDepth, type PackKind, type PackSpec } from './packSize'
import { shade } from './palette'
import { Arm, Leg, Skirt, Torso, type HeldTool, type Paint } from './personParts'
import { toolEnds, type ToolSpec } from './toolSize'

/**
 * 人。場面に 出てくる 人は、かならず これで描く(体の つくり の まちがいを 部品の中で ふせぐため)。
 *
 *   <Person x={40} y={96} facing="right" pose={{ rightArm: { to: [60, 50] } }} face="smile" look={LOOKS.girl} />
 *
 * 描く じゅんばん は 部品が きめる(使う人は 気にしなくてよい):
 *   横むき   … むこうの うで → むこうの 足 → てまえの 足 → くび → どう →(かばん)→ あたま →(もつ物)→ てまえの うで
 *   正面     … 足 → くび → どう →(かばん の ひも)→ あたま →(もつ物)→ うで
 *   うしろむき … (もつ物)→ 体の まえ(おく)へ のばした うで → 足 → くび → どう → あたま → うで →(かばん → かばん より てまえ の うで)
 * 正面・うしろむき では、まえうしろ の 角度(fore)で 見る人に 近い 手足 ほど あとに描く:
 *   正面 で うしろへ ふった うで、うしろむき で 体の まえ へ のばした うで(手が 体の 内がわ に 来た うで も)は どう の おく。
 *   すわって もも が 見る人の ほうへ 出た あし は どう の てまえ。
 * むこうがわ の 手足 は 少し こい色 に して、体の おく に あると わかるように する。
 */

export type PersonProps = Placement & {
  readonly look?: Look
  readonly face?: Expression
  /** 正面の 目線(-1 = 画面の左 〜 1 = 右) */
  readonly gaze?: number
  /** 目線 の 上下(-1 = 上 〜 1 = 下)。下を 見ると まぶた が 少し さがる */
  readonly gazeY?: number
  /** 足もと の かげ(ふつうは 出す) */
  readonly shadow?: boolean
  readonly opacity?: number
  /**
   * あたまに つける もの(ぼうし・はねた かみ など)。あたまの まんなか が 0,0、半径 1 の 座標で描く
   * (横むき は 右むき の 形で。あたま と いっしょに かたむき、左むき なら はんてん する)
   */
  readonly headwear?: ReactNode
  /**
   * 手に もつ 物(画面の 座標で描く)。体 と てまえの うで の あいだ に はさんで描く ので、
   * てまえの 手 が 物の まえ に、むこうの 手 は 物の おく に なる(うしろむき では 体の おく)。
   */
  readonly held?: ReactNode
  /** せおう かばん('randoseru' | 'rucksack'、色を かえる なら { kind, color })。pack.tsx */
  readonly pack?: PackKind | PackSpec
  /** 手に にぎる 細い 道具(ふで・えんぴつ・ぼう)。体の 左右 ごとに。tools.tsx */
  readonly tools?: Partial<Record<BodySide, ToolSpec>>
  /** ポニーテール・ふたつむすび の ゆれ(度)。はしる・ふりむく ときに wave で ゆらす */
  readonly hairSway?: number
}

const r2 = (n: number) => Math.round(n * 100) / 100
const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi)

type Part = { readonly key: string; readonly node: ReactNode } | { readonly key: 'held'; readonly held: true }

/** かばん・道具(なければ いままで と 同じ 絵) */
type Gear = { readonly pack: { readonly node: ReactNode; readonly depth: number } | null; readonly tools: Partial<Record<BodySide, HeldTool>> }

/**
 * 正面・うしろむき: うで が どう の おく に あるか。
 * あるく ときの ふり くらい(うで の 長さ の 6わり まで)は かた の よこ に ある ものと して、どう の まえ の まま にする
 * (ふる たびに 重なり が 入れかわって ちらつかない ように)。
 */
function armBehind(rig: Rig, j: LimbJoints, toward: number): boolean {
  const gap = (rig.body.upperArm + rig.body.foreArm) * 0.6
  const z = j.depth * toward
  if (z < -gap) return true
  // 見る人の ほうへ 出た 手(うしろむき で せなか の がわ = うしろで 手を くむ など)は 見える
  if (z > 2 || rig.view !== 'back') return false
  // うしろむき で、手が かた より 体の 内がわ・下 に 来たら、体の まえ で 何かを している(せなか ごしに 見えない)
  const outward = Math.sign(j.root[0]) || 1
  return j.end[0] * outward < j.root[0] * outward - 1 && j.end[1] > j.root[1] + 2
}

/** 正面・うしろむき: ひざ が 見る人の ほうへ 大きく 出た あし(すわる・しゃがむ)は、どう の てまえ に描く */
const legInFront = (rig: Rig, j: LimbJoints, toward: number) => j.midDepth * toward > rig.body.thigh * 0.5

function frontalParts(rig: Rig, l: Required<Look>, paints: { near: Paint; far: Paint; leg: Paint }, torso: ReactNode, skirt: ReactNode, head: ReactNode, hasHeld: boolean, gear: Gear): Part[] {
  const { local, body } = rig
  const toward = rig.view === 'front' ? 1 : -1
  // 正面 は 右(画面の 左)から、うしろむき は 左(画面の 左)から。見る人に 近い 足 ほど あと
  const order: readonly BodySide[] = rig.view === 'front' ? ['right', 'left'] : ['left', 'right']
  const legs = [...order].sort((a, b) => local.legs[a].depth * toward - local.legs[b].depth * toward)
  const legPart = (side: BodySide): Part => {
    const j = local.legs[side]
    const footBehind = (j.depth - j.midDepth) * toward < -2
    // ひざ が 見る人の ほうへ 出ている(すわる・しゃがむ)ときは、ひざ がしら を まるく 見せる
    const knee = legInFront(rig, j, toward)
    return { key: `leg-${side}`, node: <Leg j={j} body={body} paint={paints.leg} kind={l.bottomKind} view={rig.view} outward={Math.sign(j.root[0]) || 1} footBehind={footBehind} knee={knee} part={`leg-${side}`} /> }
  }
  const armPart = (side: BodySide, behind: boolean): Part => ({ key: `arm-${side}`, node: <Arm j={local.arms[side]} body={body} paint={behind ? paints.far : paints.near} sleeves={l.sleeves} part={`arm-${side}`} tool={gear.tools[side]} /> })
  const behindArms = order.filter((s) => armBehind(rig, local.arms[s], toward))
  const frontArms = order.filter((s) => !behindArms.includes(s))
  const held: Part[] = hasHeld ? [{ key: 'held', held: true }] : []
  const pack = gear.pack
  // うしろむき: かばん は せなか に かさなる。かばん より 見る人 の ほうへ 出た うで だけ かばん の まえ
  const overPack = rig.view === 'back' && pack ? frontArms.filter((s) => local.arms[s].depth * toward > pack.depth) : []
  return [
    ...(rig.view === 'back' ? held : []),
    ...behindArms.map((s) => armPart(s, true)),
    ...legs.filter((s) => !legInFront(rig, local.legs[s], toward)).map(legPart),
    { key: 'torso', node: torso },
    // すわって まえへ 出た もも は どう の てまえ。スカート は その もも の 上に かかる
    ...legs.filter((s) => legInFront(rig, local.legs[s], toward)).map(legPart),
    ...(skirt ? [{ key: 'skirt', node: skirt }] : []),
    // 正面 の かたひも は どう の 上、あたま と うで の 下
    ...(rig.view === 'front' && pack ? [{ key: 'pack', node: pack.node }] : []),
    { key: 'head', node: head },
    ...(rig.view === 'front' ? held : []),
    ...frontArms.filter((s) => !overPack.includes(s)).map((s) => armPart(s, false)),
    ...(rig.view === 'back' && pack ? [{ key: 'pack', node: pack.node }] : []),
    ...overPack.map((s) => armPart(s, false)),
  ]
}

function sideParts(rig: Rig, l: Required<Look>, paints: { near: Paint; far: Paint; legFar: Paint; leg: Paint }, torso: ReactNode, skirt: ReactNode, head: ReactNode, hasHeld: boolean, gear: Gear): Part[] {
  const { local, body } = rig
  const near = rig.near ?? 'left'
  const far: BodySide = near === 'left' ? 'right' : 'left'
  return [
    { key: 'arm-far', node: <Arm j={local.arms[far]} body={body} paint={paints.far} sleeves={l.sleeves} part="arm-far" tool={gear.tools[far]} /> },
    { key: 'leg-far', node: <Leg j={local.legs[far]} body={body} paint={paints.legFar} kind={l.bottomKind} view="side" outward={1} part="leg-far" /> },
    { key: 'leg-near', node: <Leg j={local.legs[near]} body={body} paint={paints.leg} kind={l.bottomKind} view="side" outward={1} part="leg-near" /> },
    { key: 'torso', node: torso },
    ...(skirt ? [{ key: 'skirt', node: skirt }] : []),
    // かばん は せなか がわ。むこうの うで は その おく、てまえ の うで は その まえ
    ...(gear.pack ? [{ key: 'pack', node: gear.pack.node }] : []),
    { key: 'head', node: head },
    ...(hasHeld ? [{ key: 'held', held: true } as const] : []),
    { key: 'arm-near', node: <Arm j={local.arms[near]} body={body} paint={paints.near} sleeves={l.sleeves} part="arm-near" tool={gear.tools[near]} /> },
  ]
}

/** 体の 部分 を じゅんばん に ならべる。もつ物 は 画面の 座標 なので、その前後で 体の transform を 分ける */
function Layers({ parts, transform, held }: { readonly parts: readonly Part[]; readonly transform: string; readonly held: ReactNode }) {
  const at = parts.findIndex((p) => 'held' in p)
  const body = (list: readonly Part[]) => list.map((p) => ('node' in p ? <Fragment key={p.key}>{p.node}</Fragment> : null))
  if (at < 0) return <g transform={transform}>{body(parts)}</g>
  return (
    <>
      {at > 0 && <g transform={transform}>{body(parts.slice(0, at))}</g>}
      <g data-part="held">{held}</g>
      <g transform={transform}>{body(parts.slice(at + 1))}</g>
    </>
  )
}

/** かばん と 道具 を、体の中 の 座標 に そろえる */
function gearOf(rig: Rig, pack: PersonProps['pack'], tools: PersonProps['tools']): Gear {
  const spec: PackSpec | null = pack === undefined ? null : typeof pack === 'string' ? { kind: pack } : pack
  const held: Partial<Record<BodySide, HeldTool>> = Object.fromEntries(
    (['left', 'right'] as const).flatMap((side) => {
      const tool = tools?.[side]
      if (!tool) return []
      const { tip, end } = toolEnds(tool, rig.world.arms[side].end, rig.scale)
      return [[side, { kind: tool.kind, tip: rig.toLocal(tip), end: rig.toLocal(end), ink: tool.ink }]]
    }),
  )
  if (!spec) return { pack: null, tools: held }
  const node = <Pack kind={spec.kind} color={spec.color ?? PACK_COLORS[spec.kind]} body={rig.body} view={rig.view} tilt={rig.tilt.torso} />
  return { pack: { node, depth: packDepth(spec.kind, rig.body) }, tools: held }
}

export function Person({ look, face = 'normal', gaze = 0, gazeY, shadow = true, opacity = 1, headwear, held, pack, tools, hairSway, ...placement }: PersonProps) {
  if (opacity <= 0) return null
  const rig = personRig(placement)
  const l: Required<Look> = { ...DEFAULT_LOOK, ...look }
  const { body, local, view, world } = rig
  const tilt = rig.tilt.torso
  const frontal = view !== 'side'
  // てまえ の そで は どう より 少し こく(どう の まえ に あると わかる)、むこう は もっと こく
  const nearPaint: Paint = { cloth: shade(l.top, frontal ? 0.1 : 0.12), skin: l.skin, shoe: l.shoes }
  const farPaint: Paint = { cloth: shade(l.top, 0.32), skin: shade(l.skin, 0.1), shoe: shade(l.shoes, 0.15) }
  const legPaint: Paint = { cloth: l.bottom, skin: l.skin, shoe: l.shoes }
  const legFarPaint: Paint = { cloth: shade(l.bottom, 0.18), skin: shade(l.skin, 0.1), shoe: farPaint.shoe }
  const skirt =
    l.bottomKind === 'skirt' || l.bottomKind === 'dress' ? (
      <Skirt width={frontal ? body.torsoFrontW : body.torsoW} body={body} color={l.bottomKind === 'dress' ? l.top : l.bottom} tilt={tilt} thighs={[local.legs.left, local.legs.right]} />
    ) : null
  const head = (
    <g transform={`translate(${r2(local.head[0])} ${r2(local.head[1])}) rotate(${r2(tilt + rig.tilt.head)}) scale(${body.headR})`} data-part="head">
      <Head view={view} face={face} hairStyle={l.hairStyle} hair={l.hair} skin={l.skin} accent={l.accent} gaze={gaze} gazeY={gazeY} hairSway={hairSway} hat={l.hat} hatColor={l.hatColor} glasses={l.glasses} />
      {headwear}
    </g>
  )
  const torso = <Torso body={body} look={l} view={view} tilt={tilt} />
  const hasHeld = held !== undefined && held !== null && held !== false
  const gear = gearOf(rig, pack, tools)
  const parts = frontal
    ? frontalParts(rig, l, { near: nearPaint, far: farPaint, leg: legPaint }, torso, skirt, head, hasHeld, gear)
    : sideParts(rig, l, { near: nearPaint, far: farPaint, legFar: legFarPaint, leg: legPaint }, torso, skirt, head, hasHeld, gear)
  // かげ: 足もと の 地面に。ジャンプ すると うすく なる
  const feet = [world.legs.left.end[0], world.legs.right.end[0]]
  const lift = placement.lift ?? 0
  const shadowOpacity = 0.12 * (1 - clamp(lift / (20 * rig.scale), 0, 0.7))
  return (
    <g opacity={opacity}>
      {shadow && <ellipse cx={r2((feet[0] + feet[1]) / 2)} cy={r2(placement.y + 0.3)} rx={r2(Math.abs(feet[0] - feet[1]) / 2 + 9.5 * rig.scale)} ry={r2(2.8 * rig.scale)} fill="#000000" opacity={r2(shadowOpacity)} />}
      <Layers parts={parts} transform={rig.transform} held={held} />
    </g>
  )
}
