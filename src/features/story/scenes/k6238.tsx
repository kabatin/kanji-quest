/*
 * 戸(と): かたほうだけ ひらく とびら。大きな門の とびらを、子どもが ぐっと おして あける。
 *
 * ほね(画と絵の対応)
 *   1画目(一)   … 門の うえに わたした 木の はり(かもい)
 *   2画目(𠃍)   … とびらの うえの わく と、右の ちょうつがい(まど の ふち)
 *   3画目(一)   … とびらの まんなかの よこぎ(まど の した)
 *   4画目(ノ)   … ひらいた とびらの 左はし(あけた ほう の ふち)。さいごに 左下へ ななめに おちる
 *
 * ながれ
 *   門が たつ → 子どもが あるいてくる。上を ちょうちょが とんでいる
 *   → ちょうちょが 門の むこうへ きえて、子どもは がっかり
 *   → 「よし」と とびらを ぐっと おす → とびらが かたほうだけ ぱたんと ひらく
 *   → 中は おひさまの にわ。ちょうちょが いた! 子どもは とびはねて よろこぶ
 *   → ほね が ひかって、絵が うすくなり、字「戸」が のこる
 *
 * 子どもは Person(あるきは walk、おす手は { to })、ちょうちょは Butterfly、にわの 木と 花は Tree・Flower、
 * 空は Backdrop。とびら(右の ちょうつがい を じく に ひらく)・門・かべ は 部品に ないので ここで 描く。
 *   門には 左にも とびらが あって、そちらは しまったまま(かたほうだけ ひらく)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, Butterfly, Flower, mixLimb, PALETTE, Person, personRig, Sweat, Tree, Tuft, walk, type Limb } from '../sceneFigures'

const CHAR = '戸'

const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const DOOR = '#c98a54'
const DOOR_LINE = '#a9703f'
const GLASS = '#bfe6fb'
const GLASS_LIGHT = '#eaf8ff'
const WALL = '#f2e3c6'
const WALL_SHADE = '#e0cba5'
const WALL_CAP = '#c9ae86'
const WING = '#c78bf0'
const WING_DARK = '#a46ad0'
const PERSON_LOOK = { top: '#f0866a', bottom: '#3e5c86' } as const

/** くぎり の時間(秒) */
const ENTER = 0.7
const ARRIVE = 2.0
/** ちょうちょ が 門の むこうへ きえる */
const GONE = 3.1
/** とびらを おしはじめる / てを はなす / ぜんぶ ひらく */
const PUSH = 3.7
const RELEASE = 4.7
const OPENED = 5.6
const INK = 6.6
const DONE = 9.8
const DURATION = 10.4

/** 地面(子どもの あしもと)の たかさ */
const GROUND_Y = 96

/* ───────── とびら ───────── */

type Point = readonly [number, number]
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const lerpPoint = (a: Point, b: Point, k: number): Point => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]

/** 右の ちょうつがい(うごかない) */
const HINGE_TOP: Point = [76, 33]
const HINGE_BOTTOM: Point = [76, GROUND_Y]
/** しまっているとき・ひらいたとき の、とびらの 左はし(あけた ほう の ふち) */
const FREE_TOP_CLOSED: Point = [3, 33]
const FREE_BOTTOM_CLOSED: Point = [3, GROUND_Y]
/** ひらいたとき: 4画目の ノ(33,37)→(15,95) に だいたい かさなる */
const FREE_TOP_OPEN: Point = [33, 37]
const FREE_BOTTOM_OPEN: Point = [15, 95]

/** とびらの 上の点。u = 左はし(0)から ちょうつがい(1) / v = 上(0)から 下(1)。open = 0(しまる)〜1(ひらく) */
function doorPoint(open: number, u: number, v: number): Point {
  const left = lerpPoint(lerpPoint(FREE_TOP_CLOSED, FREE_TOP_OPEN, open), lerpPoint(FREE_BOTTOM_CLOSED, FREE_BOTTOM_OPEN, open), v)
  const right = lerpPoint(HINGE_TOP, HINGE_BOTTOM, v)
  return lerpPoint(left, right, u)
}

