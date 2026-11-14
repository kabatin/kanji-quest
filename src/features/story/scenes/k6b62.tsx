/*
 * 止(とまる): あしあと を のこして あるいてきた 子が、ふみきり の前で ぴたっと とまる。
 * (共通部品 sceneFigures で 書きなおした もの)
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … ふみきり の ささえの はしら(てっぺんに 赤い ランプ)
 *   2画目(一)  … はしら から よこに おりた しゃだんき の ぼう
 *   3画目(丨)  … とまった 子の どう と あし(まっすぐ 立っている)
 *   4画目(一)  … 子が あるいてきた 道の ふち(じめん)
 *
 * ながれ
 *   子が ふんふん♪ と あしあと を つけながら あるいてくる
 *   → ふみきり の ランプが カンカン と ひかり、しゃだんき が おりてくる
 *   → 子は「あっ!」と おどろいて、手を まえへ。ぴたっと とまる(あしを そろえて)
 *   → とおくを でんしゃが はしっていく。子は じっと まつ
 *   → でんしゃが いったあと「ちゃんと とまれた」と にっこり
 *   → ほね が ひかって、絵が うすくなり、字「止」が のこる
 *
 * 子は Person。あるきは walk()、あしあとは walkPrints() と Footprint。
 * ふみきり(はしら・ランプ・ぼう)・でんしゃ は 部品が ないので ここで 描く。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Dust, Footprint, HANG_ARM, LOOKS, mixLimb, Notice, PALETTE, Person, personRig, walk, walkPrints, type WalkPlan } from '../sceneFigures'

const CHAR = '止'

const ROAD = '#ecd9b0'
const ROAD_EDGE = '#cfae80'
const POLE = '#f4f4f8'
const RED = '#e8534a'
const RED_DARK = '#8a3b3b'
const METAL = '#8d8d99'
const TRAIN = '#4f9be0'
const TRAIN_DARK = '#3c82c4'
const WINDOW = '#fff1b8'

/** くぎり の時間(秒) */
const WALK_START = 0.3
const WALK_END = 3.0
const ALARM = 2.1
const SURPRISE = 2.25
const WAIT = 3.7
const TRAIN_FROM = 4.2
const TRAIN_TO = 6.6
const PROUD = 6.3
const INK = 7.1
const DONE = 10.0
const DURATION = 10.5

/** 子の 立つ 場所(3画目の たて線 x=33.4 に どう と あし が のる)と、足もと の 高さ */
const CHILD_X = 33.4
const FLOOR = 90
const CHILD_HEIGHT = 62
const START_X = 3.4
/** しゃだんき の ささえ(2画目の 書きはじめ) と、おりた ときの かたむき */
const PIVOT: readonly [number, number] = [55.8, 49.8]
const BAR_LEN = 29
const BAR_REST = (Math.atan2(47 - 49.8, 84.4 - 55.8) * 180) / Math.PI
const BAR_UP = -62

const WALK_PLAN: WalkPlan = { from: START_X, to: CHILD_X, start: WALK_START, end: WALK_END, build: 'child', height: CHILD_HEIGHT, step: 9, armSwing: 26 }
/** おどろいて、手を むねの まえへ(ストップ。うで が ふみきり の はしら に かぶらない よう ひじ を まげる) */
const STOP_ARM = { swing: 25, bend: 85 }

/** みち・せん路。とおくの せん路 は ささえの はしら から はなれた 向こう がわ */
function Ground() {
  return (
    <>
      <rect x="-4" y="73" width="117" height="15" fill={PALETTE.grass} />
      <path d="M-4 74.5 H113" stroke={METAL} strokeWidth="1.2" />
      {Array.from({ length: 24 }, (_, i) => (
        <rect key={i} x={-3 + i * 5} y="74.8" width="1.8" height="2.4" rx="0.5" fill="#a98963" />
      ))}
    </>
  )
}

function Road() {
  return (
    <>
      <rect x="-4" y="85" width="117" height="14" fill={ROAD} />
      <Bone char={CHAR} n={4} color={ROAD_EDGE} width={3.2} />
    </>
  )
}

/** ふみきり: はしら(1画目)と、おりてくる ぼう(2画目)。ランプは カンカン と こうごに ひかる。 */
function Crossing({ t }: SceneProps) {
  const lower = span(t, ALARM + 0.2, ALARM + 1.2, easeInOut)
  const bar = BAR_UP + (BAR_REST - BAR_UP) * lower
  const alarm = t >= ALARM && t < DONE
  const leftOn = alarm && wave(t, 0.5) > 0
  const rightOn = alarm && !leftOn
  return (
    <>
      <rect x="49.6" y="83" width="12" height="5.4" rx="1.6" fill={METAL} />
      <Bone char={CHAR} n={1} color={POLE} width={4.6} />
      {[58, 70].map((y) => (
        <rect key={y} x="53.3" y={y} width="4.6" height="4.4" fill={RED} />
      ))}
      <rect x="45.4" y="16.6" width="20.2" height="3.6" rx="1.8" fill="#dedee6" />
      <circle cx="49.6" cy="24" r="3.6" fill={leftOn ? '#ff4a3d' : RED_DARK} />
      <circle cx="61.4" cy="24" r="3.6" fill={rightOn ? '#ff4a3d' : RED_DARK} />
      {leftOn && <circle cx="49.6" cy="24" r="6" fill="#ff4a3d" opacity="0.28" />}
      {rightOn && <circle cx="61.4" cy="24" r="6" fill="#ff4a3d" opacity="0.28" />}
      <Layer rotate={bar} origin={PIVOT}>
        <rect x={PIVOT[0]} y={PIVOT[1] - 1.7} width={BAR_LEN} height="3.4" rx="1.7" fill={POLE} />
        {[4, 11, 18, 25].map((dx) => (
          <rect key={dx} x={PIVOT[0] + dx - 1.4} y={PIVOT[1] - 1.7} width="3.6" height="3.4" fill={RED} />
        ))}
        <circle cx={PIVOT[0] + BAR_LEN - 0.6} cy={PIVOT[1]} r="2.1" fill={RED} />
      </Layer>
      <circle cx={PIVOT[0]} cy={PIVOT[1]} r="2.6" fill={METAL} />
    </>
  )
}

