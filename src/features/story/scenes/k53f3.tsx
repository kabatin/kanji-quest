/*
 * 右(みぎ): ごはんを 口に はこぶ 手。その 手が ある ほうが 右。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … あたまの はねた かみ から かた を通って、おはしを もつ 右手 まで のびた うで
 *                  (おはしを おいた しゅんかん だけ、うで が この線に重なる)
 *   2画目(一)  … かべの 長い たな(上に 時計と 植木ばち)
 *   3画目(丨)  … ちゃわん の 左がわ
 *   4画目(𠃍)  … ちゃわん の ふち と 右がわ(左手が そえて いる ほう)
 *   5画目(一)  … ちゃわん の そこ
 *   (3・4・5画目の 口 = ちゃわん。ごはんを 入れる 口(くち)の かたち)
 *
 * ながれ
 *   おなかが ぺこぺこの 子が、ほかほかの ごはん を 見て よだれ。
 *   → 時計が じゅうにじ を しらせて「たべよう!」と 目が かがやく
 *   → 右手の おはし で ごはん を すくい、口に はこぶ → ぱくっ、もぐもぐ(うれしい)
 *   → おはしを おいて ごちそうさま。右手が のびた しゅんかん、ほね が ひかって 字「右」になる
 *
 * 人は、ほんものの つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(口に はこぶときは ひじ が 下)。
 *   くび は みじかく、あたま は どう の まんなか の上。左手は ちゃわん の よこに そえる。
 */
