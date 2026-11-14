/*
 * 国(くに): かこいの 中に たからの 玉。みんなで まもる くに。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … 左の 石がき(かこい の 左がわ)
 *   2画目(𠃍)  … うしろの 石がき と 右の 石がき(上の よこ線 から 右へ まがって 下へ)
 *   3画目(一)  … たからの 台の いちばん上の 皿(玉を のせる)
 *   4画目(丨)  … 台の まんなかの はしら
 *   5画目(一)  … 台の まんなかの 皿
 *   6画目(一)  … 台の いちばん下の 皿
 *   7画目(丶)  … 皿から ぶらさがった まがたま(玉の かざり)
 *   8画目(一)  … 手前の 石がき(かこい の 下がわ)
 *
 * ながれ
 *   たからの 台が でき、玉が ぽん と のる
 *   → こどもが 玉を 見に きて「わあ!」と びっくり(うれしい)
 *   → きつねが 玉を ねらって 近づく。こどもは あわてる(しんぱい)
 *   → こどもが 「ふんっ」と ちからを こめて、石がきを つんで かこいを つくる
 *   → きつねは かこいに ぶつかって、はいれず しょんぼり かえっていく
 *   → こどもは「やったー!」と ばんざい → ほね が ひかって、絵が うすくなり、字「国」が のこる
 *
 * こどもは Person(共通部品)。あるきは walk、ふりむきは turnAround、うで は 角度({ swing, bend })。
 * 背景は Backdrop。きつね(動物)は 部品が ないので 元の絵のまま:
 *   きつねは よつあし で、みみ は あたまの上、しっぽ は おしりから。
 *   石がきは、下から つみあがる(上から ぶらさがらない)。
 */
import { backOut, during, easeIn, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, CLOTHES, LOOKS, mixLimb, Person, personRig, Sweat, turnAround, walk, type Expression, type Limb } from '../sceneFigures'

const CHAR = '国'

const EYE = '#2b2b2b'

const FOX = '#f08a3c'
const FOX_SHADE = '#d8702a'
const FOX_WHITE = '#fff4e6'
const FOX_DARK = '#5b3a2a'

const WOOD = '#d9a066'
const WOOD_DARK = '#a9743f'
const JADE = '#2fc4a0'
const JADE_DARK = '#1f9c80'
const JADE_LIGHT = '#b8f2e2'
const MAGATAMA = '#f0708a'
const MAGATAMA_LIGHT = '#ffb3c3'

const STONE = '#b8a58e'
const STONE_DARK = '#8f7d68'
const STONE_LIGHT = '#dccfbb'


/** くぎり の時間(秒) */
const KID_IN = 0.9
const KID_STOP = 2.4
const FOX_IN = 2.7
/** こどもが しんぱいに なる(きつねに きづく) */
const WORRY = 3.2
/** かこいを つくりはじめる時間 と、左・手前・右と上 の できあがり */
const WALL1 = 3.7
const BUMP = 4.45
const WALL8 = 4.55
const WALL8_END = 5.05
const WALL2_MID = 5.5
const WALL_END = 5.95
const FOX_TURN = 4.95
const FOX_LEAVE = 5.35
const FOX_END = 6.9
const INK = 7.0
const DONE = 10.2
const DURATION = 10.7

/** 地面の たかさ */
const GROUND = 97
/** きつねが かこいに ぶつかる 場所(きつねの まんなか) */
const FOX_STOP = 2
/** こどもが たつ 場所(かこいの 右そと) */
const KID_AT = 98
const KID_HEIGHT = 42
const FOX_SCALE = 0.85

/** 2画目の うち、上の よこ線 が おわって 右がわの たて線 に かわる 長さの わりあい */
const CORNER = 0.46

/* ───────── たからの 台 と 玉 ───────── */

/** 玉(まる い 宝石)の まんなか。いちばん上の 皿に のっている */
const JEWEL_AT: readonly [number, number] = [54.3, 25.2]
const JEWEL_R = 5
/** 皿の 下の かげ(うすい おび)。ほんの 少し 下に ずらす */
const PLATE_SHADOW = 0.7

/** まがたま(日本の むかしの 玉)。7画目の 点の 向き(左上から 右下)に 合わせて、皿から ぶらさげる */
const MAGATAMA_PATH =
  'M65.6 57.6 Q66 54.8 69.2 55 Q72.4 55.4 73.6 58.6 Q75.5 62 77.4 65.8 Q74.2 66.8 71.8 64 Q69.4 61.6 66.8 61.2 Q65.2 60.2 65.6 57.6 Z'
