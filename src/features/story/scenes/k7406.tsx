/*
 * 理(り): 玉(たま)を みがいて、きれいな すじを 出す。
 *
 * ほね(画と絵の対応)
 *   1・3・4画目(王の 3本の よこ) … みがくと うかびあがる、玉(ぎょく)の 3本の すじ
 *   2画目(王の たて)             … 玉の まんなかを とおる たての すじ
 *   5〜9画目(里の まど)          … 木の いえの まど(まわりの わく・よこの しきり・たての しきり)
 *   10画目                      … かべの よこ木(はり)
 *   11画目                      … いえの いちばん下の どだい
 *   (まど・はり・どだい は 字の線と だいたい 同じ場所。字の 音「リ」の パーツの 里 を、村の いえ として のこす)
 *
 * ながれ
 *   木の いえの よこに、ざらざらの 大きな 石が ある。子どもが あるいてきて、ふみ台に ぴょんと のる
 *   → 「なんだろう?」と ふしぎそうに 見る → ぬのを もって ごしごし みがく(あせ が ひかる)
 *   → 下から だんだん つやつやの 玉(みどり色)に なり、ぽわっと すじが うかぶ → 子どもが びっくり、にっこり
 *   → 上まで みがけて、「やったー!」と ばんざい
 *   → すじ(ほね)が ひかって、絵が うすくなり、字「理」が のこる
 *
 * 子どもは ほんものの つくり を守る(字の形に合わせるために 体を ゆがめない):
 *   うで は かた から出て、ひじ で まがる(かた → ひじ → 手)。くび は みじかい。
 *   石は ほんものの 石らしく ざらざらで、みがくと 下から つやが 出る。まどの わくも まっすぐに かく。
 */
import { backOut, clamp01, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, Bird, HANG_ARM, LOOKS, mixLimb, Person, personRig, Question, Sweat, walk, type Limb, type PersonProps } from '../sceneFigures'

const CHAR = '理'

const CLOTH = '#f4f8ff'
const CLOTH_SHADE = '#cfdcf0'
const ROCK = '#a39d92'
const ROCK_DARK = '#868075'
const ROCK_LIGHT = '#bcb6aa'
const JADE = '#5fc79a'
const JADE_DARK = '#3fa97c'
const JADE_LIGHT = '#a9edcb'
const VEIN = '#effff6'
const WALL = '#f1dcb4'
const WALL_SHADE = '#e3c998'
const WOOD = '#8c5b3c'
const WOOD_DARK = '#70452b'
const ROOF = '#d65a43'
const GLASS = '#cdeaf9'

/** くぎり の時間(秒) */
const WALK = 0.5
const HOP = 1.4
const STAND = 1.85
const RUB = 2.5
const SURPRISE = 3.0
const HAPPY = 3.8
const POLISHED = 5.8
const INK = 6.6
const DONE = 9.8
const DURATION = 10.4

/** 子どもの ふみ台の うえ: 地面から このぶん 上がる */
const STOOL_LIFT = 7
/** 子ども(左むき)の 大きさ。ふみ台の 上で 石の ほうを むく */
const KID_HEIGHT = 64
/** ふみ台の 上に のった とき の こし の x */
const KID_STAND_X = 55
const GROUND_Y = 93
/** 石の ひょうめん(みがく 場所)の x。ここに 手を あてる */
const ROCK_FACE_X = 44.5
/** 手が とどく たかさ の はん囲(うで の 長さ から) */
const RUB_TOP = 34
const RUB_BOTTOM = 58
/** 石の 上と下(ここを 下から 上へ みがきあげる) */
const ROCK_BOTTOM = 94
const ROCK_TOP = 12
const KID_LOOK = { ...LOOKS.boy, top: '#f08a5d', bottom: '#4a6fa5' } as const

type Point = readonly [number, number]

const ROCK_PATH = 'M17 17 Q30 12 40 20 Q46 28 44 42 L45 78 Q45 92 34 92 H18 Q7 92 8 78 L8.5 30 Q9 20 17 17 Z'

