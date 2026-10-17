import { clamp, createFloaters, createParticles, rand, roundRect } from "./draw"

const LIVES = 3

// Styled after the channel art: a dark stage, shiny silver discs with cyan rims, a glowing
// catcher bar and rounded lettering
const FONT = '"Comfortaa", system-ui, sans-serif'
const STAGE = "#1c1f23"
const CYAN = "#34beed"
const TEXT_STYLE = { family: FONT, weight: 700, stroke: STAGE }

// A silver (or gold) disc: brushed metal with a rainbow sheen that turns as it spins, a cyan
// rim, a clear hub ring and a hole in the middle
const disc = (ctx, x, y, r, spin, gold) => {
    ctx.save()
    ctx.translate(x, y)
    const metal = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r)
    metal.addColorStop(0, gold ? "#fff4cc" : "#f4f8fa")
    metal.addColorStop(0.6, gold ? "#f2c24a" : "#c9d6de")
    metal.addColorStop(1, gold ? "#c98b12" : "#9fb0bb")
    ctx.fillStyle = metal
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fill()

    if (ctx.createConicGradient) {
        const sheen = ctx.createConicGradient(spin, 0, 0)
        sheen.addColorStop(0, "rgba(255, 255, 255, 0.55)")
        sheen.addColorStop(0.12, "rgba(140, 220, 255, 0.35)")
        sheen.addColorStop(0.25, "rgba(255, 255, 255, 0)")
        sheen.addColorStop(0.5, "rgba(255, 255, 255, 0.5)")
        sheen.addColorStop(0.62, "rgba(190, 160, 255, 0.3)")
        sheen.addColorStop(0.75, "rgba(255, 255, 255, 0)")
        sheen.addColorStop(1, "rgba(255, 255, 255, 0.55)")
        ctx.fillStyle = sheen
        ctx.fill()
    }

    ctx.lineWidth = Math.max(2, r * 0.11)
    ctx.strokeStyle = gold ? "#ffd95a" : "#8fdcf7"
    ctx.stroke()
    // hub ring and hole
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)"
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = STAGE
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
}

