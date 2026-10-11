import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import Magnetic from '../components/Magnetic.jsx';
import Tilt from '../components/Tilt.jsx';
import Word from '../components/Word.jsx';
import Orb from '../components/Orb.jsx';
import Reveal from '../components/Reveal.jsx';
import { projects } from '../data.js';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } } };
const rise = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.2, 0.7, 0.2, 1] } } };

const destinations = [
  { to: '/about', name: 'About', line: 'The person behind the commits.', sector: 'Cinder', orb: 'ember' },
  { to: '/projects', name: 'Projects', line: 'Four missions, flown end to end.', sector: 'Starfield', orb: 'belt' },
  { to: '/experience', name: 'Experience', line: 'Work, study, and the toolkit.', sector: 'Quasar', orb: 'giant' },
  { to: '/contact', name: 'Contact', line: 'Open a channel.', sector: 'Omega', orb: 'sun' }
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <motion.div className="hero-copy" variants={stagger} initial="hidden" animate="show">
          <motion.div variants={rise} className="kicker"><span className="live-dot" /> Software developer · Siliguri, India</motion.div>
          <motion.h1 variants={rise} className="name" aria-label="Supratim Paul">
            <Word text="Supratim" /><br /><Word text="Paul" /><i>.</i>
          </motion.h1>
          <motion.p variants={rise} className="lede">
            I design and build software that feels intuitive and works reliably — backend systems, data layers, and products that stay fast as they grow.
          </motion.p>
          <motion.div variants={rise} className="cta-row">
            <Magnetic><Link to="/contact" className="btn btn-solid">Contact <ArrowUpRight size={16} /></Link></Magnetic>
            <Magnetic><Link to="/projects" className="btn btn-ghost">View projects <ArrowDownRight size={16} /></Link></Magnetic>
          </motion.div>
          <motion.dl variants={rise} className="status">
            <div><dt>Availability</dt><dd><i className="live-dot" /> Open to opportunities</dd></div>
            <div><dt>Focus</dt><dd>Backend · Data · Full stack</dd></div>
          </motion.dl>
        </motion.div>
        <div className="hero-foot" aria-hidden="true">
          <span>Scroll to explore</span><span className="scroll-track"><i /></span><span>26°43′N / 88°25′E</span>
        </div>
      </section>

      <section className="ticker" aria-label="Selected projects">
        <div className="ticker-track">
          {[...projects, ...projects, ...projects].map((p, i) => (
            <Link to="/projects" key={p.title + i}><span>{p.title}</span><i>✦</i></Link>
          ))}
        </div>
      </section>

      <section className="block">
        <Reveal><h2 className="h2">Choose a destination</h2></Reveal>
        <div className="dest-grid">
          {destinations.map((d, i) => (
            <Reveal key={d.to} delay={i * 0.08}>
              <Tilt max={12} className="dest">
                <Link to={d.to} className="dest-link" data-hover>
                  <Orb kind={d.orb} size={70} className="z3" />
                  <span className="dest-sector z2">{d.sector}</span>
                  <b className="dest-name z2">{d.name}</b>
                  <span className="dest-line z1">{d.line}</span>
                  <ArrowUpRight className="dest-arrow z2" size={18} />
                </Link>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
