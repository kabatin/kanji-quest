/*
 * 貝(かい): うみで ひろった かいがら。むかしは お金のかわりに なった。(共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … かいがらの 左のふち
 *   2画目(𠃍)  … かいがらの 上と 右のふち
 *   3・4・5画目 … かいがらの よこすじ(すじ が 3本)。5画目は 下のふちも かねる
 *   6・7画目   … かいがらを のせた 木の 台の、ハの字に ひらいた 2本の あし
 *
 * ながれ
 *   はらぺこの 子どもが あるいてくる(あたまの上に パンの ゆめ)。ぐう と おなかが なる
 *   → 波が きて、大きな かいがらを 砂はまに おいていく。子どもは びっくり して、だいじに だきあげる
 *   → 木の台に かいがらを のせると、台の となりの カニが「おかね だね」と パンを ぽーんと なげてくれる
 *   → 子どもは パンを うけとって 大よろこび。カメラが かいがらに ぐーっと よると、
 *     ほね が ひかって、絵が うすくなり、字「貝」が のこる
 *
 * 子どもは Person(あるきは walk、かかえるのは holdPose)。かいがらや 台は、字と同じ 大きさで えがいてから
 * 1/3 に ちぢめて 場面に おき、さいごに カメラが 3ばい に よると、字の画と ぴったり かさなる。
 * カニと パンは 部品が ないので 場面の中で 描く。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type Ease, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Bird, Clouds, HANG_ARM, holdPose, LOOKS, mixLimb, mixPose, Notice, Person, personRig, Seashore, Sun, walk, type Limb, type PersonPose, type Point } from '../sceneFigures'

const CHAR = '貝'

const SHELL = '#fbe3d6'
const SHELL_RIM = '#e59b86'
const SHELL_RIDGE = '#eeaa94'
const WOOD = '#b9824f'
const WOOD_DARK = '#8f5f35'
const CRAB = '#e8604c'
const CRAB_DARK = '#c74a38'
const BREAD = '#e9b266'
const BREAD_LIGHT = '#f6d08e'
const BREAD_LINE = '#c98a46'
const SKY = '#d7f0fb'
const KID_LOOK = { ...LOOKS.boy, top: '#ef7b5a' } as const

/** くぎり の時間(秒) */
const WALK_START = 0.2
const WALK_END = 1.4
/** おなかが すいて、パンを おもう */
const HUNGRY = 1.5
const WAVE_IN = 1.9
const WAVE_LAND = 2.9
const WAVE_OUT = 3.7
const SURPRISE = 2.9
const BEND_START = 3.5
const LIFT_START = 4.0
const LIFT_END = 4.7
const CARRY_END = 5.7
const SET_START = 5.75
const SET_END = 6.1
const LET_GO = 6.25
const TOSS_START = 6.7
const TOSS_END = 7.3
const ZOOM_START = 7.9
const ZOOM_END = 9.0
const INK = 9.1
const DONE = 11.3
const DURATION = 11.8

/** 地面の たかさ と、場面の カメラの じく(かいがらの まんなか) */
const GROUND = 64
const FOCUS: Point = [54.5, 47]
/** 字と同じ大きさで えがいた もの(かいがら・台)を、場面に おくときの ちぢめかた */
const MINI = 1 / 3
const ZOOM = 3
const KID = { build: 'child', height: 45, facing: 'right' } as const

const PICK_X = 20
const PLACE_X = 37.5
const SAND_X = 36
/** 場面の中の かいがらの はば(字の 46 × 1/3) */
const SHELL_W = 15
const BREAD_REST: Point = [67.6, 45.9]

/** かがんで ひろう かっこう(こし が さがり、上体が まえへ) */
const BEND: PersonPose = { torso: 40, head: -12, leftLeg: { swing: 36, bend: 62 }, rightLeg: { swing: 36, bend: 62 } }

type Key = readonly [number, number]

/** くぎりごとの 値を、なめらかに つなぐ */
function track(t: number, keys: readonly Key[], ease: Ease = easeInOut): number {
  const first = keys[0]
  const last = keys[keys.length - 1]
  if (t <= first[0]) return first[1]
  if (t >= last[0]) return last[1]
  const i = keys.findIndex((key) => key[0] > t)
  const a = keys[i - 1]
  const b = keys[i]
  return a[1] + (b[1] - a[1]) * ease(span(t, a[0], b[0]))
}

