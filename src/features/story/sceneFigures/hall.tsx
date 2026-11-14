import { mixColor, PALETTE, shade } from './palette'

/**
 * 和室・お寺 の 教室(「学」の 場面 の きょうしつ を 部品 に した もの): たたみ・かわら の やね・はしら と、それを くみあわせた 広間。
 *   <Hall x={54.5} width={78} top={42} floor={90} front={105} />   // まえ が あいた 広間(おく の かべ・たたみ・はしら・やね)
 * どれも 正面 から 少し 上 を 見下ろした 形(たたみ は てまえ ほど 1まい が 大きい)。
 * 人 は floor 〜 front の あいだ(たたみ の 上)に すわらせる。黒板・つくえ・ひくい つくえ は furniture.tsx。
 */

const r2 = (n: number) => Math.round(n * 100) / 100

/**
 * たたみ の ゆか。x, y は おく の へり の 左はし、width・depth は 大きさ(depth は 画面 の 上下 の はば)。
 * 2れつ に ならべ、てまえ の れつ の つぎめ は 半分 ずらす(ほんもの の しきかた)
 */
export function Tatami({ x, y, width, depth, cols = 2 }: { readonly x: number; readonly y: number; readonly width: number; readonly depth: number; readonly cols?: number }) {
  const mid = y + depth * 0.45
  const n = Math.max(1, Math.round(cols))
  const back = Array.from({ length: n - 1 }, (_, i) => x + (width * (i + 1)) / n)
  const front = Array.from({ length: n }, (_, i) => x + (width * (i + 0.5)) / n)
  return (
    <g data-part="tatami">
      <rect x={x} y={y} width={width} height={depth} fill={PALETTE.tatami} />
      <path d={`M${x} ${r2(mid)} H${r2(x + width)} ${back.map((bx) => `M${r2(bx)} ${y} V${r2(mid)}`).join(' ')} ${front.map((fx) => `M${r2(fx)} ${r2(mid)} V${r2(y + depth)}`).join(' ')}`} stroke={PALETTE.tatamiLine} strokeWidth="0.8" />
    </g>
  )
}

/**
 * かわら の やね(正面 から)。x は まんなか、y は のき(やね の 下の はし)、width は のき の はば。
 * 上 へ すぼまる 台形 に、たて の かわら の すじ・のき の まるい かわら・てっぺん の むね。
 */
export function TiledRoof({ x, y, width, height, color = PALETTE.roofTile }: { readonly x: number; readonly y: number; readonly width: number; readonly height?: number; readonly color?: string }) {
  const h = height ?? width * 0.15
  const half = width / 2
  const topHalf = half * 0.84
  const dark = color === PALETTE.roofTile ? PALETTE.roofTileDark : shade(color, 0.18)
  const light = color === PALETTE.roofTile ? PALETTE.roofTileLight : mixColor(color, '#ffffff', 0.2)
  const ridgeY = y - h
  const lines = Math.max(4, Math.round(width / 4.2))
  const tiles = Math.max(6, Math.round(width / 3.6))
  return (
    <g data-part="roof">
      <path d={`M${r2(x - topHalf)} ${r2(ridgeY + 1.6)} L${r2(x + topHalf)} ${r2(ridgeY + 1.6)} L${r2(x + half - 0.8)} ${r2(y)} L${r2(x - half + 0.8)} ${r2(y)} Z`} fill={color} />
      {Array.from({ length: lines }, (_, i) => {
        const k = (i + 0.5) / lines
        return <path key={i} d={`M${r2(x - topHalf * 0.94 + topHalf * 1.88 * k)} ${r2(ridgeY + 3)} L${r2(x - (half - 2) + (half - 2) * 2 * k)} ${r2(y - 2)}`} stroke={dark} strokeWidth="0.8" strokeLinecap="round" />
      })}
      <rect x={r2(x - half)} y={r2(y - 2.2)} width={width} height="2.8" rx="1.2" fill={light} />
      {Array.from({ length: tiles }, (_, i) => (
        <circle key={i} cx={r2(x - half + 1.6 + ((width - 3.2) * i) / (tiles - 1))} cy={r2(y - 0.8)} r="0.75" fill={dark} />
      ))}
      <rect x={r2(x - topHalf - 1.4)} y={r2(ridgeY)} width={r2(topHalf * 2 + 2.8)} height="3.2" rx="1.6" fill={dark} />
    </g>
  )
}

/** 木 の はしら(x は まんなか、top から bottom まで)。日 の あたる 左 に ほそい ひかり */
export function Pillar({ x, top, bottom, width = 5, color = PALETTE.pillar }: { readonly x: number; readonly top: number; readonly bottom: number; readonly width?: number; readonly color?: string }) {
  return (
    <g data-part="pillar">
      <rect x={r2(x - width / 2)} y={top} width={width} height={r2(bottom - top)} fill={color} />
      <path d={`M${r2(x - width * 0.22)} ${r2(top + 3)} V${r2(bottom - 2.6)}`} stroke="#ddb184" strokeWidth={r2(width * 0.18)} />
    </g>
  )
}

/**
 * まえ が あいた 広間(お寺・和室 の 教室)。x は まんなか、width は はしら の 外 から 外 まで。
 * top は のき(かべ の 上)の y、floor は おく の かべ と たたみ の さかい、front は たたみ の てまえ の へり。
 * おく の かべ → なげし(よこ の 木)→ たたみ → えん(てまえ の ふち)→ はしら → やね の じゅん に かさねる。
 */
export function Hall({ x, width, top, floor, front, wall = PALETTE.wallRoom, roof = true }: { readonly x: number; readonly width: number; readonly top: number; readonly floor: number; readonly front: number; readonly wall?: string; readonly roof?: boolean }) {
  const pillar = Math.max(3, width * 0.064)
  const inner = width - pillar * 2
  const left = x - width / 2
  return (
    <g data-part="hall">
      <rect x={r2(left + pillar)} y={top} width={r2(inner)} height={r2(floor - top)} fill={wall} />
      <rect x={r2(left + pillar)} y={top} width={r2(inner)} height="2.2" fill={shade(wall, 0.05)} />
      <rect x={r2(left + pillar)} y={r2(top + (floor - top) * 0.11)} width={r2(inner)} height="2.2" fill={PALETTE.pillar} />
      <rect x={r2(left + pillar)} y={r2(floor - 1.2)} width={r2(inner)} height="1.4" fill={PALETTE.pillarDark} />
      <Tatami x={r2(left + pillar * 0.45)} y={floor} width={r2(width - pillar * 0.9)} depth={r2(front - floor)} />
      <rect x={r2(left - pillar * 0.6)} y={r2(front - 0.2)} width={r2(width + pillar * 1.2)} height="2.6" rx="0.6" fill={PALETTE.pillarDark} />
      <Pillar x={r2(left + pillar / 2)} top={top - 1} bottom={front + 0.4} width={pillar} />
      <Pillar x={r2(left + width - pillar / 2)} top={top - 1} bottom={front + 0.4} width={pillar} />
      {roof && <TiledRoof x={x} y={top + 0.8} width={width * 0.98} height={width * 0.14} />}
    </g>
  )
}
