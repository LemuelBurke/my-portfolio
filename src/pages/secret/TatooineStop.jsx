import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import TatooineScene from "./TatooineScene"
import Sabacc from "./Sabacc"
import Glyphs from "./Glyphs"
import { startBand } from "./cantinaBand"
import { BOUNTIES, TATOOINE } from "./tatooineContent"
import { blip, drone } from "./sound"

/*
 * The scoundrels' stop on the galaxy map. Outside, the twin suns set over the dunes beyond Mos
 * Eisley; inside the cantina the band is playing, the bounty board is by the door, and Vexa Torr
 * will play you at sabacc. "Galaxy map" (or Escape) leaves.
 */
const TatooineStop = ({ onLeave }) => {
    const [stage, setStage] = useState("outside") // outside | cantina
    const [band, setBand] = useState(true)

    // the wind out on the dunes
    useEffect(() => (stage === "outside" ? drone([98, 147, 196.5], 0.008, 600, "sine") : undefined), [stage])
    // the band, inside
    useEffect(() => (stage === "cantina" && band ? startBand(0.5) : undefined), [stage, band])

    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== "Escape") return
            if (stage === "cantina") setStage("outside")
            else onLeave()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [stage, onLeave])

    return (
        <div className={`archive-page stop tatooine is-${stage}`} style={{ "--kyber": "#ffb45a" }}>
            {stage === "outside" ? (
                <>
                    <TatooineScene />
                    <header className="stop-head">
                        <p className="cmd-kicker">
                            {TATOOINE.kicker} <Glyphs text="tatooine" />
                        </p>
                        <h1>{TATOOINE.title}</h1>
                        <p className="stop-sub">{TATOOINE.intro}</p>
                    </header>
                    <div className="stop-rail">
                        <button
                            type="button"
                            className="ilum-ignite"
                            onClick={() => {
                                blip(880)
                                setStage("cantina")
                            }}
                            autoFocus
                        >
                            Enter the cantina
                        </button>
                    </div>
                </>
            ) : (
                <motion.div className="cantina" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                    <div className="cantina-arches" aria-hidden="true" />
                    <header className="stop-head cantina-head">
                        <p className="cmd-kicker">
                            {TATOOINE.kicker} <Glyphs text="cantina" />
                        </p>
                        <h1>Chalmun's Cantina</h1>
                        <div className="cantina-controls">
                            <button type="button" className="cmd-rail-btn" aria-pressed={band} onClick={() => setBand((b) => !b)}>
                                Band: {band ? "playing" : "on a break"}
                            </button>
                            <button type="button" className="cmd-rail-btn" onClick={() => setStage("outside")}>
                                Step outside
                            </button>
                        </div>
                    </header>

                    <div className="cantina-floor">
                        <Sabacc />
                        <aside className="bounties" aria-label="Bounty board">
                            <h2 className="cmd-label">Bounty board</h2>
                            <ul>
                                {BOUNTIES.map((b, i) => (
                                    <li key={b.name} className={b.contact ? "is-featured" : ""} style={{ "--tilt": `${((i * 37) % 7) - 3}deg` }}>
                                        <p className="bounty-wanted">Wanted</p>
                                        <h3>{b.name}</h3>
                                        <p>{b.crime}</p>
                                        <p className="bounty-reward">Reward: {b.reward}</p>
                                        {b.contact && <p className="bounty-contact">Leave word through the Message Me channel on the Wii menu.</p>}
                                    </li>
                                ))}
                            </ul>
                        </aside>
                    </div>
                </motion.div>
            )}

            <button type="button" className="stop-leave" onClick={onLeave}>
                Galaxy map <kbd>Esc</kbd>
            </button>
        </div>
    )
}

export default TatooineStop
