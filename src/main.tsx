import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/cards.css'
import './styles/screens.css'
import './styles/home.css'
import './styles/play.css'
import './styles/game.css'
import './styles/boss.css'
import './styles/profiles.css'
import './styles/art.css'
import './styles/home-panels.css'
import './styles/settings.css'
import './styles/learning.css'
import './styles/parent.css'
import './styles/rotate.css'
import './styles/compact.css'
import './styles/compact-map.css'
import './styles/compact-audit.css'
import App from './App.tsx'
import { registerServiceWorker } from './lib/pwa'
import { startViewportFit } from './lib/viewportFit'

const root = document.getElementById('root')
if (!root) throw new Error('#root が見つかりません')

// 公開した版では、電波がなくても あそべるよう準備する(開発中は なにもしない)
void registerServiceWorker()

// 画面が 小さすぎる端末では、ページぜんたいを ちぢめて 部品が かさならないようにする
startViewportFit()

// 開発中だけ(公開する版には 入らない):
//   ?scene=休                 その字の場面を コマ送りで ならべて見る
//   ?scene=山&variant=sonnet  ためしに作った場面(trials/sonnet/)を見る
//   ?compare                  ためしに作った場面を、同じ字どうし よこに ならべて見くらべる
//   ?gallery                  ぜんぶの場面を 動いている すがた で ならべて、目で たしかめる(よい・なおしたい・メモ)
//   ?voices                   ぜんぶの音声を 聞いて たしかめ、読みまちがい・アクセントを なおす(AivisSpeech が いると なおせる)
const params = import.meta.env.DEV ? new URLSearchParams(window.location.search) : new URLSearchParams()
const previewChar = params.get('scene')

if (params.has('voices')) {
  void import('./features/voicecheck/VoiceCheck').then(({ VoiceCheck }) => {
    createRoot(root).render(
      <StrictMode>
        <VoiceCheck />
      </StrictMode>,
    )
  })
} else if (params.has('gallery')) {
  void import('./features/story/SceneGallery').then(({ SceneGallery }) => {
    createRoot(root).render(
      <StrictMode>
        <SceneGallery />
      </StrictMode>,
    )
  })
} else if (previewChar || params.has('compare')) {
  void import('./features/story/ScenePreview').then(({ ScenePreview, SceneCompare }) => {
    createRoot(root).render(
      <StrictMode>{previewChar ? <ScenePreview char={previewChar} variant={params.get('variant')} /> : <SceneCompare chars={params.get('compare') ?? ''} />}</StrictMode>,
    )
  })
} else {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
