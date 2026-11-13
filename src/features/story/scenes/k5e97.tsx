/*
 * 店(みせ): やねの 下に、しなものを ならべる おみせ。
 *
 * ほね(画と絵の対応)
 *   1画目(丶)  … やねの てっぺんに 立てた 小さな はた(の さお)
 *   2画目(一)  … やね(ひさしの 長い 板)
 *   3画目(ノ)  … やねを ささえる 左の はしら(だいたい 同じ向きの、まっすぐな 木)
 *   4画目(丨)  … おみせの まんなかの はしら(やねから 下りて、台の上まで)
 *   5画目(一)  … はしらから 右へ のびた うで(ねだんの ふだを つるす)
 *   6・7・8画目 … しなものを のせる 台(口の かたち)。7画目が 台の うえの いた
 *
 * ながれ
 *   あつい 日ざしの 中、かごを もった おみせの 女の子が、汗を かいて うちわで あおぐ
 *   → たおれかけた はしらを ひっぱって 立て、やねを ぱたんと かける → かげが できて、ほっと する
 *   → かごを もって 台の うしろへ あるき、台が ぽんと 出る。かごを 台に のせる
 *   → かごから くだものを 1つずつ とって、台の上に ならべる → うれしくて ばんざい
 *   → ほね が ひかって、絵が うすくなり、字「店」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(ひじの 場所は、かた と 手の 長さから 計算)。
 *   くび は みじかく、どう の まんなか の上。あし は こし から。
 *   はしらは まっすぐな 木。字の線に ぴったりでは なくても、場所と 向きは 近づけた。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '店'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const BAND = '#e8534a'
const SHIRT = '#f29a4a'
const SHIRT_DARK = '#d9803a'
const APRON = '#fff6e4'
const PANTS = '#5b6f9a'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const ROOF = '#c4623f'
const ROOF_LIGHT = '#e08b63'
const TABLE_WOOD = '#9a6238'
const TABLE_PANEL = '#b98050'
const TABLE_TOP = '#c99560'
const WICKER = '#d6a15c'
const WICKER_DARK = '#b57f3e'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const SUN = '#ffd24a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const DROP = '#7cc4f2'

/** くぎり の時間(秒) */
const GRAB = 1.2
const PULL = 1.5
const POST_UP = 2.5
const COOL = 2.9
const WALK = 3.1
const ARRIVE = 3.9
const LIFT = 4.4
const SET = 5.0
const CHEER = 7.2
const INK = 7.9
const DONE = 10.9
const DURATION = 11.5

type Pt = readonly [number, number]
const lerp2 = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
const rotate = (p: Pt, deg: number, o: Pt): Pt => {
  const r = (deg * Math.PI) / 180
  const dx = p[0] - o[0]
  const dy = p[1] - o[1]
  return [o[0] + dx * Math.cos(r) - dy * Math.sin(r), o[1] + dx * Math.sin(r) + dy * Math.cos(r)]
}

/** 女の子の たち位置(あるく まえ と、台の うしろ) */
const START_X = 35
const WORK_X = 68
/** かた の高さ と、うで の ほね1本 の長さ */
const SHOULDER_Y = 55
const ARM_PART = 11
const SHOULDER_GAP = 5.2

/** 台の うえの いたの 上の面 */
const TABLE_TOP_Y = 66.6
/** かごの 場所(台の 上) */
const BASKET_SET: Pt = [70, TABLE_TOP_Y - 3.5]
const ITEM_R = 3.1

/** 左の はしら。根もと と てっぺん(3画目の 上と 下を むすぶ、まっすぐな線) */
const POST_BASE: Pt = [22, 88]
const POST_TOP: Pt = [29.5, 29]
const POST_LEAN = -22
const postAngle = (t: number) => mix(t, PULL, POST_UP, POST_LEAN, 0, backOut)
const postPoint = (t: number, u: number): Pt => rotate(lerp2(POST_BASE, POST_TOP, u), postAngle(t), POST_BASE)

