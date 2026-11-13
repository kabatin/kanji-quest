/*
 * 話(はなす): ことばを したに のせて、はなす。
 *
 * ほね(画と絵の対応)
 *   1画目(丶)    … ことばが とびだす ぴかっ(ふきだしの 上)
 *   2・3・4画目  … ふきだしの 中の 3ぎょうの ことば(よこ線)
 *   5・6・7画目  … 話を きいている ねこの あたま(「口」の形)
 *   8画目(ノ)   … 子どもの かみの まえがみ(右から 左へ ながれる)
 *   9画目(一)   … 子どもの 目の ならび(2つの目の ところ)
 *   10画目(丨)  … 子どもの はな すじ(おでこ から 口の ちかくまで)
 *   11・12・13画目 … 子どもの おおきく あけた 口(「口」の形)。中で した が うごく
 *
 * ながれ
 *   ねこが 子どもを まっている → 子どもが ひょっこり 出てくる。はずかしくて もじもじ
 *   → えいっと 口を あけて ぺらぺら しゃべる(した が ひらひら うごく)
 *   → ことばが ふきだしに かきこまれていく。ねこの 耳が ぴん と たち、にこにこ(ハートが ふわり)
 *   → ほね が ひかって、絵が うすくなり、字「話」が のこる
 *
 * 子どもと ねこは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   子どもは 顔の まんなかに はな、目は 左右に ならぶ。くび は みじかく、ひふの 色の まま かたに つながる。
 *   口は 下あご が さがって ひらき、はぐきと した は 口の 中に ある。ねこは 耳が あたまの 上に 立つ。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '話'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const HAIR_LIGHT = '#7a5440'
const TUNIC = '#4f9be0'
const TUNIC_DARK = '#3c82c4'
const EYE = '#2b2b2b'
const CHEEK = '#ff9d9d'
const MOUTH_IN = '#9c3440'
const TONGUE = '#ff8a8a'
const TONGUE_DARK = '#e66a78'
const CAT = '#f4a259'
const CAT_DARK = '#d9863d'
const CREAM = '#fff3df'
const PINK = '#ff9d9d'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const HILL = '#e2f2d2'
const WORD_RED = '#e8647a'
const WORD_BLUE = '#4a90d9'
const WORD_GREEN = '#4fae6a'
const SPARK = '#ff9f1c'

/** くぎり の時間(秒) */
const POP = 0.9
const BRAVE = 1.8
const TALK = 2.6
const BUBBLE = 3.1
/** しゃべりおわり。ねこが よろこぶ */
const HAPPY = 5.5
const INK = 6.6
const DONE = 10.0
const DURATION = 10.5

/** 子どもの 顔の まんなか(横)と 口の まんなか */
const FACE_X = 71
const MOUTH_Y = 79
/** 顔の下(くび の じく) */
const NECK_BASE: readonly [number, number] = [71, 98]
/** ねこの あたまの まんなか と、おしり(しっぽ の じく) */
const CAT_HEAD: readonly [number, number] = [28.5, 81]
const CAT_TAIL_ROOT: readonly [number, number] = [19.5, 95]
/** ことばを かく 3ぎょう(2〜4画目)の 書きはじめ。とんでくる ことば の ゆくさき */
const LINE_STARTS: readonly (readonly [number, number])[] = [
  [11.4, 32.8],
  [17.8, 47.1],
  [18.6, 59.3],
]
const LINE_COLORS = [WORD_RED, WORD_BLUE, WORD_GREEN] as const
/** ことばが 口から とびだす 場所 */
const MOUTH_EXIT: readonly [number, number] = [55, 74]
/** ふきだしに ことばを かきはじめる 時間 */
const LINES_AT = 3.75
const LINE_GAP = 0.55

function Background({ t }: SceneProps) {
  const fade = span(t, 0, 0.5, easeOut)
  return (
    <Layer opacity={fade}>
      <path d="M-4 99 Q18 78 44 92 Q72 72 113 94 V101 H-4 Z" fill={HILL} />
      {/* ちいさな 雲(ゆっくり ながれる) */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 0.5} 0)`}>
        <ellipse cx="97" cy="6.5" rx="6" ry="2.6" />
        <ellipse cx="101" cy="5" rx="4" ry="2.6" />
      </g>
      <ellipse cx="54.5" cy="103" rx="62" ry="8" fill={GRASS} />
      {[6, 14, 44, 100].map((x) => (
        <path key={x} d={`M${x} 99.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </Layer>
  )
}

