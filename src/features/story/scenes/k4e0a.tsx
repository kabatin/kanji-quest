/*
 * 上(うえ): 地面の 上に、しるしを つける。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … 地面に 立った 高い ぼう(てっぺんは 金色の たま)
 *   2画目(一)  … ぼうの 高いところに むすんだ、風に ゆれる 赤いリボン(しるし)
 *   3画目(一)  … 地面(よこせん)。くさの おびが 土の いちばん上に のっている
 *
 * ながれ
 *   地面が できて、ぼうが すっと 立つ
 *   → リボンを もった 子が あるいてくる(にこにこ)
 *   → ぼうの てっぺんの ほうに リボンを むすびたい。見あげる → せのびしても とどかない(しょんぼり)
 *   → しゃがんで、ぴょーんと ジャンプ。とどいた ところで リボンを きゅっと むすぶ
 *   → ちゃくち。リボンが 風に ゆれて、子は 大よろこび
 *   → ほね が ひかって、絵が うすくなり、字「上」が のこる
 *
 * 子は、ほんものの 人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(かたと手の いちから ひじを きめる)。
 *   くび は みじかく、どう の まんなかの 上。リボンが とどく たかさは、ジャンプの たかさで せつめいする。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '上'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#f6a54a'
const SHIRT_DARK = '#dd8a30'
const SHIRT_FAR = '#c27a2a'
const PANTS = '#4a6fa5'
const PANTS_DARK = '#3d5d8f'
const SHOE = '#6b4a36'
const POLE = '#a8744a'
const GOLD = '#ffd24a'
const RIBBON = '#e8534a'
const RIBBON_DARK = '#c9403a'
const SOIL = '#b98a5e'
const SOIL_DARK = '#9c6f47'
const GRASS_TOP = '#55b86e'
const GRASS_LIGHT = '#8bd69a'
const HILL = '#e2f2d2'
const SUN = '#ffd24a'
const HEART = '#f07f9e'

/** くぎり の時間(秒) */
const WALK = 0.8
const LOOK = 2.3
const TRY = 2.95
const FAIL = 3.6
const CROUCH = 4.1
const LEAP = 4.3
const LAND = 5.05
const PEAK = (LEAP + LAND) / 2
const INK = 6.6
const DONE = 9.2
const DURATION = 9.8

/** 地面の たかさ(3画目の よこせん)と、子が たつ ばしょ */
const GROUND_Y = 87
const STAND_X = 42
/** 子の 大きさ(あしもと を じく に 大きくする) */
const KID = 1.1
/** ぼうの よこ(1画目) と、リボンを むすぶ たかさ(2画目の はじまり) */
const POLE_X = 54.3
const KNOT_Y = 44.7
/** ジャンプの たかさ: て が ぼうの KNOT_Y に とどく */
const JUMP_HEIGHT = 12

/** 子の 体の ながさ(あしもと が 0。上が マイナス) */
const SHOULDER: readonly [number, number] = [0.5, -20.5]
const ARM_PART = 6.4
const HIP: readonly [number, number] = [0, -10]

