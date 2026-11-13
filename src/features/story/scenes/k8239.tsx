/*
 * 船(ふね): 水に うかぶ 船。なみで ゆらゆら ゆれる。
 *
 * 絵は「池を 上から 見た ところ」。ふねは あたまが 上、ともが 下。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … ふねの へさきに 立てた 小さな はた の さお
 *   2画目(ノ)  … ふねの 左がわの ふち(下へ ひろがる)
 *   3画目      … ふねの 上と 右がわの ふち(へさきの いた と 右の ふち)
 *   4画目(ヽ)  … おとこの子の あたま(まんなか)
 *   5画目(丨)  … おとこの子の ま下に のびた 2本の足の あいだ
 *   6画目(一)  … ふねの 左右に でた オール
 *   7・8画目   … あひるの うしろに ひろがる 「八」の かたちの なみ(あひるの なみ)
 *   9・10・11画目 … 水に うかぶ 四角い いかだ の わく
 *
 * ながれ
 *   水が ひろがり、いかだが うかぶ → おとこの子が オールを こいで ふねで やってくる
 *   → いかだに つなぐ。こぎつかれて ふう(顔は つかれている)
 *   → あひるが いかだの かげから およいできて、うしろに 「八」の なみが ひろがる(男の子は びっくり)
 *   → なみが ふねに とどいて、ふねが ゆらゆら ゆれる(男の子は にこにこ)
 *   → ゆれが おさまった しゅんかん、ほね が ひかって 絵が うすくなり、字「船」が のこる
 *
 * ふね・人・あひるは、ほんものの つくり を守る:
 *   オールは ふねの ふちの 「オールうけ」を じく に まわる(はしを うしろへ かくと、手の ほうは まえへ)。
 *   うでは かた から出て ひじ で まがり、手は オールの にぎりに ついている。
 *   あひるの なみは、あひるが すすむ と うしろへ「八」の かたちに ひろがる。
 */
