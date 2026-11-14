import { BUILDS, bodyScale, DEFAULT_HEIGHT, DEPTH_TILT, personRig, SEAT, type Build, type Facing, type LimbAngles, type Placement, type PersonPose, type Point, type Rig } from './body'

/**
 * よく使う かっこう(すわる・しゃがむ・ひざまずく・ねころぶ・物を もつ)。
 * 向き(横・正面・うしろ)ごとに 正しい 関節の 角度 が ちがう ので、向き を わたして 受けとる:
 *
 *   <Person x={40} y={96} facing="front" pose={posture('sitChair', 'front')} />
 *   <Person … pose={{ ...posture('squat', 'right'), rightArm: { to: [50, 90] } }} />   // うで だけ かえる
 *
 * すわる 高さ: いす の ざめん は seatHeight(体格, 背)、つくえ の 上は deskHeight(体格, 背)(地面 から の 高さ)。
 */

export type PostureName = 'stand' | 'sitChair' | 'sitFloor' | 'seiza' | 'kneel' | 'squat' | 'bow' | 'banzai' | 'wave'

/** 横むき の かっこう(swing・bend が 体の まえうしろ の 角度) */
const SIDE: Readonly<Record<PostureName, PersonPose>> = {
  stand: {},
  // いす: もも は まえへ 90度、ひざ も 90度。手は ももの 上
  sitChair: { leftLeg: { swing: 88, bend: 90 }, rightLeg: { swing: 92, bend: 92 }, leftArm: { swing: 34, bend: 40 }, rightArm: { swing: 28, bend: 46 } },
  // 地べた に 足を のばして すわる。手は ももの 上
  sitFloor: { leftLeg: { swing: 88, bend: 2 }, rightLeg: { swing: 92, bend: 4 }, leftArm: { swing: 40, bend: 30 }, rightArm: { swing: 34, bend: 36 }, torso: -4 },
  // 正座: すね を もも の 下に たたむ(おしり が かかと に のる)
  seiza: { leftLeg: { swing: 86, bend: 162 }, rightLeg: { swing: 90, bend: 164 }, leftArm: { swing: 30, bend: 50 }, rightArm: { swing: 24, bend: 56 } },
  // ひざまずく: もも は まっすぐ 下、すね は うしろ に ねかせる
  kneel: { leftLeg: { swing: 0, bend: 90 }, rightLeg: { swing: -2, bend: 92 } },
  // しゃがむ: もも を むね の ほうへ、かかと は おしり の 下。上体を まえへ たおして つりあう。ひじ を ひざ に のせる
  squat: { leftLeg: { swing: 118, bend: 150 }, rightLeg: { swing: 122, bend: 154 }, leftArm: { swing: 8, bend: 80 }, rightArm: { swing: 4, bend: 88 }, torso: 28, head: -20 },
  bow: { torso: 45, head: 10, leftArm: { swing: 0, bend: 10 }, rightArm: { swing: 0, bend: 10 } },
  banzai: { leftArm: { swing: 165, bend: 10 }, rightArm: { swing: 160, bend: 14 } },
  // てまえ の 手を ふる(横むき の 手を ふる ときは、場面で bend を wave で ゆらす)
  wave: { leftArm: { swing: 150, bend: 30 }, rightArm: { swing: 150, bend: 30 } },
}

const leg = (fore: number, foreBend: number, swing = 3): LimbAngles => ({ swing, bend: 0, fore, foreBend })
const arm = (swing: number, bend: number, fore = 0, foreBend = 0): LimbAngles => ({ swing, bend, fore, foreBend })

/** 正面・うしろむき の かっこう(fore・foreBend が まえうしろ、swing・bend は 左右) */
const FRONTAL: Readonly<Record<PostureName, PersonPose>> = {
  stand: {},
  sitChair: { leftLeg: leg(90, 90, 4), rightLeg: leg(90, 90, 4), leftArm: arm(8, -6, 40, 40), rightArm: arm(8, -6, 40, 40) },
  sitFloor: { leftLeg: leg(88, 0, 8), rightLeg: leg(88, 0, 8), leftArm: arm(10, -8, 40, 30), rightArm: arm(10, -8, 40, 30) },
  seiza: { leftLeg: leg(88, 162, 5), rightLeg: leg(88, 162, 5), leftArm: arm(6, -10, 32, 50), rightArm: arm(6, -10, 32, 50) },
  kneel: { leftLeg: leg(0, 90, 4), rightLeg: leg(0, 90, 4) },
  squat: { leftLeg: leg(120, 152, 16), rightLeg: leg(120, 152, 16), leftArm: arm(14, -20, 60, 40), rightArm: arm(14, -20, 60, 40), head: 0 },
  bow: { leftArm: arm(4, 8, 30, 0), rightArm: arm(4, 8, 30, 0) },
  banzai: { leftArm: arm(155, 15), rightArm: arm(155, 15) },
  wave: { leftArm: arm(150, 25), rightArm: arm(150, 25) },
}

