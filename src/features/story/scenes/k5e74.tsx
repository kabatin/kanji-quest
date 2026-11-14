/*
 * 年(とし): みのった いねを 人が かついで あるく。いねが みのると いちねん。(共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)  ※ 人は 体の つくり を まもる。字には「だいたい」重なる くらい
 *   1画目(ノ)  … (この絵では 使わない。左うえ の すきまに、きらきら だけ おく)
 *   2画目(一)  … 人の すげがさ(つば)
 *   3画目(一)  … 人の かた に のせた にない ぼう(てんびん ぼう)
 *   4画目(丨)  … 左の いね束 を ぼう から つるす なわ
 *   5画目(一)  … 左の いね束 の しばり なわ → 人の こし の おび → 右の いね束
 *   6画目(丨)  … 人の どう と、りょう足の あいだ
 *
 * ながれ
 *   はたけの いねは まだ みどり。農家の子は 「まだかな」と しんぱい そうに まっている
 *   → いねが 金色に みのって、ほが おもたく たれる。子は びっくり → 大よろこびで ぴょん
 *   → 刈りとって、いね束(たば) を ぼう の りょうはし に つるし、かたに のせる
 *   → にこにこ して いね束を かついで、てまえへ あるいてくる(すずめが とぶ)
 *   → ぴたっと 立つと、ほね が ひかって、絵が うすくなり、字「年」が のこる
 *
 * 人は Person。あるきは walkDepth(おくから てまえへ、正面)。ぼうは かたの うしろ に のせて、りょうてで にぎる。
 * ぼう と いね束 は 人の うしろ(ByDepth で 人の すぐ おく)、おびは held で どう の まえ に 描く。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, Bird, ByDepth, HANG_ARM, LOOKS, mixLimb, PALETTE, Path, Person, personRig, posture, walkDepth, type DepthWalkPlan } from '../sceneFigures'

const CHAR = '年'

const SASH = '#c0502f'
const STRAW = '#e9bf55'
const STRAW_DARK = '#c9962f'
const STRAW_LIGHT = '#f4d77a'
const ROPE = '#a67c52'
const GOLD = '#e8b94a'
const GOLD_LIGHT = '#f6d36e'
const BLADE_DRY = '#c9b55a'

/** くぎり の時間(秒) */
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

/** 人: はたけの おく から てまえへ(字の まんなか x = 58 の 線に そろう)。さいごの 背は 字の 6画目 の 長さ ぐらい */
const FARMER: DepthWalkPlan = { from: [58, 88], to: [58, 97.5], start: WALK, end: WALK_END, build: 'teen', height: 56, toHeight: 70 }
const FARMER_LOOK = { ...LOOKS.boy, hat: 'straw', sleeves: 'long' } as const
/** 背の高さ 70 の ときの ぼうの はんぶん の 長さ、なわの 長さ、手の ひらき(背に くらべた わりあい) */
const POLE_HALF = 0.36
const ROPE_LENGTH = 0.32
const HAND_SPREAD = 0.26

const lerp = (a: number, b: number, k: number) => a + (b - a) * k

