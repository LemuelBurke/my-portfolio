import { PALETTE, createFloaters, createParticles, rand } from "./draw"

const ROUND_SECONDS = 45

// Tap the bubbles before they float off the top. Popping in a row builds a combo multiplier;
// letting one escape (or tapping empty water) resets it. Golden bubbles are worth 5.
const bubblePop = {
    title: "Bubble Pop",
    color: "#34beed",
    howTo: "Tap the bubbles before they float away. Pop them in a row to build a combo, and grab the golden ones for bonus points!",
    create({ setScore, setInfo, end, sfx }) {
        let w = 0
        let h = 0
        let s = 1
        let elapsed = 0
        let timeLeft = ROUND_SECONDS
        let shownSeconds = -1
        let score = 0
        let combo = 0
        let spawnIn = 0
        let over = false
        const bubbles = []
        const floaters = createFloaters()
        const particles = createParticles()

        const multiplier = () => 1 + Math.min(4, Math.floor(combo / 5))
        const breakCombo = () => {
            if (combo >= 5) setInfo("Combo lost")
            combo = 0
        }

        return {
            resize(nw, nh) {
                w = nw
                h = nh
                s = Math.max(0.8, Math.min(w, h) / 600) // never too small for fingers on phones
            },

            update(dt) {
                if (over) return
                elapsed += dt
                timeLeft -= dt
                const secs = Math.max(0, Math.ceil(timeLeft))
                if (secs !== shownSeconds) {
                    shownSeconds = secs
                    setInfo(`${secs}s left`)
                }
                if (timeLeft <= 0) {
                    over = true
                    end(score)
                    return
                }

                // bubbles come faster and rise quicker as the round goes on
                spawnIn -= dt
                if (spawnIn <= 0) {
                    spawnIn = Math.max(0.28, 0.75 - elapsed * 0.01) * rand(0.6, 1.3)
                    const gold = Math.random() < 0.07
                    const r = (gold ? 26 : rand(24, 46)) * s
                    bubbles.push({
                        x: rand(r, w - r),
                        y: h + r,
                        r,
                        vy: (rand(60, 110) + elapsed * 2.2) * s * (gold ? 1.35 : 1),
                        phase: rand(0, Math.PI * 2),
                        gold,
                        tint: PALETTE[Math.floor(Math.random() * PALETTE.length)],
                    })
                }

                for (let i = bubbles.length - 1; i >= 0; i--) {
                    const b = bubbles[i]
                    b.y -= b.vy * dt
                    b.phase += dt * 2
                    if (b.y < -b.r) {
                        bubbles.splice(i, 1)
                        breakCombo()
                    }
                }
                particles.update(dt)
                floaters.update(dt)
            },

            draw(ctx) {
                const bg = ctx.createLinearGradient(0, 0, 0, h)
                bg.addColorStop(0, "#e9f8fe")
                bg.addColorStop(1, "#a9dff5")
                ctx.fillStyle = bg
                ctx.fillRect(0, 0, w, h)

                // soft light rays from the surface
                ctx.fillStyle = "rgba(255,255,255,0.25)"
                for (let i = 0; i < 4; i++) {
                    const x = ((i + 0.5) / 4) * w
                    ctx.beginPath()
                    ctx.moveTo(x - 30 * s, 0)
                    ctx.lineTo(x + 30 * s, 0)
                    ctx.lineTo(x + 90 * s, h)
                    ctx.lineTo(x - 10 * s, h)
                    ctx.fill()
                }

                for (const b of bubbles) {
                    const x = b.x + Math.sin(b.phase) * 6 * s
                    const g = ctx.createRadialGradient(x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.1, x, b.y, b.r)
                    if (b.gold) {
                        g.addColorStop(0, "#fff8d6")
                        g.addColorStop(0.6, "#ffd34d")
                        g.addColorStop(1, "#f0a500")
                    } else {
                        g.addColorStop(0, "rgba(255,255,255,0.95)")
                        g.addColorStop(0.55, "rgba(255,255,255,0.25)")
                        g.addColorStop(1, b.tint)
                    }
                    ctx.fillStyle = g
                    ctx.beginPath()
                    ctx.arc(x, b.y, b.r, 0, Math.PI * 2)
                    ctx.fill()
                    ctx.strokeStyle = b.gold ? "#f0a500" : "rgba(255,255,255,0.9)"
                    ctx.lineWidth = 2 * s
                    ctx.stroke()
                    // highlight glint
                    ctx.fillStyle = "rgba(255,255,255,0.9)"
                    ctx.beginPath()
                    ctx.ellipse(x - b.r * 0.38, b.y - b.r * 0.42, b.r * 0.22, b.r * 0.12, -0.6, 0, Math.PI * 2)
                    ctx.fill()
                }

                particles.draw(ctx)
                floaters.draw(ctx, 26 * s)

                // combo meter
                if (combo >= 5) {
                    ctx.textAlign = "center"
                    ctx.font = `800 ${22 * s}px system-ui, -apple-system, "Segoe UI", sans-serif`
                    ctx.fillStyle = "#1e9fcf"
                    ctx.fillText(`Combo x${multiplier()}`, w / 2, h - 30 * s)
                }
            },

            pointerDown(px, py) {
                if (over) return
                // check the nearest bubbles first; be generous so small fingers still hit
                for (let i = bubbles.length - 1; i >= 0; i--) {
                    const b = bubbles[i]
                    const x = b.x + Math.sin(b.phase) * 6 * s
                    if (Math.hypot(px - x, py - b.y) <= b.r * 1.2 + 6 * s) {
                        bubbles.splice(i, 1)
                        combo += 1
                        const pts = (b.gold ? 5 : 1) * multiplier()
                        score += pts
                        setScore(score)
                        floaters.add(x, b.y, `+${pts}`, b.gold ? "#f0a500" : "#1e9fcf")
                        particles.burst(x, b.y, b.gold ? "#ffc93c" : "#ffffff", 10, 220 * s)
                        sfx(b.gold ? 880 : 520 + Math.min(combo, 20) * 18, 0.09)
                        if (combo % 5 === 0) setInfo(`Combo x${multiplier()}!`)
                        return
                    }
                }
                breakCombo()
            },
        }
    },
}

export default bubblePop
