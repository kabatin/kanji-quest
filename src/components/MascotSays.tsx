import { levelInfo, mascotStage } from '../lib/level'
import { itemName } from '../lib/shop'
import { useProgress } from '../store/progress'
import { KText } from './KText'
import { Mascot } from './Mascot'

type Props = {
  /** すみまるの ひとこと。{漢字|よみ} の印つき */
  readonly text: string
  /** にこにこ顔にするか(はげます ときは false) */
  readonly happy?: boolean
  readonly className?: string
}

/** すみまるが、ふきだし で ひとこと 言う。いまの すがた と ぼうし で出てくる。 */
export function MascotSays({ text, happy = true, className }: Props) {
  const xp = useProgress((s) => s.xp)
  const hat = useProgress((s) => s.equipped.hat)
  return (
    <div className={['mascot-says', className].filter(Boolean).join(' ')}>
      <Mascot stage={mascotStage(levelInfo(xp).level)} hat={itemName(hat)} happy={happy} className="mascot-says__mascot" />
      <p className="mascot-says__bubble">
        <KText text={text} />
      </p>
    </div>
  )
}
