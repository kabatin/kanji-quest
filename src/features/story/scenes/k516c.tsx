/*
 * 公(おおやけ・こう): ひとりじめの はこ(ふくろ)を ぱかっと ひらいて、みんなの ものに する。
 *
 * ほね(画と絵の対応)
 *   1・2画目(八) … ふくろの 口から とびだした どんぐりが、左と右へ ひろがって おちていく すじ
 *                   (左の うさぎ・右の くまの子 の ところへ わかれていく)
 *   3画目(厶)   … ふくろ(とんがった 口と、たいらな そこ)
 *   4画目        … ふくろの 右がわの ふくらみ(ひとりじめ していた ものの かたまり)
 *
 * ながれ
 *   どん と ふくろが おかれ、りす が うしろから ひょっこり。ふくろを ぎゅっと だいて ひとりじめ(ふふん)
 *   → うさぎ と くまの子が おなかを すかせて やってくる。りす は そわそわ → しょんぼり(わけて あげたい)
 *   → 「よし」と きめて、ひもを ほどく → ぱかっ! どんぐりが 左と右へ とんでいく
 *   → みんな にっこり、りす も ばんざい → ほね が ひかって、絵が うすくなり、字「公」が のこる
 *
 * 空・のはら は Backdrop、あせ・ハート は Sweat・Hearts。人は 出ない ので、動物(りす・うさぎ・くま)は 部品が まだ なく、ここで 描く。
 * りす・うさぎ・くま は ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく、あたま は どう の まんなか の上。
 *   りす は ふくろの うしろに いる(ふくろに かくれて あしは 見えない)。ふさふさの しっぽは 体の うしろ。
 *   どんぐりは 口から とび出して、山なり に おちる(上へ とんでから 下へ)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Hearts, Sweat } from '../sceneFigures'

const CHAR = '公'

const FUR = '#d9843b'
const FUR_DARK = '#b9672a'
const FUR_BELLY = '#f6dcb6'
const HAIR = '#5a3b2a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const SACK = '#d9b777'
const SACK_SHADE = '#c19a58'
const SACK_LIGHT = '#ecd29a'
const SACK_INSIDE = '#5b3a22'
const ROPE = '#8c5b3c'
const PATCH = '#e8645a'
const NUT = '#c98a4b'
const NUT_CAP = '#7a4a2a'
const RABBIT = '#f4eee6'
const RABBIT_SHADE = '#e0d6c9'
const EAR_INNER = '#f7b6c2'
const BEAR = '#b98259'
const BEAR_DARK = '#9c6a45'
const BEAR_MUZZLE = '#ead0b0'
const SWEAT = '#7cc4f2'

/** くぎり の時間(秒) */
const POP = 0.4
const FRIENDS = 1.9
const WARY = 2.6
const SORRY = 3.5
const RESOLVE = 4.1
/** ひもを ほどいて、ふくろの 口が ひらく */
const OPEN = 4.75
const JOY = 6.1
const INK = 6.9
const DONE = 9.5
const DURATION = 10.1

type Pt = readonly [number, number]
/** うで の かっこう。かた(うごかない)・ひじ・手 の じゅんに つながる */
type Limb = { readonly elbow: Pt; readonly hand: Pt }

const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
const lerpLimb = (a: Limb, b: Limb, k: number): Limb => ({ elbow: lerpPt(a.elbow, b.elbow, k), hand: lerpPt(a.hand, b.hand, k) })

/** ふくろの 口(ひも の ところ) */
const NECK: Pt = [50, 54.5]
/** ふくろの そこ(地面) */
const SACK_FOOT: Pt = [51, 94]

function LimbShape({ shoulder, limb, color, handColor, width = 5 }: { readonly shoulder: Pt; readonly limb: Limb; readonly color: string; readonly handColor: string; readonly width?: number }) {
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${limb.elbow[0]} ${limb.elbow[1]} L${limb.hand[0]} ${limb.hand[1]}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={limb.hand[0]} cy={limb.hand[1]} r={width * 0.62} fill={handColor} />
    </>
  )
}

