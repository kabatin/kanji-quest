import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { ALL_STAGES, AREAS } from './data/areas'
import { getKanji, kanjiOfGrade } from './data/kanji'
import { fullGlyph, getStrokes } from './data/strokes'
import { leafParts } from './lib/boss'
import { dayKey } from './lib/date'
import { levelInfo } from './lib/level'
import { hasStamp } from './lib/rewards'
import { examId, stagesOfGrade } from './lib/stages'
import { bestKey, DEFAULT_QUESTION_COUNT } from './lib/score'
import { useProgress } from './store/progress'

const WAIT = { timeout: 4000 }
const QUESTION_COUNT = DEFAULT_QUESTION_COUNT

type User = ReturnType<typeof userEvent.setup>

const state = () => useProgress.getState()

/** ログインボーナスの窓が出ない状態(その日はもう受け取りずみ)で始める。 */
function alreadyCheckedIn() {
  state().checkIn()
  state().claimLoginBonus()
  useProgress.setState({ coins: 0 })
}

/** ホームからずかんを開き、その漢字がある学年をえらんでから開く。 */
async function openFromZukan(user: User, char: string) {
  await user.click(screen.getByRole('button', { name: /^ずかん/ }))
  const { grade } = getKanji(char)
  await user.click(screen.getByRole('tab', { name: `${grade}ねんせい` }))
  await user.click(screen.getByRole('button', { name: new RegExp(`^${char}`) }))
}

/** 書き取りの画面で、お手本の通り道どおりに全部の画を書く。 */
function writeAllStrokes(container: HTMLElement, char: string) {
  const svg = container.querySelector('.kaku__svg')
  if (!svg) throw new Error('書き取りの画面がありません')
  for (const stroke of getStrokes(fullGlyph(char))) {
    const [first, ...rest] = stroke.pts
    fireEvent.pointerDown(svg, { clientX: first[0], clientY: first[1], pointerId: 1 })
    for (const [x, y] of rest) fireEvent.pointerMove(svg, { clientX: x, clientY: y, pointerId: 1 })
    fireEvent.pointerUp(svg, { pointerId: 1 })
  }
}

/** 画番号を指定して、お手本の通り道どおりに書く。 */
function writeStrokes(svg: Element, char: string, numbers: readonly number[]) {
  const all = getStrokes(fullGlyph(char))
  for (const n of numbers) {
    const [first, ...rest] = all[n - 1].pts
    fireEvent.pointerDown(svg, { clientX: first[0], clientY: first[1], pointerId: 1 })
    for (const [x, y] of rest) fireEvent.pointerMove(svg, { clientX: x, clientY: y, pointerId: 1 })
    fireEvent.pointerUp(svg, { pointerId: 1 })
  }
}

/** ボスの問題を、まちがえずに1問とく。wrongFirst のときは、先に1回わざと まちがえる。 */
async function solveBossQuestion(user: User, container: HTMLElement, wrongFirst = false) {
  const run = container.querySelector<HTMLElement>('.boss-run')
  const char = run?.dataset.kanji
  if (!run || !char) throw new Error('ボスの画面がありません')
  if (run.dataset.type === 'write') {
    const svg = run.querySelector('.kaku__svg')
    if (!svg) throw new Error('書き取りの画面がありません')
    const numbers = (svg.getAttribute('data-strokes') ?? '').split(',').map(Number)
    // 書き順をまちがえる: さいごの画を先に書く(1画だけの字なら、でたらめな線)
    if (wrongFirst) {
      fireEvent.pointerDown(svg, { clientX: 100, clientY: 100, pointerId: 1 })
      for (const x of [95, 90, 85, 80]) fireEvent.pointerMove(svg, { clientX: x, clientY: 100, pointerId: 1 })
      fireEvent.pointerUp(svg, { pointerId: 1 })
    }
    writeStrokes(svg, char, numbers)
    return
  }
  if (run.dataset.type === 'parts') {
    const answers = leafParts(getKanji(char)).map((p) => p.id)
    if (wrongFirst) await user.click(run.querySelector(`.parts-pick__choices button:not(${answers.map((id) => `[data-part="${id}"]`).join(',')})`) as HTMLButtonElement)
    for (const id of answers) await user.click(run.querySelector(`.parts-pick__choices button[data-part="${id}"]`) as HTMLButtonElement)
    return
  }
  if (wrongFirst && run.dataset.type === 'erabi') await user.click(run.querySelector(`.erabi-card:not([data-kanji="${char}"])`) as HTMLButtonElement)
  await answerCurrent(user, container, '.boss-run', wrongFirst && run.dataset.type === 'kumi')
}

