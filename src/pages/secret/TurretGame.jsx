import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { buildLothal, buildStarDestroyer, buildStars, disposeScene, metal, paintGlow, seeded } from "./scenery"
import { createRenderer } from "./renderer"
import { audio } from "./sound"

/*
 * Battery 7: a turbolaser emplacement on the dorsal hull of the ISD Chimaera. Rebel fighters fly
 * attack runs at it in waves: they come in from deep space, strafe the hull around the battery,
 * break off and come round again. Aim with the mouse or a finger and hold to fire (Space and the
 * arrow keys work too). Bolts are fast but not instant, so each fighter carries a lead marker
 * showing where to aim. Every Rebel bolt that lands close to the battery costs hull; the guns
 * overheat if you hold the trigger too long. All the ships are modelled from scratch in three.js.
 */

const HULL_MAX = 100
const FIRE_GAP = 0.11 // seconds between shots, alternating barrels
const BOLT_SPEED = 900
const ENEMY_BOLT_SPEED = 300
const DECK = -12 // the hull's surface, below the gunner's eye
const BATTERY = new THREE.Vector3(0, DECK, -10)
const DANGER = 28 // Rebel bolts landing within this distance of the battery do damage
const BEST_KEY = "chimaera-battery-best"
const MAX_TARGETS = 14

const KINDS = {
    xwing: { name: "X-wing", hp: 2, speed: 120, turn: 1.15, radius: 8, score: 100 },
    awing: { name: "A-wing", hp: 1, speed: 175, turn: 1.6, radius: 6, score: 150 },
}

// Each wave sends more fighters; A-wings join from wave 2
const waveOf = (n) => [...Array(2 + n).fill("xwing"), ...Array(Math.max(0, n - 1)).fill("awing")].sort(() => Math.random() - 0.5)

const readBest = () => {
    try {
        return Number(localStorage.getItem(BEST_KEY)) || 0
    } catch {
        return 0
    }
}

// ---------- sounds (synthesised, on the channel's shared audio context) ----------
const pew = (high = true, volume = 0.045) => {
    const a = audio()
    if (!a) return
    const t = a.currentTime
    const osc = a.createOscillator()
    const gain = a.createGain()
    osc.type = "square"
    osc.frequency.setValueAtTime(high ? 1150 : 640, t)
    osc.frequency.exponentialRampToValueAtTime(high ? 170 : 110, t + 0.16)
    gain.gain.setValueAtTime(volume, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.17)
    osc.connect(gain).connect(a.destination)
    osc.start(t)
    osc.stop(t + 0.18)
}
const noise = (seconds, from, to, volume) => {
    const a = audio()
    if (!a) return
    const t = a.currentTime
    const buffer = a.createBuffer(1, Math.floor(a.sampleRate * seconds), a.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2)
    const src = a.createBufferSource()
    src.buffer = buffer
    const filter = a.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.setValueAtTime(from, t)
    filter.frequency.exponentialRampToValueAtTime(to, t + seconds)
    const gain = a.createGain()
    gain.gain.value = volume
    src.connect(filter).connect(gain).connect(a.destination)
    src.start(t)
}
const boom = (volume = 0.3) => noise(0.7, 1800, 110, volume)
const thud = () => noise(0.35, 500, 60, 0.4)

// ---------- models ----------
const flat = (color, extra) => metal(color, { metalness: 0.35, roughness: 0.55, flatShading: true, ...extra })

// An X-wing, nose along +Z, S-foils open in attack position; about 12 units long
const buildXWing = () => {
    const ship = new THREE.Group()
    const white = flat(0xd9dcd8)
    const grey = flat(0x8d9196)
    const dark = flat(0x2b2f35)
    const red = flat(0xb3261e)
    const add = (geometry, material, x = 0, y = 0, z = 0) => {
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(x, y, z)
        ship.add(mesh)
        return mesh
    }
    const square = (r1, r2, len) => new THREE.CylinderGeometry(r1, r2, len, 4, 1).rotateY(Math.PI / 4).rotateX(Math.PI / 2)
    add(square(0.55, 0.95, 7), white, 0, 0, 0.4)
    add(square(0.12, 0.55, 2.6), white, 0, -0.05, 5.1)
    add(square(0.58, 0.62, 0.35), red, 0, 0, 3.7)
    add(new THREE.BoxGeometry(0.6, 0.45, 1.6), dark, 0, 0.62, 1.4).rotation.x = -0.12
    add(new THREE.SphereGeometry(0.34, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), flat(0x3a6fd0), 0, 0.72, -0.3)
    add(new THREE.BoxGeometry(1.9, 1.5, 2.2), grey, 0, 0, -2.6)
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff7a4a })
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
        const wing = new THREE.Group()
        wing.position.set(0, sy * 0.25, -2.4)
        wing.rotation.z = sx * sy * 0.24
        const part = (geometry, material, x, y, z, along = false) => {
            const m = new THREE.Mesh(geometry, material)
            if (along) m.rotation.x = Math.PI / 2
            m.position.set(x, y, z)
            wing.add(m)
        }
        part(new THREE.BoxGeometry(5.4, 0.12, 2.4), white, sx * 3.1, 0, 0)
        part(new THREE.BoxGeometry(1.4, 0.14, 2.42), red, sx * 2.4, 0, 0)
        part(new THREE.CylinderGeometry(0.42, 0.42, 3.2, 12), grey, sx * 1.25, sy * 0.4, -0.2, true)
        const glow = new THREE.Mesh(new THREE.CircleGeometry(0.34, 16), glowMat)
        glow.position.set(sx * 1.25, sy * 0.4, -1.82)
        glow.rotation.y = Math.PI
        wing.add(glow)
        part(new THREE.CylinderGeometry(0.07, 0.1, 6.4, 8), grey, sx * 5.75, 0, 2.4, true)
        part(new THREE.CylinderGeometry(0.16, 0.16, 0.9, 8), dark, sx * 5.75, 0, 5.2, true)
        ship.add(wing)
    }
    return ship
}

