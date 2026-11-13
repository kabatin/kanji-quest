/*
 * 下(した): 地面の よこせん の 下に、もぐらが どんぐりを かくして しるしを つける。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 地面の ふち(くさの おび)。この 線より 上が 空、下が つちの中
 *   2画目(丨)  … 地面に あいた あなから、まっすぐ 下へ のびる もぐらの たてあな
 *   3画目(丶)  … たてあなの よこに ほった 小さな ななめあな。いちばん おくに どんぐり(しるし)
 *
 * ながれ
 *   地面ができて、どんぐりが ぽとん → もぐらが あるいてきて ひろい、にっこり
 *   → カラスが きた! もぐらは びっくり して あなに にげこむ
 *   → カラスは あなの上で きょろきょろ(つちの中は 見えない)
 *   → もぐらは つちの下で ななめあなを ほって、どんぐりを しまい、ほっと にっこり
 *   → ほね が ひかって、絵が うすくなり、字「下」が のこる
 *
 * もぐら・カラスは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   もぐらは はなが とがって 目が ちいさく、まえあしが シャベルの ように おおきい。
 *   あなの中では、あたまから すすみ、体は あなの みち に そって まがる。
 *   カラスは はねが せなか から出て、あしは 2ほん。おりる とき はねを ひろげ、とまると たたむ。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, linear, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '下'

const SUN = '#ffd24a'
const GRASS = '#69c25a'
const GRASS_LIGHT = '#92e27c'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const SOIL = '#c08a5c'
const SOIL_DEEP = '#a97449'
const SOIL_LIGHT = '#dcae82'
const PEBBLE = '#e3cfb4'
const TUNNEL = '#5a3b2a'
const TUNNEL_RIM = '#99683f'
const BODY = '#77687a'
const BODY_DARK = '#62566a'
const BODY_LIGHT = '#8e7f92'
const PINK = '#f4a9ab'
const PINK_DARK = '#e0707e'
const PINK_FAR = '#d98c94'
const CLAW = '#fff3ee'
const EYE = '#2b2b2b'
const MOUTH = '#a8505c'
const CHEEK = '#ff9d9d'
const NUT = '#c98a4b'
const NUT_LIGHT = '#e2a766'
const CAP = '#8c5b3c'
const CAP_DARK = '#70452b'
const CROW = '#323847'
const CROW_DARK = '#262b38'
const BEAK = '#e0a82e'
const SWEAT = '#7cc4f2'
const ALERT = '#e8534a'
const HEART = '#ff6f8f'

/** くぎり の時間(秒) */
const GROUND_END = 0.7
/** どんぐりが おちはじめる・ついた */
const FALL_AT = 0.5
const LAND_AT = 1.05
/** もぐらが あるいてくる・どんぐりの前で とまる */
const WALK_AT = 0.9
const STOP_AT = 2.1
/** どんぐりを ひろう */
const PICK_AT = 2.5
const PICK_END = 3.0
/** カラスが とんでくる */
const CROW_AT = 2.6
/** もぐらが カラスに 気づく */
const SCARE_AT = 3.2
/** あなへ はしる・あなに とびこむ */
const RUN_AT = 3.4
const DIVE_AT = 3.8
/** ななめあなを ほる・どんぐりを しまう・うしろへ さがる */
const DIG_AT = 4.5
const TUCK_AT = 5.4
const BACK_AT = 5.9
const BACK_END = 6.5
const INK = 7.0
const DONE = 9.6
const DURATION = 10.2

/* ───────── 地面の高さ(1画目) ───────── */

type Pt = readonly [number, number]

/** 1画目の 通り道(scene-info の点)。この線が 地面の ふち */
const LINE_PTS: readonly Pt[] = [
  [13.3, 22.5],
  [24.9, 22.9],
  [36.7, 21.8],
  [48.4, 20.8],
  [60.1, 19.8],
  [71.8, 19],
  [83.6, 18.5],
  [95.2, 19.7],
]

