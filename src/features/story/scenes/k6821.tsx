/*
 * 校(こう): 木で たてた まなびや。右は 音(こう)の しるし。(共通部品 sceneFigures で 書きなおした もの)
 *
 * ほね(画と絵の対応)
 *   1〜4画目(木) … 左に立つ 大きな木。1画目 = よこに のびた えだ / 2画目 = みき /
 *                  3・4画目 = 左と右に たれた えだ
 *   5画目(丨)    … やねの まんなかの はしら(きんぐぽすと)
 *   6画目(一)    … やねの 下の よこ木(のき の はり)
 *   7・8画目     … はり の下を ささえる、ななめの つっぱり(左と右)
 *   9・10画目    … かべに うちつけた、ばってんの 木(すじかい)
 *
 * ながれ
 *   お日さまが てって、木が そだつ。左では ランドセルの子が、まなぶ ばしょが なくて しょんぼり
 *   → 右から だいくさんが あるいてくる。子を見て「そうだ!」と ひらめく
 *   → とんかち とんとん。かべ → ばってんの 木 → はり → やね と、木で いえが たつ
 *   → 子は ぴょんぴょん よろこび、だいくさんも「できた!」と こぶしを あげる
 *   → ほね が ひかって、絵が うすくなり、字「校」が のこる
 *
 * 人は Person(左むき の だいくさん・右むき の 子)。あるきは walk()、とんかち は tools の ぼう + 先の 金づち、
 * 手は { to } で かべの 前へ。はちまき は headwear、こし の ベルト は held、子の ランドセル は pack、通学ぼうは look.hat。
 * 木・いえ・金づち の あたま は 部品が ない ので ここで 描く。
 */
import { backOut, during, easeIn, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, HANG_ARM, LOOKS, mixLimb, PALETTE, Person, personRig, Sweat, toolEnds, walk, type Limb, type PersonProps } from '../sceneFigures'

const CHAR = '校'

const BARK = PALETTE.bark
const BARK_DARK = PALETTE.barkDark
const LEAF = PALETTE.leaf
const LEAF_DARK = PALETTE.leafDark
const LEAF_LIGHT = PALETTE.leafLight
const PLANK = '#f0d4a0'
const PLANK_LINE = '#d9b77c'
const ROOF = '#d9604c'
const GABLE = '#f6e2b8'
const WINDOW = '#bfe3f7'

/** くぎり の時間(秒) */
const WALK_FROM = 0.9
const WALK_TO = 2.5
/** ひらめく(まっ白な ほし が あたまの上に ぽん) */
const IDEA = 2.9
/** とんかち が はじまる(さいしょの ふりあげ) */
const HAMMER_START = 3.2
const SWING = 0.7
/** 4回 たたく。たたいた しゅんかん に、いえの 一部が たつ */
const HITS: readonly number[] = [3.9, 4.6, 5.3, 6.0]
const CHEER = 6.3
const INK = 7.0
const DONE = 10.4
const DURATION = 11

const GROUND_Y = 96

const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/* ───────── 木 ───────── */

/** 左に立つ 木。画の線を そのまま みき・えだ にする(本来 その形のもの) */
function Tree({ t }: SceneProps) {
  const trunk = span(t, 0, 0.55, backOut)
  const boughs = span(t, 0.3, 0.75, backOut)
  const leaves = span(t, 0.5, 1.0, backOut)
  const sway = wave(t, 3.4) * 1.3
  return (
    <>
      <ellipse cx="31" cy="97.6" rx={15 * trunk} ry="2.8" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.6 + 0.4 * trunk} scaleY={trunk} origin={[30.7, 96]}>
        <path d="M23 97 Q29.5 92 28.6 84 L33.4 84 Q33 92 38.6 97 Z" fill={BARK} />
        <Bone char={CHAR} n={2} color={BARK} width={8.6} />
        <path d="M29.2 56 q1.4 5 0 10 M32.4 70 q-1.2 5 0.2 9" fill="none" stroke={BARK_DARK} strokeWidth="1.2" strokeLinecap="round" />
      </Layer>
      <Layer scale={boughs} origin={[30.5, 40]}>
        <Bone char={CHAR} n={1} color={BARK} width={5.2} />
        <Bone char={CHAR} n={3} color={BARK} width={5} />
        <Bone char={CHAR} n={4} color={BARK} width={4.4} />
      </Layer>
      {/* えだの先の 小さな しげみ */}
      <Layer scale={leaves} origin={[30.5, 40]} rotate={sway * 0.6}>
        <circle cx="12" cy="40" r="5.2" fill={LEAF_DARK} />
        <circle cx="13.5" cy="38" r="3.8" fill={LEAF} />
        <circle cx="42.5" cy="36.5" r="5.2" fill={LEAF_DARK} />
        <circle cx="41" cy="34.6" r="3.6" fill={LEAF} />
        <circle cx="15" cy="70.5" r="4.4" fill={LEAF_DARK} />
        <circle cx="14.2" cy="69" r="3" fill={LEAF} />
        <circle cx="41" cy="59.5" r="3.8" fill={LEAF_DARK} />
        <circle cx="40.4" cy="58.4" r="2.6" fill={LEAF} />
      </Layer>
      {/* 上の しげみ: 風で ゆっくり ゆれる */}
      <Layer scale={leaves} rotate={sway} origin={[30, 34]}>
        <circle cx="17.5" cy="27" r="10.5" fill={LEAF_DARK} />
        <circle cx="42" cy="27" r="9.5" fill={LEAF_DARK} />
        <circle cx="29.5" cy="17" r="13" fill={LEAF_DARK} />
        <circle cx="21" cy="26.5" r="8.5" fill={LEAF} />
        <circle cx="38.5" cy="26.5" r="8" fill={LEAF} />
        <circle cx="29.5" cy="20.5" r="9.5" fill={LEAF} />
        <circle cx="24" cy="14.5" r="4.2" fill={LEAF_LIGHT} />
        <circle cx="36" cy="18" r="3" fill={LEAF_LIGHT} />
      </Layer>
    </>
  )
}

