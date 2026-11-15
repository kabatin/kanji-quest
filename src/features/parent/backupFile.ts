/** ブラウザの機能で、書き出したファイルを 手元に渡す・選んだファイルを 文字として読む。 */

export type SaveOutcome = 'shared' | 'downloaded' | 'cancelled'

/** 共有で ファイルを渡せるか(iPad の Safari・ホーム画面のアプリは これが使える)。 */
function canShareFile(file: File): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })
}

function download(file: File): void {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.append(link)
  link.click()
  link.remove()
  // すぐに URL を消すと、ダウンロードが始まる前に 切れる ブラウザがある
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/**
 * ファイルを保存する。共有できれば 共有シート(「"ファイル"に保存」「AirDrop」など)、だめならダウンロード。
 * 共有は ボタンを押した その場で呼ぶ必要があるため、この関数の前に await を はさまないこと。
 */
export async function saveBackupFile(text: string, name: string): Promise<SaveOutcome> {
  const file = new File([text], name, { type: 'application/json' })
  if (canShareFile(file)) {
    try {
      await navigator.share({ files: [file], title: '漢字クエストの きろく' })
      return 'shared'
    } catch (error) {
      // 保護者が共有シートを閉じたときは、ダウンロードに切りかえない
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
    }
  }
  download(file)
  return 'downloaded'
}
