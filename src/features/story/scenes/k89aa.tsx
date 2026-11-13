/*
 * 親(おや): 木に のぼる 子どもを、そばで みまもる おや。
 *
 * ほね(画と絵の対応)
 *   1〜5画目   … 木の 大きな しげみ(上の 部分)
 *   6画目(一)  … 木の よこに のびた えだ(子どもが ここに すわる)
 *   7画目(丨)  … 木の みき
 *   8・9画目   … みきから 下に たれた えだ
 *   10〜14画目 … みている おや(あたま の 目の まわり = 見 の 四角)
 *   15・16画目 … おやの 体と あし
 *   (おや と 子どもは 絵のとおりに 立つので、見の画には「だいたい」同じ場所・同じ向き で重なる)
 *
 * ながれ
 *   木が そだち、赤い りんごが なる。子どもが 木の下で「ほしいな」と 見上げる(おや は にこにこ)
 *   → ジャンプしても とどかない → 子どもが 木に のぼりはじめる。おやは しんぱいで 手を にぎる
 *   → えだ に すわった しゅんかん ぐらっと ゆれる(おやは「あっ」と 手を のばす)
 *   → 子どもが たちなおって りんごを もぎとる。おやは ほっとして、手を ひたいに かざして
 *     にこにこ みまもる(しんぱい → あんしん)
 *   → ほね が ひかって、絵が うすくなり、字「親」が のこる
 *
 * 人は ほんものの つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく、どう の まんなか の上。
 *   あし は こし から。左右の うで・あし が ある。子どもは おとなより あたまが 大きく、手足が みじかい。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, pose, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '親'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const BARK = '#8c5b3c'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const GRASS = '#c5e8a9'
const HILL = '#e2f2d2'
const SUN = '#ffd24a'
const APPLE = '#e8534a'
const APPLE_DARK = '#c23e38'

/** くぎり の時間(秒) */
const POP = 0.5
const POINT = 1.0
const JUMP = 1.8
const GIVE_UP = 3.0
const CLIMB = 3.5
const SCOOT = 4.7
const SIT = 5.0
const WOBBLE = 5.1
const STEADY = 5.7
const PLUCK = 6.1
const INK = 7.0
const DONE = 10.0
const DURATION = 10.5

type Point = readonly [number, number]
/** うで・あし の かっこう: [うえ の ぶぶん の角度, さき の ぶぶん の角度]。ま下が 0、右(+x)へ ふるほど 大きい */
type Limb = readonly [number, number]

const radOf = (deg: number) => (deg * Math.PI) / 180

/** はじめ の点から、ひじ(ひざ)・手(足)の場所を 出す。かた → ひじ → 手 と つながる。 */
function reach(from: Point, upper: number, fore: number, [a1, a2]: Limb): { readonly mid: Point; readonly end: Point } {
  const mid: Point = [from[0] + Math.sin(radOf(a1)) * upper, from[1] + Math.cos(radOf(a1)) * upper]
  const end: Point = [mid[0] + Math.sin(radOf(a2)) * fore, mid[1] + Math.cos(radOf(a2)) * fore]
  return { mid, end }
}

/** [時間, 角度1, 角度2] の ならび。時間が来ると、つぎの かっこうへ なめらかに うつる。 */
type Key = readonly [at: number, a1: number, a2: number]

function blend(t: number, keys: readonly Key[]): Limb {
  const first = keys[0]
  if (t <= first[0]) return [first[1], first[2]]
  for (let i = 0; i < keys.length - 1; i += 1) {
    const [from, a1, a2] = keys[i]
    const [to, b1, b2] = keys[i + 1]
    if (t < to) {
      const p = span(t, from, to, easeInOut)
      return [a1 + (b1 - a1) * p, a2 + (b2 - a2) * p]
    }
  }
  const last = keys[keys.length - 1]
  return [last[1], last[2]]
}

/* ───────── 人(まえ向き) ───────── */

