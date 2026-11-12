/*
 * 休(やすむ): 人が 木に もたれて ひとやすみ。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … あたまの てっぺんの はねた かみ から、かた を通って、まえに のばした うで
 *                  (さいごに「うーん」と のびを したときだけ、うで が この線に重なる)
 *   2画目(丨)  … 人の どう と あし
 *   3画目(一)  … 木の よこに のびた 大きな えだ
 *   4画目(丨)  … 木の みき
 *   5・6画目   … 左右に たれた えだ
 *
 * ながれ
 *   木が そだつ → つかれた人が あるいてくる → くるっと むきを変えて 木に もたれる
 *   → ぐうぐう ひとやすみ(小鳥が とまる・葉が おちる)
 *   → 目をさまして まっすぐ立ち、うーんと のびを する → ほね が ひかって、絵が うすくなり、字「休」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。あるくときは ふり、やすむときは だらんと下げる。
 *   字の形になるのは、のびを した さいごの しゅんかん だけ。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '休'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#4f9be0'
const TUNIC_DARK = '#3c82c4'
const TUNIC_FAR = '#33709f'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'

/** くぎり の時間(秒) */
const WALK = 0.9
const TURN = 2.7
const LEAN = 3.0
const REST = 3.6
/** 目をさまして、のびを しはじめる */
const WAKE = 5.1
const INK = 5.8
const DONE = 8.4
const DURATION = 9

/** 人の 足もと(もたれるときの じく)と、かた(うでを ふる じく) */
const FEET: readonly [number, number] = [27.5, 94]
const SHOULDER: readonly [number, number] = [25.4, 40]
/** 1画目の 書きおわり(のびを したときの 手先) */
const HAND_GOAL: readonly [number, number] = [10.5, 60.3]
/** にのうで・うでさき の長さ(のびを すると、かた から 1画目の書きおわりに ちょうど とどく) */
const ARM_PART = Math.hypot(HAND_GOAL[0] - SHOULDER[0], HAND_GOAL[1] - SHOULDER[1]) / 2
/** のびを したときの うで の角度(ま下から、まえへ 何度か) */
const STRETCH = (Math.atan2(SHOULDER[0] - HAND_GOAL[0], HAND_GOAL[1] - SHOULDER[1]) * 180) / Math.PI
const NECK: readonly [number, number] = [28, 35]
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
      {/* とおくの おか と、ゆっくり ながれる 雲(おくゆき を出す) */}
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="-4" cy="46" rx="7" ry="3.4" />
        <ellipse cx="1" cy="44" rx="5" ry="3.4" />
        <ellipse cx="94" cy="52" rx="6" ry="2.8" />
        <ellipse cx="98.5" cy="50.4" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 46, 82, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

function Tree({ t }: SceneProps) {
  // みき が下から のびて、えだ が ひろがり、さいごに 葉が ぽん と しげる
  const trunk = span(t, 0, 0.55, backOut)
  const boughs = span(t, 0.3, 0.75, backOut)
  const leaves = span(t, 0.5, 1.0, backOut)
  const sway = wave(t, 3.4) * 1.3
  return (
    <>
      <ellipse cx="63" cy="97.6" rx={20 * trunk} ry="3" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.6 + 0.4 * trunk} scaleY={trunk} origin={[62.5, 96]}>
        <path d="M53.5 97 Q59.5 91 58.6 83 L67.4 83 Q67 91 73 97 Z" fill={BARK} />
        <Bone char={CHAR} n={4} color={BARK} width={9.5} />
        <path d="M60.6 52 q1.6 5 0 11 M65.2 66 q-1.4 5 0.2 10" fill="none" stroke={BARK_DARK} strokeWidth="1.3" strokeLinecap="round" />
      </Layer>
      <Layer scale={boughs} origin={[63, 38]}>
        <Bone char={CHAR} n={3} color={BARK} width={6.2} />
        <Bone char={CHAR} n={5} color={BARK} width={5.6} />
        <Bone char={CHAR} n={6} color={BARK} width={5.6} />
      </Layer>
      {/* えだの先の 小さな しげみ */}
      <Layer scale={leaves} origin={[63, 38]} rotate={sway * 0.6}>
        <circle cx="96.5" cy="76.5" r="7" fill={LEAF_DARK} />
        <circle cx="94" cy="73" r="5" fill={LEAF} />
        <circle cx="37.5" cy="80" r="5.4" fill={LEAF_DARK} />
        <circle cx="39.5" cy="77" r="4" fill={LEAF} />
      </Layer>
      {/* 上の しげみ: 風で ゆっくり ゆれる */}
      <Layer scale={leaves} rotate={sway} origin={[63, 36]}>
        <circle cx="44" cy="23" r="14.5" fill={LEAF_DARK} />
        <circle cx="83" cy="22" r="14.5" fill={LEAF_DARK} />
        <circle cx="63" cy="15" r="17.5" fill={LEAF_DARK} />
        <circle cx="39" cy="37" r="6.4" fill={LEAF_DARK} />
        <circle cx="91" cy="34.5" r="6.4" fill={LEAF_DARK} />
        <circle cx="53" cy="25" r="12.5" fill={LEAF} />
        <circle cx="73.5" cy="25" r="12.5" fill={LEAF} />
        <circle cx="63" cy="20" r="13.5" fill={LEAF} />
        <circle cx="56" cy="13.5" r="5.2" fill={LEAF_LIGHT} />
        <circle cx="76" cy="16.5" r="3.8" fill={LEAF_LIGHT} />
        <circle cx="48" cy="29" r="2.3" fill="#e8534a" />
        <circle cx="79" cy="29.5" r="2.3" fill="#e8534a" />
      </Layer>
    </>
  )
}

