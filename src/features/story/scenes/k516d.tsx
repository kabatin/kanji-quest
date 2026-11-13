/*
 * 六(ろく): やねの ある 家の 形。
 *
 * ほね(画と絵の対応)
 *   1画目(丶)  … やねの 上に たつ えんとつ(火の けむり が 出る)
 *   2画目(一)  … 大きな ひろい やね(わらの いた)
 *   3・4画目   … やねを ささえる 左右の はしら(「八」の かたち。上で よせあって 家の 骨になる)
 *
 * ながれ
 *   はしら が 立っている ところへ、雨の中を 子どもが あるいてくる → さむくて ぶるぶる(かなしい顔)
 *   → 切り株の上の 大きな いた を、よいしょ と もちあげる(がんばる顔)
 *   → はしら の 上に のせると 雨が はじかれて、中は ぬくぬく。えんとつが 立ち、たき火に あたって にっこり
 *   → 雨が やんで お日さまが 出る → ほね が ひかって、絵が うすくなり、字「六」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(下の arm で かた・ひじ・手 を つなぐ)。くび は みじかく、どう の 上に あたま。
 *   いた は、字の 2画目の 場所まで もちあがって、そのまま やね に なる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '六'

const SKIN = '#f8cfa6'
const HAIR = '#5a3b2a'
const SHIRT = '#e8645a'
const SHIRT_DARK = '#c94f47'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const WOOD = '#8c5b3c'
const WOOD_DARK = '#70452b'
const WOOD_LIGHT = '#b07a52'
const THATCH = '#c9a05a'
const THATCH_DARK = '#a8783d'
const THATCH_LIGHT = '#e6c47c'
const BRICK = '#c4574a'
const BRICK_DARK = '#9c3f35'
const GRASS = '#c5e8a9'
const GRASS_DARK = '#a8d68a'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const RAIN = '#5aaee8'
const CLOUD = '#8a98b0'
const CLOUD_DARK = '#74839d'
const FIRE = '#ff8a3d'
const FIRE_LIGHT = '#ffd24a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const WALK = 0.8
const ARRIVE = 2.4
const HUG = 2.2
const GRAB = 3.4
const LIFT = 3.9
/** いた が やね の場所に とどく */
const SET = 5.0
const WARM = 5.8
const INK = 6.6
const DONE = 9.3
const DURATION = 10

/** 子どもは 家の中(はしら の間)に 立つ。足もとが 地面の y=88、大きさは 0.85 ばい */
const CX = 47
const FEET_Y = 88
const KID = 0.85
const LOCAL_FEET = 96
/** 子どもの からだ(子どもの中の ざひょう) */
const SHOULDER_Y = 66
const SHOULDER_DX = 5.5
const ARM_PART = 12
const HIP_Y = 82
const HEAD: readonly [number, number] = [CX, 54]

/** いた が 切り株に のっている とき、やね の場所より どれだけ 下か */
const BOARD_REST = 31.5
/** 切り株の 上の たかさ */
const STUMP_TOP = 75
/** たき火の 場所 */
const FIRE_X = 66
const FIRE_Y = 87

/** 絵の ざひょう の y を、子どもの中の ざひょう に直す */
const toKidY = (y: number) => LOCAL_FEET + (y - FEET_Y) / KID
const toKidDx = (dx: number) => dx / KID

type Pt = readonly [number, number]
const lerp = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

