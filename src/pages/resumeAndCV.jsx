import { motion, AnimatePresence } from "framer-motion"
import { useCallback, useEffect, useState } from "react"
import "../styles/resumeAndCV.css"
import wiiShopMusic from "../assets/audio/wiiShopMusic.mp3"
import cvPdf from "../assets/Morgan Burke CV.pdf"
import miiImg from "../assets/imgs/plaza/mii.webp"
import clickCursor from "../assets/imgs/cursor-normal2.png"
import ContactMe from "./components/contactMe"
import { EDUCATION, EXPERIENCE, MEMOS, PROFILE, PROJECTS, SKILLS } from "./cv/cvData"

// The rows of envelopes on the board. Every letter gets an id so it can be marked as read.
const ROWS = [
    { id: "experience", title: "Experience", letters: EXPERIENCE.map((e) => ({ ...e, id: `exp-${e.org}-${e.title}` })) },
    {
        id: "projects",
        title: "Projects",
        letters: PROJECTS.map((p) => ({ ...p, id: `proj-${p.title}`, kind: "project", org: p.role })),
    },
    { id: "education", title: "Education", letters: EDUCATION.map((e) => ({ ...e, id: `edu-${e.title}`, kind: "education" })) },
]

const KIND_LABEL = { work: "Work", achievement: "Achievement", volunteering: "Volunteering", education: "Education", project: "Project" }

