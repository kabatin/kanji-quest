/*
 * 画(えがく・が): ふでで 線を 引いて、くぎりを かく。(共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 大きな 紙の 上のほうに 引く、よこ線(田の 上の あぜみち)
 *   2〜6画目   … 紙の まんなかの「田」。四角い わく(2・3画目)と、たて(4画目)・よこ(5・6画目)の くぎり線
 *   7・8画目   … 田を ぐるっと かこむ 大きな わく(左と下、右)
 *   ぜんぶ、子どもが ふで で 書きこんだ 線。字と 同じ 順に 引くので、絵の線が そのまま ほね になる。
 *
 * ながれ
 *   まっしろな 紙の まえで 子どもが「うーん?」。あたまの中に 田んぼの くぎりが うかぶ
 *   → すみ つぼ に ふでを ちょん と ひたす
 *   → 1画目から 順に、ふでで 線を 引いて くぎりを かいていく(足を ふんで 横へ うごき、かがんで 低い所も かく)
 *   → 田んぼの 絵が できて 子どもは ばんざい。くぎられた 田に 稲の 芽が ひょこっと 出る
 *   → ほね が ひかって、絵が うすくなり、字「画」が のこる
 *
 * 人は Person(右むき)。ふでは tools の 'brush'、手は { to } で ふでの もと へ。
 * 紙は 大きく 子どもの うでは とどく はんいが 決まっているので、足を ふみだして 横へ うごく(walk)。
 * 左へ もどる ときは、むきを かえず うしろへ さがる(walk の 時間を さかさまに して 足を うしろへ ふむ)。
 * そのぶん、元より 引く時間を のばした(足が すべらない ように、歩く時間を とった)。
 */
import { backOut, clamp01, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Bird, LOOKS, mixLimb, mixPose, posture, Person, walk, type Expression, type PersonPose } from '../sceneFigures'

const CHAR = '画'

const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const PAPER = '#fff7e3'
const INK_COLOR = '#2b2b3a'
const BRUSH_DRY = '#e8c58a'
const EARTH = '#ead9a8'

type Pt = readonly [number, number]

/** 画の 通り道の点(scene-info の「点」)。ふでの 先は これを なぞる */
const STROKE_PTS: readonly (readonly Pt[])[] = [
  [[26.1, 23.4], [34.2, 23.6], [42.2, 22.8], [50.2, 21.8], [58.2, 20.9], [66.2, 20], [74.2, 19.3], [82.3, 19.5]],
  [[30.8, 39.4], [32.8, 44.1], [33.6, 49.3], [34.2, 54.5], [34.8, 59.6], [35.3, 64.8], [35.8, 70], [36.2, 75.3]],
  [[33.3, 41.3], [44.4, 39.6], [55.6, 38.3], [66.9, 37.1], [77.1, 39], [76.1, 50.2], [74.5, 61.4], [72.3, 72.5]],
  [[52.7, 24.1], [54, 30.3], [54, 37], [54, 43.6], [53.9, 50.2], [53.9, 56.8], [53.9, 63.5], [53.9, 70.1]],
  [[35.6, 56.1], [41.1, 55.3], [46.7, 54.7], [52.2, 54.1], [57.7, 53.5], [63.2, 53], [68.8, 52.5], [74.3, 52.2]],
  [[37.3, 72.8], [42.2, 72.3], [47.1, 71.8], [52.1, 71.2], [57, 70.7], [62, 70.2], [67, 69.9], [71.9, 69.7]],
  [[18.1, 46.1], [19.5, 61.8], [19.1, 77.9], [24.9, 88.6], [41, 87.4], [57, 86.4], [73.1, 85.4], [89.3, 84.6]],
  [[91.9, 36.9], [93.1, 44.1], [92.7, 51.6], [92.3, 59.1], [91.9, 66.7], [91.4, 74.2], [90.9, 81.7], [90.3, 89.3]],
]

/**
 * 画ごとの 体(こし)の x。[引きはじめ, 引きおわり]。おわりが 大きければ 引きながら 歩いて すすむ。
 * まえの 画の おわり より はじめが 小さければ、あいだに うしろへ さがる。
 */
