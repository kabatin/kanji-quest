/*
 * 肉(にく): 切り分けた お肉の 形。中に すじが 2本。
 *
 * ほね(画と絵の対応)
 *   1・2画目   … 切り分けた お肉の ふち(左の たて と、上・右・右下の まるい かど)
 *   3・4画目   … お肉の 中の すじ その1(上の「入」の かたち)。3画目の 上の 先は、お肉を つるす ひも
 *   5・6画目   … お肉の 中の すじ その2(下の「入」の かたち)
 *
 * ながれ
 *   つるした 大きな お肉 → おなかの すいた コックさんが あるいてくる(おなかが ぐう、よだれ)
 *   → ほうちょうを ふりあげて、ざくっ と お肉の はしを 切り おとす
 *   → 切り分けた お肉に、きれいな すじが 2本 見えて、コックさん わーい と よろこぶ
 *   → ほね が ひかって、絵が うすくなり、字「肉」が のこる
 *
 * 人は Person(おとな)。あるきは walk、うでは かた から ひじ で まがる 角度で うごかす。
 * ほうちょうは 手に にぎって うで と いっしょに うごく(held)。コックぼうは headwear。字の形に なるのは、お肉の ほうだけ。
 * へやは Room。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { HANG_ARM, LOOKS, mixLimb, Person, personRig, Room, walk, type Expression, type Limb } from '../sceneFigures'

const CHAR = '肉'

const MEAT = '#e2675f'
const MEAT_DARK = '#c94f4d'
const MEAT_LIGHT = '#f08a82'
const FAT = '#ffdccb'
const STEEL = '#8a95a3'
const TWINE = '#a8895c'
const COAT = '#f6f8fb'
const COAT_DARK = '#d3dde9'
const PANTS = '#4a5a78'
const KNIFE_BLADE = '#dfe7ef'
const WOOD = '#8c5b3c'
const WALL = '#e9f1f8'
const FLOOR = '#f1e3c9'

/** くぎり の時間(秒) */
const ENTER = 0.3
const STAND = 1.4
const RAISE = 1.8
const UP = 2.8
const CHOP = 3.0
/** ざくっ と 切れた しゅんかん */
const HIT = 3.25
const CHEER = 3.9
const LOWER = 4.6
const INK = 6.3
const DONE = 8.9
const DURATION = 9.6

/** お肉: 左上(20.5, 28)〜右下(90.5, 91)の 切り分けた かたち(1・2画目の わく) */
const SLAB = { x: 20.5, y: 28, w: 70, h: 63, r: 7 } as const
/** お肉を つるす ひも の ところ(3画目の 書きはじめ) */
const HOOK: readonly [number, number] = [53.3, 12.8]
/** 3画目の うち、ひも に あたる 上の ぶぶん(のこりが お肉の中の すじ) */
const TWINE_PART = 0.32
/** コックさん: 右(お肉の ほう)を むく。立つ場所(こし の x)と 地面、体格 */
const COOK = { x: 14, y: 96, build: 'adult', height: 62 } as const
const COOK_LOOK = { ...LOOKS.man, top: COAT, bottom: PANTS } as const
const FLOOR_Y = 88

/** お肉の おく ぼう(天井)と、ゆかの 目じるし */
function Rail({ t }: SceneProps) {
  const show = span(t, 0, 0.5, easeOut)
  return (
    <g opacity={show}>
      <rect x="32" y="3" width="42" height="3.6" rx="1.8" fill={STEEL} />
      <rect x="34.5" y="0" width="2.4" height="3.4" fill={STEEL} />
      <rect x="69.1" y="0" width="2.4" height="3.4" fill={STEEL} />
    </g>
  )
}

/** うで の かっこう。upper / fore = ま下から まえ(右)へ ふった角度(ひじ から さき) */
type ArmPose = { readonly upper: number; readonly fore: number }

const armLimb = (pose: ArmPose): Limb => ({ swing: pose.upper, bend: Math.max(0, pose.fore - pose.upper) })

/** ほうちょう。手の まんなか が 0,0。はもの は 前うで の むきに のびる(下むきで 描いて、むきを かえる) */
function Knife({ hand, elbow }: { readonly hand: readonly [number, number]; readonly elbow: readonly [number, number] }) {
  const angle = (Math.atan2(-(hand[0] - elbow[0]), hand[1] - elbow[1]) * 180) / Math.PI
  return (
    <Layer x={hand[0]} y={hand[1]} rotate={angle}>
      {/* えを にぎる ぶぶん、つば、はもの */}
      <rect x="-1.6" y="-4" width="3.2" height="7" rx="1.4" fill={WOOD} />
      <rect x="-2.6" y="3" width="5.2" height="1.3" rx="0.6" fill={STEEL} />
      <path d="M-1.6 4.3 H5.4 V14.6 Q5.4 16.2 3.8 16.2 H-1.6 Z" fill={KNIFE_BLADE} />
      <rect x="0.2" y="6" width="1.2" height="7.4" rx="0.6" fill="#ffffff" opacity="0.85" />
    </Layer>
  )
}

