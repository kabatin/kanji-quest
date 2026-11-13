/*
 * 後(うしろ): あしに ひもが からまって、みんなより おくれて しまう。
 *
 * ほね(画と絵の対応)
 *   1・2画目(ノ ノ) … 「ぎょうにんべん」。みちを あるく 子の あたまから せなか のほう(ゆるい ななめ)
 *   3画目(丨)       … 子の どう と あし(たて)
 *   4〜6画目(幺)    … 子の あしに からまった ひも(いとの わ)
 *   7〜9画目(夂)    … ひもに ひっぱられて 止まった あしと、さきへ すすんで いく みんなの あしあと
 *   (絵と字は だいたい 同じ場所・同じ向き。ぴったり重ねるために、体を ゆがめることは しない)
 *
 * ながれ
 *   みんなと いっしょに、たのしく みちを あるく(ちょうど 子の まえに、赤い ひもが おちている)
 *   → ひもが あしに ひっかかって、からまる。びっくり!
 *   → みんなは 気づかずに さきへ いく。子は あしが うごかず、かなしくなって「まってー」と 手をのばす
 *   → ほね が ひかって、絵が うすくなり、字「後」が のこる
 *
 * 子と みんなは、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。あるくときは あし と ぎゃくに ふる。
 *   あし は こし から出て、ひざ で まがる。体の かたむきは こし を じく にする。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '後'

const SKIN = '#f8cfa6'
const HAIR = '#5a3b2a'
const SHOE = '#6b4a36'
const CHEEK = '#ff9d9d'
const MOUTH = '#b9483f'
const EYE = '#2b2b2b'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const HILL = '#e2f2d2'
const PATH = '#f0dcae'
const PEBBLE = '#d9c08a'
const SUN = '#ffd24a'
const STRING = '#e8534a'
const STRING_DARK = '#c23d36'
const TEAR = '#7cc4f2'

/** くぎり の時間(秒) */
const CATCH = 3.0
const SAD = 3.9
const CALL = 4.6
const INK = 5.9
const DONE = 8.7
const DURATION = 9.3

/** 子の 足もと(まんなか の x と 地面の y)と、体の おおきさ */
const CHILD_X = 28
const GROUND = 97
const CHILD_SCALE = 0.85
/** あるく はやさ(ちかくの みち が 1秒で うしろへ ながれる 長さ) */
const SPEED = 15
/** 子が あるく 足の ふりの はやさ。CATCH の しゅんかんに、まえの あし が ちょうど 地面に つく */
const STEP_RATE = 4.25 / CATCH
/** 足の ふりの ひろさ(角度) */
const SWING = 26
/** 体の ひくさ: ふんばった とき に、こし を 下げて 足を 地面に つける */
const DROP = 2.6

/* ───────── からだ(子ども 1人ぶんの 部品) ───────── */

/** 体の 大きさ(足もとが y=0、まえ が +x)。ぜんぶ この 数字で そろえる */
const HIP: readonly [number, number] = [0, -29]
const SHOULDER: readonly [number, number] = [0, -51]
const NECK: readonly [number, number] = [0, -56]
const THIGH = 13
const SHIN = 13
const UPPER_ARM = 11
const FORE_ARM = 10

/** あし の かっこう。a = こし から まえへ ふった角度 / b = ひざ の まがり(うしろへ) */
type LegPose = { readonly a: number; readonly b: number }
/** うで の かっこう。swing = ま下から まえへ ふった角度 / bend = ひじ の まがり(まえへ) */
type ArmPose = { readonly swing: number; readonly bend: number }
type Mood = 'happy' | 'surprised' | 'sad' | 'call'

type Palette = {
  readonly shirt: string
  readonly shirtDark: string
  readonly pants: string
  readonly pantsDark: string
  readonly bag: string
}

const rad = (deg: number) => (deg * Math.PI) / 180

function legPoints(pose: LegPose) {
  const knee = [HIP[0] + Math.sin(rad(pose.a)) * THIGH, HIP[1] + Math.cos(rad(pose.a)) * THIGH] as const
  const shinAngle = pose.a - pose.b
  const ankle = [knee[0] + Math.sin(rad(shinAngle)) * SHIN, knee[1] + Math.cos(rad(shinAngle)) * SHIN] as const
  return { knee, ankle }
}

