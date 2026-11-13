/*
 * 気(き): ごはんを たくと、ゆげが ゆらゆら のぼる。(目に みえにくい もの)
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … いちばん上の、ちいさく たなびく ゆげ
 *   2・3画目   … 上のほうで ゆらゆら よこに ながれる、2だんの ゆげ
 *   4画目(乙)  … おなべ から のぼって、おなかを すかせた子の 鼻へ とどく ゆげ(よこ線)
 *                  と、その子の 体(右の たて線と 足もと)
 *   5・6画目   … ごはんを たいている おなべ(まんなかの ×)
 *
 * ながれ
 *   おなかを すかせた子が、おなべの よこで しょんぼり まっている(おなかが ぐるる)
 *   → 火が ついて、ふたが カタカタ。ごはんが たけて、ゆげが ゆらゆら のぼる
 *   → ゆげが 子の 鼻に とどく。くんくん「いい におい!」と かおが ぱっと 明るくなる
 *   → ゆげの ゆれが おちついて 4本の線に そろい、ほね が ひかって、絵が うすくなり 字「気」になる
 *
 * 人・おなべ・ゆげは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   子の うで は かた から出て ひじ で まがる。くび は みじかく。
 *   ゆげ は おなべの ふた の すきま から のぼり、のぼる ほど ひろがって ゆれる。
 *   字の形になるのは、ゆげ の ゆれが おさまった さいごの しゅんかん だけ。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '気'

const WALL = '#fdeccb'
const WALL_LINE = '#f5d9a8'
const FLOOR = '#e8c79a'
const WINDOW_SKY = '#cfe9fb'
const SUN = '#ffd24a'
const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#4f9be0'
const TUNIC_DARK = '#3c82c4'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const POT = '#e0664a'
const POT_DARK = '#bf4f38'
const POT_LIGHT = '#f2937a'
const WOOD = '#6b4a36'
const STOVE = '#5b6070'
const STOVE_HOLE = '#2e3040'
const RICE = '#fffaf0'
const RICE_GRAIN = '#e8dfc8'
const STEAM = '#ffffff'
const STEAM_SHADE = '#bccfe6'
const HEART = '#f0708f'

/** くぎり の時間(秒) */
const POP = 0.2
const FIRE = 1.4
const RATTLE = 2.4
/** ゆげが のぼりはじめる */
const STEAM_AT = 3.0
/** ゆげが 鼻に とどく / かおが 明るくなる */
const SNIFF = 4.4
const HAPPY = 5.1
const INK = 6.5
const DONE = 9.7
const DURATION = 10.3

const GROUND_Y = 96
/** 子の まんなか(たて線) と くび・かたの 高さ */
const KID_X = 85
const NECK: readonly [number, number] = [KID_X, 53]
const HEAD: readonly [number, number] = [KID_X, 44]
/** うで の ながさ(かた→ひじ、ひじ→手) */
const ARM_PART = 8
const SHOULDER_L: readonly [number, number] = [79.5, 59]
const SHOULDER_R: readonly [number, number] = [90.5, 59]

/** おなべの まんなか と ふたの じく(右のふち) */
const POT_X = 42
const LID_HINGE: readonly [number, number] = [60, 70]

/* ───────── へや ───────── */

function Room() {
  return (
    <>
      <rect x="-2" y="-2" width="113" height="100" fill={WALL} />
      <rect x="-2" y="94" width="113" height="17" fill={FLOOR} />
      <rect x="-2" y="93.4" width="113" height="1.6" fill={WALL_LINE} />
      {/* まどの そと: 空と お日さま */}
      <rect x="3" y="5" width="15" height="15" rx="3.5" fill={WINDOW_SKY} />
      <circle cx="11" cy="12" r="3.6" fill={SUN} />
    </>
  )
}

/* ───────── おなべ ───────── */

