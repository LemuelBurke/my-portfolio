import { motion, AnimatePresence } from "framer-motion"
import "../../styles/gameSelectScreen.css"
import wiiArrowImg from "../../assets/imgs/wiiArrow.svg"

// Fade-only variants (no swipe)
const imageVariants = {
    enter: {
        opacity: 0
    },
    center: {
        opacity: 1,
        transition: { duration: 0.25, ease: "easeOut" }
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.2, ease: "easeIn" }
    }
}

const GameSelectScreen = ({ gameTitle, gameImage, onClose, onStart, onNext, onPrev, hasNext, hasPrev, direction = 0 }) => {
    return (
        <motion.div
            className="game-fullscreen-overlay"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            // Solid darkened overlay to guarantee no menu bleed-through
            style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
        >
            <motion.div
                className="game-fullscreen-container"
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.98, opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                {/* Full Screen Image with fade-only animation */}
                <div className="game-fullscreen-image" style={{ overflow: "hidden", backgroundColor: "#111" }}>
                    <AnimatePresence mode="wait" initial={false}>
                        {gameImage && (
                            <motion.img
                                key={gameTitle}
                                src={gameImage}
                                alt={gameTitle}
                                variants={imageVariants}
                                initial={direction === 0 ? "center" : "enter"}
                                animate="center"
                                exit="exit"
                            />
                        )}
                    </AnimatePresence>
                </div>

                {/* Navigation Arrows */}
                {hasPrev && (
                    <motion.div
                        className="game-nav-arrow game-nav-arrow-left"
                        onClick={onPrev}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15 }}
                    >
                        <img src={wiiArrowImg} alt="Previous game" />
                    </motion.div>
                )}

                {hasNext && (
                    <motion.div
                        className="game-nav-arrow game-nav-arrow-right"
                        onClick={onNext}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15 }}
                    >
                        <img src={wiiArrowImg} alt="Next game" />
                    </motion.div>
                )}

                {/* Footer Bar with Buttons - Overlaid on image */}
                <div className="game-fullscreen-footer">
                    <div className="game-fullscreen-footer-border"></div>
                    <div className="game-fullscreen-footer-content">
                        <button 
                            className="game-fullscreen-btn game-fullscreen-btn-menu"
                            onClick={onClose}
                        >
                            Wii Menu
                        </button>
                        <button 
                            className="game-fullscreen-btn game-fullscreen-btn-start"
                            onClick={onStart}
                        >
                            Start
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}

export default GameSelectScreen

