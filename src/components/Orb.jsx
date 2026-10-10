import React from 'react';

// CSS planet: kind = terra | ember | belt | giant | sun | green | blue | orange | violet
export default function Orb({ kind = 'terra', size = 80, ring = false, hot = false, className = '' }) {
  return (
    <span className={`orb-wrap ${kind} ${hot ? 'hot' : ''} ${className}`} style={{ '--s': `${size}px` }} aria-hidden="true">
      {ring && <i className="orb-ring back" />}
      <i className="orb" />
      {ring && <i className="orb-ring front" />}
    </span>
  );
}
