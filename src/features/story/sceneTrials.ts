import type { SceneModule } from './sceneKit'
import { sceneFileName } from './sceneRegistry'

/**
 * ためしに作った場面(くらべる用)。trials/<なまえ>/k<文字コード>.tsx に置く。
 * 開発用の確認ページ(?scene=山&variant=sonnet / ?compare)からだけ読む。あそぶ画面には出ない。
 */
// 公開する版には 入れない(開発中だけ読む)
const TRIALS: Record<string, () => Promise<{ default: SceneModule }>> = import.meta.env.DEV ? import.meta.glob<{ default: SceneModule }>('./trials/*/k*.tsx') : {}

/** ためしの場面の なまえ(trials の下のフォルダ名)。 */
export function trialVariants(): string[] {
  return [...new Set(Object.keys(TRIALS).map((path) => path.split('/')[2]))].sort()
}

/** その なまえ で作ってある漢字。 */
export function trialChars(variant: string): string[] {
  return Object.keys(TRIALS)
    .filter((path) => path.split('/')[2] === variant)
    .map((path) => String.fromCodePoint(Number.parseInt(path.replace(/^.*\/k([0-9a-f]+)\.tsx$/, '$1'), 16)))
}

export async function loadTrial(variant: string, char: string): Promise<SceneModule | undefined> {
  const loader = TRIALS[`./trials/${variant}/${sceneFileName(char)}`]
  if (!loader) return undefined
  const scene = (await loader()).default
  if (scene.char !== char) throw new Error(`場面のファイルと漢字が合っていません: ${variant}/${sceneFileName(char)} は「${scene.char}」の場面です`)
  return scene
}
