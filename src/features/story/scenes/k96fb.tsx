/*
 * 電(でん): 雨の中、いなずまが ぴかっと 光る。
 *
 * ほね(画と絵の対応)
 *   1画目(一)   … 雨雲の もくもくした 上がわ
 *   2画目(ノ)   … 雲の 左はし から ふる 雨の すじ(かさ に あたる)
 *   3画目(一)   … 雲の たいらな そこ(右はしで 少し まるく さがる)
 *   4画目(丨)   … 雲から おちる いなずまの 上の ぶぶん
 *   5〜8画目    … 左右に ぽつぽつ おちる しずく
 *   9〜12画目   … 家の まど(わく と、まんなかの さん)
 *   13画目      … いなずまの 下の ぶぶん。じめんに とどいて、ひだりから みぎへ ひろがる
 *
 * ながれ
 *   はれた日、子どもが ごきげんで あそんでいる
 *   → 雲が あつまって 空が くらくなる。子どもは 空を見て 心ぱいそうな 顔
 *   → かさを ひらいて ほっとする → 雨が ぽつぽつ ふりだす
 *   → ぴかっ! 雲から いなずまが 走って じめんへ。子どもは びっくりして とびあがる
 *   → こわくない と わかって「わあ、すごい」と 見あげる
 *   → ほね が ひかって、絵が うすくなり、字「電」が のこる
 *
 * ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   雲の そこ は たいら。雨は 少し ななめに まっすぐ おちる。いなずまは 雲から じめんへ ぎざぎざに 走る。
 *   子どもは、うで が かた から出て ひじ で まがる。かさ は 手に もった えが 上へ のびる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '電'

const SUN = '#ffd24a'
const HILL = '#e2f2d2'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SKY_DIM = '#40506e'
const RAIN = '#5aaee8'
const DROP = '#7cc4f2'
const DROP_LIGHT = '#e8f6ff'
const WALL = '#f6e6c6'
const WALL_SHADE = '#e6d2a8'
const ROOF = '#c8553d'
const WOOD = '#8c5b3c'
const DOOR = '#a3714b'
const GLASS = '#b9def3'
const GLASS_NIGHT = '#27344f'
const FLASH = '#fff6c2'
const BOLT_GLOW = '#ffe566'
const BOLT_BODY = '#ffd633'
const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const COAT = '#ffcf3a'
const COAT_DARK = '#e6b020'
const BOOT = '#3b6fb6'
const UMBRELLA = '#e8534a'
const UMBRELLA_DARK = '#c4403a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const GATHER = 1.0
const DARK = 2.6
/** かさを ひらく */
const OPEN = 2.6
const RAIN_AT = 3.4
/** ぴかっ! */
const BOLT = 5.0
/** こわくない と わかって 見あげる */
const AMAZED = 6.0
const INK = 6.6
const DONE = 10.0
const DURATION = 10.6

/* ───────── 空・地面 ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut) * (1 - span(t, 1.4, 2.4))
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[12, 12]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="11.2" y="1.2" width="1.6" height="3.8" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 12 12)`} />
        ))}
      </Layer>
      <circle cx="12" cy="12" r={Math.max(0, 5.8 * sun)} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 94 V101 H-4 Z" fill={HILL} />
      <ellipse cx="54.5" cy="98.2" rx="52" ry="5.4" fill={GRASS} />
      {[4, 38, 92, 102].map((x) => (
        <path key={x} d={`M${x} 98 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/* ───────── 家 ───────── */

/** まどの ガラス。はれた日は 空いろ、くらくなると 夜のいろ、いなずまで 一しゅん 白く光る */
function House({ dark, flash }: { readonly dark: number; readonly flash: number }) {
  const panes = [
    [28, 56.5],
    [51.2, 56.5],
    [28, 68],
    [51.2, 68],
  ] as const
  return (
    <>
      {/* かべ と やね(やねは たいらで、ひさしが すこし はりだす) */}
      <rect x="20" y="49" width="66" height="49" rx="1" fill={WALL} />
      <rect x="20" y="91" width="66" height="7" fill={WALL_SHADE} />
      <rect x="17" y="46" width="72" height="6" rx="2.5" fill={ROOF} />
      {/* ドア */}
      <rect x="60" y="84" width="14" height="14" rx="2" fill={DOOR} />
      <circle cx="71" cy="91.5" r="1" fill={COAT} />
      {/* まど: わく と まんなかの さん(田の形) */}
      <rect x="25" y="53" width="50" height="28" rx="2.4" fill={WOOD} />
      {panes.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="20.8" height="8.9" rx="1" fill={GLASS} />
          <rect x={x} y={y} width="20.8" height="8.9" rx="1" fill={GLASS_NIGHT} opacity={0.78 * dark} />
          <rect x={x} y={y} width="20.8" height="8.9" rx="1" fill={FLASH} opacity={flash} />
          <path d={`M${x + 2} ${y + 2.2} l4 0`} stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity={0.7 * (1 - dark)} />
        </g>
      ))}
      <rect x="23" y="81" width="54" height="2.4" rx="1.2" fill="#b9825a" />
    </>
  )
}

