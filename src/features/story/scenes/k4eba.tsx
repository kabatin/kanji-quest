/*
 * 人(ひと): 子どもが よこを むいて 立ち、うでを まえに のばしている。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … あたまの てっぺんの はねた かみ → どう(むね から こし)→ まえに ふみだした 足
 *   2画目(ヽ)  … こし から うしろへ のばした 足(あしの うらを けって、ぐっと ふみだす)
 *   (うで は 1画目の よこ、まえへ のびる。字と ぴったり 重ならなくても だいたい 同じ むき)
 *
 * ながれ
 *   野はらに お日さまと お花 → 子どもが しょんぼり あるいてくる(さみしい顔)
 *   → ちょうちょが ひらひら とんでくる。子どもが 気づいて びっくり(顔が ぱっと上がる)
 *   → うれしくなって、うでを まえに のばして 大きく 一歩 ふみだす
 *   → ちょうちょが 手に とまる(にっこり)
 *   → 子どもの 体に ほね が ひかって、絵が うすくなり、字「人」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。足は こし から ひざ で まがる。くび は みじかい。
 *   あるくときは 足と うで を ぎゃくに ふる。一歩 ふみだすと、こし が すこし 下がる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '人'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#4f9be0'
const TUNIC_DARK = '#3c82c4'
const TUNIC_FAR = '#33709f'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const WING = '#ff9fc2'
const WING_DARK = '#f2709f'
const WING_DOT = '#fff0b0'
const MOUTH = '#b9483f'

/** くぎり の時間(秒) */
const WALK = 0.5
const STOP = 2.7
/** ちょうちょ が見えはじめる / 子どもが 気づく */
const FLY_IN = 2.4
const NOTICE = 3.0
/** ちょうちょ が 目の前に きて、子どもが にっこりする */
const HAPPY = 3.8
/** うでを のばす・一歩 ふみだす */
const REACH = 3.9
const STEP = 4.0
const LAND = 5.0
const PERCHED = 5.7
const INK = 6.2
const DONE = 8.8
const DURATION = 9.3

type Pt = readonly [number, number]

/** こし(さいごの ふみだした すがた)。からだの絵は、この場所を もとに 描く */
const HIP: Pt = [45.5, 56]
/** ふみだした 2本の足の くるぶし。1画目・2画目の はしの あたり */
const FRONT_FOOT: Pt = [16.5, 86.5]
const BACK_FOOT: Pt = [80, 86]
const ANKLE_Y = 86.5
/** かた(からだの絵の中)と、さいごに のばす 手 */
const SHOULDER: Pt = [47.6, 40]
const HAND_REACH: Pt = [24.5, 41.5]
/** うで・足の ほねの長さ(かた→ひじ→手、こし→ひざ→くるぶし) */
const UPPER_ARM = 13.5
const FORE_ARM = 13.5
const THIGH = 21
const SHIN = 26
/** 立っているとき、こし は 一歩 ふみだした ときより この分だけ 高い */
const STAND_RISE = 14
/** ちょうちょ が 手に とまる場所 */
const PERCH: Pt = [24.2, 36.6]

/** 2つの ほね(a→mid→end)で つなぐ。とどかないときは のばしきった ところ まで。score が 大きい ほうへ まがる。 */
function twoBone(a: Pt, target: Pt, first: number, second: number, score: (p: Pt) => number): { readonly mid: Pt; readonly end: Pt } {
  const dx = target[0] - a[0]
  const dy = target[1] - a[1]
  const reach = Math.max(0.5, Math.min(Math.hypot(dx, dy), first + second - 0.05))
  const base = Math.atan2(dy, dx)
  const cosA = (first * first + reach * reach - second * second) / (2 * first * reach)
  const spread = Math.acos(Math.min(1, Math.max(-1, cosA)))
  const at = (angle: number): Pt => [a[0] + Math.cos(angle) * first, a[1] + Math.sin(angle) * first]
  const up = at(base + spread)
  const down = at(base - spread)
  return {
    mid: score(up) >= score(down) ? up : down,
    end: [a[0] + Math.cos(base) * reach, a[1] + Math.sin(base) * reach],
  }
}

