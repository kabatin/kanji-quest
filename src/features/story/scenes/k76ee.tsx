/*
 * 目(め): よこむきの 目を たてに した。
 *
 * ほね(画と絵の対応)
 *   1・2画目   … ごろんと ねころんだ 子の 目の ふち(まぶた)。よこむきの 目が、からだを たおして たてむきに なる
 *   3・4画目   … 目の なかの くろめ(いろの ついた ところ)の 上と下の ふち
 *   5画目      … 目の した の ふち
 *
 * ながれ
 *   子どもが ひとり、ひまそうに ふぁ〜 と 立っている(まぶたが おもい)
 *   → ちょうちょが とんできて、花に とまる。子は 「あっ!」と 目を まるくして、ゆびさす
 *   → もっと 近くで 見たくて、ごろんと ねころぶ。からだが たおれると、顔の 目も 90度 まわって たてむきに なる
 *   → ちょうちょを じーっと 見る目に ぐーっと 近づく
 *   → 目の ふちが 四角く そろい、ほね が ひかって、絵が うすくなり、字「目」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく どう の上。足は こし から。
 *   目は しろめ・くろめ・ひとみ から できていて、まぶたが 上から おりてくる。
 *   字の形になるのは、ねころんだ 顔の 目に ぐーっと 近づいた さいごの しゅんかん だけ
 *   (目の よこはば が 字の たて、目の たかさ が 字の よこ になる)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '目'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#4f9be0'
const TUNIC_DARK = '#3c82c4'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const IRIS = '#8a5a3a'
const PETAL = '#ff8fb1'
const WING = '#ffa53a'
const WING_DARK = '#e8812a'

/** くぎり の時間(秒) */
const NOTICE = 1.3
const LAND = 3.0
const LIE = 3.4
const ZOOM_FROM = 5.4
const ZOOM_TO = 7.0
const INK = 7.4
const DONE = 10.6
const DURATION = 11

/** 子どもの こし(たおれるときの じく)と、立っているときの 足もと */
const HIP: readonly [number, number] = [32, 74]
const FEET_Y = 93
/** ねころぶと、こし が 地面まで おりる 高さ */
const LIE_DROP = 16
/** ひだり目(画面で 近づく ほう)と、りょう目の まんなか */
const EYE_L: readonly [number, number] = [28, 45.5]
const EYE_R: readonly [number, number] = [36, 45.5]
const EYE_MID: readonly [number, number] = [32, 45.5]

/** 近づいたときの 大きさ。目の よこはば(5)が 字の たて(73)、目の たかさ が 字の よこ(49.5)に なる */
const ZOOM = 14.6
const EYE_W = 73 / ZOOM
const EYE_H = 49.5 / ZOOM
const IRIS_R = 0.74
/** 字の まんなか。ここに 目の まんなか が くる */
const FRAME_CENTER: readonly [number, number] = [54.75, 54.5]
/** さいごの くろめ の よる 位置: 3・4画目の まんなか(字の まんなか より 2.5 上) */
const FINAL_GAZE: readonly [number, number] = [-2.5 / ZOOM, 0]

const FLOWER_X = 88
const FLOWER_Y = 78
/** ちょうちょが とまる 場所(花の 上) */
const PERCH: readonly [number, number] = [FLOWER_X, FLOWER_Y - 7]

const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const clampTo = (v: number, limit: number) => Math.max(-limit, Math.min(limit, v))

/** 子どもの 体の ざひょう(立っているとき)を、たおれたあとの 画面の ざひょうに うつす */
function toScreen(p: readonly [number, number], angle: number, drop: number): readonly [number, number] {
  const rad = (angle * Math.PI) / 180
  const rx = p[0] - HIP[0]
  const ry = p[1] - HIP[1]
  return [HIP[0] + rx * Math.cos(rad) - ry * Math.sin(rad), HIP[1] + drop + rx * Math.sin(rad) + ry * Math.cos(rad)]
}