/** クイズ(または ボス)で、いま出ている問題の正解を押す。 */
async function answerCurrent(user: User, container: HTMLElement, root = '.quiz', wrongFirst = false) {
  const quiz = container.querySelector<HTMLElement>(root)
  const char = quiz?.dataset.kanji
  if (!quiz || !char) throw new Error('クイズの画面がありません')
  if (quiz.dataset.type === 'erabi') {
    await user.click(quiz.querySelector(`.erabi-card[data-kanji="${char}"]`) as HTMLButtonElement)
    return
  }
  const fixed = quiz.querySelector('.kumi__fixed [data-part]')?.getAttribute('data-part')
  const choices = [...quiz.querySelectorAll<HTMLButtonElement>('.kumi__choices button[data-part]')]
  const step = getKanji(char).steps.find((s) => s.fixed === fixed && choices.some((c) => c.dataset.part === s.answer))
  const target = choices.find((c) => c.dataset.part === step?.answer)
  if (!target) throw new Error(`正解のカードが見つかりません: ${char}`)
  if (wrongFirst) await user.click(choices.find((c) => c !== target) as HTMLButtonElement)
  await user.click(target)
}

/** クイズを最後まで、全部1回で正解する。 */
async function clearQuiz(user: User, container: HTMLElement, count: number) {
  for (let i = 0; i < count; i += 1) {
    await screen.findByText(`${i + 1} / ${count}`, undefined, WAIT)
    await answerCurrent(user, container)
  }
}

beforeEach(() => {
  state().reset()
})