type Mood = 'tired' | 'relieved' | 'asleep'

/** うで の かっこう。swing = ま下から まえへ ふった角度 / bend = ひじ の まがり(まえへ) */
type ArmPose = { readonly swing: number; readonly bend: number }

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。 */
function Arm({ pose, color }: { readonly pose: ArmPose; readonly color: string }) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  // 体は 左むき。まえ = 左(x が へる ほう)
  const elbow = [SHOULDER[0] - Math.sin(rad(pose.swing)) * ARM_PART, SHOULDER[1] + Math.cos(rad(pose.swing)) * ARM_PART] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] - Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART] as const
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="6.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.6" fill={SKIN} />
    </>
  )
}

type PersonProps = {
  readonly step: number
  readonly mood: Mood
  /** てまえの うで・むこうの うで */
  readonly nearArm: ArmPose
  readonly farArm: ArmPose
  readonly headTilt: number
  readonly breath: number
}

function Person({ step, mood, nearArm, farArm, headTilt, breath }: PersonProps) {
  return (
    <>
      {/* むこうの うで: 体の うしろに かくれる */}
      <Arm pose={farArm} color={TUNIC_FAR} />
      {/* うしろの足・まえの足(あるくとき、かわりばんこに ふる) */}
      <Layer rotate={step * 17} origin={[30, 68]}>
        <rect x="27.2" y="65" width="6.2" height="27.5" rx="3.1" fill={PANTS_DARK} />
        <ellipse cx="28.6" cy="93.4" rx="5.2" ry="2.8" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 17} origin={[25, 68]}>
        <rect x="21.6" y="65" width="6.2" height="27.5" rx="3.1" fill={PANTS} />
        <ellipse cx="23" cy="93.4" rx="5.2" ry="2.8" fill={SHOE} />
      </Layer>
      {/* くび: どう と あたま の間を、みじかく つなぐ(どう と あたま に かくれて、すきまだけ 見える) */}
      <rect x="24.8" y="32" width="5.2" height="8" rx="2.4" fill={SKIN_SHADE} />
      {/* どう: ねむると、いきに合わせて 少し ふくらむ */}
      <Layer scaleX={1 + breath * 0.05} scaleY={1 + breath * 0.02} origin={[27.4, 70]}>
        <rect x="20.4" y="36.6" width="14" height="34" rx="6.8" fill={TUNIC} />
        <path d="M22.4 62.5 h10" stroke={TUNIC_DARK} strokeWidth="1.6" strokeLinecap="round" />
      </Layer>
      {/* てまえの うで: のびを すると、1画目の線に重なる */}
      <Arm pose={nearArm} color={TUNIC_DARK} />
      {/* あたま */}
      <Layer rotate={headTilt} origin={NECK}>
        <g transform="translate(-1.4 0.6)">
          <circle cx="30.2" cy="24.6" r="9.2" fill={SKIN} />
          <path d="M21.5 23 C21.4 13.8 31.8 11.2 37.8 17 C40.2 20.2 40.2 26 38.2 30.2 C37.6 24.4 33.4 20.2 26.6 20.6 C24.4 20.8 22.6 21.8 21.5 23 Z" fill={HAIR} />
          <circle cx="26.5" cy="28.8" r="2.1" fill="#ff9d9d" opacity="0.55" />
          {mood === 'tired' ? (
            <>
              <path d="M23.6 23.8 l3 1.2" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="25.4" cy="25.6" r="1.15" fill="#2b2b2b" />
              <ellipse cx="24.6" cy="30.2" rx="1.3" ry="1.7" fill="#b9483f" />
            </>
          ) : (
            <>
              <path d="M23.8 24.9 Q25.4 26.6 27 24.9" fill="none" stroke="#2b2b2b" strokeWidth="1.25" strokeLinecap="round" />
              {mood === 'asleep' ? (
                <ellipse cx="24.4" cy="30" rx="1" ry="1.1" fill="#b9483f" />
              ) : (
                <path d="M23 29.4 Q24.8 31.5 26.8 29.9" fill="none" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
              )}
            </>
          )}
        </g>
        {/* 1画目の 書きはじめ: ぴょこんと はねた かみ */}
        <path d="M32.4 17.6 Q33.2 14.4 35 16.5 Q36.2 13.8 37 16.9" fill="none" stroke={HAIR} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </Layer>
    </>
  )
}

