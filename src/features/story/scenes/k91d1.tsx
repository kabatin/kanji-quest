/*
 * 金(かね): 土の中で つぶが きらきら 光る。
 *
 * ほね(画と絵の対応)
 *   1・2画目(人) … つちを つみあげた おか(つち山)の りょうがわの 草の ふち
 *   3・4画目(一) … おかの 中の、すな や 小石の すじ(地そう)
 *   5画目(丨)    … もぐらが ほりすすんだ たて穴
 *   6・7画目(丶) … 穴の かべに うまっている、金の つぶ(左と右)
 *   8画目(一)    … いちばん 下の かたい いわの ゆか(もぐらは この上まで ほる)
 *
 * ながれ
 *   つちの おかが もりあがる → 中の 小さな へやで、もぐらが ひまそうに している
 *   → つちの中で「きらっ」と 光る → もぐらが きづいて、ふしぎそうに 見る
 *   → 「なんだろう」と たて穴を ほりすすむ(つちが とぶ・あせ が出る)
 *   → 下で 穴を ひろげると、左と右の かべから 金の つぶが 出てくる → もぐら、びっくり、そして おおよろこび
 *   → ほね が ひかって、絵が うすくなり、字「金」が のこる
 *
 * もぐらは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   くろっぽい まるい体、さきが とがった ピンクの はな、ちいさな目、
 *   つちを かく 大きな ピンクの 手(つめ つき)。うで は かた から出て ひじ で まがる。
 *   つちの中の 穴は、ほった ところだけ 空いている(まわりは つち)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '金'

const SOIL = '#b98258'
const SOIL_DARK = '#9a6a44'
const SOIL_LIGHT = '#d9a878'
const SEAM = '#dcc08f'
const HOLE = '#553522'
const ROCK = '#7d7a8c'
const LEDGE = '#a9a6b8'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const GOLD = '#ffc83a'
const GOLD_DARK = '#e8a21c'
const GOLD_LIGHT = '#fff0a8'
const MOLE = '#6e6a84'
const MOLE_BELLY = '#8f8ba6'
const PINK = '#f4a7a0'
const PINK_DARK = '#e48c88'
const CLAW = '#fff4e8'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const DROP = '#7cc4f2'

/** くぎり の時間(秒) */
const HILL_FROM = 0.1
const DEN = 1.0
/** 土の中で「きらっ」と 光り、もぐらが きづく */
const GLINT = 1.6
const DIG = 2.5
/** いちばん 下に ついて、穴を よこへ ひろげる */
const BOTTOM = 5.0
const WIDEN_END = 5.8
const FIND_LEFT = 5.55
const FIND_RIGHT = 5.7
const JOY = 6.3
const INK = 7.2
const DONE = 10.2
const DURATION = 10.8

/** もぐらの へや(しゅっぱつ点)と、ほりおわった ところ。x は たて穴(5画目)の まんなか */
const SHAFT_X = 52
const DEN_Y = 58
const FLOOR_Y = 80.5
/** 穴の はんけい(もぐらの体が ちょうど おさまる)と、たて穴の はば */
const HOLE_R = 10.5
const SHAFT_W = 12
/** 下で ひろげた へやの よこはば(まんなか から かべ まで) */
const CHAMBER_RX = 21.5
const MOLE_SCALE = 0.8

type Lump = readonly [cx: number, cy: number, r: number]
/** 金の つぶ。6・7画目の線に そって ならぶ ごつごつした かたまり */
const LEFT_NUGGET: readonly Lump[] = [[32.6, 76.8, 3.6], [35.6, 80.6, 4.2], [38.4, 85.2, 3.4]]
const RIGHT_NUGGET: readonly Lump[] = [[72.6, 74.2, 3.4], [69.6, 79.6, 4.2], [64.6, 84.6, 3.6]]
const LEFT_CENTER: readonly [number, number] = [35.6, 80.6]
const RIGHT_CENTER: readonly [number, number] = [69.6, 79.6]

