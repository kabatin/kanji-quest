/*
 * 黒(くろ): 下で 火が もえて、上の けむだしに すすが ついて、まっくろ。
 *
 * ほね(画と絵の対応)
 *   1・2画目   … けむだし(えんとつ)の かこい(左がわ と 上・右がわ)
 *   3・4・5・6画目 … けむだしの 中の れんがの めじ(よこ線 と たて線)
 *   7画目(一)  … かまどの 上の 石の はり(ひを うけとめる よこの いた)
 *   8・9・10・11画目 … 下で もえる 4つの ほのお(ひ)
 *
 * ながれ
 *   ゆきの さむい日。男の子が ぶるぶる ふるえている
 *   → たいまつで まきに ひを つける。ほのおが ひだりから じゅんに もえあがり、あったかくて にっこり
 *   → けむりが のぼって、けむだしに すすが つもり、しろい けむだしが だんだん くろくなる
 *   → 男の子が 見上げて「おっ!」。けむだしが まっくろ
 *   → ほね が ひかって、絵が うすくなり、字「黒」が のこる
 *
 * 男の子は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく、どう の上に あたま。
 *   ほのおは 下が ふとく、上へ むかって とがる。けむりは ほのおの 上へ のぼる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '黒'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const COAT = '#e5604d'
const COAT_DARK = '#c94a3a'
const COAT_FAR = '#a83d30'
const SCARF = '#ffd24a'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const FLUE = '#e9dcc8'
const FLUE_EDGE = '#6b5a55'
const MORTAR = '#bda98f'
const MORTAR_DARK = '#6a5a56'
const SOOT = '#2a2425'
const SLAB = '#8a7d72'
const OVEN = '#43332f'
const LOG = '#8c5b3c'
const LOG_END = '#d2a273'
const FIRE = '#ff8a3c'
const FIRE_IN = '#ffd24a'
const SMOKE = '#8a8790'
const SNOW = '#cfe6f7'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'

/** くぎり の時間(秒) */
const LIGHT = 1.3
/** ほのおが つく時間(ひだりから じゅんに) */
const FLAME_AT: readonly number[] = [2.2, 2.5, 2.8, 3.1]
const WARM = 3.2
const SOOTING = 3.4
const NOTICE = 5.0
const INK = 6.2
const DONE = 9.4
const DURATION = 10

type Pt = readonly [number, number]

/** 4つの ほのお: 8〜11画目の 下の はし(もとの ふとい所)と 上の はし(さき) */
const FLAMES: readonly { readonly base: Pt; readonly tip: Pt }[] = [
  { base: [15.8, 96.5], tip: [24.8, 81.9] },
  { base: [45.8, 94.8], tip: [42, 79.5] },
  { base: [69.3, 93.8], tip: [62.8, 78.5] },
  { base: [95.8, 94], tip: [83.7, 79.1] },
]
/** ほのおの もとに しく まき(4本) */
const LOGS: readonly { readonly x: number; readonly tilt: number }[] = [
  { x: 20, tilt: -8 },
  { x: 46, tilt: 4 },
  { x: 68, tilt: 5 },
  { x: 91, tilt: -6 },
]
/** けむだしの かこい(1・2画目)の 中 */
const FLUE_BOX = { x: 31, y: 17, w: 49, h: 52 }
/** けむりが のぼって はいる けむだしの まんなか */
const FLUE_MID: Pt = [55, 42]
/** けむだしの 上の くち(けむりが でていく) */
const FLUE_TOP: Pt = [55, 15]

const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/** ほのおの かたち: base(ふとい もと)から tip(とがる さき)へ。もとは まるく、上は ほそく とがる */
function flamePath(base: Pt, tip: Pt, width: number): string {
  const dx = tip[0] - base[0]
  const dy = tip[1] - base[1]
  const len = Math.hypot(dx, dy)
  const ux = dx / len
  const uy = dy / len
  const r = width / 2
  const at = (along: number, side: number) => `${(base[0] + ux * len * along - uy * r * side).toFixed(2)} ${(base[1] + uy * len * along + ux * r * side).toFixed(2)}`
  return `M${at(0, 1)} C${at(0.3, 1.5)} ${at(0.72, 0.55)} ${at(1, 0)} C${at(0.72, -0.55)} ${at(0.3, -1.5)} ${at(0, -1)} Q${at(-0.4, 0)} ${at(0, 1)} Z`
}