/** しなもの 4つ。どの手で、いつ、かごの どこから とって、台の どこへ おくか */
type Item = { readonly arm: 'L' | 'R'; readonly start: number; readonly pick: Pt; readonly slot: Pt; readonly color: string; readonly light: string }
const ITEM_TIME = 0.6
const ITEMS: readonly Item[] = [
  { arm: 'L', start: SET, pick: [66, 59.4], slot: [51.5, TABLE_TOP_Y - ITEM_R], color: '#e8534a', light: '#ff8f85' },
  { arm: 'R', start: SET + ITEM_TIME, pick: [74, 59.4], slot: [78.5, TABLE_TOP_Y - ITEM_R], color: '#ff9a3c', light: '#ffc48a' },
  { arm: 'L', start: SET + ITEM_TIME * 2, pick: [66, 59.4], slot: [44.5, TABLE_TOP_Y - ITEM_R], color: '#b6d44a', light: '#dcec92' },
  { arm: 'R', start: SET + ITEM_TIME * 3, pick: [74, 59.4], slot: [83.8, TABLE_TOP_Y - ITEM_R], color: '#8f6fd0', light: '#bba8ea' },
]

/** かごから とって、はこんで、おいて、手を もどす。この間の 手の 場所(なければ null) */
function reachHand(t: number, item: Item, rest: Pt): Pt | null {
  const { start } = item
  if (t < start || t > start + ITEM_TIME) return null
  const toBasket = span(t, start, start + 0.2, easeOut)
  const carry = span(t, start + 0.2, start + 0.45, easeInOut)
  const back = span(t, start + 0.45, start + ITEM_TIME, easeInOut)
  const lifted = lerp2(item.pick, item.slot, carry)
  const arc: Pt = [lifted[0], lifted[1] - 4 * Math.sin(Math.PI * carry)]
  return lerp2(lerp2(rest, arc, toBasket), rest, back)
}

type Mood = 'hot' | 'ease' | 'glad'

/** かごを もっている間の かごの 中心。さいごに 台の 上へ おく */
function basketCenter(t: number, kx: number): Pt {
  const carried: Pt = [kx + 3.1, 60]
  return lerp2(carried, BASKET_SET, span(t, LIFT, SET - 0.1, easeInOut))
}

/** かごの 手: もっている間は かごの よこ。おいたあとは もどす */
function basketHand(t: number, kx: number): Pt {
  const [cx, cy] = basketCenter(t, kx)
  return [cx + 6.4, cy - 1]
}

function leftHand(t: number, kx: number, stride: number): Pt {
  const rest: Pt = [kx - 6.5 + stride * 3, 72]
  const fan: Pt = [kx - 12 + wave(t, 0.35) * 2.5, 48.5]
  const grab = postPoint(t, 0.45)
  const afterPost = lerp2(lerp2(fan, grab, span(t, GRAB, GRAB + 0.3, easeOut)), rest, span(t, POST_UP, POST_UP + 0.5, easeInOut))
  const placing = ITEMS.filter((item) => item.arm === 'L')
    .map((item) => reachHand(t, item, rest))
    .find((hand) => hand !== null)
  const base = placing ?? afterPost
  return lerp2(base, [kx - 9, 38], span(t, CHEER, CHEER + 0.3, easeOut))
}

function rightHand(t: number, kx: number, stride: number): Pt {
  const rest: Pt = [kx + 7 - stride * 3, 72]
  const holding = t < SET
  const afterBasket = lerp2(basketHand(t, kx), rest, span(t, SET, SET + 0.3, easeInOut))
  const placing = ITEMS.filter((item) => item.arm === 'R')
    .map((item) => reachHand(t, item, rest))
    .find((hand) => hand !== null)
  const base = placing ?? (holding ? basketHand(t, kx) : afterBasket)
  return lerp2(base, [kx + 9, 38], span(t, CHEER, CHEER + 0.3, easeOut))
}

