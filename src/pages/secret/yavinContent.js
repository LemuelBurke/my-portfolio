// Yavin 4: the Rebellion's stop on the galaxy map. A briefing in the Massassi temple, then the
// trench run. All the dialogue is written for this page.

export const YAVIN = {
    kicker: "Yavin 4 · Massassi temple",
    title: "The briefing",
}

// The briefing, beat by beat, as the hologram shows each part of the plan
export const BRIEFING = [
    { at: 0, text: "The battle station is armoured against anything we can throw at it from a distance. A fleet attack would be suicide." },
    { at: 1, text: "But it was designed to stop capital ships, not starfighters. A one-pilot craft can get in close, under the defences." },
    { at: 2, text: "Here: a trench runs along the station's surface. At the end of it is a small exhaust port, no wider than a fighter." },
    { at: 3, text: "The port leads straight down to the main reactor. The shaft is ray-shielded, so it has to be a proton torpedo." },
    { at: 4, text: "One hit and the chain reaction does the rest. Stay low in the trench, ignore the guns, and make the shot count." },
]

// What comes over the comm during the run, keyed to seconds into it
export const COMMS = [
    { at: 0.5, who: "Red Leader", text: "Red Five, you're starting your attack run. Keep it low and keep it fast." },
    { at: 7, who: "Red Two", text: "Guns on the trench walls, watch yourself!" },
    { at: 14, who: "Red Leader", text: "Catwalks ahead. Go over or under, but don't slow down." },
    { at: 20, who: "Red Two", text: "Fighters coming in behind you. Three of them!" },
    { at: 21.5, who: "Red Leader", text: "The lead TIE is no ordinary pilot. Watch your back." },
    { at: 30, who: "Base", text: "Red Five, your targeting computer is coming online. Range to target closing." },
    { at: 34, who: "Red Two", text: "A freighter, dropping in from above. It's the Falcon! The TIEs are scattering!" },
]

export const RESULTS = {
    hit: { title: "Direct hit", text: "The torpedo drops straight down the shaft. Pull up and get clear, the station is going to blow." },
    force: { title: "The Force is with you", text: "No computer, no lock, just instinct. The torpedo drops straight down the shaft, and the station goes up behind you." },
    miss: { title: "Negative, it impacted on the surface", text: "The torpedo struck the trench floor. Come round for another run." },
    early: { title: "Too soon", text: "You fired before the port was in range, and the torpedo hit the trench floor. Come round for another run." },
    late: { title: "You overshot the port", text: "The exhaust port flashed beneath you before you fired. Come round for another run." },
    down: { title: "You've been hit", text: "Your shields are gone and your astromech is fighting to keep you flying. Eject, and come round for another run." },
}

export const RUN_BEST_KEY = "galaxy-trench-runs"
