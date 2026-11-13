/*
 * 年(とし): みのった いねを 人が かついで あるく。いねが みのると いちねん。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … (この絵では 使わない。左うえ の すきまに、きらきら だけ おく)
 *   2画目(一)  … 人の すげがさ の つば
 *   3画目(一)  … 人の かた に のせた にない ぼう(てんびん ぼう)
 *   4画目(丨)  … 左の いね束 を ぼう から つるす なわ
 *   5画目(一)  … 左の いね束 の しばり なわ → 人の こし の おび → 右の いね束 の しばり なわ
 *   6画目(丨)  … 人の ふく の あわせめ(まんなか) と、りょう足の あいだ
 *
 * ながれ
 *   はたけの いねは まだ みどり。農家の子は 「まだかな」と しんぱい そうに まっている
 *   → いねが 金色に みのって、ほが おもたく たれる。子は びっくり → 大よろこびで ぴょん
 *   → 刈りとって、いね束(たば) を ぼう の りょうはし に つるし、かたに のせる
 *   → にこにこ して いね束を かついで あるく(はたけが うしろへ ながれる・すずめが とぶ)
 *   → ぴたっと 立つと、ほね が ひかって、絵が うすくなり、字「年」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   くび は みじかく、うで は かた から出て ひじ で まがる。ぼうを かつぐときは、
 *   りょうほうの ひじ を まげて、手で ぼう を にぎる。
 *   字に 重なるのは、かついで 立った さいごの しゅんかん の だいたいの 場所だけ。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '年'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#4f9be0'
const TUNIC_DARK = '#3c82c4'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const SASH = '#c0502f'
const HAT = '#e6c27a'
const HAT_DARK = '#cf9f55'
const POLE = '#8c5b3c'
const ROPE = '#a67c52'
const STRAW = '#e9bf55'
const STRAW_DARK = '#c9962f'
const STRAW_LIGHT = '#f4d77a'
const GREEN = '#55b86e'
const GREEN_LIGHT = '#8bd69a'
const GOLD = '#e8b94a'
const GOLD_LIGHT = '#f6d36e'
const BLADE_DRY = '#c9b55a'
const GRASS = '#c5e8a9'
const HILL = '#e2f2d2'
const SUN = '#ffd24a'

/** くぎり の時間(秒) */
/** いねが 金色に なりはじめる〜なりおわる */
const GOLD_FROM = 1.4
const GOLD_TO = 2.5
/** びっくり → よろこびの ジャンプ */
const JUMP_FROM = 2.3
const JUMP_TO = 3.0
/** 刈りとり・いね束が ぽん・ぼうを かつぐ */
const CUT = 3.0
const WALK = 4.0
const INK = 6.4
const WALK_END = INK - 0.2
const DONE = 9.3
const DURATION = 9.8

/** 人の からだの 場所(まんなか x = 58 は 6画目の線) */
const CENTER_X = 58
const SHOULDER_L: readonly [number, number] = [51, 42]
const SHOULDER_R: readonly [number, number] = [65, 42]
/** うで の ほねの 長さ(かた→ひじ、ひじ→手)。どの ポーズでも かわらない */
const UPPER = 11
const FORE = 10.5
const GROUND_Y = 96

const lerp = (a: number, b: number, k: number) => a + (b - a) * k

const lerpColor = (a: string, b: string, k: number): string => {
  const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const [pa, pb] = [parse(a), parse(b)]
  const mixed = pa.map((v, i) => Math.round(lerp(v, pb[i], Math.min(Math.max(k, 0), 1))))
  return `#${mixed.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/* ───────── そら と はたけ ───────── */

function Sky({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 12} origin={[97, 12]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="96.2" y="1.2" width="1.6" height="3.6" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 97 12)`} />
        ))}
      </Layer>
      <circle cx="97" cy="12" r={5.4 * sun} fill={SUN} />
      {/* ゆっくり ながれる 雲 */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="14" cy="9" rx="7" ry="3.2" />
        <ellipse cx="19" cy="7.4" rx="5" ry="3.2" />
      </g>
      <path d="M-4 99 Q20 80 46 91 Q74 74 113 92 V101 H-4 Z" fill={HILL} />
      <ellipse cx="54.5" cy="98" rx="52" ry="5.6" fill={GRASS} />
    </>
  )
}