function Stove({ t }: SceneProps) {
  const fire = span(t, FIRE, FIRE + 0.6, backOut)
  return (
    <>
      <rect x="18" y="90" width="48" height="7.5" rx="2" fill={STOVE} />
      <rect x="26" y="91.2" width="32" height="5.4" rx="1.6" fill={STOVE_HOLE} />
      {[33, 42, 51].map((x, i) => (
        <Layer key={x} scale={Math.max(0, fire) * (1 + 0.1 * wave(t, 0.35, i * 0.12))} origin={[x, 95.6]}>
          <path d={`M${x - 3} 95.6 C${x - 3.6} 92.2 ${x - 0.6} 90.6 ${x - 0.4} 87 C${x + 1.6} 89.6 ${x + 3.6} 92 ${x + 3} 95.6 Z`} fill="#ff8a3d" />
          <path d={`M${x - 1.4} 95.6 C${x - 1.6} 93.8 ${x} 93 ${x + 0.1} 91.4 C${x + 1.2} 92.8 ${x + 1.6} 94.2 ${x + 1.4} 95.6 Z`} fill={SUN} />
        </Layer>
      ))}
    </>
  )
}

function Pot({ t }: SceneProps) {
  // ふたは、まず カタカタ ゆれて、そのあと すこし ずれて ゆげが ぬける
  const rattle = during(t, RATTLE, STEAM_AT + 0.5, 0.2)
  const ajar = span(t, STEAM_AT, STEAM_AT + 0.5, backOut)
  const lidRotate = wave(t, 0.14) * 2.2 * rattle * (1 - ajar) + ajar * 8
  const lidLift = Math.abs(wave(t, 0.14)) * 0.9 * rattle * (1 - ajar)
  return (
    <>
      {/* とって(右と左) */}
      <rect x="19.5" y="74" width="5.5" height="3.6" rx="1.8" fill={WOOD} />
      <rect x="59" y="74" width="5.5" height="3.6" rx="1.8" fill={WOOD} />
      <rect x="24" y="70" width="36" height="20" rx="5" fill={POT} />
      <rect x="24" y="84.6" width="36" height="5.4" rx="2.7" fill={POT_DARK} />
      <rect x="28" y="73.5" width="3" height="10" rx="1.5" fill={POT_LIGHT} />
      <rect x="23" y="68.6" width="38" height="3" rx="1.5" fill={POT_LIGHT} />
      {/* ごはん: ふたが ずれたとき だけ 見える(ふたの下で もりあがっている) */}
      <path d="M25 69.2 Q25 65.4 42.5 65.4 Q60 65.4 60 69.2 Z" fill={RICE} />
      {[[33, 67.6], [39, 66.8], [45, 67.4], [51, 67.2], [55.5, 68.2]].map(([x, y]) => (
        <ellipse key={x} cx={x} cy={y} rx="1.2" ry="0.7" fill={RICE_GRAIN} transform={`rotate(-20 ${x} ${y})`} />
      ))}
      <Layer y={-lidLift} rotate={lidRotate} origin={LID_HINGE}>
        <path d="M24 69.4 C24 59.6 61 59.6 61 69.4 Z" fill={POT_LIGHT} />
        <path d="M24 69.4 C24 65 61 65 61 69.4 Z" fill={POT} />
        <rect x={POT_X - 2.4} y="58.2" width="4.8" height="3.4" rx="1.6" fill={WOOD} />
      </Layer>
    </>
  )
}

/* ───────── ゆげ ───────── */

type Wisp = { readonly from: readonly [number, number]; readonly to: readonly [number, number]; readonly start: number; readonly end: number; readonly amp: number }

/** ほね(1〜4画目)の 線の ちかくを ゆれながら ながれる ゆげ。のぼる じゅんに あらわれる */
const WISPS: readonly Wisp[] = [
  { from: [18.5, 47], to: [75, 39.3], start: STEAM_AT, end: SNIFF, amp: 3.2 },
  { from: [31.3, 32.8], to: [70.3, 28], start: STEAM_AT + 0.6, end: SNIFF + 0.1, amp: 3 },
  { from: [36.5, 21.3], to: [73.5, 14.8], start: STEAM_AT + 1.0, end: SNIFF + 0.5, amp: 3 },
  { from: [37.8, 9.3], to: [24, 29], start: STEAM_AT + 1.4, end: SNIFF + 0.8, amp: 2.4 },
]