import { backOut, during, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '船'

const WATER = '#b5e1f8'
const WATER_LIGHT = '#d6f0fd'
const WATER_DARK = '#8fd0f5'
const WOOD = '#d9a066'
const WOOD_RIM = '#9a5f33'
const WOOD_FLOOR = '#e8bd8a'
const WOOD_DARK = '#c48c56'
const RAFT_BEAM = '#a8703f'
const SKIN = '#f8cfa6'
const HAIR = '#5a3b2a'
const SHIRT = '#e8685a'
const SHIRT_DARK = '#cf5448'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const OAR = '#8c5b3c'
const OAR_BLADE = '#e8c48f'
const FLAG = '#e8534a'
const ROPE = '#d9c28a'
const DUCK_Y = '#ffd24a'
const DUCK_WING = '#f0b92f'
const BEAK = '#f08a3c'
const PAD = '#6cc26f'
const PAD_DARK = '#55b86e'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const SWEAT = '#7cc4f2'

/** くぎり の時間(秒) */
const ROW_FROM = 0.6
const ROW_TO = 2.7
const DUCK = 3.5
const DUCK_ARRIVE = 5.7
/** なみが ふねに とどいて、ゆれはじめる */
const WAVE_HIT = 5.65
const INK = 7.3
const DONE = 10.5
const DURATION = 11

type Pt = readonly [number, number]

/** ふねの まんなか(ゆれの じく) */
const BOAT_CENTER: Pt = [31, 60]
/** ふねが はじめ いる所(下の はし の外)と、ぴったり とまる所 の ちがい */
const BOAT_START_Y = 115
/** いかだの まんなか と、ロープを むすぶ 所 */
const RAFT_CENTER: Pt = [74, 75]
const RAFT_TIE: Pt = [59.6, 76]
const BOAT_TIE: Pt = [43.6, 77]
/** あひるが とまる所(7・8画目の「八」の あたま)と、すすむ むき(うしろへ もどると、下 すこし 右) */
const DUCK_HOME: Pt = [68.6, 23]
const DUCK_TILT = -13

/* ───────── ふねの ゆれ ───────── */

type BoatPose = { readonly x: number; readonly y: number; readonly rotate: number }

/** ふねの いち。やってくる間は 下から のぼり、なみが とどくと ゆらゆら ゆれる。 */
function boatPose(t: number): BoatPose {
  const arrive = span(t, ROW_FROM, ROW_TO, easeOut)
  const rocking = during(t, WAVE_HIT, INK - 0.1, 0.4)
  const sway = wave(t - WAVE_HIT, 0.95) * rocking
  const rowing = during(t, ROW_FROM, ROW_TO, 0.3)
  return {
    x: sway * 2.4 + wave(t, 1.05) * 0.5 * rowing,
    y: (1 - arrive) * BOAT_START_Y,
    rotate: sway * 5 + wave(t, 1.05, 0.2) * 1.1 * rowing,
  }
}

/** ふねの 中の 点が、ゆれたあとの どこに くるか(ロープの はしを ふねに つなぐため) */
function placeOnBoat(point: Pt, pose: BoatPose): Pt {
  const rad = (pose.rotate * Math.PI) / 180
  const dx = point[0] - BOAT_CENTER[0]
  const dy = point[1] - BOAT_CENTER[1]
  return [BOAT_CENTER[0] + dx * Math.cos(rad) - dy * Math.sin(rad) + pose.x, BOAT_CENTER[1] + dx * Math.sin(rad) + dy * Math.cos(rad) + pose.y]
}

/* ───────── 水・いかだ・ロープ ───────── */

function Water({ t }: SceneProps) {
  const appear = span(t, 0, 0.5, easeOut)
  const drift = wave(t, 4)
  return (
    <>
      <rect x="-2" y="-2" width="113" height="113" fill={WATER} opacity={0.4 + 0.6 * appear} />
      {/* ゆっくり ながれる なみの すじ(字の画から はなれた すみに だけ) */}
      <g fill="none" stroke={WATER_LIGHT} strokeWidth="1.5" strokeLinecap="round" opacity={appear}>
        <path d={`M${46 + drift * 1.2} 9 q3 -2 6 0 t6 0`} />
        <path d={`M${98 - drift} 70 q3 -2 6 0`} />
        <path d={`M${2 + drift} 100 q3 -2 6 0 t6 0`} />
        <path d={`M${96 + drift} 100 q3 -2 6 0 t6 0`} />
        <path d={`M${4 - drift} 44 q3 -2 6 0`} />
      </g>
      {/* すいれんの は(上から 見た ところ) */}
      {[
        [8, 18, 4.6, 30],
        [101, 8, 3.8, 200],
        [92, 99, 4.2, 110],
      ].map(([cx, cy, r, turn], i) => (
        <Layer key={i} x={cx} y={cy + wave(t, 3.2, i) * 0.5} rotate={turn + wave(t, 5, i) * 4} opacity={appear}>
          <circle r={r} fill={PAD} />
          <circle r={r * 0.62} fill={PAD_DARK} opacity="0.5" />
          <path d={`M0 0 L${r + 0.5} -0.9 L${r + 0.5} 0.9 Z`} fill={WATER} />
        </Layer>
      ))}
    </>
  )
}

/** 四角い いかだ。9・10・11画目の わく を そのまま 木の ふち にする。 */
function Raft({ t }: SceneProps) {
  const pop = span(t, 0.25, 0.95, backOut)
  const bob = wave(t, 3, 0.5) * 0.35
  return (
    <>
      <Layer scale={pop} origin={RAFT_CENTER} y={bob}>
        <path d="M60 67 L92 65 L89 89 L64 91 Z" fill={WATER_DARK} opacity="0.55" />
        <path d="M58.5 65 L90 62.8 L86.4 86.6 L62.2 88 Z" fill={WOOD_FLOOR} />
        <path d="M60.5 71.2 L89.2 69.4 M61.3 79 L87.9 77.6" fill="none" stroke={WOOD_DARK} strokeWidth="1.1" strokeLinecap="round" />
        <Bone char={CHAR} n={9} color={RAFT_BEAM} width={3.6} />
        <Bone char={CHAR} n={10} color={RAFT_BEAM} width={3.6} />
        <Bone char={CHAR} n={11} color={RAFT_BEAM} width={3.6} />
        {/* ロープを かける くい */}
        <circle cx={RAFT_TIE[0]} cy={RAFT_TIE[1]} r="1.7" fill="#7a4a2a" />
      </Layer>
    </>
  )
}

/** ふねと いかだを つなぐ ロープ。ふねが ゆれると、ゆるんだり ひっぱられたり する。 */
function Rope({ t, boat }: SceneProps & { readonly boat: BoatPose }) {
  const show = span(t, ROW_TO + 0.05, ROW_TO + 0.45, easeOut)
  if (show <= 0) return null
  const end = placeOnBoat(BOAT_TIE, boat)
  const mid: Pt = [(end[0] + RAFT_TIE[0]) / 2, (end[1] + RAFT_TIE[1]) / 2 + 3.4 * show]
  // ロープの むこう はし は、いかだの くいから ふねへ のびていく
  const tip: Pt = [RAFT_TIE[0] + (end[0] - RAFT_TIE[0]) * show, RAFT_TIE[1] + (end[1] - RAFT_TIE[1]) * show]
  return <path d={`M${RAFT_TIE[0]} ${RAFT_TIE[1]} Q${mid[0]} ${mid[1]} ${tip[0]} ${tip[1]}`} fill="none" stroke={ROPE} strokeWidth="1.3" strokeLinecap="round" />
}

/* ───────── あひる ───────── */

/** あひるの いち。いかだの かげから 上へ すすみ、字の「八」の あたま で とまる。 */
function duckAt(t: number): Pt {
  const go = span(t, DUCK, DUCK_ARRIVE, easeOut)
  // すすむ むき(DUCK_TILT)の ぎゃくへ もどった 所から はじまる
  const back = 60 * (1 - go)
  const rad = (DUCK_TILT * Math.PI) / 180
  const bob = wave(t, 0.9) * 0.4 * go
  return [DUCK_HOME[0] - Math.sin(rad) * back, DUCK_HOME[1] + Math.cos(rad) * back + bob]
}

/** あひるが すすむと、うしろに 「八」の かたちの なみが ひろがる(7・8画目)。 */
function Wake({ t }: SceneProps) {
  const [x, y] = duckAt(t)
  const grow = span(t, DUCK + 0.5, DUCK_ARRIVE, easeOut)
  if (grow <= 0) return null
  return (
    <Layer x={x - DUCK_HOME[0]} y={y - DUCK_HOME[1]}>
      {[7, 8].map((n) => (
        <g key={n}>
          <Bone char={CHAR} n={n} color={WATER_DARK} width={5.2} to={grow} opacity={0.6} />
          <Bone char={CHAR} n={n} color="#ffffff" width={2.4} to={grow} />
        </g>
      ))}
    </Layer>
  )
}

function Duck({ t }: SceneProps) {
  const [x, y] = duckAt(t)
  if (t < DUCK) return null
  const settled = span(t, DUCK_ARRIVE, DUCK_ARRIVE + 0.3)
  // たどりついたあと、ちいさく くびを ふる
  const nod = wave(t, 0.8) * 2.2 * settled
  return (
    <Layer x={x} y={y} rotate={DUCK_TILT}>
      <ellipse cx="0" cy="0.6" rx="6.2" ry="7.6" fill="#ffffff" opacity="0.55" />
      {/* おしり(しっぽ) */}
      <path d="M-1.8 6 L0 9.2 L1.8 6 Z" fill={DUCK_WING} />
      <ellipse cx="0" cy="0" rx="5" ry="6.6" fill={DUCK_Y} />
      {/* はね は せなかの りょうがわに たたまれている */}
      <ellipse cx="-3" cy="1.4" rx="1.7" ry="4" fill={DUCK_WING} />
      <ellipse cx="3" cy="1.4" rx="1.7" ry="4" fill={DUCK_WING} />
      <Layer rotate={nod} origin={[0, -4]}>
        <circle cx="0" cy="-6.4" r="3.7" fill={DUCK_Y} />
        <ellipse cx="0" cy="-10.3" rx="2.1" ry="1.4" fill={BEAK} />
        <circle cx="-1.7" cy="-7.3" r="0.65" fill={EYE} />
        <circle cx="1.7" cy="-7.3" r="0.65" fill={EYE} />
        <circle cx="-2.7" cy="-5.6" r="0.9" fill={CHEEK} opacity="0.6" />
        <circle cx="2.7" cy="-5.6" r="0.9" fill={CHEEK} opacity="0.6" />
      </Layer>
    </Layer>
  )
}

/** なみが ふねに むかって ひろがる わ。 */
function Rings({ t }: SceneProps) {
  return (
    <>
      {[0, 0.4].map((offset) => {
        const p = span(t, WAVE_HIT - 0.8 + offset, WAVE_HIT + 0.25 + offset)
        if (p <= 0 || p >= 1) return null
        return <circle key={offset} cx="53.5" cy="52" r={2 + p * 9.5} fill="none" stroke="#ffffff" strokeWidth="1.1" opacity={(1 - p) * 0.9} />
      })}
    </>
  )
}

/* ───────── 男の子と ふね ───────── */

type Mood = 'tired' | 'surprised' | 'happy'

const HEAD: Pt = [31.5, 42.5]
const SHOULDER_L: Pt = [25.8, 49.6]
const SHOULDER_R: Pt = [37.2, 49.6]
const ARM_PART = 4.6

/** オール 1本。うけ(ふちの じく)・外へ のびる むき・にぎりまでの 長さ */
type OarSpec = { readonly pivot: Pt; readonly out: Pt; readonly inboard: number }
const OAR_L: OarSpec = { pivot: [21, 54.3], out: [-11, 2.2], inboard: 7 }
const OAR_R: OarSpec = { pivot: [44, 49.8], out: [5.2, -1], inboard: 8 }

const rotatePoint = (origin: Pt, vector: Pt, deg: number): Pt => {
  const rad = (deg * Math.PI) / 180
  return [origin[0] + vector[0] * Math.cos(rad) - vector[1] * Math.sin(rad), origin[1] + vector[0] * Math.sin(rad) + vector[1] * Math.cos(rad)]
}

/** オールの にぎり(うけ から ふねの 中へ)。angle だけ まわる。 */
function handleOf(spec: OarSpec, angle: number): Pt {
  const length = Math.hypot(spec.out[0], spec.out[1])
  return rotatePoint(spec.pivot, [(-spec.out[0] / length) * spec.inboard, (-spec.out[1] / length) * spec.inboard], angle)
}

function Oar({ spec, angle }: { readonly spec: OarSpec; readonly angle: number }) {
  const length = Math.hypot(spec.out[0], spec.out[1])
  const unit: Pt = [spec.out[0] / length, spec.out[1] / length]
  const grip: Pt = [spec.pivot[0] - unit[0] * spec.inboard, spec.pivot[1] - unit[1] * spec.inboard]
  const tip: Pt = [spec.pivot[0] + spec.out[0], spec.pivot[1] + spec.out[1]]
  const bladeAngle = (Math.atan2(unit[1], unit[0]) * 180) / Math.PI
  return (
    <Layer rotate={angle} origin={spec.pivot}>
      <path d={`M${grip[0]} ${grip[1]} L${tip[0]} ${tip[1]}`} stroke={OAR} strokeWidth="1.7" strokeLinecap="round" />
      <ellipse cx={tip[0]} cy={tip[1]} rx="3.4" ry="2" fill={OAR_BLADE} transform={`rotate(${bladeAngle} ${tip[0]} ${tip[1]})`} />
      <circle cx={spec.pivot[0]} cy={spec.pivot[1]} r="1.2" fill="#6b4a36" />
    </Layer>
  )
}

/** かた から ひじ を通って 手へ。ひじ は 外がわへ まがる。 */
function Arm({ shoulder, hand, side }: { readonly shoulder: Pt; readonly hand: Pt; readonly side: 1 | -1 }) {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const reach = Math.min(Math.hypot(dx, dy), ARM_PART * 2 - 0.05)
  const bend = Math.sqrt(Math.max(0, ARM_PART ** 2 - (reach / 2) ** 2))
  const norm = Math.hypot(dx, dy) || 1
  const elbow: Pt = [shoulder[0] + dx / 2 + (-dy / norm) * bend * side, shoulder[1] + dy / 2 + (dx / norm) * bend * side]
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={SHIRT_DARK} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.2" fill={SKIN} />
    </>
  )
}

