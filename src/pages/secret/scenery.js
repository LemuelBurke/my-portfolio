import * as THREE from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"

// Shared pieces of the Chimaera's scenery: the planet, the starfield and a Star Destroyer seen from
// afar. Everything is painted or modelled here; there are no image or model files.

export const metal = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.5, ...extra })

// A small, fast seeded random (mulberry32), so painted textures and layouts come out the same
// every time. Scenes call it hundreds of thousands of times while they build, so speed matters.
export const seeded = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// Lothal: grassy plains under wisps of cloud
export const paintLothal = () => {
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 512
    const g = canvas.getContext("2d")
    g.fillStyle = "#6f8f4a"
    g.fillRect(0, 0, 1024, 512)
    const rand = seeded(9)
    const tones = ["#7f9d55", "#5f7f3f", "#a39a62", "#8aa860", "#4f6f3a", "#b3a56c"]
    for (let i = 0; i < 900; i++) {
        g.fillStyle = tones[Math.floor(rand() * tones.length)]
        g.globalAlpha = 0.35
        g.beginPath()
        g.ellipse(rand() * 1024, rand() * 512, 10 + rand() * 60, 6 + rand() * 30, rand() * 3, 0, Math.PI * 2)
        g.fill()
    }
    g.globalAlpha = 0.5
    g.fillStyle = "#ffffff"
    for (let i = 0; i < 160; i++) {
        g.beginPath()
        g.ellipse(rand() * 1024, rand() * 512, 20 + rand() * 70, 3 + rand() * 6, 0, 0, Math.PI * 2)
        g.fill()
    }
    g.globalAlpha = 1
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
}

// The planet with a thin blue rim of atmosphere
export const buildLothal = (radius) => {
    const group = new THREE.Group()
    group.add(new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 48), new THREE.MeshStandardMaterial({ map: paintLothal(), roughness: 1, fog: false })))
    group.add(
        new THREE.Mesh(
            new THREE.SphereGeometry(radius * 1.035, 64, 48),
            new THREE.ShaderMaterial({
                vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
                fragmentShader: `varying vec3 vN; varying vec3 vV; void main(){ float r = pow(clamp(0.7 - dot(vN, vV), 0.0, 1.0), 2.2); gl_FragColor = vec4(0.55, 0.8, 1.0, 1.0) * r; }`,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending,
                transparent: true,
                depthWrite: false,
                fog: false,
            })
        )
    )
    return group
}

export const buildStars = (count, radius, size = 1.4) => {
    const positions = new Float32Array(count * 3)
    const v = new THREE.Vector3()
    for (let i = 0; i < count; i++) {
        v.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize().multiplyScalar(radius)
        positions.set([v.x, v.y, v.z], i * 3)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size, sizeAttenuation: false, fog: false }))
}

// A Star Destroyer seen from afar, bow along -Z: the dagger hull, stepped superstructure and the
// bridge tower with its two domes. About 83 units long.
export const buildStarDestroyer = () => {
    const ship = new THREE.Group()
    const hullMat = metal(0x9aa2aa, { roughness: 0.6, fog: false })
    const darkMat = metal(0x5c636b, { roughness: 0.6, fog: false })
    const dagger = new THREE.Shape()
    dagger.moveTo(0, 50)
    dagger.lineTo(-20, -30)
    dagger.lineTo(-17, -33)
    dagger.lineTo(17, -33)
    dagger.lineTo(20, -30)
    dagger.closePath()
    const upper = new THREE.ExtrudeGeometry(dagger, { depth: 3.5, bevelEnabled: false })
    upper.rotateX(Math.PI / 2)
    const top = new THREE.Mesh(upper, hullMat)
    top.position.y = 3.5
    ship.add(top)
    const lowerShape = new THREE.Shape()
    lowerShape.moveTo(0, 42)
    lowerShape.lineTo(-16, -30)
    lowerShape.lineTo(16, -30)
    lowerShape.closePath()
    const lower = new THREE.ExtrudeGeometry(lowerShape, { depth: 3, bevelEnabled: false })
    lower.rotateX(Math.PI / 2)
    const bottom = new THREE.Mesh(lower, darkMat)
    bottom.position.y = 0.2
    ship.add(bottom)
    const box = (w, h, d, x, y, z) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hullMat)
        m.position.set(x, y, z)
        ship.add(m)
    }
    box(22, 3, 20, 0, 5, -20)
    box(16, 3, 14, 0, 8, -24)
    box(10, 3, 9, 0, 11, -27)
    box(2.2, 5, 2.2, 0, 15, -28)
    box(12, 1.6, 2.6, 0, 18, -28)
    for (const x of [-4.2, 4.2]) {
        const dome = new THREE.Mesh(new THREE.SphereGeometry(1.3, 16, 12), hullMat)
        dome.position.set(x, 19.8, -28)
        ship.add(dome)
    }
    for (const x of [-7, 0, 7]) {
        const glow = new THREE.Mesh(new THREE.CircleGeometry(2.2, 20), new THREE.MeshBasicMaterial({ color: 0x9fd8ff, fog: false }))
        glow.position.set(x, 2.5, -33.2)
        glow.rotation.y = Math.PI
        ship.add(glow)
    }
    // the shape was drawn bow towards +Z; turn it so the bow points along -Z
    ship.rotation.y = Math.PI
    const holder = new THREE.Group()
    holder.add(ship)
    return holder
}

// A soft round glow, for sprites (explosions, muzzle flashes, engine glow)
export const paintGlow = (inner = "rgba(255,255,255,1)", mid = "rgba(255,190,90,0.6)") => {
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = 128
    const g = canvas.getContext("2d")
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    grad.addColorStop(0, inner)
    grad.addColorStop(0.35, mid)
    grad.addColorStop(1, "rgba(0,0,0,0)")
    g.fillStyle = grad
    g.fillRect(0, 0, 128, 128)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
}

// Free everything in a scene when a view unmounts
export const disposeScene = (scene) => {
    scene.traverse((o) => {
        o.geometry?.dispose()
        ;[].concat(o.material ?? []).forEach((m) => {
            m.map?.dispose()
            m.emissiveMap?.dispose()
            m.dispose()
        })
    })
}

/*
 * Bake a group of static meshes into as few as possible: one merged mesh per material, with each
 * part's position, rotation and scale baked into its vertices. A scene full of little parts (town
 * buildings, rocks, consoles) then costs a handful of draw calls instead of dozens. The originals'
 * geometries are disposed. Returns a group to add in their place.
 */
export const bakeStatic = (root) => {
    root.updateMatrixWorld(true)
    const byMaterial = new Map()
    root.traverse((o) => {
        if (!o.isMesh || Array.isArray(o.material)) return
        let geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()
        for (const name of Object.keys(geo.attributes)) if (!["position", "normal", "uv"].includes(name)) geo.deleteAttribute(name)
        if (!geo.attributes.uv) geo.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2))
        geo.applyMatrix4(o.matrixWorld)
        if (!byMaterial.has(o.material)) byMaterial.set(o.material, [])
        byMaterial.get(o.material).push(geo)
    })
    const baked = new THREE.Group()
    for (const [material, geos] of byMaterial) {
        baked.add(new THREE.Mesh(mergeGeometries(geos), material))
        geos.forEach((g) => g.dispose())
    }
    root.traverse((o) => o.isMesh && o.geometry.dispose())
    return baked
}
