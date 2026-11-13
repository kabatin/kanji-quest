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
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(かた → ひじ → 手 の じゅんに つなげる)。
 *   ほうちょうは 手に にぎって、うで と いっしょに うごく。字の形に なるのは、お肉の ほうだけ。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '肉'

const MEAT = '#e2675f'
const MEAT_DARK = '#c94f4d'
const MEAT_LIGHT = '#f08a82'
const FAT = '#ffdccb'
const STEEL = '#8a95a3'
const TWINE = '#a8895c'
const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const COAT = '#f6f8fb'
const COAT_DARK = '#d3dde9'
const BUTTON = '#8aa0b8'
const PANTS = '#4a5a78'
const SHOE = '#6b4a36'
const FLOOR = '#f1e3c9'
const FLOOR_LINE = '#e2cfa8'
const KNIFE_BLADE = '#dfe7ef'
const WOOD = '#8c5b3c'

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
/** コックさんの かた(ほうちょうを もつ 右うで と、左うで)。体は 右(お肉の ほう)を むく */
const SHOULDER_R: readonly [number, number] = [16.5, 58]
const SHOULDER_L: readonly [number, number] = [7.5, 58]
/** うで の ぶぶん(かた〜ひじ、ひじ〜手)の 長さ */
const ARM_PART = 12
const rad = (deg: number) => (deg * Math.PI) / 180

function Floor({ t }: SceneProps) {
  const show = span(t, 0, 0.5, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx="54.5" cy="98" rx="52" ry="5.6" fill={FLOOR} />
      <path d="M12 97 h14 M40 99.4 h18 M72 97.4 h16" stroke={FLOOR_LINE} strokeWidth="1.1" strokeLinecap="round" />
      {/* 天井の ぼう(お肉を ひっかける) */}
      <rect x="32" y="3" width="42" height="3.6" rx="1.8" fill={STEEL} />
      <rect x="34.5" y="0" width="2.4" height="3.4" fill={STEEL} />
      <rect x="69.1" y="0" width="2.4" height="3.4" fill={STEEL} />
    </g>
  )
}

/** うで の かっこう。upper / fore = ま下から まえ(右)へ ふった角度(ひじ から さき) */
type ArmPose = { readonly upper: number; readonly fore: number }

/** かた → ひじ → 手 の じゅんに つなぐ。手の 位置も 返す。 */
function limbPoints(shoulder: readonly [number, number], pose: ArmPose) {
  const elbow = [shoulder[0] + Math.sin(rad(pose.upper)) * ARM_PART, shoulder[1] + Math.cos(rad(pose.upper)) * ARM_PART] as const
  const hand = [elbow[0] + Math.sin(rad(pose.fore)) * ARM_PART, elbow[1] + Math.cos(rad(pose.fore)) * ARM_PART] as const
  return { elbow, hand }
}

function Knife() {
  return (
    <>
      {/* えを にぎる ぶぶん、つば、はもの(まっすぐ 下を むく) */}
      <rect x="-1.6" y="-4" width="3.2" height="7" rx="1.4" fill={WOOD} />
      <rect x="-2.6" y="3" width="5.2" height="1.3" rx="0.6" fill={STEEL} />
      <path d="M-1.6 4.3 H5.4 V14.6 Q5.4 16.2 3.8 16.2 H-1.6 Z" fill={KNIFE_BLADE} />
      <rect x="0.2" y="6" width="1.2" height="7.4" rx="0.6" fill="#ffffff" opacity="0.85" />
    </>
  )
}

function Arm({ shoulder, pose, knife }: { readonly shoulder: readonly [number, number]; readonly pose: ArmPose; readonly knife: boolean }) {
  const { elbow, hand } = limbPoints(shoulder, pose)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={COAT_DARK} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
      {knife ? (
        <Layer x={hand[0]} y={hand[1]} rotate={-pose.fore}>
          <Knife />
        </Layer>
      ) : null}
      <circle cx={hand[0]} cy={hand[1]} r="2.9" fill={SKIN} />
    </>
  )
}

type Mood = 'hungry' | 'happy'

function Face({ mood, drool }: { readonly mood: Mood; readonly drool: number }) {
  return (
    <>
      <circle cx="13.4" cy="49.6" r="1.9" fill="#ff9d9d" opacity="0.55" />
      {mood === 'hungry' ? (
        <>
          {/* まゆ が さがって、かなしそうな 目 */}
          <path d="M12.6 44.2 l3 -1.2 M17 43 l3 1.2" stroke="#5a3b2a" strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="14.6" cy="46.4" r="1.15" fill="#2b2b2b" />
          <circle cx="18.6" cy="46.4" r="1.15" fill="#2b2b2b" />
          <path d="M15.2 51 Q16.8 49.6 18.4 51" fill="none" stroke="#b9483f" strokeWidth="1.1" strokeLinecap="round" />
          {/* よだれ */}
          <path d="M18.4 51.4 Q19.6 53.6 18.4 54.6 Q17.2 53.6 18.4 51.4 Z" fill="#7cc4f2" transform={`translate(0 ${drool * 2.4})`} opacity={1 - drool * 0.5} />
        </>
      ) : (
        <>
          <path d="M13.2 46.6 Q14.8 44.6 16.4 46.6 M17.4 46.6 Q19 44.6 20.6 46.6" fill="none" stroke="#2b2b2b" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M14.6 49.4 Q17.4 54.6 20.2 49.4 Z" fill="#b9483f" />
          <ellipse cx="17.4" cy="51.7" rx="1.7" ry="1" fill="#ff8a8a" />
        </>
      )}
    </>
  )
}

