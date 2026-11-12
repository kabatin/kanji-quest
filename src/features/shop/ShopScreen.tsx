import { useState } from 'react'
import { TopBar } from '../../components/Hud'
import { Mascot } from '../../components/Mascot'
import { PartCard } from '../../components/PartCard'
import { getPart } from '../../data/parts'
import { levelInfo, MASCOT_FORMS, mascotStage } from '../../lib/level'
import { buyState, ITEM_KINDS, itemName, KIND_LABEL, SHOP_ITEMS, type ItemKind, type ShopItem } from '../../lib/shop'
import { useFeedback } from '../../lib/useFeedback'
import { useProgress } from '../../store/progress'
import { skyPreset } from '../home/scene/layout'

const SAMPLE_PART_ID = '氵'

/** そら の見本の色(ホームの 3D の空と同じ) */
function skyBackground(name: string): string {
  const [top, middle, bottom] = skyPreset(name).gradient
  return `linear-gradient(${top}, ${middle} 60%, ${bottom})`
}

function ItemPreview({ item, stage }: { readonly item: ShopItem; readonly stage: number }) {
  if (item.kind === 'hat') return <Mascot stage={stage} hat={itemName(item.id)} className="shop-item__mascot" />
  if (item.kind === 'bg') return <span className="shop-item__sky" style={{ background: skyBackground(itemName(item.id)) }} />
  if (item.kind === 'deco') {
    return (
      <span className="shop-item__emoji" aria-hidden="true">
        {item.emoji}
      </span>
    )
  }
  return (
    <span className="shop-item__card" data-skin={itemName(item.id)}>
      <PartCard part={getPart(SAMPLE_PART_ID)} showHint={false} />
    </span>
  )
}

/** すみまるの すがた の道のり。いまの すがた と、これからの すがた(かげ)を並べる。 */
function FormRoad({ level }: { readonly level: number }) {
  const now = mascotStage(level)
  return (
    <ol className="form-road" aria-label="すみまるの すがた">
      {MASCOT_FORMS.map((form, i) => (
        <li key={form.level} className={i === now ? 'is-now' : i < now ? 'is-past' : 'is-future'} aria-current={i === now ? 'step' : undefined}>
          <Mascot stage={i} className="form-road__mascot" />
          <small>レベル {form.level}</small>
        </li>
      ))}
    </ol>
  )
}

/** きせかえ: コインで、ぼうし・しまの かざり・そら・カードの見た目を買って着がえる。 */
export function ShopScreen({ onBack }: { readonly onBack: () => void }) {
  const [kind, setKind] = useState<ItemKind>('hat')
  const coins = useProgress((s) => s.coins)
  const xp = useProgress((s) => s.xp)
  const owned = useProgress((s) => s.owned)
  const equipped = useProgress((s) => s.equipped)
  const decoStored = useProgress((s) => s.decoStored)
  const buy = useProgress((s) => s.buy)
  const equip = useProgress((s) => s.equip)
  const { play } = useFeedback()
  const { level } = levelInfo(xp)
  const stage = mascotStage(level)

  const choose = (item: ShopItem) => {
    if (owned.includes(item.id)) {
      equip(item.id)
      play('tap')
    } else if (buy(item.id)) {
      play('buy')
    }
  }

  const isOn = (item: ShopItem): boolean => (item.kind === 'deco' ? owned.includes(item.id) : equipped[item.kind] === item.id)

  const stateLabel = (item: ShopItem) => {
    const state = buyState(item, owned, coins, level)
    if (state === 'locked') return <>🔒 レベル {item.minLevel}</>
    if (state === 'owned' && item.kind === 'deco') return decoStored.includes(itemName(item.id)) ? 'しまってある' : 'おいてある'
    if (state === 'owned') return isOn(item) ? 'つかってる' : 'つかう'
    return (
      <>
        <span className="coin" aria-hidden="true" />
        {item.price}
      </>
    )
  }

  return (
    <div className="screen shop">
      <TopBar onBack={onBack} backLabel="ホーム" title="きせかえ" />
      <div className="shop__body">
        <aside className="shop__me">
          <Mascot stage={stage} hat={itemName(equipped.hat)} happy className="shop__mascot" />
          <p className="shop__level">
            レベル {level}
            <small>{MASCOT_FORMS[stage].name}</small>
          </p>
          <FormRoad level={level} />
        </aside>
        <div className="shop__main">
          <div className="shop__tabs" role="tablist" aria-label="しゅるい">
            {ITEM_KINDS.map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={kind === value}
                className={`btn chip ${kind === value ? 'is-selected' : ''}`}
                onClick={() => setKind(value)}
              >
                {KIND_LABEL[value]}
              </button>
            ))}
          </div>
          {kind === 'deco' && <p className="shop__hint">かった かざりは、ホームの「🪴 もようがえ」で すきな ところに おけるよ</p>}
          <ul className="shop__items">
            {SHOP_ITEMS.filter((item) => item.kind === kind).map((item) => {
              const state = buyState(item, owned, coins, level)
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`shop-item is-${state} ${isOn(item) ? 'is-on' : ''}`}
                    data-item={item.id}
                    disabled={state === 'locked' || state === 'poor'}
                    aria-pressed={isOn(item)}
                    onClick={() => choose(item)}
                  >
                    <ItemPreview item={item} stage={stage} />
                    <span className="shop-item__label">{item.label}</span>
                    <span className="shop-item__state">{stateLabel(item)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