type PlantProps = {
  readonly x: number
  readonly height: number
  /** 0 = みどり / 1 = 金色 */
  readonly ripe: number
  /** 0 = ほが 上を むく / 1 = ほが おもたく たれる */
  readonly droop: number
  /** 刈りとられた度合い(1 = 切りかぶ) */
  readonly cut: number
  readonly sway: number
}

/** いね 1本。くき・葉・ほ。みのると 金色になって、ほが おもたく たれる。 */
function Plant({ x, height, ripe, droop, cut, sway }: PlantProps) {
  const h = height * (1 - 0.9 * cut)
  const topX = x + sway * 0.6
  const topY = GROUND_Y - h
  const stalk = lerpColor(GREEN, GOLD, ripe)
  const blade = lerpColor(GREEN, BLADE_DRY, ripe)
  const earColor = lerpColor(GREEN_LIGHT, GOLD_LIGHT, ripe)
  // ほ の むき: まっすぐ上 → みぎ下へ たれる(くきの さき から そのまま つながる)
  const end = [topX + lerp(0.6, 6.4, droop), topY + lerp(-6, 3, droop)] as const
  const ctrl = [topX + lerp(0.3, 4.4, droop), topY + lerp(-3, -4.4, droop)] as const
  return (
    <g>
      <path d={`M${x} ${GROUND_Y} Q${x + sway * 0.2} ${GROUND_Y - h * 0.5} ${topX} ${topY}`} fill="none" stroke={stalk} strokeWidth="1.5" strokeLinecap="round" />
      <path d={`M${x} ${GROUND_Y - 4} Q${x - 5} ${GROUND_Y - h * 0.5} ${x - 7} ${GROUND_Y - h * 0.46}`} fill="none" stroke={blade} strokeWidth="1.3" strokeLinecap="round" />
      <path d={`M${x} ${GROUND_Y - 7} Q${x + 4.5} ${GROUND_Y - h * 0.55} ${x + 7} ${GROUND_Y - h * 0.5}`} fill="none" stroke={blade} strokeWidth="1.2" strokeLinecap="round" />
      {cut < 1 ? <path d={`M${topX} ${topY} Q${ctrl[0]} ${ctrl[1]} ${end[0]} ${end[1]}`} fill="none" stroke={earColor} strokeWidth="2.7" strokeLinecap="round" opacity={1 - cut} /> : null}
    </g>
  )
}

const FIELD = Array.from({ length: 15 }, (_, i) => ({ x0: 4 + i * 8, height: 30 + ((i * 7) % 5) * 3, phase: i * 0.7 }))
const FIELD_WIDTH = 120

function Field({ t, scroll }: SceneProps & { readonly scroll: number }) {
  const grow = span(t, 0.2, 1.2, backOut)
  if (grow <= 0) return null
  const ripe = span(t, GOLD_FROM, GOLD_TO, easeInOut)
  const droop = span(t, GOLD_FROM + 0.2, GOLD_TO + 0.2, easeOut)
  const cut = span(t, CUT, CUT + 0.4, easeOut)
  return (
    <>
      {FIELD.map((plant) => {
        const x = ((((plant.x0 - scroll) % FIELD_WIDTH) + FIELD_WIDTH) % FIELD_WIDTH) - 6
        return <Plant key={plant.x0} x={x} height={plant.height * Math.max(grow, 0)} ripe={ripe} droop={droop} cut={cut} sway={wave(t, 2.6, plant.phase) * 1.2} />
      })}
    </>
  )
}

/* ───────── 人 ───────── */

type Mood = 'worry' | 'wow' | 'happy'

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <g>
      <circle cx="58" cy="30.2" r="6.4" fill={SKIN} />
      <circle cx="53.4" cy="32.2" r="1.5" fill="#ff9d9d" opacity="0.55" />
      <circle cx="62.6" cy="32.2" r="1.5" fill="#ff9d9d" opacity="0.55" />
      {mood === 'worry' ? (
        <>
          <path d="M53.4 27.9 l2.6 -0.9 M62.6 27.9 l-2.6 -0.9" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <circle cx="55.3" cy="30" r="1" fill="#2b2b2b" />
          <circle cx="60.7" cy="30" r="1" fill="#2b2b2b" />
          <path d="M56 34.2 Q58 33 60 34.2" fill="none" stroke="#b9483f" strokeWidth="1" strokeLinecap="round" />
        </>
      ) : mood === 'wow' ? (
        <>
          <circle cx="55.3" cy="30" r="1.5" fill="#2b2b2b" />
          <circle cx="60.7" cy="30" r="1.5" fill="#2b2b2b" />
          <circle cx="55.7" cy="29.5" r="0.45" fill="#ffffff" />
          <circle cx="61.1" cy="29.5" r="0.45" fill="#ffffff" />
          <ellipse cx="58" cy="34" rx="1.3" ry="1.6" fill="#b9483f" />
        </>
      ) : (
        <>
          <path d="M53.8 30.6 Q55.3 28.6 56.8 30.6 M59.2 30.6 Q60.7 28.6 62.2 30.6" fill="none" stroke="#2b2b2b" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M55.2 33.2 Q58 36.4 60.8 33.2 Z" fill="#b9483f" />
        </>
      )}
    </g>
  )
}

