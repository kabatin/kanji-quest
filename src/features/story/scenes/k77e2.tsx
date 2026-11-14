/*
 * 矢(や): ゆみで とばす やの かたち。とがった さき と、うしろの はね。(共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)
 *   1・2画目   … やの さき(やじり)のあたり。とがった ほうへ とんでいく
 *   3画目(一)  … ゆみで ひいた ひもの あたり
 *   4画目(ノ)  … ひだりした から みぎうえ へ ななめに とぶ、や の ぼう(や じく)
 *   5画目      … やの うしろの はね(の ひろがり)
 *   (字と ぴったり重ならなくても、や が ななめに とんで 字の まんなかを とおる)
 *
 * ながれ
 *   木に おいしそうな りんご → おなかが ぺこぺこの 子が、ぐう と なって りんごを 見あげる
 *   → えびらから や を ぬいて、ゆみに つがえ、ぎゅーっと ひく
 *   → ぱっと はなす。や が ななめ上へ とんで、りんごの えだ に さくっ
 *   → りんごが おちて、子は とびはねて よろこび、りんごを とりに はしる
 *   → ほね が ひかって、絵が うすくなり、字「矢」が のこる
 *
 * 子は Person(右むき)。うでは 手の 場所(to)で 指定し、ゆみ・や・ひもは 手の 場所から 描く。
 * や は、ひいた ところ から ゆみの 手を とおって、まとの えだ へ まっすぐ とぶ。はしるのは run()。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, Bird, Canopy, Dust, HANG_ARM, LOOKS, mixLimb, PALETTE, Person, personRig, run, type Expression, type Limb } from '../sceneFigures'

const CHAR = '矢'

const APPLE = '#e8534a'
const APPLE_DARK = '#c93f3a'
const BOW = '#8c5b3c'
const STRING = '#6b5a48'
const SHAFT = '#c79a62'
const HEAD_METAL = '#8d98a8'
const FEATHER_RED = '#e8534a'
const QUIVER = '#a0673f'

/** くぎり の時間(秒) */
const HUNGRY = 0.8
const NOTICE = 2.0
const GRAB = 2.8
const RAISE = 3.0
const DRAW = 3.2
const RELEASE = 4.4
/** や が えだ に とどく(りんごの くき を きる) */
const HIT = 4.7
const LAND = 5.38
const RUN = 5.3
const INK = 6.5
const DONE = 9.3
const DURATION = 10

type Pt = readonly [number, number]

/** 子の 足もと・背の高さ・立つ x、はしって いく さき */
const KID_X = 22.5
const GROUND_Y = 96
const KID_BASE = { x: KID_X, y: GROUND_Y, build: 'child', height: 54, facing: 'right' } as const
const RUN_TO = 44.5
const KID_LOOK = { ...LOOKS.boy, top: '#f2994a' } as const

/** ゆみを もつ 手(のばした うで)の ねらい と、まとの りんごの くき */
const HAND_AIM: Pt = [34.5, 43.5]
const TARGET: Pt = [60.5, 17.5]
/** ゆみの 手から、や を ひく 手 まで(あご の ところ)の ながさ。や の ながさ */
const DRAW_LEN = 14
const ARROW_LEN = 22

/** りんごの いち。えだ から ぶらさがる */
const APPLE_POS: Pt = [60.5, 22.6]
const APPLE_FLOOR = 92.6
const GRAVITY = (2 * (APPLE_FLOOR - APPLE_POS[1])) / (LAND - HIT) ** 2

/* ───────── 立った ままの 体から、ゆみ・や・えびら の きまり を 出す ───────── */

