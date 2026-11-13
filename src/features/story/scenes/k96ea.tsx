/*
 * 雪(ゆき): 空の 雲から ふわふわ おちてきた ゆきが、子どもの 手に のる。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 雪雲の もくもくした 上の ぶぶん
 *   2画目(丨)  … 雲の 左はしから おちる ゆき(左の はしを ひらひら)
 *   3画目(𠃍)  … 雲の たいらな そこ(右へ 少し 上がる)
 *   4画目(丨)  … 雲から さいしょに おちてくる、大きな ゆき ひとつぶ の とおり道(手の上で とまる)
 *   5・6画目   … 左に ふってきた ゆきの つぶ
 *   7・8画目   … 右に ふってきた ゆきの つぶ
 *   9〜11画目  … 子どもが さしだした 手(ゆびと てのひら)。9画目は ゆびの 上と てのひらの よこ
 *
 * ながれ
 *   雲が うかんで、さむい ので 子どもは ふるえている
 *   → 雲から ゆきが ひとつぶ ふわふわ。子どもが 気づいて 空を見あげる
 *   → ゆきを うけとろうと、手を まえへ さしだす(手が 大きく 見えるのは、こちらへ つきだしたから)
 *   → ゆきが てのひらの上に そっと のる。子どもは にこにこ(さむい → おどろき → うれしい)
 *   → 雲が ぷるっと ふるえて、ゆきが たくさん ふってくる
 *   → ゆきの つぶ が 点の場所に そろった しゅんかん、ほね が ひかって 字「雪」になる
 *
 * 絵は ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   雲の そこ は たいら。ゆきは ふわふわ ゆれながら まっすぐ おちる。
 *   子どもの うでは かた から出て、おろしていた手を まえへ のばす。
 *   手は ゆび4本と おやゆび。さしだすと 近くなるので 大きく見える(おくゆき)。
 */
