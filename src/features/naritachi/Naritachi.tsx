import { motion } from 'motion/react'
import { useState } from 'react'
import { KanjiGlyph } from '../../components/KanjiGlyph'
import { PartIcon } from '../../components/PartIcon'
import type { Kanji } from '../../data/schema'
import { fullGlyph } from '../../data/strokes'
import { useFeedback } from '../../lib/useFeedback'
import { voiceId } from '../../lib/voice'

/** 0 = 絵だけ / 1 = 絵に漢字が重なる / 2 = 漢字だけ */
const STAGES = [
  { icon: 1, glyph: 0 },
  { icon: 0.45, glyph: 1 },
  { icon: 0, glyph: 1 },
] as const

const LAST_STAGE = STAGES.length - 1
const FADE = { duration: 0.9 } as const

type Props = { readonly kanji: Kanji; readonly onDone: () => void }

/** 絵がだんだん漢字に変わっていくのを見せる(単体の漢字用)。 */
export function Naritachi({ kanji, onDone }: Props) {
  const [stage, setStage] = useState(0)
  const { play, say } = useFeedback()
  const opacity = STAGES[stage]

  const next = () => {
    if (stage === LAST_STAGE) {
      onDone()
      return
    }
    play('tap')
    if (stage + 1 === LAST_STAGE) say(voiceId.word(kanji.char), kanji.yomi)
    setStage(stage + 1)
  }

  return (
    <div className="naritachi">
      <div className="naritachi__stage" data-stage={stage}>
        <motion.div className="naritachi__layer" initial={false} animate={{ opacity: opacity.icon }} transition={FADE}>
          <PartIcon id={kanji.icon} />
        </motion.div>
        <motion.div className="naritachi__layer" initial={false} animate={{ opacity: opacity.glyph }} transition={FADE}>
          <KanjiGlyph
            layers={[{ glyph: fullGlyph(kanji.char), tone: 'ink' }]}
            label={kanji.char}
          />
        </motion.div>
      </div>
      <div className="naritachi__dots" aria-hidden="true">
        {STAGES.map((_, i) => (
          <span key={i} className={i <= stage ? 'is-on' : ''} />
        ))}
      </div>
      <button type="button" className="btn btn--primary btn--big" onClick={next}>
        {stage === LAST_STAGE ? 'できた！' : 'へんしん！'}
      </button>
    </div>
  )
}
