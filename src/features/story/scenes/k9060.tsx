/*
 * 遠(とおい): 子どもが みちを ずっと ずっと あるいて いく。それでも ゴールの おうちは まだ とおい。
 *
 * ほね(画と絵の対応)
 *   13画目(辶の 下の よこ線)  … 子どもが あるく みち(ながい みち)
 *   11画目(辶の てん)        … みちの はじまり(左うえ)。いまは ぼうしの かわりに 空のくも
 *   12画目(辶の ジグザグ)    … 子どもの あるいてきた あし あと の みち(ここは 絵の 右うえの ほうを うすく のこす)
 *   1〜10画目(袁)            … 右の おかの うえの とおい おうち と、そのまわりの 空(だいたい 同じ あたり)
 *   ※ 子どもの からだ は 字の形に合わせず、ほんものの 人の つくり で かく
 *
 * ながれ
 *   子どもが おうちを 出て、げんきに みちを あるく(まわりの 木が うしろへ ながれていく)
 *   → ずっと あるいて あせが 出て、つかれてくる(あしが おそく なる)
 *   → とまって「ふう」。手を ひたいに かざして、おかの 上の とおい おうちを 見る(まだ とおい)
 *   → 「よし!」と こぶしを あげる(また あるく ぞ) → ほね が ひかり、絵が うすくなって 字「遠」が のこる
 *
 * 人は 共通部品 Person。あるきは walk() を「世界の x」で 計算し、画面の 子どもは カメラ が おいかける:
 *   足が 地面で すべらない まま、まわりの 木と みち が うしろへ ながれる。
 *   「おそくなる うごき」は walk() に わたす 時計を おくらせて 作る(足の ふみだし も 同じように おそくなる)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Bone, Ink, Layer, Sparkles } from '../sceneParts'
import { Bird, Clouds, House, LOOKS, mixLimb, PALETTE, Person, personRig, Sigh, Sun, Sweat, Tree, walk, type Limb, type LimbAngles, type PersonProps } from '../sceneFigures'

const CHAR = '遠'

const GRASS = '#c5e8a9'
const HILL = '#e2f2d2'
const HILL_NEAR = '#cfe9b8'
const ROAD = '#ead3a4'
const ROAD_DARK = '#d6b983'

/** くぎり の時間(秒) */
const START = 0.3
const TIRED = 2.8
/** とまって「ふう」 */
const STOP = 4.9
/** 手を ひたいに かざして、とおくを 見る */
const LOOK = 5.4
/** 「よし!」 */
const CHEER = 5.95
const INK = 6.3
const DONE = 9.3
const DURATION = 9.8

/** みち の まんなかの 点(13画目の 線と、左右に のばした ところ)。子どもの 足もとの 高さを きめる */
const ROAD_POINTS: readonly (readonly [number, number])[] = [
  [-6, 82.4],
  [15.3, 83],
  [26.6, 81.9],
  [37.7, 84.5],
  [48.8, 87.4],
  [59.8, 90.3],
  [70.8, 93.2],
  [82.1, 94.8],
  [93.5, 94],
  [116, 92.5],
]

/** x の ところの みち の高さ(点と点の間は まっすぐ つなぐ) */
function roadY(x: number): number {
  for (let i = 1; i < ROAD_POINTS.length; i += 1) {
    const [x1, y1] = ROAD_POINTS[i]
    if (x <= x1) {
      const [x0, y0] = ROAD_POINTS[i - 1]
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
    }
  }
  return ROAD_POINTS[ROAD_POINTS.length - 1][1]
}

/** 子どもの 立つ ばしょ(画面の x)。ここまで 来たら、あとは カメラ が おいかけて まわりが うしろへ ながれる */
const KID_X = 31
/** 子どもが 入ってくる 画面の 左はし(世界の x の はじまり) */
const KID_FROM = -10
/** あるく きょり の おわり(世界の x)。カメラ が 動く ぶん が 118 */
const WALK_TO = KID_X + 118
/** 子どもの 背の高さ(画面の 単位) */
const KID_HEIGHT = 30

/** 世界の x が 画面を 1しゅう する はば(これを こえると 同じ木が また 出る) */
const WORLD = 150

/** 世界の位置 wx の ものが、カメラ が scroll だけ すすんだときの 画面の x */
const screenX = (wx: number, scroll: number) => ((((wx - scroll) % WORLD) + WORLD) % WORLD) - 22