/** ふくろ。口が とんがって、ひもで しばってある。ひもを とくと ぱかっと ひらく。 */
function Sack({ t }: SceneProps) {
  const open = span(t, OPEN, OPEN + 0.3, backOut)
  const fall = span(t, OPEN, OPEN + 0.6, easeOut)
  const flap = 78 * Math.min(open, 1.1)
  return (
    <>
      <ellipse cx="51" cy="95.6" rx="23" ry="2.8" fill="#000000" opacity="0.12" />
      <path d="M44.5 54 C38 58 33 68 31.5 78 C30 90 36 93.5 44 93.5 L60 93.5 C68 93.5 74 90 72.5 78 C71 68 62 58 55.5 54 Z" fill={SACK} />
      {/* かげ(右)・ハイライト(左)は 1だん だけ */}
      <path d="M62 62 C68 70 71.5 76 71 84 C70.5 91 66 93 60 93" fill="none" stroke={SACK_SHADE} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M40.5 62 C36.5 69 34.5 77 35 85" fill="none" stroke={SACK_LIGHT} strokeWidth="2" strokeLinecap="round" />
      {/* つぎあて */}
      <circle cx="58.5" cy="79" r="4.4" fill={PATCH} />
      <circle cx="58.5" cy="79" r="3" fill="none" stroke="#ffd9d2" strokeWidth="0.7" strokeDasharray="1.2 1.2" />
      {/* ひらいた 口の 中 */}
      <ellipse cx={NECK[0]} cy="54.2" rx={Math.max(0, 7 * open)} ry={Math.max(0, 2.8 * open)} fill={SACK_INSIDE} />
      {/* 口の 布の 2まい: ひらくと 左右に ぱたんと たおれる */}
      <Layer rotate={-flap} origin={[46.5, 55.5]}>
        <path d="M46.5 55.5 Q41.5 49.5 44 44.5 Q48 47.5 51.5 54.5 Z" fill={SACK} />
        <path d="M45.4 53 Q43.4 49.6 44.5 46.8" fill="none" stroke={SACK_LIGHT} strokeWidth="1" strokeLinecap="round" />
      </Layer>
      <Layer rotate={flap} origin={[53.5, 55.5]}>
        <path d="M53.5 55.5 Q58.5 49.5 56 44.5 Q52 47.5 48.5 54.5 Z" fill={SACK_SHADE} />
      </Layer>
      {/* ひも: ほどけると おちて きえる */}
      <Layer y={fall * 22} rotate={fall * 40} origin={NECK} opacity={1 - span(t, OPEN + 0.25, OPEN + 0.6)}>
        <ellipse cx={NECK[0]} cy="55.4" rx="6.6" ry="2.2" fill={ROPE} />
        <circle cx={NECK[0]} cy="57" r="1.9" fill={ROPE} />
        <path d="M49 58 q-1.2 3 -3.4 3.6 M51 58 q1.2 3 3.4 3.6" fill="none" stroke={ROPE} strokeWidth="1.2" strokeLinecap="round" />
      </Layer>
    </>
  )
}

type SquirrelMood = 'smug' | 'wary' | 'sorry' | 'resolve' | 'happy'

function squirrelMood(t: number): SquirrelMood {
  if (t < WARY) return 'smug'
  if (t < SORRY) return 'wary'
  if (t < RESOLVE) return 'sorry'
  if (t < JOY - 0.4) return 'resolve'
  return 'happy'
}

