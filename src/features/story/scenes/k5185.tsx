/*
 * 内(うち): 雨の中、家の いりぐちから 中に はいると、そこが「うち」。(共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … 家の 左の かべ
 *   2画目(𠃍)  … 家の やね と 右の かべ(右の かべの 下は、いりぐち の とびら)
 *   3・4画目(入) … 家の中に はいった子の 体と あし(中に「入る」すがた)
 *                  (字と ぴったりは 重ならない。子は ほんものの 人の つくり で かく)
 *
 * ながれ
 *   雨が ふる → 葉っぱの かさを さした子が、さむそうに あるいてくる
 *   → 家の いりぐちで ぶるぶる。とびらが あいて、あたたかい ひかりが もれる
 *   → 葉っぱを かべに たてかけて、中に はいる。とびらが しまる(雨は そとの もの)
 *   → あったかい 家の中で にっこり、りょうてを あげて 大よろこび
 *   → ほね が ひかって、絵が うすくなり、字「内」が のこる
 *
 * 人は Person。あるきは walk、かさ を もつ うで は holdPose('overhead')。むきは ずっと 左(家の ほう)。
 * 雨は Rain を 3つ(やね の 上は やね で とまる ように、はば で 分ける)。家・へや・葉っぱの かさ は ここで 描く。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, HANG_ARM, holdPose, LOOKS, mixLimb, PALETTE, Person, Rain, walk, type Look, type PersonProps } from '../sceneFigures'

const CHAR = '内'

const WOOD = '#c98a54'
const WOOD_DARK = '#a8764a'
const DOOR = '#b9774a'
const LEAF = PALETTE.leaf
const LEAF_DARK = PALETTE.leafDark
const WARM = '#fff0c2'
const LAMP = '#ffb84a'

/** 子の 見た目(きいろい 上着・あおい ズボン・あかい くつ) */
const KID_LOOK: Look = { ...LOOKS.boy, top: '#ffc04a', bottom: '#3e5c86' }

/** くぎり の時間(秒) */
const COME = 0.8
const AT_DOOR = 2.4
const OPEN = 2.6
const PUT_DOWN = 3.0
const ENTER = 3.3
const CLOSE = 4.4
const CHEER = 4.95
const INK = 5.8
const DONE = 8.4
const DURATION = 9

/** 子の 足もとの 高さ(家の ゆか) と、いりぐち・まん中の x */
const FLOOR_Y = 93.5
const KID_HEIGHT = 38
const WAIT_X = 97
const HOME_X = 55
/** やね の 高さ(雨は ここで とまる)・地面・かさの はば */
const ROOF_Y = 30
const GROUND_Y = 95
const LEAF_WIDTH = 24

/** 子が さむい あいだ(ぶるぶる) */
const COLD_UNTIL = ENTER + 0.1

/* ───────── 家と へや ───────── */

/** 家の中: あたたかい ひかり・ランプ・ちゃわんの ある つくえ。 */
function Interior({ t }: SceneProps) {
  const steam = (i: number) => {
    const p = (t * 0.6 + i * 0.33) % 1
    return <path key={i} d={`M${33 + i * 1.6 + Math.sin(p * 6 + i) * 0.8} ${77 - p * 6} q1 -1.4 0 -2.6`} fill="none" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" opacity={Math.sin(p * Math.PI) * 0.8} />
  }
  return (
    <>
      <rect x="27" y="33" width="59" height="60.5" fill={WARM} />
      <ellipse cx="56" cy="93.2" rx="16" ry="1.6" fill="#e8806f" />
      {/* ランプ: ひもで つるす */}
      <circle cx="54" cy="48" r="13" fill="#ffe58a" opacity={0.3 + 0.04 * wave(t, 2.2)} />
      <path d="M54 33 V41" stroke={WOOD_DARK} strokeWidth="0.8" />
      <path d="M48.6 47.6 Q54 39 59.4 47.6 Z" fill={LAMP} />
      <circle cx="54" cy="48.2" r="1.9" fill="#fff6c8" />
      {/* つくえ と ゆげの出る ちゃわん */}
      <rect x="28.6" y="80" width="12.4" height="2.6" rx="1.2" fill={WOOD_DARK} />
      <path d="M30.6 82.6 V93.4 M39 82.6 V93.4" stroke={WOOD_DARK} strokeWidth="1.6" strokeLinecap="round" />
      <rect x="32" y="76.6" width="5" height="3.6" rx="1.2" fill="#ffffff" />
      <path d="M32.4 77.4 h4.2" stroke={PALETTE.heart} strokeWidth="0.8" />
      {[0, 1].map(steam)}
    </>
  )
}

