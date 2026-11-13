/*
 * 当(あたる): 3本の 矢が まとに とんで、あたる。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)   … まんなかの 矢(まっすぐ 上から まとへ おちる)
 *   2画目(丶)   … 左がわの 矢(左上から まとへ ななめに おちる)
 *   3画目(ノ)   … 右がわの 矢(右上から まとへ ななめに おちる)
 *   4画目(𠃍)   … まとの わく の 上の よこ木 と 右の たて木
 *   5画目(一)   … まとの まんなかの よこ木(まるい 的の うしろ)
 *   6画目(一)   … まとの わく の 下の よこ木
 *
 * ながれ
 *   まと が たつ → 弓を もった 子どもが 出てくる(ちょっと しんぱい で あせ)
 *   → 1本め: 弓を ひいて はなつ。矢は 空に 山なりに とんで まとに あたる(おどろく)
 *   → 2本め・3本め: だんだん じしん が ついて、3本ぜんぶ まとの まんなかに ぴたっ
 *   → 子どもは 弓を かかげて ぴょんぴょん よろこぶ
 *   → ほね が ひかって、絵が うすくなり、字「当」が のこる
 *
 * 子ども・弓・矢は、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる。弓を もつ うで は まえへ のばし、ひく うで は ひじを うしろへ。
 *   矢は 弓から はなたれて、山なりに とび、おちるときに 先が 下を むく。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '当'

type Pt = readonly [number, number]

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#e8734a'
const TUNIC_DARK = '#cf5e38'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const WOOD = '#8c5b3c'
const WOOD_DARK = '#70452b'
const BOW = '#a8703f'
const STRING = '#6f6256'
const PANEL = '#f6e6b8'
const RING_RED = '#e8534a'
const RING_CREAM = '#fff6dc'
const GOLD = '#ffd24a'
const SHAFT = '#c99a5e'
const STEEL = '#8f9aa8'
const FEATHER = '#e8534a'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const HILL = '#e2f2d2'
const SWEAT = '#7cc4f2'
const MOUTH = '#b9483f'

/** くぎり の時間(秒) */
const INK = 7.3
const DONE = 10.3
const DURATION = 10.9
/** 弓を ひきはじめる時間 / ひく のに かける時間 / 矢が とんでいる時間 */
const DRAW = 0.8
const FLIGHT = 0.7
const NERVOUS_END = 2.5

/** 矢の 長さ */
const ARROW_LEN = 32

type Shot = {
  /** 矢を つがえて ひきはじめる時間 */
  readonly start: number
  /** 弓を かまえる 角度(横から 上へ 何度か) */
  readonly aim: number
  /** 矢の 先が あたる 場所(まとの 上のほう) */
  readonly tip: Pt
  /** あたる ときの 矢の むき(長さ 1 の ベクトル。ほぼ 下むき) */
  readonly fall: Pt
}

/** 3本の 矢。あたる ときの むき は、1〜3画目の 線の むき に 合わせる */
const SHOTS: readonly Shot[] = [
  { start: 1.0, aim: 55, tip: [55, 53], fall: [0.06, 0.998] },
  { start: 2.8, aim: 70, tip: [43, 53], fall: [0.584, 0.811] },
  { start: 4.6, aim: 40, tip: [66, 53], fall: [-0.557, 0.831] },
]
const release = (shot: Shot) => shot.start + DRAW
const hitAt = (shot: Shot) => release(shot) + FLIGHT
const CHEER = hitAt(SHOTS[2])

/** 子どもの かたの 場所 と、うで の 長さ */
const SHOULDER: Pt = [9, 65]
const REACH = 12
const ARM_PART = 6.5
const PULL_MAX = 9
const BOW_HALF = 10.5

const rad = (deg: number) => (deg * Math.PI) / 180

/* ───────── 弓を もつ しせい の 計算 ───────── */

/** かた・ひじ・手 の ひじ の場所。a から b へ とどく 2本の ほね。bias の ほうへ ひじ が まがる */
function elbowOf(a: Pt, b: Pt, bias: Pt): Pt {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const d = Math.hypot(dx, dy) || 0.001
  const h = Math.sqrt(Math.max(0, ARM_PART * ARM_PART - (d * d) / 4))
  const flip = (-dy / d) * bias[0] + (dx / d) * bias[1] < 0 ? -1 : 1
  return [(a[0] + b[0]) / 2 + (-dy / d) * h * flip, (a[1] + b[1]) / 2 + (dx / d) * h * flip]
}

