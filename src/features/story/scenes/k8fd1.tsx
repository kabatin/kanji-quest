/*
 * 近(ちかい): みちを すこし あるけば、すぐ つく。(斤 = おの の「キン」という 音)
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … おのの 頭(あたま)の うえの ふち。え の てっぺん から 右うえへ ひろがる
 *   2画目(丨)  … おのの え(ながい もちて)
 *   3画目(一)  … みちしるべ(やじるし)の よこ長の いた
 *   4画目(丨)  … みちしるべの はしら
 *   5画目(丶)  … おうちの そばから はじまる とおくの 道
 *   6画目(曲)  … 丘を くねくね おりてくる 道
 *   7画目(長)  … 子どもが あるいていく 道(右へ むかって すこし 下がる)
 *
 * ながれ
 *   丘の上の おうちから おりてきた 子が、どこへ 行けば いいか わからなくて きょろきょろ(?)
 *   → おの の はが お日さまを うけて「キン!」と ひかる。子は はっと 気づく(!)
 *   → もう 一どヒカリ。「あそこだ!」と 道を すこし あるく(すぐ つく)
 *   → おのを もった きこりの おじさんの ところに ついて、手を ふって にっこり。おじさんも 手を ふる
 *   → ほね が ひかって、絵が うすくなり、字「近」が のこる
 *
 * 人と おのは、ほんものの つくり を守る(字の形に合わせるために、ゆがめない):
 *   おのは え の うえに 頭が のり、はが 外がわに ついている。人の うで は かた から出て ひじ で まがる。
 *   おじさんは おの の えを 手で もち、子どもは あし と うでを かわりばんこに ふって あるく。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '近'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#4f9be0'
const TUNIC_DARK = '#3c82c4'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const MAN_TUNIC = '#d9644a'
const MAN_TUNIC_DARK = '#b84e38'
const MAN_PANTS = '#6b5b4a'
const MAN_BOOT = '#4a3a30'
const BEARD = '#ece7dc'
const CAP = '#e0a43a'
const WOOD = '#a9703f'
const STEEL = '#a9b6c5'
const STEEL_DARK = '#8798ab'
const STEEL_LIGHT = '#e3ecf5'
const BOARD = '#c98a52'
const POST = '#8c5b3c'
const ROAD = '#efd9a8'
const ROAD_EDGE = '#d9b97c'
const HILL_FAR = '#dcefc6'
const HILL_NEAR = '#c5e8a9'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const SUN = '#ffd24a'
const CHEEK = '#ff9d9d'
const MOUTH = '#b9483f'
const EYE = '#2b2b2b'

/** くぎり の時間(秒) */
/** 1どめの「キン!」。子が 気づく */
const FLASH_A = 1.3
/** 2どめの「キン!」 */
const FLASH_B = 3.0
/** あるきはじめ・ついた */
const WALK0 = 2.1
const WALK1 = 4.7
const INK = 6.2
const DONE = 9.0
const DURATION = 9.6

type Pt = readonly [number, number]

/** 子どもが あるく 道(7画目)の 高さ。道の まんなかの点を つないだもの */
const ROAD_POINTS: readonly Pt[] = [
  [15.3, 83],
  [26.6, 81.9],
  [37.7, 84.5],
  [48.8, 87.4],
  [59.8, 90.3],
]
const START_X = 17
const END_X = 42
const roadY = (x: number): number => {
  const i = ROAD_POINTS.findIndex(([px]) => px >= x)
  if (i <= 0) return ROAD_POINTS[0][1]
  const [x0, y0] = ROAD_POINTS[i - 1]
  const [x1, y1] = ROAD_POINTS[i]
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
}

const rad = (deg: number) => (deg * Math.PI) / 180

/** うで・あし の ふしぶし: かた から ひじ、ひじ から 手 へ。角度は ま下から、右(+x)へ 何度か */
function limb(shoulder: Pt, a1: number, a2: number, l1: number, l2: number): { readonly elbow: Pt; readonly hand: Pt } {
  const elbow: Pt = [shoulder[0] + Math.sin(rad(a1)) * l1, shoulder[1] + Math.cos(rad(a1)) * l1]
  const hand: Pt = [elbow[0] + Math.sin(rad(a2)) * l2, elbow[1] + Math.cos(rad(a2)) * l2]
  return { elbow, hand }
}