describe('ホーム', () => {
  it('その日はじめて開くとログインボーナスが出て、受け取るとコインがふえる', async () => {
    const user = userEvent.setup()
    render(<App />)
    const dialog = screen.getByRole('dialog', { name: 'ログインボーナス' })
    expect(within(dialog).getByText('れんぞく 1にちめ')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'コインを 5まい うけとる' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText('コイン 5まい')).toBeInTheDocument()
    expect(screen.getByLabelText('れんぞく 1にち')).toBeInTheDocument()
    expect(screen.getByLabelText('レベル 1')).toBeInTheDocument()
  })

  it('きょうのミッションが3つ出て、達成したものだけ受け取れる', async () => {
    alreadyCheckedIn()
    useProgress.setState({
      daily: { day: dayKey(), counters: { learn: 9, learnNew: 9, write: 9, challenge: 9, firstTry: 9, maxCombo: 9, stage: 9, review: 9 }, claimed: [] },
    })
    const user = userEvent.setup()
    render(<App />)
    const missions = screen.getByRole('region', { name: 'きょうの ミッション' })
    const claims = within(missions).getAllByRole('button', { name: /うけとる$/ })
    expect(claims).toHaveLength(3)
    await user.click(claims[0])
    expect(within(missions).getByLabelText('うけとった')).toBeInTheDocument()
    expect(state().coins).toBeGreaterThan(0)
    expect(within(missions).getAllByRole('button', { name: /うけとる$/ })).toHaveLength(2)
  })

  it('メニューは「あそぶ」と「あつめる」に分かれている', () => {
    alreadyCheckedIn()
    render(<App />)
    const play = screen.getByRole('region', { name: 'あそぶ' })
    expect(within(play).getAllByRole('button').map((b) => b.textContent)).toEqual(['ぼうけん', 'チャレンジ'])
    const collect = screen.getByRole('region', { name: 'あつめる' })
    expect(within(collect).getByRole('button', { name: /^ずかん/ })).toHaveTextContent('0 / 240')
    expect(within(collect).getByRole('button', { name: /^パーツ/ })).toBeInTheDocument()
    expect(within(collect).getByRole('button', { name: /^きせかえ/ })).toHaveTextContent('0 / 31')
    // 3D が使えない環境では、絵の森が代わりに出る
    expect(screen.getByRole('img', { name: /^そだった き/ })).toBeInTheDocument()
  })

  it('すみまるの せいちょう が見えて、レベルが上がって すがたが変わると おいわいが出る', async () => {
    alreadyCheckedIn()
    const user = userEvent.setup()
    render(<App />)
    const grow = screen.getByRole('region', { name: 'すみまるの せいちょう' })
    expect(within(grow).getByRole('heading', { name: 'すみの しずく' })).toBeInTheDocument()
    expect(grow).toHaveTextContent('あと 3 レベルで すがたが かわるよ')
    expect(within(grow).getByRole('progressbar', { name: 'つぎの すがた まで' })).toHaveAttribute('aria-valuenow', '0')
    // 森の そだちぐあい も見える
    expect(grow).toHaveTextContent('もりの き0ほん')
    expect(within(grow).getByRole('progressbar', { name: 'もりの そだちぐあい' })).toHaveAttribute('aria-valuenow', '0')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    useProgress.setState({ xp: 300 })
    expect(levelInfo(300).level).toBe(5)
    const dialog = await screen.findByRole('dialog', { name: 'レベルアップ' })
    expect(within(dialog).getByRole('heading', { name: 'レベル 5 に アップ！' })).toBeInTheDocument()
    expect(within(dialog).getByText('すみまるの すがたが かわった！')).toBeInTheDocument()
    expect(within(dialog).getByText('ふでの こ')).toBeInTheDocument()
    expect(within(dialog).getByText(/あたらしい きせかえが \d+こ かえるように なったよ/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'やったー！' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(state().seenLevel).toBe(5)
    expect(within(grow).getByRole('heading', { name: 'ふでの こ' })).toBeInTheDocument()
  })
})

describe('まなぶ: ものがたり → かく → けっか', () => {
  it('「つづきから」で最初の字が始まり、書くと はんこ が2つ押されて、次の字へ進める', async () => {
    alreadyCheckedIn()
    const user = userEvent.setup()
    const { container } = render(<App />)
    const [first, second] = ALL_STAGES[0].kanji

    await user.click(screen.getByRole('button', { name: /つづきから まなぶ/ }))
    expect(screen.getByRole('img', { name: `${first} の ものがたり` })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'つぎへ' }))

    // 分けられない字は「くみあわせ」をとばして、書く練習へ
    expect(screen.getByText('ゆびで なぞって かこう')).toBeInTheDocument()
    writeAllStrokes(container, first)
    expect(screen.getByText('かけた！')).toBeInTheDocument()

    const next = await screen.findByRole('button', { name: `つぎの かんじ「${second}」へ` }, WAIT)
    expect(state().learned).toEqual([first])
    expect(hasStamp(state().stamps[first], 'learn')).toBe(true)
    expect(hasStamp(state().stamps[first], 'write')).toBe(true)
    expect(screen.getByText('けいけんち ＋30')).toBeInTheDocument()

    await user.click(next)
    expect(screen.getByRole('img', { name: `${second} の ものがたり` })).toBeInTheDocument()
  })

  it('まちがえた線は数えるだけで進まず、2回まちがえると お手本が出る', async () => {
    alreadyCheckedIn()
    const user = userEvent.setup()
    const { container } = render(<App />)
    await openFromZukan(user, '山')
    await user.click(screen.getByRole('button', { name: 'つぎへ' }))
    const svg = container.querySelector('.kaku__svg') as SVGSVGElement
    const scribble = () => {
      fireEvent.pointerDown(svg, { clientX: 100, clientY: 100, pointerId: 1 })
      for (const x of [95, 90, 85, 80]) fireEvent.pointerMove(svg, { clientX: x, clientY: 100, pointerId: 1 })
      fireEvent.pointerUp(svg, { pointerId: 1 })
    }
    scribble()
    expect(screen.getByText('0 / 3 かく')).toBeInTheDocument()
    expect(container.querySelector('.kaku__hint')).not.toBeInTheDocument()
    scribble()
    expect(container.querySelector('.kaku__hint')).toBeInTheDocument()
  })
})

