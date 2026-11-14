/*
 * 先(さき): かけっこで、あしが さきに でて ゴール。(共通部品 sceneFigures で 書きなおした ためし)
 *
 * ほね(画と絵の対応)  ※ 元の 本番場面 と おなじ 「手まえへ はしってくる」 構図。字には「だいたい」重なる くらい
 *   1画目(ノ)  … はちまきの ながい しっぽ(あたまの ひだりから 下へ たれ、はしると なびく)
 *   2画目(一)  … ゴールの しゅんかん、よろこんで ひろげた りょううで
 *   3画目(丨)  … あたま と どう(まっすぐ立った 体)
 *   4画目(一)  … ゴールの テープ(左右の ポールの間)
 *   5・6画目   … ふみだした あし と、ゴールの ポール の あしもと
 *
 * ながれ
 *   ゴールの ポールと テープが たつ → 男の子と ライバルが スタートに ならぶ(どきどき)
 *   → 「どん!」と はしりだす。男の子が じわじわ ぬいていく(ライバルは おくれる)
 *   → 男の子の あしが、だれより さきに ゴールへ でる → テープが ぷつん ときれる
 *   → りょううでを ひろげて 「やったー!」(紙ふぶき)。ライバルは くやしそう
 *   → ほね が ひかって、絵が うすくなり、字「先」が のこる
 *
 * はしりは runDepth()。足あと を 先に きめるので 足は すべらない。2人は 手まえへ むかって 2本の みちを はしる。
 */
import { backOut, during, inkTiming, span, easeOut, wave, type SceneModule, type SceneProps } from '../../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../../sceneParts'
import { Backdrop, ByDepth, GoalPole, GoalTape, HANG_ARM, LOOKS, mixLimb, Path, Person, personRig, runDepth, Sweat, type DepthRunPlan } from '../../sceneFigures'
import type { ReactNode } from 'react'

const CHAR = '先'

const TRACK = '#d9a07c'
const TAPE = '#ff5d73'

/** くぎり の時間(秒) */
const GO = 1.7
const BREAK = 4.8
const INK = 6.4
const DONE = 8.7
const DURATION = 9.2

/** ゴール(元の 本番場面 と おなじ 場所): ポール 2本 の x、あしもと、てっぺん。テープ は 4画目 の ところ */
const POLE_XS = [16, 93.6] as const
const POLE_BASE = 97
const POLE_TOP = 44
const TAPE_LEFT = [17, 53.3] as const
const TAPE_RIGHT = [92.6, 49.6] as const

const BOY_LOOK = { ...LOOKS.boy, top: '#ff9a3c', bottom: '#3e5c86', sleeves: 'short', accent: '#e8534a' } as const
const RIVAL_LOOK = { ...LOOKS.boy, hair: '#3a2a22', top: '#4f9be0', bottom: '#34507a', sleeves: 'short' } as const

/** 男の子: おくから てまえへ(小さい → 大きい)。BREAK に ゴール の 線(y 96)へ。背は 立った 高さ */
const BOY_RUN: DepthRunPlan = { from: [33, 74], to: [53, 96], start: GO, end: BREAK, height: 52, toHeight: 84, stride: 40 }
/** ライバル: おなじ ところから はしるが、だんだん おくれる(ゴールの てまえ で とまる) */
const RIVAL_RUN: DepthRunPlan = { from: [64, 74], to: [80, 91.5], start: GO, end: BREAK + 0.6, height: 49, toHeight: 76, stride: 36 }

/* ───────── 場所 ───────── */

/** かけっこの みち と、ゴールの しろくろ もよう(2だん) と、スタートの 白い線 */
function Track() {
  return (
    <>
      <Path near={[55, 110, 58]} far={[49, 69, 23]} color={TRACK} />
      <path d="M29 73.4 L70 73.4" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      {Array.from({ length: 20 }, (_, i) =>
        [0, 1].map((row) => <rect key={`${i}-${row}`} x={12 + i * 4.2} y={94 + row * 2.2} width="4.2" height="2.2" fill={(i + row) % 2 === 0 ? '#3a3a3a' : '#ffffff'} />),
      )}
    </>
  )
}

