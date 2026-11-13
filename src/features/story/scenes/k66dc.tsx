/*
 * 曜(ヨウ): おひさまが ぴかぴか ひかる。右がわは ヨウの 音(おと)。
 * 「にちようび」の「よう」。お日さまの下で、小鳥が はねを ひろげて うたう。
 *
 * ほね(画と絵の対応)
 *   1〜4画目(日)  … 左がわに のぼってきた お日さま(まるい お日さまを 日の わく の場所に おく)
 *   5〜10画目(羽) … 小鳥が 上に ひろげた 2まいの はね(左と右)
 *   11〜18画目(隹) … 小鳥の からだ と 木の えだ(とまり木)。隹 は「ふるどり」の字
 *
 * ながれ
 *   さむい あさ。小鳥が 木の えだで ふくらんで ぶるぶる ふるえている(目はとじている)
 *   → お日さまが のぼって ぴかぴか。ひかりが あたって、小鳥は あたたかくなって 目をあける
 *   → うれしくて はねを ぱっと 上にひろげ、ぴよぴよ うたう
 *   → ほね が ひかって、絵が うすくなり、字「曜」が のこる
 *
 * 小鳥は、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   はね は かた(せなか の上)から のびる。あしは からだの下から 出て えだ を つかむ。
 *   くちばし は 顔の まえ。体は よこむき。
 *   はねを ひろげるのは、あたたかくなって のびを した 自然な動き。そのとき 字の 羽 と だいたい 重なる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '曜'

const SUN = '#ffd24a'
const SUN_DARK = '#ffb938'
const SUN_RAY = '#ffd95a'
const DAWN = '#9fb2e0'
const HILL = '#e2f2d2'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const BIRD = '#5aa9e6'
const BIRD_DARK = '#3f86cc'
const BIRD_FAR = '#336fae'
const BELLY = '#eaf5ff'
const BEAK = '#f2b632'
const LEG = '#e2733f'
const EYE = '#2b2b2b'
const CHEEK = '#ff9d9d'
const NOTE = '#f07f9e'

/** くぎり の時間(秒) */
const RISE = 0.5
const WARM = 3.0
const OPEN_EYES = 3.3
const STRETCH = 3.6
const SING = 4.6
const INK = 6.3
const DONE = 8.9
const DURATION = 9.6

/** 小鳥の かた(はねの つけね)。からだの 上 */
const SHOULDER: readonly [number, number] = [68, 60]
/** お日さまの おちつく 場所(1〜4画目 日 の まんなか) */
const SUN_POS: readonly [number, number] = [26, 53]
/** とまり木の たかさ(17画目の あたり) */
const BRANCH_Y = 80

function Sun({ t }: SceneProps) {
  const up = span(t, RISE, WARM, easeOut)
  if (up <= 0) return null
  const cy = 108 - (108 - SUN_POS[1]) * up
  const spin = t * 12
  const shine = 1 + wave(t, 0.9) * 0.05
  return (
    <>
      <circle cx={SUN_POS[0]} cy={cy} r={21 * up} fill={SUN} opacity="0.22" />
      <Layer rotate={spin} origin={[SUN_POS[0], cy]}>
        {Array.from({ length: 10 }, (_, i) => (
          <rect key={i} x={SUN_POS[0] - 1.2} y={cy - 19.5} width="2.4" height="5.2" rx="1.2" fill={SUN_RAY} transform={`rotate(${i * 36} ${SUN_POS[0]} ${cy})`} />
        ))}
      </Layer>
      <circle cx={SUN_POS[0]} cy={cy} r={13 * shine} fill={SUN} />
      <circle cx={SUN_POS[0] + 2.4} cy={cy + 2.8} r={10} fill={SUN_DARK} opacity="0.35" />
      <circle cx={SUN_POS[0] - 4.2} cy={cy - 4.4} r="3.4" fill="#fff4b8" opacity="0.8" />
    </>
  )
}

/** あたたかい ひかり が、お日さまから 小鳥へ とどく(ひかりの すじ) */
function Beams({ t }: SceneProps) {
  const show = during(t, WARM - 0.4, STRETCH + 1.2, 0.5)
  if (show <= 0) return null
  return (
    <g opacity={show * 0.5} stroke={SUN_RAY} strokeWidth="1.3" strokeLinecap="round" fill="none" strokeDasharray="3 4" strokeDashoffset={-t * 6}>
      <path d="M40 48 Q47 52 55 55" />
      <path d="M39 57 Q47 60 55 59" />
    </g>
  )
}

