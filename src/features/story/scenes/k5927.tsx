/*
 * 大(おおきい): 人が 手と 足を 大きく ひろげた。(共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 子どもが ひろげた 左右の うで(かた の高さ)
 *   2画目(ノ)  … あたまの てっぺん から、どう の まんなか を通って、左の 足
 *   3画目(乀)  … どう の まんなか から、右の 足
 *   (字と 重なるのは、手と足を いっぱいに ひろげた さいごの しゅんかん だけ。だいたい 同じ 場所・同じ 向き)
 *
 * ながれ
 *   池の そばで つまらなそうな 子ども
 *   → 池から 大きな さかなが ざぶん と とびはねる(わけ)。子どもは びっくり
 *   → ぽちゃん と おちて、子どもは うれしくて ぴょんぴょん
 *   → 「こーんなに おおきかった!」と 手と足を いっぱいに ひろげる
 *   → ほね が ひかって、絵が うすくなり、字「大」が のこる
 *
 * 人は Person(正面)。うで・足の ひろげ方は { swing, bend } の 角度で、mixLimb で なめらかに かえる。
 * さかな(動物)は 部品が ないので 場面で 描く。
 */
import { backOut, during, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, HANG_ARM, LOOKS, mixLimb, Notice, Person, personRig, Pond, Sigh, STRAIGHT_LEG, type Limb } from '../sceneFigures'

const CHAR = '大'

const POOL_LIGHT = '#b4e0fa'
const FISH = '#4f9be0'
const FISH_DARK = '#3c82c4'
const FISH_BELLY = '#e8f6ff'
const EYE = '#2b2b2b'

/** くぎり の時間(秒) */
const BORED_END = 1.1
/** さかなが とびはねている間 */
const JUMP_FROM = 1.1
const JUMP_TO = 2.4
/** びっくり の「はっ」が出る */
const SURPRISE = 1.25
/** よろこんで はねる */
const HOP_FROM = 2.5
const HOP_TO = 3.3
/** 手と足を ひろげはじめる・ひろげおわる */
const SPREAD_FROM = 3.3
const SPREAD_TO = 4.6
const INK = 5.5
const DONE = 8.2
const DURATION = 8.8

/** 池の まんなかと、さかなが とびだす・おちる 場所 */
const POOL_AT: readonly [number, number] = [88, 83]
const FISH_OUT = 90
const FISH_IN = 72
const FISH_WATER_Y = 82
const FISH_TOP_Y = 32

/** 子どもの 立つ場所(こし の x と 地面)と 背の高さ */
const KID_X = 50
const KID_Y = 96
const KID_HEIGHT = 60

/** ひろげた うで・足(画の 1・2・3画目の むき) */
const ARM_SPREAD = { swing: 92, bend: 4 }
const ARM_CHEER = { swing: 38, bend: 55 }
const LEG_SPREAD = { swing: 36, bend: 0 }

const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/** 水面に ひろがる わ */
function Ripple({ t, from, x }: { readonly t: number; readonly from: number; readonly x: number }) {
  const p = span(t, from, from + 0.9)
  if (p <= 0 || p >= 1) return null
  const rx = 3 + 10 * p
  return <ellipse cx={x} cy={FISH_WATER_Y + 1} rx={rx} ry={rx * 0.26} fill="none" stroke={POOL_LIGHT} strokeWidth="1.1" opacity={1 - p} />
}

/** しぶき: 水面から 上に とびちる 水の つぶ(おもさで 山なりに おちる) */
function Spray({ t, from, x, power }: { readonly t: number; readonly from: number; readonly x: number; readonly power: number }) {
  const q = t - from
  if (q <= 0 || q >= 0.7) return null
  const drops = [-1, -0.5, 0, 0.5, 1]
  return (
    <g opacity={1 - q / 0.7} fill={POOL_LIGHT}>
      {drops.map((d, i) => (
        <circle key={d} cx={x + d * 5 * power * q * 3} cy={FISH_WATER_Y - (9 - Math.abs(d) * 3 + i * 0.4) * power * q * 2 + 22 * q * q * power} r={1.3 * power} />
      ))}
    </g>
  )
}

