/*
 * 魚(さかな): おなかを すかせた さかなが、とんぼを みつけて、いきおいよく とびあがる。
 *
 * ほね(画と絵の対応)
 *   1・2画目   … さかなの あたま(上が あたま)。さいごに まっすぐ 上を むいたとき、頭の かたち になる
 *   3〜7画目   … さかなの どう。うろこ が ならんだ「田」の ところ(まんなかが うろこ)
 *   8〜11画目  … 下に ひろがった おびれ。4本の すじ が おびれの ほね(したが おびれ)
 *
 * ながれ
 *   池を、おなかを すかせた さかなが しょんぼり およぐ(目が とろんと して、口は への字)
 *   → 空に とんぼが とんでくる。さかなは「あっ!」と 気づいて、目が まんまるに なる
 *   → とんぼの 下へ すいすい およいでいき、あたまを 上へ むける
 *   → ざばっと みずを けって とびあがる(カメラも 上を むいて、池が 下へ さがる)
 *   → いちばん 高いところで ぱくっ! とんぼを つかまえて にっこり
 *   → ほね が ひかって、絵が うすくなり、字「魚」が のこる
 *
 * さかなは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   よこ向きに かいた さかな(あたまが 左・せなかが 上)を、とびあがるときに 1回 まわして 上向きにする。
 *   せびれ は せなか、はらびれ は おなか、むなびれ は えら のうしろ、おびれ は 体の うしろ。
 *   えら の線・目・くち は あたまに、うろこ は どう に ならべる。
 *   とびあがると ちかくに くるので、少し 大きくなる(はじめは 池の中で 小さめ)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '魚'

const SKY = '#eaf6fd'
const SUN = '#ffd24a'
const HILL = '#e2f2d2'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const STEM = '#4c8f52'
const WATER = '#7cc4f2'
const WATER_DEEP = '#5aaee8'
const SAND = '#f1dfae'
const PEBBLE = '#d4c08a'
const BODY = '#ff9b4a'
const BODY_LIGHT = '#ffb877'
const BELLY = '#ffe3bd'
const FIN = '#f27d35'
const FIN_DARK = '#d9651f'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const TONGUE = '#ff8a8a'
const CHEEK = '#ff9d9d'
const BUG = '#e8534a'

/** くぎり の時間(秒) */
const SWIM = 0.7
/** とんぼに 気づく */
const NOTICE = 3.0
/** とんぼの 下へ およぎ、あたまを 上へ むける */
const TURN = 3.4
/** みずを けって とびあがる */
const LEAP = 4.5
/** いちばん 高いところ(字の形と そろう) */
const TOP = 5.4
/** ぱくっ! */
const CATCH = 5.55
const INK = 6.3
const DONE = 9.7
const DURATION = 10.4

/** 池の みずめん(世界の座標)と、カメラが 上を むいて さがる 量 */
const SURF = 48
const PAN = 48

/** さかなの まんなか(よこ向きの絵の じく)。とびあがった とき、字の まんなか に のる */
const FISH_C: readonly [number, number] = [54.5, 54]
/** おびれの つけね(ここを じく に ふる) */
const TAIL_ROOT: readonly [number, number] = [78, 54]

/* ───────── まわりの景色 ───────── */

/** みずめん の なみ。ほんの 少し ゆれる 線 */
function surfacePath(t: number): string {
  const points = Array.from({ length: 34 }, (_, i) => {
    const x = -10 + i * 4
    return `${x} ${(SURF + Math.sin((x + t * 9) / 6) * 0.7).toFixed(2)}`
  })
  return `M${points.join(' L')}`
}

function Sky({ t, pan }: SceneProps & { readonly pan: number }) {
  const appear = span(t, 0, 0.6, easeOut)
  return (
    <>
      {/* お日さまと 雲は とおい ので、カメラが うごいても あまり うごかない */}
      <Layer y={pan * 0.1} opacity={appear}>
        <Layer rotate={t * 14} origin={[94, 14]}>
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x="93.2" y="2.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 94 14)`} />
          ))}
        </Layer>
        <circle cx="94" cy="14" r="6.2" fill={SUN} />
        <g fill="#ffffff" transform={`translate(${t * 1.4} 0)`}>
          <ellipse cx="14" cy="14" rx="8" ry="3.6" />
          <ellipse cx="19" cy="11.6" rx="5.4" ry="3.6" />
        </g>
      </Layer>
      {/* とおくの おか(カメラが うごくと、少しだけ ついてくる) */}
      <Layer y={pan * 0.35}>
        <path d="M-4 48 Q16 30 40 41 Q68 24 113 44 V140 H-4 Z" fill={HILL} />
      </Layer>
    </>
  )
}

