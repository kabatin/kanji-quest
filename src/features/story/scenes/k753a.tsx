/*
 * 町(まち): たんぼの あいだの みち。右は 音の しるし(丁)。(共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)
 *   1〜5画目(田) … たんぼ。まわりの あぜ(1・2・5画目)と、まんなかの あぜ道(3・4画目)。
 *                   あぜ道で 4つの 田んぼに わかれる
 *   6画目(一)   … みちしるべの 木の ふだ(町の ほうこうを しめす 板)
 *   7画目(丨)   … みちしるべの 木の はしら(した は じめんに うまり、足もとに 土を もる)
 *
 * ながれ
 *   たんぼが 見え、みちしるべが たつ → 麦わらぼうしの 子が みちを あるいてくる
 *   → たんぼの よこで、どっちへ いくのか わからず きょろきょろ(あせ・こまった顔)
 *   → みちしるべの ふだに 家の えが ひかる! 「あっ」と 見つける
 *   → かけだして、みちしるべの ところへ。町の 家々が 見えてきて、ばんざい(うれしい顔)
 *   → ほね が ひかって、絵が うすくなり、字「町」が のこる
 *
 * 子は Person(麦わらぼうし)。あるきは walk()、かけるのは run()、きょろきょろは turnAround()。
 * みちしるべ は 田んぼの よこ に 立つ ふつうの 木の ふだ。町の 絵は ふだ の 上に のせた 家の しるし。
 */
import { backOut, during, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, HANG_ARM, House, LOOKS, mixLimb, Notice, Person, personRig, run, Sweat, turnAround, walk, type Limb } from '../sceneFigures'

const CHAR = '町'

const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const RIDGE = '#9ccf6f'
const RIDGE_DARK = '#7fb457'
const MUD = '#7fb457'
const WATER = '#9fd8dc'
const WATER_LIGHT = '#c6ebfa'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const ROAD = '#ecd3a4'
const GRASS = '#c5e8a9'
const BOARD = '#e3b878'
const BOARD_DARK = '#c08f55'
const ROOF = '#e8534a'
const WALL = '#fff4d6'

/** くぎり の時間(秒) */
const SIGN_AT = 0.3
const ENTER = 0.7
/** たんぼの よこで 立ちどまる */
const STOP = 2.8
/** みちしるべの 家の しるしに 気づく */
const SPOT = 4.3
/** かけだす・ついて ばんざい */
const RUN = 4.8
const ARRIVE = 6.2
const INK = 6.9
const DONE = 9.7
const DURATION = 10.2

/** 子の いる みちの 高さ(足もと)・背の高さ */
const ROAD_Y = 95
const KID_HEIGHT = 42
/** 立ちどまる ばしょ と、みちしるべの よこ */
const STOP_X = 22
const SIGN_X = 53
const KID_LOOK = { ...LOOKS.boy, hat: 'straw' } as const

/* ───────── じめん ───────── */

