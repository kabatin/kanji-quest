/*
 * 林(はやし): 木が 2本 ならんで 林。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 左の木の よこに のびた えだ
 *   2画目(丨)  … 左の木の みき
 *   3・4画目   … 左の木の えだ(3 は 左へ、4 は 右へ たれる)
 *   5画目(一)  … 右の木の よこに のびた えだ
 *   6画目(丨)  … 右の木の みき(りすが どんぐりを うめた ばしょ に 生える)
 *   7・8画目   … 右の木の えだ(7 は 左へ、8 は 右へ たれる)
 *
 * ながれ
 *   木が 1本 そだつ → りすが 1ぴきで やってきて、木を 見上げて ひとりぼっちの ため息
 *   → 木から どんぐりが おちて、りすの あたまに こつん。りすは びっくり、でも うれしい
 *   → となりに うめよう と、あなを ほって、どんぐりを うめる(つちを ぽんぽん)
 *   → 芽が ぴょこん。みるみる 大きな木に そだつ(りすは びっくりして とびのく)
 *   → 木が ならんで、りすは 大よろこび → ほね が ひかって、絵が うすくなり、字「林」が のこる
 *
 * りすは、ほんものの つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   すわった 体に 大きな ふさふさの しっぽ。うで は かた から出て ひじ で まがる。
 *   あたま は 体の 上に のり、まるい 耳。どんぐりは 両手で もつ。
 *   木は みき から えだ が出る。2本目は どんぐりから 芽が出て そだつ(ひとりでに 生えない)。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Canopy, Clouds, Hills, Meadow, PALETTE, Sigh, Sun } from '../sceneFigures'

const CHAR = '林'

const BARK = PALETTE.bark
const BARK_DARK = PALETTE.barkDark
const SOIL = '#8a5a3a'
const SOIL_DARK = '#6a4128'
const BODY = '#c9733a'
const BODY_DARK = '#a85a2a'
const BELLY = '#f8e3c4'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const NUT = '#b07a3c'
const NUT_CAP = '#6b4a36'

/** くぎり の時間(秒) */
const ENTER_FROM = 0.6
const ENTER_TO = 1.6
const DROP = 2.6
const CATCH = 3.5
const TURN_FROM = 3.7
const TURN_TO = 3.95
const SET_DOWN = 4.4
const DIG = 4.6
const PUSH = 5.3
const COVER = 5.6
const SPROUT = 6.0
const HOP = 6.5
const GROW = 6.6
const CHEER = 7.5
const INK = 8.2
const DONE = 11.1
const DURATION = 11.7

/** 地面の たかさ(りすの 足もと) */
const GROUND = 95.5
/** 2本の木の みき の x(画データの 2画目・6画目) */
const TRUNK_A = 32.5
const TRUNK_B = 68.7
/** りすが たっている ばしょ(木の したで きょろきょろ / あなを ほる / とびのいた あと) */
const WAIT_X = 54
const DIG_X = 57
const BACK_X = 49
/** ほるときの 前かがみの 角度 */
const CROUCH = 30
/** どんぐりを おいた ばしょ(あな の むこう) */
const NUT_SET: readonly [number, number] = [73.5, 94]
const HOLE_Y = 96.4
/** りすを 大きく見せる ばいりつ */
const SIZE = 1.3

/** うでの つけね(りすの からだの 中の ざひょう。足もと が 0,0 / まえ が +x) */
const SHOULDER: readonly [number, number] = [2.5, -12]
const ARM_PART = 4

const rad = (deg: number) => (deg * Math.PI) / 180

/* ───────── 景色 ───────── */

function Ground({ t }: SceneProps) {
  return (
    <>
      <Sun t={t} x={100} y={11} r={5.4} />
      <Hills />
      <Clouds t={t} at={[[-6, 60, 0.9], [90, 50, 0.8]]} speed={1.4} />
      <Meadow tufts={[6, 18, 46, 84, 102]} />
    </>
  )
}

/* ───────── 木 ───────── */

