/*
 * 共通部品(sceneFigures)の 見本 その4: 時間・へや・天気・水・火・地面・もちもの。
 *   node scripts/scene-sheet.mjs --variant parts --big 夜
 *
 * ながれ
 *   昼 → 夕方 → 夜(Backdrop の time。お日さま が しずみ、月 と 星 が 出る。たき火 が ともる)
 *   → へや(昼 と 夜。まど の 外 と かべ の 色が かわる)
 *   → 雨・雪・風
 *   → 池・川・岩・道・はたけ・田んぼ・かご・バケツ・はこ → 字「夜」
 */
import type { ReactNode } from 'react'
import { during, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../../sceneParts'
import {
  Backdrop,
  Basket,
  Bucket,
  Campfire,
  Chair,
  Crate,
  Desk,
  deskHeight,
  Field,
  Flame,
  LOOKS,
  Path,
  Person,
  Pond,
  posture,
  Rain,
  River,
  Rock,
  Room,
  Snowfall,
  Wind,
  type Placement,
} from '../../sceneFigures'

const CHAR = '夜'

const DUSK = 0
const NIGHT = 1.6
const ROOM = 3.2
const ROOM_NIGHT = 4.2
const WEATHER = 5.2
const WATER = 7.2
const INK = 9.6
const DONE = 11.4
const DURATION = 12

const GROUND = 98

function Part({ t, from, to, children }: { readonly t: number; readonly from: number; readonly to: number; readonly children: ReactNode }) {
  const show = during(t, from - 0.15, to - 0.15, 0.12)
  return show > 0 ? <Layer opacity={show}>{children}</Layer> : null
}

/** 昼 → 夕方 → 夜。お日さま が 右の おか へ しずみ、子が たき火 に あたる */
function Evening({ t }: SceneProps) {
  const time = mix(t, DUSK + 0.1, ROOM - 0.4, 0, 2)
  const sun: readonly [number, number] = [86, mix(t, DUSK, NIGHT + 0.6, 22, 84)]
  return (
    <>
      <Backdrop t={t} time={time} sun={sun} moon={[24, 16]} tufts={[8, 100]} />
      <Campfire t={t} x={58} y={95} size={0.8} lit={span(t, NIGHT - 0.6, NIGHT)} />
      <Person x={38} y={GROUND} facing="right" pose={posture('sitFloor', 'right')} look={LOOKS.boy} face={time > 1.4 ? 'smile' : 'normal'} />
      <Person x={80} y={GROUND} facing="back" build="adult" look={LOOKS.woman} />
    </>
  )
}

/** へや: 昼 と 夜。子が いす に すわって つくえ で 本を よむ */
function Indoor({ t }: SceneProps) {
  const time = t < ROOM_NIGHT ? 0 : 2
  const kid: Placement = { x: 30, y: 96, facing: 'right', pose: { ...posture('sitChair', 'right'), leftArm: { to: [44, 82] }, rightArm: { to: [45, 81.2] }, head: 12 } }
  return (
    <>
      <Room floor={80} time={time} curtain="#e8806f" window={[56, 16, 30, 24]} />
      <Chair {...kid} />
      <Person {...kid} look={LOOKS.girl} face={time > 1 ? 'closed' : 'smile'} />
      <Desk x={47} y={96} width={18} height={deskHeight('child')} />
      {/* つくえ の 上の 本 と ろうそく */}
      <path d="M41 81.4 L46 80.6 L51 81.4 L51 82.4 L46 81.8 L41 82.4 Z" fill="#ffffff" stroke="#c9b48a" strokeWidth="0.3" />
      {time > 1 && (
        <>
          <rect x="53" y="76.6" width="1.6" height="5" fill="#fff6e0" />
          <Flame t={t} x={53.8} y={76.8} size={0.25} />
        </>
      )}
    </>
  )
}

/** 雨(あとから 雪)と 風 */
function Weather({ t }: SceneProps) {
  const snow = span(t, WEATHER + 1, WEATHER + 1.2)
  return (
    <>
      <Backdrop t={t} sun={[90, 14]} overcast={1} clouds={[[10, 12, 1.4], [70, 10, 1.6]]} />
      <Rain t={t} amount={1 - snow} ground={GROUND} top={14} />
      <Snowfall t={t} amount={snow} ground={GROUND} top={14} />
      <Wind t={t} x={6} y={56} show={during(t, WEATHER + 0.4, WATER, 0.2)} />
      <Person x={70} y={GROUND} facing="left" look={LOOKS.boy} face={snow > 0 ? 'joy' : 'sad'} pose={{ rightArm: { swing: 120 + wave(t, 0.6) * 10, bend: 40 } }} />
    </>
  )
}

/** 池・川・岩・道・はたけ・田んぼ・もちもの */
function Grounds({ t }: SceneProps) {
  return (
    <>
      <Backdrop t={t} sun={[13, 13]} tufts={[]} />
      <River t={t} y={62} width={8} />
      <Field x={4} y={72} width={34} depth={9} kind="paddy" grow={span(t, WATER, WATER + 0.8)} />
      <Field x={70} y={72} width={34} depth={9} kind="crop" grow={span(t, WATER + 0.2, WATER + 1)} />
      <Path near={[54.5, 111, 9]} far={[54.5, 72, 2.5]} bend={3} />
      <Pond t={t} x={24} y={92} rx={14} ry={4} />
      <Rock x={86} y={95} size={6} grow={span(t, WATER + 0.3, WATER + 0.8)} />
      <Rock x={94} y={97} size={3} grow={span(t, WATER + 0.4, WATER + 0.9)} />
      <Basket x={60} y={96} width={8} items={['#e8534a', '#ffb02e']} />
      <Bucket x={70} y={96} width={6} water />
      <Crate x={44} y={96} width={8} />
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)
  return (
    <>
      <Layer opacity={ink.picture}>
        <Part t={t} from={DUSK} to={ROOM}>
          <Evening t={t} />
        </Part>
        <Part t={t} from={ROOM} to={WEATHER}>
          <Indoor t={t} />
        </Part>
        <Part t={t} from={WEATHER} to={WATER}>
          <Weather t={t} />
        </Part>
        <Part t={t} from={WATER} to={DURATION + 1}>
          <Grounds t={t} />
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
    { at: DUSK, label: '昼 → 夕方(Backdrop の time)' },
    { at: NIGHT, label: '夜: 月・星・たき火' },
    { at: ROOM, label: 'へや(昼): いす・つくえ・まど・カーテン' },
    { at: ROOM_NIGHT, label: 'へや(夜): まど の 外 が 夜、ろうそく' },
    { at: WEATHER, label: '雨 と 風' },
    { at: WEATHER + 1.2, label: '雪' },
    { at: WATER, label: '川・池・道・田んぼ・はたけ・岩・かご・バケツ・はこ' },
    { at: INK, label: '字になる', sound: 'stroke' },
  ],
  Scene,
}

export default scene