/* ───────── 地面・お日さま ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  // あつい間は お日さまが 赤く ぎらぎら。やねが できると おさまる
  const hot = 1 - span(t, COOL, COOL + 0.6)
  return (
    <>
      <circle cx="13" cy="13" r={9.6 * sun} fill="#ff8a3a" opacity={0.35 * hot * (0.8 + 0.2 * wave(t, 0.5))} />
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 94 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="80" cy="8" rx="6" ry="2.8" />
        <ellipse cx="84.5" cy="6.4" rx="4.4" ry="3" />
        <ellipse cx="96" cy="14" rx="5" ry="2.4" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 98, 103].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
      {/* やねの かげ */}
      <ellipse cx="54" cy="97.6" rx="40" ry="3.8" fill={LEAF_DARK} opacity={0.3 * span(t, COOL - 0.2, COOL + 0.5)} />
    </>
  )
}

/* ───────── おみせの 骨組み ───────── */

/** 左の はしら と、やね。はしらを 立てて、やねを ぱたんと かける */
function Frame({ t }: SceneProps) {
  const appear = span(t, 1.0, 1.25)
  const flap = mix(t, POST_UP - 0.1, WALK, -80, 0, backOut)
  const roofShow = span(t, POST_UP - 0.15, POST_UP)
  return (
    <>
      <Layer opacity={appear} rotate={postAngle(t)} origin={POST_BASE}>
        <line x1={POST_BASE[0]} y1={POST_BASE[1] + 2} x2={POST_TOP[0]} y2={POST_TOP[1]} stroke={BARK} strokeWidth="5" strokeLinecap="round" />
        <line x1={POST_BASE[0] + 1.4} y1={POST_BASE[1]} x2={POST_TOP[0] + 1.2} y2={POST_TOP[1] + 2} stroke={BARK_DARK} strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      </Layer>
      <ellipse cx={POST_BASE[0]} cy="89" rx="5" ry="1.8" fill="#9a9a9a" opacity={appear} />
      <Layer opacity={roofShow} rotate={flap} origin={[27, 27.5]}>
        <Bone char={CHAR} n={2} color={ROOF} width={5.6} />
        <Layer y={-1.5}>
          <Bone char={CHAR} n={2} color={ROOF_LIGHT} width={1.5} opacity={0.8} />
        </Layer>
      </Layer>
    </>
  )
}

/** やねの てっぺんの はた(1画目) */
function Flag({ t }: SceneProps) {
  const pop = span(t, WALK, WALK + 0.4, backOut)
  const flutter = wave(t, 0.7) * 1.1
  return (
    <Layer scale={pop} origin={[58, 24]}>
      <Bone char={CHAR} n={1} color={BARK_DARK} width={2.2} />
      <path d={`M59.4 11.6 Q${64 + flutter} ${11.4 - flutter} 69 ${15 + flutter} Q${64 - flutter} ${16.6 + flutter} 59.4 18.8 Z`} fill={BAND} />
    </Layer>
  )
}

/** まんなかの はしら(4画目)と、ふだを つるす うで(5画目) */
function CenterPost({ t }: SceneProps) {
  const down = span(t, ARRIVE + 0.2, ARRIVE + 0.6, easeOut)
  const out = span(t, ARRIVE + 0.5, ARRIVE + 0.9, backOut)
  const swing = wave(t, 1.6) * 5
  return (
    <>
      <Layer scaleY={down} origin={[58.5, 30]}>
        <Bone char={CHAR} n={4} color={BARK} width={3.8} />
      </Layer>
      <Layer scaleX={out} origin={[59, 49.5]}>
        <Bone char={CHAR} n={5} color={BARK} width={3.2} />
      </Layer>
      <Layer opacity={out} rotate={swing} origin={[84.3, 49.5]}>
        <path d="M84.3 49.6 V52.6" stroke={BARK_DARK} strokeWidth="0.7" />
        <rect x="80.2" y="52.4" width="8.2" height="6.6" rx="1.4" fill={APRON} />
        <circle cx="84.3" cy="55.7" r="1.7" fill={BAND} />
      </Layer>
    </>
  )
}

/* ───────── 台・かご・しなもの ───────── */

