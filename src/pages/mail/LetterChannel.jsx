import { motion, AnimatePresence, MotionConfig } from "framer-motion"
import { useEffect, useState } from "react"
import "../../styles/letterChannel.css"
import mailMusic from "../../assets/audio/mii-channel-music.mp3"
import clickCursor from "../../assets/imgs/cursor-normal2.png"
import miiImg from "../../assets/imgs/plaza/mii.webp"

// Same EmailJS service and template as the contact form (EmailJS is loaded in index.html)
const EMAILJS_SERVICE = "service_4345bru"
const EMAILJS_TEMPLATE = "template_ipi80jz"
const MORGAN_EMAIL = "morganlemburke@gmail.com"

// Each topic is a postage stamp, coloured like the matching envelopes on the CV board
const TOPICS = [
    { label: "Job opportunity", kind: "work" },
    { label: "Freelance or contract work", kind: "project" },
    { label: "Collaboration", kind: "collab" },
    { label: "Something else", kind: "other" },
]

const StampIcon = ({ kind }) => {
    if (kind === "project") {
        return (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 7 L3 12 L8 17 M16 7 L21 12 L16 17" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    }
    if (kind === "collab") {
        return (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="9" cy="12" r="5.5" fill="none" stroke="currentColor" strokeWidth="2.6" />
                <circle cx="15" cy="12" r="5.5" fill="none" stroke="currentColor" strokeWidth="2.6" />
            </svg>
        )
    }
    if (kind === "other") {
        return (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 5.5 Q4 4 5.5 4 H18.5 Q20 4 20 5.5 V14.5 Q20 16 18.5 16 H10 L6 20 V16 H5.5 Q4 16 4 14.5 Z" fill="currentColor" />
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

const today = () => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

/*
 * The Message Me channel: a contact form for recruiters and clients, written as a letter to Morgan on
 * the same lined stationery as the CV board. Picking a topic sticks its stamp on the letter; when
 * sent, it folds into a stamped envelope and flies off while it goes out via EmailJS.
 * stage: "writing" -> "sending" (envelope animation) -> "sent" | back to "writing" with an error
 */
const LetterChannel = ({ onExit }) => {
    const [topic, setTopic] = useState(TOPICS[0].label)
    const [name, setName] = useState("")
    const [company, setCompany] = useState("")
    const [email, setEmail] = useState("")
    const [message, setMessage] = useState("")
    const [touched, setTouched] = useState(false)
    const [stage, setStage] = useState("writing")
    const [error, setError] = useState("")

    useEffect(() => {
        const music = new Audio(mailMusic)
        music.loop = true
        music.volume = 0.25
        music.play().catch(() => { })
        return () => music.pause()
    }, [])

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape" && stage !== "sending") onExit()
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [stage, onExit])

    const problems = {
        name: name.trim() ? "" : "Please add your name.",
        email: isEmail(email) ? "" : "Please add a valid email address so I can reply.",
        message: message.trim().length < 10 ? "Please add a short message." : "",
    }
    const kind = TOPICS.find((t) => t.label === topic).kind
    const valid = !problems.name && !problems.email && !problems.message
    const show = (field) => touched && problems[field]

    const send = async (e) => {
        e.preventDefault()
        setTouched(true)
        if (!valid || stage !== "writing") return
        setError("")
        setStage("sending")
        // let the envelope animation play while the email sends
        const minimumAnimation = new Promise((resolve) => setTimeout(resolve, 2000))
        // the EmailJS template only has a message field, so the topic and company go at the top of it
        const header = [`Topic: ${topic}`, company.trim() && `Company: ${company.trim()}`].filter(Boolean).join("\n")
        try {
            if (typeof window.emailjs === "undefined") throw new Error("EmailJS not loaded")
            await Promise.all([
                window.emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
                    from_name: name.trim(),
                    from_email: email.trim(),
                    message: `${header}\n\n${message.trim()}`,
                }),
                minimumAnimation,
            ])
            setStage("sent")
        } catch {
            await minimumAnimation
            setError("Your message couldn't be sent just now. Please try again in a moment, or email me directly at")
            setStage("writing")
        }
    }

    const writeAnother = () => {
        setMessage("")
        setTouched(false)
        setStage("writing")
    }

    return (
        <MotionConfig reducedMotion="user">
        <motion.div className="letter-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <header className="letter-header">
                <button type="button" className="letter-exit" onClick={onExit} disabled={stage === "sending"}>
                    Exit
                </button>
                <h1 className="letter-title">Message Me</h1>
            </header>

            <main className="letter-main">
                <AnimatePresence mode="wait">
                    {stage === "writing" && (
                        <motion.form
                            key="writing"
                            className="letter-desk"
                            onSubmit={send}
                            noValidate
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ scaleY: 0.1, scaleX: 0.6, opacity: 0, transition: { duration: 0.45, ease: "easeIn" } }}
                        >
                            <p className="letter-intro">
                                Recruiting, have a project in mind, or want to work together? Send me a message and I&apos;ll get back to you by email.
                            </p>

                            <div className="letter-paper">
                                <span className="letter-pin" aria-hidden="true" />

                                <div className="letter-head">
                                    <div className="letter-to">
                                        <span className="letter-mii" aria-hidden="true">
                                            <img src={miiImg} alt="" draggable={false} />
                                        </span>
                                        <p>
                                            <span className="letter-to-label">To</span>
                                            <strong className="letter-to-name">Morgan Burke</strong>
                                            <span className="letter-date">{today()}</span>
                                        </p>
                                    </div>
                                    <AnimatePresence mode="popLayout" initial={false}>
                                        <motion.span
                                            key={kind}
                                            className={`letter-stamp kind-${kind}`}
                                            aria-hidden="true"
                                            initial={{ scale: 1.7, rotate: -18, opacity: 0 }}
                                            animate={{ scale: 1, rotate: 6, opacity: 1 }}
                                            exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.12 } }}
                                            transition={{ type: "spring", stiffness: 420, damping: 22 }}
                                        >
                                            <StampIcon kind={kind} />
                                        </motion.span>
                                    </AnimatePresence>
                                </div>

                                <fieldset className="letter-topics">
                                    <legend>What&apos;s it about?</legend>
                                    {TOPICS.map((t) => (
                                        <label key={t.label} className={`letter-topic kind-${t.kind} ${t.label === topic ? "is-chosen" : ""}`}>
                                            <input type="radio" name="topic" value={t.label} checked={t.label === topic} onChange={() => setTopic(t.label)} />
                                            <span className="letter-topic-stamp" aria-hidden="true">
                                                <StampIcon kind={t.kind} />
                                            </span>
                                            {t.label}
                                        </label>
                                    ))}
                                </fieldset>

                                <label className="letter-body">
                                    <span className="letter-salutation">Dear Morgan,</span>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="A little about the role, project or team, and how I can help."
                                        maxLength={3000}
                                        rows={5}
                                        aria-label="Message"
                                        aria-invalid={Boolean(show("message"))}
                                    />
                                    {show("message") && <em className="letter-problem">{problems.message}</em>}
                                </label>

                                <div className="letter-sign">
                                    <label className="letter-line">
                                        <span>From</span>
                                        <input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Your name"
                                            autoComplete="name"
                                            maxLength={80}
                                            aria-label="Your name"
                                            aria-invalid={Boolean(show("name"))}
                                        />
                                        {show("name") && <em className="letter-problem">{problems.name}</em>}
                                    </label>
                                    <label className="letter-line">
                                        <span>at</span>
                                        <input
                                            value={company}
                                            onChange={(e) => setCompany(e.target.value)}
                                            placeholder="Company (optional)"
                                            autoComplete="organization"
                                            maxLength={100}
                                            aria-label="Company (optional)"
                                        />
                                    </label>
                                    <label className="letter-line letter-line-wide">
                                        <span>Reply to</span>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Your email address"
                                            autoComplete="email"
                                            maxLength={120}
                                            aria-label="Your email address"
                                            aria-invalid={Boolean(show("email"))}
                                        />
                                        {show("email") && <em className="letter-problem">{problems.email}</em>}
                                    </label>
                                </div>
                            </div>

                            {error && (
                                <p className="letter-error" role="alert">
                                    {error} <a href={`mailto:${MORGAN_EMAIL}`}>{MORGAN_EMAIL}</a>.
                                </p>
                            )}

                            <div className="letter-actions">
                                <button type="submit" className="letter-btn letter-btn-primary">
                                    <img src={clickCursor} alt="" draggable={false} />
                                    Send message
                                </button>
                            </div>
                        </motion.form>
                    )}

                    {stage === "sending" && (
                        <motion.div key="sending" className="letter-sending" aria-live="polite">
                            {/* the message folds into an envelope, gets postmarked, then flies off */}
                            <motion.div
                                className="letter-envelope"
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{
                                    scale: [0.6, 1, 1, 0.5],
                                    opacity: [0, 1, 1, 0],
                                    y: [0, 0, 0, -420],
                                    x: [0, 0, 0, 260],
                                    rotate: [0, 0, -4, -18],
                                }}
                                transition={{ duration: 1.9, times: [0, 0.25, 0.6, 1], ease: "easeInOut" }}
                            >
                                <svg viewBox="0 0 200 130" aria-hidden="true">
                                    <rect x="4" y="4" width="192" height="122" rx="14" fill="#fff" stroke="#dde5ea" strokeWidth="4" />
                                    <path d="M8 10 L100 74 L192 10" fill="none" stroke="#dde5ea" strokeWidth="4" />
                                    <rect className={`letter-envelope-stamp kind-${kind}`} x="148" y="16" width="34" height="40" rx="4" fill="currentColor" stroke="#fff" strokeWidth="2.5" strokeDasharray="3 3" />
                                </svg>
                                <motion.span
                                    className="letter-postmark"
                                    initial={{ scale: 2.2, opacity: 0, rotate: -20 }}
                                    animate={{ scale: 1, opacity: 1, rotate: -8 }}
                                    transition={{ delay: 0.55, type: "spring", stiffness: 400, damping: 14 }}
                                >
                                    SENT
                                </motion.span>
                            </motion.div>
                            <p className="letter-sending-text">Sending your message…</p>
                        </motion.div>
                    )}

                    {stage === "sent" && (
                        <motion.div
                            key="sent"
                            className="letter-sent"
                            role="status"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        >
                            <span className="letter-sent-tick" aria-hidden="true">
                                <svg viewBox="0 0 24 24">
                                    <path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </span>
                            <h2>Message sent</h2>
                            <p>
                                Thanks, {name.trim().split(" ")[0]}. I&apos;ve got your message and will reply to <strong>{email.trim()}</strong>.
                            </p>
                            <div className="letter-actions">
                                <button type="button" className="letter-btn" onClick={onExit}>
                                    Wii Menu
                                </button>
                                <button type="button" className="letter-btn letter-btn-primary" onClick={writeAnother}>
                                    Send another
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </motion.div>
        </MotionConfig>
    )
}

export default LetterChannel