/** 池の そこ: すな・小石・みずくさ・あわ */
function PondFloor({ t }: SceneProps) {
  return (
    <>
      <path d="M-4 100 Q30 94 60 97 Q90 94 113 98 V160 H-4 Z" fill={SAND} />
      <ellipse cx="22" cy="98.4" rx="3.2" ry="1.7" fill={PEBBLE} />
      <ellipse cx="76" cy="99.4" rx="2.6" ry="1.4" fill={PEBBLE} />
      <ellipse cx="98" cy="98.6" rx="3" ry="1.6" fill={PEBBLE} />
      {[10, 101].map((x, i) => {
        const sway = wave(t, 2.6, i * 0.9) * 3
        return (
          <g key={x} fill="none" stroke={STEM} strokeWidth="2.6" strokeLinecap="round">
            <path d={`M${x} 99 Q${x + sway} 88 ${x + sway * 1.6} 76`} />
            <path d={`M${x + 4} 99 Q${x + 4 - sway} 90 ${x + 4 - sway * 1.4} 80`} stroke={LEAF_DARK} />
          </g>
        )
      })}
      {[0, 0.33, 0.66].map((offset, i) => {
        const p = (t * 0.3 + offset) % 1
        const y = 94 - p * 40
        if (y < SURF + 3) return null
        return <circle key={offset} cx={30 + i * 22 + Math.sin(p * 9 + i) * 1.6} cy={y} r={0.9 + i * 0.35} fill="none" stroke="#ffffff" strokeWidth="0.6" opacity="0.8" />
      })}
    </>
  )
}

/** みずの うしろ側 の いろ(さかな の うしろに なる) */
function WaterBack({ t }: SceneProps) {
  return <path d={`${surfacePath(t)} L120 160 L-10 160 Z`} fill={WATER} />
}

/** さかなの 手前に かぶせる みず。みずに つかっている ところ だけ、青く すけて 見える */
function WaterFront({ t }: SceneProps) {
  return (
    <>
      <path d={`${surfacePath(t)} L120 160 L-10 160 Z`} fill={WATER_DEEP} opacity="0.2" />
      <path d={surfacePath(t)} fill="none" stroke="#ffffff" strokeWidth="0.9" opacity="0.75" />
    </>
  )
}

/** みずめんの ハスの葉 */
function LilyPad({ t }: SceneProps) {
  const bob = Math.sin(t * 1.6) * 0.3
  return (
    <g transform={`translate(0 ${bob})`}>
      <ellipse cx="90" cy={SURF + 0.8} rx="9.5" ry="2.4" fill={LEAF} />
      <path d={`M90 ${SURF + 0.8} L97 ${SURF - 0.2} L97 ${SURF + 1.6} Z`} fill={WATER} opacity="0.9" />
      <ellipse cx="88" cy={SURF + 0.3} rx="5" ry="1.1" fill="#8bd69a" />
      <path d={`M99 ${SURF + 0.4} q1 -4 3 -5 q0.6 3 -0.4 5.4 Z`} fill="#f4a3c0" />
    </g>
  )
}

/** みずを けったときの しぶき と なみ(みずめんの 高さ) */
function Splash({ t }: SceneProps) {
  const start = LEAP + 0.35
  return (
    <>
      {[0, 0.28].map((delay) => {
        const s = span(t, start + delay, start + delay + 1.0)
        if (s <= 0 || s >= 1) return null
        return <ellipse key={delay} cx={FISH_C[0]} cy={SURF + 0.6} rx={4 + s * 24} ry={0.8 + s * 2.8} fill="none" stroke="#ffffff" strokeWidth="1" opacity={(1 - s) * 0.9} />
      })}
      {Array.from({ length: 8 }, (_, i) => {
        const s = t - start - i * 0.02
        if (s < 0 || s > 1.05) return null
        const vx = (i - 3.5) * 7
        const vy = -34 - (i % 3) * 6
        const x = FISH_C[0] + vx * s
        const y = SURF + vy * s + 35 * s * s
        const r = 1.5 + (i % 2) * 0.5
        return <path key={i} d={`M0 ${-r * 1.5} Q${r} 0 0 ${r} Q${-r} 0 0 ${-r * 1.5} Z`} fill={WATER} stroke="#ffffff" strokeWidth="0.4" opacity={Math.max(0, 1 - s)} transform={`translate(${x} ${y})`} />
      })}
    </>
  )
}