type TreeProps = {
  /** みき の x */
  readonly x: number
  /** 画の番号(よこ線・みき・左のえだ・右のえだ) */
  readonly strokes: readonly [number, number, number, number]
  /** はっぱの しげみの たかさ(よこ線より 上に のせる) */
  readonly crown: number
  readonly trunk: number
  readonly boughs: number
  readonly leaves: number
  readonly sway: number
}

function Tree({ x, strokes, crown, trunk, boughs, leaves, sway }: TreeProps) {
  const [bar, stem, left, right] = strokes
  return (
    <>
      {trunk > 0 && (
        <>
          <ellipse cx={x + 1} cy="97.6" rx={18 * trunk} ry="3" fill="#000000" opacity="0.1" />
          <Layer scaleX={0.6 + 0.4 * trunk} scaleY={trunk} origin={[x, 96]}>
            {/* ねもと は 少し ひろがる */}
            <path d={`M${x - 9} 97 Q${x - 3} 91 ${x - 3.9} 83 L${x + 4.9} 83 Q${x + 4.5} 91 ${x + 10.5} 97 Z`} fill={BARK} />
            <Bone char={CHAR} n={stem} color={BARK} width={9} />
            <path d={`M${x - 1.8} 58 q1.4 5 0 11 M${x + 1.6} 72 q-1.2 5 0.2 10`} fill="none" stroke={BARK_DARK} strokeWidth="1.2" strokeLinecap="round" />
          </Layer>
        </>
      )}
      {boughs > 0 && (
        <Layer scale={boughs} origin={[x, 40]}>
          <Bone char={CHAR} n={bar} color={BARK} width={5.4} />
          <Bone char={CHAR} n={left} color={BARK} width={5} />
          <Bone char={CHAR} n={right} color={BARK} width={5} />
        </Layer>
      )}
      <Canopy x={x} y={crown + 19.5} r={22} grow={leaves} sway={sway} />
    </>
  )
}

/** どんぐり。ぼうし と み。(0,0) が まんなか */
function Acorn({ scale = 1 }: { readonly scale?: number }) {
  return (
    <g transform={`scale(${scale})`}>
      <ellipse cx="0" cy="0.9" rx="1.9" ry="2.3" fill={NUT} />
      <path d="M-2.3 -0.7 Q0 -3.4 2.3 -0.7 Q0 0.3 -2.3 -0.7 Z" fill={NUT_CAP} />
      <path d="M0 -2.8 l0.3 -1.1" stroke={NUT_CAP} strokeWidth="0.7" strokeLinecap="round" />
    </g>
  )
}

/* ───────── りす ───────── */

type Mood = 'lonely' | 'surprise' | 'happy' | 'focus'

/** うで の かっこう。swing = ま下から まえへ ふった角度 / bend = ひじ の まがり(まえへ) */
type ArmPose = { readonly swing: number; readonly bend: number }

const lerpPose = (a: ArmPose, b: ArmPose, w: number): ArmPose => ({ swing: a.swing + (b.swing - a.swing) * w, bend: a.bend + (b.bend - a.bend) * w })

/** かた → ひじ → 手 の じゅんに つなぐ */
function armPoints(pose: ArmPose) {
  const elbow = [SHOULDER[0] + Math.sin(rad(pose.swing)) * ARM_PART, SHOULDER[1] + Math.cos(rad(pose.swing)) * ARM_PART] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] + Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART] as const
  return { elbow, hand }
}

function SquirrelArm({ pose, color }: { readonly pose: ArmPose; readonly color: string }) {
  const { elbow, hand } = armPoints(pose)
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="1.7" fill={BODY_DARK} />
    </>
  )
}

