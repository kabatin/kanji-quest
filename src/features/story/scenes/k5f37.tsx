/*
 * 強(つよい): ぴんと はった 弓 と、かたい からの 虫。どっちも 風に まけない。
 *
 * ほね(画と絵の対応)
 *   1〜3画目   … 左の 弓。ぐっと そった 木の うで(3画目)と、まっすぐ はった つる(1・2画目のあたり)
 *   4・5画目   … 虫の あたま と つの(いちばん上)
 *   6〜8画目   … 虫の まるい かたい から(口の ところ)
 *   9画目      … から の まんなかの われ目(せなかの すじ)
 *   10・11画目 … 虫の あし と、ふんばる つま先
 *
 * ながれ
 *   弓が 地面に ぴん と たつ → 青い かたい 虫が 弓を ながめながら あるいてくる
 *   → 風が ふいてきて、くもが お日さまを かくす。虫は 風のほうを むいて、ちょっと しんぱい
 *   → どんぐりが 風に のって とんでくる。虫は ぐっと ふんばって 目を とじる
 *   → カン! どんぐりは から で はじかれて、そのまま 弓の つるにも はじかれて 落ちる
 *   → 虫は びっくり、でも どこも いたくない。弓の つるも ぴん と ふるえて もとどおり
 *   → 風が やんで お日さま。虫は むねを はって えっへん → ほね が ひかって、絵が うすくなり、字「強」が のこる
 *
 * ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   虫(かぶとむし)は、まるい から・かた・あたまの つの・体の下から 3本の あし(ひざで まがる)。
 *   弓は 木の うでが そり、つるは 両はし を むすんで ぴんと はる。風は 右から 左へ。
 */
import { backOut, during, easeIn, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '強'

const SUN = '#ffd24a'
const HILL = '#e2f2d2'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const WOOD = '#a8693a'
const WOOD_LIGHT = '#cf9460'
const WOOD_DARK = '#6f4426'
const STRING = '#6b5a40'
const SOIL = '#b98a5a'
const STONE = '#c9c3b6'
const SHELL = '#4672c4'
const SHELL_DARK = '#34589e'
const SHELL_LIGHT = '#9dbdf2'
const HEAD = '#5f86d0'
const LEG = '#2c3c70'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const WIND_LINE = '#a9cdec'
const CLOUD = '#a3b0c2'
const CLOUD_SHADE = '#8494aa'
const NUT = '#c98a4b'
const NUT_CAP = '#7a4f2c'

/** くぎり の時間(秒) */
const ENTER = 0.3
const ARRIVE = 1.7
const WIND = 1.9
const WORRY = 2.0
const BRACE = 2.8
const FLY = 3.1
/** どんぐりが、虫の から に あたる */
const HIT = 3.9
/** はじかれて、弓の つる に あたる */
const TWANG = 4.7
const LAND = 5.4
const WIND_END = 5.3
const PROUD = 5.2
const INK = 6.4
const DONE = 10.0
const DURATION = 10.6

/** 地面の たかさ(あしの うらが ここ) */
const GROUND_Y = 92.5
/** 虫の まんなか(むきを かえる じく) */
const BEETLE_X = 69
/** 弓の 足もと(風で かたむく じく) */
const BOW_FOOT: readonly [number, number] = [36, 91]

/** 風の つよさ(0〜1)。右から 左へ ふく */
const windAt = (t: number) => during(t, WIND, WIND_END, 0.5)

/* ───────── まわりの けしき ───────── */

function Ground({ t }: SceneProps) {
  const wind = windAt(t)
  return (
    <>
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill={HILL} />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {/* 草は 風で 左へ なびく */}
      {[8, 22, 60, 82, 100].map((x) => (
        <Layer key={x} rotate={-wind * 16 + wave(t, 0.5, x) * 2 * wind} origin={[x + 1.5, 97.5]}>
          <path d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
        </Layer>
      ))}
    </>
  )
}

/** お日さま。風が ふくと 小さな くもが かくして、風が やむと また でてくる */
function Sky({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  const cloudX = mix(t, WIND - 0.4, WIND + 0.5, 62, 0, easeOut) + mix(t, WIND_END - 0.3, WIND_END + 0.8, 0, 62, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[96, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="95.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 96 13)`} />
        ))}
      </Layer>
      <circle cx="96" cy="13" r={6.2 * sun} fill={SUN} />
      <Layer x={cloudX}>
        <ellipse cx="96" cy="16" rx="13" ry="5.4" fill={CLOUD_SHADE} />
        <circle cx="90" cy="12" r="6" fill={CLOUD} />
        <circle cx="99" cy="10" r="7.4" fill={CLOUD} />
        <ellipse cx="96" cy="14.4" rx="13" ry="4.6" fill={CLOUD} />
      </Layer>
    </>
  )
}

