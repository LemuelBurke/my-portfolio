import { useEffect, useRef } from "react"
import * as THREE from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"
import { BATTLE_LINES } from "./archiveContent"
import { bakeStatic, buildLothal, buildStarDestroyer, buildStars, disposeScene, metal, paintGlow, seeded } from "./scenery"
import { createRenderer } from "./renderer"

/*
 * The command holotable of the ISD Chimaera, in three.js. You stand at the table on the command deck
 * where Grand Admiral Thrawn studies his battles, and above it a hologram replays the record of a Rebel
 * strike on the Lothal blockade: the Rebel fleet drops out of hyperspace, TIE squadrons launch, the
 * escort swings round to bracket them, the Interdictor's gravity wells trap them, and the survivors
 * break out and run. Then the record starts again.
 *
 * Drag to walk round the table. Click a Rebel ship to have the fleet concentrate fire on it; click
 * the Chimaera (or answer the call when X-wings make their run) to man a turbolaser battery.
 *
 * Callbacks: onLog({ key, who, text, clock }) for each line of the tactical log, onStatus(status) a couple of
 * times a second, onRun(active) when the X-wing run starts and ends, onBattery() to man the turret.
 * `paused` stops the scene while the turret has the screen; `dive` sweeps the view down onto the
 * Chimaera on the way there.
 *
 * Units in the hologram are "table units": the table is 2.9 across its radius.
 */

const IMPERIAL = 0x74d8ff
const REBEL = 0xff6a4a
const MARK = 0xffc46b
const RANGE = 1.9 // how far a capital ship's guns reach, in table units
const TABLE_R = 2.9

