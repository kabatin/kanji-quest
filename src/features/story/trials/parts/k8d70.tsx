/*
 * 共通部品(sceneFigures)の 見本 その3: いろいろな かっこう。
 *   node scripts/scene-sheet.mjs --variant parts --big 走
 *
 * ながれ
 *   はしる(足あと の 点: 地面の 足が すべらなければ 点が かたまる。とぶ しゅんかん は 点が ない)
 *   → いすに すわる(横・正面・うしろむき。つくえ と こくばん)
 *   → 地べた: 足を のばす・正座・しゃがむ(横 と 正面)
 *   → 物を もつ・はこぶ(かご・はこ・バケツ。あるきながら も)
 *   → ねころぶ・ひざまずく → 字「走」
 */
import type { ReactNode } from 'react'
import { during, inkTiming, wave, type SceneModule, type SceneProps } from '../../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../../sceneParts'
import {
  Backdrop,
  Basket,
  Blackboard,
  Bucket,
  Chair,
  Crate,
  Desk,
  deskHeight,
  holdPose,
  lieDown,
  LOOKS,
  Person,
  personRig,
  posture,
  Room,
  run,
  walk,
  type Facing,
  type Placement,
  type PostureName,
  type RunPlan,
} from '../../sceneFigures'

const CHAR = '走'

const RUN = 0
const SIT = 3.2
const FLOOR = 5.0
const CARRY = 6.6
const LIE = 8.4
const INK = 9.8
const DONE = 11.6
const DURATION = 12

const GROUND = 98

function Part({ t, from, to, children }: { readonly t: number; readonly from: number; readonly to: number; readonly children: ReactNode }) {
  const show = during(t, from - 0.15, to - 0.15, 0.12)
  return show > 0 ? <Layer opacity={show}>{children}</Layer> : null
}

const RUNNER: RunPlan = { from: 6, to: 100, start: RUN + 0.1, end: SIT - 0.3, height: 42 }

/** 地面に ついた 足の くつ底 の 点(すべって いれば 線に なる) */
function Footprints({ t }: SceneProps) {
  const dots: { x: number; color: string }[] = []
  for (let s = RUNNER.start; s <= Math.min(t, RUNNER.end + 0.2); s += 0.02) {
    const r = run(s, RUNNER)
    const rig = personRig({ ...r, y: GROUND })
    for (const side of ['left', 'right'] as const) {
      const sole = rig.world.legs[side].end[1] + rig.body.footH * rig.scale
      if (GROUND - sole < 0.3) dots.push({ x: rig.world.legs[side].end[0], color: side === rig.near ? '#e8534a' : '#3c6fd6' })
    }
  }
  return (
    <g>
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={GROUND + 2.6} r="0.5" fill={d.color} opacity="0.8" />
      ))}
    </g>
  )
}

function Runner({ t }: SceneProps) {
  return (
    <>
      <Footprints t={t} />
      {[0.12, 0.06].map((d) => (
        <Person key={d} {...run(t - d, RUNNER)} y={GROUND} opacity={0.2} shadow={false} />
      ))}
      <Person {...run(t, RUNNER)} y={GROUND} face="joy" look={LOOKS.girl} />
    </>
  )
}

/** いすに すわる: 横(つくえ で 書く)・正面・うしろむき(こくばん を 見る) */
function Sitting({ t }: SceneProps) {
  const side: Placement = { x: 16, y: 92, facing: 'right', pose: { ...posture('sitChair', 'right'), leftArm: { to: [27 + wave(t, 0.6) * 1.2, 77.6] }, head: 14 } }
  const desk = deskHeight('child')
  const front: Placement = { x: 52, y: 92, facing: 'front', pose: posture('sitChair', 'front') }
  const back: Placement = { x: 88, y: 99, facing: 'back', pose: posture('sitChair', 'back') }
  return (
    <>
      <Room floor={78} window={[40, 12, 26, 20]} />
      <Blackboard x={74} y={18} width={30} height={20} lines={3} />
      <Chair {...side} />
      <Person {...side} look={LOOKS.boy} face="normal" />
      <Desk x={30} y={92} width={16} height={desk} />
      <Chair {...front} />
      <Person {...front} look={LOOKS.girl} face="smile" />
      <Chair {...back} />
      <Person {...back} look={LOOKS.little} />
      <Chair {...back} layer="front" />
    </>
  )
}

const FLOORS: readonly { readonly name: PostureName; readonly facing: Facing; readonly x: number }[] = [
  { name: 'sitFloor', facing: 'right', x: 10 },
  { name: 'seiza', facing: 'right', x: 30 },
  { name: 'seiza', facing: 'front', x: 50 },
  { name: 'squat', facing: 'right', x: 70 },
  { name: 'squat', facing: 'front', x: 94 },
]

