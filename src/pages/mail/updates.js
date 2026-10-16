// Notices shown when visitors press the mail button on the Wii menu, newest first.
// Add a new one at the top with a fresh id; the badge counts the ones a visitor hasn't seen.
// `action` adds a button that opens a channel.
export const UPDATES = [
    {
        id: "welcome",
        date: "15 Oct 2026",
        title: "Welcome to my site!",
        body: "Hey, welcome! I'm Morgan, a software engineer from Wales, currently based in Brisbane. Have a click around: meet my Mii in About Me, take a stroll down Project Street, or waste a little time in the arcade.",
    },
    {
        id: "arcade",
        date: "15 Oct 2026",
        title: "New: arcade channels",
        body: "Bubble Pop, Sky Stacker and Disc Catch are now on the menu. Little timewasters, all made from scratch. Can you beat your best score?",
    },
    {
        id: "project-street",
        date: "15 Oct 2026",
        title: "New: Project Street",
        body: "My projects now live on their own little high street. Walk your Mii from shop to shop, newest at one end and oldest at the other.",
        action: { label: "Visit Project Street", channel: "My Projects" },
    },
    {
        id: "write-to-me",
        date: "15 Oct 2026",
        title: "Hiring, or have a project in mind?",
        body: "I'm looking for full-time or contract software engineering roles. Use the Message Me channel to get in touch and I'll get back to you by email.",
        action: { label: "Send a message", channel: "Message Me" },
    },
]

const READ_KEY = "wii-updates-read"

// Which notices this visitor has already seen (kept in their browser; empty if storage is blocked)
export const readSeenUpdates = () => {
    try {
        return new Set(JSON.parse(localStorage.getItem(READ_KEY) || "[]"))
    } catch {
        return new Set()
    }
}

export const markUpdatesSeen = () => {
    try {
        localStorage.setItem(READ_KEY, JSON.stringify(UPDATES.map((u) => u.id)))
    } catch {
        // ignore: the badge will just show again next visit
    }
}

