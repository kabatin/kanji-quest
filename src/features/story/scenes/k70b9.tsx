/*
 * 点(てん): 火が もえると、くろい すすが ぽつん。くろい 点。
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
 * 子どもは、ほんものの人の つくり を守る(体は ちいさいが、くび は みじかく どう の上、
 * うで は かた から出て ひじ で まがる)。なべは 3本あしの ざいで、ほのお は その あいだ に もえる。
 * 火は ひとりでに 出ない: 子どもが たいまつを まき の上に おいたから もえる。
 */
import { backOut, during, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '点'

const SKIN = '#f8cfa6'
const HAIR = '#5a3b2a'
const SHIRT = '#f28b5c'
const SHIRT_DARK = '#d9714a'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const HILL = '#e2f2d2'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const POT = '#6d7c91'
const POT_DARK = '#4b566b'
const POT_LIGHT = '#9fb0c6'
const POT_RIM = '#8d9bb0'
const STEW = '#f0b35a'
const WOOD = '#8c5b3c'
const WOOD_DARK = '#70452b'
const WOOD_END = '#c89a6a'
const POLE = '#b0834f'
const FLAG = '#e8534a'
const FIRE_OUT = '#ff7a3d'
const FIRE_MID = '#ffa63d'
const FIRE_IN = '#ffe27a'
const SOOT = '#2b2b2b'
const MOUTH = '#b9483f'
const EYE = '#2b2b2b'

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

/** 子どもの 足もと(おかの てっぺん) */
const KID_X = 12

const r1 = (n: number) => Math.round(n * 100) / 100

/** 先が とがった しずく形の ほのお。tip から base へ のびる。 */
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

/** くぎられた 時間ごとの ねらい(時間, ふり, まげ)を なめらかに つなぐ。 */
type ArmKey = readonly [time: number, swing: number, bend: number]
function armAt(t: number, keys: readonly ArmKey[]): ArmPose {
  const last = keys[keys.length - 1]
  if (t <= keys[0][0]) return { swing: keys[0][1], bend: keys[0][2] }
  if (t >= last[0]) return { swing: last[1], bend: last[2] }
  const i = keys.findIndex((key, k) => t >= key[0] && t < keys[k + 1][0])
  const [t0, s0, b0] = keys[i]
  const [t1, s1, b1] = keys[i + 1]
  return { swing: mix(t, t0, t1, s0, s1), bend: mix(t, t0, t1, b0, b1) }
}

/* ───────── 地面・空 ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[97, 14]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="96.2" y="2.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 97 14)`} />
        ))}
      </Layer>
      <circle cx="97" cy="14" r={Math.max(0, 6.2 * sun)} fill={SUN} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="6" cy="22" rx="7" ry="3.2" />
        <ellipse cx="11" cy="20.4" rx="5" ry="3.2" />
        <ellipse cx="70" cy="9" rx="5.6" ry="2.6" />
        <ellipse cx="74.4" cy="7.6" rx="4" ry="2.8" />
      </g>
      {/* とおくの おか。子どもは この てっぺんに 立つ */}
      <path d={`M-4 101 V80.5 Q14 76.5 32 82.5 Q62 91 113 85 V101 Z`} fill={HILL} />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 28, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
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

/** たいまつの ほのお(まっすぐ 上を むく ちいさな 火) */
function TorchFlame({ x, y, scale = 1 }: { readonly x: number; readonly y: number; readonly scale?: number }) {
  return (
    <g transform={`translate(${r1(x)} ${r1(y)}) scale(${scale})`}>
      <path d="M0 -5.6 Q2.8 -2.2 2 0.6 Q0 2.4 -2 0.6 Q-2.8 -2.2 0 -5.6 Z" fill={FIRE_OUT} />
      <path d="M0 -3.2 Q1.4 -1.2 1 0.3 Q0 1.2 -1 0.3 Q-1.4 -1.2 0 -3.2 Z" fill={FIRE_IN} />
    </g>
  )
}

/** なげた たいまつ。手から はなれて、まきの上に おちる。 */
function ThrownTorch({ t }: SceneProps) {
  const p = span(t, THROW, LAND)
  const show = p > 0 && t < FIRE + 0.25
  if (!show) return null
  const x = 25 - 4 * p + 3 * Math.sin(Math.PI * p)
  const y = 60 + 31.4 * p * p - 6 * Math.sin(Math.PI * p)
  return (
    <Layer x={x} y={y} rotate={360 * p}>
      <rect x="-4.5" y="-0.9" width="9" height="1.8" rx="0.9" fill={POLE} />
      <TorchFlame x={4.5} y={0.4} />
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
            {!landed &&
              trail.map(({ lag, x, y }) => (
                <circle key={lag} cx={x} cy={y} r={Math.max(0, 1.1 - lag * 2)} fill={SOOT} opacity={0.35} />
              ))}
            {landed ? (
              <ellipse cx={tx} cy={ty} rx={2.4 * squash} ry={2 * squash} fill={SOOT} />
            ) : (
              <circle cx={here.x} cy={here.y} r={1.1 + 1.1 * p} fill={SOOT} />
            )}
          </g>
        )
      })}
    </>
  )
}

