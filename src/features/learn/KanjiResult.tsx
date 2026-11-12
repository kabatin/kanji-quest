import { useEffect } from 'react'
import { Burst } from '../../components/Burst'
import { KanjiGlyph, type GlyphLayer } from '../../components/KanjiGlyph'
import { KText } from '../../components/KText'
import { STAMP_FIRST_MS, STAMP_GAP_MS, Stamps } from '../../components/Stamps'
import { getNarration } from '../../data/narration'
import { getPart } from '../../data/parts'
import type { Kanji } from '../../data/schema'
import { fullGlyph } from '../../data/strokes'
import { useFeedback } from '../../lib/useFeedback'
import { voiceId } from '../../lib/voice'
import { KANJI } from '../../data/kanji'
import { PARTS } from '../../data/parts'
import { newlyCompleted } from '../../lib/partQuest'
import type { StampKind } from '../../lib/rewards'
import { useLearnedSet } from '../../lib/useKanjiText'
import { useProgress, type LearnGain, type WriteGain } from '../../store/progress'
import { Nakama } from '../nakama/Nakama'
import type { NextAction } from './Learn'

type Props = {
  readonly kanji: Kanji
  readonly learnGain: LearnGain
  /** 書く練習を「あとで」にしたときは null */
  readonly writeGain: WriteGain | null
  readonly onOpen: (char: string) => void
  readonly onWrite: () => void
  readonly onStory: () => void
  readonly next: NextAction
}

/** できあがった漢字を、部位ごとに色分けして描くための層を作る。 */
function resultLayers(kanji: Kanji): GlyphLayer[] {
  const last = kanji.steps[kanji.steps.length - 1]
  if (!last) return [{ glyph: fullGlyph(kanji.char), tone: 'ink' }]
  return [
    { glyph: last.fixedGlyph, tone: getPart(last.fixed).kind },
    { glyph: last.answerGlyph, tone: getPart(last.answer).kind },
  ]
}

/** 学びおえた画面: 漢字、はんこ、もらえたもの、なかま、つぎの行き先。 */
export function KanjiResult({ kanji, learnGain, writeGain, onOpen, onWrite, onStory, next }: Props) {
  const { say, play } = useFeedback()
  const mask = useProgress((s) => s.stamps[kanji.char])
  // いま もらったばかりの はんこ(まなぶ・かく)。順番に ぺたん と おす
  const learnNew = learnGain.isNew
  const writeNew = writeGain?.isNew ?? false
  const fresh: readonly StampKind[] = [...(learnNew ? (['learn'] as const) : []), ...(writeNew ? (['write'] as const) : [])]
  const freshCount = fresh.length
  useEffect(() => {
    const timers = Array.from({ length: freshCount }, (_, i) => setTimeout(() => play('stamp'), STAMP_FIRST_MS + i * STAMP_GAP_MS))
    return () => timers.forEach(clearTimeout)
  }, [freshCount, play])
  const xp = learnGain.xp + (writeGain?.xp ?? 0)
  const coins = learnGain.coins + (writeGain?.coins ?? 0)
  const levelAfter = writeGain?.levelAfter ?? learnGain.levelAfter
  const leveledUp = levelAfter > learnGain.levelBefore
  const learnedSet = useLearnedSet()
  // この字を覚えたことで、ぜんぶ そろった パーツ
  const completed = learnGain.isNew ? newlyCompleted(kanji.char, PARTS, KANJI, learnedSet) : []

  return (
    <div className="result" data-new={learnGain.isNew}>
      {(learnGain.isNew || leveledUp) && <Burst />}
      <div className="result__main">
        <button type="button" className="result__kanji" onClick={() => say(voiceId.word(kanji.char), kanji.yomi)} aria-label={`${kanji.yomi} を きく`}>
          {learnGain.isNew && (
            <span className="result__new">
              <KText text="{新|あたら}しく おぼえた！" />
            </span>
          )}
          <KanjiGlyph layers={resultLayers(kanji)} label={kanji.char} />
          <span className="result__yomi">🔊 {kanji.yomi}</span>
        </button>
        <Stamps mask={mask} withLabel className="result__stamps" fresh={fresh} />
        <button type="button" className="result__explain" onClick={onStory} aria-label="ものがたり を もういちど みる">
          <span aria-hidden="true">▶</span>
          <span>
            <KText text={getNarration(kanji.char).caption} />
          </span>
        </button>
      </div>
      <div className="result__side">
        <ul className="gains">
          <li className="gains__xp">けいけんち ＋{xp}</li>
          {coins > 0 && (
            <li className="gains__coin">
              <span className="coin" aria-hidden="true" /> ＋{coins}
            </li>
          )}
          {leveledUp && <li className="gains__level">レベル {levelAfter} に アップ！</li>}
          {completed.map((part) => (
            <li key={part.id} className="gains__part">
              「{part.label}」の パーツ コンプリート！
            </li>
          ))}
        </ul>
        <Nakama kanji={kanji} onOpen={onOpen} />
        <div className="result__actions">
          {!writeGain && (
            <button type="button" className="btn" onClick={onWrite}>
              ✍ <KText text="{書|か}いてみる" />
            </button>
          )}
          <button type="button" className="btn btn--primary btn--big" onClick={next.onNext}>
            {next.label}
          </button>
        </div>
      </div>
    </div>
  )
}
