/*
 * 行(いく): みちと みちが であう じゅうじろ。ひとが いく。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … 左うえの ほうから おりてくる 山みち
 *   2画目(ノ)  … 左の 山みち。したで、3画目の みちと ひとつに あつまる(Y字の わかれみち)
 *   3画目(丨)  … 左の まっすぐな 村みち
 *   4画目(一)  … うえの 横みち(お家の ほうへ のびる)
 *   5画目(一)  … まんなかの 横みち。お家の 玄関まで つづく
 *   6画目(亅)  … したから のぼってくる たて みち。5画目と まじわる T字ろ(まちの みち が あつまる ところ)
 *
 * ながれ(主役: ランドセルの 男の子)
 *   みちが ひろがる → 男の子が したから あるいてくる(うしろ すがた)
 *   → じゅうじろ で たちどまり、ふりむいて「どっちへ いこう?」ときょろきょろ(ハテナ)
 *   → お家の とびらが あいて、ともだちが てを ふる → 男の子が うれしくなって てを ふりかえす
 *   → 右むきに かけだして、ともだちの ところへ「いく」 → ほね が ひかって、絵が うすくなり、字「行」が のこる
 *
 * 人は ほんものの つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   くび は みじかく どう の まんなか の上。うで は かた から出て ひじ で まがる。
 *   字に なる とき、人は 字に 重ならない(みち が 字に なる。人は みち の うえを いく もの)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '行'

const SKIN = '#f8cfa6'
const HAIR = '#5a3b2a'
const HAIR_FRIEND = '#2f2a2a'
const SHIRT = '#4f9be0'
const SHIRT_DARK = '#3c82c4'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const BAG = '#e8534a'
const BAG_DARK = '#c9433b'
const FRIEND_SHIRT = '#f07f9e'
const FRIEND_SHIRT_DARK = '#d8627f'
const FRIEND_PANTS = '#6f8f4f'
const ROAD = '#ecd29a'
const ROAD_EDGE = '#d6b373'
const GRASS_BG = '#d7efbd'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const BARK = '#8c5b3c'
const SUN = '#ffd24a'
const WATER = '#7cc4f2'
const WATER_LIGHT = '#b9e3fa'
const WALL = '#f8e3b6'
const WALL_SHADE = '#ebcf98'
const ROOF = '#e8534a'
const ROOF_DARK = '#c9433b'
const DOOR = '#8c5b3c'
const DOOR_INSIDE = '#4a3020'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const WALK = 0.8
const ARRIVE = 3.6
/** じゅうじろ で こちらを むき おわる */
const FACE = 3.9
/** ともだちが とびらから 出てくる */
const POP = 5.0
/** 右を むく(ほんとうは からだ ごと むきを かえる) */
const TURN_R = 6.0
const RUN = 6.3
const ARRIVED = 7.4
const INK = 7.6
const DONE = 10.2
const DURATION = 10.6

/** じゅうじろ の まんなか(男の子の 足もと) */
const CROSS_X = 72.8
const CROSS_Y = 40
/** 5画目の みち は、右へ すこし のぼる(ほんもの の みち も ゆるやか) */
const roadY = (x: number) => CROSS_Y - (x - CROSS_X) * 0.1
/** ともだちの 立つ ばしょ(お家の 玄関の よこ) */
const FRIEND_POS: readonly [number, number] = [101.5, 38]
const RUN_END_X = 91

const toRad = (deg: number) => (deg * Math.PI) / 180

/** ひとつの みち: ふちどり(うすい 色)の うえに、すな色の みち。grow は のびた 度合い。 */
function RoadBone({ n, grow, width }: { readonly n: number; readonly grow: number; readonly width: number }) {
  return (
    <>
      <Bone char={CHAR} n={n} color={ROAD_EDGE} width={width + 1.8} to={grow} />
      <Bone char={CHAR} n={n} color={ROAD} width={width} to={grow} />
    </>
  )
}

