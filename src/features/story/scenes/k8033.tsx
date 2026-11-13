/*
 * 耳(みみ): 音を きく 人の 耳の 形。
 *
 * ほね(画と絵の対応)
 *   絵は「耳」を ひとつの 絵として 描く(分けない字)。さいごに 子どもの 耳へ ズームして、
 *   1画目(一)   … 耳の いちばん上(ふちの てっぺん)
 *   2画目(丨)   … 耳の 前がわの ふち(顔に ちかい ほう)
 *   3・4画目    … 耳の 中の しわ(みみの あな の まわり)
 *   5画目       … 耳の したの ふち(みみたぶ のほう)
 *   6画目(丨)   … 耳の うしろの ふち。そのまま 首の うしろへ おりる
 *   だいたい 同じ場所・同じ向きに 重なれば よい(耳の 形を ゆがめない)。
 *
 * ながれ
 *   草っぱらで、ひまそうな 子どもが ひとり(つまらなそうな 顔)
 *   → 木の えだに 小鳥が とんできて、ぴぴぴ と うたいだす
 *   → 音符が ふわっと とんで、子どもの 耳へ はいる。子どもは はっと して、にっこり
 *   → 耳に ぐーんと ズーム。音符が 耳の あなへ すいこまれる
 *   → ほね が ひかって、絵が うすくなり、字「耳」が のこる
 *
 * 子どもは 左むき(小鳥の ほうを むく)。耳は 顔の まんなかより うしろ、目の よこの 高さ。
 * あたまは 大きめ(子どもの つくり)、首は みじかく、うで は かた から出て ひじ で まがる。
 * 耳の 大きさは ほんものと 同じくらい(あたまの 4わり)。字に 合わせるために、
 * 耳を 大きく ゆがめず、画面を 耳へ ぐーんと ズームして 字の大きさに そろえた。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '耳'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const EAR_DEEP = '#d99a6c'
const HAIR = '#5a3b2a'
const HAIR_LIGHT = '#7a5540'
const TUNIC = '#4f9be0'
const TUNIC_DARK = '#3c82c4'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const SKY = '#eef8ff'
const NOTE_PINK = '#f07f9e'
const NOTE_BLUE = '#5f7fd6'

/** くぎり の時間(秒) */
const BIRD_IN = 1.0
const PERCH = 2.0
const SING = 2.4
/** 1つめの 音符が 耳に とどく → はっと する */
const HEAR = 3.4
const HAPPY = 4.0
const ZOOM = 4.4
const ZOOM_END = 5.9
const INK = 6.8
const DONE = 9.9
const DURATION = 10.4

/** 耳の 場所(ズーム前)。あたまの まんなか(66,40)より うしろ(右)・少し下 */
const EAR: readonly [number, number] = [69, 42]
/** ズームの あと、耳が 来る場所(字の 耳の まんなか) */
const EAR_GOAL: readonly [number, number] = [55, 44]
/** ズームの 大きさ: ほんものの 耳(たて 10)が、字の 耳(たて 60)に なるまで */
const ZOOM_SCALE = 6
/** 小鳥の くちばし(音符が 出る所) と とまる場所 */
const PERCH_AT: readonly [number, number] = [26, 40.5]
const BEAK: readonly [number, number] = [36, 38]
/** あたまの かたむきの じく(首の つけね) */
const NECK: readonly [number, number] = [65, 52]
/** かた(うで の じく) */
const SHOULDER: readonly [number, number] = [65.5, 58]

