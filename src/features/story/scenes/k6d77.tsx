/*
 * 海(うみ): 水が いっぱい あつまって ひろがる ところ。
 *
 * ほね(画と絵の対応)
 *   1・2画目(さんずい の 2つの てん) … わき水の しずくが ながれていく 川すじ の はじまり
 *   3画目(はねる 線)        … 川が 海に むかって ながれこむ ところ
 *   4〜8画目(毎 の 上と どう)  … 海の 水が ひろがった おおきな ひろがり
 *   9画目(よこ線)           … 海の いちばん むこう の 水平線(さいごは 水の おもて が ここまで あがる)
 *
 * ながれ
 *   おかの わき水から 水の こぞう「ぽつ」が 生まれる。ひとりぼっちで しんぱい顔
 *   → ころころ 川を ながれ下る。ともだちの 水つぶが 1つ・2つ・3つ と 川に とびこんで ついてくる
 *   → みんなで うれしくなる → 海に ざぶん。水が ふえて、海が どんどん ひろがる
 *   → 海が 水平線まで ひろがった しゅんかん、ほね が ひかって、絵が うすくなり、字「海」が のこる
 *
 * 水つぶ・川・海は、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   川は 高い所(わき水)から 低い所(海)へ ながれる。海の おもては たいらで、波で ゆれる。
 *   水が ふえると 海の おもて が あがる(だから 「水が あつまって ひろがる」)。
 */