function SquirrelFace({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="4.2" cy="-15.8" r="1.7" fill={CHEEK} opacity="0.55" />
      {mood === 'lonely' && (
        <>
          <path d="M3.4 -21.2 L6.4 -22.4" stroke={BODY_DARK} strokeWidth="0.8" strokeLinecap="round" />
          <circle cx="5" cy="-19.2" r="0.95" fill={EYE} />
          <path d="M6.8 -14.4 q1.3 -1.1 2.6 0" fill="none" stroke={MOUTH} strokeWidth="0.8" strokeLinecap="round" />
        </>
      )}
      {mood === 'surprise' && (
        <>
          <circle cx="5.2" cy="-19.6" r="1.5" fill="#ffffff" />
          <circle cx="5.4" cy="-19.6" r="0.9" fill={EYE} />
          <ellipse cx="7.8" cy="-14.7" rx="0.9" ry="1.1" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M3.8 -19 Q5.1 -21 6.4 -19" fill="none" stroke={EYE} strokeWidth="0.95" strokeLinecap="round" />
          <path d="M6.2 -15.2 Q7.8 -13.2 9.6 -15.2" fill="none" stroke={MOUTH} strokeWidth="0.9" strokeLinecap="round" />
        </>
      )}
      {mood === 'focus' && (
        <>
          <circle cx="5" cy="-19.4" r="0.95" fill={EYE} />
          <path d="M7 -14.6 h2" stroke={MOUTH} strokeWidth="0.8" strokeLinecap="round" />
        </>
      )}
    </>
  )
}

type SquirrelProps = {
  readonly mood: Mood
  readonly nearArm: ArmPose
  readonly farArm: ArmPose
  readonly headTilt: number
  readonly tailSway: number
  readonly holding: boolean
}

/** すわった りす。足もと が (0,0)、まえ(かお)が 右。 */
function Squirrel({ mood, nearArm, farArm, headTilt, tailSway, holding }: SquirrelProps) {
  const nearHand = armPoints(nearArm).hand
  return (
    <>
      {/* しっぽ: 体の うしろで S字に のびる(おおきく ふさふさ) */}
      <Layer rotate={tailSway} origin={[-3, -3]}>
        <path d="M-3 -1.5 C-14.5 -1.5 -16 -16 -10 -22.5 C-6.5 -26 -1.5 -22.5 -5 -18 C-8.5 -13.5 -7 -8 -1 -6 Z" fill={BODY} />
        <path d="M-11.8 -20.5 C-9 -24.2 -5.4 -22.8 -7 -20" fill="none" stroke={BELLY} strokeWidth="1.5" strokeLinecap="round" />
      </Layer>
      <SquirrelArm pose={farArm} color={BODY_DARK} />
      {/* うしろあし(ふとももと 足) */}
      <ellipse cx="-1.5" cy="-3.6" rx="4.2" ry="3.4" fill={BODY_DARK} />
      <ellipse cx="2.8" cy="-0.9" rx="4.2" ry="1.7" fill={BODY_DARK} />
      {/* どう: すわって 少し 前のめり */}
      <ellipse cx="0.2" cy="-8.4" rx="5.8" ry="7.6" fill={BODY} />
      <ellipse cx="2.4" cy="-7.8" rx="3.1" ry="5.2" fill={BELLY} />
      <SquirrelArm pose={nearArm} color={BODY} />
      {holding && (
        <g transform={`translate(${nearHand[0] + 0.6} ${nearHand[1] - 0.6})`}>
          <Acorn scale={1.15} />
        </g>
      )}
      {/* あたま: くび は みじかい(どう に のっている) */}
      <Layer rotate={headTilt} origin={[1.5, -14]}>
        <ellipse cx="0.8" cy="-23.2" rx="1.7" ry="2.6" fill={BODY_DARK} transform="rotate(-12 0.8 -23.2)" />
        <ellipse cx="4.4" cy="-23.6" rx="1.7" ry="2.7" fill={BODY} transform="rotate(8 4.4 -23.6)" />
        <ellipse cx="4.5" cy="-23.4" rx="0.8" ry="1.6" fill="#f2a98a" transform="rotate(8 4.5 -23.4)" />
        <circle cx="3" cy="-18" r="5.3" fill={BODY} />
        <ellipse cx="7.5" cy="-16.6" rx="2.8" ry="2.2" fill={BELLY} />
        <circle cx="9.9" cy="-17.2" r="0.8" fill={EYE} />
        <SquirrelFace mood={mood} />
      </Layer>
    </>
  )
}

