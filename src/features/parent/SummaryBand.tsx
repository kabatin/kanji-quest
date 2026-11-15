type Props = {
  readonly name: string
  /** weekSentences の 1〜3文 */
  readonly sentences: readonly string[]
  readonly learned: number
  readonly freeWritten: number
  readonly total: number
}

/** いちばん上: この1週間を 文で。右に、これまでの 2つの数。 */
export function SummaryBand({ name, sentences, learned, freeWritten, total }: Props) {
  const [lead, ...rest] = sentences
  return (
    <section className="parent-card psum" aria-label={`${name}さんの まとめ`}>
      <div className="psum__text">
        <h2 className="psum__title">{name}さんの この1週間</h2>
        <p className="psum__lead">{lead}</p>
        {rest.map((sentence) => (
          <p key={sentence} className="psum__line">
            {sentence}
          </p>
        ))}
      </div>
      <dl className="psum__figures">
        <div>
          <dt>覚えた字</dt>
          <dd>
            {learned}
            <small> / {total}字</small>
          </dd>
        </div>
        <div>
          <dt>自力で書けた字</dt>
          <dd>
            {freeWritten}
            <small>字</small>
          </dd>
        </div>
      </dl>
    </section>
  )
}