/** すげがさ。つば が 2画目の 線の ところ。 */
function Hat() {
  return (
    <g>
      <ellipse cx="58" cy="22.4" rx="21" ry="3.2" fill={HAT_DARK} />
      <path d="M38.5 22.2 Q58 4.5 77.5 22.2 Q58 25.4 38.5 22.2 Z" fill={HAT} />
      <path d="M50 17.6 Q58 12.4 66 17.6" fill="none" stroke={HAT_DARK} strokeWidth="0.9" strokeLinecap="round" />
    </g>
  )
}

type ArmAngles = { readonly upperL: number; readonly foreL: number; readonly upperR: number; readonly foreR: number }

/** ま下を 0度 として、体の そとがわ へ ひらく角度。 */
const ARMS_DOWN: ArmAngles = { upperL: 12, foreL: 6, upperR: 12, foreR: 6 }
const ARMS_UP: ArmAngles = { upperL: 125, foreL: 150, upperR: 125, foreR: 150 }
/** ぼうを にぎる: ひじ を そとへ まげて、手が ぼう の 下に とどく */
const ARMS_HOLD: ArmAngles = { upperL: 38, foreL: 140, upperR: 38, foreR: 155 }

const mixArms = (a: ArmAngles, b: ArmAngles, k: number): ArmAngles => ({
  upperL: lerp(a.upperL, b.upperL, k),
  foreL: lerp(a.foreL, b.foreL, k),
  upperR: lerp(a.upperR, b.upperR, k),
  foreR: lerp(a.foreR, b.foreR, k),
})

type Joints = { readonly elbow: readonly [number, number]; readonly hand: readonly [number, number] }

/** かた → ひじ → 手 を つなぐ。side: 左うで = -1 / 右うで = 1 */
function joints(shoulder: readonly [number, number], side: -1 | 1, upper: number, fore: number): Joints {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const elbow = [shoulder[0] + side * Math.sin(rad(upper)) * UPPER, shoulder[1] + Math.cos(rad(upper)) * UPPER] as const
  const hand = [elbow[0] + side * Math.sin(rad(fore)) * FORE, elbow[1] + Math.cos(rad(fore)) * FORE] as const
  return { elbow, hand }
}

function Sleeve({ shoulder, joint }: { readonly shoulder: readonly [number, number]; readonly joint: Joints }) {
  return <path d={`M${shoulder[0]} ${shoulder[1]} L${joint.elbow[0]} ${joint.elbow[1]} L${joint.hand[0]} ${joint.hand[1]}`} fill="none" stroke={TUNIC_DARK} strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
}

function Hand({ joint }: { readonly joint: Joints }) {
  return <circle cx={joint.hand[0]} cy={joint.hand[1]} r="2.4" fill={SKIN} />
}

/** 足。あるくとき かわりばんこに 上がる(lift)。まんなかの すきま が 6画目の線。 */
function Legs({ liftL, liftR }: { readonly liftL: number; readonly liftR: number }) {
  return (
    <>
      <g transform={`translate(0 ${-liftL})`}>
        <rect x="52" y="63" width="5.8" height="28.5" rx="2.9" fill={PANTS} />
        <ellipse cx="54.6" cy="93.2" rx="4" ry="2.2" fill={SHOE} />
      </g>
      <g transform={`translate(0 ${-liftR})`}>
        <rect x="58.8" y="63" width="5.8" height="28.5" rx="2.9" fill={PANTS_DARK} />
        <ellipse cx="61.4" cy="93.2" rx="4" ry="2.2" fill={SHOE} />
      </g>
    </>
  )
}

/* ───────── いね束 ───────── */

type SheafProps = {
  /** 束の まんなか x と、しばった ところの y */
  readonly cx: number
  readonly tieY: number
}