/** 手の とどく先 が きまっているとき の ひじ の場所(ひじ は 下がわに まがる) */
function elbowFor(shoulder: Pt, target: Pt, l1: number, l2: number): Pt {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01)
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d)
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a))
  const ux = dx / Math.hypot(dx, dy)
  const uy = dy / Math.hypot(dx, dy)
  const mx = shoulder[0] + ux * a
  const my = shoulder[1] + uy * a
  const c1: Pt = [mx - uy * h, my + ux * h]
  const c2: Pt = [mx + uy * h, my - ux * h]
  return c1[1] >= c2[1] ? c1 : c2
}

function ArmShape({ shoulder, elbow, hand, color, width, handR }: { readonly shoulder: Pt; readonly elbow: Pt; readonly hand: Pt; readonly color: string; readonly width: number; readonly handR: number }) {
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r={handR} fill={SKIN} />
    </>
  )
}

/* ───────── けしき ───────── */

function Backdrop({ t }: SceneProps) {
  const rays = span(t, 0, 0.6, easeOut)
  return (
    <>
      {/* お日さま。ゆっくり まわる */}
      <Layer opacity={rays} rotate={t * 12} origin={[101, 9]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="100.2" y="0.2" width="1.6" height="3" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 101 9)`} />
        ))}
      </Layer>
      <circle cx="101" cy="9" r={4.6 * rays} fill={SUN} />
      {/* ゆっくり ながれる 雲 */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="42" cy="8.5" rx="6.4" ry="2.8" />
        <ellipse cx="46.6" cy="7" rx="4.2" ry="2.8" />
      </g>
      {/* 丘の上の おうち(5画目の はじまり の すぐ そば) */}
      <path d="M5 11 H15 V19.6 H5 Z" fill="#f4e1c0" />
      <path d="M3.4 11.6 L10 5.2 L16.6 11.6 Z" fill="#d9644a" />
      <rect x="8.6" y="14" width="3.2" height="5.6" rx="0.8" fill="#8c5b3c" />
      <rect x="12.2" y="13" width="2" height="2" rx="0.4" fill="#9fd4f5" />
      {/* 丘 */}
      <path d="M-4 34 Q4 16 21 16.5 Q36 18 42 36 Q60 46 80 42 Q96 40 113 46 V101 H-4 Z" fill={HILL_FAR} />
      <path d="M-4 49 Q10 43 24 45 Q50 44 70 56 Q90 66 113 62 V101 H-4 Z" fill={HILL_NEAR} />
      {/* とおくの 道が かくれる しげみ */}
      <ellipse cx="30" cy="41" rx="10" ry="2.4" fill={HILL_NEAR} />
      <circle cx="26" cy="37.4" r="5.4" fill={LEAF_DARK} />
      <circle cx="34" cy="38" r="4.8" fill={LEAF_DARK} />
      <circle cx="30" cy="35.4" r="6.4" fill={LEAF_DARK} />
      <circle cx="28.8" cy="34" r="4.4" fill={LEAF} />
      <circle cx="27" cy="32.6" r="1.6" fill={LEAF_LIGHT} />
      {/* 道: ふちを 太く、中を ほそく */}
      {[
        { n: 5, w: 3 },
        { n: 6, w: 5.4 },
        { n: 7, w: 8 },
      ].map(({ n, w }) => (
        <Bone key={`e${n}`} char={CHAR} n={n} color={ROAD_EDGE} width={w + 1.8} />
      ))}
      {[
        { n: 5, w: 3 },
        { n: 6, w: 5.4 },
        { n: 7, w: 8 },
      ].map(({ n, w }) => (
        <Bone key={n} char={CHAR} n={n} color={ROAD} width={w} />
      ))}
      {/* 道ばたの 草と 花 */}
      {[8, 52, 70, 98].map((x) => (
        <path key={x} d={`M${x} 98.4 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
      {[
        [33, 95],
        [64, 97.5],
        [88, 100],
      ].map(([x, y]) => (
        <g key={x}>
          <circle cx={x} cy={y} r="1.5" fill="#f4a3b8" />
          <circle cx={x} cy={y} r="0.6" fill="#ffd24a" />
        </g>
      ))}
    </>
  )
}

/** みちしるべ(3画目 = やじるしの いた、4画目 = はしら)。右を さしている */
function SignPost() {
  return (
    <>
      <ellipse cx="74.5" cy="85.6" rx="6" ry="1.6" fill="#000000" opacity="0.1" />
      <Bone char={CHAR} n={4} color={POST} width={4.6} />
      <Bone char={CHAR} n={3} color={BOARD} width={8.2} />
      {/* やじるしの さき(右) */}
      <path d="M90.5 33 L100.5 40 L90.5 46.2 Z" fill={BOARD} stroke={BOARD} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M80.5 37.4 l5.4 2.8 l-5.4 2.8" fill="none" stroke="#fbe9c8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="58" cy="40.6" r="0.9" fill="#8a5a31" />
    </>
  )
}

