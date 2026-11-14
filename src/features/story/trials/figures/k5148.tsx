/*
 * 先(さき): かけっこで、あしが さきに でて ゴール。(共通部品 sceneFigures で 書きなおした ためし)
 *
 * ほね(画と絵の対応)  ※ 2人は 横から 見た かけっこ。字には「だいたい」重なる くらい
 *   1画目(ノ)  … はちまきの ながい しっぽ(かぜで うしろへ なびく)
 *   2画目(一)  … ゴールの しゅんかん、よろこんで ひろげた りょううで
 *   3画目(丨)  … あたま と どう(まっすぐ立った 体)
 *   4画目(一)  … ゴールの テープ(ポールの間。横から 見ると ななめ)
 *   5・6画目   … ふみだした あし と、ゴールの ポール の あしもと
 *
 * ながれ
 *   ゴールの ポールと テープが たつ → 男の子と ライバルが スタートに ならぶ(どきどき)
 *   → 「どん!」と はしりだす。男の子が じわじわ ぬいていく(ライバルは おくれる)
 *   → 男の子の むねが、だれより さきに テープへ とどく → テープが ぷつん ときれる
 *   → こちらへ むいて りょううでを ひろげ 「やったー!」(紙ふぶき)。ライバルは くやしそう
 *   → ほね が ひかって、絵が うすくなり、字「先」が のこる
 *
 * はしりは run()。足あと を 先に きめるので 足は すべらない。2人は 手まえと おくの 2つの みちを はしる。
 */
import { backOut, during, inkTiming, span, easeOut, wave, type SceneModule, type SceneProps } from '../../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../../sceneParts'
import { Backdrop, LOOKS, mixLimb, Path, Person, run, Sweat, turnAround, type RunPlan } from '../../sceneFigures'
import type { ReactNode } from 'react'

const CHAR = '先'

const TRACK = '#d9a07c'
const TAPE = '#ff5d73'
const POLE_RED = '#e8534a'

/** くぎり の時間(秒) */
const GO = 1.7
const BREAK = 4.8
const INK = 6.4
const DONE = 8.7
const DURATION = 9.2

/** 手まえの みち(男の子)と おくの みち(ライバル)の 地面の y */
const NEAR_LANE = 96
const FAR_LANE = 89

const BOY_LOOK = { ...LOOKS.boy, top: '#ff9a3c', bottom: '#3e5c86', sleeves: 'short', accent: '#e8534a' } as const
const RIVAL_LOOK = { ...LOOKS.boy, hair: '#3a2a22', top: '#4f9be0', bottom: '#34507a', sleeves: 'short' } as const

const BOY_RUN: RunPlan = { from: 6, to: 61, start: GO, end: BREAK, height: 56, stride: 18 }
const RIVAL_RUN: RunPlan = { from: 24, to: 44, start: GO, end: BREAK + 1.0, height: 52, stride: 12 }

/** ゴールの ポール: 手まえ(x=72)と おく(x=56)。テープ は この 2本の てっぺんの 間 */
const NEAR_POLE = { x: 72, base: 102, top: 60 } as const
const FAR_POLE = { x: 56, base: 83, top: 47 } as const

/* ───────── 場所 ───────── */

function Pole({ t, x, base, top }: { readonly t: number; readonly x: number; readonly base: number; readonly top: number }) {
  const rise = span(t, 0.1, 0.7, backOut)
  const h = base - top
  return (
    <Layer scaleY={rise} origin={[x, base]}>
      <rect x={x - 1.2} y={top} width="2.4" height={h} rx="1" fill="#ffffff" />
      {[0.25, 0.5, 0.75].map((k) => (
        <rect key={k} x={x - 1.2} y={top + h * k} width="2.4" height={h * 0.12} fill={POLE_RED} />
      ))}
      <circle cx={x} cy={top} r="2.2" fill={POLE_RED} />
    </Layer>
  )
}