const STAND = personRig(KID_BASE)
const SHOULDER_Y = STAND.world.arms.left.root[1]
const PELVIS = STAND.world.pelvis
/** ゆみの 手(ねらった とき の じっさいの 手の いち)と、ねらう むき */
const GRIP: Pt = personRig({ ...KID_BASE, pose: { rightArm: { to: HAND_AIM } } }).world.arms.right.end
const AIM = Math.atan2(GRIP[1] - TARGET[1], TARGET[0] - GRIP[0])
const AIM_DEG = (AIM * 180) / Math.PI
const AIM_DIR: Pt = [Math.cos(AIM), -Math.sin(AIM)]
const NOCK_REST: Pt = [GRIP[0] - AIM_DIR[0] * 4, GRIP[1] - AIM_DIR[1] * 4]
const NOCK_FULL: Pt = [GRIP[0] - AIM_DIR[0] * DRAW_LEN, GRIP[1] - AIM_DIR[1] * DRAW_LEN]
/** ひききった とき の 左手(じっさいに とどく ところ)。や は ここから とぶ */
const NOCK_REAL: Pt = personRig({ ...KID_BASE, pose: { rightArm: { to: HAND_AIM }, leftArm: { to: NOCK_FULL } } }).world.arms.left.end
const FLY_VEC: Pt = [TARGET[0] - NOCK_REAL[0], TARGET[1] - NOCK_REAL[1]]
/** えびら(せなかの や いれ)の まんなか と かたむき、くち(や を ぬく ところ) */
const QUIVER_TILT = 18
const QUIVER_AT: Pt = [PELVIS[0] - 9, SHOULDER_Y + 4]
const QUIVER_MOUTH: Pt = [QUIVER_AT[0] - 2.5, QUIVER_AT[1] - 7.6]
const BELLY: Pt = [PELVIS[0] + 5, (SHOULDER_Y + PELVIS[1]) / 2 + 2]
const CHEER_NEAR: Limb = { swing: 150, bend: 30 }
const CHEER_FAR: Limb = { swing: 140, bend: 35 }

/* ───────── 小さな どうぐ ───────── */

const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/** (時間, 値) の ならび を、なめらかに つなぐ */
function track(t: number, keys: readonly (readonly [number, number])[]): number {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 0; i < keys.length - 1; i += 1) {
    if (t < keys[i + 1][0]) return lerp(keys[i][1], keys[i + 1][1], span(t, keys[i][0], keys[i + 1][0], easeInOut))
  }
  return keys[keys.length - 1][1]
}

/** (時間, うで の かっこう) の ならび を、なめらかに つなぐ */
function limbTrack(t: number, keys: readonly (readonly [number, Limb])[]): Limb {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 0; i < keys.length - 1; i += 1) {
    if (t < keys[i + 1][0]) return mixLimb(keys[i][1], keys[i + 1][1], span(t, keys[i][0], keys[i + 1][0], easeInOut))
  }
  return keys[keys.length - 1][1]
}

/* ───────── 木・りんご ───────── */

/** りんごの 木。みき が のびて 葉が しげる。りんごは えだの さきから ぶらさがる。 */
function AppleTree({ t }: SceneProps) {
  const trunk = span(t, 0, 0.55, backOut)
  const leaves = span(t, 0.3, 0.9, backOut)
  const sway = wave(t, 3.4) * 1.0
  return (
    <>
      <ellipse cx="94" cy="97.6" rx={Math.max(0, 14 * trunk)} ry="2.6" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.6 + 0.4 * trunk} scaleY={trunk} origin={[94, 97]}>
        <path d="M85 98 Q91.5 91 90.8 74 L90.4 30 L98.4 30 L98 74 Q98 91 104 98 Z" fill={PALETTE.bark} />
        <path d="M93.4 52 q1.4 5 0 10 M96 68 q-1.2 5 0.2 9" fill="none" stroke={PALETTE.barkDark} strokeWidth="1.2" strokeLinecap="round" />
      </Layer>
      {/* りんごの えだ: 葉の かたまり から のびて、さき に りんごが ぶらさがる */}
      <Layer scale={leaves} origin={[88, 30]}>
        <path d="M69 16 Q64 14 60.5 17.5" fill="none" stroke={PALETTE.bark} strokeWidth="2" strokeLinecap="round" />
        <path d="M63.6 13.6 q-3.4 -1.4 -4.4 0.8 q2.4 1.8 4.4 -0.8 Z" fill={PALETTE.leaf} />
      </Layer>
      <Canopy x={89} y={19} r={24} grow={span(t, 0.3, 0.9)} sway={sway} />
    </>
  )
}

