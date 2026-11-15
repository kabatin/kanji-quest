import type { ReadingDiff, VoiceOverrides, VoiceSpec } from '../../lib/voiceCheck'

/** scripts/voice-check.mjs が書く結果(scripts/voice-report.json) */
export type VoiceReport = {
  readonly engineVersion: string
  readonly clips: Readonly<Record<string, { readonly kana: string; readonly skipped: boolean; readonly diffs: readonly ReadingDiff[] }>>
}

/** scripts/voice-accent.mjs が書く候補(scripts/voice-suggestions.json) */
export type VoiceSuggestion = { readonly id: string; readonly plain: string; readonly dict: string; readonly plainAccent: string; readonly dictAccent: string }

export type VoiceState = {
  readonly engine: boolean
  readonly overrides: VoiceOverrides
  readonly report: VoiceReport | null
  readonly suggestions: { readonly suggestions: readonly VoiceSuggestion[] } | null
}

// 開発サーバーの中継(scripts/voice-dev-plugin.mjs)を呼ぶ
const BASE = './__voice/'

async function call(name: string, body?: unknown): Promise<Response> {
  const res = await fetch(`${BASE}${name}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(detail.error ?? `エラー ${res.status}`)
  }
  return res
}

export const fetchState = async (): Promise<VoiceState> => (await call('state')).json() as Promise<VoiceState>
export const queryKana = async (spec: VoiceSpec): Promise<string> => ((await (await call('query', { spec })).json()) as { kana: string }).kana
export const synthUrl = async (spec: VoiceSpec): Promise<string> => URL.createObjectURL(await (await call('synth', { spec })).blob())
export const saveOverride = async (id: string, spec: VoiceSpec | null): Promise<void> => void (await call('override', { id, spec }))
export const rebuildClip = async (id: string): Promise<void> => void (await call('rebuild', { id }))