/* ───────── 木の いえ(まなびや) ───────── */

const WALL_LEFT = 48
const WALL_RIGHT = 94
const WALL_TOP = 31
const WALL_BOTTOM = 92
/** いえの たつ じゅんばん(たたく たびに ひとつ) */
const pop = (t: number, hit: number, ease = backOut) => span(t, hit - 0.05, hit + 0.45, ease)

function House({ t }: SceneProps) {
  const wall = pop(t, HITS[0])
  const braceA = span(t, HITS[1] - 0.05, HITS[1] + 0.3, easeOut)
  const braceB = span(t, HITS[1] + 0.2, HITS[1] + 0.5, easeOut)
  const beam = pop(t, HITS[2])
  const roof = pop(t, HITS[3])
  const flag = span(t, HITS[3] + 0.15, HITS[3] + 0.7, backOut)
  const flap = wave(t, 0.8) * 1.6
  return (
    <>
      {wall > 0 && (
        <Layer scaleY={wall} origin={[(WALL_LEFT + WALL_RIGHT) / 2, WALL_BOTTOM]}>
          <rect x={WALL_LEFT} y={WALL_TOP} width={WALL_RIGHT - WALL_LEFT} height={WALL_BOTTOM - WALL_TOP} fill={PLANK} />
          <path d="M48 62.5 H94 M48 74 H94 M48 85 H94" stroke={PLANK_LINE} strokeWidth="0.8" opacity="0.7" />
          <circle cx="69" cy="44" r="4.6" fill={WINDOW} />
          <path d="M69 39.4 v9.2 M64.4 44 h9.2" stroke={BARK_DARK} strokeWidth="1" />
          <rect x={WALL_LEFT} y={WALL_TOP} width="3.6" height={WALL_BOTTOM - WALL_TOP} fill={BARK_DARK} />
          <rect x={WALL_RIGHT - 3.6} y={WALL_TOP} width="3.6" height={WALL_BOTTOM - WALL_TOP} fill={BARK_DARK} />
          <rect x={WALL_LEFT - 1} y={WALL_BOTTOM - 1} width={WALL_RIGHT - WALL_LEFT + 2} height="3.2" rx="1.2" fill={BARK_DARK} />
        </Layer>
      )}
      <Bone char={CHAR} n={9} color={BARK} width={4.2} to={braceA} />
      <Bone char={CHAR} n={10} color={BARK} width={4.2} to={braceB} />
      {roof > 0 && (
        <Layer scale={roof} origin={[70, 31]}>
          <path d="M46 31.6 L68 12.5 L95 29.4 Z" fill={GABLE} />
          <Bone char={CHAR} n={5} color={BARK} width={2.8} />
          <path d="M44.5 33 L68 12.2 L96.5 30.2" fill="none" stroke={ROOF} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
        </Layer>
      )}
      {beam > 0 && (
        <Layer scale={beam} origin={[70, 32]}>
          <Bone char={CHAR} n={6} color={BARK} width={4.6} />
          <Bone char={CHAR} n={7} color={BARK} width={3.4} />
          <Bone char={CHAR} n={8} color={BARK} width={3.4} />
        </Layer>
      )}
      {/* やねの てっぺんに はた。かぜで はためく */}
      {flag > 0 && (
        <Layer scale={flag} origin={[68, 12.5]}>
          <path d="M68 12.5 L68.5 2.6" stroke={BARK_DARK} strokeWidth="1.1" strokeLinecap="round" />
          <path d={`M68.5 3 Q74 ${2 + flap} 80 ${4 + flap * 0.5} Q74 ${6.6 + flap} 68.5 8 Z`} fill="#e8534a" />
        </Layer>
      )}
    </>
  )
}

