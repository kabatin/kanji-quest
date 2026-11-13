/*
 * 画(えがく・が): ふでで 線を 引いて、くぎりを かく。
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
 *   → 1画目から 順に、ふでで 線を 引いて くぎりを かいていく(体を ずらし、かがんで、むきも かえる)
 *   → 田んぼの 絵が できて 子どもは ばんざい。くぎられた 田に 稲の 芽が ひょこっと 出る
 *   → ほね が ひかって、絵が うすくなり、字「画」が のこる
 *
 * 人は、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがり、手は ふでを にぎる。くび は みじかく、あし は こし から ひざ で まがる。
 *   うでが とどかない ところは、子どもが 横に 歩いて ちかづく・ひざを まげて かがむ。
 *   ふでの 先は、さいごまで 紙の 線の 先を なぞる(字の形になるのは、線を 引いた けっか)。
 */
import { backOut, clamp01, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '画'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#f0875a'
const TUNIC_DARK = '#d96d44'
const TUNIC_FAR = '#b9573a'
const PANTS = '#4a6fa5'
const PANTS_DARK = '#3d5c8c'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const GRASS = '#c5e8a9'
const PAPER = '#fff7e3'
const INK_COLOR = '#2b2b3a'
const BRUSH_DRY = '#e8c58a'
const BRUSH_WOOD = '#c58b4a'
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

const polyLength = (pts: readonly Pt[]): number => pts.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0)

/** くぎり の時間(秒) */
const WALK_FROM = 0.2
const WALK_TO = 1.3
const THINK = 1.5
const IDEA = 2.4
const DIP = 3.0
const DIP_UP = 3.55
const DRAW0 = 3.85
/** ふでを はしらせる はやさ(1秒に すすむ 長さ)と、線と線の あいだに ふでを うかせる 時間 */
const SPEED = 150
const LIFT = 0.1

/** 画ごとの 引きはじめ・引きおわり の時間 */
const SCHEDULE = STROKE_PTS.reduce<readonly { readonly start: number; readonly end: number }[]>((all, pts, i) => {
  const start = i === 0 ? DRAW0 : all[i - 1].end + LIFT
  return [...all, { start, end: start + Math.max(polyLength(pts) / SPEED, 0.22) }]
}, [])
const DRAW_END = SCHEDULE[SCHEDULE.length - 1].end
const INK = 9.2
const DONE = 11.8
const DURATION = 12

/** 地面の たかさ(足の うら)と、すみ つぼの 場所 */
const FLOOR = 95
const POT: Pt = [27, 90.2]
/** 子どもの からだの 大きさ */
const LEG = 12.5
const ARM = 16.5
const BRUSH = 13
const TORSO = 21
const STAND_HIP = 73

const rad = (deg: number) => (deg * Math.PI) / 180
const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/** 線の 上の どこか(p = 0〜1)の 点 */
function pointAt(pts: readonly Pt[], p: number): Pt {
  const f = clamp01(p) * (pts.length - 1)
  const i = Math.min(Math.floor(f), pts.length - 2)
  return lerpPt(pts[i], pts[i + 1], f - i)
}

/** 2つの ほね(かた→ひじ→手 / こし→ひざ→足)で つなぐ。bend = ひじ・ひざ の まがる むき */
function joint(from: Pt, to: Pt, l1: number, l2: number, bend: 1 | -1): { readonly mid: Pt; readonly end: Pt } {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const d = Math.min(Math.max(Math.hypot(dx, dy), 0.5), l1 + l2 - 0.05)
  const ux = dx / Math.hypot(dx, dy || 0.0001)
  const uy = dy / Math.hypot(dx, dy || 0.0001)
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d)
  const h = Math.sqrt(Math.max(l1 * l1 - a * a, 0))
  return { mid: [from[0] + ux * a - uy * h * bend, from[1] + uy * a + ux * h * bend], end: [from[0] + ux * d, from[1] + uy * d] }
}

