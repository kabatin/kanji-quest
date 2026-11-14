/*
 * 前(まえ): 男の子が 足を ふねに のせて、ふねは まえへ すすむ。(共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)  ※ 字の形に合わせて 絵を ゆがめず、だいたい 同じ場所・同じ向き に おいた
 *   1・2画目(丷)   … 空を とぶ 2わの 鳥
 *   3画目(一)      … 空に ながれる 雲
 *   4・5画目       … ざんばしの 2ほんの くい と、そのあいだの ロープ
 *   6・7画目       … ざんばしの 板(男の子の 足もと)と、したの はり
 *   8画目(丨)      … ふねの 小さな はしら
 *   9画目(丨)      … ふねの 大きな はしら(ほは その みぎに ふくらむ)
 *
 * ながれ
 *   水べに ざんばしが でき、ふねが うかぶ → 男の子が あるいてきて、ふねを ふしぎそうに 見る
 *   → どきどき しながら 足を そっと ふねへ のばし、「ぽん」と のせる(ふねが ゆれて、ひやり)
 *   → もう 片足も のって、ゆれが おさまると にっこり
 *   → 風が ふいて ほが ふくらみ、ふねが すいすい まえ(みぎ)へ すすむ。男の子は まえを ゆびさして ごきげん
 *   → ほね が ひかって、絵が うすくなり、字「前」が のこる
 *
 * 男の子は Person。あるく ところは walk、ふねへ のばす 足は { to } で 足先を きめる。
 * こし は 両足が とどく 高さに おく(足が ながく なったり ちぢんだり しない)。
 * ふねは 水に うかび、体が のった ぶんだけ しずんで ゆれる。ほは 風を うけると ふくらむ。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Bird, Clouds, CLOTHES, Hills, LOOKS, PALETTE, Person, Sun, Wind, personRig, walk, type PersonPose } from '../sceneFigures'

const CHAR = '前'

const BARK = PALETTE.bark
const BARK_DARK = '#70452b'
const DECK_TOP = '#b88555'
const HULL = '#d95f48'
const HULL_DARK = '#b84a36'
const HULL_RIM = '#f3e4c2'
const SAIL = '#ffeebd'
const SAIL_LINE = '#e6c98a'
const ROPE = '#d9c28a'
const WATER = PALETTE.water
const WATER_FRONT = '#5aaee8'
const WATER_LIGHT = '#bfe4fa'

/** くぎり の時間(秒) */
const WALK_FROM = 0.4
/** ざんばしの はしに ついて、ふねを 見る */
const ARRIVE = 2.3
/** 足を ふねへ のばしはじめる */
const REACH = 2.9
/** 1ほんめの 足が ふねに のる */
const LAND = 3.5
/** もう 片足を のせる */
const BOARD_FROM = 3.8
const BOARD_TO = 4.4
/** 風が ふいて、ほが ふくらみ、ふねが すすむ */
const WIND = 4.6
const SAIL_END = 6.2
const INK = 6.5
const DONE = 9.7
const DURATION = 10.2

/* ───────── 寸法(座標は 109 x 109) ───────── */

type Pt = readonly [number, number]

/** ざんばしの 板の うえ、ふねの かんぱん の たかさ、水面 */
const PIER_TOP = 59.5
const DECK_Y = 66
const WATER_Y = 74
/** ふねの 左はし(ふねの 絵は この ざひょうで かく。bx で よこに うごく) */
const BOAT_PIVOT: Pt = [78, 70]
const BOY_HEIGHT = 32
/** 立った ときの こし から 地面 まで(足の ながさ) */
const LEG_LEN = -personRig({ x: 0, y: 0, build: 'child', height: BOY_HEIGHT }).world.pelvis[1]
const BOY_LOOK = { ...LOOKS.boy, top: CLOTHES.yellow.top, bottom: '#3e5c86' } as const

const rad = (deg: number) => (deg * Math.PI) / 180
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/* ───────── 水・空 ───────── */

function waterPath(t: number, amp: number): string {
  const points = Array.from({ length: 29 }, (_, i) => {
    const x = -4 + i * 4.2
    return `${x.toFixed(1)} ${(WATER_Y + amp * Math.sin(x * 0.16 + t * 1.9)).toFixed(2)}`
  })
  return `M-4 102 L${points.join(' L')} L114 102 Z`
}

/** なみの 白い すじ。水が ながれる(ふねが すすむと はやく ながれる)。 */
function Ripples({ scroll }: { readonly scroll: number }) {
  return (
    <>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const row = i % 3
        const x = ((((i * 41 - scroll) % 130) + 130) % 130) - 12
        return <path key={i} d={`M${x} ${80 + row * 7} q3 -1.6 6 0`} fill="none" stroke={WATER_LIGHT} strokeWidth="1.1" strokeLinecap="round" />
      })}
    </>
  )
}