/** コックぼう(headwear)。あたまの まんなか が 0,0、半径 1 の 座標。ふくらんだ 3つの まるい ぶぶん と おび */
function ChefHat() {
  return (
    <>
      <circle cx="-0.59" cy="-1.59" r="0.52" fill={COAT} />
      <circle cx="0.59" cy="-1.59" r="0.52" fill={COAT} />
      <circle cx="0" cy="-1.9" r="0.61" fill={COAT} />
      <rect x="-0.88" y="-1.35" width="1.76" height="0.7" rx="0.28" fill={COAT} />
      <path d="M-0.76 -0.78 H0.76" stroke={COAT_DARK} strokeWidth="0.15" strokeLinecap="round" />
    </>
  )
}

/** おなかが「ぐう」と なる しるし(コックさんの おなかの まえ に ふるえる せん) */
function Rumble({ t, at }: { readonly t: number; readonly at: readonly [number, number] }) {
  const show = during(t, STAND - 0.3, RAISE + 0.3, 0.2)
  if (show <= 0) return null
  const w = wave(t, 0.3)
  return (
    <g opacity={show} fill="none" stroke="#e8a33d" strokeWidth="1" strokeLinecap="round" transform={`translate(${at[0] + w * 0.5} ${at[1]})`}>
      <path d="M0 0 q2.4 2.6 0 5.2" />
      <path d="M2.6 -1.6 q3.4 4.2 0 8.4" />
    </g>
  )
}

/** よだれ(おなかが すいている あいだ だけ。口の よこ から たれる) */
function Drool({ at, drool }: { readonly at: readonly [number, number]; readonly drool: number }) {
  return <path d="M0 0 Q1.2 2.2 0 3.2 Q-1.2 2.2 0 0 Z" fill="#7cc4f2" transform={`translate(${at[0]} ${at[1] + drool * 2.4})`} opacity={1 - drool * 0.5} />
}

/** お肉の ふち(切り分けた かたち)。したに こい色の おびを のこして、かげ に する。 */
function Slab() {
  return (
    <>
      <rect x={SLAB.x} y={SLAB.y} width={SLAB.w} height={SLAB.h} rx={SLAB.r} fill={MEAT_DARK} />
      <rect x={SLAB.x} y={SLAB.y} width={SLAB.w} height={SLAB.h - 2.6} rx={SLAB.r} fill={MEAT} />
      <rect x={SLAB.x + 4} y={SLAB.y + 3.4} width="16" height="3" rx="1.5" fill={MEAT_LIGHT} />
    </>
  )
}

/** 切り おとされる はしっこ。お肉と おなじ 色で、かたち の でっぱり に して 見せる。 */
function Scrap({ cx, cy, r }: { readonly cx: number; readonly cy: number; readonly r: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={MEAT_DARK} />
      <circle cx={cx - 0.4} cy={cy - 1} r={r * 0.88} fill={MEAT} />
    </>
  )
}

/** すじ(3〜6画目)。切り口から 見えてきて、きれいな 白い すじが 2本 のこる。 */
function Marbling({ progress }: { readonly progress: number }) {
  if (progress <= 0) return null
  const own = (i: number) => Math.min(Math.max(progress * 4 - i, 0), 1)
  return (
    <>
      <Bone char={CHAR} n={3} color={FAT} width={3.2} from={TWINE_PART} to={TWINE_PART + (1 - TWINE_PART) * own(0)} />
      <Bone char={CHAR} n={4} color={FAT} width={3.2} to={own(1)} />
      <Bone char={CHAR} n={5} color={FAT} width={3.2} to={own(2)} />
      <Bone char={CHAR} n={6} color={FAT} width={3.2} to={own(3)} />
    </>
  )
}

/** つるした お肉。ほうちょうが あたると ぶらんと ゆれて、すぐ おさまる。 */
function Meat({ t }: SceneProps) {
  const appear = span(t, 0, 0.6, easeOut)
  const since = Math.max(t - HIT, 0)
  const settle = 1 - span(t, INK - 0.6, INK - 0.2)
  const sway = (t < HIT ? wave(t, 2.4) * 0.5 : Math.exp(-since * 1.5) * Math.sin(since * 7) * 3) * settle
  // はしっこ: 上の は ぽーん と とんで、下の は ぽとん と おちる
  const fly = span(t, HIT, HIT + 1.1)
  const flyX = -fly * 48
  const flyY = -48 * fly + 82 * fly * fly
  const drop = span(t, HIT, HIT + 0.45, easeIn)
  const dropFade = 1 - span(t, HIT + 0.55, HIT + 1.1)
  const veins = span(t, HIT + 0.55, HIT + 1.9, easeOut)
  return (
    <Layer scale={appear} rotate={sway} origin={[HOOK[0], 9]}>
      {/* ひも と かぎ */}
      <path d={`M${HOOK[0]} 6.5 V${SLAB.y + 3}`} stroke={TWINE} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={HOOK[0]} cy="9" r="2.4" fill="none" stroke={STEEL} strokeWidth="1.3" />
      <Layer x={flyX} y={flyY} rotate={fly * 260} origin={[20, 30]}>
        <Scrap cx={20} cy={30} r={9} />
      </Layer>
      <Layer y={drop * 6.5} opacity={dropFade}>
        <Scrap cx={24} cy={88} r={6.4} />
      </Layer>
      <Slab />
      <Marbling progress={veins} />
    </Layer>
  )
}

