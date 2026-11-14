/*
 * 岩(いわ): 山に ごろんと 大きな 石が ある。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … 山の まんなかの 大きな みね
 *   2画目(𠃍)  … 左の みね と、山の ふもとの たいらな ところ
 *   3画目(丨)  … 右の みね
 *   4画目(一)  … がけの てっぺん(つき出た たいらな ところ)
 *   5画目(ノ)  … がけの 左の ななめの ふち(つき出た がけの 下は へこんで いる)
 *   6〜8画目   … ごろんと おちて とまった 大きな いわ(口の かたち)
 *               (6画目は いわの 左はし、7・8画目は いわの まわりと そこ)
 *
 * ながれ
 *   山が そびえる → つかれた子が あるいてくる(あせ)
 *   → 山が ゴゴゴと ゆれて、小石が ぱらぱら。山の はだに うまっていた いわが ゆれる
 *   → いわが ころがって がけを おち、ごろん! と 子の よこに とまる(子は びっくり)
 *   → 大きな いわを 見て ほっと して、子は うれしくて とびはねる
 *   → ほね が ひかって、絵が うすくなり、字「岩」が のこる
 *
 * 子は Person(あるきは walk、うでを 上げる ときは mixLimb、せおうのは pack)。山は Mountain。
 * いわ・がけ は 場面で 描く(ほんものの つくり を守る・字の形に合わせるために ゆがめない):
 *   いわは とおくに ある ときは 小さく、ちかづく(ころげおちて くる)と 大きく 見える。
 *   いわは かどの まるい かたまりで、おちると 地面に ついた とき つぶれて はずむ。
 */
import { backOut, during, easeIn, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Dust, HANG_ARM, LOOKS, Meadow, Mountain, mixLimb, Person, personRig, Sweat, walk, type MountainShape, type PersonProps } from '../sceneFigures'

const CHAR = '岩'

const CLIFF = '#c0a082'
const CLIFF_TOP = '#d6bb9b'
const CLIFF_CRACK = '#a8876a'
const FOOT = '#b6d89c'
const ROCK = '#8e98a4'
const ROCK_DARK = '#737d89'
const ROCK_LIGHT = '#b4bdc7'
const MOSS = '#6fbf73'

/** くぎり の時間(秒) */
const WALK = 0.7
const STAND = 2.3
/** 山が ゆれはじめる / いわが うごきだす / ごろんと 地面に つく */
const RUMBLE = 2.7
const FALL = 3.3
const SLIDE_END = 3.9
const LAND = 4.6
/** 子が びっくり する / ほっと する / うれしくて とびはねる */
const STARTLE = LAND
const RELIEF = 5.4
const CHEER = 6.25
const INK = 7.0
const DONE = 10.5
const DURATION = 11

/** 地面の たかさ(子の 足もと) */
const GROUND = 95.5
/** いわが とまる 場所(まんなか)。7・8画目の 口の かたち の まんなか */
const ROCK_REST: readonly [number, number] = [62, 79.5]
/** いわの はんぶんの たかさ(はば の半分は 21) */
const ROCK_H = 12.5
/** ふもとで うまっている いわの 場所(山の はだ)と、がけの てっぺんに つく 場所 */
const ROCK_EMBED: readonly [number, number] = [66, 36]
const ROCK_LEDGE: readonly [number, number] = [72, 44]

/* ───────── 山・がけ ───────── */

/** 3つの みね。まんなかが いちばん 高い。みね の 中心が、1・2・3画目の 縦線の 場所 */
const PEAK_LEFT: MountainShape = { top: [30, 19], foot: 56, half: 26 }
const PEAK_RIGHT: MountainShape = { top: [85, 17], foot: 56, half: 24 }
const PEAK_MAIN: MountainShape = { top: [55, 10], foot: 56, half: 33 }

function Peaks({ t }: SceneProps) {
  const rise = span(t, 0, 0.9, easeOut)
  const shake = wave(t, 0.09) * 0.8 * during(t, RUMBLE, FALL + 0.3, 0.15)
  return (
    <>
      <Mountain shape={PEAK_LEFT} rise={rise} shake={shake} far />
      <Mountain shape={PEAK_RIGHT} rise={rise} shake={shake} far />
      <Mountain shape={PEAK_MAIN} rise={rise} shake={shake} snow={22} />
    </>
  )
}

