/*
 * 合(あう): いれものに ふたを かぶせる。ぴったり あう。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … ふた の 左がわ の すべりだい(てっぺんの つまみ から 左のふちへ)
 *   2画目(㇏)  … ふた の 右がわ の すべりだい(てっぺんから 右のふちへ)
 *   3画目(一)  … ふた の うらがわ の たいらな ところ(いれものに かぶさる 所)
 *   4画目(丨)  … いれもの の 左がわ
 *   5画目(𠃍)  … いれもの の ふち と 右がわ
 *   6画目(一)  … いれもの の そこ
 *
 * ながれ
 *   おだんごを いれた いれもの。カラスが とまって 「たべたいな」とのぞく
 *   → 男の子が 大きな ふたを かついで、あわてて はしってくる(しんぱい)
 *   → ふたが 頭の上に きて、カラスは おどろいて にげる
 *   → そっと おろして ふたを かぶせると、ぴったり あう。男の子は ほっと にっこり
 *   → ほね が ひかって、絵が うすくなり、字「合」が のこる
 *
 * 男の子と カラスは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがり、ふたを したから ささえる。くび は みじかい。
 *   カラスは はね が せなか から出て、くちばし で ついばむ。
 *   ふた は まんなかに つまみ、うらは たいら。いれものは ふち が ひろく、ふた が ちょうど のる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '合'

const SKIN = '#f8cfa6'
const HAIR = '#5a3b2a'
const SHIRT = '#ffb347'
const SHIRT_DARK = '#f09a2a'
const SHORTS = '#4f7fd0'
const SHOE = '#6b4a36'
const LID = '#3aa6a0'
const LID_DARK = '#2a8a86'
const LID_LIGHT = '#6cc8c2'
const BOX = '#e0644e'
const BOX_DARK = '#c4503c'
const BOX_RIM = '#f08a6c'
const DUMPLING = '#fff7ea'
const DUMPLING_SHADE = '#f1dfc7'
const CROW = '#3a3f4f'
const CROW_DARK = '#2b2f3b'
const CROW_LIGHT = '#565d73'
const BEAK = '#f2b632'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const SWEAT = '#7cc4f2'

/** くぎり の時間(秒) */
const CROW_IN = 1.0
const WALK_IN = 1.2
const ARRIVE = 3.0
const SPOOK = 3.1
const LOWER = 3.4
const LAND = 4.2
const INK = 5.9
const DONE = 8.8
const DURATION = 9.4

/** ふた を かついだときの つかみどころ(ふた の左はし)と、ふち の たかさ */
const GRIP: readonly [number, number] = [12, 60]
/** かついで はこぶとき: 右がわが 少し上がって、ぜんたいが 少し浮く */
const CARRY_TILT = -9
const CARRY_LIFT = 3
/** 男の子が ふた を つかむ 2つの場所(ふた の 左はし と その少し右。ふた の ざひょう) */
const HAND_L: readonly [number, number] = [10.8, 60.8]
const HAND_R: readonly [number, number] = [24.6, 60.8]
/** 男の子の あたま の まんなか */
const HEAD: readonly [number, number] = [17.5, 71]
/** カラスが とまる 場所(いれもの の 右の ふち の上) */
const PERCH: readonly [number, number] = [67, 61]

const rad = (deg: number) => (deg * Math.PI) / 180

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 94 V101 H-4 Z" fill="#e2f2d2" />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 84, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** おだんご: 白くて まるい。ごまが ひとつぶ。 */
function Dumpling({ cx, cy, r }: { readonly cx: number; readonly cy: number; readonly r: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={Math.max(0, r)} fill={DUMPLING_SHADE} />
      <circle cx={cx - 0.5} cy={cy - 0.7} r={Math.max(0, r * 0.88)} fill={DUMPLING} />
      <circle cx={cx + r * 0.25} cy={cy - r * 0.2} r="0.7" fill={HAIR} />
    </>
  )
}

