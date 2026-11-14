/*
 * 家(いえ): やねの したに、ぶたが はいって くらす。
 *
 * ほね(画と絵の対応)
 *   1画目(丶)  … やねの てっぺんに ある えんとつ
 *   2画目(ノ)  … 家の 左の はしら
 *   3画目(フ)  … 大きな やね(右の はしの そりかえり まで)
 *   4〜5画目   … ぶたの あたま と みみ、はな
 *   6画目      … ぶたの せなか から おなか の まるみ
 *   7〜8画目   … ぶたの まえあし・うしろあし(左へ)
 *   9〜10画目  … ぶたの おしり と しっぽ・あし(右へ)
 *
 * ながれ
 *   雨が ふりだし、家(はしら・かべ・やね)が できる
 *   → ぬれた ぶたが 雨の中を さむそうに あるいてくる
 *   → やねの下に はいると 雨が あたらない。ぶるぶると 水を ふるって ほっと する
 *   → 雨が やんで お日さまが でる。子ぶたも かけこんできて、みんなで にこにこ(えんとつから けむり)
 *   → ほね が ひかって、絵が うすくなり、字「家」が のこる
 *
 * 背景・雨・ハート・お日さまは 共通部品。ぶた(動物の 部品は まだ ない)と 家(はしら と やね が ほね)は 場面で 描く。
 *
 * ぶたは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   よこむきの どうたい。あし は 4ほん で、からだの 下から まっすぐ。みみ は あたまの上から たれ、
 *   はな は 先が ひらたく、しっぽ は おしりから くるん と まく。
 *   雨は まっすぐ 下に おちて、やねに あたって とまる(やねの下は ぬれない)。
 */
import { backOut, during, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Hearts, Rain, Sun } from '../sceneFigures'

const CHAR = '家'

const PIG = '#f7a8b8'
const PIG_DARK = '#e88ea2'
const PIG_BELLY = '#fbc7d2'
const SNOUT = '#f28aa0'
const HOOF = '#c9667f'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const WALL = '#f6e4bd'
const WALL_SHADE = '#e9cf9c'
const ROOF = '#d9594c'
const ROOF_LIGHT = '#ea7a6c'
const ROOF_DARK = '#b8423a'
const BRICK = '#b0674a'
const STRAW = '#ebcb6c'
const DROP = '#7cc4f2'
const EYE = '#2b2b2b'

/** くぎり の時間(秒) */
const BUILT = 1.0
/** ぶたが あらわれて 雨の中を あるく */
const PIG_IN = 1.2
const PIG_SLOW = 3.4
const ARRIVE = 4.1
const SHAKE = 3.5
const RAIN_STOP = 3.9
const PIGLET_IN = 4.7
const INK = 6.4
const DONE = 8.5
const DURATION = 9.2

/** ぶたの おちつく ばしょ(どうたいの まんなか) */
const PIG_HOME_X = 56
const PIG_SCALE = 1.15
/** ぶたの あしの うら(ぶたの ローカル座標で y = 19)が 地面 y = 95 に のるように */
const PIG_Y = 95 - 19 * PIG_SCALE
/** 家の はば(やね の はし) */
const ROOF_L = 16
const ROOF_R = 92
const ROOF_TOP = 13
const ROOF_EAVE = 30

type Mood = 'sad' | 'happy'

/* ───────── ぶた ───────── */

type PigProps = { readonly step: number; readonly mood: Mood; readonly tint?: boolean }

