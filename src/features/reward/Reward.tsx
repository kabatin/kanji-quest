import { GrowTree } from '../../components/GrowTree'
import { PartCard } from '../../components/PartCard'
import { getPart } from '../../data/parts'
import { growthStage, isSkinUnlocked, pointsToNextStage, SKINS } from '../../lib/score'
import { useProgress } from '../../store/progress'

const SAMPLE_PART_ID = '氵'

type Props = { readonly onHome: () => void }

/** ごほうび: ポイントで木が育ち、カードの見た目(スキン)が解放される。 */
export function Reward({ onHome }: Props) {
  const points = useProgress((s) => s.points)
  const skin = useProgress((s) => s.skin)
  const setSkin = useProgress((s) => s.setSkin)
  const toNext = pointsToNextStage(points)

  return (
    <div className="screen reward">
      <header className="bar">
        <button type="button" className="btn" onClick={onHome}>
          ← ずかん
        </button>
        <span className="bar__score">{points} ポイント</span>
      </header>
      <div className="reward__body">
        <section className="reward__tree">
          <GrowTree stage={growthStage(points)} className="reward__tree-svg" />
          <p>{toNext === null ? 'りっぱに そだったね！' : `あと ${toNext} ポイントで おおきくなるよ`}</p>
        </section>
        <section className="reward__skins" aria-label="カードの みため">
          <h2>カードの みため</h2>
          <div className="reward__skin-list">
            {SKINS.map((def) => {
              const unlocked = isSkinUnlocked(def.id, points)
              return (
                <button
                  key={def.id}
                  type="button"
                  className={`skin-choice ${skin === def.id ? 'is-selected' : ''}`}
                  data-skin={def.id}
                  disabled={!unlocked}
                  aria-pressed={skin === def.id}
                  onClick={() => setSkin(def.id)}
                >
                  <PartCard part={getPart(SAMPLE_PART_ID)} showHint />
                  <span className="skin-choice__label">{unlocked ? def.label : `🔒 ${def.need}`}</span>
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
