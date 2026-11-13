/*
 * 毎(まい): かみかざりを つけた お母さん。毎日 つける。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … かみを ひとつに むすんだ しっぽ(あたまの 左うえ から 左下へ ながれる)
 *   2画目(一)  … あたまに のせた かみかざり(カチューシャ)
 *   3・4画目   … お母さんの どう(ふく)
 *   5画目(ノ)  … ふくの まんなかの エプロンの すじ
 *   6画目(一)  … やったー と ひろげた りょううで
 *   (字と ぴったり重なるのは さいごの しゅんかん だけ。だいたい 同じ場所・同じ むき)
 *
 * ながれ
 *   朝、お母さんが ねむそうに おきる(かみは ぼさぼさ、あくび)
 *   → 台の上の かみかざりに 気づく → うでを のばして とる → あたまに のせる(かみが きちんと まとまる)
 *   → うれしくて ばんざい。お日さまが しずんで また のぼる(毎日 つける)
 *   → ほね が ひかって、絵が うすくなり、字「毎」が のこる
 *
 * お母さんは、ほんものの人の つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる(ひじ は いつも 下がわ・そとがわ に出る)。
 *   くび は みじかく、あたま は どう の まんなか の上。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '毎'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const HAIR_LIGHT = '#7a5540'
const DRESS = '#ef8a6a'
const DRESS_DARK = '#d8704f'
const APRON = '#fff3dc'
const SHOE = '#6b4a36'
const WALL = '#fff1dc'
const WALL_LINE = '#f1dcbc'
const FLOOR = '#e8c79a'
const WOOD = '#c99a6b'
const WOOD_DARK = '#a87a4e'
const PINK = '#ff8fb1'
const PINK_LIGHT = '#ffc2d4'
const SUN = '#ffd24a'
const SKY_DAY = '#bfe6ff'
const SKY_NIGHT = '#3d4a7a'
const SKY_DUSK = '#ffc58a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'

/** くぎり の時間(秒) */
const YAWN = 1.3
const NOTICE = 2.4
const REACH = 3.2
/** 台の上の かみかざりを つかむ */
const GRAB = 3.9
/** あたまに のせおわる(カチッ) */
const CLICK = 4.9
const CHEER = 5.0
const SUNSET = 5.0
const INK = 6.8
const DONE = 9.6
const DURATION = 10.2

type Point = readonly [number, number]

/** かた(うでの つけね)、うでの ふしの長さ(かた→ひじ、ひじ→手 は 同じ長さ) */
const SHOULDER_L: Point = [46, 50]
const SHOULDER_R: Point = [77, 50]
const LIMB = 18.5
/** あたま の まんなか と、くび の位置(あたまを かたむける じく) */
const HEAD: Point = [62, 29]
const NECK: Point = [62, 42]
const FEET_Y = 93

/** かみかざり: 台の上に おいてある ときの まんなか と、あたまに のせたときの まんなか */
const TABLE_ORN: Point = [91, 70]
const WORN_ORN: Point = [62, 18.5]
/** かみかざり(うえに ふくらんだ アーチ)の 形。手で つかむのは 右がわ の ほぼ上 */
const ORN_ARC = 'M-13 6 Q0 -14 13 6'
const ORN_GRIP: Point = [7.8, -0.4]
/** やったー の ときの 手の位置 */
const CHEER_L: Point = [13, 57]
const CHEER_R: Point = [102, 56]
/** ぶらんと たらした ときの 手の位置 */
const HANG_L: Point = [44, 84]
const HANG_R: Point = [79, 85]
/** しっぽ の つけね(かみを むすぶ 場所) */
const TAIL_ROOT: Point = [50, 22]

const lerpPoint = (a: Point, b: Point, k: number): Point => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/* ───────── へや ───────── */

