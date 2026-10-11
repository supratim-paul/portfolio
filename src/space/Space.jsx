import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { bus, subscribe, SECTORS, BODIES, sectorTarget } from './bus.js';
import * as S from './shaders.js';

THREE.ColorManagement.enabled = false;

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export default function Space() {
  const host = useRef(null);

  useEffect(() => {
    const el = host.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch (e) {
      el.classList.add('no-gl');
      return undefined;
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.setClearColor(0x03040b, 1);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 6000);
    const U = { time: { value: 0 } };
    const disposables = [];
    const track = (o) => { disposables.push(o); return o; };

    const shader = (vertexShader, fragmentShader, uniforms, opts = {}) =>
      track(new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, ...opts }));

    /* ---------- nebula backdrop ---------- */
    const nebU = {
      uTime: U.time,
      uC1: { value: new THREE.Color(SECTORS.home.pal[0]) },
      uC2: { value: new THREE.Color(SECTORS.home.pal[1]) },
      uC3: { value: new THREE.Color(SECTORS.home.pal[2]) },
      uInt: { value: SECTORS.home.pal[3] }
    };
    const nebula = new THREE.Mesh(
      track(new THREE.SphereGeometry(2500, 48, 32)),
      shader(S.nebulaVert, S.nebulaFrag, nebU, { side: THREE.BackSide, depthWrite: false, depthTest: false })
    );
    nebula.renderOrder = -100;
    nebula.frustumCulled = false;
    scene.add(nebula);
    const palTarget = {
      c1: new THREE.Color(), c2: new THREE.Color(), c3: new THREE.Color(), i: 0.9
    };

    /* ---------- stars ---------- */
    const starPalette = [0xffffff, 0xffffff, 0xcfe0ff, 0xaec8ff, 0xfff1d6, 0xffd6a8, 0xffb8b0];
    const makeStars = (n, rMin, rMax, sMin, sMax) => {
      const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
      const size = new Float32Array(n), phase = new Float32Array(n);
      const c = new THREE.Color();
      for (let i = 0; i < n; i++) {
        const r = rnd(rMin, rMax);
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
        pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
        pos[i * 3 + 2] = r * Math.cos(ph);
        c.set(starPalette[(Math.random() * starPalette.length) | 0]).multiplyScalar(rnd(0.55, 1));
        col.set([c.r, c.g, c.b], i * 3);
        size[i] = rnd(sMin, sMax);
        phase[i] = Math.random();
      }
      const g = track(new THREE.BufferGeometry());
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
      g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
      g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
      const m = shader(S.starVert, S.starFrag, { uTime: U.time, uScale: { value: dpr } }, {
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
      });
      const pts = new THREE.Points(g, m);
      pts.frustumCulled = false;
      return pts;
    };
    const starsFar = makeStars(small ? 3200 : 6000, 500, 1400, 1.2, 3.2);
    const starsBright = makeStars(small ? 60 : 140, 450, 1300, 4, 9);
    starsFar.renderOrder = -50;
    starsBright.renderOrder = -50;
    scene.add(starsFar, starsBright);

    /* ---------- near dust (parallax) ---------- */
    const dustN = small ? 380 : 700;
    const dPos = new Float32Array(dustN * 3), dSize = new Float32Array(dustN);
    for (let i = 0; i < dustN; i++) {
      dPos[i * 3] = rnd(0, 160); dPos[i * 3 + 1] = rnd(0, 160); dPos[i * 3 + 2] = rnd(0, 160);
      dSize[i] = rnd(1.2, 3.4);
    }
    const dGeo = track(new THREE.BufferGeometry());
    dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
    dGeo.setAttribute('aSize', new THREE.BufferAttribute(dSize, 1));
    const dust = new THREE.Points(dGeo, shader(S.dustVert, S.dustFrag, {
      uBox: { value: new THREE.Vector3(160, 160, 160) }, uScale: { value: dpr }
    }, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    dust.frustumCulled = false;
    dust.renderOrder = 5;
    scene.add(dust);

    /* ---------- warp streaks ---------- */
    const warpN = 420;
    const wPos = new Float32Array(warpN * 6), wEnd = new Float32Array(warpN * 2);
    for (let i = 0; i < warpN; i++) {
      const x = rnd(0, 140), y = rnd(0, 140), z = rnd(0, 260);
      wPos.set([x, y, z, x, y, z], i * 6);
      wEnd[i * 2] = 0; wEnd[i * 2 + 1] = 1;
    }
    const wGeo = track(new THREE.BufferGeometry());
    wGeo.setAttribute('position', new THREE.BufferAttribute(wPos, 3));
    wGeo.setAttribute('aEnd', new THREE.BufferAttribute(wEnd, 1));
    const warpU = { uBox: { value: new THREE.Vector3(140, 140, 260) }, uLen: { value: 0 }, uWarp: { value: 0 } };
    const warpLines = new THREE.LineSegments(wGeo, shader(S.warpVert, S.warpFrag, warpU, {
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    warpLines.frustumCulled = false;
    warpLines.renderOrder = 6;
    scene.add(warpLines);

    /* ---------- black holes ---------- */
    const makeHole = (def, hot, cool, tilt, roll) => {
      const u = {
        uTime: U.time, uHot: { value: new THREE.Color(hot) }, uCool: { value: new THREE.Color(cool) },
        uTilt: { value: tilt }, uRoll: { value: roll }, uVis: { value: 1 }
      };
      const mesh = new THREE.Mesh(
        track(new THREE.PlaneGeometry(def.r * 2, def.r * 2)),
        shader(S.bhVert, S.bhFrag, u, {
          transparent: true, depthWrite: false, depthTest: false,
          blending: THREE.CustomBlending,
          blendEquation: THREE.AddEquation,
          blendSrc: THREE.OneFactor,
          blendDst: THREE.OneMinusSrcAlphaFactor,
          blendSrcAlpha: THREE.OneFactor,
          blendDstAlpha: THREE.OneMinusSrcAlphaFactor
        })
      );
      mesh.position.set(...def.pos);
      mesh.renderOrder = 1;
      mesh.frustumCulled = false;
      scene.add(mesh);
      return mesh;
    };
    const holes = {
      home: makeHole(BODIES.home, '#bfe4ff', '#3a86e0', 0.24, -0.12),
      about: makeHole(BODIES.about, '#ffd09a', '#d8502a', 0.2, 0.18),
      experience: makeHole(BODIES.experience, '#ffd0f0', '#9a4ae0', 0.26, -0.2),
      contact: makeHole(BODIES.contact, '#fff2c8', '#e89a3a', 0.22, 0.1)
    };

    /* ---------- open star cluster (projects) ---------- */
    const clusterN = small ? 700 : 1500;
    const cPos = new Float32Array(clusterN * 3), cCol = new Float32Array(clusterN * 3);
    const cSize = new Float32Array(clusterN), cPh = new Float32Array(clusterN);
    {
      const c = new THREE.Color();
      for (let i = 0; i < clusterN; i++) {
        cPos[i * 3] = 50 + (Math.random() + Math.random() + Math.random() - 1.5) * 110;
        cPos[i * 3 + 1] = (Math.random() + Math.random() - 1) * 55;
        cPos[i * 3 + 2] = -430 + (Math.random() - 0.5) * 340;
        c.set(starPalette[(Math.random() * starPalette.length) | 0]).multiplyScalar(rnd(0.7, 1));
        cCol.set([c.r, c.g, c.b], i * 3);
        cSize[i] = Math.pow(Math.random(), 3) * 9 + 1.6;
        cPh[i] = Math.random();
      }
    }
    const cGeo = track(new THREE.BufferGeometry());
    cGeo.setAttribute('position', new THREE.BufferAttribute(cPos, 3));
    cGeo.setAttribute('aColor', new THREE.BufferAttribute(cCol, 3));
    cGeo.setAttribute('aSize', new THREE.BufferAttribute(cSize, 1));
    cGeo.setAttribute('aPhase', new THREE.BufferAttribute(cPh, 1));
    const cluster = new THREE.Points(cGeo, shader(S.starVert, S.starFrag, { uTime: U.time, uScale: { value: dpr } }, {
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    cluster.frustumCulled = false;
    cluster.renderOrder = 2;
    scene.add(cluster);

    /* ---------- shooting stars ---------- */
    const shooters = [];
    for (let i = 0; i < 3; i++) {
      const g = track(new THREE.BufferGeometry());
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      g.setAttribute('color', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 1, 1, 1]), 3));
      const m = track(new THREE.LineBasicMaterial({
        vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false
      }));
      const line = new THREE.Line(g, m);
      line.frustumCulled = false;
      line.renderOrder = 5;
      scene.add(line);
      shooters.push({ line, head: new THREE.Vector3(), vel: new THREE.Vector3(), life: 0, max: 1, len: 40 });
    }
    let nextShot = 3;
    const fwd = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
    const spawnShot = () => {
      const s = shooters.find((x) => x.life <= 0);
      if (!s) return;
      camera.getWorldDirection(fwd);
      right.crossVectors(fwd, camera.up).normalize();
      up.crossVectors(right, fwd).normalize();
      s.head.copy(camera.position)
        .addScaledVector(fwd, 420)
        .addScaledVector(right, rnd(-260, 120))
        .addScaledVector(up, rnd(40, 170));
      s.vel.copy(right).multiplyScalar(rnd(260, 380)).addScaledVector(up, -rnd(80, 170));
      s.max = rnd(0.7, 1.2); s.life = s.max; s.len = rnd(45, 90);
    };

    /* ---------- camera flight ---------- */
    const base = new THREE.Vector3(30, 18, 160);
    const baseLook = new THREE.Vector3(10, 0, 0);
    let flight = null;
    let warp = 0;
    let scrollS = 0;
    const mouseS = { x: 0, y: 0 };
    const isPortrait = () => window.innerWidth / window.innerHeight < 0.9;

    const startFlight = (key, duration) => {
      const t = sectorTarget(key, isPortrait());
      const to = new THREE.Vector3(...t.cam);
      const lt = new THREE.Vector3(...t.look);
      const from = camera.position.clone();
      const lf = baseLook.clone();
      const dist = from.distanceTo(to);
      const dur = reduce ? 0.01 : duration ?? clamp(0.9 + dist / 180, 1.4, 3.6);
      flight = { from, to, lf, lt, t0: performance.now() / 1000, dur, len: dist };
      scrollS = 0;
    };

    const unsub = subscribe((e) => {
      if (e.type === 'intro') startFlight(bus.sector, reduce ? 0.01 : 4.6);
      if (e.type === 'sector' && bus.introduced) startFlight(e.key);
      if (e.type === 'sector') {
        const p = SECTORS[e.key].pal;
        palTarget.c1.set(p[0]); palTarget.c2.set(p[1]); palTarget.c3.set(p[2]); palTarget.i = p[3];
      }
    });
    {
      const p = SECTORS[bus.sector].pal;
      palTarget.c1.set(p[0]); palTarget.c2.set(p[1]); palTarget.c3.set(p[2]); palTarget.i = p[3];
      nebU.uC1.value.copy(palTarget.c1); nebU.uC2.value.copy(palTarget.c2); nebU.uC3.value.copy(palTarget.c3);
      nebU.uInt.value = p[3];
      camera.position.copy(base);
      camera.lookAt(baseLook);
      if (bus.introduced) startFlight(bus.sector, 0.01);
    }

    /* ---------- events ---------- */
    const onMove = (e) => {
      bus.mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      bus.mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('resize', onResize);

    /* ---------- loop ---------- */
    const clock = new THREE.Clock();
    const look = new THREE.Vector3();
    const timeScale = reduce ? 0.25 : 1;
    let lastScrollCheck = 0;

    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const now = performance.now() / 1000;
      U.time.value += dt * timeScale;
      const t = U.time.value;

      // scroll progress
      lastScrollCheck += dt;
      if (lastScrollCheck > 0.05) {
        lastScrollCheck = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bus.scroll = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
      }

      // flight
      let gate = 1;
      let targetWarp = 0;
      if (flight) {
        const u = clamp((now - flight.t0) / flight.dur, 0, 1);
        const e = easeIO(u);
        base.lerpVectors(flight.from, flight.to, e);
        baseLook.lerpVectors(flight.lf, flight.lt, e);
        targetWarp = reduce ? 0 : Math.pow(Math.sin(Math.PI * u), 1.4) * clamp(flight.len / 120, 0, 1);
        gate = u >= 1 ? 1 : 0;
        if (u >= 1) flight = null;
      }
      warp += (targetWarp - warp) * (1 - Math.exp(-dt * 8));
      bus.warp = warp;

      // scroll-driven travel
      const sec = SECTORS[bus.sector];
      scrollS += ((bus.scroll * gate) - scrollS) * (1 - Math.exp(-dt * 4));
      const travel = scrollS * sec.travel;

      // mouse parallax
      mouseS.x += (bus.mouse.x - mouseS.x) * (1 - Math.exp(-dt * 3));
      mouseS.y += (bus.mouse.y - mouseS.y) * (1 - Math.exp(-dt * 3));
      const mx = reduce ? 0 : mouseS.x, my = reduce ? 0 : mouseS.y;

      camera.position.set(
        base.x + mx * 2.4 + Math.sin(t * 0.21) * 0.35,
        base.y - my * 1.5 + Math.cos(t * 0.17) * 0.25,
        base.z - travel
      );
      look.set(baseLook.x, baseLook.y, baseLook.z - travel);
      camera.lookAt(look);

      // backdrop follows camera
      nebula.position.copy(camera.position);
      nebula.rotation.y = mx * 0.04;
      nebula.rotation.x = my * 0.025;
      starsFar.position.copy(camera.position).multiplyScalar(0.9);
      starsBright.position.copy(starsFar.position);
      starsFar.rotation.y = t * 0.002;
      starsBright.rotation.y = t * 0.002;

      // palette tween per sector
      const k = 1 - Math.exp(-dt * 1.6);
      nebU.uC1.value.lerp(palTarget.c1, k);
      nebU.uC2.value.lerp(palTarget.c2, k);
      nebU.uC3.value.lerp(palTarget.c3, k);
      nebU.uInt.value += (palTarget.i - nebU.uInt.value) * k;

      // warp streaks
      warpU.uWarp.value = warp;
      warpU.uLen.value = warp * 70;
      warpLines.visible = warp > 0.01;

      // black holes: only draw those near this part of the journey
      const cz = camera.position.z;
      holes.home.visible = cz > -450;
      holes.about.visible = cz < -20 && cz > -420;
      cluster.visible = cz < -150 && cz > -760;
      holes.experience.visible = cz < -250 && cz > -1000;
      holes.contact.visible = cz < -650;
      for (const k in holes) if (holes[k].visible) holes[k].quaternion.copy(camera.quaternion);

      // shooting stars
      if (!reduce) {
        nextShot -= dt;
        if (nextShot <= 0) { spawnShot(); nextShot = rnd(3.5, 8); }
      }
      for (const s of shooters) {
        if (s.life <= 0) { s.line.material.opacity = 0; continue; }
        s.life -= dt;
        s.head.addScaledVector(s.vel, dt);
        const tail = s.vel.clone().normalize().multiplyScalar(-s.len).add(s.head);
        const a = s.line.geometry.attributes.position;
        a.setXYZ(0, tail.x, tail.y, tail.z);
        a.setXYZ(1, s.head.x, s.head.y, s.head.z);
        a.needsUpdate = true;
        s.line.material.opacity = Math.sin(clamp(s.life / s.max, 0, 1) * Math.PI);
      }

      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      unsub();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', onResize);
      disposables.forEach((d) => d.dispose && d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="space" ref={host} aria-hidden="true" />;
}