/** いれもの: ふち が ひろい ぬりの はこ。おだんごが 山もり。(4〜6画目) */
function Box({ t }: SceneProps) {
  const pop = span(t, 0.15, 0.7, backOut)
  const dumpling = (from: number) => span(t, from, from + 0.4, backOut)
  return (
    <>
      <Layer scale={pop} origin={[49.5, 97]}>
        {/* おだんご(ふた を かぶせると かくれる) */}
        <Layer scale={dumpling(0.55)} origin={[40, 62]}>
          <Dumpling cx={40} cy={57} r={6.6} />
        </Layer>
        <Layer scale={dumpling(0.7)} origin={[53, 62]}>
          <Dumpling cx={53.5} cy={56} r={6.6} />
        </Layer>
        <Layer scale={dumpling(0.85)} origin={[63, 62]}>
          <Dumpling cx={62.5} cy={58} r={6} />
        </Layer>
        {/* はこ の ほんたい */}
        <rect x="28" y="62" width="43" height="35" rx="5" fill={BOX} />
        <rect x="28" y="88" width="43" height="9" rx="4.5" fill={BOX_DARK} />
        {/* ふち: ふた が のる ところ */}
        <rect x="25.5" y="60" width="48" height="6" rx="3" fill={BOX_RIM} />
        <circle cx="49.5" cy="78" r="3" fill={BOX_RIM} opacity="0.7" />
      </Layer>
      <ellipse cx="49.5" cy="98" rx="25" ry="2.6" fill="#000000" opacity="0.08" />
    </>
  )
}