describe('まなぶ: くみあわせ', () => {
  it('休: ものがたり → 亻+木 → 「あとで」で結果へ。なかまが出て、あとから書ける', async () => {
    alreadyCheckedIn()
    const user = userEvent.setup()
    const { container } = render(<App />)
    await openFromZukan(user, '休')

    expect(screen.getByText('ひとが きに もたれて ひとやすみ。')).toBeInTheDocument()
    expect(container.querySelector('.story__actor[data-motion="lean-right"]')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'つぎへ' }))

    expect(container.querySelector('.kumi__fixed [data-part="亻"]')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'やすむ を つくろう' })).toBeInTheDocument()
    const wrong = container.querySelector<HTMLButtonElement>('.kumi__choices button:not([data-part="木"])')
    if (!wrong) throw new Error('はずれのカードがありません')
    await user.click(wrong)
    expect(wrong).toBeDisabled()
    expect(screen.getByText('もういちど')).toBeInTheDocument()
    await user.click(container.querySelector('.kumi__choices button[data-part="木"]') as HTMLButtonElement)
    expect(screen.getByTestId('merged')).toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: 'あとで' }, WAIT))
    const nakama = screen.getByRole('region', { name: 'なかま' })
    expect(within(nakama).getByRole('button', { name: /^体/ })).toBeInTheDocument()
    expect(state().learned).toEqual(['休'])
    expect(hasStamp(state().stamps['休'], 'write')).toBe(false)

    await user.click(screen.getByRole('button', { name: /かいてみる/ }))
    writeAllStrokes(container, '休')
    await screen.findByRole('region', { name: 'なかま' }, WAIT)
    expect(hasStamp(state().stamps['休'], 'write')).toBe(true)
    expect(screen.queryByRole('button', { name: /かいてみる/ })).not.toBeInTheDocument()
  }, 20_000)

  it('線: 2段階(白+水 → 泉、糸+泉 → 線)で合体する', async () => {
    alreadyCheckedIn()
    const user = userEvent.setup()
    const { container } = render(<App />)
    await openFromZukan(user, '線')
    await user.click(screen.getByRole('button', { name: 'つぎへ' }))
    expect(screen.getByRole('button', { name: 'いずみ を つくろう' })).toBeInTheDocument()
    await user.click(container.querySelector('button[data-part="水"]') as HTMLButtonElement)
    expect(await screen.findByRole('button', { name: 'せん を つくろう' }, WAIT)).toBeInTheDocument()
    await user.click(container.querySelector('button[data-part="泉"]') as HTMLButtonElement)
    expect(await screen.findByRole('button', { name: 'あとで' }, WAIT)).toBeInTheDocument()
  }, 20_000)

  it('覚えた漢字は、文の中で漢字で表示されるようになる', async () => {
    alreadyCheckedIn()
    useProgress.setState({ learned: ['人', '木'] })
    const user = userEvent.setup()
    render(<App />)
    await openFromZukan(user, '休')
    expect(screen.getByText('もたれて ひと', { exact: false })).toHaveTextContent('人が 木に もたれて ひとやすみ。')
    await user.click(screen.getByRole('button', { name: 'つぎへ' }))
    // 部位カードの名前も、覚えた漢字なら漢字になる
    expect(document.querySelector('.kumi__choices button[data-part="木"] .part-card__label')).toHaveTextContent('木')
  })
})

