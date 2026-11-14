/*
 * 室(しつ): やねの したに ある へや。あめの なか、さむい子が へやに はいって ほっとする。
 * (共通部品 sceneFigures で 書きなおした もの)
 *
 * ほね(画と絵の対応)
 *   1画目(丶)  … やねの うえに のびた えんとつ
 *   2画目(ノ)  … へやの ひだりの かべ(とびら の上の かべ)。その下は あいていて、子が はいってくる
 *   3画目(一)  … やねの ふち(ひさし)。みぎはしが すこし たれる
 *   4画目(一)  … かべの たな
 *   5・6画目   … たなから さがる、ひも の かざり(ゆれる)
 *   7画目(一)  … ベンチの すわる いた
 *   8画目(丨)  … ベンチの まえに たつ スタンド(あかり)の ぼう
 *   9画目(一)  … ゆか
 *
 * ながれ
 *   あめが ふりだし、ゆか・かべ・ベンチ・やねが できて「やねの したの へや」になる
 *   → きいろい かっぱの子が、あめに ぬれて ふるえながら あるいてくる
 *   → へやに はいって ぶるぶると みずを ふるい、ほっと ひといき(やねで あめの おとが ぽつぽつ)
 *   → ベンチに ぴょんと すわり、スタンドの ひもを ひくと あかりが ついて、へやが ぽかぽか
 *   → 子が ばんざい して にこにこ → ほね が ひかり、絵が うすくなって 字「室」が のこる
 *
 * 子は Person。あるきは walk()、すわるのは posture('sitChair')。
 * ベンチは 大人用で 高いので、あしは ゆかに とどかず ぶらぶら(ほんものの 子どもの ように)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, HANG_ARM, LOOKS, mixLimb, mixPose, PALETTE, Person, personRig, posture, Rain, seatHeight, Sigh, walk, type Limb, type PersonProps } from '../sceneFigures'

const CHAR = '室'

const COAT_LOOK = { ...LOOKS.boy, top: '#ffcf4a', bottom: '#3e5c86', sleeves: 'long', shoes: '#d95b4b' } as const

const WOOD = '#b9824f'
const WOOD_DARK = '#8c5b3c'
const WOOD_DEEP = '#6b4a36'
const BRICK = '#c4694a'
const BRICK_DARK = '#b24f38'
const ROOF = '#e0674a'
const WALL_DIM = '#a9b5c9'
const WALL_WARM = '#ffeccb'
const LAMP_SHADE_ON = '#ffc95e'
const LAMP_SHADE_OFF = '#b9a27c'
const BULB_ON = '#fff6c8'
const BULB_OFF = '#cfd3da'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const POT = '#d98a5a'

/** くぎり の時間(秒) */
const WALK = 1.2
const ARRIVE = 2.8
const SIGH = 3.4
const HOP = 3.9
const REACH = 4.6
const PULL = 5.3
const LIGHT = 5.45
const INK = 6.8
const DONE = 9.4
const DURATION = 10

/** ゆか(子の あしの うら)の たかさ */
const FLOOR = 93.8
const KID_H = 48
const STAND_X = 27
const SEAT_X = 38
/** ベンチの いたの うえの めん(7画目の 上) */
const BENCH_TOP = 74.7
/** すわった とき の こし の 地面(ベンチの 上 + すわる たかさ)。あしは ぶらぶら */
const SEAT_Y = BENCH_TOP + seatHeight('child', KID_H)
/** ひも の 先(スタンドの かさ の ふちから さがる) */
const CORD: readonly [number, number] = [56.2, 68.4]

type Pt = readonly [number, number]

/** やねの たかさ(x の ところ)。まんなかが いちばん たかい */
const roofTop = (x: number) => 15.5 + Math.abs(x - 54) * 0.2857