/** ふた: てっぺんに つまみ、うらは たいら。(1〜3画目) */
function LidShape() {
  return (
    <>
      <path d="M49.5 12 L95 57 L11.5 57 Z" fill={LID} stroke={LID} strokeWidth="4" strokeLinejoin="round" />
      <path d="M49.5 12 L95 57 L57 57 Z" fill={LID_DARK} stroke={LID_DARK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M22 50 L45 24" fill="none" stroke={LID_LIGHT} strokeWidth="2.4" strokeLinecap="round" />
      <rect x="9.5" y="55" width="88" height="5.2" rx="2.6" fill={LID_DARK} />
      <circle cx="49.5" cy="9.6" r="3" fill={LID_DARK} />
      <circle cx="48.8" cy="8.9" r="1.1" fill={LID_LIGHT} />
    </>
  )
}

type LidMove = { readonly dx: number; readonly lift: number; readonly tilt: number; readonly squash: number }

/** ふた の ざひょう の点が、いま どこに あるか(手が ふた に ついていくため) */
function lidPoint(point: readonly [number, number], move: LidMove): readonly [number, number] {
  const dx = point[0] - GRIP[0]
  const dy = (point[1] - GRIP[1]) * move.squash
  const a = rad(move.tilt)
  return [GRIP[0] + dx * Math.cos(a) - dy * Math.sin(a), GRIP[1] + dx * Math.sin(a) + dy * Math.cos(a) - move.lift]
}

type Mood = 'worried' | 'happy'

/** かた から出て、ひじで まがる うで。ひじは 外がわに はりだす */
function Arm({ from, to, outward }: { readonly from: readonly [number, number]; readonly to: readonly [number, number]; readonly outward: number }) {
  const elbow = [(from[0] + to[0]) / 2 + outward * 2.4, (from[1] + to[1]) / 2 + 1] as const
  return <path d={`M${from[0]} ${from[1]} L${elbow[0]} ${elbow[1]} L${to[0]} ${to[1]}`} fill="none" stroke={SHIRT_DARK} strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
}

const SHOULDER_L: readonly [number, number] = [12.6, 79.6]
const SHOULDER_R: readonly [number, number] = [22.4, 79.6]

type BoyProps = { readonly step: number; readonly mood: Mood; readonly handL: readonly [number, number]; readonly handR: readonly [number, number]; readonly tilt: number }

/** 男の子(しゅやく)。ふたを 両手で かかえて はこぶ。 */
function Boy({ step, mood, handL, handR, tilt }: BoyProps) {
  const [hx, hy] = HEAD
  return (
    <>
      {/* あし: こしから ふる */}
      <Layer rotate={-step * 16} origin={[14.6, 88]}>
        <rect x="12.4" y="87" width="4.4" height="9" rx="2.2" fill={SHORTS} />
        <ellipse cx="15.2" cy="96.6" rx="3.6" ry="1.9" fill={SHOE} />
      </Layer>
      <Layer rotate={step * 16} origin={[20.4, 88]}>
        <rect x="18.2" y="87" width="4.4" height="9" rx="2.2" fill={SHORTS} />
        <ellipse cx="21" cy="96.6" rx="3.6" ry="1.9" fill={SHOE} />
      </Layer>
      {/* くび(みじかく) と どう */}
      <rect x="15.6" y="75.6" width="3.8" height="4" rx="1.6" fill={SKIN} />
      <rect x="11.4" y="77.6" width="12.2" height="12" rx="5.4" fill={SHIRT} />
      {/* あたま */}
      <Layer rotate={tilt} origin={[17.5, 76]}>
        <circle cx={hx} cy={hy} r="6.6" fill={SKIN} />
        <path d={`M${hx - 6.8} ${hy - 1} C${hx - 7} ${hy - 8.4} ${hx + 5.6} ${hy - 9} ${hx + 6.8} ${hy - 1.6} C${hx + 3} ${hy - 4.6} ${hx - 3.4} ${hy - 4.4} ${hx - 6.8} ${hy - 1} Z`} fill={HAIR} />
        <circle cx={hx + 4} cy={hy + 2.4} r="1.5" fill="#ff9d9d" opacity="0.6" />
        {mood === 'worried' ? (
          <>
            <path d={`M${hx + 0.4} ${hy - 2.4} l2.4 -0.9 M${hx + 5.4} ${hy - 3.4} l-2.2 0.9`} stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
            <circle cx={hx + 1.9} cy={hy - 0.2} r="0.95" fill="#2b2b2b" />
            <circle cx={hx + 5.2} cy={hy - 0.2} r="0.95" fill="#2b2b2b" />
            <path d={`M${hx + 2.6} ${hy + 3.7} q1.2 -1 2.4 0`} fill="none" stroke="#b9483f" strokeWidth="0.95" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d={`M${hx + 0.9} ${hy - 0.2} q1.1 -1.3 2.2 0 M${hx + 4.4} ${hy - 0.2} q1.1 -1.3 2.2 0`} fill="none" stroke="#2b2b2b" strokeWidth="0.95" strokeLinecap="round" />
            <path d={`M${hx + 2.2} ${hy + 2.4} q1.7 2.2 3.4 0 Z`} fill="#b9483f" />
          </>
        )}
      </Layer>
      <Arm from={SHOULDER_L} to={handL} outward={-1} />
      <Arm from={SHOULDER_R} to={handR} outward={1} />
    </>
  )
}

/** しんぱいの あせ。あたまの よこ から ひとつぶ。 */
function Sweat({ t }: SceneProps) {
  const show = during(t, WALK_IN + 0.4, LAND, 0.2)
  if (show <= 0) return null
  const p = (t % 0.8) / 0.8
  return <path d="M0 -2.2 Q1.9 0.6 0 1.9 Q-1.9 0.6 0 -2.2 Z" fill={SWEAT} opacity={show * (1 - p)} transform={`translate(${9 - p * 1.5} ${66 + p * 6})`} />
}

type CrowProps = { readonly t: number }

/** カラス: おだんごを ねらって とまり、ふたに おどろいて にげる。 */
function Crow({ t }: CrowProps) {
  const arrive = span(t, CROW_IN, CROW_IN + 0.9, easeOut)
  if (arrive <= 0) return null
  const leave = span(t, SPOOK + 0.2, SPOOK + 1.3, easeInOut)
  const flying = arrive < 1 || leave > 0
  // とんでくる: 右上から ゆるい山なり。にげる: 右上へ
  const inX = 126 - (126 - PERCH[0]) * arrive
  const inY = 4 + (PERCH[1] - 4) * arrive - Math.sin(arrive * Math.PI) * 8
  const x = leave > 0 ? PERCH[0] + 66 * leave : inX
  const y = leave > 0 ? PERCH[1] - 70 * leave - Math.sin(leave * Math.PI) * 6 : inY
  // ついばむ: いれものの おだんごに くちばしを おろす(くちばしは 左むき)
  const peckOn = during(t, CROW_IN + 1.0, SPOOK, 0.1)
  const peck = peckOn * Math.abs(wave(t, 0.7)) * -16
  const startle = span(t, SPOOK, SPOOK + 0.2)
  const facing = leave > 0 ? -1 : 1
  const flap = flying ? wave(t, 0.18) * 42 : startle * wave(t, 0.1) * 10
  return (
    <Layer x={x} y={y} scaleX={facing} rotate={flying ? 0 : peck} origin={[0, 0]}>
      <path d="M4.6 -6 L12 -7.4 L11 -3.2 L4 -3.4 Z" fill={CROW_DARK} />
      <ellipse cx="0" cy="-5.2" rx="6.2" ry="4.4" fill={CROW} />
      <circle cx="-5.2" cy="-9.4" r="3.4" fill={CROW} />
      <path d="M-8 -10.2 L-12.4 -8.9 L-8 -7.4 Z" fill={BEAK} />
      <circle cx="-5.8" cy="-10" r="0.95" fill="#ffffff" />
      <circle cx="-6.1" cy="-10" r="0.5" fill="#1a1a1a" />
      <Layer rotate={flap} origin={[1, -7]}>
        <path d="M-3.4 -6.4 Q0.4 -11.6 6.4 -6.2 Q1.6 -2.6 -3.4 -6.4 Z" fill={CROW_LIGHT} />
      </Layer>
      {!flying && (
        <path d="M-1.6 -1.2 V0.4 M1.6 -1.2 V0.4" stroke={BEAK} strokeWidth="0.9" strokeLinecap="round" />
      )}
    </Layer>
  )
}

/** ふた が のった しゅんかんの「ぴたっ」の すじ。ふたの 左右の ふち から。 */
function Snug({ t }: SceneProps) {
  const show = during(t, LAND, LAND + 1.1, 0.15)
  if (show <= 0) return null
  const p = span(t, LAND, LAND + 0.6, easeOut)
  return (
    <g opacity={show} stroke="#ffb347" strokeWidth="1.4" strokeLinecap="round">
      {[-1, 0, 1].map((k) => (
        <path key={`l${k}`} d={`M${8 - p * 3} ${66 + k * 4.4} l-3.2 ${k * 1.2}`} />
      ))}
      {[-1, 0, 1].map((k) => (
        <path key={`r${k}`} d={`M${91 + p * 3} ${66 + k * 4.4} l3.2 ${k * 1.2}`} />
      ))}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  // 男の子: 左から あわてて はしってきて、いれものの よこで とまる
  const hurry = t >= WALK_IN && t < ARRIVE
  const dx = mix(t, WALK_IN, ARRIVE, -26, 0, easeOut)
  const stride = hurry ? Math.sin((t - WALK_IN) * Math.PI * 2 * 2.4) * (1 - span(t, ARRIVE - 0.3, ARRIVE)) : 0
  const bob = -Math.abs(stride) * 1.2
  // ふた: かついで はこぶ(右がわが 少し上) → あたまの上で とまる → そっと おろす
  const lowering = span(t, LOWER, LAND, easeInOut)
  const wobble = t >= ARRIVE && t < LOWER ? wave(t, 0.5) * 0.8 : 0
  const tilt = CARRY_TILT * (1 - lowering) + wobble
  const lift = CARRY_LIFT * (1 - lowering)
  // おろした しゅんかん、ふたが ぽん と はずむ
  const squash = 1 - Math.sin(span(t, LAND, LAND + 0.35) * Math.PI) * 0.05
  const move: LidMove = { dx, lift: lift - bob, tilt, squash }
  const handL = lidPoint(HAND_L, { ...move, lift })
  const handR = lidPoint(HAND_R, { ...move, lift })
  const mood: Mood = t < LAND ? 'worried' : 'happy'
  const headTilt = t < LAND ? 0 : wave(t - LAND, 1.4) * 3
  const present = span(t, WALK_IN - 0.2, WALK_IN - 0.05)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Box t={t} />
        <Crow t={t} />
        {present > 0 && (<Layer opacity={present}>
          <>
            <Layer x={dx} y={bob}>
              <Boy step={stride} mood={mood} handL={handL} handR={handR} tilt={headTilt} />
              <Sweat t={t} />
            </Layer>
            <Layer x={dx} y={bob - lift} rotate={tilt} scaleY={squash} origin={GRIP}>
              <LidShape />
            </Layer>
            {/* 手は ふた の したから ささえる(ふた の まえに 見える) */}
            <Layer x={dx} y={bob}>
              <circle cx={handL[0]} cy={handL[1]} r="2.5" fill={SKIN} />
              <circle cx={handR[0]} cy={handR[1]} r="2.5" fill={SKIN} />
            </Layer>
          </>
        </Layer>)}
        <Snug t={t} />
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Ink char={CHAR} progress={ink.progress} tint={ink.tint} />
      <Layer opacity={during(t, LAND + 0.1, LAND + 1.2, 0.2)}>
        <Star cx={52} cy={66} r={3.2} color="#ffd95a" spin={t * 120} />
      </Layer>
      <Sparkles cx={54.5} cy={52} progress={ink.sparkle} />
    </>
  )
}

const scene: SceneModule = {
  char: CHAR,
  duration: DURATION,
  beats: [
    { at: 0, label: 'おだんごの いれもの', sound: 'pop' },
    { at: CROW_IN, label: 'カラスが とまって おだんごを ねらう' },
    { at: WALK_IN, label: '男の子が ふたを かついで あわててくる' },
    { at: SPOOK, label: 'ふたが 頭の上に きて、カラスは にげる' },
    { at: LOWER, label: 'そっと ふたを おろす' },
    { at: LAND, label: 'ぴったり あう。ほっと にっこり', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '合 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
