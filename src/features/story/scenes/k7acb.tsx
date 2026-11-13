/*
 * 立(たつ): 人が じめんの 上に りょうあしを ひらいて 立つ。
 *
 * ほね(画と絵の対応)
 *   1画目(丶)  … あたまの てっぺん から くび へ のびる たて線(かみの ふさ と、そこに とまる ちょうちょ)
 *   2画目(一)  … よこに ひろげた りょううで(バランスを とって 立った ところ)
 *   3画目(ノ)  … 左の あし
 *   4画目(丨)  … 右の あし
 *   5画目(一)  … じめん
 *
 * ながれ
 *   子どもが ころんで ぺたん。ないて いる
 *   → ちょうちょが とんできて、見上げる(びっくり)
 *   → 手で じめんを おして、よいしょと 立ちあがる(ふらふら、りょううでで バランス)
 *   → ぴたっと 立てた! ちょうちょが あたまに とまって にっこり
 *   → ほね が ひかって、絵が うすくなり、字「立」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   かた から うで、こし から あし が出て、うで も あし も ひじ・ひざ で まがる(まがりかたは 2本の ほね の長さで きめる)。
 *   くび は みじかく どう の まんなか の上。立つと、うで は よこに ひろがり、あし は 少し ひらく。
 */
import { during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '立'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#f0765a'
const SHIRT_DARK = '#d95f45'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const LEAF_DARK = '#3f9c59'
const GRASS = '#c5e8a9'
const GRASS_DARK = '#a6d681'
const SOIL = '#c9a77c'
const SUN = '#ffd24a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const TEAR = '#7cc4f2'
const WING = '#ffb347'
const WING_DARK = '#f08a2c'
const WING_TIP = '#fff0c2'

/** くぎり の時間(秒) */
const LAND = 0.75
const SAD = 0.95
const BUTTERFLY = 2.2
const PUSH = 3.0
const STAND = 4.4
const HAPPY = 5.7
const INK = 6.3
const DONE = 9
const DURATION = 9.6

type Pt = readonly [number, number]

/** 子どもの まんなか(からだの たて線) */
const CX = 54.5
/** じめんの 高さ(あしの うらが つく) */
const GROUND = 87
/** どう の長さ(かた から こし まで) */
const TORSO = 25
/** こし の高さ: すわっている とき / 立った とき */
const HIP_SIT = 82
const HIP_STAND = 62
/** かた の はば(まんなか から かた まで)、こし の はば */
const SHOULDER_W = 8
const HIP_W = 5
/** 足の うらの 位置(まんなか から よこへ)。あし は 少し ひらく */
const FOOT_W = 12
/** あし の 1ほん の長さ(ふとももと すね は 同じ。ほんの少し 余裕を もたせて ひざ が まがる) */
const LEG_PART = 12.7
/** うで の 1ほん の長さ(かた→ひじ、ひじ→手) */
const ARM_PART = 12.3
/** うでを ひろげた ときの 手の 位置(1画目と同じ、左右に ひろがる 線) */
const HAND_LEFT: Pt = [22, 38]
const HAND_RIGHT: Pt = [87, 35.8]
/** すわって 手を ついた ときの 手の 位置(まんなか から よこへ) */
const HAND_REST_W = 15
const HAND_REST_Y = 82

type Mood = 'sad' | 'surprised' | 'try' | 'happy'

/**
 * 2本の ほね(かた→ひじ→手、こし→ひざ→足)を つなぐ。はじめ と おわり の点が きまると、
 * まんなかの かんせつ(ひじ・ひざ)の 位置は、長さが かわらないように 計算で きまる。
 * score は「どちらへ まがるか」を えらぶための ものさし(大きい ほうへ まがる)。
 */
function twoBone(from: Pt, to: Pt, part: number, score: (nx: number, ny: number) => number): { readonly joint: Pt; readonly end: Pt } {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const dist = Math.max(Math.hypot(dx, dy), 0.001)
  const ux = dx / dist
  const uy = dy / dist
  const reach = Math.min(dist, part * 2 - 0.01)
  const half = reach / 2
  const height = Math.sqrt(Math.max(part * part - half * half, 0))
  const a: Pt = [-uy, ux]
  const b: Pt = [uy, -ux]
  const n = score(a[0], a[1]) >= score(b[0], b[1]) ? a : b
  return {
    joint: [from[0] + ux * half + n[0] * height, from[1] + uy * half + n[1] * height],
    end: [from[0] + ux * reach, from[1] + uy * reach],
  }
}

/** ちょうちょ の 位置。右上から とんできて、あたまの 上を ひらひら まわり、さいごに あたま に とまる。 */
function butterflyAt(t: number): { readonly pos: Pt; readonly landed: number } {
  const enter = span(t, BUTTERFLY, BUTTERFLY + 1.1, easeOut)
  const arrive: Pt = [mix(t, BUTTERFLY, BUTTERFLY + 1.1, 118, 84, easeOut), mix(t, BUTTERFLY, BUTTERFLY + 1.1, 12, 22, easeOut)]
  // ひらひら と ゆれながら 空を まわる
  const s = t - (BUTTERFLY + 1.1)
  const loop: Pt = [72 + 17 * Math.cos(s * 1.9 + 0.2), 18 + 6 * Math.sin(s * 3.1 + 1)]
  const join = span(t, BUTTERFLY + 0.9, BUTTERFLY + 1.4)
  const flight: Pt = enter < 1 ? arrive : [arrive[0] + (loop[0] - arrive[0]) * join, arrive[1] + (loop[1] - arrive[1]) * join]
  // あたまの てっぺん に とまる
  const landed = span(t, 5.0, HAPPY, easeInOut)
  const rest: Pt = [CX + 1.5, 11.6]
  return { pos: [flight[0] + (rest[0] - flight[0]) * landed, flight[1] + (rest[1] - flight[1]) * landed - Math.sin(landed * Math.PI) * 7], landed }
}

function Sky({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun} fill={SUN} />
      {/* とおくの おか と、ゆっくり ながれる 雲 */}
      <path d="M-4 90 Q22 66 48 80 Q78 60 113 82 V96 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.5} 0)`}>
        <ellipse cx="2" cy="40" rx="7" ry="3.4" />
        <ellipse cx="7" cy="38" rx="5" ry="3.4" />
        <ellipse cx="90" cy="48" rx="6" ry="2.8" />
        <ellipse cx="94.5" cy="46.4" rx="4.4" ry="3" />
      </g>
    </>
  )
}

