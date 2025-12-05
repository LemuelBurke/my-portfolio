import { useRef, useEffect, useState, createContext } from 'react'
import { AnimatePresence } from 'framer-motion'
import WarningWelcome from './pages/WarningWelcome'
import HomePage from './pages/HomePage'

import clickSound from './assets/audio/click-sound.mp3'
import startUpSound from './assets/audio/wii-startup-sound.mp3'
import wiimenu from './assets/audio/wiimenu.mp3'


export const SoundContext = createContext({
    playSound: () => { },
})

function App() {
    const [screen, setScreen] = useState("welcome") 
    const audioSources = useRef({
        click: clickSound,
        startup: startUpSound,
        menu: wiimenu,
    })

    const audioCache = useRef({})

    useEffect(() => {
        const startup = new Audio(audioSources.current.startup)
        startup.preload = 'auto'
        startup.volume = 0.3
        audioCache.current.startup = startup

        const menu = new Audio(audioSources.current.menu)
        menu.preload = 'auto'
        menu.loop = true
        menu.volume = 0.3
        audioCache.current.menu = menu

    }, [])

    const playSound = (name, { allowOverlap = true, volume = 0.9 } = {}) => {
        const src = audioSources.current[name]
        if (!src) return

        if (allowOverlap) {
            const a = new Audio(src)
            a.volume = volume
            a.preload = 'auto'
            a.play().catch(() => { })
            return
        }

        let el = audioCache.current[name]
        if (!el) {
            el = new Audio(src)
            el.volume = volume
            el.preload = 'auto'
            audioCache.current[name] = el
        }

        try { el.currentTime = 0 } catch (_) { }
        el.play().catch(() => { })
    }

    // global click
    useEffect(() => {
        const onDocClick = () => {
            playSound('click', { allowOverlap: true })
        }
        document.addEventListener('click', onDocClick)
        return () => document.removeEventListener('click', onDocClick)
    }, [])

    useEffect(() => {
        const menuEl = audioCache.current.menu
        if (!menuEl) return

        if (screen === "home") {
            menuEl.play().catch(() => {})
        } else {
            try {
                menuEl.pause()
                menuEl.currentTime = 0
            } catch (_) { }
        }
    }, [screen])


    const goToHome = () => {
        playSound('startup', { allowOverlap: false })
        setScreen("home")
    }

    return (
        <SoundContext.Provider value={{ playSound }}>
            <AnimatePresence mode="wait">
                {screen === "welcome" && (
                    <WarningWelcome key="welcome" onDismiss={goToHome} />
                )}
                {screen === "home" && (
                    <HomePage key="home" />
                )}
            </AnimatePresence>
        </SoundContext.Provider>
    )
}

export default App
