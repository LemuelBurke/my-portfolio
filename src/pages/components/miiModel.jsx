import { useEffect, useRef } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import miiModelUrl from "../../assets/models/morgan-mii.glb?url"

// The model ships without animations, so the walk cycle is posed procedurally.
// Its rest pose already has the arms hanging down, angled slightly outwards.
const ARM_TUCK = 0.12 // radians to bring the arms a little closer to the body
const WALK_CYCLE_SPEED = 10 // radians of phase per second
const LEG_SWING = 0.5
const KNEE_BEND = 0.4
// Waving at the visitor after standing still for a while
const WAVE_AFTER = 6 // seconds idle before waving
const WAVE_DURATION = 2.8
const WAVE_ARM_RAISE = -2.3 // right arm up and out (the right arm sits on -X)
const WAVE_SPEED = 11
const WADDLE = 0.06 // side-to-side sway, so walking towards the camera still reads as walking
const ARM_SWING = 0.45
const TURN_SPEED = 10
// Framing: the Mii fills this share of the canvas height, standing this far above the bottom edge
const FILL = 0.84
const FOOT_MARGIN = 0.03
// Near straight-on with no perspective, to match the flat, front-on shopfronts
const CAMERA_TILT = THREE.MathUtils.degToRad(3)
// Holding a flag (About Me): the left arm lifts out to the side, the forearm bends up, and the
// view widens so the flag above his head fits in the frame
const FLAG_ARM_RAISE = 1.15
const FLAG_FOREARM_BEND = 0.95
const FLAG_HEADROOM = 1.8
const POLE_LENGTH = 1.0
const POLE_GRIP = 0.12 // how far above the bottom of the pole the hand holds it
const CLOTH_W = 0.46
const CLOTH_H = 0.31

const X_AXIS = new THREE.Vector3(1, 0, 0)
const Z_AXIS = new THREE.Vector3(0, 0, 1)
// The model's own side-to-side and front-to-back axes, updated as it turns
const sideAxis = new THREE.Vector3()
const frontAxis = new THREE.Vector3()
const tmpParentQuat = new THREE.Quaternion()
const tmpDelta = new THREE.Quaternion()

// Set a bone to its rest pose rotated about a world-space axis through its pivot.
// Working in world space avoids depending on the rig's per-bone local axes;
// callers pass axes already turned to match the Mii's heading.
const poseBone = (bone, rest, axis, angle) => {
    if (!bone) return
    bone.parent.getWorldQuaternion(tmpParentQuat)
    tmpDelta.setFromAxisAngle(axis, angle)
    // express the world rotation in the parent's space
    tmpDelta.premultiply(tmpParentQuat.clone().invert()).multiply(tmpParentQuat)
    bone.quaternion.copy(rest).premultiply(tmpDelta)
}

/**
 * Renders Morgan's 3D Mii into a small transparent canvas.
 * `stateRef.current` is read every frame: { walking: boolean, heading: radians, busy: boolean },
 * plus an optional `waveNow` flag that starts a wave immediately (it's cleared once read).
 * While `busy` (e.g. going through a door) the Mii won't start waving.
 * heading 0 faces the camera; positive turns towards screen-right.
 * `flag` (an image URL, optional) puts a flag on a pole in his left hand; null lowers it again.
 * Pass `holdsFlag` to frame the Mii with room for the flag above his head.
 */