/** じめん。上の ふち は 5画目の線(まっすぐな じめん)に そろえる。 */
function Ground({ t }: SceneProps) {
  const sway = wave(t, 2.6) * 2
  return (
    <>
      <path d="M-2 88 C30 87.6 70 86.4 111 87.2 V111 H-2 Z" fill={GRASS_DARK} />
      <path d="M-2 98 C30 97 70 96.4 111 97 V111 H-2 Z" fill={SOIL} opacity="0.55" />
      <Bone char={CHAR} n={5} color={GRASS} width={5} />
      {/* ちいさな 花(風で ゆれる) */}
      {[
        { x: 12, c: '#ff8fb1' },
        { x: 97, c: '#b89cf2' },
      ].map(({ x, c }) => (
        <g key={x}>
          <path d={`M${x} 90 Q${x + sway * 0.4} 84 ${x + sway} 79`} fill="none" stroke={LEAF_DARK} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx={x + sway} cy="78" r="3" fill={c} />
          <circle cx={x + sway} cy="78" r="1.2" fill={SUN} />
        </g>
      ))}
    </>
  )
}

type FaceProps = { readonly mood: Mood; readonly gaze: Pt; readonly t: number }

/** 顔。あたま の まんなか が (0, 0)。気持ちで 目と口が かわる。 */
function Face({ mood, gaze, t }: FaceProps) {
  const [gx, gy] = gaze
  const eyes = [-3.8, 3.8]
  return (
    <>
      <ellipse cx="-6.6" cy="4.6" rx="1.9" ry="1.3" fill={CHEEK} opacity="0.55" />
      <ellipse cx="6.6" cy="4.6" rx="1.9" ry="1.3" fill={CHEEK} opacity="0.55" />
      {mood === 'happy' ? (
        <>
          {eyes.map((x) => (
            <path key={x} d={`M${x - 1.7} 1.8 Q${x} -0.6 ${x + 1.7} 1.8`} fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          ))}
          <path d="M-3 5 Q0 11 3 5 Z" fill={MOUTH} />
          <path d="M-1.4 7.4 Q0 6.4 1.4 7.4 Q0 9 -1.4 7.4 Z" fill="#ff8a8a" />
        </>
      ) : mood === 'surprised' ? (
        <>
          {eyes.map((x) => (
            <g key={x}>
              <circle cx={x} cy="1.2" r="2.3" fill="#ffffff" stroke={EYE} strokeWidth="0.6" />
              <circle cx={x + gx} cy={1.2 + gy} r="1.2" fill={EYE} />
            </g>
          ))}
          <path d="M-6.6 -2.6 Q-3.8 -4.6 -1.6 -2.8 M1.6 -2.8 Q3.8 -4.6 6.6 -2.6" fill="none" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <ellipse cx="0" cy="7" rx="1.5" ry="2" fill={MOUTH} />
        </>
      ) : mood === 'try' ? (
        <>
          {eyes.map((x) => (
            <circle key={x} cx={x + gx} cy={1.4 + gy} r="1.2" fill={EYE} />
          ))}
          <path d="M-6.4 -2.8 L-2.4 -1.6 M6.4 -2.8 L2.4 -1.6" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M-2 7 Q0 6 2 7" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
        </>
      ) : (
        <>
          {eyes.map((x) => (
            <circle key={x} cx={x + gx} cy={1.8 + gy} r="1.2" fill={EYE} />
          ))}
          <path d="M-6.4 -0.8 L-2.4 -2.8 M6.4 -0.8 L2.4 -2.8" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          {/* ないている口(ふちが 上にそった おおきな 口) */}
          <path d="M-2.8 8.6 Q0 4.4 2.8 8.6 Z" fill={MOUTH} />
          {/* なみだ: ほっぺ を つたって おちる */}
          {eyes.map((x, i) => {
            const p = (t * 1.4 + i * 0.5) % 1
            return (
              <g key={x}>
                <path d={`M${x} 3 L${x + (x < 0 ? -0.8 : 0.8)} 7`} stroke={TEAR} strokeWidth="1.1" strokeLinecap="round" />
                <path d="M0 -1.8 Q1.4 0.2 0 1.2 Q-1.4 0.2 0 -1.8 Z" fill={TEAR} transform={`translate(${x * 1.6} ${8 + p * 12})`} opacity={1 - p} />
              </g>
            )
          })}
        </>
      )}
    </>
  )
}

