/*
 * 黄(き): こしに さげた 黄色い 玉(たま)の かたち。
 *
 * ほね(画と絵の対応)
 *   この字は「こしに さげた 玉」の かたち。ひもの上の よこ線(1〜4画目)が こしの ひも、
 *   まんなかの わく(5〜9画目)が 玉、したに ひろがる 2本(10・11画目)が ふさ。
 *   子どもの 体の大きさを ほんものらしく 守るので、玉は 字より 小さく なる。
 *   絵と字は だいたい 同じ あたり(まんなか〜したがわ)で かさなればよい、として 1 を えらんだ。
 *   (Bone は 使わない。玉の かたちを 字に 合わせて ゆがめないため)
 *
 * ながれ
 *   子どもが ひとり たっている → 黄色い 玉を くわえた 鳥が とんでくる(子どもは びっくり)
 *   → 鳥が 玉を ぽとん と おとす → 子どもが りょうてで うけとって 大よろこび
 *   → こしの ひもに ゆわえつける → 玉が ゆらゆら ゆれる(うれしそう)
 *   → ほね が ひかって、絵が うすくなり、字「黄」が のこる
 *
 * 子どもは ほんものの人の つくり を守る:
 *   くび は みじかく、うで は かた から出て ひじ で まがる(かた→ひじ→手 と つながる)。
 *   手は、つかむ ところへ とどくように ひじを まげて あわせる(IK)。とどかない ときは のばしきる。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '黄'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#4f9be0'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const BELT = '#b9503a'
const LEAF = '#55b86e'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const JADE = '#ffd24a'
const JADE_DARK = '#e0a21a'
const CORD = '#d9534f'
const BIRD = '#6fb1e8'
const BIRD_DARK = '#4a8fcb'

/** くぎり の時間(秒) */
const FLY_IN = 0.7
const HOVER = 2.0
const DROP = 2.4
const LAND = 3.0
const TIE0 = 4.4
const TIE1 = 5.3
const FREE = 5.9
const INK = 6.5
const DONE = 9.3
const DURATION = 10

type Pt = readonly [number, number]
const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/** 子どもの まんなか(x)と 足もと(y) */
const X0 = 46
const FEET_Y = 93.5
/** かた の高さ と うで の長さ(かた→ひじ、ひじ→手) */
const SHOULDER_Y = 43.5
const SHOULDER_L: Pt = [X0 - 7, SHOULDER_Y]
const SHOULDER_R: Pt = [X0 + 7, SHOULDER_Y]
const ARM_UP = 10.5
const ARM_LOW = 10
/** 玉を つるす ところ(こしの みぎがわ)と、うけとった ときの ひもの 上はし */
const HANG: Pt = [X0 + 12.5, 62.6]
const HELD: Pt = [X0 + 11, 45]
/** 鳥が とまって(うかんで)いる ばしょ。くちばしの さきが HELD の 上に くる */
const BIRD_X = X0 + 19.6
const BIRD_Y = 7

/** 玉の ひもの 上はし から 玉の まんなか までの 長さ */
const JADE_DROP = 10.5

/** かた→ひじ→手 の ひじの ばしょ。とどかない ときは 手を のばしきった ところに おく。 */
function reach(shoulder: Pt, target: Pt, side: 'left' | 'right'): { readonly elbow: Pt; readonly hand: Pt } {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.hypot(dx, dy) || 0.001
  const d = Math.min(dist, ARM_UP + ARM_LOW - 0.05)
  const ux = dx / dist
  const uy = dy / dist
  const along = (ARM_UP ** 2 - ARM_LOW ** 2 + d ** 2) / (2 * d)
  const away = Math.sqrt(Math.max(0, ARM_UP ** 2 - along ** 2))
  // ひじは そとがわ(左のうでは 左、右のうでは 右)に まがる
  const k = side === 'left' ? 1 : -1
  return {
    elbow: [shoulder[0] + ux * along - uy * away * k, shoulder[1] + uy * along + ux * away * k],
    hand: [shoulder[0] + ux * d, shoulder[1] + uy * d],
  }
}

type Mood = 'plain' | 'surprised' | 'happy' | 'focus'

function moodAt(t: number): Mood {
  if (t < 1.3) return 'plain'
  if (t < LAND) return 'surprised'
  if (t < TIE0) return 'happy'
  if (t < TIE1) return 'focus'
  return 'happy'
}