/* ───────── さかな ───────── */

type Mood = 'hungry' | 'excited' | 'happy'

type FishProps = {
  readonly mood: Mood
  /** くちの あき具合(0〜1) */
  readonly mouth: number
  /** 目が 見ている むき(さかなの 体からの むき) */
  readonly look: readonly [number, number]
  /** おびれの ふり(度) */
  readonly wag: number
}

/** うろこ の ならび(どう の ところ)。体の ふちを はみ出さない ものだけ */
const SCALES: readonly (readonly [number, number])[] = Array.from({ length: 5 }, (_, row) =>
  Array.from({ length: 4 }, (_, col) => [41 + col * 8 + (row % 2) * 4, 36 + row * 8] as const),
)
  .flat()
  .filter(([x, y]) => {
    const half = 27 * Math.sqrt(Math.max(0, 1 - ((x - 46) / 33) ** 2))
    return Math.abs(y - 54) < half * 0.82
  })

/** さかな(よこ向き: あたまが 左、せなかが 上)。体は 池の みずに 合わせた ふっくら した かたち */
function Fish({ mood, mouth, look, wag }: FishProps) {
  const eye: readonly [number, number] = [24, 46]
  const wide = mood === 'excited'
  return (
    <>
      {/* せびれ・はらびれ(体の うしろに かくれる) */}
      <path d="M32 32 Q40 14 58 18 Q66 30 72 42 Z" fill={FIN} />
      <path d="M38 76 Q44 92 60 86 Q62 78 64 70 Z" fill={FIN} />
      {/* おびれ: つけね を じくに ふる。4本の すじ が ほね */}
      <Layer rotate={wag} origin={TAIL_ROOT}>
        <path d="M76 52 Q84 40 96 24 Q101 54 96 84 Q84 68 76 56 Z" fill={FIN} />
        <path d="M79 54 L95 30 M79 54 L97.5 44 M79 54 L97.5 64 M79 54 L95 78" fill="none" stroke={FIN_DARK} strokeWidth="1.2" strokeLinecap="round" />
      </Layer>
      {/* どう と あたま(ひとつながりの かたち。うしろへ ほそく なって おびれに つながる) */}
      <path d="M14 54 C14 40 28 27 48 27 C62 27 72 40 80 51 L80 57 C72 68 62 81 48 81 C28 81 14 68 14 54 Z" fill={BODY} />
      <path d="M18 62 C26 76 40 80 50 80 C62 80 70 70 78 58 C66 68 40 70 18 62 Z" fill={BELLY} />
      <path d="M26 40 C34 30 52 28 66 38 C52 34 38 35 26 44 Z" fill={BODY_LIGHT} />
      {/* うろこ(「田」の ところ) */}
      <g fill="none" stroke={FIN_DARK} strokeWidth="1" strokeLinecap="round" opacity="0.75">
        {SCALES.map(([x, y]) => (
          <path key={`${x}-${y}`} d={`M${x} ${y - 3.6} A3.6 3.6 0 0 1 ${x} ${y + 3.6}`} />
        ))}
      </g>
      {/* えら の線 と むなびれ */}
      <path d="M31 41 Q27 54 31 67" fill="none" stroke={FIN_DARK} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M38 58 Q46 60 52 70 Q42 70 36 62 Z" fill={FIN} />
      {/* かお */}
      {mood === 'happy' ? (
        <>
          <path d={`M${eye[0] - 4.2} ${eye[1] + 1} Q${eye[0]} ${eye[1] - 4.4} ${eye[0] + 4.2} ${eye[1] + 1}`} fill="none" stroke={EYE} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="21.5" cy="58" r="2.8" fill={CHEEK} opacity="0.65" />
        </>
      ) : (
        <>
          <circle cx={eye[0]} cy={eye[1]} r={wide ? 5.1 : 4.6} fill="#ffffff" />
          <circle cx={eye[0] + look[0] * 1.5} cy={eye[1] + look[1] * 1.5} r={wide ? 2.9 : 2.5} fill={EYE} />
          <circle cx={eye[0] + look[0] * 1.5 - 0.8} cy={eye[1] + look[1] * 1.5 - 0.9} r="0.8" fill="#ffffff" />
          {/* はらぺこの ときは、まぶた が おりて とろんと する */}
          {mood === 'hungry' && <path d={`M${eye[0] - 4.8} ${eye[1] - 0.6} A4.8 4.8 0 0 1 ${eye[0] + 4.8} ${eye[1] - 0.6} Z`} fill={BODY} stroke={FIN_DARK} strokeWidth="0.8" />}
          {wide && <circle cx="21.5" cy="58" r="2.4" fill={CHEEK} opacity="0.5" />}
        </>
      )}
      {mouth > 0.05 ? (
        <>
          <ellipse cx="17.5" cy="55" rx={Math.max(0, 3.8 * mouth)} ry={Math.max(0, 4.4 * mouth)} fill={MOUTH} />
          <ellipse cx="18" cy="56.4" rx={Math.max(0, 2 * mouth)} ry={Math.max(0, 1.6 * mouth)} fill={TONGUE} />
        </>
      ) : mood === 'hungry' ? (
        <path d="M14.8 56.2 q3.2 -3 6.6 0" fill="none" stroke={MOUTH} strokeWidth="1.3" strokeLinecap="round" />
      ) : (
        <path d="M14.8 54.4 q3.4 3.6 7 0.4" fill="none" stroke={MOUTH} strokeWidth="1.3" strokeLinecap="round" />
      )}
    </>
  )
}

