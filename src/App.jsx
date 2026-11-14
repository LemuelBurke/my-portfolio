import { useRef, useEffect, useState, createContext } from 'react'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import WarningWelcome from './pages/warningWelcome'
import HomePage from './pages/homePage'
import clickSound from './assets/audio/click-sound.mp3'
import startUpSound from './assets/audio/wii-startup-sound.mp3'
import wiimenu from './assets/audio/wiimenu.mp3'
import IntermissionOverlay from './pages/components/intermissionOverlay'
import PauseOverlay from './pages/components/pauseOverlay'
import { ARCADE_TITLES } from './pages/arcade/arcadeTitles'
import { ARCHIVE_TITLE } from './pages/secret/galaxyContent'
import { setMusicLevel, sfxVolume, useSettings } from './settings'

// Channels that open with the Wii intermission screen
const INTERMISSION_CHANNELS = ['About Me', 'Resume and CV', 'My Projects', 'Message Me', 'Forecast', ARCHIVE_TITLE, ...ARCADE_TITLES]
// The menu dims after this long without any input, like the Wii's screen burn-in reduction
const IDLE_DIM_MS = 2 * 60 * 1000

export const SoundContext = createContext({
    playSound: () => { },
    startWelcomeAudio: () => { },
    duckMenu: () => { },
})