/* ───────── にぎやかし ───────── */

/** ひとりぼっちの ため息「ふう」。りすの くち から 左うえへ。 */
function LonelySigh({ t }: SceneProps) {
  const from = ENTER_TO + 0.5
  return <Sigh x={WAIT_X - 11} y={GROUND - 15 * SIZE} p={span(t, from, DROP - 0.1, easeOut)} show={during(t, from, DROP - 0.1, 0.2)} dir={-1} />
}

/** びっくりの「!」 */
function Bang({ t }: SceneProps) {
  const show = during(t, DROP + 0.4, CATCH + 0.5, 0.15)
  if (show <= 0) return null
  const s = 0.7 + 0.3 * span(t, DROP + 0.4, DROP + 0.7, backOut)
  return (
    <g opacity={show} transform={`translate(${WAIT_X - 2} 56) scale(${s})`} fill="#e8534a">
      <rect x="-0.9" y="-6" width="1.8" height="5" rx="0.9" />
      <circle cx="0" cy="1.4" r="1" />
    </g>
  )
}

/** あなを ほるときに とぶ つち */
function Dirt({ t }: SceneProps) {
  const show = during(t, DIG, COVER, 0.1)
  if (show <= 0) return null
  return (
    <g opacity={show} fill={SOIL}>
      {[0, 1, 2, 3, 4].map((i) => {
        const p = (((t - DIG) * 2.2 + i * 0.21) % 1 + 1) % 1
        return <circle key={i} cx={TRUNK_B - 3 - p * (7 + i * 1.6)} cy={HOLE_Y - 1 - Math.sin(p * Math.PI) * (6 + i)} r={1 - p * 0.4 + 0.2} opacity={1 - p * 0.5} />
      })}
    </g>
  )
}

/** あな・どんぐり・もりあがった つち・芽 */
function Planting({ t }: SceneProps) {
  const hole = span(t, DIG, PUSH, easeOut) * (1 - span(t, COVER, COVER + 0.4))
  const mound = span(t, COVER, SPROUT, easeOut)
  const sprout = span(t, SPROUT, HOP, backOut)
  const sproutFade = 1 - span(t, HOP, GROW + 0.7)
  // どんぐり: 地面に おいて → あなに おす → しずむ
  const nutAt = span(t, PUSH, COVER, easeInOut)
  const nutX = mix(t, PUSH, COVER, NUT_SET[0], TRUNK_B, easeInOut)
  const nutY = mix(t, PUSH, COVER, NUT_SET[1], HOLE_Y + 1.2, easeIn)
  const nutVisible = t >= SET_DOWN + 0.2 && t < COVER + 0.25
  return (
    <>
      {hole > 0 && <ellipse cx={TRUNK_B} cy={HOLE_Y} rx={5 * hole} ry={1.7 * hole} fill={SOIL_DARK} />}
      {nutVisible && (
        <g transform={`translate(${nutAt > 0 ? nutX : NUT_SET[0]} ${nutAt > 0 ? nutY : NUT_SET[1]})`}>
          <Acorn scale={1.15} />
        </g>
      )}
      {mound > 0 && (
        <>
          <ellipse cx={TRUNK_B} cy={HOLE_Y + 0.6} rx={6.2 * mound} ry={2.6 * mound} fill={SOIL} />
          <ellipse cx={TRUNK_B - 1.4} cy={HOLE_Y - 0.2} rx={3 * mound} ry={1 * mound} fill="#a47048" />
        </>
      )}
      {sprout > 0 && sproutFade > 0 && (
        <Layer scale={sprout} opacity={sproutFade} origin={[TRUNK_B, HOLE_Y]}>
          <path d={`M${TRUNK_B} ${HOLE_Y} q0.8 -4 -0.2 -8`} fill="none" stroke={PALETTE.leafDark} strokeWidth="1.5" strokeLinecap="round" />
          <ellipse cx={TRUNK_B - 3.2} cy={HOLE_Y - 8.4} rx="3.4" ry="1.8" fill={PALETTE.leaf} transform={`rotate(-25 ${TRUNK_B - 3.2} ${HOLE_Y - 8.4})`} />
          <ellipse cx={TRUNK_B + 2.6} cy={HOLE_Y - 8} rx="3.2" ry="1.7" fill={PALETTE.leafLight} transform={`rotate(25 ${TRUNK_B + 2.6} ${HOLE_Y - 8})`} />
        </Layer>
      )}
    </>
  )
}

