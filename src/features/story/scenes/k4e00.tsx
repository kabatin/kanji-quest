/*
 * 一(いち): 石の上に のせてある、1ぽんの ぼう。子どもが もちあげて「いち!」。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 子どもが 胸の高さで よこに もちあげた、1ぽんの ぼう
 *                  (ぼうは 右が 少し上がる。字の線と おなじ。手は ぼうの まんなか よりに りょうてで にぎる)
 *
 * ながれ
 *   2つの石の上に 1ぽんの ぼうが のっている
 *   → 子どもが あるいてきて「あれ?」と 立ちどまる(ふしぎそうに あたまを かしげる)
 *   → しゃがんで りょうてで ぼうを つかみ、「よいしょ」と もちあげる(あせ・ふらふら)
 *   → 胸の高さで ぴたっと とまって、にっこり(小鳥が ぼうの はしに とまる)
 *   → ぼうが ほね として ひかり、絵が うすくなって 字「一」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがり、あし は こし から ひざ で まがる。ひじ・ひざ は 外がわへ。
 *   ぼうを もつ手の場所は、ぼうの上で きめて、うで は その手に とどくように つなげる。
 *   ぼう の 高さは 字の線に あわせてあるので、子どもの ほうを ぼうに あわせて 立たせている。
 */
import type { ReactNode } from 'react'
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '一'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#e8704f'
const SHIRT_DARK = '#cf5a3a'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const STICK = '#a8744a'
const STICK_LIGHT = '#c9965f'
const STICK_NODE = '#70452b'
const ROCK = '#b9bec7'
const ROCK_DARK = '#9aa0ab'
const LEAF = '#55b86e'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const MOUTH = '#b9483f'

/** くぎり の時間(秒) */
const WALK = 0.5
const STOP = 1.9
const CROUCH = 2.8
const GRIP = 3.1
const LIFT = 3.5
const UP = 4.9
const INK = 5.8
const DONE = 8.0
const DURATION = 8.6

type Pt = readonly [number, number]

/** 子どもの こし の高さ(立っている とき / しゃがんだ とき)。あしの ながさ に合わせてある */
const HIP_STAND = 63
const HIP_SQUAT = 80
/** ぼうが 石の上に のっている ときの、字の線からの 下がり(石の上に のる高さ) */
const REST_DROP = 30
/** ぼうの 右が 上がる かたむき(字の線と おなじ) */
const SLOPE = 0.0503
const TILT_DEG = (Math.atan(SLOPE) * 180) / Math.PI
/** 字の線の まんなか。ぼうは ここを じく に かたむける */
const STICK_MID: Pt = [54, 52]
/** りょうての にぎる場所(ぼうの x) */
const GRIP_X: readonly [number, number] = [41, 68]

/** 体の ぶぶん の ながさ */
const ARM_SEG = 15.5
const LEG_SEG = 16

/**
 * 2つの ほね(かた→ひじ→手、こし→ひざ→足)を つなげる。
 * 手・足の目あて に とどくように ひじ・ひざ を まげる。とどかない ときは、のばしきった所まで。
 * ひじ・ひざ は 外がわ(side の向き)へ 出る。
 */
function limb(root: Pt, target: Pt, seg: number, side: -1 | 1, maxBulge: number): { readonly mid: Pt; readonly end: Pt } {
  const dx = target[0] - root[0]
  const dy = target[1] - root[1]
  const dist = Math.max(Math.hypot(dx, dy), 0.001)
  const reach = Math.min(dist, seg * 2 - 0.01)
  const ux = dx / dist
  const uy = dy / dist
  const half = reach / 2
  // 正面から見ると うでは 手まえに のびて ちぢんで 見えるので、ひじの出ぐあいは おさえる
  const bulge = Math.min(Math.sqrt(Math.max(seg * seg - half * half, 0)), maxBulge)
  const base: Pt = [root[0] + ux * half, root[1] + uy * half]
  const options: readonly Pt[] = [
    [-uy, ux],
    [uy, -ux],
  ]
  const [px, py] = options.reduce((best, o) => (o[0] * side * 0.5 + 0.8 * o[1] > best[0] * side * 0.5 + 0.8 * best[1] ? o : best))
  return {
    mid: [base[0] + px * bulge, base[1] + py * bulge],
    end: [root[0] + ux * reach, root[1] + uy * reach],
  }
}

