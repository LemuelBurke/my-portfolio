import { sfxVolume } from "./settings"

// The soft "tick" the Wii makes as the pointer passes over a channel, synthesised so there's no
// file to load. The audio context is made on first use (browsers only allow sound after a tap/click).
let ctx = null
let lastTick = 0

const audio = () => {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === "suspended") ctx.resume()
    return ctx
}

export const tick = () => {
    const now = performance.now()
    // brushing across several cards quickly shouldn't turn into a buzz
    if (now - lastTick < 60) return
    lastTick = now
    const volume = sfxVolume(0.12)
    if (!volume) return
    try {
        audio()
        const t = ctx.currentTime
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(2200, t)
        osc.frequency.exponentialRampToValueAtTime(1400, t + 0.03)
        gain.gain.setValueAtTime(volume, t)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045)
        osc.connect(gain).connect(ctx.destination)
        osc.start(t)
        osc.stop(t + 0.05)
    } catch {
        // no Web Audio: just no tick
    }
}

// The soft rising "pop" as a channel opens up
export const pop = () => {
    const volume = sfxVolume(0.14)
    if (!volume) return
    try {
        const a = audio()
        const t = a.currentTime
        const osc = a.createOscillator()
        const gain = a.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(520, t)
        osc.frequency.exponentialRampToValueAtTime(1040, t + 0.09)
        gain.gain.setValueAtTime(0.0001, t)
        gain.gain.exponentialRampToValueAtTime(volume, t + 0.015)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16)
        osc.connect(gain).connect(a.destination)
        osc.start(t)
        osc.stop(t + 0.18)
    } catch {
        // no Web Audio: no pop
    }
}

// The airy "swish" as the menu turns a page
export const swish = () => {
    const volume = sfxVolume(0.18)
    if (!volume) return
    try {
        const a = audio()
        const t = a.currentTime
        const length = Math.floor(a.sampleRate * 0.28)
        const buffer = a.createBuffer(1, length, a.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
        const noise = a.createBufferSource()
        noise.buffer = buffer
        const filter = a.createBiquadFilter()
        filter.type = "bandpass"
        filter.Q.value = 1.2
        filter.frequency.setValueAtTime(700, t)
        filter.frequency.exponentialRampToValueAtTime(2600, t + 0.24)
        const gain = a.createGain()
        gain.gain.setValueAtTime(0.0001, t)
        gain.gain.exponentialRampToValueAtTime(volume, t + 0.06)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.27)
        noise.connect(filter).connect(gain).connect(a.destination)
        noise.start(t)
        noise.stop(t + 0.28)
    } catch {
        // no Web Audio: no swish
    }
}
