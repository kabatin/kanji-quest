/*
 * 分(わける): かたなで すいかを 2つに 切って、ふたりで わける。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … 左へ ころがった すいかの はんぶん(まるい せなか)
 *   2画目(丶)  … 右へ ころがった すいかの はんぶん(まるい せなか)
 *   3・4画目   … 切った かたな と、それを にぎった 女の子の まわり(かたなは まんなかに 立ったまま)
 *                  (八 = 左右に わかれた 2つ / 刀 = 切った かたな)
 *
 * ながれ
 *   テーブルに 大きな すいか。うさぎは おなかが ぐう、女の子は「ひとりじゃ 食べきれないな…」と こまりがお
 *   → 「そうだ!」と ひらめいて、かたなを 高く かまえる
 *   → すぱっ と 切ると、すいかが 左と右に ころがって 赤い なかみが 見える
 *   → うさぎも 女の子も にこにこ。ハートが ふわり
 *   → 左と右に わかれた はんぶん が 八の形に そろった しゅんかん、ほね が ひかって 字「分」になる
 *
 * 人・うさぎ・すいか・かたなは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   ふたりは テーブルの むこうがわ に立つ(下は テーブルに かくれる)。うで は かた から出て ひじ で まがる。
 *   すいかは まるい ので、切ると はんぶんずつ 外がわへ ころがる。かたなは はば のうすい 刃と 木の え。
 */
import { backOut, during, easeIn, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '分'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const DRESS = '#f08aa8'
const DRESS_DARK = '#d9708f'
const BUNNY = '#f6f1ee'
const BUNNY_SHADE = '#e3d9d3'
const PINK = '#ffb3c4'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const WOOD_TOP = '#dba267'
const WOOD_FRONT = '#c98a52'
const WOOD_DARK = '#a86d3d'
const RIND = '#3f9c59'
const RIND_DARK = '#2f7d46'
const RIND_LIGHT = '#bfe7a3'
const FLESH = '#ef5b5b'
const SEED = '#3a2a2a'
const STEEL = '#e8eef5'
const STEEL_DARK = '#b9c6d4'
const HANDLE = '#8c5b3c'
const GRASS = '#c5e8a9'
const HILL = '#e2f2d2'
const LEAF = '#55b86e'
const SUN = '#ffd24a'

/** くぎり の時間(秒) */
const POP = 0.3
const UP = 1.0
const GROWL = 1.7
const IDEA = 2.9
const READY = 3.8
const CHOP = 4.2
const HIT = 4.4
const CHEER = 5.6
const INK = 6.8
const DONE = 9.5
const DURATION = 10

type Pt = readonly [number, number]

/** テーブルの うえの たかさ(すいかの そこ) */
const TABLE_TOP = 58
/** すいかの まんなか と はんけい */
const MELON: Pt = [54, 43]
const MR = 15
/** ふたりが テーブルの むこうから のぼってくる とき の さがり */
const SINK = 50
/** 女の子の かた(まえの うで・むこうの うで) */
const GIRL_SHOULDER_L: Pt = [78, 44]
const GIRL_SHOULDER_R: Pt = [94, 44]
const ARM_PART = 23
/** かたなの えの ながさ と 刃の ながさ(つなぎめ P から) */
const BLADE = 17
const HANDLE_LEN = 8
/** かたなを にぎった手 は、つなぎめ P より 少し 上 */
const GRIP = 4
/** かたなが たちどまる しゅんかん の P の たかさ */
const P_READY = 11
const P_CUT = 42
const KNIFE_X = 54

/** 2つの ほね で できた うで: かた → ひじ → 手。ひじ は pref の ほうへ まがる。 */
function elbowOf(shoulder: Pt, hand: Pt, pref: Pt): Pt {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const d = Math.max(Math.hypot(dx, dy), 0.001)
  const reach = Math.min(d, ARM_PART * 2 - 0.01)
  const h = Math.sqrt(Math.max(ARM_PART * ARM_PART - (reach / 2) ** 2, 0))
  const ux = dx / d
  const uy = dy / d
  const flip = uy * pref[0] - ux * pref[1] < 0 ? -1 : 1
  return [shoulder[0] + (ux * reach) / 2 + uy * h * flip, shoulder[1] + (uy * reach) / 2 - ux * h * flip]
}

function Arm({ shoulder, hand, pref, color }: { readonly shoulder: Pt; readonly hand: Pt; readonly pref: Pt; readonly color: string }) {
  const elbow = elbowOf(shoulder, hand, pref)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.5" fill={SKIN} />
    </>
  )
}

