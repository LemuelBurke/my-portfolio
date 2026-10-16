import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import "../../styles/letterChannel.css"
import mailMusic from "../../assets/audio/mii-channel-music.mp3"
import clickCursor from "../../assets/imgs/cursor-normal2.png"

// Same EmailJS service and template as the contact form (EmailJS is loaded in index.html)
const EMAILJS_SERVICE = "service_4345bru"
const EMAILJS_TEMPLATE = "template_ipi80jz"
const MORGAN_EMAIL = "morganlemburke@gmail.com"

const TOPICS = ["Job opportunity", "Freelance or contract work", "Collaboration", "Something else"]

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

/*
 * The Message Me channel: a straightforward contact form for recruiters and clients, styled as a
 * Wii message. When sent, it folds into an envelope and flies off while it goes out via EmailJS.
 * stage: "writing" -> "sending" (envelope animation) -> "sent" | back to "writing" with an error
 */
const LetterChannel = ({ onExit }) => {
    const [topic, setTopic] = useState(TOPICS[0])
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
                                <fieldset className="letter-topics">
                                    <legend>What&apos;s it about?</legend>
                                    {TOPICS.map((t) => (
                                        <label key={t} className={`letter-topic ${t === topic ? "is-chosen" : ""}`}>
                                            <input type="radio" name="topic" value={t} checked={t === topic} onChange={() => setTopic(t)} />
                                            {t}
                                        </label>
                                    ))}
                                </fieldset>

                                <div className="letter-fields">
                                    <label className="letter-field">
                                        <span>Name</span>
                                        <input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            autoComplete="name"
                                            maxLength={80}
                                            aria-invalid={Boolean(show("name"))}
                                        />
                                        {show("name") && <em className="letter-problem">{problems.name}</em>}
                                    </label>
                                    <label className="letter-field">
                                        <span>
                                            Company <small>(optional)</small>
                                        </span>
                                        <input value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" maxLength={100} />
                                    </label>
                                    <label className="letter-field letter-field-wide">
                                        <span>Email</span>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            autoComplete="email"
                                            maxLength={120}
                                            aria-invalid={Boolean(show("email"))}
                                        />
                                        {show("email") && <em className="letter-problem">{problems.email}</em>}
                                    </label>
                                    <label className="letter-field letter-field-wide">
                                        <span>Message</span>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="A little about the role, project or team, and how I can help."
                                            maxLength={3000}
                                            rows={6}
                                            aria-invalid={Boolean(show("message"))}
                                        />
                                        {show("message") && <em className="letter-problem">{problems.message}</em>}
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
                                ✓
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
    )
}

export default LetterChannel