function Ground() {
  return (
    <>
      <path d="M-4 90 Q27 84 54.5 87 Q82 90 113 85 V113 H-4 Z" fill={GRASS} />
      <path d="M-4 100 Q30 97 60 100 Q90 103 113 99 V113 H-4 Z" fill={GRASS_DARK} />
      {[6, 40, 98].map((x) => (
        <path key={x} d={`M${x} 101 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 雨雲。雨が やむころ、ゆっくり きえる */
function RainCloud({ t }: SceneProps) {
  const show = span(t, 0, 0.6) * (1 - span(t, 5.6, 6.4))
  return (
    <Layer opacity={show} x={wave(t, 6) * 1.2}>
      <ellipse cx="14" cy="6" rx="18" ry="6" fill={CLOUD_DARK} />
      <ellipse cx="42" cy="4" rx="22" ry="6.5" fill={CLOUD} />
      <ellipse cx="72" cy="6" rx="22" ry="6.5" fill={CLOUD_DARK} />
      <ellipse cx="98" cy="4" rx="18" ry="6" fill={CLOUD} />
    </Layer>
  )
}

/** 雨。やね が のった あとは、やね の上で はじかれる */
function Rain({ t }: SceneProps) {
  const show = span(t, 0.4, 0.9) * (1 - span(t, 5.7, 6.2))
  if (show <= 0) return null
  const roofed = t >= SET
  return (
    <g opacity={show}>
      {Array.from({ length: 13 }, (_, i) => {
        const x = 5 + i * 8.4
        const stop = roofed && x > 13 && x < 96 ? 36 : 92
        const p = (t * 1.5 + ((i * 0.37) % 1)) % 1
        const y = -2 + p * (stop + 2)
        const splash = p > 0.9 ? (p - 0.9) / 0.1 : 0
        return (
          <g key={i}>
            {p <= 0.9 && <path d={`M${x} ${y - 4.5} L${x - 0.6} ${y}`} stroke={RAIN} strokeWidth="0.9" strokeLinecap="round" />}
            {splash > 0 && (
              <>
                <circle cx={x - splash * 3} cy={stop - 1 - Math.sin(splash * Math.PI) * 2.5} r="0.7" fill={RAIN} opacity={1 - splash} />
                <circle cx={x + splash * 3} cy={stop - 1 - Math.sin(splash * Math.PI) * 2.5} r="0.7" fill={RAIN} opacity={1 - splash} />
              </>
            )}
          </g>
        )
      })}
    </g>
  )
}

/** 雨が やんで、お日さま */
function Sun({ t }: SceneProps) {
  const sun = span(t, 6.0, 6.7, easeOut)
  return (
    <Layer opacity={sun} rotate={t * 14} origin={[97, 12]}>
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x="96.2" y="2" width="1.6" height="3.6" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 97 12)`} />
      ))}
      <circle cx="97" cy="12" r={5.4 * sun} fill={SUN} />
    </Layer>
  )
}

/** 家の骨。はしら(3・4画目)は 上で よせあって、やね を ささえる */
function Frame({ t }: SceneProps) {
  const rise = span(t, 0, 0.7, backOut)
  const warm = span(t, SET + 0.2, WARM)
  return (
    <Layer scaleY={rise} origin={[54, 89]} opacity={Math.min(1, rise * 3)}>
      {/* 中の ぬくもり(やね が のったあと ほんのり あかるくなる) */}
      <path d="M53 44 L15.4 89 L93.3 89 Z" fill="#fff0c6" opacity={warm * 0.9} />
      {/* 左の はしら(3画目): やね の下まで のびている */}
      <path d="M49.5 43.5 L38.11 58.6 c0.51,1.37,0.42,3.67,-0.49,5.29 C33.38,71.38,24,82.38,15.41,88.75" fill="none" stroke={WOOD} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
      {/* 右の はしら(4画目) */}
      <path d="M57.5 43.5 L70.16 59.92 c9.96,8.61,18.18,18.54,23.16,28.99" fill="none" stroke={WOOD_DARK} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
    </Layer>
  )
}

/** 切り株。いた を のせておく ところ */
function Stump({ x }: { readonly x: number }) {
  const h = 89 - STUMP_TOP
  return (
    <>
      <rect x={x - 5.4} y={STUMP_TOP + 1.4} width="10.8" height={h - 1.4} rx="1.4" fill={WOOD} />
      <ellipse cx={x} cy={STUMP_TOP + 1.4} rx="5.4" ry="2" fill={WOOD_LIGHT} />
      <ellipse cx={x} cy={STUMP_TOP + 1.4} rx="2.6" ry="0.9" fill="none" stroke={WOOD_DARK} strokeWidth="0.5" />
    </>
  )
}

/** やね に する 大きな いた(2画目)。わら をかさねた ひろい いた */
function Board({ dy }: { readonly dy: number }) {
  return (
    <Layer y={dy}>
      <Bone char={CHAR} n={2} color={THATCH_DARK} width={7.6} />
      <Layer y={-0.9}>
        <Bone char={CHAR} n={2} color={THATCH} width={5.8} />
      </Layer>
      <Layer y={-2}>
        <Bone char={CHAR} n={2} color={THATCH_LIGHT} width={1.6} />
      </Layer>
    </Layer>
  )
}

/** えんとつ(1画目): やね の上に ぽん と 立つ */
function Chimney({ t }: SceneProps) {
  const pop = span(t, SET + 0.1, SET + 0.55, backOut)
  if (pop <= 0) return null
  return (
    <Layer scaleY={pop} origin={[54.5, 40]}>
      <Bone char={CHAR} n={1} color={BRICK} width={6.6} />
      <path d="M52.2 21.5 h5.6 M52.6 27 h5.4 M53 32.5 h5.4" stroke={BRICK_DARK} strokeWidth="0.8" strokeLinecap="round" />
      <rect x="48.8" y="14.4" width="11.2" height="3.6" rx="1.4" fill={BRICK_DARK} />
    </Layer>
  )
}

