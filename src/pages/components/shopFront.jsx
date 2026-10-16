import { memo } from "react"

// A building on Project Street, a British high street terrace drawn in soft, glossy Wii style.
// Buildings stand shoulder to shoulder; each upper storey is in the architecture of its era,
// running from a modern new-build back to a Tudor timber frame. Every building shares the same
// shopfront underneath: fascia (x 38-402, y 236-276), display window (x 50-250, y 292-392) and
// door (centre x = 345), which projects.jsx and street.css rely on.
// The SVG is 440 x 420 units with the pavement at the bottom edge; roofs draw above y = 0.
export const SHOP_WIDTH = 440
export const SHOP_HEIGHT = 420
export const SHOP_DOOR_X = 345

const DOORWAY = "M302 420 V302 Q302 290 314 290 H376 Q388 290 388 302 V420 Z"

// Eight dots spinning in a ring, like the Wii's loading indicator
const LoadingRing = ({ cx, cy }) => (
    <g className="shop-loading" style={{ transformOrigin: `${cx}px ${cy}px` }}>
        {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2
            return (
                <circle
                    key={i}
                    cx={cx + Math.cos(a) * 20}
                    cy={cy + Math.sin(a) * 20}
                    r={5}
                    fill="#34beed"
                    opacity={0.25 + (i / 8) * 0.75}
                />
            )
        })}
    </g>
)

// A sash or casement window: rounded frame, glossy glass, optional glazing bars and sill
const Window = ({ id, x, y, w, h, frame = "#fff", bars = [], arch = false, sill = "#f4efe4" }) => {
    const top = arch ? `M${x} ${y + 14} Q${x + w / 2} ${y - 8} ${x + w} ${y + 14}` : null
    return (
        <g>
            {arch ? (
                <path d={`${top} V${y + h} H${x} Z`} fill={frame} />
            ) : (
                <rect x={x} y={y} width={w} height={h} rx="8" fill={frame} />
            )}
            {arch ? (
                <path d={`M${x + 6} ${y + 18} Q${x + w / 2} ${y} ${x + w - 6} ${y + 18} V${y + h - 6} H${x + 6} Z`} fill={`url(#${id}-sky)`} />
            ) : (
                <rect x={x + 6} y={y + 6} width={w - 12} height={h - 12} rx="5" fill={`url(#${id}-sky)`} />
            )}
            {bars.map((d, i) => (
                <path key={i} d={d} stroke={frame} strokeWidth="4" />
            ))}
            <path d={`M${x + 12} ${y + h - 14} L${x + w / 2} ${y + 14}`} stroke="#fff" strokeOpacity="0.55" strokeWidth="5" strokeLinecap="round" />
            <rect x={x - 6} y={y + h - 2} width={w + 12} height="9" rx="4" fill={sill} />
        </g>
    )
}

// Glazing bars dividing a window into cols x rows panes
const paneBars = (x, y, w, h, cols, rows) => [
    ...Array.from({ length: cols - 1 }, (_, i) => `M${x + (w * (i + 1)) / cols} ${y} V${y + h}`),
    ...Array.from({ length: rows - 1 }, (_, i) => `M${x} ${y + (h * (i + 1)) / rows} H${x + w}`),
]

/* ---------- window displays: a little scene about each project ---------- */

// Traffic cone like the ones that mark out a Formula Student track
const Cone = ({ x, y, s = 1, color }) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
        <path d="M-7 0 L-2 -20 Q0 -23 2 -20 L7 0 Z" fill={color} />
        <path d="M-4.5 -9 H4.5" stroke="#fff" strokeWidth="3" />
        <rect x="-10" y="-1" width="20" height="4" rx="2" fill={color} />
    </g>
)