type Eyes = 'open' | 'wide' | 'happy'
type Brows = 'none' | 'flat' | 'worried' | 'up' | 'firm'
type Mouth = 'smile' | 'grin' | 'o' | 'flat' | 'wavy' | 'pout'
type Face = { readonly eyes: Eyes; readonly brows: Brows; readonly mouth: Mouth; readonly lookX: number; readonly lookY: number }

type Palette = { readonly hair: string; readonly top: string; readonly pants: string; readonly shoe: string }
type Build = { readonly headR: number; readonly limbW: number; readonly bun: boolean }

/** 体の 大きさ(こし を 0,0 とした、人の まんなか の ざひょう) */
const TORSO_W = 16
const TORSO_H = 26
const SHOULDER_X = 6.5
const SHOULDER_Y = -23
const UPPER = 12
const FORE = 11
const THIGH = 12.5
const SHIN = 12.5
const LEG_X = 3.8

function FaceView({ face, r, hair }: { readonly face: Face; readonly r: number; readonly hair: string }) {
  const eyeX = 0.38 * r
  const eyeY = 0.02 * r
  const eye = (side: -1 | 1) => {
    const cx = side * eyeX + face.lookX * 0.1 * r
    const cy = eyeY + face.lookY * 0.08 * r
    if (face.eyes === 'happy') {
      const y = eyeY + 0.08 * r
      return <path key={`e${side}`} d={`M${side * eyeX - 0.16 * r} ${y} Q${side * eyeX} ${y - 0.3 * r} ${side * eyeX + 0.16 * r} ${y}`} fill="none" stroke={EYE} strokeWidth={0.1 * r + 0.3} strokeLinecap="round" />
    }
    if (face.eyes === 'wide') {
      return (
        <g key={`e${side}`}>
          <circle cx={side * eyeX} cy={eyeY} r={0.2 * r} fill="#ffffff" stroke="#c9c9c9" strokeWidth="0.3" />
          <circle cx={cx} cy={cy} r={0.1 * r} fill={EYE} />
        </g>
      )
    }
    return <circle key={`e${side}`} cx={cx} cy={cy} r={0.125 * r} fill={EYE} />
  }
  const brow = (side: -1 | 1) => {
    if (face.brows === 'none') return null
    const s = side
    const path: Record<Exclude<Brows, 'none'>, string> = {
      worried: `M${s * 0.6 * r} ${-0.2 * r} L${s * 0.2 * r} ${-0.36 * r}`,
      firm: `M${s * 0.6 * r} ${-0.34 * r} L${s * 0.2 * r} ${-0.2 * r}`,
      flat: `M${s * 0.58 * r} ${-0.28 * r} L${s * 0.2 * r} ${-0.28 * r}`,
      up: `M${s * 0.58 * r} ${-0.4 * r} Q${s * 0.4 * r} ${-0.54 * r} ${s * 0.2 * r} ${-0.4 * r}`,
    }
    return <path key={`b${side}`} d={path[face.brows]} fill="none" stroke={hair} strokeWidth={0.09 * r + 0.4} strokeLinecap="round" />
  }
  const mx = face.lookX * 0.06 * r
  const mouth = () => {
    switch (face.mouth) {
      case 'smile':
        return <path d={`M${mx - 0.3 * r} ${0.4 * r} Q${mx} ${0.7 * r} ${mx + 0.3 * r} ${0.4 * r}`} fill="none" stroke={MOUTH} strokeWidth={0.1 * r + 0.3} strokeLinecap="round" />
      case 'grin':
        return <path d={`M${mx - 0.36 * r} ${0.38 * r} Q${mx} ${0.98 * r} ${mx + 0.36 * r} ${0.38 * r} Z`} fill={MOUTH} strokeLinejoin="round" />
      case 'o':
        return <ellipse cx={mx} cy={0.55 * r} rx={0.14 * r} ry={0.19 * r} fill={MOUTH} />
      case 'wavy':
        return <path d={`M${mx - 0.28 * r} ${0.56 * r} Q${mx - 0.14 * r} ${0.42 * r} ${mx} ${0.56 * r} Q${mx + 0.14 * r} ${0.7 * r} ${mx + 0.28 * r} ${0.56 * r}`} fill="none" stroke={MOUTH} strokeWidth={0.1 * r + 0.3} strokeLinecap="round" />
      case 'pout':
        return <path d={`M${mx - 0.22 * r} ${0.58 * r} Q${mx} ${0.4 * r} ${mx + 0.22 * r} ${0.58 * r}`} fill="none" stroke={MOUTH} strokeWidth={0.1 * r + 0.3} strokeLinecap="round" />
      default:
        return <path d={`M${mx - 0.2 * r} ${0.52 * r} h${0.4 * r}`} fill="none" stroke={MOUTH} strokeWidth={0.1 * r + 0.3} strokeLinecap="round" />
    }
  }
  return (
    <>
      <circle cx={-0.62 * r} cy={0.3 * r} r={0.17 * r} fill={CHEEK} opacity="0.5" />
      <circle cx={0.62 * r} cy={0.3 * r} r={0.17 * r} fill={CHEEK} opacity="0.5" />
      {eye(-1)}
      {eye(1)}
      {brow(-1)}
      {brow(1)}
      {mouth()}
    </>
  )
}

