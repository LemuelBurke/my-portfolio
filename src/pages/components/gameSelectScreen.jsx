import { motion, AnimatePresence } from "framer-motion"
import "../../styles/gameSelectScreen.css"
import wiiArrowImg from "../../assets/imgs/wiiArrow.svg"
import { useContext, useEffect } from "react"
import { SoundContext } from "../../App"
import { setMusicLevel, startMusic, stopMusic } from "../../settings"
import { PREVIEWS, STARS_PREVIEW } from "./channelPreviews"

const PREVIEW_VOLUME = 0.3

// Fade a track to a level over a short time
const fade = (audio, from, to, ms) => {
    const start = performance.now()
    let frame
    const stepFade = (now) => {
        // (the first frame's timestamp can be a touch earlier than `start`)
        const t = Math.min(1, Math.max(0, (now - start) / ms))
        setMusicLevel(audio, from + (to - from) * t)
        if (t < 1) frame = requestAnimationFrame(stepFade)
    }
    frame = requestAnimationFrame(stepFade)
    return () => cancelAnimationFrame(frame)
}

// While a channel is selected, its own music fades in over the (ducked) menu music
const usePreviewMusic = (src) => {
    const { duckMenu } = useContext(SoundContext)
    useEffect(() => {
        duckMenu(true)
        return () => duckMenu(false)
    }, [duckMenu])
    useEffect(() => {
        if (!src) return
        let music = null
        let cancelFade = () => { }
        // a short pause first, so flicking through channels doesn't start every song
        const timer = setTimeout(() => {
            music = startMusic(src, 0)
            cancelFade = fade(music, 0, PREVIEW_VOLUME, 900)
        }, 350)
        return () => {
            clearTimeout(timer)
            cancelFade()
            stopMusic(music)
        }
    }, [src])
}

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
    const preview = PREVIEWS[gameTitle] ?? STARS_PREVIEW
    usePreviewMusic(preview.music)

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") onClose()
            else if (e.key === "ArrowRight" && hasNext) onNext()
            else if (e.key === "ArrowLeft" && hasPrev) onPrev()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [onClose, onNext, onPrev, hasNext, hasPrev])

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
                    {/* phones in portrait show the whole banner over a blurred copy of itself, rather than cropping it */}
                    {gameImage && <img className="game-fullscreen-backdrop" src={gameImage} alt="" aria-hidden="true" draggable={false} />}
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

