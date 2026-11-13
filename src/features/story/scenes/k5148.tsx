/*
 * 先(さき): かけっこで、あしが さきに でて ゴール。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … はちまきの ながい しっぽ(かぜで うしろへ なびく)
 *   2画目(一)  … ゴールの しゅんかん、よろこんで ひろげた りょううで
 *   3画目(丨)  … あたま と どう(まっすぐ立った 体)
 *   4画目(一)  … ゴールの テープ(左右の ポールの間)
 *   5画目(ノ)  … うしろへ けりだした あし
 *   6画目(乚)  … さきに ふみだした あし と、ゴールの ポール の あしもと
 *
 * ながれ
 *   ゴールの ポールと テープが たつ → 男の子と ライバルが スタートに ならぶ(どきどき)
 *   → 「どん!」と はしりだす。男の子が じわじわ ぬいていく(ライバルは おくれる)
 *   → 男の子の あしが、だれより さきに テープの ところへ でる → テープが ぷつん ときれる
 *   → りょううでを ひろげて 「やったー!」(紙ふぶき)。ライバルは くやしそう
 *   → ほね が ひかって、絵が うすくなり、字「先」が のこる
 *
 * 人は ほんものの つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがり、あし は こし から ひざ で まがる。
 *   くび は みじかく、どう の まんなか の上。はしるときは 体を まえに かたむけ、うで と あし は ぎゃくに ふる。
 *   字の形に そろうのは、ゴールで 手を ひろげ、あしを ふみだした さいごの しゅんかん だけ。
 */