/** いりぐち の とびら と、もれてくる ひかり。 */
function Door({ open }: { readonly open: number }) {
  return (
    <>
      <rect x="85.2" y="52" width="6.6" height="41.5" fill="#ffe9a0" opacity={open} />
      <polygon points="91.5,58 109,96 91.5,93.5" fill="#ffe9a0" opacity={open * 0.55} />
      <Layer scaleX={1 - 0.85 * open} origin={[85.4, 70]}>
        <rect x="85.4" y="52" width="6.2" height="41.5" rx="1" fill={DOOR} />
        <circle cx="89.6" cy="75" r="0.9" fill="#ffd24a" />
      </Layer>
    </>
  )
}

/** かべに たてかけた 葉っぱの かさ。 */
function LeanLeaf({ show }: { readonly show: number }) {
  if (show <= 0) return null
  return (
    <Layer scale={show} origin={[98, 94]} rotate={-14}>
      <path d="M98 94 C92 84 93 70 98 62 C103 70 104 84 98 94 Z" fill={LEAF} />
      <path d="M98 93 V66" stroke={LEAF_DARK} strokeWidth="0.9" strokeLinecap="round" />
    </Layer>
  )
}

/** 手に もつ 葉っぱの かさ。at は かさの まんなか(holdPose の at)。しまうとき ちいさくなる */
function LeafUmbrella({ at, size }: { readonly at: readonly [number, number]; readonly size: number }) {
  if (size <= 0) return null
  const half = LEAF_WIDTH / 2
  return (
    <Layer x={at[0]} y={at[1]} scale={size} origin={[0, 3]}>
      <path d={`M0 3 L0 0.6`} stroke={LEAF_DARK} strokeWidth="0.9" strokeLinecap="round" />
      <path d={`M${-half} 1 C${-half * 0.8} -5.4 ${half * 0.8} -5.4 ${half} 1 C${half * 0.5} 3 ${-half * 0.5} 3 ${-half} 1 Z`} fill={LEAF} />
      <path d={`M${-half * 0.9} 1 C${-half * 0.4} -1 ${half * 0.4} -1 ${half * 0.8} 1`} fill="none" stroke={LEAF_DARK} strokeWidth="0.8" strokeLinecap="round" />
    </Layer>
  )
}

/** さむくて ぶるぶる。 */
function Shiver({ t, x }: SceneProps & { readonly x: number }) {
  const show = during(t, AT_DOOR + 0.05, PUT_DOWN, 0.12)
  if (show <= 0) return null
  const j = wave(t, 0.14) * 0.6
  return (
    <g opacity={show} stroke="#5f7fd6" strokeWidth="0.8" strokeLinecap="round" fill="none" transform={`translate(${x + j} ${FLOOR_Y - 20})`}>
      <path d="M8 -4 q1.4 1.6 0 3.2 q-1.4 1.6 0 3.2" />
      <path d="M-9 -3 q-1.4 1.6 0 3.2 q1.4 1.6 0 3.2" />
    </g>
  )
}

/* ───────── 子ども ───────── */

