/*
 * 自(みずから・じぶん): 「だれが?」と きかれて、自分の はなを ゆびさす。
 *
 * ほね(画と絵の対応)
 *   字は「はな」の形。人は じぶんを さすとき、はな を ゆびさす。
 *   絵は 字と ぴったり重ねず、かお・むね・うで の あたりに だいたい そろえる。
 *   (人の体を ゆがめると 字より そちらに 目が いくので、重なりより 形の正しさを とる)
 *   1画目(ノ)   … あたまの上の「?」「!」の あたり
 *   2〜6画目    … 子の かお・どう の たて と、ふくらんだ 3本の よこ(まゆ・目・くち・おなか の あたり)
 *
 * ながれ
 *   子が 草はらに ひとり → ともだちが あるいてきて「だれが やるの?」と きく
 *   → 子は「えっ、だれ?」と まわりを きょろきょろ(まよう)
 *   → ぴん!と ひらめく。「ぼくだ!」と、手を あげて じぶんの はなを ゆびさす(うれしい)
 *   → ともだちも にっこり。はな が きらりと ひかり、ほね が ひかって、絵が うすくなり 字「自」になる
 *
 * 人は、ほんものの つくり を守る:
 *   うで は かた から出て ひじ で まがる。くび は みじかく、どう の まんなか の上。
 *   手を はなに のばすとき、ひじ は 外へ ひらく。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '自'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const HAIR_FRIEND = '#3b2a20'
const TUNIC = '#4f9be0'
const TUNIC_DARK = '#3c82c4'
const TUNIC_FRIEND = '#f08a4b'
const TUNIC_FRIEND_DARK = '#d6713a'
const PANTS = '#3e5c86'
const PANTS_FRIEND = '#6a8f4e'
const SHOE = '#6b4a36'
const LEAF = '#55b86e'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const BUBBLE = '#ffffff'
const BUBBLE_EDGE = '#c9d6e6'

/** くぎり の時間(秒) */
const ARRIVE = 1.0
/** ともだちが「だれが やるの?」と きく */
const ASK = 2.3
/** ぴん!と ひらめく */
const AHA = 4.2
/** 手を あげて、はなを ゆびさす */
const POINT = 4.4
const INK = 6.4
const DONE = 9.6
const DURATION = 10.3

type Point = readonly [number, number]

/** 子の 足もと・かた・はな・ゆびさきが とどく場所 */
const KID_X = 50
const KID_FEET = 94
const KID_SHOULDER_NEAR: Point = [59.5, 74]
const KID_SHOULDER_FAR: Point = [40.5, 74]
const NOSE: Point = [50, 54.8]
const KID_HAND_GOAL: Point = [57, 57]
const FRIEND_X = 92

/** かた と 手 の 場所から、ひじ の場所を求める。upper・fore は うでの 2つの ぶぶんの長さ。side で 外/内。 */
function elbowOf(shoulder: Point, hand: Point, upper: number, fore: number, side: 1 | -1): Point {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const reach = Math.min(Math.hypot(dx, dy), upper + fore - 0.05)
  const ux = dx / Math.max(reach, 0.001)
  const uy = dy / Math.max(reach, 0.001)
  const along = (upper * upper - fore * fore + reach * reach) / (2 * reach)
  const out = Math.sqrt(Math.max(0, upper * upper - along * along))
  return [shoulder[0] + ux * along - uy * out * side, shoulder[1] + uy * along + ux * out * side]
}

type ArmProps = {
  readonly shoulder: Point
  readonly hand: Point
  readonly upper: number
  readonly fore: number
  readonly side: 1 | -1
  readonly color: string
  readonly width: number
  readonly handRadius: number
}

