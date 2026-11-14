/*
 * 共通部品(sceneFigures)の 見本 その2: うしろすがた・ふりむき・おくへ あるく・体格。
 *   node scripts/scene-sheet.mjs --variant parts --big 後
 *
 * ながれ
 *   うしろむき の かみがた 6つ(みじかい・ポニーテール・ふたつむすび・ボブ・はげ・おだんご)
 *   → うしろむき の うで(ばんざい・まえで 物を もつ・ゆびさす)
 *   → ふりむく(正面 → 横 → うしろ、うしろ → 横 → 正面)
 *   → おくへ あるいて 小さくなり、ふりむいて てまえ へ もどる(足あと の 点: すべらなければ 点が かたまる)
 *   → 体格: 幼児・子ども・中くらい・おとな・おとしより(正面 → 横 → うしろ)→ 字「後」
 */
import type { ReactNode } from 'react'
import { during, easeInOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../../sceneParts'
import { Backdrop, holdPose, LOOKS, mixPose, Person, personRig, posture, turnAround, walkDepth, type Build, type DepthWalkPlan, type Facing, type Look, type Placement } from '../../sceneFigures'

const CHAR = '後'

const HAIR = 0
const ARMS = 1.1
const TURN = 2.2
const AWAY = 3.6
const BACK = 5.6
const COME = 6.1
const BUILDS_AT = 8.2
const INK = 10.2
const DONE = 11.6
const DURATION = 12

const GROUND = 98

function Part({ t, from, to, children }: { readonly t: number; readonly from: number; readonly to: number; readonly children: ReactNode }) {
  const show = during(t, from, to, 0.12)
  return show > 0 ? <Layer opacity={show}>{children}</Layer> : null
}

const HAIRS: readonly { readonly look: Look; readonly build: Build }[] = [
  { look: LOOKS.boy, build: 'child' },
  { look: LOOKS.girl, build: 'child' },
  { look: LOOKS.little, build: 'child' },
  { look: LOOKS.woman, build: 'adult' },
  { look: LOOKS.elder, build: 'elder' },
  { look: LOOKS.grandma, build: 'elder' },
]

/** うしろむき の かみがた。とちゅう で 2人ずつ ふりむいて、顔 と かみ の つながり を 見せる */
function Hairs({ t }: SceneProps) {
  return (
    <>
      {HAIRS.map(({ look, build }, i) => {
        const turn = turnAround(t, HAIR + 0.55, 'back', i % 2 === 0 ? 'left' : 'right', 0.25)
        return <Person key={i} x={9 + i * 18.2} y={GROUND} build={build} height={build === 'child' ? 34 : 42} look={look} face="smile" {...(i < 2 ? turn : { facing: 'back' as Facing })} />
      })}
    </>
  )
}

/** うしろむき の うで: ばんざい・まえで かご を もつ(見えない)・ゆびさす・うしろで 手を くむ */
function Arms({ t }: SceneProps) {
  const up = span(t, ARMS + 0.1, ARMS + 0.5, easeInOut)
  const a: Placement = { x: 14, y: GROUND, facing: 'back', height: 44 }
  const holder: Placement = { x: 40, y: GROUND, facing: 'back', height: 44 }
  const hold = holdPose(holder, 'chest', 12)
  const pointer: Placement = { x: 68, y: GROUND, facing: 'back', build: 'adult', height: 56 }
  return (
    <>
      <Person {...a} pose={mixPose({}, posture('banzai', 'back'), up)} look={LOOKS.girl} />
      {/* かご は 体の むこう(せなか ごしに 見えない)。ふち だけ よこから のぞく */}
      <Person {...holder} pose={hold.pose} look={LOOKS.boy} held={<rect x={hold.at[0] - 7} y={hold.at[1] - 3} width="14" height="7" rx="1.5" fill="#c99766" />} />
      <Person {...pointer} look={LOOKS.man} pose={{ rightArm: { swing: 40 + 80 * up, bend: 0, fore: 50 }, leftArm: { swing: 6, bend: 6 } }} />
      {/* うしろで 手を くむ(手は せなか の がわ に あるので 見える) */}
      <Person x={95} y={GROUND} facing="back" height={44} look={LOOKS.little} pose={{ leftArm: { swing: 14, bend: -70, fore: -25 }, rightArm: { swing: 14, bend: -70, fore: -25 } }} />
    </>
  )
}

/** ふりむく: 正面 → 横 → うしろ と、うしろ → 横 → 正面 */
function Turns({ t }: SceneProps) {
  const a = turnAround(t, TURN + 0.2, 'front', 'back', 0.3, 'right')
  const b = turnAround(t, TURN + 0.2, 'back', 'front', 0.3, 'left')
  const c = turnAround(t, TURN + 0.5, 'right', 'back', 0.3)
  return (
    <>
      <Person x={18} y={GROUND} {...a} look={LOOKS.girl} face="smile" />
      <Person x={54.5} y={GROUND} build="adult" {...b} look={LOOKS.woman} face="joy" />
      <Person x={90} y={GROUND} build="teen" {...c} look={LOOKS.student} face="normal" />
    </>
  )
}

const AWAY_PLAN: DepthWalkPlan = { from: [54.5, 106], to: [54.5, 86], start: AWAY + 0.1, end: BACK, height: 52, toHeight: 34 }
const COME_PLAN: DepthWalkPlan = { from: [54.5, 86], to: [54.5, 106], start: COME, end: BUILDS_AT - 0.2, height: 34, toHeight: 52 }

/** あるいている 人の 地面に ついた 足の くつ底 の 点。すべって いれば 点が 線のように のびる */
function Footprints({ t, plan }: SceneProps & { readonly plan: DepthWalkPlan }) {
  const dots: { x: number; y: number; color: string }[] = []
  for (let s = plan.start; s <= Math.min(t, plan.end + 0.2); s += 0.03) {
    const w = walkDepth(s, plan)
    const rig = personRig(w)
    for (const side of ['left', 'right'] as const) {
      const sole = rig.world.legs[side].end[1] + rig.body.footH * rig.scale
      if (Math.abs(sole - w.y) < 0.3 || (!w.moving && Math.abs(sole - w.y) < 0.3)) dots.push({ x: rig.world.legs[side].end[0], y: sole, color: side === 'right' ? '#e8534a' : '#3c6fd6' })
    }
  }
  return (
    <g>
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y + 0.6} r="0.5" fill={d.color} opacity="0.8" />
      ))}
    </g>
  )
}

