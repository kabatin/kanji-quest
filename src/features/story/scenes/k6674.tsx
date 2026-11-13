/*
 * 晴(はれ): くもっていた空が、青く はれて お日さまが でる。
 *
 * ほね(画と絵の対応)
 *   1〜4画目(日)  … 左がわの お日さま(まるい お日さまが 左に 出る。日の わく の中)
 *   5〜12画目(青) … 右がわの ひろい 青い空 と、そこに 立つ 子ども(青い空 の下)
 *   (字は まるい お日さま・青い空 に だいたい 重なる くらい でよい。絵は ほんものの形を守る)
 *
 * ながれ
 *   くもって 灰色の空。ボールを もった子が「あそびたいな…」と しょんぼり
 *   → かぜが ふいて、雲が 左と右へ はなれていく
 *   → 雲の あいだから お日さまが ぽん と 出て、空が 青く かわる
 *   → 子どもは おどろいて 空を見上げ、にっこり。りょうてを あげて ぴょんと よろこぶ
 *   → ほね が ひかって、絵が うすくなり、字「晴」が のこる
 *
 * 子どもは、ほんものの人の つくり を守る(まえむき):
 *   うで は かた から出て ひじ で まがる。くび は みじかく、どう の まんなか の上。あし は こし から。
 *   雲は たいらな そこ と もくもく の上。お日さまは まん丸。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '晴'

const SKY_GRAY = '#9aa7ba'
const SKY_BLUE = '#8fd0f7'
const CLOUD_GRAY = '#b3bdcc'
const CLOUD_GRAY_DARK = '#97a3b6'
const CLOUD_WHITE = '#ffffff'
const SUN = '#ffd24a'
const SUN_DARK = '#ffb938'
const SUN_RAY = '#ffc233'
const HILL = '#e2f2d2'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SKIN = '#f8cfa6'
const HAIR = '#5a3b2a'
const SHIRT = '#e8634a'
const SHIRT_DARK = '#cc4f38'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const BALL = '#ffffff'
const BALL_RED = '#e8534a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const DROP = '#7cc4f2'

/** くぎり の時間(秒) */
const SAD = 1.0
const WIND = 2.4
const SUN_OUT = 3.4
const LOOK_UP = 3.9
const CHEER = 4.7
const INK = 6.6
const DONE = 9.6
const DURATION = 10.2

/** お日さまの まんなか と 大きさ(日の わく の中) */
const SUN_POS: readonly [number, number] = [26, 47]
const SUN_R = 12.5
/** 子どもの 足もとの まんなか(まえむき) */
const KID_X = 76
const FEET_Y = 96
/** かた の位置 */
const SHOULDER_Y = 69
const SHOULDER_DX = 7

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi)

/** 色を a から b へ まぜる(0〜1) */
function mixColor(a: string, b: string, k: number): string {
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
  const out = [0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * k))
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/* ───────── 空・地面 ───────── */