/** 地べた に すわる・正座・しゃがむ */
function Floor({ t }: SceneProps) {
  return (
    <>
      {FLOORS.map(({ name, facing, x }, i) => (
        <Person key={i} x={x} y={GROUND} facing={facing} pose={posture(name, facing)} look={i % 2 === 0 ? LOOKS.boy : LOOKS.girl} face={i === 4 ? 'surprised' : 'smile'} gaze={wave(t, 2)} />
      ))}
    </>
  )
}

/** 物を もつ: かご(横・むね)・はこ(正面)・バケツ(横・こし、あるきながら)・かご を あたま の 上(正面) */
function Carry({ t }: SceneProps) {
  const a: Placement = { x: 14, y: GROUND, facing: 'right', height: 44 }
  const ha = holdPose(a, 'chest', 12)
  const b: Placement = { x: 38, y: GROUND, facing: 'front', height: 46 }
  const hb = holdPose(b, 'chest', 13)
  const w = walk(t, { from: 56, to: 78, start: CARRY + 0.2, end: LIE - 0.4, build: 'adult', height: 54, armSwing: 6 })
  const c: Placement = { ...w, y: GROUND }
  const hc = holdPose(c, 'waist', 9)
  const d: Placement = { x: 96, y: GROUND, facing: 'front', build: 'adult', height: 52 }
  const hd = holdPose(d, 'overhead', 13)
  return (
    <>
      <Person {...a} pose={ha.pose} look={LOOKS.girl} face="smile" held={<Basket x={ha.at[0]} y={ha.at[1]} width={12} items={['#e8534a', '#ffb02e', '#e8534a']} />} />
      <Person {...b} pose={hb.pose} look={LOOKS.boy} face="normal" held={<Crate x={hb.at[0]} y={hb.at[1]} width={13} />} />
      <Person {...c} pose={{ ...w.pose, ...hc.pose }} look={LOOKS.man} face="smile" held={<Bucket x={hc.at[0]} y={hc.at[1]} width={9} water />} />
      <Person {...d} pose={hd.pose} look={LOOKS.woman} face="smile" held={<Basket x={hd.at[0]} y={hd.at[1]} width={13} handle={false} items={['#ffb02e', '#8bd69a']} />} />
    </>
  )
}

/** ねころぶ(ねむる)・ひざまずく(横・正面)・おじぎ */
function Lie({ t }: SceneProps) {
  const breath = wave(t, 1.8) * 1.2
  return (
    <>
      <Person {...lieDown({ x: 26, y: GROUND, headTo: 'left' })} face="closed" look={LOOKS.boy} pose={{ ...lieDown({ x: 26, y: GROUND }).pose, torso: breath }} />
      <Person x={52} y={GROUND} facing="right" pose={posture('kneel', 'right')} look={LOOKS.girl} face="smile" />
      <Person x={70} y={GROUND} facing="front" pose={posture('kneel', 'front')} look={LOOKS.little} face="smile" />
      <Person x={98} y={GROUND} facing="left" build="adult" height={54} pose={posture('bow', 'left')} look={LOOKS.man} face="closed" />
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)
  const indoor = t >= SIT - 0.15 && t < FLOOR - 0.15
  return (
    <>
      <Layer opacity={ink.picture}>
        {!indoor && <Backdrop t={t} sun={[13, 13]} tufts={[]} />}
        <Part t={t} from={RUN} to={SIT}>
          <Runner t={t} />
        </Part>
        <Part t={t} from={SIT} to={FLOOR}>
          <Sitting t={t} />
        </Part>
        <Part t={t} from={FLOOR} to={CARRY}>
          <Floor t={t} />
        </Part>
        <Part t={t} from={CARRY} to={LIE}>
          <Carry t={t} />
        </Part>
        <Part t={t} from={LIE} to={DURATION + 1}>
          <Lie t={t} />
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
    { at: RUN, label: 'はしる(点が かたまれば 足は すべっていない)' },
    { at: RUN + 0.8, label: 'はしる(とぶ しゅんかん は 2本とも うく)' },
    { at: RUN + 1.6, label: 'はしる(とちゅう)' },
    { at: RUN + 2.4, label: 'はしる(とまる)' },
    { at: SIT, label: 'いすに すわる: 横(つくえ)・正面・うしろむき(こくばん)' },
    { at: FLOOR, label: '足を のばす・正座(横・正面)・しゃがむ(横・正面)' },
    { at: CARRY, label: 'もつ: かご・はこ・バケツ(あるきながら)・あたま の 上' },
    { at: LIE, label: 'ねころぶ・ひざまずく(横・正面)・おじぎ' },
    { at: INK, label: '字になる', sound: 'stroke' },
  ],
  Scene,
}

export default scene
