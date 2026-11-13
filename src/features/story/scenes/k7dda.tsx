/*
 * 線(せん): 糸のように 細く 長く のびる。みぎの いずみは せんの おと。
 *
 * ほね(画と絵の対応)
 *   1〜6画目(糸) … 小ぐもが えだ から たらす 細くて 長い いと(クモの いと)
 *                    4画目(丨) は、クモが 地面に おりきった とき の、まっすぐ たれた いと
 *   7〜11画目(白) … いわの てっぺん から わきだす いずみ(白い しぶき の ところ)
 *   12〜15画目(水) … いずみ から 下へ ながれる みず の すじ と、ひろがる みずたまり
 *
 * ながれ
 *   お日さまが てって、クモは あつくて ぐったり(えだ から ぶらさがっている)
 *   → いわの かげ から「ちょろちょろ」と みずの おと。クモが 耳を すませて、目が ぱっと ひらく
 *   → いとを 細く 長く のばしながら、するする 下へ おりる
 *   → 地面に ついて、いずみの ほうへ あるく(いとは えだ に つながった まま)
 *   → いずみの みずを ごくごく のんで、にっこり ぴょん
 *   → 糸の細い線 と いずみ の 形が ほね として ひかって、絵が うすくなり 字「線」が のこる
 *
 * クモは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   足は 8本(ひだり 4本・みぎ 4本)で、どう から出て ひざ で まがる。いとは おしり(どう の 上)から 出る。
 *   いとは ほそく、おもさで まっすぐ たれる(ゆれるときは、えだ の つけね を じく に ふりこ のように)。
 *   いずみは いわの 上から わき、みずは 下へ ながれて、みずたまり に たまる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '線'

const SUN = '#ffd24a'
const GRASS = '#c5e8a9'
const HILL = '#e2f2d2'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const ROCK = '#aeb1ba'
const ROCK_DARK = '#8f93a0'
const ROCK_LIGHT = '#cfd2d9'
const WATER = '#7cc4f2'
const WATER_DARK = '#56aae6'
const WATER_LIGHT = '#e8f6ff'
const POOL = '#a9d9f7'
const SPIDER = '#7a5aa6'
const SPIDER_DARK = '#5f4488'
const SPIDER_LIGHT = '#9a7cc4'
const THREAD = '#8d97a8'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const HEAR = 1.8
const DESC0 = 2.6
const DESC1 = 4.4
const WALK1 = 5.4
const DRINK1 = 6.5
const INK = 6.9
const DONE = 9.9
const DURATION = 10.4

/** いとの つけね(えだ の下)。4画目(丨) の x と そろえてある */
const ANCHOR: readonly [number, number] = [28.5, 10]
/** クモの 大きさ と、地面に ついた ときの どう の まんなか の高さ(足が y = 96 に とどく) */
const SPIDER_SCALE = 1.15
const GROUND_BODY_Y = 96 - 9.4 * SPIDER_SCALE - 0.8
const HANG_BODY_Y = 27
/** あるいて いく ときの おわりの x(みずたまり の ふち) */
const DRINK_X = 42
/** いずみの わきだす ところ(いわの てっぺん) */
const SPRING: readonly [number, number] = [66, 62]
/** みずたまり の まんなか */
const POOL_AT: readonly [number, number] = [72, 96.4]

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[94, 14]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="93.2" y="2.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 94 14)`} />
        ))}
      </Layer>
      <circle cx="94" cy="14" r={6.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 40 91 Q72 70 113 93 V101 H-4 Z" fill={HILL} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${-((t * 1.4) % 30)} 0)`}>
        <ellipse cx="82" cy="40" rx="6" ry="2.8" />
        <ellipse cx="86.5" cy="38.4" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 20, 46, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 左上の えだ。いとは ここから たれる。 */
function Branch({ t }: SceneProps) {
  const grow = span(t, 0, 0.35, backOut)
  const sway = wave(t, 3.2) * 1.1
  return (
    <Layer scaleX={grow} origin={[-2, 9]}>
      <path d="M-4 9 Q14 6 42 10.5" fill="none" stroke={BARK} strokeWidth="5" strokeLinecap="round" />
      <path d="M8 8.2 Q20 7.6 34 10" fill="none" stroke={BARK_DARK} strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      <Layer rotate={sway} origin={[20, 8]}>
        <circle cx="9" cy="5" r="6" fill={LEAF_DARK} />
        <circle cx="10" cy="3.4" r="4.2" fill={LEAF} />
        <circle cx="38" cy="6.4" r="5.4" fill={LEAF_DARK} />
        <circle cx="39" cy="5" r="3.8" fill={LEAF} />
        <circle cx="22" cy="3.4" r="3.4" fill={LEAF_LIGHT} />
      </Layer>
    </Layer>
  )
}

/** えだ から 1まい、葉が ひらひら おちる(にぎやかし) */
function FallingLeaf({ t }: SceneProps) {
  const p = span(t, 0.7, 3.6)
  if (p <= 0 || p >= 1) return null
  const x = 15 + Math.sin(p * 8) * 4 - p * 3
  const y = 12 + p * 84
  return <path d="M0 -3 Q2.6 0 0 3 Q-2.6 0 0 -3 Z" fill={LEAF_LIGHT} stroke={LEAF_DARK} strokeWidth="0.5" transform={`translate(${x} ${y}) rotate(${Math.sin(p * 8) * 50 + 20})`} />
}

/** いずみ: いわの てっぺん から みずが わき、下へ ながれて みずたまり に たまる。 */
function Spring({ t }: SceneProps) {
  const rise = span(t, 0.1, 0.7, backOut)
  const flow = span(t, 0.5, 1.2, easeOut)
  // みずたまり の わ(しずく が おちる ところ から ひろがる)
  const rings = [0, 0.5].map((offset) => ((t * 0.9 + offset) % 1))
  return (
    <>
      <Layer scale={rise} origin={[74, 98]}>
        <path d="M49 98 Q48 74 60 64 Q68 57 78 60 Q96 66 99 98 Z" fill={ROCK} />
        <path d="M49 98 Q48 84 52 76 Q56 90 64 98 Z" fill={ROCK_DARK} />
        <path d="M80 98 Q92 84 91 70 Q98 80 99 98 Z" fill={ROCK_DARK} />
        <path d="M56 72 Q60 66 67 63 Q62 70 60 78 Z" fill={ROCK_LIGHT} />
        <ellipse cx="80" cy="76" rx="3.4" ry="2" fill={ROCK_DARK} opacity="0.55" />
      </Layer>
      <ellipse cx={POOL_AT[0]} cy={POOL_AT[1]} rx={27 * flow} ry={4.6 * flow} fill={POOL} />
      <ellipse cx={POOL_AT[0] - 2} cy={POOL_AT[1] - 0.8} rx={20 * flow} ry={2.4 * flow} fill="#c6e8fb" />
      {/* わきだす みず と、下へ ながれる すじ(いわの 上から) */}
      <Layer scaleY={flow} origin={SPRING}>
        <path d="M63.4 61 Q69 71 64.2 80 Q62 88 65 96 L70.2 96 Q68 88 70.6 80 Q74.4 71 68.8 61 Z" fill={WATER} />
        <path d="M66.4 64 Q69.6 72 67 80 Q65.6 88 67.4 95" fill="none" stroke={WATER_LIGHT} strokeWidth="1.3" strokeLinecap="round" />
      </Layer>
      <ellipse cx={SPRING[0]} cy={SPRING[1] - 0.4} rx={5.2 * flow} ry={2.6 * flow} fill={WATER} />
      <ellipse cx={SPRING[0] - 1} cy={SPRING[1] - 1} rx={2.4 * flow} ry={1.1 * flow} fill={WATER_LIGHT} />
      {/* ぽこぽこ わく あわ */}
      {flow >= 1 &&
        [0, 0.5].map((offset) => {
          const p = (t * 1.1 + offset) % 1
          return <circle key={offset} cx={SPRING[0] + (offset - 0.25) * 6} cy={SPRING[1] - 1 - p * 5} r={Math.max(0, 1.2 * (1 - p))} fill={WATER_LIGHT} opacity={1 - p} />
        })}
      {flow >= 1 &&
        rings.map((p, i) => <ellipse key={i} cx={67.6} cy={POOL_AT[1] - 0.6} rx={3 + p * 15} ry={0.8 + p * 2.2} fill="none" stroke="#ffffff" strokeWidth="0.7" opacity={(1 - p) * 0.9} />)}
      {[16, 24].map((x, i) => (
        <path key={x} d={`M${x + 56} 97.4 q-1 -5 ${i ? 1.6 : -1.2} -8 M${x + 58} 97.4 q0.6 -4 ${i ? -1 : 1.4} -6.4`} fill="none" stroke={LEAF_DARK} strokeWidth="1.1" strokeLinecap="round" opacity={rise} />
      ))}
    </>
  )
}

/** みずの おと:「ちょろちょろ」が いわ から クモの ほうへ ひろがる。 */
function Sound({ t }: SceneProps) {
  const show = during(t, HEAR - 0.5, DESC0 + 0.9, 0.3)
  if (show <= 0) return null
  const [cx, cy] = [62, 60]
  const rad = (deg: number) => (deg * Math.PI) / 180
  return (
    <g opacity={show} fill="none" stroke="#5aaee8" strokeWidth="1.2" strokeLinecap="round">
      {[0, 1 / 3, 2 / 3].map((offset) => {
        const p = (t * 0.9 + offset) % 1
        const r = 6 + p * 22
        const [a1, a2] = [204, 256]
        const x1 = cx + Math.cos(rad(a1)) * r
        const y1 = cy + Math.sin(rad(a1)) * r
        const x2 = cx + Math.cos(rad(a2)) * r
        const y2 = cy + Math.sin(rad(a2)) * r
        return <path key={offset} d={`M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}`} opacity={Math.sin(p * Math.PI)} />
      })}
    </g>
  )
}

type Mood = 'hot' | 'alert' | 'happy' | 'drink'

type SpiderProps = {
  readonly mood: Mood
  /** 目の 向き(-1 = ひだり、1 = みぎ) と 下を見る度合い */
  readonly look: number
  readonly lookDown: number
  /** 0 = ぶらさがって 足を ちぢめる / 1 = 地面に 立つ */
  readonly stand: number
  /** あるく 足の ふり(0 〜 1)と その 位相 */
  readonly walk: number
  readonly phase: number
  /** ごくごく の くちの あけしめ */
  readonly gulp: number
}

/** 足の 点(どう から ひざ、ひざ から 足さき)。i = まえ(0)〜うしろ(3)、side = -1 左 / 1 右 */
const KNEE_X = [9.5, 12, 12, 9.5] as const
const KNEE_Y = [-7.5, -5, -2.5, 0] as const
const FOOT_X = [13.5, 16, 16.5, 14] as const

function Legs({ stand, walk, phase }: Pick<SpiderProps, 'stand' | 'walk' | 'phase'>) {
  const legs = [-1, 1].flatMap((side) =>
    [0, 1, 2, 3].map((i) => {
      // となりあう 足は 反対に あげる(かわりばんこ)
      const lift = walk * Math.max(0, Math.sin(phase + (i % 2) * Math.PI + (side > 0 ? Math.PI : 0))) * 2
      const footY = mix(stand, 0, 1, 4 + i * 0.6, 9.4) - lift
      const attach = [side * 3.8, -0.5 + i * 1.5] as const
      const knee = [side * KNEE_X[i], KNEE_Y[i]] as const
      const foot = [side * FOOT_X[i], footY] as const
      return <path key={`${side}${i}`} d={`M${attach[0]} ${attach[1]} L${knee[0]} ${knee[1]} L${foot[0]} ${foot[1]}`} />
    }),
  )
  return (
    <g fill="none" stroke={SPIDER_DARK} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {legs}
    </g>
  )
}

function Face({ mood, look, lookDown, gulp }: Pick<SpiderProps, 'mood' | 'look' | 'lookDown' | 'gulp'>) {
  const eyes = [-2.6, 2.6]
  return (
    <>
      <circle cx="-4.2" cy="2.4" r="1.2" fill={CHEEK} opacity="0.55" />
      <circle cx="4.2" cy="2.4" r="1.2" fill={CHEEK} opacity="0.55" />
      {mood === 'happy' ? (
        eyes.map((x) => <path key={x} d={`M${x - 1.5} -0.2 Q${x} -2.4 ${x + 1.5} -0.2`} fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />)
      ) : (
        eyes.map((x) => (
          <g key={x}>
            <circle cx={x} cy="-0.8" r={mood === 'alert' ? 2.2 : 1.9} fill="#ffffff" />
            <circle cx={x + look * 0.7} cy={-0.8 + lookDown * 0.7} r={mood === 'alert' ? 1.2 : 1.0} fill={EYE} />
            {mood === 'hot' && <path d={`M${x - 1.9} -0.8 A1.9 1.9 0 0 1 ${x + 1.9} -0.8 Z`} fill={SPIDER} />}
          </g>
        ))
      )}
      {mood === 'hot' && <path d="M-1.4 3.4 Q0 2.2 1.4 3.4" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />}
      {mood === 'alert' && <ellipse cx={look * 0.5} cy="3" rx="0.9" ry="1.1" fill={MOUTH} />}
      {mood === 'happy' && <path d="M-1.8 2.2 Q0 4.4 1.8 2.2" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />}
      {mood === 'drink' && <ellipse cx="0" cy="3" rx="1.2" ry={0.5 + gulp * 1.1} fill={MOUTH} />}
    </>
  )
}

/** クモ: 足は 8本、いとは どう の 上(おしり)から 出る。 */
function Spider(props: SpiderProps) {
  return (
    <>
      <Legs stand={props.stand} walk={props.walk} phase={props.phase} />
      <circle cx="0" cy="0" r="6.2" fill={SPIDER} />
      <path d="M-5.6 2.6 A6.2 6.2 0 0 0 5.6 2.6 Q0 5.6 -5.6 2.6 Z" fill={SPIDER_DARK} opacity="0.55" />
      <circle cx="-2.6" cy="-3.6" r="2" fill={SPIDER_LIGHT} />
      <Face mood={props.mood} look={props.look} lookDown={props.lookDown} gulp={props.gulp} />
    </>
  )
}

/** あつくて ながれる あせ。クモの あたま から 下へ。 */
function Sweat({ t, x, y }: SceneProps & { readonly x: number; readonly y: number }) {
  const show = during(t, 0.5, HEAR + 0.2, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.5].map((offset) => {
        const p = ((t + offset) % 1)
        return <path key={offset} d="M0 -2.2 Q1.9 0.6 0 1.9 Q-1.9 0.6 0 -2.2 Z" fill={WATER} transform={`translate(${x + 8 + p * 2} ${y - 6 + p * 9})`} opacity={1 - p} />
      })}
    </g>
  )
}