/** 木の いえ。まどの わく は まっすぐに かく(字の 里 の 場所と だいたい 同じ) */
function House() {
  return (
    <>
      {/* かべ と やね */}
      <rect x="44" y="9" width="66" height="84" fill={WALL} />
      <rect x="44" y="9" width="66" height="4" fill={WALL_SHADE} />
      <path d="M40 10 L46 1.5 H112 V10 Z" fill={ROOF} />
      {/* はり と どだい(10画目・11画目) */}
      <rect x="44" y="66" width="66" height="4.2" rx="1" fill={WOOD} />
      <rect x="40" y="87.6" width="70" height="4.8" rx="1.2" fill={WOOD_DARK} />
      {/* たての はしら(9画目の 下のほう): まどの 下から どだいまで */}
      <rect x="67.8" y="52" width="3.6" height="36" fill={WOOD} />
      {/* まど: 外わく・ガラス・しきり */}
      <rect x="47.5" y="18.5" width="44" height="35.5" rx="2" fill={WOOD} />
      <rect x="50.6" y="21.6" width="37.8" height="29.3" rx="1" fill={GLASS} />
      <path d="M53 29 l6 -6 M53 36 l12 -12" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
      <rect x="50.6" y="32.2" width="37.8" height="2.8" fill={WOOD} />
      <rect x="67.8" y="21.6" width="3" height="29.3" fill={WOOD} />
    </>
  )
}

function Stool() {
  return (
    <>
      <rect x="46" y="86" width="22" height="3.4" rx="1.4" fill="#b98558" />
      <rect x="48.5" y="89" width="3.6" height="4" fill={WOOD} />
      <rect x="61.9" y="89" width="3.6" height="4" fill={WOOD} />
    </>
  )
}

/** ざらざらの 石(みがく まえ)。かげ・くぼみ・ひび を つける */
function RoughRock() {
  return (
    <>
      <path d={ROCK_PATH} fill={ROCK} />
      <path d="M37 18 Q46 26 44 42 L45 78 Q45 92 34 92 H31 Q41 80 40 56 Q40 30 33 17 Z" fill={ROCK_DARK} />
      <path d="M14 20 Q22 16 30 17 Q20 20 13 28 Z" fill={ROCK_LIGHT} />
      <ellipse cx="17" cy="44" rx="3.2" ry="2.2" fill={ROCK_DARK} opacity="0.7" />
      <ellipse cx="33" cy="62" rx="2.6" ry="1.8" fill={ROCK_DARK} opacity="0.7" />
      <ellipse cx="22" cy="76" rx="3.4" ry="2" fill={ROCK_DARK} opacity="0.7" />
      <ellipse cx="30" cy="33" rx="2" ry="1.4" fill={ROCK_DARK} opacity="0.7" />
      <path d="M20 58 l3 -3 l1.4 3.4 M28 82 l2 -3.6" fill="none" stroke={ROCK_DARK} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )
}

/** みがかれて つやつやの 玉。boundary より 下が みがけた ところ */
function PolishedRock({ boundary }: { readonly boundary: number }) {
  if (boundary >= ROCK_BOTTOM) return null
  return (
    <>
      <clipPath id="k7406-polished">
        <rect x="0" y={boundary} width="52" height="110" />
      </clipPath>
      <clipPath id="k7406-rock">
        <path d={ROCK_PATH} />
      </clipPath>
      <g clipPath="url(#k7406-polished)">
        <g clipPath="url(#k7406-rock)">
          <rect x="0" y="0" width="52" height="100" fill={JADE} />
          <rect x="34" y="0" width="12" height="100" fill={JADE_DARK} />
          <rect x="11" y="0" width="5" height="100" fill={JADE_LIGHT} opacity="0.85" />
          {/* ぬのが とおった あとの ひかる おび */}
          <rect x="0" y={boundary} width="52" height="2.6" fill="#ffffff" opacity="0.75" />
        </g>
      </g>
    </>
  )
}

/** みがくと うかぶ すじ(1・3・4画目の よこ と 2画目の たて)。みがき線(boundary)が とおると のびる */
function Veins({ boundary }: { readonly boundary: number }) {
  const grow = (y: number) => clamp01((y + 4 - boundary) / 9)
  const bars: readonly (readonly [n: number, y: number])[] = [[4, 82], [3, 50], [1, 28]]
  const standing = clamp01((82 - boundary) / 54)
  return (
    <>
      {bars.map(([n, y]) => (
        <g key={n}>
          <Bone char={CHAR} n={n} color={JADE_DARK} width={4.6} to={grow(y)} />
          <Bone char={CHAR} n={n} color={VEIN} width={2.6} to={grow(y)} />
        </g>
      ))}
      <Bone char={CHAR} n={2} color={JADE_DARK} width={4.6} from={1 - standing} />
      <Bone char={CHAR} n={2} color={VEIN} width={2.6} from={1 - standing} />
    </>
  )
}

