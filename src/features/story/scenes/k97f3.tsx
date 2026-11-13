/*
 * 音(おと): 朝日が のぼる。立って 歌うと 音が ひびく。
 *
 * ほね(画と絵の対応)
 *   1画目(丶)  … 子どもの あたまの まんなか(かおの たて の ならび)
 *   2画目(一)  … りょうてを 左右に ひろげた うで(歌うときの すがた)
 *   3・4画目   … 子どもの 左右に ういている おんぷ(歌の おと)
 *   5画目(一)  … 子どもが 立っている とうの てっぺん(足もとの 長い だい)
 *   6〜9画目   … とうの まど。わく(6・7画目)と、まどの 中の 2本の さん(8・9画目)。まどの 中に 朝日が のぼる
 *
 * ながれ
 *   高い とうが 地面から のびて、てっぺんに 子どもが 立っている
 *   → 夜あけ前で さむくて、ねむそうに ぶるぶる
 *   → まどの むこうに 朝日が のぼって、空が あかるくなる
 *   → 子どもが 目をさまして びっくり → にっこり
 *   → りょうてを ひろげて 大きな 声で 歌う。おと の わ が ひろがり、おんぷが ふわふわ とぶ。小鳥も 聞きにくる
 *   → ほね が ひかって、絵が うすくなり、字「音」が のこる
 *
 * 人は、ほんものの つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。さむいときは だらんと下げ、歌うときに よこへ ひろげる。
 *   くび は みじかく、どう の まんなか の上。あし は こし から 2本。
 */
import { backOut, during, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '音'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#ef7f6b'
const TUNIC_DARK = '#d8664f'
const PANTS = '#4a5f8a'
const SHOE = '#6b4a36'
const CHEEK = '#ff9d9d'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const TONGUE = '#ff8a8a'
const STONE = '#ddc9a6'
const STONE_DARK = '#c7ae86'
const SLAB = '#b99a74'
const SLAB_LIGHT = '#cdb08a'
const WOOD = '#a07850'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const SUN = '#ffd24a'
const NOTE = '#f07f9e'
const WAVE_BLUE = '#5aaee8'

/** くぎり の時間(秒) */
const RISE = 0.8
const SUN_UP = 1.6
/** 目をさまして びっくり */
const NOTICE = 3.0
const SMILE = 3.55
/** うでを ひろげる・歌いはじめる */
const STAND = 3.6
const SING = 4.4
const BIRD = 4.9
const INK = 6.4
const DONE = 9.4
const DURATION = 10

/** とう(立っている だい)の かたち */
const SLAB_TOP = 47
const WALL = { x: 15, y: 52, w: 80, h: 46 } as const
/** まどの ガラス(わく の うちがわ) */
const GLASS = { x: 37.4, y: 60.3, w: 33.2, h: 34.7 } as const
/** 朝日の じく(まどの まんなか) */
const SUN_X = 54

/** 子ども: かた・うで の長さ。ほね2(両手を ひろげた線)に とどくように きめた */
const SHOULDER_L: readonly [number, number] = [48.2, 28]
const SHOULDER_R: readonly [number, number] = [60.8, 28]
const UPPER = 9.5
const FORE = 9.5
const NECK: readonly [number, number] = [54.5, 25]

function hex(color: string): readonly [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16)) as unknown as readonly [number, number, number]
}

/** 2つの色(#rrggbb)の あいだの色 */
function lerpColor(a: string, b: string, k: number): string {
  const [ar, ag, ab] = hex(a)
  const [br, bg, bb] = hex(b)
  const part = (x: number, y: number) =>
    Math.round(x + (y - x) * k)
      .toString(16)
      .padStart(2, '0')
  return `#${part(ar, br)}${part(ag, bg)}${part(ab, bb)}`
}

/** うえ→した に 色が かわる 空。グラデーションの id は 同じ画面に 何こも 出ると まざるので、よこ帯を 重ねて作る */
function Bands({ x, y, w, h, top, bottom }: { readonly x: number; readonly y: number; readonly w: number; readonly h: number; readonly top: string; readonly bottom: string }) {
  const count = 20
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <rect key={i} x={x} y={y + (h * i) / count} width={w} height={h / count + 0.4} fill={lerpColor(top, bottom, i / (count - 1))} />
      ))}
    </>
  )
}

