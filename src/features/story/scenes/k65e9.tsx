/*
 * 早(はやい): あさ、おひさまが 十字の しるしの 上に のぼる。
 *
 * ほね(画と絵の対応)
 *   1〜4画目(日) … のぼったばかりの おひさま(まるい おひさまが、四角い 日 の ところに おさまる)
 *   5画目(一)   … 十字の しるし(みちしるべ)の よこぼう
 *   6画目(丨)   … 十字の しるしの たてぼう(まっすぐ 地面に さしてある)
 *
 * ながれ
 *   まだ くらい 夜あけ前。十字の しるしの そばで、子どもが さむくて ねむそうに ふるえている(あくび も する)
 *   → 空の はしが 明るくなり、おひさまが 地面の むこうから のぼりはじめる(子どもは 目をさまして びっくり)
 *   → おひさまは 十字の しるしの うしろを のぼって、てっぺんの 上に とまる
 *   → あさに なって、子どもは うれしくて ばんざい(とり も とんでいく)
 *   → ほね が ひかって、絵が うすくなり、字「早」が のこる
 *
 * 子ども・おひさま・しるしは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   子どもは 正面むき。うで は かた から出て ひじ で まがる。くび は みじかく、どう の まんなか の上。
 *   おひさまは 地面の むこう(おか の うしろ)から のぼるので、さいしょは おか に かくれている。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '早'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#ee7b5a'
const TUNIC_DARK = '#d9644a'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const LEAF = '#55b86e'
const GRASS = '#c5e8a9'
const HILL = '#e2f2d2'
const SUN = '#ffd24a'
const SUN_LIGHT = '#ffe58a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const SKY_NIGHT = '#243257'
const SKY_DAY = '#a6dcff'
const GLOW = '#ffb36b'
const NIGHT_VEIL = '#1c2850'

/** くぎり の時間(秒) */
const COLD = 0.9
/** 空の はしが 明るくなり、子どもが きづく */
const NOTICE = 2.9
/** おひさまが のぼりはじめる / のぼりおわる */
const RISE = 3.1
const TOP = 5.8
/** 子どもが ばんざい */
const CHEER = 4.7
const INK = 6.3
const DONE = 9.0
const DURATION = 9.6

/** おひさまの まんなか(のぼりおわった ところ) と 大きさ。1〜4画目の 四角に おさまる */
const SUN_X = 54
const SUN_TOP_Y = 30
const SUN_R = 17
/** のぼる まえ: おか の うしろに すっぽり かくれる 高さ */
const SUN_LOW_Y = 112
/** 子どもの まんなか(x)・足もと(y)・かた の 高さ */
const KID_X = 30
const KID_FEET = 94
const SHOULDER_Y = 68.4

const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
/** 2つの色を まぜる(k = 0 で a、1 で b) */
function mixColor(a: string, b: string, k: number): string {
  const part = (i: number) => Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * k)
  return `rgb(${part(0)} ${part(1)} ${part(2)})`
}

function Sky({ t }: SceneProps) {
  const day = span(t, NOTICE - 0.3, TOP)
  const glow = Math.sin(span(t, NOTICE - 0.3, TOP + 1.2) * Math.PI)
  const stars = 1 - span(t, NOTICE, NOTICE + 1.4)
  return (
    <>
      <rect x="-2" y="-2" width="113" height="113" fill={mixColor(SKY_NIGHT, SKY_DAY, day)} />
      <ellipse cx="54.5" cy="92" rx="70" ry="38" fill={GLOW} opacity={glow * 0.7} />
      {/* 星: 夜の間だけ ちかちか。あさに なると きえる */}
      <g fill="#ffffff" opacity={stars}>
        {(
          [
            [10, 12, 1.2],
            [22, 28, 0.9],
            [92, 10, 1.3],
            [100, 30, 0.9],
            [84, 22, 0.8],
            [14, 44, 0.8],
            [100, 50, 1],
          ] as const
        ).map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r * (0.8 + 0.2 * wave(t, 1.3, i * 0.4))} />
        ))}
      </g>
    </>
  )
}

