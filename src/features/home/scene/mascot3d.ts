import * as THREE from 'three'

const INK = '#27336b'
const INK_LIGHT = '#4a5aa8'
const SHU = '#e8452c'
const GOLD = '#ffc233'
const PINK = '#ff8fa3'
const BLACK = '#1b1b1b'

const mat = (color: string, options: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...options })

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, position: readonly [number, number, number] = [0, 0, 0]): THREE.Mesh {
  const result = new THREE.Mesh(geometry, material)
  result.position.set(...position)
  result.castShadow = true
  return result
}

/** しずくの形(よこから見た りんかく)。下がまるく、上がとがっている。 */
const DROP_PROFILE: readonly (readonly [number, number])[] = [
  [0, 0],
  [0.45, 0.03],
  [0.72, 0.18],
  [0.85, 0.42],
  [0.86, 0.66],
  [0.76, 0.9],
  [0.58, 1.1],
  [0.38, 1.3],
  [0.2, 1.48],
  [0.07, 1.62],
  [0, 1.7],
]

function bodyGeometry(): THREE.BufferGeometry {
  const curve = new THREE.SplineCurve(DROP_PROFILE.map(([x, y]) => new THREE.Vector2(x, y)))
  return new THREE.LatheGeometry(curve.getPoints(28), 40)
}

function buildFace(): { face: THREE.Group; eyes: THREE.Group } {
  const face = new THREE.Group()
  const eyes = new THREE.Group()
  const white = mat('#ffffff', { roughness: 0.3 })
  const black = mat(BLACK, { roughness: 0.2 })
  for (const side of [-1, 1]) {
    const eye = mesh(new THREE.SphereGeometry(0.2, 20, 16), white, [side * 0.3, 0.74, 0.7])
    eye.scale.set(1, 1.08, 0.55)
    const pupil = mesh(new THREE.SphereGeometry(0.095, 16, 12), black, [side * 0.3, 0.73, 0.79])
    pupil.scale.z = 0.5
    const glint = mesh(new THREE.SphereGeometry(0.035, 8, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' }), [side * 0.3 + 0.04, 0.78, 0.83])
    eyes.add(eye, pupil, glint)
    const cheek = mesh(new THREE.SphereGeometry(0.11, 14, 10), mat(PINK, { roughness: 0.8 }), [side * 0.55, 0.52, 0.62])
    cheek.scale.set(1, 0.7, 0.3)
    cheek.lookAt(side * 1.6, 0.52, 1.8)
    face.add(cheek)
  }
  const mouth = mesh(new THREE.TorusGeometry(0.1, 0.028, 8, 16, Math.PI), mat('#ffffff'), [0, 0.55, 0.84])
  mouth.rotation.z = Math.PI
  face.add(eyes, mouth)
  return { face, eyes }
}

type Animated = { orbs?: THREE.Group; halo?: THREE.Group; wings?: THREE.Object3D[] }

/** すがた(成長の段階)に応じた かざり を足す。段階が上がるほど増えていく。 */
function addFormParts(root: THREE.Group, stage: number): Animated {
  const animated: Animated = {}
  if (stage >= 1) root.add(mesh(new THREE.ConeGeometry(0.17, 0.42, 14), mat(INK_LIGHT), [0, 1.82, 0]))
  if (stage >= 2) {
    const arm = new THREE.CapsuleGeometry(0.1, 0.42, 6, 10)
    const left = mesh(arm, mat(INK), [-0.92, 0.62, 0.05])
    left.rotation.z = -0.9
    const right = mesh(arm, mat(INK), [0.92, 0.72, 0.05])
    right.rotation.z = 0.5
    const handle = mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.15, 10), mat(stage >= 5 ? GOLD : '#b07a48', { metalness: stage >= 5 ? 0.6 : 0, roughness: 0.4 }), [1.12, 1.25, 0.05])
    const tip = mesh(new THREE.ConeGeometry(0.13, 0.36, 12), mat(INK), [1.12, 2.0, 0.05])
    root.add(left, right, handle, tip)
  }
  if (stage >= 3) {
    const scarf = mesh(new THREE.TorusGeometry(0.8, 0.1, 10, 32), mat(SHU), [0, 0.3, 0])
    scarf.rotation.x = Math.PI / 2
    const tail = mesh(new THREE.BoxGeometry(0.2, 0.5, 0.06), mat(SHU), [-0.7, 0.12, 0.55])
    tail.rotation.z = 0.35
    root.add(scarf, tail)
  }
  if (stage >= 4) {
    const cape = mesh(new THREE.CylinderGeometry(0.72, 1.15, 1.05, 20, 1, true, Math.PI / 2, Math.PI), mat(SHU, { side: THREE.DoubleSide }), [0, 0.55, -0.12])
    root.add(cape)
  }
  if (stage >= 5) {
    animated.orbs = new THREE.Group()
    for (let i = 0; i < 3; i += 1) {
      const angle = (i / 3) * Math.PI * 2
      animated.orbs.add(mesh(new THREE.SphereGeometry(0.12, 12, 10), mat(INK_LIGHT, { roughness: 0.3 }), [Math.cos(angle) * 1.45, 0.9 + i * 0.25, Math.sin(angle) * 1.45]))
    }
    root.add(animated.orbs)
  }
  if (stage >= 6) {
    animated.halo = new THREE.Group()
    const gold = mat(GOLD, { emissive: GOLD, emissiveIntensity: 0.55, metalness: 0.5, roughness: 0.3 })
    animated.halo.add(mesh(new THREE.TorusGeometry(1.35, 0.045, 8, 48), gold))
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2
      animated.halo.add(mesh(new THREE.SphereGeometry(0.07, 8, 8), gold, [Math.cos(angle) * 1.52, Math.sin(angle) * 1.52, 0]))
    }
    animated.halo.position.set(0, 0.95, -0.55)
    root.add(animated.halo)
  }
  if (stage >= 7) {
    animated.wings = [-1, 1].map((side) => {
      const wing = mesh(new THREE.SphereGeometry(0.55, 14, 10), mat('#fff8d6', { emissive: GOLD, emissiveIntensity: 0.15 }), [side * 0.95, 1.0, -0.5])
      wing.scale.set(1.25, 0.75, 0.16)
      wing.rotation.z = side * 0.5
      wing.userData.side = side
      root.add(wing)
      return wing
    })
  }
  return animated
}

