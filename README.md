# Supratim Paul — Black Hole Portfolio (v2)

React + Vite + Three.js + Framer Motion + React Router.

## Run
```powershell
npm install
npm run dev
```
Build: `npm run build` · Preview: `npm run preview`

## Structure
- `src/space/` — persistent WebGL scene (stars, star cluster, faint nebula, four black holes with lensed accretion disks, hyperspace streaks). The camera flies to a new "sector" on every route change.
- `src/pages/` — Home, About, Projects (scroll timeline), Experience, Contact.
- `src/components/` — Tilt (3D hover), Magnetic buttons, Cursor, Loader, HUD, Nav.
- `src/data.js` — all content. Replace each project `link` with the real repo URL.

## Deploy
Netlify: `netlify.toml` (build `npm run build`, publish `dist`, SPA redirect) plus `public/_redirects`.

Reduced-motion preference is respected (no flights, no streaks, slower time).
