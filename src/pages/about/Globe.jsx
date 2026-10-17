import { useEffect, useRef } from "react"
import * as THREE from "three"
import { feature } from "topojson-client"
import landTopology from "world-atlas/land-50m.json"

/*
 * Morgan's World: a glossy Frutiger Aero globe drawn with three.js.
 * The Earth texture is painted at load time from Natural Earth land outlines (via world-atlas):
 * aqua ocean, shallow-water glow along the coasts, green land fading to snow at the poles.
 * Places are HTML pins laid over the canvas and moved every frame, so they stay crisp and clickable.
 *
 * Props:
 *  places      [{ id, name, lat, lon }]
 *  routes      [{ from, to, main }] drawn as dotted flight arcs (strings of glossy beads)
 *  selectedId  the place to turn towards (null leaves the globe where it is)
 *  introFrom   the place the globe starts on before the arcs draw in and it turns to selectedId
 *  onSelect    called with a place id when its pin is clicked
 *  miiStateRef the Mii's state ({ walking, heading, waveNow }); the Mii walks while the world turns
 *  onReady / onError
 */

const D2R = Math.PI / 180
const FOV = 28
const FILL = 0.72 // share of the canvas height the globe's diameter fills
const MAX_TILT = 1.15 // how far up or down the globe can be tipped, in radians
const TURN_TIME = 1.5 // seconds to turn to a chosen place
const ARC_DRAW_TIME = 1.6

// Seeded random so the clouds come out the same on every visit
const seeded = (seed) => () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
}

// Unit vector for a latitude/longitude; longitude 0 faces +Z, 90°E faces +X
const toVector = (lat, lon, r = 1) => {
    const la = lat * D2R
    const lo = lon * D2R
    return new THREE.Vector3(Math.cos(la) * Math.sin(lo) * r, Math.sin(la) * r, Math.cos(la) * Math.cos(lo) * r)
}

// The globe rotation (x tips it, y spins it) that turns a place to face the camera
const facing = (lat, lon) => ({ x: lat * D2R, y: -lon * D2R })

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

const landPath = (w, h) => {
    const path = new Path2D()
    const land = feature(landTopology, landTopology.objects.land)
    const toXY = ([lon, lat]) => [((lon + 180) / 360) * w, ((90 - lat) / 180) * h]
    for (const polygon of land.features[0].geometry.coordinates) {
        for (const ring of polygon) {
            ring.forEach((point, i) => {
                const [x, y] = toXY(point)
                // a ring that wraps the antimeridian would streak across the map; lift the pen instead
                const jump = i > 0 && Math.abs(point[0] - ring[i - 1][0]) > 180
                if (i === 0 || jump) path.moveTo(x, y)
                else path.lineTo(x, y)
            })
            path.closePath()
        }
    }
    return path
}