const STANCE: readonly (readonly [number, number])[] = [[14, 50], [22, 22], [22, 42], [34, 34], [26, 40], [26, 40], [10, 62], [78, 78]]

const polyLength = (pts: readonly Pt[]): number => pts.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0)
const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
const rad = (deg: number) => (deg * Math.PI) / 180

/** くぎり の時間(秒) */
const WALK_FROM = 0.2
const WALK_TO = 1.0
const THINK = 1.1
const IDEA = 1.8
const DIP = 2.3
const DIP_UP = 2.8
const DRAW0 = 3.1
/** ふでを はしらせる はやさ(1秒に すすむ 長さ)と、線と線の あいだに ふでを うかせる 時間 */
const SPEED = 150
const LIFT = 0.12
/** 歩く はやさ(1秒に すすむ 長さ。まえへ・うしろへ) */
const FORWARD = 80
const BACK = 65

type Move = { readonly from: number; readonly to: number; readonly start: number; readonly end: number }

/** 画ごとの 引きはじめ・引きおわり と、体の うごき(さがる・すすむ)を、じゅんに つくる */
function buildPlan(): { readonly strokes: readonly { readonly start: number; readonly end: number }[]; readonly moves: readonly Move[] } {
  const strokes: { start: number; end: number }[] = []
  const moves: Move[] = [{ from: -14, to: STANCE[0][0], start: WALK_FROM, end: WALK_TO }]
  STANCE.forEach(([from, to], i) => {
    const prevEnd = i === 0 ? DRAW0 : strokes[i - 1].end
    const prevBx = i === 0 ? STANCE[0][0] : STANCE[i - 1][1]
    const shift = from - prevBx
    const gap = shift === 0 ? (i === 0 ? 0 : LIFT) : Math.max(LIFT, Math.abs(shift) / (shift > 0 ? FORWARD : BACK) + 0.04)
    if (shift !== 0) moves.push({ from: prevBx, to: from, start: prevEnd, end: prevEnd + gap })
    const start = prevEnd + gap
    const end = start + Math.max(polyLength(STROKE_PTS[i]) / SPEED, Math.max(0, to - from) / FORWARD, 0.22)
    if (to !== from) moves.push({ from, to, start, end })
    strokes.push({ start, end })
  })
  return { strokes, moves }
}

const PLAN = buildPlan()
const SCHEDULE = PLAN.strokes
const DRAW_END = SCHEDULE[SCHEDULE.length - 1].end
const INK = DRAW_END + 1.3
const DONE = INK + 2.3
const DURATION = DONE + 0.2

/** 地面の たかさ(足の うら)と、すみ つぼの 場所 */
const FLOOR = 95
const POT: Pt = [27, 90.2]
/** 子どもの 背の高さ、ふでの 長さ(手から 先 まで は この 6わり) */
const KID_HEIGHT = 64
const BRUSH_LENGTH = 22
const HAND_TO_TIP = BRUSH_LENGTH * 0.6
const KID_LOOK = { ...LOOKS.boy, top: '#f0875a', bottom: '#4a6fa5' } as const

/** 線の 上の どこか(p = 0〜1)の 点 */
function pointAt(pts: readonly Pt[], p: number): Pt {
  const f = clamp01(p) * (pts.length - 1)
  const i = Math.min(Math.floor(f), pts.length - 2)
  return lerpPt(pts[i], pts[i + 1], f - i)
}

/** 紙の 上を ふでの 先が すすむ 場所。線を 引いている間は 線を なぞり、あいだは うかせて うつる。 */
function drawingTip(t: number): Pt {
  const doing = SCHEDULE.findIndex((s) => t >= s.start && t <= s.end)
  if (doing >= 0) return pointAt(STROKE_PTS[doing], span(t, SCHEDULE[doing].start, SCHEDULE[doing].end))
  const next = SCHEDULE.findIndex((s) => t < s.start)
  const from = STROKE_PTS[next - 1]
  return lerpPt(from[from.length - 1], STROKE_PTS[next][0], span(t, SCHEDULE[next - 1].end, SCHEDULE[next].start, easeInOut))
}

