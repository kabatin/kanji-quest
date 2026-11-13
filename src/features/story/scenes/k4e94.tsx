/*
 * 五(ご): 上と下の 線の 間に ばってん。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … もん(門)の いちばん上の よこぎ(上の 線)
 *   2画目(ノ)  … 右上から 左下へ わたした ななめの 板(ばってん の 1本め)
 *   3画目(𠃍)  … まん中の よこの 板(ばってん の 2本め)と、そこから さがる ひも・すず
 *   4画目(一)  … もん の いちばん下の よこぎ(下の 線)
 *
 * ながれ
 *   風の つよい日、できたばかりの もん が ぐらぐら ゆれる
 *   → こまった 男の子が かなづちを もって きて、ななめの 板を たてかける
 *   → まん中に よこの 板を わたして、ぶつかる ところに くぎを トントントン
 *   → ゆれが とまる。男の子は 大よろこび、すずが ちりん と なる
 *   → 上と下の 線の 間に ばってん が できた ところで、ほね が ひかって 字「五」になる
 *
 * もん・人は、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   もん は 左右の はしら が まっすぐ 立ち、よこぎ は 水平。風で ゆれる ときは、
 *   したを じく に 平行四辺形に かたむく(板が 入ると ゆれが へる)。
 *   人は うで が かた から出て ひじ で まがり、くび は みじかく どう の 上。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '五'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#e8704a'
const TUNIC_DARK = '#d05a36'
const TUNIC_FAR = '#b44a2c'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const BARK_LIGHT = '#a9754d'
const WOOD = '#d8a063'
const WOOD_DARK = '#b9834a'
const WOOD_LIGHT = '#ecc08a'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const BELL = '#f2b632'
const BELL_DARK = '#d49a1c'
const STEEL = '#8a94a6'
const ROPE = '#c9a26a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'

/** くぎり の時間(秒) */
const WALK = 0.9
const STAND = 1.9
const PROP = 2.9
const NAIL = 3.4
const HAPPY = 4.6
const INK = 5.8
const DONE = 8.4
const DURATION = 9

/** もん の かたち(座標は 109 x 109 の わく) */
const POST_L = 21
const POST_R = 95
const BEAM_TOP = 21.5
const BEAM_MID = 53.6
const SILL = 88.6
/** 風で ゆれる とき の じく(したの よこぎ) */
const SWAY_Y = 89
const GROUND = 97.5

/** 2画目(ななめの 板): 下のはし と 上のはし */
const DIAG_FOOT: readonly [number, number] = [36.5, 89.3]
const DIAG_HEAD: readonly [number, number] = [55.8, 25.3]
/** ばってん の まじわる ところ(くぎを うつ) */
const CROSS: readonly [number, number] = [47.3, BEAM_MID]

/** 3画目の ひも: よこの 板の みぎ から さがる */
const ROPE_AT: readonly [number, number] = [75.6, BEAM_MID]
const ROPE_LEN = 27

/** 男の子が たつ ばしょ(足の 左右の まんなか) */
const KID_X = 34
const KID_FEET = 95
/** かたの 高さ と、うで 1本ぶんの 長さ */
const SHOULDER_Y = 62.5
const ARM_PART = 8.2

/** かなづち: てに もつ ところ から あたまの さきまで(うえ・みぎ むき) */
const HAMMER: readonly [number, number] = [3.5, -5]
/** くぎを うつ 間かく(秒)と、さいしょの 1回目に うつ しゅんかん */
const HIT_EVERY = 0.4
const HIT_FIRST = NAIL + 0.34
const HIT_COUNT = 3

type Point = readonly [number, number]
const lerp2 = (a: Point, b: Point, k: number): Point => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
const rad = (deg: number) => (deg * Math.PI) / 180

/** 風で ゆれた とき、高さ y の ところが よこに どれだけ ずれるか */
const shiftAt = (skew: number, y: number) => Math.tan(rad(skew)) * (y - SWAY_Y)

/** ひじ の位置。かた S から 手 T へ、2本の ほね(おなじ 長さ)で つなぐ。 */
function elbowOf(shoulder: Point, hand: Point, bendDir: 1 | -1): { readonly elbow: Point; readonly hand: Point } {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const dist = Math.hypot(dx, dy) || 0.001
  const reach = Math.min(dist, ARM_PART * 2 - 0.05)
  const ux = dx / dist
  const uy = dy / dist
  const rise = Math.sqrt(Math.max(0, ARM_PART ** 2 - (reach / 2) ** 2))
  const elbow: Point = [shoulder[0] + ux * (reach / 2) - uy * rise * bendDir, shoulder[1] + uy * (reach / 2) + ux * rise * bendDir]
  return { elbow, hand: [shoulder[0] + ux * reach, shoulder[1] + uy * reach] }
}