// Cainan: a laptop on a desk with the studio's logo on screen, a coffee and a plant
const LaptopScene = ({ thumb }) => (
    <>
        <rect x="50" y="368" width="200" height="24" fill="#c99a66" />
        <rect x="50" y="366" width="200" height="5" fill="#dcae7c" />
        <rect x="104" y="306" width="92" height="58" rx="5" fill="#2A3550" />
        <rect x="109" y="311" width="82" height="48" rx="2" fill="#fff" />
        <image href={thumb} x="130" y="313" width="40" height="44" preserveAspectRatio="xMidYMid meet" />
        <path d="M94 364 H206 L200 370 H100 Z" fill="#9aa5ad" />
        <rect x="70" y="350" width="16" height="16" rx="3" fill="#fff" />
        <path d="M86 354 q7 0 7 5 q0 5 -7 5" fill="none" stroke="#fff" strokeWidth="3" />
        <path d="M74 344 q2 -4 0 -8 M80 344 q2 -4 0 -8" stroke="#fff" strokeOpacity="0.8" strokeWidth="2" fill="none" strokeLinecap="round" />
        <rect x="216" y="350" width="18" height="16" rx="3" fill="#e58f5f" />
        {[[-10, -14], [0, -22], [10, -14], [-5, -8], [6, -6]].map(([dx, dy], i) => (
            <ellipse key={i} cx={225 + dx} cy={350 + dy} rx="5" ry="9" fill="#6fae5c" transform={`rotate(${dx * 3} ${225 + dx} ${350 + dy})`} />
        ))}
    </>
)

// Wii Portfolio: this site on a TV, with a Wii console and remote beside it
const TvScene = ({ id, thumb }) => (
    <>
        <rect x="50" y="372" width="200" height="20" fill="#d8dee2" />
        <rect x="86" y="300" width="124" height="68" rx="8" fill="#3a3f47" />
        <clipPath id={`${id}-screen`}>
            <rect x="92" y="306" width="112" height="56" rx="3" />
        </clipPath>
        <image href={thumb} x="92" y="306" width="112" height="56" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}-screen)`} />
        <rect x="136" y="368" width="24" height="6" rx="2" fill="#3a3f47" />
        <rect x="222" y="326" width="10" height="46" rx="3" fill="#fff" stroke="#d3dadf" strokeWidth="1.5" />
        <rect x="225" y="332" width="4" height="14" rx="2" fill="#34beed" className="scene-glow" />
        <rect x="58" y="362" width="26" height="8" rx="4" fill="#fff" stroke="#d3dadf" strokeWidth="1.5" />
        <circle cx="64" cy="366" r="2" fill="#34beed" />
    </>
)

// IBM TechXChange: a stage with the IBM logo on the big screen, a lectern and the audience
const StageScene = ({ thumb }) => (
    <>
        <rect x="50" y="292" width="200" height="100" fill="#2b3245" />
        <rect x="84" y="300" width="132" height="50" rx="4" fill="#fff" />
        <image href={thumb} x="110" y="306" width="80" height="38" preserveAspectRatio="xMidYMid meet" />
        <rect x="50" y="368" width="200" height="8" fill="#1f70c1" />
        <path d="M184 368 L188 338 H210 L214 368 Z" fill="#3a3f47" />
        <path d="M196 338 Q196 326 204 322" fill="none" stroke="#9aa5ad" strokeWidth="2" />
        <circle cx="205" cy="321" r="3" fill="#5d6670" />
        {Array.from({ length: 11 }, (_, i) => (
            <circle key={i} cx={58 + i * 18.5} cy={388 - (i % 2) * 3} r="8" fill="#141a26" />
        ))}
    </>
)

// NFL Superfan: the app on an Android phone next to a football, on a strip of turf
const PhoneScene = ({ thumb }) => (
    <>
        <rect x="50" y="370" width="200" height="22" fill="#5aa34a" />
        {[80, 120, 160, 200, 240].map((x) => (
            <path key={x} d={`M${x} 370 V392`} stroke="#fff" strokeOpacity="0.7" strokeWidth="2" />
        ))}
        <rect x="106" y="300" width="50" height="86" rx="8" fill="#2b2b2b" />
        <rect x="110" y="308" width="42" height="70" rx="3" fill="#fff" />
        <image href={thumb} x="110" y="322" width="42" height="42" preserveAspectRatio="xMidYMid meet" />
        <ellipse cx="204" cy="356" rx="26" ry="15" fill="#8a4b2a" transform="rotate(-18 204 356)" />
        <path d="M192 352 L214 345" stroke="#fff" strokeWidth="2.5" />
        {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${195 + i * 5.5} ${348 - i * 1.8} l2 6`} stroke="#fff" strokeWidth="1.5" />
        ))}
        <path d="M184 370 L190 362 H218 L224 370 Z" fill="#c9a227" />
    </>
)

