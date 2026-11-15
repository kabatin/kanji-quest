// 音声チェック用の再生(アプリ本体の声の仕組みとは 別。ひとつだけ 鳴らす)
let current: HTMLAudioElement | undefined

export function playUrl(url: string, onEnd?: () => void): Promise<void> {
  current?.pause()
  const audio = new Audio(url)
  current = audio
  audio.addEventListener('ended', () => onEnd?.())
  return audio.play()
}

/** 作ってある mp3 を 鳴らす。作りなおした直後でも 新しい音が 聞けるよう、かならず取りなおす。 */
export const playClip = (id: string): Promise<void> => playUrl(`${import.meta.env.BASE_URL}voice/${id}.mp3?t=${Date.now()}`)