/** りんご。くき が きれると おちて、ぽん と はずむ。 */
function Apple({ t }: SceneProps) {
  const show = span(t, 0.5, 1.1, backOut)
  const fall = Math.max(0, t - HIT)
  const dropping = t >= HIT && t < LAND
  const landed = t >= LAND
  const bounce = landed ? Math.sin(span(t, LAND, LAND + 0.42) * Math.PI) * 7 : 0
  const y = dropping ? APPLE_POS[1] + 0.5 * GRAVITY * fall * fall : landed ? APPLE_FLOOR - bounce : APPLE_POS[1]
  const spin = dropping ? fall * 220 : landed ? 150 : 0
  const [ax, ay] = APPLE_POS
  return (
    <Layer y={y - ay} scale={show} origin={APPLE_POS}>
      <g transform={`rotate(${spin} ${ax} ${ay})`}>
        <path d={`M${ax} ${ay - 4} v-2.4`} stroke={PALETTE.barkDark} strokeWidth="1" strokeLinecap="round" fill="none" />
        <circle cx={ax - 1.6} cy={ay + 0.4} r="3.7" fill={APPLE} />
        <circle cx={ax + 1.6} cy={ay + 0.4} r="3.7" fill={APPLE} />
        <circle cx={ax + 2.4} cy={ay + 1.4} r="2.3" fill={APPLE_DARK} />
        <ellipse cx={ax - 2} cy={ay - 1.4} rx="1.1" ry="0.7" fill="#ffffff" opacity="0.6" />
      </g>
    </Layer>
  )
}

/** りんごが ぴかっと 見える きらり(「ほしいな」の きもち) */
function AppleShine({ t }: SceneProps) {
  const show = during(t, NOTICE - 0.1, GRAB + 0.1, 0.2)
  if (show <= 0) return null
  const pulse = 0.7 + 0.3 * wave(t, 0.5)
  return (
    <g opacity={show}>
      <Star cx={APPLE_POS[0] + 4} cy={APPLE_POS[1] - 3.4} r={3.2 * pulse} color="#fff6a8" spin={t * 40} />
    </g>
  )
}

/** や が えだ に あたった しゅんかんの ぱっと ひろがる すじ と、おちる 葉。 */
function Impact({ t }: SceneProps) {
  const burst = during(t, HIT - 0.1, HIT + 0.35, 0.1)
  const p = span(t, HIT - 0.1, HIT + 0.35, easeOut)
  const leafP = span(t, HIT, HIT + 1.3)
  return (
    <>
      {burst > 0 && (
        <g opacity={burst} stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round">
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * Math.PI * 2 + 0.4
            return <line key={i} x1={TARGET[0] + Math.cos(a) * (3 + p * 2)} y1={TARGET[1] + Math.sin(a) * (3 + p * 2)} x2={TARGET[0] + Math.cos(a) * (6 + p * 5)} y2={TARGET[1] + Math.sin(a) * (6 + p * 5)} />
          })}
        </g>
      )}
      {leafP > 0 && leafP < 1 && (
        <path d="M0 -2.6 Q2.4 0 0 2.6 Q-2.4 0 0 -2.6 Z" fill={PALETTE.leafLight} stroke={PALETTE.leafDark} strokeWidth="0.4" opacity={1 - leafP ** 3} transform={`translate(${70 + Math.sin(leafP * 8) * 4} ${14 + leafP * 70}) rotate(${Math.sin(leafP * 8) * 50})`} />
      )}
    </>
  )
}

/** や の さき を かくす、まえの 葉(や は 葉に さささる) */
function FrontLeaves({ t }: SceneProps) {
  return (
    <Layer scale={span(t, 0.3, 0.9, backOut)} origin={[88, 30]}>
      <circle cx="68.4" cy="11.6" r="4.2" fill={PALETTE.leaf} />
      <circle cx="70" cy="14.6" r="2.4" fill={PALETTE.leafLight} />
    </Layer>
  )
}

/** 空を わたる 小鳥。にぎやかし。 */
function Flyer({ t }: SceneProps) {
  const p = span(t, 0.5, 3.8)
  if (p <= 0 || p >= 1) return null
  return <Bird x={-6 + p * 70} y={10 + Math.sin(p * 9) * 2} t={t} flying facing="right" color="#7a6fd0" dark="#5d52b8" />
}

/* ───────── ゆみ・や・えびら ───────── */

