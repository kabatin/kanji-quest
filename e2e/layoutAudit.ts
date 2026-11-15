import type { Page } from '@playwright/test'

/**
 * 画面の「文字のはみ出し」「部品の重なり」「画面の外」「キツキツ」を、ブラウザの中で数える点検の道具。
 *
 * - 文字のはみ出し: 文字が、枠(背景・線のある一番近い親)や、はしを切る親(overflow: hidden)の外に出ている。
 *   「…」にする所(text-overflow: ellipsis)と、中がスクロールする入れ物(overflow: auto/scroll)は数えない。
 * - 重なり: 同じ親の きょうだい、または 押す物どうしの箱が かさなっている。
 *   重ねる作りの物は、data-overlap-ok を付ける(その子孫も除く)。
 * - 画面の外: 見えている押す物が画面の外に出ている。ページ全体のスクロール。
 * - キツキツ: 押す物どうしが 8px 未満、部品どうしが 6px 未満、文字が枠に 2px 未満で 近い。
 */
export type Issue = { readonly kind: 'text-out' | 'text-clip' | 'box-scroll' | 'overlap' | 'offscreen' | 'page-scroll' | 'tight'; readonly what: string; readonly detail: string }

export type AuditOptions = {
  /** 点検に入れる「キツキツ」の基準(0 で切る) */
  readonly tight?: boolean
  /** 点検の根っこ(省くと、ダイアログが出ていればその中、なければ .app) */
  readonly root?: string
}

/** 出てくる動きが おわるのを待つ(ずっと回る物は待たない) */
export async function settle(page: Page): Promise<void> {
  // スマホで 高さが たりない端末は、ページぜんたいを ちぢめる(viewportFit)。ちぢみおわるのを待つ
  await page.waitForFunction(() => !window.matchMedia('(max-height: 500px)').matches || window.innerHeight >= 430, undefined, { timeout: 3000 }).catch(() => undefined)
  await page.evaluate(async () => {
    for (let i = 0; i < 3; i += 1) {
      const running = document.getAnimations().filter((an) => an.effect?.getComputedTiming().iterations !== Infinity)
      await Promise.all(running.map((an) => an.finished.catch(() => undefined)))
      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)))
    }
    // ずっと くりかえす動き(ふくらむ・はねる)は、元の大きさで はかるため 止める
    for (const an of document.getAnimations()) if (an.effect?.getComputedTiming().iterations === Infinity) an.cancel()
  })
}

/** いまの画面を点検して、見つけた物の一覧を返す。 */
export async function auditLayout(page: Page, options: AuditOptions = {}): Promise<Issue[]> {
  await settle(page)
  return page.evaluate(runAudit, { tight: options.tight ?? true, root: options.root ?? null })
}

/** 一覧を、人が読む1行ずつに直す */
export function formatIssues(issues: readonly Issue[]): string[] {
  return issues.map((i) => `[${i.kind}] ${i.what} ${i.detail}`)
}