const lerpPt = (a: Point, b: Point, k: number): Point => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/** うで に、ねらう ところ を じゅんに かさねる([ねらい, 度合い]) */
function blend(base: Limb | undefined, aims: readonly (readonly [Limb, number])[]): Limb {
  return aims.reduce<Limb>((limb, [aim, k]) => (k <= 0 ? limb : mixLimb(limb, aim, k)), base ?? HANG_ARM)
}

/* ───────── 場所 ───────── */

function Scenery({ t }: SceneProps) {
  return (
    <>
      <Seashore t={t} horizon={36} shore={58} sky={SKY} />
      <Sun t={t} x={13} y={13} />
      <Clouds t={t} at={[[52, 14, 1], [92, 25, 0.8]]} speed={1.4} />
      <Bird x={86 - t * 1.6} y={22 + wave(t, 3) * 1.2} t={t} flying facing="left" size={0.8} color="#ffffff" dark="#c9d6e6" />
    </>
  )
}

/** 字と同じ 大きさ(座標)で えがいた かいがら。1/3 に ちぢめて 場面に おく。 */
function ShellArt() {
  return (
    <>
      <path d="M31 19 C31 15 34 14 37.5 13.6 L71 14.6 C75.6 14.8 77.2 16.4 77.2 20.4 L76.8 70 C76.6 75 76.4 77.6 73 77.8 L36 77.8 C32 77.8 30.8 75.4 30.8 71 Z" fill={SHELL} />
      <Bone char={CHAR} n={3} color={SHELL_RIDGE} width={4.4} />
      <Bone char={CHAR} n={4} color={SHELL_RIDGE} width={4.4} />
      <Bone char={CHAR} n={5} color={SHELL_RIDGE} width={4.4} />
      <Bone char={CHAR} n={1} color={SHELL_RIM} width={3.4} />
      <Bone char={CHAR} n={2} color={SHELL_RIM} width={3.4} />
      <ellipse cx="42" cy="27" rx="4.4" ry="2.2" fill="#ffffff" opacity="0.65" />
    </>
  )
}

/** 場面の中の かいがら。at は まんなか。rock は 波の ゆれ。 */
function Shell({ at, rock }: { readonly at: Point; readonly rock: number }) {
  return (
    <Layer rotate={rock} origin={[at[0], at[1] + 10]}>
      <Layer x={at[0] - FOCUS[0]} y={at[1] - FOCUS[1]} scale={MINI} origin={FOCUS}>
        <ShellArt />
      </Layer>
    </Layer>
  )
}

/** 木の台。2本の あし(6・7画目)は ハの字に ひらく。 */
function Stool({ t }: SceneProps) {
  const grow = span(t, 0, 0.6, backOut)
  return (
    <>
      <ellipse cx={FOCUS[0]} cy="64.6" rx={10.6 * grow} ry="1.6" fill="#000000" opacity="0.12" />
      <Layer scale={MINI * grow} origin={FOCUS}>
        <Bone char={CHAR} n={6} color={WOOD_DARK} width={4.6} />
        <Bone char={CHAR} n={7} color={WOOD_DARK} width={4.6} />
        <rect x="28" y="77" width="53" height="4.4" rx="2.2" fill={WOOD} />
      </Layer>
    </>
  )
}

function Bread({ at, spin = 0 }: { readonly at: Point; readonly spin?: number }) {
  return (
    <g transform={`translate(${at[0]} ${at[1]}) rotate(${spin})`}>
      <ellipse cx="0" cy="0" rx="3.6" ry="3" fill={BREAD} />
      <ellipse cx="-0.8" cy="-1.2" rx="2" ry="1" fill={BREAD_LIGHT} />
      <path d="M-1.6 -2 l0.8 1.8 M0.2 -2.4 l0.8 2 M1.9 -1.8 l0.6 1.6" stroke={BREAD_LINE} strokeWidth="0.6" strokeLinecap="round" fill="none" />
    </g>
  )
}

