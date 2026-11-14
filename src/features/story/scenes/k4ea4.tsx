/*
 * 交(まじわる): 女の子が ジャンプして、足を ばってんに くむ。足と足が まじわる。(共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)
 *   1画目(丨)   … あたまの 上の リボン から あたまの まんなか
 *   2画目(一)   … よこに ひろげた りょううで(バランスを とる)
 *   3・4画目    … ふわっと ひろがった スカートの 左と右の ふち
 *   5・6画目    … ばってんに くんだ 左右の 足
 *
 * ながれ
 *   草が はえて、女の子が ぽん と出てくる。たいくつ そうに ぼんやり 立っている
 *   → 小鳥が とんできて 枝に とまり、うたいだす。女の子は 顔を上げて びっくり
 *   → たのしくなって、足を ひらいて からだを ゆらす
 *   → 「よーし!」 ジャンプして、空中で 足を ばってんに くむ(うでは バランスを とるために よこへ ひろげる)
 *   → おっとっと と ぐらぐら → ぴたっ と きまって にっこり
 *   → ほね が ひかって、絵が うすくなり、字「交」が のこる
 *
 * 女の子は Person(正面)。足の ひらき・くむ は 左右の 足の 角度(swing)で 書く。
 * 足の ながさは いつも同じで、足を ひらく・くむ と こしが さがる(Person が 地面に 合わせる)。
 * 足が 字の 5・6画目ほど 大きく ひらかないぶんは、「だいたい 同じ 場所・向き」で 重ねる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, Bird, LOOKS, PALETTE, Person, type Expression, type PersonPose } from '../sceneFigures'

const CHAR = '交'

const BARK = PALETTE.bark
const LEAF = PALETTE.leaf
const LEAF_DARK = PALETTE.leafDark
const RIBBON = '#e8534a'
const NOTE = '#f07f9e'

/** くぎり の時間(秒) */
const POP = 0.3
const FLY = 1.0
const LAND = 1.9
/** うたが きこえて、顔を上げる */
const HEAR = 1.5
/** たのしくなって からだを ゆらす */
const SWAY = 2.5
/** 「よーし!」 */
const PREP = 3.7
const JUMP = 4.3
const LAND_J = 5.0
/** ぐらぐら が おさまって、ぴたっ と きまる */
const SETTLE = 5.8
const INK = 6.2
const DONE = 9.0
const DURATION = 9.6

const GROUND = 96
const CENTER = 53.5
const HEIGHT = 80
/** ジャンプの たかさ */
const AIR = 8
/** 足の ながさ(こし から くるぶし まで)と、さいごの ばってんで 足が ひらく よこの ずれ(元の 絵と おなじ 角度) */
const LEG = 44
const DX_CROSS = 22.2
const DX_WIDE = -16
const DX_PREP = -21

const GIRL_LOOK = { ...LOOKS.little, hairStyle: 'pigtails', top: '#f2799a', bottom: '#d95f84', accent: '#e8534a', bottomKind: 'skirt', sleeves: 'short' } as const

/* ───────── 枝と 小鳥 ───────── */

/** 枝の y(右はしが 少し高い) */
const branchY = (x: number) => 12 + (115 - x) * 0.12

function Branch({ t }: { readonly t: number }) {
  const slide = 1 - span(t, 0.3, 0.9, easeOut)
  return (
    <Layer x={slide * 26}>
      <path d="M118 12 L89 15.5" stroke={BARK} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M100 14 q-1 -4 -4.4 -5.4" fill="none" stroke={BARK} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="90" cy="17" r="3.4" fill={LEAF_DARK} />
      <circle cx="93" cy="19" r="2.4" fill={LEAF} />
      <circle cx="94.6" cy="8.2" r="2.8" fill={LEAF} />
      <circle cx="109" cy="8" r="4.6" fill={LEAF_DARK} />
      <circle cx="107.4" cy="15.6" r="3.8" fill={LEAF} />
    </Layer>
  )
}

