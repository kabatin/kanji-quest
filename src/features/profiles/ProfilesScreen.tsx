import { useState, type FormEvent } from 'react'
import { AppLogo } from '../../components/AppLogo'
import { Mascot } from '../../components/Mascot'
import { mascotStage } from '../../lib/level'
import { MAX_PROFILES, NAME_MAX, readSummary, type Profile } from '../../lib/profiles'
import { itemName } from '../../lib/shop'
import { useFeedback } from '../../lib/useFeedback'
import { useProfiles } from '../../store/profiles'

type Props = {
  /** あそぶ人が決まったとき */
  readonly onDone: () => void
  /** ホームから開いたとき(もどる を出す) */
  readonly canGoBack: boolean
}

/** なおす = 名前を変える・消す ためのボタンを出す(子どもが まちがえて消さないよう、ふだんは かくす) */
type Mode = 'pick' | 'edit'

type NameFormProps = { readonly label: string; readonly initial: string; readonly submitLabel: string; readonly onSubmit: (name: string) => boolean; readonly onCancel: () => void }

function NameForm({ label, initial, submitLabel, onSubmit, onCancel }: NameFormProps) {
  const [name, setName] = useState(initial)
  const [failed, setFailed] = useState(false)
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setFailed(!onSubmit(name))
  }
  return (
    <form className="name-form" onSubmit={handleSubmit}>
      <label>
        <span>{label}</span>
        <input type="text" value={name} maxLength={NAME_MAX} autoComplete="off" onChange={(event) => setName(event.target.value)} />
      </label>
      <p className="name-form__note" role="status">
        {failed ? `なまえを 1〜${NAME_MAX}もじで いれてね` : `${NAME_MAX}もじまで`}
      </p>
      <div className="name-form__actions">
        <button type="submit" className="btn btn--primary">
          {submitLabel}
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          やめる
        </button>
      </div>
    </form>
  )
}

/** 「だれが あそぶ？」: あそぶ人をえらぶ・ふやす・名前を変える・消す。 */
export function ProfilesScreen({ onDone, canGoBack }: Props) {
  const profiles = useProfiles((s) => s.profiles)
  const activeId = useProfiles((s) => s.activeId)
  const select = useProfiles((s) => s.select)
  const add = useProfiles((s) => s.add)
  const rename = useProfiles((s) => s.rename)
  const remove = useProfiles((s) => s.remove)
  const { play } = useFeedback()
  const [mode, setMode] = useState<Mode>('pick')
  const [adding, setAdding] = useState(false)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Profile | null>(null)

  const choose = (id: string) => {
    if (!select(id)) return
    play('ok')
    onDone()
  }

  const create = (name: string): boolean => {
    const id = add(name)
    if (!id) return false
    setAdding(false)
    choose(id)
    return true
  }

  return (
    <div className="screen profiles">
      <header className="bar">
        {canGoBack && (
          <button type="button" className="btn btn--back" onClick={onDone}>
            ← ホーム
          </button>
        )}
        <h1 className="bar__title">だれが あそぶ？</h1>
        <span className="bar__spacer" />
        <button type="button" className={`btn ${mode === 'edit' ? 'chip is-selected' : ''}`} aria-pressed={mode === 'edit'} onClick={() => setMode(mode === 'edit' ? 'pick' : 'edit')}>
          {mode === 'edit' ? 'おわる' : 'なおす'}
        </button>
      </header>
      <AppLogo className="profiles__logo" />
      <ul className="profiles__list">
        {profiles.map((profile) => {
          const summary = readSummary(profile.id)
          return (
            <li key={profile.id} className={`profile-card ${profile.id === activeId ? 'is-active' : ''}`}>
              {renaming === profile.id ? (
                <NameForm
                  label="あたらしい なまえ"
                  initial={profile.name}
                  submitLabel="きめる"
                  onSubmit={(name) => {
                    const ok = rename(profile.id, name)
                    if (ok) setRenaming(null)
                    return ok
                  }}
                  onCancel={() => setRenaming(null)}
                />
              ) : (
                <>
                  <button type="button" className="profile-card__pick" onClick={() => choose(profile.id)} aria-label={`${profile.name} で あそぶ`}>
                    <Mascot stage={mascotStage(summary.level)} hat={itemName(summary.hat)} className="profile-card__mascot" />
                    <span className="profile-card__name">{profile.name}</span>
                    <span className="profile-card__facts">
                      レベル {summary.level}　かんじ {summary.learned}
                    </span>
                  </button>
                  {mode === 'edit' && (
                    <div className="profile-card__edit">
                      <button type="button" className="btn" onClick={() => setRenaming(profile.id)} aria-label={`${profile.name} の なまえを かえる`}>
                        なまえ
                      </button>
                      <button type="button" className="btn btn--danger" disabled={profiles.length <= 1} onClick={() => setDeleting(profile)} aria-label={`${profile.name} を けす`}>
                        けす
                      </button>
                    </div>
                  )}
                </>
              )}
            </li>
          )
        })}
        {profiles.length < MAX_PROFILES && (
          <li className="profile-card profile-card--new">
            {adding ? (
              <NameForm label="なまえ" initial="" submitLabel="つくる" onSubmit={create} onCancel={() => setAdding(false)} />
            ) : (
              <button type="button" className="profile-card__pick" onClick={() => setAdding(true)}>
                <span className="profile-card__plus" aria-hidden="true">
                  ＋
                </span>
                <span className="profile-card__name">あたらしく つくる</span>
              </button>
            )}
          </li>
        )}
      </ul>
      {deleting && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="けす かくにん">
          <div className="modal__panel">
            <h2>「{deleting.name}」を けしますか？</h2>
            <p className="modal__lead">おぼえた かんじも コインも、ぜんぶ きえます。もとには もどせません</p>
            <div className="name-form__actions">
              <button type="button" className="btn btn--big" onClick={() => setDeleting(null)}>
                やめる
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => {
                  remove(deleting.id)
                  setDeleting(null)
                }}
              >
                けす
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