/** x の所の 地面の ふち の高さ(はしの外は 平ら) */
function lineY(x: number): number {
  const first = LINE_PTS[0]
  const last = LINE_PTS[LINE_PTS.length - 1]
  if (x <= first[0]) return first[1]
  for (let i = 1; i < LINE_PTS.length; i += 1) {
    const [x1, y1] = LINE_PTS[i]
    const [x0, y0] = LINE_PTS[i - 1]
    if (x <= x1) return y0 + (y1 - y0) * ((x - x0) / (x1 - x0))
  }
  return last[1]
}

/** くさの おび(はば 6)の 上はし。生きものは ここに 立つ */
const GRASS_HALF = 3
const groundTop = (x: number): number => lineY(x) - GRASS_HALF

/* ───────── もぐらの とおる みち ───────── */

/** たてあなの まんなか(2画目の x) */
const HOLE_X = 54.4
const CORNER_R = 6
const CORNER_X = HOLE_X - CORNER_R
/** たてあなから ななめあなへ わかれる 高さ */
const JUNCTION_Y = 30
/** もぐらの 体の中心から はな の先までの 長さ */
const NOSE_REACH = 13.4

/** 地面を あるくときの はな の高さ(足が 草の上に のる) */
const surfaceY = (x: number): number => groundTop(x - 7) - 6

type Cubic = readonly [Pt, Pt, Pt, Pt]

function cubicPoints([p0, p1, p2, p3]: Cubic, steps: number): Pt[] {
  return Array.from({ length: steps }, (_, i) => {
    const u = (i + 1) / steps
    const a = (1 - u) ** 3
    const b = 3 * (1 - u) ** 2 * u
    const c = 3 * (1 - u) * u ** 2
    const d = u ** 3
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]] as const
  })
}

/** 3画目の 線の式(scene-info): M67.83,37.17 C72.75,39.5 79.88,47.62 82,52.12 */
const STROKE3: Cubic = [[67.83, 37.17], [72.75, 39.5], [79.88, 47.62], [82, 52.12]]
/** たてあなから 3画目の はじまりまで つなぐ みち */
const LINK: Cubic = [[HOLE_X, JUNCTION_Y], [HOLE_X, 35.5], [62.5, 36.6], [67.83, 37.17]]

function buildPath(): Pt[] {
  const y1 = surfaceY(CORNER_X)
  const surface = Array.from({ length: 23 }, (_, i) => [-40 + i * 4, surfaceY(-40 + i * 4)] as const).filter(([x]) => x < CORNER_X)
  const corner = Array.from({ length: 7 }, (_, k) => {
    const phi = ((k / 6) * Math.PI) / 2
    return [CORNER_X + CORNER_R * Math.sin(phi), y1 + CORNER_R - CORNER_R * Math.cos(phi)] as const
  })
  return [...surface, ...corner, [HOLE_X, JUNCTION_Y] as const, ...cubicPoints(LINK, 8), ...cubicPoints(STROKE3, 12)]
}

const PATH: readonly Pt[] = buildPath()
/** みち の はじめから 各点までの 長さ */
const CUM: readonly number[] = PATH.reduce<number[]>((acc, p, i) => (i === 0 ? [0] : [...acc, acc[i - 1] + Math.hypot(p[0] - PATH[i - 1][0], p[1] - PATH[i - 1][1])]), [])
const PATH_END = CUM[CUM.length - 1]

/** みち の長さ s の所の 点 */
function at(s: number): Pt {
  if (s <= 0) return PATH[0]
  if (s >= PATH_END) return PATH[PATH.length - 1]
  const i = CUM.findIndex((len) => len >= s)
  const span01 = (s - CUM[i - 1]) / (CUM[i] - CUM[i - 1])
  const [x0, y0] = PATH[i - 1]
  const [x1, y1] = PATH[i]
  return [x0 + (x1 - x0) * span01, y0 + (y1 - y0) * span01]
}

