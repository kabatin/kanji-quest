import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { ForestScene } from './ForestScene'
import type { IslandScene, IslandState } from './scene/islandScene'

type Props = IslandState & {
  /** すみまる(しま)を さわったとき */
  readonly onPoke?: () => void
}

/** この端末で WebGL(3D)が使えるか。テストの環境(jsdom)では使えない。 */
function canUseWebGL(): boolean {
  if (typeof WebGLRenderingContext === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

/**
 * ホームの景色。空にうかぶ しま を 3D で描く。
 * 3D が使えない端末・読みこみ中は、絵(SVG)の森を代わりに見せる。
 */
export function IslandCanvas({ onPoke, ...state }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<IslandScene | null>(null)
  const stateRef = useRef<IslandState>(state)
  const [ready, setReady] = useState(false)
  const decoKey = state.decos.join()

  useEffect(() => {
    stateRef.current = state
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !canUseWebGL()) return
    let disposed = false
    let observer: ResizeObserver | undefined
    // three.js は大きいので、ホームを開いたときに あとから読みこむ
    import('./scene/islandScene')
      .then(({ createIslandScene }) => {
        if (disposed) return
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const scene = createIslandScene(canvas, stateRef.current, reducedMotion)
        sceneRef.current = scene
        observer = new ResizeObserver(() => scene.resize(canvas.clientWidth, canvas.clientHeight))
        observer.observe(canvas)
        scene.resize(canvas.clientWidth, canvas.clientHeight)
        setReady(true)
      })
      .catch(() => {
        // 3D を用意できなかったときは、絵の森のままにする
        setReady(false)
      })
    return () => {
      disposed = true
      observer?.disconnect()
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    sceneRef.current?.update(stateRef.current)
  }, [ready, state.learnedCount, state.totalKanji, state.sky, state.mascotStage, state.hat, decoKey])

  const handleMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    sceneRef.current?.look(((event.clientX - rect.left) / rect.width) * 2 - 1, ((event.clientY - rect.top) / rect.height) * 2 - 1)
  }

  return (
    <div className="island" data-ready={ready} data-sky={state.sky}>
      {!ready && <ForestScene learnedCount={state.learnedCount} sky={state.sky} />}
      <canvas
        ref={canvasRef}
        className="island__canvas"
        aria-hidden="true"
        onPointerMove={handleMove}
        onPointerDown={() => {
          sceneRef.current?.poke()
          onPoke?.()
        }}
      />
    </div>
  )
}
