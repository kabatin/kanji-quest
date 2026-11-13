/*
 * 門(もん): 2まいの とびらが ならんで ひらいた、もんの かたち。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)      … 左の とびらの 左はし(はしら)
 *   2画目(コ)      … 左の とびらの うえの まど の わく(上と右)
 *   3・4画目(一)   … 左の まどの よこぼう と、まど の した
 *   5画目(丨)      … 右の とびらの 左はし の うえ(まど の左)
 *   6画目(┐)       … 右の とびらの うえ と、右はしの はしら
 *   7・8画目(一)   … 右の まどの よこぼう と、まど の した
 *   (とびらは ひらくと はば が せまく見える。そのときの かたちが 字と重なる)
 *
 * ながれ
 *   もんが 立つ → しょんぼりした 女の子が あるいてくる。とびらは しまっていて はいれない(ふう…)
 *   → 手に かぎ を もっていたのを 思い出す(!)→ かぎ穴に さす(かちっ)
 *   → 2まいの とびらが ぱたんと ひらいて、あかるい 中が 見える。女の子は 大よろこび
 *   → ひらいた もんの 前に 立って ぴょん ぴょん → ほね が ひかって、絵が うすくなり、字「門」が のこる
 *
 * 女の子は まえむき。ほんものの人の つくり を守る:
 *   うで は かた から出て ひじ で まがる。くび は みじかく、あたま は どう の まんなか の上。
 * とびらは、はしら(ちょうつがい)の ほうを じく に、むこうがわ へ ひらく
 *   (ひらくと 手前から見て はば が せまく なる)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '門'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const DRESS = '#ee7fa0'
const DRESS_DARK = '#d6618a'
const SHOE = '#6b4a36'
const RIBBON = '#e8534a'
const KEY = '#f2b632'
const WOOD = '#b9814f'
const WOOD_DARK = '#8c5b3c'
const WOOD_LIGHT = '#cf9a66'
const PANE = '#cfe9f7'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const MOUTH = '#b9483f'

/** くぎり の時間(秒) */
const WALK = 0.9
const STOP = 2.4
/** かぎ に気づく */
const NOTICE = 3.0
const LIFT = 3.5
const CLICK = 4.5
const OPEN_FROM = 4.7
const OPEN_TO = 6.2
/** 女の子が もんの 前へ すすむ */
const STEP = 6.2
const STEP_END = 6.9
const INK = 7.5
const DONE = 10.4
const DURATION = 10.8

/** 女の子の 足もと(地面より 少し てまえ) */
const FEET_Y = 95
const START_X = 31
const GATE_X = 54.5
/** かぎ穴の 場所(しまっているときの 左のとびら の右はし ちかく) */
const LOCK: readonly [number, number] = [49.5, 70]
/** 女の子の 大きさ(主役が 小さく ならないように) */
const GIRL_SCALE = 1.2