/** あるいている間の あせ。うしろ(左)へ とぶ。 */
function Sweat({ t }: SceneProps) {
  const show = during(t, WALK + 0.2, TURN, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.45].map((offset) => {
        const p = ((t + offset) % 0.9) / 0.9
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" transform={`translate(${20 - p * 9} ${17 + p * 7 - Math.sin(p * Math.PI) * 5}) rotate(-35)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** ひとやすみ の「ぐうぐう」。あたまの上から 左上へ のぼる。 */
function Snore({ t }: SceneProps) {
  const show = during(t, REST + 0.1, WAKE + 0.1, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show} fill="#5f7fd6" fontWeight="700" fontFamily="inherit">
      {[0, 0.6, 1.2].map((offset, i) => {
        const p = ((t - REST + offset) % 1.8) / 1.8
        return (
          <text key={offset} x={30 - p * 13 + Math.sin(p * 7) * 1.4} y={13 - p * 13} fontSize={4.2 + i * 1.4 + p * 2.2} opacity={Math.sin(p * Math.PI)}>
            z
          </text>
        )
      })}
    </g>
  )
}

/** もたれた しゅんかんの「ふう」。 */
function Sigh({ t }: SceneProps) {
  const show = during(t, LEAN + 0.15, REST + 0.35, 0.2)
  if (show <= 0) return null
  const p = span(t, LEAN + 0.15, REST + 0.35, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={18 - p * 9} cy={30 - p * 5} rx={3 + p * 2.6} ry={2 + p * 1.6} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
      <ellipse cx={22.5 - p * 6} cy={31.4 - p * 2} rx={1.5 + p} ry={1.1 + p * 0.6} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
    </g>
  )
}

/** ひとやすみ の間に、小鳥が とんできて、えだ に とまる。ちゅんちゅん と うたう。 */
function Bird({ t }: SceneProps) {
  const arrive = span(t, REST + 0.2, REST + 1.1, easeOut)
  if (arrive <= 0) return null
  // 右上から、ゆるい山なり で おりてくる
  const x = 118 - arrive * 30
  const y = 8 + arrive * 23.4 - Math.sin(arrive * Math.PI) * 9
  const landed = arrive >= 1
  const hop = landed ? Math.abs(wave(t, 0.7)) * 0.9 : 0
  const flap = landed ? 0 : wave(t, 0.16) * 28
  const note = during(t, REST + 1.3, WAKE, 0.25)
  return (
    <>
      <Layer x={x} y={y - hop}>
        <path d="M2.6 0.4 l4.6 -1.6 l-3.4 3.2 Z" fill="#e2733f" />
        <ellipse cx="0" cy="0" rx="4" ry="3.1" fill="#ff9a5c" />
        <circle cx="-3" cy="-2.3" r="2.3" fill="#ff9a5c" />
        <path d="M-5 -2.4 l-2.4 0.7 l2.3 0.9 Z" fill="#f2b632" />
        <circle cx="-3.6" cy="-2.8" r="0.55" fill="#2b2b2b" />
        <Layer rotate={flap} origin={[0.4, -0.6]}>
          <path d="M-1.2 -0.8 Q1.6 -3.8 4 -0.6 Q1.6 0.8 -1.2 -0.8 Z" fill="#e2733f" />
        </Layer>
      </Layer>
      <g opacity={note} fill="#f07f9e">
        <path d={`M${80 - wave(t, 1.2) * 1.2} ${22 - ((t * 5) % 6)} v-4.4 l2.6 -0.8 v4.2`} fill="none" stroke="#f07f9e" strokeWidth="0.8" />
        <ellipse cx={79.2 - wave(t, 1.2) * 1.2} cy={22 - ((t * 5) % 6)} rx="1.1" ry="0.8" />
        <ellipse cx={81.8 - wave(t, 1.2) * 1.2} cy={21.2 - ((t * 5) % 6)} rx="1.1" ry="0.8" />
      </g>
    </>
  )
}

/** ひとやすみ の間に、葉が1まい ひらひら おちてくる。 */
function FallingLeaf({ t }: SceneProps) {
  const p = span(t, REST + 0.3, INK - 0.1)
  if (p <= 0) return null
  const x = 76 - p * 22 + Math.sin(p * 9) * 5
  const y = 36 + p * 58
  return <path d="M0 -3.4 Q3 0 0 3.4 Q-3 0 0 -3.4 Z" fill={LEAF_LIGHT} stroke={LEAF_DARK} strokeWidth="0.5" transform={`translate(${x} ${y}) rotate(${Math.sin(p * 9) * 50 + 20})`} />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  // あるく: 左から 木の そばまで。あしを ふって、体が 上下する
  const walking = 1 - span(t, TURN - 0.25, TURN)
  const stride = t < WALK ? 0 : Math.sin((t - WALK) * Math.PI * 2 * 1.7) * walking
  const walkX = mix(t, WALK, TURN, -50, 0, easeOut)
  const bob = -Math.abs(stride) * 1.5
  // むきを変える: 木に せなかを むける(左右を ひっくり返す)
  const facing = mix(t, TURN, LEAN, -1, 1)
  // もたれる: 足もとを じく に、木のほうへ かたむく。字になるときに まっすぐ もどる
  // 目をさます: 字になる 少し前に まっすぐ立って、うーんと のびを する
  // (ほね が ひかるときには、人の形が 字と重なっている)
  const wake = span(t, WAKE, INK - 0.1, easeInOut)
  const lean = mix(t, LEAN, REST - 0.1, 0, 9, backOut) * (1 - span(t, WAKE, WAKE + 0.45))
  const asleep = t >= REST && t < WAKE
  const breath = asleep ? wave(t - REST, 1.8) : 0
  const mood: Mood = t < TURN ? 'tired' : asleep ? 'asleep' : 'relieved'
  // うで: あるくときは 足と ぎゃくに ふる。立っているときは、おもさで ま下に たれる
  // (体が かたむいても、うで は ま下を むく)。さいごに、てまえの うで を まえへ のばす
  const hanging = 3 - lean
  const nearArm: ArmPose = t < TURN ? { swing: stride * 26, bend: 16 } : { swing: hanging + (STRETCH - hanging) * wake, bend: 8 * (1 - wake) }
  const farArm: ArmPose = t < TURN ? { swing: -stride * 26, bend: 16 } : { swing: hanging, bend: 8 }
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Tree t={t} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <ellipse cx={27.5 + walkX} cy="97.4" rx="9" ry="2.4" fill="#000000" opacity="0.12" />
          <Layer x={walkX + lean * 0.22} y={bob} rotate={lean} origin={FEET}>
            <Layer scaleX={facing} origin={[27.5, 60]}>
              <Person step={stride} mood={mood} nearArm={nearArm} farArm={farArm} headTilt={t < TURN ? -5 + stride * 2 : asleep ? 5 + breath * 1.5 : 2 - wake * 6} breath={breath} />
            </Layer>
            <Sweat t={t} />
          </Layer>
          <Sigh t={t} />
          <Snore t={t} />
        </Layer>
        <Bird t={t} />
        <FallingLeaf t={t} />
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
    { at: 0, label: '木が そだつ', sound: 'pop' },
    { at: WALK, label: 'つかれた人が あるいてくる' },
    { at: LEAN, label: '木に もたれる', sound: 'pop' },
    { at: REST, label: 'ぐうぐう ひとやすみ。小鳥が とまる' },
    { at: WAKE, label: '目をさまして、うーんと のびを する' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '休 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
