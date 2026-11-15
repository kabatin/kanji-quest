/**
 * 画面が 小さすぎる端末では、ページぜんたいを ちぢめて見せる(部品が かさならないように)。
 *
 * 配置は 2とおり ある: 高さ 500px 以下の よこ向き(スマホ用 compact.css)と、それより高い画面(タブレット用)。
 * どちらにも「これより ひくいと 収まらない」高さがあるので、それを下回る端末では、
 * viewport の幅を 広く名のって、ブラウザに ちぢめて えがかせる。
 * こうすると vh や メディアクエリ、タッチの位置も ブラウザが そろえてくれる(transform で ちぢめる より 安全)。
 */

/** スマホ用の配置が 収まる 最低の高さ(これより ひくいと、ホームの 下のメニューが 切れる) */
export const COMPACT_MIN_HEIGHT = 430
/** タブレット用の配置が 収まる 最低の高さ */
export const TABLET_MIN_HEIGHT = 700
/** これ以下の高さ(よこ向き)は スマホ用の配置になる(compact.css の条件と そろえる) */
export const COMPACT_MAX_HEIGHT = 500

export type NaturalSize = { readonly width: number; readonly height: number }

/**
 * viewport の幅に 名のる値。null = そのまま(device-width)。
 * たて向きは あんない だけを出すので、ちぢめない。
 */
export function fitViewportWidth(natural: NaturalSize): number | null {
  const { width, height } = natural
  if (!(width > 0) || !(height > 0) || height >= width) return null
  const minHeight = height <= COMPACT_MAX_HEIGHT ? COMPACT_MIN_HEIGHT : TABLET_MIN_HEIGHT
  if (height >= minHeight) return null
  return Math.ceil((minHeight * width) / height)
}

const BASE = 'width=device-width, initial-scale=1.0, viewport-fit=cover'

export function viewportContent(width: number | null): string {
  return width === null ? BASE : `width=${width}, viewport-fit=cover`
}

/** たてよこ の比が これ以上 かわったら、はかりなおす(ブラウザの バーが 出入りした・むきが かわった) */
const ASPECT_TOLERANCE = 0.02

/** 画面の大きさに合わせて viewport を なおし、かわるたびに やりなおす。 */
export function startViewportFit(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]')
  if (!meta) return
  let lastAspect = 0
  let busy = false

  const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

  const measure = async () => {
    if (busy) return
    const aspect = window.innerWidth / Math.max(1, window.innerHeight)
    if (lastAspect > 0 && Math.abs(aspect - lastAspect) / lastAspect < ASPECT_TOLERANCE) return
    busy = true
    try {
      // いったん もとの大きさに もどして、ほんとうの 大きさを はかる
      if (meta.content !== BASE) {
        meta.content = BASE
        await nextFrame()
      }
      const natural = { width: window.innerWidth, height: window.innerHeight }
      lastAspect = natural.width / Math.max(1, natural.height)
      const width = fitViewportWidth(natural)
      if (width !== null) {
        meta.content = viewportContent(width)
        await nextFrame()
      }
    } finally {
      busy = false
    }
  }

  void measure()
  window.addEventListener('resize', () => void measure())
  window.addEventListener('orientationchange', () => void measure())
}
