// Simple rounded icons for the Mii Maker tabs and tiles (24 x 24, drawn in currentColor)
const PATHS = {
    person: (
        <>
            <circle cx="12" cy="8" r="4.5" />
            <path d="M3.5 21 C3.5 15.5 7.5 13 12 13 C16.5 13 20.5 15.5 20.5 21 Z" />
        </>
    ),
    briefcase: (
        <>
            <rect x="2.5" y="7" width="19" height="13" rx="3" />
            <path d="M9 7 V5.5 Q9 4 10.5 4 H13.5 Q15 4 15 5.5 V7" fill="none" stroke="currentColor" strokeWidth="2" />
        </>
    ),
    plane: <path d="M21 15.5 L13.5 11 V5 Q13.5 3 12 3 Q10.5 3 10.5 5 V11 L3 15.5 V17.5 L10.5 15 V19 L8.5 20.5 V22 L12 21 L15.5 22 V20.5 L13.5 19 V15 L21 17.5 Z" />,
    star: <path d="M12 2.5 L14.9 8.6 L21.5 9.3 L16.5 13.7 L17.9 20.3 L12 16.9 L6.1 20.3 L7.5 13.7 L2.5 9.3 L9.1 8.6 Z" />,
    wrench: <path d="M21 6.5 A5 5 0 0 1 14.6 12.3 L6.5 20.4 A2 2 0 0 1 3.6 17.5 L11.7 9.4 A5 5 0 0 1 17.5 3 L14.5 6 L15.5 8.5 L18 9.5 Z" />,
    cap: (
        <>
            <path d="M12 4 L23 9 L12 14 L1 9 Z" />
            <path d="M6 11.5 V16 Q12 19.5 18 16 V11.5 L12 14.2 Z" opacity="0.75" />
        </>
    ),
    gamepad: (
        <>
            <path d="M7 7 H17 A5 5 0 0 1 22 12 V14 A4 4 0 0 1 15 16.5 L14 15.5 H10 L9 16.5 A4 4 0 0 1 2 14 V12 A5 5 0 0 1 7 7 Z" />
            <path d="M7 10 V14 M5 12 H9" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="16" cy="11" r="1.2" fill="#fff" />
            <circle cx="18" cy="13" r="1.2" fill="#fff" />
        </>
    ),
    van: (
        <>
            <path d="M2 7 H14 V16 H2 Z M14 10 H18.5 L22 13.5 V16 H14 Z" />
            <circle cx="6.5" cy="17.5" r="2.2" fill="currentColor" stroke="#fff" strokeWidth="1.2" />
            <circle cx="17.5" cy="17.5" r="2.2" fill="currentColor" stroke="#fff" strokeWidth="1.2" />
        </>
    ),
    bug: (
        <>
            <ellipse cx="12" cy="14" rx="5.5" ry="7" />
            <path d="M12 7 V21 M6.5 11 L3 9 M6.5 15 H2.5 M7 18.5 L4 20.5 M17.5 11 L21 9 M17.5 15 H21.5 M17 18.5 L20 20.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M12 7 V21" stroke="#fff" strokeWidth="1.4" />
        </>
    ),
    bag: (
        <>
            <path d="M4 8 H20 L19 21 H5 Z" />
            <path d="M8.5 8 V6.5 A3.5 3.5 0 0 1 15.5 6.5 V8" fill="none" stroke="currentColor" strokeWidth="2" />
        </>
    ),
    chip: (
        <>
            <rect x="6" y="6" width="12" height="12" rx="2.5" />
            <path d="M9 3 V6 M12 3 V6 M15 3 V6 M9 18 V21 M12 18 V21 M15 18 V21 M3 9 H6 M3 12 H6 M3 15 H6 M18 9 H21 M18 12 H21 M18 15 H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
    ),
    people: (
        <>
            <circle cx="8.5" cy="8" r="3.5" />
            <circle cx="16.5" cy="9" r="3" opacity="0.75" />
            <path d="M2 20 C2 15.5 5 13 8.5 13 C12 13 15 15.5 15 20 Z" />
            <path d="M14 20 C14 17 15.5 14.5 17 14.2 C20 14.2 22 16.5 22 20 Z" opacity="0.75" />
        </>
    ),
    heart: <path d="M12 21 C5 15.5 2 12.5 2 8.5 C2 5.5 4.3 3.5 7 3.5 C9 3.5 11 4.8 12 6.5 C13 4.8 15 3.5 17 3.5 C19.7 3.5 22 5.5 22 8.5 C22 12.5 19 15.5 12 21 Z" />,
    code: <path d="M8 6 L2 12 L8 18 M16 6 L22 12 L16 18 M14 4 L10 20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />,
    layers: (
        <>
            <path d="M12 3 L22 8 L12 13 L2 8 Z" />
            <path d="M2 12.5 L12 17.5 L22 12.5 M2 16.5 L12 21.5 L22 16.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </>
    ),
    database: (
        <>
            <ellipse cx="12" cy="5.5" rx="8" ry="3" />
            <path d="M4 5.5 V18.5 C4 20.2 7.6 21.5 12 21.5 C16.4 21.5 20 20.2 20 18.5 V5.5 C20 7.2 16.4 8.5 12 8.5 C7.6 8.5 4 7.2 4 5.5 Z" opacity="0.8" />
        </>
    ),
    cloud: <path d="M7 19 A5 5 0 0 1 6.5 9 A6.5 6.5 0 0 1 19 10 A4.5 4.5 0 0 1 18 19 Z" />,
    brush: (
        <>
            <path d="M20.5 3.5 C18 4.5 13 9.5 11 12.5 L12.5 14 C15.5 12 20.5 7 21.5 4.5 Z" />
            <path d="M10 13.5 L11.5 15 C11.5 18.5 8 21 3 20.5 C5 19 4.5 16.5 6.5 15 C7.5 14 9 13.5 10 13.5 Z" />
        </>
    ),
    book: (
        <>
            <path d="M3 5 C6 4 9 4.5 11.5 6 V20 C9 18.5 6 18 3 19 Z" />
            <path d="M21 5 C18 4 15 4.5 12.5 6 V20 C15 18.5 18 18 21 19 Z" opacity="0.75" />
        </>
    ),
    pencil: (
        <>
            <path d="M15.5 4.5 L19.5 8.5 L8.5 19.5 L3.5 20.5 L4.5 15.5 Z" />
            <path d="M13.5 6.5 L17.5 10.5" stroke="#fff" strokeWidth="1.6" />
        </>
    ),
    mountain: (
        <>
            <path d="M1.5 20 L9 7 L13 13.5 L15.5 10 L22.5 20 Z" />
            <path d="M9 7 L11 10.5 L9.6 11.2 L8.3 10 L7 11 Z" fill="#fff" />
        </>
    ),
    ball: (
        <>
            <ellipse cx="12" cy="12" rx="10" ry="6.5" transform="rotate(-35 12 12)" />
            <path d="M8.5 15.5 L15.5 8.5 M10 11.2 L12.8 14 M11.5 9.7 L14.3 12.5 M8.7 12.6 L11.4 15.3" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
        </>
    ),
}

const Glyph = ({ name, className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        {PATHS[name] ?? PATHS.star}
    </svg>
)

export default Glyph