/** まど の 外の ようす。朝のお日さま → ゆうやけ → よる → また 朝(毎日) */
function Window({ t }: { readonly t: number }) {
  const rise = span(t, 0.1, 1.0, easeOut)
  const set = span(t, SUNSET, SUNSET + 0.6, easeInOut)
  const rise2 = span(t, 5.9, 6.5, easeOut)
  // 太陽の高さ(まど の中で、下から のぼる / しずむ)
  const sunY = 36 - 21 * rise + 21 * set - 21 * rise2
  const night = span(t, SUNSET + 0.2, SUNSET + 0.7) * (1 - span(t, 5.9, 6.4))
  const dusk = Math.sin(span(t, SUNSET, 5.9) * Math.PI) * 0.7
  return (
    <>
      <rect x="6" y="7" width="24" height="22" fill={SKY_DAY} />
      <rect x="6" y="7" width="24" height="22" fill={SKY_DUSK} opacity={dusk} />
      <circle cx="18" cy={sunY} r="5.2" fill={SUN} />
      {/* お日さまが まどの下へ しずむので、まどの 下は かべの色で かくす */}
      <rect x="0" y="29" width="40" height="14" fill={WALL} />
      <rect x="6" y="7" width="24" height="22" fill={SKY_NIGHT} opacity={night * 0.95} />
      <g opacity={night}>
        <path d="M21 10.5 A5 5 0 1 0 23.4 19 A4 4 0 1 1 21 10.5 Z" fill="#fff4b8" />
        <circle cx="11" cy="12" r="0.9" fill="#ffffff" />
        <circle cx="12.5" cy="23" r="0.8" fill="#ffffff" />
        <circle cx="27" cy="9.5" r="0.8" fill="#ffffff" />
      </g>
      <rect x="5" y="6" width="26" height="24" rx="2.5" fill="none" stroke={WOOD} strokeWidth="2.4" />
      <path d="M18 7 V29 M6 18 H30" stroke={WOOD} strokeWidth="1.6" />
    </>
  )
}

function Room({ t }: { readonly t: number }) {
  return (
    <>
      <rect x="0" y="0" width="109" height="109" fill={WALL} />
      <rect x="0" y="86" width="109" height="2.4" fill={WALL_LINE} />
      <rect x="0" y="88.4" width="109" height="21" fill={FLOOR} />
      <Window t={t} />
      {/* かみかざりを のせた 小さな台 */}
      <rect x="80.5" y="76" width="3" height="16" rx="1.2" fill={WOOD_DARK} />
      <rect x="102.5" y="76" width="3" height="16" rx="1.2" fill={WOOD_DARK} />
      <rect x="78" y="74" width="30" height="4.2" rx="2" fill={WOOD} />
    </>
  )
}

/* ───────── かみかざり ───────── */

function Headband({ x, y, rotate = 0 }: { readonly x: number; readonly y: number; readonly rotate?: number }) {
  return (
    <Layer x={x} y={y} rotate={rotate}>
      <path d={ORN_ARC} fill="none" stroke={PINK} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M-10 2.4 Q-2 -8.6 6 -6.2" fill="none" stroke={PINK_LIGHT} strokeWidth="0.9" strokeLinecap="round" />
      {/* 左はしの 小さな花 */}
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={-11 + Math.cos((a * Math.PI) / 180) * 2.6} cy={3.6 + Math.sin((a * Math.PI) / 180) * 2.6} r="1.9" fill="#fff6f9" />
      ))}
      <circle cx="-11" cy="3.6" r="1.5" fill={SUN} />
    </Layer>
  )
}

/* ───────── お母さん ───────── */

type Mood = 'sleepy' | 'alert' | 'happy'

type Look = {
  readonly mood: Mood
  /** 目の むき(ひとみ の ずれ) */
  readonly gaze: Point
  /** あくび の大きさ(0〜1) */
  readonly yawn: number
  readonly tilt: number
}