/** いね束。しばった ところから 下へ ひろがり、さきに 金色の ほが たれる。 */
function Sheaf({ cx, tieY }: SheafProps) {
  const bottom = tieY + 23.5
  return (
    <g>
      {[-2, -1, 0, 1, 2].map((k) => (
        <path key={k} d={`M${cx + k * 3} ${tieY} L${cx + k * 4.2} ${tieY - 5.5}`} stroke={STRAW_DARK} strokeWidth="1.3" strokeLinecap="round" />
      ))}
      <path d={`M${cx - 10} ${tieY} C${cx - 13} ${tieY + 6} ${cx - 14} ${tieY + 16} ${cx - 13.5} ${bottom} L${cx + 13.5} ${bottom} C${cx + 14} ${tieY + 16} ${cx + 13} ${tieY + 6} ${cx + 10} ${tieY} Z`} fill={STRAW} />
      <path d={`M${cx - 5} ${tieY + 3} V${bottom - 2} M${cx} ${tieY + 3} V${bottom - 1} M${cx + 5} ${tieY + 3} V${bottom - 2}`} stroke={STRAW_DARK} strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />
      {[-11, -5.5, 0, 5.5, 11].map((dx) => (
        <ellipse key={dx} cx={cx + dx} cy={bottom + 0.5} rx="2" ry="3.2" fill={STRAW_LIGHT} />
      ))}
    </g>
  )
}

/* ───────── にぎやかし ───────── */

/** はたけの 上を とぶ すずめ。左へ とんでいく。 */
function Sparrow({ t }: SceneProps) {
  const p = span(t, WALK + 0.2, WALK_END)
  if (p <= 0 || p >= 1) return null
  const x = 116 - p * 124
  const y = 13 + Math.sin(p * 7) * 3
  return (
    <Layer x={x} y={y}>
      <path d="M2.8 0.5 l4 -1.2 l-2.8 2.6 Z" fill="#8a5a36" />
      <ellipse cx="0" cy="0" rx="3.8" ry="2.7" fill="#b07a4a" />
      <circle cx="-2.8" cy="-1.6" r="2" fill="#b07a4a" />
      <path d="M-4.6 -1.8 l-2 0.6 l2 0.8 Z" fill="#f2b632" />
      <circle cx="-3.3" cy="-2.1" r="0.5" fill="#2b2b2b" />
      <Layer rotate={wave(t, 0.18) * 30} origin={[0.4, -0.6]}>
        <path d="M-1 -0.6 Q1.6 -4.6 4 -0.4 Q1.6 0.8 -1 -0.6 Z" fill="#8a5a36" />
      </Layer>
    </Layer>
  )
}

/** 刈りとった しゅんかん の きらきら */
function HarvestStars({ t }: SceneProps) {
  const p = span(t, CUT, CUT + 0.7)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p * p}>
      <Star cx={14} cy={74 - p * 8} r={3.2 * (1 - p * 0.3)} color="#ffd95a" spin={p * 160} />
      <Star cx={96} cy={78 - p * 8} r={3.2 * (1 - p * 0.3)} color="#ffffff" spin={p * 160} />
      <Star cx={40} cy={86 - p * 6} r={2.4 * (1 - p * 0.3)} color="#ff7a4d" spin={p * 160 + 40} />
      <Star cx={78} cy={88 - p * 6} r={2.4 * (1 - p * 0.3)} color="#ffd95a" spin={p * 160 + 80} />
    </g>
  )
}

