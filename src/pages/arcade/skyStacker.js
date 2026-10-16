import { PALETTE, clamp, createFloaters, glossyBlock, lerp } from "./draw"

// A block slides back and forth; tap to drop it onto the tower. Whatever hangs over the edge is
// sliced off, so the blocks get narrower. Land three perfect drops in a row and the block grows back.
const skyStacker = {
    title: "Sky Stacker",
    color: "#a98bff",
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
        const colorFor = (i) => PALETTE[i % PALETTE.length]

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
            tower.push({ x: (w - startW) / 2, w: startW, color: "#c8d0d5" })
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
                floaters.add(w / 2, topY(n) - camera - 20 * s, perfectRun >= 3 ? "Perfect! Bigger!" : "Perfect!", "#1e9fcf")
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
                // the sky darkens towards space as the tower climbs
                const height = clamp(tower.length / 60, 0, 1)
                const bg = ctx.createLinearGradient(0, 0, 0, h)
                bg.addColorStop(0, `hsl(${lerp(200, 250, height)}, ${lerp(80, 45, height)}%, ${lerp(84, 18, height)}%)`)
                bg.addColorStop(1, `hsl(${lerp(195, 235, height)}, ${lerp(85, 50, height)}%, ${lerp(94, 30, height)}%)`)
                ctx.fillStyle = bg
                ctx.fillRect(0, 0, w, h)
                if (height > 0.4) {
                    ctx.fillStyle = `rgba(255,255,255,${(height - 0.4) * 1.4})`
                    for (let i = 0; i < 40; i++) {
                        const x = (i * 97.3) % w
                        const y = (((i * 53.7 - camera * 0.1) % h) + h) % h
                        ctx.fillRect(x, y, 2, 2)
                    }
                }

                ctx.save()
                ctx.translate(0, -camera)
                // ground
                ctx.fillStyle = "#7cc576"
                ctx.fillRect(0, baseY, w, h)
                ctx.fillStyle = "rgba(255,255,255,0.25)"
                ctx.fillRect(0, baseY, w, 6 * s)

                const r = 8 * s
                tower.forEach((b, i) => glossyBlock(ctx, b.x, topY(i), b.w, blockH - 2 * s, r, b.color))
                for (const c of chunks) glossyBlock(ctx, c.x, c.y, c.w, blockH - 2 * s, r, c.color)
                if (mover) glossyBlock(ctx, mover.x, topY(tower.length), mover.w, blockH - 2 * s, r, mover.color)
                ctx.restore()

                floaters.draw(ctx, 24 * s)
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
