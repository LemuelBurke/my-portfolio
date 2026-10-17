import { useEffect, useRef } from "react"
import * as THREE from "three"
import { disposeScene, paintGlow } from "./scenery"
import { createRenderer } from "./renderer"

/*
 * The briefing hologram in the Massassi temple: the battle station as a turning blue wireframe,
 * which walks through the attack plan as the briefing moves on. `beat` 0 shows the station; 1
 * brings in the starfighters; 2 traces the run down the trench to the exhaust port; 3 follows the
 * shaft down to the reactor; 4 sets off the reaction.
 */

const R = 1
const HOLO = 0x74d8ff

const lines = (pts) => new THREE.BufferGeometry().setFromPoints(pts)
const circle = (radius, y = 0, seg = 96, tilt = null) => {
    const pts = []
    for (let i = 0; i <= seg; i++) {
        const a = (i / seg) * Math.PI * 2
        const p = new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius)
        if (tilt) p.applyQuaternion(tilt)
        pts.push(p)
    }
    return pts
}

const DeathStarBriefing = ({ beat = 0 }) => {
    const mountRef = useRef(null)
    const beatRef = useRef(beat)
    useEffect(() => {
        beatRef.current = beat
    }, [beat])

    useEffect(() => {
        const mount = mountRef.current
        const gl = createRenderer(mount, { alpha: true, toneMapping: THREE.NoToneMapping })
        if (!gl) return
        const { renderer } = gl
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 100)
        const glowTex = paintGlow("rgba(255,255,255,1)", "rgba(255,255,255,0.3)")
        const mat = (opacity, color = HOLO) => new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false })

        const station = new THREE.Group()
        scene.add(station)
        // lines of latitude and longitude
        for (let i = 1; i < 12; i++) {
            const phi = (i / 12) * Math.PI
            station.add(new THREE.Line(lines(circle(Math.sin(phi) * R, Math.cos(phi) * R)), mat(0.22)))
        }
        for (let i = 0; i < 16; i++) {
            const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (i / 16) * Math.PI)
            const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2)
            station.add(new THREE.Line(lines(circle(R, 0, 96, q.multiply(tilt))), mat(0.16)))
        }
        // the equatorial trench, brighter
        const trench = new THREE.Line(lines(circle(R * 1.002)), mat(0.7))
        station.add(trench)
        // the dish, in the northern hemisphere
        const dishAt = new THREE.Vector3(0.45, 0.52, 0.72).normalize()
        const dishQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dishAt)
        for (const [r, o] of [[0.3, 0.6], [0.2, 0.35], [0.08, 0.5]]) {
            const pts = circle(r, 0, 48).map((p) => p.applyQuaternion(dishQ).add(dishAt.clone().multiplyScalar(Math.sqrt(1 - r * r) * R)))
            station.add(new THREE.Line(lines(pts), mat(o)))
        }
        // a faint shell so it reads as a sphere
        station.add(
            new THREE.Mesh(
                new THREE.SphereGeometry(R * 0.995, 48, 32),
                new THREE.ShaderMaterial({
                    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
                    fragmentShader: `varying vec3 vN; varying vec3 vV; void main(){ float r = pow(1.0 - abs(dot(vN, vV)), 2.5); gl_FragColor = vec4(0.45, 0.85, 1.0, r * 0.35); }`,
                    transparent: true,
                    depthWrite: false,
                    blending: THREE.AdditiveBlending,
                })
            )
        )

        // the attack: down the trench to the port, then the shaft to the core
        const PORT_A = 0.9
        const pathPts = []
        for (let i = 0; i <= 60; i++) {
            const a = -0.6 + (i / 60) * (PORT_A + 0.6)
            pathPts.push(new THREE.Vector3(Math.cos(a) * R * 1.03, 0, Math.sin(a) * R * 1.03))
        }
        const port = pathPts[pathPts.length - 1].clone()
        const runGeo = lines(pathPts)
        const run = new THREE.Line(runGeo, mat(1, 0xffc46b))
        station.add(run)
        const shaftGeo = lines(Array.from({ length: 31 }, (_, i) => port.clone().multiplyScalar(1 - i / 30)))
        const shaft = new THREE.Line(shaftGeo, mat(1, 0xffc46b))
        station.add(shaft)
        const portMark = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffc46b, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
        portMark.position.copy(port)
        portMark.scale.setScalar(0.12)
        station.add(portMark)
        const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffe0a8, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
        station.add(core)
        const blastRing = new THREE.Line(lines(circle(1, 0, 96)), mat(0, 0xffe0a8))
        scene.add(blastRing)

        // the starfighters closing in, as points with trails
        const fighters = Array.from({ length: 6 }, (_, i) => {
            const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff9a4a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
            s.scale.setScalar(0.06)
            scene.add(s)
            return { s, phase: i * 1.1 }
        })

        const resize = () => {
            const w = mount.clientWidth
            const h = mount.clientHeight
            if (!w || !h) return
            gl.resize(w, h)
            camera.aspect = w / h
            camera.updateProjectionMatrix()
        }
        const observer = new ResizeObserver(resize)
        observer.observe(mount)
        resize()

        let reveal = 0
        let shaftReveal = 0
        let boom = 0
        let shownBeat = -1
        let zoom = 0
        let last = performance.now()
        let frame
        const tick = (now) => {
            frame = requestAnimationFrame(tick)
            const dt = Math.min(0.05, (now - last) / 1000)
            gl.frame(dt)
            last = now
            const t = now / 1000
            const b = beatRef.current
            if (b !== shownBeat) {
                if (b < 4) boom = 0
                if (b < 2) reveal = 0
                if (b < 3) shaftReveal = 0
                shownBeat = b
            }
            if (b >= 2) reveal = Math.min(1, reveal + dt * 0.6)
            if (b >= 3 && reveal >= 1) shaftReveal = Math.min(1, shaftReveal + dt * 0.8)
            if (b >= 4 && shaftReveal >= 1) boom = Math.min(1, boom + dt * 0.5)
            runGeo.setDrawRange(0, Math.floor(reveal * 61))
            shaftGeo.setDrawRange(0, Math.floor(shaftReveal * 31))
            portMark.material.opacity = b >= 2 ? 0.6 + Math.sin(t * 6) * 0.4 : 0
            core.scale.setScalar(0.1 + boom * 2.2 + (b >= 3 ? Math.sin(t * 5) * 0.03 : 0))
            core.material.opacity = b >= 3 ? Math.max(0.3, 1 - boom * 0.6) : 0
            blastRing.scale.setScalar(0.4 + boom * 3)
            blastRing.material.opacity = boom > 0 ? Math.max(0, 1 - boom) : 0
            blastRing.rotation.x = 0.3

            // the station turns slowly, then holds still to show the plan
            const turn = b >= 2 ? -PORT_A + Math.PI / 2 - 0.35 : t * 0.15
            station.rotation.y += ((reduceMotion ? 0.4 : turn) - station.rotation.y) * Math.min(1, dt * (b >= 2 ? 1.2 : 8))
            station.visible = boom < 0.35 || Math.sin(t * 50) > 0
            station.scale.setScalar(1 - Math.max(0, boom - 0.3) * 0.8)

            zoom += ((b >= 2 && b < 4 ? 1 : 0) - zoom) * Math.min(1, dt * 1.5)
            camera.position.set(0, 0.9 - zoom * 0.5, 3.6 - zoom * 1.1)
            camera.lookAt(0, -zoom * 0.1, 0)

            fighters.forEach((f, i) => {
                const show = b === 1
                f.s.visible = show
                if (!show) return
                const k = ((t * 0.25 + f.phase * 0.17) % 1)
                const a = -1.2 + i * 0.12 + k * 0.6
                const r = 2.2 - k * 1.1
                f.s.position.set(Math.cos(a) * r, 0.1 + (i % 3) * 0.08, Math.sin(a) * r).applyAxisAngle(new THREE.Vector3(0, 1, 0), station.rotation.y)
            })

            renderer.render(scene, camera)
        }
        gl.begin(scene, camera, () => (frame = requestAnimationFrame(tick)))

        return () => {
            cancelAnimationFrame(frame)
            observer.disconnect()
            disposeScene(scene)
            glowTex.dispose()
            renderer.dispose()
            renderer.domElement.remove()
        }
    }, [])

    return <div className="briefing-holo" ref={mountRef} aria-hidden="true" />
}

export default DeathStarBriefing