// Little stamp icons for each kind of letter
const StampIcon = ({ kind }) => {
    if (kind === "education") {
        return (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 4 L23 9 L12 14 L1 9 Z" fill="currentColor" />
                <path d="M6 11.5 V16 Q12 19.5 18 16 V11.5 L12 14.2 Z" fill="currentColor" opacity="0.75" />
            </svg>
        )
    }
    if (kind === "achievement") {
        return (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.5 L14.9 8.6 L21.5 9.3 L16.5 13.7 L17.9 20.3 L12 16.9 L6.1 20.3 L7.5 13.7 L2.5 9.3 L9.1 8.6 Z" fill="currentColor" />
            </svg>
        )
    }
    if (kind === "volunteering") {
        return (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 4 C9 4 4 9 4 17 Q4 19 5 20 C6 13 10 10 15 9 C11 11 8 14 7 19 Q8 20 10 20 C17 20 20 13 20 4 Z" fill="currentColor" />
            </svg>
        )
    }
    if (kind === "project") {
        return (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 7 L3 12 L8 17 M16 7 L21 12 L16 17" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    }
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="2.5" y="7" width="19" height="13" rx="3" fill="currentColor" />
            <path d="M9 7 V5.5 Q9 4 10.5 4 H13.5 Q15 4 15 5.5 V7" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
    )
}

// The front of a letter: enough to read the CV at a glance; open it for the details
const Envelope = ({ letter, unread, index, onOpen }) => (
    <motion.button
        type="button"
        className={`board-envelope kind-${letter.kind}`}
        onClick={() => onOpen(letter)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, rotate: index % 2 ? 1 : -1 }}
        transition={{ delay: 0.04 * index, type: "spring", stiffness: 260, damping: 22 }}
        whileHover={{ y: -5, rotate: 0, scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        aria-label={`${letter.title}, ${letter.org}${letter.when ? `, ${letter.when}` : ""}. Open letter${unread ? " (unread)" : ""}`}
    >
        <svg className="board-envelope-flap" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 0 L50 36 L100 0" fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="board-envelope-stamp" title={KIND_LABEL[letter.kind]}>
            <StampIcon kind={letter.kind} />
        </span>
        {unread && <span className="board-envelope-new" aria-hidden="true" />}
        <span className="board-envelope-short">{letter.short}</span>
        <span className="board-envelope-title">{letter.title}</span>
        <span className="board-envelope-org">{letter.org}</span>
    </motion.button>
)

const ResumeAndCV = ({ onExit }) => {
    const [openLetter, setOpenLetter] = useState(null)
    const [read, setRead] = useState(() => new Set())
    const [isContactOpen, setIsContactOpen] = useState(false)

    useEffect(() => {
        const music = new Audio(wiiShopMusic)
        music.loop = true
        music.volume = 0.35
        music.play().catch(() => { })
        return () => music.pause()
    }, [])

    const open = useCallback((letter) => {
        setOpenLetter(letter)
        setRead((prev) => new Set(prev).add(letter.id))
    }, [])

    // Previous / Next move through the row the open letter belongs to
    const row = openLetter ? ROWS.find((r) => r.letters.some((l) => l.id === openLetter.id)) : null
    const rowIndex = row ? row.letters.findIndex((l) => l.id === openLetter.id) : -1
    const step = useCallback((dir) => {
        const next = row?.letters[rowIndex + dir]
        if (next) open(next)
    }, [row, rowIndex, open])

    useEffect(() => {
        const onKeyDown = (e) => {
            if (isContactOpen) return
            if (openLetter) {
                if (e.key === "Escape") setOpenLetter(null)
                if (e.key === "ArrowLeft") step(-1)
                if (e.key === "ArrowRight") step(1)
                return
            }
            if (e.key === "Escape") onExit()
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [openLetter, isContactOpen, step, onExit])

    const handleSave = () => {
        const a = document.createElement("a")
        a.href = cvPdf
        a.download = "Morgan Burke CV.pdf"
        document.body.appendChild(a)
        a.click()
        a.remove()
    }

    return (
        <motion.div className="board-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <header className="board-header">
                <button type="button" className="board-exit" onClick={onExit}>
                    Exit
                </button>
                <h1 className="board-title">Morgan&apos;s Message Board</h1>
            </header>

            <main className="board-scroll">
                <div className="board-inner">
                    {/* An opened welcome letter, pinned to the top of the board */}
                    <motion.section
                        className="board-welcome"
                        aria-label="About Morgan"
                        initial={{ opacity: 0, y: 20, rotate: -1 }}
                        animate={{ opacity: 1, y: 0, rotate: -0.6 }}
                        transition={{ type: "spring", stiffness: 220, damping: 22 }}
                    >
                        <span className="board-pin" aria-hidden="true" />
                        <div className="board-welcome-mii">
                            <img src={miiImg} alt="Morgan's Mii" draggable={false} />
                        </div>
                        <div className="board-welcome-text">
                            <p className="board-welcome-hello">Hi, I&apos;m</p>
                            <h2>{PROFILE.name}</h2>
                            <p className="board-welcome-headline">{PROFILE.headline}</p>
                            <p className="board-welcome-highlights">
                                {PROFILE.highlights.map((h) => (
                                    <span key={h}>{h}</span>
                                ))}
                            </p>
                            <p className="board-welcome-summary">{PROFILE.summary}</p>
                            <div className="board-welcome-actions">
                                <button type="button" className="board-btn board-btn-primary" onClick={handleSave}>
                                    Download CV
                                </button>
                                <button type="button" className="board-btn" onClick={() => setIsContactOpen(true)}>
                                    Contact Me
                                </button>
                                {PROFILE.links.map((l) => (
                                    <a key={l.href} className="board-link" href={l.href} target="_blank" rel="noopener noreferrer">
                                        {l.label}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </motion.section>

                    <p className="board-hint">
                        <img src={clickCursor} alt="" draggable={false} />
                        Open a letter to read more
                    </p>

                    {ROWS.map((r) => (
                        <section key={r.id} className="board-row" aria-labelledby={`board-${r.id}`}>
                            <h2 id={`board-${r.id}`} className="board-row-title">
                                {r.title} <span>{r.letters.length}</span>
                            </h2>
                            <div className="board-envelopes">
                                {r.letters.map((letter, i) => (
                                    <Envelope key={letter.id} letter={letter} index={i} unread={!read.has(letter.id)} onOpen={open} />
                                ))}
                            </div>
                        </section>
                    ))}

                    <section className="board-row" aria-labelledby="board-notes">
                        <h2 id="board-notes" className="board-row-title">
                            Pinned notes
                        </h2>
                        <div className="board-memos">
                            <div className="board-memo board-memo-wide" style={{ "--memo-color": "#fff4a8", "--memo-tilt": "-0.8deg" }}>
                                <span className="board-pin" aria-hidden="true" />
                                <h3>Technical skills</h3>
                                {SKILLS.map((s) => (
                                    <div key={s.group} className="board-memo-group">
                                        <h4>{s.group}</h4>
                                        <ul>
                                            {s.items.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                            {MEMOS.map((memo, i) => (
                                <div key={memo.id} className="board-memo" style={{ "--memo-color": memo.color, "--memo-tilt": `${i % 2 ? -1.2 : 1.2}deg` }}>
                                    <span className="board-pin" aria-hidden="true" />
                                    <h3>{memo.title}</h3>
                                    <ul>
                                        {memo.items.map((item) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </main>

            <AnimatePresence>
                {openLetter && (
                    <motion.div
                        className="board-letter-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpenLetter(null)}
                    >
                        <motion.article
                            key={openLetter.id}
                            className={`board-letter kind-${openLetter.kind}`}
                            role="dialog"
                            aria-modal="true"
                            aria-label={`${openLetter.title}, ${openLetter.org}`}
                            initial={{ opacity: 0, y: 80, scale: 0.85, rotate: -2 }}
                            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, y: 40, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 280, damping: 24 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="board-letter-head">
                                <span className="board-letter-stamp">
                                    <StampIcon kind={openLetter.kind} />
                                </span>
                                <div>
                                    <p className="board-letter-from">
                                        {KIND_LABEL[openLetter.kind]} · <strong>{openLetter.org}</strong>
                                    </p>
                                    <h2 className="board-letter-title">{openLetter.title}</h2>
                                    {openLetter.when && <p className="board-letter-when">{openLetter.when}</p>}
                                </div>
                            </div>
                            {openLetter.tech && (
                                <p className="board-letter-tags">
                                    {openLetter.tech.map((t) => (
                                        <span key={t}>{t}</span>
                                    ))}
                                </p>
                            )}
                            {openLetter.points?.length > 0 && (
                                <ul className="board-letter-points">
                                    {openLetter.points.map((p) => (
                                        <li key={p}>{p}</li>
                                    ))}
                                </ul>
                            )}
                            {openLetter.links && (
                                <p className="board-letter-links">
                                    {openLetter.links.map((l) => (
                                        <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
                                            {l.label}
                                        </a>
                                    ))}
                                </p>
                            )}
                            <div className="board-letter-nav">
                                <button type="button" className="board-btn" onClick={() => step(-1)} disabled={rowIndex <= 0}>
                                    ◀ Previous
                                </button>
                                <button type="button" className="board-btn board-btn-primary" onClick={() => setOpenLetter(null)} autoFocus>
                                    Back to board
                                </button>
                                <button type="button" className="board-btn" onClick={() => step(1)} disabled={!row || rowIndex >= row.letters.length - 1}>
                                    Next ▶
                                </button>
                            </div>
                        </motion.article>
                    </motion.div>
                )}
            </AnimatePresence>

            <ContactMe isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
        </motion.div>
    )
}

export default ResumeAndCV