/** 台(6・7・8画目)。いたの 上の面は たいらに して、しなものが ういて 見えないようにする */
function Table({ t }: SceneProps) {
  const pop = span(t, ARRIVE, ARRIVE + 0.5, backOut)
  const dust = during(t, ARRIVE + 0.1, ARRIVE + 0.7, 0.15)
  return (
    <>
      <Layer scaleY={pop} scaleX={0.85 + 0.15 * pop} origin={[63, 98]} opacity={span(t, ARRIVE, ARRIVE + 0.1)}>
        <ellipse cx="63" cy="97.6" rx="26" ry="2.6" fill="#000000" opacity="0.1" />
        <path d="M41.6 69 L85.4 69 L82.8 95.4 L45.2 97 Z" fill={TABLE_PANEL} />
        <path d="M43.6 80.4 L84.2 80 M44.4 88.6 L83.4 88.2" stroke={TABLE_WOOD} strokeWidth="0.9" strokeLinecap="round" opacity="0.6" />
        <Bone char={CHAR} n={6} color={TABLE_WOOD} width={4.4} />
        <Bone char={CHAR} n={7} color={TABLE_WOOD} width={4.4} />
        <Bone char={CHAR} n={8} color={TABLE_WOOD} width={4.4} />
        <rect x="40.2" y={TABLE_TOP_Y} width="47" height="3.8" rx="1.6" fill={TABLE_TOP} />
      </Layer>
      <g opacity={dust * 0.8}>
        <ellipse cx="38" cy="96" rx={3 + (1 - dust) * 3} ry="1.8" fill="#ffffff" />
        <ellipse cx="90" cy="96.4" rx={3 + (1 - dust) * 3} ry="1.8" fill="#ffffff" />
      </g>
    </>
  )
}

function Basket({ center }: { readonly center: Pt }) {
  const [cx, cy] = center
  return (
    <>
      <circle cx={cx - 2.6} cy={cy - 3.4} r="2.7" fill="#e8534a" />
      <circle cx={cx + 0.4} cy={cy - 4.2} r="2.8" fill="#ff9a3c" />
      <circle cx={cx + 3.2} cy={cy - 3.2} r="2.6" fill="#b6d44a" />
      <path d={`M${cx - 4} ${cy - 3.4} Q${cx} ${cy - 11} ${cx + 4} ${cy - 3.4}`} fill="none" stroke={WICKER_DARK} strokeWidth="1.1" strokeLinecap="round" />
      <path d={`M${cx - 5.5} ${cy - 2.6} L${cx + 5.5} ${cy - 2.6} L${cx + 4.3} ${cy + 3.4} Q${cx} ${cy + 4.2} ${cx - 4.3} ${cy + 3.4} Z`} fill={WICKER} />
      <path d={`M${cx - 4.8} ${cy + 0.2} H${cx + 4.8} M${cx - 4.4} ${cy + 2.2} H${cx + 4.4}`} stroke={WICKER_DARK} strokeWidth="0.8" strokeLinecap="round" />
    </>
  )
}

function Fruit({ at, item, pop }: { readonly at: Pt; readonly item: Item; readonly pop: number }) {
  const [x, y] = at
  return (
    <Layer scale={1 + 0.22 * pop} origin={[x, y + ITEM_R]} x={0} y={0}>
      <circle cx={x} cy={y} r={ITEM_R} fill={item.color} />
      <circle cx={x - 1.1} cy={y - 1.1} r="0.9" fill={item.light} />
      <path d={`M${x} ${y - ITEM_R} q0.4 -1.2 1.2 -1.6`} fill="none" stroke={BARK_DARK} strokeWidth="0.6" strokeLinecap="round" />
    </Layer>
  )
}

