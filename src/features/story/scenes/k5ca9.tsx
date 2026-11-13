/*
 * 岩(いわ): 山に ごろんと 大きな 石が ある。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … 山の まんなかの 大きな みね
 *   2画目(𠃍)  … 左の みね と、山の ふもとの たいらな ところ
 *   3画目(丨)  … 右の みね
 *   4画目(一)  … がけの てっぺん(つき出た たいらな ところ)
 *   5画目(ノ)  … がけの 左の ななめの ふち(つき出た がけの 下は へこんで いる)
 *   6〜8画目   … ごろんと おちて とまった 大きな いわ(口の かたち)
 *               (6画目は いわの 左はし、7・8画目は いわの まわりと そこ)
 *
 * ながれ
 *   山が そびえる → つかれた子が あるいてくる(あせ)
 *   → 山が ゴゴゴと ゆれて、小石が ぱらぱら。山の はだに うまっていた いわが ゆれる
 *   → いわが ころがって がけを おち、ごろん! と 子の よこに とまる(子は びっくり)
 *   → 大きな いわを 見て ほっと して、子は うれしくて とびはねる
 *   → ほね が ひかって、絵が うすくなり、字「岩」が のこる
 *
 * 子も いわも、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく どう の上。
 *   いわは とおくに ある ときは 小さく、ちかづく(ころげおちて くる)と 大きく 見える。
 *   いわは かどの まるい かたまりで、おちると 地面に ついた とき つぶれて はずむ。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '岩'

const SUN = '#ffd24a'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const FOOT = '#b6d89c'
const PEAK_FAR = '#86b3a9'
const PEAK_FAR_DARK = '#6f9c93'
const PEAK = '#7fae95'
const PEAK_DARK = '#659a82'
const SNOW = '#ffffff'
const CLIFF = '#c0a082'
const CLIFF_TOP = '#d6bb9b'
const CLIFF_CRACK = '#a8876a'
const ROCK = '#8e98a4'
const ROCK_DARK = '#737d89'
const ROCK_LIGHT = '#b4bdc7'
const MOSS = '#6fbf73'
const DUST = '#eadfcb'
const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#e8654a'
const SHIRT_DARK = '#cc4f36'
const SHIRT_FAR = '#b6422d'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const PACK = '#f0a53c'
const PACK_DARK = '#d48c26'

/** くぎり の時間(秒) */
const WALK = 0.7
const STAND = 2.3
/** 山が ゆれはじめる / いわが うごきだす / ごろんと 地面に つく */
const RUMBLE = 2.7
const FALL = 3.3
const SLIDE_END = 3.9
const LAND = 4.6
/** 子が びっくり する / ほっと する / うれしくて とびはねる */
const STARTLE = LAND
const RELIEF = 5.4
const CHEER = 6.25
const INK = 7.0
const DONE = 10.5
const DURATION = 11

/** 地面の たかさ(子の 足もと) */
const GROUND = 95.5
/** いわが とまる 場所(まんなか)。7・8画目の 口の かたち の まんなか */
const ROCK_REST: readonly [number, number] = [62, 79.5]
/** いわの はんぶんの たかさ(はば の半分は 21) */
const ROCK_H = 12.5
/** ふもとで うまっている いわの 場所(山の はだ)と、がけの てっぺんに つく 場所 */
const ROCK_EMBED: readonly [number, number] = [66, 36]
const ROCK_LEDGE: readonly [number, number] = [72, 44]

/* ───────── 山・がけ・地面 ───────── */

