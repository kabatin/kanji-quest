/*
 * 紙(かみ): 糸のような ほそい せんいを あつめて、紙を つくる。
 *
 * ほね(画と絵の対応)
 *   糸(1〜6画目) … 左の ほしだい に つるした 糸のような せんい(長く たれた すじ)
 *   氏(7〜10画目) … 右の おけ から すくいあげた、できたての 紙(ぬれた 紙を のせた わく)
 *   ※ 絵は ほんものの 道具の かたち を守る。字と ぴったり重ならなくても、だいたい 左に せんい・右に 紙。
 *
 * ながれ
 *   子どもが「紙が ほしいな」と こまっている(ふきだしに まっしろな 紙)
 *   → ほしだい から 糸のような せんいを ひとたば とる
 *   → おけの 水に 入れて、ぼうで ぐるぐる まぜる(せんいが ほぐれて 水が にごる)
 *   → すきわく を すくいあげると、せんい が 集まって うすい 紙に なっている
 *   → 紙を かかげて にっこり → ほね が ひかって、絵が うすくなり、字「紙」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(手が とどく所へ、ひじ が 自然に まがる)。
 *   くび は みじかく、どう の 上。あし は こし から。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '紙'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#f2a65a'
const TUNIC_DARK = '#d98a3f'
const TUNIC_FAR = '#c27a35'
const PANTS = '#4f6aa0'
const PANTS_DARK = '#42598b'
const SHOE = '#6b4a36'
const WOOD = '#8c5b3c'
const WOOD_DARK = '#70452b'
const WOOD_LIGHT = '#a97650'
const FIBER = '#e6cf98'
const FIBER_DARK = '#cdb274'
const WATER = '#7cc4f2'
const WATER_LIGHT = '#d8effc'
const PULP = '#f3e8cc'
const PAPER = '#fffdf6'
const PAPER_SHADE = '#e4dcc6'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'

/** くぎり の時間(秒) */
const REACH = 2.0
const GRAB = 2.8
const TURN0 = 2.9
const TURN1 = 3.4
const WALK1 = 4.5
const RELEASE = 5.1
const STIR0 = 5.5
const STIR1 = 6.3
const DIP = 6.3
const LIFT0 = 6.75
const LIFT1 = 7.4
const INK = 7.6
const DONE = 10.9
const DURATION = 11

type Pt = readonly [number, number]

/** 子どもの 大きさ。足もとが 地面(y=94)、かた が y=51 */
const GROUND = 94
const SHOULDER_Y = 51
/** うで の ふしの 長さ(かた→ひじ、ひじ→手) */
const ARM_PART = 11.5

/** ほしだい(左)の きまった所 */
const RACK_BAR_Y = 16
/** つかむ せんいの 先(手が とどく高さ) */
const GRAB_AT: Pt = [33, 60]
const GRAB_STRAND_X = 33

/** おけ(右): まんなか と ふち の高さ */
const VAT_X = 87
const VAT_TOP = 70

const rad = (deg: number) => (deg * Math.PI) / 180
const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/** 時間の きまった点を つないで、手の場所を なめらかに うごかす */
function route(t: number, keys: readonly { readonly at: number; readonly p: Pt }[]): Pt {
  if (t <= keys[0].at) return keys[0].p
  for (let i = 1; i < keys.length; i += 1) {
    if (t <= keys[i].at) return lerpPt(keys[i - 1].p, keys[i].p, span(t, keys[i - 1].at, keys[i].at, easeInOut))
  }
  return keys[keys.length - 1].p
}

/**
 * かた から 手 まで、ひじ で まがる うで。手が とどく所を 先に きめて、ひじ の場所を 計算する。
 * ひじ は 下(と うしろ)へ まがる。
 */