/** あるきの 時計: はじめ は 早く、つかれて だんだん おそく、STOP で とまる */
const walkClock = (t: number) => START + (STOP - START) * easeOut(span(t, START, STOP))

/* ───────── まわりの ようす ───────── */

function Sky({ t }: SceneProps) {
  return (
    <>
      <Sun t={t} x={96} y={14} r={6.2} />
      {/* ゆっくり ながれる 雲(とおい ものは ゆっくり うごく) */}
      <Clouds t={t} at={[[42, 13, 1], [87, 31, 0.8]]} speed={1.1} />
    </>
  )
}

/** とおくの おか と、その うえの ゴールの おうち。ほとんど うごかない(まだ とおい) */
function FarHill({ t }: SceneProps) {
  const glow = during(t, LOOK - 0.1, CHEER + 0.25, 0.25)
  return (
    <>
      <path d="M20 90 Q55 60 125 74 V92 H20 Z" fill={HILL} />
      <path d="M40 90 Q70 52 125 66 V92 H40 Z" fill={HILL_NEAR} />
      {/* ゴールの おうち(ちいさい)。ちいさい のは とおい から。えんとつ から けむり */}
      <rect x="89.4" y="54" width="1.6" height="3" fill="#b9483f" />
      <path d={`M90.2 ${52.8 - (t % 1.6) * 1.4} q1.4 -1.6 0 -3`} fill="none" stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round" opacity="0.8" />
      <House x={86} y={64.8} width={11} />
      {/* 子どもが 見たとき、おうちが ぱっと ひかる */}
      <g opacity={glow * 0.8} fill="none" stroke={PALETTE.sun} strokeWidth="1" strokeLinecap="round">
        <circle cx="86" cy="62" r={7 + glow * 2} />
        <path d="M86 49 v-3 M95 52 l2 -2 M77 52 l-2 -2" />
      </g>
    </>
  )
}

/** みちの ざり(いしころ)。カメラ が すすんだ分だけ うしろへ ながれて、すすんでいる のが わかる */
function Pebbles({ scroll }: { readonly scroll: number }) {
  return (
    <>
      {[4, 22, 41, 58, 77, 96, 113, 131].map((wx, i) => {
        const x = screenX(wx, scroll * 1.5)
        return <ellipse key={wx} cx={x} cy={roadY(x) + (i % 2 === 0 ? 1.4 : -1.2)} rx={i % 3 === 0 ? 1.5 : 1} ry="0.6" fill={ROAD_DARK} />
      })}
    </>
  )
}

function Ground({ t, scroll }: SceneProps & { readonly scroll: number }) {
  return (
    <>
      <path d="M-4 80 Q30 76 60 80 T113 82 V101 H-4 Z" fill={GRASS} />
      {[[0, 0.95], [38, 1.15], [60, 0.85], [112, 1.05]].map(([wx, s]) => (
        <Tree key={wx} x={screenX(wx, scroll)} y={80.5} height={30 * s} />
      ))}
      {/* みち: 13画目の線の うえ。ながい ながい みち */}
      <Layer opacity={span(t, 0, 0.5)}>
        <path d="M-6 82.4 L15.25 83 M93.5 94 L116 92.5" fill="none" stroke={ROAD} strokeWidth="8" strokeLinecap="round" />
        <Bone char={CHAR} n={13} color={ROAD} width={8} />
        <Pebbles scroll={scroll} />
      </Layer>
    </>
  )
}

/* ───────── 子ども(主役) ───────── */

/** 青い 服・こんの ズボン・赤い リュック(せおったまま あるく) */
const KID_LOOK = { ...LOOKS.boy, top: '#4f9be0', bottom: '#3e5c86' } as const
const KID_PACK = { kind: 'rucksack', color: '#e8534a' } as const

/** とまった あとの うで: だらんと → 手を ひたいに かざす → 「よし!」で こぶしを ま上へ。右むき の てまえ = 左うで */
function stoppedArms(t: number, base: PersonProps, nearWalk: LimbAngles, farWalk: LimbAngles) {
  const hang: LimbAngles = { swing: 4, bend: 8 }
  const rig = personRig({ ...base, pose: {} })
  const [hx, hy] = rig.world.head
  const r = rig.body.headR * rig.scale
  // 手の ひらを ひたいの まえへ(ひさし の ように)
  const brow = { to: [hx + r * 0.95, hy - r * 0.45] } as const
  const salute = span(t, LOOK, LOOK + 0.45, easeInOut)
  const fist = span(t, CHEER - 0.05, CHEER + 0.3, backOut)
  const fistUp: LimbAngles = { swing: 165, bend: 10 }
  const near = t < STOP ? nearWalk : t >= CHEER - 0.05 ? mixLimb(brow, fistUp, fist) : mixLimb(hang, brow, salute)
  return { leftArm: near, rightArm: t < STOP ? farWalk : hang }
}

