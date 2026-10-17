import { clamp, createFloaters, lerp, roundRect } from "./draw"

// Styled after the channel art: a starry purple night, flat rounded blocks in a rainbow,
// and blocky white lettering with yellow and pink drop layers
const FONT = '"Bungee", system-ui, sans-serif'
const BLOCK_COLORS = ["#34beed", "#ffc93c", "#7cc576", "#b08cff", "#ff9f5a", "#ff5fa2"]
const TEXT_STYLE = {
    family: FONT,
    weight: 400,
    stroke: null,
    layers: [
        { dx: 0.14, dy: 0.14, color: "#ff5fa2" },
        { dx: 0.07, dy: 0.07, color: "#ffc93c" },
    ],
}

// Fixed star field (positions as fractions of the screen), so it doesn't reshuffle on resize
const STARS = Array.from({ length: 110 }, (_, i) => ({
    x: (i * 0.6180339) % 1,
    y: (i * 0.4142135) % 1,
    r: i % 9 === 0 ? 1.8 : i % 3 === 0 ? 1.2 : 0.8,
    twinkle: (i * 1.7) % (Math.PI * 2),
}))

// A flat, rounded block with a soft lighter band along its top, like the blocks in the art
const block = (ctx, x, y, w, h, color) => {
    const r = h * 0.32
    roundRect(ctx, x, y, w, h, r)
    ctx.fillStyle = color
    ctx.fill()
    ctx.save()
    ctx.clip()
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)"
    ctx.fillRect(x, y, w, h * 0.32)
    ctx.fillStyle = "rgba(40, 10, 80, 0.12)"
    ctx.fillRect(x, y + h * 0.78, w, h * 0.22)
    ctx.restore()
}

