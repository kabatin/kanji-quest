import { buildKana, parseKana } from '../../lib/voiceCheck'
import { PitchView } from './PitchView'

type Props = { readonly kana: string; readonly disabled: boolean; readonly onPick: (kana: string) => void }

/** 区切りごとに「どこで 声が 下がるか」を えらぶ。えらぶと 新しい記法の文字列を 返す。 */
export function AccentPicker({ kana, disabled, onPick }: Props) {
  const phrases = parseKana(kana)
  const choose = (phraseIndex: number, accent: number) =>
    onPick(buildKana(phrases.map((phrase, i) => (i === phraseIndex ? { ...phrase, accent } : phrase))))
  return (
    <div className="picker">
      {phrases.map((phrase, p) => {
        const count = phrase.moras.length
        const current = phrase.accent === 0 ? count : phrase.accent
        return (
          <div key={p} className="picker__phrase">
            <PitchView kana={buildKana([{ ...phrase, pause: false }])} />
            <div className="picker__buttons" role="group" aria-label={`${p + 1}つめの区切り: どこで 声が 下がるか`}>
              {phrase.moras.map((mora, i) => {
                const last = i + 1 === count
                return (
                  <button key={i} type="button" disabled={disabled} aria-pressed={current === i + 1} data-accent={i + 1} onClick={() => choose(p, i + 1)}>
                    {last ? `${mora} さいごまで 下がらない` : `${mora} のあとで 下がる`}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
