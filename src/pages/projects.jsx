import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion"
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import "../styles/street.css"
import wiiPartyMusic from "../assets/audio/wiiParty.mp3"
import miiSprite from "../assets/imgs/plaza/mii.webp"
import clickCursor from "../assets/imgs/cursor-normal2.png"
import nfllogo from "../assets/imgs/screenshots-and-media/NFL-Logo.png"
import wiiThumb from "../assets/imgs/plaza/wii-portfolio.webp"
import NflApp from "./NflApp"
import WiiPortfolio from "./WiiPortfolio"
import CardiffAutonomousRacing from "./CardiffAutonomousRacing"
import Cainan from "./Cainan"
import IbmTechXchange from "./IbmTechXchange"
import ibmLogo from "../assets/imgs/projects/ibm/ibm-logo.svg"
import carThumb from "../assets/imgs/aboutMePage/team1.png"
import cainanLogo from "../assets/imgs/projects/cainan/cainan-logo.png"
import ContactMe from "./components/contactMe"
import ShopFront, { ConstructionSite, PostBox, PhoneBox, RaceCar, TrackCone, SHOP_WIDTH, SHOP_HEIGHT, SHOP_DOOR_X } from "./components/shopFront"

// three.js is large, so the 3D Mii loads separately; the sprite shows until it is ready
// (if it fails to load, e.g. on a flaky connection, the sprite simply stays)
const MiiModel = lazy(() => import("./components/miiModel").catch(() => ({ default: () => null })))

/*
 * Shops on Project Street, newest first: the architecture gets older the further you walk.
 * Add a project by adding an entry in date order:
 *  - `Content` renders inside the shop when you go in
 *  - `date` and `subtitle` show in the bubble when the Mii walks up
 *  - `era` is the building's architecture: "modern", "deco", "victorian", "georgian" or "tudor"
 *  - `scene` sets the window display around `thumb`: "laptop", "tv", "stage", "phone" or "photo";
 *    without one the window just shows `thumb` (`thumbFit: "contain"` suits logos)
 */
const SHOPS = [
    {
        id: "cainan",
        title: "Cainan Studio",
        subtitle: "My software studio",
        date: "2026",
        thumb: cainanLogo,
        scene: "laptop",
        color: "#2A3550",
        era: "modern",
        Content: Cainan,
    },
    {
        id: "wii-portfolio",
        title: "Wii Portfolio",
        subtitle: "This site!",
        date: "Nov 2025",
        thumb: wiiThumb,
        scene: "tv",
        color: "#34beed",
        era: "deco",
        Content: WiiPortfolio,
    },
    {
        id: "ibm-techxchange",
        title: "IBM TechXChange",
        subtitle: "Invited guest speaker",
        date: "Oct 2025",
        thumb: ibmLogo,
        scene: "stage",
        color: "#1f70c1",
        era: "victorian",
        Content: IbmTechXchange,
    },
    {
        id: "nfl",
        title: "NFL Superfan",
        subtitle: "Android app",
        date: "2024",
        thumb: nfllogo,
        scene: "phone",
        color: "#d4343b",
        era: "georgian",
        Content: NflApp,
    },
    {
        id: "cardiff-autonomous-racing",
        title: "Autonomous Racing",
        subtitle: "Founder & Team Principal",
        date: "Sep 2024",
        thumb: carThumb,
        scene: "photo",
        color: "#c8102e",
        era: "tudor",
        Content: CardiffAutonomousRacing,
    },
]

// The street is laid out in world units. The window always shows the full 900-unit height
// (anchored to the bottom, with extra sky above on tall screens) and as much width as fits,
// but never less than MIN_VIEW_W so phones in portrait still see a whole shop.
const VIEW_H = 900
const MIN_VIEW_W = 700
const STREET_START = 380 // space before the first shop (the building site sits here)
const SHOP_SPACING = SHOP_WIDTH // a terrace: buildings stand shoulder to shoulder
const SHOP_BASE_Y = 560 // where shopfronts meet the pavement
const WORLD_W = STREET_START * 2 + SHOPS.length * SHOP_SPACING
const PAVEMENT = { minX: 70, maxX: WORLD_W - 70, minY: 610, maxY: 770 }
const SPAWN = { x: 170, y: 690 }

const WALK_SPEED = 440 // world units per second
const DOOR_RANGE = 85 // how close (horizontally) to a door counts as "outside the shop"
const DOOR_FRONT_Y = 618