function Leg({ pose, color }: { readonly pose: LegPose; readonly color: string }) {
  const { knee, ankle } = legPoints(pose)
  return (
    <>
      <path d={`M${HIP[0]} ${HIP[1]} L${knee[0]} ${knee[1]} L${ankle[0]} ${ankle[1]}`} fill="none" stroke={color} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx={ankle[0] + 2.4} cy={ankle[1] + 0.6} rx="4.8" ry="2.4" fill={SHOE} />
    </>
  )
}

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。 */
function Arm({ pose, color }: { readonly pose: ArmPose; readonly color: string }) {
  const elbow = [SHOULDER[0] + Math.sin(rad(pose.swing)) * UPPER_ARM, SHOULDER[1] + Math.cos(rad(pose.swing)) * UPPER_ARM] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] + Math.sin(rad(fore)) * FORE_ARM, elbow[1] + Math.cos(rad(fore)) * FORE_ARM] as const
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3" fill={SKIN} />
    </>
  )
}

/** かお。まえ(右)を むいている。 */
function Face({ mood, tear }: { readonly mood: Mood; readonly tear: number }) {
  return (
    <>
      <circle cx="3" cy="-59.6" r="1.8" fill={CHEEK} opacity="0.55" />
      {mood === 'happy' && (
        <>
          <path d="M2.8 -63 Q4.6 -65.6 6.4 -63" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M3.6 -58.6 Q5.6 -56.2 7.4 -58.8" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'surprised' && (
        <>
          <path d="M3 -67 Q5 -68.6 7 -67" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="5" cy="-63.4" r="1.5" fill={EYE} />
          <ellipse cx="6" cy="-58" rx="1.3" ry="1.8" fill={MOUTH} />
        </>
      )}
      {(mood === 'sad' || mood === 'call') && (
        <>
          <path d="M2.8 -65.8 L6.8 -67.2" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="5" cy="-63" r="1.2" fill={EYE} />
          {mood === 'call' ? <ellipse cx="6" cy="-58" rx="1.5" ry="2" fill={MOUTH} /> : <path d="M3.8 -57.2 Q5.6 -59.4 7.6 -57.2" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />}
          {tear > 0 && tear < 1 && <path d={`M6.2 ${-61 + tear * 5} q1.1 1.5 0 2.4 q-1.1 -0.9 0 -2.4 Z`} fill={TEAR} opacity={1 - tear} />}
        </>
      )}
    </>
  )
}

type ChildProps = {
  readonly palette: Palette
  readonly mood: Mood
  readonly near: LegPose
  readonly far: LegPose
  readonly nearArm: ArmPose
  readonly farArm: ArmPose
  /** うわ体の かたむき(こし を じく に、まえへ) */
  readonly lean: number
  readonly headTilt: number
  readonly tear: number
  /** びっくり の すじ(0〜1) */
  readonly surprise: number
  /** あしに からまった ひも(0〜1)と、ひもの もう一方(体の座標) */
  readonly tangle: number
  readonly tailTo: readonly [number, number]
}

/** ひもが あしくび に ぐるぐる まきつき、もう一方は 地面に おちている。 */
function Tangle({ ankle, amount, tailTo }: { readonly ankle: readonly [number, number]; readonly amount: number; readonly tailTo: readonly [number, number] }) {
  if (amount <= 0) return null
  const [ax, ay] = ankle
  const midX = (ax + tailTo[0]) / 2 + 2
  const midY = (ay + tailTo[1]) / 2 - 1
  return (
    <g opacity={amount} fill="none" stroke={STRING} strokeWidth="1.3" strokeLinecap="round">
      <path d={`M${ax + 1} ${ay + 1.4} Q${midX} ${midY} ${tailTo[0]} ${tailTo[1]}`} />
      <ellipse cx={ax} cy={ay - 0.6} rx="3.6" ry="1.5" transform={`rotate(-12 ${ax} ${ay})`} />
      <ellipse cx={ax} cy={ay + 1.1} rx="3.6" ry="1.5" transform={`rotate(10 ${ax} ${ay})`} stroke={STRING_DARK} />
    </g>
  )
}