/** とびらの 絵は「ひらいた かたち」(字と重なる かたち)で描く。しめるときは 横に のばす。 */
const LEFT_HINGE = 18
const RIGHT_HINGE = 91
const LEFT_CLOSED_SCALE = 1.36
const RIGHT_CLOSED_SCALE = 1.25

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[96, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="95.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 96 13)`} />
        ))}
      </Layer>
      <circle cx="96" cy="13" r={6.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 92 Q72 72 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="4" cy="8" rx="7" ry="3.2" />
        <ellipse cx="9" cy="6.2" rx="5" ry="3.2" />
        <ellipse cx="58" cy="6" rx="5.5" ry="2.6" />
        <ellipse cx="62.4" cy="4.6" rx="4" ry="2.8" />
      </g>
      <ellipse cx="54.5" cy="99" rx="53" ry="6.4" fill={GRASS} />
      {[6, 12, 100, 104].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** とびらの むこうがわ。ひらくと あかるい にわ が 見える(しまっていると すきま から 光が もれる)。 */
function Garden({ t, open }: SceneProps & { readonly open: number }) {
  const flap = wave(t, 0.28) * 0.6
  const fx = 53 + wave(t, 3.2) * 6
  const fy = 52 + wave(t, 2.1, 0.5) * 3
  return (
    <>
      <rect x="18" y="14" width="73" height="77" fill="#4a3a30" />
      <Layer opacity={0.14 + 0.86 * open}>
        <rect x="18" y="14" width="73" height="77" fill="#fff3c4" />
        <circle cx="53" cy="38" r="13" fill="#ffe9a0" />
        <path d="M18 72 Q38 56 53 66 Q70 54 91 70 V91 H18 Z" fill="#d6efb8" />
        <rect x="63.4" y="60" width="2.2" height="7" fill={WOOD_DARK} />
        <circle cx="64.5" cy="57.5" r="5.6" fill={LEAF_DARK} />
        <circle cx="63.4" cy="56" r="3.8" fill={LEAF} />
        <path d="M47 91 L60 91 L55.6 66 L52 66 Z" fill="#f4dfb0" />
        <circle cx="45.5" cy="82" r="1.5" fill="#ff9d9d" />
        <circle cx="62" cy="84.5" r="1.5" fill="#ffd24a" />
        <circle cx="44" cy="77" r="1.2" fill="#c8cffb" />
        <Layer x={fx} y={fy}>
          <Layer scaleX={0.5 + 0.5 * Math.abs(flap)}>
            <ellipse cx="-1.6" cy="0" rx="1.8" ry="1.4" fill="#f07f9e" />
            <ellipse cx="1.6" cy="0" rx="1.8" ry="1.4" fill="#f07f9e" />
          </Layer>
          <rect x="-0.3" y="-1.4" width="0.6" height="2.8" rx="0.3" fill={HAIR} />
        </Layer>
      </Layer>
    </>
  )
}

/** 左の とびら(ひらいた かたち)。まど は 上、かぎ穴は まんなか より下。 */
function LeftDoor() {
  return (
    <>
      <rect x="18" y="14.5" width="25" height="76.5" rx="2" fill={WOOD} />
      <rect x="18" y="14.5" width="3.2" height="76.5" rx="1.6" fill={WOOD_DARK} />
      <rect x="21.2" y="17" width="20.2" height="24" rx="1.2" fill={PANE} />
      <rect x="21.2" y="27.4" width="20.2" height="2.2" fill={WOOD_DARK} />
      <rect x="19.6" y="41" width="22.8" height="3" rx="1" fill={WOOD_DARK} />
      <path d="M30 48 V88 M36.6 48 V88" stroke={WOOD_LIGHT} strokeWidth="1" strokeLinecap="round" />
      {/* かぎ穴の ばん */}
      <rect x="38.6" y="66" width="3.6" height="8" rx="1.4" fill={WOOD_DARK} />
      <circle cx="40.4" cy="70" r="0.9" fill="#2b2b2b" />
    </>
  )
}

/** 右の とびら(ひらいた かたち) */
function RightDoor() {
  return (
    <>
      <rect x="63" y="13" width="28" height="76.5" rx="2" fill={WOOD} />
      <rect x="87.8" y="13" width="3.2" height="76.5" rx="1.6" fill={WOOD_DARK} />
      <rect x="65.6" y="15.6" width="20.8" height="22.4" rx="1.2" fill={PANE} />
      <rect x="65.6" y="25.4" width="20.8" height="2.2" fill={WOOD_DARK} />
      <rect x="64" y="37.4" width="23" height="3" rx="1" fill={WOOD_DARK} />
      <path d="M70 46 V87 M77 46 V87" stroke={WOOD_LIGHT} strokeWidth="1" strokeLinecap="round" />
      <circle cx="66.4" cy="68" r="1.6" fill={KEY} />
    </>
  )
}

function Gate({ t, open }: SceneProps & { readonly open: number }) {
  // 下から ぽん と 立ちあがる
  const rise = span(t, 0.1, 0.8, backOut)
  return (
    <Layer scaleY={Math.max(0, rise)} scaleX={0.85 + 0.15 * Math.min(1, rise)} origin={[GATE_X, 91]}>
      <Garden t={t} open={open} />
      <Layer scaleX={LEFT_CLOSED_SCALE - (LEFT_CLOSED_SCALE - 1) * open} origin={[LEFT_HINGE, 0]}>
        <LeftDoor />
      </Layer>
      <Layer scaleX={RIGHT_CLOSED_SCALE - (RIGHT_CLOSED_SCALE - 1) * open} origin={[RIGHT_HINGE, 0]}>
        <RightDoor />
      </Layer>
    </Layer>
  )
}

type Mood = 'sad' | 'hope' | 'happy'

/** うで の かっこう。swing = ま下から そとへ ふった角度(180 で ま上) / bend = ひじ の まがり */
type ArmPose = { readonly swing: number; readonly bend: number }

const ARM_PART = 5
const SHOULDER_X = 4.4
const SHOULDER_Y = -21.5

const rad = (deg: number) => (deg * Math.PI) / 180

/** かた から出て、ひじ で まがる うで。side = 1 で 右(x が ふえる ほう)、-1 で 左。 */
function Arm({ pose, side, withKey }: { readonly pose: ArmPose; readonly side: 1 | -1; readonly withKey: boolean }) {
  const sx = side * SHOULDER_X
  const ex = sx + side * Math.sin(rad(pose.swing)) * ARM_PART
  const ey = SHOULDER_Y + Math.cos(rad(pose.swing)) * ARM_PART
  const fore = pose.swing + pose.bend
  const hx = ex + side * Math.sin(rad(fore)) * ARM_PART
  const hy = ey + Math.cos(rad(fore)) * ARM_PART
  // かぎは 手から うでの むき に のびる
  const keyAngle = (Math.atan2(Math.cos(rad(fore)), side * Math.sin(rad(fore))) * 180) / Math.PI
  return (
    <>
      <path d={`M${sx} ${SHOULDER_Y} L${ex} ${ey}`} stroke={DRESS_DARK} strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <path d={`M${ex} ${ey} L${hx} ${hy}`} stroke={SKIN} strokeWidth="2.8" strokeLinecap="round" fill="none" />
      <circle cx={hx} cy={hy} r="1.9" fill={SKIN} />
      {withKey ? (
        <g transform={`translate(${hx} ${hy}) rotate(${keyAngle})`}>
          <circle cx="0.6" cy="0" r="1.7" fill="none" stroke={KEY} strokeWidth="1" />
          <rect x="2.2" y="-0.45" width="5.6" height="0.9" rx="0.4" fill={KEY} />
          <rect x="6" y="0" width="0.9" height="1.6" fill={KEY} />
          <rect x="4.4" y="0" width="0.9" height="1.2" fill={KEY} />
        </g>
      ) : null}
    </>
  )
}

type GirlProps = {
  readonly step: number
  readonly mood: Mood
  readonly rightArm: ArmPose
  readonly leftArm: ArmPose
  readonly headTilt: number
}

/** 女の子(まえむき)。足もと が (0,0)、あたま は 上(y が マイナス)。 */
function Girl({ step, mood, rightArm, leftArm, headTilt }: GirlProps) {
  return (
    <>
      {/* あし: あるくとき かわりばんこに ふる */}
      <Layer rotate={step * 14} origin={[-2.4, -10]}>
        <rect x="-3.9" y="-10" width="3.2" height="9" rx="1.6" fill={SKIN} />
        <ellipse cx="-2.4" cy="-0.9" rx="3" ry="1.6" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 14} origin={[2.4, -10]}>
        <rect x="0.7" y="-10" width="3.2" height="9" rx="1.6" fill={SKIN} />
        <ellipse cx="2.4" cy="-0.9" rx="3" ry="1.6" fill={SHOE} />
      </Layer>
      {/* くび と ふく */}
      <rect x="-1.6" y="-26" width="3.2" height="4" rx="1.4" fill={SKIN_SHADE} />
      <path d="M-4.4 -23 L4.4 -23 Q5 -17 7.6 -9.5 L-7.6 -9.5 Q-5 -17 -4.4 -23 Z" fill={DRESS} />
      <path d="M-7.3 -10.8 L7.3 -10.8" stroke={DRESS_DARK} strokeWidth="1.2" strokeLinecap="round" />
      <Arm pose={leftArm} side={-1} withKey={false} />
      <Arm pose={rightArm} side={1} withKey />
      {/* あたま */}
      <Layer rotate={headTilt} origin={[0, -24]}>
        <circle cx="-8" cy="-27" r="2.5" fill={HAIR} />
        <circle cx="8" cy="-27" r="2.5" fill={HAIR} />
        <circle cx="0" cy="-30.5" r="7.7" fill={HAIR} />
        <circle cx="0" cy="-29.6" r="6.8" fill={SKIN} />
        <path d="M-7 -30.4 Q-6.6 -37.6 0 -37.6 Q6.6 -37.6 7 -30.4 Q3.4 -33.4 -0.8 -34.2 Q-4.6 -33.4 -7 -30.4 Z" fill={HAIR} />
        <circle cx="-7.2" cy="-31.2" r="1.1" fill={RIBBON} />
        <circle cx="-4.4" cy="-26.8" r="1.3" fill="#ff9d9d" opacity="0.55" />
        <circle cx="4.4" cy="-26.8" r="1.3" fill="#ff9d9d" opacity="0.55" />
        {mood === 'sad' ? (
          <>
            <path d="M-4.4 -31.2 l2.6 -1 M4.4 -31.2 l-2.6 -1" stroke={HAIR} strokeWidth="0.8" strokeLinecap="round" />
            <circle cx="-2.6" cy="-29.6" r="1" fill="#2b2b2b" />
            <circle cx="2.6" cy="-29.6" r="1" fill="#2b2b2b" />
            <path d="M-1.6 -25.8 Q0 -27.2 1.6 -25.8" fill="none" stroke={MOUTH} strokeWidth="0.9" strokeLinecap="round" />
          </>
        ) : mood === 'hope' ? (
          <>
            <circle cx="-2.6" cy="-29.8" r="1.3" fill="#2b2b2b" />
            <circle cx="2.6" cy="-29.8" r="1.3" fill="#2b2b2b" />
            <circle cx="-2.2" cy="-30.2" r="0.45" fill="#ffffff" />
            <circle cx="3" cy="-30.2" r="0.45" fill="#ffffff" />
            <ellipse cx="0" cy="-26.2" rx="1" ry="1.2" fill={MOUTH} />
          </>
        ) : (
          <>
            <path d="M-4 -29.4 Q-2.6 -31.6 -1.2 -29.4 M1.2 -29.4 Q2.6 -31.6 4 -29.4" fill="none" stroke="#2b2b2b" strokeWidth="1" strokeLinecap="round" />
            <path d="M-2.4 -27 Q0 -23.6 2.4 -27 Z" fill={MOUTH} />
          </>
        )}
      </Layer>
    </>
  )
}

/** しょんぼりの「ふう」 */
function Sigh({ t }: SceneProps) {
  const show = during(t, STOP + 0.1, NOTICE + 0.2, 0.2)
  if (show <= 0) return null
  const p = span(t, STOP + 0.1, NOTICE + 0.2, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={-10 - p * 5} cy={-25 - p * 4} rx={2.4 + p * 2} ry={1.6 + p * 1.3} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <ellipse cx={-7.4 - p * 3} cy={-24 - p * 1.5} rx={1.2 + p * 0.8} ry={0.9 + p * 0.5} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
    </g>
  )
}

/** 「!」(かぎ に 気づいた) */
function Notice({ t }: SceneProps) {
  const show = during(t, NOTICE, LIFT + 0.3, 0.2)
  if (show <= 0) return null
  const pop = Math.max(0, span(t, NOTICE, NOTICE + 0.3, backOut))
  return (
    <Layer x={9} y={-41} scale={pop} opacity={show}>
      <rect x="-1" y="-5.4" width="2" height="4.2" rx="1" fill="#f2a31b" />
      <circle cx="0" cy="0" r="1.1" fill="#f2a31b" />
    </Layer>
  )
}

/** かぎ が かちっと はまった しゅんかん の ひかり */
function Click({ t }: SceneProps) {
  const show = during(t, CLICK, CLICK + 0.5, 0.1)
  if (show <= 0) return null
  const p = span(t, CLICK, CLICK + 0.5, easeOut)
  return (
    <g opacity={show} stroke="#ffd24a" strokeWidth="1.2" strokeLinecap="round">
      {[-60, -20, 20, 60, 160, 200].map((a) => (
        <line key={a} x1={LOCK[0] + Math.cos(rad(a)) * (3 + p * 2)} y1={LOCK[1] + Math.sin(rad(a)) * (3 + p * 2)} x2={LOCK[0] + Math.cos(rad(a)) * (5 + p * 4)} y2={LOCK[1] + Math.sin(rad(a)) * (5 + p * 4)} />
      ))}
    </g>
  )
}

/** うれしい ハート(あたまの 上へ のぼる) */
function Hearts({ t }: SceneProps) {
  const show = during(t, OPEN_FROM + 0.8, INK, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show} fill="#f07f9e">
      {[0, 0.7].map((offset, i) => {
        const p = ((t + offset) % 1.4) / 1.4
        return <path key={offset} d="M0 1.4 C-2.8 -0.6 -1.6 -3 0 -1.6 C1.6 -3 2.8 -0.6 0 1.4 Z" transform={`translate(${(i ? 9 : -9) + Math.sin(p * 6) * 1.2} ${-40 - p * 9}) scale(${0.9 + p * 0.5})`} opacity={Math.sin(p * Math.PI)} />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)
  const open = span(t, OPEN_FROM, OPEN_TO, easeInOut)

  // あるく: 左から とびらの 前へ。あとで もんの まんなかの 前へ
  const walkA = (1 - span(t, STOP - 0.25, STOP)) * (t < WALK ? 0 : 1)
  const walkB = during(t, STEP, STEP_END, 0.1)
  const step = Math.sin((t - WALK) * Math.PI * 2 * 1.9) * walkA + Math.sin((t - STEP) * Math.PI * 2 * 1.9) * walkB
  const x = mix(t, WALK, STOP, -12, START_X, easeOut) + mix(t, STEP, STEP_END, 0, GATE_X - START_X, easeInOut)
  // よろこびの ぴょん
  const cheer = during(t, OPEN_FROM + 0.1, STEP, 0.2) + during(t, STEP_END, INK + 0.2, 0.2)
  const hop = Math.abs(wave(t, 0.62)) * 2.6 * cheer

  const mood: Mood = t < NOTICE ? 'sad' : t < CLICK + 0.1 ? 'hope' : 'happy'
  const slump = mood === 'sad' && t > STOP ? 1 : 0
  const headTilt = mood === 'sad' ? slump * (-5 + wave(t, 1.4) * 2) : mood === 'hope' ? 3 : wave(t, 0.62) * 5 * cheer

  // かぎを もつ うで(右): かぎ穴まで のばす。あけたあと うれしくて 上へ
  const lift = span(t, LIFT, LIFT + 0.8, easeInOut)
  const up = span(t, OPEN_FROM + 0.1, OPEN_FROM + 0.5, easeOut)
  const rightArm: ArmPose = { swing: 8 + step * 22 + 74 * lift + 70 * up + wave(t, 0.62) * 8 * cheer, bend: 10 + 4 * lift - 20 * up }
  const leftArm: ArmPose = { swing: 8 - step * 22 + 150 * up + wave(t, 0.62, 0.3) * 8 * cheer, bend: 10 - 18 * up }

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Gate t={t} open={open} />
        <Click t={t} />
        {/* ひらいた もんから こぼれる 光 */}
        <ellipse cx={GATE_X} cy="94" rx={13 * open} ry="2.6" fill="#fff0a8" opacity={0.75 * open} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.2)}>
          <ellipse cx={x} cy={FEET_Y + 0.4} rx="8.8" ry="2" fill="#000000" opacity="0.12" />
          <Layer x={x} y={FEET_Y - hop} scale={GIRL_SCALE}>
            <Girl step={step} mood={mood} rightArm={rightArm} leftArm={leftArm} headTilt={headTilt} />
            <Sigh t={t} />
            <Notice t={t} />
            <Hearts t={t} />
          </Layer>
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
    { at: 0, label: 'もんが 立つ', sound: 'pop' },
    { at: WALK, label: 'しょんぼりした 女の子が あるいてくる' },
    { at: NOTICE, label: 'かぎ を もっていたと 気づく', sound: 'pop' },
    { at: CLICK, label: 'かぎ穴に さす。かちっ', sound: 'pop' },
    { at: OPEN_FROM, label: '2まいの とびらが ぱたんと ひらく' },
    { at: STEP, label: 'よろこんで もんの 前へ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '門 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
