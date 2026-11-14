# Contact form / email security checklist

The contact form uses EmailJS from the browser, so the service ID, template ID and public key are
public by design. Client-side checks (honeypot, throttle, headless block) only stop lazy bots.
The real controls are in the EmailJS dashboard and DNS:

## EmailJS dashboard (do these first)
1. **Email Templates → template_ipi80jz → Settings → "To Email"**: hardcode your own address.
   No `{{...}}` variables in To / CC / BCC / From Name, and only `{{from_email}}` in Reply-To.
   This is what stops the form being used to mail arbitrary people.
2. **Account → Security → Allowed origins**: `https://morganburke.dev` (+ `https://www.morganburke.dev`
   if used). Stops other websites using your quota from a browser (curl can still fake Origin).
3. **Template → Settings → Enable reCAPTCHA V2**, then add the widget to both forms
   (and add `https://www.google.com https://www.gstatic.com` to the CSP in vite.config.mjs).
4. Optional: rotate the public key after steps 1–2 for a clean slate.

## DNS (wherever morganburke.dev is managed)
- `_dmarc.morganburke.dev TXT "v=DMARC1; p=none; rua=mailto:<your address>"`, then after a week of
  clean reports `p=quarantine`, later `p=reject`.
- Enable DKIM for Zoho (Zoho admin → Domains → Email configuration → DKIM) and publish the record.
- SPF: change `~all` to `-all` once you're sure only Zoho sends as the domain.
- CAA: `morganburke.dev CAA 0 issue "letsencrypt.org"` (GitHub Pages uses Let's Encrypt).

## Already done in code
- EmailJS bundled from npm, pinned (`@emailjs/browser@4.4.1`); no CDN script, no inline script.
- Honeypot field, 60s per-browser throttle, headless-browser block, field length caps.
- Only `from_name`, `from_email`, `message` are ever sent (no recipient field).
- CSP meta tag in production builds; frame-busting guard in `src/main.jsx`.
- `404.html` SPA fallback, `robots.txt`, `sitemap.xml`, `.well-known/security.txt`, `.nojekyll`.
