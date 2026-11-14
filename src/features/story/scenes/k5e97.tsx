/*
 * 店(みせ): やねの 下に、しなものを ならべる おみせ。(共通部品 sceneFigures で 書きなおした)
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
 * 人は Person。あるきは walk、むきは turnAround(正面 → 右 → 正面)。
 * 台・かご・くだものは Person の held に わたす(どう の まえ、手の うしろ)ので、手が 台の 上に のる。
 * うでは 手の さきの 点 で 指定する({ to, depth })。とどく ように、しなものは 女の子の 近くへ ならべる。
 * まえかけ(エプロン)・はちまき は 場面で 描く(held・headwear)。うちわ は 手に もたせて 場面で 描く。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, Basket, Bird, HANG_ARM, LOOKS, mixLimb, PALETTE, Person, personRig, posture, Sweat, turnAround, walk, type Limb, type PersonProps } from '../sceneFigures'

const CHAR = '店'

const BAND = '#e8534a'
const APRON = '#fff6e4'
const BARK = PALETTE.bark
const BARK_DARK = '#70452b'
const ROOF = '#c4623f'
const ROOF_LIGHT = '#e08b63'
const TABLE_WOOD = '#9a6238'
const TABLE_PANEL = '#b98050'
const TABLE_TOP = '#c99560'
const LEAF_DARK = '#3f9c59'
const GIRL_LOOK = { ...LOOKS.girl, hairStyle: 'bob', top: '#f29a4a', bottom: '#5b6f9a', bottomKind: 'pants' } as const

/** くぎり の時間(秒) */
const GRAB = 1.2
const PULL = 1.5
const POST_UP = 2.5
const COOL = 2.9
const WALK = 3.1
const ARRIVE = 3.9
const LIFT = 4.0
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

/** 女の子の たち位置(あるく まえ と、台の うしろ)と 大きさ */
const START_X = 35
const WORK_X = 70
const GROUND = 96
const GIRL = { build: 'child', height: 63 } as const
/** うでを まえへ のばす きょり(台の 上に 手を おく) */
const REACH = 4

/** 台の うえの いたの 上の面 */
const TABLE_TOP_Y = 66.6
/** かごの 場所(台の 上) */
const BASKET_SET: Pt = [WORK_X, TABLE_TOP_Y - 3.5]
/** かご を ぶらさげる とき、手(とって)から かごの まんなか まで */
const HANDLE_DROP = 7.5
const ITEM_R = 3.1

/** 左の はしら。根もと と てっぺん(3画目の 上と 下を むすぶ、まっすぐな線) */
const POST_BASE: Pt = [22, 88]
const POST_TOP: Pt = [29.5, 29]
const POST_LEAN = -22
const postAngle = (t: number) => mix(t, PULL, POST_UP, POST_LEAN, 0, backOut)
const postPoint = (t: number, u: number): Pt => rotate(lerp2(POST_BASE, POST_TOP, u), postAngle(t), POST_BASE)

/**
 * しなもの 4つ。どちらの 手(画面の L = 左・R = 右)で、いつ、かごの どこから とって、台の どこへ おくか。
 * 手が とどく よう、女の子の すぐ そばへ ならべる。
 */
type Item = { readonly side: 'L' | 'R'; readonly start: number; readonly pick: Pt; readonly slot: Pt; readonly color: string; readonly light: string }
const ITEM_TIME = 0.6
const ITEMS: readonly Item[] = [
  { side: 'L', start: SET, pick: [66, 59.4], slot: [57, TABLE_TOP_Y - ITEM_R], color: '#e8534a', light: '#ff8f85' },
  { side: 'R', start: SET + ITEM_TIME, pick: [74, 59.4], slot: [81, TABLE_TOP_Y - ITEM_R], color: '#ff9a3c', light: '#ffc48a' },
  { side: 'L', start: SET + ITEM_TIME * 2, pick: [66, 59.4], slot: [51.5, TABLE_TOP_Y - ITEM_R], color: '#b6d44a', light: '#dcec92' },
  { side: 'R', start: SET + ITEM_TIME * 3, pick: [74, 59.4], slot: [85.5, TABLE_TOP_Y - ITEM_R], color: '#8f6fd0', light: '#bba8ea' },
]

/** しなものの いま の 場所: かごの 中 → はこぶ(ふわっと 上へ)→ 台の 上 */
function itemAt(t: number, item: Item): Pt {
  const carry = span(t, item.start + 0.2, item.start + 0.45, easeInOut)
  const lifted = lerp2(item.pick, item.slot, carry)
  return [lifted[0], lifted[1] - 4 * Math.sin(Math.PI * carry)]
}