type HumanProps = {
  /** こし の場所(絵の ざひょう)と 大きさ・かたむき */
  readonly x: number
  readonly y: number
  readonly scale: number
  readonly tilt: number
  readonly build: Build
  readonly palette: Palette
  /** 絵を見て 左がわ(N)・右がわ(F)の うで と あし */
  readonly armN: Limb
  readonly armF: Limb
  readonly legN: Limb
  readonly legF: Limb
  /** あし の 長さ(1 = ぜんぶ のびている。すわると みじかく見える) */
  readonly legScale: number
  readonly face: Face
  readonly headTilt: number
}

/** こし を じく に、あし・どう・あたま・うで の じゅんに かさねる。 */
function Human({ x, y, scale, tilt, build, palette, armN, armF, legN, legF, legScale, face, headTilt }: HumanProps) {
  if (scale <= 0) return null
  const r = build.headR
  const headY = -(TORSO_H + r - 1.5)
  const leg = (side: -1 | 1, angles: Limb) => {
    const hip: Point = [side * LEG_X, -1]
    const { mid, end } = reach(hip, THIGH * legScale, SHIN * legScale, angles)
    return (
      <g key={`l${side}`}>
        <path d={`M${hip[0]} ${hip[1]} L${mid[0]} ${mid[1]} L${end[0]} ${end[1]}`} fill="none" stroke={palette.pants} strokeWidth={build.limbW + 0.8} strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx={end[0] + side * 1.3} cy={end[1] + 0.6} rx="3.8" ry="2.1" fill={palette.shoe} />
      </g>
    )
  }
  const arm = (side: -1 | 1, angles: Limb) => {
    const shoulder: Point = [side * SHOULDER_X, SHOULDER_Y]
    const { mid, end } = reach(shoulder, UPPER, FORE, angles)
    return (
      <g key={`a${side}`}>
        <path d={`M${shoulder[0]} ${shoulder[1]} L${mid[0]} ${mid[1]}`} fill="none" stroke={palette.top} strokeWidth={build.limbW + 0.6} strokeLinecap="round" />
        <path d={`M${mid[0]} ${mid[1]} L${end[0]} ${end[1]}`} fill="none" stroke={SKIN} strokeWidth={build.limbW - 0.8} strokeLinecap="round" />
        <circle cx={end[0]} cy={end[1]} r={build.limbW * 0.5 + 0.4} fill={SKIN} />
      </g>
    )
  }
  return (
    <g transform={pose({ x, y, rotate: tilt, scale })}>
      {leg(-1, legN)}
      {leg(1, legF)}
      <rect x={-TORSO_W / 2} y={-TORSO_H} width={TORSO_W} height={TORSO_H + 1} rx="7" fill={palette.top} />
      <rect x={-TORSO_W / 2 - 0.2} y="-7" width={TORSO_W + 0.4} height="9" rx="4" fill={palette.pants} />
      {/* くび: みじかく、どう の まんなか の上 */}
      <rect x="-2.3" y={-TORSO_H - 3.5} width="4.6" height="6" rx="2" fill={SKIN_SHADE} />
      <g transform={`translate(0 ${headY}) rotate(${headTilt} 0 ${r * 0.9})`}>
        {build.bun && <circle cx="0" cy={-r * 1.02} r={r * 0.3} fill={palette.hair} />}
        <circle cx={-r} cy={0.06 * r} r={0.2 * r} fill={SKIN} />
        <circle cx={r} cy={0.06 * r} r={0.2 * r} fill={SKIN} />
        <circle cx="0" cy="0" r={r} fill={SKIN} />
        <path d={`M${-0.98 * r} ${-0.15 * r} A${r} ${r} 0 0 1 ${0.98 * r} ${-0.15 * r} Q${0.5 * r} ${-0.62 * r} 0 ${-0.5 * r} Q${-0.5 * r} ${-0.62 * r} ${-0.98 * r} ${-0.15 * r} Z`} fill={palette.hair} />
        {!build.bun && <path d={`M${-0.1 * r} ${-0.95 * r} Q${0.1 * r} ${-1.35 * r} ${0.4 * r} ${-1.1 * r} Q${0.2 * r} ${-1.05 * r} ${0.2 * r} ${-0.9 * r} Z`} fill={palette.hair} />}
        <FaceView face={face} r={r} hair={palette.hair} />
      </g>
      {arm(-1, armN)}
      {arm(1, armF)}
    </g>
  )
}