/** ブラウザの中で動く本体(page.evaluate に渡すため、この関数だけで完結させる) */
function runAudit({ tight, root }: { tight: boolean; root: string | null }): Issue[] {
  const issues: Issue[] = []
  const TOL = 1
  const vw = document.documentElement.clientWidth
  const vh = document.documentElement.clientHeight
  const dialogs = [...document.querySelectorAll<HTMLElement>('[role="dialog"], .modal, .cdetail')].filter((d) => d.getBoundingClientRect().width > 0)
  const scope: HTMLElement = (root ? document.querySelector<HTMLElement>(root) : null) ?? dialogs[dialogs.length - 1] ?? document.querySelector<HTMLElement>('.app') ?? document.body

  const name = (el: Element): string => {
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''
    const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 14)
    return `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ''}${text ? `「${text}」` : ''}`
  }
  const px = (r: DOMRect) => `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`
  // 角に重ねて付ける しるし(王かん・赤い点・右上の数・すみまる)は、重ねる作り
  const OVERLAP_OK = '[data-overlap-ok], [data-audit-skip], svg, .sr-only, .limit-soon, .parts-card__crown, .parts-card__dot, .dock-btn__badge, .map-node__mascot'
  const skipped = (el: Element) => !!el.closest(OVERLAP_OK)
  const visible = (el: Element): boolean => {
    const r = el.getBoundingClientRect()
    if (r.width < 1 || r.height < 1) return false
    // とじている <details> の 中身は 見えない(summary だけ 見える)
    const closed = el.closest('details:not([open])')
    if (closed && !el.closest('summary') && el !== closed) return false
    for (let cur: Element | null = el; cur && cur !== document.body; cur = cur.parentElement) {
      const cs = getComputedStyle(cur)
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) return false
    }
    return true
  }
  const scrolls = (cs: CSSStyleDeclaration, axis: 'x' | 'y') => /auto|scroll/.test(axis === 'x' ? cs.overflowX : cs.overflowY)
  const clips = (cs: CSSStyleDeclaration, axis: 'x' | 'y') => /hidden|clip/.test(axis === 'x' ? cs.overflowX : cs.overflowY)
  const isFrame = (el: Element, cs: CSSStyleDeclaration): boolean => {
    if (el === document.body || el === document.documentElement || el.classList.contains('app')) return false
    const bg = cs.backgroundColor
    const hasBg = bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent'
    const hasBorder = ['Top', 'Right', 'Bottom', 'Left'].some((s) => parseFloat(cs.getPropertyValue(`border${s}Width`)) > 0 && cs.getPropertyValue(`border${s}Style`) !== 'none')
    return hasBg || cs.backgroundImage !== 'none' || hasBorder
  }

  // --- 文字のはみ出し ---
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT)
  const seenText = new Set<string>()
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement
    if (!parent || !(node.textContent ?? '').trim() || skipped(parent) || !visible(parent)) continue
    if (['SCRIPT', 'STYLE', 'OPTION'].includes(parent.tagName)) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0)
    if (rects.length === 0) continue
    const box = rects.reduce((a, r) => new DOMRect(Math.min(a.left, r.left), Math.min(a.top, r.top), Math.max(a.right, r.right) - Math.min(a.left, r.left), Math.max(a.bottom, r.bottom) - Math.min(a.top, r.top)))
    let framed = false
    for (let cur: HTMLElement | null = parent; cur && cur !== document.documentElement; cur = cur.parentElement) {
      const cs = getComputedStyle(cur)
      const r = cur.getBoundingClientRect()
      const ellipsis = cs.textOverflow === 'ellipsis' && clips(cs, 'x')
      const lineClamp = cs.getPropertyValue('-webkit-line-clamp') !== 'none' && cs.getPropertyValue('-webkit-line-clamp') !== ''
      const sx = scrolls(cs, 'x')
      const sy = scrolls(cs, 'y')
      if ((sx && sy) || cur === scope.parentElement) break
      const outX = !sx && !ellipsis && (box.left < r.left - TOL || box.right > r.right + TOL)
      const tolY = TOL + box.height * 0.15
      const outY = !sy && !lineClamp && (box.top < r.top - tolY || box.bottom > r.bottom + tolY)
      const clipY = !sy && !lineClamp && (box.top < r.top - TOL - box.height * 0.3 || box.bottom > r.bottom + TOL + box.height * 0.3)
      const clipped = (outX && clips(cs, 'x')) || (clipY && clips(cs, 'y'))
      const key = `${name(parent)}@${cur.className}`
      if (clipped && !seenText.has(key)) {
        seenText.add(key)
        issues.push({ kind: 'text-clip', what: name(parent), detail: `切れている 親=${name(cur)} 文字=${px(box)} 親=${px(r)}` })
      } else if (!framed && isFrame(cur, cs) && (outX || outY) && !seenText.has(key)) {
        seenText.add(key)
        issues.push({ kind: 'text-out', what: name(parent), detail: `枠=${name(cur)} 文字=${px(box)} 枠=${px(r)}` })
      } else if (!framed && tight && isFrame(cur, cs) && cur.tagName !== 'BODY' && r.width < vw * 0.9) {
        const gapX = Math.min(box.left - r.left, r.right - box.right)
        if (gapX < 2 && r.height < 200 && !seenText.has(key)) {
          seenText.add(key)
          issues.push({ kind: 'tight', what: name(parent), detail: `文字が枠に近い 左右=${gapX.toFixed(1)} 枠=${name(cur)} ${px(r)}` })
        }
      }
      if (isFrame(cur, cs)) framed = true
      if (framed && !clips(cs, 'x') && !clips(cs, 'y')) {
        // 枠を見つけたあとも、はしを切る親が あれば見る
        continue
      }
    }
  }
  // 入力らん
  for (const input of scope.querySelectorAll<HTMLInputElement>('input[type="text"], input:not([type]), textarea')) {
    if (visible(input) && input.scrollWidth > input.clientWidth + TOL) issues.push({ kind: 'box-scroll', what: name(input), detail: `scrollWidth=${input.scrollWidth} clientWidth=${input.clientWidth}` })
  }
  // 中身が箱より大きいボタン・見出し(切っているのに「…」でも スクロールでもない物)
  for (const el of scope.querySelectorAll<HTMLElement>('button, h1, h2, h3, h4, [class*="chip"], [class*="badge"], [class*="label"], [class*="card"], [class*="bubble"]')) {
    if (skipped(el) || !visible(el)) continue
    const cs = getComputedStyle(el)
    if (cs.display === 'inline') continue
    const ellipsis = cs.textOverflow === 'ellipsis'
    const lineClamp = cs.getPropertyValue('-webkit-line-clamp') !== 'none' && cs.getPropertyValue('-webkit-line-clamp') !== ''
    // 右上の数のバッジなど、わざと はみ出して 置く物(position: absolute)は 数えない
    const r = el.getBoundingClientRect()
    const flow = [...el.children].filter((c) => !skipped(c) && visible(c) && !/absolute|fixed/.test(getComputedStyle(c).position))
    const over = flow.filter((c) => {
      const cr = c.getBoundingClientRect()
      const tolY = TOL + cr.height * 0.15
      return (!ellipsis && !scrolls(cs, 'x') && (cr.left < r.left - TOL || cr.right > r.right + TOL)) || (!lineClamp && !scrolls(cs, 'y') && (cr.top < r.top - tolY || cr.bottom > r.bottom + tolY))
    })
    if (over.length > 0) {
      const key = `box@${name(el)}`
      if (!seenText.has(key)) {
        seenText.add(key)
        issues.push({ kind: 'box-scroll', what: name(el), detail: `はみ出す子=${over.map(name).join(' / ')} 箱=${px(r)}` })
      }
    }
  }

  // --- 画面の外 ---
  const root0 = document.documentElement
  if (root0.scrollWidth > vw + TOL || root0.scrollHeight > vh + TOL) issues.push({ kind: 'page-scroll', what: 'ページ全体', detail: `scroll=${root0.scrollWidth}x${root0.scrollHeight} 画面=${vw}x${vh}` })
  const interactiveSel = 'button, a[href], input, select, textarea, [role="button"], [role="tab"], [role="switch"], [role="radio"]'
  const pressables = [...scope.querySelectorAll<HTMLElement>(interactiveSel)].filter((el) => !skipped(el) && visible(el))
  const scrollAncestor = (el: HTMLElement): boolean => {
    for (let cur = el.parentElement; cur && cur !== document.body; cur = cur.parentElement) {
      const cs = getComputedStyle(cur)
      if (scrolls(cs, 'x') || scrolls(cs, 'y')) return true
    }
    return false
  }
  for (const el of pressables) {
    const r = el.getBoundingClientRect()
    if ((r.left < -TOL || r.top < -TOL || r.right > vw + TOL || r.bottom > vh + TOL) && !scrollAncestor(el)) issues.push({ kind: 'offscreen', what: name(el), detail: px(r) })
  }

  // --- 重なり・キツキツ ---
  type Rect = { readonly el: HTMLElement; readonly r: DOMRect }
  const gapOf = (a: DOMRect, b: DOMRect) => {
    const dx = Math.max(a.left - b.right, b.left - a.right)
    const dy = Math.max(a.top - b.bottom, b.top - a.bottom)
    return { dx, dy, overlap: dx < -TOL && dy < -TOL, gap: Math.max(dx, dy) }
  }
  const related = (a: Element, b: Element) => a.contains(b) || b.contains(a)
  const hasPaint = (el: HTMLElement): boolean => {
    const cs = getComputedStyle(el)
    if (cs.pointerEvents === 'none') return false
    if (el.matches(interactiveSel)) return true
    return (el.textContent ?? '').trim().length > 0
  }
  // 小さな ますを ぎっしり ならべた物(習熟マップ)と、つながった切りかえボタンは、すきまが せまいのが 作り
  const DENSE = '.mcell, .pseg__btn'
  const isBox = (el: HTMLElement) => el.matches(interactiveSel) || isFrame(el, getComputedStyle(el))
  const reported = new Set<string>()
  const compare = (a: Rect, b: Rect, limit: number, label: string) => {
    if (related(a.el, b.el) || skipped(a.el) || skipped(b.el)) return
    const g = gapOf(a.r, b.r)
    const key = `${name(a.el)}|${name(b.el)}`
    if (reported.has(key)) return
    if (g.overlap) {
      reported.add(key)
      issues.push({ kind: 'overlap', what: `${name(a.el)} × ${name(b.el)}`, detail: `${px(a.r)} / ${px(b.r)} (${label})` })
    } else if (tight && !(a.el.matches(DENSE) && b.el.matches(DENSE)) && g.gap < limit && g.dx < limit && g.dy < limit && isBox(a.el) && isBox(b.el)) {
      reported.add(key)
      issues.push({ kind: 'tight', what: `${name(a.el)} と ${name(b.el)}`, detail: `すきま ${g.gap.toFixed(1)}px ${px(a.r)} / ${px(b.r)} (${label})` })
    }
  }
  const pressRects: Rect[] = pressables.map((el) => ({ el, r: el.getBoundingClientRect() }))
  for (let i = 0; i < pressRects.length; i += 1) for (let j = i + 1; j < pressRects.length; j += 1) compare(pressRects[i], pressRects[j], 8, '押す物')
  for (const parent of [scope, ...scope.querySelectorAll<HTMLElement>('*')]) {
    if (skipped(parent) || !visible(parent)) continue
    const kids = [...parent.children].filter((c): c is HTMLElement => c instanceof HTMLElement && !skipped(c) && visible(c) && hasPaint(c) && !(getComputedStyle(c).position === 'absolute' && !c.matches(interactiveSel) && getComputedStyle(c).zIndex !== 'auto' && false))
    for (let i = 0; i < kids.length; i += 1) for (let j = i + 1; j < kids.length; j += 1) compare({ el: kids[i], r: kids[i].getBoundingClientRect() }, { el: kids[j], r: kids[j].getBoundingClientRect() }, 6, '部品')
  }
  return issues
}
