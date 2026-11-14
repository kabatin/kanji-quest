/*
 * 火(ひ): たきぎに 火が うつって、めらめら もえる ほのお。(共通部品 sceneFigures で 書きなおした もの)
 *
 * ほね(画と絵の対応)
 *   1画目(丶)  … ほのおの 左へ のびる 小さな した(左の ほのおの ひとなめ)
 *   2画目(丶)  … ほのおの 右へ のびる 小さな した(右の ほのおの ひとなめ)
 *   3画目(ノ)  … 上半分は、まんなかの 大きな ほのおの せぼね(さきっぽ から ねもと まで)。
 *                  下半分は、左に たおれかかる たきぎ
 *   4画目(乀)  … 右に たおれかかる たきぎ(上の はし は ほのおの 中)
 *
 * ながれ
 *   夜、さむそうな 子が しゃがんで ふるえている(いきが 白い)。 たきぎが 2本 くまれている
 *   → 子が、ひだね の ついた えだ を たきぎ へ のばす
 *   → えだ の ひ が たきぎに うつって、ちいさな ほのお が ぽっと ともる
 *   → ほのお が ぐんぐん 大きくなり、子は びっくり。 つぎに、あったかくて にっこり(まわりも あかるくなる)
 *   → ほのおの かたちが ゆれながら 落ちつき、ほね が ひかって、絵が うすくなり、字「火」が のこる
 *
 * 子は Person(右むき・しゃがむ は posture('squat'))。えだ は tools の 'stick'、手は { to } で たきぎへ のばす。
 * くび の まきもの(マフラー)は 部品に ないので、子の held として ここで 描く(くび の 場所は personRig から)。
 * 夜 → 少し あかるい は Backdrop の time、まわりの 石は Rock。たきぎ・ほのお・ひのこ は 字の 画に そろえるので ここで 描く。
 * ひ が うつる わけ は、子が えだ の ひだね を たきぎ に ふれさせるから。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, mixLimb, PALETTE, Person, personRig, posture, Rock, Sigh, type Limb, type PersonProps } from '../sceneFigures'

const CHAR = '火'

const TUNIC = '#4fb3b0'
const SCARF = '#f2b632'
const SCARF_DARK = '#d99a1c'
const BARK = PALETTE.bark
const BARK_DARK = PALETTE.barkDark
const WOOD_CUT = '#d9b087'
const FLAME_OUT = '#ff7a2e'
const FLAME_MID = '#ffb02e'
const FLAME_IN = '#ffe27a'
const FLAME_CORE = '#fff6c4'
const EMBER = '#ff6a3a'

/** くぎり の時間(秒) */
const LIFT = 1.3
/** えだ の ひ が たきぎに ふれる */
const TOUCH = 2.5
const GROW = 3.0
const WARM = 4.6
const INK = 6.0
const DONE = 8.6
const DURATION = 9.4

/** 子の こし の x・足もと の y・背の高さ(しゃがむ ので 見える 高さ は これの はんぶん くらい) */
const KID_X = 9
const KID_Y = 95
const KID_HEIGHT = 46
/** ひだね の えだ の 長さ と、えだ の 先が たきぎ に ふれる 場所(3画目の 下半分の 上) */
const STICK_LEN = 20
const TOUCH_AT: readonly [number, number] = [31.6, 84.3]
/** えだ を もつ 手 の ばしょ(のばした とき) */
const HAND_REACH: readonly [number, number] = [21, 75]
/** ほのおの ねもと(ここを じく に 大きくなる) */
const FLAME_BASE: readonly [number, number] = [48, 67]

/* ───────── ばしょ(空・地面・いし) ───────── */

function Place({ t }: SceneProps) {
  // 夜の くらさ は、ほのお が つくと すこし うすれる
  const time = 2 - 0.7 * span(t, TOUCH + 0.4, WARM + 0.6)
  const sky = span(t, 0, 0.5, easeOut)
  const glow = span(t, TOUCH + 0.3, GROW + 1.4, easeOut)
  return (
    <>
      <g opacity={sky}>
        <Backdrop t={t} sun={null} clouds={[]} time={time} moon={[95, 12]} moonPhase="crescent" />
      </g>
      {/* ほのおの あかり: まわりが ぽうっと あたたかくなる */}
      <circle cx="50" cy="56" r="40" fill="#ffcf7a" opacity={0.16 * glow} />
      <circle cx="50" cy="60" r="26" fill="#ffc15a" opacity={0.16 * glow} />
      <ellipse cx="54" cy="96.4" rx={48 * glow} ry="7" fill="#ffb347" opacity={0.3 * glow} />
    </>
  )
}