/* ───────── 雲 ───────── */

const SLAB_TOP = 20
const BASE_Y = 29
/** 雲の かげ: 色の面の 下に ずらして ならべ、そこ に おびを のこす */
const SHADE_BAND = 2.4

type Puff = readonly [cx: number, cy: number, r: number]
/** 雲の ひとかたまり。from〜to が たいらな そこ、puffs が 上の もくもく */
type CloudPart = { readonly from: number; readonly to: number; readonly puffs: readonly Puff[] }

const LEFT_CLOUD: CloudPart = { from: 16, to: 48, puffs: [[27, 21, 6], [38, 20, 7]] }
const MID_CLOUD: CloudPart = { from: 37, to: 69, puffs: [[47, 20, 7], [58, 20, 7]] }
const RIGHT_CLOUD: CloudPart = { from: 60, to: 92, puffs: [[69, 20.5, 6.5], [79, 21.5, 6.5], [88, 24, 5]] }

type Tone = { readonly body: string; readonly shade: string; readonly light: string }
/** はれた日の 白い雲 と、雨を ふらせる 灰色の 雨雲 */
const WHITE_TONE: Tone = { body: '#f8fbfe', shade: '#dbe5f0', light: '#ffffff' }
const RAIN_TONE: Tone = { body: '#a3b0c2', shade: '#8494aa', light: '#c3cddb' }

type PartMove = { readonly part: CloudPart; readonly x: number; readonly y: number }

function PartShape({ part, glint, tone }: { readonly part: CloudPart; readonly glint: boolean; readonly tone: Tone }) {
  if (glint) {
    return (
      <>
        {part.puffs.map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx - r * 0.35} cy={cy - r * 0.35} r={r * 0.32} fill={tone.light} opacity="0.85" />
        ))}
      </>
    )
  }
  return (
    <>
      <rect x={part.from} y={SLAB_TOP} width={part.to - part.from} height={BASE_Y - SLAB_TOP} rx="4" />
      {part.puffs.map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
      ))}
    </>
  )
}

/** 雲を 1つの色で ぬる。かげ → 色の面 → 左上の ハイライト の じゅん */
function CloudTone({ moves, tone }: { readonly moves: readonly PartMove[]; readonly tone: Tone }) {
  return (
    <>
      <g fill={tone.shade} transform={`translate(0 ${SHADE_BAND})`}>
        {moves.map((m, i) => (
          <Layer key={i} x={m.x} y={m.y}>
            <PartShape part={m.part} glint={false} tone={tone} />
          </Layer>
        ))}
      </g>
      <g fill={tone.body}>
        {moves.map((m, i) => (
          <Layer key={i} x={m.x} y={m.y}>
            <PartShape part={m.part} glint={false} tone={tone} />
          </Layer>
        ))}
      </g>
      <g>
        {moves.map((m, i) => (
          <Layer key={i} x={m.x} y={m.y}>
            <PartShape part={m.part} glint tone={tone} />
          </Layer>
        ))}
      </g>
    </>
  )
}

function Cloud({ t }: SceneProps) {
  // 左から・上から・右から 雲が あつまって、1つの 大きな 雨雲に なる
  const gather = span(t, GATHER, 2.2, easeOut)
  const rightX = 34 - 4 * span(t, 0, GATHER) - 30 * span(t, GATHER, 2.2, easeInOut)
  const moves: readonly PartMove[] = [
    { part: LEFT_CLOUD, x: -48 * (1 - gather), y: 0 },
    { part: MID_CLOUD, x: 0, y: -35 * (1 - gather) },
    { part: RIGHT_CLOUD, x: rightX, y: 0 },
  ]
  const dark = span(t, 1.6, DARK)
  // ぴかっと光ったとき、雲が ぶるっと ふるえる
  const shake = t >= BOLT && t < BOLT + 0.5 ? wave(t, 0.08) * (1 - span(t, BOLT, BOLT + 0.5)) * 0.9 : 0
  return (
    <Layer x={shake}>
      <CloudTone moves={moves} tone={WHITE_TONE} />
      <Layer opacity={dark}>
        <CloudTone moves={moves} tone={RAIN_TONE} />
      </Layer>
    </Layer>
  )
}

