import type { CSSProperties } from 'react'
import { TopBar } from '../../components/Hud'
import { Mascot } from '../../components/Mascot'
import { AREAS } from '../../data/areas'
import { bossName, SPOT_LABEL } from '../../lib/boss'
import { levelInfo, mascotStage } from '../../lib/level'
import { itemName } from '../../lib/shop'
import {
  examId,
  isBossUnlocked,
  isCleared,
  isExamUnlocked,
  isStageDone,
  isStageUnlocked,
  nextInArea,
  type Area,
  type AreaBoss,
  type Stage,
} from '../../lib/stages'
import { useProgress } from '../../store/progress'
import { BossMonster } from '../boss/BossMonster'

/** 道の はしから はしまで(%)。そつぎょうしけん が あるエリアは、右に その場所を あけておく。 */
const PATH_FROM = 6
const PATH_TO = 92
const PATH_TO_WITH_EXAM = 79
/** 道は 下 → 上 → 下 … と くねくね進む。同じ高さが つづいて見えないよう、少しずつ ずらす。 */
const ROW_LOW = [74, 70, 72, 68, 73, 69] as const
const ROW_HIGH = [44, 40, 36, 42, 34, 38] as const

/** そつぎょうしけん の場所(学年の さいごの エリアだけ) */
const EXAM_SPOT = { x: 90, y: 64 } as const

/** スマホの よこ向き(compact-map.css)では、丸を上下 2だんに ならべる。道の線も それに合わせる。 */
const COMPACT_HIGH = 22
const COMPACT_LOW = 78
const compactY = (i: number): number => (i % 2 === 0 ? COMPACT_LOW : COMPACT_HIGH)

type Spot = { readonly x: number; readonly y: number }

type Node = { readonly kind: 'stage'; readonly stage: Stage } | { readonly kind: 'boss'; readonly boss: AreaBoss }

/** 地図に ならべる順: ステージ → (その あとに いる)ボス。 */
function nodesOf(area: Area): Node[] {
  return area.stages.flatMap((stage, i): Node[] => [
    { kind: 'stage', stage },
    ...area.bosses.filter((boss) => boss.afterStage === i + 1).map((boss): Node => ({ kind: 'boss', boss })),
  ])
}

/** 丸を置く場所。左から右へ、同じ間かくで くねくね ならべる。 */
function spotsFor(count: number, withExam: boolean): Spot[] {
  const to = withExam ? PATH_TO_WITH_EXAM : PATH_TO
  const step = count > 1 ? (to - PATH_FROM) / (count - 1) : 0
  return Array.from({ length: count }, (_, i) => {
    const row = i % 2 === 0 ? ROW_LOW : ROW_HIGH
    return { x: Math.round((PATH_FROM + step * i) * 10) / 10, y: row[Math.floor(i / 2) % row.length] }
  })
}

type Props = {
  readonly area: number
  readonly onArea: (area: number) => void
  readonly onStage: (id: string) => void
  readonly onBoss: (id: string) => void
  readonly onExam: (grade: number) => void
  readonly onBack: () => void
}