/** たきぎの まわりの いし(火が ひろがらないように) */
function Stones({ t }: SceneProps) {
  const grow = span(t, 0.2, 0.7)
  const stones: readonly (readonly [number, number, number])[] = [[41, 98, 4.2], [53, 98.6, 3.6], [63, 98.2, 4], [75, 97.8, 3.8]]
  return (
    <>
      {stones.map(([x, y, size]) => (
        <Rock key={x} x={x} y={y} size={size} grow={grow} />
      ))}
    </>
  )
}

/* ───────── たきぎ ───────── */

/** たきぎ2本。3画目の 下半分 と 4画目 の線の上に、ななめに くむ */
function Logs({ t }: SceneProps) {
  const pop = span(t, 0.2, 0.8, backOut)
  // ひ が うつった ところ は あかく ほんのり もえる
  const burn = span(t, TOUCH + 0.1, GROW + 0.6)
  return (
    <>
      <ellipse cx="58" cy="97.6" rx={Math.max(0, 38 * pop)} ry="2.6" fill="#000000" opacity="0.12" />
      <Layer scaleX={0.7 + 0.3 * pop} scaleY={pop} origin={[58, 96]}>
        {/* 左の たきぎ(3画目の 下半分) */}
        <Bone char={CHAR} n={3} color={BARK} width={8} from={0.56} />
        <Bone char={CHAR} n={3} color={BARK_DARK} width={2.2} from={0.6} to={0.97} opacity={0.5} />
        <circle cx="21" cy="91.4" r="3.4" fill={BARK_DARK} />
        <circle cx="21" cy="91.4" r="2.2" fill={WOOD_CUT} />
        <circle cx="21" cy="91.4" r="0.9" fill={BARK} />
        {/* 右の たきぎ(4画目) */}
        <Bone char={CHAR} n={4} color={BARK} width={8} />
        <Bone char={CHAR} n={4} color={BARK_DARK} width={2.2} from={0.12} to={0.9} opacity={0.5} />
        <circle cx="94.8" cy="91" r="3.4" fill={BARK_DARK} />
        <circle cx="94.8" cy="91" r="2.2" fill={WOOD_CUT} />
        <circle cx="94.8" cy="91" r="0.9" fill={BARK} />
        {/* もえている ところ */}
        <Bone char={CHAR} n={3} color={EMBER} width={3.4} from={0.56} to={0.74} opacity={0.75 * burn} />
        <Bone char={CHAR} n={4} color={EMBER} width={3.4} from={0} to={0.22} opacity={0.75 * burn} />
      </Layer>
    </>
  )
}

/* ───────── ほのお ───────── */

/** まんなかの 大きな ほのお。さきっぽ が 3画目の 上のはし、ねもと が 3画目の まんなか あたり */
const CORE = 'M52.5 14 C54 27 66 38 64 54 C63 63 56 69 49 69 C41 69 38 62 41 54 C44 45 51 37 51 25 C51.2 20.5 51.8 17 52.5 14 Z'
/** 左の ほのおの した(1画目の線の まわり) */
const LEFT_TONGUE = 'M24.3 34 C31 38 42 47 42 58 C42 63 34 63 32 56 C30 50 26.5 42 24.3 34 Z'
/** 右の ほのおの した(2画目の線の まわり) */
const RIGHT_TONGUE = 'M83 27.3 C86 37 82 46 72 55 C67 60 60 60 61 54 C66 48 77 40 83 27.3 Z'

type FlameProps = SceneProps & { readonly calm: number }