/** 台に ならんだ しなもの(はこんでいる 間は 手の中) */
function Goods({ t, hands }: { readonly t: number; readonly hands: { readonly L: Pt; readonly R: Pt } }) {
  return (
    <>
      {ITEMS.map((item) => {
        if (t < item.start + 0.2) return null
        const carry = span(t, item.start + 0.2, item.start + 0.45, easeInOut)
        const lifted = lerp2(item.pick, item.slot, carry)
        const at: Pt = [lifted[0], lifted[1] - 4 * Math.sin(Math.PI * carry)]
        const pop = Math.sin(Math.PI * span(t, item.start + 0.4, item.start + ITEM_TIME))
        const glint = during(t, item.start + 0.45, item.start + 0.95, 0.1)
        const carrying = t < item.start + 0.45
        const hand = hands[item.arm]
        return (
          <g key={item.start}>
            <Fruit at={at} item={item} pop={pop} />
            {carrying ? <circle cx={hand[0]} cy={hand[1]} r="2.3" fill={SKIN} /> : null}
            {glint > 0 ? (
              <g opacity={glint}>
                <Star cx={item.slot[0] + 3.6} cy={item.slot[1] - 4} r={2.2} color="#ffd95a" spin={t * 120} />
              </g>
            ) : null}
          </g>
        )
      })}
    </>
  )
}

/* ───────── 女の子(おみせの人) ───────── */

type Elbow = { readonly elbow: Pt; readonly hand: Pt }

/** かた と 手の場所から、ひじ を 計算する(ほねは 2本、長さは 同じ)。ひじ は 外がわ・下へ まがる。 */
function solveArm(shoulder: Pt, target: Pt, side: -1 | 1): Elbow {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.min(Math.max(Math.hypot(dx, dy), 4), ARM_PART * 2 - 0.05)
  const angle = Math.atan2(dy, dx)
  const ux = Math.cos(angle)
  const uy = Math.sin(angle)
  const hand: Pt = [shoulder[0] + ux * dist, shoulder[1] + uy * dist]
  const mid: Pt = [shoulder[0] + (ux * dist) / 2, shoulder[1] + (uy * dist) / 2]
  const h = Math.sqrt(Math.max(ARM_PART ** 2 - (dist / 2) ** 2, 0))
  const candidates: readonly Pt[] = [
    [mid[0] - uy * h, mid[1] + ux * h],
    [mid[0] + uy * h, mid[1] - ux * h],
  ]
  const score = (p: Pt) => p[1] + side * (p[0] - shoulder[0]) * 0.6
  const elbow = score(candidates[0]) >= score(candidates[1]) ? candidates[0] : candidates[1]
  return { elbow, hand }
}

function Arm({ shoulder, target, side }: { readonly shoulder: Pt; readonly target: Pt; readonly side: -1 | 1 }) {
  const { elbow, hand } = solveArm(shoulder, target, side)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]}`} stroke={SHIRT_DARK} strokeWidth="4.8" strokeLinecap="round" fill="none" />
      <path d={`M${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} stroke={SKIN} strokeWidth="3.8" strokeLinecap="round" fill="none" />
      <circle cx={hand[0]} cy={hand[1]} r="2.3" fill={SKIN} />
    </>
  )
}

function Face({ kx, mood }: { readonly kx: number; readonly mood: Mood }) {
  const cheek = mood === 'hot' ? 0.85 : 0.55
  return (
    <>
      <circle cx={kx - 4.4} cy="50.2" r="1.8" fill="#ff9d9d" opacity={cheek} />
      <circle cx={kx + 4.4} cy="50.2" r="1.8" fill="#ff9d9d" opacity={cheek} />
      {mood === 'glad' ? (
        <>
          <path d={`M${kx - 4} 47.8 Q${kx - 2.6} 45.4 ${kx - 1.2} 47.8 M${kx + 1.2} 47.8 Q${kx + 2.6} 45.4 ${kx + 4} 47.8`} fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d={`M${kx - 2.6} 49.8 Q${kx} 54.6 ${kx + 2.6} 49.8 Z`} fill={MOUTH} />
        </>
      ) : (
        <>
          <circle cx={kx - 2.6} cy="47.4" r="0.95" fill={EYE} />
          <circle cx={kx + 2.6} cy="47.4" r="0.95" fill={EYE} />
          {mood === 'hot' ? (
            <>
              <path d={`M${kx - 4.4} 45 L${kx - 1.4} 43.8 M${kx + 4.4} 45 L${kx + 1.4} 43.8`} stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
              <ellipse cx={kx} cy="51.2" rx="1.3" ry="1.7" fill={MOUTH} />
            </>
          ) : (
            <path d={`M${kx - 1.8} 50.2 Q${kx} 52.2 ${kx + 1.8} 50.2`} fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
          )}
        </>
      )}
    </>
  )
}