type KidProps = {
  /** すわって いる(0) → 立った(1) */
  readonly rise: number
  /** 手が じめんから はなれて、よこに ひろがる度合い */
  readonly armsOut: number
  /** 立ってから の ふらふら(うでを ふる大きさ) */
  readonly flap: number
  readonly flapPhase: number
  readonly mood: Mood
  readonly gaze: Pt
  readonly tilt: number
  readonly t: number
}

/** 正面から見た子ども。こし・かた の高さは rise できまり、うで・あし は ほね の長さを 守って まがる。 */
function Kid({ rise, armsOut, flap, flapPhase, mood, gaze, tilt, t }: KidProps) {
  const hipY = mix(rise, 0, 1, HIP_SIT, HIP_STAND, (x) => x)
  const shoulderY = hipY - TORSO
  const headY = shoulderY - 14

  // あし: 足の うらは じめんに つけたまま、こし が 上がる。ひざ は 外・上へ まがる
  const legs = ([-1, 1] as const).map((side) => {
    const hip: Pt = [CX + side * HIP_W, hipY]
    const foot: Pt = [CX + side * FOOT_W, GROUND - 1.6]
    return { side, foot, ...twoBone(hip, foot, LEG_PART, (nx, ny) => -ny + 0.5 * side * nx), hip }
  })

  // うで: すわっている間は 手を じめんに つき、立つと よこに ひろげる(右手は 少し 上がる)
  const arms = ([-1, 1] as const).map((side) => {
    const shoulder: Pt = [CX + side * SHOULDER_W, shoulderY + 2]
    const rest: Pt = [CX + side * HAND_REST_W, HAND_REST_Y]
    const out = side < 0 ? HAND_LEFT : HAND_RIGHT
    const swing = Math.sin(flapPhase + (side < 0 ? 0 : Math.PI)) * flap * 5
    const target: Pt = [rest[0] + (out[0] - rest[0]) * armsOut, rest[1] + (out[1] - rest[1]) * armsOut + swing]
    return { side, shoulder, ...twoBone(shoulder, target, ARM_PART, (nx, ny) => side * nx + 0.3 * ny) }
  })

  return (
    <>
      {legs.map(({ side, hip, joint, end }) => (
        <g key={side}>
          <path d={`M${hip[0]} ${hip[1]} L${joint[0]} ${joint[1]} L${end[0]} ${end[1]}`} fill="none" stroke={PANTS} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx={end[0] + side * 1.4} cy={GROUND - 1.5} rx="5" ry="2.8" fill={SHOE} />
        </g>
      ))}
      {/* どう と こし */}
      <rect x={CX - 8.5} y={shoulderY - 1.5} width="17" height={TORSO + 1} rx="7" fill={SHIRT} />
      <path d={`M${CX - 7} ${shoulderY + 13} h14`} stroke={SHIRT_DARK} strokeWidth="1.6" strokeLinecap="round" />
      <rect x={CX - 8} y={hipY - 3} width="16" height="7" rx="3.2" fill={PANTS} />
      {/* くび: みじかく、どう の まんなか の上 */}
      <rect x={CX - 2.6} y={shoulderY - 7} width="5.2" height="8" rx="2.4" fill={SKIN_SHADE} />
      {arms.map(({ side, shoulder, joint, end }) => (
        <g key={side}>
          <path d={`M${shoulder[0]} ${shoulder[1]} L${joint[0]} ${joint[1]}`} stroke={SHIRT_DARK} strokeWidth="6" strokeLinecap="round" />
          <path d={`M${joint[0]} ${joint[1]} L${end[0]} ${end[1]}`} stroke={SKIN} strokeWidth="5" strokeLinecap="round" />
          <circle cx={end[0]} cy={end[1]} r="3.3" fill={SKIN} />
        </g>
      ))}
      {/* あたま */}
      <Layer x={CX} y={headY} rotate={tilt} origin={[0, 9]}>
        <circle cx="-9.2" cy="2.6" r="2.2" fill={SKIN} />
        <circle cx="9.2" cy="2.6" r="2.2" fill={SKIN} />
        <circle cx="0" cy="0" r="9.4" fill={SKIN} />
        <path d="M-9.4 1.2 A9.5 9.5 0 0 1 9.4 1.2 Q6.4 -3.6 2.4 -3 Q-2 -5.6 -9.4 1.2 Z" fill={HAIR} />
        {/* 1画目の はじまり: てっぺん の かみの ふさ */}
        <path d="M0 -8.8 Q-1.6 -12.6 1.6 -13.2" fill="none" stroke={HAIR} strokeWidth="1.9" strokeLinecap="round" />
        <Face mood={mood} gaze={gaze} t={t} />
      </Layer>
    </>
  )
}

