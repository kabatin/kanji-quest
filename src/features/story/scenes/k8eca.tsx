/*
 * 車(くるま): 上から見た 車。わが 2つ、まん中に はこ。
 *
 * ほね(画と絵の対応)  ※ 上から見た 車 = 絵の「とびたった 小鳥の 目」
 *   1画目(一)  … 上がわの わ(上から見ると、ほそ長い 帯に 見える)
 *   2画目(丨)  … はこ の 左の かべ
 *   3画目(𠃍)  … はこ の 上の かべ と 右の かべ
 *   4画目(一)  … はこ の まんなかの しきり いた
 *   5画目(一)  … はこ の 下の かべ(そこ)
 *   6画目(一)  … 下がわの わ
 *   7画目(丨)  … 2つの わ を つらぬく じく(わ の そと へ 少し つき出る)
 *
 * ながれ
 *   野原に 荷車が とまっている → 小鳥が ぴょんぴょん やってきて、よこから 見て「あれ? わ が 1つしか ないよ」と くびを かしげる
 *   → ぐっと しゃがんで 空へ とびたつ(見えているのは よこ向きの 車、だんだん ちいさく とおのく)
 *   → 空から 見おろすと、わ が 2つ! まん中に はこ! と おどろいて、にっこり
 *   → 2つの わ と はこ が 字の画の場所に そろった しゅんかん、ほね が ひかって 字「車」になる
 *
 * 車と 小鳥は、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   よこから見た 車は、わ が まるく、はこ の よこに ひき棒。上から見た 車は、わ が 細い 帯 で、じく が 2つの わ を つなぐ。
 *   小鳥は はね が せなか から出て、とぶときは はばたき、足は おなかに たたむ。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, linear, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '車'

const SUN = '#ffd24a'
const GRASS = '#c5e8a9'
const GRASS_TOP = '#d5efb8'
const GRASS_PATCH = '#c0e3a0'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const HILL = '#e2f2d2'
const WOOD = '#e0a766'
const WOOD_BED = '#c58a4f'
const WOOD_DARK = '#9b6234'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const TIRE = '#5a3b2a'
const TIRE_LIGHT = '#8a6a50'
const HUB = '#9aa5b1'
const HUB_DARK = '#6d7884'
const APPLE = '#e8534a'
const APPLE_DARK = '#c9433b'
const BIRD = '#ff9a5c'
const BIRD_DARK = '#e2733f'
const BIRD_BELLY = '#ffe2c4'
const BEAK = '#f2b632'
const EYE = '#2b2b2b'
const CHEEK = '#ff9d9d'
const MOUTH = '#c4504a'

/** くぎり の時間(秒) */
const CART_IN = 0.1
/** 小鳥が ぴょんぴょん あるきはじめる / 車の まえに つく */
const ENTER = 0.9
const ARRIVE = 2.2
/** しゃがんで とびたつ / 空に ついて ようすを みる */
const CROUCH = 3.4
const TAKEOFF = 3.75
const HOVER = 4.9
/** よこむきの 世界が とおのき、上から見た 世界に かわる */
const SIDE_OUT = 3.9
const TOP_IN = 4.0
/** わ(上)・わ(下)・はこ が 1つずつ ぽん と はずむ */
const WHEEL_A = 5.0
const WHEEL_B = 5.35
const BOX_AT = 5.7
const INK = 6.5
const DONE = 9.1
const DURATION = 9.7

/** 小鳥が 地面に いるときの 足もとの 高さ、立ちどまる 場所、空で ようすを みる 場所 */
const GROUND = 96
const STAND_X = 20
const SKY: readonly [number, number] = [17, 24]

/* ───────── よこから見た 世界 ───────── */

