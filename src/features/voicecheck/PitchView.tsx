import { parseKana, pitchPattern } from '../../lib/voiceCheck'

/** 音の高さを、音ごとの 高い・ひくい で 見せる。下がるところには ↓。 */
export function PitchView({ kana }: { readonly kana: string }) {
  const phrases = parseKana(kana)
  return (
    <div className="pitch" aria-label={kana}>
      {phrases.map((phrase, p) => {
        const high = pitchPattern(phrase.moras.length, phrase.accent)
        const flat = phrase.accent === 0 || phrase.accent >= phrase.moras.length
        return (
          <span key={p} className="pitch__phrase" data-flat={flat}>
            {phrase.moras.map((mora, i) => (
              <span key={i} className="pitch__mora" data-high={high[i]}>
                {mora}
                {i + 1 === phrase.accent && !flat && <b className="pitch__drop">↓</b>}
              </span>
            ))}
          </span>
        )
      })}
    </div>
  )
}