/** 何回目の くぎうち まで おわったか */
function hitsDone(t: number): number {
  return Array.from({ length: HIT_COUNT }, (_, k) => HIT_FIRST + HIT_EVERY * k).filter((at) => t >= at).length
}

/* ───────── けしき ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[9, 9]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="8.3" y="0.8" width="1.4" height="3.2" rx="0.7" fill={SUN} transform={`rotate(${i * 45} 9 9)`} />
        ))}
      </Layer>
      <circle cx="9" cy="9" r={4.6 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 70 113 94 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="62" cy="9" rx="7" ry="3.2" />
        <ellipse cx="67" cy="7.4" rx="5" ry="3.2" />
        <ellipse cx="-3" cy="38" rx="6" ry="2.8" />
      </g>
      <ellipse cx="54.5" cy="98.4" rx="53" ry="5.6" fill={GRASS} />
      {[6, 52, 84, 104].map((x) => (
        <path key={x} d={`M${x} 98 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 風の すじ(左から 右へ ふく)。もん が ゆれている間だけ。 */
function Wind({ t }: { readonly t: number }) {
  const show = during(t, WALK - 0.4, HAPPY, 0.4)
  if (show <= 0) return null
  return (
    <g opacity={show * 0.95} fill="none" stroke="#a9c6e4" strokeWidth="1.3" strokeLinecap="round">
      {[
        { y: 11, speed: 70, off: 0 },
        { y: 38, speed: 82, off: 40 },
        { y: 68, speed: 64, off: 85 },
      ].map(({ y, speed, off }) => {
        const x = ((t * speed + off) % 150) - 30
        return <path key={y} d={`M${x} ${y} h16 q5 0 5 -3.4 q0 -2.4 -2.6 -2.4`} />
      })}
    </g>
  )
}

/** 風に ふかれて とぶ 葉 */
function BlownLeaf({ t }: { readonly t: number }) {
  const p = span(t, 0.7, HAPPY)
  if (p <= 0 || p >= 1) return null
  const x = -6 + p * 125
  const y = 30 + Math.sin(p * 11) * 7 + p * 18
  return <path d="M0 -3 Q2.6 0 0 3 Q-2.6 0 0 -3 Z" fill={LEAF_LIGHT} stroke={LEAF_DARK} strokeWidth="0.5" transform={`translate(${x} ${y}) rotate(${p * 500})`} />
}

/* ───────── もん ───────── */

/** 木の はしら・よこぎ(新しい 板と ちがい、すこし 古びた 色) */
function Gate({ t }: { readonly t: number }) {
  const post = span(t, 0, 0.5, backOut)
  const beams = span(t, 0.3, 0.8, backOut)
  return (
    <>
      <Layer opacity={post > 0.04 ? 1 : 0} scaleY={post} origin={[0, GROUND]}>
        {[POST_L, POST_R].map((x) => (
          <g key={x}>
            <rect x={x - 3.2} y="15" width="6.4" height={GROUND - 15} rx="2.4" fill={BARK} />
            <rect x={x - 3.2} y="15" width="1.5" height={GROUND - 15} rx="0.75" fill={BARK_LIGHT} />
            <rect x={x + 1.9} y="17" width="1.3" height={GROUND - 19} rx="0.65" fill={BARK_DARK} />
          </g>
        ))}
      </Layer>
      {[BEAM_TOP, SILL].map((y) => (
        <Layer key={y} scaleX={beams} origin={[(POST_L + POST_R) / 2, y]}>
          <rect x="16" y={y - 2.7} width="84" height="5.4" rx="2.2" fill={BARK} />
          <rect x="17" y={y - 2.7} width="82" height="1.4" rx="0.7" fill={BARK_LIGHT} />
          <rect x="17" y={y + 1.5} width="82" height="1.2" rx="0.6" fill={BARK_DARK} />
        </Layer>
      ))}
    </>
  )
}

