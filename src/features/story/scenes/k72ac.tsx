/*
 * 犬(いぬ): いぬを よこから みた かたち。てん は ぴんと たった みみ。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … いぬの せなか(よこに のびた 体の うえの せん)
 *   2画目(ノ)  … うしろ足(こし から うしろへ ふんばる 足)
 *   3画目(乀)  … まえ足(かた から ほね に むかって のばす 足)
 *   4画目(丶)  … ぴんと たった みみ(あたまの上の とがった みみ)
 *
 * ながれ
 *   お日さまの下で いぬが ぐうぐう ねている(みみ は たれている)
 *   → ほねの おやつが とんできて ぽとん。 おとに きづいて「ぴんっ」と みみが たち、目が まんまるに
 *   → おきあがって しっぽを ふりふり。うれしそう
 *   → ぐっと かがんでから、ほね めがけて ジャンプ。 みみ・せなか・足 の かたち が 字「犬」に そろう
 *   → ほね が ひかって、絵が うすくなり、字「犬」が のこる
 *
 * いぬは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   体は よこに ながい。足は 4本。まえ足の ひじ は うしろへ、うしろ足の ひざ は まえへ まがる。
 *   しっぽ は おしり から。みみ は あたまの上。ねているときは みみ が たれる。
 *   字に なるのは、ジャンプで 足を のばした さいごの しゅんかん だけ(足は 字より 少し みじかい)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '犬'

const FUR = '#d9a066'
const FUR_DARK = '#b87d48'
const FUR_SPOT = '#c58b52'
const CREAM = '#f6e3c3'
const NOSE = '#3a2a22'
const COLLAR = '#e8534a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const TONGUE = '#ff8a8a'
const CHEEK = '#ff9d9d'
const TREAT = '#fff4d6'
const TREAT_SHADE = '#e8d3a3'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'

/** くぎり の時間(秒) */
const TOSS = 2.2
const LAND = 3.0
const PERK = 3.0
const RISE = 3.5
const CROUCH = 4.7
const JUMP = 5.3
const INK = 6.4
const DONE = 9.3
const DURATION = 10

/** ほねの おやつが おちている場所(地面の上) */
const TREAT_X = 98
const TREAT_Y = 93

/* ───────── いぬの かっこう ───────── */

/**
 * 体の かっこう。おしり(rx,ry)から むね(cx,cy)まで、太い線で 体を作る。
 * h = あたまの中心 / hn・hf = うしろ足(てまえ・むこう)の足先 / fn・ff = まえ足の足先
 * leg = 足の ひとふしの 長さ(かた・こし から ひざ まで)/ tail = しっぽの むき(度)
 */
const POSE_KEYS = ['rx', 'ry', 'cx', 'cy', 'hx', 'hy', 'headTilt', 'hnx', 'hny', 'hfx', 'hfy', 'fnx', 'fny', 'ffx', 'ffy', 'leg', 'tail'] as const
type PoseKey = (typeof POSE_KEYS)[number]
type Pose = Readonly<Record<PoseKey, number>>

/** ねている: 地面に はらを つけて、あたまを まえ足の上に のせる */
const LYING: Pose = { rx: 30, ry: 86, cx: 62, cy: 85, hx: 79, hy: 85.5, headTilt: 4, hnx: 46, hny: 95, hfx: 50, hfy: 95, fnx: 76, fny: 95, ffx: 79, ffy: 95, leg: 11, tail: 165 }
/** 立って ほねを 見ている */
const STAND: Pose = { rx: 27, ry: 60, cx: 70, cy: 58, hx: 80, hy: 44, headTilt: 10, hnx: 27, hny: 96, hfx: 37, hfy: 96, fnx: 68, fny: 96, ffx: 60, ffy: 96, leg: 18.5, tail: 215 }
/** かがんで ちからを ためる */
const CROUCHING: Pose = { rx: 26, ry: 68, cx: 68, cy: 67, hx: 79, hy: 56, headTilt: 14, hnx: 26, hny: 96, hfx: 35, hfy: 96, fnx: 66, fny: 96, ffx: 58, ffy: 96, leg: 18.5, tail: 215 }
/** ジャンプ: 字「犬」の かたち。せなか が 1画目、うしろ足 が 2画目、まえ足 が 3画目、みみ が 4画目 */
const LEAPING: Pose = { rx: 27, ry: 55.5, cx: 76, cy: 51.5, hx: 83, hy: 37, headTilt: 0, hnx: 17, hny: 92, hfx: 30, hfy: 88, fnx: 93, fny: 90, ffx: 84, ffy: 84, leg: 21.5, tail: 200 }