/** 地面を あるく とき、はな が x に ある ところの s */
const sOnSurface = (x: number): number => CUM[PATH.findIndex(([px]) => px >= x)]
const S_APPEAR = sOnSurface(-4)
const S_STOP = sOnSurface(43)
const S_CORNER = sOnSurface(CORNER_X)
/** たてあなの わかれみち(はな が ここに来る) */
const S_JUNCTION = CUM[PATH.findIndex(([x, y]) => x === HOLE_X && y === JUNCTION_Y)]
/** ななめあなを ほりきる ところ。はな は すこし 手前で とまる */
const S_DUG = PATH_END - 5

/** もぐらの はな の長さ s と、体の中心・かたむき(みち に そって まがる) */
type Frame = { readonly cx: number; readonly cy: number; readonly angle: number }

function frameAt(s: number): Frame {
  const nose = at(s)
  const centre = at(s - NOSE_REACH)
  return { cx: centre[0], cy: centre[1], angle: (Math.atan2(nose[1] - centre[1], nose[0] - centre[0]) * 180) / Math.PI }
}

function noseS(t: number): number {
  if (t < RUN_AT) return mix(t, WALK_AT, STOP_AT, S_APPEAR, S_STOP, easeOut)
  if (t < DIVE_AT) return mix(t, RUN_AT, DIVE_AT, S_STOP, S_CORNER, easeIn)
  if (t < DIG_AT) return mix(t, DIVE_AT, DIG_AT, S_CORNER, S_JUNCTION, easeOut)
  if (t < TUCK_AT) return mix(t, DIG_AT, TUCK_AT, S_JUNCTION, S_DUG, easeInOut)
  if (t < BACK_AT) return S_DUG
  return mix(t, BACK_AT, BACK_END, S_DUG, S_DUG - 12, easeInOut)
}

/** 動いた いまの はやさ(0〜1)。あしを ふるか どうかに使う */
function speedAt(t: number): number {
  const dt = 0.03
  return Math.min(1, Math.abs(noseS(t + dt) - noseS(t - dt)) / (dt * 2 * 30))
}

type Mood = 'normal' | 'happy' | 'scared'

function moodAt(t: number): Mood {
  if (t < FALL_AT + 1.8) return 'normal'
  if (t < SCARE_AT) return 'happy'
  if (t < DIG_AT + 0.5) return 'scared'
  if (t < BACK_AT) return 'normal'
  return 'happy'
}

/* ───────── 空と地面 ───────── */

function Sky({ t }: SceneProps) {
  const pop = span(t, 0, 0.5, backOut)
  return (
    <>
      <Layer scale={pop} rotate={t * 12} origin={[97, 9]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="96.3" y="1.2" width="1.4" height="3" rx="0.7" fill={SUN} transform={`rotate(${i * 45} 97 9)`} />
        ))}
      </Layer>
      <circle cx="97" cy="9" r={4.4 * pop} fill={SUN} />
      {/* ゆっくり ながれる 雲(上の すきま) */}
      <g fill="#ffffff" opacity="0.92" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="16" cy="6.4" rx="6.4" ry="2.6" />
        <ellipse cx="20.5" cy="4.8" rx="4.4" ry="2.8" />
      </g>
    </>
  )
}

function Tuft({ x, t }: { readonly x: number; readonly t: number }) {
  const base = lineY(x) - 2
  return (
    <Layer rotate={wave(t, 2.6, x * 0.1) * 4} origin={[x, base]}>
      <path d={`M${x - 1.8} ${base} l0.4 -4.2 l1.3 3.2 l1.1 -4.6 l1 4.6 l1.3 -3 l0.3 4 Z`} fill={GRASS} />
    </Layer>
  )
}

