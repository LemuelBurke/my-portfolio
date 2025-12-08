import { motion } from "framer-motion"
import { useEffect, useRef } from "react"
import "../styles/projects.css"
import wiiPartyMusic from "../assets/audio/wiiParty.mp3"

const Projects = ({ onExit }) => {
    const audioRef = useRef(null)

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

    return (
        <motion.div
            className="projects-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <header className="projects-header">
                <button className="projects-exit" onClick={onExit}>Exit</button>
                <h1 className="projects-title">My Projects</h1>
            </header>

            <section className="projects-content">
                <div className="projects-grid">
                    <div className="project-card" key={1}>
                        <div className="project-thumb" />
                        <div className="project-info">
                            <h3>NFL Superfan app</h3>
                            <p>Coming soon...</p>
                        </div>
                    </div>
                    <div className="project-card" key={2}>
                        <div className="project-thumb" />
                        <div className="project-info">
                            <h3>Wii Themed Portfolio Site</h3>
                            <p>Coming soon...</p>
                        </div>
                    </div>
                    <div className="project-card" key={3}>
                        <div className="project-thumb" />
                        <div className="project-info">
                            <h3>Project 3</h3>
                            <p>Coming soon...</p>
                        </div>
                    </div>
                </div>
            </section>
        </motion.div>
    )
}

export default Projects