/** やねに あたって はねる あめ(ぽつぽつ の おと) */
function RoofSplash({ t, amount }: { readonly t: number; readonly amount: number }) {
  if (amount <= 0) return null
  return (
    <g fill="none" stroke="#ffffff" strokeWidth="0.7" strokeLinecap="round" opacity={amount}>
      {[26, 40, 68, 82].map((x, k) => {
        const phase = (t * 1.5 + k * 0.31) % 1
        if (phase > 0.22) return null
        const u = phase / 0.22
        const y = roofTop(x) + 0.6
        return <path key={x} d={`M${x - 1 - u * 2.2} ${y} q${1 + u * 2.2} ${-2.6 - u * 1.4} ${2 + u * 4.4} 0`} opacity={1 - u} />
      })}
    </g>
  )
}

/** かべの たな・かざり・うえきばち */
function ShelfThings({ t, lit }: { readonly t: number; readonly lit: number }) {
  const sway = wave(t, 2.6) * 1.6
  const bulbs: readonly Pt[] = [[46.2, 48.8], [40.7, 55.2], [39.2, 60], [47.2, 58.7], [55.5, 56.7], [63.7, 54.8]]
  const bulbColors = ['#ff9d9d', '#ffd24a', '#9edb6a', '#7cc4f2', '#ff9d9d', '#ffd24a']
  return (
    <>
      <path d="M38 40 v5 l-4 -5 Z M70 40 v5 l4 -5 Z" fill={WOOD_DARK} />
      <Bone char={CHAR} n={4} color={WOOD_DARK} width={3.4} />
      <g>
        <path d="M33.4 38 h7.2 l-1 -7.6 h-5.2 Z" fill={POT} />
        <circle cx="35.6" cy="27.6" r="3.8" fill={LEAF_DARK} />
        <circle cx="39.2" cy="28.6" r="3.2" fill={LEAF} />
        <circle cx="37" cy="25" r="3" fill={LEAF} />
      </g>
      <Layer rotate={sway} origin={[49.8, 41]}>
        <Bone char={CHAR} n={5} color={WOOD_DEEP} width={1} />
        {bulbs.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.7" fill={bulbColors[i]} opacity={0.55 + 0.45 * lit} />
        ))}
      </Layer>
      <Layer rotate={-sway * 0.8} origin={[66, 40]}>
        <path d="M66 39.4 L66.1 46.9" stroke="#8f9cec" strokeWidth="1.5" strokeLinecap="round" />
        <Bone char={CHAR} n={6} color="#8f9cec" width={1.6} />
        <circle cx="77.2" cy="58.4" r="2.2" fill="#ffd24a" />
        <circle cx="77.2" cy="58.4" r="0.9" fill="#fff6c8" />
      </Layer>
    </>
  )
}

function Lamp({ lit, pull }: { readonly lit: number; readonly pull: number }) {
  const cordEnd = CORD[1] + pull * 1.8
  const shade = lit > 0.5 ? LAMP_SHADE_ON : LAMP_SHADE_OFF
  return (
    <>
      <ellipse cx="54" cy="93.4" rx="6.4" ry="1.7" fill={WOOD_DEEP} />
      <Bone char={CHAR} n={8} color={WOOD_DEEP} width={2.2} />
      <ellipse cx="54" cy="66.2" rx="2.4" ry="1.5" fill={lit > 0.5 ? BULB_ON : BULB_OFF} />
      <path d="M50.8 56.5 L57.2 56.5 L60.5 65.5 L47.5 65.5 Z" fill={shade} stroke={shade} strokeWidth="1.2" strokeLinejoin="round" />
      <path d={`M${CORD[0]} 65.6 L${CORD[0]} ${cordEnd}`} stroke={WOOD_DEEP} strokeWidth="0.6" />
      <circle cx={CORD[0]} cy={cordEnd + 0.6} r="0.9" fill={WOOD_DEEP} />
    </>
  )
}

/** あかりが ついたときの ひかり(スタンドの したへ ひろがる) */
function LampLight({ lit, t }: { readonly lit: number; readonly t: number }) {
  if (lit <= 0) return null
  const flicker = 1 + wave(t, 0.9) * 0.04
  return (
    <>
      <path d="M49 65.5 L59 65.5 L74 93.8 L34 93.8 Z" fill="#ffe9a0" opacity={0.34 * lit} />
      <circle cx="54" cy="66" r={16 * lit * flicker} fill="#fff3b0" opacity={0.3 * lit} />
    </>
  )
}

