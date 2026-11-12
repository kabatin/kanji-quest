import * as THREE from 'three'
import { groundHeight, ISLAND_RADIUS, POND, type TreePlan } from './layout'

type Vec3 = readonly [number, number, number]

const flat = (color: string, options: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, flatShading: true, ...options })

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, position: Vec3 = [0, 0, 0], shadow = true): THREE.Mesh {
  const result = new THREE.Mesh(geometry, material)
  result.position.set(...position)
  result.castShadow = shadow
  result.receiveShadow = true
  return result
}

/** いつも同じ結果になる、かんたんな乱数(見た目を毎回そろえるため)。 */
export function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

const GRASS_LIGHT = new THREE.Color('#8fd67f')
const GRASS_MID = new THREE.Color('#6cc46f')
const GRASS_DARK = new THREE.Color('#4fae5e')

/** 草に色の むら をつける(まんなかは明るく、ふちは こく、ところどころ まだらに)。 */
function paintGrass(geometry: THREE.BufferGeometry): void {
  const position = geometry.getAttribute('position')
  const colors = new Float32Array(position.count * 3)
  const color = new THREE.Color()
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i)
    const z = position.getZ(i)
    const edge = Math.min(Math.hypot(x, z) / ISLAND_RADIUS, 1)
    const patch = (Math.sin(x * 1.3 + z * 0.7) + Math.cos(z * 1.7 - x * 0.4)) * 0.25 + 0.5
    color.copy(GRASS_LIGHT).lerp(GRASS_MID, Math.min(patch + edge * 0.4, 1)).lerp(GRASS_DARK, edge * edge * 0.7)
    colors.set([color.r, color.g, color.b], i * 3)
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
}

/** 空にうかぶ しま。上は草の丘、下は岩。 */
export function buildIsland(): THREE.Group {
  const island = new THREE.Group()
  const profile = Array.from({ length: 14 }, (_, i) => {
    const r = (i / 13) * ISLAND_RADIUS
    return new THREE.Vector2(r, groundHeight(r, 0))
  })
  // 外がわから まんなかへ向けて回すと、面が上を向く
  const grassGeometry = new THREE.LatheGeometry([...profile].reverse(), 56)
  // 面の向きから法線を作りなおす(光と影が、上を向いた面として当たるように)
  grassGeometry.computeVertexNormals()
  paintGrass(grassGeometry)
  const grass = mesh(grassGeometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }), [0, 0, 0], false)
  const rim = mesh(new THREE.CylinderGeometry(ISLAND_RADIUS, ISLAND_RADIUS * 0.94, 0.7, 56, 1, true), flat('#4fa85a'), [0, -0.35, 0], false)
  const soil = mesh(new THREE.CylinderGeometry(ISLAND_RADIUS * 0.94, ISLAND_RADIUS * 0.8, 1.2, 14), flat('#9a6b45'), [0, -1.3, 0], false)
  const rock = mesh(new THREE.ConeGeometry(ISLAND_RADIUS * 0.8, 6.5, 9), flat('#7b5a48'), [0, -5.1, 0], false)
  rock.rotation.x = Math.PI
  island.add(grass, rim, soil, rock)
  const random = seeded(7)
  // 下にぶらさがる小さな岩
  for (let i = 0; i < 7; i += 1) {
    const angle = random() * Math.PI * 2
    const r = 2.5 + random() * 4
    const stone = mesh(new THREE.ConeGeometry(0.7 + random() * 0.8, 2 + random() * 2.2, 6), flat('#6f5142'), [Math.cos(angle) * r, -3 - random() * 1.2, Math.sin(angle) * r], false)
    stone.rotation.x = Math.PI
    island.add(stone)
  }
  // 草むら・小さな花・石
  const tuft = new THREE.ConeGeometry(0.13, 0.34, 5)
  const flower = new THREE.SphereGeometry(0.09, 8, 6)
  const flowerColors = ['#ffffff', '#ffd95a', '#ff9ec4', '#ffb27a']
  for (let i = 0; i < 90; i += 1) {
    const angle = random() * Math.PI * 2
    const r = 1.6 + random() * (ISLAND_RADIUS - 2.1)
    const x = Math.cos(angle) * r
    const z = Math.sin(angle) * r
    if (Math.hypot(x - POND.x, z - POND.z) < POND.radius + 0.2) continue
    const y = groundHeight(x, z)
    if (i % 3 === 0) island.add(mesh(flower, flat(flowerColors[i % flowerColors.length]), [x, y + 0.1, z], false))
    else island.add(mesh(tuft, flat(i % 2 === 0 ? '#4fa85a' : '#8fd67f'), [x, y + 0.15, z], false))
  }
  // すみまるの所へつづく とび石
  for (let i = 0; i < 5; i += 1) {
    const z = 2.2 + i * 1.25
    const x = Math.sin(i * 1.3) * 0.5
    const stone = mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.12, 7), flat('#d9d2c2'), [x, groundHeight(x, z) + 0.03, z], false)
    stone.rotation.y = i
    island.add(stone)
  }
  island.add(buildPond(), buildWaterfall())
  return island
}