import { backOut, during, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '海'

const SUN = '#ffd24a'
const GRASS = '#c5e8a9'
const GRASS_DARK = '#a9d98a'
const SAND = '#f3e2b0'
const ROCK = '#b9c4cf'
const ROCK_DARK = '#9aa8b6'
const LEAF = '#55b86e'
const SEA_BACK = '#6bb8ec'
const SEA_DEEP = '#4f9fdc'
const SEA_FRONT = '#7cc4f2'
const DROP = '#7cc4f2'
const DROP_SHADE = '#56aae6'
const DROP_LIGHT = '#e8f6ff'
const RIVER = '#8fd0f6'
const EYE = '#2b2b2b'
const MOUTH = '#c4504a'
const CHEEK = '#ff9d9d'
const BIRD_LINE = '#7d8da3'

/** くぎり の時間(秒) */
/** 水の こぞう が ころころ ながれはじめる */
const GO = 1.2
/** 川の おわり(海の すぐ手前)に つく */
const ARRIVE = 3.6
/** 海へ とびこむ 時間 */
const JUMP = 0.45
/** 海の 水が ふえはじめる / ひろがりきる */
const SEA_RISE = 4.1
const SEA_FULL = 6.3
const INK = 6.8
const DONE = 9.4
const DURATION = 10

/* ───────── 川(わき水 → 海) ───────── */

/** 川すじ の通り道(わき水 → 海)。1・2・3画目の あたりを ながれる */
const RIVER_PTS: readonly (readonly [number, number])[] = [
  [20, 19],
  [18, 28],
  [16, 36],
  [15, 44],
  [17, 52],
  [23, 59],
  [31, 63],
  [38, 66],
]
const SEGMENTS = RIVER_PTS.slice(1).map((pt, i) => Math.hypot(pt[0] - RIVER_PTS[i][0], pt[1] - RIVER_PTS[i][1]))
const RIVER_LEN = SEGMENTS.reduce((sum, len) => sum + len, 0)

/** 川の p(0〜1)の所の 場所 */
function along(p: number): readonly [number, number] {
  let rest = Math.min(Math.max(p, 0), 1) * RIVER_LEN
  for (let i = 0; i < SEGMENTS.length; i += 1) {
    if (rest <= SEGMENTS[i] || i === SEGMENTS.length - 1) {
      const k = SEGMENTS[i] === 0 ? 0 : Math.min(rest / SEGMENTS[i], 1)
      const [ax, ay] = RIVER_PTS[i]
      const [bx, by] = RIVER_PTS[i + 1]
      return [ax + (bx - ax) * k, ay + (by - ay) * k]
    }
    rest -= SEGMENTS[i]
  }
  return RIVER_PTS[RIVER_PTS.length - 1]
}

/** 川の かどを まるめた線 */
const RIVER_D = (() => {
  const mid = (i: number) => [(RIVER_PTS[i][0] + RIVER_PTS[i + 1][0]) / 2, (RIVER_PTS[i][1] + RIVER_PTS[i + 1][1]) / 2]
  const parts = [`M${RIVER_PTS[0][0]} ${RIVER_PTS[0][1]}`, `L${mid(0)[0]} ${mid(0)[1]}`]
  for (let i = 1; i < RIVER_PTS.length - 1; i += 1) {
    parts.push(`Q${RIVER_PTS[i][0]} ${RIVER_PTS[i][1]} ${mid(i)[0]} ${mid(i)[1]}`)
  }
  parts.push(`L${RIVER_PTS[RIVER_PTS.length - 1][0]} ${RIVER_PTS[RIVER_PTS.length - 1][1]}`)
  return parts.join(' ')
})()

/** 水の こぞう が 川を ころがる 度合い(0〜1)。ゆっくり はじまり、ゆっくり つく */
const roll = (time: number) => (1 - Math.cos(Math.PI * span(time, GO, ARRIVE))) / 2

/* ───────── 海 ───────── */

/** 海の 水の おもて の 高さ(ふえるほど あがる) */
const seaTop = (t: number) => 86 - 6 * span(t, 0.2, 1.2, easeOut) - 23 * span(t, SEA_RISE, SEA_FULL, easeOut)
/** x の所の 水の おもて(波で ゆれる) */
const surf = (x: number, t: number) => seaTop(t) + Math.sin(x * 0.22 + t * 2.2) * 1.1
/** てまえの 波の おもて(水つぶの 足もとが すこし かくれる) */
const surfFront = (x: number, t: number) => surf(x, t) + 1.2 + Math.sin(x * 0.3 + t * 2.8 + 1) * 0.8

const SEA_X0 = 34
const SEA_XS = Array.from({ length: 27 }, (_, i) => SEA_X0 + i * 3)
/** てまえの 波は、すなはま の そと から はじめる(おかの上に かぶらない) */
const FRONT_X0 = 43

const wavePoints = (height: (x: number) => number, xs: readonly number[] = SEA_XS) => xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x} ${height(x).toFixed(2)}`).join(' ')

function Sea({ t }: SceneProps) {
  const back = wavePoints((x) => surf(x, t))
  return (
    <>
      <path d={`${back} V101 H${SEA_X0} Z`} fill={SEA_BACK} />
      <path d={`M${SEA_X0} 101 V90 Q60 86 109 91 V101 Z`} fill={SEA_DEEP} opacity="0.55" />
      <path d={back} fill="none" stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round" strokeDasharray="3 5" strokeDashoffset={-t * 4} opacity="0.75" />
    </>
  )
}

function SeaFront({ t }: SceneProps) {
  const front = wavePoints((x) => surfFront(x, t), SEA_XS.filter((x) => x >= FRONT_X0))
  return <path d={`${front} V101 H${FRONT_X0} Z`} fill={SEA_FRONT} opacity="0.88" />
}

/* ───────── おか・けしき ───────── */

const COAST = 'M-2 4 Q22 2 32 26 Q38 40 38 58 Q38 64 39 70 Q40 85 39 101 H-2 Z'

function Land() {
  return (
    <>
      {/* すなはま は、おか より すこし 海がわ に はみ出す */}
      <g transform="translate(2.6 0)">
        <path d={COAST} fill={SAND} />
      </g>
      <path d={COAST} fill={GRASS} />
      <path d="M-2 88 Q16 82 40 90 V101 H-2 Z" fill={GRASS_DARK} />
      {[
        [6, 70],
        [24, 80],
        [8, 94],
      ].map(([x, y]) => (
        <path key={`${x}-${y}`} d={`M${x} ${y} l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

