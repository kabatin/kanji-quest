import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useProgress } from '../../store/progress'
import { SettingsScreen } from './SettingsScreen'

const state = () => useProgress.getState()
const group = (name: string) => within(screen.getByRole('radiogroup', { name }))

beforeEach(() => {
  state().reset()
})

function setup() {
  render(<SettingsScreen onHome={() => undefined} onProfiles={() => undefined} onParent={() => undefined} />)
  return userEvent.setup()
}

describe('せってい: 大きさ・ききて・うごき', () => {
  it('いまの ON は「ふつう」、OFF は「なし」で えらばれて見える', () => {
    state().updateSettings({ music: false })
    setup()
    expect(group('おと').getByRole('radio', { name: 'ふつう' })).toBeChecked()
    expect(group('おんがく').getByRole('radio', { name: 'なし' })).toBeChecked()
  })

  it('大きさを えらぶと 保存され、「なし」のあと 大きさを えらびなおせる', async () => {
    const user = setup()
    await user.click(group('よみあげ').getByRole('radio', { name: 'おおきい' }))
    expect(state().settings).toMatchObject({ speech: true, speechVol: 'high' })
    await user.click(group('よみあげ').getByRole('radio', { name: 'なし' }))
    expect(state().settings).toMatchObject({ speech: false, speechVol: 'high' })
    await user.click(group('よみあげ').getByRole('radio', { name: 'ちいさい' }))
    expect(state().settings).toMatchObject({ speech: true, speechVol: 'low' })
  })

  it('ききて と うごきを へらす を かえられる(はじめは みぎ・オフ)', async () => {
    const user = setup()
    expect(group('ききて').getByRole('radio', { name: 'みぎ' })).toBeChecked()
    await user.click(group('ききて').getByRole('radio', { name: 'ひだり' }))
    expect(state().settings.handed).toBe('left')
    await user.click(screen.getByRole('checkbox', { name: 'うごきを へらす' }))
    expect(state().settings.reduceMotion).toBe(true)
  })
})
