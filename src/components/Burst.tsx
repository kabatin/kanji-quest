const COLORS = ['#ffc233', '#e8452c', '#58b56b', '#3b9be0', '#ff7aa8'] as const
const PIECES = 28

/** 何かを達成したときの紙ふぶき。位置は決まった計算で散らすので、毎回同じ形になる。 */
export function Burst() {
  return (
    <div className="burst" aria-hidden="true">
      {Array.from({ length: PIECES }, (_, i) => {
        const angle = (i / PIECES) * Math.PI * 2
        const reach = 30 + ((i * 37) % 22)
        return (
          <span
            key={i}
            className="burst__piece"
            style={{
              background: COLORS[i % COLORS.length],
              ['--dx' as string]: `${Math.cos(angle) * reach}vmin`,
              ['--dy' as string]: `${Math.sin(angle) * reach}vmin`,
              ['--spin' as string]: `${(i % 2 === 0 ? 1 : -1) * (180 + i * 20)}deg`,
              animationDelay: `${(i % 5) * 30}ms`,
            }}
          />
        )
      })}
    </div>
  )
}
