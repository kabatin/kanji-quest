/*
 * 角(つの): どうぶつの あたまに はえた、かたい つの。
 *
 * ほね(画と絵の対応)
 *   1・2画目   … つのの さき(先が ほそく、うしろへ そった ところ)
 *   3画目(丨)  … つのの 左がわ(そこへ むかって 少し ひろがる)
 *   4画目(𠃍)  … つのの 右がわ と、かたい ふち(そこの ふくらみ)
 *   5画目(丨)  … つのの まんなかの すじ
 *   6・7画目   … つのの よこの ふし(せいちょうの あと。大きい つのほど、ふしが ふえる)
 *
 * ながれ
 *   こやぎが しょんぼり(あたまの つのが ちっちゃい)
 *   → くさを もぐもぐ たべる(だんだん 元気になる)
 *   → つのが ぐんぐん のびて、こやぎは びっくり → うれしくて ぴょんぴょん
 *   → カメラが つのに ぐーっと よる → つのの かたち が 字に そろい、ほね が ひかって「角」になる
 *
 * こやぎは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   つのは あたまの てっぺんから はえる。くびは あたまから からだへ つながり、
 *   くさを たべるときは くびを まげて あたまを 下げる(あたまが 下がると、つのは まえへ かたむく)。
 *   つのは、さいごに カメラが よった とき 字と 同じ大きさ・同じ場所に なる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '角'

const SUN = '#ffd24a'
const HILL = '#e2f2d2'
const GRASS = '#c5e8a9'
const GRASS_DARK = '#a8d68a'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const FUR = '#e9cba2'
const FUR_SHADE = '#d3a978'
const FUR_FAR = '#b78a5a'
const HOOF = '#5a3b2a'
const EAR_IN = '#f2b5a8'
const HORN = '#ead08f'
const HORN_SHADE = '#d2ad65'
const HORN_RIDGE = '#b98c47'
const HORN_LIGHT = '#f8e7b8'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const SWEAT = '#7cc4f2'

/** くぎり の時間(秒) */
const EAT = 1.8
/** つのが のびはじめる(あたまも 上がる) */
const GROW = 3.9
/** つのが のびきって、こやぎが よろこぶ */
const JOY = 4.9
/** カメラが つのに よる */
const ZOOM_FROM = 6.0
const ZOOM_TO = 7.4
const INK = 7.6
const DONE = 10.6
const DURATION = 11.2

/** 絵の ざひょう: こやぎは 字と 同じ大きさで 描き、カメラを ひいて 小さく 見せる */
const GROUND = 182
/** カメラの じく(ここを中心に ちぢむ) */
const CAM_ORIGIN: readonly [number, number] = [77, 50.8]
const CAM_FAR = 0.36
/** あたまを まげる じく(くび の さき) */
const NECK: readonly [number, number] = [35, 132]
/** つのの ねもと(つのが のびる じく) */
const HORN_ROOT: readonly [number, number] = [55, 98]
/** あたまを 下げて くさを たべるときの かたむき(度) */
const BOW = 31

/* ───────── 空と地面 ───────── */

function Sky({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun} fill={SUN} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="62" cy="14" rx="7" ry="3.2" />
        <ellipse cx="67" cy="12.2" rx="5" ry="3.2" />
        <ellipse cx="96" cy="26" rx="6" ry="2.8" />
        <ellipse cx="100.5" cy="24.4" rx="4.4" ry="3" />
      </g>
    </>
  )
}

