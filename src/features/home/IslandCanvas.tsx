import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { ForestScene } from './ForestScene'
import type { DecoDrop, IslandScene, IslandState } from './scene/islandScene'

type Props = IslandState & {
  /** すみまる(しま)を さわったとき */
  readonly onPoke?: () => void
  /** もようがえ(かざり を指で うごかす)の間は true */
  readonly editing?: boolean
  /** 3D の しま が出せたか(出せない端末では、もようがえ は できない) */
  readonly onReady?: (ready: boolean) => void
  /** かざり を つかんだとき */
  readonly onGrab?: (name: string) => void
  /** かざり を置いたとき */
  readonly onPlace?: (drop: DecoDrop) => void
  /** もようがえ で えらんでいる かざり */
  readonly selected?: string | null
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

/** 指の場所を、画面の まんなか が 0、はしが ±1 の数に直す(上が +1)。 */
function pointerSpot(event: PointerEvent<HTMLCanvasElement>): { readonly x: number; readonly y: number } | null {
  const rect = event.currentTarget.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return null
  return { x: ((event.clientX - rect.left) / rect.width) * 2 - 1, y: -(((event.clientY - rect.top) / rect.height) * 2 - 1) }
}

/**
 * ホームの景色。空にうかぶ しま を 3D で描く。
 * 3D が使えない端末・読みこみ中は、絵(SVG)の森を代わりに見せる。
 */
export function IslandCanvas({ onPoke, editing = false, onReady, onGrab, onPlace, selected = null, ...state }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<IslandScene | null>(null)
  const stateRef = useRef<IslandState>(state)
  const [ready, setReady] = useState(false)
  const decoKey = `${state.decos.join()}|${JSON.stringify(state.decoSpots)}|${JSON.stringify(state.decoTurns)}`

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

  useEffect(() => {
    onReady?.(ready)
  }, [ready, onReady])

  useEffect(() => {
    sceneRef.current?.setEditing(editing)
  }, [ready, editing])

  useEffect(() => {
    sceneRef.current?.select(editing ? selected : null)
  }, [ready, editing, selected])

  const handleDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!editing) {
      sceneRef.current?.poke()
      onPoke?.()
      return
    }
    const spot = pointerSpot(event)
    const name = spot ? sceneRef.current?.grab(spot.x, spot.y) : null
    if (!name) return
    // 指が しま の外に出ても、はなすまで つかんだままにする
    event.currentTarget.setPointerCapture?.(event.pointerId)
    onGrab?.(name)
  }

  const handleMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const spot = pointerSpot(event)
    if (!spot) return
    if (editing) sceneRef.current?.drag(spot.x, spot.y)
    else sceneRef.current?.look(spot.x, -spot.y)
  }

  const handleUp = () => {
    if (!editing) return
    const drop = sceneRef.current?.drop()
    if (drop) onPlace?.(drop)
  }

  return (
    <div className="island" data-ready={ready} data-sky={state.sky} data-editing={editing}>
      {!ready && <ForestScene learnedCount={state.learnedCount} sky={state.sky} />}
      <canvas
        ref={canvasRef}
        className="island__canvas"
        aria-hidden="true"
        onPointerMove={handleMove}
        onPointerDown={handleDown}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
      />
    </div>
  )
}
