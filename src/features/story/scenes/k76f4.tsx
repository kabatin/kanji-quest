/*
 * 直(なおす): 目で まっすぐ 見て、ななめに なった たなを まっすぐに 直す。(共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … てっぺんに たてた 十字の かざり の よこぼう
 *   2画目(丨)  … 十字の かざり の たてぼう(たなの 上に さしてある)
 *   3画目(丨)  … たなの 左の かべ
 *   4画目(𠃍)  … たなの 天ばん と 右の かべ(子が おして 直す ところ)
 *   5・6・7画目 … たなの 3まいの いた(本・はち・つみき が のっている)
 *   8画目(L)   … ゆかに おいてある L字の さしがね(まっすぐ を はかる どうぐ)
 *
 * ながれ
 *   さしがねが ゆかに おいてあり、たなが ぽん と できる。たなは ななめに かたむいている
 *   → 子が あるいてきて、たなを じーっと 見る。「あれ?」と 首を かしげる(目で 見くらべる)
 *   → 「そうだ!」と ひらめいて、右がわを ぐいっと おす → たなが まっすぐに もどる
 *   → 子は よろこんで ぴょん。さしがねと たなが 「直」の形に そろって、字になる
 *
 * たなは「ななめ」を、ゆかに あしが ついたまま 上のほうが よこへ ずれる(本ものの がたついた たな)で見せる。
 * 子は Person(左むき)。あるきは walk()、うでは「たらす → あごに 手 → たなを おす → ばんざい」。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { HANG_ARM, LOOKS, mixLimb, PALETTE, Person, personRig, Question, Room, Sun, walk, type Expression } from '../sceneFigures'

const CHAR = '直'

const STEEL = '#b4c0cf'
const STEEL_LIGHT = '#e6edf5'
const STEEL_MARK = '#7d8ca0'
const WOOD = '#c98a4e'
const WOOD_DARK = '#a86d38'
const WOOD_LIGHT = '#e2a868'
const BACK = '#f6e3c3'
const RIBBON = '#e8534a'
const FRAME = '#a77b52'

/** くぎり の時間(秒) */
const WALK_IN = 1.0
const ARRIVE = 2.4
const THINK = 3.0
const IDEA = 4.2
const PUSH = 4.6
const STRAIGHT = 5.5
const INK = 6.5
const DONE = 9.2
const DURATION = 10

/** たなの かたむき(上へ いくほど よこへ ずれる 割合)。0.2 = 11度ほど */
const LEAN = 0.2
/** ゆかの 高さ(たなの あしの 先)。たなは ここで ゆかに ついている */
const FLOOR_Y = 92
/** 十字の かざり の さし口(たなの 天ばんの 上) */
const PEG: readonly [number, number] = [56, 38]
/** 子の 足もと(てまえ なので、さしがね より 下)と 背の高さ、あるいてくる はじまり と たなの そば */
const GROUND = 99.5
const KID_HEIGHT = 52
const KID_FROM = 154
const KID_STAND = 98
/** おしている 手の 高さ と、たなの 右がわ に そえる 位置(たなが 0.2 かたむいた とき) */
const PUSH_Y = 62
const EDGE_X = 78.6

const KID_LOOK = { ...LOOKS.boy, top: '#f2a03d' } as const

type Pt = readonly [number, number]

/* ───────── へや・さしがね ───────── */

/** まど(Room の まど の 中)で ゆっくり まわる お日さま。十字の さん は その うえ に もういちど 描く */
function WindowSun({ t, fade }: { readonly t: number; readonly fade: number }) {
  return (
    <Layer opacity={fade}>
      <Sun t={t} x={11} y={11} r={2.8} />
      <rect x="10.6" y="4.6" width="0.8" height="14.8" fill={FRAME} />
      <rect x="3.6" y="10.6" width="14.8" height="0.8" fill={FRAME} />
    </Layer>
  )
}

