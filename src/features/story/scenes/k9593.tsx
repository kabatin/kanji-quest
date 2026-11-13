/*
 * 間(あいだ・すきま): 門の すき間から、光が さしこむ。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)       … 門の 左の はしら
 *   2・3・4画目      … 左の とびら の 上の まど(わく と、2本の さん)
 *   5・7・8画目      … 右の とびら の 上の まど(わく と、2本の さん)
 *   6画目(うえ と 右の はしら) … 右の とびら の 上の かもい と、右の はしら
 *   9〜12画目(日)    … 2まいの とびら の すき間から 見える お日さま(と ひかり)
 *
 * ながれ
 *   とびらが しまった 門。うす暗くて、子どもが しょんぼり あるいてくる
 *   → 「なんだろう?」と 見あげて、とびらを うんしょと おす
 *   → とびらが すこし ひらいて すき間が でき、お日さまの 光が さっと さしこむ
 *   → 顔が ぱっと 明るくなって、うれしい(小鳥も とんでくる)
 *   → すき間の 光が 日の形に そろい、ほね が ひかって 字「間」になる
 *
 * 人は、ほんものの つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(手の場所から 2本のほね を ひじで つなぐ)。
 *   とびらは はしら の ちょうつがい を じくに、むこうへ ひらく(ひらくと 見える はば が せまくなる)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '間'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#e8645a'
const TUNIC_DARK = '#d04e46'
const TUNIC_FAR = '#b94540'
const PANTS = '#4a5c8c'
const PANTS_DARK = '#3d4d78'
const SHOE = '#6b4a36'
const POST = '#8c5b3c'
const WOOD = '#b9814f'
const WOOD_DARK = '#a06c3f'
const WINDOW = '#5a3e2c'
const LATTICE = '#e0b27a'
const WALL = '#efe2c6'
const WALL_SHADE = '#dccba8'
const TILE = '#5d6f88'
const TILE_LIGHT = '#7a8ca6'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const SKY = '#bfe6fa'
const HILL = '#9fd9a0'
const DIM = '#2f3f66'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const RISE = 0.7
const WALK = 0.9
const STOP = 2.3
const REACH = 2.7
const PUSH = 3.2
const OPENED = 4.7
const SURPRISE = 4.7
const JOY = 5.4
const INK = 6.1
const DONE = 9.2
const DURATION = 9.8

/** 門の わく(画の線の場所) */
const HINGE_L = 19.6
const HINGE_R = 90.3
/** とびらが ひらいた ときの はば / しまった ときは、まんなか(54)で あわさる */
const OPEN_W_L = 24.8
const OPEN_W_R = 25.8
const CLOSED_SCALE = 1.39
const GAP_MID = 54
/** お日さま(すき間から 見える) */
const SUN_POS: readonly [number, number] = [53.5, 68]

/** 子どもの 足もと・かた。体は 右(門のほう)を むく */
const FEET: readonly [number, number] = [19, 97]
const SHOULDER: readonly [number, number] = [19.5, 69]
const NECK: readonly [number, number] = [19, 65]
const ARM_PART = 10.5

/** とびらの はば の ひろがり(1 = しまっている / 0 = ひらいた) */
const leafScale = (closed: number) => 1 + (CLOSED_SCALE - 1) * closed

