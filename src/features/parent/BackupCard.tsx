import { useRef, useState } from 'react'
import { applyRestore, backupFileName, createBackup, MAX_BACKUP_CHARS, parseBackup, planRestore, readBackupInput, serializeBackup, type BackupEnv, type BackupFile, type BackupSummary } from '../../lib/backup'
import { useProfiles } from '../../store/profiles'
import { STORAGE_VERSION, useProgress } from '../../store/progress'
import { saveBackupFile, type SaveOutcome } from './backupFile'

type Status = { readonly tone: 'ok' | 'error'; readonly text: string }
type Pending = { readonly file: BackupFile; readonly summary: BackupSummary }

/** いまのアプリの保存データの版と項目(ファイルの検証に使う)。 */
function currentEnv(): BackupEnv {
  const stateKeys = Object.entries(useProgress.getState())
    .filter(([, value]) => typeof value !== 'function')
    .map(([key]) => key)
  return { progressVersion: STORAGE_VERSION, stateKeys }
}

const SAVED_TEXT: Readonly<Record<SaveOutcome, Status | null>> = {
  shared: { tone: 'ok', text: '書き出しました。保存先を確認してください(「“ファイル”に保存」など)。' },
  downloaded: { tone: 'ok', text: '書き出しました。ダウンロードしたファイルを大切に保管してください。' },
  cancelled: null,
}

/** 保護者向け: 記録をファイルに書き出す・ファイルから戻す。 */
export function BackupCard() {
  const picker = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status | null>(null)
  const [pending, setPending] = useState<Pending | null>(null)

  const handleExport = () => {
    setPending(null)
    try {
      const { profiles, activeId } = useProfiles.getState()
      const now = new Date()
      const { file, skipped } = createBackup(readBackupInput({ profiles, activeId }, localStorage), now, currentEnv())
      const note = skipped.length > 0 ? `(読み取れない記録が ${skipped.length}人ぶん ありました。その分は ふくまれていません)` : ''
      void saveBackupFile(serializeBackup(file), backupFileName(now)).then(
        (outcome) => {
          const saved = SAVED_TEXT[outcome]
          setStatus(saved && { ...saved, text: saved.text + note })
        },
        () => setStatus({ tone: 'error', text: 'ファイルを保存できませんでした。もう一度お試しください。' }),
      )
    } catch {
      setStatus({ tone: 'error', text: '記録を読み出せませんでした。ブラウザの設定で、サイトデータが禁止されていないか確認してください。' })
    }
  }

  const handlePick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const picked = input.files?.[0]
    input.value = ''
    setPending(null)
    if (!picked) return
    // 大きすぎるファイルは、読みこむ前にことわる(文字数は、バイト数以下)
    const text = picked.size > MAX_BACKUP_CHARS * 4 ? '' : await picked.text().catch(() => null)
    const result = text === null ? null : parseBackup(text, currentEnv())
    if (result?.ok) {
      setStatus(null)
      setPending({ file: result.file, summary: result.summary })
    } else {
      setStatus({ tone: 'error', text: result ? result.message : 'ファイルを開けませんでした。もう一度お試しください。' })
    }
  }

  const handleRestore = () => {
    if (!pending) return
    const currentIds = useProfiles.getState().profiles.map((p) => p.id)
    const result = applyRestore(localStorage, planRestore(pending.file, currentIds))
    if (result.ok) {
      // 画面に残っている記録が、読みこんだ記録を上書きしないよう、すぐに読みこみなおす
      window.location.reload()
    } else {
      setPending(null)
      setStatus({ tone: 'error', text: result.message })
    }
  }

  return (
    <section className="parent-card parent-card--backup" aria-label="記録のバックアップ">
      <h2>記録を残す・戻す</h2>
      <p className="parent__note">
        記録はこの端末のブラウザの中だけにあります。iPad は、長い間使わないと端末が記録を消すことがあります。ときどき書き出して、手元に残しておくと安心です。
      </p>
      <div className="parent__backup-actions">
        <button type="button" className="btn" onClick={handleExport}>
          記録を書き出す
        </button>
        <button type="button" className="btn" onClick={() => picker.current?.click()}>
          ファイルから戻す
        </button>
        <input ref={picker} type="file" accept=".json,application/json" hidden onChange={(event) => void handlePick(event)} aria-label="記録のファイルを選ぶ" />
      </div>

      {pending && (
        <div className="parent__backup-confirm" role="group" aria-label="読みこむ内容の確認">
          <p>
            <strong>{pending.summary.exportedOn}</strong> に書き出した記録です。
          </p>
          <ul className="parent__backup-list">
            {pending.summary.children.map((child) => (
              <li key={child.id}>
                {child.name}さん <small>覚えた漢字 {child.learned} 字</small>
              </li>
            ))}
          </ul>
          <p className="parent__note">{pending.summary.hasParent ? 'あそびの設定もいっしょに戻ります。' : 'あそびの設定は、いまのままです。'}</p>
          <p className="parent__backup-warn">いまの記録はすべて消え、このファイルの記録に置きかわります。元には戻せません。</p>
          <div className="parent__backup-actions">
            <button type="button" className="btn btn--danger" onClick={handleRestore}>
              いまの記録を置きかえる
            </button>
            <button type="button" className="btn" onClick={() => setPending(null)}>
              やめる
            </button>
          </div>
        </div>
      )}

      {status && (
        <p className={`parent__backup-status is-${status.tone}`} role={status.tone === 'error' ? 'alert' : 'status'}>
          {status.text}
        </p>
      )}
    </section>
  )
}
