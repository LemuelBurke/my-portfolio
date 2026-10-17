import { motion, AnimatePresence } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"
import "../../styles/arcade.css"
// each game is lettered like its channel art
import "@fontsource/fredoka/700.css"
import "@fontsource/bungee/400.css"
import "@fontsource/comfortaa/700.css"
import arcadeMusic from "../../assets/audio/wiiSports.mp3"
import clickCursor from "../../assets/imgs/cursor-normal2.png"

const bestKey = (title) => `arcade-best-${title}`
const MUTE_KEY = "arcade-muted"

// localStorage can be missing or blocked (private mode); scores then just last the visit
const readStore = (key) => {
    try {
        return localStorage.getItem(key)
    } catch {
        return null
    }
}
const writeStore = (key, value) => {
    try {
        localStorage.setItem(key, value)
    } catch {
        // ignore
    }
}

/*
 * A Wii-style arcade channel that hosts one canvas game. A game is an object with a title,
 * colour, theme (which styles the bar and menus to match its channel art), how-to text and create(callbacks), which returns { resize, update, draw } plus any of
 * pointerDown, pointerMove, keyDown and keyUp. The shell owns the canvas, loop, score and menus.
 */
const ArcadeChannel = ({ game, onExit }) => {
    const wrapRef = useRef(null)
    const canvasRef = useRef(null)
    const gameRef = useRef(null)
    const sizeRef = useRef({ w: 0, h: 0 })
    const phaseRef = useRef("ready")
    const [phase, setPhase] = useState("ready") // "ready" | "playing" | "over"
    const [score, setScore] = useState(0)
    const [info, setInfo] = useState("")
    const [best, setBest] = useState(() => Number(readStore(bestKey(game.title))) || 0)
    const bestRef = useRef(best)
    const [newBest, setNewBest] = useState(false)
    const [muted, setMuted] = useState(() => readStore(MUTE_KEY) === "1")
    const mutedRef = useRef(muted)
    const audioRef = useRef(null)

    // Tiny synthesised blips, so the games need no sound files
    const sfx = useCallback((freq = 600, duration = 0.08, type = "sine") => {
        if (mutedRef.current) return
        try {
            audioRef.current ??= new (window.AudioContext || window.webkitAudioContext)()
            const audio = audioRef.current
            const t = audio.currentTime
            const osc = audio.createOscillator()
            const gain = audio.createGain()
            osc.type = type
            osc.frequency.setValueAtTime(freq, t)
            osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + duration)
            gain.gain.setValueAtTime(0.12, t)
            gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
            osc.connect(gain).connect(audio.destination)
            osc.start(t)
            osc.stop(t + duration)
        } catch {
            // no Web Audio: play silently
        }
    }, [])

    // Build a fresh game; it's drawn behind the menus straight away so the screen isn't blank
    const newGame = useCallback(() => {
        const g = game.create({
            setScore,
            setInfo,
            sfx,
            end: (final) => {
                phaseRef.current = "over"
                setPhase("over")
                const isBest = final > bestRef.current
                setNewBest(isBest)
                if (isBest) {
                    bestRef.current = final
                    setBest(final)
                    writeStore(bestKey(game.title), String(final))
                }
            },
        })
        const { w, h } = sizeRef.current
        if (w) g.resize(w, h)
        gameRef.current = g
    }, [game, sfx])

    const start = useCallback(() => {
        setInfo("") // cleared first: a new game may set its own status straight away
        setScore(0)
        newGame()
        setNewBest(false)
        phaseRef.current = "playing"
        setPhase("playing")
        sfx(700, 0.1)
    }, [newGame, sfx])

    // Canvas sized to its box at the screen's pixel density (capped at 2x for phones)
    useEffect(() => {
        newGame()
        const canvas = canvasRef.current
        const resize = () => {
            const rect = wrapRef.current.getBoundingClientRect()
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            canvas.width = Math.round(rect.width * dpr)
            canvas.height = Math.round(rect.height * dpr)
            sizeRef.current = { w: rect.width, h: rect.height, dpr }
            gameRef.current?.resize(rect.width, rect.height)
        }
        const observer = new ResizeObserver(resize)
        observer.observe(wrapRef.current)
        resize()
        return () => observer.disconnect()
    }, [newGame])

    // Game loop: update only while playing, always draw (so the last frame shows behind menus)
    useEffect(() => {
        const ctx = canvasRef.current.getContext("2d")
        let frame
        let last = performance.now()
        const tick = (now) => {
            const dt = Math.min((now - last) / 1000, 0.05)
            last = now
            const g = gameRef.current
            const { dpr = 1 } = sizeRef.current
            if (g) {
                if (phaseRef.current === "playing") g.update(dt)
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
                g.draw(ctx)
            }
            frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [])

    // Background music, paused while muted
    useEffect(() => {
        const music = new Audio(arcadeMusic)
        music.loop = true
        music.volume = 0.25
        if (!muted) music.play().catch(() => { })
        return () => music.pause()
    }, [muted])

    const toggleMute = () => {
        const next = !muted
        mutedRef.current = next
        setMuted(next)
        writeStore(MUTE_KEY, next ? "1" : "0")
    }

    // Keyboard: Space/Enter starts from the menus; games take arrows etc.; Escape leaves
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                onExit()
                return
            }
            if (phaseRef.current !== "playing") {
                if (e.key === " " || e.key === "Enter") {
                    e.preventDefault()
                    start()
                }
                return
            }
            if (gameRef.current?.keyDown?.(e.key)) e.preventDefault()
        }
        const onKeyUp = (e) => gameRef.current?.keyUp?.(e.key)
        window.addEventListener("keydown", onKeyDown)
        window.addEventListener("keyup", onKeyUp)
        return () => {
            window.removeEventListener("keydown", onKeyDown)
            window.removeEventListener("keyup", onKeyUp)
        }
    }, [onExit, start])

    const toCanvas = (e) => {
        const rect = canvasRef.current.getBoundingClientRect()
        return [e.clientX - rect.left, e.clientY - rect.top]
    }
    const handlePointerDown = (e) => {
        if (phaseRef.current !== "playing") return
        e.preventDefault()
        gameRef.current?.pointerDown?.(...toCanvas(e))
    }
    const handlePointerMove = (e) => {
        if (phaseRef.current !== "playing") return
        gameRef.current?.pointerMove?.(...toCanvas(e))
    }

    return (
        <motion.div
            className={`arcade-page theme-${game.theme}`}
            style={{ "--game-color": game.color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="arcade-stage" ref={wrapRef}>
                <canvas
                    ref={canvasRef}
                    className="arcade-canvas"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    aria-label={`${game.title} game area`}
                />
            </div>

            <div className="arcade-hud">
                <button type="button" className="arcade-exit" onClick={onExit}>
                    Exit
                </button>
                <span className="arcade-pill arcade-title">{game.title}</span>
                <span className="arcade-spacer" />
                {phase === "playing" && info && <span className="arcade-pill arcade-info">{info}</span>}
                <span className="arcade-pill">
                    Score <strong>{score}</strong>
                </span>
                <span className="arcade-pill arcade-best">
                    Best <strong>{best}</strong>
                </span>
                <button type="button" className="arcade-pill arcade-mute" onClick={toggleMute} aria-label={muted ? "Turn sound on" : "Turn sound off"}>
                    <SpeakerIcon muted={muted} />
                </button>
            </div>

            <AnimatePresence>
                {phase !== "playing" && (
                    <motion.div
                        className="arcade-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <motion.div
                            className="arcade-card"
                            role="dialog"
                            aria-label={phase === "ready" ? `How to play ${game.title}` : "Game over"}
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 22 }}
                        >
                            <h2 className="arcade-card-title">{phase === "ready" ? game.title : newBest ? "New best!" : "Game over"}</h2>
                            {phase === "ready" ? (
                                <p className="arcade-card-text">{game.howTo}</p>
                            ) : (
                                <p className="arcade-card-score">
                                    <span>Score</span>
                                    <strong>{score}</strong>
                                    <span className="arcade-card-best">Best {best}</span>
                                </p>
                            )}
                            <div className="arcade-card-buttons">
                                <button type="button" className="arcade-btn" onClick={onExit}>
                                    Wii Menu
                                </button>
                                <button type="button" className="arcade-btn arcade-btn-primary" onClick={start} autoFocus>
                                    <img src={clickCursor} className="arcade-click-icon" alt="" draggable={false} />
                                    {phase === "ready" ? "Start" : "Play again"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

const SpeakerIcon = ({ muted }) => (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M4 9.5 H7.5 L12 5.5 V18.5 L7.5 14.5 H4 Z" fill="currentColor" strokeLinejoin="round" stroke="currentColor" strokeWidth="1.5" />
        {muted ? (
            <path d="M15.5 9.5 L20.5 14.5 M20.5 9.5 L15.5 14.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        ) : (
            <path d="M15.5 9 Q17.5 12 15.5 15 M18 6.5 Q22 12 18 17.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        )}
    </svg>
)

export default ArcadeChannel