// A block slides back and forth; tap to drop it onto the tower. Whatever hangs over the edge is
// sliced off, so the blocks get narrower. Land three perfect drops in a row and the block grows back.
const skyStacker = {
    title: "Sky Stacker",
    color: "#6b40a6",
    theme: "sky",
    howTo: "Tap (or press Space) to drop the sliding block. Anything hanging over the edge gets chopped off. Line it up perfectly to keep it wide!",
    create({ setScore, setInfo, end, sfx }) {
        let w = 0
        let h = 0
        let s = 1
        let blockH = 30
        let baseY = 0
        let camera = 0
        let over = false
        let overIn = -1
        let perfectRun = 0
        const tower = [] // { x, w, color }
        const chunks = [] // sliced-off pieces falling away
        let mover = null
        const floaters = createFloaters()

        const topY = (i) => baseY - (i + 1) * blockH
        const colorFor = (i) => BLOCK_COLORS[(i - 1 + BLOCK_COLORS.length) % BLOCK_COLORS.length]

        const nextMover = () => {
            const top = tower[tower.length - 1]
            const n = tower.length
            const fromLeft = n % 2 === 0
            mover = {
                // start fully on screen at an edge, so an early tap still has a chance to land
                x: fromLeft ? 0 : w - top.w,
                w: top.w,
                dir: fromLeft ? 1 : -1,
                speed: Math.min(170 + n * 9, 520) * s,
                color: colorFor(n),
            }
        }

        const setup = () => {
            blockH = 30 * s
            baseY = h - 70 * s
            const startW = Math.min(w * 0.55, 300 * s)
            tower.length = 0
            tower.push({ x: (w - startW) / 2, w: startW, color: "#ece6ff" })
            nextMover()
        }

        const drop = () => {
            if (over || !mover) return
            const top = tower[tower.length - 1]
            const n = tower.length
            const left = Math.max(mover.x, top.x)
            const right = Math.min(mover.x + mover.w, top.x + top.w)
            const overlap = right - left

            if (overlap <= 0) {
                chunks.push({ x: mover.x, y: topY(n), w: mover.w, vy: 0, color: mover.color })
                mover = null
                over = true
                overIn = 0.9
                sfx(160, 0.3, "triangle")
                setInfo("Missed!")
                return
            }

            let block
            if (Math.abs(mover.x - top.x) <= 5 * s) {
                // perfect: snap into place, and grow back a little after a streak
                perfectRun += 1
                const grow = perfectRun >= 3 ? Math.min(14 * s, w * 0.6 - top.w) : 0
                block = { x: top.x - Math.max(0, grow) / 2, w: top.w + Math.max(0, grow), color: mover.color }
                floaters.add(w / 2, topY(n) - camera - 20 * s, perfectRun >= 3 ? "Perfect! Bigger!" : "Perfect!", "#ffffff")
                sfx(660 + perfectRun * 60, 0.12)
            } else {
                perfectRun = 0
                block = { x: left, w: overlap, color: mover.color }
                const cutX = mover.x < top.x ? mover.x : right
                chunks.push({ x: cutX, y: topY(n), w: mover.w - overlap, vy: 0, color: mover.color })
                sfx(420, 0.07)
            }
            tower.push(block)
            setScore(tower.length - 1)
            nextMover()
        }

        return {
            resize(nw, nh) {
                const first = w === 0
                w = nw
                h = nh
                s = Math.max(0.8, Math.min(w, h) / 600) // never too small for fingers on phones
                if (first) setup()
                else baseY = h - 70 * s
            },

            update(dt) {
                if (overIn > 0) {
                    overIn -= dt
                    if (overIn <= 0) end(tower.length - 1)
                }
                if (mover) {
                    mover.x += mover.dir * mover.speed * dt
                    const min = 0
                    const max = w - mover.w
                    if (mover.x > max) { mover.x = max; mover.dir = -1 }
                    if (mover.x < min) { mover.x = min; mover.dir = 1 }
                }
                for (let i = chunks.length - 1; i >= 0; i--) {
                    const c = chunks[i]
                    c.vy += 900 * s * dt
                    c.y += c.vy * dt
                    if (c.y - camera > h + 200) chunks.splice(i, 1)
                }
                // once the tower is tall, follow it so the top stays about a third of the way down
                const want = Math.min(0, topY(tower.length) - h * 0.35)
                camera = lerp(camera, want, Math.min(1, dt * 4))
                floaters.update(dt)
            },

            draw(ctx) {
                // Night sky: dusky purple at first, deepening towards space as the tower climbs
                const height = clamp(tower.length / 50, 0, 1)
                const bg = ctx.createLinearGradient(0, 0, 0, h)
                bg.addColorStop(0, `hsl(${lerp(250, 245, height)}, ${lerp(55, 60, height)}%, ${lerp(20, 8, height)}%)`)
                bg.addColorStop(1, `hsl(${lerp(272, 255, height)}, ${lerp(45, 50, height)}%, ${lerp(45, 22, height)}%)`)
                ctx.fillStyle = bg
                ctx.fillRect(0, 0, w, h)

                // twinkling stars, drifting down slowly as the camera rises; more show up higher
                const t = performance.now() / 1000
                const shown = Math.round(STARS.length * lerp(0.55, 1, height))
                ctx.fillStyle = "#ffffff"
                for (let i = 0; i < shown; i++) {
                    const star = STARS[i]
                    const y = ((((star.y * h - camera * 0.15) % h) + h) % h)
                    ctx.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(t * 1.3 + star.twinkle))
                    ctx.beginPath()
                    ctx.arc(star.x * w, y, star.r * s, 0, Math.PI * 2)
                    ctx.fill()
                }
                ctx.globalAlpha = 1

                ctx.save()
                ctx.translate(0, -camera)
                // ground: a soft violet rise with a lilac rim
                const ground = ctx.createLinearGradient(0, baseY, 0, baseY + 120 * s)
                ground.addColorStop(0, "#3a2678")
                ground.addColorStop(1, "#1d1450")
                ctx.fillStyle = ground
                ctx.fillRect(0, baseY, w, h + 200 * s)
                ctx.fillStyle = "rgba(200, 175, 255, 0.45)"
                ctx.fillRect(0, baseY, w, 3 * s)

                const bh = blockH - 3 * s
                tower.forEach((b, i) => block(ctx, b.x, topY(i), b.w, bh, b.color))
                for (const c of chunks) block(ctx, c.x, c.y, c.w, bh, c.color)
                if (mover) block(ctx, mover.x, topY(tower.length), mover.w, bh, mover.color)
                ctx.restore()

                floaters.draw(ctx, 24 * s, TEXT_STYLE)
            },

            pointerDown() {
                drop()
            },

            keyDown(key) {
                if (key === " " || key === "Enter" || key === "ArrowDown") {
                    drop()
                    return true
                }
                return false
            },
        }
    },
}

export default skyStacker
