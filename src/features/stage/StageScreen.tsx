import { TopBar } from '../../components/Hud'
import { KText } from '../../components/KText'
import { KanjiGlyph } from '../../components/KanjiGlyph'
import { PartIcon } from '../../components/PartIcon'
import { Stamps } from '../../components/Stamps'
import { AREAS } from '../../data/areas'
import { getKanji } from '../../data/kanji'
import { fullGlyph } from '../../data/strokes'
import { bossName } from '../../lib/boss'
import { dayKey } from '../../lib/date'
import { BOSS_TRIES_PER_DAY } from '../../lib/rewards'
import { findStage, isCleared, triesLeft } from '../../lib/stages'
import { useProgress } from '../../store/progress'
import { BossMonster } from '../boss/BossMonster'

type Props = {
  readonly stageId: string
  readonly onBack: () => void
  readonly onLearn: (char: string) => void
  readonly onBoss: () => void
}

/** ステージ1つ: 5つの漢字を学んで、全部おわったら ボス に挑戦する。 */
export function StageScreen({ stageId, onBack, onLearn, onBoss }: Props) {
  const stage = findStage(AREAS, stageId)
  const learned = useProgress((s) => s.learned)
  const stamps = useProgress((s) => s.stamps)
  const cleared = useProgress((s) => isCleared(s.clears, stageId))
  const tries = useProgress((s) => s.tries)
  const rest = stage.kanji.filter((c) => !learned.includes(c)).length
  const nextChar = stage.kanji.find((c) => !learned.includes(c))
  const left = triesLeft(tries, stageId, BOSS_TRIES_PER_DAY.stage, dayKey())
  const name = bossName(stage.number)

  return (
    <div className="screen stage">
      <TopBar onBack={onBack} backLabel="ぼうけん" title={`ステージ ${stage.number}`}>
        {cleared && <span className="stage__cleared">クリア！</span>}
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
      <div className={`stage__boss ${rest > 0 ? 'is-locked' : cleared ? 'is-cleared' : 'is-ready'}`}>
        <BossMonster seed={stage.number} mood={cleared ? 'down' : 'idle'} className="stage__monster" label={name} />
        <div className="stage__boss-text">
          <p className="stage__boss-name">ボス「{name}」</p>
          {rest > 0 ? (
            <p className="stage__rest">
              あと <strong>{rest}</strong> <KText text="{字|じ} {学|まな}ぶと、たたかえるよ" />
            </p>
          ) : cleared ? (
            <p className="stage__rest">たおした！ れんしゅうは なんどでも できるよ</p>
          ) : (
            <p className="stage__rest">
              100てんで たおせる。きょうは あと <strong>{left}</strong> かい
            </p>
          )}
        </div>
        <button type="button" className="btn btn--primary btn--big" disabled={rest > 0} onClick={onBoss}>
          {cleared ? 'ボスと れんしゅう' : 'ボスに ちょうせん'}
        </button>
      </div>
    </div>
  )
}