function Tree({ x, y, scale = 1, sway = 0 }: { readonly x: number; readonly y: number; readonly scale?: number; readonly sway?: number }) {
  return (
    <Layer x={x} y={y} scale={scale}>
      <ellipse cx="0" cy="0.4" rx="7.5" ry="1.8" fill="#000000" opacity="0.1" />
      <rect x="-1.3" y="-6" width="2.6" height="6.4" rx="1.2" fill={BARK} />
      <Layer rotate={sway} origin={[0, -5]}>
        <circle cx="0" cy="-11.5" r="7.2" fill={LEAF_DARK} />
        <circle cx="-0.8" cy="-12.4" r="5.6" fill={LEAF} />
        <circle cx="-2.2" cy="-14" r="2.2" fill={LEAF_LIGHT} />
      </Layer>
    </Layer>
  )
}

function Flower({ x, y, color, t }: { readonly x: number; readonly y: number; readonly color: string; readonly t: number }) {
  const sway = wave(t, 2.6, x * 0.1) * 6
  return (
    <Layer x={x} y={y} rotate={sway} origin={[0, 0]}>
      <path d="M0 0 V-3.6" stroke={LEAF_DARK} strokeWidth="0.7" strokeLinecap="round" />
      <circle cx="0" cy="-4.4" r="1.5" fill={color} />
      <circle cx="0" cy="-4.4" r="0.6" fill={SUN} />
    </Layer>
  )
}

/** 空と 草と おか。にぎやかしの お日さま・雲も ここ。 */
function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <rect x="0" y="0" width="109" height="109" fill={GRASS_BG} />
      <Layer opacity={sun} rotate={t * 14} origin={[8, 9]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="7.3" y="0.8" width="1.4" height="3" rx="0.7" fill={SUN} transform={`rotate(${i * 45} 8 9)`} />
        ))}
      </Layer>
      <circle cx="8" cy="9" r={4.4 * sun} fill={SUN} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.3} 0)`}>
        <ellipse cx="42" cy="7" rx="6" ry="2.6" />
        <ellipse cx="46.5" cy="5.6" rx="4" ry="2.6" />
      </g>
      {[[4, 100], [38, 103], [58, 101], [104, 99]].map(([x, y]) => (
        <path key={x} d={`M${x} ${y} l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
      <ellipse cx="54.5" cy="107" rx="58" ry="5" fill={GRASS} />
    </>
  )
}

/** おうちの ある ふうけい: 池・木・花・ちょうちょ。みち の よこ には 線を 描かない。 */
function Scenery({ t }: SceneProps) {
  const grow = span(t, 0.2, 0.9, backOut)
  const sway = wave(t, 3.4) * 1.5
  const fx = 38 + Math.sin(t * 1.3) * 5
  const fy = 66 + Math.sin(t * 2.1) * 3
  const flap = Math.abs(wave(t, 0.22)) * 1.5 + 0.3
  return (
    <>
      <Layer scale={grow} origin={[48, 85]}>
        <ellipse cx="48" cy="86" rx="11.5" ry="5.6" fill={WATER} />
        <ellipse cx="45" cy="84.6" rx="4.6" ry="1.4" fill={WATER_LIGHT} />
        <ellipse cx="48" cy="86" rx={4 + ((t * 2.4) % 6)} ry={1.4 + ((t * 2.4) % 6) * 0.3} fill="none" stroke={WATER_LIGHT} strokeWidth="0.6" opacity={1 - ((t * 2.4) % 6) / 6} />
      </Layer>
      <Layer scale={grow} origin={[48, 70]}>
        <Tree x={48} y={70} sway={sway} />
      </Layer>
      <Layer scale={grow} origin={[10, 90]}>
        <Tree x={10} y={90} scale={1.1} sway={-sway} />
      </Layer>
      <Layer scale={grow} origin={[92, 76]}>
        <Tree x={92} y={76} scale={0.95} sway={sway} />
      </Layer>
      <Layer scale={grow} origin={[0, 0]}>
        <Flower x={36} y={74} color="#f07f9e" t={t} />
        <Flower x={39.5} y={76} color="#ffffff" t={t} />
        <Flower x={18} y={46} color="#f07f9e" t={t} />
        <Flower x={20.5} y={48.2} color="#8f9cec" t={t} />
        <Flower x={58} y={52} color="#ffffff" t={t} />
        <Flower x={84} y={92} color="#f07f9e" t={t} />
      </Layer>
      <Layer x={fx} y={fy} opacity={grow}>
        <ellipse cx={-1.1} cy="0" rx={1.2} ry={flap} fill="#f2a03d" />
        <ellipse cx={1.1} cy="0" rx={1.2} ry={flap} fill="#f2a03d" />
      </Layer>
    </>
  )
}

