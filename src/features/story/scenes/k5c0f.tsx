/*
 * 小(ちいさい): 小さな すなつぶが 3つ、ぱらぱら おちてくる。
 *
 * ほね(画と絵の対応)
 *   1画目(亅)  … まんなかに まっすぐ おちる すなつぶ(つまんだ指の下から 地面まで)
 *   2画目(ノ)  … 左へ とんで、左の すなの おか に おちる すなつぶ
 *   3画目(丶)  … 右へ とんで、右の すなの おか に おちる すなつぶ
 *   (3つとも、つまんだ指の先 = 1画目の 書きはじめ から ぱらぱら と ちらばる)
 *
 * ながれ
 *   すなの穴から アリが でてくる。ひまそうに きょろきょろ
 *   → 空から 手が のびてきて、すなを ひとつまみ もつ。アリは「!」と 見あげる
 *   → ぱら・ぱら・ぱら と 3つぶ おちる(まんなか・左・右)。アリは ぽかん
 *   → アリが つぶに ちかづいて、鼻で くんくん。「ちいさい!」と うれしくなって ぴょんぴょん
 *   → つぶが 3つ ならんだ 場所に ほね が ひかって、絵が うすくなり、字「小」が のこる
 *
 * アリは ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   体は あたま・むね・おなか の 3つに わかれ、足は むね から 6ほん(あるくときは かわりばんこ)。
 *   しょっかくは あたま から 2ほん。すなつぶは おもさで 下へ おちる(はじめは 指で はじかれて 外へ ふくらむ)。
 */
