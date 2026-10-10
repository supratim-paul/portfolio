import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Space from './space/Space.jsx';
import { bus, introduce, sectorFor, setSector } from './space/bus.js';
import Nav from './components/Nav.jsx';
import HUD from './components/HUD.jsx';
import Cursor from './components/Cursor.jsx';
import Loader from './components/Loader.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Projects from './pages/Projects.jsx';
import Experience from './pages/Experience.jsx';
import Contact from './pages/Contact.jsx';

const TITLES = { '/': 'Supratim Paul — Software Developer', '/about': 'About — Supratim Paul', '/projects': 'Projects — Supratim Paul', '/experience': 'Experience — Supratim Paul', '/contact': 'Contact — Supratim Paul' };

function Shell() {
  const loc = useLocation();
  const seen = (() => { try { return sessionStorage.getItem('sp-launched') === '1'; } catch { return false; } })();
  const [loading, setLoading] = useState(!seen);

  // Route → sector. Starts the camera flight in the WebGL scene.
  useEffect(() => {
    setSector(sectorFor(loc.pathname));
    document.title = TITLES[loc.pathname] || TITLES['/'];
  }, [loc.pathname]);

  useEffect(() => { if (seen) introduce(); }, [seen]);

  const done = useCallback(() => {
    try { sessionStorage.setItem('sp-launched', '1'); } catch { /* ignore */ }
    setLoading(false);
    introduce();
  }, []);

  return (
    <div className="shell">
      <Space />
      <div className="vignette" aria-hidden="true" />
      <AnimatePresence>{loading && <Loader onDone={done} />}</AnimatePresence>
      <Cursor />
      <Nav />
      <HUD />
      <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
        <motion.main
          key={loc.pathname}
          className="page"
          initial={{ opacity: 0, scale: 0.97, filter: 'blur(10px)' }}
          animate={{ opacity: loading ? 0 : 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.8, delay: bus.introduced ? 0.45 : 1.2, ease: [0.2, 0.7, 0.2, 1] } }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(10px)', transition: { duration: 0.35 } }}
        >
          <Routes location={loc}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/experience" element={<Experience />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<Home />} />
          </Routes>
          <footer className="footer">
            <Link className="wordmark" to="/">SP<span>.</span></Link>
            <span>Designed &amp; built by Supratim Paul</span>
            <span>© {new Date().getFullYear()}</span>
            <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Back to top ↑</a>
          </footer>
        </motion.main>
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return <BrowserRouter><Shell /></BrowserRouter>;
}
