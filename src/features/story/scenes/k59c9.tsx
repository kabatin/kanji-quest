/*
 * 姉(あね): 女の子(おねえさん)が、ないている おとうとを つれて 市(いち)へ。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … おねえさんの あたまの てっぺんの はねた かみ から、からだ を通って、すそ のほうへ
 *   2画目(ノ)  … からだ の ななめの 線(女の 左がわ)
 *   3画目(一)  … 「ほら、市(いち)だよ」と まえへ のばした うで(おとうとの あたまの 上を とおる)
 *   4画目(丨)  … 市の 屋根の てっぺんに たつ はた の さお
 *   5画目(一)  … 市の 屋根(ひさし)
 *   6画目(丨)  … 市の ぬのの 左の はしら
 *   7画目(𠃍)  … 市の ぶらさがった ぬの(巾)の ふち
 *   8画目(丨)  … 市の まんなかの 大きな はしら
 *
 * ながれ
 *   市(みせ)が できる → おなかが すいて ないている おとうとの 手を ひいて、おねえさんが こまった顔で あるいてくる
 *   → 市の りんごに 気づいて「そうだ!」(おもいついた ほし)→ 「ほら、市だよ」と うでを のばして おしえる
 *   → おとうとは なきやんで、よろこんで ぴょんぴょん
 *   → ほね が ひかって、絵が うすくなり、字「姉」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。手を つなぐときは、ひじ を まげて 手を とどかせる。
 *   くび は みじかく、どう の まんなか の上。おとうとは おねえさんより 小さく、頭が 大きめ。
 *   字の形になるのは、おねえさんが うでを のばした さいごの しゅんかん だけ。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '姉'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const DROP = '#7cc4f2'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const AWNING = '#e8534a'
const AWNING_LIGHT = '#fff4e6'
const CLOTH = '#fff1c9'
const CLOTH_SHADE = '#f1dca0'
const FLAG = '#f07f9e'
const APPLE = '#e8534a'
const APPLE_DARK = '#c93e3a'
const CRATE = '#c98a4d'
const CRATE_DARK = '#a86e38'

type Look = {
  readonly hair: string
  readonly top: string
  readonly topDark: string
  readonly topFar: string
  readonly bottom: string
  readonly bottomDark: string
  readonly shoe: string
}
const SISTER_LOOK: Look = { hair: '#5a3b2a', top: '#ef7d9a', topDark: '#d9628a', topFar: '#c4527a', bottom: '#ef7d9a', bottomDark: '#d9628a', shoe: '#8a4a3a' }
const BROTHER_LOOK: Look = { hair: '#3b2a20', top: '#f2a23a', topDark: '#d98a22', topFar: '#c47a1c', bottom: '#3e5c86', bottomDark: '#34507a', shoe: '#6b4a36' }

/** くぎり の時間(秒) */
const WALK = 0.9
/** 市の まえに ついて とまる */
const ARRIVE = 2.7
/** りんごに 気づく(おもいつく) */
const NOTICE = 3.0
/** うでを のばして、市を おしえる */
const POINT = 3.5
/** おとうとが なきやんで、よろこぶ */
const CHEER = 4.5
const INK = 6.3
const DONE = 9.3
const DURATION = 10

/** おねえさんの 足もと(さいごに 立つ場所) */
const SISTER_X = 27.5
const FEET_Y = 94
/** おとうとは、おねえさんの 右がわ(市のほう)を あるく */
const GAP = 17
const BROTHER_SCALE = 0.62
/** 手を つなぐ高さ と、おねえさんの手の よこの いち(おねえさんから みて) */
const HOLD_Y = 62
const HOLD_DX = 10.5
/** うでを のばした 手さきの いち(3画目の おわり あたり。かた から まっすぐ まえへ) */
const POINT_DX = 25
const POINT_Y = 41

type Pt = readonly [number, number]
type Mood = 'worried' | 'idea' | 'happy' | 'cry'

const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/** 体(足もとが 0,0)で の かた の いち と、うでの 1ぶし の長さ(のびると、かた から 手まで 2ぶし) */
const SHOULDER: Pt = [0, -54]
const ARM_PART = 12.5
const NECK: Pt = [0.5, -59]

/**
 * かた から 手まで の 2ぶし(かた→ひじ→手)。手が とどかないときは まっすぐ のばす。
 * ひじは 下がわ(うしろ)に まがる。
 */