/** まがたま を つるす ひもの かたはし(5画目の 皿の下) */
const CORD_TOP: readonly [number, number] = [67.6, 50.6]

function Plate({ n }: { readonly n: number }) {
  return (
    <>
      <g transform={`translate(0 ${PLATE_SHADOW})`}>
        <Bone char={CHAR} n={n} color={WOOD_DARK} width={4.4} />
      </g>
      <Bone char={CHAR} n={n} color={WOOD} width={3.4} />
    </>
  )
}

function Stand({ t }: SceneProps) {
  const grow = span(t, 0.05, 0.7, backOut)
  const jewel = span(t, 0.7, 1.2, backOut)
  const glow = 0.28 + 0.12 * wave(t, 1.6)
  // 玉に ひかりが あたって きらっと ひかる(こどもが 見つけた とき と、まもりきった とき)
  const glint = Math.max(during(t, KID_STOP, WORRY, 0.3), span(t, WALL_END, WALL_END + 0.4) * (1 - span(t, INK - 0.1, INK + 0.3)))
  return (
    <>
      <Layer scale={grow} origin={[54, 93]}>
        {/* はしら(4画目)と、地面まで のびる 足 */}
        <rect x="52.6" y="70" width="3.4" height="24" rx="1.4" fill={WOOD_DARK} />
        <Bone char={CHAR} n={4} color={WOOD_DARK} width={3.4} />
        <Plate n={3} />
        <Plate n={5} />
        <Plate n={6} />
        {/* まがたま: ひもで 5画目の 皿から ぶらさがる(ゆらゆら) */}
        <Layer rotate={wave(t, 2.2) * 3} origin={CORD_TOP}>
          <path d={`M${CORD_TOP[0]} ${CORD_TOP[1]} L67.6 55.8`} stroke={FOX_DARK} strokeWidth="0.7" strokeLinecap="round" />
          <path d={MAGATAMA_PATH} fill={MAGATAMA} />
          <path d="M67.2 56.6 Q69 55.6 71 56.6" fill="none" stroke={MAGATAMA_LIGHT} strokeWidth="1" strokeLinecap="round" />
          <circle cx="68" cy="57.8" r="0.7" fill={FOX_DARK} />
        </Layer>
      </Layer>
      {/* 玉: ぽん と のって、ほんのり ひかる */}
      <Layer scale={jewel} origin={[JEWEL_AT[0], JEWEL_AT[1] + JEWEL_R]}>
        <circle cx={JEWEL_AT[0]} cy={JEWEL_AT[1]} r={JEWEL_R + 3 + glint * 1.5} fill="#ffffff" opacity={glow + glint * 0.25} />
        <circle cx={JEWEL_AT[0]} cy={JEWEL_AT[1]} r={JEWEL_R} fill={JADE_DARK} />
        <circle cx={JEWEL_AT[0] - 0.4} cy={JEWEL_AT[1] - 0.5} r={JEWEL_R - 0.9} fill={JADE} />
        <ellipse cx={JEWEL_AT[0] - 1.8} cy={JEWEL_AT[1] - 2} rx="1.5" ry="1" fill={JADE_LIGHT} transform={`rotate(-30 ${JEWEL_AT[0] - 1.8} ${JEWEL_AT[1] - 2})`} />
      </Layer>
      {glint > 0 && (
        <>
          <Star cx={JEWEL_AT[0] - 8.4} cy={JEWEL_AT[1] - 3} r={2.3 * glint} color="#fff7b0" spin={t * 60} />
          <Star cx={JEWEL_AT[0] + 8.6} cy={JEWEL_AT[1] - 5.4} r={1.9 * glint} color="#ffffff" spin={-t * 60} />
        </>
      )}
    </>
  )
}

/* ───────── 石がき(かこい) ───────── */

/** 石がきの 1本。うしろに かげ、まんなかに 石の色、左上に ハイライト を重ねる */
function WallStroke({ n, from, to }: { readonly n: number; readonly from: number; readonly to: number }) {
  if (to - from <= 0) return null
  return (
    <>
      <g transform="translate(0 0.9)">
        <Bone char={CHAR} n={n} color={STONE_DARK} width={7.4} from={from} to={to} />
      </g>
      <Bone char={CHAR} n={n} color={STONE} width={6.2} from={from} to={to} />
      <g transform="translate(-1 -1)">
        <Bone char={CHAR} n={n} color={STONE_LIGHT} width={1.8} from={from} to={to} />
      </g>
    </>
  )
}