/* ───────── おや と 子ども ───────── */

const PARENT_BUILD: Build = { headR: 8.6, limbW: 5.4, bun: true }
const PARENT_PALETTE: Palette = { hair: '#4a3326', top: '#3fa7a0', pants: '#4a5a86', shoe: '#6b4a36' }
const PARENT_AT: Point = [69, 65.5]
const PARENT_SCALE = 1.15

const CHILD_BUILD: Build = { headR: 12, limbW: 7, bun: false }
const CHILD_PALETTE: Palette = { hair: '#7a4a2a', top: '#ffc83d', pants: '#5b8fd9', shoe: '#d9594c' }
const CHILD_SCALE = 0.55
/** 子どもの こし の高さ(地面に立つとき)・えだ に すわるとき */
const CHILD_STAND_Y = 81
const CHILD_SIT_Y = 57.3
const CHILD_SIT_X = 40
const SIT_LEG_SCALE = 0.62

const RELAX_N: Limb = [-6, -2]
const RELAX_F: Limb = [6, 2]
const CLASP_N: Limb = [-10, 140]
const CLASP_F: Limb = [10, 220]
const CATCH_N: Limb = [-50, 280]
const CATCH_F: Limb = [20, 10]
const GASP_N: Limb = [-70, 255]
const GASP_F: Limb = [40, 60]
/** てを ひたいに かざして みまもる */
const SHADE_N: Limb = [-140, 120]

/** おや の うで: にこにこ → ぎゅっと にぎる → のばす → あっ → ひたいに かざす */
function parentArms(t: number): { readonly armN: Limb; readonly armF: Limb } {
  const armN = blend(t, [
    [0, ...RELAX_N],
    [1.9, ...RELAX_N],
    [2.4, ...CLASP_N],
    [3.5, ...CLASP_N],
    [3.9, ...CATCH_N],
    [5.0, ...CATCH_N],
    [5.15, ...GASP_N],
    [5.6, ...GASP_N],
    [6.3, ...SHADE_N],
  ])
  const armF = blend(t, [
    [0, ...RELAX_F],
    [1.9, ...RELAX_F],
    [2.4, ...CLASP_F],
    [3.5, ...CLASP_F],
    [3.9, ...CATCH_F],
    [5.0, ...CATCH_F],
    [5.15, ...GASP_F],
    [5.6, ...GASP_F],
    [6.3, ...RELAX_F],
  ])
  return { armN, armF }
}

