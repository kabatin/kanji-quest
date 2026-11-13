/*
 * 市(いち): やねの したに ぬのの はたを たてると、人が あつまって いちに なる。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … やねの てっぺんに たつ かざり ぼう
 *   2画目(一)  … やねの ひさし(のきの はり)。右が 少し 上がっている
 *   3画目(丨)  … ぬのの 左はし
 *   4画目(𠃍)  … ぬの(たれまく)の ぜんたい。上は ぬのを つるす ぼう、右は ぬのの 右はし
 *   5画目(丨)  … 店の まんなかの はしら(やねを ささえ、ぬのの うしろを 通る)
 *
 * ながれ
 *   やねと はしらが できる → 店ばんの女の子が 来て、お客が いなくて しょんぼり
 *   → ぬのの すみを つかんで 下へ ひっぱると、ぬのの はたが ひらく(目じるし ができて 元気になる)
 *   → お客さんが 2人 あるいてきて あつまる → 1人が お金を なげ、店ばんが うけとって 大よろこび
 *   → ほね が ひかって、絵が うすくなり、字「市」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(ひじは かならず 2つの ほね の まん中)。くび は みじかい。
 *   ぬのは、上の ぼう から まっすぐ たれる。人は、ぬのの よこと 前に 立つ。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '市'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const HAIR_LIGHT = '#8a5a3a'
const CHEEK = '#ff9d9d'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const ROOF = '#e0694c'
const ROOF_DARK = '#c0523a'
const GOLD = '#ffc233'
const CREAM = '#ffe9b0'
const CLOTH = '#5aa5e6'
const CLOTH_LIGHT = '#8cc4f0'
const CLOTH_DARK = '#438bcb'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'

/** くぎり の時間(秒) */
const ROOF_AT = 0.3
const KEEPER_IN = 0.6
const REACH = 1.5
const PULL_FROM = 2.0
const PULL_TO = 3.0
const CHEER = 3.4
const C1_IN = 3.3
const C1_STOP = 4.6
const C2_IN = 3.9
const C2_STOP = 5.2
const THROW = 5.1
const CATCH = 5.9
const INK = 6.7
const DONE = 9.6
const DURATION = 10

type Pt = readonly [number, number]

/** 店ばんが ぬのを ひっぱる つかみどころ(ぬのの 左下すみ)。すみは ぬのの したはしに ついてくる */
const CLOTH_TOP = 45
const CLOTH_BOTTOM = 78
const GRIP_X = 26.5
/** 店ばんの 足もと と 大きさ */
const KEEPER_FEET: Pt = [17, 96.5]
const KEEPER_SCALE = 1.25
/** お客の 足もと(まえの人・うしろの人) */
const C1_FEET: Pt = [85, 97]
const C2_FEET: Pt = [98, 95.5]
/** 人の 体の ざひょう(足もとが 0,0。まえむき) */
const SHOULDER_Y = -25.5
const SHOULDER_X = 6
const ARM_PART = 8.5
const HANG_L: Pt = [-8.5, -11]
const HANG_R: Pt = [8.5, -11]
const UP_L: Pt = [-13, -40]
const UP_R: Pt = [13, -40]
/** お金を なげる はじめ(お客1の 左手の 上)と、うけとる ところ(店ばんの 手の まえ) */
const COIN_FROM: Pt = [C1_FEET[0] - 9.5 * 0.95, C1_FEET[1] - 35 * 0.95]
const COIN_TO: Pt = [33, 61]

const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/** かた と 手の いちから、ひじ の いちを きめる。ひじは 外がわ・下がわ に まがる。とどかないときは のばしきる。 */
function reach(side: -1 | 1, target: Pt): { readonly elbow: Pt; readonly hand: Pt } {
  const shoulder: Pt = [side * SHOULDER_X, SHOULDER_Y]
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.hypot(dx, dy) || 0.001
  const d = Math.min(dist, ARM_PART * 2 * 0.999)
  const ux = dx / dist
  const uy = dy / dist
  const mid: Pt = [shoulder[0] + (ux * d) / 2, shoulder[1] + (uy * d) / 2]
  const h = Math.sqrt(Math.max(0, ARM_PART ** 2 - (d / 2) ** 2))
  const perp: Pt = [-uy, ux]
  const outward = perp[0] * side + perp[1] * 0.6 >= 0 ? 1 : -1
  return { elbow: [mid[0] + perp[0] * h * outward, mid[1] + perp[1] * h * outward], hand: [shoulder[0] + ux * d, shoulder[1] + uy * d] }
}