// Autonomous Racing: the team photo on an easel, a racing helmet and track cones
const PhotoScene = ({ id, thumb }) => (
    <>
        <rect x="50" y="374" width="200" height="18" fill="#9aa5ad" />
        <path d="M86 388 L104 360 M152 388 L134 360" stroke="#8a6a4a" strokeWidth="4" />
        <rect x="70" y="300" width="98" height="66" rx="3" fill="#c9a45c" />
        <clipPath id={`${id}-screen`}>
            <rect x="76" y="306" width="86" height="54" />
        </clipPath>
        <image href={thumb} x="76" y="306" width="86" height="54" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}-screen)`} />
        <path d="M184 372 Q184 340 210 340 Q236 340 236 366 L236 372 Z" fill="#c8102e" />
        <path d="M206 350 H236 V362 H210 Q204 362 206 350 Z" fill="#2b3245" />
        <path d="M190 356 Q192 344 206 342" stroke="#fff" strokeOpacity="0.6" strokeWidth="3" fill="none" strokeLinecap="round" />
        <Cone x={64} y={388} s={0.8} color="#ffc93c" />
        <Cone x={178} y={388} s={0.8} color="#3f7fe0" />
        <Cone x={244} y={388} s={0.8} color="#ffc93c" />
    </>
)

const SCENES = { laptop: LaptopScene, tv: TvScene, stage: StageScene, phone: PhoneScene, photo: PhotoScene }

// What's on show in the window: a scene if the project has one, otherwise its picture
const WindowDisplay = ({ id, scene, thumb, thumbFit }) => {
    const Scene = SCENES[scene]
    return (
        <g clipPath={`url(#${id}-window)`} className="shop-window">
            <rect x="50" y="292" width="200" height="100" fill={Scene ? `url(#${id}-interior)` : thumb ? "#fff" : "#eef2f4"} />
            {Scene ? (
                <Scene id={id} thumb={thumb} />
            ) : thumb ? (
                <image
                    href={thumb}
                    x={thumbFit === "contain" ? 80 : 50}
                    y={thumbFit === "contain" ? 300 : 292}
                    width={thumbFit === "contain" ? 140 : 200}
                    height={thumbFit === "contain" ? 84 : 100}
                    preserveAspectRatio={thumbFit === "contain" ? "xMidYMid meet" : "xMidYMid slice"}
                />
            ) : (
                <LoadingRing cx={150} cy={342} />
            )}
            <rect x="50" y="292" width="200" height="100" fill={`url(#${id}-glass)`} />
        </g>
    )
}

/* ---------- upper storeys, newest to oldest ---------- */

// 2020s new-build: white render, timber cladding and a big picture window
const Modern = ({ id, color }) => (
    <>
        <rect x="0" y="60" width="440" height="176" fill="#f7f8f9" />
        <rect x="0" y="60" width="150" height="176" fill="#dcae7c" />
        {Array.from({ length: 9 }, (_, i) => (
            <path key={i} d={`M${16 + i * 16} 60 V236`} stroke="#c7955f" strokeWidth="3" />
        ))}
        <rect x="-2" y="50" width="444" height="14" rx="7" fill={color} />
        <rect x="-2" y="50" width="444" height="14" rx="7" fill={`url(#${id}-gloss)`} />
        <rect x="176" y="86" width="232" height="118" rx="16" fill="#3a3f47" />
        <rect x="184" y="94" width="216" height="102" rx="10" fill={`url(#${id}-sky)`} />
        <path d="M292 94 V196" stroke="#3a3f47" strokeWidth="4" />
        <path d="M196 184 L250 104" stroke="#fff" strokeOpacity="0.55" strokeWidth="6" strokeLinecap="round" />
        <rect x="176" y="168" width="232" height="4" fill="#fff" fillOpacity="0.7" />
    </>
)

// 1930s Art Deco: cream render, stepped parapet, speed lines and metal-framed windows
const Deco = ({ id, color }) => (
    <>
        <path d="M0 236 V58 H130 V40 Q130 34 136 34 H168 V20 Q168 14 174 14 H266 Q272 14 272 20 V34 H304 Q310 34 310 40 V58 H440 V236 Z" fill="#fbf3e2" />
        <circle cx="220" cy="46" r="17" fill="#fff" />
        <circle cx="220" cy="46" r="12" fill={`url(#${id}-sky)`} />
        {[70, 80, 90].map((y) => (
            <g key={y}>
                <path d={`M18 ${y} H120`} stroke={color} strokeWidth="4" strokeLinecap="round" />
                <path d={`M320 ${y} H422`} stroke={color} strokeWidth="4" strokeLinecap="round" />
            </g>
        ))}
        <Window id={id} x={60} y={108} w={130} h={92} frame="#3b4652" bars={paneBars(66, 114, 118, 80, 3, 2)} sill="#efe4cc" />
        <Window id={id} x={250} y={108} w={130} h={92} frame="#3b4652" bars={paneBars(256, 114, 118, 80, 3, 2)} sill="#efe4cc" />
    </>
)