function Backdrop({ t }: SceneProps) {
  // 雲が はなれると、空が 灰色から 青へ かわる
  const blue = span(t, WIND + 0.2, SUN_OUT + 0.9, easeInOut)
  const sky = mixColor(SKY_GRAY, SKY_BLUE, blue)
  return (
    <>
      <rect x="0" y="0" width="109" height="109" fill={sky} />
      <path d="M-4 99 Q18 78 44 90 Q72 72 113 93 V101 H-4 Z" fill={mixColor('#cfd8c6', HILL, blue)} />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={mixColor('#b4cf9a', GRASS, blue)} />
      {[8, 46, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/* ───────── お日さま ───────── */

function Sun({ t }: SceneProps) {
  // 雲の うしろから、ぽん と 出る
  const pop = span(t, SUN_OUT - 0.3, SUN_OUT + 0.6, backOut)
  if (pop <= 0) return null
  const r = SUN_R * Math.max(0, pop)
  const rays = span(t, SUN_OUT, SUN_OUT + 0.8, easeOut)
  const happy = t > LOOK_UP + 0.4
  return (
    <>
      <Layer rotate={t * 16} origin={SUN_POS} opacity={rays}>
        {Array.from({ length: 10 }, (_, i) => (
          <rect key={i} x={SUN_POS[0] - 0.9} y={SUN_POS[1] - SUN_R - 6.4} width="1.8" height="4.2" rx="0.9" fill={SUN_RAY} transform={`rotate(${i * 36} ${SUN_POS[0]} ${SUN_POS[1]})`} />
        ))}
      </Layer>
      <circle cx={SUN_POS[0]} cy={SUN_POS[1]} r={r} fill={SUN_DARK} />
      <circle cx={SUN_POS[0] - 0.6} cy={SUN_POS[1] - 0.6} r={r * 0.92} fill={SUN} />
      {pop > 0.6 && (
        <>
          {happy ? (
            <>
              <path d={`M${SUN_POS[0] - 6} ${SUN_POS[1] - 1} q2 -2.4 4 0 M${SUN_POS[0] + 2} ${SUN_POS[1] - 1} q2 -2.4 4 0`} fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
              <path d={`M${SUN_POS[0] - 3.4} ${SUN_POS[1] + 3.2} q3.4 3.6 6.8 0`} fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx={SUN_POS[0] - 4} cy={SUN_POS[1] - 1.4} r="1.2" fill={EYE} />
              <circle cx={SUN_POS[0] + 4} cy={SUN_POS[1] - 1.4} r="1.2" fill={EYE} />
              <path d={`M${SUN_POS[0] - 2.4} ${SUN_POS[1] + 3.4} q2.4 2 4.8 0`} fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
            </>
          )}
          <circle cx={SUN_POS[0] - 7.4} cy={SUN_POS[1] + 2.6} r="1.9" fill="#ff9d6a" opacity="0.6" />
          <circle cx={SUN_POS[0] + 7.4} cy={SUN_POS[1] + 2.6} r="1.9" fill="#ff9d6a" opacity="0.6" />
        </>
      )}
    </>
  )
}

/* ───────── 雲 ───────── */

type CloudProps = { readonly cx: number; readonly base: number; readonly width: number; readonly puffs: readonly (readonly [number, number, number])[]; readonly tone: string; readonly dark: string }

/** 雲: そこ は たいら、上は もくもく。puffs は [中心からの よこ, そこ からの たかさ, 半径] */
function Cloud({ cx, base, width, puffs, tone, dark }: CloudProps) {
  const left = cx - width / 2
  return (
    <>
      <g fill={dark} transform="translate(0 1.6)">
        <rect x={left} y={base - 7} width={width} height="7" rx="3.5" />
        {puffs.map(([dx, up, r]) => (
          <circle key={dx} cx={cx + dx} cy={base - up} r={r} />
        ))}
      </g>
      <g fill={tone}>
        <rect x={left} y={base - 7} width={width} height="7" rx="3.5" />
        {puffs.map(([dx, up, r]) => (
          <circle key={dx} cx={cx + dx} cy={base - up} r={r} />
        ))}
      </g>
    </>
  )
}

function Clouds({ t }: SceneProps) {
  // はじめに ふわっと あつまり、かぜが ふくと 左右へ はなれていく
  const gather = span(t, 0, 0.7, easeOut)
  const drift = span(t, WIND, SUN_OUT + 1.6, easeInOut)
  const tone = mixColor(CLOUD_GRAY, CLOUD_WHITE, drift)
  const dark = mixColor(CLOUD_GRAY_DARK, '#e6eef7', drift)
  const fade = 1 - span(t, SUN_OUT + 0.8, SUN_OUT + 1.8)
  if (fade <= 0) return null
  return (
    <g opacity={fade * gather}>
      {/* 左の 雲: お日さまを かくして、左へ ながれる */}
      <Layer x={-drift * 58 - (1 - gather) * 10} y={0}>
        <Cloud cx={28} base={51} width={42} puffs={[[-9, 7, 8], [4, 10, 10.5], [14, 5, 7.5]]} tone={tone} dark={dark} />
      </Layer>
      {/* まんなかの 雲: 右へ */}
      <Layer x={drift * 70} y={0}>
        <Cloud cx={58} base={36} width={40} puffs={[[-8, 6, 7.5], [3, 9.5, 10], [13, 5, 7]]} tone={tone} dark={dark} />
      </Layer>
      {/* 右上の 雲: 右へ */}
      <Layer x={drift * 55 + (1 - gather) * 10}>
        <Cloud cx={86} base={20} width={34} puffs={[[-6, 5.5, 6.5], [4, 8, 8.5], [12, 4, 6]]} tone={tone} dark={dark} />
      </Layer>
    </g>
  )
}

/** くもっている間の ぽつぽつ(あそべない わけ) */
function Drizzle({ t }: SceneProps) {
  const show = during(t, 0.5, WIND + 0.3, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show * 0.9}>
      {[0, 0.33, 0.66].flatMap((offset, i) =>
        [58, 76, 92].map((x, j) => {
          const p = (((t * 1.1 + offset + j * 0.21) % 1) + 1) % 1
          return <path key={`${i}-${j}`} d="M0 -2 Q1.4 0.6 0 1.6 Q-1.4 0.6 0 -2 Z" fill={DROP} transform={`translate(${x + i * 3 - 3} ${38 + p * 26}) `} opacity={Math.sin(p * Math.PI)} />
        }),
      )}
    </g>
  )
}

/* ───────── 子ども ───────── */

type Mood = 'sad' | 'surprised' | 'happy'

/** うで: side は 左(-1)・右(+1)。angle は ま下から 外へ ひらいた角度、bend は ひじ から さきの 上への まがり */
function Arm({ side, angle, bend }: { readonly side: -1 | 1; readonly angle: number; readonly bend: number }) {
  const rad = (d: number) => (d * Math.PI) / 180
  const part = 8
  const sx = KID_X + side * SHOULDER_DX
  const ex = sx + side * Math.sin(rad(angle)) * part
  const ey = SHOULDER_Y + Math.cos(rad(angle)) * part
  const fore = angle + bend
  const hx = ex + side * Math.sin(rad(fore)) * part
  const hy = ey + Math.cos(rad(fore)) * part
  return (
    <>
      <path d={`M${sx} ${SHOULDER_Y} L${ex} ${ey} L${hx} ${hy}`} fill="none" stroke={SHIRT_DARK} strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hx} cy={hy} r="2.9" fill={SKIN} />
    </>
  )
}

type KidProps = { readonly mood: Mood; readonly armAngle: number; readonly armBend: number; readonly lookY: number; readonly crouch: number }

function Kid({ mood, armAngle, armBend, lookY, crouch }: KidProps) {
  const headY = 56 + crouch
  return (
    <>
      {/* あし: こし から 2本。まえむきで 左右に ならぶ */}
      <rect x={KID_X - 5.6} y="82" width="4.6" height="13.5" rx="2.3" fill={PANTS} />
      <rect x={KID_X + 1} y="82" width="4.6" height="13.5" rx="2.3" fill={PANTS} />
      <ellipse cx={KID_X - 3.6} cy="95.6" rx="4.2" ry="2.2" fill={SHOE} />
      <ellipse cx={KID_X + 3.6} cy="95.6" rx="4.2" ry="2.2" fill={SHOE} />
      {/* どう */}
      <rect x={KID_X - 8} y="65.6" width="16" height="20" rx="6" fill={SHIRT} />
      <path d={`M${KID_X - 6} 79 h12`} stroke={SHIRT_DARK} strokeWidth="1.3" strokeLinecap="round" />
      {/* くび: みじかく、どう の まんなか の上 */}
      <rect x={KID_X - 2.2} y="62" width="4.4" height="5" rx="1.8" fill="#eeb98a" />
      {/* うで: かた から ひじ で まがる */}
      <Arm side={-1} angle={armAngle} bend={armBend} />
      <Arm side={1} angle={armAngle} bend={armBend} />
      {/* あたま */}
      <circle cx={KID_X} cy={headY} r="9" fill={SKIN} />
      <path d={`M${KID_X - 9} ${headY - 1.6} C${KID_X - 10} ${headY - 11} ${KID_X + 10} ${headY - 11} ${KID_X + 9} ${headY - 1.6} C${KID_X + 6} ${headY - 5.6} ${KID_X - 6} ${headY - 5.6} ${KID_X - 9} ${headY - 1.6} Z`} fill={HAIR} />
      <circle cx={KID_X - 5.6} cy={headY + 3.4} r="1.9" fill="#ff9d9d" opacity="0.55" />
      <circle cx={KID_X + 5.6} cy={headY + 3.4} r="1.9" fill="#ff9d9d" opacity="0.55" />
      <Face mood={mood} y={headY} lookY={lookY} />
    </>
  )
}

function Face({ mood, y, lookY }: { readonly mood: Mood; readonly y: number; readonly lookY: number }) {
  if (mood === 'happy') {
    return (
      <>
        <path d={`M${KID_X - 5.2} ${y + 1.2} q1.7 -2.4 3.4 0 M${KID_X + 1.8} ${y + 1.2} q1.7 -2.4 3.4 0`} fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
        <path d={`M${KID_X - 3.4} ${y + 4.4} Q${KID_X} ${y + 9} ${KID_X + 3.4} ${y + 4.4} Z`} fill={MOUTH} />
      </>
    )
  }
  if (mood === 'surprised') {
    return (
      <>
        <circle cx={KID_X - 3.6} cy={y + 0.6 + lookY} r="1.5" fill={EYE} />
        <circle cx={KID_X + 3.6} cy={y + 0.6 + lookY} r="1.5" fill={EYE} />
        <ellipse cx={KID_X} cy={y + 5.4} rx="1.7" ry="2.1" fill={MOUTH} />
      </>
    )
  }
  return (
    <>
      <path d={`M${KID_X - 5.6} ${y - 0.6} l3.6 -1.2 M${KID_X + 5.6} ${y - 0.6} l-3.6 -1.2`} stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
      <circle cx={KID_X - 3.6} cy={y + 1.4 + lookY} r="1.2" fill={EYE} />
      <circle cx={KID_X + 3.6} cy={y + 1.4 + lookY} r="1.2" fill={EYE} />
      <path d={`M${KID_X - 2.4} ${y + 6.6} q2.4 -2 4.8 0`} fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
    </>
  )
}

/** ボール: 足もとに ころがっている。子が とびはねると ぽんと はずむ */
function Ball({ t }: SceneProps) {
  const bounce = t > CHEER ? Math.abs(wave(t - CHEER, 1.0)) * 7 * (1 - span(t, INK - 1.5, INK)) : 0
  return (
    <Layer x={0} y={-bounce} rotate={t > CHEER ? (t - CHEER) * 120 : 0} origin={[KID_X + 17, 92]}>
      <circle cx={KID_X + 17} cy="92" r="4" fill={BALL} stroke="#d5dbe6" strokeWidth="0.5" />
      <path d={`M${KID_X + 14.2} 90.4 q2.8 -1.8 5.6 0 M${KID_X + 14.6} 94.4 q2.4 1.6 4.8 0`} fill="none" stroke={BALL_RED} strokeWidth="1.2" strokeLinecap="round" />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 12)

  // 子どもの きもち: しょんぼり → おどろき → にっこり
  const mood: Mood = t < LOOK_UP ? 'sad' : t < LOOK_UP + 0.8 ? 'surprised' : 'happy'
  const appear = span(t, 0.25, 0.8, backOut)
  // しょんぼり: うで は ま下に たれ、少し うつむく(目は 下)。ためいき で ゆっくり ゆれる
  const sag = t < LOOK_UP ? 1 - span(t, WIND, LOOK_UP) : 0
  // 空を 見上げる → りょうてを あげて よろこぶ
  const cheer = span(t, CHEER, CHEER + 0.6, easeOut) * (1 - span(t, INK - 0.4, INK + 0.2))
  const armAngle = mix(t, CHEER, CHEER + 0.6, 8, 135, easeOut) * (1 - span(t, INK - 0.4, INK + 0.2)) + 8 * span(t, INK - 0.4, INK + 0.2)
  const armBend = 10 + 24 * cheer
  const jump = t > CHEER + 0.2 ? Math.abs(wave(t - CHEER - 0.2, 0.9)) * 6 * (1 - span(t, INK - 0.5, INK + 0.1)) : 0
  const breath = wave(t, 2.2) * 0.4 * sag
  const lookY = t < LOOK_UP ? 1.1 : -1.2
  const crouch = sag * 1.2 + breath
  const lift = clamp(jump, 0, 7)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} />
        <Sun t={t} />
        <Clouds t={t} />
        <Drizzle t={t} />
        <ellipse cx={KID_X} cy="97.4" rx={9 - lift * 0.4} ry="2.3" fill="#000000" opacity="0.12" />
        <Layer opacity={appear} y={-lift} scale={0.6 + 0.4 * appear} origin={[KID_X, FEET_Y]}>
          <Kid mood={mood} armAngle={armAngle} armBend={armBend} lookY={lookY} crouch={crouch} />
        </Layer>
        <Ball t={t} />
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
    { at: 0, label: 'くもった 灰色の空', sound: 'pop' },
    { at: SAD, label: '子どもが ボールを もって しょんぼり' },
    { at: WIND, label: 'かぜが ふいて、雲が はなれていく' },
    { at: SUN_OUT, label: 'お日さまが ぽん と 出て、空が 青くなる', sound: 'pop' },
    { at: CHEER, label: '見上げて にっこり。りょうてを あげて よろこぶ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '晴 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