/** おか(1・2画目)の ふち。左はしから まっすぐ のぼり、てっぺんで 右へ おりる */
const HILL_POINTS: readonly (readonly [number, number])[] = [
  [14.5, 60],
  [14.5, 58],
  [21.6, 53.1],
  [28.2, 47.4],
  [34.1, 41.1],
  [39.6, 34.4],
  [44.7, 27.4],
  [49.2, 20],
  [51.8, 11.9],
  [53.2, 17.5],
  [58.4, 23.4],
  [64.3, 28.7],
  [70.2, 34],
  [76.2, 39.3],
  [82.1, 44.7],
  [88.1, 49.9],
  [95, 53.8],
  [95, 60],
]

const hillPath = `M${HILL_POINTS.map(([x, y]) => `${x} ${y}`).join(' L')} Z`

function Sky({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[94, 14]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="93.2" y="2.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 94 14)`} />
        ))}
      </Layer>
      <circle cx="94" cy="14" r={6.2 * sun} fill={SUN} />
      {/* ゆっくり ながれる 雲(おくゆき を出す) */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="6" cy="26" rx="7" ry="3.4" />
        <ellipse cx="11" cy="24" rx="5" ry="3.4" />
      </g>
    </>
  )
}

/** 土の おか と、その下の つち・いわ。おかは 下から もりあがる。 */
function Earth({ t }: SceneProps) {
  const rise = span(t, HILL_FROM, 1.0, easeOut)
  const seams = span(t, 0.9, 1.4)
  return (
    <>
      {/* 地面から 下は ぜんぶ つち。右はし は 地面が 少し 高い */}
      <path d="M-2 112 V59 H95 V54 H111 V112 Z" fill={SOIL} />
      <rect x="-2" y="95" width="113" height="17" fill={ROCK} />
      <path d="M-2 59 L14.5 59 M95 54 L111 54" stroke={LEAF} strokeWidth="3.2" strokeLinecap="round" fill="none" />
      <Layer scaleY={rise} origin={[54, 59]}>
        <path d={hillPath} fill={SOIL} stroke={SOIL} strokeWidth="1.4" strokeLinejoin="round" />
        <Bone char={CHAR} n={1} color={LEAF} width={3.4} />
        <Bone char={CHAR} n={2} color={LEAF} width={3.4} />
        {/* おかの 草の はな */}
        <circle cx="30" cy="45.4" r="1.4" fill="#ff7a8a" />
        <circle cx="78" cy="41" r="1.4" fill="#ffffff" />
      </Layer>
      {/* つぶの ような 小石 */}
      <g fill={SOIL_DARK} opacity={seams}>
        {([[8, 70, 2], [91, 72, 2.6], [17, 87, 1.8], [90, 86, 2.2], [101, 66, 1.6], [24, 63, 1.5], [82, 61, 1.6]] as const).map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
        ))}
      </g>
      {/* すな や 小石の すじ(地そう) */}
      <g opacity={seams}>
        <Bone char={CHAR} n={3} color={SEAM} width={3.2} />
        <Bone char={CHAR} n={4} color={SEAM} width={3.2} />
      </g>
      {/* いちばん 下の かたい いわの ゆか */}
      <Bone char={CHAR} n={8} color={LEDGE} width={5.5} />
    </>
  )
}

/** ほった 穴。へや → たて穴 → 下で よこに ひろがる。もぐらの いる ところだけ 空いている。 */
function Hole({ t, moleY, widen }: SceneProps & { readonly moleY: number; readonly widen: number }) {
  const den = span(t, DEN, DEN + 0.5, easeOut)
  if (den <= 0) return null
  return (
    <g fill={HOLE}>
      <Layer scale={den} origin={[SHAFT_X, DEN_Y]}>
        <circle cx={SHAFT_X} cy={DEN_Y} r={HOLE_R} />
      </Layer>
      <rect x={SHAFT_X - SHAFT_W / 2} y={DEN_Y} width={SHAFT_W} height={Math.max(0, moleY - DEN_Y)} />
      <ellipse cx={SHAFT_X} cy={moleY} rx={HOLE_R + (CHAMBER_RX - HOLE_R) * widen} ry={HOLE_R} />
    </g>
  )
}

