import * as THREE from 'three'
import { decoAngle, decoSpot, forestPlan, groundHeight, isMovableDeco, settleDeco, skyPreset, yieldToDecos, type DecoSpots, type DecoTurns, type SkyPreset, type Spot } from './layout'
import { buildMascot, type Mascot3D } from './mascot3d'
import { buildBird, buildCloud, buildDeco, buildFarIsland, buildInkstone, buildIsland, buildTree, seeded, WATERFALL } from './props3d'

/** しまの見た目を決める状態(保存データから作る) */
export type IslandState = {
  readonly learnedCount: number
  readonly totalKanji: number
  /** そら(shop の bg の名前) */
  readonly sky: string
  /** すみまるの成長の段階 */
  readonly mascotStage: number
  readonly hat: string
  /** 置いてある かざり の名前 */
  readonly decos: readonly string[]
  /** 自分で うごかした かざり の場所 */
  readonly decoSpots: DecoSpots
  /** まわした かざり の向き */
  readonly decoTurns: DecoTurns
}

/** かざり を置いた結果 */
export type DecoDrop = { readonly name: string; readonly spot: Spot }

export type IslandScene = {
  readonly update: (state: IslandState) => void
  readonly resize: (width: number, height: number) => void
  /** すみまるを ぴょんと とばす */
  readonly poke: () => void
  /** 指やマウスの位置(-1〜1)。カメラが少しだけ回りこむ */
  readonly look: (x: number, y: number) => void
  /** もようがえ(かざり を うごかす)を はじめる・おわる。はじめると、カメラが上から見おろす */
  readonly setEditing: (on: boolean) => void
  /** 指の場所(画面の -1〜1。上が +1)に いちばん近い かざり を つかむ。つかめたら その名前 */
  readonly grab: (x: number, y: number) => string | null
  /** つかんでいる かざり を、指の場所まで うごかす */
  readonly drag: (x: number, y: number) => void
  /** つかんでいる かざり を はなす。置いた場所を返す */
  readonly drop: () => DecoDrop | null
  /** えらんでいる かざり(わっか の色が変わる)。えらんでいなければ null */
  readonly select: (name: string | null) => void
  readonly dispose: () => void
}

const MAX_PIXEL_RATIO = 2
const CAMERA_FOV = 34
/** カメラが見る点。下のメニューにかくれないよう、しまを少し上に見せる */
const CAMERA_TARGET = new THREE.Vector3(0, -0.5, 0)
const CAMERA_DISTANCE = 30
const CAMERA_HEIGHT = 9.5
/** もようがえ のときは、しまを 上から見おろす */
const EDIT_CAMERA_DISTANCE = 21
const EDIT_CAMERA_HEIGHT = 21
/** 指が かざり から これより はなれていたら、つかまない(画面の たかさの半分 = 1) */
const GRAB_REACH = 0.22
/** つかんでいる かざり を うかせる高さ */
const LIFT = 0.45
/** すみまるは主役なので、木よりも大きく見せる */
const MASCOT_SCALE = 1.5
/** ひらいたとき、カメラが遠くから近づいてくる時間(秒)と、はじめの遠さ */
const INTRO_SECONDS = 1.8
const INTRO_EXTRA_DISTANCE = 10
/** 木が育ったとき、ぽんと大きくなる時間(秒) */
const POP_SECONDS = 0.9
const SPARKLES_PER_TREE = 8
const BIRD_COLORS = ['#ffffff', '#ffd95a', '#ff9ec4'] as const
const PARTICLE_COUNT = 140
const STAR_COUNT = 260

function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh || child instanceof THREE.Points)) return
    child.geometry.dispose()
    for (const material of Array.isArray(child.material) ? child.material : [child.material]) material.dispose()
  })
}

/** 前に ホームを見たときの「覚えた字の数」。次に見たとき、育った木を目立たせるのに使う。 */
let lastSeenLearned: number | undefined

const easeOutBack = (x: number): number => 1 + 2.7 * (x - 1) ** 3 + 1.7 * (x - 1) ** 2

/** まるく ぼやけた点の絵(ほたる・花びら・雪・星・太陽のまわりの光に使う)。 */
function dotTexture(): THREE.Texture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.75)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
  }
  return new THREE.CanvasTexture(canvas)
}