/** 草の ひとかたまり。足もと(x, GROUND)から はえる */
function Tuft({ x, height = 14, eaten = 0 }: { readonly x: number; readonly height?: number; readonly eaten?: number }) {
  const rest = 1 - eaten
  if (rest <= 0.02) return null
  return (
    <Layer scaleY={rest} origin={[x, GROUND]}>
      <path d={`M${x - 5} ${GROUND + 1} Q${x - 6} ${GROUND - height * 0.6} ${x - 7.5} ${GROUND - height} Q${x - 2} ${GROUND - height * 0.5} ${x - 1.5} ${GROUND + 1} Z`} fill={LEAF} />
      <path d={`M${x - 2} ${GROUND + 1} Q${x - 1} ${GROUND - height * 0.8} ${x + 0.5} ${GROUND - height * 1.25} Q${x + 3} ${GROUND - height * 0.6} ${x + 2.5} ${GROUND + 1} Z`} fill={LEAF_DARK} />
      <path d={`M${x + 1.5} ${GROUND + 1} Q${x + 3.5} ${GROUND - height * 0.5} ${x + 7.5} ${GROUND - height * 0.95} Q${x + 6} ${GROUND - height * 0.4} ${x + 6} ${GROUND + 1} Z`} fill={LEAF} />
    </Layer>
  )
}

/** 地面。草は たべられる 3ほん(つのが のびる わけ)と、ならんだ 飾りの草 */
function Ground({ t }: SceneProps) {
  return (
    <>
      <rect x="-400" y={GROUND} width="900" height="300" fill={GRASS} />
      <rect x="-400" y={GROUND} width="900" height="3" fill={GRASS_DARK} />
      {[-150, -110, -70, -30, 30, 70, 150, 190].map((x) => (
        <Tuft key={x} x={x} height={12} />
      ))}
      <Tuft x={96} eaten={span(t, 2.0, 2.7)} />
      <Tuft x={104} eaten={span(t, 2.6, 3.3)} />
      <Tuft x={112} eaten={span(t, 3.2, 3.9)} />
    </>
  )
}

/* ───────── つの ───────── */

/**
 * つの。字と 同じ大きさで 描く(ふえる ふし は 5〜7画目の ところ)。
 * さきは 細く、うしろ(左)へ そる。ねもとは 少し ひろがる。
 */
function Horn() {
  return (
    <>
      <path
        d="M47 12 C55 14.6 63 14.6 69 13.4 C72 12.9 71.6 16 70 18.2 L58.5 33 L77 35.4 C80 35.8 80.6 39 80.6 42 L80.6 90 C80.6 96.5 76 99 70 99 L24 99 C27.5 88 31.4 80 31.4 66 L31.4 40.5 C31.4 38 30.4 36.6 29 35.4 L25.3 34 Z"
        fill={HORN}
      />
      {/* かげ: 右がわ と さき の うら */}
      <path d="M70 18.2 L58.5 33 L77 35.4 C80 35.8 80.6 39 80.6 42 L80.6 90 C80.6 96.5 76 99 70 99 L66 99 L66 37 L58.5 33 Z" fill={HORN_SHADE} opacity="0.55" />
      {/* ふし(5〜7画目 の ところ): あつみの ある すじ */}
      <path d="M31.6 54.6 Q55 53.4 80.4 51.5" fill="none" stroke={HORN_RIDGE} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M31.4 71.5 Q55 70 80.4 68.5" fill="none" stroke={HORN_RIDGE} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M54.4 40 L54.4 68" fill="none" stroke={HORN_SHADE} strokeWidth="2" strokeLinecap="round" />
      {/* つや */}
      <path d="M36 42 L36 60" fill="none" stroke={HORN_LIGHT} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M36 76 Q35 86 32 92" fill="none" stroke={HORN_LIGHT} strokeWidth="2.2" strokeLinecap="round" />
    </>
  )
}

/* ───────── こやぎ ───────── */

type Mood = 'sad' | 'chew' | 'amazed' | 'happy'

type HeadProps = {
  readonly angle: number
  readonly mood: Mood
  readonly mouthOpen: boolean
  readonly hornScale: number
  readonly sparkle: number
}

