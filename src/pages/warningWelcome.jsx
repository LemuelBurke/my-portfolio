import { useCallback, useState, useContext } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { SoundContext } from "../App"
import "../styles/warningWelcome.css"
import warningImg from "../assets/imgs/wii_warning.png"
import normCursor from "../assets/imgs/cursor-normal2.png"

const WarningWelcome = ({ onDismiss }) => {
    const [visible, setVisible] = useState(true)
    const { startWelcomeAudio } = useContext(SoundContext)

    const handleOverlayClick = useCallback((e) => {
        if (e.target.closest?.("a, button, [role='button']")) return
        
        console.log(' User clicked! Starting audio immediately...')
        startWelcomeAudio()
        setVisible(false)
    }, [startWelcomeAudio])

    const handleExited = useCallback(() => {
        console.log('Animation complete, calling onDismiss')
        onDismiss?.()
    }, [onDismiss])

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="landing-overlay"
                    onClick={handleOverlayClick}
                    role="dialog"
                    aria-labelledby="landing-title"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 3, ease: "easeOut" }}
                    onAnimationComplete={(definition) => {
                        if (definition && typeof definition === "object" && "opacity" in definition && !visible) {
                            handleExited()
                        }
                    }}
                >
                    <motion.div
                        className="landing-inner"
                        exit={{ opacity: 0}}
                        transition={{ duration: 3, ease: "easeOut" }}
                    >
                        <h1 id="landing-title" className="warning-title">
                            <img src={warningImg} alt="Wii warning icon" className="warning-icon" />
                            WARNING—ENTERING PORTFOLIO
                        </h1>

                        <div className="warning-body">
                            <p>
                                HI THERE, WELCOME TO MY Wii-INSPIRED ONLINE PORTFOLIO.
                                <br />
                                THIS SITE CONTAINS A BIT ABOUT ME - <span className="morgan">MORGAN BURKE</span>
                                <br />
                                - MY EXPERIENCES, PROJECTS AND HOBBIES.
                            </p>
                        </div>

                        <p className="warning-small">
                            Get in touch <br />
                            <a href="https://www.linkedin.com/in/morgan--burke/" target="_blank" rel="noreferrer noopener">
                                www.linkedin.com/morgan--burke
                            </a>
                        </p>

                        <p className="landing-hint">
                            Click <img src={normCursor} className="clickCursorImg" alt="cursor" /> to continue.
                        </p>

                        <p className="disclaimer">This site is <b>not</b> affiliated with, endorsed by, or in partnership with Nintendo. All trademarks and copyrights related to Nintendo and the Wii™ system belong to their respective owners.</p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default WarningWelcome
