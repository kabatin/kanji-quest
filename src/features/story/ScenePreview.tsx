import { useEffect, useRef, useState } from 'react'
import { strokeCount } from '../../data/strokes'
import { useSceneClock } from './sceneClock'
import { checkScene, sheetTimes, type SceneModule } from './sceneKit'
import { loadScene, sceneChars } from './sceneRegistry'
import { loadTrial, trialChars, trialVariants } from './sceneTrials'
import { SceneStage } from './SceneStage'

type Loaded = { readonly state: 'loading' } | { readonly state: 'missing'; readonly error?: string } | { readonly state: 'ready'; readonly scene: SceneModule }

/** 場面を読みこむ。variant が あれば、ためしに作った場面(trials/)から。 */
function useLoaded(char: string, variant: string | null): Loaded {
  const [loaded, setLoaded] = useState<Loaded & { readonly key: string }>({ state: 'loading', key: '' })
  const key = `${variant ?? ''}/${char}`
  useEffect(() => {
    let alive = true
    ;(variant ? loadTrial(variant, char) : loadScene(char))
      .then((scene) => {
        if (alive) setLoaded(scene ? { state: 'ready', scene, key } : { state: 'missing', key })
      })
      .catch((error: unknown) => {
        if (alive) setLoaded({ state: 'missing', error: error instanceof Error ? error.message : String(error), key })
      })
    return () => {
      alive = false
    }
  }, [char, variant, key])
  return loaded.key === key ? loaded : { state: 'loading' }
}

function Live({ scene, title }: { readonly scene: SceneModule; readonly title?: string }) {
  const [round, setRound] = useState(0)
  const t = useSceneClock(scene.duration, round)
  return (
    <figure className="scene-sheet__live">
      <SceneStage scene={scene} t={t} label={`${scene.char} の ものがたり`} />
      <figcaption>
        {title && <strong>{title}　</strong>}
        {t.toFixed(1)} / {scene.duration} 秒{' '}
        <button type="button" onClick={() => setRound((r) => r + 1)}>
          ↻ もういちど
        </button>
      </figcaption>
    </figure>
  )
}

/** さいごの しゅんかん に、字の画が ぜんぶ書けているか を、じっさいに描いて たしかめる。 */
function FinalCheck({ scene, onResult }: { readonly scene: SceneModule; readonly onResult: (problem: string | null) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const done = ref.current?.querySelectorAll('[data-done="true"]').length ?? 0
    const first = ref.current?.querySelectorAll('[data-first] [data-stroke]').length ?? 0
    const want = strokeCount(scene.char)
    if (done !== want) onResult(`さいごの しゅんかん に、字の画が ${want}本 書けていない(いま ${done}本)。<Ink> で ぜんぶの画を書く`)
    else if (first > 0) onResult('はじめの しゅんかん に、もう 字が書かれている。場面は 絵から始める')
    else onResult(null)
  }, [scene, onResult])
  return (
    <div ref={ref} hidden>
      <SceneStage scene={scene} t={scene.duration} label="さいご" />
      <div data-first>
        <SceneStage scene={scene} t={0} label="はじめ" />
      </div>
    </div>
  )
}

/**
 * 開発用: 場面を コマ送りで ならべて見る(?scene=休)。ためしの場面は ?scene=山&variant=sonnet。
 * 1まいの画面で 話の流れ・絵と字の重なり を たしかめられる。公開する版には 入らない。
 */
export function ScenePreview({ char, variant = null }: { readonly char: string; readonly variant?: string | null }) {
  const loaded = useLoaded(char, variant)
  const [finalProblem, setFinalProblem] = useState<string | null | undefined>(undefined)
  if (loaded.state === 'loading') return <div className="scene-sheet" data-state="loading" />
  if (loaded.state === 'missing') {
    return (
      <div className="scene-sheet" data-state="missing">
        <p data-missing>
          「{char}」の場面は まだ ありません{variant ? `(${variant})` : ''}。ある場面: {(variant ? trialChars(variant) : sceneChars()).join(' ') || 'なし'}
        </p>
        {loaded.error && <p className="scene-sheet__problems">読みこめません: {loaded.error}</p>}
      </div>
    )
  }
  const { scene } = loaded
  const problems = [...checkScene(scene), ...(finalProblem ? [finalProblem] : [])]
  const beatAt = (time: number) => [...scene.beats].reverse().find((beat) => beat.at <= time)
  return (
    <div className="scene-sheet" data-char={scene.char} data-state="ready" data-ready={finalProblem !== undefined}>
      <h1>
        {scene.char}
        {variant ? `(${variant})` : ''}　{scene.duration} 秒　くぎり {scene.beats.length}
      </h1>
      {problems.length > 0 && <p className="scene-sheet__problems">なおす所: {problems.join(' / ')}</p>}
      <FinalCheck scene={scene} onResult={setFinalProblem} />
      <div className="scene-sheet__grid">
        {sheetTimes(scene).map((time) => (
          <figure key={time}>
            <SceneStage scene={scene} t={time} label={`${time} 秒`} />
            <figcaption>
              <strong>{time.toFixed(2)}</strong> {beatAt(time)?.label}
            </figcaption>
          </figure>
        ))}
      </div>
      <Live scene={scene} />
    </div>
  )
}

function CompareCell({ char, variant }: { readonly char: string; readonly variant: string }) {
  const loaded = useLoaded(char, variant)
  if (loaded.state !== 'ready') return <p className="scene-compare__none">{loaded.state === 'loading' ? '…' : `${variant}: まだ ない`}</p>
  return <Live scene={loaded.scene} title={variant} />
}

/**
 * 開発用: ためしに作った場面を、同じ字どうし よこに ならべて見くらべる(?compare)。
 * ?compare=山森 のように 字を えらぶこともできる。
 */
export function SceneCompare({ chars }: { readonly chars: string }) {
  const variants = trialVariants()
  const list = chars ? [...chars] : [...new Set(variants.flatMap(trialChars))]
  return (
    <div className="scene-sheet scene-compare">
      <h1>ためしの場面を くらべる　{variants.join(' / ') || '(まだ ない)'}</h1>
      {list.map((char) => (
        <section key={char} className="scene-compare__row" data-char={char}>
          <h2>{char}</h2>
          {variants.map((variant) => (
            <CompareCell key={variant} char={char} variant={variant} />
          ))}
        </section>
      ))}
    </div>
  )
}