/** みち: 土の いろ(Backdrop の のはら の 上に) */
function Road() {
  return (
    <>
      <path d="M-4 91.5 Q54 89 113 91.5 V99.5 H-4 Z" fill={ROAD} />
      <path d="M-4 91.5 Q54 89 113 91.5" fill="none" stroke={GRASS} strokeWidth="1.6" />
      {[6, 40, 90, 104].map((x) => (
        <path key={x} d={`M${x} 90 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/* ───────── たんぼ(田) ───────── */

/** 4つの 田んぼの みず面(あぜ道で 左右・上下に わかれる) */
const PADDIES: readonly (readonly [x: number, y: number, w: number, h: number])[] = [
  [12.6, 31.6, 13, 18],
  [27.2, 31.6, 12.6, 18],
  [12.6, 51.4, 13, 19],
  [27.2, 51.4, 12.6, 19],
]

/** 稲の なえ。みずの 中から 3本 のびて、風で ゆれる */
function Sprouts({ x, y, w, h, grow, sway, seed }: { readonly x: number; readonly y: number; readonly w: number; readonly h: number; readonly grow: number; readonly sway: number; readonly seed: number }) {
  return (
    <>
      {[0.18, 0.5, 0.82, 0.34, 0.66].map((fx, i) => {
        const bx = x + w * fx
        const by = y + h * (i < 3 ? 0.5 + ((i + seed) % 2) * 0.06 : 0.86)
        const lean = sway * 1.2 + (i % 3 - 1) * 0.6
        const top = by - 5.2 * grow
        return (
          <path key={i} d={`M${bx - 1} ${by} Q${bx + lean * 0.5} ${by - 3 * grow} ${bx + lean} ${top} Q${bx + lean * 0.5 + 0.8} ${by - 2.5 * grow} ${bx + 1} ${by} Z`} fill={i % 2 === 0 ? LEAF : LEAF_DARK} />
        )
      })}
    </>
  )
}

function Paddy({ t }: SceneProps) {
  const fill = span(t, 0, 0.6, easeOut)
  const grow = span(t, 0.3, 1.3, backOut)
  const sway = wave(t, 2.4)
  return (
    <Layer opacity={fill}>
      {/* どろ の下地 */}
      <rect x="11.4" y="30.4" width="29.6" height="41.4" rx="2" fill={MUD} />
      {PADDIES.map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} rx="1.6" fill={WATER} />
          {/* みずの ひかり */}
          <path d={`M${x + 1.4} ${y + 2.4} h${w * 0.4}`} stroke={WATER_LIGHT} strokeWidth="1" strokeLinecap="round" />
          <Sprouts x={x} y={y} w={w} h={h} grow={grow} sway={sway} seed={i} />
        </g>
      ))}
      {/* あぜ: 田の 画の線 そのもの(まわり と あぜ道) */}
      {[1, 2, 3, 4, 5].map((n) => (
        <Bone key={`d${n}`} char={CHAR} n={n} color={RIDGE_DARK} width={3.8} />
      ))}
      {[1, 2, 3, 4, 5].map((n) => (
        <Bone key={n} char={CHAR} n={n} color={RIDGE} width={2.8} />
      ))}
    </Layer>
  )
}

/* ───────── みちしるべ(丁) ───────── */

function Sign({ t }: SceneProps) {
  const grow = span(t, SIGN_AT, SIGN_AT + 0.7, backOut)
  // 見つける しゅんかん、家の しるしが ぴかっと ひかる
  const flash = during(t, SPOT - 0.5, SPOT + 1.0, 0.25)
  const bounce = Math.sin(span(t, SPOT - 0.3, SPOT + 0.2) * Math.PI) * 0.14 + Math.sin(span(t, ARRIVE, ARRIVE + 0.5) * Math.PI) * 0.1
  return (
    <>
      <ellipse cx="71" cy="95.4" rx={11 * grow} ry="3" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.6 + 0.4 * grow} scaleY={grow} origin={[73.5, 96]}>
        {/* はしら(7画目)。足もとの まがりは、土から ぬけない ための そえぎ */}
        <Bone char={CHAR} n={7} color={BARK_DARK} width={5.6} />
        <Bone char={CHAR} n={7} color={BARK} width={4.2} />
        <ellipse cx="71" cy="95" rx="7.4" ry="2.4" fill="#cfa070" />
        {/* ふだ(6画目) */}
        <g transform="translate(0 1.1)">
          <Bone char={CHAR} n={6} color={BOARD_DARK} width={10} />
        </g>
        <Bone char={CHAR} n={6} color={BOARD} width={9.2} />
        {/* 家の しるし */}
        <Layer scale={1 + bounce + flash * 0.1} origin={[73.5, 25]}>
          <path d="M69.6 24.2 L73.5 20.6 L77.4 24.2 Z" fill={ROOF} />
          <rect x="70.6" y="24" width="5.8" height="4" rx="0.6" fill={WALL} />
          <rect x="72.7" y="25.4" width="1.6" height="2.6" rx="0.4" fill={BARK} />
        </Layer>
      </Layer>
      {/* ひかり */}
      <Star cx={80.5} cy={21} r={4.2 * flash} color="#ffd24a" spin={t * 120} />
      <Star cx={66.5} cy={17.6} r={2.6 * flash} color="#ffffff" spin={-t * 120} />
    </>
  )
}

/** 町の 家々。みちしるべに ついた ころ、右の ほうに ぽん と 見えてくる */
function Town({ t }: SceneProps) {
  const pop = span(t, RUN + 0.9, ARRIVE + 0.2)
  return (
    <>
      <House x={88} y={93} width={14} grow={pop} wall={WALL} roof={ROOF} light={pop} />
      <House x={102} y={93} width={11} grow={pop} wall="#ffe3b3" roof="#4f9be0" light={pop} />
    </>
  )
}

/* ───────── 子(主役) ───────── */

/** うで を 場面ごとの かっこうから まぜる(おろおろ → 指さし → かける → ばんざい) */
function armOf(t: number, base: Limb, near: boolean): Limb {
  const lost = span(t, STOP, STOP + 0.3) * (1 - span(t, SPOT - 0.1, SPOT + 0.15))
  const point = near ? span(t, SPOT, SPOT + 0.3) * (1 - span(t, RUN - 0.05, RUN + 0.2)) : 0
  const cheer = span(t, ARRIVE - 0.1, ARRIVE + 0.3) * (1 - span(t, INK - 0.1, INK))
  const side = near ? 0 : 0.5
  const shrug = wave(t, 1.2, side) * 6
  const lostArm = mixLimb(base, { swing: 28 + shrug, bend: 66 }, lost)
  const pointArm = mixLimb(lostArm, { swing: 92, bend: 6 }, point)
  return mixLimb(pointArm, { swing: 158 + wave(t, 0.5, side / 2) * 8, bend: near ? 22 : 48 }, cheer)
}

function KidWithMarks({ t }: SceneProps) {
  // あるく(たんぼの よこ まで) → 立ちどまる → かけだす → ついて ばんざい
  const walking = walk(t, { from: -14, to: STOP_X, start: ENTER, end: STOP, build: 'child', height: KID_HEIGHT })
  const running = run(t, { from: STOP_X, to: SIGN_X, start: RUN, end: ARRIVE - 0.2, build: 'child', height: KID_HEIGHT, stride: 24 })
  const go = t < RUN ? walking : running
  // きょろきょろ: 立ちどまって いる間、左を 見て 右へ もどる
  const turn = t < 3.8 ? turnAround(t, 3.1, 'right', 'left') : turnAround(t, 3.8, 'left', 'right')
  // ばんざい の ジャンプ(さいごは かならず 地面に もどる)
  const hop = Math.abs(Math.sin(span(t, ARRIVE, INK - 0.15) * Math.PI * 3)) * 4.5
  const near = turn.facing === 'right' ? 'leftArm' : 'rightArm'
  const far = near === 'leftArm' ? 'rightArm' : 'leftArm'
  const pose = { ...go.pose, [near]: armOf(t, go.pose[near] ?? HANG_ARM, true), [far]: armOf(t, go.pose[far] ?? HANG_ARM, false) }
  const lift = (t < RUN ? 0 : running.lift) + hop
  const face = t < ENTER + 0.5 ? 'normal' : t < SPOT ? 'worried' : t < RUN + 0.3 ? 'surprised' : 'joy'
  const place = { ...go, ...turn, y: ROAD_Y, pose, lift }
  const rig = personRig(place)
  const head = rig.world.head
  const headR = rig.body.headR * rig.scale
  return (
    <>
      <Person {...place} look={KID_LOOK} face={face} />
      <Sweat t={t} x={head[0] - 4} y={head[1] - 2} show={during(t, ENTER + 0.5, SPOT, 0.2)} />
      <Notice x={head[0]} y={head[1]} r={headR} show={during(t, SPOT, RUN + 0.3, 0.12)} dir={1} />
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[103, 12]} tufts={[]} clouds={[[16, 8, 0.8]]} />
        <Road />
        <Paddy t={t} />
        <Town t={t} />
        <Sign t={t} />
        <Layer opacity={span(t, ENTER - 0.1, ENTER + 0.15)}>
          <KidWithMarks t={t} />
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
    { at: 0, label: 'たんぼが 見える。みちしるべが たつ', sound: 'pop' },
    { at: ENTER, label: '麦わらぼうしの 子が あるいてくる' },
    { at: STOP, label: 'どっちへ いくのか わからず きょろきょろ' },
    { at: SPOT, label: 'ふだに 家の しるし! 「あっ」', sound: 'pop' },
    { at: RUN, label: 'かけだす。町の 家が 見えてくる' },
    { at: ARRIVE, label: 'ついた! ばんざい', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '町 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