/** ゴールの ポール2本 と テープ。テープ は 男の子 の むねで おされて のび、BREAK で ぷつん と きれる */
function Goal({ t }: SceneProps) {
  const rise = span(t, 0.1, 0.7)
  const show = span(t, 0.35, 0.8)
  const pull = span(t, BREAK - 0.7, BREAK, easeOut)
  return (
    <>
      {POLE_XS.map((x) => (
        <GoalPole key={x} x={x} base={POLE_BASE} top={POLE_TOP} grow={rise} width={2.8} />
      ))}
      {t < BREAK ? <GoalTape a={TAPE_LEFT} b={TAPE_RIGHT} pull={[0, 4 * pull]} show={show} width={2.6} /> : <GoalTape a={TAPE_LEFT} b={TAPE_RIGHT} cut={span(t, BREAK, BREAK + 0.5, easeOut)} width={2.6} />}
    </>
  )
}

/** ゴールした しゅんかんの 紙ふぶき(ちぎれた テープの かけら と きらきら) */
function Confetti({ t }: SceneProps) {
  const p = t - BREAK
  if (p <= 0 || p > 1.7) return null
  const pieces = [
    { vx: -24, vy: -26, spin: 300, color: TAPE },
    { vx: -13, vy: -34, spin: -240, color: '#ffd24a' },
    { vx: -4, vy: -38, spin: 200, color: '#7cc4f2' },
    { vx: 6, vy: -33, spin: -320, color: TAPE },
    { vx: 15, vy: -36, spin: 260, color: '#8bd69a' },
    { vx: 25, vy: -27, spin: -200, color: '#ffd24a' },
    { vx: 31, vy: -18, spin: 340, color: '#7cc4f2' },
    { vx: -31, vy: -17, spin: -280, color: '#8bd69a' },
  ]
  return (
    <g opacity={1 - span(p, 1.1, 1.7)}>
      {pieces.map((piece, i) => (
        <rect key={i} x="-1.6" y="-0.9" width="3.2" height="1.8" rx="0.4" fill={piece.color} transform={`translate(${55 + piece.vx * p} ${30 + piece.vy * p + 24 * p * p}) rotate(${piece.spin * p})`} />
      ))}
    </g>
  )
}

/* ───────── はちまき(あたまに つける もの。あたまの まんなか が 0,0、半径 1。正面) ───────── */

/** あたまを ひとまわり する はちまき と、ひだりがわ から 下へ たれる ながい しっぽ(1画目)。flutter で しっぽ が かぜに ゆれる */
function Headband({ color, flutter }: { readonly color: string; readonly flutter: number }): ReactNode {
  return (
    <g fill="none" stroke={color} strokeLinecap="round">
      <path d="M-0.98 -0.12 Q0 -0.6 0.98 -0.12" strokeWidth="0.3" />
      <g transform={`rotate(${flutter} -0.98 -0.1)`}>
        <path d="M-0.98 -0.1 Q-1.25 0.3 -1.1 0.8" strokeWidth="0.3" />
      </g>
    </g>
  )
}