function Face({ look }: { readonly look: Look }) {
  const [gx, gy] = look.gaze
  return (
    <>
      <circle cx="53.6" cy="35" r="2.2" fill="#ff9d9d" opacity={look.mood === 'happy' ? 0.8 : 0.5} />
      <circle cx="70.4" cy="35" r="2.2" fill="#ff9d9d" opacity={look.mood === 'happy' ? 0.8 : 0.5} />
      {look.mood === 'sleepy' && (
        <>
          <path d="M54.4 31.4 q2.2 1.8 4.4 0 M65.2 31.4 q2.2 1.8 4.4 0" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          <ellipse cx="62" cy={36.6 + look.yawn * 0.8} rx={1.4 + look.yawn * 1.2} ry={0.9 + look.yawn * 2.6} fill={MOUTH} />
        </>
      )}
      {look.mood === 'alert' && (
        <>
          <path d="M54 26.6 q2.6 -1.4 5 0 M65 26.6 q2.6 -1.4 5 0" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx={56.4 + gx} cy={31 + gy} r="1.7" fill={EYE} />
          <circle cx={67.6 + gx} cy={31 + gy} r="1.7" fill={EYE} />
          <path d="M60 36.6 Q62 38.2 64 36.6" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {look.mood === 'happy' && (
        <>
          <path d="M54.2 32 Q56.5 28.6 58.8 32 M65.2 32 Q67.5 28.6 69.8 32" fill="none" stroke={EYE} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M57.4 36 Q62 41.4 66.6 36 Z" fill={MOUTH} />
        </>
      )}
    </>
  )
}

function Head({ look, messy, wobble }: { readonly look: Look; readonly messy: number; readonly wobble: number }) {
  return (
    <Layer rotate={look.tilt} origin={NECK}>
      {/* うしろがみ → かお → まえがみ */}
      <rect x="48" y="26" width="28" height="15" rx="6" fill={HAIR} />
      <circle cx={HEAD[0]} cy={HEAD[1] - 1} r="14" fill={HAIR} />
      <circle cx={HEAD[0]} cy={HEAD[1] + 2} r="12.4" fill={SKIN} />
      <path d="M49.6 29 C49 20 56 16.5 62 16.5 C68 16.5 75 20 74.4 29 C71.5 24.5 67 23.2 62 23.2 C57 23.2 52.5 24.5 49.6 29 Z" fill={HAIR} />
      <path d="M53 19.4 Q60 15.6 68 18" fill="none" stroke={HAIR_LIGHT} strokeWidth="1.2" strokeLinecap="round" />
      <Face look={look} />
      {/* ぼさぼさ: ぴょんと はねた かみ(かみかざりを つけると きえる) */}
      <g opacity={messy} fill="none" stroke={HAIR} strokeWidth="1.8" strokeLinecap="round" transform={`rotate(${wobble * 6} 62 16)`}>
        <path d="M60.5 15.4 C57.6 9.6 63.4 8.6 61.4 3.6" />
        <path d="M65 15.8 C67 11 71 11.4 71.4 7.6" />
        <path d="M49.4 25 q-4 -2 -6.4 1.2" />
        <path d="M74.6 25 q4 -2 6.4 1.2" />
      </g>
    </Layer>
  )
}

/** かた から ひじ で まがり 手に つながる うで。ひじ は 下がわ・そとがわ に出る。 */
function Arm({ shoulder, target, out }: { readonly shoulder: Point; readonly target: Point; readonly out: 1 | -1 }) {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.hypot(dx, dy) || 0.001
  const reach = Math.min(dist, 2 * LIMB - 0.05)
  const ux = dx / dist
  const uy = dy / dist
  const half = reach / 2
  const bulge = Math.sqrt(Math.max(0, LIMB * LIMB - half * half))
  // ひじ の ふくらむ むき: 下 と そとがわ を えらぶ
  const sign = -uy * out * 0.6 + ux >= 0 ? 1 : -1
  const elbow: Point = [shoulder[0] + ux * half + sign * -uy * bulge, shoulder[1] + uy * half + sign * ux * bulge]
  const hand: Point = [shoulder[0] + ux * reach, shoulder[1] + uy * reach]
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]}`} stroke={DRESS_DARK} strokeWidth="6.6" strokeLinecap="round" />
      <path d={`M${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} stroke={SKIN} strokeWidth="5" strokeLinecap="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.6" fill={SKIN} />
    </>
  )
}

type MotherProps = {
  readonly look: Look
  readonly messy: number
  readonly wobble: number
  /** しっぽ: 0 = だらんと 下がる / 1 = きちんと 左へ ながれる */
  readonly tail: number
  readonly handL: Point
  readonly handR: Point
  /** かみかざりの 場所。worn = あたまに のっている */
  readonly orn: { readonly x: number; readonly y: number; readonly worn: boolean }
  readonly breath: number
}

