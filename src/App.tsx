import { useState } from 'react'
import { getKanji } from './data/kanji'
import { Challenge } from './features/challenge/Challenge'
import { Learn } from './features/learn/Learn'
import { Reward } from './features/reward/Reward'
import { SettingsScreen } from './features/settings/SettingsScreen'
import { Zukan, type ZukanView } from './features/zukan/Zukan'
import { useProgress } from './store/progress'

type Screen =
  | { readonly name: 'home' }
  | { readonly name: 'learn'; readonly char: string }
  | { readonly name: 'challenge' }
  | { readonly name: 'reward' }
  | { readonly name: 'settings' }

const HOME: Screen = { name: 'home' }
const FIRST_PAGE: ZukanView = { grade: 1, page: 0 }

export default function App() {
  const [screen, setScreen] = useState<Screen>(HOME)
  // ずかんで見ていた学年とページは、ほかの画面から戻ってきても覚えておく
  const [zukanView, setZukanView] = useState<ZukanView>(FIRST_PAGE)
  const skin = useProgress((s) => s.skin)
  const goHome = () => setScreen(HOME)
  const openKanji = (char: string) => setScreen({ name: 'learn', char })

  return (
    <div className="app" data-skin={skin}>
      {screen.name === 'home' && (
        <Zukan
          view={zukanView}
          onView={setZukanView}
          onOpen={openKanji}
          onChallenge={() => setScreen({ name: 'challenge' })}
          onReward={() => setScreen({ name: 'reward' })}
          onSettings={() => setScreen({ name: 'settings' })}
        />
      )}
      {screen.name === 'learn' && (
        <Learn key={screen.char} kanji={getKanji(screen.char)} onOpen={openKanji} onHome={goHome} />
      )}
      {screen.name === 'challenge' && <Challenge onHome={goHome} />}
      {screen.name === 'reward' && <Reward onHome={goHome} />}
      {screen.name === 'settings' && <SettingsScreen onHome={goHome} />}
    </div>
  )
}