/** 台の となりに いる カニ。パンを はさみに のせて いる。かいがらを みると よろこんで、パンを なげる。 */
function Crab({ t, bread }: SceneProps & { readonly bread: boolean }) {
  const glad = span(t, 6.1, 6.4)
  const bob = Math.sin(t * 5) * 0.25 * (1 + glad)
  const eyeUp = glad * 1.4
  // パンを なげたあとは、りょうほうの はさみを ふって よろこぶ
  const cheer = t >= TOSS_START ? Math.abs(wave(t, 0.5)) * 2.4 : 0
  const leftClaw: Point = [67.6, 51.6 - cheer + bob]
  const rightClaw: Point = [84.4, 52.6 - glad * 1.2 - cheer * 0.8 + bob]
  return (
    <g transform={`translate(0 ${bob})`}>
      {[
        [70.8, 61.2, 67.8, 64.2],
        [72, 62.8, 69.6, 64.7],
        [73.4, 63.6, 72, 65],
      ].map(([x1, y1, x2, y2]) => (
        <g key={x1} stroke={CRAB_DARK} strokeWidth="1.3" strokeLinecap="round" fill="none">
          <path d={`M${x1} ${y1} L${x2} ${y2}`} />
          <path d={`M${152 - x1} ${y1} L${152 - x2} ${y2}`} />
        </g>
      ))}
      <path d={`M71.4 57.6 L${leftClaw[0] + 1} ${leftClaw[1] + 1.2}`} stroke={CRAB_DARK} strokeWidth="1.8" strokeLinecap="round" />
      <path d={`M80.6 57.6 L${rightClaw[0] - 1} ${rightClaw[1] + 1.2}`} stroke={CRAB_DARK} strokeWidth="1.8" strokeLinecap="round" />
      <ellipse cx="76" cy="59.6" rx="6.8" ry="4.7" fill={CRAB} />
      <ellipse cx="76" cy="61.2" rx="4.6" ry="2.6" fill="#f08572" />
      {[leftClaw, rightClaw].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="2.6" fill={CRAB} />
          <path d={`M${x} ${y - 0.4} L${x} ${y - 2.6}`} stroke="#a83a2c" strokeWidth="0.8" strokeLinecap="round" />
        </g>
      ))}
      {[74, 78].map((x) => (
        <g key={x}>
          <path d={`M${x} 56 L${x} ${53.4 - eyeUp}`} stroke={CRAB_DARK} strokeWidth="1" strokeLinecap="round" />
          <circle cx={x} cy={52.8 - eyeUp} r="1.9" fill="#ffffff" />
          <circle cx={x - 0.2} cy={52.9 - eyeUp} r="0.9" fill="#2b2b2b" />
        </g>
      ))}
      {glad > 0.5 ? <ellipse cx="76" cy="60.6" rx="1.4" ry="1.2" fill="#8a2c22" /> : <path d="M74.4 60 Q76 61.8 77.6 60" fill="none" stroke="#8a2c22" strokeWidth="0.9" strokeLinecap="round" />}
      <circle cx="72.6" cy="60" r="1" fill="#ff9d9d" opacity="0.6" />
      <circle cx="79.4" cy="60" r="1" fill="#ff9d9d" opacity="0.6" />
      {bread ? <Bread at={[leftClaw[0], leftClaw[1] - 5.7]} /> : null}
    </g>
  )
}

/** 波。かいがらを のせて、左から すべってきて、のこして ひいていく。 */
function Tongue({ front, opacity }: { readonly front: number; readonly opacity: number }) {
  if (opacity <= 0) return null
  const edge = `M${front - 3} 59.6 Q${front + 3} 62 ${front + 1} 65.5 Q${front + 4} 69 ${front - 2} 72`
  return (
    <g opacity={opacity}>
      <path d={`M-30 59 L${front - 3} 59.6 ${edge.slice(edge.indexOf('Q'))} L-30 73 Z`} fill="#bfe6fa" />
      <path d={edge} fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  )
}

/** おなかが すいて パンを おもう ふきだし。 */
function Dream({ at, show, t }: { readonly at: Point; readonly show: number; readonly t: number }) {
  if (show <= 0) return null
  return (
    <g opacity={show}>
      <circle cx={at[0] - 5.4} cy={at[1] + 8} r="1" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <circle cx={at[0] - 3.4} cy={at[1] + 4.6} r="1.7" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <circle cx={at[0]} cy={at[1]} r="6.4" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
      <Bread at={[at[0], at[1] + wave(t, 1.2) * 0.3]} />
    </g>
  )
}