type KeeperProps = {
  readonly kx: number
  readonly by: number
  readonly mood: Mood
  readonly stride: number
  readonly tilt: number
  readonly left: Pt
  readonly right: Pt
}

function Keeper({ kx, by, mood, stride, tilt, left, right }: KeeperProps) {
  const lShoulder: Pt = [kx - SHOULDER_GAP, SHOULDER_Y + by]
  const rShoulder: Pt = [kx + SHOULDER_GAP, SHOULDER_Y + by]
  return (
    <>
      <g transform={`translate(0 ${by})`}>
        {/* あし: こし から ふる */}
        <Layer rotate={stride * 18} origin={[kx - 2.8, 75]}>
          <rect x={kx - 4.9} y="74" width="4.2" height="19.5" rx="2.1" fill={PANTS} />
          <ellipse cx={kx - 2.8} cy="94" rx="3.4" ry="1.8" fill={SHOE} />
        </Layer>
        <Layer rotate={-stride * 18} origin={[kx + 2.8, 75]}>
          <rect x={kx + 0.7} y="74" width="4.2" height="19.5" rx="2.1" fill={PANTS} />
          <ellipse cx={kx + 2.8} cy="94" rx="3.4" ry="1.8" fill={SHOE} />
        </Layer>
        {/* くび は みじかく どう と あたま の間 */}
        <rect x={kx - 1.9} y="51" width="3.8" height="4" rx="1.6" fill={SKIN_SHADE} />
        <rect x={kx - 5.6} y="53.4" width="11.2" height="22" rx="5" fill={SHIRT} />
        <rect x={kx - 4.4} y="62" width="8.8" height="13.4" rx="2.6" fill={APRON} />
      </g>
      <Arm shoulder={lShoulder} target={left} side={-1} />
      <Arm shoulder={rShoulder} target={right} side={1} />
      <g transform={`translate(0 ${by})`}>
        <Layer rotate={tilt} origin={[kx, 53]}>
          <circle cx={kx} cy="46.5" r="6.6" fill={SKIN} />
          <path d={`M${kx - 6.8} 45.4 C${kx - 7.4} 38 ${kx - 3} 36.6 ${kx} 36.6 C${kx + 3} 36.6 ${kx + 7.4} 38 ${kx + 6.8} 45.4 C${kx + 5} 42.2 ${kx + 2} 41 ${kx} 41 C${kx - 2} 41 ${kx - 5} 42.2 ${kx - 6.8} 45.4 Z`} fill={HAIR} />
          <path d={`M${kx - 6.2} 42.4 Q${kx} 39.6 ${kx + 6.2} 42.4`} fill="none" stroke={BAND} strokeWidth="2" strokeLinecap="round" />
          <Face kx={kx} mood={mood} />
        </Layer>
      </g>
    </>
  )
}

