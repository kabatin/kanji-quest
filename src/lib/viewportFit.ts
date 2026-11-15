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

/**
 * 端末の ほんとうの幅(viewport を いじる前の device-width)と、今の たてよこ の比から、名のる幅を決める。
 * たてよこ の比は viewport を かえても かわらないので、ブラウザの バーが 出入りしても、もとに もどさずに 計算できる。
 */
export function fitFromAspect(naturalWidth: number, innerWidth: number, innerHeight: number): number | null {
  if (!(naturalWidth > 0) || !(innerWidth > 0) || !(innerHeight > 0)) return null
  return fitViewportWidth({ width: naturalWidth, height: (naturalWidth * innerHeight) / innerWidth })
}

/** バーの 出入りの とちゅうで 何度も かえないよう、うごきが おさまってから なおす */
const SETTLE_MS = 150

/** 画面の大きさに合わせて viewport を なおし、かわるたびに やりなおす。 */
export function startViewportFit(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]')
  if (!meta) return
  let naturalWidth = 0
  let landscape = false
  let timer: number | undefined
  let measuring = false

  const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  const isLandscape = () => window.innerWidth > window.innerHeight

  /** 今の たてよこ の比に合わせて なおす(もとの大きさには もどさない = 画面が ちらつかない) */
  const apply = () => {
    const content = viewportContent(fitFromAspect(naturalWidth, window.innerWidth, window.innerHeight))
    if (meta.content !== content) meta.content = content
  }

  /** いったん もとの大きさに もどして、端末の ほんとうの幅を はかりなおす(はじめ と、むきが かわったとき だけ) */
  const measure = async () => {
    if (measuring) return
    measuring = true
    try {
      if (meta.content !== BASE) {
        meta.content = BASE
        await nextFrame()
      }
      naturalWidth = window.innerWidth
      landscape = isLandscape()
      apply()
    } finally {
      measuring = false
    }
  }

  const onChange = () => {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      if (measuring) return
      if (naturalWidth === 0 || isLandscape() !== landscape) void measure()
      else apply()
    }, SETTLE_MS)
  }

  void measure()
  window.addEventListener('resize', onChange)
  window.addEventListener('orientationchange', onChange)
}
