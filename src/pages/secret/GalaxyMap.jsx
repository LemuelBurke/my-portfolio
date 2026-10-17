import { useEffect, useRef } from "react"
import * as THREE from "three"
import { CORUSCANT, DESTINATIONS, REGIONS, SIDES } from "./galaxyContent"
import { disposeScene, paintGlow, seeded } from "./scenery"
import { createRenderer } from "./renderer"

/*
 * The galaxy, as a holomap: a spiral of about a hundred thousand stars with a glowing core and
 * clouds of gas along the arms, the regions marked as rings out from the Core, and a pin standing
 * over each destination. Drag to turn it, scroll or pinch to zoom. Selecting a destination (by its
 * pin, or from the list beside the map) sweeps the view over to it and plots a course there from
 * Coruscant.
 *
 * The pins' labels are real buttons laid over the canvas, so they work with the keyboard too.
 * Props: selected (a destination id or null), onSelect(id), and `intro` to swoop in from afar.
 */

const R = 100 // the galaxy's radius, in map units

// Stars: a bulge at the core, four spiral arms, and a thin haze of stars between them. Written to
// run fast (it's on the way into the map): plain numbers and direct writes into the arrays, and the
// normal distribution drawn two values at a time. The arrays are kept, so coming back to the map
// from a destination doesn't build the galaxy all over again.
const starCache = new Map()
const buildStars = (count) => {
    const cached = starCache.get(count)
    if (cached) return cached()
    const rand = seeded(7)
    let spare = null
    const gauss = () => {
        if (spare !== null) {
            const g = spare
            spare = null
            return g
        }
        const u = rand() || 1e-9
        const v = rand()
        const m = Math.sqrt(-2 * Math.log(u))
        spare = m * Math.sin(2 * Math.PI * v)
        return m * Math.cos(2 * Math.PI * v)
    }
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const size = new Float32Array(count)
    const TAU = Math.PI * 2
    for (let i = 0; i < count; i++) {
        const kind = rand()
        let x, y, z
        if (kind < 0.16) {
            // the bulge, slightly barred
            const r = Math.abs(gauss()) * 8
            const a = rand() * TAU
            x = Math.cos(a) * r * 1.35
            z = Math.sin(a) * r * 0.8
            y = gauss() * 3.2 * Math.max(0.25, 1 - r / 22)
        } else if (kind < 0.88) {
            // the arms: logarithmic spirals, with stars scattered either side
            const r = 7 + Math.pow(rand(), 0.8) * (R - 7)
            const a = (i % 4) * (Math.PI / 2) + Math.log(r / 6) * 1.75 + gauss() * (0.1 + 2.5 / r)
            const rr = r + gauss() * 1.8
            x = Math.cos(a) * rr
            z = Math.sin(a) * rr
            y = gauss() * (0.6 + (1 - r / R) * 1.6)
        } else {
            // the haze in between
            const r = Math.sqrt(rand()) * R * 1.05
            const a = rand() * TAU
            x = Math.cos(a) * r
            z = Math.sin(a) * r
            y = gauss() * 1.2
        }
        const k = i * 3
        pos[k] = x
        pos[k + 1] = y
        pos[k + 2] = z
        // warm at the core, cooling to blue-white along the arms, with the odd pink nebula star or white giant
        let t = (Math.sqrt(x * x + z * z) / R - 0.08) / 0.47
        t = t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t)
        let cr = 1 - 0.38 * t
        let cg = 0.82 - 0.06 * t
        let cb = 0.58 + 0.42 * t
        const roll = rand()
        if (kind >= 0.16 && kind < 0.88 && roll < 0.035) {
            cr = 1
            cg = 0.45
            cb = 0.7
        } else if (roll > 0.985) cr = cg = cb = 1
        const bright = kind < 0.88 ? 0.6 + rand() * 0.6 : 0.3 + rand() * 0.3
        col[k] = cr * bright
        col[k + 1] = cg * bright
        col[k + 2] = cb * bright
        const s = rand()
        size[i] = 0.7 + s * s * s * s * 3.4 + (roll > 0.985 ? 1.6 : 0)
    }
    const make = () => {
        const geo = new THREE.BufferGeometry()
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3))
        geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3))
        geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1))
        return geo
    }
    starCache.set(count, make)
    return make()
}

