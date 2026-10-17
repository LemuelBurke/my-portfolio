import { motion, AnimatePresence } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"
import { DEALER, SABACC } from "./tatooineContent"
import { blip, noise } from "./sound"

/*
 * Sabacc against Vexa Torr, in the style of Corellian Spike (simplified). Cards run from -10 to +10
 * in three suits, plus two sylops worth zero. You each start with two cards and play three rounds;
 * each round you may draw, swap a card for the top of the discard pile, drop a card, or stand.
 * After each round the spike dice roll: doubles is a sabacc shift, and both hands are dealt again.
 * Closest to zero takes the pot; exactly zero is sabacc, and two sylops is pure sabacc.
 */

const SUITS = ["circle", "square", "triangle"]
const MAX_CARDS = 5
let cardId = 0

const newDeck = () => {
    const deck = []
    for (const suit of SUITS)
        for (let v = 1; v <= 10; v++) {
            deck.push({ id: ++cardId, value: v, suit })
            deck.push({ id: ++cardId, value: -v, suit })
        }
    deck.push({ id: ++cardId, value: 0, suit: "sylop" }, { id: ++cardId, value: 0, suit: "sylop" })
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[deck[i], deck[j]] = [deck[j], deck[i]]
    }
    return deck
}

const total = (hand) => hand.reduce((s, c) => s + c.value, 0)
const isPure = (hand) => hand.length === 2 && hand.every((c) => c.suit === "sylop")
// lower is better: pure sabacc, then closeness to zero, then positive over negative, then more cards, then the highest positive card
const rank = (hand) => {
    const s = total(hand)
    return [isPure(hand) ? 0 : 1, Math.abs(s), s >= 0 ? 0 : 1, -hand.length, -Math.max(0, ...hand.map((c) => c.value))]
}
const compare = (a, b) => {
    const ra = rank(a)
    const rb = rank(b)
    for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] - rb[i]
    return 0
}
const pick = (list) => list[Math.floor(Math.random() * list.length)]

// Vexa's turn: decide on a move from her hand and the card showing on the discard pile
const dealerMove = (hand, top, deckSize) => {
    const s = total(hand)
    if (Math.abs(s) <= 1) return { kind: "stand" }
    // would swapping one of her cards for the discard help a lot?
    let best = null
    hand.forEach((c, i) => {
        const after = Math.abs(s - c.value + top.value)
        if (!best || after < best.after) best = { i, after }
    })
    if (best && best.after <= Math.abs(s) - 2) return { kind: "swap", index: best.i }
    if (Math.abs(s) > 4 && hand.length < MAX_CARDS && deckSize) return { kind: "draw" }
    // or would dropping one?
    if (hand.length > 2) {
        let drop = null
        hand.forEach((c, i) => {
            const after = Math.abs(s - c.value)
            if (!drop || after < drop.after) drop = { i, after }
        })
        if (drop.after < Math.abs(s)) return { kind: "drop", index: drop.i }
    }
    if (Math.abs(s) > 2 && hand.length < MAX_CARDS && deckSize) return { kind: "draw" }
    return { kind: "stand" }
}

const readCredits = () => {
    try {
        const n = Number(localStorage.getItem(SABACC.creditsKey))
        return Number.isFinite(n) && localStorage.getItem(SABACC.creditsKey) !== null ? n : SABACC.start
    } catch {
        return SABACC.start
    }
}

const Card = ({ card, hidden = false, selected = false, onClick, small = false }) => {
    const label = hidden ? "Face-down card" : card.suit === "sylop" ? "Sylop, zero" : `${card.value > 0 ? "Plus" : "Minus"} ${Math.abs(card.value)}, ${card.suit}`
    const body = hidden ? (
        <span className="sabacc-back" aria-hidden="true" />
    ) : (
        <>
            <span className="sabacc-value">{card.suit === "sylop" ? "0" : card.value > 0 ? `+${card.value}` : `−${Math.abs(card.value)}`}</span>
            <span className={`sabacc-suit is-${card.suit}`} aria-hidden="true" />
        </>
    )
    const cls = `sabacc-card ${hidden ? "is-hidden" : card.value > 0 ? "is-plus" : card.value < 0 ? "is-minus" : "is-sylop"} ${selected ? "is-selected" : ""} ${small ? "is-small" : ""}`
    return onClick ? (
        <button type="button" className={cls} onClick={onClick} aria-pressed={selected} aria-label={label}>
            {body}
        </button>
    ) : (
        <span className={cls} role="img" aria-label={label}>
            {body}
        </span>
    )
}

const Die = ({ value, rolling }) => (
    <span className={`sabacc-die ${rolling ? "is-rolling" : ""}`} aria-label={`Die showing ${value}`}>
        {Array.from({ length: value }, (_, i) => (
            <i key={i} />
        ))}
    </span>
)

