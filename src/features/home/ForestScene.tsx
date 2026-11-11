/** 覚えた漢字 何字ごとに、森の木が1本ふえるか */
export const KANJI_PER_TREE = 6
const MAX_TREES = 36
/** 左右それぞれ、1列に植える本数 */
const SLOTS_PER_SIDE = 6
const ROWS = 3

type Tree = { readonly x: number; readonly y: number; readonly size: number }

/** 木を植える場所。奥の丘から手前へ、左右にばらけるように決まった計算で並べる。 */
function treeSpots(count: number): Tree[] {
  return Array.from({ length: count }, (_, i) => {
    // 画面のまんなか(すみまるが立つ所)は空けて、左右に交互に、奥の列から手前の列へ植える
    const side = i % 2 === 0 ? -1 : 1
    const order = Math.floor(i / 2)
    const row = Math.floor(order / SLOTS_PER_SIDE) % ROWS
    const slot = order % SLOTS_PER_SIDE
    return {
      x: 500 + side * (165 + slot * 60 + row * 24),
      y: 318 + row * 48 + (slot % 2) * 12,
      size: 0.5 + row * 0.2,
    }
  }).sort((a, b) => a.y - b.y)
}

type Props = {
  /** 覚えた漢字の数 */
  readonly learnedCount: number
  /** そらの時間帯(shop の名前: asa / yuu / yoru) */
  readonly sky: string
}

/**
 * ホームの景色。漢字を覚えるほど木がふえて、木 → 林 → 森 になっていく。
 * (漢字の「木・林・森」と同じ育ち方をする)
 */
export function ForestScene({ learnedCount, sky }: Props) {
  const treeCount = Math.min(Math.floor(learnedCount / KANJI_PER_TREE), MAX_TREES)
  const trees = treeSpots(treeCount)
  return (
    <svg className="forest" data-sky={sky} viewBox="0 0 1000 520" preserveAspectRatio="xMidYMax slice" role="img" aria-label={`そだった き ${treeCount}ほん`}>
      <rect className="forest__sky" width="1000" height="520" />
      {sky === 'yoru' ? (
        <g fill="#fff8d6">
          {Array.from({ length: 26 }, (_, i) => (
            <circle key={i} cx={(i * 173) % 1000} cy={20 + ((i * 97) % 210)} r={i % 4 === 0 ? 2.6 : 1.5} />
          ))}
          <path d="M800 50 A46 46 0 1 0 846 120 A36 36 0 1 1 800 50Z" fill="#ffe9a6" />
        </g>
      ) : (
        <>
          <circle className="forest__sun" cx={sky === 'yuu' ? 780 : 840} cy={sky === 'yuu' ? 250 : 90} r="54" />
          <g className="forest__clouds" fill="#fff" opacity="0.9">
            <path d="M120 110 a26 26 0 0 1 8 -50 a36 36 0 0 1 68 -8 a30 30 0 0 1 18 58 Z" />
            <path d="M560 70 a20 20 0 0 1 6 -38 a28 28 0 0 1 52 -6 a23 23 0 0 1 14 44 Z" />
          </g>
        </>
      )}
      <path className="forest__hill forest__hill--far" d="M0 330 Q180 230 380 300 T760 270 T1000 310 V520 H0 Z" />
      <path className="forest__hill forest__hill--mid" d="M0 380 Q250 300 520 360 T1000 350 V520 H0 Z" />
      <path className="forest__hill forest__hill--near" d="M0 440 Q300 390 560 430 T1000 420 V520 H0 Z" />
      {trees.map((tree, i) => (
        <g key={i} className="forest__tree" transform={`translate(${tree.x} ${tree.y}) scale(${tree.size})`}>
          <rect x="-7" y="-4" width="14" height="46" rx="5" fill="#8a5a3b" />
          <circle cx="0" cy="-30" r="34" />
          <circle cx="-24" cy="-10" r="24" />
          <circle cx="24" cy="-10" r="24" />
        </g>
      ))}
    </svg>
  )
}