function Face({ mood, look }: { readonly mood: Mood; readonly look: number }) {
  const [hx, hy] = HEAD
  const eyes: readonly number[] = [hx - 2.5, hx + 2.5]
  return (
    <>
      <circle cx={hx - 4.3} cy={hy + 2.6} r="1.5" fill={CHEEK} opacity="0.55" />
      <circle cx={hx + 4.3} cy={hy + 2.6} r="1.5" fill={CHEEK} opacity="0.55" />
      {mood === 'tired' && (
        <>
          {eyes.map((ex) => (
            <circle key={ex} cx={ex} cy={hy + 1} r="1" fill={EYE} />
          ))}
          <path d={`M${hx - 3.8} ${hy - 0.6} l2.6 -0.9 M${hx + 3.8} ${hy - 0.6} l-2.6 -0.9`} stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <ellipse cx={hx} cy={hy + 4.2} rx="1.3" ry="0.9" fill={MOUTH} />
          {/* あせ */}
          <path d={`M${hx + 6.4} ${hy - 3.8} q1.5 2 0 3 q-1.5 -1 0 -3 Z`} fill={SWEAT} />
        </>
      )}
      {mood === 'surprised' && (
        <>
          {eyes.map((ex) => (
            <g key={ex}>
              <circle cx={ex} cy={hy + 0.8} r="1.9" fill="#ffffff" stroke={EYE} strokeWidth="0.5" />
              <circle cx={ex + look * 0.7} cy={hy + 0.8 - look * 0.6} r="0.95" fill={EYE} />
            </g>
          ))}
          <path d={`M${hx - 4} ${hy - 2.4} q1.5 -1.4 3 0 M${hx + 1} ${hy - 2.4} q1.5 -1.4 3 0`} fill="none" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <ellipse cx={hx} cy={hy + 4.5} rx="1.3" ry="1.7" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          {eyes.map((ex) => (
            <path key={ex} d={`M${ex - 1.5} ${hy + 1.3} Q${ex} ${hy - 0.9} ${ex + 1.5} ${hy + 1.3}`} fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          ))}
          <path d={`M${hx - 2.6} ${hy + 3.4} Q${hx} ${hy + 7.6} ${hx + 2.6} ${hy + 3.4} Z`} fill={MOUTH} />
        </>
      )}
    </>
  )
}

