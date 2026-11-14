/*
 * 点(てん): 火が もえると、くろい すすが ぽつん。くろい 点。(共通部品 sceneFigures で 書きなおした もの)
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … なべに さした 小さな はた の ぼう
 *   2画目(ノ)  … はた の 下のふち(はた は 右へ ひらひら なびく)
 *   3画目(丨)  … なべの 左がわ
 *   4画目(𠃍)  … なべの ふち と 右がわ
 *   5画目(一)  … なべの そこ
 *   6〜9画目   … たきびの 4つの ほのお(「灬」。ほのお の さき が 画の はじまり)
 *
 * ながれ
 *   なべが できる → 子どもが たいまつを もって あるいてくる
 *   → たいまつを まきの上に ぽん と おく(なげる)と、まき に 火が ついて 4つの ほのお が もえる
 *   → 子どもは うれしくて ばんざい。なべから ゆげ
 *   → ほのお から くろい すすが ふわっと 上がって、なべに ぽつ・ぽつ・ぽつ・ぽつ と くっつく
 *   → 子どもは「あれ?」と びっくり。なべの 4つの くろい 点 を ゆびさして、わらう
 *   → ほね が ひかって、絵が うすくなり、字「点」が のこる
 *
 * 子どもは Person(小さな 子)。あるくのは walk、こちらを むくのは turnAround、ばんざい は posture('banzai')。
 * たいまつ は 手の { to } に 'stick' を もたせ、先の ほのお は 部品の Flame。ゆびさす うでも { to }。
 * 背景は Backdrop と Meadow、おか は ここで 描く。なべ(3本あし)・たきびの まき・4つの ほのお・すす は 字の画に そろえて ここで 描く。
 * 火は ひとりでに 出ない: 子どもが たいまつを まき の上に おいたから もえる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Flame, Meadow, mixLimb, PALETTE, Person, personRig, posture, turnAround, walk, type Limb, type PersonProps } from '../sceneFigures'

const CHAR = '点'

const HILL = PALETTE.hill
const SUN = PALETTE.sun
const POT = '#6d7c91'
const POT_DARK = '#4b566b'
const POT_LIGHT = '#9fb0c6'
const POT_RIM = '#8d9bb0'
const STEW = '#f0b35a'
const WOOD = PALETTE.bark
const WOOD_DARK = PALETTE.barkDark
const WOOD_END = '#c89a6a'
const POLE = '#b0834f'
const FLAG = '#e8534a'
const FIRE_OUT = '#ff7a3d'
const FIRE_MID = '#ffa63d'
const FIRE_IN = '#ffe27a'
const SOOT = '#2b2b2b'
const KID_LOOK = { top: '#f28b5c', bottom: '#3e5c86' } as const

/** くぎり の時間(秒) */
const POT_AT = 0.1
const WALK = 0.7
const ARRIVE = 1.8
/** たいまつを まきの上に なげる(手から はなれる) */
const THROW = 2.1
const LAND = 2.5
/** 火が つきはじめる(まき に たいまつが ついた しゅんかん) */
const FIRE = 2.5
const FIRE_STEP = 0.15
const CHEER = 2.75
const CALM = 3.8
const STEAM = 3.4
/** すすが 上がりはじめる */
const SOOT_AT = 4.4
const SOOT_STEP = 0.25
const SOOT_FLY = 1.0
const SURPRISE = 4.6
const POINT = 5.1
const LAUGH = 6.1
const INK = 6.9
const DONE = 9.5
const DURATION = 10.2

/* ───────── ばしょ ───────── */

/** ほのお の さき(画の はじまり)と、そこ(画の おわり)。6〜9画目 */
const FLAMES: readonly { readonly tip: readonly [number, number]; readonly base: readonly [number, number] }[] = [
  { tip: [23.3, 83], base: [14.8, 99] },
  { tip: [40, 82.1], base: [45.3, 96.8] },
  { tip: [61.5, 80.5], base: [67.8, 95.5] },
  { tip: [82.3, 79], base: [93.1, 95.5] },
]