/** 1・2画目: 空を ゆったり とぶ 鳥 */
function Gull({ t, x, y, phase }: { readonly t: number; readonly x: number; readonly y: number; readonly phase: number }) {
  const appear = span(t, 0.3, 0.9)
  const gx = x + 9 * Math.sin(((t - INK) / 5.5) * Math.PI * 2)
  const gy = y + 1.6 * wave(t, 1.9, phase)
  return (
    <Layer opacity={appear}>
      <Bird x={gx} y={gy} t={t + phase} flying facing="right" size={0.9} />
    </Layer>
  )
}

/* ───────── ざんばし ───────── */

/** 4〜7画目: くい と 板。くい は 水から 立ちあがる。 */
function Pier({ t }: SceneProps) {
  const grow = span(t, 0, 0.6, backOut)
  return (
    <Layer scaleY={grow} scaleX={0.7 + 0.3 * grow} origin={[26, 96]}>
      <rect x="5" y="62" width="3.4" height="34" rx="1.4" fill={BARK_DARK} />
      <rect x="24.6" y="45" width="3.8" height="51" rx="1.7" fill={BARK} />
      <rect x="45.8" y="45" width="3.8" height="51" rx="1.7" fill={BARK} />
      <path d="M28 47.2 Q37 51.4 45.8 47.2" fill="none" stroke={ROPE} strokeWidth="1.4" strokeLinecap="round" />
      <rect x="27" y="70.4" width="19" height="3" rx="1" fill={BARK_DARK} />
      <rect x="-4" y={PIER_TOP} width="54" height="3.6" rx="1" fill={DECK_TOP} />
      <rect x="-4" y={PIER_TOP + 3.6} width="54" height="3" fill={BARK_DARK} />
      <path d="M6 60.4 v1.4 M17 60.4 v1.4 M29 60.4 v1.4 M41 60.4 v1.4" stroke={BARK} strokeWidth="0.7" strokeLinecap="round" />
    </Layer>
  )
}

/* ───────── ふね ───────── */

/** 8・9画目: 2ほんの はしら と ほ。belly は ほの ふくらみ(0 = だらん / 1 = 風で ぱんぱん) */
function Boat({ t, belly }: { readonly t: number; readonly belly: number }) {
  const flutter = wave(t, 0.5) * 0.8
  const sailRight = 81.2 + 17 * belly + 2
  return (
    <>
      <rect x="62.9" y="47.4" width="2.2" height="19.6" rx="1" fill={BARK} />
      <path d={`M65 48.4 q${3.6 + flutter} -1.2 ${7 + flutter} 0.4 q${-3.4} 2.4 -7 2.6 Z`} fill="#e8534a" />
      <rect x="79.9" y="40" width="2.2" height="26.6" rx="1" fill={BARK} />
      <path d={`M82.1 41 q${4 + flutter} -1.4 ${8} 0.5 q-4 2.4 -8 1.8 Z`} fill="#e8534a" />
      <path d={`M81.2 44 C${82.2 + 9 * belly} 47 ${83.2 + 20 * belly} 54 ${sailRight} 61.6 L81.2 61.6 Z`} fill={SAIL} />
      <path d={`M81.2 52.6 Q${84 + 8 * belly} 54.6 ${sailRight - 2.2} 57.6`} fill="none" stroke={SAIL_LINE} strokeWidth="0.9" strokeLinecap="round" />
      <rect x="80.2" y="61.4" width="19.4" height="1.8" rx="0.9" fill={BARK_DARK} />
      <path d={`M51 ${DECK_Y} H100 Q98.5 77 90 80.5 H61.5 Q53 77 51 ${DECK_Y} Z`} fill={HULL} />
      <path d="M54 75.2 H97 Q95 78.6 90 80.5 H61.5 Q56 78.6 54 75.2 Z" fill={HULL_DARK} />
      <path d={`M51 ${DECK_Y} H100 L99.6 ${DECK_Y + 2.4} H51.4 Z`} fill={HULL_RIM} />
      {[63, 72, 81].map((x) => (
        <circle key={x} cx={x} cy="72.2" r="1.7" fill="#fff3c4" />
      ))}
    </>
  )
}