const Sabacc = () => {
    const [credits, setCredits] = useState(readCredits)
    const [game, setGame] = useState(null) // { deck, discard, you, vexa, round, phase, pot }
    const [selected, setSelected] = useState(null)
    const [line, setLine] = useState(DEALER.lines.hello)
    const [dice, setDice] = useState([3, 4])
    const [rolling, setRolling] = useState(false)
    const [outcome, setOutcome] = useState(null)
    const [rules, setRules] = useState(false)
    const timers = useRef([])
    const later = useCallback((fn, ms) => timers.current.push(setTimeout(fn, ms)), [])
    useEffect(() => () => timers.current.forEach(clearTimeout), [])
    useEffect(() => {
        try {
            localStorage.setItem(SABACC.creditsKey, String(credits))
        } catch {
            // can't remember it: fine
        }
    }, [credits])

    const flick = () => noise(0.06, "highpass", 3000, 1500, 0.08)

    const deal = () => {
        if (credits < SABACC.ante) return
        const deck = newDeck()
        const you = [deck.pop(), deck.pop()]
        const vexa = [deck.pop(), deck.pop()]
        const discard = [deck.pop()]
        setCredits((c) => c - SABACC.ante)
        setGame({ deck, discard, you, vexa, round: 1, phase: "you", pot: SABACC.ante * 2 })
        setSelected(null)
        setOutcome(null)
        setLine(pick(["Ante up.", "Cards are in. Your move.", DEALER.lines.hello]))
        ;[0, 90, 180, 270].forEach((d) => later(flick, d))
    }

    // the end of a round: roll the spike dice, maybe shift, then the next round or the reveal
    const endRound = useCallback((g) => {
        setRolling(true)
        blip(300, "triangle", 0.03, 0.08)
        later(() => {
            const a = 1 + Math.floor(Math.random() * 6)
            const b = 1 + Math.floor(Math.random() * 6)
            setDice([a, b])
            setRolling(false)
            let next = { ...g }
            if (a === b) {
                // sabacc shift: both hands go back, and the same number of cards come out again
                const deck = [...g.deck, ...g.you, ...g.vexa].sort(() => Math.random() - 0.5)
                next = { ...g, deck, you: g.you.map(() => deck.pop()), vexa: g.vexa.map(() => deck.pop()) }
                setLine(DEALER.lines.shift)
                noise(0.4, "bandpass", 600, 3000, 0.15)
            }
            if (g.round >= 3) {
                const cmp = compare(next.you, next.vexa)
                const result = cmp < 0 ? "win" : cmp > 0 ? "lose" : "split"
                setOutcome({ result, you: total(next.you), vexa: total(next.vexa), pureYou: isPure(next.you), pureVexa: isPure(next.vexa) })
                setGame({ ...next, phase: "reveal" })
                if (result === "win") {
                    setCredits((c) => c + next.pot)
                    setLine(pick(DEALER.lines.lose))
                    ;[523, 659, 784].forEach((f, i) => later(() => blip(f, "triangle", 0.05, 0.2), i * 110))
                } else if (result === "lose") {
                    setLine(pick(DEALER.lines.win))
                    blip(180, "sawtooth", 0.04, 0.3)
                } else {
                    setCredits((c) => c + next.pot / 2)
                    setLine("A split. Boring.")
                }
            } else setGame({ ...next, round: g.round + 1, phase: "you" })
        }, 700)
    }, [later])

    const vexaTurn = useCallback(
        (g) => {
            setGame({ ...g, phase: "vexa" })
            later(() => {
                const top = g.discard[g.discard.length - 1]
                const move = dealerMove(g.vexa, top, g.deck.length)
                let next = { ...g }
                if (move.kind === "draw") {
                    const deck = [...g.deck]
                    next = { ...g, deck, vexa: [...g.vexa, deck.pop()] }
                    setLine(pick(DEALER.lines.draw))
                    flick()
                } else if (move.kind === "swap") {
                    const vexa = [...g.vexa]
                    const [out] = vexa.splice(move.index, 1, top)
                    next = { ...g, vexa, discard: [...g.discard.slice(0, -1), out] }
                    setLine(pick(DEALER.lines.swap))
                    flick()
                } else if (move.kind === "drop") {
                    const vexa = [...g.vexa]
                    const [out] = vexa.splice(move.index, 1)
                    next = { ...g, vexa, discard: [...g.discard, out] }
                    setLine("I'll let that one go.")
                    flick()
                } else setLine(pick(DEALER.lines.stand))
                setGame({ ...next, phase: "dice" })
                endRound(next)
            }, 900)
        },
        [endRound, later]
    )

    const act = (kind) => {
        if (!game || game.phase !== "you") return
        let g = { ...game }
        const top = g.discard[g.discard.length - 1]
        if (kind === "draw") {
            if (g.you.length >= MAX_CARDS || !g.deck.length) return
            const deck = [...g.deck]
            g = { ...g, deck, you: [...g.you, deck.pop()] }
        } else if (kind === "swap") {
            if (selected === null) return
            const you = [...g.you]
            const [out] = you.splice(selected, 1, top)
            g = { ...g, you, discard: [...g.discard.slice(0, -1), out] }
        } else if (kind === "drop") {
            if (selected === null || g.you.length <= 1) return
            const you = [...g.you]
            const [out] = you.splice(selected, 1)
            g = { ...g, you, discard: [...g.discard, out] }
        }
        if (kind !== "stand") flick()
        else blip(700, "triangle", 0.03, 0.06)
        setSelected(null)
        vexaTurn(g)
    }

    const yourTotal = game ? total(game.you) : 0
    const revealed = game?.phase === "reveal"
    const top = game?.discard[game.discard.length - 1]
    const broke = (!game || revealed) && credits < SABACC.ante

    return (
        <section className="sabacc" aria-label="Sabacc">
            <header className="sabacc-head">
                <div className="sabacc-dealer">
                    <span className="sabacc-avatar" aria-hidden="true" />
                    <div>
                        <strong>{DEALER.name}</strong>
                        <span>{DEALER.role}</span>
                    </div>
                </div>
                <AnimatePresence mode="wait">
                    <motion.p key={line} className="sabacc-line" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        “{line}”
                    </motion.p>
                </AnimatePresence>
            </header>

            <div className="sabacc-felt">
                <div className="sabacc-row" aria-label="Vexa's hand">
                    {game ? game.vexa.map((c) => <Card key={c.id} card={c} hidden={!revealed} small />) : <span className="sabacc-empty">Waiting for a hand</span>}
                    {revealed && <span className="sabacc-total">{outcome.pureVexa ? "Pure sabacc" : total(game.vexa)}</span>}
                </div>

                <div className="sabacc-middle">
                    <div className="sabacc-pile">
                        <span className="sabacc-pile-label">Deck</span>
                        <span className="sabacc-card is-hidden is-small" aria-hidden="true">
                            <span className="sabacc-back" />
                        </span>
                    </div>
                    <div className="sabacc-pile">
                        <span className="sabacc-pile-label">Discard</span>
                        {top ? <Card card={top} small /> : <span className="sabacc-card is-ghost is-small" />}
                    </div>
                    <div className="sabacc-pot">
                        <span>Pot</span>
                        <strong>{game?.pot ?? 0}</strong>
                        <span>Round {game ? Math.min(game.round, 3) : 0} of 3</span>
                    </div>
                    <div className="sabacc-dice" aria-live="polite">
                        <Die value={dice[0]} rolling={rolling} />
                        <Die value={dice[1]} rolling={rolling} />
                    </div>
                </div>

                <div className="sabacc-row is-yours" aria-label="Your hand">
                    {game?.you.map((c, i) => (
                        <Card key={c.id} card={c} selected={selected === i} onClick={game.phase === "you" ? () => setSelected(selected === i ? null : i) : undefined} />
                    ))}
                    {game && <span className="sabacc-total">{isPure(game.you) ? "Pure sabacc" : yourTotal === 0 ? "Sabacc!" : `Total ${yourTotal > 0 ? "+" : ""}${yourTotal}`}</span>}
                </div>
            </div>

            <div className="sabacc-actions">
                {game?.phase === "you" ? (
                    <>
                        <button type="button" className="archive-action" onClick={() => act("draw")} disabled={game.you.length >= MAX_CARDS}>
                            Draw
                        </button>
                        <button type="button" className="archive-action" onClick={() => act("swap")} disabled={selected === null} title="Pick one of your cards first">
                            Swap for discard
                        </button>
                        <button type="button" className="archive-action" onClick={() => act("drop")} disabled={selected === null || game.you.length <= 1}>
                            Drop card
                        </button>
                        <button type="button" className="archive-action is-quiet" onClick={() => act("stand")}>
                            Stand
                        </button>
                    </>
                ) : game && !revealed ? (
                    <p className="sabacc-wait">{game.phase === "vexa" ? "Vexa is thinking…" : "Rolling the spike dice…"}</p>
                ) : broke ? (
                    <>
                        <p className="sabacc-wait">{DEALER.lines.broke}</p>
                        <button type="button" className="archive-action" onClick={() => setCredits(SABACC.start)}>
                            Borrow {SABACC.start} credits
                        </button>
                    </>
                ) : (
                    <button type="button" className="archive-action stop-go" onClick={deal}>
                        {game ? "Deal another hand" : "Deal me in"} · ante {SABACC.ante}
                    </button>
                )}
                <span className="sabacc-credits">
                    Credits <strong>{credits}</strong>
                </span>
            </div>

            {revealed && outcome && (
                <p className={`sabacc-outcome is-${outcome.result}`} role="status">
                    {outcome.result === "win" ? `You win ${game.pot} credits.` : outcome.result === "lose" ? "Vexa takes the pot." : "Split pot."} You had{" "}
                    {outcome.pureYou ? "pure sabacc" : outcome.you}; Vexa had {outcome.pureVexa ? "pure sabacc" : outcome.vexa}.
                </p>
            )}

            {game?.phase === "you" && selected === null && <p className="sabacc-tip">Tip: pick one of your cards to swap or drop it.</p>}

            <button type="button" className="stop-link" onClick={() => setRules((r) => !r)} aria-expanded={rules}>
                {rules ? "Hide the rules" : "How to play"}
            </button>
            {rules && (
                <ul className="sabacc-rules">
                    {SABACC.how.map((r) => (
                        <li key={r}>{r}</li>
                    ))}
                </ul>
            )}
        </section>
    )
}

export default Sabacc
