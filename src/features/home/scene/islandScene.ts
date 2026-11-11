import * as THREE from 'three'
import { DECO_SPOTS, forestPlan, groundHeight, skyPreset, type SkyPreset } from './layout'
import { buildMascot, type Mascot3D } from './mascot3d'
import { buildCloud, buildDeco, buildFarIsland, buildInkstone, buildIsland, buildTree, seeded } from './props3d'

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
}

export type IslandScene = {
  readonly update: (state: IslandState) => void
  readonly resize: (width: number, height: number) => void
  /** すみまるを ぴょんと とばす */
  readonly poke: () => void
  /** 指やマウスの位置(-1〜1)。カメラが少しだけ回りこむ */
  readonly look: (x: number, y: number) => void
  readonly dispose: () => void
}

const MAX_PIXEL_RATIO = 2
const CAMERA_FOV = 34
/** カメラが見る点。下のメニューにかくれないよう、しまを少し上に見せる */
const CAMERA_TARGET = new THREE.Vector3(0, -0.5, 0)
const CAMERA_DISTANCE = 30
const CAMERA_HEIGHT = 9.5
/** すみまるは主役なので、木よりも大きく見せる */
const MASCOT_SCALE = 1.5
const PARTICLE_COUNT = 140
const STAR_COUNT = 260

function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh || child instanceof THREE.Points)) return
    child.geometry.dispose()
    for (const material of Array.isArray(child.material) ? child.material : [child.material]) material.dispose()
  })
}

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

  const applyTrees = (learnedCount: number, totalKanji: number) => {
    const next = new THREE.Group()
    forestPlan(learnedCount, totalKanji).forEach((plan, i) => next.add(buildTree(plan, i)))
    replace(trees, world, next)
    trees = next
  }

  const applyDecos = (names: readonly string[]) => {
    const next = new THREE.Group()
    spinners.length = 0
    for (const name of names) {
      const deco = buildDeco(name)
      const spot = DECO_SPOTS[name]
      if (!deco || !spot) continue
      deco.position.set(spot.x, name === 'niji' ? 0 : groundHeight(spot.x, spot.z) - 0.03, spot.z)
      deco.traverse((child) => {
        if (child.name === 'spin') spinners.push(child)
      })
      next.add(deco)
    }
    replace(decos, world, next)
    decos = next
  }

  const render = () => {
    const t = seconds()
    pointer.smoothX += (pointer.x - pointer.smoothX) * 0.05
    pointer.smoothY += (pointer.y - pointer.smoothY) * 0.05
    const angle = Math.sin(t * 0.12) * 0.16 + pointer.smoothX * 0.22
    camera.position.set(Math.sin(angle) * CAMERA_DISTANCE, CAMERA_HEIGHT - pointer.smoothY * 1.4, Math.cos(angle) * CAMERA_DISTANCE)
    camera.lookAt(CAMERA_TARGET)
    world.position.y = Math.sin(t * 0.7) * 0.14
    world.rotation.z = Math.sin(t * 0.45) * 0.008
    mascot?.animate(t)
    sky?.animate(t)
    for (const tree of trees.children) tree.rotation.z = Math.sin(t * 1.1 + (tree.userData.phase as number)) * 0.025
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
    if (next.learnedCount !== state?.learnedCount || next.totalKanji !== state?.totalKanji) applyTrees(next.learnedCount, next.totalKanji)
    if (next.decos.join() !== state?.decos.join()) applyDecos(next.decos)
    state = next
    if (reducedMotion) render()
  }

  update(initial)
  start()

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
    dispose: () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('visibilitychange', handleVisibility)
      disposeObject(scene)
      texture.dispose()
      renderer.dispose()
    },
  }
}