/** うでの ふりの 角度(あるきの ポーズ は 角度で 入っている) */
const swingOf = (limb: Limb | undefined): number => (limb && 'swing' in limb ? limb.swing : 4)

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 13)

  // あるく: 世界の x を walk() で 計算。画面の 子どもは KID_X で とまり、カメラ が おいかける(足は すべらない)
  const w = walk(walkClock(t), { from: KID_FROM, to: WALK_TO, start: START, end: STOP, build: 'child', height: KID_HEIGHT, armSwing: 28 })
  const scroll = Math.max(0, w.x - KID_X)
  const kidX = w.x - scroll
  const feetY = roadY(kidX)
  // みちの かたむき に合わせて 少し 体を かたむける
  const slope = (Math.atan2(roadY(kidX + 4) - roadY(kidX - 4), 8) * 180) / Math.PI

  // つかれて まえかがみ になる → とまる → しゃんと する
  const tired = span(t, TIRED, STOP - 0.3, easeInOut)
  const lean = tired * 5 * (1 - span(t, LOOK, LOOK + 0.4)) + slope * 0.4
  // 「よし!」で ぴょん と はねる
  const hop = Math.sin(span(t, CHEER, CHEER + 0.45) * Math.PI) * 4
  const face = t >= CHEER ? 'smile' : t >= LOOK ? 'normal' : t >= TIRED ? 'sad' : 'joy'
  const headTilt = t < TIRED ? 0 : t < LOOK ? 6 * tired : mix(t, LOOK, LOOK + 0.4, 6, -7) + (t >= CHEER ? 5 * span(t, CHEER - 0.05, CHEER + 0.3, backOut) : 0)

  const kid: PersonProps = { x: kidX, y: feetY, facing: 'right', build: 'child', height: KID_HEIGHT, look: KID_LOOK, pack: KID_PACK, lean, lift: hop }
  // つかれると うでの ふりが 小さく なる
  const slack = 1 - 0.43 * tired
  const nearWalk: LimbAngles = { swing: swingOf(w.pose.leftArm) * slack, bend: 16 }
  const farWalk: LimbAngles = { swing: swingOf(w.pose.rightArm) * slack, bend: 16 }
  const pose = { ...(t < STOP ? w.pose : {}), ...stoppedArms(t, kid, nearWalk, farWalk), head: headTilt }

  const rig = personRig({ ...kid, pose: {} })
  const head = rig.world.head
  const headR = rig.body.headR * rig.scale
  const sigh = span(t, STOP + 0.1, LOOK + 0.35, easeOut)
  const birdP = span(t, 1.2, 5.2)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <FarHill t={t} />
        <Ground t={t} scroll={scroll} />
        {birdP > 0 && birdP < 1 && <Bird x={-6 + birdP * 125} y={22 + Math.sin(birdP * 9) * 3} t={t} flying facing="right" size={0.8} />}
        <Layer opacity={span(t, START - 0.1, START + 0.15)}>
          <Person {...kid} face={face} pose={pose} />
          <Sweat t={t} x={head[0] - headR * 0.9} y={head[1] - headR * 0.5} show={during(t, TIRED + 0.1, STOP + 0.6, 0.3)} />
          <Sigh x={head[0] + headR * 0.9} y={head[1] + headR * 0.45} p={sigh} show={during(t, STOP + 0.1, LOOK + 0.35, 0.2)} dir={1} />
        </Layer>
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
    { at: 0, label: '長い みちが ある。子どもが おうちを 出る', sound: 'pop' },
    { at: START + 1, label: 'げんきに あるく。木が うしろへ ながれる' },
    { at: TIRED, label: 'ずっと あるいて、あせ が 出て つかれてくる' },
    { at: STOP, label: 'とまって「ふう」', sound: 'pop' },
    { at: LOOK, label: '手を かざして とおくの おうちを 見る。まだ とおい' },
    { at: CHEER, label: '「よし!」また あるくぞ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '遠 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
