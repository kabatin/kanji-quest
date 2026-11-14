import { byTime, PALETTE, shade } from './palette'
import { Moon } from './sky'

/**
 * へや の 中(かべ・ゆか・はばき・まど)。外の 背景(Backdrop)の かわりに いちばん 下に おく。
 * floor は かべ と ゆか の さかいめ の y。人は floor より 下(ゆか の 上)に 立たせる(y = 96 など)。
 * time は 0 = 昼、1 = 夕方、2 = 夜。まど の 外の 空 と、かべ の 色(夜は あかり で あたたかい 色)が かわる。
 */

const r2 = (n: number) => Math.round(n * 100) / 100

export type WindowSpot = readonly [x: number, y: number, width: number, height: number]

/** まど(わく・十字の さん・まどべ)。外の 空は time で かわる。curtain に 色を わたすと カーテン を つける */
export function Window({ x, y, width, height, time = 0, curtain }: { readonly x: number; readonly y: number; readonly width: number; readonly height: number; readonly time?: number; readonly curtain?: string }) {
  const frame = 1.4
  const night = Math.min(1, Math.max(0, time - 1))
  return (
    <g data-part="window">
      <rect x={r2(x - frame)} y={r2(y - frame)} width={r2(width + frame * 2)} height={r2(height + frame * 2)} rx="0.8" fill={PALETTE.furniture} />
      <rect x={x} y={y} width={width} height={height} fill={byTime(time, '#cfe9fb', PALETTE.skyEvening, PALETTE.skyNight)} />
      {/* 外: 昼 は 雲、夜 は 月 */}
      {night < 1 && <ellipse cx={r2(x + width * 0.3)} cy={r2(y + height * 0.6)} rx={r2(width * 0.16)} ry={r2(height * 0.08)} fill="#ffffff" opacity={r2(0.85 * (1 - night))} />}
      <Moon x={x + width * 0.72} y={y + height * 0.3} r={Math.min(width, height) * 0.12} phase="crescent" show={night} />
      <path d={`M${r2(x + width / 2)} ${y} v${height} M${x} ${r2(y + height / 2)} h${width}`} stroke={PALETTE.furniture} strokeWidth="1.1" />
      <rect x={r2(x - frame * 1.8)} y={r2(y + height + frame - 0.2)} width={r2(width + frame * 3.6)} height="1.6" rx="0.6" fill={PALETTE.furnitureDark} />
      {curtain && (
        <>
          <path d={`M${r2(x - frame * 1.6)} ${r2(y - frame * 1.6)} h${r2(width * 0.22)} q${r2(-width * 0.06)} ${r2(height * 0.55)} ${r2(-width * 0.04)} ${r2(height * 1.05)} h${r2(-width * 0.18)} Z`} fill={curtain} />
          <path d={`M${r2(x + width + frame * 1.6)} ${r2(y - frame * 1.6)} h${r2(-width * 0.22)} q${r2(width * 0.06)} ${r2(height * 0.55)} ${r2(width * 0.04)} ${r2(height * 1.05)} h${r2(width * 0.18)} Z`} fill={curtain} />
        </>
      )}
    </g>
  )
}

/** へや。window={null} で まど なし */
export function Room({
  floor = 80,
  time = 0,
  window: win = [62, 18, 30, 24],
  wall = PALETTE.wallRoom,
  floorColor = PALETTE.floorWood,
  curtain,
}: {
  readonly floor?: number
  readonly time?: number
  readonly window?: WindowSpot | null
  readonly wall?: string
  readonly floorColor?: string
  readonly curtain?: string
}) {
  const wallColor = byTime(time, wall, wall, PALETTE.wallRoomNight)
  const seam = shade(floorColor, 0.12)
  return (
    <g data-part="room">
      <rect x="-2" y="-2" width="113" height={r2(floor + 2)} fill={wallColor} />
      {/* かべ の 下の ほう を 少し こく(おくゆき) */}
      <rect x="-2" y={r2(floor - 8)} width="113" height="8" fill={shade(wallColor, 0.04)} />
      <rect x="-2" y={floor} width="113" height={r2(111 - floor)} fill={floorColor} />
      {/* ゆか の いた の つぎめ(てまえ ほど 間が ひろい) */}
      {[3.5, 9, 17].map((d) => (
        <path key={d} d={`M-2 ${r2(floor + d)} H111`} stroke={seam} strokeWidth="0.5" />
      ))}
      <rect x="-2" y={r2(floor - 2)} width="113" height="2" fill={PALETTE.furnitureDark} />
      {win && <Window x={win[0]} y={win[1]} width={win[2]} height={win[3]} time={time} curtain={curtain} />}
    </g>
  )
}