const shopLeft = (i) => STREET_START + i * SHOP_SPACING
const doorX = (i) => shopLeft(i) + SHOP_DOOR_X
// the building site butts up against the first shop
const SITE = { x: STREET_START - 200, width: 200, height: 480 }
// a post box on the kerb at the start of the street: walk up to it to send Morgan a message
const POST_BOX = { x: STREET_START - 110, kerb: 806, width: 44, height: 96, range: 50 }
// a red phone box at the old end of the street
const PHONE_BOX = { x: shopLeft(SHOPS.length) + 60, width: 70, height: 170 }
// the team's race car parked on the road outside Autonomous Racing, with track cones either side
const CAR_INDEX = SHOPS.findIndex((s) => s.id === "cardiff-autonomous-racing")
const RACE_CAR = { x: shopLeft(CAR_INDEX) + 220, kerb: 846, width: 240, height: 80 }
const CONES = [
    { x: RACE_CAR.x - 150, color: "#ffc93c" },
    { x: RACE_CAR.x + 150, color: "#3f7fe0" },
]
// simple cars driving along the road: colour, seconds to cross the street, start offset
const TRAFFIC = [
    { id: "a", color: "#ff8fb8", secs: 26, delay: 0 },
    { id: "b", color: "#34beed", secs: 34, delay: -12 },
    { id: "c", color: "#ffc93c", secs: 30, delay: -22 },
]

// world units -> CSS length (--u is the pixel size of one unit, set on the stage)
const u = (v) => `calc(${v} * var(--u))`
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
const clampToPavement = ({ x, y }) => ({ x: clamp(x, PAVEMENT.minX, PAVEMENT.maxX), y: clamp(y, PAVEMENT.minY, PAVEMENT.maxY) })
// Follow the Mii, stopping at the street ends; if the whole street fits, centre it
const cameraFor = (x, viewW) =>
    WORLD_W <= viewW ? (WORLD_W - viewW) / 2 : clamp(x - viewW / 2, 0, WORLD_W - viewW)

// The Mii and camera move every frame, so they're positioned by writing transforms straight to the DOM
// rather than through React state (re-rendering the whole street 60 times a second is too slow on phones)
// (plain pixels from the current unit size: cheaper for the browser to apply than calc())
const worldTransform = (cam, unit) => `translate3d(${-cam * unit}px, 0, 0)`
const skylineTransform = (cam, unit) => `translate3d(${-cam * 0.35 * unit}px, 0, 0)`
const miiTransform = ({ x, y }, unit) => `translate3d(${x * unit}px, ${y * unit}px, 0)`

// Intro zoom: scale the stage so the Mii's head sits in the upper part of the screen, clear of the dialogue
const introZoomTransform = (pos, cam, view) => {
    const w = window.innerWidth
    const h = window.innerHeight
    const scale = clamp((0.4 * h) / (170 * view.unit), 1.3, 2.4)
    const headX = (pos.x - cam) * view.unit
    const headY = view.worldTop + (pos.y - 120) * view.unit
    // aim for the head, but never slide the scaled stage so far that an edge of the screen is left empty
    const tx = clamp(w / 2 - headX * scale, w - w * scale, 0)
    const ty = clamp(h * 0.36 - headY * scale, h - h * scale, 0)
    return `translate(${tx}px, ${ty}px) scale(${scale})`
}

const measureView = () => {
    const w = window.innerWidth
    const h = window.innerHeight
    const unit = Math.min(h / VIEW_H, w / MIN_VIEW_W)
    return { unit, viewW: w / unit, worldTop: h - VIEW_H * unit }
}