// An A-wing: a flat red-and-white wedge between two big engines; about 7 units long
const buildAWing = () => {
    const ship = new THREE.Group()
    const shape = new THREE.Shape()
    shape.moveTo(0, 4.2)
    shape.lineTo(-2.4, -2)
    shape.lineTo(2.4, -2)
    shape.closePath()
    const body = new THREE.ExtrudeGeometry(shape, { depth: 0.7, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, 0.35, 0)
    ship.add(new THREE.Mesh(body, flat(0xd8d6cf)))
    const stripe = new THREE.Shape()
    stripe.moveTo(0, 3.4)
    stripe.lineTo(-1.1, 0.6)
    stripe.lineTo(1.1, 0.6)
    stripe.closePath()
    const stripeGeo = new THREE.ExtrudeGeometry(stripe, { depth: 0.08, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, 0.43, 0)
    ship.add(new THREE.Mesh(stripeGeo, flat(0xb3261e)))
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), flat(0x23272d))
    canopy.position.set(0, 0.35, 0.2)
    canopy.scale.z = 1.6
    ship.add(canopy)
    for (const sx of [-1, 1]) {
        const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 3.6, 12), flat(0x9a9fa6))
        engine.rotation.x = Math.PI / 2
        engine.position.set(sx * 2.15, 0, -1.4)
        ship.add(engine)
        const glow = new THREE.Mesh(new THREE.CircleGeometry(0.46, 16), new THREE.MeshBasicMaterial({ color: 0xff7a4a }))
        glow.position.set(sx * 2.15, 0, -3.22)
        glow.rotation.y = Math.PI
        ship.add(glow)
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 1.4), flat(0xb3261e))
        fin.position.set(sx * 2.15, 0.9, -2.3)
        ship.add(fin)
    }
    return ship
}

// A TIE fighter, for the patrols crossing in the distance
const buildTie = () => {
    const tie = new THREE.Group()
    const wingMat = flat(0x2c3138)
    const frameMat = flat(0x7b838c)
    for (const x of [-3.2, 3.2]) {
        const wing = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 0.2, 6), wingMat)
        wing.rotation.z = Math.PI / 2
        wing.position.x = x
        tie.add(wing)
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2.4, 8), frameMat)
        strut.rotation.z = Math.PI / 2
        strut.position.x = x * 0.6
        tie.add(strut)
    }
    tie.add(new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 12), frameMat))
    return tie
}

