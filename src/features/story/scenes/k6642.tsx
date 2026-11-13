/*
 * 時(とき): お日さまが うごいて、ときが すすむ。(じの おと)
 *
 * ほね(画と絵の対応)
 *   1〜4画目(日)  … 小さな 家の まど。1画目=まどの 左わく、2画目=上と右のわく、
 *                    3画目=まどの 中ほどの さん、4画目=したの わく(まど の 外に お日さまが 見える)
 *   5・7・8画目   … 五重の とうの 3つの やね(上から じゅんに ひろがる)
 *   6画目(丨)     … いちばん上の やね から のびる とう の てっぺん(さお)
 *   9画目(亅)     … とうの 右はしの はしら(下の 階は ふきぬけで、かねが さがっている)
 *   10画目(丶)    … 子どもと とうの 間の 空(絵には 描かない。字に なるとき、ひかる 線が 先に あらわす)
 *
 * ながれ
 *   小さな 家と、おてらの とうが たつ → 子どもが とことこ 出てきて、まどの お日さまを 見あげる
 *   → お日さまが まどの 上から 下へ ゆっくり うごく。空が 夕やけ色に かわり、子どものかげが のびる
 *   → 子どもは さいしょ「あっ うごいてる!」と びっくり、そのうち「まだかな」と ぼんやり
 *   → お日さまが まどの 下まで きたら、とうの かねが「ごーん」。子どもは「じかん だ!」と とびはねて よろこぶ
 *   → ほね が ひかって、絵が うすくなり、字「時」が のこる
 *
 * 人・家・とうは、ほんものの つくり を守る(字の形に合わせるために、ゆがめない):
 *   子どもの うで は かた から出て ひじ で まがる。くび は みじかく、あたま は どう の まんなか の上。
 *   とうの やね は 上ほど せまく、かねは 1ぽんの ひもで つるす。
 *   字の画との かさなりは、だいたいの 場所と 向き(まど=日、やね=横線、はしら=たて線)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '時'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#ef8a4a'
const TUNIC_DARK = '#d9742f'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const WALL = '#f6e6cb'
const WALL_SHADE = '#e8d2ae'
const ROOF_HOUSE = '#d8604f'
const ROOF_TOWER = '#4f7a9c'
const ROOF_TOWER_DARK = '#3d6684'
const TOWER_WALL = '#f2dcc0'
const INSIDE = '#6b4a36'
const GOLD = '#f2b632'
const GOLD_DARK = '#d99a1e'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const SUN_LOW = '#ff8a3d'
const SKY_DAY = '#9fd8f5'
const SKY_EVENING = '#ffb36b'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const LOOK = 1.2
const TIRED = 3.0
const BELL = 4.4
const CHEER = 4.9
const INK = 6.4
const DONE = 9.3
const DURATION = 9.9

/** 子どもの 足もと の まんなか と、体の おおきさ(まわりの 家・とうに 合わせて すこし 小さく) */
const CHILD_X = 51.5
const CHILD_FEET = 96
const CHILD_SCALE = 0.8
/** 子どもの かた(うでの つけね)の 高さ と あたま の まんなか */
const SHOULDER_Y = 79.5
const HEAD_Y = 69
/** うでの 1ぶし の 長さ(かた→ひじ、ひじ→手) */
const ARM_PART = 7

/** まどの 中(空が 見える ところ)。1〜4画目の わく の 中。 */
const WIN = { x: 16.6, y: 29.6, w: 21, h: 47.4 }
/** とうの まんなか の x。やね は ここを まんなかに ひろがる */
const TOWER_X = 70
/** かね を つるす ひも の ねもと(3つめの やね の 下) */
const BELL_TOP: readonly [number, number] = [TOWER_X, 62.5]

/** 色を まぜる(0 = a / 1 = b)。空が 夕やけ色に かわるのに使う */
function lerpColor(a: string, b: string, k: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
  const part = (i: number) =>
    Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * k)
      .toString(16)
      .padStart(2, '0')
  return `#${part(0)}${part(1)}${part(2)}`
}

