/*
 * 共通部品(sceneFigures)の 見本 その6: 手(まえ へ のばす・もつ・さし出す・道具)、てまえ・おく へ はしる、ばしょ。
 *   node scripts/scene-sheet.mjs --variant parts --big 手
 *
 * ながれ
 *   たたみ の 広間。正面 で 正座 した 子 が、ひくい つくえ の 紙 に ふで で まる を かく(手 を まえ へ のばす)。
 *   となり の 先生 が 手 を とって いっしょ に かき、とちゅう で はなす
 *   → さし出す: 正面(はこ)・横(かご)・うしろむき(うで も 物 も 体 の むこう)
 *   → 道具: 正面 で えんぴつ を 上げる・横 で ぼう で こくばん を さす・うしろむき で ぼう を 上げる・正面 で つくえ に 書く
 *   → てまえ へ はしって ゴール の テープ を きる(足あと の 点 が かたまれば すべっていない)→ おく へ はしって いく
 *   → 海 と 砂はま: とおく の 山 が せりあがり、はだし の 子 が あるく と 足あと が ぺた ぺた のこる → 字「手」
 */
import type { ReactNode } from 'react'
import { during, easeInOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../../sceneParts'
import {
  Backdrop,
  Basket,
  Blackboard,
  ByDepth,
  Chair,
  Crate,
  Desk,
  deskHeight,
  Footprint,
  GoalPole,
  GoalTape,
  Hall,
  holdPose,
  LOOKS,
  LowTable,
  mixLimb,
  Mountain,
  Path,
  Person,
  personRig,
  posture,
  runDepth,
  Seashore,
  walk,
  walkPrints,
  type DepthRunPlan,
  type Limb,
  type Placement,
  type Point,
  type WalkPlan,
} from '../../sceneFigures'

const CHAR = '手'

const WRITE = 0
const OFFER = 2.6
const TOOLS = 4.0
const RUN = 5.4
const BEACH = 7.8
const INK = 10.2
const DONE = 11.6
const DURATION = 12

const GROUND = 98

function Part({ t, from, to, children }: { readonly t: number; readonly from: number; readonly to: number; readonly children: ReactNode }) {
  const show = during(t, from - 0.15, to - 0.15, 0.12)
  return show > 0 ? <Layer opacity={show}>{children}</Layer> : null
}

/* ───── かく・手 を とる ───── */

const TABLE = { x: 60, y: 101.5, width: 30, height: 4.5, top: 6 } as const
/** 紙 の 上 の まる(まんなか と 半径。少し 上から 見る ので たて に ちぢむ) */
const CIRCLE: Point = [60, 94]
const circleAt = (p: number): Point => [CIRCLE[0] - 4.6 * Math.sin(p * Math.PI * 2), CIRCLE[1] - 1.5 * Math.cos(p * Math.PI * 2)]
/** ふで を にぎる 手 は、ふで の 先 の 少し 上(ふで を たてて もつ) */
const HAND_ABOVE_TIP: Point = [-0.8, -4.8]
/** 手 の おくゆき(体 の まえ へ。つくえ の 紙 の 上) */
const REACH = 9
const DRAW_FROM = 0.5
const DRAW_TO = 2.1

/** まる を q まで かいた 線 */
function drawn(q: number): string {
  if (q <= 0) return ''
  const n = Math.max(2, Math.ceil(40 * q))
  return Array.from({ length: n + 1 }, (_, i) => circleAt((q * i) / n))
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`)
    .join(' ')
}

function Write({ t }: SceneProps) {
  const q = span(t, DRAW_FROM, DRAW_TO, easeInOut)
  const tip = circleAt(q)
  const seiza = posture('seiza', 'front')
  const kid: Placement = { x: 60, y: 96, height: 46, facing: 'front', pose: { ...seiza, rightArm: { to: [tip[0] + HAND_ABOVE_TIP[0], tip[1] + HAND_ABOVE_TIP[1]], depth: REACH }, head: 4 } }
  const kidHand = personRig(kid).world.arms.right.end
  // 先生 は 子ども の 手 を とって いっしょ に かき、まる の 半分 で 手 を はなす
  const guide = span(t, 0.2, 0.5, easeInOut) * (1 - span(t, 1.3, 1.6, easeInOut))
  const lap: Limb = seiza.leftArm ?? { swing: 6, bend: -10 }
  const teacher: Placement = { x: 40, y: 95, build: 'adult', height: 60, facing: 'front', pose: { ...seiza, leftArm: mixLimb(lap, { to: [kidHand[0] - 2.2, kidHand[1] + 0.6], depth: REACH }, guide), head: 6 } }
  const line = drawn(q)
  const table = (
    <>
      <LowTable {...TABLE} paper />
      {line && <path d={line} fill="none" stroke="#2b2b2b" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />}
    </>
  )
  // かさなり: 先生 の 体 → 子ども の 体 → つくえ → 子ども の うで → 先生 の うで(とった 手 が 子ども の 手 の 上)。
  // つくえ を 子ども の held に、子ども を 先生 の held に わたすと、この じゅん に なる
  const child = <Person {...kid} look={LOOKS.girl} face={guide > 0.5 ? 'smile' : 'normal'} gazeY={1} tools={{ right: { kind: 'brush', tip } }} held={table} />
  return (
    <>
      <Hall x={54.5} width={86} top={40} floor={78} front={103} />
      <Person {...teacher} look={{ ...LOOKS.woman, glasses: true }} face={guide > 0.1 ? 'normal' : 'smile'} gaze={0.6} gazeY={guide > 0.1 ? 1 : 0} held={child} />
    </>
  )
}

/* ───── さし出す ───── */

function Offer({ t }: SceneProps) {
  const out = span(t, OFFER + 0.1, OFFER + 0.5, easeInOut)
  const a: Placement = { x: 20, y: GROUND, facing: 'front', height: 46 }
  const ha = holdPose(a, 'offer', 12)
  const b: Placement = { x: 52, y: GROUND, facing: 'right', height: 44 }
  const hb = holdPose(b, 'offer', 11)
  const c: Placement = { x: 88, y: GROUND, facing: 'back', build: 'adult', height: 56 }
  const hc = holdPose(c, 'offer', 12)
  const arms = (pose: { readonly leftArm?: Limb; readonly rightArm?: Limb }) => ({ leftArm: mixLimb({ swing: 4, bend: 8 }, pose.leftArm ?? { swing: 4, bend: 8 }, out), rightArm: mixLimb({ swing: 4, bend: 8 }, pose.rightArm ?? { swing: 4, bend: 8 }, out) })
  return (
    <>
      <Person {...a} pose={arms(ha.pose)} look={LOOKS.girl} face="smile" held={out > 0.95 ? <Crate x={ha.at[0]} y={ha.at[1]} width={12} color="#f29bb0" /> : undefined} />
      <Person {...b} pose={arms(hb.pose)} look={LOOKS.boy} face="joy" held={out > 0.95 ? <Basket x={hb.at[0]} y={hb.at[1]} width={11} items={['#e8534a', '#ffb02e']} /> : undefined} />
      <Person {...c} pose={arms(hc.pose)} look={LOOKS.man} held={out > 0.95 ? <Crate x={hc.at[0]} y={hc.at[1]} width={12} /> : undefined} />
    </>
  )
}

/* ───── 道具 ───── */

function Tools({ t }: SceneProps) {
  const board: Point = [74, 30]
  const writer: Placement = { x: 22, y: 99, facing: 'front', height: 42, pose: posture('sitChair', 'front') }
  const desk = deskHeight('child', 42)
  const pen: Point = [17 + wave(t, 0.5) * 1.2, 99 - desk - 1.6]
  const writing: Placement = { ...writer, pose: { ...writer.pose, rightArm: { to: [pen[0] - 0.6, pen[1] - 3.4], depth: 7 } } }
  return (
    <>
      <Blackboard x={56} y={14} width={48} height={26} lines={2} />
      <Chair {...writing} />
      <Person {...writing} look={LOOKS.boy} face="normal" gazeY={1} tools={{ right: { kind: 'pencil', tip: pen } }} held={<Desk x={22} y={103} width={22} height={desk + 4} top={3} />} />
      <Person x={8} y={GROUND} facing="front" height={36} look={LOOKS.little} face="joy" pose={{ rightArm: { swing: 160, bend: 12 } }} tools={{ right: { kind: 'pencil', angle: -95 } }} />
      <Person x={46} y={GROUND} facing="right" build="adult" height={58} look={{ ...LOOKS.man, glasses: true }} face="smile" pose={{ leftArm: { swing: 118, bend: 8 } }} tools={{ left: { kind: 'stick', tip: board } }} />
      <Person x={90} y={GROUND} facing="back" height={44} look={LOOKS.girl} pose={{ leftArm: { swing: 165, bend: 6 } }} tools={{ left: { kind: 'stick', angle: -90, length: 14 } }} />
    </>
  )
}

/* ───── てまえ・おく へ はしる ───── */

const TOWARD: DepthRunPlan = { from: [54.5, 74], to: [54.5, 102], start: RUN + 0.1, end: RUN + 1.5, height: 24, toHeight: 52 }
const AWAY: DepthRunPlan = { from: [38, 109], to: [38, 80], start: RUN + 1.5, end: RUN + 2.35, height: 48, toHeight: 26 }
const BREAK = RUN + 1.38

/** 地面 に ついた 足 の くつ底 の 点(すべって いれば 線 に のびる) */
function Dots({ t, plan, color }: SceneProps & { readonly plan: DepthRunPlan; readonly color: string }) {
  const dots: Point[] = []
  for (let s = plan.start; s <= Math.min(t, plan.end); s += 0.012) {
    const r = runDepth(s, plan)
    if (!r.stance || r.lift > 0) continue
    const rig = personRig(r)
    const sole = rig.world.legs[r.stance].end[1] + rig.body.footH * rig.scale
    if (Math.abs(sole - r.y) < 0.05) dots.push([rig.world.legs[r.stance].end[0], sole])
  }
  return (
    <g fill={color} opacity="0.8">
      {dots.map((d, i) => (
        <circle key={i} cx={d[0]} cy={d[1] + 0.3} r="0.45" />
      ))}
    </g>
  )
}

function Race({ t }: SceneProps) {
  const toward = runDepth(t, TOWARD)
  const away = runDepth(t, AWAY)
  const pull = span(t, BREAK - 0.25, BREAK)
  // 地面 に 立つ もの は 足もと の y の じゅん(ゴール の ポール と テープ は ポール の 足もと の 線)
  const goal = (
    <>
      {t < BREAK ? <GoalTape a={[26, 70]} b={[83, 70]} pull={[0, 4 * pull]} /> : <GoalTape a={[26, 70]} b={[83, 70]} cut={span(t, BREAK, BREAK + 0.5)} />}
      <GoalPole x={26} base={105} top={68} />
      <GoalPole x={83} base={105} top={68} />
    </>
  )
  return (
    <>
      <Path near={[54.5, 113, 30]} far={[54.5, 70, 7]} />
      <Dots t={t} plan={TOWARD} color="#e8534a" />
      <Dots t={t} plan={AWAY} color="#3c6fd6" />
      <ByDepth
        items={[
          { key: 'goal', z: 105, node: goal },
          { key: 'toward', z: toward.y, node: <Person {...toward} look={{ ...LOOKS.boy, sleeves: 'short', bottomKind: 'shorts' }} face={t < BREAK ? 'strain' : 'joy'} /> },
          { key: 'away', z: away.y, node: t >= AWAY.start ? <Person {...away} look={LOOKS.girl} face="joy" hairSway={wave(t, 0.36) * 14} /> : null },
        ]}
      />
    </>
  )
}

/* ───── 海 と 砂はま・山 ───── */

const SHORE_Y = 95
const BEACH_WALK: WalkPlan = { from: 6, to: 78, start: BEACH + 0.6, end: BEACH + 2.2, height: 40, step: 13 }
const PRINTS = walkPrints(BEACH_WALK)

function Beach({ t }: SceneProps) {
  const rise = (from: number) => span(t, from, from + 0.6, easeInOut)
  const w = walk(t, BEACH_WALK)
  return (
    <>
      <Mountain shape={{ top: [28, 22], foot: 48, half: 30 }} rise={rise(BEACH)} far snow={30} />
      <Mountain shape={{ top: [8, 34], foot: 48, half: 18, straight: 0.8 }} rise={rise(BEACH + 0.15)} />
      <Mountain shape={{ top: [96, 30], foot: 48, half: 22 }} rise={rise(BEACH + 0.3)} />
      <Seashore t={t} horizon={47} shore={70} />
      {PRINTS.map((p) => (
        <Footprint key={p.at} x={p.x} y={SHORE_Y + (p.side === 'left' ? 0.8 : -0.6)} size={6.5} facing={p.facing} kind="bare" grow={span(t, p.at, p.at + 0.25)} />
      ))}
      <Person {...w} y={SHORE_Y} look={{ ...LOOKS.boy, bottomKind: 'shorts', sleeves: 'short', hat: 'straw' }} face="smile" />
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)
  const beach = t >= BEACH - 0.15
  return (
    <>
      <Layer opacity={ink.picture}>
        {!beach && <Backdrop t={t} sun={[100, 10]} clouds={[[24, 14, 0.8]]} tufts={[]} />}
        <Part t={t} from={WRITE} to={OFFER}>
          <Write t={t} />
        </Part>
        <Part t={t} from={OFFER} to={TOOLS}>
          <Offer t={t} />
        </Part>
        <Part t={t} from={TOOLS} to={RUN}>
          <Tools t={t} />
        </Part>
        <Part t={t} from={RUN} to={BEACH}>
          <Race t={t} />
        </Part>
        <Part t={t} from={BEACH} to={DURATION + 1}>
          <Beach t={t} />
        </Part>
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Ink char={CHAR} progress={ink.progress} tint={ink.tint} />
      <Sparkles cx={54.5} cy={52} progress={ink.sparkle} />
    </>
  )
}

const scene: SceneModule = {
  char: CHAR,
  duration: DURATION,
  beats: [
    { at: WRITE, label: '正座 して ひくい つくえ の 紙 に ふで で かく(正面 で 手 を まえ へ)' },
    { at: 0.8, label: '先生 が 手 を とって いっしょ に かく' },
    { at: 1.7, label: '手 を はなして、ひとり で かく' },
    { at: OFFER, label: 'さし出す: 正面(はこ)・横(かご)・うしろむき(体 の むこう)' },
    { at: TOOLS, label: '道具: えんぴつ を 上げる・ぼう で さす・ぼう を 上げる(うしろ)・つくえ で 書く' },
    { at: RUN, label: 'てまえ へ はしる(点 が かたまれば 足 は すべっていない)' },
    { at: RUN + 0.7, label: 'てまえ へ はしる(とちゅう)' },
    { at: BREAK, label: 'テープ を きる → おく へ はしる' },
    { at: BEACH, label: '海 と 砂はま。とおく の 山 が せりあがる' },
    { at: BEACH + 1.1, label: 'はだし で あるく と 足あと が のこる' },
    { at: INK, label: '字になる', sound: 'stroke' },
  ],
  Scene,
}

export default scene
