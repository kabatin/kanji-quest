/*
 * 古(ふるい): むかしの はなしが、くちから くちへ、10回 つたわった。ふるい はなし。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … むらの「はなしの はた」の よこぼう(10本の リボンを むすぶ)
 *   2画目(丨)  … はた の たてぼう(上に はたが ひらひら)
 *   3・4・5画目 … 井戸(いど)の いしの わく。上から見ると 井戸は「口」の かたち
 *                  (井戸ばたで おしゃべり、は むかしの むらの ふつうの けしき)
 *
 * ながれ
 *   はたと 井戸が できる → おばあさんが あるいてくる → バケツを もった 女の子も やってくる
 *   (女の子は つかれて たいくつ)
 *   → おばあさんが むかしばなしを はじめる。ふきだしが 口から 口へ とんでいく
 *   → 女の子は びっくり → おもしろくて、こんどは 女の子が おばあさんに はなしかえす
 *   → ふきだしが 1つ とどくたびに、はた に リボンが 1本ずつ ふえて、10本
 *   → 女の子は うれしくて とびはねる → ほね が ひかって、絵が うすくなり、字「古」が のこる
 *
 * 人は、ほんものの つくり を守る(字に合わせて ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく、あたま は どう の まんなかの 上。
 *   井戸の わく と はたの ぼうは、本来 その形の もの なので Bone で 画の線を そのまま使う。
 */
import { backOut, during, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '古'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR_GIRL = '#5a3b2a'
const HAIR_OLD = '#d9d9de'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const STONE = '#b9b3a6'
const STONE_DARK = '#9a9486'
const WATER = '#5aaee8'
const WATER_LIGHT = '#bfe4fa'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const FLAG = '#e8534a'
const GRANNY_DRESS = '#9a6fc4'
const GRANNY_APRON = '#f4efe6'
const GIRL_DRESS = '#ff8fa3'
const PANTS_LEG = '#f8cfa6'
const SHOE = '#6b4a36'
const BUCKET = '#c98a4b'
const BUCKET_DARK = '#a96d34'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'

/** くぎり の時間(秒) */
const GRANNY_IN = 0.4
const GIRL_IN = 0.9
const TELL = 2.2
/** ふきだし 1つ の 間かく と、とんでいる 時間 */
const STEP = 0.38
const FLY = 0.3
const COUNT = 10
const INK = 6.4
const DONE = 9.0
const DURATION = 9.6

const startOf = (i: number) => TELL + i * STEP
const arriveOf = (i: number) => startOf(i) + FLY
const WOW_AT = arriveOf(0)
const HAPPY_AT = arriveOf(5)

/** 地面 */
const GROUND_Y = 96
/** にんげん の 大きさ(ローカル座標の 高さ 48 を これで ちぢめる) */
const PERSON_SCALE = 0.9
const GRANNY_X = 15
const GIRL_X = 95
/** 口の たかさ(ふきだし が とぶ たかさ)と、2人の 口の よこの 位置 */
const MOUTH_Y = 62
const GRANNY_MOUTH_X = 21
const GIRL_MOUTH_X = 88

/** 1画目の よこぼう の 高さ(x の所) */
const barY = (x: number) => 43.3 - (x - 11.3) * 0.044

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
        <ellipse cx="82" cy="20" rx="7" ry="3.2" />
        <ellipse cx="87" cy="18" rx="5" ry="3.2" />
        <ellipse cx="14" cy="30" rx="6" ry="2.8" />
        <ellipse cx="18.5" cy="28.6" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 47, 84, 101].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** はなしの はた: たてぼう(2画目)と よこぼう(1画目)。上に はた が ひらひら。 */
function Pole({ t }: SceneProps) {
  const up = span(t, 0, 0.7, backOut)
  const cross = span(t, 0.3, 0.9, backOut)
  const flutter = wave(t, 1.1) * 5
  return (
    <>
      <Layer scaleY={up} origin={[54.5, 66]}>
        <Bone char={CHAR} n={2} color={BARK} width={4.6} />
        <Layer rotate={flutter} origin={[55.5, 17]}>
          <path d="M56 13 L68.5 16.8 L56 20.6 Z" fill={FLAG} />
        </Layer>
      </Layer>
      <Layer scaleX={cross} origin={[54.5, 41]}>
        <Bone char={CHAR} n={1} color={BARK} width={4.2} />
        <Bone char={CHAR} n={1} color={BARK_DARK} width={1} opacity={0.35} />
      </Layer>
    </>
  )
}