function parentFace(t: number): Face {
  if (t < 1.9) return { eyes: 'open', brows: 'none', mouth: 'smile', lookX: -1, lookY: 0 }
  if (t < WOBBLE) return { eyes: 'open', brows: 'worried', mouth: 'wavy', lookX: -1, lookY: -0.3 }
  if (t < STEADY) return { eyes: 'wide', brows: 'up', mouth: 'o', lookX: -1, lookY: -0.3 }
  if (t < 6.6) return { eyes: 'open', brows: 'none', mouth: 'grin', lookX: -1, lookY: -0.3 }
  return { eyes: 'happy', brows: 'none', mouth: 'grin', lookX: -1, lookY: 0 }
}

function Parent({ t }: SceneProps) {
  const pop = span(t, POP - 0.2, POP + 0.3)
  const { armN, armF } = parentArms(t)
  const breath = wave(t, 2.2) * 0.5
  // 立ったまま、こころ が うごくと 体が すこし ゆれる
  const nervous = t >= 1.9 && t < STEADY ? wave(t, 0.7) * 0.8 : 0
  return (
    <Layer opacity={pop}>
    <Human
      x={PARENT_AT[0]}
      y={PARENT_AT[1] + breath}
      scale={PARENT_SCALE}
      tilt={nervous}
      build={PARENT_BUILD}
      palette={PARENT_PALETTE}
      armN={armN}
      armF={armF}
      legN={[2, 0]}
      legF={[-2, 0]}
      legScale={1}
      face={parentFace(t)}
      headTilt={t < 1.9 ? 0 : t < STEADY ? -3 : -5}
    />
    </Layer>
  )
}

/** 子どもが すわって、りんご に とどく 手の ひじ の角度(もぎとる しゅんかん) */
const REACH_F: Limb = [40, 170]
const SHOW_F: Limb = [120, 170]

/** 子どもの 手の場所(絵の ざひょう)。りんごを もつ ところ。 */
function childHand(x: number, y: number, armF: Limb): Point {
  const { end } = reach([SHOULDER_X, SHOULDER_Y], UPPER, FORE, armF)
  return [x + end[0] * CHILD_SCALE, y + end[1] * CHILD_SCALE]
}

/** りんごを もぎとる いちばん ひくい場所(すわった子どもの 手の先) */
const APPLE_HAND = childHand(CHILD_SIT_X, CHILD_SIT_Y, REACH_F)
const APPLE_AT: Point = [APPLE_HAND[0], APPLE_HAND[1] - 1.2]

function childFace(t: number): Face {
  if (t < POINT) return { eyes: 'open', brows: 'none', mouth: 'smile', lookX: 0, lookY: 0 }
  if (t < JUMP) return { eyes: 'open', brows: 'up', mouth: 'smile', lookX: 0.5, lookY: -1 }
  if (t < GIVE_UP) return { eyes: 'open', brows: 'firm', mouth: 'grin', lookX: 0.5, lookY: -1 }
  if (t < CLIMB - 0.1) return { eyes: 'open', brows: 'worried', mouth: 'pout', lookX: 0, lookY: -1 }
  if (t < WOBBLE) return { eyes: 'open', brows: 'firm', mouth: 'flat', lookX: 0, lookY: -1 }
  if (t < STEADY) return { eyes: 'wide', brows: 'up', mouth: 'o', lookX: 0, lookY: 0 }
  if (t < 6.6) return { eyes: 'open', brows: 'firm', mouth: 'grin', lookX: 1, lookY: -0.5 }
  return { eyes: 'happy', brows: 'none', mouth: 'grin', lookX: 0, lookY: 0 }
}

