/*
 * 後(うしろ): あしに ひもが からまって、みんなより おくれて しまう。
 *
 * ほね(画と絵の対応)
 *   1・2画目(ノ ノ) … 「ぎょうにんべん」。みちを あるく 子の あたまから せなか のほう(ゆるい ななめ)
 *   3画目(丨)       … 子の どう と あし(たて)
 *   4〜6画目(幺)    … 子の あしに からまった ひも(いとの わ)
 *   7〜9画目(夂)    … ひもに ひっぱられて 止まった あしと、さきへ すすんで いく みんなの あしあと
 *   (絵と字は だいたい 同じ場所・同じ向き。ぴったり重ねるために、体を ゆがめることは しない)
 *
 * ながれ
 *   みんなと いっしょに、たのしく みちを あるく(ちょうど 子の まえに、赤い ひもが おちている)
 *   → ひもが あしに ひっかかって、からまる。びっくり!
 *   → みんなは 気づかずに さきへ いく。子は あしが うごかず、かなしくなって「まってー」と 手をのばす
 *   → ほね が ひかって、絵が うすくなり、字「後」が のこる
 *
 * 子と みんなは Person(あるきは walk、せおう かばん は pack)。
 * 子が あるく あいだ みちは うごかず、子が みちを すすむ。みんなは おくの ほうを 小さく あるいていく。
 * みち は Path、けしき は Backdrop、びっくり は Notice。ひも は 部品に ないので ここで 描く。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, LOOKS, mixPose, Notice, Path, PALETTE, Person, personRig, Tuft, walk, type Limb, type PersonPose, type PersonProps } from '../sceneFigures'

const CHAR = '後'

const STRING = '#e8534a'
const STRING_DARK = '#c23d36'

/** くぎり の時間(秒) */
const CATCH = 3.0
const SAD = 3.9
const CALL = 4.6
const INK = 5.9
const DONE = 8.7
const DURATION = 9.3

/** みちの たかさ(子の 足もと) と、子の 背の高さ・歩く はんい */
const GROUND = 98
const CHILD_HEIGHT = 50
const CHILD_FROM = 9
const CHILD_TO = 27
/** みんなの 背の高さ と、あるく はんい(だんだん とおく) */
const FRIEND_HEIGHT = 30

const CHILD_LOOK = { ...LOOKS.boy, top: '#f5a742', bottom: '#3e5c86' }
const CHILD_PACK = { kind: 'rucksack', color: '#4f9be0' } as const

const FRIENDS = [
  { from: 34, to: 88, look: { ...LOOKS.boy, top: '#5cc08a', bottom: '#7a6a9c' }, pack: { kind: 'rucksack', color: '#f086a8' } },
  { from: 54, to: 104, look: { ...LOOKS.girl, top: '#f086a8', bottom: '#4a7aa8' }, pack: { kind: 'rucksack', color: '#ffd24a' } },
] as const

/** ひもに ひっかかる 足は てまえの 左足。いちばん さいごに 立ちどまる 場所 の あし が ひもの 上 */
const CHILD_WALK = { from: CHILD_FROM, to: CHILD_TO, start: 0.1, end: CATCH, build: 'child', height: CHILD_HEIGHT, step: 6 } as const

/** ひっかかって とまった ときの 立ちかた。ひっかかった 左足 は まっすぐ、右足 は ひっぱられて うしろへ うく */
const STUCK: PersonPose = { leftLeg: { swing: 2, bend: 0 }, rightLeg: { swing: -24, bend: 22 } }

/** 立ちどまった 子の 左足(ひもの うえ)の くるぶし。ひもを ここに おく */
function caughtAnkle(): readonly [number, number] {
  const rig = personRig({ x: CHILD_TO, y: GROUND, facing: 'right', build: 'child', height: CHILD_HEIGHT, pose: STUCK })
  return rig.world.legs.left.end
}

/** みちに おちている 赤い ひも。ひとつ わ を つくって、ゆるく ねじれている。 */
function Coil({ x }: { readonly x: number }) {
  return (
    <g transform={`translate(${x.toFixed(2)} ${GROUND + 0.6})`} fill="none" stroke={STRING} strokeWidth="1.5" strokeLinecap="round">
      <path d="M-10 1 Q-7 -2.4 -4 0.4 T2 0.4 C5 -3 9.4 -1.6 7.4 1.2 C5.4 3.2 2 1.6 4 -0.6" />
    </g>
  )
}

/** ひもが くるぶし に ぐるぐる まきつく(もう一方は 地面の ひも) */
function Tangle({ ankle, amount }: { readonly ankle: readonly [number, number]; readonly amount: number }) {
  if (amount <= 0) return null
  const [ax, ay] = ankle
  return (
    <g opacity={amount} fill="none" stroke={STRING} strokeWidth="1.3" strokeLinecap="round">
      <path d={`M${ax - 1} ${ay + 0.6} Q${ax + 1} ${ay + 2.4} ${ax} ${GROUND + 0.4}`} />
      <ellipse cx={ax} cy={ay - 1} rx="3.2" ry="1.4" transform={`rotate(-12 ${ax} ${ay})`} />
      <ellipse cx={ax} cy={ay + 0.6} rx="3.2" ry="1.4" transform={`rotate(10 ${ax} ${ay})`} stroke={STRING_DARK} />
    </g>
  )
}