import { backOut, during, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '右'

const WALL = '#fff1d6'
const SHELF = '#b5835a'
const SHELF_DARK = '#8f6240'
const TABLE = '#e8bd82'
const TABLE_EDGE = '#d6a768'
const TABLE_FRONT = '#c98f55'
const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#4f9be0'
const TUNIC_DARK = '#3c82c4'
const CHEEK = '#ff9d9d'
const MOUTH = '#b9483f'
const EYE = '#2b2b2b'
const PORCELAIN = '#7fb8ea'
const PORCELAIN_SHADE = '#5f9cd6'
const BOWL_BAND = '#ffffff'
const RICE = '#ffffff'
const RICE_SHADE = '#e9eef2'
const STICK = '#c98a4b'
const POT = '#d9784a'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const CLOCK_RIM = '#e8534a'
const SUN = '#ffd24a'

/** くぎり の時間(秒) */
const PERK = 1.0 // 時計が なって、目が かがやく
const LIFT = 2.3 // おはしを もちあげる
const DIP = 3.1 // ごはん に おはしを さす
const SCOOPED = 3.5 // すくえた
const MOUTH_IN = 4.3 // 口の ところ まで きた
const BITE = 4.6 // ぱくっ
const HOME = 5.9 // おはしを おく
const INK = 6.4
const DONE = 8.9
const DURATION = 9.5

/** ほんものの うで の長さ(かた→ひじ、ひじ→手 どちらも) */
const ARM = 22
/** 右手(見て 左がわ)の かた・左手(見て 右がわ)の かた */
const SHOULDER_R: readonly [number, number] = [46, 43]
const SHOULDER_L: readonly [number, number] = [70, 43]
/** あたまの まんなか・くび の位置 */
const HEAD: readonly [number, number] = [57, 28]
const NECK: readonly [number, number] = [57, 40]

/** うで・おはし の かっこう。角度は ま下から 左へ ひらいた 度数(右へ ひらくと マイナス) */
type Pose = { readonly a1: number; readonly a2: number; readonly c: number }

/** おはしを おいた とき(うで が のびて、1画目の線に ほぼ 重なる) */
const REST: Pose = { a1: 24, a2: 34, c: -82 }
/** ごはんの 上(ひじ は 下に たれる) */
const BOWL: Pose = { a1: 5, a2: -137, c: 12 }
/** 口の まえ(ひじ は ま下。手は あごの よこ) */
const MOUTH_POSE: Pose = { a1: -3, a2: -172, c: -144 }

const KEYS: readonly { readonly at: number; readonly pose: Pose }[] = [
  { at: 0, pose: REST },
  { at: LIFT, pose: REST },
  { at: DIP, pose: BOWL },
  { at: SCOOPED, pose: BOWL },
  { at: MOUTH_IN, pose: MOUTH_POSE },
  { at: BITE, pose: MOUTH_POSE },
  { at: HOME, pose: REST },
]

function samplePose(t: number): Pose {
  for (let i = 1; i < KEYS.length; i++) {
    const prev = KEYS[i - 1]
    const next = KEYS[i]
    if (t <= next.at) {
      return {
        a1: mix(t, prev.at, next.at, prev.pose.a1, next.pose.a1),
        a2: mix(t, prev.at, next.at, prev.pose.a2, next.pose.a2),
        c: mix(t, prev.at, next.at, prev.pose.c, next.pose.c),
      }
    }
  }
  return KEYS[KEYS.length - 1].pose
}

const rad = (deg: number) => (deg * Math.PI) / 180
/** ま下から 左へ deg ひらいた むき(長さ 1) */
const dir = (deg: number): readonly [number, number] => [-Math.sin(rad(deg)), Math.cos(rad(deg))]

/** かた → ひじ → 手 の じゅんに つながる うで。 */
function limb(shoulder: readonly [number, number], a1: number, a2: number) {
  const [d1x, d1y] = dir(a1)
  const elbow = [shoulder[0] + d1x * ARM, shoulder[1] + d1y * ARM] as const
  const [d2x, d2y] = dir(a2)
  const hand = [elbow[0] + d2x * ARM, elbow[1] + d2y * ARM] as const
  return { elbow, hand }
}

function Room() {
  return (
    <>
      <rect x="0" y="0" width="109" height="109" fill={WALL} />
      <circle cx="12" cy="10" r="5" fill={SUN} opacity="0.75" />
    </>
  )
}

/** かべの たな(2画目)。上に 植木ばち と 時計。 */
function Shelf({ t }: SceneProps) {
  const rise = span(t, 0, 0.5, easeOut)
  // 時計が なる: ぶるぶる ふるえる
  const ring = during(t, PERK, PERK + 0.9, 0.1)
  const shake = ring * wave(t, 0.1) * 6
  const sway = wave(t, 3) * 2
  return (
    <Layer opacity={rise}>
      <path d="M20 41 l0 7 l8 -7 Z M80 41 l0 7 l8 -7 Z" fill={SHELF_DARK} />
      <rect x="11" y="37.5" width="88" height="4" rx="1.6" fill={SHELF} />
      <rect x="11" y="40.2" width="88" height="1.3" rx="0.6" fill={SHELF_DARK} />
      {/* 植木ばち */}
      <path d="M17 31 H28 L26.8 37.5 H18.2 Z" fill={POT} />
      <Layer rotate={sway} origin={[22.5, 31]}>
        <ellipse cx="19" cy="25" rx="2.6" ry="5.2" fill={LEAF_DARK} transform="rotate(-28 19 25)" />
        <ellipse cx="26" cy="25" rx="2.6" ry="5.2" fill={LEAF_DARK} transform="rotate(28 26 25)" />
        <ellipse cx="22.5" cy="23.5" rx="2.8" ry="6.4" fill={LEAF} />
      </Layer>
      {/* 時計(おひる の じゅうにじ) */}
      <Layer rotate={shake} origin={[86, 37.5]}>
        <circle cx="80.8" cy="21.6" r="2.6" fill={CLOCK_RIM} />
        <circle cx="91.2" cy="21.6" r="2.6" fill={CLOCK_RIM} />
        <rect x="80.6" y="35" width="2" height="2.6" fill={CLOCK_RIM} />
        <rect x="89.4" y="35" width="2" height="2.6" fill={CLOCK_RIM} />
        <circle cx="86" cy="29" r="8.4" fill={CLOCK_RIM} />
        <circle cx="86" cy="29" r="6.6" fill="#ffffff" />
        <path d="M86 29 V23.4 M86 29 L89.4 29" stroke="#3b3b3b" strokeWidth="1.1" strokeLinecap="round" />
        <circle cx="86" cy="29" r="0.9" fill="#3b3b3b" />
      </Layer>
      {ring > 0 ? (
        <g opacity={ring} fill="none" stroke="#f2a33a" strokeWidth="1" strokeLinecap="round">
          <path d="M75.5 24 Q74 27 75.5 30 M72.5 22.5 Q70 27 72.5 31.5" />
          <path d="M96.5 24 Q98 27 96.5 30 M99.5 22.5 Q102 27 99.5 31.5" />
        </g>
      ) : null}
    </Layer>
  )
}

function TableTop() {
  return (
    <>
      <rect x="0" y="80" width="109" height="30" fill={TABLE} />
      <rect x="0" y="80" width="109" height="2.2" fill={TABLE_EDGE} />
      <rect x="0" y="98.4" width="109" height="11" fill={TABLE_FRONT} />
    </>
  )
}

type Mood = 'hungry' | 'eager' | 'open' | 'chew' | 'happy'

function Face({ mood, chew }: { readonly mood: Mood; readonly chew: number }) {
  const puff = mood === 'chew' ? 3 + Math.abs(chew) * 0.9 : 2.1
  return (
    <>
      <circle cx="49" cy="33" r={puff} fill={CHEEK} opacity={mood === 'chew' ? 0.8 : 0.55} />
      <circle cx="65" cy="33" r={puff} fill={CHEEK} opacity={mood === 'chew' ? 0.8 : 0.55} />
      {mood === 'hungry' ? (
        <>
          <path d="M49.6 26.4 l4 -1.4 M64.4 26.4 l-4 -1.4" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="52.4" cy="29.4" r="1.4" fill={EYE} />
          <circle cx="61.6" cy="29.4" r="1.4" fill={EYE} />
          <path d="M54.6 36.4 Q57 34.6 59.4 36.4" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M61 36.2 Q62.6 38.8 61 40 Q59.4 38.8 61 36.2 Z" fill="#7cc4f2" />
        </>
      ) : null}
      {mood === 'eager' ? (
        <>
          <circle cx="52.4" cy="29" r="2" fill={EYE} />
          <circle cx="61.6" cy="29" r="2" fill={EYE} />
          <circle cx="53" cy="28.2" r="0.7" fill="#ffffff" />
          <circle cx="62.2" cy="28.2" r="0.7" fill="#ffffff" />
          <path d="M54.4 34.6 Q57 38.6 59.6 34.6 Z" fill={MOUTH} />
        </>
      ) : null}
      {mood === 'open' ? (
        <>
          <circle cx="52.4" cy="29" r="1.8" fill={EYE} />
          <circle cx="61.6" cy="29" r="1.8" fill={EYE} />
          <ellipse cx="57" cy="36" rx="3.4" ry="3.8" fill={MOUTH} />
          <ellipse cx="57" cy="38" rx="2" ry="1.4" fill="#ff8a8a" />
        </>
      ) : null}
      {mood === 'chew' || mood === 'happy' ? (
        <>
          <path d="M50.4 29.8 Q52.4 27.2 54.4 29.8 M59.6 29.8 Q61.6 27.2 63.6 29.8" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          {mood === 'chew' ? (
            <ellipse cx="57" cy="35.6" rx={1.8 + Math.abs(chew) * 0.8} ry={0.7 + Math.abs(chew) * 1.1} fill={MOUTH} />
          ) : (
            <path d="M53.8 34.4 Q57 39.4 60.2 34.4 Z" fill={MOUTH} />
          )}
        </>
      ) : null}
    </>
  )
}

function Head({ mood, chew, tilt }: { readonly mood: Mood; readonly chew: number; readonly tilt: number }) {
  return (
    <Layer rotate={tilt} origin={NECK}>
      <Layer scale={1.12} origin={NECK}>
      <circle cx={HEAD[0]} cy={HEAD[1]} r="11.4" fill={SKIN} />
      <path d="M45.6 28 C44.6 16 55 12.6 63 14.4 C69.6 16 70.6 23 69.2 28.4 C66.6 22.6 60.4 20.6 55.4 21.4 C51 22 47.4 24.4 45.6 28 Z" fill={HAIR} />
      {/* 1画目の 書きはじめ: ぴょこんと はねた かみ */}
      <path d="M52.6 16.6 Q51.4 12.6 54.4 14 Q55.4 11.4 57.6 14.2" fill="none" stroke={HAIR} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Face mood={mood} chew={chew} />
      </Layer>
    </Layer>
  )
}

/** かた から出て、ひじ で まがる うで。 */
function Sleeve({ shoulder, elbow, hand, color }: { readonly shoulder: readonly [number, number]; readonly elbow: readonly [number, number]; readonly hand: readonly [number, number]; readonly color: string }) {
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.6" fill={SKIN} />
    </>
  )
}

