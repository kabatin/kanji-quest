/*
 * 帰(かえる): ほうきの ある 家へ、あるいて 帰る。(共通部品 sceneFigures で 書きなおした ためし)
 *
 * ほね(画と絵の対応)
 *   1画目(丨)    … 子どもの たれた うで(かた から ひじ を通って 手まで)
 *   2画目(丨ノ)  … 子どもの どう と、うしろへ ひいた あし
 *   3画目(𠃍)    … 家の いちばん上の まど(わく)
 *   4・5画目     … まどの まんなかの さん と、したの でっぱり
 *   6画目        … ほうきの 上の ところ(にぎる ぶぶん)
 *   7画目        … ドアの 上に ついた ひさし(ひよけ)
 *   8画目        … ほうきの え(まっすぐ立てかけた ぼう)
 *   9画目(𠃍)    … ドアの ガラスの わく
 *   10画目(丨)   … ドアの まんなか(りょうびらき の さかい)
 *
 * ながれ
 *   夕ぐれ。家が たつ → かばんを せおった 子どもが つかれて とぼとぼ あるいてくる(あせ・うつむき)
 *   → まどに あかりが ぽっと ついて、子どもが「!」と 顔を上げる(かえる家 だと 気づく)
 *   → うれしくて かけだす。鳥も 屋根へ かえってくる
 *   → 家の前に ついて、ドアが ひらき、手を ふって「ただいま」(ハートが ぽん)
 *   → ほね が ひかって、絵が うすくなり、字「帰」が のこる
 *
 * 字の形になるのは、家の前に ついて 立ち止まった さいごの しゅんかん(うで は 下に たれる)。
 */
import type { ReactNode } from 'react'
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../../sceneParts'
import { Backdrop, Bird, Hearts, LOOKS, mixLimb, PALETTE, Person, personRig, run, Sweat, Notice, walk, type PersonProps } from '../../sceneFigures'

const CHAR = '帰'

const BAG = '#e8534a'
const BAG_DARK = '#c43f38'
const WALL = '#f6dfbd'
const WALL_SHADE = '#e8c99c'
const ROOF = '#c8574a'
const ROOF_DARK = '#a8443a'
const DOOR = '#b5764a'
const DOOR_DARK = '#8f5a36'
const FRAME = '#ffffff'
const GLASS_DIM = '#9fb3c8'
const GLASS_WARM = '#ffe38a'
const WARM = '#ffd24a'
const STRAW = '#e6bd4f'
const STRAW_DARK = '#c29a33'

/** くぎり の時間(秒) */
const WALK = 0.6
/** あかりが ついて、足を止める */
const STOP = 3.2
const LAMP = 3.4
const HURRY = 4.2
const ARRIVE = 5.3
/** 手を ふりおわる(うで を おろす) */
const WAVE_END = 6.15
const INK = 6.4
const DONE = 9.5
const DURATION = 10

const GROUND = 96
/** 子どもの 背の高さ。どう と あし が 2画目に のる */
const HEIGHT = 78
/** ついた ところ(こし の x)と、とぼとぼ あるいて 止まる ところ */
const HOME_X = 27.5
const TIRED_X = 13
const START_X = -22

/** 家(ほそ長い 小さな 家)。まど・ひさし・ドア。画の 位置に 合わせた 1回きりの 家。 */
function Home({ t }: SceneProps) {
  const rise = span(t, 0, 0.8, backOut)
  const lamp = span(t, LAMP, LAMP + 0.5, easeOut)
  // ドア: 家に ついた ころ、りょうびらき に ひらく
  const open = span(t, ARRIVE - 0.1, ARRIVE + 0.5, easeOut)
  const leaf = Math.max(0.25, 1 - 0.75 * open)
  const glass = lamp > 0.5 ? GLASS_WARM : GLASS_DIM
  return (
    <>
      <ellipse cx="66" cy="97.6" rx={30 * rise} ry="2.8" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.7 + 0.3 * rise} scaleY={rise} origin={[66, 97]}>
        <rect x="40" y="9" width="52" height="88" fill={WALL} />
        <rect x="84" y="9" width="8" height="88" fill={WALL_SHADE} />
        <path d="M35 11 L66 0.5 L97 11 Z" fill={ROOF} />
        <path d="M66 0.5 L97 11 L88 11 Z" fill={ROOF_DARK} />
        {/* 上の まど: あかりが つくと あたたかい色に */}
        <rect x="45" y="14" width="35" height="24" rx="2" fill={FRAME} />
        <rect x="47" y="16" width="31" height="9" fill={glass} />
        <rect x="47" y="27.5" width="31" height="8" fill={glass} />
        <circle cx="62.5" cy="26" r={24 * lamp} fill={WARM} opacity={0.22 * lamp} />
        {/* ひさし(ドアの 上) */}
        <path d="M41 46 H87 L90 54 H38 Z" fill={BAG} />
        <path d="M38 54 H90 V56 H38 Z" fill={BAG_DARK} />
        {Array.from({ length: 5 }, (_, i) => (
          <path key={i} d={`M${46 + i * 9} 46 l-2 8 h4 l2 -8 Z`} fill={FRAME} opacity="0.85" />
        ))}
        {/* ドアの なか: ひらくと あたたかい あかりが もれる */}
        <rect x="48" y="56" width="33" height="41" fill={GLASS_WARM} opacity={open} />
        <Layer scaleX={leaf} origin={[48, 76]}>
          <rect x="48" y="56" width="15.5" height="41" fill={DOOR} />
          <rect x="51" y="59" width="10" height="17" rx="1.5" fill={glass} />
          <circle cx="60.6" cy="84" r="1.1" fill={WARM} />
        </Layer>
        <Layer scaleX={leaf} origin={[81, 76]}>
          <rect x="63.5" y="56" width="17.5" height="41" fill={DOOR_DARK} />
          <rect x="66" y="59" width="12" height="17" rx="1.5" fill={glass} />
          <circle cx="65.4" cy="84" r="1.1" fill={WARM} />
        </Layer>
      </Layer>
    </>
  )
}