function Flame({ t, calm }: FlameProps) {
  const seed = span(t, TOUCH, TOUCH + 0.5, easeOut) * 0.2
  const grow = span(t, GROW, GROW + 1.4, backOut)
  const size = Math.max(0, seed + 0.8 * grow)
  if (size <= 0) return null
  // ゆらゆら: 落ちつく ころには とまって、字の線と かさなる
  const sway = wave(t, 0.9) * 2.6 * calm
  const flick = 1 + (wave(t, 0.31) * 0.05 + wave(t, 0.19, 0.3) * 0.035) * calm
  const left = Math.max(0, span(t, GROW + 0.3, GROW + 1.3, backOut))
  const right = Math.max(0, span(t, GROW + 0.5, GROW + 1.5, backOut))
  return (
    <>
      <Layer scale={left} rotate={wave(t, 0.55, 0.3) * 3.5 * calm} origin={[40, 58]}>
        <path d={LEFT_TONGUE} fill={FLAME_OUT} />
        <Layer scale={0.58} origin={[40, 59]}>
          <path d={LEFT_TONGUE} fill={FLAME_IN} />
        </Layer>
      </Layer>
      <Layer scale={right} rotate={wave(t, 0.5, 0.7) * 3.5 * calm} origin={[63, 57]}>
        <path d={RIGHT_TONGUE} fill={FLAME_OUT} />
        <Layer scale={0.58} origin={[63, 58]}>
          <path d={RIGHT_TONGUE} fill={FLAME_IN} />
        </Layer>
      </Layer>
      <Layer scaleX={size} scaleY={size * flick} rotate={sway} origin={FLAME_BASE}>
        <path d={CORE} fill={FLAME_OUT} />
        <Layer scaleX={0.7} scaleY={0.72} origin={[48, 68]}>
          <path d={CORE} fill={FLAME_MID} />
        </Layer>
        <Layer scaleX={0.42} scaleY={0.46} origin={[48, 68]}>
          <path d={CORE} fill={FLAME_IN} />
        </Layer>
        <Layer scaleX={0.2} scaleY={0.22} origin={[48, 68]}>
          <path d={CORE} fill={FLAME_CORE} />
        </Layer>
      </Layer>
    </>
  )
}

/** ほのおから 上へ とぶ ひのこ */
function Sparks({ t }: SceneProps) {
  const show = span(t, GROW + 0.4, GROW + 0.9) * (1 - span(t, INK - 0.7, INK - 0.1))
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const p = (t * 0.5 + i * 0.17) % 1
        const x = 40 + i * 5 + Math.sin(p * 6 + i) * 3
        const y = 58 - p * 40
        return <circle key={i} cx={x} cy={y} r={1.2 * (1 - p * 0.5)} fill="#ffd24a" opacity={Math.sin(p * Math.PI)} />
      })}
    </g>
  )
}

/* ───────── 子 ───────── */

const SQUAT = posture('squat', 'right')
const KID_LOOK = { top: TUNIC, bottom: '#3e5c86' } as const

type Mood = 'cold' | 'hope' | 'wow' | 'happy'

/** 子の ばしょ・かっこう(えだ は まだ もたせない。手の 場所 を 先に しらべる ため) */
function kidAt(t: number, calm: number): PersonProps {
  const lift = span(t, LIFT, TOUCH - 0.1, easeInOut)
  const draw = span(t, TOUCH + 0.4, WARM - 0.3, easeInOut)
  const warm = span(t, GROW + 0.4, WARM, easeInOut)
  const cold = 1 - span(t, GROW, GROW + 1.2)
  const mood: Mood = t < LIFT + 0.7 ? 'cold' : t < GROW ? 'hope' : t < WARM ? 'wow' : 'happy'
  // びっくり して のけぞる → あったまって ゆらゆら
  const startle = span(t, GROW - 0.1, GROW + 0.4, easeOut) * (1 - span(t, GROW + 0.9, GROW + 1.8))
  // えだ を もつ のは てまえ の 手(右むき なら 左手)。のばして、ひだね を ふれさせ、少し ひく
  const reach: Limb = { to: [HAND_REACH[0] - 4 * draw, HAND_REACH[1] + 1 * draw] }
  const leftArm = mixLimb(SQUAT.leftArm ?? { swing: 8, bend: 80 }, reach, lift)
  // あったまると 空いた 手 も ほのお へ むける
  const rightArm = mixLimb(SQUAT.rightArm ?? { swing: 4, bend: 88 }, { to: [28, 78] }, warm)
  return {
    x: KID_X + wave(t, 0.1) * 0.45 * cold * span(t, 0.3, 0.7),
    y: KID_Y,
    build: 'child',
    height: KID_HEIGHT,
    facing: 'right',
    look: KID_LOOK,
    face: mood === 'cold' ? 'worried' : mood === 'hope' ? 'normal' : mood === 'wow' ? 'surprised' : 'smile',
    lean: -8 * startle + wave(t, 0.9) * 1.8 * span(t, WARM, WARM + 0.5) * calm,
    opacity: span(t, 0.1, 0.5),
    pose: { ...SQUAT, leftArm, rightArm },
  }
}

