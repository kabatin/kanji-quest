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
 * 子どもは Person(左むき。小鳥の ほうを むく)。耳は 顔の まんなかより うしろ、目の よこの 高さで、headwear として あたまに つける。
 * 背景は Backdrop、はっぱは Canopy、小鳥は Bird、ため息は Sigh。みき・えだ・音符・くちばしの ぱくぱくは ここで 描く。
 * 耳の 大きさは ほんものと 同じくらい(あたまの 4わり)。字に 合わせるために、
 * 耳を 大きく ゆがめず、画面を 耳へ ぐーんと ズームして 字の大きさに そろえた。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Bird, Canopy, LOOKS, PALETTE, Person, personRig, Sigh, type Expression } from '../sceneFigures'

const CHAR = '耳'

const SKIN = PALETTE.skin
const SKIN_SHADE = '#eeb98a'
const EAR_DEEP = '#d99a6c'
const BARK = PALETTE.bark
const BARK_DARK = PALETTE.barkDark
const BEAK_LOWER = '#e6a020'
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

/** 子ども(左むき)の 場所と 背の高さ。あたまは 大きめの 子どもの つくり */
const KID = { x: 66, y: 96, build: 'child', height: 66, facing: 'left' } as const
const KID_RIG = personRig(KID)
const HEAD_R = KID_RIG.body.headR * KID_RIG.scale
const HEAD_AT = KID_RIG.world.head
/** 耳の 場所(ズーム前)。あたまの まんなかより うしろ(右)・少し下。大きさは あたまの 4わり */
const EAR_OFFSET = [0.25, 0.17] as const
const EAR: readonly [number, number] = [HEAD_AT[0] + EAR_OFFSET[0] * HEAD_R, HEAD_AT[1] + EAR_OFFSET[1] * HEAD_R]
const EAR_HEIGHT = 0.84 * HEAD_R
/** ズームの あと、耳が 来る場所(字の 耳の まんなか) */
const EAR_GOAL: readonly [number, number] = [55, 44]
/** ズームの 大きさ: ほんものの 耳 が、字の 耳(たて 60)に なるまで */
const ZOOM_SCALE = 60 / EAR_HEIGHT
/** 小鳥の とまる 場所(えだの 上)と、くちばし(音符が 出る所) */
const PERCH_AT: readonly [number, number] = [26, 41.4]
const BEAK: readonly [number, number] = [34.5, 38.8]
const BIRD_SIZE = 1.35

/** 小鳥が とまる 木の みき と えだ。はっぱは Canopy。 */
function Trunk({ t }: SceneProps) {
  const trunk = span(t, 0.1, 0.7, backOut)
  return (
    <>
      <ellipse cx="14" cy="97.6" rx={11 * trunk} ry="2.4" fill="#000000" opacity="0.1" />
      <Layer scaleY={trunk} scaleX={0.6 + 0.4 * trunk} origin={[14, 96]}>
        <path d="M9 97 Q13 92 12.2 84 L16.8 84 Q16 92 20 97 Z" fill={BARK} />
        <rect x="11.6" y="26" width="4.8" height="62" rx="2.2" fill={BARK} />
        <path d="M14 53 Q23 51 31 44.6" fill="none" stroke={BARK} strokeWidth="2.8" strokeLinecap="round" />
        <path d="M13.6 60 q1 4 0 8" fill="none" stroke={BARK_DARK} strokeWidth="0.8" strokeLinecap="round" />
      </Layer>
    </>
  )
}

