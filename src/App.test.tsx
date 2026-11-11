import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { getKanji, KANJI, kanjiOfGrade } from './data/kanji'
import { getPart } from './data/parts'
import { PAGE_SIZE } from './features/zukan/Zukan'
import { bestKey, DEFAULT_QUESTION_COUNT } from './lib/score'
import { useProgress } from './store/progress'

const QUESTION_COUNT = DEFAULT_QUESTION_COUNT

const WAIT = { timeout: 4000 }

type User = ReturnType<typeof userEvent.setup>

/** ずかんで、その漢字がある学年とページまで進んでから開く。 */
async function openKanji(user: User, char: string) {
  const { grade } = getKanji(char)
  await user.click(screen.getByRole('tab', { name: `${grade}ねんせい` }))
  const index = kanjiOfGrade(grade).findIndex((k) => k.char === char)
  for (let i = 0; i < Math.floor(index / PAGE_SIZE); i += 1) {
    await user.click(screen.getByRole('button', { name: 'つぎの ページ' }))
  }
  await user.click(screen.getByRole('button', { name: new RegExp(`^${char}`) }))
}

/** いま出ている問題の正解カードを押す(お題・固定カード・選択肢から、どの漢字のどの段階かを引く)。 */
async function answerCurrent(user: User, container: HTMLElement) {
  const goal = container.querySelector('.kumi__goal-label')?.textContent
  const fixed = container.querySelector('.kumi__fixed [data-part]')?.getAttribute('data-part')
  const choices = [...container.querySelectorAll<HTMLButtonElement>('.kumi__choices button[data-part]')]
  const step = KANJI.flatMap((k) => k.steps.map((s) => ({ step: s, label: s.makes ? getPart(s.makes).label : k.yomi }))).find(
    (entry) => entry.label === goal && entry.step.fixed === fixed && choices.some((c) => c.dataset.part === entry.step.answer),
  )?.step
  const target = choices.find((c) => c.dataset.part === step?.answer)
  if (!target) throw new Error(`正解のカードが見つかりません: ${goal}`)
  await user.click(target)
}

beforeEach(() => {
  useProgress.getState().reset()
})

describe('ずかん → くみあわせ → なかま', () => {
  it('海: まちがえても進めて、さんずい + 毎 で合体し、なかまに池が出る', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)

    await openKanji(user, '海')
    expect(container.querySelector('.kumi__fixed [data-part="氵"]')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'うみ を つくろう' })).toBeInTheDocument()

    const wrong = container.querySelector<HTMLButtonElement>('.kumi__choices button:not([data-part="毎"])')
    if (!wrong) throw new Error('はずれのカードがありません')
    await user.click(wrong)
    expect(wrong).toBeDisabled()
    expect(screen.getByText('もういちど')).toBeInTheDocument()

    await user.click(container.querySelector('button[data-part="毎"]') as HTMLButtonElement)
    expect(screen.getByTestId('merged')).toBeInTheDocument()

    const nakama = await screen.findByRole('region', { name: 'なかま' }, WAIT)
    expect(within(nakama).getByRole('button', { name: /^池/ })).toBeInTheDocument()
    expect(within(nakama).getByRole('button', { name: /^汽/ })).toBeInTheDocument()
    expect(screen.getByText('＋10 ポイント')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'せつめい を きく' })).toHaveTextContent('さんずいは みずの しるし')
    expect(useProgress.getState().learned).toEqual(['海'])

    // なかまから次の漢字へ進める
    await user.click(within(nakama).getByRole('button', { name: /^池/ }))
    expect(container.querySelector('button[data-part="也"]')).toBeInTheDocument()
  })

  it('線: 2段階(白+水 → 泉、糸+泉 → 線)で合体する', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    await openKanji(user, '線')
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'いずみ を つくろう' })).toBeInTheDocument()
    await user.click(container.querySelector('button[data-part="水"]') as HTMLButtonElement)
    expect(await screen.findByText('2 / 2', undefined, WAIT)).toBeInTheDocument()
    await user.click(container.querySelector('button[data-part="泉"]') as HTMLButtonElement)
    expect(await screen.findByRole('button', { name: 'ずかんへ' }, WAIT)).toBeInTheDocument()
  })

  it('ヒントをオフにすると、絵と名前が出ない', async () => {
    useProgress.getState().updateSettings({ icons: false })
    const user = userEvent.setup()
    const { container } = render(<App />)
    await openKanji(user, '海')
    expect(container.querySelector('.part-card__hint')).not.toBeInTheDocument()
    expect(container.querySelector('.part-card__label')).not.toBeInTheDocument()
  })
})

