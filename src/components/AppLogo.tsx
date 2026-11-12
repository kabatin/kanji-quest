export const APP_NAME = '漢字クエスト'

type Props = { readonly className?: string }

/** アプリの名前。まだ漢字が読めない子のために、ふりがな をつける。 */
export function AppLogo({ className }: Props) {
  return (
    <p className={['app-logo', className].filter(Boolean).join(' ')} aria-label={APP_NAME}>
      <ruby aria-hidden="true">
        漢字<rt>かんじ</rt>
      </ruby>
      <span aria-hidden="true">クエスト</span>
    </p>
  )
}