function Track({ t }: SceneProps) {
  return (
    <>
      <Path near={[-4, 92.5, 9.5]} far={[113, 92.5, 9.5]} color={TRACK} />
      {/* スタートの 白い線 */}
      <path d="M17 101 L12 84" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
      {/* ゴールの 白い線(ポールの あしもと を むすぶ) */}
      <path d={`M${NEAR_POLE.x} ${NEAR_POLE.base - 1} L${FAR_POLE.x} ${FAR_POLE.base + 1}`} stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" opacity={span(t, 0.1, 0.5)} />
    </>
  )
}

/** てっぺん 2つを むすぶ テープ。at(0 = 手まえ〜1 = おく)の ところ だけ えがく。男の子の みちは およそ 0.32 */
function TapePiece({ t, from, to }: { readonly t: number; readonly from: number; readonly to: number }) {
  const show = span(t, 0.35, 0.8)
  if (show <= 0 || t >= BREAK) return null
  const pull = span(t, BREAK - 0.7, BREAK, easeOut)
  const point = (k: number): readonly [number, number] => {
    const bow = Math.sin(k * Math.PI) * pull * 6
    return [NEAR_POLE.x + (FAR_POLE.x - NEAR_POLE.x) * k - bow, NEAR_POLE.top + 2 + (FAR_POLE.top - NEAR_POLE.top) * k + bow * 0.3]
  }
  const [a, b] = [point(from), point(to)]
  return <path d={`M${a[0]} ${a[1]} L${b[0]} ${b[1]}`} stroke={TAPE} strokeWidth="2.2" strokeLinecap="round" opacity={show} />
}

/** ちぎれた あとの テープ: それぞれの ポールから たれる */
function BrokenTape({ t }: SceneProps) {
  if (t < BREAK) return null
  const fall = span(t, BREAK, BREAK + 0.5, easeOut)
  return (
    <g fill="none" stroke={TAPE} strokeWidth="2.2" strokeLinecap="round">
      <path d={`M${NEAR_POLE.x} ${NEAR_POLE.top} Q${NEAR_POLE.x - 2} ${NEAR_POLE.top + 4 + fall * 4} ${NEAR_POLE.x - 3} ${NEAR_POLE.top + 8 + fall * 12}`} />
      <path d={`M${FAR_POLE.x} ${FAR_POLE.top} Q${FAR_POLE.x - 1} ${FAR_POLE.top + 3 + fall * 3} ${FAR_POLE.x - 2} ${FAR_POLE.top + 6 + fall * 9}`} />
    </g>
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
        <rect key={i} x="-1.6" y="-0.9" width="3.2" height="1.8" rx="0.4" fill={piece.color} transform={`translate(${62 + piece.vx * p} ${40 + piece.vy * p + 24 * p * p}) rotate(${piece.spin * p})`} />
      ))}
    </g>
  )
}

/* ───────── はちまき(あたまに つける もの。あたまの まんなか が 0,0、半径 1) ───────── */

