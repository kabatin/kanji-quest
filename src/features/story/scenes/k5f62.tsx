/*
 * 形(かたち): ちいさな大工さんが 木の わく を くぎで うって、ペンキで もよう を つけて、すてきな かたち に する。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … わくの いちばん上の よこぼう
 *   2画目(一)  … わくの まんなかの よこぼう
 *   3画目(丿)  … わくの 左の あし(すこし ひらいた はしら)
 *   4画目(丨)  … わくの まんなかの はしら
 *   5〜7画目(彡) … 右の かべに ペンキで つけた 3本の もよう(かざり)
 *
 * ながれ
 *   こどもが かなづちを もって あるいてくる → 「トン」と うつたび、はしら・よこぼうが はまって わく が できる
 *   → すこし さがって ながめる(うれしい)→ 「うーん、ちょっと さびしい」(こまった)
 *   → 「そうだ!」と ひらめく(電球)→ こしの ペンキつぼ から ふで を ぬいて、かべへ ペンキを ぴゅっ と とばす
 *   → もよう が 3本 できて 大よろこび → ほね が ひかって、絵が うすくなり、字「形」が のこる
 *
 * 人は、ほんものの人の つくり を守る(休 と同じ):
 *   うで は かた から出て ひじ で まがる。手が とどく ところ だけ ねらう(うでの ながさ から ひじを 計算する)。
 *   字の形になるのは、わく と もよう が できた さいごの しゅんかん。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '形'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#f2a33c'
const SHIRT_DARK = '#d98a26'
const SHIRT_FAR = '#b8731f'
const PANTS = '#4a6fa5'
const PANTS_DARK = '#3d5d8f'
const SHOE = '#6b4a36'
const BELT = '#6b4a36'
const WOOD = '#8c5b3c'
const WOOD_DARK = '#70452b'
const IRON = '#7d8794'
const PAINT = '#ee5f8a'
const PAINT_LIGHT = '#f98fb0'
const WALL = '#f3e3c3'
const WALL_SHADE = '#e6d2aa'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'

/** くぎり の時間(秒) */
const ENTER = 0.9
const WALK2_FROM = 1.4
const WALK2_TO = 1.9
const WALK3_FROM = 3.5
const WALK3_TO = 4.1
const PROUD = 3.5
const PUZZLED = 4.3
const IDEA = 4.85
const SWAP_FROM = 5.0
const SWAP_TO = 5.5
const SWAP_AT = 5.25
const CHEER = 7.6
const INK = 8.4
const DONE = 11.6
const DURATION = 12

/** こども の大きさ と、立つ場所(足もとの y) */
const KID = 0.95
const GROUND_Y = 96
/** にのうで・うでさき 1つぶんの長さ(せかい の座標) */
const ARM_PART = 12.5 * KID
/** かなづち の あたま までの長さ・ふで の さき までの長さ(手から) */
const HAMMER_LEN = 11 * KID
const BRUSH_LEN = 17 * KID
const FEET_LOCAL: readonly [number, number] = [27.5, 94]
const SHOULDER_LOCAL: readonly [number, number] = [25.4, 40]
const NECK: readonly [number, number] = [28, 35]

type Pt = readonly [number, number]

/** かなづち で うつ場所。from(時間)に うつ。わく の はしら・よこぼう が この しゅんかん に はまる。 */
type Hit = { readonly at: number; readonly nail: Pt; readonly angle: number; readonly standX: number }
const HITS: readonly Hit[] = [
  // 左の はしら(2画目の左はし ちかく): 左がわから
  { at: 1.1, nail: [26, 60], angle: 85, standX: 12 },
  // まんなかの はしら
  { at: 2.2, nail: [44.8, 58], angle: 85, standX: 30 },
  // まんなかの よこぼう の右ぎわ
  { at: 2.7, nail: [54, 46.2], angle: 80, standX: 30 },
  // いちばん上の よこぼう の右ぎわ(せのびして うつので 手を 少し 上げる)
  { at: 3.2, nail: [50, 20.2], angle: 55, standX: 30 },
]