function twoBone(hand: Pt): { readonly elbow: Pt; readonly end: Pt } {
  const dx = hand[0] - SHOULDER[0]
  const dy = hand[1] - SHOULDER[1]
  const dist = Math.hypot(dx, dy) || 0.001
  const reach = Math.min(dist, ARM_PART * 2 * 0.995)
  const ux = dx / dist
  const uy = dy / dist
  const bend = Math.sqrt(Math.max(0, ARM_PART ** 2 - (reach / 2) ** 2))
  // ひじの むき: 下がわ
  const sign = ux >= 0 ? 1 : -1
  const px = -uy * sign
  const py = ux * sign
  const down = py >= 0 ? 1 : -1
  return {
    elbow: [SHOULDER[0] + (ux * reach) / 2 + px * down * bend, SHOULDER[1] + (uy * reach) / 2 + py * down * bend],
    end: [SHOULDER[0] + ux * reach, SHOULDER[1] + uy * reach],
  }
}

function Arm({ hand, color }: { readonly hand: Pt; readonly color: string }) {
  const { elbow, end } = twoBone(hand)
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${end[0]} ${end[1]}`} fill="none" stroke={color} strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={end[0]} cy={end[1]} r="3.1" fill={SKIN} />
    </>
  )
}

/** あたまの 中の 顔。体は 右むき(目は 右がわ に よる)。 */
function Face({ mood }: { readonly mood: Mood }) {
  const brow = { fill: 'none', stroke: '#5a3b2a', strokeWidth: 1, strokeLinecap: 'round' as const }
  return (
    <>
      <circle cx="2.4" cy="-65.4" r="1.8" fill={CHEEK} opacity="0.5" />
      <circle cx="10.2" cy="-65.4" r="1.8" fill={CHEEK} opacity="0.5" />
      {mood === 'worried' && (
        <>
          <circle cx="3.8" cy="-69.2" r="1.15" fill={EYE} />
          <circle cx="9" cy="-69.2" r="1.15" fill={EYE} />
          <path d="M2 -72.2 L5.4 -73.8 M7.4 -73.8 L10.8 -72.2" {...brow} />
          <path d="M5.4 -62.6 Q6.9 -64.2 8.4 -62.6" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'idea' && (
        <>
          <circle cx="3.8" cy="-69.2" r="1.6" fill={EYE} />
          <circle cx="9" cy="-69.2" r="1.6" fill={EYE} />
          <circle cx="4.3" cy="-69.8" r="0.5" fill="#ffffff" />
          <circle cx="9.5" cy="-69.8" r="0.5" fill="#ffffff" />
          <path d="M2.4 -72.8 Q3.8 -74.2 5.2 -72.8 M7.8 -72.8 Q9.2 -74.2 10.6 -72.8" {...brow} />
          <ellipse cx="6.9" cy="-62.8" rx="1" ry="1.3" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M2.6 -68.6 Q3.8 -70.8 5 -68.6 M7.8 -68.6 Q9 -70.8 10.2 -68.6" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M4.8 -63.6 Q6.9 -60.4 9 -63.6 Z" fill={MOUTH} stroke={MOUTH} strokeWidth="0.6" strokeLinejoin="round" />
        </>
      )}
      {mood === 'cry' && (
        <>
          <path d="M2.4 -70.6 L5 -69.4 L2.4 -68.2 M10.4 -70.6 L7.8 -69.4 L10.4 -68.2" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx="6.9" cy="-62.4" rx="2.1" ry="1.7" fill={MOUTH} />
          <ellipse cx="6.9" cy="-61.7" rx="1.2" ry="0.7" fill="#ff8a8a" />
        </>
      )}
    </>
  )
}

/** ないている とき、ほっぺを つたって おちる なみだ(あたまの 中の 座標) */
function Tears({ t }: { readonly t: number }) {
  return (
    <>
      {[
        [3.4, 0],
        [10, 0.35],
        [3.2, 0.7],
        [10.2, 1.05],
      ].map(([x, offset]) => {
        const p = ((t + offset) % 1.4) / 1.4
        return <ellipse key={`${x}-${offset}`} cx={x} cy={-67.6 + p * 9} rx="0.9" ry="1.4" fill={DROP} opacity={1 - p} />
      })}
    </>
  )
}

type KidProps = {
  readonly who: 'sister' | 'brother'
  readonly mood: Mood
  /** あしの ふり(-1〜1) */
  readonly step: number
  /** てまえの うで・むこうの うで の 手の いち(体の 座標) */
  readonly nearHand: Pt
  readonly farHand: Pt
  readonly tilt: number
  readonly t: number
}

/** 足もと が (0, 0) の 子ども。おねえさんも おとうとも これで 描く(おとうとは ちいさく して、あたまを 大きく) */
function Kid({ who, mood, step, nearHand, farHand, tilt, t }: KidProps) {
  const look = who === 'sister' ? SISTER_LOOK : BROTHER_LOOK
  const headScale = who === 'sister' ? 1 : 1.2
  return (
    <>
      <Arm hand={farHand} color={look.topFar} />
      {/* あし: むこう・てまえ。こし(y = -26)を じく に ふる */}
      <Layer rotate={step * 17} origin={[2.6, -26]}>
        <rect x="0.2" y="-24" width="5" height="21.5" rx="2.5" fill={SKIN_SHADE} />
        <ellipse cx="3.4" cy="-2.4" rx="4.6" ry="2.6" fill={look.shoe} />
      </Layer>
      <Layer rotate={-step * 17} origin={[-2.6, -26]}>
        <rect x="-5.2" y="-24" width="5" height="21.5" rx="2.5" fill={SKIN} />
        <ellipse cx="-1.8" cy="-2.4" rx="4.6" ry="2.6" fill={look.shoe} />
      </Layer>
      {/* くび: どう と あたま の間を みじかく つなぐ */}
      <rect x="-2" y="-62" width="5" height="8" rx="2.2" fill={SKIN_SHADE} />
      {/* どう */}
      <rect x="-7" y="-58" width="14" height="28" rx="6.5" fill={look.top} />
      {who === 'sister' ? (
        <>
          {/* ワンピースの すそ: ふわっと ひろがる */}
          <path d="M-7.5 -36 L7.5 -36 Q12.8 -26 11.6 -20.5 Q0 -18.6 -11.6 -20.5 Q-12.8 -26 -7.5 -36 Z" fill={look.bottom} />
          <path d="M-9.6 -26 Q0 -23.6 9.6 -26" fill="none" stroke={look.bottomDark} strokeWidth="1.2" strokeLinecap="round" />
        </>
      ) : (
        <>
          {/* ズボン */}
          <path d="M-7.4 -33 L7.4 -33 L8.6 -21 Q0 -19.6 -8.6 -21 Z" fill={look.bottom} />
          <path d="M0 -32 L0 -22" stroke={look.bottomDark} strokeWidth="1" strokeLinecap="round" />
        </>
      )}
      <path d="M-5 -49 h10" stroke={look.topDark} strokeWidth="1.4" strokeLinecap="round" />
      {/* てまえの うで */}
      <Arm hand={nearHand} color={look.topDark} />
      {/* あたま */}
      <Layer rotate={tilt} scale={headScale} origin={NECK}>
        {who === 'sister' && (
          <>
            <circle cx="-9.4" cy="-63.6" r="3.8" fill={look.hair} />
            <circle cx="-8" cy="-67.8" r="1.9" fill="#e8534a" />
          </>
        )}
        <circle cx="-1.4" cy="-70.4" r="9.8" fill={look.hair} />
        <circle cx="1.6" cy="-68.8" r="8.6" fill={SKIN} />
        <path d="M-6.8 -69 C-7.4 -79.4 8.4 -81 10.1 -71.6 C7 -74.4 1 -74.8 -3 -72.6 C-4.6 -71.6 -5.9 -70.2 -6.8 -69 Z" fill={look.hair} />
        <Face mood={mood} />
        {mood === 'cry' && <Tears t={t} />}
        {/* 1画目の 書きはじめ: ぴょこんと はねた かみ */}
        <path d="M0 -77.6 Q-1 -81.6 1.8 -80.2" fill="none" stroke={look.hair} strokeWidth="1.9" strokeLinecap="round" />
      </Layer>
    </>
  )
}

/* ───────── まわり ───────── */

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
      {/* とおくの おか と、ゆっくり ながれる 雲 */}
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="-4" cy="46" rx="7" ry="3.4" />
        <ellipse cx="1" cy="44" rx="5" ry="3.4" />
        <ellipse cx="94" cy="8" rx="6" ry="2.8" />
        <ellipse cx="98.5" cy="6.4" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 46, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** りんごを つんだ 木の はこ。x = 左はし */
function Crate({ x, apples }: { readonly x: number; readonly apples: readonly number[] }) {
  return (
    <>
      <rect x={x} y="80" width="14.5" height="13" rx="1.8" fill={CRATE} />
      <path d={`M${x + 0.8} 86.4 h12.9`} stroke={CRATE_DARK} strokeWidth="1" strokeLinecap="round" />
      {apples.map((dx, i) => (
        <g key={dx}>
          <circle cx={x + dx} cy={79 - (i % 2) * 1.4} r="3.4" fill={APPLE} />
          <circle cx={x + dx - 1} cy={78 - (i % 2) * 1.4} r="1" fill="#ff9b8e" />
          <path d={`M${x + dx} ${75.6 - (i % 2) * 1.4} l0.6 -1.6`} stroke={BARK_DARK} strokeWidth="0.7" strokeLinecap="round" />
        </g>
      ))}
    </>
  )
}

/** 市の みせ。ほね(4〜8画)を そのまま みせの はしら・やね・ぬの にする。 */
function Stall({ t }: SceneProps) {
  const pole = span(t, 0, 0.5, backOut)
  const awning = span(t, 0.25, 0.8, backOut)
  const cloth = span(t, 0.5, 1.0, backOut)
  const flag = span(t, 0.8, 1.2, backOut)
  const goods = span(t, 1.0, 1.5, backOut)
  const flutter = wave(t, 0.9) * 1.2
  return (
    <>
      <ellipse cx="72" cy="97.6" rx={24 * pole} ry="2.8" fill="#000000" opacity="0.1" />
      {/* 大きな はしら(8画目) */}
      <Layer scaleY={pole} origin={[72, 96]}>
        <Bone char={CHAR} n={8} color={BARK} width={3.8} />
      </Layer>
      {/* ぬの(巾): ふち(7画目)と 左の はしら(6画目) */}
      <Layer scaleY={cloth} origin={[73, 44]}>
        <path d="M55.5 47.9 L88 43.5 Q92.5 43.5 92.5 48 L92 68 Q91.4 72 85.8 71.4 Q70 73.6 55.5 71.4 Z" fill={CLOTH} />
        <path d="M58 66 Q72 69 90 66.4 L89.6 69.6 Q72 72.4 58 69.4 Z" fill={CLOTH_SHADE} />
        <Bone char={CHAR} n={7} color={BARK_DARK} width={2.2} />
        <Bone char={CHAR} n={6} color={BARK_DARK} width={2.6} />
        {/* ぬのに えがいた りんご(はしら の 左がわ) */}
        <circle cx="63.4" cy="58" r="5" fill={APPLE} />
        <circle cx="61.8" cy="56.4" r="1.4" fill="#ff9b8e" />
        <path d="M63.4 53.2 q0.4 -2.2 2.2 -2.8" fill="none" stroke={LEAF} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="81.4" cy="58" r="5" fill={APPLE_DARK} />
        <circle cx="79.8" cy="56.4" r="1.4" fill="#ff9b8e" />
        <path d="M81.4 53.2 q0.4 -2.2 2.2 -2.8" fill="none" stroke={LEAF} strokeWidth="1.5" strokeLinecap="round" />
      </Layer>
      {/* やね(5画目): しましま */}
      <Layer scale={awning} origin={[72, 27]}>
        <Bone char={CHAR} n={5} color={AWNING} width={6.8} />
        {[50, 59, 68, 77, 86].map((x) => (
          <path key={x} d={`M${x} ${29.8 - (x - 44.5) * 0.06 - 3.2} l3.6 -0.2 l0 6.2 l-3.6 0.2 Z`} fill={AWNING_LIGHT} />
        ))}
      </Layer>
      {/* てっぺんの はた(4画目が さお) */}
      <Layer scale={flag} origin={[70, 26]}>
        <Bone char={CHAR} n={4} color={BARK} width={1.8} />
        <path d={`M70.8 13.8 Q${76 + flutter} 12 ${82 + flutter * 1.4} 15.6 Q${76 + flutter} 18 70.8 20.6 Z`} fill={FLAG} />
      </Layer>
      {/* りんごの はこ(はしらを はさんで 左と右) */}
      <Layer scale={goods} origin={[72, 93]}>
        <Crate x={54.6} apples={[4, 10]} />
        <Crate x={75.4} apples={[4, 10.4]} />
      </Layer>
    </>
  )
}

/** りんごの きらきら(おねえさんが 気づく もと) */
function Glints({ t }: SceneProps) {
  const show = during(t, ARRIVE - 0.4, INK, 0.4)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      <Star cx={63} cy={73.6} r={2.6 + wave(t, 0.8) * 0.8} color="#ffffff" spin={t * 40} />
      <Star cx={86} cy={74} r={2.2 + wave(t, 0.8, 0.4) * 0.7} color="#fff4a8" spin={-t * 40} />
    </g>
  )
}

/** おもいついた! の ほし(おねえさんの あたまの 上) */
function IdeaStar({ t, x }: { readonly t: number; readonly x: number }) {
  const show = during(t, NOTICE, POINT + 0.4, 0.2)
  if (show <= 0) return null
  const pop = span(t, NOTICE, NOTICE + 0.3, backOut)
  return (
    <g opacity={show}>
      <Star cx={x + 10} cy={9 - wave(t, 0.6) * 0.6} r={5.2 * pop} color="#ffd24a" spin={0} />
      <Star cx={x + 17} cy={13} r={2.4 * pop} color="#ffb703" spin={0} />
      <Star cx={x + 2} cy={7} r={2 * pop} color="#ffb703" spin={0} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)

  // あるく: 左から 市の まえまで。足を ふって、ちかくで とまる
  const walking = 1 - span(t, ARRIVE - 0.25, ARRIVE)
  const stride = t < WALK ? 0 : Math.sin((t - WALK) * Math.PI * 2 * 1.7) * walking
  const walkX = mix(t, WALK, ARRIVE, -52, 0, easeOut)
  const sisterX = SISTER_X + walkX
  const brotherX = sisterX + GAP
  const feet: Pt = [sisterX, FEET_Y]

  // おねえさん: こまった顔 → 気づく → うれしい
  const sisterMood: Mood = t < NOTICE ? 'worried' : t < POINT + 0.5 ? 'idea' : 'happy'
  // おとうと: ないている → よろこぶ
  const brotherMood: Mood = t < CHEER ? 'cry' : 'happy'

  // おねえさんの うで: 手を つなぐ → まっすぐ まえへ のばして、市を おしえる
  const holdWorld: Pt = [sisterX + HOLD_DX, HOLD_Y]
  const pointWorld: Pt = [sisterX + POINT_DX, POINT_Y + wave(t, 1.1) * 0.5 * span(t, POINT + 0.8, POINT + 1.2)]
  const reachWorld = lerpPt(holdWorld, pointWorld, span(t, POINT, POINT + 0.8, easeInOut))
  const sisterNear: Pt = [reachWorld[0] - feet[0], reachWorld[1] - feet[1]]
  const sisterFar: Pt = [1 - stride * 7, -31]
  // あたま: おとうとを 見る → 市を見る
  const sisterTilt = t < NOTICE ? 9 : mix(t, NOTICE, NOTICE + 0.3, 9, -5)

  // おとうと: ぴょんぴょん
  const hopAmp = span(t, CHEER + 0.2, CHEER + 0.5)
  const hop = Math.abs(wave(t - CHEER, 1.0)) * 2.8 * hopAmp
  const brotherHold: Pt = [(holdWorld[0] - brotherX) / BROTHER_SCALE, (HOLD_Y - FEET_Y) / BROTHER_SCALE]
  const brotherHang: Pt = [2, -31]
  const cheerNear: Pt = [17, (56 - FEET_Y) / BROTHER_SCALE]
  const cheerFar: Pt = [-14, (58 - FEET_Y) / BROTHER_SCALE]
  const release = span(t, POINT, POINT + 0.7)
  const cheer = span(t, CHEER, CHEER + 0.4, backOut)
  const brotherNear = lerpPt(lerpPt(brotherHold, brotherHang, release), cheerNear, cheer)
  const brotherFar = lerpPt([2 - stride * 9, -31], cheerFar, cheer)
  // あたま: ないて のけぞる → 市を見あげる
  const brotherTilt = t < POINT + 0.4 ? -7 : mix(t, POINT + 0.4, POINT + 0.8, -7, 3)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Stall t={t} />
        <Glints t={t} />
        {/* おとうと */}
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <ellipse cx={brotherX} cy="97.4" rx="6" ry="1.8" fill="#000000" opacity="0.12" />
          <Layer x={brotherX} y={FEET_Y - hop} scale={BROTHER_SCALE}>
            <Kid who="brother" mood={brotherMood} step={-stride} nearHand={brotherNear} farHand={brotherFar} tilt={brotherTilt} t={t} />
          </Layer>
          {/* おねえさん */}
          <ellipse cx={sisterX} cy="97.4" rx="10" ry="2.4" fill="#000000" opacity="0.12" />
          <Layer x={sisterX} y={FEET_Y}>
            <Kid who="sister" mood={sisterMood} step={stride} nearHand={sisterNear} farHand={sisterFar} tilt={sisterTilt} t={t} />
          </Layer>
          <IdeaStar t={t} x={sisterX} />
        </Layer>
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
    { at: 0, label: '市(いち)の みせが できる', sound: 'pop' },
    { at: WALK, label: 'ないている おとうとの 手を ひいて、おねえさんが こまった顔で あるいてくる' },
    { at: NOTICE, label: '市の りんごに 気づいて「そうだ!」', sound: 'pop' },
    { at: POINT, label: 'うでを のばして「ほら、市だよ」と おしえる' },
    { at: CHEER, label: 'おとうとは なきやんで ぴょんぴょん', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '姉 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
