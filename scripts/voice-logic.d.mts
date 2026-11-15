export type Mora = string
export type AccentPhrase = { readonly moras: readonly Mora[]; readonly accent: number; readonly pause: boolean; readonly question: boolean }
export type ClipKind = 'word' | 'explain' | 'goal'
export type Clip = { readonly id: string; readonly kind: ClipKind; readonly char: string; readonly text: string }
export type VoiceSpec = { readonly kind: 'text' | 'kana'; readonly value: string }
export type VoiceOverrides = { readonly clips?: Readonly<Record<string, VoiceSpec>>; readonly words?: Readonly<Record<string, string>> }
export type Validation = { readonly ok: boolean; readonly reason: string }
export type ReadingDiff = { readonly index: number; readonly expected: string; readonly actual: string; readonly kind: 'particle-misread' | 'mismatch' }
export type ReadingComparison = { readonly ok: boolean; readonly skipped: boolean; readonly diffs: readonly ReadingDiff[]; readonly expected: string; readonly actual: string }
export type NarrationLike = Readonly<Record<string, { readonly word: string; readonly speech: string; readonly goals: readonly string[] }>>

export const MAX_SPEC_LENGTH: number
export function toKatakana(text: string): string
export function splitMoras(reading: string): string[]
export function parseKana(kana: string): AccentPhrase[]
export function buildKana(phrases: readonly AccentPhrase[]): string
export function readingOf(kana: string): string
export function pitchPattern(moraCount: number, accent: number): boolean[]
export function accentSignature(kana: string): string
export function validateKana(value: unknown): Validation
export function validateText(value: unknown): Validation
export function validateSpec(spec: unknown): Validation
export function listClips(narration: NarrationLike): Clip[]
export function replaceWords(text: string, words: Readonly<Record<string, string>>): string
export function resolveSpec(clip: Clip, overrides: VoiceOverrides): VoiceSpec
export function hasOverride(clip: Clip, overrides: VoiceOverrides): boolean
export function validateOverrides(data: unknown, clipIds: readonly string[]): Validation
export function compareReading(text: string, kana: string): ReadingComparison
export function compareAccent(dictKana: string, plainKana: string): { sameReading: boolean; sameAccent: boolean }
