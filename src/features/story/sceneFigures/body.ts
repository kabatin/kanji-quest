/**
 * 人の 体の つくり(ほね と 関節)。絵は Person.tsx が、ここで 出した 関節の 場所を つないで描く。
 *
 * 体の中の 座標(local)は、こし(骨ばん)の まんなか が 0,0。下が +y。
 * 横むき では +x が 顔の むく ほう(まえ)。左むき は、右むき を 左右 はんてん して描く。
 * 正面 では +x が 画面の 右(人の 左手の がわ)。
 * 大きさは、立ったときの 背の高さ が 100 に なる 単位。height で 画面の 大きさに 直す。
 *
 * 関節の 角度は「ま下 から 何度」:
 *   横むき … + = まえへ(うで を まえに あげる / ももを まえに あげる)
 *   正面   … + = 外へ(体の まんなか から はなれる ほう)
 * ひじ は まえ(横むき)にしか まがらず、ひざ は うしろ にしか まがらない。
 * 角度で 指定しても、手先・足先の 点(to)で 指定しても、この きまり は 部品の中で 守る。
 */

export type Point = readonly [number, number]
export type Build = 'child' | 'adult'
export type Facing = 'left' | 'right' | 'front'
/** 人の 体の 左右(画面の 左右 ではない) */
export type BodySide = 'left' | 'right'

/** 関節の 角度で 決める。swing = つけね(かた・こし)の 角度、bend = ひじ・ひざ の まがり */
export type LimbAngles = { readonly swing: number; readonly bend: number }
/** 手先・足先を、画面の この点に とどかせる(とどかないときは、まっすぐ のばした ところ まで) */
export type LimbTarget = { readonly to: Point }
/** 2つの かっこう の あいだ(k = 0 で a、1 で b)。関節の 角度で まぜるので、うで は 弧を えがいて 動く */
export type LimbMix = { readonly mix: readonly [Limb, Limb]; readonly k: number }
export type Limb = LimbAngles | LimbTarget | LimbMix

export type PersonPose = {
  readonly leftArm?: Limb
  readonly rightArm?: Limb
  readonly leftLeg?: Limb
  readonly rightLeg?: Limb
  /** 上体の かたむき(度。こし を じく)。横むき: + = まえへ(おじぎ)/ 正面: + = 画面の右へ */
  readonly torso?: number
  /** あたまの かたむき(度。くび を じく)。横むき: + = うつむく / - = 見上げる。正面: + = 画面の右へ かしげる */
  readonly head?: number
}

/** 置き場所と 大きさ と かっこう。Person と personRig に わたす */
export type Placement = {
  /** こし(体の まんなか)の x */
  readonly x: number
  /** 地面の y。いちばん下の 足(すわれば おしり・ひざ)が ここに つく */
  readonly y: number
  readonly build?: Build
  /** 立ったときの 背の高さ(画面の 単位)。省くと 子ども 44・おとな 58 */
  readonly height?: number
  readonly facing?: Facing
  readonly pose?: PersonPose
  /** 体ぜんたいの かたむき(度。足もと を じく)。横むき: + = まえへ */
  readonly lean?: number
  /** 地面から うく 高さ(ジャンプ) */
  readonly lift?: number
  /** 横の ちぢみ(0〜1)。ふりむく とちゅう に使う(turnAround) */
  readonly squash?: number
}

/** 体の 大きさ(背の高さ 100 の 単位) */
export type Proportions = {
  readonly headR: number
  /** あたまの まんなか の、くび の つけね からの ずれ(横むき: + = まえ) */
  readonly headX: number
  /** くび の 見える 長さ(どう と あたま に かくれる ぶんは のぞく) */
  readonly neck: number
  readonly neckW: number
  /** こし から どう の 上の はし まで */
  readonly torso: number
  readonly torsoW: number
  readonly torsoFrontW: number
  /** どう の 上の はし から かた の 関節 まで */
  readonly shoulderDrop: number
  /** かた の 関節の 位置(横むき: まえへの ずれ / 正面: まんなか からの はなれ) */
  readonly shoulderX: number
  readonly shoulderHalf: number
  readonly upperArm: number
  readonly foreArm: number
  readonly armW: number
  readonly handR: number
  /** 正面での 股関節の まんなか からの はなれ */
  readonly hipHalf: number
  readonly thigh: number
  readonly shin: number
  readonly legW: number
  /** くるぶし から くつ の そこ まで */
  readonly footH: number
  /** くつ の 長さの 半分 */
  readonly footL: number
}