const lerpColor = (a: string, b: string, k: number): string => {
  const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const [pa, pb] = [parse(a), parse(b)]
  const mixed = pa.map((v, i) => Math.round(lerp(v, pb[i], Math.min(Math.max(k, 0), 1))))
  return `#${mixed.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/* ───────── はたけ ───────── */

type PlantProps = {
  readonly x: number
  /** 根もと の y */
  readonly base: number
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
function Plant({ x, base, height, ripe, droop, cut, sway }: PlantProps) {
  const h = height * (1 - 0.9 * cut)
  const topX = x + sway * 0.6
  const topY = base - h
  const stalk = lerpColor(PALETTE.leaf, GOLD, ripe)
  const blade = lerpColor(PALETTE.leaf, BLADE_DRY, ripe)
  const earColor = lerpColor(PALETTE.leafLight, GOLD_LIGHT, ripe)
  // ほ の むき: まっすぐ上 → みぎ下へ たれる(くきの さき から そのまま つながる)
  const end = [topX + lerp(0.6, 6.4, droop), topY + lerp(-6, 3, droop)] as const
  const ctrl = [topX + lerp(0.3, 4.4, droop), topY + lerp(-3, -4.4, droop)] as const
  return (
    <g>
      <path d={`M${x} ${base} Q${x + sway * 0.2} ${base - h * 0.5} ${topX} ${topY}`} fill="none" stroke={stalk} strokeWidth="1.5" strokeLinecap="round" />
      <path d={`M${x} ${base - 4} Q${x - 5} ${base - h * 0.5} ${x - 7} ${base - h * 0.46}`} fill="none" stroke={blade} strokeWidth="1.3" strokeLinecap="round" />
      <path d={`M${x} ${base - 7} Q${x + 4.5} ${base - h * 0.55} ${x + 7} ${base - h * 0.5}`} fill="none" stroke={blade} strokeWidth="1.2" strokeLinecap="round" />
      {cut < 1 ? <path d={`M${topX} ${topY} Q${ctrl[0]} ${ctrl[1]} ${end[0]} ${end[1]}`} fill="none" stroke={earColor} strokeWidth="2.7" strokeLinecap="round" opacity={1 - cut} /> : null}
    </g>
  )
}

/** いねの うね。おくの 列 ほど 小さい。まんなかの みち(人が あるく)には 植えない */
const ROWS = [
  { base: 79, height: 24, half: 8 },
  { base: 86, height: 29, half: 12 },
  { base: 99, height: 36, half: 20 },
] as const
const PLANTS = ROWS.flatMap((row, r) => Array.from({ length: 14 }, (_, i) => ({ r, x: 2 + i * 8 + (r % 2) * 4, ...row, phase: i * 0.7 + r })).filter((p) => Math.abs(p.x - 58) > p.half + 3))

function PlantsAt({ t, row }: SceneProps & { readonly row: number }) {
  const grow = Math.max(span(t, 0.2, 1.2, backOut), 0)
  if (grow <= 0) return null
  const ripe = span(t, GOLD_FROM, GOLD_TO, easeInOut)
  const droop = span(t, GOLD_FROM + 0.2, GOLD_TO + 0.2, easeOut)
  const cut = span(t, CUT, CUT + 0.4, easeOut)
  return (
    <>
      {PLANTS.filter((p) => p.r === row).map((p) => (
        <Plant key={`${p.r}-${p.x}`} x={p.x} base={p.base} height={p.height * grow} ripe={ripe} droop={droop} cut={cut} sway={wave(t, 2.6, p.phase) * 1.2} />
      ))}
    </>
  )
}

/* ───────── いね束・ぼう ───────── */

/** いね束。しばった ところ(0, 0)から 下へ ひろがり、さきに 金色の ほが たれる。 */
function Sheaf() {
  const bottom = 23.5
  return (
    <g>
      {[-2, -1, 0, 1, 2].map((k) => (
        <path key={k} d={`M${k * 3} 0 L${k * 4.2} -5.5`} stroke={STRAW_DARK} strokeWidth="1.3" strokeLinecap="round" />
      ))}
      <path d={`M-10 0 C-13 6 -14 16 -13.5 ${bottom} L13.5 ${bottom} C14 16 13 6 10 0 Z`} fill={STRAW} />
      <path d={`M-5 3 V${bottom - 2} M0 3 V${bottom - 1} M5 3 V${bottom - 2}`} stroke={STRAW_DARK} strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />
      {[-11, -5.5, 0, 5.5, 11].map((dx) => (
        <ellipse key={dx} cx={dx} cy={bottom + 0.5} rx="2" ry="3.2" fill={STRAW_LIGHT} />
      ))}
      <path d="M-10.2 1.2 H10.2" stroke={ROPE} strokeWidth="1.8" strokeLinecap="round" />
    </g>
  )
}

type Yoke = { readonly x: number; readonly y: number; readonly height: number; readonly sway: number; readonly pole: number; readonly carry: number }

/** にない ぼう(かた の うしろ)と、りょうはし から なわ で つるした いね束。人の おく に 描く */
function YokeAndSheaves({ x, y, height, sway, pole, carry }: Yoke) {
  const k = height / 70
  const half = POLE_HALF * height
  return (
    <>
      <g transform={`translate(${x} ${y}) scale(${Math.max(pole, 0.001)} 1)`} opacity={pole}>
        <path d={`M${-half} 0 H${half}`} stroke={PALETTE.bark} strokeWidth={3.4 * k} strokeLinecap="round" />
      </g>
      {carry > 0
        ? ([-1, 1] as const).map((side) => (
            <g key={side} transform={`translate(${x + side * (half - 1.5 * k)} ${y}) rotate(${sway}) scale(${Math.max(carry, 0.001) * k})`}>
              <path d={`M0 0 V${(ROPE_LENGTH * height) / k}`} stroke={ROPE} strokeWidth="1.3" strokeLinecap="round" />
              <g transform={`translate(0 ${(ROPE_LENGTH * height) / k})`}>
                <Sheaf />
              </g>
            </g>
          ))
        : null}
    </>
  )
}

/** こしの おび(あかい ぬの)。どう の まえ に まく */
function Sash({ x, y, width, height }: { readonly x: number; readonly y: number; readonly width: number; readonly height: number }) {
  return (
    <g>
      <rect x={x - width / 2 - 0.4} y={y} width={width + 0.8} height={height} rx={height * 0.4} fill={SASH} />
      <path d={`M${x + width * 0.2} ${y + height} l-1.2 ${height * 1.5} h2.4 l1.2 -${height * 1.5} Z`} fill={SASH} />
    </g>
  )
}

/* ───────── にぎやかし ───────── */

/** 刈りとった しゅんかん の きらきら */
function HarvestStars({ t }: SceneProps) {
  const p = span(t, CUT, CUT + 0.7)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p * p}>
      <Star cx={14} cy={74 - p * 8} r={3.2 * (1 - p * 0.3)} color="#ffd95a" spin={p * 160} />
      <Star cx={96} cy={78 - p * 8} r={3.2 * (1 - p * 0.3)} color="#ffffff" spin={p * 160} />
      <Star cx={30} cy={86 - p * 6} r={2.4 * (1 - p * 0.3)} color="#ff7a4d" spin={p * 160 + 40} />
      <Star cx={86} cy={88 - p * 6} r={2.4 * (1 - p * 0.3)} color="#ffd95a" spin={p * 160 + 80} />
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

  // 人: おくに 立って ぽん と出る → ジャンプ → ぼうを かついで てまえへ あるく
  const farmer = walkDepth(t, FARMER)
  const appear = span(t, 0, 0.5, backOut)
  const face = t < 1.8 ? 'worried' : t < JUMP_FROM ? 'surprised' : t < CUT + 1 ? 'joy' : 'smile'
  const jump = Math.sin(span(t, JUMP_FROM, JUMP_TO) * Math.PI) * 6
  const walking = farmer.moving ? 1 : 0

  // かた の たかさ・ぼう の たかさ は 体から きまる(うで の ポーズ に よらない)
  const base = { x: farmer.x, y: farmer.y, build: farmer.build, height: farmer.height, facing: 'front', lift: jump } as const
  const rig = personRig({ ...base, pose: {} })
  const poleY = rig.world.arms.left.root[1] - 0.5
  const spread = HAND_SPREAD * farmer.height
  // 手は ぼうを にぎる(右手 = 画面の 左)
  const holdRight = { to: [farmer.x - spread, poleY + 1] } as const
  const holdLeft = { to: [farmer.x + spread, poleY + 1] } as const
  const banzai = posture('banzai', 'front')
  const up = span(t, JUMP_FROM, JUMP_FROM + 0.3, easeOut)
  const grip = span(t, CUT, CUT + 0.6, easeInOut)
  const armR = mixLimb(mixLimb(farmer.pose.rightArm ?? HANG_ARM, banzai.rightArm ?? HANG_ARM, up), holdRight, grip)
  const armL = mixLimb(mixLimb(farmer.pose.leftArm ?? HANG_ARM, banzai.leftArm ?? HANG_ARM, up), holdLeft, grip)
  const worry = t < JUMP_FROM ? wave(t, 1.4) * 3 : 0
  const pose = { ...farmer.pose, rightArm: armR, leftArm: armL, head: worry }

  const carry = span(t, CUT + 0.5, CUT + 1.0, backOut)
  const poleOn = span(t, CUT + 0.1, CUT + 0.5, easeOut)
  const sway = wave(t, 0.62) * 3 * walking
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.05
  const sash = (
    <Sash x={rig.world.pelvis[0]} y={rig.world.pelvis[1] - 0.17 * farmer.height} width={rig.body.torsoFrontW * rig.scale} height={0.05 * farmer.height} />
  )
  const bird = span(t, WALK + 0.2, WALK_END)

  const items = [
    ...[0, 1, 2].map((row) => ({ key: `row${row}`, z: ROWS[row].base, node: <PlantsAt t={t} row={row} /> })),
    { key: 'yoke', z: farmer.y - 0.01, node: <YokeAndSheaves x={farmer.x} y={poleY} height={farmer.height} sway={sway} pole={poleOn} carry={carry} /> },
    {
      key: 'farmer',
      z: farmer.y,
      node: (
        <g transform={`translate(${farmer.x} ${farmer.y}) scale(${Math.max(appear, 0.001)}) translate(${-farmer.x} ${-farmer.y})`}>
          <Person {...base} pose={pose} look={FARMER_LOOK} face={face} held={sash} />
        </g>
      ),
    },
  ]

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[97, 12]} clouds={[[14, 9, 0.9]]} tufts={[]} />
        <Path near={[58, 108, 44]} far={[58, 76, 12]} />
        <ByDepth items={items} />
        {bird > 0 && bird < 1 ? <Bird x={116 - bird * 124} y={13 + Math.sin(bird * 7) * 3} t={t} flying facing="left" /> : null}
        <HarvestStars t={t} />
        <Hum t={t} />
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
