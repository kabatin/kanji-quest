import { previewMusic } from './music'
import { playSound } from './sound'
import { playVoice, voiceId } from './voice'
import { VOLUME_SCALE, type Channel, type VolumeChoice } from './volume'

/** ためしに読み上げる漢字 */
const SAMPLE_CHAR = '木'
const SAMPLE_YOMI = 'き'

/** 大きさを えらんだときに、その大きさで ならす見本の音。「なし」のときは ならさない。 */
export function playSample(channel: Channel, choice: VolumeChoice): void {
  if (choice === 'off') return
  const scale = VOLUME_SCALE[channel][choice]
  if (channel === 'sound') playSound('ok', true, scale)
  else if (channel === 'music') previewMusic(scale)
  else playVoice(voiceId.word(SAMPLE_CHAR), SAMPLE_YOMI, true, scale)
}