// Victorian: soft red brick, slate roof, chimney stack and arched sash windows
const Victorian = ({ id }) => (
    <>
        <rect x="350" y="-34" width="44" height="60" rx="4" fill="#c97862" />
        <rect x="346" y="-40" width="52" height="10" rx="4" fill="#b8654f" />
        <rect x="356" y="-58" width="14" height="20" rx="4" fill="#e09a6a" />
        <rect x="376" y="-54" width="14" height="16" rx="4" fill="#e09a6a" />
        <path d="M-4 76 Q-4 70 2 64 L44 12 Q48 8 54 8 H386 Q392 8 396 12 L438 64 Q444 70 444 76 Z" fill="#8196ad" />
        <path d="M-4 76 Q-4 70 2 64 L44 12 Q48 8 54 8 H386 Q392 8 396 12 L438 64 Q444 70 444 76 Z" fill={`url(#${id}-slate)`} />
        <path d="M-4 76 Q-4 70 2 64 L44 12 Q48 8 54 8 H386 Q392 8 396 12 L438 64 Q444 70 444 76 Z" fill={`url(#${id}-gloss)`} />
        <rect x="0" y="74" width="440" height="162" fill="#e3a08a" />
        <rect x="0" y="74" width="440" height="162" fill={`url(#${id}-brick)`} />
        <rect x="0" y="96" width="440" height="8" fill="#f4efe4" />
        <Window id={id} x={78} y={112} w={84} h={96} arch bars={["M84 160 H156"]} />
        <Window id={id} x={278} y={112} w={84} h={96} arch bars={["M284 160 H356"]} />
        <Bird x={150} y={6} />
    </>
)

// Georgian: yellow stock brick behind a stone parapet, with tall six-over-six sashes
const Georgian = ({ id }) => (
    <>
        <rect x="40" y="0" width="40" height="44" rx="4" fill="#d6a46c" />
        <rect x="44" y="-16" width="12" height="18" rx="4" fill="#e09a6a" />
        <rect x="62" y="-12" width="12" height="14" rx="4" fill="#e09a6a" />
        <rect x="-2" y="36" width="444" height="16" rx="6" fill="#f4efe4" />
        <rect x="0" y="52" width="440" height="184" fill="#ecc994" />
        <rect x="0" y="52" width="440" height="184" fill={`url(#${id}-brick)`} />
        <rect x="-2" y="52" width="444" height="8" fill="#e2dccd" />
        {[72, 186, 300].map((x) => (
            <g key={x}>
                <rect x={x - 4} y="80" width="76" height="10" rx="2" fill="#c98a5a" />
                <Window id={id} x={x} y={90} w={68} h={118} bars={paneBars(x + 6, 96, 56, 106, 3, 4)} />
            </g>
        ))}
        <Bird x={250} y={36} flip delay={1.7} />
        <Bird x={276} y={36} delay={3.1} />
    </>
)

// Tudor: a jettied, black-and-white timber frame under a steep gable with leaded windows
const Tudor = ({ id }) => (
    <>
        <rect x="372" y="-70" width="40" height="110" rx="4" fill="#c97862" />
        <rect x="368" y="-78" width="48" height="10" rx="4" fill="#b8654f" />
        <path d="M-12 56 L220 -64 L452 56 Z" fill="#fdfaf3" />
        <g stroke="#4a4f57" strokeWidth="9" strokeLinecap="round" fill="none">
            <path d="M220 -50 V56 M150 -10 V56 M290 -10 V56 M160 0 L220 40 L280 0" />
        </g>
        <path d="M-16 60 L220 -66 L456 60" fill="none" stroke="#4a4f57" strokeWidth="14" strokeLinejoin="round" strokeLinecap="round" />
        <path d="M-16 60 L220 -66 L456 60" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
        <rect x="196" y="4" width="48" height="36" rx="6" fill="#4a4f57" />
        <rect x="201" y="9" width="38" height="26" rx="3" fill={`url(#${id}-sky)`} />
        <rect x="201" y="9" width="38" height="26" rx="3" fill={`url(#${id}-leaded)`} />

        {/* jettied upper floor overhangs the shopfront */}
        <rect x="-8" y="56" width="456" height="164" fill="#fdfaf3" />
        <g stroke="#4a4f57" strokeWidth="9" strokeLinecap="round">
            <path d="M-8 60 H448 M-8 216 H448 M4 60 V216 M436 60 V216 M66 60 V216 M220 60 V216 M374 60 V216" />
        </g>
        {[[86, 120], [240, 120]].map(([x, w]) => (
            <g key={x}>
                <rect x={x} y="92" width={w} height="96" rx="6" fill="#4a4f57" />
                <rect x={x + 6} y="98" width={w - 12} height="84" rx="3" fill={`url(#${id}-sky)`} />
                <rect x={x + 6} y="98" width={w - 12} height="84" rx="3" fill={`url(#${id}-leaded)`} />
            </g>
        ))}
        {/* carved brackets under the jetty */}
        {[30, 410].map((x) => (
            <path key={x} d={`M${x - 10} 220 H${x + 10} Q${x + 10} 236 ${x} 240 Q${x - 10} 236 ${x - 10} 220 Z`} fill="#4a4f57" />
        ))}
        <rect x="0" y="220" width="440" height="16" fill="#fdfaf3" />
    </>
)