type Hold = {
  readonly dir: Pt
  readonly side: Pt
  /** 弓を もつ手 */
  readonly grip: Pt
  /** 弦(つる)を ひく手 = 矢の おしり */
  readonly nock: Pt
  readonly gripElbow: Pt
  readonly pullElbow: Pt
}

function holdOf(aim: number, pull: number): Hold {
  const dir: Pt = [Math.cos(rad(aim)), -Math.sin(rad(aim))]
  const side: Pt = [Math.sin(rad(aim)), Math.cos(rad(aim))]
  const grip: Pt = [SHOULDER[0] + dir[0] * REACH, SHOULDER[1] + dir[1] * REACH]
  const nock: Pt = [grip[0] - dir[0] * pull, grip[1] - dir[1] * pull]
  return { dir, side, grip, nock, gripElbow: elbowOf(SHOULDER, grip, [0.4, 1]), pullElbow: elbowOf(SHOULDER, nock, [-1, 0.5]) }
}

/** 弓を ひいている 間の ようす。0 = ひいてない 〜 PULL_MAX = いっぱいに ひいた */
function pullAt(t: number): number {
  const index = SHOTS.reduce((found, shot, i) => (t >= shot.start ? i : found), -1)
  if (index < 0) return 0
  const shot = SHOTS[index]
  if (t >= release(shot)) return PULL_MAX * (1 - span(t, release(shot), release(shot) + 0.1))
  return 1.5 * span(t, shot.start, shot.start + 0.15) + (PULL_MAX - 1.5) * span(t, shot.start + 0.15, release(shot), easeInOut)
}

/** 弓を かまえる 角度。1本ごとに 少し かわる。よろこぶときは 弓を かかげる */
function aimAt(t: number): number {
  const aimed = SHOTS.reduce((angle, shot, i) => angle + (shot.aim - (i === 0 ? 15 : SHOTS[i - 1].aim)) * span(t, shot.start, shot.start + 0.35, easeOut), 15)
  const cheer = span(t, CHEER, CHEER + 0.4, easeOut)
  // かおが 見えるように、弓は まえへ つきだして かかげる
  return aimed * (1 - cheer) + 28 * cheer
}

/* ───────── 矢 ───────── */

/** 矢1本。先が (0,0)、右むき。おしりに 羽が ある */
function ArrowShape() {
  const tail = -ARROW_LEN
  return (
    <>
      <path d={`M${tail} 0 L-4 0`} stroke={SHAFT} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M0.6 0 L-5.6 -2.5 L-4.4 0 L-5.6 2.5 Z" fill={STEEL} />
      <path d={`M${tail - 0.6} 0 L${tail + 6} -3.4 L${tail + 8.4} -3.4 L${tail + 6.2} 0 Z`} fill={FEATHER} />
      <path d={`M${tail - 0.6} 0 L${tail + 6} 3.4 L${tail + 8.4} 3.4 L${tail + 6.2} 0 Z`} fill={FEATHER} />
    </>
  )
}

const cubic = (u: number, p0: number, p1: number, p2: number, p3: number) => (1 - u) ** 3 * p0 + 3 * (1 - u) ** 2 * u * p1 + 3 * (1 - u) * u ** 2 * p2 + u ** 3 * p3
const cubicSlope = (u: number, p0: number, p1: number, p2: number, p3: number) => 3 * (1 - u) ** 2 * (p1 - p0) + 6 * (1 - u) * u * (p2 - p1) + 3 * u ** 2 * (p3 - p2)

/** 弓から はなたれて、山なりに とび、まとに おちる 矢。先が 進む道を なめらかな 曲線にして、むきは 道の かたむき から きめる */
function FlyingArrow({ t, shot }: { readonly t: number; readonly shot: Shot }) {
  const u = span(t, release(shot), hitAt(shot))
  if (u <= 0 || u >= 1) return null
  const { dir, nock } = holdOf(shot.aim, PULL_MAX)
  const start: Pt = [nock[0] + dir[0] * ARROW_LEN, nock[1] + dir[1] * ARROW_LEN]
  const c1: Pt = [start[0] + dir[0] * 32, start[1] + dir[1] * 32]
  const c2: Pt = [shot.tip[0] - shot.fall[0] * 36, shot.tip[1] - shot.fall[1] * 36]
  const x = cubic(u, start[0], c1[0], c2[0], shot.tip[0])
  const y = cubic(u, start[1], c1[1], c2[1], shot.tip[1])
  const angle = (Math.atan2(cubicSlope(u, start[1], c1[1], c2[1], shot.tip[1]), cubicSlope(u, start[0], c1[0], c2[0], shot.tip[0])) * 180) / Math.PI
  return (
    <Layer x={x} y={y} rotate={angle}>
      <ArrowShape />
    </Layer>
  )
}