/** ドアの よこに たてかけた ほうき(わらの はき先 が 下) */
function Broom({ t }: SceneProps) {
  const rise = span(t, 0.3, 0.9, backOut)
  // 子どもが 来ると、ちょっと ゆれて むかえる
  const nod = Math.sin(span(t, ARRIVE, ARRIVE + 0.6) * Math.PI * 2) * 2.4
  return (
    <Layer scale={rise} rotate={-2 + nod} origin={[44, 97]}>
      <path d="M43.2 48 L44.6 84" fill="none" stroke={PALETTE.bark} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M41.6 82 H47.6 L51 97 H37.6 Z" fill={STRAW} />
      <path d="M44.6 82 L44 97 M41.2 84 L38.6 97 M48 84 L50 97" fill="none" stroke={STRAW_DARK} strokeWidth="0.9" strokeLinecap="round" />
      <rect x="41.4" y="82.4" width="6.4" height="2.2" rx="1" fill={BAG_DARK} />
    </Layer>
  )
}

/** せおった かばん。よこむき の 体の 座標で、せなか(うしろ)がわ に 描く。 */
function bagOf(person: PersonProps): ReactNode {
  const rig = personRig(person)
  const b = rig.body
  return (
    <g transform={rig.transform}>
      <rect x={-b.torsoW / 2 - 6} y={-b.torso * 0.92} width="10" height={b.torso * 0.62} rx="4" fill={BAG} />
      <rect x={-b.torsoW / 2 - 6} y={-b.torso * 0.62} width="10" height="3.4" fill={BAG_DARK} />
    </g>
  )
}

/** 子どもの いち・かっこう: つかれて あるく → あかりに 気づいて 止まる → かけだす → 家の 前で 手を ふる */
function kidAt(t: number): PersonProps {
  const tired = walk(t, { from: START_X, to: TIRED_X, start: WALK, end: STOP, build: 'child', height: HEIGHT, step: 22, armSwing: 10 })
  const dash = run(t, { from: TIRED_X, to: HOME_X, start: HURRY, end: ARRIVE, build: 'child', height: HEIGHT, stride: 10 })
  const base = { y: GROUND, build: 'child', height: HEIGHT, facing: 'right', look: LOOKS.boy } as const
  const hang = { swing: 3, bend: 8 }
  if (t < STOP) return { ...base, x: tired.x, pose: { ...tired.pose, torso: 7, head: 12 }, lean: 3, face: 'sad' }
  if (t < HURRY) return { ...base, x: TIRED_X, pose: { leftArm: hang, rightArm: hang, head: -8 }, face: t < STOP + 1 ? 'surprised' : 'joy' }
  // ついたら 手を ふる(かたから 上へ あげて、ひじ から先を ゆらす)
  const wave1 = span(t, ARRIVE + 0.1, ARRIVE + 0.55, easeOut) * (1 - span(t, WAVE_END - 0.35, WAVE_END, easeInOut))
  const hello = mixLimb(hang, { swing: 150, bend: wave(t, 0.4) * 26 }, wave1)
  const pose = t < ARRIVE ? { ...dash.pose, head: dash.pose.head } : { leftArm: hello, rightArm: hang, head: -1 }
  return { ...base, x: dash.x, lift: t < ARRIVE ? dash.lift : 0, pose, face: t < STOP + 1 ? 'surprised' : 'joy' }
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 10)
  const kid = kidAt(t)
  const rig = personRig(kid)
  const head = rig.world.head
  const headR = rig.body.headR * rig.scale
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  // 夕日: ゆっくり しずんでいく
  const sun: readonly [number, number] = [13, mix(t, 0, DONE, 14, 19, easeInOut)]
  // 鳥も 屋根へ かえってくる。屋根の 右の ななめ に とまる
  const fly = span(t, 1.0, 3.2, easeInOut)
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} time={1} sun={sun} clouds={[]} tufts={[6, 30, 100]} />
        <Home t={t} />
        <Broom t={t} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <Person {...kid} held={bagOf(kid)} />
          <Sweat t={t} x={head[0] - headR * 1.1} y={head[1] - headR * 0.5} show={during(t, WALK + 0.3, STOP, 0.2)} />
          <Notice x={head[0]} y={head[1]} r={headR} show={during(t, STOP + 0.05, STOP + 1.0, 0.15)} dir={1} />
          <Hearts t={t} x={head[0] + headR * 1.5} y={head[1] - headR * 1.2} show={during(t, ARRIVE + 0.35, INK - 0.05, 0.2)} />
        </Layer>
        {fly > 0 && <Bird x={-8 + fly * 92} y={18 - fly * 15.3 - Math.sin(fly * Math.PI) * 5} t={t} flying={fly < 1} facing="right" />}
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
    { at: 0, label: '夕ぐれ。家が たつ', sound: 'pop' },
    { at: WALK, label: 'つかれた子が とぼとぼ あるいてくる' },
    { at: STOP, label: 'まどに あかりが ついて「!」と 気づく', sound: 'pop' },
    { at: HURRY, label: 'うれしくて かけだす。鳥も かえってくる' },
    { at: ARRIVE, label: '家に ついて、ドアが ひらき「ただいま」', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '帰 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