/** 池から しまの ふちへ流れて、下へ落ちる小さな たき。水の つぶ は islandScene が動かす。 */
export const WATERFALL = { x: -4.6, z: 7.6, height: 5.5 } as const
export const WATERFALL_DROPS = 14

function buildWaterfall(): THREE.Group {
  const fall = new THREE.Group()
  const water = new THREE.MeshStandardMaterial({ color: '#7fd0f0', roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.82 })
  // 池から ふち までの小川
  const dx = WATERFALL.x - POND.x
  const dz = WATERFALL.z - POND.z
  const length = Math.hypot(dx, dz)
  const stream = mesh(new THREE.BoxGeometry(0.8, 0.06, length), water, [(POND.x + WATERFALL.x) / 2, groundHeight((POND.x + WATERFALL.x) / 2, (POND.z + WATERFALL.z) / 2) + 0.03, (POND.z + WATERFALL.z) / 2], false)
  stream.rotation.y = Math.atan2(dx, dz)
  const sheet = mesh(new THREE.BoxGeometry(0.9, WATERFALL.height, 0.1), water, [WATERFALL.x * 1.045, -WATERFALL.height / 2, WATERFALL.z * 1.045], false)
  sheet.rotation.y = Math.atan2(WATERFALL.x, WATERFALL.z)
  fall.add(stream, sheet)
  const drops = new THREE.Group()
  drops.name = 'drops'
  const foam = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85 })
  for (let i = 0; i < WATERFALL_DROPS; i += 1) {
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.07 + (i % 3) * 0.02, 6, 5), foam)
    drop.position.set(WATERFALL.x * 1.06 + ((i % 5) - 2) * 0.1, 0, WATERFALL.z * 1.06 + ((i % 3) - 1) * 0.08)
    drop.userData.offset = i / WATERFALL_DROPS
    drops.add(drop)
  }
  fall.add(drops)
  return fall
}

/** しまの まわりを とぶ鳥。つばさ は islandScene が はばたかせる。 */
export function buildBird(color: string): THREE.Group {
  const bird = new THREE.Group()
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), flat(color))
  body.scale.set(1, 0.8, 1.7)
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 5), flat('#ffb23d'))
  beak.rotation.x = Math.PI / 2
  beak.position.z = 0.3
  bird.add(body, beak)
  for (const side of [-1, 1]) {
    const wing = new THREE.Group()
    const feather = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.22), flat(color))
    feather.position.x = side * 0.22
    wing.add(feather)
    wing.name = side < 0 ? 'wing-left' : 'wing-right'
    bird.add(wing)
  }
  return bird
}