/* ───────── 弓 ───────── */

/** つるの ふるえ。はじまりから だんだん ちいさくなる */
function ringing(t: number, start: number, amp: number): number {
  if (t < start) return 0
  const s = t - start
  return amp * Math.exp(-s * 3.2) * Math.sin(s * 38)
}

/** 弓の 木の うで: 上の はし → いちばん そった ところ → 下の はし */
const BOW_ARC = 'M40 16 C22 20 12 36 15 53 C17 70 26 85 37 91'

function Bow({ t }: SceneProps) {
  const grow = span(t, 0, 0.7, backOut)
  if (grow <= 0) return null
  const wind = windAt(t)
  // 風に おされて 上が 左へ すこし かたむくが、たおれない
  const lean = -2.4 * wind + wave(t, 0.4) * 0.5 * wind
  const shake = ringing(t, 0.8, 1.6) + ringing(t, TWANG, 3.4) + wind * 0.6 * Math.sin(t * 28)
  const mid = 38 + 2 * shake
  return (
    <>
      <ellipse cx="35" cy="94" rx="8" ry="2.8" fill={SOIL} />
      <ellipse cx="22.5" cy="95.6" rx="2.6" ry="1.5" fill={STONE} />
      <Layer scale={grow} origin={BOW_FOOT}>
        <Layer rotate={lean} origin={BOW_FOOT}>
          <path d={BOW_ARC} fill="none" stroke={WOOD} strokeWidth="3.6" strokeLinecap="round" />
          <path d={BOW_ARC} fill="none" stroke={WOOD_LIGHT} strokeWidth="1.1" strokeLinecap="round" transform="translate(-0.7 0)" />
          {/* にぎり: かわを まいた ところ */}
          <path d="M15.1 46 V60" stroke={WOOD_DARK} strokeWidth="5.4" strokeLinecap="round" />
          <path d="M12.8 50 h4.6 M12.8 54 h4.6 M12.8 58 h4.6" stroke={WOOD_LIGHT} strokeWidth="0.8" />
          {/* つる: 上と下の はしを むすんで ぴんと はる */}
          <path d={`M40 16 Q${mid} 53.5 ${BOW_FOOT[0]} ${BOW_FOOT[1]}`} fill="none" stroke={STRING} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="40" cy="16" r="1.7" fill={WOOD_DARK} />
          <circle cx="37" cy="91" r="1.7" fill={WOOD_DARK} />
        </Layer>
      </Layer>
    </>
  )
}

/* ───────── 虫 ───────── */

type Mood = 'happy' | 'worried' | 'brace' | 'wow' | 'proud'

/** あし 3本の つけね(から の下の x)と、ふだんの つま先の ずれ・あるくときの ふり の向き */
const LEG_ATTACH = [56, 68, 80] as const
const LEG_REST = [-6, -1, 5] as const
const LEG_PHASE = [1, -1, 1] as const

