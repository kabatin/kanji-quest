import { useState } from 'react'
import { Burst } from '../../components/Burst'
import { TopBar } from '../../components/Hud'
import { KText } from '../../components/KText'
import { MascotSays } from '../../components/MascotSays'
import { getKanji, KANJI } from '../../data/kanji'
import { buildBoss, cheerLine, type BossDef, type BossQuestion } from '../../lib/boss'
import { dayKey } from '../../lib/date'
import { BOSS_CLEAR_SCORE, BOSS_REWARD } from '../../lib/rewards'
import { isCleared, triesLeft } from '../../lib/stages'
import { useFeedback } from '../../lib/useFeedback'
import { useProgress, type BossGain } from '../../store/progress'
import { BossMonster } from './BossMonster'
import { BossRun, type BossOutcome } from './BossRun'

export type BossNext = { readonly label: string; readonly onNext: () => void }

type Phase =
  | { readonly name: 'intro' }
  | { readonly name: 'play'; readonly practice: boolean; readonly questions: readonly BossQuestion[]; readonly run: number }
  | { readonly name: 'result'; readonly practice: boolean; readonly outcome: BossOutcome; readonly gain: BossGain }

type Props = {
  readonly boss: BossDef
  readonly onBack: () => void
  /** たおしたあとの行き先(つぎの ステージ など)。なければ出さない。 */
  readonly next?: BossNext
  /** まちがえた漢字を もういちど学ぶ */
  readonly onReview: (char: string) => void
  /** にがて れんしゅう へ行く */
  readonly onWeak?: () => void
}

/** のこりの回数を 丸で見せる。 */
function TryPips({ left, limit }: { readonly left: number; readonly limit: number }) {
  return (
    <span className="try-pips" role="img" aria-label={`きょうは あと ${left}かい`}>
      {Array.from({ length: limit }, (_, i) => (
        <span key={i} className={i < left ? 'is-on' : ''} />
      ))}
    </span>
  )
}

