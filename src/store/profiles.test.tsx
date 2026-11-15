import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { DEFAULT_PROFILES, loadProfiles, MAX_PROFILES, nextProfileId, PROFILES_KEY, PROGRESS_KEY, readSummary, storageKeyFor } from '../lib/profiles'
import { useProfiles } from './profiles'
import { useProgress } from './progress'

const profiles = () => useProfiles.getState()
const progress = () => useProgress.getState()

/** ログインボーナスの窓が出ない状態にする。 */
function alreadyCheckedIn() {
  progress().checkIn()
  progress().claimLoginBonus()
}

beforeEach(() => {
  localStorage.clear()
  profiles().reload()
  progress().reset()
})

describe('あそぶ人の保存', () => {
  it('はじめは1人だけ。こわれた保存データは、ないものとして あつかう', () => {
    expect(loadProfiles()).toEqual(DEFAULT_PROFILES)
    localStorage.setItem(PROFILES_KEY, '{こわれている')
    expect(loadProfiles()).toEqual(DEFAULT_PROFILES)
    localStorage.setItem(PROFILES_KEY, JSON.stringify({ profiles: [{ id: 'p1', name: 'あ' }], activeId: 'p9' }))
    expect(loadProfiles()).toEqual(DEFAULT_PROFILES)
    localStorage.setItem(PROFILES_KEY, JSON.stringify({ profiles: [{ id: 'p2', name: ' はな ' }], activeId: 'p2' }))
    expect(loadProfiles()).toEqual({ profiles: [{ id: 'p2', name: 'はな' }], activeId: 'p2' })
  })

  it('1人目は前からの保存先を使い、2人目からは べつの保存先になる', () => {
    expect(storageKeyFor('p1')).toBe(PROGRESS_KEY)
    expect(storageKeyFor('p2')).toBe(`${PROGRESS_KEY}:p2`)
    expect(
      nextProfileId([
        { id: 'p1', name: 'a' },
        { id: 'p3', name: 'b' },
      ]),
    ).toBe('p2')
  })

  it('名前は 1〜8文字。人数は 6人まで', () => {
    expect(profiles().add('')).toBeNull()
    expect(profiles().add('   ')).toBeNull()
    expect(profiles().add('123456789')).toBeNull()
    for (let i = 2; i <= MAX_PROFILES; i += 1) expect(profiles().add(`ひと${i}`)).toBe(`p${i}`)
    expect(profiles().add('もうひとり')).toBeNull()
    expect(profiles().rename('p2', 'はなこ')).toBe(true)
    expect(profiles().rename('p2', '')).toBe(false)
    expect(profiles().rename('nai', 'だれ')).toBe(false)
    expect(loadProfiles().profiles[1]).toEqual({ id: 'p2', name: 'はなこ' })
  })

  it('切りかえると、進みぐあいが その人のものに入れかわり、もどすと もとのまま', () => {
    progress().completeKanji('木')
    const second = profiles().add('はな')
    if (!second) throw new Error('作れませんでした')
    expect(profiles().select(second)).toBe(true)
    expect(profiles().activeId).toBe(second)
    expect(progress().learned).toEqual([])
    expect(progress().xp).toBe(0)

    progress().completeKanji('海')
    progress().completeKanji('山')
    expect(readSummary(second)).toMatchObject({ learned: 2, level: 1 })
    expect(readSummary('p1')).toMatchObject({ learned: 1 })

    profiles().select('p1')
    expect(progress().learned).toEqual(['木'])
    profiles().select(second)
    expect(progress().learned).toEqual(['海', '山'])
    expect(profiles().select('nai')).toBe(false)
    expect(loadProfiles().activeId).toBe(second)
  })

  it('消すと その人の進みぐあいも消える。あそんでいる人を消すと べつの人に切りかわる。さいごの1人は消せない', () => {
    progress().completeKanji('木')
    const second = profiles().add('はな')
    if (!second) throw new Error('作れませんでした')
    profiles().select(second)
    progress().completeKanji('海')
    expect(localStorage.getItem(storageKeyFor(second))).not.toBeNull()

    expect(profiles().remove(second)).toBe(true)
    expect(localStorage.getItem(storageKeyFor(second))).toBeNull()
    expect(profiles().activeId).toBe('p1')
    expect(progress().learned).toEqual(['木'])
    expect(profiles().remove('p1')).toBe(false)
    expect(profiles().remove('nai')).toBe(false)
  })

  it('保存データがない人は、レベル1・0字として出る', () => {
    expect(readSummary('p5')).toEqual({ level: 1, learned: 0, hat: 'hat:none' })
  })
})