function Sky({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[96, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="95.2" y="3.4" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 96 13)`} />
        ))}
      </Layer>
      <circle cx="96" cy="13" r={5.6 * sun} fill={SUN} />
      <g fill="#ffffff" opacity="0.95" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="46" cy="12" rx="7" ry="3.2" />
        <ellipse cx="51" cy="10.2" rx="5" ry="3.2" />
      </g>
    </>
  )
}

function Ground() {
  return (
    <>
      <path d="M-30 99 Q18 78 52 92 Q90 74 140 93 V101 H-30 Z" fill="#e2f2d2" />
      <ellipse cx="54.5" cy="98" rx="70" ry="5.6" fill={GRASS} />
      {[3, 30, 46, 82, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 小鳥が とまる 木。みき が のびて、えだ が ひろがり、葉が しげる。 */
function Tree({ t }: SceneProps) {
  const trunk = span(t, 0.1, 0.7, backOut)
  const leaves = span(t, 0.4, 1.0, backOut)
  const sway = wave(t, 3.4) * 1.2
  return (
    <>
      <ellipse cx="14" cy="97.6" rx={11 * trunk} ry="2.4" fill="#000000" opacity="0.1" />
      <Layer scaleY={trunk} scaleX={0.6 + 0.4 * trunk} origin={[14, 96]}>
        <path d="M9 97 Q13 92 12.2 84 L16.8 84 Q16 92 20 97 Z" fill={BARK} />
        <rect x="11.6" y="26" width="4.8" height="62" rx="2.2" fill={BARK} />
        <path d="M14 53 Q23 51 31 44.6" fill="none" stroke={BARK} strokeWidth="2.8" strokeLinecap="round" />
        <path d="M13.6 60 q1 4 0 8" fill="none" stroke={BARK_DARK} strokeWidth="0.8" strokeLinecap="round" />
      </Layer>
      <Layer scale={leaves} rotate={sway} origin={[14, 34]}>
        <circle cx="5.5" cy="28" r="8" fill={LEAF_DARK} />
        <circle cx="23" cy="27" r="8.4" fill={LEAF_DARK} />
        <circle cx="14" cy="19" r="10.5" fill={LEAF_DARK} />
        <circle cx="9" cy="27" r="7.4" fill={LEAF} />
        <circle cx="19.5" cy="26" r="7.6" fill={LEAF} />
        <circle cx="14" cy="22" r="8.4" fill={LEAF} />
        <circle cx="10.5" cy="17.4" r="3.2" fill={LEAF_LIGHT} />
      </Layer>
    </>
  )
}

/**
 * 小鳥。右(子どものほう)を むく。とんでくる → えだに とまる → くちばしを あけて うたう。
 * ほんものの 鳥と 同じく、はね は せなか から、あし は おなか の下。
 */
function Bird({ t }: SceneProps) {
  const arrive = span(t, BIRD_IN, PERCH, easeOut)
  if (arrive <= 0) return null
  // 左上から、ゆるい山なり で おりてくる
  const x = -8 + (PERCH_AT[0] + 8) * arrive
  const y = 4 + (PERCH_AT[1] - 4) * arrive - Math.sin(arrive * Math.PI) * 8
  const landed = arrive >= 1
  const singing = during(t, SING, INK - 0.2, 0.2)
  const bounce = landed ? Math.max(0, wave(t, 0.8)) * singing * 0.9 : 0
  const flap = landed ? 0 : wave(t, 0.16) * 30
  // うたうとき、くちばしが ぱくぱく
  const open = singing > 0 ? (0.5 + 0.5 * wave(t, 0.4)) * 22 : 0
  return (
    <Layer x={x} y={y - bounce} scaleX={-1.35} scaleY={1.35}>
      {landed && <path d="M-0.6 3 v3.4 M1.4 3 v3.4" stroke="#e2a03f" strokeWidth="0.6" strokeLinecap="round" />}
      <path d="M2.6 0.4 l4.6 -1.6 l-3.4 3.2 Z" fill="#e2733f" />
      <ellipse cx="0" cy="0" rx="4" ry="3.1" fill="#ff9a5c" />
      <ellipse cx="-0.4" cy="1.2" rx="2.6" ry="1.5" fill="#ffd2a8" />
      <circle cx="-3" cy="-2.3" r="2.3" fill="#ff9a5c" />
      <Layer rotate={-open * 0.5} origin={[-4.6, -2.2]}>
        <path d="M-4.8 -2.7 l-2.6 0.8 l2.6 0.5 Z" fill="#f2b632" />
      </Layer>
      <Layer rotate={open} origin={[-4.6, -2]}>
        <path d="M-4.8 -1.9 l-2.2 0.8 l2.2 0.6 Z" fill="#e6a020" />
      </Layer>
      <circle cx="-3.6" cy="-2.9" r="0.55" fill="#2b2b2b" />
      <Layer rotate={flap} origin={[0.4, -0.6]}>
        <path d="M-1.2 -0.8 Q1.6 -3.8 4 -0.6 Q1.6 0.8 -1.2 -0.8 Z" fill="#e2733f" />
      </Layer>
    </Layer>
  )
}

/** 音符 1つ。ぼう と ふくらみ。 */
function Note({ x, y, color, size }: { readonly x: number; readonly y: number; readonly color: string; readonly size: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`}>
      <path d="M1.1 0 v-4.6 l2.6 -0.8 v4.2" fill="none" stroke={color} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="0" cy="0.2" rx="1.35" ry="1" fill={color} transform="rotate(-18)" />
      <ellipse cx="2.6" cy="-0.6" rx="1.35" ry="1" fill={color} transform="rotate(-18 2.6 -0.6)" />
    </g>
  )
}