/** 体: いま どこに いて、足は どう うごいて いるか。さがる ときは 時間を さかさまに して うしろへ ふむ */
function bodyAt(t: number): { readonly x: number; readonly pose: PersonPose } {
  const started = PLAN.moves.filter((m) => m.start <= t)
  const m = started[started.length - 1] ?? PLAN.moves[0]
  const common = { start: m.start, end: m.end, build: 'child', height: KID_HEIGHT, step: KID_HEIGHT * 0.34, armSwing: 14 } as const
  if (m.to >= m.from) {
    const w = walk(t, { ...common, from: m.from, to: m.to })
    return { x: w.x, pose: w.pose }
  }
  const w = walk(m.start + m.end - Math.min(Math.max(t, m.start), m.end), { ...common, from: m.to, to: m.from })
  return { x: w.x, pose: w.pose }
}

/** ふでを にぎる かっこう: 先の 場所(tip)と ふでの 角度(theta) */
type PenPose = { readonly tip: Pt; readonly theta: number; readonly cheer: number }

/** 高いところは ふでを たてぎみ、低いところは 先を 下へ むける */
const thetaFor = (tipY: number): number => 60 - clamp01((tipY - 40) / 46) * 85

function penPose(t: number, bx: number): PenPose {
  if (t < DIP) {
    // はいってきて、ふでを かまえて かんがえる
    return { tip: [bx + 11, 45], theta: 80, cheer: 0 }
  }
  if (t < DRAW0) {
    const first = STROKE_PTS[0][0]
    const down = span(t, DIP, DIP + 0.35, easeInOut)
    const up = span(t, DIP_UP, DRAW0, easeInOut)
    const tip = lerpPt(lerpPt([bx + 11, 45], POT, down), first, up)
    const theta = up > 0 ? mix(t, DIP_UP, DRAW0, -60, thetaFor(first[1])) : mix(t, DIP, DIP + 0.35, 80, -60)
    return { tip, theta, cheer: 0 }
  }
  if (t <= DRAW_END) {
    const tip = drawingTip(t)
    return { tip, theta: thetaFor(tip[1]), cheer: 0 }
  }
  // かけた! ふでを たかく あげて、ばんざい
  const last = STROKE_PTS[7][7]
  const cheer = span(t, DRAW_END, DRAW_END + 0.35, easeOut)
  return { tip: lerpPt(last, [bx + 22, 30], cheer), theta: mix(t, DRAW_END, DRAW_END + 0.35, thetaFor(last[1]), 80, easeOut), cheer }
}

function faceAt(t: number): Expression {
  if (t < IDEA) return 'worried'
  if (t < DIP) return 'smile'
  return t <= DRAW_END ? 'normal' : 'joy'
}

/** 紙を はった おおきな ついたて(イーゼル)。ここに 絵を かく */
function Easel({ t }: SceneProps) {
  const pop = span(t, 0, 0.55, backOut)
  return (
    <Layer scale={pop} origin={[54.5, 96]}>
      <rect x="8.4" y="6.5" width="3.8" height="91" rx="1.8" fill={BARK} />
      <rect x="100.8" y="6.5" width="3.8" height="91" rx="1.8" fill={BARK} />
      <rect x="7" y="6.4" width="99" height="4" rx="2" fill={BARK_DARK} />
      <rect x="14.2" y="12.2" width="87" height="82" rx="2.2" fill="#000000" opacity="0.1" />
      <rect x="12.6" y="10.8" width="87" height="82" rx="2.2" fill={PAPER} />
      <circle cx="16.5" cy="10.6" r="2" fill="#e8534a" />
      <circle cx="96" cy="10.6" r="2" fill="#e8534a" />
    </Layer>
  )
}