/**
 * 子ども は あたま が 大きく(3.4 頭身)、おとな は 4.3 頭身くらい(「休」の人と 同じ つりあい)。
 * くび は どちらも みじかい。うで を たらすと、手は ももの 上の ほう に とどく。
 */
export const BUILDS: Readonly<Record<Build, Proportions>> = {
  child: {
    headR: 14.6, headX: 0.6, neck: 3, neckW: 7.4, torso: 30, torsoW: 19, torsoFrontW: 25,
    shoulderDrop: 4.2, shoulderX: 0.8, shoulderHalf: 9, upperArm: 14, foreArm: 13.5, armW: 7.6, handR: 4.6,
    hipHalf: 4.6, thigh: 16.5, shin: 15.5, legW: 8.2, footH: 4, footL: 5.8,
  },
  adult: {
    headR: 11.6, headX: 0.6, neck: 3, neckW: 6.6, torso: 33, torsoW: 17.5, torsoFrontW: 24,
    shoulderDrop: 4.4, shoulderX: 0.8, shoulderHalf: 8.6, upperArm: 16, foreArm: 15.4, armW: 7.4, handR: 4.4,
    hipHalf: 4.4, thigh: 20.5, shin: 19.5, legW: 8.2, footH: 4, footL: 6.2,
  },
}

export const DEFAULT_HEIGHT: Readonly<Record<Build, number>> = { child: 44, adult: 58 }

/** すわったとき、こし から おしり の 下 まで */
const SEAT = 6

/** 背の高さ 100 の 単位 から 画面の 単位 への 倍率 */
export function bodyScale(build: Build = 'child', height?: number): number {
  return (height ?? DEFAULT_HEIGHT[build]) / 100
}

const rad = (deg: number) => (deg * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI
const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi)
/** 角度の 差を -180〜180 に */
const wrap = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180

type Kind = 'arm' | 'leg'
type View = 'side' | 'front'

/** 関節の うごく はんい(これより 先へは まがらない) */
const RANGE: Readonly<Record<View, Record<Kind, { readonly swing: Point; readonly bend: Point }>>> = {
  side: {
    arm: { swing: [-60, 200], bend: [0, 160] },
    leg: { swing: [-45, 125], bend: [0, 165] },
  },
  front: {
    arm: { swing: [-50, 185], bend: [-165, 165] },
    leg: { swing: [-15, 90], bend: [-20, 150] },
  },
}

/** 角度(ま下 から、+ = まえ / 外)の むきの 長さ1 の ベクトル。outward は 正面で 外が +x なら 1、-x なら -1 */
function dir(angle: number, outward: number): Point {
  return [Math.sin(rad(angle)) * outward, Math.cos(rad(angle))]
}

export type LimbJoints = { readonly root: Point; readonly mid: Point; readonly end: Point; readonly swing: number; readonly bend: number }

/** 角度から ひじ・手(ひざ・くるぶし)の 場所を出す。うごく はんい の外は 止める */
function forward(root: Point, angles: LimbAngles, lengths: Point, kind: Kind, view: View, outward: number): LimbJoints {
  const range = RANGE[view][kind]
  const swing = clamp(angles.swing, range.swing[0], range.swing[1])
  const bend = clamp(angles.bend, range.bend[0], range.bend[1])
  // うで は まえ(外)へ、あし は うしろ(内)へ まがる
  const second = kind === 'arm' ? swing + bend : swing - bend
  const [ax, ay] = dir(swing, outward)
  const mid: Point = [root[0] + ax * lengths[0], root[1] + ay * lengths[0]]
  const [bx, by] = dir(second, outward)
  return { root, mid, end: [mid[0] + bx * lengths[1], mid[1] + by * lengths[1]], swing, bend }
}

