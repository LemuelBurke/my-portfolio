import { motion, AnimatePresence } from "framer-motion"
import { useState, useRef, useEffect, useMemo } from "react"
import "../styles/homepage/index.css"
import MenuCard from "./components/menuCard"
import AboutMeMii from "./aboutMeMii"
import ResumeAndCV from "./resumeAndCV"

// Thumnail Imports
import Img from "../assets/imgs/thumbnails/placeholderCardImg.png"
import miiMorgan from "../assets/imgs/thumbnails/2025-12-06 14-18-45.gif"
import projectImg from "../assets/imgs/thumbnails/projects.png"
import linkedImg from "../assets/imgs/thumbnails/linkedin.png"
import githubImg from "../assets/imgs/thumbnails/github.png"
import linkedFULLimg from "../assets/imgs/thumbnails/linkedinFULL.png"
import githubFULLimg from "../assets/imgs/thumbnails/githubFULL.png"
import projectFULLimg from "../assets/imgs/thumbnails/projectsFULL.png"
import cvFULLimg from "../assets/imgs/thumbnails/cvFULL.png"

import NextArrow from "./components/nextPage"
import wiiArrowImg from "../assets/imgs/wiiArrow.svg"
import GameSelectScreen from "./components/gameSelectScreen"
import ContactMe from "./components/contactMe"
import userCursor from "../assets/imgs/user-cursor-med.png"
import footerImg from "../assets/imgs/footer_img.png"
import cvImg from "../assets/imgs/thumbnails/cv.png"