/** じまんの「ふんふん」: 左上へ おんぷ が のぼる */
function Hum({ t }: SceneProps) {
  const show = during(t, WALK + 0.2, WALK_END, 0.3)
  if (show <= 0) return null
  const p = ((t - WALK) % 1.4) / 1.4
  const x = 30 - p * 6 + Math.sin(p * 6) * 1.2
  const y = 20 - p * 8
  return (
    <g opacity={show * Math.sin(p * Math.PI)} fill="#f07f9e">
      <path d={`M${x + 2.4} ${y} v-5 l2.8 -0.9 v4.6`} fill="none" stroke="#f07f9e" strokeWidth="0.9" strokeLinecap="round" />
      <ellipse cx={x + 1.2} cy={y} rx="1.5" ry="1.1" />
      <ellipse cx={x + 4} cy={y - 0.8} rx="1.5" ry="1.1" />
    </g>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  // 人: さいしょから 立っていて、ぽん と出る
  const appear = span(t, 0, 0.5, backOut)
  const mood: Mood = t < 1.8 ? 'worry' : t < JUMP_FROM ? 'wow' : 'happy'
  const jump = Math.sin(span(t, JUMP_FROM, JUMP_TO) * Math.PI) * 6

  // うで: ま下に たらす → ばんざい → ぼうを にぎる
  const raised = mixArms(ARMS_DOWN, ARMS_UP, span(t, JUMP_FROM, JUMP_FROM + 0.3, easeOut))
  const arms = mixArms(raised, ARMS_HOLD, span(t, CUT, CUT + 0.6, easeInOut))
  const left = joints(SHOULDER_L, -1, arms.upperL, arms.foreL)
  const right = joints(SHOULDER_R, 1, arms.upperR, arms.foreR)

  // あるく: 3歩ぶん。足が かわりばんこに 上がり、体が はずむ。はたけが 左へ ながれる
  const walking = span(t, WALK, WALK + 0.25) * (1 - span(t, WALK_END - 0.3, WALK_END))
  const stride = Math.sin((t - WALK) * Math.PI * 2 * 1.6) * walking
  const bob = -Math.abs(stride) * 1.4
  const scroll = span(t, WALK, WALK_END) * 36
  const sway = stride * 4 + wave(t, 1.6) * 0.8 * walking

  // いね束と ぼう: 刈りとったあとに ぽん と出る
  const carry = span(t, CUT + 0.5, CUT + 1.0, backOut)
  const pole = span(t, CUT + 0.1, CUT + 0.5, easeOut)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.05

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Field t={t} scroll={scroll} />
        <Sparrow t={t} />
        <HarvestStars t={t} />
        <ellipse cx={CENTER_X} cy="97" rx={14 * appear} ry="2.4" fill="#000000" opacity="0.12" />
        <Layer scale={Math.max(appear, 0)} origin={[CENTER_X, 94]}>
          <Layer y={bob - jump}>
            <Legs liftL={Math.max(stride, 0) * 3} liftR={Math.max(-stride, 0) * 3} />
            {/* いね束(左・右): ぼう から なわ で つるす。 */}
            {carry > 0 ? (
              <>
                <Layer scale={Math.max(carry, 0.001)} rotate={sway} origin={[34, 44.5]}>
                  <Bone char={CHAR} n={4} color={ROPE} width={1.3} />
                  <Sheaf cx={33} tieY={67} />
                  <Bone char={CHAR} n={5} color={ROPE} width={2.4} from={0.1} to={0.37} />
                </Layer>
                <Layer scale={Math.max(carry, 0.001)} rotate={sway} origin={[81, 41]}>
                  <path d="M81 41 L81.4 62.6" stroke={ROPE} strokeWidth="1.3" strokeLinecap="round" />
                  <Sheaf cx={82} tieY={63} />
                  <Bone char={CHAR} n={5} color={ROPE} width={2.4} from={0.7} to={0.97} />
                </Layer>
              </>
            ) : null}
            {/* どう・くび・こし の おび */}
            <rect x="55.8" y="34.6" width="4.4" height="5.4" rx="2" fill={SKIN_SHADE} />
            <rect x="50" y="37.5" width="16" height="30" rx="5" fill={TUNIC} />
            <Bone char={CHAR} n={6} color={PANTS_DARK} width={1} from={0.17} to={0.93} />
            <Bone char={CHAR} n={5} color={SASH} width={3} from={0.45} to={0.64} />
            <Face mood={mood} />
            <Hat />
            <Sleeve shoulder={SHOULDER_L} joint={left} />
            <Sleeve shoulder={SHOULDER_R} joint={right} />
            {/* にない ぼう: かた に のせて、りょうてで にぎる */}
            <Layer scaleX={Math.max(pole, 0.001)} origin={[55.5, 42]} opacity={pole}>
              <Bone char={CHAR} n={3} color={POLE} width={3.4} />
            </Layer>
            <Hand joint={left} />
            <Hand joint={right} />
          </Layer>
          <Hum t={t} />
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
    { at: 0, label: 'はたけの いねは まだ みどり。子は まっている', sound: 'pop' },
    { at: GOLD_FROM, label: 'いねが 金色に みのって、ほが たれる' },
    { at: JUMP_FROM, label: 'びっくり! 大よろこびで ぴょん', sound: 'pop' },
    { at: CUT, label: '刈りとって いね束を ぼうに つるし、かつぐ', sound: 'pop' },
    { at: WALK, label: 'にこにこ あるく。いちねん の みのり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '年 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