function Child({ palette, mood, near, far, nearArm, farArm, lean, headTilt, tear, surprise, tangle, tailTo }: ChildProps) {
  return (
    <>
      <Leg pose={far} color={palette.pantsDark} />
      <Leg pose={near} color={palette.pants} />
      <Tangle ankle={legPoints(near).ankle} amount={tangle} tailTo={tailTo} />
      {/* うわ体: こし を じく に かたむく。あたまと うでも いっしょに うごく */}
      <Layer rotate={lean} origin={HIP}>
        <Arm pose={farArm} color={palette.shirtDark} />
        <rect x="-11" y="-50" width="6" height="15" rx="2.6" fill={palette.bag} />
        <rect x="-6" y="-55" width="12" height="28" rx="5.5" fill={palette.shirt} />
        <rect x="-5.6" y="-32" width="11.2" height="6" rx="3" fill={palette.pants} />
        <Arm pose={nearArm} color={palette.shirtDark} />
        {/* くび は みじかく、どう の まんなか の上 */}
        <rect x="-2" y="-58" width="4" height="6" rx="1.6" fill={SKIN} />
        <Layer rotate={headTilt} origin={NECK}>
          <circle cx="-0.4" cy="-65" r="8" fill={HAIR} />
          <circle cx="1.6" cy="-62.4" r="7.6" fill={SKIN} />
          <path d="M-4.4 -70.4 Q6.4 -73.4 9.2 -64.8 Q5.2 -68.2 -3.6 -67.6 Z" fill={HAIR} />
          <Face mood={mood} tear={tear} />
          {surprise > 0 && (
            <g opacity={surprise} stroke="#f2a33a" strokeWidth="1.2" strokeLinecap="round">
              <path d="M-1 -76 l-2 -3.2 M4 -77.6 v-3.8 M9.2 -75.6 l2 -3.2" />
            </g>
          )}
        </Layer>
      </Layer>
    </>
  )
}

const CHILD_PALETTE: Palette = { shirt: '#f5a742', shirtDark: '#e08f2a', pants: '#3e5c86', pantsDark: '#34507a', bag: '#4f9be0' }
const FRIEND_PALETTES: readonly Palette[] = [
  { shirt: '#5cc08a', shirtDark: '#46a874', pants: '#7a6a9c', pantsDark: '#675989', bag: '#f086a8' },
  { shirt: '#f086a8', shirtDark: '#d96f93', pants: '#4a7aa8', pantsDark: '#3c6894', bag: '#ffd24a' },
]

/** あるく ときの 足と うでの ふり(p は ひと足ごとに 進む 角度) */
function gait(p: number) {
  const s = Math.sin(p)
  const c = Math.cos(p)
  return {
    near: { a: SWING * s, b: 30 * Math.max(0, c) } as LegPose,
    far: { a: -SWING * s, b: 30 * Math.max(0, -c) } as LegPose,
    nearArm: { swing: -22 * s, bend: 14 } as ArmPose,
    farArm: { swing: 22 * s, bend: 14 } as ArmPose,
    drop: DROP * Math.abs(s),
  }
}

/* ───────── けしき ───────── */

