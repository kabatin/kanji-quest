/*
 * 牛(うし): 角(つの)のある 牛の あたまを、まえから 見たところ。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … 左の つの(と、あたまの 左がわ)
 *   2画目(一)  … 左右の つのの つけね と あたまの てっぺん
 *   3画目(一)  … よこへ ぴんと ひろがった 左右の 耳
 *   4画目(丨)  … 顔の まんなかを とおる 白い すじ(はな すじ)
 *
 * ながれ
 *   草はらから 牛が 顔を だす → もぐもぐ(草を かんで、ちょっと たいくつ。耳も たれている)
 *   → ちょうちょが とんでくる。牛は 気づいて 目を まるくし、耳を ぴん と たてる
 *   → ちょうちょが 右の つのに とまる。くすぐったくて にっこり(耳が ぱたぱた)
 *   → 耳が よこに ひろがって 顔が まっすぐ もどる → ほね が ひかって、絵が うすくなり、字「牛」が のこる
 *
 * 牛は、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   顔は たて ながで、したに いくほど はなづらが 大きい。つのは あたまの 上の よこ から
 *   そとへ のびて 上へ そる。耳は あたまの よこの 目の すこし 下から よこへ はえる。
 *   ちょうちょは つのの 先に とまるので、子どもは「つの」に 目が いく。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '牛'

const HIDE = '#b5784a'
const HIDE_DARK = '#8f5a37'
const BLAZE = '#f7f0e2'
const MUZZLE = '#f6b9ae'
const NOSTRIL = '#c9766f'
const HORN = '#efdcaa'
const HORN_TIP = '#b89c64'
const EAR_IN = '#f4a79c'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const TONGUE = '#ff8a8a'
const CHEEK = '#ff9d9d'
const SUN = '#ffd24a'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const HILL = '#e2f2d2'

/** くぎり の時間(秒) */
const RISE = 0.15
const NOTICE = 2.8
/** ちょうちょが 右の つのに とまる / とびさる */
const LAND = 4.0
const LEAVE = 5.0
const SMILE = 4.5
const INK = 6.0
const DONE = 8.7
const DURATION = 9.5

/** 顔の まんなか(はなすじ の x) */
const MID = 55
/** 顔の つけね(あごの あたり)。あたまを かたむける じく */
const NECK: readonly [number, number] = [55, 92]
/** 右の つのの 先(ちょうちょが とまる ところ) */
const HORN_TIP_R: readonly [number, number] = [81.6, 17]
/** 左右の目 */
const EYE_L: readonly [number, number] = [46, 50]
const EYE_R: readonly [number, number] = [64, 50]

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
      {/* とおくの おか と、ゆっくり ながれる 雲(おくゆき を出す) */}
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill={HILL} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="-4" cy="46" rx="7" ry="3.4" />
        <ellipse cx="1" cy="44" rx="5" ry="3.4" />
        <ellipse cx="96" cy="54" rx="6" ry="2.8" />
        <ellipse cx="100.5" cy="52.4" rx="4.4" ry="3" />
      </g>
    </>
  )
}

/** 牛の まえの 草。顔の したを かくして、草はらから 顔を だしているように 見せる */
function FrontGrass({ t }: SceneProps) {
  const sway = wave(t, 2.6) * 1.2
  return (
    <>
      <rect x="-2" y="96" width="113" height="14" fill={GRASS} />
      <ellipse cx="55" cy="97" rx="52" ry="5.4" fill={GRASS} />
      {[6, 18, 30, 76, 90, 102].map((x, i) => (
        <Layer key={x} rotate={sway * (i % 2 === 0 ? 1 : -1)} origin={[x, 99]}>
          <path d={`M${x - 2.4} 99 l1.6 -7.2 l1.2 5 l1.6 -6.4 l0.9 8.6 Z`} fill={i % 2 === 0 ? LEAF : LEAF_DARK} />
        </Layer>
      ))}
    </>
  )
}

