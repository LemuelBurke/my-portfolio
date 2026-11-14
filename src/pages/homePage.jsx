import { motion, AnimatePresence } from "framer-motion"
import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback, lazy, Suspense } from "react"
import "../styles/homepage/index.css"
import MenuCard from "./components/menuCard"
import AboutMeMii from "./aboutMeMii"
import ResumeAndCV from "./resumeAndCV"
import Projects from "./projects"
import IntermissionOverlay from "./components/intermissionOverlay"
import ArcadeChannel from "./arcade/ArcadeChannel"
import { ARCADE_GAMES } from "./arcade/arcadeGames"

// Thumnail Imports
import Img from "../assets/imgs/thumbnails/placeholder-card.webp"
import miiMorgan from "../assets/imgs/thumbnails/about-me.webp"
import miiMorganFull from "../assets/imgs/thumbnails/about-me-full.webp"
import projectImg from "../assets/imgs/thumbnails/project-street.webp"
import linkedImg from "../assets/imgs/thumbnails/linkedin.webp"
import githubImg from "../assets/imgs/thumbnails/github.webp"
import linkedFULLimg from "../assets/imgs/thumbnails/linkedin-full.webp"
import githubFULLimg from "../assets/imgs/thumbnails/github-full.webp"
import projectFULLimg from "../assets/imgs/thumbnails/project-street-full.webp"
import cvFULLimg from "../assets/imgs/thumbnails/cv-board-full.webp"
import discImg from "../assets/imgs/disc-small.webp"

import NextArrow from "./components/nextPage"
import wiiArrowImg from "../assets/imgs/wiiArrow.svg"
import GameSelectScreen from "./components/gameSelectScreen"
import UpdatesBoard from "./mail/UpdatesBoard"
import { UPDATES, markUpdatesSeen, readSeenUpdates } from "./mail/updates"
import LetterChannel from "./mail/LetterChannel"
import messageMeImg from "../assets/imgs/thumbnails/message-me.webp"
import messageMeFullImg from "../assets/imgs/thumbnails/message-me-full.webp"
import userCursor from "../assets/imgs/user-cursor-med.png"
import footerImg from "../assets/imgs/footer_img.png"
import cvImg from "../assets/imgs/thumbnails/cv-board.webp"
import archiveImg from "../assets/imgs/thumbnails/galaxy-map.webp"
import archiveFullImg from "../assets/imgs/thumbnails/galaxy-map-full.webp"
import Hyperspace from "./secret/Hyperspace"
import { ARCHIVE_TITLE } from "./secret/galaxyContent"
import SettingsPanel from "./components/SettingsPanel"
import ForecastChannel from "./forecast/ForecastChannel"
import forecastImg from "../assets/imgs/thumbnails/forecast.svg"
import forecastFullImg from "../assets/imgs/thumbnails/forecast-full.svg"

// The secret channel only loads once someone finds it
const SecretChannel = lazy(() => import("./secret/SecretChannel"))

// ↑ ↑ ↓ ↓ ← → ← → B A on the Wii menu jumps to hyperspace
const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"]
// Finding the channel lasts for this visit only: it's kept in memory (so it survives going into
// channels and back to the menu), never saved, so every new visit has to enter the code again.
// An older version saved it in the browser; clear that so those visitors start locked too.
let unlockedThisVisit = false
try {
    localStorage.removeItem("imperial-archives-unlocked")
} catch {
    // storage unavailable: nothing saved to clear
}
const readUnlocked = () => unlockedThisVisit

// Every channel on the menu (the hidden one is added once it's found)
const CHANNELS = Object.fromEntries([
    { title: "About Me", thumbnail: miiMorgan, fullImage: miiMorganFull },
    { title: "My Projects", thumbnail: projectImg, fullImage: projectFULLimg },
    { title: "Resume and CV", thumbnail: cvImg, fullImage: cvFULLimg },
    { title: "Message Me", thumbnail: messageMeImg, fullImage: messageMeFullImg },
    { title: "LinkedIn", thumbnail: linkedImg, fullImage: linkedFULLimg },
    { title: "GitHub", thumbnail: githubImg, fullImage: githubFULLimg },
    { title: "Forecast", thumbnail: forecastImg, fullImage: forecastFullImg },
    ...ARCADE_GAMES.map(({ title, thumbnail, fullImage }) => ({ title, thumbnail, fullImage })),
].map((c) => [c.title, c]))