/** 道(おくへ 行くほど ほそい) */
function Road() {
  return <path d="M38 111 Q50 96 52.5 84 L56.5 84 Q59 96 71 111 Z" fill="#e8d9b5" />
}

function Away({ t }: SceneProps) {
  const back = t < COME
  const walking = back ? walkDepth(t, AWAY_PLAN) : walkDepth(t, COME_PLAN)
  // とおくで ふりむく(うしろ → 横 → 正面)
  const turn = t >= BACK && t < COME ? turnAround(t, BACK + 0.05, 'back', 'front', 0.2, 'right') : {}
  return (
    <>
      <Road />
      <Footprints t={t} plan={back ? AWAY_PLAN : COME_PLAN} />
      <Person {...walking} {...turn} look={LOOKS.boy} face="smile" />
    </>
  )
}

const LINEUP: readonly { readonly build: Build; readonly look: Look }[] = [
  { build: 'toddler', look: LOOKS.baby },
  { build: 'child', look: LOOKS.girl },
  { build: 'teen', look: LOOKS.student },
  { build: 'adult', look: LOOKS.man },
  { build: 'elder', look: LOOKS.grandma },
]

/** 体格を ならべる。正面 → 横 → うしろ */
function Builds({ t }: SceneProps) {
  const facing: Facing = t < BUILDS_AT + 0.6 ? 'front' : t < BUILDS_AT + 1.25 ? 'right' : 'back'
  return (
    <>
      {/* 背の めもり(10 ごと) */}
      {[40, 50, 60].map((h) => (
        <path key={h} d={`M0 ${GROUND - h} H109`} stroke="#9fb3c8" strokeWidth="0.3" strokeDasharray="1 1.4" />
      ))}
      {LINEUP.map(({ build, look }, i) => (
        <Person key={build} x={10 + i * 22} y={GROUND} build={build} facing={facing} look={look} face={i === 0 ? 'joy' : 'smile'} pose={facing === 'right' ? { leftArm: { swing: 6 + wave(t, 1.2) * 4, bend: 10 } } : {}} />
      ))}
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 9)
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[13, 13]} tufts={[]} />
        <Part t={t} from={HAIR - 0.15} to={ARMS - 0.15}>
          <Hairs t={t} />
        </Part>
        <Part t={t} from={ARMS - 0.15} to={TURN - 0.15}>
          <Arms t={t} />
        </Part>
        <Part t={t} from={TURN - 0.15} to={AWAY - 0.15}>
          <Turns t={t} />
        </Part>
        <Part t={t} from={AWAY - 0.15} to={BUILDS_AT - 0.15}>
          <Away t={t} />
        </Part>
        <Part t={t} from={BUILDS_AT - 0.15} to={DURATION + 1}>
          <Builds t={t} />
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
    { at: HAIR, label: 'うしろむき の かみがた 6つ(2人は ふりむく)' },
    { at: ARMS, label: 'うしろむき の うで: ばんざい・まえで もつ・ゆびさす・うしろで くむ' },
    { at: TURN, label: 'ふりむく: 正面→横→うしろ / うしろ→横→正面 / 横→うしろ' },
    { at: AWAY, label: 'おくへ あるく(点が かたまれば 足は すべっていない)' },
    { at: AWAY + 1, label: 'おくへ あるく(とちゅう)' },
    { at: BACK, label: 'とおくで ふりむく' },
    { at: COME, label: 'てまえ へ あるいてくる' },
    { at: COME + 1, label: 'てまえ へ(とちゅう)' },
    { at: BUILDS_AT, label: '体格: 幼児・子ども・中くらい・おとな・おとしより(正面)' },
    { at: BUILDS_AT + 0.7, label: '体格(横むき。おとしより は せなか が まるい)' },
    { at: BUILDS_AT + 1.35, label: '体格(うしろむき)' },
    { at: INK, label: '字になる', sound: 'stroke' },
  ],
  Scene,
}

export default scene
