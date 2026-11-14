import { kindOf } from "./weatherCodes"

// Wii-style weather icons, drawn for each kind of weather

const Sun = ({ x = 32, y = 32, r = 14 }) => (
    <g className="wx-sun" style={{ transformOrigin: `${x}px ${y}px` }}>
        {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x={x - 2.5} y={y - r - 11} width="5" height="8" rx="2.5" fill="#ffd95a" transform={`rotate(${i * 45} ${x} ${y})`} />
        ))}
        <circle cx={x} cy={y} r={r} fill="#ffc93c" />
        <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.45} fill="#fff3b0" opacity="0.7" />
    </g>
)

const Moon = ({ x = 32, y = 30 }) => (
    <path d={`M${x + 6} ${y - 16} A16 16 0 1 0 ${x + 14} ${y + 10} A12 12 0 1 1 ${x + 6} ${y - 16} Z`} fill="#fff2b8" />
)

const Cloud = ({ x = 32, y = 38, s = 1, fill = "#fff" }) => (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="wx-cloud">
        <rect x="-22" y="-4" width="44" height="16" rx="8" fill={fill} />
        <circle cx="-8" cy="-4" r="10" fill={fill} />
        <circle cx="7" cy="-7" r="12" fill={fill} />
        <rect x="-22" y="-4" width="44" height="16" rx="8" fill="none" stroke="#000" strokeOpacity="0.06" />
    </g>
)

const Drops = ({ color = "#34beed", snow = false }) => (
    <g className="wx-fall">
        {[20, 32, 44].map((x, i) =>
            snow ? (
                <circle key={x} cx={x} cy={54 + (i % 2) * 4} r="3" fill="#fff" stroke="#b9d6e6" />
            ) : (
                <path key={x} d={`M${x} ${52 + (i % 2) * 3} q-3 6 0 8 q3 -2 0 -8`} fill={color} />
            )
        )}
    </g>
)

export const WeatherIcon = ({ code, night = false, className }) => {
    const kind = kindOf(code)[1]
    const sky = night ? <Moon /> : <Sun />
    return (
        <svg viewBox="0 0 64 64" className={`wx ${className ?? ""}`} aria-hidden="true">
            {kind === "clear" && (night ? <Moon x={28} y={32} /> : <Sun />)}
            {kind === "mostly-clear" && (
                <>
                    {night ? <Moon x={24} y={26} /> : <Sun x={26} y={26} r={12} />}
                    <Cloud x={40} y={44} s={0.7} />
                </>
            )}
            {kind === "part-cloud" && (
                <>
                    <g transform="translate(-6 -6)">{sky}</g>
                    <Cloud />
                </>
            )}
            {kind === "cloud" && (
                <>
                    <Cloud x={24} y={28} s={0.8} fill="#e3eaef" />
                    <Cloud />
                </>
            )}
            {kind === "fog" && (
                <>
                    <Cloud y={28} fill="#e3eaef" />
                    {[44, 51, 58].map((y) => (
                        <rect key={y} x="12" y={y} width="40" height="4" rx="2" fill="#cfd8de" />
                    ))}
                </>
            )}
            {(kind === "drizzle" || kind === "rain") && (
                <>
                    <Cloud y={30} fill={kind === "rain" ? "#dfe6eb" : "#fff"} />
                    <Drops />
                </>
            )}
            {kind === "snow" && (
                <>
                    <Cloud y={30} fill="#eef3f6" />
                    <Drops snow />
                </>
            )}
            {kind === "storm" && (
                <>
                    <Cloud y={28} fill="#b7c6d0" />
                    <path d="M34 40 L26 52 H32 L28 62 L40 48 H34 L38 40 Z" fill="#ffc93c" className="wx-bolt" />
                </>
            )}
        </svg>
    )
}