function Sky({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.8" width="1.6" height="3.6" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={5.4 * sun} fill={SUN} />
      {/* ゆっくり ながれる 雲(おくゆき を出す) */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.2} 0)`}>
        <ellipse cx="88" cy="6" rx="6" ry="2.6" />
        <ellipse cx="92.5" cy="4.6" rx="4.2" ry="2.8" />
      </g>
    </>
  )
}

/** 3つの みね。まんなかが いちばん 高い。みね の 中心が、1・2・3画目の 縦線の 場所 */
function Mountain({ t }: SceneProps) {
  const rise = span(t, 0, 0.9, backOut)
  const shake = wave(t, 0.09) * 0.8 * during(t, RUMBLE, FALL + 0.3, 0.15)
  return (
    <Layer x={shake} scaleX={0.85 + 0.15 * rise} scaleY={rise} origin={[55, 56]}>
      <path d="M30 19 L4 56 H56 Z" fill={PEAK_FAR} />
      <path d="M30 19 L56 56 H30 Z" fill={PEAK_FAR_DARK} />
      <path d="M85 17 L61 56 H109 Z" fill={PEAK_FAR} />
      <path d="M85 17 L109 56 H85 Z" fill={PEAK_FAR_DARK} />
      <path d="M55 10 L22 56 H88 Z" fill={PEAK} />
      <path d="M55 10 L88 56 H55 Z" fill={PEAK_DARK} />
      <path d="M55 10 L47.6 20.4 L52 19 L55 23 L58.4 19 L62.4 20.4 Z" fill={SNOW} />
    </Layer>
  )
}

/** がけ。てっぺん(4画目)が つき出ていて、左は ななめに へこむ(5画目)。 */
function Cliff({ t }: SceneProps) {
  const grow = span(t, 0.35, 1.0, backOut)
  return (
    <>
      <path d="M-2 63 Q28 52 55 58 Q84 50 111 61 V99 H-2 Z" fill={FOOT} opacity={span(t, 0.3, 0.8)} />
      <Layer scaleY={grow} origin={[55, 97]}>
        <path d="M17 52 L94 50.5 L95 97 L11 97 L14 93.3 L41 58 L17 58.5 Z" fill={CLIFF} stroke={CLIFF} strokeWidth="3" strokeLinejoin="round" />
        <path d="M17 52 L94 50.5 L94 54 L17 55.5 Z" fill={CLIFF_TOP} />
        <path d="M62 60 l3 4 M88 62 l-3 5 M75 87 l3 4" stroke={CLIFF_CRACK} strokeWidth="1.1" strokeLinecap="round" fill="none" />
      </Layer>
    </>
  )
}

function Foreground() {
  return (
    <>
      <ellipse cx="54.5" cy="98.4" rx="53" ry="4.6" fill={GRASS} />
      {[6, 46, 80, 102].map((x) => (
        <path key={x} d={`M${x} 97.6 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/* ───────── いわ ───────── */

/** いわ の ほんたい(まんなか が 0,0)。かどは まるく、そこは たいら。 */
function RockShape() {
  return (
    <>
      <path d="M-21 6 C-22 -4 -14 -12.5 -2 -12.5 C10 -13 21 -8 21 3 C21 10 17 12.5 8 12.5 L-12 12.5 C-18 12.5 -21 10 -21 6 Z" fill={ROCK_DARK} />
      <path d="M-20 4 C-20.4 -4 -13.5 -11.4 -2 -11.4 C9 -11.8 19.6 -7.4 20 1 C14 4.4 4 5.6 -6 5.2 C-12 5 -17 4.6 -20 4 Z" fill={ROCK} />
      <ellipse cx="-9" cy="-7" rx="6" ry="2.6" fill={ROCK_LIGHT} transform="rotate(-14 -9 -7)" />
      <path d="M4 -12 q2 -3.2 4.6 -1.2 q2.6 -2 4 0.6 q-4 1.4 -8.6 0.6 Z" fill={MOSS} />
    </>
  )
}

type RockPose = { readonly x: number; readonly y: number; readonly scale: number; readonly spin: number; readonly squash: number; readonly rock: number }

/** いわ の いま の ようす。うまっている → ころがる → おちる → ごろん と ゆれて とまる */
function rockPose(t: number): RockPose {
  if (t < FALL) {
    const shake = wave(t, 0.1) * 6 * during(t, RUMBLE, FALL, 0.2)
    return { x: ROCK_EMBED[0], y: ROCK_EMBED[1], scale: 0.45, spin: shake, squash: 0, rock: 0 }
  }
  if (t < SLIDE_END) {
    const p = span(t, FALL, SLIDE_END, easeIn)
    return { x: ROCK_EMBED[0] + (ROCK_LEDGE[0] - ROCK_EMBED[0]) * p, y: ROCK_EMBED[1] + (ROCK_LEDGE[1] - ROCK_EMBED[1]) * p, scale: 0.45 + 0.15 * p, spin: 170 * p, squash: 0, rock: 0 }
  }
  if (t < LAND) {
    const q = span(t, SLIDE_END, LAND)
    return { x: ROCK_LEDGE[0] + (ROCK_REST[0] - ROCK_LEDGE[0]) * q, y: ROCK_LEDGE[1] + (ROCK_REST[1] - ROCK_LEDGE[1]) * q * q, scale: 0.6 + 0.4 * q, spin: 170 + 190 * q, squash: 0, rock: 0 }
  }
  // ついた しゅんかん つぶれて、ぽん と はずみ、ごろん ごろん と ゆれて とまる
  const squash = Math.sin(span(t, LAND, LAND + 0.2) * Math.PI)
  const hop = Math.sin(span(t, LAND + 0.15, LAND + 0.5) * Math.PI) * 4
  const since = Math.max(0, t - (LAND + 0.5))
  const rock = 5 * Math.exp(-since * 3) * Math.sin(since * 14)
  return { x: ROCK_REST[0], y: ROCK_REST[1] - hop, scale: 1, spin: 360, squash, rock }
}

function Rock({ t }: SceneProps) {
  const show = span(t, 0.6, 0.9)
  const pose = rockPose(t)
  return (
    <Layer opacity={show} x={pose.x} y={pose.y} scale={pose.scale} rotate={pose.spin} origin={[0, 0]}>
      <Layer rotate={pose.rock} scaleX={1 + 0.12 * pose.squash} scaleY={1 - 0.15 * pose.squash} origin={[0, ROCK_H - 0.5]}>
        <RockShape />
      </Layer>
    </Layer>
  )
}

/** 山が ゆれたとき ぱらぱら おちる 小石 */
function Pebbles({ t }: SceneProps) {
  const start = RUMBLE + 0.1
  return (
    <>
      {[
        [47, 24, 0],
        [75, 22, 0.25],
        [58, 17, 0.45],
      ].map(([x, y, delay]) => {
        const p = span(t, start + delay, start + delay + 0.7)
        if (p <= 0 || p >= 1) return null
        return <circle key={x} cx={x} cy={y + p * p * 26} r="1.5" fill={ROCK_DARK} opacity={1 - p * p} />
      })}
    </>
  )
}

/** ごろん と ついた とき の つちけむり */
function Dust({ t }: SceneProps) {
  const p = span(t, LAND, LAND + 0.8, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={(1 - p) * 0.75} fill={DUST}>
      {/* いわの りょうがわ から もくもく ひろがる(いわの したには ならべない) */}
      {[
        [-26, 91, 3],
        [-31, 88, 2.4],
        [-24, 85, 2],
        [26, 91, 3],
        [31, 88, 2.4],
        [24, 85, 2],
      ].map(([dx, y, r]) => (
        <circle key={dx} cx={ROCK_REST[0] + dx * (1 + p * 0.5)} cy={y - p * 5} r={r * (0.7 + p * 1.4)} />
      ))}
    </g>
  )
}

/* ───────── 子(しゅやく) ───────── */

type Mood = 'tired' | 'surprised' | 'happy'
/** うで の かっこう。swing = ま下から まえへ ふった角度(180 で まっすぐ 上)/ bend = ひじ の まがり */
type ArmPose = { readonly swing: number; readonly bend: number }

/** 子は 右むき。足もと が (0,0)、上が ー。かた は どう の上はし。 */
const SHOULDER: readonly [number, number] = [0, -29]
const ARM_PART = 8.2

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。 */
function Arm({ pose, color }: { readonly pose: ArmPose; readonly color: string }) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const elbow = [SHOULDER[0] + Math.sin(rad(pose.swing)) * ARM_PART, SHOULDER[1] + Math.cos(rad(pose.swing)) * ARM_PART] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] + Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART] as const
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.6" fill={SKIN} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="3" cy="-36.2" r="1.5" fill="#ff9d9d" opacity="0.55" />
      {mood === 'tired' && (
        <>
          <path d="M2.4 -41.4 l3.6 1.1" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <circle cx="4.3" cy="-39" r="0.95" fill="#2b2b2b" />
          <path d="M4.8 -34.6 q1.6 -1.3 3.1 0" fill="none" stroke="#b9483f" strokeWidth="1" strokeLinecap="round" />
        </>
      )}
      {mood === 'surprised' && (
        <>
          <path d="M2.4 -42.6 l3.6 -0.6" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <circle cx="4.5" cy="-39.4" r="1.9" fill="#ffffff" stroke="#2b2b2b" strokeWidth="0.5" />
          <circle cx="4.9" cy="-39.4" r="0.95" fill="#2b2b2b" />
          <ellipse cx="6.2" cy="-34.8" rx="1.2" ry="1.6" fill="#b9483f" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M2.8 -38.8 Q4.4 -41 6 -38.8" fill="none" stroke="#2b2b2b" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M3.6 -35.6 Q5.6 -32.6 7.4 -35.8 Z" fill="#b9483f" />
        </>
      )}
    </>
  )
}