type BoyProps = { readonly mood: Mood; readonly lean: number; readonly tilt: number; readonly look: number; readonly oarAngle: number }

function Boy({ mood, lean, tilt, look, oarAngle }: BoyProps) {
  const handL = handleOf(OAR_L, -oarAngle)
  const handR = handleOf(OAR_R, oarAngle)
  const up: Pt = [0, lean]
  const move = (p: Pt): Pt => [p[0] + up[0], p[1] + up[1]]
  return (
    <>
      {/* 足: こしから ま下へ のびて、まんなかに 5画目が とおる */}
      <rect x="27.2" y="59" width="4.4" height="22" rx="2.2" fill={PANTS} />
      <rect x="31.4" y="59" width="4.4" height="22" rx="2.2" fill={PANTS} />
      <ellipse cx="29.4" cy="81.6" rx="2.9" ry="2.1" fill={SHOE} />
      <ellipse cx="33.6" cy="81.6" rx="2.9" ry="2.1" fill={SHOE} />
      <Oar spec={OAR_L} angle={-oarAngle} />
      <Oar spec={OAR_R} angle={oarAngle} />
      <Layer y={lean}>
        {/* どう と くび: あたま の下に みじかく つながる */}
        <rect x="29.4" y="46" width="4.2" height="4" rx="1.6" fill={SKIN} />
        <rect x="25" y="48" width="13" height="14" rx="5.2" fill={SHIRT} />
        <path d="M27.2 58.4 h8.6" stroke={SHIRT_DARK} strokeWidth="1.1" strokeLinecap="round" />
      </Layer>
      <Arm shoulder={move(SHOULDER_L)} hand={handL} side={1} />
      <Arm shoulder={move(SHOULDER_R)} hand={handR} side={-1} />
      <Layer y={lean} rotate={tilt} origin={[HEAD[0], HEAD[1] + 5.5]}>
        <circle cx={HEAD[0]} cy={HEAD[1]} r="6.4" fill={SKIN} />
        <path d="M24.8 41 C24.2 33.2 31 34.6 33.6 35.4 C36.2 34.4 40 35 38.4 42 C37 39.4 34 38.2 31.6 38.6 C28.6 38.4 26 39.2 24.8 41 Z" fill={HAIR} />
        {/* 4画目に のる はねた かみ */}
        <path d="M30.6 36.2 Q31.6 33.4 33.2 35.2" fill="none" stroke={HAIR} strokeWidth="1.5" strokeLinecap="round" />
        <Face mood={mood} look={look} />
      </Layer>
    </>
  )
}