/** 井戸: 上から見ると 四角い いし の わく(3・4・5画目)。中に 水。 */
function Well({ t }: SceneProps) {
  const grow = span(t, 0.05, 0.65, backOut)
  const shimmer = wave(t, 1.6)
  return (
    <Layer scale={grow} origin={[56, 97]}>
      <path d="M33.8 69.4 L77 67.6 L75 91 L37.6 93.4 Z" fill={WATER} />
      <ellipse cx={52 + shimmer * 3} cy="79" rx="6" ry="1.2" fill={WATER_LIGHT} opacity="0.8" />
      <ellipse cx={66 - shimmer * 2} cy="85" rx="4" ry="0.9" fill={WATER_LIGHT} opacity="0.6" />
      <Bone char={CHAR} n={3} color={STONE} width={6} />
      <Bone char={CHAR} n={4} color={STONE} width={6} />
      <Bone char={CHAR} n={5} color={STONE_DARK} width={6} />
    </Layer>
  )
}

const RIBBON_COLORS = ['#e8534a', '#4f9be0', '#ffd24a', '#55b86e', '#c77ad8'] as const

/** ふきだしが 1つ とどくたびに、よこぼう に リボンが 1本 むすばれる */
function Ribbons({ t }: SceneProps) {
  return (
    <>
      {Array.from({ length: COUNT }, (_, i) => {
        const at = arriveOf(i)
        const pop = span(t, at, at + 0.3, backOut)
        if (pop <= 0) return null
        // よこぼう の 左から 右へ ならべる(たてぼう の すぐ よこは さける)
        const x = 17 + i * 8.3 + (i >= 5 ? 1 : 0)
        const y = barY(x)
        const flash = t >= at && t < at + 0.35 ? Math.sin(span(t, at, at + 0.35) * Math.PI) * 3.4 : 0
        return (
          <g key={i}>
            <Layer x={x} y={y + 1.2} scale={pop} rotate={wave(t, 1.6, i * 0.4) * 6} origin={[0, 0]}>
              <circle cx="0" cy="0" r="1.8" fill={RIBBON_COLORS[i % RIBBON_COLORS.length]} />
              <path d="M-1.6 0.4 H1.6 V6.4 L0 4.9 L-1.6 6.4 Z" fill={RIBBON_COLORS[i % RIBBON_COLORS.length]} />
            </Layer>
            {flash > 0 && <Star cx={x} cy={y - 4} r={flash} color="#ffd95a" spin={t * 200} />}
          </g>
        )
      })}
    </>
  )
}

type Mood = 'calm' | 'bored' | 'wow' | 'happy'
type Kind = 'granny' | 'girl'

/** うで の かっこう。swing = ま下から まえへ ふった角度 / bend = ひじ の まがり(まえへ) */
type ArmPose = { readonly swing: number; readonly bend: number }

const SHOULDER_Y = -31
const ARM_PART = 7.8
const rad = (deg: number) => (deg * Math.PI) / 180

/** かた(0, -31)→ ひじ → 手 の 3つの点 */
function armPoints(pose: ArmPose) {
  const elbow = [Math.sin(rad(pose.swing)) * ARM_PART, SHOULDER_Y + Math.cos(rad(pose.swing)) * ARM_PART] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] + Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART] as const
  return { elbow, hand }
}