type Mood = 'sad' | 'hope' | 'happy'
type HairStyle = 'bands' | 'short' | 'cap'

type PersonProps = {
  readonly mood: Mood
  readonly handL: Pt
  readonly handR: Pt
  /** あるくとき、足を かわりばんこに 上げる(-1〜1) */
  readonly step: number
  readonly shirt: string
  readonly shirtDark: string
  readonly pants: string
  readonly hair: string
  readonly style: HairStyle
  readonly hat: string
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="-4.7" cy="-34" r="1.6" fill={CHEEK} opacity="0.55" />
      <circle cx="4.7" cy="-34" r="1.6" fill={CHEEK} opacity="0.55" />
      {mood === 'sad' && (
        <>
          <circle cx="-2.8" cy="-36.2" r="1.1" fill={EYE} />
          <circle cx="2.8" cy="-36.2" r="1.1" fill={EYE} />
          <path d="M-4.8 -38.4 L-1.8 -39.8 M4.8 -38.4 L1.8 -39.8" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <path d="M-2 -32.2 Q0 -34 2 -32.2" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
        </>
      )}
      {mood === 'hope' && (
        <>
          <circle cx="-2.8" cy="-36.6" r="1.25" fill={EYE} />
          <circle cx="2.8" cy="-36.6" r="1.25" fill={EYE} />
          <path d="M-2 -33.4 Q0 -31.6 2 -33.4" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M-4.4 -36.2 Q-2.8 -38.4 -1.2 -36.2 M1.2 -36.2 Q2.8 -38.4 4.4 -36.2" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M-2.6 -33.6 Q0 -29.8 2.6 -33.6 Z" fill={MOUTH} />
        </>
      )}
    </>
  )
}

function Hair({ style, hair, hat }: { readonly style: HairStyle; readonly hair: string; readonly hat: string }) {
  if (style === 'cap') {
    return (
      <>
        <path d="M-7.6 -38.4 Q0 -51 7.6 -38.4 Z" fill={hat} />
        <path d="M-8.6 -38.4 H8.6" stroke={hat} strokeWidth="1.8" strokeLinecap="round" />
      </>
    )
  }
  return (
    <>
      <path d="M-7.5 -36.5 C-8 -45.5 8 -45.5 7.5 -36.5 C5 -40.6 -5 -40.6 -7.5 -36.5 Z" fill={hair} />
      {style === 'bands' && (
        <>
          <circle cx="-7.8" cy="-34.4" r="2.6" fill={hair} />
          <circle cx="7.8" cy="-34.4" r="2.6" fill={hair} />
          <path d="M-7.2 -39.6 Q0 -42.4 7.2 -39.6" fill="none" stroke="#e8534a" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
    </>
  )
}

/** まえむきの人。足もと が (0,0)。うで は かた → ひじ → 手 と つながる。 */
function Person({ mood, handL, handR, step, shirt, shirtDark, pants, hair, style, hat }: PersonProps) {
  const left = reach(-1, handL)
  const right = reach(1, handR)
  const arm = (a: { readonly elbow: Pt; readonly hand: Pt }, side: -1 | 1) => (
    <>
      <path d={`M${side * SHOULDER_X} ${SHOULDER_Y} L${a.elbow[0]} ${a.elbow[1]}`} fill="none" stroke={shirtDark} strokeWidth="5.2" strokeLinecap="round" />
      <path d={`M${a.elbow[0]} ${a.elbow[1]} L${a.hand[0]} ${a.hand[1]}`} fill="none" stroke={SKIN} strokeWidth="4.2" strokeLinecap="round" />
      <circle cx={a.hand[0]} cy={a.hand[1]} r="2.8" fill={SKIN} />
    </>
  )
  const lift = (s: number) => Math.max(0, s) * 2.6
  return (
    <>
      {/* あし: あるくとき、かわりばんこに 上がる */}
      <rect x="-5.7" y={-14 - lift(step)} width="5" height="13" rx="2.5" fill={pants} />
      <rect x="0.7" y={-14 - lift(-step)} width="5" height="13" rx="2.5" fill={pants} />
      <ellipse cx="-3.2" cy={-1.2 - lift(step)} rx="3.6" ry="2" fill="#6b4a36" />
      <ellipse cx="3.2" cy={-1.2 - lift(-step)} rx="3.6" ry="2" fill="#6b4a36" />
      {/* くび: みじかく、どう の上 */}
      <rect x="-1.9" y="-31" width="3.8" height="6" rx="1.6" fill={SKIN_SHADE} />
      <rect x="-6.5" y="-28" width="13" height="16" rx="5.5" fill={shirt} />
      {arm(left, -1)}
      {arm(right, 1)}
      <circle cx="0" cy="-36.5" r="7.2" fill={SKIN} />
      <Hair style={style} hair={hair} hat={hat} />
      <Face mood={mood} />
    </>
  )
}

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[97, 10]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="96.3" y="0.8" width="1.4" height="3" rx="0.7" fill={SUN} transform={`rotate(${i * 45} 97 10)`} />
        ))}
      </Layer>
      <circle cx="97" cy="10" r={4.6 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 94 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="-2" cy="14" rx="7" ry="3.2" />
        <ellipse cx="3" cy="12.4" rx="5" ry="3.2" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 40, 70, 105].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 店の はしら・やね・ぬの。はしらが のび、やねが ぽんと のり、ぬのは 店ばんが ひっぱると 下へ ひらく。 */