/** ちょうちょの 場所。まだ いなければ null */
function butterflyPos(t: number): readonly [number, number] | null {
  if (t < 2.2) return null
  if (t < LAND) {
    // 右上から ひらひら とんできて、つのの 先に おりる
    const p = span(t, 2.2, LAND, easeInOut)
    return [HORN_TIP_R[0] + (1 - p) * 36 + Math.sin(p * 13) * 3 * (1 - p), HORN_TIP_R[1] - (1 - p) * 12 + Math.sin(p * 9 + 1) * 4 * (1 - p)]
  }
  if (t < LEAVE) return [HORN_TIP_R[0], HORN_TIP_R[1] + wave(t, 0.9) * 0.3]
  const p = span(t, LEAVE, LEAVE + 0.9, easeIn)
  if (p >= 1) return null
  return [HORN_TIP_R[0] + p * 14 + Math.sin(p * 8) * 2, HORN_TIP_R[1] - p * 24]
}

function Butterfly({ t }: SceneProps) {
  const pos = butterflyPos(t)
  if (!pos) return null
  const resting = t >= LAND && t < LEAVE
  // とんでいる間は はやく、とまっている間は ゆっくり はねを ひらく
  const flap = 0.3 + 0.7 * Math.abs(wave(t, resting ? 0.9 : 0.16))
  return (
    <Layer x={pos[0]} y={pos[1]} scale={1.55}>
      <Layer scaleX={flap}>
        <ellipse cx="-3" cy="-1.6" rx="3.2" ry="3.4" fill="#ff9a5c" />
        <ellipse cx="3" cy="-1.6" rx="3.2" ry="3.4" fill="#ff9a5c" />
        <ellipse cx="-2.4" cy="2" rx="2.2" ry="2.4" fill={SUN} />
        <ellipse cx="2.4" cy="2" rx="2.2" ry="2.4" fill={SUN} />
        <circle cx="-3.2" cy="-2" r="1" fill="#ffffff" opacity="0.85" />
        <circle cx="3.2" cy="-2" r="1" fill="#ffffff" opacity="0.85" />
      </Layer>
      <ellipse cx="0" cy="0.2" rx="0.8" ry="3.2" fill="#5a3b2a" />
      <path d="M-0.3 -3 Q-2 -6 -3 -6 M0.3 -3 Q2 -6 3 -6" fill="none" stroke="#5a3b2a" strokeWidth="0.5" strokeLinecap="round" />
    </Layer>
  )
}

/** にっこり したときの ハート。つのの よこへ ふわっと のぼる */
function Hearts({ t }: SceneProps) {
  const show = during(t, SMILE + 0.2, INK - 0.1, 0.25)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.5].map((offset, i) => {
        const p = (((t - SMILE + offset) % 1.2) + 1.2) % 1.2 / 1.2
        const x = i === 0 ? 96 : 14
        return <path key={offset} d="M0 1.4 C-4 -1.4 -2.6 -4.6 0 -2.6 C2.6 -4.6 4 -1.4 0 1.4 Z" fill="#f07f9e" transform={`translate(${x + Math.sin(p * 6) * 1.2} ${46 - p * 16}) scale(${0.8 + p * 0.3})`} opacity={Math.sin(p * Math.PI)} />
      })}
    </g>
  )
}

type EyeProps = {
  readonly at: readonly [number, number]
  /** まぶた の おりぐあい(0 = ぱっちり / 1 = とじる) */
  readonly lid: number
  readonly gaze: readonly [number, number]
}