describe('「だれが あそぶ？」の画面', () => {
  it('ホームの名前から開いて、あたらしい人を作ると その人で始まる', async () => {
    alreadyCheckedIn()
    progress().completeKanji('木')
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'あそぶ ひと: プレイヤー1。きりかえる' }))
    expect(screen.getByRole('heading', { name: 'だれが あそぶ？' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'プレイヤー1 で あそぶ' })).toHaveTextContent('かんじ 1')

    await user.click(screen.getByRole('button', { name: 'あたらしく つくる' }))
    await user.click(screen.getByRole('button', { name: 'つくる' }))
    expect(screen.getByRole('status')).toHaveTextContent('なまえを 1〜8もじで いれてね')
    await user.type(screen.getByRole('textbox', { name: 'なまえ' }), 'はな')
    await user.click(screen.getByRole('button', { name: 'つくる' }))

    // 新しい人は、まっさらな状態で はじめての あんない から始まる。とばすと ホーム(その日のログインボーナスも出る)
    await user.click(await screen.findByRole('button', { name: 'あんないを とばす' }))
    await user.click(await screen.findByRole('button', { name: /^コインを/ }))
    expect(screen.getByRole('button', { name: 'あそぶ ひと: はな。きりかえる' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^ずかん/ })).toHaveTextContent('0 / 240')
    expect(profiles().profiles).toHaveLength(2)
  })

  it('2人以上いるときは、ひらいたときに まず だれが あそぶかを聞く', async () => {
    alreadyCheckedIn()
    progress().completeKanji('木')
    profiles().add('はな')
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('heading', { name: 'だれが あそぶ？' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '← ホーム' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'プレイヤー1 で あそぶ' }))
    expect(screen.getByRole('button', { name: /^ずかん/ })).toHaveTextContent('1 / 240')
  })

  it('「なおす」で、名前を変えたり 消したり できる(消す前に たしかめる)', async () => {
    alreadyCheckedIn()
    profiles().add('はな')
    const user = userEvent.setup()
    render(<App />)
    expect(screen.queryByRole('button', { name: 'はな を けす' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'なおす' }))

    await user.click(screen.getByRole('button', { name: 'はな の なまえを かえる' }))
    const input = screen.getByRole('textbox', { name: 'あたらしい なまえ' })
    await user.clear(input)
    await user.type(input, 'さくら')
    await user.click(screen.getByRole('button', { name: 'きめる' }))
    expect(screen.getByRole('button', { name: 'さくら で あそぶ' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'さくら を けす' }))
    const dialog = screen.getByRole('dialog', { name: 'けす かくにん' })
    await user.click(within(dialog).getByRole('button', { name: 'やめる' }))
    expect(profiles().profiles).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'さくら を けす' }))
    await user.click(within(screen.getByRole('dialog', { name: 'けす かくにん' })).getByRole('button', { name: 'けす' }))
    expect(profiles().profiles).toEqual([{ id: 'p1', name: 'プレイヤー1' }])
    // さいごの1人は消せない
    expect(screen.getByRole('button', { name: 'プレイヤー1 を けす' })).toBeDisabled()
  })
})