/** 金の つぶ。穴の かべから ぽん と あらわれる。 */
function Nugget({ lumps, center, from, t }: { readonly lumps: readonly Lump[]; readonly center: readonly [number, number]; readonly from: number; readonly t: number }) {
  const pop = span(t, from, from + 0.4, backOut)
  if (pop <= 0) return null
  return (
    <Layer scale={pop} origin={center}>
      {lumps.map(([cx, cy, r]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx + 0.5} cy={cy + 0.6} r={r} fill={GOLD_DARK} />
          <circle cx={cx} cy={cy} r={r * 0.88} fill={GOLD} />
          <circle cx={cx - r * 0.3} cy={cy - r * 0.35} r={r * 0.3} fill={GOLD_LIGHT} />
        </g>
      ))}
    </Layer>
  )
}

/** 土の中の「きらっ」。つぶが あらわれる まで、左と右が かわりばんこに 光る。 */
function Glint({ t }: SceneProps) {
  const show = during(t, GLINT, FIND_LEFT + 0.2, 0.2)
  if (show <= 0) return null
  const left = (wave(t, 0.7) + 1) / 2
  const right = (wave(t, 0.7, 0.35) + 1) / 2
  return (
    <g opacity={show}>
      <Star cx={LEFT_CENTER[0]} cy={LEFT_CENTER[1]} r={1.2 + left * 3} color="#fff7c2" spin={left * 40} />
      <Star cx={RIGHT_CENTER[0]} cy={RIGHT_CENTER[1]} r={1.2 + right * 3} color="#fff7c2" spin={right * 40} />
    </g>
  )
}

/** きづいた しるし(「!」)。もぐらの あたまの ななめ上に ぽん と出る。 */
function Notice({ t }: SceneProps) {
  const show = during(t, GLINT + 0.15, DIG, 0.2)
  if (show <= 0) return null
  const pop = span(t, GLINT + 0.15, GLINT + 0.5, backOut)
  return (
    <Layer scale={pop} origin={[63.5, 45]} opacity={show}>
      <circle cx="63.5" cy="44" r="4.6" fill="#ffffff" />
      <path d="M59.6 47.6 L58.4 50 L62.2 47.9 Z" fill="#ffffff" />
      <rect x="62.7" y="40.4" width="1.7" height="4.6" rx="0.85" fill="#ff8a3c" />
      <circle cx="63.55" cy="46.6" r="1" fill="#ff8a3c" />
    </Layer>
  )
}

/** ほっている ときに とぶ つちの つぶ(穴の中だけ) */
function Crumbs({ t, moleY }: SceneProps & { readonly moleY: number }) {
  const show = during(t, DIG, WIDEN_END, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show} fill={SOIL_LIGHT}>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const side = i % 2 === 0 ? -1 : 1
        const p = (t * 1.7 + i / 6) % 1
        const x = SHAFT_X + side * (6.5 + p * 3)
        const y = moleY + 6.5 - Math.sin(p * Math.PI) * 6.5 + p * 3
        return <circle key={i} cx={x} cy={y} r={1.1 - p * 0.3} opacity={1 - p * 0.6} />
      })}
    </g>
  )
}