/** おなかの「ぐう」。からだの まえに、ふるえる 小さな 線。 */
function Rumble({ at, show, t }: { readonly at: Point; readonly show: number; readonly t: number }) {
  if (show <= 0) return null
  const k = 0.5 + 0.5 * Math.abs(wave(t, 0.4))
  return (
    <g opacity={show * k} fill="none" stroke="#8aa0c0" strokeWidth="0.9" strokeLinecap="round">
      <path d={`M${at[0]} ${at[1]} q1.2 -1.2 2.4 0 q1.2 1.2 2.4 0`} />
      <path d={`M${at[0] + 0.6} ${at[1] + 2.6} q1.2 -1.2 2.4 0 q1.2 1.2 2.4 0`} />
    </g>
  )
}

/* ───────── 子ども ───────── */

type Kid = {
  readonly place: { readonly x: number; readonly y: number; readonly pose: PersonPose; readonly lift: number }
  readonly shellAt: Point
  readonly held: boolean
}

/** その しゅんかん の 子の いち・かっこう・かいがらの いち(ぜんぶ 時間から) */
function kidAt(t: number, sand: Point): Kid {
  const walkIn = walk(t, { from: -8, to: PICK_X, start: WALK_START, end: WALK_END, ...KID })
  const carry = walk(t, { from: PICK_X, to: PLACE_X, start: LIFT_END, end: CARRY_END, armSwing: 8, ...KID })
  const carrying = t >= LIFT_END
  const x = carrying ? carry.x : walkIn.x
  const gait = carrying ? carry.pose : walkIn.pose
  // かがむ度合い(0 = まっすぐ / 1 = ひろう ふかさ)
  const crouch = track(t, [[BEND_START, 0], [LIFT_START - 0.1, 1], [LIFT_START, 1], [LIFT_END, 0], [SET_START, 0], [SET_END, 0.45], [LET_GO, 0.45], [LET_GO + 0.3, 0]])
  const body = crouch > 0 ? mixPose(gait, BEND, crouch) : gait
  const hop = t > TOSS_END ? Math.abs(Math.sin((t - TOSS_END) * Math.PI * 2.6)) * during(t, TOSS_END, ZOOM_END, 0.1) * 3 : 0

  // からだ だけ(うでは あとから きめる)で 関節の いち を もとめる
  const stand = { x, y: GROUND, ...KID, pose: { ...body, leftArm: undefined, rightArm: undefined }, lift: hop }
  const rig = personRig(stand)
  const shoulder = rig.world.arms.left.root
  const pelvis = rig.world.pelvis
  const hold = holdPose(stand, 'waist', SHELL_W).at

  // かいがら: 砂はま → だきあげる → 台の上
  const lifted = lerpPt(sand, hold, span(t, LIFT_START, LIFT_END))
  const shellAt: Point = t >= LET_GO ? FOCUS : t >= SET_START ? lerpPt(hold, FOCUS, span(t, SET_START, SET_END)) : lifted
  const catchAt: Point = [PLACE_X + 9, 38 - hop]
  const toss = span(t, TOSS_START, TOSS_END)
  const breadNow = lerpPt(BREAD_REST, catchAt, toss)

  // うで: おなかを おさえる → びっくり → かいがらを だく → パンを うける
  const belly = span(t, HUNGRY, HUNGRY + 0.3) * (1 - span(t, WAVE_LAND - 0.1, WAVE_LAND + 0.1))
  const spread = during(t, SURPRISE, SURPRISE + 0.7, 0.15)
  const grip = span(t, BEND_START + 0.1, LIFT_START - 0.1) * (1 - span(t, LET_GO, LET_GO + 0.25))
  const catching = span(t, 6.6, 7.1)
  const nearAim = (p: Point): Limb => ({ to: [p[0], p[1]] })
  const leftArm = blend(gait.leftArm, [
    [nearAim([pelvis[0] + 4.5, pelvis[1] - 5.5]), belly],
    [nearAim([shoulder[0] + 8.5, shoulder[1] + 1]), spread],
    [nearAim([shellAt[0] - 6.3, shellAt[1] + 5.5]), grip],
    [nearAim([breadNow[0] - 1.6, breadNow[1] + 3.2]), catching],
  ])
  const rightArm = blend(gait.rightArm, [
    [nearAim([shoulder[0] + 7, shoulder[1] - 1]), spread],
    [nearAim([shellAt[0] - 6.3, shellAt[1] + 2.5]), grip],
    [nearAim([breadNow[0] + 1.6, breadNow[1] + 3.6]), catching],
  ])
  return { place: { x, y: GROUND, pose: { ...body, leftArm, rightArm }, lift: hop }, shellAt, held: t >= BEND_START && t < LET_GO }
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)

  // かいがらの いち: 波に のって くる → すなはま
  const shellX = mix(t, WAVE_IN, WAVE_LAND, -9, SAND_X, easeOut)
  const sand: Point = [shellX, GROUND - 10]
  const kid = kidAt(t, sand)
  const rock = t < LIFT_START ? (1 - span(t, WAVE_IN, WAVE_LAND)) * wave(t, 0.45) * 12 : 0
  const shell = <Shell at={kid.shellAt} rock={rock} />

  const head = personRig({ ...kid.place, ...KID }).world.head
  const toss = span(t, TOSS_START, TOSS_END)
  const breadAt: Point = t < TOSS_END ? [BREAD_REST[0] + (PLACE_X + 9 - BREAD_REST[0]) * toss, BREAD_REST[1] + (38 - BREAD_REST[1]) * toss - Math.sin(toss * Math.PI) * 15] : [PLACE_X + 9, 38 - kid.place.lift]
  const face = t < SURPRISE ? 'sad' : t < SURPRISE + 0.7 ? 'surprised' : t < TOSS_END ? 'smile' : 'joy'

  // ぐるっと カメラが かいがらに よる
  const zoom = 1 + (ZOOM - 1) * span(t, ZOOM_START, ZOOM_END, easeInOut)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const wet = span(t, WAVE_IN, WAVE_IN + 0.3) * (1 - span(t, WAVE_LAND + 0.3, WAVE_OUT))
  const front = t < WAVE_LAND ? shellX + 9 : mix(t, WAVE_LAND, WAVE_OUT, SAND_X + 9, -30, easeIn)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Layer scale={zoom} origin={FOCUS}>
          <Scenery t={t} />
          <Stool t={t} />
          <Tongue front={front} opacity={wet} />
          {/* すなはま の かいがら の かげ */}
          <ellipse cx={kid.shellAt[0]} cy="64.6" rx="7" ry="1.4" fill="#000000" opacity={0.12 * span(t, WAVE_IN, WAVE_LAND) * (1 - span(t, LIFT_START, LIFT_END))} />
          <Crab t={t} bread={t < TOSS_START} />
          <Dream at={[head[0] + 9, head[1] - 12]} show={during(t, HUNGRY, WAVE_LAND - 0.2, 0.25)} t={t} />
          {t >= WAVE_IN && !kid.held ? shell : null}
          <Person {...KID} {...kid.place} look={KID_LOOK} face={face} held={kid.held ? shell : undefined} />
          <Rumble at={[kid.place.x + 6.5, 42]} show={during(t, HUNGRY + 0.2, WAVE_LAND - 0.2, 0.2)} t={t} />
          <Notice x={head[0]} y={head[1]} r={7} dir={1} show={during(t, SURPRISE, SURPRISE + 0.7, 0.1)} />
          {t >= TOSS_START ? <Bread at={breadAt} spin={t < TOSS_END ? toss * 540 : 0} /> : null}
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
    { at: 0, label: 'うみべ。はらぺこの 子どもが あるいてくる', sound: 'pop' },
    { at: WAVE_IN, label: '波が かいがらを はこんでくる' },
    { at: SURPRISE, label: '子どもが びっくり', sound: 'pop' },
    { at: LIFT_START, label: 'だいじに だきあげて 台へ' },
    { at: SET_START, label: '台に のせると カニが パンを ぽーん' },
    { at: ZOOM_START, label: 'カメラが かいがらに よる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '貝 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