function Face({ mood, mouthOpen }: { readonly mood: Mood; readonly mouthOpen: boolean }) {
  return (
    <>
      <ellipse cx="82" cy="136" rx="4.6" ry="3" fill={CHEEK} opacity="0.55" />
      <ellipse cx="114" cy="139" rx="2.6" ry="2" fill="#8c5a5a" />
      {mood === 'happy' ? (
        <path d="M66 123 Q72 116 78 123" fill="none" stroke={EYE} strokeWidth="2" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="72" cy="122" r={mood === 'amazed' ? 4.8 : 3.7} fill={EYE} />
          <circle cx="73.2" cy="120.6" r="1.3" fill="#ffffff" />
        </>
      )}
      {mood === 'sad' && <path d="M63 115 L79 110" stroke={FUR_FAR} strokeWidth="2.2" strokeLinecap="round" />}
      {mood === 'sad' && <path d="M95 153 Q101 147.5 108 152" fill="none" stroke={MOUTH} strokeWidth="1.8" strokeLinecap="round" />}
      {mood === 'chew' && (mouthOpen ? <ellipse cx="101" cy="151" rx="4.6" ry="3.4" fill={MOUTH} /> : <path d="M94 150 Q101 154 108 150" fill="none" stroke={MOUTH} strokeWidth="1.8" strokeLinecap="round" />)}
      {mood === 'amazed' && <ellipse cx="101" cy="151" rx="3.4" ry="4.4" fill={MOUTH} />}
      {mood === 'happy' && <path d="M93 148 Q101 158 110 148" fill={MOUTH} stroke={MOUTH} strokeWidth="1.6" strokeLinejoin="round" />}
    </>
  )
}

/** あたま。つのは あたまの てっぺん から はえる(あたまが まがると、つのも いっしょに かたむく) */
function Head({ angle, mood, mouthOpen, hornScale, sparkle }: HeadProps) {
  return (
    <Layer rotate={angle} origin={NECK}>
      {/* みみ: よこ うしろへ たれる */}
      <ellipse cx="22" cy="112" rx="19" ry="7.5" fill={FUR_SHADE} transform="rotate(-18 22 112)" />
      <ellipse cx="22" cy="112" rx="11" ry="3.6" fill={EAR_IN} transform="rotate(-18 22 112)" />
      <circle cx="54" cy="128" r="38" fill={FUR} />
      <ellipse cx="96" cy="142" rx="24" ry="15" fill="#f7e6c8" />
      {/* あごひげ */}
      <path d="M90 154 Q92 164 96 170 Q99 162 100 154 Z" fill={FUR_SHADE} />
      <Layer scale={hornScale} origin={HORN_ROOT}>
        <Horn />
        {/* ねもとの ふさふさ(つのが かおの 毛から はえて いるように) */}
        <circle cx="31" cy="99" r="6" fill={FUR} />
        <circle cx="78" cy="99" r="6" fill={FUR} />
      </Layer>
      <Face mood={mood} mouthOpen={mouthOpen} />
      {/* つのが のびる しゅんかん の きらきら */}
      <g opacity={sparkle}>
        <Star cx={18} cy={46} r={4.4} color={SUN} spin={sparkle * 90} />
        <Star cx={86} cy={26} r={3.6} color={SUN} spin={-sparkle * 90} />
        <Star cx={90} cy={64} r={3} color="#ffffff" spin={sparkle * 60} />
      </g>
    </Layer>
  )
}

function Leg({ x, color }: { readonly x: number; readonly color: string }) {
  return (
    <>
      <rect x={x} y="140" width="11" height="42" rx="5" fill={color} />
      <path d={`M${x - 0.6} 177 H${x + 11.6} V182 H${x - 0.6} Z`} fill={HOOF} />
    </>
  )
}

type GoatProps = {
  readonly t: number
  readonly angle: number
  readonly mood: Mood
  readonly mouthOpen: boolean
  readonly hornScale: number
}

