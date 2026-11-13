/*
 * 昼(ひる): おひさまが のぼって、ものさしで はかると いちばん たかい。
 *
 * ほね(画と絵の対応)
 *   1・2画目   … 空の たかいところに うかぶ 平たい くも(1画目は くもの ふくらんだ 上、2画目は 平たい そこ)
 *   3画目(ノ)  … 子どもが 手に もつ ものさし(ななめに 空へ むける)
 *   4画目(ヽ)  … くもの すきまから さしこむ ひかりの すじ
 *   5〜8画目   … のぼりきった おひさま(日)
 *   9画目(一)  … 地面(ち へいせん)
 *
 * ながれ
 *   あさ、子どもが ものさしを もって ねむそうに 立っている(あくび)
 *   → 地平線から おひさまが のぼりはじめる。子どもは おどろいて 見あげ、ものさしを むけて はかる
 *   → ものさしの しるし が おひさまと いっしょに のぼっていく
 *   → いちばん たかい ところで おひさまが とまる。しるしが いちばん うえに とどいて きらり
 *   → 子どもが ぴょんと とびはねて よろこぶ → ほね が ひかって、絵が うすくなり、字「昼」が のこる
 *
 * 人と おひさまは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる。ものさし は 手で にぎる。おひさまは 地平線の うしろから 出てくる まるい 形。
 *   字と ぴったり重なるのは おひさま(日)と 地面(一)。のこりは だいたい 同じ場所・同じ向き。
 */
import { during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '昼'

const SKIN = '#f8cfa6'
const HAIR = '#5a3b2a'
const SHIRT = '#ff8a5c'
const SHIRT_DARK = '#e5703f'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const SUN = '#ffd24a'
const SUN_DARK = '#ffb52e'
const SUN_GLOW = '#fff0a8'
const SKY_DAWN = '#fff0cc'
const SKY_DAY = '#cfeaff'
const HILL = '#e2f2d2'
const GRASS = '#c5e8a9'
const GRASS_TOP = '#8bd69a'
const LEAF = '#55b86e'
const CLOUD = '#ffffff'
const CLOUD_SHADE = '#e4eef8'
const RULER = '#f6d27a'
const RULER_DARK = '#c99a3c'
const MARK = '#e8534a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const LOOK = 1.5
const RISE_FROM = 1.3
const RISE_TO = 5.0
const CHEER = 5.5
const INK = 6.7
const DONE = 9.3
const DURATION = 10.2

/** 地面の 上の面(9画目の 高さ) */
const GROUND_Y = 91
/** おひさまの のぼりきった ばしょ(日 の まんなか)と、地平線の うしろの はじまり */
const SUN_TOP: readonly [number, number] = [52.5, 66]
const SUN_START_Y = 108
const SUN_R = 15
/** 子どもの手(ものさしを にぎる所)。3画目の はじまり(下)と おわり(上) */
const HAND: readonly [number, number] = [15, 70]
const RULER_TIP: readonly [number, number] = [32.3, 18]
/** ものさしの 長さ と、ま上から 右へ かたむく 角度(measure のとき 3画目に そろう) */
const RULER_LEN = Math.hypot(RULER_TIP[0] - HAND[0], HAND[1] - RULER_TIP[1])
const RULER_AIM = (Math.atan2(RULER_TIP[0] - HAND[0], HAND[1] - RULER_TIP[1]) * 180) / Math.PI

type Mood = 'sleepy' | 'wonder' | 'happy'

function Sky({ t }: SceneProps) {
  // あさやけ色 → しろっぽい あかるさ → 青空(色が にごらない よう 間に しろを はさむ)
  const bright = span(t, RISE_FROM, RISE_FROM + 1.6)
  const day = span(t, RISE_FROM + 1.2, RISE_TO)
  return (
    <>
      <rect x="0" y="0" width="109" height="109" fill={SKY_DAWN} />
      <rect x="0" y="0" width="109" height="109" fill="#fffaf0" opacity={bright} />
      <rect x="0" y="0" width="109" height="109" fill={SKY_DAY} opacity={day} />
    </>
  )
}

/** 地平線の うしろから のぼる おひさま。のぼるほど まぶしく、ひかりの わ が ひろがる。 */
function Sun({ t }: SceneProps) {
  const up = span(t, RISE_FROM, RISE_TO, easeInOut)
  const y = SUN_START_Y + (SUN_TOP[1] - SUN_START_Y) * up
  const glow = 0.25 + 0.5 * up
  return (
    <>
      <circle cx={SUN_TOP[0]} cy={y} r={SUN_R + 6 + wave(t, 2.4) * 0.8} fill={SUN_GLOW} opacity={glow} />
      <Layer rotate={t * 12} origin={[SUN_TOP[0], y]} opacity={0.4 + 0.6 * up}>
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={SUN_TOP[0] - 1} y={y - SUN_R - 6.5} width="2" height="4.4" rx="1" fill={SUN_DARK} transform={`rotate(${i * 30} ${SUN_TOP[0]} ${y})`} />
        ))}
      </Layer>
      <circle cx={SUN_TOP[0]} cy={y} r={SUN_R} fill={SUN} />
      <path d={`M${SUN_TOP[0] - 9} ${y - 7} Q${SUN_TOP[0] - 6} ${y - 11} ${SUN_TOP[0] - 1} ${y - 11.5}`} fill="none" stroke={SUN_GLOW} strokeWidth="2.2" strokeLinecap="round" />
    </>
  )
}