/** くちばしから 子どもの 耳へ、ふわっと とぶ 音符。耳に はいる とき ちいさく なって きえる。 */
function Notes({ t }: SceneProps) {
  const active = during(t, SING, INK - 0.2, 0.2)
  if (active <= 0) return null
  const control = [52, 25] as const
  return (
    <>
      {[0, 1, 2].map((i) => {
        const age = (t - SING - i * 0.8 + 2.4) % 2.4
        const p = age / 1.2
        if (p > 1 || t < SING + i * 0.8) return null
        const q = 1 - p
        const x = q * q * BEAK[0] + 2 * q * p * control[0] + p * p * EAR[0]
        const y = q * q * BEAK[1] + 2 * q * p * control[1] + p * p * EAR[1] + Math.sin(p * 11) * 1.1
        const fade = Math.min(span(p, 0, 0.12), 1 - span(p, 0.82, 1))
        const size = (0.85 + 0.15 * wave(t, 0.5, i)) * (1 - 0.45 * span(p, 0.7, 1))
        return (
          <g key={i} opacity={fade * active}>
            <Note x={x} y={y} color={i % 2 === 0 ? NOTE_PINK : NOTE_BLUE} size={size} />
          </g>
        )
      })}
    </>
  )
}

type Mood = 'bored' | 'surprised' | 'happy'

/** うで。かた → ひじ → 手 の じゅんに つながる。swing は ま下から まえ(左)へ ふった角度。 */
function Arm({ swing, bend }: { readonly swing: number; readonly bend: number }) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const part = 8
  const elbow = [SHOULDER[0] - Math.sin(rad(swing)) * part, SHOULDER[1] + Math.cos(rad(swing)) * part] as const
  const fore = swing + bend
  const hand = [elbow[0] - Math.sin(rad(fore)) * part, elbow[1] + Math.cos(rad(fore)) * part] as const
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={TUNIC_DARK} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.2" fill={SKIN} />
    </>
  )
}