/** すすが くっつく、なべの 前がわの 場所(ほのお の 左から じゅんに) */
const SOOT_SPOTS: readonly (readonly [number, number])[] = [
  [41, 60],
  [50.5, 64.5],
  [62, 56.5],
  [70.5, 63],
]

/** 子どもの 足もと(おかの てっぺん)・背の高さ・たいまつが おちる まきの 上 */
const KID_X = 12
const KID_Y = 79
const KID_HEIGHT = 36
const LANDING: readonly [number, number] = [22, 91]
/** たいまつを もつ 手(こし から の ずれ)と、ゆびさす なべの 場所 */
const CARRY: readonly [number, number] = [7, -22]
const THROWN: readonly [number, number] = [13, -27]
const POINT_AT: readonly [number, number] = [29, 56]

const r1 = (n: number) => Math.round(n * 100) / 100

/** 先が とがった しずく形の ほのお。tip から base へのびる。 */
function flamePath(tip: readonly [number, number], base: readonly [number, number], halfWidth: number): string {
  const [tx, ty] = tip
  const [bx, by] = base
  const vx = bx - tx
  const vy = by - ty
  const len = Math.hypot(vx, vy)
  const nx = -vy / len
  const ny = vx / len
  const at = (k: number, side: number) => `${r1(tx + vx * k + nx * halfWidth * side)} ${r1(ty + vy * k + ny * halfWidth * side)}`
  return `M${tx} ${ty} C${at(0.45, 1.2)} ${at(1, 1.3)} ${bx} ${by} C${at(1, -1.3)} ${at(0.45, -1.2)} ${tx} ${ty} Z`
}

/** きまった 時間に きまった かっこう を 通り、あいだ を なめらかに つなぐ */
function keyed(t: number, keys: readonly (readonly [number, Limb])[]): Limb {
  const [first] = keys
  if (t <= first[0]) return first[1]
  for (let i = 1; i < keys.length; i += 1) {
    const [t0, a] = keys[i - 1]
    const [t1, b] = keys[i]
    if (t <= t1) return mixLimb(a, b, span(t, t0, t1, easeInOut))
  }
  return keys[keys.length - 1][1]
}

/* ───────── 地面 ───────── */

/** 空・雲・お日さま は Backdrop。子どもが 立つ おか を そのうえに のせる */
function Ground({ t }: SceneProps) {
  return (
    <>
      <Backdrop t={t} sun={[97, 14]} clouds={[[-2, 22, 0.8], [66, 9, 0.6]]} tufts={[]} />
      {/* とおくの おか。子どもは この てっぺんに 立つ */}
      <path d="M-4 101 V80.5 Q14 76.5 32 82.5 Q62 91 113 85 V101 Z" fill={HILL} />
      <Meadow y={98} tufts={[6, 28, 100]} />
    </>
  )
}

/* ───────── なべ ───────── */

/** 3本あし。ほのお は この あいだ に もえる(あしは まき の うしろに かくれる)。 */
function Legs() {
  return (
    <g stroke={POT_DARK} strokeWidth="2.2" strokeLinecap="round" fill="none">
      <path d="M36 68 L31 97" />
      <path d="M55 68 L54.5 97" />
      <path d="M74 68 L76.5 97" />
    </g>
  )
}

