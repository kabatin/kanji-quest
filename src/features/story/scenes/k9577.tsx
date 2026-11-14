/*
 * 長(ながい): かみの ながい おじいさんが、つえを ついて たっている。
 *
 * ほね(画と絵の対応)  ※ おじいさんは 左を むいて 立つ。かぜは 左から ふく。
 *   1画目(丨)    … あたまから せなかへ たれた ながい かみ(かぜが ないときは 下へ たれる)
 *   2・3・4画目  … かぜに なびいた 3本の ながい もの: あたまの上の かみ・うしろの かみ・あごの ひげ
 *   5画目(一)    … つえを にぎる 手(左はし)から、かたの マフラーが 右へ なびく線
 *   6画目(𠃍)    … おじいさんの あし(まっすぐ 立つ)
 *   7画目(ノ)    … マフラーの はしの たれた ところ
 *   8画目(㇏)    … かぜに ふくらむ マント(かたから 右下へ)
 *   ※ 字の ほぼ 同じ ばしょに かさなる のは、かぜを うけて 立った さいごの しゅんかん だけ。
 *
 * ながれ
 *   はらっぱを、つかれた おじいさんが つえを かついで あるいてくる(かみは ながく たれている)
 *   → つよい かぜ! かみ・ひげ・マフラーが なびいて、おじいさんは ふらふら(びっくり)
 *   → つえを「とん」と つくと、ぴたっと 立てる(ほっと して にっこり)
 *   → かぜに ながい かみが なびく まま、ほね が ひかって 絵が うすくなり、字「長」が のこる
 *
 * おじいさんは 共通部品 Person(おとしより・左むき)。あるきは walk()、つえは tools の stick。
 *   かみ・ひげ・マフラー・マント は、あたまの 位置(rig)に あわせて 場面で 描く。
 *   かぜが ないと 下へ たれ、かぜが ふくと 右へ なびく。
 */
import { during, easeIn, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Clouds, LOOKS, Person, personRig, Sun, Sweat, toolEnds, walk, type Expression, type Limb, type PersonPose, type PersonProps } from '../sceneFigures'

const CHAR = '長'

const HAIR = '#f3f5f8'
const HAIR_SHADE = '#c9d1dd'
const ROBE = '#4f9be0'
const PANTS = '#3e5c86'
const SCARF = '#e8534a'
const SCARF_DARK = '#c23f38'
const CAPE = '#d08a4e'
const CAPE_DARK = '#b06f38'
const LEAF = '#55b86e'
const LEAF_LIGHT = '#8bd69a'
const GRASS = '#c5e8a9'
const WIND = '#9cc9ec'

/** くぎり の時間(秒) */
const WALK = 0.7
const ARRIVE = 2.6
/** つよい かぜが ふきはじめる */
const GUST = 2.8
/** つえを「とん」と つく */
const PLANT = 4.0
const INK = 5.7
const DONE = 8.8
const DURATION = 9.4

/** おじいさんの 足もと の 高さ・せいたけ・立つ x(こし) */
const GROUND_Y = 97
const HEIGHT = 76
const STAND_X = 37
/** かみ・マフラー・マントの 元の 絵の 大きさ(あたまの 半径 9.5、あたまの まんなか が 37,28) */
const ORIG_HEAD: readonly [number, number] = [37, 28]
const ORIG_HEAD_R = 9.5
/** つえを かついだ ときの 手から 先まで の 長さ */
const STAFF_CARRY = 44

const lerp = (a: number, b: number, k: number) => a + (b - a) * k
type Pt = readonly [number, number]
const mixPt = (a: Pt, b: Pt, k: number): Pt => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]