const toPath = (points: readonly Point[]) => `M${points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L')} Z`
const quad = (open: number, u0: number, v0: number, u1: number, v1: number) => toPath([doorPoint(open, u0, v0), doorPoint(open, u1, v0), doorPoint(open, u1, v1), doorPoint(open, u0, v1)])
const line = (open: number, u0: number, v0: number, u1: number, v1: number) => {
  const a = doorPoint(open, u0, v0)
  const b = doorPoint(open, u1, v1)
  return `M${a[0].toFixed(2)} ${a[1].toFixed(2)} L${b[0].toFixed(2)} ${b[1].toFixed(2)}`
}

/** 大きな とびら。まどの わく が 字の 2・3画目、左はし が 4画目 になる */
function GateLeaf({ open }: { readonly open: number }) {
  const top = doorPoint(open, 0, 0)
  const topRight = doorPoint(open, 1, 0)
  const bottomRight = doorPoint(open, 1, 1)
  const bottom = doorPoint(open, 0, 1)
  const knob = doorPoint(open, 0.12, 0.62)
  return (
    <>
      <path d={toPath([top, topRight, bottomRight, bottom])} fill={DOOR} />
      {/* したの 板の すじ */}
      {[0.25, 0.5, 0.75].map((u) => (
        <path key={u} d={line(open, u, 0.42, u, 0.97)} stroke={DOOR_LINE} strokeWidth="0.9" strokeLinecap="round" fill="none" />
      ))}
      {/* まどの ガラス(うえの はこ) */}
      <path d={quad(open, 0.1, 0.08, 0.9, 0.34)} fill={GLASS} />
      <path d={quad(open, 0.18, 0.12, 0.34, 0.3)} fill={GLASS_LIGHT} opacity="0.8" />
      <path d={quad(open, 0.1, 0.08, 0.9, 0.34)} fill="none" stroke={BARK} strokeWidth="1.6" strokeLinejoin="round" />
      {/* まんなかの よこぎ */}
      <path d={line(open, 0.03, 0.375, 0.97, 0.375)} stroke={BARK} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* ふち */}
      <path d={line(open, 0, 0, 1, 0)} stroke={BARK} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d={line(open, 0, 1, 1, 1)} stroke={BARK_DARK} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d={line(open, 0, 0, 0, 1)} stroke={BARK_DARK} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      {/* とって */}
      <circle cx={knob[0]} cy={knob[1]} r="1.7" fill="#f2b632" stroke={BARK_DARK} strokeWidth="0.5" />
    </>
  )
}

/** かべ・門の はしら・はり。 */
function Wall() {
  return (
    <>
      <rect x="-2" y="9" width="113" height="90" fill={WALL} />
      <rect x="-2" y="9" width="113" height="3.4" fill={WALL_CAP} />
      <rect x="-2" y="90" width="113" height="9" fill={WALL_SHADE} />
      {/* はり(1画目)のした の かげ */}
      <g transform="translate(0 2.4)">
        <Bone char={CHAR} n={1} color={WALL_SHADE} width={4.6} />
      </g>
      <Bone char={CHAR} n={1} color={BARK} width={4.6} />
    </>
  )
}

/** 左の とびら(しまったまま)。すこしだけ 見える。 */
function LeftLeaf() {
  return (
    <>
      <rect x="-2" y="33" width="6" height="63" fill={DOOR} />
      <path d="M0.6 42 V94 M-1 42 V94" stroke={DOOR_LINE} strokeWidth="0.8" fill="none" />
      <rect x="-2" y="33" width="6" height="2" fill={BARK} />
      <rect x="3" y="33" width="1.6" height="63" fill={BARK_DARK} />
    </>
  )
}