/** へさきの はた。かぜで ひらひら する。 */
function Flag({ t }: SceneProps) {
  const flutter = wave(t, 0.55) * 1.2
  return (
    <>
      <Bone char={CHAR} n={1} color={OAR} width={1.7} />
      <path d={`M33 14.2 Q${37 + flutter} ${12.4 + flutter * 0.4} ${41 + flutter * 1.5} ${15} Q${37} ${17.4} 32.6 18.6 Z`} fill={FLAG} />
    </>
  )
}

function Boat({ t, pose }: SceneProps & { readonly pose: BoatPose }) {
  const rowing = during(t, ROW_FROM, ROW_TO, 0.3)
  const oarAngle = 18 * wave(t - ROW_FROM, 1.05) * rowing
  const lean = -(oarAngle / 18) * 1.1 + wave(t, 0.3) * 0.5 * during(t, WAVE_HIT + 0.5, INK - 0.25, 0.3)
  const mood: Mood = t < DUCK + 0.95 ? 'tired' : t < WAVE_HIT + 0.35 ? 'surprised' : 'happy'
  const tilt = mood === 'surprised' ? 9 * span(t, DUCK + 0.95, DUCK + 1.3) : 0
  return (
    <Layer x={pose.x} y={pose.y} rotate={pose.rotate} origin={BOAT_CENTER}>
      <path d="M22 33 L46 32 L45.5 94 L14 97 Z" fill={WATER_DARK} opacity="0.5" />
      {/* ふねの かたち: 左の ふち(2画目)と 上と 右の ふち(3画目) の あいだ */}
      <path d="M19.4 29.7 L22 31.2 L35.4 28.8 Q43.9 28 43.9 34.3 L43.6 88.6 Q43.4 92 36.9 92 L11.5 95 L16.1 86.6 L18.8 77.3 L20.3 67.8 L21.1 58.2 L21.3 48.6 L21.3 38.9 Z" fill={WOOD} />
      <path d="M22.4 35 L41 34.2 L40.8 88.4 L16.2 91.6 L19.6 79 L21.6 66 L22.6 50 Z" fill={WOOD_FLOOR} />
      <Bone char={CHAR} n={2} color={WOOD_RIM} width={3.4} />
      <Bone char={CHAR} n={3} color={WOOD_RIM} width={3.4} />
      <Boy mood={mood} lean={lean} tilt={tilt} look={span(t, DUCK + 0.95, DUCK + 1.3)} oarAngle={oarAngle} />
      <Flag t={t} />
    </Layer>
  )
}