/** 土・たてあな・草の おび。下から せりあがって あらわれる */
function Ground({ t, nook }: SceneProps & { readonly nook: string }) {
  const rise = span(t, 0, GROUND_END, easeOut)
  const soilEdge = LINE_PTS.map(([x, y]) => `L${x} ${y}`).join(' ')
  return (
    <Layer y={(1 - rise) * 18} opacity={rise}>
      <path d={`M-6 22.5 ${soilEdge} L116 19.7 V116 H-6 Z`} fill={SOIL} />
      <path d="M-6 66 Q22 59 50 67 T116 62 V116 H-6 Z" fill={SOIL_DEEP} />
      {/* こいし(あなから はなれた所) */}
      <g fill={PEBBLE}>
        <ellipse cx="18" cy="44" rx="3.2" ry="2.1" />
        <ellipse cx="34" cy="76" rx="3.6" ry="2.3" />
        <ellipse cx="14" cy="88" rx="2.6" ry="1.8" />
        <ellipse cx="90" cy="74" rx="3.4" ry="2.2" />
        <ellipse cx="100" cy="46" rx="2.6" ry="1.8" />
        <ellipse cx="76" cy="90" rx="3" ry="2" />
        <ellipse cx="36" cy="35" rx="2.2" ry="1.5" />
      </g>
      {/* 2画目: たてあな */}
      {/* ふちを ぜんぶ ぬってから、中の こい色を ぬる(つなぎ目に ふちが のこらない) */}
      <Bone char={CHAR} n={2} color={TUNNEL_RIM} width={13.4} />
      {nook !== '' && <path d={nook} fill="none" stroke={TUNNEL_RIM} strokeWidth="11.2" strokeLinecap="round" strokeLinejoin="round" />}
      <Bone char={CHAR} n={2} color={TUNNEL} width={11} />
      {nook !== '' && <path d={nook} fill="none" stroke={TUNNEL} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />}
      {/* 1画目: 草の おび */}
      <path d="M-6 22.5 L13.3 22.5 M95.2 19.7 L116 19.7" fill="none" stroke={GRASS} strokeWidth="6" strokeLinecap="round" />
      <Bone char={CHAR} n={1} color={GRASS} width={6} />
      <g transform="translate(0 -1.6)">
        <path d="M-6 22.5 L13.3 22.5 M95.2 19.7 L116 19.7" fill="none" stroke={GRASS_LIGHT} strokeWidth="1.6" strokeLinecap="round" />
        <Bone char={CHAR} n={1} color={GRASS_LIGHT} width={1.6} />
      </g>
      {[6, 28, 66, 80, 102].map((x) => (
        <Tuft key={x} x={x} t={t} />
      ))}
      {/* あなの 入り口 */}
      <ellipse cx={HOLE_X} cy={groundTop(HOLE_X) + 0.6} rx="7.4" ry="2.6" fill={TUNNEL_RIM} />
      <ellipse cx={HOLE_X} cy={groundTop(HOLE_X) + 0.2} rx="6.2" ry="1.9" fill={TUNNEL} />
    </Layer>
  )
}