/** ともだちの お家。玄関の とびらが ひらく。 */
function House({ t }: SceneProps) {
  const grow = span(t, 0.3, 1.0, backOut)
  const open = span(t, POP - 0.25, POP, easeOut)
  return (
    <Layer scale={grow} origin={[97, 37]}>
      <rect x="87" y="22" width="19" height="15.2" rx="1.6" fill={WALL} />
      <rect x="87" y="33" width="19" height="4.2" rx="1.4" fill={WALL_SHADE} />
      <rect x="88.6" y="25.8" width="3.6" height="3.8" rx="0.6" fill={WATER_LIGHT} />
      <path d="M85.2 24.2 L96.5 13 L107.8 24.2 Z" fill={ROOF} strokeLinejoin="round" />
      <path d="M85.2 24.2 L107.8 24.2 L106.4 22.4 L86.6 22.4 Z" fill={ROOF_DARK} />
      <rect x="92.6" y="28.4" width="6.6" height="8.8" rx="1.6" fill={open > 0 ? DOOR_INSIDE : DOOR} />
      {open > 0 && <rect x={92.6} y="28.4" width={6.6 * (1 - open) + 1.2} height="8.8" rx="0.8" fill={DOOR} />}
    </Layer>
  )
}

/** まっすぐ下げた うで、または ひじで まがった うで。かた → ひじ → 手 の じゅんに つなぐ。 */
function Limb({ x, y, upper, fore, length = 3.3, color }: { readonly x: number; readonly y: number; readonly upper: number; readonly fore: number; readonly length?: number; readonly color: string }) {
  // 角度は ま下 = 0、+x 向きへ ふる ほうが プラス
  const ex = x + Math.sin(toRad(upper)) * length
  const ey = y + Math.cos(toRad(upper)) * length
  const hx = ex + Math.sin(toRad(fore)) * length
  const hy = ey + Math.cos(toRad(fore)) * length
  return (
    <>
      <path d={`M${x} ${y} L${ex} ${ey} L${hx} ${hy}`} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hx} cy={hy} r="1.5" fill={SKIN} />
    </>
  )
}

type View = 'back' | 'front' | 'side'
type Mood = 'plain' | 'puzzled' | 'happy'
type Palette = { readonly shirt: string; readonly shirtDark: string; readonly pants: string; readonly hair: string; readonly bag: boolean }

const KID: Palette = { shirt: SHIRT, shirtDark: SHIRT_DARK, pants: PANTS, hair: HAIR, bag: true }
const FRIEND: Palette = { shirt: FRIEND_SHIRT, shirtDark: FRIEND_SHIRT_DARK, pants: FRIEND_PANTS, hair: HAIR_FRIEND, bag: false }

type KidProps = {
  readonly view: View
  /** あしの ふり(-1〜1) */
  readonly step: number
  /** 目の むき(-1 = 画面の 左 / 1 = 右) */
  readonly look: number
  readonly mood: Mood
  /** 右の うでが あたまを かく(0〜1) */
  readonly scratch: number
  /** 右の うでを あげて ふる(0〜1) と ふりの ゆれ(-1〜1) */
  readonly wave: number
  readonly wavePhase: number
  readonly palette: Palette
}