/** からだを ぶるぶる したときの みずしぶき */
function Droplets({ t, x }: { readonly t: number; readonly x: number }) {
  const show = during(t, ARRIVE, SIGH + 0.2, 0.1)
  if (show <= 0) return null
  const p = span(t, ARRIVE, SIGH + 0.2)
  return (
    <g fill={PALETTE.water} opacity={show}>
      {[-1, 1].flatMap((dir) =>
        [0, 1, 2].map((i) => {
          const q = (p * 2 + i * 0.33) % 1
          return <circle key={`${dir}-${i}`} cx={x + dir * (7 + q * 9)} cy={66 - i * 5 + q * 9 - Math.sin(q * Math.PI) * 6} r={1.1 * (1 - q * 0.5)} opacity={1 - q} />
        }),
      )}
    </g>
  )
}

/** 子の かっこう: ぬれて あるく → ぶるぶる → ぴょん と ベンチへ → ひもを ひく → ばんざい */
function kidAt(t: number): PersonProps {
  const w = walk(t, { from: -18, to: STAND_X, start: WALK, end: ARRIVE, build: 'child', height: KID_H, armSwing: 10 })
  const hopP = span(t, HOP, HOP + 0.6)
  const sitK = easeOut(span(t, HOP + 0.2, HOP + 0.6))
  const happy = t >= LIGHT
  const x = t < ARRIVE ? w.x : STAND_X + (SEAT_X - STAND_X) * easeInOut(hopP)
  const y = FLOOR + (SEAT_Y - FLOOR) * easeInOut(hopP)
  const shake = during(t, ARRIVE, SIGH, 0.08) * wave(t - ARRIVE, 0.14) * 7

  // うで: さむくて だきかかえる → だらんと下げる → ひざ → ひも → ばんざい → ひざ
  const sit = posture('sitChair', 'right')
  const hug: Limb = { swing: 35, bend: 110 }
  const cord: Limb = { to: [CORD[0], CORD[1] + Math.sin(span(t, PULL, LIGHT + 0.15) * Math.PI) * 1.8] }
  const cheer: Limb = { swing: 165, bend: 12 }
  let near: Limb = mixLimb(hug, HANG_ARM, span(t, SIGH, SIGH + 0.4, easeInOut))
  near = mixLimb(near, sit.leftArm ?? HANG_ARM, span(t, HOP + 0.3, HOP + 0.6))
  near = mixLimb(near, cord, span(t, REACH, REACH + 0.55, easeInOut))
  near = mixLimb(near, cheer, span(t, LIGHT + 0.15, LIGHT + 0.55, easeInOut))
  near = mixLimb(near, sit.leftArm ?? HANG_ARM, span(t, 6.2, 6.6, easeInOut))
  let far: Limb = mixLimb(hug, HANG_ARM, span(t, SIGH, SIGH + 0.4, easeInOut))
  far = mixLimb(far, sit.rightArm ?? HANG_ARM, span(t, HOP + 0.3, HOP + 0.6))
  far = mixLimb(far, { swing: 150, bend: 20 }, span(t, LIGHT + 0.15, LIGHT + 0.55, easeInOut))
  far = mixLimb(far, sit.rightArm ?? HANG_ARM, span(t, 6.2, 6.6, easeInOut))

  const stand = t < ARRIVE ? w.pose : {}
  const body = mixPose(stand, sit, sitK)
  // ひもを ひく ときは まえへ かがむ。ふるえている あいだは 少し ちぢこまる
  const torso = 7 * (1 - span(t, SIGH, HOP)) + 10 * (span(t, REACH, REACH + 0.5) - span(t, LIGHT + 0.1, LIGHT + 0.5))
  // あしは ベンチから ぶらぶら(うれしいと おおきく)
  const kick = sitK * (happy ? 18 : 6)
  const dangle = (swing: number, phase: number): Limb => ({ swing, bend: 90 + wave(t + phase, 0.8) * kick })
  const legs = sitK >= 1 ? { leftLeg: dangle(88, 0), rightLeg: dangle(92, 0.4) } : {}
  const face = t < SIGH ? 'worried' : happy ? 'joy' : 'smile'
  return {
    build: 'child',
    height: KID_H,
    look: COAT_LOOK,
    facing: 'right',
    x,
    y,
    lift: Math.sin(hopP * Math.PI) * 7,
    lean: shake,
    pose: { ...body, leftArm: near, rightArm: far, ...legs, torso: torso + (body.torso ?? 0), head: t < SIGH ? 9 : t >= REACH && t < LIGHT + 0.1 ? -6 : 0 },
    face,
  }
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 9)

  // できあがり: ゆか → かべ → ベンチ → あかり → やね の じゅんに できる
  const floor = span(t, 0.1, 0.5, backOut)
  const wall = span(t, 0.25, 0.75, backOut)
  const bench = span(t, 0.55, 0.95, backOut)
  const things = span(t, 0.8, 1.2, backOut)
  const roofP = span(t, 0.5, 1.15, backOut)
  const rain = span(t, 0.2, 1.4)
  const lit = span(t, LIGHT, LIGHT + 0.25)
  const kid = kidAt(t)
  const head = personRig(kid).world.head
  const wallColor = lit > 0 ? WALL_WARM : WALL_DIM

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={null} overcast={rain} tufts={[]} />
        <Rain t={t} amount={rain} ground={FLOOR + 3} />

        {/* へやの なか: かべ・ゆか・ベンチ */}
        <Layer scaleY={wall} origin={[54, FLOOR]}>
          <rect x="18" y="27" width="72" height="68" fill={WALL_DIM} />
          <rect x="18" y="27" width="72" height="68" fill={wallColor} opacity={lit} />
          <rect x="89.6" y="27" width="3.4" height="68" fill={WOOD_DARK} />
        </Layer>
        <Layer opacity={things} scale={0.6 + 0.4 * things} origin={[54, 40]}>
          <ShelfThings t={t} lit={lit} />
        </Layer>
        <Layer scaleX={floor} origin={[54, 95]}>
          <Bone char={CHAR} n={9} color={WOOD} width={3.8} />
        </Layer>
        <LampLight lit={lit} t={t} />
        <Layer scaleY={bench} origin={[54, FLOOR]}>
          <rect x="32.6" y="78" width="3" height="16" fill={WOOD_DARK} />
          <rect x="72.4" y="78" width="3" height="16" fill={WOOD_DARK} />
          <Bone char={CHAR} n={7} color={WOOD} width={4.6} />
        </Layer>
        <Layer scaleY={things} origin={[54, FLOOR]}>
          <Lamp lit={lit} pull={Math.sin(span(t, PULL, LIGHT + 0.15) * Math.PI)} />
        </Layer>

        {/* 子 */}
        {t >= WALK && (
          <>
            <Person {...kid} />
            <Droplets t={t} x={kid.x} />
            <Sigh x={head[0] + 5} y={head[1] + 4} p={span(t, SIGH, HOP + 0.2, easeOut)} show={during(t, SIGH, HOP + 0.2, 0.2)} dir={1} />
          </>
        )}

        {/* やね(ひさし と えんとつ)は いちばん うえ から ぽん と のる */}
        <Layer y={-(1 - roofP) * 30} opacity={Math.min(1, roofP * 3)}>
          <Bone char={CHAR} n={1} color={BRICK} width={6.4} />
          <rect x="49" y="7.6" width="8.6" height="2.8" rx="1.2" fill={BRICK_DARK} />
          <path d="M12 29 L54 17 L96 29 Z" fill={ROOF} stroke={ROOF} strokeWidth="3" strokeLinejoin="round" />
          <Bone char={CHAR} n={3} color={BRICK_DARK} width={3.6} />
          <Bone char={CHAR} n={2} color={WOOD_DARK} width={4.2} />
        </Layer>
        <RoofSplash t={t} amount={rain * roofP} />
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
    { at: 0, label: 'あめが ふり、へやと やねが できる', sound: 'pop' },
    { at: WALK, label: 'ぬれた子が ふるえながら あるいてくる' },
    { at: ARRIVE, label: 'やねの したに はいって ぶるぶる', sound: 'pop' },
    { at: HOP, label: 'ほっと して ベンチに すわる' },
    { at: PULL, label: 'ひもを ひくと、あかりが つく', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '室 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
