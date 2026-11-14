/*
 * 太(ふとい): 大の字に とびはねる 子の まんなかに、おにぎり(点)。 たべて、どっしり ふとる。
 * (共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … ばんざいで ひろげた りょううで(「大の字」の よこ)
 *   2画目(ノ)  … あたま から どう、ひだりの あし
 *   3画目(乀)  … みぎの あし(ひだりの あしと ハの字に ひらく)
 *   4画目(丶)  … 2ほんの あしの あいだに おちた おにぎり(点)
 *   (字と 重なるのは 大の字に なった さいごの しゅんかん だけ。だいたい 同じ 場所・同じ 向き)
 *
 * ながれ
 *   おなかが ぺこぺこの 子(ポケットに おにぎりが 3つ)
 *   → 1つめを もぐもぐ。おなかが ぷくっ → 2つめも もぐもぐ。おなかが ぷくぷく
 *   → うれしくて、さいごの 1つを ぽーんと ほうりなげ、りょううで りょうあしを ひろげて「大の字」で ジャンプ
 *   → おにぎりが 2ほんの あしの あいだに ぽとん。 どっしり ふとった 子が「大」の字に なり、点が つく
 *   → ほね が ひかって、絵が うすくなり、字「太」が のこる
 *
 * 人は Person(正面)。手は { to, depth } で ポケット・口・あたまの 上へ(depth = 体の まえへ)。
 * おなかの ふくらみは 部品に ないので、held で どうの 上に 服と 同じ色の ふくらみを かさねる(うでより うしろ)。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, Butterfly, Dust, LOOKS, mixLimb, Person, personRig, shade, type Limb, type PersonProps, type Point } from '../sceneFigures'

const CHAR = '太'

const SHIRT = '#ffb94a'
const RICE = '#fbfaf2'
const RICE_SHADE = '#e3dfca'
const NORI = '#2f4a3a'

/** くぎり の時間(秒) */
const POP = 0.7
/** 1つめ: ポケットから とって、もぐもぐ */
const GRAB1 = 1.5
const EAT1 = 2.0
const END1 = 3.0
/** 2つめ */
const GRAB2 = 3.5
const EAT2 = 4.0
const END2 = 4.8
/** さいごの 1つ: ほうりなげて、ジャンプ */
const GRAB3 = 5.1
const THROW = 5.45
const SPREAD = 6.0
const LAND = 6.4
const INK = 6.9
const DONE = 9.7
const DURATION = 10.4

/** 子どもの 立つ場所(こし の x と 地面)と 背の高さ */
const KID_X = 51
const KID_Y = 97
const KID_HEIGHT = 58
const KID = { x: KID_X, y: KID_Y, build: 'child', height: KID_HEIGHT, facing: 'front', look: { ...LOOKS.boy, top: SHIRT, bottom: '#4f7fc2' } } as const
/** ひろげた うで・足(画の 1・2・3画目の むき) */
const ARM_SPREAD = { swing: 92, bend: 4 }
const LEG_SPREAD = { swing: 33, bend: 0 }
const HANG: Limb = { swing: 8, bend: 4 }
/** 手を のばす まえへの きょり */
const REACH = 6

/** 立った ときの 体の 場所(手の とどく 先を きめる もと) */
const ANCHOR = personRig({ ...KID, pose: {} })
const [HEAD_X, HEAD_Y] = ANCHOR.world.head
const HEAD_R = ANCHOR.body.headR * ANCHOR.scale
const [PELVIS_X, PELVIS_Y] = ANCHOR.world.pelvis
const NECK_Y = ANCHOR.world.neck[1]
const HALF_WIDTH = (ANCHOR.body.torsoFrontW * ANCHOR.scale) / 2
/** ポケット(おなかの 下の ほう)・口・あたまの 上(ほうりなげる とき)の 場所 */
const POCKET_Y = PELVIS_Y - 0.13 * KID_HEIGHT
const MOUTH_AT: Point = [HEAD_X, HEAD_Y + HEAD_R * 0.55]
const THROW_AT: Point = [HEAD_X, HEAD_Y - HEAD_R * 2.6]
const POCKET_R: Limb = { to: [PELVIS_X + 5, POCKET_Y], depth: REACH }
const POCKET_L: Limb = { to: [PELVIS_X - 5, POCKET_Y], depth: REACH }
const EAT_R: Limb = { to: [MOUTH_AT[0] + 3, MOUTH_AT[1] + 1], depth: REACH + 2 }
const EAT_L: Limb = { to: [MOUTH_AT[0] - 3, MOUTH_AT[1] + 1], depth: REACH + 2 }
const UP_R: Limb = { to: [THROW_AT[0] + HEAD_R * 1.4, THROW_AT[1]] }
const UP_L: Limb = { to: [THROW_AT[0] - HEAD_R * 1.4, THROW_AT[1]] }

type Key = readonly [time: number, limb: Limb]

