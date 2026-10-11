// Shared state between the router/UI and the WebGL scene.
export const bus = {
  sector: 'home',
  mouse: { x: 0, y: 0 },
  scroll: 0,
  warp: 0,
  introduced: false,
  subs: new Set()
};

export const subscribe = (fn) => { bus.subs.add(fn); return () => bus.subs.delete(fn); };
const emit = (e) => bus.subs.forEach((f) => f(e));

export function setSector(key) {
  if (bus.sector === key) return;
  bus.sector = key;
  emit({ type: 'sector', key });
}
export function introduce() {
  bus.introduced = true;
  emit({ type: 'intro' });
}

export const sectorFor = (pathname) => {
  if (pathname.startsWith('/about')) return 'about';
  if (pathname.startsWith('/projects')) return 'projects';
  if (pathname.startsWith('/experience')) return 'experience';
  if (pathname.startsWith('/contact')) return 'contact';
  return 'home';
};

// World layout. Camera flies between these black holes when the route changes.
// r = half-size of the billboard that draws the hole + accretion disk.
export const BODIES = {
  home: { pos: [16, -2, 0], r: 26 },
  about: { pos: [-170, 20, -230], r: 24 },
  experience: { pos: [130, -6, -720], r: 30 },
  contact: { pos: [-60, 10, -1100], r: 34 }
};

const frame = (b, dist, shift = 0.34, rise = 3) => ({
  dist, shift, rise, body: b
});

export const SECTORS = {
  home: {
    n: '01', name: 'Singularity', desc: 'Event horizon', travel: 6,
    f: frame(BODIES.home, 100, 0.4),
    pal: ['#101a5c', '#3a2a9a', '#2f8fd0', 0.7]
  },
  about: {
    n: '02', name: 'Cinder', desc: 'Dying accretion disk', travel: 6,
    f: frame(BODIES.about, 96, 0.4),
    pal: ['#4a1530', '#8a2a2a', '#d8783a', 0.65]
  },
  projects: {
    n: '03', name: 'Starfield', desc: 'Open star cluster', travel: 150,
    fixed: { cam: [50, 0, -340], look: [50, 0, -430] },
    pal: ['#0a3440', '#1f2f80', '#4fb8d8', 0.6]
  },
  experience: {
    n: '04', name: 'Quasar', desc: 'Active galactic core', travel: 8,
    f: frame(BODIES.experience, 120),
    pal: ['#1e1f70', '#6a2fb0', '#d85ab8', 0.7]
  },
  contact: {
    n: '05', name: 'Omega', desc: 'Last light', travel: 4,
    f: frame(BODIES.contact, 136, 0.36, 0),
    pal: ['#4a2008', '#8a3418', '#e8a850', 0.7]
  }
};

export function sectorTarget(key, portrait) {
  const s = SECTORS[key];
  if (s.fixed) return { cam: s.fixed.cam, look: s.fixed.look };
  const { body, dist, shift, rise } = s.f;
  const p = body.pos;
  const d = portrait ? dist * 1.25 : dist;
  const sh = portrait ? 0 : shift;
  const camX = p[0] - dist * sh;
  const lookDrop = portrait ? d * 0.13 : 0;
  return {
    cam: [camX, p[1] + rise, p[2] + d],
    look: [camX, p[1] + rise * 0.3 - lookDrop, p[2]]
  };
}
