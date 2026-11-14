/**
 * 人の 体の つくり(ほね と 関節)。絵は Person.tsx が、ここで 出した 関節の 場所を つないで描く。
 *
 * 体の中の 座標(local)は、こし(骨ばん)の まんなか が 0,0。下が +y。
 * 横むき では +x が 顔の むく ほう(まえ)。左むき は、右むき を 左右 はんてん して描く。
 * 正面 では +x が 画面の 右(人の 左手の がわ)。うしろむき では +x が 画面の 右(人の 右手の がわ)。
 * 大きさは、立ったときの 背の高さ が 100 に なる 単位。height で 画面の 大きさに 直す(体格は builds.ts)。
 * うで・あし の 角度の きまり は limbs.ts。
 */
import { BUILDS, bodyScale, type Build, type Proportions } from './builds'
import { clamp, DEPTH_TILT, forward, HANG_ARM, isMix, isTarget, mixAngles, mixLimb, reach, STRAIGHT_LEG, type Kind, type Limb, type LimbAngles, type LimbJoints, type Plane, type Point } from './limbs'

export { BUILDS, DEFAULT_HEIGHT, bodyScale } from './builds'
export type { Build, Proportions } from './builds'
export { DEPTH_TILT, HANG_ARM, STRAIGHT_LEG, isMix, isTarget, mixLimb, reach } from './limbs'
export type { Limb, LimbAngles, LimbJoints, LimbMix, LimbTarget, Point } from './limbs'

export type Facing = 'left' | 'right' | 'front' | 'back'
/** 人の 体の 左右(画面の 左右 ではない) */
export type BodySide = 'left' | 'right'
/** 体を 見る むき: 横・正面・うしろ */
export type View = 'side' | 'front' | 'back'

export type PersonPose = {
  readonly leftArm?: Limb
  readonly rightArm?: Limb
  readonly leftLeg?: Limb
  readonly rightLeg?: Limb
  /** 上体の かたむき(度。こし を じく)。横むき: + = まえへ(おじぎ)/ 正面・うしろむき: + = 画面の右へ */
  readonly torso?: number
  /** あたまの かたむき(度。くび を じく)。横むき: + = うつむく / - = 見上げる。正面・うしろむき: + = 画面の右へ かしげる */
  readonly head?: number
}

/** 置き場所と 大きさ と かっこう。Person と personRig に わたす */
export type Placement = {
  /** こし(体の まんなか)の x */
  readonly x: number
  /** 地面の y。いちばん下の 足(すわれば おしり・ひざ)が ここに つく */
  readonly y: number
  readonly build?: Build
  /** 立ったときの 背の高さ(画面の 単位)。省くと 体格ごとの 高さ(子ども 44・おとな 58 など) */
  readonly height?: number
  readonly facing?: Facing
  readonly pose?: PersonPose
  /** 体ぜんたいの かたむき(度。足もと を じく)。横むき: + = まえへ */
  readonly lean?: number
  /** 地面から うく 高さ(ジャンプ) */
  readonly lift?: number
  /** 横の ちぢみ(0〜1)。ふりむく とちゅう に使う(turnAround) */
  readonly squash?: number
  /** 地面に ついている 足(省くと いちばん下の 足)。おくゆき の ある あるき(walkDepth)が 使う */
  readonly stance?: BodySide
}

export type BodyJoints = {
  readonly pelvis: Point
  readonly neck: Point
  readonly head: Point
  readonly arms: Readonly<Record<BodySide, LimbJoints>>
  readonly legs: Readonly<Record<BodySide, LimbJoints>>
}

export type Rig = {
  readonly build: Build
  readonly facing: Facing
  readonly view: View
  readonly body: Proportions
  readonly scale: number
  /** 横むき で 見る人の がわ に ある 体の 左右(正面・うしろむき では null) */
  readonly near: BodySide | null
  /** じっさいの かたむき(度): 上体(せなか の まるさ も 入る)と、上体 に たいする あたま */
  readonly tilt: { readonly torso: number; readonly head: number }
  /** 体の中の 座標(背の高さ 100)。絵は この座標で描いて、transform で 画面に 置く */
  readonly local: BodyJoints
  /** 画面の 座標(手に 物を もたせる・目で たしかめる ときに使う) */
  readonly world: BodyJoints
  /** 体の中 → 画面 の SVG transform */
  readonly transform: string
  readonly toWorld: (p: Point) => Point
}

/** すわったとき、こし から おしり の 下 まで */
export const SEAT = 6

type Side = { readonly side: BodySide; readonly outward: number }

const rad = (deg: number) => (deg * Math.PI) / 180

