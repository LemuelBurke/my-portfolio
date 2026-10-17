# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, weighted equally:
- Recruiters and hiring managers, mainly in Australia, checking Morgan's fit for full-time or contract software engineering roles. They need role, experience, skills and availability quickly.
- Curious visitors (developers, peers, people who found the site) exploring for fun, who stay for the craft and personality.

## Product Purpose

Morgan Burke's personal portfolio at morganburke.dev. It presents who Morgan is, his work, projects and CV, and gets visitors to make contact. Success: a recruiter leaves knowing what Morgan does and how to reach him; a curious visitor remembers the site and shares it.

## Positioning

The portfolio is itself the proof of craft: a nostalgic, fully interactive recreation of the Nintendo Wii experience in which each section is its own "channel" with its own world (a walkable Project Street, a CV message board, a Message Me letter, arcade minigames). A neighbouring portfolio could copy facts but not this built experience.

## Operating Context

- Entered through a Wii-style warning screen and channel menu; each channel opens after an intermission and exits back to the menu.
- Channels play their own background music.
- Used on desktop and on phones; mobile must work, not just shrink.
- Contact goes through the Message Me channel (EmailJS) or LinkedIn.

## Capabilities and Constraints

- React 19 + Vite, framer-motion, three.js (3D Mii model), deployed to GitHub Pages via `npm run deploy`.
- Each channel should be distinct and highly crafted; channels should not repeat each other's mechanic (About Me must not become a second Project Street).

## Brand Commitments

- Wii-era Nintendo nostalgia is the site's identity; Morgan's Mii (purple shirt, favourite colour purple) is his avatar across channels.
- Disclaimer: not affiliated with or endorsed by Nintendo; no Nintendo logos or ripped trademark assets presented as official.

## Evidence on Hand

- Real content in `src/pages/about/aboutContent.js`: About (intro, autonomous racing, travel), Work (Cainan freelance, IBM TechXchange 2025 guest speaker, Team Principal Cardiff Autonomous Racing, Tesco, volunteering in Yoichi Japan, NOVOMATIC, Home Bargains), Skills, Tools, Education (Cardiff University First Class BSc, A-Levels, GCSEs), Hobbies.
- Real photos and captioned polaroids in `src/assets/imgs/aboutMePage/`.
- 3D Mii model (`src/pages/components/miiModel.jsx`) and sprite `src/assets/imgs/plaza/mii.webp`.
- CV PDF in `src/assets/`.
- No testimonials or references exist; do not invent any.

## Product Principles

1. The experience is the portfolio: every channel should show craft, not describe it.
2. Facts stay findable: delight never hides what a recruiter came for.
3. Each channel owns one memorable mechanic and does not borrow another channel's.
4. Real content only: real photos, real roles, no invented claims.
