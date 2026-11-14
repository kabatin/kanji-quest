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
 * 男の子は Person(はしりは run、りょう手は { to } で ふたの 左はしを ささえ、ふたは held)。あせは Sweat、背景は Backdrop。
 *   カラスは はね が せなか から出て、くちばし で ついばむ(動物の 部品は まだ ない ので ここで 描く)。
 *   ふた は まんなかに つまみ、うらは たいら。いれものは ふち が ひろく、ふた が ちょうど のる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, LOOKS, Person, personRig, run, Sweat, type Expression } from '../sceneFigures'

const CHAR = '合'

const HAIR = '#5a3b2a'
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
/** 男の子の こし の x(はしりおわり の ばしょ)と、背の高さ・地面 */
const BOY_X = 17.5
const BOY_HEIGHT = 36
const FLOOR = 96
/** カラスが とまる 場所(いれもの の 右の ふち の上) */
const PERCH: readonly [number, number] = [67, 61]

const rad = (deg: number) => (deg * Math.PI) / 180

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

/** カラス: おだんごを ねらって とまり、ふたに おどろいて にげる。 */
function Crow({ t }: SceneProps) {
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

const BOY_LOOK = { ...LOOKS.boy, top: '#ffb347', bottom: '#4f7fd0' } as const

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  // 男の子: 左から あわてて はしってきて、いれものの よこで とまる
  const w = run(t, { from: BOY_X - 26, to: BOY_X, start: WALK_IN, end: ARRIVE, height: BOY_HEIGHT, stride: 12 })
  const dx = w.x - BOY_X
  // ふた: かついで はこぶ(右がわが 少し上) → あたまの上で とまる → そっと おろす
  const lowering = span(t, LOWER, LAND, easeInOut)
  const wobble = t >= ARRIVE && t < LOWER ? wave(t, 0.5) * 0.8 : 0
  const tilt = CARRY_TILT * (1 - lowering) + wobble
  const lift = CARRY_LIFT * (1 - lowering) + w.lift
  // おろした しゅんかん、ふたが ぽん と はずむ
  const squash = 1 - Math.sin(span(t, LAND, LAND + 0.35) * Math.PI) * 0.05
  const move: LidMove = { dx, lift, tilt, squash }
  const handL = lidPoint(HAND_L, move)
  const handR = lidPoint(HAND_R, move)
  const face: Expression = t < LAND ? 'worried' : 'smile'
  const headTilt = t < LAND ? 0 : wave(t - LAND, 1.4) * 3
  const present = span(t, WALK_IN - 0.2, WALK_IN - 0.05)
  // りょう手 は ふた の したから ささえる(右手 = 体の むこう がわ の 手 が 左はし、左手 = てまえ が 右はし)
  const pose = { ...w.pose, leftArm: { to: [handR[0] + dx, handR[1]] as const }, rightArm: { to: [handL[0] + dx, handL[1]] as const }, head: headTilt }
  const lid = (
    <Layer x={dx} y={-lift} rotate={tilt} scaleY={squash} origin={GRIP} opacity={present}>
      <LidShape />
    </Layer>
  )
  const head = personRig({ ...w, y: FLOOR, pose: {} }).world.head

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} clouds={[]} tufts={[6, 84, 100]} ground={98} />
        <Box t={t} />
        <Crow t={t} />
        {present > 0 && (
          <>
            <Person {...w} y={FLOOR} look={BOY_LOOK} face={face} opacity={present} pose={pose} held={lid} />
            <Sweat t={t} x={head[0] - 6} y={head[1] - 2} show={during(t, WALK_IN + 0.4, LAND, 0.2) * present} />
          </>
        )}
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