/** がけ。てっぺん(4画目)が つき出ていて、左は ななめに へこむ(5画目)。 */
function Cliff({ t }: SceneProps) {
  const grow = span(t, 0.35, 1.0, backOut)
  return (
    <>
      <path d="M-2 63 Q28 52 55 58 Q84 50 111 61 V99 H-2 Z" fill={FOOT} opacity={span(t, 0, 0.3)} />
      <Layer scaleY={grow} origin={[55, 97]}>
        <path d="M17 52 L94 50.5 L95 97 L11 97 L14 93.3 L41 58 L17 58.5 Z" fill={CLIFF} stroke={CLIFF} strokeWidth="3" strokeLinejoin="round" />
        <path d="M17 52 L94 50.5 L94 54 L17 55.5 Z" fill={CLIFF_TOP} />
        <path d="M62 60 l3 4 M88 62 l-3 5 M75 87 l3 4" stroke={CLIFF_CRACK} strokeWidth="1.1" strokeLinecap="round" fill="none" />
      </Layer>
    </>
  )
}

function Foreground() {
  return <Meadow y={98.4} tufts={[6, 46, 80, 102]} />
}

/* ───────── いわ ───────── */

/** いわ の ほんたい(まんなか が 0,0)。かどは まるく、そこは たいら。 */
function RockShape() {
  return (
    <>
      <path d="M-21 6 C-22 -4 -14 -12.5 -2 -12.5 C10 -13 21 -8 21 3 C21 10 17 12.5 8 12.5 L-12 12.5 C-18 12.5 -21 10 -21 6 Z" fill={ROCK_DARK} />
      <path d="M-20 4 C-20.4 -4 -13.5 -11.4 -2 -11.4 C9 -11.8 19.6 -7.4 20 1 C14 4.4 4 5.6 -6 5.2 C-12 5 -17 4.6 -20 4 Z" fill={ROCK} />
      <ellipse cx="-9" cy="-7" rx="6" ry="2.6" fill={ROCK_LIGHT} transform="rotate(-14 -9 -7)" />
      <path d="M4 -12 q2 -3.2 4.6 -1.2 q2.6 -2 4 0.6 q-4 1.4 -8.6 0.6 Z" fill={MOSS} />
    </>
  )
}

type RockPose = { readonly x: number; readonly y: number; readonly scale: number; readonly spin: number; readonly squash: number; readonly rock: number }

/** いわ の いま の ようす。うまっている → ころがる → おちる → ごろん と ゆれて とまる */
function rockPose(t: number): RockPose {
  if (t < FALL) {
    const shake = wave(t, 0.1) * 6 * during(t, RUMBLE, FALL, 0.2)
    return { x: ROCK_EMBED[0], y: ROCK_EMBED[1], scale: 0.45, spin: shake, squash: 0, rock: 0 }
  }
  if (t < SLIDE_END) {
    const p = span(t, FALL, SLIDE_END, easeIn)
    return { x: ROCK_EMBED[0] + (ROCK_LEDGE[0] - ROCK_EMBED[0]) * p, y: ROCK_EMBED[1] + (ROCK_LEDGE[1] - ROCK_EMBED[1]) * p, scale: 0.45 + 0.15 * p, spin: 170 * p, squash: 0, rock: 0 }
  }
  if (t < LAND) {
    const q = span(t, SLIDE_END, LAND)
    return { x: ROCK_LEDGE[0] + (ROCK_REST[0] - ROCK_LEDGE[0]) * q, y: ROCK_LEDGE[1] + (ROCK_REST[1] - ROCK_LEDGE[1]) * q * q, scale: 0.6 + 0.4 * q, spin: 170 + 190 * q, squash: 0, rock: 0 }
  }
  // ついた しゅんかん つぶれて、ぽん と はずみ、ごろん ごろん と ゆれて とまる
  const squash = Math.sin(span(t, LAND, LAND + 0.2) * Math.PI)
  const hop = Math.sin(span(t, LAND + 0.15, LAND + 0.5) * Math.PI) * 4
  const since = Math.max(0, t - (LAND + 0.5))
  const rock = 5 * Math.exp(-since * 3) * Math.sin(since * 14)
  return { x: ROCK_REST[0], y: ROCK_REST[1] - hop, scale: 1, spin: 360, squash, rock }
}

function Rock({ t }: SceneProps) {
  const show = span(t, 0.6, 0.9)
  const pose = rockPose(t)
  return (
    <Layer opacity={show} x={pose.x} y={pose.y} scale={pose.scale} rotate={pose.spin} origin={[0, 0]}>
      <Layer rotate={pose.rock} scaleX={1 + 0.12 * pose.squash} scaleY={1 - 0.15 * pose.squash} origin={[0, ROCK_H - 0.5]}>
        <RockShape />
      </Layer>
    </Layer>
  )
}

