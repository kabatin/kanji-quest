/*
 * 弓(ゆみ): ぐにゃりと まがった、やを とばす どうぐ。(共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)  ※ 弓は 分けない字。1つの絵(弓)として 描く
 *   1・2画目   … 弓の 上の はし(やじりを かける ところ)。ひもが とまる 先たん
 *   3画目      … 弓の ぐにゃり と まがった 本たい。右に ふくらんで、下の はしへ
 *   (弓の かたちは 右へ ふくらむ。右が やの とんでいく むき)
 *   ※ 人の うでは 長さが きまっている ので、弓は 手が とどく 大きさに ちぢめ、まとの りんごへ むけて すこし 上へ かまえる。
 *     字の 画とは「だいたい」重なる くらい(人の 体の 正しさ を 先に まもった)
 *
 * ながれ
 *   男の子が りんごを とろうとして とびはねるけど とどかない → しょんぼり
 *   → 「そうだ!」と ひらめいて、まっすぐな えだを もつ
 *   → ひもを はると、えだが ぐにゃり と しなって 弓に なる
 *   → やを つがえて、ひゅっ と はなつと りんごに あたって おちる → 大よろこび
 *   → 弓の ほね が ひかって、絵が うすくなり、字「弓」が のこる
 *
 * 人は Person。あるきは walk、むきは turnAround。弓は 左手(てまえ の うで)で にぎり、右手が ひもを ひく。
 * 弓・ひも・やは Person の held に わたす(あたま の うしろ、てまえの うで の おく)。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Dust, HANG_ARM, LOOKS, mixLimb, PALETTE, Person, personRig, posture, Sweat, Tree, turnAround, walk, type Limb, type PersonProps } from '../sceneFigures'

const CHAR = '弓'

const TUNIC = '#e8734a'
const TUNIC_DARK = '#cf5d37'
const PANTS = '#4a5f8a'
const WOOD = '#a8703f'
const WOOD_LIGHT = '#c99461'
const BARK_DARK = '#70452b'
const SUN = '#ffd24a'
const APPLE = '#e8534a'
const APPLE_DARK = '#c53f3a'
const STRING = '#f3ead2'
const KID_LOOK = { ...LOOKS.boy, top: TUNIC, bottom: PANTS } as const
const KID = { build: 'child', height: 44 } as const

/** くぎり の時間(秒) */
const ENTER_END = 1.0
const HOP_START = 1.1
const HOP_END = 2.0
const SAD = 2.0
const TURN_BACK = 2.7
const WALK_BACK = TURN_BACK + 0.3
const WALK_BACK_END = 3.7
const FACE_RIGHT = 3.7
const STICK = 4.0
const TIE = 4.3
const BEND = 4.7
const NOCK = 5.5
const RELEASE = 6.4
const FALL = 6.7
const CHEER = 7.3
const INK = 8.4
const DONE = 10.8
const DURATION = 11.4

const GROUND = 96
/** 男の子が りんごの 下に たつ ところ と、弓を つくる ところ */
const TREE_SIDE_X = 82
const BOW_X = 38

type Pt = readonly [number, number]
const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
const rad = (deg: number) => (deg * Math.PI) / 180

/** りんご(木の かげの したの えだ から ぶらさがる)。とびはねても とどかない たかさ */
const APPLE_AT: Pt = [92, 43]
const APPLE_R = 4
const APPLE_FALL = GROUND - 4.2 - APPLE_AT[1]

/* ───────── 弓の かたち(もとの 字の かたち を ちぢめて、手の とどく 大きさに) ───────── */

