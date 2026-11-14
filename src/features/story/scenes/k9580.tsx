/*
 * 門(もん): 2まいの とびらが ならんで ひらいた、もんの かたち。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)      … 左の とびらの 左はし(はしら)
 *   2画目(コ)      … 左の とびらの うえの まど の わく(上と右)
 *   3・4画目(一)   … 左の まどの よこぼう と、まど の した
 *   5画目(丨)      … 右の とびらの 左はし の うえ(まど の左)
 *   6画目(┐)       … 右の とびらの うえ と、右はしの はしら
 *   7・8画目(一)   … 右の まどの よこぼう と、まど の した
 *   (とびらは ひらくと はば が せまく見える。そのときの かたちが 字と重なる)
 *
 * ながれ
 *   もんが 立つ → しょんぼりした 女の子が あるいてくる。とびらは しまっていて はいれない(ふう…)
 *   → 手に かぎ を もっていたのを 思い出す(!)→ かぎ穴に さす(かちっ)
 *   → 2まいの とびらが ぱたんと ひらいて、あかるい 中が 見える。女の子は 大よろこび
 *   → ひらいた もんの 前に 立って ぴょん ぴょん → ほね が ひかって、絵が うすくなり、字「門」が のこる
 *
 * 女の子は 共通部品 Person(あるくときは 横むき、立ち止まると まえむき):
 *   うで は かた から出て ひじ で まがる。くび は みじかく、あたま は どう の まんなか の上。
 * とびらは、はしら(ちょうつがい)の ほうを じく に、むこうがわ へ ひらく
 *   (ひらくと 手前から見て はば が せまく なる)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Clouds, Hearts, LOOKS, mixLimb, Person, personRig, Sigh, Sun, turnAround, walk, type Expression, type Limb, type PersonPose } from '../sceneFigures'

type Pt = readonly [number, number]
type Mood = 'sad' | 'hope' | 'happy'

const rad = (deg: number) => (deg * Math.PI) / 180

const CHAR = '門'

const DRESS = '#ee7fa0'
const HAIR = '#5a3b2a'
const KEY = '#f2b632'
const WOOD = '#b9814f'
const WOOD_DARK = '#8c5b3c'
const WOOD_LIGHT = '#cf9a66'
const PANE = '#cfe9f7'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const GRASS = '#c5e8a9'

/** くぎり の時間(秒) */
const WALK = 0.9
const STOP = 2.4
/** かぎ に気づく */
const NOTICE = 3.0
const LIFT = 3.5
const CLICK = 4.5
const OPEN_FROM = 4.7
const OPEN_TO = 6.2
/** 女の子が もんの 前へ すすむ */
const STEP = 6.2
const STEP_END = 6.9
const INK = 7.5
const DONE = 10.4
const DURATION = 10.8

/** 女の子の 足もと(地面より 少し てまえ) */
const FEET_Y = 95
/** 女の子の 背の高さ(主役が 小さく ならないように) */
const GIRL_HEIGHT = 46
const START_X = 31
const GATE_X = 54.5
/** かぎ穴の 場所(しまっているときの 左のとびら の右はし ちかく) */
const LOCK: readonly [number, number] = [49.5, 70]

/** とびらの 絵は「ひらいた かたち」(字と重なる かたち)で描く。しめるときは 横に のばす。 */
const LEFT_HINGE = 18
const RIGHT_HINGE = 91
const LEFT_CLOSED_SCALE = 1.36
const RIGHT_CLOSED_SCALE = 1.25