const paintEarth = (w, h) => {
    const path = landPath(w, h)

    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const g = canvas.getContext("2d")

    // Ocean: deep at the poles, brighter aqua around the equator
    const ocean = g.createLinearGradient(0, 0, 0, h)
    ocean.addColorStop(0, "#1a6fb8")
    ocean.addColorStop(0.3, "#1272bf")
    ocean.addColorStop(0.5, "#1a86d0")
    ocean.addColorStop(0.7, "#1272bf")
    ocean.addColorStop(1, "#1a6fb8")
    g.fillStyle = ocean
    g.fillRect(0, 0, w, h)

    // Shallow water: a wide soft glow along every coast, then a tighter bright one. Blurring is
    // costly, so the glow is painted at quarter size and scaled up (it's soft anyway).
    const glow = document.createElement("canvas")
    glow.width = w / 4
    glow.height = h / 4
    const gl = glow.getContext("2d")
    const smallPath = landPath(w / 4, h / 4)
    gl.lineJoin = "round"
    gl.strokeStyle = "rgba(64, 196, 240, 0.55)"
    gl.lineWidth = w / 280
    gl.filter = `blur(${w / 1040}px)`
    gl.stroke(smallPath)
    gl.strokeStyle = "rgba(150, 236, 255, 0.75)"
    gl.lineWidth = w / 1040
    gl.filter = `blur(${w / 3600}px)`
    gl.stroke(smallPath)
    // near the poles the flat map is stretched, so the glow would pinch into streaks: fade it out
    gl.filter = "none"
    gl.globalCompositeOperation = "destination-in"
    const polar = gl.createLinearGradient(0, 0, 0, h / 4)
    polar.addColorStop(0, "rgba(0, 0, 0, 0)")
    polar.addColorStop(0.17, "rgba(0, 0, 0, 1)")
    polar.addColorStop(0.83, "rgba(0, 0, 0, 1)")
    polar.addColorStop(1, "rgba(0, 0, 0, 0)")
    gl.fillStyle = polar
    gl.fillRect(0, 0, w / 4, h / 4)
    g.imageSmoothingQuality = "high"
    g.drawImage(glow, 0, 0, w, h)

    // Land on its own layer, coloured by latitude: lush near the equator, snow at the poles
    const landCanvas = document.createElement("canvas")
    landCanvas.width = w
    landCanvas.height = h
    const l = landCanvas.getContext("2d")
    l.fillStyle = "#000"
    l.fill(path)
    l.globalCompositeOperation = "source-in"
    const lat = (deg) => (90 - deg) / 180
    const tint = l.createLinearGradient(0, 0, 0, h)
    tint.addColorStop(lat(90), "#ffffff")
    tint.addColorStop(lat(68), "#f2fbff")
    tint.addColorStop(lat(60), "#b9e08f")
    tint.addColorStop(lat(40), "#77cf4f")
    tint.addColorStop(lat(0), "#4cbb3c")
    tint.addColorStop(lat(-40), "#77cf4f")
    tint.addColorStop(lat(-56), "#b9e08f")
    tint.addColorStop(lat(-62), "#f2fbff")
    tint.addColorStop(lat(-90), "#ffffff")
    l.fillStyle = tint
    l.fillRect(0, 0, w, h)
    g.drawImage(landCanvas, 0, 0)

    // A light rim just inside the coastline gives the land a soft, rounded, toy-like edge
    g.save()
    g.clip(path)
    g.strokeStyle = "rgba(255, 255, 255, 0.4)"
    g.lineWidth = w / 600
    g.stroke(path)
    g.restore()

    // Specular map: only the ocean shines
    const spec = document.createElement("canvas")
    spec.width = w / 2
    spec.height = h / 2
    const s = spec.getContext("2d")
    s.fillStyle = "#fff"
    s.fillRect(0, 0, spec.width, spec.height)
    s.scale(0.5, 0.5)
    s.fillStyle = "#1a1a1a"
    s.fill(path)

    return { color: canvas, specular: spec }
}