// Clouds of glowing gas along the arms: a few hundred big, faint points
const buildNebulae = (count) => {
    const rand = seeded(11)
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const size = new Float32Array(count)
    const tints = [new THREE.Color(0.9, 0.35, 0.65), new THREE.Color(0.35, 0.5, 1.0), new THREE.Color(0.55, 0.4, 1.0), new THREE.Color(1.0, 0.7, 0.45)]
    for (let i = 0; i < count; i++) {
        const arm = i % 4
        const r = 10 + Math.pow(rand(), 0.9) * 82
        const a = (arm * Math.PI) / 2 + Math.log(r / 6) * 1.75 + (rand() - 0.5) * 0.22
        pos.set([Math.cos(a) * r, (rand() - 0.5) * 1.5, Math.sin(a) * r], i * 3)
        const tint = r < 22 ? tints[3] : tints[Math.floor(rand() * 3)]
        const k = 0.08 + rand() * 0.09
        col.set([tint.r * k, tint.g * k, tint.b * k], i * 3)
        size[i] = 18 + rand() * 34
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3))
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1))
    return geo
}

const pointsMaterial = (pixel, soft) =>
    new THREE.ShaderMaterial({
        uniforms: { uPixel: { value: pixel } },
        vertexShader: /* glsl */ `
            attribute float aSize;
            attribute vec3 aColor;
            uniform float uPixel;
            varying vec3 vColor;
            void main() {
                vec4 mv = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = min(aSize * uPixel * (260.0 / -mv.z), ${soft ? "420.0" : "48.0"});
                vColor = aColor;
                gl_Position = projectionMatrix * mv;
            }`,
        fragmentShader: /* glsl */ `
            varying vec3 vColor;
            void main() {
                float d = length(gl_PointCoord - 0.5) * 2.0;
                float a = ${soft ? "pow(max(0.0, 1.0 - d), 2.0)" : "pow(max(0.0, 1.0 - d), 3.0)"};
                gl_FragColor = vec4(vColor * a, a);
            }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    })

const ring = (radius, color, opacity, dashed = false) => {
    const pts = []
    for (let i = 0; i <= 256; i++) {
        const a = (i / 256) * Math.PI * 2
        pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius))
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    const mat = dashed
        ? new THREE.LineDashedMaterial({ color, transparent: true, opacity, dashSize: 1.2, gapSize: 1.6, depthWrite: false, blending: THREE.AdditiveBlending })
        : new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending })
    const line = new THREE.Line(geo, mat)
    if (dashed) line.computeLineDistances()
    return line
}

// The course from Coruscant: an arc lifted off the plane, drawn on as a running dash
const COURSE_SEGMENTS = 120
const courseMaterial = () =>
    new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uReveal: { value: 0 }, uColor: { value: new THREE.Color(0xffffff) } },
        vertexShader: `attribute float aT; varying float vT; void main(){ vT = aT; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform float uTime; uniform float uReveal; uniform vec3 uColor; varying float vT;
            void main(){
                if (vT > uReveal) discard;
                float dash = step(0.45, fract(vT * 34.0 - uTime * 1.6));
                gl_FragColor = vec4(uColor, (0.35 + 0.65 * dash) * 0.9);
            }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    })

const GalaxyMap = ({ selected, onSelect, intro = false }) => {
    const mountRef = useRef(null)
    const labelsRef = useRef(null)
    const selectedRef = useRef(selected)
    const onSelectRef = useRef(onSelect)
    useEffect(() => {
        selectedRef.current = selected
    }, [selected])
    useEffect(() => {
        onSelectRef.current = onSelect
    }, [onSelect])

    useEffect(() => {
        const mount = mountRef.current
        const labelLayer = labelsRef.current
        const gl = createRenderer(mount, { toneMapping: THREE.NoToneMapping })
        if (!gl) return
        const { renderer } = gl
        const pixel = renderer.getPixelRatio()
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        let small = window.innerWidth < 760

        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x010207)
        const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 4000)

        // everything that turns with the galaxy
        const galaxy = new THREE.Group()
        scene.add(galaxy)
        const starMat = pointsMaterial(pixel, false)
        const gasMat = pointsMaterial(pixel, true)
        galaxy.add(new THREE.Points(buildStars(small ? 70000 : 160000), starMat))
        galaxy.add(new THREE.Points(buildNebulae(small ? 360 : 640), gasMat))
        const glowTex = paintGlow("rgba(255,240,215,1)", "rgba(255,190,120,0.35)")
        const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 }))
        core.scale.setScalar(70)
        galaxy.add(core)
        const coreInner = core.clone()
        coreInner.material = core.material.clone()
        coreInner.scale.setScalar(22)
        galaxy.add(coreInner)

        // a few faraway stars all round, so the galaxy hangs in space
        const farGeo = new THREE.BufferGeometry()
        const far = new Float32Array(1500 * 3)
        const v = new THREE.Vector3()
        for (let i = 0; i < 1500; i++) {
            v.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize().multiplyScalar(1500)
            far.set([v.x, v.y, v.z], i * 3)
        }
        farGeo.setAttribute("position", new THREE.BufferAttribute(far, 3))
        scene.add(new THREE.Points(farGeo, new THREE.PointsMaterial({ color: 0x9fb2c8, size: 1.2, sizeAttenuation: false })))

        // the regions, as faint holographic rings, with their names
        const holo = 0x74d8ff
        const regionLabels = REGIONS.map((reg) => {
            galaxy.add(ring(reg.r, holo, reg.name === "Outer Rim" ? 0.22 : 0.14, true))
            const el = document.createElement("span")
            el.className = "map-region"
            el.textContent = reg.name
            labelLayer.appendChild(el)
            return { el, at: new THREE.Vector3(0, 0, reg.r) }
        })
        // the Unknown Regions: the uncharted west, marked off by an arc
        const unknownPts = []
        for (let i = 0; i <= 60; i++) {
            const a = Math.PI * (0.78 + (i / 60) * 0.44)
            unknownPts.push(new THREE.Vector3(Math.cos(a) * 46, 0, Math.sin(a) * 46))
        }
        const unknown = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(unknownPts),
            new THREE.LineDashedMaterial({ color: 0xff9a7a, transparent: true, opacity: 0.35, dashSize: 1, gapSize: 1.4, blending: THREE.AdditiveBlending, depthWrite: false })
        )
        unknown.computeLineDistances()
        galaxy.add(unknown)
        const unknownEl = document.createElement("span")
        unknownEl.className = "map-region is-unknown"
        unknownEl.textContent = "Unknown Regions"
        labelLayer.appendChild(unknownEl)
        regionLabels.push({ el: unknownEl, at: new THREE.Vector3(-92, 0, -2) })

        // pins: a beam of light standing over each place, a ring at its foot and a bright head
        const pinTex = paintGlow("rgba(255,255,255,1)", "rgba(255,255,255,0.4)")
        const makePin = (x, z, color, height) => {
            const pin = new THREE.Group()
            pin.position.set(x, 0, z)
            const beamGeo = new THREE.CylinderGeometry(0.12, 0.12, height, 6, 1, true).translate(0, height / 2, 0)
            const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }))
            pin.add(beam)
            const foot = ring(1.6, color, 0.8)
            pin.add(foot)
            const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: pinTex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
            head.position.y = height
            head.scale.setScalar(4.5)
            pin.add(head)
            galaxy.add(pin)
            return { pin, beam, foot, head }
        }

        const pins = DESTINATIONS.map((d) => {
            const color = new THREE.Color(SIDES[d.side].color)
            const p = makePin(d.at[0], d.at[1], color, 10)
            const el = document.createElement("button")
            el.type = "button"
            el.className = `map-pin ${d.live ? "" : "is-uncharted"}`
            el.style.setProperty("--pin", SIDES[d.side].color)
            el.innerHTML = `<b></b><span></span>`
            el.querySelector("b").textContent = d.name
            el.querySelector("span").textContent = SIDES[d.side].name
            el.setAttribute("aria-label", `${d.name}, ${SIDES[d.side].name}${d.live ? "" : ", not yet charted"}`)
            el.addEventListener("click", () => onSelectRef.current?.(d.id))
            labelLayer.appendChild(el)
            return { ...p, d, el, top: new THREE.Vector3(d.at[0], 10, d.at[1]) }
        })
        const coruscant = makePin(CORUSCANT.at[0], CORUSCANT.at[1], new THREE.Color(0xffffff), 5)
        coruscant.head.scale.setScalar(3)
        const coruscantEl = document.createElement("span")
        coruscantEl.className = "map-region is-coruscant"
        coruscantEl.textContent = CORUSCANT.name
        labelLayer.appendChild(coruscantEl)
        regionLabels.push({ el: coruscantEl, at: new THREE.Vector3(CORUSCANT.at[0], 5, CORUSCANT.at[1]) })

        // the course to the selected destination
        const courseGeo = new THREE.BufferGeometry()
        const coursePos = new Float32Array((COURSE_SEGMENTS + 1) * 3)
        const courseT = new Float32Array(COURSE_SEGMENTS + 1)
        for (let i = 0; i <= COURSE_SEGMENTS; i++) courseT[i] = i / COURSE_SEGMENTS
        courseGeo.setAttribute("position", new THREE.BufferAttribute(coursePos, 3))
        courseGeo.setAttribute("aT", new THREE.BufferAttribute(courseT, 1))
        const courseMat = courseMaterial()
        const course = new THREE.Line(courseGeo, courseMat)
        course.visible = false
        galaxy.add(course)
        let courseFor = null
        const plot = (d) => {
            const a = new THREE.Vector3(CORUSCANT.at[0], 0.5, CORUSCANT.at[1])
            const b = new THREE.Vector3(d.at[0], 0.5, d.at[1])
            const mid = a.clone().lerp(b, 0.5)
            mid.y = a.distanceTo(b) * 0.22
            const curve = new THREE.QuadraticBezierCurve3(a, mid, b)
            for (let i = 0; i <= COURSE_SEGMENTS; i++) coursePos.set(curve.getPoint(i / COURSE_SEGMENTS).toArray(), i * 3)
            courseGeo.attributes.position.needsUpdate = true
            courseGeo.computeBoundingSphere()
            courseMat.uniforms.uColor.value.set(SIDES[d.side].color)
            courseMat.uniforms.uReveal.value = 0
            course.visible = true
        }

        // ---------- looking round ----------
        let yaw = 0.35
        let pitch = 0.95
        let dist = intro && !reduceMotion ? 900 : 230
        let tYaw = yaw
        let tPitch = pitch
        let tDist = small ? 300 : 230
        const look = new THREE.Vector3()
        const tLook = new THREE.Vector3()
        let drag = null
        let pinch = null
        const pointers = new Map()
        const canvas = renderer.domElement
        const onDown = (e) => {
            pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
            canvas.setPointerCapture(e.pointerId)
            if (pointers.size === 2) {
                const [p1, p2] = [...pointers.values()]
                pinch = { d: Math.hypot(p1.x - p2.x, p1.y - p2.y), dist: tDist }
                drag = null
            } else drag = { x: e.clientX, y: e.clientY, yaw: tYaw, pitch: tPitch }
        }
        const onMove = (e) => {
            if (!pointers.has(e.pointerId)) return
            pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
            if (pinch && pointers.size === 2) {
                const [p1, p2] = [...pointers.values()]
                tDist = THREE.MathUtils.clamp((pinch.dist * pinch.d) / Math.max(20, Math.hypot(p1.x - p2.x, p1.y - p2.y)), 40, 420)
                return
            }
            if (!drag) return
            tYaw = drag.yaw - (e.clientX - drag.x) * 0.005
            tPitch = THREE.MathUtils.clamp(drag.pitch + (e.clientY - drag.y) * 0.004, 0.2, 1.45)
        }
        const onUp = (e) => {
            pointers.delete(e.pointerId)
            if (pointers.size < 2) pinch = null
            if (!pointers.size) drag = null
        }
        const onWheel = (e) => {
            e.preventDefault()
            tDist = THREE.MathUtils.clamp(tDist * (1 + Math.sign(e.deltaY) * 0.12), 40, 420)
        }
        canvas.addEventListener("pointerdown", onDown)
        canvas.addEventListener("pointermove", onMove)
        canvas.addEventListener("pointerup", onUp)
        canvas.addEventListener("pointercancel", onUp)
        canvas.addEventListener("wheel", onWheel, { passive: false })

        let lastSelected = undefined
        const resize = () => {
            const w = mount.clientWidth
            const h = mount.clientHeight
            if (!w || !h) return
            gl.resize(w, h)
            small = w < 760
            lastSelected = undefined // re-frame the view for the new size
            camera.aspect = w / h
            camera.fov = w / h < 1 ? 64 : 50
            camera.updateProjectionMatrix()
        }
        const observer = new ResizeObserver(resize)
        observer.observe(mount)
        resize()

        const world = new THREE.Vector3()
        const place = (el, at, offsetY = 0) => {
            world.copy(at)
            galaxy.localToWorld(world)
            world.project(camera)
            if (world.z > 1 || Math.abs(world.x) > 1.1 || Math.abs(world.y) > 1.1) {
                el.style.opacity = "0"
                el.style.pointerEvents = "none"
                return
            }
            el.style.opacity = ""
            el.style.pointerEvents = ""
            el.style.transform = `translate(${((world.x + 1) / 2) * mount.clientWidth}px, ${((1 - world.y) / 2) * mount.clientHeight + offsetY}px)`
        }

        let last = performance.now()
        let frame
        const tick = (now) => {
            frame = requestAnimationFrame(tick)
            const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
            gl.frame(dt)
            // points are sized in real pixels, so they follow the renderer's resolution as it adapts
            starMat.uniforms.uPixel.value = gasMat.uniforms.uPixel.value = renderer.getPixelRatio()
            last = now
            const t = now / 1000

            // the galaxy turns, slowly
            if (!reduceMotion) galaxy.rotation.y -= dt * 0.012

            // a new selection: plot the course and fly over to it
            const sel = DESTINATIONS.find((d) => d.id === selectedRef.current) ?? null
            if (sel !== lastSelected) {
                lastSelected = sel
                if (sel) {
                    if (courseFor !== sel.id) plot(sel)
                    courseFor = sel.id
                    tDist = small ? 140 : 95
                    tPitch = Math.max(0.55, Math.min(tPitch, 0.85))
                } else {
                    course.visible = false
                    courseFor = null
                    tDist = small ? 300 : 230
                }
            }
            if (sel) {
                // frame the course on wide screens; on narrow ones keep the destination itself in view
                const k = small ? 0.85 : 0.55
                tLook.set(sel.at[0] * k + CORUSCANT.at[0] * (1 - k), 0, sel.at[1] * k + CORUSCANT.at[1] * (1 - k))
                galaxy.localToWorld(tLook)
                courseMat.uniforms.uReveal.value = Math.min(1, courseMat.uniforms.uReveal.value + dt * 1.4)
            } else tLook.set(0, 0, 0)
            courseMat.uniforms.uTime.value = t

            const k = Math.min(1, dt * 2.4)
            yaw += (tYaw - yaw) * k
            pitch += (tPitch - pitch) * k
            dist += (tDist - dist) * Math.min(1, dt * (dist > 400 ? 1.1 : 2))
            look.lerp(tLook, Math.min(1, dt * 2.2))
            camera.position.set(look.x + Math.sin(yaw) * Math.cos(pitch) * dist, look.y + Math.sin(pitch) * dist, look.z + Math.cos(yaw) * Math.cos(pitch) * dist)
            camera.lookAt(look)

            // pins pulse; the selected one stands out, the uncharted ones stay dim
            for (const p of pins) {
                const isSel = sel?.id === p.d.id
                const pulse = 0.5 + 0.5 * Math.sin(t * 2.4 + p.d.at[0])
                p.head.scale.setScalar((isSel ? 6.5 : 4.2) + pulse * (isSel ? 1.6 : 0.6))
                p.head.material.opacity = p.d.live ? 1 : 0.55
                p.beam.material.opacity = (p.d.live ? 0.5 : 0.25) + (isSel ? 0.3 : 0)
                p.foot.scale.setScalar(1 + ((t * 0.6 + p.d.at[1] * 0.01) % 1) * (isSel ? 1.6 : 0.6))
                p.foot.material.opacity = (1 - ((t * 0.6 + p.d.at[1] * 0.01) % 1)) * (p.d.live ? 0.8 : 0.4)
                p.el.classList.toggle("is-selected", isSel)
                place(p.el, p.top)
            }
            for (const r of regionLabels) place(r.el, r.at)

            renderer.render(scene, camera)
        }
        gl.begin(scene, camera, () => (frame = requestAnimationFrame(tick)))

        return () => {
            cancelAnimationFrame(frame)
            observer.disconnect()
            canvas.removeEventListener("pointerdown", onDown)
            canvas.removeEventListener("pointermove", onMove)
            canvas.removeEventListener("pointerup", onUp)
            canvas.removeEventListener("pointercancel", onUp)
            canvas.removeEventListener("wheel", onWheel)
            labelLayer.replaceChildren()
            disposeScene(scene)
            glowTex.dispose()
            pinTex.dispose()
            renderer.dispose()
            canvas.remove()
        }
        // the intro swoop only matters on first mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className="galaxy-map">
            <div className="galaxy-view" ref={mountRef} />
            <div className="galaxy-labels" ref={labelsRef} />
        </div>
    )
}

export default GalaxyMap
