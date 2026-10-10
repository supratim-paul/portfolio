import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { bus, subscribe, SECTORS, BODIES, sectorTarget } from './bus.js';
import * as S from './shaders.js';

THREE.ColorManagement.enabled = false;

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

function jitter(geo, amp, freq) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const d = 1 + amp * (Math.sin(x * freq * 1.3 + 1.1) * Math.sin(y * freq * 1.1 + 2.3) * Math.sin(z * freq * 1.7 + 0.7));
    p.setXYZ(i, x * d, y * d, z * d);
  }
  geo.computeVertexNormals();
  return geo;
}

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
    const SUN = new THREE.Vector3(-0.55, 0.35, 0.76).normalize();
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
    scene.add(warpLines);

    /* ---------- lights (for moons / rocks) ---------- */
    const sunLight = new THREE.DirectionalLight(0xfff0dc, 2.3);
    sunLight.position.copy(SUN).multiplyScalar(100);
    scene.add(sunLight, new THREE.AmbientLight(0x4a5590, 0.6));

    /* ---------- helpers for bodies ---------- */
    const atmosphere = (r, color, intensity, power = 3) => new THREE.Mesh(
      track(new THREE.SphereGeometry(r * 1.13, 64, 48)),
      shader(S.atmoVert, S.atmoFrag, {
        uColor: { value: new THREE.Color(color) }, uSun: { value: SUN },
        uPow: { value: power }, uInt: { value: intensity }
      }, { side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    const terrain = (def, p) => {
      const g = new THREE.Group();
      g.position.set(...def.pos);
      const mesh = new THREE.Mesh(
        track(new THREE.SphereGeometry(def.r, 96, 64)),
        shader(S.planetVert, S.terrainFrag, {
          uTime: U.time, uSun: { value: SUN },
          uSea: { value: new THREE.Color(p.sea) }, uShore: { value: new THREE.Color(p.shore) },
          uLandA: { value: new THREE.Color(p.landA) }, uLandB: { value: new THREE.Color(p.landB) },
          uIce: { value: new THREE.Color(p.ice) }, uAtmo: { value: new THREE.Color(p.atmo) },
          uSeaLevel: { value: p.seaLevel }, uCloud: { value: p.cloud }, uSeed: { value: p.seed }
        })
      );
      mesh.rotation.z = p.tilt || 0.2;
      g.add(mesh, atmosphere(def.r, p.atmo, p.atmoInt));
      scene.add(g);
      return { g, mesh };
    };
    const moonMat = track(new THREE.MeshStandardMaterial({ color: 0x9a9da8, roughness: 1, metalness: 0, flatShading: true }));
    const makeMoon = (parent, radius, orbit, tilt, speed) => {
      const pivot = new THREE.Group();
      pivot.rotation.x = tilt;
      const m = new THREE.Mesh(jitter(track(new THREE.IcosahedronGeometry(radius, 3)), 0.07, 2.4), moonMat);
      m.position.x = orbit;
      pivot.add(m);
      parent.add(pivot);
      return { pivot, m, speed };
    };

    /* ---------- Terra (home) ---------- */
    const terra = terrain(BODIES.terra, {
      sea: '#0b3a7a', shore: '#2b9bd1', landA: '#2f6b3a', landB: '#9a8456', ice: '#f3f8ff',
      atmo: '#5fb4ff', atmoInt: 0.75, seaLevel: 0.52, cloud: 0.85, seed: 3.7, tilt: 0.38
    });
    const moon = makeMoon(terra.g, 1.5, 19, 0.35, 0.1);

    /* ---------- Ember (about) ---------- */
    const ember = terrain(BODIES.ember, {
      sea: '#000000', shore: '#000000', landA: '#5c2214', landB: '#b8703a', ice: '#d9cfc6',
      atmo: '#ff8a4d', atmoInt: 0.7, seaLevel: -1.0, cloud: 0.18, seed: 11.2, tilt: 0.25
    });
    const emberMoon = makeMoon(ember.g, 0.9, 16, -0.3, 0.16);

    /* ---------- Aurelia (experience) ---------- */
    const giant = new THREE.Group();
    giant.position.set(...BODIES.giant.pos);
    const giantMesh = new THREE.Mesh(
      track(new THREE.SphereGeometry(BODIES.giant.r, 96, 64)),
      shader(S.planetVert, S.gasFrag, {
        uTime: U.time, uSun: { value: SUN },
        uA: { value: new THREE.Color('#e9cc9c') }, uB: { value: new THREE.Color('#a56f45') },
        uC: { value: new THREE.Color('#f6e8cc') }, uAtmo: { value: new THREE.Color('#ffd9a0') },
        uSeed: { value: 5.1 }
      })
    );
    const ringIn = BODIES.giant.r * 1.35, ringOut = BODIES.giant.r * 2.3;
    const ring = new THREE.Mesh(
      track(new THREE.RingGeometry(ringIn, ringOut, 160, 1)),
      shader(S.ringVert, S.ringFrag, {
        uIn: { value: ringIn }, uOut: { value: ringOut },
        uA: { value: new THREE.Color('#cdb48a') }, uB: { value: new THREE.Color('#f0e0bd') }
      }, { side: THREE.DoubleSide, transparent: true, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    const giantTilt = new THREE.Group();
    giantTilt.rotation.set(0.36, 0, -0.22);
    giantTilt.add(giantMesh, ring);
    giant.add(giantTilt, atmosphere(BODIES.giant.r, '#ffd9a0', 0.5));
    scene.add(giant);

    /* ---------- Helion (contact) ---------- */
    const sun = new THREE.Group();
    sun.position.set(...BODIES.sun.pos);
    const sunMesh = new THREE.Mesh(
      track(new THREE.SphereGeometry(BODIES.sun.r, 64, 48)),
      shader(S.planetVert, S.sunFrag, { uTime: U.time })
    );
    const glowU = { uTime: U.time, uVis: { value: 0 } };
    const glow = new THREE.Mesh(
      track(new THREE.PlaneGeometry(170, 170)),
      shader(S.glowVert, S.glowFrag, glowU, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    sun.add(sunMesh, glow);
    scene.add(sun);

    /* ---------- asteroid belt (projects) ---------- */
    const ROCKS = small ? 260 : 520;
    const rockGeo = jitter(track(new THREE.IcosahedronGeometry(1, 1)), 0.35, 1.9);
    const rocks = new THREE.InstancedMesh(
      rockGeo,
      track(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0.05, flatShading: true })),
      ROCKS
    );
    const rockData = [];
    const tmp = new THREE.Object3D();
    const tint = new THREE.Color();
    for (let i = 0; i < ROCKS; i++) {
      let x = 50 + (Math.random() + Math.random() + Math.random() - 1.5) * 90;
      let y = (Math.random() + Math.random() - 1) * 40;
      const z = -430 + (Math.random() - 0.5) * 300;
      if (Math.abs(x - 50) < 10 && Math.abs(y) < 9) x += x > 50 ? 12 : -12;
      const s = Math.pow(Math.random(), 2.6) * 3.2 + 0.25;
      rockData.push({
        x, y, z, s,
        sx: rnd(0.7, 1.3), sy: rnd(0.7, 1.3), sz: rnd(0.7, 1.3),
        rx: Math.random() * 6, ry: Math.random() * 6,
        vx: rnd(-0.25, 0.25), vy: rnd(-0.25, 0.25)
      });
      tint.setHSL(rnd(0.55, 0.68), rnd(0.05, 0.25), rnd(0.35, 0.6));
      rocks.setColorAt(i, tint);
    }
    rocks.frustumCulled = false;
    scene.add(rocks);
    const updateRocks = (dt) => {
      for (let i = 0; i < ROCKS; i++) {
        const r = rockData[i];
        r.rx += r.vx * dt; r.ry += r.vy * dt;
        tmp.position.set(r.x, r.y, r.z);
        tmp.rotation.set(r.rx, r.ry, 0);
        tmp.scale.set(r.s * r.sx, r.s * r.sy, r.s * r.sz);
        tmp.updateMatrix();
        rocks.setMatrixAt(i, tmp.matrix);
      }
      rocks.instanceMatrix.needsUpdate = true;
    };
    updateRocks(0);

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

      // bodies
      terra.mesh.rotation.y += dt * 0.045 * timeScale;
      ember.mesh.rotation.y += dt * 0.035 * timeScale;
      giantMesh.rotation.y += dt * 0.03 * timeScale;
      sunMesh.rotation.y += dt * 0.01 * timeScale;
      moon.pivot.rotation.y += dt * moon.speed * timeScale;
      emberMoon.pivot.rotation.y += dt * emberMoon.speed * timeScale;
      moon.m.rotation.y += dt * 0.2;
      glow.quaternion.copy(camera.quaternion);
      glowU.uVis.value = smooth(480, 250, camera.position.distanceTo(sun.position));

      // only draw what is near the camera's part of the journey
      const cz = camera.position.z;
      terra.g.visible = cz > -450;
      ember.g.visible = cz < -20 && cz > -420;
      rocks.visible = cz < -150 && cz > -760;
      giant.visible = cz < -250 && cz > -1000;
      sun.visible = cz < -650;
      if (rocks.visible) updateRocks(dt * timeScale);

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
      rocks.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="space" ref={host} aria-hidden="true" />;
}
