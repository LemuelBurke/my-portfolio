import { motion, AnimatePresence } from "framer-motion"
import { useCallback, useEffect, useState } from "react"
import SaberForge from "./SaberForge"
import Glyphs from "./Glyphs"
import { CRYSTALS, FINISHES, HILTS, SABER_KEY } from "./ilumContent"
import { MUSTAFAR } from "./mustafarContent"
import { drone } from "./sound"

const SITH_KEY = "galaxy-sith-saber"
const read = (key) => {
    try {
        return JSON.parse(localStorage.getItem(key))
    } catch {
        return null
    }
}

/*
 * The Sith's stop on the galaxy map: a ledge above the lava at Fortress Vader. You hold on to pour
 * your anger into a kyber crystal (the one you found on Ilum, if you did) until it cracks and bleeds
 * red; then it's set into your hilt and you ignite a red blade, to swing about or test against the
 * Inquisitor's seeker droid. The Sith saber is remembered. "Galaxy map" (or Escape) leaves.
 */
const MustafarStop = ({ onLeave }) => {
    const [jedi] = useState(() => read(SABER_KEY))
    const [sith] = useState(() => read(SITH_KEY))
    const start = CRYSTALS.some((c) => c.id === jedi?.crystal) ? jedi.crystal : "blue"
    const hilt = HILTS.some((h) => h.id === (sith ?? jedi)?.hilt) ? (sith ?? jedi).hilt : "duelist"
    const finish = FINISHES.some((f) => f.id === (sith ?? jedi)?.finish) ? (sith ?? jedi).finish : "gunmetal"
    const [stage, setStage] = useState(sith ? "forge" : "bleed")
    const [mode, setMode] = useState(sith ? "ready" : "bleed")
    const [progress, setProgress] = useState(0)
    const [stats, setStats] = useState(null)
    const [shield, setShield] = useState(false)

    // the rumble of the lava, deeper once you hold a red blade
    useEffect(() => drone(stage === "bleed" ? [41.2, 61.7, 82.4] : [36.7, 55, 73.4], 0.02, 260, "sawtooth"), [stage])

    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== "Escape") return
            if (mode === "train") setMode("lit")
            else onLeave()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [mode, onLeave])

    const onBleed = useCallback((p) => setProgress(p), [])
    const onBled = useCallback(() => {
        setTimeout(() => {
            setStage("forge")
            setMode("assemble")
        }, 1400)
    }, [])
    const onAssembled = useCallback(() => setMode("ready"), [])
    const ignite = () => {
        try {
            localStorage.setItem(SITH_KEY, JSON.stringify({ hilt, finish }))
        } catch {
            // can't remember it: fine
        }
        setMode("lit")
    }
    const bleedAgain = () => {
        setProgress(0)
        setStage("bleed")
        setMode("bleed")
    }

    const whisper = MUSTAFAR.whispers[Math.min(MUSTAFAR.whispers.length - 1, Math.floor(progress * MUSTAFAR.whispers.length))]
    const bled = progress >= 1
    const fromName = CRYSTALS.find((c) => c.id === start).name.toLowerCase()

    return (
        <div className={`archive-page stop mustafar is-${stage} is-${mode}`} style={{ "--kyber": "#ff2a1f" }}>
            <SaberForge
                setting="mustafar"
                crystal={stage === "bleed" ? start : "red"}
                hilt={hilt}
                finish={finish}
                mode={mode}
                shield={shield}
                onBleed={onBleed}
                onBled={onBled}
                onAssembled={onAssembled}
                onStats={setStats}
            />

            <header className="stop-head">
                <p className="cmd-kicker">
                    {MUSTAFAR.kicker} <Glyphs text="mustafar" />
                </p>
                <h1>{stage === "bleed" ? MUSTAFAR.title : mode === "train" ? "The Inquisitor's trial" : "Your Sith blade"}</h1>
                {stage === "bleed" && progress === 0 && (
                    <p className="stop-sub">
                        {MUSTAFAR.intro} {jedi ? `You brought the ${fromName} crystal from Ilum.` : ""}
                    </p>
                )}
            </header>

            <button type="button" className="stop-leave" onClick={onLeave}>
                Galaxy map <kbd>Esc</kbd>
            </button>

            {stage === "bleed" && (
                <>
                    <AnimatePresence mode="wait">
                        <motion.p key={bled ? "bled" : progress > 0.02 ? whisper : "hold"} className={`sith-whisper ${progress > 0.02 ? "is-loud" : ""}`} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                            {bled ? MUSTAFAR.bled : progress > 0.02 ? whisper : MUSTAFAR.hold}
                        </motion.p>
                    </AnimatePresence>
                    <div className="sith-meter" role="progressbar" aria-label="The crystal bleeds" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
                        <span style={{ transform: `scaleX(${progress})` }} />
                    </div>
                    <p className="sith-hint" aria-hidden="true">
                        Press and hold anywhere · or hold Space
                    </p>
                </>
            )}

            {stage === "forge" && mode !== "bleed" && mode !== "assemble" && (
                <div className="stop-rail">
                    {mode === "ready" && (
                        <button type="button" className="ilum-ignite" onClick={ignite} autoFocus>
                            Ignite
                        </button>
                    )}
                    {mode === "lit" && (
                        <>
                            <button type="button" className="cmd-rail-btn" onClick={() => setMode("train")}>
                                Face the trial
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
                                End the trial
                            </button>
                        </>
                    )}
                    {mode !== "train" && (
                        <button type="button" className="cmd-rail-btn is-leave" onClick={bleedAgain}>
                            Bleed another crystal
                        </button>
                    )}
                </div>
            )}

            {mode === "lit" && <p className="stop-whisper is-quiet">Move the pointer to wield it. Swing hard and listen.</p>}
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
                            Back at the droid <strong>{stats?.returns ?? 0}</strong>
                        </span>
                    </div>
                    <p className="stop-whisper is-quiet">{MUSTAFAR.trial}</p>
                </>
            )}
        </div>
    )
}

export default MustafarStop