function Pot({ t }: SceneProps) {
  const pop = span(t, POT_AT, POT_AT + 0.55, backOut)
  // はた は 熱で ひらひら なびく
  const f = wave(t, 0.9) * 1.3
  const bubble = during(t, STEAM + 0.2, INK + 0.2, 0.3)
  return (
    <Layer scaleX={0.7 + 0.3 * pop} scaleY={pop} origin={[55, 97]}>
      <Legs />
      {/* くち(うしろの ふち と なかみ) */}
      <ellipse cx="55.5" cy="44.8" rx="22" ry="3.4" fill={POT_RIM} />
      <ellipse cx="55.5" cy="45" rx="20" ry="2.4" fill={STEW} />
      {bubble > 0 && (
        <g opacity={bubble} fill="#ffe3a8">
          <circle cx={46 + wave(t, 1.1) * 1.5} cy="44.6" r={0.9 + 0.5 * Math.abs(wave(t, 0.7))} />
          <circle cx={63 - wave(t, 1.3) * 1.5} cy="45.2" r={0.8 + 0.5 * Math.abs(wave(t, 0.9, 0.3))} />
        </g>
      )}
      {/* 1画目: はた の ぼう。なべの なかに さしてある */}
      <Bone char={CHAR} n={1} color={POLE} width={2.2} />
      <circle cx="52.7" cy="10.9" r="1.7" fill={SUN} />
      {/* 2画目: はた。下の ふち が 画に そう */}
      <path d={`M54.6 12.6 Q67 ${r1(15.4 + f * 0.5)} 77 ${r1(26.8 + f)} Q66 ${r1(28.8 + f * 0.6)} 56.3 29.5 Z`} fill={FLAG} />
      <path d={`M57.4 17.2 Q64 ${r1(19 + f * 0.4)} 70 ${r1(22.6 + f * 0.8)}`} fill="none" stroke="#f58b84" strokeWidth="1.2" strokeLinecap="round" />
      {/* 3〜5画目: なべの どう。まえの ふち は くち の 前がわ をかくす */}
      <rect x="29.6" y="51" width="4.4" height="6.2" rx="2.2" fill={POT_DARK} />
      <rect x="77" y="51" width="4.4" height="6.2" rx="2.2" fill={POT_DARK} />
      <path d="M33.2 45 Q55.5 51.4 77.8 45 L77.4 65.5 Q77.2 70 72.4 70 H38.6 Q33.8 70 33.6 65.5 Z" fill={POT} />
      <path d="M71.5 48 L77.4 45.6 L77.2 65.5 Q77 70 72.4 70 H70 Z" fill={POT_DARK} opacity="0.35" />
      <path d="M33.2 45 Q55.5 51.4 77.8 45" fill="none" stroke={POT_LIGHT} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M37 53 V63" stroke={POT_LIGHT} strokeWidth="2" strokeLinecap="round" opacity="0.8" />
    </Layer>
  )
}

/** なべが あたたまって、ゆげ が のぼる。 */
function Steam({ t }: SceneProps) {
  const show = span(t, STEAM, STEAM + 0.5) * (1 - span(t, INK - 0.1, INK + 0.4))
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.7, 1.4].map((offset, i) => {
        const p = ((t + offset) % 2.1) / 2.1
        const x = 40 + i * 4.5 - p * 5 + Math.sin(p * 6 + i) * 1.5
        const y = 43 - p * 24
        return <circle key={offset} cx={x} cy={y} r={2.2 + p * 3.4} fill="#ffffff" opacity={Math.sin(p * Math.PI) * 0.85} />
      })}
    </g>
  )
}

/* ───────── 火 ───────── */

/** たきびの まき。ほのお は この 上から もえる。 */
function Logs() {
  return (
    <>
      {[
        [8, 92.5, 26],
        [36, 93, 36],
        [74, 92.5, 25],
      ].map(([x, y, w]) => (
        <g key={x}>
          <rect x={x} y={y} width={w} height="7" rx="3.5" fill={WOOD} />
          <path d={`M${x + 3} ${y + 5.2} H${x + w - 3}`} stroke={WOOD_DARK} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx={x + 3.2} cy={y + 3.5} r="2.2" fill={WOOD_END} />
        </g>
      ))}
    </>
  )
}