/** from→to の線を、よこに ゆらした なめらかな線(path)にする */
function wavyPath(from: readonly [number, number], to: readonly [number, number], amp: number, phase: number): string {
  const steps = 12
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const len = Math.hypot(dx, dy)
  const nx = -dy / len
  const ny = dx / len
  const points = Array.from({ length: steps + 1 }, (_, i) => {
    const u = i / steps
    const off = amp * Math.sin(u * Math.PI * 2 * 1.25 + phase) * Math.sin(u * Math.PI)
    return [from[0] + dx * u + nx * off, from[1] + dy * u + ny * off] as const
  })
  const mid = (a: readonly [number, number], b: readonly [number, number]) => `${(a[0] + b[0]) / 2} ${(a[1] + b[1]) / 2}`
  const curve = points
    .slice(1, -1)
    .map((p, i) => `Q${p[0]} ${p[1]} ${mid(p, points[i + 2])}`)
    .join(' ')
  return `M${points[0][0]} ${points[0][1]} ${curve} L${points[steps][0]} ${points[steps][1]}`
}

function SteamWisps({ t }: SceneProps) {
  // 字になる ちょくぜん に ゆれが おさまり、線の上に そろう
  const calm = 1 - span(t, INK - 0.7, INK, easeInOut)
  return (
    <>
      {WISPS.map((wisp, i) => {
        const grow = span(t, wisp.start, wisp.end, easeOut)
        if (grow <= 0) return null
        const d = wavyPath(wisp.from, wisp.to, wisp.amp * calm * Math.min(1, 0.4 + grow), t * 2.2 + i * 1.7)
        const dash = { pathLength: 1, strokeDasharray: `${grow} 2` }
        return (
          <g key={i} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.96">
            <path d={d} stroke={STEAM_SHADE} strokeWidth="6.4" {...dash} />
            <path d={d} stroke={STEAM} strokeWidth="4.4" transform="translate(-0.4 -0.5)" {...dash} />
          </g>
        )
      })}
    </>
  )
}

/** ふたの すきま から もくもく のぼる ゆげの つぶ(のぼりながら ふくらんで きえる) */
function SteamPuffs({ t }: SceneProps) {
  const show = during(t, STEAM_AT, INK - 0.3, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const p = (t * 0.7 + i / 7) % 1
        const x = 38 + Math.sin(p * 5 + i * 1.3) * 2.6
        const y = 63 - p * 19
        return <circle key={i} cx={x} cy={y} r={1.6 + p * 3.2} fill={STEAM} stroke={STEAM_SHADE} strokeWidth="0.6" opacity={Math.sin(p * Math.PI)} />
      })}
    </g>
  )
}

/* ───────── 子ども ───────── */

type Mood = 'hungry' | 'sniff' | 'happy'

/** かた から出て、ひじ で まがる うで。角度は ま下から、右(+x)へ 何度か */
function Arm({ shoulder, upper, fore }: { readonly shoulder: readonly [number, number]; readonly upper: number; readonly fore: number }) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const elbow = [shoulder[0] + Math.sin(rad(upper)) * ARM_PART, shoulder[1] + Math.cos(rad(upper)) * ARM_PART] as const
  const hand = [elbow[0] + Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART] as const
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={TUNIC_DARK} strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3" fill={SKIN} />
    </>
  )
}

