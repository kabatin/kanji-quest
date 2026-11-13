import { motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { KText } from '../../components/KText'
import { PartIcon } from '../../components/PartIcon'
import type { Tone } from '../../components/KanjiGlyph'
import { getNarration, type Actor, type Motion } from '../../data/narration'
import { getPart } from '../../data/parts'
import type { GlyphRef, Kanji } from '../../data/schema'
import { fullGlyph, getStrokes, GLYPH_SIZE, unionBBox } from '../../data/strokes'
import { useFeedback, useStopVoiceOnLeave } from '../../lib/useFeedback'
import { voiceId } from '../../lib/voice'
import { useSceneClock } from './sceneClock'
import type { SceneModule } from './sceneKit'
import { hasScene, useScene } from './sceneRegistry'
import { SceneStage } from './SceneStage'

/** 0 = 絵の場面 / 1 = 絵が筆画に変わっていく / 2 = 漢字のできあがり */
type Phase = 0 | 1 | 2

/** 絵の場面を見せておく時間 */
export const SCENE_MS = 3400
/** 1画を書くのにかける時間と、次の画までの間 */
const STROKE_SECONDS = 0.45
const STROKE_GAP_SECONDS = 0.2
const AFTER_DRAW_MS = 900

const MIN_PICTURE = 36
const MAX_PICTURE = 104
const KIND_LABEL = { naritachi: 'なりたち', oboekata: 'おぼえかた' } as const

type Cast = { readonly actor: Actor; readonly glyph: GlyphRef; readonly tone: Tone }

/** 物語に出てくる絵と、それが変わっていく先の筆画を組にする。 */
function castOf(kanji: Kanji, actors: readonly Actor[]): Cast[] {
  const last = kanji.steps[kanji.steps.length - 1]
  if (!last || actors.length < 2) return [{ actor: actors[0], glyph: fullGlyph(kanji.char), tone: 'ink' }]
  return [
    { actor: actors[0], glyph: last.fixedGlyph, tone: getPart(last.fixed).kind },
    { actor: actors[1], glyph: last.answerGlyph, tone: getPart(last.answer).kind },
  ]
}

/** 絵を置く場所: その部位の筆画がある場所に、同じくらいの大きさで重ねる。 */
function pictureBox(glyph: GlyphRef) {
  const [x0, y0, x1, y1] = unionBBox(getStrokes(glyph))
  const size = Math.min(Math.max(Math.max(x1 - x0, y1 - y0) * 1.05, MIN_PICTURE), MAX_PICTURE)
  const clamp = (n: number) => Math.min(Math.max(n, 0), GLYPH_SIZE - size)
  return { x: clamp((x0 + x1) / 2 - size / 2), y: clamp((y0 + y1) / 2 - size / 2), size }
}

type Anim = { readonly initial: Record<string, number>; readonly animate: Record<string, number | number[]> }

const APPEAR = { opacity: 1, scale: 1 }

/** 物語の「うごき」ごとの、絵の動かし方 */
const MOTION_ANIM: Record<Motion, Anim> = {
  still: { initial: { opacity: 0, scale: 0.6 }, animate: APPEAR },
  'lean-right': { initial: { opacity: 0, scale: 0.6 }, animate: { ...APPEAR, rotate: [0, 0, 18] } },
  'lean-left': { initial: { opacity: 0, scale: 0.6 }, animate: { ...APPEAR, rotate: [0, 0, -18] } },
  drop: { initial: { opacity: 0, y: -70 }, animate: { opacity: 1, y: [-70, 6, 0] } },
  rise: { initial: { opacity: 0, y: 70 }, animate: { opacity: 1, y: [70, -6, 0] } },
  enter: { initial: { opacity: 0, y: 60, scale: 0.3 }, animate: { opacity: 1, y: 0, scale: 1 } },
  walk: { initial: { opacity: 0, x: -70 }, animate: { opacity: 1, x: [-70, -40, -18, 0] } },
  grow: { initial: { opacity: 0, scale: 0.1 }, animate: { opacity: 1, scale: [0.1, 1.12, 1] } },
  shine: { initial: { opacity: 0, scale: 0.6 }, animate: { opacity: 1, scale: [0.6, 1.18, 1, 1.12, 1] } },
  sway: { initial: { opacity: 0, scale: 0.6 }, animate: { ...APPEAR, rotate: [0, -10, 10, -8, 8, 0] } },
  shake: { initial: { opacity: 0, scale: 0.6 }, animate: { ...APPEAR, x: [0, -4, 4, -4, 4, 0] } },
}

/** 絵が筆画に変わるにつれて、絵をうすくしていく */
const PICTURE_OPACITY: Record<Phase, number> = { 0: 1, 1: 0.2, 2: 0 }

type Props = { readonly kanji: Kanji; readonly onDone: () => void }

/** 文と ボタン(場面の よこ)。手づくりの場面でも、これまでの かんたんな絵でも 同じものを使う。 */
function StoryText({ kanji, showYomi, onReplay, onDone }: { readonly kanji: Kanji; readonly showYomi: boolean; readonly onReplay: () => void; readonly onDone: () => void }) {
  const narration = getNarration(kanji.char)
  return (
    <div className="story__text">
      <span className={`story__kind story__kind--${narration.kind}`}>{KIND_LABEL[narration.kind]}</span>
      <p className="story__caption">
        <KText text={narration.caption} />
      </p>
      {showYomi && <p className="story__yomi">{kanji.yomi}</p>}
      <div className="story__actions">
        <button type="button" className="btn" onClick={onReplay}>
          ↻ <KText text="もう{一|いち}ど" />
        </button>
        <button type="button" className="btn btn--primary btn--big" onClick={onDone}>
          つぎへ
        </button>
      </div>
    </div>
  )
}

/** 場面の中で、いま通りすぎた くぎり の効果音を鳴らす。 */
function useBeatSounds(scene: SceneModule | undefined, t: number, round: number) {
  const { play } = useFeedback()
  // もう鳴らした くぎり の数(画面には出さないので、書きかえても 描きなおさない)
  const played = useRef({ round, count: 0 })
  const due = scene ? scene.beats.filter((beat) => beat.at <= t).length : 0
  useEffect(() => {
    if (!scene) return
    const done = played.current.round === round ? played.current.count : 0
    if (due <= done) return
    played.current = { round, count: due }
    // できあがりの絵を はじめから見せるとき(動きを へらす設定など)は、音を まとめて鳴らさない
    if (t < scene.duration) for (const beat of scene.beats.slice(done, due)) if (beat.sound) play(beat.sound)
  }, [due, round, t, scene, play])
}

/**
 * 手づくりの場面を流す。時間に合わせて 絵が動き、さいごに 絵が 字になる。
 * 場面は あとから読みこまれる。読みこんでいる間も、わく・文・ボタン は 同じものを出したままにする
 * (読みこみが おわった しゅんかんに「つぎへ」を おしても、おした ことが 消えないように)。
 */
function ScenePlayer({ kanji, onDone, scene }: Props & { readonly scene: SceneModule | undefined }) {
  const { say } = useFeedback()
  const [round, setRound] = useState(0)
  const duration = scene?.duration ?? 0
  // 読みこみが おわってから 時計を はじめる(scene が とどくと、duration が変わって はじめから進む)
  const t = useSceneClock(duration, round)
  useStopVoiceOnLeave(kanji.char)
  useBeatSounds(scene, t, round)

  useEffect(() => {
    say(voiceId.explain(kanji.char), kanji.yomi)
  }, [say, kanji, round])

  // 字が できあがる ころ(さいごの くぎり)から、よみ を出す
  const lastBeat = scene?.beats[scene.beats.length - 1]?.at ?? duration
  const label = `${kanji.char} の ものがたり`
  return (
    <div className="story">
      <div className="story__stage story__stage--scene">
        {scene ? (
          <SceneStage scene={scene} t={Math.min(t, duration)} label={label} />
        ) : (
          <svg className="story__svg" viewBox={`0 0 ${GLYPH_SIZE} ${GLYPH_SIZE}`} role="img" aria-label={label} data-loading="true" />
        )}
      </div>
      <StoryText kanji={kanji} showYomi={scene !== undefined && t >= lastBeat} onReplay={() => setRound((r) => r + 1)} onDone={onDone} />
    </div>
  )
}

/**
 * 成り立ちの物語。手づくりの場面(scenes/)がある字は それを流し、まだ ない字は これまでの かんたんな絵で見せる。
 * 場面を 読みこめなかったとき(電波がない など)も、かんたんな絵で見せる(何も出ない ままに しない)。
 */
export function StoryPlayer({ kanji, onDone }: Props) {
  const { scene, failed } = useScene(kanji.char)
  return hasScene(kanji.char) && !failed ? <ScenePlayer key={kanji.char} kanji={kanji} onDone={onDone} scene={scene} /> : <SimpleStory key={kanji.char} kanji={kanji} onDone={onDone} />
}

/**
 * これまでの かんたんな絵(手づくりの場面が まだ ない字に使う)。
 * 部位の絵が、その部位のある場所に出てきて動き、そのまま筆画に変わって漢字になる。
 */
function SimpleStory({ kanji, onDone }: Props) {
  const narration = getNarration(kanji.char)
  const cast = castOf(kanji, narration.actors)
  const { say } = useFeedback()
  const [phase, setPhase] = useState<Phase>(0)
  const [round, setRound] = useState(0)
  // 「つぎへ」「もどる」で ものがたり をはなれたら、説明の音声を止める
  useStopVoiceOnLeave(kanji.char)

  const strokeOrder = cast
    .flatMap((member) => member.glyph.strokes.map((n) => ({ n, tone: member.tone, source: member.glyph.source })))
    .sort((a, b) => a.n - b.n)
  const drawMs = strokeOrder.length * STROKE_GAP_SECONDS * 1000 + STROKE_SECONDS * 1000 + AFTER_DRAW_MS

  // 動く絵(もたれる人など)が、動かない絵(木など)にかくれないよう、動かない絵を先に描く
  const drawOrder = cast
    .map((member, i) => ({ member, i }))
    .sort((a, b) => Number(a.member.actor.motion !== 'still') - Number(b.member.actor.motion !== 'still'))

  const narrate = useCallback(() => say(voiceId.explain(kanji.char), kanji.yomi), [say, kanji])

  useEffect(() => {
    narrate()
  }, [narrate, round])

  useEffect(() => {
    if (phase === 2) return
    const timer = setTimeout(() => setPhase(phase === 0 ? 1 : 2), phase === 0 ? SCENE_MS : drawMs)
    return () => clearTimeout(timer)
  }, [phase, drawMs, round])

  const replay = () => {
    setPhase(0)
    setRound((r) => r + 1)
  }

  return (
    <div className="story">
      <div className="story__stage" data-phase={phase}>
        <svg key={round} className="story__svg" viewBox={`0 0 ${GLYPH_SIZE} ${GLYPH_SIZE}`} role="img" aria-label={`${kanji.char} の ものがたり`}>
          {drawOrder.map(({ member, i }) => {
            const anim = MOTION_ANIM[member.actor.motion]
            return (
              <motion.g key={`${member.actor.part}-${i}`} initial={false} animate={{ opacity: PICTURE_OPACITY[phase] }} transition={{ duration: 0.8 }}>
                <motion.g
                  className="story__actor"
                  data-motion={member.actor.motion}
                  initial={anim.initial}
                  animate={anim.animate}
                  transition={{ duration: 1.5, delay: 0.25 + i * 0.5, ease: 'easeOut' }}
                >
                  <PartIcon id={member.actor.picture} box={pictureBox(member.glyph)} />
                </motion.g>
              </motion.g>
            )
          })}
          {phase >= 1 &&
            strokeOrder.map((stroke, i) => (
              <motion.path
                key={stroke.n}
                className={`story__stroke story__stroke--${stroke.tone}`}
                d={getStrokes({ source: stroke.source, strokes: [stroke.n] })[0].d}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: STROKE_SECONDS, delay: i * STROKE_GAP_SECONDS, ease: 'easeInOut' }}
              />
            ))}
        </svg>
      </div>
      <StoryText kanji={kanji} showYomi={phase === 2} onReplay={replay} onDone={onDone} />
    </div>
  )
}