/** 小鳥。右上から おりてきて 枝に とまり、うたう。女の子の ほうを 見る(左むき) */
function Songbird({ t }: { readonly t: number }) {
  const arrive = span(t, FLY, LAND, easeOut)
  if (arrive <= 0) return null
  const landed = arrive >= 1
  const perchX = 99
  const perchY = branchY(perchX) - 3.6
  const x = 122 - arrive * (122 - perchX)
  const y = -6 + arrive * (perchY + 6) - Math.sin(arrive * Math.PI) * 6
  const singing = during(t, LAND + 0.1, LAND_J, 0.2)
  const cheer = span(t, SETTLE, SETTLE + 0.1)
  const hop = landed ? Math.abs(wave(t, cheer > 0 ? 0.45 : 1.6)) * (cheer > 0 ? 1.6 : 0.5) : 0
  return (
    <>
      <Bird x={x} y={y - hop} t={t} flying={!landed} />
      {/* うたう おんぷ: 女の子の ほうへ ふわふわ ただよう */}
      <g opacity={singing}>
        {[0, 0.9, 1.8].map((offset) => {
          const p = ((t - LAND + offset) % 2.7) / 2.7
          return (
            <g key={offset} opacity={Math.sin(p * Math.PI)} transform={`translate(${93 - p * 24} ${8 + p * 7 - Math.sin(p * Math.PI) * 4})`}>
              <path d="M1.2 0 v-5 l2.8 -0.9 v4.6" fill="none" stroke={NOTE} strokeWidth="0.9" strokeLinecap="round" />
              <ellipse cx="0" cy="0.2" rx="1.5" ry="1.1" fill={NOTE} />
              <ellipse cx="2.8" cy="-0.7" rx="1.5" ry="1.1" fill={NOTE} />
            </g>
          )
        })}
      </g>
    </>
  )
}

/* ───────── 女の子 ───────── */

/** 足の ひらき(左足の、こし の まっすぐ下から の よこの ずれ)。右足は ぎゃく。 */
function footOffset(t: number): number {
  const sway = (time: number) => {
    const step = mix(time, SWAY, SWAY + 0.5, 0, DX_WIDE, easeOut)
    const tap = 4 * wave(time - SWAY, 0.8) * span(time, SWAY + 0.4, SWAY + 0.8)
    return step + tap
  }
  if (t < PREP) return sway(t)
  if (t < JUMP) return mix(t, PREP, JUMP - 0.05, sway(PREP), DX_PREP, easeInOut)
  return DX_PREP + (DX_CROSS - DX_PREP) * span(t, JUMP, LAND_J, easeInOut)
}

/** りょううで の ひらき(正面。+ が 外へ)。さいごは 2画目の よこ線。 */
function armSwings(t: number): { readonly left: number; readonly right: number; readonly bend: number } {
  const ramp = span(t, SWAY, SWAY + 0.4)
  const swing = 14 * wave(t - SWAY, 0.8) * ramp
  const hang = 8 + (22 - 8) * ramp
  const ready = span(t, PREP, JUMP - 0.05, easeInOut)
  const leftPre = (hang + swing) * (1 - ready) + 4 * ready
  const rightPre = (hang - swing) * (1 - ready) + 4 * ready
  // ジャンプで ばんざい から よこへ(バランスを とる)
  const up = span(t, JUMP, JUMP + 0.55, easeOut)
  const decay = 1 - span(t, LAND_J, SETTLE)
  const osc = Math.sin((t - LAND_J) * 14) * decay
  return {
    left: leftPre * (1 - up) + 90 * up + 9 * osc * up,
    right: rightPre * (1 - up) + 98 * up - 9 * osc * up,
    bend: 10 * (1 - up) + 6 * decay * up + 4 * ramp * (1 - up),
  }
}

function moodAt(t: number): Expression {
  if (t < HEAR) return 'sleepy'
  if (t < SWAY) return 'surprised'
  if (t < LAND_J) return 'smile'
  if (t < SETTLE) return 'worried'
  return 'joy'
}

/** あたまの てっぺんの リボン(1画目の はじまり)。あたまの まんなか が 0,0、半径 1 */
const topRibbon = (
  <g fill={RIBBON}>
    <ellipse cx="-0.25" cy="-1.04" rx="0.3" ry="0.19" transform="rotate(-18 -0.25 -1.04)" />
    <ellipse cx="0.25" cy="-1.04" rx="0.3" ry="0.19" transform="rotate(18 0.25 -1.04)" />
    <circle cx="0" cy="-1.02" r="0.15" fill="#c4413a" />
  </g>
)

