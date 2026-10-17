import { motion, AnimatePresence } from "framer-motion"
import { useCallback, useEffect, useState } from "react"
import DeathStarBriefing from "./DeathStarBriefing"
import TrenchRun from "./TrenchRun"
import Glyphs from "./Glyphs"
import { BRIEFING, RESULTS, RUN_BEST_KEY, YAVIN } from "./yavinContent"
import { blip, drone } from "./sound"

const readRuns = () => {
    try {
        return JSON.parse(localStorage.getItem(RUN_BEST_KEY)) ?? { runs: 0, hits: 0 }
    } catch {
        return { runs: 0, hits: 0 }
    }
}

/*
 * The Rebellion's stop on the galaxy map. In the Massassi temple on Yavin 4 the pilots are briefed
 * over a hologram of the battle station; then you fly the trench run (TrenchRun.jsx). Hit or miss,
 * you can go round again. "Galaxy map" (or Escape) leaves.
 */
const YavinStop = ({ onLeave }) => {
    const [stage, setStage] = useState("briefing") // briefing | run | result
    const [beat, setBeat] = useState(0)
    const [result, setResult] = useState(null)
    const [comm, setComm] = useState(null)
    const [runKey, setRunKey] = useState(0)
    const [tally, setTally] = useState(readRuns)

    // the temple's hush during the briefing
    useEffect(() => (stage === "briefing" ? drone([73.4, 110, 146.8], 0.012, 400, "sine") : undefined), [stage])

    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== "Escape") return
            if (stage === "run") return setStage("briefing")
            onLeave()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [stage, onLeave])

    const nextBeat = () => {
        blip(1100)
        if (beat < BRIEFING.length - 1) setBeat(beat + 1)
        else fly()
    }
    const fly = () => {
        blip(1320)
        setResult(null)
        setComm(null)
        setRunKey((k) => k + 1)
        setStage("run")
    }
    const onEnd = useCallback((r) => {
        setResult(r)
        setStage("result")
        setTally((prev) => {
            const next = { runs: prev.runs + 1, hits: prev.hits + (r.result === "hit" ? 1 : 0) }
            try {
                localStorage.setItem(RUN_BEST_KEY, JSON.stringify(next))
            } catch {
                // can't remember it: fine
            }
            return next
        })
    }, [])
    const onComm = useCallback((line) => setComm({ ...line, id: performance.now() }), [])

    const copy = result ? (result.result === "hit" ? (result.force ? RESULTS.force : RESULTS.hit) : RESULTS[result.result]) : null

    return (
        <div className={`archive-page stop yavin is-${stage}`}>
            {stage === "briefing" && (
                <>
                    <div className="yavin-temple" aria-hidden="true" />
                    <DeathStarBriefing beat={beat} />
                    <header className="stop-head">
                        <p className="cmd-kicker">
                            {YAVIN.kicker} <Glyphs text="yavin" />
                        </p>
                        <h1>{YAVIN.title}</h1>
                    </header>
                    <section className="briefing-card cmd-frame" aria-live="polite">
                        <p className="briefing-step">
                            {beat + 1} / {BRIEFING.length}
                        </p>
                        <AnimatePresence mode="wait">
                            <motion.p key={beat} className="briefing-text" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                {BRIEFING[beat].text}
                            </motion.p>
                        </AnimatePresence>
                        <div className="stop-actions">
                            <button type="button" className="archive-action stop-go" onClick={nextBeat} autoFocus>
                                {beat < BRIEFING.length - 1 ? "Go on" : "To your fighters"}
                            </button>
                            {beat < BRIEFING.length - 1 && (
                                <button type="button" className="archive-action is-quiet" onClick={fly}>
                                    Skip the briefing
                                </button>
                            )}
                        </div>
                        {tally.runs > 0 && (
                            <p className="briefing-tally">
                                Your record: {tally.hits} station{tally.hits === 1 ? "" : "s"} destroyed in {tally.runs} run{tally.runs === 1 ? "" : "s"}
                            </p>
                        )}
                    </section>
                </>
            )}

            {stage !== "briefing" && <TrenchRun key={runKey} onEnd={onEnd} onComm={onComm} />}

            {stage === "run" && (
                <AnimatePresence mode="wait">
                    {comm && (
                        <motion.p key={comm.id} className="trench-comm" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                            <strong>{comm.who}</strong> {comm.text}
                        </motion.p>
                    )}
                </AnimatePresence>
            )}

            {stage === "result" && copy && (
                <motion.section className={`stop-card cmd-frame trench-result ${result.result === "hit" ? "is-hit" : ""}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="stop-card-kicker">{result.result === "hit" ? "Battle station destroyed" : "Run over"}</p>
                    <h2>{copy.title}</h2>
                    <p>{copy.text}</p>
                    {result.result === "hit" && <p className="briefing-tally">Shields at {result.shields}% · {result.force ? "No targeting computer" : "Computer-guided shot"}</p>}
                    <div className="stop-actions">
                        <button type="button" className="archive-action stop-go" onClick={fly} autoFocus>
                            Fly it again
                        </button>
                        <button type="button" className="archive-action is-quiet" onClick={() => setStage("briefing")}>
                            Back to the briefing
                        </button>
                    </div>
                </motion.section>
            )}

            <button type="button" className="stop-leave" onClick={onLeave}>
                Galaxy map <kbd>Esc</kbd>
            </button>
        </div>
    )
}

export default YavinStop
