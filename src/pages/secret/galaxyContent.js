// The hidden channel for Star Wars fans: a holographic galaxy map, and the places it leads to.
// Every line of dialogue is written for this page, apart from the famous lines in QUOTES.

export const ARCHIVE_TITLE = "Galaxy Map"

// The opening crawl (original text, in the style of the films)
export const CRAWL = {
    intro: "A long time ago in a galaxy far, far away....",
    episode: "Episode ∞",
    title: "The Hidden Channel",
    paragraphs: [
        "It is a period of idle browsing. A lone visitor, striking from a humble Wii menu, has uncovered a secret channel hidden among the empty slots.",
        "Beyond it lies the whole galaxy. Imperial fleets hold the Outer Rim, kyber crystals sing in the caves of Ilum, and on distant worlds Rebels, scoundrels and Sith go about their business.",
        "With a navicomputer and a little curiosity, the visitor sets out to choose a side, in search of some fun before returning to the menu....",
    ],
}

/*
 * Places on the map. `at` is [x, z] on the galactic plane, with the galaxy about 100 across its radius
 * and the Core at the middle; north (towards the top of the map) is -z. Positions follow the
 * familiar galaxy maps loosely. `live` places can be visited; any others are shown but their routes
 * aren't plotted yet.
 */
export const SIDES = {
    empire: { name: "The Empire", color: "#cfe3f2" },
    jedi: { name: "The Jedi", color: "#5fc2ff" },
    rebellion: { name: "The Rebellion", color: "#ff9a4a" },
    scoundrels: { name: "Scoundrels", color: "#ffd27a" },
    sith: { name: "The Sith", color: "#ff4a3d" },
}

export const DESTINATIONS = [
    {
        id: "ilum",
        side: "jedi",
        name: "Ilum",
        place: "The crystal caves",
        region: "Unknown Regions",
        at: [-70, -16],
        live: true,
        pitch: "Find the kyber crystal that calls to you, build your own lightsaber, then train against a seeker remote.",
    },
    {
        id: "chimaera",
        side: "empire",
        name: "Lothal",
        place: "ISD Chimaera, in orbit",
        region: "Outer Rim · Lothal sector",
        at: [62, 24],
        live: true,
        pitch: "Stand at Grand Admiral Thrawn's holotable as a Rebel attack plays out, then man a turbolaser battery.",
    },
    {
        id: "yavin",
        side: "rebellion",
        name: "Yavin 4",
        place: "The Massassi temple",
        region: "Outer Rim · Gordian Reach",
        at: [46, -54],
        live: true,
        pitch: "Sit in on the briefing at the Massassi temple, then fly the trench run and put a torpedo in the exhaust port.",
    },
    {
        id: "tatooine",
        side: "scoundrels",
        name: "Tatooine",
        place: "Mos Eisley cantina",
        region: "Outer Rim · Arkanis sector",
        at: [54, 56],
        live: true,
        pitch: "Watch the twin suns set, then step into the cantina: check the bounty board and try your luck at sabacc.",
    },
    {
        id: "mustafar",
        side: "sith",
        name: "Mustafar",
        place: "Fortress Vader",
        region: "Outer Rim · Atravis sector",
        at: [-4, 82],
        live: true,
        pitch: "Above the lava at Fortress Vader, bleed a kyber crystal red with your anger, then take up a Sith blade.",
    },
]

// Not a destination, but the centre of everything: shown on the map to get your bearings
export const CORUSCANT = { name: "Coruscant", region: "Core Worlds", at: [0, -8] }

// The regions of the galaxy, as rings out from the Core
export const REGIONS = [
    { name: "Deep Core", r: 9 },
    { name: "Core Worlds", r: 20 },
    { name: "Inner Rim", r: 36 },
    { name: "Mid Rim", r: 56 },
    { name: "Outer Rim", r: 88 },
]

// Short, famous lines and who said them
export const QUOTES = [
    { text: "Hello there!", who: "Obi-Wan Kenobi" },
    { text: "I have a bad feeling about this.", who: "Everyone, eventually" },
    { text: "Do. Or do not. There is no try.", who: "Yoda" },
    { text: "Never tell me the odds!", who: "Han Solo" },
    { text: "I find your lack of faith disturbing.", who: "Darth Vader" },
    { text: "It's a trap!", who: "Admiral Ackbar" },
    { text: "This is where the fun begins.", who: "Anakin Skywalker" },
    { text: "It's over, Anakin! I have the high ground!", who: "Obi-Wan Kenobi" },
    { text: "Unlimited power!", who: "Darth Sidious" },
    { text: "Fear is the path to the dark side.", who: "Yoda" },
    { text: "I'm one with the Force. The Force is with me.", who: "Chirrut Îmwe" },
    { text: "Rebellions are built on hope.", who: "Jyn Erso" },
    { text: "One way out!", who: "Kino Loy" },
    { text: "At last we will reveal ourselves to the Jedi. At last we will have revenge.", who: "Darth Maul" },
    { text: "To defeat an enemy, you must know them.", who: "Grand Admiral Thrawn" },
]