/** 子の うで: びっくりで ぱっと あげ、かなしくて おろし、「まってー」で みんなの ほうへ のばす */
function armsAt(t: number): { readonly left: Limb; readonly right: Limb } {
  const up = span(t, CATCH, CATCH + 0.3, backOut)
  const down = span(t, SAD, SAD + 0.4)
  const reach = span(t, CALL, CALL + 0.5, easeOut)
  const wiggle = wave(t, 0.6) * span(t, CALL + 0.5, CALL + 0.7) * 14
  const left: Limb = { swing: mix(t, SAD, SAD + 0.4, 70, 25) * up + mix(t, CALL, CALL + 0.5, 0, 90, easeOut) * (t >= CALL ? 1 : 0) + wiggle, bend: 8 + 14 * (1 - down) }
  const right: Limb = { swing: mix(t, SAD, SAD + 0.4, 55, 8) * up, bend: 8 + 14 * (1 - down) }
  return { left: reach > 0 || t >= SAD ? left : { swing: 70 * up, bend: 22 }, right: t >= SAD ? right : { swing: 55 * up, bend: 22 } }
}

/** 子の 場所と かっこう。みちを あるいて、ひもで ぴたっと とまる */
function childAt(t: number): PersonProps {
  const walking = walk(t, CHILD_WALK)
  const stuck = t >= CATCH
  const k = span(t, CATCH, CATCH + 0.25, easeOut)
  const tug = stuck ? Math.abs(wave(t - CATCH, 0.7)) * span(t, CATCH + 0.3, CATCH + 0.6) * (1 - span(t, CALL, CALL + 0.5)) : 0
  const { left, right } = armsAt(t)
  const frozen = mixPose({}, { ...STUCK, rightLeg: { swing: -24 - 5 * tug, bend: 22 } }, k)
  // びっくり で まえへ つんのめって、すぐ もどる
  const lean = t < CATCH ? 0 : t < CATCH + 0.25 ? mix(t, CATCH, CATCH + 0.25, 0, 14, easeOut) : t < SAD ? mix(t, CATCH + 0.25, SAD, 14, 3, easeInOut) : 3 + wave(t - SAD, 1.4) * 1.2
  const head = t < CATCH ? 0 : mix(t, SAD, SAD + 0.5, 0, 7)
  const face = t < CATCH ? 'smile' : t < SAD ? 'surprised' : t < CALL ? 'sad' : 'cry'
  return {
    ...walking,
    y: GROUND,
    look: CHILD_LOOK,
    pack: CHILD_PACK,
    face,
    pose: stuck ? { ...frozen, leftArm: left, rightArm: right, torso: lean, head } : walking.pose,
  }
}

/** みんな: ひもに きづかず、おなじ ちょうしで さきへ あるいていく(だんだん とおく) */
function Friend({ t, index }: { readonly t: number; readonly index: number }) {
  const spec = FRIENDS[index]
  const w = walk(t, { from: spec.from, to: spec.to, start: 0.1, end: DONE, build: 'child', height: FRIEND_HEIGHT, step: 5.5 })
  const y = mix(t, CATCH, DONE, 94, 91.5, easeOut)
  return <Person {...w} y={y} look={spec.look} pack={spec.pack} face="smile" hairSway={wave(t, 0.4) * 6} />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 9)
  const child = childAt(t)
  const rig = personRig(child)
  const ankle = rig.world.legs.left.end
  const tangle = span(t, CATCH, CATCH + 0.3)
  const coilX = caughtAnkle()[0]
  const surprise = during(t, CATCH, CATCH + 0.9, 0.15)
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[100, 12]} clouds={[[10, 10, 0.9]]} ground={90} tufts={[]} />
        <Path near={[-6, 100, 10]} far={[116, 100, 10]} />
        {[10, 38, 64, 90].map((x) => <Tuft key={x} x={x} y={91} color={PALETTE.leaf} />)}
        <Coil x={coilX} />
        {FRIENDS.map((_, i) => <Friend key={i} t={t} index={i} />)}
        <Person {...child} />
        <Tangle ankle={ankle} amount={tangle} />
        <Notice x={rig.world.head[0]} y={rig.world.head[1]} r={rig.body.headR * rig.scale} show={surprise} />
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
    { at: 0, label: 'みんなと いっしょに みちを あるく', sound: 'pop' },
    { at: CATCH, label: 'ひもが あしに からまって、びっくり', sound: 'pop' },
    { at: SAD, label: 'みんなは さきへ。子は うごけず かなしくなる' },
    { at: CALL, label: '「まってー」と 手をのばす' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '後 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
