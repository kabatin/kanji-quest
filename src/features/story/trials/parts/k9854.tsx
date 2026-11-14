/*
 * 共通部品(sceneFigures)の 見本 その5: 顔・目線・ぼうし・めがね・せおう かばん・かみ の ゆれ。
 *   node scripts/scene-sheet.mjs --variant parts --big 顔
 *
 * ながれ
 *   足した 顔 5つ(こまった・おこった・なく・ねむい・ぐっ)を 正面(上の れつ)と 横(下の れつ)で
 *   → 目線 の 上下(上を 見る・まっすぐ・下を 見る。横むき も)
 *   → ぼうし 4つ と めがね(正面 → 横 → うしろ)
 *   → かばん: 体格 4つ が ふりむく(正面 → 横 → うしろ → 横。とちゅう の ちぢみ でも ずれない)
 *   → かばん を せおって あるく(横 → ふりむいて おくへ / てまえ へ くる)
 *   → かみ の ゆれ(はしる・てまえ へ はしる)と「?」→ 字「顔」
 */
import type { ReactNode } from 'react'
import { during, inkTiming, wave, type SceneModule, type SceneProps } from '../../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../../sceneParts'
import { Backdrop, Bird, Flower, LOOKS, Person, personRig, Question, run, runDepth, turnAround, walk, walkDepth, type Build, type Expression, type Facing, type Look, type PackKind, type PersonPose } from '../../sceneFigures'

const CHAR = '顔'

const FACES = 0
const GAZE = 1.4
const HATS = 2.8
const PACK_TURN = 4.6
const PACK_WALK = 6.4
const SWAY = 8.4
const INK = 10.2
const DONE = 11.6
const DURATION = 12

const GROUND = 98
/** 上の れつ の 地面 */
const SHELF = 52

function Part({ t, from, to, children }: { readonly t: number; readonly from: number; readonly to: number; readonly children: ReactNode }) {
  const show = during(t, from - 0.15, to - 0.15, 0.12)
  return show > 0 ? <Layer opacity={show}>{children}</Layer> : null
}

const MORE: readonly Expression[] = ['worried', 'angry', 'cry', 'sleepy', 'strain']
const KIDS: readonly Look[] = [LOOKS.boy, LOOKS.girl, LOOKS.little, LOOKS.student, LOOKS.studentGirl]

/** 足した 顔: 上の れつ は 正面、下の れつ は 横むき */
function Faces() {
  return (
    <>
      <rect x="-2" y={SHELF} width="113" height="2" fill="#d8eec4" />
      {MORE.map((face, i) => (
        <Person key={`front-${face}`} x={11 + i * 21.6} y={SHELF} height={40} facing="front" face={face} look={KIDS[i]} />
      ))}
      {MORE.map((face, i) => (
        <Person key={`side-${face}`} x={11 + i * 21.6} y={GROUND} build={i === 1 ? 'adult' : 'child'} height={i === 1 ? 46 : 40} facing="right" face={face} look={i === 1 ? LOOKS.man : KIDS[i]} />
      ))}
    </>
  )
}

/** 目線 の 上下: 小鳥 を 見上げる・まっすぐ・花 を 見下ろす。まん中 の 子 は 目線 が 上下 左右 に うごく */
function Gaze({ t }: SceneProps) {
  return (
    <>
      <Bird x={12} y={30} t={t} facing="right" />
      <Person x={14} y={GROUND} facing="front" face="surprised" gazeY={-1} look={LOOKS.girl} />
      <Person x={36} y={GROUND} facing="front" face="normal" gaze={wave(t, 1.6)} gazeY={wave(t, 0.9)} look={LOOKS.boy} />
      <Person x={58} y={GROUND} facing="front" face="worried" gazeY={1} look={LOOKS.little} />
      <Flower x={64} y={GROUND} />
      <Person x={80} y={GROUND} build="adult" facing="front" face="normal" gazeY={1} look={LOOKS.woman} pose={{ head: 4 }} />
      <Person x={100} y={GROUND} facing="left" face="sad" gazeY={1} look={LOOKS.student} build="teen" pose={{ head: 12 }} />
    </>
  )
}

const HATTED: readonly { readonly look: Look; readonly build: Build }[] = [
  { look: { ...LOOKS.boy, hat: 'cap' }, build: 'child' },
  { look: { ...LOOKS.little, hat: 'school' }, build: 'child' },
  { look: { ...LOOKS.girl, hat: 'straw' }, build: 'child' },
  { look: { ...LOOKS.woman, hat: 'knit' }, build: 'adult' },
  { look: { ...LOOKS.man, glasses: true }, build: 'adult' },
  { look: { ...LOOKS.grandma, glasses: true, hat: 'straw', hatColor: '#d9c08a' }, build: 'elder' },
]

/** 正面 → 横 → うしろ と ふりむく(ふりむき の とちゅう も 見る) */
function staged(t: number, at: number, step: number): { readonly facing: Facing; readonly squash: number } {
  if (t < at + step) return turnAround(t, at, 'front', 'right', 0.3)
  if (t < at + step * 2) return turnAround(t, at + step, 'right', 'back', 0.3)
  return turnAround(t, at + step * 2, 'back', 'left', 0.3)
}

function Hats({ t }: SceneProps) {
  const turn = staged(t, HATS + 0.4, 0.6)
  return (
    <>
      {HATTED.map(({ look, build }, i) => (
        <Person key={i} x={9 + i * 18.2} y={GROUND} build={build} height={build === 'child' ? 40 : 48} look={look} face="smile" {...turn} />
      ))}
    </>
  )
}