function Mother({ look, messy, wobble, tail, handL, handR, orn, breath }: MotherProps) {
  // しっぽ(1画目): きちんと むすぶと、左下へ ながれる。むすぶ前は だらんと 下がる
  const tailSwing = (1 - tail) * -54 + wobble * 5 * tail
  return (
    <>
      <Layer rotate={tailSwing} origin={TAIL_ROOT}>
        <path d="M50 22 C42 22 34 28 28 38" fill="none" stroke={HAIR} strokeWidth="5.4" strokeLinecap="round" />
        <path d="M46 23.4 C40 24.4 34 29 31 34" fill="none" stroke={HAIR_LIGHT} strokeWidth="1" strokeLinecap="round" />
      </Layer>
      <circle cx={TAIL_ROOT[0]} cy={TAIL_ROOT[1]} r="2.3" fill={PINK} opacity={tail} />
      {/* あし と くつ */}
      <rect x="53.6" y="82" width="5.4" height="10.6" rx="2.6" fill={SKIN_SHADE} />
      <rect x="65" y="82" width="5.4" height="10.6" rx="2.6" fill={SKIN_SHADE} />
      <ellipse cx="55.6" cy={FEET_Y} rx="5.2" ry="2.6" fill={SHOE} />
      <ellipse cx="67.8" cy={FEET_Y} rx="5.2" ry="2.6" fill={SHOE} />
      {/* くび: みじかく、どう と あたま の間 */}
      <rect x="59" y="39" width="6" height="8" rx="2.6" fill={SKIN_SHADE} />
      {/* どう: ふく と エプロン。いきに あわせて ほんの少し ふくらむ */}
      <Layer scaleX={1 + breath * 0.02} scaleY={1 + breath * 0.012} origin={[62, 90]}>
        <path d="M48 47 Q62 41.6 76 47 L82 88 Q62 91.4 42 88 Z" fill={DRESS} />
        <path d="M55 46.4 Q62 49.6 69 46.4 L72 88.6 Q62 90 52 88.6 Z" fill={APRON} />
        <path d="M43 85.6 Q62 89 81 85.6" fill="none" stroke={DRESS_DARK} strokeWidth="1.4" strokeLinecap="round" />
      </Layer>
      <circle cx={SHOULDER_L[0]} cy={SHOULDER_L[1]} r="4.4" fill={DRESS} />
      <circle cx={SHOULDER_R[0]} cy={SHOULDER_R[1]} r="4.4" fill={DRESS} />
      <Head look={look} messy={messy} wobble={wobble} />
      {orn.worn ? (
        <Layer rotate={look.tilt} origin={NECK}>
          <Headband x={orn.x} y={orn.y} />
        </Layer>
      ) : (
        <Headband x={orn.x} y={orn.y} />
      )}
      <Arm shoulder={SHOULDER_L} target={handL} out={-1} />
      <Arm shoulder={SHOULDER_R} target={handR} out={1} />
    </>
  )
}

/* ───────── にぎやかし ───────── */

/** ねむい ときの「z」。あたまの 右うえへ のぼる */
function Zzz({ t }: { readonly t: number }) {
  const show = during(t, 0.9, NOTICE, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show} fill="#5f7fd6" fontWeight="700" fontFamily="inherit">
      {[0, 0.55, 1.1].map((offset, i) => {
        const p = ((t + offset) % 1.65) / 1.65
        return (
          <text key={offset} x={80 + p * 8 + Math.sin(p * 6) * 1.2} y={24 - p * 12} fontSize={4 + i * 1.2 + p * 2} opacity={Math.sin(p * Math.PI)}>
            z
          </text>
        )
      })}
    </g>
  )
}

/** 「あっ」と 気づいた しるし(びっくりマーク) */
function Notice({ t }: { readonly t: number }) {
  const show = during(t, NOTICE, REACH + 0.2, 0.2)
  if (show <= 0) return null
  const pop = Math.max(0, span(t, NOTICE, NOTICE + 0.4, backOut))
  return (
    <Layer opacity={show} scale={pop} origin={[84, 24]}>
      <rect x="82.8" y="9" width="2.6" height="9" rx="1.3" fill="#e8534a" />
      <circle cx="84.1" cy="22" r="1.6" fill="#e8534a" />
    </Layer>
  )
}