/** さかなの いち・むき・大きさ(世界の座標。t だけで きまる) */
function fishState(t: number) {
  const swimming = 1 - span(t, TURN, LEAP)
  const x = mix(t, SWIM, NOTICE, -34, 40, easeOut) + mix(t, TURN, LEAP, 0, FISH_C[0] - 40, easeInOut)
  const bob = wave(t, 1.3) * 1.2 * swimming
  const y = mix(t, TURN, LEAP, 76, 70, easeInOut) + bob + mix(t, LEAP, TOP, 0, FISH_C[1] - 70 - PAN, easeOut)
  // およいでいる間は、体が ゆらゆら する。とびあがる とき、まっすぐ 上むき(90度)に なる
  const rotate = mix(t, TURN, LEAP, 0, 68, easeInOut) + mix(t, LEAP, TOP, 0, 22, easeOut) + wave(t, 1.6) * 3.5 * swimming
  const scale = 0.62 + 0.38 * span(t, LEAP, TOP, easeOut)
  return { x, y, rotate, scale }
}

/* ───────── とんぼ ───────── */

/** とんぼ(画面の座標)。あたまが 左。はね を ぱたぱた させる */
function Dragonfly({ t }: SceneProps) {
  const arrive = span(t, 2.0, 2.9, easeOut)
  const gone = span(t, CATCH - 0.05, CATCH + 0.07)
  const size = 1.15 * (1 - gone)
  if (arrive <= 0 || size <= 0) return null
  // 右から とんできて、さかなの うえで ふわふわ。さいごは あたまの ま上へ ちかづく
  const drift = span(t, LEAP, CATCH - 0.1, easeInOut)
  const hover = 1 - drift
  const x = mix(t, 2.0, 2.9, 118, 72, easeOut) + (61 - 72) * drift + wave(t, 1.7) * 2 * hover
  const y = mix(t, 2.0, 2.9, 12, 22, easeOut) + (10.5 - 22) * drift + wave(t, 1.1, 0.3) * 1.5 * hover
  const flap = wave(t, 0.12)
  return (
    <Layer x={x} y={y} scale={size}>
      <Layer rotate={flap * 12} origin={[-3, 0]}>
        <ellipse cx="-0.5" cy="-1.9" rx="5.5" ry="1.5" fill="#ffffff" opacity="0.8" stroke="#9ec7e8" strokeWidth="0.3" transform="rotate(-8 -3 0)" />
        <ellipse cx="2.5" cy="-1.7" rx="5.5" ry="1.5" fill="#ffffff" opacity="0.7" stroke="#9ec7e8" strokeWidth="0.3" transform="rotate(6 -3 0)" />
      </Layer>
      <path d="M-2 0.2 L8.5 0.6" fill="none" stroke={BUG} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M1.5 -0.9 v2.2 M4 -0.9 v2.2 M6.5 -0.9 v2.2" stroke="#7a2a2a" strokeWidth="0.5" />
      <circle cx="-3" cy="0" r="1.9" fill={BUG} />
      <circle cx="-6.4" cy="0" r="2.1" fill="#2fa59a" />
      <circle cx="-7.2" cy="-0.6" r="0.55" fill={EYE} />
    </Layer>
  )
}