/** 名前の かっこう を、その向き の 角度で(ふりむく とちゅう も 同じ 名前で よい) */
export function posture(name: PostureName, facing: Facing): PersonPose {
  return facing === 'front' || facing === 'back' ? FRONTAL[name] : SIDE[name]
}

/** いす の ざめん の 高さ(地面 から)。すね と くつ の ぶん から、もも の あつみ の 半分 を ひく */
export function seatHeight(build: Build = 'child', height?: number): number {
  const b = BUILDS[build]
  return (b.shin + b.footH - b.legW / 2) * bodyScale(build, height)
}

/** すわった 人に ちょうど よい つくえ の 上の 高さ(地面 から)。ひじ より 少し 下 */
export function deskHeight(build: Build = 'child', height?: number): number {
  const b = BUILDS[build]
  return seatHeight(build, height) + (b.torso - b.shoulderDrop - b.upperArm * 0.9 + b.legW / 2) * bodyScale(build, height)
}

/**
 * ねころぶ(あおむけ)。headTo の ほうに あたま、x は こし、y は 地面。
 * 横むき の 体を 足もと を じく に 90度 たおして、せなか が 地面に つく 高さ まで うかせる。
 *   <Person {...lieDown({ x: 50, y: 96, headTo: 'left' })} face="closed" />
 */
export function lieDown({ x, y, build = 'child', height, headTo = 'left' }: { readonly x: number; readonly y: number; readonly build?: Build; readonly height?: number; readonly headTo?: 'left' | 'right' }) {
  const b = BUILDS[build]
  const scale = bodyScale(build, height ?? DEFAULT_HEIGHT[build])
  const legs = b.thigh + b.shin + b.footH
  const toLeft = headTo === 'left'
  return {
    // 足もと が じく なので、こし が x に 来る よう 足もと を ずらす
    x: x + (toLeft ? 1 : -1) * legs * scale,
    y,
    build,
    height: height ?? DEFAULT_HEIGHT[build],
    facing: toLeft ? 'right' : 'left',
    lean: -90,
    lift: (b.torsoW / 2) * scale,
    pose: { leftArm: { swing: 2, bend: 4 }, rightArm: { swing: 6, bend: 6 } },
    shadow: false,
  } as const satisfies Placement & { readonly shadow: boolean }
}

/** chest = むね の まえ・waist = こし の まえ・overhead = あたま の 上・offer = 両手 を まえへ のばして さし出す */
export type HoldPlace = 'chest' | 'waist' | 'overhead' | 'offer'

/**
 * さし出す: 両手 を まえへ のばして、物を 相手 の ほうへ。
 * 正面・うしろむき は 手 を まえうしろ の おくゆき(depth)つき で 物の 左右 に とどかせる(ひじ は 少し まげて 外へ)。
 * うしろむき では 物も うで も 体の むこう(見えない)。
 */
function offerPose(rig: Rig, width: number, ahead: number): { readonly at: Point; readonly pose: PersonPose } {
  const { body, scale, world, view } = rig
  const arm = (body.upperArm + body.foreArm) * scale
  const shoulder: Point = [(world.arms.left.root[0] + world.arms.right.root[0]) / 2, (world.arms.left.root[1] + world.arms.right.root[1]) / 2]
  if (view === 'side') {
    const at: Point = [shoulder[0] + ahead * (arm * 0.78 + width * 0.3), shoulder[1] + arm * 0.24]
    const grip: Point = [at[0] - ahead * width * 0.2, at[1] + width * 0.1]
    const near = rig.near ?? 'left'
    const far: Point = [grip[0] + ahead * width * 0.12, grip[1] - 0.6 * scale]
    return { at, pose: near === 'left' ? { leftArm: { to: grip }, rightArm: { to: far } } : { rightArm: { to: grip }, leftArm: { to: far } } }
  }
  // まえ へ うで の 7わり半、むね の 高さ。正面 は 見る人 の ほう(画面の 下)、うしろむき は おく(画面の 上)に 見える
  const depth = arm * 0.75
  const at: Point = [world.pelvis[0], shoulder[1] + arm * 0.3 + depth * DEPTH_TILT * (view === 'front' ? 1 : -1)]
  const half = width / 2
  // 正面 は 右手 が 画面の 左、うしろむき は 右手 が 画面の 右
  const right = view === 'front' ? -1 : 1
  const hand = (side: number): Point => [at[0] + side * half, at[1] + width * 0.12]
  return { at, pose: { rightArm: { to: hand(right), depth }, leftArm: { to: hand(-right), depth } } }
}

