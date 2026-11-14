/*
 * 通(とおる): ゆうやけの みちを すすんで、ちょうちんの ともる いえの まえを とおりぬける。(共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)
 *   1画目(ノ… ) … いえの やね の ひさし(よこに のびた はり)
 *   2画目(丶)  … ひさし から さがる ちょうちん
 *   3画目(丨)  … いえの 左の はしら
 *   4画目(冂)  … いえの かべ の わく(うえの はり・右の はしら)
 *   5・6画目   … 戸の 2本の よこざん(よこの さん)
 *   7画目(丨)  … 戸の まんなかの はしら
 *   8画目(丶)  … 左うえから とんでくる 小鳥(とぶ むき)
 *   9画目       … おかを くだる うねうね道
 *   10画目      … いえの まえを のびる まっすぐな みち
 *
 * ながれ
 *   ゆうやけ。子どもが おかの上で、日が しずむのを 見て しんぱい(あせ)
 *   → うねうね道を いそいで くだる → 道の とちゅうで 立ちどまると、ちょうちんが ぽっと ともる
 *   → ほっとして えがお。まっすぐな 道を すすんで、いえの まえを とおりぬける
 *   → むこうまで ついて 「ばんざい!」(小鳥も とんでくる)
 *   → ほね が ひかって、絵が うすくなり、字「通」が のこる
 *
 * 子は ランドセルの Person。うねうね道は 何本かの まっすぐな 道に わけて、横は walk、たてに くだる ところは
 * walkDepth であるく(曲がりかどで 体の むきは turnAround)。道は 絵の「みち」として そのまま 字の 10画目と 9画目に 重なる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Bird, LOOKS, mixPose, Person, posture, Sweat, Tuft, turnAround, walk, walkDepth, type Facing, type PersonProps, type Point } from '../sceneFigures'

const CHAR = '通'

const GRASS = '#c5e8a9'
const MOUND ='#a8dc86'
const MOUND_LIGHT = '#bfe8a0'
const ROAD = '#ecd3a2'
const ROAD_EDGE = '#d9b97f'
const WALL = '#d9b98a'
const WALL_LIT = '#ffe9a8'
const WOOD = '#8c5b3c'
const WOOD_DARK = '#70452b'
const ROOF = '#c25b43'
const ROOF_DARK = '#a8472f'
const STEP = '#b8b2a6'
const LAMP_DIM = '#c9b28a'
const LAMP_LIT = '#ffd24a'
const DUSK = '#6b7fb8'
/** 子どもの 見た目: 赤い 服 と 黄色い ランドセル */
const KID_LOOK = { ...LOOKS.boy, top: '#f0705a' } as const
const KID_PACK = { kind: 'randoseru', color: '#ffd24a' } as const

/** くぎり の時間(秒) */
const WALK_A = 1.4
const PAUSE_A = 3.4
const LAMP = 3.5
const WALK_B = 4.0
const ARRIVE = 6.0
const INK = 6.6
const DONE = 10.0
const DURATION = 10.4

const KID_H = 40
/** 曲がりかどで 体の むきを かえる 時間(秒) */
const TURN = 0.2

/* ───────── 道すじ: まっすぐな 区間(leg)に わける ───────── */

type Leg = {
  /** side = 横から(walk)/ depth = 手まえへ(walkDepth) */
  readonly kind: 'side' | 'depth'
  readonly from: Point
  readonly to: Point
  /** 横の 区間で、x から y を もとめる 道の 折れ線(x の じゅん) */
  readonly line: readonly Point[]
}

const straight = (kind: Leg['kind'], from: Point, to: Point): Leg => ({ kind, from, to, line: [from, to] })