/* ───────── 人(だいくさん・子ども) ───────── */

/** うで の かっこう(まえ へ ふり あげる・よろこび) */
const CHEER_ARM: Limb = { swing: 150, bend: 15 }

/** はちまき(あたまの まんなか が 0,0、半径 1。右むき の 形で。つなぎめ の しっぽ は うしろ へ) */
const HEADBAND = (
  <g fill="none" stroke="#ffffff" strokeLinecap="round">
    <path d="M-0.98 -0.3 Q0 -0.78 0.98 -0.42" strokeWidth="0.3" />
    <path d="M-0.98 -0.3 l-0.55 -0.15 M-0.98 -0.3 l-0.48 0.3" strokeWidth="0.2" />
  </g>
)

const CARPENTER_LOOK = { ...LOOKS.man, hair: PALETTE.hair, top: '#e8923a', bottom: '#8a6a4a', shoes: '#5b4030', sleeves: 'long' } as const
const KID_LOOK = { ...LOOKS.boy, top: '#8fd0f0', bottom: '#3e5c86', shoes: '#e8534a', hat: 'school' } as const

/** だいくさん の 立つ場所(こし の x)・背の高さ。うでの のび の ぶん、いえの かべ(右はし 94)の すぐ そば */
const CARPENTER_X = 101
const CARPENTER_HEIGHT = 56
const KID_X = 12
const KID_HEIGHT = 40
/** とんかち の 長さ と、かべを たたく ときの 手・ふりあげた 手 の 場所 */
const HAMMER_LENGTH = 9
const HAND_STRUCK: Limb = { to: [98, 69] }
const HAND_RAISED: Limb = { to: [98, 46] }

/** とんかち の 1 サイクル(ふりあげる 0.7 → ふりおろす)。0 = うった しゅんかん の かっこう、1 = ふりあげ */
function hammerRaise(t: number): number {
  const c = (t - (HITS[0] - SWING)) / SWING
  if (c < 0 || c >= HITS.length) return 0
  const f = c % 1
  return f < 0.7 ? easeOut(f / 0.7) : 1 - easeIn((f - 0.7) / 0.3)
}

/** だいくさん の 場所と かっこう。あるいてきて、ひらめき、とんかち、こぶしを あげる */
function carpenterAt(t: number): PersonProps & { readonly hammerAngle: number } {
  const walking = walk(t, { from: CARPENTER_X + 42, to: CARPENTER_X, start: WALK_FROM, end: WALK_TO, build: 'adult', height: CARPENTER_HEIGHT, armSwing: 18, step: 14 })
  const work = span(t, HAMMER_START - 0.3, HAMMER_START) * (1 - span(t, HITS[3] + 0.1, HITS[3] + 0.4))
  const cheer = span(t, CHEER, CHEER + 0.4, easeOut)
  const raise = hammerRaise(t)
  const nearBase = walking.pose.rightArm ?? HANG_ARM
  const farBase = walking.pose.leftArm ?? HANG_ARM
  const hammering = mixLimb(HAND_STRUCK, HAND_RAISED, raise)
  const near = mixLimb(mixLimb(nearBase, hammering, work), CHEER_ARM, cheer)
  const far = mixLimb(mixLimb(farBase, { swing: 30, bend: 40 }, work), CHEER_ARM, cheer)
  const hop = cheer > 0 ? Math.abs(Math.sin((t - CHEER) * Math.PI * 2.4)) * 2.2 * cheer : 0
  const face = t < WALK_TO ? 'normal' : t < IDEA ? 'worried' : t < CHEER ? 'normal' : 'joy'
  // とんかち は ふりあげた とき 上むき、うった とき かべ(左)むき、たらした とき 下むき
  const hammerAngle = lerp(lerp(100, lerp(180, 235, raise), work), 100, cheer)
  return {
    ...walking,
    y: GROUND_Y,
    lift: hop,
    look: CARPENTER_LOOK,
    face,
    headwear: HEADBAND,
    pose: { ...walking.pose, rightArm: near, leftArm: far, head: t < IDEA ? 0 : 4 * (1 - cheer) },
    hammerAngle,
  }
}