/** 耳。ふちの まわり・耳の あな・みみたぶ。顔の 左むき なので、あなは 前(左)に ひらく。 */
function Ear({ perk }: { readonly perk: number }) {
  return (
    <Layer scale={1 + perk * 0.07} origin={EAR}>
      <ellipse cx={EAR[0]} cy={EAR[1]} rx="3.1" ry="5" fill={SKIN_SHADE} />
      <ellipse cx={EAR[0] - 0.1} cy={EAR[1] - 0.3} rx="2.5" ry="4.3" fill={SKIN} />
      {/* ふちの しわ(うしろを まわる) */}
      <path d="M67.3 38.4 Q71 37.8 71 42.2 Q71 45.8 68.6 46" fill="none" stroke={EAR_DEEP} strokeWidth="0.5" strokeLinecap="round" />
      {/* 耳の あな の まわり */}
      <path d="M67 40.4 Q69.4 40.2 69.4 42.6 Q69.4 44.2 68 44.4" fill="none" stroke={EAR_DEEP} strokeWidth="0.45" strokeLinecap="round" />
      <ellipse cx="67.9" cy="42.4" rx="0.9" ry="1.5" fill={EAR_DEEP} />
    </Layer>
  )
}

type ChildProps = {
  readonly mood: Mood
  readonly tilt: number
  readonly swing: number
  readonly perk: number
}

/** 子ども(左むき)。あたまは 大きめ、首は みじかく、耳は 目の よこの 高さ。 */
function Child({ mood, tilt, swing, perk }: ChildProps) {
  return (
    <>
      {/* あし: こしから まっすぐ、くつは 前(左)へ */}
      <rect x="61.6" y="73" width="4.4" height="20.6" rx="2.2" fill={PANTS_DARK} />
      <ellipse cx="62.4" cy="94.2" rx="4.4" ry="2.3" fill={SHOE} />
      <rect x="66.2" y="73" width="4.4" height="20.6" rx="2.2" fill={PANTS} />
      <ellipse cx="66.2" cy="94.2" rx="4.4" ry="2.3" fill={SHOE} />
      {/* 首: どう と あたま の間を みじかく つなぐ */}
      <rect x="62.6" y="48" width="5.4" height="10" rx="2.4" fill={SKIN_SHADE} />
      {/* どう */}
      <rect x="60.4" y="54" width="11" height="22" rx="5" fill={TUNIC} />
      <path d="M62 70 h8" stroke={TUNIC_DARK} strokeWidth="1" strokeLinecap="round" />
      <Arm swing={swing} bend={10} />
      {/* あたま */}
      <Layer rotate={tilt} origin={NECK}>
        {/* あたま: はだ の 上に、はえぎわ より 上と うしろだけ かみを 重ねる */}
        <circle cx="54" cy="42.2" r="1.7" fill={SKIN} />
        <circle cx="66" cy="40" r="12" fill={SKIN} />
        <path d="M53.8 39.5 A12.2 12.2 0 1 1 75.2 48 L74.2 47.6 L73.8 38.5 Q72.6 35.8 70 35.6 Q67 34 62 36.2 Q57 35.4 55 39 Z" fill={HAIR} />
        <path d="M60 31.6 Q66 29.4 72 31.6" fill="none" stroke={HAIR_LIGHT} strokeWidth="1" strokeLinecap="round" />
        <Ear perk={perk} />
        <circle cx="59.4" cy="45.4" r="1.9" fill="#ff9d9d" opacity={mood === 'happy' ? 0.7 : 0.4} />
        {mood === 'bored' && (
          <>
            <circle cx="58.6" cy="41" r="1.1" fill="#2b2b2b" />
            <path d="M56.8 39 L60.6 40.2" stroke={SKIN_SHADE} strokeWidth="1.8" strokeLinecap="round" />
            <path d="M56.6 38.6 L60.6 39.8" stroke="#2b2b2b" strokeWidth="0.55" strokeLinecap="round" />
            <path d="M57.6 47.8 L60.2 47.6" stroke="#b9483f" strokeWidth="0.9" strokeLinecap="round" />
          </>
        )}
        {mood === 'surprised' && (
          <>
            <circle cx="58.6" cy="40.4" r="1.6" fill="#ffffff" stroke="#2b2b2b" strokeWidth="0.4" />
            <circle cx="58.3" cy="40.4" r="0.9" fill="#2b2b2b" />
            <path d="M56.8 36.6 Q58.6 35.2 60.6 36.4" fill="none" stroke="#2b2b2b" strokeWidth="0.55" strokeLinecap="round" />
            <ellipse cx="58.4" cy="47.2" rx="1" ry="1.4" fill="#b9483f" />
          </>
        )}
        {mood === 'happy' && (
          <>
            <path d="M57 41.2 Q58.6 39.2 60.2 41.2" fill="none" stroke="#2b2b2b" strokeWidth="0.8" strokeLinecap="round" />
            <path d="M57.4 46.4 Q59 49 61.4 46.6" fill="none" stroke="#b9483f" strokeWidth="0.8" strokeLinecap="round" />
          </>
        )}
      </Layer>
    </>
  )
}