/** みがけた ところで きらっと ひかる ほし */
function Glints({ t, boundary }: SceneProps & { readonly boundary: number }) {
  const spots: readonly (readonly [number, number, number])[] = [
    [16, 38, 0],
    [35, 62, 0.4],
    [23, 86, 0.2],
    [34, 30, 0.7],
  ]
  return (
    <>
      {spots.map(([x, y, phase]) => {
        if (boundary > y - 6) return null
        const size = 1.6 + 1.6 * Math.abs(wave(t, 0.9, phase))
        return <Star key={`${x}-${y}`} cx={x} cy={y} r={size} color="#ffffff" spin={t * 40} />
      })}
    </>
  )
}

/** 小鳥の うたう 音ぷ(石の 上で) */
function Note({ t }: SceneProps) {
  const note = during(t, 3.0, POLISHED, 0.25) * (t >= 2.6 ? 1 : 0)
  if (note <= 0) return null
  const x = 35.2 - wave(t, 1.2) * 1.2
  const y = 9 - ((t * 5) % 5)
  return (
    <g opacity={note} fill="#f07f9e">
      <path d={`M${x + 0.8} ${y} v-4.4 l2.6 -0.8 v4.2`} fill="none" stroke="#f07f9e" strokeWidth="0.8" />
      <ellipse cx={x} cy={y} rx="1.1" ry="0.8" />
    </g>
  )
}

/** 小鳥。石の上に とんできて とまり、ちゅんちゅん うたう */
function Sparrow({ t }: SceneProps) {
  const arrive = span(t, 1.7, 2.6, easeOut)
  if (arrive <= 0) return null
  const x = 28 + (arrive - 1) * 36
  const y = 11.6 + (arrive - 1) * 11.6 - Math.sin(arrive * Math.PI) * 6
  const landed = arrive >= 1
  const hop = landed ? Math.abs(wave(t, 0.7)) * 0.9 : 0
  return <Bird x={x} y={y - hop} t={t} flying={!landed} facing={landed ? 'left' : 'right'} />
}

/** 手に もった ぬの(こぶしの 石がわ に はみ出す) */
function Cloth({ at }: { readonly at: Point }) {
  return (
    <g transform={`translate(${at[0] - 2.6} ${at[1]})`}>
      <rect x="-3.4" y="-4.4" width="6.8" height="8.8" rx="2.2" fill={CLOTH} />
      <path d="M-1.6 -2.4 v4.8" stroke={CLOTH_SHADE} strokeWidth="1" strokeLinecap="round" />
    </g>
  )
}

