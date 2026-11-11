import { Burst } from '../../components/Burst'
import { Mascot } from '../../components/Mascot'
import { levelInfo, MASCOT_FORMS, mascotStage } from '../../lib/level'
import { itemName, SHOP_ITEMS } from '../../lib/shop'
import { useFeedback } from '../../lib/useFeedback'
import { useProgress } from '../../store/progress'

/**
 * ホームにもどってきたときに出る「レベルアップ」。すがたが変わったときは、前と後を並べて見せる。
 * (ログインボーナスが出ている間は、そちらを先に見せる)
 */
export function LevelUpModal() {
  const xp = useProgress((s) => s.xp)
  const seenLevel = useProgress((s) => s.seenLevel)
  const hat = useProgress((s) => s.equipped.hat)
  const bonusOpen = useProgress((s) => s.loginBonus !== null && !s.loginBonus.claimed)
  const markLevelSeen = useProgress((s) => s.markLevelSeen)
  const { play } = useFeedback()
  const { level } = levelInfo(xp)
  if (bonusOpen || level <= seenLevel) return null

  const before = mascotStage(seenLevel)
  const after = mascotStage(level)
  const evolved = after > before
  const unlocked = SHOP_ITEMS.filter((item) => item.minLevel > seenLevel && item.minLevel <= level)

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="レベルアップ">
      <Burst />
      <div className="modal__panel levelup">
        <h2>レベル {level} に アップ！</h2>
        {evolved ? (
          <>
            <p className="modal__lead">すみまるの すがたが かわった！</p>
            <div className="levelup__forms">
              <Mascot stage={before} hat={itemName(hat)} className="levelup__before" />
              <span className="levelup__arrow" aria-hidden="true">
                ▶
              </span>
              <Mascot stage={after} hat={itemName(hat)} happy className="levelup__after" />
            </div>
            <p className="levelup__name">{MASCOT_FORMS[after].name}</p>
          </>
        ) : (
          <Mascot stage={after} hat={itemName(hat)} happy className="levelup__after" />
        )}
        {unlocked.length > 0 && <p className="levelup__unlocked">あたらしい きせかえが {unlocked.length}こ かえるように なったよ</p>}
        <button
          type="button"
          className="btn btn--primary btn--big"
          onClick={() => {
            markLevelSeen()
            play('tap')
          }}
        >
          やったー！
        </button>
      </div>
    </div>
  )
}
