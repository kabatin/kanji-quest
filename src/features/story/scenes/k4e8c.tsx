/*
 * 二(に): ぼうが 2本。上が みじかく、下が 長い。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 木から おちてきた みじかい えだ。男の子が りょうてで あたまの上に かかげる(上・みじかい)
 *   2画目(一)  … 地面に ころがっている 長い ぼう(下・長い)
 *
 * ながれ
 *   男の子が 地面の 長い ぼうを ながめて「つまんないな」(1本だけ)
 *   → 風が ぴゅう。木の えだが ゆれて、みじかい えだが ぽきっ と おちてくる
 *   → 男の子は びっくり。りょうてを あげて、えだを ぱしっ と うけとめる
 *   → 「ぼうが 2本!」と うれしくて ぴょん。上の えだは みじかく、下の ぼうは 長い
 *   → ほね が ひかって、絵が うすくなり、字「二」が のこる
 *
 * 男の子は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   くび は みじかく、うで は かた から出て ひじ で まがる。
 *   えだを つかむ手は、かた と 手の きょり から、ひじ の位置を 計算して きめる(うでの 長さは かわらない)。
 *   上を 見ると 顔が 上へ、下を 見ると 顔が 下へ よる。
 */
import type { ReactNode } from 'react'
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '二'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#ff9f43'
const TUNIC_DARK = '#e8832a'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const GRASS = '#c5e8a9'
const HILL = '#e2f2d2'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const APPEAR = 0.2
/** 風が ふきはじめる / びっくりして 上を見る */
const WIND = 3.0
const LOOK_UP = 3.3
const SURPRISE = 3.45
/** えだが おちはじめる / 手で うけとめる */
const FALL = 3.9
const CATCH = 4.8
const INK = 6.9
const DONE = 9.3
const DURATION = 10

/** 人の まんなか(x) と 足もと(y) */
const CX = 53
const FEET_Y = 90
/** かたの位置(左・右) */
const SHOULDER_L: readonly [number, number] = [47, 58]
const SHOULDER_R: readonly [number, number] = [59, 58]
/** うでの ふしの 長さ(かた→ひじ、ひじ→手 の どちらも) */
const ARM_PART = 15.5
/** 手を おろしている ときの 位置 */
const HAND_REST_L: readonly [number, number] = [44.5, 88.5]
const HAND_REST_R: readonly [number, number] = [61.5, 88.5]
/** えだ(1画目)を つかむ 位置。左右の手が えだの 同じ高さで 左右ふりあい */
const HAND_UP_L: readonly [number, number] = [38, 30.5]
const HAND_UP_R: readonly [number, number] = [68, 30.5]
/** えだが 木に ついている ときの たかさ(ずれ) */
const BRANCH_HIGH = -12

type Point = readonly [number, number]

/** かた と 手 の 位置から、ひじ を 計算する(ひじは 外がわへ まがる) */
function solveArm(shoulder: Point, target: Point, outward: -1 | 1): { readonly elbow: Point; readonly hand: Point } {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.max(Math.hypot(dx, dy), 0.001)
  const reach = Math.min(dist, ARM_PART * 2 - 0.05)
  const ux = dx / dist
  const uy = dy / dist
  const midX = shoulder[0] + (ux * reach) / 2
  const midY = shoulder[1] + (uy * reach) / 2
  const height = Math.sqrt(Math.max(ARM_PART ** 2 - (reach / 2) ** 2, 0))
  // ま横の向き(うでの すじに ななめ に ならぶ)。外がわを むく ほうを えらぶ
  const px = -uy
  const py = ux
  const sign = (px === 0 ? 1 : Math.sign(px)) * outward > 0 ? 1 : -1
  return {
    elbow: [midX + px * height * sign, midY + py * height * sign],
    hand: [shoulder[0] + ux * reach, shoulder[1] + uy * reach],
  }
}