function SquirrelFace({ mood, look }: { readonly mood: SquirrelMood; readonly look: number }) {
  const eyes = (r: number) => (
    <>
      <circle cx={46.4 + look} cy="36" r={r} fill={EYE} />
      <circle cx={53.6 + look} cy="36" r={r} fill={EYE} />
    </>
  )
  return (
    <>
      <ellipse cx="50" cy="40.2" rx="5.4" ry="3.7" fill={FUR_BELLY} />
      <circle cx="43" cy="39.6" r="1.9" fill={CHEEK} opacity="0.55" />
      <circle cx="57" cy="39.6" r="1.9" fill={CHEEK} opacity="0.55" />
      <ellipse cx="50" cy="38.6" rx="1.4" ry="1" fill={HAIR} />
      {mood === 'smug' && (
        <>
          <path d="M44.8 36 Q46.4 37.8 48 36 M52 36 Q53.6 37.8 55.2 36" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M48.2 40.8 Q50 42.4 51.8 40.8" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'wary' && (
        <>
          {eyes(1.3)}
          <path d="M44 32.6 L48.4 33.8 M56 32.6 L51.6 33.8" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M48.6 41.4 Q50 40.4 51.4 41.4" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'sorry' && (
        <>
          {eyes(1.4)}
          <path d="M44 33.8 L48.4 32.4 M56 33.8 L51.6 32.4" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M48.6 41.8 Q50 40 51.4 41.8" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'resolve' && (
        <>
          {eyes(1.5)}
          <path d="M44.4 32.8 L48.2 32.4 M55.6 32.8 L51.8 32.4" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M48.2 40.6 Q50 42.4 51.8 40.6" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M44.8 36.4 Q46.4 34.2 48 36.4 M52 36.4 Q53.6 34.2 55.2 36.4" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M47.6 40 Q50 44.4 52.4 40 Z" fill={MOUTH} />
        </>
      )}
    </>
  )
}

/** りす の うしろがわ: しっぽ・どう・あたま。ふくろの うしろに いる。 */
function SquirrelBack({ t, mood, look, headTilt }: { readonly t: number; readonly mood: SquirrelMood; readonly look: number; readonly headTilt: number }) {
  return (
    <>
      {/* ふさふさの しっぽ: どう の うしろで、せなか から 上へ カーブ */}
      <Layer rotate={wave(t, 2.2) * 3} origin={[58, 76]}>
        <path d="M58 78 C82 80 84 56 71 45 C66 40 66 34 71 31" fill="none" stroke={FUR} strokeWidth="11" strokeLinecap="round" />
        <path d="M60 76 C78 77 79 58 69 48" fill="none" stroke={FUR_DARK} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      </Layer>
      <ellipse cx="50" cy="57" rx="10.5" ry="15" fill={FUR} />
      <ellipse cx="50" cy="60" rx="6.4" ry="10.5" fill={FUR_BELLY} />
      <Layer rotate={headTilt} origin={[50, 45]}>
        {/* みみ(ふさ つき) */}
        <ellipse cx="43.6" cy="27.4" rx="2.9" ry="4.4" fill={FUR} transform="rotate(-14 43.6 27.4)" />
        <ellipse cx="56.4" cy="27.4" rx="2.9" ry="4.4" fill={FUR} transform="rotate(14 56.4 27.4)" />
        <ellipse cx="43.6" cy="28" rx="1.2" ry="2.4" fill={FUR_BELLY} transform="rotate(-14 43.6 28)" />
        <ellipse cx="56.4" cy="28" rx="1.2" ry="2.4" fill={FUR_BELLY} transform="rotate(14 56.4 28)" />
        <circle cx="50" cy="36" r="9.2" fill={FUR} />
        <SquirrelFace mood={mood} look={look} />
      </Layer>
    </>
  )
}

/** 4つの うで のかたち(りす)。かた = 43,48 と 57,48 */
const SQ_SHOULDER_L: Pt = [43, 48]
const SQ_SHOULDER_R: Pt = [57, 48]
const HUG_L: Limb = { elbow: [37, 56], hand: [40, 64] }
const HUG_R: Limb = { elbow: [63, 56], hand: [60, 64] }
const TIE_L: Limb = { elbow: [39, 56], hand: [47, 53] }
const TIE_R: Limb = { elbow: [61, 56], hand: [53, 53] }
const CHEER_L: Limb = { elbow: [35, 43], hand: [31, 35] }
const CHEER_R: Limb = { elbow: [65, 43], hand: [69, 35] }

function squirrelArms(t: number): readonly [Limb, Limb] {
  const toTie = span(t, RESOLVE, OPEN - 0.15, easeInOut)
  const cheer = span(t, OPEN + 0.25, OPEN + 0.85, easeOut)
  const shiver = during(t, WARY, SORRY, 0.2) * wave(t, 0.3) * 0.7
  const left = lerpLimb(lerpLimb({ elbow: [HUG_L.elbow[0] + shiver, HUG_L.elbow[1]], hand: [HUG_L.hand[0] + shiver, HUG_L.hand[1]] }, TIE_L, toTie), CHEER_L, cheer)
  const right = lerpLimb(lerpLimb({ elbow: [HUG_R.elbow[0] - shiver, HUG_R.elbow[1]], hand: [HUG_R.hand[0] - shiver, HUG_R.hand[1]] }, TIE_R, toTie), CHEER_R, cheer)
  return [left, right]
}

