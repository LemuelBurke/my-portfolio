// Small canvas helpers shared by the arcade games

export const roundRect = (ctx, x, y, w, h, r) => {
    const rr = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + rr, y)
    ctx.arcTo(x + w, y, x + w, y + h, rr)
    ctx.arcTo(x + w, y + h, x, y + h, rr)
    ctx.arcTo(x, y + h, x, y, rr)
    ctx.arcTo(x, y, x + w, y, rr)
    ctx.closePath()
}

// A glossy Wii-style rounded block: base colour, soft top highlight and a darker bottom edge
export const glossyBlock = (ctx, x, y, w, h, r, color) => {
    roundRect(ctx, x, y, w, h, r)
    ctx.fillStyle = color
    ctx.fill()
    const g = ctx.createLinearGradient(0, y, 0, y + h)
    g.addColorStop(0, "rgba(255,255,255,0.55)")
    g.addColorStop(0.45, "rgba(255,255,255,0.05)")
    g.addColorStop(1, "rgba(0,0,0,0.12)")
    ctx.fillStyle = g
    ctx.fill()
}

export const lerp = (a, b, t) => a + (b - a) * t
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
export const rand = (min, max) => min + Math.random() * (max - min)

// Bright, friendly colours that sit well on the Wii's white and sky blue
export const PALETTE = ["#34beed", "#ff7fb0", "#ffc93c", "#7cc576", "#a98bff", "#ff9a5c"]

// Little "+3" style numbers that float up and fade where points were scored
export const createFloaters = () => {
    const list = []
    return {
        add(x, y, text, color = "#3c4247") {
            list.push({ x, y, text, color, life: 0.8 })
        },
        update(dt) {
            for (let i = list.length - 1; i >= 0; i--) {
                const f = list[i]
                f.life -= dt
                f.y -= 50 * dt
                if (f.life <= 0) list.splice(i, 1)
            }
        },
        // style (optional): family, weight, stroke (outline colour, or null for none), and layers,
        // offset copies drawn underneath ([{ dx, dy, color }] in multiples of the text size)
        draw(ctx, size, style = {}) {
            const { family = 'system-ui, -apple-system, "Segoe UI", sans-serif', weight = 800, stroke = "#fff", layers = [] } = style
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.font = `${weight} ${size}px ${family}`
            ctx.lineJoin = "round"
            for (const f of list) {
                ctx.globalAlpha = Math.min(1, f.life / 0.4)
                for (const layer of layers) {
                    ctx.fillStyle = layer.color
                    ctx.fillText(f.text, f.x + layer.dx * size, f.y + layer.dy * size)
                }
                if (stroke) {
                    ctx.lineWidth = size * 0.18
                    ctx.strokeStyle = stroke
                    ctx.strokeText(f.text, f.x, f.y)
                }
                ctx.fillStyle = f.color
                ctx.fillText(f.text, f.x, f.y)
            }
            ctx.globalAlpha = 1
        },
    }
}

// Bursts of small dots, for pops and catches
export const createParticles = () => {
    const list = []
    return {
        burst(x, y, color, count, speed) {
            for (let i = 0; i < count; i++) {
                const a = Math.random() * Math.PI * 2
                const v = speed * (0.4 + Math.random() * 0.6)
                list.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5, color, r: speed * 0.03 * (0.6 + Math.random()) })
            }
        },
        update(dt) {
            for (let i = list.length - 1; i >= 0; i--) {
                const p = list[i]
                p.life -= dt
                p.x += p.vx * dt
                p.y += p.vy * dt
                p.vy += 300 * dt
                if (p.life <= 0) list.splice(i, 1)
            }
        },
        draw(ctx) {
            for (const p of list) {
                ctx.globalAlpha = Math.max(0, p.life / 0.5)
                ctx.fillStyle = p.color
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
                ctx.fill()
            }
            ctx.globalAlpha = 1
        },
    }
}
