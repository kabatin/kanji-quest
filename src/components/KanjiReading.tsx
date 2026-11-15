import './ktext.css'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'

/** 読みを出しておく時間。もう一度おすか、Esc でも消える。 */
export const READING_MS = 3500

/**
 * 押すと、ほかの動きが起きてしまう場所の目印。この中の漢字は「読み」に反応しない
 * (ボタンの中の文を押したとき、ボタンが動くのを じゃましないため)。
 * data-no-reading をつければ、ほかの場所でも反応させない。
 */
const ACTION_ANCESTOR =
  "button, a, input, select, textarea, label, summary, [role='button'], [role='tab'], [role='link'], [role='option'], [role='menuitem'], [role='checkbox'], [role='radio'], [role='switch'], [data-no-reading]"

type Props = {
  /** 漢字で出ている語 */
  readonly text: string
  /** その語の ひらがなの よみ */
  readonly reading: string
}

/** 漢字に変わった語。おす(キーボードでは Enter / Space)と、よみが ルビのように 上に出る。 */
export function KanjiReading({ text, reading }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const [plain, setPlain] = useState(false)
  const [open, setOpen] = useState(false)

  useLayoutEffect(() => {
    setPlain(ref.current?.parentElement?.closest(ACTION_ANCESTOR) != null)
  }, [])

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => setOpen(false), READING_MS)
    return () => clearTimeout(timer)
  }, [open])

  const toggle = useCallback(() => setOpen((prev) => !prev), [])
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggle()
    } else if (event.key === 'Escape') setOpen(false)
  }

  if (plain) {
    return (
      <span ref={ref} className="ktext__kanji">
        {text}
      </span>
    )
  }
  return (
    <span
      ref={ref}
      className={`ktext__kanji ktext__kanji--tap ${open ? 'is-reading' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`${text}、よみは ${reading}`}
      aria-expanded={open}
      onClick={toggle}
      onKeyDown={onKeyDown}
      onBlur={() => setOpen(false)}
    >
      {text}
      {open && (
        <span className="ktext__reading" aria-hidden="true">
          {reading}
        </span>
      )}
    </span>
  )
}
