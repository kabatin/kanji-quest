import { useState } from 'react'
import { TopBar } from '../../components/Hud'
import { useProgress, type Settings } from '../../store/progress'

const TOGGLES: readonly { key: keyof Settings; label: string }[] = [
  { key: 'sound', label: 'おと' },
  { key: 'speech', label: 'よみあげ' },
  { key: 'icons', label: 'え と なまえ の ヒント' },
  { key: 'timer', label: 'タイマー を みせる' },
]

type Props = { readonly onHome: () => void }

/** せってい: 音・ヒント・タイマーの切り替えと、データのリセット。 */
export function SettingsScreen({ onHome }: Props) {
  const settings = useProgress((s) => s.settings)
  const updateSettings = useProgress((s) => s.updateSettings)
  const reset = useProgress((s) => s.reset)
  const [confirming, setConfirming] = useState(false)

  const handleReset = () => {
    reset()
    setConfirming(false)
  }

  return (
    <div className="screen settings">
      <TopBar onBack={onHome} backLabel="ホーム" title="せってい" />
      <ul className="settings__list">
        {TOGGLES.map(({ key, label }) => (
          <li key={key}>
            <label className="toggle">
              <span>{label}</span>
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={(event) => updateSettings({ [key]: event.target.checked })}
              />
            </label>
          </li>
        ))}
      </ul>
      <div className="settings__reset">
        {confirming ? (
          <>
            <span>ぜんぶ けして さいしょから？</span>
            <button type="button" className="btn btn--danger" onClick={handleReset}>
              けす
            </button>
            <button type="button" className="btn" onClick={() => setConfirming(false)}>
              やめる
            </button>
          </>
        ) : (
          <button type="button" className="btn" onClick={() => setConfirming(true)}>
            データを リセット
          </button>
        )}
      </div>
      <p className="settings__credit">
        漢字の画データ:{' '}
        <a href="https://kanjivg.tagaini.net" target="_blank" rel="noreferrer">
          KanjiVG
        </a>{' '}
        © Ulrich Apel (CC BY-SA 3.0)
      </p>
    </div>
  )
}