function Sky({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[97, 11]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="96.2" y="-0.4" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 97 11)`} />
        ))}
      </Layer>
      <circle cx="97" cy="11" r={5.6 * sun} fill={SUN} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="56" cy="40" rx="7" ry="3.2" />
        <ellipse cx="61" cy="38" rx="5" ry="3.2" />
        <ellipse cx="82" cy="30" rx="6" ry="2.8" />
        <ellipse cx="86.5" cy="28.4" rx="4.4" ry="3" />
      </g>
    </>
  )
}

/** わき水の いずみ(岩に かこまれた 小さな 水たまり) */
function Spring({ t }: SceneProps) {
  const pop = span(t, 0.05, 0.5, backOut)
  const ripple = (t * 0.9) % 1
  return (
    <Layer scale={pop} origin={[20, 20]}>
      <ellipse cx="20" cy="21" rx="9" ry="4.6" fill={ROCK_DARK} />
      <ellipse cx="20" cy="20.2" rx="9" ry="4.2" fill={ROCK} />
      <ellipse cx="20" cy="20.6" rx="6.4" ry="2.8" fill={RIVER} />
      <ellipse cx="20" cy="20.6" rx={1.5 + ripple * 4.2} ry={0.6 + ripple * 1.2} fill="none" stroke="#ffffff" strokeWidth="0.6" opacity={1 - ripple} />
    </Layer>
  )
}

function RiverWater({ t }: SceneProps) {
  const drawn = Math.min(roll(t) + 0.04, 1)
  if (roll(t) <= 0) return null
  return (
    <>
      <path d={RIVER_D} fill="none" stroke={RIVER} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${drawn} 2`} />
      <path d={RIVER_D} fill="none" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" pathLength={1} strokeDasharray="0.03 0.06" strokeDashoffset={-t * 0.3} opacity="0.7" />
    </>
  )
}

/** 空を とぶ かもめ。右から左へ わたっていく */
function Gull({ t }: SceneProps) {
  const show = during(t, 0.8, 5.8, 0.4)
  if (show <= 0) return null
  const x = mix(t, 0.8, 5.8, 112, -8, (v) => v)
  const y = 17 + Math.sin(t * 1.3) * 2.5
  const flap = 0.55 + 0.45 * wave(t, 0.5)
  return (
    <Layer x={x} y={y} scaleY={flap} opacity={show}>
      <path d="M-4.6 0.6 Q-2.3 -2.8 0 0 Q2.3 -2.8 4.6 0.6" fill="none" stroke={BIRD_LINE} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </Layer>
  )
}

/* ───────── 水の こぞう ───────── */

type Mood = 'worry' | 'smile' | 'joy'

const DROP_BODY = 'M0 -16 C2 -11 6 -9 6 -6 A6 6 0 1 1 -6 -6 C-6 -9 -2 -11 0 -16 Z'