/** や。tail(はね の ほう)を 原点に、右へ のびる。angle は 水平から 上へ の角度。 */
function Arrow({ tail, angle }: { readonly tail: Pt; readonly angle: number }) {
  return (
    <g transform={`translate(${tail[0]} ${tail[1]}) rotate(${-angle})`}>
      <rect x="0" y="-0.65" width={ARROW_LEN - 4} height="1.3" rx="0.6" fill={SHAFT} />
      <path d={`M${ARROW_LEN - 5} -2.5 L${ARROW_LEN} 0 L${ARROW_LEN - 5} 2.5 Z`} fill={HEAD_METAL} />
      <path d="M-0.8 0 L1.8 -3 L6 -3 L4.4 0 Z" fill={FEATHER_RED} />
      <path d="M-0.8 0 L1.8 3 L6 3 L4.4 0 Z" fill="#ffffff" />
    </g>
  )
}

/** ゆみ。手(grip)を まんなか に、axis の むきに のびる。nock は ひいた ひもの 手。 */
function Bow({ grip, axisDeg, nock }: { readonly grip: Pt; readonly axisDeg: number; readonly nock: Pt }) {
  const rad = (axisDeg * Math.PI) / 180
  const u: Pt = [Math.cos(rad), -Math.sin(rad)]
  // ゆみの ふくらむ むき(うでを のばす むき)
  const a: Pt = [Math.cos(rad - Math.PI / 2), -Math.sin(rad - Math.PI / 2)]
  const half = 11
  const back = 4
  const top: Pt = [grip[0] - a[0] * back + u[0] * half, grip[1] - a[1] * back + u[1] * half]
  const bottom: Pt = [grip[0] - a[0] * back - u[0] * half, grip[1] - a[1] * back - u[1] * half]
  const ctrl: Pt = [grip[0] + a[0] * back, grip[1] + a[1] * back]
  return (
    <>
      <path d={`M${top[0]} ${top[1]} L${nock[0]} ${nock[1]} L${bottom[0]} ${bottom[1]}`} fill="none" stroke={STRING} strokeWidth="0.55" strokeLinejoin="round" />
      <path d={`M${top[0]} ${top[1]} Q${ctrl[0]} ${ctrl[1]} ${bottom[0]} ${bottom[1]}`} fill="none" stroke={BOW} strokeWidth="2.1" strokeLinecap="round" />
    </>
  )
}

/** えびら: せなかの や いれ。や の はね が のぞく(1本 ぬいても 何本か のこる) */
function Quiver() {
  return (
    <g transform={`rotate(${-QUIVER_TILT} ${QUIVER_AT[0]} ${QUIVER_AT[1]})`}>
      <rect x={QUIVER_AT[0] - 3} y={QUIVER_AT[1] - 8} width="6" height="16" rx="2.6" fill={QUIVER} />
      <path d={`M${QUIVER_AT[0] - 2.2} ${QUIVER_AT[1] - 8} l0.8 -3.6 l1.6 3.6 Z`} fill={FEATHER_RED} />
      <path d={`M${QUIVER_AT[0] + 0.8} ${QUIVER_AT[1] - 8} l0.4 -3.2 l1.6 3.2 Z`} fill="#ffffff" />
    </g>
  )
}

/* ───────── 子 ───────── */

function faceAt(t: number): Expression {
  if (t < NOTICE) return 'sad'
  if (t < GRAB + 0.1) return 'surprised'
  return t < HIT ? 'normal' : 'joy'
}

