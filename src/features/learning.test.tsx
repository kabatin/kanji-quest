import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { getKanji } from '../data/kanji'
import { fullGlyph, getStrokes } from '../data/strokes'
import { leafParts } from '../lib/boss'
import { dayKey } from '../lib/date'
import { useParent } from '../store/parent'
import { useProfiles } from '../store/profiles'
import { useProgress } from '../store/progress'

const WAIT = { timeout: 4000 }
const state = () => useProgress.getState()
type User = ReturnType<typeof userEvent.setup>

beforeEach(() => {
  localStorage.clear()
  useProfiles.getState().reload()
  state().reset()
  useParent.getState().reset()
  state().checkIn()
  state().claimLoginBonus()
})

/** いま出ている問題を とく(wrong のときは、わざと1回まちがえる)。 */
async function solve(user: User, container: HTMLElement, wrong = false) {
  const run = container.querySelector<HTMLElement>('.review-run')
  const char = run?.dataset.kanji
  if (!run || !char) throw new Error('ふくしゅう の画面がありません')
  const type = run.dataset.type
  if (type === 'write') {
    const svg = run.querySelector('.kaku__svg') as Element
    if (wrong) {
      fireEvent.pointerDown(svg, { clientX: 100, clientY: 100, pointerId: 1 })
      for (const x of [95, 90, 85, 80]) fireEvent.pointerMove(svg, { clientX: x, clientY: 100, pointerId: 1 })
      fireEvent.pointerUp(svg, { pointerId: 1 })
    }
    const numbers = (svg.getAttribute('data-strokes') ?? '').split(',').map(Number)
    const all = getStrokes(fullGlyph(char))
    for (const n of numbers) {
      const [first, ...rest] = all[n - 1].pts
      fireEvent.pointerDown(svg, { clientX: first[0], clientY: first[1], pointerId: 1 })
      for (const [x, y] of rest) fireEvent.pointerMove(svg, { clientX: x, clientY: y, pointerId: 1 })
      fireEvent.pointerUp(svg, { pointerId: 1 })
    }
    return
  }
  if (type === 'erabi') {
    if (wrong) await user.click(run.querySelector(`.erabi-card:not([data-kanji="${char}"])`) as HTMLButtonElement)
    await user.click(run.querySelector(`.erabi-card[data-kanji="${char}"]`) as HTMLButtonElement)
    return
  }
  if (type === 'parts') {
    const answers = leafParts(getKanji(char)).map((p) => p.id)
    if (wrong) await user.click(run.querySelector(`.parts-pick__choices button:not(${answers.map((id) => `[data-part="${id}"]`).join(',')})`) as HTMLButtonElement)
    for (const id of answers) await user.click(run.querySelector(`.parts-pick__choices button[data-part="${id}"]`) as HTMLButtonElement)
    return
  }
  const fixed = run.querySelector('.kumi__fixed [data-part]')?.getAttribute('data-part')
  const choices = [...run.querySelectorAll<HTMLButtonElement>('.kumi__choices button[data-part]')]
  const step = getKanji(char).steps.find((s) => s.fixed === fixed && choices.some((c) => c.dataset.part === s.answer))
  const target = choices.find((c) => c.dataset.part === step?.answer) as HTMLButtonElement
  if (wrong) await user.click(choices.find((c) => c !== target) as HTMLButtonElement)
  await user.click(target)
}

describe('きょうの ふくしゅう', () => {
  it('ふくしゅう する字がないときは、ホームに入り口が出ない', () => {
    render(<App />)
    expect(screen.queryByRole('button', { name: /きょうの ふくしゅう/ })).not.toBeInTheDocument()
  })

  it('ホームから始めて、まちがえた字は あした、できた字は 3日ご になる', async () => {
    const today = dayKey()
    useProgress.setState({
      learned: ['山', '休'],
      reviews: { 山: { due: today, step: 0 }, 休: { due: today, step: 0 } },
    })
    const user = userEvent.setup()
    const { container } = render(<App />)
    await user.click(screen.getByRole('button', { name: 'きょうの ふくしゅう 2じ' }))
    expect(screen.getByRole('heading', { name: 'きょうの ふくしゅう' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /はじめる/ }))

    const first = container.querySelector<HTMLElement>('.review-run')?.dataset.kanji
    await solve(user, container, true)
    await screen.findByText('2 / 2', undefined, WAIT)
    await solve(user, container)

    expect(await screen.findByRole('heading', { name: 'ふくしゅう おしまい！' }, WAIT)).toBeInTheDocument()
    const list = screen.getByRole('list', { name: 'けっか' })
    expect(within(list).getByLabelText('もういちど')).toBeInTheDocument()
    expect(within(list).getByLabelText('できた')).toBeInTheDocument()
    expect(list).toHaveTextContent('つぎは あした')
    expect(list).toHaveTextContent('つぎは 3にち ご')
    expect(state().misses).toEqual({ [first ?? '']: 1 })
    expect(state().daily.counters.review).toBe(1)

    await user.click(screen.getByRole('button', { name: 'ホームへ' }))
    expect(screen.queryByRole('button', { name: /きょうの ふくしゅう/ })).not.toBeInTheDocument()
  }, 30_000)

  it('ふくしゅう する字が ないときは、おわり と出る', async () => {
    useProgress.setState({ learned: ['山'], reviews: { 山: { due: '2099-01-01', step: 5 } } })
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'せってい' }))
    await user.click(screen.getByRole('button', { name: '← ホーム' }))
    expect(screen.queryByRole('button', { name: /きょうの ふくしゅう/ })).not.toBeInTheDocument()
  })
})