/** 手に もった おはし。さきに ごはんが のることも ある。 */
function Chopsticks({ hand, c, loaded }: { readonly hand: readonly [number, number]; readonly c: number; readonly loaded: boolean }) {
  const [dx, dy] = dir(c)
  const [nx, ny] = [-dy, dx]
  const tip = [hand[0] + dx * 14, hand[1] + dy * 14] as const
  const tail = [hand[0] - dx * 3, hand[1] - dy * 3] as const
  return (
    <>
      {[-0.9, 0.9].map((off) => (
        <line key={off} x1={tail[0] + nx * off} y1={tail[1] + ny * off} x2={tip[0] + nx * off * 0.3} y2={tip[1] + ny * off * 0.3} stroke={STICK} strokeWidth="1.4" strokeLinecap="round" />
      ))}
      {loaded ? (
        <>
          <ellipse cx={tip[0] + dx * 1.2} cy={tip[1] + dy * 1.2} rx="2.8" ry="2.2" fill={RICE} stroke={RICE_SHADE} strokeWidth="0.6" />
          <ellipse cx={tip[0] + dx * 3} cy={tip[1] + dy * 3 + 0.4} rx="1.4" ry="1" fill={RICE} />
        </>
      ) : null}
      <circle cx={hand[0]} cy={hand[1]} r="3.6" fill={SKIN} />
    </>
  )
}

