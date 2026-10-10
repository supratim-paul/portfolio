import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { bus, SECTORS, sectorFor } from '../space/bus.js';

export default function HUD() {
  const { pathname } = useLocation();
  const [v, setV] = useState({ warp: 0, scroll: 0 });
  useEffect(() => {
    const id = setInterval(() => setV({ warp: bus.warp, scroll: bus.scroll }), 100);
    return () => clearInterval(id);
  }, []);
  const s = SECTORS[sectorFor(pathname)];
  const vel = (7.8 + v.warp * 292).toFixed(1);
  return (
    <>
      <aside className="hud hud-left" aria-hidden="true">
        <span className={`hud-dot ${v.warp > 0.05 ? 'moving' : ''}`} />
        <span>Sector {s.n} · {s.name}</span>
        <span className="hud-sub">{s.desc}</span>
      </aside>
      <aside className="hud hud-right" aria-hidden="true">
        <span>{v.warp > 0.05 ? 'In transit' : 'Holding'}</span>
        <span className="hud-sub">{vel} km/s</span>
      </aside>
      <div className="altitude" aria-hidden="true">
        <i style={{ transform: `translateY(${v.scroll * 100}%)` }} />
      </div>
    </>
  );
}