function Ground({ t }: SceneProps) {
  const grow = span(t, 0, 0.5, easeOut)
  return (
    <>
      <path d="M-4 99 Q18 84 44 92 Q72 80 113 94 V101 H-4 Z" fill="#e2f2d2" />
      <ellipse cx="54.5" cy="98.4" rx={53 * grow} ry="4.6" fill={GRASS} />
      {[6, 34, 62, 104].map((x) => (
        <path key={x} d={`M${x} 98 l1.2 -3.2 l1 2.8 l1.4 -3.8 l0.8 4.2 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** さむい日の ゆき。はじめだけ ふって、ひが ついたら きえる */
function Snow({ t }: SceneProps) {
  const show = during(t, 0, FLAME_AT[0] + 0.3, 0.5)
  if (show <= 0) return null
  return (
    <g opacity={show} fill={SNOW}>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const x = 18 + i * 14 + Math.sin(t * 1.6 + i * 2) * 2.4
        const y = (t * 9 + i * 17) % 70
        return <circle key={i} cx={x} cy={y + 4} r={i % 2 === 0 ? 1.2 : 0.9} />
      })}
    </g>
  )
}

/** かまど: ひの うしろの くらい ところ と、まき */
function OvenBack({ t }: SceneProps) {
  const show = span(t, 0.2, 0.8, easeOut)
  const glow = span(t, FLAME_AT[0], FLAME_AT[3] + 0.6) * 0.35
  return (
    <Layer opacity={show}>
      <rect x="13" y="73" width="85" height="25" rx="6" fill={OVEN} />
      <ellipse cx="55" cy="92" rx="38" ry="14" fill={FIRE} opacity={glow} />
      {LOGS.map((log) => (
        <g key={log.x} transform={`rotate(${log.tilt} ${log.x} 95.5)`}>
          <rect x={log.x - 9} y="93.2" width="18" height="4.6" rx="2.3" fill={LOG} />
          <ellipse cx={log.x + 8.6} cy="95.5" rx="1.2" ry="2.1" fill={LOG_END} />
        </g>
      ))}
    </Layer>
  )
}

/** ほのお 1つ。ついた しゅんかん ぽん と ふくらみ、あとは ゆらゆら */
function Flame({ t, index }: { readonly t: number; readonly index: number }) {
  const { base, tip } = FLAMES[index]
  const born = span(t, FLAME_AT[index], FLAME_AT[index] + 0.45, backOut)
  if (born <= 0) return null
  const sway = wave(t, 0.55, index * 0.21)
  const size = Math.max(0, born) * (0.94 + 0.06 * wave(t, 0.4, index * 0.13))
  return (
    <Layer scale={size} rotate={sway * 3} origin={base}>
      <path d={flamePath(base, tip, 9)} fill={FIRE} />
      <path d={flamePath([lerp(base[0], tip[0], 0.04), base[1] - 0.2], [lerp(base[0], tip[0], 0.62), lerp(base[1], tip[1], 0.62)], 4.6)} fill={FIRE_IN} />
    </Layer>
  )
}

/** けむだし(えんとつ)。すすが ついて、しろから まっくろに かわる */
function Flue({ t }: SceneProps) {
  const rise = span(t, 0.1, 0.9, backOut)
  const soot = 0.93 * span(t, SOOTING, 5.7, easeInOut)
  return (
    <Layer scaleY={rise} scaleX={0.7 + 0.3 * rise} origin={[55, 69]}>
      <rect x={FLUE_BOX.x} y={FLUE_BOX.y} width={FLUE_BOX.w} height={FLUE_BOX.h} rx="3" fill={FLUE} />
      <rect x={FLUE_BOX.x} y={FLUE_BOX.y} width={FLUE_BOX.w} height={FLUE_BOX.h} rx="3" fill={SOOT} opacity={soot} />
      {[3, 4, 5, 6].map((n) => (
        <g key={n}>
          <Bone char={CHAR} n={n} color={MORTAR} width={2.2} opacity={1 - soot} />
          <Bone char={CHAR} n={n} color={MORTAR_DARK} width={2.2} opacity={soot} />
        </g>
      ))}
      <Bone char={CHAR} n={1} color={FLUE_EDGE} width={4.2} />
      <Bone char={CHAR} n={2} color={FLUE_EDGE} width={4.2} />
    </Layer>
  )
}

/** かまどの 上の 石の はり(7画目) */
function Slab({ t }: SceneProps) {
  return (
    <Layer opacity={span(t, 0.2, 0.7)}>
      <Bone char={CHAR} n={7} color={SLAB} width={5} />
    </Layer>
  )
}

/** ほのおの 上から けむだしへ のぼる けむり。けむだしの 上の くち からも くろい けむり */
function Smoke({ t }: SceneProps) {
  return (
    <>
      {FLAMES.map(({ tip }, i) => {
        const on = during(t, FLAME_AT[i] + 0.2, INK + 0.9, 0.5)
        if (on <= 0) return null
        return (
          <g key={i} fill={SMOKE}>
            {[0, 1, 2].map((k) => {
              const p = (t * 0.5 + k / 3 + i * 0.19) % 1
              const x = lerp(tip[0], FLUE_MID[0] + (i - 1.5) * 4, easeOut(p))
              const y = lerp(tip[1] - 2, FLUE_MID[1], p)
              const fade = Math.min(span(p, 0, 0.15), 1 - span(p, 0.7, 1))
              return <circle key={k} cx={x} cy={y} r={2.2 + p * 3.4} opacity={0.82 * fade * on} />
            })}
          </g>
        )
      })}
      {(() => {
        const on = during(t, SOOTING + 0.3, INK + 0.9, 0.5)
        if (on <= 0) return null
        return (
          <g fill={SOOT}>
            {[0, 1, 2].map((k) => {
              const p = (t * 0.45 + k / 3) % 1
              const fade = Math.min(span(p, 0, 0.15), 1 - span(p, 0.65, 1))
              return <circle key={k} cx={FLUE_TOP[0] + p * 10 + Math.sin(p * 6 + k) * 1.2} cy={FLUE_TOP[1] - p * 13} r={2.4 + p * 3.2} opacity={0.8 * fade * on} />
            })}
          </g>
        )
      })()}
    </>
  )
}

/** ひが ついた しゅんかんの ひのこ */
function Sparks({ t }: SceneProps) {
  return (
    <>
      {FLAMES.map(({ tip }, i) => {
        const p = span(t, FLAME_AT[i] + 0.1, FLAME_AT[i] + 0.9)
        if (p <= 0 || p >= 1) return null
        const dir = i % 2 === 0 ? 1 : -1
        return (
          <g key={i} opacity={1 - p} fill={FIRE_IN}>
            <circle cx={tip[0] + dir * p * 7} cy={tip[1] - p * 9 + p * p * 6} r="0.9" />
            <circle cx={tip[0] - dir * p * 4} cy={tip[1] - p * 12 + p * p * 7} r="0.7" />
          </g>
        )
      })}
    </>
  )
}

/* ───────── 男の子 ───────── */

type Mood = 'cold' | 'happy' | 'surprise' | 'laugh'
/** うで の かっこう。swing = ま下から まえ(右)へ ふった角度 / bend = ひじ の まがり */
type ArmPose = { readonly swing: number; readonly bend: number }

/** かた(うでの つけね)と、うで の ふし の長さ */
const SHOULDER: Pt = [8.2, 76.2]
const ARM_PART = 5.2
const HEAD: Pt = [7.3, 66.6]

const rad = (deg: number) => (deg * Math.PI) / 180
const armPoints = (pose: ArmPose) => {
  const elbow: Pt = [SHOULDER[0] + Math.sin(rad(pose.swing)) * ARM_PART, SHOULDER[1] + Math.cos(rad(pose.swing)) * ARM_PART]
  const fore = pose.swing + pose.bend
  const hand: Pt = [elbow[0] + Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART]
  return { elbow, hand, fore }
}
const lerpPose = (a: ArmPose, b: ArmPose, k: number): ArmPose => ({ swing: lerp(a.swing, b.swing, k), bend: lerp(a.bend, b.bend, k) })

const HUG: ArmPose = { swing: 15, bend: 120 }
const LIGHTING: ArmPose = { swing: 35, bend: 40 }
const WARMING: ArmPose = { swing: 60, bend: 20 }
const WARMING_FAR: ArmPose = { swing: 50, bend: 30 }
const POINTING: ArmPose = { swing: 130, bend: 0 }

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる */
function Arm({ pose, color }: { readonly pose: ArmPose; readonly color: string }) {
  const { elbow, hand } = armPoints(pose)
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="1.9" fill={SKIN} />
    </>
  )
}

function Face({ mood, soot }: { readonly mood: Mood; readonly soot: number }) {
  return (
    <>
      <circle cx="8.4" cy="69.2" r="1.3" fill={mood === 'cold' ? '#9fc7ee' : '#ff9d9d'} opacity="0.7" />
      {mood === 'cold' && (
        <>
          <path d="M8.4 65.2 l2.6 0.9" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <path d="M8.7 66.9 l1.9 0.4" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M9.4 70 l0.8 -0.6 l0.8 0.6 l0.8 -0.6" fill="none" stroke={MOUTH} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M8.4 67 Q9.7 65.2 11 67" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M9.4 69.4 Q10.8 71.2 12.2 69.2" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'surprise' && (
        <>
          <circle cx="10" cy="66.4" r="1.7" fill="#ffffff" />
          <circle cx="10.5" cy="66.4" r="0.9" fill={EYE} />
          <ellipse cx="11" cy="70.2" rx="1.1" ry="1.5" fill={MOUTH} />
        </>
      )}
      {mood === 'laugh' && (
        <>
          <path d="M8.4 67 Q9.7 65.2 11 67" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M9 69 Q10.8 69.5 12.6 69 Q12 72.4 10.8 72.4 Q9.4 72.4 9 69 Z" fill={MOUTH} />
        </>
      )}
      {/* すすの よごれ: ほっぺ と はな */}
      <g fill={SOOT} opacity={0.55 * soot}>
        <ellipse cx="9" cy="69.8" rx="1.6" ry="1" />
        <ellipse cx="12.4" cy="67.7" rx="0.9" ry="0.7" />
      </g>
    </>
  )
}

type BoyProps = {
  readonly mood: Mood
  readonly nearArm: ArmPose
  readonly farArm: ArmPose
  readonly headTilt: number
  readonly soot: number
}

function Boy({ mood, nearArm, farArm, headTilt, soot }: BoyProps) {
  return (
    <>
      <Arm pose={farArm} color={COAT_FAR} />
      {/* あし: 右(ほのお)の ほうを むいて 立つ */}
      <rect x="6.6" y="85" width="3.6" height="10.8" rx="1.8" fill={PANTS_DARK} />
      <ellipse cx="9" cy="96.2" rx="3.4" ry="1.7" fill={SHOE} />
      <rect x="3.6" y="85" width="3.6" height="10.8" rx="1.8" fill={PANTS} />
      <ellipse cx="6" cy="96.2" rx="3.4" ry="1.7" fill={SHOE} />
      {/* どう と、くびに まいた マフラー */}
      <rect x="2.6" y="73.6" width="9" height="13.4" rx="4" fill={COAT} />
      <rect x="2.9" y="71.8" width="8.6" height="3.4" rx="1.7" fill={SCARF} />
      <path d="M3.6 74.4 l-1.4 5 l2.6 0.6 Z" fill={SCARF} />
      <Arm pose={nearArm} color={COAT_DARK} />
      {/* あたま */}
      <Layer rotate={headTilt} origin={[7.3, 72]}>
        <circle cx={HEAD[0]} cy={HEAD[1]} r="5.4" fill={SKIN} />
        <circle cx="12.5" cy="67.6" r="0.9" fill={SKIN_SHADE} />
        <path d="M1.9 66.6 C1.6 60.8 8 59.4 11.6 62.4 C12.4 63.4 12.6 64.4 12.4 65 C10 63.8 6 63.6 4.4 65.4 C3.6 66.2 3.2 67.8 2.6 69.6 Z" fill={HAIR} />
        <Face mood={mood} soot={soot} />
      </Layer>
    </>
  )
}

/** さむくて はく しろい いき */
function Breath({ t }: SceneProps) {
  const show = during(t, 0.5, 2.0, 0.3)
  if (show <= 0) return null
  const p = (t * 0.9) % 1
  return (
    <g opacity={show * (1 - p)}>
      <ellipse cx={15 + p * 4} cy={70.2 - p * 3} rx={1.6 + p * 1.6} ry={1.1 + p} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
    </g>
  )
}

/** 見上げた ときの「!」 */
function Notice({ t }: SceneProps) {
  const show = during(t, NOTICE + 0.1, INK - 0.1, 0.2)
  if (show <= 0) return null
  const pop = backOut(span(t, NOTICE + 0.1, NOTICE + 0.45))
  return (
    <Layer opacity={show} scale={Math.max(0, pop)} origin={[5.5, 55]}>
      <rect x="4.4" y="46" width="2.2" height="6.6" rx="1.1" fill="#f2a623" />
      <circle cx="5.5" cy="55.2" r="1.3" fill="#f2a623" />
    </Layer>
  )
}

/** たいまつ(ひの ついた ぼう)。手に もって、まきに ちかづける */
function Torch({ t, hand }: { readonly t: number; readonly hand: Pt }) {
  const show = during(t, LIGHT + 0.1, WARM - 0.1, 0.2)
  if (show <= 0) return null
  const tip: Pt = [hand[0] + 3.6, hand[1] + 11.4]
  return (
    <g opacity={show}>
      <path d={`M${hand[0] - 0.6} ${hand[1] - 0.8} L${tip[0]} ${tip[1]}`} stroke="#a9764f" strokeWidth="1.5" strokeLinecap="round" />
      <path d={flamePath([tip[0], tip[1] + 0.6], [tip[0] + 0.6, tip[1] - 4.8 + wave(t, 0.3) * 0.5], 3.4)} fill={FIRE} />
      <path d={flamePath([tip[0], tip[1] + 0.4], [tip[0] + 0.3, tip[1] - 2.6], 1.6)} fill={FIRE_IN} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 11)

  // 気もち: さむい → (ひが ついて)あったかい → 見上げて びっくり → わらう
  const mood: Mood = t < FLAME_AT[0] ? 'cold' : t < NOTICE ? 'happy' : t < INK - 0.3 ? 'surprise' : 'laugh'
  const shiver = t < LIGHT ? Math.sin(t * 46) * 0.32 : 0

  // うで: だきしめる → たいまつを まきへ → ひに あたる → けむだしを ゆびさす
  const lighting = span(t, LIGHT, LIGHT + 0.5, easeInOut)
  const warming = span(t, WARM, WARM + 0.5, easeInOut)
  const pointing = span(t, NOTICE, NOTICE + 0.4, easeInOut)
  const nearBase = lerpPose(lerpPose(HUG, LIGHTING, lighting), WARMING, warming)
  const nearArm = lerpPose(nearBase, POINTING, pointing)
  const farArm = lerpPose(lerpPose(HUG, WARMING_FAR, warming), POINTING, pointing * 0.6)
  // あたま: ひを 見ているときは すこし 下むき、見上げるときは 上むき
  const headTilt = mix(t, LIGHT, LIGHT + 0.5, 0, 6) + mix(t, WARM, WARM + 0.5, 0, -6) + mix(t, NOTICE, NOTICE + 0.4, 0, -22)
  const soot = span(t, SOOTING + 0.8, 5.8)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Snow t={t} />
        <OvenBack t={t} />
        {[0, 1, 2, 3].map((i) => (
          <Flame key={i} t={t} index={i} />
        ))}
        <Flue t={t} />
        <Slab t={t} />
        <Smoke t={t} />
        <Sparks t={t} />
        <Layer x={shiver} scale={1.15} origin={[7, 96.5]}>
          <Boy mood={mood} nearArm={nearArm} farArm={farArm} headTilt={headTilt} soot={soot} />
          <Torch t={t} hand={armPoints(nearArm).hand} />
        </Layer>
        <Breath t={t} />
        <Notice t={t} />
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
    { at: 0, label: 'ゆきの さむい日。男の子が ふるえる', sound: 'pop' },
    { at: LIGHT, label: 'たいまつで まきに ひを つける' },
    { at: FLAME_AT[0], label: 'ほのおが もえあがる', sound: 'pop' },
    { at: SOOTING, label: 'けむりが のぼり、けむだしに すすが つく' },
    { at: NOTICE, label: 'おっ、けむだしが まっくろ!' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '黒 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