/** かた → ひじ → 手 と つながる うで。 */
function Arm({ shoulder, hand, upper, fore, side, color, width, handRadius }: ArmProps) {
  const elbow = elbowOf(shoulder, hand, upper, fore, side)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r={handRadius} fill={SKIN} />
    </>
  )
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
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 93 V101 H-4 Z" fill="#e2f2d2" />
      {/* ゆっくり ながれる 雲 */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="22" cy="14" rx="7" ry="3.2" />
        <ellipse cx="27" cy="12.2" rx="5" ry="3.2" />
        <ellipse cx="86" cy="12" rx="6" ry="2.8" />
        <ellipse cx="90.5" cy="10.4" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 30, 72, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

type KidMood = 'puzzled' | 'aha' | 'happy'

type KidProps = {
  readonly mood: KidMood
  /** きょろきょろ 見る むき(-1 = 左 〜 1 = 右) */
  readonly look: number
  readonly headTilt: number
  /** てまえの うで(画面の右)が はなへ のびた度合い 0〜1 */
  readonly raise: number
  readonly wiggle: number
}

/** 正面を むいた子(主役)。 */
function Kid({ mood, look, headTilt, raise, wiggle }: KidProps) {
  const restHand: Point = [KID_SHOULDER_NEAR[0] + 3.5, KID_SHOULDER_NEAR[1] + 21]
  const hand: Point = [mix(raise, 0, 1, restHand[0], KID_HAND_GOAL[0], (x) => x), mix(raise, 0, 1, restHand[1], KID_HAND_GOAL[1], (x) => x)]
  const farHand: Point = [KID_SHOULDER_FAR[0] - 3 + wiggle, KID_SHOULDER_FAR[1] + 21]
  const eyeShift = look * 1.6
  return (
    <>
      {/* あし */}
      <rect x="42.6" y="85" width="5.6" height="9" rx="2.8" fill={PANTS} />
      <rect x="51.8" y="85" width="5.6" height="9" rx="2.8" fill={PANTS} />
      <ellipse cx="44.2" cy="94" rx="4.6" ry="2.4" fill={SHOE} />
      <ellipse cx="55.8" cy="94" rx="4.6" ry="2.4" fill={SHOE} />
      {/* くび: どう の まんなか の上に、みじかく */}
      <rect x="46.8" y="64" width="6.4" height="9" rx="2.6" fill={SKIN_SHADE} />
      {/* どう */}
      <rect x="38.6" y="69" width="22.8" height="19" rx="7.5" fill={TUNIC} />
      <path d="M41 83 h18" stroke={TUNIC_DARK} strokeWidth="1.4" strokeLinecap="round" />
      {/* むこうの うで: だらんと 下げる */}
      <Arm shoulder={KID_SHOULDER_FAR} hand={farHand} upper={11} fore={11} side={1} color={TUNIC_DARK} width={5.6} handRadius={3} />
      {/* あたま */}
      <Layer rotate={headTilt} origin={[50, 66]}>
        <circle cx="33.2" cy="52" r="3.2" fill={SKIN} />
        <circle cx="66.8" cy="52" r="3.2" fill={SKIN} />
        <circle cx="50" cy="50" r="17" fill={SKIN} />
        <path d="M32.6 49 C30.4 29.5 69.6 29.5 67.4 49 C65 41.6 58.6 38.6 50 38.6 C41.4 38.6 35 41.6 32.6 49 Z" fill={HAIR} />
        <circle cx="39.6" cy="56.4" r="2.6" fill={CHEEK} opacity="0.55" />
        <circle cx="60.4" cy="56.4" r="2.6" fill={CHEEK} opacity="0.55" />
        {/* 目 と まゆ */}
        <g transform={`translate(${eyeShift} 0)`}>
          {mood === 'happy' ? (
            <>
              <path d="M41.2 50.4 Q44 46.8 46.8 50.4" fill="none" stroke={EYE} strokeWidth="1.4" strokeLinecap="round" />
              <path d="M53.2 50.4 Q56 46.8 58.8 50.4" fill="none" stroke={EYE} strokeWidth="1.4" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="44" cy="49.6" r={mood === 'aha' ? 2.3 : 1.8} fill={EYE} />
              <circle cx="56" cy="49.6" r={mood === 'aha' ? 2.3 : 1.8} fill={EYE} />
              {mood === 'aha' && (
                <>
                  <circle cx="44.7" cy="48.8" r="0.7" fill="#ffffff" />
                  <circle cx="56.7" cy="48.8" r="0.7" fill="#ffffff" />
                </>
              )}
            </>
          )}
        </g>
        {mood === 'puzzled' ? (
          <>
            <path d="M40.6 44.6 L47 43.4" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
            <path d="M53 42.6 L59.4 45" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M41 44.2 Q44 42.4 47 43.6" fill="none" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
            <path d="M53 43.6 Q56 42.4 59 44.2" fill="none" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          </>
        )}
        {/* はな: 顔の まんなか。ゆびさす 先 */}
        <ellipse cx={NOSE[0]} cy={NOSE[1]} rx="2.7" ry="2.3" fill={SKIN_SHADE} />
        <circle cx={NOSE[0] - 0.9} cy={NOSE[1] - 0.8} r="0.8" fill="#ffffff" opacity="0.7" />
        {/* くち */}
        {mood === 'puzzled' && <path d="M46.6 61.2 q1.6 -1.4 3.2 0 t3.2 0" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />}
        {mood === 'aha' && <ellipse cx="50" cy="61.2" rx="1.7" ry="2.1" fill={MOUTH} />}
        {mood === 'happy' && (
          <>
            <path d="M44.6 59.4 Q50 66.6 55.4 59.4 Z" fill={MOUTH} />
            <path d="M47 62.6 Q50 61 53 62.6 Q50 65 47 62.6 Z" fill="#ff8a8a" />
          </>
        )}
      </Layer>
      {/* てまえの うで: はなを ゆびさす(手が かおの 前に 来るので、あたま の あとに かく) */}
      <Arm shoulder={KID_SHOULDER_NEAR} hand={hand} upper={11} fore={11} side={1} color={TUNIC_DARK} width={5.6} handRadius={3} />
      {raise > 0.85 && <path d={`M${hand[0]} ${hand[1]} L${hand[0] - 4.4} ${hand[1] - 1.6}`} stroke={SKIN} strokeWidth="2.6" strokeLinecap="round" />}
    </>
  )
}

type FriendProps = {
  readonly x: number
  readonly step: number
  readonly asking: boolean
  readonly happy: boolean
  readonly bob: number
}

/** ともだち(右がわ)。子の ほうを むいて、いっしょに うれしがる。 */
function Friend({ x, step, asking, happy, bob }: FriendProps) {
  const shoulderNear: Point = [x - 5, 77]
  const shoulderFar: Point = [x + 5, 77]
  // きくとき: 子の ほうへ 手を さしだす。うれしいとき: 手を あげる
  const handNear: Point = asking ? [x - 13, 72.5] : happy ? [x - 8.5, 67] : [x - 6.2, 89]
  const handFar: Point = happy ? [x + 8.5, 67] : [x + 6.2, 89]
  return (
    <Layer y={-bob}>
      <Layer rotate={step * 14} origin={[x - 2, 86]}>
        <rect x={x - 5} y="85" width="4.6" height="8.6" rx="2.3" fill={PANTS_FRIEND} />
        <ellipse cx={x - 3.2} cy="93.8" rx="3.8" ry="2" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 14} origin={[x + 2, 86]}>
        <rect x={x + 0.4} y="85" width="4.6" height="8.6" rx="2.3" fill={PANTS_FRIEND} />
        <ellipse cx={x + 3.2} cy="93.8" rx="3.8" ry="2" fill={SHOE} />
      </Layer>
      <rect x={x - 2.4} y="70" width="4.8" height="6" rx="2" fill={SKIN_SHADE} />
      <Arm shoulder={shoulderFar} hand={handFar} upper={6.5} fore={6.5} side={-1} color={TUNIC_FRIEND_DARK} width={4.4} handRadius={2.4} />
      <rect x={x - 7} y="74" width="14" height="14" rx="5.5" fill={TUNIC_FRIEND} />
      <Arm shoulder={shoulderNear} hand={handNear} upper={6.5} fore={6.5} side={-1} color={TUNIC_FRIEND_DARK} width={4.4} handRadius={2.4} />
      {/* あたま(子の ほうを むく) */}
      <circle cx={x} cy="64" r="8.6" fill={SKIN} />
      <path d={`M${x - 8.8} 62.6 C${x - 9.6} 52.6 ${x + 9.6} 52.6 ${x + 8.8} 62.6 C${x + 6} 58 ${x - 4} 57.4 ${x - 8.8} 62.6 Z`} fill={HAIR_FRIEND} />
      <circle cx={x - 5} cy="66.6" r="1.7" fill={CHEEK} opacity="0.55" />
      {happy ? (
        <>
          <path d={`M${x - 5.4} 63.4 Q${x - 3.8} 61.2 ${x - 2.2} 63.4`} fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d={`M${x + 1.4} 63.4 Q${x + 3} 61.2 ${x + 4.6} 63.4`} fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d={`M${x - 4.4} 67.2 Q${x - 1} 71.2 ${x + 2.4} 67.2 Z`} fill={MOUTH} />
        </>
      ) : (
        <>
          <circle cx={x - 4} cy="63.4" r="1.3" fill={EYE} />
          <circle cx={x + 2.6} cy="63.4" r="1.3" fill={EYE} />
          {asking ? <ellipse cx={x - 1.4} cy="68.2" rx="1.2" ry="1.5" fill={MOUTH} /> : <path d={`M${x - 3} 68 q1.6 1.2 3.2 0`} fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />}
        </>
      )}
    </Layer>
  )
}