/** ぼうの上の x の 場所が、いま どこに あるか(かたむき・下がり を ぜんぶ ふくめる) */
function stickPoint(px: number, tilt: number, drop: number): Pt {
  const y0 = 52.4 - (px - STICK_MID[0]) * SLOPE
  const rad = (tilt * Math.PI) / 180
  const rx = px - STICK_MID[0]
  const ry = y0 - STICK_MID[1]
  return [STICK_MID[0] + rx * Math.cos(rad) - ry * Math.sin(rad), STICK_MID[1] + rx * Math.sin(rad) + ry * Math.cos(rad) + drop]
}

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
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="72" cy="14" rx="7" ry="3.2" />
        <ellipse cx="77" cy="12.4" rx="5" ry="3.2" />
        <ellipse cx="96" cy="26" rx="6" ry="2.6" />
        <ellipse cx="100.5" cy="24.6" rx="4.2" ry="2.8" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 30, 78, 102].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** ぼうを のせている 2つの石。ぼうが もちあげられた あとも、そこに のこる。 */
function Rocks({ t }: SceneProps) {
  const pop = span(t, 0, 0.5, backOut)
  return (
    <Layer scale={pop} origin={[54.5, 96]}>
      {[18, 91].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="93" rx="8.4" ry="7.4" fill={ROCK_DARK} />
          <ellipse cx={x - 0.6} cy="91.4" rx="7.6" ry="6.2" fill={ROCK} />
        </g>
      ))}
    </Layer>
  )
}

/** 1ぽんの ぼう。字の 1画目の線を そのまま しん にする。 */
function Stick({ tilt, drop }: { readonly tilt: number; readonly drop: number }) {
  return (
    <Layer y={drop} rotate={tilt} origin={STICK_MID}>
      <Bone char={CHAR} n={1} color={STICK} width={4.6} />
      <Layer y={-1.1}>
        <Bone char={CHAR} n={1} color={STICK_LIGHT} width={1.3} />
      </Layer>
      {/* たけの ふし のような しるし */}
      {[24, 54, 82].map((x) => (
        <rect key={x} x={x - 0.6} y={52.4 - (x - 54) * SLOPE - 2.3} width="1.2" height="4.6" rx="0.6" fill={STICK_NODE} />
      ))}
    </Layer>
  )
}

type Mood = 'curious' | 'effort' | 'happy'