function Ground() {
  return (
    <>
      {/* とおくの おか(おくゆき を出す) */}
      <path d="M-4 99 Q18 78 44 91 Q72 70 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 47, 88, 102].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** ゆっくり ながれる 雲。夕やけが ちかづくと、すこし ピンクに なる。 */
function Clouds({ t }: SceneProps) {
  const tone = lerpColor('#ffffff', '#ffe3d0', span(t, 1.2, 4.4))
  return (
    <g fill={tone} opacity="0.92" transform={`translate(${t * 1.5} 0)`}>
      <ellipse cx="54" cy="12" rx="7" ry="3.2" />
      <ellipse cx="59" cy="10.4" rx="5" ry="3.2" />
      <ellipse cx="92" cy="20" rx="6" ry="2.8" />
      <ellipse cx="96.5" cy="18.4" rx="4.2" ry="2.8" />
    </g>
  )
}

/** 小さな 家。まどの 外に、お日さまが 上から 下へ うごいていく。 */
function House({ t }: SceneProps) {
  const rise = span(t, 0, 0.6, backOut)
  const evening = span(t, LOOK, BELL, easeInOut)
  const sunY = mix(t, LOOK - 0.2, BELL, 38, 66, easeInOut)
  // 青 → うすい 黄 → だいだい の じゅんに かえる(まんなかで にごった 色に ならないように)
  const sky = evening < 0.5 ? lerpColor(SKY_DAY, '#fde9b8', evening * 2) : lerpColor('#fde9b8', SKY_EVENING, evening * 2 - 1)
  const sun = lerpColor(SUN, SUN_LOW, evening)
  return (
    <Layer scaleY={rise} scaleX={0.7 + 0.3 * rise} origin={[27, 97]}>
      <path d="M5 25 L27 7 L49 25 Z" fill={ROOF_HOUSE} />
      <path d="M5 25 L49 25 L47 28 L7 28 Z" fill="#b94c3e" />
      <rect x="9" y="26" width="36" height="72" rx="2" fill={WALL} />
      <rect x="9" y="88" width="36" height="10" fill={WALL_SHADE} />
      {/* まどの 中: 空と お日さま(わく の中だけ 見える) */}
      <clipPath id="k6642-window">
        <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} />
      </clipPath>
      <g clipPath="url(#k6642-window)">
        <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} fill={sky} />
        <circle cx="27" cy={sunY} r="8.2" fill={sun} opacity="0.35" />
        <circle cx="27" cy={sunY} r="5.2" fill={sun} />
        <circle cx="25.2" cy={sunY - 1.6} r="1.6" fill="#ffffff" opacity="0.5" />
      </g>
      {/* まどの わく: 日 の 1〜4画目 */}
      <Bone char={CHAR} n={1} color={BARK} width={3.2} />
      <Bone char={CHAR} n={2} color={BARK} width={3.2} />
      <Bone char={CHAR} n={3} color={BARK} width={2.6} />
      <Bone char={CHAR} n={4} color={BARK_DARK} width={3.6} />
    </Layer>
  )
}

/** やね 1まい。まんなか cx、たいらな 線の 高さ y、はば の半分 half。すそが すこし そりあがる。 */
function Roof({ cx, y, half, color, dark }: { readonly cx: number; readonly y: number; readonly half: number; readonly color: string; readonly dark: string }) {
  const top = half * 0.32
  return (
    <>
      <path d={`M${cx - half} ${y + 1.4} Q${cx - half * 0.55} ${y + 0.6} ${cx - top} ${y - 4.2} L${cx + top} ${y - 4.2} Q${cx + half * 0.55} ${y + 0.6} ${cx + half} ${y + 1.4} Q${cx} ${y + 3.4} ${cx - half} ${y + 1.4} Z`} fill={color} />
      <path d={`M${cx - half} ${y + 1.4} Q${cx} ${y + 3.4} ${cx + half} ${y + 1.4} Q${cx} ${y + 2.2} ${cx - half} ${y + 1.4} Z`} fill={dark} />
    </>
  )
}

/** かね。ひもで つるして、ゆれる。ゆれは だんだん おさまる。 */
function Bell({ t }: SceneProps) {
  const age = t - BELL
  const decay = age < 0 ? 0 : Math.max(0, 1 - age / 1.9)
  const swing = wave(age, 0.55) * 17 * decay
  return (
    <Layer rotate={swing} origin={BELL_TOP}>
      <path d={`M${BELL_TOP[0]} ${BELL_TOP[1]} v4`} stroke={BARK_DARK} strokeWidth="1" />
      <path d="M65.6 76 Q65.6 66.6 70 66.6 Q74.4 66.6 74.4 76 Z" fill={GOLD} />
      <path d="M65.6 76 H74.4 V74.6 H65.6 Z" fill={GOLD_DARK} />
      <ellipse cx="70" cy="76" rx="4.8" ry="1.2" fill={GOLD_DARK} />
      <circle cx="70" cy="78" r="1.3" fill={BARK_DARK} />
      <path d="M67.4 69.4 Q67.8 68 69 67.6" fill="none" stroke="#fff2c0" strokeWidth="0.9" strokeLinecap="round" />
    </Layer>
  )
}