/** おの。え(2画目)の うえに 頭が のる。はは 右がわ(外がわ)に ついている */
function Axe({ t }: SceneProps) {
  // 「キン!」: お日さまを うけて、はの ふちが ぴかっと ひかる
  const flash = Math.max(during(t, FLASH_A, FLASH_A + 0.55, 0.15), during(t, FLASH_B, FLASH_B + 0.55, 0.15))
  return (
    <>
      <Bone char={CHAR} n={2} color={WOOD} width={3.6} />
      {/* 頭: え の てっぺん から 右うえへ(1画目の すじ) */}
      <path d="M44.5 26.5 Q44.5 22.5 48.5 22 L58 19.5 L64 14 L68 5.5 Q91 14 82 28 L66 27 L58 30 L50 32 Q45 32 44.5 28.5 Z" fill={STEEL} />
      <path d="M50 31.2 L58 29.2 L66 26.2 L81 27" fill="none" stroke={STEEL_DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M49 23.2 L58 20.8 L64.6 15.2" fill="none" stroke={STEEL_LIGHT} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      {/* はの ふち */}
      <path d="M68.4 6 Q90 14 82 27.4" fill="none" stroke="#f4f8fc" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="49" cy="26.6" rx="3.2" ry="2.4" fill={STEEL_DARK} />
      {flash > 0 ? (
        <g opacity={flash}>
          <Star cx={86} cy={16} r={11 * flash} color="#ffffff" spin={t * 60} />
          <Star cx={86} cy={16} r={5.5 * flash} color="#ffe27a" spin={45} />
        </g>
      ) : null}
    </>
  )
}

/* ───────── 人 ───────── */

type Mood = 'unsure' | 'surprised' | 'calm' | 'happy'

type ChildProps = {
  readonly step: number
  readonly mood: Mood
  /** 手を ふる 度合い(0〜1) と ふりの 角度 */
  readonly waving: number
  readonly flutter: number
  readonly look: number
}

/** 子ども(あしもと が 0,0。かお は 右むき ぎみ。せい 37) */
function Child({ step, mood, waving, flutter, look }: ChildProps) {
  const swing = step * 24
  // 左の うで(ふらない ほう): あるくとき あしと ぎゃくに ふる
  const leftShoulder: Pt = [-4.6, -23]
  const left = limb(leftShoulder, -6 - swing, -12 - swing, 5.6, 5.4)
  // 右の うで: あるくときは ふり、ついたら 手を ふる
  const rightShoulder: Pt = [4.6, -23]
  const right = limb(rightShoulder, 6 + swing + (105 - 6 - swing) * waving, 14 + swing + (165 + flutter - 14 - swing) * waving, 5.6, 5.4)
  return (
    <>
      <ArmShape shoulder={leftShoulder} elbow={left.elbow} hand={left.hand} color={TUNIC_DARK} width={4.4} handR={2.4} />
      {/* あし */}
      <Layer rotate={step * 20} origin={[-2.4, -13]}>
        <rect x="-4.4" y="-13.4" width="4.2" height="13" rx="2.1" fill={PANTS} />
        <ellipse cx="-2.6" cy="-0.6" rx="3.6" ry="2" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 20} origin={[2.4, -13]}>
        <rect x="0.2" y="-13.4" width="4.2" height="13" rx="2.1" fill={PANTS} />
        <ellipse cx="2.8" cy="-0.6" rx="3.6" ry="2" fill={SHOE} />
      </Layer>
      {/* どう と くび(くびは みじかく どう の まんなか の上) */}
      <rect x="-1.8" y="-26.6" width="3.6" height="4" rx="1.6" fill={SKIN_SHADE} />
      <rect x="-5.2" y="-24.6" width="10.4" height="12.6" rx="4.4" fill={TUNIC} />
      <path d="M-4 -17.2 h8" stroke={TUNIC_DARK} strokeWidth="1.1" strokeLinecap="round" />
      <ArmShape shoulder={rightShoulder} elbow={right.elbow} hand={right.hand} color={TUNIC} width={4.4} handR={2.4} />
      {/* あたま */}
      <Layer rotate={look} origin={[0, -26]}>
        <circle cx="0.8" cy="-31.8" r="6.4" fill={SKIN} />
        <path d="M-5.6 -31.4 C-6.6 -38.8 6.8 -40.6 7.2 -32.6 C5 -35.8 -0.6 -37 -5.6 -31.4 Z" fill={HAIR} />
        <path d="M0.2 -37.4 Q-0.6 -40.4 1.8 -39.4 Q2.4 -41 3.2 -38.6" fill="none" stroke={HAIR} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="-1.9" cy="-29.4" r="1.4" fill={CHEEK} opacity="0.55" />
        <circle cx="5.6" cy="-29.4" r="1.4" fill={CHEEK} opacity="0.55" />
        <ChildFace mood={mood} />
      </Layer>
    </>
  )
}