/** 紙の 上を ふでの 先が すすむ 場所。線を 引いている間は 線を なぞり、あいだは うかせて うつる。 */
function drawingTip(t: number): Pt {
  const doing = SCHEDULE.findIndex((s) => t >= s.start && t <= s.end)
  if (doing >= 0) return pointAt(STROKE_PTS[doing], span(t, SCHEDULE[doing].start, SCHEDULE[doing].end))
  const next = SCHEDULE.findIndex((s) => t < s.start)
  const from = STROKE_PTS[next - 1]
  return lerpPt(from[from.length - 1], STROKE_PTS[next][0], span(t, SCHEDULE[next - 1].end, SCHEDULE[next].start, easeInOut))
}

/** ふでを にぎる かっこう: 先の 場所(tip)・ふでの 角度(theta)・体の 場所(bx) */
type PenPose = { readonly tip: Pt; readonly theta: number; readonly bx: number; readonly cheer: number }

/** 高いところは ふでを たてぎみ、低いところは 先を 下へ むける(手が 地面に めりこまない) */
const thetaFor = (tipY: number): number => 60 - clamp01((tipY - 40) / 46) * 85
/** 体は、ふでの 先から すこし 左に はなれて たつ */
const bodyFor = (tip: Pt, theta: number): number => Math.max(15, tip[0] - BRUSH * Math.cos(rad(theta)) - (20 - clamp01((tip[1] - 30) / 40) * 10))

function penPose(t: number): PenPose {
  if (t < DIP) {
    // はいってきて、ふでを かまえて かんがえる
    const bx = mix(t, WALK_FROM, WALK_TO, -14, 15, easeOut)
    return { tip: [bx + 11, 45], theta: 80, bx, cheer: 0 }
  }
  if (t < DRAW0) {
    const first = STROKE_PTS[0][0]
    const w = span(t, DIP, DIP + 0.3)
    const down = span(t, DIP, DIP + 0.35, easeInOut)
    const up = span(t, DIP_UP, DRAW0, easeInOut)
    const tip = lerpPt(lerpPt([25, 45], POT, down), first, up)
    const theta = mix(t, DIP, DIP + 0.35, 80, -60) + (thetaFor(first[1]) - -60) * up
    return { tip, theta: up > 0 ? mix(t, DIP_UP, DRAW0, -60, thetaFor(first[1])) : theta, bx: 15 + (bodyFor(tip, theta) - 15) * w, cheer: 0 }
  }
  if (t <= DRAW_END) {
    const tip = drawingTip(t)
    const theta = thetaFor(tip[1])
    return { tip, theta, bx: bodyFor(tip, theta), cheer: 0 }
  }
  // かけた! ふでを たかく あげて、ばんざい
  const last = STROKE_PTS[7][7]
  const endBx = bodyFor(last, thetaFor(last[1]))
  const cheer = span(t, DRAW_END, DRAW_END + 0.35, easeOut)
  const bx = mix(t, DRAW_END + 0.1, DRAW_END + 0.9, endBx, endBx - 10)
  return { tip: lerpPt(last, [bx + 16, 24], cheer), theta: mix(t, DRAW_END, DRAW_END + 0.35, thetaFor(last[1]), 80, easeOut), bx, cheer }
}

type Mood = 'wonder' | 'idea' | 'focus' | 'happy'