/** ちょうちょの 位置: 右上から ひらひら とんできて、花に とまる */
function butterflyAt(t: number): readonly [number, number] {
  const p = span(t, NOTICE, LAND, easeInOut)
  const calm = 1 - p
  return [lerp(116, PERCH[0], p) + Math.sin(p * 14) * 5 * calm, lerp(8, PERCH[1], p) + Math.sin(p * 9) * 6 * calm]
}

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="40" cy="14" rx="7" ry="3.2" />
        <ellipse cx="45" cy="12" rx="5" ry="3.2" />
      </g>
      <ellipse cx="54.5" cy="99" rx="54" ry="5.6" fill={GRASS} />
    </>
  )
}

/** 花: 子が ねころんで 見る、ちょうちょの とまる 花 */
function Flower({ t }: SceneProps) {
  const grow = span(t, 0.3, 0.9, backOut)
  const sway = wave(t, 2.8) * 1.2
  return (
    <Layer scale={grow} origin={[FLOWER_X, 98]}>
      <Layer rotate={sway} origin={[FLOWER_X, 98]}>
        <path d={`M${FLOWER_X} 98 L${FLOWER_X} ${FLOWER_Y}`} stroke={LEAF_DARK} strokeWidth="1.8" strokeLinecap="round" />
        <path d={`M${FLOWER_X} 92 q-6 -1 -8 -6 q6 0 8 6 Z`} fill={LEAF} />
        {[0, 72, 144, 216, 288].map((deg) => (
          <circle key={deg} cx={FLOWER_X + Math.sin((deg * Math.PI) / 180) * 3.4} cy={FLOWER_Y - Math.cos((deg * Math.PI) / 180) * 3.4} r="2.7" fill={PETAL} />
        ))}
        <circle cx={FLOWER_X} cy={FLOWER_Y} r="2.3" fill={SUN} />
      </Layer>
    </Layer>
  )
}

/** ちょうちょ: はねを とじたり ひらいたり。とんでいる間は はやく、とまると ゆっくり */
function Butterfly({ t }: SceneProps) {
  const appear = span(t, NOTICE - 0.1, NOTICE + 0.1)
  if (appear <= 0) return null
  const [x, y] = butterflyAt(t)
  const flying = t < LAND
  const open = flying ? 0.55 + 0.45 * Math.cos(t * 28) : 0.6 + 0.4 * Math.cos(t * 4.5)
  const tilt = flying ? Math.cos(span(t, NOTICE, LAND) * 14) * 14 * (1 - span(t, NOTICE, LAND)) : 0
  return (
    <Layer x={x} y={y} rotate={tilt}>
      <Layer scaleX={Math.max(0.15, open)}>
        <ellipse cx="-3.4" cy="-1.8" rx="3.4" ry="3.6" fill={WING} transform="rotate(-20 -3.4 -1.8)" />
        <ellipse cx="3.4" cy="-1.8" rx="3.4" ry="3.6" fill={WING} transform="rotate(20 3.4 -1.8)" />
        <ellipse cx="-2.5" cy="2" rx="2.3" ry="2.4" fill={WING_DARK} />
        <ellipse cx="2.5" cy="2" rx="2.3" ry="2.4" fill={WING_DARK} />
        <circle cx="-3.8" cy="-2.2" r="1" fill="#fff2b8" />
        <circle cx="3.8" cy="-2.2" r="1" fill="#fff2b8" />
      </Layer>
      <ellipse cx="0" cy="0" rx="0.8" ry="3.4" fill="#5a3b2a" />
      <path d="M-0.3 -3 Q-1.6 -5.4 -2.6 -5.2 M0.3 -3 Q1.6 -5.4 2.6 -5.2" fill="none" stroke="#5a3b2a" strokeWidth="0.4" strokeLinecap="round" />
    </Layer>
  )
}

type Mood = 'bored' | 'wow' | 'happy'

