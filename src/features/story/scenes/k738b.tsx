/*
 * 王(おう): 大きな おのを もちあげた つよい わかものが、王さまに なる。(共通部品 sceneFigures で 書きなおした もの)
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … おのの てっぺんの はたざお(よこぼう)。りょうはしに ふさ
 *   2画目(丨)  … おのの え(ながい もちて)。まんなかを まっすぐ
 *   3画目(一)  … おのの は の うえの へり(え が とおる ところ)
 *   4画目(一)  … おのの は の さき(ひろがった 刃)。地めんに ささっている ところ
 *
 * ながれ
 *   大きな おのが ずしんと 地めんに ささる(つよさの しるし)
 *   → わかものが あるいてきて、おのを 見あげる。とおくの おか では 村の人が 見まもる
 *   → えを りょうてで つかんで ぐいっ…ぐいっ…(ふんばる)→ ぬけて もちあがる!(みんな 大よろこび)
 *   → しろい はとが 王かんを はこんできて、わかものの あたまに のせる
 *   → おのを どしんと たてて、王さまの できあがり → ほね が ひかって、絵が うすくなり 字「王」が のこる
 *
 * 人は Person(あるきは walk)。手は えの 点に とどかせる({ to })。こしの ベルト(きんの バックル)は 場面で 描く。
 * 王かんは あたまに のる とき だけ headwear、おちて くる とちゅう は 場面で 描く。はとは Bird。
 */
import { during, easeIn, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, Bird, Dust, HANG_ARM, LOOKS, mixLimb, mixPose, Person, personRig, posture, Sweat, Tuft, walk, type Limb, type PersonProps } from '../sceneFigures'

const CHAR = '王'

const GOLD = '#f2b632'
const GOLD_DARK = '#d99a1c'
const RED = '#e8534a'
const WOOD = '#9a6a45'
const WOOD_DARK = '#7a5033'
const STEEL = '#a9b8cb'
const STEEL_DARK = '#8396ad'
const STEEL_LIGHT = '#dbe4ee'
const MOUND = '#b5df94'
const DOVE = '#f6f9fc'
const DOVE_DARK = '#dfe6ef'

/** くぎり の時間(秒) */
const LAND = 0.7
const WALK = 1.0
const ARRIVE = 2.2
const GRIP = 2.5
const STRAIN = 2.9
const LIFT = 3.9
const DOVE_AT = 4.4
const DROP = 5.0
const CROWNED = 5.3
const SET_DOWN = 5.5
const INK = 6.3
const DONE = 9.5
const DURATION = 10.1

/** おのの え の まんなか(x)と、地めん(足もと・は の さき) */
const SHAFT_X = 54
const GROUND_Y = 91
/** おのを もちあげる高さ */
const LIFT_HEIGHT = 12
const HERO_X = 44
const HERO = { build: 'adult', height: 62 } as const
/** 手が えを にぎる 場所(てまえの 手は 下、むこうの 手は 上) */
const GRIP_NEAR = [SHAFT_X - 1.6, 58] as const
const GRIP_FAR = [SHAFT_X - 1.2, 51.5] as const
/** 王かんの 大きさ(元の あたま 半径 8.2 に たいする わりあい)と、あたまの 上に のる 高さ(あたま 半径 の 何ばい か) */
const CROWN_BASE = 0.74
const CROWN_UNIT = 8.2
/** はとの たかさと、あしから 王かんの そこ まで */
const DOVE_Y = 7
const CROWN_HANG = 19
const VILLAGER_HEIGHT = 30

const HERO_LOOK = { top: '#e8745a', bottom: '#3e5c86' } as const
const VILLAGERS = [
  { x: 95, y: 64, look: { ...LOOKS.boy, top: '#6bb36b', hair: '#3d2b1f' }, lag: 0 },
  { x: 103.5, y: 62.4, look: { ...LOOKS.girl, top: '#8f7ad6', hair: '#b5651d' }, lag: 0.2 },
] as const