/** その うでが しなものを はこんでいる 間(0〜1)と、手の ねらう 点 */
function itemReach(t: number, side: 'L' | 'R'): { readonly w: number; readonly to: Pt } {
  const item = ITEMS.find((it) => it.side === side && t >= it.start - 0.15 && t <= it.start + ITEM_TIME + 0.1)
  if (!item) return { w: 0, to: [0, 0] }
  const w = span(t, item.start - 0.15, item.start + 0.1) * (1 - span(t, item.start + 0.45, item.start + ITEM_TIME + 0.1))
  const at = t < item.start + 0.2 ? item.pick : itemAt(t, item)
  return { w, to: [at[0], at[1] + 1.5] }
}

/* ───────── 女の子 ───────── */

const HANG_L: Limb = { swing: 10, bend: 8 }
const BANZAI = posture('banzai', 'front')

/** 体の ばしょ・むき(うでの ポーズ は 入れない) */
function keeperBase(t: number): PersonProps {
  const walking = walk(t, { from: START_X, to: WORK_X, start: WALK, end: ARRIVE - 0.05, ...GIRL, step: GIRL.height * 0.42 })
  const turn = t < ARRIVE ? turnAround(t, WALK - 0.3, 'front', 'right') : turnAround(t, ARRIVE, 'right', 'front')
  const cheer = span(t, CHEER, CHEER + 0.3, easeOut)
  const hop = Math.sin(span(t, CHEER, CHEER + 0.5) * Math.PI) * 3
  const mood = t < COOL ? 'worried' : t < CHEER ? 'smile' : 'joy'
  return { x: walking.x, y: GROUND, ...GIRL, ...turn, look: GIRL_LOOK, face: mood, lift: hop * cheer, pose: walking.pose }
}

/** かごを ぶらさげた 手(左手)の さきの すこし 下 = かごの まんなか */
function carriedBasket(base: PersonProps): Pt {
  const hand = personRig({ ...base, pose: { ...base.pose, leftArm: HANG_L } }).world.arms.left.end
  return [hand[0], hand[1] + HANDLE_DROP]
}

/** かごの まんなか: ぶらさげて はこぶ → 台の 上へ もちあげる */
function basketCenter(t: number): Pt {
  const lifted = lerp2(carriedBasket(keeperBase(LIFT)), BASKET_SET, span(t, LIFT, SET - 0.1, easeInOut))
  return t < LIFT ? carriedBasket(keeperBase(t)) : lifted
}

function keeperAt(t: number): PersonProps {
  const base = keeperBase(t)
  const rig = personRig({ ...base, pose: {} })
  const shoulderR = rig.world.arms.right.root
  const center = basketCenter(t)
  const shoulderL = rig.world.arms.left.root
  // 台が できたら、手は 台の 上に おく(たらした うで が 台の まえに 出ない ように)
  const onTable = (shoulder: Pt, dx: number): Limb => ({ to: [shoulder[0] + dx, TABLE_TOP_Y - 1], depth: REACH })
  const tableRest = span(t, ARRIVE + 0.2, ARRIVE + 0.5, easeInOut)
  const walkArm = mixLimb(base.pose?.rightArm ?? HANG_ARM, onTable(shoulderR, -4), tableRest)

  // 画面の 左の 手(人の 右手): うちわ → はしらを つかんで ひく → おろす → しなものを ならべる → ばんざい
  const fan: Limb = { to: [shoulderR[0] - 7 + wave(t, 0.35) * 2.5, 48.5] }
  const grab: Limb = { to: postPoint(t, 0.45) }
  const afterPost = mixLimb(mixLimb(fan, grab, span(t, GRAB, GRAB + 0.3, easeOut)), walkArm, span(t, POST_UP, POST_UP + 0.5, easeInOut))
  const left = itemReach(t, 'L')
  const right = mixLimb(afterPost, { to: left.to, depth: REACH }, left.w)

  // 画面の 右の 手(人の 左手): かごを ぶらさげる → もちあげる → しなものを ならべる
  const lifted: Limb = { to: [center[0] + 6.5, center[1] - 1], depth: REACH }
  const hold = mixLimb(mixLimb(HANG_L, lifted, span(t, LIFT - 0.1, LIFT + 0.2)), onTable(shoulderL, 4), span(t, SET, SET + 0.3, easeInOut))
  const rightSide = itemReach(t, 'R')
  const leftArm = mixLimb(hold, { to: rightSide.to, depth: REACH }, rightSide.w)

  const cheer = span(t, CHEER + 0.05, CHEER + 0.35, easeOut)
  const pose = { ...base.pose, rightArm: mixLimb(right, BANZAI.rightArm ?? HANG_ARM, cheer), leftArm: mixLimb(leftArm, BANZAI.leftArm ?? HANG_ARM, cheer), head: t >= CHEER ? wave(t, 0.5) * 4 : 0 }
  return { ...base, pose }
}

