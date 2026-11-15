import { REVIEW_DAILY_CHOICES, type ReviewDaily } from '../../lib/review'
import { BOSS_PLANS, BOSS_SIZES, BOSS_TRY_CHOICES, useParent, type BossSize, type BossTries } from '../../store/parent'
import { Segmented } from './Segmented'

const SIZE_LABEL: Record<BossSize, string> = { short: '短め', normal: 'ふつう' }

const planTotal = (size: BossSize): number => {
  const plan = BOSS_PLANS[size]
  return plan.select + plan.model + plan.blind
}

const SIZE_OPTIONS = BOSS_SIZES.map((size) => ({ value: size, label: `${SIZE_LABEL[size]}(${planTotal(size)}問)` }))
const TRY_OPTIONS = BOSS_TRY_CHOICES.map((tries) => ({ value: tries, label: `${tries}回` }))
const REVIEW_OPTIONS = REVIEW_DAILY_CHOICES.map((count) => ({ value: count, label: `${count}字` }))

type Props = {
  readonly name: string
  /** その子の、いま 復習の日が来ている字の数 */
  readonly reviewDue: number
}

/** ボスの問題数・1日の挑戦回数・1日の復習(この端末の全員に かかる) */
export function GameSettingsCard({ name, reviewDue }: Props) {
  const bossSize = useParent((s) => s.bossSize)
  const bossTries = useParent((s) => s.bossTries)
  const reviewPerDay = useParent((s) => s.reviewPerDay)
  const update = useParent((s) => s.update)
  return (
    <section className="parent-card pgame" aria-label="あそびの設定">
      <header className="parent-card__head">
        <h2>あそびの設定</h2>
        <p className="parent-card__sub">この端末で遊ぶ全員に かかります。</p>
      </header>
      <Segmented<BossSize> label="ボスの問題数" options={SIZE_OPTIONS} value={bossSize} onChange={(size) => update({ bossSize: size })} />
      <Segmented<BossTries> label="1日の挑戦回数" options={TRY_OPTIONS} value={bossTries} onChange={(tries) => update({ bossTries: tries })} />
      <p className="parent-card__note">100点で倒せるルールは同じです。卒業試験は1日2回・20問のままです。</p>
      <Segmented<ReviewDaily> label="1日の復習" options={REVIEW_OPTIONS} value={reviewPerDay} onChange={(count) => update({ reviewPerDay: count })} />
      <p className="parent-card__note">
        超えた分は次の日に回し、苦手な字から出します。{name}さんは いま{reviewDue}字の復習の日が来ています。
      </p>
    </section>
  )
}