function buildPond(): THREE.Group {
  const pond = new THREE.Group()
  const y = groundHeight(POND.x, POND.z)
  pond.add(mesh(new THREE.CylinderGeometry(POND.radius + 0.22, POND.radius + 0.3, 0.14, 24), flat('#cfc6b4'), [0, 0.02, 0], false))
  const water = mesh(
    new THREE.CylinderGeometry(POND.radius, POND.radius, 0.1, 32),
    new THREE.MeshStandardMaterial({ color: '#5cc1ea', emissive: '#bfeaff', emissiveIntensity: 0.12, roughness: 0.12, metalness: 0.25 }),
    [0, 0.07, 0],
    false,
  )
  water.name = 'water'
  const lily = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 12), flat('#3a8f4f'), [0.5, 0.14, -0.3], false)
  const bud = mesh(new THREE.SphereGeometry(0.11, 8, 6), flat('#ff9ec4'), [0.5, 0.22, -0.3], false)
  pond.add(water, lily, bud)
  pond.position.set(POND.x, y, POND.z)
  return pond
}

/** すみまるが立つ すずり(墨をする石)。 */
export function buildInkstone(): THREE.Group {
  const stone = new THREE.Group()
  stone.add(mesh(new THREE.CylinderGeometry(2.0, 2.15, 0.3, 8), flat('#3a3f55'), [0, 0.15, 0]))
  stone.add(mesh(new THREE.CylinderGeometry(1.66, 1.66, 0.06, 24), new THREE.MeshStandardMaterial({ color: '#141a36', roughness: 0.08, metalness: 0.3 }), [0, 0.3, 0], false))
  return stone
}

const CROWN_COLORS = [
  ['#3f9b52', '#58b56b', '#7fce84'],
  ['#2f7f5a', '#3f9b6b', '#5cb585'],
  ['#5fa83f', '#84c456', '#a9d97a'],
] as const
const BLOSSOM_COLORS = ['#ff6b5a', '#ffd95a', '#ffb3d1'] as const

function roundTree(kind: number, stage: number, random: () => number): THREE.Object3D[] {
  const colors = CROWN_COLORS[kind % CROWN_COLORS.length]
  const height = [0.45, 0.9, 1.4, 1.5][stage - 1]
  const parts: THREE.Object3D[] = [mesh(new THREE.CylinderGeometry(0.07 + stage * 0.03, 0.1 + stage * 0.045, height, 6), flat('#8a5a3b'), [0, height / 2, 0])]
  if (stage === 1) {
    return [...parts, mesh(new THREE.SphereGeometry(0.17, 6, 5), flat(colors[2]), [0.12, height, 0]), mesh(new THREE.SphereGeometry(0.15, 6, 5), flat(colors[1]), [-0.1, height + 0.08, 0.04])]
  }
  const size = [0, 0.62, 0.95, 1.05][stage - 1]
  parts.push(mesh(new THREE.IcosahedronGeometry(size, 1), flat(colors[1]), [0, height + size * 0.72, 0]))
  if (stage >= 3) {
    parts.push(mesh(new THREE.IcosahedronGeometry(size * 0.68, 1), flat(colors[0]), [-size * 0.62, height + size * 0.35, 0.15]))
    parts.push(mesh(new THREE.IcosahedronGeometry(size * 0.6, 1), flat(colors[2]), [size * 0.62, height + size * 0.5, -0.1]))
  }
  if (stage >= 4) {
    for (let i = 0; i < 7; i += 1) {
      const a = random() * Math.PI * 2
      const b = random() * 1.1
      parts.push(mesh(new THREE.SphereGeometry(0.11, 6, 5), flat(BLOSSOM_COLORS[kind % BLOSSOM_COLORS.length]), [Math.cos(a) * Math.cos(b) * size, height + size * 0.72 + Math.sin(b) * size, Math.sin(a) * Math.cos(b) * size]))
    }
  }
  return parts
}