type CookProps = {
  readonly step: number
  readonly mood: Mood
  readonly armR: ArmPose
  readonly armL: ArmPose
  readonly drool: number
  readonly belly: number
}

/** コックさん(主役)。うで は かた から出て ひじ で まがる。あたまには コックぼう。 */
function Cook({ step, mood, armR, armL, drool, belly }: CookProps) {
  return (
    <>
      {/* ひだりうで(うしろ側) */}
      <Arm shoulder={SHOULDER_L} pose={armL} knife={false} />
      <Layer rotate={step * 16} origin={[14.5, 80]}>
        <rect x="12.4" y="78" width="4.8" height="16" rx="2.2" fill={PANTS} />
        <ellipse cx="15.6" cy="94.2" rx="4.6" ry="2.4" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 16} origin={[9.5, 80]}>
        <rect x="6.8" y="78" width="4.8" height="16" rx="2.2" fill={PANTS} />
        <ellipse cx="10.4" cy="94.2" rx="4.6" ry="2.4" fill={SHOE} />
      </Layer>
      {/* くび: どう の 上に みじかく */}
      <rect x="9.6" y="51" width="5" height="7" rx="2.2" fill={SKIN_SHADE} />
      <Layer scaleX={1 + belly * 0.05} scaleY={1 + belly * 0.03} origin={[12, 70]}>
        <rect x="5.5" y="55.5" width="13" height="26" rx="5.4" fill={COAT} />
        <rect x="5.5" y="76" width="13" height="5.5" rx="2.6" fill={COAT_DARK} />
        <circle cx="12" cy="62" r="0.9" fill={BUTTON} />
        <circle cx="12" cy="67" r="0.9" fill={BUTTON} />
        <circle cx="12" cy="72" r="0.9" fill={BUTTON} />
      </Layer>
      {/* みぎうで(ほうちょうを にぎる) */}
      <Arm shoulder={SHOULDER_R} pose={armR} knife />
      {/* あたま と コックぼう */}
      <circle cx="12" cy="45" r="8.5" fill={SKIN} />
      <Face mood={mood} drool={drool} />
      <circle cx="7" cy="31.5" r="4.4" fill={COAT} />
      <circle cx="17" cy="31.5" r="4.4" fill={COAT} />
      <circle cx="12" cy="28.8" r="5.2" fill={COAT} />
      <rect x="4.5" y="33.5" width="15" height="6" rx="2.4" fill={COAT} />
      <path d="M5.4 38.4 H18.6" stroke={COAT_DARK} strokeWidth="1.3" strokeLinecap="round" />
    </>
  )
}

/** おなかが「ぐう」と なる しるし(コックさんの 体の まわり に ふるえる せん) */
function Rumble({ t }: SceneProps) {
  const show = during(t, STAND - 0.3, RAISE + 0.3, 0.2)
  if (show <= 0) return null
  const w = wave(t, 0.3)
  return (
    <g opacity={show} fill="none" stroke="#e8a33d" strokeWidth="1" strokeLinecap="round" transform={`translate(${w * 0.5} 0)`}>
      <path d="M21.6 66 q2.4 2.6 0 5.2" />
      <path d="M24.2 64.4 q3.4 4.2 0 8.4" />
    </g>
  )
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
  const walking = span(t, ENTER, ENTER + 0.1) * (1 - span(t, STAND - 0.15, STAND))
  const stride = Math.sin((t - ENTER) * Math.PI * 2 * 2.2) * walking
  const walkX = mix(t, ENTER, STAND, -30, 0, easeOut)
  // よろこびの ジャンプ(字になる まえに おさまる)
  const settle = 1 - span(t, INK - 0.5, INK - 0.1)
  const hop = t > CHEER + 0.3 ? -Math.abs(wave(t - CHEER - 0.3, 0.9)) * 2.6 * settle : 0
  const bob = -Math.abs(stride) * 1.2 + hop

  // みぎうで: ふりあげる → ざくっ と おろす → ほうちょうを さげる
  const swing = span(t, RAISE, UP, easeInOut) * (1 - span(t, CHOP, HIT, easeIn))
  const chopped = span(t, CHOP, HIT, easeIn) * (1 - span(t, LOWER, LOWER + 0.6, easeInOut))
  const armR: ArmPose = { upper: -5 + 140 * swing + 5 * chopped + stride * 8, fore: -15 + 190 * swing + 15 * chopped }
  // ひだりうで: あるくときは ふり、よろこぶときは ばんざい
  const cheer = span(t, CHEER, CHEER + 0.5, backOut)
  const armL: ArmPose = { upper: 355 - stride * 8 + (195 - 355) * cheer, fore: 345 + (185 - 345) * cheer }

  const mood: Mood = t < HIT + 0.1 ? 'hungry' : 'happy'
  const drool = (t * 1.2) % 1
  const belly = t >= STAND - 0.3 && t < RAISE + 0.3 ? wave(t, 0.3) : 0

  return (
    <>
      <Layer opacity={ink.picture}>
        <Floor t={t} />
        <Meat t={t} />
        <Shine t={t} />
        <Layer opacity={span(t, ENTER - 0.1, ENTER + 0.15)}>
          <ellipse cx={14 + walkX} cy="95.6" rx="9" ry="2.1" fill="#000000" opacity={0.12 + hop * 0.02} />
          <Layer x={walkX + 2} y={Math.max(Math.min(bob, 0), -4)}>
            <Cook step={stride} mood={mood} armR={armR} armL={armL} drool={drool} belly={belly} />
            <Rumble t={t} />
          </Layer>
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