/** ペンキを とばす とき。かべの 3本の もよう の「近いほうの はし」へ ねらう。 */
type Fling = { readonly at: number; readonly stroke: 5 | 6 | 7; readonly target: Pt }
const FLINGS: readonly Fling[] = [
  { at: 5.9, stroke: 5, target: [67.4, 36.8] },
  { at: 6.4, stroke: 6, target: [66.9, 64] },
  { at: 6.9, stroke: 7, target: [63.7, 93.1] },
]
const PAINT_STAND_X = 57

const WINDUP = 0.3
const RECOVER = 0.2

/** ---- 計算 ---- */

const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const lerpPt = (a: Pt, b: Pt, k: number): Pt => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]
const rad = (deg: number) => (deg * Math.PI) / 180

/** こども の立ちかた。いつも 右むき。 */
type Stance = { readonly cx: number; readonly hop: number }

/** こども の からだの 場所(ローカル)を、せかい の場所に直す。右むきなので 左右を ひっくり返す。 */
function toWorld(stance: Stance, local: Pt): Pt {
  return [stance.cx - KID * (local[0] - FEET_LOCAL[0]), GROUND_Y - stance.hop + KID * (local[1] - FEET_LOCAL[1])]
}

/** かた から 手 をのばす。とどかない ときは とどく ところまで。ひじ は 下・うしろ へ まがる。 */
function reach(shoulder: Pt, target: Pt): { readonly elbow: Pt; readonly hand: Pt } {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.hypot(dx, dy) || 1
  const d = Math.min(dist, ARM_PART * 2 * 0.999)
  const ux = dx / dist
  const uy = dy / dist
  const half = d / 2
  const h = Math.sqrt(Math.max(ARM_PART * ARM_PART - half * half, 0))
  const mid: Pt = [shoulder[0] + ux * half, shoulder[1] + uy * half]
  const a: Pt = [mid[0] - uy * h, mid[1] + ux * h]
  const b: Pt = [mid[0] + uy * h, mid[1] - ux * h]
  // 下に、うしろ(左)へ まがるほうを えらぶ
  const score = (p: Pt) => p[1] - 0.4 * p[0]
  return { elbow: score(a) >= score(b) ? a : b, hand: [shoulder[0] + ux * d, shoulder[1] + uy * d] }
}

/** あるく とき の 足の ふり(止まっている間は 0) */
function walkSwing(t: number): number {
  const moving = Math.min(1, 1 - span(t, ENTER - 0.1, ENTER) + during(t, WALK2_FROM - 0.05, WALK2_TO + 0.05, 0.08) + during(t, WALK3_FROM - 0.05, WALK3_TO + 0.05, 0.08))
  return Math.sin(t * Math.PI * 2 * 2.2) * moving
}

function standX(t: number): number {
  const enter = mix(t, 0, ENTER, -9, HITS[0].standX, easeOut)
  const second = mix(t, WALK2_FROM, WALK2_TO, 0, HITS[1].standX - HITS[0].standX, easeInOut)
  const third = mix(t, WALK3_FROM, WALK3_TO, 0, PAINT_STAND_X - HITS[3].standX, easeInOut)
  return enter + second + third
}

/** うつ しゅんかん を 1 とした、かなづち の ふりぐあい(0 = ふりかぶる / 1 = あたる) */
function strikeAmount(t: number): number {
  return HITS.reduce((best, hit) => {
    const d = t - hit.at
    const k = d < -WINDUP ? 0 : d < 0 ? easeIn((d + WINDUP) / WINDUP) : d < RECOVER ? 1 - easeOut(d / RECOVER) : 0
    return Math.max(best, k)
  }, 0)
}

/** いま ねらっている くぎの場所。つぎの くぎ へ なめらかに うつる。 */
function currentHit(t: number): { readonly nail: Pt; readonly angle: number } {
  const done = HITS.filter((hit) => t >= hit.at + 0.05)
  const i = Math.max(done.length - 1, 0)
  const from = HITS[i]
  const to = HITS[Math.min(i + 1, HITS.length - 1)]
  const k = from === to ? 0 : easeInOut(span(t, from.at + 0.05, to.at - WINDUP))
  return { nail: lerpPt(from.nail, to.nail, k), angle: lerp(from.angle, to.angle, k) }
}