/** ざんばしの くい と ふねを むすぶ ロープ。風で ふねが うごきだすと、ほどけて 水に たれる。 */
function MooringRope({ t, bx }: { readonly t: number; readonly bx: number }) {
  const cut = span(t, WIND - 0.1, WIND + 0.3)
  if (cut < 1) {
    const end: Pt = [52 + bx, DECK_Y + 0.6]
    return <path d={`M48 58 Q${(48 + end[0]) / 2} ${(58 + end[1]) / 2 + 2 + cut * 10} ${end[0]} ${end[1] + cut * 8}`} fill="none" stroke={ROPE} strokeWidth="1.3" strokeLinecap="round" />
  }
  const sway = wave(t, 1.6) * 0.8
  return <path d={`M48 58 q${0.4 + sway} 8 ${1.4 + sway} 15.4`} fill="none" stroke={ROPE} strokeWidth="1.3" strokeLinecap="round" />
}

/* ───────── 男の子 ───────── */

/** 両足を ちゃんと とどかせる こしの たかさ(足が ながくなったり ちぢんだり しない) */
function hipHeight(feet: readonly Pt[], hx: number): number {
  const reach = LEG_LEN * 0.98
  return Math.min(...feet.map(([x, y]) => y - Math.sqrt(Math.max(0, reach ** 2 - (x - hx) ** 2))))
}

/* ───────── 小さな にぎやかし ───────── */

/** ふねが のった しゅんかんの みずしぶき と わ */
function Splash({ t, bx }: { readonly t: number; readonly bx: number }) {
  const show = during(t, LAND, LAND + 1, 0.1)
  if (show <= 0) return null
  const p = span(t, LAND, LAND + 1, easeOut)
  const cx = 54 + bx
  return (
    <g opacity={show}>
      <ellipse cx={cx} cy={WATER_Y + 1} rx={3 + 9 * p} ry={0.8 + 2 * p} fill="none" stroke="#ffffff" strokeWidth="0.9" />
      {[-1, 0, 1].map((k) => (
        <circle key={k} cx={cx + k * 3.4 * (0.6 + p)} cy={WATER_Y - Math.sin(Math.min(1, p * 1.6) * Math.PI) * (4 + (k === 0 ? 2 : 0))} r={1 - p * 0.5} fill="#ffffff" />
      ))}
    </g>
  )
}

/** ふねの うしろに のこる しろい なみ(すすんでいる ときだけ) */
function Wake({ t, bx }: { readonly t: number; readonly bx: number }) {
  const going = during(t, WIND + 0.2, SAIL_END + 1.4, 0.4)
  if (going <= 0) return null
  return (
    <g opacity={going}>
      {[0, 1, 2].map((i) => (
        <ellipse key={i} cx={50 + bx - i * 6.4 - 2} cy={WATER_Y + 1.6 + wave(t, 0.8, i * 0.3) * 0.5} rx={2.6 + i * 0.8} ry="0.9" fill="#ffffff" opacity={0.95 - i * 0.25} />
      ))}
    </g>
  )
}

/** ゆれ(だんだん ちいさくなる)。u は ゆれ はじめから の秒。 */
const ring = (u: number, period: number, decay: number) => (u <= 0 ? 0 : Math.exp(-decay * u) * Math.sin((u / period) * Math.PI * 2))

