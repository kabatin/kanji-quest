import { useEffect, useMemo } from 'react'
import { useProgress } from '../store/progress'
import { playSound, type SoundName } from './sound'
import { playVoice, stopVoice } from './voice'
import { VOLUME_SCALE } from './volume'

/**
 * key が変わったとき(べつの画面に うつったとき)と、画面が消えたときに、流れている音声を
 * フェードアウトで止める。次の画面がすぐ新しい音声を鳴らしたときは、そちらが優先される。
 */
export function useStopVoiceOnLeave(key: unknown): void {
  useEffect(() => () => stopVoice(), [key])
}

/** 設定(音・読み上げのオン/オフと大きさ)を反映した、音と読み上げの窓口。 */
export function useFeedback() {
  const sound = useProgress((s) => s.settings.sound)
  const speech = useProgress((s) => s.settings.speech)
  const soundScale = useProgress((s) => VOLUME_SCALE.sound[s.settings.soundVol])
  const speechScale = useProgress((s) => VOLUME_SCALE.speech[s.settings.speechVol])
  return useMemo(
    () => ({
      /** 事前に作った音声を再生する。なければ fallbackText を読み上げる。 */
      say: (clipId: string, fallbackText: string) => playVoice(clipId, fallbackText, speech, speechScale),
      play: (name: SoundName) => playSound(name, sound, soundScale),
    }),
    [sound, speech, soundScale, speechScale],
  )
}
