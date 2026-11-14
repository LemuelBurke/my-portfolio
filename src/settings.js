import { useSyncExternalStore } from "react"

// The visitor's site settings (the Wii button's Settings panel), saved in their browser.
// Music started through startMusic follows the music volume live, so the slider works mid-song.
const KEY = "site-settings"
const DEFAULTS = {
    music: 0.8, // 0-1, scales every channel's own music level
    sfx: 0.8, // clicks, ticks and the startup chime
    rumble: true, // a short buzz on phones when you tap a channel
    reduceMotion: false,
    dimWhenIdle: true,
    bigChannels: false,
}

const load = () => {
    try {
        return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }
    } catch {
        return { ...DEFAULTS }
    }
}

let state = load()
const listeners = new Set()
const playing = new Map() // music element -> its channel's own volume

const applyToPage = () => {
    const root = document.documentElement
    root.dataset.motion = state.reduceMotion ? "reduce" : "full"
    root.dataset.channels = state.bigChannels ? "big" : "normal"
}
applyToPage()

export const getSettings = () => state

export const setSetting = (key, value) => {
    state = { ...state, [key]: value }
    try {
        localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
        // private mode: the setting lasts for this visit
    }
    applyToPage()
    playing.forEach((base, audio) => (audio.volume = base * state.music))
    listeners.forEach((l) => l())
}

const subscribe = (l) => {
    listeners.add(l)
    return () => listeners.delete(l)
}

export const useSettings = () => useSyncExternalStore(subscribe, getSettings)

// A looping music track at `base` volume (before the visitor's music setting). Stop it with stopMusic.
export const startMusic = (src, base) => {
    const audio = new Audio(src)
    audio.loop = true
    audio.volume = base * state.music
    playing.set(audio, base)
    audio.play().catch(() => { })
    return audio
}

export const stopMusic = (audio) => {
    if (!audio) return
    audio.pause()
    playing.delete(audio)
}

// Change a playing track's own level (used to fade or duck it)
export const setMusicLevel = (audio, base) => {
    if (!audio) return
    playing.set(audio, base)
    audio.volume = Math.min(1, Math.max(0, base * state.music))
}

export const sfxVolume = (base = 1) => base * state.sfx

export const rumble = (ms = 12) => {
    if (state.rumble) navigator.vibrate?.(ms)
}

// Arcade best scores live under these keys (see ArcadeChannel)
export const clearArcadeScores = () => {
    try {
        Object.keys(localStorage)
            .filter((k) => k.startsWith("arcade-best-"))
            .forEach((k) => localStorage.removeItem(k))
    } catch {
        // nothing saved to clear
    }
}