/** 男の子の 場所と かっこう。ざんばしを あるく → 足を ふねへ → のりこむ */
function boyAt(t: number, boat: { readonly bx: number; readonly by: number; readonly brot: number }) {
  const hx = 44.5
  const w = walk(t, { from: -8, to: hx, start: WALK_FROM, end: ARRIVE, build: 'child', height: BOY_HEIGHT })
  const settle = span(t, BOARD_TO, BOARD_TO + 0.6, easeOut)
  const deckFoot = (local: number): Pt => [boat.bx + local, DECK_Y + boat.by + (local - BOAT_PIVOT[0]) * Math.sin(rad(boat.brot))]
  const nearEnd = deckFoot(lerp(54.5, 56.5, settle))
  const farEnd = deckFoot(lerp(52, 53.5, settle))
  const nearStart: Pt = [hx + 0.5, PIER_TOP]
  const farStart: Pt = [hx - 0.5, PIER_TOP]
  // 手まえの足(まえの足): そっと ふねへ のばして のせる。うしろの足: ざんばしを はなれて ふねへ
  const reachNear = span(t, REACH, LAND, easeInOut)
  const boardFar = span(t, BOARD_FROM, BOARD_TO, easeInOut)
  const lift = (k: number) => Math.sin(k * Math.PI) * 6
  const nearFoot: Pt = [lerp(nearStart[0], nearEnd[0], reachNear), lerp(nearStart[1], nearEnd[1], reachNear) - lift(reachNear)]
  const farFoot: Pt = [lerp(farStart[0], farEnd[0], boardFar), lerp(farStart[1], farEnd[1], boardFar) - lift(boardFar)]

  // うで: ふねに のるときは バランスを とる。さいごは まえを ゆびさす
  const balance = span(t, REACH - 0.1, REACH + 0.2) * (1 - span(t, BOARD_TO, BOARD_TO + 0.5))
  const point = span(t, 5.0, 5.7, easeOut)
  const hang = { swing: 5, bend: 14 }
  const nearBal = { swing: 55 + 25 * wave(t, 0.55), bend: 20 }
  const farBal = { swing: -50 + 25 * wave(t, 0.55, 0.3), bend: 15 }
  const leftArm = { swing: lerp(lerp(hang.swing, nearBal.swing, balance), 108, point), bend: lerp(lerp(hang.bend, nearBal.bend, balance), 8, point) }
  const rightArm = { swing: lerp(hang.swing, farBal.swing, balance) - 4 * point, bend: lerp(hang.bend, farBal.bend, balance) }
  const mood = t < REACH ? 'normal' : t < BOARD_TO + 0.1 ? 'worried' : 'joy'
  const lean = 6 * span(t, REACH - 0.2, LAND, easeInOut) * (1 - span(t, BOARD_FROM, BOARD_TO + 0.3))

  if (t < REACH) return { ...w, y: PIER_TOP, mood } as const
  // こし は 両足の まんなか の 上(足が ふねへ うつると いっしょに すすむ)
  const hipX = (farFoot[0] + nearFoot[0]) / 2
  const hip = hipHeight([farFoot, nearFoot], hipX)
  const pose: PersonPose = { leftLeg: { to: nearFoot }, rightLeg: { to: farFoot }, leftArm, rightArm, torso: lean, head: -3 }
  return { x: hipX, y: hip + LEG_LEN, facing: 'right', build: 'child', height: BOY_HEIGHT, pose, mood } as const
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 9)

  // ふね: 体が のると しずんで ゆれる。風を うけると まえ(みぎ)へ すすむ
  const sail = span(t, WIND, SAIL_END, easeInOut)
  const bx = -1 + 5 * sail
  const by = 0.45 * wave(t, 2.6) + 1.8 * ring(t - LAND, 0.7, 2.6) + 1.0 * ring(t - BOARD_TO, 0.7, 2.8)
  const brot = -2.4 * ring(t - LAND, 0.9, 2) - 1.0 * ring(t - BOARD_TO, 0.9, 2.2)
  const belly = 0.12 + 0.88 * span(t, WIND - 0.2, WIND + 0.7, backOut)
  const boy = boyAt(t, { bx, by, brot })

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sun t={t} />
        <Clouds t={t} at={[[54, 22, 1.5]]} speed={0.6} />
        <Gull t={t} x={38} y={19} phase={0} />
        <Gull t={t} x={68} y={18} phase={0.9} />
        <Hills y={-16} />
        <path d={waterPath(t, 0.7)} fill={WATER} />
        <Ripples scroll={t * 3 + 22 * sail} />
        <Wind t={t} x={14} y={40} show={during(t, WIND - 0.3, SAIL_END + 0.4, 0.3)} reach={62} />
        <Pier t={t} />
        <Layer opacity={span(t, 0.5, 0.8)}>
          <MooringRope t={t} bx={bx} />
        </Layer>
        <Layer opacity={span(t, 0.3, 0.8)}>
          <Layer x={bx} y={by} rotate={brot} origin={BOAT_PIVOT} scale={0.6 + 0.4 * span(t, 0.3, 0.9, backOut)}>
            <Boat t={t} belly={belly} />
          </Layer>
        </Layer>
        <Layer opacity={span(t, WALK_FROM, WALK_FROM + 0.2)}>
          <Person {...boy} look={BOY_LOOK} face={boy.mood} />
        </Layer>
        {/* 水の てまえ がわ(ふなぞこ と くい が 水に つかる) */}
        <path d={waterPath(t, 0.7)} fill={WATER_FRONT} opacity="0.5" />
        <Splash t={t} bx={bx} />
        <Wake t={t} bx={bx} />
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
    { at: 0, label: 'ざんばし と ふね が できる', sound: 'pop' },
    { at: WALK_FROM + 0.1, label: '男の子が あるいてくる' },
    { at: REACH, label: 'どきどき しながら 足を ふねへ' },
    { at: LAND, label: 'ふねに 足を のせる', sound: 'pop' },
    { at: BOARD_TO, label: 'もう 片足も のって にっこり' },
    { at: WIND, label: '風で ほが ふくらみ、まえへ すすむ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '前 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
