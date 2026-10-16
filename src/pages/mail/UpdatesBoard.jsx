import { motion, AnimatePresence } from "framer-motion"
import { useEffect } from "react"
import "../../styles/updatesBoard.css"
import { UPDATES } from "./updates"

// The Wii menu's mail button opens this: a little message board of notices from Morgan
const UpdatesBoard = ({ isOpen, onClose, onOpenChannel, seen }) => {
    useEffect(() => {
        if (!isOpen) return
        const onKeyDown = (e) => {
            if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [isOpen, onClose])

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="updates-backdrop"
                    onClick={onClose}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="updates-board"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="updates-title"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ y: 40, scale: 0.92, opacity: 0 }}
                        animate={{ y: 0, scale: 1, opacity: 1 }}
                        exit={{ y: 30, scale: 0.95, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 280, damping: 24 }}
                    >
                        <header className="updates-head">
                            <h2 id="updates-title">Messages</h2>
                            <button type="button" className="updates-close" onClick={onClose} aria-label="Close messages">
                                ✕
                            </button>
                        </header>
                        <div className="updates-list">
                            {UPDATES.map((u, i) => (
                                <motion.article
                                    key={u.id}
                                    className="updates-note"
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.08 + i * 0.06 }}
                                >
                                    <div className="updates-note-top">
                                        <span className="updates-note-from">From Morgan</span>
                                        {!seen.has(u.id) && <span className="updates-new">New</span>}
                                        <time>{u.date}</time>
                                    </div>
                                    <h3>{u.title}</h3>
                                    <p>{u.body}</p>
                                    {u.action && (
                                        <button type="button" className="updates-action" onClick={() => onOpenChannel(u.action.channel)}>
                                            {u.action.label} ▶
                                        </button>
                                    )}
                                </motion.article>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default UpdatesBoard