describe('保護者の方へ', () => {
  async function openParent(user: User) {
    await user.click(screen.getByRole('button', { name: 'せってい' }))
    await user.click(screen.getByRole('button', { name: /おうちの かたへ/ }))
    const question = screen.getByText('＝', { exact: false }).textContent ?? ''
    const [a, b] = question.match(/\d+/g)?.map(Number) ?? [0, 0]
    return a * b
  }

  it('かけ算に まちがえると入れず、正しいと 学習のようすが見られる', async () => {
    const today = dayKey()
    useProgress.setState({ learned: ['木', '山'], learnedOn: { 木: today }, misses: { 山: 2 }, playMinutes: { [today]: 12 }, reviews: { 木: { due: today, step: 0 } } })
    const user = userEvent.setup()
    render(<App />)
    const answer = await openParent(user)
    await user.type(screen.getByRole('textbox', { name: '答え' }), String(answer + 1))
    await user.click(screen.getByRole('button', { name: 'ひらく' }))
    expect(screen.getByRole('status')).toHaveTextContent('答えが違います')

    const next = screen.getByText('＝', { exact: false }).textContent ?? ''
    const [a, b] = next.match(/\d+/g)?.map(Number) ?? [0, 0]
    await user.type(screen.getByRole('textbox', { name: '答え' }), String(a * b))
    await user.click(screen.getByRole('button', { name: 'ひらく' }))

    expect(screen.getByRole('heading', { name: '保護者の方へ' })).toBeInTheDocument()
    const summary = screen.getByRole('region', { name: 'プレイヤー1さんの まとめ' })
    expect(within(summary).getByText('覚えた漢字').nextElementSibling).toHaveTextContent('2 / 240')
    expect(within(summary).getByText('今日の復習').nextElementSibling).toHaveTextContent('1 字')
    const week = screen.getByRole('region', { name: 'この1週間' })
    expect(week).toHaveTextContent('7日で 1字')
    expect(week).toHaveTextContent('7日で 12分')
    const weak = screen.getByRole('region', { name: '苦手な漢字' })
    expect(within(weak).getByRole('button', { name: '山(2回 間違い)を開く' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('このブラウザ')
  })

  it('ボスの問題の数と1日の回数を変えると、ボスの画面に反映される', async () => {
    useProgress.setState({ learned: ['一', '二', '三', '四', '五'].filter(Boolean) })
    const user = userEvent.setup()
    render(<App />)
    const answer = await openParent(user)
    await user.type(screen.getByRole('textbox', { name: '答え' }), String(answer))
    await user.click(screen.getByRole('button', { name: 'ひらく' }))
    await user.click(screen.getByRole('button', { name: '短め(10問)' }))
    await user.click(screen.getByRole('button', { name: '5回' }))
    expect(useParent.getState()).toMatchObject({ bossSize: 'short', bossTries: 5 })
    expect(screen.getByRole('button', { name: '5回' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('子どもが2人以上いると、切りかえずに それぞれの きろくを見られる', async () => {
    state().completeKanji('木')
    const second = useProfiles.getState().add('はな')
    if (!second) throw new Error('作れませんでした')
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'プレイヤー1 で あそぶ' }))
    const answer = await openParent(user)
    await user.type(screen.getByRole('textbox', { name: '答え' }), String(answer))
    await user.click(screen.getByRole('button', { name: 'ひらく' }))
    expect(screen.getByRole('region', { name: 'プレイヤー1さんの まとめ' })).toHaveTextContent('1 / 240')
    await user.click(screen.getByRole('tab', { name: 'はな' }))
    expect(screen.getByRole('region', { name: 'はなさんの まとめ' })).toHaveTextContent('0 / 240')
    expect(useProfiles.getState().activeId).toBe('p1')
  })
})

describe('パーツ クエスト', () => {
  it('コンプリートに近い パーツが出て、「さがしに いく」で その字を学べる', async () => {
    useProgress.setState({ learned: ['右'] })
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /^パーツ/ }))
    const quest = screen.getByRole('region', { name: 'パーツ クエスト' })
    expect(quest).toHaveTextContent('「て」の かんじを あと 1つ みつけよう')
    await user.click(within(quest).getByRole('button', { name: /さがしに いく/ }))
    expect(screen.getByRole('img', { name: '左 の ものがたり' })).toBeInTheDocument()
  })

  it('コンプリートすると ホームに しるしが出て、パーツずかん で ごほうびを1回 受け取れる', async () => {
    useProgress.setState({ learned: ['右', '左'], coins: 0 })
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByLabelText(/^ごほうび \d+こ$/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^パーツ/ }))
    await user.click(screen.getByRole('button', { name: 'て の パーツ コンプリート' }))
    await user.click(screen.getByRole('button', { name: /コンプリート！ ごほうびを うけとる/ }))
    expect(state().partClaims).toContain('ナ')
    expect(state().coins).toBe(20)
    expect(screen.queryByRole('button', { name: /ごほうびを うけとる/ })).not.toBeInTheDocument()
    expect(screen.getByLabelText('コンプリート')).toBeInTheDocument()
  })
})
