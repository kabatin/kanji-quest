import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { MASCOT_FORM_COUNT } from '../../../lib/level'
import { itemName, SHOP_ITEMS } from '../../../lib/shop'
import { forestPlan, groundHeight, TREE_KINDS, TREE_STAGES } from './layout'
import { buildMascot } from './mascot3d'
import { buildCloud, buildDeco, buildFarIsland, buildInkstone, buildIsland, buildTree, seeded } from './props3d'

function meshCount(object: THREE.Object3D): number {
  let count = 0
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) count += 1
  })
  return count
}

function heightOf(object: THREE.Object3D): number {
  object.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(object)
  return box.max.y - box.min.y
}

describe('3D の すみまる', () => {
  it('すがた が進むほど、かざり が増えて 大きくなる', () => {
    const forms = Array.from({ length: MASCOT_FORM_COUNT }, (_, stage) => buildMascot(stage, 'none').group)
    const counts = forms.map(meshCount)
    const heights = forms.map(heightOf)
    for (let i = 1; i < forms.length; i += 1) {
      expect(counts[i]).toBeGreaterThan(counts[i - 1])
      expect(heights[i]).toBeGreaterThanOrEqual(heights[i - 1])
    }
    // 範囲の外の段階は、はじめ・さいごの すがた にする
    expect(meshCount(buildMascot(-3, 'none').group)).toBe(counts[0])
    expect(meshCount(buildMascot(99, 'none').group)).toBe(counts[counts.length - 1])
  })

  it('きせかえ の ぼうし は、ぜんぶ 3D の形がある', () => {
    const bare = meshCount(buildMascot(2, 'none').group)
    for (const item of SHOP_ITEMS.filter((i) => i.kind === 'hat' && i.price > 0)) {
      expect(meshCount(buildMascot(2, itemName(item.id)).group), item.id).toBeGreaterThan(bare)
    }
    expect(meshCount(buildMascot(2, 'nai').group)).toBe(bare)
  })

  it('息をして、まばたきし、さわると とぶ', () => {
    const mascot = buildMascot(7, 'kanmuri')
    const root = mascot.group.children[0]
    mascot.animate(1)
    expect(root.position.y).toBe(0)
    mascot.jump(1)
    mascot.animate(1.35)
    expect(root.position.y).toBeGreaterThan(0.5)
    // とんでいる とちゅうで もう一度さわっても、とびなおさない
    mascot.jump(1.4)
    mascot.animate(1.75)
    expect(root.position.y).toBe(0)
    mascot.animate(3.45)
    mascot.animate(3.9)
    expect(root.scale.y).toBeGreaterThan(0)
  })
})

describe('3D の しま', () => {
  it('木は、育つほど大きくなる(3種類とも)', () => {
    for (let kind = 0; kind < TREE_KINDS; kind += 1) {
      const heights = Array.from({ length: TREE_STAGES }, (_, i) => {
        const tree = buildTree({ x: 0, z: 0, stage: i + 1, kind }, 3)
        tree.scale.setScalar(1)
        return heightOf(tree)
      })
      expect(heights).toEqual([...heights].sort((a, b) => a - b))
      expect(heights[TREE_STAGES - 1]).toBeGreaterThan(heights[0] * 2)
    }
  })

  it('木は しまの地面の高さに立ち、同じ番号なら いつも同じ形になる', () => {
    const [plan] = forestPlan(1, 240)
    const tree = buildTree(plan, 0)
    expect(tree.position.y).toBeCloseTo(groundHeight(plan.x, plan.z) - 0.04)
    expect(buildTree(plan, 0).rotation.y).toBe(tree.rotation.y)
    expect(seeded(5)()).toBe(seeded(5)())
  })

  it('きせかえ の かざり は、ぜんぶ 3D の形がある', () => {
    for (const item of SHOP_ITEMS.filter((i) => i.kind === 'deco')) {
      const deco = buildDeco(itemName(item.id))
      expect(deco, item.id).not.toBeNull()
      expect(meshCount(deco as THREE.Group), item.id).toBeGreaterThan(2)
    }
    expect(buildDeco('nai')).toBeNull()
    expect(buildDeco('kazaguruma')?.getObjectByName('spin')).toBeDefined()
  })

  it('しま・すずり・雲・遠くの しま を作れる', () => {
    const island = buildIsland()
    expect(meshCount(island)).toBeGreaterThan(50)
    expect(island.getObjectByName('water')).toBeDefined()
    expect(meshCount(buildInkstone())).toBe(2)
    expect(meshCount(buildCloud('#ffffff', seeded(1)))).toBeGreaterThanOrEqual(4)
    expect(buildFarIsland(0.5).scale.x).toBe(0.5)
  })
})
