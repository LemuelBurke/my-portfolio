import { motion, AnimatePresence } from "framer-motion"
import { useCallback, useEffect, useState } from "react"
import KyberCave from "./KyberCave"
import SaberForge from "./SaberForge"
import Glyphs from "./Glyphs"
import { CRYSTALS, FINISHES, HILTS, ILUM, SABER_KEY, TRAINING } from "./ilumContent"
import { blip, drone } from "./sound"

const readSaber = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(SABER_KEY))
        if (CRYSTALS.some((c) => c.id === saved?.crystal) && HILTS.some((h) => h.id === saved?.hilt) && FINISHES.some((f) => f.id === saved?.finish)) return saved
    } catch {
        // nothing saved, or it can't be read
    }
    return null
}
const saveSaber = (saber) => {
    try {
        localStorage.setItem(SABER_KEY, JSON.stringify(saber))
    } catch {
        // can't remember it: fine
    }
}

/*
 * The Jedi's stop on the galaxy map. In the crystal caves of Ilum you find the kyber crystal that
 * calls to you; then you choose a hilt and finish, watch the saber assemble itself, and ignite it.
 * Swing it about, or train against a seeker remote (with the blast shield down, if you dare).
 * Your saber is remembered, so next time you arrive holding it. "Galaxy map" (or Escape) leaves.
 *
 * stage: cave → forge. forge mode: build → assemble → ready → lit ⇄ train.
 */
