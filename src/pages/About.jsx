import React from 'react';
import { MapPin, Code2, GraduationCap } from 'lucide-react';
import Tilt from '../components/Tilt.jsx';
import Reveal from '../components/Reveal.jsx';
import { principles } from '../data.js';

export default function About() {
  return (
    <>
      <section className="page-head">
        <Reveal><p className="tag">About</p></Reveal>
        <Reveal delay={0.05}><h1 className="h1">Thoughtful code.<br />Useful outcomes.</h1></Reveal>
      </section>

      <section className="about-grid">
        <Reveal className="about-copy">
          <p className="lead">I’m a software developer interested in the systems that make great products dependable.</p>
          <p>I work across APIs, databases, and frontend experiences. From a security scanner to a real-time satellite tracker, I enjoy turning complex requirements into software people can use. I value clean architecture, performance, and learning by shipping.</p>
          <ul className="facts">
            <li><MapPin size={15} /> Siliguri, India</li>
            <li><Code2 size={15} /> Python · Java · JavaScript</li>
            <li><GraduationCap size={15} /> BCA, expected June 2028</li>
          </ul>
        </Reveal>

        <Reveal delay={0.1} className="id-wrap">
          <Tilt max={16} className="id-card">
            <div className="id-top z1"><span>Crew manifest</span><span className="live-dot" /></div>
            <div className="id-mono z3">SP</div>
            <div className="id-name z2">Supratim Paul</div>
            <div className="id-role z2">Software developer</div>
            <dl className="id-grid z1">
              <div><dt>Base</dt><dd>Siliguri, IN</dd></div>
              <div><dt>Stack</dt><dd>Backend · Data</dd></div>
              <div><dt>Education</dt><dd>BCA · SIT</dd></div>
              <div><dt>Status</dt><dd>Open to work</dd></div>
            </dl>
            <div className="id-bars" aria-hidden="true">{Array.from({ length: 28 }, (_, i) => <i key={i} style={{ height: `${30 + ((i * 37) % 70)}%` }} />)}</div>
          </Tilt>
        </Reveal>
      </section>

      <section className="block">
        <Reveal><h2 className="h2">How I work</h2></Reveal>
        <div className="principles">
          {principles.map((p, i) => (
            <Reveal key={p.t} delay={i * 0.08}>
              <Tilt max={9} className="card principle">
                <span className="principle-n z2">{i + 1}</span>
                <b className="z2">{p.t}</b>
                <p className="z1">{p.d}</p>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
