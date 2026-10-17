import { useEffect } from "react"
import { CRAWL } from "./galaxyContent"

// The opening crawl. Any key or click skips it; Escape leaves the channel, as it does everywhere else.
const Crawl = ({ onDone, onExit }) => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") onExit()
            else onDone()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [onDone, onExit])

    return (
        <div className={`archive-crawl ${reduceMotion ? "is-still" : ""}`} onClick={onDone}>
            <p className="archive-crawl-intro">{CRAWL.intro}</p>
            <div className="archive-crawl-field" aria-label="Opening crawl">
                <div className="archive-crawl-text" onAnimationEnd={onDone}>
                    <p className="archive-crawl-episode">{CRAWL.episode}</p>
                    <h2 className="archive-crawl-title">{CRAWL.title}</h2>
                    {CRAWL.paragraphs.map((p) => (
                        <p key={p}>{p}</p>
                    ))}
                </div>
            </div>
            <button type="button" className="archive-crawl-skip" onClick={onDone} autoFocus>
                {reduceMotion ? "Continue" : "Skip"}
            </button>
        </div>
    )
}

export default Crawl