type HatBuilder = () => THREE.Object3D[]

/** ぼうし(shop の hat の名前 → 3D の形) */
const HATS: Readonly<Record<string, HatBuilder>> = {
  hachimaki: () => {
    const band = mesh(new THREE.TorusGeometry(0.69, 0.07, 8, 32), mat('#ffffff'), [0, 1.0, 0])
    band.rotation.x = Math.PI / 2
    const dot = mesh(new THREE.SphereGeometry(0.09, 10, 8), mat(SHU), [0, 1.0, 0.72])
    const tail = mesh(new THREE.BoxGeometry(0.42, 0.13, 0.03), mat('#ffffff'), [0.78, 0.95, -0.3])
    tail.rotation.set(0, 0.6, -0.35)
    return [band, dot, tail]
  },
  mugiwara: () => [
    mesh(new THREE.CylinderGeometry(1.0, 1.05, 0.06, 28), mat('#e9c46a'), [0, 1.22, 0]),
    mesh(new THREE.CylinderGeometry(0.42, 0.52, 0.5, 24), mat('#f0d27e'), [0, 1.48, 0]),
    mesh(new THREE.CylinderGeometry(0.53, 0.53, 0.1, 24), mat(SHU), [0, 1.3, 0]),
  ],
  ribbon: () => {
    const parts = [-1, 1].map((side) => {
      const bow = mesh(new THREE.ConeGeometry(0.22, 0.42, 4), mat('#ff7aa8'), [0.42 + side * 0.24, 1.38, 0.34])
      bow.rotation.z = side * (Math.PI / 2)
      return bow
    })
    return [...parts, mesh(new THREE.SphereGeometry(0.11, 10, 8), mat('#ff7aa8'), [0.42, 1.38, 0.34])]
  },
  hana: () => {
    const flower = new THREE.Group()
    for (let i = 0; i < 5; i += 1) {
      const angle = (i / 5) * Math.PI * 2
      const petal = mesh(new THREE.SphereGeometry(0.12, 10, 8), mat('#ff9ec4'), [Math.cos(angle) * 0.15, Math.sin(angle) * 0.15, 0])
      petal.scale.z = 0.45
      flower.add(petal)
    }
    flower.add(mesh(new THREE.SphereGeometry(0.09, 10, 8), mat(GOLD), [0, 0, 0.04]))
    flower.position.set(0.4, 1.28, 0.42)
    flower.lookAt(1.2, 2.2, 2.4)
    return [flower]
  },
  megane: () => {
    const rim = mat(BLACK, { roughness: 0.3 })
    const rings = [-1, 1].map((side) => mesh(new THREE.TorusGeometry(0.24, 0.03, 8, 24), rim, [side * 0.3, 0.74, 0.84]))
    return [...rings, mesh(new THREE.BoxGeometry(0.14, 0.035, 0.035), rim, [0, 0.76, 0.86])]
  },
  nekomimi: () =>
    [-1, 1].flatMap((side) => {
      const ear = mesh(new THREE.ConeGeometry(0.22, 0.42, 4), mat(INK), [side * 0.5, 1.28, 0.05])
      ear.rotation.set(0, Math.PI / 4, side * -0.45)
      const inner = mesh(new THREE.ConeGeometry(0.11, 0.24, 4), mat(PINK), [side * 0.5, 1.26, 0.13])
      inner.rotation.copy(ear.rotation)
      return [ear, inner]
    }),
  tongari: () => {
    const cone = mesh(new THREE.ConeGeometry(0.55, 1.2, 20), mat('#5a3fa8'), [0, 1.85, 0])
    cone.rotation.z = -0.12
    const star = mesh(new THREE.OctahedronGeometry(0.12), mat(GOLD, { emissive: GOLD, emissiveIntensity: 0.4 }), [0, 1.7, 0.5])
    return [mesh(new THREE.CylinderGeometry(0.9, 0.95, 0.07, 28), mat('#6b4fc0'), [0, 1.24, 0]), cone, star]
  },
  silk: () => [
    mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.06, 28), mat(BLACK, { roughness: 0.35 }), [0, 1.24, 0]),
    mesh(new THREE.CylinderGeometry(0.48, 0.46, 0.8, 24), mat(BLACK, { roughness: 0.35 }), [0, 1.66, 0]),
    mesh(new THREE.CylinderGeometry(0.49, 0.49, 0.13, 24), mat(SHU), [0, 1.36, 0]),
  ],
  kanmuri: () => {
    const gold = mat(GOLD, { metalness: 0.7, roughness: 0.25 })
    const spikes = Array.from({ length: 6 }, (_, i) => {
      const angle = (i / 6) * Math.PI * 2
      return mesh(new THREE.ConeGeometry(0.1, 0.3, 8), gold, [Math.cos(angle) * 0.44, 1.58, Math.sin(angle) * 0.44])
    })
    return [mesh(new THREE.CylinderGeometry(0.5, 0.46, 0.26, 24, 1, true), mat(GOLD, { metalness: 0.7, roughness: 0.25, side: THREE.DoubleSide }), [0, 1.32, 0]), ...spikes]
  },
}

