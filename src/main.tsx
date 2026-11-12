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
import App from './App.tsx'
import { registerServiceWorker } from './lib/pwa'

const root = document.getElementById('root')
if (!root) throw new Error('#root が見つかりません')

// 公開した版では、電波がなくても あそべるよう準備する(開発中は なにもしない)
void registerServiceWorker()

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
