/*
 * 心(こころ): しんぞうの 形。むねで どきどき うごく。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … 子どもの むねの よこで ひびく「どきどき」の しるし(左)
 *   2画目(乚)  … しんぞうの まるい そこ(下の ふくらみ)と、右がわの ひだり あがり
 *   3画目(丶)  … しんぞうの 上で はずむ「どき」の しるし
 *   4画目(丶)  … しんぞうの 右上で はずむ「どき」の しるし
 *   (しるし は、どっくん と うつときだけ ぱっと 出る)
 *
 * ながれ
 *   子どもが 走ってくる → とまって はあはあ(つかれた)
 *   → むねに 手を あてて「あれ? どきどき してる!」(おどろく)
 *   → むねの 中が ぽんと ひろがって、しんぞうが どくん どくん と うごくのが 見える
 *   → 子どもが わかって にっこり → しんぞうの 形が 字「心」に そろって、字になる
 *
 * 子どもは Person(走りは run、むきは turnAround、手を むねへ は { to, depth })。
 * けしき は Backdrop、あせ は Sweat、いき は Sigh。しんぞう(まるい ふくらみ と 太い くだ)と
 * 「どきどき」の しるし(Bone)は 部品に ないので ここで 描く。
 */
import { backOut, during, easeInOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, LOOKS, mixLimb, Person, personRig, run, Sigh, Sweat, turnAround } from '../sceneFigures'

const CHAR = '心'

const HEART = '#e8534a'
const HEART_DARK = '#c93d44'
const HEART_LIGHT = '#ff8a86'
const BUBBLE_OUT = '#ffd6d6'
const BUBBLE_IN = '#fff1ee'
const THROB = '#ff6f7a'

/** くぎり の時間(秒) */
const RUN = 0.3
const STOP = 2.6
/** むねに 手を あてる */
const HAND = 3.4
/** むねの 中が ひろがる */
const ZOOM = 4.6
const INK = 7.0
const DONE = 9.6
const DURATION = 10.2
/** しんぞうが うつ 間かく(秒) */
const BEAT = 0.85

/** 子どもの まんなか(x)・あしもと(y)・背の高さ */
const CX = 26
const FEET_Y = 94
const HEIGHT = 56
/** むね の まんなか(手を あてる ところ)と、手の まえへの きょり */
const CHEST: readonly [number, number] = [CX - 1, 58]
const CHEST_DEPTH = 4
/** しんぞうの まんなか(うつとき ふくらむ じく) */
const HEART_CENTER: readonly [number, number] = [58, 64]

/** どくん の波(0〜1)。「ど」と「くん」の 2回。start から BEAT 秒ごと。 */
function thump(t: number, start: number): number {
  if (t < start) return 0
  const ph = ((t - start) % BEAT) / BEAT
  const bump = (a: number, b: number) => (ph > a && ph < b ? Math.sin(((ph - a) / (b - a)) * Math.PI) : 0)
  return bump(0, 0.18) + 0.6 * bump(0.26, 0.42)
}

/** むねの中の ようす: まるい ふきだし の中で、しんぞう が どくん どくん と うつ。 */
function InsideChest({ t }: SceneProps) {
  const grow = span(t, ZOOM, ZOOM + 0.8, backOut)
  if (grow <= 0) return null
  const beat = thump(t, ZOOM + 0.5) * (1 - span(t, INK - 0.5, INK - 0.2))
  const s = Math.max(0, grow) * (1 + beat * 0.08)
  return (
    <>
      <Layer scale={Math.max(0, grow)} origin={[36, 62]}>
        <circle cx="60" cy="62" r="36" fill={BUBBLE_OUT} />
        <circle cx="60" cy="62" r="33" fill={BUBBLE_IN} />
      </Layer>
      <Layer scale={s} origin={HEART_CENTER}>
        {/* だいどうみゃく: 上に のびる 太い くだ */}
        <path d="M56 52 L56 41.6 Q56 37.4 60.2 37.4 Q64.4 37.4 64.4 41.6 L64.4 52 Z" fill={HEART_DARK} />
        {/* しんぞう の ほんたい: そこ は まるく ふくらみ、上は ふたこぶ */}
        <path d="M31.25 49.25 c9 22.75 27 35.5 53.25 32.25 c7.75 -0.96 7.25 -4.75 3 -9.5 C93 62 91 44 78 42 C70 41 63 45 60 50 C57 44 50 40 42 41 C34 42 29 46 31.25 49.25 Z" fill={HEART} />
        <path d="M36 49 C37 45.5 42 44.5 46 47" fill="none" stroke={HEART_LIGHT} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M70 48 C74 45.5 79 46 81 49" fill="none" stroke={HEART_LIGHT} strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
      </Layer>
    </>
  )
}