/** ふきだし の ことばの すきま(文字の あいだの 空き) */
const WORD_GAPS: readonly (readonly [number, number, number])[] = [
  [0, 22.5, 32.6],
  [0, 33, 31.4],
  [1, 28.5, 46.4],
  [2, 29, 58.8],
]

function Bubble({ t }: SceneProps) {
  const pop = span(t, BUBBLE, BUBBLE + 0.45, backOut)
  const lines = [0, 1, 2].map((i) => span(t, LINES_AT + i * LINE_GAP, LINES_AT + i * LINE_GAP + 0.5, easeInOut))
  const tick = span(t, 5.1, 5.5, backOut)
  return (
    <>
      <Layer scale={pop} opacity={span(t, BUBBLE, BUBBLE + 0.15)} origin={[40, 64]}>
        <rect x="5" y="25.4" width="42" height="40" rx="9" fill="#cfe0f2" />
        <path d="M37 64 L45 64 L47 72 Z" fill="#cfe0f2" />
        <rect x="5" y="24" width="42" height="40" rx="9" fill="#ffffff" />
        <path d="M37 62.6 L45 62.6 L47 70.6 Z" fill="#ffffff" />
        {[2, 3, 4].map((n, i) => (
          <Bone key={n} char={CHAR} n={n} color={LINE_COLORS[i]} width={3.2} to={lines[i]} />
        ))}
        {WORD_GAPS.map(([line, x, y]) =>
          lines[line] > 0.95 ? <rect key={`${x}-${y}`} x={x - 0.8} y={y - 3} width="1.6" height="6" fill="#ffffff" /> : null,
        )}
      </Layer>
      {/* 1画目: ことばが とびだした ぴかっ */}
      <Layer scale={tick} opacity={tick > 0 ? 1 : 0} origin={[28, 19]}>
        <Bone char={CHAR} n={1} color={SPARK} width={3.2} />
      </Layer>
    </>
  )
}

/** 口から とびだして、ふきだしの ぎょうの はじまり へ とんでいく ことばの かたまり */
function Chips({ t }: SceneProps) {
  return (
    <>
      {LINE_STARTS.map(([ex, ey], i) => {
        const from = BUBBLE + 0.2 + i * LINE_GAP
        const p = span(t, from, from + 0.45)
        if (p <= 0 || p >= 1) return null
        const x = MOUTH_EXIT[0] + (ex - MOUTH_EXIT[0]) * p
        const y = MOUTH_EXIT[1] + (ey - MOUTH_EXIT[1]) * p - Math.sin(p * Math.PI) * 7
        return <rect key={i} x={x - 2.6} y={y - 1.4} width="5.2" height="2.8" rx="1.4" fill={LINE_COLORS[i]} opacity={1 - p * p} />
      })}
    </>
  )
}

type CatMood = 'wait' | 'hear' | 'happy'