/** あたった 矢: ぷるぷる ふるえて とまる */
function StuckArrow({ t, shot }: { readonly t: number; readonly shot: Shot }) {
  const since = t - hitAt(shot)
  if (since < 0) return null
  const angle = (Math.atan2(shot.fall[1], shot.fall[0]) * 180) / Math.PI
  const shake = Math.sin(since * 38) * 4 * Math.exp(-since * 7)
  return (
    <Layer x={shot.tip[0]} y={shot.tip[1]} rotate={angle + shake}>
      <ArrowShape />
    </Layer>
  )
}

/** あたった しゅんかんの ぴたっ(まわりへ とぶ 小さな すじ) */
function HitBurst({ t, shot }: { readonly t: number; readonly shot: Shot }) {
  const p = span(t, hitAt(shot), hitAt(shot) + 0.35, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p} stroke={GOLD} strokeWidth="1.3" strokeLinecap="round">
      {Array.from({ length: 7 }, (_, i) => {
        const angle = (i / 7) * Math.PI * 2 + 0.2
        const near = 4 + p * 4
        const far = 7 + p * 6
        return <path key={i} d={`M${shot.tip[0] + Math.cos(angle) * near} ${shot.tip[1] + Math.sin(angle) * near} L${shot.tip[0] + Math.cos(angle) * far} ${shot.tip[1] + Math.sin(angle) * far}`} />
      })}
    </g>
  )
}

/* ───────── まと ───────── */

/** まるい 的の まんなか */
const BULL: Pt = [54.5, 67]

function Board({ t }: SceneProps) {
  const pop = span(t, 0.15, 0.85, backOut)
  // あたるたびに、わく ぜんたいが 少し ゆれる
  const shake = SHOTS.reduce((sum, shot) => {
    const since = t - hitAt(shot)
    return since < 0 ? sum : sum + Math.sin(since * 30) * 1.1 * Math.exp(-since * 6)
  }, 0)
  return (
    <Layer scaleY={pop} scaleX={0.7 + 0.3 * pop} origin={[54.5, 96]}>
      <ellipse cx="55" cy="97.4" rx="32" ry="2.6" fill="#000000" opacity="0.1" />
      <Layer rotate={shake} origin={[54.5, 96]}>
        {/* あし(わくを ささえる 2本) */}
        <rect x="29" y="88" width="5" height="9" rx="1.5" fill={WOOD_DARK} />
        <rect x="75" y="88" width="5" height="9" rx="1.5" fill={WOOD_DARK} />
        <rect x="25" y="50" width="59" height="42" fill={PANEL} />
        <rect x="23" y="49" width="4" height="44" rx="2" fill={WOOD} />
        <Bone char={CHAR} n={5} color={WOOD} width={3} />
        <Bone char={CHAR} n={6} color={WOOD} width={4} />
        <Bone char={CHAR} n={4} color={WOOD} width={4} />
        {/* まるい 的 */}
        <circle cx={BULL[0]} cy={BULL[1]} r="17" fill={RING_CREAM} stroke={WOOD_DARK} strokeWidth="0.8" />
        <circle cx={BULL[0]} cy={BULL[1]} r="13.4" fill={RING_RED} />
        <circle cx={BULL[0]} cy={BULL[1]} r="9.8" fill={RING_CREAM} />
        <circle cx={BULL[0]} cy={BULL[1]} r="6.4" fill={RING_RED} />
        <circle cx={BULL[0]} cy={BULL[1]} r="3" fill={GOLD} />
        {SHOTS.map((shot) => (
          <StuckArrow key={shot.start} t={t} shot={shot} />
        ))}
      </Layer>
    </Layer>
  )
}