/** おか の うねうね道(9画目)の 区間。たてに くだる ところ は depth */
const TRAIL_LEGS: readonly Leg[] = [
  { kind: 'side', from: [10.8, 52], to: [27.2, 47], line: [[10.8, 52], [19.3, 50.1], [27.2, 47]] },
  straight('depth', [27.2, 47], [24.1, 63.5]),
  straight('side', [24.1, 63.5], [29.6, 70.2]),
  { kind: 'side', from: [29.6, 70.2], to: [14.5, 80.8], line: [[29.6, 70.2], [22.1, 75.5], [14.5, 80.8]] },
  straight('side', [14.5, 80.8], [21.4, 82.4]),
]
/** まっすぐな みち(10画目)。立ちどまった ところ から 右へ */
const STREET_LEG: Leg = { kind: 'side', from: [21.4, 82.4], to: [90.5, 93.1], line: [[21.4, 82.4], [33.7, 83.9], [45, 86.5], [56.2, 89.5], [67.5, 92.3], [78.9, 93.8], [90.5, 93.1]] }

const chord = (leg: Leg) => Math.hypot(leg.to[0] - leg.from[0], leg.to[1] - leg.from[1])
const TRAIL_TOTAL = TRAIL_LEGS.reduce((sum, leg) => sum + chord(leg), 0)

type Timed = Leg & { readonly start: number; readonly end: number }

/** 区間ごとの 時間(長さに 比例)。おかを くだる あいだ → 立ちどまる → まっすぐな みち */
const LEGS: readonly Timed[] = [
  ...TRAIL_LEGS.reduce<{ readonly done: number; readonly list: readonly Timed[] }>(
    (acc, leg) => {
      const a = WALK_A + (acc.done / TRAIL_TOTAL) * (PAUSE_A - WALK_A)
      const b = WALK_A + ((acc.done + chord(leg)) / TRAIL_TOTAL) * (PAUSE_A - WALK_A)
      return { done: acc.done + chord(leg), list: [...acc.list, { ...leg, start: a, end: b }] }
    },
    { done: 0, list: [] },
  ).list,
  { ...STREET_LEG, start: WALK_B, end: ARRIVE },
]

/** 道の 折れ線 の上で、x の ときの y */
function lineY(line: readonly Point[], x: number): number {
  const i = line.findIndex((p, k) => k > 0 && (x - line[k - 1][0]) * (x - p[0]) <= 0)
  if (i < 1) return x <= Math.min(line[0][0], line[line.length - 1][0]) ? (line[0][0] < line[line.length - 1][0] ? line[0][1] : line[line.length - 1][1]) : line[line.length - 1][1]
  const [x0, y0] = line[i - 1]
  const [x1, y1] = line[i]
  return x1 === x0 ? y0 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
}

const facingOf = (leg: Leg): Facing => (leg.kind === 'depth' ? 'front' : leg.to[0] >= leg.from[0] ? 'right' : 'left')

/** 区間の ふつうの あるき(いそぎあし) */
function stepOn(t: number, leg: Timed, start: number): PersonProps {
  if (leg.kind === 'depth') {
    const w = walkDepth(t, { from: leg.from, to: leg.to, start, end: leg.end, height: KID_H, steps: 4 })
    return { ...w, x: w.x, y: w.y }
  }
  const w = walk(t, { from: leg.from[0], to: leg.to[0], start, end: leg.end, height: KID_H, step: 13, armSwing: 30 })
  return { ...w, y: lineY(leg.line, w.x) }
}

/** その しゅんかん の 子の いち・むき・ポーズ。曲がりかど では その場で むきを かえる */
function kidAt(t: number): PersonProps {
  const i = LEGS.reduce((found, leg, k) => (leg.start <= t ? k : found), 0)
  const leg = LEGS[i]
  const prev = i > 0 ? facingOf(LEGS[i - 1]) : null
  const turning = prev !== null && prev !== facingOf(leg) && t < leg.start + TURN
  if (turning) {
    const turn = turnAround(t, leg.start, prev, facingOf(leg), TURN)
    return { x: leg.from[0], y: leg.from[1], build: 'child', height: KID_H, facing: turn.facing, squash: turn.squash }
  }
  return stepOn(t, leg, prev !== null && prev !== facingOf(leg) ? leg.start + TURN : leg.start)
}