const HomePage = ({ onChannelOpen, activeChannel, onChannelClose }) => {
    const [currentPage, setCurrentPage] = useState(0)
    const [currentTime, setCurrentTime] = useState(new Date())
    const [selectedGameIndex, setSelectedGameIndex] = useState(null)
    const [isContactOpen, setIsContactOpen] = useState(false)
    const [swipeDirection, setSwipeDirection] = useState(0) // -1 prev, 1 next
    const menuGridRef = useRef(null)
    const totalPages = 2

    // Key to force re-mounting menu pages to replay animations
    const [menuAnimKey, setMenuAnimKey] = useState(0)

    // Create games array with all projects
    const games = useMemo(() => {
        const allGames = [
            {
                title: "About Me",
                thumbnail: miiMorgan,
                fullImage: miiMorgan
            },
            {
                title: "Resume and CV",
                thumbnail: cvImg,
                fullImage: cvFULLimg
            },
            {
                title: "My Projects",
                thumbnail: projectImg,
                fullImage: projectFULLimg
            },
            {
                title: "LinkedIn",
                thumbnail: linkedImg,
                fullImage: linkedFULLimg
            },
            {
                title: "GitHub",
                thumbnail: githubImg,
                fullImage: githubFULLimg
            },
            ...Array.from({ length: 6 }, (_, i) => ({
                title: ``,
                thumbnail: Img,
                fullImage: Img
            })),
            ...Array.from({ length: 12 }, (_, i) => ({
                title: `Project ${i + 13}`,
                thumbnail: Img,
                fullImage: Img
            }))
        ];
        return allGames;
    }, []);

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    // When closing selected game, force menu pages to re-mount to replay card animations
    useEffect(() => {
        if (selectedGameIndex === null) {
            // small tick to change key and re-trigger animations
            setMenuAnimKey(prev => prev + 1)
        }
    }, [selectedGameIndex])

    const handleNext = () => {
        if (currentPage < totalPages - 1 && window.innerWidth >= 1024) {
            const nextPage = currentPage + 1
            setCurrentPage(nextPage)

            if (menuGridRef.current) {
                menuGridRef.current.scrollTo({
                    left: nextPage * menuGridRef.current.clientWidth,
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
                    left: prevPage * menuGridRef.current.clientWidth,
                    behavior: 'smooth'
                })
            }
        }
    }

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
    }

    const formatDate = (date) => {
        return date.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'numeric'
        })
    }

    // Open contact modal
    const handleContactOpen = () => {
        setIsContactOpen(true)
    }

    // Close contact modal
    const handleContactClose = () => {
        setIsContactOpen(false)
    }

    // Game navigation
    const handleGameSelect = (index) => {
        setSelectedGameIndex(index)
        setSwipeDirection(0)
    }

    const handleNextGame = () => {
        if (selectedGameIndex < games.length - 1) {
            setSwipeDirection(1)
            setSelectedGameIndex(selectedGameIndex + 1)
        }
    }

    const handlePrevGame = () => {
        if (selectedGameIndex > 0) {
            setSwipeDirection(-1)
            setSelectedGameIndex(selectedGameIndex - 1)
        }
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

    // Known channels that render dedicated pages
    const knownChannels = new Set(["About Me", "Resume and CV"])

    return (
        <>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
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
                            {/* PAGE 1 */}
                            <motion.div
                                className="menu-page"
                                id="page-1"
                                key={`page1-${menuAnimKey}`}
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {games.slice(0, 12).map((game, i) => (
                                    <motion.div
                                        key={`page1-${i}-${menuAnimKey}`}
                                        variants={cardVariants}
                                        whileHover={{
                                            scale: 1.05,
                                            transition: { duration: 0.2 }
                                        }}
                                    >
                                        <MenuCard
                                            title={game.title}
                                            thumbnail={game.thumbnail}
                                            onClick={() => handleGameSelect(i)}
                                        />
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* PAGE 2 */}
                            <motion.div
                                className="menu-page"
                                id="page-2"
                                key={`page2-${menuAnimKey}`}
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {games.slice(12, 24).map((game, i) => (
                                    <motion.div
                                        key={`page2-${i}-${menuAnimKey}`}
                                        variants={cardVariants}
                                        whileHover={{
                                            scale: 1.05,
                                            transition: { duration: 0.2 }
                                        }}
                                    >
                                        <MenuCard
                                            title={game.title}
                                            thumbnail={game.thumbnail}
                                            onClick={() => handleGameSelect(i + 12)}
                                        />
                                    </motion.div>
                                ))}
                            </motion.div>
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
                        {/* Time above footer in the dip */}
                        <div className="footer-time-above">{formatTime(currentTime)}</div>
                        
                        {/* Footer base image */}
                        <img src={footerImg} alt="" className="footer-base-img" draggable={false} />
                        
                        {/* Wii button on the left */}
                        <button 
                            className="footer-wii-button"
                            onClick={() => console.log('Wii button clicked')}
                        >
                            Wii
                        </button>
                        
                        {/* Email button on the right */}
                        <button 
                            className="footer-email-button"
                            onClick={handleContactOpen}
                        >
                            <svg className="footer-email-icon" viewBox="0 0 24 24">
                                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v 2z"/>
                            </svg>
                            <div className="footer-email-notification">1</div>
                        </button>
                        
                        {/* Date centered in footer */}
                        <div className="footer-date-center">{formatDate(currentTime)}</div>
                    </motion.div>
                )}
            </motion.div>

            {/* Contact Form Modal */}
            <ContactMe 
                isOpen={isContactOpen}
                onClose={handleContactClose}
            />

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
                            // Projects placeholder
                            if (selectedGame.title === 'My Projects') {
                                alert('Coming soon!')
                                setSelectedGameIndex(null)
                                return
                            }
                            onChannelOpen(selectedGame.title)
                            setSelectedGameIndex(null)
                        }}
                        onNext={handleNextGame}
                        onPrev={handlePrevGame}
                        hasNext={selectedGameIndex < games.length - 1}
                        hasPrev={selectedGameIndex > 0}
                        direction={swipeDirection}
                    />
                )}
            </AnimatePresence>

            {/* Channel Overlay */}
            <AnimatePresence>
                {activeChannel && !knownChannels.has(activeChannel) && (
                    <ChannelOverlay
                        channelId={activeChannel}
                        onClose={onChannelClose}
                    />
                )}
            </AnimatePresence>
        </>
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