/** どきどき の しるし。字の 1・3・4画目の線 を そのまま つかう(どくん と うつ ときだけ 出る)。 */
function Throb({ t }: SceneProps) {
  const after = thump(t, HAND + 0.3) * (1 - span(t, INK - 0.5, INK - 0.2))
  const around = thump(t, ZOOM + 0.5) * (1 - span(t, INK - 0.5, INK - 0.2))
  const left = Math.min(1, after * 1.3) * during(t, HAND + 0.3, INK, 0.2)
  const near = Math.min(1, around * 1.3)
  return (
    <>
      {left > 0 && <Bone char={CHAR} n={1} color={THROB} width={2.2} opacity={left} />}
      {near > 0 && (
        <>
          <Bone char={CHAR} n={3} color={THROB} width={2.4} opacity={near} />
          <Bone char={CHAR} n={4} color={THROB} width={2.4} opacity={near} />
        </>
      )}
    </>
  )
}

/** 子どもの 場所と かっこう。走ってきて、とまって 正面を むき、右手を むねへ */
function childAt(t: number) {
  const running = run(t, { from: -30, to: CX, start: RUN, end: STOP, build: 'child', height: HEIGHT, stride: 16 })
  const turn = turnAround(t, STOP, 'right', 'front')
  const stopped = t >= STOP
  // とまってから: はあはあ で 体が 上下に ゆれる
  const heave = t >= STOP && t < HAND + 0.2 ? Math.abs(wave(t - STOP, 0.5)) * 0.9 : 0
  // 手を むねに あてる(右手 = 画面の 左。まえへ のばして むねの まんなかへ)
  const hand = span(t, HAND, HAND + 0.5, easeInOut)
  const rightArm = mixLimb({ swing: 8, bend: 10 }, { to: CHEST, depth: CHEST_DEPTH }, hand)
  const mood = t < STOP ? 'strain' : t < HAND ? 'worried' : t < ZOOM + 0.9 ? 'surprised' : 'joy'
  return {
    ...running,
    ...(t < STOP - 0.01 ? {} : turn),
    y: FEET_Y - heave,
    look: { ...LOOKS.boy, top: '#f2a13a' },
    face: mood,
    pose: stopped ? { rightArm, leftArm: { swing: 8, bend: 10 } } : running.pose,
  } as const
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)
  const child = childAt(t)
  const rig = personRig(child)
  const [hx, hy] = rig.world.head
  const headR = rig.body.headR * rig.scale
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const pant = during(t, STOP + 0.1, HAND + 0.2, 0.2)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} />
        <InsideChest t={t} />
        <Person {...child} />
        <Sweat t={t} x={hx - headR - 1} y={hy - 2} show={during(t, RUN + 0.5, STOP, 0.2)} />
        <Sigh x={hx + headR * 0.7} y={hy + headR * 0.5} p={((t - STOP) % 1) / 1} show={pant} dir={1} />
        <Throb t={t} />
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
    { at: 0, label: '子どもが 走ってくる', sound: 'pop' },
    { at: STOP, label: 'とまって はあはあ' },
    { at: HAND, label: 'むねに 手を あてて「どきどき?」', sound: 'pop' },
    { at: ZOOM, label: 'むねの中で しんぞうが どくん どくん', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '心 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
