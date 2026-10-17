// Tatooine: the scoundrels' stop on the galaxy map. A sunset over Mos Eisley, then the cantina.
// The characters here are made up for this page.

export const TATOOINE = {
    kicker: "Tatooine · Mos Eisley",
    title: "Mos Eisley spaceport",
    intro: "Two suns going down over the Dune Sea. The cantina's door is open, the band is playing, and nobody's asking questions.",
}

export const DEALER = {
    name: "Vexa Torr",
    role: "Smuggler, and the best sabacc player in Mos Eisley (she says)",
    lines: {
        hello: "Sit down, sit down. You look like you've got credits to lose.",
        draw: ["Hm. Let's see what the deck thinks.", "One more.", "Feeling lucky."],
        stand: ["I'll stand.", "I'm happy where I am.", "Your move, spacer."],
        swap: ["I'll take that, thanks.", "Swapping. Don't read into it."],
        win: ["Pay up.", "Better luck next hand.", "The deck likes me."],
        lose: ["Lucky. Very lucky.", "I let you have that one.", "Don't get used to it."],
        shift: "Sabacc shift! Everybody's hand goes back in the deck.",
        broke: "That's all your credits. Come back when you've sold your speeder.",
    },
}

export const SABACC = {
    how: [
        "Each card is worth its number: green cards count up, red cards count down. The two sylops are worth zero.",
        "The hand whose total is closest to zero wins the pot. A total of exactly zero is sabacc.",
        "There are three rounds. Each round you can draw a card, swap one for the card on the discard pile, drop one, or stand.",
        "After every round the spike dice are rolled. Doubles mean a sabacc shift: everyone's hand is dealt again.",
    ],
    ante: 10,
    start: 100,
    creditsKey: "galaxy-sabacc-credits",
}

// The bounty board, pinned up by the door
export const BOUNTIES = [
    { name: "Morgan Burke", crime: "Wanted for a software engineering role. Built this whole site, including this cantina.", reward: "One excellent developer", contact: true },
    { name: "Grizzk the Unwashed", crime: "Owes the house a bar tab dating back three Hutt regimes.", reward: "2,000 credits and a bath" },
    { name: "Unknown Jawa", crime: "Sold a droid with a 'small' restraining bolt problem.", reward: "Return of droid, no questions" },
    { name: "Tobb Venn", crime: "Claims he can do the Kessel Run in nine parsecs. Nobody believes him.", reward: "500 credits for proof" },
    { name: "A womp rat", crime: "Two metres long. Has been seen near Beggar's Canyon.", reward: "Bragging rights" },
]