/** ひとの 足もと が (0,0)。たかさ 約18。 */
function Kid({ view, step, look, mood, scratch, wave: waving, wavePhase, palette }: KidProps) {
  if (view === 'side') return <KidSide step={step} mood={mood} palette={palette} />
  const isFront = view === 'front'
  // 右の うで(画面の 右がわ): ぶらさげ → あたまを かく → あげて ふる
  const hangUpper = 6
  const hangFore = 12
  const scratchUpper = hangUpper + (70 - hangUpper) * scratch
  const scratchFore = hangFore + (200 - hangFore) * scratch
  const rUpper = scratchUpper + (135 - scratchUpper) * waving
  const rFore = scratchFore + (160 + wavePhase * 22 - scratchFore) * waving
  const liftL = Math.max(0, step) * 1.5
  const liftR = Math.max(0, -step) * 1.5
  const tilt = isFront ? look * 5 : 0
  return (
    <>
      {/* あし */}
      <rect x="-3.9" y={-6.2 - liftL} width="2.8" height="6.4" rx="1.3" fill={palette.pants} />
      <ellipse cx="-2.5" cy={-0.1 - liftL} rx="2.2" ry="1.2" fill={SHOE} />
      <rect x="1.1" y={-6.2 - liftR} width="2.8" height="6.4" rx="1.3" fill={palette.pants} />
      <ellipse cx="2.5" cy={-0.1 - liftR} rx="2.2" ry="1.2" fill={SHOE} />
      {/* どう */}
      <rect x="-3.7" y="-11.6" width="7.4" height="6.8" rx="2.4" fill={palette.shirt} />
      {isFront && palette.bag && (
        <>
          <path d="M-2.2 -11.4 v4.4 M2.2 -11.4 v4.4" stroke={BAG} strokeWidth="1" strokeLinecap="round" />
        </>
      )}
      {!isFront && palette.bag && (
        <>
          <rect x="-3.1" y="-11.8" width="6.2" height="6.8" rx="1.6" fill={BAG} />
          <rect x="-3.1" y="-9" width="6.2" height="1.1" fill={BAG_DARK} />
          <circle cx="0" cy="-7.2" r="0.7" fill="#ffd24a" />
        </>
      )}
      {/* うで: かた(どう の 上の よこ)から */}
      <Limb x={-3.7} y={-10.3} upper={-6} fore={-12} color={palette.shirtDark} />
      <Limb x={3.7} y={-10.3} upper={rUpper} fore={rFore} color={palette.shirtDark} />
      {/* くび(みじかい)と あたま */}
      <Layer rotate={tilt} origin={[0, -11.2]}>
        <rect x="-1.4" y="-12.6" width="2.8" height="2.2" fill={SKIN} />
        {isFront ? <FaceFront look={look} mood={mood} hair={palette.hair} /> : <circle cx="0" cy="-14.8" r="4.5" fill={palette.hair} />}
      </Layer>
    </>
  )
}

function FaceFront({ look, mood, hair }: { readonly look: number; readonly mood: Mood; readonly hair: string }) {
  const dx = look * 0.9
  return (
    <>
      <circle cx="0" cy="-14.8" r="4.5" fill={SKIN} />
      <path d="M-4.7 -14.8 C-5 -20 5 -20 4.7 -14.8 C3.4 -17.4 -3.4 -17.4 -4.7 -14.8 Z" fill={hair} />
      <circle cx={-3 + dx} cy="-12.9" r="0.9" fill={CHEEK} opacity="0.55" />
      <circle cx={3 + dx} cy="-12.9" r="0.9" fill={CHEEK} opacity="0.55" />
      {mood === 'happy' ? (
        <>
          <path d={`M${-2.9 + dx} -14.2 q1 -1.4 2 0 M${0.9 + dx} -14.2 q1 -1.4 2 0`} fill="none" stroke={EYE} strokeWidth="0.9" strokeLinecap="round" />
          <path d={`M${-1.4 + dx} -12.6 Q${dx} -10.4 ${1.4 + dx} -12.6 Z`} fill={MOUTH} />
        </>
      ) : (
        <>
          <circle cx={-1.8 + dx} cy="-14" r="0.8" fill={EYE} />
          <circle cx={1.8 + dx} cy="-14" r="0.8" fill={EYE} />
          {mood === 'puzzled' ? (
            <>
              <path d={`M${-3 + dx} -16 l2 0.7 M${1 + dx} -15.3 l2 -0.7`} stroke={hair} strokeWidth="0.7" strokeLinecap="round" />
              <path d={`M${-1.1 + dx} -12.2 q0.55 -0.7 1.1 0 t1.1 0`} fill="none" stroke={MOUTH} strokeWidth="0.7" strokeLinecap="round" />
            </>
          ) : (
            <path d={`M${-0.9 + dx} -12.4 q0.9 0.6 1.8 0`} fill="none" stroke={MOUTH} strokeWidth="0.7" strokeLinecap="round" />
          )}
        </>
      )}
    </>
  )
}

