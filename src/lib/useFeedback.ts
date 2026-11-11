import { useEffect, useMemo } from 'react'
import { useProgress } from '../store/progress'
import { playSound, type SoundName } from './sound'
import { playVoice, stopVoice } from './voice'

/**
 * key が変わったとき(べつの画面に うつったとき)と、画面が消えたときに、流れている音声を
 * フェードアウトで止める。次の画面がすぐ新しい音声を鳴らしたときは、そちらが優先される。
 */
export function useStopVoiceOnLeave(key: unknown): void {
  useEffect(() => () => stopVoice(), [key])
}

/** 設定(音・読み上げのオン/オフ)を反映した、音と読み上げの窓口。 */
export function useFeedback() {
  const sound = useProgress((s) => s.settings.sound)
  const speech = useProgress((s) => s.settings.speech)
  return useMemo(
    () => ({
      /** 事前に作った音声を再生する。なければ fallbackText を読み上げる。 */
      say: (clipId: string, fallbackText: string) => playVoice(clipId, fallbackText, speech),
      play: (name: SoundName) => playSound(name, sound),
    }),
    [sound, speech],
  )
}