/** 木から おちてくる どんぐり: りすの あたまに こつん → はねて 手の中へ */
function FallingAcorn({ t, handX, handY }: SceneProps & { readonly handX: number; readonly handY: number }) {
  if (t < DROP - 0.5 || t >= CATCH) return null
  const headX = WAIT_X - 3 * SIZE
  const headTop = GROUND - 23 * SIZE
  if (t < DROP) {
    // おちる まえに、はっぱの中で ぷるぷる
    return (
      <g transform={`translate(${headX} 30) rotate(${wave(t, 0.14) * 14})`}>
        <Acorn scale={1.15} />
      </g>
    )
  }
  if (t < DROP + 0.4) {
    const p = span(t, DROP, DROP + 0.4, easeIn)
    return (
      <g transform={`translate(${headX} ${30 + (headTop - 30) * p}) rotate(${p * 200})`}>
        <Acorn scale={1.15} />
      </g>
    )
  }
  const p = span(t, DROP + 0.4, CATCH)
  const x = headX + (handX - headX) * p
  const y = headTop + (handY - headTop) * p - Math.sin(p * Math.PI) * 10
  return (
    <g transform={`translate(${x} ${y}) rotate(${200 + p * 160})`}>
      <Acorn scale={1.15} />
    </g>
  )
}

