/*
 * 七(なな): ながい パンを、たてに すぱっと きる。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 二つの だい の上に のった ながい パン(よこ ぼう)
 *   2画目(亅)  … パンを たてに きる ナイフ(てっぺんの 持ち手 から ささった 刃)。
 *                  その下へ のびて 右へ まがる 白い線は、きった ときの「すぱっ」という きりくちの かぜ
 *
 * ながれ
 *   だいが できて、ながい パンが のる → おなかを すかせた こどもが ぴょんぴょん やってくる
 *   → ながすぎて こまる(おなかが ぐう・あせ) → 「あっ」と ひらめいて ナイフを もつ
 *   → ふりあげて、たてに すぱっと きる(パンくずが とぶ・白い かぜの線)
 *   → きれて にっこり。ナイフは パンの まんなかに ささったまま
 *   → ほね が ひかって、絵が うすくなり、字「七」が のこる
 *
 * こどもは、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。パンの うしろに 立っているので、パンが おなかを かくす。
 *   ナイフは 字の形に 合わせて 作るのではなく、ふりおろして きった ときの 場所に 刃が くる。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '七'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const JACKET = '#f2705a'
const JACKET_DARK = '#d9573f'
const HAT = '#ffffff'
const HAT_SHADE = '#dfe6ee'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const CRUST = '#e3a255'
const CRUST_DARK = '#c47f35'
const CRUMB = '#fbe7b8'
const WOOD = '#b07848'
const WOOD_DARK = '#8c5b3c'
const STEEL = '#b4c3d3'
const STEEL_LIGHT = '#eef4fa'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'

/** くぎり の時間(秒) */
const WALK = 0.9
const WORRY = 1.9
const IDEA = 2.9
/** ナイフを ふりあげはじめる / ふりあげ おわり */
const RAISE = 3.1
const READY = 4.0
/** ふりおろす(CUT で パンに とどく) */
const CHOP = 4.5
const CUT = 4.68
const INK = 6.6
const DONE = 9.4
const DURATION = 10

/** こどもの まんなか(x)。パンの うしろに 立つ */
const KID_X = 66
/** かた(左は ナイフの うで、右は パンに のせる うで) */
const SHOULDER_L: readonly [number, number] = [59.5, 33]
const SHOULDER_R: readonly [number, number] = [72.5, 33]
/** うで の ぶぶん の長さ(かた→ひじ、ひじ→手) */
const ARM_PART = 12

/** パンの 中心線: 1画目の はじまり (15.5, 51.8) から おわり (93.3, 44) */
const BREAD_ANGLE = (Math.atan2(44 - 51.8, 93.3 - 15.5) * 180) / Math.PI
/** ナイフで きる ばしょ(パンの 中心線の上) */
const CUT_POINT: readonly [number, number] = [45, 48.84]
const BREAD_THICK = 9
/** ナイフの 持ち手の まんなか(手で にぎる ところ) */
const GRIP: readonly [number, number] = [45, 25.5]
/** 2画目の うち、パンの したから はじまる 「すぱっ」の線の はじまり(画の長さの わりあい) */
const WIND_FROM = 0.31

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun} fill={SUN} />
      {/* とおくの おか と、ゆっくり ながれる 雲(おくゆき を出す) */}
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="62" cy="14" rx="7" ry="3.2" />
        <ellipse cx="67" cy="12.4" rx="4.6" ry="3" />
        <ellipse cx="96" cy="26" rx="6" ry="2.8" />
        <ellipse cx="100.5" cy="24.4" rx="4.2" ry="2.8" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 40, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** パンを のせる だい。ひくい ほうと たかい ほうを ならべて、パンが 1画目と おなじ むき(右が 少し上がる)に のる。 */
function Stand({ cx, topY, grow }: { readonly cx: number; readonly topY: number; readonly grow: number }) {
  return (
    <Layer scaleY={grow} scaleX={0.6 + 0.4 * grow} origin={[cx, 97.5]}>
      <path d={`M${cx - 6.5} 97.5 L${cx - 5} ${topY} H${cx - 2.6} L${cx - 4} 97.5 Z`} fill={WOOD_DARK} />
      <path d={`M${cx + 6.5} 97.5 L${cx + 5} ${topY} H${cx + 2.6} L${cx + 4} 97.5 Z`} fill={WOOD_DARK} />
      <rect x={cx - 8} y={topY - 0.2} width="16" height="3.6" rx="1.6" fill={WOOD} />
    </Layer>
  )
}

/** パンの はんぶん。ほんものの バゲット: 外がわは まるく、きりくちは まっすぐで 白い。 */
function BreadHalf({ side, gap }: { readonly side: 'left' | 'right'; readonly gap: number }) {
  const [px, py] = CUT_POINT
  const half = BREAD_THICK / 2
  const left = side === 'left'
  // 中心線にそった ながさ(左: 14〜45 / 右: 45〜94 を ななめ分 のばす)
  const length = left ? 31.2 : 49.2
  const x0 = left ? px - length : px
  const faceX = left ? px - 1.7 : px
  return (
    <Layer x={left ? -gap : gap} rotate={BREAD_ANGLE} origin={[px, py]}>
      <rect x={x0} y={py - half} width={length} height={BREAD_THICK} rx={half} fill={CRUST} />
      {/* きりくちの がわ だけ まっすぐに する */}
      <rect x={left ? px - 8 : px} y={py - half} width="8" height={BREAD_THICK} fill={CRUST} />
      <rect x={faceX} y={py - half + 0.6} width="1.7" height={BREAD_THICK - 1.2} fill={CRUMB} />
      {/* バゲットの 切れこみ(うえに ななめの すじ) */}
      {(left ? [-24, -16, -8] : [8, 17, 26, 35, 44]).map((dx) => (
        <path key={dx} d={`M${px + dx} ${py - 2.8} l3.6 -1.2`} stroke={CRUST_DARK} strokeWidth="1.3" strokeLinecap="round" fill="none" />
      ))}
      {/* したの かげ */}
      <path d={`M${x0 + half} ${py + half - 0.3} H${left ? px : px + length - half}`} stroke={CRUST_DARK} strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </Layer>
  )
}

/** ナイフ。持ち手が 上、刃が 下(まっすぐ ふりおろす)。 */
function Knife() {
  return (
    <>
      <rect x="43.3" y="19.4" width="3.4" height="11.8" rx="1.6" fill={WOOD_DARK} />
      <rect x="42.6" y="30.4" width="4.8" height="1.6" rx="0.8" fill="#9aa8b8" />
      <path d="M42.8 32 H47.6 V53.2 Q47.6 55 45.8 55.6 L42.8 54.6 Z" fill={STEEL} stroke="#8497ab" strokeWidth="0.6" strokeLinejoin="round" />
      <path d="M43.6 33 H44.7 V53.6 L43.6 53.2 Z" fill={STEEL_LIGHT} />
    </>
  )
}

type Pt = readonly [number, number]

/** かた から ひじ、ひじ から 手 へ つながる うで。target に 手が とどくように ひじを まげる(とどかない ときは のばしきる)。 */
function armJoints(shoulder: Pt, target: Pt, outward: 1 | -1): { readonly elbow: Pt; readonly hand: Pt } {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.max(Math.hypot(dx, dy), 0.01)
  const reach = Math.min(dist, ARM_PART * 2 - 0.2)
  const ux = dx / dist
  const uy = dy / dist
  const hand: Pt = [shoulder[0] + ux * reach, shoulder[1] + uy * reach]
  const mid: Pt = [(shoulder[0] + hand[0]) / 2, (shoulder[1] + hand[1]) / 2]
  const bend = Math.sqrt(Math.max(ARM_PART ** 2 - (reach / 2) ** 2, 0))
  // ひじは そとがわ・した むき に でる
  const a: Pt = [-uy, ux]
  const b: Pt = [uy, -ux]
  const score = (p: Pt) => outward * p[0] + 0.5 * p[1]
  const dir = score(a) >= score(b) ? a : b
  return { elbow: [mid[0] + dir[0] * bend, mid[1] + dir[1] * bend], hand }
}

function Arm({ shoulder, target, outward }: { readonly shoulder: Pt; readonly target: Pt; readonly outward: 1 | -1 }) {
  const { elbow, hand } = armJoints(shoulder, target, outward)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={JACKET_DARK} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.3" fill={SKIN} />
    </>
  )
}

type Mood = 'hungry' | 'idea' | 'focus' | 'happy'

function Face({ mood }: { readonly mood: Mood }) {
  const cheek = <><circle cx="59.6" cy="24.4" r="2" fill="#ff9d9d" opacity="0.55" /><circle cx="72.4" cy="24.4" r="2" fill="#ff9d9d" opacity="0.55" /></>
  if (mood === 'hungry') {
    // まゆ が ハの字(こまった)、口は ふにゃっと
    return (
      <>
        {cheek}
        <path d="M59.8 17.6 L63.8 16.2 M68.2 16.2 L72.2 17.6" stroke="#5a3b2a" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="62.2" cy="20.8" r="1.2" fill={EYE} />
        <circle cx="69.8" cy="20.8" r="1.2" fill={EYE} />
        <path d="M63.4 26.2 q0.9 -1.3 1.8 0 q0.9 1.3 1.8 0 q0.9 -1.3 1.8 0" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
      </>
    )
  }
  if (mood === 'idea') {
    // 目を まるく あけて、口は「あっ」
    return (
      <>
        {cheek}
        <path d="M60 16.4 Q62.2 14.8 64.4 16.2 M67.6 16.2 Q69.8 14.8 72 16.4" fill="none" stroke="#5a3b2a" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="62.2" cy="20.4" r="1.8" fill={EYE} />
        <circle cx="69.8" cy="20.4" r="1.8" fill={EYE} />
        <circle cx="62.7" cy="19.8" r="0.6" fill="#ffffff" />
        <circle cx="70.3" cy="19.8" r="0.6" fill="#ffffff" />
        <ellipse cx="66" cy="25.6" rx="1.5" ry="2" fill={MOUTH} />
      </>
    )
  }
  if (mood === 'focus') {
    // まゆ が 中心へ さがる(きりっ)、口は 一文字
    return (
      <>
        {cheek}
        <path d="M59.8 16 L63.8 17.6 M68.2 17.6 L72.2 16" stroke="#5a3b2a" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="62.2" cy="20.6" r="1.25" fill={EYE} />
        <circle cx="69.8" cy="20.6" r="1.25" fill={EYE} />
        <path d="M63.6 25.8 H68.4" stroke={MOUTH} strokeWidth="1.3" strokeLinecap="round" />
      </>
    )
  }
  // にっこり: 目は わらって とじる、口は 大きく あける
  return (
    <>
      {cheek}
      <path d="M60 21.8 Q62.2 18.8 64.4 21.8 M67.6 21.8 Q69.8 18.8 72 21.8" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M62.2 24.2 Q66 30 69.8 24.2 Z" fill={MOUTH} />
      <path d="M64.2 27.4 Q66 25.8 67.8 27.4 Q66 28.6 64.2 27.4 Z" fill="#ff8a8a" />
    </>
  )
}

type KidProps = { readonly mood: Mood; readonly tilt: number; readonly breath: number; readonly hat: number }

/** こども(ぜんぶ 正面むき)。あたま・どう・あし。うで は パンの 前に 出るので 別に かく。 */
function Kid({ mood, tilt, breath, hat }: KidProps) {
  return (
    <>
      {/* あし */}
      <rect x="59.6" y="60" width="6" height="33.6" rx="3" fill={PANTS} />
      <rect x="67.4" y="60" width="6" height="33.6" rx="3" fill={PANTS} />
      <ellipse cx="61.2" cy="95.2" rx="5.4" ry="2.8" fill={SHOE} />
      <ellipse cx="71.8" cy="95.2" rx="5.4" ry="2.8" fill={SHOE} />
      {/* くび(みじかく、どう と あたま の間) */}
      <rect x="63.4" y="26" width="5.2" height="7" rx="2.2" fill={SKIN_SHADE} />
      {/* どう: いきに あわせて 少し ふくらむ */}
      <Layer scaleX={1 + breath * 0.04} scaleY={1 + breath * 0.02} origin={[KID_X, 64]}>
        <rect x="57.5" y="29" width="17" height="36" rx="7" fill={JACKET} />
        <path d="M66 33 V63" stroke={JACKET_DARK} strokeWidth="1.2" />
        <circle cx="63.2" cy="42" r="1.1" fill="#ffffff" />
        <circle cx="63.2" cy="50" r="1.1" fill="#ffffff" />
      </Layer>
      {/* あたま と コックぼう */}
      <Layer rotate={tilt} origin={[KID_X, 29]}>
        <circle cx={KID_X} cy="20" r="9" fill={SKIN} />
        <Face mood={mood} />
        <Layer rotate={hat} origin={[KID_X, 13]}>
          <circle cx="61.4" cy="7.6" r="4.4" fill={HAT} />
          <circle cx="70.6" cy="7.6" r="4.4" fill={HAT} />
          <circle cx={KID_X} cy="5.8" r="4.8" fill={HAT} />
          <rect x="57.6" y="9.4" width="16.8" height="5" rx="2.2" fill={HAT} />
          <rect x="57.6" y="12.6" width="16.8" height="1.8" rx="0.9" fill={HAT_SHADE} />
        </Layer>
      </Layer>
    </>
  )
}

/** おなかが「ぐう」: こどもの よこで ふるえる しるし。 */
function Rumble({ t }: SceneProps) {
  const show = during(t, WORRY + 0.15, IDEA, 0.2)
  if (show <= 0) return null
  const sway = wave(t, 0.3) * 0.8
  return (
    <g opacity={show} fill="none" stroke="#7b8aa8" strokeWidth="1" strokeLinecap="round">
      <path d={`M${54 + sway} 36 q-2.4 2.6 0 5.2 q2.4 2.6 0 5.2`} />
      <path d={`M${50.4 + sway} 37.4 q-2 2.2 0 4.4 q2 2.2 0 4.4`} />
      <path d={`M${78 - sway} 36 q2.4 2.6 0 5.2 q-2.4 2.6 0 5.2`} />
      <path d={`M${81.6 - sway} 37.4 q2 2.2 0 4.4 q-2 2.2 0 4.4`} />
    </g>
  )
}

/** こまった あせ。あたまの よこから つたって おちる。 */
function Sweat({ t }: SceneProps) {
  const show = during(t, WORRY + 0.3, IDEA, 0.2)
  if (show <= 0) return null
  const p = ((t - WORRY) % 0.8) / 0.8
  return <path d="M0 -2.6 Q2.2 0.6 0 2.2 Q-2.2 0.6 0 -2.6 Z" fill="#7cc4f2" opacity={show * (1 - p * 0.7)} transform={`translate(${77.4 + p * 1.2} ${13 + p * 9})`} />
}

/** 「あっ」と ひらめく。あたまの よこに ほし と ひかりの すじ。 */
function Idea({ t }: SceneProps) {
  const show = during(t, IDEA, IDEA + 1.0, 0.2)
  if (show <= 0) return null
  const pop = span(t, IDEA, IDEA + 0.3, backOut)
  return (
    <g opacity={show}>
      <Layer scale={pop} origin={[84, 12]}>
        <Star cx={84} cy={12} r={5.6} color="#ffd24a" spin={wave(t, 0.5) * 12} />
        {[-50, -10, 30].map((deg) => (
          <path key={deg} d="M0 -9 V-12.4" stroke="#ffb629" strokeWidth="1.3" strokeLinecap="round" transform={`translate(84 12) rotate(${deg + 90})`} />
        ))}
      </Layer>
    </g>
  )
}

/** ふりおろす ときの「しゅっ」という すじ(ナイフの よこ)。 */
function SwingLines({ t }: SceneProps) {
  const show = during(t, CHOP, CUT + 0.05, 0.05)
  if (show <= 0) return null
  return (
    <g opacity={show} stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round">
      <path d="M40.4 17 V30" />
      <path d="M50 20 V34" />
      <path d="M52.6 16 V26" />
    </g>
  )
}

/** きった しゅんかん の パンくず。きりくちから ぽんと とび、おちる。 */
function Crumbs({ t }: SceneProps) {
  const p = span(t, CUT, CUT + 0.9)
  if (p <= 0 || p >= 1) return null
  const bits: readonly [vx: number, vy: number][] = [[-11, 15], [-6, 20], [4, 18], [9, 13], [13, 17], [0, 22]]
  return (
    <g opacity={1 - p * p}>
      {bits.map(([vx, vy]) => (
        <circle key={vx} cx={CUT_POINT[0] + vx * p} cy={CUT_POINT[1] - 3 - vy * p + 26 * p * p} r="1.3" fill={CRUST} />
      ))}
    </g>
  )
}