type Vec = readonly [number, number]
const lerpV = (a: Vec, b: Vec, k: number): Vec => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/** かた から見た 手の ずれ(右・下が プラス)を めざして、ひじ で まがる うで。とどかないときは のばしきる。 */
function armPoints(target: Vec): { readonly elbow: Vec; readonly hand: Vec } {
  const dx = target[0]
  const dy = target[1]
  const dist = Math.max(Math.hypot(dx, dy), 0.001)
  const reach = Math.min(dist, ARM_PART * 2 - 0.05)
  const ux = dx / dist
  const uy = dy / dist
  const hand: Vec = [SHOULDER[0] + ux * reach, SHOULDER[1] + uy * reach]
  const bendOut = Math.sqrt(Math.max(ARM_PART * ARM_PART - (reach / 2) ** 2, 0))
  // ひじは、かた と 手 を むすぶ線の「うしろ・下がわ」に でる
  const elbow: Vec = [SHOULDER[0] + ux * (reach / 2) - uy * bendOut, SHOULDER[1] + uy * (reach / 2) + ux * bendOut]
  return { elbow, hand }
}

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  const rise = span(t, 0, 0.55, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun} fill={SUN} />
      {/* ゆっくり ながれる 雲(おくゆき を出す) */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="-4" cy="30" rx="7" ry="3.4" />
        <ellipse cx="1" cy="28" rx="5" ry="3.4" />
        <ellipse cx="92" cy="22" rx="6" ry="2.8" />
        <ellipse cx="96.5" cy="20.4" rx="4.4" ry="3" />
      </g>
      <Layer y={(1 - rise) * 26}>
        <path d="M-4 88 Q18 70 44 80 Q74 66 113 82 V90 H-4 Z" fill={HILL} />
        {/* 土: 3画目の よこせん が いちばん上 */}
        <rect x="-4" y={GROUND_Y} width="117" height="30" fill={SOIL} />
        <path d="M6 99 q3 -2 6 0 M40 104 q3 -2 6 0 M78 98 q3 -2 6 0 M96 106 q3 -2 6 0" fill="none" stroke={SOIL_DARK} strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="26" cy="102" r="2" fill={SOIL_DARK} />
        <circle cx="68" cy="106" r="2.4" fill={SOIL_DARK} />
        {/* 地面の くさ の おび(画の線に のせる) */}
        <path d={`M-4 ${GROUND_Y} H113`} stroke={GRASS_TOP} strokeWidth="5.4" strokeLinecap="round" />
        <Bone char={CHAR} n={3} color={GRASS_TOP} width={5.4} />
        {[8, 30, 68, 90, 104].map((x) => (
          <path key={x} d={`M${x} ${GROUND_Y - 2} l1.2 -3.2 l1 2.8 l1.5 -3.8 l0.8 4.2 Z`} fill={GRASS_LIGHT} />
        ))}
      </Layer>
    </>
  )
}

function Pole({ t }: SceneProps) {
  // ぼうが 地面から すっと のびて、てっぺんの たまが ぽん と出る
  const grow = span(t, 0.2, 0.85, backOut)
  return (
    <Layer scaleY={grow} origin={[POLE_X, GROUND_Y]}>
      <Bone char={CHAR} n={1} color={POLE} width={3.4} />
      <ellipse cx={POLE_X} cy={GROUND_Y - 0.6} rx="4.4" ry="1.6" fill={SOIL_DARK} />
      <circle cx="52.5" cy="15.4" r="3.2" fill={GOLD} />
      <circle cx="51.6" cy="14.4" r="1.1" fill="#fff3b8" />
    </Layer>
  )
}

/** ぼうに むすんだ リボン(2画目の線の まわり)。むすんだ しゅんかん から のびて、風に ゆれる。 */
function Ribbon({ t }: SceneProps) {
  const grow = span(t, PEAK, PEAK + 0.7, backOut)
  if (grow <= 0) return null
  const length = 26.2 * grow
  const calm = 1 - 0.75 * span(t, INK - 0.7, INK)
  const steps = 14
  const centers = Array.from({ length: steps + 1 }, (_, i) => {
    const s = i / steps
    const x = POLE_X + length * s
    const y = KNOT_Y - (x - 58) * 0.133 + 1.8 * calm * s ** 1.2 * Math.sin(s * 5.5 - t * 7)
    const half = 2.5 * (1 - 0.15 * s)
    return { x, top: y - half, bottom: y + half, y }
  })
  const topEdge = centers.map((c) => `${c.x.toFixed(2)} ${c.top.toFixed(2)}`)
  const bottomEdge = [...centers].reverse().map((c) => `${c.x.toFixed(2)} ${c.bottom.toFixed(2)}`)
  const end = centers[steps]
  // さきっぽは ツバメの おのように 切れこみ
  const notch = `${(end.x - 3.4).toFixed(2)} ${end.y.toFixed(2)}`
  const d = `M${topEdge.join(' L')} L${notch} L${bottomEdge.join(' L')} Z`
  const lower = centers.map((c) => `${c.x.toFixed(2)} ${(c.y + 0.2).toFixed(2)}`)
  const lowerBottom = [...centers].reverse().map((c) => `${c.x.toFixed(2)} ${c.bottom.toFixed(2)}`)
  return (
    <>
      <path d={d} fill={RIBBON} stroke={RIBBON} strokeWidth="0.6" strokeLinejoin="round" />
      <path d={`M${lower.join(' L')} L${lowerBottom.join(' L')} Z`} fill={RIBBON_DARK} opacity="0.55" />
      <circle cx={POLE_X + 0.6} cy={KNOT_Y} r="2" fill={RIBBON_DARK} />
    </>
  )
}