function Sky({ t }: SceneProps) {
  const dawn = span(t, RISE, 4.4)
  const stars = Math.max(0, 1 - dawn * 1.5)
  const cloud = t * 1.2
  return (
    <>
      <Bands x={0} y={0} w={109} h={109} top={lerpColor('#3d4a86', '#a9dcf7', dawn)} bottom={lerpColor('#f58f5f', '#eaf7ff', dawn)} />
      {/* 夜あけの 星: あかるく なると きえる */}
      <g fill="#fff6c8" opacity={stars}>
        {[
          [10, 8, 1.1],
          [24, 18, 0.8],
          [92, 10, 1.1],
          [100, 22, 0.8],
          [78, 6, 0.8],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r * (0.8 + 0.2 * wave(t, 0.9, i * 0.3))} />
        ))}
      </g>
      {/* ゆっくり ながれる 雲(あかるく なってから) */}
      <g fill="#ffffff" opacity={0.9 * span(t, 2.4, 4)} transform={`translate(${cloud} 0)`}>
        <ellipse cx="6" cy="36" rx="7" ry="3" />
        <ellipse cx="11" cy="34.4" rx="5" ry="3.2" />
        <ellipse cx="94" cy="38" rx="6" ry="2.7" />
        <ellipse cx="98.6" cy="36.6" rx="4.4" ry="2.9" />
      </g>
    </>
  )
}

/** まどの むこう: 朝日が のぼる けしき */
function WindowView({ t }: SceneProps) {
  const dawn = span(t, RISE, 4.4)
  const sunY = mix(t, SUN_UP, 3.6, 112, 77, easeOut)
  const shine = span(t, SUN_UP + 0.4, 3.6)
  return (
    <>
      <defs>
        <clipPath id="k97f3-glass">
          <rect x={GLASS.x} y={GLASS.y} width={GLASS.w} height={GLASS.h} />
        </clipPath>
      </defs>
      <g clipPath="url(#k97f3-glass)">
        <Bands x={GLASS.x} y={GLASS.y} w={GLASS.w} h={GLASS.h} top={lerpColor('#3a4a86', '#9fd8f4', dawn)} bottom={lerpColor('#f6935f', '#ffe2a0', dawn)} />
        <circle cx={SUN_X} cy={sunY} r={15 * shine} fill={SUN} opacity="0.3" />
        <Layer x={SUN_X} y={sunY} rotate={t * 18}>
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x="-0.8" y="-15" width="1.6" height="3.6" rx="0.8" fill={SUN} opacity={shine} transform={`rotate(${i * 45})`} />
          ))}
        </Layer>
        <circle cx={SUN_X} cy={sunY} r="10.5" fill={SUN} />
        <circle cx={SUN_X - 3} cy={sunY - 3} r="3" fill="#fff0a8" opacity="0.7" />
        {/* とおくの おか: 朝日は この うしろから のぼる */}
        <path d="M37 91 Q46 83 54 88 Q63 82 71 87 V96 H37 Z" fill="#6aae6a" />
        <path d="M37 94 Q50 89 62 93 Q68 91 71 92 V96 H37 Z" fill={LEAF} />
      </g>
    </>
  )
}