// Slide the tray to catch the discs as they fall. Golden discs are worth 5.
// Drop three and it's game over; the discs come faster the longer you last.
const discCatch = {
    title: "Disc Catch",
    color: "#2a2f35",
    theme: "disc",
    howTo: "Move your finger or mouse (or use the arrow keys) to slide the tray and catch the falling discs. Miss three and it's game over!",
    create({ setScore, setInfo, end, sfx }) {
        let w = 0
        let h = 0
        let s = 1
        let elapsed = 0
        let score = 0
        let lives = LIVES
        let spawnIn = 0.6
        let over = false
        let flash = 0
        const keys = new Set()
        const tray = { x: 0, target: 0, w: 120, y: 0 }
        const discs = []
        const floaters = createFloaters()
        const particles = createParticles()

        const showLives = () => setInfo("♥".repeat(lives) + "♡".repeat(LIVES - lives))
        showLives()

        return {
            resize(nw, nh) {
                const first = w === 0
                w = nw
                h = nh
                s = Math.max(0.8, Math.min(w, h) / 600) // never too small for fingers on phones
                tray.w = 130 * s
                tray.y = h - 60 * s
                if (first) tray.x = tray.target = w / 2
                tray.target = clamp(tray.target, tray.w / 2, w - tray.w / 2)
            },

            update(dt) {
                if (over) return
                elapsed += dt
                flash = Math.max(0, flash - dt)

                const move = (keys.has("ArrowRight") || keys.has("d") ? 1 : 0) - (keys.has("ArrowLeft") || keys.has("a") ? 1 : 0)
                if (move) tray.target = clamp(tray.target + move * 700 * s * dt, tray.w / 2, w - tray.w / 2)
                tray.x += (tray.target - tray.x) * Math.min(1, dt * 18)

                spawnIn -= dt
                if (spawnIn <= 0) {
                    spawnIn = Math.max(0.35, 1.1 - elapsed * 0.02) * rand(0.7, 1.2)
                    const r = 20 * s
                    discs.push({
                        x: rand(r, w - r),
                        y: -r,
                        r,
                        vy: (150 + elapsed * 5) * s * rand(0.85, 1.15),
                        vx: rand(-30, 30) * s,
                        spin: rand(0, Math.PI * 2),
                        gold: Math.random() < 0.08,
                    })
                }

                for (let i = discs.length - 1; i >= 0; i--) {
                    const d = discs[i]
                    d.y += d.vy * dt
                    d.x = clamp(d.x + d.vx * dt, d.r, w - d.r)
                    d.spin += dt * 4

                    const onTray = d.y + d.r >= tray.y - 4 * s && d.y - d.r <= tray.y + 14 * s
                    if (onTray && Math.abs(d.x - tray.x) <= tray.w / 2 + d.r * 0.4) {
                        discs.splice(i, 1)
                        const pts = d.gold ? 5 : 1
                        score += pts
                        setScore(score)
                        floaters.add(d.x, tray.y - 30 * s, `+${pts}`, d.gold ? "#ffd95a" : "#e6f7ff")
                        particles.burst(d.x, tray.y - 6 * s, d.gold ? "#ffd95a" : CYAN, 8, 180 * s)
                        sfx(d.gold ? 900 : 600, 0.08)
                        continue
                    }
                    if (d.y - d.r > h) {
                        discs.splice(i, 1)
                        lives -= 1
                        flash = 0.35
                        showLives()
                        sfx(180, 0.25, "triangle")
                        if (lives <= 0) {
                            over = true
                            end(score)
                            return
                        }
                    }
                }
                particles.update(dt)
                floaters.update(dt)
            },

            draw(ctx) {
                // Dark stage, a touch lighter at the top
                const bg = ctx.createLinearGradient(0, 0, 0, h)
                bg.addColorStop(0, "#23272c")
                bg.addColorStop(1, STAGE)
                ctx.fillStyle = bg
                ctx.fillRect(0, 0, w, h)

                // a cyan floor glow that follows the catcher
                const glow = ctx.createRadialGradient(tray.x, h + 20 * s, 0, tray.x, h + 20 * s, Math.max(w, h) * 0.55)
                glow.addColorStop(0, "rgba(52, 190, 237, 0.32)")
                glow.addColorStop(0.45, "rgba(52, 190, 237, 0.1)")
                glow.addColorStop(1, "rgba(52, 190, 237, 0)")
                ctx.fillStyle = glow
                ctx.fillRect(0, 0, w, h)

                for (const d of discs) disc(ctx, d.x, d.y, d.r, d.spin, d.gold)

                // the catcher: a glowing white bar with a cyan rim
                const tw = tray.w
                const th = 16 * s
                ctx.save()
                ctx.shadowColor = "rgba(52, 190, 237, 0.85)"
                ctx.shadowBlur = 22 * s
                roundRect(ctx, tray.x - tw / 2, tray.y, tw, th, th / 2)
                const bar = ctx.createLinearGradient(0, tray.y, 0, tray.y + th)
                bar.addColorStop(0, "#ffffff")
                bar.addColorStop(1, "#d6f3ff")
                ctx.fillStyle = bar
                ctx.fill()
                ctx.restore()
                ctx.lineWidth = 3 * s
                ctx.strokeStyle = CYAN
                ctx.stroke()

                particles.draw(ctx)
                floaters.draw(ctx, 24 * s, TEXT_STYLE)

                if (flash > 0) {
                    ctx.fillStyle = `rgba(255, 80, 80, ${flash * 0.45})`
                    ctx.fillRect(0, 0, w, h)
                }
            },

            pointerDown(x) {
                tray.target = clamp(x, tray.w / 2, w - tray.w / 2)
            },

            pointerMove(x) {
                tray.target = clamp(x, tray.w / 2, w - tray.w / 2)
            },

            keyDown(key) {
                if (["ArrowLeft", "ArrowRight", "a", "d"].includes(key)) {
                    keys.add(key)
                    return true
                }
                return false
            },

            keyUp(key) {
                keys.delete(key)
            },
        }
    },
}

export default discCatch