function CatFace({ mood, look }: { readonly mood: CatMood; readonly look: readonly [number, number] }) {
  const eyes = [23.6, 33.4]
  return (
    <>
      {/* 耳(あたまの 上に 立つ) の すじ と ひたいの もよう */}
      <path d="M28.5 71.4 v3 M25 72 l0.5 2.4 M32 72 l-0.5 2.4" stroke={CAT_DARK} strokeWidth="1.1" strokeLinecap="round" fill="none" />
      {mood === 'happy' ? (
        eyes.map((x) => <path key={x} d={`M${x - 2.2} 81.4 Q${x} 77.8 ${x + 2.2} 81.4`} fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />)
      ) : (
        eyes.map((x) => (
          <g key={x}>
            <ellipse cx={x + look[0]} cy={80.2 + look[1]} rx={mood === 'hear' ? 2.2 : 1.9} ry={mood === 'hear' ? 2.5 : 2.2} fill={EYE} />
            <circle cx={x + look[0] - 0.7} cy={79.3 + look[1]} r="0.7" fill="#ffffff" />
          </g>
        ))
      )}
      <ellipse cx="28.5" cy="85.4" rx="4.6" ry="3" fill={CREAM} />
      <path d="M27.2 83.4 L29.8 83.4 L28.5 84.8 Z" fill={PINK} />
      {mood === 'happy' ? (
        <path d="M26 85.8 Q27.3 88 28.5 86 Q29.7 88 31 85.8" fill="none" stroke="#b9483f" strokeWidth="1" strokeLinecap="round" />
      ) : (
        <path d="M26.8 87.2 Q28.5 85.9 30.2 87.2" fill="none" stroke="#b9483f" strokeWidth="1" strokeLinecap="round" />
      )}
      {mood === 'happy' && (
        <>
          <ellipse cx="20.6" cy="84.4" rx="2.2" ry="1.4" fill={CHEEK} opacity="0.6" />
          <ellipse cx="36.4" cy="84.4" rx="2.2" ry="1.4" fill={CHEEK} opacity="0.6" />
        </>
      )}
    </>
  )
}

/** 話を きく ねこ。さいしょは 首を かしげて まっている → 耳が ぴん → にこにこ */
function Cat({ t }: SceneProps) {
  const appear = span(t, 0.3, 0.8, backOut)
  if (appear <= 0) return null
  const mood: CatMood = t >= HAPPY ? 'happy' : t >= BUBBLE ? 'hear' : 'wait'
  const earUp = span(t, BUBBLE, BUBBLE + 0.35, backOut)
  const droop = 12 * (1 - earUp)
  const twitch = mood === 'hear' ? wave(t, 0.5) * 2.5 : 0
  const joy = span(t, HAPPY, HAPPY + 0.3) * (1 - span(t, INK - 0.5, INK))
  const tilt = mix(t, BUBBLE - 0.3, BUBBLE + 0.3, 6 + wave(t, 2.4) * 1.2, 0) + wave(t, 0.5) * 2.4 * joy
  const hop = -Math.abs(wave(t, 0.5)) * 1.6 * joy
  const tailAmp = mood === 'happy' ? 14 : mood === 'hear' ? 6 : 2
  return (
    <Layer scale={appear} origin={[28, 98]}>
      <Layer rotate={wave(t, mood === 'happy' ? 0.5 : 1.1) * tailAmp} origin={CAT_TAIL_ROOT}>
        <path d="M19.5 95 C11.5 96 7 89 11 83.5" fill="none" stroke={CAT} strokeWidth="3.6" strokeLinecap="round" />
      </Layer>
      <ellipse cx="28" cy="92.5" rx="9.5" ry="6.6" fill={CAT} />
      <ellipse cx="28" cy="94.4" rx="5" ry="3.8" fill={CREAM} />
      <ellipse cx="23.6" cy="97.6" rx="3.2" ry="1.9" fill={CREAM} />
      <ellipse cx="32.6" cy="97.6" rx="3.2" ry="1.9" fill={CREAM} />
      <Layer y={hop} rotate={tilt} origin={[CAT_HEAD[0], 90]}>
        <Layer rotate={-droop + twitch} origin={[22, 77]}>
          <path d="M18.2 78 L19.5 66.5 L27.2 72 Z" fill={CAT} />
          <path d="M20.4 74.6 L20.8 69.6 L24.6 72.4 Z" fill={PINK} />
        </Layer>
        <Layer rotate={droop - twitch} origin={[35, 77]}>
          <path d="M38.8 78 L37.5 66.5 L29.8 72 Z" fill={CAT} />
          <path d="M36.6 74.6 L36.2 69.6 L32.4 72.4 Z" fill={PINK} />
        </Layer>
        <ellipse cx={CAT_HEAD[0]} cy={CAT_HEAD[1]} rx="11.8" ry="9.8" fill={CAT} />
        <CatFace mood={mood} look={[0.6, -0.4]} />
        <path d="M17 84.6 l-4.4 -0.9 M17 86.4 l-4.2 1.1 M40 84.6 l4.4 -0.9 M40 86.4 l4.2 1.1" stroke="#b79a80" strokeWidth="0.6" strokeLinecap="round" fill="none" />
      </Layer>
    </Layer>
  )
}