/** ぼうけんの道のり。エリアごとに ステージが並び、まんなかに 中ボス、さいごに ラスボス。学年の さいごに そつぎょうしけん がある。 */
export function MapScreen({ area, onArea, onStage, onBoss, onExam, onBack }: Props) {
  const clears = useProgress((s) => s.clears)
  const learned = useProgress((s) => s.learned)
  const xp = useProgress((s) => s.xp)
  const hat = useProgress((s) => s.equipped.hat)
  const current = AREAS[Math.min(Math.max(area, 0), AREAS.length - 1)]
  const gradeAreas = AREAS.filter((a) => a.grade === current.grade)
  const isLastOfGrade = gradeAreas[gradeAreas.length - 1].index === current.index
  const examOpen = isExamUnlocked(AREAS, current.grade, learned, clears)
  const examCleared = isCleared(clears, examId(current.grade))
  // すみまるが立つのは、そのエリアで 次に やる所(まだの字が あるステージか、まっている ボス)
  const here = nextInArea(current, AREAS, learned, clears)
  const hereId = here?.kind === 'learn' ? here.stage.id : here?.kind === 'boss' ? here.boss.id : undefined
  const nodes = nodesOf(current)
  const spots = spotsFor(nodes.length, isLastOfGrade)
  const pathOf = (points: readonly Spot[]): string => points.map((spot, i) => `${i === 0 ? 'M' : 'L'}${spot.x} ${spot.y}`).join(' ')
  const path = pathOf([...spots, ...(isLastOfGrade ? [EXAM_SPOT] : [])])
  const compactPath = pathOf([...spots.map((spot, i) => ({ x: spot.x, y: compactY(i) })), ...(isLastOfGrade ? [{ x: EXAM_SPOT.x, y: COMPACT_LOW }] : [])])
  const mascot = <Mascot stage={mascotStage(levelInfo(xp).level)} hat={itemName(hat)} className="map-node__mascot" />

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
          <path className="map__path-wide" d={path} />
          <path className="map__path-compact" d={compactPath} />
        </svg>
        {nodes.map((node, i) => {
          const style = { left: `${spots[i].x}%`, top: `${spots[i].y}%`, '--top-compact': `${compactY(i)}%` } as CSSProperties
          if (node.kind === 'boss') {
            const { boss } = node
            const cleared = isCleared(clears, boss.id)
            const unlocked = isBossUnlocked(boss, learned)
            const state = cleared ? 'cleared' : unlocked ? 'open' : 'locked'
            const name = bossName(boss.number)
            return (
              <button
                key={boss.id}
                type="button"
                className={`map-node map-node--boss is-${state}`}
                data-spot={boss.spot}
                style={style}
                disabled={!unlocked}
                onClick={() => onBoss(boss.id)}
                aria-label={`${SPOT_LABEL[boss.spot]} ${name}${state === 'locked' ? ' まだ あかない' : cleared ? ' たおした' : ''}`}
              >
                {boss.id === hereId && mascot}
                <span className="map-node__disc">
                  <BossMonster seed={boss.number} mood={cleared ? 'down' : 'idle'} label={name} />
                </span>
                <span className="map-node__kanji" aria-hidden="true">
                  {SPOT_LABEL[boss.spot]}
                </span>
                <span className="map-node__stars" aria-hidden="true">
                  {cleared ? 'たおした' : unlocked ? 'ちょうせん！' : `${boss.kanji.length}じ おぼえて あく`}
                </span>
              </button>
            )
          }
          const { stage } = node
          const done = isStageDone(stage, learned)
          const unlocked = isStageUnlocked(stage, AREAS, learned, clears)
          const learnedHere = stage.kanji.filter((c) => learned.includes(c)).length
          const state = done ? 'cleared' : unlocked ? 'open' : 'locked'
          return (
            <button
              key={stage.id}
              type="button"
              className={`map-node map-node--stage is-${state}`}
              style={style}
              disabled={!unlocked && !done}
              onClick={() => onStage(stage.id)}
              aria-label={`ステージ ${stage.number}${state === 'locked' ? ' まだ あかない' : done ? ' クリア' : ''}`}
            >
              {stage.id === hereId && mascot}
              <span className="map-node__disc">{state === 'locked' ? '🔒' : stage.number}</span>
              <span className="map-node__kanji" aria-hidden="true">
                {stage.kanji.join('')}
              </span>
              {state !== 'locked' && (
                <span className="map-node__stars" aria-hidden="true">
                  {done ? 'クリア' : `${learnedHere} / ${stage.kanji.length}`}
                </span>
              )}
            </button>
          )
        })}
        {isLastOfGrade && (
          <button
            type="button"
            className={`map-node map-node--exam is-${examCleared ? 'cleared' : examOpen ? 'open' : 'locked'}`}
            style={{ left: `${EXAM_SPOT.x}%`, top: `${EXAM_SPOT.y}%`, '--top-compact': `${COMPACT_LOW}%` } as CSSProperties}
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
