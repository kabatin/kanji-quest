/*
 * 五(ご): 上と下の 線の 間に ばってん。(共通部品 sceneFigures で 書きなおした)
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
 * 男の子は Person(あるきは walk)。ななめの 板は かがんで おこし、手は 板の 上の 点を 指す。
 * かなづち(道具の 部品が ない)は 場面で 描いて、手に もたせる(held。てまえの 手が にぎる)。
 * もん は 左右の はしら が まっすぐ 立ち、よこぎ は 水平。風で ゆれる ときは、
 * したを じく に 平行四辺形に かたむく(板が 入ると ゆれが へる)。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, PALETTE, Person, personRig, Sweat, walk, Wind, type Expression, type Point } from '../sceneFigures'

const CHAR = '五'

const BARK = PALETTE.bark
const BARK_DARK = '#70452b'
const BARK_LIGHT = '#a9754d'
const WOOD = '#d8a063'
const WOOD_DARK = '#b9834a'
const WOOD_LIGHT = '#ecc08a'
const LEAF_DARK = PALETTE.leafDark
const LEAF_LIGHT = PALETTE.leafLight
const BELL = '#f2b632'
const BELL_DARK = '#d49a1c'
const STEEL = '#8a94a6'
const ROPE = '#c9a26a'

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
const DIAG_FOOT: Point = [36.5, 89.3]
const DIAG_HEAD: Point = [55.8, 25.3]
/** ばってん の まじわる ところ(くぎを うつ) */
const CROSS: Point = [47.3, BEAM_MID]

/** 3画目の ひも: よこの 板の みぎ から さがる */
const ROPE_AT: Point = [75.6, BEAM_MID]
const ROPE_LEN = 27

/** 男の子が たつ ばしょ(こしの x)、足もとの y、背の高さ */
const KID_X = 34
const KID_FEET = 95
const KID_HEIGHT = 50

/** かなづち: てに もつ ところ から あたまの さきまで(うえ・みぎ むき) */
const HAMMER: Point = [3.5, -5]
/** くぎを うつ 間かく(秒)と、さいしょの 1回目に うつ しゅんかん */
const HIT_EVERY = 0.4
const HIT_FIRST = NAIL + 0.34
const HIT_COUNT = 3

const lerp2 = (a: Point, b: Point, k: number): Point => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
const rad = (deg: number) => (deg * Math.PI) / 180

/** 風で ゆれた とき、高さ y の ところが よこに どれだけ ずれるか */
const shiftAt = (skew: number, y: number) => Math.tan(rad(skew)) * (y - SWAY_Y)

/** 何回目の くぎうち まで おわったか */
function hitsDone(t: number): number {
  return Array.from({ length: HIT_COUNT }, (_, k) => HIT_FIRST + HIT_EVERY * k).filter((at) => t >= at).length
}

/* ───────── けしき ───────── */

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
  const nail = Math.max(0, 1.9 - hitsDone(t) * 0.3)
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
  return (
    <>
      {Array.from({ length: HIT_COUNT }, (_, k) => {
        const p = span(t, HIT_FIRST + HIT_EVERY * k, HIT_FIRST + HIT_EVERY * k + 0.25)
        return p > 0 && p < 1 ? <Star key={k} cx={CROSS[0] + shiftAt(skew, CROSS[1])} cy={CROSS[1] - 1} r={4.2 * (1 - p)} color="#ffd24a" spin={p * 90} /> : null
      })}
    </>
  )
}

/** かなづち: 手(こぶし)から さきの あたま まで。手に もたせる もの として 描く */
function Hammer({ hand, swing }: { readonly hand: Point; readonly swing: number }) {
  return (
    <g transform={`translate(${hand[0]} ${hand[1]}) rotate(${swing})`}>
      <path d={`M0 0 L${HAMMER[0]} ${HAMMER[1]}`} stroke={BARK} strokeWidth="1.7" strokeLinecap="round" />
      <path d={`M${HAMMER[0] - 2.5} ${HAMMER[1] - 1.7} L${HAMMER[0] + 2.5} ${HAMMER[1] + 1.7}`} stroke={STEEL} strokeWidth="3" strokeLinecap="butt" />
    </g>
  )
}

