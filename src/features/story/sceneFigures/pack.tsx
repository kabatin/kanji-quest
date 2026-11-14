import type { Proportions, View } from './body'
import { packSize, type PackKind } from './packSize'
import { shade } from './palette'

/**
 * せなか に せおう かばん(ランドセル・リュック)。<Person pack="randoseru" /> と わたすと、Person が 体の中 の 座標 で 描く
 * (体 と いっしょに 大きさ・かたむき・ふりむき の ちぢみ が つくので、ずれない)。
 * 大きさ は 体格 の どう・かた から きめる(幼児 から おとな まで、その 体 に 合う)。
 *
 * 前後 の かさなり(ほんものの 体 の とおり):
 *   横むき   … かばん は せなか がわ。むこうの うで は かばん の おく、てまえ の うで は かばん の まえ を 通る。
 *              てまえ の かたひも は かた を こえて むね の まえ へ。
 *   正面     … かばん は 体 に かくれ、かたひも だけ 見える(うで は ひも の まえ)。
 *   うしろむき … かばん が せなか に かさなる。かた から たらした うで は かばん の おく(かばん が うで の 内がわ に かかる)。
 *              かばん より 見る人 の ほうへ 大きく ふった うで だけ、かばん の まえ。
 */

const CLASP = '#f2c14e'
const r2 = (n: number) => Math.round(n * 100) / 100

type PackProps = { readonly kind: PackKind; readonly color: string; readonly body: Proportions }

/** 横むき(+x が まえ): せなか の かばん と、てまえ の かたひも */
function SidePack({ kind, color, body }: PackProps) {
  const { top, height: h, thick } = packSize(kind, body)
  const back = -body.torsoW / 2
  const x0 = back - thick + 0.8
  const x1 = back + 1.4
  const r = thick * (kind === 'rucksack' ? 0.45 : 0.3)
  const edge = shade(color, 0.14)
  const strapColor = kind === 'rucksack' ? shade(color, 0.45) : shade(color, 0.08)
  return (
    <>
      <rect x={r2(x0)} y={r2(top)} width={r2(x1 - x0)} height={r2(h)} rx={r2(r)} fill={color} />
      {kind === 'randoseru' ? (
        <>
          {/* かぶせ(ふた)の へり: 上 と うしろ の 面 を おおう。下の はし に 金具 */}
          <path d={`M${r2(x1)} ${r2(top + 2.6)} V${r2(top + r)} Q${r2(x1)} ${r2(top)} ${r2(x1 - r)} ${r2(top)} H${r2(x0 + r)} Q${r2(x0)} ${r2(top)} ${r2(x0)} ${r2(top + r)} V${r2(top + h * 0.78)} H${r2(x0 + 2.6)} V${r2(top + 2.6)} Z`} fill={edge} />
          <rect x={r2(x0 - 0.5)} y={r2(top + h * 0.7)} width="1.6" height="2.6" rx="0.6" fill={CLASP} />
        </>
      ) : (
        <>
          {/* ふた と、よこ の ポケット */}
          <rect x={r2(x0)} y={r2(top)} width={r2(x1 - x0)} height={r2(h * 0.3)} rx={r2(r)} fill={edge} />
          <rect x={r2(x0 + thick * 0.14)} y={r2(top + h * 0.52)} width={r2(thick * 0.6)} height={r2(h * 0.36)} rx={r2(thick * 0.18)} fill={shade(color, 0.08)} />
        </>
      )}
      {/* てまえ の かたひも: かばん の 上 から かた を こえて むね の まえ へ、わき の 下 を 通って かばん の 下 へ */}
      <path
        d={`M${r2(x1 - 1)} ${r2(top + 1.6)} Q${r2(body.shoulderX - 2.5)} ${r2(-body.torso - 3)} ${r2(body.torsoW * 0.29)} ${r2(-body.torso * 0.73)} Q${r2(body.torsoW * 0.37)} ${r2(-body.torso * 0.6)} ${r2(body.torsoW * 0.32)} ${r2(-body.torso * 0.47)} Q${r2(body.torsoW * 0.1)} ${r2(-body.torso * 0.3)} ${r2(back + 2)} ${r2(top + h * 0.92)}`}
        fill="none"
        stroke={strapColor}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  )
}

/** 正面: かたひも だけ(かた から むね へ おりて、わき の 下 へ まがる)。リュック は むね の ベルト も */
function FrontStraps({ kind, color, body }: PackProps) {
  const x = body.shoulderHalf * 0.58
  const strapColor = kind === 'rucksack' ? shade(color, 0.45) : color
  const side = (s: number) => `M${r2(s * x)} ${r2(-body.torso - 0.6)} V${r2(-body.torso * 0.44)} Q${r2(s * x * 1.05)} ${r2(-body.torso * 0.32)} ${r2(s * (body.torsoFrontW / 2 - 1.4))} ${r2(-body.torso * 0.28)}`
  return (
    <g fill="none" stroke={strapColor} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={side(-1)} />
      <path d={side(1)} />
      {kind === 'rucksack' && <path d={`M${r2(-x)} ${r2(-body.torso * 0.62)} H${r2(x)}`} strokeWidth="1.2" />}
    </g>
  )
}