/** かた から出て、ひじ で まがる うで。 */
function Arm({ pose, color }: { readonly pose: ArmPose; readonly color: string }) {
  const { elbow, hand } = armPoints(pose)
  return (
    <>
      <path d={`M0 ${SHOULDER_Y} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.6" fill={SKIN} />
    </>
  )
}

/** あたま(顔)。右むき。目と口で 気持ちを見せる。 */
function Face({ mood, mouth }: { readonly mood: Mood; readonly mouth: number }) {
  return (
    <>
      <circle cx="4" cy="-38.8" r="1.6" fill="#ff9d9d" opacity="0.55" />
      {mood === 'wow' && (
        <>
          <path d="M1.8 -46 Q3.8 -47.6 5.8 -46" fill="none" stroke={EYE} strokeWidth="0.9" strokeLinecap="round" />
          <circle cx="3.9" cy="-42.2" r="2.1" fill="#ffffff" stroke={EYE} strokeWidth="0.7" />
          <circle cx="4.3" cy="-42.2" r="1.1" fill={EYE} />
        </>
      )}
      {mood === 'happy' && <path d="M2.2 -41.6 Q3.9 -44.2 5.6 -41.6" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />}
      {mood === 'calm' && <circle cx="3.9" cy="-42" r="1.2" fill={EYE} />}
      {mood === 'bored' && (
        <>
          <path d="M2.2 -42 Q3.9 -40.4 5.6 -42" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mouth > 0.05 ? (
        <ellipse cx="5" cy="-37.4" rx={1.1 + mouth * 0.5} ry={0.5 + mouth * 1.6} fill={MOUTH} />
      ) : mood === 'bored' ? (
        <path d="M3.6 -36.8 h2.8" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
      ) : (
        <path d="M3.2 -37.7 Q5 -35.8 6.6 -37.7" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
      )}
    </>
  )
}

type PersonProps = {
  readonly kind: Kind
  readonly step: number
  readonly mood: Mood
  readonly mouth: number
  readonly nearArm: ArmPose
  readonly farArm: ArmPose
  /** あたまを まえに かたむける角度(うなずき) */
  readonly nod: number
}

/** 人: 足もと が (0, 0)、右むき。むきは 外の Layer の scaleX で ひっくり返す。 */
function Person({ kind, step, mood, mouth, nearArm, farArm, nod }: PersonProps) {
  const girl = kind === 'girl'
  const hair = girl ? HAIR_GIRL : HAIR_OLD
  const dress = girl ? GIRL_DRESS : GRANNY_DRESS
  const sleeve = girl ? '#ff7893' : '#8460ae'
  const farSleeve = girl ? '#e0687f' : '#74529c'
  const bucketHand = armPoints(nearArm).hand
  return (
    <>
      <Arm pose={farArm} color={farSleeve} />
      {/* あし: こしから。あるくとき かわりばんこに ふる */}
      <Layer rotate={step * 17} origin={[1.4, -13]}>
        <rect x="-0.8" y="-14" width="4.2" height="13.5" rx="2.1" fill={PANTS_LEG} />
        <ellipse cx="2.2" cy="-0.8" rx="3.8" ry="1.9" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 17} origin={[-1.4, -13]}>
        <rect x="-3.6" y="-14" width="4.2" height="13.5" rx="2.1" fill={PANTS_LEG} />
        <ellipse cx="-1" cy="-0.8" rx="3.8" ry="1.9" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう と あたま の間 */}
      <rect x="-1.8" y="-37" width="3.6" height="6" rx="1.6" fill={SKIN_SHADE} />
      {/* どう(わたしの ふく) */}
      <path d="M-5.4 -33.5 Q0 -35.6 5.4 -33.5 L8.2 -11.5 Q0 -10 -8.2 -11.5 Z" fill={dress} />
      {!girl && <path d="M-4 -26 H4 L5.8 -12 Q0 -11 -5.8 -12 Z" fill={GRANNY_APRON} />}
      <Arm pose={nearArm} color={sleeve} />
      {/* あたま */}
      <Layer rotate={nod} origin={[0, -35]}>
        <circle cx="-1" cy="-41.2" r="7.4" fill={hair} />
        {!girl && <circle cx="-4" cy="-48" r="3.4" fill={hair} />}
        {girl && (
          <>
            <circle cx="-7" cy="-38" r="3" fill={hair} />
            <circle cx="-6.6" cy="-41.6" r="1.5" fill={SUN} />
          </>
        )}
        <circle cx="0.8" cy="-40.8" r="7.2" fill={SKIN} />
        <path d="M-5.6 -42.5 Q0 -51.5 7.2 -43 Q3 -46.4 -0.5 -45.4 Q-3.4 -44.6 -5.6 -42.5 Z" fill={hair} />
        <Face mood={mood} mouth={mouth} />
      </Layer>
      {/* バケツ(女の子の てまえの 手に さげる) */}
      {girl && (
        <g>
          <path d={`M${bucketHand[0] - 3.2} ${bucketHand[1] + 3.2} Q${bucketHand[0]} ${bucketHand[1] - 2.2} ${bucketHand[0] + 3.2} ${bucketHand[1] + 3.2}`} fill="none" stroke={BUCKET_DARK} strokeWidth="0.8" />
          <path d={`M${bucketHand[0] - 4} ${bucketHand[1] + 3} H${bucketHand[0] + 4} L${bucketHand[0] + 3} ${bucketHand[1] + 9.4} H${bucketHand[0] - 3} Z`} fill={BUCKET} />
          <rect x={bucketHand[0] - 4} y={bucketHand[1] + 3} width="8" height="1.5" rx="0.7" fill={BUCKET_DARK} />
        </g>
      )}
    </>
  )
}

/** 口から 口へ とぶ ふきだし(お話)。 */
function Bubble({ t, index }: SceneProps & { readonly index: number }) {
  const s = startOf(index)
  if (t < s || t > s + FLY + 0.14) return null
  const grannyToGirl = index % 2 === 0
  const p = span(t, s, s + FLY)
  const from = grannyToGirl ? GRANNY_MOUTH_X : GIRL_MOUTH_X
  const to = grannyToGirl ? GIRL_MOUTH_X : GRANNY_MOUTH_X
  const x = from + (to - from) * p
  const y = MOUTH_Y - Math.sin(p * Math.PI) * 5
  const fade = 1 - span(t, s + FLY, s + FLY + 0.14)
  const pop = span(t, s, s + 0.1, backOut)
  return (
    <Layer x={x} y={y} scale={pop} opacity={fade}>
      <path d={`M${grannyToGirl ? -3 : 3} 2.6 l${grannyToGirl ? -2.2 : 2.2} 2.2 l${grannyToGirl ? 4 : -4} -0.9 Z`} fill="#ffffff" />
      <ellipse cx="0" cy="0" rx="4.8" ry="3.7" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
      <circle cx="-2" cy="0" r="0.85" fill="#f07f9e" />
      <circle cx="0" cy="0" r="0.85" fill="#5aaee8" />
      <circle cx="2" cy="0" r="0.85" fill="#ffc233" />
    </Layer>
  )
}

/** ふたりの 話す あいだ、口が ぱくぱく ひらく大きさ */
function talking(t: number, parity: number): number {
  const open = Array.from({ length: COUNT }, (_, i) => i)
    .filter((i) => i % 2 === parity)
    .reduce((best, i) => Math.max(best, during(t, startOf(i) - 0.04, startOf(i) + 0.26, 0.06)), 0)
  return open * (0.55 + 0.45 * Math.abs(Math.sin(t * 22)))
}

/** 手ぶり(話す人)の つよさ: 0 = おろす / 1 = ぜんぶ ひらく */
function gesturing(t: number, parity: number): number {
  return Array.from({ length: COUNT }, (_, i) => i)
    .filter((i) => i % 2 === parity)
    .reduce((best, i) => Math.max(best, during(t, startOf(i) - 0.1, startOf(i) + 0.4, 0.12)), 0)
}

/** 話を きいた しゅんかん の うなずき(度) */
function nodding(t: number, parity: number): number {
  return Array.from({ length: COUNT }, (_, i) => i)
    .filter((i) => i % 2 === parity)
    .reduce((sum, i) => sum + Math.sin(span(t, arriveOf(i), arriveOf(i) + 0.28) * Math.PI) * (t >= arriveOf(i) && t < arriveOf(i) + 0.28 ? 6 : 0), 0)
}

function Granny({ t }: SceneProps) {
  const x = mix(t, GRANNY_IN, GRANNY_IN + 0.9, -18, GRANNY_X, easeOut)
  const walking = t < GRANNY_IN ? 0 : 1 - span(t, GRANNY_IN + 0.7, GRANNY_IN + 0.9)
  const stride = Math.sin((t - GRANNY_IN) * Math.PI * 2 * 2) * walking
  // 話すのは 偶数ばんめ(おばあさん → 女の子)。きくのは 奇数ばんめ。
  const talk = gesturing(t, 0)
  const near: ArmPose = walking > 0 ? { swing: stride * 22 + 4, bend: 10 } : { swing: 6 + talk * (28 + wave(t, STEP) * 6), bend: 8 + talk * 50 }
  const far: ArmPose = walking > 0 ? { swing: -stride * 22, bend: 10 } : { swing: 5, bend: 8 }
  return (
    <Layer x={x} y={GROUND_Y} scaleX={PERSON_SCALE} scaleY={PERSON_SCALE}>
      <Person kind="granny" step={stride} mood={t >= TELL - 0.1 ? 'happy' : 'calm'} mouth={talking(t, 0)} nearArm={near} farArm={far} nod={nodding(t, 1)} />
    </Layer>
  )
}

function Girl({ t }: SceneProps) {
  const x = mix(t, GIRL_IN, GIRL_IN + 1.1, 128, GIRL_X, easeOut)
  const walking = t < GIRL_IN ? 0 : 1 - span(t, GIRL_IN + 0.9, GIRL_IN + 1.1)
  const stride = Math.sin((t - GIRL_IN) * Math.PI * 2 * 1.8) * walking
  const mood: Mood = t < WOW_AT ? 'bored' : t < HAPPY_AT ? 'wow' : 'happy'
  const happy = t >= HAPPY_AT
  // うれしくて とびはねる(うで も あげる)
  const hop = happy && t < INK - 0.2 ? Math.abs(wave(t, 0.5)) * 1.8 : 0
  const cheer = span(t, HAPPY_AT, HAPPY_AT + 0.4)
  const talk = gesturing(t, 1)
  const near: ArmPose = walking > 0 ? { swing: stride * 18 + 6, bend: 6 } : { swing: 8, bend: 6 }
  const farIdle: ArmPose = walking > 0 ? { swing: -stride * 20, bend: 10 } : { swing: 6 + talk * 24, bend: 8 + talk * 40 }
  const far: ArmPose = { swing: farIdle.swing + (115 - farIdle.swing) * cheer, bend: farIdle.bend + (20 - farIdle.bend) * cheer }
  // たいくつなときは あたまを 少し さげる
  const nod = (t < WOW_AT ? 6 : 0) + nodding(t, 0)
  return (
    <>
      <ellipse cx={x} cy="97.4" rx="8" ry="2.2" fill="#000000" opacity="0.12" />
      <Layer x={x} y={GROUND_Y - hop} scaleX={-PERSON_SCALE} scaleY={PERSON_SCALE}>
        <Person kind="girl" step={stride} mood={mood} mouth={talking(t, 1)} nearArm={near} farArm={far} nod={nod} />
      </Layer>
    </>
  )
}

/** つかれて たいくつな 女の子の「ふう」。話が はじまる まえ。 */
function Sigh({ t }: SceneProps) {
  const show = during(t, GIRL_IN + 1.1, WOW_AT, 0.2)
  if (show <= 0) return null
  const p = span(t, GIRL_IN + 1.1, WOW_AT, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={90 - p * 5} cy={55 - p * 4} rx={2.4 + p * 1.6} ry={1.6 + p * 1.1} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <ellipse cx={93 - p * 3} cy={57 - p * 2} rx={1.2 + p * 0.6} ry={0.9 + p * 0.4} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
    </g>
  )
}

/** はたの よこぼう に とまって、話を きいている 小鳥。 */
function Bird({ t }: SceneProps) {
  const arrive = span(t, 3.0, 3.7, easeOut)
  if (arrive <= 0) return null
  const x = 128 - arrive * 40
  const y = 12 + arrive * 25 - Math.sin(arrive * Math.PI) * 8
  const landed = arrive >= 1
  const hop = landed ? Math.abs(wave(t, 0.7)) * 0.8 : 0
  const flap = landed ? 0 : wave(t, 0.16) * 28
  return (
    <Layer x={x} y={y - hop}>
      <path d="M2.6 0.4 l4.6 -1.6 l-3.4 3.2 Z" fill="#e2733f" />
      <ellipse cx="0" cy="0" rx="4" ry="3.1" fill="#ff9a5c" />
      <circle cx="-3" cy="-2.3" r="2.3" fill="#ff9a5c" />
      <path d="M-5 -2.4 l-2.4 0.7 l2.3 0.9 Z" fill="#f2b632" />
      <circle cx="-3.6" cy="-2.8" r="0.55" fill={EYE} />
      <Layer rotate={flap} origin={[0.4, -0.6]}>
        <path d="M-1.2 -0.8 Q1.6 -3.8 4 -0.6 Q1.6 0.8 -1.2 -0.8 Z" fill="#e2733f" />
      </Layer>
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Pole t={t} />
        <Well t={t} />
        <Ribbons t={t} />
        <Bird t={t} />
        <Granny t={t} />
        <Girl t={t} />
        <Sigh t={t} />
        {Array.from({ length: COUNT }, (_, i) => (
          <Bubble key={i} t={t} index={i} />
        ))}
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
    { at: 0, label: 'はなしの はた と 井戸が できる', sound: 'pop' },
    { at: GIRL_IN, label: 'おばあさんと、バケツの 女の子が やってくる' },
    { at: TELL, label: 'おばあさんの むかしばなし。口から 口へ', sound: 'pop' },
    { at: WOW_AT + 0.6, label: 'とどくたびに リボンが ふえる。女の子は びっくり' },
    { at: HAPPY_AT, label: '10回 つたわって、女の子は とびはねる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '古 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
