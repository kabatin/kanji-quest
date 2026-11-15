import { homeworkAllDone, homeworkDoneCount, HOMEWORK_MAX, type HomeworkRow } from '../../lib/homework'
import { MASTERY_LABEL } from '../../lib/mastery'

type Props = {
  readonly rows: readonly HomeworkRow[]
  readonly name: string
  readonly canPractice: boolean
  readonly onPractice: (char: string) => void
  readonly onRemove: (char: string) => void
  readonly onClear: () => void
}

function answeredText(row: HomeworkRow): string {
  if (row.right + row.wrong === 0) return '選んでから、まだ答えていません'
  return `選んでから 正解${row.right}回・まちがい${row.wrong}回`
}

type RowProps = { readonly row: HomeworkRow } & Pick<Props, 'canPractice' | 'onPractice' | 'onRemove'>

function Row({ row, canPractice, onPractice, onRemove }: RowProps) {
  return (
    <li className="hw-row" data-state={row.state} data-kanji={row.char}>
      <span className="hw-row__char" lang="ja" aria-hidden="true">
        {row.char}
      </span>
      <div className="hw-row__body">
        <p className="hw-row__state">
          <span className="mmap__swatch" data-state={row.state} aria-hidden="true" />
          <strong>{MASTERY_LABEL[row.state]}</strong>
          {!row.notLearned && <span className="hw-row__count">{answeredText(row)}</span>}
        </p>
        {row.notLearned && (
          <p className="hw-row__note">
            まだ覚えていません。「この字を練習する」から学べます。
            {!canPractice && <span>(あそぶ人を切りかえてから開いてください)</span>}
          </p>
        )}
        {row.notLearned && canPractice && (
          <button type="button" className="parent__ghost hw-row__practice" onClick={() => onPractice(row.char)}>
            この字を練習する
          </button>
        )}
      </div>
      <button type="button" className="parent__ghost hw-row__remove" onClick={() => onRemove(row.char)} aria-label={`${row.char}を はずす`}>
        はずす
      </button>
    </li>
  )
}

/** 宿題に えらんだ字の一覧: いまの状態、えらんでからの正誤。ぜんぶ見ないで書けたら 分かる表示。 */
export function HomeworkList({ rows, name, canPractice, onPractice, onRemove, onClear }: Props) {
  const done = homeworkAllDone(rows)
  return (
    <section className="parent-card hw-list" aria-labelledby="hw-list-title">
      <header className="parent-card__head parent-card__head--row">
        <h2 id="hw-list-title">今週の練習</h2>
        <p className="parent-card__sub" aria-live="polite">
          {rows.length} / {HOMEWORK_MAX}字を選んでいます
        </p>
        <button type="button" className="parent__ghost hw-list__clear" disabled={rows.length === 0} onClick={onClear}>
          ぜんぶ はずす
        </button>
      </header>
      {done && (
        <p className="hw-list__done" role="status">
          選んだ{rows.length}字が、すべて「見ないで書ける」になりました。
        </p>
      )}
      {rows.length === 0 ? (
        <div className="parent-card__empty">
          <p>左の表で字を押すと、ここに追加されます。学校の漢字テストの範囲などに合わせて、{HOMEWORK_MAX}字まで選べます。</p>
          <p>{name}さんの画面には「宿題」とは出ません。選んだ字が、復習やチャレンジの中に自然に混ざります。</p>
        </div>
      ) : (
        <>
          {!done && (
            <p className="parent-card__note">
              {homeworkDoneCount(rows)}字が「見ないで書ける」になっています。覚えた字は、復習の日が来ていなくても、その日の復習の先頭に出ます。
            </p>
          )}
          <ul className="hw-list__rows">
            {rows.map((row) => (
              <Row key={row.char} row={row} canPractice={canPractice} onPractice={onPractice} onRemove={onRemove} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
