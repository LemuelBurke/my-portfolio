import { useCallback } from "react"
import { motion } from "framer-motion"
import "../styles/warningWelcome.css"
import warningImg from "../assets/imgs/wii_warning.png"
import normCursor from "../assets/imgs/cursor-normal2.png"

const WarningWelcome = ({ onDismiss }) => {
    const handleOverlayClick = useCallback((e) => {
        if (e.target.closest?.("a, button, [role='button']")) return
        onDismiss?.()
    }, [onDismiss])

    return (
        <motion.div
            className="landing-overlay"
            onClick={handleOverlayClick}
            role="dialog"
            aria-labelledby="landing-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
        >
            <div className="landing-inner">
                <h1 id="landing-title" className="warning-title">
                    <img src={warningImg} alt="Wii warning icon" className="warning-icon" />
                    WARNING — ENTERING PORTFOLIO
                </h1>

                <div className="warning-body">
                    <p>
                        PLEASE REVIEW THE CONTENTS OF THIS SITE
                        <br />
                        FOR INFORMATION ABOUT <span className="morgan">MORGAN BURKE</span>
                        <br />
                        HIS PAST PROJECTS AND BACKGROUND.
                    </p>
                </div>

                <p className="warning-small">
                    More info at <br />
                    <a href="https://www.linkedin.com/in/morgan--burke/" target="_blank" rel="noreferrer noopener">
                        www.linkedin.com/morgan--burke
                    </a>
                </p>

                <p className="landing-hint">
                    Click <img src={normCursor} className="clickCursorImg" alt="cursor" /> to continue.
                </p>
            </div>
        </motion.div>
    )
}

export default WarningWelcome