/** ななめの 板: ちめんに ねかせて おいてあり、男の子が おこして たてかける。 */
function Diagonal({ t }: { readonly t: number }) {
  const lift = span(t, STAND, PROP - 0.1, easeInOut)
  const lying = 73 * (1 - lift)
  // ねている ときは 地面の 上(下がる)。おこすと 下の はし が しゃくの 高さ に そろう
  const drop = 7.5 * (1 - easeOut(span(t, STAND, STAND + 0.4)))
  const settle = Math.sin(span(t, PROP - 0.1, PROP + 0.25) * Math.PI) * 1.4
  return (
    <Layer y={drop} rotate={lying - settle} origin={DIAG_FOOT}>
      <Bone char={CHAR} n={2} color={WOOD} width={5.8} />
      <g transform="translate(-1.5 0)">
        <Bone char={CHAR} n={2} color={WOOD_LIGHT} width={1.3} />
      </g>
    </Layer>
  )
}

/** まん中の よこの 板、すず、くぎ。 */
function Cross({ t }: { readonly t: number }) {
  const slide = span(t, PROP, PROP + 0.5, backOut)
  const done = hitsDone(t)
  const nail = Math.max(0, 1.9 - done * 0.3)
  return (
    <>
      <Layer opacity={slide > 0.03 ? 1 : 0} scaleX={Math.max(0.01, slide)} origin={[POST_L, BEAM_MID]}>
        <rect x={POST_L} y={BEAM_MID - 2.7} width={POST_R - POST_L} height="5.4" rx="2.2" fill={WOOD} />
        <rect x={POST_L + 1} y={BEAM_MID - 2.7} width={POST_R - POST_L - 2} height="1.3" rx="0.65" fill={WOOD_LIGHT} />
        <rect x={POST_L + 1} y={BEAM_MID + 1.6} width={POST_R - POST_L - 2} height="1.1" rx="0.55" fill={WOOD_DARK} />
      </Layer>
      {t >= NAIL && (
        <>
          <circle cx={CROSS[0]} cy={CROSS[1]} r={nail} fill="#6d7686" />
          <circle cx={CROSS[0] - 0.4} cy={CROSS[1] - 0.4} r={nail * 0.45} fill="#b8c0cf" />
        </>
      )}
      {/* ななめの 板の はしの くぎ */}
      {t >= PROP + 0.2 && (
        <>
          <circle cx={DIAG_HEAD[0]} cy={DIAG_HEAD[1] + 0.5} r="1.1" fill="#6d7686" />
          <circle cx={DIAG_FOOT[0]} cy={DIAG_FOOT[1] - 0.5} r="1.1" fill="#6d7686" />
        </>
      )}
    </>
  )
}

/** よこの 板から さがる ひも と すず。ちりん と なると、ゆれる。 */
function Bell({ t }: { readonly t: number }) {
  const appear = span(t, PROP + 0.1, PROP + 0.5, backOut)
  if (appear <= 0) return null
  const ring = t - HAPPY
  const swing = ring < 0 ? 0 : -14 * Math.exp(-ring * 0.6) * Math.cos((ring / 1.1) * Math.PI * 2)
  const ringing = during(t, HAPPY, HAPPY + 1.2, 0.2)
  return (
    <Layer scale={appear} origin={ROPE_AT}>
      <Layer rotate={swing} origin={ROPE_AT}>
        <path d={`M${ROPE_AT[0]} ${ROPE_AT[1]} V${ROPE_AT[1] + ROPE_LEN}`} stroke={ROPE} strokeWidth="1.4" strokeLinecap="round" fill="none" />
        <g transform={`translate(${ROPE_AT[0]} ${ROPE_AT[1] + ROPE_LEN})`}>
          <path d="M-4.6 5.4 Q-4.6 -1.6 0 -2.2 Q4.6 -1.6 4.6 5.4 Z" fill={BELL} />
          <path d="M-4.6 5.4 Q-4.6 -1.6 0 -2.2 Q-2.4 0 -2.6 5.4 Z" fill="#ffd86a" />
          <rect x="-5.2" y="4.6" width="10.4" height="1.8" rx="0.9" fill={BELL_DARK} />
          <circle cx="0" cy="7.4" r="1.4" fill={BELL_DARK} />
        </g>
      </Layer>
      {ringing > 0 && (
        <g opacity={ringing} fill="none" stroke={BELL_DARK} strokeWidth="1" strokeLinecap="round" transform={`translate(${ROPE_AT[0]} ${ROPE_AT[1] + ROPE_LEN + 2})`}>
          <path d="M-8.5 -3 q-2 3 0 6 M-11.5 -4.6 q-3 4.6 0 9.2" />
          <path d="M8.5 -3 q2 3 0 6 M11.5 -4.6 q3 4.6 0 9.2" />
        </g>
      )}
    </Layer>
  )
}