type ChildState = { readonly x: number; readonly y: number; readonly tilt: number; readonly armN: Limb; readonly armF: Limb; readonly legN: Limb; readonly legF: Limb; readonly legScale: number }

function childState(t: number): ChildState {
  // 木の下で ジャンプ(2回)、みきの まえへ よこあるき、のぼる、えだ に すわる
  const hop = 6 * (Math.sin(span(t, JUMP, JUMP + 0.4) * Math.PI) + Math.sin(span(t, JUMP + 0.6, JUMP + 1.0) * Math.PI))
  const x = 44 - 8 * span(t, GIVE_UP + 0.1, CLIMB, easeInOut) + (CHILD_SIT_X - 36) * span(t, SCOOT, SIT, easeInOut)
  const y =
    t < CLIMB
      ? CHILD_STAND_Y - hop
      : t < SCOOT
        ? CHILD_STAND_Y + (63 - CHILD_STAND_Y) * span(t, CLIMB, SCOOT, easeInOut)
        : 63 + (CHILD_SIT_Y - 63) * span(t, SCOOT, SIT, easeInOut)
  // ぐらっと ゆれる(だんだん おさまる)
  const tilt = t >= WOBBLE && t < STEADY ? 11 * Math.sin((t - WOBBLE) * 13) * (1 - span(t, WOBBLE, STEADY)) : 0
  const armN = blend(t, [
    [0, ...RELAX_N],
    [JUMP - 0.2, ...RELAX_N],
    [JUMP, -165, -175],
    [GIVE_UP - 0.1, -165, -175],
    [GIVE_UP + 0.3, ...RELAX_N],
    [CLIMB, -168, -175],
    [SCOOT, -168, -175],
    [SIT, -80, -100],
    [STEADY, -80, -100],
    [STEADY + 0.3, -25, -5],
  ])
  const armF = blend(t, [
    [0, ...RELAX_F],
    [POINT - 0.1, ...RELAX_F],
    [POINT + 0.2, 150, 175],
    [JUMP - 0.2, 150, 175],
    [JUMP, 165, 175],
    [GIVE_UP - 0.1, 165, 175],
    [GIVE_UP + 0.3, ...RELAX_F],
    [CLIMB, 168, 175],
    [SCOOT, 168, 175],
    [SIT, 80, 100],
    [STEADY, 80, 100],
    [PLUCK - 0.1, ...REACH_F],
    [PLUCK + 0.1, ...REACH_F],
    [PLUCK + 0.6, ...SHOW_F],
  ])
  // のぼるとき: あしを かわりばんこに もちあげる。すわったら ぶらぶら
  const swing = Math.sin((t - CLIMB) * Math.PI * 2 * 1.7)
  const up = Math.max(swing, 0)
  const down = Math.max(-swing, 0)
  const climbing = t >= CLIMB && t < SCOOT
  const kick = wave(t, 0.9)
  const legN: Limb = climbing ? [-35 * up, 45 * up] : t >= SIT ? [-4 + 6 * kick, 0] : [0, 0]
  const legF: Limb = climbing ? [35 * down, -45 * down] : t >= SIT ? [4 - 6 * kick, 0] : [0, 0]
  const legScale = 1 - (1 - SIT_LEG_SCALE) * span(t, SCOOT, SIT, easeInOut)
  return { x, y, tilt, armN, armF, legN, legF, legScale }
}

function Child({ t }: SceneProps) {
  const pop = span(t, POP, POP + 0.4)
  const s = childState(t)
  return <Layer opacity={pop}><Human x={s.x} y={s.y} scale={CHILD_SCALE} tilt={s.tilt} build={CHILD_BUILD} palette={CHILD_PALETTE} armN={s.armN} armF={s.armF} legN={s.legN} legF={s.legF} legScale={s.legScale} face={childFace(t)} headTilt={0} /></Layer>
}