// ---------- hologram materials ----------
// The projection: brightest at the silhouette edges, with scan bands drifting up through it and
// the odd horizontal tear when the signal glitches
const HOLO_VERT = /* glsl */ `
uniform float uGlitch;
varying vec3 vN;
varying vec3 vV;
varying vec3 vW;
void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    float band = floor(w.y * 26.0);
    w.x += uGlitch * step(0.86, fract(sin(band * 43.13) * 917.31)) * 0.07;
    vW = w.xyz;
    vec4 mv = viewMatrix * w;
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
}`
const HOLO_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;
varying vec3 vN;
varying vec3 vV;
varying vec3 vW;
void main() {
    float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
    float scan = 0.55 + 0.45 * step(0.42, fract(vW.y * 60.0 - uTime * 0.9));
    float a = (0.08 + 0.8 * rim) * scan * uOpacity;
    gl_FragColor = vec4(uColor, a);
}`

const makeHoloKit = () => {
    const shared = { uTime: { value: 0 }, uGlitch: { value: 0 } }
    const fill = (color, opacity = 1) =>
        new THREE.ShaderMaterial({
            uniforms: { uTime: shared.uTime, uGlitch: shared.uGlitch, uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity } },
            vertexShader: HOLO_VERT,
            fragmentShader: HOLO_FRAG,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
        })
    const edge = (color, opacity = 0.8) => new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending })
    return { shared, fill, edge }
}

// ---------- ship shapes for the hologram (bow along +X, about 1 unit long) ----------
const boxG = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z)
const cylX = (r, len, x, y, z, seg = 10) => new THREE.CylinderGeometry(r, r, len, seg).rotateZ(Math.PI / 2).translate(x, y, z)
const wedgeG = (length, width, thick, y) => {
    const s = new THREE.Shape()
    s.moveTo(length / 2, 0)
    s.lineTo(-length / 2, width / 2)
    s.lineTo(-length / 2, -width / 2)
    s.closePath()
    return new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, y, 0)
}

const SHAPES = {
    // Imperial Star Destroyer: the dagger, the stepped superstructure and the bridge tower
    isd: (interdictor = false) => {
        const g = [wedgeG(1, 0.62, 0.05, 0), wedgeG(0.84, 0.5, 0.04, -0.04).translate(-0.06, 0, 0)]
        g.push(boxG(0.26, 0.04, 0.3, -0.33, 0.07, 0), boxG(0.17, 0.04, 0.2, -0.37, 0.11, 0), boxG(0.1, 0.04, 0.12, -0.4, 0.15, 0))
        g.push(boxG(0.025, 0.07, 0.025, -0.42, 0.2, 0), boxG(0.035, 0.018, 0.14, -0.42, 0.24, 0))
        for (const z of [-0.05, 0.05]) g.push(new THREE.SphereGeometry(0.016, 10, 8).translate(-0.42, 0.255, z))
        for (const z of [-0.16, 0, 0.16]) g.push(cylX(0.04, 0.05, -0.52, 0.02, z))
        // an Interdictor carries the great domes of its gravity well projectors
        if (interdictor)
            for (const [x, z] of [[-0.14, 0.14], [-0.14, -0.14], [0.08, 0.08], [0.08, -0.08]])
                g.push(new THREE.SphereGeometry(0.05, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2).translate(x, 0.05, z))
        return g
    },
    interdictor: () => SHAPES.isd(true),
    // Nebulon-B frigate: the tall forward hull, the thin spar and the engine block
    nebulon: () => [
        boxG(0.42, 0.15, 0.07, 0.27, 0.05, 0),
        boxG(0.12, 0.12, 0.025, 0.2, -0.08, 0),
        boxG(0.42, 0.025, 0.025, -0.13, -0.09, 0),
        boxG(0.16, 0.09, 0.11, -0.42, -0.09, 0),
        cylX(0.03, 0.04, -0.52, -0.07, 0.03),
        cylX(0.03, 0.04, -0.52, -0.07, -0.03),
    ],
    // Hammerhead corvette: the long body behind the tall "hammer" of the bridge
    hammerhead: () => [boxG(0.72, 0.07, 0.09, -0.12, 0, 0), boxG(0.2, 0.2, 0.15, 0.34, 0.02, 0), boxG(0.12, 0.05, 0.16, -0.38, 0, 0), cylX(0.025, 0.06, -0.5, 0, 0.05), cylX(0.025, 0.06, -0.5, 0, -0.05)],
    // CR90 corvette: the hammerhead prow, the long neck and the bank of engines
    cr90: () => {
        const g = [boxG(0.28, 0.11, 0.16, 0.33, 0, 0), cylX(0.075, 0.44, -0.02, 0, 0, 12), boxG(0.16, 0.18, 0.24, -0.33, 0, 0)]
        for (const y of [-0.05, 0.05]) for (const z of [-0.07, 0.07]) g.push(cylX(0.03, 0.06, -0.44, y, z))
        return g
    },
}

// A hologram of a ship: see-through faces with lit edges
// (each ship's parts are merged, so it draws in two calls: its faces and its edges)
const holoModel = (geos, color, kit) => {
    const group = new THREE.Group()
    const fill = kit.fill(color)
    const edge = kit.edge(color)
    const solid = geos.map((g) => (g.index ? g.toNonIndexed() : g))
    for (const g of solid) for (const name of Object.keys(g.attributes)) if (name !== "position" && name !== "normal") g.deleteAttribute(name)
    const edges = geos.map((g) => new THREE.EdgesGeometry(g, 20))
    group.add(new THREE.Mesh(mergeGeometries(solid), fill))
    group.add(new THREE.LineSegments(mergeGeometries(edges), edge))
    for (const g of [...geos, ...solid, ...edges]) g.dispose()
    return { group, fill, edge }
}

// Lines of latitude and longitude, for the hologram planet and the Interdictor's gravity well
const globeLines = (radius, lat = 9, lon = 12) => {
    const pts = []
    const seg = 48
    for (let i = 1; i < lat; i++) {
        const phi = (i / lat) * Math.PI
        const y = Math.cos(phi) * radius
        const r = Math.sin(phi) * radius
        for (let j = 0; j < seg; j++) {
            const a0 = (j / seg) * Math.PI * 2
            const a1 = ((j + 1) / seg) * Math.PI * 2
            pts.push(Math.cos(a0) * r, y, Math.sin(a0) * r, Math.cos(a1) * r, y, Math.sin(a1) * r)
        }
    }
    for (let i = 0; i < lon; i++) {
        const a = (i / lon) * Math.PI * 2
        for (let j = 0; j < seg; j++) {
            const p0 = (j / seg) * Math.PI
            const p1 = ((j + 1) / seg) * Math.PI
            pts.push(Math.sin(p0) * Math.cos(a) * radius, Math.cos(p0) * radius, Math.sin(p0) * Math.sin(a) * radius)
            pts.push(Math.sin(p1) * Math.cos(a) * radius, Math.cos(p1) * radius, Math.sin(p1) * Math.sin(a) * radius)
        }
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3))
    return geo
}

// ---------- the room ----------
// The table's glass top: range rings, bearing ticks and blocks of readout, lit from within
const paintTableTop = () => {
    const size = 1024
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = size
    const g = canvas.getContext("2d")
    const c = size / 2
    g.fillStyle = "#000"
    g.fillRect(0, 0, size, size)
    g.strokeStyle = "rgba(116, 216, 255, 0.55)"
    for (const [r, w] of [[500, 3], [470, 1], [380, 1.5], [270, 1], [160, 1], [60, 2]]) {
        g.lineWidth = w
        g.beginPath()
        g.arc(c, c, r, 0, Math.PI * 2)
        g.stroke()
    }
    // bearing ticks round the edge
    for (let i = 0; i < 360; i += 5) {
        const a = (i * Math.PI) / 180
        const long = i % 30 === 0
        g.lineWidth = long ? 3 : 1
        g.beginPath()
        g.moveTo(c + Math.cos(a) * 470, c + Math.sin(a) * 470)
        g.lineTo(c + Math.cos(a) * (long ? 430 : 452), c + Math.sin(a) * (long ? 430 : 452))
        g.stroke()
    }
    // the cross of the grid
    g.lineWidth = 1
    g.strokeStyle = "rgba(116, 216, 255, 0.25)"
    for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 6
        g.beginPath()
        g.moveTo(c + Math.cos(a) * 60, c + Math.sin(a) * 60)
        g.lineTo(c + Math.cos(a) * 380, c + Math.sin(a) * 380)
        g.moveTo(c - Math.cos(a) * 60, c - Math.sin(a) * 60)
        g.lineTo(c - Math.cos(a) * 380, c - Math.sin(a) * 380)
        g.stroke()
    }
    // small blocks of readout between the outer rings
    const rand = seeded(21)
    g.fillStyle = "rgba(116, 216, 255, 0.6)"
    for (let i = 0; i < 70; i++) {
        const a = rand() * Math.PI * 2
        const r = 395 + rand() * 60
        g.save()
        g.translate(c + Math.cos(a) * r, c + Math.sin(a) * r)
        g.rotate(a + Math.PI / 2)
        g.fillRect(0, 0, 6 + rand() * 22, 3)
        g.restore()
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    return tex
}

// Crew console screens down in the pits
const paintScreen = (variant) => {
    const canvas = document.createElement("canvas")
    canvas.width = 256
    canvas.height = 128
    const g = canvas.getContext("2d")
    g.fillStyle = "#020a07"
    g.fillRect(0, 0, 256, 128)
    g.strokeStyle = "rgba(61, 255, 143, 0.22)"
    for (let x = 0; x <= 256; x += 16) g.strokeRect(x, 0, 0, 128)
    for (let y = 0; y <= 128; y += 16) g.strokeRect(0, y, 256, 0)
    g.strokeStyle = "#3dff8f"
    g.lineWidth = 2
    g.beginPath()
    if (variant % 2) {
        g.arc(128, 64, 44, 0, Math.PI * 2)
        g.moveTo(84, 64)
        g.lineTo(172, 64)
    } else {
        for (let x = 0; x <= 256; x += 4) g.lineTo(x, 64 + Math.sin(x / 9 + variant) * 26 * Math.sin(x / 45))
    }
    g.stroke()
    for (let i = 0; i < 10; i++) {
        g.fillStyle = i === (variant * 3) % 10 ? "#ff4b3a" : "rgba(61, 255, 143, 0.6)"
        g.fillRect(8 + i * 24, 6, 16, 5)
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
}

// (the materials are shared between stations, so the whole crew pit can be baked into a few meshes)
const buildConsole = (mats, screen) => {
    const station = new THREE.Group()
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.7), mats.base)
    base.position.y = 0.45
    station.add(base)
    const desk = new THREE.Group()
    desk.position.set(0, 0.95, 0.05)
    desk.rotation.x = -0.55
    desk.add(new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.06, 0.8), mats.desk))
    const display = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.5), mats.screens[screen])
    display.rotation.x = -Math.PI / 2
    display.position.set(0, 0.035, -0.06)
    desk.add(display)
    station.add(desk)
    return station
}

// ---------- the order of battle ----------
const V = (x, y, z) => new THREE.Vector3(x, y, z)
const ROSTER = [
    { id: "chimaera", team: "imp", shape: "isd", name: "Chimaera", cls: "Star Destroyer · flagship", scale: 0.95, at: V(-0.55, 0.62, 0.05) },
    { id: "interdictor", team: "imp", shape: "interdictor", name: "Interdictor", cls: "Gravity well cruiser", scale: 0.78, at: V(-0.85, 0.88, -0.95), bracket: V(0.0, 0.95, -1.35) },
    { id: "escort", team: "imp", shape: "isd", name: "Star Destroyer", cls: "Escort", scale: 0.76, at: V(-0.8, 0.42, 0.95), bracket: V(0.3, 0.42, 1.42) },
    { id: "nebulon", team: "reb", shape: "nebulon", name: "Nebulon-B frigate", label: "Nebulon-B", cls: "Rebel flagship", scale: 0.5, at: V(1.4, 0.82, -0.2), advance: V(0.85, 0.82, -0.25), hp: 90 },
    { id: "hh1", team: "reb", shape: "hammerhead", name: "Hammerhead corvette", label: "Hammerhead", cls: "Corvette", scale: 0.3, at: V(1.15, 0.55, 0.55), advance: V(0.3, 0.55, 0.42), hp: 40 },
    { id: "hh2", team: "reb", shape: "hammerhead", name: "Hammerhead corvette", label: "Hammerhead", cls: "Corvette", scale: 0.3, at: V(1.3, 0.98, -0.9), advance: V(0.35, 0.98, -0.72), hp: 40 },
    { id: "hh3", team: "reb", shape: "hammerhead", name: "Hammerhead corvette", label: "Hammerhead", cls: "Corvette", scale: 0.3, at: V(1.6, 0.5, 0.95), advance: V(0.55, 0.5, 0.88), hp: 40 },
    { id: "cr90", team: "reb", shape: "cr90", name: "CR90 corvette", label: "CR90", cls: "Corvette", scale: 0.28, at: V(1.65, 0.7, 0.2), advance: V(0.6, 0.7, 0.12), hp: 36 },
]
const TIES = 20
const REBEL_FIGHTERS = 16

const HoloTable = ({ onLog, onStatus, onRun, onBattery, paused = false, dive = false }) => {
    const mountRef = useRef(null)
    const labelsRef = useRef(null)
    const callbacks = useRef({ onLog, onStatus, onRun, onBattery })
    const pausedRef = useRef(paused)
    const diveRef = useRef(dive)
    useEffect(() => {
        callbacks.current = { onLog, onStatus, onRun, onBattery }
    }, [onLog, onStatus, onRun, onBattery])
    useEffect(() => {
        pausedRef.current = paused
    }, [paused])
    useEffect(() => {
        diveRef.current = dive
    }, [dive])

    useEffect(() => {
        const mount = mountRef.current
        const labelLayer = labelsRef.current
        const gl = createRenderer(mount, { exposure: 1.1 })
        if (!gl) return
        const { renderer } = gl
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const say = (key, arg) => {
            const line = BATTLE_LINES[key]
            callbacks.current.onLog?.({ key, who: line.who, text: typeof line.text === "function" ? line.text(arg) : line.text, clock })
        }

        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x010204)
        scene.fog = new THREE.Fog(0x04060a, 10, 30)
        const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 4000)
        const glowTex = paintGlow("rgba(255,255,255,1)", "rgba(255,255,255,0.35)")
        const kit = makeHoloKit()

        // ---------- light: the hologram's own glow does most of the work ----------
        scene.add(new THREE.HemisphereLight(0x8fa6c4, 0x06080b, 0.35))
        const holoLight = new THREE.PointLight(0x5fc8ff, 6, 12, 1.4)
        holoLight.position.set(0, 1.0, 0)
        scene.add(holoLight)
        const windowLight = new THREE.DirectionalLight(0xbfd2ff, 0.7)
        windowLight.position.set(-3, 6, -10)
        scene.add(windowLight)

        // ---------- the command deck ----------
        const FLOOR = -1.05
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0x1a1e24, metalness: 0.7, roughness: 0.32 }))
        floor.rotation.x = -Math.PI / 2
        floor.position.y = FLOOR
        scene.add(floor)
        // the table: a dark pedestal with a lit rim and a glass top, the projector lens at its heart
        const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(TABLE_R, TABLE_R * 0.86, -FLOOR, 64), metal(0x22262c, { roughness: 0.4 }))
        pedestal.position.y = FLOOR / 2
        scene.add(pedestal)
        const top = new THREE.Mesh(
            new THREE.CircleGeometry(TABLE_R - 0.04, 96),
            new THREE.MeshStandardMaterial({ color: 0x06090d, metalness: 0.3, roughness: 0.7, emissive: 0xffffff, emissiveMap: paintTableTop(), emissiveIntensity: 0.75 })
        )
        top.rotation.x = -Math.PI / 2
        top.position.y = 0.002
        scene.add(top)
        const rim = new THREE.Mesh(new THREE.TorusGeometry(TABLE_R, 0.035, 8, 160), new THREE.MeshBasicMaterial({ color: 0x8fe3ff }))
        rim.rotation.x = Math.PI / 2
        scene.add(rim)
        const lowRim = new THREE.Mesh(new THREE.TorusGeometry(TABLE_R * 0.87, 0.02, 6, 140), new THREE.MeshBasicMaterial({ color: 0x2c6f8c }))
        lowRim.rotation.x = Math.PI / 2
        lowRim.position.y = FLOOR + 0.06
        scene.add(lowRim)
        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.3, 40), new THREE.MeshBasicMaterial({ color: 0x3f8fb0 }))
        lens.rotation.x = -Math.PI / 2
        lens.position.y = 0.006
        scene.add(lens)
        // the cone of light the projector throws up into the air
        const beam = new THREE.Mesh(
            new THREE.CylinderGeometry(2.3, 0.3, 1.5, 64, 1, true),
            new THREE.ShaderMaterial({
                uniforms: { uTime: kit.shared.uTime },
                vertexShader: `varying float vY; varying vec2 vUv; void main(){ vY = position.y; vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
                fragmentShader: `uniform float uTime; varying float vY; varying vec2 vUv; void main(){ float k = 1.0 - (vY + 0.75) / 1.5; float rays = 0.6 + 0.4 * sin(vUv.x * 120.0 + uTime * 0.6); gl_FragColor = vec4(0.45, 0.82, 1.0, 0.035 * k * rays); }`,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
            })
        )
        beam.position.y = 0.75
        scene.add(beam)

        // the crew pits either side, with their consoles
        const screens = Array.from({ length: 4 }, (_, i) => paintScreen(i))
        const consoleMats = { base: metal(0x23272d), desk: metal(0x343a42), screens: screens.map((map) => new THREE.MeshBasicMaterial({ map })) }
        const crew = new THREE.Group()
        for (const side of [-1, 1]) {
            const pit = new THREE.Mesh(new THREE.PlaneGeometry(7, 20), new THREE.MeshStandardMaterial({ color: 0x0f1216, metalness: 0.5, roughness: 0.45 }))
            pit.rotation.x = -Math.PI / 2
            pit.position.set(side * 9, FLOOR - 1.6, -2)
            scene.add(pit)
            const edge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 20), new THREE.MeshBasicMaterial({ color: 0x2f4256 }))
            edge.position.set(side * 5.5, FLOOR + 0.02, -2)
            scene.add(edge)
            const wall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.6, 20), metal(0x262b31))
            wall.position.set(side * 5.5, FLOOR - 0.8, -2)
            scene.add(wall)
            let n = 0
            for (const z of [3, 0.6, -1.8, -4.2, -6.6]) {
                for (const x of [6.6, 8.6]) {
                    const station = buildConsole(consoleMats, n++ % screens.length)
                    station.position.set(side * x, FLOOR - 1.6, z)
                    station.rotation.y = side * 1.75
                    crew.add(station)
                }
            }
            // the side walls
            const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(26, 9), metal(0x2c3138, { roughness: 0.7 }))
            sideWall.rotation.y = -side * (Math.PI / 2)
            sideWall.position.set(side * 11, 1.5, -2)
            scene.add(sideWall)
        }
        scene.add(bakeStatic(crew))
        const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), metal(0x15181c, { roughness: 0.8 }))
        ceiling.rotation.x = Math.PI / 2
        ceiling.position.set(0, 5.2, -2)
        scene.add(ceiling)

        // the great forward viewport behind the Grand Admiral, its struts leaning out
        const WINDOW_Z = -11
        const frameMat = metal(0x2a2f36, { roughness: 0.5 })
        const sill = new THREE.Mesh(new THREE.BoxGeometry(22, 0.6, 1), frameMat)
        sill.position.set(0, FLOOR - 1.3, WINDOW_Z + 0.6)
        scene.add(sill)
        for (let i = 0; i <= 14; i++) {
            const strut = new THREE.Mesh(new THREE.BoxGeometry(i % 4 === 1 ? 0.24 : 0.1, 8, 0.3), frameMat)
            strut.position.set(-10.5 + i * 1.5, 1.6, WINDOW_Z - 0.6)
            strut.rotation.x = 0.28
            scene.add(strut)
        }
        const crossbar = new THREE.Mesh(new THREE.BoxGeometry(22, 0.14, 0.3), frameMat)
        crossbar.position.set(0, 2.6, WINDOW_Z - 1.0)
        scene.add(crossbar)
        // outside: stars, Lothal and another Star Destroyer of the blockade
        scene.add(buildStars(3000, 2000))
        const lothal = buildLothal(300)
        lothal.position.set(-260, -230, -1000)
        lothal.traverse((o) => {
            if (o.material?.map) {
                o.material.emissive = new THREE.Color(0xffffff)
                o.material.emissiveMap = o.material.map
                o.material.emissiveIntensity = 0.5
            }
        })
        scene.add(lothal)
        const sister = buildStarDestroyer()
        sister.position.set(380, -70, -900)
        sister.rotation.y = -0.9
        sister.scale.setScalar(4)
        sister.traverse((o) => o.material && (o.material.fog = false))
        scene.add(sister)


        // ---------- the hologram ----------
        const holo = new THREE.Group()
        holo.position.y = 0.2
        holo.scale.setScalar(1.4)
        scene.add(holo)

        const planet = new THREE.Group()
        planet.position.set(-1.7, 0.62, -0.75)
        const planetFill = kit.fill(IMPERIAL, 0.55)
        planet.add(new THREE.Mesh(new THREE.SphereGeometry(0.62, 40, 28), planetFill))
        const planetLines = kit.edge(IMPERIAL, 0.35)
        planet.add(new THREE.LineSegments(globeLines(0.625), planetLines))
        holo.add(planet)
        // the blockade's patrol orbit round the planet
        const orbit = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.004, 4, 160), new THREE.MeshBasicMaterial({ color: IMPERIAL, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }))
        orbit.rotation.x = Math.PI / 2 - 0.25
        planet.add(orbit)

        // the Interdictor's gravity well, shown once it switches on
        const wellMat = kit.edge(IMPERIAL, 0)
        const well = new THREE.LineSegments(globeLines(1.25, 7, 10), wellMat)
        holo.add(well)

        // the ships
        const units = ROSTER.map((def) => {
            const model = holoModel(SHAPES[def.shape](), def.team === "imp" ? IMPERIAL : REBEL, kit)
            model.group.scale.setScalar(def.scale)
            holo.add(model.group)
            // an invisible box to click on
            const hit = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 0.7), new THREE.MeshBasicMaterial({ visible: false }))
            model.group.add(hit)
            const label = document.createElement("div")
            label.className = `holo-label ${def.team === "reb" ? "is-rebel" : ""}`
            label.innerHTML = `<b></b><span></span>`
            label.querySelector("b").textContent = def.label ?? def.name
            label.querySelector("span").textContent = def.cls
            labelLayer.appendChild(label)
            const unit = { ...def, model, hit, label, pos: new THREE.Vector3(), target: new THREE.Vector3(), heading: 0 }
            hit.userData.unit = unit
            return unit
        })
        const byId = Object.fromEntries(units.map((u) => [u.id, u]))
        const imperials = units.filter((u) => u.team === "imp")
        const rebels = units.filter((u) => u.team === "reb")

        // the marker under a ship the Grand Admiral has singled out
        const markMat = new THREE.MeshBasicMaterial({ color: MARK, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
        const mark = new THREE.Mesh(new THREE.RingGeometry(0.17, 0.19, 6), markMat)
        mark.rotation.x = -Math.PI / 2
        mark.visible = false
        holo.add(mark)

        // fighters: points of light with short trails
        const FIGHTERS = TIES + REBEL_FIGHTERS + 6
        const fighterGeo = new THREE.BufferGeometry()
        const fPos = new Float32Array(FIGHTERS * 3)
        const fCol = new Float32Array(FIGHTERS * 3)
        fighterGeo.setAttribute("position", new THREE.BufferAttribute(fPos, 3))
        fighterGeo.setAttribute("color", new THREE.BufferAttribute(fCol, 3))
        const fighterPoints = new THREE.Points(
            fighterGeo,
            new THREE.PointsMaterial({ size: 0.11, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
        )
        holo.add(fighterPoints)
        const trailGeo = new THREE.BufferGeometry()
        const tPos = new Float32Array(FIGHTERS * 6)
        const tCol = new Float32Array(FIGHTERS * 6)
        trailGeo.setAttribute("position", new THREE.BufferAttribute(tPos, 3))
        trailGeo.setAttribute("color", new THREE.BufferAttribute(tCol, 3))
        const trails = new THREE.LineSegments(trailGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
        holo.add(trails)

        // turbolaser fire: short bright dashes along each shot's path
        const BOLTS = 260
        const boltGeo = new THREE.BufferGeometry()
        const bPos = new Float32Array(BOLTS * 6)
        const bCol = new Float32Array(BOLTS * 6)
        boltGeo.setAttribute("position", new THREE.BufferAttribute(bPos, 3))
        boltGeo.setAttribute("color", new THREE.BufferAttribute(bCol, 3))
        const boltLines = new THREE.LineSegments(boltGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
        holo.add(boltLines)

        // explosions: rings of light that swell and fade, with a flash
        const blastPool = Array.from({ length: 28 }, () => {
            const ring = new THREE.Mesh(
                new THREE.RingGeometry(0.8, 1, 40),
                new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
            )
            const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }))
            ring.visible = flash.visible = false
            holo.add(ring, flash)
            return { ring, flash, age: 0, life: 0, size: 0 }
        })
        let blastNext = 0
        const blast = (at, size, color) => {
            const b = blastPool[blastNext++ % blastPool.length]
            b.ring.position.copy(at)
            b.flash.position.copy(at)
            b.ring.material.color.set(color)
            b.flash.material.color.set(color)
            b.ring.visible = b.flash.visible = true
            b.age = 0
            b.life = 0.5 + size * 2
            b.size = size
        }

        // ---------- the battle ----------
        const rand = Math.random
        let clock = 0
        let beat = 0
        let imperialFire = false
        let wellOn = 0 // 0..1, fades in and out
        let wellTarget = 0
        let run = false
        let retreatAt = null
        let ended = false
        let fade = 1 // the whole hologram fades out between replays
        let fadeTarget = 1
        let designated = null
        let shieldsSaid = false
        let statusIn = 0
        let glitchIn = 4
        const bolts = []
        const fighters = []
        // reused every frame, so the battle doesn't churn out garbage
        const activeOf = { imp: [], reb: [] }
        const aliveOf = { imp: [], reb: [] }
        const centreOf = { imp: new THREE.Vector3(), reb: new THREE.Vector3() }
        const scratch = new THREE.Vector3()
        const goalV = new THREE.Vector3()
        const chimaeraAt = new THREE.Vector3()

        const resetBattle = () => {
            clock = 0
            beat = 0
            imperialFire = false
            wellTarget = 0
            run = false
            retreatAt = null
            ended = false
            designated = null
            shieldsSaid = false
            mark.visible = false
            bolts.length = 0
            for (const u of units) {
                u.pos.copy(u.at)
                u.target.copy(u.at)
                u.heading = u.team === "imp" ? 0 : Math.PI
                u.hp = u.hp0 ??= u.hp ?? 400
                u.state = u.team === "imp" ? "active" : "hidden"
                u.stateT = 0
                u.fireCd = rand()
                u.flash = 0
            }
            fighters.length = 0
            // a patrol of TIEs already out; the rest launch when the Rebels arrive
            for (let i = 0; i < TIES; i++) {
                const home = i % 3 === 0 ? byId.escort : byId.chimaera
                fighters.push({ team: "imp", home, pos: home.pos.clone(), vel: new THREE.Vector3(), alive: i < 6, phase: rand() * 7, cd: rand(), target: null, retarget: 0 })
            }
            for (let i = 0; i < REBEL_FIGHTERS; i++) {
                fighters.push({ team: "reb", pos: new THREE.Vector3(), vel: new THREE.Vector3(), alive: false, phase: rand() * 7, cd: rand(), target: null, retarget: 0, runner: i % 2 === 0 })
            }
            // reinforcements from the Interdictor's hangar later on
            for (let i = 0; i < 6; i++) {
                fighters.push({ team: "imp", home: byId.interdictor, pos: byId.interdictor.pos.clone(), vel: new THREE.Vector3(), alive: false, reserve: true, phase: rand() * 7, cd: rand(), target: null, retarget: 0 })
            }
            for (const f of fighters) if (f.alive) f.pos.add(new THREE.Vector3(rand() - 0.5, rand() * 0.2, rand() - 0.5).multiplyScalar(0.6))
        }

        const shoot = (from, to, color, speed, onArrive) => {
            if (bolts.length >= BOLTS) return
            bolts.push({ from: from.clone(), to: to.clone(), t: 0, dur: from.distanceTo(to) / speed, color, onArrive })
        }
        const jitter = (v, r) => v.clone().add(new THREE.Vector3((rand() - 0.5) * r, (rand() - 0.5) * r * 0.5, (rand() - 0.5) * r))

        const destroy = (u) => {
            u.state = "dying"
            u.stateT = 0
            if (designated === u) {
                designated = null
                mark.visible = false
            }
            blast(u.pos, 0.35 * u.scale + 0.12, 0xffd9a0)
            say("destroyed", u.name)
        }

        const rebelsAlive = () => rebels.filter((u) => u.state === "active").length

        // the script: each beat fires once, at its time on the battle clock
        const BEATS = [
            [0.8, () => say("station")],
            [4, () => {
                say("arrival")
                rebels.forEach((u, i) => {
                    u.state = "arriving"
                    u.stateT = -i * 0.25
                })
                const flag = byId.nebulon
                fighters.filter((f) => f.team === "reb").forEach((f) => {
                    f.alive = true
                    f.pos.copy(flag.at).add(new THREE.Vector3(0.25 + rand() * 0.4, (rand() - 0.5) * 0.4, (rand() - 0.5) * 1.4))
                    f.vel.set(-0.3, 0, 0)
                })
            }],
            [6.5, () => {
                say("launch")
                fighters.filter((f) => f.team === "imp" && !f.reserve).forEach((f) => {
                    if (!f.alive) {
                        f.alive = true
                        f.pos.copy(f.home.pos)
                    }
                })
            }],
            [9, () => say("arrivalThrawn")],
            [11, () => {
                say("hold")
                for (const u of rebels) u.target.copy(u.advance)
            }],
            [18, () => {
                say("bracket")
                for (const u of imperials) if (u.bracket) u.target.copy(u.bracket)
            }],
            [22.5, () => {
                say("fire")
                imperialFire = true
            }],
            [27, () => {
                say("interdictor")
                wellTarget = 1
            }],
            [30, () => {
                fighters.filter((f) => f.reserve).forEach((f) => {
                    f.alive = true
                    f.pos.copy(f.home.pos)
                })
            }],
            [32, () => {
                if (!fighters.some((f) => f.team === "reb" && f.alive)) return
                run = true
                say("run")
                callbacks.current.onRun?.(true)
            }],
            [48, () => {
                if (!run) return
                run = false
                say("runOver")
                callbacks.current.onRun?.(false)
            }],
        ]

        const retreat = () => {
            retreatAt = clock
            if (run) {
                run = false
                callbacks.current.onRun?.(false)
            }
            if (!rebels.some((u) => u.state === "active") && !fighters.some((f) => f.team === "reb" && f.alive)) return
            say("overload")
            wellTarget = 0
        }

        const stepBattle = (dt) => {
            clock += dt
            while (beat < BEATS.length && clock >= BEATS[beat][0]) BEATS[beat++][1]()

            if (retreatAt === null && clock > 30 && (rebelsAlive() <= 1 || clock >= 62)) retreat()
            if (retreatAt !== null) {
                const since = clock - retreatAt
                if (since > 1.6 && !ended) {
                    // the survivors turn and jump to lightspeed, one after another
                    ended = true
                    if (rebels.some((u) => u.state === "active") || fighters.some((f) => f.team === "reb" && f.alive)) say("retreat")
                    rebels.filter((u) => u.state === "active").forEach((u, i) => {
                        u.state = "jumping"
                        u.stateT = -i * 0.4
                    })
                    for (const f of fighters) if (f.team === "reb") f.fleeing = true
                }
                if (since > 6 && since - dt <= 6) say("end")
                if (since > 12 && since - dt <= 12) {
                    say("replay")
                    fadeTarget = 0
                }
                if (since > 14) {
                    resetBattle()
                    fadeTarget = 1
                }
            }

            // who's still fighting on each side, gathered once a frame (not once per ship or fighter)
            activeOf.imp.length = activeOf.reb.length = 0
            for (const u of units) if (u.state === "active") activeOf[u.team].push(u)
            for (const team of ["imp", "reb"]) {
                const list = activeOf[team]
                centreOf[team].set(0, 0, 0)
                for (const o of list) centreOf[team].add(o.pos)
                if (list.length) centreOf[team].divideScalar(list.length)
            }
            aliveOf.imp.length = aliveOf.reb.length = 0
            for (const f of fighters) if (f.alive) aliveOf[f.team].push(f)

            // capital ships: arrive out of hyperspace, manoeuvre, trade fire, die or jump away
            for (const u of units) {
                u.stateT += dt
                u.flash = Math.max(0, u.flash - dt * 3)
                if (u.state === "arriving" && u.stateT >= 0.6) {
                    u.state = "active"
                    blast(u.pos, 0.12, u.team === "imp" ? IMPERIAL : REBEL)
                }
                if (u.state === "dying" && u.stateT > 1.6) u.state = "gone"
                if (u.state === "jumping" && u.stateT > 0.7) u.state = "gone"
                if (u.state !== "active") continue

                const to = scratch.copy(u.target).sub(u.pos)
                const d = to.length()
                if (d > 0.002) u.pos.addScaledVector(to, Math.min(1, (0.07 * dt) / d))
                // face the enemy line, turning slowly
                const enemy = u.team === "imp" ? "reb" : "imp"
                const foes = activeOf[enemy]
                let want = u.team === "imp" ? 0 : Math.PI
                if (foes.length) {
                    const c = centreOf[enemy]
                    want = Math.atan2(-(c.z - u.pos.z), c.x - u.pos.x)
                }
                let turn = want - u.heading
                turn = Math.atan2(Math.sin(turn), Math.cos(turn))
                u.heading += THREE.MathUtils.clamp(turn, -0.25 * dt, 0.25 * dt)

                // gunnery
                const firing = u.team === "imp" ? imperialFire : clock > 13
                u.fireCd -= dt
                if (!firing || u.fireCd > 0 || !foes.length) continue
                let target = null
                if (u.team === "imp" && designated?.state === "active" && designated.pos.distanceTo(u.pos) < RANGE * 1.4) target = designated
                else {
                    let best = RANGE
                    for (const o of foes) {
                        const dd = o.pos.distanceTo(u.pos)
                        if (dd < best) {
                            best = dd
                            target = o
                        }
                    }
                }
                if (!target) {
                    u.fireCd = 0.3
                    continue
                }
                u.fireCd = (u.team === "imp" ? 0.2 : 0.42) + rand() * 0.35
                const from = jitter(u.pos, 0.3 * u.scale)
                const at = jitter(target.pos, 0.12 * target.scale)
                if (u.team === "imp") {
                    shoot(from, at, 0x9fe8ff, 1.5, () => {
                        if (target.state !== "active") return
                        target.hp -= target === designated ? 2.2 : 0.95
                        target.flash = 1
                        if (rand() < 0.35) blast(at, 0.04, 0xffd9a0)
                        if (target.hp <= 0) destroy(target)
                    })
                } else {
                    shoot(from, at, 0xff7a5c, 1.3, () => {
                        // Imperial shields soak it up; the hull just flickers
                        target.flash = 0.7
                        if (rand() < 0.3) blast(at, 0.035, REBEL)
                        if (!shieldsSaid && !imperialFire) {
                            shieldsSaid = true
                            say("shields")
                        }
                    })
                }
            }

            // fighters dogfight; half the Rebel fighters make a run on the Chimaera when called
            const chimaera = byId.chimaera
            for (const f of fighters) {
                if (!f.alive) continue
                const foes = aliveOf[f.team === "imp" ? "reb" : "imp"]
                const goal = goalV.set(0, 0, 0)
                f.retarget -= dt
                if (f.retarget <= 0 || (f.target && !f.target.alive)) {
                    f.retarget = 1 + rand()
                    f.target = null
                    let best = Infinity
                    for (const o of foes) {
                        const dd = o.pos.distanceToSquared(f.pos)
                        if (dd < best) {
                            best = dd
                            f.target = o
                        }
                    }
                }
                let speed = 0.42
                if (f.team === "reb" && f.fleeing) {
                    goal.set(3.2, f.pos.y, f.pos.z)
                    speed = 0.7
                    if (f.pos.x > 2.1) {
                        f.alive = false
                        continue
                    }
                } else if (f.team === "reb" && run && f.runner) {
                    const a = clock * 1.4 + f.phase
                    goal.copy(chimaera.pos).add(scratch.set(Math.cos(a) * 0.32, 0.12 + Math.sin(a * 1.7) * 0.05, Math.sin(a) * 0.22))
                } else if (f.target && clock > 7) {
                    goal.copy(f.target.pos).add(scratch.set(Math.sin(clock * 2 + f.phase) * 0.12, 0, Math.cos(clock * 2 + f.phase) * 0.12))
                } else if (f.home) {
                    const a = clock * 0.9 + f.phase
                    goal.copy(f.home.pos).add(scratch.set(Math.cos(a) * 0.45, 0.1 + Math.sin(a * 1.3) * 0.08, Math.sin(a) * 0.4))
                    speed = 0.35
                } else {
                    goal.copy(byId.nebulon.pos).add(scratch.set(Math.cos(clock + f.phase) * 0.4, 0, Math.sin(clock + f.phase) * 0.4))
                }
                const want = goal.sub(f.pos)
                if (want.lengthSq() > 0.0001) want.setLength(speed)
                f.vel.lerp(want, Math.min(1, dt * 2.4))
                f.pos.addScaledVector(f.vel, dt)
                // keep them over the table
                const flat = Math.hypot(f.pos.x, f.pos.z)
                if (flat > TABLE_R - 0.4 && !f.fleeing) f.pos.multiplyScalar(1 - (flat - (TABLE_R - 0.4)) * 0.2)
                f.pos.y = THREE.MathUtils.clamp(f.pos.y, 0.15, 1.6)

                f.cd -= dt
                if (f.cd > 0 || f.fleeing) continue
                const colour = f.team === "imp" ? 0x9fe8ff : 0xff7a5c
                if (f.team === "reb" && run && f.runner && f.pos.distanceTo(chimaera.pos) < 0.6) {
                    f.cd = 0.5 + rand() * 0.5
                    const at = jitter(chimaera.pos, 0.4)
                    shoot(f.pos, at, colour, 2.2, () => {
                        chimaera.flash = 0.8
                        if (rand() < 0.4) blast(at, 0.03, REBEL)
                    })
                } else if (f.target && f.target.pos.distanceTo(f.pos) < 0.45 && clock > 7) {
                    f.cd = 0.8 + rand() * 0.8
                    const target = f.target
                    shoot(f.pos, target.pos, colour, 2.4, () => {
                        if (target.alive && rand() < (f.team === "imp" ? 0.035 : 0.045)) {
                            target.alive = false
                            blast(target.pos, 0.05, f.team === "imp" ? REBEL : IMPERIAL)
                        }
                    })
                }
            }

            // bolts travel, and land
            for (let i = bolts.length - 1; i >= 0; i--) {
                const b = bolts[i]
                b.t += dt
                if (b.t >= b.dur) {
                    b.onArrive?.()
                    bolts.splice(i, 1)
                }
            }

            // a couple of times a second, the force readout
            statusIn -= dt
            if (statusIn <= 0) {
                statusIn = 0.5
                const count = (team) => fighters.filter((f) => f.team === team && f.alive).length
                callbacks.current.onStatus?.({
                    clock,
                    imperial: { capitals: imperials.length, fighters: count("imp") },
                    rebel: { capitals: rebelsAlive() + rebels.filter((u) => u.state === "arriving").length, fighters: count("reb") },
                    well: wellTarget > 0,
                })
            }
        }

        // ---------- drawing the hologram each frame ----------
        const color = new THREE.Color()
        const drawUnits = (t) => {
            for (const u of units) {
                const g = u.model.group
                let opacity = 1
                let stretch = 1
                const pos = u.pos
                g.position.copy(pos)
                if (u.state === "hidden" || u.state === "gone") opacity = 0
                else if (u.state === "arriving") {
                    // out of hyperspace: a long streak that snaps into the ship
                    const k = THREE.MathUtils.clamp(u.stateT / 0.6, 0, 1)
                    opacity = u.stateT < 0 ? 0 : 1
                    const e = 1 - Math.pow(1 - k, 3)
                    g.position.x = pos.x + (1 - e) * 2.4
                    stretch = 1 + (1 - e) * 8
                } else if (u.state === "jumping") {
                    const k = THREE.MathUtils.clamp(u.stateT / 0.7, 0, 1)
                    if (u.stateT > 0) {
                        g.position.x = pos.x + k * k * 1.1
                        stretch = 1 + k * 6
                    }
                    opacity = 1 - k * 0.8
                    if (k >= 1) opacity = 0
                } else if (u.state === "dying") {
                    // the hologram breaks up: it flickers, tears and fades
                    const k = THREE.MathUtils.clamp(u.stateT / 1.6, 0, 1)
                    opacity = (1 - k) * (Math.sin(t * 60) > 0 ? 1 : 0.4)
                    g.position.y = pos.y - k * 0.08
                    g.rotation.z = k * 0.4
                    if (u.stateT < 1 && rand() < 0.15) blast(jitter(pos, 0.4 * u.scale), 0.06, 0xffd9a0)
                }
                if (u.state !== "dying") g.rotation.z = 0
                g.rotation.y = u.state === "jumping" ? 0 : u.heading
                g.scale.set(u.scale * stretch, u.scale, u.scale)
                const lit = 1 + u.flash * 0.8
                u.model.fill.uniforms.uOpacity.value = opacity * fade * lit
                u.model.edge.opacity = 0.85 * opacity * fade
                g.visible = opacity > 0.01
                u.hit.visible = u.state === "active"
            }
            if (designated?.state === "active") {
                mark.visible = true
                mark.position.set(designated.pos.x, designated.pos.y - 0.06, designated.pos.z)
                mark.rotation.z = t * 1.2
                mark.scale.setScalar(designated.scale * 3)
                markMat.opacity = (0.65 + Math.sin(t * 6) * 0.25) * fade
            } else mark.visible = false

            // fighters and their trails
            for (let i = 0; i < FIGHTERS; i++) {
                const f = fighters[i]
                if (!f || !f.alive) {
                    fCol.fill(0, i * 3, i * 3 + 3)
                    tCol.fill(0, i * 6, i * 6 + 6)
                    continue
                }
                color.set(f.team === "imp" ? 0x9fe8ff : 0xff8a6a).multiplyScalar(fade)
                fPos.set([f.pos.x, f.pos.y, f.pos.z], i * 3)
                fCol.set([color.r, color.g, color.b], i * 3)
                tPos.set([f.pos.x, f.pos.y, f.pos.z, f.pos.x - f.vel.x * 0.35, f.pos.y - f.vel.y * 0.35, f.pos.z - f.vel.z * 0.35], i * 6)
                tCol.set([color.r * 0.7, color.g * 0.7, color.b * 0.7, 0, 0, 0], i * 6)
            }
            fighterGeo.attributes.position.needsUpdate = fighterGeo.attributes.color.needsUpdate = true
            trailGeo.attributes.position.needsUpdate = trailGeo.attributes.color.needsUpdate = true

            // bolts: a dash running along each shot's line
            bCol.fill(0)
            for (let i = 0; i < bolts.length; i++) {
                const b = bolts[i]
                const k = b.t / b.dur
                const len = Math.min(1, 0.12 / Math.max(0.05, b.from.distanceTo(b.to)))
                const k0 = Math.max(0, k - len)
                for (const [j, kk] of [[0, k], [1, k0]]) {
                    bPos[i * 6 + j * 3] = b.from.x + (b.to.x - b.from.x) * kk
                    bPos[i * 6 + j * 3 + 1] = b.from.y + (b.to.y - b.from.y) * kk
                    bPos[i * 6 + j * 3 + 2] = b.from.z + (b.to.z - b.from.z) * kk
                }
                color.set(b.color).multiplyScalar(fade)
                bCol.set([color.r, color.g, color.b, color.r * 0.3, color.g * 0.3, color.b * 0.3], i * 6)
            }
            boltGeo.attributes.position.needsUpdate = boltGeo.attributes.color.needsUpdate = true
            boltGeo.setDrawRange(0, bolts.length * 2)
        }

        const drawBlasts = (dt) => {
            for (const b of blastPool) {
                if (!b.ring.visible) continue
                b.age += dt
                const k = b.age / b.life
                if (k >= 1) {
                    b.ring.visible = b.flash.visible = false
                    continue
                }
                const s = b.size * (0.3 + Math.sqrt(k) * 1.4)
                b.ring.scale.setScalar(s)
                b.ring.quaternion.copy(camera.quaternion)
                b.ring.material.opacity = (1 - k) * fade
                b.flash.scale.setScalar(b.size * 2.2 * (1 - k * 0.5))
                b.flash.material.opacity = Math.max(0, 1 - k * 2.2) * fade
            }
        }

        // labels follow their ships across the screen
        const v = new THREE.Vector3()
        const drawLabels = () => {
            const w = mount.clientWidth
            const h = mount.clientHeight
            for (const u of units) {
                const show = (u.state === "active" || u.state === "arriving") && fade > 0.3 && !diveRef.current
                if (!show) {
                    u.label.style.opacity = "0"
                    continue
                }
                v.copy(u.pos)
                v.y += 0.14 * u.scale + 0.06
                holo.localToWorld(v)
                v.project(camera)
                if (v.z > 1) {
                    u.label.style.opacity = "0"
                    continue
                }
                u.label.style.opacity = "1"
                u.label.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px)`
                u.label.classList.toggle("is-marked", designated === u)
                u.label.classList.toggle("is-hover", hovered === u)
            }
        }

        // ---------- walking round the table ----------
        let yaw = 0
        let pitch = 0.4
        let tYaw = 0
        let tPitch = 0.4
        let radius = 7.4
        let lastTouch = -10
        const lookAt = new THREE.Vector3(0, 1.05, 0)
        const homeLook = new THREE.Vector3(0, 1.05, 0)
        let drag = null
        let hovered = null
        const canvas = renderer.domElement
        const raycaster = new THREE.Raycaster()
        const pointer = new THREE.Vector2()
        const pick = (e) => {
            const rect = canvas.getBoundingClientRect()
            pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
            raycaster.setFromCamera(pointer, camera)
            const hits = raycaster.intersectObjects(units.filter((u) => u.state === "active").map((u) => u.hit), false)
            return hits[0]?.object.userData.unit ?? null
        }
        const onDown = (e) => {
            drag = { x: e.clientX, y: e.clientY, yaw: tYaw, pitch: tPitch, moved: false }
            canvas.setPointerCapture(e.pointerId)
        }
        const onMove = (e) => {
            if (drag) {
                const dx = e.clientX - drag.x
                const dy = e.clientY - drag.y
                if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true
                tYaw = THREE.MathUtils.clamp(drag.yaw - dx * 0.005, -1.1, 1.1)
                tPitch = THREE.MathUtils.clamp(drag.pitch + dy * 0.004, 0.12, 0.95)
                lastTouch = performance.now() / 1000
                return
            }
            if (e.pointerType !== "mouse") return
            hovered = pick(e)
            canvas.style.cursor = hovered && (hovered.team === "reb" || hovered.id === "chimaera") ? "pointer" : ""
        }
        const onUp = (e) => {
            const wasClick = drag && !drag.moved
            drag = null
            if (!wasClick) return
            const unit = pick(e)
            if (!unit) return
            if (unit.id === "chimaera") callbacks.current.onBattery?.()
            else if (unit.team === "reb" && unit !== designated) {
                designated = unit
                say("designate", unit.name)
            }
        }
        canvas.addEventListener("pointerdown", onDown)
        canvas.addEventListener("pointermove", onMove)
        canvas.addEventListener("pointerup", onUp)
        canvas.addEventListener("pointercancel", () => (drag = null))

        const resize = () => {
            const w = mount.clientWidth
            const h = mount.clientHeight
            if (!w || !h) return
            gl.resize(w, h)
            camera.aspect = w / h
            // stand further back on narrow screens so the whole table fits
            camera.fov = w / h < 1 ? 62 : 50
            radius = w / h < 1 ? 10.5 : w / h < 1.4 ? 8.6 : 7.4
            camera.updateProjectionMatrix()
        }
        const observer = new ResizeObserver(resize)
        observer.observe(mount)
        resize()
        resetBattle()

        let last = performance.now()
        let frame
        let diveK = 0
        const tick = (now) => {
            frame = requestAnimationFrame(tick)
            const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
            gl.frame(dt)
            last = now
            if (pausedRef.current) return
            const t = now / 1000

            stepBattle(reduceMotion ? dt * 0.8 : dt)
            fade += (fadeTarget - fade) * Math.min(1, dt * 2.5)
            wellOn += (wellTarget - wellOn) * Math.min(1, dt * 1.5)

            // the projection flickers now and then
            glitchIn -= dt
            let glitch = 0
            if (!reduceMotion) {
                if (glitchIn <= 0) glitchIn = 5 + rand() * 9
                if (glitchIn > 0 && glitchIn < 0.14) glitch = 1
            }
            kit.shared.uTime.value = t
            kit.shared.uGlitch.value = glitch
            planetFill.uniforms.uOpacity.value = 0.55 * fade * (glitch ? 0.6 : 1)
            planetLines.opacity = 0.35 * fade
            planet.rotation.y = t * 0.05
            const interdictor = byId.interdictor
            well.position.copy(interdictor.pos)
            well.rotation.y = -t * 0.12
            wellMat.opacity = wellOn * fade * (0.16 + Math.sin(t * 2.2) * 0.05)
            holoLight.intensity = (5 + Math.sin(t * 13) * 0.25 - glitch * 2) * (0.35 + fade * 0.65)

            drawUnits(t)
            drawBlasts(dt)

            // the camera: where you're standing, gently drifting when left alone, diving onto the Chimaera on the way to the turret
            yaw += (tYaw - yaw) * Math.min(1, dt * 4)
            pitch += (tPitch - pitch) * Math.min(1, dt * 4)
            const idle = t - lastTouch > 5 && !reduceMotion
            const drift = idle ? Math.sin(t * 0.05) * 0.22 : 0
            diveK += ((diveRef.current ? 1 : 0) - diveK) * Math.min(1, dt * 3.2)
            const chimaeraWorld = holo.localToWorld(chimaeraAt.copy(byId.chimaera.pos))
            lookAt.copy(homeLook).lerp(chimaeraWorld, diveK)
            const r = THREE.MathUtils.lerp(radius, 0.7, diveK)
            const a = yaw + drift * (1 - diveK)
            const p = THREE.MathUtils.lerp(pitch, 0.35, diveK)
            camera.position.set(lookAt.x + Math.sin(a) * Math.cos(p) * r, lookAt.y + Math.sin(p) * r, lookAt.z + Math.cos(a) * Math.cos(p) * r)
            camera.lookAt(lookAt)

            for (const s of screens) s.offset.x = (t * 0.05) % 1

            renderer.render(scene, camera)
            drawLabels()
        }
        gl.begin(scene, camera, () => (frame = requestAnimationFrame(tick)))

        return () => {
            cancelAnimationFrame(frame)
            observer.disconnect()
            canvas.removeEventListener("pointerdown", onDown)
            canvas.removeEventListener("pointermove", onMove)
            canvas.removeEventListener("pointerup", onUp)
            for (const u of units) u.label.remove()
            disposeScene(scene)
            glowTex.dispose()
            renderer.dispose()
            canvas.remove()
        }
    }, [])

    return (
        <div className="holotable">
            <div className="holotable-view" ref={mountRef} />
            <div className="holotable-labels" ref={labelsRef} aria-hidden="true" />
        </div>
    )
}

export default HoloTable
