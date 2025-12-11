import { useRef, useEffect, useState, createContext } from 'react'
import { AnimatePresence } from 'framer-motion'
import WarningWelcome from './pages/WarningWelcome'
import HomePage from './pages/homePage'
import clickSound from './assets/audio/click-sound.mp3'
import startUpSound from './assets/audio/wii-startup-sound.mp3'
import wiimenu from './assets/audio/wiimenu.mp3'
import IntermissionOverlay from './pages/components/intermissionOverlay'
import PauseOverlay from './pages/components/pauseOverlay'

export const SoundContext = createContext({
    playSound: () => { },
    startWelcomeAudio: () => { },
})

function App() {
    const [showWelcome, setShowWelcome] = useState(true)
    const [shouldPlayMenu, setShouldPlayMenu] = useState(false)
    const [activeChannel, setActiveChannel] = useState(null) // NEW: Track active channel
    const [isIntermission, setIsIntermission] = useState(false)
    const [isPauseOpen, setIsPauseOpen] = useState(false)

    const audioSources = useRef({ click: clickSound, startup: startUpSound, menu: wiimenu })
    const audioCache = useRef({})
    const pendingChannelRef = useRef(null)
    const intermissionTimerRef = useRef(null)

    useEffect(() => {
        console.log('Initializing audio cache...')

        const startup = new Audio(audioSources.current.startup)
        startup.preload = 'auto'
        startup.volume = 0.3
        audioCache.current.startup = startup
        console.log('Startup audio created')

        const menu = new Audio(audioSources.current.menu)
        menu.preload = 'auto'
        menu.loop = true
        menu.volume = 0.3
        audioCache.current.menu = menu
        console.log('Menu audio created')

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
            const a = new Audio(src); a.volume = volume; a.preload = 'auto'
            a.play().catch(() => { })
            return
        }

        let el = audioCache.current[name]
        if (!el) {
            el = new Audio(src); el.volume = volume; el.preload = 'auto'
            audioCache.current[name] = el
        }
        try { el.currentTime = 0 } catch (_) { }
        el.play().catch(() => { })
    }

    const startWelcomeAudio = () => {
        console.log('Starting welcome audio sequence...')

        const startupAudio = audioCache.current.startup
        if (startupAudio) {
            const onStartupEnded = () => {
                console.log('Startup sound ended! Starting menu music...')
                startupAudio.removeEventListener('ended', onStartupEnded)
                setShouldPlayMenu(true)
            }

            startupAudio.addEventListener('ended', onStartupEnded)

            startupAudio.play()
                .then(() => {
                    console.log('Startup sound playing successfully')
                })
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
        console.log('Menu should play:', shouldPlayMenu)
        const menuEl = audioCache.current.menu
        if (!menuEl) return

        if (shouldPlayMenu) {
            console.log('Starting menu music...')
            menuEl.play().catch((error) => console.error('Menu play failed:', error))
        } else {
            try {
                menuEl.pause()
                menuEl.currentTime = 0
            } catch (_) { }
        }
    }, [shouldPlayMenu])

    const dismissWelcome = () => {
        console.log('Welcome dismissed after animation')
        setShowWelcome(false)
    }

    // Channel management functions
    const openChannel = (channelId) => {
        console.log('Opening channel:', channelId)
        // Show intermission for specific "game" screens
        if (channelId === 'About Me' || channelId === 'Resume and CV' || channelId === 'My Projects') {
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
        console.log('Closing channel')
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

    return (
        <SoundContext.Provider value={{ playSound, startWelcomeAudio }}>
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
        </SoundContext.Provider>
    )
}

export default App