/* ───────── 雨 ───────── */

/** 雨は ほんの少し 左へ ななめに おちる(1下がると 左へ SLANT) */
const SLANT = -0.19
const RAIN_SPEED = 32

/**
 * しずく1つ。x, y は、字になる しゅんかん(INK)に いる場所。
 * kind: streak = 長い すじ(2画目) / drop = ふとい しずく(5〜8画目) / thin = 小さな すじ
 */
type Fall = { readonly x: number; readonly y: number; readonly kind: 'streak' | 'drop' | 'thin'; readonly top: number; readonly bottom: number; readonly speed: number }

const FALLS: readonly Fall[] = [
  { x: 16.3, y: 46, kind: 'streak', top: 31, bottom: 48, speed: 1 },
  { x: 37.7, y: 38, kind: 'drop', top: 31, bottom: 48, speed: 1 },
  { x: 36.1, y: 46.8, kind: 'drop', top: 31, bottom: 48, speed: 1 },
  { x: 70.1, y: 35, kind: 'drop', top: 31, bottom: 48, speed: 1 },
  { x: 69.6, y: 44, kind: 'drop', top: 31, bottom: 48, speed: 1 },
  { x: 25, y: 38, kind: 'thin', top: 31, bottom: 44, speed: 1.15 },
  { x: 60, y: 40, kind: 'thin', top: 31, bottom: 48, speed: 0.9 },
  { x: 80, y: 36, kind: 'thin', top: 31, bottom: 48, speed: 1.1 },
  { x: 89, y: 50, kind: 'thin', top: 31, bottom: 95, speed: 1.3 },
]

const LEN = { streak: 17, drop: 0, thin: 6 } as const