/** 子の 場所と かっこう(右むき)。しょんぼり → ぴょんぴょん よろこぶ */
function kidAt(t: number): PersonProps {
  const happy = span(t, CHEER, CHEER + 0.3)
  const sadness = t < 4.2 ? 1 : 1 - span(t, 4.2, 4.8)
  const hop = Math.abs(Math.sin((t - CHEER) * Math.PI * 2.2)) * 4.5 * happy
  const sway = wave(t, 0.9) * 0.4
  const face = t < 4.2 ? 'sad' : t < CHEER ? 'normal' : 'joy'
  return {
    x: KID_X,
    y: GROUND_Y,
    build: 'child',
    height: KID_HEIGHT,
    facing: 'right',
    lift: hop,
    look: KID_LOOK,
    pack: 'randoseru',
    face,
    opacity: span(t, 0.25, 0.6),
    pose: {
      leftArm: mixLimb({ swing: 3 + sway, bend: 8 }, CHEER_ARM, happy),
      rightArm: mixLimb({ swing: 3 - sway, bend: 8 }, { swing: 145, bend: 20 }, happy),
      torso: 5 * sadness,
      head: 12 * sadness - happy * 4,
    },
  }
}

/* ───────── にぎやかし ───────── */

/** ひらめき: だいくさんの あたまの上に ほし が ぽん */
function Idea({ t, x, y }: { readonly t: number; readonly x: number; readonly y: number }) {
  const show = during(t, IDEA, IDEA + 0.8, 0.2)
  if (show <= 0) return null
  const grow = Math.max(0, span(t, IDEA, IDEA + 0.3, backOut))
  return (
    <g opacity={show}>
      <Star cx={x} cy={y - 11} r={5.5 * grow} color="#ffd24a" spin={wave(t, 0.6) * 12} />
      <path d={`M${x - 7} ${y - 8} l-2.4 1.6 M${x + 7} ${y - 8} l2.4 1.6`} stroke="#f2b632" strokeWidth="1" strokeLinecap="round" />
    </g>
  )
}

/** たたいた しゅんかん に とびちる 木くず */
function Chips({ t }: SceneProps) {
  return (
    <>
      {HITS.map((hit) => {
        const p = span(t, hit, hit + 0.4)
        if (p <= 0 || p >= 1) return null
        return (
          <g key={hit} opacity={1 - p}>
            {[0, 1, 2].map((i) => (
              <rect key={i} x="-0.9" y="-0.5" width="1.8" height="1" rx="0.4" fill="#d9b77c" transform={`translate(${92 - p * (5 + i * 2)} ${72 - p * (6 - i * 2) + p * p * 9}) rotate(${p * 200 + i * 60})`} />
            ))}
          </g>
        )
      })}
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 10)
  const carpenter = carpenterAt(t)
  const kid = kidAt(t)
  const carpenterRig = personRig(carpenter)
  const kidRig = personRig(kid)
  const hand = carpenterRig.world.arms.right.end
  const hammer = toolEnds({ kind: 'stick', angle: carpenter.hammerAngle, length: HAMMER_LENGTH }, hand, carpenterRig.scale)
  // ベルト: こし に まく 茶色の おび(だいくさんの こし の 場所に ついていく)
  const [hipX, hipY] = carpenterRig.world.pelvis
  const beltWidth = carpenterRig.body.torsoW * carpenterRig.scale
  const belt = (
    <>
      <rect x={hipX - beltWidth / 2} y={hipY - 2.6} width={beltWidth} height="2" fill="#5b4030" />
      <rect x={hipX - 1} y={hipY - 3} width="3.2" height="2.8" rx="0.6" fill="#6b4a36" />
    </>
  )
  // 金づち の あたま(ぼうの 先に つく 小さな 四角)
  const headAngle = carpenter.hammerAngle
  const kidHead = kidRig.world.head
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[98, 13]} clouds={[[-2, 52, 0.9], [80, 6, 0.8]]} tufts={[5, 44, 100]} />
        <Tree t={t} />
        <House t={t} />
        <Person {...kid} />
        <Sweat t={t} x={kidHead[0] - 7} y={kidHead[1] - 2} show={during(t, 0.7, 4.6, 0.3)} />
        <Person {...carpenter} tools={{ right: { kind: 'stick', angle: carpenter.hammerAngle, length: HAMMER_LENGTH } }} held={belt} />
        <g transform={`translate(${hammer.tip[0]} ${hammer.tip[1]}) rotate(${headAngle})`}>
          <rect x="-1.4" y="-3.2" width="3.4" height="6.4" rx="0.8" fill="#8a929c" />
        </g>
        <Chips t={t} />
        <Idea t={t} x={carpenterRig.world.head[0]} y={carpenterRig.world.head[1] - carpenterRig.body.headR * carpenterRig.scale} />
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
    { at: 0, label: '木が そだつ。子が しょんぼり', sound: 'pop' },
    { at: WALK_FROM, label: 'だいくさんが あるいてくる' },
    { at: IDEA, label: '子を見て「そうだ!」とひらめく', sound: 'pop' },
    { at: HAMMER_START, label: 'とんかち とんとん', sound: 'stroke' },
    { at: HITS[2], label: '木の いえが たっていく' },
    { at: CHEER, label: 'できた! 子も だいくさんも よろこぶ', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '校 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
