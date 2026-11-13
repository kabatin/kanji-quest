/*
 * 白(しろ): どんぐりの からを むくと、なかは まっしろ。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … どんぐりの ぼうし(かさ)に ついた 小さな くき(さきに 葉)
 *   2画目(丨)  … どんぐりの 左の ふち
 *   3画目(𠃍)  … ぼうしの したから 右の ふち、まるい おしり まで ぐるっと
 *   4画目(一)  … どんぐりの まんなか(からを むいた あとの 白い み の たなびく かげ)
 *   5画目(一)  … どんぐりの そこ(地面 の すぐ上)
 *
 * ながれ
 *   どんぐりが ぽとんと おちてくる → おなかを すかせた りすが はねてきて、ぐうぐう
 *   → どんぐりを つかんで、ずるずる からを むく(右・まんなか・左 の じゅんに はがれる)
 *   → 中から まっしろな み が でてきて、りすは びっくり →「やった!」と にっこり
 *   → 白い み の ほね が ひかって、絵が うすくなり、字「白」が のこる
 *
 * 絵本の よう に どんぐりを 大きく描く(りすの 2ばいくらい)。そのかわり、形は ほんものどおり:
 *   どんぐりは ぼうし + からの ついた み。りすは 目と 耳が あたまに つき、まえあし は かた から出て ひじで まがり、
 *   大きな しっぽ は おしりから のびる。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '白'

const SUN = '#ffd24a'
const HILL = '#e2f2d2'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const SHELL = '#b97d3f'
const SHELL_DARK = '#8f5b2a'
const SHELL_LINE = '#7a4b22'
const CAP = '#6e4a2a'
const CAP_DARK = '#583a20'
const CAP_LIGHT = '#8a6238'
const KERNEL = '#fffdf2'
const KERNEL_SHADE = '#e6dbbd'
const FUR = '#d08a4c'
const FUR_DARK = '#b06f36'
const FUR_BELLY = '#f6e3c3'
const EYE = '#2b2b2b'
const NOSE = '#6b3b28'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const LAND = 0.55
const ENTER = 0.7
const SIT = 1.9
const REACH = 2.0
const CRACK = 2.5
/** 右・まんなか・左 の からが はがれ はじめる */
const PEEL_R = 2.9
const PEEL_M = 3.3
const PEEL_L = 3.7
const WOW = 4.3
const HAPPY = 5.1
const INK = 6.3
const DONE = 9.1
const DURATION = 9.8