/** 字の 弓の 先たん(上・下)と、しなりきった ときの 制御点 */
const BOW_TOP_O: Pt = [72, 15]
const BOW_BOTTOM_O: Pt = [55, 91]
const BENT_1_O: Pt = [90, 32]
const BENT_2_O: Pt = [88, 68]
/** 字の 弓の ふくらみ の どれくらい を のこすか。(ひもを ひく ぶんの ゆとり) と 弓の 大きさ */
const BULGE = 0.55
const BOW_SCALE = 0.55
/** 字の 弓の ちょうど 左に かたむいた かんじ を なおして、先たんが まっすぐ 上下に なる 角度 */
const UPRIGHT = -12.6
/** ひもを いっぱいに ひいた とき、手(こぶし)から ひもの つがえる ところ まで */
const DRAW_BACK = 10.5
const ARROW_LENGTH = 24
/** ひもを ひく 手は あごの たかさ(かた より すこし 上) */
const CHIN_UP = 5

const straightPoint = (k: number): Pt => lerpPt(BOW_TOP_O, BOW_BOTTOM_O, k)

/** しなり bend(0 = まっすぐ / 1 = 字の 弓)での 制御点(字の 座標) */
function bowControls(bend: number): readonly [Pt, Pt] {
  const bulge = (s: Pt, bent: Pt): Pt => lerpPt(s, lerpPt(s, bent, BULGE), bend)
  return [bulge(straightPoint(1 / 3), BENT_1_O), bulge(straightPoint(2 / 3), BENT_2_O)]
}

/** 弓の u(0〜1)の ところの 点(字の 座標) */
function bowPointO(bend: number, u: number): Pt {
  const [c1, c2] = bowControls(bend)
  const a = (1 - u) ** 3
  const b = 3 * (1 - u) ** 2 * u
  const c = 3 * (1 - u) * u * u
  const d = u ** 3
  return [a * BOW_TOP_O[0] + b * c1[0] + c * c2[0] + d * BOW_BOTTOM_O[0], a * BOW_TOP_O[1] + b * c1[1] + c * c2[1] + d * BOW_BOTTOM_O[1]]
}

/** かまえ: りんごの ほうへ むけた 弓の にぎり(G)と、むき(φ)。かた から りんごを ねらう */
type Aim = { readonly grip: Pt; readonly dir: Pt; readonly origin: Pt; readonly angle: number }
function aimAt(): Aim {
  const rig = personRig({ x: BOW_X, y: GROUND, ...KID, facing: 'right' })
  const shoulder = rig.world.arms.left.root
  const arm = (rig.body.upperArm + rig.body.foreArm) * rig.scale * 0.985
  // ひもを ひく 手の たかさ(あご)を とおる 線が りんごへ むく
  const origin: Pt = [shoulder[0], shoulder[1] - CHIN_UP]
  const toApple = Math.atan2(APPLE_AT[1] - origin[1], APPLE_AT[0] - origin[0])
  const dir: Pt = [Math.cos(toApple), Math.sin(toApple)]
  // 線の 上で、かた から うでの 長さ だけ はなれた 点 が 弓を にぎる ところ
  const b = dir[0] * (origin[0] - shoulder[0]) + dir[1] * (origin[1] - shoulder[1])
  const s = -b + Math.sqrt(b * b - CHIN_UP * CHIN_UP + arm * arm)
  return { grip: [origin[0] + dir[0] * s, origin[1] + dir[1] * s], dir, origin, angle: (toApple * 180) / Math.PI }
}
const AIM = aimAt()

/** 字の 座標の 点 p を、にぎり が AIM.grip に なる ように うつす(bend ごとに にぎりは 弓の まんなか) */
function toScene(bend: number, p: Pt): Pt {
  const g = bowPointO(bend, 0.5)
  const a = rad(AIM.angle + UPRIGHT)
  const dx = (p[0] - g[0]) * BOW_SCALE
  const dy = (p[1] - g[1]) * BOW_SCALE
  return [AIM.grip[0] + dx * Math.cos(a) - dy * Math.sin(a), AIM.grip[1] + dx * Math.sin(a) + dy * Math.cos(a)]
}

