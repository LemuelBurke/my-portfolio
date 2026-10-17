// Decorative script: strips of angular glyphs in the spirit of Imperial readouts (made up here,
// not a real alphabet). The same text always gives the same strip.

const GLYPHS = [
    "M1 1h8M5 1v10",
    "M1 1h8v10H1",
    "M1 11L5 1l4 10",
    "M1 1v10h8",
    "M1 6h8M1 1v10M9 1v10",
    "M1 1l8 10M1 11h8",
    "M5 1v10M1 4h8M1 8h8",
    "M1 1h8L1 11h8",
    "M1 1v10M1 6l8-5M1 6l8 5",
    "M1 11V1l8 5-8 5",
]

const Glyphs = ({ text = "imperial", className = "" }) => {
    const codes = [...text].map((c) => c.charCodeAt(0))
    return (
        <svg className={`glyphs ${className}`} viewBox={`0 0 ${codes.length * 13} 12`} aria-hidden="true" focusable="false">
            {codes.map((c, i) => (
                <path key={i} d={GLYPHS[c % GLYPHS.length]} transform={`translate(${i * 13} 0)`} />
            ))}
        </svg>
    )
}

export default Glyphs