/* ───────── 子ども ───────── */

type Mood = 'happy' | 'surprised' | 'laugh'

/** うで の かっこう。swing = ま下から 外・まえへ ふった角度 / bend = ひじ の まがり */
type ArmPose = { readonly swing: number; readonly bend: number }

const rad = (deg: number) => (deg * Math.PI) / 180
const UPPER = 4.6

/**
 * かた から出て、ひじ で まがる うで。side が 1 なら 右のうで(まえ は +x)、-1 なら 左のうで。
 * torch のとき、てに たいまつを もつ(ぼう は 手の さき へ のびて、ほのお は まっすぐ 上)。
 */
function Arm({ pose, side, torch = false }: { readonly pose: ArmPose; readonly side: 1 | -1; readonly torch?: boolean }) {
  const shoulder: readonly [number, number] = side === 1 ? [15.7, 63] : [8.3, 63]
  const a1 = rad(pose.swing)
  const a2 = rad(pose.swing + pose.bend)
  const elbow = [shoulder[0] + side * Math.sin(a1) * UPPER, shoulder[1] + Math.cos(a1) * UPPER] as const
  const hand = [elbow[0] + side * Math.sin(a2) * UPPER, elbow[1] + Math.cos(a2) * UPPER] as const
  const tip = [hand[0] + side * Math.sin(a2) * 8, hand[1] + Math.cos(a2) * 8] as const
  return (
    <>
      {torch && (
        <>
          <path d={`M${r1(hand[0])} ${r1(hand[1])} L${r1(tip[0])} ${r1(tip[1])}`} stroke={POLE} strokeWidth="1.8" strokeLinecap="round" />
          <TorchFlame x={tip[0]} y={tip[1] + 0.2} scale={1.1} />
        </>
      )}
      <path
        d={`M${shoulder[0]} ${shoulder[1]} L${r1(elbow[0])} ${r1(elbow[1])} L${r1(hand[0])} ${r1(hand[1])}`}
        fill="none"
        stroke={side === 1 ? SHIRT : SHIRT_DARK}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={r1(hand[0])} cy={r1(hand[1])} r="2.1" fill={SKIN} />
    </>
  )
}

/** 顔(あたまの 中心 12, 54)。気持ちで 目と口を かえる。 */
function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="7.6" cy="57.4" r="1.5" fill="#ff9d9d" opacity="0.6" />
      <circle cx="16.4" cy="57.4" r="1.5" fill="#ff9d9d" opacity="0.6" />
      {mood === 'happy' && (
        <>
          <circle cx="9.2" cy="54.2" r="1" fill={EYE} />
          <circle cx="14.8" cy="54.2" r="1" fill={EYE} />
          <path d="M10.2 57.2 Q12 59.2 13.8 57.2" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'surprised' && (
        <>
          <path d="M7.6 50.6 Q9.2 49.4 10.6 50.4 M13.4 50.4 Q14.8 49.4 16.4 50.6" fill="none" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <circle cx="9.2" cy="54" r="1.5" fill={EYE} />
          <circle cx="14.8" cy="54" r="1.5" fill={EYE} />
          <circle cx="9.6" cy="53.5" r="0.45" fill="#ffffff" />
          <circle cx="15.2" cy="53.5" r="0.45" fill="#ffffff" />
          <ellipse cx="12" cy="58.4" rx="1.2" ry="1.7" fill={MOUTH} />
        </>
      )}
      {mood === 'laugh' && (
        <>
          <path d="M7.9 55 Q9.2 52.8 10.5 55 M13.5 55 Q14.8 52.8 16.1 55" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M9.6 56.8 Q12 57.2 14.4 56.8 Q13.9 60.6 12 60.6 Q10.1 60.6 9.6 56.8 Z" fill={MOUTH} />
          <ellipse cx="12" cy="59.8" rx="1.3" ry="0.7" fill="#ff8a8a" />
        </>
      )}
    </>
  )
}