function Eye({ at, lid, gaze }: EyeProps) {
  const [cx, cy] = at
  if (lid >= 0.97) {
    // わらって とじた目(上に ふくらんだ 山)
    return <path d={`M${cx - 3.6} ${cy + 0.8} Q${cx} ${cy - 3.6} ${cx + 3.6} ${cy + 0.8}`} fill="none" stroke={EYE} strokeWidth="1.5" strokeLinecap="round" />
  }
  const lidBottom = cy - 4.3 + 8.6 * lid
  return (
    <>
      <ellipse cx={cx} cy={cy} rx="3.5" ry="3.9" fill="#ffffff" />
      <circle cx={cx + gaze[0]} cy={cy + gaze[1]} r="2.1" fill={EYE} />
      <circle cx={cx + gaze[0] + 0.7} cy={cy + gaze[1] - 0.8} r="0.7" fill="#ffffff" />
      {lid > 0.02 && (
        <>
          <rect x={cx - 3.9} y={cy - 4.3} width="7.8" height={8.6 * lid} fill={HIDE} />
          <path d={`M${cx - 3.5} ${lidBottom} H${cx + 3.5}`} stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
    </>
  )
}

type Mouth = 'chew' | 'open' | 'smile'

/** 耳。左耳の かたちで 描く(右耳は 左右を ひっくり返して 使う)。つけね(あたまの よこ)を じくに 上下に うごく */
function Ear({ angle }: { readonly angle: number }) {
  return (
    <Layer rotate={angle} origin={[43, 60]}>
      <path d="M44 56.5 Q29 51.5 14 59.5 Q29 68 44 63.5 Z" fill={HIDE_DARK} />
      <path d="M41 58.6 Q29 55.6 20.5 59.7 Q29 64.4 41 61.6 Z" fill={EAR_IN} />
    </Layer>
  )
}

/** つの。左の つので 描く(右は ひっくり返す)。つけね は あたまに かくれ、よこへ のびて 上へ そる */
function Horn() {
  return (
    <>
      <path d="M44 39 Q30 40 29 26 Q28.6 22 28.4 19.5" fill="none" stroke={HORN} strokeWidth="6.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M29 27 Q28.6 22.6 28.4 19.5" fill="none" stroke={HORN_TIP} strokeWidth="5.2" strokeLinecap="round" />
    </>
  )
}

type HeadProps = {
  readonly lid: number
  readonly gazeL: readonly [number, number]
  readonly gazeR: readonly [number, number]
  readonly earL: number
  readonly earR: number
  readonly mouth: Mouth
  /** あごの もぐもぐ(よこへ ゆれる) */
  readonly chew: number
  readonly cheek: number
}

/** 牛の 顔。まえから 見た かたち(たて ながで、したほど はなづらが 大きい) */
function Head({ lid, gazeL, gazeR, earL, earR, mouth, chew, cheek }: HeadProps) {
  return (
    <>
      {/* つの・耳(顔の うしろから はえる) */}
      <Horn />
      <Layer scaleX={-1} origin={[MID, 0]}>
        <Horn />
      </Layer>
      <Ear angle={earL} />
      <Layer scaleX={-1} origin={[MID, 0]}>
        <Ear angle={earR} />
      </Layer>
      {/* くび(あごの したを つなぐ) */}
      <rect x="40" y="78" width="30" height="24" rx="6" fill={HIDE_DARK} />
      {/* 顔 */}
      <path d="M41.5 38 Q39.5 28 55 28 Q70.5 28 68.5 38 Q71 50 69.5 62 Q70.5 74 72 82 Q73 94 55 94 Q37 94 38 82 Q39.5 74 40.5 62 Q39 50 41.5 38 Z" fill={HIDE} />
      {/* はなすじ(顔の まんなかの 白い すじ) */}
      <path d="M55 29.5 Q49.4 40 51 62 Q51.6 72 50 78 L60 78 Q58.4 72 59 62 Q60.6 40 55 29.5 Z" fill={BLAZE} />
      {/* おでこの 毛 */}
      <path d="M50.5 30.5 Q53 26 55.5 28.6 Q58 25.6 60 30.5" fill="none" stroke={HIDE_DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="42.6" cy="60" r="2.7" fill={CHEEK} opacity={0.35 + cheek * 0.5} />
      <circle cx="67.4" cy="60" r="2.7" fill={CHEEK} opacity={0.35 + cheek * 0.5} />
      <Eye at={EYE_L} lid={lid} gaze={gazeL} />
      <Eye at={EYE_R} lid={lid} gaze={gazeR} />
      {/* はなづら */}
      <Layer x={chew}>
        <ellipse cx="55" cy="85" rx="15" ry="9.5" fill={MUZZLE} />
        <ellipse cx="50" cy="82.6" rx="1.5" ry="1.9" fill={NOSTRIL} />
        <ellipse cx="60" cy="82.6" rx="1.5" ry="1.9" fill={NOSTRIL} />
        {mouth === 'chew' && <path d="M49.5 88.6 Q55 91.2 60.5 88.6" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />}
        {mouth === 'open' && <ellipse cx="55" cy="89.6" rx="2.2" ry="1.7" fill={MOUTH} />}
        {mouth === 'smile' && (
          <>
            <path d="M48.6 87.6 Q55 96 61.4 87.6 Z" fill={MOUTH} />
            <path d="M51.6 91 Q55 94 58.4 91 Q55 89.4 51.6 91 Z" fill={TONGUE} />
          </>
        )}
      </Layer>
    </>
  )
}

/** 目の ほうこう。ちょうちょを 見ているあいだは、そちらへ ひとみを むける */
function gazeToward(eye: readonly [number, number], target: readonly [number, number] | null, look: number): readonly [number, number] {
  const idle: readonly [number, number] = [0, 0.8 * (1 - look)]
  if (!target || look <= 0) return idle
  const dx = target[0] - eye[0]
  const dy = target[1] - eye[1]
  const d = Math.max(Math.hypot(dx, dy), 1)
  return [(dx / d) * 1.5 * look, (dy / d) * 1.5 * look + idle[1]]
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  // 草はらから ぽこっと 顔を だす(さいごに すこし 行きすぎて もどる)
  const rise = span(t, RISE, 1.1, backOut)
  const headY = 42 * (1 - rise)

  // 字になる すこし前に、耳が よこに ひろがり、顔が まっすぐに もどる
  const settle = span(t, INK - 0.7, INK - 0.1)

  // きもち: たいくつ(まぶた はんぶん・耳が たれる)→ びっくり(目が まるい・耳が ぴん)→ にっこり
  const bug = butterflyPos(t)
  const look = span(t, NOTICE + 0.05, NOTICE + 0.2) * (1 - span(t, SMILE, SMILE + 0.1))
  const lid = mix(t, NOTICE, NOTICE + 0.15, 0.5, 0, easeOut) + mix(t, SMILE, SMILE + 0.2, 0, 1, easeOut) * 1
  const happy = span(t, SMILE, SMILE + 0.4)
  const perk = mix(t, NOTICE - 0.1, NOTICE + 0.3, -16, 14, backOut)
  const earBase = perk * (1 - happy) + 6 * happy
  const wiggle = wave(t, 0.45) * 8 * happy * (1 - settle)
  const earL = (earBase + wiggle) * (1 - settle) + -2 * settle
  const earR = (earBase - wiggle) * (1 - settle) + 5 * settle

  const mouth: Mouth = t < NOTICE + 0.1 ? 'chew' : t < SMILE ? 'open' : 'smile'
  const chew = mouth === 'chew' ? wave(t, 0.55) * 0.9 : 0

  // あたま: 気づくと ちょうちょの ほうへ ちょっと かたむき、にっこりで ゆらゆら
  const tilt = (mix(t, NOTICE, NOTICE + 0.5, 0, 5) * (1 - span(t, SMILE - 0.1, SMILE + 0.3)) + wave(t - SMILE, 0.9) * 4 * happy) * (1 - settle)

  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Layer y={headY}>
          <Layer rotate={tilt} origin={NECK}>
            <Head lid={Math.min(lid, 1)} gazeL={gazeToward(EYE_L, bug, look)} gazeR={gazeToward(EYE_R, bug, look)} earL={earL} earR={earR} mouth={mouth} chew={chew} cheek={happy} />
          </Layer>
        </Layer>
        <FrontGrass t={t} />
        <Butterfly t={t} />
        <Hearts t={t} />
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
    { at: 0, label: '草はらから 牛が 顔を だす', sound: 'pop' },
    { at: 1.4, label: 'もぐもぐ。ちょっと たいくつ' },
    { at: NOTICE, label: 'ちょうちょが とんでくる。牛は 気づいて 耳を ぴん', sound: 'pop' },
    { at: LAND, label: 'つのに ちょうちょが とまる' },
    { at: SMILE, label: 'くすぐったくて にっこり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '牛 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
