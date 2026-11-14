/*
 * 正(ただしい): あしが 線に むかって まっすぐ すすむ。(共通部品 sceneFigures で 書きなおした もの)
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … スタートの ポール と ゴールの ポール の間に はった、かざりの はた(上の 線)
 *   2画目(丨)  … 立ちどまった子の あたま・どう・あし(まっすぐ立つ 体)
 *   3画目(一)  … その子が ゴールに むかって まっすぐ のばした うで(ゆびさす)
 *   4画目(丨)  … 子が はじめに いた「スタートの くい」(うしろに のこる)
 *   5画目(一)  … 地面に ひいた チョークの 線(子の あし は この 線の上を すすむ)
 *   2〜5画目   … 止(とまる)= あし。あしが 線に むかって すすんで、ぴたっと とまる
 *
 * ながれ
 *   スタートの くいと、地面の チョークの線 → 子が どっちへ いけば いいか わからず きょろきょろ(「?」)
 *   → 線の さきに ゴールの はたが ぽんと たつ。子は「あっ!」と おどろき、かざりの はたが ひろがる
 *   → うれしくなって、線の上を まっすぐ あるいていく(ほこりが ふわっ)
 *   → ゴールの まえで ぴたっと とまって、うでを まっすぐ のばして ゆびさす
 *   → ほね が ひかって、絵が うすくなり、字「正」が のこる
 *
 * 子は Person(右むき)。あるくのは walk、ゆびさす うで は { to: 3画目の おわり } で、とどかなければ のばした まま その むきを さす。
 * 字の形に なるのは、とまって ゆびさした さいごの しゅんかん だけ(体は ゆがめない)。
 * 道は Path、ポールは GoalPole、「?」「あっ」・あせ・ほこり・小鳥は 部品。スタートの くい・チョーク・かざりの はた・ゴールの はた は ここで 描く。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Bird, Dust, GoalPole, Notice, PALETTE, Path, Person, personRig, mixLimb, Question, Sweat, walk, type Limb, type PersonProps } from '../sceneFigures'

const CHAR = '正'

const WOOD = PALETTE.wood
const WOOD_DARK = PALETTE.barkDark
const GRASS = PALETTE.grass
const CHALK = '#ffffff'
const RED = '#e8534a'
const BLUE = '#5f7fd6'
const SUN = PALETTE.sun
const KID_LOOK = { top: '#ee7a4d', bottom: '#3e5c86' } as const

/** くぎり の時間(秒) */
const SHOW = 0.3
const WORRY = 1.0
/** ゴールの はたが ぽんと たつ(子が「あっ!」) */
const FLAG = 2.4
const BUNTING = 2.8
const MARCH = 3.4
const STOP = 5.4
const INK = 6.2
const DONE = 8.8
const DURATION = 9.6

/** 子の まんなか(2画目の 線の x)と、足もと・背の高さ */
const CX = 55
const FEET_Y = 92
const KID_HEIGHT = 62
/** 子が さいしょに いる ばしょ(まんなか から 左へ ずれた分) */
const START_X = CX - 37
/** 3画目の 書きおわり(ゆびさした 手先) */
const HAND_GOAL: readonly [number, number] = [81.9, 51.8]

/** ゴールの ポール(右)と スタートの ポール(左) */
const GOAL_X = 94
const START_POLE_X = 8
/** かざりの はた の ひも の 高さ(1画目の 線に そろえる) */
const stringY = (x: number) => 20.5 + (GOAL_X - x) * 0.058

/** あるきの 計画(あるきはじめ から とまるまで) */
const WALK_PLAN = { from: START_X, to: CX, start: MARCH, end: STOP, build: 'child', height: KID_HEIGHT } as const

/** 子の ばしょ・かっこう・顔。まよう → びっくり → うれしい の じゅん */
function kidAt(t: number): PersonProps {
  const w = walk(t, WALK_PLAN)
  const lost = t < FLAG
  // まよっている間は あたまを きょろきょろ。「あっ」で ぐっと 上を むき、ゴールを みつめる
  const head = lost ? 5 + wave(t, 2.0) * 7 : mix(t, FLAG, FLAG + 0.3, 5, -9, easeOut)
  // とまったら、ゴールへ まっすぐ ゆびさす(あるく うで の まま から のばす)
  const point = span(t, STOP - 0.2, STOP + 0.6, easeInOut)
  const swinging: Limb = w.pose.leftArm ?? { swing: 4, bend: 10 }
  const pointing: Limb = { to: HAND_GOAL }
  return {
    ...w,
    y: FEET_Y,
    look: KID_LOOK,
    face: t < FLAG ? 'worried' : t < MARCH ? 'surprised' : 'smile',
    lift: Math.sin(span(t, FLAG, FLAG + 0.4) * Math.PI) * 3.2,
    opacity: span(t, SHOW, SHOW + 0.3),
    pose: { ...w.pose, leftArm: mixLimb(swinging, pointing, point), head: t > STOP ? head - 2 : head },
  }
}

/** スタートの くい(4画目)と チョークの 線(5画目)。じめんの 絵は さいしょから ある。 */
function Marks({ t }: SceneProps) {
  const chalk = span(t, 0.2, 1.1, easeOut)
  const stake = span(t, 0.1, 0.5, backOut)
  return (
    <>
      <Bone char={CHAR} n={5} color={CHALK} width={2.4} to={chalk} />
      <Layer scaleY={stake} origin={[28.5, 92]}>
        <Bone char={CHAR} n={4} color={WOOD} width={3.8} />
        <circle cx="29.7" cy="57" r="1.9" fill={WOOD_DARK} />
        {/* くいの 先の 小さな はた */}
        <path d="M30.6 58.4 L37.4 61 L30.6 63.8 Z" fill={BLUE} />
      </Layer>
    </>
  )
}