/** 水つぶ。足もと(いちばん下)が 原点。look = 目の むき(-1 左 〜 1 右) */
function Drop({ mood, look }: { readonly mood: Mood; readonly look: number }) {
  const eyeDx = look * 0.7
  return (
    <>
      <path d={DROP_BODY} fill={DROP_SHADE} />
      <g transform="translate(-0.5 -0.9) translate(0 -6) scale(0.88) translate(0 6)">
        <path d={DROP_BODY} fill={DROP} />
      </g>
      <ellipse cx="-2.8" cy="-9.4" rx="1" ry="1.9" fill={DROP_LIGHT} transform="rotate(18 -2.8 -9.4)" />
      <ellipse cx="-3.9" cy="-4.4" rx="1" ry="0.7" fill={CHEEK} opacity="0.6" />
      <ellipse cx="3.9" cy="-4.4" rx="1" ry="0.7" fill={CHEEK} opacity="0.6" />
      {mood === 'joy' ? (
        <>
          <path d="M-3.7 -6 Q-2.4 -8 -1.1 -6" fill="none" stroke={EYE} strokeWidth="0.9" strokeLinecap="round" />
          <path d="M1.1 -6 Q2.4 -8 3.7 -6" fill="none" stroke={EYE} strokeWidth="0.9" strokeLinecap="round" />
          <path d="M-1.9 -4.2 Q0 -1.2 1.9 -4.2 Z" fill={MOUTH} />
        </>
      ) : (
        <>
          <circle cx={-2.3 + eyeDx} cy="-6.4" r="0.95" fill={EYE} />
          <circle cx={2.3 + eyeDx} cy="-6.4" r="0.95" fill={EYE} />
          {mood === 'worry' ? (
            <>
              <path d="M-3.9 -8.4 L-1.4 -9.3 M3.9 -8.4 L1.4 -9.3" fill="none" stroke={EYE} strokeWidth="0.7" strokeLinecap="round" />
              <path d="M-1.4 -3.1 Q-0.7 -4 0 -3.2 Q0.7 -4 1.4 -3.1" fill="none" stroke={MOUTH} strokeWidth="0.8" strokeLinecap="round" />
            </>
          ) : (
            <path d="M-1.8 -4.3 Q0 -2.3 1.8 -4.3" fill="none" stroke={MOUTH} strokeWidth="0.9" strokeLinecap="round" />
          )}
        </>
      )}
    </>
  )
}

type Unit = {
  /** 先頭(こぞう)から どれだけ おくれて ついていくか(秒) */
  readonly delay: number
  /** 海で さいごに ただよう場所(x) */
  readonly exitX: number
  readonly size: number
  /** ともだち: 川の岸から とびこむ。at = 川に のる しゅんかん / off = 岸の いる場所(川の そのときの場所から) */
  readonly bank?: { readonly at: number; readonly off: readonly [number, number] }
}

const HOP = 0.5
/** 海に とびこんで おりる場所 */
const LAND_X = 48

const HERO: Unit = { delay: 0, exitX: 62, size: 1.25 }
const FRIENDS: readonly Unit[] = [
  { delay: 0.4, exitX: 80, size: 0.9, bank: { at: 2.4, off: [-12, 8] } },
  { delay: 0.7, exitX: 94, size: 0.85, bank: { at: 2.9, off: [12, 0] } },
  { delay: 1.0, exitX: 72, size: 0.8, bank: { at: 3.3, off: [-10, 0] } },
]

type Placed = { readonly x: number; readonly y: number; readonly rotate: number; readonly sx: number; readonly sy: number; readonly landed: boolean }

/** 水つぶ 1つの、いまの 場所と かっこう */
function place(t: number, unit: Unit): Placed {
  const tt = t - unit.delay
  if (tt >= ARRIVE) {
    const j = tt - ARRIVE
    const end = along(1)
    if (j < JUMP) {
      const u = j / JUMP
      const x = end[0] + (LAND_X - end[0]) * u
      const y = end[1] + (surf(LAND_X, t) + 4 - end[1]) * u - Math.sin(u * Math.PI) * 11
      return { x, y, rotate: 0, sx: 1 - Math.sin(u * Math.PI) * 0.08, sy: 1 + Math.sin(u * Math.PI) * 0.12, landed: false }
    }
    const s = span(tt, ARRIVE + JUMP, ARRIVE + JUMP + 1.4, easeOut)
    const x = LAND_X + (unit.exitX - LAND_X) * s
    const bob = Math.abs(wave(tt, 1.1)) * 1.3
    const squash = Math.sin(span(tt, ARRIVE + JUMP, ARRIVE + JUMP + 0.3) * Math.PI) * 0.2
    return { x, y: surf(x, t) + 4 - bob, rotate: wave(tt, 1.6) * 5, sx: 1 + squash, sy: 1 - squash, landed: true }
  }
  const p = roll(tt)
  const [rx, ry] = along(p)
  const rolling = p > 0 && p < 1
  const hop = Math.abs(Math.sin(tt * 9)) * (rolling ? 1.2 : 0)
  const river = { x: rx, y: ry - hop, rotate: rolling ? Math.sin(tt * 9) * 3 : 0, sx: 1, sy: 1, landed: false }
  if (unit.bank && t < unit.bank.at) {
    const spot = along(roll(unit.bank.at - unit.delay))
    const start = [spot[0] + unit.bank.off[0], spot[1] + unit.bank.off[1]] as const
    const h = span(t, unit.bank.at - HOP, unit.bank.at, easeOut)
    return {
      x: start[0] + (river.x - start[0]) * h,
      y: start[1] + (river.y - start[1]) * h - Math.sin(h * Math.PI) * 8,
      rotate: 0,
      sx: 1,
      sy: 1 + Math.sin(h * Math.PI) * 0.1,
      landed: false,
    }
  }
  return river
}