/** こぐとき、オールの はしから ちる みずしぶき。 */
function Splash({ t }: SceneProps) {
  const rowing = during(t, ROW_FROM + 0.1, ROW_TO - 0.1, 0.3)
  if (rowing <= 0) return null
  const pose = boatPose(t)
  const tip = placeOnBoat([OAR_L.pivot[0] + OAR_L.out[0] - 2, OAR_L.pivot[1] + OAR_L.out[1] + 0.5], pose)
  const pulse = Math.abs(wave(t - ROW_FROM, 1.05))
  return (
    <g opacity={rowing * pulse} fill="none" stroke="#ffffff" strokeWidth="1" strokeLinecap="round">
      <ellipse cx={tip[0]} cy={tip[1]} rx={3 + (1 - pulse) * 4} ry={1.6 + (1 - pulse) * 2} />
    </g>
  )
}

/** こぎおわって ほっと した「ふう」。 */
function Sigh({ t }: SceneProps) {
  const show = during(t, ROW_TO + 0.2, DUCK + 0.6, 0.25)
  if (show <= 0) return null
  const p = span(t, ROW_TO + 0.2, DUCK + 0.6, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={42 + p * 5} cy={40 - p * 6} rx={2.4 + p * 2.2} ry={1.6 + p * 1.4} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <ellipse cx={39.6 + p * 3} cy={41.6 - p * 3} rx={1.2 + p * 0.8} ry={0.9 + p * 0.5} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 11)
  const pose = boatPose(t)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Water t={t} />
        <Rings t={t} />
        <Wake t={t} />
        <Duck t={t} />
        <Raft t={t} />
        <Rope t={t} boat={pose} />
        <Splash t={t} />
        <Boat t={t} pose={pose} />
        <Sigh t={t} />
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
    { at: 0, label: '水が ひろがり、いかだが うかぶ', sound: 'pop' },
    { at: ROW_FROM, label: '男の子が オールを こいで、ふねで やってくる' },
    { at: ROW_TO, label: 'いかだに ロープで つなぐ。ふう' },
    { at: DUCK, label: 'あひるが およいできて、うしろに なみが ひろがる', sound: 'pop' },
    { at: WAVE_HIT, label: 'なみが とどいて、ふねが ゆらゆら ゆれる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '船 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