type Mood = 'smile' | 'wonder' | 'sad' | 'happy'

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="1.4" cy="2.4" r="1.3" fill="#ff9d9d" opacity="0.55" />
      {mood === 'smile' && (
        <>
          <circle cx="2.9" cy="-0.2" r="1" fill="#2b2b2b" />
          <path d="M2.6 2.5 Q4 3.9 5.2 2.3" fill="none" stroke="#b9483f" strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'wonder' && (
        <>
          <circle cx="2.9" cy="-0.4" r="1.3" fill="#2b2b2b" />
          <circle cx="3.3" cy="-0.8" r="0.4" fill="#ffffff" />
          <ellipse cx="4.2" cy="3.1" rx="0.9" ry="1.2" fill="#b9483f" />
        </>
      )}
      {mood === 'sad' && (
        <>
          <path d="M1.4 -2.7 L4.2 -1.8" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <circle cx="2.9" cy="-0.1" r="1" fill="#2b2b2b" />
          <path d="M2.8 3.9 Q4 2.5 5.2 3.9" fill="none" stroke="#b9483f" strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M1.7 0.2 Q2.9 -1.5 4.1 0.2" fill="none" stroke="#2b2b2b" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M2.6 2.4 Q4 4.8 5.2 2.4 Z" fill="#b9483f" />
        </>
      )}
    </>
  )
}

type ChildProps = {
  readonly step: number
  readonly mood: Mood
  /** かたから見た、手の ばしょ(てまえの うで・むこうの うで) */
  readonly nearTarget: Vec
  readonly farTarget: Vec
  readonly headTilt: number
  /** リボンを 手に もっている こさ(0〜1)と ゆれ */
  readonly holding: number
  readonly sway: number
}

