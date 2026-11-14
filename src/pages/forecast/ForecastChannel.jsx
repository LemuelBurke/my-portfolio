import { motion } from "framer-motion"
import { useCallback, useEffect, useState } from "react"
import "../../styles/forecast.css"
import forecastMusic from "../../assets/audio/wiiShopMusic.mp3"
import { startMusic, stopMusic } from "../../settings"
import { WeatherIcon } from "./weather.jsx"
import { describe } from "./weatherCodes"

// The two places on the board: where Morgan lives now, and home in Wales
const CITIES = [
    { id: "brisbane", name: "Brisbane", note: "Where I live now", lat: -27.47, lon: 153.03, tz: "Australia/Brisbane" },
    { id: "cardiff", name: "Cardiff", note: "Where I'm from", lat: 51.48, lon: -3.18, tz: "Europe/London" },
]

// Live weather from Open-Meteo (free, no key needed)
const fetchCity = async ({ lat, lon }) => {
    const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        "&current=temperature_2m,weather_code,is_day,wind_speed_10m" +
        "&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5"
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
}

const UNIT_KEY = "forecast-unit"
const readUnit = () => {
    try {
        return localStorage.getItem(UNIT_KEY) === "F" ? "F" : "C"
    } catch {
        return "C"
    }
}

const toUnit = (c, unit) => Math.round(unit === "F" ? (c * 9) / 5 + 32 : c)

// The local time in each city, ticking over each minute
const useNow = () => {
    const [now, setNow] = useState(() => new Date())
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 15000)
        return () => clearInterval(timer)
    }, [])
    return now
}

const dayName = (iso, i) =>
    i === 0 ? "Today" : new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`))

const CityCard = ({ city, data, unit, now }) => {
    const current = data.current
    const daily = data.daily
    const time = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: city.tz }).format(now)
    const day = current.is_day === 1

    return (
        <section className={`forecast-card ${day ? "is-day" : "is-night"}`} aria-labelledby={`fc-${city.id}`}>
            <header className="forecast-card-head">
                <div>
                    <h2 id={`fc-${city.id}`}>{city.name}</h2>
                    <p>{city.note}</p>
                </div>
                <span className="forecast-time">{time}</span>
            </header>

            <div className="forecast-now">
                <WeatherIcon code={current.weather_code} night={!day} className="forecast-now-icon" />
                <div>
                    <p className="forecast-temp">
                        {toUnit(current.temperature_2m, unit)}
                        <span>°{unit}</span>
                    </p>
                    <p className="forecast-desc">{describe(current.weather_code)}</p>
                    <p className="forecast-meta">
                        High {toUnit(daily.temperature_2m_max[0], unit)}° · Low {toUnit(daily.temperature_2m_min[0], unit)}° · Wind{" "}
                        {Math.round(current.wind_speed_10m)} km/h
                    </p>
                </div>
            </div>

            <ol className="forecast-days" aria-label={`Next five days in ${city.name}`}>
                {daily.time.map((iso, i) => (
                    <li key={iso}>
                        <span className="forecast-day-name">{dayName(iso, i)}</span>
                        <WeatherIcon code={daily.weather_code[i]} className="forecast-day-icon" />
                        <span className="forecast-day-temps">
                            <strong>{toUnit(daily.temperature_2m_max[i], unit)}°</strong>
                            <span>{toUnit(daily.temperature_2m_min[i], unit)}°</span>
                        </span>
                        <span className="visually-hidden">{describe(daily.weather_code[i])}</span>
                    </li>
                ))}
            </ol>
        </section>
    )
}

// Forecast channel: today's weather and the week ahead in Brisbane and Cardiff, side by side
const ForecastChannel = ({ onExit }) => {
    const [state, setState] = useState({ status: "loading" })
    const [unit, setUnit] = useState(readUnit)
    const now = useNow()

    const fetchAll = useCallback(() => {
        Promise.all(CITIES.map(fetchCity))
            .then((results) => setState({ status: "ready", results }))
            .catch(() => setState({ status: "error" }))
    }, [])

    useEffect(() => {
        fetchAll()
    }, [fetchAll])

    const retry = () => {
        setState({ status: "loading" })
        fetchAll()
    }

    useEffect(() => {
        const music = startMusic(forecastMusic, 0.25)
        return () => stopMusic(music)
    }, [])

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onExit()
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [onExit])

    const pickUnit = (u) => {
        setUnit(u)
        try {
            localStorage.setItem(UNIT_KEY, u)
        } catch {
            // the choice lasts for this visit
        }
    }

    return (
        <motion.div className="forecast-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="forecast-bar">
                <button type="button" className="forecast-exit" onClick={onExit}>
                    Exit
                </button>
                <h1 className="forecast-title">Forecast</h1>
                <div className="forecast-units" role="radiogroup" aria-label="Temperature unit">
                    {["C", "F"].map((u) => (
                        <button key={u} type="button" role="radio" aria-checked={unit === u} className={unit === u ? "is-on" : ""} onClick={() => pickUnit(u)}>
                            °{u}
                        </button>
                    ))}
                </div>
            </div>

            <main className="forecast-body">
                {state.status === "loading" && (
                    <div className="forecast-status" role="status">
                        <span className="forecast-spinner" aria-hidden="true" />
                        Checking the skies…
                    </div>
                )}
                {state.status === "error" && (
                    <div className="forecast-status" role="alert">
                        <p>Couldn't reach the weather service just now.</p>
                        <button type="button" className="forecast-retry" onClick={retry}>
                            Try again
                        </button>
                    </div>
                )}
                {state.status === "ready" && (
                    <div className="forecast-cards">
                        {CITIES.map((city, i) => (
                            <motion.div
                                key={city.id}
                                initial={{ y: 24, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: i * 0.12, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <CityCard city={city} data={state.results[i]} unit={unit} now={now} />
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            <p className="forecast-credit">
                Live weather from{" "}
                <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
                    Open-Meteo
                </a>
            </p>
        </motion.div>
    )
}

export default ForecastChannel