/** 空・おか・くも・草。うしろの けしき */
function Backdrop({ t }: SceneProps) {
  const grow = span(t, 0, 0.6, easeOut)
  return (
    <>
      <rect x="0" y="0" width="109" height="109" fill="#e6f4ff" />
      <g fill="#ffffff" opacity="0.95" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="8" cy="46" rx="8" ry="3.4" />
        <ellipse cx="14" cy="44" rx="5.4" ry="3.4" />
        <ellipse cx="92" cy="54" rx="7" ry="3" />
        <ellipse cx="97" cy="52.2" rx="4.6" ry="3" />
      </g>
      <Layer scaleY={grow} origin={[54.5, 109]}>
        <path d="M-4 70 Q22 60 48 66 Q78 58 113 68 V113 H-4 Z" fill={HILL} />
        <path d="M-4 73 Q54 68 113 73 V113 H-4 Z" fill={GRASS} />
        {[6, 22, 84, 100].map((x) => (
          <path key={x} d={`M${x} 104 l1.4 -4 l1 3.4 l1.6 -4.6 l0.8 5 Z`} fill={LEAF} />
        ))}
        {[14, 92].map((x, i) => (
          <g key={x}>
            <circle cx={x} cy={96 + i} r="1.6" fill="#ff8fb1" />
            <circle cx={x} cy={96 + i} r="0.7" fill="#ffd24a" />
          </g>
        ))}
      </Layer>
    </>
  )
}

/** 木の しげみ。上の はしに かぶさって、風で ゆれる(えだは この したから おちる) */
function Canopy({ t }: SceneProps) {
  const gust = during(t, WIND, FALL + 0.7, 0.3)
  const sway = wave(t, 0.38) * (0.4 + 2.6 * gust)
  return (
    <Layer rotate={sway} origin={[54.5, -4]}>
      {[2, 22, 42, 62, 82, 102].map((x, i) => (
        <circle key={`d${x}`} cx={x} cy={7 + (i % 2) * 2} r="13" fill={LEAF_DARK} />
      ))}
      {[12, 32, 52, 72, 92].map((x, i) => (
        <circle key={`l${x}`} cx={x} cy={4 + (i % 2) * 2} r="11" fill={LEAF} />
      ))}
      <circle cx="30" cy="3" r="4.2" fill={LEAF_LIGHT} />
      <circle cx="76" cy="2" r="3.6" fill={LEAF_LIGHT} />
    </Layer>
  )
}

/** 地面に ころがる 長い ぼう(2画目)。ほんものの ぼうと同じく、はしに ちいさな 芽。 */
function LongStick() {
  return (
    <>
      <Bone char={CHAR} n={2} color={BARK} width={5.6} />
      <path d="M16.6 79 q-1.6 -3.4 0.4 -6.6" fill="none" stroke={BARK} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M0 0 Q3.4 -1.6 5 -5.4 Q0.8 -5.2 0 0 Z" fill={LEAF} transform="translate(17.4 72.8) rotate(8)" />
    </>
  )
}

/** 木から おちる みじかい えだ(1画目)。小さな 葉が 2まい。 */
function Branch() {
  return (
    <>
      <Bone char={CHAR} n={1} color={BARK} width={5} />
      <path d="M0 0 Q3.2 -1.4 4.8 -5 Q0.8 -5 0 0 Z" fill={LEAF} transform="translate(30.5 29) rotate(-12)" />
      <path d="M0 0 Q3 1.6 4.6 5.4 Q0.6 5 0 0 Z" fill={LEAF_DARK} transform="translate(37 32) rotate(16)" />
    </>
  )
}

type Mood = 'bored' | 'surprised' | 'happy'