function Head({ x, y, tilt, mood }: { readonly x: number; readonly y: number; readonly tilt: number; readonly mood: Mood }) {
  return (
    <Layer rotate={tilt} origin={[x, y + 10]}>
      <circle cx={x - 10} cy={y + 1} r="2.4" fill={SKIN_SHADE} />
      <circle cx={x + 10} cy={y + 1} r="2.4" fill={SKIN_SHADE} />
      <circle cx={x} cy={y} r="10" fill={SKIN} />
      <path d={`M${x - 10.2} ${y - 1} C${x - 10.6} ${y - 12.6} ${x + 10.6} ${y - 12.6} ${x + 10.2} ${y - 1} C${x + 7} ${y - 6.4} ${x - 4} ${y - 8} ${x - 10.2} ${y - 1} Z`} fill={HAIR} />
      <path d={`M${x + 1} ${y - 9.4} Q${x + 2.4} ${y - 13.4} ${x + 4.4} ${y - 10.4}`} fill="none" stroke={HAIR} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx={x - 6.4} cy={y + 5} r="2" fill="#ff9d9d" opacity="0.55" />
      <circle cx={x + 6.4} cy={y + 5} r="2" fill="#ff9d9d" opacity="0.55" />
      {mood === 'curious' && (
        <>
          <path d={`M${x - 5.6} ${y - 3.2} l3.4 -0.8 M${x + 2.2} ${y - 4} l3.4 0.8`} stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx={x - 3.8} cy={y + 1.6} r="1.6" fill="#2b2b2b" />
          <circle cx={x + 3.8} cy={y + 1.6} r="1.6" fill="#2b2b2b" />
          <circle cx={x - 3.3} cy={y + 1.1} r="0.5" fill="#ffffff" />
          <circle cx={x + 4.3} cy={y + 1.1} r="0.5" fill="#ffffff" />
          <ellipse cx={x} cy={y + 6.4} rx="1.2" ry="1.5" fill={MOUTH} />
        </>
      )}
      {mood === 'effort' && (
        <>
          <path d={`M${x - 6} ${y - 0.4} l3.6 1.6 l-3.6 1.6 M${x + 6} ${y - 0.4} l-3.6 1.6 l3.6 1.6`} fill="none" stroke="#2b2b2b" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M${x - 3.6} ${y + 6.4} h7.2`} stroke={MOUTH} strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d={`M${x - 5.6} ${y + 2.2} Q${x - 3.8} ${y - 0.6} ${x - 2} ${y + 2.2} M${x + 2} ${y + 2.2} Q${x + 3.8} ${y - 0.6} ${x + 5.6} ${y + 2.2}`} fill="none" stroke="#2b2b2b" strokeWidth="1.3" strokeLinecap="round" />
          <path d={`M${x - 3.8} ${y + 5.2} Q${x} ${y + 11} ${x + 3.8} ${y + 5.2} Z`} fill={MOUTH} />
        </>
      )}
    </Layer>
  )
}

type ChildProps = {
  readonly hipY: number
  /** 足の目あて(左・右) */
  readonly feet: readonly [Pt, Pt]
  /** 手の目あて(左・右) */
  readonly hands: readonly [Pt, Pt]
  readonly mood: Mood
  readonly headTilt: number
}

/** 子ども(正面むき)。ぼうの うしろ(体)と、ぼうの 手まえ(うで) を わけて 描く。 */
function Child({ hipY, feet, hands, mood, headTilt, stick }: ChildProps & { readonly stick: ReactNode }) {
  const hips: readonly [Pt, Pt] = [
    [50.2, hipY],
    [58.8, hipY],
  ]
  const shoulders: readonly [Pt, Pt] = [
    [47.4, hipY - 28],
    [61.6, hipY - 28],
  ]
  const legs = [limb(hips[0], feet[0], LEG_SEG, -1, 8), limb(hips[1], feet[1], LEG_SEG, 1, 8)]
  const arms = [limb(shoulders[0], hands[0], ARM_SEG, -1, 6), limb(shoulders[1], hands[1], ARM_SEG, 1, 6)]
  return (
    <>
      {legs.map((leg, i) => {
        const hip = hips[i]
        return (
          <g key={i}>
            <path d={`M${hip[0]} ${hip[1]} L${leg.mid[0]} ${leg.mid[1]} L${leg.end[0]} ${leg.end[1]}`} fill="none" stroke={i === 0 ? PANTS : PANTS_DARK} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            <ellipse cx={leg.end[0] + (i === 0 ? -1.6 : 1.6)} cy={leg.end[1] + 1.8} rx="5" ry="2.8" fill={SHOE} />
          </g>
        )
      })}
      {/* くび と どう */}
      <rect x="51.6" y={hipY - 34} width="5.8" height="8" rx="2.4" fill={SKIN_SHADE} />
      <rect x="46" y={hipY - 32} width="17" height="36" rx="7" fill={SHIRT} />
      <path d={`M47.6 ${hipY - 2} h14`} stroke={SHIRT_DARK} strokeWidth="1.6" strokeLinecap="round" />
      <Head x={54.5} y={hipY - 44} tilt={headTilt} mood={mood} />
      {stick}
      {arms.map((arm, i) => {
        const shoulder = shoulders[i]
        return (
          <g key={i}>
            <path d={`M${shoulder[0]} ${shoulder[1]} L${arm.mid[0]} ${arm.mid[1]} L${arm.end[0]} ${arm.end[1]}`} fill="none" stroke={i === 0 ? SHIRT : SHIRT_DARK} strokeWidth="6.4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={arm.end[0]} cy={arm.end[1]} r="3.5" fill={SKIN} />
          </g>
        )
      })}
    </>
  )
}

/** 「あれ?」の しるし(まるい点と たて線。文字ではなく 図形) */
function Surprise({ t, x, y }: SceneProps & { readonly x: number; readonly y: number }) {
  const show = during(t, STOP + 0.1, CROUCH - 0.1, 0.15)
  if (show <= 0) return null
  const pop = span(t, STOP + 0.1, STOP + 0.4, backOut)
  return (
    <Layer opacity={show} scale={pop} origin={[x, y + 5]}>
      <rect x={x - 1.3} y={y - 5} width="2.6" height="7" rx="1.3" fill="#f0a020" />
      <circle cx={x} cy={y + 5} r="1.5" fill="#f0a020" />
    </Layer>
  )
}

/** もちあげている あいだの あせ。あたまの よこを ながれ おちる。 */
function Sweat({ t, x, y }: SceneProps & { readonly x: number; readonly y: number }) {
  const show = during(t, LIFT + 0.1, UP, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.4].map((offset) => {
        const p = ((t + offset) % 0.8) / 0.8
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" transform={`translate(${x + 12 + p * 2} ${y - 6 + p * 10}) rotate(-10)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** もちあげた あと、小鳥が とんできて ぼうの 右はしに とまる。 */
function Bird({ t }: SceneProps) {
  const arrive = span(t, UP, UP + 0.7, easeOut)
  if (arrive <= 0) return null
  // 字の線(右はし)の 少し上に とまる
  const x = 118 - arrive * 28
  const y = 6 + arrive * 39.4 - Math.sin(arrive * Math.PI) * 8
  const landed = arrive >= 1
  const hop = landed ? Math.abs(wave(t, 0.7)) * 0.8 : 0
  const flap = landed ? 0 : wave(t, 0.16) * 28
  return (
    <Layer x={x} y={y - hop}>
      <path d="M2.6 0.4 l4.6 -1.6 l-3.4 3.2 Z" fill="#e2733f" />
      <ellipse cx="0" cy="0" rx="4" ry="3.1" fill="#ff9a5c" />
      <circle cx="-3" cy="-2.3" r="2.3" fill="#ff9a5c" />
      <path d="M-5 -2.4 l-2.4 0.7 l2.3 0.9 Z" fill="#f2b632" />
      <circle cx="-3.6" cy="-2.8" r="0.55" fill="#2b2b2b" />
      <Layer rotate={flap} origin={[0.4, -0.6]}>
        <path d="M-1.2 -0.8 Q1.6 -3.8 4 -0.6 Q1.6 0.8 -1.2 -0.8 Z" fill="#e2733f" />
      </Layer>
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 1)

  // あるいてくる: 左から まんなかへ。止まる ちょくぜんに 歩幅を ゼロへ
  const walking = t < WALK ? 0 : 1 - span(t, STOP - 0.35, STOP)
  const phase = (t - WALK) * Math.PI * 2 * 1.8
  const stride = Math.sin(phase) * walking
  const walkX = mix(t, WALK, STOP, -75, 0, easeOut)

  // しゃがむ → もちあげる
  const crouch = span(t, CROUCH, GRIP + 0.3, easeInOut)
  const lift = span(t, LIFT, UP, easeInOut)
  const hipY = HIP_STAND + (HIP_SQUAT - HIP_STAND) * crouch - (HIP_SQUAT - HIP_STAND) * lift - Math.abs(stride) * 1.2
  const squat = crouch * (1 - lift)

  // ぼう: 石の上から、字の線の場所へ。もちあげる とちゅう は 少し ふらふら
  const wobble = wave(t, 0.4) * 3.2 * Math.sin(lift * Math.PI)
  const tilt = (1 - lift) * TILT_DEG + wobble
  const drop = REST_DROP * (1 - lift)

  // 足: あるくとき かわりばんこ。しゃがむとき 少し ひらく
  const feet: readonly [Pt, Pt] = [
    [47 + stride * 7 - squat * 5, 94 - Math.max(0, Math.cos(phase)) * walking * 3.5],
    [62 - stride * 7 + squat * 5, 94 - Math.max(0, -Math.cos(phase)) * walking * 3.5],
  ]

  // 手: はじめは だらんと下げて、ぼうに とどくと にぎる
  const sy = hipY - 28
  const grasp = span(t, CROUCH + 0.2, GRIP + 0.3, easeInOut)
  const gripPts = [stickPoint(GRIP_X[0], tilt, drop), stickPoint(GRIP_X[1], tilt, drop)] as const
  const relaxed = [
    [44 + stride * 4, sy + 30],
    [65 - stride * 4, sy + 30],
  ] as const
  const hands: readonly [Pt, Pt] = [
    [relaxed[0][0] + (gripPts[0][0] - relaxed[0][0]) * grasp, relaxed[0][1] + (gripPts[0][1] - relaxed[0][1]) * grasp],
    [relaxed[1][0] + (gripPts[1][0] - relaxed[1][0]) * grasp, relaxed[1][1] + (gripPts[1][1] - relaxed[1][1]) * grasp],
  ]

  const mood: Mood = t < GRIP + 0.2 ? 'curious' : t < UP ? 'effort' : 'happy'
  const headTilt = t < STOP ? stride * 2 : t < CROUCH ? 7 * span(t, STOP, STOP + 0.4, easeOut) : t < UP ? 0 : wave(t, 1.4) * 3
  const headY = hipY - 44
  const held = grasp > 0.5
  const appear = span(t, 0.2, 0.7, easeOut)
  const stickPicture = (
    <Layer opacity={appear}>
      <Stick tilt={tilt} drop={drop - (1 - appear) * 22} />
    </Layer>
  )

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Rocks t={t} />
        <ellipse cx={54.5 + walkX} cy="97.4" rx="12" ry="2.6" fill="#000000" opacity="0.12" />
        {/* ぼうは、にぎる まえは 子どもの うしろ、にぎった あとは 子どもの 手まえ */}
        {!held && stickPicture}
        <Layer x={walkX}>
          <Child hipY={hipY} feet={feet} hands={hands} mood={mood} headTilt={headTilt} stick={held ? stickPicture : null} />
        </Layer>
        <Surprise t={t} x={68 + walkX} y={headY - 8} />
        <Sweat t={t} x={54.5} y={headY} />
        <Bird t={t} />
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
    { at: 0, label: '石の上に 1ぽんの ぼう', sound: 'pop' },
    { at: WALK, label: '子どもが あるいてくる' },
    { at: STOP, label: '「あれ?」と 立ちどまる', sound: 'pop' },
    { at: CROUCH, label: 'しゃがんで ぼうを つかむ' },
    { at: LIFT, label: 'よいしょ と もちあげる' },
    { at: UP, label: 'にっこり。小鳥が とまる', sound: 'pop' },
    { at: INK, label: 'ぼう が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '一 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