describe('ぼうけん: ボス', () => {
  const [s1, s2] = ALL_STAGES
  const BOSS_QUESTIONS = 15

  /** ステージ1の5字を学んだ状態で、ボスの「はじまり」の画面まで行く。 */
  async function openBoss(user: User) {
    await user.click(screen.getByRole('button', { name: /^ぼうけん/ }))
    await user.click(screen.getByRole('button', { name: `ステージ ${s1.number}` }))
    await user.click(screen.getByRole('button', { name: 'ボスに ちょうせん' }))
  }

  it('5字学ぶまでは たたかえない。学ぶと ボスの はじまりの画面に行ける', async () => {
    alreadyCheckedIn()
    useProgress.setState({ learned: s1.kanji.slice(0, 4) })
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /^ぼうけん/ }))
    expect(screen.getByRole('button', { name: `ステージ ${s2.number} まだ あかない` })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: `ステージ ${s1.number}` }))
    expect(screen.getByText('まなぶと、たたかえるよ', { exact: false })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ボスに ちょうせん' })).toBeDisabled()

    useProgress.setState({ learned: [...s1.kanji] })
    await user.click(await screen.findByRole('button', { name: 'ボスに ちょうせん' }))
    expect(screen.getByRole('heading', { name: `ステージ ${s1.number} の ボス` })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'きょうは あと 3かい' })).toBeInTheDocument()
    expect(screen.getByText('100てん', { exact: false })).toBeInTheDocument()
  })

  it('15問を全部まちがえずに とくと 100点で たおせて、次のステージが開く', async () => {
    alreadyCheckedIn()
    useProgress.setState({ learned: [...s1.kanji] })
    const user = userEvent.setup()
    const { container } = render(<App />)
    await openBoss(user)
    await user.click(screen.getByRole('button', { name: 'たたかう！' }))
    expect(state().tries.used[s1.id]).toBe(1)
    expect(screen.getByRole('progressbar', { name: 'ボスの HP' })).toHaveAttribute('aria-valuenow', String(BOSS_QUESTIONS))

    for (let i = 0; i < BOSS_QUESTIONS; i += 1) {
      await screen.findByText(`${i + 1} / ${BOSS_QUESTIONS}`, undefined, WAIT)
      await solveBossQuestion(user, container)
    }

    expect(await screen.findByRole('heading', { name: 'とめきちを たおした！' }, WAIT)).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('けいけんち ＋100')).toBeInTheDocument()
    expect(state().clears[s1.id]).toBe(dayKey())

    await user.click(screen.getByRole('button', { name: 'つぎの ステージへ' }))
    expect(screen.getByRole('heading', { name: `ステージ ${s2.number}` })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '← ぼうけん' }))
    expect(screen.getByRole('button', { name: `ステージ ${s2.number}` })).toBeEnabled()
    expect(screen.getByRole('button', { name: `ステージ ${s1.number} クリア` })).toBeEnabled()
  }, 90_000)

  it('1問でも まちがえると たおせない。ふくしゅう する字が出て、のこりの回数で もういちど たたかえる', async () => {
    alreadyCheckedIn()
    useProgress.setState({ learned: [...s1.kanji] })
    const user = userEvent.setup()
    const { container } = render(<App />)
    await openBoss(user)
    await user.click(screen.getByRole('button', { name: 'たたかう！' }))

    const missed: string[] = []
    for (let i = 0; i < BOSS_QUESTIONS; i += 1) {
      await screen.findByText(`${i + 1} / ${BOSS_QUESTIONS}`, undefined, WAIT)
      // えらぶ問題の1問目と、見本なしで書く問題の1問目を、わざと まちがえる
      const wrong = i === 0 || i === 10
      if (wrong) missed.push(container.querySelector<HTMLElement>('.boss-run')?.dataset.kanji ?? '')
      await solveBossQuestion(user, container, wrong)
      if (i === 10) expect(container.querySelector('.kaku__hint, .kaku__stroke')).toBeInTheDocument()
    }

    expect(await screen.findByRole('heading', { name: 'とめきちに にげられた…' }, WAIT)).toBeInTheDocument()
    expect(screen.getByText('87')).toBeInTheDocument()
    expect(state().clears).toEqual({})
    const review = screen.getByRole('region', { name: 'ふくしゅう' })
    expect(within(review).getAllByRole('button')).toHaveLength(new Set(missed).size)
    expect(screen.getByRole('button', { name: /もういちど たたかう/ })).toBeEnabled()
    expect(within(screen.getByRole('button', { name: /もういちど たたかう/ })).getByRole('img', { name: 'きょうは あと 2かい' })).toBeInTheDocument()

    await user.click(within(review).getAllByRole('button')[0])
    expect(screen.getByRole('img', { name: /の ものがたり$/ })).toBeInTheDocument()
  }, 90_000)

  it('その日の3回を使いきると、あしたまで たたかえない(れんしゅうは できる)', async () => {
    alreadyCheckedIn()
    useProgress.setState({ learned: [...s1.kanji], tries: { day: dayKey(), used: { [s1.id]: 3 } } })
    const user = userEvent.setup()
    render(<App />)
    await openBoss(user)
    expect(screen.getByRole('button', { name: 'あした また ちょうせん' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'れんしゅう する' }))
    expect(screen.getByText(`1 / ${BOSS_QUESTIONS}`)).toBeInTheDocument()
    expect(state().tries.used[s1.id]).toBe(3)
    await user.click(screen.getByRole('button', { name: '← やめる' }))
    expect(screen.getByRole('button', { name: 'れんしゅう する' })).toBeInTheDocument()
  })

  it('そつぎょうしけん は、学年の字を全部学び ボスを全部たおすと開く。チャンスは1日2回', async () => {
    alreadyCheckedIn()
    const stages = stagesOfGrade(AREAS, 1)
    useProgress.setState({ learned: stages.flatMap((s) => s.kanji), clears: Object.fromEntries(stages.slice(0, -1).map((s) => [s.id, 'd'])) })
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /^ぼうけん/ }))
    expect(screen.getByRole('heading', { name: /1ねんせい/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1ねんせいの そつぎょうしけん まだ あかない' })).toBeDisabled()

    useProgress.setState({ clears: Object.fromEntries(stages.map((s) => [s.id, 'd'])) })
    await user.click(await screen.findByRole('button', { name: '1ねんせいの そつぎょうしけん' }))
    expect(screen.getByRole('heading', { name: '1ねんせいの そつぎょうしけん' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'きょうは あと 2かい' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'たたかう！' }))
    expect(screen.getByText('1 / 20')).toBeInTheDocument()
    expect(state().tries.used[examId(1)]).toBe(1)
  })

  it('ホームの「つづきから」は、ボス → そつぎょうしけん と案内する', () => {
    alreadyCheckedIn()
    useProgress.setState({ learned: [...s1.kanji] })
    const { unmount } = render(<App />)
    expect(screen.getByRole('button', { name: /ボスに ちょうせん/ })).toBeInTheDocument()
    unmount()
    const stages = stagesOfGrade(AREAS, 1)
    useProgress.setState({ learned: stages.flatMap((s) => s.kanji), clears: Object.fromEntries(stages.map((s) => [s.id, 'd'])), seenLevel: 99 })
    render(<App />)
    expect(screen.getByRole('button', { name: /そつぎょうしけんへ/ })).toBeInTheDocument()
  })
})