/**
 * 先を target に とどかせる 角度(2本の ほね の 計算)。
 * 横むき: ひじ は うしろ・下へ、ひざ は まえへ 出る。正面: ひじ・ひざ は 外へ 出る。
 */
export function reach(root: Point, target: Point, lengths: Point, kind: Kind, view: View, outward = 1): LimbAngles {
  const [l1, l2] = lengths
  const vx = (target[0] - root[0]) * outward
  const vy = target[1] - root[1]
  const d = clamp(Math.hypot(vx, vy), Math.abs(l1 - l2) + 0.01, l1 + l2 - 0.01)
  const toward = deg(Math.atan2(vx, vy))
  const open = deg(Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)))
  const candidates = [toward - open, toward + open]
  const pick = (swing: number) => {
    const mid: Point = [Math.sin(rad(swing)) * l1, Math.cos(rad(swing)) * l1]
    const end: Point = [Math.sin(rad(toward)) * d, Math.cos(rad(toward)) * d]
    const second = deg(Math.atan2(end[0] - mid[0], end[1] - mid[1]))
    const bend = kind === 'arm' ? wrap(second - swing) : wrap(swing - second)
    return { swing, bend, out: mid[0] }
  }
  const [a, b] = candidates.map(pick)
  // 正面: ひじ・ひざ が 外に 出る ほう / 横むき: まがる むき が 正しい ほう(bend ≥ 0)
  const ok = view === 'front' ? (a.out >= b.out ? a : b) : kind === 'arm' ? a : b
  const range = RANGE[view][kind]
  if (ok.swing >= range.swing[0] && ok.swing <= range.swing[1]) return { swing: ok.swing, bend: ok.bend }
  // つけね が まわりきらない 点(体の うしろ の 下 など)は、まわる ところ まで まわして、先を 点の ほうへ むける
  const swing = clamp(ok.swing, range.swing[0], range.swing[1])
  const mid: Point = [Math.sin(rad(swing)) * l1, Math.cos(rad(swing)) * l1]
  const second = deg(Math.atan2(vx - mid[0], vy - mid[1]))
  return { swing, bend: kind === 'arm' ? wrap(second - swing) : wrap(swing - second) }
}

export function isTarget(limb: Limb): limb is LimbTarget {
  return 'to' in limb
}

export function isMix(limb: Limb): limb is LimbMix {
  return 'mix' in limb
}

/** 2つの かっこう を まぜる(関節の 角度で)。k は 0〜1 */
export function mixLimb(a: Limb, b: Limb, k: number): LimbMix {
  return { mix: [a, b], k }
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

/** たらした うで・まっすぐ の あし(何も 指定しないときの かっこう) */
export const HANG_ARM: LimbAngles = { swing: 4, bend: 8 }
export const STRAIGHT_LEG: LimbAngles = { swing: 0, bend: 0 }

type Side = { readonly side: BodySide; readonly outward: number }

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
  /** 横むき で 見る人の がわ に ある 体の 左右(正面 では null) */
  readonly near: BodySide | null
  /** 体の中の 座標(背の高さ 100)。絵は この座標で描いて、transform で 画面に 置く */
  readonly local: BodyJoints
  /** 画面の 座標(手に 物を もたせる・目で たしかめる ときに使う) */
  readonly world: BodyJoints
  /** 体の中 → 画面 の SVG transform */
  readonly transform: string
  readonly toWorld: (p: Point) => Point
}

/** 横むき で 見る人の がわ の 体の 左右。右むき なら 左の 手足 が 見える */
export function nearSide(facing: Facing): BodySide | null {
  if (facing === 'front') return null
  return facing === 'right' ? 'left' : 'right'
}