/** さしがね(8画目)の 下のうでの 中心の 高さ(画の線の すじ から) */
function squareY(x: number): number {
  const pts: ReadonlyArray<Pt> = [[26.4, 94.8], [43.4, 93], [60.3, 91.9], [77.4, 91.3], [94.2, 92.5]]
  const i = pts.findIndex((p) => x <= p[0])
  if (i <= 0) return pts[0][1]
  const [x0, y0] = pts[i - 1]
  const [x1, y1] = pts[i]
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
}

/** さしがね: ゆかに おいた L字の ものさし。たなが 「まっすぐ」かを くらべる もと */
function Square({ t }: SceneProps) {
  const grow = span(t, 0.1, 0.9, easeOut)
  if (grow <= 0) return null
  const ticks = [30, 37, 44, 51, 58, 65, 72, 79, 86]
  return (
    <>
      <Bone char={CHAR} n={8} color={STEEL} width={4.6} to={grow} />
      <Bone char={CHAR} n={8} color={STEEL_LIGHT} width={1.2} to={grow} />
      {grow >= 1 ? (
        <g stroke={STEEL_MARK} strokeWidth="0.55" strokeLinecap="round">
          {ticks.map((x) => (
            <path key={x} d={`M${x} ${squareY(x) - 0.6} v1.8`} />
          ))}
          {[58, 64, 70, 76, 82].map((y) => (
            <path key={y} d={`M19.2 ${y} h1.8`} />
          ))}
        </g>
      ) : null}
    </>
  )
}

/* ───────── たな ───────── */

/** たな(3〜7画目)。あしは ゆかに ついたまま、上が よこへ ずれる */
function Shelf({ lean, rise }: { readonly lean: number; readonly rise: number }) {
  // x' = x + lean * (FLOOR_Y - y): ゆか(FLOOR_Y)の高さは うごかず、上ほど よこへ ずれる
  const skew = `matrix(1 0 ${-lean} 1 ${lean * FLOOR_Y} 0)`
  return (
    <Layer scaleY={rise} scaleX={0.7 + 0.3 * rise} origin={[56, FLOOR_Y + 2]}>
      <g transform={skew}>
        <rect x="38" y="40" width="36.6" height="40" fill={BACK} />
        <rect x="38" y="40" width="36.6" height="11" fill="#efd8b0" />
        {/* 上の だん: 本 */}
        <rect x="44" y="45.4" width="14" height="4.2" rx="0.8" fill="#4f9be0" />
        <rect x="46" y="41.6" width="12" height="3.8" rx="0.8" fill="#e8534a" />
        {/* まんなかの だん: はちうえ */}
        <path d="M49 58.6 h8 l-1 4.2 h-6 Z" fill="#d9764a" />
        <path d="M53 58.6 v-3.6" stroke={PALETTE.leafDark} strokeWidth="1" strokeLinecap="round" />
        <ellipse cx="50.6" cy="55.4" rx="2.8" ry="1.4" fill={PALETTE.leaf} transform="rotate(-25 50.6 55.4)" />
        <ellipse cx="55.6" cy="54.6" rx="2.8" ry="1.4" fill={PALETTE.leafDark} transform="rotate(25 55.6 54.6)" />
        {/* 下の だん: ボール と つみき */}
        <circle cx="48" cy="72.4" r="5" fill="#e8534a" />
        <path d="M44.6 70.4 Q48 68.6 51.4 70.4" fill="none" stroke="#f5958d" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="62" y="70" width="8" height="8" rx="1" fill={PALETTE.leaf} />
        {/* あし */}
        <rect x="36.5" y="80" width="3.6" height="12" fill={WOOD_DARK} />
        <rect x="72.7" y="80" width="3.6" height="12" fill={WOOD_DARK} />
        {[3, 4, 5, 6, 7].map((n) => (
          <g key={n}>
            <g transform="translate(0 0.9)">
              <Bone char={CHAR} n={n} color={WOOD_DARK} width={n <= 4 ? 4.4 : 3.4} />
            </g>
            <Bone char={CHAR} n={n} color={WOOD} width={n <= 4 ? 4.4 : 3.4} />
          </g>
        ))}
      </g>
    </Layer>
  )
}

