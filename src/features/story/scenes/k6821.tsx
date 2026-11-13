/*
 * 校(こう): 木で たてた まなびや。右は 音(こう)の しるし。
 *
 * ほね(画と絵の対応)
 *   1〜4画目(木) … 左に立つ 大きな木。1画目 = よこに のびた えだ / 2画目 = みき /
 *                  3・4画目 = 左と右に たれた えだ
 *   5画目(丨)    … 木で たてた いえの、やねの まんなかの はしら(きんぐぽすと)
 *   6画目(一)    … やねの 下の よこ木(のき の はり)
 *   7・8画目     … はり の下を ささえる、ななめの つっぱり(左と右)
 *   9・10画目    … かべに うちつけた、ばってんの 木(すじかい)
 *
 * ながれ
 *   お日さまが てって、木が そだつ。左では ランドセルの子が、まなぶ ばしょが なくて しょんぼり
 *   → 右から だいくさんが あるいてくる。子を見て「そうだ!」と ひらめく
 *   → とんとん とんかち。かべ → ばってんの 木 → はり → やね と、木で いえが たつ
 *   → 子は ぴょんぴょん よろこび、だいくさんも「できた!」と こぶしを あげる
 *   → ほね が ひかって、絵が うすくなり、字「校」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく、どう の まんなか の上。
 *   とんかち は 手に もって ふりあげ、ふりおろす。いえは、かべ・はり・やね の じゅんに たてる。
 */
