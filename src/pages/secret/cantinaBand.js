import { audio } from "./sound"

/*
 * The cantina band: an original, swinging little tune in D minor (written for this page, not the
 * films' song), played live with Web Audio: a reedy square-wave lead, a walking bass, a bell-like
 * counter line and a brushed hi-hat. start() returns a function that stops it.
 */

const D4 = 293.66
const note = (semis) => D4 * Math.pow(2, semis / 12)
const _ = null

// four bars of sixteenths, then the same four with a different ending
const LEAD = [
    [0, _, 3, _, 5, _, 6, 5, _, 3, _, 0, _, _, -2, _],
    [0, _, 3, _, 5, _, 7, _, 10, _, 7, 5, 6, _, 5, _],
    [12, _, 10, _, 7, _, 5, _, 6, 5, 3, _, 0, _, _, _],
    [3, _, 5, _, 3, _, 0, _, -2, _, 0, _, _, _, _, _],
    [0, _, 3, _, 5, _, 6, 5, _, 3, _, 0, _, _, -2, _],
    [0, _, 3, _, 5, _, 7, _, 10, _, 12, _, 10, _, 7, _],
    [5, _, 7, _, 10, _, 7, 5, 3, _, 5, _, 3, _, 0, _],
    [-2, _, 0, _, _, _, 3, _, 0, _, _, _, _, _, _, _],
]
// bass roots for each bar (semitones from D2), walked root, fifth, octave, fifth
const ROOTS = [0, 5, 7, 0, 0, 5, 7, 0]
const BELL = [7, _, _, _, 10, _, _, _, 12, _, _, _, 10, _, _, _]

export const startBand = (volume = 0.5) => {
    const ctx = audio()
    if (!ctx) return () => {}
    const out = ctx.createGain()
    out.gain.value = volume
    out.connect(ctx.destination)
    const tempo = 138
    const sixteenth = 60 / tempo / 4
    let step = 0
    let nextTime = ctx.currentTime + 0.1

    const tone = (freq, at, length, type, vol, attack = 0.005) => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = type
        o.frequency.setValueAtTime(freq, at)
        g.gain.setValueAtTime(0.0001, at)
        g.gain.exponentialRampToValueAtTime(vol, at + attack)
        g.gain.exponentialRampToValueAtTime(0.0001, at + length)
        o.connect(g).connect(out)
        o.start(at)
        o.stop(at + length + 0.02)
    }
    const hat = (at, vol) => {
        const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
        const src = ctx.createBufferSource()
        src.buffer = buffer
        const f = ctx.createBiquadFilter()
        f.type = "highpass"
        f.frequency.value = 6000
        const g = ctx.createGain()
        g.gain.value = vol
        src.connect(f).connect(g).connect(out)
        src.start(at)
    }

    const schedule = () => {
        while (nextTime < ctx.currentTime + 0.15) {
            const bar = Math.floor(step / 16) % LEAD.length
            const s = step % 16
            // swing: the off-beat sixteenths land a little late
            const at = nextTime + (s % 2 ? sixteenth * 0.28 : 0)
            const lead = LEAD[bar][s]
            if (lead !== null) tone(note(lead), at, sixteenth * 1.7, "square", 0.045)
            if (s % 4 === 0) {
                const walk = [0, 7, 12, 7][s / 4]
                tone(note(ROOTS[bar] + walk - 24), at, sixteenth * 3.4, "triangle", 0.16, 0.01)
            }
            const bell = BELL[s]
            if (bell !== null && bar % 2 === 1) tone(note(bell + 12), at, sixteenth * 5, "sine", 0.03)
            if (s % 2 === 0) hat(at, s % 4 === 2 ? 0.05 : 0.025)
            nextTime += sixteenth
            step++
        }
    }
    const timer = setInterval(schedule, 25)
    schedule()
    return () => {
        clearInterval(timer)
        try {
            out.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.1)
            setTimeout(() => out.disconnect(), 600)
        } catch {
            // already gone
        }
    }
}