/** もぐらが ほった ななめあなの 線(わかれみち から いまの はな の所まで)。ほっていなければ 空 */
function nookPath(s: number): string {
  const from = S_JUNCTION - 2
  if (s <= from) return ''
  const count = Math.max(2, Math.ceil((s - from) / 2))
  return Array.from({ length: count + 1 }, (_, i) => {
    const [x, y] = at(from + ((s - from) * i) / count)
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`
  }).join(' ')
}

/* ───────── どんぐり ───────── */

function Acorn({ x, y, rotate, scale = 1.15 }: { readonly x: number; readonly y: number; readonly rotate: number; readonly scale?: number }) {
  return (
    <Layer x={x} y={y} rotate={rotate} scale={scale}>
      <ellipse cx="0" cy="1.2" rx="2.6" ry="3.2" fill={NUT} />
      <ellipse cx="-0.9" cy="0.8" rx="0.8" ry="1.6" fill={NUT_LIGHT} />
      <path d="M-3.2 -0.6 Q-3 -3.8 0 -3.8 Q3 -3.8 3.2 -0.6 Z" fill={CAP} />
      <path d="M-1.6 -2.2 l1 1.4 M0.4 -2.6 l0.8 1.8" stroke={CAP_DARK} strokeWidth="0.5" strokeLinecap="round" />
      <rect x="-0.3" y="-5.4" width="0.7" height="1.8" rx="0.35" fill={CAP_DARK} />
    </Layer>
  )
}

/** どんぐりが おちる とき の ひらひら 葉(どこから おちたか わかる) */
function FallingLeaf({ t }: SceneProps) {
  const p = span(t, FALL_AT, FALL_AT + 1.2)
  if (p <= 0) return null
  const x = 40 - p * 3 + Math.sin(p * 9) * 4
  const y = -6 + p * (groundTop(38) + 4)
  return <path d="M0 -3 Q2.6 0 0 3 Q-2.6 0 0 -3 Z" fill={LEAF} stroke={LEAF_DARK} strokeWidth="0.4" transform={`translate(${x} ${y}) rotate(${Math.sin(p * 9) * 50 + 20})`} />
}

/* ───────── もぐら ───────── */

function Paw({ x, y, color }: { readonly x: number; readonly y: number; readonly color: string }) {
  return (
    <>
      <ellipse cx={x + 1.2} cy={y} rx="3.4" ry="2.1" fill={color} />
      <path d={`M${x + 3.8} ${y - 1.1} l1.4 0.2 M${x + 4} ${y} l1.5 0.1 M${x + 3.8} ${y + 1.1} l1.4 -0.1`} stroke={CLAW} strokeWidth="0.7" strokeLinecap="round" />
    </>
  )
}

type MoleProps = {
  readonly mood: Mood
  /** あし・まえあし の ふり(-1〜1)。あるく・ほる とき */
  readonly swing: number
}

/** 右を向いた もぐら。体の中心が (0, 0)、はな は (13.6, 0.6) */
function Mole({ mood, swing }: MoleProps) {
  const angle = swing * 26
  return (
    <>
      <ellipse cx="-9.2" cy="0.8" rx="2.2" ry="1.5" fill={PINK_FAR} />
      {/* むこうの うしろあし・まえあし */}
      <Layer rotate={-angle} origin={[-3.5, 2.8]}>
        <ellipse cx="-3.5" cy="5.4" rx="2.6" ry="1.5" fill={PINK_FAR} />
      </Layer>
      <Layer rotate={-angle} origin={[8, 2.4]}>
        <Paw x={7.2} y={4.3} color={PINK_FAR} />
      </Layer>
      <ellipse cx="0" cy="0.9" rx="8.4" ry="4.9" fill={BODY_DARK} />
      <ellipse cx="0" cy="0" rx="8.2" ry="4.7" fill={BODY} />
      <ellipse cx="-1.4" cy="-2.7" rx="4.6" ry="1.3" fill={BODY_LIGHT} />
      <circle cx="6.4" cy="-0.4" r="4.3" fill={BODY} />
      {/* はな: とがった さき(ほんものの もぐら の はな) */}
      <ellipse cx="11.2" cy="0.9" rx="3.1" ry="2.1" fill={PINK} />
      <circle cx="13.7" cy="0.6" r="1.1" fill={PINK_DARK} />
      <circle cx="8" cy="1.7" r="1.3" fill={CHEEK} opacity="0.55" />
      {mood === 'scared' ? (
        <>
          <circle cx="8.3" cy="-1.9" r="1.5" fill="#ffffff" />
          <circle cx="8.6" cy="-1.9" r="0.75" fill={EYE} />
          <ellipse cx="11" cy="2.5" rx="0.8" ry="1" fill={MOUTH} />
          <path d="M5.2 -6.4 Q6.6 -4.4 5.2 -3.4 Q3.8 -4.4 5.2 -6.4 Z" fill={SWEAT} />
        </>
      ) : mood === 'happy' ? (
        <>
          <path d="M7.4 -1.5 Q8.3 -3.2 9.3 -1.5" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M9.6 2.3 Q11.2 4 12.6 2.4" fill="none" stroke={MOUTH} strokeWidth="0.9" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="8.3" cy="-1.9" r="0.75" fill={EYE} />
          <path d="M10 2.4 Q11.2 3.2 12.4 2.5" fill="none" stroke={MOUTH} strokeWidth="0.8" strokeLinecap="round" />
        </>
      )}
      {/* てまえの うしろあし・まえあし(シャベルの ような おおきな て) */}
      <Layer rotate={angle} origin={[-3.5, 2.8]}>
        <ellipse cx="-3.5" cy="5.4" rx="2.6" ry="1.5" fill={PINK} />
      </Layer>
      <Layer rotate={angle} origin={[8.4, 2.4]}>
        <Paw x={7.6} y={4.2} color={PINK} />
      </Layer>
    </>
  )
}

/** ほっている とき、はな の前で はじける つちの つぶ */
function Crumbs({ t, nose, angle }: { readonly t: number; readonly nose: Pt; readonly angle: number }) {
  const show = during(t, DIG_AT + 0.1, TUCK_AT, 0.15)
  if (show <= 0) return null
  const rad = (angle * Math.PI) / 180
  const dir = [Math.cos(rad), Math.sin(rad)] as const
  return (
    <g opacity={show}>
      {[0, 1, 2, 3, 4].map((i) => {
        const p = (t * 2.6 + i / 5) % 1
        const spread = (i % 2 === 0 ? 1 : -1) * (1 + p * 5) * (0.55 + 0.18 * i)
        const x = nose[0] + dir[0] * (1.5 + p * 5) - dir[1] * spread
        const y = nose[1] + dir[1] * (1.5 + p * 5) + dir[0] * spread
        return <circle key={i} cx={x} cy={y} r={Math.max(0, 1.1 - p * 0.6)} fill={SOIL_LIGHT} opacity={1 - p} />
      })}
    </g>
  )
}

/** カラスを 見つけた しゅんかんの「!」 */
function Alert({ t, frame }: { readonly t: number; readonly frame: Frame }) {
  const show = during(t, SCARE_AT, SCARE_AT + 0.5, 0.1)
  if (show <= 0) return null
  const pop = span(t, SCARE_AT, SCARE_AT + 0.2, backOut)
  return (
    <Layer x={frame.cx + 8} y={frame.cy - 9} scale={0.85 * pop} opacity={show}>
      <rect x="-0.9" y="-4.6" width="1.8" height="4.4" rx="0.9" fill={ALERT} />
      <circle cx="0" cy="1.2" r="1.1" fill={ALERT} />
    </Layer>
  )
}

/** どんぐりを しまって ほっと した とき の ハート */
function Hearts({ t, frame }: { readonly t: number; readonly frame: Frame }) {
  const show = during(t, BACK_AT + 0.2, INK + 0.2, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.5].map((offset, i) => {
        const p = ((t - BACK_AT + offset) % 1) / 1
        return (
          <path
            key={offset}
            d="M0 1.6 C-3 -0.6 -1.6 -3 0 -1.4 C1.6 -3 3 -0.6 0 1.6 Z"
            fill={HEART}
            opacity={Math.sin(p * Math.PI)}
            transform={`translate(${frame.cx + 3 + i * 5 + Math.sin(p * 6) * 1} ${frame.cy - 8 - p * 6}) scale(${0.9 + i * 0.2})`}
          />
        )
      })}
    </g>
  )
}

/* ───────── カラス ───────── */

const CROW_X = 45
const CROW_Y = groundTop(CROW_X) - 6.8

/** 右を向いた カラス。体の中心が (0, 0) */
function Crow({ flap, legs, tilt }: { readonly flap: number; readonly legs: number; readonly tilt: number }) {
  return (
    <>
      <path d={`M-1 3 v${1 + legs * 2.8} M1.8 3 v${1 + legs * 2.8}`} stroke="#8a5a2e" strokeWidth="1" strokeLinecap="round" />
      <path d="M-5 -1.2 L-11.6 -2.8 L-11.8 1.4 L-5 2.2 Z" fill={CROW_DARK} />
      <ellipse cx="0" cy="0" rx="6.6" ry="3.7" fill={CROW} />
      {/* はね: せなか の かた から出る */}
      {flap < 0 ? (
        <ellipse cx="-1.8" cy="0.4" rx="5" ry="2.3" fill={CROW_DARK} />
      ) : (
        <Layer rotate={flap} origin={[-0.5, -1.5]}>
          <path d="M-0.5 -1.5 Q-2.5 -11 -12 -9.5 Q-8 -4 -3 0.6 Z" fill={CROW_DARK} />
        </Layer>
      )}
      <Layer rotate={tilt} origin={[5, -0.5]}>
        <circle cx="6.4" cy="-1.8" r="3" fill={CROW} />
        <path d="M8.8 -2.8 L13.4 -1.4 L8.8 -0.2 Z" fill={BEAK} />
        <circle cx="7.4" cy="-2.7" r="1" fill="#ffffff" />
        <circle cx="7.7" cy="-2.7" r="0.5" fill={EYE} />
        <path d="M5.8 -4.4 L8.8 -3.4" stroke={CROW_DARK} strokeWidth="0.9" strokeLinecap="round" />
      </Layer>
    </>
  )
}

function CrowActor({ t }: SceneProps) {
  if (t < CROW_AT || t > 6.5) return null
  const arrive = 3.9
  const landed = 4.3
  const leave = 5.6
  if (t < arrive) {
    const x = mix(t, CROW_AT, arrive, -14, 40, linear)
    const y = 6 + wave(t, 0.7) * 1.2
    return (
      <Layer x={x} y={y}>
        <Crow flap={wave(t, 0.22) * 38 - 10} legs={0} tilt={0} />
      </Layer>
    )
  }
  if (t < landed) {
    const p = span(t, arrive, landed, easeOut)
    return (
      <Layer x={mix(t, arrive, landed, 40, CROW_X, easeOut)} y={6 + (CROW_Y - 6) * p}>
        <Crow flap={wave(t, 0.22) * 38 * (1 - p) - 10 * (1 - p)} legs={p} tilt={0} />
      </Layer>
    )
  }
  if (t < leave) {
    // あなの上で くびを かしげて のぞきこむ(つちの中は 見えない)
    const hop = Math.max(0, Math.sin(span(t, 4.9, 5.2) * Math.PI)) * 1.6
    return (
      <Layer x={CROW_X} y={CROW_Y - hop}>
        <Crow flap={-1} legs={1} tilt={10 + wave(t, 0.9) * 12} />
      </Layer>
    )
  }
  const p = span(t, leave, 6.5, easeIn)
  return (
    <Layer x={mix(t, leave, 6.5, CROW_X, 125, easeIn)} y={CROW_Y - (CROW_Y + 12) * p}>
      <Crow flap={wave(t, 0.22) * 38 - 10} legs={0} tilt={0} />
    </Layer>
  )
}

/* ───────── 場面 ───────── */

/** もぐらの 体の中の 点(ローカル)を 世界の 座標へ */
function toWorld(frame: Frame, lx: number, ly: number): Pt {
  const rad = (frame.angle * Math.PI) / 180
  return [frame.cx + lx * Math.cos(rad) - ly * Math.sin(rad), frame.cy + lx * Math.sin(rad) + ly * Math.cos(rad)]
}

/** もぐらが どんぐりを だきかかえる 場所(あごの下) */
const CARRY: Pt = [12.2, 3.2]
/** ななめあなの いちばん おく(3画目の おわり)。どんぐりの しるし */
const ACORN_END: Pt = [80.6, 50.6]
const ACORN_REST: Pt = [47.5, groundTop(47.5) - 4.95]

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 3)

  const s = noseS(t)
  const base = frameAt(s)
  // びっくり して とびはねる / どんぐりを ひろうとき おじぎ / においを かぐ
  const hop = Math.sin(span(t, SCARE_AT, SCARE_AT + 0.3) * Math.PI) * 3
  const bow = Math.sin(span(t, PICK_AT, PICK_END) * Math.PI) * 14 + (t > STOP_AT && t < PICK_AT ? wave(t, 0.25) * 4 : 0)
  const onSurface = s < S_CORNER
  const speed = speedAt(t)
  const stride = Math.sin(t * Math.PI * 2 * 3.2) * speed
  const bob = onSurface ? -Math.abs(stride) * 0.9 : 0
  const frame: Frame = { cx: base.cx, cy: base.cy - (onSurface ? hop : 0) + bob, angle: base.angle + (onSurface ? bow : 0) }
  const digging = during(t, DIG_AT, TUCK_AT, 0.1)
  const tuck = during(t, TUCK_AT, BACK_AT, 0.1)
  const swing = digging > 0 ? Math.sin(t * Math.PI * 2 * 5) * digging : tuck > 0 ? Math.sin(t * Math.PI * 2 * 3) * 0.6 : stride
  const mood = moodAt(t)

  // どんぐり: ぽとんと おちる → ひろわれる → だいじに はこばれる → おくに しまわれる
  const fall = span(t, FALL_AT, LAND_AT, easeIn)
  const bounce = Math.sin(span(t, LAND_AT, LAND_AT + 0.3) * Math.PI) * 3.5
  const fallY = -10 + (ACORN_REST[1] + 10) * fall - bounce
  const pick = span(t, PICK_AT, PICK_END, easeInOut)
  const carried = toWorld(frame, CARRY[0], CARRY[1])
  const tuckP = span(t, TUCK_AT, BACK_AT, easeInOut)
  let acorn: { readonly x: number; readonly y: number; readonly r: number }
  if (t >= TUCK_AT) {
    acorn = { x: carried[0] + (ACORN_END[0] - carried[0]) * tuckP, y: carried[1] + (ACORN_END[1] - carried[1]) * tuckP, r: frame.angle + (40 - frame.angle) * tuckP }
  } else if (t >= PICK_AT) {
    acorn = { x: ACORN_REST[0] + (carried[0] - ACORN_REST[0]) * pick, y: ACORN_REST[1] + (carried[1] - ACORN_REST[1]) * pick - Math.sin(pick * Math.PI) * 3, r: frame.angle * pick }
  } else {
    acorn = { x: ACORN_REST[0], y: fallY, r: (1 - fall) * -40 }
  }

  const nosePoint = at(s)
  const nookS = t >= DIG_AT ? Math.max(s, mix(t, DIG_AT, TUCK_AT, S_JUNCTION, PATH_END, easeInOut)) : 0

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Ground t={t} nook={nookPath(Math.min(nookS, PATH_END))} />
        <FallingLeaf t={t} />
        <CrowActor t={t} />
        <Layer x={0} y={0} opacity={span(t, WALK_AT - 0.05, WALK_AT)}>
          <Layer x={frame.cx} y={frame.cy} rotate={frame.angle}>
            <Mole mood={mood} swing={swing} />
          </Layer>
        </Layer>
        <Crumbs t={t} nose={nosePoint} angle={frame.angle} />
        {t >= FALL_AT && <Acorn x={acorn.x} y={acorn.y} rotate={acorn.r} />}
        <Alert t={t} frame={frame} />
        <Hearts t={t} frame={frame} />
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
    { at: 0, label: '地面が できて、どんぐりが ぽとん', sound: 'pop' },
    { at: WALK_AT, label: 'もぐらが あるいてきて どんぐりを ひろう' },
    { at: CROW_AT, label: 'カラスが きた! もぐらは びっくり', sound: 'pop' },
    { at: RUN_AT, label: 'あなに とびこむ' },
    { at: DIG_AT, label: 'つちの 下で ななめあなを ほる' },
    { at: TUCK_AT, label: 'どんぐりを しまって、ほっと' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '下 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