type ChildProps = { readonly step: number; readonly mood: Mood; readonly nearArm: ArmPose; readonly farArm: ArmPose; readonly headTilt: number }

function Child({ step, mood, nearArm, farArm, headTilt }: ChildProps) {
  return (
    <>
      {/* むこうの うで: どう の うしろに かくれる */}
      <Arm pose={farArm} color={SHIRT_FAR} />
      <Layer rotate={step * 17} origin={[0.8, -17]}>
        <rect x="-1.4" y="-18" width="4.4" height="18" rx="2.2" fill={PANTS_DARK} />
        <ellipse cx="1.8" cy="-0.8" rx="3.6" ry="2" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 17} origin={[-0.8, -17]}>
        <rect x="-3" y="-18" width="4.4" height="18" rx="2.2" fill={PANTS} />
        <ellipse cx="0.2" cy="-0.8" rx="3.6" ry="2" fill={SHOE} />
      </Layer>
      {/* せおっている リュック(せなか = 左がわ) */}
      <rect x="-10" y="-29" width="6.4" height="12.6" rx="2.8" fill={PACK} />
      <rect x="-9.4" y="-24" width="4" height="2.2" rx="1" fill={PACK_DARK} />
      {/* くび: どう と あたま の間を みじかく つなぐ */}
      <rect x="-1.8" y="-34" width="3.6" height="6" rx="1.6" fill={SKIN_SHADE} />
      <rect x="-5.6" y="-31.6" width="11.2" height="16.8" rx="5" fill={SHIRT} />
      <path d="M-4.4 -20.4 h8.8" stroke={SHIRT_DARK} strokeWidth="1.2" strokeLinecap="round" />
      <Arm pose={nearArm} color={SHIRT_DARK} />
      <Layer rotate={headTilt} origin={[0, -32]}>
        <circle cx="0.5" cy="-38.5" r="7.2" fill={SKIN} />
        <path d="M-6.7 -38.5 C-8 -48 5 -49.5 7.4 -41.5 C3 -44.5 -2.5 -43 -6.7 -38.5 Z" fill={HAIR} />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

/** あるいている間の あせ。うしろ(左)へ とぶ。 */
function Sweat({ t }: SceneProps) {
  const show = during(t, WALK + 0.2, RUMBLE, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.45].map((offset) => {
        const p = ((t + offset) % 0.9) / 0.9
        return <path key={offset} d="M0 -2.2 Q1.8 0.5 0 1.8 Q-1.8 0.5 0 -2.2 Z" fill="#7cc4f2" transform={`translate(${-9 - p * 6} ${-43 + p * 8}) rotate(35)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** 子の いま の ようす(場所・あし・うで・かお)を t から 決めて 描く */
function KidScene({ t }: SceneProps) {
  // 場所: 左から あるいてくる → びっくりして 1歩 さがる → いわに ちかづく
  const x = t < STAND ? mix(t, WALK, STAND, -24, 24, easeOut) : t < STARTLE ? 24 : t < RELIEF ? mix(t, STARTLE, STARTLE + 0.4, 24, 20, easeOut) : mix(t, RELIEF, RELIEF + 0.7, 20, 29, easeInOut)
  const walking = span(t, WALK, WALK + 0.15) * (1 - span(t, STAND - 0.25, STAND)) + span(t, RELIEF, RELIEF + 0.1) * (1 - span(t, RELIEF + 0.6, RELIEF + 0.7))
  const stride = Math.sin(t * Math.PI * 2 * 1.8) * walking
  // はね: びっくり(1回)と、うれしくて(なんども)
  const startleHop = Math.sin(span(t, STARTLE, STARTLE + 0.45) * Math.PI) * 4
  const cheerHop = t >= CHEER ? Math.abs(Math.sin(((t - CHEER) / 0.35) * Math.PI)) * 4 : 0
  const bob = -Math.abs(stride) * 1.2 - startleHop - cheerHop
  // うで: びっくり と よろこび で 上へ あげる。あげていない ときは、あるく ふり か だらんと たれる
  const armsUp = Math.max(span(t, STARTLE, STARTLE + 0.25, backOut) * (1 - span(t, RELIEF - 0.1, RELIEF + 0.2)), span(t, CHEER, CHEER + 0.25, backOut))
  const base = (sign: number) => 3 + sign * stride * 26
  const nearArm: ArmPose = { swing: base(1) * (1 - armsUp) + 158 * armsUp, bend: 14 * (1 - armsUp) + 8 * armsUp }
  const farArm: ArmPose = { swing: base(-1) * (1 - armsUp) + 176 * armsUp, bend: 14 * (1 - armsUp) }
  // あたま: つかれて 下を むく → 山を 見あげる → いわを 見て もどる
  const tilt = t < STARTLE ? mix(t, STAND, STAND + 0.4, 5, -16) : t < RELIEF ? mix(t, STARTLE, STARTLE + 0.25, -16, -6) : mix(t, RELIEF, RELIEF + 0.4, -6, 0)
  const mood: Mood = t < RUMBLE ? 'tired' : t < RELIEF ? 'surprised' : 'happy'
  return (
    <Layer x={x} y={GROUND + bob} scale={0.9}>
      <Child step={stride} mood={mood} nearArm={nearArm} farArm={farArm} headTilt={tilt} />
      <Sweat t={t} />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)
  // ごろんと ついた しゅんかん、地面が すこし ゆれる
  const thud = Math.sin(span(t, LAND, LAND + 0.3) * Math.PI * 2) * 0.7
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture} y={thud}>
        <Sky t={t} />
        <Mountain t={t} />
        <Cliff t={t} />
        <Pebbles t={t} />
        <Rock t={t} />
        <Foreground />
        <Dust t={t} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <ellipse cx={mix(t, WALK, STAND, -24, 24, easeOut) + 1} cy="97.4" rx="7" ry="1.8" fill="#000000" opacity="0.1" />
          <KidScene t={t} />
        </Layer>
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
    { at: 0, label: '山が そびえる', sound: 'pop' },
    { at: WALK, label: 'つかれた子が あるいてくる' },
    { at: RUMBLE, label: '山が ゆれて、いわが うごきだす', sound: 'pop' },
    { at: LAND - 0.3, label: 'いわが ころげおちて、ごろん!' },
    { at: RELIEF, label: '子は ほっと して、うれしくて とびはねる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '岩 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
