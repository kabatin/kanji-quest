import { useState } from 'react'
import { dayKey } from '../../lib/date'
import type { Profile } from '../../lib/profiles'
import { useProfiles } from '../../store/profiles'
import { OverviewView } from './OverviewView'
import { SettingsView } from './SettingsView'
import { useChildReport } from './useChildReport'

type View = 'overview' | 'settings'

const VIEWS: readonly { readonly id: View; readonly label: string }[] = [
  { id: 'overview', label: '学習のようす' },
  { id: 'settings', label: '設定' },
]

type BarProps = {
  readonly onBack: () => void
  readonly profiles: readonly Profile[]
  readonly childId: string
  readonly onChild: (id: string) => void
  readonly view: View
  readonly onView: (view: View) => void
}

/** 上の帯: もどる・題・お子さんの切りかえ・画面の切りかえ(コインなど 子ども向けの物は 出さない) */
function ParentBar({ onBack, profiles, childId, onChild, view, onView }: BarProps) {
  return (
    <header className="pbar">
      <button type="button" className="parent__ghost pbar__back" onClick={onBack}>
        ← もどる
      </button>
      <h1 className="pbar__title">保護者の方へ</h1>
      {profiles.length > 1 && (
        <div className="pbar__children" role="tablist" aria-label="お子さん">
          {profiles.map((profile) => (
            <button key={profile.id} type="button" role="tab" aria-selected={profile.id === childId} className="pbar__child" onClick={() => onChild(profile.id)}>
              {profile.name}
            </button>
          ))}
        </div>
      )}
      <span className="pbar__spacer" />
      <div className="pseg pbar__views" role="tablist" aria-label="表示">
        {VIEWS.map((item) => (
          <button key={item.id} id={`parent-tab-${item.id}`} type="button" role="tab" aria-selected={item.id === view} aria-controls="parent-panel" className="pseg__btn" onClick={() => onView(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
    </header>
  )
}

type Props = { readonly onBack: () => void; readonly onOpen: (char: string) => void }

/**
 * 保護者向け: 子どもごとの学習のようす(文の まとめ・習熟マップ・伸び・書く力の割合・字ごとの記録)と、設定。
 * 記録は 端末から直接読む(あそぶ人を 切りかえずに 見られる)。
 */
export function ParentScreen({ onBack, onOpen }: Props) {
  const profiles = useProfiles((s) => s.profiles)
  const activeId = useProfiles((s) => s.activeId)
  const [childId, setChildId] = useState(activeId)
  const [view, setView] = useState<View>('overview')
  const child = profiles.find((p) => p.id === childId) ?? profiles[0]
  const input = useChildReport(child.id)
  const today = dayKey()

  return (
    <div className="screen parent" data-view={view}>
      <ParentBar onBack={onBack} profiles={profiles} childId={child.id} onChild={setChildId} view={view} onView={setView} />
      <div id="parent-panel" className="parent__view" role="tabpanel" aria-labelledby={`parent-tab-${view}`}>
        {view === 'overview' ? (
          <OverviewView key={child.id} input={input} name={child.name} today={today} canPractice={child.id === activeId} onOpen={onOpen} />
        ) : (
          <SettingsView childId={child.id} name={child.name} input={input} today={today} />
        )}
      </div>
      <p className="parent__trust">広告はありません。記録はこの端末の中だけにあり、外へは送りません。</p>
    </div>
  )
}
