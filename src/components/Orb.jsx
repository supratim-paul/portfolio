import React from 'react';

// CSS black hole: kind = terra | ember | belt | giant | sun | green | blue | orange | violet
export default function Orb({ kind = 'terra', size = 80, hot = false, className = '' }) {
  return (
    <span className={`orb-wrap ${kind} ${hot ? 'hot' : ''} ${className}`} style={{ '--s': `${size}px` }} aria-hidden="true">
      <i className="bh-halo" />
      <i className="bh-disk back" />
      <i className="bh-core" />
      <i className="bh-disk front" />
    </span>
  );
}