function pineTree(stage: number): THREE.Object3D[] {
  const height = [0.4, 0.7, 1.0, 1.1][stage - 1]
  const parts: THREE.Object3D[] = [mesh(new THREE.CylinderGeometry(0.07 + stage * 0.02, 0.1 + stage * 0.035, height, 6), flat('#7a4f35'), [0, height / 2, 0])]
  const layers = stage === 1 ? 1 : stage + 1
  let top = height
  for (let i = 0; i < layers; i += 1) {
    const radius = (0.32 + stage * 0.17) * (1 - i / (layers + 1.5))
    const y = height + i * radius * 0.95 + radius * 0.45
    parts.push(mesh(new THREE.ConeGeometry(radius, radius * 1.5, 7), flat(i % 2 === 0 ? '#2f7f5a' : '#3f9b6b'), [0, y, 0]))
    top = y + radius * 0.75
  }
  // 育ちきった木の てっぺん には、星がつく
  if (stage >= 4) parts.push(mesh(new THREE.OctahedronGeometry(0.14), new THREE.MeshStandardMaterial({ color: '#ffc233', emissive: '#ffc233', emissiveIntensity: 0.5 }), [0, top + 0.12, 0]))
  return parts
}

/** 木1本。育ちぐあい(stage)で、なえ から 花や実のついた たいぼく まで変わる。 */
export function buildTree(plan: TreePlan, index: number): THREE.Group {
  const tree = new THREE.Group()
  const random = seeded(index * 31 + 5)
  const parts = plan.kind === 1 ? pineTree(plan.stage) : roundTree(plan.kind, plan.stage, random)
  tree.add(...parts)
  tree.position.set(plan.x, groundHeight(plan.x, plan.z) - 0.04, plan.z)
  tree.rotation.y = random() * Math.PI * 2
  tree.scale.setScalar(0.8 + random() * 0.25)
  tree.userData.phase = random() * Math.PI * 2
  return tree
}

type DecoBuilder = () => THREE.Object3D[]

