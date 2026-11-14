// Single place the site talks to EmailJS. Bundled from npm (pinned) instead of a floating CDN script.
// NOTE: everything here is client-side and can be bypassed by anyone calling the EmailJS API directly.
// The real protections live in the EmailJS dashboard: a hardcoded "To" address on the template,
// the allowed-origins list, and reCAPTCHA. See SECURITY.md.
import emailjs, { EmailJSResponseStatus } from "@emailjs/browser"

const SERVICE_ID = "service_4345bru"
const TEMPLATE_ID = "template_ipi80jz"
const PUBLIC_KEY = "KnVPYo11bWS3dOlVJ"

export const HONEYPOT_FIELD = "website"
const MAX_LENGTH = { from_name: 100, from_email: 254, message: 5000 }

emailjs.init({
    publicKey: PUBLIC_KEY,
    blockHeadless: true, // refuse to send from headless browsers (puppeteer etc.)
    limitRate: { id: "contact", throttle: 60_000 }, // one message per minute per browser
})

/**
 * Send a contact message. Only these three fields are ever sent, so the request can't
 * carry a recipient or anything else the template might pick up.
 * Throws if the honeypot is filled, a field is too long, or EmailJS rejects it.
 */
export async function sendContactMessage({ from_name, from_email, message, honeypot }) {
    if (honeypot) {
        // bots fill hidden fields; pretend it worked so they don't adapt
        return { status: 200, text: "OK" }
    }
    const params = { from_name, from_email, message }
    for (const [key, value] of Object.entries(params)) {
        if (typeof value !== "string" || !value.trim() || value.length > MAX_LENGTH[key]) {
            throw new Error(`Invalid ${key}`)
        }
    }
    try {
        return await emailjs.send(SERVICE_ID, TEMPLATE_ID, params)
    } catch (err) {
        if (err instanceof EmailJSResponseStatus && err.status === 429) {
            throw new Error("rate-limited")
        }
        throw err
    }
}