/** くぎを うつ しゅんかん の ひばな */
function HitSpark({ t, skew }: { readonly t: number; readonly skew: number }) {
  const sparks = Array.from({ length: HIT_COUNT }, (_, k) => {
    const p = span(t, HIT_FIRST + HIT_EVERY * k, HIT_FIRST + HIT_EVERY * k + 0.25)
    return p > 0 && p < 1 ? <Star key={k} cx={CROSS[0] + shiftAt(skew, CROSS[1])} cy={CROSS[1] - 1} r={4.2 * (1 - p)} color="#ffd24a" spin={p * 90} /> : null
  })
  return <>{sparks}</>
}

/* ───────── 男の子 ───────── */

type Mood = 'worried' | 'effort' | 'happy'

type KidProps = {
  readonly px: number
  readonly lift: number
  readonly stride: number
  readonly mood: Mood
  readonly nearHand: Point
  readonly farHand: Point
  readonly nearBend: 1 | -1
  readonly hammerAt: number | null
  readonly hammerSwing: number
}

function Face({ x, y, mood }: { readonly x: number; readonly y: number; readonly mood: Mood }) {
  return (
    <>
      <circle cx={x + 3.2} cy={y + 3.8} r="1.7" fill="#ff9d9d" opacity="0.55" />
      {mood === 'happy' ? (
        <>
          <path d={`M${x + 1.6} ${y + 0.6} Q${x + 3.2} ${y - 1.2} ${x + 4.8} ${y + 0.6}`} fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d={`M${x + 2.4} ${y + 3.6} Q${x + 4 } ${y + 7} ${x + 5.8} ${y + 3.6} Z`} fill={MOUTH} />
        </>
      ) : (
        <>
          <circle cx={x + 3.2} cy={y + 0.8} r="1.05" fill={EYE} />
          {mood === 'worried' ? (
            <>
              <path d={`M${x + 1.3} ${y - 1.6} L${x + 4.8} ${y - 3.2}`} stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
              <path d={`M${x + 2.2} ${y + 4.8} q0.9 -1 1.8 0 t1.8 0`} fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d={`M${x + 1.3} ${y - 2.9} L${x + 4.8} ${y - 1.7}`} stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
              <path d={`M${x + 2.4} ${y + 4.6} H${x + 5.2}`} fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
            </>
          )}
        </>
      )}
    </>
  )
}

