import { useEffect, useRef } from "react"
import * as THREE from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import { CRYSTALS } from "./ilumContent"
import { chime } from "./sound"
import { disposeScene, paintGlow, seeded } from "./scenery"
import { createRenderer } from "./renderer"

/*
 * The crystal caves of Ilum, in three.js: a tunnel of faceted blue ice running away into the dark,
 * hung with icicles and studded with kyber crystals. Most of the crystals lie dormant; a few glow
 * and pulse, calling out, each in its own colour and with its own note. Point at one to hear it;
 * click it to take it, and it floats out of the ice towards you.
 *
 * Props: onHover(id | null), onPick(id), picked (the chosen crystal's id, once chosen).
 */

// Where the calling crystals sit: an angle round the tunnel wall (0 is to the right, going
// anticlockwise) and how far along it
const CALLING = {
    blue: { angle: 205, z: -4.2 },
    green: { angle: -25, z: -5 },
    purple: { angle: 62, z: -6.4 },
    yellow: { angle: 128, z: -8 },
}
const WALL = 2.35

// A rough, repeatable ripple, for shaping the ice
const ripple = (x, y, z) =>
    Math.sin(x * 1.3 + z * 0.7) * 0.5 + Math.sin(y * 2.1 - z * 1.1) * 0.3 + Math.sin((x + y) * 3.7 + z * 2.3) * 0.15 + Math.sin(z * 0.45) * 0.25

const shardGeo = new THREE.OctahedronGeometry(1, 0)

// A cluster of crystal shards growing out of the wall at `angle`/`z`, pointing into the tunnel
const buildCluster = (rand, angle, z, material, count, scale) => {
    const group = new THREE.Group()
    const a = (angle * Math.PI) / 180
    group.position.set(Math.cos(a) * WALL, Math.sin(a) * WALL, z)
    const inward = new THREE.Vector3(-Math.cos(a), -Math.sin(a), 0)
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), inward)
    const shards = []
    for (let i = 0; i < count; i++) {
        const shard = new THREE.Mesh(shardGeo, material)
        const s = scale * (i === 0 ? 1 : 0.45 + rand() * 0.45)
        shard.scale.set(0.055 * s, 0.26 * s, 0.055 * s)
        shard.position.set((rand() - 0.5) * 0.22 * scale, 0.1 * s, (rand() - 0.5) * 0.22 * scale)
        shard.rotation.set((rand() - 0.5) * 0.9, rand() * Math.PI, (rand() - 0.5) * 0.9)
        if (i === 0) shard.rotation.set(0, rand(), 0)
        group.add(shard)
        shards.push(shard)
    }
    return { group, shards }
}

