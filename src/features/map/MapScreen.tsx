import { TopBar } from '../../components/Hud'
import { Mascot } from '../../components/Mascot'
import { AREAS } from '../../data/areas'
import { levelInfo, mascotStage } from '../../lib/level'
import { itemName } from '../../lib/shop'
import { examId, isCleared, isExamUnlocked, isStageUnlocked } from '../../lib/stages'
import { useProgress } from '../../store/progress'
import { BossMonster } from '../boss/BossMonster'

/** ステージの丸を置く場所(%)。左下から右上へ、くねくね進む道になる。 */
const NODE_SPOTS = [
  { x: 8, y: 74 },
  { x: 19, y: 46 },
  { x: 30, y: 72 },
  { x: 41, y: 42 },
  { x: 52, y: 70 },
  { x: 63, y: 38 },
  { x: 74, y: 64 },
  { x: 82, y: 30 },
] as const

/** そつぎょうしけん の場所(学年の さいごの エリアだけ) */
const EXAM_SPOT = { x: 89, y: 62 } as const

type Props = {
  readonly area: number
  readonly onArea: (area: number) => void
  readonly onStage: (id: string) => void
  readonly onExam: (grade: number) => void
  readonly onBack: () => void
}

/** ぼうけんの道のり。エリアごとに8つのステージが並び、学年の さいごに そつぎょうしけん がある。 */
export function MapScreen({ area, onArea, onStage, onExam, onBack }: Props) {
  const clears = useProgress((s) => s.clears)
  const learned = useProgress((s) => s.learned)
  const xp = useProgress((s) => s.xp)
  const hat = useProgress((s) => s.equipped.hat)
  const current = AREAS[Math.min(Math.max(area, 0), AREAS.length - 1)]
  const gradeAreas = AREAS.filter((a) => a.grade === current.grade)
  const isLastOfGrade = gradeAreas[gradeAreas.length - 1].index === current.index
  const examOpen = isExamUnlocked(AREAS, current.grade, learned, clears)
  const examCleared = isCleared(clears, examId(current.grade))
  // すみまるが立つのは、そのエリアで まだクリアしていない最初の(開いている)ステージ
  const hereId = current.stages.find((s) => !isCleared(clears, s.id) && isStageUnlocked(s, AREAS, clears))?.id
  const spots = [...NODE_SPOTS.slice(0, current.stages.length), ...(isLastOfGrade ? [EXAM_SPOT] : [])]
  const path = spots.map((spot, i) => `${i === 0 ? 'M' : 'L'}${spot.x} ${spot.y}`).join(' ')

  return (
    <div className="screen map" data-theme={current.theme}>
      <TopBar onBack={onBack} backLabel="ホーム" title="ぼうけん" />
      <div className="map__area">
        <button type="button" className="btn btn--round" disabled={current.index === 0} onClick={() => onArea(current.index - 1)} aria-label="まえの エリア">
          ◀
        </button>
        <h2 className="map__name">
          <small>
            {current.grade}ねんせい　エリア {gradeAreas.findIndex((a) => a.index === current.index) + 1} / {gradeAreas.length}
          </small>
          {current.name}
        </h2>
        <button
          type="button"
          className="btn btn--round"
          disabled={current.index === AREAS.length - 1}
          onClick={() => onArea(current.index + 1)}
          aria-label="つぎの エリア"
        >
          ▶
        </button>
      </div>
      <div className="map__field">
        <svg className="map__path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d={path} />
        </svg>
        {current.stages.map((stage, i) => {
          const spot = NODE_SPOTS[i]
          const cleared = isCleared(clears, stage.id)
          const unlocked = isStageUnlocked(stage, AREAS, clears)
          const learnedHere = stage.kanji.filter((c) => learned.includes(c)).length
          const state = cleared ? 'cleared' : unlocked ? 'open' : 'locked'
          return (
            <button
              key={stage.id}
              type="button"
              className={`map-node is-${state}`}
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
              disabled={!unlocked}
              onClick={() => onStage(stage.id)}
              aria-label={`ステージ ${stage.number}${state === 'locked' ? ' まだ あかない' : cleared ? ' クリア' : ''}`}
            >
              {stage.id === hereId && <Mascot stage={mascotStage(levelInfo(xp).level)} hat={itemName(hat)} className="map-node__mascot" />}
              <span className="map-node__disc">{state === 'locked' ? '🔒' : stage.number}</span>
              <span className="map-node__kanji" aria-hidden="true">
                {stage.kanji.join('')}
              </span>
              {unlocked && (
                <span className="map-node__stars" aria-hidden="true">
                  {cleared ? 'クリア' : `${learnedHere} / ${stage.kanji.length}`}
                </span>
              )}
            </button>
          )
        })}
        {isLastOfGrade && (
          <button
            type="button"
            className={`map-node map-node--exam is-${examCleared ? 'cleared' : examOpen ? 'open' : 'locked'}`}
            style={{ left: `${EXAM_SPOT.x}%`, top: `${EXAM_SPOT.y}%` }}
            disabled={!examOpen}
            onClick={() => onExam(current.grade)}
            aria-label={`${current.grade}ねんせいの そつぎょうしけん${examOpen ? '' : ' まだ あかない'}`}
          >
            <span className="map-node__disc">
              <BossMonster seed={current.grade} king mood={examCleared ? 'down' : 'idle'} label="だいまおう" />
            </span>
            <span className="map-node__kanji">そつぎょう しけん</span>
            <span className="map-node__stars" aria-hidden="true">
              {examCleared ? 'ごうかく' : examOpen ? 'ちょうせん！' : 'ぜんぶ クリアで あく'}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