function Ground({ t }: SceneProps) {
  return (
    <>
      <path d="M-4 99 Q18 78 44 92 Q72 72 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <Clouds t={t} at={[[4, 8, 1], [58, 6, 0.9]]} speed={1.4} />
      <ellipse cx="54.5" cy="99" rx="53" ry="6.4" fill={GRASS} />
      {[6, 12, 100, 104].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** とびらの むこうがわ。ひらくと あかるい にわ が 見える(しまっていると すきま から 光が もれる)。 */
function Garden({ t, open }: SceneProps & { readonly open: number }) {
  const flap = wave(t, 0.28) * 0.6
  const fx = 53 + wave(t, 3.2) * 6
  const fy = 52 + wave(t, 2.1, 0.5) * 3
  return (
    <>
      <rect x="18" y="14" width="73" height="77" fill="#4a3a30" />
      <Layer opacity={0.14 + 0.86 * open}>
        <rect x="18" y="14" width="73" height="77" fill="#fff3c4" />
        <circle cx="53" cy="38" r="13" fill="#ffe9a0" />
        <path d="M18 72 Q38 56 53 66 Q70 54 91 70 V91 H18 Z" fill="#d6efb8" />
        <rect x="63.4" y="60" width="2.2" height="7" fill={WOOD_DARK} />
        <circle cx="64.5" cy="57.5" r="5.6" fill={LEAF_DARK} />
        <circle cx="63.4" cy="56" r="3.8" fill={LEAF} />
        <path d="M47 91 L60 91 L55.6 66 L52 66 Z" fill="#f4dfb0" />
        <circle cx="45.5" cy="82" r="1.5" fill="#ff9d9d" />
        <circle cx="62" cy="84.5" r="1.5" fill="#ffd24a" />
        <circle cx="44" cy="77" r="1.2" fill="#c8cffb" />
        <Layer x={fx} y={fy}>
          <Layer scaleX={0.5 + 0.5 * Math.abs(flap)}>
            <ellipse cx="-1.6" cy="0" rx="1.8" ry="1.4" fill="#f07f9e" />
            <ellipse cx="1.6" cy="0" rx="1.8" ry="1.4" fill="#f07f9e" />
          </Layer>
          <rect x="-0.3" y="-1.4" width="0.6" height="2.8" rx="0.3" fill={HAIR} />
        </Layer>
      </Layer>
    </>
  )
}

/** 左の とびら(ひらいた かたち)。まど は 上、かぎ穴は まんなか より下。 */
function LeftDoor() {
  return (
    <>
      <rect x="18" y="14.5" width="25" height="76.5" rx="2" fill={WOOD} />
      <rect x="18" y="14.5" width="3.2" height="76.5" rx="1.6" fill={WOOD_DARK} />
      <rect x="21.2" y="17" width="20.2" height="24" rx="1.2" fill={PANE} />
      <rect x="21.2" y="27.4" width="20.2" height="2.2" fill={WOOD_DARK} />
      <rect x="19.6" y="41" width="22.8" height="3" rx="1" fill={WOOD_DARK} />
      <path d="M30 48 V88 M36.6 48 V88" stroke={WOOD_LIGHT} strokeWidth="1" strokeLinecap="round" />
      {/* かぎ穴の ばん */}
      <rect x="38.6" y="66" width="3.6" height="8" rx="1.4" fill={WOOD_DARK} />
      <circle cx="40.4" cy="70" r="0.9" fill="#2b2b2b" />
    </>
  )
}

/** 右の とびら(ひらいた かたち) */
function RightDoor() {
  return (
    <>
      <rect x="63" y="13" width="28" height="76.5" rx="2" fill={WOOD} />
      <rect x="87.8" y="13" width="3.2" height="76.5" rx="1.6" fill={WOOD_DARK} />
      <rect x="65.6" y="15.6" width="20.8" height="22.4" rx="1.2" fill={PANE} />
      <rect x="65.6" y="25.4" width="20.8" height="2.2" fill={WOOD_DARK} />
      <rect x="64" y="37.4" width="23" height="3" rx="1" fill={WOOD_DARK} />
      <path d="M70 46 V87 M77 46 V87" stroke={WOOD_LIGHT} strokeWidth="1" strokeLinecap="round" />
      <circle cx="66.4" cy="68" r="1.6" fill={KEY} />
    </>
  )
}

function Gate({ t, open }: SceneProps & { readonly open: number }) {
  // 下から ぽん と 立ちあがる
  const rise = span(t, 0.1, 0.8, backOut)
  return (
    <Layer scaleY={Math.max(0, rise)} scaleX={0.85 + 0.15 * Math.min(1, rise)} origin={[GATE_X, 91]}>
      <Garden t={t} open={open} />
      <Layer scaleX={LEFT_CLOSED_SCALE - (LEFT_CLOSED_SCALE - 1) * open} origin={[LEFT_HINGE, 0]}>
        <LeftDoor />
      </Layer>
      <Layer scaleX={RIGHT_CLOSED_SCALE - (RIGHT_CLOSED_SCALE - 1) * open} origin={[RIGHT_HINGE, 0]}>
        <RightDoor />
      </Layer>
    </Layer>
  )
}

/** 「!」(かぎ に 気づいた)。x, y は あたまの よこ */
function Notice({ t, x, y }: SceneProps & { readonly x: number; readonly y: number }) {
  const show = during(t, NOTICE, LIFT + 0.3, 0.2)
  if (show <= 0) return null
  const pop = Math.max(0, span(t, NOTICE, NOTICE + 0.3, backOut))
  return (
    <Layer x={x} y={y} scale={pop} opacity={show}>
      <rect x="-1" y="-5.4" width="2" height="4.2" rx="1" fill="#f2a31b" />
      <circle cx="0" cy="0" r="1.1" fill="#f2a31b" />
    </Layer>
  )
}

/** かぎ が かちっと はまった しゅんかん の ひかり */
function Click({ t }: SceneProps) {
  const show = during(t, CLICK, CLICK + 0.5, 0.1)
  if (show <= 0) return null
  const p = span(t, CLICK, CLICK + 0.5, easeOut)
  return (
    <g opacity={show} stroke="#ffd24a" strokeWidth="1.2" strokeLinecap="round">
      {[-60, -20, 20, 60, 160, 200].map((a) => (
        <line key={a} x1={LOCK[0] + Math.cos(rad(a)) * (3 + p * 2)} y1={LOCK[1] + Math.sin(rad(a)) * (3 + p * 2)} x2={LOCK[0] + Math.cos(rad(a)) * (5 + p * 4)} y2={LOCK[1] + Math.sin(rad(a)) * (5 + p * 4)} />
      ))}
    </g>
  )
}


/** かぎ(手に もつ)。手から うでの むきへ のびる */
function Key({ hand, from }: { readonly hand: Pt; readonly from: Pt }) {
  const angle = (Math.atan2(hand[1] - from[1], hand[0] - from[0]) * 180) / Math.PI
  return (
    <g transform={`translate(${hand[0]} ${hand[1]}) rotate(${angle}) scale(1.2)`}>
      <circle cx="0.6" cy="0" r="1.7" fill="none" stroke={KEY} strokeWidth="1" />
      <rect x="2.2" y="-0.45" width="5.6" height="0.9" rx="0.4" fill={KEY} />
      <rect x="6" y="0" width="0.9" height="1.6" fill={KEY} />
      <rect x="4.4" y="0" width="0.9" height="1.2" fill={KEY} />
    </g>
  )
}

/** 女の子: ふたつ むすび・ピンクの ワンピース */
const GIRL_LOOK = { ...LOOKS.little, top: DRESS } as const

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)
  const open = span(t, OPEN_FROM, OPEN_TO, easeInOut)

  // あるく: 左から とびらの 前へ(横むき)→ ふりむいて 正面。あとで もんの まんなかの 前へ(また 横むき)→ 正面
  const plan = { build: 'child', height: GIRL_HEIGHT } as const
  const w1 = walk(t, { from: -12, to: START_X, start: WALK, end: STOP - 0.3, ...plan })
  const w2 = walk(t, { from: START_X, to: GATE_X, start: STEP, end: STEP_END, ...plan })
  const w = t < STEP - 0.3 ? w1 : w2
  const turned = t < STEP - 0.3 ? turnAround(t, STOP - 0.3, 'right', 'front') : t < STEP_END ? turnAround(t, STEP - 0.3, 'front', 'right') : turnAround(t, STEP_END, 'right', 'front')
  // よろこびの ぴょん
  const cheer = during(t, OPEN_FROM + 0.1, STEP - 0.3, 0.2) + during(t, STEP_END, INK + 0.2, 0.2)
  const hop = Math.abs(wave(t, 0.62)) * 2.6 * cheer

  const mood: Mood = t < NOTICE ? 'sad' : t < CLICK + 0.1 ? 'hope' : 'happy'
  const face: Expression = mood === 'sad' ? 'sad' : mood === 'hope' ? 'surprised' : 'joy'

  // 正面の とき の うで: かぎを もつ うで(左うで = 画面の 右)は かぎ穴まで のばす。あけたあと うれしくて 上へ
  const lift = span(t, LIFT, LIFT + 0.8, easeInOut)
  const up = span(t, OPEN_FROM + 0.1, OPEN_FROM + 0.5, easeOut)
  const hang: Limb = { swing: 8, bend: 10 }
  const reach: Limb = mixLimb(hang, { to: LOCK }, lift)
  const frontPose: PersonPose = {
    leftArm: mixLimb(reach, { swing: 158, bend: 12 }, up),
    rightArm: mixLimb(hang, { swing: 158 + wave(t, 0.62, 0.3) * 8 * cheer, bend: 12 }, up),
  }
  const pose = turned.facing === 'front' ? frontPose : w.pose
  const girl = { ...w, ...turned, y: FEET_Y, pose }
  const rig = personRig({ ...girl, lift: hop })
  const head = rig.world.head
  const headR = rig.body.headR * rig.scale
  const keyArm = rig.world.arms.left

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sun t={t} x={96} y={13} r={6.2} />
        <Ground t={t} />
        <Gate t={t} open={open} />
        <Click t={t} />
        {/* ひらいた もんから こぼれる 光 */}
        <ellipse cx={GATE_X} cy="94" rx={13 * open} ry="2.6" fill="#fff0a8" opacity={0.75 * open} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.2)}>
          <Person {...girl} lift={hop} look={GIRL_LOOK} face={face} gazeY={mood === 'sad' && t > STOP ? 1 : 0} gaze={mood === 'hope' ? 0.8 : 0} />
          <Key hand={keyArm.end} from={keyArm.mid} />
          <Sigh x={head[0] - headR} y={head[1] + headR * 0.4} p={span(t, STOP + 0.1, NOTICE + 0.2, easeOut)} show={during(t, STOP + 0.1, NOTICE + 0.2, 0.2)} />
          <Notice t={t} x={head[0] + headR * 1.4} y={head[1] - headR * 1.1} />
          <Hearts t={t} x={head[0] - headR * 2.2} y={head[1] - headR} show={during(t, OPEN_FROM + 0.8, INK, 0.3)} />
          <Hearts t={t + 0.7} x={head[0] + headR * 1.2} y={head[1] - headR * 1.3} show={during(t, OPEN_FROM + 0.8, INK, 0.3)} />
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
    { at: 0, label: 'もんが 立つ', sound: 'pop' },
    { at: WALK, label: 'しょんぼりした 女の子が あるいてくる' },
    { at: NOTICE, label: 'かぎ を もっていたと 気づく', sound: 'pop' },
    { at: CLICK, label: 'かぎ穴に さす。かちっ', sound: 'pop' },
    { at: OPEN_FROM, label: '2まいの とびらが ぱたんと ひらく' },
    { at: STEP, label: 'よろこんで もんの 前へ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '門 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