/** ごはん を 入れた ちゃわん(3・4・5画目 = 口)。 */
function Bowl({ t }: SceneProps) {
  const pop = span(t, 0.1, 0.7, backOut)
  // ひと口 たべると、もりが すこし へる
  const level = 1 - 0.28 * span(t, BITE - 0.1, BITE + 0.3)
  const steam = during(t, 0.5, BITE - 0.2, 0.4)
  return (
    <Layer scale={pop} origin={[61, 92]}>
      {/* ごはんの もり(ちゃわん の ふち から ふくらむ) */}
      <Layer scaleY={level} origin={[61, 66]}>
        <path d="M45 66.5 Q46 52 61 51.5 Q76 52 78 66.5 Z" fill={RICE} />
        <path d="M66 54 Q73 56 75.5 64 L78 66.5 L70 66.5 Z" fill={RICE_SHADE} />
        <ellipse cx="55" cy="58" rx="1.5" ry="0.9" fill={RICE_SHADE} />
        <ellipse cx="61" cy="55.6" rx="1.5" ry="0.9" fill={RICE_SHADE} />
        <ellipse cx="58.6" cy="62" rx="1.5" ry="0.9" fill={RICE_SHADE} />
      </Layer>
      <path d="M42 66 H81 C81 80 77.6 88.6 72 91 H51.6 C45.4 88.6 42 80 42 66 Z" fill={PORCELAIN} />
      <path d="M42.3 71 H80.7 C80.5 73 80.3 75 80 76.6 H43 C42.6 75 42.4 73 42.3 71 Z" fill={BOWL_BAND} />
      <path d="M71 66 H81 C81 80 77.6 88.6 72 91 H66 C70 86 71.6 78 71 66 Z" fill={PORCELAIN_SHADE} />
      <rect x="50" y="90" width="24" height="4.6" rx="2" fill={PORCELAIN_SHADE} />
      {steam > 0 ? (
        <g opacity={steam * 0.8} fill="none" stroke="#b9c7d6" strokeWidth="1.6" strokeLinecap="round">
          {[54, 62, 70].map((x, i) => {
            const p = ((t * 0.7 + i * 0.33) % 1)
            return <path key={x} d={`M${x + Math.sin(p * 6) * 1.2} ${49 - p * 8} q-1.6 -2.6 0 -5 q1.6 -2.4 0 -4.4`} opacity={1 - p} />
          })}
        </g>
      ) : null}
    </Layer>
  )
}