/** 左 → 手前 → 右と上 の じゅんに、下から つみあがる */
function Walls({ t }: SceneProps) {
  const left = span(t, WALL1, BUMP, easeOut)
  const front = span(t, WALL8, WALL8_END, easeOut)
  const right = span(t, WALL8_END, WALL2_MID, easeOut)
  const top = span(t, WALL2_MID, WALL_END, easeOut)
  // 2画目は 右がわを 下から のぼり、かどを まがって 上の よこ線が 左へ のびる
  const backFrom = 1 - (1 - CORNER) * right - CORNER * top
  return (
    <>
      <WallStroke n={1} from={1 - left} to={1} />
      <WallStroke n={8} from={0} to={front} />
      <WallStroke n={2} from={backFrom} to={1} />
    </>
  )
}

/* ───────── こども(主役) ───────── */

type KidMood = 'happy' | 'wonder' | 'worry' | 'effort' | 'cheer'

const FACES: Readonly<Record<KidMood, Expression>> = { happy: 'smile', wonder: 'surprised', worry: 'worried', effort: 'strain', cheer: 'joy' }
/** 「やったー!」で 正面を むく 時間(0.3秒 かけて ふりむく) */
const CHEER_AT = WALL_END + 0.1
const BANZAI: Limb = { swing: 155, bend: 15 }

function kidMood(t: number): KidMood {
  if (t < KID_STOP) return 'happy'
  if (t < WORRY) return 'wonder'
  if (t < WALL1) return 'worry'
  if (t < CHEER_AT) return 'effort'
  return 'cheer'
}

/** 横むきの うで(まえへ + の 角度)。びっくり → しんぱい → ちからを こめて おす */
function sideArms(t: number): { readonly leftArm: Limb; readonly rightArm: Limb } {
  const surprise = during(t, KID_STOP, WORRY, 0.25)
  const worry = during(t, WORRY, WALL1 - 0.2, 0.2) * (0.8 + 0.2 * wave(t, 0.25))
  const push = span(t, WALL1 - 0.3, WALL1 + 0.15, easeOut) * (1 - span(t, WALL_END, WALL_END + 0.3))
  const base = 8 + 42 * surprise + 16 * worry + 76 * push
  const bend = 6 + 4 * surprise + 8 * worry + 8 * push
  const wiggle = wave(t, 0.28) * 4 * push
  return { leftArm: { swing: Math.max(0, base + wiggle), bend }, rightArm: { swing: Math.max(0, base - wiggle), bend } }
}

/** こども の 場所と かっこう。右から あるいてきて 玉を 見て、うで で ちからを こめ、さいごに 正面を むいて ばんざい */
function kidAt(t: number) {
  const walking = walk(t, { from: 136, to: KID_AT, start: KID_IN, end: KID_STOP, build: 'child', height: KID_HEIGHT })
  const turn = turnAround(t, CHEER_AT, 'left', 'front')
  const mood = kidMood(t)
  // ばんざい の ときは ぴょんぴょん はねる
  const cheerOn = span(t, CHEER_AT + 0.1, CHEER_AT + 0.4)
  const hop = Math.abs(Math.sin(((t - WALL_END) * Math.PI) / 0.55)) * 3.2 * cheerOn
  const frontArm = mixLimb({ swing: 8, bend: 6 }, BANZAI, span(t, CHEER_AT + 0.15, CHEER_AT + 0.55, backOut))
  const pose = t < KID_STOP ? walking.pose : t < CHEER_AT + 0.15 ? sideArms(t) : { leftArm: frontArm, rightArm: frontArm }
  return { placement: { ...walking, ...turn, y: GROUND, lift: hop, pose }, face: FACES[mood] }
}

/** 「ふんっ」と ちからを こめる ときの、あたまの上の 3本の すじ */
function EffortLines({ t, head, r }: SceneProps & { readonly head: readonly [number, number]; readonly r: number }) {
  const show = span(t, WALL1 - 0.2, WALL1 + 0.1) * (1 - span(t, WALL_END - 0.1, WALL_END + 0.15))
  if (show <= 0) return null
  const pulse = 0.5 + 0.5 * wave(t, 0.34)
  return (
    <g opacity={show} stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round">
      {[-1, 0, 1].map((k) => (
        <path key={k} d={`M${head[0] + k * 5} ${head[1] - r - 2 - pulse * 0.8} l${k * 1.6} ${-2.6}`} />
      ))}
    </g>
  )
}

/* ───────── きつね ───────── */