function Kid({ px, lift, stride, mood, nearHand, farHand, nearBend, hammerAt, hammerSwing }: KidProps) {
  const shoulder: Point = [px + 0.8, SHOULDER_Y - lift]
  const far = elbowOf(shoulder, farHand, nearBend)
  const near = elbowOf(shoulder, nearHand, nearBend)
  const hx = px + 0.8
  const hy = 53.4 - lift
  const arm = (a: { readonly elbow: Point; readonly hand: Point }, color: string) => (
    <path d={`M${shoulder[0]} ${shoulder[1]} L${a.elbow[0]} ${a.elbow[1]} L${a.hand[0]} ${a.hand[1]}`} fill="none" stroke={color} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
  )
  return (
    <g>
      {arm(far, TUNIC_FAR)}
      <circle cx={far.hand[0]} cy={far.hand[1]} r="2.2" fill={SKIN_SHADE} />
      {/* あし: こしから。あるくと かわりばんこに ふる。つま先は みぎ(まえ)。 */}
      <Layer y={-lift} rotate={stride * 18} origin={[px + 1.4, 77]}>
        <rect x={px - 0.6} y="76" width="4" height="17" rx="2" fill={PANTS_DARK} />
        <ellipse cx={px + 2.4} cy={KID_FEET - 0.6} rx="3.6" ry="1.9" fill={SHOE} />
      </Layer>
      <Layer y={-lift} rotate={-stride * 18} origin={[px - 1, 77]}>
        <rect x={px - 3} y="76" width="4" height="17" rx="2" fill={PANTS} />
        <ellipse cx={px} cy={KID_FEET - 0.6} rx="3.6" ry="1.9" fill={SHOE} />
      </Layer>
      <rect x={px - 0.6} y={56.4 - lift} width="3.6" height="6" rx="1.6" fill={SKIN_SHADE} />
      <rect x={px - 4.2} y={60 - lift} width="9.4" height="19" rx="4.2" fill={TUNIC} />
      <path d={`M${px - 3} ${72 - lift} h7.2`} stroke={TUNIC_DARK} strokeWidth="1.2" strokeLinecap="round" />
      {arm(near, TUNIC_DARK)}
      {hammerAt !== null && (
        <g transform={`translate(${near.hand[0]} ${near.hand[1]}) rotate(${hammerSwing})`}>
          <path d={`M0 0 L${HAMMER[0]} ${HAMMER[1]}`} stroke={BARK} strokeWidth="1.7" strokeLinecap="round" />
          <path d={`M${HAMMER[0] - 2.5} ${HAMMER[1] - 1.7} L${HAMMER[0] + 2.5} ${HAMMER[1] + 1.7}`} stroke={STEEL} strokeWidth="3" strokeLinecap="butt" />
        </g>
      )}
      <circle cx={near.hand[0]} cy={near.hand[1]} r="2.3" fill={SKIN} />
      <g transform={`rotate(${mood === 'worried' ? 4 : 0} ${px + 0.5} ${59.5 - lift})`}>
        <circle cx={hx} cy={hy} r="6.4" fill={SKIN} />
        <path d={`M${hx - 6.3} ${hy + 0.4} C${hx - 7} ${hy - 7} ${hx + 1.8} ${hy - 9.4} ${hx + 6.4} ${hy - 3.8} C${hx + 3.4} ${hy - 5.8} ${hx - 2.4} ${hy - 4.6} ${hx - 6.3} ${hy + 0.4} Z`} fill={HAIR} />
        <path d={`M${hx + 1} ${hy - 6.8} Q${hx + 1.6} ${hy - 9.8} ${hx + 3} ${hy - 7.6}`} fill="none" stroke={HAIR} strokeWidth="1.4" strokeLinecap="round" />
        <Face x={hx} y={hy} mood={mood} />
      </g>
    </g>
  )
}

/** こまった ときの あせ */
function Sweat({ t, px }: { readonly t: number; readonly px: number }) {
  const show = during(t, STAND, STAND + 1.0, 0.2)
  if (show <= 0) return null
  const p = ((t - STAND) % 0.6) / 0.6
  return <path d="M0 -2.2 Q1.8 0.6 0 1.8 Q-1.8 0.6 0 -2.2 Z" fill="#7cc4f2" opacity={show * (1 - p)} transform={`translate(${px - 5.4} ${50 + p * 6})`} />
}