/** りんご: 木に なっている → もぎとられて 子どもの手に */
function TargetApple({ t }: SceneProps) {
  const leaves = span(t, 0.5, 1.0, backOut)
  if (leaves <= 0) return null
  const picked = t >= PLUCK
  const hand = childHand(childState(t).x, childState(t).y, childState(t).armF)
  const at: Point = picked ? [hand[0], hand[1] - 1.2] : APPLE_AT
  return (
    <Layer scale={picked ? 1 : leaves} origin={at}>
      {!picked && <path d={`M${at[0]} ${at[1] - 2.2} q0.4 -2.2 1.2 -3.6`} fill="none" stroke={BARK} strokeWidth="0.9" strokeLinecap="round" />}
      <circle cx={at[0]} cy={at[1]} r="2.8" fill={APPLE} />
      <circle cx={at[0] + 0.7} cy={at[1] + 0.9} r="2" fill={APPLE_DARK} opacity="0.35" />
      <circle cx={at[0] - 1} cy={at[1] - 1} r="0.7" fill="#ffd6d1" />
      <path d={`M${at[0]} ${at[1] - 2.6} q1.8 -2.4 3.2 -1.6 q-0.8 2 -3.2 1.6 Z`} fill={LEAF_DARK} />
    </Layer>
  )
}

