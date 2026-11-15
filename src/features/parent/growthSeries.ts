/** 週ごとの伸びの 2本の線(凡例・線・表で 同じ順) */
export type GrowthKey = 'learned' | 'freeWritten'

export const GROWTH_SERIES: readonly { readonly key: GrowthKey; readonly label: string }[] = [
  { key: 'learned', label: '覚えた字' },
  { key: 'freeWritten', label: '自力で書けた字' },
]