/** ひもの つがえる ところ: ひかない ときは ひもの まんなか、ひく ほど あごへ */
function nockAt(bend: number, pull: number): Pt {
  const rest = lerpPt(toScene(bend, BOW_TOP_O), toScene(bend, BOW_BOTTOM_O), 0.5)
  const full: Pt = [AIM.grip[0] - AIM.dir[0] * DRAW_BACK, AIM.grip[1] - AIM.dir[1] * DRAW_BACK]
  return lerpPt(rest, full, pull)
}

type BowProps = { readonly bend: number; readonly bowScale: number; readonly stringGrow: number; readonly pull: number; readonly arrow: number }

/** 弓 と ひも と、つがえた やを 描く(右へ むいた かまえ)。人の held に わたす */
function BowAndString({ bend, bowScale, stringGrow, pull, arrow }: BowProps) {
  const [c1, c2] = bowControls(bend)
  const top = toScene(bend, BOW_TOP_O)
  const bottom = toScene(bend, BOW_BOTTOM_O)
  const k1 = toScene(bend, c1)
  const k2 = toScene(bend, c2)
  const wood = `M${top[0]} ${top[1]} C${k1[0]} ${k1[1]} ${k2[0]} ${k2[1]} ${bottom[0]} ${bottom[1]}`
  const grip = AIM.grip
  const nock = nockAt(bend, pull)
  const gripAngle = AIM.angle + UPRIGHT
  const stringPath = pull === 0 ? `M${top[0]} ${top[1]} L${bottom[0]} ${bottom[1]}` : `M${top[0]} ${top[1]} L${nock[0]} ${nock[1]} L${bottom[0]} ${bottom[1]}`
  const tip: Pt = [nock[0] + AIM.dir[0] * ARROW_LENGTH, nock[1] + AIM.dir[1] * ARROW_LENGTH]
  return (
    <>
      <Layer scale={bowScale} origin={grip}>
        <path d={wood} fill="none" stroke={BARK_DARK} strokeWidth="2.6" strokeLinecap="round" />
        <path d={wood} fill="none" stroke={WOOD} strokeWidth="1.8" strokeLinecap="round" />
        <path d={wood} fill="none" stroke={WOOD_LIGHT} strokeWidth="0.6" strokeLinecap="round" transform="translate(-0.4 -0.3)" />
        {/* まんなかの にぎり(てが すべらない よう、ぬのを まく) */}
        <rect x={grip[0] - 1.7} y={grip[1] - 3} width="3.4" height="6" rx="1.2" fill={TUNIC_DARK} transform={`rotate(${gripAngle} ${grip[0]} ${grip[1]})`} />
        <circle cx={top[0]} cy={top[1]} r="1.3" fill={BARK_DARK} />
        <circle cx={bottom[0]} cy={bottom[1]} r="1.3" fill={BARK_DARK} />
      </Layer>
      {stringGrow > 0 ? <path d={stringPath} fill="none" stroke={STRING} strokeWidth="0.7" strokeLinecap="round" pathLength={1} strokeDasharray={stringGrow < 1 ? `${stringGrow} 2` : undefined} /> : null}
      {arrow > 0 ? <Arrow tail={nock} tip={tip} scale={arrow} /> : null}
    </>
  )
}

/** やの しっぽ(tail)から さき(tip)まで。しっぽに はね */
function Arrow({ tail, tip, scale }: { readonly tail: Pt; readonly tip: Pt; readonly scale: number }) {
  const angle = (Math.atan2(tip[1] - tail[1], tip[0] - tail[0]) * 180) / Math.PI
  const length = Math.hypot(tip[0] - tail[0], tip[1] - tail[1])
  return (
    <g transform={`translate(${tail[0]} ${tail[1]}) rotate(${angle}) scale(${scale})`}>
      <path d={`M0 0 H${length}`} stroke="#b58850" strokeWidth="1" strokeLinecap="round" />
      <path d={`M${length - 1.2} -1.6 L${length + 2.6} 0 L${length - 1.2} 1.6 Z`} fill="#9aa4ae" />
      <path d="M0 0 l-1.8 -1.8 h2.4 l1.4 1.8 l-1.4 1.8 h-2.4 Z" fill={APPLE} />
    </g>
  )
}