/** よこむき(左むき)の ぶた。あし は どうたい の 下から まっすぐ のびる。 */
function Pig({ step, mood }: PigProps) {
  return (
    <>
      {/* むこうがわの あし */}
      <Layer rotate={-step * 18} origin={[-6, 8]}>
        <rect x="-9" y="6" width="6" height="13" rx="3" fill={PIG_DARK} />
        <ellipse cx="-6" cy="19" rx="3.6" ry="1.8" fill={HOOF} />
      </Layer>
      <Layer rotate={step * 18} origin={[8, 8]}>
        <rect x="5" y="6" width="6" height="13" rx="3" fill={PIG_DARK} />
        <ellipse cx="8" cy="19" rx="3.6" ry="1.8" fill={HOOF} />
      </Layer>
      {/* しっぽ: おしりから くるん */}
      <path d="M19.5 -4 Q26 -6 25.5 -11 Q25 -14.5 21.8 -13 Q19.6 -11.8 21.4 -10" fill="none" stroke={PIG_DARK} strokeWidth="1.9" strokeLinecap="round" />
      {/* どうたい */}
      <ellipse cx="0" cy="0" rx="21" ry="13.5" fill={PIG} />
      <ellipse cx="0" cy="8" rx="17" ry="5" fill={PIG_BELLY} />
      {/* てまえの あし */}
      <Layer rotate={step * 18} origin={[-12, 8]}>
        <rect x="-15" y="6" width="6.4" height="13" rx="3.2" fill={PIG} />
        <ellipse cx="-12" cy="19" rx="3.8" ry="1.9" fill={HOOF} />
      </Layer>
      <Layer rotate={-step * 18} origin={[14, 8]}>
        <rect x="11" y="6" width="6.4" height="13" rx="3.2" fill={PIG} />
        <ellipse cx="14" cy="19" rx="3.8" ry="1.9" fill={HOOF} />
      </Layer>
      {/* あたま: 左へ。はな は 先が ひらたい */}
      <circle cx="-22" cy="-1" r="10.5" fill={PIG} />
      <ellipse cx="-31" cy="2.5" rx="5" ry="4.2" fill={SNOUT} />
      <ellipse cx="-32.6" cy="2.2" rx="0.9" ry="1.2" fill="#a5445c" />
      <ellipse cx="-29.4" cy="2.2" rx="0.9" ry="1.2" fill="#a5445c" />
      <path d="M-23.5 -8.5 Q-22.5 -17.5 -13.5 -14 Q-14 -8 -17.5 -6.5 Z" fill={PIG_DARK} />
      <circle cx="-21.5" cy="4.6" r="2.3" fill="#ff8fa0" opacity="0.6" />
      {mood === 'sad' ? (
        <>
          <circle cx="-25.4" cy="-2.6" r="1.6" fill={EYE} /><circle cx="-25" cy="-3.1" r="0.5" fill="#ffffff" />
          <path d="M-28 -6.6 L-23.6 -5.6" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M-29 8.2 Q-27 6 -24.4 8.2" fill="none" stroke="#a5445c" strokeWidth="1.1" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M-27.2 -3 Q-25.4 -5.4 -23.6 -3" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M-29 6.6 Q-27 9 -24.4 6.6" fill="none" stroke="#a5445c" strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
    </>
  )
}

/** ふるった 水の しずく。ぶたの まわりへ ちる。 */
function Spray({ t }: SceneProps) {
  const show = during(t, SHAKE, SHAKE + 0.8, 0.15)
  if (show <= 0) return null
  const p = span(t, SHAKE, SHAKE + 0.8, easeOut)
  const dirs: readonly (readonly [number, number])[] = [[-1, -0.8], [-0.4, -1.1], [0.5, -1.1], [1, -0.7], [1.2, 0.1], [-1.2, 0.1]]
  return (
    <g opacity={show}>
      {dirs.map(([dx, dy], i) => (
        <path key={i} d="M0 -2 Q1.8 0.6 0 1.8 Q-1.8 0.6 0 -2 Z" fill={DROP} transform={`translate(${PIG_HOME_X + dx * 22 * p} ${68 + dy * 20 * p + p * p * 8})`} />
      ))}
    </g>
  )
}

/** 雨を くぎる はば と、その 場所で 雨が とまる たかさ(やねの 上。はしの そとは 地面) */
const RAIN_BANDS: readonly (readonly [number, number, number])[] = [[-2, ROOF_L, 96], [ROOF_L, 30, 27], [30, 42, 21], [42, 66, 15], [66, 80, 21], [80, ROOF_R, 28], [ROOF_R, 111, 96]]

/** 雨: まっすぐ 下に おちる。やねの 上で はねて とまり、やねの下には おちない */
function RoofRain({ t, amount }: { readonly t: number; readonly amount: number }) {
  return (
    <>
      {RAIN_BANDS.map(([left, right, ground]) => (
        <Rain key={left} t={t} amount={amount} left={left} right={right} ground={ground} />
      ))}
    </>
  )
}

/* ───────── 家 ───────── */

function House({ t }: SceneProps) {
  const posts = span(t, 0.1, 0.6, backOut)
  const wall = span(t, 0.2, 0.7)
  const roof = span(t, 0.45, BUILT, backOut)
  const smoke = during(t, PIGLET_IN, INK, 0.3)
  return (
    <>
      <Layer opacity={wall}>
        <rect x="26" y="29" width="58" height="67" fill={WALL} />
        <path d="M26 66 H84 M26 80 H84" stroke={WALL_SHADE} strokeWidth="1.2" />
        <ellipse cx="55" cy="95.4" rx="30" ry="3" fill={STRAW} />
      </Layer>
      {/* 左右の はしら: 下から のびる */}
      <Layer scaleY={posts} origin={[54, 97]}>
        <rect x="22" y="28" width="6" height="69" rx="2" fill={BARK} />
        <rect x="82" y="28" width="6" height="69" rx="2" fill={BARK} />
        <path d="M25 40 v50" stroke={BARK_DARK} strokeWidth="0.9" />
      </Layer>
      {/* やね: うえから すとん と のる */}
      <Layer y={-(1 - roof) * 30} opacity={span(t, 0.45, 0.7)}>
        <rect x="49.5" y="6" width="9" height="14" rx="1.2" fill={BRICK} />
        <rect x="48.5" y="5" width="11" height="3.2" rx="1.2" fill={ROOF_DARK} />
        <path d={`M${ROOF_L} ${ROOF_EAVE} L54 ${ROOF_TOP} L${ROOF_R} ${ROOF_EAVE} Z`} fill={ROOF} />
        <path d={`M${ROOF_L + 3} ${ROOF_EAVE - 1.5} L54 ${ROOF_TOP + 2.2} L54 ${ROOF_EAVE - 1.5} Z`} fill={ROOF_LIGHT} />
        <rect x={ROOF_L - 1} y={ROOF_EAVE - 1.5} width={ROOF_R - ROOF_L + 2} height="4.4" rx="2.2" fill={ROOF_DARK} />
      </Layer>
      {/* えんとつの けむり: ぶたたちが くつろぐと のぼる */}
      <g opacity={smoke} fill="#ffffff" stroke="#d7e0ea" strokeWidth="0.6">
        {[0, 1, 2].map((i) => {
          const p = ((t * 0.5 + i / 3) % 1)
          return <circle key={i} cx={54 + Math.sin(p * 6 + i) * 2 + p * 5} cy={5 - p * 8} r={1.6 + p * 2.2} opacity={Math.sin(p * Math.PI) * 0.9} />
        })}
      </g>
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 10)

  // ぶた: 雨の中を ゆっくり あるき、家に はいって とまる
  const slowX = mix(t, PIG_IN, PIG_SLOW, 150, 80, (x) => x)
  const pigX = t < PIG_SLOW ? slowX : mix(t, PIG_SLOW, ARRIVE, 80, PIG_HOME_X, easeOut)
  const walking = t >= PIG_IN ? 1 - span(t, ARRIVE - 0.3, ARRIVE) : 0
  const stride = Math.sin((t - PIG_IN) * Math.PI * 2 * 1.6) * walking
  const mood: Mood = t < PIG_SLOW ? 'sad' : 'happy'
  // さむくて ぶるぶる(雨の中) / 水を ふるう(家に はいった あと) / うれしくて ぴょん
  const shiver = t < PIG_SLOW ? wave(t, 0.1) * 0.7 : 0
  const shake = during(t, SHAKE, SHAKE + 0.7, 0.1) * wave(t, 0.13) * 5
  const bob = (t < ARRIVE ? -Math.abs(stride) * 1.1 : 0) - during(t, INK - 1.4, INK - 0.2, 0.3) * Math.abs(wave(t, 0.8)) * 1.2
  const pigIn = span(t, PIG_IN - 0.01, PIG_IN)

  // 子ぶた: おくれて かけこんでくる
  const kidX = mix(t, PIGLET_IN, PIGLET_IN + 1.2, 140, 80, easeOut)
  const kidRun = t >= PIGLET_IN ? 1 - span(t, PIGLET_IN + 0.9, PIGLET_IN + 1.2) : 0
  const kidStep = Math.sin((t - PIGLET_IN) * Math.PI * 2 * 2.4) * kidRun
  const kidHop = t > PIGLET_IN + 1.2 && t < INK - 0.1 ? Math.abs(wave(t, 0.6)) * 1.6 : 0

  const rain = span(t, 0.2, 0.9) * (1 - span(t, RAIN_STOP - 0.3, RAIN_STOP + 0.9))
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={null} clouds={[]} ground={98} tufts={[6, 98, 104]} overcast={rain} />
        <Sun t={t} x={98} y={14} r={5.6} from={RAIN_STOP} />
        <House t={t} />
        <Layer opacity={pigIn}>
          <ellipse cx={pigX + 1} cy="96.8" rx="26" ry="2.6" fill="#000000" opacity="0.1" />
          <Layer x={pigX + shiver} y={PIG_Y + bob} rotate={shake} scale={PIG_SCALE} origin={[0, 14]}>
            <Pig step={stride} mood={mood} />
          </Layer>
        </Layer>
        <Spray t={t} />
        {t >= PIGLET_IN ? (
          <Layer x={kidX} y={87.6 - kidHop} scale={0.5} origin={[0, 0]}>
            <Pig step={kidStep} mood="happy" />
          </Layer>
        ) : null}
        <Hearts t={t} x={44} y={48} show={during(t, PIGLET_IN + 1.3, INK - 0.1, 0.25)} />
        <RoofRain t={t} amount={rain} />
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
    { at: 0, label: '雨が ふって、家が できる', sound: 'pop' },
    { at: PIG_IN, label: 'ぬれた ぶたが さむそうに あるいてくる' },
    { at: SHAKE, label: 'やねの下で ほっと。ぶるぶる', sound: 'pop' },
    { at: PIGLET_IN, label: '雨が やんで、子ぶたも かけこんでくる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '家 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
