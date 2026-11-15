import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ALL_STAGES } from '../../data/areas'
import { addDays, dayKey } from '../../lib/date'
import { storageKeyFor } from '../../lib/profiles'
import { STAMPS } from '../../lib/rewards'
import { useParent } from '../../store/parent'
import { useProfiles } from '../../store/profiles'
import { useProgress } from '../../store/progress'
import { ParentScreen } from './ParentScreen'

const today = dayKey()
const FIRST = ALL_STAGES[0].kanji
const OTHER = ALL_STAGES[1].kanji[0]

beforeEach(() => {
  localStorage.clear()
  useProfiles.getState().reload()
  useProgress.getState().reset()
  useParent.getState().reset()
})

function renderScreen() {
  const onOpen = vi.fn()
  const user = userEvent.setup()
  render(<ParentScreen onBack={() => undefined} onOpen={onOpen} />)
  return { onOpen, user }
}

/** 2週間 前から 学んでいる子(覚えた日・答えの記録・苦手 あり) */
function seedActive() {
  useProgress.setState({
    learned: [FIRST[0], FIRST[1], FIRST[2]],
    learnedOn: { [FIRST[0]]: addDays(today, -14), [FIRST[1]]: addDays(today, -2), [FIRST[2]]: today },
    stamps: { [FIRST[0]]: STAMPS.learn | STAMPS.write, [FIRST[1]]: STAMPS.learn, [FIRST[2]]: STAMPS.learn },
    misses: { [FIRST[1]]: 2 },
    reviews: { [FIRST[0]]: { due: addDays(today, 3), step: 2 }, [FIRST[1]]: { due: today, step: 0 } },
    answerLog: { [FIRST[0]]: { a: [], n: 4, x: 1, w: 2, b: addDays(today, -3) } },
    answerDays: { [today]: [6, 5, 1, 1, 3, 1] },
    playMinutes: { [today]: 12, [addDays(today, -1)]: 20 },
  })
}

describe('保護者の画面: 学習のようす', () => {
  it('文の まとめ・これまでの数・習熟マップ(240字・凡例の数・苦手の印)・伸び・割合 が出る', () => {
    seedActive()
    renderScreen()
    expect(screen.getByRole('heading', { name: '保護者の方へ' })).toBeInTheDocument()
    const summary = screen.getByRole('region', { name: 'プレイヤー1さんの まとめ' })
    expect(summary).toHaveTextContent('この1週間で2字を覚え')
    expect(within(summary).getByText('覚えた字').nextElementSibling).toHaveTextContent('3 / 240字')
    expect(within(summary).getByText('自力で書けた字').nextElementSibling).toHaveTextContent('1字')

    const map = screen.getByRole('region', { name: '習熟マップ' })
    expect(within(map).getAllByRole('button')).toHaveLength(240)
    const legend = within(map).getByRole('list', { name: '凡例' })
    expect(legend).toHaveTextContent('まだ237')
    expect(legend).toHaveTextContent('見ないで書ける1')
    expect(legend).toHaveTextContent('苦手1')
    expect(within(map).getByRole('button', { name: `${FIRST[1]} 学んだ・苦手(2回)` })).toHaveAttribute('data-weak', 'true')

    expect(screen.getByRole('region', { name: '週ごとの伸び' })).toHaveTextContent('覚えた字自力で書けた字')
    expect(screen.getByRole('table', { name: '週ごとの伸び(累計)' })).toBeInTheDocument()
    const rates = screen.getByRole('region', { name: '書く力のようす' })
    expect(within(rates).getByRole('group', { name: '1週間たっても書けた割合' })).toHaveTextContent('あと少しで見えます')
    expect(within(rates).getByRole('group', { name: 'ヒントを使った割合' })).toHaveTextContent('あと2問で出ます')
    expect(screen.getByText(/広告はありません。記録はこの端末の中だけ/)).toBeInTheDocument()
  })

  it('字を押すと くわしい記録が出て、「この字を練習する」で その字を開く', async () => {
    seedActive()
    const { onOpen, user } = renderScreen()
    await user.click(screen.getByRole('button', { name: new RegExp(`^${FIRST[1]} 学んだ`) }))
    const detail = screen.getByRole('region', { name: new RegExp(`^${FIRST[1]}`) })
    expect(detail).toHaveTextContent('学んだ')
    expect(detail).toHaveTextContent('あと2回の正解で苦手でなくなります')
    expect(detail).toHaveTextContent('きょう(復習の日が来ています)')
    expect(detail).toHaveTextContent('記録をとりはじめてからは、まだありません')
    expect(screen.queryByRole('region', { name: '週ごとの伸び' })).not.toBeInTheDocument()
    await user.click(within(detail).getByRole('button', { name: 'この字を練習する' }))
    expect(onOpen).toHaveBeenCalledWith(FIRST[1])
    await user.click(within(detail).getByRole('button', { name: 'くわしい記録を閉じる' }))
    expect(screen.getByRole('region', { name: '週ごとの伸び' })).toBeInTheDocument()
  })

  it('子どもが2人以上いると、切りかえずに それぞれを見られる。ほかの子の字は 練習へ行かず 案内を出す', async () => {
    seedActive()
    const second = useProfiles.getState().add('はな')
    if (!second) throw new Error('作れませんでした')
    const { user } = renderScreen()
    await user.click(screen.getByRole('tab', { name: 'はな' }))
    const summary = screen.getByRole('region', { name: 'はなさんの まとめ' })
    expect(summary).toHaveTextContent('まだ記録がありません')
    expect(within(summary).getByText('覚えた字').nextElementSibling).toHaveTextContent('0 / 240字')
    expect(screen.getByRole('region', { name: '週ごとの伸び' })).toHaveTextContent('まだ覚えた字がありません')
    expect(useProfiles.getState().activeId).toBe('p1')
    await user.click(screen.getByRole('button', { name: `${FIRST[0]} まだ` }))
    expect(screen.queryByRole('button', { name: 'この字を練習する' })).not.toBeInTheDocument()
    expect(screen.getByText('この字を練習するときは、あそぶ人をはなさんに切りかえてから開いてください。')).toBeInTheDocument()
  })

  it('使いはじめの子は「1週間ぶん たまると見えます」、ログのない古い記録の子は 見つもった段階と 説明が出る', async () => {
    useProgress.setState({ learned: [FIRST[0]], learnedOn: { [FIRST[0]]: today }, stamps: { [FIRST[0]]: STAMPS.learn } })
    localStorage.setItem(
      storageKeyFor('p2'),
      JSON.stringify({
        state: { learned: [FIRST[0], FIRST[1]], stamps: { [FIRST[0]]: STAMPS.learn }, reviews: { [FIRST[0]]: { due: today, step: 5 }, [FIRST[1]]: { due: today, step: 4 } } },
        version: 5,
      }),
    )
    useProfiles.getState().add('ゆう')
    const { user } = renderScreen()
    expect(screen.getByRole('region', { name: '週ごとの伸び' })).toHaveTextContent('記録が1週間ぶん たまると、週ごとの伸びが線で見えます(あと6日)')

    await user.click(screen.getByRole('tab', { name: 'ゆう' }))
    expect(screen.getByRole('button', { name: `${FIRST[0]} 定着` })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `${FIRST[1]} 見ないで書ける` })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '週ごとの伸び' })).toHaveTextContent('記録をとりはじめる前に覚えた2字は、はじめの週から数えています。')
    await user.click(screen.getByRole('button', { name: `${FIRST[0]} 定着` }))
    expect(screen.getByRole('region', { name: new RegExp(`^${FIRST[0]}`) })).toHaveTextContent('記録をとりはじめる前')
  })
})