/** おなかが すいた ときの よだれ と、うれしい ときの ハート。 */
function Heart({ x, y, size }: { readonly x: number; readonly y: number; readonly size: number }) {
  return <path d={`M${x} ${y + size * 0.9} C${x - size * 1.5} ${y - size * 0.2} ${x - size * 0.5} ${y - size * 1.1} ${x} ${y - size * 0.3} C${x + size * 0.5} ${y - size * 1.1} ${x + size * 1.5} ${y - size * 0.2} ${x} ${y + size * 0.9} Z`} fill="#f07f9e" />
}

function Hearts({ t }: SceneProps) {
  const show = during(t, HOME - 0.2, INK + 0.3, 0.25)
  if (show <= 0) return null
  const p = span(t, HOME - 0.2, INK + 0.3)
  return (
    <g opacity={show}>
      <Heart x={73} y={20 - p * 5} size={2.6} />
      <Heart x={42} y={16 - p * 4} size={2} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)
  const appear = span(t, 0.2, 0.8, backOut)
  const pose = samplePose(t)
  const right = limb(SHOULDER_R, pose.a1, pose.a2)
  const loaded = t >= SCOOPED && t < BITE
  const mood: Mood = t < PERK ? 'hungry' : t < MOUTH_IN - 0.3 ? 'eager' : t < BITE ? 'open' : t < HOME ? 'chew' : 'happy'
  const chew = mood === 'chew' ? wave(t - BITE, 0.45) : 0
  // 口に はこぶとき すこし まえのめり、もぐもぐ で あたまが はずむ
  const lean = mix(t, SCOOPED, MOUTH_IN, 0, -4) * (1 - span(t, BITE, BITE + 0.4))
  const bob = mood === 'chew' ? -Math.abs(chew) * 0.8 : mood === 'happy' ? wave(t, 1.2) * 0.4 : 0
  // ひだりの うで: ちゃわん の よこ に そえる(右へ ひらいた ひじ)
  const left = limb(SHOULDER_L, -30, 10)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Room />
        <Shelf t={t} />
        <Layer scale={appear} origin={[57, 80]}>
          <rect x="44" y="38" width="28" height="46" rx="9" fill={TUNIC} />
          <rect x="53.6" y="35.5" width="6.8" height="7" rx="2.4" fill={SKIN_SHADE} />
          <Layer y={bob} origin={NECK}>
            <Head mood={mood} chew={chew} tilt={lean} />
          </Layer>
        </Layer>
        <TableTop />
        <Bowl t={t} />
        {/* 左手: ちゃわん を そえて もつ */}
        <Layer opacity={appear} scale={appear} origin={[57, 80]}>
          <Sleeve shoulder={SHOULDER_L} elbow={left.elbow} hand={left.hand} color={TUNIC_DARK} />
          {/* 右手: かた → ひじ → 手(1画目の うで) */}
          <Sleeve shoulder={SHOULDER_R} elbow={right.elbow} hand={right.hand} color={TUNIC_DARK} />
          <Chopsticks hand={right.hand} c={pose.c} loaded={loaded} />
        </Layer>
        <Hearts t={t} />
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
    { at: 0, label: 'おなかが ぺこぺこ。ごはん を 見て よだれ', sound: 'pop' },
    { at: PERK, label: '時計が なって、目が かがやく' },
    { at: LIFT, label: '右手で おはしを もちあげる' },
    { at: DIP, label: 'ごはん を すくう', sound: 'tap' },
    { at: MOUTH_IN, label: '口に はこぶ。ぱくっ' },
    { at: BITE + 0.4, label: 'もぐもぐ。おいしい!' },
    { at: HOME, label: 'おはしを おいて ごちそうさま' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '右 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