function Child({ step, mood, nearTarget, farTarget, headTilt, holding, sway }: ChildProps) {
  const near = armPoints(nearTarget)
  const far = armPoints(farTarget)
  return (
    <>
      {/* むこうの うで: 体の うしろに かくれる */}
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${far.elbow[0]} ${far.elbow[1]} L${far.hand[0]} ${far.hand[1]}`} fill="none" stroke={SHIRT_FAR} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={far.hand[0]} cy={far.hand[1]} r="2" fill={SKIN_SHADE} />
      {/* あし: あるくとき かわりばんこに ふる(こしが じく) */}
      <Layer rotate={step * 20} origin={HIP}>
        <rect x="-1.2" y="-11" width="3.4" height="10" rx="1.7" fill={PANTS_DARK} />
        <ellipse cx="1.6" cy="-0.9" rx="3" ry="1.5" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 20} origin={HIP}>
        <rect x="-2.2" y="-11" width="3.6" height="10" rx="1.8" fill={PANTS} />
        <ellipse cx="0.8" cy="-0.9" rx="3.2" ry="1.6" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう と あたま の間 */}
      <rect x="-0.7" y="-25" width="2.4" height="4" rx="1.1" fill={SKIN_SHADE} />
      {/* どう */}
      <rect x="-4" y="-22" width="8" height="12.4" rx="3.4" fill={SHIRT} />
      <path d="M-3 -13.4 h6" stroke={SHIRT_DARK} strokeWidth="1.2" strokeLinecap="round" />
      {/* てまえの うで */}
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${near.elbow[0]} ${near.elbow[1]} L${near.hand[0]} ${near.hand[1]}`} fill="none" stroke={SHIRT_DARK} strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={near.hand[0]} cy={near.hand[1]} r="2.1" fill={SKIN} />
      {/* 手に もった リボン(むすぶまで) */}
      {holding > 0 && (
        <Layer x={near.hand[0]} y={near.hand[1]} rotate={sway} opacity={holding}>
          <path d="M-1.1 0 L1.1 0 L1.3 6.4 L0 5 L-1.3 6.4 Z" fill={RIBBON} />
        </Layer>
      )}
      {/* あたま: 右むき。くびを じく に 上を むく */}
      <Layer rotate={headTilt} origin={[0.5, -24]}>
        <g transform="translate(0.8 -28.5)">
          <circle cx="0" cy="0" r="5.6" fill={SKIN} />
          <path d="M-5.6 0.4 C-6.4 -5.8 -1.5 -8 2.6 -6.6 C5.6 -5.6 6 -2.4 5.4 -0.8 C3.6 -3.2 0.4 -3.6 -2 -2.8 C-3.6 -2.2 -4.8 -1 -5.6 0.4 Z" fill={HAIR} />
          <path d="M-1 -6.6 Q-1.6 -9.4 0.6 -8 Q1.6 -10 2.6 -7.4" fill="none" stroke={HAIR} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <Face mood={mood} />
        </g>
      </Layer>
    </>
  )
}

/** しっぱいの あせ。あたまの よこから ぽたり。 */
function SweatDrop({ t, x, y }: SceneProps & { readonly x: number; readonly y: number }) {
  const show = during(t, FAIL - 0.1, CROUCH, 0.2)
  if (show <= 0) return null
  const p = span(t, FAIL - 0.1, CROUCH)
  return <path d="M0 -2.2 Q1.8 0.6 0 1.8 Q-1.8 0.6 0 -2.2 Z" fill="#7cc4f2" opacity={show} transform={`translate(${x - 6} ${y - 36 + p * 6})`} />
}

