import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Content Security Policy for the production build only (the dev server needs inline scripts for HMR).
// GitHub Pages can't send response headers, so this goes in a <meta> tag. frame-ancestors is ignored
// in <meta>, so clickjacking is handled by the frame check in src/main.jsx instead.
// style-src needs 'unsafe-inline' because framer-motion injects <style> elements at runtime.
const CSP = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://img.shields.io",
    "font-src 'self' data:",
    "media-src 'self' blob:",
    "connect-src 'self' blob: data: https://api.emailjs.com https://api.open-meteo.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
].join('; ')

const securityHeaders = {
    name: 'security-meta',
    apply: 'build',
    transformIndexHtml() {
        return [
            { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
            { tag: 'meta', attrs: { name: 'referrer', content: 'strict-origin-when-cross-origin' }, injectTo: 'head' },
        ]
    },
    // GitHub Pages serves 404.html for unknown paths; make it the app instead of GitHub's stock page
    closeBundle() {
        const dist = resolve(import.meta.dirname, 'dist')
        copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'))
    },
}

export default defineConfig({
    plugins: [react(), securityHeaders],
})
