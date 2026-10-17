// Synthesised sounds for the galaxy channel (none of them are recordings). One audio context is
// shared across the channel and closed when it unmounts.

let shared = null
export const audio = () => {
    try {
        shared ??= new (window.AudioContext || window.webkitAudioContext)()
        if (shared.state === "suspended") shared.resume()
        return shared
    } catch {
        return null
    }
}
export const closeAudio = () => {
    const ctx = shared
    shared = null
    ctx?.close?.().catch(() => {})
}

export const blip = (freq, type = "square", volume = 0.03, length = 0.07) => {
    const ctx = audio()
    if (!ctx) return
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(volume, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + length + 0.01)
}

const noiseBuffer = (ctx, seconds) => {
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    return buffer
}

// A burst of filtered noise: sweeps from one frequency to another as it fades
export const noise = (seconds, type, from, to, volume) => {
    const ctx = audio()
    if (!ctx) return
    const t = ctx.currentTime
    const src = ctx.createBufferSource()
    src.buffer = noiseBuffer(ctx, seconds)
    const filter = ctx.createBiquadFilter()
    filter.type = type
    filter.frequency.setValueAtTime(from, t)
    filter.frequency.exponentialRampToValueAtTime(to, t + seconds)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(volume, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds)
    src.connect(filter).connect(gain).connect(ctx.destination)
    src.start(t)
}

// A low drone through a soft filter, for the ambience of a place; returns a function to stop it
export const drone = (freqs, volume = 0.02, cutoff = 220, type = "sawtooth") => {
    const ctx = audio()
    if (!ctx) return () => {}
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 2)
    const filter = ctx.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.value = cutoff
    const oscs = freqs.map((f) => {
        const o = ctx.createOscillator()
        o.type = type
        o.frequency.value = f
        o.connect(filter)
        o.start()
        return o
    })
    filter.connect(gain).connect(ctx.destination)
    return () => {
        try {
            gain.gain.cancelScheduledValues(ctx.currentTime)
            gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5)
            oscs.forEach((o) => o.stop(ctx.currentTime + 0.55))
        } catch {
            // already stopped
        }
    }
}

// A crystal's song: a pure tone with a slow shimmer, rising and dying away
export const chime = (hz, volume = 0.05) => {
    const ctx = audio()
    if (!ctx) return
    const t = ctx.currentTime
    for (const [mult, vol] of [[1, 1], [2.01, 0.35], [3.02, 0.12]]) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(hz * mult, t)
        gain.gain.setValueAtTime(0.0001, t)
        gain.gain.exponentialRampToValueAtTime(volume * vol, t + 0.08)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.2)
        osc.connect(gain).connect(ctx.destination)
        osc.start(t)
        osc.stop(t + 2.3)
    }
}

/*
 * A lightsaber: the hum (two detuned low tones and a buzz, filtered) that swells and bends in
 * pitch as the blade swings, the "snap-hiss" when it ignites, and the retract.
 */
export const createSaberSound = () => {
    const ctx = audio()
    if (!ctx) return { ignite() {}, retract() {}, swing() {}, stop() {} }
    const out = ctx.createGain()
    out.gain.value = 0.0001
    out.connect(ctx.destination)
    const filter = ctx.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.value = 380
    filter.Q.value = 3
    filter.connect(out)
    const oscs = [
        ["sawtooth", 88],
        ["sawtooth", 89.3],
        ["square", 176.4],
    ].map(([type, f]) => {
        const o = ctx.createOscillator()
        o.type = type
        o.frequency.value = f
        o.connect(filter)
        o.start()
        return o
    })
    let lit = false
    return {
        ignite() {
            const t = ctx.currentTime
            lit = true
            noise(0.32, "bandpass", 400, 4200, 0.25)
            for (const o of oscs) {
                const f = o.frequency.value
                o.frequency.setValueAtTime(f * 0.4, t)
                o.frequency.exponentialRampToValueAtTime(f, t + 0.3)
            }
            out.gain.cancelScheduledValues(t)
            out.gain.setValueAtTime(0.0001, t)
            out.gain.exponentialRampToValueAtTime(0.12, t + 0.12)
            out.gain.exponentialRampToValueAtTime(0.05, t + 0.5)
        },
        retract() {
            const t = ctx.currentTime
            lit = false
            noise(0.35, "bandpass", 3000, 300, 0.15)
            out.gain.cancelScheduledValues(t)
            out.gain.setValueAtTime(out.gain.value, t)
            out.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
        },
        // speed: how fast the blade is moving, 0 (still) to about 1 (a hard swing)
        swing(speed) {
            if (!lit) return
            const t = ctx.currentTime
            const k = Math.min(1, speed)
            out.gain.setTargetAtTime(0.05 + k * 0.13, t, 0.04)
            filter.frequency.setTargetAtTime(380 + k * 1400, t, 0.04)
            oscs.forEach((o, i) => o.detune.setTargetAtTime(k * (i === 2 ? 260 : 180), t, 0.05))
        },
        stop() {
            try {
                const t = ctx.currentTime
                out.gain.cancelScheduledValues(t)
                out.gain.setValueAtTime(Math.max(0.0001, out.gain.value), t)
                out.gain.exponentialRampToValueAtTime(0.0001, t + 0.2)
                oscs.forEach((o) => o.stop(t + 0.25))
            } catch {
                // already stopped
            }
        },
    }
}

// Blade meets bolt: a sharp crackle
export const clash = () => {
    noise(0.18, "highpass", 2400, 900, 0.35)
    blip(1900, "sawtooth", 0.04, 0.06)
}

// The remote's sting
export const zap = () => {
    blip(620, "square", 0.05, 0.12)
    noise(0.2, "bandpass", 1500, 500, 0.15)
}