import { backOut, during, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '雪'

const CLOUD = '#d3deec'
const CLOUD_SHADE = '#a9bbd3'
const CLOUD_LIGHT = '#f6faff'
const SNOW_GROUND = '#dcebf8'
const SNOW_HILL = '#e8f2fb'
const FLAKE_ARM = '#7fb8e6'
const FLAKE_BODY = '#ffffff'
const PINE = '#3f9c59'
const PINE_LIGHT = '#55b86e'
const TRUNK = '#8c5b3c'
const SKIN = '#f8cfa6'
const SKIN_SHADE = '#dca06c'
const HAIR = '#5a3b2a'
const COAT = '#e5594f'
const COAT_DARK = '#c9463e'
const CUFF = '#fff6e8'
const SCARF = '#ffb347'
const HAT = '#4f9be0'
const HAT_BAND = '#2f6fb3'
const PANTS = '#3e5c86'
const BOOT = '#6b4a36'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const CLOUD_IN = 1.0
/** 大きな ゆき ひとつぶ が 雲から はなれる */
const FIRST_DROP = 1.8
/** 子どもが 空を見あげる */
const LOOK_UP = 2.0
/** 手を まえへ さしだす */
const REACH = 2.7
const REACH_END = 3.9
/** ゆきが てのひらに のる */
const LAND = 4.6
/** そのほかの ゆきが ふりだす(1つぶずつ ずらす) */
const MORE = 4.8
const INK = 6.8
const DONE = 9.8
const DURATION = 10.4

/* ───────── 子どもの 位置 ───────── */

const GROUND_Y = 97.8
/** あたまの まんなか(右はしに 立って、左の 空と 手を 見る) */
const HEAD: readonly [number, number] = [98, 44]
const HEAD_R = 9.5
const NECK: readonly [number, number] = [98, 53.5]
/** うでの つけね(かた)。ここを じくに 手を ふりあげる */
const SHOULDER: readonly [number, number] = [100, 64]
/** さしだした 手の まんなかへんで うける ゆきの 場所(4画目の さいごの あたり) */
const CATCH_X = 54
const CATCH_Y = 52.6

/* ───────── 雲 ───────── */

/** 3画目の よこ線(右が 少し 上がる)と 同じだけ 雲を かたむける */
const CLOUD_BASE: readonly [number, number] = [54, 29]
const CLOUD_TILT = (Math.atan2(26.1 - 32.7, 80 - 20) * 180) / Math.PI
type Puff = readonly [cx: number, cy: number, r: number]
const CLOUD_PUFFS: readonly Puff[] = [
  [24, 17, 8],
  [38, 15, 9],
  [54, 14, 10],
  [70, 15, 9.5],
  [84, 19.5, 8],
]
/** 雲の かげ: 色の面を この分だけ 上に ずらして、そこに かげの おびを のこす */
const SHADE_BAND = 2.4
/** 雲が ぷるっと ふるえて、ゆきを おとす 時間 */
const SHAKES: readonly number[] = [FIRST_DROP, MORE, MORE + 0.2, MORE + 0.4, MORE + 0.6, MORE + 0.8]

function CloudShape({ lift }: { readonly lift: number }) {
  return (
    <g transform={`translate(0 ${-lift})`}>
      <rect x="14" y="15" width="80" height="14" rx="6" />
      {CLOUD_PUFFS.map(([cx, cy, r]) => (
        <circle key={cx} cx={cx} cy={cy} r={r} />
      ))}
    </g>
  )
}

function Cloud({ t }: SceneProps) {
  const grow = span(t, 0.05, CLOUD_IN, backOut)
  if (grow <= 0) return null
  // 雲が ゆきを おとすたびに、ぷるっと ふるえる
  const shake = Math.min(1, SHAKES.reduce((sum, at) => sum + Math.sin(span(t, at, at + 0.3) * Math.PI), 0))
  const slide = (1 - span(t, 0, CLOUD_IN, easeOut)) * 26
  return (
    <Layer x={slide} scaleX={(0.7 + 0.3 * grow) * (1 + 0.03 * shake)} scaleY={(0.7 + 0.3 * grow) * (1 - 0.05 * shake)} rotate={CLOUD_TILT} origin={CLOUD_BASE}>
      <g fill={CLOUD_SHADE}>
        <CloudShape lift={0} />
      </g>
      <g fill={CLOUD_LIGHT} transform="translate(-0.9 0)">
        <CloudShape lift={SHADE_BAND + 1.2} />
      </g>
      <g fill={CLOUD}>
        <CloudShape lift={SHADE_BAND} />
      </g>
    </Layer>
  )
}

/* ───────── まわりの けしき ───────── */

function Pine({ x, h }: { readonly x: number; readonly h: number }) {
  const w = h * 0.5
  return (
    <>
      <rect x={x - 1.1} y={GROUND_Y - 4} width="2.2" height="4.5" fill={TRUNK} />
      <path d={`M${x - w / 2} ${GROUND_Y - 3} L${x} ${GROUND_Y - 3 - h * 0.6} L${x + w / 2} ${GROUND_Y - 3} Z`} fill={PINE} />
      <path d={`M${x - w * 0.38} ${GROUND_Y - 3 - h * 0.34} L${x} ${GROUND_Y - 3 - h} L${x + w * 0.38} ${GROUND_Y - 3 - h * 0.34} Z`} fill={PINE_LIGHT} />
      {/* つもった ゆき */}
      <path d={`M${x - w * 0.2} ${GROUND_Y - 3 - h * 0.82} L${x} ${GROUND_Y - 3 - h} L${x + w * 0.2} ${GROUND_Y - 3 - h * 0.82} Q${x} ${GROUND_Y - 3 - h * 0.74} ${x - w * 0.2} ${GROUND_Y - 3 - h * 0.82} Z`} fill="#ffffff" />
    </>
  )
}

function Ground({ t }: SceneProps) {
  const rise = span(t, 0, 0.6, easeOut)
  return (
    <Layer opacity={rise}>
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 94 V101 H-4 Z" fill={SNOW_HILL} />
      <ellipse cx="54.5" cy="98.4" rx="52" ry="5.4" fill={SNOW_GROUND} />
      <Pine x={7} h={26} />
      <Pine x={18} h={16} />
    </Layer>
  )
}

/* ───────── 子ども ───────── */

type Mood = 'cold' | 'wonder' | 'happy'

function Face({ mood, look }: { readonly mood: Mood; readonly look: number }) {
  // look: 目が 上を むく 度合い(0〜1)
  const dx = -0.5 * look
  const dy = -0.9 * look
  return (
    <>
      <ellipse cx="90.8" cy="48.6" rx="2" ry="1.3" fill={CHEEK} opacity={mood === 'happy' ? 0.85 : 0.5} />
      <ellipse cx="103" cy="48.6" rx="2" ry="1.3" fill={CHEEK} opacity={mood === 'happy' ? 0.85 : 0.5} />
      {mood === 'cold' && (
        <>
          <path d="M90.6 42.2 l3.4 0.9 M98.2 43.1 l3.4 -0.9" fill="none" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <circle cx="92.6" cy="45.4" r="1.15" fill={EYE} />
          <circle cx="99.6" cy="45.4" r="1.15" fill={EYE} />
          <path d="M92.6 50.2 q1.3 -1.2 2.6 0 q1.3 1.2 2.6 0" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'wonder' && (
        <>
          <path d="M90.6 40.6 q1.8 -1.5 3.6 0 M97.8 40.6 q1.8 -1.5 3.6 0" fill="none" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <circle cx={92.6 + dx} cy={44.8 + dy} r="1.8" fill={EYE} />
          <circle cx={99.6 + dx} cy={44.8 + dy} r="1.8" fill={EYE} />
          <circle cx={92.1 + dx} cy={44.1 + dy} r="0.55" fill="#ffffff" />
          <circle cx={99.1 + dx} cy={44.1 + dy} r="0.55" fill="#ffffff" />
          <ellipse cx="95.8" cy="50.2" rx="1.2" ry="1.6" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M90.8 45.8 Q92.6 43.2 94.4 45.8 M97.8 45.8 Q99.6 43.2 101.4 45.8" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M92.4 48.6 Q95.8 54.2 99.4 48.6 Z" fill={MOUTH} />
        </>
      )}
    </>
  )
}

type KidProps = { readonly mood: Mood; readonly tilt: number; readonly look: number }

/** 子どもの からだ(あたま・どう・あし)。うでは べつに かく。 */
function Kid({ mood, tilt, look }: KidProps) {
  return (
    <>
      <ellipse cx="99" cy={GROUND_Y + 0.4} rx="10" ry="2.2" fill="#000000" opacity="0.1" />
      {/* あし: どう の下から 2本 */}
      <rect x="94.2" y="86" width="5" height="9" rx="2.4" fill={PANTS} />
      <rect x="100.6" y="86" width="5" height="9" rx="2.4" fill={PANTS} />
      <ellipse cx="95.6" cy="96.4" rx="4.2" ry="2.1" fill={BOOT} />
      <ellipse cx="104" cy="96.4" rx="4.2" ry="2.1" fill={BOOT} />
      {/* どう: コート */}
      <rect x="91" y="55" width="17" height="35" rx="7" fill={COAT} />
      <path d="M99.5 58 V88" stroke={COAT_DARK} strokeWidth="1.2" strokeLinecap="round" />
      {/* くび と まきもの(くびは みじかく どう の まんなか の上) */}
      <rect x="91.6" y="52" width="14.8" height="5.4" rx="2.7" fill={SCARF} />
      {/* あたま */}
      <Layer rotate={tilt} origin={NECK}>
        <circle cx={HEAD[0]} cy={HEAD[1]} r={HEAD_R} fill={SKIN} />
        <ellipse cx="89.4" cy="45.8" rx="1.6" ry="3" fill={HAIR} />
        <ellipse cx="106.6" cy="45.8" rx="1.6" ry="3" fill={HAIR} />
        <Face mood={mood} look={look} />
        <path d="M88.8 40.6 C88.4 28.6 107.6 28.6 107.2 40.6 Z" fill={HAT} />
        <rect x="88.2" y="39" width="19.6" height="4.6" rx="2.3" fill={HAT_BAND} />
        <circle cx="98" cy="31.4" r="3" fill="#ffffff" />
      </Layer>
    </>
  )
}

/** さしだす 手と そで。かたから 左へ のびた かっこうで かく(あとで ふりあげる) */
function ArmAndHand() {
  const fingers: readonly (readonly [y: number, x: number, w: number])[] = [
    [55.5, 30, 44],
    [62.2, 27, 47],
    [68.9, 29, 45],
    [75.6, 35, 39],
  ]
  return (
    <>
      <path d="M100 59 C95 57 91 55 86 54 L86 92 C91 91 96 80 100 73 Z" fill={COAT_DARK} />
      <rect x="58" y="55.5" width="30" height="34" rx="9" fill={SKIN} />
      {fingers.map(([y, x, w]) => (
        <g key={y}>
          <rect x={x} y={y + 0.9} width={w} height="6.2" rx="3.1" fill={SKIN_SHADE} />
          <rect x={x} y={y} width={w} height="6.2" rx="3.1" fill={SKIN} />
        </g>
      ))}
      {/* おやゆび(ゆびの 下から、すこし みじかく) */}
      <rect x="42" y="86.5" width="36" height="10.6" rx="5.3" fill={SKIN_SHADE} />
      <rect x="42" y="85.5" width="36" height="10.6" rx="5.3" fill={SKIN} />
      <path d="M64 71 q6 4 14 1.6" fill="none" stroke={SKIN_SHADE} strokeWidth="0.9" strokeLinecap="round" />
      {/* そでぐち */}
      <rect x="83.5" y="53" width="7" height="40" rx="3.2" fill={CUFF} />
    </>
  )
}

/* ───────── ゆき ───────── */

function Flake({ x, y, r, spin = 0, squash = 0 }: { readonly x: number; readonly y: number; readonly r: number; readonly spin?: number; readonly squash?: number }) {
  if (r <= 0) return null
  const arm = Math.max(0.6, r * 0.26)
  return (
    <g transform={`translate(${x} ${y}) scale(${1 + squash} ${1 - squash}) rotate(${spin})`}>
      <circle r={r * 0.92} fill={FLAKE_BODY} />
      {[0, 60, 120].map((a) => (
        <line key={a} x1={-r} x2={r} y1="0" y2="0" stroke={FLAKE_ARM} strokeWidth={arm} strokeLinecap="round" transform={`rotate(${a})`} />
      ))}
      <circle r={r * 0.3} fill={FLAKE_BODY} />
    </g>
  )
}

type Drop = { readonly at: number; readonly from: readonly [number, number]; readonly to: readonly [number, number]; readonly r: number; readonly sway: number }

/** 点の場所に おちつく ゆき(5・6画目 は 左、7・8画目 は 右、2画目 は 左はしの ゆき) */
const DROPS: readonly Drop[] = [
  { at: MORE, from: [22, 33], to: [16.8, 45.5], r: 2.7, sway: 3 },
  { at: MORE + 0.2, from: [40, 32], to: [38, 41], r: 2.5, sway: 3.4 },
  { at: MORE + 0.4, from: [32, 33], to: [35, 49.5], r: 2.5, sway: 3.2 },
  { at: MORE + 0.6, from: [68, 30], to: [72, 36.5], r: 2.5, sway: 2.6 },
  { at: MORE + 0.8, from: [76, 29], to: [71.5, 47.5], r: 2.5, sway: 3.4 },
]
/** 1つぶが ふってくる 長さ(秒) */
const FALL = 1.0

/** ふわふわ ゆれながら おちて、さいごは ぴったり 行き先に とまる */
function drift(t: number, at: number, dur: number, from: readonly [number, number], to: readonly [number, number], sway: number, waves: number) {
  const q = span(t, at, at + dur, easeOut)
  return { q, x: from[0] + (to[0] - from[0]) * q + sway * (1 - q) * Math.sin(q * Math.PI * waves), y: from[1] + (to[1] - from[1]) * q }
}

function Snow({ t, bob }: SceneProps & { readonly bob: number }) {
  // さいしょの 大きな ゆき: てのひらの 上まで ゆっくり おりて、のる
  const first = drift(t, FIRST_DROP, LAND - FIRST_DROP, [CATCH_X, 33], [CATCH_X, CATCH_Y], 7, 4)
  const firstSize = 4.2 * span(t, FIRST_DROP, FIRST_DROP + 0.3, backOut)
  const squash = Math.sin(span(t, LAND, LAND + 0.3) * Math.PI) * 0.18
  const landed = t >= LAND
  return (
    <>
      <Flake x={first.x} y={first.y + (landed ? bob + dipOf(t) : 0)} r={Math.max(0, firstSize)} spin={(1 - first.q) * 220} squash={squash} />
      {DROPS.map((drop) => {
        const p = drift(t, drop.at, FALL, drop.from, drop.to, drop.sway, 2.5)
        const size = drop.r * span(t, drop.at, drop.at + 0.25, backOut)
        const rest = p.q >= 1 ? wave(t, 1.8, drop.at) * 0.25 : 0
        return <Flake key={drop.at} x={p.x} y={p.y + rest} r={Math.max(0, size)} spin={(1 - p.q) * 160} />
      })}
    </>
  )
}

/** ゆきを うけた とき、手が ほんの少し しずむ */
function dipOf(t: number): number {
  return Math.sin(span(t, LAND, LAND + 0.4) * Math.PI) * 1.2
}

/** さむくて 出る しろい いき(口の まえから 左上へ) */
function Breath({ t }: SceneProps) {
  const show = during(t, 0.5, 1.9, 0.25)
  if (show <= 0) return null
  const p = span(t, 0.5, 1.9, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={88 - p * 9} cy={51 - p * 5} rx={2.6 + p * 2.4} ry={1.8 + p * 1.5} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
      <ellipse cx={91 - p * 6} cy={52 - p * 2} rx={1.3 + p} ry={1 + p * 0.6} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 11)

  const mood: Mood = t < LOOK_UP ? 'cold' : t < LAND ? 'wonder' : 'happy'
  // あたまの むき: 下を むく → 空を見あげる → ゆきを おいかけて 手を 見る → まっすぐ
  const tilt = t < LOOK_UP ? -4 : t < 3.0 ? mix(t, LOOK_UP, LOOK_UP + 0.6, -4, 12) : t < LAND ? mix(t, 3.0, LAND, 12, -7) : mix(t, LAND, LAND + 0.6, -7, 0)
  const look = t < LAND ? 1 - span(t, 3.4, LAND) : 0
  // さむくて ふるえる(ゆきを 見つけると とまる)
  const shiver = wave(t, 0.14) * 0.4 * (1 - span(t, LOOK_UP, LOOK_UP + 0.4))
  // うれしくて ちいさく はずむ(字になる ときには もとの 高さ)
  const bob = -Math.abs(wave(t - LAND - 0.2, 0.6)) * 1.1 * during(t, LAND + 0.3, INK - 0.3, 0.2)
  // 手を さしだす: おろした うで が かた を じくに ふりあがり、近づくので 大きくなる
  const reach = span(t, REACH, REACH_END, backOut)
  const armRotate = -90 * (1 - reach)
  const armScale = 0.3 + 0.7 * reach

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Layer x={shiver} y={bob}>
          <Kid mood={mood} tilt={tilt} look={look} />
          <Layer y={dipOf(t)}>
            <Layer rotate={armRotate} scale={armScale} origin={SHOULDER}>
              <ArmAndHand />
            </Layer>
          </Layer>
        </Layer>
        <Breath t={t} />
        <Cloud t={t} />
        <Snow t={t} bob={bob} />
        {/* ゆきが のった しゅんかんの きらり */}
        <g opacity={during(t, LAND, LAND + 0.9, 0.25)}>
          <Star cx={CATCH_X - 8} cy={CATCH_Y - 6} r={2.6 * span(t, LAND, LAND + 0.5)} color="#ffd95a" spin={t * 90} />
          <Star cx={CATCH_X + 8} cy={CATCH_Y - 8} r={2 * span(t, LAND + 0.1, LAND + 0.6)} color="#ffffff" spin={-t * 90} />
        </g>
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
    { at: 0, label: '雲が うかぶ。さむくて ふるえる子ども', sound: 'pop' },
    { at: FIRST_DROP, label: '雲から ゆきが ひとつぶ。子どもが 空を見あげる' },
    { at: REACH, label: '手を まえへ さしだす' },
    { at: LAND, label: 'ゆきが てのひらに のる。にっこり', sound: 'pop' },
    { at: MORE, label: '雲が ぷるっと ふるえて、ゆきが たくさん ふる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '雪 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