/** しまに置く かざり(shop の deco の名前 → 3D の形) */
const DECOS: Readonly<Record<string, DecoBuilder>> = {
  hana: () => {
    const colors = ['#ff6b8a', '#ffd95a', '#ffffff', '#c08bff', '#ff9a5a']
    const flowers = Array.from({ length: 14 }, (_, i) => {
      const angle = i * 2.4
      const r = 0.25 + (i % 5) * 0.2
      const group = new THREE.Group()
      group.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.32, 5), flat('#3a8f4f'), [0, 0.16, 0], false))
      group.add(mesh(new THREE.SphereGeometry(0.12, 7, 6), flat(colors[i % colors.length]), [0, 0.36, 0]))
      group.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r)
      return group
    })
    return [mesh(new THREE.CylinderGeometry(1.15, 1.2, 0.1, 10), flat('#8a5a3b'), [0, 0.05, 0], false), ...flowers]
  },
  bench: () => {
    const wood = flat('#c98d54')
    const back = mesh(new THREE.BoxGeometry(1.5, 0.5, 0.08), wood, [0, 0.82, -0.2])
    const legs = [-0.62, 0.62].map((x) => mesh(new THREE.BoxGeometry(0.1, 0.42, 0.4), flat('#6f4a2f'), [x, 0.21, 0]))
    return [mesh(new THREE.BoxGeometry(1.5, 0.09, 0.5), wood, [0, 0.45, 0]), back, ...legs]
  },
  kinoko: () => {
    const cap = mesh(new THREE.SphereGeometry(1.0, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), flat('#e8452c'), [0, 0.95, 0])
    const dots = [0, 1.4, 2.7, 4.1, 5.2].map((a, i) => mesh(new THREE.SphereGeometry(0.16, 8, 6), flat('#ffffff'), [Math.cos(a) * 0.62, 1.5 + (i % 2) * 0.2, Math.sin(a) * 0.62], false))
    const door = mesh(new THREE.BoxGeometry(0.3, 0.5, 0.06), flat('#8a5a3b'), [0, 0.25, 0.6])
    const glow = mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshStandardMaterial({ color: '#ffe9a6', emissive: '#ffd95a', emissiveIntensity: 1 }), [0.38, 0.62, 0.52], false)
    return [mesh(new THREE.CylinderGeometry(0.55, 0.65, 1.0, 12), flat('#fff3dc'), [0, 0.5, 0]), cap, ...dots, door, glow]
  },
  tourou: () => {
    const stone = flat('#b9b4a8')
    const light = mesh(new THREE.BoxGeometry(0.4, 0.38, 0.4), new THREE.MeshStandardMaterial({ color: '#fff1b8', emissive: '#ffc233', emissiveIntensity: 1.1 }), [0, 1.2, 0], false)
    const roof = mesh(new THREE.ConeGeometry(0.55, 0.38, 4), stone, [0, 1.6, 0])
    roof.rotation.y = Math.PI / 4
    return [mesh(new THREE.CylinderGeometry(0.4, 0.48, 0.18, 6), stone, [0, 0.09, 0]), mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.85, 6), stone, [0, 0.6, 0]), mesh(new THREE.BoxGeometry(0.6, 0.1, 0.6), stone, [0, 1.0, 0]), light, roof]
  },
  tent: () => {
    const body = mesh(new THREE.ConeGeometry(1.15, 1.5, 4), flat('#ff9a3d'), [0, 0.75, 0])
    body.rotation.y = Math.PI / 4
    const door = mesh(new THREE.ConeGeometry(0.42, 0.95, 3), flat('#27336b'), [0, 0.47, 0.6], false)
    const flag = mesh(new THREE.ConeGeometry(0.14, 0.34, 3), flat('#e8452c'), [0.14, 1.74, 0], false)
    flag.rotation.z = -Math.PI / 2
    return [body, door, mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 5), flat('#6f4a2f'), [0, 1.7, 0]), flag]
  },
  kazaguruma: () => {
    const blades = new THREE.Group()
    blades.name = 'spin'
    const colors = ['#ff6b8a', '#ffd95a', '#5cc1ea', '#84c456']
    for (let i = 0; i < 4; i += 1) {
      const blade = mesh(new THREE.BoxGeometry(0.34, 1.05, 0.05), flat(colors[i]), [0, 0.6, 0])
      const arm = new THREE.Group()
      arm.add(blade)
      arm.rotation.z = (i / 4) * Math.PI * 2
      blades.add(arm)
    }
    blades.position.set(0, 2.25, 0.5)
    const top = mesh(new THREE.ConeGeometry(0.62, 0.6, 8), flat('#e8452c'), [0, 2.6, 0])
    return [mesh(new THREE.CylinderGeometry(0.42, 0.62, 2.3, 8), flat('#fff3dc'), [0, 1.15, 0]), top, blades]
  },
  yukidaruma: () => {
    const snow = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7 })
    const nose = mesh(new THREE.ConeGeometry(0.06, 0.26, 8), flat('#ff9a3d'), [0, 1.06, 0.4], false)
    nose.rotation.x = Math.PI / 2
    const eyes = [-0.13, 0.13].map((x) => mesh(new THREE.SphereGeometry(0.045, 6, 6), flat('#1b1b1b'), [x, 1.16, 0.33], false))
    const scarf = mesh(new THREE.TorusGeometry(0.32, 0.07, 8, 20), flat('#e8452c'), [0, 0.86, 0])
    scarf.rotation.x = Math.PI / 2
    return [mesh(new THREE.SphereGeometry(0.55, 16, 12), snow, [0, 0.5, 0]), mesh(new THREE.SphereGeometry(0.38, 16, 12), snow, [0, 1.1, 0]), nose, ...eyes, scarf, mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.26, 10), flat('#3f6fd0'), [0, 1.5, 0])]
  },
  torii: () => {
    const red = flat('#e8452c')
    const posts = [-0.95, 0.95].map((x) => mesh(new THREE.CylinderGeometry(0.11, 0.13, 2.4, 8), red, [x, 1.2, 0]))
    return [...posts, mesh(new THREE.BoxGeometry(2.9, 0.2, 0.26), flat('#27336b'), [0, 2.5, 0]), mesh(new THREE.BoxGeometry(2.6, 0.16, 0.2), red, [0, 2.32, 0]), mesh(new THREE.BoxGeometry(2.2, 0.13, 0.16), red, [0, 1.85, 0])]
  },
  niji: () => {
    const colors = ['#ff6b5a', '#ffb23d', '#ffe45a', '#6fd07a', '#5cb8f0', '#8f7fe0']
    return colors.map((color, i) => {
      const arc = mesh(new THREE.TorusGeometry(9.5 - i * 0.42, 0.21, 6, 48, Math.PI), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 }), [0, -1.5, 0], false)
      arc.receiveShadow = false
      return arc
    })
  },
  shiro: () => {
    const wall = flat('#fff8ec')
    const roof = flat('#27336b')
    const tiers = [
      { size: 1.9, y: 0.95, height: 0.9 },
      { size: 1.4, y: 2.0, height: 0.75 },
      { size: 0.95, y: 2.95, height: 0.65 },
    ]
    const parts = tiers.flatMap((tier) => {
      const eaves = mesh(new THREE.ConeGeometry(tier.size * 0.95, 0.5, 4), roof, [0, tier.y + tier.height / 2 + 0.22, 0])
      eaves.rotation.y = Math.PI / 4
      return [mesh(new THREE.BoxGeometry(tier.size, tier.height, tier.size), wall, [0, tier.y, 0]), eaves]
    })
    const gold = mesh(new THREE.OctahedronGeometry(0.14), new THREE.MeshStandardMaterial({ color: '#ffc233', metalness: 0.7, roughness: 0.25 }), [0, 3.9, 0])
    return [mesh(new THREE.CylinderGeometry(1.5, 1.8, 0.5, 4), flat('#a59c8c'), [0, 0.25, 0]), ...parts, gold]
  },
}