/** よろこびの ほし(りすの まわり) */
function Cheers({ t, x }: SceneProps & { readonly x: number }) {
  const show = during(t, CHEER + 0.1, INK + 0.2, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[
        [-13, -34, 2.6],
        [13, -32, 2.2],
        [-17, -18, 1.9],
        [16, -16, 2.1],
      ].map(([dx, dy, r], i) => (
        <Star key={i} cx={x + dx} cy={GROUND + dy - Math.sin(t * 6 + i) * 1.2} r={r} color={i % 2 === 0 ? '#ffc233' : '#ff7a4d'} spin={t * 90 + i * 30} />
      ))}
    </g>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)
  const sway = wave(t, 3.4) * 1.2

  // 1本目の木: そだつ
  const a = { trunk: span(t, 0, 0.55, backOut), boughs: span(t, 0.3, 0.75, backOut), leaves: span(t, 0.5, 1.0, backOut) }
  // 2本目の木: どんぐりの 芽が、みるみる そだつ
  const b = { trunk: span(t, GROW, GROW + 0.55, backOut), boughs: span(t, GROW + 0.3, GROW + 0.8, backOut), leaves: span(t, GROW + 0.45, GROW + 1.05, backOut) }

  // りすの いち と むき
  const x =
    t < ENTER_TO ? mix(t, ENTER_FROM, ENTER_TO, 125, WAIT_X, easeOut)
    : t < TURN_TO ? WAIT_X
    : t < SET_DOWN ? mix(t, TURN_TO, SET_DOWN, WAIT_X, DIG_X, easeInOut)
    : t < HOP ? DIG_X
    : mix(t, HOP, HOP + 0.5, DIG_X, BACK_X, easeInOut)
  // 左むき(木のほう)→ 右むき(あなを ほる ほう)
  const facing = mix(t, TURN_FROM, TURN_TO, -1, 1)
  const hop = (from: number, to: number, count: number, height: number) => (t > from && t < to ? Math.abs(Math.sin(((t - from) / (to - from)) * Math.PI * count)) * height : 0)
  const jump = hop(ENTER_FROM, ENTER_TO, 5, 2.4) + hop(TURN_TO, SET_DOWN, 2, 1.6) + hop(HOP, HOP + 0.5, 1, 5) + hop(CHEER, CHEER + 0.7, 2, 5)

  // ほるとき 前かがみ(まっすぐ 立つのは、芽が出たとき)
  const crouch = CROUCH * (span(t, SET_DOWN, SET_DOWN + 0.2) - span(t, SPROUT, SPROUT + 0.3))

  // うで: たれる → どんぐりを もつ → ほる(ま下に のばす) → びっくり → ばんざい
  const hang: ArmPose = { swing: 8, bend: 10 }
  const hold: ArmPose = { swing: 55, bend: 40 }
  const dig = (phase: number): ArmPose => ({ swing: crouch + 4 + (t >= DIG && t < SPROUT ? wave(t, 0.34, phase) * 14 : 0), bend: 18 })
  const startled: ArmPose = { swing: 62, bend: 12 }
  const cheer: ArmPose = { swing: 160, bend: -8 }
  const armAt = (phase: number): ArmPose =>
    lerpPose(lerpPose(lerpPose(lerpPose(hang, hold, span(t, DROP + 0.5, CATCH - 0.1)), dig(phase), span(t, SET_DOWN, SET_DOWN + 0.2)), startled, span(t, SPROUT + 0.1, SPROUT + 0.4)), { swing: cheer.swing + wave(t, 0.5, phase) * 8, bend: cheer.bend }, span(t, CHEER, CHEER + 0.3))
  const nearArm = armAt(0)
  const farArm = armAt(0.17)
  const holding = t >= CATCH && t < SET_DOWN + 0.2
  const hold1 = armPoints(hold).hand

  const mood: Mood =
    t < DROP + 0.35 ? 'lonely'
    : t < CATCH + 0.4 ? 'surprise'
    : t < DIG ? 'happy'
    : t < SPROUT ? 'focus'
    : t < CHEER ? 'surprise'
    : 'happy'
  const headTilt =
    t < DROP + 0.35 ? 8
    : t < SPROUT ? -crouch * 0.5 + (t < DIG ? 0 : 6)
    : t < CHEER ? -18
    : 0
  const tailSway = wave(t, 1.3) * 4 - crouch * 0.15

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Tree x={TRUNK_A} strokes={[1, 2, 3, 4]} crown={-3} {...a} sway={sway} />
        <Tree x={TRUNK_B} strokes={[5, 6, 7, 8]} crown={-5} {...b} sway={-sway} />
        <Planting t={t} />
        <Dirt t={t} />
        <Layer opacity={span(t, ENTER_FROM - 0.2, ENTER_FROM)} x={x} y={GROUND - jump}>
          <ellipse cx="0" cy={jump + 0.3} rx={10 - jump * 0.5} ry="2" fill="#000000" opacity="0.12" />
          <Layer rotate={crouch} scale={SIZE}>
            <Layer scaleX={facing}>
              <Squirrel mood={mood} nearArm={nearArm} farArm={farArm} headTilt={headTilt} tailSway={tailSway} holding={holding} />
            </Layer>
          </Layer>
        </Layer>
        <FallingAcorn t={t} handX={WAIT_X - hold1[0] * SIZE} handY={GROUND + hold1[1] * SIZE} />
        <LonelySigh t={t} />
        <Bang t={t} />
        <Cheers t={t} x={BACK_X} />
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
    { at: 0, label: '木が 1本 そだつ', sound: 'pop' },
    { at: ENTER_FROM, label: 'りすが 1ぴきで やってくる' },
    { at: ENTER_TO + 0.5, label: 'ひとりぼっちの ため息' },
    { at: DROP, label: 'どんぐりが おちて、こつん', sound: 'pop' },
    { at: SET_DOWN, label: 'となりに あなを ほって うめる' },
    { at: SPROUT, label: '芽が ぴょこん', sound: 'pop' },
    { at: GROW, label: '2本目の木が そだつ' },
    { at: CHEER, label: '木が ならんで 大よろこび' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '林 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
