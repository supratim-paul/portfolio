import React, { useRef } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';

export default function Tilt({ children, max = 10, glare = true, className = '', ...rest }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const sx = useSpring(rx, { stiffness: 220, damping: 18, mass: 0.6 });
  const sy = useSpring(ry, { stiffness: 220, damping: 18, mass: 0.6 });

  const move = (e) => {
    if (reduce || e.pointerType === 'touch') return;
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * max * 2);
    rx.set(-(py - 0.5) * max * 2);
    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);
  };
  const leave = () => { rx.set(0); ry.set(0); };

  return (
    <motion.div
      ref={ref}
      className={`tilt ${className}`}
      style={{ rotateX: sx, rotateY: sy, transformPerspective: 1000, transformStyle: 'preserve-3d' }}
      onPointerMove={move}
      onPointerLeave={leave}
      {...rest}
    >
      {children}
      {glare && <span className="tilt-glare" aria-hidden="true" />}
    </motion.div>
  );
}