type EyeProps = {
  readonly at: readonly [number, number]
  readonly gaze: readonly [number, number]
  /** まぶたが おりている 度合い(0 = ぜんぶ ひらく) */
  readonly lid: number
  /** しろめの かどの まるさ。さいごに 四角く なる */
  readonly round: number
}

/** 目: ふち → しろめ → くろめ → ひとみ → まぶた(上から おりる) */
function Eye({ at, gaze, lid, round }: EyeProps) {
  const [cx, cy] = at
  const left = cx - EYE_W / 2
  const top = cy - EYE_H / 2
  // まぶたの ふちの ながさ(両はしが まるい しろめ の 弦の長さ)
  const lidY = top + EYE_H * lid
  const r = EYE_H / 2
  const half = EYE_W / 2 - r + Math.sqrt(Math.max(r * r - (lidY - cy) ** 2, 0))
  return (
    <>
      <rect x={left - 0.35} y={top - 0.35} width={EYE_W + 0.7} height={EYE_H + 0.7} rx={round + 0.35} fill={SKIN_SHADE} />
      <rect x={left} y={top} width={EYE_W} height={EYE_H} rx={round} fill="#ffffff" />
      <circle cx={cx + gaze[0]} cy={cy + gaze[1]} r={IRIS_R} fill={IRIS} />
      <circle cx={cx + gaze[0]} cy={cy + gaze[1]} r="0.38" fill="#2b2b2b" />
      <circle cx={cx + gaze[0] - 0.25} cy={cy + gaze[1] - 0.25} r="0.2" fill="#ffffff" />
      {lid > 0.02 && (
        <>
          <rect x={left - 0.5} y={top - 1.2} width={EYE_W + 1} height={1.2 + EYE_H * lid} fill={SKIN} />
          <path d={`M${cx - half} ${lidY} L${cx + half} ${lidY}`} stroke={HAIR} strokeWidth="0.26" strokeLinecap="round" />
        </>
      )}
    </>
  )
}

type ChildProps = {
  readonly mood: Mood
  readonly gaze: readonly [number, number]
  readonly lid: number
  readonly browY: number
  /** ゆびさす うで の あがり(0 = だらんと / 1 = ちょうちょを ゆびさす) */
  readonly raise: number
  readonly tilt: number
  /** ひだり目の かどの まるさ */
  readonly eyeRound: number
}

