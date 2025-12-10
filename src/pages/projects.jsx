import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import "../styles/projects.css"
import wiiSportsMusic from "../assets/audio/wiiSports.mp3"
import wiiPlaceholder from "../assets/imgs/thumbnails/placeholderCardImg.png"
import NflApp from "./NflApp"
import WiiPortfolio from "./WiiPortfolio"
import nfllogo from "../assets/imgs/screenshots-and-media/NFL-Logo.png"
import backgroundImg from "../assets/imgs/projects/background.png"
import titleImg from "../assets/imgs/projects/title.png"

const Projects = ({ onExit }) => {
    const audioRef = useRef(null)
    const [selectedProject, setSelectedProject] = useState(null)
    const [selectedTags, setSelectedTags] = useState([])

    useEffect(() => {
        const music = new Audio(wiiSportsMusic)
        music.loop = true
        music.volume = 0.35
        audioRef.current = music
        music.play().catch(() => {})
        return () => {
            try { music.pause(); music.currentTime = 0 } catch (_) {}
        }
    }, [])

    const projects = [
        {
            id: 1,
            title: "NFL Superfan mobile app",
            thumb: nfllogo,
            tags: ['Academic'],
        },
        {
            id: 2,
            title: "Wii Themed Portfolio Site",
            thumb: wiiPlaceholder,
            tags: ['personal'],
        },
    ]

    const allTags = Array.from(new Set(projects.flatMap(p => p.tags || [])))

    const visibleProjects = selectedTags.length === 0
        ? projects
        : projects.filter(p => (p.tags || []).some(t => selectedTags.includes(t)))

    const toggleTag = (tag) => {
        setSelectedTags(prev => {
            if (prev.includes(tag)) return prev.filter(t => t !== tag)
            return [...prev, tag]
        })
    }

    const clearTags = () => setSelectedTags([])

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

    return (
        <motion.div
            className="wii-resort-projects-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Background Image */}
            <div className="wii-resort-background" style={{ backgroundImage: `url(${backgroundImg})` }}></div>

            {/* Main Content Area */}
            <div className="wii-resort-main-content">
                {/* Title Area */}
                <div className="wii-resort-title-area">
                    <img src={titleImg} alt="My Projects" className="wii-resort-title-img" draggable={false} />
                </div>

                {/* Projects Grid - Wii Sports Resort Style */}
                <section className="wii-resort-projects-content">
                    <motion.div
                        className="wii-resort-projects-grid"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        key={selectedTags.join(',')}
                    >
                        <AnimatePresence mode="popLayout">
                            {visibleProjects.map((project) => (
                                <motion.div
                                    className="wii-resort-project-card-wrap"
                                    key={project.id}
                                    variants={cardVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    whileHover={{
                                        scale: 1.08,
                                        transition: { duration: 0.2 }
                                    }}
                                    onClick={() => {
                                        if (selectedProject !== project) setSelectedProject(project);
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if ((e.key === 'Enter' || e.key === ' ') && selectedProject !== project) setSelectedProject(project);
                                    }}
                                >
                                    <div className="wii-resort-project-card">
                                        <div className="wii-resort-card-image">
                                            {project.thumb ? (
                                                <img 
                                                    className="wii-resort-project-thumb" 
                                                    src={project.thumb} 
                                                    alt={`${project.title} thumbnail`} 
                                                    draggable={false} 
                                                />
                                            ) : (
                                                <div className="wii-resort-project-thumb placeholder" />
                                            )}
                                        </div>
                                        <div className="wii-resort-card-title">
                                            <h3>{project.title}</h3>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                </section>
            </div>

            {/* Left Sidebar Navigation - Wii Sports Resort Style */}
            <aside className="wii-resort-sidebar">
                <div className="wii-resort-sidebar-content">
                    <button 
                        className="wii-resort-sidebar-btn wii-resort-btn-exit"
                        onClick={onExit}
                    >
                        <span className="wii-resort-btn-text">Exit</span>
                    </button>
                    
                    <div className="wii-resort-filter-group">
                        <button
                            className={`wii-resort-filter-btn ${selectedTags.length === 0 ? 'wii-resort-filter-active' : ''}`}
                            onClick={clearTags}
                            aria-pressed={selectedTags.length === 0}
                        >
                            All
                        </button>
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                className={`wii-resort-filter-btn ${selectedTags.includes(tag) ? 'wii-resort-filter-active' : ''}`}
                                onClick={() => toggleTag(tag)}
                                aria-pressed={selectedTags.includes(tag)}
                            >
                                {tag.charAt(0).toUpperCase() + tag.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Project Detail Panel - Slides in from right */}
            <AnimatePresence>
                {selectedProject && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="wii-resort-detail-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedProject(null)}
                        />
                        
                        {/* Side Panel */}
                        <motion.div
                            className="wii-resort-detail-panel"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            {/* Header with Close Button */}
                            <div className="wii-resort-detail-header">
                                <button 
                                    className="wii-resort-detail-close" 
                                    onClick={() => setSelectedProject(null)}
                                >
                                    ×
                                </button>
                            </div>

                            {/* Main Content Layout */}
                            <div className="wii-resort-detail-content">
                                {/* Left Side: Media, Title, Short Description */}
                                <div className="wii-resort-detail-left">
                                    <div className="wii-resort-detail-media">
                                        {selectedProject.thumb && (
                                            <img 
                                                className="wii-resort-detail-thumb" 
                                                src={selectedProject.thumb} 
                                                alt="Project screenshot" 
                                                draggable={false} 
                                            />
                                        )}
                                        {selectedProject.videoSrc && (
                                            <video className="wii-resort-detail-thumb" controls>
                                                <source src={selectedProject.videoSrc} type="video/mp4" />
                                                Your browser does not support the video tag.
                                            </video>
                                        )}
                                    </div>
                                    <div className="wii-resort-detail-info">
                                        <h2 className="wii-resort-detail-title">{selectedProject.title}</h2>
                                        <p className="wii-resort-detail-short">
                                            {selectedProject.shortDescription || selectedProject.description || ""}
                                        </p>
                                    </div>
                                </div>

                                {/* Right Side: Full Description */}
                                <div className="wii-resort-detail-right">
                                    <div className="wii-resort-detail-body">
                                        {selectedProject.id === 1 ? (
                                            <NflApp title={selectedProject.title} thumb={selectedProject.thumb} />
                                        ) : selectedProject.id === 2 ? (
                                            <WiiPortfolio title={selectedProject.title} thumb={selectedProject.thumb} />
                                        ) : (
                                            <p>{selectedProject?.description || "Coming soon..."}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export default Projects