/* ───────── まわり ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[100, 10]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="99.3" y="1.8" width="1.4" height="3.4" rx="0.7" fill={GOLD} transform={`rotate(${i * 45} 100 10)`} />
        ))}
      </Layer>
      <circle cx="100" cy="10" r={4.6 * sun} fill={GOLD} />
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 93 V101 H-4 Z" fill={HILL} />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 46, 92, 102].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** ひらひら とぶ ちょうちょ(にぎやかし) */
function Butterfly({ t }: SceneProps) {
  const x = 96 + wave(t, 3.1) * 5
  const y = 76 + wave(t, 2.3, 0.6) * 3.5
  const flap = 0.35 + 0.65 * Math.abs(wave(t, 0.4))
  return (
    <Layer x={x} y={y}>
      <Layer scaleX={flap}>
        <ellipse cx="-2.4" cy="-1.2" rx="2.6" ry="2.2" fill="#f28fb5" />
        <ellipse cx="2.4" cy="-1.2" rx="2.6" ry="2.2" fill="#f28fb5" />
        <ellipse cx="-1.8" cy="1.4" rx="1.8" ry="1.5" fill="#f9b4cf" />
        <ellipse cx="1.8" cy="1.4" rx="1.8" ry="1.5" fill="#f9b4cf" />
      </Layer>
      <rect x="-0.4" y="-2" width="0.8" height="4.6" rx="0.4" fill="#5a3b2a" />
    </Layer>
  )
}

/* ───────── 子ども ───────── */

type Mood = 'nervous' | 'hopeful' | 'joy'

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="12.7" cy="57.5" r="1.7" fill="#ff9d9d" opacity="0.55" />
      {mood === 'nervous' && (
        <>
          <path d="M10 52.9 L13.1 51.6" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="11.8" cy="54.3" r="1.05" fill="#2b2b2b" />
          <path d="M11.2 59.2 q0.9 -0.9 1.8 0 q0.9 0.9 1.8 0" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
        </>
      )}
      {mood === 'hopeful' && (
        <>
          <circle cx="11.8" cy="54.3" r="1.05" fill="#2b2b2b" />
          <path d="M11.3 58.2 Q12.8 59.8 14.2 58.2" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'joy' && (
        <>
          <path d="M10.4 54.8 Q11.8 52.8 13.2 54.8" fill="none" stroke="#2b2b2b" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M10.8 57.6 Q12.6 62 14.4 57.6 Z" fill={MOUTH} />
        </>
      )}
    </>
  )
}

type ArcherProps = { readonly t: number; readonly mood: Mood; readonly aim: number; readonly pull: number }

function Archer({ t, mood, aim, pull }: ArcherProps) {
  const hold = holdOf(aim, pull)
  const { grip, nock, dir, side } = hold
  const tipTop: Pt = [grip[0] - side[0] * BOW_HALF - dir[0] * pull * 0.25, grip[1] - side[1] * BOW_HALF - dir[1] * pull * 0.25]
  const tipLow: Pt = [grip[0] + side[0] * BOW_HALF - dir[0] * pull * 0.25, grip[1] + side[1] * BOW_HALF - dir[1] * pull * 0.25]
  const belly: Pt = [grip[0] + dir[0] * (6.5 - pull * 0.3), grip[1] + dir[1] * (6.5 - pull * 0.3)]
  const nocked = SHOTS.some((shot) => t >= shot.start && t < release(shot))
  const nockedTip: Pt = [nock[0] + dir[0] * ARROW_LEN, nock[1] + dir[1] * ARROW_LEN]
  return (
    <>
      {/* 弓を もつ うで(むこうがわ。あたま の うしろに かくれる) */}
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${hold.gripElbow[0]} ${hold.gripElbow[1]} L${grip[0]} ${grip[1]}`} fill="none" stroke={TUNIC_DARK} strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* あし */}
      <rect x="5" y="80" width="4.4" height="14" rx="2.2" fill={PANTS} />
      <rect x="9.6" y="80" width="4.4" height="14" rx="2.2" fill={PANTS} />
      <ellipse cx="8" cy="94.6" rx="4.2" ry="2" fill={SHOE} />
      <ellipse cx="13" cy="94.6" rx="4.2" ry="2" fill={SHOE} />
      {/* どう と くび */}
      <rect x="7" y="58" width="4.4" height="6" rx="2" fill={SKIN_SHADE} />
      <rect x="3.5" y="62" width="11" height="20" rx="5" fill={TUNIC} />
      {/* ひく うで(ひじ を うしろへ) */}
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${hold.pullElbow[0]} ${hold.pullElbow[1]} L${nock[0]} ${nock[1]}`} fill="none" stroke={TUNIC} strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* あたま(まとの ほうを むく) */}
      <circle cx="9" cy="54.5" r="5.6" fill={SKIN} />
      <path d="M3.4 54.5 A5.6 5.6 0 0 1 14.6 54.5 Q13.4 51.4 9 51.2 Q5.4 51.4 3.4 54.5 Z" fill={HAIR} />
      <Face mood={mood} />
      {/* 弓と 弦 */}
      <path d={`M${tipTop[0]} ${tipTop[1]} Q${belly[0] * 2 - (tipTop[0] + tipLow[0]) / 2} ${belly[1] * 2 - (tipTop[1] + tipLow[1]) / 2} ${tipLow[0]} ${tipLow[1]}`} fill="none" stroke={BOW} strokeWidth="2.2" strokeLinecap="round" />
      <path d={`M${tipTop[0]} ${tipTop[1]} L${nock[0]} ${nock[1]} L${tipLow[0]} ${tipLow[1]}`} fill="none" stroke={STRING} strokeWidth="0.7" strokeLinejoin="round" />
      {nocked && (
        <Layer x={nockedTip[0]} y={nockedTip[1]} rotate={-aim}>
          <ArrowShape />
        </Layer>
      )}
      <circle cx={grip[0]} cy={grip[1]} r="2.2" fill={SKIN} />
      <circle cx={nock[0]} cy={nock[1]} r="2" fill={SKIN} />
    </>
  )
}

