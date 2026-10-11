import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowUpRight, ExternalLink, Github } from 'lucide-react';
import Tilt from '../components/Tilt.jsx';
import Orb from '../components/Orb.jsx';
import Reveal from '../components/Reveal.jsx';
import { P, projects } from '../data.js';

const kinds = { green: 'green', blue: 'blue', orange: 'orange', violet: 'violet' };

function Item({ p, i }) {
  const side = i % 2 === 0 ? -1 : 1; // -1 = card on the left
  const [hot, setHot] = useState(false);
  return (
    <div className={`tl-item ${side < 0 ? 'left' : 'right'}`}>
      <div className="tl-meta">
        <span className="tl-count">Mission {String(i + 1).padStart(2, '0')}</span>
        <span className="tl-cat">{p.category}</span>
      </div>

      <motion.div
        className="tl-node"
        initial={{ scale: 0.55, opacity: 0.4 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ margin: '-45% 0px -45% 0px' }}
        transition={{ type: 'spring', stiffness: 160, damping: 14 }}
      >
        <Orb kind={kinds[p.cls]} size={78} hot={hot} />
      </motion.div>

      <motion.div
        className="tl-card-wrap"
        style={{ transformPerspective: 1300 }}
        initial={{ opacity: 0, x: side * 70, rotateY: side * -26 }}
        whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <Tilt max={8} className="card tl-card" onHoverStart={() => setHot(true)} onHoverEnd={() => setHot(false)}>
          <span className="tl-mark" aria-hidden="true">{p.mark}</span>
          <p className="tl-inline-meta z1">Mission {String(i + 1).padStart(2, '0')} · {p.category}</p>
          <h3 className="z3">{p.title}</h3>
          <p className="tl-text z1">{p.text}</p>
          <ul className="chips z2">{p.stack.map((s) => <li key={s}>{s}</li>)}</ul>
          <div className="tl-actions z2">
            <a href={p.link} target="_blank" rel="noreferrer"><Github size={14} /> GitHub <ArrowUpRight size={12} /></a>
            {p.live && <a href={p.live} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Live demo <ArrowUpRight size={12} /></a>}
          </div>
        </Tilt>
      </motion.div>
    </div>
  );
}

export default function Projects() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 65%', 'end 55%'] });
  const prog = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });
  const head = useTransform(prog, (v) => `${v * 100}%`);

  return (
    <>
      <section className="page-head">
        <Reveal><p className="tag">Projects</p></Reveal>
        <Reveal delay={0.05}><h1 className="h1">Missions flown.</h1></Reveal>
        <Reveal delay={0.1}><p className="sub">Experiments and end-to-end builds where engineering meets practical use. Scroll to fly through the field.</p></Reveal>
      </section>

      <section className="timeline" ref={ref}>
        <div className="tl-launch"><span>Launch</span></div>
        <div className="tl-rail" aria-hidden="true">
          <motion.i className="tl-progress" style={{ scaleY: prog }} />
          <motion.b className="tl-head" style={{ top: head }} />
        </div>
        {projects.map((p, i) => <Item key={p.title} p={p} i={i} />)}
        <div className="tl-next">
          <span>Next mission</span>
          <Link to="/contact" className="btn btn-solid" data-hover>Your project? <ArrowUpRight size={16} /></Link>
          <a className="btn btn-ghost" href={P.github} target="_blank" rel="noreferrer">Explore GitHub <ArrowUpRight size={16} /></a>
        </div>
      </section>
    </>
  );
}