type FriendMood = 'hungry' | 'wow' | 'happy'

function friendMood(t: number): FriendMood {
  if (t < OPEN) return 'hungry'
  if (t < OPEN + 0.7) return 'wow'
  return 'happy'
}

/** うさぎ・くま 共通の かお。cx, cy が かおの まんなか */
function FriendFace({ t, cx, cy, mood, muzzle }: { readonly t: number; readonly cx: number; readonly cy: number; readonly mood: FriendMood; readonly muzzle: boolean }) {
  const drool = ((t * 1.2) % 1)
  return (
    <g transform={`translate(${cx} ${cy})`}>
      {muzzle ? (
        <>
          <ellipse cx="0" cy="3.4" rx="4.2" ry="3.2" fill={BEAR_MUZZLE} />
          <ellipse cx="0" cy="2.2" rx="1.6" ry="1.1" fill={HAIR} />
        </>
      ) : (
        <ellipse cx="0" cy="2.1" rx="1.2" ry="0.9" fill={EAR_INNER} />
      )}
      <circle cx="-5.8" cy="3.2" r="1.6" fill={CHEEK} opacity="0.5" />
      <circle cx="5.8" cy="3.2" r="1.6" fill={CHEEK} opacity="0.5" />
      {mood === 'hungry' && (
        <>
          <circle cx="-3.2" cy="-1" r="1.2" fill={EYE} />
          <circle cx="3.2" cy="-1" r="1.2" fill={EYE} />
          <path d="M-5.2 -3 L-1.8 -4.4 M5.2 -3 L1.8 -4.4" fill="none" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <ellipse cx="0" cy="5.4" rx="1.3" ry="1.7" fill={MOUTH} />
          <path d="M1.4 6.6 Q2.6 8 1.4 9.2 Q0.2 8 1.4 6.6 Z" fill={SWEAT} opacity={1 - drool} transform={`translate(0 ${drool * 4})`} />
        </>
      )}
      {mood === 'wow' && (
        <>
          <circle cx="-3.2" cy="-1" r="1.6" fill={EYE} />
          <circle cx="3.2" cy="-1" r="1.6" fill={EYE} />
          <circle cx="-3.8" cy="-1.6" r="0.5" fill="#ffffff" />
          <circle cx="2.6" cy="-1.6" r="0.5" fill="#ffffff" />
          <ellipse cx="0" cy="5.4" rx="1.3" ry="1.6" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M-4.8 -0.4 Q-3.2 -2.8 -1.6 -0.4 M1.6 -0.4 Q3.2 -2.8 4.8 -0.4" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M-2.2 4.4 Q0 8.6 2.2 4.4 Z" fill={MOUTH} />
        </>
      )}
    </g>
  )
}

type FriendSpec = {
  readonly shoulders: readonly [Pt, Pt]
  readonly tummy: readonly [Limb, Limb]
  readonly catching: readonly [Limb, Limb]
  readonly holding: readonly [Limb, Limb]
  /** どんぐりを うけとる ほうの うで(0 = 左 / 1 = 右) */
  readonly catchSide: 0 | 1
}

const RABBIT_SPEC: FriendSpec = {
  shoulders: [[10, 76], [20, 76]],
  tummy: [{ elbow: [6, 82], hand: [12, 85] }, { elbow: [24, 82], hand: [18, 85] }],
  catching: [{ elbow: [3, 72], hand: [2, 64] }, { elbow: [26, 72], hand: [28, 64] }],
  holding: [{ elbow: [5, 81], hand: [11, 81] }, { elbow: [24, 80], hand: [18, 79] }],
  catchSide: 1,
}

const BEAR_SPEC: FriendSpec = {
  shoulders: [[86, 76], [102, 76]],
  tummy: [{ elbow: [83, 82], hand: [90, 85] }, { elbow: [105, 82], hand: [98, 85] }],
  catching: [{ elbow: [82, 71], hand: [80, 64] }, { elbow: [106, 71], hand: [105, 63] }],
  holding: [{ elbow: [83, 80], hand: [89, 79] }, { elbow: [104, 81], hand: [98, 81] }],
  catchSide: 0,
}

