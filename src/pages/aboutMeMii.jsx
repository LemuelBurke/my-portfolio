import { motion, AnimatePresence, MotionConfig } from "framer-motion"
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react"
import "../styles/aboutMeMii.css"
import miiChannelMusic from "../assets/audio/mii-channel-music.mp3"
import miiSprite from "../assets/imgs/plaza/mii.webp"
import Glyph from "./about/Glyph"
import { PROFILE_FIELDS } from "./about/aboutContent"
import { PLACES, ROUTES, SUITCASE, START_ID, HOME_ID } from "./about/aboutPlaces"

// three.js and the map data are large, so the globe and the 3D Mii load separately
const Globe = lazy(() => import("./about/Globe").catch(() => ({ default: () => null })))
const MiiModel = lazy(() => import("./components/miiModel").catch(() => ({ default: () => null })))

// The picture beside an entry: a photo, a whole polaroid, a logo, or an icon tile
const EntryMedia = ({ item }) => {
    const photo = item.photos?.[0] ?? (item.thumbFit === "contain" ? null : item.thumb)
    if (photo) {
        return <img className={item.polaroid ? "world-entry-polaroid" : "world-entry-photo"} src={photo} alt="" draggable={false} />
    }
    if (!item.thumb && !item.icon) return null
    return (
        <span className={`world-entry-tile ${item.thumbFit === "contain" ? "is-logo" : ""}`} aria-hidden="true">
            {item.thumb ? <img src={item.thumb} alt="" draggable={false} /> : <Glyph name={item.icon} />}
        </span>
    )
}

// One entry in a chapter, shown in full: picture, headline, dates, every paragraph, then its photos
const Entry = ({ item }) => {
    const photos = item.photos ?? []
    const bare = Boolean(item.chips) && !item.photos && !item.thumb
    const photoOnly = !item.text && !item.chips
    // entries with photos show them all underneath; the rest keep their logo or icon beside the text
    const showTile = !bare && photos.length === 0

    if (photoOnly) {
        return (
            <article className="world-entry is-photo-only">
                <h4>{item.title}</h4>
                <div className={`world-photos ${item.polaroid ? "are-polaroids" : ""}`}>
                    {photos.map((src) => (
                        <img key={src} src={src} alt="" draggable={false} />
                    ))}
                </div>
            </article>
        )
    }

    return (
        <article className={`world-entry ${showTile ? "has-tile" : ""}`}>
            {showTile && <EntryMedia item={item} />}
            <div className="world-entry-body">
                <h4>{item.title}</h4>
                {item.meta && <p className="world-entry-meta">{item.meta}</p>}
                {item.text?.map((p) => (
                    <p key={p}>{p}</p>
                ))}
                {item.chips && (
                    <ul className="world-chips">
                        {item.chips.map((c) => (
                            <li key={c}>{c}</li>
                        ))}
                    </ul>
                )}
                {photos.length > 0 && (
                    <div className={`world-photos ${item.polaroid ? "are-polaroids" : ""} count-${Math.min(photos.length, 3)}`}>
                        {photos.map((src) => (
                            <img key={src} src={src} alt="" draggable={false} loading="lazy" />
                        ))}
                    </div>
                )}
            </div>
        </article>
    )
}

// What the chapter card shows for a place or a suitcase compartment
const chapterFor = (selection) => {
    if (selection.kind === "place") {
        const place = PLACES.find((p) => p.id === selection.id)
        return { key: place.id, title: place.name, subtitle: place.tagline, groups: place.groups, flag: place.flag }
    }
    const tab = SUITCASE.find((t) => t.id === selection.id)
    return { key: tab.id, title: tab.label, subtitle: "In my suitcase, wherever I go", groups: [{ items: tab.tiles }], icon: tab.icon }
}

/*
 * About Me as Morgan's World: a glossy globe with the places Morgan has lived, studied, worked and
 * travelled. Pick a place (on the globe or in the dock) and the world turns beneath his Mii, who walks
 * on the spot and waves when it arrives; the chapter for that place opens beside it. Skills, Tools and
 * Hobbies travel with him in the suitcase.
 */