/** たかい空の くも。平たい そこ が 2画目、ふくらんだ 上が 1画目。ゆっくり ゆれる。 */
function HighCloud({ t }: SceneProps) {
  const appear = span(t, 0, 0.8, easeOut)
  return (
    <Layer opacity={appear} x={wave(t, 6) * 0.8}>
      <path d="M30 30.4 Q27.6 24.2 34 21.4 Q36 14.4 46 16.2 Q54 11.4 64 14.4 Q74 12.2 76.4 20 Q80.4 26 74 30.4 Z" fill={CLOUD} />
      <path d="M33 30.4 H75.5 Q79 30.4 75 28 H34 Q30 28.4 33 30.4 Z" fill={CLOUD_SHADE} />
    </Layer>
  )
}

/** くもの すきまから さす ひかりの すじ(4画目)。おひさまが たかく なるころ。 */
function Beam({ t }: SceneProps) {
  const show = span(t, RISE_TO - 0.8, RISE_TO + 0.6, easeOut)
  if (show <= 0) return null
  return (
    <g opacity={show * 0.55}>
      <path d="M62 32.4 C68.8 43 78 52 86.4 58.6 C89 60.6 91.4 62.4 94.4 63.1" fill="none" stroke={SUN_GLOW} strokeWidth="7" strokeLinecap="round" />
    </g>
  )
}