/** 村の人が 見まもる とおくの おか(Backdrop の おか の 手前) */
function Mound() {
  return <path d="M82 92 Q85 66 108 62 V92 Z" fill={MOUND} />
}

/** 地めんの 前がわの くさ(おのの は の さきが ささって いるように 見せる) */
function FrontGrass() {
  return (
    <>
      {[16, 30, 44, 62, 76, 90].map((x) => (
        <Tuft key={x} x={x} y={93.2} />
      ))}
    </>
  )
}

/** おの。え・は・はたざお。 */
function Axe({ t }: SceneProps) {
  const sway = wave(t, 1.6) * 1.2
  return (
    <>
      {/* は: かたい ぎん色の 刃。え の まわりは ほそく、さきへ ひろがり、さき は まるく ふくらむ */}
      <path d="M29.5 53.6 L80 52.6 Q84 70 96 87 Q56 99 14 90.6 Q26 72 29.5 53.6 Z" fill={STEEL} />
      <path d="M29.5 53.6 L80 52.6 Q81 62 85 72 Q56 77 24 72 Q28 62 29.5 53.6 Z" fill={STEEL_LIGHT} opacity="0.55" />
      <path d="M96 87 Q56 99 14 90.6 L17 85.6 Q56 93.6 93 82 Z" fill={STEEL_DARK} />
      <path d="M14 90.6 Q56 99 96 87" fill="none" stroke="#eef3f8" strokeWidth="1.6" strokeLinecap="round" />
      {/* え を とおす 金ぐ(は の ねもと) */}
      <rect x="45" y="50.6" width="18" height="9" rx="2.4" fill={STEEL_DARK} />
      <path d="M40 62 L66 61.4" stroke={GOLD} strokeWidth="2" strokeLinecap="round" />
      {[38, 70].map((x) => (
        <circle key={x} cx={x} cy="74" r="1.7" fill={STEEL_DARK} />
      ))}
      {/* え */}
      <rect x={SHAFT_X - 1.9} y="17" width="3.8" height="72" rx="1.9" fill={WOOD} />
      <rect x={SHAFT_X + 0.4} y="17" width="1.5" height="72" rx="0.75" fill={WOOD_DARK} />
      {/* きんの わ と、いちばん 上の かざり */}
      <rect x={SHAFT_X - 2.6} y="52" width="5.2" height="3.4" rx="1.2" fill={GOLD_DARK} />
      <path d={`M${SHAFT_X} 8.4 L${SHAFT_X + 2.8} 13.4 L${SHAFT_X} 18 L${SHAFT_X - 2.8} 13.4 Z`} fill={GOLD} />
      {/* はたざお と ふさ */}
      <rect x="29" y="16.8" width="51" height="2.6" rx="1.3" fill={GOLD_DARK} />
      {[29.5, 79.5].map((x, i) => (
        <g key={x} transform={`rotate(${sway * (i === 0 ? 1 : -1)} ${x} 19)`}>
          <path d={`M${x} 19 v4.4`} stroke={RED} strokeWidth="1" />
          <circle cx={x} cy="25.4" r="2.2" fill={RED} />
        </g>
      ))}
    </>
  )
}

/** 王かん。そこの まんなか が 原点、scale は 大きさ */
function Crown({ x, y, rotate = 0, scale = 1 }: { readonly x: number; readonly y: number; readonly rotate?: number; readonly scale?: number }) {
  return (
    <Layer x={x} y={y} rotate={rotate} scale={scale}>
      <path d="M-6.4 0 L-7.2 -8 L-3.4 -4.2 L0 -9.4 L3.4 -4.2 L7.2 -8 L6.4 0 Z" fill={GOLD} />
      <rect x="-6.4" y="-2.2" width="12.8" height="2.2" fill={GOLD_DARK} />
      <circle cx="0" cy="-5.4" r="1" fill={RED} />
    </Layer>
  )
}