/** ボス(ステージの ボス・そつぎょうしけん)の、はじまり・たたかい・けっか。 */
export function BossScreen({ boss, onBack, next, onReview, onWeak }: Props) {
  const [phase, setPhase] = useState<Phase>({ name: 'intro' })
  const tries = useProgress((s) => s.tries)
  const cleared = useProgress((s) => isCleared(s.clears, boss.id))
  const startBoss = useProgress((s) => s.startBoss)
  const finishBoss = useProgress((s) => s.finishBoss)
  const { play } = useFeedback()
  const limit = boss.triesPerDay
  const left = triesLeft(tries, boss.id, limit, dayKey())
  const king = boss.kind === 'exam'
  const total = boss.plan.select + boss.plan.model + boss.plan.blind

  const start = (practice: boolean) => {
    // ほんばんは、その日の回数を1つ使う。たおしたあとは、何回でも れんしゅう できる
    if (!practice && !startBoss(boss.id, boss.kind, dayKey(), limit)) return
    play(practice ? 'tap' : 'bossAppear')
    // 苦手な字(まちがえた回数が のこっている字)を 優先して出す
    const questions = buildBoss(boss.kanji.map(getKanji), KANJI, boss.plan, Math.random, useProgress.getState().misses)
    setPhase({ name: 'play', practice, questions, run: phase.name === 'play' ? phase.run + 1 : Date.now() })
  }

  if (phase.name === 'play') {
    const { practice } = phase
    return (
      <BossRun
        key={phase.run}
        boss={boss}
        questions={phase.questions}
        onQuit={() => setPhase({ name: 'intro' })}
        onFinish={(outcome) => {
          const gain = finishBoss({ id: boss.id, kind: boss.kind, perfect: outcome.perfect, total: outcome.total, practice, missed: outcome.missed, solved: outcome.solved })
          play(gain.cleared ? 'bossDown' : gain.score === BOSS_CLEAR_SCORE ? 'fanfare' : 'retry')
          setPhase({ name: 'result', practice, outcome, gain })
        }}
      />
    )
  }

  if (phase.name === 'result') {
    const { gain, outcome, practice } = phase
    const won = gain.score === BOSS_CLEAR_SCORE
    return (
      <div className="screen boss-result" data-won={won}>
        {gain.cleared && <Burst />}
        <div className="boss-result__main">
          <BossMonster seed={boss.seed} king={king} mood={won ? 'down' : 'phew'} className="boss-result__monster" label={boss.name} />
          <p className="boss-result__score">
            <strong>{gain.score}</strong> てん
          </p>
          <h1 className="boss-result__title">
            {gain.cleared ? `${boss.name}を たおした！` : won ? 'れんしゅう ばっちり！' : practice ? 'れんしゅう おつかれさま' : `${boss.name}に にげられた…`}
          </h1>
          <MascotSays text={cheerLine({ cleared: gain.cleared, won, practice, missed: outcome.missed.length })} happy={won} className="boss-result__cheer" />
        </div>
        <div className="boss-result__side">
          <ul className="gains">
            <li className="gains__xp">けいけんち ＋{gain.xp}</li>
            {gain.coins > 0 && (
              <li className="gains__coin">
                <span className="coin" aria-hidden="true" /> ＋{gain.coins}
              </li>
            )}
            {gain.levelAfter > gain.levelBefore && <li className="gains__level">レベル {gain.levelAfter} に アップ！</li>}
          </ul>
          {outcome.missed.length > 0 && (
            <section className="boss-result__missed" aria-label="ふくしゅう">
              <h2>ふくしゅう</h2>
              <div>
                {outcome.missed.map((char) => (
                  <button key={char} type="button" className="btn boss-result__char" onClick={() => onReview(char)} aria-label={`${getKanji(char).yomi} を ふくしゅう`}>
                    {char}
                  </button>
                ))}
              </div>
            </section>
          )}
          <div className="boss-result__actions">
            {gain.cleared && next && (
              <button type="button" className="btn btn--primary btn--big" onClick={next.onNext}>
                {next.label}
              </button>
            )}
            {!gain.cleared && !practice && left > 0 && (
              <button type="button" className="btn btn--primary btn--big" onClick={() => start(false)}>
                もういちど たたかう
                <TryPips left={left} limit={limit} />
              </button>
            )}
            {!gain.cleared && !practice && left === 0 && <p className="boss-result__tomorrow">きょうは ここまで。あした また ちょうせん しよう！</p>}
            {outcome.missed.length > 0 && onWeak && (
              <button type="button" className="btn" onClick={onWeak}>
                にがてな かんじを れんしゅう
              </button>
            )}
            <button type="button" className="btn" onClick={() => start(true)}>
              れんしゅう する
            </button>
            <button type="button" className="btn" onClick={onBack}>
              もどる
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen boss-intro" data-king={king}>
      <TopBar onBack={onBack} title={boss.title} />
      <div className="boss-intro__body">
        <div className="boss-intro__stage">
          <BossMonster seed={boss.seed} king={king} mood={cleared ? 'down' : 'idle'} className="boss-intro__monster" label={boss.name} />
          <p className="boss-intro__name">{boss.name}</p>
          {cleared && <p className="boss-intro__cleared">たおした！</p>}
        </div>
        <div className="boss-intro__side">
          <ul className="boss-rules">
            <li>
              <span aria-hidden="true">⚔️</span>
              <span>
                もんだいは <strong>{total}</strong> もん。まちがえずに とくと、ボスの HPが へるよ
              </span>
            </li>
            <li>
              <span aria-hidden="true">💯</span>
              <span>
                ぜんぶ できて <strong>100てん</strong>に なると、たおせる！
              </span>
            </li>
            <li>
              <span aria-hidden="true">✍️</span>
              <span>
                <KText text="{書|か}く もんだいは、{書|か}きじゅんも だいじ" />
              </span>
            </li>
          </ul>
          {!cleared && (
            <p className="boss-intro__tries">
              きょうは あと <strong>{left}</strong> かい
              <TryPips left={left} limit={limit} />
            </p>
          )}
          <p className="boss-intro__reward">
            たおすと　けいけんち ＋{BOSS_REWARD[boss.kind].xp}　<span className="coin" aria-hidden="true" /> ＋{BOSS_REWARD[boss.kind].coins}
          </p>
          <div className="boss-intro__actions">
            {!cleared && (
              <button type="button" className="btn btn--primary btn--big" disabled={left === 0} onClick={() => start(false)}>
                {left === 0 ? 'あした また ちょうせん' : 'たたかう！'}
              </button>
            )}
            <button type="button" className={cleared ? 'btn btn--primary btn--big' : 'btn'} onClick={() => start(true)}>
              れんしゅう する
            </button>
          </div>
          {!cleared && <p className="boss-intro__note">「たたかう」は、とちゅうで やめても 1かい つかうよ</p>}
        </div>
      </div>
    </div>
  )
}