/** とおくを とおる でんしゃ: 右から 左へ。ささえの はしら の うしろ。 */
function Train({ t }: SceneProps) {
  const head = mix(t, TRAIN_FROM, TRAIN_TO, 122, -78, (x) => x)
  if (t < TRAIN_FROM || t > TRAIN_TO) return null
  const sway = wave(t, 0.14) * 0.3
  return (
    <g transform={`translate(0 ${sway})`}>
      {[0, 1, 2].map((i) => {
        const x = head + i * 24
        return (
          <g key={i}>
            <rect x={x} y="60" width="22.4" height="13" rx="3" fill={i === 0 ? TRAIN_DARK : TRAIN} />
            {[3, 9, 15].map((dx) => (
              <rect key={dx} x={x + dx} y="63" width="4.4" height="4.4" rx="1" fill={WINDOW} />
            ))}
            <circle cx={x + 5.5} cy="73.4" r="1.7" fill="#3b3b46" />
            <circle cx={x + 16.9} cy="73.4" r="1.7" fill="#3b3b46" />
          </g>
        )
      })}
    </g>
  )
}

/** あるいている あいだの ふんふん♪(あたまの よこ) */
function Notes({ t, x, y }: { readonly t: number; readonly x: number; readonly y: number }) {
  const show = during(t, 0.5, ALARM + 0.1, 0.3)
  if (show <= 0) return null
  const bob = wave(t, 0.8) * 1.2
  return (
    <g opacity={show} fill="#f07f9e" transform={`translate(${x + 8} ${y - 6 + bob})`}>
      <path d="M1.2 0 v-5.4 l3.2 -1 v5" fill="none" stroke="#f07f9e" strokeWidth="0.9" />
      <ellipse cx="0" cy="0.4" rx="1.4" ry="1" />
      <ellipse cx="3.2" cy="-1" rx="1.4" ry="1" />
    </g>
  )
}

/** ちゃんと まてた ごほうびの きらり */
function Proud({ t }: SceneProps) {
  const show = during(t, PROUD, INK, 0.2)
  if (show <= 0) return null
  const p = Math.max(0, backOut(span(t, PROUD, PROUD + 0.35)))
  return (
    <g opacity={show} transform={`translate(24 28) scale(${p}) rotate(${wave(t, 1) * 8})`}>
      <path d="M0 -4 Q0.9 -0.9 4 0 Q0.9 0.9 0 4 Q-0.9 0.9 -4 0 Q-0.9 -0.9 0 -4 Z" fill="#ffc233" />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)
  const walking = walk(t, WALK_PLAN)

  // ぴたっ: ブレーキで 体が 少し うしろに のけぞって、もどる
  const lean = -Math.sin(span(t, WALK_END - 0.25, WALK_END + 0.55) * Math.PI) * 7
  const surprised = span(t, SURPRISE, SURPRISE + 0.25) * (1 - span(t, WAIT - 0.2, WAIT + 0.3))
  const nearArm = mixLimb(walking.pose.leftArm ?? HANG_ARM, STOP_ARM, surprised)
  const farArm = mixLimb(walking.pose.rightArm ?? HANG_ARM, STOP_ARM, surprised)
  const waiting = t >= WAIT && t < PROUD
  const face = t < SURPRISE ? 'smile' : t < WAIT ? 'surprised' : t < PROUD ? 'normal' : 'joy'
  const hop = Math.sin(span(t, PROUD, PROUD + 0.5) * Math.PI) * 2.6
  const kid = {
    ...walking,
    y: FLOOR,
    lean,
    lift: hop,
    look: LOOKS.boy,
    face,
    pose: { ...walking.pose, leftArm: nearArm, rightArm: farArm, head: waiting ? 2 + wave(t, 1.6) : 0 },
  } as const
  const head = personRig(kid).world.head
  const bumpFlip = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[13, 13]} clouds={[[78, 12, 0.9]]} tufts={[]} />
        <Ground />
        <Train t={t} />
        <Road />
        {walkPrints(WALK_PLAN).map((p) => (
          <Footprint key={p.at} x={p.x} y={FLOOR + 1.6} facing={p.facing} size={6} grow={span(t, p.at, p.at + 0.25)} color="#b08658" />
        ))}
        <Dust x={kid.x + 4} y={FLOOR + 1} p={span(t, WALK_END - 0.1, WALK_END + 0.6, easeOut)} reach={9} />
        <Person {...kid} />
        <Notes t={t} x={head[0]} y={head[1]} />
        <Notice x={head[0]} y={head[1]} r={9} show={during(t, SURPRISE, WAIT, 0.15)} dir={-1} />
        <Crossing t={t} />
        <Proud t={t} />
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Layer scale={1 + bumpFlip} origin={[54.5, 54.5]}>
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
    { at: 0, label: '子が あしあとを つけて あるいてくる', sound: 'pop' },
    { at: ALARM, label: 'ふみきりが カンカン なりだす' },
    { at: SURPRISE, label: 'あっ! と おどろいて ぴたっと とまる', sound: 'pop' },
    { at: TRAIN_FROM, label: 'でんしゃが とおる。じっと まつ' },
    { at: PROUD, label: 'ちゃんと とまれた と にっこり', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '止 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
