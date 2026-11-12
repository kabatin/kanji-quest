import { TopBar } from '../../components/Hud'
import { KText } from '../../components/KText'
import { KanjiGlyph } from '../../components/KanjiGlyph'
import { PartIcon } from '../../components/PartIcon'
import { Stamps } from '../../components/Stamps'
import { AREAS } from '../../data/areas'
import { getKanji } from '../../data/kanji'
import { fullGlyph } from '../../data/strokes'
import { bossName, SPOT_LABEL } from '../../lib/boss'
import { bossAfter, findStage, isCleared } from '../../lib/stages'
import { useProgress } from '../../store/progress'
import { BossMonster } from '../boss/BossMonster'

type Props = {
  readonly stageId: string
  readonly onBack: () => void
  readonly onLearn: (char: string) => void
  /** 5字おぼえたあとの行き先(ボス、または 次のステージ) */
  readonly next: { readonly label: string; readonly onNext: () => void }
}

/** ステージ1つ: 5つの漢字を学ぶ。全部おわったら、次のステージか、エリアの ボス へ進む。 */
export function StageScreen({ stageId, onBack, onLearn, next }: Props) {
  const stage = findStage(AREAS, stageId)
  const learned = useProgress((s) => s.learned)
  const stamps = useProgress((s) => s.stamps)
  const boss = bossAfter(stage, AREAS)
  const bossCleared = useProgress((s) => boss !== undefined && isCleared(s.clears, boss.id))
  const rest = stage.kanji.filter((c) => !learned.includes(c)).length
  const nextChar = stage.kanji.find((c) => !learned.includes(c))
  // この ステージの あとに、まだ たおしていない ボスが いるとき
  const waiting = boss !== undefined && !bossCleared ? boss : undefined

  return (
    <div className="screen stage">
      <TopBar onBack={onBack} backLabel="ぼうけん" title={`ステージ ${stage.number}`}>
        {rest === 0 && <span className="stage__cleared">クリア！</span>}
      </TopBar>
      <ul className="stage__cards">
        {stage.kanji.map((char) => {
          const kanji = getKanji(char)
          const isLearned = learned.includes(char)
          return (
            <li key={char}>
              <button
                type="button"
                className={`stage-card ${isLearned ? 'is-learned' : ''} ${char === nextChar ? 'is-next' : ''}`}
                onClick={() => onLearn(char)}
                aria-label={`${char} ${kanji.yomi}${isLearned ? ' おぼえた' : ''}`}
              >
                <PartIcon id={kanji.icon} className="stage-card__icon" />
                <span className="stage-card__glyph">
                  <KanjiGlyph layers={[{ glyph: fullGlyph(char), tone: isLearned ? 'ink' : 'pale' }]} label={char} />
                </span>
                <span className="stage-card__yomi">{kanji.yomi}</span>
                <Stamps mask={stamps[char]} />
              </button>
            </li>
          )
        })}
      </ul>
      <div className={`stage__boss ${rest > 0 ? 'is-locked' : waiting ? 'is-ready' : 'is-cleared'}`}>
        {waiting && <BossMonster seed={waiting.number} mood="idle" className="stage__monster" label={bossName(waiting.number)} />}
        <div className="stage__boss-text">
          {waiting && (
            <p className="stage__boss-name">
              {SPOT_LABEL[waiting.spot]}「{bossName(waiting.number)}」
            </p>
          )}
          {rest > 0 ? (
            <p className="stage__rest">
              あと <strong>{rest}</strong> <KText text={waiting ? '{字|じ} {学|まな}ぶと、たたかえるよ' : '{字|じ} {学|まな}ぶと、つぎへ すすめるよ'} />
            </p>
          ) : waiting ? (
            <p className="stage__rest">
              ここまでの かんじ <strong>{waiting.kanji.length}</strong> <KText text="{字|じ}から でるよ。100てんで たおせる" />
            </p>
          ) : (
            <p className="stage__rest">5つ ぜんぶ おぼえた！</p>
          )}
        </div>
        <button type="button" className="btn btn--primary btn--big" disabled={rest > 0} onClick={next.onNext}>
          {next.label}
        </button>
      </div>
    </div>
  )
}
