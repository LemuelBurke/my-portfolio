import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import "../../styles/settingsPanel.css"
import { clearArcadeScores, setSetting, useSettings } from "../../settings"

const Toggle = ({ id, value, onChange }) => (
    <div className="settings-toggle" role="radiogroup" aria-labelledby={id}>
        {[true, false].map((v) => (
            <button key={String(v)} type="button" role="radio" aria-checked={value === v} className={value === v ? "is-on" : ""} onClick={() => onChange(v)}>
                {v ? "On" : "Off"}
            </button>
        ))}
    </div>
)

const Slider = ({ id, value, onChange }) => (
    <div className="settings-slider">
        <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={Math.round(value * 100)}
            onChange={(e) => onChange(Number(e.target.value) / 100)}
            aria-labelledby={id}
            style={{ "--fill": `${value * 100}%` }}
        />
        <span className="settings-slider-value">{Math.round(value * 100)}</span>
    </div>
)

const Row = ({ id, label, hint, children }) => (
    <li className="settings-row">
        <div className="settings-row-text">
            <span id={id} className="settings-row-label">{label}</span>
            {hint && <span className="settings-row-hint">{hint}</span>}
        </div>
        <div className="settings-row-control">{children}</div>
    </li>
)

// The Wii button's Settings: sound, motion and menu preferences, saved in the visitor's browser.
const SettingsPanel = ({ onClose }) => {
    const settings = useSettings()
    const [clearStep, setClearStep] = useState("idle") // idle -> confirm -> done

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose()
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [onClose])

    const clearScores = () => {
        if (clearStep === "confirm") {
            clearArcadeScores()
            setClearStep("done")
        } else {
            setClearStep("confirm")
        }
    }

    return (
        <motion.div
            className="settings-backdrop"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            <motion.div
                className="settings-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="settings-title"
                onClick={(e) => e.stopPropagation()}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 30, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
                <header className="settings-head">
                    <h2 id="settings-title">Settings</h2>
                    {/* the version sits top right, as in Wii Settings */}
                    <span className="settings-version">v2.0</span>
                </header>

                <ul className="settings-list">
                    <Row id="set-music" label="Music">
                        <Slider id="set-music" value={settings.music} onChange={(v) => setSetting("music", v)} />
                    </Row>
                    <Row id="set-sfx" label="Sound effects" hint="Clicks, ticks and chimes">
                        <Slider id="set-sfx" value={settings.sfx} onChange={(v) => setSetting("sfx", v)} />
                    </Row>
                    <Row id="set-rumble" label="Rumble" hint="A little buzz when you tap, on phones that can">
                        <Toggle id="set-rumble" value={settings.rumble} onChange={(v) => setSetting("rumble", v)} />
                    </Row>
                    <Row id="set-motion" label="Reduce motion" hint="Calms the animations">
                        <Toggle id="set-motion" value={settings.reduceMotion} onChange={(v) => setSetting("reduceMotion", v)} />
                    </Row>
                    <Row id="set-dim" label="Dim when idle" hint="The menu dims after two quiet minutes">
                        <Toggle id="set-dim" value={settings.dimWhenIdle} onChange={(v) => setSetting("dimWhenIdle", v)} />
                    </Row>
                    <Row id="set-big" label="Bigger channels" hint="Fewer, larger channels on the menu">
                        <Toggle id="set-big" value={settings.bigChannels} onChange={(v) => setSetting("bigChannels", v)} />
                    </Row>
                    <Row id="set-scores" label="Arcade best scores">
                        <button
                            type="button"
                            className={`settings-btn ${clearStep === "confirm" ? "is-warning" : ""}`}
                            disabled={clearStep === "done"}
                            onClick={clearScores}
                        >
                            {clearStep === "confirm" ? "Tap to confirm" : clearStep === "done" ? "Cleared ✓" : "Clear"}
                        </button>
                    </Row>
                </ul>

                <footer className="settings-foot">
                    <button type="button" className="settings-close" onClick={onClose} autoFocus>
                        Close
                    </button>
                </footer>
            </motion.div>
        </motion.div>
    )
}

export default SettingsPanel