/** 成長の段階ごとの大きさ。はじめは小さく、だんだん大きくなる。 */
const FORM_SCALE = [0.78, 0.88, 0.98, 1.06, 1.14, 1.2, 1.27, 1.36] as const

export type Mascot3D = {
  readonly group: THREE.Group
  /** 毎フレーム呼ぶ。t = 秒 */
  readonly animate: (t: number) => void
  /** ぴょんと とぶ(タップされたとき) */
  readonly jump: (t: number) => void
  /** 指やマウスのほうを見る(x・y は -1〜1) */
  readonly look: (x: number, y: number) => void
}

const JUMP_SECONDS = 0.7
const BLINK_EVERY = 3.4
const BLINK_SECONDS = 0.14

/** 3D の すみまる を作る。 */
export function buildMascot(stage: number, hat: string): Mascot3D {
  const safeStage = Math.min(Math.max(stage, 0), FORM_SCALE.length - 1)
  const group = new THREE.Group()
  const root = new THREE.Group()
  root.add(mesh(bodyGeometry(), mat(INK, { roughness: 0.32, metalness: 0.08 })))
  const { face, eyes } = buildFace()
  root.add(face)
  const animated = addFormParts(root, safeStage)
  for (const part of HATS[hat]?.() ?? []) root.add(part)
  root.scale.setScalar(FORM_SCALE[safeStage])
  group.add(root)

  let jumpAt = -10
  const gaze = { x: 0, y: 0 }
  const animate = (t: number) => {
    // 息をするように、ゆっくり のびちぢみ する
    const breath = Math.sin(t * 2.2) * 0.035
    const sinceJump = t - jumpAt
    const jumping = sinceJump >= 0 && sinceJump < JUMP_SECONDS
    const hop = jumping ? Math.sin((sinceJump / JUMP_SECONDS) * Math.PI) : 0
    root.position.y = hop * 1.1
    root.scale.set(FORM_SCALE[safeStage] * (1 - breath - hop * 0.08), FORM_SCALE[safeStage] * (1 + breath + hop * 0.14), FORM_SCALE[safeStage] * (1 - breath - hop * 0.08))
    // 指のあるほうへ、体ごと少しふりむく
    root.rotation.y = Math.sin(t * 0.6) * 0.14 + gaze.x * 0.55 + (jumping ? (sinceJump / JUMP_SECONDS) * Math.PI * 2 : 0)
    root.rotation.x = gaze.y * 0.12
    eyes.scale.y = t % BLINK_EVERY < BLINK_SECONDS ? 0.12 : 1
    eyes.position.y = t % BLINK_EVERY < BLINK_SECONDS ? 0.65 : 0
    eyes.position.x = gaze.x * 0.035
    if (animated.orbs) animated.orbs.rotation.y = t * 1.1
    if (animated.halo) animated.halo.rotation.z = t * 0.35
    for (const wing of animated.wings ?? []) wing.rotation.y = (wing.userData.side as number) * (0.25 + Math.sin(t * 3) * 0.22)
  }
  return {
    group,
    animate,
    jump: (t) => {
      if (t - jumpAt > JUMP_SECONDS) jumpAt = t
    },
    look: (x, y) => {
      gaze.x = Math.min(Math.max(x, -1), 1)
      gaze.y = Math.min(Math.max(y, -1), 1)
    },
  }
}