function Rain({ t }: SceneProps) {
  const show = span(t, RAIN_AT, RAIN_AT + 0.4)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {FALLS.map((f, i) => {
        const height = f.bottom - f.top
        const travelled = (f.y - f.top + (t - INK) * RAIN_SPEED * f.speed) % height
        const y = f.top + (travelled + height) % height
        const x = f.x + (y - f.y) * SLANT
        if (f.kind === 'drop') {
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(10.8)`}>
              <path d="M0 -3.8 C1.2 -1.4 2.4 -0.2 2.4 1.3 A2.4 2.4 0 0 1 -2.4 1.3 C-2.4 -0.2 -1.2 -1.4 0 -3.8 Z" fill={DROP} />
              <circle cx="-0.8" cy="0.6" r="0.7" fill={DROP_LIGHT} />
            </g>
          )
        }
        const len = LEN[f.kind]
        return <path key={i} d={`M${x - SLANT * len} ${y - len} L${x} ${y}`} stroke={f.kind === 'streak' ? RAIN : DROP} strokeWidth={f.kind === 'streak' ? 1.5 : 1.1} strokeLinecap="round" />
      })}
    </g>
  )
}

/** じめんの みずたまり の わ */
function Ripples({ t }: SceneProps) {
  const show = span(t, RAIN_AT + 0.3, RAIN_AT + 0.8)
  if (show <= 0) return null
  return (
    <g opacity={show} fill="none" stroke="#ffffff" strokeWidth="0.7">
      {[
        { x: 30, off: 0 },
        { x: 46, off: 0.5 },
        { x: 66, off: 0.3 },
        { x: 84, off: 0.7 },
      ].map(({ x, off }) => {
        const p = (t * 1.1 + off) % 1
        return <ellipse key={x} cx={x} cy="98.6" rx={1 + p * 5} ry={0.3 + p * 1} opacity={1 - p} />
      })}
    </g>
  )
}

/* ───────── いなずま ───────── */

/** 雲の そこ から じめんへ ぎざぎざに 走り、じめんで 左から 右へ ひろがる(4画目・13画目の あたり) */
const BOLT_PATH =
  'M51.5 29 L49.2 37 L53.6 41 L50.4 50.5 L54 55 L49.6 66 L53 71 L49.8 82 L52.5 86.5 L51 94.5 L58 92.5 L63 96 L71 93.5 L77 96.5 L84 92 L88.5 87 L90.5 84.5'

function Bolt({ t }: SceneProps) {
  if (t < BOLT) return null
  const draw = span(t, BOLT, BOLT + 0.16)
  // ぴかっと 強く光ったあと、やわらかく のこる
  const strong = 1 - span(t, BOLT, BOLT + 0.9)
  const flicker = 0.62 + 0.38 * Math.abs(wave(t, 0.5))
  const o = Math.min(1, 0.55 * flicker + 0.45 * strong + 0.2)
  const dash = { pathLength: 1, strokeDasharray: `${draw} 2`, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'miter' } as const
  const burst = span(t, BOLT, BOLT + 0.45, easeOut)
  return (
    <g opacity={o}>
      <circle cx="52" cy="29" r={Math.max(0, 3 + burst * 7)} fill={FLASH} opacity={(1 - burst) * 0.9} />
      <path d={BOLT_PATH} stroke={BOLT_GLOW} strokeWidth="8" opacity="0.4" {...dash} />
      <path d={BOLT_PATH} stroke={BOLT_BODY} strokeWidth="3.4" {...dash} />
      <path d={BOLT_PATH} stroke="#ffffff" strokeWidth="1.3" {...dash} />
    </g>
  )
}

/* ───────── 子ども(主役) ───────── */

type Mood = 'happy' | 'worried' | 'calm' | 'startled' | 'amazed'

/** 子どもの 場所。足もと・かた・あたま */
const CX = 13.5
const FEET_Y = 96
const HEAD: readonly [number, number] = [CX, 60]
const SHOULDER_L: readonly [number, number] = [9, 69]
const SHOULDER_R: readonly [number, number] = [18, 69]
const UPPER_ARM = 6.8
const FORE_ARM = 7.4
/** かさの え を もつ 手の 場所(かさの じく) */
const UMBRELLA_X = 21.5
const UMBRELLA_HAND_Y = 67

/** うで の かっこう(ま下を 0 度として、まえへ 回した角度)。かた → ひじ → 手 の じゅんに つながる */
type ArmPose = { readonly upper: number; readonly fore: number }

const rad = (deg: number) => (deg * Math.PI) / 180

function Arm({ shoulder, pose }: { readonly shoulder: readonly [number, number]; readonly pose: ArmPose }) {
  const elbow = [shoulder[0] + Math.sin(rad(pose.upper)) * UPPER_ARM, shoulder[1] + Math.cos(rad(pose.upper)) * UPPER_ARM] as const
  const hand = [elbow[0] + Math.sin(rad(pose.fore)) * FORE_ARM, elbow[1] + Math.cos(rad(pose.fore)) * FORE_ARM] as const
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={COAT_DARK} strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.3" fill={SKIN} />
    </>
  )
}

function Face({ mood, look }: { readonly mood: Mood; readonly look: readonly [number, number] }) {
  const [hx, hy] = HEAD
  const eyes = [hx - 2.7, hx + 2.7]
  const ey = hy + 0.6
  const [lx, ly] = look
  return (
    <>
      <circle cx={hx - 4.4} cy={hy + 2.8} r="1.3" fill={CHEEK} opacity="0.55" />
      <circle cx={hx + 4.4} cy={hy + 2.8} r="1.3" fill={CHEEK} opacity="0.55" />
      {mood === 'happy' && (
        <>
          {eyes.map((x) => (
            <path key={x} d={`M${x - 1.2} ${ey + 0.6} Q${x} ${ey - 1.3} ${x + 1.2} ${ey + 0.6}`} fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          ))}
          <path d={`M${hx - 1.9} ${hy + 3.4} Q${hx} ${hy + 5.6} ${hx + 1.9} ${hy + 3.4}`} fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'worried' && (
        <>
          {eyes.map((x) => (
            <circle key={x} cx={x + lx} cy={ey + ly} r="1.1" fill={EYE} />
          ))}
          <path d={`M${eyes[0] - 1.6} ${ey - 2.1} L${eyes[0] + 1.3} ${ey - 3.4} M${eyes[1] - 1.3} ${ey - 3.4} L${eyes[1] + 1.6} ${ey - 2.1}`} stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <path d={`M${hx - 1.5} ${hy + 4.8} Q${hx} ${hy + 3.3} ${hx + 1.5} ${hy + 4.8}`} fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
        </>
      )}
      {mood === 'calm' && (
        <>
          {eyes.map((x) => (
            <circle key={x} cx={x + lx} cy={ey + ly} r="1.1" fill={EYE} />
          ))}
          <path d={`M${hx - 1.9} ${hy + 3.5} Q${hx} ${hy + 5.4} ${hx + 1.9} ${hy + 3.5}`} fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'startled' && (
        <>
          {eyes.map((x) => (
            <g key={x}>
              <circle cx={x} cy={ey} r="2.1" fill="#ffffff" stroke="#c9d2de" strokeWidth="0.5" />
              <circle cx={x} cy={ey} r="0.85" fill={EYE} />
            </g>
          ))}
          <path d={`M${eyes[0] - 1.8} ${ey - 3.2} Q${eyes[0]} ${ey - 4.4} ${eyes[0] + 1.8} ${ey - 3.2} M${eyes[1] - 1.8} ${ey - 3.2} Q${eyes[1]} ${ey - 4.4} ${eyes[1] + 1.8} ${ey - 3.2}`} fill="none" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <ellipse cx={hx} cy={hy + 4.4} rx="1.3" ry="1.8" fill={MOUTH} />
        </>
      )}
      {mood === 'amazed' && (
        <>
          {eyes.map((x) => (
            <g key={x}>
              <circle cx={x + lx} cy={ey + ly} r="1.6" fill={EYE} />
              <circle cx={x + lx - 0.5} cy={ey + ly - 0.5} r="0.55" fill="#ffffff" />
            </g>
          ))}
          <path d={`M${hx - 2.3} ${hy + 3.1} Q${hx} ${hy + 7.2} ${hx + 2.3} ${hy + 3.1} Z`} fill={MOUTH} />
        </>
      )}
    </>
  )
}

type ChildProps = {
  readonly mood: Mood
  readonly look: readonly [number, number]
  readonly leftArm: ArmPose
  readonly rightArm: ArmPose
  readonly headTilt: number
  readonly umbrella: number
}

function Umbrella({ open }: { readonly open: number }) {
  if (open <= 0) return null
  const u = UMBRELLA_X
  return (
    <Layer scale={Math.max(0, 0.15 + 0.85 * open)} origin={[u, UMBRELLA_HAND_Y]}>
      <path d={`M${u} ${UMBRELLA_HAND_Y} L${u} 39.6`} stroke="#4a4a52" strokeWidth="1.1" strokeLinecap="round" />
      <path
        d={`M${u - 12.5} 51 C${u - 12.5} 44 ${u - 6} 40 ${u} 40 C${u + 6} 40 ${u + 12.5} 44 ${u + 12.5} 51 Q${u + 8.3} 48.6 ${u + 4.2} 51 Q${u} 48.6 ${u - 4.2} 51 Q${u - 8.3} 48.6 ${u - 12.5} 51 Z`}
        fill={UMBRELLA}
      />
      <path d={`M${u} 40 Q${u - 3.2} 45 ${u - 4.2} 51 M${u} 40 Q${u + 3.2} 45 ${u + 4.2} 51`} fill="none" stroke={UMBRELLA_DARK} strokeWidth="0.9" strokeLinecap="round" />
      <circle cx={u} cy="39.4" r="1" fill={UMBRELLA_DARK} />
    </Layer>
  )
}

function Child({ mood, look, leftArm, rightArm, headTilt, umbrella }: ChildProps) {
  const [hx, hy] = HEAD
  return (
    <>
      {/* あし と くつ(こし から) */}
      <rect x="9.4" y="82" width="3.6" height="11.6" rx="1.8" fill="#3e5c86" />
      <rect x="14" y="82" width="3.6" height="11.6" rx="1.8" fill="#34507a" />
      <ellipse cx="11.2" cy="94.4" rx="3.5" ry="2" fill={BOOT} />
      <ellipse cx="15.8" cy="94.4" rx="3.5" ry="2" fill={BOOT} />
      {/* くび(みじかく、どう と あたま の間) */}
      <rect x={hx - 1.5} y="64.2" width="3" height="3.6" rx="1.2" fill={SKIN_SHADE} />
      {/* どう: きいろい かっぱ */}
      <rect x="8" y="66.5" width="11" height="18" rx="4.5" fill={COAT} />
      <path d="M13.5 69 V83" stroke={COAT_DARK} strokeWidth="1" strokeLinecap="round" />
      <circle cx="12" cy="74" r="0.7" fill={COAT_DARK} />
      <circle cx="12" cy="78.5" r="0.7" fill={COAT_DARK} />
      {/* うで: かた から ひじ を とおって 手へ */}
      <Arm shoulder={SHOULDER_L} pose={leftArm} />
      <Arm shoulder={SHOULDER_R} pose={rightArm} />
      {/* あたま */}
      <Layer rotate={headTilt} origin={[hx, hy + 5]}>
        <circle cx={hx} cy={hy} r="6.8" fill={SKIN} />
        <path d={`M${hx - 7} ${hy - 1} C${hx - 7.4} ${hy - 9.5} ${hx + 7.4} ${hy - 9.5} ${hx + 7} ${hy - 1} C${hx + 4} ${hy - 4} ${hx - 3} ${hy - 4.5} ${hx - 7} ${hy - 1} Z`} fill={HAIR} />
        <Face mood={mood} look={look} />
      </Layer>
      <Umbrella open={umbrella} />
    </>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 13)
  const dark = span(t, 1.2, DARK)

  // ぴかっ: 白い光が ぱっと ひろがり、すこし おいて もう一度 ちらつく
  const flash = Math.max(t >= BOLT ? (1 - span(t, BOLT, BOLT + 0.5, easeOut)) * 0.8 : 0, t >= BOLT + 0.4 ? (1 - span(t, BOLT + 0.4, BOLT + 0.8)) * 0.45 : 0)
  const glassFlash = Math.min(1, flash * 1.2)

  // 子どもの きもち: ごきげん → 心ぱい → ほっ → びっくり → わあ
  const mood: Mood = t < 1.4 ? 'happy' : t < OPEN + 0.5 ? 'worried' : t < BOLT ? 'calm' : t < AMAZED ? 'startled' : 'amazed'
  const look: readonly [number, number] = mood === 'worried' ? [0.4, -0.9] : mood === 'amazed' ? [0.7, -0.4] : [0, 0]
  const hop = t < 1.4 ? Math.abs(wave(t, 0.9)) * 1.3 : 0
  const jump = Math.sin(span(t, BOLT, BOLT + 0.45) * Math.PI) * 5.5
  const sway = t >= BOLT && t < AMAZED ? wave(t, 0.14) * 1.6 : 0

  // かさ: ひらく ちょっと前に うでを あげて えを にぎる
  const raise = span(t, OPEN - 0.4, OPEN + 0.1, easeInOut)
  const rightArm: ArmPose = { upper: mix(t, OPEN - 0.4, OPEN + 0.1, 10, 40), fore: mix(t, OPEN - 0.4, OPEN + 0.1, 5, 187.2) }
  // びっくり: ひだりの手を ほっぺの よこへ
  const cover = span(t, BOLT, BOLT + 0.1) * (1 - span(t, BOLT + 0.9, BOLT + 1.3))
  const leftArm: ArmPose = { upper: -10 + -70 * cover, fore: -5 + 160.8 * cover }
  const headTilt = mood === 'worried' ? -4 : mood === 'startled' ? 3 + sway : mood === 'amazed' ? -3 : 0
  const umbrella = Math.max(0, span(t, OPEN, OPEN + 0.5, backOut)) * (raise > 0 ? 1 : 0)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <House dark={dark} flash={glassFlash} />
        <Ripples t={t} />
        <Rain t={t} />
        <ellipse cx={CX} cy="97" rx={Math.max(0, 8 - jump * 0.5)} ry="1.9" fill="#000000" opacity="0.13" />
        <Layer y={-hop - jump} rotate={sway} origin={[CX, FEET_Y]}>
          <Child mood={mood} look={look} leftArm={leftArm} rightArm={rightArm} headTilt={headTilt} umbrella={umbrella} />
        </Layer>
        {/* くらい空: 雲が あつまるほど 空が くらくなる */}
        <rect x="0" y="0" width="109" height="109" fill={SKY_DIM} opacity={0.2 * dark} />
        <Cloud t={t} />
        <Bolt t={t} />
        <rect x="0" y="0" width="109" height="109" fill={FLASH} opacity={flash} />
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
    { at: 0, label: 'はれた空。子どもが ごきげん', sound: 'pop' },
    { at: GATHER, label: '雲が あつまって 空が くらくなる' },
    { at: OPEN, label: '子どもが かさを ひらく', sound: 'pop' },
    { at: RAIN_AT, label: '雨が ぽつぽつ ふりだす' },
    { at: BOLT, label: 'ぴかっ! いなずまが おちる', sound: 'pop' },
    { at: AMAZED, label: 'こわくない。「わあ、すごい」' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '電 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