function mixPose(a: Pose, b: Pose, k: number): Pose {
  return Object.fromEntries(POSE_KEYS.map((key) => [key, a[key] + (b[key] - a[key]) * k])) as Pose
}

type Point = readonly [number, number]
type Mood = 'asleep' | 'alert' | 'happy'

/** 2つの ふし で できた 足。hip から paw へ のばす。bend が 1 なら ひざが うしろへ、-1 なら まえへ まがる。 */
function legJoints(hip: Point, paw: Point, length: number, bend: 1 | -1): { readonly knee: Point; readonly foot: Point } {
  const dx = paw[0] - hip[0]
  const dy = paw[1] - hip[1]
  const reach = Math.min(Math.hypot(dx, dy), length * 2 - 0.01)
  const ux = dx / (Math.hypot(dx, dy) || 1)
  const uy = dy / (Math.hypot(dx, dy) || 1)
  const along = reach / 2
  const side = Math.sqrt(Math.max(0, length * length - along * along)) * bend
  return {
    knee: [hip[0] + ux * along - uy * side, hip[1] + uy * along + ux * side],
    foot: [hip[0] + ux * reach, hip[1] + uy * reach],
  }
}

function Leg({ hip, paw, length, bend, color }: { readonly hip: Point; readonly paw: Point; readonly length: number; readonly bend: 1 | -1; readonly color: string }) {
  const { knee, foot } = legJoints(hip, paw, length, bend)
  return (
    <>
      <path d={`M${hip[0]} ${hip[1]} L${knee[0]} ${knee[1]} L${foot[0]} ${foot[1]}`} fill="none" stroke={color} strokeWidth="6.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={foot[0]} cy={foot[1]} r="3.1" fill={CREAM} />
    </>
  )
}

/** あたま(あたまの中心が 原点。かおは 右むき)。みみ は あたまの上、ねると たれる。 */
function Head({ mood, ear }: { readonly mood: Mood; readonly ear: number }) {
  return (
    <>
      <circle cx="0" cy="0" r="8.5" fill={FUR} />
      <ellipse cx="8.4" cy="3.2" rx="6.3" ry="4.6" fill={CREAM} />
      <circle cx="13.6" cy="1.4" r="1.9" fill={NOSE} />
      <circle cx="1.6" cy="4.6" r="1.8" fill={CHEEK} opacity="0.55" />
      {mood === 'asleep' && <path d="M2 -2.2 Q3.7 -0.4 5.4 -2.2" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />}
      {mood === 'alert' && (
        <>
          <circle cx="3.7" cy="-2.4" r="1.9" fill={EYE} />
          <circle cx="4.3" cy="-3" r="0.6" fill="#ffffff" />
        </>
      )}
      {mood === 'happy' && <path d="M1.8 -1.4 Q3.7 -4.4 5.6 -1.4" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />}
      {mood === 'happy' ? (
        <>
          <path d="M8 5.8 Q11.6 12.4 15 5.6 Z" fill={MOUTH} />
          <ellipse cx="11.7" cy="8.9" rx="2.3" ry="1.4" fill={TONGUE} />
        </>
      ) : (
        <path d="M8.6 6.4 Q11.2 7.8 13.6 6" fill="none" stroke={NOSE} strokeWidth="0.9" strokeLinecap="round" />
      )}
      {/* みみ: つけねを じく に、ぴんと立つ(0 度)から たれる(マイナス)まで */}
      <Layer rotate={ear} origin={[-4.7, -6.2]}>
        <path d="M-15.7 -16.7 Q-7.7 -14.1 -1.7 -9.4 L-7.7 -3 Q-12.5 -9 -15.7 -16.7 Z" fill={FUR_DARK} />
      </Layer>
    </>
  )
}

type DogProps = {
  readonly pose: Pose
  readonly mood: Mood
  readonly ear: number
  /** しっぽの ふり(度)・いきで ふくらむ 体の 太さ */
  readonly wag: number
  readonly breath: number
}