function friendLimbs(spec: FriendSpec, t: number): readonly [Limb, Limb] {
  const reach = span(t, OPEN, OPEN + 0.5, easeOut)
  const hold = span(t, JOY + 0.1, JOY + 0.7, easeInOut)
  const pose = (i: 0 | 1) => lerpLimb(lerpLimb(spec.tummy[i], spec.catching[i], reach), spec.holding[i], hold)
  return [pose(0), pose(1)]
}

/** あるいてくる ときと、よろこぶ ときの ぴょん(上下)。 */
function friendHop(t: number, phase: number): number {
  const walking = span(t, FRIENDS, FRIENDS + 1) < 1 ? 1 - span(t, FRIENDS + 0.8, FRIENDS + 1) : 0
  const walk = t > FRIENDS && walking > 0 ? Math.abs(Math.sin((t - FRIENDS) * Math.PI * 3 + phase)) * 2.2 * walking : 0
  const joy = during(t, JOY, JOY + 0.9, 0.05) > 0 ? Math.abs(Math.sin((t - JOY) * Math.PI * 3 + phase)) * 3 : 0
  return -(walk + joy)
}

function Rabbit({ t, limbs }: { readonly t: number; readonly limbs: readonly [Limb, Limb] }) {
  const mood = friendMood(t)
  return (
    <>
      <ellipse cx="11" cy="95.4" rx="4.4" ry="2.2" fill={RABBIT_SHADE} />
      <ellipse cx="20" cy="95.4" rx="4.4" ry="2.2" fill={RABBIT_SHADE} />
      <ellipse cx="15" cy="84" rx="8" ry="11.5" fill={RABBIT} />
      <ellipse cx="15" cy="86" rx="4.6" ry="7" fill="#ffffff" opacity="0.7" />
      <ellipse cx="11.2" cy="53" rx="2.8" ry="8.6" fill={RABBIT} transform="rotate(-6 11.2 53)" />
      <ellipse cx="18.8" cy="53" rx="2.8" ry="8.6" fill={RABBIT} transform="rotate(6 18.8 53)" />
      <ellipse cx="11.3" cy="54" rx="1.2" ry="6" fill={EAR_INNER} transform="rotate(-6 11.3 54)" />
      <ellipse cx="18.7" cy="54" rx="1.2" ry="6" fill={EAR_INNER} transform="rotate(6 18.7 54)" />
      <circle cx="15" cy="66.5" r="7.8" fill={RABBIT} />
      <FriendFace t={t} cx={15} cy={66.5} mood={mood} muzzle={false} />
      <LimbShape shoulder={RABBIT_SPEC.shoulders[0]} limb={limbs[0]} color={RABBIT} handColor={RABBIT_SHADE} width={4.4} />
      <LimbShape shoulder={RABBIT_SPEC.shoulders[1]} limb={limbs[1]} color={RABBIT} handColor={RABBIT_SHADE} width={4.4} />
    </>
  )
}

function Bear({ t, limbs }: { readonly t: number; readonly limbs: readonly [Limb, Limb] }) {
  const mood = friendMood(t)
  return (
    <>
      <ellipse cx="89" cy="95.4" rx="4.6" ry="2.2" fill={BEAR_DARK} />
      <ellipse cx="99" cy="95.4" rx="4.6" ry="2.2" fill={BEAR_DARK} />
      <ellipse cx="94" cy="83" rx="9.8" ry="12.5" fill={BEAR} />
      <ellipse cx="94" cy="85" rx="5.6" ry="7.6" fill={BEAR_MUZZLE} />
      <circle cx="87.2" cy="57.4" r="3.4" fill={BEAR} />
      <circle cx="100.8" cy="57.4" r="3.4" fill={BEAR} />
      <circle cx="87.2" cy="57.6" r="1.7" fill={BEAR_DARK} />
      <circle cx="100.8" cy="57.6" r="1.7" fill={BEAR_DARK} />
      <circle cx="94" cy="64.5" r="9" fill={BEAR} />
      <FriendFace t={t} cx={94} cy={64.5} mood={mood} muzzle />
      <LimbShape shoulder={BEAR_SPEC.shoulders[0]} limb={limbs[0]} color={BEAR} handColor={BEAR_DARK} width={4.8} />
      <LimbShape shoulder={BEAR_SPEC.shoulders[1]} limb={limbs[1]} color={BEAR} handColor={BEAR_DARK} width={4.8} />
    </>
  )
}

