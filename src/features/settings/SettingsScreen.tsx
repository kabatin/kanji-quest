import { useId, useState, type ReactNode } from 'react'
import { AppLogo } from '../../components/AppLogo'
import { TopBar } from '../../components/Hud'
import { Mascot } from '../../components/Mascot'
import { MiniIcon } from '../../components/MiniIcon'
import { KANJI } from '../../data/kanji'
import { levelInfo, MASCOT_FORMS, mascotStage } from '../../lib/level'
import { stampCount } from '../../lib/rewards'
import { itemName } from '../../lib/shop'
import { useFeedback } from '../../lib/useFeedback'
import { voiceId } from '../../lib/voice'
import { useProfiles } from '../../store/profiles'
import { useProgress, type Settings } from '../../store/progress'

type Toggle = { readonly key: keyof Settings; readonly label: string; readonly note: string; readonly icon: string }

const SOUND_TOGGLES: readonly Toggle[] = [
  { key: 'sound', label: 'おと', note: 'せいかい や タップの おと', icon: '🔔' },
  { key: 'music', label: 'おんがく', note: 'うしろで ながれる きょく', icon: '🎵' },
  { key: 'speech', label: 'よみあげ', note: 'よみ や ものがたり を こえで きく', icon: '🗣️' },
]

const PLAY_TOGGLES: readonly Toggle[] = [
  { key: 'icons', label: 'ヒント', note: 'パーツに え と なまえ を だす', icon: '💡' },
  { key: 'timer', label: 'タイマー', note: 'チャレンジで じかんを はかる', icon: '⏱️' },
]

/** ためしに読み上げる漢字 */
const SAMPLE_CHAR = '木'
const SAMPLE_YOMI = 'き'

type RowProps = { readonly toggle: Toggle; readonly checked: boolean; readonly onChange: (checked: boolean) => void }

/** 設定1つ: 絵 + 名前 + 説明 + スイッチ。 */
function ToggleRow({ toggle, checked, onChange }: RowProps) {
  const noteId = useId()
  return (
    <li className={`setting ${checked ? 'is-on' : ''}`}>
      <span className="setting__icon" aria-hidden="true">
        {toggle.icon}
      </span>
      <span className="setting__text">
        <span className="setting__label">{toggle.label}</span>
        <small id={noteId}>{toggle.note}</small>
      </span>
      <label className="switch">
        <input type="checkbox" aria-label={toggle.label} aria-describedby={noteId} checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span className="switch__track" aria-hidden="true">
          <span className="switch__knob" />
        </span>
      </label>
    </li>
  )
}

function Group({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <section className="settings__group" aria-label={title}>
      <h2 className="settings__group-title">{title}</h2>
      {children}
    </section>
  )
}

type Props = { readonly onHome: () => void; readonly onProfiles: () => void; readonly onParent: () => void }

/** せってい: あそんでいる人の きろく、音・ヒント・タイマーの切り替え、データのリセット。 */
export function SettingsScreen({ onHome, onProfiles, onParent }: Props) {
  const settings = useProgress((s) => s.settings)
  const updateSettings = useProgress((s) => s.updateSettings)
  const reset = useProgress((s) => s.reset)
  const xp = useProgress((s) => s.xp)
  const learnedCount = useProgress((s) => s.learned.length)
  const stamps = useProgress((s) => s.stamps)
  const streak = useProgress((s) => s.streak.count)
  const clearCount = useProgress((s) => Object.keys(s.clears).length)
  const hat = useProgress((s) => s.equipped.hat)
  const playerName = useProfiles((s) => s.profiles.find((p) => p.id === s.activeId)?.name ?? '')
  const { play, say } = useFeedback()
  const [confirming, setConfirming] = useState(false)

  const { level } = levelInfo(xp)
  const stage = mascotStage(level)
  const stampTotal = Object.values(stamps).reduce((sum, mask) => sum + stampCount(mask), 0)

  const handleReset = () => {
    reset()
    setConfirming(false)
  }

  const rows = (toggles: readonly Toggle[]) =>
    toggles.map((toggle) => <ToggleRow key={toggle.key} toggle={toggle} checked={settings[toggle.key]} onChange={(checked) => updateSettings({ [toggle.key]: checked })} />)

  return (
    <div className="screen settings">
      <TopBar onBack={onHome} backLabel="ホーム" title="せってい" />
      <div className="settings__body">
        <aside className="settings__me" aria-label="あそんでいる ひと">
          <Mascot stage={stage} hat={itemName(hat)} happy className="settings__mascot" />
          <p className="settings__name">{playerName}</p>
          <p className="settings__form">
            レベル {level}　{MASCOT_FORMS[stage].name}
          </p>
          <dl className="settings__stats">
            <div>
              <dt>
                <MiniIcon name="me" /> かんじ
              </dt>
              <dd>
                {learnedCount}
                <small> / {KANJI.length}</small>
              </dd>
            </div>
            <div>
              <dt>
                <MiniIcon name="fude" /> はんこ
              </dt>
              <dd>{stampTotal}</dd>
            </div>
            <div>
              <dt>
                <MiniIcon name="mato" /> たおした ボス
              </dt>
              <dd>{clearCount}</dd>
            </div>
            <div>
              <dt>
                <MiniIcon name="honoo" /> れんぞく
              </dt>
              <dd>
                {streak}
                <small> にち</small>
              </dd>
            </div>
          </dl>
          <button type="button" className="btn" onClick={onProfiles}>
            あそぶ ひとを かえる ⇄
          </button>
        </aside>

        <div className="settings__main">
          <Group title="おと">
            <ul className="settings__list">{rows(SOUND_TOGGLES)}</ul>
            <div className="settings__try">
              <button type="button" className="btn" disabled={!settings.sound} onClick={() => play('fanfare')}>
                🔔 おとを ためす
              </button>
              <button type="button" className="btn" disabled={!settings.speech} onClick={() => say(voiceId.word(SAMPLE_CHAR), SAMPLE_YOMI)}>
                🗣️ こえを ためす
              </button>
            </div>
          </Group>
          <Group title="あそびかた">
            <ul className="settings__list">{rows(PLAY_TOGGLES)}</ul>
          </Group>
          <Group title="データ">
            <div className="settings__reset">
              {confirming ? (
                <>
                  <span>「{playerName}」の きろくを ぜんぶ けして さいしょから？</span>
                  <button type="button" className="btn btn--danger" onClick={handleReset}>
                    けす
                  </button>
                  <button type="button" className="btn" onClick={() => setConfirming(false)}>
                    やめる
                  </button>
                </>
              ) : (
                <>
                  <span>きろくは この たんまつの なかに ほぞん されます</span>
                  <button type="button" className="btn" onClick={() => setConfirming(true)}>
                    データを リセット
                  </button>
                </>
              )}
            </div>
          </Group>
        </div>
      </div>
      <footer className="settings__about">
        <AppLogo className="settings__logo" />
        <span className="settings__version">バージョン {__APP_VERSION__}</span>
        <button type="button" className="btn settings__parent" onClick={onParent}>
          <MiniIcon name="kagi" /> おうちの かたへ
        </button>
        <span className="settings__credit">
          漢字の画データ:{' '}
          <a href="https://kanjivg.tagaini.net" target="_blank" rel="noreferrer">
            KanjiVG
          </a>{' '}
          © Ulrich Apel (CC BY-SA 3.0)
        </span>
      </footer>
    </div>
  )
}