describe('なりたち', () => {
  it('木: 絵 → 重なる → 漢字 と進み、なかまに休・森が出る', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    await openKanji(user, '木')
    expect(container.querySelector('.naritachi__stage')).toHaveAttribute('data-stage', '0')
    await user.click(screen.getByRole('button', { name: 'へんしん！' }))
    await user.click(screen.getByRole('button', { name: 'へんしん！' }))
    expect(container.querySelector('.naritachi__stage')).toHaveAttribute('data-stage', '2')
    await user.click(screen.getByRole('button', { name: 'できた！' }))
    const nakama = screen.getByRole('region', { name: 'なかま' })
    expect(within(nakama).getByRole('button', { name: /^休/ })).toBeInTheDocument()
    expect(within(nakama).getByRole('button', { name: /^森/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'ずかんへ' }))
    expect(screen.getByRole('button', { name: /^木.*おぼえた/ })).toBeInTheDocument()
    expect(screen.getByText('1 / 80')).toBeInTheDocument()
  })
})

describe('チャレンジ', () => {
  it('全問といて、点数が自己ベストとして残る', async () => {
    useProgress.getState().updateSettings({ timer: true })
    const user = userEvent.setup()
    const { container } = render(<App />)
    await user.click(screen.getByRole('button', { name: 'チャレンジ' }))
    expect(screen.getAllByText('まだ やってないよ')).toHaveLength(3)
    await user.click(screen.getByRole('button', { name: /え なし/ }))
    expect(container.querySelector('.part-card__hint')).not.toBeInTheDocument()
    expect(screen.getByText(/⏱/)).toBeInTheDocument()

    for (let i = 0; i < QUESTION_COUNT; i += 1) {
      await screen.findByText(`${i + 1} / ${QUESTION_COUNT}`, undefined, WAIT)
      await answerCurrent(user, container)
    }

    expect(await screen.findByText('じこベスト！', undefined, WAIT)).toBeInTheDocument()
    expect(screen.getByText(`${QUESTION_COUNT * 10} てん`)).toBeInTheDocument()
    expect(useProgress.getState().bests[bestKey(2, QUESTION_COUNT)]?.score).toBe(QUESTION_COUNT * 10)

    await user.click(screen.getByRole('button', { name: 'もういっかい' }))
    expect(screen.getByText(`1 / ${QUESTION_COUNT}`)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '← ずかん' }))
    expect(screen.getByText(`${QUESTION_COUNT * 10} ポイント`)).toBeInTheDocument()
  }, 30_000)
})

describe('チャレンジの えらびかた', () => {
  it('問題の数と範囲をえらべて、えらんだ数だけ出題される', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'チャレンジ' }))
    // まだ何も学んでいないので「おぼえた」はえらべない
    expect(screen.getByRole('button', { name: 'おぼえた' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: '10もん' }))
    await user.click(screen.getByRole('button', { name: '2ねんせい' }))
    expect(screen.getByRole('button', { name: '10もん' })).toHaveAttribute('aria-pressed', 'true')
    expect(useProgress.getState().challenge).toEqual({ count: 10, scope: 'grade2' })
    await user.click(screen.getByRole('button', { name: /え あり/ }))
    expect(screen.getByText('1 / 10')).toBeInTheDocument()
  })

  it('「おぼえた」は、学んだ漢字だけを出す(少なければ、ある分だけ)', async () => {
    useProgress.getState().completeKanji('海')
    useProgress.getState().completeKanji('林')
    useProgress.getState().setChallengeOptions({ scope: 'learned' })
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'チャレンジ' }))
    expect(screen.getByRole('button', { name: 'おぼえた' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: /え あり/ }))
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^(うみ|はやし) を つくろう$/ })).toBeInTheDocument()
  })
})

describe('ごほうび・せってい', () => {
  it('ポイントがたまるとスキンを選べる', async () => {
    useProgress.getState().finishChallenge(bestKey(1, 5), { score: 60, timeMs: 1000 })
    const user = userEvent.setup()
    const { container } = render(<App />)
    await user.click(screen.getByRole('button', { name: /ごほうび/ }))
    const sora = container.querySelector('button[data-skin="sora"]') as HTMLButtonElement
    const kin = container.querySelector('button[data-skin="kin"]') as HTMLButtonElement
    expect(sora).toBeEnabled()
    expect(kin).toBeDisabled()
    await user.click(sora)
    expect(sora).toHaveAttribute('aria-pressed', 'true')
    expect(container.querySelector('.app')).toHaveAttribute('data-skin', 'sora')
    expect(screen.getByText('あと 20 ポイントで おおきくなるよ')).toBeInTheDocument()
  })

  it('設定を切り替えられ、確認してからリセットできる', async () => {
    useProgress.getState().completeKanji('木')
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'せってい' }))
    await user.click(screen.getByRole('checkbox', { name: 'おと' }))
    expect(useProgress.getState().settings.sound).toBe(false)

    await user.click(screen.getByRole('button', { name: 'データを リセット' }))
    await user.click(screen.getByRole('button', { name: 'やめる' }))
    expect(useProgress.getState().learned).toEqual(['木'])
    await user.click(screen.getByRole('button', { name: 'データを リセット' }))
    await user.click(screen.getByRole('button', { name: 'けす' }))
    expect(useProgress.getState().learned).toEqual([])
    await user.click(screen.getByRole('button', { name: '← ずかん' }))
    expect(screen.getByText('0 / 80')).toBeInTheDocument()
  })
})