function Character({ t, unit, appearAt, mood, look }: { readonly t: number; readonly unit: Unit; readonly appearAt: number; readonly mood: Mood; readonly look: number }) {
  const pop = span(t, appearAt, appearAt + 0.45, backOut)
  if (pop <= 0) return null
  const at = place(t, unit)
  const size = unit.size * pop
  return (
    <>
      {!at.landed && at.y < 80 && <ellipse cx={at.x} cy={at.y + 0.4} rx={5 * unit.size} ry={1.4 * unit.size} fill="#000000" opacity="0.1" />}
      <Layer x={at.x} y={at.y} rotate={at.rotate} scaleX={size * at.sx} scaleY={size * at.sy}>
        <Drop mood={mood} look={look} />
      </Layer>
    </>
  )
}

/** 海に とびこんだ しゅんかんの しぶき と わ */
function Splash({ t, unit }: { readonly t: number; readonly unit: Unit }) {
  const at = ARRIVE + unit.delay + JUMP
  const p = span(t, at, at + 0.7)
  if (p <= 0 || p >= 1) return null
  const y = surf(LAND_X, at) + 3
  return (
    <>
      <ellipse cx={LAND_X} cy={y} rx={3 + p * 9} ry={0.8 + p * 1.8} fill="none" stroke="#ffffff" strokeWidth="0.8" opacity={1 - p} />
      {[-2, -1, 0, 1, 2].map((k) => (
        <circle key={k} cx={LAND_X + k * 3.4 * p} cy={y - 4 * p * (1 - p) * (11 - Math.abs(k) * 2.4)} r={Math.max(0, 1.2 * (1 - p))} fill="#ffffff" />
      ))}
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 9)

  // 気持ち: ひとりで しんぱい → ともだちが ついてきて にこにこ → 海で だいよろこび
  const heroMood: Mood = t < FRIENDS[0].bank!.at ? 'worry' : t < ARRIVE + JUMP ? 'smile' : 'joy'
  // 目の むき: はじめは きょろきょろ、川では さきを見る、海では まんなかを
  const heroLook = t < GO ? wave(t, 1.6) : t < ARRIVE ? 0.8 : 0
  const friendMood = (unit: Unit): Mood => (t - unit.delay >= ARRIVE + JUMP ? 'joy' : 'smile')
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Sea t={t} />
        <Land />
        <Spring t={t} />
        <RiverWater t={t} />
        {FRIENDS.map((unit, i) => (
          <Character key={i} t={t} unit={unit} appearAt={unit.bank!.at - HOP - 0.5} mood={friendMood(unit)} look={-0.3} />
        ))}
        <Character t={t} unit={HERO} appearAt={0.2} mood={heroMood} look={heroLook} />
        <SeaFront t={t} />
        {[HERO, ...FRIENDS].map((unit, i) => (
          <Splash key={i} t={t} unit={unit} />
        ))}
        <Gull t={t} />
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
    { at: 0, label: 'わき水から 水の こぞうが 生まれる', sound: 'pop' },
    { at: GO, label: 'ころころ 川を ながれる。ともだちが ついてくる' },
    { at: ARRIVE, label: '海に ざぶん。水が ふえて 海が ひろがる', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '海 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