function elbowFor(shoulder: Pt, hand: Pt, back: number): { readonly elbow: Pt; readonly hand: Pt } {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const dist = Math.hypot(dx, dy) || 0.001
  const reach = Math.min(dist, ARM_PART * 2 - 0.05)
  const ux = dx / dist
  const uy = dy / dist
  const mid: Pt = [shoulder[0] + ux * reach * 0.5, shoulder[1] + uy * reach * 0.5]
  const h = Math.sqrt(Math.max(ARM_PART * ARM_PART - (reach / 2) ** 2, 0))
  const candidates: readonly Pt[] = [
    [mid[0] - uy * h, mid[1] + ux * h],
    [mid[0] + uy * h, mid[1] - ux * h],
  ]
  const score = (p: Pt) => p[1] + p[0] * back * 0.5
  const elbow = score(candidates[0]) >= score(candidates[1]) ? candidates[0] : candidates[1]
  return { elbow, hand: [shoulder[0] + ux * reach, shoulder[1] + uy * reach] }
}

function Arm({ shoulder, hand, color, back }: { readonly shoulder: Pt; readonly hand: Pt; readonly color: string; readonly back: number }) {
  const solved = elbowFor(shoulder, hand, back)
  const [ex, ey] = solved.elbow
  const [hx, hy] = solved.hand
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${ex} ${ey} L${hx} ${hy}`} fill="none" stroke={color} strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hx} cy={hy} r="3" fill={SKIN} />
    </>
  )
}

function Ground() {
  return (
    <>
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 94 V101 H-4 Z" fill="#e2f2d2" />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[4, 50, 66, 104].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** お日さまと ゆっくり ながれる 雲 */
function Sky({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 12} origin={[98, 12]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="97.2" y="1.2" width="1.6" height="3.6" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 98 12)`} />
        ))}
      </Layer>
      <circle cx="98" cy="12" r={5.2 * sun} fill={SUN} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="62" cy="9" rx="6" ry="2.8" />
        <ellipse cx="66.5" cy="7.6" rx="4.2" ry="2.8" />
      </g>
    </>
  )
}

/** ほしだい: 2本の はしら と よこぼう に、糸のような せんいを つるす */
function Rack({ t }: SceneProps) {
  const grow = span(t, 0, 0.6, backOut)
  const taken = t >= GRAB
  // よこぼう から たれる せんい(x と 長さ)。つかむ 1本は、とる と 手に うつる
  const strands: readonly (readonly [number, number])[] = [
    [13, 52],
    [17.5, 70],
    [22, 44],
    [27, 79],
    [GRAB_STRAND_X, GRAB_AT[1] - RACK_BAR_Y],
    [29.8, 60],
  ]
  return (
    <Layer scaleY={grow} origin={[23, 97]}>
      <rect x="6.6" y="14" width="3.4" height="83" rx="1.6" fill={WOOD_DARK} />
      <rect x="37" y="14" width="3.4" height="83" rx="1.6" fill={WOOD_DARK} />
      <rect x="5" y={RACK_BAR_Y - 2.4} width="37" height="3.6" rx="1.8" fill={WOOD} />
      {strands.map(([x, length], i) => {
        if (taken && x === GRAB_STRAND_X) return null
        const sway = wave(t, 3 + i * 0.4, i) * 0.8
        return <path key={x} d={`M${x} ${RACK_BAR_Y} q${2 + sway} ${length * 0.25} 0 ${length * 0.5} t0 ${length * 0.5}`} fill="none" stroke={i % 2 === 0 ? FIBER : FIBER_DARK} strokeWidth="1.5" strokeLinecap="round" />
      })}
    </Layer>
  )
}

/** 手に もった せんいの たば(ほぐれて ゆれる) */
function Bundle({ x, y, t, fall }: { readonly x: number; readonly y: number; readonly t: number; readonly fall: number }) {
  return (
    <g transform={`translate(${x} ${y})`} opacity={1 - Math.max(0, fall - 0.75) * 4}>
      {[-2.4, -1.2, 0, 1.2, 2.4].map((dx, i) => {
        const len = 11 + (i % 3) * 2.6
        const sway = wave(t, 0.9 + i * 0.07, i) * 1.1
        return <path key={dx} d={`M${dx * 0.5} 0 q${dx + sway} ${len * 0.5} ${dx * 0.9} ${len * 0.5} t${-dx * 0.4 + sway * 0.6} ${len * 0.5}`} fill="none" stroke={i % 2 === 0 ? FIBER : FIBER_DARK} strokeWidth="1.4" strokeLinecap="round" />
      })}
    </g>
  )
}