function Backdrop({ t, scroll }: { readonly t: number; readonly scroll: number }) {
  const wrap = (x: number) => ((x % 130) + 130) % 130 - 10
  return (
    <>
      <Layer opacity={span(t, 0, 0.5)} rotate={t * 14} origin={[100, 12]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="99.3" y="3.6" width="1.4" height="3.2" rx="0.7" fill={SUN} transform={`rotate(${i * 45} 100 12)`} />
        ))}
      </Layer>
      <circle cx="100" cy="12" r="5" fill={SUN} />
      <path d="M-4 90 Q20 70 46 84 Q74 66 113 86 V95 H-4 Z" fill={HILL} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="14" cy="8" rx="7" ry="3.2" />
        <ellipse cx="19" cy="6.4" rx="4.6" ry="3" />
      </g>
      <rect x="-4" y="85" width="121" height="8" fill={GRASS} />
      <rect x="-4" y="90.5" width="121" height="22" fill={PATH} />
      {[10, 38, 64, 90, 118].map((w) => (
        <path key={w} d={`M${wrap(w - scroll * 0.6)} 90 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
      {[18, 52, 84, 112].map((w, i) => (
        <ellipse key={w} cx={wrap(w - scroll)} cy={102 + (i % 2) * 4} rx="2.2" ry="1.1" fill={PEBBLE} />
      ))}
    </>
  )
}

/** みちに おちている 赤い ひも。ひとつ わ を つくって、ゆるく ねじれている。 */
function Coil({ x }: { readonly x: number }) {
  return (
    <g transform={`translate(${x} 98.8)`} fill="none" stroke={STRING} strokeWidth="1.5" strokeLinecap="round">
      <path d="M-10 1 Q-7 -2.4 -4 0.4 T2 0.4 C5 -3 9.4 -1.6 7.4 1.2 C5.4 3.2 2 1.6 4 -0.6" />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 9)

  // あるく間は みちが うしろへ ながれる。ひもに ひっかかると、ふっと 止まる
  const walkT = Math.min(t, CATCH) + 0.15 * easeOut(span(t, CATCH, CATCH + 0.3))
  const scroll = SPEED * walkT
  /** まえの あし が 地面に ついた しゅんかん、ちょうど あし の下に ひもが くる */
  const coilX = CHILD_X + 9.7 + SPEED * CATCH - scroll

  const p = Math.min(t, CATCH) * Math.PI * 2 * STEP_RATE
  const walk = gait(p)
  const stuck = t >= CATCH

  // 子の ようす
  const mood: Mood = t < CATCH ? 'happy' : t < SAD ? 'surprised' : t < CALL ? 'sad' : 'call'
  const tug = stuck ? Math.abs(wave(t - CATCH, 0.7)) * span(t, CATCH + 0.3, CATCH + 0.6) * (1 - span(t, CALL, CALL + 0.5)) : 0
  const near: LegPose = stuck ? { a: SWING - 4 * tug, b: 0 } : walk.near
  const far: LegPose = stuck ? { a: mix(t, CATCH, CATCH + 0.3, -SWING, -8, easeOut), b: 0 } : walk.far
  const nearSwing = !stuck ? walk.nearArm.swing : t < SAD ? mix(t, CATCH, CATCH + 0.3, -22 * Math.sin(p), 70, backOut) : t < CALL ? mix(t, SAD, SAD + 0.4, 70, 25) : mix(t, CALL, CALL + 0.5, 25, 125, easeOut) + wave(t, 0.6) * span(t, CALL + 0.5, CALL + 0.7) * 14
  const farSwing = !stuck ? walk.farArm.swing : t < SAD ? mix(t, CATCH, CATCH + 0.3, 22 * Math.sin(p), 55, backOut) : mix(t, SAD, SAD + 0.4, 55, 8)
  const nearArm: ArmPose = { swing: nearSwing, bend: stuck ? 8 : 14 }
  const farArm: ArmPose = { swing: farSwing, bend: stuck ? 8 : 14 }
  // びっくり で のけぞって、すぐ かたむく
  const lean = t < CATCH ? 0 : t < CATCH + 0.25 ? mix(t, CATCH, CATCH + 0.25, 0, 14, easeOut) : t < SAD ? mix(t, CATCH + 0.25, SAD, 14, 3, easeInOut) : 3 + wave(t - SAD, 1.4) * 1.2
  const headTilt = t < CATCH ? 0 : mix(t, SAD, SAD + 0.5, 0, 7)
  const drop = stuck ? DROP : walk.drop
  const childY = GROUND + drop * CHILD_SCALE
  const tear = t >= SAD && t < INK ? ((t - SAD) % 1.1) / 1.1 : 0
  const tangle = span(t, CATCH, CATCH + 0.3)
  const tailTo: readonly [number, number] = [(coilX + 1 - CHILD_X) / CHILD_SCALE, (98.8 - childY) / CHILD_SCALE]

  // みんな: ひもに きづかず、おなじ ちょうしで あるいて さきへ いく(だんだん とおく・ちいさく)
  const away = Math.max(0, t - CATCH)
  const friends = [
    { x: 54 + 6 * away, offset: 0, palette: FRIEND_PALETTES[0] },
    { x: 74 + 6 * away, offset: 1.7, palette: FRIEND_PALETTES[1] },
  ]
  const friendScale = mix(t, CATCH, DONE, 0.52, 0.42, easeOut)
  const friendY = mix(t, CATCH, DONE, 94, 91.5, easeOut)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} scroll={scroll} />
        <Coil x={coilX} />
        {friends.map((friend, i) => {
          const g = gait(t * Math.PI * 2 * STEP_RATE + friend.offset)
          return (
            <Layer key={i} x={friend.x} y={friendY + g.drop * friendScale} scale={friendScale}>
              <Child palette={friend.palette} mood="happy" near={g.near} far={g.far} nearArm={g.nearArm} farArm={g.farArm} lean={0} headTilt={0} tear={0} surprise={0} tangle={0} tailTo={[0, 0]} />
            </Layer>
          )
        })}
        <ellipse cx={CHILD_X + 2} cy="98.6" rx="9" ry="2" fill="#000000" opacity="0.12" />
        <Layer x={CHILD_X} y={childY} scale={CHILD_SCALE}>
          <Child palette={CHILD_PALETTE} mood={mood} near={near} far={far} nearArm={nearArm} farArm={farArm} lean={lean} headTilt={headTilt} tear={tear} surprise={during(t, CATCH, CATCH + 0.9, 0.15)} tangle={tangle} tailTo={tailTo} />
        </Layer>
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
    { at: 0, label: 'みんなと いっしょに みちを あるく', sound: 'pop' },
    { at: CATCH, label: 'ひもが あしに からまって、びっくり', sound: 'pop' },
    { at: SAD, label: 'みんなは さきへ。子は うごけず かなしくなる' },
    { at: CALL, label: '「まってー」と 手をのばす' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '後 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