/** はちまき(あたまの まんなか が 0,0、半径 1) */
function Headband() {
  return <path d="M-0.95 -0.28 Q0 -0.95 0.95 -0.28" fill="none" stroke={BAND} strokeWidth="0.17" strokeLinecap="round" />
}

/** まえかけ。むね から ひざの すこし 上まで。横むき の とき は 体の まえに うすく */
function Apron({ rig, facing, squash }: { readonly rig: ReturnType<typeof personRig>; readonly facing: PersonProps['facing']; readonly squash: number }) {
  const { world, body, scale } = rig
  const front = facing === 'front'
  const width = (front ? body.torsoFrontW * 0.74 : body.torsoW * 0.32) * scale * (front ? squash : 1)
  const x = world.pelvis[0] + (front ? 0 : (facing === 'left' ? -1 : 1) * body.torsoW * 0.34 * scale)
  const top = world.pelvis[1] - body.torso * 0.5 * scale
  return <rect x={x - width / 2} y={top} width={width} height={body.torso * 0.5 * scale + body.thigh * 0.45 * scale} rx={1.6} fill={APRON} />
}

/* ───────── 地面・お日さま ───────── */

/** あつい間は お日さまが 赤く ぎらぎら。やねが できると おさまる */
function HotSun({ t }: SceneProps) {
  const hot = 1 - span(t, COOL, COOL + 0.6)
  return <circle cx="13" cy="13" r="9.6" fill="#ff8a3a" opacity={0.35 * hot * (0.8 + 0.2 * wave(t, 0.5))} />
}

/** やねの かげ */
function RoofShade({ t }: SceneProps) {
  return <ellipse cx="54" cy="97.6" rx="40" ry="3.8" fill={LEAF_DARK} opacity={0.3 * span(t, COOL - 0.2, COOL + 0.5)} />
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

/* ───────── 台・しなもの(女の子の held) ───────── */

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

/** 台に ならんだ しなもの(はこんでいる 間は 手の 先) */
function Goods({ t }: SceneProps) {
  return (
    <>
      {ITEMS.map((item) => {
        if (t < item.start + 0.2) return null
        const [x, y] = itemAt(t, item)
        const pop = Math.sin(Math.PI * span(t, item.start + 0.4, item.start + ITEM_TIME))
        const glint = during(t, item.start + 0.45, item.start + 0.95, 0.1)
        return (
          <g key={item.start}>
            <Layer scale={1 + 0.22 * pop} origin={[x, y + ITEM_R]}>
              <circle cx={x} cy={y} r={ITEM_R} fill={item.color} />
              <circle cx={x - 1.1} cy={y - 1.1} r="0.9" fill={item.light} />
              <path d={`M${x} ${y - ITEM_R} q0.4 -1.2 1.2 -1.6`} fill="none" stroke={BARK_DARK} strokeWidth="0.6" strokeLinecap="round" />
            </Layer>
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

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)
  const girl = keeperAt(t)
  const rig = personRig(girl)
  const head = rig.world.head
  const popIn = span(t, 0.2, 0.7, backOut)
  const center = basketCenter(t)
  // やねに 小鳥が とんできて とまる
  const arrive = span(t, SET + 0.2, SET + 1.1, easeOut)

  const held = (
    <>
      <Apron rig={rig} facing={girl.facing} squash={girl.squash ?? 1} />
      <Layer opacity={span(t, 0.3, 0.5)}>
        <Basket x={center[0]} y={center[1]} width={11} items={['#e8534a', '#ff9a3c', '#b6d44a']} />
      </Layer>
      <Table t={t} />
      <Goods t={t} />
    </>
  )

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[13, 13]} clouds={[[84, 7, 0.8], [98, 14, 0.6]]} tufts={[6, 98, 103]} />
        <HotSun t={t} />
        <RoofShade t={t} />
        <Frame t={t} />
        <Flag t={t} />
        <CenterPost t={t} />
        {arrive > 0 ? <Bird x={118 - arrive * 38} y={6 + arrive * 13.2 - Math.sin(arrive * Math.PI) * 8 - (arrive >= 1 ? Math.abs(wave(t, 0.7)) * 0.9 : 0)} t={t} flying={arrive < 1} facing="left" /> : null}
        <Layer scale={popIn} origin={[START_X, GROUND]} opacity={span(t, 0.2, 0.35)}>
          <Person {...girl} headwear={<Headband />} held={held} />
          <Sweat t={t} x={head[0] + 8} y={head[1] - 2} show={during(t, 0.5, POST_UP + 0.3, 0.3)} dir={1} />
          <Fan hand={rig.world.arms.right.end} t={t} />
        </Layer>
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
