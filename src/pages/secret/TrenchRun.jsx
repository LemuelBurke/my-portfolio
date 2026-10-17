import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { COMMS } from "./yavinContent"
import { audio, blip, noise } from "./sound"
import { disposeScene, paintGlow, seeded } from "./scenery"
import { createRenderer } from "./renderer"

/*
 * The trench run, from the cockpit of an X-wing. You fly down the Death Star's trench at full
 * throttle: steer with the pointer (or arrow keys / WASD, or a finger), over and under the catwalks
 * and round the wall blocks, through fire from the guns on the trench edges. Twenty seconds in,
 * three TIE fighters close in behind (a warning flashes before each volley; move); your astromech
 * slowly patches the shields between hits. Then the Falcon
 * drops in from above and scatters them. At thirty seconds the targeting computer comes up: fire a
 * torpedo (Space, click or the Fire button) while the exhaust port is in range. Or switch the
 * computer off and trust your instincts. A hit sends you up and out of the trench to watch the
 * station go.
 *
 * onEnd({ result: "hit" | "miss" | "early" | "late" | "down", force, shields }) when the run is over.
 * The world scrolls towards the camera; units are roughly metres.
 */

const W = 14 // the trench's half-width
const FLOOR = -14
const TOP = 10
const SPEED = 150
const PORT_AT = 40 // seconds into the run when the port reaches you
const COMPUTER_AT = 30
const PURSUIT = [20, 34]
const FIRE_MIN = 25 // fire while the port is between these distances ahead
const FIRE_MAX = 190
const SHIP_R = 1.5

// Death Star plating: grey panels of every size, with dark seams and lit windows
const paintPlating = (seed, lights = true) => {
    const size = 512
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = size
    const g = canvas.getContext("2d")
    const rand = seeded(seed)
    g.fillStyle = "#3e434a"
    g.fillRect(0, 0, size, size)
    for (let i = 0; i < 260; i++) {
        const w = 8 + rand() * 90
        const h = 6 + rand() * 50
        const v = 52 + Math.floor(rand() * 60)
        g.fillStyle = `rgb(${v}, ${v + 3}, ${v + 8})`
        g.fillRect(rand() * size, rand() * size, w, h)
    }
    g.strokeStyle = "rgba(12, 14, 18, 0.7)"
    for (let i = 0; i < 40; i++) {
        g.lineWidth = 1 + rand() * 2
        const y = rand() * size
        g.beginPath()
        g.moveTo(0, y)
        g.lineTo(size, y)
        g.stroke()
    }
    if (lights)
        for (let i = 0; i < 50; i++) {
            g.fillStyle = rand() < 0.8 ? "rgba(255, 244, 214, 0.95)" : "rgba(160, 210, 255, 0.95)"
            g.fillRect(rand() * size, rand() * size, 3, 2)
        }
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.anisotropy = 8
    return tex
}

const flat = (color, extra) => new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.6, flatShading: true, ...extra })

// A TIE fighter (or, with `advanced`, the lead pilot's bent-winged TIE)
const buildTie = (advanced) => {
    const tie = new THREE.Group()
    const wing = flat(0x2a2e34)
    const frame = flat(0x7a828b)
    for (const s of [-1, 1]) {
        const panel = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 0.2, 6), wing)
        panel.rotation.z = Math.PI / 2
        panel.position.x = s * 3.2
        if (advanced) panel.scale.set(1, 1, 0.6)
        if (advanced) panel.rotation.y = s * 0.35
        tie.add(panel)
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2.4, 8), frame)
        strut.rotation.z = Math.PI / 2
        strut.position.x = s * 1.9
        tie.add(strut)
    }
    tie.add(new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 12), frame))
    return tie
}

// The Millennium Falcon, from above: the saucer, the two forward mandibles and the offset cockpit
const buildFalcon = () => {
    const ship = new THREE.Group()
    const hull = flat(0xc9c6bd)
    const dark = flat(0x5b5f64)
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(9, 9.5, 2.2, 32), hull)
    ship.add(disc)
    const top = new THREE.Mesh(new THREE.CylinderGeometry(4, 6, 1, 32), hull)
    top.position.y = 1.4
    ship.add(top)
    for (const s of [-1, 1]) {
        const prong = new THREE.Mesh(new THREE.BoxGeometry(3, 1.6, 8), hull)
        prong.position.set(s * 2.2, 0, -10)
        ship.add(prong)
    }
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 6, 12).rotateX(Math.PI / 2), hull)
    tube.position.set(9, 0.3, -4)
    ship.add(tube)
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.3, 16), dark)
    dish.position.set(-3, 2.2, 2)
    ship.add(dish)
    const glow = new THREE.Mesh(new THREE.BoxGeometry(14, 0.6, 0.4), new THREE.MeshBasicMaterial({ color: 0x8fd8ff }))
    glow.position.set(0, 0, 9.2)
    ship.add(glow)
    return ship
}