/** 横むき で 見る人の がわ の 体の 左右。右むき なら 左の 手足 が 見える */
export function nearSide(facing: Facing): BodySide | null {
  if (facing === 'front' || facing === 'back') return null
  return facing === 'right' ? 'left' : 'right'
}

export function viewOf(facing: Facing): View {
  return facing === 'front' || facing === 'back' ? facing : 'side'
}

/** 体の 左右 が 体の中の 座標で どちら がわ か(正面: 右手 は 画面の 左 = -1 / うしろむき: 右手 は 画面の 右 = +1) */
function sidesOf(facing: Facing): readonly Side[] {
  if (facing === 'front') {
    return [
      { side: 'right', outward: -1 },
      { side: 'left', outward: 1 },
    ]
  }
  if (facing === 'back') {
    return [
      { side: 'left', outward: -1 },
      { side: 'right', outward: 1 },
    ]
  }
  return [
    { side: 'left', outward: 1 },
    { side: 'right', outward: 1 },
  ]
}

const rotateAbout = (p: Point, o: Point, angle: number): Point => {
  const c = Math.cos(rad(angle))
  const s = Math.sin(rad(angle))
  const dx = p[0] - o[0]
  const dy = p[1] - o[1]
  return [o[0] + dx * c - dy * s, o[1] + dx * s + dy * c]
}

/** ポーズ ぜんたい を まぜる。かたほう にしか ない 関節は、もう かたほう を「たらした かっこう」として まぜる */
export function mixPose(a: PersonPose, b: PersonPose, k: number): PersonPose {
  const limb = (x: Limb | undefined, y: Limb | undefined, rest: LimbAngles): Limb => mixLimb(x ?? rest, y ?? rest, k)
  return {
    leftArm: limb(a.leftArm, b.leftArm, HANG_ARM),
    rightArm: limb(a.rightArm, b.rightArm, HANG_ARM),
    leftLeg: limb(a.leftLeg, b.leftLeg, STRAIGHT_LEG),
    rightLeg: limb(a.rightLeg, b.rightLeg, STRAIGHT_LEG),
    torso: (a.torso ?? 0) + ((b.torso ?? 0) - (a.torso ?? 0)) * k,
    head: (a.head ?? 0) + ((b.head ?? 0) - (a.head ?? 0)) * k,
  }
}

const hasTarget = (limb: Limb): boolean => isTarget(limb) || (isMix(limb) && (hasTarget(limb.mix[0]) || hasTarget(limb.mix[1])))