function App() {
    const [showWelcome, setShowWelcome] = useState(true)
    const [shouldPlayMenu, setShouldPlayMenu] = useState(false)
    const [activeChannel, setActiveChannel] = useState(null) // NEW: Track active channel
    const [isIntermission, setIsIntermission] = useState(false)
    const [isPauseOpen, setIsPauseOpen] = useState(false)
    const [dimmed, setDimmed] = useState(false)
    const settings = useSettings()

    const audioSources = useRef({ click: clickSound, startup: startUpSound, menu: wiimenu })
    const audioCache = useRef({})
    const pendingChannelRef = useRef(null)
    const intermissionTimerRef = useRef(null)

    useEffect(() => {

        const startup = new Audio(audioSources.current.startup)
        startup.preload = 'auto'
        startup.volume = sfxVolume(0.3)
        audioCache.current.startup = startup

        const menu = new Audio(audioSources.current.menu)
        menu.preload = 'auto'
        menu.loop = true
        setMusicLevel(menu, 0.3)
        audioCache.current.menu = menu

        return () => {
            if (intermissionTimerRef.current) {
                clearTimeout(intermissionTimerRef.current)
            }
        }
    }, [])

    const playSound = (name, { allowOverlap = true, volume = 0.9 } = {}) => {
        const src = audioSources.current[name]
        if (!src) return

        if (allowOverlap) {
            const a = new Audio(src); a.volume = sfxVolume(volume); a.preload = 'auto'
            a.play().catch(() => { })
            return
        }

        let el = audioCache.current[name]
        if (!el) {
            el = new Audio(src); el.preload = 'auto'
            audioCache.current[name] = el
        }
        el.volume = sfxVolume(volume)
        try { el.currentTime = 0 } catch (_) { }
        el.play().catch(() => { })
    }

    // The menu music fades right down while a channel preview plays its own music
    const duckMenu = (on) => setMusicLevel(audioCache.current.menu, on ? 0.03 : 0.3)

    const startWelcomeAudio = () => {
        const startupAudio = audioCache.current.startup
        if (startupAudio) {
            const onStartupEnded = () => {
                startupAudio.removeEventListener('ended', onStartupEnded)
                setShouldPlayMenu(true)
            }

            startupAudio.addEventListener('ended', onStartupEnded)

            startupAudio.play()
                .catch((error) => {
                    console.error('Failed to play startup sound:', error)
                    startupAudio.removeEventListener('ended', onStartupEnded)
                    setTimeout(() => setShouldPlayMenu(true), 2000)
                })
        } else {
            console.error('No startup audio found, starting menu directly')
            setShouldPlayMenu(true)
        }
    }

    useEffect(() => {
        const onDocClick = () => playSound('click', { allowOverlap: true })
        document.addEventListener('click', onDocClick)
        return () => document.removeEventListener('click', onDocClick)
    }, [])

    // Right-click opens the pause overlay app-wide (sets open state — not toggle)
    useEffect(() => {
        const onContext = (e) => {
            // if welcome or intermission showing, allow native context menu
            if (showWelcome || isIntermission) return
            // prevent native context menu and open the pause overlay
            e.preventDefault()
            setIsPauseOpen(true)
        }
        document.addEventListener('contextmenu', onContext)
        return () => document.removeEventListener('contextmenu', onContext)
    }, [showWelcome, isIntermission])

    // Close pause with Escape
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') setIsPauseOpen(false)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    // Menu audio control
    useEffect(() => {
        const menuEl = audioCache.current.menu
        if (!menuEl) return

        if (shouldPlayMenu) {
            menuEl.play().catch((error) => console.error('Menu play failed:', error))
        } else {
            try {
                menuEl.pause()
                menuEl.currentTime = 0
            } catch (_) { }
        }
    }, [shouldPlayMenu])

    const dismissWelcome = () => {
        setShowWelcome(false)
    }

    // Channel management functions
    const openChannel = (channelId) => {
        // Show intermission for specific "game" screens
        if (INTERMISSION_CHANNELS.includes(channelId)) {
            setIsIntermission(true)
            pendingChannelRef.current = channelId
            intermissionTimerRef.current = setTimeout(() => {
                setActiveChannel(pendingChannelRef.current)
                setIsIntermission(false)
                pendingChannelRef.current = null
            }, 3500)
        } else {
            setActiveChannel(channelId)
        }
        // close pause if opening a channel
        setIsPauseOpen(false)
    }

    const closeChannel = () => {
        if (intermissionTimerRef.current) {
            clearTimeout(intermissionTimerRef.current)
            intermissionTimerRef.current = null
        }
        setIsIntermission(false)
        pendingChannelRef.current = null
        setActiveChannel(null)
    }

    // Pause menu music when a channel is open OR intermission is showing, resume when back to HomePage
    useEffect(() => {
        if (activeChannel || isIntermission) {
            setShouldPlayMenu(false)
        } else {
            setShouldPlayMenu((prev) => prev || !showWelcome)
        }
    }, [activeChannel, showWelcome, isIntermission])

    // Dim the menu after a while with no input; any movement, tap or key wakes it straight away
    const onMenu = !showWelcome && !activeChannel && !isIntermission
    useEffect(() => {
        if (!onMenu || !settings.dimWhenIdle) return
        let timer
        const wake = () => {
            setDimmed(false)
            clearTimeout(timer)
            timer = setTimeout(() => setDimmed(true), IDLE_DIM_MS)
        }
        const events = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart']
        events.forEach((e) => window.addEventListener(e, wake, { passive: true }))
        wake()
        return () => {
            clearTimeout(timer)
            setDimmed(false)
            events.forEach((e) => window.removeEventListener(e, wake))
        }
    }, [onMenu, settings.dimWhenIdle])

    return (
        <MotionConfig reducedMotion={settings.reduceMotion ? 'always' : 'user'}>
        <SoundContext.Provider value={{ playSound, startWelcomeAudio, duckMenu }}>
            {/* Welcome Screen - Shows first, then disappears */}
            <AnimatePresence mode="wait" initial={false}>
                {showWelcome && (
                    <WarningWelcome
                        key="welcome"
                        onDismiss={dismissWelcome}
                    />
                )}
            </AnimatePresence>

            {/* Intermission overlay during channel transitions */}
            <AnimatePresence>{isIntermission && <IntermissionOverlay />}</AnimatePresence>

            {/* Global Pause Overlay (opened via right-click) */}
            <AnimatePresence>
                {isPauseOpen && (
                    <PauseOverlay
                        onClose={() => setIsPauseOpen(false)}
                        onWiiMenu={() => {
                            // navigate internally to the main menu without full reload
                            setIsPauseOpen(false)
                            setIsIntermission(false)
                            setActiveChannel(null)
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Main Menu - Only visible after welcome is dismissed */}
            {!showWelcome && (
                <HomePage
                    onChannelOpen={openChannel}
                    activeChannel={activeChannel}
                    onChannelClose={closeChannel}
                />
            )}
            <div className={`idle-dim ${dimmed ? 'is-dimmed' : ''}`} aria-hidden="true" />
        </SoundContext.Provider>
        </MotionConfig>
    )
}

export default App