/* ───────── ぜんたい ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  // もん の ゆれ: 風が ふく間、したを じく に 平行四辺形に かたむく。板が 入って くぎを うつと へる
  const amp =
    (4.6 - 2.0 * span(t, 2.2, PROP) - 0.7 * span(t, 3.0, 3.5) - 0.6 * span(t, HIT_FIRST, HIT_FIRST + 0.2) - 0.6 * span(t, HIT_FIRST + HIT_EVERY, HIT_FIRST + HIT_EVERY + 0.2) - 0.7 * span(t, HIT_FIRST + 2 * HIT_EVERY, HIT_FIRST + 2 * HIT_EVERY + 0.2)) *
    span(t, 0.7, 1.1)
  const skew = amp * wave(t, 0.62)

  // 男の子: あるいてきて、板を おこし、くぎを うち、よろこぶ
  const px = mix(t, WALK, STAND, -12, KID_X, easeOut)
  const walking = t < STAND ? 1 - span(t, STAND - 0.3, STAND) : 0
  const stride = t < WALK ? 0 : Math.sin((t - WALK) * Math.PI * 2 * 2.2) * walking
  const bob = -Math.abs(stride) * 1.2
  const cheerHop = t < 4.75 ? 0 : Math.abs(Math.sin(span(t, 4.75, 5.75) * Math.PI * 2)) * 5
  const shoulder: Point = [px + 0.8, SHOULDER_Y]

  // うで: あるく間は ふる / 板を おこす 間は 板に てを かける / くぎを うつ / よろこぶ
  const swing = stride * 20
  const hangNear: Point = [shoulder[0] + Math.sin(rad(swing)) * 15, shoulder[1] + Math.cos(rad(swing)) * 15]
  const hangFar: Point = [shoulder[0] - Math.sin(rad(swing)) * 15, shoulder[1] + Math.cos(rad(swing)) * 15]
  const dir = (d: number): Point => {
    const r = rad(73 * (1 - span(t, STAND, PROP - 0.1, easeInOut)))
    const base: Point = [0.289, -0.958]
    const v: Point = [base[0] * Math.cos(r) - base[1] * Math.sin(r), base[0] * Math.sin(r) + base[1] * Math.cos(r)]
    const drop = 7.5 * (1 - easeOut(span(t, STAND, STAND + 0.4)))
    return [DIAG_FOOT[0] + v[0] * d, DIAG_FOOT[1] + drop + v[1] * d]
  }
  const gripNear = dir(13)
  const gripFar = dir(22)
  // くぎうち: かなづち を ふりあげて、ふりおろす
  const cycle = t < NAIL ? 0 : ((t - NAIL) % HIT_EVERY) / HIT_EVERY
  const nailing = t >= NAIL && t < HIT_FIRST + HIT_EVERY * (HIT_COUNT - 1) + 0.25
  const up = nailing ? easeOut(span(cycle, 0, 0.6)) * (1 - easeIn(span(cycle, 0.6, 0.85))) : 0
  const nailPoint: Point = [CROSS[0] + shiftAt(skew, CROSS[1]), CROSS[1]]
  const hitHand: Point = [nailPoint[0] - HAMMER[0], nailPoint[1] - HAMMER[1]]
  const nailHand: Point = [hitHand[0] - 2.5 * up, hitHand[1] - 7 * up]
  const readyHand = lerp2(gripNear, [hitHand[0] - 2.5, hitHand[1] - 7], span(t, PROP, NAIL, easeInOut))
  const workHand: Point = t < NAIL ? readyHand : nailHand
  const cheerNear: Point = [px + 10, 46 - cheerHop * 0.5 - wave(t, 0.5) * 1.5]
  const cheerFar: Point = [px - 7, 46 - cheerHop * 0.5 + wave(t, 0.5) * 1.5]
  const cheer = span(t, HAPPY, HAPPY + 0.3, easeOut)
  const nearHand: Point = t < STAND ? hangNear : lerp2(t < PROP ? gripNear : workHand, cheerNear, cheer)
  const farHand: Point = t < STAND ? hangFar : lerp2(t < PROP + 0.3 ? lerp2(gripFar, [shoulder[0] + 9.5, shoulder[1] - 0.5], span(t, PROP, PROP + 0.3)) : [shoulder[0] + 9.5, shoulder[1] - 0.5], cheerFar, cheer)
  const mood: Mood = t < STAND ? 'worried' : t < HAPPY ? (t < STAND + 1.0 ? 'worried' : 'effort') : 'happy'
  const hammerSwing = -38 * up + (t >= HAPPY ? -20 * cheer : 0)

  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <g transform={`translate(0 ${SWAY_Y}) skewX(${skew}) translate(0 ${-SWAY_Y})`}>
          <Gate t={t} />
          {t >= WALK - 0.4 && <Diagonal t={t} />}
          <Cross t={t} />
          <Bell t={t} />
          <HitSpark t={t} skew={0} />
        </g>
        <Wind t={t} />
        <BlownLeaf t={t} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.2)}>
          <ellipse cx={px + 1} cy="97.2" rx="7" ry="1.8" fill="#000000" opacity="0.12" />
          <Layer y={bob - cheerHop}>
            <Kid px={px} lift={0} stride={stride} mood={mood} nearHand={nearHand} farHand={farHand} nearBend={t >= HAPPY + 0.15 ? -1 : 1} hammerAt={t >= PROP ? 1 : null} hammerSwing={hammerSwing} />
          </Layer>
          <Sweat t={t} px={px} />
        </Layer>
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
    { at: 0, label: '風の中、もん が できる', sound: 'pop' },
    { at: WALK, label: 'もん が ぐらぐら。男の子が こまって やってくる' },
    { at: STAND, label: 'ななめの 板を おこして たてかける', sound: 'pop' },
    { at: NAIL, label: 'よこの 板を わたして、くぎを トントントン' },
    { at: HAPPY, label: 'ゆれが とまって 大よろこび。すずが ちりん', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '五 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