/** 右むき(かけだす とき)。うで・あし を ふる。 */
function KidSide({ step, mood, palette }: { readonly step: number; readonly mood: Mood; readonly palette: Palette }) {
  const swing = step * 38
  return (
    <>
      {/* むこうの うで・あし */}
      <Limb x={0} y={-10.3} upper={-swing * 1.1} fore={-swing * 1.1 + 55} color={palette.shirtDark} />
      <Layer rotate={swing} origin={[0, -5.6]}>
        <rect x="-1.4" y="-6.2" width="2.8" height="6.4" rx="1.3" fill={palette.pants} opacity="0.85" />
        <ellipse cx="0.7" cy="-0.1" rx="2.4" ry="1.2" fill={SHOE} />
      </Layer>
      <Layer rotate={-swing} origin={[0, -5.6]}>
        <rect x="-1.4" y="-6.2" width="2.8" height="6.4" rx="1.3" fill={palette.pants} />
        <ellipse cx="0.7" cy="-0.1" rx="2.4" ry="1.2" fill={SHOE} />
      </Layer>
      <rect x="-2.7" y="-11.6" width="5.4" height="6.8" rx="2.4" fill={palette.shirt} />
      {palette.bag && (
        <>
          <rect x="-5.4" y="-11.4" width="3.4" height="6.6" rx="1.4" fill={BAG} />
          <rect x="-5.4" y="-8.8" width="3.4" height="1" fill={BAG_DARK} />
        </>
      )}
      <Limb x={0} y={-10.3} upper={swing * 1.1} fore={swing * 1.1 + 55} color={palette.shirtDark} />
      <rect x="-1" y="-12.6" width="2.6" height="2.2" fill={SKIN} />
      <circle cx="-0.6" cy="-14.9" r="4.5" fill={palette.hair} />
      <circle cx="0.9" cy="-14.3" r="3.9" fill={SKIN} />
      <path d="M-2.6 -17 Q1.8 -19 4.6 -15.6 Q1.6 -16.6 -0.6 -15.8 Z" fill={palette.hair} />
      <circle cx="2.7" cy="-14.4" r="0.8" fill={EYE} />
      <circle cx="1.6" cy="-12.6" r="0.9" fill={CHEEK} opacity="0.55" />
      {mood === 'happy' ? <path d="M2.2 -12.6 Q3.4 -11.2 4.4 -12.6 Z" fill={MOUTH} /> : <path d="M2.4 -12.5 q0.8 0.5 1.6 0" fill="none" stroke={MOUTH} strokeWidth="0.7" strokeLinecap="round" />}
    </>
  )
}

/** 「どっちへ いこう?」の ハテナ。あたまの 上で ふわふわ。 */
function Question({ t, x, y }: { readonly t: number; readonly x: number; readonly y: number }) {
  const show = during(t, 4.0, 5.0, 0.2)
  if (show <= 0) return null
  const bob = wave(t, 0.9) * 0.8
  return (
    <g opacity={show} transform={`translate(${x} ${y + bob})`}>
      <path d="M-2.2 -2 Q-2.2 -4.6 0 -4.6 Q2.2 -4.6 2.2 -2.6 Q2.2 -1.2 0 -0.2 V1" fill="none" stroke="#5f7fd6" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="0" cy="3.2" r="0.9" fill="#5f7fd6" />
    </g>
  )
}

