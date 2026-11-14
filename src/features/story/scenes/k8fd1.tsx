/*
 * 近(ちかい): みちを すこし あるけば、すぐ つく。(斤 = おの の「キン」という 音)(共通部品 sceneFigures で 書きなおした)
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
 * 子は walk(下りの 道は y を 道に 合わせる)、きこりは 左むきの おとな。おのは え の うえに 頭が のり、
 * はが 外がわに ついている(おのは 1回きりの 物なので 場面の中で 描く)。
 */
import { backOut, during, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Clouds, Flower, HANG_ARM, House, LOOKS, mixLimb, Notice, PALETTE, Person, personRig, Question, Sun, Tuft, walk, type Look, type Point, type WalkPlan } from '../sceneFigures'

const CHAR = '近'

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
const BEARD = '#ece7dc'
const CAP = '#e0a43a'

/** きこりの おじさん(赤い 服・ぼうし。ひげは あたまに つける) */
const MAN_LOOK: Look = { ...LOOKS.man, top: '#d9644a', bottom: '#6b5b4a', shoes: '#4a3a30', hat: 'cap', hatColor: CAP }

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

/** 子どもが あるく 道(7画目)の 高さ。道の まんなかの点を つないだもの */
const ROAD_POINTS: readonly Point[] = [
  [15.3, 83],
  [26.6, 81.9],
  [37.7, 84.5],
  [48.8, 87.4],
  [59.8, 90.3],
]
const START_X = 17
const END_X = 42
const KID_H = 33
const MAN_X = 61
const MAN_GROUND = 87
const MAN_H = 50
/** おのの え(2画目)を にぎる 手の いち */
const GRIP: Point = [49.1, 58]

const roadY = (x: number): number => {
  const i = ROAD_POINTS.findIndex(([px]) => px >= x)
  if (i <= 0) return ROAD_POINTS[0][1]
  const [x0, y0] = ROAD_POINTS[i - 1]
  const [x1, y1] = ROAD_POINTS[i]
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
}

const KID_WALK: WalkPlan = { from: START_X, to: END_X, start: WALK0, end: WALK1, build: 'child', height: KID_H, step: 9 }

/* ───────── けしき ───────── */

function Scenery({ t }: SceneProps) {
  return (
    <>
      <Sun t={t} x={101} y={9} r={4.6} />
      <Clouds t={t} at={[[42, 8.5, 0.9]]} speed={1.4} />
      {/* 丘の上の おうち(5画目の はじまり の すぐ そば) */}
      <House x={10} y={19.6} width={13} wall="#f4e1c0" roof="#d9644a" />
      {/* 丘 */}
      <path d="M-4 34 Q4 16 21 16.5 Q36 18 42 36 Q60 46 80 42 Q96 40 113 46 V101 H-4 Z" fill={HILL_FAR} />
      <path d="M-4 49 Q10 43 24 45 Q50 44 70 56 Q90 66 113 62 V101 H-4 Z" fill={HILL_NEAR} />
      {/* とおくの 道が かくれる しげみ */}
      <ellipse cx="30" cy="41" rx="10" ry="2.4" fill={HILL_NEAR} />
      <circle cx="26" cy="37.4" r="5.4" fill={PALETTE.leafDark} />
      <circle cx="34" cy="38" r="4.8" fill={PALETTE.leafDark} />
      <circle cx="30" cy="35.4" r="6.4" fill={PALETTE.leafDark} />
      <circle cx="28.8" cy="34" r="4.4" fill={PALETTE.leaf} />
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
        <Tuft key={x} x={x} y={98.4} />
      ))}
      {[[33, 95], [64, 97.5], [88, 100]].map(([x, y]) => (
        <Flower key={x} x={x} y={y} color="#f4a3b8" size={0.6} />
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

/** きこりの ひげ(あたまの まんなか が 0,0、半径 1。右むきの 形で。左むきなら 部品が はんてん する) */
function Beard() {
  return <ellipse cx="0.3" cy="0.72" rx="0.72" ry="0.5" fill={BEARD} />
}

/** きこりの おじさん。おのの えを 手で もち、ついたら もう一方の 手を ふる */
function Woodcutter({ t, greet }: SceneProps & { readonly greet: number }) {
  const wave1 = { swing: 118, bend: 40 + wave(t, 0.5) * 16 }
  return (
    <Person
      x={MAN_X}
      y={MAN_GROUND}
      build="adult"
      height={MAN_H}
      facing="left"
      look={MAN_LOOK}
      face="smile"
      headwear={<Beard />}
      pose={{ rightArm: { to: GRIP }, leftArm: mixLimb(HANG_ARM, wave1, greet) }}
    />
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)

  // はじまり: けしき → 子ども と おじさん が ぽん と出る
  const appear = span(t, 0, 0.5, easeOut)
  const childPop = span(t, 0.15, 0.65, backOut)
  const manPop = span(t, 0.3, 0.8, backOut)

  // 子の あるき: 道に そって 右へ(下り)。ついたら 手を ふる
  const w = walk(t, KID_WALK)
  const y = roadY(w.x)
  const waving = span(t, WALK1, WALK1 + 0.4, easeOut)
  const greet = span(t, WALK1 + 0.3, WALK1 + 0.7, easeOut)
  const wavePose = { swing: 140, bend: 28 + wave(t, 0.55) * 16 }
  const pose = { ...w.pose, rightArm: mixLimb(w.pose.rightArm ?? HANG_ARM, wavePose, waving), head: t < FLASH_A ? wave(t, 1.8) * 8 : 0 }
  const face = t < FLASH_A ? 'normal' : t < WALK0 + 0.3 ? 'surprised' : t < WALK1 ? 'normal' : 'joy'
  const rig = personRig({ ...w, y, pose })
  const head = rig.world.head
  const headR = rig.body.headR * rig.scale
  // できあがりで 字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.05

  return (
    <>
      <Layer opacity={ink.picture}>
        <Layer opacity={appear}>
          <Scenery t={t} />
        </Layer>
        <Layer opacity={manPop} scale={manPop} origin={[MAN_X, MAN_GROUND]}>
          <SignPost />
          <Axe t={t} />
          <Woodcutter t={t} greet={greet} />
        </Layer>
        <Layer opacity={childPop} scale={childPop} origin={[w.x, y]}>
          <Person {...w} y={y} pose={pose} look={LOOKS.boy} face={face} />
          <Question x={head[0] + 4} y={head[1] - headR - 4} show={during(t, 0.5, FLASH_A, 0.25)} t={t} size={7} />
          <Notice x={head[0]} y={head[1]} r={headR} dir={1} show={during(t, FLASH_A + 0.05, WALK0 + 0.3, 0.15)} />
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
