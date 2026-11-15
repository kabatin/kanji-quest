import { useEffect, useState } from 'react'
import { TopBar } from '../../components/Hud'
import { KANJI } from '../../data/kanji'
import { dayKey } from '../../lib/date'
import { levelInfo } from '../../lib/level'
import { gradeStats, reviewStats, weakKanji, weekStats } from '../../lib/parentStats'
import { offlineStatus, type OfflineStatus } from '../../lib/pwa'
import { REVIEW_DAILY_CHOICES } from '../../lib/review'
import { readChildRecords } from '../../store/childRecords'
import { BOSS_PLANS, BOSS_SIZES, BOSS_TRY_CHOICES, useParent, type BossSize } from '../../store/parent'
import { useProfiles } from '../../store/profiles'
import { useProgress } from '../../store/progress'
import { BackupCard } from './BackupCard'
import { WeekChart } from './WeekChart'

const SIZE_LABEL: Record<BossSize, string> = { short: '短め', normal: 'ふつう' }

const planTotal = (size: BossSize) => {
  const plan = BOSS_PLANS[size]
  return plan.select + plan.model + plan.blind
}

type Props = { readonly onBack: () => void; readonly onOpen: (char: string) => void }

/** 保護者向け: 子どもごとの学習のようす(1週間・苦手な字・復習)と、ボスの難しさ・オフラインの設定。 */
export function ParentScreen({ onBack, onOpen }: Props) {
  const profiles = useProfiles((s) => s.profiles)
  const activeId = useProfiles((s) => s.activeId)
  // いま あそんでいる人の きろくが変わったら、読みなおす
  const version = useProgress((s) => s.xp + Object.keys(s.misses).length + Object.keys(s.playMinutes).length)
  const bossSize = useParent((s) => s.bossSize)
  const bossTries = useParent((s) => s.bossTries)
  const reviewPerDay = useParent((s) => s.reviewPerDay)
  const update = useParent((s) => s.update)
  const [childId, setChildId] = useState(activeId)
  const [offline, setOffline] = useState<OfflineStatus | null>(null)

  useEffect(() => {
    let alive = true
    void offlineStatus().then((status) => {
      if (alive) setOffline(status)
    })
    return () => {
      alive = false
    }
  }, [])

  const today = dayKey()
  const records = readChildRecords(childId)
  const week = weekStats(today, records.learnedOn, records.playMinutes)
  const weak = weakKanji(records.misses)
  const review = reviewStats(records.reviews, today)
  const grades = gradeStats(KANJI, records.learned)
  const name = profiles.find((p) => p.id === childId)?.name ?? ''

  return (
    <div className="screen parent" data-version={version}>
      <TopBar onBack={onBack} title="保護者の方へ">
        {profiles.length > 1 && (
          <div className="parent__tabs" role="tablist" aria-label="お子さん">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                role="tab"
                aria-selected={profile.id === childId}
                className={`btn chip ${profile.id === childId ? 'is-selected' : ''}`}
                onClick={() => setChildId(profile.id)}
              >
                {profile.name}
              </button>
            ))}
          </div>
        )}
      </TopBar>
      <div className="parent__body">
        <section className="parent-card parent-card--summary" aria-label={`${name}さんの まとめ`}>
          <h2>{name}さん</h2>
          <dl className="parent__facts">
            <div>
              <dt>レベル</dt>
              <dd>{levelInfo(records.xp).level}</dd>
            </div>
            <div>
              <dt>覚えた漢字</dt>
              <dd>
                {records.learned.length}
                <small> / {KANJI.length}</small>
              </dd>
            </div>
            <div>
              <dt>倒したボス</dt>
              <dd>{Object.keys(records.clears).length}</dd>
            </div>
            <div>
              <dt>今日の復習</dt>
              <dd>
                {review.due}
                <small> 字</small>
              </dd>
            </div>
          </dl>
          <ul className="parent__grades">
            {grades.map((grade) => (
              <li key={grade.grade}>
                <span>{grade.grade}年生</span>
                <span className="parent__meter" role="progressbar" aria-label={`${grade.grade}年生の漢字`} aria-valuemin={0} aria-valuemax={grade.total} aria-valuenow={grade.learned}>
                  <span style={{ width: `${(grade.learned / grade.total) * 100}%` }} />
                </span>
                <span className="parent__num">
                  {grade.learned} / {grade.total}
                </span>
              </li>
            ))}
          </ul>
          <p className="parent__note">
            定着した漢字(30日後の復習まで正解) <strong>{review.mastered}</strong> 字
          </p>
        </section>

        <section className="parent-card parent-card--week" aria-label="この1週間">
          <h2>この1週間</h2>
          <div className="parent__charts">
            <WeekChart title="新しく覚えた漢字" unit="字" days={week} value={(d) => d.learned.length} tone="learn" />
            <WeekChart title="遊んだ時間" unit="分" days={week} value={(d) => d.minutes} tone="time" />
          </div>
        </section>

        <section className="parent-card parent-card--weak" aria-label="苦手な漢字">
          <h2>苦手な漢字</h2>
          {weak.length === 0 ? (
            <p className="parent__empty">まだありません。ボスや復習で間違えた漢字がここに出ます。</p>
          ) : (
            <ul className="parent__weak">
              {weak.map((item) => (
                <li key={item.char}>
                  <button type="button" className="parent__weak-char" onClick={() => onOpen(item.char)} aria-label={`${item.char}(${item.misses}回 間違い)を開く`}>
                    {item.char}
                  </button>
                  <small>{item.misses}回</small>
                </li>
              ))}
            </ul>
          )}
          <p className="parent__note">正解すると回数が減り、0になると消えます。</p>
        </section>

        <section className="parent-card parent-card--settings" aria-label="ボスの設定">
          <h2>あそびの設定(この端末の全員)</h2>
          <div className="parent__option" role="group" aria-label="問題の数">
            <span>問題の数</span>
            {BOSS_SIZES.map((size) => (
              <button key={size} type="button" className={`btn chip ${bossSize === size ? 'is-selected' : ''}`} aria-pressed={bossSize === size} onClick={() => update({ bossSize: size })}>
                {SIZE_LABEL[size]}({planTotal(size)}問)
              </button>
            ))}
          </div>
          <div className="parent__option" role="group" aria-label="1日の挑戦回数">
            <span>1日の挑戦</span>
            {BOSS_TRY_CHOICES.map((tries) => (
              <button key={tries} type="button" className={`btn chip ${bossTries === tries ? 'is-selected' : ''}`} aria-pressed={bossTries === tries} onClick={() => update({ bossTries: tries })}>
                {tries}回
              </button>
            ))}
          </div>
          <p className="parent__note">100点で倒せるルールは同じです。卒業試験は1日2回・20問のまま。</p>
          <div className="parent__option" role="group" aria-label="1日の復習">
            <span>1日の復習</span>
            {REVIEW_DAILY_CHOICES.map((count) => (
              <button key={count} type="button" className={`btn chip ${reviewPerDay === count ? 'is-selected' : ''}`} aria-pressed={reviewPerDay === count} onClick={() => update({ reviewPerDay: count })}>
                {count}字
              </button>
            ))}
          </div>
          <p className="parent__note">超えた分は次の日に回し、苦手な字から出します。</p>
          <h2 className="parent__sub">オフライン</h2>
          <p className="parent__offline" role="status">
            {offline === null
              ? '確認中…'
              : !offline.supported
                ? 'このブラウザ・開発中の画面では使えません(公開した版で使えます)。'
                : `アプリ ${offline.shell ? '保存済み ✓' : '未保存'} / 音声 ${offline.voiceCached} / ${offline.voiceTotal}`}
          </p>
        </section>

        <BackupCard />
      </div>
    </div>
  )
}