function Backdrop({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[40, 9]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="39.3" y="0.6" width="1.4" height="3.2" rx="0.7" fill={SUN} transform={`rotate(${i * 45} 40 9)`} />
        ))}
      </Layer>
      <circle cx="40" cy="9" r={4.6 * sun} fill={SUN} />
      <path d="M-4 99 Q20 66 48 84 Q76 62 113 86 V101 H-4 Z" fill={HILL} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="68" cy="9" rx="6" ry="2.8" />
        <ellipse cx="72.5" cy="7.6" rx="4.2" ry="2.8" />
      </g>
      <ellipse cx="54.5" cy="98" rx="52" ry="5.6" fill={GRASS} />
      {[6, 40, 70, 104].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** テーブル: うえの いた と、まえが ふさがった つくえ(ふたりは この むこうがわ に立つ) */
function Table({ t }: SceneProps) {
  const show = span(t, 0, 0.4, easeOut)
  return (
    <Layer opacity={show}>
      <rect x="4" y="63" width="101" height="34" rx="2" fill={WOOD_FRONT} />
      <rect x="10" y="70" width="40" height="22" rx="2" fill="none" stroke={WOOD_DARK} strokeWidth="1.4" />
      <rect x="59" y="70" width="40" height="22" rx="2" fill="none" stroke={WOOD_DARK} strokeWidth="1.4" />
      <rect x="2" y={TABLE_TOP} width="105" height="5.4" rx="2.6" fill={WOOD_TOP} />
    </Layer>
  )
}

/** すいかの はんぶん。side = -1 が左、1 が右。bulge = 切り口(赤い なかみ)の 見える はば。 */
function MelonHalf({ side, bulge }: { readonly side: -1 | 1; readonly bulge: number }) {
  const [cx, cy] = MELON
  const out = side === -1 ? 0 : 1
  const inn = side === -1 ? 1 : 0
  const half = (r: number) => `M${cx} ${cy - r} A${r} ${r} 0 0 ${out} ${cx} ${cy + r} Z`
  const stripe = (rx: number) => `M${cx} ${cy - MR + 0.4} A${rx} ${MR - 0.4} 0 0 ${out} ${cx} ${cy + MR - 0.4}`
  return (
    <>
      <path d={half(MR)} fill={RIND} />
      <path d={stripe(5.5)} fill="none" stroke={RIND_DARK} strokeWidth="1.3" strokeLinecap="round" />
      <path d={stripe(10.5)} fill="none" stroke={RIND_DARK} strokeWidth="1.3" strokeLinecap="round" />
      {side === -1 ? <ellipse cx={cx - 8} cy={cy - 7} rx="2.2" ry="3.4" fill="#79c98c" transform={`rotate(30 ${cx - 8} ${cy - 7})`} /> : null}
      {bulge > 0.2 ? (
        <>
          <path d={`M${cx} ${cy - MR + 0.4} A${bulge + 1.3} ${MR - 0.4} 0 0 ${inn} ${cx} ${cy + MR - 0.4} Z`} fill={RIND_LIGHT} />
          <path d={`M${cx} ${cy - MR + 1.8} A${bulge} ${MR - 1.8} 0 0 ${inn} ${cx} ${cy + MR - 1.8} Z`} fill={FLESH} />
          {bulge > 2.5
            ? [-7, -1.5, 4.5].map((dy, i) => <ellipse key={dy} cx={cx - side * (bulge * 0.5 + (i % 2) * 0.4)} cy={cy + dy} rx="0.7" ry="1.3" fill={SEED} />)
            : null}
        </>
      ) : null}
    </>
  )
}

/** すいか: 切るまでは ぴったり くっついた まるい すいか。切ると 左右に ころがる。 */
/** すいかの かげ(テーブルの上に のる) */
function MelonShadow({ t }: SceneProps) {
  const pop = span(t, POP, POP + 0.55, backOut)
  const dx = (MR * 50 * Math.PI) / 180 * span(t, HIT, HIT + 1.1, easeOut)
  return <ellipse cx={MELON[0]} cy={TABLE_TOP + 1.2} rx={Math.max(0, (MR + 2 + dx * 1.6) * pop)} ry="1.8" fill="#000000" opacity="0.14" />
}

function Melon({ t }: SceneProps) {
  const pop = span(t, POP, POP + 0.55, backOut)
  // ころがる: まるい ので、ころがった きょり = はんけい x 角度。さいごは ゆらゆら ゆれて とまる
  const roll = span(t, HIT, HIT + 1.1, easeOut)
  const wobble = t > HIT + 1.1 ? Math.sin((t - HIT - 1.1) * 12) * 2.2 * Math.exp(-(t - HIT - 1.1) * 3.2) : 0
  const angle = 50 * roll + wobble
  const dx = (MR * angle * Math.PI) / 180
  const bulge = 5 * span(t, HIT + 0.1, HIT + 0.8, easeOut)
  return (
    <>
      <Layer scale={pop} origin={[MELON[0], TABLE_TOP]}>
        <Layer x={-dx} rotate={-angle} origin={MELON}>
          <MelonHalf side={-1} bulge={bulge} />
        </Layer>
        <Layer x={dx} rotate={angle} origin={MELON}>
          <MelonHalf side={1} bulge={bulge} />
        </Layer>
      </Layer>
    </>
  )
}

/** 切った しゅんかん の ひかり と、とびちる しる。 */
function CutBurst({ t }: SceneProps) {
  const tau = t - HIT
  if (tau < 0 || tau > 1.1) return null
  const flash = during(t, HIT, HIT + 0.3, 0.1)
  const drops: readonly (readonly [number, number])[] = [
    [-16, -22],
    [-9, -30],
    [-4, -26],
    [5, -28],
    [11, -31],
    [17, -22],
  ]
  return (
    <>
      <rect x={MELON[0] - 0.9} y={MELON[1] - MR - 3} width="1.8" height={MR * 2 + 6} rx="0.9" fill="#ffffff" opacity={flash} />
      <g opacity={1 - span(t, HIT + 0.5, HIT + 1.1)}>
        {drops.map(([vx, vy], i) => (
          <circle key={i} cx={MELON[0] + vx * tau} cy={MELON[1] - 4 + vy * tau + 60 * tau * tau} r={1.5 - tau * 0.5} fill={FLESH} />
        ))}
      </g>
    </>
  )
}

/** かたな: つなぎめ(P)から 下に 刃、上に 木の え。 */
function Knife({ x, y }: { readonly x: number; readonly y: number }) {
  return (
    <Layer x={x} y={y}>
      <path d={`M-3.3 0 H3.3 V${BLADE - 3} Q3.3 ${BLADE} 0 ${BLADE + 0.6} Q-3.3 ${BLADE} -3.3 ${BLADE - 3} Z`} fill={STEEL} />
      <path d={`M1 0 H3.3 V${BLADE - 3} Q3.3 ${BLADE} 1 ${BLADE + 0.4} Z`} fill={STEEL_DARK} />
      <rect x="-2.5" y={-HANDLE_LEN} width="5" height={HANDLE_LEN + 0.6} rx="1.8" fill={HANDLE} />
      <circle cx="0" cy={-HANDLE_LEN + 2} r="0.7" fill="#5a3b2a" />
      <circle cx="0" cy="-2" r="0.7" fill="#5a3b2a" />
    </Layer>
  )
}

type GirlMood = 'worry' | 'idea' | 'focus' | 'happy'

function GirlFace({ mood, look }: { readonly mood: GirlMood; readonly look: number }) {
  const line = { fill: 'none', stroke: HAIR, strokeWidth: 1.1, strokeLinecap: 'round' } as const
  return (
    <>
      <circle cx="80.8" cy="32.6" r="1.9" fill={CHEEK} opacity="0.55" />
      <circle cx="91.2" cy="32.6" r="1.9" fill={CHEEK} opacity="0.55" />
      {mood === 'happy' ? (
        <>
          <path d="M81 30.2 Q82.7 28 84.4 30.2" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M87.6 30.2 Q89.3 28 91 30.2" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M83.4 33.4 Q86 37.6 88.6 33.4 Z" fill={MOUTH} />
        </>
      ) : (
        <>
          {mood === 'idea' ? (
            <>
              <circle cx="82.7" cy="29.8" r="1.8" fill={EYE} />
              <circle cx="89.3" cy="29.8" r="1.8" fill={EYE} />
              <circle cx="83.3" cy="29.1" r="0.6" fill="#ffffff" />
              <circle cx="89.9" cy="29.1" r="0.6" fill="#ffffff" />
              <path d="M80.8 25.4 Q82.6 24 84.4 25.4 M87.6 25.4 Q89.4 24 91.2 25.4" {...line} />
              <ellipse cx="86" cy="34.4" rx="1.4" ry="1.9" fill={MOUTH} />
            </>
          ) : (
            <>
              <circle cx={82.7 + look} cy="29.8" r="1.2" fill={EYE} />
              <circle cx={89.3 + look} cy="29.8" r="1.2" fill={EYE} />
              {mood === 'worry' ? (
                <>
                  <path d="M80.4 27.6 L84.2 26.2 M87.8 26.2 L91.6 27.6" {...line} />
                  <path d="M83.6 34.4 q1.2 -1.3 2.4 0 q1.2 1.3 2.4 0" {...line} stroke={MOUTH} />
                </>
              ) : (
                <>
                  <path d="M80.6 26.6 L84.2 27.8 M87.8 27.8 L91.4 26.6" {...line} />
                  <path d="M84.2 34.4 H87.8" {...line} stroke={MOUTH} />
                </>
              )}
            </>
          )}
        </>
      )}
    </>
  )
}

/** 女の子: テーブルの むこうがわ。かお と どう だけ(うで は まえの そうに 出す) */
function GirlBody({ mood, look, y }: { readonly mood: GirlMood; readonly look: number; readonly y: number }) {
  return (
    <Layer y={y}>
      <circle cx="76.6" cy="27" r="3.6" fill={HAIR} />
      <circle cx="95.4" cy="27" r="3.6" fill={HAIR} />
      <rect x="77" y="40" width="18" height="40" rx="7" fill={DRESS} />
      <path d="M81 41 Q86 46 91 41" fill="none" stroke={DRESS_DARK} strokeWidth="1.6" strokeLinecap="round" />
      <rect x="83.8" y="36" width="4.4" height="6" rx="2" fill={SKIN_SHADE} />
      <circle cx="86" cy="29" r="9" fill={SKIN} />
      <path d="M76.8 28.4 C76.4 17.6 95.6 17.6 95.2 28.4 C92.6 23.6 80 23.6 76.8 28.4 Z" fill={HAIR} />
      <GirlFace mood={mood} look={look} />
    </Layer>
  )
}

type BunnyMood = 'hungry' | 'happy'

function BunnyFace({ mood }: { readonly mood: BunnyMood }) {
  return (
    <>
      <circle cx="16.6" cy="39.4" r="1.8" fill={CHEEK} opacity="0.6" />
      <circle cx="27.4" cy="39.4" r="1.8" fill={CHEEK} opacity="0.6" />
      <ellipse cx="22" cy="38.8" rx="1.2" ry="0.9" fill={PINK} />
      {mood === 'happy' ? (
        <>
          <path d="M17 36.8 Q18.7 34.6 20.4 36.8 M23.6 36.8 Q25.3 34.6 27 36.8" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M19.8 40.6 Q22 44.2 24.2 40.6 Z" fill={MOUTH} />
        </>
      ) : (
        <>
          <circle cx="18.6" cy="36.6" r="1.2" fill={EYE} />
          <circle cx="25.4" cy="36.6" r="1.2" fill={EYE} />
          <path d="M16.6 35 L20.4 33.6 M27.4 35 L23.6 33.6" fill="none" stroke="#8d7a6e" strokeWidth="1" strokeLinecap="round" />
          <path d="M20.2 42.2 q0.9 -1.2 1.8 0 q0.9 1.2 1.8 0" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
        </>
      )}
    </>
  )
}

/** うさぎ: おなかが ぐう。切れたら ぴょんぴょん。 */
function Bunny({ t }: SceneProps) {
  const rise = span(t, UP + 0.15, UP + 0.75, backOut)
  const happy = t >= HIT + 0.4
  const cheer = span(t, CHEER - 0.4, CHEER)
  const hop = happy ? Math.abs(wave(t - CHEER, 0.8)) * 6 * cheer * (1 - span(t, INK - 0.5, INK)) : 0
  const growl = during(t, GROWL, IDEA + 0.3, 0.2)
  const shake = Math.sin(t * 40) * 0.3 * growl
  const earTilt = mix(t, HIT + 0.2, HIT + 0.7, 32, 5)
  const pawUp = span(t, HIT + 0.4, HIT + 0.8, easeOut)
  return (
    <Layer x={shake} y={SINK * (1 - rise) - hop}>
      <Layer rotate={-earTilt} origin={[18, 30]}>
        <ellipse cx="18" cy="20" rx="3.4" ry="9.5" fill={BUNNY} />
        <ellipse cx="18" cy="21" rx="1.7" ry="6.4" fill={PINK} />
      </Layer>
      <Layer rotate={earTilt} origin={[26, 30]}>
        <ellipse cx="26" cy="20" rx="3.4" ry="9.5" fill={BUNNY} />
        <ellipse cx="26" cy="21" rx="1.7" ry="6.4" fill={PINK} />
      </Layer>
      <ellipse cx="22" cy="62" rx="10.5" ry="16" fill={BUNNY} />
      <ellipse cx="22" cy="58" rx="6" ry="7.5" fill={BUNNY_SHADE} />
      <ellipse cx="22" cy="37" rx="9.6" ry="8.6" fill={BUNNY} />
      <BunnyFace mood={happy ? 'happy' : 'hungry'} />
      {/* て: おなかを おさえる → ばんざい(かた から 出た うで) */}
      <path d={`M14 50 L${mix(t, HIT + 0.4, HIT + 0.8, 18, 8, easeOut)} ${50 - pawUp * 16}`} fill="none" stroke={BUNNY} strokeWidth="4.4" strokeLinecap="round" />
      <path d={`M30 50 L${mix(t, HIT + 0.4, HIT + 0.8, 26, 36, easeOut)} ${50 - pawUp * 16}`} fill="none" stroke={BUNNY} strokeWidth="4.4" strokeLinecap="round" />
      <circle cx={mix(t, HIT + 0.4, HIT + 0.8, 18, 8, easeOut)} cy={50 - pawUp * 16} r="2.8" fill={BUNNY_SHADE} />
      <circle cx={mix(t, HIT + 0.4, HIT + 0.8, 26, 36, easeOut)} cy={50 - pawUp * 16} r="2.8" fill={BUNNY_SHADE} />
    </Layer>
  )
}

/** おなかの「ぐう」: うさぎの よこに ふるえる せん。 */
function Growl({ t }: SceneProps) {
  const show = during(t, GROWL, IDEA + 0.3, 0.2)
  if (show <= 0) return null
  const w = wave(t, 0.3)
  return (
    <g opacity={show} fill="none" stroke="#c98a52" strokeWidth="1.2" strokeLinecap="round">
      <path d={`M${9 - w} 50 q-2.4 1.8 0 3.6 q2.4 1.8 0 3.6`} />
      <path d={`M${35 + w} 50 q2.4 1.8 0 3.6 q-2.4 1.8 0 3.6`} />
    </g>
  )
}

/** 女の子の ひらめき: あたまの上に ぴかぴか。 */
function IdeaRays({ t }: SceneProps) {
  const show = during(t, IDEA - 0.1, READY + 0.1, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show} stroke={SUN} strokeWidth="1.7" strokeLinecap="round">
      {[-130, -90, -50].map((deg) => {
        const rad = (deg * Math.PI) / 180
        return <line key={deg} x1={86 + Math.cos(rad) * 12} y1={29 + Math.sin(rad) * 12} x2={86 + Math.cos(rad) * 16} y2={29 + Math.sin(rad) * 16} />
      })}
    </g>
  )
}