// Hull plating: panels of slightly different greys with dark seams
// Hull plating: rows of panels of different lengths and greys, with dark seams, the odd hatch or
// vent, and small inset plates, so the hull reads as built-up machinery rather than floor tiles
const paintPlating = () => {
    const size = 1024
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = size
    const g = canvas.getContext("2d")
    const rand = seeded(3)
    g.fillStyle = "#1c2026"
    g.fillRect(0, 0, size, size)
    for (let y = 0; y < size; y += 32) {
        let x = 0
        while (x < size) {
            const w = Math.min(size - x, 32 * (1 + Math.floor(rand() * 4)))
            const v = 104 + Math.floor(rand() * 42)
            g.fillStyle = `rgb(${v}, ${v + 4}, ${v + 9})`
            g.fillRect(x + 1, y + 1, w - 2, 30)
            // a few panels carry detail: vents, an inset plate, a darker hatch
            const r = rand()
            if (r < 0.12) {
                g.fillStyle = "rgba(20, 24, 30, 0.6)"
                for (let i = 4; i < w - 4; i += 5) g.fillRect(x + i, y + 8, 2, 16)
            } else if (r < 0.24) {
                g.fillStyle = `rgb(${v + 14}, ${v + 18}, ${v + 22})`
                g.fillRect(x + 6, y + 6, w - 12, 20)
            } else if (r < 0.3) {
                g.fillStyle = "rgb(70, 75, 82)"
                g.fillRect(x + 4, y + 4, Math.min(24, w - 8), 24)
            }
            x += w
        }
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(1 / 120, 1 / 120)
    tex.anisotropy = 8
    return tex
}

// The dorsal hull ahead of the battery: the great wedge running to the bow, its edge dropping away
// to starboard, the central spine, and other gun emplacements along the way
const buildHull = () => {
    const hull = new THREE.Group()
    const plating = paintPlating()
    const plate = new THREE.MeshStandardMaterial({ map: plating, metalness: 0.4, roughness: 0.62 })
    // shape coordinates: x across, y forward (towards the bow, which is -Z in the world)
    // the battery sits near the starboard edge, which runs ahead and across towards the bow
    const bow = [-330, 2400]
    const rearL = [-1300, -260]
    const rearR = [70, -260]
    const shape = new THREE.Shape()
    shape.moveTo(...rearL)
    shape.lineTo(...rearR)
    shape.lineTo(...bow)
    shape.closePath()
    const deck = new THREE.ExtrudeGeometry(shape, { depth: 8, bevelEnabled: false }).rotateX(-Math.PI / 2)
    const deckMesh = new THREE.Mesh(deck, plate)
    deckMesh.position.y = DECK - 8
    hull.add(deckMesh)
    // the starboard side, sloping away below the edge
    const side = new THREE.BufferGeometry()
    const drop = 220
    side.setAttribute(
        "position",
        new THREE.Float32BufferAttribute([rearR[0], DECK, -rearR[1], bow[0], DECK, -bow[1], rearR[0] + 140, DECK - drop, -rearR[1], bow[0], DECK - drop * 0.4, -bow[1]], 3)
    )
    side.setIndex([0, 2, 1, 1, 2, 3])
    side.computeVertexNormals()
    hull.add(new THREE.Mesh(side, new THREE.MeshStandardMaterial({ color: 0x6d747c, metalness: 0.4, roughness: 0.7, side: THREE.DoubleSide })))
    // a lit trench running along the edge
    const edgeDir = new THREE.Vector3(bow[0] - rearR[0], 0, -(bow[1] - rearR[1]))
    const edgeLen = edgeDir.length()
    edgeDir.normalize()
    const lights = new THREE.InstancedMesh(new THREE.BoxGeometry(0.8, 0.4, 0.8), new THREE.MeshBasicMaterial({ color: 0xcfe8ff }), 70)
    const m = new THREE.Matrix4()
    for (let i = 0; i < 70; i++) {
        const p = new THREE.Vector3(rearR[0], DECK + 0.3, -rearR[1]).addScaledVector(edgeDir, (i / 70) * edgeLen * 0.8).add(new THREE.Vector3(-6, 0, 0))
        m.makeTranslation(p.x, p.y, p.z)
        lights.setMatrixAt(i, m)
    }
    hull.add(lights)

    const steel = flat(0x8f969e, { roughness: 0.6, flatShading: false })
    const darkSteel = flat(0x4f555c, { roughness: 0.55 })
    // the central spine, stepping up towards the superstructure behind you
    const centre = new THREE.Vector3((rearL[0] + rearR[0]) / 2, 0, -rearL[1])
    const spineDir = new THREE.Vector3(bow[0] - centre.x, 0, -bow[1] - centre.z)
    const spineLen = spineDir.length()
    const spine = new THREE.Mesh(new THREE.BoxGeometry(60, 10, spineLen * 0.9), steel)
    spine.position.copy(centre).addScaledVector(spineDir, 0.45)
    spine.position.y = DECK + 5
    spine.rotation.y = Math.atan2(spineDir.x, spineDir.z)
    hull.add(spine)
    const spineTop = new THREE.Mesh(new THREE.BoxGeometry(30, 6, spineLen * 0.7), darkSteel)
    spineTop.position.copy(centre).addScaledVector(spineDir, 0.38)
    spineTop.position.y = DECK + 12
    spineTop.rotation.y = spine.rotation.y
    hull.add(spineTop)

    // raised panels in rows parallel to the edge, the way the real hull is built up in layers
    const panelGeo = new THREE.BoxGeometry(1, 1, 1)
    const panels = new THREE.InstancedMesh(panelGeo, flat(0x7d848c, { flatShading: false }), 90)
    const rand = seeded(17)
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(edgeDir.x, edgeDir.z))
    for (let i = 0; i < 90; i++) {
        const row = i % 3
        const along = 0.2 + (Math.floor(i / 3) / 30) * 0.75
        const p = new THREE.Vector3(rearR[0], DECK, -rearR[1]).addScaledVector(edgeDir, along * edgeLen)
        p.x -= 40 + row * 55 + rand() * 10
        const s = new THREE.Vector3(18 + rand() * 20, 0.8 + rand() * 1.6, 30 + rand() * 50)
        p.y = DECK + s.y / 2
        m.compose(p, q, s)
        panels.setMatrixAt(i, m)
    }
    hull.add(panels)

    // other turbolaser emplacements down the hull, which fire back at the fighters too
    const mounts = []
    const base = new THREE.CylinderGeometry(4.2, 5, 2, 20)
    const dome = new THREE.SphereGeometry(3.4, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2)
    const gun = new THREE.CylinderGeometry(0.35, 0.42, 9, 10).rotateX(Math.PI / 2)
    for (const [x, z, turn] of [
        [120, -120, 0.5],
        [60, -380, -0.2],
        [-120, -260, 0.3],
        [10, -700, 0.8],
        [-200, -560, -0.4],
        [-60, -1000, 0.2],
    ]) {
        const mount = new THREE.Group()
        mount.position.set(x, DECK, z)
        mount.rotation.y = turn
        const b0 = new THREE.Mesh(base, darkSteel)
        b0.position.y = 1
        mount.add(b0)
        const d0 = new THREE.Mesh(dome, steel)
        d0.position.y = 2
        mount.add(d0)
        for (const off of [-1, 1]) {
            const barrel = new THREE.Mesh(gun, darkSteel)
            barrel.position.set(off, 3.4, -4.8)
            mount.add(barrel)
        }
        hull.add(mount)
        mounts.push(mount)
    }
    return { hull, mounts }
}

// Battery 7's own twin barrels, at the bottom of the view
const buildBarrels = () => {
    const mount = new THREE.Group()
    const housing = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.6, 3), flat(0x5f666e))
    mount.add(housing)
    const muzzles = []
    const barrels = []
    for (const x of [-0.9, 0.9]) {
        const barrel = new THREE.Group()
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 7.5, 12).rotateX(Math.PI / 2), flat(0x3c4249))
        tube.position.z = 4.2
        barrel.add(tube)
        const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 1.2, 12).rotateX(Math.PI / 2), flat(0x2b3036))
        shroud.position.z = 1.6
        barrel.add(shroud)
        barrel.position.set(x, 0.1, 0)
        mount.add(barrel)
        barrels.push(barrel)
        const muzzle = new THREE.Object3D()
        muzzle.position.set(x, 0.1, 8.1)
        mount.add(muzzle)
        muzzles.push(muzzle)
    }
    return { mount, muzzles, barrels }
}