/** うしろむき: せなか の かばん。かた に かかる ひも の ねもと も 見える */
function BackPack({ kind, color, body }: PackProps) {
  const { top, height: h, width: w } = packSize(kind, body)
  const half = w / 2
  const strapColor = kind === 'rucksack' ? shade(color, 0.45) : color
  const lip = shade(color, 0.14)
  const straps = (
    <path d={`M${r2(-half * 0.6)} ${r2(top + 2)} L${r2(-body.shoulderHalf * 0.62)} ${r2(-body.torso - 0.4)} M${r2(half * 0.6)} ${r2(top + 2)} L${r2(body.shoulderHalf * 0.62)} ${r2(-body.torso - 0.4)}`} stroke={strapColor} strokeWidth="2.6" strokeLinecap="round" />
  )
  if (kind === 'rucksack') {
    const round = Math.min(half, h * 0.4)
    return (
      <>
        {straps}
        <path d={`M${r2(-half)} ${r2(top + h - 2.4)} V${r2(top + round)} Q${r2(-half)} ${r2(top)} 0 ${r2(top)} Q${r2(half)} ${r2(top)} ${r2(half)} ${r2(top + round)} V${r2(top + h - 2.4)} Q${r2(half)} ${r2(top + h)} ${r2(half - 2.4)} ${r2(top + h)} H${r2(-half + 2.4)} Q${r2(-half)} ${r2(top + h)} ${r2(-half)} ${r2(top + h - 2.4)} Z`} fill={color} />
        <path d={`M${r2(-half * 0.92)} ${r2(top + round * 0.9)} Q${r2(-half * 0.9)} ${r2(top + 0.4)} 0 ${r2(top + 0.4)} Q${r2(half * 0.9)} ${r2(top + 0.4)} ${r2(half * 0.92)} ${r2(top + round * 0.9)} Q${r2(half * 0.6)} ${r2(top + h * 0.4)} 0 ${r2(top + h * 0.4)} Q${r2(-half * 0.6)} ${r2(top + h * 0.4)} ${r2(-half * 0.92)} ${r2(top + round * 0.9)} Z`} fill={lip} />
        <rect x={r2(-half * 0.62)} y={r2(top + h * 0.56)} width={r2(half * 1.24)} height={r2(h * 0.34)} rx={r2(half * 0.3)} fill={shade(color, 0.08)} />
        <path d={`M${r2(-half * 0.44)} ${r2(top + h * 0.62)} H${r2(half * 0.44)}`} stroke={shade(color, 0.3)} strokeWidth="0.7" strokeLinecap="round" />
      </>
    )
  }
  return (
    <>
      {straps}
      {/* はこ → かぶせ(ふた。上 から 4分の3 まで)→ 金具 */}
      <rect x={r2(-half)} y={r2(top)} width={r2(w)} height={r2(h)} rx="3.2" fill={lip} />
      <path d={`M${r2(-half)} ${r2(top + 3.2)} Q${r2(-half)} ${r2(top)} ${r2(-half + 3.2)} ${r2(top)} H${r2(half - 3.2)} Q${r2(half)} ${r2(top)} ${r2(half)} ${r2(top + 3.2)} V${r2(top + h * 0.7)} Q${r2(half)} ${r2(top + h * 0.78)} ${r2(half - 3.6)} ${r2(top + h * 0.78)} H${r2(-half + 3.6)} Q${r2(-half)} ${r2(top + h * 0.78)} ${r2(-half)} ${r2(top + h * 0.7)} Z`} fill={color} />
      <rect x="-1.1" y={r2(top + h * 0.66)} width="2.2" height="2.8" rx="0.6" fill={CLASP} />
    </>
  )
}

/** かばん(体の中 の 座標)。tilt は 上体 の かたむき(どう と いっしょに まわる) */
export function Pack({ kind, color, body, view, tilt }: PackProps & { readonly view: View; readonly tilt: number }) {
  return (
    <g transform={`rotate(${r2(tilt)})`} data-part="pack">
      {view === 'side' && <SidePack kind={kind} color={color} body={body} />}
      {view === 'front' && <FrontStraps kind={kind} color={color} body={body} />}
      {view === 'back' && <BackPack kind={kind} color={color} body={body} />}
    </g>
  )
}