const PACKERS: readonly { readonly build: Build; readonly look: Look; readonly pack: PackKind }[] = [
  { build: 'toddler', look: LOOKS.baby, pack: 'randoseru' },
  { build: 'child', look: LOOKS.boy, pack: 'randoseru' },
  { build: 'teen', look: LOOKS.studentGirl, pack: 'rucksack' },
  { build: 'adult', look: LOOKS.man, pack: 'rucksack' },
]

/** かばん を せおった 4人 が ふりむく。うしろむき で、おとな は うで を うしろ(見る人 の ほう)へ 大きく ふる(かばん の まえ) */
function PackTurn({ t }: SceneProps) {
  const turn = staged(t, PACK_TURN + 0.3, 0.55)
  const behind: PersonPose = turn.facing === 'back' ? { rightArm: { swing: 12, bend: 10, fore: -60 } } : {}
  return (
    <>
      {PACKERS.map(({ build, look, pack }, i) => (
        <Person key={build} x={13 + i * 27} y={GROUND} build={build} look={look} pack={pack} face="smile" pose={i === 3 ? behind : {}} {...turn} />
      ))}
    </>
  )
}

/** かばん を せおって あるく: 横 → ふりむいて おくへ。リュック の おとな は おく から てまえ へ */
function PackWalk({ t }: SceneProps) {
  const side = walk(t, { from: -8, to: 30, start: PACK_WALK + 0.05, end: PACK_WALK + 0.9, height: 42 })
  const turn = turnAround(t, PACK_WALK + 0.95, 'right', 'back', 0.3)
  const away = walkDepth(t, { from: [30, GROUND], to: [34, 84], start: PACK_WALK + 1.3, end: PACK_WALK + 2.0, height: 42, toHeight: 30 })
  const kid = t < PACK_WALK + 1.3 ? { ...side, y: GROUND, ...(t > PACK_WALK + 0.9 ? turn : {}) } : away
  const come = walkDepth(t, { from: [80, 82], to: [80, GROUND], start: PACK_WALK + 0.1, end: PACK_WALK + 1.9, build: 'adult', height: 36, toHeight: 54 })
  return (
    <>
      <Person {...come} look={{ ...LOOKS.woman, hat: 'cap', hatColor: '#59b88a' }} pack={{ kind: 'rucksack', color: '#4f9be0' }} face="smile" />
      <Person {...kid} look={{ ...LOOKS.boy, hat: 'school' }} pack="randoseru" face="smile" />
    </>
  )
}

/** かみ の ゆれ: はしる(横)・てまえ へ はしる(正面)。こまった 子 の 上 に「?」 */
function Sway({ t }: SceneProps) {
  const r = run(t, { from: 0, to: 34, start: SWAY + 0.1, end: SWAY + 1.6, height: 42 })
  const front = runDepth(t, { from: [84, 80], to: [84, GROUND], start: SWAY + 0.1, end: SWAY + 1.6, height: 30, toHeight: 44 })
  const swing = (moving: boolean) => (moving ? wave(t, 0.36) * 16 : wave(t, 1.2) * 4)
  const asker = { x: 58, y: GROUND, facing: 'front', look: LOOKS.student, build: 'teen' } as const
  const head = personRig(asker).world.head
  return (
    <>
      <Person {...r} y={GROUND} look={LOOKS.girl} face="joy" hairSway={swing(r.moving)} />
      <Person {...asker} face="worried" gaze={wave(t, 1.1)} pose={{ rightArm: { to: [head[0] - 6, head[1] - 2] }, head: wave(t, 1.1) * 5 }} />
      <Question x={head[0] + 7} y={head[1] - 10} show={during(t, SWAY + 0.2, INK, 0.25)} t={t} />
      <Person {...front} look={LOOKS.little} face="joy" hairSway={swing(front.moving)} />
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 18)
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[100, 10]} clouds={[[30, 16, 0.8]]} tufts={[]} />
        <Part t={t} from={FACES} to={GAZE}>
          <Faces />
        </Part>
        <Part t={t} from={GAZE} to={HATS}>
          <Gaze t={t} />
        </Part>
        <Part t={t} from={HATS} to={PACK_TURN}>
          <Hats t={t} />
        </Part>
        <Part t={t} from={PACK_TURN} to={PACK_WALK}>
          <PackTurn t={t} />
        </Part>
        <Part t={t} from={PACK_WALK} to={SWAY}>
          <PackWalk t={t} />
        </Part>
        <Part t={t} from={SWAY} to={DURATION + 1}>
          <Sway t={t} />
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
    { at: FACES, label: '足した 顔: こまった・おこった・なく・ねむい・ぐっ(上 は 正面、下 は 横)' },
    { at: GAZE, label: '目線 の 上下: 見上げる・うごく・見下ろす(横むき も)' },
    { at: HATS, label: 'ぼうし 4つ と めがね(正面)' },
    { at: HATS + 0.75, label: 'ぼうし・めがね(横)' },
    { at: HATS + 1.35, label: 'ぼうし・めがね(うしろ)' },
    { at: PACK_TURN, label: 'かばん: 幼児・子ども・中くらい・おとな(正面)' },
    { at: PACK_TURN + 0.62, label: 'かばん(横。てまえ の うで が まえ を 通る)' },
    { at: PACK_TURN + 1.17, label: 'かばん(うしろ。うしろ へ ふった うで は かばん の まえ)' },
    { at: PACK_WALK, label: 'かばん を せおって あるく → ふりむいて おくへ / おく から てまえ へ' },
    { at: PACK_WALK + 1.1, label: 'ふりむいた あと、おくへ' },
    { at: SWAY, label: 'かみ の ゆれ(はしる)・「?」' },
    { at: INK, label: '字になる', sound: 'stroke' },
  ],
  Scene,
}

export default scene