const IlumStop = ({ onLeave }) => {
    const [saved] = useState(readSaber)
    const [stage, setStage] = useState(saved ? "forge" : "cave")
    const [hover, setHover] = useState(null)
    const [crystal, setCrystal] = useState(saved?.crystal ?? null)
    const [taken, setTaken] = useState(false) // the crystal has finished floating to you
    const [hilt, setHilt] = useState(saved?.hilt ?? HILTS[0].id)
    const [finish, setFinish] = useState(saved?.finish ?? FINISHES[0].id)
    const [mode, setMode] = useState(saved ? "ready" : "build")
    const [shield, setShield] = useState(false)
    const [stats, setStats] = useState(null)

    // the caves hum softly; the hum deepens once you hold a saber
    useEffect(() => drone(stage === "cave" ? [65.4, 98.1, 130.8] : [55, 82.4], 0.014, 520, "sine"), [stage])

    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== "Escape") return
            if (mode === "train") setMode("lit")
            else onLeave()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [mode, onLeave])

    const pick = useCallback((id) => {
        setCrystal(id)
        setTaken(false)
        setTimeout(() => setTaken(true), 1900)
    }, [])
    const toForge = () => {
        blip(1320)
        setMode("build")
        setStage("forge")
    }
    const backToCave = () => {
        blip(880)
        setCrystal(null)
        setTaken(false)
        setHover(null)
        setStage("cave")
    }
    const onAssembled = useCallback(() => setMode("ready"), [])
    const ignite = () => {
        saveSaber({ crystal, hilt, finish })
        setMode("lit")
    }

    const chosen = CRYSTALS.find((c) => c.id === crystal)
    const hovering = CRYSTALS.find((c) => c.id === hover)
    const hiltInfo = HILTS.find((h) => h.id === hilt)

    return (
        <div className={`archive-page stop ilum is-${stage} is-${mode}`} style={{ "--kyber": chosen?.blade ?? "#9fd0ff" }}>
            {stage === "cave" ? (
                <KyberCave onHover={setHover} onPick={pick} picked={crystal} />
            ) : (
                <SaberForge crystal={crystal} hilt={hilt} finish={finish} mode={mode} shield={shield} onAssembled={onAssembled} onStats={setStats} />
            )}

            <header className="stop-head">
                <p className="cmd-kicker">
                    {ILUM.kicker} <Glyphs text="ilum" />
                </p>
                <h1>{stage === "cave" ? ILUM.title : mode === "train" ? TRAINING.title : "Your lightsaber"}</h1>
                {stage === "cave" && !crystal && <p className="stop-sub">{ILUM.intro}</p>}
            </header>

            <button type="button" className="stop-leave" onClick={onLeave}>
                Galaxy map <kbd>Esc</kbd>
            </button>

            {/* in the cave: the crystal you're near, then the one that chose you */}
            <AnimatePresence mode="wait">
                {stage === "cave" && !crystal && hovering && (
                    <motion.p key={hovering.id} className="stop-whisper" style={{ "--tint": hovering.blade }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <strong>{hovering.name}</strong> {hovering.note}
                    </motion.p>
                )}
                {stage === "cave" && !crystal && !hovering && (
                    <motion.p key="listen" className="stop-whisper is-quiet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        Point at a glowing crystal to listen to it. Click to take it.
                    </motion.p>
                )}
                {stage === "cave" && chosen && taken && (
                    <motion.section key="chosen" className="stop-card cmd-frame" style={{ "--tint": chosen.blade }} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <p className="stop-card-kicker">Kyber crystal</p>
                        <h2>The {chosen.name.toLowerCase()} crystal has chosen you</h2>
                        <p>{chosen.note}</p>
                        <div className="stop-actions">
                            <button type="button" className="archive-action stop-go" onClick={toForge} autoFocus>
                                Build your lightsaber
                            </button>
                            <button type="button" className="archive-action is-quiet" onClick={backToCave}>
                                Listen again
                            </button>
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            {/* the crystals can be chosen from here too, without pointing into the cave */}
            {stage === "cave" && !crystal && (
                <div className="ilum-crystal-keys" role="group" aria-label="Kyber crystals">
                    {CRYSTALS.map((c) => (
                        <button
                            key={c.id}
                            type="button"
                            style={{ "--tint": c.blade }}
                            onFocus={() => setHover(c.id)}
                            onMouseEnter={() => setHover(c.id)}
                            onMouseLeave={() => setHover(null)}
                            onBlur={() => setHover(null)}
                            onClick={() => pick(c.id)}
                        >
                            <span aria-hidden="true" />
                            {c.name}
                        </button>
                    ))}
                </div>
            )}

            {/* building: choose the hilt and finish, then put it together */}
            {stage === "forge" && (mode === "build" || mode === "assemble") && (
                <section className="ilum-build cmd-frame" aria-label="Build your lightsaber">
                    <h2 className="cmd-label">Hilt</h2>
                    <div className="ilum-options" role="radiogroup" aria-label="Hilt">
                        {HILTS.map((h) => (
                            <button
                                key={h.id}
                                type="button"
                                role="radio"
                                aria-checked={h.id === hilt}
                                className={`ilum-option ${h.id === hilt ? "is-on" : ""}`}
                                disabled={mode === "assemble"}
                                onClick={() => {
                                    setHilt(h.id)
                                    blip(1100)
                                }}
                            >
                                {h.name}
                            </button>
                        ))}
                    </div>
                    <p className="ilum-note">{hiltInfo.note}</p>
                    <h2 className="cmd-label">Finish</h2>
                    <div className="ilum-options" role="radiogroup" aria-label="Finish">
                        {FINISHES.map((f) => (
                            <button
                                key={f.id}
                                type="button"
                                role="radio"
                                aria-checked={f.id === finish}
                                className={`ilum-option is-swatch ${f.id === finish ? "is-on" : ""}`}
                                style={{ "--swatch": `#${f.color.toString(16).padStart(6, "0")}` }}
                                disabled={mode === "assemble"}
                                onClick={() => {
                                    setFinish(f.id)
                                    blip(1100)
                                }}
                            >
                                <span aria-hidden="true" />
                                {f.name}
                            </button>
                        ))}
                    </div>
                    <h2 className="cmd-label">Crystal</h2>
                    <p className="ilum-crystal" style={{ "--tint": chosen.blade }}>
                        <span aria-hidden="true" />
                        {chosen.name}
                        <button type="button" className="ilum-link" onClick={backToCave} disabled={mode === "assemble"}>
                            Choose another
                        </button>
                    </p>
                    <button type="button" className="archive-action stop-go" onClick={() => setMode("assemble")} disabled={mode === "assemble"}>
                        {mode === "assemble" ? "Assembling…" : "Assemble with the Force"}
                    </button>
                </section>
            )}

            {/* the controls along the bottom once it's built */}
            {stage === "forge" && mode !== "build" && mode !== "assemble" && (
                <div className="stop-rail">
                    {mode === "ready" && (
                        <button type="button" className="ilum-ignite" onClick={ignite} autoFocus>
                            Ignite
                        </button>
                    )}
                    {mode === "lit" && (
                        <>
                            <button type="button" className="cmd-rail-btn" onClick={() => setMode("train")}>
                                Train with the remote
                            </button>
                            <button type="button" className="cmd-rail-btn" onClick={() => setMode("ready")}>
                                Deactivate
                            </button>
                        </>
                    )}
                    {mode === "train" && (
                        <>
                            <button type="button" className={`cmd-rail-btn ${shield ? "is-current" : ""}`} aria-pressed={shield} onClick={() => setShield((s) => !s)}>
                                {shield ? "Raise blast shield" : "Lower blast shield"}
                            </button>
                            <button type="button" className="cmd-rail-btn" onClick={() => setMode("lit")}>
                                Stop training
                            </button>
                        </>
                    )}
                    {mode !== "train" && (
                        <button type="button" className="cmd-rail-btn is-leave" onClick={() => setMode("build")}>
                            Rebuild
                        </button>
                    )}
                </div>
            )}

            {stage === "forge" && mode === "lit" && <p className="stop-whisper is-quiet">Move the pointer to wield it. Swing hard and listen.</p>}

            {mode === "train" && (
                <>
                    <div className="stop-score" role="status">
                        <span>
                            Deflected <strong>{stats?.blocks ?? 0}</strong>
                        </span>
                        <span>
                            Streak <strong>{stats?.streak ?? 0}</strong>
                        </span>
                        <span>
                            Best <strong>{stats?.best ?? 0}</strong>
                        </span>
                        <span>
                            Back at the remote <strong>{stats?.returns ?? 0}</strong>
                        </span>
                    </div>
                    <p className="stop-whisper is-quiet">
                        {shield ? (
                            <>
                                “{TRAINING.shield}” <em>— {TRAINING.shieldWho}</em>
                            </>
                        ) : (
                            TRAINING.intro
                        )}
                    </p>
                </>
            )}
        </div>
    )
}

export default IlumStop