function ChildFace({ mood }: { readonly mood: Mood }) {
  if (mood === 'happy') {
    return (
      <>
        <path d="M-2.2 -31 Q-0.9 -32.7 0.4 -31" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
        <path d="M3 -31 Q4.3 -32.7 5.6 -31" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
        <path d="M-0.2 -28.4 Q1.8 -24.8 3.8 -28.4 Z" fill={MOUTH} />
      </>
    )
  }
  if (mood === 'surprised') {
    return (
      <>
        <circle cx="-0.8" cy="-31.2" r="1.6" fill={EYE} />
        <circle cx="4" cy="-31.2" r="1.6" fill={EYE} />
        <circle cx="-0.3" cy="-31.7" r="0.5" fill="#ffffff" />
        <circle cx="4.5" cy="-31.7" r="0.5" fill="#ffffff" />
        <ellipse cx="1.6" cy="-27.8" rx="1" ry="1.4" fill={MOUTH} />
      </>
    )
  }
  const unsure = mood === 'unsure'
  return (
    <>
      <circle cx="-0.8" cy="-31.2" r="1.1" fill={EYE} />
      <circle cx="4" cy="-31.2" r="1.1" fill={EYE} />
      {unsure ? (
        <>
          <path d="M-2.6 -33.2 L0.4 -33.9 M3 -33.9 L5.8 -33.2" fill="none" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <path d="M-0.2 -27.6 q1 -1 2 0 t2 0" fill="none" stroke={MOUTH} strokeWidth="0.9" strokeLinecap="round" />
        </>
      ) : (
        <path d="M0 -28.2 Q1.8 -26.6 3.8 -28.2" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
      )}
    </>
  )
}

/** きこりの おじさん(あしもと の たかさ が 87、右へ 立つ。左むき。せい 50) */
function Woodcutter({ t, greet }: SceneProps & { readonly greet: number }) {
  const breath = wave(t, 2.4) * 0.35
  // 左の かた(おの を もつ ほう)から、え(2画目)の 手の位置へ
  const nearShoulder: Pt = [56.8, 53]
  const grip: Pt = [49.1, 58]
  const nearElbow = elbowFor(nearShoulder, grip, 8.6, 8.6)
  // 右の うで: たいくつ なときは たらし、ついたら 手を ふる
  const farShoulder: Pt = [65.2, 53]
  const fall = limb(farShoulder, 8, 10, 8.6, 8.6)
  const high = limb(farShoulder, 118, 160 + wave(t, 0.5) * 16, 8.6, 8.6)
  const mixPt = (a: Pt, b: Pt): Pt => [a[0] + (b[0] - a[0]) * greet, a[1] + (b[1] - a[1]) * greet]
  const farElbow = mixPt(fall.elbow, high.elbow)
  const farHand = mixPt(fall.hand, high.hand)
  return (
    <>
      <ellipse cx="61" cy="87.6" rx="10" ry="2.2" fill="#000000" opacity="0.12" />
      <ArmShape shoulder={farShoulder} elbow={farElbow} hand={farHand} color={MAN_TUNIC_DARK} width={5.2} handR={2.8} />
      <rect x="55.6" y="68" width="5.4" height="18.4" rx="2.7" fill={MAN_PANTS} />
      <rect x="61.2" y="68" width="5.4" height="18.4" rx="2.7" fill={MAN_PANTS} />
      <ellipse cx="57.4" cy="87.2" rx="4.4" ry="2.3" fill={MAN_BOOT} />
      <ellipse cx="64.4" cy="87.2" rx="4.4" ry="2.3" fill={MAN_BOOT} />
      {/* くび と どう */}
      <rect x="58.2" y="44.6" width="5" height="7" rx="2.2" fill={SKIN_SHADE} />
      <rect x="54.4" y="50.4" width="13.2" height="21" rx="5.6" fill={MAN_TUNIC} />
      <path d="M56.2 62 h9.6" stroke={MAN_TUNIC_DARK} strokeWidth="1.6" strokeLinecap="round" />
      {/* おのを もつ うで: ひじ で まがり、手が え を にぎる */}
      <ArmShape shoulder={nearShoulder} elbow={nearElbow} hand={grip} color={MAN_TUNIC_DARK} width={5.2} handR={2.8} />
      {/* あたま: ぼうし と ひげ */}
      <Layer y={breath * 0.5}>
        <circle cx="60.6" cy="41" r="6.4" fill={SKIN} />
        <ellipse cx="60" cy="46.6" rx="4.8" ry="3.4" fill={BEARD} />
        <path d="M53.8 40.4 Q54 33 60.8 33 Q67.4 33 67.4 40.4 Q60.6 37.6 53.8 40.4 Z" fill={CAP} />
        <path d="M52.6 40.6 Q54 39.4 56 40.2" fill="none" stroke="#b98228" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="57.6" cy="41.8" r="1" fill={EYE} />
        <circle cx="62.4" cy="41.8" r="1" fill={EYE} />
        <circle cx="55.8" cy="44" r="1.3" fill={CHEEK} opacity="0.5" />
        <path d="M58 45.8 Q59.8 47.6 61.8 45.8" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
      </Layer>
    </>
  )
}