/* ───────── けしき ───────── */

function Ground({ t }: SceneProps) {
  // はじめから おかと 道は 見えている(いきなり まっ白に しない)
  const appear = 0.35 + 0.65 * span(t, 0, 0.5, easeOut)
  // 日が しずんでいく(しんぱいの わけ)
  const sunY = mix(t, 0, LAMP, 24, 44, easeInOut)
  return (
    <Layer opacity={appear}>
      <Backdrop t={t} sun={[96, sunY]} ground={78} time={mix(t, 0, LAMP, 0.3, 0.7)} tufts={[]} clouds={[[30, 14, 0.8]]} />
      <rect x="-2" y="76" width="113" height="34" fill={GRASS} />
      {[3, 91, 103].map((x) => (
        <Tuft key={x} x={x} y={82} />
      ))}
      {/* おか(うねうね道の うしろ) */}
      <path d="M-2 109 V56 Q8 44 24 42 Q36 44 40 62 Q44 76 52 84 L52 109 Z" fill={MOUND} />
      <path d="M-2 62 V56 Q8 44 24 42 Q16 46 8 54 Q2 58 -2 62 Z" fill={MOUND_LIGHT} />
      {/* 道: ふち の こい色を 下に、道の色を 上に */}
      <Bone char={CHAR} n={9} color={ROAD_EDGE} width={5.2} />
      <Bone char={CHAR} n={10} color={ROAD_EDGE} width={8.2} />
      <Bone char={CHAR} n={9} color={ROAD} width={3.4} />
      <Bone char={CHAR} n={10} color={ROAD} width={6.2} />
    </Layer>
  )
}

/** いえ: やね・かべ・格子の戸・ちょうちん */
function House({ t }: SceneProps) {
  const grow = span(t, 0.1, 0.9, backOut)
  const lamp = span(t, LAMP, LAMP + 0.4, easeOut)
  const pop = Math.max(0, backOut(span(t, LAMP, LAMP + 0.5)))
  const sway = wave(t, 2.6) * 2.5
  return (
    <Layer scaleY={Math.max(grow, 0)} scaleX={0.8 + 0.2 * Math.min(grow, 1)} origin={[62.5, 77]}>
      {/* かべ(やね の下から 土間まで) */}
      <rect x="45" y="15" width="36.8" height="62" fill={WALL} />
      <rect x="45" y="15" width="36.8" height="62" fill={WALL_LIT} opacity={lamp * 0.55} />
      <rect x="41" y="76.5" width="45" height="4" rx="1.2" fill={STEP} />
      {/* やね: したの へり が 1画目の ひさし */}
      <path d="M38.5 18 L46 5 Q58 2 69 2.6 L77.5 14 Z" fill={ROOF} />
      <path d="M46 5 Q58 2 69 2.6 L70.6 5.2 Q58 4.6 47.6 7.6 Z" fill={ROOF_DARK} />
      <Bone char={CHAR} n={1} color={WOOD_DARK} width={5} to={0.62} />
      {/* かべの わく と 格子の戸 */}
      <Bone char={CHAR} n={4} color={WOOD} width={3.4} to={0.88} />
      <Bone char={CHAR} n={5} color={WOOD} width={2.6} />
      <Bone char={CHAR} n={6} color={WOOD} width={2.6} />
      <Bone char={CHAR} n={3} color={WOOD_DARK} width={3.4} />
      <Bone char={CHAR} n={7} color={WOOD_DARK} width={2.6} />
      {/* ちょうちん: ひさし から さがって、ともると ぽっと ひかる(2画目) */}
      <Layer rotate={sway} origin={[58.5, 17]}>
        <path d="M58.5 16.4 V23.4" stroke={WOOD_DARK} strokeWidth="0.9" strokeLinecap="round" />
        <circle cx="58.5" cy="27.4" r={6.5 + 5 * pop} fill={LAMP_LIT} opacity={0.3 * lamp} />
        <rect x="55.6" y="22.8" width="5.8" height="1.6" rx="0.8" fill={WOOD_DARK} />
        <ellipse cx="58.5" cy="27.6" rx="3.5" ry="4.2" fill={LAMP_DIM} />
        <ellipse cx="58.5" cy="27.6" rx="3.5" ry="4.2" fill={LAMP_LIT} opacity={lamp} />
        <path d="M55.5 27.6 H61.5" stroke={WOOD_DARK} strokeWidth="0.5" opacity="0.5" />
        <rect x="56" y="31.2" width="5" height="1.4" rx="0.7" fill={WOOD_DARK} />
      </Layer>
    </Layer>
  )
}