const MiiModel = ({ stateRef, onReady, flag = null, holdsFlag = false }) => {
    const mountRef = useRef(null)
    const setFlagRef = useRef(null)

    useEffect(() => {
        const mount = mountRef.current
        let renderer
        try {
            // high-density phone screens are sharp enough without antialiasing, which is costly there
            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: window.devicePixelRatio < 2 })
        } catch {
            return // no WebGL: the sprite fallback stays visible
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        mount.appendChild(renderer.domElement)

        const scene = new THREE.Scene()
        // Orthographic so the Mii is drawn in the same flat projection as the street.
        // Framed once the model loads, from its real size.
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50)
        let visible = 1.3 // world-space height shown by the camera
        let aspect = 1
        const updateFrustum = () => {
            camera.top = visible / 2
            camera.bottom = -visible / 2
            camera.left = (-visible / 2) * aspect
            camera.right = (visible / 2) * aspect
            camera.updateProjectionMatrix()
        }

        scene.add(new THREE.HemisphereLight(0xffffff, 0xc9d6dc, 2.2))
        const sun = new THREE.DirectionalLight(0xffffff, 1.6)
        sun.position.set(1.5, 3, 2.5)
        scene.add(sun)

        const pivot = new THREE.Group() // turns the Mii to face its walking direction
        scene.add(pivot)

        const bones = {}
        const rest = {}
        let disposed = false

        // The flag: a white pole with a gold knob, and a cloth hinged on the pole that ripples
        const flagGroup = new THREE.Group()
        flagGroup.visible = false
        scene.add(flagGroup)
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.012, 0.012, POLE_LENGTH, 10),
            new THREE.MeshLambertMaterial({ color: 0xf4f4f4 })
        )
        pole.position.y = POLE_LENGTH / 2 - POLE_GRIP
        flagGroup.add(pole)
        const knob = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 10), new THREE.MeshLambertMaterial({ color: 0xf2c230 }))
        knob.position.y = POLE_LENGTH - POLE_GRIP
        flagGroup.add(knob)
        const clothGeo = new THREE.PlaneGeometry(CLOTH_W, CLOTH_H, 20, 10)
        clothGeo.translate(CLOTH_W / 2, 0, 0) // hinge the cloth on the pole
        const clothRest = clothGeo.attributes.position.array.slice()
        const clothMat = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide })
        const cloth = new THREE.Mesh(clothGeo, clothMat)
        cloth.position.set(0.012, POLE_LENGTH - POLE_GRIP - 0.012 - CLOTH_H / 2, 0)
        flagGroup.add(cloth)
        let flagWanted = false
        const flagTextures = {}
        const loadFlag = async (url) => {
            if (!flagTextures[url]) {
                flagTextures[url] = (async () => {
                    // the SVGs have no width/height, which some browsers need before drawing them to a canvas
                    const svg = (await (await fetch(url)).text()).replace("<svg ", '<svg width="640" height="480" ')
                    const blobUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }))
                    const img = new Image()
                    img.src = blobUrl
                    await img.decode()
                    const canvas = document.createElement("canvas")
                    canvas.width = 512
                    canvas.height = 384
                    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height)
                    URL.revokeObjectURL(blobUrl)
                    const texture = new THREE.CanvasTexture(canvas)
                    texture.colorSpace = THREE.SRGBColorSpace
                    texture.anisotropy = 4
                    return texture
                })()
            }
            return flagTextures[url]
        }
        let flagRequest = 0
        setFlagRef.current = (url) => {
            const request = ++flagRequest
            if (!url) {
                flagWanted = false
                return
            }
            loadFlag(url)
                .then((texture) => {
                    if (disposed || request !== flagRequest) return
                    clothMat.map = texture
                    clothMat.needsUpdate = true
                    flagWanted = true
                })
                .catch(() => { }) // no flag if it can't load; the Mii just stands as usual
        }

        new GLTFLoader().load(miiModelUrl, (gltf) => {
            if (disposed) return
            pivot.add(gltf.scene)

            const box = new THREE.Box3().setFromObject(gltf.scene)
            visible = ((box.max.y - box.min.y) / FILL) * (holdsFlag ? FLAG_HEADROOM : 1)
            const aimY = box.min.y - FOOT_MARGIN * visible + visible / 2
            const distance = 10
            camera.position.set(0, aimY + Math.sin(CAMERA_TILT) * distance, Math.cos(CAMERA_TILT) * distance)
            camera.lookAt(0, aimY, 0)
            updateFrustum()
            gltf.scene.traverse((obj) => {
                if (obj.isBone || ["Arm_1_L", "Arm_1_R", "Arm_2_L", "Arm_2_R", "Wrist_L", "Leg_1_L", "Leg_1_R", "Leg_2_L", "Leg_2_R", "Spine_1", "Head"].includes(obj.name)) {
                    bones[obj.name] = obj
                    rest[obj.name] = obj.quaternion.clone()
                }
                if (obj.isMesh) obj.frustumCulled = false // skinned bounds are unreliable
            })
            onReady?.()
        })

        const resize = () => {
            const { clientWidth: w, clientHeight: h } = mount
            if (!w || !h) return
            renderer.setSize(w, h, false)
            aspect = w / h
            updateFrustum()
        }
        const observer = new ResizeObserver(resize)
        observer.observe(mount)
        resize()

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        let phase = 0
        let walkBlend = 0
        let heading = 0
        let idleTime = 0
        let waveTime = -1 // seconds into the current wave, or -1 when not waving
        let waveBlend = 0
        let flagBlend = 0
        let last = performance.now()
        let frame
        let skipNext = false

        const tick = (now) => {
            const state = stateRef.current
            // Standing still the Mii only breathes, so draw every other frame to save work on phones
            const settled = !state.walking && !state.busy && walkBlend < 0.01 && waveTime < 0 && waveBlend < 0.01
            if (settled && skipNext) {
                skipNext = false
                frame = requestAnimationFrame(tick)
                return
            }
            skipNext = settled

            const dt = Math.min((now - last) / 1000, 0.05)
            last = now

            // Ease into and out of the walk so starts and stops aren't abrupt
            walkBlend += ((state.walking && !reduceMotion ? 1 : 0) - walkBlend) * Math.min(1, dt * 10)
            phase += dt * WALK_CYCLE_SPEED * walkBlend

            if (state.walking || state.busy) {
                idleTime = 0
                waveTime = -1
            } else {
                idleTime += dt
            }
            // a page can ask for a wave straight away (e.g. the About Me page when you pick something)
            if (state.waveNow) {
                state.waveNow = false
                if (!state.walking) waveTime = 0
            }
            if (waveTime < 0 && idleTime > WAVE_AFTER) waveTime = 0
            if (waveTime >= 0) {
                waveTime += dt
                if (waveTime > WAVE_DURATION) {
                    waveTime = -1
                    idleTime = 0
                }
            }
            // Ease the arm up at the start of the wave and back down at the end
            const waving = waveTime >= 0 && waveTime < WAVE_DURATION - 0.35
            waveBlend += ((waving ? 1 : 0) - waveBlend) * Math.min(1, dt * 7)

            // Turn the shortest way round towards the target heading (facing the camera to wave)
            let diff = (waving ? 0 : state.heading) - heading
            diff = Math.atan2(Math.sin(diff), Math.cos(diff))
            heading += diff * Math.min(1, dt * TURN_SPEED)
            pivot.rotation.y = heading

            if (bones.Arm_1_L) {
                sideAxis.copy(X_AXIS).applyQuaternion(pivot.quaternion)
                frontAxis.copy(Z_AXIS).applyQuaternion(pivot.quaternion)
                const swing = Math.sin(phase) * walkBlend
                const breathe = reduceMotion ? 0 : Math.sin(now / 900) * 0.03

                pivot.updateMatrixWorld(true)
                pivot.position.y = Math.abs(Math.sin(phase)) * 0.03 * walkBlend
                pivot.rotation.z = Math.sin(phase) * WADDLE * walkBlend
                poseBone(bones.Spine_1, rest.Spine_1, sideAxis, 0.04 * walkBlend)
                poseBone(bones.Head, rest.Head, sideAxis, breathe * 0.5)

                // The model's left arm sits on +X, so it tucks in with a negative rotation
                // (and lifts out to hold a flag with a positive one)
                flagBlend += ((flagWanted ? 1 : 0) - flagBlend) * Math.min(1, dt * 6)
                poseBone(bones.Arm_1_L, rest.Arm_1_L, frontAxis, THREE.MathUtils.lerp(-(ARM_TUCK + breathe), FLAG_ARM_RAISE, flagBlend))
                poseBone(bones.Arm_1_R, rest.Arm_1_R, frontAxis,
                    THREE.MathUtils.lerp(ARM_TUCK + breathe, WAVE_ARM_RAISE, waveBlend))
                bones.Arm_1_L.updateMatrixWorld(true)
                bones.Arm_1_R.updateMatrixWorld(true)
                // then swing them forward/back, opposite to the legs
                // (positive rotation about the side axis swings a hanging limb backwards)
                poseBone(bones.Arm_1_L, bones.Arm_1_L.quaternion.clone(), sideAxis, swing * ARM_SWING * (1 - flagBlend * 0.7))
                poseBone(bones.Arm_1_R, bones.Arm_1_R.quaternion.clone(), sideAxis, -swing * ARM_SWING)

                poseBone(bones.Leg_1_L, rest.Leg_1_L, sideAxis, -swing * LEG_SWING)
                poseBone(bones.Leg_1_R, rest.Leg_1_R, sideAxis, swing * LEG_SWING)
                bones.Leg_1_L.updateMatrixWorld(true)
                bones.Leg_1_R.updateMatrixWorld(true)
                // wave the right forearm side to side
                bones.Arm_1_R.updateMatrixWorld(true)
                const wag = reduceMotion ? 0 : Math.sin(now / 1000 * WAVE_SPEED) * 0.5
                poseBone(bones.Arm_2_R, rest.Arm_2_R, frontAxis, wag * waveBlend)
                bones.Arm_1_L.updateMatrixWorld(true)
                poseBone(bones.Arm_2_L, rest.Arm_2_L, frontAxis, FLAG_FOREARM_BEND * flagBlend)

                // bend the knee of whichever leg is trailing behind
                poseBone(bones.Leg_2_L, rest.Leg_2_L, sideAxis, Math.max(0, -swing) * KNEE_BEND)
                poseBone(bones.Leg_2_R, rest.Leg_2_R, sideAxis, Math.max(0, swing) * KNEE_BEND)
            }

            // Keep the flag in his left hand, upright, turning with him; the cloth ripples in the breeze
            flagGroup.visible = flagBlend > 0.05 && Boolean(bones.Wrist_L)
            if (flagGroup.visible) {
                bones.Wrist_L.updateMatrixWorld(true)
                bones.Wrist_L.getWorldPosition(flagGroup.position)
                flagGroup.quaternion.copy(pivot.quaternion)
                flagGroup.scale.setScalar(flagBlend)
                const t = now / 1000
                const pos = clothGeo.attributes.position
                for (let i = 0; i < pos.count; i++) {
                    const x = clothRest[i * 3]
                    const along = x / CLOTH_W // pinned at the pole, freest at the far edge
                    const ripple = reduceMotion ? 0 : Math.sin(x * 11 - t * 6) * 0.04 * along
                    pos.setZ(i, ripple)
                    pos.setY(i, clothRest[i * 3 + 1] - along * along * 0.03)
                }
                pos.needsUpdate = true
                clothGeo.computeVertexNormals()
            }

            renderer.render(scene, camera)
            frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)

        return () => {
            disposed = true
            setFlagRef.current = null
            Object.values(flagTextures).forEach((p) => p.then((t) => t.dispose()).catch(() => { }))
            cancelAnimationFrame(frame)
            observer.disconnect()
            scene.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose()
                const mats = obj.material ? [].concat(obj.material) : []
                mats.forEach((m) => {
                    Object.values(m).forEach((v) => v?.isTexture && v.dispose())
                    m.dispose()
                })
            })
            renderer.dispose()
            renderer.domElement.remove()
        }
    }, [stateRef, onReady, holdsFlag])

    // hand the flag to the scene (after the scene effect above has set it up)
    useEffect(() => {
        setFlagRef.current?.(flag)
    }, [flag, holdsFlag])

    return <div className="plaza-mii-3d" ref={mountRef} />
}

export default MiiModel
