// KanjiVG の SVG から、部位のグループ構造を読み取る。
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const TAG = /<g ([^>]*)>|<\/g>|<path ([^>]*)\/>/g
// 「d=」が「id=」の一部に当たらないよう、属性名の前は行頭か空白に限る
const attr = (text, name) => text.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1]

/**
 * 1字分の構造を返す。
 * node = { element, position, phon, radical, part, strokes: number[], children: node[] }
 * strokes は、その部位に含まれるすべての画の番号(1始まり)。
 */
export function parseKanjiVG(svg) {
  const body = svg.slice(svg.indexOf('StrokePaths'), svg.indexOf('StrokeNumbers'))
  const root = { children: [], strokes: [], paths: [] }
  const stack = [root]
  for (const m of body.matchAll(TAG)) {
    const top = stack[stack.length - 1]
    if (m[1] !== undefined) {
      const node = {
        element: attr(m[1], 'kvg:element'),
        position: attr(m[1], 'kvg:position'),
        phon: attr(m[1], 'kvg:phon'),
        radical: attr(m[1], 'kvg:radical'),
        part: attr(m[1], 'kvg:part'),
        strokes: [],
        children: [],
        paths: [],
      }
      top.children.push(node)
      stack.push(node)
    } else if (m[2] !== undefined) {
      const n = Number(attr(m[2], 'id').match(/-s(\d+)$/)[1])
      top.paths.push({ n, d: attr(m[2], 'd') })
      for (const node of stack) node.strokes.push(n)
    } else {
      stack.pop()
    }
  }
  // root.children[0] は StrokePaths の枠、その中の最初の g が漢字そのもの
  const kanji = root.children[0]
  return { node: kanji, paths: root.strokes.length ? collectPaths(root) : [] }
}

function collectPaths(node) {
  return [...node.paths, ...node.children.flatMap(collectPaths)].sort((a, b) => a.n - b.n)
}

export function loadKanjiVG(dir, char) {
  const code = char.codePointAt(0).toString(16).padStart(5, '0')
  return parseKanjiVG(readFileSync(join(dir, `${code}.svg`), 'utf8'))
}

/**
 * 同じ部位が kvg:part で2つ以上に分かれているとき(国の「囗」など)、1つにまとめる。
 * 直接の子グループを、部位ごとに { element, position, phon, radical, strokes } で返す。
 */
export function topLevelParts(node) {
  const merged = []
  for (const child of node.children) {
    const prev = child.part && child.element ? merged.find((p) => p.element === child.element && p.split) : undefined
    if (prev) {
      prev.strokes = [...prev.strokes, ...child.strokes].sort((a, b) => a - b)
      prev.position ??= child.position
      prev.radical ??= child.radical
      continue
    }
    merged.push({
      element: child.element,
      position: child.position,
      phon: child.phon,
      radical: child.radical,
      split: Boolean(child.part),
      strokes: [...child.strokes],
      childCount: child.children.length,
    })
  }
  return { parts: merged, loose: node.paths.map((p) => p.n) }
}
