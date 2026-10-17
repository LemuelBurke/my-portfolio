// Ilum: the Jedi stop on the galaxy map. Find a kyber crystal, build a lightsaber, train with it.

export const ILUM = {
    kicker: "Ilum · Unknown Regions",
    title: "The crystal caves",
    intro: "Every Jedi finds their own kyber crystal. Listen. Somewhere in the ice, one of them is calling to you.",
}

// The crystals that call out in the cave. `hz` is the note each one sings when you go near it.
export const CRYSTALS = [
    { id: "blue", name: "Blue", blade: "#2f8cff", core: "#e6f4ff", hz: 392, note: "The colour of many Jedi Knights who meet danger with the blade." },
    { id: "green", name: "Green", blade: "#2fe85a", core: "#ecffef", hz: 440, note: "Often carried by Jedi who trust wisdom and patience over the blade." },
    { id: "yellow", name: "Yellow", blade: "#ffc928", core: "#fff9e3", hz: 494, note: "The colour of the Temple Guard, the order's silent sentinels." },
    { id: "purple", name: "Purple", blade: "#a64dff", core: "#f4e8ff", hz: 523, note: "Rare. Master Windu's colour, and Morgan's favourite." },
]

// Hilts, each built from four turned parts: pommel, grip, switch section and emitter
export const HILTS = [
    { id: "guardian", name: "Guardian", note: "Straight and sturdy, with ridged grips and a flared emitter." },
    { id: "seeker", name: "Seeker", note: "Ringed all along the grip, with a short emitter and a heavy pommel." },
    { id: "duelist", name: "Duelist", note: "Its curved neck suits elegant, one-handed bladework." },
    { id: "wanderer", name: "Wanderer", note: "A long, cloth-wrapped grip, the kind built from salvage on the road." },
]

export const FINISHES = [
    { id: "steel", name: "Polished steel", color: 0xc9ced4, metalness: 0.95, roughness: 0.22 },
    { id: "gunmetal", name: "Gunmetal", color: 0x41464d, metalness: 0.85, roughness: 0.35 },
    { id: "brass", name: "Brass", color: 0xb8925a, metalness: 0.9, roughness: 0.3 },
]

export const TRAINING = {
    title: "Training remote",
    intro: "The remote fires stinging bolts. Your blade runs through the pointer: put the pointer on a bolt to deflect it. Catch one on the middle of the blade and it may fly back at the remote.",
    shield: "Your eyes can deceive you. Don't trust them.",
    shieldWho: "Obi-Wan Kenobi",
}

export const SABER_KEY = "galaxy-lightsaber"