/** たき火。ゆらゆら もえる */
function Campfire({ t }: SceneProps) {
  const grow = span(t, SET + 0.4, SET + 0.9, backOut)
  if (grow <= 0) return null
  const flick = wave(t, 0.35)
  const flick2 = wave(t, 0.23, 0.1)
  return (
    <>
      <ellipse cx={FIRE_X} cy={FIRE_Y - 4} rx={13 * grow} ry={9 * grow} fill="#ffd98a" opacity="0.4" />
      <Layer scale={grow} origin={[FIRE_X, FIRE_Y]}>
        <rect x={FIRE_X - 6} y={FIRE_Y - 1.6} width="12" height="2.6" rx="1.2" fill={WOOD_DARK} transform={`rotate(14 ${FIRE_X} ${FIRE_Y})`} />
        <rect x={FIRE_X - 6} y={FIRE_Y - 1.6} width="12" height="2.6" rx="1.2" fill={WOOD} transform={`rotate(-14 ${FIRE_X} ${FIRE_Y})`} />
        <path d={`M${FIRE_X - 3.4} ${FIRE_Y - 1} Q${FIRE_X - 4.2 + flick} ${FIRE_Y - 6} ${FIRE_X + flick * 0.8} ${FIRE_Y - 11 - flick2} Q${FIRE_X + 4.4} ${FIRE_Y - 5} ${FIRE_X + 3.4} ${FIRE_Y - 1} Z`} fill={FIRE} />
        <path d={`M${FIRE_X - 1.8} ${FIRE_Y - 1} Q${FIRE_X - 2} ${FIRE_Y - 4} ${FIRE_X + flick2 * 0.5} ${FIRE_Y - 6.6} Q${FIRE_X + 2.4} ${FIRE_Y - 3.6} ${FIRE_X + 1.8} ${FIRE_Y - 1} Z`} fill={FIRE_LIGHT} />
      </Layer>
    </>
  )
}

/** えんとつの けむり。火が もえはじめてから ふわふわ のぼる */
function Smoke({ t }: SceneProps) {
  const show = span(t, SET + 0.9, SET + 1.3) * (1 - span(t, INK - 0.3, INK + 0.4))
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.34, 0.67].map((offset) => {
        const p = (((t - SET) * 0.55 + offset) % 1 + 1) % 1
        return <circle key={offset} cx={54.5 + p * 10 + Math.sin(p * 6) * 1.6} cy={13 - p * 11} r={1.8 + p * 3} fill="#f2f2f2" stroke="#d3d8e0" strokeWidth="0.5" opacity={Math.sin(p * Math.PI) * 0.95} />
      })}
    </g>
  )
}

type Mood = 'sad' | 'effort' | 'happy'