type Mood = 'bored' | 'curious' | 'effort' | 'surprised' | 'joyful'

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="-4.9" cy="-3.2" r="1.3" fill="#ff9d9d" opacity="0.5" />
      <circle cx="4.9" cy="-3.2" r="1.3" fill="#ff9d9d" opacity="0.5" />
      {/* とがった ピンクの はな(もぐらの とくちょう) */}
      <ellipse cx="0" cy="-2.9" rx="2.7" ry="2.1" fill={PINK} />
      <circle cx="-0.9" cy="-3" r="0.45" fill={PINK_DARK} />
      <circle cx="0.9" cy="-3" r="0.45" fill={PINK_DARK} />
      {mood === 'bored' && (
        <>
          <circle cx="-2.7" cy="-6.6" r="1.05" fill={EYE} />
          <circle cx="2.7" cy="-6.6" r="1.05" fill={EYE} />
          <path d="M-4.1 -7.2 h2.8 M1.3 -7.2 h2.8" stroke={MOLE} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M-1.2 0.3 h2.4" stroke={EYE} strokeWidth="0.9" strokeLinecap="round" />
        </>
      )}
      {mood === 'curious' && (
        <>
          <circle cx="-2.7" cy="-6.6" r="1.3" fill={EYE} />
          <circle cx="2.7" cy="-6.6" r="1.3" fill={EYE} />
          <circle cx="-2.3" cy="-7" r="0.4" fill="#ffffff" />
          <circle cx="3.1" cy="-7" r="0.4" fill="#ffffff" />
          <ellipse cx="0" cy="0.5" rx="0.9" ry="1" fill={MOUTH} />
        </>
      )}
      {mood === 'effort' && (
        <>
          <path d="M-4.1 -7.9 l2.6 1.1 l-2.6 1.1" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4.1 -7.9 l-2.6 1.1 l2.6 1.1" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M-2 0.2 Q0 1.4 2 0.2" fill="none" stroke={EYE} strokeWidth="0.9" strokeLinecap="round" />
        </>
      )}
      {mood === 'surprised' && (
        <>
          <circle cx="-2.8" cy="-6.6" r="1.9" fill="#ffffff" />
          <circle cx="2.8" cy="-6.6" r="1.9" fill="#ffffff" />
          <circle cx="-2.8" cy="-6.4" r="1" fill={EYE} />
          <circle cx="2.8" cy="-6.4" r="1" fill={EYE} />
          <ellipse cx="0" cy="1" rx="1.4" ry="1.8" fill={MOUTH} />
        </>
      )}
      {mood === 'joyful' && (
        <>
          <path d="M-4.4 -6 Q-2.7 -8.5 -1 -6" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M1 -6 Q2.7 -8.5 4.4 -6" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M-2.4 -0.1 Q0 3.6 2.4 -0.1 Z" fill={MOUTH} />
        </>
      )}
    </>
  )
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/**
 * もぐらの うで。かた から出て、ひじ で まがり、手(ピンクの 大きな 手と つめ)に つながる。
 * raise 0 = 下に さげて つちを かく / 1 = 上に あげて よろこぶ。off は かく ときの 上下。
 */
function Arm({ side, raise, off }: { readonly side: -1 | 1; readonly raise: number; readonly off: number }) {
  const shoulder = [side * 5.6, 0] as const
  const elbow = [side * lerp(8.4, 9.6, raise), lerp(3.2, -0.5, raise)] as const
  const hand = [side * lerp(7.4, 10.2, raise), lerp(8.4 + off, -6.8 + off * 0.4, raise)] as const
  const angle = (Math.atan2(-(hand[0] - elbow[0]), hand[1] - elbow[1]) * 180) / Math.PI
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={MOLE} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      <g transform={`translate(${hand[0]} ${hand[1]}) rotate(${angle})`}>
        <ellipse cx="0" cy="0.6" rx="3.5" ry="2.8" fill={PINK} />
        <path d="M-1.8 2.6 v1.8 M0 3 v2 M1.8 2.6 v1.8" stroke={CLAW} strokeWidth="0.9" strokeLinecap="round" />
      </g>
    </>
  )
}

type MoleProps = { readonly mood: Mood; readonly raise: number; readonly dig: number; readonly sweat: number; readonly t: number }