function Child({ t }: SceneProps) {
  const grumble = during(t, HUNGRY + 0.2, NOTICE - 0.1, 0.2)
  const belly = grumble > 0 ? Math.sin(t * 14) : 0
  const appear = span(t, 0.1, 0.45)

  // はしる(りんごを とりに): 0.85 秒。それまでは 立っている
  const r = run(t, { from: KID_X, to: RUN_TO, start: RUN, end: RUN + 0.85, build: 'child', height: 54 })
  const hop = Math.sin(span(t, HIT + 0.05, HIT + 0.55) * Math.PI) * 5 + Math.sin(span(t, RUN + 0.9, RUN + 1.3) * Math.PI) * 2.5

  // てまえの うで(左): はらぺこ → えびらから や を ぬく → ひく → ばんざい
  const near = limbTrack(t, [
    [0, HANG_ARM], [HUNGRY, HANG_ARM], [HUNGRY + 0.3, { to: BELLY }], [NOTICE, { to: BELLY }], [NOTICE + 0.4, HANG_ARM],
    [GRAB, { to: QUIVER_MOUTH }], [GRAB + 0.2, { to: QUIVER_MOUTH }], [RAISE + 0.6, { to: NOCK_REST }], [RELEASE - 0.4, { to: NOCK_FULL }], [RELEASE + 0.1, { to: NOCK_FULL }], [RELEASE + 0.5, CHEER_NEAR],
  ])
  // むこうの うで(右): ゆみを もつ
  const far = limbTrack(t, [[0, HANG_ARM], [RAISE, HANG_ARM], [RAISE + 0.6, { to: HAND_AIM }], [RELEASE + 0.5, { to: HAND_AIM }], [RELEASE + 1.0, CHEER_FAR]])
  const headTilt = track(t, [[0, 2], [HUNGRY + 0.3, 6], [NOTICE, 6], [NOTICE + 0.5, -12], [HIT, -12], [HIT + 0.5, 0], [RUN + 0.8, 0], [RUN + 1.2, -6]])
  const props = { ...r, y: GROUND_Y, lift: r.lift + hop, pose: { ...r.pose, leftArm: near, rightArm: far, head: headTilt } }
  const rig = personRig(props)
  const nearHand = rig.world.arms.left.end
  const grip = rig.world.arms.right.end

  // ゆみ: さげて もつ → ねらう むき → また さげる。ひも: ひく と のびて、はなすと ぶるぶる ふるえる
  const axisDeg = track(t, [[0, 90], [RAISE, 90], [RAISE + 0.6, AIM_DEG + 90], [RELEASE + 0.5, AIM_DEG + 90], [RELEASE + 1.0, 90]])
  const decay = 1 - span(t, RELEASE, RELEASE + 0.5)
  const pull = t < RAISE + 0.6 ? 4 : t < RELEASE ? -1 : 4 + (DRAW_LEN - 4) * decay * Math.cos((t - RELEASE) * 36)
  const nock: Pt = pull < 0 ? nearHand : [grip[0] - AIM_DIR[0] * pull, grip[1] - AIM_DIR[1] * pull]
  const arrowAngle = track(t, [[GRAB + 0.2, 90 + QUIVER_TILT], [RAISE + 0.6, AIM_DEG]])
  const slide = t >= RELEASE ? span(t, RELEASE, HIT + 0.08) : 0
  const arrowTail: Pt = t < RELEASE ? nearHand : [NOCK_REAL[0] + FLY_VEC[0] * slide, NOCK_REAL[1] + FLY_VEC[1] * slide]

  return (
    <Layer opacity={appear}>
      <Layer x={props.x - KID_X} y={-props.lift}>
        <Quiver />
      </Layer>
      <Person {...props} look={KID_LOOK} face={faceAt(t)} />
      {/* おなかが ぐう: 2本の ゆれる すじ */}
      {grumble > 0 && (
        <g opacity={grumble} fill="none" stroke="#e8534a" strokeWidth="0.9" strokeLinecap="round">
          <path d={`M${PELVIS[0] + 9} ${PELVIS[1] - 8 + belly * 0.6} q2 1.6 0 3.2 q-2 1.6 0 3.2`} />
          <path d={`M${PELVIS[0] + 12} ${PELVIS[1] - 9 - belly * 0.6} q2 1.6 0 3.2 q-2 1.6 0 3.2`} />
        </g>
      )}
      <Bow grip={grip} axisDeg={axisDeg} nock={nock} />
      {t >= GRAB + 0.05 && t < RELEASE && <Arrow tail={arrowTail} angle={arrowAngle} />}
      {t >= RELEASE && <Arrow tail={arrowTail} angle={AIM_DEG} />}
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} tufts={[6, 52, 74, 104]} />
        <Flyer t={t} />
        <AppleTree t={t} />
        <Apple t={t} />
        <AppleShine t={t} />
        <Child t={t} />
        <FrontLeaves t={t} />
        <Impact t={t} />
        <Dust x={APPLE_POS[0]} y={APPLE_FLOOR + 1.4} p={span(t, LAND, LAND + 0.5, easeOut)} reach={9} />
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
    { at: 0, label: 'りんごの 木。おなかが ぺこぺこの 子', sound: 'pop' },
    { at: NOTICE, label: 'りんごを 見つけた' },
    { at: GRAB, label: 'えびらから や を ぬいて、ゆみに つがえる' },
    { at: DRAW, label: 'ぎゅーっと ひく' },
    { at: RELEASE, label: 'はなす。や が えだへ とんでいく', sound: 'stroke' },
    { at: HIT, label: 'さくっ。りんごが おちて、子は おおよろこび', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '矢 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