/** かた から出て、ひじ で まがり、手 に とどく うで。手が とどかない ときは まっすぐ のばす */
function Arm({ side, target }: { readonly side: -1 | 1; readonly target: Pt }) {
  const sx = CX + side * SHOULDER_DX
  const sy = SHOULDER_Y
  const dx = target[0] - sx
  const dy = target[1] - sy
  const full = Math.max(Math.hypot(dx, dy), 0.01)
  const reach = Math.min(full, ARM_PART * 2 - 0.05)
  const ux = dx / full
  const uy = dy / full
  const hand: Pt = [sx + ux * reach, sy + uy * reach]
  const bulge = Math.sqrt(Math.max(0, ARM_PART ** 2 - (reach / 2) ** 2))
  // ひじ は 体の そとがわ に ふくらむ
  const perp = uy * side >= 0 ? ([uy, -ux] as const) : ([-uy, ux] as const)
  const elbow: Pt = [sx + ux * (reach / 2) + perp[0] * bulge, sy + uy * (reach / 2) + perp[1] * bulge]
  return (
    <>
      <path d={`M${sx} ${sy} L${elbow[0]} ${elbow[1]}`} stroke={SHIRT_DARK} strokeWidth="5.2" strokeLinecap="round" />
      <path d={`M${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} stroke={SKIN} strokeWidth="3.8" strokeLinecap="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.5" fill={SKIN} />
    </>
  )
}

type KidProps = {
  readonly stride: number
  readonly mood: Mood
  readonly leftHand: Pt
  readonly rightHand: Pt
}

function Face({ mood }: { readonly mood: Mood }) {
  const [hx, hy] = HEAD
  return (
    <>
      <circle cx={hx - 4.6} cy={hy + 3.4} r="1.7" fill={CHEEK} opacity="0.55" />
      <circle cx={hx + 4.6} cy={hy + 3.4} r="1.7" fill={CHEEK} opacity="0.55" />
      {mood === 'sad' && (
        <>
          <circle cx={hx - 2.9} cy={hy + 0.8} r="1" fill={EYE} />
          <circle cx={hx + 2.9} cy={hy + 0.8} r="1" fill={EYE} />
          <path d={`M${hx - 5} ${hy - 1.2} L${hx - 1.8} ${hy - 2.5} M${hx + 5} ${hy - 1.2} L${hx + 1.8} ${hy - 2.5}`} stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <path d={`M${hx - 1.8} ${hy + 5.6} Q${hx} ${hy + 4} ${hx + 1.8} ${hy + 5.6}`} fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
        </>
      )}
      {mood === 'effort' && (
        <>
          <path d={`M${hx - 4.4} ${hy - 0.6} L${hx - 1.6} ${hy + 0.8} L${hx - 4.4} ${hy + 2.2} M${hx + 4.4} ${hy - 0.6} L${hx + 1.6} ${hy + 0.8} L${hx + 4.4} ${hy + 2.2}`} fill="none" stroke={EYE} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M${hx - 2.2} ${hy + 5.4} H${hx + 2.2}`} stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d={`M${hx - 4.4} ${hy + 1.2} Q${hx - 2.9} ${hy - 1} ${hx - 1.4} ${hy + 1.2} M${hx + 1.4} ${hy + 1.2} Q${hx + 2.9} ${hy - 1} ${hx + 4.4} ${hy + 1.2}`} fill="none" stroke={EYE} strokeWidth="1" strokeLinecap="round" />
          <path d={`M${hx - 2.6} ${hy + 4.2} Q${hx} ${hy + 8} ${hx + 2.6} ${hy + 4.2} Z`} fill={MOUTH} />
        </>
      )}
    </>
  )
}

/** 子ども(正面むき)。足は こしから、うで は かた から、くび は みじかく どう の上。 */
function Kid({ stride, mood, leftHand, rightHand }: KidProps) {
  const [hx, hy] = HEAD
  return (
    <>
      {/* あし(あるくとき かわりばんこに ふる) */}
      <Layer rotate={stride * 16} origin={[CX - 3.4, HIP_Y]}>
        <rect x={CX - 6} y={HIP_Y - 1} width="5.2" height="15.4" rx="2.4" fill={PANTS} />
        <ellipse cx={CX - 3.4} cy={LOCAL_FEET - 0.4} rx="4.2" ry="2.2" fill={SHOE} />
      </Layer>
      <Layer rotate={-stride * 16} origin={[CX + 3.4, HIP_Y]}>
        <rect x={CX + 0.8} y={HIP_Y - 1} width="5.2" height="15.4" rx="2.4" fill={PANTS} />
        <ellipse cx={CX + 3.4} cy={LOCAL_FEET - 0.4} rx="4.2" ry="2.2" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう と あたま の間 */}
      <rect x={CX - 2} y="58.6" width="4" height="5" rx="1.6" fill={SKIN} />
      {/* どう */}
      <rect x={CX - 7} y="62" width="14" height="22" rx="6" fill={SHIRT} />
      <path d={`M${CX - 5} 77 h10`} stroke={SHIRT_DARK} strokeWidth="1.3" strokeLinecap="round" />
      <Arm side={-1} target={leftHand} />
      <Arm side={1} target={rightHand} />
      {/* あたま */}
      <circle cx={hx} cy={hy} r="7.4" fill={SKIN} />
      <path d={`M${hx - 7.6} ${hy - 0.6} C${hx - 8.6} ${hy - 11} ${hx + 8.6} ${hy - 11} ${hx + 7.6} ${hy - 0.6} C${hx + 4} ${hy - 4.8} ${hx - 4} ${hy - 4.8} ${hx - 7.6} ${hy - 0.6} Z`} fill={HAIR} />
      <path d={`M${hx - 1} ${hy - 7.4} Q${hx} ${hy - 10.4} ${hx + 1.8} ${hy - 7.6}`} fill="none" stroke={HAIR} strokeWidth="1.4" strokeLinecap="round" />
      <Face mood={mood} />
    </>
  )
}