function Girl({ t }: SceneProps) {
  const dx = footOffset(t)
  const jump = span(t, JUMP, LAND_J)
  const air = AIR * Math.sin(Math.PI * jump)
  const arms = armSwings(t)
  // 足の ひらき は こし の まっすぐ下 から の かくど(外へ + )。右足(画面の 左)も 左足 も おなじ だけ 外へ
  const legSwing = (-Math.asin(Math.max(-1, Math.min(1, dx / LEG))) * 180) / Math.PI
  const legs = { swing: legSwing, bend: 0 }
  // ぐらぐら: じめんの 足もとを じく に、ゆれが だんだん おさまる
  const decay = 1 - span(t, LAND_J, SETTLE)
  const wobble = 5 * Math.sin((t - LAND_J) * 14) * decay * (t >= LAND_J ? 1 : 0)
  const listen = span(t, HEAR - 0.1, HEAR + 0.2) * (1 - span(t, SWAY, SWAY + 0.5))
  const bounce = 5 * wave(t - SWAY, 0.8) * span(t, SWAY, SWAY + 0.5) * (1 - span(t, PREP, PREP + 0.3))
  const tilt = -4 * (1 - span(t, HEAR - 0.1, HEAR + 0.2)) + 7 * listen + bounce
  const tail = bounce * 1.4 + 40 * Math.sin(Math.PI * jump) + 14 * decay * Math.sin((t - LAND_J) * 14) * (t >= LAND_J ? 1 : 0)
  // 右手 は 画面の 左。さいごの 2画目 は 右が 少し 高い
  const pose: PersonPose = {
    rightArm: { swing: arms.left, bend: arms.bend },
    leftArm: { swing: arms.right, bend: arms.bend },
    rightLeg: legs,
    leftLeg: legs,
    head: tilt,
  }
  const gaze = t >= HEAR && t < PREP ? 1 : 0
  return (
    <Person x={CENTER} y={GROUND} build="teen" height={HEIGHT} facing="front" look={GIRL_LOOK} face={moodAt(t)} gaze={gaze} pose={pose} lift={air} lean={wobble} hairSway={tail} headwear={topRibbon} />
  )
}

/** ぴたっ と きまった しゅんかんの きらきら(絵の にぎやかし) */
function Cheer({ t }: SceneProps) {
  const show = during(t, SETTLE - 0.2, INK + 0.2, 0.3)
  if (show <= 0) return null
  const grow = span(t, SETTLE - 0.2, SETTLE + 0.3, backOut)
  return (
    <g opacity={show}>
      <Star cx={11} cy={18} r={3.2 * grow} color="#ffd24a" spin={t * 60} />
      <Star cx={99} cy={44} r={2.8 * grow} color="#ff9bb8" spin={-t * 60} />
      <Star cx={8} cy={66} r={2.4 * grow} color="#7cc4f2" spin={t * 50} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)
  const pop = span(t, POP, POP + 0.6, easeOut)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={null} clouds={[[4, 12, 0.8]]} />
        <Branch t={t} />
        <Layer opacity={span(t, POP, POP + 0.15)} scale={Math.max(0, pop)} origin={[CENTER, GROUND]}>
          <Girl t={t} />
        </Layer>
        <Songbird t={t} />
        <Cheer t={t} />
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
    { at: 0, label: '草が はえて、女の子が ぽん と出る', sound: 'pop' },
    { at: FLY, label: '小鳥が とんでくる' },
    { at: HEAR, label: 'うたが きこえて、びっくり' },
    { at: SWAY, label: 'たのしくて 足を ひらき、からだを ゆらす' },
    { at: PREP, label: '「よーし!」', sound: 'pop' },
    { at: JUMP, label: 'ジャンプ! 足が ばってんに まじわる' },
    { at: LAND_J, label: 'おっとっと と ぐらぐら' },
    { at: SETTLE, label: 'ぴたっ と きまって にっこり', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '交 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
