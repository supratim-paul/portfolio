import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const LINKS = [['/', 'Home'], ['/about', 'About'], ['/projects', 'Projects'], ['/experience', 'Experience'], ['/contact', 'Contact']];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  return (
    <header className="nav">
      <Link className="wordmark" to="/" aria-label="Home">SP<span>.</span></Link>
      <nav className={`nav-links ${open ? 'opened' : ''}`}>
        {LINKS.map(([to, label]) => (
          <NavLink key={to} to={to} end={to === '/'} className="nav-link">
            {({ isActive }) => (
              <>
                {isActive && <motion.i layoutId="nav-pill" className="nav-pill" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                <span className="roll"><b>{label}</b><b aria-hidden="true">{label}</b></span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
        {open ? <X /> : <Menu />}
      </button>
    </header>
  );
}