/** かねの「ごーん」。まるい ひびき が 左右に ひろがる。 */
function Ring({ t }: SceneProps) {
  const age = t - BELL
  if (age < 0 || age > 1.6) return null
  return (
    <g fill="none" stroke="#f2b632" strokeWidth="1" strokeLinecap="round">
      {[0, 0.4, 0.8].map((delay) => {
        const p = (age - delay) / 0.8
        if (p <= 0 || p >= 1) return null
        const r = 4 + p * 9
        return (
          <g key={delay} opacity={1 - p}>
            <path d={`M${TOWER_X - r} ${72 - r * 0.7} Q${TOWER_X - r - 2.6} 72 ${TOWER_X - r} ${72 + r * 0.7}`} />
            <path d={`M${TOWER_X + r} ${72 - r * 0.7} Q${TOWER_X + r + 2.6} 72 ${TOWER_X + r} ${72 + r * 0.7}`} />
          </g>
        )
      })}
    </g>
  )
}

/** おてらの とう。上ほど せまい 3つの やね。いちばん下は ふきぬけで、かねが さがる。 */
function Tower({ t }: SceneProps) {
  const grow = span(t, 0.15, 0.85, backOut)
  return (
    <>
      <Layer scaleY={grow} scaleX={0.75 + 0.25 * grow} origin={[TOWER_X, 97]}>
        {/* 下の かい: ふきぬけ。うしろは 暗く、かねが 見える */}
        <rect x="62" y="62" width="18" height="34" fill={INSIDE} />
        <rect x="62" y="94" width="18" height="3" fill="#a77f5c" />
        <rect x="60.6" y="61" width="3" height="36" rx="1" fill={BARK} />
        <rect x="78.4" y="61" width="3" height="36" rx="1" fill={BARK} />
        {/* 上の 2かい の かべ */}
        <rect x="63" y="46" width="14" height="14" fill={TOWER_WALL} />
        <rect x="63.6" y="31" width="12.8" height="9.5" fill={TOWER_WALL} />
        <rect x="68.6" y="49" width="3.2" height="6" rx="1.4" fill={BARK} />
        {/* てっぺんの さお(6画目)。先に ちいさな たま */}
        <rect x="69.1" y="11.4" width="1.8" height="14" rx="0.9" fill={BARK_DARK} />
        <circle cx="70" cy="11.6" r="2.1" fill={GOLD} />
        <Roof cx={TOWER_X} y={27.5} half={18} color={ROOF_TOWER} dark={ROOF_TOWER_DARK} />
        <Roof cx={TOWER_X} y={43.5} half={25} color={ROOF_TOWER} dark={ROOF_TOWER_DARK} />
        <Roof cx={TOWER_X} y={59} half={25} color={ROOF_TOWER} dark={ROOF_TOWER_DARK} />
      </Layer>
      <Layer opacity={span(t, 0.8, 1.0)}>
        <Bell t={t} />
      </Layer>
    </>
  )
}

type Mood = 'curious' | 'bored' | 'happy'

/** うで の かっこう。a1 = かた→ひじ、a2 = ひじ→手 の むき(ま下が 0、そとへ ひらくほど 大きい。左のうでは マイナス) */
type ArmPose = { readonly a1: number; readonly a2: number }

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。 */
function Arm({ side, pose }: { readonly side: -1 | 1; readonly pose: ArmPose }) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const sx = CHILD_X + side * 5.4
  const ex = sx + Math.sin(rad(pose.a1)) * ARM_PART
  const ey = SHOULDER_Y + Math.cos(rad(pose.a1)) * ARM_PART
  const hx = ex + Math.sin(rad(pose.a2)) * ARM_PART
  const hy = ey + Math.cos(rad(pose.a2)) * ARM_PART
  return (
    <>
      <path d={`M${sx} ${SHOULDER_Y} L${ex} ${ey} L${hx} ${hy}`} fill="none" stroke={TUNIC_DARK} strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hx} cy={hy} r="2.5" fill={SKIN} />
    </>
  )
}

