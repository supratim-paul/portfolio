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

/* ---------- planets ---------- */
export const planetVert = /* glsl */ `
varying vec3 vObj;
varying vec3 vWN;
varying vec3 vWP;
void main(){
  vObj = position;
  vWN = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWP = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

export const terrainFrag = /* glsl */ `
uniform float uTime;
uniform vec3 uSun;
uniform vec3 uSea;
uniform vec3 uShore;
uniform vec3 uLandA;
uniform vec3 uLandB;
uniform vec3 uIce;
uniform vec3 uAtmo;
uniform float uSeaLevel;
uniform float uCloud;
uniform float uSeed;
varying vec3 vObj;
varying vec3 vWN;
varying vec3 vWP;
${NOISE}
void main(){
  vec3 N = normalize(vWN);
  vec3 V = normalize(cameraPosition - vWP);
  vec3 p = normalize(vObj);
  float h = fbm(p * 2.4 + uSeed);
  float lat = abs(p.y);
  vec3 col;
  float spec = 0.0;
  if (h < uSeaLevel) {
    float d = smoothstep(uSeaLevel - 0.16, uSeaLevel, h);
    col = mix(uSea * 0.6, uShore, d * d);
    spec = 1.0;
  } else {
    float e = smoothstep(uSeaLevel, uSeaLevel + 0.22, h);
    col = mix(uLandA, uLandB, e);
    col *= 0.85 + 0.3 * fbm(p * 14.0 + uSeed);
  }
  float ice = smoothstep(0.86, 0.96, lat + (h - 0.5) * 0.25);
  col = mix(col, uIce, ice);
  float c = fbm(p * 3.6 + vec3(uTime * 0.012, 0.0, uTime * 0.008) + uSeed * 2.0);
  c = smoothstep(0.55, 0.8, c) * uCloud;
  col = mix(col, vec3(1.0), c);
  float ndl = dot(N, uSun);
  float diff = smoothstep(-0.08, 0.6, ndl);
  vec3 H = normalize(uSun + V);
  float s = pow(max(dot(N, H), 0.0), 70.0) * spec * (1.0 - c);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  vec3 lit = col * (0.035 + 0.965 * diff) + vec3(s * 0.55);
  lit += uAtmo * fres * (0.12 + 0.88 * clamp(ndl + 0.3, 0.0, 1.0));
  gl_FragColor = vec4(lit, 1.0);
}`;

export const gasFrag = /* glsl */ `
uniform float uTime;
uniform vec3 uSun;
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;
uniform vec3 uAtmo;
uniform float uSeed;
varying vec3 vObj;
varying vec3 vWN;
varying vec3 vWP;
${NOISE}
void main(){
  vec3 N = normalize(vWN);
  vec3 V = normalize(cameraPosition - vWP);
  vec3 p = normalize(vObj);
  float lat = p.y;
  float warp = fbm(vec3(p.x * 3.0, p.y * 7.0, p.z * 3.0) + uTime * 0.02 + uSeed) * 0.35;
  float band = 0.5 + 0.5 * sin((lat + warp) * 24.0);
  float band2 = fbm(vec3(0.0, (lat + warp) * 13.0, 0.0) + uSeed);
  vec3 col = mix(uA, uB, band);
  col = mix(col, uC, band2 * 0.65);
  col *= 0.9 + 0.2 * fbm(p * 18.0);
  float ang = atan(p.z, p.x);
  float spot = smoothstep(0.17, 0.0, length(vec2(ang - 0.9, (lat + 0.28) * 2.2)));
  col = mix(col, vec3(0.78, 0.38, 0.26), spot * 0.85);
  float ndl = dot(N, uSun);
  float diff = smoothstep(-0.1, 0.65, ndl);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  vec3 lit = col * (0.04 + 0.96 * diff);
  lit += uAtmo * fres * (0.1 + 0.9 * clamp(ndl + 0.3, 0.0, 1.0)) * 0.9;
  gl_FragColor = vec4(lit, 1.0);
}`;

export const atmoVert = /* glsl */ `
varying vec3 vN;
varying vec3 vWN;
void main(){
  vN = normalize(normalMatrix * normal);
  vWN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
export const atmoFrag = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uSun;
uniform float uPow;
uniform float uInt;
varying vec3 vN;
varying vec3 vWN;
void main(){
  float i = pow(max(0.0, 0.68 - dot(vN, vec3(0.0, 0.0, 1.0))), uPow);
  float lit = clamp(dot(normalize(vWN), uSun) + 0.45, 0.0, 1.0);
  float k = i * uInt * (0.25 + 0.75 * lit);
  gl_FragColor = vec4(uColor * k, k);
}`;

export const ringVert = /* glsl */ `
varying vec2 vP;
void main(){
  vP = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
export const ringFrag = /* glsl */ `
uniform float uIn;
uniform float uOut;
uniform vec3 uA;
uniform vec3 uB;
varying vec2 vP;
${NOISE}
void main(){
  float r = (length(vP) - uIn) / (uOut - uIn);
  float edge = smoothstep(0.0, 0.05, r) * smoothstep(1.0, 0.9, r);
  float bands = 0.5 + 0.5 * sin(r * 70.0 + sin(r * 17.0) * 2.0);
  float grain = vnoise(vec3(r * 90.0, 0.0, 1.0));
  float gap = smoothstep(0.0, 0.02, abs(r - 0.64) - 0.025);
  float a = edge * (0.25 + 0.55 * bands + 0.2 * grain) * gap;
  vec3 col = mix(uA, uB, bands * 0.8 + grain * 0.2);
  gl_FragColor = vec4(col, a * 0.85);
}`;

/* ---------- sun ---------- */
export const sunFrag = /* glsl */ `
uniform float uTime;
varying vec3 vObj;
varying vec3 vWN;
varying vec3 vWP;
${NOISE}
void main(){
  vec3 N = normalize(vWN);
  vec3 V = normalize(cameraPosition - vWP);
  vec3 p = normalize(vObj);
  float n = fbm(p * 3.0 + vec3(0.0, 0.0, uTime * 0.08));
  float n2 = fbm(p * 9.0 - vec3(uTime * 0.05));
  vec3 col = mix(vec3(1.0, 0.32, 0.04), vec3(1.0, 0.86, 0.45), n);
  col += n2 * 0.35;
  float mu = max(dot(N, V), 0.0);
  col *= mix(0.5, 1.2, pow(mu, 0.5));
  gl_FragColor = vec4(col, 1.0);
}`;
export const glowVert = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
export const glowFrag = /* glsl */ `
uniform float uTime;
uniform float uVis;
varying vec2 vUv;
void main(){
  vec2 p = (vUv - 0.5) * 2.0;
  float d = length(p);
  float ang = atan(p.y, p.x);
  float core = exp(-d * 5.0);
  float halo = pow(max(1.0 - d, 0.0), 2.5);
  float rays = (0.55 + 0.45 * sin(ang * 9.0 + uTime * 0.15)) * (0.6 + 0.4 * sin(ang * 23.0 - uTime * 0.1));
  float corona = pow(max(1.0 - d, 0.0), 4.0) * rays;
  vec3 col = vec3(1.0, 0.62, 0.25) * (halo * 0.55 + corona * 1.1) + vec3(1.0, 0.9, 0.7) * core * 1.4;
  col *= smoothstep(1.0, 0.82, d) * uVis;
  gl_FragColor = vec4(col, 1.0);
}`;
