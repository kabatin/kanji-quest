import { useMemo } from 'react'
import { useProgress } from '../store/progress'
import { playSound, type SoundName } from './sound'
import { playVoice } from './voice'

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