/** 水の しぶき: のんでいる ところ で はねる。 */
function Splash({ t }: SceneProps) {
  const show = during(t, WALK1 + 0.2, DRINK1, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show} fill={WATER} stroke={WATER_DARK} strokeWidth="0.3">
      {[0, 0.4, 0.8].map((offset, i) => {
        const p = ((t * 1.6 + offset) % 1)
        return <circle key={i} cx={50 + i * 3.4 + p * 2} cy={95 - Math.sin(p * Math.PI) * 5} r="0.9" opacity={1 - p * 0.4} />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 15)

  // ぶらさがる → おりる → ついたら あるく。ふりこ: えだの つけね を じく に ゆれる
  const landed = t >= DESC1
  const amp = 3.2 * (1 - span(t, DESC1 - 0.7, DESC1))
  const angle = landed ? 0 : wave(t, 2.2) * amp
  const hangY = HANG_BODY_Y + (t < DESC0 ? wave(t, 1.6) * 0.5 : 0)
  const descended = mix(t, DESC0, DESC1, hangY, GROUND_BODY_Y, easeInOut)
  const bodyBase = t < DESC0 ? hangY : descended
  const hopP = span(t, DRINK1 - 0.1, INK)
  const hop = Math.sin(hopP * Math.PI) * 4
  const crouch = during(t, WALK1 + 0.1, DRINK1 - 0.1, 0.25) * 1.8
  const walkAmt = during(t, DESC1, WALK1, 0.15)
  const phase = (t - DESC1) * 10
  const bob = walkAmt * Math.abs(Math.sin(phase)) * -0.8
  const bodyY = bodyBase + crouch + bob - hop
  const bodyX = landed ? mix(t, DESC1, WALK1, ANCHOR[0], DRINK_X, easeInOut) : ANCHOR[0] + Math.tan((angle * Math.PI) / 180) * (bodyBase - ANCHOR[1])

  const mood: Mood = t < HEAR ? 'hot' : t < DESC1 ? 'alert' : t < WALK1 ? 'happy' : t < DRINK1 - 0.1 ? 'drink' : 'happy'
  const look = t < HEAR ? 0 : 0.9
  const lookDown = t < HEAR ? 0.7 : mood === 'drink' ? 0.9 : 0
  const stand = span(t, DESC1 - 0.6, DESC1, easeOut)
  const gulp = Math.max(0, wave(t, 0.5))

  // うえから クモの どう の 上まで、いとが のびる(おりるほど 長くなる)。あるくときは、すこし たるむ
  const threadEnd = [bodyX, bodyY - 6.2 * SPIDER_SCALE] as const
  const sag = walkAmt > 0 || t >= WALK1 ? 3 : 0
  const mid = [(ANCHOR[0] + threadEnd[0]) / 2, (ANCHOR[1] + threadEnd[1]) / 2 + sag] as const
  const surprise = during(t, HEAR + 0.05, DESC0 + 0.1, 0.2)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Branch t={t} />
        <FallingLeaf t={t} />
        <Spring t={t} />
        <Sound t={t} />
        {/* クモは えだ が のびて から あらわれる */}
        <Layer opacity={span(t, 0.35, 0.7)}>
        <path d={`M${ANCHOR[0]} ${ANCHOR[1]} Q${mid[0]} ${mid[1]} ${threadEnd[0]} ${threadEnd[1]}`} fill="none" stroke={THREAD} strokeWidth="0.9" strokeLinecap="round" />
        <ellipse cx={bodyX} cy="97.4" rx={landed ? 11 : 11 * span(t, DESC0, DESC1)} ry="2.2" fill="#000000" opacity="0.12" />
        {/* のむとき は、みずの ほう(みぎ)へ 少し からだを かたむける */}
        <Layer x={bodyX} y={bodyY} rotate={angle + crouch * 3} scale={SPIDER_SCALE}>
          <Spider mood={mood} look={look} lookDown={lookDown} stand={stand} walk={walkAmt} phase={phase} gulp={gulp} />
        </Layer>
        </Layer>
        <Sweat t={t} x={bodyX} y={bodyY} />
        <Splash t={t} />
        {/* あたまの上に「！」 */}
        <Layer x={bodyX} y={bodyY - 14} scale={backOut(surprise)} origin={[0, 0]} opacity={surprise}>
          <rect x="-0.8" y="-5" width="1.6" height="4.4" rx="0.8" fill="#f2a632" />
          <circle cx="0" cy="1.2" r="1" fill="#f2a632" />
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
    { at: 0, label: 'あつくて ぐったりの クモが えだ から ぶらさがる', sound: 'pop' },
    { at: HEAR, label: 'いずみの おとが きこえる', sound: 'pop' },
    { at: DESC0, label: 'いとを 細く 長く のばして おりる' },
    { at: DESC1, label: 'いずみの ほうへ あるく', sound: 'pop' },
    { at: WALK1, label: 'みずを ごくごく のむ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '線 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