import { backOut, during, easeInOut, easeIn, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '小'

const SAND = '#f3dfa8'
const SAND_SHADE = '#e6c883'
const SAND_FAR = '#f8ecc6'
const SAND_DARK = '#b98d4a'
const GRAIN = '#d9a74f'
const GRAIN_LIGHT = '#f6dc98'
const PEBBLE = '#b9a07a'
const ANT = '#c95b3c'
const ANT_DARK = '#8f3b2a'
const ANT_LEG = '#7a3023'
const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const SLEEVE = '#4f9be0'
const SLEEVE_DARK = '#3c82c4'
const SUN = '#ffd24a'

/** くぎり の時間(秒) */
const OUT = 0.4
const HAND_IN = 1.8
const NOTICE = 2.3
/** すなつぶを はなす時間(まんなか・左・右) */
const DROP_AT: readonly [number, number, number] = [2.8, 3.2, 3.6]
const HAND_OUT = 3.9
const WALK = 4.2
const SNIFF = 5.0
const HOP = 5.6
const INK = 6.3
const DONE = 8.9
const DURATION = 9.4

/** アリの あな(地面の上の たいらな ところ)と、地面の たかさ */
const HOLE_X = 72
const FLOOR = 89
/** アリを 大きく見せる倍率(足もとが じく) */
const ANT_SCALE = 1.35
/** 手は アリより ずっと 大きいので、つまむ ところを じくに 大きく見せる */
const HAND_SCALE = 1.6

type Grain = {
  /** 手の中で つままれている ときの 場所 */
  readonly held: readonly [number, number]
  /** おちる場所(おとめ の ちゃくち) */
  readonly land: readonly [number, number]
  readonly drop: number
  readonly fall: number
  /** 指で はじかれて 上へ ういた ぶん */
  readonly flick: number
}

const GRAINS: readonly Grain[] = [
  { held: [55.0, 16.9], land: [56.7, 87.3], drop: DROP_AT[0], fall: 0.85, flick: 0 },
  { held: [56.0, 16.2], land: [17, 71.6], drop: DROP_AT[1], fall: 0.8, flick: 12 },
  { held: [55.6, 17.2], land: [97, 72], drop: DROP_AT[2], fall: 0.8, flick: 12 },
]

/** すなつぶの いま の 場所。おちたあと、ちいさく はねて とまる。 */
function grainPlace(grain: Grain, t: number): { readonly x: number; readonly y: number; readonly flying: boolean; readonly u: number } {
  const u = span(t, grain.drop, grain.drop + grain.fall)
  const x = grain.held[0] + (grain.land[0] - grain.held[0]) * u
  // おもさで だんだん はやく おちる(2じょう)。はじめだけ 少し 上へ はじかれる
  const y = grain.held[1] + (grain.land[1] - grain.held[1]) * u * u - grain.flick * u * (1 - u)
  const bounce = span(t, grain.drop + grain.fall, grain.drop + grain.fall + 0.3)
  const hop = bounce > 0 && bounce < 1 ? 3 * Math.sin(bounce * Math.PI) * (1 - bounce) : 0
  return { x, y: y - hop, flying: u > 0 && u < 1, u }
}

const SURFACE = `M-4 112 L-4 71 Q8 67 16 72.5 Q24 78 36 86.5 Q42 ${FLOOR} 50 ${FLOOR} L78 ${FLOOR} Q86 ${FLOOR} 90 82 Q94 74 100 72 Q106 70.5 113 71 L113 112 Z`
const SHADE ='M-4 112 L-4 96 Q30 90 56 95 Q84 100 113 94 L113 112 Z'

function Ground() {
  return (
    <>
      <path d="M-4 80 Q20 60 46 78 Q74 62 113 76 V100 H-4 Z" fill={SAND_FAR} />
      {/* 左右に もりあがった すなの おか。まんなか は たいらに くぼんでいる */}
      <path d={SURFACE} fill={SAND} />
      <path d={SHADE} fill={SAND_SHADE} />
      {/* ちいさな 小石 と すなの もよう */}
      <ellipse cx="40" cy="95" rx="3" ry="1.7" fill={PEBBLE} />
      <ellipse cx="88" cy="99" rx="2.2" ry="1.3" fill={PEBBLE} />
      <path d="M20 100 q3 -1.4 6 0 M64 102 q3 -1.4 6 0 M96 103 q3 -1.4 6 0" fill="none" stroke={SAND_DARK} strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
    </>
  )
}

function Sky({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 12} origin={[95, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="94.2" y="1.6" width="1.6" height="3.8" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 95 13)`} />
        ))}
      </Layer>
      <circle cx="95" cy="13" r={5.8 * sun} fill={SUN} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="6" cy="27" rx="7" ry="3.2" />
        <ellipse cx="11" cy="25" rx="5" ry="3.2" />
      </g>
    </>
  )
}

/** アリの あな。あなの口は 地面の上に 平たく見える。 */
function Hole() {
  return <ellipse cx={HOLE_X} cy={FLOOR + 1.1} rx="6.4" ry="1.2" fill={SAND_DARK} />
}

type Mood = 'bored' | 'curious' | 'happy'

type AntProps = {
  readonly mood: Mood
  /** あたま の かたむき(右まわり = 上を むく) */
  readonly headTilt: number
  /** あるく ときの 足の ふり(-1〜1) */
  readonly stride: number
  /** しょっかく の ぴんと立つ度合い(0〜1) */
  readonly perk: number
  readonly t: number
}

/** 足は むね から 6ほん。あしもと(0,0)が 地面。左むき。 */
function Legs({ stride, color, far }: { readonly stride: number; readonly color: string; readonly far: boolean }) {
  // 左から まえ・なか・うしろ の足。つけね は むね の した
  const legs = [
    { hip: -2.6, knee: -2.4, foot: -3.8 },
    { hip: 0.4, knee: -0.4, foot: -1.2 },
    { hip: 3.4, knee: 1.6, foot: 3.4 },
  ]
  return (
    <>
      {legs.map((leg, i) => {
        // となりの足と ぎゃくに ふる。むこうがわの足は てまえの足と ぎゃく
        const swing = stride * 1.8 * (i % 2 === 0 ? 1 : -1) * (far ? -1 : 1)
        const lift = Math.max(0, swing) * 0.6
        const shift = far ? 1.1 : 0
        return (
          <path
            key={i}
            d={`M${leg.hip + shift} -6.2 L${leg.hip + leg.knee + shift} ${-3.8 - lift} L${leg.foot + shift + swing} ${-lift}`}
            fill="none"
            stroke={color}
            strokeWidth="0.95"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )
      })}
    </>
  )
}

function AntHead({ mood, headTilt, perk, t }: AntProps) {
  const wag = wave(t, 0.35) * 3 * perk
  return (
    <Layer rotate={headTilt} origin={[-3, -9]}>
      {/* しょっかく(あたま から ひじ のように まがって のびる) */}
      <Layer rotate={-perk * 8 + wag} origin={[-7.5, -13]}>
        <path d="M-7.5 -13 L-9.6 -17.2 L-13.2 -16.6" fill="none" stroke={ANT_DARK} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
      </Layer>
      <Layer rotate={-perk * 8 - wag} origin={[-6, -13.5]}>
        <path d="M-6 -13.5 L-6.8 -18.2 L-10.2 -19.4" fill="none" stroke={ANT_LEG} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
      </Layer>
      <circle cx="-5.6" cy="-10.2" r="3.7" fill={ANT} />
      <path d="M-9.2 -9.4 l-1.2 0.9 M-8.9 -8.3 l-1.2 -0.1" fill="none" stroke={ANT_DARK} strokeWidth="0.7" strokeLinecap="round" />
      <circle cx="-4.9" cy="-8.5" r="1.1" fill="#ff9d9d" opacity="0.6" />
      {mood === 'bored' && (
        <>
          <circle cx="-7" cy="-10.7" r="1.05" fill="#2b2b2b" />
          <path d="M-8.4 -11.5 L-5.8 -10.7" stroke={ANT_DARK} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M-8.3 -8.6 L-6.7 -8.6" fill="none" stroke="#6a2a20" strokeWidth="0.7" strokeLinecap="round" />
        </>
      )}
      {mood === 'curious' && (
        <>
          <circle cx="-7" cy="-10.8" r="1.55" fill="#2b2b2b" />
          <circle cx="-7.4" cy="-11.3" r="0.5" fill="#ffffff" />
          <ellipse cx="-7.9" cy="-8.5" rx="0.7" ry="0.95" fill="#6a2a20" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M-8.2 -10.5 Q-7.1 -12.2 -5.9 -10.5" fill="none" stroke="#2b2b2b" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M-8.6 -8.9 Q-7.4 -7.2 -6.2 -8.7" fill="none" stroke="#6a2a20" strokeWidth="0.8" strokeLinecap="round" />
        </>
      )}
    </Layer>
  )
}

function Ant(props: AntProps) {
  return (
    <>
      <Legs stride={props.stride} color={ANT_LEG} far />
      {/* おなか・くびれ・むね */}
      <ellipse cx="7.8" cy="-8.4" rx="5.2" ry="4" fill={ANT} />
      <ellipse cx="9" cy="-9.8" rx="2.6" ry="1.1" fill="#e07a5c" opacity="0.7" />
      <ellipse cx="3.9" cy="-8.4" rx="1.5" ry="1.2" fill={ANT_DARK} />
      <ellipse cx="0.5" cy="-8.6" rx="3.3" ry="2.6" fill={ANT} />
      <Legs stride={props.stride} color={ANT_DARK} far={false} />
      <AntHead {...props} />
    </>
  )
}

/** 手の ぶぶん(空から のびてきて、すなを つまむ) */
function Hand({ t }: SceneProps) {
  const down = (1 - span(t, HAND_IN, HAND_IN + 0.7, easeOut)) * 44 + span(t, HAND_OUT, HAND_OUT + 0.7, easeIn) * 44
  const open = span(t, DROP_AT[0] - 0.1, DROP_AT[0] + 0.1) * (1 - span(t, DROP_AT[2] + 0.4, DROP_AT[2] + 0.7))
  // ゆびを こすって すなを ぱらぱら させる
  const rub = t > NOTICE + 0.2 && t < DROP_AT[0] ? wave(t, 0.22) * 0.5 : 0
  const indexTip: readonly [number, number] = [54.9 - open * 1.0, 15.2 - open * 0.4]
  const thumbTip: readonly [number, number] = [56.4 + open * 1.8 + rub, 15.4 + open * 0.3]
  const held = GRAINS.filter((grain) => t < grain.drop)
  return (
    <g transform={`translate(0 ${-down}) translate(55.4 16) scale(${HAND_SCALE}) translate(-55.4 -16)`}>
      <path d="M60 7 L68.5 -6.5" fill="none" stroke={SKIN} strokeWidth="7.4" strokeLinecap="round" />
      <path d="M66.5 -3.4 L79 -25" fill="none" stroke={SLEEVE} strokeWidth="11" strokeLinecap="round" />
      <path d="M65.2 -3 L71.4 -13.5" fill="none" stroke={SLEEVE_DARK} strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="58.6" cy="9.6" rx="4.6" ry="3.8" transform="rotate(35 58.6 9.6)" fill={SKIN} />
      <path d={`M56.6 10.5 L${indexTip[0]} ${indexTip[1]}`} fill="none" stroke={SKIN} strokeWidth="2.5" strokeLinecap="round" />
      <path d={`M60.2 11 L${thumbTip[0]} ${thumbTip[1]}`} fill="none" stroke={SKIN_SHADE} strokeWidth="2.7" strokeLinecap="round" />
      {held.map((grain) => (
        <circle key={grain.drop} cx={grain.held[0] + (open > 0 ? 0 : rub)} cy={grain.held[1]} r="1.1" fill={GRAIN} />
      ))}
    </g>
  )
}

/** おちている すなつぶ(おちる ときは、うしろに みじかい すじ)。 */
function SandGrain({ grain, t }: { readonly grain: Grain; readonly t: number }) {
  if (t < grain.drop) return null
  const now = grainPlace(grain, t)
  const before = grainPlace(grain, t - 0.06)
  return (
    <>
      {now.flying && <path d={`M${before.x} ${before.y} L${now.x} ${now.y}`} stroke={GRAIN_LIGHT} strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />}
      <circle cx={now.x} cy={now.y} r="1.6" fill={GRAIN} />
      <circle cx={now.x - 0.5} cy={now.y - 0.5} r="0.55" fill={GRAIN_LIGHT} />
    </>
  )
}

/** おちた しゅんかん の すなけむり。 */
function Puff({ grain, t }: { readonly grain: Grain; readonly t: number }) {
  const start = grain.drop + grain.fall
  const p = span(t, start, start + 0.4, easeOut)
  if (p <= 0 || p >= 1) return null
  const [x, y] = grain.land
  return (
    <g fill="#fff1c9" opacity={(1 - p) * 0.8}>
      <circle cx={x - p * 4} cy={y + 1 - p * 2} r={0.7 + p * 1.1} />
      <circle cx={x + p * 4} cy={y + 1 - p * 2} r={0.7 + p * 1.1} />
      <circle cx={x} cy={y - p * 3.5} r={0.6 + p} />
    </g>
  )
}

/** 手を 見つけた ときの「!」 */
function Notice({ t }: SceneProps) {
  const show = during(t, NOTICE, NOTICE + 0.9, 0.15)
  if (show <= 0) return null
  const pop = span(t, NOTICE, NOTICE + 0.3, backOut)
  return (
    <Layer scale={pop} origin={[61.5, 62]} opacity={show}>
      <rect x="60.6" y="52" width="1.9" height="7" rx="0.95" fill="#e8534a" />
      <circle cx="61.55" cy="62" r="1.15" fill="#e8534a" />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 3)

  // アリ: あなから でてくる → きょろきょろ → 見あげる → つぶに ちかづく → くんくん → ぴょんぴょん
  const rise = span(t, OUT, OUT + 0.8, easeOut)
  const walkPos = mix(t, WALK, WALK + 0.9, HOLE_X, 64, easeInOut)
  const moving = t > WALK && t < WALK + 0.9
  const stride = moving ? Math.sin((t - WALK) * Math.PI * 2 * 2.2) : 0
  const look = span(t, NOTICE, NOTICE + 0.3, easeOut) - span(t, WALK, WALK + 0.6, easeInOut)
  const sniff = span(t, SNIFF, SNIFF + 0.3, easeInOut) - span(t, SNIFF + 0.5, SNIFF + 0.8, easeInOut)
  const around = wave(t, 2.2) * 5 * (1 - span(t, NOTICE - 0.1, NOTICE + 0.1))
  const headTilt = around + 26 * look - 24 * sniff
  const hopPhase = span(t, HOP, HOP + 0.7)
  const hop = hopPhase > 0 && hopPhase < 1 ? Math.abs(Math.sin(hopPhase * Math.PI * 2)) * 4 : 0
  const mood: Mood = t < NOTICE ? 'bored' : t < SNIFF ? 'curious' : 'happy'
  const perk = mood === 'bored' ? 0 : 1
  const antY = (1 - rise) * 9 - hop

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Ground />
        <Layer x={t < WALK ? HOLE_X : walkPos} y={FLOOR + antY} scale={ANT_SCALE}>
          <Ant mood={mood} headTilt={headTilt} stride={stride} perk={perk} t={t} />
        </Layer>
        {/* でてくる間は、あなの中(地面の下)が かくれるように、地面を もう一度 手前に かさねる */}
        <path d={SURFACE} fill={SAND} />
        <path d={SHADE} fill={SAND_SHADE} />
        <Hole />
        <Notice t={t} />
        <Hand t={t} />
        {GRAINS.map((grain) => (
          <SandGrain key={grain.drop} grain={grain} t={t} />
        ))}
        {GRAINS.map((grain) => (
          <Puff key={grain.drop} grain={grain} t={t} />
        ))}
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
    { at: 0, label: 'すなの おか。アリが あなから でてくる', sound: 'pop' },
    { at: HAND_IN, label: '空から 手が のびて、すなを つまむ' },
    { at: NOTICE, label: 'アリが「!」と 見あげる', sound: 'pop' },
    { at: DROP_AT[0], label: 'ぱら・ぱら・ぱら と 3つぶ おちる', sound: 'pop' },
    { at: SNIFF, label: 'アリが つぶを くんくん。「ちいさい!」', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '小 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