/** かざり を作る。知らない名前なら null。 */
export function buildDeco(name: string): THREE.Group | null {
  const builder = DECOS[name]
  if (!builder) return null
  const deco = new THREE.Group()
  deco.add(...builder())
  if (name === 'shiro') deco.children[0].rotation.y = Math.PI / 4
  return deco
}

/** 雲1つ(まるいかたまりを いくつか くっつけたもの)。 */
export function buildCloud(color: string, random: () => number): THREE.Group {
  const cloud = new THREE.Group()
  const material = new THREE.MeshStandardMaterial({ color, roughness: 1, transparent: true, opacity: 0.95 })
  const count = 4 + Math.floor(random() * 3)
  for (let i = 0; i < count; i += 1) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.9 + random() * 0.8, 12, 9), material)
    puff.position.set((i - count / 2) * 1.05, random() * 0.5, random() * 0.7)
    puff.scale.y = 0.72
    cloud.add(puff)
  }
  return cloud
}

/** 遠くにうかぶ小さな しま。 */
export function buildFarIsland(scale: number): THREE.Group {
  const island = new THREE.Group()
  island.add(mesh(new THREE.CylinderGeometry(1.6, 1.3, 0.5, 9), flat('#6cc46f'), [0, 0, 0], false))
  const rock = mesh(new THREE.ConeGeometry(1.3, 2.2, 7), flat('#7b5a48'), [0, -1.35, 0], false)
  rock.rotation.x = Math.PI
  island.add(rock, mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.7, 6), flat('#8a5a3b'), [0.2, 0.6, 0], false), mesh(new THREE.IcosahedronGeometry(0.6, 1), flat('#3f9b52'), [0.2, 1.3, 0], false))
  island.scale.setScalar(scale)
  return island
}