/** つまらなそうな ため息(はじめ だけ)。 */
function Sigh({ t }: SceneProps) {
  const show = during(t, 1.1, 2.3, 0.25)
  if (show <= 0) return null
  const p = span(t, 1.1, 2.3, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={55 - p * 5} cy={49 + p * 2} rx={1.6 + p * 1.4} ry={1.1 + p * 0.9} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.4" />
    </g>
  )
}

/** 耳が ぴくっと する しるし(はっと した しゅんかん)。 */
function Tingle({ t }: SceneProps) {
  const show = during(t, HEAR, HAPPY + 0.3, 0.15)
  if (show <= 0) return null
  return (
    <g opacity={show} stroke="#ffb74d" strokeWidth="0.55" strokeLinecap="round">
      <path d="M72.8 36.4 l2 -1.6 M74.4 40.4 l2.4 -0.4 M73.6 44.6 l2.2 0.8" />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)
  const zoom = span(t, ZOOM, ZOOM_END, easeInOut)
  const calm = 1 - span(t, ZOOM - 0.2, ZOOM + 0.8)

  const mood: Mood = t < HEAR ? 'bored' : t < HAPPY ? 'surprised' : 'happy'
  // あたま: つまらないと うつむき、はっと すると 小鳥を 見あげ、うれしいと リズムに ゆれる
  const lookUp = mix(t, HEAR - 0.2, HEAR + 0.2, -6, 5)
  const tilt = (t < HAPPY ? lookUp : 3 + wave(t, 0.8) * 2) * calm
  const swing = (t < HAPPY ? 2 : 3 + wave(t, 0.8) * 7) * calm
  // 音符が 耳に はいる ところで、耳が ぴくっ
  const perk = Math.max(0, wave(t, 0.8, 0.1 - SING)) * during(t, HEAR, INK - 0.2, 0.2) * calm
  const pop = span(t, 0.4, 0.9, backOut)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <rect x="-2" y="-2" width="113" height="113" fill={SKY} />
        <Layer x={(EAR_GOAL[0] - EAR[0]) * zoom} y={(EAR_GOAL[1] - EAR[1]) * zoom} scale={1 + (ZOOM_SCALE - 1) * zoom} origin={EAR}>
          <Sky t={t} />
          <Ground />
          <Tree t={t} />
          <ellipse cx="66" cy="97.4" rx="9" ry="2.2" fill="#000000" opacity="0.12" />
          <Layer scale={pop} origin={[66, 96]}>
            <Child mood={mood} tilt={tilt} swing={swing} perk={perk} />
            <Sigh t={t} />
            <Tingle t={t} />
          </Layer>
          <Bird t={t} />
          <Notes t={t} />
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
    { at: 0, label: '草っぱらに ひまそうな 子ども', sound: 'pop' },
    { at: BIRD_IN, label: '小鳥が とんできて、えだに とまる' },
    { at: SING, label: '小鳥が うたいだす。音符が とぶ', sound: 'pop' },
    { at: HEAR, label: '音が 耳に とどいて、はっと する' },
    { at: ZOOM, label: '耳に ぐーんと ズーム' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '耳 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