/** 手の とどく ばしょ(左・右)。あわせて ひとやすみ→うけとる→こしへ→ふつうに たらす */
function handTargets(t: number): { readonly left: Pt; readonly right: Pt } {
  const idleL: Pt = [X0 - 8.6, 62.4]
  const idleR: Pt = [X0 + 8.6, 62.4]
  const catchL: Pt = [X0 + 4.8, 56.5]
  const catchR: Pt = [X0 + 17.2, 56.5]
  const beltL: Pt = [X0 + 4, 60.5]
  const beltR: Pt = [X0 + 12.5, 63]
  const raise = span(t, HOVER, HOVER + 0.7, easeOut)
  const tie = span(t, TIE0, TIE1, easeInOut)
  const release = span(t, TIE1, FREE, easeInOut)
  const toCatchL = lerpPt(idleL, catchL, raise)
  const toCatchR = lerpPt(idleR, catchR, raise)
  const toBeltL = lerpPt(toCatchL, beltL, tie)
  const toBeltR = lerpPt(toCatchR, beltR, tie)
  return { left: lerpPt(toBeltL, idleL, release), right: lerpPt(toBeltR, idleR, release) }
}

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="-4" cy="40" rx="7" ry="3.4" />
        <ellipse cx="1" cy="38" rx="5" ry="3.4" />
        <ellipse cx="96" cy="46" rx="6" ry="2.8" />
        <ellipse cx="100.5" cy="44.4" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 30, 70, 90, 102].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 子ども(人の つくり を守る): どう・あし・あたま・かお・うでの線。手は あとから(玉の 上に)かさねる。 */