import { backOut, during, easeOut, inkTiming, span, wave, type Ease, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '先'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const SHOE = '#6b4a36'
const GRASS = '#c5e8a9'
const HILL = '#e2f2d2'
const TRACK = '#d9a07c'
const TRACK_EDGE = '#c58763'
const SUN = '#ffd24a'
const TAPE = '#ff5d73'
const POLE_RED = '#e8534a'
const MOUTH = '#c4504a'
const EYE = '#2b2b2b'

/** 男の子と ライバルの 服の色 */
type Look = { readonly shirt: string; readonly shirtDark: string; readonly pants: string; readonly hair: string; readonly band: string }
const BOY: Look = { shirt: '#ff9a3c', shirtDark: '#e07f22', pants: '#3e5c86', hair: '#5a3b2a', band: '#e8534a' }
const RIVAL: Look = { shirt: '#4f9be0', shirtDark: '#3c82c4', pants: '#34507a', hair: '#3a2a22', band: '#ffffff' }

/** くぎり の時間(秒) */
const GO = 1.7
const BREAK = 4.8
const INK = 6.4
const DONE = 8.7
const DURATION = 9.2

/* ───────── 人の かたち(すべて「できあがりの しゅんかん」の 場所で えがく) ───────── */

type Pt = readonly [number, number]
/** こし(あし の つけね)・かた(うでを ふる じく)・くび */
const HIP_NEAR: Pt = [57, 54.5]
const HIP_FAR: Pt = [50, 55]
const HIP_MID: Pt = [53.5, 55]
const SHOULDER: Pt = [54.8, 33]
const NECK: Pt = [54.2, 29]
/** 足の ふみ場(この下に くつ がくる) と、足もと の じく */
const FEET: Pt = [53, 96]
const ANKLE_ON_GROUND = 92.5
/** ももと すね の長さ、うでの 半分の長さ */
const LEG_PART = 20.5
const ARM_PART = 10.5

const rad = (deg: number) => (deg * Math.PI) / 180

/**
 * あしの かっこう。phi = +1 で さきに ふみだした あし、-1 で うしろへ けりだした あし。
 * ももは まえへ、すねは うしろへ おれる(ほんものの はしり のように ひざ で まがる)
 */
function legPose(hip: Pt, phi: number) {
  const thigh = -2 + 30 * phi
  const shin = -20 + 10 * phi
  const knee: Pt = [hip[0] + LEG_PART * Math.sin(rad(thigh)), hip[1] + LEG_PART * Math.cos(rad(thigh))]
  const ankle: Pt = [knee[0] + LEG_PART * Math.sin(rad(shin)), knee[1] + LEG_PART * Math.cos(rad(shin))]
  return { knee, ankle, shin }
}

function Leg({ hip, phi, color }: { readonly hip: Pt; readonly phi: number; readonly color: string }) {
  const { knee, ankle, shin } = legPose(hip, phi)
  // つまさきは、うしろへ けるときは 下を むき、ふみだすときは 少し 上を むく
  const toe = -shin * 0.8 - 14
  return (
    <>
      <path d={`M${hip[0]} ${hip[1]} L${knee[0]} ${knee[1]} L${ankle[0]} ${ankle[1]}`} fill="none" stroke={color} strokeWidth="7.6" strokeLinecap="round" strokeLinejoin="round" />
      <g transform={`translate(${ankle[0] + 2.6} ${ankle[1] + 2.2}) rotate(${toe})`}>
        <ellipse cx="0" cy="0" rx="6" ry="3" fill={SHOE} />
      </g>
    </>
  )
}

/** うで の かっこう。swing = ま下から まえ(右)へ ふった角度 / bend = ひじ の まがり */
type ArmPose = { readonly swing: number; readonly bend: number }

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。 */
function Arm({ pose, sleeve }: { readonly pose: ArmPose; readonly sleeve: string }) {
  const elbow: Pt = [SHOULDER[0] + Math.sin(rad(pose.swing)) * ARM_PART, SHOULDER[1] + Math.cos(rad(pose.swing)) * ARM_PART]
  const fore = pose.swing + pose.bend
  const hand: Pt = [elbow[0] + Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART]
  return (
    <>
      <path d={`M${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={SKIN} strokeWidth="5.4" strokeLinecap="round" />
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]}`} fill="none" stroke={sleeve} strokeWidth="6.8" strokeLinecap="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.4" fill={SKIN} />
    </>
  )
}

type Mood = 'ready' | 'run' | 'win' | 'sad'

/** 顔(右むき)。気持ちで 目と口と まゆ を かえる */
function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="59.4" cy="22.9" r="1.8" fill="#ff9d9d" opacity="0.55" />
      {mood === 'win' ? (
        <>
          <path d="M56.8 20.6 Q58.6 17.8 60.4 20.6" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M56.4 23.6 Q58.8 29.4 61.2 23.6 Z" fill={MOUTH} />
        </>
      ) : (
        <>
          <circle cx="58.6" cy="19.8" r="1.2" fill={EYE} />
          {mood === 'sad' ? (
            <>
              <path d="M56 18.2 L60.4 16.6" stroke={EYE} strokeWidth="1" strokeLinecap="round" />
              <path d="M56.8 26 Q58.8 23.8 60.8 25.6" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d="M55.8 17.2 L60.4 18.2" stroke={EYE} strokeWidth="1" strokeLinecap="round" />
              {mood === 'run' ? <ellipse cx="58.8" cy="24.8" rx="1.6" ry="1.4" fill={MOUTH} /> : <path d="M57.2 24.8 L60.2 24.6" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />}
            </>
          )}
        </>
      )}
    </>
  )
}

type PersonProps = {
  /** あしの ふり(+1 = 右あしが さきに でる) */
  readonly phi: number
  /** りょううでを ひろげる度合い(0 = はしる うでの ふり / 1 = ひろげた) */
  readonly cheer: number
  /** 体の まえへの かたむき(度) */
  readonly lean: number
  /** はちまきの しっぽ の むき(0 = 画の線そのまま) */
  readonly tailRot: number
  readonly mood: Mood
  readonly look: Look
}