import { backOut, during, easeIn, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '校'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const PLANK = '#f0d4a0'
const PLANK_LINE = '#d9b77c'
const ROOF = '#d9604c'
const GABLE = '#f6e2b8'
const WINDOW = '#bfe3f7'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const SWEAT = '#7cc4f2'

/** くぎり の時間(秒) */
const WALK_FROM = 0.9
const WALK_TO = 2.5
/** ひらめく(まっ白な ほし が あたまの上に ぽん) */
const IDEA = 2.9
/** とんかち が はじまる(さいしょの ふりあげ) */
const HAMMER_START = 3.2
const SWING = 0.7
/** 4回 たたく。たたいた しゅんかん に、いえの 一部が たつ */
const HITS: readonly number[] = [3.9, 4.6, 5.3, 6.0]
const CHEER = 6.3
const INK = 7.0
const DONE = 10.4
const DURATION = 11

/** 地面の たかさ */
const GROUND_Y = 96

const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/* ───────── けしき ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[98, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="97.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 98 13)`} />
        ))}
      </Layer>
      <circle cx="98" cy="13" r={6.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 93 V101 H-4 Z" fill="#e2f2d2" />
      {/* ゆっくり ながれる 雲(おくゆき を出す) */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="-2" cy="52" rx="7" ry="3.2" />
        <ellipse cx="3" cy="50.2" rx="5" ry="3.2" />
        <ellipse cx="80" cy="6" rx="6" ry="2.6" />
        <ellipse cx="84.5" cy="4.6" rx="4.2" ry="2.8" />
      </g>
      <ellipse cx="54.5" cy="98" rx="52" ry="5.6" fill={GRASS} />
      {[5, 44, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 左に立つ 木。画の線を そのまま みき・えだ にする(本来 その形のもの) */
function Tree({ t }: SceneProps) {
  const trunk = span(t, 0, 0.55, backOut)
  const boughs = span(t, 0.3, 0.75, backOut)
  const leaves = span(t, 0.5, 1.0, backOut)
  const sway = wave(t, 3.4) * 1.3
  return (
    <>
      <ellipse cx="31" cy="97.6" rx={15 * trunk} ry="2.8" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.6 + 0.4 * trunk} scaleY={trunk} origin={[30.7, 96]}>
        <path d="M23 97 Q29.5 92 28.6 84 L33.4 84 Q33 92 38.6 97 Z" fill={BARK} />
        <Bone char={CHAR} n={2} color={BARK} width={8.6} />
        <path d="M29.2 56 q1.4 5 0 10 M32.4 70 q-1.2 5 0.2 9" fill="none" stroke={BARK_DARK} strokeWidth="1.2" strokeLinecap="round" />
      </Layer>
      <Layer scale={boughs} origin={[30.5, 40]}>
        <Bone char={CHAR} n={1} color={BARK} width={5.2} />
        <Bone char={CHAR} n={3} color={BARK} width={5} />
        <Bone char={CHAR} n={4} color={BARK} width={4.4} />
      </Layer>
      {/* えだの先の 小さな しげみ */}
      <Layer scale={leaves} origin={[30.5, 40]} rotate={sway * 0.6}>
        <circle cx="12" cy="40" r="5.2" fill={LEAF_DARK} />
        <circle cx="13.5" cy="38" r="3.8" fill={LEAF} />
        <circle cx="42.5" cy="36.5" r="5.2" fill={LEAF_DARK} />
        <circle cx="41" cy="34.6" r="3.6" fill={LEAF} />
        <circle cx="15" cy="70.5" r="4.4" fill={LEAF_DARK} />
        <circle cx="14.2" cy="69" r="3" fill={LEAF} />
        <circle cx="41" cy="59.5" r="3.8" fill={LEAF_DARK} />
        <circle cx="40.4" cy="58.4" r="2.6" fill={LEAF} />
      </Layer>
      {/* 上の しげみ: 風で ゆっくり ゆれる */}
      <Layer scale={leaves} rotate={sway} origin={[30, 34]}>
        <circle cx="17.5" cy="27" r="10.5" fill={LEAF_DARK} />
        <circle cx="42" cy="27" r="9.5" fill={LEAF_DARK} />
        <circle cx="29.5" cy="17" r="13" fill={LEAF_DARK} />
        <circle cx="21" cy="26.5" r="8.5" fill={LEAF} />
        <circle cx="38.5" cy="26.5" r="8" fill={LEAF} />
        <circle cx="29.5" cy="20.5" r="9.5" fill={LEAF} />
        <circle cx="24" cy="14.5" r="4.2" fill={LEAF_LIGHT} />
        <circle cx="36" cy="18" r="3" fill={LEAF_LIGHT} />
      </Layer>
    </>
  )
}

/* ───────── 木の いえ(まなびや) ───────── */

const WALL_LEFT = 48
const WALL_RIGHT = 94
const WALL_TOP = 31
const WALL_BOTTOM = 92
/** いえの たつ じゅんばん(たたく たびに ひとつ) */
const pop = (t: number, hit: number, ease = backOut) => span(t, hit - 0.05, hit + 0.45, ease)

function House({ t }: SceneProps) {
  const wall = pop(t, HITS[0])
  const braceA = span(t, HITS[1] - 0.05, HITS[1] + 0.3, easeOut)
  const braceB = span(t, HITS[1] + 0.2, HITS[1] + 0.5, easeOut)
  const beam = pop(t, HITS[2])
  const roof = pop(t, HITS[3])
  const flag = span(t, HITS[3] + 0.15, HITS[3] + 0.7, backOut)
  const flap = wave(t, 0.8) * 1.6
  return (
    <>
      {wall > 0 && (
        <Layer scaleY={wall} origin={[(WALL_LEFT + WALL_RIGHT) / 2, WALL_BOTTOM]}>
          <rect x={WALL_LEFT} y={WALL_TOP} width={WALL_RIGHT - WALL_LEFT} height={WALL_BOTTOM - WALL_TOP} fill={PLANK} />
          <path d="M48 62.5 H94 M48 74 H94 M48 85 H94" stroke={PLANK_LINE} strokeWidth="0.8" opacity="0.7" />
          <circle cx="69" cy="44" r="4.6" fill={WINDOW} />
          <path d="M69 39.4 v9.2 M64.4 44 h9.2" stroke={BARK_DARK} strokeWidth="1" />
          <rect x={WALL_LEFT} y={WALL_TOP} width="3.6" height={WALL_BOTTOM - WALL_TOP} fill={BARK_DARK} />
          <rect x={WALL_RIGHT - 3.6} y={WALL_TOP} width="3.6" height={WALL_BOTTOM - WALL_TOP} fill={BARK_DARK} />
          <rect x={WALL_LEFT - 1} y={WALL_BOTTOM - 1} width={WALL_RIGHT - WALL_LEFT + 2} height="3.2" rx="1.2" fill={BARK_DARK} />
        </Layer>
      )}
      <Bone char={CHAR} n={9} color={BARK} width={4.2} to={braceA} />
      <Bone char={CHAR} n={10} color={BARK} width={4.2} to={braceB} />
      {roof > 0 && (
        <Layer scale={roof} origin={[70, 31]}>
          <path d="M46 31.6 L68 12.5 L95 29.4 Z" fill={GABLE} />
          <Bone char={CHAR} n={5} color={BARK} width={2.8} />
          <path d="M44.5 33 L68 12.2 L96.5 30.2" fill="none" stroke={ROOF} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
        </Layer>
      )}
      {beam > 0 && (
        <Layer scale={beam} origin={[70, 32]}>
          <Bone char={CHAR} n={6} color={BARK} width={4.6} />
          <Bone char={CHAR} n={7} color={BARK} width={3.4} />
          <Bone char={CHAR} n={8} color={BARK} width={3.4} />
        </Layer>
      )}
      {/* やねの てっぺんに はた。かぜで はためく */}
      {flag > 0 && (
        <Layer scale={flag} origin={[68, 12.5]}>
          <path d="M68 12.5 L68.5 2.6" stroke={BARK_DARK} strokeWidth="1.1" strokeLinecap="round" />
          <path d={`M68.5 3 Q74 ${2 + flap} 80 ${4 + flap * 0.5} Q74 ${6.6 + flap} 68.5 8 Z`} fill="#e8534a" />
        </Layer>
      )}
    </>
  )
}

/* ───────── 人(だいくさん・子ども) ───────── */

type Mood = 'calm' | 'sad' | 'worry' | 'determined' | 'happy'
/** うで の かっこう。swing = ま下から まえへ ふった角度 / bend = ひじ の まがり(まえへ) */
type ArmPose = { readonly swing: number; readonly bend: number }

type Look = {
  readonly shirt: string
  readonly shirtDark: string
  readonly pants: string
  readonly shoe: string
  readonly kid: boolean
}
const CARPENTER: Look = { shirt: '#e8923a', shirtDark: '#c97a28', pants: '#8a6a4a', shoe: '#5b4030', kid: false }
const KID: Look = { shirt: '#8fd0f0', shirtDark: '#6fb6dc', pants: '#3e5c86', shoe: '#e8534a', kid: true }

/** からだの 大きさ(足もとが 0,0。あたまの てっぺんは およそ -46) */
const SHOULDER_Y = -30.4
const UPPER = 8
const FORE = 7.6
const HIP_Y = -18

const rad = (deg: number) => (deg * Math.PI) / 180

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。tool が あれば 手に とんかち を もつ */
function Arm({ pose, color, tool = false }: { readonly pose: ArmPose; readonly color: string; readonly tool?: boolean }) {
  const elbow = [Math.sin(rad(pose.swing)) * UPPER, SHOULDER_Y + Math.cos(rad(pose.swing)) * UPPER] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] + Math.sin(rad(fore)) * FORE, elbow[1] + Math.cos(rad(fore)) * FORE] as const
  return (
    <>
      <path d={`M0 ${SHOULDER_Y} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.5" fill={SKIN} />
      {tool && (
        /* えの ながさ 7、あたま は えの さきに ついた 小さな 四角。手の すこし 先を もつ */
        <g transform={`translate(${hand[0]} ${hand[1]}) rotate(${-fore})`}>
          <path d="M0 -2.6 V6.6" stroke="#a9794c" strokeWidth="1.7" strokeLinecap="round" />
          <rect x="-3.2" y="5" width="6.4" height="3.2" rx="0.8" fill="#8a929c" />
        </g>
      )}
    </>
  )
}

/** 顔。あたまの まんなか が 原点。まえ(+x)を むく */
function Face({ mood }: { readonly mood: Mood }) {
  const e1 = 0.2
  const e2 = 3.6
  return (
    <>
      <circle cx={e1 - 0.3} cy="2.6" r="1.3" fill="#ff9d9d" opacity="0.55" />
      <circle cx={e2 + 1.1} cy="2.6" r="1.3" fill="#ff9d9d" opacity="0.55" />
      {mood === 'happy' ? (
        <>
          <path d={`M${e1 - 1} -0.1 Q${e1 + 0.2} -1.9 ${e1 + 1.4} -0.1 M${e2 - 1} -0.1 Q${e2 + 0.2} -1.9 ${e2 + 1.4} -0.1`} fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d={`M${e1 + 0.6} 2.4 Q${e1 + 2.2} 6 ${e2 + 0.6} 2.4 Z`} fill={MOUTH} />
        </>
      ) : (
        <>
          <circle cx={e1} cy="-0.4" r="1" fill={EYE} />
          <circle cx={e2} cy="-0.4" r="1" fill={EYE} />
          {mood === 'sad' || mood === 'worry' ? (
            <>
              <path d={`M${e1 - 1} -2.4 L${e1 + 1.4} -3.4 M${e2 - 1.2} -3.4 L${e2 + 1.2} -2.4`} fill="none" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
              <path d={`M${e1 + 1} 4 Q${e1 + 2.4} 2.8 ${e2 + 0.4} 4`} fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
            </>
          ) : mood === 'determined' ? (
            <>
              <path d={`M${e1 - 1} -3.4 L${e1 + 1.4} -2.4 M${e2 - 1.2} -2.4 L${e2 + 1.2} -3.4`} fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
              <path d={`M${e1 + 1.2} 3.4 Q${e1 + 2.4} 4.2 ${e2 + 0.2} 3.2`} fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
            </>
          ) : (
            <path d={`M${e1 + 0.8} 3.2 Q${e1 + 2.2} 4.4 ${e2 + 0.4} 3.2`} fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
          )}
        </>
      )}
    </>
  )
}

type PersonProps = {
  readonly look: Look
  readonly mood: Mood
  readonly nearArm: ArmPose
  readonly farArm: ArmPose
  readonly step: number
  /** あたまの かたむき(まえへ たおす が +) */
  readonly headTilt: number
  readonly tool?: boolean
}

/** ほんものの人の つくり。足もと(0,0)から 上へ、まえ(+x)を むく */
function Person({ look, mood, nearArm, farArm, step, headTilt, tool = false }: PersonProps) {
  return (
    <>
      {/* ランドセル(子だけ): せなか(うしろ = -x) に せおう */}
      {look.kid && (
        <>
          <rect x="-11" y="-33" width="7" height="15.5" rx="2.2" fill="#d9483f" />
          <rect x="-9.6" y="-31" width="4.2" height="4" rx="1" fill="#f2b632" />
        </>
      )}
      <Arm pose={farArm} color={look.shirtDark} />
      {/* うしろの足・まえの足 */}
      {[1, -1].map((dir) => (
        <Layer key={dir} rotate={dir * step * 18} origin={[0, HIP_Y]}>
          <rect x="-2.3" y="-18.5" width="4.6" height="18" rx="2.3" fill={look.kid ? SKIN : dir === 1 ? '#7a5c40' : look.pants} />
          {look.kid && <rect x="-2.6" y="-18.8" width="5.2" height="10" rx="2.4" fill={look.pants} />}
          <ellipse cx="1.4" cy="-1" rx="3.8" ry="2" fill={look.shoe} />
        </Layer>
      ))}
      {/* くび: みじかく、どう と あたま の間を つなぐ */}
      <rect x="-1.8" y="-36" width="3.6" height="6" rx="1.6" fill={SKIN_SHADE} />
      {/* どう */}
      <rect x="-5.4" y="-34.5" width="10.8" height="17.4" rx="5" fill={look.shirt} />
      {!look.kid && (
        <>
          <rect x="-5.4" y="-23" width="10.8" height="2" fill="#5b4030" />
          <rect x="1.2" y="-22.4" width="3.4" height="4.2" rx="0.8" fill="#6b4a36" />
        </>
      )}
      <Arm pose={nearArm} color={look.shirt} tool={tool} />
      {/* あたま */}
      <Layer rotate={headTilt} origin={[0, -34]}>
        <g transform="translate(0.4 -40)">
          <circle cx="0" cy="0" r="6.4" fill={SKIN} />
          <circle cx="-1.6" cy="0.6" r="1.5" fill={SKIN_SHADE} />
          <path d="M-6.4 0.5 C-7 -7 1 -8.6 5.2 -5.6 C6.2 -4.8 6.4 -3.6 6.3 -2.6 C3 -5 -2 -5 -6.4 0.5 Z" fill={HAIR} />
          {look.kid ? (
            <>
              {/* 通学ぼうし(きいろ) */}
              <path d="M-6.8 -2 C-7 -9.8 6.6 -10 6.8 -2.2 Z" fill="#ffd24a" />
              <ellipse cx="6" cy="-2.2" rx="3.4" ry="0.9" fill="#f2b632" />
            </>
          ) : (
            /* はちまき */
            <>
              <path d="M-6.2 -2.4 Q0.2 -5.2 6.4 -2.6" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M-6 -2.4 l-3.4 -1 M-6 -2.4 l-3 1.8" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            </>
          )}
          <Face mood={mood} />
        </g>
      </Layer>
    </>
  )
}

/** きまった ふたつの かっこう の あいだ を つなぐ */
const blendPose = (a: ArmPose, b: ArmPose, k: number): ArmPose => ({ swing: lerp(a.swing, b.swing, k), bend: lerp(a.bend, b.bend, k) })

const HANG: ArmPose = { swing: 3, bend: 8 }
/** とんかち: ふりあげ と ふりおろし */
const RAISED: ArmPose = { swing: 95, bend: 75 }
const STRUCK: ArmPose = { swing: 38, bend: 52 }
/** よろこび: りょううで を 上へ */
const CHEER_ARM: ArmPose = { swing: 158, bend: 14 }

/** とんかち の 1 サイクル(ふりあげる 0.7 → ふりおろす)。0 = うった しゅんかん の かっこう、1 = ふりあげ */
function hammerRaise(t: number): number {
  const c = (t - (HITS[0] - SWING)) / SWING
  if (c < 0 || c >= HITS.length) return 0
  const f = c % 1
  return f < 0.7 ? easeOut(f / 0.7) : 1 - easeIn((f - 0.7) / 0.3)
}

function Carpenter({ t }: SceneProps) {
  const walkX = mix(t, WALK_FROM, WALK_TO, 42, 0, easeOut)
  const walking = 1 - span(t, WALK_TO - 0.25, WALK_TO)
  const stride = t < WALK_FROM ? 0 : Math.sin((t - WALK_FROM) * Math.PI * 2 * 1.7) * walking
  const bob = -Math.abs(stride) * 1.2
  const work = span(t, HAMMER_START - 0.3, HAMMER_START) * (1 - span(t, HITS[3] + 0.1, HITS[3] + 0.4))
  const cheer = span(t, CHEER, CHEER + 0.4, easeOut)
  const raise = hammerRaise(t)
  const base: ArmPose = t < WALK_TO ? { swing: stride * 24, bend: 14 } : HANG
  const farBase: ArmPose = t < WALK_TO ? { swing: -stride * 24, bend: 14 } : HANG
  const hammering = blendPose(STRUCK, RAISED, raise)
  const near = blendPose(blendPose(base, hammering, work), CHEER_ARM, cheer)
  const far = blendPose(blendPose(farBase, { swing: 30, bend: 40 }, work), CHEER_ARM, cheer)
  const mood: Mood = t < WALK_TO ? 'calm' : t < IDEA ? 'worry' : t < CHEER ? 'determined' : 'happy'
  const hop = cheer > 0 ? Math.abs(Math.sin((t - CHEER) * Math.PI * 2.4)) * 2.2 * cheer : 0
  return (
    <Layer x={103 + walkX} y={GROUND_Y + bob - hop} scaleX={-0.92} scaleY={0.92}>
      <Person look={CARPENTER} mood={mood} nearArm={near} farArm={far} step={stride} headTilt={t < IDEA ? 0 : 4 * (1 - cheer)} tool />
    </Layer>
  )
}

function Kid({ t }: SceneProps) {
  const appear = span(t, 0.25, 0.6)
  const happy = span(t, CHEER, CHEER + 0.3)
  // しょんぼり: かた が おちて、あたま が 下がる。うれしい: ぴょんぴょん はねて、りょううで を あげる
  const mood: Mood = t < 4.2 ? 'sad' : t < CHEER ? 'calm' : 'happy'
  const sadness = t < 4.2 ? 1 : 1 - span(t, 4.2, 4.8)
  const hop = Math.abs(Math.sin((t - CHEER) * Math.PI * 2.2)) * 4.5 * happy
  const sway = wave(t, 0.9) * 0.4
  const arm: ArmPose = blendPose({ swing: 3 + sway, bend: 8 }, CHEER_ARM, happy)
  const far: ArmPose = blendPose({ swing: 3 - sway, bend: 8 }, { swing: 150, bend: 20 }, happy)
  return (
    <Layer opacity={appear} x={12} y={GROUND_Y - hop} scale={0.96}>
      <Person look={KID} mood={mood} nearArm={arm} farArm={far} step={0} headTilt={8 * sadness - happy * 4} />
    </Layer>
  )
}

/* ───────── にぎやかし ───────── */

/** 子の あたまから おちる あせ(お日さまが あつい) */
function Sweat({ t }: SceneProps) {
  const show = during(t, 0.7, 4.6, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.5].map((offset) => {
        const p = ((t + offset) % 1) / 1
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill={SWEAT} transform={`translate(${19 + p * 1.5} ${55 + p * 9}) rotate(-8)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** ひらめき: だいくさんの あたまの上に ほし が ぽん */
function Idea({ t }: SceneProps) {
  const show = during(t, IDEA, IDEA + 0.8, 0.2)
  if (show <= 0) return null
  const grow = Math.max(0, span(t, IDEA, IDEA + 0.3, backOut))
  return (
    <g opacity={show}>
      <Star cx={100} cy={47} r={5.5 * grow} color="#ffd24a" spin={wave(t, 0.6) * 12} />
      <path d="M93 50 l-2.4 1.6 M107 50 l2.4 1.6" stroke="#f2b632" strokeWidth="1" strokeLinecap="round" />
    </g>
  )
}

/** たたいた しゅんかん に とびちる 木くず */
function Chips({ t }: SceneProps) {
  return (
    <>
      {HITS.map((hit) => {
        const p = span(t, hit, hit + 0.4)
        if (p <= 0 || p >= 1) return null
        return (
          <g key={hit} opacity={1 - p}>
            {[0, 1, 2].map((i) => (
              <rect key={i} x="-0.9" y="-0.5" width="1.8" height="1" rx="0.4" fill="#d9b77c" transform={`translate(${90 - p * (5 + i * 2)} ${72 - p * (6 - i * 2) + p * p * 9}) rotate(${p * 200 + i * 60})`} />
            ))}
          </g>
        )
      })}
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 10)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Tree t={t} />
        <House t={t} />
        <ellipse cx="11" cy="97.4" rx="8" ry="2.2" fill="#000000" opacity="0.12" />
        <Kid t={t} />
        <Sweat t={t} />
        <Carpenter t={t} />
        <Chips t={t} />
        <Idea t={t} />
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
    { at: 0, label: '木が そだつ。子が しょんぼり', sound: 'pop' },
    { at: WALK_FROM, label: 'だいくさんが あるいてくる' },
    { at: IDEA, label: '子を見て「そうだ!」とひらめく', sound: 'pop' },
    { at: HAMMER_START, label: 'とんかち とんとん', sound: 'stroke' },
    { at: HITS[2], label: '木の いえが たっていく' },
    { at: CHEER, label: 'できた! 子も だいくさんも よろこぶ', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '校 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