const AboutMeMii = ({ onExit }) => {
    const [selection, setSelection] = useState({ kind: "place", id: START_ID })
    // the Mii keeps holding the last place's flag while you look through the suitcase
    const [flagPlace, setFlagPlace] = useState(START_ID)
    const [globeState, setGlobeState] = useState("loading") // loading | ready | failed
    const [miiReady, setMiiReady] = useState(false)
    // the passport starts open where there's room for it, and as a compact chip on phones
    const [passportOpen, setPassportOpen] = useState(() => window.innerWidth > 820 && window.innerHeight > 600)
    const miiStateRef = useRef({ walking: false, heading: 0, busy: false })
    const cardRef = useRef(null)
    const handleMiiReady = useCallback(() => setMiiReady(true), [])
    const handleGlobeReady = useCallback(() => setGlobeState("ready"), [])
    const handleGlobeError = useCallback(() => setGlobeState("failed"), [])

    useEffect(() => {
        const music = new Audio(miiChannelMusic)
        music.loop = true
        music.volume = 0.35
        music.play().catch(() => { })
        return () => music.pause()
    }, [])

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape") onExit()
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [onExit])

    const choose = useCallback((kind, id) => {
        setSelection((current) => {
            if (current.kind === kind && current.id === id) return current
            // the suitcase doesn't move the globe, so the Mii just waves
            if (kind === "suitcase") miiStateRef.current.waveNow = true
            else setFlagPlace(id)
            return { kind, id }
        })
        cardRef.current?.scrollTo({ top: 0 })
    }, [])
    const choosePlace = useCallback((id) => choose("place", id), [choose])

    // keep the chosen dock button in view where the dock scrolls (phones)
    const dockRef = useRef(null)
    useEffect(() => {
        dockRef.current?.querySelector(".is-active")?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" })
    }, [selection])

    const chapter = chapterFor(selection)
    const selectedPlace = selection.kind === "place" ? selection.id : null

    return (
        <MotionConfig reducedMotion="user">
            <motion.div className="world-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                <div className="world-sky" aria-hidden="true">
                    <span className="world-bubble b1" />
                    <span className="world-bubble b2" />
                    <span className="world-bubble b3" />
                    <span className="world-bubble b4" />
                    <span className="world-bubble b5" />
                </div>

                <header className="world-top">
                    <button type="button" className="world-exit" onClick={onExit}>
                        Exit
                    </button>
                    <h1 className="world-title">About Me</h1>
                </header>

                <div className="world-layout">
                    <div className="world-stage">
                        {/* Morgan's passport: who he is, at a glance */}
                        <section className={`world-passport ${passportOpen ? "is-open" : ""}`} aria-label="Morgan's passport">
                            <button
                                type="button"
                                className="world-passport-head"
                                onClick={() => setPassportOpen((o) => !o)}
                                aria-expanded={passportOpen}
                                aria-controls="world-passport-fields"
                            >
                                <span className="world-passport-photo" aria-hidden="true">
                                    <img src={miiSprite} alt="" draggable={false} />
                                </span>
                                <span className="world-passport-name">
                                    <strong>Morgan Burke</strong>
                                    <span>Software Engineer</span>
                                </span>
                                <span className="world-passport-toggle" aria-hidden="true" />
                            </button>
                            <dl className="world-passport-fields" id="world-passport-fields">
                                {PROFILE_FIELDS.map((f) => (
                                    <div key={f.label}>
                                        <dt>{f.label}</dt>
                                        <dd>
                                            {f.swatch && <span className="world-swatch" style={{ background: f.swatch }} aria-hidden="true" />}
                                            {f.value}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </section>

                        <div className={`world-globe-frame is-${globeState}`}>
                            {globeState !== "failed" && (
                                <Suspense fallback={null}>
                                    <Globe
                                        places={PLACES}
                                        routes={ROUTES}
                                        selectedId={selectedPlace}
                                        introFrom={HOME_ID}
                                        onSelect={choosePlace}
                                        miiStateRef={miiStateRef}
                                        onReady={handleGlobeReady}
                                        onError={handleGlobeError}
                                    />
                                </Suspense>
                            )}
                            {globeState === "loading" && <p className="world-globe-loading">Loading the world…</p>}
                            {globeState === "failed" && <div className="world-globe-fallback" aria-hidden="true" />}

                            {/* Morgan's Mii, standing on top of the world */}
                            <div className="world-mii" aria-hidden="true">
                                {!miiReady && <img className="world-mii-sprite" src={miiSprite} alt="" draggable={false} />}
                                <Suspense fallback={null}>
                                    <MiiModel
                                        stateRef={miiStateRef}
                                        onReady={handleMiiReady}
                                        holdsFlag
                                        flag={PLACES.find((p) => p.id === flagPlace)?.flag ?? null}
                                    />
                                </Suspense>
                            </div>
                            <span className="world-hint" aria-hidden="true">
                                Drag to spin · tap a pin
                            </span>
                        </div>
                    </div>

                    {/* The chapter for the chosen place */}
                    <section className="world-card" ref={cardRef} aria-live="polite">
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={chapter.key}
                                initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
                                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <header className="world-card-head">
                                    {chapter.flag ? (
                                        <img className="world-card-flag" src={chapter.flag} alt="" draggable={false} />
                                    ) : (
                                        <span className="world-card-badge is-suitcase" aria-hidden="true">
                                            <Glyph name={chapter.icon} />
                                        </span>
                                    )}
                                    <div>
                                        <h2>{chapter.title}</h2>
                                        <p>{chapter.subtitle}</p>
                                    </div>
                                </header>
                                {chapter.groups.map((group, i) => (
                                    <div className="world-group" key={group.title ?? i}>
                                        {group.title && <h3>{group.title}</h3>}
                                        {group.items.map((item) => (
                                            <Entry key={item.id} item={item} />
                                        ))}
                                    </div>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    </section>
                </div>

                {/* The dock: places in the order the story goes, and the suitcase */}
                <nav className="world-dock" aria-label="About me" ref={dockRef}>
                    <div className="world-dock-group" role="group" aria-label="Places">
                        {PLACES.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                className={`world-dock-btn ${selection.kind === "place" && selection.id === p.id ? "is-active" : ""}`}
                                aria-pressed={selection.kind === "place" && selection.id === p.id}
                                onClick={() => choose("place", p.id)}
                            >
                                <PinIcon />
                                {p.name.split(",")[0]}
                            </button>
                        ))}
                    </div>
                    <div className="world-dock-group is-suitcase" role="group" aria-label="In my suitcase">
                        <span className="world-dock-case" aria-hidden="true">
                            <SuitcaseIcon />
                        </span>
                        {SUITCASE.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                className={`world-dock-btn ${selection.kind === "suitcase" && selection.id === t.id ? "is-active" : ""}`}
                                aria-pressed={selection.kind === "suitcase" && selection.id === t.id}
                                onClick={() => choose("suitcase", t.id)}
                            >
                                <Glyph name={t.icon} />
                                {t.label}
                            </button>
                        ))}
                    </div>
                </nav>
            </motion.div>
        </MotionConfig>
    )
}

const PinIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="world-icon">
        <path d="M12 2.5 C7.9 2.5 4.8 5.6 4.8 9.6 C4.8 14.6 12 21.5 12 21.5 C12 21.5 19.2 14.6 19.2 9.6 C19.2 5.6 16.1 2.5 12 2.5 Z" fill="currentColor" />
        <circle cx="12" cy="9.6" r="2.8" fill="#fff" />
    </svg>
)

const SuitcaseIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="world-icon">
        <rect x="3" y="7" width="18" height="13.5" rx="3" fill="currentColor" />
        <path d="M9 7 V5 Q9 3.5 10.5 3.5 H13.5 Q15 3.5 15 5 V7" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M8 7 V20.5 M16 7 V20.5" stroke="#fff" strokeWidth="1.6" opacity="0.75" />
    </svg>
)

export default AboutMeMii
