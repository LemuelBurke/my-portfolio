import { useEffect, useRef } from "react"
import * as THREE from "three"
import { bakeStatic, disposeScene, paintGlow, seeded } from "./scenery"
import { createRenderer } from "./renderer"

/*
 * Tatooine at dusk: two suns sinking over rolling dunes, the domes of Mos Eisley in the middle
 * distance, and a moisture vaporator standing in the sand nearby. The suns set slowly while you
 * watch; the view drifts a little with the pointer.
 */

const dune = (x, z) =>
    Math.sin(x * 0.045 + z * 0.02) * 4.5 + Math.sin(x * 0.11 - z * 0.07) * 2 + Math.sin(z * 0.09 + x * 0.03) * 3 + Math.sin(x * 0.3 + z * 0.21) * 0.4

const TatooineScene = () => {
    const mountRef = useRef(null)

    useEffect(() => {
        const mount = mountRef.current
        const gl = createRenderer(mount, { exposure: 1.05 })
        if (!gl) return
        const { renderer } = gl
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const rand = seeded(23)

        const scene = new THREE.Scene()
        scene.fog = new THREE.Fog(0xd98a5a, 60, 520)
        const camera = new THREE.PerspectiveCamera(48, 1, 0.5, 3000)

        // the sky: deep violet overhead to a burning orange at the horizon, brightest round the suns
        const sunDir = new THREE.Vector3(-0.35, 0.06, -1).normalize()
        const skyMat = new THREE.ShaderMaterial({
            side: THREE.BackSide,
            depthWrite: false,
            fog: false,
            uniforms: { uSun: { value: sunDir } },
            vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
            fragmentShader: `uniform vec3 uSun; varying vec3 vD;
                void main(){
                    float h = clamp(vD.y, -0.2, 1.0);
                    vec3 horizon = vec3(1.0, 0.52, 0.24);
                    vec3 mid = vec3(0.78, 0.36, 0.42);
                    vec3 top = vec3(0.16, 0.12, 0.32);
                    vec3 c = h < 0.12 ? mix(horizon, mid, smoothstep(-0.02, 0.12, h)) : mix(mid, top, smoothstep(0.12, 0.7, h));
                    float near = pow(max(0.0, dot(vD, uSun)), 8.0);
                    c += vec3(1.0, 0.62, 0.3) * near * 0.9;
                    gl_FragColor = vec4(c, 1.0);
                }`,
        })
        scene.add(new THREE.Mesh(new THREE.SphereGeometry(1500, 48, 24), skyMat))

        // the twin suns
        const glowTex = paintGlow("rgba(255,250,235,1)", "rgba(255,190,110,0.5)")
        const suns = [
            { size: 70, color: 0xfff1d0, offset: new THREE.Vector3(0, 0, 0) },
            { size: 48, color: 0xffd09a, offset: new THREE.Vector3(70, -22, 0) },
        ].map((s) => {
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: s.color, transparent: true, depthWrite: false, depthTest: false, fog: false, blending: THREE.AdditiveBlending }))
            sprite.scale.setScalar(s.size * 3.2)
            sprite.renderOrder = 1
            const disc = new THREE.Mesh(new THREE.CircleGeometry(s.size * 0.3, 48), new THREE.MeshBasicMaterial({ color: 0xfffaf0, fog: false, toneMapped: false }))
            disc.renderOrder = 2
            scene.add(sprite, disc)
            return { ...s, sprite, disc }
        })

        // light from the low suns, warm and raking across the sand
        scene.add(new THREE.HemisphereLight(0xc8a0c8, 0x8a5030, 0.55))
        const sunLight = new THREE.DirectionalLight(0xffb070, 2.4)
        scene.add(sunLight)

        // the dunes
        const ground = new THREE.PlaneGeometry(1400, 1400, 220, 220).rotateX(-Math.PI / 2)
        const gp = ground.attributes.position
        for (let i = 0; i < gp.count; i++) {
            const x = gp.getX(i)
            const z = gp.getZ(i)
            gp.setY(i, dune(x, z) * (0.6 + Math.min(1, Math.hypot(x, z) / 200)))
        }
        ground.computeVertexNormals()
        scene.add(new THREE.Mesh(ground, new THREE.MeshStandardMaterial({ color: 0xd59a62, roughness: 1, metalness: 0 })))

        // Mos Eisley: a sprawl of domes and squat towers
        const adobe = new THREE.MeshStandardMaterial({ color: 0xc9a27a, roughness: 0.95 })
        const town = new THREE.Group()
        for (let i = 0; i < 34; i++) {
            const r = 3 + rand() * 9
            const x = (rand() - 0.5) * 160
            const z = (rand() - 0.5) * 50
            const domeMesh = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), adobe)
            domeMesh.position.set(x, 0, z)
            domeMesh.scale.y = 0.55 + rand() * 0.4
            town.add(domeMesh)
            if (rand() < 0.35) {
                const tower = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.35, r * 0.45, r * 1.4, 12), adobe)
                tower.position.set(x + r * 0.6, r * 0.7, z)
                town.add(tower)
            }
        }
        // the big docking bay ring
        const bay = new THREE.Mesh(new THREE.TorusGeometry(16, 4, 8, 32, Math.PI * 1.7), adobe)
        bay.rotation.x = -Math.PI / 2
        bay.position.set(30, 1, 6)
        town.add(bay)
        town.position.set(60, dune(60, -260) - 1, -260)
        scene.add(bakeStatic(town))

        // a moisture vaporator in the foreground
        const metal = new THREE.MeshStandardMaterial({ color: 0xb8ae9e, metalness: 0.5, roughness: 0.5, emissive: 0x2a1810 })
        const vap = new THREE.Group()
        vap.add(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 6, 12).translate(0, 3, 0), metal))
        for (const y of [1.2, 2.6, 4.4]) vap.add(new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.25, 16).translate(0, y, 0), metal))
        for (let i = 0; i < 3; i++) {
            const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.2, 0.9), metal)
            fin.position.set(Math.cos((i / 3) * Math.PI * 2) * 0.45, 5.4, Math.sin((i / 3) * Math.PI * 2) * 0.45)
            fin.rotation.y = -(i / 3) * Math.PI * 2
            vap.add(fin)
        }
        vap.position.set(-24, dune(-24, -60) - 0.2, -60)
        scene.add(vap)

        // wind-blown sand in the air
        const dustCount = 400
        const dp = new Float32Array(dustCount * 3)
        for (let i = 0; i < dustCount; i++) dp.set([(rand() - 0.5) * 120, rand() * 12, -10 - rand() * 120], i * 3)
        const dustGeo = new THREE.BufferGeometry()
        dustGeo.setAttribute("position", new THREE.BufferAttribute(dp, 3))
        scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xffd8a8, size: 0.25, map: glowTex, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending })))

        const pointer = new THREE.Vector2()
        const onMove = (e) => {
            const rect = mount.getBoundingClientRect()
            pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
        }
        window.addEventListener("pointermove", onMove)

        const resize = () => {
            const w = mount.clientWidth
            const h = mount.clientHeight
            if (!w || !h) return
            gl.resize(w, h)
            camera.aspect = w / h
            camera.fov = w / h < 1 ? 70 : 48
            camera.updateProjectionMatrix()
        }
        const observer = new ResizeObserver(resize)
        observer.observe(mount)
        resize()

        const look = new THREE.Vector2()
        const start = performance.now()
        let last = start
        let frame
        const tick = (now) => {
            frame = requestAnimationFrame(tick)
            const dt = Math.min(0.05, (now - last) / 1000)
            gl.frame(dt)
            last = now
            const elapsed = (now - start) / 1000

            // the suns sink, very slowly
            const sink = reduceMotion ? 0 : Math.min(1, elapsed / 90)
            const base = new THREE.Vector3(-0.35, 0.075 - sink * 0.07, -1).normalize()
            skyMat.uniforms.uSun.value.copy(base)
            for (const s of suns) {
                const p = base.clone().multiplyScalar(1200).add(s.offset)
                s.sprite.position.copy(p)
                s.disc.position.copy(p)
                s.disc.lookAt(0, 0, 0)
            }
            sunLight.position.copy(base).multiplyScalar(100)
            sunLight.intensity = 2.4 - sink * 1.2

            if (!reduceMotion) {
                for (let i = 0; i < dustCount; i++) {
                    dp[i * 3] += dt * 3
                    if (dp[i * 3] > 60) dp[i * 3] = -60
                }
                dustGeo.attributes.position.needsUpdate = true
            }

            look.lerp(pointer, Math.min(1, dt * 2))
            camera.position.set(look.x * 2, 7 + look.y * 0.8, 0)
            camera.lookAt(-30 + look.x * 12, 6 + look.y * 3, -200)
            renderer.render(scene, camera)
        }
        gl.begin(scene, camera, () => (frame = requestAnimationFrame(tick)))

        return () => {
            cancelAnimationFrame(frame)
            observer.disconnect()
            window.removeEventListener("pointermove", onMove)
            disposeScene(scene)
            glowTex.dispose()
            renderer.dispose()
            renderer.domElement.remove()
        }
    }, [])

    return <div className="tatooine-view" ref={mountRef} aria-hidden="true" />
}

export default TatooineScene
