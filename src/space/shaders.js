export const NOISE = /* glsl */ `
float hash31(vec3 p){
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float vnoise(vec3 x){
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash31(i + vec3(0,0,0)), hash31(i + vec3(1,0,0)), f.x),
        mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x),
        mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y),
    f.z);
}
float fbm(vec3 p){
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * vnoise(p);
    p = p * 2.02 + vec3(1.7, 9.2, 3.1);
    a *= 0.5;
  }
  return v;
}
`;

/* ---------- nebula backdrop ---------- */
export const nebulaVert = /* glsl */ `
varying vec3 vDir;
void main(){
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const nebulaFrag = /* glsl */ `
uniform float uTime;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
uniform float uInt;
varying vec3 vDir;
${NOISE}
void main(){
  vec3 d = normalize(vDir);
  vec3 q = d * 1.8 + vec3(uTime * 0.006, uTime * 0.003, 0.0);
  float n1 = fbm(q);
  float n2 = fbm(q * 2.3 + n1 * 1.8 + vec3(7.0));
  vec3 axis = normalize(vec3(0.35, 0.9, -0.25));
  float b = dot(d, axis);
  float band = exp(-b * b * 9.0);
  float cloud = smoothstep(0.36, 0.85, n1);
  vec3 col = mix(uC1, uC2, n2) * cloud * (0.22 + band * 1.1);
  col += uC3 * pow(smoothstep(0.45, 1.0, n2), 3.0) * band * 1.25;
  float dust = smoothstep(0.52, 0.78, fbm(q * 4.5 + 3.0));
  col *= 1.0 - dust * band * 0.7;
  col *= uInt;
  col += vec3(0.008, 0.010, 0.022);
  gl_FragColor = vec4(col, 1.0);
}`;

/* ---------- far stars ---------- */
export const starVert = /* glsl */ `
attribute float aSize;
attribute vec3 aColor;
attribute float aPhase;
uniform float uTime;
uniform float uScale;
varying vec3 vColor;
varying float vTw;
void main(){
  vColor = aColor;
  vTw = 0.72 + 0.28 * sin(uTime * (0.6 + aPhase * 0.5) + aPhase * 40.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uScale;
}`;
export const starFrag = /* glsl */ `
varying vec3 vColor;
varying float vTw;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = pow(smoothstep(0.5, 0.0, d), 1.7);
  gl_FragColor = vec4(vColor * vTw, a * vTw);
}`;

/* ---------- near dust that wraps around the camera (gives parallax) ---------- */
export const dustVert = /* glsl */ `
attribute float aSize;
uniform vec3 uBox;
uniform float uScale;
varying float vA;
void main(){
  vec3 rel = mod(position - cameraPosition + uBox * 0.5, uBox) - uBox * 0.5;
  vec4 mv = viewMatrix * vec4(cameraPosition + rel, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uScale * (26.0 / max(-mv.z, 1.0));
  vA = smoothstep(uBox.z * 0.5, uBox.z * 0.12, length(rel));
}`;
export const dustFrag = /* glsl */ `
varying float vA;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vec3(0.75, 0.82, 1.0) * a * vA * 0.7, a * vA);
}`;

/* ---------- hyperspace streaks ---------- */
export const warpVert = /* glsl */ `
attribute float aEnd;
uniform vec3 uBox;
uniform float uLen;
uniform float uWarp;
varying float vA;
void main(){
  vec3 rel = mod(position - cameraPosition + uBox * 0.5, uBox) - uBox * 0.5;
  vec4 mv = viewMatrix * vec4(cameraPosition + rel, 1.0);
  mv.z -= aEnd * uLen;
  gl_Position = projectionMatrix * mv;
  vA = uWarp * (1.0 - aEnd) * smoothstep(uBox.z * 0.5, uBox.z * 0.1, length(rel));
}`;
export const warpFrag = /* glsl */ `
varying float vA;
void main(){
  gl_FragColor = vec4(vec3(0.7, 0.85, 1.0) * vA, vA);
}`;

/* ---------- black hole (billboard: horizon, lensed halo, tilted accretion disk) ---------- */
export const bhVert = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const bhFrag = /* glsl */ `
uniform float uTime;
uniform vec3 uHot;
uniform vec3 uCool;
uniform float uTilt;
uniform float uRoll;
uniform float uVis;
varying vec2 vUv;
${NOISE}

vec3 diskColor(float t){
  // t: 0 = outer / cool, 1 = inner / hot
  vec3 c = mix(uCool * 0.35, uCool, smoothstep(0.0, 0.5, t));
  c = mix(c, uHot, smoothstep(0.35, 0.9, t));
  return mix(c, vec3(1.0), smoothstep(0.82, 1.0, t) * 0.6);
}

float diskTex(float r, float a, float seed){
  float aa = a + uTime * (0.9 / (r * 6.0 + 0.5)) + seed;
  vec3 q = vec3(cos(aa) * r * 9.0, sin(aa) * r * 9.0, r * 22.0);
  float n = fbm(q);
  float streak = 0.5 + 0.5 * sin(r * 90.0 + n * 6.0);
  return 0.35 + 0.65 * mix(n, streak, 0.45);
}

void main(){
  vec2 p = (vUv - 0.5) * 2.0;
  float cr = cos(uRoll), sr = sin(uRoll);
  p = vec2(cr * p.x + sr * p.y, -sr * p.x + cr * p.y);

  float rh = 0.15;           // event horizon
  float d = length(p);
  float hole = smoothstep(rh, rh * 0.94, d);

  // lensed halo: back of the disk bent over and under the hole
  float vert = smoothstep(0.0, 0.85, abs(p.y) / max(d, 0.001));
  float ang = atan(p.y, p.x);
  float rl = d;
  float haloBand = smoothstep(rh * 1.02, rh * 1.5, rl) * smoothstep(0.62, rh * 1.7, rl);
  float haloT = clamp(1.0 - (rl - rh) / 0.5, 0.0, 1.0);
  float halo = haloBand * (0.25 + 0.75 * vert) * diskTex(rl, ang, 3.0) * pow(haloT, 1.4);
  vec3 col = diskColor(haloT) * halo * 1.35;

  // photon ring
  float ring = exp(-pow((d - rh * 1.18) / 0.012, 2.0));
  col += mix(uHot, vec3(1.0), 0.55) * ring * 1.6;

  // tilted accretion disk
  float s = max(uTilt, 0.05);
  vec2 dp = vec2(p.x, p.y / s);
  float r = length(dp);
  float rin = 0.2, rout = 0.95;
  float dm = smoothstep(rin, rin + 0.04, r) * smoothstep(rout, rout - 0.35, r);
  float t = clamp(1.0 - (r - rin) / (rout - rin), 0.0, 1.0);
  float da = atan(dp.y, dp.x);
  float tex = diskTex(r * 0.8, da, 0.0);
  float doppler = 1.0 + 0.7 * (dp.x / max(r, 0.001));
  vec3 dcol = diskColor(pow(t, 0.8)) * tex * doppler * pow(t, 0.55) * 2.1;
  float front = step(p.y, 0.0);           // near half draws over the hole
  float backMask = (1.0 - hole);          // far half hidden behind it
  col += dcol * dm * mix(backMask, 1.0, front);

  // soft outer glow
  col += uCool * 0.07 * smoothstep(1.0, 0.1, d) * smoothstep(rh, rh * 1.6, d);

  col *= smoothstep(1.0, 0.82, d) * uVis;
  gl_FragColor = vec4(col, hole * uVis);
}`;
