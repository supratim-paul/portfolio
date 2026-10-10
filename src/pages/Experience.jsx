import React, { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Code2, Database, Globe, Server } from 'lucide-react';
import Tilt from '../components/Tilt.jsx';
import Reveal from '../components/Reveal.jsx';
import { journey, orbitSkills, skills } from '../data.js';

const icons = { code: Code2, server: Server, db: Database, globe: Globe };

export default function Experience() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] });
  const prog = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });
  return (
    <>
      <section className="page-head">
        <Reveal><p className="tag">Experience</p></Reveal>
        <Reveal delay={0.05}><h1 className="h1">Contribute.<br />Improve.</h1></Reveal>
      </section>

      <section className="rail" ref={ref}>
        <div className="rail-line" aria-hidden="true"><motion.i style={{ scaleY: prog }} /></div>
        {journey.map((j, i) => (
          <Reveal key={j.title} delay={i * 0.06} className="rail-item">
            <span className="rail-dot" aria-hidden="true" />
            <div className="rail-when">{j.when}</div>
            <Tilt max={6} className="card rail-card">
              <h3 className="z2">{j.title} <span>· {j.org}</span></h3>
              <p className="rail-place z1">{j.place}</p>
              {j.points.length > 0 && <ul className="z1">{j.points.map((p) => <li key={p}>{p}</li>)}</ul>}
            </Tilt>
          </Reveal>
        ))}
      </section>

      <section className="block">
        <Reveal><h2 className="h2">Tools of the trade</h2></Reveal>
        <div className="orbit" aria-hidden="true">
          <div className="orbit-ring">
            {orbitSkills.map((s, i) => <span key={s} style={{ '--i': i, '--n': orbitSkills.length }}>{s}</span>)}
          </div>
        </div>
        <div className="skill-grid">
          {skills.map((s, i) => {
            const Icon = icons[s.icon];
            return (
              <Reveal key={s.title} delay={i * 0.07}>
                <Tilt max={9} className="card skill">
                  <div className="skill-head z2"><Icon size={18} /><b>{s.title}</b></div>
                  <ul className="chips z1">{s.items.map((t) => <li key={t}>{t}</li>)}</ul>
                </Tilt>
              </Reveal>
            );
          })}
        </div>
      </section>
    </>
  );
}
