/*
 * 共通部品(sceneFigures)の 見本。字の 場面 ではなく、部品を 目で たしかめる ための ページ。
 *   node scripts/scene-sheet.mjs --variant parts --big 人
 *
 * ながれ
 *   子ども 3つの 向き(顔が かわる)→ おとな 3つの 向き
 *   → あるき(足あと の 点: 地面の 足が すべらなければ、点が 1か所に かたまる)
 *   → いろいろな ポーズ(手を とどかせる・ばんざい・すわる・おじぎ・ひざまずく)
 *   → 背景と 生きもの と しるし → 字「人」
 */
import type { ReactNode } from 'react'
import { during, easeInOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../../sceneParts'
import {
  Backdrop,
  Bird,
  Butterfly,
  ByDepth,
  CLOTHES,
  Dust,
  Flower,
  Hearts,
  House,
  LOOKS,

  mixPose,
  Notice,
  Person,
  personRig,
  PineTree,
  Sigh,
  Sweat,
  Tree,
  walk,
  type Expression,
  type WalkPlan,
} from '../../sceneFigures'

const CHAR = '人'

const KIDS = 0
const ADULTS = 1.6
const WALK = 3.2
const WALK_END = 6.2
const REACH = 6.4
const SIT = 7.6
const SCENERY = 8.8
const INK = 9.8
const DONE = 11.6
const DURATION = 12

const GROUND = 98
const FACES: readonly Expression[] = ['normal', 'smile', 'joy', 'surprised', 'sad', 'closed']

/** その場面の 区間だけ 見せる */
function Part({ t, from, to, children }: { readonly t: number; readonly from: number; readonly to: number; readonly children: ReactNode }) {
  const show = during(t, from, to, 0.12)
  return show > 0 ? <Layer opacity={show}>{children}</Layer> : null
}

/** 子ども: 右むき・正面・左むき。顔は 時間で かわる */
function Kids({ t }: SceneProps) {
  const face = FACES[Math.min(FACES.length - 1, Math.floor(span(t, KIDS, ADULTS) * FACES.length))]
  return (
    <>
      <Person x={20} y={GROUND} facing="right" face={face} />
      <Person x={54.5} y={GROUND} facing="front" face={face} look={LOOKS.girl} />
      <Person x={89} y={GROUND} facing="left" face={face} look={LOOKS.little} />
    </>
  )
}

function Adults({ t }: SceneProps) {
  const face = FACES[Math.min(FACES.length - 1, Math.floor(span(t, ADULTS, WALK) * FACES.length))]
  return (
    <>
      <Person x={20} y={GROUND} build="adult" facing="right" face={face} look={LOOKS.woman} />
      <Person x={54.5} y={GROUND} build="adult" facing="front" face={face} look={LOOKS.man} />
      <Person x={89} y={GROUND} build="adult" facing="left" face={face} look={LOOKS.elder} />
    </>
  )
}

const WALKER: WalkPlan = { from: 8, to: 101, start: WALK + 0.1, end: WALK_END - 0.2, height: 42 }

/** 地面に ついた 足の くつ底 の 点。すべって いれば 点が 線のように のびる */
function Footprints({ t }: SceneProps) {
  const dots: { x: number; color: string }[] = []
  for (let s = WALKER.start; s <= Math.min(t, WALKER.end + 0.2); s += 0.03) {
    const w = walk(s, WALKER)
    const rig = personRig({ ...w, y: GROUND })
    for (const side of ['left', 'right'] as const) {
      const foot = rig.world.legs[side].end
      // くつ底 が 地面に ついている 足だけ(うく 足 は 入れない)
      if (GROUND - (foot[1] + rig.body.footH * rig.scale) < 0.3) {
        dots.push({ x: foot[0], color: side === rig.near ? '#e8534a' : '#3c6fd6' })
      }
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

function Walker({ t }: SceneProps) {
  const w = walk(t, WALKER)
  // うしろに うすく 前の しゅんかん を かさねる(うく 足が まえへ 出ていく のが 見える)
  const ghosts = [0.16, 0.08]
  return (
    <ByDepth
      items={[
        { key: 'tree', z: 94, node: <Tree x={70} y={94} height={56} grow={1} sway={wave(t, 3.4) * 1.3} fruit /> },
        {
          key: 'walker',
          z: GROUND,
          node: (
            <>
              {ghosts.map((d) => (
                <Person key={d} {...walk(t - d, WALKER)} y={GROUND} opacity={0.22} shadow={false} face="smile" />
              ))}
              <Person {...w} y={GROUND} face="smile" look={{ top: CLOTHES.yellow.top }} />
            </>
          ),
        },
      ]}
    />
  )
}

/** 手を とどかせる(星に)・正面で ばんざい */
function Reach({ t }: SceneProps) {
  // 星は 手の とどく ところ を 上から 下へ うごく(てまえ の 手が おいかける)
  const star: readonly [number, number] = [mix(t, REACH, SIT, 30, 36), mix(t, REACH, SIT, 50, 74)]
  const up = span(t, REACH + 0.2, REACH + 0.7, easeInOut)
  const banzai = mixPose({}, { leftArm: { swing: 150, bend: 15 }, rightArm: { swing: 150, bend: 15 } }, up)
  return (
    <>
      <Star cx={star[0]} cy={star[1]} r={2.6} color="#ffc233" spin={t * 60} />
      <Person x={20} y={GROUND} facing="right" face="surprised" pose={{ leftArm: { to: star }, rightArm: { to: [star[0] - 4, star[1] + 6] }, head: -10 }} />
      <Person x={80} y={GROUND} build="adult" facing="front" face="joy" look={LOOKS.woman} pose={banzai} lift={Math.max(0, wave(t, 0.5)) * 3 * up} />
    </>
  )
}

/** すわる(こしかけ)・おじぎ・ひざまずく */
function Poses({ t }: SceneProps) {
  const bow = span(t, SIT + 0.2, SIT + 0.6, easeInOut) * (1 - span(t, SIT + 0.9, SIT + 1.1))
  return (
    <>
      {/* きりかぶ に こしかける: ももは まえへ 90度、ひざ も 90度 */}
      {/* きりかぶ の 高さ は 子どもの すね と くつ の ぶん(98 - 0.44 × 19.5 ≒ 89.4) */}
      <rect x="6" y="89.4" width="13" height="8.6" rx="1.6" fill="#a5764b" />
      <ellipse cx="12.5" cy="89.4" rx="6.5" ry="1.5" fill="#c99766" />
      <Person x={14} y={GROUND} facing="right" face="smile" look={LOOKS.girl} pose={{ leftLeg: { swing: 88, bend: 90 }, rightLeg: { swing: 92, bend: 92 }, leftArm: { swing: 40, bend: 30 }, rightArm: { swing: 30, bend: 40 } }} />
      <Person x={55} y={GROUND} build="adult" facing="left" face="closed" look={LOOKS.man} pose={{ torso: 45 * bow, head: 10 * bow, leftArm: { swing: 0, bend: 10 }, rightArm: { swing: 0, bend: 10 } }} />
      <Person x={88} y={GROUND} facing="left" face="normal" look={LOOKS.little} pose={{ leftLeg: { swing: 0, bend: 90 }, rightLeg: { swing: 0, bend: 92 }, leftArm: { swing: 25, bend: 60 }, rightArm: { swing: 35, bend: 60 } }} />
    </>
  )
}

/** 背景の 部品・生きもの・しるし */
function Scenery({ t }: SceneProps) {
  const p = span(t, SCENERY, INK)
  return (
    <>
      <PineTree x={14} y={95} height={44} grow={span(t, SCENERY, SCENERY + 0.5)} sway={wave(t, 3) * 1.2} />
      <House x={88} y={95} width={22} grow={span(t, SCENERY + 0.1, SCENERY + 0.6)} light={span(t, SCENERY + 0.5, SCENERY + 0.7)} />
      <Flower x={30} y={98} grow={span(t, SCENERY + 0.2, SCENERY + 0.7)} sway={wave(t, 2.6) * 4} />
      <Flower x={66} y={99} color="#ffffff" grow={span(t, SCENERY + 0.3, SCENERY + 0.8)} sway={wave(t, 2.6, 1) * 4} />
      <Bird x={110 - p * 60} y={18 + wave(t, 1.2) * 2} t={t} flying />
      <Bird x={88} y={58.5} t={t} facing="right" />
      <Butterfly x={36 + wave(t, 1.6) * 6} y={60 + wave(t, 0.9) * 3} t={t} />
      <Person x={50} y={GROUND} facing="right" face="sad" look={LOOKS.boy} />
      <Sweat t={t} x={44} y={66} show={during(t, SCENERY, SCENERY + 0.5, 0.1)} />
      <Sigh x={56} y={73} p={span(t, SCENERY + 0.5, SCENERY + 0.9)} show={during(t, SCENERY + 0.5, SCENERY + 0.9, 0.1)} dir={1} />
      <Hearts t={t} x={58} y={60} show={during(t, SCENERY + 0.6, INK, 0.1)} />
      <Notice x={51} y={66} r={6.4} show={during(t, SCENERY, SCENERY + 0.5, 0.1)} dir={1} />
      <Dust x={88} y={95} p={span(t, SCENERY + 0.1, SCENERY + 0.8)} reach={12} />
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 2)
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[13, 13]} tufts={[]} />
        <Part t={t} from={KIDS} to={ADULTS}>
          <Kids t={t} />
        </Part>
        <Part t={t} from={ADULTS} to={WALK}>
          <Adults t={t} />
        </Part>
        <Part t={t} from={WALK} to={WALK_END}>
          <Footprints t={t} />
          <Walker t={t} />
        </Part>
        <Part t={t} from={REACH} to={SIT}>
          <Reach t={t} />
        </Part>
        <Part t={t} from={SIT} to={SCENERY}>
          <Poses t={t} />
        </Part>
        <Part t={t} from={SCENERY} to={DURATION + 1}>
          <Scenery t={t} />
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
    { at: KIDS, label: '子ども: 右むき・正面・左むき(顔が かわる)' },
    { at: ADULTS, label: 'おとな: 女の人・男の人・おとしより' },
    { at: WALK, label: 'あるき: 点が かたまれば 足は すべっていない' },
    { at: WALK + 1, label: 'あるき(とちゅう)' },
    { at: WALK + 2, label: 'あるき(とまる)' },
    { at: REACH, label: '手を 星に とどかせる・ばんざい' },
    { at: SIT, label: 'こしかける・おじぎ・ひざまずく' },
    { at: SCENERY, label: '背景・生きもの・しるし' },
    { at: INK, label: '字になる', sound: 'stroke' },
  ],
  Scene,
}

export default scene
