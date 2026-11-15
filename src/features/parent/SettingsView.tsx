import { reviewStats } from '../../lib/parentStats'
import type { ReportInput } from '../../lib/reportInput'
import '../../styles/parent-settings.css'
import { BackupCard } from './BackupCard'
import { GameSettingsCard } from './GameSettingsCard'
import { OfflineCard } from './OfflineCard'
import { PlayTimeCard } from './PlayTimeCard'

type Props = { readonly childId: string; readonly name: string; readonly input: ReportInput; readonly today: string }

/** 設定: 左に その子の 1日の時間・オフライン、右に あそびの設定(全員)・記録を残す/戻す */
export function SettingsView({ childId, name, input, today }: Props) {
  return (
    <div className="ps">
      <div className="ps__col">
        <PlayTimeCard childId={childId} name={name} input={input} today={today} />
        <OfflineCard />
      </div>
      <div className="ps__col">
        <GameSettingsCard name={name} reviewDue={reviewStats(input.reviews, today).due} />
        <BackupCard />
      </div>
    </div>
  )
}
