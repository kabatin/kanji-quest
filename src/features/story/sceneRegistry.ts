import { useEffect, useState } from 'react'
import type { SceneModule } from './sceneKit'

/**
 * 手づくりの場面の一覧。scenes/ の中に、漢字1字 = 1ファイル で置く。
 * ファイル名は k + 漢字の文字コード(16進)。休 = U+4F11 → k4f11.tsx
 * 場面は その字を学ぶときに あとから読みこむので、字が ふえても さいしょの読みこみは 重くならない。
 */
const LOADERS = import.meta.glob<{ default: SceneModule }>('./scenes/k*.tsx')

export const sceneFileName = (char: string): string => `k${(char.codePointAt(0) ?? 0).toString(16)}.tsx`

const loaderOf = (char: string) => LOADERS[`./scenes/${sceneFileName(char)}`]

/** その漢字に、手づくりの場面が あるか。 */
export const hasScene = (char: string): boolean => loaderOf(char) !== undefined

/** 手づくりの場面がある漢字(文字コードから もどす)。 */
export function sceneChars(): string[] {
  return Object.keys(LOADERS).map((path) => String.fromCodePoint(Number.parseInt(path.replace(/^.*\/k([0-9a-f]+)\.tsx$/, '$1'), 16)))
}

export async function loadScene(char: string): Promise<SceneModule | undefined> {
  const loader = loaderOf(char)
  if (!loader) return undefined
  const scene = (await loader()).default
  if (scene.char !== char) throw new Error(`場面のファイルと漢字が合っていません: ${sceneFileName(char)} は「${scene.char}」の場面です`)
  return scene
}

/** 場面を読みこむ。読みこみ中・場面がない・読みこめなかったときは undefined。 */
export function useScene(char: string): SceneModule | undefined {
  const [loaded, setLoaded] = useState<SceneModule | undefined>(undefined)
  useEffect(() => {
    let alive = true
    loadScene(char)
      .then((scene) => {
        if (alive) setLoaded(scene)
      })
      .catch((error: unknown) => {
        // 読みこめなかったときは、これまでの かんたんな絵で見せる(学習は止めない)
        console.error('場面を読みこめませんでした:', error)
        if (alive) setLoaded(undefined)
      })
    return () => {
      alive = false
    }
  }, [char])
  return loaded?.char === char ? loaded : undefined
}