/** 子どもの 場所・あるき・ふみ台への ジャンプ・手。手は 石の 上の 点(みがく)→ ばんざい */
function kidAt(t: number, boundary: number): PersonProps {
  const w = walk(t, { from: KID_STAND_X + 59.5, to: KID_STAND_X + 23.5, start: WALK, end: HOP - 0.05, build: 'child', height: KID_HEIGHT })
  const hopP = span(t, HOP, STAND)
  const jump = Math.sin(hopP * Math.PI)
  const x = t < HOP ? w.x : mix(t, HOP, STAND, KID_STAND_X + 23.5, KID_STAND_X, easeInOut)
  const y = GROUND_Y - STOOL_LIFT * span(t, HOP, STAND, easeInOut)
  const rubbing = t >= RUB && t < POLISHED
  const cheer = span(t, POLISHED, POLISHED + 0.4, backOut)
  // 下から 上へ みがく。手は うでの とどく はん囲で、みがき線を おう
  const rubCenter = Math.min(Math.max(boundary, RUB_TOP), RUB_BOTTOM)
  const wiggle = wave(t, 0.56)
  const place = span(t, STAND, RUB, easeInOut)
  const rubNear: Limb = { to: [ROCK_FACE_X + 0.5 * wiggle, rubCenter + 4.5 * wiggle] }
  const rubFar: Limb = { to: [ROCK_FACE_X + 1, rubCenter + 9 + 2 * wave(t, 0.56, 0.2)] }
  const hangNear = t < HOP ? (w.pose.rightArm ?? HANG_ARM) : HANG_ARM
  const hangFar = t < HOP ? (w.pose.leftArm ?? HANG_ARM) : HANG_ARM
  const reachOut: Limb = { swing: 40 * jump, bend: 20 * jump }
  const near = mixLimb(mixLimb(hangNear, reachOut, jump), rubNear, place)
  const far = mixLimb(mixLimb(hangFar, reachOut, jump), rubFar, place)
  const banzai: Limb = { swing: 125 + wave(t, 0.5) * 4, bend: 28 }
  const face = t < STAND - 0.3 ? 'normal' : t < RUB ? 'worried' : t < SURPRISE ? 'strain' : t < HAPPY ? 'surprised' : t < POLISHED ? 'smile' : 'joy'
  const head = t < STAND - 0.3 ? 0 : t < RUB ? 9 : t < SURPRISE ? -3 : t < POLISHED ? 2 : 5 - wave(t, 0.9) * 2
  const joyHop = t >= POLISHED ? Math.abs(wave(t - POLISHED, 0.9)) * 1.6 * span(t, POLISHED + 0.3, POLISHED + 0.5) : 0
  return {
    ...w,
    x,
    y,
    facing: 'left',
    build: 'child',
    height: KID_HEIGHT,
    look: KID_LOOK,
    face,
    lift: jump * 6 + joyHop,
    opacity: span(t, WALK, WALK + 0.1),
    pose: {
      ...(t < HOP ? w.pose : {}),
      leftArm: t >= POLISHED ? mixLimb(far, banzai, cheer) : far,
      rightArm: t >= POLISHED ? mixLimb(near, banzai, cheer) : near,
      torso: rubbing ? 20 : 0,
      head,
    },
  }
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 11)
  // 下から 上へ みがく線。これより 下が つやつやの 玉
  const boundary = mix(t, RUB, POLISHED, ROCK_BOTTOM, ROCK_TOP, easeInOut)
  const kid = kidAt(t, boundary)
  const rig = personRig(kid)
  const headR = rig.body.headR * rig.scale
  const [hx, hy] = rig.world.head
  const cloth = t >= STAND && t < POLISHED
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[8, 8]} clouds={[]} tufts={[4, 36, 78, 104]} ground={95} />
        <Layer opacity={span(t, 0.1, 0.5)}>
          <House />
        </Layer>
        <Layer scaleY={span(t, 0.2, 0.8, backOut)} origin={[26, 92]} opacity={span(t, 0.2, 0.4)}>
          <ellipse cx="26" cy="92.4" rx="22" ry="2.8" fill="#000000" opacity="0.1" />
          <RoughRock />
          <PolishedRock boundary={boundary} />
          <Veins boundary={boundary} />
          <Glints t={t} boundary={boundary} />
        </Layer>
        <Layer opacity={span(t, 0.3, 0.6)}>
          <Stool />
        </Layer>
        <Person {...kid} held={cloth ? <Cloth at={rig.world.arms.right.end} /> : undefined} />
        <Sweat t={t} x={hx + headR} y={hy - headR * 0.6} show={during(t, RUB + 0.1, SURPRISE + 0.1, 0.2)} dir={1} />
        <Question x={hx - 2} y={hy - headR * 1.9} show={during(t, STAND, RUB, 0.2)} t={t} />
        <Sparrow t={t} />
        <Note t={t} />
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
    { at: 0, label: '木の いえと、ざらざらの 石', sound: 'pop' },
    { at: WALK, label: '子どもが あるいてきて、ふみ台に のる' },
    { at: STAND, label: '「なんだろう?」と 石を 見る', sound: 'pop' },
    { at: RUB, label: 'ぬので ごしごし みがく' },
    { at: SURPRISE, label: '下から つやつやの 玉に なり、すじが うかぶ', sound: 'pop' },
    { at: POLISHED, label: 'ぜんぶ みがけて「やったー!」' },
    { at: INK, label: 'すじ(ほね)が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '理 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