function Person({ phi, cheer, lean, tailRot, mood, look }: PersonProps) {
  const near = legPose(HIP_NEAR, phi)
  const far = legPose(HIP_FAR, -phi)
  // 低いほうの あし が いつも 地面に つくように、体ぜんたいを 上下させる
  const drop = ANKLE_ON_GROUND - Math.max(near.ankle[1], far.ankle[1])
  const run = 1 - cheer
  const nearArm: ArmPose = { swing: -42 * phi * run + 95 * cheer, bend: 70 * run }
  const farArm: ArmPose = { swing: 42 * phi * run - 86 * cheer, bend: 70 * run }
  return (
    <Layer y={drop}>
      <Leg hip={HIP_FAR} phi={-phi} color={SKIN_SHADE} />
      <Leg hip={HIP_NEAR} phi={phi} color={SKIN} />
      <Layer rotate={lean} origin={HIP_MID}>
        {/* むこうの うで: どう の うしろ */}
        <Arm pose={farArm} sleeve={look.shirtDark} />
        {/* くび: どう と あたま の間を みじかく つなぐ */}
        <rect x="51.6" y="26" width="5.4" height="8" rx="2.4" fill={SKIN_SHADE} />
        <rect x="47.8" y="30.4" width="14" height="26" rx="6" fill={look.shirt} />
        <path d="M50.4 44 h8.8" stroke={look.shirtDark} strokeWidth="1.5" strokeLinecap="round" />
        <rect x="47.4" y="49" width="14.8" height="11" rx="4" fill={look.pants} />
        <Arm pose={nearArm} sleeve={look.shirt} />
        <Layer rotate={mood === 'win' ? -4 : mood === 'sad' ? 6 : 0} origin={NECK}>
          <circle cx="49.8" cy="20.6" r="2.2" fill={SKIN_SHADE} />
          <circle cx="53.6" cy="19" r="8.6" fill={SKIN} />
          <path d="M45.2 21 C43.8 11 52 9.5 58 10.8 C61 11.6 62.3 14.4 62.1 16.4 C58.4 13.2 52.6 13.2 49 18 C47.6 19.8 46.6 21.4 45.2 21 Z" fill={look.hair} />
          <Face mood={mood} />
          {/* はちまき: あたまを ひとまわり して、うしろで むすぶ */}
          <path d="M45.4 15.5 Q53.6 11.6 62 14.4" fill="none" stroke={look.band} strokeWidth="3" />
          <circle cx="45" cy="15.8" r="2" fill={look.band} />
          {/* 1画目: ながい しっぽ。ふだんは 下へ たれ、はしると うしろへ なびく */}
          <Layer rotate={tailRot} origin={[44.6, 16.2]}>
            <path d="M44.6 16.2 L37.5 21" fill="none" stroke={look.band} strokeWidth="3" strokeLinecap="round" />
            <Bone char={CHAR} n={1} color={look.band} width={3} />
          </Layer>
        </Layer>
      </Layer>
    </Layer>
  )
}

/* ───────── 場所 ───────── */

function Field({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[100, 9]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="99.2" y="-2.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 100 9)`} />
        ))}
      </Layer>
      <circle cx="100" cy="9" r={5 * sun} fill={SUN} />
      <path d="M-4 70 Q20 56 44 66 Q72 54 113 68 V110 H-4 Z" fill={HILL} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="6" cy="30" rx="7" ry="3.2" />
        <ellipse cx="11" cy="28.2" rx="5" ry="3.2" />
        <ellipse cx="74" cy="20" rx="6" ry="2.6" />
        <ellipse cx="78.5" cy="18.6" rx="4.4" ry="2.8" />
      </g>
      <path d="M-4 69 Q27 63 54.5 66 Q82 63 113 69 V110 H-4 Z" fill={GRASS} />
      {/* かけっこの みち: 手まえが ひろい(おくゆき) */}
      <path d="M26 69 L72 69 L113 110 L-4 110 Z" fill={TRACK_EDGE} />
      <path d="M27.5 70.2 L70.5 70.2 L108 106 L0 106 Z" fill={TRACK} />
      {/* スタートの 白い線 */}
      <path d="M29 73.4 L70 73.4" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      {/* ゴールの しろくろ もよう(2だん) */}
      {Array.from({ length: 20 }, (_, i) =>
        [0, 1].map((row) => (
          <rect key={`${i}-${row}`} x={12 + i * 4.2} y={94 + row * 2.2} width="4.2" height="2.2" fill={(i + row) % 2 === 0 ? '#3a3a3a' : '#ffffff'} />
        )),
      )}
    </>
  )
}

/** ゴールの ポール(左右)。ぽん と たつ */
function Poles({ t }: SceneProps) {
  const rise = span(t, 0.1, 0.7, backOut)
  return (
    <Layer scaleY={rise} origin={[55, 97]}>
      {[16, 93.6].map((x) => (
        <g key={x}>
          <rect x={x - 1.4} y="44" width="2.8" height="53" rx="1.2" fill="#ffffff" />
          <rect x={x - 1.4} y="56" width="2.8" height="6" fill={POLE_RED} />
          <rect x={x - 1.4} y="70" width="2.8" height="6" fill={POLE_RED} />
          <rect x={x - 1.4} y="84" width="2.8" height="6" fill={POLE_RED} />
          <circle cx={x} cy="44" r="2.5" fill={POLE_RED} />
        </g>
      ))}
    </Layer>
  )
}