/* ───────── 男の子 ───────── */

const HANG: Limb = { swing: 6, bend: 10 }
const CHEER_ARMS = posture('banzai', 'right')

type Mood = 'look' | 'jump' | 'sad' | 'idea' | 'aim' | 'happy'
const FACES = { look: 'normal', jump: 'strain', sad: 'sad', idea: 'surprised', aim: 'strain', happy: 'joy' } as const

/** 男の子の 場所・むき・足。うで は あとで かさねる */
function kidBase(t: number): PersonProps {
  const walkIn = walk(t, { from: -12, to: TREE_SIDE_X, start: 0.1, end: ENTER_END, ...KID, step: KID.height * 0.45 })
  const walkBack = walk(t, { from: TREE_SIDE_X, to: BOW_X, start: WALK_BACK, end: WALK_BACK_END, ...KID, step: KID.height * 0.45 })
  const turn = t < FACE_RIGHT ? turnAround(t, TURN_BACK, 'right', 'left') : turnAround(t, FACE_RIGHT, 'left', 'right')
  const x = t < WALK_BACK ? walkIn.x : walkBack.x
  const legs = t < WALK_BACK ? walkIn.pose : walkBack.pose
  // ぴょんぴょん(りんごに とどかない)と、よろこびの ジャンプ
  const hop1 = t >= HOP_START && t <= HOP_END ? Math.abs(Math.sin(((t - HOP_START) * Math.PI) / 0.45)) * 5 : 0
  const hop2 = t >= CHEER && t <= CHEER + 0.8 ? Math.abs(Math.sin(((t - CHEER) * Math.PI) / 0.4)) * 4 : 0
  const mood: Mood = t < HOP_START ? 'look' : t < HOP_END ? 'jump' : t < TURN_BACK ? 'sad' : t < NOCK ? 'idea' : t < RELEASE + 0.3 ? 'aim' : 'happy'
  return { x, y: GROUND, ...KID, ...turn, look: KID_LOOK, face: FACES[mood], lift: hop1 + hop2, pose: legs }
}

type Bow = { readonly bend: number; readonly bowScale: number; readonly stringGrow: number; readonly pull: number; readonly arrow: number }

function bowAt(t: number): Bow {
  const bend = span(t, BEND, BEND + 0.8, easeInOut)
  const drawn = span(t, NOCK, NOCK + 0.6, easeInOut)
  const released = span(t, RELEASE, RELEASE + 0.08)
  // はなした あと、ひもが ぶるぶる ふるえる
  const twang = released > 0 ? Math.cos((t - RELEASE) * 60) * Math.max(0, 1 - (t - RELEASE) / 0.35) * 0.35 : 0
  return {
    bend,
    bowScale: span(t, STICK, STICK + 0.35, backOut),
    stringGrow: span(t, TIE, TIE + 0.4),
    pull: Math.max(0, drawn * (1 - released) + twang * released),
    arrow: t >= NOCK && t < RELEASE ? Math.max(0, span(t, NOCK, NOCK + 0.2, backOut)) : 0,
  }
}