describe('チャレンジ', () => {
  it('数と範囲をえらべて、全問1回で正解すると かんぺき と自己ベストになる', async () => {
    alreadyCheckedIn()
    useProgress.getState().updateSettings({ timer: true })
    const user = userEvent.setup()
    const { container } = render(<App />)
    await user.click(screen.getByRole('button', { name: 'チャレンジ' }))
    expect(screen.getByRole('button', { name: 'おぼえた' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: '10もん' }))
    expect(state().challenge.count).toBe(10)
    await user.click(screen.getByRole('button', { name: '5もん' }))
    await user.click(screen.getByRole('button', { name: /え なし/ }))
    expect(screen.getByText(/⏱/)).toBeInTheDocument()

    await clearQuiz(user, container, QUESTION_COUNT)

    expect(await screen.findByRole('img', { name: 'かんぺき' }, WAIT)).toBeInTheDocument()
    expect(screen.getByText('じこベスト！')).toBeInTheDocument()
    expect(screen.getByText(`さいこう ${QUESTION_COUNT} れんぞく`)).toBeInTheDocument()
    expect(state().bests[bestKey(2, QUESTION_COUNT)]?.score).toBeGreaterThanOrEqual(QUESTION_COUNT * 10)

    await user.click(screen.getByRole('button', { name: 'もういっかい' }))
    expect(screen.getByText(`1 / ${QUESTION_COUNT}`)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '← やめる' }))
    expect(screen.getByRole('heading', { name: 'チャレンジ' })).toBeInTheDocument()
  }, 30_000)
})

