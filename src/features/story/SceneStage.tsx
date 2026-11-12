import { GLYPH_SIZE } from '../../data/strokes'
import type { SceneModule } from './sceneKit'

type Props = {
  readonly scene: SceneModule
  /** いま見せる時間(秒) */
  readonly t: number
  readonly label: string
  readonly className?: string
}

/** 場面を、時間 t の しゅんかんで 1コマ描く。 */
export function SceneStage({ scene, t, label, className }: Props) {
  const time = Math.min(Math.max(t, 0), scene.duration)
  return (
    <svg
      className={['story__svg', 'scene', className].filter(Boolean).join(' ')}
      viewBox={`0 0 ${GLYPH_SIZE} ${GLYPH_SIZE}`}
      role="img"
      aria-label={label}
      data-scene={scene.char}
      data-finished={time >= scene.duration}
    >
      <scene.Scene t={time} />
    </svg>
  )
}