const KEY_DIRS = {
    ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
    ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
    ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
    ArrowRight: [1, 0], d: [1, 0], D: [1, 0],
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Intro chat, shown once per visit while the camera zooms in on the Mii
const INTRO_LINES = [
    "Hi, I'm Morgan! Welcome to Project Street.",
    "This is where I keep my past projects and experience. The newest are at this end, and the street gets older as you walk.",
    "Click a shop to go inside, or walk up to it and press Enter. You can also send me a message at the post box.",
    "Have a wander and enjoy!",
]
const INTRO_SEEN_KEY = "project-street-intro-seen"
const introSeen = () => {
    try {
        return sessionStorage.getItem(INTRO_SEEN_KEY) === "1"
    } catch {
        return false
    }
}

const Projects = ({ onExit }) => {
    const stageRef = useRef(null)
    const posRef = useRef(SPAWN)
    const targetRef = useRef(null)
    const pendingShopRef = useRef(null)
    const keysRef = useRef(new Set())
    // "walk" while exploring; "busy" while a door transition plays or a shop is open
    const [introStep, setIntroStep] = useState(() => (introSeen() ? null : 0))
    const [introZoom, setIntroZoom] = useState(false)
    const [typed, setTyped] = useState(0)
    const modeRef = useRef(introStep === null ? "walk" : "busy")
    const miiStateRef = useRef({ walking: false, heading: 0, busy: false })
    const mountedRef = useRef(true)

    const [view, setView] = useState(measureView)
    const viewRef = useRef(view)
    const camRef = useRef(cameraFor(SPAWN.x, view.viewW))
    const worldRef = useRef(null)
    const skylineRef = useRef(null)
    const miiAnchorRef = useRef(null)
    const [isWalking, setIsWalking] = useState(false)
    const walkingRef = useRef(false)
    const [nearIndex, setNearIndex] = useState(-1)
    const nearIndexRef = useRef(-1)
    const nearPostRef = useRef(false)
    const [openDoor, setOpenDoor] = useState(null)
    const [miiInside, setMiiInside] = useState(false)
    const [openShop, setOpenShop] = useState(null)
    const [nearPost, setNearPost] = useState(false)
    const [contactOpen, setContactOpen] = useState(false)
    const pendingPostRef = useRef(false)
    const [modelReady, setModelReady] = useState(false)
    const handleModelReady = useCallback(() => setModelReady(true), [])

    // Circle-wipe transition, centred on the door being entered
    const irisRadius = useMotionValue(0)
    const [irisCenter, setIrisCenter] = useState(null)
    const irisRadiusPx = useTransform(irisRadius, (r) => `${r}px`)

    useEffect(() => {
        const onResize = () => {
            const next = measureView()
            viewRef.current = next
            setView(next)
        }
        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)
    }, [])

    useEffect(() => {
        mountedRef.current = true
        const music = new Audio(wiiPartyMusic)
        music.loop = true
        music.volume = 0.35
        music.play().catch(() => { })
        return () => {
            mountedRef.current = false
            music.pause()
        }
    }, [])

    const irisTo = useCallback(
        (radius, duration) => animate(irisRadius, radius, { duration, ease: [0.65, 0, 0.35, 1] }),
        [irisRadius]
    )

    const doorCenter = (index) => {
        const rect = stageRef.current
            ?.querySelector(`[data-shop-index="${index}"] .shop-door-anchor`)
            ?.getBoundingClientRect()
        return rect
            ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
            : { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    }
    const fullRadius = () => Math.hypot(window.innerWidth, window.innerHeight)

    // Turn to the door, step inside, wipe to the shop
    const enterShop = useCallback(async (index) => {
        if (modeRef.current !== "walk") return
        modeRef.current = "busy"
        miiStateRef.current.busy = true
        keysRef.current.clear()
        targetRef.current = null
        pendingShopRef.current = null

        miiStateRef.current.heading = Math.PI
        setOpenDoor(index)
        await wait(380)
        if (!mountedRef.current) return
        setMiiInside(true)
        await wait(420)
        if (!mountedRef.current) return

        setIrisCenter(doorCenter(index))
        irisRadius.set(fullRadius())
        await irisTo(0, 0.55)
        if (!mountedRef.current) return

        setOpenShop(SHOPS[index])
        setIrisCenter({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
        await irisTo(fullRadius(), 0.5)
        if (mountedRef.current) setIrisCenter(null)
    }, [irisRadius, irisTo])

    // Wipe back to the street, step out of the door and turn round
    const leaveShop = useCallback(async () => {
        if (!openShop) return
        const index = SHOPS.indexOf(openShop)
        setIrisCenter({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
        irisRadius.set(fullRadius())
        await irisTo(0, 0.45)
        if (!mountedRef.current) return

        setOpenShop(null)
        setIrisCenter(doorCenter(index))
        await irisTo(fullRadius(), 0.5)
        if (!mountedRef.current) return
        setIrisCenter(null)

        setMiiInside(false)
        miiStateRef.current.heading = 0
        targetRef.current = { x: doorX(index), y: DOOR_FRONT_Y + 50 }
        modeRef.current = "walk"
        miiStateRef.current.busy = false
        await wait(450)
        if (mountedRef.current) setOpenDoor(null)
    }, [openShop, irisRadius, irisTo])

    // Intro chat: zoom in, type each line out, then zoom back out and let the player walk
    const introLine = introStep === null ? "" : INTRO_LINES[introStep]

    useEffect(() => {
        if (introStep === null) return
        const timer = setTimeout(() => setIntroZoom(introZoomTransform(posRef.current, camRef.current, viewRef.current)), 300)
        return () => clearTimeout(timer)
    }, [introStep === null]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (introStep === null) return
        const timer = setInterval(() => {
            setTyped((n) => {
                if (n >= INTRO_LINES[introStep].length) {
                    clearInterval(timer)
                    return n
                }
                return n + 1
            })
        }, 24)
        return () => clearInterval(timer)
    }, [introStep])

    const endIntro = useCallback(() => {
        setIntroStep(null)
        setIntroZoom(false)
        modeRef.current = "walk"
        try {
            sessionStorage.setItem(INTRO_SEEN_KEY, "1")
        } catch {
            // private mode: the intro will just show again next time
        }
    }, [])

    const advanceIntro = useCallback(() => {
        if (introStep === null) return
        if (typed < INTRO_LINES[introStep].length) {
            setTyped(INTRO_LINES[introStep].length)
        } else if (introStep < INTRO_LINES.length - 1) {
            setTyped(0)
            setIntroStep(introStep + 1)
        } else {
            endIntro()
        }
    }, [introStep, typed, endIntro])

    // The post box opens the contact form; the Mii stays put while it's open
    const openContact = useCallback(() => {
        if (modeRef.current !== "walk") return
        modeRef.current = "busy"
        keysRef.current.clear()
        targetRef.current = null
        pendingPostRef.current = false
        setContactOpen(true)
    }, [])

    const closeContact = useCallback(() => {
        setContactOpen(false)
        modeRef.current = "walk"
    }, [])

    // Place the world, skyline and Mii before the first paint, and again whenever the window resizes
    useLayoutEffect(() => {
        worldRef.current.style.transform = worldTransform(camRef.current, view.unit)
        skylineRef.current.style.transform = skylineTransform(camRef.current, view.unit)
        miiAnchorRef.current.style.transform = miiTransform(posRef.current, view.unit)
    }, [view])

    // Game loop: move the Mii from keyboard input or towards a clicked target
    useEffect(() => {
        let frame
        let last = performance.now()

        const tick = (now) => {
            const dt = Math.min((now - last) / 1000, 0.05)
            last = now
            const pos = posRef.current
            let next = pos

            if (modeRef.current === "walk") {
                let dx = 0
                let dy = 0
                keysRef.current.forEach((k) => {
                    const dir = KEY_DIRS[k]
                    if (dir) { dx += dir[0]; dy += dir[1] }
                })

                if (dx || dy) {
                    targetRef.current = null
                    pendingShopRef.current = null
                    pendingPostRef.current = false
                    const len = Math.hypot(dx, dy)
                    next = { x: pos.x + (dx / len) * WALK_SPEED * dt, y: pos.y + (dy / len) * WALK_SPEED * dt }
                } else if (targetRef.current) {
                    const t = targetRef.current
                    const dist = Math.hypot(t.x - pos.x, t.y - pos.y)
                    const step = WALK_SPEED * dt
                    if (dist <= step) {
                        next = t
                        targetRef.current = null
                    } else {
                        next = { x: pos.x + ((t.x - pos.x) / dist) * step, y: pos.y + ((t.y - pos.y) / dist) * step }
                    }
                }
            }

            next = clampToPavement(next)
            const moved = Math.hypot(next.x - pos.x, next.y - pos.y) > 0.01
            // heading 0 faces the camera (down the screen), PI/2 faces right
            if (moved) miiStateRef.current.heading = Math.atan2(next.x - pos.x, next.y - pos.y)
            miiStateRef.current.walking = moved
            if (moved) {
                posRef.current = next
                miiAnchorRef.current.style.transform = miiTransform(next, viewRef.current.unit)
            }
            if (moved !== walkingRef.current) {
                walkingRef.current = moved
                setIsWalking(moved)
            }

            const cam = camRef.current
            const goal = cameraFor(posRef.current.x, viewRef.current.viewW)
            const eased = cam + (goal - cam) * Math.min(1, dt * 6)
            const nextCam = Math.abs(goal - eased) < 0.1 ? goal : eased
            if (nextCam !== cam) {
                camRef.current = nextCam
                worldRef.current.style.transform = worldTransform(nextCam, viewRef.current.unit)
                skylineRef.current.style.transform = skylineTransform(nextCam, viewRef.current.unit)
            }

            if (modeRef.current === "walk") {
                let near = -1
                SHOPS.forEach((_, i) => {
                    if (Math.abs(doorX(i) - posRef.current.x) < DOOR_RANGE) near = i
                })
                if (near !== nearIndexRef.current) {
                    nearIndexRef.current = near
                    setNearIndex(near)
                }
                const atPost = near < 0 && Math.abs(POST_BOX.x - posRef.current.x) < POST_BOX.range
                if (atPost !== nearPostRef.current) {
                    nearPostRef.current = atPost
                    setNearPost(atPost)
                }

                // Arrived at the post box after clicking it
                if (!targetRef.current && pendingPostRef.current) {
                    pendingPostRef.current = false
                    if (atPost) openContact()
                }

                // Arrived at a shop that was clicked on
                if (!targetRef.current && pendingShopRef.current !== null) {
                    const index = pendingShopRef.current
                    pendingShopRef.current = null
                    if (near === index) enterShop(index)
                }
            }

            frame = requestAnimationFrame(tick)
        }

        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [enterShop, openContact])

    // Keyboard controls
    useEffect(() => {
        const onKeyDown = (e) => {
            if (introStep !== null) {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    advanceIntro()
                } else if (e.key === "Escape") {
                    endIntro()
                }
                return
            }
            // typing in the contact form must not walk the Mii
            if (contactOpen) return
            if (openShop) {
                if (e.key === "Escape" || e.key === "Backspace") leaveShop()
                return
            }
            if (modeRef.current !== "walk") return
            if (KEY_DIRS[e.key]) {
                e.preventDefault()
                keysRef.current.add(e.key)
            } else if ((e.key === "Enter" || e.key === " ") && nearIndex >= 0) {
                e.preventDefault()
                enterShop(nearIndex)
            } else if ((e.key === "Enter" || e.key === " ") && nearPost) {
                e.preventDefault()
                openContact()
            }
        }
        const onKeyUp = (e) => keysRef.current.delete(e.key)
        const onBlur = () => keysRef.current.clear()

        window.addEventListener("keydown", onKeyDown)
        window.addEventListener("keyup", onKeyUp)
        window.addEventListener("blur", onBlur)
        return () => {
            window.removeEventListener("keydown", onKeyDown)
            window.removeEventListener("keyup", onKeyUp)
            window.removeEventListener("blur", onBlur)
        }
    }, [nearIndex, nearPost, openShop, contactOpen, introStep, enterShop, leaveShop, openContact, advanceIntro, endIntro])

    const toWorld = (clientX, clientY) => {
        const rect = stageRef.current.getBoundingClientRect()
        return {
            x: (clientX - rect.left) / view.unit + camRef.current,
            y: (clientY - rect.top - view.worldTop) / view.unit,
        }
    }

    // Click/tap the pavement to walk there
    const handleStageClick = (e) => {
        if (modeRef.current !== "walk") return
        targetRef.current = clampToPavement(toWorld(e.clientX, e.clientY))
        pendingShopRef.current = null
        pendingPostRef.current = false
    }

    // Click/tap a shop to walk to its door and go in
    const handleShopClick = (e, index) => {
        e.stopPropagation()
        if (modeRef.current !== "walk") return
        if (nearIndex === index) {
            enterShop(index)
            return
        }
        targetRef.current = { x: doorX(index), y: DOOR_FRONT_Y }
        pendingShopRef.current = index
    }

    // Click/tap the post box to walk over and post a letter
    const handlePostClick = (e) => {
        e.stopPropagation()
        if (modeRef.current !== "walk") return
        if (nearPost) {
            openContact()
            return
        }
        targetRef.current = { x: POST_BOX.x, y: PAVEMENT.maxY }
        pendingShopRef.current = null
        pendingPostRef.current = true
    }

    const OpenContent = openShop?.Content

    return (
        <motion.div
            className="street-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div
                className="street-stage"
                ref={stageRef}
                onClick={handleStageClick}
                style={{
                    "--u": `${view.unit}px`,
                    "--world-top": `${view.worldTop}px`,
                    // during the intro the camera zooms in on the Mii's face
                    transformOrigin: "0 0",
                    transform: introZoom || "none",
                }}
            >
                {/* clouds drifting and birds flying across the sky */}
                <div className="street-clouds" aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                        <span key={i} className="street-cloud" />
                    ))}
                    {[0, 1].map((i) => (
                        <span key={`bird${i}`} className="street-sky-bird" />
                    ))}
                </div>

                {/* far skyline scrolls slower than the street for depth */}
                <div className="street-skyline" ref={skylineRef} />

                <div className="street-world" ref={worldRef} style={{ width: u(WORLD_W) }}>
                    <div className="street-pavement" />
                    <div className="street-road" />

                    <span
                        className="street-construction"
                        style={{ left: u(SITE.x), top: u(SHOP_BASE_Y - SITE.height), width: u(SITE.width) }}
                        aria-hidden="true"
                    >
                        <ConstructionSite />
                    </span>

                    {SHOPS.map((shop, i) => {
                        const isNear = nearIndex === i && !openShop
                        return (
                            <button
                                key={shop.id}
                                type="button"
                                data-shop-index={i}
                                className={`street-shop ${isNear ? "is-near" : ""}`}
                                style={{
                                    left: u(shopLeft(i)),
                                    top: u(SHOP_BASE_Y - SHOP_HEIGHT),
                                    width: u(SHOP_WIDTH),
                                    "--shop-color": shop.color,
                                }}
                                onClick={(e) => handleShopClick(e, i)}
                                aria-label={`Go into ${shop.title} - ${shop.subtitle}${shop.date ? ` (${shop.date})` : ""}`}
                            >
                                <ShopFront item={shop} isOpen={openDoor === i} />
                                <span className="shop-door-anchor" aria-hidden="true" />

                            </button>
                        )
                    })}

                    <span
                        className="street-prop"
                        style={{ left: u(RACE_CAR.x), top: u(RACE_CAR.kerb - RACE_CAR.height), width: u(RACE_CAR.width) }}
                        aria-hidden="true"
                    >
                        <RaceCar />
                    </span>
                    {CONES.map((cone) => (
                        <span
                            key={cone.x}
                            className="street-prop"
                            style={{ left: u(cone.x), top: u(RACE_CAR.kerb - 28), width: u(24) }}
                            aria-hidden="true"
                        >
                            <TrackCone color={cone.color} />
                        </span>
                    ))}

                    {TRAFFIC.map((car) => (
                        <span
                            key={car.id}
                            className="street-car"
                            style={{
                                top: u(856),
                                "--car-color": car.color,
                                "--drive-dist": u(WORLD_W + 240),
                                animationDuration: `${car.secs}s`,
                                animationDelay: `${car.delay}s`,
                            }}
                            aria-hidden="true"
                        />
                    ))}
                    <button
                        type="button"
                        className={`street-postbox ${nearPost && !contactOpen ? "is-near" : ""}`}
                        style={{ left: u(POST_BOX.x), top: u(POST_BOX.kerb - POST_BOX.height), width: u(POST_BOX.width) }}
                        onClick={handlePostClick}
                        aria-label="Post box: send Morgan a message"
                    >
                        <PostBox />
                    </button>

                    <span
                        className="street-prop"
                        style={{ left: u(PHONE_BOX.x), top: u(SHOP_BASE_Y + 14 - PHONE_BOX.height), width: u(PHONE_BOX.width) }}
                        aria-hidden="true"
                    >
                        <PhoneBox />
                    </span>

                    {/* the Mii and its speech bubbles, moved together by the game loop */}
                    <div className="street-mii-anchor" ref={miiAnchorRef}>
                        <AnimatePresence>
                            {nearIndex >= 0 && !openShop && !miiInside && (
                                <motion.span
                                    key={nearIndex}
                                    className="street-bubble"
                                    style={{ top: u(-170) }}
                                    initial={{ opacity: 0, y: 8, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.9 }}
                                    transition={{ duration: 0.18 }}
                                    aria-hidden="true"
                                >
                                    <span className="street-bubble-info">
                                        {SHOPS[nearIndex].date && (
                                            <span className="street-bubble-date" style={{ color: SHOPS[nearIndex].color }}>
                                                {SHOPS[nearIndex].date}
                                            </span>
                                        )}
                                        {SHOPS[nearIndex].subtitle}
                                    </span>
                                    <span className="street-bubble-action"><img src={clickCursor} className="street-click-icon" alt="" draggable={false} />Go inside</span>
                                </motion.span>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {nearPost && !contactOpen && !openShop && (
                                <motion.span
                                    key="post"
                                    className="street-bubble"
                                    style={{ top: u(-170) }}
                                    initial={{ opacity: 0, y: 8, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.9 }}
                                    transition={{ duration: 0.18 }}
                                    aria-hidden="true"
                                >
                                    <span className="street-bubble-info">Send Morgan a message</span>
                                    <span className="street-bubble-action"><img src={clickCursor} className="street-click-icon" alt="" draggable={false} />Post a letter</span>
                                </motion.span>
                            )}
                        </AnimatePresence>

                        <div
                            className={`street-mii ${isWalking ? "is-walking" : ""} ${miiInside ? "is-inside" : ""}`}
                            aria-hidden="true"
                        >
                            <span className="street-mii-shadow" />
                            {!modelReady && <img src={miiSprite} alt="" draggable={false} />}
                            <Suspense fallback={null}>
                                <MiiModel stateRef={miiStateRef} onReady={handleModelReady} />
                            </Suspense>
                        </div>
                    </div>
                </div>

                <h1 className="street-title">Project Street</h1>
            </div>

            {!contactOpen && (
                <button type="button" className="street-exit" onClick={onExit}>
                    Exit
                </button>
            )}

            {introStep === null && !contactOpen && <div className="street-hint" aria-hidden="true">
                <span className="street-hint-desktop">
                    <kbd>←</kbd><kbd>→</kbd> or click to walk · <kbd>Enter</kbd> to go inside or post a letter
                </span>
                <span className="street-hint-touch">Tap to walk · tap a shop or the post box</span>
            </div>}

            {openShop && (
                <div className="shop-interior-backdrop" onClick={leaveShop}>
                    <div
                        className="shop-interior"
                        role="dialog"
                        aria-modal="true"
                        aria-label={openShop.title}
                        style={{ "--shop-color": openShop.color }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="shop-interior-sign">{openShop.title}</div>
                        <div className="shop-interior-body">
                            {OpenContent ? (
                                <OpenContent title={openShop.title} thumb={openShop.thumb} />
                            ) : (
                                <div className="shop-interior-empty">
                                    <h2>Opening soon</h2>
                                    <p>The shelves are still being stocked. Something new is on the way - check back soon!</p>
                                </div>
                            )}
                        </div>
                        <div className="shop-interior-footer">
                            <button type="button" className="street-btn" onClick={leaveShop} autoFocus>
                                Leave shop
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ContactMe isOpen={contactOpen} onClose={closeContact} />

            <AnimatePresence>
                {introStep !== null && (
                    <motion.div
                        className="street-intro"
                        role="dialog"
                        aria-label="Welcome to Project Street"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        transition={{ duration: 0.3, delay: introZoom ? 0 : 0.5 }}
                        onClick={advanceIntro}
                    >
                        <span className="street-intro-name">Morgan</span>
                        <p className="street-intro-text" aria-live="polite">
                            {introLine.slice(0, typed)}
                        </p>
                        <div className="street-intro-footer">
                            <button
                                type="button"
                                className="street-intro-skip"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    endIntro()
                                }}
                            >
                                Skip intro
                            </button>
                            <span className="street-intro-progress">
                                {introStep + 1} / {INTRO_LINES.length}
                            </span>
                            <button type="button" className="street-intro-next" onClick={(e) => { e.stopPropagation(); advanceIntro() }} autoFocus>
                                <img src={clickCursor} className="street-click-icon" alt="" draggable={false} />
                                {typed < introLine.length ? "..." : introStep < INTRO_LINES.length - 1 ? "Next" : "Let's go!"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {irisCenter && (
                <motion.div
                    className="street-iris"
                    style={{ "--iris-r": irisRadiusPx, "--iris-x": `${irisCenter.x}px`, "--iris-y": `${irisCenter.y}px` }}
                    aria-hidden="true"
                />
            )}
        </motion.div>
    )
}

export default Projects