/** ともだちが 出てくると きの「おーい」の しるし。 */
function Hello({ t }: SceneProps) {
  const show = during(t, POP + 0.35, ARRIVED, 0.2)
  if (show <= 0) return null
  const p = ((t * 2.2) % 1)
  return (
    <g opacity={show * (1 - p)} fill="none" stroke="#f07f9e" strokeWidth="0.8" strokeLinecap="round">
      <path d={`M${FRIEND_POS[0] - 6.5 - p * 1.5} ${FRIEND_POS[1] - 17} q-1.6 1.6 0 3.4`} />
      <path d={`M${FRIEND_POS[0] - 8.6 - p * 2.5} ${FRIEND_POS[1] - 18} q-2.4 2.6 0 5.4`} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  // みちが のびる
  const g1 = span(t, 0.1, 0.6)
  const g2 = span(t, 0.2, 0.7)
  const g3 = span(t, 0.3, 0.9)
  const g4 = span(t, 0.3, 0.9)
  const g5 = span(t, 0.2, 0.8)
  const g6 = span(t, 0.1, 0.8)

  // 男の子の うごき: あるいてくる → たちどまる → ふりむく → かけだす
  const walking = 1 - span(t, ARRIVE - 0.3, ARRIVE)
  const walkStep = t < WALK ? 0 : Math.sin((t - WALK) * Math.PI * 2 * 2.4) * walking
  const runStep = t < RUN ? 0 : Math.sin((t - RUN) * Math.PI * 2 * 3) * (1 - span(t, ARRIVED - 0.2, ARRIVED))
  const turnBack = span(t, ARRIVE, FACE)
  const turnSide = span(t, TURN_R, RUN)
  const view: View = t < ARRIVE + (FACE - ARRIVE) / 2 ? 'back' : t < TURN_R + (RUN - TURN_R) / 2 ? 'front' : 'side'
  // むきを かえる とき、よこはばが ぺしゃんこに なって もどる(くるっと まわる)
  const squash = t < FACE ? Math.abs(1 - 2 * turnBack) : Math.abs(1 - 2 * turnSide)
  const squashScale = t >= FACE && t < TURN_R ? 1 : Math.max(squash, 0.08)

  const runX = mix(t, RUN, ARRIVED, CROSS_X, RUN_END_X, easeInOut)
  const kidX = t < RUN ? CROSS_X : runX
  const step = t < ARRIVE ? walkStep : runStep
  const hop = t > ARRIVED ? Math.abs(wave(t, 0.5)) * 1.2 : 0
  const bob = -Math.abs(step) * 1.2 - hop
  const kidY = (t < ARRIVE ? mix(t, WALK, ARRIVE, 114, CROSS_Y, easeOut) : t < RUN ? CROSS_Y : roadY(kidX)) + bob

  const look = t < 4.5 ? mix(t, FACE, 4.3, 0, -1) : t < 4.9 ? mix(t, 4.5, 4.8, -1, 0) : mix(t, POP, POP + 0.3, 0, 1)
  const mood: Mood = t < FACE ? 'plain' : t < POP + 0.2 ? 'puzzled' : 'happy'
  const scratch = span(t, FACE + 0.1, FACE + 0.4) * (1 - span(t, 4.8, 5.0))
  const waving = span(t, 5.4, 5.6) * (1 - span(t, 5.9, 6.1))

  // ともだち: とびらから ぽん と出て、てを ふる
  const friendIn = span(t, POP, POP + 0.5, backOut)
  const friendWave = span(t, POP + 0.3, POP + 0.6)
  const friendHop = t > ARRIVED ? Math.abs(wave(t, 0.5, 0.25)) * 1.2 : 0

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <RoadBone n={1} grow={g1} width={5.6} />
        <RoadBone n={2} grow={g2} width={5.6} />
        <RoadBone n={3} grow={g3} width={6.4} />
        <RoadBone n={4} grow={g4} width={5.6} />
        <RoadBone n={5} grow={g5} width={6.6} />
        <RoadBone n={6} grow={g6} width={6.6} />
        <Scenery t={t} />
        <House t={t} />
        {/* ともだち */}
        <Layer x={FRIEND_POS[0]} y={FRIEND_POS[1] - friendHop} scale={0.95 * friendIn} origin={[0, 0]}>
          <Kid view="front" step={0} look={-0.6} mood="happy" scratch={0} wave={friendWave} wavePhase={wave(t, 0.45)} palette={FRIEND} />
        </Layer>
        <Hello t={t} />
        {/* 主役の 男の子 */}
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.1)}>
          <ellipse cx={kidX} cy={kidY + 0.2 - bob} rx="4.8" ry="1.3" fill="#000000" opacity="0.14" />
          <Layer x={kidX} y={kidY} scaleX={squashScale} scaleY={1}>
            <Kid view={view} step={step} look={look} mood={mood} scratch={scratch} wave={waving} wavePhase={wave(t, 0.4)} palette={KID} />
          </Layer>
        </Layer>
        <Question t={t} x={CROSS_X} y={CROSS_Y - 22} />
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
    { at: 0, label: 'みちが ひろがる', sound: 'pop' },
    { at: WALK, label: '男の子が みちを あるいてくる' },
    { at: ARRIVE, label: 'じゅうじろ で たちどまる。どっちへ いこう?', sound: 'pop' },
    { at: POP, label: 'ともだちが 出てきて てを ふる', sound: 'pop' },
    { at: RUN, label: 'うれしくて かけだして いく' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '行 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