/** こまっている ときの あせ。 */
function Sweat({ t }: SceneProps) {
  const show = during(t, GROWL, IDEA, 0.25)
  if (show <= 0) return null
  return <path d="M0 -2.6 Q2.2 0.6 0 2.2 Q-2.2 0.6 0 -2.6 Z" fill="#7cc4f2" opacity={show} transform={`translate(96.5 ${19 + wave(t, 1.2) * 0.8})`} />
}

function Heart({ x, y, size, opacity }: { readonly x: number; readonly y: number; readonly size: number; readonly opacity: number }) {
  return <path d="M0 2 C-3.6 -0.6 -2.2 -3.8 0 -2.2 C2.2 -3.8 3.6 -0.6 0 2 Z" fill="#f2688a" opacity={opacity} transform={`translate(${x} ${y}) scale(${size})`} />
}

/** うれしい ハート: ふたりの あたまの上に ふわり。 */
function Hearts({ t }: SceneProps) {
  const p = span(t, CHEER, INK - 0.3)
  if (p <= 0 || p >= 1) return null
  const fade = Math.sin(p * Math.PI)
  return (
    <>
      <Heart x={14 + Math.sin(p * 6) * 1.5} y={13 - p * 4} size={1.5} opacity={fade} />
      <Heart x={32 + Math.sin(p * 6 + 2) * 1.5} y={16 - p * 4} size={1.1} opacity={fade} />
      <Heart x={54 + Math.sin(p * 6 + 1) * 1.5} y={20 - p * 4} size={1.4} opacity={fade} />
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  const riseGirl = span(t, UP, UP + 0.6, backOut)
  const sink = SINK * (1 - riseGirl)
  const mood: GirlMood = t < IDEA ? 'worry' : t < READY ? 'idea' : t < HIT + 0.3 ? 'focus' : 'happy'
  // 女の子は はじめ、うさぎ(左)を 見ている
  const look = mix(t, IDEA - 0.3, IDEA, -1.2, 0)

  // かたなを にぎった 手: かげから 出して 高く → すぱっ → はなして ばんざい
  const rest: Pt = [80, 82]
  const lift = span(t, IDEA, READY, easeOut)
  const chop = span(t, CHOP, HIT, easeIn)
  const free = span(t, CHEER - 0.3, CHEER + 0.3, easeOut)
  const gripY = (t < CHOP ? mix(t, IDEA, READY, rest[1], P_READY - GRIP, easeOut) : P_READY - GRIP + (P_CUT - P_READY) * chop) + (t >= READY && t < CHOP ? wave(t, 0.25) * 0.5 : 0)
  const gripX = t < CHOP ? rest[0] + (KNIFE_X - rest[0]) * lift : KNIFE_X
  const cheerL: Pt = [68 + wave(t, 0.5) * 2, 4]
  const handL: Pt = free > 0 ? [KNIFE_X + (cheerL[0] - KNIFE_X) * free, gripY + (cheerL[1] - gripY) * free] : [gripX, gripY + (t < IDEA ? sink : 0)]
  const cheerR: Pt = [92 - wave(t, 0.5) * 2, 4]
  const waveR = span(t, CHEER - 0.3, CHEER + 0.3, easeOut)
  const handR: Pt = [96 + (cheerR[0] - 96) * waveR, 82 + (cheerR[1] - 82) * waveR]
  const prefL: Pt = free > 0.5 ? [-1, 0] : [1, -0.4]
  const knifeX = t < CHEER ? gripX : KNIFE_X
  const knifeY = t < CHEER ? gripY + GRIP : P_CUT

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} />
        <Layer opacity={t < UP + 0.05 ? 0 : 1}>
          <Bunny t={t} />
          <GirlBody mood={mood} look={look} y={sink} />
        </Layer>
        <Melon t={t} />
        <CutBurst t={t} />
        {/* うで と かたな: すいかの まえ、テーブルの うしろ */}
        {t >= IDEA - 0.01 ? <Knife x={knifeX} y={knifeY} /> : null}
        {t >= IDEA - 0.01 ? <Arm shoulder={[GIRL_SHOULDER_L[0], GIRL_SHOULDER_L[1] + sink]} hand={handL} pref={prefL} color={DRESS_DARK} /> : null}
        {t >= CHEER - 0.3 ? <Arm shoulder={[GIRL_SHOULDER_R[0], GIRL_SHOULDER_R[1] + sink]} hand={handR} pref={[1, 0]} color={DRESS_DARK} /> : null}
        <Table t={t} />
        {/* てまえの 地面: テーブルの したに もぐった ふたり・かたなを かくす */}
        <rect x="0" y="97" width="109" height="12" fill={GRASS} />
        <MelonShadow t={t} />
        <Growl t={t} />
        <IdeaRays t={t} />
        <Sweat t={t} />
        <Hearts t={t} />
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
    { at: 0, label: 'テーブルに 大きな すいか', sound: 'pop' },
    { at: UP, label: 'うさぎと 女の子が 出てくる' },
    { at: GROWL, label: 'うさぎの おなかが ぐう。女の子は こまりがお' },
    { at: IDEA, label: '「そうだ!」と ひらめいて、かたなを 高く かまえる', sound: 'pop' },
    { at: HIT, label: 'すぱっ と 切ると、すいかが 左右に ころがる', sound: 'stroke' },
    { at: CHEER, label: 'ふたりとも にこにこ。ハートが ふわり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '分 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene

