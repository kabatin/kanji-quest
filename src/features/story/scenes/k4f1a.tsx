/*
 * 会(あう): ふたが なべに ぴったり あう。
 *
 * ほね(画と絵の対応)
 *   1・2画目(人)  … なべの ふた。てっぺんの つまみ から、左右に ひろがる やね がた の ふた
 *   3画目(一)    … ふたの まんなかに ある、ひかる おび(つや)
 *   4画目(一)    … なべの ふち(ふたの ふちが ぴったり のる ところ)
 *   5画目        … なべの 左の あし。そこの よこ ぼう は、あしの あいだで もえる ひ
 *   6画目        … なべの 右の あし
 *
 * ながれ
 *   ふた の ない なべから ゆげが どんどん にげていく。男の子は あわてて、ふたを つりおろす
 *   ハンドル(まきとりき)に 手を かける
 *   → ハンドルを まわすと、ゆげを おしさげながら ふたが ゆっくり おりてくる
 *   → ふたの ふちが なべの ふちに ぴたっ! ゆげが とまって、男の子は ほっとして とびはねる
 *   → ほね が ひかって、絵が うすくなり、字「会」が のこる
 *
 * 絵は、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   なべ は まるい どうに 3本あし。ふたの ふち は、なべの ふちより 少し ひろくて、上から かぶさる。
 *   男の子は、うで が かた から出て ひじ で まがり、くび は みじかく どう の まんなか の上。
 *   ふたは つな で つる。つな は 上の わく の外へ のびて、ハンドルの つなと つながっている。
 *   ハンドルを まわして つな が くりだされる(ふたが さがる)ぶん だけ、右の つな の ふし が 上へ のぼる。
 */
import { backOut, during, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '会'

const SUN = '#ffd24a'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const BAND = '#e8534a'
const SHIRT = '#f0a24a'
const SHIRT_DARK = '#d98a34'
const APRON = '#ffffff'
const PANTS = '#4a6fa5'
const PANTS_DARK = '#3c5a8a'
const SHOE = '#6b4a36'
const IRON = '#4b5263'
const IRON_DARK = '#3a404f'
const IRON_LIGHT = '#6c7690'
const LID = '#9db4c9'
const LID_SHADE = '#7f9ab3'
const LID_LIGHT = '#e3eef7'
const KNOB = '#e8534a'
const ROPE = '#c9a66b'
const ROPE_DARK = '#a98448'
const WOOD = '#b9794a'
const WOOD_DARK = '#8c5b3c'
const FLAME = '#ff8a3d'
const FLAME_IN = '#ffd24a'
const FOAM = '#fff2c9'
const FOAM_SHADE = '#f0d996'
const STEAM = '#ffffff'
const STEAM_SHADE = '#dfe9f3'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const POT_UP = 0.5
const STEAM_UP = 0.6
/** ふりむいて、ハンドルに 手を かける */
const TURN = 1.4
const GRIP = 1.9
/** ふたが おりはじめる */
const LOWER = 2.0
/** ふたが なべに のる */
const LAND = 4.8
const INK = 6.3
const DONE = 9.0
const DURATION = 9.6

/** なべ: ふちの 高さ と まんなか */
const POT_X = 53
const RIM_TOP = 62
/** ふたの 上の はし(つまみの うえ)から ふちの そこ まで、最初に どれだけ 上に あるか */
const LID_START = -64

/** 男の子: まんなか の x、足もと の y、あたま の まんなか */
const KX = 89.3
const HEAD_Y = 72
const HEAD_R = 6.4
const NECK: readonly [number, number] = [KX, 78.6]
const SHOULDER_NEAR: readonly [number, number] = [91.4, 81.6]
const SHOULDER_FAR: readonly [number, number] = [87.4, 81.6]
/** うで は 2つの ほね(かた→ひじ→手)。1つの 長さ */
const ARM = 6

/** ハンドル(まきとりき)の じく と、にぎる ぼう の はんけい */
const HUB: readonly [number, number] = [99, 80]
const CRANK_R = 3.4
/** ハンドルが まわる 角度: ふたが 1 さがる ごとに 何度 まわるか */
const DEG_PER_DROP = 15
/** 右の つな の 上の はし(わく の外)と、ハンドルに つながる ところ */
const ROPE_TOP: readonly [number, number] = [103, -2]
const ROPE_END: readonly [number, number] = [99, 76.2]
const KNOT_GAP = 9

const rad = (deg: number) => (deg * Math.PI) / 180

/** ふたが いま どれだけ 下がったか(0 〜 | LID_START |) */
function lidOffset(t: number): number {
  const p = span(t, LOWER, LAND, (x) => 1 - (1 - x) ** 2)
  return LID_START * (1 - p)
}

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[11, 11]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="10.4" y="1.8" width="1.6" height="3.6" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 11 11)`} />
        ))}
      </Layer>
      <circle cx="11" cy="11" r={5.4 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 94 V101 H-4 Z" fill="#e2f2d2" />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 44, 90, 103].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** なべの 下で もえる ひ。あしの あいだ(5画目の そこの よこ ぼう)。 */
function Fire({ t }: SceneProps) {
  const flames: readonly (readonly [number, number, number])[] = [
    [41, 0, 1],
    [53, 1.3, 1.25],
    [65, 2.4, 1],
  ]
  return (
    <>
      <rect x="34" y="94.4" width="36" height="3.2" rx="1.6" fill={WOOD_DARK} transform="rotate(-2 52 96)" />
      <rect x="36" y="93.4" width="32" height="3" rx="1.5" fill={WOOD} transform="rotate(2 52 95)" />
      {flames.map(([x, phase, size]) => {
        const flick = 1 + wave(t, 0.5, phase) * 0.14
        return (
          <Layer key={x} x={x} y={93.6} scaleX={size * (1 - wave(t, 0.5, phase) * 0.06)} scaleY={size * flick} origin={[0, 0]}>
            <path d="M0 -9 C3.4 -5 4.4 -1.6 2.4 0.6 C0.8 1.8 -0.8 1.8 -2.4 0.6 C-4.4 -1.6 -3.2 -5 0 -9 Z" fill={FLAME} />
            <path d="M0 -5.2 C1.8 -3 2.2 -1.2 1.2 0 C0.4 0.6 -0.4 0.6 -1.2 0 C-2.2 -1.2 -1.6 -3 0 -5.2 Z" fill={FLAME_IN} />
          </Layer>
        )
      })}
    </>
  )
}

/** ふた の ない なべ: まるい どう、3本あし(うしろの 1本は かくれる)、ふち。 */
function Pot({ t }: SceneProps) {
  const foam = span(t, STEAM_UP, STEAM_UP + 0.4) * (1 - span(t, LAND - 0.45, LAND - 0.1))
  return (
    <>
      {/* あし: 左と右に ひらく */}
      <path d="M41 79 L29.4 95.4" stroke={IRON_DARK} strokeWidth="4.4" strokeLinecap="round" />
      <path d="M66 79 L79 96" stroke={IRON_DARK} strokeWidth="4.4" strokeLinecap="round" />
      {/* ぐつぐつ あわだつ しる(ふちの うしろ から のぞく) */}
      {foam > 0 &&
        [37, 47, 58, 68].map((x, i) => {
          const r = Math.max(0, (2.6 + wave(t, 0.55, i * 0.2) * 0.5) * foam)
          return (
            <g key={x}>
              <circle cx={x} cy={60.8 - Math.abs(wave(t, 0.7, i * 0.3)) * 1.2} r={r} fill={FOAM} />
              <circle cx={x + 0.5} cy={61.8 - Math.abs(wave(t, 0.7, i * 0.3)) * 1.2} r={r * 0.6} fill={FOAM_SHADE} />
            </g>
          )
        })}
      {/* どう */}
      <path d="M25 66 C24 80 36 88.4 53 88.4 C70 88.4 82 80 81 66 Z" fill={IRON} />
      <path d="M29 70 C30 77 35 82 41 84.6" fill="none" stroke={IRON_LIGHT} strokeWidth="2" strokeLinecap="round" />
      {/* ふち(4画目) */}
      <rect x="22" y={RIM_TOP} width="62" height="5.6" rx="2.7" fill={IRON_DARK} />
      <rect x="25" y={RIM_TOP + 0.8} width="26" height="1.4" rx="0.7" fill={IRON_LIGHT} />
    </>
  )
}

/** にげていく ゆげ。ふたが おりてくると、ふたに おされて よこへ ひろがる。 */
function Steam({ t, lidDY }: SceneProps & { readonly lidDY: number }) {
  const leak = span(t, STEAM_UP, STEAM_UP + 0.6) * (1 - span(t, LAND - 0.5, LAND - 0.05))
  if (leak <= 0) return null
  // ふたの ふち の そこ(これより 上へは のぼれない)
  const ceiling = RIM_TOP + lidDY
  return (
    <>
      {Array.from({ length: 7 }, (_, i) => {
        const ph = (t / 2.6 + i / 7) % 1
        const r = 3 + 6 * ph
        const natural = RIM_TOP - 1 - ph * 46
        const limit = ceiling + r + 0.5
        const squeezed = Math.max(0, limit - natural)
        const side = i % 2 === 0 ? 1 : -1
        const x = POT_X + Math.sin(i * 2.3) * 12 * (0.4 + ph) - ph * 9 + side * squeezed * 0.9
        const y = Math.max(natural, limit)
        const alpha = Math.sin(ph * Math.PI) ** 0.7 * leak
        return (
          <g key={i} opacity={alpha}>
            <g fill={STEAM_SHADE} transform={`translate(0 ${r * 0.28})`}>
              <circle cx={x} cy={y} r={r} />
              <circle cx={x - r * 0.7} cy={y + r * 0.25} r={r * 0.7} />
              <circle cx={x + r * 0.7} cy={y + r * 0.2} r={r * 0.65} />
            </g>
            <circle cx={x} cy={y} r={r} fill={STEAM} />
            <circle cx={x - r * 0.7} cy={y + r * 0.25} r={r * 0.7} fill={STEAM} />
            <circle cx={x + r * 0.7} cy={y + r * 0.2} r={r * 0.65} fill={STEAM} />
          </g>
        )
      })}
    </>
  )
}

/** ふたが のった しゅんかん、ふちの すきまから ぷしゅっ と にげる さいごの ゆげ。 */
function Puff({ t }: SceneProps) {
  const p = span(t, LAND, LAND + 0.7, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p}>
      {([-1, 1] as const).map((dir) => {
        const x = dir < 0 ? 21 : 85
        return (
          <g key={dir} fill={STEAM} stroke={STEAM_SHADE} strokeWidth="0.6">
            <circle cx={x + dir * p * 7} cy={60.5 - p * 5} r={2 + p * 1.8} />
            <circle cx={x + dir * (p * 4 - 1)} cy={61 - p * 2} r={1.2 + p} />
          </g>
        )
      })}
    </g>
  )
}

/** ふた(1・2画目 = 人)。つまみ、やね がた、ふち、つや(3画目)。つな で つる。 */
function Lid({ t }: SceneProps) {
  const dy = lidOffset(t)
  // おりてくる あいだ だけ、つなの さきで ゆらゆら(のる しゅんかんには ぴたっと とまる)
  const sway = wave(t, 1.6) * 2.2 * (1 - span(t, LAND - 1.3, LAND - 0.1)) * span(t, LOWER, LOWER + 0.4)
  // のった とき、ふちが 少し つぶれて もどる
  const squash = Math.sin(span(t, LAND, LAND + 0.28) * Math.PI) * 0.05
  return (
    <Layer y={dy} rotate={sway} origin={[52.3, -dy]}>
      <Layer scaleY={1 - squash} origin={[POT_X, RIM_TOP]}>
        {/* ふたの つな(うえの わく の そとへ) */}
        <path d="M52.3 8 L52.3 -140" stroke={ROPE} strokeWidth="1.3" strokeLinecap="round" />
        {/* やね の かたち(かげは 右がわ だけ) */}
        <path d="M52.3 14 L96.5 55.8 L11.3 59.5 Z" fill={LID} />
        <Bone char={CHAR} n={1} color={LID} width={5} />
        <Bone char={CHAR} n={2} color={LID} width={5} />
        <path d="M52.3 14 L96.5 55.8 L53.5 58 Z" fill={LID_SHADE} opacity="0.8" />
        <Bone char={CHAR} n={2} color={LID_SHADE} width={5} />
        {/* つや(3画目) */}
        <Bone char={CHAR} n={3} color={LID_LIGHT} width={2.6} />
        {/* ふち */}
        <rect x="8.6" y={RIM_TOP - 5} width="89.6" height="5" rx="2.5" fill={IRON_DARK} />
        <rect x="12" y={RIM_TOP - 4.2} width="30" height="1.3" rx="0.65" fill={IRON_LIGHT} />
        {/* つまみ */}
        <rect x="50.6" y="10.4" width="3.4" height="5" rx="1.2" fill={IRON_DARK} />
        <circle cx="52.3" cy="9.4" r="3.4" fill={KNOB} />
        <circle cx="51.3" cy="8.2" r="1.1" fill="#ff9a8d" />
      </Layer>
    </Layer>
  )
}

/** つな の ふし。ふたが さがる(つな が くりだされる)と、左の つな では 下へ、右の つな では 上へ のぼる。 */
function Knots({ t }: SceneProps) {
  const drop = lidOffset(t) - LID_START
  // 右の つな: ROPE_TOP から ROPE_END まで
  const len = Math.hypot(ROPE_END[0] - ROPE_TOP[0], ROPE_END[1] - ROPE_TOP[1])
  const knots = Array.from({ length: 11 }, (_, k) => {
    const along = (((k * KNOT_GAP - drop) % (len + KNOT_GAP)) + len + KNOT_GAP) % (len + KNOT_GAP)
    return along
  }).filter((a) => a < len)
  return (
    <>
      <path d={`M${ROPE_TOP[0]} ${ROPE_TOP[1]} L${ROPE_END[0]} ${ROPE_END[1]}`} stroke={ROPE} strokeWidth="1.3" strokeLinecap="round" />
      {knots.map((a, i) => {
        const f = a / len
        return <circle key={i} cx={ROPE_TOP[0] + (ROPE_END[0] - ROPE_TOP[0]) * f} cy={ROPE_TOP[1] + (ROPE_END[1] - ROPE_TOP[1]) * f} r="1.1" fill={ROPE_DARK} />
      })}
    </>
  )
}

/** ハンドル(まきとりき): 木の ぼう に ついた まわる 円ばん。にぎる ぼう は ふちの ちかく。 */
function Winch({ angle }: { readonly angle: number }) {
  const knob: readonly [number, number] = [HUB[0] + Math.cos(rad(angle)) * CRANK_R, HUB[1] + Math.sin(rad(angle)) * CRANK_R]
  return (
    <>
      <rect x={HUB[0] - 1.1} y={HUB[1] + 1} width="2.2" height={97.6 - HUB[1]} rx="1" fill={WOOD_DARK} />
      <ellipse cx={HUB[0]} cy="97.4" rx="5" ry="1.4" fill={WOOD_DARK} />
      <circle cx={HUB[0]} cy={HUB[1]} r="4.1" fill={WOOD} />
      <circle cx={HUB[0]} cy={HUB[1]} r="1.3" fill={WOOD_DARK} />
      <path d={`M${HUB[0]} ${HUB[1]} L${knob[0]} ${knob[1]}`} stroke={WOOD_DARK} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx={knob[0]} cy={knob[1]} r="1.5" fill={WOOD_DARK} />
    </>
  )
}

type Mood = 'worried' | 'brave' | 'happy'
type Point = readonly [number, number]

/**
 * かた から ひじ を通って 手 まで、2つの ほね(長さ ARM)で つなぐ。
 * ひじ が どちらへ まがるか は prefer(ひじ が むかいたい むき)で きまる。
 */
function elbowOf(shoulder: Point, hand: Point, prefer: Point): Point {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const dist = Math.min(Math.max(Math.hypot(dx, dy), 0.5), ARM * 2 - 0.05)
  const ux = dx / Math.max(Math.hypot(dx, dy), 0.001)
  const uy = dy / Math.max(Math.hypot(dx, dy), 0.001)
  const half = dist / 2
  const rise = Math.sqrt(Math.max(0, ARM * ARM - half * half))
  let px = -uy
  let py = ux
  if (px * prefer[0] + py * prefer[1] < 0) {
    px = -px
    py = -py
  }
  return [shoulder[0] + ux * half + px * rise, shoulder[1] + uy * half + py * rise]
}

function Arm({ shoulder, target, prefer, color }: { readonly shoulder: Point; readonly target: Point; readonly prefer: Point; readonly color: string }) {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const len = Math.hypot(dx, dy)
  const reach = Math.min(len, ARM * 2 - 0.05)
  // とどかない ときは、とどく ところまで
  const hand: Point = len > 0.001 ? [shoulder[0] + (dx / len) * reach, shoulder[1] + (dy / len) * reach] : shoulder
  const elbow = elbowOf(shoulder, hand, prefer)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.1" fill={SKIN} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  const cx = KX
  const cy = HEAD_Y
  return (
    <>
      <circle cx={cx + 1.2} cy={cy + 3.2} r="1.5" fill={CHEEK} opacity="0.55" />
      {mood === 'happy' ? (
        <>
          <path d={`M${cx + 0.1} ${cy + 0.9} Q${cx + 1.2} ${cy - 0.9} ${cx + 2.3} ${cy + 0.9}`} fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d={`M${cx + 3.8} ${cy + 0.9} Q${cx + 4.9} ${cy - 0.9} ${cx + 6} ${cy + 0.9}`} fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d={`M${cx + 2.2} ${cy + 3} Q${cx + 4.1} ${cy + 6.8} ${cx + 6} ${cy + 3} Z`} fill={MOUTH} />
        </>
      ) : (
        <>
          <circle cx={cx + 1.2} cy={cy + 0.6} r="1" fill={EYE} />
          <circle cx={cx + 4.8} cy={cy + 0.6} r="1" fill={EYE} />
          {mood === 'worried' ? (
            <>
              <path d={`M${cx - 0.4} ${cy - 1.4} L${cx + 1.9} ${cy - 2.6}`} stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
              <path d={`M${cx + 4.1} ${cy - 2.6} L${cx + 6.4} ${cy - 1.4}`} stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
              <ellipse cx={cx + 3.6} cy={cy + 4.2} rx="1.1" ry="1.3" fill={MOUTH} />
            </>
          ) : (
            <>
              <path d={`M${cx - 0.4} ${cy - 2.6} L${cx + 1.9} ${cy - 1.6}`} stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
              <path d={`M${cx + 4.1} ${cy - 1.6} L${cx + 6.4} ${cy - 2.6}`} stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
              <path d={`M${cx + 2.4} ${cy + 3.8} L${cx + 5} ${cy + 3.8}`} stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
            </>
          )}
        </>
      )}
    </>
  )
}

type KidProps = {
  readonly mood: Mood
  readonly nearTarget: Point
  readonly farTarget: Point
  readonly headTilt: number
  /** あしの 上げ(とびはね) と 体の ゆれ */
  readonly lift: number
}

/** 男の子(右むき)。ずきん、シャツ、エプロン。かた→ひじ→手 の じゅんに つながる うで。 */
function Kid({ mood, nearTarget, farTarget, headTilt, lift }: KidProps) {
  const cx = KX
  const cy = HEAD_Y
  // ジャンプ中も 足は 地面に つかない(lift ぶん ういている)
  const near: Point = [SHOULDER_NEAR[0], SHOULDER_NEAR[1] - lift]
  const far: Point = [SHOULDER_FAR[0], SHOULDER_FAR[1] - lift]
  return (
    <Layer y={-lift}>
      {/* むこうの うで(どう の うしろ) */}
      <Arm shoulder={[far[0], far[1] + lift]} target={[farTarget[0], farTarget[1] + lift]} prefer={[-1, 0.5]} color={SHIRT_DARK} />
      {/* あし */}
      <rect x="85.6" y="87" width="3.4" height="9" rx="1.7" fill={PANTS_DARK} />
      <ellipse cx="87.8" cy="96.6" rx="3.2" ry="1.5" fill={SHOE} />
      <rect x="89.8" y="87" width="3.4" height="9" rx="1.7" fill={PANTS} />
      <ellipse cx="92.4" cy="96.6" rx="3.2" ry="1.5" fill={SHOE} />
      {/* くび(みじかい): どう と あたま の すきま */}
      <rect x={cx - 1.8} y="77.4" width="3.6" height="3" rx="1.4" fill={SKIN_SHADE} />
      {/* どう と エプロン */}
      <rect x="84.3" y="78.4" width="10" height="10" rx="4" fill={SHIRT} />
      <rect x="86.4" y="82.2" width="7.8" height="6.2" rx="2.4" fill={APRON} />
      {/* てまえの うで */}
      <Arm shoulder={[near[0], near[1] + lift]} target={[nearTarget[0], nearTarget[1] + lift]} prefer={[0.3, 1]} color={SHIRT_DARK} />
      {/* あたま */}
      <Layer rotate={headTilt} origin={NECK}>
        <circle cx={cx + 0.8} cy={cy} r={HEAD_R} fill={SKIN} />
        <path d={`M${cx - 6.2} ${cy + 1} C${cx - 7.4} ${cy - 7.4} ${cx + 1.6} ${cy - 9.6} ${cx + 6.3} ${cy - 4.4} C${cx + 3.2} ${cy - 4.8} ${cx - 0.4} ${cy - 3.6} ${cx - 2.4} ${cy - 0.4} C${cx - 3.4} ${cy + 1.8} ${cx - 5} ${cy + 3.4} ${cx - 6.2} ${cy + 1} Z`} fill={HAIR} />
        <path d={`M${cx - 6.6} ${cy - 1.6} Q${cx - 0.6} ${cy - 7.2} ${cx + 6.7} ${cy - 3.8}`} fill="none" stroke={BAND} strokeWidth="1.7" strokeLinecap="round" />
        <Face mood={mood} />
      </Layer>
    </Layer>
  )
}

/** あわてている あいだの あせ。こめかみ から ながれる。 */
function Sweat({ t }: SceneProps) {
  const show = during(t, 0.8, TURN + 0.4, 0.2)
  if (show <= 0) return null
  const p = (t * 1.3) % 1
  return (
    <g opacity={show * (1 - p * 0.6)}>
      <path d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" transform={`translate(${KX - 7.6} ${HEAD_Y - 3.6 + p * 8})`} />
    </g>
  )
}

/** ふたが のった ときの「ぴたっ」の しるし。ふちの りょうはし から ちらばる 短い線。 */
function Snap({ t }: SceneProps) {
  const p = during(t, LAND, LAND + 0.55, 0.12)
  if (p <= 0) return null
  const ticks: readonly (readonly [number, number, number])[] = [
    [7, 56, -150],
    [5.4, 61.4, 180],
    [99, 54, -30],
    [101, 60, 0],
  ]
  return (
    <g opacity={p} stroke="#ffb02e" strokeWidth="1.4" strokeLinecap="round">
      {ticks.map(([x, y, deg]) => (
        <path key={`${x}-${y}`} d="M0 -1.8 L0 -4.6" transform={`translate(${x} ${y}) rotate(${deg + 90})`} />
      ))}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  const lidDY = lidOffset(t)
  const drop = lidDY - LID_START
  // ハンドルは、ふたが さがる ぶん だけ まわる
  const crankAngle = -90 + drop * DEG_PER_DROP

  // 男の子: さいしょは なべを 見て あわてる(左むき)→ ふりむいて ハンドルを にぎる → ふたが のって ほっと
  const facing = mix(t, TURN, GRIP, -1, 1)
  const gripping = span(t, GRIP - 0.2, GRIP + 0.2)
  const cheering = span(t, LAND + 0.05, LAND + 0.4)
  const panic = 1 - gripping
  const crank = gripping * (1 - cheering)
  const mood: Mood = t < GRIP ? 'worried' : t < LAND + 0.05 ? 'brave' : 'happy'

  const flutter = wave(t, 0.38) * 1.2
  const near = (rel: Point): Point => [SHOULDER_NEAR[0] + rel[0], SHOULDER_NEAR[1] + rel[1]]
  const far = (rel: Point): Point => [SHOULDER_FAR[0] + rel[0], SHOULDER_FAR[1] + rel[1]]
  const knob: Point = [HUB[0] + Math.cos(rad(crankAngle)) * CRANK_R, HUB[1] + Math.sin(rad(crankAngle)) * CRANK_R]
  const blend = (panicPt: Point, crankPt: Point, cheerPt: Point): Point => [
    panicPt[0] * panic + crankPt[0] * crank + cheerPt[0] * cheering,
    panicPt[1] * panic + crankPt[1] * crank + cheerPt[1] * cheering,
  ]
  const nearTarget = blend(near([3, -10 + flutter]), knob, near([4, -10.5]))
  const farTarget = blend(far([-3, -10 - flutter]), far([-1.5, 10.5]), far([-4, -10.5]))

  // とびはねる(さいごは 地面に もどる)
  const hopT = t - (LAND + 0.3)
  const jump = hopT > 0 && hopT < 1.65 ? Math.abs(Math.sin((hopT * Math.PI) / 0.55)) * 2.8 : 0
  const bob = crank * Math.abs(Math.sin(rad(crankAngle))) * 0.5
  const headTilt = t < TURN ? -6 + flutter * 2 : mood === 'happy' ? 4 : 0

  const potPop = span(t, 0, POT_UP, backOut)
  const kidPop = Math.max(0, span(t, 0.2, 0.6, backOut))

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <ellipse cx="53" cy="97.4" rx={31 * potPop} ry="2.4" fill="#000000" opacity="0.1" />
        <Layer scale={potPop} origin={[POT_X, 97]}>
          <Fire t={t} />
          <Pot t={t} />
        </Layer>
        <Steam t={t} lidDY={lidDY} />
        <Puff t={t} />
        <Knots t={t} />
        <Winch angle={crankAngle} />
        <Layer scale={kidPop} origin={[KX, 97]}>
          <Layer scaleX={facing} origin={[KX, 60]}>
            <Kid mood={mood} nearTarget={nearTarget} farTarget={farTarget} headTilt={headTilt} lift={jump + bob} />
          </Layer>
          <Sweat t={t} />
        </Layer>
        <Lid t={t} />
        <Snap t={t} />
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
    { at: 0, label: 'なべが ぐつぐつ。ゆげが にげていく', sound: 'pop' },
    { at: TURN, label: '男の子が あわてて、ハンドルを にぎる' },
    { at: LOWER, label: 'ふたが ゆっくり おりてくる' },
    { at: LAND, label: 'ふたが なべに ぴったり あう!', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '会 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