function Face({ mood, t }: { readonly mood: Mood; readonly t: number }) {
  const [cx, cy] = HEAD
  const closedEye = (x: number) => <path d={`M${x - 1.6} ${cy + 1.2} Q${x} ${cy - 0.4} ${x + 1.6} ${cy + 1.2}`} fill="none" stroke="#2b2b2b" strokeWidth="1.25" strokeLinecap="round" />
  // 鼻が くんくん ふくらむ
  const sniff = 1 + 0.35 * Math.max(0, wave(t, 0.3))
  return (
    <>
      <circle cx={cx - 6.5} cy={cy + 5.6} r="2.1" fill="#ff9d9d" opacity="0.55" />
      <circle cx={cx + 6.5} cy={cy + 5.6} r="2.1" fill="#ff9d9d" opacity="0.55" />
      {mood === 'hungry' && (
        <>
          <path d={`M${cx - 5.7} ${cy - 1.4} L${cx - 2} ${cy - 2.8} M${cx + 2} ${cy - 2.8} L${cx + 5.7} ${cy - 1.4}`} stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx={cx - 3.7} cy={cy + 1} r="1.2" fill="#2b2b2b" />
          <circle cx={cx + 3.7} cy={cy + 1} r="1.2" fill="#2b2b2b" />
          <path d={`M${cx - 2.2} ${cy + 7.2} Q${cx} ${cy + 5.6} ${cx + 2.2} ${cy + 7.2}`} fill="none" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'sniff' && (
        <>
          {closedEye(cx - 3.7)}
          {closedEye(cx + 3.7)}
          <ellipse cx={cx} cy={cy + 3.6} rx={1.1 * sniff} ry={0.8 * sniff} fill={SKIN_SHADE} />
          <ellipse cx={cx} cy={cy + 7} rx="1.2" ry="1.4" fill="#b9483f" />
        </>
      )}
      {mood === 'happy' && (
        <>
          {closedEye(cx - 3.7)}
          {closedEye(cx + 3.7)}
          <path d={`M${cx - 3.2} ${cy + 5.2} Q${cx} ${cy + 11.2} ${cx + 3.2} ${cy + 5.2} Z`} fill="#b9483f" />
          <path d={`M${cx - 1.6} ${cy + 7.6} Q${cx} ${cy + 6.8} ${cx + 1.6} ${cy + 7.6} Q${cx} ${cy + 9} ${cx - 1.6} ${cy + 7.6} Z`} fill="#ff8a8a" />
        </>
      )}
    </>
  )
}

type KidProps = { readonly t: number; readonly mood: Mood; readonly cheer: number }

function Kid({ t, mood, cheer }: KidProps) {
  const [hx, hy] = HEAD
  // おなかが ぐるる: 体が ぷるぷる。かおが 明るくなったら 首を かしげる
  const growl = during(t, 0.9, RATTLE + 0.6, 0.25)
  const shake = wave(t, 0.18) * growl
  const headTilt = mood === 'hungry' ? 4 : mood === 'sniff' ? -9 : -3 + wave(t, 0.5) * 3
  // 右うでは はじめ おなかに。うれしくなると、ばんざい(かた→ひじ→手 の角度を うつす)
  const up = cheer
  const rightUpper = 20 + 120 * up
  const rightFore = -70 + 240 * up + wave(t, 0.5) * 8 * up
  return (
    <>
      <ellipse cx={KID_X} cy="97.2" rx="11" ry="2.2" fill="#000000" opacity="0.12" />
      <Layer scaleX={1 + shake * 0.025} origin={[KID_X, 70]}>
        {/* あし */}
        <rect x="79.4" y="76" width="5.2" height="18" rx="2.6" fill={PANTS} />
        <rect x="85.4" y="76" width="5.2" height="18" rx="2.6" fill={PANTS} />
        <ellipse cx="81.2" cy="95" rx="4.6" ry="2.4" fill={SHOE} />
        <ellipse cx="88.8" cy="95" rx="4.6" ry="2.4" fill={SHOE} />
        {/* くび: どう と あたま の間を みじかく つなぐ */}
        <rect x={KID_X - 2.4} y="50.6" width="4.8" height="7" rx="2.2" fill={SKIN_SHADE} />
        {/* どう */}
        <rect x="77.4" y="54.6" width="15.2" height="25" rx="6" fill={TUNIC} />
        <path d="M79.4 72.4 h11.2" stroke={TUNIC_DARK} strokeWidth="1.4" strokeLinecap="round" />
        {/* うで: ひだりは ずっと おなか、みぎは ばんざい */}
        <Arm shoulder={SHOULDER_L} upper={-20} fore={70} />
        <Arm shoulder={SHOULDER_R} upper={rightUpper} fore={rightFore} />
        {/* あたま */}
        <Layer rotate={headTilt} origin={NECK}>
          <circle cx={hx} cy={hy} r="9" fill={SKIN} />
          <path d={`M${hx - 8.8} ${hy - 1} C${hx - 9.8} ${hy - 11} ${hx + 9.8} ${hy - 11} ${hx + 8.8} ${hy - 1} C${hx + 6.6} ${hy - 5.4} ${hx + 2} ${hy - 6.6} ${hx} ${hy - 6.4} C${hx - 3} ${hy - 6.8} ${hx - 6.6} ${hy - 5.4} ${hx - 8.8} ${hy - 1} Z`} fill={HAIR} />
          <path d={`M${hx} ${hy - 8.6} q-1 -3 1.6 -3.6 q-0.4 1.6 0.6 2.4`} fill="none" stroke={HAIR} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <Face mood={mood} t={t} />
        </Layer>
      </Layer>
    </>
  )
}

/** おなかの「ぐるる」を あらわす、ゆれる すじ */
function Growl({ t }: SceneProps) {
  const show = during(t, 0.9, RATTLE + 0.6, 0.25)
  if (show <= 0) return null
  const s = wave(t, 0.18)
  return (
    <g opacity={show} fill="none" stroke="#7f8aa3" strokeWidth="1" strokeLinecap="round">
      <path d={`M${72 + s * 0.6} 66 q-2.2 2 0 4 q2.2 2 0 4`} />
      <path d={`M${68.6 - s * 0.6} 65 q-2.6 3 0 6 q2.6 3 0 6`} />
    </g>
  )
}

/** うれしい ときの ハート */
function Hearts({ t }: SceneProps) {
  const show = during(t, HAPPY + 0.2, INK - 0.1, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show} fill={HEART}>
      {[0, 0.55].map((offset, i) => {
        const p = ((t - HAPPY + offset) % 1.1) / 1.1
        const x = 99 - i * 6 + Math.sin(p * 6) * 1.2
        const y = 36 - i * 4 - p * 9
        return <path key={i} d="M0 2.4 C-5.4 -1.4 -3.6 -5.4 0 -3 C3.6 -5.4 5.4 -1.4 0 2.4 Z" transform={`translate(${x} ${y}) scale(${1 + 0.25 * i})`} opacity={Math.sin(p * Math.PI)} />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)
  const mood: Mood = t < SNIFF ? 'hungry' : t < HAPPY ? 'sniff' : 'happy'
  const cheer = span(t, HAPPY, HAPPY + 0.5, backOut)
  const pop = Math.max(0, span(t, POP, POP + 0.6, backOut))
  // うれしくて ぴょんぴょん
  const hop = t > HAPPY + 0.4 && t < INK - 0.2 ? -Math.abs(wave(t, 0.6)) * 1.6 : 0
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Room />
        <Stove t={t} />
        <Pot t={t} />
        <SteamPuffs t={t} />
        <SteamWisps t={t} />
        <Layer scale={pop} origin={[KID_X, GROUND_Y]} opacity={span(t, POP, POP + 0.15)}>
          <Layer y={hop}>
            <Kid t={t} mood={mood} cheer={cheer} />
          </Layer>
          <Growl t={t} />
        </Layer>
        <Hearts t={t} />
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
    { at: 0, label: 'おなかを すかせた子と、おなべ', sound: 'pop' },
    { at: FIRE, label: '火が ついて、ふたが カタカタ' },
    { at: STEAM_AT, label: 'ゆげが ゆらゆら のぼる', sound: 'pop' },
    { at: SNIFF, label: 'ゆげが 鼻に とどく。くんくん' },
    { at: HAPPY, label: 'いい におい! 大よろこび' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '気 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
