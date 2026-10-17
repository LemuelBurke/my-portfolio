import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { QUOTES } from "./galaxyContent"
import { blip } from "./sound"

// Intercepted transmissions: famous words from across the galaxy, one at a time
const Transmissions = () => {
    const [index, setIndex] = useState(() => Math.floor(Math.random() * QUOTES.length))
    const next = () => {
        let n = index
        while (n === index) n = Math.floor(Math.random() * QUOTES.length)
        setIndex(n)
        blip(520, "triangle", 0.05)
    }
    const quote = QUOTES[index]
    return (
        <div className="transmission">
            <p className="cmd-panel-note">Picked up on the HoloNet from every corner of the galaxy.</p>
            <AnimatePresence mode="wait" initial={false}>
                <motion.figure
                    key={index}
                    className="transmission-quote"
                    initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                >
                    <blockquote>“{quote.text}”</blockquote>
                    <figcaption>{quote.who}</figcaption>
                </motion.figure>
            </AnimatePresence>
            <button type="button" className="archive-action" onClick={next}>
                Intercept another
            </button>
        </div>
    )
}

export default Transmissions