/* ───────── ぜんたい ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  // もん の ゆれ: 風が ふく間、したを じく に 平行四辺形に かたむく。板が 入って くぎを うつと へる
  const hitCut = (k: number, size: number) => size * span(t, HIT_FIRST + HIT_EVERY * k, HIT_FIRST + HIT_EVERY * k + 0.2)
  const amp = (4.6 - 2.0 * span(t, 2.2, PROP) - 0.7 * span(t, 3.0, 3.5) - hitCut(0, 0.6) - hitCut(1, 0.6) - hitCut(2, 0.7)) * span(t, 0.7, 1.1)
  const skew = amp * wave(t, 0.62)

  // 男の子: あるいてきて、板を おこし、くぎを うち、よろこぶ
  const w = walk(t, { from: -12, to: KID_X, start: WALK, end: STAND, build: 'child', height: KID_HEIGHT, armSwing: 20 })
  const cheerHop = t < 4.75 ? 0 : Math.abs(Math.sin(span(t, 4.75, 5.75) * Math.PI * 2)) * 5
  const base = { x: w.x, y: KID_FEET, build: 'child', height: KID_HEIGHT, facing: 'right' } as const
  const shoulder = personRig(base).world.arms.left.root

  // うで: あるく間は ふる / 板を おこす 間は 板に てを かける / くぎを うつ / よろこぶ
  const dir = (d: number): Point => {
    const r = rad(73 * (1 - span(t, STAND, PROP - 0.1, easeInOut)))
    const v: Point = [0.289 * Math.cos(r) + 0.958 * Math.sin(r), 0.289 * Math.sin(r) - 0.958 * Math.cos(r)]
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
  const cheerNear: Point = [w.x + 10, 46 - cheerHop * 0.5 - wave(t, 0.5) * 1.5]
  const cheerFar: Point = [w.x - 7, 46 - cheerHop * 0.5 + wave(t, 0.5) * 1.5]
  const cheer = span(t, HAPPY, HAPPY + 0.3, easeOut)
  const restFar: Point = [shoulder[0] + 9.5, shoulder[1] - 0.5]
  const nearHand = lerp2(t < PROP ? gripNear : workHand, cheerNear, cheer)
  const farHand = lerp2(t < PROP + 0.3 ? lerp2(gripFar, restFar, span(t, PROP, PROP + 0.3)) : restFar, cheerFar, cheer)
  // ななめの 板は 地面に ねている ので、かがんで おこす(おこしきると まっすぐ)
  const bend = 26 * span(t, STAND - 0.3, STAND) * (1 - span(t, STAND, PROP - 0.1, easeInOut))
  const face: Expression = t < HAPPY ? (t < STAND + 1.0 ? 'worried' : 'strain') : 'joy'
  const pose = t < STAND ? w.pose : { leftArm: { to: nearHand }, rightArm: { to: farHand }, torso: bend, head: face === 'worried' ? 4 : 0 }
  const place = { ...base, pose, lift: cheerHop } as const
  const hand = personRig(place).world.arms.left.end
  const hammerSwing = -38 * up + (t >= HAPPY ? -20 * cheer : 0)
  const head = personRig(place).world.head

  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const windShow = during(t, WALK - 0.4, HAPPY, 0.4)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[9, 9]} />
        <g transform={`translate(0 ${SWAY_Y}) skewX(${skew}) translate(0 ${-SWAY_Y})`}>
          <Gate t={t} />
          {t >= WALK - 0.4 && <Diagonal t={t} />}
          <Cross t={t} />
          <Bell t={t} />
          <HitSpark t={t} skew={0} />
        </g>
        <Wind t={t} x={4} y={11} show={windShow} reach={70} />
        <Wind t={t + 0.5} x={20} y={38} show={windShow} reach={70} />
        <Wind t={t + 1} x={0} y={68} show={windShow} reach={70} />
        <BlownLeaf t={t} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.2)}>
          <Person {...place} face={face} look={{ top: '#e8704a', bottom: '#3e5c86' }} held={t >= PROP ? <Hammer hand={hand} swing={hammerSwing} /> : undefined} />
          <Sweat t={t} x={head[0] - 4} y={head[1] - 5} show={during(t, STAND, STAND + 1.0, 0.2)} />
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