/**
 * 両手で 物を もつ。物の まんなか(画面の 座標)と、その 物を もつ うで の ポーズ を 返す。
 * 物は <Person held={…}> に わたす と、てまえ の 手 と むこう の 手 の あいだ に 描かれる。
 *   const hold = holdPose(place, 'chest', 12)
 *   <Person {...place} pose={{ ...place.pose, ...hold.pose }} held={<Basket x={hold.at[0]} y={hold.at[1]} />} />
 * width は 物の はば(画面の 単位。正面・うしろむき で 手を 物の 左右 に そえる)。
 * うしろむき では 物は 体の むこう に あって 見えない(うで も 体の おく へ のびる)。
 * place = 'offer' は 両手 を まえ へ のばして さし出す(offerPose)。
 */
export function holdPose(placement: Placement, place: HoldPlace = 'chest', width = 10): { readonly at: Point; readonly pose: PersonPose } {
  const rig = personRig({ ...placement, pose: { ...placement.pose, leftArm: undefined, rightArm: undefined } })
  const { body, scale, world, view } = rig
  const arm = (body.upperArm + body.foreArm) * scale
  const shoulder: Point = [(world.arms.left.root[0] + world.arms.right.root[0]) / 2, (world.arms.left.root[1] + world.arms.right.root[1]) / 2]
  const ahead = placement.facing === 'left' ? -1 : 1
  if (place === 'offer') return offerPose(rig, width, ahead)
  if (view === 'back') {
    // せなか の むこう: うで は まえ へ のばして ひじ を まげる(体に かくれる)
    const up = place === 'overhead'
    // むね: 二のうで を まえへ 40度、前うで は 水平(まえへ 90度)。こし: 前うで を 少し 下に
    const limb: LimbAngles = up ? { swing: 150, bend: 20 } : { swing: 10, bend: -10, fore: place === 'chest' ? 40 : 18, foreBend: place === 'chest' ? 50 : 55 }
    const at: Point = up ? [world.head[0], world.head[1] - body.headR * scale - width * 0.4] : [world.pelvis[0], shoulder[1] + arm * (place === 'chest' ? 0.3 : 0.6)]
    return { at, pose: { leftArm: limb, rightArm: limb } }
  }
  if (view === 'front') {
    if (place === 'overhead') {
      const at: Point = [world.head[0], world.head[1] - body.headR * scale - width * 0.4]
      const half = width / 2
      return { at, pose: { rightArm: { to: [at[0] - half, at[1] + width * 0.2] }, leftArm: { to: [at[0] + half, at[1] + width * 0.2] } } }
    }
    // 二のうで は 体の よこ に たらし、前うで を 見る人の ほうへ(まえへ)出して、物の 左右 を もつ。
    // 手の はば が 物の はば に なる よう、二のうで を 少し 外へ ひらく
    const fore = place === 'chest' ? 28 : 10
    const reachOut = (width / 2 / scale - body.shoulderHalf) / (body.upperArm * Math.cos((fore * Math.PI) / 180))
    const swing = (Math.asin(Math.min(0.7, Math.max(-0.3, reachOut))) * 180) / Math.PI
    const limb: LimbAngles = { swing, bend: -swing, fore, foreBend: 90 - fore }
    const down = body.upperArm * Math.cos((fore * Math.PI) / 180) + DEPTH_TILT * (body.upperArm * Math.sin((fore * Math.PI) / 180) + body.foreArm)
    return { at: [world.pelvis[0], shoulder[1] + down * scale], pose: { rightArm: limb, leftArm: limb } }
  }
  // 横むき: 物は 体の まえ。てまえ の 手 と むこう の 手 は 物の てまえ と むこう の はし(画面では ほぼ 同じ 場所)
  const at: Point =
    place === 'overhead'
      ? [world.head[0] + ahead * 1.5 * scale, world.head[1] - body.headR * scale - width * 0.4]
      : place === 'chest'
        ? [shoulder[0] + ahead * (arm * 0.5 + width * 0.3), shoulder[1] + arm * 0.36]
        : [shoulder[0] + ahead * (arm * 0.42 + width * 0.25), shoulder[1] + arm * 0.62]
  const grip = place === 'overhead' ? [at[0], at[1] + width * 0.35] : [at[0] - ahead * width * 0.12, at[1] + width * 0.08]
  const near = rig.near ?? 'left'
  const handNear: Point = [grip[0], grip[1]]
  const handFar: Point = [grip[0] + ahead * width * 0.1, grip[1] - 0.6 * scale]
  return { at, pose: near === 'left' ? { leftArm: { to: handNear }, rightArm: { to: handFar } } : { rightArm: { to: handNear }, leftArm: { to: handFar } } }
}

/** すわった 人の おしり の 下(ざめん の まんなか の あたり)。いす を 人に 合わせて おく ときに使う */
export function seatUnder(placement: Placement): Point {
  const rig = personRig(placement)
  return [rig.world.pelvis[0], rig.world.pelvis[1] + SEAT * 0.5 * rig.scale]
}
