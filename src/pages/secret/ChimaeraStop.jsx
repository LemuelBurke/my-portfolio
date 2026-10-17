import { motion, AnimatePresence } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"
import "@fontsource/michroma/400.css"
import "@fontsource/exo-2/400.css"
import "@fontsource/exo-2/600.css"
import "../../styles/imperialArchives.css"
import TurretGame from "./TurretGame"
import HoloTable from "./HoloTable"
import Glyphs from "./Glyphs"
import { DOSSIER, ENGAGEMENT, PICKS, SPEAKERS } from "./archiveContent"
import { blip, drone } from "./sound"

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

const clockText = (seconds) => {
    const s = Math.max(0, Math.floor(seconds))
    return `T+${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}

/* ------------------------------------------------------------------ */
/* The Grand Admiral's file on Morgan: his favourites */

const Dossier = () => (
    <div className="dossier">
        <dl className="dossier-subject">
            <div>
                <dt>Subject</dt>
                <dd>{DOSSIER.subject}</dd>
            </div>
            <div>
                <dt>Role</dt>
                <dd>{DOSSIER.role}</dd>
            </div>
        </dl>
        <p className="cmd-panel-note">{DOSSIER.note}</p>
        <div className="picks">
            {PICKS.map((group) => (
                <section key={group.heading} className="picks-group">
                    <h3>{group.heading}</h3>
                    {group.lines && (
                        <ol className="archive-ranked">
                            {group.lines.map((l) => (
                                <li key={l.value}>
                                    <span className="archive-rank">{l.rank}</span>
                                    <span>
                                        <strong>{l.value}</strong>
                                        {l.note && <em>{l.note}</em>}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    )}
                    {group.text && <p className="archive-text">{group.text}</p>}
                    {group.footnote && <p className="archive-footnote">{group.footnote}</p>}
                </section>
            ))}
        </div>
    </div>
)

/* ------------------------------------------------------------------ */

const RAIL = [
    { id: "table", label: "Holotable" },
    { id: "turret", label: "Man battery 7" },
    { id: "dossier", label: "Dossier", heading: "Imperial Intelligence · personal file" },
]

/*
 * The Empire's stop on the galaxy map: the command holotable of the ISD Chimaera over Lothal, where
 * the record of a Rebel attack on the blockade plays out in hologram with the tactical log running
 * alongside. From the command rail you can man a turbolaser battery (the turret game) or open the
 * Grand Admiral's file on Morgan; "Galaxy map" (or Escape) goes back to the map.
 */
const ChimaeraStop = ({ onLeave }) => {
    const count = RAIL.length + 1 // the rail, then leaving
    const [view, setView] = useState("table")
    const [diving, setDiving] = useState(false)
    const [log, setLog] = useState([])
    const [status, setStatus] = useState(null)
    const [run, setRun] = useState(false)
    const [index, setIndex] = useState(0)
    const railRefs = useRef([])
    const logId = useRef(0)
    const diveTimer = useRef(null)

    // the low hum of the command deck
    useEffect(() => drone([55, 55.6, 110.3], 0.022), [])
    useEffect(() => () => clearTimeout(diveTimer.current), [])

    const onLog = useCallback((line) => {
        // a fresh record starts a fresh log
        setLog((prev) => [...(line.key === "station" ? [] : prev), { ...line, id: ++logId.current }].slice(-8))
        if (line.who === "thrawn") blip(330, "sine", 0.05, 0.25)
        else blip(1250, "square", 0.012, 0.04)
    }, [])
    const onStatus = useCallback((s) => setStatus(s), [])
    const onRun = useCallback((active) => {
        setRun(active)
        if (active) [0, 180, 360].forEach((d) => setTimeout(() => blip(880, "square", 0.03, 0.12), d))
    }, [])

    // to the turret: the view sweeps down onto the Chimaera, then cuts to the battery
    const manBattery = useCallback(() => {
        blip(1320)
        if (prefersReducedMotion()) {
            setView("turret")
            return
        }
        setView("table")
        setDiving(true)
        clearTimeout(diveTimer.current)
        diveTimer.current = setTimeout(() => {
            setView("turret")
            setDiving(false)
        }, 950)
    }, [])
    const backToTable = useCallback(() => setView("table"), [])

    const choose = (item) => {
        if (item.id === "turret") return manBattery()
        blip(1320)
        setView((v) => (v === item.id && item.id !== "table" ? "table" : item.id))
    }

    const focusRail = useCallback(
        (i) => {
            const next = (i + count) % count
            setIndex(next)
            railRefs.current[next]?.focus()
            blip(880)
        },
        [count]
    )

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                if (view !== "table") setView("table")
                else onLeave()
                return
            }
            // the turret uses the arrow keys for aiming
            if (view === "turret") return
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault()
                focusRail(index + 1)
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault()
                focusRail(index - 1)
            }
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [view, index, focusRail, onLeave])

    const panel = RAIL.find((r) => r.id === view && r.heading)
    const inTurret = view === "turret"

    return (
        <>
            <motion.div
                className={`archive-page ${inTurret ? "is-turret" : ""} ${diving ? "is-diving" : ""} ${panel ? "has-panel" : ""}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
            >
                {/* the holotable is always there; it pauses while the turret has the screen */}
                <HoloTable onLog={onLog} onStatus={onStatus} onRun={onRun} onBattery={manBattery} paused={inTurret} dive={diving} />
                <div className="archive-vignette" aria-hidden="true" />

                <header className="cmd-head">
                    <p className="cmd-kicker">
                        ISD Chimaera · Command deck <Glyphs text="chimaera" />
                    </p>
                    <h1>{ENGAGEMENT.title}</h1>
                    <p className="cmd-record">{ENGAGEMENT.record}</p>
                    <p className="cmd-hint">Drag to walk round the table · Click a Rebel ship to target it · Click the Chimaera to man a battery</p>
                </header>

                {status && (
                    <section className="cmd-status cmd-frame" aria-label="Forces">
                        <div className="cmd-status-row cmd-status-clock">
                            <span>Record</span>
                            <strong>{clockText(status.clock)}</strong>
                        </div>
                        <div className="cmd-status-row">
                            <span>Imperial</span>
                            <strong>
                                {status.imperial.capitals} ships · {status.imperial.fighters} TIEs
                            </strong>
                        </div>
                        <div className="cmd-status-row is-rebel">
                            <span>Rebel</span>
                            <strong>
                                {status.rebel.capitals} ships · {status.rebel.fighters} fighters
                            </strong>
                        </div>
                        <div className={`cmd-status-row ${status.well ? "is-on" : ""}`}>
                            <span>Gravity well</span>
                            <strong>{status.well ? "Active" : "Standby"}</strong>
                        </div>
                    </section>
                )}

                <section className="cmd-log cmd-frame" aria-label="Tactical log" aria-live="polite">
                    <h2 className="cmd-label">
                        Tactical log <Glyphs text="log" />
                    </h2>
                    <ol>
                        {log.map((line) => (
                            <li key={line.id} className={`cmd-line is-${line.who}`}>
                                <span className="cmd-line-meta">
                                    <span>{clockText(line.clock)}</span>
                                    <span>{SPEAKERS[line.who]}</span>
                                </span>
                                <span className="cmd-line-text">{line.text}</span>
                            </li>
                        ))}
                    </ol>
                </section>

                <AnimatePresence>
                    {run && !inTurret && !diving && (
                        <motion.button
                            type="button"
                            className="cmd-alert"
                            onClick={manBattery}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                        >
                            <span className="cmd-alert-light" aria-hidden="true" />
                            <span>
                                <strong>X-wings attacking the Chimaera</strong>
                                <span>Battery 7 needs a gunner · Man the battery</span>
                            </span>
                        </motion.button>
                    )}
                </AnimatePresence>

                <nav className="cmd-rail" aria-label="Command">
                    {RAIL.map((r, i) => (
                        <button
                            key={r.id}
                            type="button"
                            ref={(el) => (railRefs.current[i] = el)}
                            className={`cmd-rail-btn ${r.id === view ? "is-current" : ""} ${r.id === "turret" && run ? "is-urgent" : ""}`}
                            aria-current={r.id === view ? "true" : undefined}
                            onFocus={() => setIndex(i)}
                            onClick={() => choose(r)}
                        >
                            {r.label}
                        </button>
                    ))}
                    <button
                        type="button"
                        ref={(el) => (railRefs.current[RAIL.length] = el)}
                        className="cmd-rail-btn is-leave"
                        onFocus={() => setIndex(RAIL.length)}
                        onClick={onLeave}
                    >
                        Galaxy map
                    </button>
                </nav>

                <AnimatePresence mode="wait">
                    {panel && (
                        <motion.section
                            key={panel.id}
                            className="cmd-panel cmd-frame"
                            aria-label={panel.heading}
                            initial={{ opacity: 0, x: 24, clipPath: "inset(0 0 100% 0)" }}
                            animate={{ opacity: 1, x: 0, clipPath: "inset(0 0 0% 0)" }}
                            exit={{ opacity: 0, x: 16, transition: { duration: 0.15 } }}
                            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <header className="cmd-panel-head">
                                <h2>{panel.heading}</h2>
                                <button type="button" className="cmd-panel-close" onClick={backToTable} aria-label="Close">
                                    ×
                                </button>
                            </header>
                            <Glyphs text={panel.id} className="cmd-panel-glyphs" />
                            {panel.id === "dossier" && <Dossier />}
                        </motion.section>
                    )}
                </AnimatePresence>

                {inTurret && (
                    <section className="archive-turret" aria-label="Turbolaser battery 7">
                        <TurretGame onLeave={backToTable} />
                    </section>
                )}

                {/* the cut from the holotable to the battery */}
                {diving && <div className="cmd-dive-flash" aria-hidden="true" />}
            </motion.div>
        </>
    )
}

export default ChimaeraStop