const FLAG_COLORS = [RED, SUN, '#4f9be0', PALETTE.leaf] as const
const FLAG_XS = [88, 79, 70, 61, 52, 43, 34, 25, 16] as const

/** ゴールの ポールの はた と、かざりの はた の ひも(1画目の 線)。ポール は GoalPole。 */
function Goal({ t }: SceneProps) {
  const pole = span(t, FLAG - 0.2, FLAG + 0.45, backOut)
  const flagWave = wave(t, 0.9) * 1.3
  const unfurl = span(t, BUNTING, BUNTING + 0.9, easeOut)
  return (
    <>
      <GoalPole x={START_POLE_X} base={FEET_Y} top={17} grow={span(t, 0.1, 0.5)} />
      <GoalPole x={GOAL_X} base={FEET_Y} top={11} grow={pole} />
      <Layer scale={Math.max(0, pole)} origin={[GOAL_X, 12]}>
        <path d={`M${GOAL_X + 1.4} 12.4 Q${GOAL_X + 5.8} ${12.8 + flagWave} ${GOAL_X + 11} ${15 + flagWave * 0.6} Q${GOAL_X + 5.8} ${18.6 + flagWave} ${GOAL_X + 1.4} 20 Z`} fill={RED} />
        <circle cx={GOAL_X + 4.6} cy={16.2 + flagWave * 0.3} r="1.5" fill="#ffffff" />
      </Layer>
      {unfurl > 0 && (
        <>
          <line x1={GOAL_X} y1={stringY(GOAL_X)} x2={START_POLE_X} y2={stringY(START_POLE_X)} stroke={WOOD_DARK} strokeWidth="0.9" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - unfurl} />
          {FLAG_XS.map((x, i) => {
            const from = (GOAL_X - x) / (GOAL_X - START_POLE_X)
            const pop = Math.max(0, span(unfurl, from, from + 0.12, backOut))
            const y = stringY(x)
            return (
              <Layer key={x} scale={pop} origin={[x, y]}>
                <path d={`M${x - 3} ${y} L${x + 3} ${y} L${x} ${y + 6} Z`} fill={FLAG_COLORS[i % FLAG_COLORS.length]} />
              </Layer>
            )
          })}
        </>
      )}
    </>
  )
}

/** あるく ときの ほこり。あしもとから ふわっと 出る(うしろ あし の あたり)。 */
function Puffs({ t }: SceneProps) {
  return (
    <>
      {[0, 1, 2, 3, 4].map((k) => {
        const start = MARCH + 0.1 + k * 0.4
        return <Dust key={k} x={walk(start, WALK_PLAN).x - 7} y={FEET_Y - 1} p={span(t, start, start + 0.55)} reach={7} />
      })}
    </>
  )
}

/** そらを とぶ 小鳥。ゴールの ほうへ むかう。 */
function Flyer({ t }: SceneProps) {
  const p = span(t, MARCH, STOP + 0.8)
  if (p <= 0 || p >= 1) return null
  return <Bird x={-6 + p * 120} y={11 + Math.sin(p * 8) * 2.2} t={t} flying facing="right" />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)
  const kid = kidAt(t)
  const rig = personRig(kid)
  const [headX, headY] = rig.world.head
  const headR = rig.body.headR * rig.scale
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const sparkle = span(t, FLAG, FLAG + 0.7)
  const askShow = during(t, WORRY, FLAG + 0.1, 0.2)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[74, 11]} clouds={[[42, 8, 0.7]]} tufts={[]} />
        <rect x="-2" y="82" width="113" height="30" fill={GRASS} />
        <Path near={[-2, 90.2, 4.8]} far={[111, 90.2, 4.8]} />
        <Marks t={t} />
        <Goal t={t} />
        <Sparkles cx={GOAL_X + 4} cy={16} progress={sparkle} reach={13} count={6} />
        <Puffs t={t} />
        <Person {...kid} />
        <Sweat t={t} x={headX - headR - 1} y={headY - headR * 0.6} show={during(t, WORRY - 0.1, FLAG, 0.2)} />
        <Question x={headX + 9} y={headY - headR - 6} show={askShow * span(t, WORRY, WORRY + 0.3, backOut)} t={t} />
        <Question x={headX - 7} y={headY - headR - 9} show={askShow * span(t, WORRY + 0.4, WORRY + 0.7, backOut)} t={t + 0.4} size={6} />
        <Notice x={headX + 9} y={headY - headR - 4} r={headR} show={during(t, FLAG + 0.1, MARCH + 0.3, 0.15)} />
        <Flyer t={t} />
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
    { at: 0, label: 'スタートの くいと、地面の 線', sound: 'pop' },
    { at: WORRY, label: 'どっちへ いけば いいのかな?' },
    { at: FLAG, label: 'あっ、線の さきに ゴールの はた!', sound: 'pop' },
    { at: MARCH, label: '線の上を まっすぐ すすむ' },
    { at: STOP, label: 'ゴールの まえで とまって ゆびさす' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '正 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