/** さむくて ぶるぶる するときの 小さな すじ と、がんばる ときの あせ */
function Marks({ t }: SceneProps) {
  const cold = during(t, HUG + 0.2, GRAB + 0.1, 0.2)
  const sweat = during(t, LIFT + 0.2, SET + 0.1, 0.2)
  const [hx, hy] = HEAD
  return (
    <>
      {cold > 0 && (
        <g opacity={cold} stroke="#5f7fd6" strokeWidth="0.9" fill="none" strokeLinecap="round">
          <path d={`M${hx - 13} ${hy + 8} q-1.6 2 0 4 q1.6 2 0 4`} />
          <path d={`M${hx + 13} ${hy + 8} q1.6 2 0 4 q-1.6 2 0 4`} />
        </g>
      )}
      {sweat > 0 && <path d={`M${hx + 9.6} ${hy - 3 + ((t * 6) % 3)} q1.8 2.4 0 3.4 q-1.8 -1 0 -3.4 Z`} fill="#7cc4f2" opacity={sweat} />}
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  // あるく: 左から 家の中まで
  const walkX = mix(t, WALK, ARRIVE, -62, 0, easeOut)
  const walking = t >= WALK && t < ARRIVE ? 1 : 0
  const stride = Math.sin((t - WALK) * Math.PI * 2 * 1.7) * walking

  // いた: 切り株 → あたまの上 → やね の場所
  const lift = span(t, LIFT, SET, easeInOut)
  const dy = BOARD_REST * (1 - lift)
  // いた が あたま の上で ふるえる(がんばっている)
  const strain = t > LIFT + 0.2 && t < SET ? wave(t, 0.16) * 0.35 : 0

  // うで の手の場所。ふだんは たらす → さむくて 自分を だきしめる → いた を もつ → たらす → 火に あたる
  const mood: Mood = t < GRAB ? 'sad' : t < SET ? 'effort' : 'happy'
  const hand = (side: -1 | 1): Pt => {
    const sx = CX + side * SHOULDER_DX
    const hang: Pt = [sx + side * 3.5, SHOULDER_Y + 21 - Math.abs(stride) * 1.2]
    const hug: Pt = [sx - side * 4.6, SHOULDER_Y + 10]
    const holdAt = (boardDy: number): Pt => [CX + side * toKidDx(9), toKidY(40 + boardDy + 4.6)]
    const warm: Pt = [CX + 17, toKidY(76)]
    if (t < HUG) return hang
    if (t < GRAB) return lerp(hang, hug, span(t, HUG, HUG + 0.4))
    if (t < SET) return lerp(hug, holdAt(dy), span(t, GRAB, GRAB + 0.5))
    const down = lerp(holdAt(0), hang, span(t, SET, SET + 0.6))
    return side === 1 ? lerp(down, warm, span(t, WARM, WARM + 0.5)) : down
  }
  const shiver = t > HUG + 0.3 && t < GRAB ? wave(t, 0.12) * 1.1 : 0
  const bounce = span(t, SET, SET + 0.25) * (1 - span(t, SET + 0.25, SET + 0.5)) * 0.8
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground />
        <RainCloud t={t} />
        <Sun t={t} />
        <Frame t={t} />
        <Layer opacity={span(t, 0.2, 0.7)}>
          <Stump x={18} />
          <Stump x={92} />
        </Layer>
        <Campfire t={t} />
        <Layer opacity={span(t, 0.1, 0.6)}>
          <Board dy={dy + strain} />
        </Layer>
        <Chimney t={t} />
        <Smoke t={t} />
        <ellipse cx={CX + walkX} cy="88.6" rx="7" ry="1.6" fill="#000000" opacity="0.12" />
        <Layer x={walkX} y={FEET_Y - LOCAL_FEET - bounce + (walking ? -Math.abs(stride) * 0.8 : 0)} scale={KID} origin={[CX, LOCAL_FEET]} rotate={shiver} >
          <Kid stride={stride} mood={mood} leftHand={hand(-1)} rightHand={hand(1)} />
          <Marks t={t} />
        </Layer>
        <Rain t={t} />
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
    { at: 0, label: '雨が ふりだす。はしら が 立つ', sound: 'pop' },
    { at: WALK, label: '子どもが 雨の中を あるいてくる' },
    { at: HUG, label: 'さむくて ぶるぶる' },
    { at: LIFT, label: '大きな いた を よいしょ と もちあげる', sound: 'pop' },
    { at: SET, label: 'やね に なる。えんとつ と たき火。雨が はじかれる', sound: 'pop' },
    { at: WARM, label: 'にっこり あたたまる。雨が やむ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '六 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