function Face({ mood, look }: { readonly mood: Mood; readonly look: number }) {
  const eyeY = HEAD_Y + 0.8
  const eyes = [-2.7, 2.7].map((dx) => CHILD_X + dx)
  return (
    <>
      <circle cx={CHILD_X - 4.4} cy={HEAD_Y + 3.2} r="1.5" fill={CHEEK} opacity="0.5" />
      <circle cx={CHILD_X + 4.4} cy={HEAD_Y + 3.2} r="1.5" fill={CHEEK} opacity="0.5" />
      {mood === 'happy'
        ? eyes.map((x) => <path key={x} d={`M${x - 1.5} ${eyeY + 0.6} Q${x} ${eyeY - 1.6} ${x + 1.5} ${eyeY + 0.6}`} fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />)
        : eyes.map((x) => <circle key={x} cx={x + look} cy={eyeY} r={mood === 'curious' ? 1.3 : 1.1} fill={EYE} />)}
      {mood === 'bored' &&
        eyes.map((x) => <path key={x} d={`M${x - 1.8} ${eyeY - 0.5} H${x + 1.8}`} stroke={SKIN} strokeWidth="1.3" />)}
      {mood === 'happy' && <path d={`M${CHILD_X - 2.6} ${HEAD_Y + 3.2} Q${CHILD_X} ${HEAD_Y + 7.2} ${CHILD_X + 2.6} ${HEAD_Y + 3.2} Z`} fill={MOUTH} />}
      {mood === 'curious' && <ellipse cx={CHILD_X + look * 0.8} cy={HEAD_Y + 4.4} rx="1.1" ry="1.5" fill={MOUTH} />}
      {mood === 'bored' && <path d={`M${CHILD_X - 1.6} ${HEAD_Y + 4.6} H${CHILD_X + 1.6}`} stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />}
    </>
  )
}

type ChildProps = {
  readonly mood: Mood
  readonly look: number
  readonly leftArm: ArmPose
  readonly rightArm: ArmPose
  readonly headTilt: number
  /** あしを とんとん する(ぼんやりの とき) */
  readonly tap: number
}

function Child({ mood, look, leftArm, rightArm, headTilt, tap }: ChildProps) {
  const neckY = HEAD_Y + 5
  return (
    <>
      {/* あし: こしから ま下へ */}
      <rect x={CHILD_X - 4.6} y="86" width="4" height="8.6" rx="2" fill={PANTS} />
      <Layer rotate={tap} origin={[CHILD_X + 2.6, 87]}>
        <rect x={CHILD_X + 0.6} y="86" width="4" height="8.6" rx="2" fill={PANTS} />
        <ellipse cx={CHILD_X + 3} cy="95" rx="3.6" ry="1.9" fill={SHOE} />
      </Layer>
      <ellipse cx={CHILD_X - 2.6} cy="95" rx="3.6" ry="1.9" fill={SHOE} />
      {/* くび: みじかく、どう と あたま の間 */}
      <rect x={CHILD_X - 1.8} y={neckY - 1.5} width="3.6" height="6" rx="1.6" fill={SKIN_SHADE} />
      {/* どう */}
      <rect x={CHILD_X - 6.4} y="77" width="12.8" height="11.5" rx="4.6" fill={TUNIC} />
      <path d={`M${CHILD_X - 4.6} 85 h9.2`} stroke={TUNIC_DARK} strokeWidth="1.2" strokeLinecap="round" />
      <Arm side={-1} pose={leftArm} />
      <Arm side={1} pose={rightArm} />
      {/* あたま: くびの ねもとを じく に かたむく */}
      <Layer rotate={headTilt} origin={[CHILD_X, neckY]}>
        <circle cx={CHILD_X} cy={HEAD_Y} r="6.2" fill={SKIN} />
        <path d={`M${CHILD_X - 6.4} ${HEAD_Y - 1.4} C${CHILD_X - 7} ${HEAD_Y - 8.6} ${CHILD_X + 7} ${HEAD_Y - 8.6} ${CHILD_X + 6.4} ${HEAD_Y - 1.4} C${CHILD_X + 3.6} ${HEAD_Y - 4.8} ${CHILD_X - 3.6} ${HEAD_Y - 4.8} ${CHILD_X - 6.4} ${HEAD_Y - 1.4} Z`} fill={HAIR} />
        <Face mood={mood} look={look} />
      </Layer>
    </>
  )
}