function Child({ mood, left, right }: { readonly mood: Mood; readonly left: Pt; readonly right: Pt }) {
  const armL = reach(SHOULDER_L, left, 'left')
  const armR = reach(SHOULDER_R, right, 'right')
  const look = mood === 'surprised' ? -1.1 : mood === 'focus' ? 0.9 : 0
  const eyeY = 31.3 + look
  const eye = (cx: number) =>
    mood === 'happy' ? (
      <path d={`M${cx - 1.4} ${eyeY + 0.5} Q${cx} ${eyeY - 1.3} ${cx + 1.4} ${eyeY + 0.5}`} fill="none" stroke="#2b2b2b" strokeWidth="1.1" strokeLinecap="round" />
    ) : (
      <circle cx={cx} cy={eyeY} r={mood === 'surprised' ? 1.45 : 1.15} fill="#2b2b2b" />
    )
  return (
    <>
      <ellipse cx={X0} cy="97" rx="11" ry="2.4" fill="#000000" opacity="0.12" />
      {/* あし */}
      <rect x={X0 - 7} y="62" width="5" height="30" rx="2.5" fill={PANTS_DARK} />
      <rect x={X0 + 2} y="62" width="5" height="30" rx="2.5" fill={PANTS} />
      <ellipse cx={X0 - 5} cy="93" rx="4.2" ry="2.3" fill={SHOE} />
      <ellipse cx={X0 + 5} cy="93" rx="4.2" ry="2.3" fill={SHOE} />
      {/* くび: みじかく、どう と あたま に はさまれる */}
      <rect x={X0 - 2.2} y="37" width="4.4" height="6" rx="2" fill={SKIN_SHADE} />
      {/* どう と こしの ひも */}
      <rect x={X0 - 8.5} y="40.5" width="17" height="26" rx="7" fill={TUNIC} />
      <rect x={X0 - 8.5} y="59.5" width="17" height="3.4" rx="1.2" fill={BELT} />
      <rect x={X0 - 1.5} y="59.9" width="3" height="2.6" rx="0.8" fill={JADE} />
      {/* あたま */}
      <circle cx={X0 - 7.8} cy="32" r="1.8" fill={SKIN} />
      <circle cx={X0 + 7.8} cy="32" r="1.8" fill={SKIN} />
      <circle cx={X0} cy="31" r="7.8" fill={SKIN} />
      <path d={`M${X0 - 8.1} 30 C${X0 - 9.4} 20.8 ${X0 + 9.4} 20.8 ${X0 + 8.1} 30 C${X0 + 6} 26 ${X0 + 1.5} 25.2 ${X0 - 1} 26.2 C${X0 - 4} 27 ${X0 - 6.4} 27.8 ${X0 - 8.1} 30 Z`} fill={HAIR} />
      <path d={`M${X0 + 1} 22.4 q1 -3 3 -2.4`} fill="none" stroke={HAIR} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={X0 - 5.2} cy="34.2" r="1.7" fill="#ff9d9d" opacity="0.55" />
      <circle cx={X0 + 5.2} cy="34.2" r="1.7" fill="#ff9d9d" opacity="0.55" />
      {eye(X0 - 3.1)}
      {eye(X0 + 3.1)}
      {mood === 'surprised' && (
        <path d={`M${X0 - 4.6} 27.8 l3 -0.6 M${X0 + 1.6} 27.2 l3 0.6`} stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
      )}
      {mood === 'plain' && <path d={`M${X0 - 1.6} 35.4 Q${X0} 36.8 ${X0 + 1.6} 35.4`} fill="none" stroke="#b9483f" strokeWidth="1.1" strokeLinecap="round" />}
      {mood === 'surprised' && <ellipse cx={X0} cy="35.9" rx="1.2" ry="1.6" fill="#b9483f" />}
      {mood === 'happy' && <path d={`M${X0 - 2.6} 34.8 Q${X0} 39.2 ${X0 + 2.6} 34.8 Z`} fill="#b9483f" />}
      {mood === 'focus' && <path d={`M${X0 - 1.2} 35.7 h2.4`} stroke="#b9483f" strokeWidth="1.1" strokeLinecap="round" />}
      {/* うで: かた → ひじ → 手 */}
      <path d={`M${SHOULDER_L[0]} ${SHOULDER_L[1]} L${armL.elbow[0]} ${armL.elbow[1]} L${armL.hand[0]} ${armL.hand[1]}`} fill="none" stroke="#2f6fae" strokeWidth="5.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${SHOULDER_L[0]} ${SHOULDER_L[1]} L${armL.elbow[0]} ${armL.elbow[1]} L${armL.hand[0]} ${armL.hand[1]}`} fill="none" stroke={TUNIC} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${SHOULDER_R[0]} ${SHOULDER_R[1]} L${armR.elbow[0]} ${armR.elbow[1]} L${armR.hand[0]} ${armR.hand[1]}`} fill="none" stroke="#2f6fae" strokeWidth="5.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${SHOULDER_R[0]} ${SHOULDER_R[1]} L${armR.elbow[0]} ${armR.elbow[1]} L${armR.hand[0]} ${armR.hand[1]}`} fill="none" stroke={TUNIC} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )
}

function Hands({ left, right }: { readonly left: Pt; readonly right: Pt }) {
  const l = reach(SHOULDER_L, left, 'left').hand
  const r = reach(SHOULDER_R, right, 'right').hand
  return (
    <>
      <circle cx={l[0]} cy={l[1]} r="2.7" fill={SKIN} />
      <circle cx={r[0]} cy={r[1]} r="2.7" fill={SKIN} />
    </>
  )
}

/** 黄色い 玉。ひもの 上はし が (0,0)。ふさ は すこし おくれて ゆれる。 */
function Pendant({ tassel }: { readonly tassel: number }) {
  return (
    <>
      <path d="M0 0 V5" stroke={CORD} strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="0" cy="-0.2" r="1.3" fill="none" stroke={CORD} strokeWidth="0.9" />
      <circle cx="0" cy={JADE_DROP} r="5.5" fill={JADE} stroke={JADE_DARK} strokeWidth="1" />
      <circle cx="0" cy={JADE_DROP} r="1.9" fill={JADE_DARK} />
      <path d={`M-3.7 ${JADE_DROP - 1.2} Q-3 ${JADE_DROP - 3.4} -1 ${JADE_DROP - 4.1}`} fill="none" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      <Layer rotate={tassel} origin={[0, 16.5]}>
        <circle cx="0" cy="16.5" r="1.3" fill={CORD} />
        <path d="M0 16.5 L-2.4 27 M0 16.5 L0 28 M0 16.5 L2.4 27" fill="none" stroke={CORD} strokeWidth="1.3" strokeLinecap="round" />
      </Layer>
    </>
  )
}

/** 玉を くわえた 鳥(左むき)。はばたく。 */
function Bird({ x, y, flap }: { readonly x: number; readonly y: number; readonly flap: number }) {
  return (
    <Layer x={x} y={y}>
      <path d="M4.2 0 l5 -1.8 l-0.8 3.6 Z" fill={BIRD_DARK} />
      <ellipse cx="0" cy="0" rx="5" ry="3.6" fill={BIRD} />
      <ellipse cx="0" cy="1.4" rx="3.2" ry="1.8" fill="#ffffff" opacity="0.8" />
      <circle cx="-4.2" cy="-2" r="2.8" fill={BIRD} />
      <path d="M-6.6 -3 L-9 -1.6 L-6.6 -0.6 Z" fill="#f2b632" />
      <circle cx="-4.8" cy="-2.6" r="0.6" fill="#2b2b2b" />
      <Layer rotate={flap} origin={[0.5, -1]}>
        <path d="M-2 -1 Q1.5 -7 6 -1.2 Q2 0.8 -2 -1 Z" fill={BIRD_DARK} />
      </Layer>
    </Layer>
  )
}

/** 玉の まわりの きらきら(つやの ひかり)。 */
function Glints({ t, at, from, to }: { readonly t: number; readonly at: Pt; readonly from: number; readonly to: number }) {
  const show = during(t, from, to, 0.25)
  if (show <= 0) return null
  const pulse = 0.7 + 0.3 * wave(t, 0.5)
  return (
    <g opacity={show}>
      <Star cx={at[0] + 7.5} cy={at[1] - 5} r={2.2 * pulse} color="#ffffff" spin={t * 60} />
      <Star cx={at[0] - 7} cy={at[1] - 2} r={1.6 * (1.7 - pulse)} color="#ffd95a" spin={-t * 50} />
      <Star cx={at[0] + 4} cy={at[1] + 8} r={1.4 * pulse} color="#ffffff" spin={t * 40} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 11)

  const pop = span(t, 0.05, 0.6, backOut)
  const mood = moodAt(t)
  const targets = handTargets(t)

  // 子どもの ようす: 玉を もらって よろこんで とびはねる(2かい)。さいごは からだを ゆらゆら
  const hop = Math.abs(Math.sin(span(t, LAND + 0.15, LAND + 1.15) * Math.PI * 2)) * 2.4 * (1 - span(t, LAND + 1.15, LAND + 1.2))
  const dip = Math.sin(span(t, LAND, LAND + 0.3) * Math.PI) * 1.4
  const sway = wave(t, 1.6) * 1.1 * span(t, FREE - 0.2, FREE + 0.5) * (1 - span(t, INK - 0.2, INK + 0.5))
  const dx = sway
  const dy = -hop

  // 鳥: はしってくる → うかんで 玉を おとす → さっていく
  const comeIn = span(t, FLY_IN, HOVER, easeOut)
  const leave = span(t, LAND, LAND + 1.6, easeIn)
  const birdX = BIRD_X + (1 - comeIn) * 85 - leave * 100
  const birdY = BIRD_Y + (1 - comeIn) * 9 - leave * 4 + wave(t, 0.5) * 0.7
  const flap = wave(t, comeIn < 1 || leave > 0 ? 0.16 : 0.22) * (comeIn < 1 || leave > 0 ? 30 : 22)
  const birdVisible = t >= FLY_IN && birdX > -20

  // 玉の ばしょ(ひもの 上はし)
  const fall = span(t, DROP, LAND, easeIn)
  const tie = span(t, TIE0, TIE1, easeInOut)
  const carried: Pt = [birdX - 8.6, birdY - 1.4]
  const place: Pt =
    t < DROP ? carried : t < LAND ? [HELD[0], carried[1] + (HELD[1] - carried[1]) * fall] : lerpPt([HELD[0], HELD[1] + dip], HANG, tie)
  const settle = span(t, LAND, LAND + 0.3)
  const swingAmp = (22 - 10 * span(t, FREE, INK)) * span(t, TIE0 + 0.7, FREE + 0.2)
  const rot =
    t < DROP
      ? wave(t, 0.6) * mix(t, FLY_IN, HOVER, 12, 4)
      : t < LAND
        ? -8 * fall
        : -8 * (1 - settle) + wave(t, 0.9) * 3 * settle * (1 - tie) + wave(t, 1.5) * swingAmp
  const tassel = wave(t, 1.5, -0.25) * (4 + swingAmp * 0.5)
  const jadeAt: Pt = [place[0] + dx, place[1] + dy + JADE_DROP]
  const pendantOpacity = span(t, FLY_IN - 0.1, FLY_IN + 0.1)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Layer x={dx} y={dy} scale={pop} origin={[X0, FEET_Y]}>
          <Child mood={mood} left={targets.left} right={targets.right} />
        </Layer>
        <Layer opacity={pendantOpacity} x={place[0] + dx} y={place[1] + dy} rotate={rot}>
          <Pendant tassel={tassel} />
        </Layer>
        <Layer x={dx} y={dy} scale={pop} origin={[X0, FEET_Y]}>
          <Hands left={targets.left} right={targets.right} />
        </Layer>
        {birdVisible && <Bird x={birdX} y={birdY} flap={flap} />}
        <Glints t={t} at={jadeAt} from={FLY_IN + 0.3} to={DROP} />
        <Glints t={t} at={jadeAt} from={LAND} to={LAND + 1.6} />
        <Glints t={t} at={jadeAt} from={FREE + 0.3} to={INK} />
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
    { at: 0, label: '子どもが ひとり たっている', sound: 'pop' },
    { at: FLY_IN, label: '黄色い 玉を くわえた 鳥が とんでくる' },
    { at: DROP, label: '鳥が 玉を おとす', sound: 'pop' },
    { at: LAND, label: '子どもが うけとって 大よろこび' },
    { at: TIE0, label: 'こしの ひもに 玉を ゆわえる' },
    { at: FREE, label: '玉が ゆらゆら ゆれる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '黄 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