/** 十字の かざり(1・2画目)。たなの 上に さしてあるので、たなと いっしょに かたむく */
function Cross({ lean, rise }: { readonly lean: number; readonly rise: number }) {
  const angle = (Math.atan(lean) * 180) / Math.PI
  const shift = lean * (FLOOR_Y - PEG[1])
  return (
    <Layer x={shift} y={(1 - rise) * 50} opacity={Math.min(1, rise * 3)}>
      <Layer rotate={angle} origin={PEG}>
        <Bone char={CHAR} n={2} color={WOOD_LIGHT} width={3.6} />
        <Bone char={CHAR} n={1} color={WOOD_LIGHT} width={3.4} />
        {/* まんなかに むすんだ リボン */}
        <path d="M55.8 26.4 l-4 -2.2 v4.4 Z M55.8 26.4 l4 -2.2 v4.4 Z" fill={RIBBON} />
        <circle cx="55.8" cy="26.4" r="1.5" fill="#c9433b" />
      </Layer>
    </Layer>
  )
}

/* ───────── にぎやかし ───────── */

/** 「そうだ!」の しるし */
function Bang({ t, x, y }: { readonly t: number; readonly x: number; readonly y: number }) {
  const show = during(t, IDEA, PUSH + 0.15, 0.15)
  if (show <= 0) return null
  const pop = span(t, IDEA, IDEA + 0.3, backOut)
  return (
    <Layer x={x} y={y} scale={Math.max(0, pop)} opacity={show}>
      <path d="M0 -6 V0.6" stroke="#f0a020" strokeWidth="2" strokeLinecap="round" />
      <circle cx="0" cy="4.2" r="1.1" fill="#f0a020" />
    </Layer>
  )
}

/** 目で 見くらべる ときの 3本の 線(目の まえ)。x, y は あたまの まんなか */
function Gaze({ t, x, y }: { readonly t: number; readonly x: number; readonly y: number }) {
  const show = during(t, ARRIVE + 0.2, IDEA - 0.2, 0.3) * (0.6 + 0.4 * Math.abs(wave(t, 0.9)))
  if (show <= 0) return null
  return (
    <g opacity={show} stroke="#9a7a55" strokeWidth="0.9" strokeLinecap="round" transform={`translate(${x - 11} ${y})`}>
      <path d="M2.4 -1.6 l-3 -1.4 M2 1 l-3.6 0 M2.4 3.6 l-3 1.4" />
    </g>
  )
}

/** おすときの ほこり(たなの あしもとから ふわっと) */
function Dust({ t }: SceneProps) {
  const p = span(t, PUSH + 0.1, STRAIGHT + 0.3)
  if (p <= 0 || p >= 1) return null
  return (
    <>
      {[0, 1].map((i) => (
        <circle key={i} cx={80 + i * 5 + p * 6} cy={93.4 - p * 3 - i * 1.4} r={1.6 + p * 2.4} fill="#ffffff" opacity={(1 - p) * 0.8} />
      ))}
    </>
  )
}

/** まっすぐに なった しゅんかん の きらっ */
function Gleam({ t }: SceneProps) {
  const show = during(t, STRAIGHT - 0.1, STRAIGHT + 0.6, 0.15)
  if (show <= 0) return null
  const spin = (t - STRAIGHT) * 200
  return (
    <g opacity={show}>
      <Star cx={85} cy={36} r={3.2} color="#ffd95a" spin={spin} />
      <Star cx={28} cy={46} r={2.4} color="#ffffff" spin={-spin} />
    </g>
  )
}

/* ───────── 場面 ───────── */