/** おけ: 木の たる。水と、ほぐれた せんい */
function VatBack() {
  return (
    <>
      <path d={`M${VAT_X - 15} ${VAT_TOP} L${VAT_X - 14} 92 Q${VAT_X} 97 ${VAT_X + 14} 92 L${VAT_X + 15} ${VAT_TOP} Z`} fill={WOOD} />
      <path d={`M${VAT_X - 5} ${VAT_TOP + 3} L${VAT_X - 4.6} 94 M${VAT_X + 5} ${VAT_TOP + 3} L${VAT_X + 4.6} 94`} stroke={WOOD_DARK} strokeWidth="1.1" strokeLinecap="round" />
      <path d={`M${VAT_X - 14.8} 79 Q${VAT_X} 82.5 ${VAT_X + 14.8} 79 L${VAT_X + 14.8} 81.4 Q${VAT_X} 85 ${VAT_X - 14.8} 81.4 Z`} fill={WOOD_DARK} />
      <ellipse cx={VAT_X} cy={VAT_TOP} rx="15" ry="4.2" fill={WOOD_LIGHT} />
    </>
  )
}

function VatWater({ t }: SceneProps) {
  const pulp = span(t, RELEASE + 0.3, STIR1)
  const strands = span(t, RELEASE + 0.25, RELEASE + 0.7)
  const ring = span(t, RELEASE + 0.25, RELEASE + 1.4)
  return (
    <>
      <ellipse cx={VAT_X} cy={VAT_TOP + 0.3} rx="13.2" ry="3.3" fill={WATER} />
      <ellipse cx={VAT_X} cy={VAT_TOP + 0.3} rx="13.2" ry="3.3" fill={PULP} opacity={pulp * 0.8} />
      <path d={`M${VAT_X - 9} ${VAT_TOP - 0.4} q3 -1 6 0`} fill="none" stroke={WATER_LIGHT} strokeWidth="0.7" strokeLinecap="round" opacity={1 - pulp} />
      {/* おちた せんい: 水に ういて ほぐれる */}
      <g opacity={strands} fill="none" stroke={FIBER_DARK} strokeWidth="0.9" strokeLinecap="round">
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const x = VAT_X - 8 + i * 3.2 + wave(t, 2.2, i) * 0.8
          const y = VAT_TOP + 0.4 + ((i * 7) % 5) * 0.4 - 1
          return <path key={i} d={`M${x - 2.4} ${y} q1.2 -1.2 2.4 0 t2.4 0`} />
        })}
      </g>
      {ring > 0 && ring < 1 && <ellipse cx={VAT_X - 3.5} cy={VAT_TOP + 0.4} rx={1.5 + 9 * ring} ry={0.5 + 2.4 * ring} fill="none" stroke="#ffffff" strokeWidth="0.9" opacity={1 - ring} />}
    </>
  )
}

type Mood = 'sad' | 'calm' | 'happy'

type KidProps = {
  readonly cx: number
  readonly bob: number
  readonly lean: number
  readonly facing: number
  readonly step: number
  readonly mood: Mood
  readonly headTilt: number
  readonly shoulder: Pt
  readonly nearHand: Pt
  readonly farHand: Pt
}