const paintClouds = (w, h) => {
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const g = canvas.getContext("2d")
    const rand = seeded(7)
    g.filter = `blur(${Math.round(w / 500)}px)`
    for (let i = 0; i < 34; i++) {
        // long soft bands of puffs, mostly in the mid-latitudes, like weather fronts
        const cx = rand() * w
        const cy = h * (0.2 + rand() * 0.6)
        const puffs = 6 + Math.floor(rand() * 8)
        const drift = (rand() - 0.5) * 0.6
        for (let p = 0; p < puffs; p++) {
            const x = cx + p * w * 0.012 + (rand() - 0.5) * w * 0.01
            const y = cy + p * drift * h * 0.01 + (rand() - 0.5) * h * 0.012
            const r = w * (0.008 + rand() * 0.012)
            const alpha = 0.18 + rand() * 0.22
            for (const dx of [-w, 0, w]) {
                const grad = g.createRadialGradient(x + dx, y, 0, x + dx, y, r * 2)
                grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`)
                grad.addColorStop(1, "rgba(255, 255, 255, 0)")
                g.fillStyle = grad
                g.beginPath()
                g.ellipse(x + dx, y, r * 2.4, r, 0, 0, Math.PI * 2)
                g.fill()
            }
        }
    }
    return canvas
}

const atmosphereMaterial = (color, power, backSide) =>
    new THREE.ShaderMaterial({
        uniforms: { glowColor: { value: new THREE.Color(color) }, power: { value: power } },
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vView;
            void main() {
                vec4 mv = modelViewMatrix * vec4(position, 1.0);
                vNormal = normalize(normalMatrix * normal);
                vView = normalize(-mv.xyz);
                gl_Position = projectionMatrix * mv;
            }`,
        fragmentShader: backSide
            ? `
            uniform vec3 glowColor;
            uniform float power;
            varying vec3 vNormal;
            varying vec3 vView;
            void main() {
                float rim = clamp(0.62 + dot(vNormal, vView), 0.0, 1.0);
                gl_FragColor = vec4(glowColor, 1.0) * pow(rim, power);
            }`
            : `
            uniform vec3 glowColor;
            uniform float power;
            varying vec3 vNormal;
            varying vec3 vView;
            void main() {
                float rim = 1.0 - clamp(dot(vNormal, vView), 0.0, 1.0);
                gl_FragColor = vec4(glowColor, 1.0) * pow(rim, power);
            }`,
        side: backSide ? THREE.BackSide : THREE.FrontSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
    })

const Globe = ({ places, routes, selectedId, introFrom, onSelect, miiStateRef, onReady, onError }) => {
    const mountRef = useRef(null)
    const pinsRef = useRef({})
    const selectedRef = useRef(selectedId)
    const onSelectRef = useRef(onSelect)
    useEffect(() => {
        onSelectRef.current = onSelect
    }, [onSelect])

    // Hand the latest selection to the render loop, which turns the globe towards it
    const turnRef = useRef(null)
    useEffect(() => {
        selectedRef.current = selectedId
        turnRef.current?.(selectedId)
    }, [selectedId])

    useEffect(() => {
        const mount = mountRef.current
        const canvasHost = mount.querySelector(".globe-canvas")
        let renderer
        try {
            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
        } catch {
            onError?.()
            return
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        canvasHost.appendChild(renderer.domElement)

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        // a 2048 texture is sharp until the globe is drawn over ~1100 device pixels across
        const globePixels = Math.min(mount.clientWidth, mount.clientHeight) * FILL * Math.min(window.devicePixelRatio, 2)
        const texW = Math.min(globePixels > 1100 ? 4096 : 2048, renderer.capabilities.maxTextureSize)

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50)
        // distance at which the globe's silhouette fills FILL of the view height
        const halfFov = (FOV / 2) * D2R
        const silhouette = Math.atan(Math.tan(halfFov) * FILL)
        camera.position.set(0, 0, 1 / Math.sin(silhouette))
        camera.lookAt(0, 0, 0)

        scene.add(new THREE.HemisphereLight(0xffffff, 0x2a6fa8, 1.25))
        const sun = new THREE.DirectionalLight(0xffffff, 2.1)
        sun.position.set(-2.5, 2.2, 3)
        scene.add(sun)

        const globe = new THREE.Group()
        globe.rotation.order = "XYZ"
        scene.add(globe)

        const { color, specular } = paintEarth(texW, texW / 2)
        const colorTex = new THREE.CanvasTexture(color)
        colorTex.colorSpace = THREE.SRGBColorSpace
        colorTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
        const specTex = new THREE.CanvasTexture(specular)

        const sphereGeo = new THREE.SphereGeometry(1, 96, 64)
        const earth = new THREE.Mesh(
            sphereGeo,
            new THREE.MeshPhongMaterial({ map: colorTex, specularMap: specTex, specular: new THREE.Color("#bfe9ff"), shininess: 38 })
        )
        // three.js puts the texture's longitude 0 on +X; turn it so longitude 0 faces +Z like toVector
        earth.rotation.y = -Math.PI / 2
        globe.add(earth)

        const cloudTex = new THREE.CanvasTexture(paintClouds(texW / 2, texW / 4))
        cloudTex.colorSpace = THREE.SRGBColorSpace
        const clouds = new THREE.Mesh(
            new THREE.SphereGeometry(1.012, 72, 48),
            new THREE.MeshLambertMaterial({ map: cloudTex, transparent: true, depthWrite: false, opacity: 0.9 })
        )
        clouds.rotation.y = -Math.PI / 2
        globe.add(clouds)

        // The glassy Aero rim on the globe, and the soft sky-blue halo around it
        const rim = new THREE.Mesh(new THREE.SphereGeometry(1.004, 64, 48), atmosphereMaterial("#bdf0ff", 3.2, false))
        scene.add(rim)
        const halo = new THREE.Mesh(new THREE.SphereGeometry(1.16, 64, 48), atmosphereMaterial("#7fd8ff", 2.4, true))
        scene.add(halo)

        // Flight arcs, lifted higher the further they travel: strings of little glossy beads that
        // drift from home towards each destination
        const byId = Object.fromEntries(places.map((p) => [p.id, p]))
        const beadGeo = new THREE.SphereGeometry(1, 10, 8)
        const bead = new THREE.Object3D()
        const arcs = routes.map((route) => {
            const a = toVector(byId[route.from].lat, byId[route.from].lon)
            const b = toVector(byId[route.to].lat, byId[route.to].lon)
            const angle = a.angleTo(b)
            const lift = 0.04 + angle * 0.12
            // normalising the straight-line blend keeps the path on the great circle (arcs are under 180°)
            const pointAt = (t, out) => out.copy(a).lerp(b, t).normalize().multiplyScalar(1.008 + Math.sin(Math.PI * t) * lift)
            const count = Math.max(12, Math.round((angle * (1 + lift)) / (route.main ? 0.032 : 0.04)))
            const mesh = new THREE.InstancedMesh(
                beadGeo,
                new THREE.MeshBasicMaterial({ color: route.main ? 0xffffff : 0xdff6ff, transparent: true, opacity: route.main ? 1 : 0.85 }),
                count
            )
            mesh.frustumCulled = false
            globe.add(mesh)
            return { mesh, pointAt, count, size: route.main ? 0.0095 : 0.007, shown: count }
        })
        const placeBeads = (arc, phase) => {
            for (let i = 0; i < arc.count; i++) {
                const t = (i + phase) / arc.count
                arc.pointAt(t, bead.position)
                // beads swell slightly mid-flight, and shrink into the places at either end
                bead.scale.setScalar(arc.size * (0.55 + 0.45 * Math.sin(Math.PI * t)))
                bead.updateMatrix()
                arc.mesh.setMatrixAt(i, bead.matrix)
            }
            arc.mesh.instanceMatrix.needsUpdate = true
        }
        let beadPhase = 0
        arcs.forEach((arc) => placeBeads(arc, 0))

        // Small glossy dots at each place, under the HTML pins
        const dotGeo = new THREE.SphereGeometry(0.014, 16, 12)
        const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
        places.forEach((p) => {
            const dot = new THREE.Mesh(dotGeo, dotMat)
            dot.position.copy(toVector(p.lat, p.lon, 1.004))
            globe.add(dot)
        })

        // Rotation state: current, target, and the turn in progress
        const startPlace = byId[introFrom] ?? byId[selectedRef.current] ?? places[0]
        const rot = facing(startPlace.lat, startPlace.lon)
        rot.x = THREE.MathUtils.clamp(rot.x, -MAX_TILT, MAX_TILT)
        globe.rotation.set(rot.x, rot.y, 0)
        let turn = null // { from, to, t }
        let introLeft = reduceMotion ? 0 : ARC_DRAW_TIME
        let pendingTurn = selectedRef.current

        const mii = () => miiStateRef?.current
        const startTurn = (id) => {
            const place = byId[id]
            if (!place) return
            if (introLeft > 0) {
                pendingTurn = id
                return
            }
            const target = facing(place.lat, place.lon)
            target.x = THREE.MathUtils.clamp(target.x, -MAX_TILT, MAX_TILT)
            // spin the short way round
            let dy = target.y - rot.y
            dy = Math.atan2(Math.sin(dy), Math.cos(dy))
            const dx = target.x - rot.x
            if (reduceMotion || Math.hypot(dx, dy) < 0.01) {
                rot.x = target.x
                rot.y += dy
                if (mii()) mii().waveNow = true
                return
            }
            turn = { fromX: rot.x, fromY: rot.y, dx, dy, t: 0, time: TURN_TIME * Math.min(1, 0.45 + Math.hypot(dx, dy) / 2.5) }
            if (mii()) {
                mii().walking = true
                // the world turns under the Mii, so he walks the way the destination lies
                mii().heading = Math.abs(dy) > Math.abs(dx) * 0.6 ? (dy < 0 ? 1 : -1) * (Math.PI / 2) : dx > 0 ? Math.PI : 0
            }
        }
        turnRef.current = startTurn
        // Reveal an arc up to `share` of its beads (the flight paths draw themselves in on arrival)
        const showArc = (arc, share) => {
            arc.mesh.count = Math.round(THREE.MathUtils.clamp(share, 0, 1) * arc.count)
        }
        arcs.forEach((arc) => showArc(arc, reduceMotion ? 1 : 0))

        // Drag / swipe to spin, with a little inertia
        const canvas = renderer.domElement
        let drag = null
        let velocity = { x: 0, y: 0 }
        const onPointerDown = (e) => {
            drag = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: 0 }
            canvas.setPointerCapture(e.pointerId)
            turn = null
            if (mii()) mii().walking = false
            velocity = { x: 0, y: 0 }
        }
        const onPointerMove = (e) => {
            if (!drag || e.pointerId !== drag.id) return
            const scale = 2.6 / canvas.clientHeight
            const dx = e.clientX - drag.x
            const dy = e.clientY - drag.y
            drag.x = e.clientX
            drag.y = e.clientY
            drag.moved += Math.abs(dx) + Math.abs(dy)
            rot.y += dx * scale
            rot.x = THREE.MathUtils.clamp(rot.x + dy * scale, -MAX_TILT, MAX_TILT)
            velocity = { x: dy * scale, y: dx * scale }
        }
        const endDrag = (e) => {
            if (!drag || (e && e.pointerId !== drag.id)) return
            drag = null
        }
        canvas.addEventListener("pointerdown", onPointerDown)
        canvas.addEventListener("pointermove", onPointerMove)
        canvas.addEventListener("pointerup", endDrag)
        canvas.addEventListener("pointercancel", endDrag)
        canvas.addEventListener("lostpointercapture", endDrag)

        const resize = () => {
            const w = mount.clientWidth
            const h = mount.clientHeight
            if (!w || !h) return
            renderer.setSize(w, h, false)
            camera.aspect = w / h
            camera.updateProjectionMatrix()
        }
        const observer = new ResizeObserver(resize)
        observer.observe(mount)
        resize()

        const projected = new THREE.Vector3()
        const normal = new THREE.Vector3()
        const toCamera = new THREE.Vector3()
        const pinVectors = places.map((p) => ({ id: p.id, v: toVector(p.lat, p.lon, 1.004) }))

        let last = performance.now()
        let frame
        let readySent = false
        const tick = (now) => {
            // the first frame's timestamp can be slightly before `last`, so never step backwards
            const dt = THREE.MathUtils.clamp((now - last) / 1000, 0, 0.05)
            last = now

            if (introLeft > 0) {
                introLeft -= dt
                const progress = 1 - Math.max(0, introLeft) / ARC_DRAW_TIME
                arcs.forEach((arc) => showArc(arc, easeInOut(progress)))
                if (introLeft <= 0) {
                    introLeft = 0
                    startTurn(pendingTurn)
                }
            }

            if (turn) {
                turn.t = Math.min(1, turn.t + dt / turn.time)
                const k = easeInOut(turn.t)
                rot.x = turn.fromX + turn.dx * k
                rot.y = turn.fromY + turn.dy * k
                if (turn.t >= 1) {
                    turn = null
                    if (mii()) {
                        mii().walking = false
                        mii().heading = 0
                        mii().waveNow = true
                    }
                }
            } else if (!drag && (Math.abs(velocity.x) > 1e-5 || Math.abs(velocity.y) > 1e-5)) {
                rot.y += velocity.y
                rot.x = THREE.MathUtils.clamp(rot.x + velocity.x, -MAX_TILT, MAX_TILT)
                const damping = Math.pow(0.04, dt)
                velocity.x *= damping
                velocity.y *= damping
            }
            globe.rotation.set(rot.x, rot.y, 0)

            if (!reduceMotion) {
                clouds.rotation.y += dt * 0.012
                // the beads drift along their paths, one bead-gap every 1.2 seconds
                beadPhase = (beadPhase + dt / 1.2) % 1
                arcs.forEach((arc) => placeBeads(arc, beadPhase))
            }

            renderer.render(scene, camera)

            // Move the HTML pins to their places, fading them out round the back of the globe
            globe.updateMatrixWorld()
            const w = canvas.clientWidth
            const h = canvas.clientHeight
            pinVectors.forEach(({ id, v }) => {
                const el = pinsRef.current[id]
                if (!el) return
                projected.copy(v).applyMatrix4(globe.matrixWorld)
                normal.copy(projected).normalize()
                toCamera.copy(camera.position).sub(projected).normalize()
                const face = normal.dot(toCamera)
                // labels near the horizon fade out early so they never sit behind the Mii
                const visible = THREE.MathUtils.clamp((face - 0.25) / 0.2, 0, 1)
                projected.project(camera)
                const x = (projected.x * 0.5 + 0.5) * w
                const y = (-projected.y * 0.5 + 0.5) * h
                el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
                el.style.opacity = visible.toFixed(2)
                el.style.pointerEvents = visible > 0.5 ? "auto" : "none"
                el.style.zIndex = String(Math.round(face * 100) + 100)
            })

            if (!readySent) {
                readySent = true
                onReady?.()
            }
            frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)

        return () => {
            cancelAnimationFrame(frame)
            observer.disconnect()
            turnRef.current = null
            canvas.removeEventListener("pointerdown", onPointerDown)
            canvas.removeEventListener("pointermove", onPointerMove)
            canvas.removeEventListener("pointerup", endDrag)
            canvas.removeEventListener("pointercancel", endDrag)
            canvas.removeEventListener("lostpointercapture", endDrag)
            scene.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose()
                const mats = obj.material ? [].concat(obj.material) : []
                mats.forEach((m) => {
                    Object.values(m).forEach((v) => v?.isTexture && v.dispose())
                    m.dispose()
                })
            })
            renderer.dispose()
            canvas.remove()
        }
        // the scene is built once; selection changes go through turnRef
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className="globe" ref={mountRef}>
            <div className="globe-canvas" />
            <div className="globe-pins" aria-hidden="true">
                {places.map((p) => (
                    <button
                        key={p.id}
                        type="button"
                        tabIndex={-1}
                        className={`globe-pin side-${p.labelSide ?? "up"} ${p.id === selectedId ? "is-selected" : ""}`}
                        ref={(el) => (pinsRef.current[p.id] = el)}
                        onClick={() => onSelectRef.current?.(p.id)}
                        style={{ opacity: 0 }}
                    >
                        <span className="globe-pin-label">{p.name}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}

export default Globe