/** ひざ は まえ(左)へ まがる */
const kneeScore = (p: Pt) => -p[0]
/** ひじ は うしろ・下へ まがる */
const elbowScore = (p: Pt) => p[0] + p[1]

const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/* ───────── 野はら ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[95, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="94.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 95 13)`} />
        ))}
      </Layer>
      <circle cx="95" cy="13" r={6.2 * sun} fill={SUN} />
      {/* とおくの おか と、ゆっくり ながれる 雲 */}
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="-4" cy="11" rx="7" ry="3.4" />
        <ellipse cx="1" cy="9" rx="5" ry="3.4" />
        <ellipse cx="70" cy="22" rx="6" ry="2.8" />
        <ellipse cx="74.5" cy="20.4" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[30, 62, 90].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 地面に 咲く お花。ぽん と そだって、かぜで ゆれる。 */
function Flower({ t, x, phase, color }: SceneProps & { readonly x: number; readonly phase: number; readonly color: string }) {
  const grow = span(t, 0.25 + phase * 0.1, 0.95 + phase * 0.1, backOut)
  const sway = wave(t, 2.6, phase) * 4
  return (
    <Layer scale={grow} rotate={sway} origin={[x, 95]}>
      <path d={`M${x} 95 Q${x - 0.8} 90 ${x} 85.5`} fill="none" stroke={LEAF_DARK} strokeWidth="1.3" strokeLinecap="round" />
      <path d={`M${x} 91 q3 -2.8 4.6 -0.6 q-2.6 2.2 -4.6 0.6 Z`} fill={LEAF} />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={x + Math.cos((i / 5) * Math.PI * 2) * 2.5} cy={83.4 + Math.sin((i / 5) * Math.PI * 2) * 2.5} r="1.9" fill={color} />
      ))}
      <circle cx={x} cy="83.4" r="1.6" fill={SUN} />
    </Layer>
  )
}

/* ───────── ちょうちょ ───────── */

/** ちょうちょ の いち。とんでくる → 手の まえで ひらひら → 手に とまる */
function butterflyPosition(t: number): Pt {
  const hover = (u: number): Pt => {
    const w = ((u - 3.4) / 1.8) * Math.PI * 2
    return [16 + 3.6 * Math.cos(w), 32 + 2.4 * Math.sin(2 * w)]
  }
  if (t < 3.4) {
    const p = span(t, FLY_IN, 3.4, easeOut)
    return [lerp(-6, 19.6, p) + wave(t, 0.7) * 0.8, lerp(12, 32, p) - Math.sin(p * Math.PI) * 6 + wave(t, 0.5) * 1.1]
  }
  if (t < LAND) return hover(t)
  const from = hover(LAND)
  const k = span(t, LAND, PERCHED, easeInOut)
  return [lerp(from[0], PERCH[0], k), lerp(from[1], PERCH[1], k)]
}

