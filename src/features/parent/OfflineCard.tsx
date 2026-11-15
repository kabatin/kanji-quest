import { useEffect, useState } from 'react'
import { offlineStatus, type OfflineStatus } from '../../lib/pwa'

const statusText = (offline: OfflineStatus | null): string => {
  if (offline === null) return '確認中…'
  if (!offline.supported) return 'このブラウザ・開発中の画面では使えません(公開した版で使えます)。'
  const voice = `音声 ${offline.voiceCached} / ${offline.voiceTotal}`
  return offline.shell ? `端末に保存済みで、電波がなくても遊べます(${voice})。` : `まだ端末に保存されていません(${voice})。`
}

/** 電波がなくても遊べるかどうか */
export function OfflineCard() {
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

  return (
    <section className="parent-card poffline" aria-label="オフライン">
      <h2>オフライン</h2>
      <p className="parent__offline" role="status">
        {statusText(offline)}
      </p>
    </section>
  )
}
