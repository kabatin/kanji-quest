import { useId } from 'react'
import { HANDEDS, type Handed } from '../../lib/handed'
import { type Channel, type VolumeChoice } from '../../lib/volume'
import { playSample } from '../../lib/volumeSample'

const VOLUME_LABEL: Readonly<Record<VolumeChoice, string>> = { off: 'なし', low: 'ちいさい', normal: 'ふつう', high: 'おおきい' }
const HANDED_LABEL: Readonly<Record<Handed, string>> = { right: 'みぎ', left: 'ひだり' }

type ChoiceProps<T extends string> = {
  readonly name: string
  readonly note: string
  readonly icon: string
  readonly choices: readonly T[]
  readonly labelOf: (choice: T) => string
  readonly value: T
  readonly onChange: (choice: T) => void
}

/** 設定1つ: 絵 + 名前 + 説明 + 大きなボタンの ならび(ひとつだけ えらべる)。 */
function ChoiceRow<T extends string>({ name, note, icon, choices, labelOf, value, onChange }: ChoiceProps<T>) {
  const noteId = useId()
  return (
    <li className="setting setting--choice">
      <span className="setting__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="setting__text">
        <span className="setting__label">{name}</span>
        <small id={noteId}>{note}</small>
      </span>
      <div className="choice" role="radiogroup" aria-label={name} aria-describedby={noteId}>
        {choices.map((choice) => (
          <label key={choice} className={`choice__item ${choice === value ? 'is-on' : ''}`}>
            <input type="radio" name={name} value={choice} checked={choice === value} onChange={() => onChange(choice)} />
            <span>{labelOf(choice)}</span>
          </label>
        ))}
      </div>
    </li>
  )
}

type VolumeRowProps = {
  readonly channel: Channel
  readonly name: string
  readonly note: string
  readonly icon: string
  readonly value: VolumeChoice
  readonly onChange: (choice: VolumeChoice) => void
}

/** おと・おんがく・よみあげ の大きさ(なし / ちいさい / ふつう / おおきい)。押すと その大きさで ならす。 */
export function VolumeRow({ channel, name, note, icon, value, onChange }: VolumeRowProps) {
  const choices = Object.keys(VOLUME_LABEL) as VolumeChoice[]
  const change = (choice: VolumeChoice) => {
    onChange(choice)
    playSample(channel, choice)
  }
  return <ChoiceRow name={name} note={note} icon={icon} choices={choices} labelOf={(c) => VOLUME_LABEL[c]} value={value} onChange={change} />
}

/** ききて(みぎ / ひだり)。 */
export function HandedRow({ value, onChange }: { readonly value: Handed; readonly onChange: (handed: Handed) => void }) {
  return <ChoiceRow name="ききて" note="かく ところが みぎ か ひだり か" icon="✍️" choices={HANDEDS} labelOf={(h) => HANDED_LABEL[h]} value={value} onChange={onChange} />
}