function Dog({ pose, mood, ear, wag, breath }: DogProps) {
  const rump: Point = [pose.rx, pose.ry]
  const chest: Point = [pose.cx, pose.cy]
  const head: Point = [pose.hx, pose.hy]
  const at = (f: number): Point => [rump[0] + (chest[0] - rump[0]) * f, rump[1] + (chest[1] - rump[1]) * f]
  const hip = at(0.12)
  const shoulder = at(0.9)
  const rad = ((pose.tail + wag) * Math.PI) / 180
  const tailTip: Point = [rump[0] + Math.cos(rad) * 17, rump[1] + Math.sin(rad) * 17]
  const tailMid: Point = [rump[0] + Math.cos(rad + 0.45) * 9, rump[1] + Math.sin(rad + 0.45) * 9]
  // くび かざり: くびの 線に 直角に
  const neck: Point = [chest[0] + (head[0] - chest[0]) * 0.5, chest[1] + (head[1] - chest[1]) * 0.5]
  const neckLen = Math.hypot(head[0] - chest[0], head[1] - chest[1]) || 1
  const nx = -(head[1] - chest[1]) / neckLen
  const ny = (head[0] - chest[0]) / neckLen
  const belly = [at(0.22), at(0.72)] as const
  const spot = at(0.3)
  return (
    <>
      {/* しっぽ: おしり から */}
      <path d={`M${rump[0]} ${rump[1]} Q${tailMid[0]} ${tailMid[1]} ${tailTip[0]} ${tailTip[1]}`} fill="none" stroke={FUR} strokeWidth="4.6" strokeLinecap="round" />
      <circle cx={tailTip[0]} cy={tailTip[1]} r="2.6" fill={CREAM} />
      {/* むこうがわの 足(こい色) */}
      <Leg hip={hip} paw={[pose.hfx, pose.hfy]} length={pose.leg} bend={-1} color={FUR_DARK} />
      <Leg hip={shoulder} paw={[pose.ffx, pose.ffy]} length={pose.leg} bend={1} color={FUR_DARK} />
      {/* どう と くび */}
      <path d={`M${rump[0]} ${rump[1]} L${chest[0]} ${chest[1]}`} fill="none" stroke={FUR} strokeWidth={18 + breath} strokeLinecap="round" />
      <path d={`M${chest[0]} ${chest[1]} L${head[0]} ${head[1]}`} fill="none" stroke={FUR} strokeWidth="11" strokeLinecap="round" />
      <path d={`M${belly[0][0]} ${belly[0][1] + 6.6} L${belly[1][0]} ${belly[1][1] + 6.6}`} fill="none" stroke={CREAM} strokeWidth="6" strokeLinecap="round" />
      <circle cx={spot[0]} cy={spot[1] - 3} r="4.6" fill={FUR_SPOT} />
      <path d={`M${neck[0] + nx * 5.8} ${neck[1] + ny * 5.8} L${neck[0] - nx * 5.8} ${neck[1] - ny * 5.8}`} stroke={COLLAR} strokeWidth="2.8" strokeLinecap="round" />
      {/* てまえがわの 足 */}
      <Leg hip={hip} paw={[pose.hnx, pose.hny]} length={pose.leg} bend={-1} color={FUR} />
      <Leg hip={shoulder} paw={[pose.fnx, pose.fny]} length={pose.leg} bend={1} color={FUR} />
      <Layer x={head[0]} y={head[1]} rotate={pose.headTilt}>
        <Head mood={mood} ear={ear} />
      </Layer>
    </>
  )
}

/* ───────── まわりの ようす ───────── */

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
      {/* とおくの おか と、ゆっくり ながれる 雲 */}
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

/** ほねの おやつ: 右から とんできて、地面に ぽとん と おちて、少し はずむ。 */
function Treat({ t }: SceneProps) {
  const p = span(t, TOSS, LAND)
  if (p <= 0) return null
  const x = 112 - (112 - TREAT_X) * p
  const fallY = TREAT_Y - 77 * (1 - p) ** 2
  const q = span(t, LAND, LAND + 0.5)
  const hop = Math.abs(Math.sin(q * Math.PI * 2)) * 3 * (1 - q)
  return (
    <Layer x={x} y={fallY - hop} rotate={p * 540}>
      <rect x="-6" y="-1.9" width="12" height="3.8" rx="1.8" fill={TREAT} />
      {[
        [-6.4, -2.4],
        [-6.4, 2.4],
        [6.4, -2.4],
        [6.4, 2.4],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.6" fill={TREAT} />
      ))}
      <path d="M-5 1.9 H5" stroke={TREAT_SHADE} strokeWidth="1" strokeLinecap="round" />
    </Layer>
  )
}