function SideGround({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[96, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="95.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 96 13)`} />
        ))}
      </Layer>
      <circle cx="96" cy="13" r={6.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 70 113 93 V101 H-4 Z" fill={HILL} />
      {/* ゆっくり ながれる 雲 */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="14" cy="26" rx="7" ry="3.4" />
        <ellipse cx="19" cy="24" rx="5" ry="3.4" />
        <ellipse cx="58" cy="14" rx="6" ry="2.8" />
        <ellipse cx="62.5" cy="12.4" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 46, 82, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** よこから見た 荷車。わ は てまえの 1つだけ 見える(むこうがわの わ は、はこ に かくれる) */
const WHEEL_SIDE: readonly [number, number] = [62, 86]
const WHEEL_R = 11

function SideCart({ t }: SceneProps) {
  const pop = span(t, CART_IN, CART_IN + 0.7, backOut)
  // リンゴ(はこ の上に こんもり)
  const apples: readonly (readonly [number, number, number])[] = [
    [46, 55, 3.6],
    [53, 54.6, 3.6],
    [60, 54.8, 3.6],
    [67, 54.5, 3.6],
    [74, 54.9, 3.6],
    [81, 55.3, 3.6],
    [50, 50.8, 3.4],
    [57.5, 50.2, 3.4],
    [65, 50.6, 3.4],
    [72.5, 51, 3.4],
  ]
  return (
    <>
      <ellipse cx="64" cy="97.4" rx={34 * Math.min(pop, 1)} ry="2.6" fill="#000000" opacity="0.1" />
      <Layer scale={pop} origin={[62, 97]}>
        {/* ひき棒: はこ の下から、地面に おりる */}
        <path d="M86 70 L104 95" fill="none" stroke={BARK} strokeWidth="3.4" strokeLinecap="round" />
        {apples.map(([cx, cy, r], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r={r} fill={i % 3 === 1 ? APPLE_DARK : APPLE} />
            <circle cx={cx - r * 0.35} cy={cy - r * 0.35} r={r * 0.28} fill="#ffffff" opacity="0.7" />
          </g>
        ))}
        {/* はこ(よこから) */}
        <rect x="38" y="58" width="50" height="18" rx="3" fill={WOOD} />
        <rect x="38" y="58" width="50" height="4" rx="2" fill={WOOD_DARK} opacity="0.55" />
        <path d="M40 67.5 H86" stroke={WOOD_DARK} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        {/* わ(てまえ) */}
        <circle cx={WHEEL_SIDE[0]} cy={WHEEL_SIDE[1]} r={WHEEL_R} fill={TIRE} />
        <circle cx={WHEEL_SIDE[0]} cy={WHEEL_SIDE[1]} r="8.2" fill={WOOD} />
        {[0, 60, 120].map((deg) => (
          <path key={deg} d={`M${WHEEL_SIDE[0] - 8} ${WHEEL_SIDE[1]} H${WHEEL_SIDE[0] + 8}`} stroke={BARK} strokeWidth="1.5" strokeLinecap="round" transform={`rotate(${deg} ${WHEEL_SIDE[0]} ${WHEEL_SIDE[1]})`} />
        ))}
        <circle cx={WHEEL_SIDE[0]} cy={WHEEL_SIDE[1]} r="2.6" fill={HUB} />
        <circle cx={WHEEL_SIDE[0]} cy={WHEEL_SIDE[1]} r="1" fill={HUB_DARK} />
      </Layer>
    </>
  )
}

/** 小鳥の あたまの上の「?」(かんがえている) */
function Question({ t }: SceneProps) {
  const show = during(t, ARRIVE + 0.2, CROUCH + 0.1, 0.2)
  if (show <= 0) return null
  const x = STAND_X + 12
  const y = GROUND - 34 + wave(t, 0.8) * 0.8
  return (
    <g opacity={show} transform={`translate(${x} ${y})`}>
      <path d="M-2.8 -2.4 A2.9 2.9 0 1 1 1.4 0.2 Q0 1.1 0 3" fill="none" stroke="#5f7fd6" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="0" cy="6" r="1.1" fill="#5f7fd6" />
    </g>
  )
}

/* ───────── 上から見た 世界 ───────── */

function Flower({ x, y, t, phase }: { readonly x: number; readonly y: number; readonly t: number; readonly phase: number }) {
  return (
    <Layer x={x} y={y} rotate={wave(t, 2.6, phase) * 6} origin={[0, 0]}>
      {[0, 72, 144, 216, 288].map((deg) => (
        <circle key={deg} cx={Math.cos((deg * Math.PI) / 180) * 1.7} cy={Math.sin((deg * Math.PI) / 180) * 1.7} r="1.35" fill="#ffffff" />
      ))}
      <circle cx="0" cy="0" r="1.2" fill={SUN} />
    </Layer>
  )
}

function TopGround({ t }: SceneProps) {
  return (
    <>
      <rect x="0" y="0" width="109" height="109" rx="10" fill={GRASS_TOP} />
      <ellipse cx="94" cy="44" rx="14" ry="8" fill={GRASS_PATCH} />
      <ellipse cx="14" cy="64" rx="13" ry="7" fill={GRASS_PATCH} />
      <ellipse cx="76" cy="100" rx="16" ry="6" fill={GRASS_PATCH} />
      {[
        [100, 60],
        [8, 44],
        [20, 100],
        [100, 12],
      ].map(([x, y]) => (
        <path key={`${x}-${y}`} d={`M${x} ${y} l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF_DARK} />
      ))}
      <Flower x={101} y={86} t={t} phase={0} />
      <Flower x={7} y={90} t={t} phase={0.8} />
      <Flower x={99} y={30} t={t} phase={1.6} />
      <Flower x={36} y={100} t={t} phase={2.2} />
    </>
  )
}

/** はこ の 中の リンゴ。しきり の上下の すきま に ならべる */
function BoxApples() {
  // 上の つくりの 線(1つめ・2つめ の しきり)の 高さ
  const topY = (x: number) => 39.5 - (x - 30.4) * 0.0838
  const dividerY = (x: number) => 51.25 - (x - 32.5) * 0.0904
  const bottomY = (x: number) => 63.25 - (x - 34.25) * 0.0937
  const upper = [38, 46, 54, 62, 70].map((x) => [x, (topY(x) + 2.5 + dividerY(x) - 1.8) / 2, 2.5] as const)
  const lower = [42, 50, 58, 66, 73].map((x) => [x, (dividerY(x) + 1.8 + bottomY(x) - 2.5) / 2, 3] as const)
  return (
    <>
      {[...upper, ...lower].map(([cx, cy, r], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={r} fill={i % 3 === 1 ? APPLE_DARK : APPLE} />
          <circle cx={cx - r * 0.35} cy={cy - r * 0.35} r={r * 0.28} fill="#ffffff" opacity="0.7" />
        </g>
      ))}
    </>
  )
}

/** 上から見た 荷車。ぜんぶ 画の線(ほね)に そのまま のせる */
function TopCart({ t }: SceneProps) {
  const bump = (at: number) => Math.sin(span(t, at, at + 0.4) * Math.PI)
  const a = bump(WHEEL_A)
  const b = bump(WHEEL_B)
  const box = bump(BOX_AT)
  return (
    <>
      {/* かげ(ほね と おなじ形を、少し ずらして うすく) */}
      <g transform="translate(2.2 2.8)" opacity="0.12">
        <Bone char={CHAR} n={1} color="#000000" width={7.5} />
        <Bone char={CHAR} n={6} color="#000000" width={7.5} />
        <Bone char={CHAR} n={7} color="#000000" width={4.6} />
      </g>
      {/* じく: 2つの わ を つなぐ。わ の そとへ 少し つき出る */}
      <Bone char={CHAR} n={7} color={BARK_DARK} width={4.8} />
      <Bone char={CHAR} n={7} color={BARK} width={2.2} />
      {/* わ(上がわ) */}
      <Layer scaleX={1 + 0.05 * a} scaleY={1 + 0.6 * a} origin={[54.5, 24.2]}>
        <Bone char={CHAR} n={1} color={TIRE} width={7.5} />
        <Bone char={CHAR} n={1} color={TIRE_LIGHT} width={2.6} />
        <circle cx="54.6" cy="24.2" r="3.4" fill={HUB} />
        <circle cx="54.6" cy="24.2" r="1.3" fill={HUB_DARK} />
      </Layer>
      {/* わ(下がわ) */}
      <Layer scaleX={1 + 0.05 * b} scaleY={1 + 0.6 * b} origin={[54.5, 75.2]}>
        <Bone char={CHAR} n={6} color={TIRE} width={7.5} />
        <Bone char={CHAR} n={6} color={TIRE_LIGHT} width={2.6} />
        <circle cx="54.5" cy="75.2" r="3.6" fill={HUB} />
        <circle cx="54.5" cy="75.2" r="1.4" fill={HUB_DARK} />
      </Layer>
      {/* はこ: まわりの かべ(2・3・5画目)と、まんなかの しきり(4画目) */}
      <Layer scale={1 + 0.05 * box} origin={[55, 49]}>
        <path d="M28 38 L78 35 L82 39 L77.8 61.3 L33.5 64 Z" fill={WOOD_BED} stroke={WOOD_BED} strokeWidth="2" strokeLinejoin="round" />
        <Bone char={CHAR} n={2} color={WOOD} width={5} />
        <Bone char={CHAR} n={3} color={WOOD} width={5} />
        <Bone char={CHAR} n={5} color={WOOD} width={5} />
        <Bone char={CHAR} n={4} color={WOOD_DARK} width={3.6} />
        <BoxApples />
      </Layer>
    </>
  )
}

/* ───────── 小鳥(主役) ───────── */

type BirdMood = 'curious' | 'surprised' | 'happy'

type BirdProps = {
  readonly x: number
  readonly y: number
  readonly rotate: number
  readonly mood: BirdMood
  /** はね の上げさげ(まえむきに 0 = たたむ、プラスで 上へ) */
  readonly flap: number
  /** あたまの かたむき(プラスで くちばしが 下へ) */
  readonly tilt: number
  /** しゃがむ 度合い 0〜1 */
  readonly crouch: number
  readonly flying: boolean
}

function BirdEye({ mood }: { readonly mood: BirdMood }) {
  if (mood === 'happy') return <path d="M5.2 -13.2 Q6.7 -15.4 8.2 -13.2" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
  if (mood === 'surprised') {
    return (
      <>
        <circle cx="6.7" cy="-13.6" r="2.2" fill="#ffffff" stroke={EYE} strokeWidth="0.5" />
        <circle cx="7" cy="-13.5" r="1.1" fill={EYE} />
      </>
    )
  }
  return (
    <>
      <circle cx="6.6" cy="-13.6" r="1.2" fill={EYE} />
      <circle cx="6.95" cy="-13.95" r="0.4" fill="#ffffff" />
    </>
  )
}

function BirdBeak({ mood }: { readonly mood: BirdMood }) {
  if (mood === 'surprised') {
    return (
      <>
        <ellipse cx="9.4" cy="-12" rx="1.5" ry="1.1" fill={MOUTH} />
        <path d="M8.8 -14 L13.2 -13.2 L8.8 -12.2 Z" fill={BEAK} />
        <path d="M8.8 -11.8 L12 -10.4 L8.8 -10.2 Z" fill={BEAK} />
      </>
    )
  }
  return <path d="M9 -13.6 L13.6 -12.2 L9 -10.6 Z" fill={BEAK} />
}

/** ことり(よこむき、右むき)。足もと が 0,0。大きさ 1.2 ばい */
function Bird({ x, y, rotate, mood, flap, tilt, crouch, flying }: BirdProps) {
  return (
    <Layer x={x} y={y} rotate={rotate} origin={[0, -9]}>
      <Layer scale={1.2} origin={[0, 0]}>
        <Layer scaleY={1 - 0.14 * crouch} origin={[0, 0]}>
          {/* 足: とぶときは おなかに たたむ */}
          {flying ? (
            <path d="M-0.6 -3 l-3.4 2.2 M2 -3 l-3 2.6" fill="none" stroke={BIRD_DARK} strokeWidth="1.1" strokeLinecap="round" />
          ) : (
            <path d="M-1.2 -3 V0 M-2.8 0 H0.4 M2.2 -3 V0 M0.6 0 H3.8" fill="none" stroke={BIRD_DARK} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          )}
          {/* おは(おしり から ななめ 後ろ) */}
          <path d="M-5.5 -8 L-12.5 -11.5 L-11.4 -6 Z" fill={BIRD_DARK} />
          <ellipse cx="0" cy="-7" rx="7" ry="5.6" fill={BIRD} />
          <ellipse cx="1.6" cy="-5.3" rx="4.6" ry="3.4" fill={BIRD_BELLY} />
          {/* はね: せなか の かた から出る */}
          <Layer rotate={flap} origin={[-1, -9]}>
            <path d="M-1 -9 Q-8 -13.5 -12.5 -7.5 Q-6 -4.2 -1 -6.5 Z" fill={BIRD_DARK} />
          </Layer>
          {/* あたま */}
          <Layer rotate={tilt} origin={[3.5, -9.5]}>
            <circle cx="5" cy="-12.8" r="4.4" fill={BIRD} />
            <path d="M2.8 -16.6 q0.6 -3 2.6 -1.6 q0.8 -2.2 2.2 -0.4" fill="none" stroke={BIRD_DARK} strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="4.2" cy="-10.8" r="1.1" fill={CHEEK} opacity="0.6" />
            <BirdEye mood={mood} />
            <BirdBeak mood={mood} />
          </Layer>
        </Layer>
      </Layer>
    </Layer>
  )
}

/** そのときの 小鳥の ようす(あるく → かしげる → しゃがむ → とびたつ → 空で みおろす) */
function birdAt(t: number): BirdProps {
  const walk = span(t, ENTER, ARRIVE)
  const hop = Math.abs(Math.sin(walk * 3 * Math.PI)) * 3.6
  const p = span(t, TAKEOFF, HOVER, easeInOut)
  const flying = t >= TAKEOFF
  const mood: BirdMood = t < HOVER - 0.1 ? 'curious' : t < BOX_AT ? 'surprised' : 'happy'
  // よこむきの まま くびを かしげ、ぎゃくへ かしげ、もどす。空では 車を みおろす
  const tilt = 12 * span(t, ARRIVE, ARRIVE + 0.3) - 18 * span(t, ARRIVE + 0.7, ARRIVE + 1.0) + 6 * span(t, CROUCH, CROUCH + 0.3) + 16 * span(t, TAKEOFF + 0.6, HOVER)
  const crouch = span(t, CROUCH, TAKEOFF - 0.1) * (1 - span(t, TAKEOFF - 0.1, TAKEOFF + 0.15))
  const x = flying ? STAND_X + (SKY[0] - STAND_X) * p + Math.sin(p * Math.PI) * 6 : mix(t, ENTER, ARRIVE, -14, STAND_X, linear)
  const hover = flying && p >= 1 ? wave(t, 1) * 1.2 : 0
  const y = flying ? GROUND + (SKY[1] - GROUND) * p + hover : GROUND - hop * (walk < 1 ? 1 : 0)
  return { x, y, rotate: -22 * Math.sin(p * Math.PI), mood, flap: flying ? wave(t, 0.2) * 32 + 14 : 0, tilt, crouch, flying }
}

/** うれしい とき の きらきら(小鳥の まわり) */
function Joy({ t }: SceneProps) {
  const show = during(t, BOX_AT + 0.1, INK, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      <Star cx={41} cy={7 + wave(t, 0.9) * 0.8} r={2.8} color="#ffc233" spin={t * 90} />
      <Star cx={45} cy={14 - wave(t, 0.9, 0.3) * 0.8} r={2.2} color="#ff7a4d" spin={-t * 90} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)
  const sideOut = span(t, SIDE_OUT, SIDE_OUT + 0.8)
  const topIn = span(t, TOP_IN, TOP_IN + 0.8)
  const bird = birdAt(t)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        {/* よこから見た 世界: とびたつと、したへ ちいさく とおのく */}
        <Layer opacity={1 - sideOut} scale={mix(t, SIDE_OUT, SIDE_OUT + 0.8, 1, 0.6, easeIn)} origin={[54, 97]}>
          <SideGround t={t} />
          <SideCart t={t} />
        </Layer>
        {/* 上から見た 世界: ひろがって、車の ほんとうの 形が 見える */}
        <Layer opacity={topIn} scale={mix(t, TOP_IN, TOP_IN + 0.9, 0.6, 1, easeOut)} origin={[54.5, 54.5]}>
          <TopGround t={t} />
          <TopCart t={t} />
        </Layer>
        <Question t={t} />
        {t >= ENTER - 0.1 && <Bird {...bird} />}
        <Joy t={t} />
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
    { at: 0, label: '野原に 荷車が とまっている', sound: 'pop' },
    { at: ENTER, label: '小鳥が ぴょんぴょん やってくる' },
    { at: ARRIVE, label: 'よこからは わ が 1つ。「あれ?」と くびを かしげる' },
    { at: CROUCH, label: 'ぐっと しゃがんで', sound: 'pop' },
    { at: TAKEOFF, label: '空へ とびたつ' },
    { at: HOVER, label: '上から 見おろすと、わ が 2つ!', sound: 'pop' },
    { at: BOX_AT, label: 'まん中に はこ。小鳥は にっこり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '車 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