/** 「?」の しるし(線だけ) */
function QuestionMark({ color }: { readonly color: string }) {
  return (
    <>
      <path d="M-2.8 -2.4 Q-2.8 -5.4 0 -5.4 Q2.8 -5.4 2.8 -2.8 Q2.8 -1 0 0.2 V1.6" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="0" cy="4.2" r="1" fill={color} />
    </>
  )
}

/** 「!」の しるし */
function ExclaimMark({ color }: { readonly color: string }) {
  return (
    <>
      <path d="M0 -5.2 V0.8" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="0" cy="4" r="1.05" fill={color} />
    </>
  )
}

/** ともだちの「だれが やるの?」ふきだし。ともだちの あたまの上。 */
function AskBubble({ t, x }: { readonly t: number; readonly x: number }) {
  const show = during(t, ASK, AHA + 0.2, 0.25)
  if (show <= 0) return null
  const pop = backOut(span(t, ASK, ASK + 0.35))
  return (
    <Layer opacity={show} scale={pop} origin={[x, 52]}>
      <path d={`M${x - 2.6} 46.6 L${x} 53 L${x + 3.4} 46.6 Z`} fill={BUBBLE} stroke={BUBBLE_EDGE} strokeWidth="0.7" strokeLinejoin="round" />
      <ellipse cx={x} cy="40" rx="9" ry="7.4" fill={BUBBLE} stroke={BUBBLE_EDGE} strokeWidth="0.7" />
      <path d={`M${x - 3.2} 45.9 L${x} 52 L${x + 3.8} 45.9 Z`} fill={BUBBLE} />
      <g transform={`translate(${x} 40)`}>
        <QuestionMark color="#5f7fd6" />
      </g>
    </Layer>
  )
}