/** ゴールの テープ。はしる人に おされて のび、ぷつん と ふたつに ちぎれる */
function Tape({ t }: SceneProps) {
  const show = span(t, 0.35, 0.8)
  if (show <= 0) return null
  if (t < BREAK) {
    const pull = span(t, BREAK - 0.7, BREAK, easeOut)
    return <path d={`M17 53.3 Q${55 + pull * 4} ${51.6 + pull * 4} 92.6 49.6`} fill="none" stroke={TAPE} strokeWidth="2.6" strokeLinecap="round" opacity={show} />
  }
  // ちぎれた あと: 2つに わかれて、はしを たらす
  const fall = span(t, BREAK, BREAK + 0.5, easeOut)
  return (
    <g fill="none" stroke={TAPE} strokeWidth="2.6" strokeLinecap="round">
      <path d={`M17 53.3 Q30 ${54.4 + fall} 44 ${53.8 + fall * 6}`} />
      <path d={`M92.6 49.6 Q78 ${51.4 + fall} 65.5 ${52 + fall * 6}`} />
    </g>
  )
}

/** ゴールした しゅんかんの 紙ふぶき(ちぎれた テープの かけら と きらきら) */
function Confetti({ t }: SceneProps) {
  const p = t - BREAK
  if (p <= 0 || p > 1.7) return null
  const pieces = [
    { vx: -24, vy: -26, spin: 300, color: TAPE },
    { vx: -13, vy: -34, spin: -240, color: '#ffd24a' },
    { vx: -4, vy: -38, spin: 200, color: '#7cc4f2' },
    { vx: 6, vy: -33, spin: -320, color: TAPE },
    { vx: 15, vy: -36, spin: 260, color: '#8bd69a' },
    { vx: 25, vy: -27, spin: -200, color: '#ffd24a' },
    { vx: 31, vy: -18, spin: 340, color: '#7cc4f2' },
    { vx: -31, vy: -17, spin: -280, color: '#8bd69a' },
  ]
  return (
    <g opacity={1 - span(p, 1.1, 1.7)}>
      {pieces.map((piece, i) => (
        <rect key={i} x="-1.6" y="-0.9" width="3.2" height="1.8" rx="0.4" fill={piece.color} transform={`translate(${55 + piece.vx * p} ${30 + piece.vy * p + 24 * p * p}) rotate(${piece.spin * p})`} />
      ))}
    </g>
  )
}

/* ───────── 場面 ───────── */

/** はしりだしは ゆっくり、だんだん はやく */
const accelerate: Ease = (x) => x * (0.7 + 0.3 * x)