/** わかもの の 場所・あるき・手・顔。手は えを にぎり、おのと いっしょに あがる */
function heroAt(t: number, lift: number): PersonProps {
  const w = walk(t, { from: HERO_X - 52, to: HERO_X, start: WALK, end: ARRIVE, ...HERO })
  // ふんばる: 2回 ぐいっ と ひっぱる(1回目は だめ、2回目で ぬける)
  const tryAmt = Math.max(during(t, STRAIN + 0.05, STRAIN + 0.5, 0.1), during(t, STRAIN + 0.6, LIFT + 0.05, 0.1))
  const grip = span(t, GRIP, GRIP + 0.4, easeOut)
  const near: Limb = { to: [GRIP_NEAR[0], GRIP_NEAR[1] - lift] }
  const far: Limb = { to: [GRIP_FAR[0], GRIP_FAR[1] - lift] }
  const lookDove = during(t, DOVE_AT - 0.2, CROWNED - 0.1, 0.3)
  // あたま: おのを 見あげる → ふんばって うつむく → はとを 見あげる
  const head = t < STRAIN ? -7 * span(t, ARRIVE, ARRIVE + 0.3) : t < LIFT ? 6 * tryAmt : -8 * lookDove
  return {
    ...w,
    x: w.x + wave(t, 0.1) * 0.5 * tryAmt,
    y: GROUND_Y,
    pose: { ...w.pose, leftArm: mixLimb(w.pose.leftArm ?? HANG_ARM, near, grip), rightArm: mixLimb(w.pose.rightArm ?? HANG_ARM, far, grip), torso: 7 * tryAmt, head },
    opacity: span(t, WALK - 0.1, WALK + 0.1),
    face: t < STRAIN ? 'surprised' : t < LIFT + 0.1 ? 'strain' : 'joy',
    look: HERO_LOOK,
  }
}

/** こしの ベルト(きんの バックル)。体の まえに かさねる(held) */
function Belt({ hero }: { readonly hero: PersonProps }) {
  const rig = personRig(hero)
  const [px, py] = rig.world.pelvis
  const width = rig.body.torsoW * rig.scale
  const y = py - 0.04 * rig.scale * 100
  return (
    <Layer rotate={hero.pose?.torso ?? 0} origin={[px, py]}>
      <rect x={px - width / 2} y={y} width={width} height={2.2} rx={1} fill="#cf5c44" />
      <rect x={px + width * 0.12} y={y - 0.4} width={3.2} height={3} rx={0.8} fill={GOLD} />
    </Layer>
  )
}

/** 村の人(とおくの おかで まえむき)。見まもり、おのが あがると ばんざい */
function Villager({ x, y, look, cheer, t }: { readonly x: number; readonly y: number; readonly look: PersonProps['look']; readonly cheer: number; readonly t: number }) {
  const hop = cheer > 0 ? Math.abs(wave(t, 0.5)) * 2.2 * cheer : 0
  return <Person x={x} y={y} build="child" height={VILLAGER_HEIGHT} facing="front" look={look} face={cheer > 0.5 ? 'joy' : 'normal'} lift={hop} pose={mixPose(posture('stand', 'front'), posture('banzai', 'front'), cheer)} shadow={false} />
}