/** 子の あたまの上: まよう「?」→ ひらめく「!」 */
function ThinkBubble({ t }: { readonly t: number }) {
  const thinking = during(t, ASK + 0.5, AHA + 0.05, 0.25)
  const aha = during(t, AHA, POINT + 1.3, 0.2)
  const sway = wave(t, 0.9) * 1.2
  return (
    <>
      {thinking > 0 && (
        <Layer opacity={thinking} scale={backOut(span(t, ASK + 0.5, ASK + 0.85))} origin={[KID_X, 24]} rotate={sway}>
          <circle cx="47" cy="33.4" r="1.2" fill={BUBBLE} stroke={BUBBLE_EDGE} strokeWidth="0.5" />
          <circle cx="47.4" cy="29.8" r="1.8" fill={BUBBLE} stroke={BUBBLE_EDGE} strokeWidth="0.5" />
          <ellipse cx={KID_X} cy="22" rx="8" ry="6.6" fill={BUBBLE} stroke={BUBBLE_EDGE} strokeWidth="0.7" />
          <g transform={`translate(${KID_X} 22)`}>
            <QuestionMark color="#5f7fd6" />
          </g>
        </Layer>
      )}
      {aha > 0 && (
        <Layer opacity={aha} scale={backOut(span(t, AHA, AHA + 0.3))} origin={[KID_X, 24]}>
          <ellipse cx={KID_X} cy="22" rx="8" ry="6.6" fill="#fff3b8" stroke="#f2c94c" strokeWidth="0.8" />
          <g transform={`translate(${KID_X} 22)`}>
            <ExclaimMark color="#e8842a" />
          </g>
          {/* ひらめきの ぴかぴか */}
          {[-1, 1].map((dir) => (
            <path key={dir} d={`M${KID_X + dir * 11} 17 l${dir * 2.6} -2.2 M${KID_X + dir * 12} 22 l${dir * 3.2} 0`} stroke="#f2c94c" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          ))}
        </Layer>
      )}
    </>
  )
}