function Ground() {
  return (
    <>
      {/* 左右の へい と かわら */}
      <rect x="-2" y="34" width="21.6" height="64" fill={WALL} />
      <rect x="-2" y="88" width="21.6" height="10" fill={WALL_SHADE} />
      <rect x="-3" y="29" width="23.4" height="6" rx="2" fill={TILE} />
      <rect x="-3" y="29" width="23.4" height="2" rx="1" fill={TILE_LIGHT} />
      <rect x="90.3" y="34" width="21.7" height="64" fill={WALL} />
      <rect x="90.3" y="88" width="21.7" height="10" fill={WALL_SHADE} />
      <rect x="89" y="29" width="23" height="6" rx="2" fill={TILE} />
      <rect x="89" y="29" width="23" height="2" rx="1" fill={TILE_LIGHT} />
      <ellipse cx="54.5" cy="99" rx="58" ry="5.4" fill={GRASS} />
      {[6, 34, 76, 102].map((x) => (
        <path key={x} d={`M${x} 98.6 l1.4 -3.4 l1 3 l1.6 -4 l0.8 4.4 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** とびらの むこう がわ。すき間から ここが 見える(お日さま・空・おか) */
function Backdrop({ glow }: { readonly glow: number }) {
  return (
    <>
      <rect x={HINGE_L} y="14" width={HINGE_R - HINGE_L} height="82" fill={SKY} />
      <path d="M19 90 Q36 78 54 86 Q74 76 91 88 V97 H19 Z" fill={HILL} />
      <circle cx={SUN_POS[0]} cy={SUN_POS[1]} r={13.5 + glow * 1.5} fill="#fff1b0" opacity="0.7" />
      <circle cx={SUN_POS[0]} cy={SUN_POS[1]} r="11" fill={SUN} />
      <circle cx={SUN_POS[0] - 3.2} cy={SUN_POS[1] - 3.4} r="3.4" fill="#fff6c8" opacity="0.85" />
    </>
  )
}

/** とびら 1まい。はしら の ちょうつがい を じく に、むこうへ ひらく。 */
function Leaf({ side, closed }: { readonly side: 'left' | 'right'; readonly closed: number }) {
  const left = side === 'left'
  const hinge = left ? HINGE_L : HINGE_R
  const x = left ? HINGE_L : HINGE_R - OPEN_W_R
  const w = left ? OPEN_W_L : OPEN_W_R
  const bars = left ? [2, 3, 4] : [5, 7, 8]
  const win = left ? { x: 21, w: 22.6, y: 16, h: 22 } : { x: 65.6, w: 23.4, y: 15, h: 22 }
  return (
    <Layer scaleX={leafScale(closed)} origin={[hinge, 0]}>
      <rect x={x} y="13" width={w} height="83" fill={WOOD} />
      {/* 下の いた(2まいの はめいた) */}
      <rect x={x + 3} y="46" width={w - 6} height="46" rx="2" fill={WOOD_DARK} />
      <rect x={x + 4.6} y="47.6" width={w - 9.2} height="42.8" rx="1.4" fill={WOOD} />
      <rect x={win.x} y={win.y} width={win.w} height={win.h} fill={WINDOW} />
      {bars.map((n) => (
        <Bone key={n} char={CHAR} n={n} color={LATTICE} width={2.4} />
      ))}
      {/* 6画目の 下の はね(まがり)は とびらの したに かくれるので、うえ と はしら だけ 描く */}
      {!left && <Bone char={CHAR} n={6} color={POST} width={4.2} to={0.88} />}
    </Layer>
  )
}

function Gate({ t, closed }: { readonly t: number; readonly closed: number }) {
  const rise = span(t, 0, RISE, backOut)
  return (
    <Layer scaleY={Math.max(rise, 0.001)} origin={[54.5, 96]} opacity={span(t, 0, 0.2)}>
      <Backdrop glow={1 - closed} />
      <Leaf side="left" closed={closed} />
      <Leaf side="right" closed={closed} />
      {/* はしら(まんなか の すき間 が 見えるよう、とびらの 手まえに) */}
      <Bone char={CHAR} n={1} color={POST} width={5.4} />
      <rect x="87.6" y="13" width="5.4" height="82" rx="2.4" fill={POST} />
      <ellipse cx="19.8" cy="96.6" rx="5.2" ry="1.8" fill="#9a9a9a" />
      <ellipse cx="90.3" cy="96.6" rx="5.2" ry="1.8" fill="#9a9a9a" />
      {/* 門の やね */}
      <path d="M12 12.4 Q54.5 3 97 12.4 L97 8.4 Q54.5 -1 12 8.4 Z" fill={TILE} />
      <path d="M12 8.4 Q54.5 -1 97 8.4 L97 9.8 Q54.5 0.6 12 9.8 Z" fill={TILE_LIGHT} />
    </Layer>
  )
}

type Mood = 'sad' | 'push' | 'surprised' | 'happy'
type Point = readonly [number, number]

/** かた と 手の場所から、ひじ の場所を きめる(2本の ほね。ひじ は 下がわ・うしろがわ に まがる) */
function armJoints(shoulder: Point, target: Point, part: number): { readonly elbow: Point; readonly hand: Point } {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.hypot(dx, dy) || 0.001
  const reach = Math.min(dist, part * 2 - 0.05)
  const ux = dx / dist
  const uy = dy / dist
  const mid: Point = [shoulder[0] + (ux * reach) / 2, shoulder[1] + (uy * reach) / 2]
  const bend = Math.sqrt(Math.max(part * part - (reach / 2) ** 2, 0))
  return {
    elbow: [mid[0] - uy * bend, mid[1] + ux * bend],
    hand: [shoulder[0] + ux * reach, shoulder[1] + uy * reach],
  }
}

function Arm({ target, color }: { readonly target: Point; readonly color: string }) {
  const { elbow, hand } = armJoints(SHOULDER, target, ARM_PART)
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.7" fill={SKIN} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="23.6" cy="60.8" r="2" fill={CHEEK} opacity="0.55" />
      {mood === 'sad' && (
        <>
          <path d="M22.4 54.6 L26 53.2" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="24.4" cy="56.8" r="1.2" fill="#2b2b2b" />
          <path d="M22.8 62.6 Q24.4 61 26 62.6" fill="none" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'push' && (
        <>
          <path d="M22.8 55.2 L25.6 56.8 L22.8 58.4" fill="none" stroke="#2b2b2b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22.6 62 h3.6" stroke="#b9483f" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
      {mood === 'surprised' && (
        <>
          <path d="M22.4 52.8 Q24.4 51.4 26.2 52.6" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="24.4" cy="56.4" r="1.9" fill="#2b2b2b" />
          <circle cx="24.9" cy="55.8" r="0.6" fill="#ffffff" />
          <ellipse cx="24.8" cy="62.4" rx="1.5" ry="1.9" fill="#b9483f" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M22.6 57.6 Q24.4 54.8 26.2 57.6" fill="none" stroke="#2b2b2b" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M22.2 60.6 Q24.8 66 27.4 60.6 Z" fill="#b9483f" />
          <path d="M23.6 62.6 Q24.8 63.6 26 62.6" fill="none" stroke="#ff8a8a" strokeWidth="0.9" strokeLinecap="round" />
        </>
      )}
    </>
  )
}

type ChildProps = {
  readonly step: number
  readonly mood: Mood
  readonly nearHand: Point
  readonly farHand: Point
  readonly headTilt: number
}

function Child({ step, mood, nearHand, farHand, headTilt }: ChildProps) {
  return (
    <>
      <Arm target={farHand} color={TUNIC_FAR} />
      {/* 足: こし(y=85)から。あるくとき かわりばんこに ふる */}
      <Layer rotate={step * 20} origin={[20.6, 85]}>
        <rect x="18.4" y="83" width="4.8" height="13.4" rx="2.4" fill={PANTS_DARK} />
        <ellipse cx="22.4" cy="96.4" rx="4.2" ry="2.2" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 20} origin={[17.2, 85]}>
        <rect x="14.8" y="83" width="4.8" height="13.4" rx="2.4" fill={PANTS} />
        <ellipse cx="18.8" cy="96.4" rx="4.2" ry="2.2" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう の まんなか の上 */}
      <rect x="17.2" y="62" width="4.2" height="6" rx="2" fill={SKIN_SHADE} />
      <rect x="13.6" y="66" width="11" height="20.4" rx="5" fill={TUNIC} />
      <path d="M15 80.5 h8" stroke={TUNIC_DARK} strokeWidth="1.4" strokeLinecap="round" />
      <Arm target={nearHand} color={TUNIC_DARK} />
      <Layer rotate={headTilt} origin={NECK}>
        <circle cx="19.5" cy="57.2" r="8" fill={SKIN} />
        <circle cx="14.4" cy="59.6" r="1.8" fill={SKIN_SHADE} />
        <path d="M11.4 58.4 C10.2 46.4 25 44.4 27.6 53.2 C23.2 51.2 17.4 52 14.6 58.8 Z" fill={HAIR} />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

/** ひかりが さしこむ: まわりが ぽっと 明るくなり、足もとに ひかりの おび が のびる。 */
function Light({ t, open }: { readonly t: number; readonly open: number }) {
  if (open <= 0) return null
  const half = 10.2 * open
  const spread = 14 * open
  const pulse = wave(t, 1.6) * 0.02
  return (
    <>
      <polygon points={`${GAP_MID - half},95 ${GAP_MID + half},95 ${GAP_MID + half + spread},109 ${GAP_MID - half - spread},109`} fill="#fff1b0" opacity={0.5 * open} />
      {[44, 32, 22].map((r) => (
        <circle key={r} cx={SUN_POS[0]} cy={SUN_POS[1]} r={r * open} fill={SUN} opacity={0.09 + pulse} />
      ))}
      {/* ひかりの なか を ただよう ちり */}
      {[
        [46, 90, 0],
        [58, 84, 1.3],
        [38, 74, 2.1],
        [68, 78, 0.7],
        [50, 62, 3.2],
        [30, 88, 4.1],
      ].map(([x, y, phase]) => (
        <circle key={`${x}-${y}`} cx={x + wave(t, 2.4, phase) * 2.4} cy={y - ((t * 3 + phase * 4) % 8)} r="0.9" fill="#ffffff" opacity={open * (0.5 + 0.4 * wave(t, 1.1, phase))} />
      ))}
    </>
  )
}

/** ひかりが さした あと、小鳥が とんできて へい に とまる。 */
function Bird({ t }: SceneProps) {
  const arrive = span(t, OPENED, OPENED + 0.9, easeOut)
  if (arrive <= 0) return null
  const x = 128 - arrive * 28
  const y = 8 + arrive * 19 - Math.sin(arrive * Math.PI) * 8
  const landed = arrive >= 1
  const hop = landed ? Math.abs(wave(t, 0.7)) * 0.9 : 0
  const flap = landed ? 0 : wave(t, 0.16) * 28
  return (
    <Layer x={x} y={y - hop}>
      <path d="M2.6 0.4 l4.6 -1.6 l-3.4 3.2 Z" fill="#e2733f" />
      <ellipse cx="0" cy="0" rx="4" ry="3.1" fill="#ff9a5c" />
      <circle cx="-3" cy="-2.3" r="2.3" fill="#ff9a5c" />
      <path d="M-5 -2.4 l-2.4 0.7 l2.3 0.9 Z" fill="#f2b632" />
      <circle cx="-3.6" cy="-2.8" r="0.55" fill="#2b2b2b" />
      <Layer rotate={flap} origin={[0.4, -0.6]}>
        <path d="M-1.2 -0.8 Q1.6 -3.8 4 -0.6 Q1.6 0.8 -1.2 -0.8 Z" fill="#e2733f" />
      </Layer>
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 12)

  // とびら: おしあけると ひらいて、すき間が できる
  const open = span(t, PUSH, OPENED, easeInOut)
  const closed = 1 - open

  // あるく: 左から 門の まえへ。あしを ふって 体が 上下する
  const walkEase = 1 - span(t, STOP - 0.25, STOP)
  const stride = t < WALK ? 0 : Math.sin((t - WALK) * Math.PI * 2 * 1.8) * walkEase
  const walkX = mix(t, WALK, STOP, -32, 0, easeOut)
  const bob = -Math.abs(stride) * 1.2

  const mood: Mood = t < PUSH ? 'sad' : t < SURPRISE ? 'push' : t < JOY ? 'surprised' : 'happy'

  // おすとき ぐっと まえへ。ひかりに おどろいて 少し のけぞり、よろこんで はずむ
  const lean = mix(t, REACH, PUSH + 0.3, 0, 7) * (1 - span(t, SURPRISE - 0.3, SURPRISE)) - 3 * span(t, SURPRISE, SURPRISE + 0.3) * (1 - span(t, SURPRISE + 0.4, JOY))
  const joyHop = t >= JOY && t < INK ? Math.abs(wave(t - JOY, 0.9)) * 1.6 : 0

  // 手: ふだんは だらんと下げる。とびらを おす手は、とびらの おもての 点を おいかける
  const hang = (swing: number): Point => [22 + swing, 89]
  const doorFace: Point = [HINGE_L + (40 - HINGE_L) / CLOSED_SCALE * leafScale(closed), 74]
  const doorFaceFar: Point = [doorFace[0] - 1.5, 69]
  const reach = span(t, REACH, PUSH, easeInOut)
  const surprise = span(t, SURPRISE, SURPRISE + 0.4, easeOut)
  const joy = span(t, JOY, JOY + 0.45, backOut)
  const blend = (a: Point, b: Point, k: number): Point => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
  const handFor = (rest: Point, door: Point, up: Point, surpriseUp: Point): Point => {
    const toDoor = blend(rest, door, reach)
    const afterDoor = blend(toDoor, surpriseUp, surprise)
    return blend(afterDoor, up, joy)
  }
  const nearHand = handFor(hang(stride * 7), doorFace, [33, 55], [30, 66])
  const farHand = handFor(hang(-stride * 7), doorFaceFar, [31, 46], [28, 63])

  const headTilt = t < STOP ? 9 : t < REACH ? mix(t, STOP, REACH, 9, -3) : t < SURPRISE ? 3 : t < JOY ? -9 : -4 + wave(t, 0.9) * 2

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground />
        <Gate t={t} closed={closed} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <ellipse cx={19 + walkX} cy="98" rx="9" ry="2.2" fill="#000000" opacity="0.14" />
          <Layer x={walkX} y={bob - joyHop} rotate={lean} origin={FEET}>
            <Child step={stride} mood={mood} nearHand={nearHand} farHand={farHand} headTilt={headTilt} />
          </Layer>
        </Layer>
        <Bird t={t} />
        {/* はじめは うす暗い。ひかりが さすと 明るくなる */}
        <rect x="-4" y="-4" width="117" height="117" fill={DIM} opacity={0.3 * closed} />
        <Light t={t} open={open} />
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
    { at: 0, label: 'しまった 門が たつ', sound: 'pop' },
    { at: WALK, label: 'うす暗くて、子どもが しょんぼり あるいてくる' },
    { at: REACH, label: '門を 見あげて、とびらに 手を かける' },
    { at: PUSH, label: 'うんしょ と とびらを おす', sound: 'pop' },
    { at: SURPRISE, label: 'すき間から 光が さしこむ。おどろく' },
    { at: JOY, label: '光に てらされて、にっこり。小鳥も くる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '間 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