/** かなづち を おろして 手を ぶらんと させている わりあい(あるく間・うちおわり) */
function restAmount(t: number): number {
  const before = 1 - span(t, HITS[0].at - WINDUP - 0.2, HITS[0].at - WINDUP)
  const between = span(t, HITS[0].at + RECOVER + 0.1, HITS[0].at + RECOVER + 0.4) * (1 - span(t, HITS[1].at - WINDUP - 0.15, HITS[1].at - WINDUP))
  const after = span(t, HITS[3].at + RECOVER + 0.05, HITS[3].at + RECOVER + 0.4)
  return Math.min(1, before + between + after)
}

/** ふで を ふる わりあい(0 = ふりかぶり / 1 = ペンキを とばす しゅんかん) */
function flingAmount(t: number): { readonly k: number; readonly index: number } {
  let k = 0
  let index = 0
  FLINGS.forEach((fling, i) => {
    const d = t - fling.at
    const v = d < -WINDUP ? 0 : d < 0 ? easeIn((d + WINDUP) / WINDUP) : d < RECOVER ? 1 - easeOut(d / RECOVER) : 0
    if (v > 0) {
      k = v
      index = i
    }
    if (d >= -WINDUP && d < RECOVER) index = i
  })
  return { k, index }
}

type Mood = 'work' | 'happy' | 'puzzled' | 'idea' | 'joy'

type Tool = 'hammer' | 'brush'

type KidState = {
  readonly stance: Stance
  readonly step: number
  readonly mood: Mood
  readonly headTilt: number
  readonly nearHand: Pt
  /** 手に もった物の むき(上を 0 として 右まわり の 度) */
  readonly toolAngle: number
  readonly tool: Tool
  readonly farHand: Pt
}

function kidAt(t: number): KidState {
  const swing = walkSwing(t)
  const cheer = span(t, CHEER, CHEER + 0.2) * (1 - span(t, INK + 0.5, INK + 0.9))
  const hop = Math.abs(swing) * 1.2 + Math.abs(wave(t, 0.5)) * 2.4 * cheer
  const stance: Stance = { cx: standX(t), hop }
  const shoulder = toWorld(stance, SHOULDER_LOCAL)

  // 気もち
  const mood: Mood = t < PROUD ? 'work' : t < PUZZLED ? 'happy' : t < IDEA ? 'puzzled' : t < IDEA + 0.55 ? 'idea' : t < CHEER ? 'happy' : 'joy'
  const headTilt = t >= PUZZLED && t < IDEA ? 8 : 0

  // 手が ぶらんと さがった ときの 場所
  const hang: Pt = [shoulder[0] + 1.5 + swing * -3, shoulder[1] + 21]
  const farHang: Pt = [shoulder[0] - 1.5 + swing * 3, shoulder[1] + 21]

  // かなづち: ふりかぶる ↔ あてる
  const hit = currentHit(t)
  const strike = strikeAmount(t)
  const head: Pt = lerpPt([hit.nail[0] - 3, hit.nail[1] - 12], hit.nail, strike)
  const hammerAngle = lerp(30, hit.angle, strike)
  const hammerHand: Pt = [head[0] - HAMMER_LEN * Math.sin(rad(hammerAngle)), head[1] + HAMMER_LEN * Math.cos(rad(hammerAngle))]
  const rest = restAmount(t)

  // こしの ペンキつぼ から ふで を ぬく(かなづち は こしに かける)
  const hip = toWorld(stance, [24, 65])
  const swap = during(t, SWAP_FROM, SWAP_TO, 0.2)

  // ふで: ふりかぶる ↔ ペンキを とばす
  const { k: flingK, index } = flingAmount(t)
  const fling = FLINGS[index]
  const dx = fling.target[0] - shoulder[0]
  const dy = fling.target[1] - shoulder[1]
  const dist = Math.hypot(dx, dy) || 1
  const aim = { x: dx / dist, y: dy / dist }
  const flingHand: Pt = lerpPt([shoulder[0] - 8, shoulder[1] - 10], [shoulder[0] + aim.x * 17, shoulder[1] + aim.y * 17], flingK)
  const flingAngle = lerp(-40, (Math.atan2(aim.x, -aim.y) * 180) / Math.PI, flingK)
  const flingW = span(t, SWAP_TO + 0.05, FLINGS[0].at - WINDUP)
  const afterFling = span(t, FLINGS[2].at + RECOVER, FLINGS[2].at + RECOVER + 0.3)
  const cheerHand: Pt = [shoulder[0] + 3, shoulder[1] - 21]
  const farCheer: Pt = [shoulder[0] - 5, shoulder[1] - 21]

  let nearHand: Pt
  let toolAngle: number
  let tool: Tool
  if (t < SWAP_FROM) {
    const base: Pt = lerpPt(hammerHand, hang, rest)
    nearHand = base
    toolAngle = lerp(hammerAngle, 165, rest)
    tool = 'hammer'
  } else if (t < FLINGS[0].at - WINDUP) {
    const base: Pt = lerpPt(hang, hip, swap)
    const ready: Pt = lerpPt(base, flingHand, flingW)
    nearHand = ready
    toolAngle = lerp(lerp(165, 170, swap), lerp(15, flingAngle, 1), t >= SWAP_AT ? 1 : 0) * 1
    tool = t < SWAP_AT ? 'hammer' : 'brush'
    if (t >= SWAP_AT) toolAngle = lerp(15, flingAngle, flingW)
  } else {
    nearHand = flingHand
    toolAngle = flingAngle
    tool = 'brush'
  }
  if (t >= FLINGS[2].at + RECOVER) {
    nearHand = lerpPt(flingHand, cheerHand, afterFling)
    toolAngle = lerp(flingAngle, 10, afterFling)
  }
  const farHand: Pt = lerpPt(farHang, farCheer, cheer)
  return { stance, step: swing, mood, headTilt, nearHand, toolAngle, tool, farHand }
}

