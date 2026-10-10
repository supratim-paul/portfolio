import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const STEPS = ['Calibrating star charts', 'Compiling shaders', 'Igniting engines', 'Clear for launch'];

export default function Loader({ onDone }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let n = 0;
    const id = setInterval(() => {
      n += 3 + Math.random() * 9;
      setP(Math.min(100, Math.round(n)));
      if (n >= 100) { clearInterval(id); setTimeout(onDone, 350); }
    }, 55);
    return () => clearInterval(id);
  }, [onDone]);
  const step = STEPS[Math.min(STEPS.length - 1, Math.floor(p / 26))];
  return (
    <motion.div className="loader" exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
      <div className="loader-name">Supratim Paul<span>.</span></div>
      <div className="loader-step">{step}</div>
      <div className="loader-bar"><i style={{ width: `${p}%` }} /></div>
      <div className="loader-pct">{String(p).padStart(3, '0')}</div>
    </motion.div>
  );
}