type FoxMood = 'sly' | 'sad'

type FoxProps = { readonly mood: FoxMood; readonly stride: number; readonly tailSway: number; readonly headShake: number }

/** きつね(足もとの まんなかが 0,0。右むき)。よつあし、みみ は あたまの上、しっぽ は おしりから。 */
function FoxBody({ mood, stride, tailSway, headShake }: FoxProps) {
  const sad = mood === 'sad'
  return (
    <>
      {/* しっぽ: ふさふさ。しょんぼり すると 下がる */}
      <Layer rotate={sad ? -35 : tailSway} origin={[-7, -10]}>
        <path d="M-6 -9 C-12 -8 -17 -12 -19 -17 C-14 -17 -10 -15 -5 -13 Z" fill={FOX} />
        <ellipse cx="-18.2" cy="-16.4" rx="2.3" ry="2" fill={FOX_WHITE} />
      </Layer>
      {/* むこうがわの あし */}
      <Layer rotate={-stride * 24} origin={[-3.5, -8]}>
        <rect x="-4.8" y="-9" width="2.8" height="9" rx="1.4" fill={FOX_SHADE} />
        <rect x="-4.8" y="-3.6" width="2.8" height="3.6" rx="1.4" fill={FOX_DARK} />
      </Layer>
      <Layer rotate={stride * 24} origin={[7.5, -8]}>
        <rect x="6.2" y="-9" width="2.8" height="9" rx="1.4" fill={FOX_SHADE} />
        <rect x="6.2" y="-3.6" width="2.8" height="3.6" rx="1.4" fill={FOX_DARK} />
      </Layer>
      {/* どう */}
      <ellipse cx="0" cy="-9.5" rx="9" ry="5" fill={FOX} />
      <ellipse cx="2" cy="-6.8" rx="5" ry="2.2" fill={FOX_WHITE} />
      {/* てまえの あし */}
      <Layer rotate={stride * 24} origin={[-6.5, -8]}>
        <rect x="-7.8" y="-9" width="2.8" height="9" rx="1.4" fill={FOX} />
        <rect x="-7.8" y="-3.6" width="2.8" height="3.6" rx="1.4" fill={FOX_DARK} />
      </Layer>
      <Layer rotate={-stride * 24} origin={[4.5, -8]}>
        <rect x="3.2" y="-9" width="2.8" height="9" rx="1.4" fill={FOX} />
        <rect x="3.2" y="-3.6" width="2.8" height="3.6" rx="1.4" fill={FOX_DARK} />
      </Layer>
      {/* あたま: ぶつかると ちょっと ゆれる */}
      <Layer rotate={headShake} origin={[6, -11]}>
        <Layer rotate={sad ? -40 : 0} origin={[8, -17]}>
          <path d="M6 -16 L6.6 -22.4 L10 -17.6 Z" fill={FOX} />
        </Layer>
        <Layer rotate={sad ? 40 : 0} origin={[11.2, -17]}>
          <path d="M9.5 -17.3 L12.4 -22.2 L13 -16.3 Z" fill={FOX} />
          <path d="M10.8 -17.6 L12.2 -20.4 L12.4 -17.2 Z" fill={FOX_DARK} />
        </Layer>
        <circle cx="9.5" cy="-13.5" r="4.6" fill={FOX} />
        <path d="M12 -16 L17.5 -11.8 L12 -9.8 Z" fill={FOX} />
        <path d="M8.6 -10.6 Q12 -8.4 15.6 -11.2 L12 -9.8 Z" fill={FOX_WHITE} />
        <circle cx="17.3" cy="-12" r="1" fill={FOX_DARK} />
        {sad ? (
          <>
            <circle cx="11.6" cy="-14.4" r="1" fill={EYE} />
            <path d="M10 -16.6 L13 -15.8" stroke={FOX_DARK} strokeWidth="0.8" strokeLinecap="round" />
            <path d="M13.4 -10.2 Q15.2 -11.4 16.6 -10" fill="none" stroke={FOX_DARK} strokeWidth="0.7" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M10 -14.6 Q11.6 -15.8 13 -14.2" fill="none" stroke={EYE} strokeWidth="1" strokeLinecap="round" />
            <path d="M10 -16.4 L13.2 -16.8" stroke={FOX_DARK} strokeWidth="0.8" strokeLinecap="round" />
            <path d="M13.4 -10.8 Q15.4 -9.4 16.8 -10.8" fill="none" stroke={FOX_DARK} strokeWidth="0.7" strokeLinecap="round" />
          </>
        )}
      </Layer>
    </>
  )
}

