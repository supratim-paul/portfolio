# Supratim Paul — Space Portfolio (v2)

React + Vite + Three.js + Framer Motion + React Router.

## Run
```powershell
npm install
npm run dev
```
Build: `npm run build` · Preview: `npm run preview`

## Structure
- `src/space/` — persistent WebGL scene (nebula, stars, procedural planets, ringed giant, sun, asteroid belt, hyperspace streaks). The camera flies to a new "sector" on every route change.
- `src/pages/` — Home, About, Projects (scroll timeline), Experience, Contact.
- `src/components/` — Tilt (3D hover), Magnetic buttons, Cursor, Loader, HUD, Nav.
- `src/data.js` — all content. Replace each project `link` with the real repo URL.

## Deploy
Vercel: `vercel.json` handles SPA rewrites. Netlify: `public/_redirects` is included.

Reduced-motion preference is respected (no flights, no streaks, slower time).