function Tower({ t }: SceneProps) {
  const glow = span(t, SUN_UP + 0.4, 3.6)
  return (
    <>
      <defs>
        <clipPath id="k97f3-wall">
          <rect x={WALL.x} y={WALL.y} width={WALL.w} height={WALL.h} />
        </clipPath>
      </defs>
      <rect x={WALL.x} y={WALL.y} width={WALL.w} height={WALL.h} fill={STONE} />
      <rect x={WALL.x} y={WALL.y} width="5" height={WALL.h} fill={STONE_DARK} />
      {/* 朝日の あかりが、まどの まわりの かべを ほんのり 染める */}
      <g clipPath="url(#k97f3-wall)">
        <circle cx={SUN_X} cy="78" r={34 * glow} fill={SUN} opacity="0.22" />
      </g>
      {/* だい(1つの 長い いた)。子どもは この上に 立つ */}
      <rect x="11" y={SLAB_TOP} width="87" height="6.2" rx="2.2" fill={SLAB} />
      <rect x="11" y={SLAB_TOP} width="87" height="2" rx="1" fill={SLAB_LIGHT} />
      <WindowView t={t} />
      {/* まどの わく と、まんなかの さん */}
      <g fill={WOOD}>
        <rect x="33.8" y="57" width="3.6" height="39" rx="1.2" />
        <rect x="70.6" y="57" width="3.6" height="39" rx="1.2" />
        <rect x="33.8" y="57" width="40.4" height="3.4" rx="1.2" />
        <rect x={GLASS.x} y="72.6" width={GLASS.w} height="2.2" />
        <rect x={GLASS.x} y="88.2" width={GLASS.w} height="2.2" />
      </g>
    </>
  )
}