/** ちょうちょ。とんでいる間は はねを ぱたぱた、とまると ゆっくり。 */
function Butterfly({ t }: SceneProps) {
  if (t < BUTTERFLY) return null
  const { pos, landed } = butterflyAt(t)
  const flap = 0.3 + 0.7 * Math.abs(wave(t, landed >= 1 ? 1.4 : 0.26))
  const lean = landed >= 1 ? 0 : wave(t, 1.1) * 14
  return (
    <Layer x={pos[0]} y={pos[1]} rotate={lean}>
      <Layer scaleX={flap} origin={[0, 0]}>
        <ellipse cx="-3.6" cy="-2.2" rx="3.6" ry="3.2" fill={WING} transform="rotate(-20 -3.6 -2.2)" />
        <ellipse cx="3.6" cy="-2.2" rx="3.6" ry="3.2" fill={WING} transform="rotate(20 3.6 -2.2)" />
        <ellipse cx="-2.6" cy="2" rx="2.4" ry="2.2" fill={WING_DARK} />
        <ellipse cx="2.6" cy="2" rx="2.4" ry="2.2" fill={WING_DARK} />
        <circle cx="-4" cy="-2.6" r="1.1" fill={WING_TIP} />
        <circle cx="4" cy="-2.6" r="1.1" fill={WING_TIP} />
      </Layer>
      <ellipse cx="0" cy="0" rx="0.9" ry="3.2" fill={HAIR} />
      <path d="M-0.4 -3 Q-2 -5.4 -3 -5 M0.4 -3 Q2 -5.4 3 -5" fill="none" stroke={HAIR} strokeWidth="0.5" strokeLinecap="round" />
    </Layer>
  )
}

/** ころんだ とき の ほこり。 */
function Dust({ t }: SceneProps) {
  const p = span(t, LAND, LAND + 0.6, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g fill="#fffbe8" opacity={(1 - p) * 0.9}>
      {[-1, 1].map((side) => (
        <g key={side}>
          <circle cx={CX + side * (15 + p * 11)} cy={85.5 - p * 4} r={2 + p * 3.6} />
          <circle cx={CX + side * (20 + p * 8)} cy={86.5 - p * 1.5} r={1.4 + p * 2.4} />
        </g>
      ))}
    </g>
  )
}