/** 子ども(右むきで 描いて、facing で 左右を ひっくり返す) */
function Kid({ cx, bob, lean, facing, step, mood, headTilt, shoulder, nearHand, farHand }: KidProps) {
  const back = -facing
  return (
    <>
      <Arm shoulder={shoulder} hand={farHand} color={TUNIC_FAR} back={back} />
      <Layer x={cx} y={bob} rotate={lean * facing} origin={[0, GROUND]}>
        <Layer scaleX={facing} origin={[0, 60]}>
          {/* あし: こし から ふる */}
          <Layer rotate={step * 18} origin={[0.6, 69]}>
            <rect x="-1.4" y="68" width="5.2" height="25" rx="2.6" fill={PANTS_DARK} />
            <ellipse cx="2.6" cy="93.2" rx="4.8" ry="2.6" fill={SHOE} />
          </Layer>
          <Layer rotate={-step * 18} origin={[-0.6, 69]}>
            <rect x="-3.8" y="68" width="5.2" height="25" rx="2.6" fill={PANTS} />
            <ellipse cx="0.6" cy="93.2" rx="4.8" ry="2.6" fill={SHOE} />
          </Layer>
          {/* くび と どう */}
          <rect x="-2.4" y="43" width="5" height="7" rx="2.2" fill={SKIN_SHADE} />
          <rect x="-6.4" y="47" width="12.8" height="25" rx="6" fill={TUNIC} />
          <path d="M-4.6 63 h9.2" stroke={TUNIC_DARK} strokeWidth="1.4" strokeLinecap="round" />
          <Layer rotate={headTilt} origin={[0, 46]}>
            <circle cx="0" cy="37.6" r="8.2" fill={SKIN} />
            <path d="M-8.2 36 C-9.4 27 -1 24.6 4.6 26.8 C7.6 28 8.2 31.4 8 34.6 C5.4 31 0.6 30.2 -3.6 32 C-5.8 33 -7.4 34.4 -8.2 36 Z" fill={HAIR} />
            <circle cx="-4.6" cy="26.8" r="2.2" fill={HAIR} />
            <circle cx="1.8" cy="41.6" r="1.9" fill="#ff9d9d" opacity="0.55" />
            {mood === 'sad' && (
              <>
                <path d="M1.8 34.4 l3.8 1.4" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
                <circle cx="3.6" cy="37.8" r="1.15" fill="#2b2b2b" />
                <path d="M3.2 44 q1.8 -1.8 3.6 -0.1" fill="none" stroke="#b9483f" strokeWidth="1.15" strokeLinecap="round" />
              </>
            )}
            {mood === 'calm' && (
              <>
                <circle cx="3.6" cy="37.6" r="1.15" fill="#2b2b2b" />
                <path d="M3 42.2 q1.8 1.6 3.6 0" fill="none" stroke="#b9483f" strokeWidth="1.15" strokeLinecap="round" />
              </>
            )}
            {mood === 'happy' && (
              <>
                <path d="M2.2 38.4 Q3.8 36.2 5.4 38.4" fill="none" stroke="#2b2b2b" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M2.6 41.6 Q4.6 45.4 7 41.6 Z" fill="#b9483f" />
              </>
            )}
          </Layer>
        </Layer>
      </Layer>
      <Arm shoulder={shoulder} hand={nearHand} color={TUNIC_DARK} back={back} />
    </>
  )
}

/** こまった ふきだし: まっしろな 紙が ほしい */
function WishBubble({ t }: SceneProps) {
  const show = during(t, 0.5, REACH + 0.1, 0.3)
  if (show <= 0) return null
  const bob = wave(t, 1.6) * 0.5
  return (
    <g opacity={show} transform={`translate(0 ${bob})`}>
      <circle cx="53.5" cy="30" r="1.1" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <circle cx="56.4" cy="25.6" r="1.9" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <ellipse cx="66" cy="16.5" rx="12" ry="8" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
      <rect x="60" y="10.4" width="12" height="12.4" rx="1" fill={PAPER} stroke="#b7c4d6" strokeWidth="0.7" strokeDasharray="1.6 1.2" />
    </g>
  )
}