/** ゆうぐれの くらさ。ちょうちん が ともると、少し あかるくなる */
function Dusk({ t }: SceneProps) {
  const dim = t < LAMP ? mix(t, 0, LAMP, 0.08, 0.3) : mix(t, LAMP, LAMP + 1, 0.3, 0.1)
  return <rect x="0" y="0" width="109" height="109" fill={DUSK} opacity={dim} />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 10)

  const kid = kidAt(t)
  const worried = t < LAMP
  // うつむく → ちょうちんを 見上げる → まえを むく → ばんざい(こちらを むいて ぴょん)
  const lookUp = during(t, PAUSE_A - 0.1, WALK_B + 0.2, 0.3)
  const cheerTurn = turnAround(t, ARRIVE + 0.05, 'right', 'front', 0.3)
  const cheer = span(t, ARRIVE + 0.4, ARRIVE + 0.7, easeOut)
  const hop = t >= ARRIVE + 0.4 ? Math.abs(wave(t - ARRIVE - 0.4, 0.6)) * 3 : 0
  const base = t >= ARRIVE + 0.05 ? { ...kid, facing: cheerTurn.facing, squash: cheerTurn.squash } : kid
  const pose = cheer > 0 ? mixPose({}, posture('banzai', 'front'), cheer) : { ...kid.pose, head: -lookUp * 14 }
  const face = worried ? 'worried' : t < ARRIVE ? 'smile' : 'joy'
  const appear = span(t, 0.4, 0.8, backOut)

  // 小鳥(8画目の とぶ むき): 左うえから 右したへ
  const fly = span(t, 4.8, INK - 0.1, easeOut)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <House t={t} />
        <Dusk t={t} />
        <Layer opacity={span(t, 0.4, 0.6)}>
          <Layer scale={Math.max(appear, 0)} origin={[base.x, base.y]}>
            <Person {...base} pose={pose} lift={hop} look={KID_LOOK} pack={KID_PACK} face={face} />
          </Layer>
          <Sweat t={t} x={base.x + 5} y={base.y - KID_H} show={worried ? during(t, 0.7, LAMP, 0.2) : 0} dir={base.facing === 'left' ? 1 : -1} />
        </Layer>
        {fly > 0 && (
          <Layer x={-6 + fly * 31} y={10 + fly * 15.5} rotate={27}>
            <Bird x={0} y={0} t={t} flying facing="right" size={1.1} color="#5aaee8" dark="#3f8fcb" />
          </Layer>
        )}
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
    { at: 0, label: 'ゆうやけ。子どもが おかの上で しんぱい', sound: 'pop' },
    { at: WALK_A, label: 'うねうね道を いそいで くだる' },
    { at: LAMP, label: '立ちどまると ちょうちんが ぽっと ともる', sound: 'pop' },
    { at: WALK_B, label: 'ほっとして、道を すすんで いえの まえを とおる' },
    { at: ARRIVE, label: 'とおりぬけて ばんざい', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '通 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
