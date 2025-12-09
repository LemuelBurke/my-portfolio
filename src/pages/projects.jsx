import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import "../styles/projects.css"
import wiiPartyMusic from "../assets/audio/wiiParty.mp3"
import wiiPlaceholder from "../assets/imgs/thumbnails/placeholderCardImg.png"
import NflApp from "./NflApp"
import nfllogo from "../assets/imgs/screenshots-and-media/NFL-Logo.png";

const Projects = ({ onExit }) => {
    const audioRef = useRef(null)
    const [selectedProject, setSelectedProject] = useState(null)
    const [selectedTags, setSelectedTags] = useState([])

    useEffect(() => {
        const music = new Audio(wiiPartyMusic)
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
            tags: ['personal'],
            description: null // JSX will be used for this project
        },
        {
            id: 2,
            title: "Wii Themed Portfolio Site",
            description: "A playful, Wii-inspired portfolio with interactive UI and nostalgic visuals. More details coming soon.",
            thumb: wiiPlaceholder,
            tags: ['personal'],
        },
        {
            id: 3,
            title: "Project 3",
            description: "Details about project 3 will appear here.",
            thumb: wiiPlaceholder,
            tags: ['academic'],
        },
    ]

    const allTags = Array.from(new Set(projects.flatMap(p => p.tags || [])))

    const headerTitle = selectedProject ? `My Project > ${selectedProject.title}` : "My Projects"

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

    return (
        <motion.div
            className="projects-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <header className="projects-header">
                {!selectedProject && (
                    <button className="projects-exit no-crt" onClick={onExit} style={{background: '#ef4444'}}>
                        Exit
                    </button>
                )}
                <h1 className="projects-title">{headerTitle}</h1>
            </header>

            <div className="projects-main">
                <aside className="projects-sidebar" aria-label="Project filters">
                    <h4 className="sidebar-title">Filter</h4>
                    <div className="sidebar-controls">
                        <button
                            key="all"
                            className={`filter-button no-crt ${selectedTags.length === 0 ? 'active' : ''}`}
                            onClick={clearTags}
                            aria-pressed={selectedTags.length === 0}
                        >
                            All
                        </button>

                        {allTags.map(tag => (
                            <button
                                key={tag}
                                className={`filter-button no-crt ${selectedTags.includes(tag) ? 'active' : ''}`}
                                onClick={() => toggleTag(tag)}
                                aria-pressed={selectedTags.includes(tag)}
                            >
                                {tag.charAt(0).toUpperCase() + tag.slice(1)}
                            </button>
                        ))}
                    </div>
                </aside>

                <section className="projects-content">
                    <div className="projects-grid">
                        {visibleProjects.map((project) => (
                            <div
                                className="project-card no-crt"
                                key={project.id}
                                onClick={() => {
                                    if (selectedProject !== project) setSelectedProject(project);
                                }}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if ((e.key === 'Enter' || e.key === ' ') && selectedProject !== project) setSelectedProject(project);
                                }}
                            >
                                {project.thumb ? (
                                    <img className="project-thumb no-crt" src={project.thumb} alt={`${project.title} thumbnail`} draggable={false} />
                                ) : (
                                    <div className="project-thumb placeholder no-crt" />
                                )}
                                <div className="project-info">
                                    <h3>{project.title}</h3>
                                    <p>Coming soon...</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {selectedProject && (
                <motion.div
                    className="project-detail-overlay no-crt modern-popup"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedProject(null)}
                >
                    <motion.div
                        className="project-detail modern-popup-card"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.18 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="project-detail-header">
                            <h2>{selectedProject.title}</h2>
                            <button className="project-detail-close no-crt" onClick={() => setSelectedProject(null)} style={{background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: '1.5rem', borderRadius: '50%', width: '2.5rem', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: '0 2px 8px rgba(239,68,68,0.12)'}}>
                                &times;
                            </button>
                        </div>
                        <div className="project-detail-media">
                            <img className="project-thumb-media no-crt" src={selectedProject.thumb} alt="Screenshot" draggable={false} />
                            {selectedProject.videoSrc && (
                                <video className="project-thumb-media" controls>
                                    <source src={selectedProject.videoSrc} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            )}
                        </div>
                        <div className="project-detail-body">
                            {selectedProject.id === 1 ? (
                                <NflApp title={selectedProject.title} thumb={selectedProject.thumb} />
                            ) : (
                                <p>{selectedProject?.description}</p>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </motion.div>
    )
}

export default Projects
