import { useEffect, useRef } from "react"
import * as THREE from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import { CRYSTALS, FINISHES } from "./ilumContent"
import { RED_CRYSTAL } from "./mustafarContent"
import { blip, clash, createSaberSound, noise, zap } from "./sound"
import { bakeStatic, disposeScene, paintGlow, seeded } from "./scenery"
import { createRenderer } from "./renderer"

/*
 * Building and wielding a lightsaber, in three.js.
 *
 * mode "build": the hilt's four parts (pommel, grip, switch, emitter) hang apart in the air with
 *   the kyber crystal between them, turning slowly; changing the hilt or finish rebuilds them.
 * mode "assemble": the parts drift together and lock, the crystal slides into its chamber, then
 *   onAssembled() fires.
 * mode "ready": the finished hilt turns in front of you.
 * mode "lit": the blade ignites with a snap-hiss and you hold it: it follows the pointer, and the
 *   hum swells and bends as you swing.
 * mode "bleed" (Mustafar): the crystal alone, large in front of you. Hold the pointer (or Space)
 *   to pour anger into it: it cracks, shakes and turns red, healing if you let go. onBleed(0..1)
 *   reports progress; onBled() fires when it breaks.
 * mode "train": as "lit", with a seeker remote floating ahead and firing stinging bolts at you.
 *   Put the blade in their way to deflect them. onStats({ blocks, streak, best, returns }) reports
 *   the score; `shield` lowers a blast shield over your eyes, leaving only a faint sense of where
 *   each bolt will cross.
 *
 * `setting` is "ilum" (the mouth of the crystal caves) or "mustafar" (a ledge over the lava, with
 * Fortress Vader in the distance).
 *
 * Units are metres: the hilt is about 25cm long, the blade 90cm.
 */

const ALL_CRYSTALS = [...CRYSTALS, RED_CRYSTAL]

// Mustafar's lava, and its falls: slow, glowing noise under a dark crust
const LAVA_NOISE = /* glsl */ `
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float vnoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
    }
    float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 5; i++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; }
        return v;
    }
    vec3 lavaColour(float n) {
        float hot = smoothstep(0.42, 0.72, n);
        vec3 crust = vec3(0.04, 0.012, 0.008);
        vec3 glow = mix(vec3(0.95, 0.2, 0.02), vec3(1.0, 0.78, 0.3), smoothstep(0.68, 0.95, n));
        return mix(crust, glow * 1.7, hot);
    }`