/** 子ども(立っている すがた)。ほんものの人の つくり: かた → ひじ → 手、こし → 足 */
function Child({ mood, gaze, lid, browY, raise, tilt, eyeRound }: ChildProps) {
  // みぎうで: かた から ひじ、ひじ から 手 へ つなぐ。ゆびさすと ひじ が まがって 上へ
  const elbow = [lerp(40.6, 46.5, raise), lerp(66, 60.5, raise)] as const
  const hand = [lerp(39.8, 51.8, raise), lerp(74, 54.2, raise)] as const
  return (
    <>
      {/* 足と くつ */}
      <rect x="25.2" y="72" width="6.2" height="20.5" rx="3.1" fill={PANTS_DARK} />
      <rect x="32.6" y="72" width="6.2" height="20.5" rx="3.1" fill={PANTS} />
      <ellipse cx="28.2" cy="93" rx="4.2" ry="2.4" fill={SHOE} />
      <ellipse cx="35.8" cy="93" rx="4.2" ry="2.4" fill={SHOE} />
      {/* どう と、みじかい くび */}
      <rect x="24" y="55.5" width="16" height="20" rx="6.5" fill={TUNIC} />
      <path d="M25.5 70.5 h13" stroke={TUNIC_DARK} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="29.4" y="52.5" width="5.2" height="5" rx="2" fill={SKIN_SHADE} />
      {/* ひだりうで: だらんと さがる */}
      <path d="M24.6 59 L22.9 66 L23.8 73" fill="none" stroke={TUNIC_DARK} strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="23.8" cy="73.6" r="2.6" fill={SKIN} />
      {/* みぎうで */}
      <path d={`M39.4 59 L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={TUNIC_DARK} strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1] + 0.2} r="2.6" fill={SKIN} />
      {/* あたま */}
      <Layer rotate={tilt} origin={[32, 54]}>
        <circle cx="21.7" cy="45.5" r="2" fill={SKIN_SHADE} />
        <circle cx="42.3" cy="45.5" r="2" fill={SKIN_SHADE} />
        <circle cx="32" cy="44" r="10.5" fill={SKIN} />
        <path d="M21.5 43.4 C20.4 32 28 30.4 33 31 C39 31.4 43.6 35 42.5 43.4 C40 38.5 36 36.4 32 36.6 C27.5 36.8 23.5 39 21.5 43.4 Z" fill={HAIR} />
        <path d="M33.5 31.2 Q34 28.6 35.8 29.8 Q36.8 27.8 37.8 30.2" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="24.6" cy="49.6" r="2" fill="#ff9d9d" opacity="0.5" />
        <circle cx="39.4" cy="49.6" r="2" fill="#ff9d9d" opacity="0.5" />
        <Eye at={EYE_L} gaze={gaze} lid={lid} round={eyeRound} />
        <Eye at={EYE_R} gaze={gaze} lid={lid} round={EYE_H / 2} />
        <path d={`M25.4 ${browY} L30.4 ${browY - 0.3} M33.6 ${browY - 0.3} L38.6 ${browY}`} stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
        {mood === 'bored' && <path d="M29.6 51.2 h4.8" stroke="#b9483f" strokeWidth="0.9" strokeLinecap="round" />}
        {mood === 'wow' && <ellipse cx="32" cy="51.4" rx="1.3" ry="1.7" fill="#b9483f" />}
        {mood === 'happy' && <path d="M28.8 50 Q32 54 35.2 50" fill="none" stroke="#b9483f" strokeWidth="1" strokeLinecap="round" />}
      </Layer>
    </>
  )
}

/** ひまで ためいき の「ふう」 */
function Sigh({ t }: SceneProps) {
  const show = during(t, 0.7, 1.5, 0.2)
  if (show <= 0) return null
  const p = span(t, 0.7, 1.5, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={42 + p * 7} cy={50 - p * 4} rx={2.4 + p * 2} ry={1.7 + p * 1.3} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <ellipse cx={40 + p * 3} cy={50.6 - p * 1.4} rx={1.2 + p * 0.8} ry={0.9 + p * 0.5} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
    </g>
  )
}

/** 手まえの ひとかたまりの 草。足もと と からだの すそ を かくす */
function FrontTufts() {
  return (
    <>
      {[6, 18, 40, 52, 70, 100].map((x) => (
        <path key={x} d={`M${x} 101 l1.2 -5.6 l1.2 4.2 l1.6 -6 l1 6.2 l1.8 -4 l0.6 5.2 Z`} fill={LEAF} />
      ))}
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)

  // たおれる: 立っている間は ゆらゆら → ちょうちょが とまると 花の ほうへ 少し のりだす → ごろん
  const lie = span(t, LIE, LIE + 1.1, easeInOut)
  const sway = wave(t, 2.4) * 0.9 * span(t, 0.9, 1.2) * (1 - span(t, 2.8, 3.0))
  const lean = 7 * span(t, 2.95, 3.35, easeOut) * (1 - lie)
  const angle = sway + lean + (90 - lean) * lie
  const drop = LIE_DROP * easeOut(lie)
  const pop = backOut(span(t, 0.2, 0.9))

  // 気持ち: ひま → 「あっ!」→ にこにこ
  const mood: Mood = t < NOTICE + 0.2 ? 'bored' : t < LAND ? 'wow' : 'happy'
  const lid = mix(t, NOTICE, NOTICE + 0.3, 0.5, 0, easeOut)
  const browY = t < LAND ? mix(t, NOTICE, NOTICE + 0.3, 42.6, 40.4, easeOut) : mix(t, LAND, LAND + 0.4, 40.4, 41.4)
  const raise = span(t, NOTICE + 0.4, NOTICE + 0.9, easeOut) * (1 - span(t, LAND + 0.2, LAND + 0.7))
  const tilt = mix(t, 0.3, 0.8, 0, -4) * (1 - span(t, NOTICE, NOTICE + 0.3))

  // 目の むき: ちょうちょを 目で おう(体の むきに あわせて、顔の ざひょうに なおす)
  const eyeScreen = toScreen(EYE_MID, angle, drop)
  const bf = butterflyAt(t)
  const vx = bf[0] - eyeScreen[0]
  const vy = bf[1] - eyeScreen[1]
  const rad = (angle * Math.PI) / 180
  const lx = vx * Math.cos(rad) + vy * Math.sin(rad)
  const ly = -vx * Math.sin(rad) + vy * Math.cos(rad)
  const dist = Math.max(Math.hypot(lx, ly), 1)
  const follow = span(t, NOTICE, NOTICE + 0.3)
  const tracked: readonly [number, number] = [clampTo((lx / dist) * 1.25, 1.25), clampTo((ly / dist) * 0.55, 0.55)]
  const gazeBase: readonly [number, number] = [lerp(0, tracked[0], follow), lerp(0.35, tracked[1], follow)]
  const settle = span(t, 5.6, 6.9, easeInOut)
  const gaze: readonly [number, number] = [lerp(gazeBase[0], FINAL_GAZE[0], settle), lerp(gazeBase[1], FINAL_GAZE[1], settle)]
  const eyeRound = mix(t, 6.3, 7.2, EYE_H / 2, 0.3, easeInOut)

  // 近づく: 目が まんなか へ うごきながら、ぐーっと 大きくなる
  const k = span(t, ZOOM_FROM, ZOOM_TO, easeInOut)
  const eyeEnd = toScreen(EYE_L, 90, LIE_DROP)
  const s = ZOOM ** k
  const c: readonly [number, number] = [lerp(54.5, FRAME_CENTER[0], k), lerp(54.5, FRAME_CENTER[1], k)]
  const e: readonly [number, number] = [lerp(eyeEnd[0], FRAME_CENTER[0], k), lerp(eyeEnd[1], FRAME_CENTER[1], k)]
  const anchor: readonly [number, number] = [eyeEnd[0] - (e[0] - c[0]) / s, eyeEnd[1] - (e[1] - c[1]) / s]
  const camera = `translate(${c[0]} ${c[1]}) scale(${s}) translate(${-anchor[0]} ${-anchor[1]})`

  return (
    <>
      <Layer opacity={ink.picture}>
        <g transform={camera}>
          <Ground t={t} />
          <Flower t={t} />
          <ellipse cx={32 + lie * 11} cy="97.4" rx={9 + lie * 22} ry="2.4" fill="#000000" opacity="0.12" />
          <Layer scale={pop} origin={[32, FEET_Y]}>
            <Layer y={drop} rotate={angle} origin={HIP}>
              <Child mood={mood} gaze={gaze} lid={lid} browY={browY} raise={raise} tilt={tilt} eyeRound={eyeRound} />
            </Layer>
          </Layer>
          <Sigh t={t} />
          <Butterfly t={t} />
          <FrontTufts />
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
    { at: 0, label: '子どもが ひとり、ひまそうに 立っている', sound: 'pop' },
    { at: NOTICE, label: 'ちょうちょが とんできて「あっ!」' },
    { at: LAND, label: '花に とまった。もっと 近くで 見たい', sound: 'pop' },
    { at: LIE, label: 'ごろんと ねころぶ。目が たてむきに なる' },
    { at: ZOOM_FROM, label: '目に ぐーっと 近づく' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '目 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
