import * as THREE from "three"

/*
 * One way of making a WebGL renderer for every scene in the galaxy channel, tuned for speed:
 *
 * - Anti-aliasing only on low-density screens: on a high-DPI display the extra pixels already
 *   smooth the edges, and multisampling them as well is the costliest thing a scene does.
 * - Adaptive resolution: the scene starts at the screen's pixel ratio (capped at `maxDpr`) and
 *   watches how long frames take. If it's struggling it steps the resolution down, and if it has
 *   headroom it steps back up, so slow laptops and phones stay smooth instead of stuttering.
 *
 * Returns the renderer, a `frame(dt)` to call once per animation frame, `resize(w, h)`, and
 * `begin(scene, camera, start)` to compile the shaders and then start the animation loop.
 * Returns null if WebGL isn't available.
 */
export const createRenderer = (mount, { maxDpr = 2, minDpr = 0.75, alpha = false, toneMapping = THREE.ACESFilmicToneMapping, exposure = 1 } = {}) => {
    const native = window.devicePixelRatio || 1
    let renderer
    try {
        renderer = new THREE.WebGLRenderer({ antialias: native < 1.5, alpha, powerPreference: "high-performance" })
    } catch {
        return null
    }
    const top = Math.min(native, maxDpr)
    let dpr = top
    renderer.setPixelRatio(dpr)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = toneMapping
    renderer.toneMappingExposure = exposure
    mount.appendChild(renderer.domElement)

    let w = 0
    let h = 0
    const resize = (width, height) => {
        w = width
        h = height
        renderer.setSize(w, h, false)
    }

    /*
     * Judge frames against the display's own refresh (the shortest frame we've seen: about 16.7ms on a
     * 60Hz screen, 8.3ms at 120Hz). If frames keep missing it, step the resolution down. Stepping up
     * is cautious, because a vsynced loop can't show spare headroom: only after a long clean run,
     * and never back to a level that has already struggled (until a good while has passed).
     */
    let budget = 1 / 60
    let sum = 0
    let count = 0
    let cooldown = 1 // let the scene settle (shaders compiling, textures uploading) before judging
    let clean = 0 // consecutive windows that hit the refresh
    let failedAt = Infinity // the lowest resolution that has struggled
    let forgive = 0
    const step = (next) => {
        dpr = next
        renderer.setPixelRatio(dpr)
        if (w && h) renderer.setSize(w, h, false)
        cooldown = 2
        clean = 0
    }
    const frame = (dt) => {
        if (dt <= 0 || dt > 0.25) return // a hidden tab or a hitch, not a trend
        budget = Math.max(1 / 240, Math.min(budget * 1.00005, dt)) // creeps back up slowly, in case the refresh rate changes
        cooldown -= dt
        sum += dt
        count++
        if (sum < 1) return
        const avg = sum / count
        sum = 0
        count = 0
        if (cooldown > 0) return
        forgive -= 1
        if (forgive <= 0) failedAt = Infinity
        // dropping even one frame in eight is enough to act on
        if (avg > budget * 1.12 && dpr > minDpr) {
            failedAt = Math.min(failedAt, dpr)
            forgive = 30
            step(Math.max(minDpr, dpr - 0.25))
        } else if (avg < budget * 1.06) {
            clean++
            const up = Math.min(top, dpr + 0.25)
            if (clean >= 6 && up > dpr && up < failedAt) step(up)
        } else clean = 0
    }

    // Compile the scene's shaders before the first frame (in parallel, where the browser supports it),
    // so arriving somewhere doesn't freeze while the GPU catches up; then start the loop. If the
    // scene has been torn down by then (its canvas removed), don't start at all.
    const begin = (scene, camera, start) => {
        const go = () => renderer.domElement.isConnected && start()
        if (renderer.compileAsync) renderer.compileAsync(scene, camera).then(go, go)
        else go()
    }

    return { renderer, frame, resize, begin }
}