/** どんぐりの み(白い ところ)の 形。左ふち x=27.5、右ふち x=84、そこ y=97.6 */
const NUT_D = 'M27.5 47 L80.5 41 Q84.6 40.6 84.2 45 L83 76 C82.6 93 72 97.8 55.5 97.8 C38 97.8 28.4 93 27.8 78 Z'
/** からを とめる しるし(ぼうしの下 y=52 を じく に はがれる) */
const PEEL_Y = 52

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
      <path d="M-4 99 Q18 76 44 91 Q72 70 113 94 V101 H-4 Z" fill={HILL} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="86" cy="14" rx="7" ry="3.2" />
        <ellipse cx="91" cy="12.2" rx="5" ry="3.2" />
      </g>
      <ellipse cx="54.5" cy="98.4" rx="52" ry="5.6" fill={GRASS} />
      {[6, 18, 46, 64, 100].map((x) => (
        <path key={x} d={`M${x} 98 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** からの ひとすじ(左・まんなか・右)。clip の はんいだけ 見せる。 */
type Strip = { readonly id: string; readonly from: number; readonly to: number; readonly pivotX: number }
const STRIPS: readonly Strip[] = [
  { id: 'k767d-l', from: 20, to: 45, pivotX: 36 },
  { id: 'k767d-m', from: 45, to: 66, pivotX: 55.5 },
  { id: 'k767d-r', from: 66, to: 92, pivotX: 75 },
]

/** からの ひとすじ ぶんの 見た目。みぞ(たてすじ)も つける。 */
function ShellStrip({ strip, lines }: { readonly strip: Strip; readonly lines: readonly number[] }) {
  return (
    <>
      <clipPath id={strip.id}>
        <rect x={strip.from} y="30" width={strip.to - strip.from} height="75" />
      </clipPath>
      <g clipPath={`url(#${strip.id})`}>
        <path d={NUT_D} fill={SHELL_DARK} stroke={SHELL_DARK} strokeWidth="1.6" strokeLinejoin="round" />
        <path d={NUT_D} fill={SHELL} transform="translate(-1.6 -1.2)" />
        {lines.map((x) => (
          <path key={x} d={`M${x} 60 q1 12 0 24`} fill="none" stroke={SHELL_LINE} strokeWidth="1" strokeLinecap="round" opacity="0.55" />
        ))}
      </g>
    </>
  )
}

/** からの ひとすじ が はがれる ようす。pivot を じくに 外へ ひらき、そのあと ストンと おちて きえる。 */
function peelOf(t: number, start: number, dir: number) {
  const open = span(t, start, start + 0.45, easeOut)
  const fall = span(t, start + 0.45, start + 1.0, easeIn)
  return {
    rotate: dir * 26 * open,
    scaleX: 1 - 0.45 * open,
    x: dir * 8 * fall,
    y: 40 * fall,
    opacity: 1 - span(t, start + 0.8, start + 1.1),
  }
}

type PeelState = ReturnType<typeof peelOf>

function Acorn({ t }: SceneProps) {
  const peels: readonly PeelState[] = [peelOf(t, PEEL_L, 1), peelOf(t, PEEL_M, 1), peelOf(t, PEEL_R, -1)]
  const crack = span(t, CRACK, PEEL_R + 0.3)
  const done = t >= PEEL_L + 1.1
  // みの ぴかぴか(からを むいた あとに、白い みが 光る)
  const shine = during(t, WOW - 0.1, INK + 0.1, 0.3)
  const shake = t > PEEL_R - 0.2 && t < PEEL_L + 0.6 ? Math.sin((t - PEEL_R) * 18) * 1.1 * Math.min(1, (t - PEEL_R + 0.2) * 3) : 0
  return (
    <Layer rotate={shake} origin={[55, 97]}>
      {/* 白い み(からの中に ずっと あった) */}
      <path d={NUT_D} fill={KERNEL_SHADE} />
      <path d={NUT_D} fill={KERNEL} transform="translate(-1.6 -1.2)" />
      <g opacity={shine}>
        <Star cx={42} cy={64} r={3.4 + wave(t, 0.9) * 0.6} color="#ffe08a" spin={t * 40} />
        <Star cx={70} cy={78} r={2.6 - wave(t, 0.9, 0.3) * 0.5} color="#ffd24a" spin={-t * 40} />
      </g>
      {/* から: 3本の すじ。pivot を じくに はがれる */}
      {!done && (
        <>
          {STRIPS.map((strip, i) => {
            const peel = peels[i]
            if (peel.opacity <= 0) return null
            return (
              <Layer key={strip.id} x={peel.x} y={peel.y} rotate={peel.rotate} scaleX={peel.scaleX} origin={[strip.pivotX, PEEL_Y]} opacity={peel.opacity}>
                <ShellStrip strip={strip} lines={i === 0 ? [33, 40] : i === 1 ? [52, 60] : [70, 78]} />
              </Layer>
            )
          })}
          {/* からの われめ: 上から したへ ぎざぎざ に のびる */}
          <g opacity={crack * (1 - span(t, PEEL_R + 0.4, PEEL_R + 0.7))}>
            {[45, 66].map((x) => (
              <path key={x} d={`M${x} 52 l3 8 l-3 8 l3 9 l-3 9 l3 8`} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - crack} fill="none" stroke={SHELL_LINE} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </g>
        </>
      )}
      {/* ぼうし(かさ)と くき: 1画目の くき */}
      <Bone char={CHAR} n={1} color={CAP} width={4} />
      <path d="M55 13 q-5 -3 -9 -1 q4 5 9 1 Z M55 13 q5 -4 9 -2 q-3 6 -9 2 Z" fill={LEAF_DARK} />
      <g transform="rotate(-6 55 46)">
        <path d="M24.6 54 Q22.5 41 37 38.4 Q55 35.4 73 37.6 Q88 40 86.4 54 Q55 60.5 24.6 54 Z" fill={CAP_DARK} />
        <path d="M24.6 54 Q22.5 41 37 38.4 Q55 35.4 73 37.6 Q88 40 86.4 54 Q55 60.5 24.6 54 Z" fill={CAP} transform="translate(-0.4 -1.2)" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <circle key={i} cx={30.5 + i * 7.2} cy={46.5 + (i % 2) * 2.6} r="1.2" fill={CAP_LIGHT} />
        ))}
      </g>
    </Layer>
  )
}

/** どんぐりが おちた ときの ほこり */
function Dust({ t }: SceneProps) {
  const p = span(t, LAND, LAND + 0.6, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g fill="#ffffff" opacity={0.85 * (1 - p)}>
      <ellipse cx={22 - p * 6} cy={96.5 - p * 4} rx={2.5 + p * 3} ry={1.6 + p * 2} />
      <ellipse cx={88 + p * 5} cy={96.5 - p * 4} rx={2.5 + p * 3} ry={1.6 + p * 2} />
    </g>
  )
}

/** はがれ おちた からの かけら(地面に のこる) */
function ShellBits({ t }: SceneProps) {
  const a = span(t, PEEL_R + 0.9, PEEL_R + 1.1)
  const b = span(t, PEEL_M + 0.9, PEEL_M + 1.1)
  const c = span(t, PEEL_L + 0.9, PEEL_L + 1.1)
  return (
    <>
      <Layer opacity={c}>
        <path d="M14 97.4 Q18 91.5 24 96.5 Q20 99 14 97.4 Z" fill={SHELL} />
        <path d="M14 97.4 Q20 99 24 96.5 Q20 99.6 14 97.4 Z" fill={SHELL_DARK} />
      </Layer>
      <Layer opacity={b}>
        <path d="M44 99 Q48 94.6 54 98.4 Q50 100.4 44 99 Z" fill={SHELL} />
      </Layer>
      <Layer opacity={a}>
        <path d="M66 99.2 Q70 95 76 98.6 Q72 100.4 66 99.2 Z" fill={SHELL} />
      </Layer>
    </>
  )
}

type Mood = 'hungry' | 'eager' | 'wow' | 'happy'
type Point = readonly [number, number]

const SHOULDER_NEAR: Point = [86.5, 77.5]
const SHOULDER_FAR: Point = [90.5, 77.5]
/** うで の ながさ(かた→ひじ、ひじ→手) */
const ARM_PART = 7

/** かた と 手 の 位置から、ひじ を さがす(ひじ は 下がわ に まがる) */
function elbowOf(shoulder: Point, hand: Point): Point {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const d = Math.min(Math.hypot(dx, dy), ARM_PART * 2 - 0.01)
  const half = d / 2
  const h = Math.sqrt(ARM_PART * ARM_PART - half * half)
  const ux = dx / (Math.hypot(dx, dy) || 1)
  const uy = dy / (Math.hypot(dx, dy) || 1)
  const mx = shoulder[0] + ux * half
  const my = shoulder[1] + uy * half
  const a: Point = [mx - uy * h, my + ux * h]
  const b: Point = [mx + uy * h, my - ux * h]
  const score = (p: Point) => p[1] + p[0] * 0.1
  return score(a) >= score(b) ? a : b
}

/** かた から出て ひじ で まがる うで。手の 位置 だけ きめる。 */
function Arm({ shoulder, hand, color }: { readonly shoulder: Point; readonly hand: Point; readonly color: string }) {
  const elbow = elbowOf(shoulder, hand)
  // 手が とどかない ときは、のばした先を 手にする
  const d = Math.hypot(hand[0] - shoulder[0], hand[1] - shoulder[1])
  const k = d > ARM_PART * 2 - 0.01 ? (ARM_PART * 2 - 0.01) / d : 1
  const end: Point = [shoulder[0] + (hand[0] - shoulder[0]) * k, shoulder[1] + (hand[1] - shoulder[1]) * k]
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${end[0]} ${end[1]}`} fill="none" stroke={color} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={end[0]} cy={end[1]} r="2.2" fill={FUR_DARK} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <ellipse cx="83.8" cy="69.6" rx="4.4" ry="3.2" fill={FUR_BELLY} />
      <circle cx="80.6" cy="68" r="1.3" fill={NOSE} />
      <circle cx="84.6" cy="71.2" r="1.7" fill={CHEEK} opacity={mood === 'happy' ? 0.8 : 0.45} />
      {mood === 'happy' ? (
        <>
          <path d="M82.6 65.4 Q84.2 63.4 85.8 65.4" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M88.2 65.2 Q89.8 63.2 91.4 65.2" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M81.6 70.2 Q83.6 73.4 86 70.4" fill={MOUTH} stroke={MOUTH} strokeWidth="0.8" strokeLinejoin="round" />
        </>
      ) : mood === 'wow' ? (
        <>
          <circle cx="84.2" cy="65.2" r="2.2" fill="#ffffff" />
          <circle cx="89.6" cy="64.8" r="2.2" fill="#ffffff" />
          <circle cx="83.8" cy="65.2" r="1.1" fill={EYE} />
          <circle cx="89.2" cy="64.8" r="1.1" fill={EYE} />
          <ellipse cx="83.4" cy="72.6" rx="1.3" ry="1.7" fill={MOUTH} />
        </>
      ) : (
        <>
          <circle cx="84.2" cy="65.4" r={mood === 'eager' ? 1.5 : 1.2} fill={EYE} />
          <circle cx="89.6" cy="65" r={mood === 'eager' ? 1.5 : 1.2} fill={EYE} />
          {mood === 'eager' ? (
            <>
              <circle cx="84.7" cy="64.9" r="0.5" fill="#ffffff" />
              <circle cx="90.1" cy="64.5" r="0.5" fill="#ffffff" />
              <path d="M81.6 71.6 Q83.4 73.4 85.2 71.6" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d="M82.4 63.2 l3.4 1.2 M88 62.6 l3 -0.8" stroke={FUR_DARK} strokeWidth="1" strokeLinecap="round" />
              <path d="M82 73 Q83.8 71.6 85.4 72.8" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
            </>
          )}
        </>
      )}
    </>
  )
}

type SquirrelProps = {
  readonly mood: Mood
  readonly hand: Point
  readonly tail: number
  readonly headTilt: number
}

function Squirrel({ mood, hand, tail, headTilt }: SquirrelProps) {
  return (
    <>
      {/* しっぽ: おしりから のびて、せなかの うしろで 大きく まがる */}
      <Layer rotate={tail} origin={[99, 92]}>
        <path d="M99 93 C104.6 86 104.6 73 101.5 65" fill="none" stroke={FUR_DARK} strokeWidth="8" strokeLinecap="round" />
        <path d="M99 93 C104 86 104 73.6 101.4 66" fill="none" stroke={FUR} strokeWidth="5" strokeLinecap="round" />
      </Layer>
      {/* むこうの うで(体の うしろ) */}
      <Arm shoulder={SHOULDER_FAR} hand={[hand[0] + 2.4, hand[1] + 1.2]} color={FUR_DARK} />
      {/* あし */}
      <ellipse cx="86" cy="97" rx="5.2" ry="2.5" fill={FUR_DARK} />
      <ellipse cx="97.2" cy="97" rx="5" ry="2.5" fill={FUR_DARK} />
      {/* どう */}
      <ellipse cx="92.4" cy="85" rx="10" ry="13" fill={FUR} />
      <ellipse cx="89.6" cy="87.4" rx="5.4" ry="8.4" fill={FUR_BELLY} />
      {/* てまえの うで */}
      <Arm shoulder={SHOULDER_NEAR} hand={hand} color={FUR} />
      {/* あたま: くび は みじかく、どう の 上に のる */}
      <Layer rotate={headTilt} origin={[89, 72]}>
        <circle cx="83.2" cy="58.4" r="2.8" fill={FUR_DARK} />
        <circle cx="92.4" cy="58" r="2.8" fill={FUR_DARK} />
        <circle cx="83.2" cy="58.6" r="1.4" fill={CHEEK} opacity="0.6" />
        <circle cx="88" cy="66.4" r="8.2" fill={FUR} />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

/** ぐうぐう: ぺこぺこの おなかから ひびく しるし(ちいさな ふるえ線) */
function Growl({ t }: SceneProps) {
  const show = during(t, ENTER + 0.3, REACH + 0.2, 0.2)
  if (show <= 0) return null
  const wob = wave(t, 0.3)
  return (
    <g opacity={show} fill="none" stroke="#7a8fb8" strokeWidth="0.9" strokeLinecap="round">
      <path d={`M${79 + wob * 0.5} 84 q-2 2.4 0 4.6`} />
      <path d={`M${75.6 - wob * 0.5} 82.6 q-3 4 0 7.4`} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)

  // どんぐり: うえから おちて、ひとつ はずむ
  const fall = span(t, 0, LAND, easeIn)
  const bounce = Math.sin(span(t, LAND, LAND + 0.4) * Math.PI) * 5
  const acornY = -(1 - fall) * 112 - bounce
  const shadow = span(t, 0.1, LAND)

  // りす: はねながら 入ってきて、どんぐりの よこに すわる
  const run = span(t, ENTER, SIT, easeOut)
  const squirrelX = (1 - run) * 46
  const hop = run > 0 && run < 1 ? -Math.abs(Math.sin(run * Math.PI * 3)) * 5 : 0
  const squirrelOn = span(t, ENTER - 0.05, ENTER + 0.05)

  const mood: Mood = t < REACH ? 'hungry' : t < WOW ? 'eager' : t < HAPPY ? 'wow' : 'happy'

  // 手: さいしょは おなか → どんぐりへ のばす → ずるずる ひく → びっくり(あたまの よこ)→ にっこり(むねの前)
  const tug = t >= PEEL_R - 0.4 && t < WOW ? Math.sin((t - PEEL_R) * 16) * 1.4 : 0
  const reachP = span(t, REACH, REACH + 0.5, easeInOut)
  const surpriseP = span(t, WOW, WOW + 0.25, backOut)
  const happyP = span(t, HAPPY, HAPPY + 0.4, easeInOut)
  const idleHand: Point = [87, 87]
  const tugHand: Point = [80.2 + tug, 76 + tug * 0.5]
  const wowHand: Point = [80.5, 62.5]
  const happyHand: Point = [82.5, 80]
  const afterReach: Point = [mix(t, REACH, REACH + 0.5, idleHand[0], tugHand[0]), mix(t, REACH, REACH + 0.5, idleHand[1], tugHand[1])]
  const base = reachP > 0 ? afterReach : idleHand
  const toWow: Point = [base[0] + (wowHand[0] - base[0]) * surpriseP, base[1] + (wowHand[1] - base[1]) * surpriseP]
  const hand: Point = [toWow[0] + (happyHand[0] - toWow[0]) * happyP, toWow[1] + (happyHand[1] - toWow[1]) * happyP]

  // ひきずる とき 体を かたむける、うれしい ときは ぴょんぴょん
  const rock = t >= PEEL_R - 0.4 && t < WOW ? Math.sin((t - PEEL_R) * 16) * 2.2 : 0
  const joy = t >= HAPPY ? -Math.abs(Math.sin((t - HAPPY) * Math.PI * 2.2)) * 3 * (1 - span(t, HAPPY + 1.6, INK)) : 0
  const startle = Math.sin(span(t, WOW, WOW + 0.3) * Math.PI) * -3
  const tail = wave(t, 1.6) * 4 + (t >= HAPPY ? wave(t, 0.5) * 5 : 0)

  // 「!」: びっくり した しゅんかん
  const bang = during(t, WOW, HAPPY + 0.1, 0.1)
  const bangScale = span(t, WOW, WOW + 0.25, backOut)

  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <ellipse cx="55.5" cy="98" rx={30 * shadow} ry="3" fill="#000000" opacity="0.12" />
        <Layer y={acornY}>
          <Acorn t={t} />
        </Layer>
        <Dust t={t} />
        <ShellBits t={t} />
        <Layer opacity={squirrelOn}>
          <Layer x={squirrelX} y={hop + joy + startle} rotate={rock} origin={[92, 97]}>
            <Squirrel mood={mood} hand={hand} tail={tail} headTilt={mood === 'wow' ? -4 : mood === 'happy' ? 4 : mood === 'hungry' ? 3 : 0} />
          </Layer>
          <Growl t={t} />
        </Layer>
        <Layer opacity={bang} scale={Math.max(0, bangScale)} origin={[96, 52]} y={joy}>
          <path d="M96 44 v6.4" stroke="#e8534a" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="96" cy="54.4" r="1.2" fill="#e8534a" />
        </Layer>
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Layer scale={1 + bump} origin={[54.5, 54.5]}>
        <Ink char={CHAR} progress={ink.progress} tint={ink.tint} />
      </Layer>
      <Sparkles cx={54.5} cy={56} progress={ink.sparkle} />
    </>
  )
}

const scene: SceneModule = {
  char: CHAR,
  duration: DURATION,
  beats: [
    { at: 0, label: 'どんぐりが ぽとんと おちる', sound: 'pop' },
    { at: ENTER, label: 'おなかを すかせた りすが はねてくる' },
    { at: REACH, label: 'どんぐりを つかむ', sound: 'pop' },
    { at: PEEL_R, label: 'ずるずる からを むく' },
    { at: WOW, label: '中は まっしろ! りすは びっくり', sound: 'pop' },
    { at: HAPPY, label: 'うれしくて ぴょんぴょん' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '白 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