/** はなが きらりと ひかる わっか(ゆびさした はなを 目立たせる) */
function NoseRing({ t }: { readonly t: number }) {
  const show = during(t, POINT + 0.8, INK + 0.2, 0.25)
  if (show <= 0) return null
  const pulse = (wave(t, 0.7) + 1) / 2
  return (
    <g opacity={show * (0.55 + pulse * 0.35)}>
      <circle cx={NOSE[0]} cy={NOSE[1]} r={5 + pulse * 1.6} fill="none" stroke="#ffd24a" strokeWidth="1.1" />
      <path d={`M${NOSE[0] - 7.6} ${NOSE[1] - 5.8} l-2 -2 M${NOSE[0] + 7.6} ${NOSE[1] - 5.8} l2 -2`} stroke="#ffd24a" strokeWidth="1.1" strokeLinecap="round" />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  // 子: ぽん と出て、きょろきょろ まよい、ひらめいて、はなを ゆびさす
  const kidPop = backOut(span(t, 0, 0.5))
  const puzzled = during(t, ASK + 0.5, AHA, 0.2)
  const look = t > ASK + 0.5 && t < AHA ? Math.sin((t - ASK - 0.5) * 3.2) : 0
  const mood: KidMood = t < AHA ? 'puzzled' : t < POINT + 0.6 ? 'aha' : 'happy'
  const raise = span(t, POINT, POINT + 0.8, easeInOut)
  const headTilt = t < AHA ? puzzled * 7 * Math.sin((t - ASK) * 2.2) : mix(t, AHA, POINT + 0.6, -3, 0)
  // ひらめいた しゅんかん ぴょんと はねる / うれしくて 少し ゆれる
  const hop = Math.sin(span(t, AHA, AHA + 0.45) * Math.PI) * 3.2
  const joy = t > POINT + 0.8 ? Math.abs(wave(t, 0.8)) * 0.8 : 0

  // ともだち: 右から あるいてきて、まって、うれしがる
  const walking = 1 - span(t, ARRIVE - 0.25, ARRIVE)
  const stride = t < 0.2 ? 0 : Math.sin((t - 0.2) * Math.PI * 2 * 1.7) * walking
  const friendX = mix(t, 0.2, ARRIVE, 36, 0, easeOut)
  const friendHappy = t >= POINT + 0.4
  const friendBob = friendHappy ? Math.abs(wave(t, 0.7)) * 1.6 : Math.abs(stride) * 1.2

  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <ellipse cx={KID_X} cy="97.4" rx="12" ry="2.4" fill="#000000" opacity="0.12" />
        <Layer scale={kidPop} origin={[KID_X, KID_FEET]}>
          <Layer y={-hop - joy}>
            <Kid mood={mood} look={look} headTilt={headTilt} raise={raise} wiggle={0} />
          </Layer>
        </Layer>
        <Layer x={friendX} opacity={span(t, 0.2, 0.45)}>
          <ellipse cx={FRIEND_X} cy="97.4" rx="8" ry="2" fill="#000000" opacity="0.12" />
        </Layer>
        <Layer x={friendX}>
          <Friend x={FRIEND_X} step={stride} asking={t >= ASK && t < AHA + 0.4} happy={friendHappy} bob={friendBob} />
        </Layer>
        <AskBubble t={t} x={FRIEND_X + friendX} />
        <ThinkBubble t={t} />
        <NoseRing t={t} />
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
    { at: 0, label: '草はらに 子が ひとり', sound: 'pop' },
    { at: ARRIVE, label: 'ともだちが あるいてくる' },
    { at: ASK, label: '「だれが やるの?」ときかれて、子は まよう', sound: 'pop' },
    { at: AHA, label: 'ぴん!と ひらめく', sound: 'pop' },
    { at: POINT, label: '「ぼくだ!」と じぶんの はなを ゆびさす' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '自 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