const lavaMaterial = (uTime, falls) =>
    new THREE.ShaderMaterial({
        uniforms: { uTime },
        transparent: falls,
        depthWrite: !falls,
        vertexShader: `varying vec3 vW; varying vec2 vUv; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: `uniform float uTime; varying vec3 vW; varying vec2 vUv; ${LAVA_NOISE}
            void main() {
                ${
                    falls
                        ? "vec2 p = vec2(vW.x * 0.35, vW.y * 0.12 + uTime * 0.5); float n = fbm(p + fbm(p * 2.0) * 0.6);"
                        : "vec2 p = vW.xz * 0.11; p.y += uTime * 0.04; float n = fbm(p + fbm(p * 1.7 + uTime * 0.03));"
                }
                vec3 c = lavaColour(n);
                ${falls ? "" : "c *= exp(-length(vW.xz) * 0.01);"}
                // the falls fade out at their edges and top, into the haze
                float a = ${falls ? "smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x) * smoothstep(1.0, 0.75, vUv.y)" : "1.0"};
                gl_FragColor = vec4(c, a);
            }`,
    })

const BLADE = 0.9
const PLANE = -1.0 // you hold the blade about a metre in front of you
const REMOTE_Z = -2.7
const BEST_KEY = "galaxy-remote-best"

const lathe = (pts, seg = 32) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg)
const cyl = (r, h, seg = 32) => lathe([[0, 0], [r, 0], [r, h], [0, h]], seg)

/*
 * A hilt: four parts, each a group whose own origin sits at its base on the hilt's axis (+Y towards
 * the emitter). `tilt` bends a part about the pivot, for the Duelist's curved neck.
 */
const buildHilt = (style, finish) => {
    const metal = new THREE.MeshStandardMaterial({ color: finish.color, metalness: finish.metalness, roughness: finish.roughness })
    const dark = new THREE.MeshStandardMaterial({ color: 0x17181b, metalness: 0.3, roughness: 0.65 })
    const red = new THREE.MeshBasicMaterial({ color: 0xff3b30 })
    const green = new THREE.MeshBasicMaterial({ color: 0x4dff7a })
    const cloth = new THREE.MeshStandardMaterial({ color: 0x6d5a45, roughness: 0.95 })
    const mesh = (geo, mat, x = 0, y = 0, z = 0) => {
        const m = new THREE.Mesh(geo, mat)
        m.position.set(x, y, z)
        return m
    }
    const part = (name, y0, ...children) => {
        const g = new THREE.Group()
        g.add(...children)
        return { name, group: g, y0, tilt: 0 }
    }
    const around = (count, r, y, make) =>
        Array.from({ length: count }, (_, i) => {
            const a = (i / count) * Math.PI * 2
            const m = make()
            m.position.set(Math.cos(a) * r, y, Math.sin(a) * r)
            m.rotation.y = -a
            return m
        })
    const switchSection = (h, buttons) =>
        [
            lathe([[0, 0], [0.017, 0], [0.017, 0.007], [0.0155, 0.009], [0.0155, h - 0.009], [0.017, h - 0.007], [0.017, h], [0, h]]),
        ]
            .map((g) => mesh(g, metal))
            .concat(buttons)

    let parts
    let length
    if (style === "seeker") {
        parts = [
            part("pommel", 0, mesh(lathe([[0, 0], [0.02, 0], [0.021, 0.01], [0.019, 0.03], [0.016, 0.036], [0, 0.036]]), metal)),
            part("grip", 0.036, mesh(cyl(0.0145, 0.1), metal), ...Array.from({ length: 9 }, (_, i) => mesh(new THREE.TorusGeometry(0.0157, 0.0022, 8, 28).rotateX(Math.PI / 2), dark, 0, 0.008 + i * 0.0105, 0))),
            part("switch", 0.136, ...switchSection(0.04, [0, 1, 2].map((i) => mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.004, 10).rotateX(Math.PI / 2), i === 1 ? green : red, -0.007 + i * 0.007, 0.02, 0.0175)))),
            part("emitter", 0.176, mesh(lathe([[0, 0], [0.016, 0], [0.016, 0.03], [0.0185, 0.035], [0.0185, 0.045], [0.011, 0.045], [0.011, 0.04], [0, 0.04]]), metal)),
        ]
        length = 0.221
    } else if (style === "duelist") {
        parts = [
            part("pommel", 0, mesh(lathe([[0, 0], [0.008, 0], [0.016, 0.012], [0.016, 0.022], [0.013, 0.03], [0, 0.03]]), metal)),
            part("grip", 0.03, mesh(cyl(0.0148, 0.095), metal), mesh(lathe([[0.0149, 0.012], [0.0162, 0.016], [0.0162, 0.078], [0.0149, 0.082]]), dark)),
            part("switch", 0.125, ...switchSection(0.04, [mesh(new THREE.BoxGeometry(0.006, 0.012, 0.006), red, 0, 0.02, 0.017)])),
            part(
                "emitter",
                0.165,
                mesh(lathe([[0, 0], [0.0165, 0], [0.0165, 0.04], [0.02, 0.05], [0.02, 0.06], [0.012, 0.06], [0.012, 0.055], [0, 0.055]]), metal),
                // the guard that sweeps forward round the emitter
                mesh(new THREE.TorusGeometry(0.03, 0.003, 8, 24, Math.PI * 0.8).rotateZ(Math.PI * 0.6), metal, 0.006, 0.03, 0)
            ),
        ]
        parts[0].tilt = parts[1].tilt = 0.3
        length = 0.225
    } else if (style === "wanderer") {
        const wraps = Array.from({ length: 13 }, (_, i) => {
            const m = mesh(new THREE.TorusGeometry(0.0158, 0.0032, 6, 24).rotateX(Math.PI / 2), cloth, 0, 0.008 + i * 0.0102, 0)
            m.rotation.z = i % 2 ? 0.22 : -0.22
            return m
        })
        parts = [
            part("pommel", 0, mesh(cyl(0.0172, 0.025), metal), ...around(3, 0.0172, 0.012, () => mesh(new THREE.BoxGeometry(0.004, 0.018, 0.004), dark))),
            part("grip", 0.025, mesh(cyl(0.0145, 0.14), metal), ...wraps),
            part("switch", 0.165, ...switchSection(0.03, [mesh(new THREE.BoxGeometry(0.006, 0.01, 0.006), green, 0, 0.015, 0.017)])),
            part("emitter", 0.195, mesh(lathe([[0, 0], [0.0165, 0], [0.0165, 0.03], [0.013, 0.04], [0, 0.04]]), metal), ...around(6, 0.016, 0.034, () => mesh(new THREE.BoxGeometry(0.005, 0.016, 0.004), metal))),
        ]
        length = 0.235
    } else {
        parts = [
            part("pommel", 0, mesh(lathe([[0, 0], [0.015, 0], [0.018, 0.004], [0.018, 0.022], [0.016, 0.03], [0, 0.03]]), metal), mesh(new THREE.TorusGeometry(0.0182, 0.0018, 8, 28).rotateX(Math.PI / 2), dark, 0, 0.013, 0)),
            part("grip", 0.03, mesh(cyl(0.0155, 0.1), metal), ...around(7, 0.0162, 0.05, () => mesh(new THREE.BoxGeometry(0.006, 0.084, 0.005), dark))),
            part("switch", 0.13, ...switchSection(0.045, [mesh(new THREE.BoxGeometry(0.007, 0.014, 0.006), red, 0, 0.022, 0.017), mesh(new THREE.BoxGeometry(0.004, 0.004, 0.004), green, 0.011, 0.031, 0.013)])),
            part("emitter", 0.175, mesh(lathe([[0, 0], [0.0165, 0], [0.0175, 0.02], [0.023, 0.05], [0.023, 0.064], [0.019, 0.07], [0.012, 0.07], [0.012, 0.06], [0, 0.06]]), metal), ...around(4, 0.0232, 0.056, () => mesh(new THREE.BoxGeometry(0.004, 0.008, 0.003), dark))),
        ]
        length = 0.245
    }
    const sw = parts.find((p) => p.name === "switch")
    return { parts, length, grip: parts[1].y0 + 0.05, chamber: sw.y0 + 0.02, pivot: sw.y0, materials: [metal, dark, red, green, cloth] }
}

// A part's transform when the hilt is `spread` apart (0 = assembled)
const SPREAD = { pommel: -0.13, grip: -0.06, switch: 0.05, emitter: 0.12 }
const placePart = (p, pivot, spread, t, i) => {
    const y = p.y0 + SPREAD[p.name] * spread
    const bob = Math.sin(t * 1.3 + i * 1.7) * 0.006 * spread
    if (p.tilt) {
        // bent about the pivot, below the switch
        const dy = y - pivot
        p.group.position.set(Math.sin(p.tilt) * dy, pivot + Math.cos(p.tilt) * dy, 0)
        p.group.rotation.set(0, t * 0.4 * spread, -p.tilt)
    } else {
        p.group.position.set(bob, y, 0)
        p.group.rotation.set(0, t * 0.4 * spread * (i % 2 ? -1 : 1), 0)
    }
}

// The blade: a flat strip turned to face you, with a white-hot core and a coloured glow, rounded at the tip
const bladeMaterial = (color, core, strength) =>
    new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(color) }, uCore: { value: new THREE.Color(core) }, uLen: { value: BLADE }, uWidth: { value: 0.1 }, uStrength: { value: strength }, uFlicker: { value: 1 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
            uniform vec3 uColor; uniform vec3 uCore; uniform float uLen; uniform float uWidth; uniform float uStrength; uniform float uFlicker;
            varying vec2 vUv;
            void main() {
                float x = abs(vUv.x - 0.5) * 2.0;
                float half_ = uWidth * 0.5;
                float along = vUv.y * (uLen + half_);
                float over = max(0.0, along - uLen) / half_;
                float d = length(vec2(x, over));
                float core = smoothstep(0.2, 0.07, d) * step(0.5, uStrength);
                float glow = exp(-d * 3.4) * (1.0 - smoothstep(0.8, 1.0, d));
                vec3 col = uColor * glow * 1.5 * uStrength * uFlicker + uCore * core;
                gl_FragColor = vec4(col, clamp(glow * uStrength + core, 0.0, 1.0));
            }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
    })

// The training remote: a small dark ball with a band of emitters and a red eye
const buildRemote = () => {
    const remote = new THREE.Group()
    const shell = new THREE.MeshStandardMaterial({ color: 0x50565d, metalness: 0.8, roughness: 0.35 })
    const dark = new THREE.MeshStandardMaterial({ color: 0x1d2024, metalness: 0.5, roughness: 0.5 })
    remote.add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 28, 20), shell))
    remote.add(new THREE.Mesh(new THREE.TorusGeometry(0.071, 0.008, 8, 40).rotateX(Math.PI / 2), dark))
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        const nub = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.009, 0.02, 8), dark)
        nub.position.set(Math.cos(a) * 0.075, 0, Math.sin(a) * 0.075)
        nub.rotation.z = Math.PI / 2
        nub.rotation.y = -a
        remote.add(nub)
    }
    for (const y of [-1, 1]) {
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.012, 12), dark)
        cap.position.y = y * 0.07
        remote.add(cap)
    }
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 8), new THREE.MeshBasicMaterial({ color: 0x661010 }))
    eye.position.set(0, 0, 0.068)
    remote.add(eye)
    return { remote, eye }
}

const readBest = () => {
    try {
        return Number(localStorage.getItem(BEST_KEY)) || 0
    } catch {
        return 0
    }
}

const SaberForge = ({ crystal, hilt, finish, mode, shield = false, setting = "ilum", onAssembled, onStats, onBleed, onBled }) => {
    const rootRef = useRef(null)
    const mountRef = useRef(null)
    const senseRef = useRef(null)
    const stingRef = useRef(null)
    const props = useRef({})
    useEffect(() => {
        props.current = { crystal, hilt, finish, mode, shield, onAssembled, onStats, onBleed, onBled }
    })
    const api = useRef({})

    useEffect(() => {
        const mount = mountRef.current
        const gl = createRenderer(mount, {})
        if (!gl) return
        const { renderer } = gl
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const rand = seeded(13)

        const mustafar = setting === "mustafar"
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(mustafar ? 0x0d0302 : 0x02050b)
        scene.fog = mustafar ? new THREE.Fog(0x2a0a04, 8, 70) : new THREE.Fog(0x02050b, 2, 9)
        // a soft studio of light for the metal to reflect
        const pmrem = new THREE.PMREMGenerator(renderer)
        const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
        scene.environment = envMap
        scene.environmentIntensity = 0.7
        const camera = new THREE.PerspectiveCamera(55, 1, 0.01, 200)
        const glowTex = paintGlow("rgba(255,255,255,1)", "rgba(255,255,255,0.3)")
        const uTime = { value: 0 }
        let embers = null

        if (mustafar) {
            // a ledge of black rock over a sea of lava, under a sky lit orange from below
            scene.environmentIntensity = 0.35
            scene.add(new THREE.HemisphereLight(0x3a1610, 0xff5a1a, 0.7))
            const key = new THREE.DirectionalLight(0xff8a4a, 1.6)
            key.position.set(-0.5, -1, 1.5)
            scene.add(key)
            const rim = new THREE.DirectionalLight(0xff3a1a, 1.4)
            rim.position.set(1, 0.6, -2)
            scene.add(rim)
            const sky = new THREE.Mesh(
                new THREE.SphereGeometry(150, 32, 16),
                new THREE.ShaderMaterial({
                    side: THREE.BackSide,
                    depthWrite: false,
                    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
                    fragmentShader: `varying vec3 vP; void main(){
                        float h = vP.y;
                        vec3 low = vec3(0.75, 0.2, 0.04);
                        vec3 mid = vec3(0.2, 0.04, 0.02);
                        vec3 top = vec3(0.02, 0.008, 0.008);
                        vec3 c = h < 0.12 ? mix(low, mid, smoothstep(-0.05, 0.12, h)) : mix(mid, top, smoothstep(0.12, 0.55, h));
                        gl_FragColor = vec4(c, 1.0);
                    }`,
                })
            )
            scene.add(sky)
            const lava = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), lavaMaterial(uTime, false))
            lava.rotation.x = -Math.PI / 2
            lava.position.y = -3
            scene.add(lava)
            const basalt = new THREE.MeshStandardMaterial({ color: 0x1a1210, roughness: 0.95, metalness: 0.05, flatShading: true })
            const ledge = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.4, 2.2, 9), basalt)
            ledge.position.set(0, -2, 0.4)
            scene.add(ledge)
            // jagged rocks rising out of the lava (baked into one mesh)
            const rocks = new THREE.Group()
            for (let i = 0; i < 26; i++) {
                const rock = new THREE.Mesh(new THREE.ConeGeometry(0.8 + rand() * 2.4, 3 + rand() * 9, 5 + Math.floor(rand() * 3)), basalt)
                const side = i % 2 ? 1 : -1
                rock.position.set(side * (5 + rand() * 30), -3 + rand() * 1.5, -6 - rand() * 60)
                rock.rotation.set((rand() - 0.5) * 0.3, rand() * 3, (rand() - 0.5) * 0.3)
                rocks.add(rock)
            }
            scene.add(bakeStatic(rocks))
            // Fortress Vader: a great tower rising from the lava, splitting into two prongs at the top
            const fortress = new THREE.Group()
            const stone = new THREE.MeshStandardMaterial({ color: 0x15100f, roughness: 0.8, metalness: 0.2 })
            const piece = (geo, x, y, z, rz = 0) => {
                const m = new THREE.Mesh(geo, stone)
                m.position.set(x, y, z)
                m.rotation.z = rz
                fortress.add(m)
            }
            piece(new THREE.CylinderGeometry(5, 7, 6, 8), 0, 0, 0)
            piece(new THREE.BoxGeometry(4, 26, 4), 0, 15, 0)
            piece(new THREE.BoxGeometry(6, 4, 5), 0, 26, 0)
            piece(new THREE.BoxGeometry(1.6, 12, 2.4), -2.2, 33, 0, 0.08)
            piece(new THREE.BoxGeometry(1.6, 12, 2.4), 2.2, 33, 0, -0.08)
            const window_ = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.5), new THREE.MeshBasicMaterial({ color: 0xffb070, fog: false }))
            window_.position.set(0, 26.5, 2.6)
            fortress.add(window_)
            fortress.position.set(7, -3, -85)
            fortress.rotation.y = -0.3
            scene.add(fortress)
            // the lava falls pouring down behind it
            for (const [x, w] of [[-22, 7], [-12, 4], [30, 10]]) {
                const fall = new THREE.Mesh(new THREE.PlaneGeometry(w, 46), lavaMaterial(uTime, true))
                fall.position.set(x, 19, -110)
                scene.add(fall)
            }
            // embers drifting up through the heat
            const count = 500
            const ep = new Float32Array(count * 3)
            for (let i = 0; i < count; i++) ep.set([(rand() - 0.5) * 30, -3 + rand() * 12, -2 - rand() * 30], i * 3)
            const eGeo = new THREE.BufferGeometry()
            eGeo.setAttribute("position", new THREE.BufferAttribute(ep, 3))
            embers = new THREE.Points(eGeo, new THREE.PointsMaterial({ color: 0xff8a3a, size: 0.08, map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
            scene.add(embers)
        } else {
            scene.add(new THREE.HemisphereLight(0x8fb4e0, 0x05080e, 0.35))
            const key = new THREE.DirectionalLight(0xdfeaff, 1.8)
            key.position.set(-1.5, 2, 1)
            scene.add(key)
            const rim = new THREE.DirectionalLight(0x6fa8ff, 1.2)
            rim.position.set(1.5, 0.5, -2)
            scene.add(rim)
            // the cave mouth around you: an icy floor and faraway crystals glowing in the dark
            const floor = new THREE.Mesh(new THREE.CircleGeometry(8, 48), new THREE.MeshStandardMaterial({ color: 0x0b121b, metalness: 0.1, roughness: 0.85 }))
            floor.rotation.x = -Math.PI / 2
            floor.position.y = -0.9
            scene.add(floor)
            for (let i = 0; i < 40; i++) {
                const c = CRYSTALS[i % CRYSTALS.length]
                const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: i % 3 ? 0x9fc8ff : c.blade, transparent: true, opacity: 0.25 + rand() * 0.3, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }))
                const a = rand() * Math.PI * 2
                const d = 4 + rand() * 4
                s.position.set(Math.cos(a) * d * 0.8, -0.6 + rand() * 2.4, -Math.abs(Math.sin(a)) * d - 3)
                s.scale.setScalar(0.15 + rand() * 0.35)
                scene.add(s)
            }
        }

        // ---------- the crystal to bleed (Mustafar) ----------
        const bleedGroup = new THREE.Group()
        bleedGroup.position.set(0, 0.03, -0.62)
        bleedGroup.visible = false
        scene.add(bleedGroup)
        const bleedMat = new THREE.MeshStandardMaterial({ color: 0x2f8cff, emissive: 0x2f8cff, emissiveIntensity: 1.2, roughness: 0.1, transparent: true, opacity: 0.95 })
        const bleedShape = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), bleedMat)
        bleedShape.scale.set(0.035, 0.11, 0.035)
        bleedGroup.add(bleedShape)
        // fractures spreading through it: the edges of a finer shape, showing through as it cracks
        const crackMat = new THREE.LineBasicMaterial({ color: 0xff2a1a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
        const cracks = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1, 1)), crackMat)
        cracks.scale.set(0.037, 0.105, 0.037)
        bleedGroup.add(cracks)
        const bleedGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x2f8cff, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }))
        bleedGlow.scale.setScalar(0.4)
        bleedGroup.add(bleedGlow)
        const bleedLight = new THREE.PointLight(0x2f8cff, 1.5, 3, 1.6)
        bleedGroup.add(bleedLight)
        const bleedFrom = new THREE.Color()
        const bleedTo = new THREE.Color(RED_CRYSTAL.blade)
        const bleedNow = new THREE.Color()
        let bleed = 0
        let holding = false
        let heartIn = 0
        let grindIn = 0
        let bleedReport = 0
        let bledSent = false

        // ---------- the hilt ----------
        const hiltRoot = new THREE.Group()
        const inner = new THREE.Group()
        hiltRoot.add(inner)
        scene.add(hiltRoot)
        const emitterTip = new THREE.Object3D()
        inner.add(emitterTip)
        let built = null
        const crystalMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.6, roughness: 0.1, transparent: true, opacity: 0.95 })
        const kyber = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), crystalMat)
        kyber.scale.set(0.008, 0.026, 0.008)
        inner.add(kyber)
        const kyberGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }))
        kyberGlow.scale.setScalar(0.07)
        inner.add(kyberGlow)
        const kyberLight = new THREE.PointLight(0xffffff, 0.4, 0.6, 2)
        inner.add(kyberLight)

        const rebuild = (style, fin) => {
            if (built) {
                for (const p of built.parts) {
                    inner.remove(p.group)
                    p.group.traverse((o) => o.geometry?.dispose())
                }
                built.materials.forEach((m) => m.dispose())
            }
            built = buildHilt(style, FINISHES.find((f) => f.id === fin) ?? FINISHES[0])
            for (const p of built.parts) inner.add(p.group)
            emitterTip.position.y = built.length
        }
        const setCrystal = (id) => {
            const c = ALL_CRYSTALS.find((k) => k.id === id) ?? CRYSTALS[0]
            if (c.id !== "red") bleedFrom.set(c.blade)
            crystalMat.color.set(c.blade)
            crystalMat.emissive.set(c.blade)
            kyberGlow.material.color.set(c.blade)
            kyberLight.color.set(c.blade)
            bladeCore.uniforms.uColor.value.set(c.blade)
            bladeCore.uniforms.uCore.value.set(c.core)
            bladeHalo.uniforms.uColor.value.set(c.blade)
            bladeLight.color.set(c.blade)
            trailMat.uniforms.color.value.set(c.blade)
        }

        // ---------- the blade ----------
        const bladeCore = bladeMaterial(0xffffff, 0xffffff, 1)
        const bladeHalo = bladeMaterial(0xffffff, 0xffffff, 0.32)
        bladeHalo.uniforms.uWidth.value = 0.42
        const strip = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0)
        const blade = new THREE.Mesh(strip, bladeCore)
        const halo = new THREE.Mesh(strip, bladeHalo)
        blade.renderOrder = 2
        halo.renderOrder = 1
        scene.add(halo, blade)
        const bladeLight = new THREE.PointLight(0xffffff, 0, 3, 1.6)
        scene.add(bladeLight)
        let bladeLen = 0
        let lit = false
        const sound = createSaberSound()

        // the swing trail: the last few blade positions, joined into a fading ribbon
        const TRAIL = 9
        const trailPos = new Float32Array(TRAIL * 2 * 3)
        const trailAlpha = new Float32Array(TRAIL * 2)
        const trailGeo = new THREE.BufferGeometry()
        trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3))
        trailGeo.setAttribute("alpha", new THREE.BufferAttribute(trailAlpha, 1))
        const idx = []
        for (let i = 0; i < TRAIL - 1; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2)
        trailGeo.setIndex(idx)
        const trailMat = new THREE.ShaderMaterial({
            uniforms: { color: { value: new THREE.Color(0xffffff) } },
            vertexShader: `attribute float alpha; varying float vA; void main(){ vA = alpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
            fragmentShader: `uniform vec3 color; varying float vA; void main(){ gl_FragColor = vec4(color * vA, vA); }`,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
        })
        const trail = new THREE.Mesh(trailGeo, trailMat)
        trail.frustumCulled = false
        scene.add(trail)
        const history = []
        let historyFill = 0
        // scratch vectors, reused every frame
        const prevTip = new THREE.Vector3()
        const throughV = new THREE.Vector3()
        const midV = new THREE.Vector3()
        const prevBolt = new THREE.Vector3()
        const lookV = new THREE.Vector3()

        // ---------- the remote, its bolts and sparks ----------
        const { remote, eye } = buildRemote()
        remote.visible = false
        scene.add(remote)
        const eyeGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff3020, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }))
        eyeGlow.scale.setScalar(0.12)
        remote.add(eyeGlow)
        eyeGlow.position.z = 0.07
        const boltGeo = new THREE.CapsuleGeometry(0.006, 0.07, 4, 8).rotateX(Math.PI / 2)
        const boltMat = new THREE.MeshBasicMaterial({ color: 0xff6a50 })
        const bolts = []
        const sparks = []
        const spark = (at, color, size = 0.12) => {
            const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
            s.position.copy(at)
            scene.add(s)
            sparks.push({ s, age: 0, size })
        }

        let stats = { blocks: 0, streak: 0, best: readBest(), returns: 0 }
        const report = () => props.current.onStats?.({ ...stats })
        let fireIn = 1.5
        let telegraph = 0
        let shake = 0
        let remoteHit = 0

        const resetTraining = () => {
            for (const b of bolts) scene.remove(b.mesh, b.glow)
            bolts.length = 0
            fireIn = 1.6
            telegraph = 0
            stats = { blocks: 0, streak: 0, best: readBest(), returns: 0 }
            report()
        }
        api.current.resetTraining = resetTraining

        // ---------- holding the saber ----------
        const pointer = new THREE.Vector2(0, 0.1)
        const smooth = new THREE.Vector2(0, 0.1)
        const cursorRay = new THREE.Raycaster()
        let swingVel = 0
        const root = rootRef.current
        const onMove = (e) => {
            const rect = mount.getBoundingClientRect()
            pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
        }
        root.addEventListener("pointermove", onMove)
        root.addEventListener("pointerdown", onMove)
        // holding on, for bleeding the crystal
        const onHoldStart = (e) => {
            if (e.target.closest?.("button")) return
            holding = true
        }
        const onHoldEnd = () => (holding = false)
        const onHoldKey = (e) => {
            if (e.key !== " " || props.current.mode !== "bleed") return
            e.preventDefault()
            holding = e.type === "keydown"
        }
        root.addEventListener("pointerdown", onHoldStart)
        window.addEventListener("pointerup", onHoldEnd)
        window.addEventListener("pointercancel", onHoldEnd)
        window.addEventListener("keydown", onHoldKey)
        window.addEventListener("keyup", onHoldKey)

        const resize = () => {
            const w = mount.clientWidth
            const h = mount.clientHeight
            if (!w || !h) return
            gl.resize(w, h)
            camera.aspect = w / h
            camera.fov = w / h < 1 ? 78 : 55
            camera.updateProjectionMatrix()
        }
        const observer = new ResizeObserver(resize)
        observer.observe(mount)
        resize()

        // the markers you sense through the blast shield
        const senseLayer = senseRef.current
        const senseMarker = () => {
            const el = document.createElement("span")
            el.className = "saber-sense"
            senseLayer.appendChild(el)
            return el
        }

        let spread = 1
        let lastMode = null
        let modeT = 0
        let assembledSent = false
        let lastHilt = null
        let lastFinish = null
        let lastCrystal = null
        const tPos = new THREE.Vector3()
        const tQuat = new THREE.Quaternion()
        const Y = new THREE.Vector3(0, 1, 0)
        const dir = new THREE.Vector3()
        const base = new THREE.Vector3()
        const tip = new THREE.Vector3()
        const lastTip = new THREE.Vector3()
        const toCam = new THREE.Vector3()
        const xAxis = new THREE.Vector3()
        const zAxis = new THREE.Vector3()
        const basis = new THREE.Matrix4()
        const seg = new THREE.Vector3()
        const rel = new THREE.Vector3()
        const displayQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2)
        const spinQuat = new THREE.Quaternion()
        const dist = (p) => {
            seg.copy(tip).sub(base)
            const k = THREE.MathUtils.clamp(rel.copy(p).sub(base).dot(seg) / seg.lengthSq(), 0, 1)
            return rel.copy(base).addScaledVector(seg, k).distanceTo(p)
        }

        let last = performance.now()
        let frame
        const tick = (now) => {
            frame = requestAnimationFrame(tick)
            const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
            gl.frame(dt)
            last = now
            const t = now / 1000
            const P = props.current

            if (P.hilt !== lastHilt || P.finish !== lastFinish) {
                lastHilt = P.hilt
                lastFinish = P.finish
                rebuild(P.hilt, P.finish)
            }
            if (P.crystal !== lastCrystal) {
                lastCrystal = P.crystal
                setCrystal(P.crystal)
            }
            if (P.mode !== lastMode) {
                const was = lastMode
                lastMode = P.mode
                modeT = 0
                const wield = P.mode === "lit" || P.mode === "train"
                if (wield && !lit) {
                    lit = true
                    sound.ignite()
                } else if (!wield && lit) {
                    lit = false
                    sound.retract()
                }
                if (P.mode === "assemble") assembledSent = false
                if (P.mode === "build") spread = Math.max(spread, 0.001)
                if (P.mode === "train" && was !== "train") resetTraining()
                remote.visible = P.mode === "train"
                if (P.mode !== "train") {
                    for (const b of bolts) {
                        scene.remove(b.mesh, b.glow)
                        b.sense?.remove()
                    }
                    bolts.length = 0
                }
            }
            modeT += dt
            const mode = P.mode
            const wield = mode === "lit" || mode === "train"
            uTime.value = t
            if (embers) {
                const ep = embers.geometry.attributes.position.array
                for (let i = 0; i < ep.length; i += 3) {
                    ep[i + 1] += dt * (0.6 + (i % 7) * 0.12)
                    ep[i] += Math.sin(t + i) * dt * 0.15
                    if (ep[i + 1] > 9) ep[i + 1] = -3
                }
                embers.geometry.attributes.position.needsUpdate = true
            }

            // bleeding the crystal: anger in while you hold, healing when you let go
            bleedGroup.visible = mode === "bleed"
            hiltRoot.visible = mode !== "bleed"
            if (mode === "bleed") {
                if (modeT < dt * 1.5) {
                    bleed = 0
                    bledSent = false
                }
                if (!bledSent) bleed = THREE.MathUtils.clamp(bleed + (holding ? dt / 4.5 : -dt * 0.22), 0, 1)
                const k = bleed * bleed * (3 - 2 * bleed)
                bleedNow.copy(bleedFrom).lerp(bleedTo, k)
                bleedMat.color.copy(bleedNow)
                bleedMat.emissive.copy(bleedNow)
                const quiver = holding && !reduceMotion ? bleed : 0
                bleedMat.emissiveIntensity = 1 + bleed * 2 + Math.sin(t * 30) * 0.4 * quiver
                crackMat.opacity = Math.pow(bleed, 0.7) * (0.6 + Math.random() * 0.4 * quiver)
                bleedGlow.material.color.copy(bleedNow)
                bleedGlow.scale.setScalar(0.35 + bleed * 0.4)
                bleedLight.color.copy(bleedNow)
                bleedLight.intensity = 1.5 + bleed * 4
                bleedShape.rotation.y += dt * (0.4 + bleed * 2.5)
                cracks.rotation.y = bleedShape.rotation.y
                bleedGroup.position.set((Math.random() - 0.5) * 0.006 * quiver, 0.03 + Math.sin(t * 1.2) * 0.008 + (Math.random() - 0.5) * 0.006 * quiver, -0.62)
                // your heart pounds faster; the crystal grinds against you
                heartIn -= dt
                if (heartIn <= 0) {
                    blip(48 + bleed * 20, "sine", 0.12 + bleed * 0.1, 0.18)
                    heartIn = 0.95 - bleed * 0.55
                }
                grindIn -= dt
                if (holding && grindIn <= 0 && !bledSent) {
                    noise(0.14, "bandpass", 180 + bleed * 900, 90, 0.03 + bleed * 0.08)
                    grindIn = 0.12
                }
                bleedReport -= dt
                if (bleedReport <= 0) {
                    bleedReport = 0.08
                    P.onBleed?.(bleed)
                }
                if (bleed >= 1 && !bledSent) {
                    bledSent = true
                    spark(bleedGroup.position, 0xff3a2a, 0.9)
                    spark(bleedGroup.position, 0xffffff, 0.4)
                    noise(1.2, "lowpass", 2400, 60, 0.45)
                    P.onBled?.()
                }
            }

            // the parts come together, one after another, each landing with a click
            if (mode === "assemble") {
                const k = Math.max(0, 1 - modeT / 1.7)
                for (const mark of [0.75, 0.5, 0.25]) if (spread > mark && k <= mark) blip(1400 + mark * 800, "square", 0.025, 0.05)
                spread = k
                if (k === 0 && !assembledSent) {
                    assembledSent = true
                    blip(700, "triangle", 0.06, 0.25)
                    P.onAssembled?.()
                }
                built.parts.forEach((p, i) => {
                    const own = THREE.MathUtils.clamp(k * 1.3 - i * 0.1, 0, 1)
                    placePart(p, built.pivot, own * own * (3 - 2 * own), t, i)
                })
            } else {
                spread += ((mode === "build" ? 1 : 0) - spread) * Math.min(1, dt * (mode === "build" ? 3 : 6))
                built.parts.forEach((p, i) => placePart(p, built.pivot, spread, t, i))
            }

            // the crystal floats between the parts, then sinks into its chamber
            const floatK = mode === "assemble" ? Math.max(0, 1 - modeT / 1.1) : spread
            kyber.position.set(0.05 * floatK, built.chamber + Math.sin(t * 1.5) * 0.008 * floatK, 0.06 * floatK)
            kyber.rotation.y = t * 1.2
            kyber.visible = floatK > 0.02 || mode === "build"
            kyberGlow.position.copy(kyber.position)
            kyberGlow.material.opacity = 0.7 * Math.min(1, floatK * 3 + (wield ? 0 : 0.15))
            kyberLight.position.copy(kyber.position)
            kyberLight.intensity = 0.4 * floatK

            // where the hilt should be: turning in front of you, or held in your hand
            smooth.lerp(pointer, Math.min(1, dt * 14))
            let followRate = 5
            if (wield) {
                const before = prevTip.copy(tip)
                // the blade passes through the point under the pointer, leaning the way you swing
                cursorRay.setFromCamera(smooth, camera)
                const toPlane = (PLANE - cursorRay.ray.origin.z) / cursorRay.ray.direction.z
                const through = throughV.copy(cursorRay.ray.origin).addScaledVector(cursorRay.ray.direction, toPlane)
                const vx = (pointer.x - smooth.x) / Math.max(dt, 0.001)
                swingVel += (vx - swingVel) * Math.min(1, dt * 8)
                const tiltAngle = THREE.MathUtils.clamp(smooth.x * 0.7 + swingVel * 0.012, -1.3, 1.3)
                dir.set(Math.sin(tiltAngle), Math.cos(tiltAngle), -0.12).normalize()
                tQuat.setFromUnitVectors(Y, dir)
                const hand = through.addScaledVector(dir, -(BLADE * 0.3 + built.length - built.grip))
                tPos.copy(hand).addScaledVector(dir, -built.grip)
                followRate = modeT < 0.7 ? 6 : 22
                lastTip.copy(before)
            } else {
                // lying across the view, turning on its own axis
                spinQuat.setFromAxisAngle(Y, reduceMotion ? 0.6 : t * 0.5)
                tQuat.copy(displayQuat).multiply(spinQuat)
                tPos.set(0, 0.02, -0.68)
            }
            // on display the hilt turns about its middle; in the hand, about the grip
            inner.position.y += ((wield ? 0 : -built.length / 2) - inner.position.y) * Math.min(1, dt * followRate)
            hiltRoot.position.lerp(tPos, Math.min(1, dt * followRate))
            hiltRoot.quaternion.slerp(tQuat, Math.min(1, dt * followRate))
            hiltRoot.updateMatrixWorld()

            // the blade: grows out of the emitter on ignition, shrinks back on retract
            bladeLen += ((wield ? BLADE : 0) - bladeLen) * Math.min(1, dt * (wield ? 14 : 10))
            if (bladeLen < 0.003) bladeLen = wield ? bladeLen : 0
            emitterTip.getWorldPosition(base)
            dir.copy(Y).applyQuaternion(hiltRoot.quaternion)
            tip.copy(base).addScaledVector(dir, bladeLen)
            const show = bladeLen > 0.004
            blade.visible = halo.visible = show
            if (show) {
                const mid = midV.copy(base).lerp(tip, 0.5)
                toCam.copy(camera.position).sub(mid).normalize()
                xAxis.crossVectors(dir, toCam).normalize()
                zAxis.crossVectors(xAxis, dir).normalize()
                basis.makeBasis(xAxis, dir, zAxis)
                for (const [mesh, mat] of [[blade, bladeCore], [halo, bladeHalo]]) {
                    const w = mat.uniforms.uWidth.value
                    mesh.position.copy(base)
                    mesh.quaternion.setFromRotationMatrix(basis)
                    mesh.scale.set(w, bladeLen + w / 2, 1)
                    mat.uniforms.uLen.value = bladeLen
                    mat.uniforms.uFlicker.value = reduceMotion ? 1 : 0.94 + Math.random() * 0.06
                }
                bladeLight.position.copy(mid)
                bladeLight.intensity = 2.2 * (bladeLen / BLADE)
            } else bladeLight.intensity = 0

            // the hum follows the swing
            const tipSpeed = wield ? tip.distanceTo(lastTip) / Math.max(dt, 0.001) : 0
            sound.swing(tipSpeed / 5)
            // the trail's history is a ring of reused vectors: the newest goes in where the oldest was
            const slot = history.pop() ?? [new THREE.Vector3(), new THREE.Vector3()]
            slot[0].copy(base)
            slot[1].copy(tip)
            history.unshift(slot)
            if (historyFill < TRAIL) historyFill++
            while (history.length < TRAIL) history.push([base.clone(), tip.clone()])
            const trailOn = show && historyFill === TRAIL
            trail.visible = trailOn
            if (trailOn) {
                const k = Math.min(1, tipSpeed / 4)
                history.forEach(([b, tp], i) => {
                    // the trail hugs the outer part of the blade
                    const inner2 = midV.copy(b).lerp(tp, 0.35)
                    trailPos[i * 6] = inner2.x
                    trailPos[i * 6 + 1] = inner2.y
                    trailPos[i * 6 + 2] = inner2.z
                    trailPos[i * 6 + 3] = tp.x
                    trailPos[i * 6 + 4] = tp.y
                    trailPos[i * 6 + 5] = tp.z
                    const fadeA = (1 - i / (TRAIL - 1)) * 0.35 * k
                    trailAlpha[i * 2] = 0
                    trailAlpha[i * 2 + 1] = fadeA
                })
                trailGeo.attributes.position.needsUpdate = trailGeo.attributes.alpha.needsUpdate = true
            }

            // ---------- training ----------
            if (mode === "train") {
                const rx = Math.sin(t * 0.63) * 0.65 + Math.sin(t * 1.7) * 0.12
                const ry = 0.12 + Math.sin(t * 1.05) * 0.22
                remote.position.set(rx, ry, REMOTE_Z + Math.sin(t * 0.4) * 0.2)
                remote.rotation.y = Math.sin(t * 0.8) * 0.6
                remote.rotation.x = Math.sin(t * 1.3) * 0.25
                if (remoteHit > 0) {
                    remoteHit -= dt
                    remote.position.x += Math.sin(t * 60) * 0.02 * remoteHit
                }
                const level = Math.min(stats.streak, 30)
                const warn = Math.max(0.24, 0.5 - level * 0.009)
                fireIn -= dt
                if (fireIn < warn && telegraph === 0) {
                    telegraph = 1
                    blip(1800, "sine", 0.02, 0.06)
                }
                eye.material.color.setRGB(telegraph ? 1 : 0.4, telegraph ? 0.22 : 0.06, telegraph ? 0.15 : 0.06)
                eyeGlow.material.opacity = telegraph ? 0.8 + Math.sin(t * 40) * 0.2 : 0.15
                if (fireIn <= 0) {
                    telegraph = 0
                    fireIn = Math.max(0.6, 1.7 - level * 0.04) * (0.8 + Math.random() * 0.4)
                    const shots = level >= 12 && Math.random() < 0.3 ? 2 : 1
                    for (let s = 0; s < shots; s++) {
                        const from = remote.position.clone()
                        const cross = new THREE.Vector3((Math.random() - 0.5) * 0.9, -0.28 + Math.random() * 0.62, PLANE)
                        const speed = 2 + level * 0.05
                        const vel = cross.clone().sub(from).normalize().multiplyScalar(speed)
                        const mesh = new THREE.Mesh(boltGeo, boltMat)
                        mesh.position.copy(from)
                        const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff4030, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }))
                        glow.scale.setScalar(0.09)
                        scene.add(mesh, glow)
                        bolts.push({ mesh, glow, vel, cross, back: false, delay: s * 0.22, sense: null })
                    }
                    blip(980, "square", 0.03, 0.08)
                }
            } else eyeGlow.material.opacity = 0

            for (let i = bolts.length - 1; i >= 0; i--) {
                const b = bolts[i]
                if (b.delay > 0) {
                    b.delay -= dt
                    b.mesh.position.copy(remote.position)
                    b.glow.position.copy(remote.position)
                    continue
                }
                const prevZ = b.mesh.position.z
                const prev = prevBolt.copy(b.mesh.position)
                b.mesh.position.addScaledVector(b.vel, dt)
                b.mesh.lookAt(lookV.copy(b.mesh.position).add(b.vel))
                b.glow.position.copy(b.mesh.position)
                let gone = false

                // through the blast shield you feel where it will cross, a moment before it does
                if (!P.shield && b.sense) {
                    b.sense.remove()
                    b.sense = null
                }
                if (P.shield && !b.back) {
                    const left = (PLANE - b.mesh.position.z) / b.vel.z
                    if (left < 0.42 && left > 0) {
                        b.sense ??= senseMarker()
                        const s = lookV.copy(b.cross).project(camera)
                        b.sense.style.transform = `translate(${((s.x + 1) / 2) * mount.clientWidth}px, ${((1 - s.y) / 2) * mount.clientHeight}px) scale(${0.5 + left * 1.6})`
                        b.sense.style.opacity = String(1 - left / 0.42)
                    }
                }

                if (!b.back && prevZ < PLANE && b.mesh.position.z >= PLANE) {
                    // did it meet the blade where it crossed?
                    const k = (PLANE - prevZ) / (b.mesh.position.z - prevZ)
                    const at = prev.lerp(b.mesh.position, k)
                    b.sense?.remove()
                    b.sense = null
                    if (bladeLen > BLADE * 0.8 && dist(at) < 0.075) {
                        clash()
                        spark(at, 0xffffff, 0.2)
                        spark(at, 0xffc070, 0.32)
                        stats.blocks += 1
                        stats.streak += 1
                        if (stats.streak > stats.best) {
                            stats.best = stats.streak
                            try {
                                localStorage.setItem(BEST_KEY, String(stats.best))
                            } catch {
                                // can't remember it: fine
                            }
                        }
                        report()
                        // a clean deflection, near the middle of the blade, sends it back at the remote
                        const along = at.distanceTo(base) / BLADE
                        const aim = along > 0.25 && along < 0.75 && Math.random() < 0.55
                        const target = aim ? remote.position.clone() : remote.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.6, 0.4 + Math.random() * 0.6, 0))
                        b.vel = target.sub(at).normalize().multiplyScalar(b.vel.length() * 1.15)
                        b.back = true
                        b.homing = aim
                        b.mesh.position.copy(at)
                    }
                }
                if (b.back) {
                    // a clean return chases the remote as it dodges
                    if (b.homing) b.vel.copy(remote.position).sub(b.mesh.position).setLength(b.vel.length())
                    if (b.mesh.position.distanceTo(remote.position) < 0.11) {
                        gone = true
                        remoteHit = 0.5
                        spark(remote.position, 0xffd08a, 0.28)
                        blip(300, "sawtooth", 0.05, 0.2)
                        stats.returns += 1
                        report()
                    } else if (b.mesh.position.z < REMOTE_Z - 1.5 || b.mesh.position.y > 2.5) gone = true
                } else if (b.mesh.position.z > -0.25) {
                    // it got through: a sting
                    gone = true
                    zap()
                    shake = 0.35
                    stats.streak = 0
                    report()
                    const el = stingRef.current
                    if (el) {
                        el.classList.remove("is-on")
                        void el.offsetWidth
                        el.classList.add("is-on")
                    }
                }
                if (gone) {
                    scene.remove(b.mesh, b.glow)
                    b.glow.material.dispose()
                    b.sense?.remove()
                    bolts.splice(i, 1)
                }
            }

            for (let i = sparks.length - 1; i >= 0; i--) {
                const s = sparks[i]
                s.age += dt
                s.s.scale.setScalar(s.size * (0.5 + s.age * 4))
                s.s.material.opacity = Math.max(0, 1 - s.age / 0.3)
                if (s.age > 0.3) {
                    scene.remove(s.s)
                    s.s.material.dispose()
                    sparks.splice(i, 1)
                }
            }

            shake = Math.max(0, shake - dt)
            camera.position.set(reduceMotion ? 0 : (Math.random() - 0.5) * shake * 0.03, reduceMotion ? 0 : (Math.random() - 0.5) * shake * 0.03, 0)
            renderer.render(scene, camera)
        }
        gl.begin(scene, camera, () => (frame = requestAnimationFrame(tick)))

        return () => {
            cancelAnimationFrame(frame)
            observer.disconnect()
            root.removeEventListener("pointermove", onMove)
            root.removeEventListener("pointerdown", onMove)
            root.removeEventListener("pointerdown", onHoldStart)
            window.removeEventListener("pointerup", onHoldEnd)
            window.removeEventListener("pointercancel", onHoldEnd)
            window.removeEventListener("keydown", onHoldKey)
            window.removeEventListener("keyup", onHoldKey)
            sound.stop()
            senseLayer.replaceChildren()
            if (built) built.materials.forEach((m) => m.dispose())
            disposeScene(scene)
            glowTex.dispose()
            envMap.dispose()
            pmrem.dispose()
            renderer.dispose()
            renderer.domElement.remove()
        }
        // the setting is fixed for the life of the scene
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className={`saber ${mode === "lit" || mode === "train" ? "is-wielding" : ""}`} ref={rootRef}>
            <div className="saber-view" ref={mountRef} />
            <div className={`saber-shield ${shield && mode === "train" ? "is-down" : ""}`} aria-hidden="true" />
            <div className="saber-senses" ref={senseRef} aria-hidden="true" />
            <div className="saber-sting" ref={stingRef} aria-hidden="true" />
        </div>
    )
}

export default SaberForge