function Mouth({ open, wag }: { readonly open: number; readonly wag: number }) {
  if (open < 0.04) {
    // まだ ひらかない口: もじもじ ちいさく むすぶ
    return <path d="M64 79.4 q3.5 -2.4 7 0 t7 0" fill="none" stroke="#b9483f" strokeWidth="1.7" strokeLinecap="round" />
  }
  // うえの はぐきは うごかず、したあごが さがって ひらく(ひらくと 字の「口」の形)
  const w = 10 + 25 * open
  const h = 4 + 19.5 * open
  const x = FACE_X - w / 2
  const y = MOUTH_Y - h / 2
  const tongueRy = Math.max(0.8, 0.2 * h + 1 + wag * 0.9)
  const tongueRx = 0.3 * w
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx={Math.min(9, h / 2, w / 2)} fill={MOUTH_IN} />
      {h > 12 && <rect x={x + w * 0.18} y={y + 1.2} width={w * 0.64} height={Math.min(3.6, h * 0.18)} rx="1.4" fill="#ffffff" />}
      <ellipse cx={FACE_X + wag * 1.8} cy={y + h - tongueRy} rx={tongueRx} ry={tongueRy} fill={TONGUE} />
      {h > 12 && <path d={`M${FACE_X + wag * 1.8} ${y + h - tongueRy * 1.7} v${tongueRy * 0.9}`} stroke={TONGUE_DARK} strokeWidth="1.1" strokeLinecap="round" />}
    </>
  )
}

function Eyes({ happy, shy, blink }: { readonly happy: boolean; readonly shy: number; readonly blink: number }) {
  // 目は 9画目の よこ線の 上に ならぶ(左右に ひとつずつ)
  const xs = [57.5, 84.5]
  // はずかしい あいだは 下を 見る。しゃべるときは ねこ(左)を 見る
  const px = -0.7 - 0.4 * shy
  const py = 0.9 * shy
  return (
    <>
      {xs.map((x) =>
        happy ? (
          <path key={x} d={`M${x - 3.8} 46.4 Q${x} 40 ${x + 3.8} 46.4`} fill="none" stroke={EYE} strokeWidth="1.8" strokeLinecap="round" />
        ) : (
          <g key={x}>
            <ellipse cx={x + px} cy={45 + py} rx="3.1" ry={3.8 * blink} fill={EYE} />
            {blink > 0.5 && <circle cx={x + px - 1} cy={43.6 + py} r="1" fill="#ffffff" />}
          </g>
        ),
      )}
    </>
  )
}

function Hair() {
  return (
    <>
      {/* ひだり がわ: まえがみ(8画目の線が ふちに なる)と、よこがみ */}
      <path d="M81.75 12.5 C66 8.5 44 14 38.5 40 C37.6 46 37.8 52 39 57 L42 56 C43 45 46 36.5 50.75 31.75 C65 26 76 19 80.1 16.8 C81 16.1 81.6 15 81.75 13.75 Z" fill={HAIR} />
      {/* みぎ の こめかみ: うすく のこる かみ */}
      <path d="M81.75 12.5 C96 14 107 28 105 48 L101.5 48 C102.5 32 94 20 81.75 15 Z" fill={HAIR} />
      <path d="M53 22 Q63 14.5 76 13.6" fill="none" stroke={HAIR_LIGHT} strokeWidth="1.6" strokeLinecap="round" />
    </>
  )
}