/** ぼんやり している ときの「ふう」。あたまの よこへ のぼる。 */
function Sigh({ t }: SceneProps) {
  const show = during(t, TIRED + 0.2, BELL - 0.1, 0.25)
  if (show <= 0) return null
  const p = span(t, TIRED + 0.2, BELL - 0.1, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={59.5 + p * 3} cy={68 - p * 4} rx={2.2 + p * 1.8} ry={1.5 + p * 1.2} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <ellipse cx={56.5 + p * 1.5} cy={70 - p * 1.5} rx={1.1 + p * 0.7} ry={0.8 + p * 0.5} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
    </g>
  )
}

/** かげ。お日さまが 左の まどに あるので、右へ のびる。おそくなるほど ながい。 */
function Shadow({ t }: SceneProps) {
  const len = mix(t, LOOK, BELL, 5, 17, easeInOut)
  return <ellipse cx={CHILD_X + 3 + len / 2} cy="97.2" rx={len / 2 + 3} ry="1.8" fill="#000000" opacity="0.13" />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 10)

  // 子ども: とことこ 出てくる(ぽん と 大きくなる)
  const appear = span(t, 0.7, 1.2, backOut)
  // お日さまを ゆびさす(ひだり のうで)→ ぼんやり で おろす → よろこびで ばんざい
  const point = span(t, LOOK + 0.1, LOOK + 0.6, backOut) * (1 - span(t, TIRED - 0.2, TIRED + 0.3))
  const cheer = span(t, CHEER, CHEER + 0.3, backOut)
  const lerp = (a: number, b: number, k: number) => a + (b - a) * k
  const leftArm: ArmPose =
    t >= BELL
      ? { a1: lerp(-4, -150, cheer), a2: lerp(-2, -168, cheer) }
      : { a1: lerp(-4, -122, point), a2: lerp(-2, -130, point) }
  const rightArm: ArmPose = t >= BELL ? { a1: lerp(4, 150, cheer), a2: lerp(2, 168, cheer) } : { a1: 4, a2: 2 }

  // きもち: あっ→ ぼんやり → びっくり → うれしい
  const mood: Mood = t < TIRED ? 'curious' : t < BELL ? 'bored' : t < CHEER - 0.15 ? 'curious' : 'happy'
  // まどの ほう(左)を 見ている。かねが なったら、とうの ほう(右)を 見る
  const look = t < BELL ? -0.9 : t < CHEER ? 0.9 : 0
  const headTilt = t < TIRED ? -6 : t < BELL ? -2 + wave(t, 2.4) * 1.2 : t < CHEER ? 5 : 0
  const tap = t >= TIRED && t < BELL ? Math.max(0, wave(t, 0.7)) * 9 : 0

  // よろこびの ジャンプ(2かい)
  const hopSpan = (t - CHEER) / 0.6
  const hop = hopSpan > 0 && hopSpan < 2 ? Math.abs(Math.sin(hopSpan * Math.PI)) * 4 : 0
  const squash = 1 - (hop === 0 && hopSpan > 0 && hopSpan < 2.4 ? 0.04 : 0)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Clouds t={t} />
        <Ground />
        <House t={t} />
        <Tower t={t} />
        <Layer opacity={appear}>
          <Shadow t={t} />
        </Layer>
        <Layer scale={appear} origin={[CHILD_X, CHILD_FEET]}>
          <Layer y={-hop} scaleX={1} scaleY={squash} origin={[CHILD_X, CHILD_FEET]}>
            <Layer scale={CHILD_SCALE} origin={[CHILD_X, CHILD_FEET]}>
              <Child mood={mood} look={look} leftArm={leftArm} rightArm={rightArm} headTilt={headTilt} tap={tap} />
            </Layer>
          </Layer>
        </Layer>
        <Sigh t={t} />
        <Ring t={t} />
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
    { at: 0, label: '小さな 家と、おてらの とうが たつ', sound: 'pop' },
    { at: LOOK, label: '子どもが まどの お日さまを 見あげる。お日さまが うごいていく' },
    { at: TIRED, label: '空が 夕やけ色に。子どもは ぼんやり' },
    { at: BELL, label: 'お日さまが 下に きて、とうの かねが ごーん', sound: 'pop' },
    { at: CHEER, label: '「じかん だ!」と とびはねて よろこぶ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '時 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