/** 画面の みぎ の 手(体の ひだりうで): 1つめを たべ、さいごの 1つを ほうりなげて、ひろげる */
const SCREEN_RIGHT: readonly Key[] = [
  [0, HANG], [GRAB1 - 0.3, HANG], [GRAB1, POCKET_R], [EAT1, EAT_R], [END1, EAT_R], [END1 + 0.3, HANG], [GRAB3 - 0.3, HANG], [GRAB3, POCKET_R],
  [THROW - 0.15, UP_R], [THROW, UP_R], [SPREAD, ARM_SPREAD],
]
/** 画面の ひだり の 手(体の みぎうで): 2つめを たべる */
const SCREEN_LEFT: readonly Key[] = [
  [0, HANG], [GRAB2 - 0.3, HANG], [GRAB2, POCKET_L], [EAT2, EAT_L], [END2, EAT_L], [GRAB3 - 0.1, HANG], [THROW - 0.15, UP_L], [THROW, UP_L], [SPREAD, ARM_SPREAD],
]

/** きまった 時間に きまった かっこう を 通り、あいだ を なめらかに つなぐ */
function keyed(t: number, keys: readonly Key[]): Limb {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i += 1) {
    const [t1, b] = keys[i]
    if (t <= t1) return mixLimb(keys[i - 1][1], b, span(t, keys[i - 1][0], t1, easeInOut))
  }
  return keys[keys.length - 1][1]
}

/** おにぎり(まんなか が 0,0)。かどは まるく、したに のり。 */
function Onigiri({ x, y, scale = 1, rotate = 0 }: { readonly x: number; readonly y: number; readonly scale?: number; readonly rotate?: number }) {
  if (scale <= 0) return null
  return (
    <Layer x={x} y={y} scale={scale} rotate={rotate}>
      <path d="M0 -5.2 L5.6 4 L-5.6 4 Z" fill={RICE} stroke={RICE} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M-5.6 4 L-3.4 0.6 L3.4 0.6 L5.6 4 Z" fill={RICE_SHADE} stroke={RICE_SHADE} strokeWidth="2.4" strokeLinejoin="round" opacity="0.7" />
      <rect x="-3.6" y="0.8" width="7.2" height="5" rx="1.2" fill={NORI} />
    </Layer>
  )
}

type Mood = 'hungry' | 'chew' | 'happy' | 'cheer'
const FACES = { hungry: 'worried', chew: 'closed', happy: 'smile', cheer: 'joy' } as const

/** 子どもの 場所と かっこう */
function kidAt(t: number, mood: Mood): PersonProps {
  const leg = mixLimb({ swing: 2, bend: 0 }, LEG_SPREAD, span(t, THROW + 0.05, SPREAD, easeInOut))
  // とびはじめの ほんの少し だけ からだが うく(さいごは 字の形に もどる)
  const lift = Math.sin(span(t, THROW - 0.1, SPREAD + 0.1) * Math.PI) * 3
  // なげた おにぎり を 目で おいかける(上 → 下)
  const gazeY = t < THROW ? 0 : t < THROW + 0.6 ? -1 : 1
  return {
    ...KID,
    face: FACES[mood],
    gazeY,
    lift,
    opacity: span(t, 0, 0.2),
    pose: { leftArm: keyed(t, SCREEN_RIGHT), rightArm: keyed(t, SCREEN_LEFT), leftLeg: leg, rightLeg: leg },
  }
}

/** どうの 上の ふくらみ と ポケット(のこっている おにぎり つき)。うでより うしろに 描かれる */
function Belly({ t, belly, lift }: { readonly t: number; readonly belly: number; readonly lift: number }) {
  const stored = [
    { dx: -4, until: GRAB2 },
    { dx: 0, until: GRAB3 },
    { dx: 4, until: GRAB1 },
  ]
  const cy = (NECK_Y + PELVIS_Y) / 2 + 3
  const rx = HALF_WIDTH * (0.95 + 0.5 * belly)
  return (
    <g transform={`translate(0 ${-lift})`}>
      <ellipse cx={PELVIS_X} cy={cy + belly} rx={rx} ry={0.14 * KID_HEIGHT * (1 + 0.2 * belly)} fill={SHIRT} />
      {stored.map(({ dx, until }) => (t < until ? <Onigiri key={dx} x={PELVIS_X + dx} y={POCKET_Y - 1.5} scale={0.5} /> : null))}
      <rect x={PELVIS_X - 7} y={POCKET_Y - 0.5} width="14" height="5.4" rx="1.6" fill={shade(SHIRT, 0.18)} />
    </g>
  )
}

