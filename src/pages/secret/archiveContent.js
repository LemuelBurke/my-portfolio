// ISD Chimaera: the Empire's stop on the galaxy map, at the command holotable of Grand Admiral
// Thrawn's Star Destroyer in orbit over Lothal. Morgan's picks are his own opinions;
// keep them that way rather than filling gaps with guesses. Every line of dialogue here is
// written for this page (none is quoted from the films or shows).

// The battle that plays out on the holotable
export const ENGAGEMENT = {
    record: "Engagement record 7-Aurek",
    title: "Rebel strike on the Lothal blockade",
}

// Who speaks in the tactical log
export const SPEAKERS = {
    sensors: "Sensors",
    tactical: "Tactical",
    comms: "Comms",
    thrawn: "Grand Admiral Thrawn",
    archive: "Archive",
}

// The log, beat by beat. The holotable picks these out as the battle reaches each moment.
export const BATTLE_LINES = {
    station: { who: "sensors", text: "Blockade on station. No traffic in the Lothal system." },
    arrival: { who: "sensors", text: "Hyperspace signatures! Rebel ships emerging, bearing two-seven-zero." },
    arrivalThrawn: { who: "thrawn", text: "As expected. Note how their frigate holds back while the corvettes lead." },
    launch: { who: "tactical", text: "TIE squadrons launching to screen the line." },
    hold: { who: "thrawn", text: "Hold fire. Let them come closer. I want to see where they think our weakness is." },
    shields: { who: "tactical", text: "Taking fire on the forward shields. Shields holding." },
    bracket: { who: "thrawn", text: "Bring the escort about to starboard. Give them a gap to aim for." },
    fire: { who: "thrawn", text: "Now. All batteries, fire at will." },
    interdictor: { who: "tactical", text: "Interdictor online. Gravity wells active: no one jumps out." },
    run: { who: "comms", text: "X-wings on an attack run at the Chimaera. Battery seven needs a gunner." },
    runOver: { who: "comms", text: "Attack run broken off. X-wings regrouping." },
    designate: { who: "thrawn", text: (name) => `Concentrate fire on the ${name}.` },
    destroyed: { who: "tactical", text: (name) => `${name} destroyed.` },
    overload: { who: "tactical", text: "Gravity well projectors overloading. They are breaking out!" },
    retreat: { who: "sensors", text: "Rebel survivors jumping to lightspeed." },
    end: { who: "thrawn", text: "Let them go. A retreat tells me more about a commander than a victory ever could." },
    replay: { who: "archive", text: "Record ends. Replaying from the start." },
}

// Morgan's own favourites, presented as the Grand Admiral's file on him
export const DOSSIER = {
    subject: "Morgan Burke",
    role: "Creator of this site",
    note: "To understand a being, study what they love. The subject's preferences, as recorded.",
}

export const PICKS = [
    {
        heading: "Films, ranked",
        lines: [
            { rank: "01", value: "The Empire Strikes Back" },
            { rank: "02", value: "Revenge of the Sith" },
            { rank: "03+", value: "The rest", note: "All good." },
        ],
        footnote: "The sequel trilogy: not for me.",
    },
    { heading: "Favourite series", lines: [{ rank: "01", value: "Andor" }] },
    {
        heading: "Favourite characters",
        lines: [
            { rank: "01", value: "Grand Admiral Thrawn" },
            { rank: "02", value: "Darth Maul", note: "A very close second." },
        ],
    },
    { heading: "Favourite side", lines: [{ rank: "01", value: "The Empire" }] },
    { heading: "On the tabletop", text: "Star Wars: Legion, alongside Warhammer 40,000." },
]