type ChildProps = {
  readonly mood: Mood
  readonly step: number
  readonly right: ArmPose
  readonly left: ArmPose
  readonly torch: boolean
  readonly headTilt: number
}

/** ちいさな 子ども(あたま が 大きい 2〜3頭身)。足もとが おかの てっぺん。 */
function Child({ mood, step, right, left, torch, headTilt }: ChildProps) {
  return (
    <>
      {/* あし: こしから。あるくとき かわりばんこに ふる */}
      <Layer rotate={step * 18} origin={[10.2, 72]}>
        <rect x="8.6" y="71.5" width="3.4" height="6.4" rx="1.7" fill={PANTS} />
        <ellipse cx="10" cy="78" rx="3" ry="1.4" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 18} origin={[13.8, 72]}>
        <rect x="12" y="71.5" width="3.4" height="6.4" rx="1.7" fill={PANTS} />
        <ellipse cx="14" cy="78" rx="3" ry="1.4" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう の まんなか の上 */}
      <rect x="10.4" y="58.6" width="3.2" height="3.4" rx="1.4" fill={SKIN} />
      {/* どう */}
      <rect x="7.2" y="60.4" width="9.6" height="12.4" rx="3.6" fill={SHIRT} />
      <Arm pose={left} side={-1} />
      <Arm pose={right} side={1} torch={torch} />
      {/* あたま */}
      <Layer rotate={headTilt} origin={[12, 60.5]}>
        <circle cx="12" cy="54" r="7.6" fill={SKIN} />
        <path d="M4.4 53.5 C3.4 45 9 42.6 12 42.8 C15.5 42.6 21.2 45 19.6 53.5 C18.8 49.8 16.6 48.4 14 48.6 C12.6 48.2 10 48.2 9.6 48.5 C7.4 48.6 5.2 50 4.4 53.5 Z" fill={HAIR} />
        <path d="M11 43.4 Q12 40.4 13.8 42.8" fill="none" stroke={HAIR} strokeWidth="1.3" strokeLinecap="round" />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

/* 子どもの うで の うごき(時間, ふり, まげ) */
const RIGHT_ARM: readonly ArmKey[] = [
  [0, 70, 80], // たいまつを かたの 高さに もって あるく
  [1.85, 70, 80],
  [THROW, 100, 10], // まえへ ふって、ぽん と なげる
  [LAND, 12, 12],
  [CHEER, 115, 45], // ばんざい
  [CALM - 0.3, 115, 45],
  [CALM, 5, 12],
  [SURPRISE - 0.1, 5, 12],
  [POINT - 0.2, 40, 20], // あっ
  [POINT, 92, 0], // なべを ゆびさす
]
const LEFT_ARM: readonly ArmKey[] = [
  [ARRIVE, 0, 10],
  [CHEER - 0.1, 0, 10],
  [CHEER + 0.15, 115, 45],
  [CALM - 0.3, 115, 45],
  [CALM, 6, 14],
  [SURPRISE - 0.1, 6, 14],
  [POINT - 0.2, 35, 20],
  [LAUGH, 6, 16],
]

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 9)

  // あるいてくる: 左から おかの 上へ
  const walking = 1 - span(t, ARRIVE - 0.2, ARRIVE)
  const stride = t < WALK ? 0 : Math.sin((t - WALK) * Math.PI * 2 * 2.2) * walking
  const walkX = mix(t, WALK, ARRIVE, -28, 0, easeOut)
  const cheering = t >= CHEER && t < CALM
  const laughing = t >= LAUGH
  const hop = cheering ? Math.abs(Math.sin((t - CHEER) * Math.PI * 3)) * 2.2 : laughing ? Math.abs(Math.sin((t - LAUGH) * Math.PI * 2.5)) * 1.4 : 0
  const bob = -Math.abs(stride) * 0.9 - hop

  const mood: Mood = t >= LAUGH ? 'laugh' : t >= SURPRISE ? 'surprised' : 'happy'
  const right = armAt(t, RIGHT_ARM)
  const left = t < ARRIVE ? { swing: -stride * 24, bend: 10 } : armAt(t, LEFT_ARM)
  const headTilt = laughing ? wave(t, 0.5) * 3 : t >= SURPRISE ? 4 : 0
  // できあがりで、字が ぽん と はずむ
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
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.1)}>
          <ellipse cx={KID_X + walkX} cy="79" rx="7" ry="1.6" fill="#000000" opacity="0.1" />
          <Layer x={walkX} y={bob}>
            <Child mood={mood} step={stride} right={right} left={left} torch={t < THROW} headTilt={headTilt} />
          </Layer>
        </Layer>
        <ThrownTorch t={t} />
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