// A little bird perched on a roof, bobbing its head now and then
const Bird = ({ x, y, flip = false, delay = 0 }) => (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
        <g className="street-bird" style={{ animationDelay: `${delay}s` }}>
            <path d="M-12 -6 L-20 -10 L-16 -3 Z" fill="#5d6670" />
            <ellipse cx="-3" cy="-7" rx="10" ry="7" fill="#7d8ea3" />
            <ellipse cx="-2" cy="-5" rx="6" ry="4" fill="#e9eef2" />
            <circle cx="6" cy="-14" r="5.5" fill="#7d8ea3" />
            <circle cx="7.5" cy="-15" r="1.3" fill="#2b2b2b" />
            <path d="M11 -14 L15 -13 L11 -12 Z" fill="#f0a63c" />
            <path d="M-4 0 V3 M0 0 V3" stroke="#f0a63c" strokeWidth="1.5" />
        </g>
    </g>
)

const UPPER = { modern: Modern, deco: Deco, victorian: Victorian, georgian: Georgian, tudor: Tudor }

// The shopfront every building shares; the modern one is slim and frameless, the rest traditional
const Shopfront = ({ id, color, era, scene, thumb, thumbFit }) => {
    const modern = era === "modern"
    const joinery = modern ? "#3a3f47" : color
    return (
        <>
            {/* cornice above the fascia */}
            <rect x="8" y="226" width="424" height="14" rx="7" fill={modern ? "#e6e9ec" : "#f4efe4"} />

            {/* fascia: the painted sign board */}
            <rect x="38" y="236" width="364" height="42" rx="10" fill={color} />
            <rect x="38" y="236" width="364" height="42" rx="10" fill={`url(#${id}-gloss)`} />
            {!modern && <rect x="45" y="242" width="350" height="30" rx="6" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="2" />}

            {/* pilasters and console brackets at each end */}
            {[16, 406].map((x) => (
                <g key={x}>
                    <rect x={x} y="236" width="18" height="184" fill={joinery} />
                    {!modern && <rect x={x - 4} y="232" width="26" height="50" rx="10" fill={color} />}
                    {!modern && <rect x={x - 4} y="232" width="26" height="50" rx="10" fill={`url(#${id}-gloss)`} />}
                </g>
            ))}
            <rect x="34" y="278" width="372" height="142" fill={modern ? "#f7f8f9" : "#f4efe4"} />

            {/* display window over a panelled stall riser */}
            <rect x="40" y="284" width="220" height="116" rx="12" fill={joinery} />
            <WindowDisplay id={id} scene={scene} thumb={thumb} thumbFit={thumbFit} />
            <rect x="40" y="398" width="220" height="22" rx="4" fill={joinery} />
            {!modern && <rect x="50" y="403" width="200" height="12" rx="3" fill="#000" fillOpacity="0.12" />}

            {/* panelled door with a glazed top, swinging open on its left hinge */}
            <rect x="296" y="284" width="98" height="136" rx="12" fill={joinery} />
            <g clipPath={`url(#${id}-doorway)`}>
                <rect x="296" y="284" width="98" height="136" fill={`url(#${id}-interior)`} />
                <g className="shop-door">
                    <rect x="302" y="290" width="86" height="130" fill={modern ? "#cfe6f1" : color} />
                    <rect x="302" y="290" width="86" height="130" fill={`url(#${id}-gloss)`} />
                    {modern ? (
                        <rect x="372" y="320" width="6" height="64" rx="3" fill="#3a3f47" />
                    ) : (
                        <>
                            <rect x="312" y="300" width="66" height="50" rx="8" fill={`url(#${id}-sky)`} />
                            <rect x="314" y="362" width="28" height="44" rx="4" fill="#000" fillOpacity="0.1" />
                            <rect x="348" y="362" width="28" height="44" rx="4" fill="#000" fillOpacity="0.1" />
                            <circle cx="378" cy="356" r="4.5" fill="#ffd84a" />
                        </>
                    )}
                </g>
            </g>
            <rect x="292" y="412" width="106" height="8" rx="4" fill="#d3d9dd" />
        </>
    )
}