/** あせ(こまっている とき) */
function Sweat({ t }: SceneProps) {
  const show = during(t, 0.7, REACH, 0.2)
  if (show <= 0) return null
  const p = ((t * 0.9) % 1) * 1
  return <path d="M0 -2.2 Q1.8 0.6 0 1.8 Q-1.8 0.6 0 -2.2 Z" fill={WATER} opacity={show * (1 - p * 0.6)} transform={`translate(${57 + p * 1.2} ${31 + p * 5})`} />
}

/** すきわく と できた 紙(おけの 水から すくいあげる) */
function Mould({ t, center }: { readonly t: number; readonly center: Pt }) {
  const [x, y] = center
  const rise = span(t, DIP + 0.15, LIFT1, easeOut)
  if (t < DIP + 0.25 || y > VAT_TOP + 2) return null
  // 紙は すくった ときは まだ ぬれて ほんのり せんい色、かかげると 白く
  const dry = span(t, LIFT1 - 0.2, INK)
  const sheetColor = dry > 0.5 ? PAPER : PULP
  const w = 11
  return (
    <>
      <path d={`M${x - w} ${y + 2.6} L${x + w} ${y + 2.6} L${x + w + 4} ${y - 2.4} L${x - w + 4} ${y - 2.4} Z`} fill={WOOD} />
      <path d={`M${x - w + 1.6} ${y + 1.6} L${x + w - 1.6} ${y + 1.6} L${x + w + 2.2} ${y - 1.4} L${x - w + 5.8} ${y - 1.4} Z`} fill={sheetColor} />
      <path d={`M${x - w + 1.6} ${y + 1.6} L${x + w - 1.6} ${y + 1.6} L${x + w - 0.4} ${y + 0.4} L${x - w + 2.8} ${y + 0.4} Z`} fill={PAPER_SHADE} opacity={0.7 + 0.3 * (1 - dry)} />
      {/* しずく: 紙から 水が ぽたぽた */}
      {[0, 1, 2].map((i) => {
        const p = (t * 1.4 + i * 0.36) % 1
        const show = rise * (1 - dry * 0.8)
        const dropX = x - w + 3 + i * 6.5
        return <path key={i} d="M0 -1.6 Q1.3 0.4 0 1.4 Q-1.3 0.4 0 -1.6 Z" fill={WATER} opacity={show * (1 - p)} transform={`translate(${dropX} ${y + 3.4 + p * 12})`} />
      })}
    </>
  )
}