/** 小鳥。右(子どものほう)を むく。とんでくる → えだに とまる → くちばしを あけて うたう。 */
function Singer({ t }: SceneProps) {
  const arrive = span(t, BIRD_IN, PERCH, easeOut)
  if (arrive <= 0) return null
  // 左上から、ゆるい山なり で おりてくる
  const x = -8 + (PERCH_AT[0] + 8) * arrive
  const y = 4 + (PERCH_AT[1] - 4) * arrive - Math.sin(arrive * Math.PI) * 8
  const landed = arrive >= 1
  const singing = during(t, SING, INK - 0.2, 0.2)
  const bounce = landed ? Math.max(0, wave(t, 0.8)) * singing * 0.9 : 0
  // うたうとき、くちばしの 下が ぱくぱく
  const open = singing > 0 ? (0.5 + 0.5 * wave(t, 0.4)) * 22 : 0
  return (
    <>
      <Bird x={x} y={y - bounce} t={t} flying={!landed} facing="right" size={BIRD_SIZE} />
      {open > 0 && (
        <Layer x={x} y={y - bounce} scale={BIRD_SIZE}>
          <Layer rotate={open} origin={[4.8, -1.7]}>
            <path d="M4.8 -1.7 l2.2 0.8 l-2.2 0.6 Z" fill={BEAK_LOWER} />
          </Layer>
        </Layer>
      )}
    </>
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

/**
 * 耳(headwear)。あたまの まんなか が 0,0、半径 1、右むき の 形で 描く(左むきは 部品が はんてん する)。
 * ふちの まわり・耳の あな・みみたぶ。あなは 前(顔の ほう)に ひらく。
 */
function Ear({ perk }: { readonly perk: number }) {
  return (
    <g transform={`translate(${-EAR_OFFSET[0]} ${EAR_OFFSET[1]}) scale(${1 + perk * 0.07})`}>
      <ellipse cx="0" cy="0" rx="0.26" ry="0.42" fill={SKIN_SHADE} />
      <ellipse cx="0.01" cy="-0.03" rx="0.21" ry="0.36" fill={SKIN} />
      {/* ふちの しわ(うしろを まわる) */}
      <path d="M0.14 -0.3 Q-0.17 -0.35 -0.17 0.02 Q-0.17 0.32 0.03 0.33" fill="none" stroke={EAR_DEEP} strokeWidth="0.045" strokeLinecap="round" />
      {/* 耳の あな の まわり */}
      <path d="M0.17 -0.13 Q-0.03 -0.15 -0.03 0.05 Q-0.03 0.18 0.08 0.2" fill="none" stroke={EAR_DEEP} strokeWidth="0.04" strokeLinecap="round" />
      <ellipse cx="0.09" cy="0.03" rx="0.075" ry="0.125" fill={EAR_DEEP} />
    </g>
  )
}

/** 耳が ぴくっと する しるし(はっと した しゅんかん)。 */
function Tingle({ t }: SceneProps) {
  const show = during(t, HEAR, HAPPY + 0.3, 0.15)
  if (show <= 0) return null
  const k = HEAD_R / 12
  const mark = (dx: number, dy: number, lx: number, ly: number) => `M${EAR[0] + dx * k} ${EAR[1] + dy * k} l${lx * k} ${ly * k}`
  return (
    <g opacity={show} stroke="#ffb74d" strokeWidth="0.55" strokeLinecap="round">
      <path d={`${mark(3.8, -5.6, 2, -1.6)} ${mark(5.4, -1.6, 2.4, -0.4)} ${mark(4.6, 2.6, 2.2, 0.8)}`} fill="none" />
    </g>
  )
}

type Mood = 'bored' | 'surprised' | 'happy'
const FACES: Readonly<Record<Mood, Expression>> = { bored: 'sleepy', surprised: 'surprised', happy: 'smile' }

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)
  const zoom = span(t, ZOOM, ZOOM_END, easeInOut)
  const calm = 1 - span(t, ZOOM - 0.2, ZOOM + 0.8)

  const mood: Mood = t < HEAR ? 'bored' : t < HAPPY ? 'surprised' : 'happy'
  // あたま: つまらないと うつむき、はっと すると 小鳥を 見あげ、うれしいと リズムに ゆれる
  const lookUp = mix(t, HEAR - 0.2, HEAR + 0.2, 6, -5)
  const tilt = (t < HAPPY ? lookUp : -3 - wave(t, 0.8) * 2) * calm
  const swing = (t < HAPPY ? 2 : 3 + wave(t, 0.8) * 7) * calm
  // 音符が 耳に はいる ところで、耳が ぴくっ
  const perk = Math.max(0, wave(t, 0.8, 0.1 - SING)) * during(t, HEAR, INK - 0.2, 0.2) * calm
  const pop = span(t, 0.4, 0.9, backOut)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const leaves = span(t, 0.4, 1.0, backOut)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Layer x={(EAR_GOAL[0] - EAR[0]) * zoom} y={(EAR_GOAL[1] - EAR[1]) * zoom} scale={1 + (ZOOM_SCALE - 1) * zoom} origin={EAR}>
          <Backdrop t={t} sun={[96, 13]} clouds={[[46, 12, 1]]} tufts={[3, 30, 46, 82, 100]} />
          <Trunk t={t} />
          <Canopy x={14} y={24} r={14} grow={leaves} sway={wave(t, 3.4) * 1.2} />
          <Layer scale={pop} origin={[KID.x, KID.y]}>
            <Person {...KID} look={LOOKS.boy} face={FACES[mood]} pose={{ rightArm: { swing, bend: 10 }, head: tilt }} headwear={<Ear perk={perk} />} />
            <Sigh x={HEAD_AT[0] - 0.6 * HEAD_R} y={HEAD_AT[1] + 0.6 * HEAD_R} p={span(t, 1.1, 2.3, easeOut)} show={during(t, 1.1, 2.3, 0.25)} />
            <Tingle t={t} />
          </Layer>
          <Singer t={t} />
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