/** うでの ポーズ: とどかない ほど のばして りんごを とろうとする → たらす → 弓を にぎる・ひもを ひく → ばんざい */
function kidAt(t: number): PersonProps {
  const base = kidBase(t)
  const bow = bowAt(t)
  const reach = during(t, HOP_START - 0.05, HOP_END + 0.05, 0.15)
  const toApple: Limb = { to: [APPLE_AT[0], APPLE_AT[1] + wave(t, 0.45) * 1.5] }
  const walkNear = base.pose?.leftArm ?? HANG_ARM
  const walkFar = base.pose?.rightArm ?? HANG_ARM
  const grip = span(t, STICK - 0.1, STICK + 0.3, easeOut)
  const nearHold = mixLimb(mixLimb(walkNear, toApple, reach), { to: AIM.grip }, grip)
  // ひもを ひく 手: つがえた やの しっぽ まで。はなした あと もどる
  const draw = span(t, NOCK, NOCK + 0.5, easeOut)
  const recoil = span(t, RELEASE, RELEASE + 0.5, easeOut)
  const farBase = mixLimb(walkFar, toApple, reach)
  const farDraw = mixLimb(farBase, { to: nockAt(bow.bend, bow.pull) }, draw)
  const farHold = mixLimb(farDraw, HANG, recoil)
  const cheer = during(t, CHEER - 0.1, CHEER + 1.0, 0.2)
  const near = mixLimb(nearHold, CHEER_ARMS.leftArm ?? HANG_ARM, cheer)
  const far = mixLimb(farHold, CHEER_ARMS.rightArm ?? HANG_ARM, cheer)
  const sad = t >= SAD && t < TURN_BACK
  const aiming = t >= STICK && t < RELEASE + 0.3
  const lookUp = t < SAD ? -8 - 6 * reach : aiming ? -4 : 0
  return { ...base, pose: { ...base.pose, leftArm: near, rightArm: far, torso: sad ? 8 : 0, head: sad ? 12 : lookUp } }
}

/* ───────── まわり ───────── */

/** りんご(えだから ぶらさがる。やが あたると おちる) */
function Apple({ t }: SceneProps) {
  const show = span(t, 0.5, 0.9, backOut)
  const hit = span(t, RELEASE + 0.3, RELEASE + 0.35)
  const fall = span(t, FALL, FALL + 0.55, easeIn)
  const bounce = Math.sin(span(t, FALL + 0.55, FALL + 0.85) * Math.PI) * 3
  const drop = fall * APPLE_FALL - bounce
  const wiggle = hit > 0 && fall < 1 ? wave(t, 0.15) * 1.4 * (1 - fall) : 0
  const shake = t > HOP_START && t < HOP_END ? wave(t, 0.45) * 0.8 : 0
  const [x, y] = APPLE_AT
  return (
    <Layer opacity={show} x={wiggle + shake} y={drop} scale={Math.max(0, show)} origin={APPLE_AT}>
      {/* えだ に つながる へた。おちるとき は へた ごと はなれる */}
      <path d={`M${x} ${y - 7} L${x} ${y - 3.5}`} stroke={BARK_DARK} strokeWidth="1" strokeLinecap="round" fill="none" opacity={1 - fall} />
      <path d={`M${x + 0.6} ${y - 5} q3 -2.2 4 0.4 q-2.2 1.6 -4 -0.4 Z`} fill={PALETTE.leafDark} />
      <circle cx={x} cy={y} r={APPLE_R} fill={APPLE} />
      <path d={`M${x - 3.4} ${y - 1.6} q0.6 -2.2 2.6 -2.8`} stroke="#ff9a8f" strokeWidth="1.1" strokeLinecap="round" fill="none" />
      <path d={`M${x + 3.4} ${y + 1} q-0.6 2.6 -3 3.4`} stroke={APPLE_DARK} strokeWidth="1" strokeLinecap="round" fill="none" />
    </Layer>
  )
}

/** ひらめき の ひかり(あたまの 上) */
function IdeaBulb({ t, head }: { readonly t: number; readonly head: Pt }) {
  const show = during(t, TURN_BACK, FACE_RIGHT + 0.4, 0.2)
  if (show <= 0) return null
  const pop = span(t, TURN_BACK, TURN_BACK + 0.3, backOut)
  return (
    <Layer opacity={show} x={head[0]} y={head[1] - 21 - wave(t, 0.5) * 0.8} scale={Math.max(0, pop)}>
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x="-0.5" y="-8" width="1" height="3" rx="0.5" fill={SUN} transform={`rotate(${-75 + i * 30} 0 0)`} />
      ))}
      <circle cx="0" cy="0" r="4.2" fill={SUN} />
      <circle cx="-1.2" cy="-1.4" r="1.3" fill="#fff3b0" />
      <rect x="-2" y="3.6" width="4" height="2.6" rx="0.8" fill="#9aa4ae" />
    </Layer>
  )
}