// The Death Star, seen from a distance: a grey sphere with its equatorial trench and the dish
const buildDeathStar = (radius) => {
    const group = new THREE.Group()
    const tex = paintPlating(31, true)
    tex.repeat.set(10, 5)
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 48), new THREE.MeshStandardMaterial({ map: tex, color: 0x9aa0a8, roughness: 0.8, metalness: 0.2 }))
    group.add(sphere)
    const trench = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.001, radius * 0.012, 6, 128), new THREE.MeshStandardMaterial({ color: 0x2b2f35 }))
    trench.rotation.x = Math.PI / 2
    group.add(trench)
    const dish = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.28, 48), new THREE.MeshStandardMaterial({ color: 0x5f656d, roughness: 0.6, side: THREE.DoubleSide }))
    dish.position.set(radius * 0.42, radius * 0.5, radius * 0.75)
    dish.lookAt(dish.position.clone().multiplyScalar(2))
    dish.position.multiplyScalar(0.985)
    group.add(dish)
    return group
}

const TrenchRun = ({ onEnd, onComm }) => {
    const rootRef = useRef(null)
    const mountRef = useRef(null)
    const hud = useRef({})
    const callbacks = useRef({ onEnd, onComm })
    const [computer, setComputer] = useState("off") // off | on | disabled (switched off by you)
    const [over, setOver] = useState(false) // the run has ended: the cockpit displays clear away
    const computerRef = useRef(computer)
    const api = useRef({})
    useEffect(() => {
        callbacks.current = { onEnd, onComm }
    }, [onEnd, onComm])
    useEffect(() => {
        computerRef.current = computer
    }, [computer])

    useEffect(() => {
        const mount = mountRef.current
        const root = rootRef.current
        const gl = createRenderer(mount, {})
        if (!gl) return
        const { renderer } = gl
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const rand = seeded(Math.floor(Math.random() * 1e6) + 1)

        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x010206)
        const fog = new THREE.Fog(0x05070b, 120, 680)
        scene.fog = fog
        const camera = new THREE.PerspectiveCamera(72, 1, 0.3, 6000)

        scene.add(new THREE.HemisphereLight(0xb0c0d8, 0x30343a, 1.7))
        const sun = new THREE.DirectionalLight(0xfff1dc, 2)
        sun.position.set(-0.4, 1, 0.5)
        const fill = new THREE.DirectionalLight(0x9fb4d0, 0.9)
        fill.position.set(0.6, 0.4, 0.4)
        scene.add(fill)
        scene.add(sun)

        // stars overhead
        const starGeo = new THREE.BufferGeometry()
        const sp = new Float32Array(2500 * 3)
        const v = new THREE.Vector3()
        for (let i = 0; i < 2500; i++) {
            v.set(Math.random() * 2 - 1, Math.random() * 1.2 - 0.2, Math.random() * 2 - 1).normalize().multiplyScalar(4000)
            sp.set([v.x, v.y, v.z], i * 3)
        }
        starGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3))
        scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, sizeAttenuation: false, fog: false })))

        // ---------- the trench ----------
        const trench = new THREE.Group()
        scene.add(trench)
        const LEN = 900
        const plateTex = paintPlating(7)
        const wallTex = plateTex.clone()
        wallTex.needsUpdate = true
        wallTex.repeat.set(LEN / 60, 0.5)
        const floorTex = plateTex.clone()
        floorTex.needsUpdate = true
        floorTex.repeat.set((W * 2) / 60, LEN / 60)
        const surfTex = paintPlating(19)
        surfTex.repeat.set(5, LEN / 60)
        const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.75, metalness: 0.25, side: THREE.DoubleSide })
        for (const s of [-1, 1]) {
            const wall = new THREE.Mesh(new THREE.PlaneGeometry(LEN, TOP - FLOOR), wallMat)
            wall.rotation.y = s * (Math.PI / 2)
            wall.position.set(s * W, (TOP + FLOOR) / 2, -LEN / 2 + 30)
            trench.add(wall)
            const surface = new THREE.Mesh(new THREE.PlaneGeometry(300, LEN), new THREE.MeshStandardMaterial({ map: surfTex, roughness: 0.8, metalness: 0.2 }))
            surface.rotation.x = -Math.PI / 2
            surface.position.set(s * (W + 150), TOP, -LEN / 2 + 30)
            trench.add(surface)
        }
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, LEN), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.75, metalness: 0.25 }))
        floor.rotation.x = -Math.PI / 2
        floor.position.set(0, FLOOR, -LEN / 2 + 30)
        trench.add(floor)

        // greebles on the walls and floor, which stream past for a sense of speed
        const GREEBLES = 260
        const greebleMat = flat(0x6b7178, { flatShading: false })
        const greebles = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), greebleMat, GREEBLES)
        const gData = Array.from({ length: GREEBLES }, () => ({ z: 0, x: 0, y: 0, sx: 1, sy: 1, sz: 1 }))
        const placeGreeble = (gd, z) => {
            const side = rand() < 0.75 ? (rand() < 0.5 ? -1 : 1) : 0
            gd.sz = 2 + rand() * 12
            if (side) {
                gd.sx = 0.6 + rand() * 1.6
                gd.sy = 1 + rand() * 5
                gd.x = side * (W - gd.sx / 2)
                gd.y = FLOOR + 1 + rand() * (TOP - FLOOR - 3)
            } else {
                gd.sx = 1.5 + rand() * 5
                gd.sy = 0.4 + rand() * 1.2
                gd.x = (rand() - 0.5) * (W * 2 - 4)
                gd.y = FLOOR + gd.sy / 2
            }
            gd.z = z
        }
        gData.forEach((gd, i) => placeGreeble(gd, -(i / GREEBLES) * LEN + 20))
        const m4 = new THREE.Matrix4()
        const q0 = new THREE.Quaternion()
        const p0 = new THREE.Vector3()
        const s0 = new THREE.Vector3()
        trench.add(greebles)
        // running lights down both walls
        const LIGHTS = 80
        const lights = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 0.3, 1.2), new THREE.MeshBasicMaterial({ color: 0xfff0c8 }), LIGHTS)
        const lData = Array.from({ length: LIGHTS }, (_, i) => ({ z: -(i / LIGHTS) * LEN + 20, s: i % 2 ? 1 : -1, y: i % 4 < 2 ? 4 : -6 }))
        trench.add(lights)

        // ---------- obstacles, guns and the port ----------
        const obstacleMat = flat(0x5d636b)
        const obstacles = [] // { mesh, type, z, y, side }
        const gunGeo = new THREE.Group()
        const gunBase = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2, 2.4, 10), flat(0x50565e))
        gunGeo.add(gunBase)
        const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 4, 8).rotateX(Math.PI / 2), flat(0x2a2e34))
        gunBarrel.position.set(0, 1.2, 1.6)
        gunGeo.add(gunBarrel)
        const guns = [] // { group, z, side, fireIn }

        // the run's script: when each obstacle and gun reaches you
        const schedule = []
        for (let t = 4; t < COMPUTER_AT + 2; t += 1.5 + rand() * 1.2) {
            const roll = rand()
            if (roll < 0.45) schedule.push({ t, type: "catwalk", y: [-8, -2.5, 3.5][Math.floor(rand() * 3)] })
            else if (roll < 0.8) schedule.push({ t, type: "block", side: rand() < 0.5 ? -1 : 1 })
            else schedule.push({ t, type: "pair", y: rand() < 0.5 ? -7 : 4, side: rand() < 0.5 ? -1 : 1 })
        }
        for (let t = 3; t < PORT_AT - 6; t += 1.4 + rand() * 1.4) schedule.push({ t, type: "gun", side: rand() < 0.5 ? -1 : 1 })
        schedule.sort((a, b) => a.t - b.t)
        let next = 0

        const spawn = (item, z) => {
            if (item.type === "gun") {
                const g = gunGeo.clone()
                g.position.set(item.side * (W + 3), TOP + 1.2, z)
                trench.add(g)
                guns.push({ group: g, z, side: item.side, fireIn: 0.4 + rand() * 0.8 })
                return
            }
            const make = (type, opts) => {
                let mesh
                if (type === "catwalk") {
                    mesh = new THREE.Mesh(new THREE.BoxGeometry(W * 2, 3, 4), obstacleMat)
                    mesh.position.set(0, opts.y, z)
                } else {
                    // a block jutting out from one wall, more than halfway across
                    mesh = new THREE.Mesh(new THREE.BoxGeometry(W * 1.1, TOP - FLOOR, 8), obstacleMat)
                    mesh.position.set(opts.side * (W - W * 0.55), (TOP + FLOOR) / 2, z)
                }
                trench.add(mesh)
                obstacles.push({ mesh, type, z, ...opts, hit: false })
            }
            if (item.type === "pair") {
                make("catwalk", { y: item.y })
                make("block", { side: item.side })
            } else make(item.type, item)
        }

        // the exhaust port: a dark square in the trench floor, its rim glowing
        const port = new THREE.Group()
        const portHole = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({ color: 0x000000 }))
        portHole.rotation.x = -Math.PI / 2
        port.add(portHole)
        const portGlow = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.4, 4, 1), new THREE.MeshBasicMaterial({ color: 0xff9a3c, side: THREE.DoubleSide }))
        portGlow.rotation.x = -Math.PI / 2
        portGlow.rotation.z = Math.PI / 4
        port.add(portGlow)
        for (const s of [-1, 1]) {
            const rail = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 12), flat(0x4b5057))
            rail.position.set(s * 4.5, 0.4, 0)
            port.add(rail)
        }
        port.position.set(0, FLOOR + 0.05, -9999)
        trench.add(port)
        let portZ = -9999

        // ---------- bolts, sparks and the chase ----------
        const glowTex = paintGlow("rgba(255,255,255,1)", "rgba(255,255,255,0.35)")
        const boltGeo = new THREE.CylinderGeometry(0.18, 0.18, 7, 6).rotateX(Math.PI / 2)
        const green = new THREE.MeshBasicMaterial({ color: 0x7dff8f })
        const bolts = [] // { mesh, vel, rear }
        const blasts = []
        const blast = (at, size, color) => {
            const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
            s.position.copy(at)
            scene.add(s)
            blasts.push({ s, age: 0, size })
        }
        const ties = [buildTie(true), buildTie(false), buildTie(false)]
        ties.forEach((t) => {
            t.visible = false
            scene.add(t)
        })
        const falcon = buildFalcon()
        falcon.visible = false
        scene.add(falcon)

        // the torpedo
        const torpedo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffb35a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
        torpedo.scale.setScalar(2.2)
        torpedo.visible = false
        scene.add(torpedo)

        // the station, for the ending
        const deathStar = buildDeathStar(420)
        deathStar.visible = false
        scene.add(deathStar)
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 96), new THREE.MeshBasicMaterial({ color: 0xffd9a8, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }))
        ring.visible = false
        scene.add(ring)
        const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xfff1d8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }))
        flash.visible = false
        scene.add(flash)

        // ---------- sound: the engines, rising with the speed (on the channel's shared audio context) ----------
        let engine = null
        const startEngine = () => {
            const ac = audio()
            if (!ac) return
            try {
                const gain = ac.createGain()
                gain.gain.value = 0.0001
                gain.gain.exponentialRampToValueAtTime(0.05, ac.currentTime + 1)
                const filter = ac.createBiquadFilter()
                filter.type = "lowpass"
                filter.frequency.value = 520
                const oscs = [72, 108.5, 145].map((f) => {
                    const o = ac.createOscillator()
                    o.type = "sawtooth"
                    o.frequency.value = f
                    o.connect(filter)
                    o.start()
                    return o
                })
                filter.connect(gain).connect(ac.destination)
                engine = { ac, gain, filter, oscs }
            } catch {
                engine = null
            }
        }
        const stopEngine = () => {
            if (!engine) return
            const { ac, gain } = engine
            try {
                gain.gain.cancelScheduledValues(ac.currentTime)
                gain.gain.setValueAtTime(gain.gain.value, ac.currentTime)
                gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.6)
                engine.oscs.forEach((o) => o.stop(ac.currentTime + 0.65))
            } catch {
                // already closed
            }
            engine = null
        }
        // the TIEs' scream as they pass
        const scream = () => {
            const ac = audio()
            if (!ac) return
            try {
                const t = ac.currentTime
                const o = ac.createOscillator()
                const lfo = ac.createOscillator()
                const lfoGain = ac.createGain()
                const gain = ac.createGain()
                o.type = "sawtooth"
                o.frequency.setValueAtTime(1100, t)
                o.frequency.exponentialRampToValueAtTime(380, t + 1.1)
                lfo.frequency.value = 28
                lfoGain.gain.value = 60
                lfo.connect(lfoGain).connect(o.frequency)
                const f = ac.createBiquadFilter()
                f.type = "bandpass"
                f.frequency.value = 1200
                f.Q.value = 0.8
                gain.gain.setValueAtTime(0.0001, t)
                gain.gain.exponentialRampToValueAtTime(0.08, t + 0.25)
                gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2)
                o.connect(f).connect(gain).connect(ac.destination)
                o.start(t)
                lfo.start(t)
                o.stop(t + 1.25)
                lfo.stop(t + 1.25)
            } catch {
                // no sound
            }
        }
        const pewGreen = () => blip(880, "square", 0.025, 0.12)
        const boom = (v = 0.35) => noise(0.8, "lowpass", 1400, 90, v)

        // ---------- control ----------
        const ship = new THREE.Vector2(0, -4)
        const target = new THREE.Vector2(0, -4)
        const keys = new Set()
        let bank = 0
        const toTarget = (e) => {
            const rect = mount.getBoundingClientRect()
            const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
            const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1
            target.set(THREE.MathUtils.clamp(nx * (W - 2.5), -(W - 2.5), W - 2.5), THREE.MathUtils.clamp(ny * 11 - 2, FLOOR + 2.5, TOP - 2))
        }
        const onMove = (e) => toTarget(e)
        root.addEventListener("pointermove", onMove)
        root.addEventListener("pointerdown", onMove)
        const STEER = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "a", "d", "w", "s"]
        const onKeyDown = (e) => {
            if (STEER.includes(e.key)) {
                e.preventDefault()
                keys.add(e.key)
            } else if (e.key === " ") {
                e.preventDefault()
                fire()
            } else if (e.key === "f" || e.key === "F") api.current.toggleComputer?.()
        }
        const onKeyUp = (e) => keys.delete(e.key)
        window.addEventListener("keydown", onKeyDown)
        window.addEventListener("keyup", onKeyUp)

        const resize = () => {
            const w = mount.clientWidth
            const h = mount.clientHeight
            if (!w || !h) return
            gl.resize(w, h)
            camera.aspect = w / h
            camera.fov = w / h < 1 ? 92 : 72
            camera.updateProjectionMatrix()
        }
        const observer = new ResizeObserver(resize)
        observer.observe(mount)
        resize()

        // ---------- the run ----------
        let t = 0
        let phase = "run" // run | torpedo | climb | outro | over
        let phaseT = 0
        let shields = 100
        let invulnerable = 0
        let shake = 0
        let comm = 0
        let fired = false
        let result = null
        let dist = 0
        let pursuitFire = 0
        let warn = null // { at: Vector2, t }
        let falconT = -1
        let beepIn = 0
        const tmp = new THREE.Vector3()
        const shipPos = new THREE.Vector3()

        const end = (res) => {
            if (result) return
            result = res
            setOver(true)
            callbacks.current.onEnd?.({ result: res, force: computerRef.current === "disabled", shields: Math.max(0, Math.round(shields)) })
        }
        const hurt = (amount) => {
            if (invulnerable > 0 || phase !== "run") return
            shields -= amount
            invulnerable = 0.5
            shake = Math.min(1, shake + amount / 30)
            noise(0.3, "lowpass", 900, 120, 0.4)
            hud.current.hurt?.()
            if (shields <= 0) {
                shields = 0
                phase = "over"
                blast(new THREE.Vector3(ship.x, ship.y, -3), 10, 0xffa050)
                boom(0.4)
                stopEngine()
                setTimeout(() => end("down"), 900)
            }
        }
        const fire = () => {
            if (phase !== "run" || fired || t < COMPUTER_AT - 0.5) return
            fired = true
            const range = -portZ
            torpedo.visible = true
            torpedo.position.set(ship.x, ship.y - 1, -3)
            blip(220, "sawtooth", 0.06, 0.3)
            noise(0.5, "bandpass", 300, 2000, 0.2)
            phase = "torpedo"
            phaseT = 0
            api.current.torpedo = range < FIRE_MIN ? "late" : range > FIRE_MAX ? "early" : "hit"
            hud.current.fired?.()
        }
        api.current.fire = fire
        api.current.toggleComputer = () => {
            if (t < COMPUTER_AT - 1 || fired) return
            setComputer((c) => (c === "disabled" ? "on" : "disabled"))
            blip(600, "triangle", 0.04, 0.15)
        }

        startEngine()

        let last = performance.now()
        let frame
        const tick = (now) => {
            frame = requestAnimationFrame(tick)
            const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
            gl.frame(dt)
            last = now
            phaseT += dt
            const flying = phase === "run" || phase === "torpedo"
            if (flying) t += dt
            const speed = flying ? SPEED : phase === "climb" ? SPEED * 0.6 : 0
            const step = speed * dt
            dist += step

            // the comm chatter
            while (comm < COMMS.length && t >= COMMS[comm].at) {
                const line = COMMS[comm++]
                callbacks.current.onComm?.(line)
                blip(1500, "square", 0.012, 0.04)
                if (line.at === 20) scream()
            }
            if (t >= COMPUTER_AT && computerRef.current === "off" && !fired) setComputer("on")

            // steering
            if (keys.size) {
                const k = dt * 22
                if (keys.has("ArrowLeft") || keys.has("a")) target.x -= k
                if (keys.has("ArrowRight") || keys.has("d")) target.x += k
                if (keys.has("ArrowUp") || keys.has("w")) target.y += k
                if (keys.has("ArrowDown") || keys.has("s")) target.y -= k
                target.x = THREE.MathUtils.clamp(target.x, -(W - 2.5), W - 2.5)
                target.y = THREE.MathUtils.clamp(target.y, FLOOR + 2.5, TOP - 2)
            }
            if (phase === "run" || phase === "torpedo") {
                const before = ship.x
                ship.lerp(target, Math.min(1, dt * 5))
                bank += (THREE.MathUtils.clamp(-(ship.x - before) / Math.max(dt, 0.001) * 0.02, -0.5, 0.5) - bank) * Math.min(1, dt * 6)
            } else if (phase === "climb") {
                ship.y += dt * 30 * Math.min(1, phaseT)
                bank *= 0.95
            }
            shipPos.set(ship.x, ship.y, 0)

            // the world streams past
            wallTex.offset.x = (dist / 60) % 1
            floorTex.offset.y = (dist / 60) % 1
            surfTex.offset.y = (dist / 60) % 1
            for (let i = 0; i < GREEBLES; i++) {
                const gd = gData[i]
                gd.z += step
                if (gd.z > 20) placeGreeble(gd, gd.z - LEN)
                p0.set(gd.x, gd.y, gd.z)
                s0.set(gd.sx, gd.sy, gd.sz)
                m4.compose(p0, q0, s0)
                greebles.setMatrixAt(i, m4)
            }
            greebles.instanceMatrix.needsUpdate = true
            for (let i = 0; i < LIGHTS; i++) {
                const ld = lData[i]
                ld.z += step
                if (ld.z > 20) ld.z -= LEN
                m4.makeTranslation(ld.s * (W - 0.2), ld.y, ld.z)
                lights.setMatrixAt(i, m4)
            }
            lights.instanceMatrix.needsUpdate = true

            // obstacles and guns come into view, close in, and pass
            while (next < schedule.length && schedule[next].t - t < 4.4) {
                const item = schedule[next++]
                spawn(item, -(item.t - t) * SPEED)
            }
            for (let i = obstacles.length - 1; i >= 0; i--) {
                const o = obstacles[i]
                const before = o.z
                o.z += step
                o.mesh.position.z = o.z
                if (before < 0 && o.z >= 0 && phase === "run") {
                    const crash = o.type === "catwalk" ? Math.abs(ship.y - o.y) < 1.5 + SHIP_R : o.side * ship.x > W - W * 1.1 - SHIP_R
                    if (crash) {
                        hurt(25)
                        blast(new THREE.Vector3(ship.x, ship.y, -4), 8, 0xffb060)
                    }
                }
                if (o.z > 30) {
                    trench.remove(o.mesh)
                    o.mesh.geometry.dispose()
                    obstacles.splice(i, 1)
                }
            }
            for (let i = guns.length - 1; i >= 0; i--) {
                const g = guns[i]
                g.z += step
                g.group.position.z = g.z
                g.group.lookAt(ship.x, ship.y, 0)
                g.fireIn -= dt
                if (phase === "run" && g.fireIn <= 0 && g.z > -520 && g.z < -50) {
                    g.fireIn = 1.2 + rand() * 1.1
                    const from = g.group.position.clone().add(new THREE.Vector3(0, 1.2, 0))
                    const aim = new THREE.Vector3(ship.x + (target.x - ship.x) * 0.6 + (rand() - 0.5) * 3, ship.y + (rand() - 0.5) * 3, 0)
                    const mesh = new THREE.Mesh(boltGeo, green)
                    mesh.position.copy(from)
                    const vel = aim.sub(from).normalize().multiplyScalar(320)
                    mesh.lookAt(from.clone().add(vel))
                    scene.add(mesh)
                    bolts.push({ mesh, vel, rear: false })
                    if (g.z > -300) pewGreen()
                }
                if (g.z > 30) {
                    trench.remove(g.group)
                    guns.splice(i, 1)
                }
            }

            // the chase: three TIEs on your tail, firing past you, until the Falcon arrives
            const chasing = t >= PURSUIT[0] && t < PURSUIT[1] && phase === "run"
            hud.current.rear?.(chasing ? ties.map((_, i) => [Math.sin(t * 1.3 + i * 2) * 0.6, Math.cos(t * 1.1 + i * 1.7) * 0.4]) : null)
            if (chasing) {
                pursuitFire -= dt
                if (pursuitFire <= 0 && !warn) {
                    warn = { at: ship.clone(), t: 0.6 }
                    hud.current.warn?.(true)
                    blip(1250, "square", 0.03, 0.08)
                }
                if (warn) {
                    warn.t -= dt
                    if (warn.t <= 0) {
                        for (let k = 0; k < 3; k++) {
                            const mesh = new THREE.Mesh(boltGeo, green)
                            mesh.position.set(warn.at.x + (rand() - 0.5) * 3.5, warn.at.y + (rand() - 0.5) * 3.5, 40 + k * 8)
                            const vel = new THREE.Vector3(0, 0, -420)
                            mesh.lookAt(mesh.position.clone().add(vel))
                            scene.add(mesh)
                            bolts.push({ mesh, vel, rear: true })
                        }
                        pewGreen()
                        warn = null
                        hud.current.warn?.(false)
                        pursuitFire = 1.2 + rand() * 0.6
                    }
                }
            } else if (warn) {
                warn = null
                hud.current.warn?.(false)
            }

            // the Falcon drops in from above, guns blazing, and the TIEs scatter
            if (t >= PURSUIT[1] && falconT < 0) {
                falconT = 0
                falcon.visible = true
                scream()
                setTimeout(() => boom(0.3), 300)
                setTimeout(() => boom(0.25), 650)
            }
            if (falconT >= 0 && falconT < 3) {
                falconT += dt
                const k = falconT / 3
                falcon.position.set(-30 + k * 60, TOP + 60 - k * 30, 20 - k * 260)
                falcon.rotation.set(0.25, 0.6, -0.4)
                if (falconT >= 3) falcon.visible = false
            }

            // bolts
            for (let i = bolts.length - 1; i >= 0; i--) {
                const b = bolts[i]
                const before = b.mesh.position.z
                b.mesh.position.addScaledVector(b.vel, dt)
                if (!b.rear) b.mesh.position.z += step * 0.4
                let gone = false
                const crossed = b.rear ? before > 0 && b.mesh.position.z <= 0 : before < 0 && b.mesh.position.z >= 0
                if (crossed) {
                    tmp.set(b.mesh.position.x - ship.x, b.mesh.position.y - ship.y, 0)
                    if (tmp.length() < SHIP_R + 0.9) {
                        hurt(b.rear ? 10 : 7)
                        blast(new THREE.Vector3(ship.x + tmp.x * 0.5, ship.y + tmp.y * 0.5, -2), 4, 0x9dffa8)
                        gone = true
                    }
                }
                const p = b.mesh.position
                if (Math.abs(p.x) > W + 10 || p.z > 60 || p.z < -900 || p.y < FLOOR - 1) gone = true
                if (p.y < FLOOR + 0.3 && !gone) {
                    blast(p, 3, 0x9dffa8)
                    gone = true
                }
                if (gone) {
                    scene.remove(b.mesh)
                    bolts.splice(i, 1)
                }
            }

            // the port
            if (portZ < -9000 && PORT_AT - t < 4.4) portZ = -(PORT_AT - t) * SPEED
            if (portZ > -9000) {
                portZ += step
                port.position.z = portZ
                portGlow.material.color.setHSL(0.08, 1, 0.5 + Math.sin(now / 90) * 0.12)
                if (phase === "run" && portZ > -FIRE_MIN + 20 && !fired) {
                    phase = "over"
                    stopEngine()
                    setTimeout(() => end("late"), 700)
                }
            }
            // the targeting computer: range to the port, beeping faster as it closes
            if (computerRef.current === "on" && !fired) {
                const range = portZ > -9000 ? -portZ : (PORT_AT - t) * SPEED
                hud.current.range?.(Math.max(0, range), range <= FIRE_MAX && range >= FIRE_MIN)
                beepIn -= dt
                if (beepIn <= 0) {
                    blip(range <= FIRE_MAX ? 1760 : 1320, "square", 0.02, 0.05)
                    beepIn = range <= FIRE_MAX ? 0.08 : THREE.MathUtils.clamp(range / 2400, 0.12, 0.6)
                }
            }

            // the torpedo flies ahead, then drops into the port (or doesn't)
            if (phase === "torpedo") {
                const outcome = api.current.torpedo
                const goal = outcome === "hit" ? new THREE.Vector3(0, FLOOR, portZ) : new THREE.Vector3(ship.x * 0.5, FLOOR, -120 - phaseT * 40)
                torpedo.position.lerp(goal, Math.min(1, dt * 3.2))
                if (torpedo.position.distanceTo(goal) < 3 || phaseT > 1.4) {
                    torpedo.visible = false
                    blast(goal, outcome === "hit" ? 14 : 8, 0xffb35a)
                    if (outcome === "hit") {
                        boom(0.3)
                        phase = "climb"
                        phaseT = 0
                    } else {
                        boom(0.2)
                        phase = "over"
                        stopEngine()
                        setTimeout(() => end(outcome === "early" ? "early" : "miss"), 1000)
                    }
                }
            }

            // up out of the trench, then turn to watch the station go
            if (phase === "climb" && phaseT > 2.2) {
                phase = "outro"
                phaseT = 0
                trench.visible = false
                for (const b of bolts) scene.remove(b.mesh)
                bolts.length = 0
                fog.near = 4000
                fog.far = 8000
                deathStar.visible = true
                deathStar.position.set(0, -60, -1500)
                ship.set(0, 0)
                stopEngine()
            }
            if (phase === "outro") {
                deathStar.rotation.y += dt * 0.02
                if (phaseT > 1.6 && !flash.visible) {
                    flash.visible = true
                    ring.visible = true
                    noise(2.5, "lowpass", 2000, 40, 0.5)
                }
                if (flash.visible) {
                    const k = phaseT - 1.6
                    flash.position.copy(deathStar.position)
                    flash.scale.setScalar(300 + k * 2600)
                    flash.material.opacity = Math.max(0, 1 - k / 2.2)
                    if (k > 0.25) deathStar.visible = false
                    ring.position.copy(deathStar.position)
                    ring.rotation.set(Math.PI / 2.4, 0.2, 0)
                    ring.scale.setScalar(200 + k * 1400)
                    ring.material.opacity = Math.max(0, 0.9 - k / 3)
                    if (k > 2.4 && !result) end("hit")
                }
            }

            // blasts fade
            for (let i = blasts.length - 1; i >= 0; i--) {
                const b = blasts[i]
                b.age += dt
                b.s.scale.setScalar(b.size * (0.5 + b.age * 3))
                b.s.material.opacity = Math.max(0, 1 - b.age / 0.5)
                if (b.age > 0.5) {
                    scene.remove(b.s)
                    b.s.material.dispose()
                    blasts.splice(i, 1)
                }
            }

            // the camera is the cockpit: it banks into turns and shakes when hit
            invulnerable = Math.max(0, invulnerable - dt)
            // your astromech patches the shields back up as you go
            if (phase === "run" && shields > 0) shields = Math.min(100, shields + dt * 2.5)
            shake = Math.max(0, shake - dt * 1.8)
            const jolt = reduceMotion ? 0 : shake
            camera.position.set(ship.x + (Math.random() - 0.5) * jolt * 0.6, ship.y + (Math.random() - 0.5) * jolt * 0.6, 0)
            if (phase === "outro") {
                camera.position.set(0, 0, 0)
                camera.rotation.set(0, 0, 0)
            } else {
                camera.rotation.set(phase === "climb" ? Math.min(0.5, phaseT * 0.3) : (ship.y - target.y) * 0.004, 0, bank + (reduceMotion ? 0 : Math.sin(now / 300) * 0.004))
            }
            if (engine) engine.filter.frequency.setTargetAtTime(420 + Math.abs(bank) * 500 + (shields < 40 ? Math.random() * 200 : 0), engine.ac.currentTime, 0.1)
            hud.current.shields?.(shields)

            renderer.render(scene, camera)
        }
        gl.begin(scene, camera, () => (frame = requestAnimationFrame(tick)))

        return () => {
            cancelAnimationFrame(frame)
            observer.disconnect()
            root.removeEventListener("pointermove", onMove)
            root.removeEventListener("pointerdown", onMove)
            window.removeEventListener("keydown", onKeyDown)
            window.removeEventListener("keyup", onKeyUp)
            stopEngine()
            scene.add(gunGeo)
            disposeScene(scene)
            glowTex.dispose()
            renderer.dispose()
            renderer.domElement.remove()
        }
    }, [])

    // the cockpit's own displays, updated straight from the game loop
    const shieldRef = useRef(null)
    const rangeRef = useRef(null)
    const rearRef = useRef(null)
    const warnRef = useRef(null)
    const hurtRef = useRef(null)
    const computerBox = useRef(null)
    useEffect(() => {
        hud.current = {
            shields: (s) => {
                if (shieldRef.current) {
                    shieldRef.current.style.transform = `scaleX(${s / 100})`
                    shieldRef.current.parentElement.parentElement.classList.toggle("is-low", s < 35)
                }
            },
            range: (r, inWindow) => {
                if (rangeRef.current) rangeRef.current.textContent = Math.round(r * 10).toLocaleString()
                computerBox.current?.classList.toggle("is-fire", inWindow)
                computerBox.current?.style.setProperty("--closing", String(Math.min(1, 1 - r / 1500)))
            },
            rear: (blips) => {
                const el = rearRef.current
                if (!el) return
                el.classList.toggle("is-on", !!blips)
                if (blips) [...el.querySelectorAll("i")].forEach((b, i) => (b.style.transform = `translate(${blips[i][0] * 26}px, ${blips[i][1] * 18}px)`))
            },
            warn: (on) => warnRef.current?.classList.toggle("is-on", on),
            hurt: () => {
                const el = hurtRef.current
                if (!el) return
                el.classList.remove("is-on")
                void el.offsetWidth
                el.classList.add("is-on")
            },
            fired: () => computerBox.current?.classList.add("is-fired"),
        }
    }, [])

    return (
        <div className={`trench ${over ? "is-over" : ""}`} ref={rootRef}>
            <div className="trench-view" ref={mountRef} />
            {/* the canopy's frame and the dashboard */}
            <svg className="trench-canopy" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 0 L2.5 0 L15 80 L12 81 L0 76 Z M100 0 L97.5 0 L85 80 L88 81 L100 76 Z" />
                <path d="M0 100 L0 84 L18 79 L82 79 L100 84 L100 100 Z" className="trench-dash" />
            </svg>
            <div className="trench-dash-lights" aria-hidden="true">
                {Array.from({ length: 10 }, (_, i) => (
                    <i key={i} style={{ animationDelay: `${(i * 0.37) % 2}s` }} />
                ))}
            </div>
            <span className="trench-reticle" aria-hidden="true" />
            <div className="trench-hurt" ref={hurtRef} aria-hidden="true" />

            <div className="trench-shields">
                <span>Deflector shields</span>
                <span className="trench-shields-bar">
                    <span ref={shieldRef} />
                </span>
            </div>

            <div className="trench-rear" ref={rearRef} aria-hidden="true">
                <span>Rear</span>
                <i className="is-lead" />
                <i />
                <i />
            </div>
            <p className="trench-warn" ref={warnRef} role="alert">
                Incoming from behind · Move!
            </p>

            {/* the targeting computer, up from the dashboard */}
            <div className={`trench-computer is-${computer}`} ref={computerBox} aria-hidden={computer !== "on"}>
                <svg viewBox="0 0 200 120" aria-hidden="true">
                    <path d="M10 110 L92 30 M190 110 L108 30 M40 110 L96 30 M160 110 L104 30" />
                    {[0, 1, 2, 3, 4].map((i) => (
                        <rect key={i} x="0" y="0" width="200" height="120" className="trench-computer-step" style={{ animationDelay: `${i * -0.24}s` }} />
                    ))}
                    <rect x="88" y="24" width="24" height="10" className="trench-computer-port" />
                </svg>
                <p>
                    Range <strong ref={rangeRef}>0</strong>
                </p>
                <p className="trench-computer-fire">Fire</p>
            </div>

            <div className="trench-controls">
                {computer !== "off" && (
                    <button type="button" className="cmd-rail-btn" onClick={() => api.current.toggleComputer?.()}>
                        {computer === "disabled" ? "Targeting computer on" : "Switch off targeting computer"} <kbd>F</kbd>
                    </button>
                )}
                <button type="button" className="trench-fire" onClick={() => api.current.fire?.()} disabled={computer === "off"}>
                    Fire torpedo <kbd>Space</kbd>
                </button>
            </div>
        </div>
    )
}

export default TrenchRun