function Stall({ t, unroll }: SceneProps & { readonly unroll: number }) {
  const pole = span(t, 0, 0.5, easeOut)
  const roof = span(t, ROOF_AT, ROOF_AT + 0.5, backOut)
  const sway = t > PULL_TO ? wave(t, 2.4) * 0.8 : 0
  return (
    <>
      <Layer scaleY={pole} origin={[54, 97.5]}>
        <Bone char={CHAR} n={5} color={BARK} width={3.6} />
        <rect x="52.4" y="26" width="3.2" height="9" fill={BARK} />
      </Layer>
      <Layer scaleY={roof} origin={[54, 29]}>
        <path d="M12 31 Q32 26 54 14.8 Q77 19.5 99 25.8 L97 28 L14 33 Z" fill={ROOF} />
        <path d="M54 14.8 Q77 19.5 99 25.8 L97 28 L54 30 Z" fill={ROOF_DARK} />
        <Bone char={CHAR} n={2} color={BARK_DARK} width={4.6} />
        <Bone char={CHAR} n={1} color={CREAM} width={3} />
        <circle cx="52.8" cy="10.6" r="2.4" fill={GOLD} />
      </Layer>
      {/* ぬの: 上の ぼう から たれる */}
      <Layer opacity={unroll} rotate={sway} origin={[56, CLOTH_TOP]}>
        <Layer scaleY={unroll} origin={[56, CLOTH_TOP]}>
          <rect x="28" y={CLOTH_TOP + 1} width="56" height={CLOTH_BOTTOM - CLOTH_TOP - 1} rx="3" fill={CLOTH} />
          <rect x="28" y="62" width="56" height="4.2" fill={CLOTH_LIGHT} />
          <path d={`M28 ${CLOTH_BOTTOM - 4} H84 V${CLOTH_BOTTOM - 3} Q84 ${CLOTH_BOTTOM} 81 ${CLOTH_BOTTOM} H31 Q28 ${CLOTH_BOTTOM} 28 ${CLOTH_BOTTOM - 3} Z`} fill={CLOTH_DARK} />
        </Layer>
      </Layer>
      <Layer opacity={pole}>
        <rect x="26.5" y={CLOTH_TOP - 1.8} width="59" height="3.6" rx="1.8" fill={BARK_DARK} />
        <circle cx="26.5" cy={CLOTH_TOP} r="2.4" fill={BARK} />
        <circle cx="85.5" cy={CLOTH_TOP} r="2.4" fill={BARK} />
      </Layer>
    </>
  )
}

/** お客が いなくて ついた ためいき。 */
function Sigh({ t }: SceneProps) {
  const show = during(t, 0.9, 1.9, 0.25)
  if (show <= 0) return null
  const p = span(t, 0.9, 1.9, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={7 - p * 4} cy={50 - p * 5} rx={2.6 + p * 2} ry={1.8 + p * 1.2} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <ellipse cx={10.5 - p * 3} cy={51.6 - p * 2} rx={1.3 + p * 0.8} ry={1 + p * 0.5} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
    </g>
  )
}