/** きつねの「玉が ほしい」の ふきだし(あたまの上) */
function WantBubble({ t }: SceneProps) {
  const show = during(t, FOX_IN + 0.5, BUMP, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      <circle cx="3" cy="-24" r="1.3" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
      <circle cx="4.4" cy="-28" r="1.9" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
      <circle cx="8" cy="-36" r="7.4" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <circle cx="8" cy="-36" r="3.6" fill={JADE_DARK} />
      <circle cx="7.8" cy="-36.2" r="2.9" fill={JADE} />
      <ellipse cx="7" cy="-37.4" rx="1" ry="0.6" fill={JADE_LIGHT} />
    </g>
  )
}

/** かこいに ぶつかった しゅんかんの「ごんっ」の すじ */
function BumpBurst({ t }: SceneProps) {
  const show = during(t, BUMP, BUMP + 0.45, 0.08)
  if (show <= 0) return null
  const p = span(t, BUMP, BUMP + 0.45, easeOut)
  return (
    <g opacity={show} stroke="#fff3b0" strokeWidth="1.2" strokeLinecap="round">
      {[-40, 0, 40].map((deg) => (
        <path key={deg} d="M3 0 L7 0" transform={`translate(18 87) rotate(${deg}) translate(${p * 2} 0)`} />
      ))}
    </g>
  )
}

/** きつね の うごき: ねらって あるいてくる → ぶつかる → しょんぼり ふりむいて かえる */
function FoxActor({ t }: SceneProps) {
  if (t < FOX_IN || t >= FOX_END) return null
  const arriving = t < BUMP
  const leaving = t >= FOX_LEAVE
  const bumpOffset = 2.6 * Math.sin(span(t, BUMP, BUMP + 0.3) * Math.PI)
  const x = arriving ? mix(t, FOX_IN, BUMP, -12, FOX_STOP, (v) => v) : leaving ? mix(t, FOX_LEAVE, FOX_END, FOX_STOP, -40, easeIn) : FOX_STOP - bumpOffset
  const stepping = arriving ? Math.sin((t - FOX_IN) * Math.PI * 2 * 2.6) : leaving ? Math.sin((t - FOX_LEAVE) * Math.PI * 2 * 2.2) : 0
  const facing = 1 - 2 * span(t, FOX_TURN, FOX_TURN + 0.3)
  const mood: FoxMood = t < BUMP ? 'sly' : 'sad'
  const headShake = t >= BUMP && t < BUMP + 0.5 ? wave(t - BUMP, 0.18) * 7 * (1 - span(t, BUMP, BUMP + 0.5)) : 0
  return (
    <>
      <ellipse cx={x} cy={GROUND + 0.4} rx="9" ry="2" fill="#000000" opacity="0.12" />
      <Layer x={x} y={GROUND} scale={FOX_SCALE} origin={[0, 0]}>
        <Layer scaleX={facing} origin={[0, 0]}>
          <FoxBody mood={mood} stride={stepping} tailSway={wave(t, 0.6) * 6} headShake={headShake} />
          <WantBubble t={t} />
        </Layer>
      </Layer>
    </>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)
  const kid = kidAt(t)
  const rig = personRig(kid.placement)
  const head = rig.world.head
  const worry = during(t, WORRY, WALL1 - 0.2, 0.2)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[100, 11]} clouds={[[1, 6, 0.9]]} ground={98} />
        <Stand t={t} />
        <Walls t={t} />
        <FoxActor t={t} />
        <BumpBurst t={t} />
        <Person {...kid.placement} look={{ ...LOOKS.boy, top: CLOTHES.blue.top }} face={kid.face} />
        <Sweat t={t} x={head[0] + 5} y={head[1] - 4} show={worry} dir={1} />
        <EffortLines t={t} head={head} r={rig.body.headR * rig.scale} />
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
    { at: 0, label: 'たからの 台に 玉が ぽん と のる', sound: 'pop' },
    { at: KID_IN, label: 'こどもが 玉を 見に くる' },
    { at: KID_STOP, label: '「わあ、たからの 玉!」', sound: 'pop' },
    { at: FOX_IN, label: 'きつねが 玉を ねらって 近づく' },
    { at: WALL1, label: 'こどもが 石がきで かこいを つくる' },
    { at: BUMP, label: 'きつねは かこいに ぶつかって はいれない', sound: 'pop' },
    { at: WALL_END + 0.1, label: '「やったー!」玉を まもった' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '国 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