describe('ずかん', () => {
  it('学年の漢字が全部ならび(ページ送りはない)、開いて もどると 見ていた所にもどる', async () => {
    alreadyCheckedIn()
    const user = userEvent.setup()
    const { container } = render(<App />)
    await user.click(screen.getByRole('button', { name: /^ずかん/ }))
    expect(container.querySelectorAll('.zukan-card')).toHaveLength(kanjiOfGrade(1).length)
    expect(screen.queryByRole('button', { name: 'つぎの ページ' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: '2ねんせい' }))
    expect(container.querySelectorAll('.zukan-card')).toHaveLength(kanjiOfGrade(2).length)

    const grid = container.querySelector('.zukan__grid') as HTMLElement
    grid.scrollTop = 420
    await user.click(screen.getByRole('button', { name: /^曜/ }))
    await user.click(screen.getByRole('button', { name: '← もどる' }))
    expect((container.querySelector('.zukan__grid') as HTMLElement).scrollTop).toBe(420)
    expect(screen.getByRole('tab', { name: '2ねんせい' })).toHaveAttribute('aria-selected', 'true')
  })
})

describe('パーツずかん・きせかえ・せってい', () => {
  it('漢字を学ぶとパーツが見つかり、えらぶと なかまの漢字がならぶ', async () => {
    alreadyCheckedIn()
    useProgress.setState({ learned: ['休'] })
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /^パーツ/ }))
    expect(screen.getByText('パーツを えらぶと、なかまの かんじが みられるよ')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'まだ みつけていない パーツ' }).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: 'ひと の パーツ' }))
    const detail = screen.getByRole('complementary', { name: 'パーツの なかま' })
    for (const char of ['休', '何', '作', '体']) expect(within(detail).getByRole('button', { name: new RegExp(`^${char}`) })).toBeInTheDocument()
    await user.click(within(detail).getByRole('button', { name: /^体/ }))
    expect(screen.getByRole('img', { name: '体 の ものがたり' })).toBeInTheDocument()
  })

  it('コインで ぼうし を買うと、すぐ かぶる。コインやレベルが足りない品は買えない', async () => {
    alreadyCheckedIn()
    useProgress.setState({ coins: 200 })
    const user = userEvent.setup()
    const { container } = render(<App />)
    await user.click(screen.getByRole('button', { name: /^きせかえ/ }))
    const hachimaki = container.querySelector('button[data-item="hat:hachimaki"]') as HTMLButtonElement
    // むぎわら はコインは足りるが、レベル 3 から
    expect(container.querySelector('button[data-item="hat:mugiwara"]')).toBeDisabled()
    expect(container.querySelector('button[data-item="hat:mugiwara"]')).toHaveTextContent('レベル 3')
    expect(container.querySelector('button[data-item="hat:kanmuri"]')).toBeDisabled()
    await user.click(hachimaki)
    expect(hachimaki).toHaveAttribute('aria-pressed', 'true')
    expect(hachimaki).toHaveTextContent('つかってる')
    expect(screen.getByLabelText('コイン 120まい')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').filter((li) => li.getAttribute('aria-current') === 'step')).toHaveLength(1)

    // かざり は、買うと しまに おかれる
    await user.click(screen.getByRole('tab', { name: 'かざり' }))
    const hana = container.querySelector('button[data-item="deco:hana"]') as HTMLButtonElement
    await user.click(hana)
    expect(hana).toHaveTextContent('おいてある')
    expect(state().owned).toContain('deco:hana')
    expect(screen.getByLabelText('コイン 20まい')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'カード' }))
    expect(container.querySelector('button[data-item="skin:kami"]')).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('tab', { name: 'そら' }))
    expect(container.querySelector('button[data-item="bg:yuu"]')).toBeDisabled()
  })

  it('設定を切り替えられ、確認してからリセットできる', async () => {
    alreadyCheckedIn()
    state().completeKanji('木')
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'せってい' }))
    await user.click(screen.getByRole('checkbox', { name: 'おと' }))
    expect(state().settings.sound).toBe(false)

    await user.click(screen.getByRole('button', { name: 'データを リセット' }))
    await user.click(screen.getByRole('button', { name: 'やめる' }))
    expect(state().learned).toEqual(['木'])
    await user.click(screen.getByRole('button', { name: 'データを リセット' }))
    await user.click(screen.getByRole('button', { name: 'けす' }))
    expect(state().learned).toEqual([])
  })
})