/** おなかが ぐうぐう: おなかの よこに ゆれる すじ */
function Rumble({ t, x, y, dir }: { readonly t: number; readonly x: number; readonly y: number; readonly dir: 1 | -1 }) {
  const show = during(t, FRIENDS + 1.1, OPEN - 0.1, 0.3)
  if (show <= 0) return null
  const w = wave(t, 0.28) * 0.8
  return (
    <g opacity={show} fill="none" stroke="#8a7a68" strokeWidth="0.9" strokeLinecap="round" transform={`translate(${x + w} ${y}) scale(${dir} 1)`}>
      <path d="M0 -3 Q2.6 -1.6 0 0 Q-2.6 1.6 0 3" />
      <path d="M3.6 -2.2 Q5.6 -1.1 3.6 0 Q1.8 1.1 3.6 2.2" />
    </g>
  )
}

function Acorn({ x, y, spin }: { readonly x: number; readonly y: number; readonly spin: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${spin}) scale(1.5)`}>
      <ellipse cx="0" cy="0.7" rx="1.9" ry="2.4" fill={NUT} />
      <path d="M-2.3 -0.4 Q0 -3.6 2.3 -0.4 Z" fill={NUT_CAP} />
      <path d="M0 -2.6 l0.3 -1.2" stroke={NUT_CAP} strokeWidth="0.7" strokeLinecap="round" />
    </g>
  )
}

type Flight = { readonly at: number; readonly side: 'rabbit' | 'bear'; readonly spot: Pt }
const FLIGHT_TIME = 0.85
const FLIGHTS: readonly Flight[] = [
  { at: OPEN + 0.1, side: 'rabbit', spot: [0, 0] },
  { at: OPEN + 0.2, side: 'bear', spot: [0, 0] },
  { at: OPEN + 0.3, side: 'rabbit', spot: [-2.4, 1.8] },
  { at: OPEN + 0.4, side: 'bear', spot: [2.4, 1.8] },
  { at: OPEN + 0.5, side: 'rabbit', spot: [2.2, 1.6] },
  { at: OPEN + 0.6, side: 'bear', spot: [-2.2, 1.6] },
]

/** どんぐり: ふくろの 口から とび出して、山なり に おちて、友だちの 手に おさまる。 */
function Acorns({ t, hands }: { readonly t: number; readonly hands: { readonly rabbit: Pt; readonly bear: Pt } }) {
  return (
    <>
      {FLIGHTS.map((flight, i) => {
        const p = span(t, flight.at, flight.at + FLIGHT_TIME)
        if (t < flight.at) return null
        const hand = hands[flight.side]
        const goal: Pt = [hand[0] + flight.spot[0], hand[1] + flight.spot[1]]
        const dir = flight.side === 'rabbit' ? -1 : 1
        const x = NECK[0] + (goal[0] - NECK[0]) * p
        const arc = Math.sin(p * Math.PI) * 22
        const y = 52 + (goal[1] - 52) * p - arc
        return <Acorn key={i} x={p >= 1 ? goal[0] : x} y={p >= 1 ? goal[1] : y} spin={p >= 1 ? 0 : dir * p * 420} />
      })}
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)
  const joyHearts = during(t, JOY + 0.1, INK + 0.6, 0.3)

  // ふくろが どん と おかれる → りすが うしろから ひょっこり
  const sackPop = span(t, 0, POP + 0.2, backOut)
  const squirrelPop = span(t, POP, POP + 0.6, backOut)
  const sq = Math.max(0.01, squirrelPop)
  const joyHop = during(t, JOY, JOY + 0.9, 0.05) > 0 ? -Math.abs(Math.sin((t - JOY) * Math.PI * 3)) * 3 : 0
  const look = t < WARY ? 0 : t < SORRY ? Math.sign(wave(t, 1.2)) * 1.1 : 0
  const headTilt = t < RESOLVE ? (t > SORRY ? -4 : 0) : t < RESOLVE + 0.5 ? Math.sin(span(t, RESOLVE, RESOLVE + 0.5) * Math.PI) * 6 : 0
  const tug = during(t, OPEN - 0.5, OPEN + 0.05, 0.1) * wave(t, 0.16) * 2.2
  const mood = squirrelMood(t)
  const arms = squirrelArms(t)

  const rabbitLimbs = friendLimbs(RABBIT_SPEC, t)
  const bearLimbs = friendLimbs(BEAR_SPEC, t)
  const rabbitHop = friendHop(t, 0)
  const bearHop = friendHop(t, 1.2)
  const rabbitX = mix(t, FRIENDS, FRIENDS + 1, -34, 0, easeOut)
  const bearX = mix(t, FRIENDS, FRIENDS + 1, 34, 0, easeOut)
  const hands = {
    rabbit: [rabbitLimbs[RABBIT_SPEC.catchSide].hand[0],rabbitLimbs[RABBIT_SPEC.catchSide].hand[1] + rabbitHop] as Pt,
    bear: [bearLimbs[BEAR_SPEC.catchSide].hand[0], bearLimbs[BEAR_SPEC.catchSide].hand[1] + bearHop] as Pt,
  }

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[13, 13]} clouds={[[60, 12, 0.9], [96, 20, 0.8]]} tufts={[6, 34, 70, 103]} />
        {/* うさぎ と くまの子: 左右から あるいてくる */}
        <Layer opacity={span(t, FRIENDS - 0.1, FRIENDS + 0.15)}>
          <Layer x={rabbitX} y={rabbitHop}>
            <Rabbit t={t} limbs={rabbitLimbs} />
          </Layer>
          <Layer x={bearX} y={bearHop}>
            <Bear t={t} limbs={bearLimbs} />
          </Layer>
          <Rumble t={t} x={25.5} y={84} dir={1} />
          <Rumble t={t} x={83} y={84} dir={-1} />
        </Layer>
        {/* りす(ふくろの うしろ) */}
        <Layer opacity={span(t, POP, POP + 0.1)} y={joyHop} scaleY={sq} origin={[50, 74]}>
          <SquirrelBack t={t} mood={mood} look={look} headTilt={headTilt} />
        </Layer>
        <Layer scale={sackPop} origin={SACK_FOOT}>
          <Layer rotate={tug} origin={SACK_FOOT}>
            <Sack t={t} />
          </Layer>
        </Layer>
        {/* りす の うで: ふくろを だく → ひもを ほどく → ばんざい */}
        <Layer opacity={span(t, POP + 0.3, POP + 0.5)} y={joyHop} scaleY={sq} origin={[50, 74]}>
          <LimbShape shoulder={SQ_SHOULDER_L} limb={arms[0]} color={FUR} handColor={FUR_DARK} />
          <LimbShape shoulder={SQ_SHOULDER_R} limb={arms[1]} color={FUR} handColor={FUR_DARK} />
          <Sweat t={t} x={61.6} y={29} show={during(t, WARY + 0.2, RESOLVE - 0.1, 0.25)} dir={1} />
        </Layer>
        <Acorns t={t} hands={hands} />
        <Hearts t={t} x={24} y={44} show={joyHearts} />
        <Hearts t={t} x={88} y={48} show={joyHearts} />
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
    { at: 0, label: 'ふくろが どん。りすが ひょっこり', sound: 'pop' },
    { at: POP + 0.6, label: 'りすは ふくろを だいて ひとりじめ' },
    { at: FRIENDS, label: 'うさぎ と くまの子が おなかを すかせて くる' },
    { at: SORRY, label: 'りすは しょんぼり。わけて あげたく なる' },
    { at: RESOLVE, label: 'よし、と ひもを ほどく' },
    { at: OPEN, label: 'ぱかっ! どんぐりが 左と右へ とんでいく', sound: 'pop' },
    { at: OPEN + 0.5, label: 'どんぐりが 山なりに とんでいく' },
    { at: JOY, label: 'みんな にっこり。ばんざい' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '公 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