function Ground() {
  return (
    <>
      <path d="M-4 91 Q18 80 44 88 Q72 76 113 88 V101 H-4 Z" fill={HILL} />
      <path d={`M-4 ${GROUND_Y} Q30 ${GROUND_Y - 1} 56 ${GROUND_Y} T113 ${GROUND_Y - 1} V110 H-4 Z`} fill={GRASS} />
      <path d={`M-4 ${GROUND_Y} Q30 ${GROUND_Y - 1} 56 ${GROUND_Y} T113 ${GROUND_Y - 1}`} fill="none" stroke={GRASS_TOP} strokeWidth="1.6" strokeLinecap="round" />
      {[8, 40, 66, 96].map((x) => (
        <path key={x} d={`M${x} 98 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** ものさし。手で にぎる ところが 原点。しるし(あか)が おひさまと いっしょに のぼる。 */
function Ruler({ mark, shine }: { readonly mark: number; readonly shine: number }) {
  const markY = mix(mark, 0, 1, -9, -RULER_LEN + 6, easeOut)
  return (
    <>
      <rect x="-2.8" y={-RULER_LEN} width="5.6" height={RULER_LEN + 4} rx="1.6" fill={RULER} />
      <rect x="-2.8" y={-RULER_LEN} width="1.6" height={RULER_LEN + 4} rx="0.8" fill={RULER_DARK} opacity="0.5" />
      {Array.from({ length: 10 }, (_, i) => (
        <path key={i} d={`M2.8 ${-6 - i * 5} h${i % 2 === 0 ? -3.4 : -2}`} stroke={RULER_DARK} strokeWidth="0.7" strokeLinecap="round" />
      ))}
      <rect x="-3.6" y={markY - 1.2} width="7.2" height="2.4" rx="1.2" fill={MARK} />
      {shine > 0 ? (
        <g opacity={shine} transform={`translate(0 ${-RULER_LEN + 6})`}>
          <path d="M0 -6 L1.4 -1.4 L6 0 L1.4 1.4 L0 6 L-1.4 1.4 L-6 0 L-1.4 -1.4 Z" fill="#fff6c8" />
        </g>
      ) : null}
    </>
  )
}

/** うで。かた → ひじ → 手 の じゅんに つなげる。角度は ま下から(右へ ふると +)。 */
function Limb({ shoulder, upper, fore, upperLen, foreLen, color }: { readonly shoulder: readonly [number, number]; readonly upper: number; readonly fore: number; readonly upperLen: number; readonly foreLen: number; readonly color: string }) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const elbow = [shoulder[0] + Math.sin(rad(upper)) * upperLen, shoulder[1] + Math.cos(rad(upper)) * upperLen] as const
  const hand = [elbow[0] + Math.sin(rad(fore)) * foreLen, elbow[1] + Math.cos(rad(fore)) * foreLen] as const
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.3" fill={SKIN} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="12.4" cy="53.2" r="1.7" fill={CHEEK} opacity="0.55" />
      {mood === 'sleepy' ? (
        <>
          <path d="M11.4 49.6 l3.4 0.9" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <ellipse cx="13.6" cy="54" rx="1.5" ry="2" fill={MOUTH} />
        </>
      ) : mood === 'wonder' ? (
        <>
          <circle cx="13" cy="49.6" r="1.4" fill={EYE} />
          <path d="M11.4 46.2 l3.6 -0.8" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <ellipse cx="14" cy="54" rx="1.2" ry="1.4" fill={MOUTH} />
        </>
      ) : (
        <>
          <path d="M11.6 50.3 Q13.2 48.2 14.8 50.3" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M11.8 53 Q13.8 56.4 15.8 53 Z" fill={MOUTH} />
        </>
      )}
    </>
  )
}

type ChildProps = { readonly mood: Mood; readonly farUpper: number; readonly farFore: number; readonly headTilt: number; readonly breath: number }

/** 子ども(右むき)。あたま・くび・どう・あし。ものさしを もつ うでは かたから ひじで まがって 手へ。 */
function Child({ mood, farUpper, farFore, headTilt, breath }: ChildProps) {
  return (
    <>
      {/* むこうの うで(体の うしろ) */}
      <Limb shoulder={[6.2, 60]} upper={farUpper} fore={farFore} upperLen={6.6} foreLen={5.6} color={SHIRT_DARK} />
      <rect x="4.8" y="73" width="3.8" height="18.6" rx="1.9" fill={PANTS} />
      <rect x="9.8" y="73" width="3.8" height="18.6" rx="1.9" fill={PANTS} />
      <ellipse cx="7.4" cy="93" rx="3.4" ry="1.9" fill={SHOE} />
      <ellipse cx="12.6" cy="93" rx="3.4" ry="1.9" fill={SHOE} />
      {/* くび: みじかく、どう と あたま に かくれる */}
      <rect x="7.4" y="54.4" width="4" height="6" rx="1.8" fill={SKIN} />
      <Layer scaleX={1 + breath * 0.04} origin={[9.5, 76]}>
        <rect x="4" y="57" width="11" height="19.4" rx="4.6" fill={SHIRT} />
        <path d="M5.6 70 h8" stroke={SHIRT_DARK} strokeWidth="1.3" strokeLinecap="round" />
      </Layer>
      <Layer rotate={headTilt} origin={[9.5, 56]}>
        <circle cx="9.5" cy="50" r="7" fill={SKIN} />
        <path d="M2.4 49 C2.2 41.6 10.6 40 15 44.4 C16.6 46.4 16.8 49 16 51 C15.4 46.6 12.4 44.8 8.6 45.2 C5.4 45.4 3.4 47 2.4 49 Z" fill={HAIR} />
        <Face mood={mood} />
      </Layer>
      {/* てまえの うで: かた → ひじ → 手(ものさしを にぎる) */}
      <path d={`M12.8 60 L10.4 66.4 L${HAND[0]} ${HAND[1] - 0.4}`} fill="none" stroke={SHIRT} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={HAND[0]} cy={HAND[1]} r="2.4" fill={SKIN} />
    </>
  )
}

/** あくび の「ふあ」と、よろこんだ ときの とびはね線 */
function Yawn({ t }: SceneProps) {
  const show = during(t, 0.4, LOOK + 0.3, 0.25)
  if (show <= 0) return null
  const p = span(t, 0.4, LOOK + 0.3, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={19 + p * 3} cy={47 - p * 4} rx={2.4 + p * 1.4} ry={1.6 + p} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
    </g>
  )
}

function CheerLines({ t }: SceneProps) {
  const show = during(t, CHEER, INK - 0.2, 0.15)
  if (show <= 0) return null
  const lines = [-40, 0, 40]
  return (
    <g opacity={show} stroke="#f2b632" strokeWidth="1.3" strokeLinecap="round">
      {lines.map((a) => (
        <path key={a} d="M0 -12 v-4" transform={`translate(10 48) rotate(${a})`} />
      ))}
    </g>
  )
}

/** にぎやかしの 小鳥。おひさまが のぼりきる ころ、空を よこぎる。 */
function Bird({ t }: SceneProps) {
  const p = span(t, 3.4, 6.2)
  if (p <= 0 || p >= 1) return null
  const x = -6 + p * 120
  const y = 44 - Math.sin(p * Math.PI) * 8
  return (
    <Layer x={x} y={y}>
      <ellipse cx="0" cy="0" rx="3.2" ry="2.2" fill="#6f7cd8" />
      <circle cx="2.6" cy="-1.2" r="1.7" fill="#6f7cd8" />
      <path d="M4.2 -1.2 l2 0.5 l-2 0.7 Z" fill="#f2b632" />
      <Layer rotate={wave(t, 0.25) * 30} origin={[-0.4, -0.6]}>
        <path d="M-1.6 -0.6 Q-0.6 -5 2 -2 Q0 0 -1.6 -0.6 Z" fill="#4f5cc0" />
      </Layer>
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 9)

  // 子ども: あくび → おどろいて 見あげる → とびはねて よろこぶ
  const mood: Mood = t < RISE_FROM + 0.2 ? 'sleepy' : t < CHEER ? 'wonder' : 'happy'
  const breath = t < RISE_FROM ? wave(t, 1.6) : 0
  const jump = Math.max(0, Math.sin(span(t, CHEER, CHEER + 0.8) * Math.PI)) * 4.5
  const cheer = span(t, CHEER, CHEER + 0.35, easeOut) * (1 - span(t, INK - 0.5, INK - 0.05))
  const farUpper = mix(cheer, 0, 1, -6, -150, easeOut)
  const farFore = mix(cheer, 0, 1, -2, -172, easeOut)
  const headTilt = t < RISE_FROM ? 4 + breath : mix(t, RISE_FROM, RISE_FROM + 0.8, 4, -8) * (1 - cheer * 0.6)
  // ものさし: はじめは 立てて もち、おひさまが のぼるころ 空へ むける
  const aim = mix(t, LOOK, RISE_FROM + 1.2, -4, RULER_AIM, easeInOut)
  const mark = span(t, RISE_FROM, RISE_TO, easeInOut)
  const shine = during(t, RISE_TO + 0.1, CHEER + 0.5, 0.2)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.05

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <HighCloud t={t} />
        <Beam t={t} />
        <Sun t={t} />
        <Ground />
        <Bird t={t} />
        <Layer y={-jump}>
          <Layer x={HAND[0]} y={HAND[1]} rotate={aim}>
            <Ruler mark={mark} shine={shine} />
          </Layer>
          <Child mood={mood} farUpper={farUpper} farFore={farFore} headTilt={headTilt} breath={breath} />
          <Yawn t={t} />
          <CheerLines t={t} />
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
    { at: 0, label: 'あさ。子どもが ものさしを もって あくび', sound: 'pop' },
    { at: RISE_FROM, label: 'おひさまが のぼりはじめる。ものさしで はかる' },
    { at: RISE_TO, label: 'いちばん たかい ところで とまる', sound: 'pop' },
    { at: CHEER, label: 'やったあ! とびはねる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '昼 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