/** 体の 関節を ぜんぶ 計算する。Person も これを使って描く */
export function personRig(placement: Placement): Rig {
  const build = placement.build ?? 'child'
  const facing = placement.facing ?? 'right'
  const view = viewOf(facing)
  const plane: Plane = view === 'side' ? 'side' : 'front'
  const body = BUILDS[build]
  const scale = bodyScale(build, placement.height)
  const pose = placement.pose ?? {}
  const mirror = facing === 'left' ? -1 : 1
  const squash = clamp(placement.squash ?? 1, 0, 1)
  const lean = placement.lean ?? 0
  const lift = placement.lift ?? 0
  const sides = sidesOf(facing)
  // おくゆき: 正面 は まえ が 見る人の ほう(画面の 下)、うしろむき は まえ が おく(画面の 上)
  const tilt = view === 'front' ? DEPTH_TILT : view === 'back' ? -DEPTH_TILT : 0
  // せなか の まるい 人: 横むき では 上体が まえへ かたむき、あたま は おこして まえを 見る。正面・うしろ では くび が 少し しずむ
  const stoop = body.stoop ?? 0
  const torsoTilt = (pose.torso ?? 0) + (plane === 'side' ? stoop : 0)
  const headTilt = (pose.head ?? 0) - (plane === 'side' ? stoop * 0.8 : 0)
  const sink = plane === 'front' ? stoop * 0.15 : 0

  // 上体: こし を じく に かたむく
  const shoulderY = -(body.torso - body.shoulderDrop)
  const shoulderOf = ({ outward }: Side): Point => rotateAbout(plane === 'side' ? [body.shoulderX, shoulderY] : [outward * body.shoulderHalf, shoulderY], [0, 0], torsoTilt)
  const hipOf = ({ outward }: Side): Point => (plane === 'side' ? [0, 0] : [outward * body.hipHalf, 0])
  const neck = rotateAbout([0, -body.torso], [0, 0], torsoTilt)
  // あたま は くび の 上。うなずく ときは くび の つけね を じく に まわる
  const headCenter = rotateAbout([plane === 'side' ? body.headX : 0, -body.torso - body.neck - body.headR + sink], [0, 0], torsoTilt)
  const headPoint = rotateAbout(headCenter, neck, headTilt)

  const legLengths: Point = [body.thigh, body.shin]
  const armLengths: Point = [body.upperArm, body.foreArm]

  const angleOf = (limb: Limb, root: Point, kind: Kind, outward: number, toLocal: ((p: Point) => Point) | null): LimbAngles => {
    if (isMix(limb)) return mixAngles(angleOf(limb.mix[0], root, kind, outward, toLocal), angleOf(limb.mix[1], root, kind, outward, toLocal), limb.k)
    if (isTarget(limb)) return toLocal ? reach(root, toLocal(limb.to), kind === 'arm' ? armLengths : legLengths, kind, plane, outward) : kind === 'arm' ? HANG_ARM : STRAIGHT_LEG
    return limb
  }
  const legLimb = (side: BodySide): Limb => (side === 'left' ? pose.leftLeg : pose.rightLeg) ?? (plane === 'side' ? { swing: side === nearSide(facing) ? 1.5 : -1.5, bend: 0 } : STRAIGHT_LEG)
  const armLimb = (side: BodySide): Limb => (side === 'left' ? pose.leftArm : pose.rightArm) ?? HANG_ARM

  // こし から 地面 まで: くつ底・ひざ・おしり の うち いちばん下(stance が あれば その 足の くつ底)。
  // to で 指定した あし は 物に とどく ほう なので 入れない(2本とも to なら、まっすぐ 立った 高さ)
  const extentOf = (s: Side): number => {
    const j = forward(hipOf(s), angleOf(legLimb(s.side), hipOf(s), 'leg', s.outward, null), legLengths, 'leg', plane, s.outward, tilt)
    return Math.max(j.end[1] + body.footH, j.mid[1] + body.legW / 2)
  }
  const standing = sides.find((s) => s.side === placement.stance && !hasTarget(legLimb(s.side)))
  const groundLegs = sides.filter((s) => !hasTarget(legLimb(s.side)))
  const lowest = standing ? extentOf(standing) : groundLegs.length === 0 ? body.thigh + body.shin + body.footH : Math.max(SEAT, ...groundLegs.map(extentOf))

  // 体の中 → 画面: こしの下の 地面の点 を (x, y - lift) に置き、大きさ・向き・かたむき を つける
  const sx = mirror * squash * scale
  const toWorld = (p: Point): Point => {
    const [rx, ry] = rotateAbout([p[0], p[1] - lowest], [0, 0], lean)
    return [placement.x + rx * sx, placement.y - lift + ry * scale]
  }
  const toLocal = (w: Point): Point => {
    const px = sx === 0 ? 0 : (w[0] - placement.x) / sx
    const py = (w[1] - placement.y + lift) / scale
    const [lx, ly] = rotateAbout([px, py], [0, 0], -lean)
    return [lx, ly + lowest]
  }

  const limbs = (kind: Kind) =>
    Object.fromEntries(
      sides.map((s) => {
        const root = kind === 'arm' ? shoulderOf(s) : hipOf(s)
        const limb = kind === 'arm' ? armLimb(s.side) : legLimb(s.side)
        const angles = angleOf(limb, root, kind, s.outward, toLocal)
        return [s.side, forward(root, angles, kind === 'arm' ? armLengths : legLengths, kind, plane, s.outward, tilt)]
      }),
    ) as Record<BodySide, LimbJoints>

  const local: BodyJoints = { pelvis: [0, 0], neck, head: headPoint, arms: limbs('arm'), legs: limbs('leg') }
  const mapLimb = (j: LimbJoints): LimbJoints => ({ ...j, root: toWorld(j.root), mid: toWorld(j.mid), end: toWorld(j.end) })
  const world: BodyJoints = {
    pelvis: toWorld(local.pelvis),
    neck: toWorld(local.neck),
    head: toWorld(local.head),
    arms: { left: mapLimb(local.arms.left), right: mapLimb(local.arms.right) },
    legs: { left: mapLimb(local.legs.left), right: mapLimb(local.legs.right) },
  }
  const r3 = (n: number) => Math.round(n * 1000) / 1000
  return {
    build,
    facing,
    view,
    body,
    scale,
    near: nearSide(facing),
    tilt: { torso: torsoTilt, head: headTilt },
    local,
    world,
    transform: `translate(${r3(placement.x)} ${r3(placement.y - lift)}) scale(${r3(sx)} ${r3(scale)}) rotate(${r3(lean)}) translate(0 ${r3(-lowest)})`,
    toWorld,
  }
}