/** あたまを ひとまわり する はちまき と、うしろへ なびく ながい しっぽ(1画目)。tail = しっぽの むき(0 = うしろへ まっすぐ / -70 = 下へ たれる) */
function Headband({ color, tail, flutter, front }: { readonly color: string; readonly tail: number; readonly flutter: number; readonly front: boolean }): ReactNode {
  // 正面: しっぽ は あたまの ひだりがわ から 下へ たれる(顔に かぶらない)
  const pivot = front ? '-0.98 -0.1' : '-0.95 -0.2'
  const tailPath = front ? 'M-0.98 -0.1 Q-1.25 0.3 -1.1 0.8' : 'M-0.95 -0.2 Q-1.9 -0.4 -2.9 -0.1'
  return (
    <g fill="none" stroke={color} strokeLinecap="round">
      <path d={front ? 'M-0.98 -0.12 Q0 -0.6 0.98 -0.12' : 'M-0.97 -0.22 Q0 -0.92 0.97 -0.18'} strokeWidth="0.3" />
      <g transform={front ? undefined : `rotate(${tail + flutter} ${pivot})`}>
        <path d={tailPath} strokeWidth="0.3" />
      </g>
    </g>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)
  const appear = span(t, 0.5, 0.8)

  // 男の子: スタート → ゴール。ゴールで こちらへ むいて、りょううでを ひろげる
  const boy = run(t, BOY_RUN)
  const turn = turnAround(t, BREAK + 0.1, 'right', 'front')
  const finished = t >= BREAK
  const joy = span(t, BREAK + 0.1, BREAK + 0.6, backOut)
  const spread = { swing: 88, bend: 4 }
  const cheerPose = { rightArm: mixLimb({ swing: 8, bend: 6 }, spread, joy), leftArm: mixLimb({ swing: 8, bend: 6 }, spread, joy) }
  const hop = Math.sin(span(t, BREAK + 0.1, BREAK + 0.7) * Math.PI) * 3
  const wind = t < GO ? 0 : t < BREAK ? span(t, GO, GO + 0.6) : 1 - 0.5 * span(t, BREAK, INK)
  const tailAngle = -70 + 70 * wind

  // ライバル: おなじ ところから はしるが、だんだん おくれる
  const rival = run(t, RIVAL_RUN)
  const rivalSad = t >= BREAK

  const go = during(t, GO - 0.05, GO + 0.5, 0.15)
  const flash = span(t, BREAK - 0.12, BREAK + 0.5)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[100, 9]} tufts={[]} />
        <Track t={t} />
        <Pole t={t} {...FAR_POLE} />
        {/* ライバル(おくの みち) */}
        <Layer opacity={appear}>
          <Person {...rival} y={FAR_LANE} look={RIVAL_LOOK} face={rivalSad ? 'sad' : 'normal'} pose={{ ...rival.pose, torso: (rival.pose.torso ?? 0) + (rivalSad ? 6 : 0) }} headwear={<Headband color="#ffffff" tail={t < GO ? -70 : -10} flutter={wave(t, 0.3) * 6} front={false} />} />
          <Sweat t={t} x={RIVAL_RUN.to - 6} y={FAR_LANE - 50} show={during(t, BREAK + 0.2, INK, 0.3)} />
        </Layer>
        {/* テープの おく がわ(男の子の うしろ) */}
        <TapePiece t={t} from={0.32} to={1} />
        {/* 男の子(てまえの みち) */}
        <Layer opacity={appear}>
          <g opacity={during(t, GO + 0.4, BREAK - 0.1, 0.3) * 0.7} stroke="#c58763" strokeWidth="1.6" strokeLinecap="round">
            {[50, 62, 74].map((y, i) => {
              const slide = (t * 30 + i * 5) % 12
              return <path key={y} d={`M${34 - slide} ${y} h${8 - slide * 0.3}`} />
            })}
          </g>
          <Person
            {...boy}
            {...turn}
            y={NEAR_LANE}
            look={BOY_LOOK}
            face={finished ? 'joy' : 'normal'}
            lift={boy.lift + hop}
            pose={finished ? cheerPose : boy.pose}
            headwear={<Headband color="#e8534a" tail={tailAngle} flutter={wave(t, 0.25) * 8 * wind} front={turn.facing === 'front'} />}
          />
        </Layer>
        {/* テープの てまえ がわ(男の子の まえ) と ちぎれた テープ */}
        <TapePiece t={t} from={0} to={0.32} />
        <BrokenTape t={t} />
        <Pole t={t} {...NEAR_POLE} />
        {/* 「どん!」: はしりだす ところの ぴかっ */}
        <g opacity={go}>
          <Star cx={22} cy={90} r={4 + go * 2} color="#ffd24a" spin={go * 90} />
          <Star cx={30} cy={86} r={2.6} color="#ffffff" spin={20} />
        </g>
        {/* ゴール! むねが さきに でた ひかり */}
        <g opacity={flash * (1 - flash) * 4}>
          <Star cx={70} cy={60} r={6 * flash + 1} color="#ffd24a" spin={flash * 120} />
          <Star cx={72} cy={52} r={3} color="#ffffff" spin={40} />
        </g>
        <Confetti t={t} />
        <Sparkles cx={58} cy={46} progress={span(t, BREAK, BREAK + 0.8)} reach={26} count={8} />
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
    { at: BREAK, label: 'むねが さきに でて、テープが ぷつん', sound: 'stroke' },
    { at: BREAK + 0.9, label: 'りょううでを ひろげて、やったー!' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '先 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