/** ---- 絵 ---- */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 11]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="-0.4" width="1.6" height="3.6" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 11)`} />
        ))}
      </Layer>
      <circle cx="13" cy="11" r={5.4 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 94 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="-2" cy="30" rx="7" ry="3.2" />
        <ellipse cx="3" cy="28" rx="5" ry="3.2" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 70, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 右がわの かべ(もよう を つける 板)。 */
function Wall({ t }: SceneProps) {
  const rise = span(t, 0.1, 0.7, backOut)
  return (
    <Layer scaleY={rise} origin={[81, 97]}>
      <rect x="61" y="10" width="40" height="87" rx="4" fill={WALL} />
      <rect x="61" y="90" width="40" height="7" rx="3" fill={WALL_SHADE} />
    </Layer>
  )
}

/** かなづち で うった しゅんかん の ほこり と くぎ。 */
function Dust({ at, nail }: { readonly at: number; readonly nail: Pt; readonly t: number }) {
  return (
    <g transform={`translate(${nail[0]} ${nail[1]})`}>
      {Array.from({ length: 5 }, (_, i) => (
        <line key={i} x1="2.6" y1="0" x2="5.4" y2="0" stroke="#ffe08a" strokeWidth="1.4" strokeLinecap="round" transform={`rotate(${-120 + i * 60 + (at % 2) * 10})`} />
      ))}
    </g>
  )
}

/** わく: 4本の ぼう。かなづち で うつたび、うった所から のびて はまる。 */
function Frame({ t }: SceneProps) {
  const pops = HITS.map((hit) => span(t, hit.at, hit.at + 0.3, backOut))
  const nailDots = HITS.map((hit) => (t >= hit.at ? <circle key={hit.at} cx={hit.nail[0]} cy={hit.nail[1]} r="1" fill={WOOD_DARK} /> : null))
  const dusts = HITS.map((hit) => {
    const show = during(t, hit.at, hit.at + 0.22, 0.04)
    return show > 0 ? (
      <g key={hit.at} opacity={show}>
        <Dust at={hit.at} nail={hit.nail} t={t} />
      </g>
    ) : null
  })
  return (
    <>
      {pops[0] > 0 && (
        <Layer scaleY={pops[0]} origin={[29.5, 62]}>
          <Bone char={CHAR} n={3} color={WOOD} width={7} />
        </Layer>
      )}
      {pops[1] > 0 && (
        <Layer scaleY={pops[1]} origin={[47, 62]}>
          <Bone char={CHAR} n={4} color={WOOD} width={7.4} />
        </Layer>
      )}
      {pops[2] > 0 && (
        <Layer scaleX={pops[2]} origin={[54, 46]}>
          <Bone char={CHAR} n={2} color={WOOD} width={6.4} />
        </Layer>
      )}
      {pops[3] > 0 && (
        <Layer scaleX={pops[3]} origin={[50, 20]}>
          <Bone char={CHAR} n={1} color={WOOD} width={6.4} />
        </Layer>
      )}
      {nailDots}
      {dusts}
    </>
  )
}

/** ペンキの もよう 3本。ふで から とんだ ペンキが かべに あたり、近いほうの はし から 外へ のびる。 */
function Stripes({ t }: SceneProps) {
  return (
    <>
      {FLINGS.map((fling) => {
        const land = fling.at + 0.3
        const grow = span(t, land, land + 0.4, easeOut)
        const splat = during(t, land, land + 0.3, 0.06)
        return (
          <g key={fling.stroke}>
            {grow > 0 && (
              <>
                <Bone char={CHAR} n={fling.stroke} color={PAINT} width={6.6} from={1 - grow} to={1} />
                <Bone char={CHAR} n={fling.stroke} color={PAINT_LIGHT} width={2} from={1 - grow} to={1} />
              </>
            )}
            {splat > 0 && <circle cx={fling.target[0]} cy={fling.target[1]} r={5 * splat} fill={PAINT} opacity="0.8" />}
          </g>
        )
      })}
    </>
  )
}

/** ふで から とぶ ペンキの つぶ。 */
function Droplets({ t, shoulderX }: SceneProps & { readonly shoulderX: number }) {
  const shoulder: Pt = [shoulderX, GROUND_Y - KID * 54]
  return (
    <>
      {FLINGS.map((fling) => {
        const dx = fling.target[0] - shoulder[0]
        const dy = fling.target[1] - shoulder[1]
        const dist = Math.hypot(dx, dy) || 1
        const start: Pt = [shoulder[0] + (dx / dist) * (17 + BRUSH_LEN), shoulder[1] + (dy / dist) * (17 + BRUSH_LEN)]
        return [0, 0.04, 0.08, 0.12].map((delay, i) => {
          const s = span(t, fling.at + delay, fling.at + 0.3 + delay * 0.5)
          if (s <= 0 || s >= 1) return null
          const x = lerp(start[0], fling.target[0], s)
          const y = lerp(start[1], fling.target[1], s) - Math.sin(Math.PI * s) * 4
          return <circle key={`${fling.stroke}-${i}`} cx={x} cy={y} r={2.2 - i * 0.4} fill={PAINT} />
        })
      })}
    </>
  )
}

function Hammer() {
  return (
    <>
      <rect x="-1.1" y="-10" width="2.2" height="14" rx="1" fill={WOOD} />
      <rect x="-3.6" y="-13.2" width="7.2" height="4.2" rx="1" fill={IRON} />
    </>
  )
}

function Brush() {
  return (
    <>
      <rect x="-1" y="-8" width="2" height="12" rx="1" fill={WOOD} />
      <rect x="-1.8" y="-10.4" width="3.6" height="2.6" rx="0.6" fill="#b8c0cc" />
      <path d="M-2.2 -10.4 Q-2.8 -15 0 -17 Q2.8 -15 2.2 -10.4 Z" fill={PAINT} />
    </>
  )
}

/** かた・ひじ・手 が つながった うで と、手に もった物。せかい の座標で描く。 */
function Arm({ shoulder, target, color, tool, angle }: { readonly shoulder: Pt; readonly target: Pt; readonly color: string; readonly tool?: Tool; readonly angle?: number }) {
  const { elbow, hand } = reach(shoulder, target)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth={6.2 * KID} strokeLinecap="round" strokeLinejoin="round" />
      {tool && (
        <g transform={`translate(${hand[0]} ${hand[1]}) rotate(${angle ?? 0}) scale(${KID})`}>{tool === 'hammer' ? <Hammer /> : <Brush />}</g>
      )}
      <circle cx={hand[0]} cy={hand[1]} r={3.6 * KID} fill={SKIN} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  const eye = (
    <circle cx="25.4" cy="25.6" r="1.15" fill="#2b2b2b" />
  )
  const smileEye = <path d="M23.8 24.9 Q25.4 26.6 27 24.9" fill="none" stroke="#2b2b2b" strokeWidth="1.25" strokeLinecap="round" />
  return (
    <>
      <circle cx="26.5" cy="28.8" r="2.1" fill="#ff9d9d" opacity="0.55" />
      {mood === 'work' && (
        <>
          <path d="M23.6 23.6 l3 0.8" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          {eye}
          <path d="M23.2 30 h2.6" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'happy' && (
        <>
          {smileEye}
          <path d="M23 29.4 Q24.8 31.5 26.8 29.9" fill="none" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'puzzled' && (
        <>
          <path d="M23.4 24.2 l3 -1.2" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          {eye}
          <path d="M23 30.4 q1 -1.1 2 0 t2 0" fill="none" stroke="#b9483f" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M35 19 Q36.6 21.6 35 22.8 Q33.4 21.6 35 19 Z" fill="#7cc4f2" />
        </>
      )}
      {mood === 'idea' && (
        <>
          <circle cx="25.4" cy="25.4" r="1.6" fill="#2b2b2b" />
          <circle cx="24.9" cy="24.8" r="0.5" fill="#ffffff" />
          <ellipse cx="24.8" cy="30.4" rx="1.3" ry="1.6" fill="#b9483f" />
        </>
      )}
      {mood === 'joy' && (
        <>
          {smileEye}
          <path d="M22.8 29 Q25.2 33.6 27.8 29 Z" fill="#b9483f" />
        </>
      )}
    </>
  )
}

type KidProps = { readonly state: KidState; readonly t: number }

function Kid({ state, t }: KidProps) {
  const { stance, step, mood, headTilt, nearHand, toolAngle, tool, farHand } = state
  const shoulder = toWorld(stance, SHOULDER_LOCAL)
  const body = { x: stance.cx - FEET_LOCAL[0], y: GROUND_Y - stance.hop - FEET_LOCAL[1], origin: FEET_LOCAL, scaleX: -KID, scaleY: KID } as const
  const hammerOnBelt = t >= SWAP_AT
  return (
    <>
      <Layer opacity={1} x={0} y={0}>
        <Arm shoulder={shoulder} target={farHand} color={SHIRT_FAR} />
      </Layer>
      <Layer {...body}>
        <Layer rotate={step * 17} origin={[30, 68]}>
          <rect x="27.2" y="65" width="6.2" height="27.5" rx="3.1" fill={PANTS_DARK} />
          <ellipse cx="28.6" cy="93.4" rx="5.2" ry="2.8" fill={SHOE} />
        </Layer>
        <Layer rotate={-step * 17} origin={[25, 68]}>
          <rect x="21.6" y="65" width="6.2" height="27.5" rx="3.1" fill={PANTS} />
          <ellipse cx="23" cy="93.4" rx="5.2" ry="2.8" fill={SHOE} />
        </Layer>
        <rect x="24.8" y="32" width="5.2" height="8" rx="2.4" fill={SKIN_SHADE} />
        <rect x="20.4" y="36.6" width="14" height="34" rx="6.8" fill={SHIRT} />
        <path d="M20.6 64.2 h13.6" stroke={BELT} strokeWidth="2.6" strokeLinecap="round" />
        {/* こしの ペンキつぼ(ふで が さして ある) */}
        <rect x="20.6" y="65.2" width="6.4" height="5.6" rx="1.2" fill="#d9d3c7" />
        <ellipse cx="23.8" cy="65.4" rx="3.2" ry="1" fill={PAINT} />
        {!hammerOnBelt && <path d="M23.8 65.4 L22.2 57.6" stroke={WOOD} strokeWidth="1.4" strokeLinecap="round" />}
        {!hammerOnBelt && <path d="M22.2 57.6 q-0.8 -2.6 0.6 -3.4 q1.6 0.4 1.2 3 Z" fill={PAINT} />}
        {/* かなづち は うしろ の こしに かける */}
        {hammerOnBelt && (
          <>
            <rect x="30.4" y="64.8" width="1.2" height="6" rx="0.5" fill={WOOD} />
            <rect x="28.8" y="70.2" width="4.4" height="2.4" rx="0.8" fill={IRON} />
          </>
        )}
      </Layer>
      <Arm shoulder={shoulder} target={nearHand} color={SHIRT_DARK} tool={tool} angle={toolAngle} />
      <Layer {...body}>
        <Layer rotate={headTilt} origin={NECK}>
          <g transform="translate(-1.4 0.6)">
            <circle cx="30.2" cy="24.6" r="9.2" fill={SKIN} />
            <path d="M21.5 23 C21.4 13.8 31.8 11.2 37.8 17 C40.2 20.2 40.2 26 38.2 30.2 C37.6 24.4 33.4 20.2 26.6 20.6 C24.4 20.8 22.6 21.8 21.5 23 Z" fill={HAIR} />
            <Face mood={mood} />
          </g>
          <path d="M32.4 17.6 Q33.2 14.4 35 16.5 Q36.2 13.8 37 16.9" fill="none" stroke={HAIR} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </Layer>
      </Layer>
    </>
  )
}

/** ひらめいた しゅんかん の 電球。あたまの上に ぽん と出る。 */
function Bulb({ t, cx }: { readonly t: number; readonly cx: number }) {
  const show = during(t, IDEA, SWAP_FROM + 0.45, 0.15)
  if (show <= 0) return null
  const pop = span(t, IDEA, IDEA + 0.25, backOut)
  return (
    <Layer opacity={show} scale={Math.max(pop, 0)} origin={[cx, 8]}>
      {Array.from({ length: 6 }, (_, i) => (
        <line key={i} x1={cx} y1="1.4" x2={cx} y2="-1.2" stroke={SUN} strokeWidth="1.2" strokeLinecap="round" transform={`rotate(${-75 + i * 30} ${cx} 8)`} />
      ))}
      <circle cx={cx} cy="8" r="4.2" fill={SUN} />
      <rect x={cx - 2} y="11.6" width="4" height="2.6" rx="1" fill="#b8c0cc" />
      <circle cx={cx - 1.4} cy="6.6" r="1.1" fill="#fff4b8" />
    </Layer>
  )
}

/** うっている間の あせ。 */
function Sweat({ t, stance }: { readonly t: number; readonly stance: Stance }) {
  const show = during(t, HITS[1].at - 0.3, HITS[3].at + 0.5, 0.2)
  if (show <= 0) return null
  const p = (t % 0.8) / 0.8
  const head = toWorld(stance, [22, 20])
  return (
    <g opacity={show * (1 - p)}>
      <path d="M0 -2.2 Q1.8 0.5 0 1.8 Q-1.8 0.5 0 -2.2 Z" fill="#7cc4f2" transform={`translate(${head[0] + p * 5} ${head[1] + p * 5})`} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)
  const kid = kidAt(t)
  const shoulderX = toWorld({ cx: PAINT_STAND_X, hop: 0 }, SHOULDER_LOCAL)[0]
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Wall t={t} />
        <Stripes t={t} />
        <Frame t={t} />
        <Layer opacity={span(t, 0.2, 0.4)}>
          <ellipse cx={kid.stance.cx} cy="97.4" rx="8.5" ry="2.2" fill="#000000" opacity="0.12" />
          <Kid state={kid} t={t} />
          <Sweat t={t} stance={kid.stance} />
        </Layer>
        <Droplets t={t} shoulderX={shoulderX} />
        <Bulb t={t} cx={PAINT_STAND_X} />
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
    { at: 0, label: 'こどもが かなづちを もって くる', sound: 'pop' },
    { at: HITS[0].at, label: 'トン、トン。くぎを うって わくを つくる', sound: 'tap' },
    { at: PROUD, label: 'できた! すこし さがって ながめる' },
    { at: PUZZLED, label: 'うーん、ちょっと さびしいな' },
    { at: IDEA, label: 'そうだ! もようを つけよう', sound: 'pop' },
    { at: FLINGS[0].at, label: 'ふでで ペンキを ぴゅっ と とばして もようを つける', sound: 'tap' },
    { at: CHEER, label: 'もようが 3本 できて 大よろこび' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '形 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