const KyberCave = ({ onHover, onPick, picked = null }) => {
    const mountRef = useRef(null)
    const callbacks = useRef({ onHover, onPick })
    const pickedRef = useRef(picked)
    useEffect(() => {
        callbacks.current = { onHover, onPick }
    }, [onHover, onPick])
    useEffect(() => {
        pickedRef.current = picked
    }, [picked])

    useEffect(() => {
        const mount = mountRef.current
        const gl = createRenderer(mount, {})
        if (!gl) return
        const { renderer } = gl
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const rand = seeded(5)

        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x02060d)
        scene.fog = new THREE.FogExp2(0x02060e, 0.13)
        // something for the ice to reflect
        const pmrem = new THREE.PMREMGenerator(renderer)
        const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
        scene.environment = envMap
        scene.environmentIntensity = 0.18
        const camera = new THREE.PerspectiveCamera(62, 1, 0.05, 80)

        scene.add(new THREE.HemisphereLight(0x5f8fc6, 0x05080e, 0.12))
        // daylight leaking in far down the tunnel
        const exit = new THREE.PointLight(0xcfe6ff, 14, 30, 1.6)
        exit.position.set(0, 0.3, -24)
        scene.add(exit)
        const near = new THREE.PointLight(0x8fc4ff, 0.8, 6, 1.8)
        near.position.set(0, 0.6, 0.5)
        scene.add(near)

        // the tunnel: a long tube of ice, its wall rippled and faceted
        const tube = new THREE.CylinderGeometry(3, 3, 36, 64, 72, true).rotateX(Math.PI / 2).translate(0, 0, -14)
        const p = tube.attributes.position
        const v = new THREE.Vector3()
        for (let i = 0; i < p.count; i++) {
            v.fromBufferAttribute(p, i)
            const k = 1 + 0.14 * ripple(v.x, v.y, v.z) + (Math.sin(i * 12.9898) * 43758.5453 % 1) * 0.03
            p.setXYZ(i, v.x * k, v.y * k * 0.86, v.z)
        }
        tube.computeVertexNormals()
        const ice = new THREE.MeshStandardMaterial({ color: 0x5f86a8, roughness: 0.32, metalness: 0.05, flatShading: true, side: THREE.BackSide, emissive: 0x050c16 })
        scene.add(new THREE.Mesh(tube, ice))

        // icicles hanging into the tunnel
        const icicleGeo = new THREE.ConeGeometry(0.1, 1, 5).translate(0, -0.5, 0)
        const icicles = new THREE.InstancedMesh(icicleGeo, new THREE.MeshStandardMaterial({ color: 0x9cc0dc, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.75, flatShading: true }), 140)
        const m = new THREE.Matrix4()
        const q = new THREE.Quaternion()
        const down = new THREE.Vector3(0, -1, 0)
        for (let i = 0; i < 140; i++) {
            const a = Math.PI * (0.15 + rand() * 0.7) + (rand() < 0.3 ? Math.PI : 0)
            const z = -1.5 - rand() * 22
            const at = new THREE.Vector3(Math.cos(a) * 2.45, Math.sin(a) * 2.2, z)
            // pointing in towards the middle of the tunnel, drooping downwards
            const inward = new THREE.Vector3(-Math.cos(a), -Math.sin(a), 0).lerp(down, 0.5).normalize()
            q.setFromUnitVectors(down, inward)
            const s = 0.25 + rand() * 0.6
            m.compose(at, q, new THREE.Vector3(s * (0.6 + rand() * 0.5), s, s * (0.6 + rand() * 0.5)))
            icicles.setMatrixAt(i, m)
        }
        scene.add(icicles)

        // dormant crystals, scattered through the ice
        const dormant = new THREE.MeshStandardMaterial({ color: 0x8fb0cc, roughness: 0.1, metalness: 0.2, emissive: 0x1a2c44, emissiveIntensity: 0.6, transparent: true, opacity: 0.85 })
        // (laid out as clusters, then drawn as one instanced mesh: a single draw call for them all)
        const dormantShards = []
        for (let i = 0; i < 46; i++) {
            const { group, shards } = buildCluster(rand, rand() * 360, 0.5 - rand() * 20, dormant, 2 + Math.floor(rand() * 4), 0.6 + rand() * 0.8)
            group.updateMatrixWorld(true)
            for (const shard of shards) dormantShards.push(shard.matrixWorld.clone())
        }
        const dormantMesh = new THREE.InstancedMesh(shardGeo, dormant, dormantShards.length)
        dormantShards.forEach((matrix, i) => dormantMesh.setMatrixAt(i, matrix))
        scene.add(dormantMesh)

        // the crystals that call out
        const glowTex = paintGlow("rgba(255,255,255,1)", "rgba(255,255,255,0.3)")
        const calling = CRYSTALS.map((c) => {
            const color = new THREE.Color(c.blade)
            const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.4, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.95 })
            const spot = CALLING[c.id]
            const cluster = buildCluster(rand, spot.angle, spot.z, mat, 7, 2.1)
            scene.add(cluster.group)
            const light = new THREE.PointLight(color, 3, 3.6, 1.8)
            light.position.set(0, 0.35, 0)
            cluster.group.add(light)
            const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }))
            glow.position.set(0, 0.25, 0)
            glow.scale.setScalar(1.8)
            cluster.group.add(glow)
            const hit = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), new THREE.MeshBasicMaterial({ visible: false }))
            hit.position.y = 0.2
            hit.userData.id = c.id
            cluster.group.add(hit)
            return { c, ...cluster, mat, light, glow, hit, phase: rand() * 6, hover: 0, hero: cluster.shards[0], lift: 0 }
        })

        // drifting motes of ice in the air
        const moteCount = 700
        const motePos = new Float32Array(moteCount * 3)
        for (let i = 0; i < moteCount; i++) motePos.set([(rand() - 0.5) * 4.4, (rand() - 0.5) * 3.6, 1 - rand() * 20], i * 3)
        const moteGeo = new THREE.BufferGeometry()
        moteGeo.setAttribute("position", new THREE.BufferAttribute(motePos, 3))
        const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({ color: 0xcfe8ff, size: 0.025, map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
        scene.add(motes)

        // ---------- pointing and choosing ----------
        const raycaster = new THREE.Raycaster()
        const pointer = new THREE.Vector2()
        const look = new THREE.Vector2()
        let hovered = null
        const canvas = renderer.domElement
        const pick = (e) => {
            const rect = canvas.getBoundingClientRect()
            pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
            look.copy(pointer)
            raycaster.setFromCamera(pointer, camera)
            return raycaster.intersectObjects(calling.map((k) => k.hit), false)[0]?.object.userData.id ?? null
        }
        const onMove = (e) => {
            if (pickedRef.current) return
            const id = pick(e)
            if (id !== hovered) {
                hovered = id
                canvas.style.cursor = id ? "pointer" : ""
                callbacks.current.onHover?.(id)
                if (id) chime(CRYSTALS.find((c) => c.id === id).hz, 0.045)
            }
        }
        const onClick = (e) => {
            if (pickedRef.current) return
            const id = pick(e)
            if (id) callbacks.current.onPick?.(id)
        }
        canvas.addEventListener("pointermove", onMove)
        canvas.addEventListener("click", onClick)

        const resize = () => {
            const w = mount.clientWidth
            const h = mount.clientHeight
            if (!w || !h) return
            gl.resize(w, h)
            camera.aspect = w / h
            camera.fov = w / h < 1 ? 82 : 62
            camera.updateProjectionMatrix()
        }
        const observer = new ResizeObserver(resize)
        observer.observe(mount)
        resize()

        // where a taken crystal floats to: just in front of you
        const held = new THREE.Vector3(0, -0.02, -1.25)
        const tmp = new THREE.Vector3()
        let last = performance.now()
        let frame
        const tick = (now) => {
            frame = requestAnimationFrame(tick)
            const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
            gl.frame(dt)
            last = now
            const t = now / 1000
            const chosen = pickedRef.current

            // you look about a little as you move the pointer, breathing gently
            const sway = reduceMotion ? 0 : Math.sin(t * 0.5) * 0.012
            camera.rotation.set(look.y * 0.12 + sway, -look.x * 0.2, 0, "YXZ")
            camera.position.set(0, Math.sin(t * 0.7) * (reduceMotion ? 0 : 0.015), 0)

            for (const k of calling) {
                const isChosen = chosen === k.c.id
                k.hover += ((hovered === k.c.id || isChosen ? 1 : 0) - k.hover) * Math.min(1, dt * 6)
                const pulse = reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin(t * 2.2 + k.phase)
                const dim = chosen && !isChosen ? 0.15 : 1
                k.mat.emissiveIntensity = (0.9 + pulse * 0.8 + k.hover * 1.4) * dim
                k.light.intensity = (1.4 + pulse * 1.2 + k.hover * 2.5) * dim
                k.glow.material.opacity = (0.35 + pulse * 0.3 + k.hover * 0.4) * dim
                k.glow.scale.setScalar(1.5 + pulse * 0.5 + k.hover * 0.9)

                // the chosen crystal leaves the ice and floats to you, turning
                if (isChosen) {
                    if (k.lift === 0) {
                        const world = k.hero.getWorldPosition(new THREE.Vector3())
                        scene.attach(k.hero)
                        k.hero.position.copy(world)
                        k.from = world
                        k.light.removeFromParent()
                        k.glow.removeFromParent()
                        scene.add(k.light, k.glow)
                    }
                    k.lift = Math.min(1, k.lift + dt / 1.8)
                    const e = 1 - Math.pow(1 - k.lift, 3)
                    tmp.copy(k.from).lerp(held, e)
                    tmp.y += Math.sin(e * Math.PI) * 0.35 + Math.sin(t * 1.6) * 0.012 * e
                    k.hero.position.copy(tmp)
                    k.hero.rotation.set(0.25 * e, t * 0.9, 0)
                    k.hero.scale.set(0.1, 0.48, 0.1)
                    k.light.position.copy(tmp)
                    k.glow.position.copy(tmp)
                    k.glow.scale.setScalar(0.9 + pulse * 0.2)
                    k.light.intensity = 2.5 + pulse
                }
            }

            // the motes drift
            if (!reduceMotion) {
                for (let i = 0; i < moteCount; i++) {
                    motePos[i * 3 + 1] -= dt * 0.03
                    motePos[i * 3] += Math.sin(t * 0.3 + i) * dt * 0.02
                    if (motePos[i * 3 + 1] < -1.8) motePos[i * 3 + 1] = 1.8
                }
                moteGeo.attributes.position.needsUpdate = true
            }

            renderer.render(scene, camera)
        }
        gl.begin(scene, camera, () => (frame = requestAnimationFrame(tick)))

        return () => {
            cancelAnimationFrame(frame)
            observer.disconnect()
            canvas.removeEventListener("pointermove", onMove)
            canvas.removeEventListener("click", onClick)
            disposeScene(scene)
            glowTex.dispose()
            envMap.dispose()
            pmrem.dispose()
            renderer.dispose()
            canvas.remove()
        }
    }, [])

    return <div className="ilum-view" ref={mountRef} />
}

export default KyberCave
