import { createFloaters, createParticles, rand } from "./draw"

const ROUND_SECONDS = 45

// Styled after the channel art: deep aqua water, clear glass bubbles, chunky yellow lettering
const FONT = '"Fredoka", system-ui, sans-serif'
const NAVY = "#0d3b72"
const YELLOW = "#ffd95a"
const TEXT_STYLE = { family: FONT, weight: 700, stroke: NAVY }

// The little bubbles drifting up in the background (scenery only; they can't be popped)
const SCENERY = Array.from({ length: 26 }, (_, i) => ({
    x: (i * 0.618) % 1,
    phase: (i * 0.377) % 1,
    r: 3 + ((i * 7) % 9),
    speed: 0.035 + ((i * 13) % 10) / 400,
}))

// A clear soap-bubble: nearly see-through in the middle, brighter towards the rim, with a bright
// glint top-left and a small one bottom-right. Golden ones are tinted amber.
const glassBubble = (ctx, x, y, r, gold) => {
    const body = ctx.createRadialGradient(x, y, r * 0.15, x, y, r)
    body.addColorStop(0, gold ? "rgba(255, 214, 90, 0.22)" : "rgba(255, 255, 255, 0.03)")
    body.addColorStop(0.72, gold ? "rgba(255, 196, 50, 0.34)" : "rgba(255, 255, 255, 0.09)")
    body.addColorStop(1, gold ? "rgba(255, 186, 30, 0.75)" : "rgba(255, 255, 255, 0.45)")
    ctx.fillStyle = body
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = gold ? "#ffd95a" : "rgba(255, 255, 255, 0.9)"
    ctx.lineWidth = Math.max(1.4, r * 0.05)
    ctx.stroke()

    ctx.save()
    ctx.translate(x - r * 0.38, y - r * 0.44)
    ctx.rotate(-0.6)
    const glint = ctx.createLinearGradient(0, -r * 0.16, 0, r * 0.16)
    glint.addColorStop(0, "rgba(255, 255, 255, 0.95)")
    glint.addColorStop(1, "rgba(255, 255, 255, 0.35)")
    ctx.fillStyle = glint
    ctx.beginPath()
    ctx.ellipse(0, 0, r * 0.32, r * 0.14, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)"
    ctx.beginPath()
    ctx.arc(x + r * 0.45, y + r * 0.4, r * 0.08, 0, Math.PI * 2)
    ctx.fill()
}

// Tap the bubbles before they float off the top. Popping in a row builds a combo multiplier;
// letting one escape (or tapping empty water) resets it. Golden bubbles are worth 5.
const bubblePop = {
    title: "Bubble Pop",
    color: "#0a8fca",
    theme: "bubble",
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
                // Deep aqua water, brighter near the surface
                const bg = ctx.createLinearGradient(0, 0, 0, h)
                bg.addColorStop(0, "#14c4e6")
                bg.addColorStop(0.45, "#0a92cd")
                bg.addColorStop(1, "#0a4f99")
                ctx.fillStyle = bg
                ctx.fillRect(0, 0, w, h)

                // light shafts from the surface, fading as they go down
                const t = performance.now() / 1000
                const ray = ctx.createLinearGradient(0, 0, 0, h * 0.85)
                ray.addColorStop(0, "rgba(255, 255, 255, 0.16)")
                ray.addColorStop(1, "rgba(255, 255, 255, 0)")
                ctx.fillStyle = ray
                for (let i = 0; i < 5; i++) {
                    const x = ((i + 0.5) / 5) * w + Math.sin(t * 0.3 + i) * 20 * s
                    const spread = (40 + i * 9) * s
                    ctx.beginPath()
                    ctx.moveTo(x - spread * 0.4, 0)
                    ctx.lineTo(x + spread * 0.4, 0)
                    ctx.lineTo(x + spread * 1.6 + 60 * s, h * 0.85)
                    ctx.lineTo(x - spread * 0.2 + 60 * s, h * 0.85)
                    ctx.fill()
                }

                // background bubbles drifting up
                for (const d of SCENERY) {
                    const y = h + 20 - (((t * d.speed + d.phase) % 1) * (h + 40))
                    const x = d.x * w + Math.sin(t + d.phase * 6) * 8 * s
                    ctx.globalAlpha = 0.55
                    glassBubble(ctx, x, y, d.r * s, false)
                }
                ctx.globalAlpha = 1

                for (const b of bubbles) {
                    glassBubble(ctx, b.x + Math.sin(b.phase) * 6 * s, b.y, b.r, b.gold)
                }

                particles.draw(ctx)
                floaters.draw(ctx, 28 * s, TEXT_STYLE)

                // combo meter, in the channel's yellow lettering
                if (combo >= 5) {
                    ctx.textAlign = "center"
                    ctx.textBaseline = "middle"
                    ctx.font = `700 ${30 * s}px ${FONT}`
                    ctx.lineJoin = "round"
                    ctx.lineWidth = 8 * s
                    ctx.strokeStyle = NAVY
                    ctx.strokeText(`Combo x${multiplier()}`, w / 2, h - 40 * s)
                    ctx.fillStyle = YELLOW
                    ctx.fillText(`Combo x${multiplier()}`, w / 2, h - 40 * s)
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
                        floaters.add(x, b.y, `+${pts}`, b.gold ? YELLOW : "#ffffff")
                        particles.burst(x, b.y, b.gold ? YELLOW : "rgba(255, 255, 255, 0.9)", 10, 220 * s)
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