// memoised: the street re-renders when you walk up to things, but a shop only redraws when its door moves
const ShopFront = memo(({ item, isOpen }) => {
    const id = `shop-${item.id}`
    const { color, scene, thumb, thumbFit = "cover", era = "victorian" } = item
    const Upper = UPPER[era] ?? Victorian

    return (
        <span className={`shop ${isOpen ? "is-open" : ""}`} data-era={era}>
            <svg className="shop-art" viewBox={`0 0 ${SHOP_WIDTH} ${SHOP_HEIGHT}`} aria-hidden="true">
                <defs>
                    <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
                        <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
                        <stop offset="1" stopColor="#000" stopOpacity="0.1" />
                    </linearGradient>
                    <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
                        <stop offset="0.35" stopColor="#fff" stopOpacity="0.1" />
                        <stop offset="0.36" stopColor="#fff" stopOpacity="0" />
                        <stop offset="0.62" stopColor="#fff" stopOpacity="0" />
                        <stop offset="0.63" stopColor="#fff" stopOpacity="0.12" />
                        <stop offset="0.72" stopColor="#fff" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#d9f1fb" />
                        <stop offset="1" stopColor="#9fd3ea" />
                    </linearGradient>
                    <linearGradient id={`${id}-interior`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#ffe7a8" />
                        <stop offset="1" stopColor="#f7b955" />
                    </linearGradient>
                    <pattern id={`${id}-brick`} width="36" height="18" patternUnits="userSpaceOnUse">
                        <path d="M0 0.75 H36 M0 9.75 H36 M9 1 V9 M27 10 V18" stroke="#fff" strokeOpacity="0.18" strokeWidth="1.5" />
                    </pattern>
                    <pattern id={`${id}-slate`} width="24" height="12" patternUnits="userSpaceOnUse">
                        <path d="M0 11.5 H24 M12 0 V12" stroke="#fff" strokeOpacity="0.12" strokeWidth="1.5" />
                    </pattern>
                    <pattern id={`${id}-leaded`} width="14" height="18" patternUnits="userSpaceOnUse">
                        <path d="M0 9 L7 0 L14 9 L7 18 Z" fill="none" stroke="#4a4f57" strokeOpacity="0.6" strokeWidth="1.2" />
                    </pattern>
                    <clipPath id={`${id}-window`}>
                        <rect x="50" y="292" width="200" height="100" rx="8" />
                    </clipPath>
                    <clipPath id={`${id}-doorway`}>
                        <path d={DOORWAY} />
                    </clipPath>
                </defs>

                <Upper id={id} color={color} />
                <Shopfront id={id} color={color} era={era} scene={scene} thumb={thumb} thumbFit={thumbFit} />

                {/* drainpipe down the party wall */}
                <rect x="1" y="64" width="7" height="356" rx="3.5" fill="#5d6670" />
                <rect x="-2" y="62" width="13" height="10" rx="3" fill="#5d6670" />
            </svg>

            {/* long names shrink to fit the fascia (about 18 characters at full size) */}
            <span className="shop-name" style={{ "--name-scale": Math.min(1, 18 / item.title.length) }}>
                {item.title}
            </span>
        </span>
    )
})

// A skinny building still going up at the start of the street: the next project
export const ConstructionSite = memo(() => (
    <svg className="construction-art" viewBox="0 0 200 480" aria-hidden="true">
        <defs>
            <pattern id="construction-hazard" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="20" height="20" fill="#2b2b2b" />
                <rect width="10" height="20" fill="#ffc93c" />
            </pattern>
        </defs>

        {/* tower crane */}
        <g stroke="#f0b400" strokeWidth="4" fill="none" strokeLinejoin="round">
            <path d="M54 150 V24 M74 150 V24" />
            <path d={`M54 150 ${Array.from({ length: 7 }, (_, i) => `L${i % 2 ? 54 : 74} ${132 - i * 18}`).join(" ")}`} strokeWidth="2.5" />
            <path d="M-30 24 H196 M20 12 L64 -6 L196 24" strokeWidth="3" />
        </g>
        <rect x="-36" y="24" width="30" height="18" fill="#9aa5ad" />
        <rect x="74" y="26" width="20" height="16" rx="3" fill="#ffc93c" stroke="#f0b400" strokeWidth="2" />
        <circle cx="64" cy="-8" r="5" className="construction-beacon" />
        <path d="M172 24 V108" stroke="#5a5a5a" strokeWidth="2" />
        <g className="construction-load">
            <path d="M166 108 h12 v6 a6 6 0 0 1 -12 0" fill="none" stroke="#5a5a5a" strokeWidth="2.5" />
            <path d="M172 118 L146 132 M172 118 L198 132" stroke="#5a5a5a" strokeWidth="1.5" />
            <rect x="136" y="132" width="72" height="10" fill="#c8102e" />
            <rect x="136" y="132" width="72" height="3" fill="#fff" fillOpacity="0.35" />
        </g>

        {/* concrete frame: finished floors at the bottom, bare frame above */}
        <rect x="24" y="300" width="152" height="120" fill="#cfe6f1" />
        <path d="M64 300 V420 M110 300 V420 M140 300 V420" stroke="#fff" strokeOpacity="0.7" strokeWidth="3" />
        {[30, 100, 170].map((x) => (
            <rect key={x} x={x - 6} y="150" width="12" height="270" fill="#c9ced2" />
        ))}
        <rect x="164" y="128" width="12" height="22" fill="#c9ced2" />
        <path d="M168 128 V112 M172 128 V112" stroke="#8a6d4b" strokeWidth="1.5" />
        {[150, 210, 270, 300, 360].map((y) => (
            <rect key={y} x="16" y={y} width="168" height="8" fill="#b9c0c5" />
        ))}

        {/* scaffolding up the left side */}
        <g stroke="#7d8790" strokeWidth="3">
            <path d="M4 160 V420 M18 160 V420" />
            {[180, 220, 260, 300, 340, 380].map((y) => (
                <path key={y} d={`M2 ${y} H22`} />
            ))}
            <path d="M4 180 L18 220 M4 260 L18 300 M4 340 L18 380" strokeWidth="2" />
        </g>
        {[178, 258, 338].map((y) => (
            <rect key={y} x="0" y={y - 4} width="26" height="5" fill="#b8874f" />
        ))}

        {/* site hoarding */}
        <rect x="0" y="420" width="200" height="60" fill="#e9d3a6" />
        <path d="M50 420 V480 M100 420 V480 M150 420 V480" stroke="#d2b884" strokeWidth="2" />
        <rect x="0" y="420" width="200" height="10" fill="url(#construction-hazard)" />
        <rect x="34" y="438" width="132" height="32" rx="4" fill="#fff" stroke="#ffc93c" strokeWidth="3" />
        <text x="100" y="452" textAnchor="middle" className="construction-text">COMING SOON</text>
        <text x="100" y="464" textAnchor="middle" className="construction-subtext">next project in progress</text>
    </svg>
))

// A red pillar box, 44 x 96 units; a letter peeks out of the slot when the Mii is beside it
export const PostBox = memo(() => (
    <svg className="street-prop-art" viewBox="0 0 44 96" aria-hidden="true">
        <rect x="5" y="20" width="34" height="66" rx="7" fill="#d9363e" />
        <path d="M3 22 Q3 3 22 3 Q41 3 41 22 Z" fill="#d9363e" />
        <path d="M3 22 Q3 3 22 3 Q41 3 41 22 Z" fill="#fff" fillOpacity="0.22" />
        <rect x="1" y="19" width="42" height="8" rx="4" fill="#b82a31" />
        <rect x="11" y="34" width="22" height="5" rx="2.5" fill="#3a2a2a" />
        <g className="postbox-letter">
            <rect x="12" y="24" width="20" height="13" rx="2" fill="#fff" stroke="#d3dadf" strokeWidth="1" />
            <path d="M12 25 L22 32 L32 25" fill="none" stroke="#d3dadf" strokeWidth="1" />
        </g>
        <rect x="13" y="47" width="18" height="13" rx="2" fill="#fff" fillOpacity="0.9" />
        <path d="M16 51 H28 M16 55 H25" stroke="#d9363e" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="9" y="24" width="5" height="58" rx="2.5" fill="#fff" fillOpacity="0.2" />
        <rect x="1" y="84" width="42" height="12" rx="4" fill="#2f2f33" />
    </svg>
))

// A red telephone box, 70 x 170 units
export const PhoneBox = memo(() => (
    <svg className="street-prop-art" viewBox="0 0 70 170" aria-hidden="true">
        <path d="M4 30 Q4 6 35 4 Q66 6 66 30 Z" fill="#d9363e" />
        <rect x="2" y="26" width="66" height="12" rx="4" fill="#d9363e" />
        <rect x="10" y="28" width="50" height="8" rx="2" fill="#fff" />
        <text x="35" y="34.5" textAnchor="middle" className="street-prop-text">TELEPHONE</text>
        <rect x="6" y="38" width="58" height="122" rx="4" fill="#d9363e" />
        <rect x="13" y="46" width="44" height="102" rx="3" fill="#cfe9f5" />
        <path d={`M13 66 H57 M13 86 H57 M13 106 H57 M13 126 H57 M35 46 V148`} stroke="#d9363e" strokeWidth="3" />
        <path d="M18 140 L42 52" stroke="#fff" strokeOpacity="0.6" strokeWidth="4" strokeLinecap="round" />
        <rect x="0" y="158" width="70" height="12" rx="3" fill="#b82a31" />
        <rect x="8" y="40" width="5" height="116" rx="2.5" fill="#fff" fillOpacity="0.2" />
    </svg>
))

// The team's ADS-DV autonomous race car, about 240 x 80 units, with a lidar on the roll hoop
export const RaceCar = memo(() => (
    <svg className="street-prop-art" viewBox="0 0 240 80" aria-hidden="true">
        <ellipse cx="120" cy="76" rx="112" ry="5" fill="#000" fillOpacity="0.15" />
        {/* rear wing */}
        <rect x="6" y="14" width="34" height="8" rx="3" fill="#2b3245" />
        <path d="M18 22 V44 M30 22 V44" stroke="#2b3245" strokeWidth="4" />
        {/* body */}
        <path d="M20 58 Q16 42 40 40 L92 36 Q104 22 122 24 L136 36 L200 46 Q232 50 236 60 Q236 64 228 64 H24 Q20 64 20 58 Z" fill="#fff" />
        <path d="M60 52 L200 50 Q224 52 232 60 H60 Z" fill="#c8102e" />
        <path d="M34 46 Q60 40 96 40" stroke="#fff" strokeOpacity="0.7" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M104 36 Q112 30 126 32 L132 38 H104 Z" fill="#2b3245" />
        {/* roll hoop with lidar and stereo camera */}
        <path d="M92 38 L98 14 H106 L108 36" fill="none" stroke="#5d6670" strokeWidth="4" strokeLinejoin="round" />
        <rect x="94" y="4" width="16" height="10" rx="4" fill="#3a3f47" />
        <rect x="96" y="7" width="12" height="3" rx="1.5" fill="#34beed" className="scene-glow" />
        <rect x="140" y="38" width="20" height="6" rx="3" fill="#3a3f47" />
        <circle cx="144" cy="41" r="1.6" fill="#9fd3ea" />
        <circle cx="156" cy="41" r="1.6" fill="#9fd3ea" />
        {/* front wing */}
        <rect x="206" y="60" width="32" height="6" rx="3" fill="#2b3245" />
        {/* wheels */}
        {[52, 186].map((x) => (
            <g key={x}>
                <circle cx={x} cy="58" r="18" fill="#2b2b2b" />
                <circle cx={x} cy="58" r="9" fill="#9aa5ad" />
                <circle cx={x} cy="58" r="3" fill="#2b2b2b" />
            </g>
        ))}
        <text x="152" y="58" textAnchor="middle" className="street-prop-text street-prop-text-light">CARDIFF</text>
    </svg>
))

// A track cone on its own, for laying out around the car
export const TrackCone = memo(({ color }) => (
    <svg className="street-prop-art" viewBox="-12 -24 24 28" aria-hidden="true">
        <Cone x={0} y={0} color={color} />
    </svg>
))

export default ShopFront