/** きった あとの「すぱっ」: パンの したへ のびて 右へ まがる 白い かぜ(2画目の 下がわ)。 */
function Slash({ t }: SceneProps) {
  const grow = span(t, CUT, CUT + 0.5, easeOut)
  const fade = 1 - span(t, CUT + 0.9, CUT + 1.5)
  if (grow <= 0 || fade <= 0) return null
  const to = WIND_FROM + (1 - WIND_FROM) * grow
  return (
    <g opacity={fade}>
      <Bone char={CHAR} n={2} color="#bfe6ff" width={5.4} opacity={0.6} from={WIND_FROM} to={to} />
      <Bone char={CHAR} n={2} color="#ffffff" width={2.6} from={WIND_FROM} to={to} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 2)

  // だい が のびて、パンが ぽんと のる
  const stand = span(t, 0.2, 0.7, backOut)
  const drop = span(t, 0.6, 1.1, backOut)
  const breadY = -26 * (1 - drop)
  const gap = 1.8 * span(t, CUT, CUT + 0.25, backOut)

  // こども: みぎから ぴょんぴょん(2かい はねて)とんでくる
  const arrive = span(t, WALK, WALK + 0.9, easeOut)
  const hop = arrive > 0 && arrive < 1 ? -Math.abs(Math.sin(arrive * Math.PI * 2)) * 5 : 0
  const kidX = 38 * (1 - arrive)
  const kidShow = span(t, WALK - 0.05, WALK + 0.1)
  const cheer = span(t, CUT + 0.2, CUT + 0.5)
  const bounce = Math.abs(wave(t - CUT, 0.7)) * -1.6 * cheer
  const mood: Mood = t < IDEA ? 'hungry' : t < READY - 0.1 ? 'idea' : t < CUT ? 'focus' : 'happy'
  const tilt = t < WORRY ? 0 : t < IDEA ? -7 * span(t, WORRY, WORRY + 0.4) : mix(t, IDEA, IDEA + 0.3, -7, 0)
  const breath = wave(t, 1.8)
  const hat = t < CUT ? wave(t, 1.2) * 2 : wave(t, 0.5) * 5

  // ナイフの うで: パンに 手を のせている → ひらめいて ふりあげる → すぱっと ふりおろす
  const rise = span(t, RAISE, READY, easeInOut)
  const windup = span(t, READY, CHOP)
  const chop = span(t, CHOP, CUT, easeIn)
  const handX = mix(t, RAISE, READY, 52, 46, easeInOut) + chop * -1
  const baseY = 43 + (14.5 - 43) * rise
  const handY = baseY - windup * 1 + chop * (GRIP[1] - (14.5 - 1))
  const target: Pt = [handX, handY]
  const knifeShow = span(t, RAISE + 0.45, RAISE + 0.7, backOut)
  const ready = armJoints(SHOULDER_L, target, -1).hand

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Stand cx={22} topY={56.4} grow={stand} />
        <Stand cx={86} topY={48.6} grow={stand} />

        <Layer opacity={kidShow} x={kidX} y={hop + bounce}>
          <Kid mood={mood} tilt={tilt} breath={breath} hat={hat} />
          <Rumble t={t} />
          <Sweat t={t} />
        </Layer>
        <Idea t={t} />

        <Layer y={breadY} opacity={span(t, 0.6, 0.75)}>
          <BreadHalf side="left" gap={gap} />
          <BreadHalf side="right" gap={gap} />
        </Layer>

        {/* うで と ナイフ(パンの 前) */}
        <Layer opacity={kidShow} x={kidX} y={hop + bounce}>
          <Layer opacity={knifeShow > 0 ? 1 : 0} x={ready[0] - GRIP[0]} y={ready[1] - GRIP[1]} scale={1}>
            <Layer scale={Math.max(knifeShow, 0.001)} origin={GRIP}>
              <Knife />
            </Layer>
          </Layer>
          <Arm shoulder={SHOULDER_L} target={target} outward={-1} />
          <Arm shoulder={SHOULDER_R} target={[84, 39.6]} outward={1} />
        </Layer>
        <SwingLines t={t} />
        <Slash t={t} />
        <Crumbs t={t} />
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Ink char={CHAR} progress={ink.progress} tint={ink.tint} />
      <Sparkles cx={54.5} cy={50} progress={ink.sparkle} />
    </>
  )
}

const scene: SceneModule = {
  char: CHAR,
  duration: DURATION,
  beats: [
    { at: 0, label: 'だい が できて、ながい パンが のる', sound: 'pop' },
    { at: WALK, label: 'おなかを すかせた こどもが やってくる' },
    { at: WORRY, label: 'パンが ながすぎて こまる(おなか ぐう)' },
    { at: IDEA, label: 'あっ! ひらめく', sound: 'pop' },
    { at: READY, label: 'ナイフを ふりあげる' },
    { at: CHOP, label: 'たてに すぱっと きる', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '七 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