/** ざくっ と 切れた しゅんかんの ひかり */
function Slash({ t }: SceneProps) {
  const show = during(t, HIT - 0.03, HIT + 0.45, 0.06)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      <Star cx={SLAB.x + 1} cy={60} r={6 * show + 1} color="#ffffff" spin={40} />
      <Star cx={SLAB.x + 2} cy={42} r={3} color="#ffd24a" />
      <Star cx={SLAB.x + 2} cy={78} r={3} color="#ffd24a" spin={20} />
    </g>
  )
}

/** お肉の ぴかぴか(おいしそう の しるし) */
function Shine({ t }: SceneProps) {
  const show = during(t, HIT + 1.3, INK, 0.3)
  if (show <= 0) return null
  const pulse = 0.8 + 0.2 * wave(t, 0.9)
  return (
    <g opacity={show}>
      <Star cx={78} cy={36} r={3.6 * pulse} color="#fff6c4" spin={t * 40} />
      <Star cx={30} cy={80} r={2.8 * pulse} color="#fff6c4" spin={-t * 40} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  // あるく: 左から お肉の そばまで
  const w = walk(t, { from: -20, to: COOK.x, start: ENTER, end: STAND, build: COOK.build, height: COOK.height })
  // よろこびの ジャンプ(字になる まえに おさまる)
  const settle = 1 - span(t, INK - 0.5, INK - 0.1)
  const hop = t > CHEER + 0.3 ? Math.min(Math.abs(wave(t - CHEER - 0.3, 0.9)) * 2.6 * settle, 4) : 0

  // ほうちょうの うで(むこう がわ から 見て てまえ): ふりあげる → ざくっ と おろす → さげる
  const swing = span(t, RAISE, UP, easeInOut) * (1 - span(t, CHOP, HIT, easeIn))
  const chopped = span(t, CHOP, HIT, easeIn) * (1 - span(t, LOWER, LOWER + 0.6, easeInOut))
  const knifeArm: ArmPose = { upper: 4 + 131 * swing + 5 * chopped, fore: 12 + 178 * swing + 15 * chopped }
  const near: Limb = t < RAISE ? (w.pose.leftArm ?? HANG_ARM) : armLimb(knifeArm)
  // もう 1本の うで: あるくときは ふり、よろこぶときは ばんざい
  const cheer = span(t, CHEER, CHEER + 0.5, backOut)
  const far: Limb = cheer > 0 ? mixLimb(w.pose.rightArm ?? HANG_ARM, { swing: 170, bend: 8 }, cheer) : (w.pose.rightArm ?? HANG_ARM)

  const mood: 'hungry' | 'happy' = t < HIT + 0.1 ? 'hungry' : 'happy'
  const face: Expression = mood === 'hungry' ? 'worried' : 'joy'
  const drool = (t * 1.2) % 1

  const cook = { ...w, y: COOK.y, lift: hop, pose: { ...w.pose, leftArm: near, rightArm: far } } as const
  const rig = personRig(cook)
  const knife = <Knife hand={rig.world.arms.left.end} elbow={rig.world.arms.left.mid} />
  const mouth: readonly [number, number] = [rig.world.head[0] + rig.body.headR * rig.scale * 0.62, rig.world.head[1] + rig.body.headR * rig.scale * 0.62]
  const belly: readonly [number, number] = [rig.world.pelvis[0] + 7, rig.world.pelvis[1] - 10]

  return (
    <>
      <Layer opacity={ink.picture}>
        <Room floor={FLOOR_Y} window={null} wall={WALL} floorColor={FLOOR} />
        <Rail t={t} />
        <Meat t={t} />
        <Shine t={t} />
        <Layer opacity={span(t, ENTER - 0.1, ENTER + 0.15)}>
          <Person {...cook} look={COOK_LOOK} face={face} headwear={<ChefHat />} held={knife} />
          {mood === 'hungry' && t >= STAND && <Drool at={mouth} drool={drool} />}
          <Rumble t={t} at={belly} />
        </Layer>
        <Slash t={t} />
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
    { at: 0, label: 'お肉が ぶらさがる', sound: 'pop' },
    { at: ENTER, label: 'おなかの すいた コックさんが あるいてくる' },
    { at: RAISE, label: 'ほうちょうを ふりあげる' },
    { at: HIT, label: 'ざくっ と 切り分ける', sound: 'pop' },
    { at: CHEER + 0.5, label: 'すじが 2本 見えて、わーい' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '肉 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