function faceAt(t: number): Expression {
  if (t < ARRIVE) return 'smile'
  if (t < IDEA) return 'worried'
  if (t < PUSH) return 'surprised'
  return t < STRAIGHT ? 'strain' : 'joy'
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)

  // たな: ぽん と できて ななめ → ぐいっと おされて まっすぐ(すこし ゆれもどる)
  const rise = span(t, 0.5, 1.2, backOut)
  const creak = during(t, 1.4, PUSH - 0.1, 0.4) * 0.012 * wave(t, 0.8)
  const push = span(t, PUSH, STRAIGHT, backOut)
  const settle = t > STRAIGHT && t < INK - 0.3 ? 0.012 * Math.exp(-(t - STRAIGHT) * 5) * Math.sin((t - STRAIGHT) * 16) : 0
  const lean = LEAN * (1 - push) + creak + settle

  // 子: あるいてくる → たちどまる → おしながら たなの 右がわに ついていく(どちらも walk)
  const comeIn = walk(t, { from: KID_FROM, to: KID_STAND, start: WALK_IN, end: ARRIVE, height: KID_HEIGHT })
  const follow = walk(t, { from: KID_STAND, to: KID_STAND - 30 * LEAN, start: PUSH, end: STRAIGHT, height: KID_HEIGHT })
  const step = t < PUSH ? comeIn : follow
  const rig = personRig({ ...step, y: GROUND })
  const head = rig.world.head
  const headR = rig.body.headR * rig.scale

  // うで(左むき: てまえ = 右うで、むこう = 左うで)
  const chin: Pt = [head[0] - 0.8 * headR, head[1] + 0.9 * headR]
  const edge: Pt = [EDGE_X + 30 * lean, PUSH_Y]
  const hangNear = step.pose.rightArm ?? HANG_ARM
  const hangFar = step.pose.leftArm ?? HANG_ARM
  let near = mixLimb(hangNear, { to: chin }, span(t, ARRIVE + 0.1, THINK, easeInOut))
  near = mixLimb(near, { to: edge }, span(t, IDEA + 0.2, PUSH, easeInOut))
  near = mixLimb(near, { swing: 112, bend: 45 }, span(t, STRAIGHT + 0.1, STRAIGHT + 0.6, backOut))
  const far = mixLimb(hangFar, { swing: 135, bend: 30 }, span(t, STRAIGHT + 0.15, STRAIGHT + 0.65, backOut))

  // くびを かしげて、ななめを 見くらべる
  const tilt = during(t, ARRIVE + 0.2, IDEA - 0.1, 0.3) * 8 * wave(t - ARRIVE, 1.8) + (t >= PUSH && t < STRAIGHT ? -4 : 0)
  const hop = t > STRAIGHT + 0.3 && t < INK ? Math.abs(Math.sin((t - STRAIGHT - 0.3) * Math.PI * 1.6)) * 3.2 : 0
  const markX = head[0] - 0.9 * headR
  const markY = head[1] - 2.2 * headR

  return (
    <>
      <Layer opacity={ink.picture}>
        <Layer opacity={span(t, 0, 0.5, easeOut)}>
          <Room floor={95} window={[3.6, 4.6, 14.8, 14.8]} />
        </Layer>
        <WindowSun t={t} fade={span(t, 0, 0.5, easeOut)} />
        <Square t={t} />
        <ellipse cx="56" cy="95.6" rx={20 * Math.min(1, rise)} ry="2" fill="#000000" opacity="0.1" />
        <Shelf lean={lean} rise={rise} />
        <Cross lean={lean} rise={rise} />
        <Dust t={t} />
        <Person {...step} y={GROUND} look={KID_LOOK} face={faceAt(t)} lift={hop} pose={{ ...step.pose, rightArm: near, leftArm: far, head: tilt }} />
        <Gaze t={t} x={head[0]} y={head[1]} />
        <Question x={markX} y={markY} show={during(t, ARRIVE + 0.1, IDEA - 0.1, 0.3)} t={t} size={9} />
        <Bang t={t} x={markX} y={markY + 1} />
        <Gleam t={t} />
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
    { at: 0, label: 'さしがねが ゆかに あり、たなが できる', sound: 'pop' },
    { at: WALK_IN, label: '子が あるいてくる' },
    { at: ARRIVE, label: 'たなが ななめ。「あれ?」と 見くらべる', sound: 'pop' },
    { at: IDEA, label: '「そうだ!」ぐいっと おして まっすぐに 直す' },
    { at: STRAIGHT, label: 'まっすぐ になって 子が よろこぶ', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '直 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
