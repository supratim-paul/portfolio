import React, { useState } from 'react';
import { ArrowUpRight, Github, Linkedin, Phone } from 'lucide-react';
import Magnetic from '../components/Magnetic.jsx';
import Reveal from '../components/Reveal.jsx';
import { P } from '../data.js';

export default function Contact() {
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const send = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Hello from ${name || 'your portfolio'}`);
    const body = encodeURIComponent(`${msg}\n\n— ${name}`);
    window.location.href = `mailto:${P.email}?subject=${subject}&body=${body}`;
  };
  return (
    <>
      <section className="page-head contact-head">
        <Reveal><p className="tag">Contact</p></Reveal>
        <Reveal delay={0.05}><h1 className="h1">Let’s make<br />it work.</h1></Reveal>
        <Reveal delay={0.1}><p className="sub">Open to internships, collaborations, and conversations about software engineering. I’d be happy to hear what you’re building.</p></Reveal>
      </section>

      <section className="contact-grid">
        <Reveal className="contact-left">
          <Magnetic><a className="email-btn" href={`mailto:${P.email}`} data-hover>{P.email} <ArrowUpRight size={18} /></a></Magnetic>
          <div className="socials">
            <a href={P.github} target="_blank" rel="noreferrer"><Github size={16} /> GitHub</a>
            <a href={P.linkedin} target="_blank" rel="noreferrer"><Linkedin size={16} /> LinkedIn</a>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <form className="card transmit" onSubmit={send}>
            <label>Your name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" autoComplete="name" /></label>
            <label>Message<textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={5} placeholder="Tell me about the project…" required /></label>
            <Magnetic strength={0.2}><button className="btn btn-solid" type="submit">Transmit <ArrowUpRight size={16} /></button></Magnetic>
            <p className="form-note">Opens your email app with the message ready to send.</p>
          </form>
        </Reveal>
      </section>
    </>
  );
}