/** あし: 体の下から 出て、ひざで まがって 地面へ。ふんばると 外へ ひらく */
function Legs({ stride, dip, spread }: { readonly stride: number; readonly dip: number; readonly spread: number }) {
  return (
    <>
      {LEG_ATTACH.map((ax, i) => {
        const swing = stride * LEG_PHASE[i]
        const lift = Math.max(0, swing) * 2.4
        const foot = ax + LEG_REST[i] + (i - 1) * spread + swing * 4
        const kneeX = (ax + foot) / 2 + (foot >= ax ? 2.4 : -2.4)
        const kneeY = 82 + dip * 0.4 - lift * 0.5
        return (
          <g key={ax}>
            <path d={`M${ax} ${74 + dip} L${kneeX} ${kneeY} L${foot} ${GROUND_Y - lift - 1}`} fill="none" stroke={LEG} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <ellipse cx={foot + 0.8} cy={GROUND_Y - lift} rx="3" ry="1.5" fill={LEG} />
          </g>
        )
      })}
    </>
  )
}

/** かお。あたまの まんなかは (95, 66)。むきは 右 */
function Face({ mood }: { readonly mood: Mood }) {
  const mouthLine = { fill: 'none', stroke: MOUTH, strokeWidth: 1.2, strokeLinecap: 'round' as const }
  const eyeBall = (r: number, pr: number, dy = 0) => (
    <>
      <circle cx="97.6" cy={64.2 + dy} r={r} fill="#ffffff" />
      <circle cx="98.2" cy={64.4 + dy} r={pr} fill={EYE} />
    </>
  )
  return (
    <>
      <circle cx="92.6" cy="69.4" r="1.7" fill={CHEEK} opacity="0.65" />
      {mood === 'happy' && (
        <>
          <circle cx="97.6" cy="64.2" r="1.5" fill={EYE} />
          <circle cx="98.1" cy="63.7" r="0.5" fill="#ffffff" />
          <path d="M96.4 69.4 Q98.6 71.8 101 69.2" {...mouthLine} />
        </>
      )}
      {mood === 'worried' && (
        <>
          {eyeBall(2.5, 1.2, 0.4)}
          <path d="M95.2 61.6 L100.4 59.8" stroke={LEG} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M96.6 70.6 q1 -1.3 2 0 t2 0" {...mouthLine} />
        </>
      )}
      {mood === 'brace' && (
        <>
          <path d="M96.2 62.2 L100 64.4 L96.2 66.6" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M96.4 70 H100.6" {...mouthLine} />
        </>
      )}
      {mood === 'wow' && (
        <>
          {eyeBall(2.9, 1.5)}
          <ellipse cx="98.4" cy="70.4" rx="1.3" ry="1.8" fill={MOUTH} />
        </>
      )}
      {mood === 'proud' && (
        <>
          <path d="M96.2 65.2 Q98 62.6 100 65.2" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M96.2 68.8 Q98.8 73 101.4 68.6" {...mouthLine} />
        </>
      )}
    </>
  )
}