function moodAt(t: number): Mood {
  if (t < IDEA) return 'wonder'
  if (t < DIP) return 'idea'
  return t <= DRAW_END ? 'focus' : 'happy'
}

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <path d="M-4 99 Q18 78 44 92 Q72 72 113 94 V101 H-4 Z" fill="#e2f2d2" />
      <ellipse cx="54.5" cy="98" rx="53" ry="5.4" fill={GRASS} />
      <Layer opacity={sun} x={t * 0.8}>
        <ellipse cx="101" cy="4" rx="7" ry="3" fill="#ffffff" opacity="0.9" />
        <ellipse cx="96" cy="3" rx="4.6" ry="3" fill="#ffffff" opacity="0.9" />
      </Layer>
      {[5, 108].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
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

/** ふで。手に もたれる えと、先の ほさき(すみを つけると 黒くなる) */
function Brush({ hand, theta, inked }: { readonly hand: Pt; readonly theta: number; readonly inked: boolean }) {
  const dir: Pt = [Math.cos(rad(theta)), -Math.sin(rad(theta))]
  const side: Pt = [-dir[1], dir[0]]
  const at = (along: number, across = 0): string => `${hand[0] + dir[0] * along + side[0] * across} ${hand[1] + dir[1] * along + side[1] * across}`
  return (
    <>
      <path d={`M${at(-4)} L${at(BRUSH - 5)}`} stroke={BRUSH_WOOD} strokeWidth="2.2" strokeLinecap="round" />
      <path d={`M${at(BRUSH - 6, -1.4)} L${at(BRUSH - 6, 1.4)} L${at(BRUSH - 2, 1.3)} L${at(BRUSH)} L${at(BRUSH - 2, -1.3)} Z`} fill={inked ? INK_COLOR : BRUSH_DRY} strokeLinejoin="round" />
    </>
  )
}

type ChildProps = {
  readonly bx: number
  readonly crouch: number
  readonly lift: number
  readonly stride: number
  readonly pen: PenPose
  readonly mood: Mood
  readonly inked: boolean
  readonly tilt: number
}

/** 子ども(右を むいた よこがお)。足は こし から ひざ で まがり、うでは かた から ひじ で まがる */
function Child({ bx, crouch, lift, stride, pen, mood, inked, tilt }: ChildProps) {
  const hipY = STAND_HIP + crouch - lift
  const hip: Pt = [bx, hipY]
  const shoulder: Pt = [bx + 1, hipY - TORSO]
  const footNear: Pt = [bx + 2 + 7 * stride, FLOOR - lift - 3 * Math.max(0, stride)]
  const footFar: Pt = [bx - 2 - 7 * stride, FLOOR - lift - 3 * Math.max(0, -stride)]
  const legNear = joint(hip, footNear, LEG, LEG, -1)
  const legFar = joint(hip, footFar, LEG, LEG, -1)

  // ふでを にぎる 手: 先から ふでの ながさ ぶん もどった ところ
  const handWant: Pt = [pen.tip[0] - BRUSH * Math.cos(rad(pen.theta)), pen.tip[1] + BRUSH * Math.sin(rad(pen.theta))]
  const nearArm = joint(shoulder, handWant, ARM, ARM, 1)
  // むこうの うで: ふだんは 下に たれて、ばんざいの ときは 上へ
  const farHang: Pt = [bx - 1 + 3 * stride, shoulder[1] + 24]
  const farUp: Pt = [bx - 6, shoulder[1] - 22]
  const farArm = joint(shoulder, lerpPt(farHang, farUp, pen.cheer), ARM, ARM, 1)

  const headC: Pt = [bx + 1.5, shoulder[1] - 12.5]
  const neck: Pt = [bx + 0.6, shoulder[1] - 2]
  return (
    <>
      <path d={`M${hip[0]} ${hip[1]} L${legFar.mid[0]} ${legFar.mid[1]} L${legFar.end[0]} ${legFar.end[1]}`} fill="none" stroke={PANTS_DARK} strokeWidth="6.4" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx={legFar.end[0] + 1.6} cy={legFar.end[1] - 0.2} rx="4.6" ry="2.5" fill={SHOE} />
      <path d={`M${shoulder[0]} ${shoulder[1]} L${farArm.mid[0]} ${farArm.mid[1]} L${farArm.end[0]} ${farArm.end[1]}`} fill="none" stroke={TUNIC_FAR} strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={farArm.end[0]} cy={farArm.end[1]} r="3.1" fill={SKIN_SHADE} />
      <path d={`M${hip[0]} ${hip[1]} L${legNear.mid[0]} ${legNear.mid[1]} L${legNear.end[0]} ${legNear.end[1]}`} fill="none" stroke={PANTS} strokeWidth="6.6" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx={legNear.end[0] + 1.6} cy={legNear.end[1] - 0.2} rx="4.8" ry="2.6" fill={SHOE} />
      {/* くび と どう */}
      <rect x={neck[0] - 2.4} y={neck[1] - 2} width="5" height="5" rx="2" fill={SKIN_SHADE} />
      <rect x={bx - 6.8} y={shoulder[1] - 2.5} width="13.6" height={TORSO + 6} rx="6.4" fill={TUNIC} />
      <path d={`M${bx - 5.4} ${hipY - 3} h10.8`} stroke={TUNIC_DARK} strokeWidth="1.5" strokeLinecap="round" />
      {/* あたま */}
      <Layer rotate={tilt} origin={neck}>
        <circle cx={headC[0]} cy={headC[1]} r="9.2" fill={SKIN} />
        <path d={`M${headC[0] - 9.1} ${headC[1] + 1.2} C${headC[0] - 10} ${headC[1] - 9} ${headC[0] + 1} ${headC[1] - 12.4} ${headC[0] + 7} ${headC[1] - 7.4} C${headC[0] + 8.6} ${headC[1] - 6} ${headC[0] + 9} ${headC[1] - 4} ${headC[0] + 8.8} ${headC[1] - 2.6} C${headC[0] + 4} ${headC[1] - 6.4} ${headC[0] - 2.4} ${headC[1] - 4.6} ${headC[0] - 5.4} ${headC[1] + 1.4} C${headC[0] - 6.6} ${headC[1] + 4} ${headC[0] - 8} ${headC[1] + 4.4} ${headC[0] - 9.1} ${headC[1] + 1.2} Z`} fill={HAIR} />
        <ellipse cx={headC[0] - 1.6} cy={headC[1] + 1.6} rx="1.7" ry="2.2" fill={SKIN_SHADE} />
        <circle cx={headC[0] + 5} cy={headC[1] + 3.6} r="1.9" fill="#ff9d9d" opacity="0.55" />
        <Face at={headC} mood={mood} />
      </Layer>
      {/* うで と ふで(いちばん 手前) */}
      <path d={`M${shoulder[0]} ${shoulder[1]} L${nearArm.mid[0]} ${nearArm.mid[1]} L${nearArm.end[0]} ${nearArm.end[1]}`} fill="none" stroke={TUNIC_DARK} strokeWidth="5.8" strokeLinecap="round" strokeLinejoin="round" />
      <Brush hand={nearArm.end} theta={pen.theta} inked={inked} />
      <circle cx={nearArm.end[0]} cy={nearArm.end[1]} r="3.2" fill={SKIN} />
    </>
  )
}

/** 顔(右むき)。気持ちで 目と口が かわる */
function Face({ at, mood }: { readonly at: Pt; readonly mood: Mood }) {
  const ex = at[0] + 5.2
  const ey = at[1] + 0.2
  const mx = at[0] + 5.6
  const my = at[1] + 5.6
  switch (mood) {
    case 'wonder':
      return (
        <>
          <path d={`M${ex - 1.8} ${ey - 3.4} l3.4 -0.8`} stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx={ex} cy={ey} r="1.25" fill="#2b2b2b" />
          <ellipse cx={mx} cy={my} rx="1.1" ry="1.4" fill="#b9483f" />
        </>
      )
    case 'idea':
      return (
        <>
          <circle cx={ex} cy={ey} r="1.4" fill="#2b2b2b" />
          <circle cx={ex + 0.5} cy={ey - 0.5} r="0.45" fill="#ffffff" />
          <path d={`M${mx - 1.8} ${my - 0.4} Q${mx} ${my + 1.8} ${mx + 1.6} ${my - 0.6}`} fill="none" stroke="#b9483f" strokeWidth="1.1" strokeLinecap="round" />
        </>
      )
    case 'focus':
      return (
        <>
          <path d={`M${ex - 1.8} ${ey - 2.6} l3.4 0.5`} stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx={ex} cy={ey} r="1.2" fill="#2b2b2b" />
          <path d={`M${mx - 1.4} ${my} h2.6`} stroke="#b9483f" strokeWidth="1.1" strokeLinecap="round" />
        </>
      )
    default:
      return (
        <>
          <path d={`M${ex - 1.8} ${ey + 0.8} Q${ex} ${ey - 1.8} ${ex + 1.8} ${ey + 0.8}`} fill="none" stroke="#2b2b2b" strokeWidth="1.2" strokeLinecap="round" />
          <path d={`M${mx - 2.2} ${my - 1} Q${mx} ${my + 3.4} ${mx + 2.2} ${my - 1} Z`} fill="#b9483f" />
        </>
      )
  }
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
function Bird({ t }: SceneProps) {
  const arrive = span(t, 0.7, 1.4, easeOut)
  if (arrive <= 0) return null
  const flying = arrive < 1
  const x = 120 - arrive * 34
  const y = -4 + arrive * 6 - (flying ? Math.sin(arrive * Math.PI) * 4 : 0)
  const cheer = span(t, DRAW_END + 0.2, DRAW_END + 1.4)
  const hop = cheer > 0 && cheer < 1 ? Math.abs(Math.sin(cheer * Math.PI * 3)) * 2.4 : 0
  const flap = flying ? wave(t, 0.16) * 28 : 0
  return (
    <Layer x={x} y={y - hop}>
      <path d="M2.8 0.6 l5 -1.8 l-3.6 3.4 Z" fill="#e2733f" />
      <ellipse cx="0" cy="0" rx="4.2" ry="3.3" fill="#ff9a5c" />
      <circle cx="-3.2" cy="-2.5" r="2.4" fill="#ff9a5c" />
      <path d="M-5.3 -2.6 l-2.5 0.7 l2.4 1 Z" fill="#f2b632" />
      <circle cx="-3.8" cy="-3" r="0.6" fill="#2b2b2b" />
      <path d="M-1 3 v2.4 M1.2 3 v2.4" stroke="#e2733f" strokeWidth="0.7" strokeLinecap="round" />
      <Layer rotate={flap} origin={[0.4, -0.6]}>
        <path d="M-1.2 -0.8 Q1.6 -4 4.2 -0.6 Q1.6 0.8 -1.2 -0.8 Z" fill="#e2733f" />
      </Layer>
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)
  const pen = penPose(t)
  const walking = t >= WALK_FROM && t < WALK_TO ? 1 - span(t, WALK_TO - 0.3, WALK_TO) : 0
  const stride = Math.sin((t - WALK_FROM) * Math.PI * 2 * 1.7) * walking
  // うで が とどかない 低いところでは、ひざを まげて かがむ
  const crouch = Math.min(Math.max((pen.tip[1] - 62) * 0.42, 0), 12)
  // ばんざい の とき、ぴょんぴょん はねる
  const cheerT = span(t, DRAW_END + 0.2, DRAW_END + 1.1)
  const lift = cheerT > 0 && cheerT < 1 ? Math.abs(Math.sin(cheerT * Math.PI * 2)) * 4 : 0
  const bob = -Math.abs(stride) * 1.2
  // ふでの 先を 見る むき(下なら うつむく、高いなら 見上げる)
  const tilt = Math.min(Math.max((pen.tip[1] - 42) * 0.14, -4), 6) + (t < DIP ? -3 : 0)
  const inked = t >= DIP + 0.3
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Easel t={t} />
        <Rice t={t} />
        <Lines t={t} />
        <InkPot />
        <Bird t={t} />
        <Layer opacity={span(t, WALK_FROM - 0.05, WALK_FROM + 0.1)}>
          <ellipse cx={pen.bx + 1} cy="97.4" rx="9" ry="2.2" fill="#000000" opacity="0.12" />
          <Child bx={pen.bx} crouch={crouch - bob} lift={lift} stride={stride} pen={pen} mood={moodAt(t)} inked={inked} tilt={tilt} />
        </Layer>
        <Thought t={t} bx={pen.bx} />
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
