/*
 * 回(まわる): 水が ぐるぐる うずを まく。
 *
 * ほね(画と絵の対応)
 *   1・2・6画目(囗) … そとがわの 大きな うず(いけの 水が ぐるっと まわる いちばん そと の わ)
 *   3・4・5画目(口) … うずの まんなか。葉っぱが まわる、ちいさな わ
 *   (池は ななめ上から見た 楕円なので、字の 四角と ぴったりは 重ならない。だいたい 同じ場所・同じ大きさ)
 *
 * ながれ
 *   池が できる → アヒルが のんびり およいでくる(ひまそう)
 *   → 葉っぱが ひらひら おちて、ぽちゃん。アヒルが「おっ」と おどろく
 *   → 葉っぱの まわりを ぐるぐる およぐ。アヒルが かく水が うずに なって、葉っぱも くるくる まわる(たのしい)
 *   → アヒルは 目が まわる
 *   → うずの わ が 字の 形に そろって、ほね が ひかり、絵が うすくなって 字「回」になる
 *
 * アヒルは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   くび は みじかく、あたま は どう の まえの上。はね は どう の よこ。水に ういて、おなか は 水の中。
 *   およぐ むきに 合わせて、体ごと 左右を むく。
 */
import { backOut, during, easeInOut, easeIn, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '回'

const GRASS = '#c5e8a9'
const BLADE = '#55b86e'
const BANK = '#e8d9a8'
const WATER = '#7cc4f2'
const WATER_DEEP = '#5aaee8'
const WATER_HOLE = '#4a96d8'
const WATER_LIGHT = '#e8f6ff'
const PAD = '#55b86e'
const PAD_LIGHT = '#8bd69a'
const DUCK = '#ffd84a'
const DUCK_DARK = '#f0b929'
const BILL = '#ff9a3c'
const CHEEK = '#ff9d9d'
const EYE = '#2b2b2b'
const LEAF = '#e8734a'
const LEAF_VEIN = '#b94f2c'

/** くぎり の時間(秒) */
const ENTER = 0.9
const FALL = 1.4
const SWIM = 2.2
const DIZZY = 4.8
const INK = 6.6
const DONE = 9.2
const DURATION = 9.8

/** うずの まんなか。池を ななめ上から見るので、まるい わ は よこ長の だ円になる */
const CENTER: readonly [number, number] = [54.5, 54]
const OUTER_RX = 36
const OUTER_RY = 27
/** アヒルが およぐ わ(そとの わ の すこし 内がわ) */
const SWIM_RX = 31
const SWIM_RY = 22
/** 葉っぱが まわる わ */
const LEAF_RX = 12
const LEAF_RY = 8.5
/** およぎはじめの 角度(度)。ここなら アヒルは 右むきの まま */
const START_ANGLE = 200
const LAPS = 2

const rad = (deg: number) => (deg * Math.PI) / 180

/** うずまき の線(だ円に つぶした ずるまき)。rot で まわる。 */
function spiralPoints(cx: number, cy: number, rx: number, ry: number, turns: number, rot: number, offset: number): string {
  const steps = Math.round(turns * 48)
  return Array.from({ length: steps + 1 }, (_, i) => {
    const k = i / steps
    const angle = k * turns * Math.PI * 2 + rot + offset
    const r = 0.08 + 0.92 * k
    return `${(cx + Math.cos(angle) * rx * r).toFixed(2)},${(cy + Math.sin(angle) * ry * r).toFixed(2)}`
  }).join(' ')
}

function Backdrop({ t }: SceneProps) {
  const pond = span(t, 0, 0.8, backOut)
  return (
    <>
      <rect x="0" y="0" width="109" height="109" fill={GRASS} />
      {[[6, 100], [26, 104], [60, 103], [92, 101], [102, 12], [8, 10]].map(([x, y]) => (
        <path key={`${x}-${y}`} d={`M${x} ${y} l1.4 -3.8 l1 3.4 l1.6 -4.4 l0.8 4.8 Z`} fill={BLADE} />
      ))}
      <Layer scale={pond} origin={CENTER}>
        {/* きし、池の ふち(下に 少し ずらして ふかさを 出す)、水 */}
        <ellipse cx={CENTER[0]} cy={CENTER[1] + 1.5} rx="49" ry="40" fill={BANK} />
        <ellipse cx={CENTER[0]} cy={CENTER[1] + 2.4} rx="45" ry="36.5" fill={WATER_DEEP} />
        <ellipse cx={CENTER[0]} cy={CENTER[1]} rx="45" ry="36" fill={WATER} />
        <path d="M18 34 Q24 26 34 23" fill="none" stroke={WATER_LIGHT} strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
      </Layer>
      <Layer scale={pond} origin={CENTER}>
        {/* はすの葉: ふちに うかぶ */}
        <ellipse cx="86" cy="30" rx="6" ry="3" fill={PAD} />
        <path d="M86 30 L91.4 28.4" stroke={WATER} strokeWidth="1.4" />
        <ellipse cx="85.4" cy="29.4" rx="3.4" ry="1.4" fill={PAD_LIGHT} />
        <ellipse cx="22" cy="76" rx="5.4" ry="2.8" fill={PAD} />
        <path d="M22 76 L17 77.6" stroke={WATER} strokeWidth="1.4" />
      </Layer>
    </>
  )
}

/** 水の うず。アヒルが およぐほど 強くなる。うで が 2本の うずまき が まわる。 */
function Swirl({ t, strength }: { readonly t: number; readonly strength: number }) {
  if (strength <= 0) return null
  // アヒルと おなじ むき(右まわり)に ながれる
  const rot = t * 2.4
  return (
    <g opacity={strength}>
      <ellipse cx={CENTER[0]} cy={CENTER[1]} rx={7.5 * strength} ry={5 * strength} fill={WATER_HOLE} />
      {[0, Math.PI].map((offset) => (
        <g key={offset}>
          <polyline points={spiralPoints(CENTER[0], CENTER[1] + 1, OUTER_RX, OUTER_RY, 1.7, rot, offset)} fill="none" stroke={WATER_DEEP} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
          <polyline points={spiralPoints(CENTER[0], CENTER[1], OUTER_RX, OUTER_RY, 1.7, rot, offset)} fill="none" stroke={WATER_LIGHT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ))}
    </g>
  )
}

/** 葉っぱの かたち(上から見た 1まい)。よこに つぶして、水の上に うかぶ。 */
function LeafShape({ flat }: { readonly flat: number }) {
  return (
    <g transform={`scale(1 ${flat})`}>
      <path d="M0 -5 Q4.6 -1.4 0 5 Q-4.6 -1.4 0 -5 Z" fill={LEAF} />
      <path d="M0 -4.4 L0 5.6" stroke={LEAF_VEIN} strokeWidth="0.8" strokeLinecap="round" />
    </g>
  )
}

/** 空から おちてきて、池の まんなか に うかび、うずに のって まわる葉っぱ。 */
function FallingLeaf({ t }: SceneProps) {
  if (t < FALL) return null
  const fall = span(t, FALL, SWIM - 0.2, easeIn)
  if (fall < 1) {
    const x = 56 + wave(t, 0.9) * 4 * (1 - fall)
    const y = -6 + fall * (CENTER[1] + 6)
    return (
      <Layer x={x} y={y} rotate={wave(t, 0.9) * 50}>
        <LeafShape flat={0.55 + 0.45 * Math.abs(wave(t, 0.7))} />
      </Layer>
    )
  }
  // うずに のって、だんだん ひろい わを えがいて まわる
  const start = SWIM + 0.2
  const reach = span(t, start, DIZZY, easeInOut)
  const turn = t < start ? 0 : (t - start) * 3.4 + 0.5 * (t - start) ** 2
  const x = CENTER[0] + Math.cos(turn) * LEAF_RX * reach
  const y = CENTER[1] + Math.sin(turn) * LEAF_RY * reach + wave(t, 1.1) * 0.4 * (1 - reach)
  return (
    <Layer x={x} y={y} rotate={(turn * 180) / Math.PI + 90}>
      <LeafShape flat={0.55} />
    </Layer>
  )
}

/** 葉っぱが おちた ところの わ。 */
function Plop({ t }: SceneProps) {
  const p = span(t, SWIM - 0.2, SWIM + 0.9, easeOut)
  if (p <= 0 || p >= 1) return null
  return <ellipse cx={CENTER[0]} cy={CENTER[1]} rx={3 + p * 13} ry={(3 + p * 13) * 0.72} fill="none" stroke="#ffffff" strokeWidth="1.2" opacity={(1 - p) * 0.9} />
}

type Mood = 'calm' | 'wow' | 'joy' | 'dizzy'

/** 目と くち。あたま の 右むき の かお。 */
function Face({ mood, t }: { readonly mood: Mood; readonly t: number }) {
  if (mood === 'dizzy') {
    // 目が まわる: うずまき の目
    const spin = t * 9
    return (
      <>
        <polyline points={spiralPoints(6.5, -10.6, 1.5, 1.5, 1.6, spin, 0)} fill="none" stroke={EYE} strokeWidth="0.55" strokeLinecap="round" />
        <path d="M8 -7.2 Q9.6 -6.4 11 -7.4" fill="none" stroke="#b9483f" strokeWidth="0.7" strokeLinecap="round" />
      </>
    )
  }
  if (mood === 'joy') {
    return <path d="M5.4 -10.4 Q6.5 -12 7.6 -10.4" fill="none" stroke={EYE} strokeWidth="0.85" strokeLinecap="round" />
  }
  if (mood === 'wow') {
    return (
      <>
        <circle cx="6.5" cy="-10.7" r="1.25" fill="#ffffff" />
        <circle cx="6.8" cy="-10.7" r="0.75" fill={EYE} />
      </>
    )
  }
  return <circle cx="6.5" cy="-10.6" r="0.85" fill={EYE} />
}

/** アヒル(右むき)。足もと(水めん)が 原点。あたま は どう の まえの上、くび は みじかい。 */
function Duck({ t, mood, paddle }: { readonly t: number; readonly mood: Mood; readonly paddle: number }) {
  const flap = wave(t, 0.34) * 9 * paddle
  return (
    <>
      {/* おしり の おなが(上に はねた しっぽ) */}
      <path d="M-5.6 -5.4 Q-10.2 -6 -11.4 -10.6 Q-7 -9.8 -3 -8.4 Z" fill={DUCK_DARK} />
      <ellipse cx="0" cy="-3.6" rx="7.2" ry="4.7" fill={DUCK} />
      <path d="M-5.6 -1.4 Q0 1 6 -1.4 Q0 -0.2 -5.6 -1.4 Z" fill={DUCK_DARK} opacity="0.7" />
      {/* はね: どう の よこ。およぐとき ぱたぱた する */}
      <Layer rotate={flap} origin={[-3.4, -4.6]}>
        <path d="M-3.4 -4.6 Q0 -7.4 4 -4.4 Q1 -1.4 -3.4 -4.6 Z" fill={DUCK_DARK} />
      </Layer>
      {/* あたま(どう に すこし かさなる) */}
      <circle cx="5.2" cy="-9.8" r="3.9" fill={DUCK} />
      <circle cx="4" cy="-7.8" r="1.2" fill={CHEEK} opacity="0.6" />
      {mood === 'wow' ? (
        <>
          <path d="M8.6 -10.6 Q11.6 -11.2 12 -9.8 L8.8 -9.6 Z" fill={BILL} />
          <path d="M8.8 -9 L11.8 -8.6 Q11.4 -7.2 8.6 -7.8 Z" fill={BILL} />
        </>
      ) : (
        <path d="M8.8 -10.4 Q12.4 -10.6 12.2 -8.8 Q11.4 -7.6 8.6 -7.8 Z" fill={BILL} />
      )}
      <Face mood={mood} t={t} />
    </>
  )
}

/** アヒルの まわりの 水の わ(体の したはんぶん は 水の中。およぐと 水が ゆれる) */
function Wake({ t, paddle, facing }: { readonly t: number; readonly paddle: number; readonly facing: number }) {
  const pulse = 0.5 + 0.5 * wave(t, 0.34)
  return (
    <>
      <ellipse cx="0" cy="0.3" rx="8.6" ry="2.3" fill={WATER} opacity="0.95" />
      <ellipse cx="0" cy="0.3" rx="8.8" ry="2.4" fill="none" stroke="#ffffff" strokeWidth="0.7" opacity="0.9" />
      {paddle > 0 && (
        <ellipse cx={-facing * (11 + pulse * 3)} cy="0.6" rx={4 + pulse * 3} ry={1.2 + pulse * 0.6} fill="none" stroke="#ffffff" strokeWidth="0.8" opacity={0.7 * (1 - pulse * 0.5)} />
      )}
    </>
  )
}

/** 目が まわった アヒルの あたまの上で、おほしさま が くるくる まわる。 */
function Dizzy({ t, x, y }: { readonly t: number; readonly x: number; readonly y: number }) {
  const show = during(t, DIZZY, INK - 0.1, 0.25)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 1, 2].map((i) => {
        const a = t * 5 + (i * Math.PI * 2) / 3
        return <Star key={i} cx={x + Math.cos(a) * 8} cy={y - 10 + Math.sin(a) * 2.6} r={1.9} color="#ffc233" spin={t * 120 + i * 50} />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  // アヒルの 動き: 左から およいできて、葉っぱの まわりを ぐるぐる 2しゅう
  const circling = t >= SWIM
  const turns = span(t, SWIM, INK - 0.2, easeInOut)
  const angle = START_ANGLE + 360 * LAPS * turns
  const startX = CENTER[0] + Math.cos(rad(START_ANGLE)) * SWIM_RX
  const startY = CENTER[1] + Math.sin(rad(START_ANGLE)) * SWIM_RY
  const duckX = circling ? CENTER[0] + Math.cos(rad(angle)) * SWIM_RX : mix(t, ENTER, SWIM, -14, startX, easeOut)
  const hop = Math.sin(span(t, FALL + 0.6, FALL + 1.0) * Math.PI) * 3
  const duckY = (circling ? CENTER[1] + Math.sin(rad(angle)) * SWIM_RY : startY) - hop
  // うしろ(上)ほど すこし 小さく。むきは およぐ むきに 合わせて ひっくり返す
  const depth = circling ? Math.sin(rad(angle)) : Math.sin(rad(START_ANGLE))
  const size = 1.4 + depth * 0.18
  const facing = circling ? Math.max(-1, Math.min(1, -Math.sin(rad(angle)) * 4)) : 1
  const heading = facing >= 0 ? 1 : -1
  const paddle = t < ENTER ? 0 : circling ? 1 : 0.4

  const mood: Mood = t >= DIZZY ? 'dizzy' : t >= SWIM ? 'joy' : t >= FALL + 0.5 ? 'wow' : 'calm'
  const strength = span(t, SWIM + 0.2, DIZZY, easeOut)
  const bob = Math.abs(wave(t, 0.8)) * 0.35

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} />
        <Plop t={t} />
        <Swirl t={t} strength={strength} />
        <FallingLeaf t={t} />
        <Layer opacity={span(t, ENTER - 0.1, ENTER + 0.2)}>
          <Layer x={duckX} y={duckY - bob}>
            <Layer scale={size} scaleX={size * facing}>
              <Duck t={t} mood={mood} paddle={paddle} />
            </Layer>
          </Layer>
          <Layer x={duckX} y={duckY} scale={size}>
            <Wake t={t} paddle={circling ? 1 : 0} facing={heading} />
          </Layer>
          <Dizzy t={t} x={duckX + 3 * facing * size} y={duckY - 8} />
        </Layer>
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
    { at: 0, label: '池が できる', sound: 'pop' },
    { at: ENTER, label: 'アヒルが のんびり およいでくる' },
    { at: FALL, label: '葉っぱが おちて、アヒルが おどろく', sound: 'pop' },
    { at: SWIM, label: '葉っぱの まわりを ぐるぐる およぐ。水が うずを まく' },
    { at: DIZZY, label: 'アヒルの 目が まわる' },
    { at: INK, label: 'うずの わ が そろい、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '回 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