/** 子どもが ふでで 引いた 線。ふでの先が 通った ところまで、すみ で 見える */
function Lines({ t }: SceneProps) {
  return (
    <>
      {STROKE_PTS.map((_, i) => (
        <Bone key={i} char={CHAR} n={i + 1} color={INK_COLOR} width={2.4} to={span(t, SCHEDULE[i].start, SCHEDULE[i].end)} />
      ))}
    </>
  )
}

/** くぎられた 田に、稲の 芽が ひょこっと 出る(絵を かいた けっか) */
const PLOTS: readonly { readonly x: number; readonly y: number; readonly w: number; readonly h: number }[] = [
  { x: 36.5, y: 41, w: 15, h: 11.5 },
  { x: 56, y: 41, w: 18, h: 9.5 },
  { x: 36.5, y: 58, w: 15, h: 11 },
  { x: 56, y: 56, w: 14, h: 11 },
]

function Rice({ t }: SceneProps) {
  const base = span(t, DRAW_END + 0.1, DRAW_END + 0.5, easeOut)
  if (base <= 0) return null
  return (
    <>
      {/* 田を かこむ ところは 土の 色 */}
      <rect x="21.5" y="39.5" width="67" height="44" rx="3" fill={EARTH} opacity={0.75 * base} />
      {PLOTS.map((plot, i) => {
        const grow = span(t, DRAW_END + 0.3 + i * 0.14, DRAW_END + 0.9 + i * 0.14, backOut)
        return (
          <g key={i}>
            <rect x={plot.x} y={plot.y} width={plot.w} height={plot.h} rx="1.6" fill={LEAF_LIGHT} opacity={0.85 * base} />
            {[0.22, 0.5, 0.78].map((k) => {
              const sx = plot.x + plot.w * k
              const sy = plot.y + plot.h - 2.2
              const sway = wave(t, 1.6, k * 2) * 0.5
              return (
                <Layer key={k} scale={Math.max(0, grow)} origin={[sx, sy]} x={sway}>
                  <path d={`M${sx} ${sy} q-1.4 -2.6 -3 -3.4 M${sx} ${sy} q1.2 -3.2 2.8 -4.2`} fill="none" stroke={LEAF_DARK} strokeWidth="1.1" strokeLinecap="round" />
                </Layer>
              )
            })}
          </g>
        )
      })}
    </>
  )
}

function InkPot() {
  return (
    <>
      <ellipse cx={POT[0]} cy="95.8" rx="8" ry="1.6" fill="#000000" opacity="0.14" />
      <path d={`M${POT[0] - 6.5} ${POT[1]} Q${POT[0] - 6.5} ${POT[1] + 5.4} ${POT[0]} ${POT[1] + 5.4} Q${POT[0] + 6.5} ${POT[1] + 5.4} ${POT[0] + 6.5} ${POT[1]} Z`} fill="#6b5a86" />
      <ellipse cx={POT[0]} cy={POT[1]} rx="6.5" ry="2" fill="#8a78a8" />
      <ellipse cx={POT[0]} cy={POT[1] + 0.2} rx="5.2" ry="1.4" fill={INK_COLOR} />
    </>
  )
}

/** 子ども: 紙の 前に たって、ふでを 引く。低い ところは ひざを まげて かがむ */
function Kid({ t }: SceneProps) {
  const body = bodyAt(t)
  const pen = penPose(t, body.x)
  const dir: Pt = [Math.cos(rad(pen.theta)), -Math.sin(rad(pen.theta))]
  const hand: Pt = [pen.tip[0] - dir[0] * HAND_TO_TIP, pen.tip[1] - dir[1] * HAND_TO_TIP]
  // 低いほど かがむ(体の さがりぐあいは 部品の posture が 合わせる)
  const crouch = clamp01((pen.tip[1] - 52) / 40) * 0.85 * (1 - pen.cheer)
  const stance = mixPose(body.pose, posture('squat', 'right'), crouch)
  // ばんざい の とき、ぴょんぴょん はねる
  const cheerT = span(t, DRAW_END + 0.2, DRAW_END + 1.1)
  const lift = cheerT > 0 && cheerT < 1 ? Math.abs(Math.sin(cheerT * Math.PI * 2)) * 4 : 0
  const pose: PersonPose = {
    ...stance,
    // 右むき では 左うでが てまえ(ふでを にぎる)。むこうの うで は ふだんは たれ、ばんざい で 上へ
    leftArm: { to: hand },
    rightArm: mixLimb(stance.rightArm ?? { swing: 4, bend: 8 }, { swing: 150, bend: 30 }, pen.cheer),
  }
  return (
    <Person
      x={body.x}
      y={FLOOR}
      facing="right"
      build="child"
      height={KID_HEIGHT}
      lift={lift}
      look={KID_LOOK}
      face={faceAt(t)}
      pose={pose}
      lean={crouch > 0.1 ? 4 : 0}
      tools={{ left: { kind: 'brush', tip: pen.tip, length: BRUSH_LENGTH, ink: t >= DIP + 0.3 ? INK_COLOR : BRUSH_DRY } }}
    />
  )
}