/** 気づいた しゅんかんの「!」 */
function Notice({ t, x, y }: SceneProps & { readonly x: number; readonly y: number }) {
  const show = during(t, NOTICE, NOTICE + 0.9, 0.12)
  if (show <= 0) return null
  const pop = Math.max(0, backOut(span(t, NOTICE, NOTICE + 0.25)))
  return (
    <Layer x={x} y={y} scale={pop} opacity={show}>
      <rect x="-1.4" y="-7.5" width="2.8" height="7.2" rx="1.4" fill={BUG} />
      <circle cx="0" cy="2.2" r="1.6" fill={BUG} />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 11)
  const fish = fishState(t)
  // カメラは さかなと 同じ いきおいで 上を むく(さかなが わく から 出ないように)
  const pan = mix(t, LEAP, TOP, 0, PAN, easeOut)

  const mood: Mood = t < NOTICE ? 'hungry' : t < CATCH + 0.15 ? 'excited' : 'happy'
  // くち: とびあがる間は 少し あいて、ぱくっ で ぜんぶ ひらき、すぐ とじる
  const mouth = t < LEAP ? 0 : Math.max(span(t, LEAP, LEAP + 0.3) * 0.25, span(t, CATCH - 0.5, CATCH - 0.15, easeOut)) * (1 - span(t, CATCH, CATCH + 0.15))
  // 目: はらぺこの ときは 下、気づいたら とんぼ(世界の 上)を 見る
  const rad = (fish.rotate * Math.PI) / 180
  const look: readonly [number, number] = mood === 'hungry' ? [0.3, 0.7] : [-Math.sin(rad), -Math.cos(rad)]
  const flick = mood === 'hungry' ? 7 : mood === 'excited' ? 16 : 5
  const wag = wave(t, mood === 'hungry' ? 1.1 : 0.5) * flick * (1 - span(t, CATCH + 0.3, INK))
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const pop = span(t, CATCH, CATCH + 0.4)

  return (
    <>
      <Layer opacity={ink.picture}>
        <rect x="-10" y="-80" width="130" height="260" fill={SKY} />
        <Sky t={t} pan={pan} />
        <Layer y={pan}>
          <WaterBack t={t} />
          <PondFloor t={t} />
          <Layer opacity={span(t, SWIM - 0.1, SWIM + 0.15)}>
            <Layer x={fish.x - FISH_C[0]} y={fish.y - FISH_C[1]} rotate={fish.rotate} scale={fish.scale} origin={FISH_C}>
              <Fish mood={mood} mouth={mouth} look={look} wag={wag} />
            </Layer>
          </Layer>
          <WaterFront t={t} />
          <LilyPad t={t} />
          <Splash t={t} />
          <Notice t={t} x={fish.x} y={fish.y - 26} />
        </Layer>
        <Dragonfly t={t} />
        {/* ぱくっ の あと、とんぼが きえた ところの きらり */}
        {pop > 0 && pop < 1 && (
          <g opacity={1 - pop}>
            <Star cx={54} cy={12} r={3.2 * (1 - pop * 0.5)} color="#ffd95a" spin={pop * 120} />
            <Star cx={47} cy={7} r={2} color="#ffffff" spin={pop * 90} />
            <Star cx={62} cy={8} r={2.2} color="#ffd95a" spin={pop * 100} />
          </g>
        )}
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
    { at: 0, label: '池の みずが あらわれる', sound: 'pop' },
    { at: SWIM, label: 'おなかを すかせた さかなが しょんぼり およぐ' },
    { at: NOTICE, label: 'とんぼに 気づく', sound: 'pop' },
    { at: TURN, label: 'とんぼの 下へ およいで、あたまを 上へ むける' },
    { at: LEAP, label: 'ざばっと とびあがる', sound: 'pop' },
    { at: CATCH, label: 'ぱくっ! にっこり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '魚 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
