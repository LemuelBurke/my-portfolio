import { clamp, createFloaters, createParticles, glossyBlock, rand } from "./draw"

const LIVES = 3

// Slide the tray to catch the discs as they fall. Golden discs are worth 5.
// Drop three and it's game over; the discs come faster the longer you last.
const discCatch = {
    title: "Disc Catch",
    color: "#7cc576",
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
                        floaters.add(d.x, tray.y - 30 * s, `+${pts}`, d.gold ? "#f0a500" : "#1e9fcf")
                        particles.burst(d.x, tray.y - 6 * s, d.gold ? "#ffc93c" : "#34beed", 8, 180 * s)
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
                // Wii-menu white with soft pinstripes
                ctx.fillStyle = "#f4f7f8"
                ctx.fillRect(0, 0, w, h)
                ctx.fillStyle = "#e8eef1"
                for (let y = 0; y < h; y += 8 * s) ctx.fillRect(0, y, w, 3 * s)

                for (const d of discs) {
                    ctx.save()
                    ctx.translate(d.x, d.y)
                    ctx.rotate(d.spin)
                    const g = ctx.createLinearGradient(-d.r, -d.r, d.r, d.r)
                    if (d.gold) {
                        g.addColorStop(0, "#fff3c4")
                        g.addColorStop(0.5, "#ffc93c")
                        g.addColorStop(1, "#e09a1a")
                    } else {
                        g.addColorStop(0, "#ffffff")
                        g.addColorStop(0.45, "#d7e3ea")
                        g.addColorStop(0.55, "#bfe9fa")
                        g.addColorStop(1, "#c9d3d9")
                    }
                    ctx.fillStyle = g
                    ctx.beginPath()
                    ctx.arc(0, 0, d.r, 0, Math.PI * 2)
                    ctx.fill()
                    ctx.strokeStyle = d.gold ? "#e09a1a" : "#34beed"
                    ctx.lineWidth = 2.5 * s
                    ctx.stroke()
                    ctx.fillStyle = "#f4f7f8"
                    ctx.beginPath()
                    ctx.arc(0, 0, d.r * 0.22, 0, Math.PI * 2)
                    ctx.fill()
                    ctx.restore()
                }

                // the tray: a white Wii-style pill with a cyan rim
                const tw = tray.w
                glossyBlock(ctx, tray.x - tw / 2, tray.y, tw, 18 * s, 9 * s, "#ffffff")
                ctx.strokeStyle = "#34beed"
                ctx.lineWidth = 3 * s
                ctx.stroke()

                particles.draw(ctx)
                floaters.draw(ctx, 24 * s)

                if (flash > 0) {
                    ctx.fillStyle = `rgba(255, 80, 80, ${flash * 0.5})`
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