/** はと。王かんを あしで つかんで はこぶ(かえりは 右へ とんでいく)。 */
function Dove({ t, seat, crownScale }: { readonly t: number; readonly seat: readonly [number, number]; readonly crownScale: number }) {
  const arrive = span(t, DOVE_AT, DROP, easeOut)
  const leave = span(t, DROP + 0.15, DROP + 0.95, easeIn)
  if (arrive <= 0 || leave >= 1) return null
  const x = leave > 0 ? seat[0] + leave * 75 : seat[0] + (1 - arrive) * 75
  const y = leave > 0 ? DOVE_Y - leave * 14 : DOVE_Y + (1 - arrive) * 6 + wave(t, 0.5) * 0.4
  const carrying = t < DROP
  return (
    <>
      <Bird x={x} y={y} t={t} flying facing={leave > 0 ? 'right' : 'left'} size={1.25} color={DOVE} dark={DOVE_DARK} />
      {carrying && (
        <>
          <path d={`M${x - 2.5} ${y + 3.5} L${x - 3.2} ${y + 7.6} M${x + 2.5} ${y + 3.5} L${x + 3.2} ${y + 7.6}`} stroke="#f2a04a" strokeWidth="1.1" strokeLinecap="round" />
          <Crown x={x} y={y + CROWN_HANG} scale={crownScale} />
        </>
      )}
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  // おの: ずしんと ささる → もちあがる → どしんと おろす
  const fall = span(t, 0, LAND, easeIn)
  const lift = mix(t, LIFT, LIFT + 0.5, 0, LIFT_HEIGHT, easeOut) - mix(t, SET_DOWN, SET_DOWN + 0.35, 0, LIFT_HEIGHT, easeIn)
  const axeY = -(1 - fall) * 90 - lift
  // 地めんに ささった しゅんかん、はずむ
  const thud = Math.sin(span(t, LAND, LAND + 0.3) * Math.PI) * 1.4

  const hero = heroAt(t, lift)
  const crowned = t >= CROWNED
  const rig = personRig(hero)
  const headR = rig.body.headR * rig.scale
  const seat: readonly [number, number] = [rig.world.head[0], rig.world.head[1] - headR * CROWN_BASE]
  const crownScale = headR / CROWN_UNIT
  const fallP = span(t, DROP, CROWNED, easeIn)

  // むらの人: とおくで 見まもり、おのが あがると ばんざい
  const cheer = span(t, LIFT + 0.1, LIFT + 0.3) * (1 - span(t, SET_DOWN + 0.4, SET_DOWN + 0.7))
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const crown = crowned ? <Crown x={0} y={-CROWN_BASE} scale={1 / CROWN_UNIT} /> : undefined

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} />
        <Mound />
        {VILLAGERS.map((v) => (
          <Villager key={v.x} x={v.x} y={v.y} look={v.look} cheer={cheer} t={t + v.lag} />
        ))}
        <Layer y={axeY - thud}>
          <Axe t={t} />
        </Layer>
        <FrontGrass />
        <Dust x={SHAFT_X} y={GROUND_Y} p={span(t, LAND, LAND + 0.7, easeOut)} />
        <Dust x={SHAFT_X} y={GROUND_Y} p={span(t, LIFT, LIFT + 0.7, easeOut)} />
        <Dust x={SHAFT_X} y={GROUND_Y} p={span(t, SET_DOWN + 0.3, SET_DOWN + 1, easeOut)} />
        <Person {...hero} headwear={crown} held={<Belt hero={hero} />} />
        <Sweat t={t} x={rig.world.head[0] - headR - 1} y={rig.world.head[1] - 6} show={during(t, STRAIN + 0.1, LIFT + 0.1, 0.2)} />
        {fallP > 0 && !crowned && <Crown x={seat[0]} y={DOVE_Y + CROWN_HANG + (seat[1] - DOVE_Y - CROWN_HANG) * fallP} rotate={Math.sin(fallP * Math.PI * 2) * 8} scale={crownScale} />}
        <Dove t={t} seat={seat} crownScale={crownScale} />
        {t >= CROWNED && t < CROWNED + 0.7 && <Star cx={seat[0] + 7} cy={seat[1] - 8} r={3 * (1 - span(t, CROWNED, CROWNED + 0.7))} color="#ffffff" spin={t * 200} />}
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
    { at: 0, label: '大きな おのが ずしんと ささる', sound: 'pop' },
    { at: WALK, label: 'わかものが あるいてきて、おのを 見あげる' },
    { at: GRIP, label: 'えを つかんで ぐいっ…ぐいっ…' },
    { at: LIFT, label: 'ぬけた! おのが もちあがる', sound: 'pop' },
    { at: DOVE_AT, label: 'はとが 王かんを はこんでくる' },
    { at: CROWNED, label: '王かんを かぶって、おのを どしんと たてる', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '王 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