function Face({ mood, look }: { readonly mood: Mood; readonly look: number }) {
  // 上を見ると 顔の ぶひんが 上へ、下を見ると 下へ
  const shift = look * 2.4
  return (
    <g transform={`translate(0 ${shift})`}>
      <circle cx="46.8" cy="48.2" r="2.1" fill={CHEEK} opacity={mood === 'happy' ? 0.8 : 0.5} />
      <circle cx="59.2" cy="48.2" r="2.1" fill={CHEEK} opacity={mood === 'happy' ? 0.8 : 0.5} />
      {mood === 'bored' && (
        <>
          <ellipse cx="49.2" cy="44.4" rx="1.4" ry="1.5" fill={EYE} />
          <ellipse cx="56.8" cy="44.4" rx="1.4" ry="1.5" fill={EYE} />
          <path d="M47.2 42.4 L51 41.2 M55 41.2 L58.8 42.4" fill="none" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <path d="M50.8 50.2 Q53 48.8 55.2 50.2" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'surprised' && (
        <>
          <circle cx="49.2" cy="44" r="2.5" fill="#ffffff" stroke="#c9b9a8" strokeWidth="0.5" />
          <circle cx="56.8" cy="44" r="2.5" fill="#ffffff" stroke="#c9b9a8" strokeWidth="0.5" />
          <circle cx="49.2" cy="43.3" r="1.2" fill={EYE} />
          <circle cx="56.8" cy="43.3" r="1.2" fill={EYE} />
          <path d="M46.6 40 q2.6 -1.8 5 0 M54.4 40 q2.6 -1.8 5 0" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <ellipse cx="53" cy="50.2" rx="1.4" ry="1.9" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M47.2 44.8 Q49.2 41.8 51.2 44.8 M54.8 44.8 Q56.8 41.8 58.8 44.8" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M49.4 48.6 Q53 54.4 56.6 48.6 Z" fill={MOUTH} />
          <path d="M51 51.4 Q53 50.2 55 51.4 Q53 53 51 51.4 Z" fill="#ff8a8a" />
        </>
      )}
    </g>
  )
}

type KidProps = {
  readonly mood: Mood
  readonly look: number
  /** うでを あげた度合い(0 = おろす / 1 = あたまの上) */
  readonly raise: number
  /** 手の たかさの ずれ(えだを うけとめて ぐっと さがる とき) */
  readonly handDrop: number
  readonly sway: number
  readonly tap: number
  readonly breath: number
  readonly hair: number
  /** 手にもつ もの(うでの したに かさなる) */
  readonly held: ReactNode
}

function Kid({ mood, look, raise, handDrop, sway, tap, breath, hair, held }: KidProps) {
  const lerp = (a: Point, b: Point): Point => [a[0] + (b[0] - a[0]) * raise, a[1] + (b[1] - a[1]) * raise + handDrop * raise]
  const left = solveArm(SHOULDER_L, lerp(HAND_REST_L, HAND_UP_L), -1)
  const right = solveArm(SHOULDER_R, lerp(HAND_REST_R, HAND_UP_R), 1)
  const arm = (a: { readonly elbow: Point; readonly hand: Point }, s: Point, color: string) => (
    <>
      <path d={`M${s[0]} ${s[1]} L${a.elbow[0]} ${a.elbow[1]} L${a.hand[0]} ${a.hand[1]}`} fill="none" stroke={color} strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={a.hand[0]} cy={a.hand[1]} r="3.1" fill={SKIN} />
    </>
  )
  return (
    <>
      <ellipse cx={CX} cy="91.4" rx="12" ry="2.6" fill="#000000" opacity="0.12" />
      <Layer x={sway * 0.5} origin={[CX, FEET_Y]}>
        {/* あし(ズボンから はみ出る ふくらはぎ と くつ)。ひだりは じっと、みぎは ときどき とんとん */}
        <rect x="46.8" y="74" width="4.4" height="15.6" rx="2.2" fill={SKIN} />
        <ellipse cx="48.6" cy="90.6" rx="4.2" ry="2.4" fill={SHOE} />
        <rect x="45.6" y="68" width="6.8" height="11" rx="3" fill={PANTS} />
        <Layer rotate={tap} origin={[57, 74]}>
          <rect x="54.8" y="74" width="4.4" height="15.6" rx="2.2" fill={SKIN} />
          <ellipse cx="57.4" cy="90.6" rx="4.2" ry="2.4" fill={SHOE} />
          <rect x="53.6" y="68" width="6.8" height="11" rx="3" fill={PANTS} />
        </Layer>
        <Layer y={-breath * 0.5} origin={[CX, FEET_Y]}>
          {/* くび: みじかく、どう と あたま の間 */}
          <rect x="50.6" y="50" width="4.8" height="8" rx="2.2" fill={SKIN_SHADE} />
          <rect x="45" y="54" width="16" height="19" rx="6.5" fill={TUNIC} />
          <path d="M47 66.5 h12" stroke={TUNIC_DARK} strokeWidth="1.4" strokeLinecap="round" />
          <Layer origin={[CX, 53]} rotate={sway * 0.8}>
            <circle cx={CX} cy="44" r="9.5" fill={SKIN} />
            <path d="M43.5 43.4 C42 32.6 49 32.8 53 33 C57 32.8 64 32.6 62.5 43.4 C60.6 38.8 57 38 53 38.2 C49 38 45.4 38.8 43.5 43.4 Z" fill={HAIR} />
            <path d={`M${50.4 + hair * 0.6} 33.2 Q${50.6 + hair} 29.6 ${52.6 + hair} 31.8 Q${54 + hair} 29 ${55.2 + hair * 1.2} 32.6`} fill="none" stroke={HAIR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <Face mood={mood} look={look} />
          </Layer>
        </Layer>
        {held}
        {arm(left, SHOULDER_L, TUNIC_DARK)}
        {arm(right, SHOULDER_R, TUNIC_DARK)}
      </Layer>
    </>
  )
}

/** つまらなくて「ふう」。口から 左上へ。 */
function Sigh({ t }: SceneProps) {
  const show = during(t, 1.9, 2.8, 0.2)
  if (show <= 0) return null
  const p = span(t, 1.9, 2.8, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={46 - p * 8} cy={51 - p * 4} rx={2.4 + p * 2.2} ry={1.6 + p * 1.4} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <ellipse cx={42 - p * 5} cy={52 - p * 1.6} rx={1.2 + p} ry={0.9 + p * 0.5} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
    </g>
  )
}

/** ひらひら とぶ ちょうちょ。つまらない間の にぎやかし。 */
function Butterfly({ t }: SceneProps) {
  const p = span(t, 0.8, 3.1)
  if (p <= 0 || p >= 1) return null
  const x = -4 + p * 116
  const y = 62 + Math.sin(p * 9) * 5 - p * 6
  const flap = 0.35 + 0.65 * Math.abs(wave(t, 0.22))
  return (
    <Layer x={x} y={y}>
      <Layer scaleX={flap}>
        <ellipse cx="-2.2" cy="-1.4" rx="2.6" ry="2" fill="#ffb347" />
        <ellipse cx="2.2" cy="-1.4" rx="2.6" ry="2" fill="#ffb347" />
        <ellipse cx="-1.8" cy="1.2" rx="1.8" ry="1.4" fill="#f78c3b" />
        <ellipse cx="1.8" cy="1.2" rx="1.8" ry="1.4" fill="#f78c3b" />
      </Layer>
      <rect x="-0.4" y="-2.4" width="0.8" height="5" rx="0.4" fill="#5a3b2a" />
    </Layer>
  )
}

/** 風の すじ。左から 右へ ぴゅう。 */
function WindStreaks({ t }: SceneProps) {
  const show = during(t, WIND, FALL + 0.2, 0.2)
  if (show <= 0) return null
  const p = span(t, WIND, FALL + 0.2)
  return (
    <g opacity={show * 0.9} fill="none" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round">
      {[60, 68, 76].map((y, i) => (
        <path key={y} d={`M${-20 + p * 150 - i * 12} ${y} q9 -3 18 0 t10 0`} />
      ))}
    </g>
  )
}

/** 風で ちぎれた 葉が ひらひら おちる。 */
function FallingLeaves({ t }: SceneProps) {
  return (
    <>
      {[
        { x0: 20, from: WIND + 0.2, drift: 8 },
        { x0: 78, from: WIND + 0.6, drift: -9 },
        { x0: 98, from: FALL, drift: -6 },
      ].map(({ x0, from, drift }) => {
        const p = span(t, from, from + 2.2)
        if (p <= 0 || p >= 1) return null
        const x = x0 + drift * p + Math.sin(p * 10) * 4
        const y = 16 + p * 64
        return <path key={x0} d="M0 -3 Q2.6 0 0 3 Q-2.6 0 0 -3 Z" fill={LEAF_LIGHT} stroke={LEAF_DARK} strokeWidth="0.5" transform={`translate(${x} ${y}) rotate(${Math.sin(p * 10) * 50 + 20})`} opacity={1 - p * 0.4} />
      })}
    </>
  )
}

/** 「！」(びっくり)。あたまの上。 */
function Surprise({ t }: SceneProps) {
  const show = during(t, SURPRISE, FALL + 0.1, 0.12)
  if (show <= 0) return null
  const pop = span(t, SURPRISE, SURPRISE + 0.25, backOut)
  return (
    <Layer opacity={show} scale={Math.max(0, pop)} origin={[CX, 27]}>
      <rect x="51.4" y="17" width="3.2" height="7.6" rx="1.6" fill="#ef5b4a" />
      <circle cx={CX} cy="28.2" r="1.8" fill="#ef5b4a" />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 2)

  const appear = Math.max(0, span(t, APPEAR, APPEAR + 0.6, backOut))
  const caught = t >= CATCH
  const mood: Mood = t < SURPRISE ? 'bored' : t < CATCH ? 'surprised' : 'happy'

  // 目線: つまらない間は 下、風で 上、うけとめたら 下(長いぼう)→ 上(みじかい えだ)をくらべる
  const blend = (v: number, from: number, to: number, target: number) => v + (target - v) * span(t, from, to, easeInOut)
  let look = mix(t, 1.0, 1.5, 0, 0.9)
  look = blend(look, LOOK_UP, LOOK_UP + 0.25, -1)
  look = blend(look, 5.5, 5.9, 0.9)
  look = blend(look, 6.2, 6.6, -0.7)

  // えだ: 風で ゆれる → ぽきっ と おちる → 手に おさまる(ぐっと さがって もどる)
  const shake = during(t, WIND + 0.3, FALL, 0.2) * wave(t, 0.1) * 3.2
  const fallY = mix(t, FALL, CATCH, BRANCH_HIGH, 0, easeIn)
  const dip = Math.sin(span(t, CATCH, CATCH + 0.3) * Math.PI) * 1.6
  const tilt = t < FALL ? shake : 7 * (1 - span(t, FALL, CATCH, easeOut)) * wave(t, 0.5)

  // 男の子: うでを あげて まちかまえ → うけとめて ぴょん
  const raise = span(t, FALL, CATCH - 0.1, easeInOut)
  const hop = Math.sin(span(t, 5.0, 5.5) * Math.PI) * 5
  const breath = wave(t, 2.2)
  const tap = t < SURPRISE ? Math.max(0, wave(t, 0.9)) * 9 : 0
  const gustShake = during(t, WIND, FALL + 0.6, 0.3) * wave(t, 0.3)
  const sway = t < WIND ? wave(t, 3) * 0.6 : gustShake * 1.2
  const hair = wave(t, 0.3) * (t >= WIND && t < CATCH ? 1.6 : 0.3)

  const heldBranch = caught ? (
    <Layer y={dip} rotate={0}>
      <Branch />
    </Layer>
  ) : null
  const freeBranch = !caught ? (
    <Layer y={fallY} rotate={tilt} origin={[52.3, 30]}>
      <Branch />
    </Layer>
  ) : null

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} />
        <Butterfly t={t} />
        <LongStick />
        <Layer y={-hop} scale={appear} origin={[CX, FEET_Y]}>
          <Kid mood={mood} look={look} raise={raise} handDrop={dip} sway={sway} tap={tap} breath={breath} hair={hair} held={heldBranch} />
        </Layer>
        {freeBranch}
        <Canopy t={t} />
        <Sigh t={t} />
        <WindStreaks t={t} />
        <FallingLeaves t={t} />
        <Surprise t={t} />
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Ink char={CHAR} progress={ink.progress} tint={ink.tint} />
      <Sparkles cx={54.5} cy={54} progress={ink.sparkle} />
    </>
  )
}

const scene: SceneModule = {
  char: CHAR,
  duration: DURATION,
  beats: [
    { at: 0, label: '地面に 長い ぼうが 1本。男の子は つまらない', sound: 'pop' },
    { at: WIND, label: '風が ふいて、木の えだが ゆれる' },
    { at: SURPRISE, label: '上を見て びっくり。えだが ぽきっ と おちる', sound: 'pop' },
    { at: CATCH, label: 'りょうてで ぱしっ。ぼうが 2本!', sound: 'ok' },
    { at: 5.6, label: '上は みじかく、下は 長い と くらべる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '二 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