function Ground({ t }: SceneProps) {
  return (
    <>
      <path d="M-4 99 Q18 78 44 91 Q72 70 113 93 V101 H-4 Z" fill="#e2f2d2" />
      {/* かぜが ふくと、雲が はやく ながれる */}
      <Clouds t={t + span(t, GUST, GUST + 1.5) * 5} at={[[-4, 46, 1], [88, 5, 0.9]]} speed={1.6} />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 52, 82, 101].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** つよい かぜ: 左から 右へ ながれる すじ と、とんでいく 葉 */
function Gust({ t }: SceneProps) {
  const show = during(t, GUST, DONE, 0.4)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[7, 21, 48, 66, 80].map((y, i) => {
        const x = ((t * 80 + i * 41) % 170) - 40
        return <path key={y} d={`M${x} ${y} h${14 + (i % 2) * 6}`} stroke={WIND} strokeWidth="1.1" strokeLinecap="round" opacity="0.8" />
      })}
      {[0, 1, 2].map((k) => {
        const p = ((t - GUST) * 0.55 + k * 0.33) % 1
        const x = -6 + p * 122
        const y = 66 - k * 17 + Math.sin(p * 11 + k) * 6 - p * 8
        return <path key={k} d="M0 -2.6 Q2.4 0 0 2.6 Q-2.4 0 0 -2.6 Z" fill={k === 1 ? LEAF_LIGHT : LEAF} transform={`translate(${x} ${y}) rotate(${p * 520 + k * 70})`} />
      })}
    </g>
  )
}

/** かみ・ひげ の 1ふさ。かぜが ないと 下へ たれ、かぜが ふくと 右へ なびく。 */
type Lock = { readonly from: Pt; readonly hangCtrl: Pt; readonly hangEnd: Pt; readonly windCtrl: Pt; readonly windEnd: Pt; readonly width: number }

const LOCK_TOP: Lock = { from: [40, 19.5], hangCtrl: [48, 28], hangEnd: [47, 46], windCtrl: [52, 13.5], windEnd: [67, 13.5], width: 4 }
const LOCK_BACK: Lock = { from: [45, 27], hangCtrl: [50, 40], hangEnd: [48, 56], windCtrl: [58, 28], windEnd: [70, 27.5], width: 4.6 }
const BEARD: Lock = { from: [33, 34.5], hangCtrl: [30, 43], hangEnd: [33, 52], windCtrl: [48, 41], windEnd: [68, 40], width: 4.6 }

function HairLock({ lock, wind, flutter }: { readonly lock: Lock; readonly wind: number; readonly flutter: number }) {
  const ctrl = mixPt(lock.hangCtrl, lock.windCtrl, wind)
  const end = mixPt(lock.hangEnd, lock.windEnd, wind)
  const d = `M${lock.from[0]} ${lock.from[1]} Q${ctrl[0]} ${ctrl[1] + flutter * 0.6} ${end[0]} ${end[1] + flutter}`
  return (
    <>
      <path d={d} fill="none" stroke={HAIR_SHADE} strokeWidth={lock.width + 1.4} strokeLinecap="round" />
      <path d={d} fill="none" stroke={HAIR} strokeWidth={lock.width} strokeLinecap="round" />
    </>
  )
}

/** かたの マフラー。かぜで 右へ なびく。 */
function Scarf({ wind, flutter }: { readonly wind: number; readonly flutter: number }) {
  const ctrl = mixPt([46, 50], [62, 47], wind)
  const end = mixPt([44, 66], [92, 53], wind)
  const d = `M38 41.5 Q${ctrl[0]} ${ctrl[1] + flutter * 0.6} ${end[0]} ${end[1] + flutter}`
  return (
    <>
      <path d={d} fill="none" stroke={SCARF_DARK} strokeWidth="5.4" strokeLinecap="round" />
      <path d={d} fill="none" stroke={SCARF} strokeWidth="4" strokeLinecap="round" />
    </>
  )
}

/** せなかの マント。かぜを うけて 右下へ ふくらむ。 */
function Cape({ wind, flutter }: { readonly wind: number; readonly flutter: number }) {
  const c1 = mixPt([47, 60], [66, 50], wind)
  const tip = mixPt([49, 86], [96, 91], wind)
  const c2 = mixPt([50, 75], [64, 80], wind)
  const d = `M41 41 Q${c1[0]} ${c1[1]} ${tip[0]} ${tip[1] + flutter} Q${c2[0]} ${c2[1] + flutter * 0.4} 44 66 Z`
  return (
    <>
      <path d={d} fill={CAPE} />
      <path d={`M43 44 Q${c1[0] - 2} ${c1[1] + 6} ${lerp(tip[0], 44, 0.22)} ${lerp(tip[1] + flutter, 66, 0.22)}`} fill="none" stroke={CAPE_DARK} strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    </>
  )
}

/** 元の 絵の 座標で 描いた ものを、いまの あたまの 位置・大きさに あわせて 置く */
function OnHead({ head, k, children }: { readonly head: Pt; readonly k: number; readonly children: React.ReactNode }) {
  return <g transform={`translate(${head[0]} ${head[1]}) scale(${k}) translate(${-ORIG_HEAD[0]} ${-ORIG_HEAD[1]})`}>{children}</g>
}

/** ふらついた ときの 「!」。あたまの まえ(左)の 上 */
function Alarm({ t, show, head, k }: { readonly t: number; readonly show: number; readonly head: Pt; readonly k: number }) {
  if (show <= 0) return null
  const bob = wave(t, 0.3) * 0.8
  return (
    <g opacity={show} transform={`translate(${head[0] - 13 * k} ${head[1] - 16 * k + bob})`}>
      <rect x="-1.3" y="-6" width="2.6" height="7" rx="1.3" fill="#e8534a" />
      <circle cx="0" cy="4" r="1.5" fill="#e8534a" />
    </g>
  )
}

/** つえを ついた しゅんかん の ほこり と ひびき。 */
function Thump({ t, x }: { readonly t: number; readonly x: number }) {
  const p = span(t, PLANT, PLANT + 0.8, easeOut)
  if (p <= 0 || p >= 1) return null
  const y = 96.4
  return (
    <g opacity={1 - p}>
      <ellipse cx={x - 3 - p * 6} cy={y - 1 - p * 2} rx={2 + p * 3} ry={1.4 + p * 1.6} fill="#ffffff" stroke="#d8e4d0" strokeWidth="0.6" />
      <ellipse cx={x + 3 + p * 6} cy={y - 1 - p * 2} rx={2 + p * 3} ry={1.4 + p * 1.6} fill="#ffffff" stroke="#d8e4d0" strokeWidth="0.6" />
      {[-1, 0, 1].map((k) => (
        <path key={k} d={`M${x + k * 4} ${y - 4 - p * 3} v${-3 - p * 2}`} stroke="#f0b04a" strokeWidth="1.1" strokeLinecap="round" transform={`rotate(${k * 28} ${x} ${y})`} />
      ))}
    </g>
  )
}

/** あるきの ポーズから 「うでの ふり」(-1〜1)を とりだす */
const armSwingOf = (limb: Limb | undefined): number => (limb && 'swing' in limb ? limb.swing / 24 : 0)

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)

  // かぜ: GUST から ふきはじめ、さいごまで ふきつづける
  const wind = span(t, GUST, GUST + 0.5, easeOut)
  // ふらつく ひつよう の ある あいだ(つえを つくと おさまる)
  const stumble = span(t, GUST, GUST + 0.3) * (1 - span(t, PLANT - 0.05, PLANT + 0.35, easeInOut))
  // つえが ま下に おりて ささる 度合い
  const plant = span(t, PLANT - 0.45, PLANT, easeIn)

  // あるく: 右から 来て、つえの ある ばしょ まで
  const w = walk(t, { from: STAND_X + 100, to: STAND_X, start: WALK, end: ARRIVE, build: 'elder', height: HEIGHT })
  const stride = armSwingOf(w.pose.rightArm)
  const stagger = Math.sin((t - GUST) * Math.PI * 2 * 2.2) * stumble * 0.8
  const dip = Math.sin(span(t, PLANT, PLANT + 0.25) * Math.PI) * 1.2

  // かぜに おされて 右へ のけぞる
  const lean = 13 * stumble * (0.75 + 0.25 * wave(t - GUST, 0.6))

  // うで と つえ: あるくときは つえを かついで ふり、ふらつくと ばたばた、つくと ま下に ささる
  const flail = wave(t, 0.5, 0.2) * stumble
  const staffRot = lerp(-38 + stride * 6 + flail * 28, 0, plant)
  const pose: PersonPose = {
    ...w.pose,
    ...(stumble > 0 ? { leftLeg: { swing: stagger * 17, bend: 0 }, rightLeg: { swing: -stagger * 17, bend: 0 } } : {}),
    // 左むき: てまえ(見える がわ)は 右の うで。つえを にぎる
    rightArm: { swing: lerp(25 + stride * 14 + flail * 18, 45, plant), bend: lerp(35, 23, plant) },
    leftArm: { swing: lerp(8 - stride * 14 - flail * 18, 6, plant), bend: lerp(20, 8, plant) },
    head: t < GUST ? -5 + stride * 2 : t < PLANT ? 10 * stumble : -4 * span(t, PLANT, PLANT + 0.3) * (1 - span(t, PLANT + 0.4, PLANT + 0.9)),
  }
  const face: Expression = t < GUST ? 'sleepy' : t < PLANT ? 'surprised' : 'smile'

  // つえ: 手から、かついだ ときは 後ろ下へ、つくと 地面まで ま下へ
  const base: PersonProps = { x: w.x, y: GROUND_Y - dip, facing: 'left', build: 'elder', height: HEIGHT, lean, pose }
  const rig = personRig(base)
  const hand = rig.world.arms.right.end
  const reachDown = lerp(STAFF_CARRY, Math.max(GROUND_Y - hand[1], 10), plant)
  const dirRad = ((90 + staffRot) * Math.PI) / 180
  const tip: Pt = [hand[0] + Math.cos(dirRad) * reachDown, hand[1] + Math.sin(dirRad) * reachDown]
  const staff = toolEnds({ kind: 'stick', tip }, hand, rig.scale)

  const head = rig.world.head
  const k = (rig.body.headR * rig.scale) / ORIG_HEAD_R
  // かぜの中の ひらひら: 先っぽほど ゆれる
  const flutter = wind * wave(t, 0.34) * 2.4
  const flutter2 = wind * wave(t, 0.4, 0.17) * 2.4
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sun t={t} x={13} y={13} r={6.2} />
        <Ground t={t} />
        <OnHead head={head} k={k}>
          <Cape wind={wind} flutter={flutter2} />
          <HairLock lock={LOCK_TOP} wind={wind} flutter={flutter2} />
          <HairLock lock={LOCK_BACK} wind={wind} flutter={flutter} />
        </OnHead>
        <Person {...base} look={{ ...LOOKS.elder, hair: HAIR, hairStyle: 'short', top: ROBE, bottom: PANTS }} face={face} tools={{ right: { kind: 'stick', tip } }} />
        <OnHead head={head} k={k}>
          <Scarf wind={wind} flutter={flutter} />
          <HairLock lock={BEARD} wind={wind} flutter={flutter} />
        </OnHead>
        <Alarm t={t} show={stumble} head={head} k={k} />
        <Sweat t={t} x={head[0] - 7 * k} y={head[1] - 8 * k} show={stumble} dir={1} />
        <Thump t={t} x={staff.tip[0]} />
        <Gust t={t} />
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
    { at: 0, label: 'はらっぱに お日さまが でる', sound: 'pop' },
    { at: WALK, label: 'かみの ながい おじいさんが つえを かついで あるいてくる' },
    { at: GUST, label: 'つよい かぜ! かみが なびいて ふらふら', sound: 'pop' },
    { at: PLANT, label: 'つえを とん と つく。ほっと にっこり', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '長 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