/** よろこびの ハート。あたまの上へ ふわっと のぼる。 */
function Hearts({ t, x }: SceneProps & { readonly x: number }) {
  const show = during(t, LAND + 0.25, INK + 0.2, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.5, 1.0].map((offset, i) => {
        const p = ((t - LAND + offset) % 1.5) / 1.5
        return <path key={offset} d="M0 1.4 C-3 -1 -1.6 -3.2 0 -1.6 C1.6 -3.2 3 -1 0 1.4 Z" fill={HEART} opacity={Math.sin(p * Math.PI)} transform={`translate(${x - 8 + i * 6 + Math.sin(p * 6 + i) * 1.2} ${GROUND_Y - 40 - p * 12}) scale(${0.9 + i * 0.15})`} />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 3)

  // あるく: 左から ぼうの そばまで。つくころには あしを そろえる
  const arrive = LOOK
  const stride = t < WALK || t > arrive ? 0 : Math.sin((t - WALK) * Math.PI * 2 * 2) * (1 - span(t, arrive - 0.35, arrive))
  const bodyX = mix(t, WALK, arrive, -10, STAND_X, (x) => 1 - (1 - x) ** 1.4)
  const bob = -Math.abs(stride) * 0.8

  // せのび(とどかない)→ しゃがむ → ジャンプ → ちゃくち → よろこんで はねる
  const tiptoe = 1.5 * span(t, TRY, TRY + 0.3) * (1 - span(t, FAIL, FAIL + 0.2))
  const squash = 0.14 * (span(t, CROUCH, LEAP - 0.05, easeInOut) - span(t, LEAP - 0.05, LEAP + 0.1)) + 0.06 * Math.sin(span(t, LAND, LAND + 0.25) * Math.PI)
  const airborne = Math.sin(span(t, LEAP, LAND) * Math.PI)
  const jump = JUMP_HEIGHT * airborne
  const cheerHop = 2.2 * Math.abs(Math.sin(span(t, LAND + 0.3, LAND + 1.5) * Math.PI * 3)) * (1 - span(t, LAND + 1.0, LAND + 1.5))
  const lift = jump + tiptoe + cheerHop
  const originY = GROUND_Y - lift

  // てまえの うで の 手の ばしょ(かた から の ずれ)
  const hang: Vec = [stride * 4, 11.6]
  const look: Vec = [3, 11]
  const stretch: Vec = [8.5, -9]
  const cheer: Vec = [8, -9.5]
  let nearTarget = lerpV(hang, look, span(t, LOOK, LOOK + 0.4))
  nearTarget = lerpV(nearTarget, stretch, span(t, TRY, TRY + 0.3))
  // しっぱいして、うで が だらんと おちる
  nearTarget = lerpV(nearTarget, [2, 11], span(t, FAIL, FAIL + 0.3))
  // ジャンプで ぼうの 結び目を めざす(世界の ばしょ → いまの 子の ばしょ から見た ずれ)
  const knot: Vec = [(POLE_X - 1 - bodyX) / KID - SHOULDER[0], (KNOT_Y - originY) / KID - SHOULDER[1]]
  nearTarget = lerpV(nearTarget, knot, span(t, LEAP, PEAK, easeOut))
  nearTarget = lerpV(nearTarget, cheer, span(t, PEAK + 0.15, LAND + 0.2))
  const farHang: Vec = [-stride * 4, 11.6]
  const farCheer: Vec = [4.5, -11]
  let farTarget = lerpV(farHang, [1, 11], span(t, LOOK, LOOK + 0.3))
  farTarget = lerpV(farTarget, [-1.5, 9], span(t, CROUCH, LEAP))
  farTarget = lerpV(farTarget, [3, -8], span(t, LEAP, PEAK))
  farTarget = lerpV(farTarget, farCheer, span(t, PEAK + 0.15, LAND + 0.2))

  const mood: Mood = t < LOOK ? 'smile' : t < FAIL ? 'wonder' : t < PEAK - 0.15 ? 'sad' : 'happy'
  const sad = span(t, FAIL, FAIL + 0.3) * (1 - span(t, CROUCH, CROUCH + 0.2))
  // 見あげる(うしろへ かたむける)。しょんぼりのときは うつむく
  const headTilt = -14 * span(t, LOOK, LOOK + 0.4) * (1 - span(t, FAIL, FAIL + 0.3)) + 8 * sad - 8 * span(t, LEAP, PEAK) * (1 - span(t, PEAK + 0.2, LAND))
  const holding = 1 - span(t, PEAK - 0.05, PEAK + 0.15)
  const sway = stride * 20 + wave(t, 0.5) * 8

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Pole t={t} />
        <Ribbon t={t} />
        <ellipse cx={bodyX} cy={GROUND_Y + 1} rx={7 - lift * 0.15} ry="1.8" fill="#000000" opacity={0.16 - lift * 0.005} />
        <Layer x={bodyX} y={originY + bob} scaleY={KID * (1 - squash)} scaleX={KID * (1 + squash * 0.6)}>
          <Child step={stride} mood={mood} nearTarget={nearTarget} farTarget={farTarget} headTilt={headTilt} holding={holding} sway={sway} />
        </Layer>
        <SweatDrop t={t} x={bodyX} y={GROUND_Y} />
        <Hearts t={t} x={bodyX} />
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
    { at: 0, label: '地面が できて、ぼうが 立つ', sound: 'pop' },
    { at: WALK, label: 'リボンを もった 子が あるいてくる' },
    { at: LOOK, label: 'ぼうの 上を 見あげる' },
    { at: TRY, label: 'せのびしても とどかない' },
    { at: CROUCH, label: 'しゃがんで ジャンプ' },
    { at: PEAK, label: '高い所に リボンを むすぶ', sound: 'pop' },
    { at: LAND + 0.2, label: '大よろこび' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '上 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
