import { TopBar } from '../../components/Hud'
import { PLAY_EXTRA_CHOICES } from '../../lib/playLimit'
import { useParent } from '../../store/parent'
import { useProfiles } from '../../store/profiles'
import './limit.css'

type Props = {
  readonly onBack: () => void
  /** 足した あと(すぐ あそべる) */
  readonly onDone: () => void
}

/** おうちの かた向け: 「かけ算」を とおったあと、きょうだけ 時間を 足す。 */
export function ExtendPlay({ onBack, onDone }: Props) {
  const profileId = useProfiles((s) => s.activeId)
  const name = useProfiles((s) => s.profiles.find((p) => p.id === s.activeId)?.name ?? '')
  const extendPlay = useParent((s) => s.extendPlay)

  return (
    <div className="screen limit-extend">
      <TopBar onBack={onBack} title="保護者の方へ" />
      <div className="limit-extend__card">
        <p className="limit-extend__lead">
          {name ? `${name}さんの ` : ''}
          今日の遊ぶ時間を、今日だけ延ばせます。足すと、すぐに遊べます。
        </p>
        <div className="limit-extend__choices">
          {PLAY_EXTRA_CHOICES.map((minutes) => (
            <button
              key={minutes}
              type="button"
              className="btn btn--primary"
              onClick={() => {
                extendPlay(profileId, minutes)
                onDone()
              }}
            >
              {minutes}分 足す
            </button>
          ))}
        </div>
        <p className="limit-extend__note">明日になると、元の時間にもどります。時間の決め方は「保護者の方へ」の画面で変えられます。</p>
      </div>
    </div>
  )
}