function Butterfly({ t }: SceneProps) {
  if (t < FLY_IN) return null
  const [x, y] = butterflyPosition(t)
  const perched = t >= PERCHED
  // はばたき: とんでいる間は はやく、とまったら ゆっくり
  const flap = perched ? 0.35 + 0.65 * Math.abs(Math.cos(((t - PERCHED) / 1.1) * Math.PI)) : 0.25 + 0.75 * Math.abs(Math.cos((t / 0.22) * Math.PI))
  const tilt = perched ? 0 : wave(t, 1.8) * 10
  return (
    <Layer x={x} y={y} rotate={tilt}>
      <Layer scaleX={flap}>
        <ellipse cx="-3.7" cy="-1.5" rx="3.9" ry="3.1" fill={WING} transform="rotate(-22 -3.7 -1.5)" />
        <ellipse cx="3.7" cy="-1.5" rx="3.9" ry="3.1" fill={WING} transform="rotate(22 3.7 -1.5)" />
        <ellipse cx="-2.6" cy="2.1" rx="2.5" ry="2.2" fill={WING_DARK} />
        <ellipse cx="2.6" cy="2.1" rx="2.5" ry="2.2" fill={WING_DARK} />
        <circle cx="-4" cy="-1.8" r="1" fill={WING_DOT} />
        <circle cx="4" cy="-1.8" r="1" fill={WING_DOT} />
      </Layer>
      <ellipse cx="0" cy="0.2" rx="0.8" ry="3" fill={HAIR} />
      <path d="M-0.3 -2.6 q-1 -1.8 -2.2 -2 M0.3 -2.6 q1 -1.8 2.2 -2" fill="none" stroke={HAIR} strokeWidth="0.5" strokeLinecap="round" />
    </Layer>
  )
}

/* ───────── 子ども ───────── */

type Mood = 'sad' | 'surprised' | 'happy'