/** 店ばんの おんな の子。主役。しょんぼり → ぬのを ひっぱる → げんき → お金を うけとって 大よろこび。 */
function Keeper({ t }: SceneProps) {
  const appear = span(t, KEEPER_IN, KEEPER_IN + 0.5, backOut)
  const mood: Mood = t < PULL_FROM ? 'sad' : t < PULL_TO ? 'hope' : 'happy'
  const grabStart: Pt = [(GRIP_X - KEEPER_FEET[0]) / KEEPER_SCALE, (CLOTH_TOP + 2 - KEEPER_FEET[1]) / KEEPER_SCALE]
  const gripY = mix(t, PULL_FROM, PULL_TO, CLOTH_TOP + 2, CLOTH_BOTTOM - 2, easeOut)
  const grabNow: Pt = [(GRIP_X - KEEPER_FEET[0]) / KEEPER_SCALE, (gripY - KEEPER_FEET[1]) / KEEPER_SCALE]
  const catchPose: Pt = [13, -28]
  const sad = wave(t, 2) * 0.6
  // 右手(画面の右がわ)
  let handR: Pt = [HANG_R[0], HANG_R[1] + sad]
  if (t >= REACH && t < PULL_FROM) handR = lerpPt(HANG_R, grabStart, span(t, REACH, PULL_FROM, easeInOut))
  else if (t >= PULL_FROM && t < PULL_TO) handR = grabNow
  else if (t >= PULL_TO && t < CHEER) handR = lerpPt(grabNow, UP_R, span(t, PULL_TO, CHEER, easeInOut))
  else if (t >= CHEER && t < C1_STOP + 0.2) handR = lerpPt(UP_R, [12, -36], span(t, CHEER, CHEER + 0.3))
  if (t >= C1_STOP && t < THROW) handR = [12 + wave(t, 0.5) * 4, -36 - Math.abs(wave(t, 0.5)) * 2]
  else if (t >= THROW && t < CATCH) handR = lerpPt([12, -36], catchPose, span(t, THROW, THROW + 0.5, easeOut))
  else if (t >= CATCH) handR = lerpPt(catchPose, UP_R, span(t, CATCH, CATCH + 0.3, easeOut))
  // 左手
  let handL: Pt = [HANG_L[0], HANG_L[1] + sad]
  if (t >= PULL_TO && t < CHEER) handL = lerpPt(HANG_L, UP_L, span(t, PULL_TO, CHEER, easeInOut))
  else if (t >= CHEER && t < CHEER + 0.4) handL = lerpPt(UP_L, HANG_L, span(t, CHEER, CHEER + 0.4, easeInOut))
  else if (t >= CHEER + 0.4 && t < CATCH) handL = HANG_L
  else if (t >= CATCH) handL = lerpPt(HANG_L, UP_L, span(t, CATCH, CATCH + 0.3, easeOut))
  const hop = Math.sin(span(t, PULL_TO, PULL_TO + 0.6) * Math.PI) * 3 + Math.sin(span(t, CATCH, CATCH + 0.6) * Math.PI) * 3.5
  const finalHop = t > CATCH + 0.6 ? Math.abs(wave(t, 0.7)) * 1.2 : 0
  // くびを きょろきょろ(お客を さがす)
  const look = t < REACH ? wave(t, 1.6) * 3 : 0
  return (
    <>
      <ellipse cx={KEEPER_FEET[0]} cy="97.4" rx="9" ry="2.2" fill="#000000" opacity="0.12" />
      <Layer x={KEEPER_FEET[0] + look * 0.2} y={KEEPER_FEET[1] - hop - finalHop} scale={KEEPER_SCALE * appear} rotate={look * 0.5}>
        <Person mood={mood} handL={handL} handR={handR} step={0} shirt="#f2a53a" shirtDark="#dd8f26" pants="#6f5a9e" hair={HAIR} style="bands" hat="#e8534a" />
      </Layer>
    </>
  )
}

type CustomerProps = {
  readonly t: number
  readonly feet: Pt
  readonly scale: number
  readonly enter: number
  readonly stop: number
  readonly fromX: number
  readonly shirt: string
  readonly shirtDark: string
  readonly pants: string
  readonly hair: string
  readonly style: HairStyle
  readonly hat: string
  /** 左手の かっこう を 外から きめる(お金を もつ など) */
  readonly handL?: Pt
}