/** あいた とびらの むこうの おひさまの にわ(のぞき見えるのは 左の すこし)。 */
function Garden({ t }: SceneProps) {
  return (
    <>
      <rect x="3" y="33" width="75" height="64" fill="#cdeefb" />
      <rect x="3" y="33" width="75" height="64" fill="#fff6c8" opacity="0.35" />
      <rect x="3" y="64" width="75" height="33" fill="#a8dc82" />
      <path d="M3 66 Q18 60 34 66 V70 H3 Z" fill="#8fcf72" />
      <Tree x={21} y={71} height={30} fruit />
      {[
        [8, 92, '#ff8fab'],
        [14, 95, PALETTE.sun],
        [19.5, 92.4, '#ff8fab'],
        [25, 96, '#ffffff'],
      ].map(([x, y, color]) => (
        <Flower key={String(x)} x={Number(x)} y={Number(y)} color={String(color)} size={0.7} sway={wave(t, 2.2, Number(x) * 0.1) * 5} />
      ))}
    </>
  )
}

/** 右の はしら(ちょうつがい のところ)と、とびらの うえの わく。 */
function FrameFront() {
  return (
    <>
      <rect x="76" y="27" width="6.4" height="71" rx="1.4" fill={BARK} />
      <rect x="1.6" y="27.5" width="80.8" height="5.6" rx="1.4" fill={BARK_DARK} />
      <circle cx="76.6" cy="40" r="1.2" fill="#f2b632" />
      <circle cx="76.6" cy="88" r="1.2" fill="#f2b632" />
    </>
  )
}

/** てまえの 地面。子どもは ここに たつ。 */
function FrontGround() {
  return (
    <>
      <rect x="-2" y="96" width="113" height="12" fill={PALETTE.grass} />
      {[6, 40, 66, 90, 106].map((x) => (
        <Tuft key={x} x={x} y={98} />
      ))}
    </>
  )
}

/** 門の上を とんで、むこうがわへ きえる(かべの うしろに かくれる) */
function ButterflyAbove({ t }: SceneProps) {
  const show = span(t, 0.4, 0.7) * (t < 3.95 ? 1 : 0)
  if (show <= 0) return null
  const x = mix(t, 0.5, 3.7, 6, 92, easeInOut)
  const y = 5 + 1.6 * wave(t, 0.8) + 9 * span(t, 3.4, 3.9)
  return (
    <Layer opacity={show}>
      <Butterfly t={t} x={x} y={y} color={WING} dark={WING_DARK} />
    </Layer>
  )
}

/* ───────── 子ども(主役) ───────── */

/** 子どもの 背の高さ、と とびらの前で とまる ところ(おしながら 少し すすむ) */
const KID_HEIGHT = 46
const STAND_AT = 12
const PUSH_TO = 16
/** よろこんで 上へ のばす うで */
const CHEER_ARM = { swing: 150, bend: 14 } as const