/** おひさま。おか の うしろから のぼって、1〜4画目の 場所に とまる。 */
function Sun({ t }: SceneProps) {
  const rise = span(t, RISE, TOP, easeOut)
  if (rise <= 0) return null
  const y = mix(t, RISE, TOP, SUN_LOW_Y, SUN_TOP_Y, easeOut)
  return (
    <Layer x={SUN_X} y={y}>
      <circle r={SUN_R + 6.5} fill="#fff2a8" opacity={0.28 * rise} />
      <g transform={`rotate(${t * 12})`}>
        {Array.from({ length: 10 }, (_, i) => (
          <rect key={i} x="-0.9" y={-SUN_R - 5.4} width="1.8" height="3.4" rx="0.9" fill={SUN} transform={`rotate(${i * 36})`} />
        ))}
      </g>
      <circle r={SUN_R} fill={SUN} />
      <circle cx="-4.5" cy="-4.5" r={SUN_R * 0.55} fill={SUN_LIGHT} />
    </Layer>
  )
}

/** おか(おひさまを かくす) と、てまえの 草 */
function Hill() {
  return (
    <>
      <path d="M-4 99 Q18 78 44 90 Q74 76 113 92 V101 H-4 Z" fill={HILL} />
    </>
  )
}

function Grass() {
  return (
    <>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 46, 82, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 十字の しるし。まっすぐ 地面に さしてある たてぼう と、よこぼう。 */
function Cross({ t }: SceneProps) {
  const appear = span(t, 0.3, 0.9, backOut)
  return (
    <Layer scale={0.9 + 0.1 * appear} opacity={Math.min(1, appear * 2)} origin={[54.6, 98]}>
      <ellipse cx="54.6" cy="97.6" rx="9" ry="2.6" fill="#000000" opacity="0.12" />
      <path d="M48 98 Q53 93.5 52.6 90 L56.8 90 Q56.4 93.5 61.4 98 Z" fill={BARK} />
      <Bone char={CHAR} n={6} color={BARK} width={7.2} />
      <Bone char={CHAR} n={5} color={BARK} width={6.4} />
      {/* きの め(もくめ) */}
      <path d="M54.6 72 v6 M53.6 84 v4 M32 64.2 h6 M70 63.8 h7" fill="none" stroke={BARK_DARK} strokeWidth="1" strokeLinecap="round" />
    </Layer>
  )
}

type Mood = 'sleepy' | 'surprised' | 'happy'
/** うで の かっこう。upper = ま下から そとへ ひらいた角度 / fore = ひじから さきの 角度(同じ むき) */
type ArmPose = { readonly upper: number; readonly fore: number }

const HANG: ArmPose = { upper: 8, fore: 4 }
const BANZAI: ArmPose = { upper: 135, fore: 160 }

const mixPose = (a: ArmPose, b: ArmPose, k: number): ArmPose => ({ upper: a.upper + (b.upper - a.upper) * k, fore: a.fore + (b.fore - a.fore) * k })

const UPPER_ARM = 6.6
const FORE_ARM = 6.4

/** かた から出て、ひじ で まがる うで。side = -1 が 画面の 左、1 が 右。 */
function Arm({ side, pose }: { readonly side: -1 | 1; readonly pose: ArmPose }) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const sx = KID_X + side * 7.4
  const ex = sx + side * Math.sin(rad(pose.upper)) * UPPER_ARM
  const ey = SHOULDER_Y + Math.cos(rad(pose.upper)) * UPPER_ARM
  const hx = ex + side * Math.sin(rad(pose.fore)) * FORE_ARM
  const hy = ey + Math.cos(rad(pose.fore)) * FORE_ARM
  return (
    <>
      <path d={`M${sx} ${SHOULDER_Y} L${ex} ${ey} L${hx} ${hy}`} fill="none" stroke={TUNIC_DARK} strokeWidth="4.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hx} cy={hy} r="2.7" fill={SKIN} />
    </>
  )
}

type Face = { readonly mood: Mood; readonly yawn: number; readonly lookUp: number }

function KidFace({ mood, yawn, lookUp }: Face) {
  return (
    <>
      <circle cx="24.2" cy="59.6" r="1.9" fill={CHEEK} opacity="0.55" />
      <circle cx="35.8" cy="59.6" r="1.9" fill={CHEEK} opacity="0.55" />
      {mood === 'sleepy' && (
        <>
          {[26.6, 33.4].map((x) => (
            <path key={x} d={`M${x - 1.8} 56.6 Q${x} 58.6 ${x + 1.8} 56.6`} fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          ))}
          <ellipse cx="30" cy={61.8 + yawn * 0.6} rx={1.1 + yawn * 1.1} ry={0.7 + yawn * 1.9} fill={MOUTH} />
        </>
      )}
      {mood === 'surprised' && (
        <>
          {[26.6, 33.4].map((x) => (
            <g key={x}>
              <circle cx={x} cy="56.5" r="2.1" fill="#ffffff" />
              <circle cx={x} cy={56.5 - lookUp * 0.7} r="1.15" fill={EYE} />
            </g>
          ))}
          <ellipse cx="30" cy="62" rx="1.5" ry="1.9" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          {[26.6, 33.4].map((x) => (
            <path key={x} d={`M${x - 1.8} 57.2 Q${x} 54.6 ${x + 1.8} 57.2`} fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          ))}
          <path d="M26.8 60.4 Q30 66.2 33.2 60.4 Z" fill={MOUTH} />
        </>
      )}
    </>
  )
}

function Kid({ face, nearPose, farPose }: { readonly face: Face; readonly nearPose: ArmPose; readonly farPose: ArmPose }) {
  return (
    <>
      {/* あし */}
      <rect x="24.8" y="82" width="4.8" height="11.4" rx="2.4" fill={PANTS} />
      <rect x="30.4" y="82" width="4.8" height="11.4" rx="2.4" fill={PANTS} />
      <ellipse cx="26.6" cy="94" rx="3.6" ry="2.2" fill={SHOE} />
      <ellipse cx="33.4" cy="94" rx="3.6" ry="2.2" fill={SHOE} />
      {/* くび: どう と あたま の間を みじかく つなぐ */}
      <rect x="27.8" y="62" width="4.4" height="6" rx="2" fill={SKIN_SHADE} />
      {/* どう */}
      <rect x="22.4" y="65.4" width="15.2" height="18" rx="6" fill={TUNIC} />
      <path d="M24.6 78.6 h10.8" stroke={TUNIC_DARK} strokeWidth="1.4" strokeLinecap="round" />
      <Arm side={-1} pose={nearPose} />
      <Arm side={1} pose={farPose} />
      {/* あたま */}
      <circle cx="21.7" cy="56.8" r="1.8" fill={SKIN} />
      <circle cx="38.3" cy="56.8" r="1.8" fill={SKIN} />
      <circle cx="30" cy="55.5" r="8.4" fill={SKIN} />
      <path d="M21.6 54.5 A8.4 8.4 0 0 1 38.4 54.5 C36 50.6 33 50.2 30 50.4 C26.8 50.2 23.8 51.2 21.6 54.5 Z" fill={HAIR} />
      <path d="M30 46.6 Q28.6 43 31.6 43.8" fill="none" stroke={HAIR} strokeWidth="1.6" strokeLinecap="round" />
      <KidFace {...face} />
    </>
  )
}

/** さむくて ふるえる ようす(体の よこの 小さな せん) */
function Shiver({ t, amount }: SceneProps & { readonly amount: number }) {
  if (amount <= 0) return null
  const j = wave(t, 0.13) * 0.7
  return (
    <g opacity={amount} fill="none" stroke="#dbe7ff" strokeWidth="1" strokeLinecap="round">
      <path d={`M${16 + j} 72 q-1.4 2.2 0 4.4 M${13.6 + j} 71 q-1.4 3.4 0 6.4`} />
      <path d={`M${44 - j} 72 q1.4 2.2 0 4.4 M${46.4 - j} 71 q1.4 3.4 0 6.4`} />
    </g>
  )
}

/** 子ども(しゅやく): さむくて ねむい → びっくり → うれしくて ばんざい */
function KidScene({ t }: SceneProps) {
  const pop = span(t, 0.45, 1.0, backOut)
  const cold = 1 - span(t, NOTICE, NOTICE + 0.4)
  const cheer = span(t, CHEER, CHEER + 0.5, backOut)
  const mood: Mood = t < NOTICE ? 'sleepy' : t < CHEER ? 'surprised' : 'happy'
  const yawn = during(t, 1.7, 2.6, 0.3)
  const lookUp = mix(t, NOTICE + 0.1, NOTICE + 0.5, 0, 1)
  const shiver = t > COLD ? cold * wave(t, 0.11) * 0.35 : 0
  // うれしくて ぴょんぴょん(足が 地面から はなれる)
  const hop = t > CHEER + 0.4 ? Math.abs(Math.sin((t - CHEER - 0.4) * Math.PI * 2.1)) * 2.6 * (1 - span(t, INK - 0.4, INK + 0.4)) : 0
  const calm = HANG
  const wiggle = t > CHEER + 0.5 ? wave(t, 0.42) * 7 : 0
  const arms = mixPose(calm, BANZAI, cheer)
  const near: ArmPose = { upper: arms.upper + wiggle * cheer, fore: arms.fore }
  const far: ArmPose = { upper: arms.upper - wiggle * cheer, fore: arms.fore }
  return (
    <Layer opacity={Math.min(1, pop * 2)}>
      <ellipse cx={KID_X} cy="97.4" rx={9 - hop} ry="2.3" fill="#000000" opacity="0.12" />
      <Layer x={shiver} y={-hop} scale={0.85 + 0.15 * pop} origin={[KID_X, KID_FEET]}>
        <Kid face={{ mood, yawn, lookUp }} nearPose={near} farPose={far} />
      </Layer>
      <Shiver t={t} amount={cold * span(t, COLD, COLD + 0.3)} />
    </Layer>
  )
}

/** あさに なると、とりが とんでいく。 */
function Birds({ t }: SceneProps) {
  const p = span(t, TOP - 0.3, INK + 0.6)
  if (p <= 0) return null
  return (
    <>
      {[0, 0.18].map((late, i) => {
        const q = Math.min(1, Math.max(0, p - late) / (1 - late))
        const x = 118 - q * 134
        const y = 9 + i * 7 + Math.sin(q * 6 + i) * 2
        return (
          <Layer key={i} x={x} y={y} scaleY={0.6 + 0.5 * wave(t, 0.4, i * 0.2)}>
            <path d="M-3.2 0 Q-1.6 -2.4 0 0 Q1.6 -2.4 3.2 0" fill="none" stroke="#4a5a74" strokeWidth="1" strokeLinecap="round" />
          </Layer>
        )
      })}
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)
  // 夜の くらさ(あさに なるにつれて はれる)
  const night = 0.5 * (1 - span(t, NOTICE, TOP - 0.3, easeInOut))
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Sun t={t} />
        <Hill />
        <Cross t={t} />
        <KidScene t={t} />
        <Grass />
        <rect x="-2" y="-2" width="113" height="113" fill={NIGHT_VEIL} opacity={night} />
        <Birds t={t} />
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
    { at: 0, label: 'まだ くらい 夜あけ前。十字の しるしが ある', sound: 'pop' },
    { at: COLD, label: '子どもが さむくて ねむそうに ふるえる' },
    { at: RISE, label: '空が 明るくなって、おひさまが のぼりはじめる', sound: 'pop' },
    { at: CHEER, label: '子どもが びっくり、そして ばんざい' },
    { at: TOP, label: 'おひさまが しるしの 上に のぼった(あさ)' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '早 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