/** あたまの 上の ふきだし: 田んぼを 四角く くぎった 絵が うかぶ */
function Thought({ t, bx }: SceneProps & { readonly bx: number }) {
  const show = span(t, THINK, THINK + 0.35, backOut) * (1 - span(t, DIP - 0.15, DIP + 0.15))
  if (show <= 0) return null
  const cx = bx + 26
  const cy = 19
  return (
    <Layer scale={Math.max(0, show)} origin={[bx + 8, 29]}>
      <circle cx={bx + 9} cy="27.4" r="1.4" fill="#ffffff" stroke="#bcd0e6" strokeWidth="0.8" />
      <circle cx={bx + 13} cy="24.6" r="2.1" fill="#ffffff" stroke="#bcd0e6" strokeWidth="0.8" />
      <ellipse cx={cx} cy={cy} rx="14" ry="9.6" fill="#ffffff" stroke="#bcd0e6" strokeWidth="0.9" />
      <rect x={cx - 8.4} y={cy - 6} width="16.8" height="12" rx="1.4" fill={LEAF_LIGHT} stroke={BARK} strokeWidth="1.2" />
      <path d={`M${cx} ${cy - 6} v12 M${cx - 8.4} ${cy} h16.8`} stroke={BARK} strokeWidth="1.2" />
    </Layer>
  )
}

/** ついたての 上の 小鳥。子どもの 絵を のぞきこみ、できると ぴょんと はねる。 */
function EaselBird({ t }: SceneProps) {
  const arrive = span(t, 0.7, 1.4, easeOut)
  if (arrive <= 0) return null
  const flying = arrive < 1
  const x = 120 - arrive * 34
  const y = 1 + arrive * 3 - (flying ? Math.sin(arrive * Math.PI) * 4 : 0)
  const cheer = span(t, DRAW_END + 0.2, DRAW_END + 1.4)
  const hop = cheer > 0 && cheer < 1 ? Math.abs(Math.sin(cheer * Math.PI * 3)) * 2.4 : 0
  return <Bird x={x} y={y - hop} t={t} flying={flying} facing="left" size={0.9} />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)
  const bx = bodyAt(t).x
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={null} clouds={[[96, 4, 0.6]]} tufts={[5, 108]} />
        <Easel t={t} />
        <Rice t={t} />
        <Lines t={t} />
        <InkPot />
        <EaselBird t={t} />
        <Layer opacity={span(t, WALK_FROM - 0.05, WALK_FROM + 0.1)}>
          <Kid t={t} />
        </Layer>
        <Thought t={t} bx={bx} />
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
    { at: 0, label: '大きな 紙を はった ついたて。子どもが ふでを もって やってくる', sound: 'pop' },
    { at: THINK, label: '「うーん?」 あたまに 田んぼの くぎりが うかぶ' },
    { at: DIP, label: 'ふでを すみ つぼに ちょん と ひたす', sound: 'tap' },
    { at: DRAW0, label: '線を 順に 引いて、田の くぎりを かいていく', sound: 'stroke' },
    { at: DRAW_END + 0.1, label: 'かけた! ばんざい。田に 稲の 芽が 出る', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '画 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