/** 子どもの 場所と かっこう。あるいてくる → とびらの ところで おす(足が すこし まえへ) */
function kidAt(t: number, open: number) {
  const came = walk(t, { from: -14, to: STAND_AT, start: ENTER, end: ARRIVE, build: 'child', height: KID_HEIGHT })
  const pushed = walk(t, { from: STAND_AT, to: PUSH_TO, start: PUSH, end: RELEASE, build: 'child', height: KID_HEIGHT, step: 3 })
  const walking = t < PUSH ? came : pushed
  const pushW = span(t, PUSH - 0.3, PUSH) * (1 - span(t, RELEASE, RELEASE + 0.35))
  const cheerW = span(t, RELEASE + 0.3, RELEASE + 0.7, easeOut)
  const hop = span(t, 5.2, 6.2)
  const lift = Math.abs(Math.sin(hop * Math.PI * 2)) * 6
  // 手: ふだんは だらんと おろす(あるくときは ふる)。おすときは とびらの 面。うれしいときは 上へ
  const door = doorPoint(open, 0.22, 0.52)
  const idleNear: Limb = walking.pose.leftArm ?? { swing: 4, bend: 8 }
  const idleFar: Limb = walking.pose.rightArm ?? { swing: 2, bend: 8 }
  const wiggle = wave(t, 0.4) * 8 * cheerW
  const leftArm = mixLimb(mixLimb(idleNear, { to: door }, pushW), { ...CHEER_ARM, swing: CHEER_ARM.swing + wiggle }, cheerW)
  const rightArm = mixLimb(mixLimb(idleFar, { to: [door[0] - 0.8, door[1] + 2.2] }, pushW), { ...CHEER_ARM, swing: CHEER_ARM.swing - wiggle }, cheerW)
  const face = t < GONE ? 'smile' : t < PUSH ? 'sad' : t < RELEASE + 0.2 ? 'strain' : 'joy'
  // ちょうちょ を 見あげる → がっくり うつむく → ふんばる → よろこんで 見あげる
  const head = -14 * span(t, 1.4, 1.8) * (1 - span(t, GONE - 0.1, GONE + 0.4)) + 5 * span(t, GONE + 0.1, GONE + 0.4) * (1 - span(t, PUSH - 0.2, PUSH + 0.1)) + 2 * pushW - 8 * span(t, RELEASE + 0.3, RELEASE + 0.7)
  return {
    x: walking.x,
    y: GROUND_Y,
    facing: 'right',
    build: 'child',
    height: KID_HEIGHT,
    lift,
    face,
    look: PERSON_LOOK,
    pose: { ...walking.pose, leftArm, rightArm, torso: 3 * pushW, head },
  } as const
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  // とびら: おしている間に 0 → 0.57 ぐらいまで、てを はなしても いきおいで さいごまで ひらく
  const open = span(t, PUSH, OPENED, easeInOut)
  const wall = span(t, 0, 0.55, backOut)
  const kid = kidAt(t, open)
  const head = personRig(kid).world.head

  // ちょうちょ: にわで ひらひら → ひらいたら 子どもの あたまの 上へ
  const garden = t >= RELEASE - 0.2 && t < OPENED + 0.1
  const fly = span(t, OPENED + 0.1, OPENED + 0.7, easeInOut)
  const gardenBf: Point = [17 + 3 * wave(t, 1.6), 41 + 2.2 * wave(t, 1.1, 0.3)]
  const w = (t - OPENED) * 3.2
  const orbit: Point = [kid.x + 9 + 4.5 * Math.cos(w), 37 + 2.5 * Math.sin(2 * w)]
  const flyBf = lerpPoint(gardenBf, orbit, fly)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[99, 5]} clouds={[]} />
        <ButterflyAbove t={t} />
        <Layer scaleY={wall} origin={[54.5, 98]}>
          <Wall />
          <LeftLeaf />
          <Garden t={t} />
          {garden && <Butterfly t={t} x={gardenBf[0]} y={gardenBf[1]} color={WING} dark={WING_DARK} />}
          <GateLeaf open={open} />
          <FrameFront />
        </Layer>
        <FrontGround />
        <Person {...kid} />
        <Sweat t={t} x={head[0] - 5} y={head[1] - 2} show={during(t, PUSH + 0.1, RELEASE + 0.1, 0.2)} />
        {t >= OPENED + 0.1 && <Butterfly t={t} x={flyBf[0]} y={flyBf[1]} color={WING} dark={WING_DARK} />}
        {/* ひらいた むこうの ひかり */}
        {t > OPENED - 0.4 && (
          <>
            <g opacity={0.5 + 0.5 * wave(t, 0.9)}>
              <Star cx={27} cy={39} r={1.9} color="#ffffff" spin={t * 60} />
            </g>
            <g opacity={0.5 + 0.5 * wave(t, 0.9, 0.45)}>
              <Star cx={23} cy={67} r={1.5} color="#fff6c8" spin={-t * 50} />
            </g>
          </>
        )}
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
    { at: 0, label: '大きな 門が たつ。ちょうちょが とんでいる', sound: 'pop' },
    { at: ENTER, label: '子どもが あるいてくる' },
    { at: GONE, label: 'ちょうちょが 門の むこうへ。がっかり' },
    { at: PUSH, label: 'とびらを ぐっと おす', sound: 'pop' },
    { at: RELEASE, label: 'とびらが かたほうだけ ぱたんと ひらく。ちょうちょが いた!', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '戸 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