/** ひゅっ: やが とぶ ときの すじ(やの しっぽの うしろ) */
function Swoosh({ t }: SceneProps) {
  const show = during(t, RELEASE, RELEASE + 0.3, 0.1)
  if (show <= 0) return null
  const tail = nockAt(1, 0.6)
  const [dx, dy] = AIM.dir
  return (
    <g opacity={show} stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round">
      {[-3, 0, 3].map((off) => (
        <path key={off} d={`M${tail[0] - dy * off} ${tail[1] + dx * off} l${-dx * 8} ${-dy * 8}`} />
      ))}
    </g>
  )
}

/** やが りんごに ささって いっしょに おちる(やは ささった まま) */
function FlyingArrow({ t }: SceneProps) {
  if (t < RELEASE) return null
  const fly = span(t, RELEASE, RELEASE + 0.3)
  const fall = span(t, FALL, FALL + 0.55, easeIn)
  const bounce = Math.sin(span(t, FALL + 0.55, FALL + 0.85) * Math.PI) * 3
  const drop = fall * APPLE_FALL - bounce
  const start = nockAt(1, 1)
  const startTip: Pt = [start[0] + AIM.dir[0] * ARROW_LENGTH, start[1] + AIM.dir[1] * ARROW_LENGTH]
  // さき が りんごに とどく まで とび、そのあと りんごと いっしょに おちる
  const tip = lerpPt(startTip, [APPLE_AT[0] - AIM.dir[0] * 1.5, APPLE_AT[1] - AIM.dir[1] * 1.5], fly)
  const tail: Pt = [tip[0] - AIM.dir[0] * ARROW_LENGTH, tip[1] - AIM.dir[1] * ARROW_LENGTH]
  return <Arrow tail={[tail[0], tail[1] + drop]} tip={[tip[0], tip[1] + drop]} scale={1} />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 3)
  const kid = kidAt(t)
  const head = personRig(kid).world.head
  const bow = bowAt(t)
  const holding = t >= STICK
  const landed = span(t, FALL + 0.5, FALL + 1.1)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} clouds={[[-2, 30, 1], [62, 9, 0.8]]} tufts={[6, 30, 100]} />
        <Tree x={108} y={97} height={100} grow={span(t, 0, 0.9)} sway={wave(t, 3.4) * 1.1} />
        <Apple t={t} />
        <Layer opacity={span(t, 0.1, 0.25)}>
          <Person {...kid} held={holding && kid.facing === 'right' ? <BowAndString {...bow} /> : undefined} />
        </Layer>
        <Sweat t={t} x={head[0] + 7} y={head[1] - 3} show={during(t, SAD, TURN_BACK + 0.1, 0.2)} dir={1} />
        <FlyingArrow t={t} />
        <Swoosh t={t} />
        <Dust x={APPLE_AT[0]} y={GROUND} p={landed} reach={10} />
        <IdeaBulb t={t} head={head} />
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
    { at: 0, label: 'りんごの木が そだつ', sound: 'pop' },
    { at: HOP_START, label: '男の子が とびはねるけど りんごに とどかない' },
    { at: SAD, label: 'しょんぼり。「そうだ!」と ひらめく', sound: 'pop' },
    { at: STICK, label: 'まっすぐな えだを もつ' },
    { at: BEND, label: 'ひもを はると、えだが ぐにゃり としなる', sound: 'pop' },
    { at: NOCK, label: 'やを つがえて ひく' },
    { at: RELEASE, label: 'ひゅっ! りんごに あたって おちる', sound: 'ok' },
    { at: CHEER, label: '大よろこび' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '弓 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
