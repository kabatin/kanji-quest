import { describe, expect, it } from 'vitest'
import { useParent } from '../store/parent'
import { STORAGE_KEY, STORAGE_VERSION, useProgress } from '../store/progress'
import { createBackup, parseBackup, readBackupInput } from './backup'

/** 実際のストアが保存する形が、バックアップの検証を通ること(項目が ふえたときに気づくため)。 */
const ENV = { progressVersion: STORAGE_VERSION, stateKeys: Object.entries(useProgress.getState()).filter(([, v]) => typeof v !== 'function').map(([k]) => k) }

describe('backup: 実際の保存データ', () => {
  it('ストアが書いた保存データと 保護者設定が、書き出し・検証を通る', () => {
    useProgress.getState().completeKanji('日', '2026-11-14')
    useProgress.getState().addPlayMinute('2026-11-14')
    useParent.getState().update({ bossSize: 'short' })

    const profiles = { profiles: [{ id: 'p1', name: 'たろう' }], activeId: 'p1' }
    const { file, skipped } = createBackup(readBackupInput(profiles, localStorage), new Date(), ENV)
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
    expect(skipped).toEqual([])
    expect(file.parent?.bossSize).toBe('short')

    const result = parseBackup(JSON.stringify(file), ENV)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.summary.children[0].learned).toBe(1)
  })
})