/** 話す子ども。かおを おおきく見せる。くび は みじかく、かた へ つながる */
function Child({ t }: SceneProps) {
  const pop = span(t, POP, POP + 0.8, backOut)
  const shy = 1 - span(t, BRAVE - 0.2, BRAVE + 0.4)
  const opening = span(t, BRAVE, TALK, easeOut)
  const talkAmt = span(t, TALK, TALK + 0.3) * (1 - span(t, HAPPY, HAPPY + 0.5))
  const open = opening * (1 - talkAmt * 0.45 * (0.5 + 0.5 * wave(t, 0.42)))
  const wag = wave(t, 0.31) * talkAmt
  const happy = t >= HAPPY
  const lift = 1 - shy
  const settle = 1 - span(t, INK - 0.5, INK)
  const bob = (talkAmt * wave(t, 0.42) * 0.7 + (happy ? Math.abs(wave(t, 0.5)) * -0.8 : 0)) * settle
  const sway = shy * wave(t, 1.6) * 2
  const blink = t % 3.1 < 0.13 ? 0.15 : 1
  const innerBrow = 35 + 1.6 * lift - (happy ? 1.2 : 0)
  const outerBrow = 38.2 - 1.8 * lift - (happy ? 1.2 : 0)
  const sweat = during(t, POP + 0.4, BRAVE + 0.2, 0.2)
  const drop = span(t, POP + 0.4, BRAVE + 0.2)
  return (
    <Layer y={(1 - pop) * 100 + bob} rotate={sway} origin={NECK_BASE}>
      {/* みみ・くび・かた(ふくの えり) */}
      <circle cx="36.8" cy="58" r="4.2" fill={SKIN_SHADE} />
      <circle cx="105.2" cy="58" r="4.2" fill={SKIN_SHADE} />
      <rect x="62.5" y="90" width="17" height="10" rx="4" fill={SKIN_SHADE} />
      <path d="M30 110 C32 102 46 98.6 62 98.6 L80 98.6 C96 98.6 110 102 112 110 Z" fill={TUNIC} />
      <path d="M62 98.6 Q71 105 80 98.6" fill="none" stroke={TUNIC_DARK} strokeWidth="1.8" strokeLinecap="round" />
      {/* かお */}
      <ellipse cx={FACE_X} cy="56" rx="34" ry="40" fill={SKIN} />
      <Hair />
      <ellipse cx="50.5" cy="63.5" rx="5.5" ry="3.3" fill={CHEEK} opacity="0.55" />
      <ellipse cx="91.5" cy="63.5" rx="5.5" ry="3.3" fill={CHEEK} opacity="0.55" />
      <path d={`M52.5 ${outerBrow} L62.5 ${innerBrow} M89.5 ${outerBrow} L79.5 ${innerBrow}`} stroke={HAIR} strokeWidth="1.7" strokeLinecap="round" fill="none" />
      <Eyes happy={happy} shy={shy} blink={blink} />
      <path d="M72.2 52 q-2.2 4 -3.2 5.6 q1.4 1 3.4 0.2" fill="none" stroke="#dc9a68" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <Mouth open={open} wag={wag} />
      {/* はずかしい あせ */}
      {sweat > 0 && <path d="M0 -2.6 Q2.2 0.6 0 2.2 Q-2.2 0.6 0 -2.6 Z" fill="#7cc4f2" opacity={sweat} transform={`translate(98.5 ${40 + drop * 7})`} />}
    </Layer>
  )
}

const HEART = 'M0 1.8 C-3.8 -1 -2.4 -4 0 -2.2 C2.4 -4 3.8 -1 0 1.8 Z'

/** ねこの よろこび: ハートが ふわり(ねこの 左がわ) */
function Hearts({ t }: SceneProps) {
  const show = during(t, HAPPY + 0.2, INK - 0.1, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.5].map((offset, i) => {
        const p = ((t - HAPPY + offset) % 1.1) / 1.1
        return <path key={i} d={HEART} fill="#ff7a9a" transform={`translate(${9 + i * 5.5 + Math.sin(p * 6) * 1.2} ${84 - p * 14}) scale(${0.9 + i * 0.25})`} opacity={1 - p * p} />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 13)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Background t={t} />
        <Bubble t={t} />
        <Cat t={t} />
        <Child t={t} />
        <Chips t={t} />
        <Hearts t={t} />
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
    { at: 0, label: 'ねこが 子どもを まっている', sound: 'pop' },
    { at: POP, label: '子どもが ひょっこり。はずかしくて もじもじ' },
    { at: BRAVE, label: 'えいっと 口を あける', sound: 'pop' },
    { at: TALK, label: 'ぺらぺら しゃべる(した が うごく)' },
    { at: BUBBLE, label: 'ことばが ふきだしに かきこまれる' },
    { at: HAPPY, label: 'ねこが にこにこ。ことばが つたわった', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '話 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