const TurretGame = ({ onLeave }) => {
    const rootRef = useRef(null)
    const mountRef = useRef(null)
    const reticleRef = useRef(null)
    const targetsRef = useRef(null)
    const heatRef = useRef(null)
    const floatRef = useRef(null)
    const hurtRef = useRef(null)
    const [phase, setPhase] = useState("ready") // ready | playing | over
    const phaseRef = useRef(phase)
    const [hud, setHud] = useState({ score: 0, kills: 0, hull: HULL_MAX, wave: 1 })
    const [banner, setBanner] = useState(null)
    const [best, setBest] = useState(readBest)
    const api = useRef({})
    useEffect(() => {
        phaseRef.current = phase
    }, [phase])

    useEffect(() => {
        const mount = mountRef.current
        const root = rootRef.current
        const gl = createRenderer(mount, {})
        if (!gl) return
        const { renderer } = gl
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x020308)
        const camera = new THREE.PerspectiveCamera(60, 1, 0.5, 6000)
        const cameraHome = new THREE.Euler(0, 0, 0, "YXZ")

        scene.add(new THREE.AmbientLight(0x6c7a90, 0.5))
        scene.add(new THREE.HemisphereLight(0x9fb8d6, 0x1a1e24, 0.6))
        const sun = new THREE.DirectionalLight(0xfff0d8, 3)
        sun.position.set(-120, 90, 40)
        scene.add(sun)

        scene.add(buildStars(2600, 4000, 1.6))
        const lothal = buildLothal(1100)
        lothal.position.set(1100, -1050, -2600)
        scene.add(lothal)
        const sister = buildStarDestroyer()
        sister.position.set(-1100, -40, -2300)
        sister.rotation.y = 0.35
        sister.scale.setScalar(9)
        scene.add(sister)
        const { hull: hullModel, mounts } = buildHull()
        scene.add(hullModel)
        const { mount: turret, muzzles, barrels } = buildBarrels()
        turret.position.set(0, -5.2, -8)
        scene.add(turret)

        const glowTex = paintGlow()
        const sprite = (color, additive = true) =>
            new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }))
        const muzzleFlash = muzzles.map(() => {
            const s = sprite(0x9dffb0)
            s.scale.setScalar(5)
            s.material.opacity = 0
            scene.add(s)
            return s
        })

        // TIE patrols crossing far off, for company
        const tieTemplate = buildTie()
        const ties = Array.from({ length: 3 }, (_, i) => {
            const tie = tieTemplate.clone()
            scene.add(tie)
            return { tie, lane: i, phase: i * 0.37 }
        })

        // ---------- pools ----------
        const boltGeo = new THREE.CylinderGeometry(0.22, 0.22, 14, 6).rotateX(Math.PI / 2)
        const enemyBoltGeo = new THREE.CylinderGeometry(0.28, 0.28, 9, 6).rotateX(Math.PI / 2)
        const greenBolt = new THREE.MeshBasicMaterial({ color: 0x8dffa6 })
        const redBolt = new THREE.MeshBasicMaterial({ color: 0xff4636 })
        const blasts = [] // { sprite, age, life, size }
        const debris = [] // { mesh, vel, spin, age }
        const debrisGeo = new THREE.BoxGeometry(1, 0.3, 1.4)
        const debrisMat = flat(0x9aa0a6)

        const blast = (at, size, color = 0xffb04a, life = 0.7) => {
            const s = sprite(color)
            s.position.copy(at)
            scene.add(s)
            blasts.push({ sprite: s, age: 0, life, size })
        }
        const explode = (at, big) => {
            blast(at, big ? 26 : 14, 0xffc070, 0.8)
            blast(at, big ? 12 : 7, 0xffffff, 0.3)
            for (let i = 0; i < (big ? 9 : 4); i++) {
                const mesh = new THREE.Mesh(debrisGeo, debrisMat)
                mesh.position.copy(at)
                mesh.scale.setScalar(0.6 + Math.random() * 1.4)
                scene.add(mesh)
                debris.push({ mesh, vel: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).multiplyScalar(90), spin: new THREE.Vector3(Math.random() * 8, Math.random() * 8, 0), age: 0 })
            }
            boom(big ? 0.32 : 0.18)
        }

        // ---------- game state ----------
        const templates = { xwing: buildXWing(), awing: buildAWing() }
        let enemies = []
        let bolts = [] // ours: { mesh, dir, life }
        let enemyBolts = [] // theirs: { mesh, from, to, t, dur, aimedAtGun }
        let score = 0
        let kills = 0
        let hull = HULL_MAX
        let wave = 1
        let queue = []
        let spawnIn = 0
        let waveBreak = 0 // seconds until the next wave starts
        let fireCooldown = 0
        let barrel = 0
        let heat = 0
        let overheated = false
        let firing = false
        let shake = 0
        let combo = 0
        let comboT = 0
        let enemyPewT = 0
        const aim = new THREE.Vector2(0, 0.12)
        const keys = new Set()
        const raycaster = new THREE.Raycaster()
        const tmp = new THREE.Vector3()

        const pushHud = () => setHud({ score, kills, hull: Math.max(0, Math.round(hull)), wave })
        let bannerTimer = null
        const announce = (title, sub) => {
            setBanner({ title, sub, id: performance.now() })
            clearTimeout(bannerTimer)
            bannerTimer = setTimeout(() => setBanner(null), 2600)
        }

        const rand = (a, b) => a + Math.random() * (b - a)
        const farPoint = () => new THREE.Vector3(rand(-900, 900), rand(80, 360), rand(-2000, -1500))
        const attackStart = () => new THREE.Vector3(rand(-260, 260), rand(40, 110), rand(-720, -460))

        const spawn = (kind, demo = false) => {
            const spec = KINDS[kind]
            const group = templates[kind].clone()
            const pos = farPoint()
            const goal = attackStart()
            const vel = goal.clone().sub(pos).setLength(spec.speed)
            group.position.copy(pos)
            scene.add(group)
            enemies.push({ kind, spec, group, pos, vel, goal, mode: "approach", modeT: 0, hp: spec.hp, bank: 0, fireCd: rand(0.3, 0.8), demo, smoke: 0 })
        }

        const clearField = () => {
            for (const e of enemies) scene.remove(e.group)
            for (const b of bolts) scene.remove(b.mesh)
            for (const b of enemyBolts) scene.remove(b.mesh)
            enemies = []
            bolts = []
            enemyBolts = []
        }

        const startWave = (n) => {
            wave = n
            queue = waveOf(n)
            spawnIn = 0.6
            pushHud()
            announce(`Wave ${n}`, n === 2 ? "A-wings joining the attack" : n === 1 ? "X-wings inbound" : `${queue.length} fighters inbound`)
        }

        const reset = () => {
            clearField()
            score = 0
            kills = 0
            hull = HULL_MAX
            heat = 0
            overheated = false
            combo = 0
            waveBreak = 0
            startWave(1)
        }
        api.current.reset = reset

        // a couple of fighters fly about behind the start card
        spawn("xwing", true)
        spawn("xwing", true)

        const gameOver = () => {
            phaseRef.current = "over"
            setPhase("over")
            setBest((prev) => {
                const next = Math.max(prev, score)
                try {
                    localStorage.setItem(BEST_KEY, String(next))
                } catch {
                    // can't remember it: fine
                }
                return next
            })
        }

        const damage = (amount) => {
            if (phaseRef.current !== "playing") return
            hull -= amount
            shake = Math.min(1, shake + amount / 10)
            thud()
            pushHud()
            const el = hurtRef.current
            if (el) {
                el.classList.remove("is-on")
                void el.offsetWidth
                el.classList.add("is-on")
            }
            if (hull <= 0) gameOver()
        }

        const floatText = (at, text) => {
            const layer = floatRef.current
            if (!layer) return
            tmp.copy(at).project(camera)
            if (tmp.z > 1) return
            const el = document.createElement("span")
            el.className = "turret-float"
            el.textContent = text
            el.style.left = `${((tmp.x + 1) / 2) * mount.clientWidth}px`
            el.style.top = `${((1 - tmp.y) / 2) * mount.clientHeight}px`
            layer.appendChild(el)
            setTimeout(() => el.remove(), 900)
        }

        const kill = (e, i) => {
            explode(e.pos, e.kind === "xwing")
            scene.remove(e.group)
            enemies.splice(i, 1)
            if (e.demo) return
            combo = comboT > 0 ? combo + 1 : 1
            comboT = 2.5
            const points = e.spec.score * Math.min(combo, 4)
            score += points
            kills += 1
            floatText(e.pos, combo > 1 ? `+${points} ×${Math.min(combo, 4)}` : `+${points}`)
            pushHud()
        }

        const fire = () => {
            if (fireCooldown > 0 || overheated) return
            fireCooldown = FIRE_GAP
            heat += 0.045
            if (heat >= 1) {
                overheated = true
                heat = 1
            }
            raycaster.setFromCamera(aim, camera)
            const target = raycaster.ray.origin.clone().addScaledVector(raycaster.ray.direction, 700)
            const i = (barrel = 1 - barrel)
            const from = muzzles[i].getWorldPosition(new THREE.Vector3())
            const dir = target.sub(from).normalize()
            const mesh = new THREE.Mesh(boltGeo, greenBolt)
            mesh.position.copy(from)
            mesh.lookAt(from.clone().add(dir))
            scene.add(mesh)
            bolts.push({ mesh, dir, life: 1.4 })
            barrels[i].position.z = -0.9
            muzzleFlash[i].material.opacity = 1
            pew(true)
        }

        // ---------- input ----------
        const setAim = (e) => {
            const rect = mount.getBoundingClientRect()
            aim.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
        }
        const onDown = (e) => {
            if (e.target.closest("button")) return
            setAim(e)
            if (phaseRef.current !== "playing") return
            firing = true
            root.setPointerCapture?.(e.pointerId)
            fire()
        }
        const onMove = (e) => setAim(e)
        const onUp = () => (firing = false)
        root.addEventListener("pointerdown", onDown)
        root.addEventListener("pointermove", onMove)
        window.addEventListener("pointerup", onUp)
        window.addEventListener("pointercancel", onUp)
        const AIM_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "a", "d", "w", "s"]
        const onKeyDown = (e) => {
            if (phaseRef.current !== "playing") return
            if (e.key === " ") {
                e.preventDefault()
                firing = true
            } else if (AIM_KEYS.includes(e.key)) {
                e.preventDefault()
                keys.add(e.key)
            }
        }
        const onKeyUp = (e) => {
            if (e.key === " ") firing = false
            keys.delete(e.key)
        }
        window.addEventListener("keydown", onKeyDown)
        window.addEventListener("keyup", onKeyUp)

        const resize = () => {
            const w = mount.clientWidth
            const h = mount.clientHeight
            if (!w || !h) return
            gl.resize(w, h)
            camera.aspect = w / h
            camera.fov = w / h < 1 ? 80 : 60
            camera.updateProjectionMatrix()
        }
        const observer = new ResizeObserver(resize)
        observer.observe(mount)
        resize()

        // target brackets and lead markers, as plain elements over the canvas
        const markers = Array.from({ length: MAX_TARGETS }, () => {
            const el = document.createElement("span")
            el.className = "turret-target"
            el.innerHTML = `<i class="turret-bracket"></i><i class="turret-lead"></i>`
            targetsRef.current.appendChild(el)
            return { el, bracket: el.firstChild, lead: el.lastChild }
        })

        // ---------- flight ----------
        const dir = new THREE.Vector3()
        const want = new THREE.Vector3()
        const fly = (e, dt) => {
            want.copy(e.goal).sub(e.pos).normalize()
            dir.copy(e.vel).normalize()
            const angle = dir.angleTo(want)
            if (angle > 1e-4) dir.lerp(want, Math.min(1, (e.spec.turn * dt) / angle)).normalize()
            // bank into the turn
            const side = tmp.crossVectors(e.vel, want).y / e.spec.speed
            e.bank += (THREE.MathUtils.clamp(-side * 2.5, -1.2, 1.2) - e.bank) * Math.min(1, dt * 3)
            e.vel.copy(dir).multiplyScalar(e.spec.speed)
            e.pos.addScaledVector(e.vel, dt)
            e.group.position.copy(e.pos)
            e.group.lookAt(tmp.copy(e.pos).add(dir))
            e.group.rotateZ(e.bank)
        }
        // approach → strafe the hull round the battery → break away → regroup far out → approach again
        const think = (e, dt) => {
            e.modeT += dt
            const d = e.pos.distanceTo(e.goal)
            if (e.mode === "approach" && d < 70) {
                e.mode = "strafe"
                e.modeT = 0
                e.goal = new THREE.Vector3(rand(-70, 70), DECK + rand(16, 34), rand(-150, -70))
            } else if (e.mode === "strafe" && (d < 45 || e.modeT > 7)) {
                e.mode = "break"
                e.modeT = 0
                e.goal = new THREE.Vector3((Math.random() < 0.5 ? -1 : 1) * rand(380, 700), rand(160, 320), rand(-420, -160))
            } else if (e.mode === "break" && (d < 90 || e.modeT > 6)) {
                e.mode = "regroup"
                e.modeT = 0
                e.goal = farPoint().multiplyScalar(0.7)
            } else if (e.mode === "regroup" && (d < 120 || e.modeT > 7)) {
                e.mode = "approach"
                e.modeT = 0
                e.goal = attackStart()
            }
        }
        const enemyFire = (e, dt) => {
            if (e.mode !== "strafe" || e.demo || phaseRef.current !== "playing") return
            e.fireCd -= dt
            if (e.fireCd > 0) return
            tmp.copy(BATTERY).sub(e.pos)
            const dist = tmp.length()
            if (dist > 550 || tmp.normalize().dot(dir.copy(e.vel).normalize()) < 0.55) return
            e.fireCd = rand(0.5, 0.9)
            // twin shots that land on the hull round the battery; some are aimed at the gun itself
            for (const side of e.kind === "xwing" ? [-1, 1] : [0]) {
                const from = e.group.localToWorld(new THREE.Vector3(side * 5.7, 0, 5.5))
                const atGun = Math.random() < 0.12
                const to = atGun ? turret.position.clone().add(new THREE.Vector3(rand(-2, 2), 0, rand(-2, 2))) : new THREE.Vector3(BATTERY.x + rand(-55, 55), DECK, BATTERY.z + rand(-70, 40))
                const mesh = new THREE.Mesh(enemyBoltGeo, redBolt)
                mesh.position.copy(from)
                mesh.lookAt(to)
                scene.add(mesh)
                enemyBolts.push({ mesh, from, to, t: 0, dur: from.distanceTo(to) / ENEMY_BOLT_SPEED, atGun })
            }
            if (enemyPewT <= 0) {
                pew(false, 0.025)
                enemyPewT = 0.25
            }
        }

        // where to aim so a bolt meets the fighter: solve |D + V t| = s t
        const leadPoint = (e, out) => {
            const D = tmp.copy(e.pos).sub(camera.position)
            const a = e.vel.lengthSq() - BOLT_SPEED * BOLT_SPEED
            const b = 2 * D.dot(e.vel)
            const c = D.lengthSq()
            const disc = b * b - 4 * a * c
            const t = disc < 0 ? 0 : (-b - Math.sqrt(disc)) / (2 * a)
            return out.copy(e.pos).addScaledVector(e.vel, Math.max(0, t))
        }

        const toScreen = (p, w, h) => {
            tmp.copy(p).project(camera)
            return { x: ((tmp.x + 1) / 2) * w, y: ((1 - tmp.y) / 2) * h, behind: tmp.z > 1 }
        }

        const lead = new THREE.Vector3()
        const segment = new THREE.Vector3()
        const boltStart = new THREE.Vector3()
        const closest = new THREE.Vector3()
        const toCentre = new THREE.Vector3()
        let last = performance.now()
        let frame
        const tick = (now) => {
            frame = requestAnimationFrame(tick)
            const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
            gl.frame(dt)
            last = now
            if (document.hidden) return
            const t = now / 1000
            const playing = phaseRef.current === "playing"

            // keyboard aiming
            if (keys.size) {
                const k = dt * 1.1
                if (keys.has("ArrowLeft") || keys.has("a")) aim.x -= k
                if (keys.has("ArrowRight") || keys.has("d")) aim.x += k
                if (keys.has("ArrowUp") || keys.has("w")) aim.y += k
                if (keys.has("ArrowDown") || keys.has("s")) aim.y -= k
                aim.x = THREE.MathUtils.clamp(aim.x, -0.98, 0.98)
                aim.y = THREE.MathUtils.clamp(aim.y, -0.9, 0.98)
            }
            const w = mount.clientWidth
            const h = mount.clientHeight
            if (reticleRef.current) reticleRef.current.style.transform = `translate(${((aim.x + 1) / 2) * w}px, ${((1 - aim.y) / 2) * h}px)`

            // camera shake from hits, settling quickly
            shake = Math.max(0, shake - dt * 2.2)
            const s = reduceMotion ? 0 : shake * 0.012
            camera.rotation.set(cameraHome.x + (Math.random() - 0.5) * s, cameraHome.y + (Math.random() - 0.5) * s, (Math.random() - 0.5) * s * 0.5)

            // the barrels follow the aim and recoil when they fire
            raycaster.setFromCamera(aim, camera)
            turret.lookAt(tmp.copy(raycaster.ray.direction).multiplyScalar(500).add(camera.position))
            for (const b of barrels) b.position.z += (0 - b.position.z) * Math.min(1, dt * 12)
            muzzleFlash.forEach((f, i) => {
                muzzles[i].getWorldPosition(f.position)
                f.material.opacity = Math.max(0, f.material.opacity - dt * 14)
            })

            fireCooldown -= dt
            enemyPewT -= dt
            comboT -= dt
            heat = Math.max(0, heat - dt * (overheated ? 0.45 : 0.32))
            if (overheated && heat < 0.25) overheated = false
            if (heatRef.current) {
                heatRef.current.style.transform = `scaleX(${heat})`
                heatRef.current.parentElement.parentElement.classList.toggle("is-hot", overheated)
            }
            if (playing && firing) fire()

            // waves
            if (playing) {
                if (waveBreak > 0) {
                    waveBreak -= dt
                    if (waveBreak <= 0) startWave(wave + 1)
                } else {
                    spawnIn -= dt
                    if (queue.length && spawnIn <= 0 && enemies.length < 3 + wave) {
                        spawn(queue.shift())
                        spawnIn = rand(0.9, 1.8)
                    }
                    if (!queue.length && !enemies.length) {
                        hull = Math.min(HULL_MAX, hull + 10)
                        pushHud()
                        announce(`Wave ${wave} cleared`, "Hull repaired +10")
                        waveBreak = 3.5
                    }
                }
            }

            // fighters fly their runs
            for (const e of enemies) {
                think(e, dt)
                fly(e, dt)
                enemyFire(e, dt)
                if (e.smoke > 0) {
                    e.smoke -= dt
                    if (Math.random() < dt * 20) blast(e.pos, 4, 0x8a8f96, 0.6)
                }
            }

            // our bolts: swept against each fighter so fast shots can't skip through
            for (let i = bolts.length - 1; i >= 0; i--) {
                const b = bolts[i]
                const step = BOLT_SPEED * dt
                const start = boltStart.copy(b.mesh.position)
                b.mesh.position.addScaledVector(b.dir, step)
                b.life -= dt
                let gone = b.life <= 0
                // (the other batteries' shots are for show; only yours count)
                for (let j = enemies.length - 1; j >= 0 && !gone && !b.ally; j--) {
                    const e = enemies[j]
                    segment.copy(b.dir).multiplyScalar(step)
                    toCentre.copy(e.pos).sub(start)
                    const k = THREE.MathUtils.clamp(toCentre.dot(segment) / segment.lengthSq(), 0, 1)
                    if (closest.copy(start).addScaledVector(segment, k).distanceTo(e.pos) < e.spec.radius) {
                        gone = true
                        e.hp -= 1
                        if (e.hp <= 0) kill(e, j)
                        else {
                            e.smoke = 3
                            blast(e.pos, 6, 0xffd08a, 0.35)
                            boom(0.08)
                        }
                    }
                }
                if (gone) {
                    scene.remove(b.mesh)
                    bolts.splice(i, 1)
                }
            }

            // their bolts land on the hull; anything close to the battery hurts
            for (let i = enemyBolts.length - 1; i >= 0; i--) {
                const b = enemyBolts[i]
                b.t += dt
                const k = Math.min(1, b.t / b.dur)
                b.mesh.position.copy(b.from).lerp(b.to, k)
                if (k < 1) continue
                scene.remove(b.mesh)
                enemyBolts.splice(i, 1)
                blast(b.to, 7, 0xff7a4a, 0.45)
                const d = Math.hypot(b.to.x - BATTERY.x, b.to.z - BATTERY.z)
                if (b.atGun) damage(4)
                else if (d < DANGER) damage(Math.round(1 + 3 * (1 - d / DANGER)))
            }

            // the other batteries along the hull take shots at the fighters now and then
            if (enemies.length && Math.random() < dt * 1.5) {
                const m = mounts[Math.floor(Math.random() * mounts.length)]
                const e = enemies[Math.floor(Math.random() * enemies.length)]
                const from = m.position.clone().add(new THREE.Vector3(0, 4, 0))
                const dirTo = e.pos.clone().add(new THREE.Vector3(rand(-40, 40), rand(-20, 30), rand(-40, 40))).sub(from).normalize()
                const mesh = new THREE.Mesh(boltGeo, greenBolt)
                mesh.position.copy(from)
                mesh.lookAt(from.clone().add(dirTo))
                scene.add(mesh)
                bolts.push({ mesh, dir: dirTo, life: 1.2, ally: true })
            }

            // explosions and debris
            for (let i = blasts.length - 1; i >= 0; i--) {
                const b = blasts[i]
                b.age += dt
                const k = b.age / b.life
                b.sprite.scale.setScalar(b.size * (0.6 + k * 1.2))
                b.sprite.material.opacity = Math.max(0, 1 - k)
                if (k >= 1) {
                    scene.remove(b.sprite)
                    b.sprite.material.dispose()
                    blasts.splice(i, 1)
                }
            }
            for (let i = debris.length - 1; i >= 0; i--) {
                const d = debris[i]
                d.age += dt
                d.mesh.position.addScaledVector(d.vel, dt)
                d.mesh.rotation.x += d.spin.x * dt
                d.mesh.rotation.y += d.spin.y * dt
                if (d.age > 2.5) {
                    scene.remove(d.mesh)
                    debris.splice(i, 1)
                }
            }

            // TIEs on patrol in the distance
            for (const { tie, lane, phase: p } of ties) {
                const k = ((t * 0.035 + p) % 1) * 2 - 1
                tie.position.set(k * 2200, 260 + lane * 140, -1500 - lane * 400)
                tie.rotation.y = Math.PI / 2
                tie.scale.setScalar(3)
            }
            lothal.rotation.y += dt * 0.004

            renderer.render(scene, camera)

            // brackets on each fighter, with the lead marker; arrows at the edge for ones off screen
            markers.forEach((mk, i) => {
                const e = enemies[i]
                if (!e || e.demo || !playing) {
                    mk.el.style.display = "none"
                    return
                }
                mk.el.style.display = ""
                const p = toScreen(e.pos, w, h)
                const off = p.behind || p.x < 0 || p.y < 0 || p.x > w || p.y > h
                mk.el.classList.toggle("is-off", off)
                mk.el.classList.toggle("is-strafing", e.mode === "strafe")
                if (off) {
                    // point from the centre of the view towards it
                    let dx = p.x - w / 2
                    let dy = p.y - h / 2
                    if (p.behind) {
                        dx = -dx
                        dy = -dy
                    }
                    const scale = Math.min((w / 2 - 24) / Math.abs(dx || 1), (h / 2 - 24) / Math.abs(dy || 1))
                    mk.el.style.transform = `translate(${w / 2 + dx * scale}px, ${h / 2 + dy * scale}px) rotate(${Math.atan2(dy, dx)}rad)`
                    return
                }
                const size = THREE.MathUtils.clamp((e.spec.radius * 2.6 * h) / (e.pos.distanceTo(camera.position) * Math.tan((camera.fov * Math.PI) / 360) * 2), 18, 120)
                mk.el.style.transform = `translate(${p.x}px, ${p.y}px)`
                mk.bracket.style.width = mk.bracket.style.height = `${size}px`
                const l = toScreen(leadPoint(e, lead), w, h)
                mk.lead.style.transform = `translate(${l.x - p.x}px, ${l.y - p.y}px) rotate(45deg)`
            })
        }
        gl.begin(scene, camera, () => (frame = requestAnimationFrame(tick)))

        return () => {
            cancelAnimationFrame(frame)
            clearTimeout(bannerTimer)
            observer.disconnect()
            root.removeEventListener("pointerdown", onDown)
            root.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerup", onUp)
            window.removeEventListener("pointercancel", onUp)
            window.removeEventListener("keydown", onKeyDown)
            window.removeEventListener("keyup", onKeyUp)
            for (const mk of markers) mk.el.remove()
            for (const tpl of Object.values(templates)) scene.add(tpl)
            scene.add(tieTemplate)
            disposeScene(scene)
            glowTex.dispose()
            renderer.dispose()
            renderer.domElement.remove()
        }
    }, [])

    const start = () => {
        audio()
        api.current.reset?.()
        phaseRef.current = "playing"
        setPhase("playing")
    }

    const hullShare = hud.hull / HULL_MAX

    return (
        <div className={`turret is-${phase}`} ref={rootRef}>
            <div className="turret-view" ref={mountRef} />
            <div className="turret-targets" ref={targetsRef} aria-hidden="true" />
            <div className="turret-floats" ref={floatRef} aria-hidden="true" />
            <span className="turret-reticle" ref={reticleRef} aria-hidden="true" />
            <div className="turret-hurt" ref={hurtRef} aria-hidden="true" />

            <div className="turret-hud turret-hud-top">
                <div className="turret-id">
                    <span>Turbolaser battery 7</span>
                    <span>ISD Chimaera · dorsal hull</span>
                </div>
                <div className="turret-score">
                    <span>Score</span>
                    <strong>{hud.score.toLocaleString()}</strong>
                    <span>
                        Wave {hud.wave} · {hud.kills} down
                    </span>
                </div>
                <button type="button" className="turret-leave" onClick={onLeave}>
                    Holotable <kbd>Esc</kbd>
                </button>
            </div>

            <div className="turret-hud turret-hud-bottom" aria-hidden={phase !== "playing"}>
                <div className={`turret-gauge ${hullShare < 0.35 ? "is-low" : ""}`}>
                    <span>Hull</span>
                    <span className="turret-gauge-bar">
                        <span style={{ transform: `scaleX(${hullShare})` }} />
                    </span>
                    <strong>{hud.hull}%</strong>
                </div>
                <div className="turret-gauge turret-heat">
                    <span>Heat</span>
                    <span className="turret-gauge-bar">
                        <span ref={heatRef} />
                    </span>
                    <strong className="turret-heat-warn">Overheated</strong>
                </div>
            </div>

            {banner && phase === "playing" && (
                <div key={banner.id} className="turret-banner" role="status">
                    <strong>{banner.title}</strong>
                    <span>{banner.sub}</span>
                </div>
            )}

            {phase !== "playing" && (
                <div className="turret-card" role="dialog" aria-label={phase === "ready" ? "Man the battery" : "Battery offline"}>
                    <p className="turret-card-kicker">{phase === "ready" ? "Battery 7 · gunner's station" : "Battery 7 · offline"}</p>
                    <h3>{phase === "ready" ? "Rebel fighters inbound" : "Hull breached"}</h3>
                    {phase === "ready" ? (
                        <ul className="turret-rules">
                            <li>Aim with your mouse or finger, and hold to fire. Space and the arrow keys work too.</li>
                            <li>Your bolts take time to arrive. Aim at the small diamond ahead of each fighter, not the fighter.</li>
                            <li>Rebel bolts that land near the battery damage the hull. Fighters turn red while they strafe.</li>
                            <li>Fire in bursts: the guns lock up for a moment if they overheat.</li>
                        </ul>
                    ) : (
                        <p>
                            You scored <strong>{hud.score.toLocaleString()}</strong>, shooting down {hud.kills} fighter{hud.kills === 1 ? "" : "s"} and holding out to
                            wave {hud.wave}.
                        </p>
                    )}
                    {best > 0 && <p className="turret-best">Best: {best.toLocaleString()}</p>}
                    <div className="turret-card-actions">
                        <button type="button" className="archive-action" onClick={start} autoFocus>
                            {phase === "ready" ? "Man the battery" : "Again"}
                        </button>
                        <button type="button" className="archive-action is-quiet" onClick={onLeave}>
                            Back to the holotable
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default TurretGame