/** あつい間の あせ。あたまの よこから とぶ */
function Sweat({ t, kx, by }: { readonly t: number; readonly kx: number; readonly by: number }) {
  const show = during(t, 0.5, POST_UP + 0.3, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.45].map((offset) => {
        const p = ((t + offset) % 0.9) / 0.9
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill={DROP} transform={`translate(${kx + 8.6 + p * 2.6} ${40 + by + p * 9}) rotate(-20)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** うちわ(あおいでいる 間だけ)。手の まわりを ゆらす */
function Fan({ hand, t }: { readonly hand: Pt; readonly t: number }) {
  const show = 1 - span(t, GRAB, GRAB + 0.15)
  if (show <= 0) return null
  return (
    <Layer x={hand[0]} y={hand[1]} rotate={wave(t, 0.35, 0.1) * 22} opacity={show}>
      <rect x="-0.5" y="-5" width="1" height="5" fill={BARK} />
      <circle cx="0" cy="-8.4" r="4.4" fill="#ff7a6b" />
      <path d="M-3.8 -8.4 H3.8 M0 -12.6 V-4.2" stroke="#ffffff" strokeWidth="0.7" opacity="0.8" />
    </Layer>
  )
}

/** やねに 小鳥が とんできて とまる */
function Bird({ t }: SceneProps) {
  const arrive = span(t, SET + 0.2, SET + 1.1, easeOut)
  if (arrive <= 0) return null
  const x = 118 - arrive * 38
  const y = 6 + arrive * 13.2 - Math.sin(arrive * Math.PI) * 8
  const landed = arrive >= 1
  const hop = landed ? Math.abs(wave(t, 0.7)) * 0.9 : 0
  const flap = landed ? 0 : wave(t, 0.16) * 28
  return (
    <Layer x={x} y={y - hop}>
      <path d="M2.6 0.4 l4.6 -1.6 l-3.4 3.2 Z" fill="#e2733f" />
      <ellipse cx="0" cy="0" rx="4" ry="3.1" fill="#ff9a5c" />
      <circle cx="-3" cy="-2.3" r="2.3" fill="#ff9a5c" />
      <path d="M-5 -2.4 l-2.4 0.7 l2.3 0.9 Z" fill="#f2b632" />
      <circle cx="-3.6" cy="-2.8" r="0.55" fill={EYE} />
      <Layer rotate={flap} origin={[0.4, -0.6]}>
        <path d="M-1.2 -0.8 Q1.6 -3.8 4 -0.6 Q1.6 0.8 -1.2 -0.8 Z" fill="#e2733f" />
      </Layer>
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)

  // あるく: はしらの そばから 台の うしろへ。あし を ふって、体が 上下する
  const walking = t >= WALK && t < ARRIVE
  const kx = mix(t, WALK, ARRIVE, START_X, WORK_X)
  const stride = walking ? Math.sin((t - WALK) * Math.PI * 2 * 2.5) : 0
  // ばんざい で、ぴょんと はねる
  const hop = -3 * Math.sin(Math.PI * span(t, CHEER, CHEER + 0.5))
  const by = -Math.abs(stride) * 1.2 + hop
  const mood: Mood = t < COOL ? 'hot' : t < CHEER ? 'ease' : 'glad'
  const tilt = mood === 'hot' ? wave(t, 1.2) * 3 : mood === 'glad' ? wave(t, 0.5) * 4 : 0

  const left = leftHand(t, kx, stride)
  const right = rightHand(t, kx, stride)
  const center = basketCenter(t, kx)
  const popIn = span(t, 0.2, 0.7, backOut)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Frame t={t} />
        <Flag t={t} />
        <CenterPost t={t} />
        <Bird t={t} />
        <Layer scale={popIn} origin={[START_X, 94]} opacity={span(t, 0.2, 0.35)}>
          <Keeper kx={kx} by={by} mood={mood} stride={stride} tilt={tilt} left={left} right={right} />
          <Sweat t={t} kx={kx} by={by} />
          <Fan hand={left} t={t} />
        </Layer>
        <Table t={t} />
        <Layer opacity={span(t, 0.3, 0.5)}>
          <Basket center={center} />
        </Layer>
        <Goods t={t} hands={{ L: left, R: right }} />
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Ink char={CHAR} progress={ink.progress} tint={ink.tint} />
      <Sparkles cx={54.5} cy={52} progress={ink.sparkle} />
    </>
  )
}

const scene: SceneModule = {
  char: CHAR,
  duration: DURATION,
  beats: [
    { at: 0, label: 'あつい 日ざしの 中、かごを もった 女の子', sound: 'pop' },
    { at: PULL, label: 'はしらを ひっぱって 立てる' },
    { at: POST_UP, label: 'やねを かけて、かげで ほっと する', sound: 'pop' },
    { at: WALK, label: 'かごを もって、台の うしろへ あるく' },
    { at: ARRIVE, label: '台が ぽんと 出る。かごを のせる', sound: 'pop' },
    { at: SET, label: 'くだものを 1つずつ ならべる' },
    { at: CHEER, label: 'うれしくて ばんざい' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '店 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
