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

// World layout. Camera flies between these bodies when the route changes.
export const BODIES = {
  terra: { pos: [16, -2, 0], r: 9 },
  ember: { pos: [-170, 20, -230], r: 11 },
  giant: { pos: [130, -6, -720], r: 15 },
  sun: { pos: [-60, 10, -1100], r: 22 }
};

const frame = (b, dist, shift = 0.34, rise = 3) => ({
  dist, shift, rise, body: b
});

export const SECTORS = {
  home: {
    n: '01', name: 'Terra', desc: 'Low orbit', travel: 6,
    f: frame(BODIES.terra, 36, 0.4),
    pal: ['#17267a', '#5436c8', '#3fb7ff', 0.9]
  },
  about: {
    n: '02', name: 'Ember', desc: 'Dust-storm world', travel: 6,
    f: frame(BODIES.ember, 34, 0.4),
    pal: ['#5a1a3a', '#a8352c', '#ff9a5a', 0.85]
  },
  projects: {
    n: '03', name: 'The Belt', desc: 'Debris field', travel: 150,
    fixed: { cam: [50, 0, -340], look: [50, 0, -430] },
    pal: ['#0b4552', '#2a3fa8', '#6fe3ff', 0.9]
  },
  experience: {
    n: '04', name: 'Aurelia', desc: 'Ringed giant', travel: 8,
    f: frame(BODIES.giant, 52),
    pal: ['#25268a', '#7a3fd0', '#ff7ad9', 0.9]
  },
  contact: {
    n: '05', name: 'Helion', desc: 'Home star', travel: 4,
    f: frame(BODIES.sun, 170, 0.36, 0),
    pal: ['#6b2a0c', '#a23a1f', '#ffc067', 0.95]
  }
};

export function sectorTarget(key, portrait) {
  const s = SECTORS[key];
  if (s.fixed) return { cam: s.fixed.cam, look: s.fixed.look };
  const { body, dist, shift, rise } = s.f;
  const p = body.pos;
  const d = portrait ? dist * 1.18 : dist;
  const sh = portrait ? 0 : shift;
  const camX = p[0] - dist * sh;
  const lookDrop = portrait ? d * 0.13 : 0;
  return {
    cam: [camX, p[1] + rise, p[2] + d],
    look: [camX, p[1] + rise * 0.3 - lookDrop, p[2]]
  };
}
