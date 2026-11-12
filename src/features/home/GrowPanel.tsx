import { KText } from '../../components/KText'
import { Mascot } from '../../components/Mascot'
import { MiniIcon } from '../../components/MiniIcon'
import { KANJI } from '../../data/kanji'
import { levelInfo, MASCOT_FORMS, mascotGrowth, mascotStage, nextMascotLevel } from '../../lib/level'
import { itemName } from '../../lib/shop'
import { useProgress } from '../../store/progress'
import { forestPlan, kanjiPerGrowth, MAX_TREES, TREE_STAGES } from './scene/layout'

/**
 * すみまると森の「そだちぐあい」。
 * いまの すがた と 次の すがた(かげ)を並べ、あと何レベルで変わるかを見せる。
 */
export function GrowPanel() {
  const xp = useProgress((s) => s.xp)
  const learnedCount = useProgress((s) => s.learned.length)
  const hat = useProgress((s) => s.equipped.hat)
  const { level } = levelInfo(xp)
  const stage = mascotStage(level)
  const nextLevel = nextMascotLevel(level)
  const growth = mascotGrowth(level)
  const trees = forestPlan(learnedCount, KANJI.length)
  const perGrowth = kanjiPerGrowth(KANJI.length)
  const forestSteps = trees.reduce((sum, tree) => sum + tree.stage, 0)
  const forestFull = forestSteps >= MAX_TREES * TREE_STAGES
  const toGrowth = perGrowth - (learnedCount % perGrowth)

  return (
    <section className="grow" aria-label="すみまるの せいちょう">
      <h2 className="grow__name">{MASCOT_FORMS[stage].name}</h2>
      <div className="grow__forms">
        <Mascot stage={stage} hat={itemName(hat)} happy className="grow__now" />
        <span className="grow__road" aria-hidden="true">
          <span style={{ width: `${growth * 100}%` }} />
        </span>
        {nextLevel === null ? (
          <span className="grow__goal" aria-hidden="true">
            👑
          </span>
        ) : (
          <span className="grow__next-form">
            <Mascot stage={stage + 1} className="grow__silhouette" />
            <span className="grow__question" aria-hidden="true">
              ？
            </span>
          </span>
        )}
      </div>
      <div className="grow__bar" role="progressbar" aria-label="つぎの すがた まで" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(growth * 100)}>
        <span style={{ width: `${growth * 100}%` }} />
      </div>
      <p className="grow__next">
        {nextLevel === null ? (
          'いちばん りっぱな すがた！'
        ) : (
          <>
            あと <strong>{nextLevel - level}</strong> レベルで すがたが かわるよ
          </>
        )}
      </p>
      <div className="grow__forest">
        <MiniIcon name="ki" className="grow__tree" />
        <p className="grow__trees">
          <KText text="{森|もり}の {木|き}" />
          <strong>{trees.length}</strong>ほん
        </p>
        <div className="grow__bar grow__bar--forest" role="progressbar" aria-label="もりの そだちぐあい" aria-valuemin={0} aria-valuemax={MAX_TREES * TREE_STAGES} aria-valuenow={forestSteps}>
          <span style={{ width: `${(forestSteps / (MAX_TREES * TREE_STAGES)) * 100}%` }} />
        </div>
        <p className="grow__hint">{forestFull ? <KText text="{森|もり}が そだちきった！" /> : <KText text={`あと ${toGrowth}{字|じ}で {森|もり}が そだつ`} />}</p>
      </div>
    </section>
  )
}
