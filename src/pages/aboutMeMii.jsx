import { motion, AnimatePresence } from "framer-motion"
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react"
import "../styles/aboutMeMii.css"
import miiChannelMusic from "../assets/audio/mii-channel-music.mp3"
import miiSprite from "../assets/imgs/plaza/mii.webp"
import Glyph from "./about/Glyph"
import { PROFILE_FIELDS, TABS } from "./about/aboutContent"

// three.js is large, so the 3D Mii loads separately; the sprite shows until it's ready (or if it fails)
const MiiModel = lazy(() => import("./components/miiModel").catch(() => ({ default: () => null })))

// The picture beside an entry: a photo, a whole polaroid, a logo, or an icon tile
const EntryMedia = ({ item }) => {
    const photo = item.photos?.[0] ?? (item.thumbFit === "contain" ? null : item.thumb)
    if (photo) {
        return <img className={item.polaroid ? "profile-entry-polaroid" : "profile-entry-photo"} src={photo} alt="" draggable={false} />
    }
    return (
        <span className="profile-entry-tile" aria-hidden="true">
            {item.thumb ? <img src={item.thumb} alt="" draggable={false} /> : <Glyph name={item.icon} />}
        </span>
    )
}

// One entry in a section: its picture beside the headline and first paragraph; "Read more" opens the rest
const Entry = ({ item }) => {
    const [open, setOpen] = useState(false)
    const [first, ...rest] = item.text ?? []
    const extraPhotos = item.photos?.slice(1) ?? []
    const hasMore = rest.length > 0 || extraPhotos.length > 0
    // Skills and Tools are just lists of chips: no picture needed
    const bare = Boolean(item.chips) && !item.photos && !item.thumb

    return (
        <article className={`profile-entry ${bare ? "is-bare" : ""}`}>
            {!bare && <EntryMedia item={item} />}
            <header className="profile-entry-head">
                {item.meta && <p className="profile-entry-meta">{item.meta}</p>}
                <h3>{item.title}</h3>
            </header>
            <div className="profile-entry-body">
                {first && <p>{first}</p>}
                {item.chips && (
                    <ul className="profile-chips">
                        {item.chips.map((c) => (
                            <li key={c}>{c}</li>
                        ))}
                    </ul>
                )}
                <AnimatePresence initial={false}>
                    {open && (
                        <motion.div
                            className="profile-entry-more"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                        >
                            {rest.map((p) => (
                                <p key={p}>{p}</p>
                            ))}
                            {extraPhotos.length > 0 && (
                                <div className={`profile-photos ${item.polaroid ? "are-polaroids" : ""}`}>
                                    {extraPhotos.map((src) => (
                                        <img key={src} src={src} alt="" draggable={false} />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
                {hasMore && (
                    <button type="button" className="profile-more" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
                        {open ? "Show less" : "Read more"}
                    </button>
                )}
            </div>
        </article>
    )
}

// The About tab: a friendlier story layout. Each part shows all its text beside a tilted cluster
// of polaroids, alternating sides as you scroll; no "Read more".
const StoryBlock = ({ item, flip }) => (
    <article className={`profile-story ${flip ? "is-flipped" : ""}`}>
        <div className="profile-story-text">
            <h3>{item.title}</h3>
            {item.text?.map((p) => (
                <p key={p}>{p}</p>
            ))}
        </div>
        {item.photos?.length > 0 && (
            <div className={`profile-story-polaroids count-${Math.min(item.photos.length, 3)}`} aria-hidden="true">
                {item.photos.slice(0, 3).map((src) => (
                    <img key={src} src={src} alt="" draggable={false} />
                ))}
            </div>
        )}
    </article>
)

/*
 * About Me as a Mii profile: a Mii data card on the left (portrait, name and a few fun fields),
 * and on the right a row of category buttons with the chosen section below. The Mii waves when
 * you switch section.
 */
const AboutMeMii = ({ onExit }) => {
    const [tabId, setTabId] = useState(TABS[0].id)
    const tab = TABS.find((t) => t.id === tabId)
    const [modelReady, setModelReady] = useState(false)
    const handleModelReady = useCallback(() => setModelReady(true), [])
    const miiStateRef = useRef({ walking: false, heading: 0, busy: false })
    const sectionRef = useRef(null)

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

    const pickTab = (id) => {
        if (id === tabId) return
        setTabId(id)
        miiStateRef.current.waveNow = true
        sectionRef.current?.scrollTo({ top: 0 })
    }

    return (
        <motion.div className="profile-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
            <header className="profile-top">
                <button type="button" className="profile-exit" onClick={onExit}>
                    Exit
                </button>
                <span className="profile-page-title">About Me</span>
            </header>

            <div className="profile-layout">
                {/* The Mii data card */}
                <motion.aside
                    className="profile-card"
                    aria-label="Morgan's Mii profile"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 240, damping: 24 }}
                >
                    <div className="profile-card-head">
                        <div className="profile-portrait">
                            {!modelReady && <img className="profile-portrait-sprite" src={miiSprite} alt="" draggable={false} />}
                            <Suspense fallback={null}>
                                <MiiModel stateRef={miiStateRef} onReady={handleModelReady} />
                            </Suspense>
                        </div>
                        <div>
                            <h1>Morgan Burke</h1>
                            <p className="profile-job">Software Engineer</p>
                        </div>
                    </div>
                    <dl className="profile-fields">
                        {PROFILE_FIELDS.map((f) => (
                            <div key={f.label} className="profile-field">
                                <dt>{f.label}</dt>
                                <dd>
                                    {f.swatch && <span className="profile-swatch" style={{ background: f.swatch }} aria-hidden="true" />}
                                    {f.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </motion.aside>

                {/* Categories and the chosen section */}
                <section className="profile-main">
                    <nav className="profile-tabs" aria-label="About me sections">
                        {TABS.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                className={`profile-tab ${t.id === tabId ? "is-active" : ""}`}
                                onClick={() => pickTab(t.id)}
                                aria-pressed={t.id === tabId}
                            >
                                <Glyph name={t.icon} className="profile-tab-icon" />
                                {t.label}
                            </button>
                        ))}
                    </nav>

                    <div className="profile-section" ref={sectionRef}>
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={tabId}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.2 }}
                            >
                                <h2 className="visually-hidden">{tab.label}</h2>
                                {tab.id === "about"
                                    ? tab.tiles.map((item, i) => <StoryBlock key={item.id} item={item} flip={i % 2 === 1} />)
                                    : tab.tiles.map((item) => <Entry key={item.id} item={item} />)}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </section>
            </div>
        </motion.div>
    )
}

export default AboutMeMii