/** まえの 草(とうの ねもとを かくす) */
function Meadow() {
  return (
    <>
      <ellipse cx="54.5" cy="99" rx="58" ry="5.2" fill={GRASS} />
      {[8, 24, 86, 101].map((x) => (
        <path key={x} d={`M${x} 98 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
      {[16, 94].map((x) => (
        <path key={x} d={`M${x} 98.5 l1.2 -3 l0.9 2.6 l1.4 -3.4 l0.7 3.8 Z`} fill={LEAF_DARK} />
      ))}
    </>
  )
}

type Mood = 'sleepy' | 'surprised' | 'happy' | 'sing'

/** うで の かっこう。swing = ま下から 外へ ひらいた角度(90 が まよこ)/ bend = ひじ の まがり */
type ArmPose = { readonly swing: number; readonly bend: number }

/** かた から出て、ひじ で まがる うで。side は 左(-1)・右(1)。 */
function Arm({ side, pose }: { readonly side: -1 | 1; readonly pose: ArmPose }) {
  const shoulder = side < 0 ? SHOULDER_L : SHOULDER_R
  const rad = (deg: number) => (deg * Math.PI) / 180
  const dir = (deg: number) => [side * Math.sin(rad(deg)), Math.cos(rad(deg))] as const
  const [ux, uy] = dir(pose.swing)
  const elbow = [shoulder[0] + ux * UPPER, shoulder[1] + uy * UPPER] as const
  const [fx, fy] = dir(pose.swing + pose.bend)
  const hand = [elbow[0] + fx * FORE, elbow[1] + fy * FORE] as const
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]}`} fill="none" stroke={TUNIC_DARK} strokeWidth="5" strokeLinecap="round" />
      <path d={`M${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={SKIN} strokeWidth="3.6" strokeLinecap="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.9" fill={SKIN} />
    </>
  )
}

function Face({ mood, open }: { readonly mood: Mood; readonly open: number }) {
  return (
    <>
      <circle cx="47.9" cy="20.6" r="1.7" fill={CHEEK} opacity="0.6" />
      <circle cx="61.1" cy="20.6" r="1.7" fill={CHEEK} opacity="0.6" />
      {mood === 'sleepy' && (
        <>
          <path d="M49 16.2 l3.6 0.8 M56.4 17 l3.6 -0.8" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M52.6 21.9 q0.9 -0.9 1.9 0 q0.9 0.9 1.9 0" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'surprised' && (
        <>
          <path d="M49.2 13.2 q1.6 -1.2 3.2 0 M56.6 13.2 q1.6 -1.2 3.2 0" fill="none" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <circle cx="50.8" cy="16.6" r="1.5" fill={EYE} />
          <circle cx="58.2" cy="16.6" r="1.5" fill={EYE} />
          <circle cx="51.3" cy="16.1" r="0.5" fill="#ffffff" />
          <circle cx="58.7" cy="16.1" r="0.5" fill="#ffffff" />
          <ellipse cx="54.5" cy="22" rx="1.2" ry="1.6" fill={MOUTH} />
        </>
      )}
      {(mood === 'happy' || mood === 'sing') && (
        <>
          <path d="M49 17.4 q1.8 -2.6 3.6 0 M56.4 17.4 q1.8 -2.6 3.6 0" fill="none" stroke={EYE} strokeWidth="1.25" strokeLinecap="round" />
          {mood === 'happy' ? (
            <path d="M51.8 20.8 Q54.5 23.8 57.2 20.8" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
          ) : (
            <>
              <ellipse cx="54.5" cy="21.8" rx={1.7 + open * 0.5} ry={0.9 + open * 2.1} fill={MOUTH} />
              <ellipse cx="54.5" cy={22.6 + open * 1.4} rx={1.1 + open * 0.3} ry={0.5 + open * 0.8} fill={TONGUE} />
            </>
          )}
        </>
      )}
    </>
  )
}

type ChildProps = {
  readonly mood: Mood
  readonly open: number
  readonly armL: ArmPose
  readonly armR: ArmPose
  readonly headTilt: number
}

/** 子ども(まえむき)。あたまの まんなかが 1画目、ひろげた うで が 2画目。 */
function Child({ mood, open, armL, armR, headTilt }: ChildProps) {
  return (
    <>
      {/* あし: こし から 2本 */}
      <rect x="49.4" y="38" width="4.4" height="9" rx="2" fill={PANTS} />
      <rect x="55.2" y="38" width="4.4" height="9" rx="2" fill={PANTS} />
      <ellipse cx="50.6" cy="47.4" rx="3.6" ry="1.9" fill={SHOE} />
      <ellipse cx="58.4" cy="47.4" rx="3.6" ry="1.9" fill={SHOE} />
      {/* くび: みじかく、どう の まんなか の上 */}
      <rect x="52.2" y="23.4" width="4.6" height="5.4" rx="2" fill={SKIN_SHADE} />
      <rect x="47" y="27" width="15" height="13" rx="5" fill={TUNIC} />
      <path d="M49 36 h11" stroke={TUNIC_DARK} strokeWidth="1.4" strokeLinecap="round" />
      <Arm side={-1} pose={armL} />
      <Arm side={1} pose={armR} />
      <Layer rotate={headTilt} origin={NECK}>
        <circle cx="54.5" cy="16" r="8.6" fill={SKIN} />
        <path d="M45.8 17 C45 6.2 64 6.2 63.2 17 C62 13.2 58.4 11.6 54.5 12 C50.6 11.6 47 13.2 45.8 17 Z" fill={HAIR} />
        <Face mood={mood} open={open} />
      </Layer>
    </>
  )
}

/** さむくて ぶるぶる: 体の よこの ふるえ の すじ */
function Shiver({ t }: SceneProps) {
  const show = during(t, RISE + 0.2, NOTICE, 0.2)
  if (show <= 0) return null
  const k = wave(t, 0.16)
  return (
    <g opacity={show} fill="none" stroke="#7aa6d6" strokeWidth="1" strokeLinecap="round">
      <path d={`M${43.5 + k * 0.5} 26 q-1.4 2 0 4 q1.4 2 0 4`} />
      <path d={`M${65.5 - k * 0.5} 26 q1.4 2 0 4 q-1.4 2 0 4`} />
    </g>
  )
}

/** 歌の おと の わ: かお の 左右へ ひろがる */
function SoundWaves({ t }: SceneProps) {
  if (t < SING) return null
  const center = [54.5, 19] as const
  return (
    <>
      {[0, 0.55, 1.1].map((offset) => {
        const p = ((t - SING + offset) % 1.65) / 1.65
        const r = 12 + p * 30
        const a = 0.66
        const pts = (s: number) => [
          [center[0] + s * r * Math.cos(a), center[1] - r * Math.sin(a)],
          [center[0] + s * r * Math.cos(a), center[1] + r * Math.sin(a)],
        ]
        const fade = Math.sin(p * Math.PI) * span(t, SING, SING + 0.3)
        return (
          <g key={offset} opacity={fade} fill="none" stroke={WAVE_BLUE} strokeWidth="1.8" strokeLinecap="round">
            {[-1, 1].map((s) => {
              const [p1, p2] = pts(s)
              return <path key={s} d={`M${p1[0]} ${p1[1]} A${r} ${r} 0 0 ${s > 0 ? 1 : 0} ${p2[0]} ${p2[1]}`} />
            })}
          </g>
        )
      })}
    </>
  )
}

/** おんぷ(歌が ひろがる と ふわっと 出てくる)。ほね3・4 の あたり */
function Note({ t, x, y, start }: { readonly t: number; readonly x: number; readonly y: number; readonly start: number }) {
  const pop = span(t, start, start + 0.4, backOut)
  if (pop <= 0) return null
  const drift = span(t, start, INK) * -3
  return (
    <Layer x={x + wave(t, 1.6, start) * 1.2} y={y + drift} scale={pop}>
      <ellipse cx="0" cy="0" rx="2.4" ry="1.7" fill={NOTE} transform="rotate(-20)" />
      <path d="M1.9 -0.6 V-8 q2.8 0.6 3 3.4" fill="none" stroke={NOTE} strokeWidth="1.1" strokeLinecap="round" />
    </Layer>
  )
}

/** 歌を 聞きに くる 小鳥(右から とんできて、だい に とまる) */
function Bird({ t }: SceneProps) {
  const arrive = span(t, BIRD, BIRD + 0.9, easeOut)
  if (arrive <= 0) return null
  const x = 118 - arrive * 28
  const y = 8 + arrive * 35.5 - Math.sin(arrive * Math.PI) * 9
  const landed = arrive >= 1
  const hop = landed ? Math.abs(wave(t, 0.7)) * 0.9 : 0
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
  const ink = inkTiming(t, INK, DONE, 9)

  // とうが のびる(子どもは てっぺんに のったまま あがってくる)
  const rise = span(t, 0, RISE, backOut)
  const lift = (1 - rise) * 62

  // 子どもの 気持ち: さむくて ねむい → びっくり → にっこり → 歌う
  const mood: Mood = t < NOTICE ? 'sleepy' : t < SMILE ? 'surprised' : t < SING ? 'happy' : 'sing'
  const open = t >= SING ? Math.abs(wave(t, 0.7)) : 0
  const shake = t > RISE && t < NOTICE ? wave(t, 0.16) * 0.45 : 0
  const bounce = t >= SING ? -Math.abs(wave(t, 0.7)) * 0.5 : 0

  // うで: さむい間は ぎゅっと 下げる。うで を ひろげて、2画目の線の高さへ(右手は 少し上)
  const spread = span(t, STAND, STAND + 0.9, easeOut)
  const flap = t >= SING ? wave(t, 0.7) * 1.2 : 0
  const armL: ArmPose = { swing: 7 + (87 - 7) * spread + flap, bend: 6 - 6 * spread }
  const armR: ArmPose = { swing: 7 + (100 - 7) * spread - flap, bend: 6 - 6 * spread }
  const headTilt = t < NOTICE ? 6 + wave(t, 1.4) * 1.2 : t < SMILE ? -3 : 0

  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Layer y={lift} opacity={span(t, 0, 0.12)}>
          <Tower t={t} />
          <Layer x={shake} y={bounce}>
            <Child mood={mood} open={open} armL={armL} armR={armR} headTilt={headTilt} />
            <Shiver t={t} />
          </Layer>
        </Layer>
        <Meadow />
        <SoundWaves t={t} />
        <Note t={t} x={21} y={13} start={SING + 0.3} />
        <Note t={t} x={90} y={12} start={SING + 0.7} />
        <Note t={t} x={14} y={31} start={SING + 1.1} />
        <Note t={t} x={96} y={30} start={SING + 1.5} />
        <Bird t={t} />
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
    { at: 0, label: '高い とうが のびて、子どもが てっぺんに 立つ', sound: 'pop' },
    { at: RISE, label: 'さむくて ねむそうに ぶるぶる' },
    { at: SUN_UP, label: 'まどの むこうに 朝日が のぼる' },
    { at: NOTICE, label: '目をさまして びっくり → にっこり', sound: 'pop' },
    { at: SING, label: 'うでを ひろげて 歌う。おと が ひびく' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '音 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