/** 大きな さかな。あたまを むいている ほうへ すすむ。 */
function Fish({ t }: SceneProps) {
  const p = span(t, JUMP_FROM, JUMP_TO)
  if (p <= 0 || p >= 1) return null
  const x = lerp(FISH_OUT, FISH_IN, p)
  const y = FISH_WATER_Y - (FISH_WATER_Y - FISH_TOP_Y) * Math.sin(p * Math.PI)
  const vx = FISH_IN - FISH_OUT
  const vy = -(FISH_WATER_Y - FISH_TOP_Y) * Math.PI * Math.cos(p * Math.PI)
  const angle = (Math.atan2(vy, vx) * 180) / Math.PI
  return (
    <Layer x={x} y={y} rotate={angle + 180}>
      {/* ローカル座標では さかなの あたまが -x がわ。angle+180 で すすむ向きに あたまが来る */}
      <path d="M11 0 L19 -6 Q17 0 19 6 Z" fill={FISH_DARK} />
      <ellipse cx="0" cy="0" rx="13" ry="6.8" fill={FISH} />
      {/* おなか: 体の 下がわ だけ 白く(体の中に おさめる) */}
      <path d="M-9 3 Q0 7.4 9 3 Q0 4.6 -9 3 Z" fill={FISH_BELLY} />
      <path d="M-2 -6 Q1 -11 5 -5.4 Z" fill={FISH_DARK} />
      <path d="M2 1 Q6 4 9 2" fill="none" stroke={FISH_DARK} strokeWidth="0.9" strokeLinecap="round" />
      <circle cx="-8" cy="-1.6" r="1.5" fill="#ffffff" />
      <circle cx="-8.3" cy="-1.6" r="0.8" fill={EYE} />
    </Layer>
  )
}


/* ───────── 子ども ───────── */

function kidAt(t: number) {
  const spread = span(t, SPREAD_FROM, SPREAD_TO, backOut)
  const cheer = span(t, SURPRISE, SURPRISE + 0.25) * (1 - Math.min(spread, 1))
  const wiggle = t > SURPRISE + 0.3 && t < SPREAD_FROM ? wave(t, 0.22) * 5 * cheer : 0
  const armUp: Limb = { swing: ARM_CHEER.swing + wiggle, bend: ARM_CHEER.bend }
  const arm = mixLimb(mixLimb(HANG_ARM, armUp, cheer), ARM_SPREAD, Math.min(spread, 1))
  const leg = mixLimb(STRAIGHT_LEG, LEG_SPREAD, Math.min(spread, 1))
  const hop = t > HOP_FROM && t < HOP_TO ? Math.abs(Math.sin(((t - HOP_FROM) / 0.4) * Math.PI)) * 4 : 0
  const face = t < SURPRISE ? 'sleepy' : t < JUMP_TO ? 'surprised' : 'joy'
  return {
    x: KID_X,
    y: KID_Y,
    build: 'child',
    height: KID_HEIGHT,
    facing: 'front',
    look: LOOKS.boy,
    face,
    // さかなを 目で おいかける(池は 画面の 右)
    gaze: t < SURPRISE ? 0 : 0.7 * (1 - span(t, JUMP_TO, JUMP_TO + 0.4)),
    lift: hop,
    pose: { leftArm: arm, rightArm: arm, leftLeg: leg, rightLeg: leg, head: t < SURPRISE ? -5 + wave(t, 2) * 1.2 : 0 },
  } as const
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 3)
  const kid = kidAt(t)
  const rig = personRig(kid)
  const [hx, hy] = rig.world.head
  const headR = rig.body.headR * rig.scale
  const sigh = span(t, 0.35, BORED_END + 0.1)
  const surprise = during(t, SURPRISE, JUMP_TO + 0.1, 0.12)
  const rippleLevel = during(t, JUMP_FROM - 0.2, JUMP_TO + 0.9, 0.3)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[13, 13]} tufts={[8, 30, 104]} />
        <Pond t={t} x={POOL_AT[0]} y={POOL_AT[1]} rx={18} ry={4.6} ripple={rippleLevel} />
        <Ripple t={t} from={JUMP_FROM - 0.1} x={FISH_OUT} />
        <Ripple t={t} from={JUMP_TO - 0.05} x={FISH_IN} />
        <Fish t={t} />
        <Spray t={t} from={JUMP_FROM - 0.1} x={FISH_OUT} power={0.7} />
        <Spray t={t} from={JUMP_TO - 0.05} x={FISH_IN} power={1} />
        <Person {...kid} />
        <Sigh x={hx - headR * 0.4} y={hy + headR * 0.5} p={sigh} show={during(t, 0.35, BORED_END + 0.1, 0.2)} />
        <Notice x={hx} y={hy} r={headR} show={surprise} dir={1} />
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
    { at: 0, label: 'つまらなそうな 子ども', sound: 'pop' },
    { at: JUMP_FROM, label: '池から 大きな さかなが とびはねる!' },
    { at: JUMP_TO, label: 'ぽちゃん。びっくり して よろこぶ', sound: 'pop' },
    { at: SPREAD_FROM, label: '「こーんなに おおきかった!」手と足を ひろげる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '大 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