/** 子の 場所・かっこう と、手に もつ かさ(held)。あるいて きて → ぶるぶる → かさを おろして 中へ → 大よろこび */
function kidAt(t: number): { readonly props: PersonProps; readonly umbrella: readonly [number, number]; readonly size: number } {
  const goes = t < ENTER
  const w = goes
    ? walk(t, { from: WAIT_X + 23, to: WAIT_X, start: COME, end: AT_DOOR, build: 'child', height: KID_HEIGHT })
    : walk(t, { from: WAIT_X, to: HOME_X, start: ENTER, end: CLOSE + 0.1, build: 'child', height: KID_HEIGHT })
  const place = { x: w.x, y: FLOOR_Y, build: 'child', height: KID_HEIGHT, facing: 'left', pose: w.pose } as const
  const hold = holdPose(place, 'overhead', LEAF_WIDTH)
  const putDown = span(t, PUT_DOWN, ENTER, easeInOut)
  const cheer = span(t, CHEER, CHEER + 0.35, backOut)
  const cheerArm = { swing: 150, bend: 12 }
  const arm = (side: 'leftArm' | 'rightArm') => mixLimb(mixLimb(hold.pose[side] ?? HANG_ARM, w.pose[side] ?? HANG_ARM, putDown), cheerArm, cheer)
  const shiver = t >= AT_DOOR && t < PUT_DOWN ? wave(t, 0.14) * 0.6 : 0
  const hop = t >= CHEER && t < INK ? Math.abs(Math.sin((t - CHEER) * Math.PI * 2.2)) * 2.6 : 0
  const face = t < COLD_UNTIL ? 'worried' : t < CHEER ? 'smile' : 'joy'
  const props: PersonProps = { ...place, x: w.x + shiver, lift: hop, look: KID_LOOK, face, pose: { ...w.pose, leftArm: arm('leftArm'), rightArm: arm('rightArm') } }
  return { props, umbrella: hold.at, size: Math.max(0, 1 - putDown) }
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)
  const { props, umbrella, size } = kidAt(t)
  const open = span(t, OPEN, OPEN + 0.5, easeOut) * (1 - span(t, CLOSE, CLOSE + 0.5, easeInOut))
  const rain = span(t, 0.35, 0.9)
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={null} overcast={rain} clouds={[[30, 9, 1.1], [88, 9, 1.1]]} tufts={[6, 40, 100]} />
        {/* いりぐち の まえの みずたまり */}
        <ellipse cx="102" cy="96.4" rx="6.4" ry="1.5" fill="#a9d9f7" />
        <Interior t={t} />
        <Door open={open} />
        {/* 家: 左の かべ・やね・右の かべ(右の かべの 下は とびら の ぶん あけておく) */}
        <rect x="20" y="93" width="71" height="3" rx="1.2" fill={WOOD_DARK} />
        <Bone char={CHAR} n={1} color={WOOD} width={6} />
        <Bone char={CHAR} n={2} color={WOOD} width={6} to={0.62} />
        {/* 雨: 家の やね の 上は やね で とまり、そとは 地面まで おちる */}
        <Rain t={t} amount={rain} ground={GROUND_Y} left={-2} right={24} />
        <Rain t={t} amount={rain} ground={ROOF_Y} left={24} right={88} />
        <Rain t={t} amount={rain} ground={GROUND_Y} left={88} right={111} />
        <LeanLeaf show={span(t, PUT_DOWN + 0.1, PUT_DOWN + 0.35, backOut)} />
        <Person {...props} opacity={span(t, COME - 0.3, COME - 0.1)} held={<LeafUmbrella at={umbrella} size={size} />} />
        <Shiver t={t} x={props.x} />
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
    { at: 0, label: '雨が ふる', sound: 'pop' },
    { at: COME, label: '葉っぱの かさを さした子が あるいてくる' },
    { at: AT_DOOR, label: 'いりぐちで ぶるぶる。とびらが あく', sound: 'pop' },
    { at: ENTER, label: 'かさを たてかけて、家の中へ はいる' },
    { at: CLOSE, label: 'とびらが しまる' },
    { at: CHEER, label: 'あったかい うちで 大よろこび', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '内 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