/** あたま。顔は 左むき。かみの はねた ところが 1画目の 書きはじめ。 */
function Head({ mood }: { readonly mood: Mood }) {
  return (
    <g transform="translate(20.3 2.9)">
      <circle cx="30.2" cy="24.6" r="9.2" fill={SKIN} />
      <path d="M21.5 23 C21.4 13.8 31.8 11.2 37.8 17 C40.2 20.2 40.2 26 38.2 30.2 C37.6 24.4 33.4 20.2 26.6 20.6 C24.4 20.8 22.6 21.8 21.5 23 Z" fill={HAIR} />
      <circle cx="26.5" cy="29" r="2.1" fill="#ff9d9d" opacity="0.55" />
      {mood === 'sad' && (
        <>
          <path d="M23.6 23.8 l3 1.2" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="25.4" cy="26.2" r="1.15" fill="#2b2b2b" />
          <path d="M23.3 31.6 Q24.9 29.8 26.6 31.4" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'surprised' && (
        <>
          <path d="M23.2 21.8 l3.2 -0.8" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="25.4" cy="24.8" r="1.7" fill="#2b2b2b" />
          <circle cx="25" cy="24.3" r="0.55" fill="#ffffff" />
          <ellipse cx="24.7" cy="30.8" rx="1.3" ry="1.8" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M23.4 22.6 l3 -0.5" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="25.4" cy="25" r="1.3" fill="#2b2b2b" />
          <circle cx="25" cy="24.5" r="0.45" fill="#ffffff" />
          <path d="M22.9 29.2 Q24.8 33.2 27.3 29.5 Z" fill={MOUTH} />
        </>
      )}
      {/* 1画目の 書きはじめ: ぴょこんと はねた かみ */}
      <path d="M32.4 17.6 Q33.2 14.4 35 16.5 Q36.2 13.8 37 16.9" fill="none" stroke={HAIR} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。 */
function Arm({ hand, color }: { readonly hand: Pt; readonly color: string }) {
  const { mid, end } = twoBone(SHOULDER, hand, UPPER_ARM, FORE_ARM, elbowScore)
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${mid[0]} ${mid[1]} L${end[0]} ${end[1]}`} fill="none" stroke={color} strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={end[0]} cy={end[1]} r="3.3" fill={SKIN} />
    </>
  )
}

/** こし から ひざ で まがる 足。くるぶし に くつ。rot は くつの かたむき(うしろの足は つまさきで けるので かたむく) */
function Leg({ hip, ankle, color, rot }: { readonly hip: Pt; readonly ankle: Pt; readonly color: string; readonly rot: number }) {
  const { mid, end } = twoBone(hip, ankle, THIGH, SHIN, kneeScore)
  return (
    <>
      <path d={`M${hip[0]} ${hip[1]} L${mid[0]} ${mid[1]} L${end[0]} ${end[1]}`} fill="none" stroke={color} strokeWidth="6.8" strokeLinecap="round" strokeLinejoin="round" />
      <g transform={`translate(${end[0]} ${end[1]}) rotate(${rot})`}>
        <ellipse cx="-1.8" cy="1.8" rx="5.3" ry="2.8" fill={SHOE} />
      </g>
    </>
  )
}

type PersonProps = {
  /** こし の いち(世界の中) */
  readonly hip: Pt
  readonly nearAnkle: Pt
  readonly farAnkle: Pt
  readonly farRot: number
  readonly lean: number
  readonly headTilt: number
  readonly mood: Mood
  readonly nearHand: Pt
  readonly farHand: Pt
  /** 気づいた「はっ」の すじ(0〜1) */
  readonly gasp: number
}

function Person({ hip, nearAnkle, farAnkle, farRot, lean, headTilt, mood, nearHand, farHand, gasp }: PersonProps) {
  return (
    <>
      {/* むこうの足(うしろの足): 体の うしろ */}
      <Leg hip={hip} ankle={farAnkle} color={PANTS_DARK} rot={farRot} />
      {/* 上半身: こし を じく に すこし かたむく */}
      <Layer x={hip[0] - HIP[0]} y={hip[1] - HIP[1]} rotate={lean} origin={HIP}>
        <Arm hand={farHand} color={TUNIC_FAR} />
        {/* くび: どう と あたま の間を みじかく つなぐ */}
        <rect x="47.2" y="33" width="5.2" height="8" rx="2.4" fill={SKIN_SHADE} />
        {/* どう と こし */}
        <path d="M47.6 43 L46.2 52" fill="none" stroke={TUNIC} strokeWidth="13.4" strokeLinecap="round" />
        <path d="M46.2 52 L45.6 56.2" fill="none" stroke={PANTS} strokeWidth="13.6" strokeLinecap="round" />
        <path d="M40 52.2 h12.6" stroke={TUNIC_DARK} strokeWidth="1.5" strokeLinecap="round" />
      </Layer>
      {/* まえの足(ふみだした足) */}
      <Leg hip={hip} ankle={nearAnkle} color={PANTS} rot={0} />
      <Layer x={hip[0] - HIP[0]} y={hip[1] - HIP[1]} rotate={lean} origin={HIP}>
        {/* てまえの うで */}
        <Arm hand={nearHand} color={TUNIC_DARK} />
        {/* あたま: くび を じく に うなずく・見上げる */}
        <Layer rotate={headTilt} origin={[49.8, 35.5]}>
          <Head mood={mood} />
        </Layer>
        {/* はっ と 気づいた しるし: あたまの 左うえに みじかい すじ */}
        {gasp > 0 && (
          <g opacity={gasp} stroke="#f2b632" strokeWidth="1.3" strokeLinecap="round">
            {[170, 195, 220].map((deg) => {
              const rad = (deg * Math.PI) / 180
              return <line key={deg} x1={50.5 + Math.cos(rad) * 14} y1={27.5 + Math.sin(rad) * 14} x2={50.5 + Math.cos(rad) * 18.5} y2={27.5 + Math.sin(rad) * 18.5} />
            })}
          </g>
        )}
      </Layer>
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 2)

  // あるく: 右から 野はらの まんなかへ。あしを ふって、体が 上下する
  const walkX = mix(t, WALK, STOP, 70, 0, (x) => 1 - (1 - x) ** 2)
  const walking = 1 - span(t, STOP - 0.3, STOP)
  const phase = (Math.min(t, STOP) - WALK) * Math.PI * 2 * 1.5
  const bob = -Math.abs(Math.cos(phase)) * 1.2 * walking

  // 立っているときの あし(あるくとき かわりばんこに ふる)
  const standX = HIP[0] + walkX
  const amp = 3 + 6 * walking
  // すすむ向きは 左(-x)。足の いち = こし + amp*sin(位相)。cos>0 の間は 足が うしろへ ながれる(地面に ついている)。
  // 足が うく(ひざ・足先が上がる)のは まえへ ふりだす cos<0 の間。
  const standNear: Pt = [standX + amp * Math.sin(phase), ANKLE_Y - 4 * walking * Math.max(0, -Math.cos(phase))]
  const standFar: Pt = [standX + amp * Math.sin(phase + Math.PI), ANKLE_Y - 4 * walking * Math.max(0, -Math.cos(phase + Math.PI))]

  // 一歩 ふみだす: まえの足は ふりだして 地面に つく。うしろの足は つまさきで 地面を けって のびる。こし が 下がる
  const step = span(t, STEP, STEP + 1.0, easeInOut)
  const nearAnkle: Pt = [lerp(standNear[0], FRONT_FOOT[0], step), lerp(standNear[1], FRONT_FOOT[1], step) - 6 * Math.sin(step * Math.PI)]
  const farAnkle: Pt = [lerp(standFar[0], BACK_FOOT[0], step), lerp(standFar[1], BACK_FOOT[1], step)]
  const hip: Pt = [standX, HIP[1] - STAND_RISE * (1 - step) + bob]

  // きもち: しょんぼり → はっ → にっこり
  const mood: Mood = t < NOTICE ? 'sad' : t < HAPPY ? 'surprised' : 'happy'
  // 立っているときは まっすぐ(絵の どうは 字に合わせて すこし うしろへ かたむいている ので、その分を もどす)
  const lean = -6 * (1 - step) - 4 * (1 - span(t, STOP, NOTICE)) + 3 * during(t, NOTICE, HAPPY + 0.1, 0.2)
  const headTilt = mix(t, NOTICE - 0.1, NOTICE + 0.2, -8, 5) + mix(t, HAPPY, HAPPY + 0.5, 0, -3)

  // うで: あるくときは 足と ぎゃくに ふり、しょんぼり のときは だらん と下げる。さいごに てまえの うで を まえへ のばす
  const reach = span(t, REACH, REACH + 1.0, easeInOut)
  const swing = 6 * walking * Math.sin(phase)
  const hang: Pt = [SHOULDER[0] + 0.5, SHOULDER[1] + 24.5]
  const nearHang: Pt = [hang[0] - swing, hang[1]]
  const nearHand: Pt = [lerp(nearHang[0], HAND_REACH[0], reach), lerp(nearHang[1], HAND_REACH[1], reach)]
  const farHand: Pt = [lerp(hang[0] + swing, SHOULDER[0] + 9, reach), lerp(hang[1], SHOULDER[1] + 17, reach)]

  const footMid = (nearAnkle[0] + farAnkle[0]) / 2
  const shadowRx = 10 + Math.abs(nearAnkle[0] - farAnkle[0]) / 2

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Flower t={t} x={5} phase={0} color="#f07f9e" />
        <Flower t={t} x={101} phase={1.3} color="#ffffff" />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.1)}>
          <ellipse cx={footMid} cy="94" rx={shadowRx} ry="2.4" fill="#000000" opacity="0.12" />
          <Person hip={hip} nearAnkle={nearAnkle} farAnkle={farAnkle} farRot={-35 * step} lean={lean} headTilt={headTilt} mood={mood} nearHand={nearHand} farHand={farHand} gasp={during(t, NOTICE, HAPPY, 0.15)} />
        </Layer>
        <Butterfly t={t} />
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
    { at: 0, label: '野はらに お日さまと お花', sound: 'pop' },
    { at: WALK, label: '子どもが しょんぼり あるいてくる' },
    { at: NOTICE, label: 'ちょうちょ に 気づいて びっくり', sound: 'pop' },
    { at: STEP, label: 'うでを まえに のばして 一歩 ふみだす' },
    { at: LAND, label: 'ちょうちょ が 手に とまる。にっこり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '人 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