/** まだ あたっていない 間の あせ(しんぱい) */
function Sweat({ t }: SceneProps) {
  const show = during(t, 0.9, NERVOUS_END, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.45].map((offset) => {
        const p = ((t + offset) % 0.9) / 0.9
        return <path key={offset} d="M0 -2.2 Q1.8 0.6 0 1.8 Q-1.8 0.6 0 -2.2 Z" fill={SWEAT} opacity={1 - p} transform={`translate(${3.6 - p * 1.6} ${49 + p * 8})`} />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)
  const aim = aimAt(t)
  const pull = pullAt(t)
  const mood: Mood = t < hitAt(SHOTS[0]) ? 'nervous' : t < CHEER ? 'hopeful' : 'joy'
  const enter = span(t, 0.3, 0.9, backOut)
  // 1本め・2本め が あたったら、ちょこんと はねる。3本め が あたったら ぴょんぴょん よろこぶ
  const hop = SHOTS.slice(0, 2).reduce((sum, shot) => sum + Math.sin(span(t, hitAt(shot), hitAt(shot) + 0.35) * Math.PI) * 2.5, 0)
  const cheerHops = Math.abs(Math.sin(((t - CHEER) * Math.PI) / 0.45)) * 5 * span(t, CHEER, CHEER + 0.05) * (1 - span(t, INK - 0.2, INK + 0.2))
  const lift = hop + cheerHops
  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Butterfly t={t} />
        <Board t={t} />
        <Layer opacity={span(t, 0.3, 0.5)}>
          <ellipse cx="9" cy="95.8" rx={8 - lift * 0.4} ry="2" fill="#000000" opacity="0.12" />
          <Layer scale={Math.max(0, enter)} origin={[9, 95]}>
            <Layer y={-lift}>
              <Archer t={t} mood={mood} aim={aim} pull={pull} />
              <Sweat t={t} />
            </Layer>
          </Layer>
        </Layer>
        {SHOTS.map((shot) => (
          <FlyingArrow key={shot.start} t={t} shot={shot} />
        ))}
        {SHOTS.map((shot) => (
          <HitBurst key={shot.start} t={t} shot={shot} />
        ))}
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
    { at: 0, label: 'まと が たつ', sound: 'pop' },
    { at: SHOTS[0].start, label: '子どもが 弓を ひく(ちょっと しんぱい)' },
    { at: release(SHOTS[0]), label: '1本め の 矢が とんでいく', sound: 'pop' },
    { at: hitAt(SHOTS[0]), label: 'まとに ぴたっ と あたる', sound: 'pop' },
    { at: SHOTS[1].start, label: '2本め を ひく' },
    { at: SHOTS[2].start, label: '3本め を ひく。ぜんぶ あたる' },
    { at: CHEER, label: '弓を かかげて よろこぶ', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '当 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
