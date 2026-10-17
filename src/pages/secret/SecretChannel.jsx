import { motion, AnimatePresence, MotionConfig } from "framer-motion"
import { lazy, Suspense, useCallback, useEffect, useState } from "react"
import "@fontsource/michroma/400.css"
import "@fontsource/exo-2/400.css"
import "@fontsource/exo-2/600.css"
import "../../styles/imperialArchives.css"
import "../../styles/galaxy.css"
import Crawl from "./Crawl"
import GalaxyMap from "./GalaxyMap"
import Glyphs from "./Glyphs"
import Hyperspace from "./Hyperspace"
import Transmissions from "./Transmissions"
import { DESTINATIONS, SIDES } from "./galaxyContent"
import { blip, closeAudio, drone } from "./sound"

// Each place loads when you first travel there
const ChimaeraStop = lazy(() => import("./ChimaeraStop"))
const IlumStop = lazy(() => import("./IlumStop"))
const YavinStop = lazy(() => import("./YavinStop"))
const TatooineStop = lazy(() => import("./TatooineStop"))
const MustafarStop = lazy(() => import("./MustafarStop"))
const STOPS = { chimaera: ChimaeraStop, ilum: IlumStop, yavin: YavinStop, tatooine: TatooineStop, mustafar: MustafarStop }

/* ------------------------------------------------------------------ */
/* The map's controls: the list of places, and the card for the one you've picked */

const Hub = ({ selected, onSelect, onJump, onExit, intro }) => {
    const [panel, setPanel] = useState(null)
    const dest = DESTINATIONS.find((d) => d.id === selected)

    // the map's own soft ambience
    useEffect(() => drone([110, 164.8, 220.4], 0.012, 700, "sine"), [])

    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== "Escape") return
            if (panel) setPanel(null)
            else if (selected) onSelect(null)
            else onExit()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [panel, selected, onSelect, onExit])

    return (
        <div className="hub">
            <GalaxyMap selected={selected} onSelect={onSelect} intro={intro} />
            <div className="hub-vignette" aria-hidden="true" />

            <header className="hub-head">
                <p className="cmd-kicker">
                    HoloNet navigation · The known galaxy <Glyphs text="navigate" />
                </p>
                <h1>Choose your side</h1>
                <p className="hub-sub">Every corner of the galaxy has something waiting. Pick a destination, then jump to hyperspace.</p>
            </header>

            <nav className="hub-list" aria-label="Destinations">
                {DESTINATIONS.map((d) => (
                    <button
                        key={d.id}
                        type="button"
                        className={`hub-place ${d.id === selected ? "is-selected" : ""} ${d.live ? "" : "is-uncharted"}`}
                        style={{ "--pin": SIDES[d.side].color }}
                        aria-pressed={d.id === selected}
                        onClick={() => onSelect(d.id === selected ? null : d.id)}
                    >
                        <span className="hub-place-dot" aria-hidden="true" />
                        <span className="hub-place-text">
                            <strong>{d.name}</strong>
                            <span>
                                {SIDES[d.side].name}
                                {!d.live && <em> · Uncharted</em>}
                            </span>
                        </span>
                    </button>
                ))}
            </nav>

            <AnimatePresence mode="wait">
                {dest && (
                    <motion.section
                        key={dest.id}
                        className="hub-card cmd-frame"
                        style={{ "--pin": SIDES[dest.side].color }}
                        aria-label={dest.name}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10, transition: { duration: 0.15 } }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <p className="hub-card-side">{SIDES[dest.side].name}</p>
                        <h2>{dest.name}</h2>
                        <p className="hub-card-where">
                            {dest.place} · {dest.region}
                        </p>
                        <p className="hub-card-pitch">{dest.pitch}</p>
                        {dest.live ? (
                            <button type="button" className="hub-jump" onClick={() => onJump(dest.id)} autoFocus>
                                <span className="hub-jump-lines" aria-hidden="true" />
                                Jump to hyperspace
                            </button>
                        ) : (
                            <p className="hub-uncharted">Route still being plotted. Check back soon.</p>
                        )}
                    </motion.section>
                )}
            </AnimatePresence>

            <div className="hub-rail">
                <button type="button" className="cmd-rail-btn" onClick={() => setPanel(panel ? null : "transmissions")} aria-expanded={panel === "transmissions"}>
                    Transmissions
                </button>
                <button type="button" className="cmd-rail-btn is-leave" onClick={onExit}>
                    Wii Menu
                </button>
            </div>
            <p className="hub-hint" aria-hidden="true">
                Drag to turn the galaxy · Scroll to zoom
            </p>
            <p className="archive-disclaimer">
                A fan-made homage. Not affiliated with, endorsed by or connected to Lucasfilm Ltd., The Walt Disney Company or Electronic Arts. Star
                Wars and all related names are trademarks of their respective owners.
            </p>

            <AnimatePresence>
                {panel === "transmissions" && (
                    <motion.section
                        className="cmd-panel cmd-frame hub-panel"
                        aria-label="Intercepted transmissions"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12, transition: { duration: 0.15 } }}
                    >
                        <header className="cmd-panel-head">
                            <h2>Intercepted transmissions</h2>
                            <button type="button" className="cmd-panel-close" onClick={() => setPanel(null)} aria-label="Close">
                                ×
                            </button>
                        </header>
                        <Glyphs text="holonet" className="cmd-panel-glyphs" />
                        <Transmissions />
                    </motion.section>
                )}
            </AnimatePresence>
        </div>
    )
}

/*
 * A hidden channel for Star Wars fans, found by jumping to hyperspace from the Wii menu. It opens
 * with a crawl, then a holographic map of the galaxy: pick a place and jump there. Each place is
 * its own world for a different kind of fan: the Empire's holotable on the ISD Chimaera, the
 * crystal caves of Ilum for the Jedi, the trench run from Yavin 4 for the Rebellion, the cantina
 * at Mos Eisley for scoundrels, and Fortress Vader on Mustafar for the Sith. Every place has a way
 * back to the map.
 */
const SecretChannel = ({ onExit }) => {
    const [crawling, setCrawling] = useState(true)
    const [place, setPlace] = useState("map")
    const [selected, setSelected] = useState(null)
    const [jumping, setJumping] = useState(null) // where we're jumping to, during the jump
    const [arrived, setArrived] = useState(false) // the map swoops in only the first time

    useEffect(() => () => closeAudio(), [])

    const endCrawl = useCallback(() => setCrawling(false), [])
    const select = useCallback((id) => {
        setSelected(id)
        if (id) blip(1320)
    }, [])
    const jump = useCallback((to) => setJumping((now) => now ?? to), [])
    const leave = useCallback(() => jump("map"), [jump])
    const onJumped = useCallback(() => {
        setArrived(true)
        setPlace(jumping)
    }, [jumping])

    const Stop = STOPS[place]

    return (
        <MotionConfig reducedMotion="user">
            <motion.div className="archive-page galaxy-channel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                {!crawling && place === "map" && <Hub selected={selected} onSelect={select} onJump={jump} onExit={onExit} intro={!arrived} />}
                {Stop && (
                    <Suspense fallback={<div className="galaxy-loading">Dropping out of hyperspace…</div>}>
                        <Stop onLeave={leave} />
                    </Suspense>
                )}

                <AnimatePresence>
                    {crawling && (
                        <motion.div className="archive-crawl-wrap" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
                            <Crawl onDone={endCrawl} onExit={onExit} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {jumping && <Hyperspace onJump={onJumped} onDone={() => setJumping(null)} />}
            </motion.div>
        </MotionConfig>
    )
}

export default SecretChannel