/** 6〜9画目: 4つの ほのお。まきに 火が ついてから、左から じゅんに もえあがる。 */
function Flames({ t }: SceneProps) {
  return (
    <>
      {FLAMES.map(({ tip, base }, k) => {
        const pop = span(t, FIRE + k * FIRE_STEP, FIRE + k * FIRE_STEP + 0.45, backOut)
        if (pop <= 0) return null
        const flicker = 1 + 0.09 * wave(t, 0.5, k * 0.3)
        const inner: readonly [number, number] = [base[0] + (tip[0] - base[0]) * 0.6, base[1] + (tip[1] - base[1]) * 0.6]
        return (
          <Layer key={k} scaleX={pop} scaleY={pop * flicker} rotate={wave(t, 0.7, k * 0.2) * 3} origin={base}>
            <path d={flamePath(tip, base, 5)} fill={FIRE_OUT} />
            <path d={flamePath([base[0] + (tip[0] - base[0]) * 0.22, base[1] + (tip[1] - base[1]) * 0.22], base, 3.7)} fill={FIRE_MID} />
            <path d={flamePath(inner, base, 2.3)} fill={FIRE_IN} />
          </Layer>
        )
      })}
    </>
  )
}

/** たいまつ(ぼう と 先の ほのお)。ぼう の 手がわ の はし は end、ほのお は 先(tip)に のる。 */
function Torch({ t, end, tip }: { readonly t: number; readonly end: readonly [number, number]; readonly tip: readonly [number, number] }) {
  return (
    <g>
      <path d={`M${r1(end[0])} ${r1(end[1])} L${r1(tip[0])} ${r1(tip[1])}`} stroke={POLE} strokeWidth="1.8" strokeLinecap="round" />
      <Flame t={t} x={tip[0]} y={tip[1] + 0.8} size={0.45} glow={false} />
    </g>
  )
}

/** なげた たいまつ。手から はなれて、まきの上に おちる。 */
function ThrownTorch({ t, from }: { readonly t: number; readonly from: readonly [number, number] }) {
  const p = span(t, THROW, LAND)
  if (p <= 0 || t >= FIRE + 0.25) return null
  const x = from[0] + (LANDING[0] - from[0]) * p
  const y = from[1] + (LANDING[1] - from[1]) * p * p - 6 * Math.sin(Math.PI * p)
  return (
    <Layer x={x} y={y} rotate={360 * p}>
      <Torch t={t} end={[-4.5, 0]} tip={[4.5, 0]} />
    </Layer>
  )
}

/* ───────── すす ───────── */

/** ほのお から ふわっと 上がって、なべに ぽつん と くっつく すす。 */
function Soot({ t }: SceneProps) {
  return (
    <>
      {SOOT_SPOTS.map(([tx, ty], k) => {
        const start = SOOT_AT + k * SOOT_STEP
        const p = span(t, start, start + SOOT_FLY)
        if (p <= 0) return null
        const [fx, fy] = FLAMES[k].tip
        const at = (q: number) => ({
          x: fx + (tx - fx) * easeOut(q) + Math.sin(q * 8 + k) * 1.4 * (1 - q),
          y: fy + (ty - fy) * easeOut(q),
        })
        const here = at(p)
        const landed = p >= 1
        // くっついた しゅんかん、ぷくっと ふくらんで 小さくなる
        const squash = 1 + 0.45 * (1 - span(t, start + SOOT_FLY, start + SOOT_FLY + 0.25))
        const trail = [0.1, 0.2].map((lag) => ({ lag, ...at(Math.max(0, p - lag)) }))
        return (
          <g key={k}>
            {!landed && trail.map(({ lag, x, y }) => <circle key={lag} cx={x} cy={y} r={Math.max(0, 1.1 - lag * 2)} fill={SOOT} opacity={0.35} />)}
            {landed ? <ellipse cx={tx} cy={ty} rx={2.4 * squash} ry={2 * squash} fill={SOOT} /> : <circle cx={here.x} cy={here.y} r={1.1 + 1.1 * p} fill={SOOT} />}
          </g>
        )
      })}
    </>
  )
}

/* ───────── 子ども ───────── */

const BANZAI = posture('banzai', 'front')
const HANG: Limb = { swing: 8, bend: 12 }
const BANZAI_ARM: Limb = BANZAI.leftArm ?? { swing: 155, bend: 15 }