describe('保護者の画面: 設定', () => {
  async function openSettings() {
    const result = renderScreen()
    await result.user.click(screen.getByRole('tab', { name: '設定' }))
    return result
  }

  it('ボスの問題数・1日の挑戦・1日の復習を変えられる(この端末の全員)', async () => {
    const { user } = await openSettings()
    await user.click(screen.getByRole('button', { name: '短め(10問)' }))
    await user.click(screen.getByRole('button', { name: '5回' }))
    await user.click(screen.getByRole('button', { name: '15字' }))
    expect(useParent.getState()).toMatchObject({ bossSize: 'short', bossTries: 5, reviewPerDay: 15 })
    expect(screen.getByRole('button', { name: '5回' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('このブラウザ')
    expect(screen.getByRole('region', { name: '記録のバックアップ' })).toBeInTheDocument()
  })

  it('1日の時間は 子どもごと。きょうだけの延長と、あと何分 が出る', async () => {
    useProgress.setState({ playMinutes: { [today]: 12 } })
    const { user } = await openSettings()
    const card = screen.getByRole('region', { name: 'プレイヤー1さんの 1日の時間' })
    expect(card).toHaveTextContent('上限はありません。きょうは12分遊びました。')
    expect(within(card).getByRole('button', { name: '+10分' })).toBeDisabled()
    await user.click(within(card).getByRole('button', { name: '30分' }))
    expect(useParent.getState().playLimits).toEqual({ p1: 30 })
    expect(card).toHaveTextContent('きょうは12分遊びました。あと18分遊べます。')
    await user.click(within(card).getByRole('button', { name: '+15分' }))
    expect(card).toHaveTextContent('あと33分遊べます(きょうだけ15分延長しています)')
    await user.click(within(card).getByRole('button', { name: '延長をやめる(15分)' }))
    expect(useParent.getState().playExtra).toEqual({})
    expect(screen.getByRole('table', { name: 'この7日の遊んだ時間' })).toHaveTextContent('12分')
  })

  it('あそぶ人を消すと、その子の 時間の設定も消える', () => {
    const second = useProfiles.getState().add('はな')
    if (!second) throw new Error('作れませんでした')
    useParent.getState().setPlayLimit(second, 45)
    useParent.getState().extendPlay(second, 10, today)
    useProfiles.getState().remove(second)
    expect(useParent.getState().playLimits).toEqual({})
    expect(useParent.getState().playExtra).toEqual({})
  })
})

describe('保護者の画面: 宿題の字', () => {
  it('表から字を押して えらび・はずせる。覚えていない字には 案内が出て、ぜんぶ見ないで書けたら 分かる', async () => {
    seedActive()
    const { user } = renderScreen()
    await user.click(screen.getByRole('tab', { name: '宿題の字' }))
    const map = screen.getByRole('region', { name: '練習させたい字を選ぶ' })
    await user.click(within(map).getByRole('button', { name: new RegExp(`^${FIRST[0]} `) }))
    await user.click(within(map).getByRole('button', { name: new RegExp(`^${OTHER} `) }))
    expect(useParent.getState().homework.p1).toEqual({ [FIRST[0]]: today, [OTHER]: today })
    const list = screen.getByRole('region', { name: '今週の練習' })
    expect(list).toHaveTextContent('2 / 20字')
    expect(list).toHaveTextContent('まだ覚えていません。「この字を練習する」から学べます')
    expect(list).not.toHaveTextContent('すべて「見ないで書ける」')
    await user.click(within(list).getByRole('button', { name: `${OTHER}を はずす` }))
    expect(list).toHaveTextContent('1 / 20字')
    expect(list).toHaveTextContent('すべて「見ないで書ける」になりました')
    await user.click(within(list).getByRole('button', { name: 'ぜんぶ はずす' }))
    expect(useParent.getState().homework).toEqual({})
  })
})