/** おちた しゅんかんの ほこり。 */
function Dust({ t }: SceneProps) {
  const p = span(t, LAND, LAND + 0.5, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p} fill="#ffffff" stroke="#d9e4d0" strokeWidth="0.5">
      <ellipse cx={TREAT_X - 8 - p * 4} cy={TREAT_Y + 3 - p * 2} rx={1.6 + p * 2.4} ry={1.2 + p * 1.6} />
      <ellipse cx={TREAT_X + 8 + p * 1} cy={TREAT_Y + 3.4 - p * 2} rx={1.2 + p * 1.8} ry={1 + p * 1.2} />
    </g>
  )
}

/** ねている間の「ぐうぐう」。あたまの上から 右上へ のぼる。 */
function Snore({ t, head }: SceneProps & { readonly head: Point }) {
  const show = during(t, 1.0, PERK + 0.1, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show} fill="#5f7fd6" fontWeight="700" fontFamily="inherit">
      {[0, 0.6, 1.2].map((offset, i) => {
        const p = ((t + offset) % 1.8) / 1.8
        return (
          <text key={offset} x={head[0] + 2 + p * 9 + Math.sin(p * 7) * 1.2} y={head[1] - 11 - p * 13} fontSize={4.2 + i * 1.2 + p * 2} opacity={Math.sin(p * Math.PI)}>
            z
          </text>
        )
      })}
    </g>
  )
}

/** おとに きづいた「!」。あたまの上に ぽん と出る。 */
function Notice({ t, head }: SceneProps & { readonly head: Point }) {
  const show = during(t, PERK, PERK + 1.0, 0.12)
  if (show <= 0) return null
  const pop = Math.max(0, span(t, PERK, PERK + 0.3, backOut))
  return (
    <Layer x={head[0] + 7} y={head[1] - 20} scale={pop} opacity={show}>
      <rect x="-1.4" y="-8" width="2.8" height="8" rx="1.4" fill={COLLAR} />
      <circle cx="0" cy="3" r="1.7" fill={COLLAR} />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  // かっこう: ねている → 立つ → かがむ → ジャンプ。あたまは 体より 少し先に もちあがる
  const bodyRise = span(t, RISE, RISE + 0.8, easeInOut)
  const standing = mixPose(LYING, STAND, bodyRise)
  const raised = { ...standing, hx: mix(t, RISE - 0.3, RISE + 0.5, LYING.hx, STAND.hx), hy: mix(t, RISE - 0.3, RISE + 0.5, LYING.hy, STAND.hy), headTilt: mix(t, RISE - 0.3, RISE + 0.5, LYING.headTilt, STAND.headTilt) }
  const crouched = mixPose(raised, CROUCHING, span(t, CROUCH, CROUCH + 0.6, easeInOut))
  const pose = mixPose(crouched, LEAPING, span(t, JUMP, JUMP + 0.8, easeOut))

  const asleep = t < PERK
  const mood: Mood = asleep ? 'asleep' : t < RISE + 0.9 ? 'alert' : 'happy'
  // みみ: ねているときは たれている。おとに きづくと「ぴんっ」と立つ
  const ear = -100 * (1 - span(t, PERK, PERK + 0.3, backOut))
  const breath = asleep ? wave(t, 1.8) * 0.8 : 0
  // しっぽ: 立ってから ジャンプの前まで ふりふり
  const wag = wave(t, 0.32) * 22 * span(t, RISE + 0.7, RISE + 1.0) * (1 - span(t, JUMP, JUMP + 0.3))

  const pop = span(t, 0.3, 0.9, backOut)
  const shadowRx = 22 - 6 * span(t, JUMP, JUMP + 0.8)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Treat t={t} />
        <Dust t={t} />
        <ellipse cx="52" cy="97.4" rx={Math.max(0, shadowRx * pop)} ry="2.4" fill="#000000" opacity="0.12" />
        <Layer scale={Math.max(0, pop)} origin={[52, 96]}>
          <Dog pose={pose} mood={mood} ear={ear} wag={wag} breath={breath} />
        </Layer>
        <Snore t={t} head={[pose.hx, pose.hy]} />
        <Notice t={t} head={[pose.hx, pose.hy]} />
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
    { at: 0, label: 'お日さま。いぬが ぐうぐう ねている', sound: 'pop' },
    { at: TOSS, label: 'ほねの おやつが とんでくる' },
    { at: PERK, label: 'ぽとん。みみが ぴんっ と たつ', sound: 'pop' },
    { at: RISE, label: 'おきあがって しっぽを ふりふり' },
    { at: CROUCH, label: 'ぐっと かがむ' },
    { at: JUMP, label: 'ほね めがけて ジャンプ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '犬 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