function Mole({ mood, raise, dig, sweat, t }: MoleProps) {
  const p = (t * 1.1) % 1
  return (
    <>
      <ellipse cx="-3.6" cy="10.6" rx="3" ry="1.7" fill={PINK_DARK} />
      <ellipse cx="3.6" cy="10.6" rx="3" ry="1.7" fill={PINK_DARK} />
      <ellipse cx="0" cy="3.5" rx="7.2" ry="7.4" fill={MOLE} />
      <ellipse cx="0" cy="5" rx="4.2" ry="4.5" fill={MOLE_BELLY} />
      <circle cx="0" cy="-5" r="6" fill={MOLE} />
      <Face mood={mood} />
      <Arm side={-1} raise={raise} off={dig * 2.6} />
      <Arm side={1} raise={raise} off={-dig * 2.6} />
      {sweat > 0 && <path d="M0 -2 Q1.6 0.4 0 1.6 Q-1.6 0.4 0 -2 Z" fill={DROP} opacity={sweat * (1 - p)} transform={`translate(${7.4 + p * 1.4} ${-8 + p * 6})`} />}
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)

  // もぐら: へや から たて穴を ほりすすみ、下に ついたら 穴を よこへ ひろげる
  const moleY = mix(t, DIG, BOTTOM, DEN_Y, FLOOR_Y, easeInOut)
  const widen = span(t, BOTTOM, WIDEN_END, easeOut)
  const digging = t >= DIG && t < WIDEN_END
  const dig = digging ? wave(t - DIG, 1 / 2.4) : 0
  const joy = span(t, JOY, JOY + 0.4, easeOut)
  const surprise = span(t, FIND_LEFT, FIND_LEFT + 0.2, easeOut) * 0.35
  const raise = Math.max(surprise, joy)
  const mood: Mood = t < GLINT ? 'bored' : t < DIG ? 'curious' : t < FIND_LEFT ? 'effort' : t < JOY ? 'surprised' : 'joyful'
  // うれしくて ぴょんと はずむ。ひまな ときは ゆっくり いきを する
  const hop = t >= JOY ? -Math.abs(wave(t, 0.7)) * 1.6 * joy : 0
  const breath = t < DIG ? wave(t, 1.8) * 0.02 : 0
  const arrive = span(t, DEN, DEN + 0.5, backOut)
  const sweat = during(t, DIG + 0.4, WIDEN_END, 0.3)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Earth t={t} />
        <Hole t={t} moleY={moleY} widen={widen} />
        <Nugget lumps={LEFT_NUGGET} center={LEFT_CENTER} from={FIND_LEFT} t={t} />
        <Nugget lumps={RIGHT_NUGGET} center={RIGHT_CENTER} from={FIND_RIGHT} t={t} />
        <Glint t={t} />
        <Crumbs t={t} moleY={moleY} />
        {t >= DEN && (
          <Layer x={SHAFT_X} y={moleY + hop} scaleX={MOLE_SCALE * arrive} scaleY={MOLE_SCALE * arrive * (1 + breath)}>
            <Mole mood={mood} raise={raise} dig={dig} sweat={sweat} t={t} />
          </Layer>
        )}
        <Notice t={t} />
        {/* おおよろこびの きらきら(つぶの まわり) */}
        {t >= JOY && t < INK + 0.5 && (
          <g opacity={joy}>
            <Star cx={30} cy={72} r={2 + (wave(t, 0.5) + 1) * 0.8} color={GOLD_LIGHT} spin={t * 60} />
            <Star cx={75} cy={70} r={2 + (wave(t, 0.5, 0.25) + 1) * 0.8} color={GOLD_LIGHT} spin={-t * 60} />
          </g>
        )}
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
    { at: 0, label: 'つちの おかが もりあがる', sound: 'pop' },
    { at: DEN, label: '中の へやで、もぐらが ひまそうに している' },
    { at: GLINT, label: 'つちの中で「きらっ」。もぐらが きづく' },
    { at: DIG, label: 'なんだろう と たて穴を ほりすすむ' },
    { at: BOTTOM, label: '下で 穴を ひろげる' },
    { at: FIND_LEFT, label: '金の つぶが 出てきて、もぐら びっくり', sound: 'pop' },
    { at: JOY, label: 'おおよろこび' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '金 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
