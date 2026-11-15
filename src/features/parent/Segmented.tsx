type Option<T> = { readonly value: T; readonly label: string }

type Props<T> = {
  readonly label: string
  readonly options: readonly Option<T>[]
  readonly value: T
  readonly onChange: (value: T) => void
}

/** 保護者の画面の 選ぶボタンの並び(1つだけ選べる)。 */
export function Segmented<T extends string | number>({ label, options, value, onChange }: Props<T>) {
  return (
    <div className="parent__option">
      <span className="parent__option-label">{label}</span>
      <div className="pseg" role="group" aria-label={label}>
        {options.map((option) => (
          <button key={option.value} type="button" className="pseg__btn" aria-pressed={option.value === value} onClick={() => onChange(option.value)}>
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