/** ?(まよっている) と !(気づいた) の しるし */
function Mark({ x, y, kind, show }: { readonly x: number; readonly y: number; readonly kind: 'ask' | 'notice'; readonly show: number }) {
  if (show <= 0) return null
  return (
    <Layer x={x} y={y - show * 2} scale={0.6 + 0.4 * Math.min(show, 1)} opacity={show}>
      {kind === 'ask' ? (
        <>
          <path d="M-2.4 -2.2 Q-2.4 -5.2 0.2 -5.2 Q2.8 -5.2 2.8 -2.8 Q2.8 -1.2 0.6 0 V1.4" fill="none" stroke="#5f7fd6" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="0.6" cy="4" r="1" fill="#5f7fd6" />
        </>
      ) : (
        <>
          <rect x="-1" y="-6" width="2" height="6.4" rx="1" fill="#ef6a4a" />
          <circle cx="0" cy="3" r="1.2" fill="#ef6a4a" />
        </>
      )}
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)

  // はじまり: けしき → 子ども と おじさん が ぽん と出る
  const appear = span(t, 0, 0.5, easeOut)
  const childPop = span(t, 0.15, 0.65, backOut)
  const manPop = span(t, 0.3, 0.8, backOut)

  // 子の あるき: 道に そって 右へ。ふみだす あし と うで が かわりばんこに ふれる
  const envelope = Math.min(span(t, WALK0, WALK0 + 0.2), 1 - span(t, WALK1 - 0.3, WALK1))
  const step = t < WALK0 ? 0 : Math.sin((t - WALK0) * Math.PI * 2 * 1.7) * envelope
  const x = mix(t, WALK0, WALK1, START_X, END_X, easeInOut)
  const y = roadY(x) - Math.abs(step) * 1.1
  const mood: Mood = t < FLASH_A ? 'unsure' : t < WALK0 + 0.3 ? 'surprised' : t < WALK1 ? 'calm' : 'happy'
  // きょろきょろ(まよっている間だけ あたまを ふる)
  const look = t < FLASH_A ? wave(t, 1.8) * 8 : 0
  const waving = span(t, WALK1, WALK1 + 0.4, easeOut)
  const greet = span(t, WALK1 + 0.3, WALK1 + 0.7, easeOut)
  // できあがりで 字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.05

  return (
    <>
      <Layer opacity={ink.picture}>
        <Layer opacity={appear}>
          <Backdrop t={t} />
        </Layer>
        <Layer opacity={manPop} scale={manPop} origin={[61, 87]}>
          <SignPost />
          <Axe t={t} />
          <Woodcutter t={t} greet={greet} />
        </Layer>
        <Layer opacity={childPop} scale={childPop} origin={[x, y]}>
          <ellipse cx={x} cy={roadY(x) + 0.4} rx="5.4" ry="1.4" fill="#000000" opacity="0.14" />
          <Layer x={x} y={y} scale={0.9}>
            <Child step={step} mood={mood} waving={waving} flutter={wave(t, 0.55) * 18} look={look} />
          </Layer>
          <Mark x={x + 1} y={y - 40} kind="ask" show={during(t, 0.5, FLASH_A, 0.25)} />
          <Mark x={x + 1} y={y - 40} kind="notice" show={during(t, FLASH_A + 0.05, WALK0 + 0.3, 0.15)} />
        </Layer>
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
    { at: 0, label: '丘の道で 子が まよっている', sound: 'pop' },
    { at: FLASH_A, label: 'おのが「キン!」と ひかる。子が 気づく', sound: 'pop' },
    { at: WALK0, label: 'すこし あるく' },
    { at: WALK1, label: 'ついた。きこりと 手を ふりあう', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '近 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