/* ───────── 木・けしき ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[97, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="96.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 97 13)`} />
        ))}
      </Layer>
      <circle cx="97" cy="13" r={6.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 70 113 93 V101 H-4 Z" fill={HILL} />
      {/* ゆっくり ながれる 雲(右上) */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${-t * 1.4} 0)`}>
        <ellipse cx="78" cy="9" rx="7" ry="3" />
        <ellipse cx="82.5" cy="7.4" rx="4.6" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 58, 86, 102].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

function Tree({ t }: SceneProps) {
  // みき が下から のびて、えだ が ひろがり、さいごに 葉が ぽん と しげる
  const trunk = span(t, 0, 0.55, backOut)
  const boughs = span(t, 0.3, 0.75, backOut)
  const leaves = span(t, 0.5, 1.0, backOut)
  const sway = wave(t, 3.6) * 1.1
  return (
    <>
      <ellipse cx="34" cy="97.6" rx={17 * trunk} ry="2.8" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.6 + 0.4 * trunk} scaleY={trunk} origin={[34, 96]}>
        <path d="M27.5 97.5 Q33 92 32 85 L36.4 85 Q35.6 92 41.5 97.5 Z" fill={BARK} />
        <Bone char={CHAR} n={7} color={BARK} width={9} />
      </Layer>
      <Layer scale={boughs} origin={[33, 60]}>
        <Bone char={CHAR} n={6} color={BARK} width={5.6} />
        <Bone char={CHAR} n={8} color={BARK} width={5} />
        <Bone char={CHAR} n={9} color={BARK} width={4.6} />
      </Layer>
      {/* えだの先の 小さな しげみ */}
      <Layer scale={leaves} origin={[33, 60]} rotate={sway * 0.6}>
        <circle cx="13.5" cy="62" r="4.6" fill={LEAF_DARK} />
        <circle cx="15" cy="60" r="3.4" fill={LEAF} />
        <circle cx="12" cy="85.5" r="4.8" fill={LEAF_DARK} />
        <circle cx="13.6" cy="83.4" r="3.4" fill={LEAF} />
        <circle cx="46" cy="75" r="4.2" fill={LEAF_DARK} />
        <circle cx="47" cy="73" r="3" fill={LEAF} />
      </Layer>
      {/* 上の しげみ: 風で ゆっくり ゆれる */}
      <Layer scale={leaves} rotate={sway} origin={[32, 50]}>
        <circle cx="21" cy="33" r="13" fill={LEAF_DARK} />
        <circle cx="43" cy="33" r="12.5" fill={LEAF_DARK} />
        <circle cx="32" cy="21" r="13.5" fill={LEAF_DARK} />
        <circle cx="14.5" cy="42" r="6.6" fill={LEAF_DARK} />
        <circle cx="50" cy="42.5" r="6" fill={LEAF_DARK} />
        <circle cx="32" cy="41" r="10" fill={LEAF_DARK} />
        <circle cx="24" cy="30" r="10.5" fill={LEAF} />
        <circle cx="41" cy="30" r="9.5" fill={LEAF} />
        <circle cx="32" cy="18" r="10.5" fill={LEAF} />
        <circle cx="32" cy="37" r="8" fill={LEAF} />
        <circle cx="26" cy="14" r="4.6" fill={LEAF_LIGHT} />
        <circle cx="14" cy="30" r="3.2" fill={LEAF_LIGHT} />
        <circle cx="19" cy="41" r="2.3" fill={APPLE} />
        <circle cx="35" cy="45" r="2.3" fill={APPLE} />
        <circle cx="42" cy="22" r="2.3" fill={APPLE} />
      </Layer>
    </>
  )
}

/** 木から ひらひら おちる 葉(ひとやすみ の にぎやかし) */
function FallingLeaf({ t }: SceneProps) {
  const p = span(t, 2.0, INK - 0.1)
  if (p <= 0) return null
  const x = 18 + p * 8 + Math.sin(p * 11) * 5
  const y = 44 + p * 52
  return <path d="M0 -3.2 Q2.8 0 0 3.2 Q-2.8 0 0 -3.2 Z" fill={LEAF_LIGHT} stroke={LEAF_DARK} strokeWidth="0.5" transform={`translate(${x} ${y}) rotate(${Math.sin(p * 11) * 50 + 20})`} />
}

/* ───────── おやの きもち ───────── */

/** しんぱいの あせ。あたま の よこを つたう。 */
function Sweat({ t }: SceneProps) {
  const show = during(t, 2.0, WOBBLE, 0.25)
  if (show <= 0) return null
  const p = (t % 0.9) / 0.9
  return <path d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" opacity={show * (1 - p)} transform={`translate(${79.5} ${18 + p * 8})`} />
}

/** 「あっ」の しゅんかん の とびだす すじ。 */
function Gasp({ t }: SceneProps) {
  const show = during(t, WOBBLE, STEADY, 0.15)
  if (show <= 0) return null
  return (
    <g opacity={show} fill="none" stroke="#f2a21d" strokeWidth="1.3" strokeLinecap="round">
      <path d="M69 11 v-5" />
      <path d="M60.5 13.2 l-3.4 -3.4" />
      <path d="M77.5 13.2 l3.4 -3.4" />
    </g>
  )
}

/** ほっとした おやの 上に ふわっと うかぶ ハート。 */
function Heart({ t }: SceneProps) {
  const show = during(t, 6.3, 8.6, 0.4)
  if (show <= 0) return null
  const p = span(t, 6.3, 8.6)
  return <path d="M0 3 C-5 -1 -3 -5 0 -2 C3 -5 5 -1 0 3 Z" fill="#f07f9e" opacity={show} transform={`translate(${69 + Math.sin(p * 6) * 1.5} ${14 - p * 5}) scale(${0.8 + 0.3 * wave(t, 0.9)})`} />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 16)
  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Tree t={t} />
        <FallingLeaf t={t} />
        <TargetApple t={t} />
        <Child t={t} />
        <Parent t={t} />
        <Sweat t={t} />
        <Gasp t={t} />
        <Heart t={t} />
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
    { at: 0, label: '木が そだち、りんごが なる', sound: 'pop' },
    { at: POINT, label: '子どもが りんごを 見上げる。おやは にこにこ' },
    { at: JUMP, label: 'ジャンプしても とどかない。おやは しんぱい' },
    { at: CLIMB, label: '子どもが 木に のぼる。おやは てを のばして そばで 見る', sound: 'pop' },
    { at: WOBBLE, label: 'ぐらっ。おやは「あっ」' },
    { at: PLUCK, label: 'りんごを もぎとる。おやは ほっと にこにこ みまもる', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '親 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