/** 子どもの 場所と かっこう。あるいてきて、こちらを むき、ばんざい → びっくり → ゆびさして わらう */
function kidAt(t: number): PersonProps {
  const w = walk(t, { from: KID_X - 28, to: KID_X, start: WALK, end: ARRIVE - 0.1, build: 'child', height: KID_HEIGHT })
  const turn = turnAround(t, ARRIVE, 'right', 'front')
  const x = w.x
  const spot = (d: readonly [number, number]): Limb => ({ to: [x + d[0], KID_Y + d[1]] })
  // たいまつを もつ のは 体の 左手(右むき の てまえ、正面 では 画面の 右)。ぼう は まっすぐ 上
  const left = keyed(t, [
    [THROW - 0.3, spot(CARRY)],
    [THROW, spot(THROWN)],
    [LAND, HANG],
    [CHEER + 0.15, HANG],
    [CHEER + 0.45, BANZAI_ARM],
    [CALM - 0.3, BANZAI_ARM],
    [CALM, HANG],
    [POINT - 0.2, HANG],
    [POINT, { to: POINT_AT }],
    [LAUGH, { to: POINT_AT }],
    [LAUGH + 0.4, HANG],
  ])
  const right = keyed(t, [
    [ARRIVE, w.pose.rightArm ?? HANG],
    [CHEER - 0.1, HANG],
    [CHEER + 0.15, HANG],
    [CHEER + 0.45, BANZAI.rightArm ?? BANZAI_ARM],
    [CALM - 0.3, BANZAI.rightArm ?? BANZAI_ARM],
    [CALM, HANG],
    [POINT - 0.2, { swing: 20, bend: 20 }],
    [LAUGH, HANG],
  ])
  const cheering = t >= CHEER && t < CALM
  const laughing = t >= LAUGH
  const hop = cheering ? Math.abs(Math.sin((t - CHEER) * Math.PI * 3)) * 2.2 : laughing ? Math.abs(Math.sin((t - LAUGH) * Math.PI * 2.5)) * 1.4 : 0
  return {
    ...w,
    ...turn,
    y: KID_Y,
    look: KID_LOOK,
    face: laughing ? 'joy' : t >= SURPRISE ? 'surprised' : 'smile',
    lift: hop,
    opacity: span(t, WALK - 0.1, WALK + 0.1),
    pose: { ...w.pose, leftArm: left, rightArm: t < ARRIVE ? w.pose.rightArm : right },
  }
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 9)
  const kid = kidAt(t)
  const hand = personRig(kid).world.arms.left.end
  const throwFrom = personRig(kidAt(THROW)).world.arms.left.end
  const torchEnd: readonly [number, number] = [hand[0], hand[1] + 1.5]
  const torchTip: readonly [number, number] = [hand[0], hand[1] - 12]
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <ellipse cx="54.5" cy="97" rx="44" ry="5" fill={FIRE_MID} opacity={0.22 * span(t, FIRE, FIRE + 0.6)} />
        <Pot t={t} />
        <Steam t={t} />
        <Flames t={t} />
        <Logs />
        <Soot t={t} />
        <Person {...kid} held={t >= WALK && t < THROW ? <Torch t={t} end={torchEnd} tip={torchTip} /> : undefined} />
        <ThrownTorch t={t} from={throwFrom} />
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
    { at: 0, label: 'たきびの なべが できる', sound: 'pop' },
    { at: WALK, label: '子どもが たいまつを もって あるいてくる' },
    { at: THROW, label: 'たいまつを まきの上に おく', sound: 'pop' },
    { at: FIRE, label: 'まきに 火が ついて 4つの ほのお が もえる', sound: 'pop' },
    { at: CHEER, label: '子どもは ばんざい。なべから ゆげ' },
    { at: SOOT_AT, label: '火から くろい すすが 上がる' },
    { at: POINT, label: 'すすが なべに ぽつぽつ くっつく。子どもは ゆびさして わらう', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '点 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