/** 男の子 の はしる 風の すじ(男の子の ひだりがわ を ながれる) */
function WindStreaks({ t, x, y, scale }: { readonly t: number; readonly x: number; readonly y: number; readonly scale: number }) {
  const on = during(t, GO + 0.4, BREAK - 0.1, 0.3) * 0.7
  return (
    <g opacity={on} stroke="#c58763" strokeWidth="1.6" strokeLinecap="round">
      {[0.2, 0.45, 0.7].map((k, i) => {
        const slide = (t * 30 + i * 5) % 12
        return <path key={k} d={`M${x - 22 * scale - slide} ${y - k * 84 * scale} h${8 - slide * 0.3}`} />
      })}
    </g>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)
  const appear = span(t, 0.5, 0.8)

  // 男の子: スタート → ゴール(てまえへ はしる)。ゴールで りょううでを ひろげる
  const boy = runDepth(t, BOY_RUN)
  const finished = t >= BREAK
  const joy = span(t, BREAK + 0.1, BREAK + 0.6, backOut)
  const spread = { swing: 95, bend: 4 }
  const cheerPose = { leftArm: mixLimb(HANG_ARM, spread, joy), rightArm: mixLimb(HANG_ARM, spread, joy) }
  const hop = Math.sin(span(t, BREAK + 0.1, BREAK + 0.7) * Math.PI) * 3
  const wind = t < GO ? 0 : t < BREAK ? span(t, GO, GO + 0.6) : 1 - 0.5 * span(t, BREAK, INK)

  // ライバル: おなじ ところから はしるが、だんだん おくれる
  const rival = runDepth(t, RIVAL_RUN)
  const rivalSad = t >= BREAK
  const rivalHead = personRig({ ...rival, pose: {} }).world.head

  const go = during(t, GO - 0.05, GO + 0.5, 0.15)
  const flash = span(t, BREAK - 0.12, BREAK + 0.5)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  // 地面に 立つ もの は 足もと の y の じゅん。テープ は きれる まえ は 男の子の まえ、きれた あと は うしろ
  const items = [
    {
      key: 'rival',
      z: rival.y,
      node: (
        <Layer opacity={appear}>
          <Person {...rival} look={RIVAL_LOOK} face={rivalSad ? 'sad' : 'strain'} headwear={<Headband color="#ffffff" flutter={wave(t, 0.3) * 6} />} />
        </Layer>
      ),
    },
    {
      key: 'boy',
      z: boy.y,
      node: (
        <Layer opacity={appear}>
          <WindStreaks t={t} x={boy.x} y={boy.y} scale={boy.height / 84} />
          <Person {...boy} look={BOY_LOOK} face={finished ? 'joy' : 'strain'} lift={boy.lift + hop} pose={finished ? cheerPose : boy.pose} headwear={<Headband color="#e8534a" flutter={wave(t, 0.25) * 10 * wind} />} />
        </Layer>
      ),
    },
    { key: 'goal', z: t < BREAK ? 200 : 0, node: <Goal t={t} /> },
  ]

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[100, 9]} tufts={[]} />
        <Track />
        <ByDepth items={items} />
        <Sweat t={t} x={rivalHead[0] - 9} y={rivalHead[1] - 2} show={during(t, BREAK + 0.2, INK, 0.3) * appear} />
        {/* 「どん!」: はしりだす ところの ぴかっ */}
        <g opacity={go}>
          <Star cx={34} cy={66} r={4 + go * 2} color="#ffd24a" spin={go * 90} />
          <Star cx={45} cy={63} r={2.6} color="#ffffff" spin={20} />
        </g>
        {/* 足が さきに でた! ふみだした つまさきの ひかり */}
        <g opacity={flash * (1 - flash) * 4}>
          <Star cx={74} cy={91} r={6 * flash + 1} color="#ffd24a" spin={flash * 120} />
          <Star cx={80} cy={86} r={3} color="#ffffff" spin={40} />
        </g>
        <Confetti t={t} />
        <Sparkles cx={55} cy={46} progress={span(t, BREAK, BREAK + 0.8)} reach={26} count={8} />
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
    { at: 0, label: 'ゴールの ポールと テープが たつ', sound: 'pop' },
    { at: 0.9, label: 'スタートに ならぶ。どきどき' },
    { at: GO, label: 'どん! はしりだす', sound: 'pop' },
    { at: 3.2, label: 'ぐんぐん ぬいていく' },
    { at: BREAK, label: 'あしが さきに でて、テープが ぷつん', sound: 'stroke' },
    { at: BREAK + 0.9, label: 'りょううでを ひろげて、やったー!' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '先 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