const PARTICLE_LOOK: Record<Exclude<SkyPreset['particles'], 'none'>, { color: string; size: number; fall: number; glow: boolean }> = {
  petals: { color: '#ffb3d1', size: 0.34, fall: 0.7, glow: false },
  snow: { color: '#ffffff', size: 0.3, fall: 1.1, glow: false },
  fireflies: { color: '#fff3a0', size: 0.42, fall: 0, glow: true },
  stars: { color: '#cfd6ff', size: 0.3, fall: 0, glow: true },
}

type Sky = { readonly group: THREE.Group; readonly animate: (t: number) => void }

/** 空のもの(太陽・月・星・雲・ふってくるもの)を作る。 */
function buildSky(preset: SkyPreset, texture: THREE.Texture): Sky {
  const group = new THREE.Group()
  const random = seeded(11)
  const sunDirection = new THREE.Vector3(...preset.sunPosition).normalize()
  const bodyColor = preset.body === 'sun' ? preset.sunColor : preset.body === 'moon' ? '#fff3c4' : '#ff9a6b'
  const body = new THREE.Mesh(new THREE.SphereGeometry(preset.body === 'planet' ? 2.6 : 1.9, 24, 18), new THREE.MeshBasicMaterial({ color: bodyColor }))
  // 画面に入るよう、しまの うしろの空に置く(光の向きと同じ側)
  body.position.set(sunDirection.x * 16, 2 + sunDirection.y * 4, -22)
  group.add(body)
  if (preset.body === 'planet') {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(4, 0.28, 6, 48), new THREE.MeshBasicMaterial({ color: '#ffd9a0' }))
    ring.rotation.set(1.25, 0.3, 0)
    body.add(ring)
  } else {
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, color: bodyColor, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }))
    glow.scale.setScalar(13)
    body.add(glow)
  }

  if (preset.stars) {
    const positions = new Float32Array(STAR_COUNT * 3)
    for (let i = 0; i < STAR_COUNT; i += 1) positions.set([(random() - 0.5) * 110, random() * 20 - 11, -28 - random() * 14], i * 3)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    group.add(new THREE.Points(geometry, new THREE.PointsMaterial({ map: texture, color: '#ffffff', size: 0.5, transparent: true, depthWrite: false })))
  }

  const clouds = Array.from({ length: 7 }, (_, i) => {
    const cloud = buildCloud(preset.cloudColor, random)
    cloud.position.set((random() - 0.5) * 60, i < 3 ? -6 - random() * 3 : 1 + random() * 5.5, -8 - random() * 14)
    cloud.scale.setScalar(0.8 + random() * 0.9)
    cloud.userData.speed = 0.25 + random() * 0.35
    group.add(cloud)
    return cloud
  })
  const farIslands = [
    { x: -13, y: 2.5, z: -15, scale: 1.2 },
    { x: 14, y: 4.5, z: -19, scale: 0.9 },
  ].map((spot) => {
    const island = buildFarIsland(spot.scale)
    island.position.set(spot.x, spot.y, spot.z)
    group.add(island)
    return island
  })

  let points: THREE.Points | undefined
  let base: Float32Array | undefined
  if (preset.particles !== 'none') {
    const look = PARTICLE_LOOK[preset.particles]
    base = new Float32Array(PARTICLE_COUNT * 3)
    for (let i = 0; i < PARTICLE_COUNT; i += 1) base.set([(random() - 0.5) * 30, random() * 14 - 1, (random() - 0.5) * 22], i * 3)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(base.slice(), 3))
    const material = new THREE.PointsMaterial({ map: texture, color: look.color, size: look.size, transparent: true, depthWrite: false, blending: look.glow ? THREE.AdditiveBlending : THREE.NormalBlending })
    points = new THREE.Points(geometry, material)
    group.add(points)
  }

  const animate = (t: number) => {
    for (const cloud of clouds) cloud.position.x = ((cloud.position.x + 32 + cloud.userData.speed * 0.016) % 64) - 32
    farIslands.forEach((island, i) => {
      island.position.y += Math.sin(t * 0.5 + i * 2) * 0.002
    })
    if (!points || !base || preset.particles === 'none') return
    const look = PARTICLE_LOOK[preset.particles]
    const attribute = points.geometry.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      const phase = i * 1.7
      const drift = look.fall > 0 ? 0.9 : 0.5
      const y = look.fall > 0 ? ((((base[i * 3 + 1] - t * look.fall * (0.6 + (i % 5) * 0.12)) % 15) + 15) % 15) - 1 : base[i * 3 + 1] + Math.sin(t * 0.7 + phase) * 0.6
      attribute.setXYZ(i, base[i * 3] + Math.sin(t * 0.5 + phase) * drift, y, base[i * 3 + 2] + Math.cos(t * 0.4 + phase) * drift)
    }
    attribute.needsUpdate = true
    if (look.glow) (points.material as THREE.PointsMaterial).opacity = 0.65 + Math.sin(t * 2.4) * 0.3
  }
  return { group, animate }
}

