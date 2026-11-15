/** 音の大きさ(おと・おんがく・よみあげ)。「なし」は、それぞれの ON/OFF のほうで あらわす。 */
export type Volume = 'low' | 'normal' | 'high'
export type VolumeChoice = 'off' | Volume
export type Channel = 'sound' | 'music' | 'speech'

export const VOLUME_CHOICES: readonly VolumeChoice[] = ['off', 'low', 'normal', 'high']

/**
 * 「ふつう」= いままでの音量(1)。3つのバランス(こえが いちばん聞こえる)がくずれないよう、
 * 「おおきい」でも こえ・おと・おんがく の順は かわらない上限にしている。
 */
export const VOLUME_SCALE: Readonly<Record<Channel, Readonly<Record<Volume, number>>>> = {
  sound: { low: 0.4, normal: 1, high: 1.5 },
  music: { low: 0.5, normal: 1, high: 1.4 },
  speech: { low: 0.5, normal: 1, high: 1.5 },
}

const VOLUMES: readonly Volume[] = ['low', 'normal', 'high']

/** 保存してあった値が こわれていたら「ふつう」にする。 */
export function sanitizeVolume(value: unknown): Volume {
  return VOLUMES.find((volume) => volume === value) ?? 'normal'
}

/** ON/OFF と 大きさから、ボタンで えらばれている段を決める。 */
export function choiceOf(on: boolean, volume: Volume): VolumeChoice {
  return on ? volume : 'off'
}

type VolumePatch = Partial<Record<Channel, boolean> & Record<`${Channel}Vol`, Volume>>

/** ボタンを押したときに、設定へ書きこむ内容。「なし」のときは 大きさを おぼえておく(ON/OFF だけ かえる)。 */
export function volumePatch(channel: Channel, choice: VolumeChoice): VolumePatch {
  if (choice === 'off') return { [channel]: false }
  return { [channel]: true, [`${channel}Vol`]: choice }
}

/** いまの設定での、実際の音量の倍率(なし = 0)。大きさが入っていない設定は「ふつう」として あつかう。 */
export function scaleOf(channel: Channel, on: boolean, volume: Volume): number {
  return on ? VOLUME_SCALE[channel][sanitizeVolume(volume)] : 0
}