function Ground() {
  return (
    <>
      <path d="M-4 99 Q18 78 44 92 Q72 76 113 95 V101 H-4 Z" fill={HILL} />
      <ellipse cx="54.5" cy="100" rx="55" ry="5.6" fill={GRASS} />
      {[6, 30, 62, 84].map((x) => (
        <path key={x} d={`M${x} 99.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 右がわの 木。みき と、左へ のびた えだ(小鳥の とまり木) */
function Tree({ t }: SceneProps) {
  const sway = wave(t, 3.6) * 1.2
  return (
    <>
      <path d="M97 101 Q100 92 100.4 84 L100.4 40 L109 40 L109 101 Z" fill={BARK} />
      <path d="M103 52 q1.4 6 0 12 M104 78 q-1.4 5 0 10" fill="none" stroke={BARK_DARK} strokeWidth="1.3" strokeLinecap="round" />
      {/* えだ: みき から 左へ。つけねが ふとく、さきが ほそい */}
      <path d={`M100.6 ${BRANCH_Y - 3} L46 ${BRANCH_Y - 1.4} Q43.6 ${BRANCH_Y} 46 ${BRANCH_Y + 1.4} L100.6 ${BRANCH_Y + 4.5} Z`} fill={BARK} />
      <path d={`M60 ${BRANCH_Y + 1.6} L99 ${BRANCH_Y + 3.4}`} stroke={BARK_DARK} strokeWidth="1" strokeLinecap="round" />
      <Layer rotate={sway} origin={[104, 44]}>
        <circle cx="104" cy="38" r="9.5" fill={LEAF_DARK} />
        <circle cx="106" cy="30" r="8" fill={LEAF_DARK} />
        <circle cx="102" cy="36" r="6.6" fill={LEAF} />
        <circle cx="105" cy="28.5" r="5" fill={LEAF} />
      </Layer>
      <Layer rotate={sway * 0.8} origin={[56, BRANCH_Y]}>
        <path d={`M56 ${BRANCH_Y - 1} q-3 -5 1 -8 q4 3 -1 8 Z`} fill={LEAF} />
        <path d={`M50 ${BRANCH_Y} q-4 4 -1 8 q4 -3 1 -8 Z`} fill={LEAF_DARK} />
      </Layer>
    </>
  )
}

type Mood = 'cold' | 'warm' | 'happy'

/** 1まいの はね。つけね(かた)が 原点で、ま上へ のびる。rotate = ま上から 時計まわりに 何度か */
function Wing({ angle, color, tip }: { readonly angle: number; readonly color: string; readonly tip: string }) {
  return (
    <Layer rotate={angle} origin={SHOULDER}>
      <g transform={`translate(${SHOULDER[0]} ${SHOULDER[1]})`}>
        <path d="M0 0 C-7 -6 -8 -22 -2 -31 C5 -22 7 -7 0 0 Z" fill={color} />
        <path d="M-3.4 -16 L-2 -31 L2.6 -20 Z" fill={tip} />
        <path d="M0 -4 q-0.8 -11 -1.6 -18" fill="none" stroke={tip} strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
      </g>
    </Layer>
  )
}

type BirdProps = {
  readonly mood: Mood
  /** 手前の はね・むこうの はね の かくど(0 = ま上、125 = たたんで からだに そう) */
  readonly nearWing: number
  readonly farWing: number
  /** くちばしの ひらき(0〜1) */
  readonly open: number
  /** ふくらみ(さむいと ふくらむ) */
  readonly puff: number
}

function Bird({ mood, nearWing, farWing, open, puff }: BirdProps) {
  return (
    <>
      {/* むこうの はね: からだの うしろ */}
      <Wing angle={farWing} color={BIRD_FAR} tip="#2a5b91" />
      {/* おび(しっぽ): 右うしろへ、少し 下がる */}
      <path d="M78 66 L93 74 L91 78 L77 72 Z" fill={BIRD_DARK} />
      {/* あし: からだの 下から えだ へ */}
      <path d={`M67 74 L66.4 ${BRANCH_Y - 0.4} M73 74.4 L73.2 ${BRANCH_Y - 0.4}`} stroke={LEG} strokeWidth="1.5" strokeLinecap="round" />
      <path d={`M64.4 ${BRANCH_Y - 0.6} h4 M71 ${BRANCH_Y - 0.6} h4.4`} stroke={LEG} strokeWidth="1.5" strokeLinecap="round" />
      <Layer scale={1 + puff * 0.08} origin={[70, 74]}>
        {/* どう */}
        <ellipse cx="70" cy="65.6" rx="11.4" ry="10.4" fill={BIRD} />
        <ellipse cx="66" cy="69.6" rx="7" ry="6.2" fill={BELLY} />
      </Layer>
      {/* あたま: どう の まえ(左)の 上。くび は みじかい */}
      <circle cx="61.4" cy="55" r="7.2" fill={BIRD} />
      <circle cx="58.2" cy="58.6" r="1.9" fill={CHEEK} opacity="0.6" />
      {/* くちばし: 顔の まえ(左)。うたうと 下が あく */}
      <path d="M55.4 53.6 L48.8 55.4 L55.2 56.4 Z" fill={BEAK} />
      <Layer rotate={open * 22} origin={[55.2, 56.2]}>
        <path d="M55.4 56.2 L50 57.2 L55.4 58.4 Z" fill="#e0a02a" />
      </Layer>
      {open > 0.2 ? <path d="M54.8 56.6 L51.4 57.2 L54.8 58" fill="#c4504a" /> : null}
      {/* 目 */}
      {mood === 'cold' ? (
        <path d="M57 52.4 Q58.6 54.2 60.4 52.6" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
      ) : mood === 'happy' ? (
        <path d="M57 53.8 Q58.7 51.6 60.4 53.8" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="58.6" cy="52.8" r="1.4" fill={EYE} />
          <circle cx="59" cy="52.3" r="0.45" fill="#ffffff" />
        </>
      )}
      {mood === 'cold' ? <path d="M57.2 50.4 l3 0.8" stroke={BIRD_DARK} strokeWidth="1" strokeLinecap="round" /> : null}
      {/* てまえの はね: かた から のびる */}
      <Wing angle={nearWing} color={BIRD_DARK} tip="#2a5b91" />
    </>
  )
}

/** さむい間の ぶるぶる(ふるえの 線) */
function Shiver({ t }: SceneProps) {
  const show = during(t, 0.4, WARM + 0.2, 0.3)
  if (show <= 0) return null
  const k = wave(t, 0.2)
  return (
    <g opacity={show * 0.8} stroke="#5f7fd6" strokeWidth="1" strokeLinecap="round" fill="none">
      <path d={`M${82 + k} 58 q2 3 0 6`} />
      <path d={`M${85 - k} 61 q2 3 0 6`} />
      <path d={`M${48 - k} 62 q-2 3 0 6`} />
    </g>
  )
}

/** うたう「ふんふん」の ふしぎな 音ぷ。くちばし から 上へ のぼる */
function Notes({ t }: SceneProps) {
  const show = during(t, SING, INK - 0.1, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.55, 1.1].map((offset, i) => {
        const p = ((t - SING + offset) % 1.65) / 1.65
        const x = 50 - p * 3 + Math.sin(p * 6 + i) * 1.4
        const y = 52 - p * 12
        return (
          <g key={offset} opacity={Math.sin(p * Math.PI)} fill={NOTE} stroke={NOTE}>
            <path d={`M${x + 1.3} ${y} v-5 l2.6 -0.8`} fill="none" strokeWidth="0.8" />
            <ellipse cx={x} cy={y} rx="1.4" ry="1" stroke="none" />
          </g>
        )
      })}
    </g>
  )
}

/** はるかな 雲。ゆっくり ながれる */
function Cloud({ t }: SceneProps) {
  return (
    <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
      <ellipse cx="50" cy="7" rx="7" ry="3" />
      <ellipse cx="55" cy="5.2" rx="5" ry="3.2" />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 18)
  // あさの さむい 色。お日さまが のぼると、きえる
  const cold = 1 - span(t, RISE + 0.4, WARM + 0.2, easeInOut)
  // はね: たたむ → ぱっと ひろげる → 少し ぱたぱた → ひろげた まま
  const spread = span(t, STRETCH, STRETCH + 0.55, backOut)
  const flap = during(t, SING, INK - 0.2, 0.3) * wave(t, 0.5) * 6
  const nearWing = 125 + (-30 - 125) * spread + flap * 0.6
  const farWing = 125 + (26 - 125) * spread - flap * 0.6
  const mood: Mood = t < OPEN_EYES ? 'cold' : t < STRETCH + 0.4 ? 'warm' : 'happy'
  const open = t < SING ? 0 : Math.max(0, wave(t, 0.5)) * 0.9 + 0.1
  const puff = cold
  // ふるえ
  const shake = cold > 0.05 ? wave(t, 0.14) * 0.6 * cold : 0
  const hop = t >= STRETCH && t < INK ? Math.abs(wave(t - STRETCH, 0.9)) * 0.6 * span(t, STRETCH + 0.5, STRETCH + 0.8) : 0
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <rect x="0" y="0" width="109" height="109" fill={DAWN} opacity={cold * 0.4} />
        <Cloud t={t} />
        <Sun t={t} />
        <Ground />
        <Tree t={t} />
        <Beams t={t} />
        <Layer x={shake} y={-hop}>
          <Bird mood={mood} nearWing={nearWing} farWing={farWing} open={open} puff={puff} />
        </Layer>
        <Shiver t={t} />
        <Notes t={t} />
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
    { at: 0, label: 'さむい あさ。小鳥が ふくらんで ぶるぶる', sound: 'pop' },
    { at: RISE, label: 'お日さまが のぼってくる' },
    { at: WARM, label: 'ぴかぴか ひかって、小鳥が あたたまる' },
    { at: STRETCH, label: 'はねを ぱっと 上にひろげる', sound: 'pop' },
    { at: SING, label: 'ぴよぴよ うたう' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '曜 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