/** かけっこの みちを、おくから 手まえへ。人は 小さい → 大きい(おくゆき) */
function lanePose(progress: number, startX: number, size: number) {
  return { x: startX + 20 * progress, y: 74 + 22 * progress, scale: (0.6 + 0.4 * progress) * size }
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  // 男の子: スタート → ゴール(BREAK で ちょうど 足が さきに でた かっこう)
  const p = span(t, GO, BREAK, accelerate)
  const boy = lanePose(p, 33, 1)
  const running = span(t, GO, GO + 0.4)
  // BREAK の しゅんかん に phi がちょうど +1(ふみだした足)になるように 位相を そろえる
  const FREQ = 2.4
  const boyPhase = t < BREAK ? Math.sin(2 * Math.PI * FREQ * (t - BREAK) + Math.PI / 2) * running : 1
  const boyPhi = t < GO ? 0.15 : boyPhase
  const joy = span(t, BREAK, BREAK + 0.5, backOut)
  const hop = Math.sin(span(t, BREAK, BREAK + 0.6) * Math.PI) * 3
  const boyLean = (t < GO ? 10 + wave(t, 0.8) * 1.2 : 13) * (1 - span(t, BREAK - 0.1, BREAK + 0.5))
  const wind = t < GO ? 0 : t < BREAK ? span(t, GO, GO + 0.6) : 1 - 0.44 * span(t, BREAK, INK)
  const boyMood: Mood = t < GO ? 'ready' : t < BREAK ? 'run' : 'win'

  // ライバル: おなじ ところから はしるが、だんだん おくれる
  const rp = 0.76 * p + 0.1 * span(t, BREAK, BREAK + 2, easeOut)
  const rival = lanePose(rp, 64, 0.94)
  const rivalPhi = t < GO ? 0.15 : Math.sin(2 * Math.PI * (FREQ - 0.2) * (t - GO) + 1) * span(t, GO, GO + 0.4) * (1 - 0.5 * span(t, BREAK, BREAK + 1))
  const rivalMood: Mood = t < GO ? 'ready' : t < BREAK ? 'run' : 'sad'

  // 「どん!」の しゅんかんの はじけ と、足が さきに でた ひかり
  const go = during(t, GO - 0.05, GO + 0.5, 0.15)
  const flash = span(t, BREAK - 0.12, BREAK + 0.5)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  const tapeBehind = t >= BREAK

  return (
    <>
      <Layer opacity={ink.picture}>
        <Field t={t} />
        <Poles t={t} />
        {tapeBehind ? <Tape t={t} /> : null}
        {/* ライバル */}
        <Layer opacity={span(t, 0.5, 0.8)}>
          <ellipse cx={rival.x} cy={rival.y + 0.6} rx={13 * rival.scale} ry={2.4 * rival.scale} fill="#000000" opacity="0.12" />
          <Layer x={rival.x - FEET[0]} y={rival.y - FEET[1]} scale={rival.scale} origin={FEET}>
            <Person phi={rivalPhi} cheer={0} lean={t < GO ? 10 : 12} tailRot={t < GO ? -28 : 20} mood={rivalMood} look={RIVAL} />
          </Layer>
          {/* おくれて くやしい あせ */}
          {t > BREAK ? (
            <path d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" opacity={during(t, BREAK + 0.2, INK, 0.3)} transform={`translate(${rival.x - 6 * rival.scale} ${rival.y - 66 * rival.scale + ((t * 14) % 7)})`} />
          ) : null}
        </Layer>
        {/* 男の子 */}
        <Layer opacity={span(t, 0.5, 0.8)}>
          <ellipse cx={boy.x} cy={boy.y + 0.6} rx={14 * boy.scale} ry={2.6 * boy.scale} fill="#000000" opacity="0.14" />
          <Layer x={boy.x - FEET[0]} y={boy.y - FEET[1] - hop} scale={boy.scale} origin={FEET}>
            {/* はしる ときの かぜの すじ */}
            <g opacity={during(t, GO + 0.4, BREAK - 0.1, 0.3) * 0.7} stroke={TRACK_EDGE} strokeWidth="1.6" strokeLinecap="round">
              {[38, 52, 68].map((y, i) => {
                const slide = ((t * 30 + i * 5) % 12)
                return <path key={y} d={`M${34 - slide} ${y} h${8 - slide * 0.3}`} />
              })}
            </g>
            <Person phi={boyPhi} cheer={joy} lean={boyLean} tailRot={-28 + 50 * wind} mood={boyMood} look={BOY} />
          </Layer>
        </Layer>
        {!tapeBehind ? <Tape t={t} /> : null}
        {/* 「どん!」: はしりだす ところの ぴかっ */}
        <g opacity={go}>
          <Star cx={34} cy={66} r={4 + go * 2} color="#ffd24a" spin={go * 90} />
          <Star cx={45} cy={63} r={2.6} color="#ffffff" spin={20} />
        </g>
        {/* 足が さきに でた! ふみだした つまさきの ひかり */}
        <g opacity={flash * (1 - flash) * 4}>
          <Star cx={74} cy={91} r={6 * flash + 1} color="#ffd24a" spin={flash * 120} />
          <Star cx={80} cy={86} r={3} color="#ffffff" spin={40} />
        </g>
        <Confetti t={t} />
        <Sparkles cx={55} cy={46} progress={span(t, BREAK, BREAK + 0.8)} reach={26} count={8} />
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
    { at: 0, label: 'ゴールの ポールと テープが たつ', sound: 'pop' },
    { at: 0.9, label: 'スタートに ならぶ。どきどき' },
    { at: GO, label: 'どん! はしりだす', sound: 'pop' },
    { at: 3.2, label: 'ぐんぐん ぬいていく' },
    { at: BREAK, label: 'あしが さきに でて、テープが ぷつん', sound: 'stroke' },
    { at: BREAK + 0.9, label: 'りょううでを ひろげて、やったー!' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '先 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene

