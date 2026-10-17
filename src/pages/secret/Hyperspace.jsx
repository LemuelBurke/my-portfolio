import { useEffect, useRef } from "react"
import "../../styles/hyperspace.css"

// Timings in seconds
const DARKEN = 0.3 // the screen goes to space
const STREAK = 1.15 // stars stretch into lines and rush past
const FLASH = 0.25 // white-out as we jump
const REVEAL = 0.45 // the flash fades to show where we've arrived

// A short rising "whoosh" from filtered noise, so no sound file is needed
const whoosh = () => {
    try {
        const audio = new (window.AudioContext || window.webkitAudioContext)()
        const length = audio.sampleRate * (STREAK + FLASH)
        const buffer = audio.createBuffer(1, length, audio.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
        const noise = audio.createBufferSource()
        noise.buffer = buffer
        const filter = audio.createBiquadFilter()
        filter.type = "bandpass"
        filter.Q.value = 1.2
        const gain = audio.createGain()
        const t = audio.currentTime + DARKEN
        filter.frequency.setValueAtTime(200, t)
        filter.frequency.exponentialRampToValueAtTime(3200, t + STREAK)
        gain.gain.setValueAtTime(0.0001, audio.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.18, t + STREAK * 0.9)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + STREAK + FLASH)
        noise.connect(filter).connect(gain).connect(audio.destination)
        noise.start(t)
        noise.stop(t + STREAK + FLASH)
        setTimeout(() => audio.close(), (DARKEN + STREAK + FLASH + 0.5) * 1000)
    } catch {
        // no Web Audio: jump silently
    }
}

/*
 * A full-screen jump to hyperspace: the stars stretch into streaks, the screen flashes white,
 * then fades back. `onJump` fires at the height of the flash (swap what's underneath then);
 * `onDone` when the overlay has gone.
 */
const Hyperspace = ({ onJump, onDone }) => {
    const canvasRef = useRef(null)
    const callbacks = useRef({ onJump, onDone })
    useEffect(() => {
        callbacks.current = { onJump, onDone }
    }, [onJump, onDone])

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const w = window.innerWidth
        const h = window.innerHeight
        canvas.width = w * dpr
        canvas.height = h * dpr
        ctx.scale(dpr, dpr)
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const cx = w / 2
        const cy = h / 2
        const reach = Math.hypot(cx, cy)
        const stars = Array.from({ length: 360 }, () => ({
            angle: Math.random() * Math.PI * 2,
            start: 0.02 + Math.random() * 0.5,
            speed: 0.5 + Math.random(),
            width: 0.6 + Math.random() * 1.6,
        }))
        // how far out a star has rushed, as a share of the screen, at streak progress p (0..1)
        const radius = (star, p) => star.start * (1 + 26 * Math.pow(Math.max(0, p), 3) * star.speed)

        const total = reduceMotion ? 0.8 : DARKEN + STREAK + FLASH + REVEAL
        const jumpAt = reduceMotion ? 0.4 : DARKEN + STREAK + FLASH * 0.5
        let jumped = false
        if (!reduceMotion) whoosh()
        const begin = performance.now()
        let frame

        const tick = (now) => {
            const t = (now - begin) / 1000
            ctx.clearRect(0, 0, w, h)

            if (reduceMotion) {
                // a simple fade to white and back
                const k = 1 - Math.abs(t / total - 0.5) * 2
                ctx.fillStyle = `rgba(230, 244, 255, ${Math.max(0, k)})`
                ctx.fillRect(0, 0, w, h)
            } else {
                const spaceAlpha = t < DARKEN ? t / DARKEN : t > jumpAt ? Math.max(0, 1 - (t - jumpAt) / (FLASH * 0.5 + REVEAL)) : 1
                ctx.fillStyle = `rgba(2, 4, 12, ${spaceAlpha})`
                ctx.fillRect(0, 0, w, h)

                if (t < DARKEN + STREAK + FLASH) {
                    const p = (t - DARKEN) / STREAK
                    const tail = p - 0.07 - p * 0.05
                    ctx.lineCap = "round"
                    for (const star of stars) {
                        const r1 = radius(star, p) * reach
                        const r0 = radius(star, tail) * reach
                        const cos = Math.cos(star.angle)
                        const sin = Math.sin(star.angle)
                        ctx.strokeStyle = `rgba(${200 + 55 * Math.min(1, p)}, ${225 + 30 * Math.min(1, p)}, 255, ${Math.min(1, 0.35 + p) * spaceAlpha})`
                        ctx.lineWidth = star.width * (1 + Math.max(0, p) * 1.5)
                        ctx.beginPath()
                        ctx.moveTo(cx + cos * r0, cy + sin * r0)
                        ctx.lineTo(cx + cos * Math.max(r1, r0 + 1), cy + sin * Math.max(r1, r0 + 1))
                        ctx.stroke()
                    }
                }

                // the flash: up through the jump, then fading as we arrive
                const flashStart = DARKEN + STREAK - 0.15
                if (t > flashStart) {
                    const up = Math.min(1, (t - flashStart) / (FLASH * 0.5 + 0.15))
                    const down = t > jumpAt ? Math.max(0, 1 - (t - jumpAt) / (FLASH * 0.5 + REVEAL)) : 1
                    ctx.fillStyle = `rgba(232, 246, 255, ${up * down})`
                    ctx.fillRect(0, 0, w, h)
                }
            }

            if (!jumped && t >= jumpAt) {
                jumped = true
                callbacks.current.onJump?.()
            }
            if (t >= total) {
                callbacks.current.onDone?.()
                return
            }
            frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [])

    return <canvas ref={canvasRef} className="hyperspace" aria-hidden="true" />
}

export default Hyperspace