/** カチッ と のせた しゅんかん の ひかり */
function ClickBurst({ t }: { readonly t: number }) {
  const p = span(t, CLICK - 0.05, CLICK + 0.5, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p} stroke="#ffd24a" strokeWidth="1.5" strokeLinecap="round">
      {[-60, -30, 0, 30, 60].map((deg) => {
        const rad = ((deg - 90) * Math.PI) / 180
        const r0 = 17 + p * 4
        const r1 = 22 + p * 6
        return <path key={deg} d={`M${WORN_ORN[0] + Math.cos(rad) * r0} ${WORN_ORN[1] + 12 + Math.sin(rad) * r0} L${WORN_ORN[0] + Math.cos(rad) * r1} ${WORN_ORN[1] + 12 + Math.sin(rad) * r1}`} />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  const pop = span(t, 0.2, 0.8, backOut)
  const breath = wave(t, 2.2) * (t < NOTICE ? 1 : 0.5)

  // かみかざり: 台の上 → (手で とる) → あたまへ
  const carry = span(t, GRAB + 0.1, CLICK, easeInOut)
  const carried = t >= GRAB + 0.1
  const worn = t >= CLICK
  const ornPos: Point = worn ? WORN_ORN : carried ? [lerpPoint(TABLE_ORN, WORN_ORN, carry)[0], lerpPoint(TABLE_ORN, WORN_ORN, carry)[1] - Math.sin(carry * Math.PI) * 7] : TABLE_ORN
  const press = worn ? Math.sin(span(t, CLICK, CLICK + 0.25) * Math.PI) * 1.2 : 0
  const orn = { x: ornPos[0], y: ornPos[1] + press, worn }

  // うで: ぶらん → のばして とる → かみかざりを もって あたまへ → やったー
  const cheer = span(t, CHEER, CHEER + 0.6, easeOut)
  const sway = wave(t, 2.2) * 1.6
  const hangL: Point = [HANG_L[0] - sway * 0.4, HANG_L[1] + sway * 0.3]
  const hangR: Point = [HANG_R[0] + sway * 0.4, HANG_R[1] + sway * 0.3]
  const gripAt = (p: Point): Point => [p[0] + ORN_GRIP[0], p[1] + ORN_GRIP[1]]
  const reachR = lerpPoint(hangR, gripAt(TABLE_ORN), span(t, REACH, GRAB, easeInOut))
  const handRBeforeCheer: Point = carried ? gripAt([ornPos[0], ornPos[1]]) : reachR
  const handR = lerpPoint(handRBeforeCheer, CHEER_R, cheer)
  const handL = lerpPoint(hangL, CHEER_L, cheer)

  // かお と あたま
  const happy = span(t, CLICK, CLICK + 0.3)
  const wobble = wave(t, 0.5) * happy
  const mood: Mood = t < NOTICE ? 'sleepy' : t < CLICK ? 'alert' : 'happy'
  const yawn = during(t, YAWN, NOTICE - 0.1, 0.3)
  const gaze: Point = t < GRAB ? [1.2, 0] : [0.3, t < CLICK ? -1.2 : 0]
  const tilt = (t < NOTICE ? wave(t, 2.2) * 2 - yawn * 4 : t < CLICK ? 1.5 : 0) + wobble * 3
  const look: Look = { mood, gaze, yawn, tilt }

  // うれしい とき は ぴょんと はずむ。かみは きちんと まとまる
  const hop = Math.abs(wave(t, 0.7)) * 2.6 * during(t, CHEER + 0.2, SUNSET + 1.4, 0.3)
  const tail = span(t, CLICK, CLICK + 0.3, backOut)
  const messy = 1 - span(t, CLICK - 0.05, CLICK + 0.25)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Room t={t} />
        <Layer scale={Math.max(0, pop)} origin={[62, FEET_Y]}>
          <ellipse cx="61.5" cy="94" rx="20" ry="3" fill="#000000" opacity="0.1" />
          <Layer y={-hop}>
            <Mother look={look} messy={messy} wobble={wobble} tail={tail} handL={handL} handR={handR} orn={orn} breath={breath} />
          </Layer>
        </Layer>
        <Zzz t={t} />
        <Notice t={t} />
        {/* 台の上の かみかざり が きらり(「これだ」と 気づかせる) */}
        {!carried && <Star cx={TABLE_ORN[0] + 9} cy={TABLE_ORN[1] - 12} r={3 * during(t, 2.5, GRAB, 0.3)} color="#fff3a0" spin={t * 90} />}
        <ClickBurst t={t} />
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
    { at: 0, label: '朝。お母さんが おきる', sound: 'pop' },
    { at: YAWN, label: 'ねむそうに あくび' },
    { at: NOTICE, label: '台の上の かみかざりに 気づく', sound: 'pop' },
    { at: REACH, label: 'うでを のばして とる' },
    { at: CLICK, label: 'あたまに カチッ。かみが まとまる', sound: 'ok' },
    { at: SUNSET, label: 'お日さまが しずんで、また のぼる(毎日)' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '毎 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