/** てに もっている おにぎり。かじると ちいさく なる。手の 場所は うでの さき。 */
function Held({ t, kid }: { readonly t: number; readonly kid: PersonProps }) {
  const rig = personRig(kid)
  const r = rig.world.arms.left.end
  const l = rig.world.arms.right.end
  const firstScale = 1 - 0.4 * span(t, EAT1 + 0.1, EAT1 + 0.5) - 0.6 * span(t, EAT1 + 0.6, END1)
  const secondScale = 1 - 0.4 * span(t, EAT2 + 0.1, EAT2 + 0.4) - 0.6 * span(t, EAT2 + 0.5, END2)
  return (
    <>
      {t >= GRAB1 && t < END1 && <Onigiri x={r[0] - 3} y={r[1] - 4} scale={0.9 * firstScale} rotate={-12} />}
      {t >= GRAB2 && t < END2 && <Onigiri x={l[0] + 3} y={l[1] - 4} scale={0.9 * secondScale} rotate={12} />}
      {t >= GRAB3 && t < THROW && <Onigiri x={r[0] - 1} y={r[1] - 3} scale={0.9} />}
    </>
  )
}

/** ほうりなげた おにぎり。のぼって、おちて、2ほんの あし の あいだ(4画目の 点)に ぽとん。 */
function Thrown({ t }: SceneProps) {
  if (t < THROW) return null
  const peak = THROW + 0.3
  const up = span(t, THROW, peak, easeOut)
  const down = span(t, peak, LAND, easeIn)
  const x = t < peak ? THROW_AT[0] + HEAD_R * 1.4 - 4 * up : KID_X + 3 - 4 * down
  const y = t < peak ? THROW_AT[1] - 3 * up : THROW_AT[1] - 3 + (KID_Y - 5 - (THROW_AT[1] - 3)) * down
  const bounce = Math.sin(span(t, LAND, LAND + 0.3) * Math.PI) * 3
  const spin = 20 + 720 * (1 - span(t, THROW, LAND, easeOut))
  return <Onigiri x={x} y={y - bounce} scale={1.05} rotate={spin} />
}

/** おなかが ぐう。ふるえる 3本の しるし。 */
function Rumble({ t }: SceneProps) {
  const show = during(t, POP + 0.2, GRAB1 + 0.1, 0.25)
  if (show <= 0) return null
  const shake = wave(t, 0.16) * 0.9
  const y = (NECK_Y + PELVIS_Y) / 2
  return (
    <g opacity={show} fill="none" stroke="#6b7fb3" strokeWidth="1" strokeLinecap="round" transform={`translate(${shake} 0)`}>
      <path d={`M${KID_X - 12} ${y} q-2 2 0 4 q2 2 0 4`} />
      <path d={`M${KID_X - 17} ${y - 1.5} q-2.4 3.4 0 6.8 q2.4 3.4 0 6.8`} />
      <path d={`M${KID_X + 13} ${y} q2 2 0 4 q-2 2 0 4`} />
      <path d={`M${KID_X + 18} ${y - 1.5} q2.4 3.4 0 6.8 q-2.4 3.4 0 6.8`} />
    </g>
  )
}

/** よろこびの ほし(あたまの まわり) */
function Cheer({ t }: SceneProps) {
  const show = during(t, THROW + 0.1, LAND + 0.5, 0.25)
  if (show <= 0) return null
  const spin = t * 160
  return (
    <g opacity={show}>
      <Star cx={34} cy={12} r={3.2} color="#ffc233" spin={spin} />
      <Star cx={69} cy={9} r={2.6} color="#ff7a4d" spin={-spin} />
      <Star cx={79} cy={24} r={2.2} color="#ffd95a" spin={spin} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)
  const chewing = (t >= EAT1 && t < END1) || (t >= EAT2 && t < END2)
  const mood: Mood = t < GRAB1 + 0.5 ? 'hungry' : chewing ? 'chew' : t >= THROW - 0.1 ? 'cheer' : 'happy'
  // おなか: 1つめ・2つめを たべるたびに ふくらみ、さいごは どっしり
  const belly = 0.45 * span(t, EAT1 + 0.4, END1, easeOut) + 0.4 * span(t, EAT2 + 0.3, END2, easeOut) + 0.15 * span(t, THROW, SPREAD, easeOut)
  const kid = kidAt(t, mood)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[13, 13]} tufts={[8, 30, 78, 100]} />
        <Butterfly x={82 + Math.sin(t * 1.1) * 12} y={27 + Math.sin(t * 2.3) * 4} t={t} />
        <Layer scale={backOut(span(t, 0, POP))} origin={[KID_X, KID_Y]}>
          <Person {...kid} held={<Belly t={t} belly={belly} lift={kid.lift ?? 0} />} />
        </Layer>
        <Held t={t} kid={kid} />
        <Rumble t={t} />
        <Cheer t={t} />
        <Dust x={KID_X} y={KID_Y - 2} p={span(t, LAND, LAND + 0.6, easeOut)} reach={9} />
        <Thrown t={t} />
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
    { at: 0, label: 'おなかが ぺこぺこの 子', sound: 'pop' },
    { at: GRAB1, label: 'ポケットから おにぎりを とって もぐもぐ' },
    { at: GRAB2, label: '2つめも もぐもぐ。おなかが ふくらむ' },
    { at: GRAB3, label: 'さいごの 1つを ほうりなげ、大の字で ジャンプ', sound: 'pop' },
    { at: LAND, label: 'おにぎりが あしの あいだに ぽとん(点)' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '太 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