// Two pages of 4 x 3 slots: the channels in their default order, then empty slots
const PAGES = 2
const PER_PAGE = 12
const SLOTS = PAGES * PER_PAGE
const DEFAULT_ORDER = [...Object.keys(CHANNELS), ...Array(SLOTS).fill("")].slice(0, SLOTS)
const SECRET_SLOT = 12


// (the formatters are made once: building one is slow, and the clock asks every second)
const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
const dateFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'numeric' })
const formatTime = (date) => timeFormat.format(date)
const formatDate = (date) => dateFormat.format(date)

// The footer clock ticks on its own, so the rest of the menu doesn't redraw every second
const FooterClock = ({ className, format, onClick }) => {
    const [now, setNow] = useState(() => new Date())
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])
    return <div className={className} onClick={onClick}>{format(now)}</div>
}

const HomePage = ({ onChannelOpen, activeChannel, onChannelClose }) => {
    const [currentPage, setCurrentPage] = useState(0)
    const [selectedGameIndex, setSelectedGameIndex] = useState(null)
    const [isUpdatesOpen, setIsUpdatesOpen] = useState(false)
    // notices this visitor had already seen when the board was last opened; drives the badge and "New" tags
    const [seenUpdates, setSeenUpdates] = useState(readSeenUpdates)
    const [seenAtOpen, setSeenAtOpen] = useState(seenUpdates)
    const unreadUpdates = UPDATES.filter((u) => !seenUpdates.has(u.id)).length
    const [swipeDirection, setSwipeDirection] = useState(0) // -1 prev, 1 next
    const menuGridRef = useRef(null)
    const totalPages = PAGES

    // The hidden Star Wars channel (the galaxy map): unlocked by the Konami code (or, for phones, five quick
    // taps on the footer clock), with a jump to hyperspace that reveals its card on page 2
    const [archiveUnlocked, setArchiveUnlocked] = useState(readUnlocked)
    const [jumping, setJumping] = useState(false)
    const [archiveIsNew, setArchiveIsNew] = useState(false)


    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    // Key to force re-mounting menu pages to replay animations
    const [menuAnimKey, setMenuAnimKey] = useState(0)

    // When closing selected game, force menu pages to re-mount to replay card animations (only on
    // closing: on first load the cards are already animating in, and remounting them all again
    // straight away doubled the work of showing the menu)
    const hadSelection = useRef(false)
    useEffect(() => {
        if (selectedGameIndex === null && hadSelection.current) {
            // small tick to change key and re-trigger animations
            setMenuAnimKey(prev => prev + 1)
        }
        hadSelection.current = selectedGameIndex !== null
    }, [selectedGameIndex])

    const games = useMemo(() => {
        const slots = [...DEFAULT_ORDER]
        // once found, the secret channel takes the first slot on page 2
        if (archiveUnlocked) slots[SECRET_SLOT] = ARCHIVE_TITLE
        return slots.map((title) =>
            title === ARCHIVE_TITLE
                ? { title, thumbnail: archiveImg, fullImage: archiveFullImg }
                : CHANNELS[title] ?? { title: "", thumbnail: Img, fullImage: Img }
        )
    }, [archiveUnlocked]);

    // Load the full-size channel banners once the menu has settled, so a channel's zoom never shows an empty box
    useEffect(() => {
        const timer = setTimeout(() => {
            Object.values(CHANNELS).forEach(({ fullImage }) => {
                const img = new Image()
                img.src = fullImage
            })
        }, 1500)
        return () => clearTimeout(timer)
    }, [])

    // Where the menu has to scroll to show a page (pages are narrower than the window, so it isn't page x width)
    const pageLeft = (page) => {
        const grid = menuGridRef.current
        const el = document.getElementById(`page-${page + 1}`)
        if (!grid || !el) return 0
        return el.offsetLeft - parseFloat(getComputedStyle(grid).paddingLeft)
    }

    const jumpToHyperspace = useCallback(() => {
        if (!jumping) setJumping(true)
    }, [jumping])

    // At the height of the flash: unlock the channel and bring its card into view
    const arriveFromHyperspace = useCallback(() => {
        unlockedThisVisit = true
        setArchiveUnlocked(true)
        setArchiveIsNew(true)
        const grid = menuGridRef.current
        if (window.innerWidth >= 1024) {
            setCurrentPage(1)
            grid?.scrollTo({ left: pageLeft(1) })
        } else {
            requestAnimationFrame(() => document.querySelector("#page-2 .wii-card")?.scrollIntoView({ block: "center" }))
        }
    }, [])

    // Listen for the code while the menu itself is showing
    useEffect(() => {
        if (activeChannel || selectedGameIndex !== null || isSettingsOpen) return
        let progress = 0
        const onKeyDown = (e) => {
            const key = e.key.toLowerCase()
            progress = key === KONAMI[progress] ? progress + 1 : key === KONAMI[0] ? 1 : 0
            if (progress === KONAMI.length) {
                progress = 0
                jumpToHyperspace()
            }
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [activeChannel, selectedGameIndex, isSettingsOpen, jumpToHyperspace])

    // The footer's Wii button opens Settings
    const handleWiiButton = () => setIsSettingsOpen(true)

    // Five quick taps on the clock also jump to hyperspace: the Konami code for phones
    const clockTapsRef = useRef([])
    const handleClockTap = () => {
        const now = Date.now()
        clockTapsRef.current = [...clockTapsRef.current.filter((t) => now - t < 2500), now]
        if (clockTapsRef.current.length >= 5) {
            clockTapsRef.current = []
            jumpToHyperspace()
        }
    }


    // Opening a channel unmounts the menu, so when it comes back, scroll it straight to the page
    // it was on; otherwise it shows page 1 while the arrows still think they're on page 2
    useLayoutEffect(() => {
        const grid = menuGridRef.current
        if (activeChannel || !grid) return
        if (window.innerWidth >= 1024) grid.scrollLeft = pageLeft(currentPage)
        else if (currentPage !== 0) setCurrentPage(0)
        // only when the menu mounts again, not on every page change (the arrows scroll it themselves)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeChannel])

    const handleNext = () => {
        if (currentPage < totalPages - 1 && window.innerWidth >= 1024) {
            const nextPage = currentPage + 1
            setCurrentPage(nextPage)

            if (menuGridRef.current) {
                menuGridRef.current.scrollTo({
                    left: pageLeft(nextPage),
                    behavior: 'smooth'
                })
            }
        }
    }

    const handlePrev = () => {
        if (currentPage > 0 && window.innerWidth >= 1024) {
            const prevPage = currentPage - 1
            setCurrentPage(prevPage)

            if (menuGridRef.current) {
                menuGridRef.current.scrollTo({
                    left: pageLeft(prevPage),
                    behavior: 'smooth'
                })
            }
        }
    }

    // Mail button: open the board of notices and mark them all as seen
    const handleUpdatesOpen = () => {
        setSeenAtOpen(seenUpdates)
        setIsUpdatesOpen(true)
        markUpdatesSeen()
        setSeenUpdates(new Set(UPDATES.map((u) => u.id)))
    }

    const handleUpdatesChannel = (channel) => {
        setIsUpdatesOpen(false)
        onChannelOpen(channel)
    }

    // Game navigation
    const handleGameSelect = (index) => {
        // empty slots have nothing to open
        if (!games[index].title) return
        setSelectedGameIndex(index)
        setSwipeDirection(0)
    }

    // the select screen's arrows step through the real channels, skipping empty slots
    const findChannel = (from, step) => {
        for (let i = from + step; i >= 0 && i < games.length; i += step) if (games[i].title) return i
        return -1
    }
    const nextGameIndex = selectedGameIndex === null ? -1 : findChannel(selectedGameIndex, 1)
    const prevGameIndex = selectedGameIndex === null ? -1 : findChannel(selectedGameIndex, -1)

    // Stepping to a channel on another page turns the menu behind to that page too
    const showChannel = (index, direction) => {
        setSwipeDirection(direction)
        setSelectedGameIndex(index)
        const page = Math.floor(index / PER_PAGE)
        const grid = menuGridRef.current
        if (page !== currentPage && grid && window.innerWidth >= 1024) {
            setCurrentPage(page)
            grid.scrollTo({ left: pageLeft(page), behavior: "instant" })
        }
    }

    const handleNextGame = () => {
        if (nextGameIndex >= 0) showChannel(nextGameIndex, 1)
    }

    const handlePrevGame = () => {
        if (prevGameIndex >= 0) showChannel(prevGameIndex, -1)
    }


    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.6,
                staggerChildren: 0.08,
                delayChildren: 0.2
            }
        },
        exit: {
            opacity: 0,
            transition: { duration: 0.4 }
        }
    }

    const cardVariants = {
        hidden: {
            opacity: 0,
            y: 20,
            scale: 0.9
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.4,
                ease: "easeOut"
            }
        }
    }

    const selectedGame = selectedGameIndex !== null ? games[selectedGameIndex] : null

    // If About Me channel is active, show the dedicated page instead of the menu/overlay
    if (activeChannel === "About Me") {
        return <AboutMeMii onExit={onChannelClose} />
    }

    // If Resume and CV channel is active, show the ResumeAndCV page
    if (activeChannel === "Resume and CV") {
        return <ResumeAndCV onExit={onChannelClose} />
    }

    // If Projects channel is active, show Projects page
    if (activeChannel === "My Projects") {
        return <Projects onExit={onChannelClose} />
    }

    if (activeChannel === "Message Me") {
        return <LetterChannel onExit={onChannelClose} />
    }

    if (activeChannel === "Forecast") {
        return <ForecastChannel onExit={onChannelClose} />
    }

    if (activeChannel === ARCHIVE_TITLE) {
        return (
            <Suspense fallback={<div style={{ position: "fixed", inset: 0, background: "#03060f" }} />}>
                <SecretChannel onExit={onChannelClose} />
            </Suspense>
        )
    }

    // Arcade games each run in their own channel
    const arcadeGame = ARCADE_GAMES.find((g) => g.title === activeChannel)
    if (arcadeGame) {
        return <ArcadeChannel key={arcadeGame.title} game={arcadeGame} onExit={onChannelClose} />
    }

    // Known channels that render dedicated pages
    const knownChannels = new Set(["About Me", "Resume and CV", "My Projects", "Message Me", "Forecast", ARCHIVE_TITLE, ...ARCADE_GAMES.map((g) => g.title)])

    return (
        <div>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className=""
            >
                <div className="menu-viewport">
                    {/* Previous Arrow */}
                    {!activeChannel && (
                        <motion.div
                            className="prev-arrow-container"
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                                duration: 0.5,
                                delay: 0.3,
                                ease: "easeOut"
                            }}
                        >
                            <img
                                src={wiiArrowImg}
                                onClick={handlePrev}
                                className={`prev-arrow ${currentPage === 0 ? 'disabled' : ''}`}
                                alt="Previous page"
                                style={{
                                    opacity: currentPage === 0 ? 0.3 : 1,
                                    cursor: currentPage === 0 ? 'default' : `url('${userCursor}'), auto`
                                }}
                                draggable={false}
                            />
                        </motion.div>
                    )}

                    {/* Next Arrow */}
                    {!activeChannel && (
                        <motion.div
                            className="next-arrow-container"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                                duration: 0.5,
                                delay: 0.3,
                                ease: "easeOut"
                            }}
                        >
                            <NextArrow
                                onNext={handleNext}
                                disabled={currentPage >= totalPages - 1}
                            />
                        </motion.div>
                    )}

                    <div className="push-left">
                        <div className="menu-grid" ref={menuGridRef}>
                            {/* four pages of 4 x 3 channels, like the Wii */}
                            {Array.from({ length: PAGES }, (_, page) => (
                                <motion.div
                                    className="menu-page"
                                    id={`page-${page + 1}`}
                                    key={`page${page}-${menuAnimKey}`}
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    {games.slice(page * PER_PAGE, (page + 1) * PER_PAGE).map((game, i) => {
                                        const slot = page * PER_PAGE + i
                                        const isSecret = game.title === ARCHIVE_TITLE
                                        return (
                                            <motion.div
                                                key={`slot${slot}-${menuAnimKey}`}
                                                variants={cardVariants}
                                                data-slot={slot}
                                                className={`menu-card-wrapper ${isSecret && archiveIsNew ? "is-new" : ""} ${game.title ? "" : "is-empty"}`}
                                            >
                                                {slot === 0 && (
                                                    <div className="spinning-disc" aria-hidden="true">
                                                        <img src={discImg} alt="" draggable={false} />
                                                    </div>
                                                )}
                                                <MenuCard
                                                    title={game.title}
                                                    thumbnail={game.thumbnail}
                                                    onClick={() => handleGameSelect(slot)}
                                                />
                                            </motion.div>
                                        )
                                    })}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Wii Footer */}
                {!activeChannel && !selectedGame && (
                    <motion.div
                        className="wii-footer"
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                    <div>
                            {/* Time above footer in the dip */}
                            <FooterClock className="footer-time-above" format={formatTime} onClick={handleClockTap} />
                        
                            {/* Footer base image */}
                            <img src={footerImg} alt="" className="footer-base-img" draggable={false} />
                        
                            {/* Wii button on the left */}
                            <button
                                className="footer-wii-button"
                                onClick={handleWiiButton}
                                aria-label="Settings"
                                aria-haspopup="dialog"
                            >
                                Wii
                            </button>
                        
                            {/* Email button on the right */}
                            <button 
                                className="footer-email-button"
                                onClick={handleUpdatesOpen}
                                aria-label={unreadUpdates ? `Messages, ${unreadUpdates} new` : "Messages"}
                            >
                                <svg className="footer-email-icon" viewBox="0 0 24 24">
                                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v 2z"/>
                                </svg>
                                {unreadUpdates > 0 && <div className="footer-email-notification">{unreadUpdates}</div>}
                            </button>
                        
                            {/* Date centered in footer */}
                            <FooterClock className="footer-date-center" format={formatDate} />
                        </div>
                    </motion.div>
                )}
            </motion.div>

            <AnimatePresence>
                {isSettingsOpen && (
                    <SettingsPanel
                        onClose={() => setIsSettingsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Notices from Morgan, opened by the mail button */}
            <UpdatesBoard
                isOpen={isUpdatesOpen}
                onClose={() => setIsUpdatesOpen(false)}
                onOpenChannel={handleUpdatesChannel}
                seen={seenAtOpen}
            />

            {/* Intermission / Pause Overlay */}
            <AnimatePresence>
                { /* IntermissionOverlay is handled globally in App; keep local only for channel-specific intermissions */ }
            </AnimatePresence>

            {/* Game Select Screen */}
            <AnimatePresence>
                {selectedGame && (
                    <GameSelectScreen
                        gameTitle={selectedGame.title}
                        gameImage={selectedGame.fullImage}
                        onClose={() => setSelectedGameIndex(null)}
                        onStart={() => {
                            console.log(`Starting ${selectedGame.title}`)
                            // External redirects for LinkedIn and GitHub
                            if (selectedGame.title === 'LinkedIn') {
                                window.open('https://www.linkedin.com/in/morgan--burke/', '_blank', 'noopener,noreferrer')
                                setSelectedGameIndex(null)
                                return
                            }
                            if (selectedGame.title === 'GitHub') {
                                window.open('https://github.com/LemuelBurke?tab=repositories', '_blank', 'noopener,noreferrer')
                                setSelectedGameIndex(null)
                                return
                            }
                            // Open Projects channel
                            if (selectedGame.title === 'My Projects') {
                                onChannelOpen('My Projects')
                                setSelectedGameIndex(null)
                                return
                            }
                            onChannelOpen(selectedGame.title)
                            setSelectedGameIndex(null)
                        }}
                        onNext={handleNextGame}
                        onPrev={handlePrevGame}
                        hasNext={nextGameIndex >= 0}
                        hasPrev={prevGameIndex >= 0}
                        direction={swipeDirection}
                    />
                )}
            </AnimatePresence>

            {/* The jump to hyperspace that reveals the secret channel */}
            {jumping && <Hyperspace onJump={arriveFromHyperspace} onDone={() => setJumping(false)} />}

            {/* Channel Overlay */}
            <AnimatePresence>
                {activeChannel && !knownChannels.has(activeChannel) && (
                    <ChannelOverlay
                        channelId={activeChannel}
                        onClose={onChannelClose}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

// Simple Channel Overlay Component
const ChannelOverlay = ({ channelId, onClose }) => {
    return (
        <motion.div
            className="channel-overlay"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="channel-content">
                <button onClick={onClose} className="channel-close">
                    Close
                </button>
                <h2>Channel: {channelId}</h2>
                {/* Your channel content here */}
            </div>
        </motion.div>
    )
}

export default HomePage