/** ホームの しま。canvas に Three.js で描く。 */
export function createIslandScene(canvas: HTMLCanvasElement, initial: IslandState, reducedMotion: boolean): IslandScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 200)
  const texture = dotTexture()

  const hemisphere = new THREE.HemisphereLight('#ffffff', '#88aa77', 1.4)
  const sun = new THREE.DirectionalLight('#ffffff', 2.5)
  sun.castShadow = true
  sun.shadow.mapSize.set(1536, 1536)
  sun.shadow.camera.left = -12
  sun.shadow.camera.right = 12
  sun.shadow.camera.top = 12
  sun.shadow.camera.bottom = -12
  sun.shadow.camera.far = 60
  sun.shadow.bias = -0.0015
  scene.add(hemisphere, sun)

  // しま全体を1つにまとめて、ふわふわ うかせる
  const world = new THREE.Group()
  const island = buildIsland()
  const inkstone = buildInkstone()
  inkstone.position.y = groundHeight(0, 0) - 0.05
  world.add(island, inkstone)
  scene.add(world)

  let state: IslandState | undefined
  let sky: Sky | undefined
  let mascot: Mascot3D | undefined
  let trees = new THREE.Group()
  let decos = new THREE.Group()
  const decoByName = new Map<string, THREE.Group>()
  let editing = false
  /** カメラが もようがえ の見おろしに どれだけ近づいたか(0〜1) */
  let editMix = 0
  let held: string | undefined
  let selected: string | null = null
  /** うごかせる かざり の、いまの場所(except を のぞく) */
  const movableSpots = (except?: string): Spot[] =>
    [...decoByName.entries()].filter(([name]) => name !== except).map(([, deco]) => ({ x: deco.position.x, z: deco.position.z }))
  const spinners: THREE.Object3D[] = []
  const pointer = { x: 0, y: 0, smoothX: 0, smoothY: 0 }
  const startedAt = performance.now()
  const seconds = () => (performance.now() - startedAt) / 1000

  const replace = (old: THREE.Object3D | undefined, parent: THREE.Object3D, next: THREE.Object3D) => {
    if (old) {
      parent.remove(old)
      disposeObject(old)
    }
    parent.add(next)
  }

  const applySky = (name: string) => {
    const preset = skyPreset(name)
    const next = buildSky(preset, texture)
    replace(sky?.group, scene, next.group)
    sky = next
    sun.color.set(preset.sunColor)
    sun.intensity = preset.sunIntensity
    sun.position.set(...preset.sunPosition).multiplyScalar(2)
    hemisphere.color.set(preset.skyLight)
    hemisphere.groundColor.set(preset.groundLight)
    hemisphere.intensity = preset.ambient
    canvas.style.background = `linear-gradient(180deg, ${preset.gradient[0]} 0%, ${preset.gradient[1]} 58%, ${preset.gradient[2]} 100%)`
  }

  const applyMascot = (stage: number, hat: string) => {
    const next = buildMascot(stage, hat)
    next.group.position.y = groundHeight(0, 0) + 0.28
    next.group.scale.setScalar(MASCOT_SCALE)
    replace(mascot?.group, world, next.group)
    mascot = next
  }

  const sparkles = new THREE.Points(
    new THREE.BufferGeometry(),
    new THREE.PointsMaterial({ map: texture, color: '#fff3a0', size: 0.5, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  )
  sparkles.visible = false
  world.add(sparkles)
  let popAt = -10

  const applyTrees = (learnedCount: number, totalKanji: number) => {
    const next = new THREE.Group()
    // 前に見たときから育った木(新しく植わった木・大きくなった木)を しらべる
    const before = new Map((lastSeenLearned !== undefined && lastSeenLearned < learnedCount ? forestPlan(lastSeenLearned, totalKanji) : []).map((p) => [`${p.x},${p.z}`, p.stage]))
    const compare = lastSeenLearned !== undefined && lastSeenLearned < learnedCount
    const grown: THREE.Vector3[] = []
    const decoSpots = movableSpots()
    forestPlan(learnedCount, totalKanji).forEach((plan, i) => {
      const tree = buildTree(plan, i)
      // 木が かざり と重なるときは、木のほうが少し よける
      tree.userData.home = { x: plan.x, z: plan.z }
      const spot = yieldToDecos(plan, decoSpots)
      tree.position.set(spot.x, tree.position.y, spot.z)
      tree.userData.baseScale = tree.scale.x
      if (compare && before.get(`${plan.x},${plan.z}`) !== plan.stage) {
        tree.userData.pop = true
        grown.push(new THREE.Vector3(plan.x, tree.position.y + 0.6 + plan.stage * 0.5, plan.z))
      }
      next.add(tree)
    })
    replace(trees, world, next)
    trees = next
    lastSeenLearned = learnedCount
    if (grown.length === 0 || reducedMotion) return
    // 育った木のまわりに、きらきら を出す
    const positions = new Float32Array(grown.length * SPARKLES_PER_TREE * 3)
    grown.forEach((spot, g) => {
      for (let k = 0; k < SPARKLES_PER_TREE; k += 1) {
        const angle = (k / SPARKLES_PER_TREE) * Math.PI * 2
        positions.set([spot.x + Math.cos(angle) * 0.7, spot.y, spot.z + Math.sin(angle) * 0.7], (g * SPARKLES_PER_TREE + k) * 3)
      }
    })
    sparkles.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    sparkles.userData.base = positions.slice()
    popAt = seconds() + 0.9
  }

  const birds = BIRD_COLORS.map((color, i) => {
    const bird = buildBird(color)
    bird.userData.offset = (i / BIRD_COLORS.length) * Math.PI * 2
    scene.add(bird)
    return bird
  })
  const drops = island.getObjectByName('drops')
  const water = island.getObjectByName('water') as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial> | undefined

  const placeDeco = (deco: THREE.Object3D, name: string, spot: Spot, lift = 0) => {
    deco.position.set(spot.x, (name === 'niji' ? 0 : groundHeight(spot.x, spot.z) - 0.03) + lift, spot.z)
  }

  const applyDecos = (names: readonly string[], placed: DecoSpots, turns: DecoTurns) => {
    const next = new THREE.Group()
    spinners.length = 0
    decoByName.clear()
    for (const name of names) {
      const deco = buildDeco(name)
      const spot = decoSpot(name, placed)
      if (!deco || !spot) continue
      placeDeco(deco, name, spot)
      deco.rotation.y = decoAngle(name, turns)
      deco.traverse((child) => {
        if (child.name === 'spin') spinners.push(child)
      })
      if (isMovableDeco(name)) {
        // もようがえ のときに出る、「うごかせるよ」の わっか
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(1.15, 1.38, 40),
          new THREE.MeshBasicMaterial({ color: '#ffd95a', transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }),
        )
        ring.name = 'edit-ring'
        ring.rotation.x = -Math.PI / 2
        ring.position.y = 0.08
        ring.visible = editing
        deco.add(ring)
        decoByName.set(name, deco)
      }
      next.add(deco)
    }
    replace(decos, world, next)
    decos = next
  }

  /** かざり の いまの場所に合わせて、木を よけさせる(木を作りなおさずに、場所だけ うごかす)。 */
  const yieldTrees = () => {
    const decoSpots = movableSpots()
    for (const tree of trees.children) {
      const home = tree.userData.home as Spot | undefined
      if (!home) continue
      const spot = yieldToDecos(home, decoSpots)
      tree.position.x = spot.x
      tree.position.z = spot.z
    }
  }

  const raycaster = new THREE.Raycaster()
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.3)
  const hitPoint = new THREE.Vector3()
  const projected = new THREE.Vector3()

  const render = () => {
    const t = seconds()
    pointer.smoothX += (pointer.x - pointer.smoothX) * 0.05
    pointer.smoothY += (pointer.y - pointer.smoothY) * 0.05
    // もようがえ の間は、カメラも しまも 止めて、上から見おろす(指の場所と かざり が ずれないように)
    editMix += ((editing ? 1 : 0) - editMix) * (reducedMotion ? 1 : 0.12)
    const free = 1 - editMix
    const angle = (Math.sin(t * 0.12) * 0.16 + pointer.smoothX * 0.22) * free
    // ひらいたときは、遠くから すっと近づく
    const intro = reducedMotion ? 0 : (1 - Math.min(t / INTRO_SECONDS, 1)) ** 3
    const distance = (CAMERA_DISTANCE + intro * INTRO_EXTRA_DISTANCE) * free + EDIT_CAMERA_DISTANCE * editMix
    const height = (CAMERA_HEIGHT + intro * 4 - pointer.smoothY * 1.4) * free + EDIT_CAMERA_HEIGHT * editMix
    camera.position.set(Math.sin(angle) * distance, height, Math.cos(angle) * distance)
    camera.lookAt(CAMERA_TARGET)
    world.position.y = Math.sin(t * 0.7) * 0.14 * free
    world.rotation.z = Math.sin(t * 0.45) * 0.008 * free
    if (editing) {
      // うごかせる かざり の わっか を、ふわふわ 大きさを変えて目立たせる
      for (const [name, deco] of decoByName) {
        const ring = deco.getObjectByName('edit-ring') as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial> | undefined
        if (!ring) continue
        ring.scale.setScalar(name === held ? 1.25 : 1 + Math.sin(t * 4) * 0.08)
        // えらんでいる かざり の わっか は、朱色にして 見分けやすくする
        ring.material.color.set(name === selected ? '#ff5a36' : '#ffd95a')
      }
    }
    mascot?.look(pointer.smoothX, pointer.smoothY)
    mascot?.animate(t)
    sky?.animate(t)
    const pop = Math.min(Math.max((t - popAt) / POP_SECONDS, 0), 1)
    for (const tree of trees.children) {
      tree.rotation.z = Math.sin(t * 1.1 + (tree.userData.phase as number)) * 0.025
      // 育った木は、いちど小さくなってから ぽんと大きくなる
      if (tree.userData.pop) tree.scale.setScalar((tree.userData.baseScale as number) * (pop <= 0 ? 0.55 : 0.55 + 0.45 * easeOutBack(pop)))
    }
    sparkles.visible = pop > 0 && pop < 1
    if (sparkles.visible) {
      const attribute = sparkles.geometry.getAttribute('position') as THREE.BufferAttribute
      const base = sparkles.userData.base as Float32Array
      for (let i = 0; i < attribute.count; i += 1) attribute.setY(i, base[i * 3 + 1] + pop * 1.6)
      attribute.needsUpdate = true
      sparkles.material.opacity = 1 - pop
      sparkles.material.size = 0.3 + pop * 0.5
    }
    birds.forEach((bird, i) => {
      const a = t * (0.22 + i * 0.04) + (bird.userData.offset as number)
      const radius = 12.5 + i * 1.6
      bird.position.set(Math.cos(a) * radius, 4.5 + i * 1.3 + Math.sin(t * 0.8 + i) * 0.5, Math.sin(a) * radius - 2)
      bird.rotation.y = -a
      const flap = Math.sin(t * 9 + i) * 0.7
      const left = bird.getObjectByName('wing-left')
      const right = bird.getObjectByName('wing-right')
      if (left) left.rotation.z = flap
      if (right) right.rotation.z = -flap
    })
    for (const drop of drops?.children ?? []) {
      const fall = (t * 0.55 + (drop.userData.offset as number)) % 1
      drop.position.y = -fall * WATERFALL.height
      drop.scale.setScalar(1 + fall * 0.8)
    }
    if (water) water.material.emissiveIntensity = 0.12 + Math.sin(t * 1.6) * 0.06
    for (const spinner of spinners) spinner.rotation.z = t * 1.6
    renderer.render(scene, camera)
  }

  let frame = 0
  const loop = () => {
    render()
    frame = requestAnimationFrame(loop)
  }
  const start = () => {
    cancelAnimationFrame(frame)
    // 動きを減らす設定の人には、止まった絵を見せる
    if (reducedMotion) render()
    else if (!document.hidden) loop()
  }
  const handleVisibility = () => start()
  document.addEventListener('visibilitychange', handleVisibility)

  const update = (next: IslandState) => {
    if (next.sky !== state?.sky) applySky(next.sky)
    if (next.mascotStage !== state?.mascotStage || next.hat !== state?.hat) applyMascot(next.mascotStage, next.hat)
    // かざり を先に置く。木は かざり を よけて植えるので、かざり が うごいたときも 木を植えなおす
    const decosChanged =
      next.decos.join() !== state?.decos.join() ||
      JSON.stringify(next.decoSpots) !== JSON.stringify(state?.decoSpots) ||
      JSON.stringify(next.decoTurns) !== JSON.stringify(state?.decoTurns)
    const treesChanged = next.learnedCount !== state?.learnedCount || next.totalKanji !== state?.totalKanji
    if (decosChanged) applyDecos(next.decos, next.decoSpots, next.decoTurns)
    if (treesChanged || decosChanged) applyTrees(next.learnedCount, next.totalKanji)
    state = next
    if (reducedMotion) render()
  }

  update(initial)
  start()

  /** 画面の場所(-1〜1)を、しまの地面の場所に直す。 */
  const groundAt = (x: number, y: number): Spot | null => {
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera)
    if (!raycaster.ray.intersectPlane(ground, hitPoint)) return null
    return { x: hitPoint.x, z: hitPoint.z }
  }

  return {
    update,
    resize: (width, height) => {
      if (width === 0 || height === 0) return
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      // たて長の画面では しま が はみ出すので、そのぶん画角を広げる
      camera.fov = camera.aspect < 1.2 ? CAMERA_FOV * (1.2 / camera.aspect) ** 0.8 : CAMERA_FOV
      camera.updateProjectionMatrix()
      if (reducedMotion) render()
    },
    poke: () => mascot?.jump(seconds()),
    look: (x, y) => {
      pointer.x = x
      pointer.y = y
    },
    select: (name) => {
      selected = name
      if (reducedMotion) render()
    },
    setEditing: (on) => {
      editing = on
      held = undefined
      if (!on) selected = null
      for (const deco of decoByName.values()) {
        const ring = deco.getObjectByName('edit-ring')
        if (ring) ring.visible = on
      }
      if (reducedMotion) render()
    },
    grab: (x, y) => {
      if (!editing) return null
      camera.updateMatrixWorld()
      const reach = [...decoByName.entries()]
        .map(([name, deco]) => {
          projected.setFromMatrixPosition(deco.matrixWorld).project(camera)
          // 横長の画面でも、指からの きょり を同じ ものさし で はかる
          return { name, distance: Math.hypot((projected.x - x) * camera.aspect, projected.y - y) }
        })
        .sort((a, b) => a.distance - b.distance)[0]
      if (!reach || reach.distance > GRAB_REACH) return null
      held = reach.name
      selected = reach.name
      const deco = decoByName.get(held)
      if (deco) placeDeco(deco, held, { x: deco.position.x, z: deco.position.z }, LIFT)
      if (reducedMotion) render()
      return held
    },
    drag: (x, y) => {
      const deco = held ? decoByName.get(held) : undefined
      const wanted = groundAt(x, y)
      if (!held || !deco || !wanted) return
      placeDeco(deco, held, settleDeco(wanted, movableSpots(held)), LIFT)
      // ひっぱっている間も、木が よける(かざり が 木の うらに かくれないように)
      yieldTrees()
      if (reducedMotion) render()
    },
    drop: () => {
      const name = held
      const deco = name ? decoByName.get(name) : undefined
      held = undefined
      if (!name || !deco) return null
      const spot = { x: deco.position.x, z: deco.position.z }
      placeDeco(deco, name, spot)
      if (reducedMotion) render()
      return { name, spot }
    },
    dispose: () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('visibilitychange', handleVisibility)
      disposeObject(scene)
      texture.dispose()
      renderer.dispose()
    },
  }
}