/** 山が ゆれたとき ぱらぱら おちる 小石 */
function Pebbles({ t }: SceneProps) {
  const start = RUMBLE + 0.1
  return (
    <>
      {[
        [47, 24, 0],
        [75, 22, 0.25],
        [58, 17, 0.45],
      ].map(([x, y, delay]) => {
        const p = span(t, start + delay, start + delay + 0.7)
        if (p <= 0 || p >= 1) return null
        return <circle key={x} cx={x} cy={y + p * p * 26} r="1.5" fill={ROCK_DARK} opacity={1 - p * p} />
      })}
    </>
  )
}

/* ───────── 子(しゅやく) ───────── */

const KID_HEIGHT = 42
const KID_LOOK = { ...LOOKS.boy, top: '#e8654a', bottom: '#3e5c86' } as const
const ARMS_UP = { swing: 125, bend: 25 }

/** 子の いま の ようす(場所・あし・うで・かお)を t から 決めて 描く */
function KidScene({ t }: SceneProps) {
  // 場所: 左から あるいてくる → びっくり して たちどまる → いわに ちかづく
  const plan = { build: 'child', height: KID_HEIGHT, armSwing: 14 } as const
  const w = t < RELIEF ? walk(t, { ...plan, from: -24, to: 24, start: WALK, end: STAND }) : walk(t, { ...plan, from: 24, to: 29, start: RELIEF, end: RELIEF + 0.7 })
  // はね: びっくり(1回)と、うれしくて(なんども)
  const startleHop = Math.sin(span(t, STARTLE, STARTLE + 0.45) * Math.PI) * 4
  const cheerHop = t >= CHEER ? Math.abs(Math.sin(((t - CHEER) / 0.35) * Math.PI)) * 4 : 0
  // うで: びっくり と よろこび で 上へ あげる
  const armsUp = Math.max(span(t, STARTLE, STARTLE + 0.25, backOut) * (1 - span(t, RELIEF - 0.1, RELIEF + 0.2)), span(t, CHEER, CHEER + 0.25, backOut))
  // あたま: つかれて 下を むく → 山を 見あげる → いわを 見て もどる
  const tilt = t < STARTLE ? mix(t, STAND, STAND + 0.4, 5, -12) : t < RELIEF ? mix(t, STARTLE, STARTLE + 0.25, -12, -5) : mix(t, RELIEF, RELIEF + 0.4, -5, 0)
  const props: PersonProps = {
    ...w,
    y: GROUND + 0.5,
    look: KID_LOOK,
    pack: { kind: 'rucksack', color: '#f0a53c' },
    face: t < RUMBLE ? 'worried' : t < RELIEF ? 'surprised' : 'joy',
    lift: startleHop + cheerHop,
    pose: { ...w.pose, leftArm: mixLimb(w.pose.leftArm ?? HANG_ARM, ARMS_UP, armsUp), rightArm: mixLimb(w.pose.rightArm ?? HANG_ARM, ARMS_UP, armsUp), head: tilt },
  }
  const head = personRig(props).world.head
  return (
    <>
      <Person {...props} />
      <Sweat t={t} x={head[0] - 5} y={head[1] - 2} show={during(t, WALK + 0.2, RUMBLE, 0.2)} />
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)
  // ごろんと ついた しゅんかん、地面が すこし ゆれる
  const thud = Math.sin(span(t, LAND, LAND + 0.3) * Math.PI * 2) * 0.7
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture} y={thud}>
        <Backdrop t={t} clouds={[[88, 6, 0.8]]} tufts={[]} />
        <Peaks t={t} />
        <Cliff t={t} />
        <Pebbles t={t} />
        <Rock t={t} />
        <Foreground />
        <Dust x={ROCK_REST[0]} y={94} p={span(t, LAND, LAND + 0.8, easeOut)} reach={26} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <KidScene t={t} />
        </Layer>
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
    { at: 0, label: '山が そびえる', sound: 'pop' },
    { at: WALK, label: 'つかれた子が あるいてくる' },
    { at: RUMBLE, label: '山が ゆれて、いわが うごきだす', sound: 'pop' },
    { at: LAND - 0.3, label: 'いわが ころげおちて、ごろん!' },
    { at: RELIEF, label: '子は ほっと して、うれしくて とびはねる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '岩 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