function Stick({ t, hand }: { readonly t: number; readonly hand: Pt }) {
  const show = during(t, STIR0 - 0.15, STIR1 + 0.05, 0.15)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      <path d={`M${hand[0] - 0.6} ${hand[1] - 3} L${hand[0] + 1} ${VAT_TOP + 1}`} stroke={WOOD_LIGHT} strokeWidth="1.8" strokeLinecap="round" />
      <ellipse cx={hand[0] + 1} cy={VAT_TOP + 1} rx={2.4 + Math.abs(wave(t, 0.6)) * 2.6} ry="0.9" fill="none" stroke="#ffffff" strokeWidth="0.7" opacity="0.9" />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 10)

  // むき(左 → 右)と、あるく ところ
  const facing = mix(t, TURN0, TURN1, -1, 1)
  const cx = mix(t, TURN1, WALK1, 49, 66, easeInOut)
  const walking = span(t, TURN1, TURN1 + 0.15) * (1 - span(t, WALK1 - 0.25, WALK1))
  const step = Math.sin((t - TURN1) * Math.PI * 2 * 1.7) * walking
  const bob = -Math.abs(step) * 1.2

  // 前かがみ: せんいを とるとき・おけに 手をのばすとき・すくうとき
  const lean = Math.max(5 * during(t, REACH, GRAB + 0.7, 0.35), 8 * during(t, WALK1 - 0.1, STIR1 + 0.2, 0.3), 12 * during(t, DIP - 0.2, LIFT0 + 0.45, 0.3))
  const theta = rad(lean * facing)
  const shoulder: Pt = [cx + (GROUND - SHOULDER_Y) * Math.sin(theta), GROUND - (GROUND - SHOULDER_Y) * Math.cos(theta) + bob]

  // 手の いく所
  const hang: Pt = [shoulder[0] + facing * 1.5, shoulder[1] + 22]
  const carry: Pt = [shoulder[0] + facing * 10, shoulder[1] + 8]
  const pour: Pt = [VAT_X - 4, VAT_TOP - 7]
  const dip: Pt = [VAT_X - 12.6, VAT_TOP + 4.2]
  const lifted: Pt = [VAT_X - 10.4, 57]
  const stirAngle = (t - STIR0) * Math.PI * 2 * 1.6
  const stir = during(t, STIR0, STIR1, 0.2)
  const base = route(t, [
    { at: REACH, p: hang },
    { at: GRAB - 0.15, p: GRAB_AT },
    { at: GRAB + 0.15, p: GRAB_AT },
    { at: TURN1, p: carry },
    { at: WALK1, p: carry },
    { at: WALK1 + 0.45, p: pour },
    { at: STIR0, p: pour },
    { at: DIP, p: pour },
    { at: DIP + 0.4, p: dip },
    { at: LIFT0, p: dip },
    { at: LIFT1, p: lifted },
  ])
  const nearHand: Pt = [base[0] + Math.cos(stirAngle) * 3.2 * stir, base[1] + Math.sin(stirAngle) * 1.2 * stir]
  const farSwing: Pt = [hang[0] - facing * step * 8, hang[1]]
  const farHand = lerpPt(farSwing, [nearHand[0] + 8, nearHand[1] - 0.6], span(t, DIP - 0.3, DIP + 0.1, easeInOut))

  const mood: Mood = t < GRAB ? 'sad' : t < LIFT1 - 0.2 ? 'calm' : 'happy'
  const headTilt = t < REACH ? 7 : t < LIFT1 ? 1 : -2
  const fall = span(t, RELEASE, RELEASE + 0.35)
  const inHand = t >= GRAB && t < RELEASE
  const bundleAt: Pt = inHand ? [nearHand[0], nearHand[1] + 1.5] : [pour[0], mix(t, RELEASE, RELEASE + 0.35, pour[1] + 1.5, VAT_TOP, (x) => x * x)]
  const showBundle = t >= GRAB && fall < 1
  // できあがりで 字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.05
  const mouldCenter: Pt = [nearHand[0] + 6, nearHand[1] - 1.5]

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Ground />
        <Rack t={t} />
        <VatBack />
        <VatWater t={t} />
        <Layer opacity={span(t, 0.2, 0.55)}>
          <ellipse cx={cx} cy="97.2" rx="9" ry="2.3" fill="#000000" opacity="0.12" />
          <Kid cx={cx} bob={bob} lean={lean} facing={facing} step={step} mood={mood} headTilt={headTilt} shoulder={shoulder} nearHand={nearHand} farHand={farHand} />
        </Layer>
        {showBundle && <Bundle x={bundleAt[0]} y={bundleAt[1]} t={t} fall={fall} />}
        <Stick t={t} hand={nearHand} />
        <Mould t={t} center={mouldCenter} />
        <WishBubble t={t} />
        <Sweat t={t} />
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Layer scale={1 + bump} origin={[54.5, 54.5]}>
        <Ink char={CHAR} progress={ink.progress} tint={ink.tint} />
      </Layer>
      <Sparkles cx={54.5} cy={52} progress={ink.sparkle} />
    </>
  )
}

const scene: SceneModule = {
  char: CHAR,
  duration: DURATION,
  beats: [
    { at: 0, label: 'ほしだいに 糸のような せんい。子どもは「紙が ほしいな」', sound: 'pop' },
    { at: REACH, label: 'せんいを ひとたば とる' },
    { at: TURN1, label: 'おけの ほうへ あるく' },
    { at: RELEASE, label: '水に 入れて ぼうで まぜる', sound: 'pop' },
    { at: DIP, label: 'すきわくを すくいあげる' },
    { at: LIFT1, label: '紙が できた。にっこり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '紙 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