/** 体の 左右 が 体の中の 座標で どちら がわ か(正面: 右手 は 画面の 左 = -1) */
function sidesOf(facing: Facing): readonly Side[] {
  return facing === 'front'
    ? [
        { side: 'right', outward: -1 },
        { side: 'left', outward: 1 },
      ]
    : [
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

/** 体の 関節を ぜんぶ 計算する。Person も これを使って描く */
export function personRig(placement: Placement): Rig {
  const build = placement.build ?? 'child'
  const facing = placement.facing ?? 'right'
  const view: View = facing === 'front' ? 'front' : 'side'
  const body = BUILDS[build]
  const scale = bodyScale(build, placement.height)
  const pose = placement.pose ?? {}
  const mirror = facing === 'left' ? -1 : 1
  const squash = clamp(placement.squash ?? 1, 0, 1)
  const lean = placement.lean ?? 0
  const lift = placement.lift ?? 0
  const sides = sidesOf(facing)
  const torsoTilt = pose.torso ?? 0

  // 上体: こし を じく に かたむく
  const shoulderY = -(body.torso - body.shoulderDrop)
  const shoulderOf = ({ outward }: Side): Point =>
    rotateAbout(view === 'side' ? [body.shoulderX, shoulderY] : [outward * body.shoulderHalf, shoulderY], [0, 0], torsoTilt)
  const hipOf = ({ outward }: Side): Point => (view === 'side' ? [0, 0] : [outward * body.hipHalf, 0])
  const neck = rotateAbout([0, -body.torso], [0, 0], torsoTilt)
  // あたま は くび の 上。うなずく ときは くび の つけね を じく に まわる
  const headCenter = rotateAbout([view === 'side' ? body.headX : 0, -body.torso - body.neck - body.headR], [0, 0], torsoTilt)
  const headPoint = rotateAbout(headCenter, neck, pose.head ?? 0)

  const legLengths: Point = [body.thigh, body.shin]
  const armLengths: Point = [body.upperArm, body.foreArm]

  const angleOf = (limb: Limb, root: Point, kind: Kind, outward: number, toLocal: ((p: Point) => Point) | null): LimbAngles => {
    if (isMix(limb)) {
      const a = angleOf(limb.mix[0], root, kind, outward, toLocal)
      const b = angleOf(limb.mix[1], root, kind, outward, toLocal)
      return { swing: a.swing + (b.swing - a.swing) * limb.k, bend: a.bend + (b.bend - a.bend) * limb.k }
    }
    if (isTarget(limb)) return toLocal ? reach(root, toLocal(limb.to), kind === 'arm' ? armLengths : legLengths, kind, view, outward) : kind === 'arm' ? HANG_ARM : STRAIGHT_LEG
    return limb
  }
  const legLimb = (side: BodySide): Limb => (side === 'left' ? pose.leftLeg : pose.rightLeg) ?? (view === 'side' ? { swing: side === nearSide(facing) ? 1.5 : -1.5, bend: 0 } : STRAIGHT_LEG)
  const armLimb = (side: BodySide): Limb => (side === 'left' ? pose.leftArm : pose.rightArm) ?? HANG_ARM
  const hasTarget = (limb: Limb): boolean => isTarget(limb) || (isMix(limb) && (hasTarget(limb.mix[0]) || hasTarget(limb.mix[1])))

  // こし から 地面 まで: くつ底・ひざ・おしり の うち いちばん下。
  // to で 指定した あし は 物に とどく ほう なので 入れない(2本とも to なら、まっすぐ 立った 高さ)
  const groundLegs = sides.filter((s) => !hasTarget(legLimb(s.side)))
  const lowest =
    groundLegs.length === 0
      ? body.thigh + body.shin + body.footH
      : Math.max(
          SEAT,
          ...groundLegs.map((s) => {
            const j = forward(hipOf(s), angleOf(legLimb(s.side), hipOf(s), 'leg', s.outward, null), legLengths, 'leg', view, s.outward)
            return Math.max(j.end[1] + body.footH, j.mid[1] + body.legW / 2)
          }),
        )

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
        return [s.side, forward(root, angles, kind === 'arm' ? armLengths : legLengths, kind, view, s.outward)]
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
    local,
    world,
    transform: `translate(${r3(placement.x)} ${r3(placement.y - lift)}) scale(${r3(sx)} ${r3(scale)}) rotate(${r3(lean)}) translate(0 ${r3(-lowest)})`,
    toWorld,
  }
}