/** ちょうちょに 気づいた「あっ」の しるし(あたまの まわりの 3本線)。 */
function Surprise({ t }: SceneProps) {
  const show = during(t, BUTTERFLY + 0.4, PUSH + 0.2, 0.15)
  if (show <= 0) return null
  const rise = HIP_SIT - TORSO - 14
  return (
    <g opacity={show} stroke="#f2a33a" strokeWidth="1.3" strokeLinecap="round" transform={`translate(${CX} ${rise})`}>
      <path d="M0 -13 v-4" />
      <path d="M-8 -11 l-2.6 -3" />
      <path d="M8 -11 l2.6 -3" />
    </g>
  )
}

/** にっこり の ハート。ちょうちょが とまってから、ふわっと のぼる。 */
function Hearts({ t }: SceneProps) {
  return (
    <>
      {[
        { x: 36, y: 18, at: HAPPY, color: '#ff7a9a' },
        { x: 75, y: 24, at: HAPPY + 0.3, color: '#ff9ab5' },
      ].map(({ x, y, at, color }) => {
        const p = span(t, at, at + 1.1)
        if (p <= 0 || p >= 1) return null
        return <path key={x} d="M0 2 C-4 -1 -2.5 -4 0 -2 C2.5 -4 4 -1 0 2 Z" fill={color} opacity={Math.sin(p * Math.PI)} transform={`translate(${x + Math.sin(p * 6) * 1.2} ${y - p * 6}) scale(${0.8 + p * 0.5})`} />
      })}
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)

  // ころんで ぺたん: 上から おちてきて、ついた しゅんかん に ちょっと つぶれる
  const drop = 1 - easeIn(span(t, 0.2, LAND))
  const squash = Math.sin(span(t, LAND, LAND + 0.4) * Math.PI)
  const appear = span(t, 0.1, 0.3)

  // よいしょ: 手で おして こし を上げ、うでを ひろげる
  const rise = span(t, PUSH, STAND, easeInOut)
  const armsOut = span(t, PUSH + 0.35, STAND + 0.1, easeInOut)
  // 立ってから ふらふら して、だんだん ぴたっと 止まる
  const settle = 1 - span(t, STAND, HAPPY - 0.2)
  const flapPhase = (t - STAND) * 7
  const sway = rise >= 1 ? Math.sin((t - STAND) * 6.5) * 5 * settle : 0

  const mood: Mood = t < BUTTERFLY ? 'sad' : t < PUSH ? 'surprised' : t < STAND ? 'try' : 'happy'
  const { pos: fly } = butterflyAt(t)
  // 目は ちょうちょを おう(ないている ときは 下を見る)
  const watching = t >= BUTTERFLY
  const gaze: Pt = watching ? [Math.max(-1.2, Math.min(1.2, (fly[0] - CX) / 16)), -1] : [0, 0.9]
  const tilt = mood === 'sad' ? 5 : mood === 'try' ? -2 : 0

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Ground t={t} />
        <ellipse cx={CX} cy={GROUND + 1.4} rx={13 + squash * 2} ry="2.4" fill="#000000" opacity={0.12 * appear} />
        <Layer opacity={appear}>
          <Layer y={-30 * drop} scaleX={1 + squash * 0.05} scaleY={1 - squash * 0.08} origin={[CX, GROUND]}>
            <Layer rotate={sway} origin={[CX, GROUND]}>
              <Kid rise={rise} armsOut={armsOut} flap={settle} flapPhase={flapPhase} mood={mood} gaze={gaze} tilt={tilt} t={t} />
            </Layer>
          </Layer>
        </Layer>
        <Dust t={t} />
        <Surprise t={t} />
        <Butterfly t={t} />
        <Hearts t={t} />
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Layer scale={1 + Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06} origin={[54.5, 54.5]}>
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
    { at: 0, label: '子どもが ころんで ぺたん', sound: 'pop' },
    { at: SAD, label: 'いたくて しくしく ないている' },
    { at: BUTTERFLY, label: 'ちょうちょが とんできて、見上げる', sound: 'tap' },
    { at: PUSH, label: '手で じめんを おして、よいしょ と 立ちあがる' },
    { at: STAND, label: 'ふらふら、りょううでで バランス' },
    { at: HAPPY, label: 'ぴたっと 立てた! ちょうちょが あたまに とまる', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '立 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