function Goat({ t, angle, mood, mouthOpen, hornScale }: GoatProps) {
  // びっくり→よろこびで、その場で ぴょんぴょん(さいごは 0 に もどる)
  const hop = -Math.abs(Math.sin(span(t, JOY, JOY + 0.9) * Math.PI * 2)) * 7
  const sparkle = during(t, GROW + 0.2, JOY + 0.3, 0.25)
  return (
    <Layer y={hop}>
      <Leg x={-58} color={FUR_FAR} />
      <Leg x={4} color={FUR_FAR} />
      {/* しっぽ: ちょん と 上へ */}
      <path d="M-88 126 Q-102 116 -98 106 Q-90 116 -82 120 Z" fill={FUR} />
      <ellipse cx="-30" cy="136" rx="62" ry="25" fill={FUR} />
      <ellipse cx="-26" cy="153" rx="46" ry="7" fill={FUR_SHADE} opacity="0.7" />
      <Leg x={-74} color={FUR} />
      <Leg x={14} color={FUR} />
      {/* くび: からだの まえから あたまの つけね へ つながる */}
      <path d="M8 136 L36 128" stroke={FUR} strokeWidth="32" strokeLinecap="round" />
      <Head angle={angle} mood={mood} mouthOpen={mouthOpen} hornScale={hornScale} sparkle={sparkle} />
    </Layer>
  )
}

/** しょんぼり の ずーん(あたまの上に 青い たて線 と、ためいきの あせ) */
function Gloom({ t }: SceneProps) {
  const show = during(t, 0.2, EAT, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show} stroke="#6f86c8" strokeWidth="2.4" strokeLinecap="round">
      {[0, 1, 2].map((i) => {
        const bob = wave(t, 0.8, i * 0.2) * 1.5
        return <path key={i} d={`M${34 + i * 12} ${74 + bob} v${12 - i * 2}`} />
      })}
      <path d="M76 100 q3 4 0 7 q-3 -3 0 -7 Z" fill={SWEAT} stroke="none" transform={`translate(0 ${wave(t, 1.1) * 2})`} />
    </g>
  )
}

function headAngle(t: number): number {
  if (t < GROW) {
    // しょんぼり(うつむく)→ くさを たべに あたまを 下げる → もぐもぐ
    const droop = mix(t, 0, 0.8, 2, 14) + mix(t, EAT - 0.4, EAT, 0, BOW - 14)
    return t < EAT ? droop : BOW + 3 * wave(t - EAT, 0.6)
  }
  // あたまを ぐいっと 上げる
  return mix(t, GROW, JOY - 0.2, BOW, 0, easeInOut)
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)
  const camera = mix(t, ZOOM_FROM, ZOOM_TO, CAM_FAR, 1, easeInOut)
  // とおくの おかは、カメラが よっても ゆっくり しか 大きくならない
  const farCamera = 1 + (camera - 1) * 0.3

  const angle = headAngle(t)
  const mood: Mood = t < EAT - 0.2 ? 'sad' : t < GROW ? 'chew' : t < JOY ? 'amazed' : 'happy'
  const mouthOpen = t >= EAT && t < GROW && wave(t - EAT, 0.6) > 0
  // つのは はじめ ちっちゃい(のびる前から 少し見える)。ぽん と のびる
  const hornScale = 0.2 + 0.8 * span(t, GROW + 0.1, JOY, backOut)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Layer scale={farCamera} origin={CAM_ORIGIN}>
          <path d="M-60 99 Q18 74 44 90 Q72 68 170 93 V260 H-60 Z" fill={HILL} />
        </Layer>
        <Layer scale={camera} origin={CAM_ORIGIN}>
          <Ground t={t} />
          <ellipse cx="-30" cy={GROUND + 1} rx="88" ry="6" fill="#000000" opacity="0.1" />
          <Layer opacity={span(t, 0.1, 0.5)}>
            <Goat t={t} angle={angle} mood={mood} mouthOpen={mouthOpen} hornScale={hornScale} />
          </Layer>
          <Gloom t={t} />
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
    { at: 0, label: 'こやぎが しょんぼり。つのが ちっちゃい', sound: 'pop' },
    { at: EAT, label: 'くさを もぐもぐ たべる' },
    { at: GROW, label: 'つのが ぐんぐん のびて、びっくり', sound: 'pop' },
    { at: JOY, label: 'うれしくて ぴょんぴょん' },
    { at: ZOOM_FROM, label: 'つのに ぐーっと よる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '角 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
