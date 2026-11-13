/*
 * 石(いし): がけの 下に、石が ころん。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … がけの ひさし(出っぱった 岩)の そこ。ここから 石が おちる
 *   2画目(ノ)  … がけの 左がわの 岩かべ(上が ひろく、下へ すぼまる)
 *   3〜5画目   … がけの 下に ころんと おちて とまった 石(口の かたち)
 *
 * ながれ
 *   がけが あらわれる → うさぎが ぴょん ぴょんと はねてくる
 *   → 大きく はねて「どすん」。がけが ゆれて、うさぎは びっくり(上を見る・あせ)
 *   → ひさしの 石が ぐらぐら して ぽろっと おちる。うさぎは とびのく
 *   → 石が 地面に どすん、ころん ころん と ゆれて とまる。うさぎは ほっとして よろこぶ
 *   → ほね が ひかって、絵が うすくなり、字「石」が のこる
 *
 * ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   岩は 上が ひろくて ひさしが 出ている。石は ひさしの 中に うまっていて、おちるときは まっすぐ 下へ。
 *   うさぎは 耳が あたまの上から 長く のび、うしろあしが 大きく、しっぽは まるい。
 *   石は 平たい そこ を 地面に つけて、ゆれるときは かたすみが 地面に のこる。
 */
import { backOut, during, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '石'

const ROCK = '#b49a7e'
const ROCK_BAND = '#a38869'
const ROCK_SEAM = '#7d6450'
const STONE = '#9fa8b3'
const STONE_LIGHT = '#c1c9d2'
const STONE_SHADE = '#808a96'
const STONE_CRACK = '#6f7884'
const SOIL = '#c9a27a'
const SOIL_DARK = '#b08a63'
const TURF = '#6cc47a'
const TURF_DARK = '#55b86e'
const HILL = '#e2f2d2'
const DUST = '#f1e6d6'
const FUR = '#f6efe6'
const FUR_SHADE = '#e0d4c4'
const PINK = '#f5a9b8'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'

/** くぎり の時間(秒) */
const HOP1 = 0.8
const HOP2 = 1.6
/** 大きく はねて どすん(がけが ゆれはじめる) */
const LAND = 2.4
/** 石が ぽろっと おちはじめる / 地面に ぶつかる */
const DROP = 3.5
const HIT = 4.15
const RELIEF = 4.3
const JOY = 5.0
const INK = 6.4
const DONE = 9.2
const DURATION = 10

/** 地面の たかさ と、石の まんなかの x */
const GROUND = 85
const STONE_X = 58.5
/** 石の かたち(まんなか を 0,0 とする)。そこ は 平ら */
const STONE_HALF_W = 21.5
const STONE_HALF_H = 16
/** 石の まんなかの y: ひさしに うまっている ときと、おちて とまった ときと */
const STONE_Y_HANG = 13
const STONE_Y_REST = GROUND - STONE_HALF_H
/** うさぎの 足もとの x(立つ ばしょ) */
const RABBIT_X = 93

const pulse = (t: number, at: number, len: number) => Math.sin(span(t, at, at + len) * Math.PI)

/* ───────── うしろの けしき と 地面 ───────── */

function Backdrop({ t }: SceneProps) {
  const drift = t * 1.4
  return (
    <>
      <path d="M-4 88 Q18 66 44 80 Q72 62 113 82 V90 H-4 Z" fill={HILL} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${drift} 0)`}>
        <ellipse cx="62" cy="40" rx="7" ry="3" />
        <ellipse cx="67" cy="38.4" rx="5" ry="3.2" />
      </g>
    </>
  )
}

function GroundBand() {
  return (
    <>
      <rect x="-6" y={GROUND} width="121" height="30" fill={SOIL} />
      <rect x="-6" y={GROUND} width="121" height="3.4" fill={TURF} />
      <ellipse cx="30" cy="97" rx="3" ry="1.5" fill={SOIL_DARK} />
      <ellipse cx="70" cy="101" rx="4" ry="1.7" fill={SOIL_DARK} />
      <ellipse cx="98" cy="95" rx="2.6" ry="1.3" fill={SOIL_DARK} />
    </>
  )
}

function Tuft({ x }: { readonly x: number }) {
  return <path d={`M${x} ${GROUND + 1} l1.2 -4.2 l1 3.4 l1.6 -4.6 l0.8 5.4 Z`} fill={TURF_DARK} />
}

/* ───────── がけ(岩) ───────── */

/** 岩の かたまり。1画目(ひさしの そこ)と 2画目(左の かべ)の線が ふち になる */
function Cliff({ t }: SceneProps) {
  const crack = span(t, LAND + 0.1, LAND + 0.8)
  return (
    <>
      <path
        d="M-6 -6 H98 V15 Q98 22.4 89.9 22.8 L80 22.5 L70 23.2 L60 24.1 L50 25 L42.4 25.8 L42.42 29.43 c0.33,1.45 0.22,2.69 -0.15,4.17 C39.38,45 30.75,61.62 15,73.5 Q11 77 10 82 L10 86 H-6 Z"
        fill={ROCK}
      />
      {/* 岩の しま(地層) */}
      <g fill="none" stroke={ROCK_BAND} strokeWidth="1.2" strokeLinecap="round">
        <path d="M52 12 H90 M4 9 H34 M12 17 H28" />
        <path d="M6 46 H22 M2 62 H14" />
      </g>
      <Bone char={CHAR} n={1} color={ROCK_SEAM} width={3.2} />
      <Bone char={CHAR} n={2} color={ROCK_SEAM} width={3.2} />
      {/* ゆれて できた ひび(石の まわり) */}
      {crack > 0 && (
        <g fill="none" stroke={ROCK_SEAM} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M48 21 L50 17 L47.6 14" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - crack} />
          <path d="M70 21.6 L68 17 L70.4 13" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - crack} />
        </g>
      )}
    </>
  )
}

/** ひさしから ぱらぱら おちる すなと こいし */
function CliffDust({ t }: SceneProps) {
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => {
        const start = LAND + 0.1 + i * 0.17
        const p = span(t, start, start + 0.9)
        if (p <= 0 || p >= 1) return null
        const x = 47 + i * 5.4 + Math.sin(i * 2.1) * 1.5
        const y = 26 + p * p * 34
        return <circle key={i} cx={x} cy={y} r={0.8 + (i % 3) * 0.4} fill={i % 2 === 0 ? '#cdb99f' : '#8f7a63'} opacity={1 - p * p} />
      })}
    </>
  )
}

/* ───────── 石 ───────── */

/** 石の うごき: ひさしで ぐらぐら → おちる → どすん → ころん ころん と とまる */
function stonePose(t: number) {
  const sag = span(t, 3.0, DROP)
  const fall = span(t, DROP, HIT)
  const shaking = span(t, LAND, LAND + 0.2) * (1 - span(t, DROP - 0.2, DROP))
  const s = Math.max(0, t - HIT)
  const lift = Math.sin(span(t, HIT, HIT + 0.38) * Math.PI) * 6 + Math.sin(span(t, HIT + 0.38, HIT + 0.65) * Math.PI) * 2
  const base = t < DROP ? STONE_Y_HANG + 1.5 * sag : t < HIT ? STONE_Y_HANG + 1.5 + (STONE_Y_REST - STONE_Y_HANG - 1.5) * fall * fall : STONE_Y_REST
  const settle = 1 - span(t, INK - 0.4, INK - 0.05)
  const rock = t < DROP ? wave(t, 0.12) * 2.2 * shaking : t < HIT ? -7 * fall : -7 * Math.cos(s * 8.5) * Math.exp(-s * 2.6) * settle
  // かたすみで ささえて ゆれる(そこ が 地面に めりこまない)
  const propUp = t >= HIT ? Math.abs(Math.sin((rock * Math.PI) / 180)) * STONE_HALF_W : 0
  const dx = t >= HIT ? 1.6 * Math.sin(s * 8.5) * Math.exp(-s * 2.6) * settle : 0
  return { y: base - lift - propUp, rotate: rock, dx }
}

function Stone({ t }: SceneProps) {
  const p = stonePose(t)
  return (
    <Layer x={STONE_X + p.dx} y={p.y} rotate={p.rotate} origin={[0, STONE_HALF_H]}>
      <path d="M-21.5 6 Q-23 -8 -12 -14 Q0 -18 12 -14 Q23 -9 21.5 6 Q21 16 12 16 L-12 16 Q-21 16 -21.5 6 Z" fill={STONE} />
      {/* かげ(右した)と ひかり(左うえ)を 1だん ずつ */}
      <path d="M21.5 6 Q23 -9 12 -14 Q19 -2 15 16 L12 16 Q21 16 21.5 6 Z" fill={STONE_SHADE} />
      <path d="M-17 -3 Q-16 -10 -9 -12 Q-3 -14 2 -13 Q-8 -10 -11 -3 Q-13 2 -17 -3 Z" fill={STONE_LIGHT} />
      <path d="M-4 6 L0 2 L-1 -2 M8 8 L11 4" fill="none" stroke={STONE_CRACK} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="-9" cy="9" r="1.1" fill={STONE_SHADE} />
      <circle cx="5" cy="-6" r="0.9" fill={STONE_SHADE} />
    </Layer>
  )
}

/** 石が ぶつかった ところの ほこり */
function ImpactDust({ t }: SceneProps) {
  return (
    <>
      {[-1, 1].flatMap((k) =>
        [0, 0.12].map((delay) => {
          const p = span(t, HIT + delay, HIT + delay + 0.65, easeOut)
          if (p <= 0 || p >= 1) return null
          return <circle key={`${k}-${delay}`} cx={STONE_X + k * (22 + p * 11)} cy={GROUND - 2 - p * 3} r={Math.max(0, 1.6 + p * 4.2)} fill={DUST} opacity={(1 - p) * 0.9} />
        }),
      )}
    </>
  )
}

/* ───────── うさぎ ───────── */

type Mood = 'happy' | 'startled' | 'relieved'

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="-7" cy="-12.4" r="1.3" fill={PINK} opacity="0.6" />
      <circle cx="-10.7" cy="-13.6" r="0.9" fill={PINK} />
      {mood === 'startled' ? (
        <>
          <circle cx="-8.2" cy="-15.4" r="1.9" fill="#ffffff" stroke={EYE} strokeWidth="0.4" />
          <circle cx="-8.6" cy="-15.4" r="0.95" fill={EYE} />
          <path d="M-10.2 -18.4 l3.4 0.6" stroke={FUR_SHADE} strokeWidth="1" strokeLinecap="round" />
          <ellipse cx="-9.6" cy="-11.4" rx="0.8" ry="1.1" fill={MOUTH} />
        </>
      ) : mood === 'relieved' ? (
        <>
          <circle cx="-8.2" cy="-15.2" r="1.05" fill={EYE} />
          <path d="M-10.2 -11.4 q1.2 1.2 2.5 0.1" fill="none" stroke={MOUTH} strokeWidth="0.9" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M-9.6 -14.9 Q-8.2 -16.7 -6.8 -14.9" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M-10.4 -11.8 q1.4 1.6 2.9 0.1" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
        </>
      )}
    </>
  )
}

/** 足もと(0,0)を 基準にした うさぎ。左むき。耳は あたま の上から のびる。 */
function Rabbit({ mood, ear, headTilt }: { readonly mood: Mood; readonly ear: number; readonly headTilt: number }) {
  return (
    <>
      {/* しっぽ・からだ・うしろあし */}
      <circle cx="11.4" cy="-9.8" r="2.9" fill="#ffffff" />
      <ellipse cx="3" cy="-9.5" rx="8.8" ry="6.6" fill={FUR} />
      <ellipse cx="5.6" cy="-5.4" rx="4.6" ry="4.4" fill={FUR_SHADE} />
      <ellipse cx="1.6" cy="-1.1" rx="5" ry="1.5" fill={FUR_SHADE} />
      {/* まえあし: かた から 地面へ */}
      <path d="M-3.2 -7.4 L-4 -1.8" stroke={FUR_SHADE} strokeWidth="2.6" strokeLinecap="round" />
      <ellipse cx="-4.6" cy="-1.1" rx="2.2" ry="1.2" fill={FUR_SHADE} />
      {/* あたま: 耳が あたまの上から 長く のびる */}
      <Layer rotate={headTilt} origin={[-3.5, -10]}>
        <Layer x={-7.6} y={-18.2} rotate={ear + 7}>
          <ellipse cx="0" cy="-6" rx="2" ry="6.2" fill={FUR_SHADE} />
        </Layer>
        <Layer x={-5.2} y={-18.6} rotate={ear}>
          <ellipse cx="0" cy="-6" rx="2" ry="6.2" fill={FUR} />
          <ellipse cx="0" cy="-6.3" rx="0.9" ry="4.2" fill={PINK} opacity="0.75" />
        </Layer>
        <circle cx="-5.5" cy="-14.5" r="5.4" fill={FUR} />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

/** びっくりの あせ */
function Sweat({ t }: SceneProps) {
  const show = during(t, LAND + 0.3, DROP + 0.9, 0.2)
  if (show <= 0) return null
  const p = span(t, LAND + 0.3, DROP + 0.9)
  return <path d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" opacity={show} transform={`translate(${RABBIT_X + 0.5} ${GROUND - 28 + p * 6})`} />
}

/** よろこびの ハート。うさぎの 上へ ふわっと のぼる。 */
function Hearts({ t }: SceneProps) {
  return (
    <>
      {[0, 1].map((i) => {
        const p = span(t, JOY + 0.2 + i * 0.5, JOY + 1.5 + i * 0.5)
        if (p <= 0 || p >= 1) return null
        return <path key={i} d="M0 1.6 C-3 -0.8 -2.2 -3.2 0 -1.8 C2.2 -3.2 3 -0.8 0 1.6 Z" fill="#f07f9e" opacity={Math.sin(p * Math.PI)} transform={`translate(${99 + i * 5 + Math.sin(p * 6) * 1.2} ${52 - p * 14}) scale(1.3)`} />
      })}
    </>
  )
}

/** うさぎの うごき(はねる・びっくり・ほっと・よろこぶ) */
function RabbitActor({ t }: SceneProps) {
  const h1 = span(t, HOP1, HOP2)
  const h2 = span(t, HOP2, LAND)
  const back = span(t, DROP, DROP + 0.45)
  const hopY = Math.sin(h1 * Math.PI) * 5 + Math.sin(h2 * Math.PI) * 8 + Math.sin(back * Math.PI) * 5
  const joyY = (Math.sin(span(t, JOY, JOY + 0.5) * Math.PI) + Math.sin(span(t, JOY + 0.5, JOY + 1.0) * Math.PI)) * 4
  const x = 30 - 16 * h1 - 14 * h2 + 2 * easeOut(back)
  const squash = pulse(t, HOP2, 0.2) * 0.5 + pulse(t, LAND, 0.25) + pulse(t, DROP + 0.45, 0.2) * 0.6 + pulse(t, HIT, 0.25) * 0.7 + pulse(t, JOY + 0.5, 0.2) * 0.6 + pulse(t, JOY + 1.0, 0.2) * 0.6
  // 耳: はねるときは うしろへ → びっくりで ぴんと立つ → ほっとして すこし ねる → よろこんで ぱたぱた
  const joying = during(t, JOY, JOY + 1.2, 0.1)
  const ear = 22 - 25 * span(t, LAND, LAND + 0.2) + 11 * span(t, RELIEF, RELIEF + 0.4) + 8 * span(t, JOY, JOY + 0.2) + wave(t, 0.5) * 6 * joying
  // あたま: びっくりで がけを 見上げる → 石を見る
  const headTilt = 16 * (span(t, LAND, LAND + 0.2) - span(t, DROP + 0.4, HIT)) - 4 * span(t, RELIEF, RELIEF + 0.4)
  const mood: Mood = t < LAND ? 'happy' : t < RELIEF ? 'startled' : t < JOY ? 'relieved' : 'happy'
  const appear = span(t, HOP1 - 0.1, HOP1 + 0.05)
  if (appear <= 0) return null
  return (
    <Layer x={RABBIT_X + x} y={GROUND - hopY - joyY} scaleX={1 + 0.12 * squash} scaleY={1 - 0.18 * squash}>
      <Rabbit mood={mood} ear={ear} headTilt={headTilt} />
    </Layer>
  )
}

/** うさぎが ついた しゅんかんの ほこり */
function LandDust({ t }: SceneProps) {
  const p = span(t, LAND, LAND + 0.6, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <>
      {[-1, 1].map((k) => (
        <circle key={k} cx={RABBIT_X + 2 + k * (7 + p * 7)} cy={GROUND - 1.5 - p * 2} r={Math.max(0, 1.2 + p * 2.8)} fill={DUST} opacity={(1 - p) * 0.9} />
      ))}
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)
  // がけが ふわっと あらわれる
  const arrive = span(t, 0, 0.7, backOut)
  const shake = wave(t, 0.09) * 0.6 * during(t, LAND, DROP, 0.1)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Layer opacity={Math.min(1, arrive)}>
          <Backdrop t={t} />
          <GroundBand />
          <Layer y={-(1 - Math.min(1, arrive)) * 12} x={shake}>
            <Stone t={t} />
            <Cliff t={t} />
          </Layer>
          <Tuft x={4} />
          <Tuft x={88} />
          <Tuft x={104} />
        </Layer>
        <CliffDust t={t} />
        <ImpactDust t={t} />
        <LandDust t={t} />
        <RabbitActor t={t} />
        <Sweat t={t} />
        <Hearts t={t} />
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Layer scale={1 + bump} origin={[54.5, 54.5]}>
        <Ink char={CHAR} progress={ink.progress} tint={ink.tint} />
      </Layer>
      <Sparkles cx={54.5} cy={54} progress={ink.sparkle} />
    </>
  )
}

const scene: SceneModule = {
  char: CHAR,
  duration: DURATION,
  beats: [
    { at: 0, label: 'がけが あらわれる', sound: 'pop' },
    { at: HOP1, label: 'うさぎが ぴょん ぴょんと はねてくる' },
    { at: LAND, label: 'どすん! がけが ゆれて、うさぎは びっくり', sound: 'pop' },
    { at: DROP, label: '石が ぽろっと おちる' },
    { at: HIT, label: 'ころん ころんと 石が とまる', sound: 'pop' },
    { at: JOY, label: 'うさぎが ほっとして よろこぶ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '石 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
