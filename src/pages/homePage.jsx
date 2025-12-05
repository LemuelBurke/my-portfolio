import { motion, AnimatePresence } from "framer-motion"
import { useState, useRef, useEffect } from "react"
import "../styles/homePage.css"
import MenuCard from "./components/menuCard"
import Img from "../assets/imgs/placeholderCardImg.png"
import NextArrow from "./components/nextPage"
import wiiArrowImg from "../assets/imgs/wiiArrow.svg"

const HomePage = ({ onChannelOpen, activeChannel, onChannelClose }) => {
    const [currentPage, setCurrentPage] = useState(0)
    const [currentTime, setCurrentTime] = useState(new Date())
    const menuGridRef = useRef(null)
    const totalPages = 2

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    const handleNext = () => {
        if (currentPage < totalPages - 1) {
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
        if (currentPage > 0) {
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
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'numeric',
            day: 'numeric'
        })
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
                                    cursor: currentPage === 0 ? 'default' : 'pointer'
                                }}
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
                                variants={containerVariants}
                            >
                                {[...Array(12)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        variants={cardVariants}
                                        whileHover={{
                                            scale: 1.05,
                                            transition: { duration: 0.2 }
                                        }}
                                    >
                                        <MenuCard
                                            title=""
                                            onClick={() => onChannelOpen(`channel-${i}`)}
                                        >
                                            <img src={Img} style={{ width: "120%" }} alt="" />
                                        </MenuCard>
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* PAGE 2 */}
                            <motion.div
                                className="menu-page"
                                id="page-2"
                                variants={containerVariants}
                            >
                                {[...Array(12)].map((_, i) => (
                                    <motion.div
                                        key={`page2-${i}`}
                                        variants={cardVariants}
                                        whileHover={{
                                            scale: 1.05,
                                            transition: { duration: 0.2 }
                                        }}
                                    >
                                        <MenuCard
                                            title=""
                                            onClick={() => onChannelOpen(`channel-page2-${i}`)}
                                        >
                                            <img src={Img} style={{ width: "120%" }} alt="" />
                                        </MenuCard>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Wii Footer */}
                {!activeChannel && (
                    <motion.div
                        className="wii-footer"
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        <div className="footer-left">
                            <div className="footer-button">
                                <span style={{ fontSize: '24px' }}>Wii</span>
                            </div>
                            <div className="footer-button">
                                <span style={{ fontSize: '20px' }}>💾</span>
                            </div>
                        </div>

                        <div className="footer-center">
                            <div className="footer-time">{formatTime(currentTime)}</div>
                            <div className="footer-date">{formatDate(currentTime)}</div>
                        </div>

                        <div className="footer-right">
                            <div className="footer-button">
                                <span style={{ fontSize: '24px' }}>✉️</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </motion.div>

            {/* Channel Overlay */}
            <AnimatePresence>
                {activeChannel && (
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