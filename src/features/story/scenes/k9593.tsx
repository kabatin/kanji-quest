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
 * 人は Person(あるきは walk、おす手・あげる手は { to } で 点に おく)。
 *   とびらは はしら の ちょうつがい を じくに、むこうへ ひらく(ひらくと 見える はば が せまくなる)。
 *   門・ひかり・ちり は ここで 描く。小鳥は Bird。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Bird, mixLimb, PALETTE, Person, walk, type Limb } from '../sceneFigures'

const CHAR = '間'

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
const LEAF = PALETTE.leaf
const SUN = '#ffd24a'
const SKY = '#bfe6fa'
const HILL = '#9fd9a0'
const DIM = '#2f3f66'

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

/** 子どもの 見た目(赤い 上着・青い ズボン) */
const KID_LOOK = { top: '#e8645a', bottom: '#4a5c8c' } as const
const KID_HEIGHT = 47
const KID_FACE = { sad: 'sad', push: 'strain', surprised: 'surprised', happy: 'joy' } as const

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
function Visitor({ t }: SceneProps) {
  const arrive = span(t, OPENED, OPENED + 0.9, easeOut)
  if (arrive <= 0) return null
  const x = 128 - arrive * 28
  const y = 8 + arrive * 19 - Math.sin(arrive * Math.PI) * 8
  const landed = arrive >= 1
  const hop = landed ? Math.abs(wave(t, 0.7)) * 0.9 : 0
  return <Bird x={x} y={y - hop} t={t} flying={!landed} facing="left" />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 12)

  // とびら: おしあけると ひらいて、すき間が できる
  const open = span(t, PUSH, OPENED, easeInOut)
  const closed = 1 - open

  // あるく: 左から 門の まえへ(walk)
  const w = walk(t, { from: -13, to: 19, start: WALK, end: STOP, build: 'child', height: KID_HEIGHT, armSwing: 14 })

  const mood: Mood = t < PUSH ? 'sad' : t < SURPRISE ? 'push' : t < JOY ? 'surprised' : 'happy'

  // おすとき ぐっと まえへ。ひかりに おどろいて 少し のけぞり、よろこんで はずむ
  const lean = mix(t, REACH, PUSH + 0.3, 0, 7) * (1 - span(t, SURPRISE - 0.3, SURPRISE)) - 3 * span(t, SURPRISE, SURPRISE + 0.3) * (1 - span(t, SURPRISE + 0.4, JOY))
  const joyHop = t >= JOY && t < INK ? Math.abs(wave(t - JOY, 0.9)) * 1.6 : 0

  // 手: ふだんは あるきの うで。とびらを おす手は、とびらの おもての 点を おいかける
  const doorFace: Point = [HINGE_L + (40 - HINGE_L) / CLOSED_SCALE * leafScale(closed), 74]
  const doorFaceFar: Point = [doorFace[0] - 1.5, 69]
  const reach = span(t, REACH, PUSH, easeInOut)
  const surprise = span(t, SURPRISE, SURPRISE + 0.4, easeOut)
  const joy = span(t, JOY, JOY + 0.45, backOut)
  const handFor = (rest: Limb, door: Point, up: Point, surpriseUp: Point): Limb => {
    const toDoor = mixLimb(rest, { to: door }, reach)
    const afterDoor = mixLimb(toDoor, { to: surpriseUp }, surprise)
    return mixLimb(afterDoor, { to: up }, joy)
  }
  // 右むき: てまえ = ひだりうで、むこう = みぎうで
  const pose = {
    ...w.pose,
    leftArm: handFor(w.pose.leftArm ?? { swing: 0, bend: 0 }, doorFace, [33, 55], [30, 66]),
    rightArm: handFor(w.pose.rightArm ?? { swing: 0, bend: 0 }, doorFaceFar, [31, 46], [28, 63]),
    head: t < STOP ? 9 : t < REACH ? mix(t, STOP, REACH, 9, -3) : t < SURPRISE ? 3 : t < JOY ? -9 : -4 + wave(t, 0.9) * 2,
  }

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground />
        <Gate t={t} closed={closed} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <ellipse cx={w.x} cy="98" rx="9" ry="2.2" fill="#000000" opacity="0.14" />
          <Person {...w} y={97} look={KID_LOOK} face={KID_FACE[mood]} gazeY={mood === 'sad' ? 0.6 : 0} lean={lean} lift={joyHop} pose={pose} />
        </Layer>
        <Visitor t={t} />
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