/** 虫の 体(から・かた・あたま・つの)。あしは Legs。 */
function Body({ mood, headDx, headDy, squash, flash }: { readonly mood: Mood; readonly headDx: number; readonly headDy: number; readonly squash: number; readonly flash: number }) {
  return (
    <>
      {/* から: まるい ドーム。ぶつかると ちょっと へこむ */}
      <Layer scaleY={1 - squash * 0.06} origin={[BEETLE_X, 76]}>
        <path d="M46 76 C46 52 60 44 70 44 C84 44 91 56 90 76 Z" fill={SHELL} />
        <rect x="46" y="72.6" width="44" height="4.6" rx="2.3" fill={SHELL_DARK} />
        <path d="M68.5 44.6 Q71.5 60 70 73" fill="none" stroke={SHELL_DARK} strokeWidth="1.2" strokeLinecap="round" />
        <path d="M51.5 62 Q53 52.5 62 48" fill="none" stroke={SHELL_LIGHT} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M51.5 62 Q53 52.5 62 48" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" opacity={flash} />
      </Layer>
      {/* かた(むね) */}
      <ellipse cx="86.5" cy="64" rx="6.6" ry="9" fill={SHELL_DARK} />
      {/* あたま と つの: あたま が うごくと つの も いっしょ */}
      <Layer x={headDx} y={headDy}>
        <path d="M97.5 60 Q101.4 57 101.2 50" fill="none" stroke={LEG} strokeWidth="3.2" strokeLinecap="round" />
        <path d="M101.2 52.4 L104.6 51" fill="none" stroke={LEG} strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="95" cy="66" r="7.2" fill={HEAD} />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

function Beetle({ t }: SceneProps) {
  // あるいてくる(はじめは 弓のほう=左を むいている)
  const walking = 1 - span(t, ARRIVE - 0.2, ARRIVE)
  const stride = t < ENTER ? 0 : Math.sin((t - ENTER) * Math.PI * 2 * 2.4) * walking
  const walkX = mix(t, ENTER, ARRIVE, 78, 0, easeOut)
  const bob = -Math.abs(stride) * 0.8
  // 風が ふくと、風の ほう(右)を むく
  const facing = mix(t, WIND, WIND + 0.6, -1, 1)
  // ふんばる(風と どんぐり)→ ひとやすみ → えっへん
  const worry = span(t, WORRY, WORRY + 0.4) * (1 - span(t, BRACE, BRACE + 0.3))
  const brace = span(t, BRACE, BRACE + 0.5, easeOut) * (1 - span(t, HIT + 0.4, HIT + 1.0))
  const proud = span(t, PROUD, PROUD + 0.5, backOut)
  const mood: Mood = t < WIND ? 'happy' : t < BRACE ? 'worried' : t < HIT + 0.4 ? 'brace' : t < PROUD ? 'wow' : 'proud'
  const lean = 2.2 * worry + 7 * brace - 3 * proud
  const dip = brace * 2.6 + worry * 0.6
  const hit = Math.sin(span(t, HIT, HIT + 0.3) * Math.PI)
  const flash = hit * 0.9
  // あたま: ふんばると ひっこめ、えっへん で つんと上げる
  const headDx = -1.6 * brace
  const headDy = 1.2 * brace - 1.4 * proud
  const sweat = during(t, WORRY, HIT + 0.4, 0.2)
  const puff = during(t, PROUD + 0.1, PROUD + 1.0, 0.2)
  const puffP = span(t, PROUD + 0.1, PROUD + 1.0, easeOut)
  return (
    <Layer x={walkX}>
      <ellipse cx={BEETLE_X} cy="94.6" rx="24" ry="2.6" fill="#000000" opacity="0.12" />
      <Layer scaleX={facing} origin={[BEETLE_X, 0]}>
        <Layer rotate={lean} origin={[BEETLE_X, GROUND_Y]}>
          <Legs stride={stride} dip={dip} spread={brace * 3} />
          <Layer y={bob + dip}>
            <Body mood={mood} headDx={headDx} headDy={headDy} squash={hit} flash={flash} />
          </Layer>
          {sweat > 0 && (
            <path
              d="M0 -2.6 Q2.2 0.6 0 2.2 Q-2.2 0.6 0 -2.6 Z"
              fill="#7cc4f2"
              opacity={sweat}
              transform={`translate(${89 + headDx} ${57 + headDy + wave(t, 0.5) * 0.6})`}
            />
          )}
        </Layer>
        {/* えっへん の「ふんっ」 */}
        {puff > 0 && (
          <g opacity={puff}>
            <ellipse cx={104 + puffP * 3} cy={69 - puffP * 2} rx={1.8 + puffP * 1.4} ry={1.3 + puffP} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
          </g>
        )}
      </Layer>
    </Layer>
  )
}

/* ───────── 風・どんぐり・葉 ───────── */

/** 風の すじ。右から 左へ ながれる */
function WindLines({ t }: SceneProps) {
  const wind = windAt(t)
  if (wind <= 0) return null
  return (
    <g opacity={wind * 0.85} fill="none" stroke={WIND_LINE} strokeWidth="1.4" strokeLinecap="round">
      {[24, 36, 48, 60, 80].map((y, i) => {
        const x = 128 - ((t * 95 + i * 43) % 160)
        return <path key={y} d="M0 0 H20 q4 0 4 -2.6 q0 -2.6 -2.8 -2.4" transform={`translate(${x} ${y})`} />
      })}
    </g>
  )
}

/** 風に ふかれて とんでいく 葉 */
function BlownLeaves({ t }: SceneProps) {
  const wind = windAt(t)
  if (wind <= 0) return null
  return (
    <g opacity={wind}>
      {[28, 40, 68].map((y, i) => {
        const p = ((t - WIND) * 0.55 + i * 0.37) % 1
        const x = 118 - p * 135
        const yy = y + Math.sin(p * 11 + i) * 4
        return <path key={y} d="M0 -3 Q2.8 0 0 3 Q-2.8 0 0 -3 Z" fill={i % 2 === 0 ? LEAF_LIGHT : LEAF} stroke={LEAF_DARK} strokeWidth="0.5" transform={`translate(${x} ${yy}) rotate(${p * 540 + i * 70})`} />
      })}
    </g>
  )
}

type AcornState = { readonly x: number; readonly y: number; readonly rot: number }

/** どんぐりの いち。風に のって とんでくる → から に あたる → つる に あたる → 落ちる */
function acornAt(t: number): AcornState | null {
  if (t < FLY) return null
  if (t < HIT) {
    const p = easeIn(span(t, FLY, HIT))
    return { x: 118 - 41.5 * p, y: 28 + 17.5 * p, rot: t * 700 }
  }
  if (t < TWANG) {
    const p = span(t, HIT, TWANG)
    return { x: 76.5 - 36.7 * p, y: 45.5 - 3 * p - 21 * Math.sin(p * Math.PI), rot: t * 500 }
  }
  if (t < LAND) {
    const p = span(t, TWANG, LAND)
    return { x: 39.8 + 2.4 * p, y: 42.5 + 48 * easeIn(p), rot: 300 + p * 220 }
  }
  const settle = Math.sin(span(t, LAND, LAND + 0.3) * Math.PI)
  return { x: 42.2, y: 90.5 - settle * 3, rot: 75 }
}

function Acorn({ t }: SceneProps) {
  const a = acornAt(t)
  if (!a) return null
  return (
    <Layer x={a.x} y={a.y} rotate={a.rot}>
      <ellipse cx="0" cy="1.2" rx="2.7" ry="3.3" fill={NUT} />
      <path d="M-3 -0.6 Q0 -4.6 3 -0.6 Z" fill={NUT_CAP} />
      <path d="M0 -3.6 V-5" stroke={NUT_CAP} strokeWidth="0.9" strokeLinecap="round" />
    </Layer>
  )
}

/** カン! と はじかれた しゅんかんの ひかり */
function Burst({ t, at, x, y }: SceneProps & { readonly at: number; readonly x: number; readonly y: number }) {
  const p = span(t, at, at + 0.35, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p}>
      <Star cx={x} cy={y} r={3 + p * 5} color="#ffd24a" spin={p * 90} />
      <Star cx={x} cy={y} r={1.6 + p * 3} color="#ffffff" spin={-p * 60} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 11)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Sky t={t} />
        <Bow t={t} />
        <Beetle t={t} />
        <WindLines t={t} />
        <BlownLeaves t={t} />
        <Acorn t={t} />
        <Burst t={t} at={HIT} x={78} y={46} />
        <Burst t={t} at={TWANG} x={37.6} y={42.5} />
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
    { at: 0, label: '弓が ぴんと はって たつ', sound: 'pop' },
    { at: ENTER, label: 'かたい 虫が あるいてくる' },
    { at: WIND, label: '風が ふいて、虫は 風のほうを むく' },
    { at: FLY, label: 'どんぐりが とんでくる。虫は ふんばる', sound: 'pop' },
    { at: HIT, label: 'カン! から で はじかれ、弓の つるでも はじかれる', sound: 'pop' },
    { at: PROUD, label: 'どっちも まけない! 虫は むねを はる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '強 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