/** くび の まきもの(マフラー)。くび の 上に まるく 巻いて、うしろ(左)へ ひらひら なびく。held として 描く */
function Scarf({ t, props }: { readonly t: number; readonly props: PersonProps }) {
  const rig = personRig(props)
  const [nx, ny] = rig.world.neck
  const r = rig.body.headR * rig.scale
  const flutter = wave(t, 0.8) * 1.1
  return (
    <g>
      <ellipse cx={nx} cy={ny + 0.4} rx={r * 0.78} ry={r * 0.36} fill={SCARF} transform={`rotate(${rig.tilt.torso} ${nx} ${ny})`} />
      <path d={`M${nx - r * 0.5} ${ny + 0.6} q${-r * 0.9} ${r * 0.1 + flutter} ${-r * 1.3} ${r * 0.9 + flutter} l${r * 0.7} ${r * 0.2} q${r * 0.2} ${-r * 0.5} ${r * 0.7} ${-r * 0.8} Z`} fill={SCARF_DARK} />
    </g>
  )
}

/** ひだね の えだ の 先 と ひだね。先 は、手 の 上(はじめ)→ たきぎ(ふれる)→ 手 の 少し 先(ひく) */
function stickTip(t: number, hand: readonly [number, number]): readonly [number, number] {
  const lift = span(t, LIFT, TOUCH - 0.1, easeInOut)
  const draw = span(t, TOUCH + 0.4, WARM - 0.3, easeInOut)
  const up: readonly [number, number] = [hand[0] + 2, hand[1] - STICK_LEN]
  const pulled: readonly [number, number] = [hand[0] + STICK_LEN * 0.7, hand[1] - STICK_LEN * 0.7]
  const touch = [mix(lift, 0, 1, up[0], TOUCH_AT[0]), mix(lift, 0, 1, up[1], TOUCH_AT[1])] as const
  return [mix(draw, 0, 1, touch[0], pulled[0]), mix(draw, 0, 1, touch[1], pulled[1])]
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)
  // 字になる ちょくぜん、ほのおの ゆれ を とめて 字の線に そろえる
  const calm = 1 - span(t, INK - 0.6, INK - 0.1)

  const base = kidAt(t, calm)
  const rig = personRig(base)
  const hand = rig.world.arms.left.end
  const tip = stickTip(t, hand)
  const ember = span(t, TOUCH - 0.2, TOUCH + 0.2) * (1 - span(t, GROW, WARM))
  const [headX, headY] = rig.world.head
  const headR = rig.body.headR * rig.scale
  const breath = during(t, 0.5, TOUCH + 0.3, 0.3)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Place t={t} />
        <Stones t={t} />
        <Logs t={t} />
        <Flame t={t} calm={calm} />
        <Sparks t={t} />
        <Person {...base} tools={{ left: { kind: 'stick', tip } }} held={<Scarf t={t} props={base} />} />
        <circle cx={tip[0]} cy={tip[1]} r={1.5 + 1.4 * ember} fill="#ffb24a" opacity={(0.45 + 0.4 * ember) * span(t, LIFT, LIFT + 0.2)} />
        <circle cx={tip[0]} cy={tip[1]} r={1.1 + 0.4 * ember} fill={EMBER} opacity={span(t, LIFT, LIFT + 0.2)} />
        <Sigh x={headX + headR + 1} y={headY + headR * 0.4} p={((t - 0.5) % 1) / 1} show={breath} dir={1} />
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
    { at: 0, label: '夜。さむそうな 子が ふるえている', sound: 'pop' },
    { at: LIFT, label: 'ひだね の えだ を たきぎ へ のばす' },
    { at: TOUCH, label: 'たきぎに 火が うつる', sound: 'pop' },
    { at: GROW, label: 'ほのお が ぐんぐん 大きくなる' },
    { at: WARM, label: 'あったかい! 子が にっこり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '火 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