/** あるいてきて、立ちどまり、わくわく はねる お客。 */
function Customer({ t, feet, scale, enter, stop, fromX, shirt, shirtDark, pants, hair, style, hat, handL }: CustomerProps) {
  if (t < enter) return null
  const x = mix(t, enter, stop, fromX, feet[0], easeOut)
  const walking = 1 - span(t, stop - 0.25, stop)
  const gait = Math.sin((t - enter) * Math.PI * 2 * 2.2) * walking
  const bounce = t > stop ? Math.abs(wave(t, 0.8, stop)) * 1.6 : -Math.abs(gait) * 1
  const swing = gait * 3
  const excited = t > stop + 0.5
  const handLNow: Pt = handL ?? (excited ? lerpPt(HANG_L, UP_L, span(t, stop + 0.5, stop + 0.8, easeOut)) : [HANG_L[0], HANG_L[1] + swing])
  const handRNow: Pt = excited ? lerpPt(HANG_R, UP_R, span(t, stop + 0.5, stop + 0.8, easeOut)) : [HANG_R[0], HANG_R[1] - swing]
  return (
    <>
      <ellipse cx={x} cy={feet[1] + 0.4} rx={8 * scale} ry="2" fill="#000000" opacity="0.12" />
      <Layer x={x} y={feet[1] + bounce} scale={scale}>
        <Person mood={t < stop ? 'hope' : 'happy'} handL={handLNow} handR={handRNow} step={gait} shirt={shirt} shirtDark={shirtDark} pants={pants} hair={hair} style={style} hat={hat} />
      </Layer>
    </>
  )
}

/** お客1が 左手の お金を なげ、店ばんの ところへ ひらひら とんでいく。 */
function Coin({ t }: SceneProps) {
  if (t < C1_STOP + 0.2 || t > CATCH + 0.15) return null
  const held = t < THROW
  const p = span(t, THROW, CATCH, easeInOut)
  const x = held ? COIN_FROM[0] : COIN_FROM[0] + (COIN_TO[0] - COIN_FROM[0]) * p
  const y = held ? COIN_FROM[1] - 4 - Math.abs(wave(t, 0.5)) * 0.8 : COIN_FROM[1] + (COIN_TO[1] - COIN_FROM[1]) * p - Math.sin(p * Math.PI) * 14
  const flip = held ? 1 : Math.max(0.25, Math.abs(Math.cos(p * 16)))
  const appear = span(t, C1_STOP + 0.2, C1_STOP + 0.5)
  return (
    <Layer x={x} y={y} scaleX={flip} scaleY={1} opacity={appear}>
      <circle r="2.6" fill={GOLD} />
      <circle r="1.5" fill="none" stroke="#e29a10" strokeWidth="0.6" />
    </Layer>
  )
}

/** お金を うけとった しゅんかんの きらり。 */
function Cheer({ t }: SceneProps) {
  const p = span(t, CATCH, CATCH + 0.7)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p}>
      {[0, 1, 2].map((i) => (
        <Star key={i} cx={20 + i * 8 + Math.sin(i * 2) * 2} cy={46 - p * 8 - i * 2} r={2.6 * (1 - p * 0.3)} color={i === 1 ? GOLD : '#ffffff'} spin={p * 160 + i * 50} />
      ))}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)
  const unroll = span(t, PULL_FROM, PULL_TO, easeOut)
  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Stall t={t} unroll={unroll} />
        <Sigh t={t} />
        <Keeper t={t} />
        <Customer t={t} feet={C2_FEET} scale={0.85} enter={C2_IN} stop={C2_STOP} fromX={135} shirt="#7bc86c" shirtDark="#5fae52" pants="#4a6a8a" hair={HAIR_LIGHT} style="cap" hat="#e8534a" />
        <Customer t={t} feet={C1_FEET} scale={0.95} enter={C1_IN} stop={C1_STOP} fromX={130} shirt="#ef7a8a" shirtDark="#d85f70" pants="#3e5c86" hair={HAIR} style="short" hat="#000000" handL={t >= C1_STOP && t < THROW + 0.3 ? lerpPt(HANG_L, [-9.5, -35], span(t, C1_STOP, C1_STOP + 0.4, easeOut)) : undefined} />
        <Coin t={t} />
        <Cheer t={t} />
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
    { at: 0, label: 'はしらが たち、やねが のる', sound: 'pop' },
    { at: KEEPER_IN, label: '店ばんの女の子。お客が いなくて しょんぼり' },
    { at: PULL_FROM, label: 'ぬのを ひっぱって、はたが ひらく', sound: 'pop' },
    { at: C1_IN, label: 'お客さんが あるいてくる' },
    { at: THROW, label: 'お金を なげて、店ばんが うけとる', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '市 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
